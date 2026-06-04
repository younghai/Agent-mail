import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import { v4 as uuidv4 } from 'uuid';

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

        const id = uuidv4();
        const inReplyTo = parsed.inReplyTo || null;
        const resolvedThread = inReplyTo || id;
        const messageId = parsed.messageId || null;

        await query(
          `INSERT INTO emails
            (id, mailbox_id, folder_id, thread_id, subject, sender, recipient,
             body_text, body_html, message_id, in_reply_to)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [
            id, mailboxId, folderId, resolvedThread,
            parsed.subject || '(No subject)',
            sender, recipient,
            parsed.text || '',
            parsed.html || '',
            messageId, inReplyTo,
          ]
        );

        await publishEmailEvent('new_email', {
          email_id: id, mailbox_id: mailboxId,
          sender, subject: parsed.subject || '', thread_id: resolvedThread,
          body_text: parsed.text || '',
        });

        callback();
      } catch (err) {
        callback(err);
      }
    },
  });

  return server;
}
