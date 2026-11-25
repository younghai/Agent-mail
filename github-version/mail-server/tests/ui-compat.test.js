import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
  serializeAttachment, serializeEmail, serializeFolder, serializeMailbox,
} from '../src/lib/ui-compat.js';

describe('serializeMailbox', () => {
  it('uses email as the browser route id and preserves UUID separately', () => {
    const mailbox = serializeMailbox({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'bzengage@example.com',
      name: 'VTStirelab',
      settings: null,
    });

    assert.equal(mailbox.id, 'bzengage@example.com');
    assert.equal(mailbox.uuid, '00000000-0000-0000-0000-000000000001');
    assert.equal(mailbox.name, 'VTStirelab');
    assert.deepEqual(mailbox.settings, {});
  });

  it('applies the configured default display name for the seeded mailbox', () => {
    const mailbox = serializeMailbox(
      {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'bzengage@example.com',
        name: 'bzengage@example.com',
      },
      { defaultMailboxName: 'VTStirelab' },
    );

    assert.equal(mailbox.name, 'VTStirelab');
  });
});

describe('serializeFolder', () => {
  it('uses stable system folder slugs for the React menu', () => {
    const folder = serializeFolder({
      id: 'c66dab0e-7a69-40d3-bd0d-0f5ce65a611e',
      slug: 'inbox',
      is_system: true,
      is_deletable: false,
      sort_order: 0,
      unread_count: 11,
    });

    assert.equal(folder.id, 'inbox');
    assert.equal(folder.uuid, 'c66dab0e-7a69-40d3-bd0d-0f5ce65a611e');
    assert.equal(folder.unreadCount, 11);
    assert.equal(folder.isSystem, true);
    assert.equal(folder.isDeletable, false);
    assert.equal(folder.sortOrder, 0);
  });
});

describe('serializeEmail', () => {
  const row = {
    id: 'e1', subject: 'Launch', is_read: false, is_starred: true,
    email_date: '2026-11-16T00:00:00.000Z', received_at: '2026-11-16T00:09:00.000Z',
    body_html: '<p>Hi</p>', body_text: 'Hi',
  };

  it('uses the names the client reads: read, starred, date, body', () => {
    const email = serializeEmail(row);
    assert.equal(email.read, false);
    assert.equal(email.starred, true);
    assert.equal(email.date, row.email_date);
    assert.equal(email.body, '<p>Hi</p>');
    assert.equal(email.is_read, undefined);
    assert.equal(email.email_date, undefined);
    assert.deepEqual(email.attachments, []);
  });

  it('falls back to plain text, then to the arrival time', () => {
    assert.equal(serializeEmail({ ...row, body_html: null }).body, 'Hi');
    assert.equal(serializeEmail({ ...row, email_date: null }).date, row.received_at);
  });

  it('has the same keys with or without a body, and the body is null on summary rows', () => {
    const summary = serializeEmail({ ...row, body_html: undefined, body_text: undefined, snippet: 'Hi' });
    const keysOf = (email) => Object.keys(email).filter((key) => key !== 'snippet').sort();
    assert.deepEqual(keysOf(summary), keysOf(serializeEmail(row)));
    assert.deepEqual([summary.body, summary.body_html, summary.body_text], [null, null, null]);
  });
});

describe('serializeAttachment', () => {
  it('exposes the size as a number and keeps the storage key internal', () => {
    const attachment = serializeAttachment({
      id: 'a1', filename: 'brief.pdf', mimetype: 'application/pdf', size_bytes: '2048', storage_key: 'mailbox/a1',
    });
    assert.deepEqual(attachment, { id: 'a1', filename: 'brief.pdf', mimetype: 'application/pdf', size: 2048 });
  });
});
