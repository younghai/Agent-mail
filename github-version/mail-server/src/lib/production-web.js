import express from 'express';
import { createHash, createHmac, randomBytes, scrypt, scryptSync, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { extname, join } from 'node:path';
import { loginPage } from './login-page.js';

const SESSION_SECONDS = 8 * 60 * 60;
const COOKIE = '__Host-agent-mail';
const hash = value => createHash('sha256').update(value).digest('hex');
const deriveKey = promisify(scrypt);
const safe = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function createSessionStore(query) {
  return {
    async allowAttempt(key) {
      const { rows } = await query(`
        INSERT INTO inbox_login_limits (key_hash, attempts, resets_at)
        VALUES ($1, 1, NOW() + INTERVAL '15 minutes')
        ON CONFLICT (key_hash) DO UPDATE SET
          attempts = CASE WHEN inbox_login_limits.resets_at <= NOW() THEN 1 ELSE inbox_login_limits.attempts + 1 END,
          resets_at = CASE WHEN inbox_login_limits.resets_at <= NOW() THEN NOW() + INTERVAL '15 minutes' ELSE inbox_login_limits.resets_at END
        RETURNING attempts`, [key]);
      return Number(rows[0].attempts) <= 10;
    },
    async create(tokenHash, version) {
      await query(`INSERT INTO inbox_web_sessions (token_hash, credential_version, expires_at)
        VALUES ($1, $2, NOW() + INTERVAL '8 hours')`, [tokenHash, version]);
      // Request-driven cleanup works across autoscaling instances.
      await query('DELETE FROM inbox_web_sessions WHERE expires_at <= NOW()');
      await query('DELETE FROM inbox_login_limits WHERE resets_at <= NOW()');
    },
    async has(tokenHash, version) {
      const { rows } = await query(`SELECT 1 FROM inbox_web_sessions
        WHERE token_hash = $1 AND credential_version = $2 AND expires_at > NOW()`, [tokenHash, version]);
      return rows.length > 0;
    },
    async remove(tokenHash) {
      await query('DELETE FROM inbox_web_sessions WHERE token_hash = $1', [tokenHash]);
    },
  };
}

export function registerProductionWeb(app, {
  store, clientDir, password = '', sessionSecret = '',
}) {
  if (sessionSecret.length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters');
  if (!existsSync(join(clientDir, 'index.html'))) throw new Error('Replit SPA build is missing. Run scripts/build-replit.sh first.');
  const configured = password.length >= 16 && password.length <= 1024;
  const expected = configured ? scryptSync(password, sessionSecret, 32) : null;
  const version = createHmac('sha256', sessionSecret).update(`inbox-password:${password}`).digest('hex');
  const ipKey = ip => createHmac('sha256', sessionSecret).update(`login:${ip}`).digest('hex');
  const cookieOptions = { httpOnly: true, secure: true, sameSite: 'lax', path: '/' };
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use((_req, res, next) => {
    res.set({
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'same-origin',
      'X-Robots-Tag': 'noindex, nofollow',
    });
    next();
  });

  function readToken(req) {
    const entry = (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(`${COOKIE}=`));
    const token = entry?.slice(COOKIE.length + 1) || '';
    return /^[a-f0-9]{64}$/.test(token) ? token : '';
  }
  async function authenticated(req) {
    const token = readToken(req);
    return Boolean(configured && token && await store.has(hash(token), version));
  }
  function sameOrigin(req, res, next) {
    // No state-changing cookie-authenticated requests from other sites.
    if (req.get('origin') !== `https://${req.get('host')}` || req.get('sec-fetch-site') === 'cross-site') {
      return res.status(403).json({ success: false, error: { code: 'INVALID_ORIGIN', message: 'Same-origin request required' } });
    }
    next();
  }
  function showLogin(res, status = 200, message = '') {
    res.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'self' https://replit.com https://*.replit.com");
    return res.status(status).type('html').send(loginPage({ configured, message }));
  }
  app.get('/auth/session', safe(async (req, res) => res.json({ authenticated: await authenticated(req), configured })));
  app.get('/auth/login', safe(async (req, res) => {
    if (await authenticated(req)) return res.redirect(303, '/');
    return showLogin(res);
  }));
  app.post('/auth/login', sameOrigin, express.urlencoded({ extended: false, limit: '4kb' }), safe(async (req, res) => {
    if (!configured) return showLogin(res, 503);
    if (!await store.allowAttempt(ipKey(req.ip || 'unknown'))) {
      res.set('Retry-After', '900');
      return showLogin(res, 429, '로그인 시도가 너무 많습니다. 15분 후 다시 시도하세요.');
    }
    const input = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!input || input.length > 1024 || !timingSafeEqual(expected, await deriveKey(input, sessionSecret, 32))) {
      return showLogin(res, 401, '비밀번호를 확인해 주세요.');
    }
    const old = readToken(req);
    if (old) await store.remove(hash(old));
    const token = randomBytes(32).toString('hex');
    await store.create(hash(token), version);
    res.cookie(COOKIE, token, { ...cookieOptions, maxAge: SESSION_SECONDS * 1000 });
    return res.redirect(303, '/');
  }));
  app.post('/auth/logout', sameOrigin, safe(async (req, res) => {
    const token = readToken(req);
    if (token) await store.remove(hash(token));
    res.clearCookie(COOKIE, cookieOptions);
    return res.redirect(303, '/auth/login');
  }));

  // These are bundled, non-private campaign example photos, never uploaded
  // attachments. Opaque email iframes cannot send SameSite session cookies.
  app.use('/campaign-examples', express.static(join(clientDir, 'campaign-examples'), {
    index: false, dotfiles: 'deny', redirect: false,
  }));
  app.use(safe(async (req, res, next) => {
    if (['/health', '/ready'].includes(req.path)) return next();
    if (!await authenticated(req)) {
      if (/^\/(?:api|agents)(?:\/|$)/i.test(req.path)) {
        return res.status(401).json({ success: false, error: { code: 'LOGIN_REQUIRED', message: 'Administrator login required' } });
      }
      return showLogin(res);
    }
    // Identity is assigned only after a database-backed session was verified.
    // Authorization and identity headers never grant access in this mode.
    res.locals.adminActor = { email: 'inbox-admin@replit.local', role: 'admin' };
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return sameOrigin(req, res, next);
    next();
  }));
  app.get('/auth/logout', (_req, res) => res.type('html').send(loginPage({ configured, logout: true })));
  app.use((req, res, next) => {
    const path = req.path.toLowerCase();
    if (req.method === 'POST' &&
        /^\/api\/v1\/mailboxes\/[^/]+\/(?:send|emails|emails\/[^/]+\/(?:reply|forward))\/?$/.test(path)) {
      return res.status(403).json({ success: false, error: { code: 'SENDING_DISABLED', message: '메일 발송은 활성화되지 않았습니다. 초안으로 저장해 주세요.' } });
    }
    // The scenario-based campaign workspace stays available. Real AI/SMTP is
    // deliberately not started by this production launcher.
    if (/^\/agents(?:\/|$)/.test(path) || /\/(?:ai|agent)(?:\/|$)/.test(path) ||
        path.endsWith('/test-autodraft') || path.startsWith('/api/v1/webhooks/') || path.startsWith('/api/v1/inbound')) {
      return res.status(503).json({ success: false, error: { code: 'SERVICE_NOT_CONFIGURED', message: '이 운영 환경에는 실제 AI 및 메일 수신 서비스가 연결되지 않았습니다.' } });
    }
    next();
  });
  const staticFiles = express.static(clientDir, { index: false, dotfiles: 'deny', redirect: false });
  app.use((req, res, next) => {
    if (!['GET', 'HEAD'].includes(req.method) || /^\/(?:api|agents|auth|health|ready)(?:\/|$)/i.test(req.path)) return next();
    return staticFiles(req, res, (err) => {
      if (err) return next(err);
      if (extname(req.path)) return res.sendStatus(404);
      return res.sendFile(join(clientDir, 'index.html'));
    });
  });
}
