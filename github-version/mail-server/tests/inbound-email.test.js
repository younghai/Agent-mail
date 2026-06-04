import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
  normalizeMessageId,
  resolveInboundDeduplication,
} from '../src/lib/inbound-email.js';

describe('normalizeMessageId', () => {
  it('normalizes message id casing and wrappers', () => {
    assert.equal(normalizeMessageId('  <ABC@example.COM>  '), 'abc@example.com');
  });

  it('keeps empty values empty', () => {
    assert.equal(normalizeMessageId(null), '');
    assert.equal(normalizeMessageId(''), '');
  });
});

describe('resolveInboundDeduplication', () => {
  it('prefers provider message identity when available', () => {
    const result = resolveInboundDeduplication({
      provider: 'graph',
      providerMessageId: ' AAMkAGVm ',
      messageId: '<fallback@example.com>',
    });

    assert.deepEqual(result, {
      provider: 'graph',
      providerMessageId: 'AAMkAGVm',
      messageId: 'fallback@example.com',
      dedupeKey: 'provider:graph:AAMkAGVm',
    });
  });

  it('falls back to RFC message id when provider identity is missing', () => {
    const result = resolveInboundDeduplication({
      messageId: '<MSG@example.com>',
    });

    assert.deepEqual(result, {
      provider: 'local',
      providerMessageId: '',
      messageId: 'msg@example.com',
      dedupeKey: 'message:msg@example.com',
    });
  });
});
