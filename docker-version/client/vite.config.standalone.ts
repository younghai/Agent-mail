// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const apiBaseUrl = process.env.VITE_API_BASE_URL || "http://localhost:5174";
const localServiceToken = process.env.VITE_LOCAL_SERVICE_TOKEN || "local-dev-token-change-me";
const clientPort = Number.parseInt(process.env.CLIENT_PORT || "5000", 10);

export default defineConfig({
	resolve: {
		dedupe: ["react", "react-dom", "react-router"],
	},
	optimizeDeps: {
		include: ["react", "react-dom", "react-router"],
	},
	define: {
		"import.meta.env.VITE_LOCAL_SERVICE_TOKEN": JSON.stringify(localServiceToken),
		"import.meta.env.VITE_API_BASE_URL": JSON.stringify(apiBaseUrl),
	},
	server: {
		host: "0.0.0.0",
		port: clientPort,
		proxy: {
			"/api": {
				target: apiBaseUrl,
				changeOrigin: true,
				headers: {
					Authorization: `Bearer ${localServiceToken}`,
				},
			},
			"/agents": {
				target: apiBaseUrl,
				ws: true,
				changeOrigin: true,
				headers: {
					Authorization: `Bearer ${localServiceToken}`,
				},
			},
		},
	},
	preview: {
		host: "0.0.0.0",
		port: clientPort,
		proxy: {
			"/api": {
				target: apiBaseUrl,
				changeOrigin: true,
				headers: {
					Authorization: `Bearer ${localServiceToken}`,
				},
			},
			"/agents": {
				target: apiBaseUrl,
				ws: true,
				changeOrigin: true,
				headers: {
					Authorization: `Bearer ${localServiceToken}`,
				},
			},
		},
	},
	plugins: [
		tailwindcss(),
		reactRouter(),
		tsconfigPaths(),
	],
});
