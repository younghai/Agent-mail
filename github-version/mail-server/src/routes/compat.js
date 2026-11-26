function numberParam(value, fallback, max) {
  const n = Number.parseInt(String(value || ''), 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, max);
}

async function sentFolderId(query, mailboxId) {
  const { rows } = await query(
    'SELECT id FROM folders WHERE mailbox_id = $1 AND slug = $2',
    [mailboxId, 'sent'],
  );
  return rows[0]?.id || null;
}

async function sendAndStore({ query, uuidv4, sendEmail, mailboxId, originalId, body, forward }) {
  const { rows: mailboxRows } = await query('SELECT email FROM mailboxes WHERE id = $1', [mailboxId]);
  const { rows: originalRows } = await query('SELECT * FROM emails WHERE id = $1 AND mailbox_id = $2', [originalId, mailboxId]);
  if (!originalRows.length) {
    const err = new Error('Original email not found');
    err.status = 404;
    throw err;
  }
  const fromAddress = mailboxRows[0]?.email || mailboxId;
  const original = originalRows[0];
  const to = body.to || original.sender;
  const subject = body.subject || `${forward ? 'Fwd' : 'Re'}: ${original.subject || ''}`;
  const text = body.text || String(body.html || '').replace(/<[^>]*>/g, '').trim();
  const html = body.html || body.body || text;
  const info = await sendEmail({
    from: fromAddress,
    to,
    subject,
    text,
    html,
    inReplyTo: forward ? undefined : original.message_id || original.in_reply_to || undefined,
    references: forward ? undefined : original.email_references || undefined,
  });
  const folderId = await sentFolderId(query, mailboxId);
  if (folderId) {
    const id = uuidv4();
    await query(
      `INSERT INTO emails
         (id, mailbox_id, folder_id, thread_id, subject, sender, recipient, body_text, body_html,
          message_id, in_reply_to, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)`,
      [
        id,
        mailboxId,
        folderId,
        forward ? id : original.thread_id || originalId,
        subject,
        fromAddress,
        Array.isArray(to) ? to.join(', ') : to,
        text,
        html,
        info.messageId || null,
        forward ? null : original.message_id || originalId,
      ],
    );
  }
  return { messageId: info.messageId || null };
}

export function registerCompatRoutes(app, deps) {
  const { query, uuidv4, sendEmail, sendError } = deps;

  app.post('/api/v1/mailboxes/:mailboxId/emails/:id/reply', async (req, res) => {
    try {
      const data = await sendAndStore({ query, uuidv4, sendEmail, mailboxId: req.params.mailboxId, originalId: req.params.id, body: req.body || {}, forward: false });
      res.status(202).json({ success: true, data });
    } catch (err) {
      sendError(res, err.status || 500, err.message);
    }
  });

  app.post('/api/v1/mailboxes/:mailboxId/emails/:id/forward', async (req, res) => {
    try {
      const data = await sendAndStore({ query, uuidv4, sendEmail, mailboxId: req.params.mailboxId, originalId: req.params.id, body: req.body || {}, forward: true });
      res.status(202).json({ success: true, data });
    } catch (err) {
      sendError(res, err.status || 500, err.message);
    }
  });

  app.post('/api/v1/mailboxes/:mailboxId/agent-feedback', async (req, res) => {
    const { call_id, session_id = null, score, comment = null } = req.body || {};
    if (!call_id || ![1, -1].includes(Number(score))) return sendError(res, 400, 'call_id and score are required');
    const id = uuidv4();
    const { rows } = await query(
      `INSERT INTO agent_feedback (id, mailbox_id, call_id, session_id, score, comment)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (mailbox_id, call_id, score)
       DO UPDATE SET session_id = EXCLUDED.session_id, comment = EXCLUDED.comment
       RETURNING id, call_id, score, created_at`,
      [id, req.params.mailboxId, call_id, session_id, Number(score), comment],
    );
    res.status(201).json({ success: true, data: rows[0] });
  });

  app.delete('/api/v1/mailboxes/:mailboxId/agent-feedback/:callId/:score', async (req, res) => {
    await query(
      'DELETE FROM agent_feedback WHERE mailbox_id = $1 AND call_id = $2 AND score = $3',
      [req.params.mailboxId, req.params.callId, Number(req.params.score)],
    );
    res.status(204).end();
  });

  app.get('/api/v1/mailboxes/:mailboxId/agent-feedback/summary', async (req, res) => {
    const { rows } = await query(
      `SELECT
         COUNT(*) FILTER (WHERE score = 1)::int AS up,
         COUNT(*) FILTER (WHERE score = -1)::int AS down,
         COUNT(*)::int AS total
       FROM agent_feedback WHERE mailbox_id = $1`,
      [req.params.mailboxId],
    );
    res.json({ success: true, data: rows[0] || { up: 0, down: 0, total: 0 } });
  });

  app.get('/api/v1/mailboxes/:mailboxId/approvals', async (req, res) => {
    const { rows } = await query(
      `SELECT id, subject, sender, recipient, body_html AS body, email_date AS date, thread_id,
              in_reply_to, approval_state, approval_meta
         FROM emails
        WHERE mailbox_id = $1 AND is_draft = true AND approval_state = 'pending'
        ORDER BY updated_at DESC, received_at DESC
        LIMIT 100`,
      [req.params.mailboxId],
    );
    res.json({ success: true, data: rows });
  });

  app.post('/api/v1/mailboxes/:mailboxId/drafts/:emailId/approval', async (req, res) => {
    const action = String(req.body?.action || '');
    const states = { submit: 'pending', approve: 'approved', reject: 'rejected' };
    const state = states[action];
    if (!state) return sendError(res, 400, 'action must be submit, approve, or reject');
    const meta = {
      decided_by: req.body?.decided_by || null,
      decided_at: new Date().toISOString(),
      comment: req.body?.comment || null,
    };
    const result = await query(
      `UPDATE emails
          SET approval_state = $1, approval_meta = $2::jsonb, updated_at = now()
        WHERE mailbox_id = $3 AND id = $4 AND is_draft = true`,
      [state, JSON.stringify(meta), req.params.mailboxId, req.params.emailId],
    );
    if (!result.rowCount) return sendError(res, 404, 'Draft not found');
    res.json({ success: true, data: { state, meta } });
  });

  app.get('/api/v1/admin/cost/daily', async (req, res) => {
    const days = numberParam(req.query.days, 14, 90);
    const { rows } = await query(
      `SELECT to_char(day::date, 'YYYY-MM-DD') AS day, COALESCE(SUM(cost_usd), 0)::float AS "costUsd", 10::float AS "dailyLimitUsd"
         FROM generate_series(current_date - ($1::int - 1), current_date, '1 day') day
         LEFT JOIN admin_agent_usage_events e ON e.created_at::date = day::date
        GROUP BY day ORDER BY day`,
      [days],
    );
    res.json({ success: true, data: { data: rows, days } });
  });

  app.get('/api/v1/admin/cost/monthly', async (req, res) => {
    const months = numberParam(req.query.months, 6, 24);
    const { rows } = await query(
      `SELECT to_char(month::date, 'YYYY-MM') AS month, COALESCE(SUM(cost_usd), 0)::float AS "costUsd", 200::float AS "monthlyLimitUsd"
         FROM generate_series(date_trunc('month', current_date) - (($1::int - 1) * interval '1 month'), date_trunc('month', current_date), '1 month') month
         LEFT JOIN admin_agent_usage_events e ON date_trunc('month', e.created_at) = month
        GROUP BY month ORDER BY month`,
      [months],
    );
    res.json({ success: true, data: { data: rows, months } });
  });

  app.get('/api/v1/admin/cost/models', async (req, res) => {
    const days = numberParam(req.query.days, 30, 365);
    const { rows } = await query(
      `SELECT COALESCE(model, 'unknown') AS model, operation, COUNT(*)::int AS count,
              COALESCE(SUM(input_tokens), 0)::int AS "inputTokens",
              COALESCE(SUM(output_tokens), 0)::int AS "outputTokens"
         FROM admin_agent_usage_events
        WHERE created_at >= now() - ($1::int * interval '1 day')
        GROUP BY model, operation ORDER BY count DESC`,
      [days],
    );
    res.json({ success: true, data: { data: rows, days } });
  });

  app.get('/api/v1/mailboxes/:mailboxId/segments', async (req, res) => {
    const { rows } = await query(
      `SELECT sender AS email,
              COALESCE(NULLIF(split_part(sender, '@', 2), ''), 'unknown.local') AS domain,
              CASE
                WHEN COUNT(*) >= 20 OR COUNT(*) FILTER (WHERE is_starred) >= 3 THEN 'vip'
                WHEN MIN(received_at) > now() - interval '14 days' THEN 'new'
                WHEN MAX(received_at) < now() - interval '60 days' THEN 'dormant'
                ELSE 'regular'
              END AS segment,
              COUNT(*)::int AS "totalMessages",
              MAX(received_at) AS "lastSeenAt",
              MIN(received_at) AS "firstSeenAt",
              COUNT(*) FILTER (WHERE is_starred)::int AS starred
         FROM emails
        WHERE mailbox_id = $1 AND COALESCE(sender, '') <> ''
        GROUP BY sender ORDER BY MAX(received_at) DESC LIMIT 200`,
      [req.params.mailboxId],
    );
    res.json({ success: true, data: rows });
  });

  app.get('/api/v1/mailboxes/:mailboxId/admin/sla', async (req, res) => {
    const windowValue = ['24h', '7d', '30d'].includes(req.query.window) ? req.query.window : '7d';
    const intervalByWindow = { '24h': '1 day', '7d': '7 days', '30d': '30 days' };
    const { rows: totals } = await query(
      `WITH inbound AS (
         SELECT * FROM emails WHERE mailbox_id = $1 AND is_draft = false AND sender <> recipient
           AND received_at >= now() - $2::interval
       ), replies AS (
         SELECT i.id, MIN(s.received_at) AS replied_at
           FROM inbound i
           JOIN emails s ON s.mailbox_id = i.mailbox_id AND s.thread_id = i.thread_id
            AND s.received_at > i.received_at AND s.is_draft = false
            AND s.sender <> i.sender
          GROUP BY i.id
       )
       SELECT COUNT(*)::int AS "totalReceived",
              COUNT(replies.replied_at)::int AS "totalReplied",
              (COUNT(*) - COUNT(replies.replied_at))::int AS unreplied,
              COALESCE(AVG(EXTRACT(EPOCH FROM (replies.replied_at - inbound.received_at)) / 3600), 0)::float AS "avgResponseHours"
         FROM inbound LEFT JOIN replies ON replies.id = inbound.id`,
      [req.params.mailboxId, intervalByWindow[windowValue]],
    );
    const { rows: overdue } = await query(
      `SELECT id, subject, sender, EXTRACT(EPOCH FROM (now() - received_at)) / 3600 AS age_hours
         FROM emails
        WHERE mailbox_id = $1 AND is_draft = false AND received_at < now() - interval '24 hours'
        ORDER BY received_at ASC LIMIT 20`,
      [req.params.mailboxId],
    );
    const { rows: trend } = await query(
      `SELECT to_char(day::date, 'YYYY-MM-DD') AS date,
              COUNT(e.id)::int AS received,
              0::int AS replied,
              0::float AS "avgHours"
         FROM generate_series(current_date - 13, current_date, '1 day') day
         LEFT JOIN emails e ON e.mailbox_id = $1 AND e.received_at::date = day::date
        GROUP BY day ORDER BY day`,
      [req.params.mailboxId],
    );
    const base = totals[0] || {};
    res.json({
      success: true,
      data: {
        window: windowValue,
        generatedAt: new Date().toISOString(),
        totalReceived: base.totalReceived || 0,
        totalReplied: base.totalReplied || 0,
        unreplied: base.unreplied || 0,
        avgResponseHours: Number(base.avgResponseHours || 0),
        p50ResponseHours: Number(base.avgResponseHours || 0),
        p90ResponseHours: Number(base.avgResponseHours || 0),
        overdue,
        trend,
      },
    });
  });
}
