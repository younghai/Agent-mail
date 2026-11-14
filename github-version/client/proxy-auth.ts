import type { ProxyOptions } from "vite";

// Only the signed assertion may carry user identity through this proxy. The
// service bearer token authorizes the proxy, not the browser's claimed email.
export const stripIdentityHeaders: NonNullable<ProxyOptions["configure"]> = (proxy) => {
	const strip = (request: { removeHeader(name: string): void }) => {
		for (const name of [
			"cf-access-authenticated-user-email",
			"x-authenticated-user-email",
			"x-admin-user-email",
		]) request.removeHeader(name);
	};
	proxy.on("proxyReq", strip);
	proxy.on("proxyReqWs", strip);
};
