import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { compatRoutePaths } from '../src/routes/compat.js';

describe('compatRoutePaths', () => {
  it('declares the client-facing routes that the React app calls', () => {
    const expected = [
      'POST /api/v1/mailboxes/:mailboxId/emails/:id/reply',
      'POST /api/v1/mailboxes/:mailboxId/emails/:id/forward',
      'POST /api/v1/mailboxes/:mailboxId/agent-feedback',
      'DELETE /api/v1/mailboxes/:mailboxId/agent-feedback/:callId/:score',
      'GET /api/v1/mailboxes/:mailboxId/agent-feedback/summary',
      'GET /api/v1/mailboxes/:mailboxId/approvals',
      'POST /api/v1/mailboxes/:mailboxId/drafts/:emailId/approval',
      'GET /api/v1/admin/cost/daily',
      'GET /api/v1/admin/cost/monthly',
      'GET /api/v1/admin/cost/models',
      'GET /api/v1/mailboxes/:mailboxId/segments',
      'GET /api/v1/mailboxes/:mailboxId/admin/sla',
    ];

    for (const route of expected) {
      assert.equal(compatRoutePaths.includes(route), true, `${route} is registered`);
    }
  });
});
