import { createMiddleware } from "hono/factory";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { Env } from "../types";
import type { AdminActor } from "../admin/types";

export type AccessIdentity = { email: string; local: boolean };
export type AccessContext = {
	Bindings: Env;
	Variables: { accessIdentity?: AccessIdentity };
};

export function adminActor(identity: AccessIdentity | undefined, adminEmails: string): AdminActor {
	const email = identity?.email ?? "";
	const allowed = adminEmails.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
	const isAdmin = (identity?.local && allowed.length === 0) ||
		(Boolean(email) && allowed.includes(email.toLowerCase()));
	return { email, role: isAdmin ? "admin" : "viewer" };
}

// Local development is a build-time decision, never inferred from Host/URL.
// When Access is configured, even a development build must validate the JWT.
export function createAccessMiddleware(localDevelopment = false) {
	let cachedIssuer = "";
	let keys: ReturnType<typeof createRemoteJWKSet> | undefined;
	return createMiddleware<AccessContext>(async (c, next) => {
		c.set("accessIdentity", undefined);
		const { POLICY_AUD, TEAM_DOMAIN } = c.env;
		const token = c.req.header("cf-access-jwt-assertion");
		if (localDevelopment && !POLICY_AUD && !TEAM_DOMAIN && !token) {
			c.set("accessIdentity", { email: "local-admin@example.local", local: true });
			return next();
		}
		if (!POLICY_AUD || !TEAM_DOMAIN) {
			return c.text("Cloudflare Access must be configured in production. Set POLICY_AUD and TEAM_DOMAIN.", 500);
		}
		if (!token) return c.text("Missing required CF Access JWT", 403);
		try {
			const issuer = new URL(TEAM_DOMAIN).origin;
			if (!issuer.startsWith("https://")) throw new Error("Access issuer must use HTTPS");
			if (!keys || cachedIssuer !== issuer) {
				keys = createRemoteJWKSet(new URL("/cdn-cgi/access/certs", issuer));
				cachedIssuer = issuer;
			}
			const { payload } = await jwtVerify(token, keys, {
				issuer,
				audience: POLICY_AUD,
				algorithms: ["RS256"],
				requiredClaims: ["sub", "exp"],
			});
			c.set("accessIdentity", {
				email: typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "",
				local: false,
			});
		} catch {
			return c.text("Invalid or expired Access token", 403);
		}
		// The shared Access policy still grants mailbox access; admin roles use
		// only the verified email, never identity headers supplied by the caller.
		return next();
	});
}
