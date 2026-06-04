# 3.4 AI Agent 상세 설계 (AI Agent Design)

> 워터폴 3단계 상세설계 — AI Agent Service의 내부 구조, LLM 통합, 프롬프트 관리, 보안 전략을 다룬다.

---

## 3.4.1 파일 구조

```
services/ai-agent/
├── Dockerfile
├── requirements.txt
├── main.py
└── tests/
    └── test_utils.py   # pytest 유닛 테스트
```

**의도적 단순화**: v1 MVP에서는 단일 파일(`main.py`)로 모든 로직을 구현. 향후 모듈 분리 예정.

---

## 3.4.2 기술 스택

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| FastAPI | 0.111.0 | HTTP API, SSE 스트리밍 |
| uvicorn | 0.30.0 | ASGI 서버 |
| openai | 1.30.0 | OpenAI API 클라이언트 |
| asyncpg | 0.29.0 | PostgreSQL 비동기 연결 _(psycopg2 대체, P0-2)_ |
| redis[hiredis] | 5.0.8 | Redis Streams 컨슈머 _(신규, P2-1)_ |
| pydantic | 2.7.0 | 요청/응답 검증 |
| python-dotenv | 1.0.1 | 환경변수 로드 |
| httpx | 0.27.0 | 비동기 HTTP 클라이언트 |

---

## 3.4.3 핵심 클래스/함수

### FastAPI 앱 설정

```python
@asynccontextmanager
async def lifespan(_app: FastAPI):
    await get_pool()                                    # DB 풀 초기화
    _consumer_task = asyncio.create_task(
        _consume_email_events()                         # Redis 컨슈머 시작
    )
    yield
    _consumer_task.cancel()
    await _pool.close()

app = FastAPI(title="Agentic Inbox Local AI Agent", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, ...)
```

### DB 연결 _(asyncpg, P0-2)_

```python
async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            DB_URL, min_size=2, max_size=10, command_timeout=10
        )
    return _pool
```

- 비동기 커넥션 풀: 이벤트 루프 블로킹 없음
- 파라미터 바인딩: `$1`, `$2`, ... (psycopg2의 `%s` 대체)
- 트랜잭션: `async with conn.transaction()`

### Redis Streams 컨슈머 _(신규, P2-1)_

```python
async def _consume_email_events() -> None:
    r = aioredis.from_url(REDIS_URL, decode_responses=True)
    await r.xgroup_create(EMAIL_STREAM, CONSUMER_GROUP, id="0", mkstream=True)
    while True:
        messages = await r.xreadgroup(
            CONSUMER_GROUP, CONSUMER_NAME,
            {EMAIL_STREAM: ">"}, count=1, block=5000,
        )
        for _stream, events in (messages or []):
            for msg_id, fields in events:
                if fields.get("event_type") == "new_email":
                    await create_draft(mailbox_id, req)   # 자동 draft 생성
                await r.xack(EMAIL_STREAM, CONSUMER_GROUP, msg_id)
```

---

## 3.4.4 엔드포인트 상세

### `POST /api/v1/mailboxes/{mailbox_id}/ai/draft`

**처리 흐름**:

```
1. Rate limit 확인 (mailbox_id 기준, 분당 20회)
2. 요청 파싱 (email_id, sender, subject, thread_id, body_text)
3. 프롬프트 인젝션 검사 (body_text + thread_context)
4. thread_id가 있으면 PostgreSQL에서 스레드 전체 이메일 조회 (asyncpg)
5. PostgreSQL에서 mailboxes.ai_system_prompt 로드
6. OpenAI API 호출 (gpt-4o-mini)
   - system: mailboxes.ai_system_prompt or DEFAULT_SYSTEM_PROMPT
   - user: auto_prompt (이메일 본문 + 스레드 컨텍스트)
7. 응답 파싱 → draft_text 추출
8. PostgreSQL에 DRAFT 저장 (트랜잭션: 폴더 조회 + emails INSERT)
9. 사용량 기록 (admin_agent_usage_events)
10. draft_id 반환
```

**OpenAI 파라미터**:
| 파라미터 | 값 | 이유 |
|----------|-----|------|
| model | `gpt-4o-mini` | 비용 효율, 빠른 응답 |
| temperature | 0.7 | 적당한 창의성 |
| max_tokens | 2048 | 이메일 길이 적정 |

---

### `POST /api/v1/mailboxes/{mailbox_id}/ai/chat`

**처리 흐름**:

```
1. Rate limit 확인
2. 프롬프트 인젝션 검사
3. PostgreSQL에서 ai_system_prompt 로드
4. session_id로 ai_conversations에서 최근 40개 메시지 로드 (P1-1)
5. user 턴을 ai_conversations에 저장
6. OpenAI API stream 호출
7. SSE chunks를 클라이언트로 전달
8. assistant 턴을 ai_conversations에 저장
9. done 이벤트 전송 (session_id 포함)
```

**SSE 이벤트 형식**:
```
event: message
data: {"type": "text", "content": "chunk"}

event: done
data: {"session_id": "uuid"}

event: error
data: {"error": "message"}
```

---

## 3.4.5 프롬프트 설계

### 기본 시스템 프롬프트 (`DEFAULT_SYSTEM_PROMPT`)

핵심 규칙:
1. **자연스러운 인간 톤**: 짧고 직접적인 산문체
2. **마크다운 금지**: `**bold**`, `*italic*`, `# header`, `---`, 코드 블록 사용 금지
3. **리스트 금지**: 글머리 기호, 번호 목록 사용 금지
4. **메타 코멘터리 금지**: "나는 답변을 작성하고 있습니다" 등의 설명 금지
5. **Draft Only**: 직접 발송 권한 없음
6. **스레드 중복 방지**: 이전 메시지에 이미 포함된 정보 반복 금지

### 자동 프롬프트 템플릿 (`auto_prompt`)

```
A new email just arrived. Draft an appropriate response.

Email details:
- From: {sender}
- Subject: {subject}
- Thread ID: {thread_id}

Email body:
{body_text}

Full thread history:
{thread_context}

Draft a natural, human-like reply in plain text.
Do not use markdown formatting, bullet points, or numbered lists.
```

---

## 3.4.6 보안

### 현재 구현

| 위협 | 대응 | 상태 |
|------|------|------|
| SQL Injection | Parameterized Query (`$1`, `$2`) — asyncpg | ✅ 구현 |
| 프롬프트 인젝션 | `contains_prompt_injection()` 키워드 탐지 | ✅ 구현 _(P0-2/P1-4)_ |
| API 키 노출 | 환경변수 (`OPENAI_API_KEY`) | ✅ 구현 |
| 과도한 요청 | `is_rate_limited()` — mailbox_id 기준 분당 20회 | ✅ 구현 |
| 인증 | `LOCAL_SERVICE_TOKEN` Bearer 토큰 미들웨어 | ✅ 구현 |
| 컨텍스트 과부하 | `MAX_CONTEXT_CHARS` 잘라내기 | ✅ 구현 |

### 프롬프트 인젝션 탐지

```python
def contains_prompt_injection(text: str) -> bool:
    markers = [
        "ignore previous instructions",
        "ignore all previous instructions",
        "system prompt",
        "developer message",
        "reveal your instructions",
        "forget the above",
        "act as system",
    ]
    return any(marker in text.lower() for marker in markers)
```

탐지 시 `422 PROMPT_INJECTION` 반환, 사용량 이벤트 기록.

---

## 3.4.7 개선 로드맵

| 버전 | 개선사항 | 상태 |
|------|----------|------|
| v1.0 | OpenAI 단일 Provider, 동기 draft, SSE 채팅 | ✅ 완료 |
| v1.1 | 프롬프트 인젝션 필터, Rate Limiting | ✅ 완료 _(P0-2, P1-4)_ |
| v1.2 | Redis Streams 자동 draft, conversation history 영속화 | ✅ 완료 _(P2-1, P1-1)_ |
| v1.3 | 도구 호출 (LangChain), 이메일 목록 조회/이동 도구 | 🔲 미구현 |
| v1.4 | Anthropic/Ollama 멀티프로바이더 | 🔲 미구현 |
