// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import type { Segment } from "~/queries/segments";

const SEGMENT_STYLES: Record<Segment, string> = {
	vip: "bg-amber-100 text-amber-800",
	regular: "bg-kumo-fill text-kumo-default",
	new: "bg-blue-100 text-blue-800",
	dormant: "bg-kumo-recessed text-kumo-subtle",
};

const SEGMENT_LABELS: Record<Segment, string> = {
	vip: "VIP",
	regular: "Regular",
	new: "New",
	dormant: "Dormant",
};

export default function SegmentBadge({ segment }: { segment: Segment }) {
	return (
		<span
			className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${SEGMENT_STYLES[segment]}`}
		>
			{SEGMENT_LABELS[segment]}
		</span>
	);
}
