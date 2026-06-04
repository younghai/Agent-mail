// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ---------------------------------------------------------------------------
// Pure reducer extracted from inbox-zero route (duplicated here to avoid
// importing React-Router route files in unit tests).
// ---------------------------------------------------------------------------

interface QueueState {
	ids: string[];
	index: number;
	remaining: number;
}

type QueueAction =
	| { type: "init"; ids: string[] }
	| { type: "next" }
	| { type: "prev" }
	| { type: "consume" };

function queueReducer(state: QueueState, action: QueueAction): QueueState {
	switch (action.type) {
		case "init":
			return { ids: action.ids, index: 0, remaining: action.ids.length };
		case "next":
			return {
				...state,
				index: Math.min(state.index + 1, state.ids.length - 1),
			};
		case "prev":
			return { ...state, index: Math.max(state.index - 1, 0) };
		case "consume": {
			const newIds = state.ids.filter((_, i) => i !== state.index);
			const newRemaining = state.remaining - 1;
			const newIndex = Math.min(state.index, newIds.length - 1);
			return {
				ids: newIds,
				index: Math.max(newIndex, 0),
				remaining: Math.max(newRemaining, 0),
			};
		}
		default:
			return state;
	}
}

describe("Inbox Zero queue reducer", () => {
	const initialState: QueueState = { ids: [], index: 0, remaining: 0 };

	it("init sets ids, index, and remaining", () => {
		const state = queueReducer(initialState, {
			type: "init",
			ids: ["a", "b", "c"],
		});
		assert.deepStrictEqual(state, {
			ids: ["a", "b", "c"],
			index: 0,
			remaining: 3,
		});
	});

	it("next advances index without going past the end", () => {
		const s0 = queueReducer(initialState, { type: "init", ids: ["a", "b"] });
		const s1 = queueReducer(s0, { type: "next" });
		assert.equal(s1.index, 1);
		// Clamped at last index
		const s2 = queueReducer(s1, { type: "next" });
		assert.equal(s2.index, 1);
	});

	it("prev does not go below 0", () => {
		const s0 = queueReducer(initialState, { type: "init", ids: ["a", "b"] });
		const s1 = queueReducer(s0, { type: "prev" });
		assert.equal(s1.index, 0);
	});

	it("consume removes current item and decrements remaining", () => {
		const s0 = queueReducer(initialState, {
			type: "init",
			ids: ["a", "b", "c"],
		});
		// Consume item at index 0 ("a")
		const s1 = queueReducer(s0, { type: "consume" });
		assert.deepStrictEqual(s1.ids, ["b", "c"]);
		assert.equal(s1.remaining, 2);
		assert.equal(s1.index, 0);

		// Consume again (now "b")
		const s2 = queueReducer(s1, { type: "consume" });
		assert.deepStrictEqual(s2.ids, ["c"]);
		assert.equal(s2.remaining, 1);

		// Consume last item
		const s3 = queueReducer(s2, { type: "consume" });
		assert.deepStrictEqual(s3.ids, []);
		assert.equal(s3.remaining, 0);
		assert.equal(s3.index, 0);
	});

	it("consume at end clamps index to new last item", () => {
		const s0 = queueReducer(initialState, {
			type: "init",
			ids: ["a", "b", "c"],
		});
		// Navigate to last item
		const s1 = queueReducer(s0, { type: "next" }); // index 1
		const s2 = queueReducer(s1, { type: "next" }); // index 2
		assert.equal(s2.index, 2);
		// Consume last item
		const s3 = queueReducer(s2, { type: "consume" });
		assert.deepStrictEqual(s3.ids, ["a", "b"]);
		assert.equal(s3.index, 1); // clamped to new last
		assert.equal(s3.remaining, 2);
	});
});
