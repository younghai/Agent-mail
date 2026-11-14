-- Applied to development with the existing migration runner.
-- Replit Publish applies the schema diff to its managed production database.
CREATE TABLE IF NOT EXISTS inbox_web_sessions (
  token_hash TEXT PRIMARY KEY,
  credential_version TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS inbox_web_sessions_expiry ON inbox_web_sessions (expires_at);

CREATE TABLE IF NOT EXISTS inbox_login_limits (
  key_hash TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  resets_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS inbox_login_limits_expiry ON inbox_login_limits (resets_at);
