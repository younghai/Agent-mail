import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import test from 'node:test';

test('S3 storage preserves bucket, upload, signed download and deletion contracts', async (t) => {
  const requests = [];
  let bucketStatus = 404;
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    requests.push({
      method: req.method, path: req.url, headers: req.headers,
      body: Buffer.concat(chunks),
    });
    res.statusCode = req.method === 'HEAD' ? bucketStatus : 200;
    res.end();
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const original = { ...process.env };
  t.after(() => {
    for (const key of ['S3_ENDPOINT', 'S3_ACCESS_KEY', 'S3_SECRET_KEY', 'S3_BUCKET']) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  });
  const endpoint = `http://127.0.0.1:${server.address().port}`;
  Object.assign(process.env, {
    S3_ENDPOINT: endpoint, S3_ACCESS_KEY: 'test-access',
    S3_SECRET_KEY: 'test-secret', S3_BUCKET: 'storage-test',
  });
  const storage = await import('../src/storage.js');

  await storage.ensureBucket();
  assert.deepEqual(requests.map((r) => r.method), ['HEAD', 'PUT']);
  bucketStatus = 200;
  await storage.ensureBucket();
  assert.deepEqual(requests.map((r) => r.method), ['HEAD', 'PUT', 'HEAD']);

  const body = Buffer.from([0, 1, 255, 10]);
  await storage.uploadObject('mailbox/a file.bin', body, 'application/octet-stream', body.length);
  const upload = requests.at(-1);
  assert.equal(upload.method, 'PUT');
  assert.equal(new URL(upload.path, endpoint).pathname, '/storage-test/mailbox/a%20file.bin');
  assert.deepEqual(upload.body, body);
  assert.equal(upload.headers['content-type'], 'application/octet-stream');
  assert.equal(upload.headers['content-length'], String(body.length));
  assert.match(upload.headers.authorization, /^AWS4-HMAC-SHA256 /);

  const url = new URL(await storage.presignGetUrl('mailbox/a file.bin'));
  assert.equal(url.origin, endpoint);
  assert.equal(url.pathname, '/storage-test/mailbox/a%20file.bin');
  assert.equal(url.searchParams.get('X-Amz-Expires'), '3600');
  assert.ok(url.searchParams.get('X-Amz-Signature'));

  await storage.deleteObject('mailbox/a file.bin');
  assert.equal(requests.at(-1).method, 'DELETE');
  // A denied HEAD must not be mistaken for a missing bucket.
  bucketStatus = 403;
  const before = requests.length;
  const warn = console.warn;
  console.warn = () => {};
  try {
    await storage.ensureBucket();
  } finally {
    console.warn = warn;
  }
  assert.equal(requests.length, before + 1);
  assert.equal(requests.at(-1).method, 'HEAD');
});
