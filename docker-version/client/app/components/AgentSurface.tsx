// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Loader } from "@cloudflare/kumo";
import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from "react";

class AgentPanelErrorBoundary extends Component<
	{ children: ReactNode },
	{ error: string | null }
> {
	state = { error: null };

	static getDerivedStateFromError(error: unknown) {
		return {
			error: error instanceof Error ? error.message : "Agent panel crashed",
		};
	}

	componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
		console.error("AgentPanel render failed:", error, errorInfo);
	}

	render() {
		if (this.state.error) {
			return (
				<div className="flex h-full items-center justify-center p-4 text-center">
					<div>
						<p className="text-sm font-semibold text-kumo-error">
							Agent panel failed to load.
						</p>
						<p className="mt-1 text-xs text-kumo-subtle">
							{this.state.error}
						</p>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

export default function AgentSurface() {
	const [AgentChat, setAgentChat] = useState<React.ComponentType | null>(
		null,
	);
	const [loadError, setLoadError] = useState<string | null>(null);

	useEffect(() => {
		import("~/components/AgentPanel").then((mod) => {
			setAgentChat(() => mod.default);
		}).catch((err) => {
			console.error("Failed to load AgentPanel:", err);
			setLoadError("Failed to load agent panel");
		});
	}, []);

	if (loadError) {
		return (
			<div className="flex items-center justify-center h-full">
				<span className="text-xs text-kumo-error">{loadError}</span>
			</div>
		);
	}
	if (!AgentChat) {
		return (
			<div className="flex flex-col items-center justify-center h-full gap-2">
				<Loader size="base" />
				<span className="text-xs text-kumo-subtle">Loading agent...</span>
			</div>
		);
	}
	return (
		<AgentPanelErrorBoundary>
			<AgentChat />
		</AgentPanelErrorBoundary>
	);
}
