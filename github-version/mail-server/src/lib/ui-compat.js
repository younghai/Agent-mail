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
