// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Button, Empty } from "@cloudflare/kumo";
import { WarningIcon } from "@phosphor-icons/react";

export interface ErrorFallbackProps {
	title: string;
	description: string;
	status?: number | null;
	eventId?: string;
	onRetry?: () => void;
}

export default function ErrorFallback({
	title,
	description,
	status,
	eventId,
	onRetry,
}: ErrorFallbackProps) {
	const displayTitle = status === 404 ? "404 — Page not found" : title;
	const onGoHome = () => {
		window.location.href = "/";
	};

	return (
		<div
			role="alert"
			aria-live="assertive"
			className="flex items-center justify-center min-h-screen p-8"
		>
			<Empty
				icon={<WarningIcon size={48} className="text-kumo-inactive" />}
				title={displayTitle}
				description={description}
				contents={
					<div className="flex flex-col items-center gap-3">
						<div className="flex gap-2">
							{onRetry && (
								<Button variant="primary" onClick={onRetry}>
									Try again
								</Button>
							)}
							<Button
								variant={onRetry ? "secondary" : "primary"}
								onClick={onGoHome}
							>
								Go Home
							</Button>
						</div>
						{eventId && (
							<p className="text-xs text-kumo-subtle font-mono select-all">
								Error ID: {eventId}
							</p>
						)}
					</div>
				}
			/>
		</div>
	);
}
