import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import test from 'node:test';
import express from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';
import { simpleParser } from 'mailparser';

test('Multer 2 preserves buffered attachments and enforces the upload size limit', async (t) => {
  const app = express();
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 } });
  app.post('/upload', upload.single('file'), (req, res) => {
    res.json({
      filename: req.file.originalname, type: req.file.mimetype,
      bytes: [...req.file.buffer], description: req.body.description,
    });
  });
  app.use((err, _req, res, _next) => res.status(400).json({ code: err.code }));
  const server = createServer(app).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/upload`;
  const form = new FormData();
  form.set('description', 'attachment');
  form.set('file', new Blob([new Uint8Array([0, 1, 255])], { type: 'application/octet-stream' }), 'test.bin');
  const response = await fetch(url, { method: 'POST', body: form });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    filename: 'test.bin', type: 'application/octet-stream',
    bytes: [0, 1, 255], description: 'attachment',
  });
  const oversized = new FormData();
  oversized.set('file', new Blob(['123456789']), 'too-big.txt');
  const rejected = await fetch(url, { method: 'POST', body: oversized });
  assert.equal(rejected.status, 400);
  assert.equal((await rejected.json()).code, 'LIMIT_FILE_SIZE');
});

test('Nodemailer 10 and Mailparser round-trip recipients, Unicode and binary attachments', async () => {
  const transport = nodemailer.createTransport({ streamTransport: true, buffer: true });
  const content = Buffer.from([0, 1, 2, 255]);
  const message = await transport.sendMail({
    from: 'Sender <sender@example.com>', to: 'Recipient <recipient@example.com>',
    subject: '캠페인 attachment', text: 'Plain text',
    html: '<p>Hello <b>recipient</b></p>',
    attachments: [{ filename: 'test.bin', content, contentType: 'application/octet-stream' }],
  });
  const parsed = await simpleParser(message.message);
  assert.equal(parsed.subject, '캠페인 attachment');
  assert.equal(parsed.to.value[0].address, 'recipient@example.com');
  assert.equal(parsed.from.value[0].address, 'sender@example.com');
  assert.match(parsed.text, /Plain text/);
  assert.match(parsed.html, /<b>recipient<\/b>/);
  assert.equal(parsed.attachments.length, 1);
  assert.equal(parsed.attachments[0].filename, 'test.bin');
  assert.deepEqual(parsed.attachments[0].content, content);
  transport.close();
});
