# 1. 요구사항 분석 (Requirements Analysis)

> 워터폴 1단계 — 비즈니스 목표를 만족하는 기능/비기능 요구사항을 정의한다. 본 문서는 `services/` 디렉토리에 구현된 v1 실행 가능 코드를 기반으로 as-built 요구사항을 작성한다.

---

## 1.1 기능 요구사항 (Functional)

### FR-01 메일 서버 (Mail Server Service)

| ID | 요구사항 | 구현 상태 | 위치 |
|----|---------|----------|------|
| FR-01.1 | 메일박스 CRUD API | ✅ 완료 | `mail-server/src/index.js` |
| FR-01.2 | 이메일 목록 조회 (폼더별, 페이징, 정렬) | ✅ 완료 | `GET /api/v1/mailboxes/:id/emails` |
| FR-01.3 | 이메일 상세 조회 (본문 + 첨부 메타데이터) | ✅ 완료 | `GET /api/v1/mailboxes/:id/emails/:id` |
| FR-01.4 | 이메일 발신 (SENT 폼더 저장) | ✅ 완료 | `POST /api/v1/mailboxes/:id/emails` |
| FR-01.5 | Draft 생성/수정 | ✅ 완료 | `POST /api/v1/mailboxes/:id/drafts` |
| FR-01.6 | 폼더 이동 | ✅ 완료 | `POST .../emails/:id/move` |
| FR-01.7 | 스레드 조회 및 읽음 처리 | ✅ 완료 | `GET/POST .../threads/:id` |
| FR-01.8 | 폼더 CRUD (시스템 폼더 보호) | ✅ 완료 | `GET/POST/PUT/DELETE .../folders` |
| FR-01.9 | PostgreSQL Full-Text Search | ✅ 완료 | `GET .../search?q=...` |
| FR-01.10 | 첨부파일 메타데이터 관리 | ✅ 완료 | `attachments` 테이블 |

### FR-02 AI 에이전트 (AI Agent Service)

| ID | 요구사항 | 구현 상태 | 위치 |
|----|---------|----------|------|
| FR-02.1 | 자동 답변 초안 생성 | ✅ 완료 | `POST .../ai/draft` |
| FR-02.2 | 스레드 컨텍스트 기반 답변 | ✅ 완료 | `main.py` thread 로드 |
| FR-02.3 | 실시간 채팅 스트리밍 (SSE) | ✅ 완료 | `POST .../ai/chat` |
| FR-02.4 | 메일박스별 시스템 프롬프트 | ✅ 완료 | `mailboxes.ai_system_prompt` |
| FR-02.5 | OpenAI Provider 연동 | ✅ 완료 | `openai.AsyncOpenAI` |
| FR-02.6 | AI 응답 실패 시 graceful degradation | ✅ 완료 | `missing_key` 상태 반환 |

### FR-03 데이터베이스

| ID | 요구사항 | 구현 상태 | 위치 |
|----|---------|----------|------|
| FR-03.1 | PostgreSQL 스키마 초기화 | ✅ 완료 | `migrations/001_initial.sql` |
| FR-03.2 | Full-Text Search (tsvector + GIN) | ✅ 완료 | `emails.search_vector` |
| FR-03.3 | 트리거 기반 검색 인덱스 자동 업데이트 | ✅ 완료 | `emails_search_vector_trigger` |
| FR-03.4 | 기본 메일박스 + 시스템 폼더 자동 생성 | ✅ 완료 | `INSERT` in migration |

---

## 1.2 비기능 요구사항 (Non-Functional)

### NFR-01 성능

| ID | 요구사항 | 목표값 | 검증 방법 |
|----|---------|--------|----------|
| NFR-01.1 | 이메일 목록 조회 응답 | p95 < 200ms | `curl` + `time` |
| NFR-01.2 | AI draft 생성 | < 15초 | OpenAI API latency |
| NFR-01.3 | API 가용성 | 99.9% | 헬스체크 + 로그 |

### NFR-02 보안

| ID | 요구사항 | 구현 상태 |
|----|---------|----------|
| NFR-02.1 | SQL Injection 방지 | ✅ Parameterized Query (`pg`) |
| NFR-02.2 | CORS 설정 | ✅ `cors()` 미들웨어 (개발용 `*`) |
| NFR-02.3 | 에러 메시지 노출 제한 | ✅ `sendError()` 일관 사용 |

### NFR-03 운영

| ID | 요구사항 | 구현 상태 |
|----|---------|----------|
| NFR-03.1 | 헬스체크 엔드포인트 | ✅ `/health` (DB 연결 확인) |
| NFR-03.2 | Docker 컨테이너화 | ✅ `Dockerfile` + `docker-compose.yml` |
| NFR-03.3 | 환경변수 기반 설정 | ✅ `DATABASE_URL`, `OPENAI_API_KEY` 등 |

---

## 1.3 인터페이스 요구사항

### 외부 시스템 연동

| 시스템 | 방향 | 프로토콜 | 용도 | 구현 |
|--------|------|---------|------|------|
| OpenAI API | AI Agent → 외부 | HTTPS/REST | LLM 추론 | `openai` SDK |
| PostgreSQL | Mail/AI Agent → DB | TCP/5432 | 데이터 영속화 | `pg` / `psycopg2` |
| Redis (예정) | Mail Server → Cache | TCP/6379 | 세션/캐시/큐 | `docker-compose` 정의 |
| MinIO/S3 (예정) | Mail Server → Storage | HTTP/9000 | 첨부파일 바이너리 | `docker-compose` 정의 |
