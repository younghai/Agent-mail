import nodemailer from 'nodemailer';

let _transporter = null;

/**
 * .env 또는 DB smtp_config에서 읽은 설정으로 transporter 생성.
 */
function createTransporter(config) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port || 587,
    secure: config.secure || false,
    auth: config.username
      ? { user: config.username, pass: config.password }
      : undefined,
  });
}

/**
 * 전역 transporter (환경변수 기반).
 */
export function getDefaultTransporter() {
  if (_transporter) return _transporter;
  if (!process.env.SMTP_HOST) return null;
  _transporter = createTransporter({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    username: process.env.SMTP_USER,
    password: process.env.SMTP_PASS,
  });
  return _transporter;
}

/**
 * 이메일 발송.
 */
export async function sendEmail({ from, to, subject, text, html, inReplyTo, references }) {
  const transporter = getDefaultTransporter();
  if (!transporter) throw new Error('SMTP not configured (SMTP_HOST missing)');
  const info = await transporter.sendMail({ from, to, subject, text, html, inReplyTo, references });
  return info;
}
