import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFile } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { runMigrations } from '../../src/migrations.js';

// The shipped server — production launcher, real migrations, real PostgreSQL —
// answering the requests the React client sends. It inserts rows, so it runs
// only against a throwaway database named in TEST_DATABASE_URL.
const DATABASE_URL = process.env.TEST_DATABASE_URL || '';
const skip = DATABASE_URL ? false : 'TEST_DATABASE_URL is not set';
if (DATABASE_URL && !/test/i.test(new URL(DATABASE_URL).pathname)) {
  throw new Error('TEST_DATABASE_URL must point at a database whose name contains "test"');
}

// Synthetic test credentials only. No workspace secret is read.
const PASSWORD = 'contract-test-password-only-123456';
const ENTRY = fileURLToPath(new URL('../../src/index.js', import.meta.url));
const SEED = fileURLToPath(new URL('../../src/seed.js', import.meta.url));
const MIGRATIONS = fileURLToPath(new URL('../../migrations', import.meta.url));

let server;
let host;
let session;

async function login() {
  const response = await fetch(`http://${host}/auth/login`, {
    method: 'POST', redirect: 'manual',
    headers: { origin: `https://${host}` }, // TLS ends before Express, as it does on Replit
    body: new URLSearchParams({ password: PASSWORD }),
  });
  assert.equal(response.status, 303);
  const cookie = response.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ');
  return { cookie, origin: `https://${host}` };
}

function call(path, { method = 'GET', body } = {}) {
  return fetch(`http://${host}${path}`, {
    method,
    headers: { ...session, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (response) => ({ status: response.status, body: await response.json().catch(() => null) }));
}

async function createMailbox() {
  const response = await call('/api/v1/mailboxes', { method: 'POST', body: {
    email: `contract-${randomBytes(6).toString('hex')}@example.test`, name: 'Contract test',
  } });
  assert.equal(response.status, 200, JSON.stringify(response.body));
  return response.body.data.id;
}

before(async () => {
  // Without the variable nothing here may run: an empty connection string
  // falls back to PostgreSQL's defaults, which is the developer's own server.
  if (!DATABASE_URL) return;
  const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 1 });
  await runMigrations(pool, MIGRATIONS);
  await pool.end();

  const port = await new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port: free } = probe.address();
      probe.close(() => resolve(free));
    });
  });
  host = `127.0.0.1:${port}`;
  server = spawn(process.execPath, [ENTRY], {
    // The same variables scripts/start-production.sh sets. Nothing else is
    // inherited, so the test cannot reach a real SMTP, S3 or AI credential.
    env: { PATH: process.env.PATH, NODE_ENV: 'production', APP_ENV: 'production', REPLIT_WEB_ENABLED: 'true',
      RUN_MIGRATIONS: 'false', SMTP_INBOUND_ENABLED: 'false', DATABASE_URL,
      SESSION_SECRET: randomBytes(32).toString('hex'), INBOX_ADMIN_PASSWORD: PASSWORD, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  server.stdout.on('data', (chunk) => { log += chunk; });
  server.stderr.on('data', (chunk) => { log += chunk; });
  for (let attempt = 0; ; attempt += 1) {
    if (server.exitCode !== null || attempt > 150) {
      server.kill();
      throw new Error(`Mail server did not start (exit ${server.exitCode}):\n${log}`);
    }
    if (await fetch(`http://${host}/ready`).then((response) => response.ok, () => false)) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  session = await login();
});

after(async () => {
  if (server && server.exitCode === null) {
    const exited = new Promise((resolve) => server.once('exit', resolve));
    server.kill();
    await exited;
  }
});

test('the production gate covers the real sending and AI routes and leaves draft saving open', { skip }, async () => {
  const base = `/api/v1/mailboxes/${await createMailbox()}`;
  const anyEmail = '00000000-0000-0000-0000-000000000000';
  const blocked = [
    [`${base}/emails`, 403, 'SENDING_DISABLED'],
    [`${base}/emails/send`, 403, 'SENDING_DISABLED'],
    [`${base}/emails/${anyEmail}/reply`, 403, 'SENDING_DISABLED'],
    [`${base}/emails/${anyEmail}/forward`, 403, 'SENDING_DISABLED'],
    [`${base}/ai/draft`, 503, 'SERVICE_NOT_CONFIGURED'],
    [`${base}/test-autodraft`, 503, 'SERVICE_NOT_CONFIGURED'],
    [`${base}/agent-feedback`, 503, 'SERVICE_NOT_CONFIGURED'],
    ['/api/v1/admin/agent-usage', 503, 'SERVICE_NOT_CONFIGURED'],
    ['/api/v1/webhooks/email', 503, 'SERVICE_NOT_CONFIGURED'],
  ];
  for (const [path, status, code] of blocked) {
    const response = await call(path, { method: 'POST', body: {} });
    assert.deepEqual([path, response.status, response.body?.error?.code], [path, status, code]);
  }
  const draft = await call(`${base}/drafts`, { method: 'POST', body: { subject: 'Draft', body: '<p>Kept</p>' } });
  assert.equal(draft.status, 200);
});

test('campaign review works end to end: seed, complete requirements, keep one reply draft, store a campaign draft', { skip }, async () => {
  const base = `/api/v1/mailboxes/${await createMailbox()}`;
  const seed = (body) => call(`${base}/demo-campaigns/seed`, { method: 'POST', body });
  assert.deepEqual((await seed({})).body.data, { created: 9, total: 9 });
  assert.deepEqual((await seed({})).body.data, { created: 0, total: 9 }, 'seeding twice must not duplicate');
  assert.deepEqual((await seed({ refreshContent: true })).body.data, { created: 0, total: 9, refreshed: 9 });

  const inbox = (await call(`${base}/emails?folder=inbox&limit=20`)).body.data;
  assert.equal(inbox.totalCount, 9);
  const email = inbox.emails.find((row) => row.subject.includes('OLED'));
  const workspace = `${base}/emails/${email.id}/campaign-workspace`;
  const requirements = { assets: 'PC 600×600 / 모바일 360×480', frequencyCap: '하루 1회' };

  let response = await call(workspace);
  assert.equal(response.status, 200);
  assert.equal(response.body.data.mode, 'demo');
  assert.ok(response.body.data.missing.some((item) => item.key === 'assets'));

  response = await call(workspace, { method: 'PUT', body: { requirements } });
  assert.equal(response.status, 200);
  assert.deepEqual(response.body.data.missing, []);

  const first = await call(`${workspace}/reply`, { method: 'POST', body: { subject: 'Re: 요청 검토', body: '확인했습니다.' } });
  assert.equal(first.status, 200);
  const second = await call(`${workspace}/reply`, { method: 'POST', body: { subject: 'Re: 요청 검토', body: '수정된 답변' } });
  assert.equal(second.status, 200);
  assert.equal(second.body.data.replyDraftId, first.body.data.replyDraftId, 'saving again must update the same draft');
  const drafts = (await call(`${base}/emails?folder=draft`)).body.data;
  assert.deepEqual(drafts.emails.map((row) => row.id), [second.body.data.replyDraftId]);

  response = await call(`${workspace}/campaign`, { method: 'POST', body: { title: 'OLED 런칭 검토', notes: '', requirements } });
  assert.equal(response.status, 200);
  assert.equal(response.body.data.campaign.status, 'draft');
  assert.deepEqual(response.body.data.campaign.blockers, []);
  response = await call(workspace);
  assert.equal(response.body.data.reply.body, '수정된 답변');
  assert.equal(response.body.data.campaign.title, 'OLED 런칭 검토');

  // Errors use the one envelope the rest of the API and the client's ApiError expect.
  const rejected = await call(`${workspace}/reply`, { method: 'POST', body: { subject: '', body: '' } });
  assert.deepEqual(rejected, { status: 400, body: { success: false, error: {
    code: 'VALIDATION_ERROR', message: '제목과 본문을 입력해 주세요. 제목은 500자, 본문은 30,000자 이내입니다.',
  } } });
  const unknown = await call(`${base}/emails/${randomUUID()}/campaign-workspace`);
  assert.deepEqual([unknown.status, unknown.body], [404, { success: false, error: { code: 'NOT_FOUND', message: '메일을 찾을 수 없습니다.' } }]);
});

async function seededMailbox() {
  const base = `/api/v1/mailboxes/${await createMailbox()}`;
  await call(`${base}/demo-campaigns/seed`, { method: 'POST', body: {} });
  return base;
}

const inbox = (base) => call(`${base}/emails?folder=inbox&limit=20`).then((response) => response.body.data.emails);

test('marking read and starring use the names the client sends', { skip }, async () => {
  const base = await seededMailbox();
  const { id } = (await inbox(base))[0];
  const mark = (data) => call(`${base}/emails/${id}`, { method: 'PUT', body: data });

  assert.equal((await mark({ read: true })).status, 200);
  assert.equal((await mark({ starred: true })).status, 200);
  const [updated] = await inbox(base);
  assert.deepEqual([updated.read, updated.starred], [true, true]);
  assert.equal((await mark({ read: 'yes' })).status, 400);
});

test('list, detail, thread and search return one email shape', { skip }, async () => {
  const base = await seededMailbox();
  const listed = (await inbox(base))[0];
  const detail = (await call(`${base}/emails/${listed.id}`)).body.data;
  const thread = (await call(`${base}/threads/${listed.thread_id}`)).body.data;
  const search = (await call(`${base}/search?q=OLED`)).body.data.emails;

  const rows = [['list', listed], ['detail', detail], ['thread', thread[0]], ['search', search[0]]];
  for (const [name, row] of rows) {
    assert.equal(typeof row.read, 'boolean', `${name} row has read`);
    assert.equal(typeof row.starred, 'boolean', `${name} row has starred`);
    assert.ok(row.date, `${name} row has date`);
    for (const key of ['body', 'body_html', 'body_text', 'attachments']) assert.ok(key in row, `${name} row has ${key}`);
    assert.equal('search_vector' in row, false, `${name} row hides search_vector`);
  }
  assert.match(thread[0].body, /<img/, 'thread rows carry the full message');
  assert.match(detail.body, /<img/, 'detail rows carry the full message');
  // List and search rows carry a snippet instead of the message body.
  for (const [name, row] of [['list', listed], ['search', search[0]]]) {
    assert.deepEqual([row.body, row.body_html, row.body_text], [null, null, null], `${name} row has no body`);
    assert.ok(row.snippet.length > 0, `${name} row has a snippet`);
  }
});

test('thread messages carry their attachments', { skip }, async () => {
  const base = await seededMailbox();
  const { id, thread_id } = (await inbox(base))[0];
  const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 1 });
  try {
    await pool.query(
      `INSERT INTO attachments (email_id, filename, mimetype, size_bytes, storage_key)
       VALUES ($1, 'brief.pdf', 'application/pdf', 2048, 'contract-test/none')`, [id]);
  } finally {
    await pool.end();
  }
  const detail = (await call(`${base}/emails/${id}`)).body.data;
  const thread = (await call(`${base}/threads/${thread_id}`)).body.data;
  const shape = ({ filename, size, storage_key }) => [filename, size, storage_key];
  assert.deepEqual([detail.attachments.map(shape), thread[0].attachments.map(shape)],
    [[['brief.pdf', 2048, undefined]], [['brief.pdf', 2048, undefined]]]);
});

test('a saved draft comes back with its body', { skip }, async () => {
  const base = `/api/v1/mailboxes/${await createMailbox()}`;
  const saved = await call(`${base}/drafts`, { method: 'POST', body: {
    to: 'someone@example.test', subject: 'Draft A', body: '<p>Saved body</p>',
  } });
  assert.equal(saved.status, 200);
  const draft = (await call(`${base}/emails/${saved.body.data.id}`)).body.data;
  assert.equal(draft.body, '<p>Saved body</p>');
  assert.equal(draft.is_draft, true);
  const drafts = (await call(`${base}/emails?folder=draft`)).body.data.emails;
  assert.deepEqual([drafts[0].id, drafts[0].is_draft], [saved.body.data.id, true]);
});

test('saving a draft again updates it instead of adding one, and its text stays plain', { skip }, async () => {
  const base = `/api/v1/mailboxes/${await createMailbox()}`;
  const save = (body) => call(`${base}/drafts`, { method: 'POST', body });
  const first = await save({ to: 'someone@example.test', subject: 'Draft A', body: '<p>First&nbsp;version</p>' });
  const second = await save({ to: 'someone@example.test', subject: 'Draft A', body: '<p>Second version</p>', draft_id: first.body.data.id });
  assert.equal(second.status, 200);
  assert.equal(second.body.data.id, first.body.data.id, 'the draft keeps its id');
  const drafts = (await call(`${base}/emails?folder=draft`)).body.data.emails;
  assert.deepEqual(drafts.map((row) => [row.id, row.snippet]), [[first.body.data.id, 'Second version']], 'one draft, plain snippet');
  const draft = (await call(`${base}/emails/${first.body.data.id}`)).body.data;
  assert.deepEqual([draft.body, draft.body_text], ['<p>Second version</p>', 'Second version']);
  assert.equal((await save({ subject: 'x', body: 'x', draft_id: randomUUID() })).status, 404);
  assert.equal((await save({ subject: 'x', body: 'x', draft_id: 'not-a-uuid' })).status, 400);
});

test('the inbox list can be limited to unread emails', { skip }, async () => {
  const base = await seededMailbox();
  const { id } = (await inbox(base))[0];
  assert.equal((await call(`${base}/emails/${id}`, { method: 'PUT', body: { read: true } })).status, 200);
  const unread = (await call(`${base}/emails?folder=inbox&unread=true&limit=200`)).body.data;
  assert.equal(unread.totalCount, 8);
  assert.deepEqual(unread.emails.map((row) => row.read), Array(8).fill(false));
});

test('search takes the parameters the client sends and honours the operators it advertises', { skip }, async () => {
  const base = await seededMailbox();
  const oled = (await inbox(base)).find((row) => row.subject.includes('OLED'));
  await call(`${base}/emails/${oled.id}`, { method: 'PUT', body: { starred: true } });
  await call(`${base}/emails/${oled.id}`, { method: 'PUT', body: { read: true } });
  const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 1 });
  try {
    await pool.query(
      `INSERT INTO attachments (email_id, filename, mimetype, size_bytes, storage_key)
       VALUES ($1, 'brief.pdf', 'application/pdf', 2048, 'contract-test/none')`, [oled.id]);
  } finally {
    await pool.end();
  }
  // Sent exactly as client/app/lib/search-parser.ts turns the query into parameters.
  const search = async (params) => {
    const response = await call(`${base}/search?${new URLSearchParams({ page: '1', limit: '25', ...params })}`);
    const ids = response.body?.data?.emails.map((row) => row.id);
    return response.status === 200 ? { status: 200, ids } : { status: response.status, code: response.body?.error?.code };
  };

  assert.deepEqual(await search({ q: 'OLED' }), { status: 200, ids: [oled.id] }, 'q: OLED');
  assert.deepEqual(await search({ from: 'lg.example', subject: '런칭' }), { status: 200, ids: [oled.id] }, 'from:lg.example subject:런칭');
  assert.deepEqual(await search({ folder: 'inbox', is_starred: 'true' }), { status: 200, ids: [oled.id] }, 'in:inbox is:starred');
  assert.deepEqual(await search({ folder: 'draft' }), { status: 200, ids: [] }, 'in:draft');
  assert.deepEqual((await search({ is_read: 'false' })).ids.length, 8, 'is:unread');
  assert.deepEqual(await search({ has_attachment: 'true' }), { status: 200, ids: [oled.id] }, 'has:attachment');
  const skypass = (await inbox(base)).find((row) => row.subject.includes('SKYPASS')).id;
  assert.deepEqual(await search({ date_start: '2026-11-01T00:00:00.000Z', q: 'SKYPASS' }), { status: 200, ids: [skypass] }, 'after:2026-11-01 SKYPASS');
  assert.deepEqual(await search({ date_start: '2027-01-01T00:00:00.000Z', q: 'SKYPASS' }), { status: 200, ids: [] }, 'after:2027-01-01 SKYPASS');
  assert.deepEqual(await search({ date_end: '2020-01-01T00:00:00.000Z' }), { status: 200, ids: [] }, 'before:2020-01-01');
  // A search the server cannot act on must fail, not list the mailbox as if it were a result.
  for (const params of [{}, { is_read: 'maybe' }, { date_start: 'not-a-date' }, { after: '2026-11-01' }]) {
    assert.deepEqual(await search(params), { status: 400, code: 'VALIDATION_ERROR' }, JSON.stringify(params));
  }
});

test('the development seed is one script that counts what it inserts and fails loudly', { skip }, async () => {
  const seededMailbox = '00000000-0000-0000-0000-000000000001';
  const run = (url) => new Promise((resolve) => {
    execFile(process.execPath, [SEED], { env: { PATH: process.env.PATH, DATABASE_URL: url } },
      (error, stdout, stderr) => resolve({ code: error ? error.code : 0, output: `${stdout}${stderr}`.trim() }));
  });
  const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 1 });
  try {
    await pool.query('DELETE FROM emails WHERE mailbox_id = $1', [seededMailbox]);
    const count = async () => (await pool.query(
      'SELECT count(*)::int AS count FROM emails WHERE mailbox_id = $1', [seededMailbox])).rows[0].count;

    assert.deepEqual(await run(DATABASE_URL), { code: 0, output: 'Seeded 39 of 39 sample emails' });
    assert.equal(await count(), 39);
    assert.deepEqual(await run(DATABASE_URL), { code: 0, output: 'Seeded 0 of 39 sample emails' }, 'running it twice adds nothing');

    // A database without the tables is a failure a caller has to be able to see.
    const nowhere = new URL(DATABASE_URL);
    nowhere.pathname = '/postgres';
    const failed = await run(nowhere.href);
    assert.equal(failed.code, 1);
    assert.match(failed.output, /Seed failed:/);
  } finally {
    await pool.end();
  }
});

test('admin writes are all-or-nothing, and one email becomes one task even when requests race', { skip }, async () => {
  const base = await seededMailbox();
  const mailboxId = base.split('/').pop();
  const [first, second, third] = await inbox(base);
  const fromEmail = (email) => call('/api/v1/admin/requests/from-email', { method: 'POST', body: { mailboxId, emailId: email.id } });
  const tasksFor = async () => (await call('/api/v1/admin/tasks')).body.data.filter((task) => task.mailboxId === mailboxId);

  const created = await fromEmail(first);
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const again = await fromEmail(first);
  assert.deepEqual([again.status, again.body.data.id, again.body.meta],
    [200, created.body.data.id, { created: false, idempotent: true }], 'asking again returns the task that exists');
  // The unique index, not a lookup before the insert, is what keeps this to one task.
  const raced = await Promise.all([fromEmail(second), fromEmail(second)]);
  assert.deepEqual(raced.map((response) => response.status).sort(), [200, 201]);
  assert.equal((await tasksFor()).length, 2);
  const detail = (await call(`/api/v1/admin/tasks/${created.body.data.id}`)).body.data;
  assert.deepEqual([detail.events.length, detail.audits.length], [1, 1]);
  assert.equal(detail.email.id, first.id, 'the task detail carries the request email');

  // Make the last statement of a task write fail: nothing from that write may remain.
  const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 1 });
  const clientId = (await call('/api/v1/admin/clients', { method: 'POST', body: { name: 'Probe', company: 'Probe Co' } })).body.data.id;
  const task = { clientId, title: 'probe-rollback', type: 'task', status: 'new', priority: 'normal', owner: '', dueDate: '', completion: 0, issue: '', notes: '' };
  try {
    await pool.query(`ALTER TABLE admin_audit_logs ADD CONSTRAINT contract_probe_reject
      CHECK (after_json->>'title' IS DISTINCT FROM 'probe-rollback')`);
    const failed = await call('/api/v1/admin/tasks', { method: 'POST', body: task });
    assert.equal(failed.status, 500);
    assert.equal((await tasksFor()).filter((row) => row.title === 'probe-rollback').length, 0, 'the task is not left behind');
  } finally {
    await pool.query('ALTER TABLE admin_audit_logs DROP CONSTRAINT IF EXISTS contract_probe_reject');
    await pool.end();
  }
  // A write that names a record which does not exist is the caller's mistake, not a server fault.
  const orphan = await call('/api/v1/admin/tasks', { method: 'POST', body: { ...task, title: 'orphan', clientId: randomUUID() } });
  assert.deepEqual([orphan.status, orphan.body.error.code, orphan.body.error.message], [400, 'REFERENCED_NOT_FOUND', 'Referenced record not found']);
  const before = (await tasksFor()).length;
  assert.equal((await call('/api/v1/admin/clients', { method: 'POST', body: { name: 'Third', company: 'Third Co' } })).status, 201);
  assert.equal((await tasksFor()).length, before);
});

test('an id that is not a UUID names nothing: 404, not a server fault', { skip }, async () => {
  const base = `/api/v1/mailboxes/${await createMailbox()}`;
  const probes = [
    ['GET', `${base}/emails/not-a-uuid`],
    ['GET', `${base}/threads/not-a-uuid`],
    ['GET', `${base}/emails/${randomUUID()}/attachments/not-a-uuid`],
    ['PUT', `${base}/emails/not-a-uuid`],
    ['DELETE', `${base}/folders/not-a-uuid`],
    ['GET', '/api/v1/admin/clients/not-a-uuid'],
    ['PUT', '/api/v1/admin/tasks/not-a-uuid'],
    ['GET', '/api/v1/admin/tasks/not-a-uuid'],
  ];
  for (const [method, path] of probes) {
    const response = await call(path, { method, body: method === 'GET' ? undefined : {} });
    assert.deepEqual([path, response.status, response.body?.error?.code], [path, 404, 'ERROR'], `${method} ${path}`);
  }
});

test('every route the React app relies on is registered on the shipped server', { skip }, async () => {
  const base = `/api/v1/mailboxes/${await createMailbox()}`;
  const reads = [
    `${base}/approvals`, `${base}/segments`, `${base}/admin/sla`, `${base}/folders`,
    '/api/v1/admin/cost/daily', '/api/v1/admin/cost/monthly', '/api/v1/admin/cost/models',
    '/api/v1/admin/overview', '/api/v1/admin/action-queue', '/api/v1/admin/clients', '/api/v1/admin/tasks',
    '/api/v1/config', '/api/v1/status', '/health', '/ready',
  ];
  for (const path of reads) {
    const response = await call(path);
    assert.deepEqual([path, response.status], [path, 200], 'a 404 here means the client calls a route that does not exist');
  }
  // AI routes answer 503 to reads as well as writes where the AI service is off.
  const gated = await call(`${base}/agent-feedback/summary`);
  assert.deepEqual([gated.status, gated.body?.error?.code], [503, 'SERVICE_NOT_CONFIGURED']);
  // Writes are registered too: an unknown draft is the route's own 404, not the framework's.
  const approval = await call(`${base}/drafts/${randomUUID()}/approval`, { method: 'POST', body: { action: 'approve' } });
  assert.deepEqual([approval.status, approval.body?.error?.message], [404, 'Draft not found']);
});

test('a server fault is logged and not explained to the caller; a caller mistake still is', { skip }, async () => {
  const base = `/api/v1/mailboxes/${await createMailbox()}`;
  const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 1 });
  const save = (subject) => call(`${base}/drafts`, { method: 'POST', body: { to: 'someone@example.test', subject, body: '<p>x</p>' } });
  try {
    await pool.query(`ALTER TABLE emails ADD CONSTRAINT contract_probe_reject CHECK (subject <> 'probe-fault')`);
    const fault = await save('probe-fault');
    assert.deepEqual(fault, { status: 500, body: { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } } },
      'a database constraint is the server\'s business, not the caller\'s');
  } finally {
    await pool.query('ALTER TABLE emails DROP CONSTRAINT IF EXISTS contract_probe_reject');
    await pool.end();
  }
  assert.equal((await save('probe-fine')).status, 200);
  const mistake = await call(`${base}/drafts`, { method: 'POST', body: { to: 'someone@example.test', subject: 'x', body: 'x', draft_id: 'not-a-uuid' } });
  assert.deepEqual([mistake.status, mistake.body.error], [400, { code: 'VALIDATION_ERROR', message: 'draft_id must be a UUID' }]);
});

test('a client page lists the emails written by the client and the ones that only name the company in the body', { skip }, async () => {
  const base = await seededMailbox();
  const mailboxId = base.split('/').pop();
  const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 1 });
  try {
    const insert = (sender, subject, body) => pool.query(
      `INSERT INTO emails (mailbox_id, folder_id, thread_id, subject, sender, recipient, body_text, body_html, email_date)
       SELECT $1, f.id, gen_random_uuid(), $3, $2, 'me@example.test', $4, $4, now() FROM folders f WHERE f.mailbox_id = $1 AND f.slug = 'inbox'`,
      [mailboxId, sender, subject, body]);
    await insert('someone@elsewhere.org', '문의 드립니다', '내용입니다');
    await insert('stranger@nowhere.org', '안부 인사', 'Example 회사와 함께 진행하고 싶습니다');
    await insert('bystander@nowhere.org', '안부 인사', '다른 회사 이야기입니다');
  } finally {
    await pool.end();
  }
  const client = (await call('/api/v1/admin/clients', {
    method: 'POST', body: { name: 'Someone', company: 'Example', email: 'someone@elsewhere.org' },
  })).body.data;
  const detail = await call(`/api/v1/admin/clients/${client.id}`);
  assert.equal(detail.status, 200);
  const senders = detail.body.data.relatedEmails.map((row) => row.sender);
  assert.ok(senders.includes('someone@elsewhere.org'), 'matched by address');
  assert.ok(senders.includes('stranger@nowhere.org'), 'matched by a company name in the body');
  assert.ok(!senders.includes('bystander@nowhere.org'), 'unrelated mail is not listed');
  assert.deepEqual([detail.body.data.stats.totalTasks, detail.body.data.client.company], [0, 'Example']);
});
