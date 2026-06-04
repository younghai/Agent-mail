CREATE TABLE IF NOT EXISTS smtp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mailbox_id UUID REFERENCES mailboxes(id) ON DELETE CASCADE,
  -- null mailbox_id = 전역 설정
  host TEXT NOT NULL,
  port INTEGER NOT NULL DEFAULT 587,
  secure BOOLEAN NOT NULL DEFAULT false,
  username TEXT,
  password TEXT,
  from_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_smtp_config_mailbox ON smtp_config(mailbox_id) WHERE mailbox_id IS NOT NULL;
CREATE UNIQUE INDEX idx_smtp_config_global ON smtp_config((mailbox_id IS NULL)) WHERE mailbox_id IS NULL;
