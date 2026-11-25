// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { useEffect, useRef } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import AgentSidebar from "~/components/AgentSidebar";
import ComposeDialog from "~/components/ComposeDialog";
import Header from "~/components/Header";
import Sidebar from "~/components/Sidebar";
import { useMailbox, useMailboxes } from "~/queries/mailboxes";
import { useUIStore } from "~/hooks/useUIStore";
import { ApiError } from "~/services/api";
import { useMailboxParams } from "~/hooks/useMailboxParams";
import { encodeMailboxSlug } from "~/lib/mailbox-slug";
import { capabilities } from "~/lib/capabilities";

export default function MailboxRoute() {
	const { mailboxId, mailboxSlug } = useMailboxParams();
	const { isError, error, isFetched } = useMailbox(mailboxId);
	const { data: mailboxes = [] } = useMailboxes();
	const prevMailboxIdRef = useRef<string | undefined>(undefined);
	const { isSidebarOpen, closeSidebar, isAgentPanelOpen, agentResultPlacement, closePanel } = useUIStore();
	const location = useLocation();
	// The email list and search views place the composer beside their content.
	const composerInline = /\/(emails|search)(\/|$)/.test(location.pathname);

	useEffect(() => {
		if (
			prevMailboxIdRef.current &&
			mailboxSlug &&
			prevMailboxIdRef.current !== mailboxSlug
		) {
			closePanel();
			closeSidebar();
		}

		prevMailboxIdRef.current = mailboxSlug;
	}, [mailboxSlug, closePanel, closeSidebar]);

	// Redirect after all hooks — valid-looking but nonexistent mailboxId (e.g. old bookmark)
	if (isFetched && isError && error instanceof ApiError && error.status === 404) {
		const first = mailboxes[0];
		if (first) {
			return <Navigate to={`/mailbox/${encodeMailboxSlug(first.id)}/emails/inbox`} replace />;
		}
		return <Navigate to="/" replace />;
	}

	return (
<div className="flex h-[100dvh] overflow-hidden">
			{/* Mobile sidebar overlay backdrop */}
			{isSidebarOpen && (
				<div
					className="fixed inset-0 z-30 bg-black/30 md:hidden"
					onClick={closeSidebar}
					onKeyDown={(e) => e.key === "Escape" && closeSidebar()}
					role="button"
					tabIndex={-1}
					aria-label="Close sidebar"
				/>
			)}

			{/* Sidebar: hidden on mobile by default, shown as overlay when open */}
			<div
className={`fixed inset-y-0 left-0 z-40 w-64 md:relative md:block md:z-0 ${
isSidebarOpen ? "block" : "hidden"
				}`}
			>
				<Sidebar />
			</div>

			{/* Main content */}
			<div className="flex-1 flex flex-col min-w-0 bg-kumo-base">
				<Header />
<main className="min-h-0 flex-1 overflow-hidden">
					<Outlet />
				</main>
			</div>

			{/* Agent + MCP sidebar -- togglable on desktop, only where the AI service answers */}
			{capabilities.aiAssistant && agentResultPlacement === "side" && isAgentPanelOpen && (
				<div className="hidden lg:flex w-[380px] shrink-0 border-l border-kumo-line flex-col bg-kumo-base overflow-hidden">
					<AgentSidebar />
				</div>
			)}

			<ComposeDialog hidden={composerInline} />
		</div>
	);
}
