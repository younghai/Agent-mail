// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Client entry point for React Router v7.
 *
 * Sentry initialisation lives here (not in root.tsx) so the @sentry/react
 * import never appears in the SSR bundle that runs in the Cloudflare Worker.
 */

import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { initBrowserSentry } from "~/lib/observability/sentry";

initBrowserSentry();

startTransition(() => {
	hydrateRoot(
		document,
		<StrictMode>
			<HydratedRouter />
		</StrictMode>,
	);
});
