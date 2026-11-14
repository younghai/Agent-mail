import { createRemoteJWKSet, jwtVerify } from 'jose';
import { sendError } from './http.js';

// Service authentication is not user authentication. Only a verified Access
// assertion (or the explicit development identity) may supply an admin actor.
export function createAdminAuth({ isLocal = false, teamDomain = '', policyAud = '', adminEmails = [] } = {}) {
  const allowed = adminEmails.map((email) => email.trim().toLowerCase()).filter(Boolean);
  let keys;
  return async (req, res, next) => {
    res.locals.adminActor = { email: '', role: 'viewer' };
    const token = req.get('cf-access-jwt-assertion');
    const local = isLocal && !teamDomain && !policyAud && !token;
    let email = '';
    if (local) {
      // Never let a header choose the development identity or audit attribution.
      email = 'local-admin@example.local';
    } else if (token) {
      if (!teamDomain || !policyAud) {
        return sendError(res, 500, 'Cloudflare Access requires TEAM_DOMAIN and POLICY_AUD');
      }
      try {
        const issuer = new URL(teamDomain).origin;
        if (!issuer.startsWith('https://')) throw new Error('Access issuer must use HTTPS');
        keys ??= createRemoteJWKSet(new URL('/cdn-cgi/access/certs', issuer));
        const { payload } = await jwtVerify(token, keys, {
          issuer,
          audience: policyAud,
          algorithms: ['RS256'],
          requiredClaims: ['sub', 'exp'],
        });
        email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
      } catch {
        return sendError(res, 403, 'Invalid or expired Access token');
      }
    }
    const role = (local && allowed.length === 0) || (email && allowed.includes(email)) ? 'admin' : 'viewer';
    res.locals.adminActor = { email, role };
    return next();
  };
}

export function requireAdminRole(_req, res, roles) {
  const actor = res.locals.adminActor;
  if (!actor?.email) {
    sendError(res, 403, 'Admin identity is required');
    return null;
  }
  if (!roles.includes(actor.role)) {
    sendError(res, 403, 'Admin role required');
    return null;
  }
  return actor;
}
