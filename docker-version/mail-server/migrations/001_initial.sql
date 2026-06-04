-- v1 PostgreSQL Initial Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mailbox_id UUID NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL DEFAULT 'custom',
    is_system BOOLEAN NOT NULL DEFAULT false,
    is_deletable BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(mailbox_id, name)
);
CREATE INDEX idx_folders_mailbox ON folders(mailbox_id);

CREATE TABLE mailboxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    domain TEXT NOT NULL DEFAULT 'bizmatrixx.com',
    settings JSONB DEFAULT '{}',
    ai_provider TEXT DEFAULT 'openai',
    ai_model TEXT DEFAULT 'gpt-4o',
    ai_system_prompt TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mailboxes_email ON mailboxes(email);

CREATE TABLE emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mailbox_id UUID NOT NULL REFERENCES mailboxes(id) ON DELETE CASCADE,
    folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
    thread_id TEXT,
    subject TEXT,
    sender TEXT,
    sender_name TEXT,
    recipient TEXT,
    cc TEXT,
    bcc TEXT,
    body_text TEXT,
    body_html TEXT,
    message_id TEXT,
    in_reply_to TEXT,
    email_references JSONB,
    raw_headers JSONB,
    is_read BOOLEAN NOT NULL DEFAULT false,
    is_starred BOOLEAN NOT NULL DEFAULT false,
    is_draft BOOLEAN NOT NULL DEFAULT false,
    email_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_emails_mailbox_folder ON emails(mailbox_id, folder_id, received_at DESC);
CREATE INDEX idx_emails_thread ON emails(thread_id, received_at DESC);
CREATE INDEX idx_emails_sender ON emails(sender);
CREATE INDEX idx_emails_date ON emails(received_at DESC);

ALTER TABLE emails ADD COLUMN search_vector TSVECTOR;
CREATE INDEX idx_emails_search ON emails USING GIN(search_vector);

CREATE OR REPLACE FUNCTION emails_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('simple', COALESCE(NEW.subject, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.sender_name, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.body_text, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER emails_search_vector_trigger
    BEFORE INSERT OR UPDATE ON emails
    FOR EACH ROW EXECUTE FUNCTION emails_search_vector_update();

CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    mimetype TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_key TEXT NOT NULL,
    content_id TEXT,
    disposition TEXT DEFAULT 'attachment',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_attachments_email ON attachments(email_id);

CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mailbox_id UUID NOT NULL REFERENCES mailboxes(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tool_calls JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_conv_session ON ai_conversations(session_id, created_at DESC);
CREATE INDEX idx_ai_conv_mailbox ON ai_conversations(mailbox_id, created_at DESC);

CREATE TABLE admin_clients (
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
);
CREATE INDEX idx_admin_clients_status ON admin_clients(status);

CREATE TABLE admin_tasks (
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
);
CREATE INDEX idx_admin_tasks_client_status ON admin_tasks(client_id, status);
CREATE INDEX idx_admin_tasks_status_due ON admin_tasks(status, due_date);

CREATE TABLE admin_task_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES admin_tasks(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    from_status TEXT,
    to_status TEXT,
    actor_email TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_task_events_task ON admin_task_events(task_id, created_at DESC);

CREATE TABLE admin_agent_usage_events (
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
);
CREATE INDEX idx_admin_usage_created ON admin_agent_usage_events(created_at DESC);
CREATE INDEX idx_admin_usage_agent_created ON admin_agent_usage_events(agent_id, created_at DESC);

CREATE TABLE admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    actor_email TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    before_json JSONB,
    after_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_audit_entity ON admin_audit_logs(entity_type, entity_id, created_at DESC);

INSERT INTO mailboxes (id, email, name, domain) VALUES
    ('00000000-0000-0000-0000-000000000001', 'bzengage@example.com', 'bzengage@example.com', 'bizmatrixx.com');

INSERT INTO folders (mailbox_id, name, slug, is_system, is_deletable, sort_order) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Inbox', 'inbox', true, false, 0),
    ('00000000-0000-0000-0000-000000000001', 'Sent', 'sent', true, false, 1),
    ('00000000-0000-0000-0000-000000000001', 'Drafts', 'draft', true, false, 2),
    ('00000000-0000-0000-0000-000000000001', 'Trash', 'trash', true, false, 3),
    ('00000000-0000-0000-0000-000000000001', 'Archive', 'archive', true, false, 4),
    ('00000000-0000-0000-0000-000000000001', 'Spam', 'spam', true, false, 5);
