import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { registerProductionWeb } from '../src/lib/production-web.js';

// Synthetic test credentials only. No workspace secrets are read by this suite.
const password = 'a-test-password-only-123456';
const sessionSecret = 'test-session-secret-with-at-least-32-characters';

function memoryStore() {
  const tokens = new Map();
  let attempts = 0;
  return {
    allowAttempt: async () => ++attempts <= 10,
    create: async (key, version) => tokens.set(key, version),
    has: async (key, version) => tokens.get(key) === version,
    remove: async key => tokens.delete(key),
    expire: () => tokens.clear(),
  };
}

async function fixture(t, options = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'inbox-production-test-'));
  await writeFile(join(dir, 'index.html'), '<h1>Private inbox application</h1>');
  await writeFile(join(dir, 'sample.jpg'), 'protected-image');
  await mkdir(join(dir, 'campaign-examples'));
  await writeFile(join(dir, 'campaign-examples', 'sample.jpg'), 'public-example-photo');
  const app = express();
  const store = options.store || memoryStore();
  registerProductionWeb(app, { store, clientDir: dir, password, sessionSecret, ...options });
  app.get('/health', (_req, res) => res.json({ status: 'healthy' }));
  app.get('/api/v1/mailboxes', (_req, res) => res.json({ actor: res.locals.adminActor }));
  app.post('/api/v1/mailboxes/:id/drafts', (_req, res) => res.json({ saved: true }));
  app.post('/api/v1/mailboxes/:id/emails/:emailId/campaign-workspace/reply', (_req, res) => res.json({ saved: true }));
  // Mirrors the sending and AI routes the mail server defines.
  for (const path of ['/api/v1/mailboxes/:id/emails/send', '/api/v1/mailboxes/:id/agent-feedback', '/api/v1/admin/agent-usage']) {
    app.post(path, (_req, res) => res.json({ reached: true }));
  }
  app.use((err, _req, res, _next) => res.status(503).json({ error: err.message }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const host = `127.0.0.1:${server.address().port}`;
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await rm(dir, { recursive: true }); });
  const request = (path, options = {}) => fetch(`http://${host}${path}`, { redirect: 'manual', ...options });
  const origin = `https://${host}`; // Simulate Replit TLS terminating before Express.
  const login = (value = password, headers = {}) => request('/auth/login', {
    method: 'POST', headers: { origin, ...headers }, body: new URLSearchParams({ password: value }),
  });
  return { request, login, origin, store };
}

test('anonymous root passes health probe but APIs, images, and deep links reveal no mail', async t => {
  const { request } = await fixture(t);
  const root = await request('/');
  assert.equal(root.status, 200);
  assert.match(await root.text(), /관리자 비밀번호/);
  assert.equal(root.headers.get('cache-control'), 'no-store');
  for (const path of ['/api/v1/mailboxes', '/api/v1/admin/clients', '/API/v1/mailboxes', '/agents/test']) {
    const response = await request(path, { headers: {
      authorization: 'Bearer fake-service-token', 'x-admin-email': 'admin@example.test',
      'x-admin-role': 'admin', 'cf-access-jwt-assertion': 'forged',
    } });
    assert.equal(response.status, 401);
  }
  assert.doesNotMatch(await (await request('/sample.jpg')).text(), /protected-image/);
  assert.equal(await (await request('/campaign-examples/sample.jpg')).text(), 'public-example-photo');
  assert.doesNotMatch(await (await request('/mailbox/me/inbox')).text(), /Private inbox application/);
  assert.equal((await request('/health')).status, 200);
});

test('login, secure cookie, private SPA, draft save, logout and revoked session', async t => {
  const { request, login, origin } = await fixture(t);
  assert.equal((await login('incorrect')).status, 401);
  const response = await login();
  assert.equal(response.status, 303);
  const setCookie = response.headers.get('set-cookie');
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /Secure/);
  assert.match(setCookie, /SameSite=Lax/);
  assert.match(setCookie, /Path=\//);
  const cookie = setCookie.split(';')[0];
  const headers = { cookie, origin };
  assert.match(await (await request('/', { headers })).text(), /Private inbox application/);
  assert.match(await (await request('/mailbox/me/inbox', { headers })).text(), /Private inbox application/);
  assert.equal((await request('/sample.jpg', { headers })).status, 200);
  const api = await request('/api/v1/mailboxes', { headers: { ...headers, 'x-admin-email': 'spoof@example.test' } });
  assert.deepEqual((await api.json()).actor, { email: 'inbox-admin@replit.local', role: 'admin' });
  assert.equal((await request('/api/v1/mailboxes/me/drafts', { method: 'POST', headers })).status, 200);
  // Campaign "reply" saves a draft; it must not be caught by the send guard.
  assert.equal((await request('/api/v1/mailboxes/me/emails/id/campaign-workspace/reply', { method: 'POST', headers })).status, 200);
  assert.equal((await request('/auth/logout', { method: 'POST', headers })).status, 303);
  assert.equal((await request('/api/v1/mailboxes', { headers })).status, 401);
});

test('CSRF, sending, real AI and webhook paths are blocked without affecting campaign drafts', async t => {
  const { request, login, origin } = await fixture(t);
  assert.equal((await login(password, { origin: 'https://attacker.example' })).status, 403);
  const cookie = (await login()).headers.get('set-cookie').split(';')[0];
  assert.equal((await request('/api/v1/mailboxes/me/drafts', { method: 'POST', headers: { cookie } })).status, 403);
  assert.equal((await request('/auth/logout', { method: 'POST', headers: { cookie, origin: 'https://attacker.example' } })).status, 403);
  for (const path of [
    '/api/v1/mailboxes/me/emails', '/api/v1/mailboxes/me/emails/send', '/API/v1/mailboxes/me/emails/send/',
    '/api/v1/mailboxes/me/emails/id/reply', '/api/v1/mailboxes/me/emails/id/forward',
  ]) assert.equal((await request(path, { method: 'POST', headers: { cookie, origin } })).status, 403);
  for (const path of [
    '/api/v1/webhooks/email', '/api/v1/mailboxes/me/ai/draft', '/api/v1/mailboxes/me/test-autodraft',
    '/api/v1/mailboxes/me/agent-feedback', '/api/v1/admin/agent-usage',
  ]) {
    assert.equal((await request(path, { method: 'POST', headers: { cookie, origin } })).status, 503);
  }
  // Every other sending path is blocked, so the gate must not be a blanket match.
  assert.equal((await request('/api/v1/mailboxes/me/emails/id/move', { method: 'POST', headers: { cookie, origin } })).status, 404);
});

test('missing or too-short password fails closed, including forged cookies', async t => {
  for (const value of ['', 'short']) {
    const { request, login } = await fixture(t, { password: value });
    assert.match(await (await request('/')).text(), /INBOX_ADMIN_PASSWORD/);
    assert.equal((await login()).status, 503);
    assert.equal((await request('/api/v1/mailboxes', { headers: { cookie: '__Host-agent-mail=' + 'f'.repeat(64) } })).status, 401);
  }
});

test('login attempts are rate-limited; expired sessions cannot access APIs', async t => {
  const { request, login, store } = await fixture(t);
  const cookie = (await login()).headers.get('set-cookie').split(';')[0];
  store.expire();
  assert.equal((await request('/api/v1/mailboxes', { headers: { cookie } })).status, 401);
  for (let i = 0; i < 9; i++) assert.equal((await login('wrong')).status, 401);
  const limited = await login();
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('retry-after'), '900');
});

test('password rotation and another instance share durable session semantics', async t => {
  const store = memoryStore();
  const first = await fixture(t, { store });
  const cookie = (await first.login()).headers.get('set-cookie').split(';')[0];
  const second = await fixture(t, { store });
  assert.equal((await second.request('/api/v1/mailboxes', { headers: { cookie } })).status, 200);
  const rotated = await fixture(t, { store, password: 'a-different-long-password' });
  assert.equal((await rotated.request('/api/v1/mailboxes', { headers: { cookie } })).status, 401);
});
