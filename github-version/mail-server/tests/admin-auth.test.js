import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { createAdminAuth, requireAdminRole } from '../src/lib/admin-auth.js';

const issuer = 'https://access.example.test';
const audience = 'test-mail-app';
const admin = 'admin@example.test';
const spoofedHeaders = {
  'cf-access-authenticated-user-email': admin,
  'x-authenticated-user-email': admin,
  'x-admin-user-email': admin,
};
const realFetch = globalThis.fetch;
let pair;

before(async () => {
  pair = await generateKeyPair('RS256');
  const jwk = { ...await exportJWK(pair.publicKey), kid: 'test-key', alg: 'RS256' };
  globalThis.fetch = async (url, options) => {
    if (String(url) === `${issuer}/cdn-cgi/access/certs`) {
      return Response.json({ keys: [jwk] });
    }
    return realFetch(url, options);
  };
});
after(() => { globalThis.fetch = realFetch; });

function sign(claims = {}, key = pair.privateKey) {
  return new SignJWT({
    email: admin, sub: 'verified-user', iss: issuer, aud: audience,
    exp: Math.floor(Date.now() / 1000) + 300, ...claims,
  }).setProtectedHeader({ alg: 'RS256', kid: 'test-key' }).sign(key);
}

// Exercise the same service-token -> identity -> role middleware order as the
// mail API using a real HTTP listener, without touching the workspace database.
async function request(t, { token, headers = {}, method = 'POST', path = '/api/v1/admin/clients', options = {}, serviceToken = true } = {}) {
  const app = express();
  app.use((req, res, next) => {
    if (req.get('authorization') !== 'Bearer test-service-token') return res.sendStatus(401);
    next();
  });
  app.use(createAdminAuth({ teamDomain: issuer, policyAud: audience, adminEmails: [admin], ...options }));
  app.all(['/api/v1/admin/clients', '/api/v1/admin/tasks', '/api/v1/mailboxes'], (req, res) => {
    const actor = requireAdminRole(req, res, req.method === 'GET' ? ['admin', 'viewer'] : ['admin']);
    if (actor) res.status(req.method === 'GET' ? 200 : 201).json(actor);
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  return realFetch(`http://127.0.0.1:${server.address().port}${path}`, {
    method,
    headers: {
      ...(serviceToken ? { authorization: 'Bearer test-service-token' } : {}),
      ...(token ? { 'cf-access-jwt-assertion': token } : {}),
      ...headers,
    },
  });
}

test('a service token and forged email headers cannot read or write admin data', async (t) => {
  for (const name of Object.keys(spoofedHeaders)) {
    for (const method of ['GET', 'POST', 'PUT']) {
      const response = await request(t, { headers: { [name]: admin }, method });
      assert.equal(response.status, 403);
    }
  }
});

test('a verified non-admin cannot become admin using any identity header', async (t) => {
  const token = await sign({ email: 'viewer@example.test' });
  for (const path of ['/api/v1/admin/clients', '/api/v1/admin/tasks', '/api/v1/mailboxes']) {
    const response = await request(t, { token, headers: spoofedHeaders, path });
    assert.equal(response.status, 403);
  }
  const read = await request(t, { token, headers: spoofedHeaders, method: 'GET' });
  assert.deepEqual(await read.json(), { email: 'viewer@example.test', role: 'viewer' });
});

test('verified administrators retain access and signed audit attribution', async (t) => {
  const token = await sign({ email: 'Admin@Example.Test' });
  for (const path of ['/api/v1/admin/clients', '/api/v1/admin/tasks', '/api/v1/mailboxes']) {
    const response = await request(t, {
      token, path, headers: Object.fromEntries(Object.keys(spoofedHeaders).map((name) => [name, 'other@example.test'])),
      options: { teamDomain: `${issuer}/cdn-cgi/access/certs` },
    });
    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), { email: admin, role: 'admin' });
  }
  assert.equal((await request(t, { token, serviceToken: false })).status, 401);
  assert.equal((await request(t, { token, options: { adminEmails: [] } })).status, 403);
});

test('invalid, expired, and incomplete assertions fail closed', async (t) => {
  const wrongKey = await generateKeyPair('RS256');
  const tokens = [
    'not-a-jwt',
    await sign({}, wrongKey.privateKey),
    await sign({ iss: 'https://other.example.test' }),
    await sign({ aud: 'different-app' }),
    await sign({ exp: 1 }),
    await sign({ exp: undefined }),
    await sign({ sub: undefined }),
    await sign({ email: undefined }),
    await sign({ email: '' }),
    await sign({ email: [admin] }),
  ];
  for (const token of tokens) {
    assert.equal((await request(t, { token, headers: spoofedHeaders })).status, 403);
  }
});

test('local mode has a fixed identity and never bypasses configured or invalid Access', async (t) => {
  const local = { isLocal: true, teamDomain: '', policyAud: '', adminEmails: [] };
  const response = await request(t, { options: local, headers: spoofedHeaders });
  assert.deepEqual(await response.json(), { email: 'local-admin@example.local', role: 'admin' });
  assert.equal((await request(t, { options: { ...local, adminEmails: [admin] }, headers: spoofedHeaders })).status, 403);
  assert.equal((await request(t, { options: { isLocal: true }, headers: spoofedHeaders })).status, 403);
  assert.equal((await request(t, { options: local, token: 'invalid' })).status, 500);
  assert.equal((await request(t, { options: { ...local, isLocal: false }, headers: spoofedHeaders })).status, 403);
});
