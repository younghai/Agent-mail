import {
  DEMO_CAMPAIGNS, demoBody, demoEmailHtml, escapeHtml, stableDemoId, findDemo,
  buildWorkspace, validateRequirements, validateReply, makeCampaign, normalizedOverrides,
} from '../../../client/shared/campaign-demo.js';

const base = '/api/v1/mailboxes/:mailboxId/emails/:emailId/campaign-workspace';
const fail = (res, status, message) => res.status(status).json({ error: message });
const html = (body) => `<div style="white-space:pre-wrap">${escapeHtml(body)}</div>`;

export function registerCampaignDemoRoutes(app, { query, pool }) {
  app.post('/api/v1/mailboxes/:mailboxId/demo-campaigns/seed', async (req, res) => {
    if (req.body?.refreshContent !== undefined && typeof req.body.refreshContent !== 'boolean') {
      return fail(res, 400, 'refreshContent는 true 또는 false여야 합니다.');
    }
    const refreshContent = req.body?.refreshContent === true;
    const mailboxId = req.params.mailboxId;
    const { rows: [mailbox] } = await query('SELECT email FROM mailboxes WHERE id = $1', [mailboxId]);
    const { rows: [folder] } = await query("SELECT id FROM folders WHERE mailbox_id = $1 AND slug = 'inbox'", [mailboxId]);
    if (!mailbox || !folder) return fail(res, 404, '메일함 또는 Inbox 폴더를 찾을 수 없습니다.');
    const client = await pool.connect();
    let created = 0;
    let refreshed = 0;
    try {
      await client.query('BEGIN');
      for (const [index, fixture] of DEMO_CAMPAIGNS.entries()) {
        const id = await stableDemoId(mailbox.email.toLowerCase(), fixture.key);
        const body = demoBody(fixture);
        if (refreshContent) {
          const { rows: [existing] } = await client.query(
            'SELECT subject,sender,body_text,body_html FROM emails WHERE id=$1 AND mailbox_id=$2', [id, mailboxId],
          );
          if (existing) {
            if (findDemo(existing)) {
              await client.query('UPDATE emails SET body_text=$3,body_html=$4,updated_at=now() WHERE id=$1 AND mailbox_id=$2',
                [id, mailboxId, body, demoEmailHtml(fixture)]);
              refreshed++;
            }
            continue;
          }
        }
        const date = new Date(Date.now() - index * 30 * 60000).toISOString();
        const result = await client.query(
          `INSERT INTO emails (id, mailbox_id, folder_id, thread_id, subject, sender, recipient,
            body_html, body_text, message_id, email_date, received_at, is_read, is_draft)
           VALUES ($1,$2,$3,$11,$4,$5,$6,$7,$8,$9,$10,$10,false,false)
           ON CONFLICT (id) DO NOTHING`,
          [id, mailboxId, folder.id, fixture.subject, fixture.sender, mailbox.email, demoEmailHtml(fixture), body, `<${id}@campaign-demo.invalid>`, date, id],
        );
        created += result.rowCount;
      }
      await client.query('COMMIT');
      return res.json({ success: true, data: { created, total: DEMO_CAMPAIGNS.length, ...(refreshContent ? { refreshed } : {}) } });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  });

  async function context(db, mailboxId, emailId) {
    const { rows: [email] } = await db.query(
      'SELECT e.*, m.email AS mailbox_email FROM emails e JOIN mailboxes m ON m.id=e.mailbox_id WHERE e.id=$1 AND e.mailbox_id=$2',
      [emailId, mailboxId],
    );
    if (!email) return { status: 404, error: '메일을 찾을 수 없습니다.' };
    if (!findDemo(email)) return { status: 422, error: '이 기능은 가상 캠페인 메일용 데모입니다. 실제 메일 AI 분석은 별도로 연결해야 합니다.' };
    return { email };
  }

  app.get(base, async (req, res) => {
    const { mailboxId, emailId } = req.params;
    const ctx = await context({ query }, mailboxId, emailId);
    if (ctx.error) return fail(res, ctx.status, ctx.error);
    const { rows: [row] } = await query('SELECT data FROM campaign_demo_workspaces WHERE mailbox_id=$1 AND email_id=$2', [mailboxId, emailId]);
    return res.json({ success: true, data: buildWorkspace(ctx.email, row?.data || {}) });
  });

  for (const operation of ['requirements', 'reply', 'campaign']) {
    app[operation === 'requirements' ? 'put' : 'post'](
      operation === 'requirements' ? base : `${base}/${operation}`,
      async (req, res) => {
        let values;
        try {
          values = operation === 'reply' ? validateReply(req.body) : validateRequirements(req.body?.requirements);
        } catch (error) { return fail(res, 400, error.message); }
        const { mailboxId, emailId } = req.params;
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const ctx = await context(client, mailboxId, emailId);
          if (ctx.error) {
            await client.query('ROLLBACK');
            return fail(res, ctx.status, ctx.error);
          }
          const email = ctx.email;
          await client.query('INSERT INTO campaign_demo_workspaces (mailbox_id,email_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [mailboxId, emailId]);
          const { rows: [row] } = await client.query('SELECT data FROM campaign_demo_workspaces WHERE mailbox_id=$1 AND email_id=$2 FOR UPDATE', [mailboxId, emailId]);
          const state = row.data;
          if (operation !== 'reply') {
            const fixture = findDemo(email);
            try { state.requirements = normalizedOverrides(fixture, values); }
            catch (error) {
              await client.query('ROLLBACK');
              return fail(res, 400, error.message);
            }
          }
          if (operation === 'reply') {
            const replyId = await stableDemoId(email.mailbox_email.toLowerCase(), `${emailId}:reply`);
            const { rows: [folder] } = await client.query("SELECT id FROM folders WHERE mailbox_id=$1 AND slug='draft'", [mailboxId]);
            if (!folder) throw new Error('Draft 폴더를 찾을 수 없습니다.');
            const saved = await client.query(
              `INSERT INTO emails (id,mailbox_id,folder_id,thread_id,subject,sender,recipient,body_text,body_html,in_reply_to,is_draft,is_read)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,true)
               ON CONFLICT (id) DO UPDATE SET subject=EXCLUDED.subject,body_text=EXCLUDED.body_text,
                 body_html=EXCLUDED.body_html,updated_at=now()
               WHERE emails.mailbox_id=EXCLUDED.mailbox_id AND emails.in_reply_to=EXCLUDED.in_reply_to AND emails.is_draft=true
               RETURNING id`,
              [replyId,mailboxId,folder.id,email.thread_id || email.id,values.subject,email.mailbox_email,email.sender,values.body,html(values.body),email.id],
            );
            if (!saved.rowCount) throw new Error('기존 메일을 덮어쓸 수 없습니다.');
            state.reply = values;
            state.replyDraftId = replyId;
          }
          if (operation === 'campaign') {
            const workspace = buildWorkspace(email, state);
            try {
              state.campaign = makeCampaign(workspace, req.body, state.campaign, await stableDemoId(email.mailbox_email.toLowerCase(), `${emailId}:campaign`));
            } catch (error) {
              await client.query('ROLLBACK');
              return fail(res, 400, error.message);
            }
          }
          state.updatedAt = new Date().toISOString();
          await client.query('UPDATE campaign_demo_workspaces SET data=$3, updated_at=now() WHERE mailbox_id=$1 AND email_id=$2', [mailboxId,emailId,JSON.stringify(state)]);
          await client.query('COMMIT');
          return res.json({ success: true, data: buildWorkspace(email, state) });
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally { client.release(); }
      },
    );
  }
}
