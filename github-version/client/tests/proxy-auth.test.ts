import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "node:http";
import { createServer as createViteServer } from "vite";
import { stripIdentityHeaders } from "../proxy-auth.ts";

test("browser API proxy strips unsigned identity headers but forwards the signed assertion", async (t) => {
	const target = createServer((req, res) => {
		res.setHeader("Content-Type", "application/json");
		res.end(JSON.stringify(req.headers));
	});
	target.listen(0, "127.0.0.1");
	await new Promise<void>((resolve) => target.once("listening", resolve));
	t.after(() => new Promise<void>((resolve) => { target.close(() => resolve()); }));
	const address = target.address();
	assert(address && typeof address !== "string");
	const vite = await createViteServer({
		configFile: false,
		server: {
			host: "127.0.0.1", port: 0,
			proxy: { "/api": {
				target: `http://127.0.0.1:${address.port}`,
				headers: { Authorization: "Bearer proxy-service-token" },
				configure: stripIdentityHeaders,
			} },
		},
	});
	t.after(() => vite.close());
	await vite.listen();
	const proxyAddress = vite.httpServer?.address();
	assert(proxyAddress && typeof proxyAddress !== "string");
	const response = await fetch(`http://127.0.0.1:${proxyAddress.port}/api/v1/admin/clients`, {
		headers: {
			"cf-access-authenticated-user-email": "admin@example.test",
			"x-authenticated-user-email": "admin@example.test",
			"x-admin-user-email": "admin@example.test",
			"cf-access-jwt-assertion": "signed-assertion-to-verify-at-backend",
		},
	});
	const headers = await response.json() as Record<string, string>;
	for (const name of ["cf-access-authenticated-user-email", "x-authenticated-user-email", "x-admin-user-email"]) {
		assert.equal(headers[name], undefined);
	}
	assert.equal(headers.authorization, "Bearer proxy-service-token");
	assert.equal(headers["cf-access-jwt-assertion"], "signed-assertion-to-verify-at-backend");
});
