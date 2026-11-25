import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSearch } from '../src/lib/search.js';

const build = (params) => buildSearch({ mailboxId: 'mailbox-1', ...params });
const message = (params) => assert.throws(() => build(params), (error) => error.status === 400 && error.code === 'VALIDATION_ERROR');

test('free text matches the search vector and every value is bound', () => {
  assert.deepEqual(build({ q: 'OLED launch' }), {
    where: "e.mailbox_id = $1 AND e.search_vector @@ plainto_tsquery('simple', $2)",
    params: ['mailbox-1', 'OLED launch'],
  });
});

test('the operators the client parses each become one predicate', () => {
  const search = build({
    from: 'LG.example', to: 'review@example.test', subject: '런칭', folder: 'inbox',
    is_read: 'false', is_starred: 'true', has_attachment: 'true',
    date_start: '2026-11-01T00:00:00.000Z', date_end: '2026-12-01T00:00:00.000Z',
  });
  assert.equal(search.where, [
    'e.mailbox_id = $1', 'LOWER(e.sender) LIKE $2', 'LOWER(e.recipient) LIKE $3', 'LOWER(e.subject) LIKE $4',
    'e.folder_id IN (SELECT id FROM folders WHERE mailbox_id = $5 AND (slug = $6 OR LOWER(name) = $7))',
    'e.is_read = $8', 'e.is_starred = $9',
    'EXISTS (SELECT 1 FROM attachments a WHERE a.email_id = e.id)',
    'e.received_at >= $10::timestamptz', 'e.received_at < $11::timestamptz',
  ].join(' AND '));
  assert.deepEqual(search.params, [
    'mailbox-1', '%lg.example%', '%review@example.test%', '%런칭%', 'mailbox-1', 'inbox', 'inbox', false, true,
    '2026-11-01T00:00:00.000Z', '2026-12-01T00:00:00.000Z',
  ]);
});

test('operators narrow the search on their own and cannot be smuggled through a value', () => {
  assert.deepEqual(build({ folder: 'draft' }), {
    where: 'e.mailbox_id = $1 AND e.folder_id IN (SELECT id FROM folders WHERE mailbox_id = $2 AND (slug = $3 OR LOWER(name) = $4))',
    params: ['mailbox-1', 'mailbox-1', 'draft', 'draft'],
  });
  assert.equal(build({ from: "x' OR 1=1 --" }).params[1], "%x' or 1=1 --%");
  message({ q: 'x'.repeat(501) });
});

test('malformed or empty searches are rejected before any query runs', () => {
  message({});
  message({ is_read: 'maybe' });
  message({ is_starred: 'true', has_attachment: 'yes' });
  message({ date_start: 'not-a-date' });
  message({ after: '2026-11-01' });
  message({ from: ['a@example.test', 'b@example.test'] });
  message({ q: { nested: true } });
});
