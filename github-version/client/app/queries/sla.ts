// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { useQuery } from "@tanstack/react-query";
import api from "~/services/api";
import { queryKeys } from "./keys";

export type SlaWindow = "24h" | "7d" | "30d";

export interface SlaMetrics {
	window: string;
	generatedAt: string;
	totalReceived: number;
	totalReplied: number;
	unreplied: number;
	avgResponseHours: number;
	p50ResponseHours: number;
	p90ResponseHours: number;
	overdue: Array<{ id: string; subject: string; sender: string; age_hours: number }>;
	trend: Array<{ date: string; received: number; replied: number; avgHours: number }>;
}

export function useSlaMetrics(
	mailboxId: string | undefined,
	window: SlaWindow = "7d",
) {
	return useQuery<SlaMetrics>({
		queryKey: mailboxId
			? queryKeys.sla.metrics(mailboxId, window)
			: ["sla", "_disabled"],
		queryFn: () =>
			api.getSlaMetrics(mailboxId!, window) as Promise<SlaMetrics>,
		enabled: !!mailboxId,
		refetchInterval: 60_000,
	});
}
