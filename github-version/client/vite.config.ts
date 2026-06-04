// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { aiMockPlugin } from "./vite-plugin-ai-mock";

const localServiceToken =
  process.env.VITE_LOCAL_SERVICE_TOKEN ?? "local-dev-token-change-me";

export default defineConfig({
  build: {
    rollupOptions: {
      // Keep local builds reliable on macOS when many watcher processes are open.
      maxParallelFileOps: 64,
    },
  },
  resolve: {
    dedupe: ["react", "react-dom", "react-router"],
  },
  optimizeDeps: {
    include: [
      "@cloudflare/kumo",
      "@phosphor-icons/react",
      "@sentry/react",
      "@tanstack/react-query",
      "@tiptap/extension-color",
      "@tiptap/extension-highlight",
      "@tiptap/extension-image",
      "@tiptap/extension-link",
      "@tiptap/extension-text-align",
      "@tiptap/extension-text-style",
      "@tiptap/extension-underline",
      "@tiptap/react",
      "@tiptap/starter-kit",
      "dompurify",
      "react",
      "react-dom",
      "react-router",
      "zustand",
    ],
  },
  define: {
    "import.meta.env.VITE_LOCAL_SERVICE_TOKEN": JSON.stringify(localServiceToken),
  },
  server: {
    port: 5174,
    hmr: {
      timeout: 10000,
    },
    watch: {
      ignored: ["**/.wrangler/**", "**/build/**", "**/node_modules/**"],
    },
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    aiMockPlugin({ enabled: true }), // Enable AI mock for local development
  ],
});
