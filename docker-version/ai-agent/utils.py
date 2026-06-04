from __future__ import annotations

import time
from collections import defaultdict

PROMPT_INJECTION_MARKERS = (
    "ignore previous instructions",
    "ignore all previous instructions",
    "system prompt",
    "developer message",
    "reveal your instructions",
    "forget the above",
    "act as system",
)


def estimate_cost_usd(
    input_tokens: int,
    output_tokens: int,
    input_usd_per_1m: float = 0.15,
    output_usd_per_1m: float = 0.60,
) -> float:
    return round(
        (input_tokens / 1_000_000) * input_usd_per_1m
        + (output_tokens / 1_000_000) * output_usd_per_1m,
        6,
    )


def truncate_text(value: str | None, limit: int) -> str:
    return (value or "")[:limit]


def contains_prompt_injection(text: str) -> bool:
    lowered = text.lower()
    return any(marker in lowered for marker in PROMPT_INJECTION_MARKERS)


class SlidingWindowRateLimiter:
    def __init__(self, max_hits: int, window_seconds: int = 60):
        self.max_hits = max_hits
        self.window_seconds = window_seconds
        self._hits: dict[str, list[float]] = defaultdict(list)

    def is_rate_limited(self, key: str, now: float | None = None) -> bool:
        current = time.time() if now is None else now
        window_start = current - self.window_seconds
        hits = [hit for hit in self._hits.get(key, []) if hit >= window_start]
        if len(hits) >= self.max_hits:
            self._hits[key] = hits
            return True
        hits.append(current)
        self._hits[key] = hits
        return False

    def clear(self) -> None:
        self._hits.clear()
