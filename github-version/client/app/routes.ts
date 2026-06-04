// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import {
	index,
	type RouteConfig,
	route,
} from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("admin", "routes/admin.tsx"),
	route("admin/cost", "routes/admin-cost.tsx"),
	route("admin/clients/:clientId", "routes/admin-client.tsx"),
	route("admin/tasks/:taskId", "routes/admin-task.tsx"),
	route("mailbox/:mailboxId", "routes/mailbox.tsx", [
		index("routes/mailbox-index.tsx"),
		route("emails/:folder", "routes/email-list.tsx"),
		route("inbox-zero", "routes/inbox-zero.tsx"),
		route("settings", "routes/settings.tsx"),
		route("admin", "routes/mailbox-admin.tsx"),
		route("admin/clients/:clientId", "routes/mailbox-admin-client.tsx"),
		route("admin/sla", "routes/mailbox-admin-sla.tsx"),
		route("admin/tasks/:taskId", "routes/mailbox-admin-task.tsx"),
		route("search", "routes/search-results.tsx"),
	]),
	route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
