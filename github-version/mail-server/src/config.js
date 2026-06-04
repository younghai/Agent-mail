export const NODE_ENV = process.env.NODE_ENV || 'development';
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
// 프로덕션에서는 반드시 APP_DOMAINS 또는 MAIL_DOMAINS 환경변수를 설정할 것.
// 미설정 시 도메인 기반 라우팅이 비활성화됨.
export const APP_DOMAINS = parseCsv(process.env.APP_DOMAINS || process.env.MAIL_DOMAINS || '');

export function assertProductionConfig() {
  if (!LOCAL_SERVICE_TOKEN && !IS_LOCAL_ENV) {
    throw new Error('LOCAL_SERVICE_TOKEN is required outside development');
  }
  if (!ADMIN_EMAILS.length && !IS_LOCAL_ENV) {
    throw new Error('ADMIN_EMAILS is required outside local development');
  }
}
