// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { useQuery } from "@tanstack/react-query";
import api from "~/services/api";
import { queryKeys } from "./keys";

export type Segment = "vip" | "regular" | "new" | "dormant";

export interface CustomerSegment {
	email: string;
	domain: string;
	segment: Segment;
	totalMessages: number;
	lastSeenAt: string;
	firstSeenAt: string;
	starred: number;
}

export function useCustomerSegments(mailboxId: string | undefined) {
	return useQuery<CustomerSegment[]>({
		queryKey: mailboxId
			? queryKeys.segments.list(mailboxId)
			: ["segments", "_disabled"],
		queryFn: () =>
			api.listCustomerSegments(mailboxId!) as Promise<CustomerSegment[]>,
		enabled: !!mailboxId,
	});
}
