import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { serializeFolder, serializeMailbox } from '../src/lib/ui-compat.js';

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
