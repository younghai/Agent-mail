import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
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

  assert.equal((await call(`${workspace}/reply`, { method: 'POST', body: { subject: '', body: '' } })).status, 400);
  assert.equal((await call(`${base}/emails/${randomUUID()}/campaign-workspace`)).status, 404);
});
