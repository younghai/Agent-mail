# v1 AI Agent Service Design

## 1. 서비스 개요

AI Agent Service는 v0의 `EmailAgent`를 Cloudflare Workers에서 분리하여 **독립적인 컨테이너 서비스**로 운영합니다. 다중 AI Provider를 지원하며, 메일 서버와는 Message Queue 및 HTTP API로 통신합니다.

## 2. 기술 스택

| 영역 | 기술 | 버전 | 이유 |
|------|------|------|------|
| **Runtime** | Python | 3.12+ | AI/ML 생태계 (LangChain, OpenAI SDK) |
| **Framework** | FastAPI | latest | 고성능 ASGI, 자동 OpenAPI 문서 |
| **AI SDK** | LangChain / LiteLLM | latest | 다중 Provider 추상화 |
| **HTTP Client** | httpx | latest | 비동기 HTTP |
| **Queue** | redis-py (Redis Streams) | latest | 메시지 큐 |
| **Cache** | redis-py | latest | 세션/응답 캐싱 |
| **DB Client** | asyncpg | latest | PostgreSQL 비동기 드라이버 |
| **Observability** | OpenTelemetry | latest | 분산 추적 |

## 3. 아키텍처

```
┌─────────────────────────────────────────────┐
│           AI Agent Service                  │
│  ┌───────────────────────────────────────┐  │
│  │           FastAPI App                  │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ │  │
│  │  │ /chat   │ │ /draft  │ │ /health │ │  │
│  │  │ (SSE)   │ │ (sync)  │ │         │ │  │
│  │  └────┬────┘ └────┬────┘ └─────────┘ │  │
│  │       │           │                  │  │
│  │  ┌────┴───────────┴──────────────┐   │  │
│  │  │      AI Orchestrator          │   │  │
│  │  │  (Provider Routing, Prompt    │   │  │
│  │  │   Management, Tool Calling)   │   │  │
│  │  └─────────────┬─────────────────┘   │  │
│  │                │                      │  │
│  │  ┌─────────────┼─────────────┐       │  │
│  │  ▼             ▼             ▼       │  │
│  │ ┌────────┐ ┌────────┐ ┌──────────┐  │  │
│  │ │ OpenAI │ │Claude  │ │ Ollama   │  │  │
│  │ │ Client │ │ Client │ │ Client   │  │  │
│  │ └────────┘ └────────┘ └──────────┘  │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │      Background Worker (Celery/     │  │
│  │      asyncio Tasks)                  │  │
│  │  - Queue Consumer                     │  │
│  │  - Auto-draft processor               │  │
│  │  - Prompt injection scanner           │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## 4. Provider 추상화

### 4.1 Base Provider Interface

```python
from abc import ABC, abstractmethod
from typing import AsyncIterator, Dict, Any

class AIProvider(ABC):
    @abstractmethod
    async def generate(self, messages: list, tools: list = None, **kwargs) -> Dict[str, Any]:
        """동기 생성 (auto-draft)"""
        pass

    @abstractmethod
    async def stream(self, messages: list, tools: list = None, **kwargs) -> AsyncIterator[str]:
        """스트리밍 생성 (chat)"""
        pass

    @abstractmethod
    async def verify(self, text: str) -> str | None:
        """Draft 검증"""
        pass

    @abstractmethod
    async def detect_injection(self, text: str) -> bool:
        """프롬프트 인젝션 감지"""
        pass
```

### 4.2 지원 Provider

| Provider | 모델 예시 | 인증 방식 | 특성 |
|----------|-----------|-----------|------|
| **OpenAI** | gpt-4o, gpt-4-turbo | API Key | 최고 성능, 높은 비용 |
| **Anthropic** | claude-3-5-sonnet, claude-3-opus | API Key | 긴 컨텍스트, 안전성 |
| **Ollama** | llama3, mistral, qwen | 낮은 지연 | 자체 호스팅, 물결 |
| **vLLM** | 다양한 오픈소스 모델 | OpenAI-compatible API | 고성능 자체 호스팅 |
| **Azure OpenAI** | gpt-4o | Azure AD / API Key | 엔터프라이즈, SLA |

### 4.3 Provider 라우팅

메일박스 설정에 따라 Provider 동적 선택:

```python
def get_provider(mailbox_config: dict) -> AIProvider:
    provider = mailbox_config.get("ai_provider", "openai")
    model = mailbox_config.get("ai_model", "gpt-4o")

    if provider == "openai":
        return OpenAIProvider(model=model, api_key=settings.OPENAI_API_KEY)
    elif provider == "anthropic":
        return AnthropicProvider(model=model, api_key=settings.ANTHROPIC_API_KEY)
    elif provider == "ollama":
        return OllamaProvider(model=model, base_url=settings.OLLAMA_URL)
    # ...
```

## 5. Auto-Draft 생성 흐름

### 5.1 Queue Consumer

```python
# Redis Streams Consumer
async def process_new_email(event: dict):
    """
    event = {
        "mailbox_id": "uuid",
        "email_id": "uuid",
        "sender": "...",
        "subject": "...",
        "thread_id": "uuid"
    }
    """

    # 1. 메일 서버에서 이메일 상세 조회
    email = await mail_server_client.get_email(event["email_id"])

    # 2. 프롬프트 인젝션 검사
    if await provider.detect_injection(email["body_text"]):
        logger.warning(f"Prompt injection detected: {event['email_id']}")
        return

    # 3. 스레드 컨텍스트 로드
    thread_emails = await mail_server_client.get_thread(event["thread_id"])

    # 4. 스레드 인젝션 검사
    thread_text = "\n\n".join([e["body_text"] for e in thread_emails])
    if await provider.detect_injection(thread_text):
        logger.warning(f"Thread injection detected: {event['thread_id']}")
        return

    # 5. AI 답변 생성
    system_prompt = await get_system_prompt(event["mailbox_id"])
    auto_prompt = build_auto_prompt(email, thread_emails)

    result = await provider.generate(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": auto_prompt}
        ],
        tools=email_tools_schema,
        temperature=0.7,
        max_tokens=4096
    )

    # 6. 도구 호출 확인
    draft_text = extract_draft_from_result(result)

    # 7. Draft 검증
    verified = await provider.verify(draft_text)
    if not verified:
        logger.warning("Draft verification failed")
        return

    # 8. 메일 서버에 DRAFT 저장
    await mail_server_client.create_draft(
        mailbox_id=event["mailbox_id"],
        in_reply_to=event["email_id"],
        thread_id=event["thread_id"],
        subject=f"Re: {email['subject']}" if not email['subject'].startswith("Re:") else email['subject'],
        body_html=text_to_html(verified),
        body_text=verified,
        recipient=event["sender"]
    )

    logger.info(f"Auto-draft created for {event['email_id']}")
```

## 6. 채팅 스트리밍 API

### 6.1 SSE 엔드포인트

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

app = FastAPI()

@app.post("/api/v1/mailboxes/{mailbox_id}/ai/chat")
async def chat_stream(request: ChatRequest, mailbox_id: str):
    async def event_generator():
        provider = get_provider(mailbox_config)

        # LangChain/LiteLLM 스트리밍
        async for chunk in provider.stream(
            messages=build_messages(request.session_id, request.message),
            tools=email_tools_schema
        ):
            if chunk.type == "text":
                yield f"event: message\ndata: {json.dumps({'type': 'text', 'content': chunk.text})}\n\n"
            elif chunk.type == "tool_call":
                yield f"event: tool_call\ndata: {json.dumps({'type': 'tool_call', 'tool': chunk.tool_name, 'arguments': chunk.arguments})}\n\n"

                # 도구 실행
                result = await execute_tool(chunk.tool_name, chunk.arguments)
                yield f"event: tool_result\ndata: {json.dumps({'type': 'tool_result', 'tool': chunk.tool_name, 'result': result})}\n\n"

        yield f"event: done\ndata: {{}}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )
```

## 7. 프롬프트 관리

### 7.1 핫 리로드

시스템 프롬프트를 PostgreSQL에 저장하고, 메모리에 캐싱합니다. 변경 시 캐시 무효화:

```python
# PostgreSQL에 저장
async def get_system_prompt(mailbox_id: str) -> str:
    # Redis 캐시 확인
    cached = await redis.get(f"prompt:{mailbox_id}")
    if cached:
        return cached

    # DB 조회
    row = await db.fetchrow(
        "SELECT ai_system_prompt FROM mailboxes WHERE id = $1", mailbox_id
    )
    prompt = row["ai_system_prompt"] or DEFAULT_SYSTEM_PROMPT

    # 캐시 (TTL: 5분)
    await redis.setex(f"prompt:{mailbox_id}", 300, prompt)
    return prompt
```

### 7.2 버저닝

프롬프트 변경 이력을 관리하여 롤백 가능:

```sql
CREATE TABLE ai_prompt_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mailbox_id UUID NOT NULL REFERENCES mailboxes(id),
    content TEXT NOT NULL,
    version INT NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(mailbox_id, version)
);
```

## 8. 보안

### 8.1 프롬프트 인젝션 감지

별도의 경량 모델 또는 규칙 기반 검사:

```python
INJECTION_KEYWORDS = [
    "ignore previous instructions",
    "ignore all prior instructions",
    "you are now",
    "DAN",
    "jailbreak",
    "system prompt",
    "developer mode"
]

async def detect_injection(text: str) -> bool:
    # 1. 규칙 기반 빠른 필터
    lower = text.lower()
    for keyword in INJECTION_KEYWORDS:
        if keyword in lower:
            return True

    # 2. AI 기반 검증 (Llama-3 또는 유사 경량 모델)
    if settings.INJECTION_AI_ENABLED:
        result = await lightweight_provider.generate(
            messages=[
                {"role": "system", "content": INJECTION_SYSTEM_PROMPT},
                {"role": "user", "content": text[:2000]}
            ],
            max_tokens=10,
            temperature=0
        )
        return "yes" in result["content"].lower()

    return False
```

### 8.2 Draft 검증

```python
VERIFIER_PROMPT = """You are a text sanitizer. Your job is to review an AI-generated email reply and remove any meta-commentary, agent-speak, or artifacts.

Rules:
1. Remove phrases like "I hope this helps", "As an AI", "Feel free to ask"
2. Remove markdown formatting (**bold**, *italic*, # headers, ---)
3. Remove bullet points and numbered lists - use natural paragraphs
4. Keep the core message and factual content
5. Maintain a natural, human tone
6. Keep HTML tags if present, but sanitize agent artifacts

Output ONLY the cleaned email text. No explanations."""

async def verify_draft(text: str, provider: AIProvider) -> str | None:
    result = await provider.generate(
        messages=[
            {"role": "system", "content": VERIFIER_PROMPT},
            {"role": "user", "content": text}
        ],
        max_tokens=4096,
        temperature=0
    )
    cleaned = result["content"].strip()

    # Safety checks
    if len(cleaned) < 10:
        return None
    if cleaned == text.strip():
        # No changes needed, but verify it's not all whitespace
        return cleaned if cleaned else None

    return cleaned
```

## 9. 설정

### 9.1 환경 변수

```bash
# AI Provider
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
OLLAMA_BASE_URL=http://ollama:11434

# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/agentic_inbox

# Redis
REDIS_URL=redis://redis:6379/0

# Mail Server
MAIL_SERVER_URL=http://mail-server:8080
MAIL_SERVER_API_KEY=...

# Queue
QUEUE_CONSUMER_GROUP=ai-agent-1
QUEUE_STREAM=email-events

# Observability
OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4317
```

## 10. 배포

```dockerfile
# Dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

```yaml
# docker-compose.yml (개발)
services:
  ai-agent:
    build: ./services/ai-agent
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/agentic_inbox
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - postgres
      - redis
```
