import { pool } from './db.js';

const statements = [
  'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"',
  `CREATE TABLE IF NOT EXISTS admin_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    email TEXT,
    owner TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
    tags JSONB NOT NULL DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  'CREATE INDEX IF NOT EXISTS idx_admin_clients_status ON admin_clients(status)',
  `CREATE TABLE IF NOT EXISTS admin_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES admin_clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'task' CHECK (type IN ('request', 'issue', 'task', 'project', 'draft')),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'triaged', 'assigned', 'in_progress', 'waiting_client', 'waiting_internal', 'done', 'closed', 'blocked')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    owner TEXT,
    due_date DATE,
    completion INT NOT NULL DEFAULT 0 CHECK (completion >= 0 AND completion <= 100),
    mailbox_id UUID REFERENCES mailboxes(id) ON DELETE SET NULL,
    request_email_id UUID REFERENCES emails(id) ON DELETE SET NULL,
    issue TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  'CREATE INDEX IF NOT EXISTS idx_admin_tasks_client_status ON admin_tasks(client_id, status)',
  'CREATE INDEX IF NOT EXISTS idx_admin_tasks_status_due ON admin_tasks(status, due_date)',
  'CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_tasks_mailbox_email_once ON admin_tasks(mailbox_id, request_email_id) WHERE mailbox_id IS NOT NULL AND request_email_id IS NOT NULL',
  `CREATE TABLE IF NOT EXISTS admin_task_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES admin_tasks(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    from_status TEXT,
    to_status TEXT,
    actor_email TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  'CREATE INDEX IF NOT EXISTS idx_admin_task_events_task ON admin_task_events(task_id, created_at DESC)',
  `CREATE TABLE IF NOT EXISTS admin_agent_usage_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    model TEXT,
    input_tokens INT NOT NULL DEFAULT 0,
    output_tokens INT NOT NULL DEFAULT 0,
    cost_usd NUMERIC(12, 6) NOT NULL DEFAULT 0,
    latency_ms INT,
    status TEXT NOT NULL CHECK (status IN ('ok', 'error', 'blocked')),
    error_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  'CREATE INDEX IF NOT EXISTS idx_admin_usage_created ON admin_agent_usage_events(created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_admin_usage_agent_created ON admin_agent_usage_events(agent_id, created_at DESC)',
  `CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    actor_email TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    before_json JSONB,
    after_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  'CREATE INDEX IF NOT EXISTS idx_admin_audit_entity ON admin_audit_logs(entity_type, entity_id, created_at DESC)',
];

try {
  for (const statement of statements) {
    await pool.query(statement);
  }
  console.log('Admin schema repair complete');
} finally {
  await pool.end();
}
