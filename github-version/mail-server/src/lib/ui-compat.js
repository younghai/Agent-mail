const DEFAULT_MAILBOX_EMAIL = 'bzengage@example.com';
const SYSTEM_FOLDER_IDS = new Set(['inbox', 'sent', 'draft', 'archive', 'spam', 'trash']);

function localPart(email) {
  return String(email || '').split('@')[0] || 'Mailbox';
}

function mailboxDisplayName(row, defaultMailboxName) {
  const configuredDefault = String(defaultMailboxName || '').trim();
  const name = String(row.name || '').trim();
  const email = String(row.email || '').trim();
  const fallbackNames = new Set([email, localPart(email)]);

  if (configuredDefault && email.toLowerCase() === DEFAULT_MAILBOX_EMAIL && (!name || fallbackNames.has(name))) {
    return configuredDefault;
  }
  return name || localPart(email);
}

export function serializeMailbox(row, options = {}) {
  return {
    ...row,
    uuid: row.id,
    id: row.email,
    name: mailboxDisplayName(row, options.defaultMailboxName),
    settings: row.settings || {},
  };
}

export function serializeFolder(row) {
  const isSystem = Boolean(row.is_system);
  const slug = String(row.slug || '');
  return {
    ...row,
    uuid: row.id,
    id: isSystem && SYSTEM_FOLDER_IDS.has(slug) ? slug : row.id,
    unreadCount: row.unread_count || 0,
    isSystem,
    isDeletable: Boolean(row.is_deletable),
    sortOrder: row.sort_order,
  };
}

// Every email column the client reads, named once. The email endpoints share
// this list and differ only in what they add: bodies, attachments, counters.
const EMAIL_COLUMNS = `e.id, e.mailbox_id, e.folder_id, e.thread_id, e.subject, e.sender, e.sender_name,
  e.recipient, e.cc, e.bcc, e.message_id, e.in_reply_to, e.email_references, e.raw_headers,
  e.is_read, e.is_starred, e.is_draft, e.email_date, e.received_at, e.created_at, e.updated_at,
  e.provider, e.provider_message_id, e.approval_state, e.approval_meta, e.citations_json,
  e.agent_summary, e.agent_timeline_json, e.agent_tasks_json`;

// List and search rows carry a snippet; the panel fetches the full message.
export const EMAIL_SUMMARY_COLUMNS = `${EMAIL_COLUMNS}, LEFT(COALESCE(e.body_text, ''), 200) AS snippet`;
export const EMAIL_FULL_COLUMNS = `${EMAIL_COLUMNS}, e.body_text, e.body_html`;

// One shape for every email the client receives, whichever endpoint sent it.
// `search_vector` is an index helper and never leaves the server.
export function serializeEmail(row, attachments = []) {
  const { is_read, is_starred, email_date, body_html, body_text, ...email } = row;
  return {
    ...email,
    read: is_read,
    starred: is_starred,
    date: email_date ?? email.received_at ?? null,
    body: body_html || body_text || null,
    body_html: body_html || null,
    body_text: body_text || null,
    attachments,
  };
}

export function serializeAttachment({ storage_key, size_bytes, ...attachment }) {
  return { ...attachment, size: size_bytes == null ? null : Number(size_bytes) };
}
