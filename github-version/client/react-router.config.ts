// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import type { Config } from "@react-router/dev/config";

export default {
  ssr: process.env.STANDALONE !== "true",
  buildDirectory: process.env.REPLIT_BUILD === "true" ? "build-replit" : "build",
  future: {
    v8_viteEnvironmentApi: true,
  },
} satisfies Config;
