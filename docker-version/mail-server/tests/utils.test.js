import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { isTerminalTaskStatus } from '../src/lib/domain.js';
import { getBoundedPagination } from '../src/lib/http.js';

describe('getBoundedPagination', () => {
  it('defaults to page 1, limit 20', () => {
    const r = getBoundedPagination(undefined, undefined);
    assert.deepEqual(r, { page: 1, limit: 20, offset: 0 });
  });

  it('clamps limit to maxLimit', () => {
    const r = getBoundedPagination(1, 9999);
    assert.equal(r.limit, 100);
  });

  it('clamps limit minimum to 1', () => {
    const r = getBoundedPagination(1, -5);
    assert.equal(r.limit, 1);
  });

  it('clamps page minimum to 1', () => {
    const r = getBoundedPagination(-3, 10);
    assert.equal(r.page, 1);
    assert.equal(r.offset, 0);
  });

  it('computes correct offset', () => {
    const r = getBoundedPagination(3, 10);
    assert.equal(r.offset, 20);
  });

  it('handles string inputs', () => {
    const r = getBoundedPagination('2', '25');
    assert.deepEqual(r, { page: 2, limit: 25, offset: 25 });
  });
});

describe('isTerminalTaskStatus', () => {
  it('returns true for done', () => assert.equal(isTerminalTaskStatus('done'), true));
  it('returns true for closed', () => assert.equal(isTerminalTaskStatus('closed'), true));
  it('returns false for blocked', () => assert.equal(isTerminalTaskStatus('blocked'), false));
  it('returns false for waiting_client', () => assert.equal(isTerminalTaskStatus('waiting_client'), false));
  it('returns false for empty string', () => assert.equal(isTerminalTaskStatus(''), false));
});
