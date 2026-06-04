from __future__ import annotations

import os
import json
import html
import time
import uuid
import asyncio
from contextlib import asynccontextmanager
from typing import Any, Optional

import asyncpg
import redis.asyncio as aioredis
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import AsyncOpenAI
from utils import (
    SlidingWindowRateLimiter,
    contains_prompt_injection,
    estimate_cost_usd as estimate_ai_cost_usd,
    truncate_text,
)

DB_URL = os.getenv("DATABASE_URL", "postgresql://agentic:agentic@localhost:5432/agentic_inbox")
APP_ENV = os.getenv("APP_ENV", os.getenv("NODE_ENV", "development")).lower()
IS_LOCAL_ENV = APP_ENV in {"development", "local", "test"}
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
LOCAL_SERVICE_TOKEN = os.getenv("LOCAL_SERVICE_TOKEN", "")
AI_MODEL = os.getenv("AI_MODEL", "gpt-4o-mini")
AI_MODEL_INPUT_USD_PER_1M = float(os.getenv("AI_MODEL_INPUT_USD_PER_1M", "0.15"))
AI_MODEL_OUTPUT_USD_PER_1M = float(os.getenv("AI_MODEL_OUTPUT_USD_PER_1M", "0.60"))
AI_TIMEOUT_SECONDS = float(os.getenv("AI_TIMEOUT_SECONDS", "30"))
AI_MAX_RETRIES = int(os.getenv("AI_MAX_RETRIES", "2"))
AI_RATE_LIMIT_PER_MINUTE = int(os.getenv("AI_RATE_LIMIT_PER_MINUTE", "20"))
MAX_CONTEXT_CHARS = int(os.getenv("AI_MAX_CONTEXT_CHARS", "12000"))
AI_AUTO_DRAFT_MAX_ATTEMPTS = max(1, int(os.getenv("AI_AUTO_DRAFT_MAX_ATTEMPTS", "2")))
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
REDIS_SOCKET_TIMEOUT_SECONDS = float(os.getenv("REDIS_SOCKET_TIMEOUT_SECONDS", "15"))
EMAIL_STREAM = "email-events"
AI_DLQ_STREAM = os.getenv("AI_DLQ_STREAM", "email-events-dlq")
CONSUMER_GROUP = "ai-agent-group"
CONSUMER_NAME = "ai-agent-1"

_pool: asyncpg.Pool | None = None
_consumer_task: asyncio.Task | None = None
_rate_limiter = SlidingWindowRateLimiter(AI_RATE_LIMIT_PER_MINUTE)

if not LOCAL_SERVICE_TOKEN and not IS_LOCAL_ENV:
    raise RuntimeError("LOCAL_SERVICE_TOKEN is required outside local development")


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(DB_URL, min_size=2, max_size=10, command_timeout=10)
    return _pool


def _redis_client():
    return aioredis.from_url(
        REDIS_URL,
        decode_responses=True,
        socket_connect_timeout=2,
        socket_timeout=REDIS_SOCKET_TIMEOUT_SECONDS,
    )


def estimate_cost_usd(input_tokens: int, output_tokens: int) -> float:
    return estimate_ai_cost_usd(
        input_tokens,
        output_tokens,
        AI_MODEL_INPUT_USD_PER_1M,
        AI_MODEL_OUTPUT_USD_PER_1M,
    )


async def _write_dlq(r, msg_id: str, fields: dict, error: Exception) -> None:
    await r.xadd(
        AI_DLQ_STREAM,
        {
            "source_stream": EMAIL_STREAM,
            "source_id": msg_id,
            "event_type": fields.get("event_type", ""),
            "payload": fields.get("payload", "{}"),
            "error": f"{error.__class__.__name__}: {error}",
            "failed_at": str(int(time.time())),
        },
        maxlen=10000,
        approximate=True,
    )


async def _handle_email_event(r, msg_id: str, fields: dict) -> None:
    event_type = fields.get("event_type", "")
    if event_type != "new_email":
        return
    if not client:
        raise RuntimeError("OpenAI API key is not configured")

    payload = json.loads(fields.get("payload", "{}"))
    mailbox_id = payload.get("mailbox_id", "")
    email_id = payload.get("email_id", "")
    for job_type in ("summary", "timeline", "task_extraction"):
        await run_email_analysis_job(mailbox_id, email_id, job_type)

    req = DraftRequest(
        email_id=email_id,
        sender=payload.get("sender"),
        subject=payload.get("subject"),
        thread_id=payload.get("thread_id"),
        body_text=payload.get("body_text"),
    )

    last_error: Exception | None = None
    for attempt in range(1, AI_AUTO_DRAFT_MAX_ATTEMPTS + 1):
        try:
            result = await create_draft(mailbox_id, req)
            if isinstance(result, JSONResponse) and result.status_code >= 400:
                raise RuntimeError(f"auto-draft failed with status {result.status_code}")
            return
        except Exception as exc:
            last_error = exc
            if attempt < AI_AUTO_DRAFT_MAX_ATTEMPTS:
                await asyncio.sleep(min(2 ** attempt, 5))

    await _write_dlq(r, msg_id, fields, last_error or RuntimeError("unknown auto-draft failure"))


async def _consume_email_events() -> None:
    try:
        r = _redis_client()
        try:
            await r.xgroup_create(EMAIL_STREAM, CONSUMER_GROUP, id="0", mkstream=True)
        except Exception:
            pass  # group already exists
        while True:
            try:
                messages = await r.xreadgroup(
                    CONSUMER_GROUP, CONSUMER_NAME,
                    {EMAIL_STREAM: ">"},
                    count=1, block=5000,
                )
                for _stream, events in (messages or []):
                    for msg_id, fields in events:
                        try:
                            await _handle_email_event(r, msg_id, fields)
                            await r.xack(EMAIL_STREAM, CONSUMER_GROUP, msg_id)
                        except Exception as exc:
                            print(f"[consumer] event {msg_id} left pending: {exc}")
            except asyncio.CancelledError:
                break
            except Exception as exc:
                print(f"[consumer] stream error: {exc}")
                await asyncio.sleep(2)
        await r.aclose()
    except asyncio.CancelledError:
        pass
    except Exception as exc:
        print(f"[consumer] startup failed (Redis unavailable?): {exc}")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global _consumer_task
    await get_pool()
    _consumer_task = asyncio.create_task(_consume_email_events())
    yield
    _consumer_task.cancel()
    try:
        await _consumer_task
    except asyncio.CancelledError:
        pass
    if _pool:
        await _pool.close()


client = AsyncOpenAI(
    api_key=OPENAI_API_KEY,
    timeout=AI_TIMEOUT_SECONDS,
    max_retries=AI_MAX_RETRIES,
) if OPENAI_API_KEY else None

DEFAULT_SYSTEM_PROMPT = """You are an email assistant that helps manage this inbox. You read emails, draft replies, and help organize conversations.

## Writing Style
Write like a real person. Short, direct, flowing prose. Get to the point. Plain text only - no HTML tags in your replies.

**Formatting rules:**
- Write in natural paragraphs. NO bullet points, NO numbered lists, NO dashes, NO markdown formatting in email drafts.
- NO bold (**), NO italic (*), NO headers (#), NO horizontal rules (---), NO code blocks. Plain text only.
- Links go inline in the text, not on separate lines.
- Don't structure replies like a template or form letter. Just talk normally.

**Agent Behavior Rules (CRITICAL):**
- NEVER output meta-commentary about what you are doing.
- When drafting a reply, your ONLY job is to provide the draft text.
- DO NOT summarize the email. DO NOT explain your actions.
- Before drafting ANY reply, carefully read the full thread history.
- NEVER repeat information that was already shared in a prior message in the thread.
- Your reply should only contain NEW information or directly respond to what the person just said.

## CRITICAL: Draft Only - Never Send
You can ONLY draft emails. You do NOT have the ability to send emails directly."""

app = FastAPI(title="Agentic Inbox Local AI Agent", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_methods=["*"], allow_headers=["*"])


@app.middleware("http")
async def require_local_token(request: Request, call_next):
    if request.url.path in {"/health", "/ready"}:
        return await call_next(request)
    if not LOCAL_SERVICE_TOKEN and IS_LOCAL_ENV:
        return await call_next(request)
    auth = request.headers.get("authorization", "")
    if auth != f"Bearer {LOCAL_SERVICE_TOKEN}":
        return JSONResponse(
            status_code=401,
            content={"success": False, "error": {"code": "UNAUTHORIZED", "message": "Missing or invalid local service token"}},
        )
    return await call_next(request)


class DraftRequest(BaseModel):
    email_id: str
    sender: Optional[str] = None
    subject: Optional[str] = None
    thread_id: Optional[str] = None
    body_text: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/ready")
async def ready():
    checks = {"ai_provider": "ok" if client else "missing_key"}
    try:
        pool = await get_pool()
        await pool.fetchval("SELECT 1")
        checks["database"] = "ok"
    except Exception as exc:
        return JSONResponse(status_code=503, content={"status": "not_ready", "checks": checks, "error": {"code": "DB_UNAVAILABLE", "message": str(exc)}})
    try:
        r = _redis_client()
        await r.ping()
        checks["redis"] = "ok"
        await r.aclose()
    except Exception as exc:
        checks["redis"] = "unavailable"
        return JSONResponse(status_code=503, content={"status": "not_ready", "checks": checks, "error": {"code": "REDIS_UNAVAILABLE", "message": str(exc)}})
    return {"status": "ready", "checks": checks, "auth": "token_required" if LOCAL_SERVICE_TOKEN else "development_open"}


def is_rate_limited(mailbox_id: str) -> bool:
    return _rate_limiter.is_rate_limited(mailbox_id)


def plain_text_to_html(text: str) -> str:
    paragraphs = [html.escape(part.strip()) for part in text.splitlines() if part.strip()]
    if not paragraphs:
        paragraphs = [""]
    return "<html><body>" + "".join(f"<p>{part}</p>" for part in paragraphs) + "</body></html>"


async def record_agent_usage(
    mailbox_id: str,
    operation: str,
    status: str = "ok",
    usage=None,
    error_code: str = "",
    latency_ms: int | None = None,
) -> None:
    usage = usage or {}
    input_tokens = getattr(usage, "prompt_tokens", None) or getattr(usage, "input_tokens", None) or 0
    output_tokens = getattr(usage, "completion_tokens", None) or getattr(usage, "output_tokens", None) or 0
    cost_usd = estimate_cost_usd(input_tokens, output_tokens)
    try:
        pool = await get_pool()
        await pool.execute(
            """INSERT INTO admin_agent_usage_events
               (agent_id, operation, model, input_tokens, output_tokens, cost_usd, latency_ms, status, error_code)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)""",
            mailbox_id, operation, AI_MODEL, input_tokens, output_tokens, cost_usd, latency_ms, status, error_code,
        )
    except Exception as exc:
        print(f"usage recording failed: {exc}")


async def create_ai_job(mailbox_id: str, email_id: str, job_type: str) -> str:
    job_id = str(uuid.uuid4())
    pool = await get_pool()
    await pool.execute(
        """INSERT INTO ai_jobs
           (id, mailbox_id, email_id, job_type, status, attempt_count, started_at, updated_at)
           VALUES ($1, $2, $3, $4, 'running', 1, now(), now())""",
        job_id, mailbox_id, email_id, job_type,
    )
    return job_id


async def finish_ai_job(
    job_id: str,
    status: str,
    result: dict | None = None,
    error_code: str = "",
    error_message: str = "",
) -> None:
    pool = await get_pool()
    await pool.execute(
        """UPDATE ai_jobs
              SET status = $1,
                  result_json = $2::jsonb,
                  error_code = NULLIF($3, ''),
                  error_message = NULLIF($4, ''),
                  finished_at = now(),
                  updated_at = now()
            WHERE id = $5""",
        status, json.dumps(result or {}), error_code, error_message, job_id,
    )


def parse_json_object(text: str) -> dict[str, Any]:
    try:
        parsed = json.loads(text)
        return parsed if isinstance(parsed, dict) else {"items": parsed}
    except json.JSONDecodeError:
        return {"raw": text}


async def load_email_context(mailbox_id: str, email_id: str) -> tuple[asyncpg.Record | None, str]:
    pool = await get_pool()
    email = await pool.fetchrow(
        "SELECT id, thread_id, subject, sender, recipient, body_text, received_at FROM emails WHERE mailbox_id = $1 AND id = $2",
        mailbox_id, email_id,
    )
    if not email:
        return None, ""
    rows = await pool.fetch(
        """SELECT sender, recipient, body_text, received_at
             FROM emails
            WHERE mailbox_id = $1 AND thread_id = $2 AND is_draft = false
            ORDER BY received_at ASC
            LIMIT 30""",
        mailbox_id, email["thread_id"] or email_id,
    )
    thread_context = "\n\n".join(
        f"[{r['received_at']}] {r['sender']} -> {r['recipient']}: {truncate_text(r['body_text'] or '', 1000)}"
        for r in rows
    )
    return email, thread_context


def analysis_prompt(job_type: str, email: asyncpg.Record, thread_context: str) -> str:
    base = f"""Analyze this email thread and return strict JSON only.

Current email:
From: {email['sender'] or 'Unknown'}
To: {email['recipient'] or 'Unknown'}
Subject: {email['subject'] or 'No subject'}
Body:
{truncate_text(email['body_text'] or '', MAX_CONTEXT_CHARS)}

Thread context:
{truncate_text(thread_context, MAX_CONTEXT_CHARS)}
"""
    if job_type == "summary":
        return base + """Return {"summary": "...", "sentiment": "positive|neutral|negative", "risk_level": "low|medium|high", "key_points": ["..."]}."""
    if job_type == "timeline":
        return base + """Return {"timeline": [{"at": "ISO or source timestamp", "actor": "...", "event": "..."}], "next_milestone": "..."}."""
    return base + """Return {"tasks": [{"title": "...", "owner": "...", "priority": "low|normal|high|urgent", "due_date": "", "evidence": "..."}], "requires_human_review": true}."""


async def run_email_analysis_job(mailbox_id: str, email_id: str, job_type: str) -> None:
    if not mailbox_id or not email_id:
        return
    job_id = await create_ai_job(mailbox_id, email_id, job_type)
    started_at = time.perf_counter()
    try:
        email, thread_context = await load_email_context(mailbox_id, email_id)
        if not email:
            await finish_ai_job(job_id, "failed", error_code="not_found", error_message="Email not found")
            return

        source_text = f"{email['body_text'] or ''}\n{thread_context}"
        if contains_prompt_injection(source_text):
            await finish_ai_job(job_id, "blocked", error_code="prompt_injection", error_message="Potential prompt-injection content detected")
            await record_agent_usage(mailbox_id, job_type, "blocked", error_code="prompt_injection")
            return

        response = await client.chat.completions.create(
            model=AI_MODEL,
            messages=[
                {"role": "system", "content": "You are an email operations analyst. Return strict JSON only."},
                {"role": "user", "content": analysis_prompt(job_type, email, thread_context)},
            ],
            temperature=0.2,
            max_tokens=1200,
            response_format={"type": "json_object"},
        )
        latency_ms = int((time.perf_counter() - started_at) * 1000)
        await record_agent_usage(mailbox_id, job_type, "ok", response.usage, latency_ms=latency_ms)
        result = parse_json_object(response.choices[0].message.content or "{}")
        pool = await get_pool()
        if job_type == "summary":
            await pool.execute(
                "UPDATE emails SET agent_summary = $1, updated_at = now() WHERE mailbox_id = $2 AND id = $3",
                result.get("summary") or json.dumps(result, ensure_ascii=False), mailbox_id, email_id,
            )
        elif job_type == "timeline":
            await pool.execute(
                "UPDATE emails SET agent_timeline_json = $1::jsonb, updated_at = now() WHERE mailbox_id = $2 AND id = $3",
                json.dumps(result, ensure_ascii=False), mailbox_id, email_id,
            )
        else:
            await pool.execute(
                "UPDATE emails SET agent_tasks_json = $1::jsonb, updated_at = now() WHERE mailbox_id = $2 AND id = $3",
                json.dumps(result, ensure_ascii=False), mailbox_id, email_id,
            )
        await finish_ai_job(job_id, "succeeded", result)
    except Exception as exc:
        await finish_ai_job(job_id, "failed", error_code=exc.__class__.__name__, error_message=str(exc))
        await record_agent_usage(
            mailbox_id,
            job_type,
            "error",
            error_code=exc.__class__.__name__,
            latency_ms=int((time.perf_counter() - started_at) * 1000),
        )


@app.post("/api/v1/mailboxes/{mailbox_id}/ai/draft")
async def create_draft(mailbox_id: str, req: DraftRequest):
    if not client:
        return JSONResponse(status_code=503, content={"success": False, "error": {"code": "SERVICE_UNAVAILABLE", "message": "OpenAI API key not configured"}})
    if is_rate_limited(mailbox_id):
        await record_agent_usage(mailbox_id, "auto_draft", "blocked", error_code="rate_limit")
        return JSONResponse(status_code=429, content={"success": False, "error": {"code": "RATE_LIMIT", "message": "AI rate limit exceeded"}})

    pool = await get_pool()
    job_id = await create_ai_job(mailbox_id, req.email_id, "draft_generation")

    # Load thread context
    thread_context = ""
    if req.thread_id:
        rows = await pool.fetch(
            "SELECT sender, recipient, body_text, received_at FROM emails WHERE mailbox_id = $1 AND thread_id = $2 ORDER BY received_at ASC",
            mailbox_id, req.thread_id,
        )
        thread_context = "\n\n".join(
            f"[{r['received_at']}] {r['sender']} -> {r['recipient']}: {(r['body_text'] or '')[:500]}"
            for r in rows
        )

    # Load system prompt
    row = await pool.fetchrow("SELECT ai_system_prompt FROM mailboxes WHERE id = $1", mailbox_id)
    system_prompt = (row["ai_system_prompt"] if row and row["ai_system_prompt"] else None) or DEFAULT_SYSTEM_PROMPT

    source_text = f"{req.body_text or ''}\n{thread_context}"
    if contains_prompt_injection(source_text):
        await finish_ai_job(job_id, "blocked", error_code="prompt_injection", error_message="Potential prompt-injection content detected")
        await record_agent_usage(mailbox_id, "auto_draft", "blocked", error_code="prompt_injection")
        return JSONResponse(
            status_code=422,
            content={"success": False, "error": {"code": "PROMPT_INJECTION", "message": "Potential prompt-injection content detected; human review required"}},
        )

    auto_prompt = f"""A new email just arrived. Draft an appropriate response.

Email details:
- From: {req.sender or 'Unknown'}
- Subject: {req.subject or 'No subject'}
- Thread ID: {req.thread_id or 'N/A'}

Email body:
{truncate_text(req.body_text, MAX_CONTEXT_CHARS) or '(No body)'}

Full thread history:
{truncate_text(thread_context, MAX_CONTEXT_CHARS) or 'This is the first message in the thread.'}

Draft a natural, human-like reply in plain text. Do not use markdown formatting, bullet points, or numbered lists."""

    started_at = time.perf_counter()
    try:
        response = await client.chat.completions.create(
            model=AI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": auto_prompt},
            ],
            temperature=0.7,
            max_tokens=2048,
        )
        latency_ms = int((time.perf_counter() - started_at) * 1000)
        await record_agent_usage(mailbox_id, "auto_draft", "ok", response.usage, latency_ms=latency_ms)
        draft_text = response.choices[0].message.content.strip()
        draft_id = str(uuid.uuid4())
        re_subject = req.subject if req.subject and req.subject.startswith("Re:") else f"Re: {req.subject or ''}"

        # Save draft atomically
        async with pool.acquire() as conn:
            async with conn.transaction():
                folder_row = await conn.fetchrow(
                    "SELECT id FROM folders WHERE mailbox_id = $1 AND slug = 'draft'", mailbox_id
                )
                folder_id = folder_row["id"] if folder_row else None
                await conn.execute(
                    """INSERT INTO emails
                       (id, mailbox_id, folder_id, thread_id, subject, sender, recipient, body_text, body_html,
                        in_reply_to, is_draft, approval_state, approval_meta)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, 'pending', $11::jsonb)""",
                    draft_id, mailbox_id, folder_id,
                    req.thread_id or req.email_id, re_subject,
                    mailbox_id, (req.sender or "").lower(),
                    draft_text, plain_text_to_html(draft_text), req.email_id,
                    json.dumps({"submitted_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "source": "ai-agent"}),
                )

        await finish_ai_job(
            job_id,
            "succeeded",
            {"draft_id": draft_id, "subject": re_subject, "operation": "draft_generation"},
        )
        return {"success": True, "data": {"draft_id": draft_id, "subject": re_subject, "body_text": draft_text}}
    except Exception as e:
        latency_ms = int((time.perf_counter() - started_at) * 1000)
        await finish_ai_job(job_id, "failed", error_code=e.__class__.__name__, error_message=str(e))
        await record_agent_usage(mailbox_id, "auto_draft", "error", error_code=e.__class__.__name__, latency_ms=latency_ms)
        return JSONResponse(status_code=500, content={"success": False, "error": {"code": "INTERNAL_ERROR", "message": str(e)}})


@app.post("/api/v1/mailboxes/{mailbox_id}/ai/chat")
async def chat_stream(mailbox_id: str, req: ChatRequest):
    if not client:
        return JSONResponse(status_code=503, content={"success": False, "error": {"code": "SERVICE_UNAVAILABLE", "message": "OpenAI API key not configured"}})
    if is_rate_limited(mailbox_id):
        await record_agent_usage(mailbox_id, "chat", "blocked", error_code="rate_limit")
        return JSONResponse(status_code=429, content={"success": False, "error": {"code": "RATE_LIMIT", "message": "AI rate limit exceeded"}})
    if contains_prompt_injection(req.message):
        await record_agent_usage(mailbox_id, "chat", "blocked", error_code="prompt_injection")
        return JSONResponse(
            status_code=422,
            content={"success": False, "error": {"code": "PROMPT_INJECTION", "message": "Potential prompt-injection content detected; human review required"}},
        )

    pool = await get_pool()
    row = await pool.fetchrow("SELECT ai_system_prompt FROM mailboxes WHERE id = $1", mailbox_id)
    system_prompt = (row["ai_system_prompt"] if row and row["ai_system_prompt"] else None) or DEFAULT_SYSTEM_PROMPT

    # Load or create session
    session_id = req.session_id or str(uuid.uuid4())
    history: list[dict] = []
    if req.session_id:
        history_rows = await pool.fetch(
            "SELECT role, content FROM ai_conversations WHERE mailbox_id = $1 AND session_id = $2 ORDER BY created_at ASC LIMIT 40",
            mailbox_id, session_id,
        )
        history = [{"role": r["role"], "content": r["content"]} for r in history_rows]

    messages = [{"role": "system", "content": system_prompt}, *history, {"role": "user", "content": req.message}]

    # Persist user turn before streaming
    await pool.execute(
        "INSERT INTO ai_conversations (mailbox_id, session_id, role, content) VALUES ($1, $2, $3, $4)",
        mailbox_id, session_id, "user", req.message,
    )

    async def event_generator():
        chunks: list[str] = []
        started_at = time.perf_counter()
        try:
            stream = await client.chat.completions.create(
                model=AI_MODEL,
                messages=messages,
                stream=True,
                temperature=0.7,
                max_tokens=2048,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content or ""
                if delta:
                    chunks.append(delta)
                    yield f"event: message\ndata: {json.dumps({'type': 'text', 'content': delta})}\n\n"

            # Persist assistant turn
            assistant_text = "".join(chunks)
            await pool.execute(
                "INSERT INTO ai_conversations (mailbox_id, session_id, role, content) VALUES ($1, $2, $3, $4)",
                mailbox_id, session_id, "assistant", assistant_text,
            )
            await record_agent_usage(mailbox_id, "chat", "ok", latency_ms=int((time.perf_counter() - started_at) * 1000))
            yield f"event: done\ndata: {json.dumps({'session_id': session_id})}\n\n"
        except Exception as e:
            await record_agent_usage(mailbox_id, "chat", "error", error_code=e.__class__.__name__, latency_ms=int((time.perf_counter() - started_at) * 1000))
            yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
