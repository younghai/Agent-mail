export const NODE_ENV = process.env.NODE_ENV || 'development';
export const REPLIT_WEB_ENABLED = process.env.REPLIT_WEB_ENABLED === 'true';
export const IS_LOCAL_ENV = ['development', 'local', 'test'].includes(NODE_ENV);
export const LOCAL_SERVICE_TOKEN = process.env.LOCAL_SERVICE_TOKEN || '';
export const AI_AGENT_URL = process.env.AI_AGENT_URL || 'http://ai-agent:8000';
export const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
export const DEFAULT_MAILBOX_NAME = process.env.DEFAULT_MAILBOX_NAME || '';

export function parseCsv(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export const CORS_ORIGINS = parseCsv(process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173');
export const ADMIN_EMAILS = parseCsv(process.env.ADMIN_EMAILS || '');
export const TEAM_DOMAIN = process.env.TEAM_DOMAIN || '';
export const POLICY_AUD = process.env.POLICY_AUD || '';
// 프로덕션에서는 반드시 APP_DOMAINS 또는 MAIL_DOMAINS 환경변수를 설정할 것.
// 미설정 시 도메인 기반 라우팅이 비활성화됨.
export const APP_DOMAINS = parseCsv(process.env.APP_DOMAINS || process.env.MAIL_DOMAINS || '');

export function assertProductionConfig() {
  if (REPLIT_WEB_ENABLED) {
    if (NODE_ENV !== 'production') throw new Error('Replit web authentication requires NODE_ENV=production');
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for Replit production');
    if ((process.env.SESSION_SECRET || '').length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters');
    if (process.env.RUN_MIGRATIONS === 'true') throw new Error('Production schema changes must use the Replit Publish flow');
    return;
  }
  if (!LOCAL_SERVICE_TOKEN && !IS_LOCAL_ENV) {
    throw new Error('LOCAL_SERVICE_TOKEN is required outside development');
  }
  if (!ADMIN_EMAILS.length && !IS_LOCAL_ENV) {
    throw new Error('ADMIN_EMAILS is required outside local development');
  }
  if ((!TEAM_DOMAIN || !POLICY_AUD) && !IS_LOCAL_ENV) {
    throw new Error('TEAM_DOMAIN and POLICY_AUD are required outside local development');
  }
}
