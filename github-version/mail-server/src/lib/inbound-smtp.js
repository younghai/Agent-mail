import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import { v4 as uuidv4 } from 'uuid';
import { upsertInboundEmail } from './inbound-email.js';

/**
 * SMTP 수신 서버 생성.
 * @param {{ query: Function, publishEmailEvent: Function }} deps
 * @returns {SMTPServer}
 */
export function createInboundSmtpServer({ query, publishEmailEvent }) {
  const server = new SMTPServer({
    authOptional: true,  // 개발 환경 인증 생략
    allowInsecureAuth: true,
    disabledCommands: ['STARTTLS'],  // 내부 서버이므로 TLS 생략

    async onData(stream, session, callback) {
      try {
        const parsed = await simpleParser(stream);
        const recipient = session.envelope.rcptTo[0]?.address || '';
        const sender = session.envelope.mailFrom?.address || parsed.from?.value?.[0]?.address || '';

        // recipient(수신 주소)로 mailbox 찾기
        const { rows: mbRows } = await query(
          'SELECT id FROM mailboxes WHERE email = $1',
          [recipient.toLowerCase()]
        );
        if (!mbRows.length) {
          callback(new Error(`Mailbox not found for ${recipient}`));
          return;
        }
        const mailboxId = mbRows[0].id;

        // inbox 폴더 찾기
        const { rows: folderRows } = await query(
          'SELECT id FROM folders WHERE mailbox_id = $1 AND slug = $2',
          [mailboxId, 'inbox']
        );
        const folderId = folderRows[0]?.id;
        if (!folderId) { callback(new Error('Inbox folder not found')); return; }

        const inReplyTo = parsed.inReplyTo || null;
        const messageId = parsed.messageId || null;

        const result = await upsertInboundEmail({
          query,
          mailboxId,
          folderId,
          email: {
            id: uuidv4(),
            subject: parsed.subject,
            sender,
            recipient,
            body_text: parsed.text,
            body_html: parsed.html,
            message_id: messageId,
            in_reply_to: inReplyTo,
            provider: 'smtp',
          },
        });

        if (result.inserted) {
          await publishEmailEvent('new_email', {
            email_id: result.id, mailbox_id: mailboxId,
            sender, subject: parsed.subject || '', thread_id: result.thread_id,
            body_text: parsed.text || '',
          });
        }

        callback();
      } catch (err) {
        callback(err);
      }
    },
  });

  return server;
}
