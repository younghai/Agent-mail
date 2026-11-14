import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { exportJWK, generateKeyPair, SignJWT, type JWTPayload } from "jose";
import { app as api } from "../../workers/index";
import { createAccessMiddleware, type AccessContext } from "../../workers/lib/access";
import type { Env } from "../../workers/types";

const issuer = "https://access.example.test";
const audience = "test-mail-app";
const admin = "admin@example.test";
const forgedHeaders = {
	"cf-access-authenticated-user-email": admin,
	"x-authenticated-user-email": admin,
	"x-admin-user-email": admin,
};
let keys: Awaited<ReturnType<typeof generateKeyPair>>;
beforeAll(async () => {
	keys = await generateKeyPair("RS256");
	const publicKey = { ...await exportJWK(keys.publicKey), kid: "test-key", alg: "RS256" };
	vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
		expect(String(url)).toBe(`${issuer}/cdn-cgi/access/certs`);
		return Response.json({ keys: [publicKey] });
	});
});
afterAll(() => vi.restoreAllMocks());

function sign(claims: JWTPayload = {}, key = keys.privateKey) {
	return new SignJWT({
		email: admin, sub: "verified-user", iss: issuer, aud: audience,
		exp: Math.floor(Date.now() / 1000) + 300, ...claims,
	}).setProtectedHeader({ alg: "RS256", kid: "test-key" }).sign(key);
}

function setup(local = false, bindings: { TEAM_DOMAIN?: string; POLICY_AUD?: string; ADMIN_EMAILS?: string } = {}) {
	const writes = vi.fn(async (input, actor) => ({ ...input, id: "created", actor }));
	const reads = vi.fn(async () => []);
	const stub = { createClient: writes, updateClient: writes, createTask: writes, updateTask: writes, listClients: reads, listTasks: reads };
	const env = {
		POLICY_AUD: audience, TEAM_DOMAIN: issuer, ADMIN_EMAILS: admin,
		ADMIN: { idFromName: (name: string) => name, get: () => stub },
		...bindings,
	} as unknown as Env;
	const app = new Hono<AccessContext>();
	app.use("*", createAccessMiddleware(local));
	app.route("/", api); // Real production routes and role checks, not copies.
	return {
		writes, reads,
		request: (token?: string, headers: Record<string, string> = {}, method = "POST", path = "/api/v1/admin/clients", host = "app.example.test") =>
			app.request(`https://${host}${path}`, {
				method,
				headers: { "Content-Type": "application/json", ...(token ? { "cf-access-jwt-assertion": token } : {}), ...headers },
				...(method !== "GET" ? { body: JSON.stringify({ name: "Client", company: "Company", clientId: "client", title: "Task" }) } : {}),
			}, env),
	};
}

describe("Access identity on real Worker admin routes", () => {
	it("rejects header-only reads/writes, including a localhost request URL", async () => {
		const { request, writes, reads } = setup();
		for (const name of Object.keys(forgedHeaders)) {
			for (const method of ["GET", "POST", "PUT"]) {
				expect((await request(undefined, { [name]: admin }, method)).status).toBe(403);
			}
		}
		expect((await request(undefined, forgedHeaders, "POST", "/api/v1/admin/clients", "localhost")).status).toBe(403);
		expect(writes).not.toHaveBeenCalled();
		expect(reads).not.toHaveBeenCalled();
	});

	it("does not upgrade a verified viewer using forged administrator headers", async () => {
		const { request, writes } = setup();
		const token = await sign({ email: "viewer@example.test" });
		for (const name of Object.keys(forgedHeaders)) {
			for (const path of ["/api/v1/admin/clients", "/api/v1/admin/tasks"]) {
				expect((await request(token, { [name]: admin }, "POST", path)).status).toBe(403);
				expect((await request(token, { [name]: admin }, "PUT", `${path}/existing`)).status).toBe(403);
			}
		}
		expect(writes).not.toHaveBeenCalled();
		// Preserve the existing read-only role for authenticated Access teammates.
		expect((await request(token, forgedHeaders, "GET")).status).toBe(200);
	});

	it("retains verified administrator access and uses the JWT email for auditing", async () => {
		const { request, writes } = setup(false, { TEAM_DOMAIN: `${issuer}/cdn-cgi/access/certs` });
		const token = await sign({ email: "Admin@Example.Test" });
		const headers = Object.fromEntries(Object.keys(forgedHeaders).map((name) => [name, "other@example.test"]));
		for (const path of ["/api/v1/admin/clients", "/api/v1/admin/tasks"]) {
			expect((await request(token, headers, "POST", path)).status).toBe(201);
			expect((await request(token, headers, "PUT", `${path}/existing`)).status).toBe(200);
		}
		for (const call of writes.mock.calls) {
			expect(call.at(-1)).toEqual({ email: admin, role: "admin" });
		}
		expect((await request(token, {}, "GET")).status).toBe(200);
	});

	it("fails closed for invalid or incomplete JWTs even with matching identity headers", async () => {
		const { request, writes, reads } = setup();
		const wrongKeys = await generateKeyPair("RS256");
		const tokens = [
			"not-a-jwt", await sign({}, wrongKeys.privateKey),
			await sign({ iss: "https://other.example.test" }), await sign({ aud: "different-app" }),
			await sign({ exp: 1 }), await sign({ exp: undefined }), await sign({ sub: undefined }),
			await sign({ email: undefined }), await sign({ email: "" }), await sign({ email: [admin] }),
		];
		for (const token of tokens) {
			expect((await request(token, forgedHeaders)).status).toBe(403);
			expect((await request(token, forgedHeaders, "GET")).status).toBe(403);
		}
		expect(writes).not.toHaveBeenCalled();
		expect(reads).not.toHaveBeenCalled();
	});

	it("does not infer local or administrator access from request headers or URL", async () => {
		const localBindings = { TEAM_DOMAIN: "", POLICY_AUD: "", ADMIN_EMAILS: "" };
		const local = setup(true, localBindings);
		const response = await local.request(undefined, forgedHeaders);
		expect(response.status).toBe(201);
		expect((await response.json() as { actor: unknown }).actor).toEqual({ email: "local-admin@example.local", role: "admin" });
		expect((await local.request("invalid", forgedHeaders)).status).toBe(500);
		expect((await setup(false, localBindings).request(undefined, forgedHeaders, "POST", "/api/v1/admin/clients", "localhost")).status).toBe(500);
		expect((await setup(true).request(undefined, forgedHeaders)).status).toBe(403);
		expect((await setup(true).request(await sign({ email: "viewer@example.test" }), forgedHeaders)).status).toBe(403);
		expect((await setup(false, { ADMIN_EMAILS: "" }).request(await sign(), forgedHeaders)).status).toBe(403);
		expect((await setup(true, { ...localBindings, ADMIN_EMAILS: admin }).request(undefined, forgedHeaders)).status).toBe(403);
	});

	it("requires middleware-established identity even when the API is mounted directly", async () => {
		const result = await api.request("http://localhost/api/v1/admin/clients", {
			headers: forgedHeaders,
		}, { ADMIN_EMAILS: admin } as unknown as Env);
		expect(result.status).toBe(403);
	});
});
