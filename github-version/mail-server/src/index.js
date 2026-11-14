import express from 'express';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { initDb, query, pool } from './db.js';
import { publishEmailEvent } from './redis.js';
import { deleteObject, presignGetUrl } from './storage.js';
import {
  ADMIN_EMAILS,
  AI_AGENT_URL,
  APP_DOMAINS,
  CORS_ORIGINS,
  DEFAULT_MAILBOX_NAME,
  IS_LOCAL_ENV,
  LOCAL_SERVICE_TOKEN,
  NODE_ENV,
  TEAM_DOMAIN,
  POLICY_AUD,
  REPLIT_WEB_ENABLED,
  WEBHOOK_SECRET,
  assertProductionConfig,
} from './config.js';
import { CLIENT_STATUSES, TASK_PRIORITIES, TASK_STATUSES, TASK_TYPES, USAGE_STATUSES, isTerminalTaskStatus } from './lib/domain.js';
import { createInboundSmtpServer } from './lib/inbound-smtp.js';
import { sendEmail } from './lib/outbound-smtp.js';
import { upsertInboundEmail } from './lib/inbound-email.js';
import { registerCompatRoutes } from './routes/compat.js';
import { registerCampaignDemoRoutes } from './routes/campaign-demo.js';
import {
  assertPlainObject,
  getBoundedPagination,
  readEmail,
  readEnum,
  readInt,
  readNullableUuid,
  readNumber,
  readSettings,
  readString,
  readTags,
  sendError,
  wrapAsyncRoutes,
} from './lib/http.js';
import { serializeFolder, serializeMailbox } from './lib/ui-compat.js';
import { createAdminAuth, requireAdminRole } from './lib/admin-auth.js';
import { createSessionStore, registerProductionWeb } from './lib/production-web.js';

const app = express();

wrapAsyncRoutes(app);
assertProductionConfig();

if (REPLIT_WEB_ENABLED) {
  registerProductionWeb(app, {
    store: createSessionStore(query),
    clientDir: fileURLToPath(new URL('../../client/build-replit/client/', import.meta.url)),
    password: process.env.INBOX_ADMIN_PASSWORD,
    sessionSecret: process.env.SESSION_SECRET,
  });
}
if (!REPLIT_WEB_ENABLED) app.use(cors({
  origin(origin, callback) {
    if (!origin || CORS_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error('CORS origin not allowed'));
  },
}));
app.use(express.json({ limit: '50mb' }));

function requireLocalToken(req, res, next) {
  if (req.path === '/health' || req.path === '/ready') return next();
  if (!LOCAL_SERVICE_TOKEN && IS_LOCAL_ENV) return next();

  const auth = req.get('authorization') || '';
  const expected = `Bearer ${LOCAL_SERVICE_TOKEN}`;
  if (auth !== expected) return sendError(res, 401, 'Missing or invalid local service token');
  return next();
}

async function resolveMailboxId(mailboxId) {
  if (mailboxId === 'me') {
    const { rows } = await query(
      'SELECT id FROM mailboxes WHERE is_active = true ORDER BY created_at ASC LIMIT 1'
    );
    return rows[0]?.id || null;
  }

  const { rows } = await query(
    'SELECT id FROM mailboxes WHERE is_active = true AND (id::text = $1 OR LOWER(email) = LOWER($1)) LIMIT 1',
    [mailboxId],
  );
  return rows[0]?.id || null;
}

async function ensureMailbox(mailboxId) {
  return Boolean(await resolveMailboxId(mailboxId));
}

app.param('mailboxId', async (req, res, next, mailboxId) => {
  try {
    const id = await resolveMailboxId(mailboxId);
    if (!id) return sendError(res, 404, 'Mailbox not found');
    req.params.mailboxId = id;
    next();
  } catch (e) {
    next(e);
  }
});

function taskToApi(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    title: row.title,
    type: row.type,
    status: row.status,
    priority: row.priority,
    owner: row.owner || '',
    dueDate: row.due_date ? String(row.due_date).slice(0, 10) : '',
    completion: row.completion,
    mailboxId: row.mailbox_id || '',
    requestEmailId: row.request_email_id || '',
    issue: row.issue || '',
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function clientToApi(row) {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    email: row.email || '',
    owner: row.owner || '',
    status: row.status,
    tags: Array.isArray(row.tags) ? row.tags : [],
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function taskEventToApi(row) {
  return {
    id: row.id,
    taskId: row.task_id,
    eventType: row.event_type,
    fromStatus: row.from_status || '',
    toStatus: row.to_status || '',
    actorEmail: row.actor_email,
    actorRole: row.actor_role,
    metadata: row.metadata || {},
    createdAt: row.created_at,
  };
}

function auditToApi(row) {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    actorEmail: row.actor_email,
    actorRole: row.actor_role,
    before: row.before_json || null,
    after: row.after_json || null,
    createdAt: row.created_at,
  };
}

function parseClientPayload(rawBody) {
  const body = assertPlainObject(rawBody);
  return {
    name: readString(body, 'name', { required: true, max: 160 }),
    company: readString(body, 'company', { required: true, max: 160 }),
    email: readEmail(body, 'email', { defaultValue: '', max: 320 }),
    owner: readString(body, 'owner', { defaultValue: '', max: 160 }),
    status: readEnum(body, 'status', CLIENT_STATUSES, 'active'),
    tags: readTags(body),
    notes: readString(body, 'notes', { defaultValue: '', max: 5000 }),
  };
}

function parseTaskPayload(rawBody) {
  const body = assertPlainObject(rawBody);
  const status = readEnum(body, 'status', TASK_STATUSES, 'new');
  return {
    clientId: readNullableUuid({ clientId: readString(body, 'clientId', { required: true, max: 80 }) }, 'clientId'),
    title: readString(body, 'title', { required: true, max: 240 }),
    type: readEnum(body, 'type', TASK_TYPES, 'task'),
    status,
    priority: readEnum(body, 'priority', TASK_PRIORITIES, 'normal'),
    owner: readString(body, 'owner', { defaultValue: '', max: 160 }),
    dueDate: readString(body, 'dueDate', { defaultValue: '', max: 10 }),
    completion: isTerminalTaskStatus(status) ? 100 : readInt(body, 'completion', { defaultValue: 0, min: 0, max: 100 }),
    mailboxId: readNullableUuid(body, 'mailboxId'),
    requestEmailId: readNullableUuid(body, 'requestEmailId'),
    issue: readString(body, 'issue', { defaultValue: '', max: 5000 }),
    notes: readString(body, 'notes', { defaultValue: '', max: 5000 }),
  };
}

function parseMailboxPayload(rawBody) {
  const body = assertPlainObject(rawBody);
  return {
    email: readEmail(body, 'email', { required: true, max: 320 }),
    name: readString(body, 'name', { required: true, max: 160 }),
    settings: readSettings(body),
  };
}

function parseAgentUsagePayload(rawBody) {
  const body = assertPlainObject(rawBody);
  return {
    agentId: readString(body, 'agentId', { required: true, max: 160 }),
    operation: readString(body, 'operation', { defaultValue: 'other', max: 80 }),
    model: readString(body, 'model', { defaultValue: '', max: 160 }),
    inputTokens: readInt(body, 'inputTokens', { defaultValue: 0, min: 0 }),
    outputTokens: readInt(body, 'outputTokens', { defaultValue: 0, min: 0 }),
    costUsd: readNumber(body, 'costUsd', { defaultValue: 0, min: 0 }),
    latencyMs: body.latencyMs === undefined || body.latencyMs === null ? null : readInt(body, 'latencyMs', { min: 0 }),
    status: readEnum(body, 'status', USAGE_STATUSES, 'ok'),
    errorCode: readString(body, 'errorCode', { defaultValue: '', max: 160 }),
  };
}

async function audit(entityType, entityId, action, actor, before, after) {
  await query(
    `INSERT INTO admin_audit_logs (entity_type, entity_id, action, actor_email, actor_role, before_json, after_json)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [entityType, entityId, action, actor.email, actor.role, before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null]
  );
}

if (!REPLIT_WEB_ENABLED) {
  app.use(requireLocalToken);
  app.use(createAdminAuth({
    isLocal: IS_LOCAL_ENV,
    teamDomain: TEAM_DOMAIN,
    policyAud: POLICY_AUD,
    adminEmails: ADMIN_EMAILS,
  }));
}
// Also cover admin compatibility/report routes registered below.
app.use('/api/v1/admin', (req, res, next) => {
  if (requireAdminRole(req, res, ['admin', 'manager', 'operator', 'viewer'])) next();
});
registerCompatRoutes(app, { query, uuidv4, sendEmail, sendError });
registerCampaignDemoRoutes(app, { query, pool });

// ---------- Config ----------
app.get('/api/v1/config', async (req, res) => {
  res.json({ success: true, data: { domains: APP_DOMAINS, emailAddresses: [] } });
});

// ---------- Admin ----------
app.get('/api/v1/admin/overview', async (req, res) => {
  const actor = requireAdminRole(req, res, ['admin', 'manager', 'operator', 'viewer']);
  if (!actor) return;

  const [
    { rows: clientsRows },
    { rows: tasksRows },
    { rows: mailboxRows },
    { rows: emailTotalsRows },
    { rows: emailsByDayRows },
    { rows: usageRows },
    { rows: aiJobRows },
  ] = await Promise.all([
    query('SELECT * FROM admin_clients ORDER BY updated_at DESC'),
    query('SELECT * FROM admin_tasks ORDER BY updated_at DESC'),
    query('SELECT id, email, name FROM mailboxes WHERE is_active = true ORDER BY email'),
    query(`
      SELECT
        COUNT(*)::int AS total_emails,
        COUNT(*) FILTER (WHERE is_read = false)::int AS unread_emails,
        COUNT(*) FILTER (WHERE is_draft = true)::int AS draft_emails,
        COUNT(DISTINCT COALESCE(thread_id, id::text))::int AS threads,
        (SELECT COUNT(*)::int FROM attachments) AS attachments
      FROM emails
    `),
    query(`
      SELECT received_at::date::text AS date, COUNT(*)::int AS count
      FROM emails
      WHERE received_at >= now() - interval '29 days'
      GROUP BY received_at::date
      ORDER BY date ASC
    `),
    query(`
      SELECT created_at::date::text AS date,
             agent_id,
             COUNT(*)::int AS calls,
             COALESCE(SUM(input_tokens), 0)::int AS input_tokens,
             COALESCE(SUM(output_tokens), 0)::int AS output_tokens,
             COUNT(*) FILTER (WHERE operation = 'chat')::int AS chat_hits,
             COALESCE(SUM(cost_usd), 0)::float AS cost_usd,
             COUNT(*) FILTER (WHERE status = 'error')::int AS errors,
             COUNT(*) FILTER (WHERE status = 'blocked')::int AS blocked
      FROM admin_agent_usage_events
      WHERE created_at >= now() - interval '29 days'
      GROUP BY created_at::date, agent_id
      ORDER BY date ASC, agent_id ASC
    `),
    query(`
      SELECT id, mailbox_id, email_id, job_type, status, attempt_count, max_attempts,
             error_code, error_message, queued_at, started_at, finished_at, updated_at
        FROM ai_jobs
       ORDER BY updated_at DESC
       LIMIT 20
    `),
  ]);

  const clients = clientsRows.map(clientToApi);
  const tasks = tasksRows.map(taskToApi);
  const completedTasks = tasks.filter((task) => isTerminalTaskStatus(task.status)).length;
  const openTasks = tasks.length - completedTasks;
  const usageSince = async (days) => {
    const { rows } = await query(`
      SELECT COUNT(*)::int AS calls,
             COALESCE(SUM(input_tokens), 0)::int AS input_tokens,
             COALESCE(SUM(output_tokens), 0)::int AS output_tokens,
             COUNT(*) FILTER (WHERE operation = 'chat')::int AS chat_hits,
             COALESCE(SUM(cost_usd), 0)::float AS cost_usd,
             COUNT(*) FILTER (WHERE status = 'error')::int AS errors,
             COUNT(*) FILTER (WHERE status = 'blocked')::int AS blocked
      FROM admin_agent_usage_events
      WHERE created_at >= now() - ($1::text || ' days')::interval
    `, [String(Math.max(days - 1, 0))]);
    const row = rows[0] || {};
    return {
      calls: row.calls || 0,
      inputTokens: row.input_tokens || 0,
      outputTokens: row.output_tokens || 0,
      chatHits: row.chat_hits || 0,
      costUsd: row.cost_usd || 0,
      errors: row.errors || 0,
      blocked: row.blocked || 0,
    };
  };

  const [dayUsage, weekUsage, monthUsage, totalUsage] = await Promise.all([
    usageSince(1),
    usageSince(7),
    usageSince(30),
    usageSince(3650),
  ]);
  const emailTotals = emailTotalsRows[0] || {};
  const needsReply = await query(`
    WITH latest AS (
      SELECT COALESCE(thread_id, id::text) AS thread_key,
             is_draft,
             folder_id,
             ROW_NUMBER() OVER (PARTITION BY COALESCE(thread_id, id::text) ORDER BY received_at DESC) AS rn
      FROM emails
    )
    SELECT COUNT(*)::int AS count
    FROM latest l
    JOIN folders f ON f.id = l.folder_id
    WHERE l.rn = 1 AND f.slug NOT IN ('sent', 'draft', 'trash', 'archive')
  `);

  res.json({
    success: true,
    data: {
      generatedAt: new Date().toISOString(),
      totals: {
        mailboxes: mailboxRows.length,
        clients: clients.length,
        tasks: tasks.length,
        openTasks,
        completedTasks,
        completionRate: tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0,
        totalEmails: emailTotals.total_emails || 0,
        unreadEmails: emailTotals.unread_emails || 0,
        draftEmails: emailTotals.draft_emails || 0,
        needsReply: needsReply.rows[0]?.count || 0,
        threads: emailTotals.threads || 0,
        attachments: emailTotals.attachments || 0,
      },
      mailboxes: mailboxRows.map((mailbox) => ({ ...mailbox, totalEmails: 0, unreadEmails: 0, draftEmails: 0, sentEmails: 0, inboxEmails: 0, attachments: 0, threads: 0, needsReply: 0, lastEmailAt: null, byDay: [] })),
      clients,
      tasks,
      charts: {
        emailsByDay: emailsByDayRows,
        tasksByStatus: TASK_STATUSES.map((status) => ({ status, count: tasks.filter((task) => task.status === status).length })),
        tasksByClient: clients.map((client) => {
          const clientTasks = tasks.filter((task) => task.clientId === client.id);
          const today = new Date().toISOString().slice(0, 10);
          return {
            clientId: client.id,
            clientName: client.company || client.name,
            total: clientTasks.length,
            completed: clientTasks.filter((task) => isTerminalTaskStatus(task.status)).length,
            overdue: clientTasks.filter((task) => task.dueDate && task.dueDate < today && !isTerminalTaskStatus(task.status)).length,
          };
        }),
        aiUsageByDay: usageRows.map((row) => ({
          date: row.date,
          agentId: row.agent_id,
          calls: row.calls,
          inputTokens: row.input_tokens,
          outputTokens: row.output_tokens,
          chatHits: row.chat_hits,
          costUsd: row.cost_usd,
          errors: row.errors,
          blocked: row.blocked,
        })),
      },
      aiUsage: { day: dayUsage, week: weekUsage, month: monthUsage, total: totalUsage },
      aiJobs: aiJobRows.map((row) => ({
        id: row.id,
        mailboxId: row.mailbox_id,
        emailId: row.email_id,
        jobType: row.job_type,
        status: row.status,
        attemptCount: row.attempt_count,
        maxAttempts: row.max_attempts,
        errorCode: row.error_code || '',
        errorMessage: row.error_message || '',
        queuedAt: row.queued_at,
        startedAt: row.started_at,
        finishedAt: row.finished_at,
        updatedAt: row.updated_at,
      })),
    },
  });
});

app.get('/api/v1/admin/clients', async (req, res) => {
  const actor = requireAdminRole(req, res, ['admin', 'manager', 'operator', 'viewer']);
  if (!actor) return;
  const { rows } = await query('SELECT * FROM admin_clients ORDER BY updated_at DESC');
  res.json({ success: true, data: rows.map(clientToApi) });
});

app.get('/api/v1/admin/action-queue', async (req, res) => {
  const actor = requireAdminRole(req, res, ['admin', 'manager', 'operator', 'viewer']);
  if (!actor) return;
  const [
    { rows: overdueRows },
    { rows: unassignedRows },
    { rows: blockedRows },
    { rows: waitingClientRows },
    { rows: draftRows },
    needsReply,
  ] = await Promise.all([
    query(`SELECT * FROM admin_tasks WHERE due_date < CURRENT_DATE AND status NOT IN ('done', 'closed') ORDER BY due_date ASC, updated_at DESC LIMIT 20`),
    query(`SELECT * FROM admin_tasks WHERE COALESCE(owner, '') = '' AND status NOT IN ('done', 'closed') ORDER BY updated_at DESC LIMIT 20`),
    query(`SELECT * FROM admin_tasks WHERE status = 'blocked' ORDER BY updated_at DESC LIMIT 20`),
    query(`SELECT * FROM admin_tasks WHERE status = 'waiting_client' ORDER BY updated_at DESC LIMIT 20`),
    query(`
      SELECT e.*, m.email AS mailbox_email
      FROM emails e
      JOIN mailboxes m ON m.id = e.mailbox_id
      WHERE e.is_draft = true
      ORDER BY e.updated_at DESC
      LIMIT 20
    `),
    query(`
      WITH latest AS (
        SELECT e.*, f.slug,
               ROW_NUMBER() OVER (PARTITION BY COALESCE(e.thread_id, e.id::text) ORDER BY e.received_at DESC) AS rn
        FROM emails e
        JOIN folders f ON f.id = e.folder_id
      )
      SELECT id, mailbox_id, subject, sender, recipient, received_at
      FROM latest
      WHERE rn = 1 AND slug NOT IN ('sent', 'draft', 'trash', 'archive')
      ORDER BY received_at DESC
      LIMIT 20
    `),
  ]);

  res.json({
    success: true,
    data: {
      overdue: overdueRows.map(taskToApi),
      unassigned: unassignedRows.map(taskToApi),
      blocked: blockedRows.map(taskToApi),
      waitingClient: waitingClientRows.map(taskToApi),
      draftReview: draftRows.map((row) => ({
        id: row.id,
        mailboxId: row.mailbox_id,
        mailboxEmail: row.mailbox_email,
        subject: row.subject,
        recipient: row.recipient,
        updatedAt: row.updated_at,
      })),
      needsReply: needsReply.rows,
    },
  });
});

app.get('/api/v1/admin/clients/:clientId', async (req, res) => {
  const actor = requireAdminRole(req, res, ['admin', 'manager', 'operator', 'viewer']);
  if (!actor) return;
  const { rows } = await query('SELECT * FROM admin_clients WHERE id = $1', [req.params.clientId]);
  if (!rows.length) return sendError(res, 404, 'Client not found');
  const client = clientToApi(rows[0]);
  const [{ rows: tasks }, { rows: audits }, { rows: relatedEmails }] = await Promise.all([
    query('SELECT * FROM admin_tasks WHERE client_id = $1 ORDER BY updated_at DESC', [client.id]),
    query(`SELECT * FROM admin_audit_logs WHERE entity_type = 'client' AND entity_id = $1 ORDER BY created_at DESC LIMIT 50`, [client.id]),
    query(
      `SELECT id, mailbox_id, subject, sender, recipient, received_at
       FROM emails
       WHERE ($1 <> '' AND (LOWER(sender) LIKE LOWER($2) OR LOWER(recipient) LIKE LOWER($2)))
          OR ($3 <> '' AND (LOWER(subject) LIKE LOWER($4) OR LOWER(body_text) LIKE LOWER($4)))
       ORDER BY received_at DESC
       LIMIT 25`,
      [client.email || '', `%${client.email || ''}%`, client.company || '', `%${client.company || ''}%`]
    ),
  ]);

  res.json({
    success: true,
    data: {
      client,
      tasks: tasks.map(taskToApi),
      audits: audits.map(auditToApi),
      relatedEmails,
      stats: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter((task) => isTerminalTaskStatus(task.status)).length,
        openTasks: tasks.filter((task) => !isTerminalTaskStatus(task.status)).length,
        overdueTasks: tasks.filter((task) => task.due_date && String(task.due_date).slice(0, 10) < new Date().toISOString().slice(0, 10) && !isTerminalTaskStatus(task.status)).length,
      },
    },
  });
});

app.post('/api/v1/admin/clients', async (req, res) => {
  const actor = requireAdminRole(req, res, ['admin', 'manager']);
  if (!actor) return;
  const { name, company, email, owner, status, tags, notes } = parseClientPayload(req.body);
  const { rows } = await query(
    `INSERT INTO admin_clients (name, company, email, owner, status, tags, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [name, company, email, owner, status, JSON.stringify(tags), notes]
  );
  const client = clientToApi(rows[0]);
  await audit('client', client.id, 'create', actor, null, client);
  res.status(201).json({ success: true, data: client });
});

app.put('/api/v1/admin/clients/:clientId', async (req, res) => {
  const actor = requireAdminRole(req, res, ['admin', 'manager']);
  if (!actor) return;
  const beforeRows = await query('SELECT * FROM admin_clients WHERE id = $1', [req.params.clientId]);
  if (!beforeRows.rows.length) return sendError(res, 404, 'Client not found');
  const { name, company, email, owner, status, tags, notes } = parseClientPayload(req.body);
  const { rows } = await query(
    `UPDATE admin_clients SET name = $1, company = $2, email = $3, owner = $4, status = $5, tags = $6, notes = $7, updated_at = now()
     WHERE id = $8 RETURNING *`,
    [name, company, email, owner, status, JSON.stringify(tags), notes, req.params.clientId]
  );
  const client = clientToApi(rows[0]);
  await audit('client', client.id, 'update', actor, clientToApi(beforeRows.rows[0]), client);
  res.json({ success: true, data: client });
});

app.get('/api/v1/admin/tasks', async (req, res) => {
  const actor = requireAdminRole(req, res, ['admin', 'manager', 'operator', 'viewer']);
  if (!actor) return;
  const params = [];
  const where = [];
  if (req.query.status) { params.push(req.query.status); where.push(`status = $${params.length}`); }
  if (req.query.clientId) { params.push(req.query.clientId); where.push(`client_id = $${params.length}`); }
  const { rows } = await query(`SELECT * FROM admin_tasks ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY updated_at DESC`, params);
  res.json({ success: true, data: rows.map(taskToApi) });
});

app.get('/api/v1/admin/tasks/:taskId', async (req, res) => {
  const actor = requireAdminRole(req, res, ['admin', 'manager', 'operator', 'viewer']);
  if (!actor) return;
  const { rows } = await query('SELECT * FROM admin_tasks WHERE id = $1', [req.params.taskId]);
  if (!rows.length) return sendError(res, 404, 'Task not found');
  const task = taskToApi(rows[0]);
  const [{ rows: clientRows }, { rows: events }, { rows: audits }, { rows: emailRows }] = await Promise.all([
    query('SELECT * FROM admin_clients WHERE id = $1', [task.clientId]),
    query('SELECT * FROM admin_task_events WHERE task_id = $1 ORDER BY created_at DESC LIMIT 100', [task.id]),
    query(`SELECT * FROM admin_audit_logs WHERE entity_type = 'task' AND entity_id = $1 ORDER BY created_at DESC LIMIT 100`, [task.id]),
    task.mailboxId && task.requestEmailId
      ? query('SELECT * FROM emails WHERE mailbox_id = $1 AND id = $2', [task.mailboxId, task.requestEmailId])
      : Promise.resolve({ rows: [] }),
  ]);

  res.json({
    success: true,
    data: {
      task,
      client: clientRows[0] ? clientToApi(clientRows[0]) : null,
      events: events.map(taskEventToApi),
      audits: audits.map(auditToApi),
      email: emailRows[0] || null,
    },
  });
});

app.post('/api/v1/admin/tasks', async (req, res) => {
  const actor = requireAdminRole(req, res, ['admin', 'manager', 'operator']);
  if (!actor) return;
  const { clientId, title, type, status, priority, owner, dueDate, completion, mailboxId, requestEmailId, issue, notes } = parseTaskPayload(req.body);
  try {
    const { rows } = await query(
      `INSERT INTO admin_tasks (client_id, title, type, status, priority, owner, due_date, completion, mailbox_id, request_email_id, issue, notes)
       VALUES ($1, $2, $3, $4, $5, $6, NULLIF($7, '')::date, $8, NULLIF($9, '')::uuid, NULLIF($10, '')::uuid, $11, $12)
       RETURNING *`,
      [clientId, title, type, status, priority, owner, dueDate || '', completion, mailboxId || '', requestEmailId || '', issue, notes]
    );
    const task = taskToApi(rows[0]);
    await query(
      `INSERT INTO admin_task_events (task_id, event_type, to_status, actor_email, actor_role, metadata)
       VALUES ($1, 'create', $2, $3, $4, $5)`,
      [task.id, task.status, actor.email, actor.role, JSON.stringify({ completion: task.completion })]
    );
    await audit('task', task.id, 'create', actor, null, task);
    res.status(201).json({ success: true, data: task });
  } catch (e) {
    sendError(res, 400, e.message);
  }
});

app.put('/api/v1/admin/tasks/:taskId', async (req, res) => {
  const actor = requireAdminRole(req, res, ['admin', 'manager', 'operator']);
  if (!actor) return;
  const beforeRows = await query('SELECT * FROM admin_tasks WHERE id = $1', [req.params.taskId]);
  if (!beforeRows.rows.length) return sendError(res, 404, 'Task not found');
  const before = taskToApi(beforeRows.rows[0]);
  const { clientId, title, type, status, priority, owner, dueDate, completion, mailboxId, requestEmailId, issue, notes } = parseTaskPayload(req.body);
  try {
    const { rows } = await query(
      `UPDATE admin_tasks SET client_id = $1, title = $2, type = $3, status = $4, priority = $5, owner = $6,
       due_date = NULLIF($7, '')::date, completion = $8, mailbox_id = NULLIF($9, '')::uuid,
       request_email_id = NULLIF($10, '')::uuid, issue = $11, notes = $12, updated_at = now()
       WHERE id = $13 RETURNING *`,
      [clientId, title, type, status, priority, owner, dueDate || '', completion, mailboxId || '', requestEmailId || '', issue, notes, req.params.taskId]
    );
    const task = taskToApi(rows[0]);
    if (before.status !== task.status) {
      await query(
        `INSERT INTO admin_task_events (task_id, event_type, from_status, to_status, actor_email, actor_role, metadata)
         VALUES ($1, 'status_change', $2, $3, $4, $5, $6)`,
        [task.id, before.status, task.status, actor.email, actor.role, JSON.stringify({ completion: task.completion })]
      );
    }
    await audit('task', task.id, 'update', actor, before, task);
    res.json({ success: true, data: task });
  } catch (e) {
    sendError(res, 400, e.message);
  }
});

app.post('/api/v1/admin/requests/from-email', async (req, res) => {
  const actor = requireAdminRole(req, res, ['admin', 'manager', 'operator']);
  if (!actor) return;
  const { mailboxId, emailId, clientId = '', owner = '' } = req.body;
  const { rows: emailRows } = await query('SELECT * FROM emails WHERE mailbox_id = $1 AND id = $2', [mailboxId, emailId]);
  if (!emailRows.length) return sendError(res, 404, 'Email not found');
  const email = emailRows[0];

  const { rows: existingTaskRows } = await query(
    `SELECT * FROM admin_tasks
     WHERE mailbox_id = $1 AND request_email_id = $2
     ORDER BY updated_at DESC
     LIMIT 1`,
    [mailboxId, emailId],
  );
  if (existingTaskRows.length) {
    return res.json({
      success: true,
      data: taskToApi(existingTaskRows[0]),
      meta: { created: false, idempotent: true },
    });
  }

  let resolvedClientId = clientId;
  if (!resolvedClientId) {
    const senderDomain = String(email.sender || '').split('@')[1] || 'unknown.local';
    const company = senderDomain.split('.')[0] || senderDomain;
    const { rows: existing } = await query(
      `SELECT * FROM admin_clients WHERE LOWER(email) = LOWER($1) OR LOWER(company) = LOWER($2) LIMIT 1`,
      [email.sender || '', company]
    );
    if (existing.length) {
      resolvedClientId = existing[0].id;
    } else {
      const { rows: created } = await query(
        `INSERT INTO admin_clients (name, company, email, owner, status, tags, notes)
         VALUES ($1, $2, $3, $4, 'active', '[]', 'Created from inbound email') RETURNING *`,
        [company, company, email.sender || '', owner]
      );
      const client = clientToApi(created[0]);
      resolvedClientId = client.id;
      await audit('client', client.id, 'create_from_email', actor, null, client);
    }
  }

  const bodyText = String(email.body_text || '').replace(/\s+/g, ' ').trim();
  const title = email.subject || bodyText.slice(0, 80) || 'Email request';
  const issue = bodyText.slice(0, 240);
  const { rows } = await query(
    `INSERT INTO admin_tasks (client_id, title, type, status, priority, owner, completion, mailbox_id, request_email_id, issue, notes)
     VALUES ($1, $2, 'request', 'triaged', 'normal', $3, 0, $4, $5, $6, $7)
     RETURNING *`,
    [resolvedClientId, title, owner, mailboxId, emailId, issue, `Created from email ${emailId}`]
  );
  const task = taskToApi(rows[0]);
  await query(
    `INSERT INTO admin_task_events (task_id, event_type, to_status, actor_email, actor_role, metadata)
     VALUES ($1, 'create_from_email', $2, $3, $4, $5)`,
    [task.id, task.status, actor.email, actor.role, JSON.stringify({ mailboxId, emailId })]
  );
  await audit('task', task.id, 'create_from_email', actor, null, task);
  res.status(201).json({ success: true, data: task });
});

app.post('/api/v1/admin/agent-usage', async (req, res) => {
  const actor = requireAdminRole(req, res, ['admin', 'manager', 'operator']);
  if (!actor) return;
  const { agentId, operation, model, inputTokens, outputTokens, costUsd, latencyMs, status, errorCode } = parseAgentUsagePayload(req.body);
  await query(
    `INSERT INTO admin_agent_usage_events (agent_id, operation, model, input_tokens, output_tokens, cost_usd, latency_ms, status, error_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [agentId, operation, model, inputTokens, outputTokens, costUsd, latencyMs, status, errorCode]
  );
  res.status(201).json({ success: true, data: { recorded: true } });
});

// ---------- Mailboxes ----------
app.get('/api/v1/mailboxes', async (req, res) => {
  const { rows } = await query('SELECT id, email, name, settings FROM mailboxes WHERE is_active = true ORDER BY created_at ASC');
  res.json({ success: true, data: rows.map((row) => serializeMailbox(row, { defaultMailboxName: DEFAULT_MAILBOX_NAME })) });
});

app.post('/api/v1/mailboxes', async (req, res) => {
  const actor = requireAdminRole(req, res, ['admin', 'manager']);
  if (!actor) return;
  const { email, name, settings } = parseMailboxPayload(req.body);
  const id = uuidv4();
  const defaultFolders = [
    { name: 'Inbox', slug: 'inbox', order: 0 },
    { name: 'Sent', slug: 'sent', order: 1 },
    { name: 'Drafts', slug: 'draft', order: 2 },
    { name: 'Trash', slug: 'trash', order: 3 },
    { name: 'Archive', slug: 'archive', order: 4 },
    { name: 'Spam', slug: 'spam', order: 5 },
  ];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO mailboxes (id, email, name, settings) VALUES ($1, $2, $3, $4)', [id, email, name, JSON.stringify(settings || {})]);
    for (const f of defaultFolders) {
      await client.query('INSERT INTO folders (mailbox_id, name, slug, is_system, is_deletable, sort_order) VALUES ($1, $2, $3, true, false, $4)', [id, f.name, f.slug, f.order]);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    return sendError(res, 500, e.message);
  } finally {
    client.release();
  }
  res.json({ success: true, data: { id, email, name } });
});

app.get('/api/v1/mailboxes/:mailboxId', async (req, res) => {
  const { rows } = await query('SELECT * FROM mailboxes WHERE id = $1', [req.params.mailboxId]);
  if (!rows.length) return sendError(res, 404, 'Mailbox not found');
  res.json({ success: true, data: serializeMailbox(rows[0], { defaultMailboxName: DEFAULT_MAILBOX_NAME }) });
});

app.put('/api/v1/mailboxes/:mailboxId', async (req, res) => {
  const actor = requireAdminRole(req, res, ['admin', 'manager']);
  if (!actor) return;
  const body = assertPlainObject(req.body);
  const settings = readSettings(body);
  await query('UPDATE mailboxes SET settings = $1, updated_at = now() WHERE id = $2', [JSON.stringify(settings), req.params.mailboxId]);
  res.json({ success: true });
});

app.delete('/api/v1/mailboxes/:mailboxId', async (req, res) => {
  const actor = requireAdminRole(req, res, ['admin']);
  if (!actor) return;
  const { rows: attachmentRows } = await query(
    `SELECT a.storage_key
       FROM attachments a
       JOIN emails e ON e.id = a.email_id
      WHERE e.mailbox_id = $1 AND COALESCE(a.storage_key, '') <> ''`,
    [req.params.mailboxId],
  );
  const result = await query('DELETE FROM mailboxes WHERE id = $1', [req.params.mailboxId]);
  if (!result.rowCount) return sendError(res, 404, 'Mailbox not found');
  await Promise.allSettled(attachmentRows.map((row) => deleteObject(row.storage_key)));
  res.json({ success: true });
});

// ---------- Emails ----------
app.get('/api/v1/mailboxes/:mailboxId/emails', async (req, res) => {
  const { mailboxId } = req.params;
  const { folder, thread_id, page = '1', limit = '20', sortColumn = 'received_at', sortDirection = 'DESC' } = req.query;
  const pagination = getBoundedPagination(page, limit);

  let sql = `SELECT e.*,
    e.is_read AS read,
    e.is_starred AS starred,
    e.email_date AS date,
    LEFT(COALESCE(e.body_text, ''), 200) AS snippet,
    (SELECT COUNT(*)::int FROM attachments a WHERE a.email_id = e.id) AS attachment_count,
    (SELECT COUNT(*)::int FROM emails t WHERE t.thread_id = e.thread_id AND t.mailbox_id = e.mailbox_id) AS thread_count,
    (SELECT COUNT(*)::int FROM emails t WHERE t.thread_id = e.thread_id AND t.mailbox_id = e.mailbox_id AND NOT t.is_read) AS thread_unread_count,
    (SELECT string_agg(DISTINCT t.sender, ',' ORDER BY t.sender) FROM emails t WHERE t.thread_id = e.thread_id AND t.mailbox_id = e.mailbox_id) AS participants
  FROM emails e WHERE e.mailbox_id = $1`;
  const params = [mailboxId];
  let countSql = 'SELECT COUNT(*) as count FROM emails WHERE mailbox_id = $1';
  const countParams = [mailboxId];
  let idx = 2;

  if (folder) {
    const { rows: frows } = await query('SELECT id FROM folders WHERE mailbox_id = $1 AND (id::text = $2 OR slug = $2 OR name = $2)', [mailboxId, folder]);
    const folderId = frows[0]?.id;
    if (folderId) {
      sql += ` AND e.folder_id = $${idx}`;
      countSql += ` AND folder_id = $${idx}`;
      params.push(folderId);
      countParams.push(folderId);
      idx++;
    }
  }
  if (thread_id) {
    sql += ` AND e.thread_id = $${idx}`;
    countSql += ` AND thread_id = $${idx}`;
    params.push(thread_id);
    countParams.push(thread_id);
    idx++;
  }

  const allowedSort = ['id', 'subject', 'sender', 'recipient', 'received_at', 'is_read', 'is_starred'];
  const sortCol = allowedSort.includes(sortColumn) ? sortColumn : 'received_at';
  const sortDir = sortDirection === 'ASC' ? 'ASC' : 'DESC';

  sql += ` ORDER BY e.${sortCol} ${sortDir} LIMIT $${idx} OFFSET $${idx + 1}`;
  params.push(pagination.limit, pagination.offset);

  const [{ rows: emails }, { rows: countRows }] = await Promise.all([
    query(sql, params),
    query(countSql, countParams),
  ]);

  res.json({ success: true, data: { emails, totalCount: parseInt(countRows[0].count) } });
});

app.post('/api/v1/mailboxes/:mailboxId/emails', async (req, res) => {
  const { mailboxId } = req.params;
  const { to, subject, html, text, thread_id } = req.body;
  const id = uuidv4();
  const [{ rows: sentRows }, { rows: mbRows }] = await Promise.all([
    query('SELECT id FROM folders WHERE mailbox_id = $1 AND slug = $2', [mailboxId, 'sent']),
    query('SELECT email FROM mailboxes WHERE id = $1', [mailboxId]),
  ]);
  const folderId = sentRows[0]?.id;
  const senderEmail = mbRows[0]?.email || mailboxId;
  await query(
    `INSERT INTO emails (id, mailbox_id, folder_id, thread_id, subject, sender, recipient, body_html, body_text, email_date, is_read) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), true)`,
    [id, mailboxId, folderId, thread_id || id, subject, senderEmail, Array.isArray(to) ? to.join(', ') : to, html || '', text || '']
  );
  res.json({ success: true, data: { id, status: 'sent' } });
});

app.get('/api/v1/mailboxes/:mailboxId/emails/:id', async (req, res) => {
  try {
    const { rows: emailRows } = await query('SELECT * FROM emails WHERE id = $1 AND mailbox_id = $2', [req.params.id, req.params.mailboxId]);
    if (!emailRows.length) return sendError(res, 404, 'Email not found');
    const { rows: attRows } = await query('SELECT * FROM attachments WHERE email_id = $1', [req.params.id]);
    res.json({ success: true, data: { ...emailRows[0], attachments: attRows } });
  } catch (e) { console.error(e); sendError(res, 500, e.message); }
});

app.put('/api/v1/mailboxes/:mailboxId/emails/:id', async (req, res) => {
  const { is_read, is_starred } = req.body;
  const fields = [];
  const values = [];
  let idx = 1;
  if (is_read !== undefined) { fields.push(`is_read = $${idx++}`); values.push(is_read); }
  if (is_starred !== undefined) { fields.push(`is_starred = $${idx++}`); values.push(is_starred); }
  if (!fields.length) return sendError(res, 400, 'No fields to update');
  values.push(req.params.id, req.params.mailboxId);
  const result = await query(`UPDATE emails SET ${fields.join(', ')}, updated_at = now() WHERE id = $${idx} AND mailbox_id = $${idx + 1}`, values);
  if (!result.rowCount) return sendError(res, 404, 'Email not found');
  res.json({ success: true });
});

app.delete('/api/v1/mailboxes/:mailboxId/emails/:id', async (req, res) => {
  const { rows: attachmentRows } = await query(
    `SELECT a.storage_key
       FROM attachments a
       JOIN emails e ON e.id = a.email_id
      WHERE a.email_id = $1 AND e.mailbox_id = $2 AND COALESCE(a.storage_key, '') <> ''`,
    [req.params.id, req.params.mailboxId],
  );
  const result = await query('DELETE FROM emails WHERE id = $1 AND mailbox_id = $2', [req.params.id, req.params.mailboxId]);
  if (!result.rowCount) return sendError(res, 404, 'Email not found');
  await Promise.allSettled(attachmentRows.map((row) => deleteObject(row.storage_key)));
  res.json({ success: true });
});

app.post('/api/v1/mailboxes/:mailboxId/emails/:id/move', async (req, res) => {
  const { folderId } = req.body;
  const { rows: folderRows } = await query(
    'SELECT id FROM folders WHERE mailbox_id = $1 AND (id::text = $2 OR slug = $2 OR name = $2)',
    [req.params.mailboxId, folderId],
  );
  if (!folderRows.length) return sendError(res, 404, 'Folder not found');
  const result = await query('UPDATE emails SET folder_id = $1, updated_at = now() WHERE id = $2 AND mailbox_id = $3', [folderRows[0].id, req.params.id, req.params.mailboxId]);
  if (!result.rowCount) return sendError(res, 404, 'Email not found');
  res.json({ success: true });
});

// ---------- Threads ----------
app.get('/api/v1/mailboxes/:mailboxId/threads/:threadId', async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM emails WHERE mailbox_id = $1 AND thread_id = $2 ORDER BY received_at ASC',
      [req.params.mailboxId, req.params.threadId]
    );
    res.json({ success: true, data: rows });
  } catch (e) { console.error(e); sendError(res, 500, e.message); }
});

app.post('/api/v1/mailboxes/:mailboxId/threads/:threadId/read', async (req, res) => {
  await query('UPDATE emails SET is_read = true WHERE mailbox_id = $1 AND thread_id = $2', [req.params.mailboxId, req.params.threadId]);
  res.json({ success: true });
});

// ---------- Drafts ----------
app.post('/api/v1/mailboxes/:mailboxId/drafts', async (req, res) => {
  const { mailboxId } = req.params;
  const { to, subject, body, in_reply_to, thread_id, draft_id } = req.body;
  const id = uuidv4();
  const { rows: mbRows } = await query('SELECT email FROM mailboxes WHERE id = $1', [mailboxId]);
  const senderEmail = mbRows[0]?.email || mailboxId;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: draftRows } = await client.query('SELECT id FROM folders WHERE mailbox_id = $1 AND slug = $2', [mailboxId, 'draft']);
    const folderId = draftRows[0]?.id;
    if (!folderId) throw new Error('Draft folder not found');
    await client.query(
      `INSERT INTO emails (id, mailbox_id, folder_id, thread_id, subject, sender, recipient, body_html, body_text, in_reply_to, is_draft)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)`,
      [id, mailboxId, folderId, thread_id || id, subject || '', senderEmail, (to || '').toLowerCase(), body || '', body || '', in_reply_to || null],
    );
    if (draft_id) {
      await client.query('DELETE FROM emails WHERE id = $1 AND mailbox_id = $2 AND is_draft = true', [draft_id, mailboxId]);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    return sendError(res, 400, e.message);
  } finally {
    client.release();
  }
  res.json({ success: true, data: { id } });
});

// ---------- Folders ----------
app.get('/api/v1/mailboxes/:mailboxId/folders', async (req, res) => {
  const { rows } = await query(
    `SELECT f.*,
            (SELECT COUNT(*)::int
               FROM emails e
              WHERE e.folder_id = f.id
                AND e.mailbox_id = f.mailbox_id
                AND NOT e.is_read) AS unread_count
       FROM folders f
      WHERE f.mailbox_id = $1
      ORDER BY f.sort_order`,
    [req.params.mailboxId],
  );
  res.json({ success: true, data: rows.map(serializeFolder) });
});

app.post('/api/v1/mailboxes/:mailboxId/folders', async (req, res) => {
  const { name } = req.body;
  const id = uuidv4();
  await query('INSERT INTO folders (id, mailbox_id, name, is_deletable) VALUES ($1, $2, $3, true)', [id, req.params.mailboxId, name]);
  res.json({ success: true, data: { id, name } });
});

app.put('/api/v1/mailboxes/:mailboxId/folders/:id', async (req, res) => {
  const { name } = req.body;
  const result = await query('UPDATE folders SET name = $1 WHERE id = $2 AND mailbox_id = $3', [name, req.params.id, req.params.mailboxId]);
  if (!result.rowCount) return sendError(res, 404, 'Folder not found');
  res.json({ success: true });
});

app.delete('/api/v1/mailboxes/:mailboxId/folders/:id', async (req, res) => {
  const result = await query('DELETE FROM folders WHERE id = $1 AND mailbox_id = $2 AND is_deletable = true', [req.params.id, req.params.mailboxId]);
  if (!result.rowCount) return sendError(res, 404, 'Folder not found or not deletable');
  res.json({ success: true });
});

// ---------- Search ----------
app.get('/api/v1/mailboxes/:mailboxId/search', async (req, res) => {
  const { q, page = '1', limit = '20' } = req.query;
  if (!q) return sendError(res, 400, 'Query parameter q is required');
  const { offset, limit: parsedLimit } = getBoundedPagination(page, limit);
  const base = `FROM emails WHERE mailbox_id = $1 AND search_vector @@ plainto_tsquery('simple', $2)`;
  const [{ rows }, { rows: countRows }] = await Promise.all([
    query(`SELECT * ${base} ORDER BY received_at DESC LIMIT $3 OFFSET $4`, [req.params.mailboxId, q, parsedLimit, offset]),
    query(`SELECT COUNT(*)::int AS count ${base}`, [req.params.mailboxId, q]),
  ]);
  res.json({ success: true, data: { emails: rows, totalCount: countRows[0].count } });
});

// ---------- Attachments ----------
app.get('/api/v1/mailboxes/:mailboxId/emails/:emailId/attachments/:attachmentId', async (req, res) => {
  const { rows } = await query(
    `SELECT a.*
       FROM attachments a
       JOIN emails e ON e.id = a.email_id
      WHERE a.id = $1 AND a.email_id = $2 AND e.mailbox_id = $3`,
    [req.params.attachmentId, req.params.emailId, req.params.mailboxId]
  );
  if (!rows.length) return sendError(res, 404, 'Attachment not found');
  const att = rows[0];
  if (att.storage_key) {
    const url = await presignGetUrl(att.storage_key);
    return res.redirect(302, url);
  }
  res.json({ success: true, data: att });
});

// ---------- Inbound Email Webhook ----------
app.post('/api/v1/webhooks/email', async (req, res) => {
  if (WEBHOOK_SECRET) {
    const provided = req.get('x-webhook-secret') || '';
    if (provided !== WEBHOOK_SECRET) return sendError(res, 401, 'Invalid webhook secret');
  }
  const {
    mailbox_id,
    from: sender,
    to: recipient,
    subject,
    body_text,
    body_html,
    message_id,
    in_reply_to,
    thread_id,
    provider = 'webhook',
    provider_message_id,
  } = req.body;
  if (!mailbox_id || !sender) return sendError(res, 400, 'mailbox_id and from are required');
  if (!(await ensureMailbox(mailbox_id))) return sendError(res, 404, 'Mailbox not found');

  const { rows: folderRows } = await query('SELECT id FROM folders WHERE mailbox_id = $1 AND slug = $2', [mailbox_id, 'inbox']);
  const folderId = folderRows[0]?.id;
  if (!folderId) return sendError(res, 500, 'Inbox folder not found');

  const result = await upsertInboundEmail({
    query,
    mailboxId: mailbox_id,
    folderId,
    email: {
      id: uuidv4(),
      subject,
      sender,
      recipient,
      body_text,
      body_html,
      message_id,
      in_reply_to,
      thread_id,
      provider,
      provider_message_id,
    },
  });
  if (result.inserted) {
    await publishEmailEvent('new_email', { email_id: result.id, mailbox_id, sender, subject: subject || '', thread_id: result.thread_id, body_text: body_text || '' });
  }
  res.status(result.inserted ? 201 : 200).json({ success: true, data: result });
});

// ---------- Email Send ----------
app.post('/api/v1/mailboxes/:mailboxId/emails/send', async (req, res) => {
  const { mailboxId } = req.params;
  if (!(await ensureMailbox(mailboxId))) return sendError(res, 404, 'Mailbox not found');

  const { to, subject, text, html, in_reply_to, thread_id } = req.body;
  if (!to || !subject) return sendError(res, 400, 'to and subject are required');

  // mailbox 이메일 주소 조회
  const { rows: mbRows } = await query('SELECT email FROM mailboxes WHERE id = $1', [mailboxId]);
  const fromAddress = mbRows[0]?.email;

  try {
    const info = await sendEmail({ from: fromAddress, to, subject, text, html, inReplyTo: in_reply_to });

    // Sent 폴더에 저장
    const { rows: folderRows } = await query(
      'SELECT id FROM folders WHERE mailbox_id = $1 AND slug = $2',
      [mailboxId, 'sent']
    );
    const folderId = folderRows[0]?.id;
    if (folderId) {
      const id = uuidv4();
      const resolvedThread = thread_id || in_reply_to || id;
      await query(
        `INSERT INTO emails (id, mailbox_id, folder_id, thread_id, subject, sender, recipient, body_text, body_html, message_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [id, mailboxId, folderId, resolvedThread, subject, fromAddress, to, text || '', html || '', info.messageId || null]
      );
    }

    res.status(201).json({ success: true, data: { messageId: info.messageId } });
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

// ---------- AI Auto-draft trigger ----------
app.post('/api/v1/mailboxes/:mailboxId/test-autodraft', async (req, res) => {
  const { emailId } = req.body;
  try {
    if (!(await ensureMailbox(req.params.mailboxId))) return sendError(res, 404, 'Mailbox not found');
    const { rows: emailRows } = await query('SELECT * FROM emails WHERE id = $1 AND mailbox_id = $2', [emailId, req.params.mailboxId]);
    if (!emailRows.length) return sendError(res, 404, 'Email not found');
    const email = emailRows[0];

    const agentRes = await fetch(`${AI_AGENT_URL}/api/v1/mailboxes/${req.params.mailboxId}/ai/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(LOCAL_SERVICE_TOKEN ? { Authorization: `Bearer ${LOCAL_SERVICE_TOKEN}` } : {}),
      },
      body: JSON.stringify({ email_id: emailId, sender: email.sender, subject: email.subject, thread_id: email.thread_id, body_text: email.body_text }),
    });
    const agentData = await agentRes.json();
    res.json({ success: true, data: { status: 'triggered', agentResponse: agentData } });
  } catch (e) {
    console.error('Auto-draft error:', e);
    sendError(res, 500, e.message);
  }
});

// ---------- Connection status ----------
app.get('/api/v1/status', async (req, res) => {
  const result = {
    mailServer: { status: 'ok', label: 'Mail Server' },
    database:   { status: 'unknown', label: 'Database' },
    aiAgent:    { status: 'unknown', label: 'AI Agent' },
    openai:     { status: 'unknown', label: 'OpenAI API' },
    redis:      { status: 'unknown', label: 'Redis' },
  };

  try {
    await query('SELECT 1');
    result.database.status = 'ok';
  } catch {
    result.database.status = 'error';
  }

  try {
    const agentRes = await fetch(`${AI_AGENT_URL}/ready`, {
      signal: AbortSignal.timeout(3000),
    });
    const agentData = await agentRes.json();
    result.aiAgent.status = agentData.status === 'ready' ? 'ok' : 'error';
    result.openai.status = agentData.checks?.ai_provider === 'ok' ? 'ok' : 'missing_key';
    result.redis.status = agentData.checks?.redis === 'ok' ? 'ok' : 'unavailable';
  } catch {
    result.aiAgent.status = 'offline';
    result.openai.status = 'unknown';
    result.redis.status = 'unknown';
  }

  res.json({ success: true, data: result });
});

// ---------- AI proxy routes ----------
app.post('/api/v1/mailboxes/:mailboxId/ai/chat', async (req, res) => {
  if (!(await ensureMailbox(req.params.mailboxId))) return sendError(res, 404, 'Mailbox not found');
  try {
    const agentRes = await fetch(`${AI_AGENT_URL}/api/v1/mailboxes/${req.params.mailboxId}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(LOCAL_SERVICE_TOKEN ? { Authorization: `Bearer ${LOCAL_SERVICE_TOKEN}` } : {}),
      },
      body: JSON.stringify(req.body),
    });
    if (!agentRes.ok) {
      const data = await agentRes.json().catch(() => ({}));
      return res.status(agentRes.status).json(data);
    }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    for await (const chunk of agentRes.body) {
      if (res.destroyed) break;
      res.write(chunk);
    }
    res.end();
  } catch (e) {
    sendError(res, 502, `AI agent unavailable: ${e.message}`);
  }
});

app.post('/api/v1/mailboxes/:mailboxId/ai/draft', async (req, res) => {
  if (!(await ensureMailbox(req.params.mailboxId))) return sendError(res, 404, 'Mailbox not found');
  try {
    const agentRes = await fetch(`${AI_AGENT_URL}/api/v1/mailboxes/${req.params.mailboxId}/ai/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(LOCAL_SERVICE_TOKEN ? { Authorization: `Bearer ${LOCAL_SERVICE_TOKEN}` } : {}),
      },
      body: JSON.stringify(req.body),
    });
    const data = await agentRes.json();
    res.status(agentRes.status).json(data);
  } catch (e) {
    sendError(res, 502, `AI agent unavailable: ${e.message}`);
  }
});

// ---------- Health ----------
app.get('/health', async (req, res) => {
  res.json({ status: 'healthy' });
});

app.get('/ready', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ready', checks: { database: 'ok', auth: REPLIT_WEB_ENABLED ? 'session_required' : LOCAL_SERVICE_TOKEN ? 'token_required' : 'development_open' } });
  } catch (e) {
    res.status(500).json({ status: 'not_ready', error: NODE_ENV === 'production' ? 'Database unavailable' : e.message });
  }
});

// ---------- Global Error Handler ----------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.code === 'STORAGE_NOT_CONFIGURED' ? '첨부파일용 영구 저장소가 아직 연결되지 않았습니다.' :
    NODE_ENV === 'production' ? 'Internal server error' : (err.message || 'Unknown error');
  console.error(`[${req.method}] ${req.path} →`, err);
  res.status(status).json({ success: false, error: { code: err.code || 'INTERNAL_ERROR', message } });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

const PORT = process.env.PORT || 8080;

async function main() {
  await initDb();
  app.listen(PORT, process.env.HOST || '0.0.0.0', () => {
    console.log(`Mail Server listening on port ${PORT}`);
  });

  // --- Inbound SMTP Server ---
  const SMTP_INBOUND_PORT = Number(process.env.SMTP_INBOUND_PORT) || 2525;
  if (process.env.SMTP_INBOUND_ENABLED === 'true') {
    const smtpServer = createInboundSmtpServer({ query, publishEmailEvent });
    smtpServer.listen(SMTP_INBOUND_PORT, () => {
      console.log(`SMTP inbound listening on port ${SMTP_INBOUND_PORT}`);
    });
  }
}

main().catch((error) => {
  console.error('Mail server startup failed:', error.message);
  process.exit(1);
});
