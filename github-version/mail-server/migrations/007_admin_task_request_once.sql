-- One request task per email. The route looks for an existing task before
-- inserting, but two requests arriving together both found none; this index
-- is what actually keeps the second one out.
-- Applied to development with the existing migration runner.
-- Replit Publish applies the schema diff to its managed production database.
--
-- If this fails with "could not create unique index", two tasks already share
-- one email because such a race happened before the index existed. Nothing is
-- deleted for you: decide which task to keep, then run the migrations again.
--   SELECT mailbox_id, request_email_id, count(*) FROM admin_tasks
--    WHERE request_email_id IS NOT NULL GROUP BY 1, 2 HAVING count(*) > 1;
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_tasks_mailbox_email_once
  ON admin_tasks(mailbox_id, request_email_id)
  WHERE mailbox_id IS NOT NULL AND request_email_id IS NOT NULL;
