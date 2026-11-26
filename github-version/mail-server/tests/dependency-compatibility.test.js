import assert from 'node:assert/strict';
import test from 'node:test';
import nodemailer from 'nodemailer';
import { simpleParser } from 'mailparser';

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
