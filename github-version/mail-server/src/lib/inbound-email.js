export function normalizeMessageId(value) {
  return String(value || '')
    .trim()
    .replace(/^<+/, '')
    .replace(/>+$/, '')
    .toLowerCase();
}

export function resolveInboundDeduplication(input = {}) {
  const provider = String(input.provider || 'local').trim().toLowerCase() || 'local';
  const providerMessageId = String(input.providerMessageId || '').trim();
  const messageId = normalizeMessageId(input.messageId);
  const dedupeKey = providerMessageId
    ? `provider:${provider}:${providerMessageId}`
    : messageId
      ? `message:${messageId}`
      : '';
  return { provider, providerMessageId, messageId, dedupeKey };
}

export async function upsertInboundEmail({ query, mailboxId, folderId, email }) {
  const dedupe = resolveInboundDeduplication({
    provider: email.provider,
    providerMessageId: email.provider_message_id || email.providerMessageId,
    messageId: email.message_id || email.messageId,
  });

  if (dedupe.providerMessageId) {
    const { rows } = await query(
      `SELECT id, thread_id FROM emails
        WHERE mailbox_id = $1 AND provider = $2 AND provider_message_id = $3
        LIMIT 1`,
      [mailboxId, dedupe.provider, dedupe.providerMessageId],
    );
    if (rows.length) return { id: rows[0].id, thread_id: rows[0].thread_id, inserted: false };
  }

  if (dedupe.messageId) {
    const { rows } = await query(
      `SELECT id, thread_id FROM emails
        WHERE mailbox_id = $1 AND LOWER(message_id) = $2
        LIMIT 1`,
      [mailboxId, dedupe.messageId],
    );
    if (rows.length) return { id: rows[0].id, thread_id: rows[0].thread_id, inserted: false };
  }

  const id = email.id;
  const resolvedThread = email.thread_id || email.in_reply_to || dedupe.messageId || id;
  await query(
    `INSERT INTO emails
       (id, mailbox_id, folder_id, thread_id, subject, sender, recipient, body_text, body_html,
        message_id, in_reply_to, provider, provider_message_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NULLIF($10, ''), $11, $12, NULLIF($13, ''))`,
    [
      id,
      mailboxId,
      folderId,
      resolvedThread,
      email.subject || '(No subject)',
      email.sender || '',
      email.recipient || '',
      email.body_text || '',
      email.body_html || '',
      dedupe.messageId,
      email.in_reply_to || null,
      dedupe.provider,
      dedupe.providerMessageId,
    ],
  );
  return { id, thread_id: resolvedThread, inserted: true };
}
