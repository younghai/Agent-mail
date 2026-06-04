ALTER TABLE emails
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS provider_message_id TEXT,
  ADD COLUMN IF NOT EXISTS approval_state TEXT,
  ADD COLUMN IF NOT EXISTS approval_meta JSONB,
  ADD COLUMN IF NOT EXISTS agent_summary TEXT,
  ADD COLUMN IF NOT EXISTS agent_timeline_json JSONB,
  ADD COLUMN IF NOT EXISTS agent_tasks_json JSONB,
  ADD COLUMN IF NOT EXISTS citations_json TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_emails_provider_message_identity
  ON emails(mailbox_id, provider, provider_message_id)
  WHERE provider_message_id IS NOT NULL AND provider_message_id <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_emails_mailbox_message_id
  ON emails(mailbox_id, LOWER(message_id))
  WHERE message_id IS NOT NULL AND message_id <> '';

CREATE INDEX IF NOT EXISTS idx_emails_approval_state
  ON emails(mailbox_id, approval_state)
  WHERE approval_state IS NOT NULL;

CREATE TABLE IF NOT EXISTS agent_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mailbox_id UUID NOT NULL REFERENCES mailboxes(id) ON DELETE CASCADE,
  call_id TEXT NOT NULL,
  session_id TEXT,
  score INT NOT NULL CHECK (score IN (-1, 1)),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(mailbox_id, call_id, score)
);

CREATE INDEX IF NOT EXISTS idx_agent_feedback_mailbox_created
  ON agent_feedback(mailbox_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mailbox_id UUID NOT NULL REFERENCES mailboxes(id) ON DELETE CASCADE,
  email_id UUID REFERENCES emails(id) ON DELETE SET NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('summary', 'timeline', 'task_extraction', 'draft_generation')),
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'blocked', 'dead_letter')),
  attempt_count INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  result_json JSONB,
  error_code TEXT,
  error_message TEXT,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_jobs_mailbox_status
  ON ai_jobs(mailbox_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_jobs_email_type
  ON ai_jobs(email_id, job_type, updated_at DESC);
