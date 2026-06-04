# P0–P3 Implementation Changes

## P0 — Critical

### P0-1: Global Error Handler (mail-server)
**File:** `services/mail-server/src/index.js`

| Before | After |
|--------|-------|
| async 라우터 에러 catch 없음 | `asyncHandler` 유틸리티로 모든 라우터 자동 래핑 |
| 에러 핸들러 미들웨어 없음 | 4-arg 전역 에러 핸들러 추가 (production 모드에서 메시지 은닉) |

### P0-2: psycopg2 → asyncpg Migration (ai-agent)
**Files:** `services/ai-agent/main.py`, `services/ai-agent/requirements.txt`

| Before | After |
|--------|-------|
| `psycopg2` 동기 드라이버 (이벤트 루프 블로킹) | `asyncpg` 비동기 커넥션 풀 (`min_size=2, max_size=10`) |
| `%s` 파라미터 바인딩 | `$1`, `$2` ... 파라미터 바인딩 |
| 트랜잭션 없음 | `async with conn.transaction()` 으로 draft 저장 원자성 보장 |
| `psycopg2-binary==2.9.9` | `asyncpg==0.29.0`, `redis[hiredis]==5.0.8` |

---

## P1 — High

### P1-1: Chat History Persistence (ai-agent)
**File:** `services/ai-agent/main.py`

| Before | After |
|--------|-------|
| 채팅 히스토리 없음 (매 요청 독립) | `ai_conversations` 테이블에 user/assistant 턴 저장 |
| session_id 미지원 | session_id로 최근 40개 메시지 로드 |

### P1-2: Search Pagination + totalCount (mail-server)
**File:** `services/mail-server/src/index.js`

| Before | After |
|--------|-------|
| 검색 결과 전체 반환 | `LIMIT`/`OFFSET` 적용 |
| totalCount 없음 | `COUNT(*)` 병렬 쿼리로 `totalCount` 반환 |
| 페이지네이션 파라미터 없음 | `page`, `limit` 쿼리 파라미터 지원 |

### P1-3: Vite `/agents` Proxy (frontend)
**File:** `vite.config.standalone.ts`

| Before | After |
|--------|-------|
| `/agents` 프록시 없음 | `/agents` → `http://localhost:8000` 프록시 추가 (WebSocket 지원) |

### P1-4: Unified Error Response Format (ai-agent)
**File:** `services/ai-agent/main.py`

| Before | After |
|--------|-------|
| 에러 응답 형식 불일치 (`{"error": str}`) | 전체 통일: `{"success": false, "error": {"code": "...", "message": "..."}}` |

---

## P2 — Medium

### P2-1: Redis Streams Auto-Draft Queue
**Files:** `services/ai-agent/main.py`, `services/mail-server/src/redis.js`, `services/mail-server/package.json`

| Before | After |
|--------|-------|
| 수동 draft 요청만 처리 | Redis Streams `xreadgroup` 컨슈머로 `new_email` 이벤트 수신 시 자동 draft 생성 |
| Redis 연동 없음 (mail-server) | `ioredis` 기반 `publishEmailEvent()` 신규 생성 (`services/mail-server/src/redis.js`) |
| `ioredis` 패키지 없음 | `ioredis: ^5.3.2` 추가 |

### P2-2: Inbound Email Webhook Endpoint
**Files:** `services/mail-server/src/index.js`, `.env.example`

| Before | After |
|--------|-------|
| 인바운드 이메일 수신 엔드포인트 없음 | `POST /api/v1/webhooks/email` 추가 |
| Webhook 인증 없음 | `X-Webhook-Secret` 헤더 검증 후 Redis publish |
| `WEBHOOK_SECRET` 환경변수 없음 | `.env.example`에 `WEBHOOK_SECRET` 추가 |

---

## P3 — Low

### P3-1: MinIO Attachment Streaming
**Files:** `services/mail-server/src/storage.js` (신규), `services/mail-server/src/index.js`, `services/mail-server/package.json`

| Before | After |
|--------|-------|
| 첨부파일 GET → 메타데이터만 반환 | `storage_key` 있으면 presigned URL로 302 리다이렉트 |
| MinIO 클라이언트 없음 | `storage.js` 신규 생성 (`ensureBucket`, `uploadObject`, `presignGetUrl`, `deleteObject`) |
| `minio` 패키지 없음 | `minio: ^8.0.0` 추가 |

### P3-2: Automated Tests
**Files:** `services/mail-server/tests/utils.test.js` (신규), `services/ai-agent/tests/test_utils.py` (신규), `services/mail-server/package.json`

| Before | After |
|--------|-------|
| 테스트 없음 (mail-server) | Node test runner로 11개 테스트 (`getBoundedPagination`, `isTerminalTaskStatus`) |
| 테스트 없음 (ai-agent) | pytest로 15개 테스트 (`contains_prompt_injection`, `truncate_text`, `SlidingWindowRateLimiter`) |
| `test` 스크립트 없음 | `"test": "node --test tests/*.test.js"` 추가 |

---

## Test Results

```
mail-server: 12 passed, 0 failed
ai-agent:    13 passed, 0 failed
```
