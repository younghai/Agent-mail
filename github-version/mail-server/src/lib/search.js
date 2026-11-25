import { validationError } from './http.js';

// Turns the parameters the client's search-parser sends into SQL. Only fixed
// predicates reach the database; every value the user typed is bound.

function text(query, name) {
  const value = query[name];
  if (value === undefined) return '';
  if (typeof value !== 'string' || value.length > 500) validationError(`${name} must be a string of 500 characters or fewer`);
  return value.trim();
}

function flag(query, name) {
  const value = text(query, name);
  if (value === '') return undefined;
  if (value !== 'true' && value !== 'false') validationError(`${name} must be true or false`);
  return value === 'true';
}

function date(query, name) {
  const value = text(query, name);
  if (value === '') return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) validationError(`${name} must be a date`);
  return parsed.toISOString();
}

export function buildSearch(query) {
  const where = ['e.mailbox_id = $1'];
  const params = [query.mailboxId];
  const add = (predicate, ...values) => {
    let index = params.length;
    where.push(predicate.replace(/\?/g, () => `$${++index}`));
    params.push(...values);
  };

  const q = text(query, 'q');
  if (q) add(`e.search_vector @@ plainto_tsquery('simple', ?)`, q);
  for (const [name, column] of [['from', 'e.sender'], ['to', 'e.recipient'], ['subject', 'e.subject']]) {
    const value = text(query, name);
    if (value) add(`LOWER(${column}) LIKE ?`, `%${value.toLowerCase()}%`);
  }
  const folder = text(query, 'folder');
  if (folder) {
    add('e.folder_id IN (SELECT id FROM folders WHERE mailbox_id = ? AND (slug = ? OR LOWER(name) = ?))', query.mailboxId, folder, folder);
  }
  for (const [name, column] of [['is_read', 'e.is_read'], ['is_starred', 'e.is_starred']]) {
    const value = flag(query, name);
    if (value !== undefined) add(`${column} = ?`, value);
  }
  if (flag(query, 'has_attachment')) add('EXISTS (SELECT 1 FROM attachments a WHERE a.email_id = e.id)');
  const dateStart = date(query, 'date_start');
  if (dateStart) add('e.received_at >= ?::timestamptz', dateStart);
  const dateEnd = date(query, 'date_end');
  if (dateEnd) add('e.received_at < ?::timestamptz', dateEnd);

  // An empty search would list the whole mailbox while looking like a result set.
  if (where.length === 1) validationError('Provide a search term (q) or a filter such as from, in or is');
  return { where: where.join(' AND '), params };
}
