# 3.3 메일 서버 상세 설계 (Mail Server Design)

> 워터폴 3단계 상세설계 — Mail Server의 내부 구조, 모듈 책임, 에러 처리 전략을 다룬다.

---

## 3.3.1 파일 구조

```
services/mail-server/
├── Dockerfile
├── package.json
├── src/
│   ├── index.js       # Express 앱, 라우터, 서버 시작
│   ├── db.js          # PostgreSQL Pool, 쿼리 헬퍼
│   ├── redis.js       # Redis 이벤트 퍼블리셔 (ioredis)
│   ├── storage.js     # MinIO/S3 오브젝트 스토리지 클라이언트
│   └── seed.js        # 개발용 더미 데이터
├── tests/
│   └── utils.test.js  # Node test runner 유닛 테스트
└── migrations/
    └── 001_initial.sql
```

---

## 3.3.2 핵심 모듈

### `src/db.js`

**책임**: PostgreSQL 연결 관리

```javascript
import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDb() {
  // migrations/001_initial.sql 실행
}

export async function query(text, params) {
  // 로깅 + 쿼리 실행
  const res = await pool.query(text, params);
  return res;
}
```

**특성**:
- Connection Pooling (기본값 사용)
- 개발 환경에서 쿼리 실행 시간 로깅
- `initDb()`로 마이그레이션 자동 적용

---

### `src/redis.js` _(신규)_

**책임**: Redis Streams 이벤트 퍼블리싱

```javascript
import Redis from 'ioredis';
export const EMAIL_STREAM = 'email-events';

export async function publishEmailEvent(eventType, payload) {
  // XADD email-events * event_type new_email payload {...}
  // Redis 미연결 시 graceful degradation (로그만 출력)
}
```

**특성**:
- ioredis 기반 비동기 Redis 클라이언트
- Redis 장애 시 서비스 중단 없이 degradation

---

### `src/storage.js` _(신규)_

**책임**: MinIO/S3 오브젝트 스토리지 접근

```javascript
import * as Minio from 'minio';

export async function ensureBucket() { ... }
export async function uploadObject(storageKey, buffer, contentType, size) { ... }
export async function presignGetUrl(storageKey) { ... }  // 1시간 유효
export async function deleteObject(storageKey) { ... }
```

**특성**:
- `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET` 환경변수 의존
- presigned URL 유효 기간: 3600초

---

### `src/index.js`

**책임**: Express HTTP 서버

**라우팅 테이블**:

| 메서드 | 경로 | 핸들러 | 설명 |
|--------|------|--------|------|
| GET | `/health` | 헬스체크 | DB 연결 확인 |
| GET | `/api/v1/config` | 설정 반환 | 도메인, 이메일 주소 |
| GET | `/api/v1/mailboxes` | 목록 조회 | |
| POST | `/api/v1/mailboxes` | 생성 | + 시스템 폼더 자동 생성 (트랜잭션) |
| GET | `/api/v1/mailboxes/:id` | 상세 조회 | |
| PUT | `/api/v1/mailboxes/:id` | 수정 | settings 업데이트 |
| DELETE | `/api/v1/mailboxes/:id` | 삭제 | |
| GET | `/api/v1/mailboxes/:id/emails` | 이메일 목록 | 폼더/스레드/검색 필터 |
| POST | `/api/v1/mailboxes/:id/emails` | 발신 | SENT 폼더 저장 |
| GET | `/api/v1/mailboxes/:id/emails/:id` | 상세 조회 | + 첨부 메타데이터 |
| PUT | `/api/v1/mailboxes/:id/emails/:id` | 상태 변경 | read, starred |
| DELETE | `/api/v1/mailboxes/:id/emails/:id` | 삭제 | |
| POST | `/api/v1/mailboxes/:id/emails/:id/move` | 폼더 이동 | |
| GET | `/api/v1/mailboxes/:id/threads/:tid` | 스레드 조회 | |
| POST | `/api/v1/mailboxes/:id/threads/:tid/read` | 읽음 처리 | |
| POST | `/api/v1/mailboxes/:id/drafts` | Draft 저장 | |
| GET | `/api/v1/mailboxes/:id/folders` | 폼더 목록 | |
| POST | `/api/v1/mailboxes/:id/folders` | 폼더 생성 | |
| PUT | `/api/v1/mailboxes/:id/folders/:id` | 이름 수정 | |
| DELETE | `/api/v1/mailboxes/:id/folders/:id` | 삭제 | 시스템 폼더 제외 |
| GET | `/api/v1/mailboxes/:id/search` | 검색 | tsvector + LIMIT/OFFSET + totalCount |
| POST | `/api/v1/mailboxes/:id/test-autodraft` | AI draft 트리거 | AI Agent 호출 |
| GET | `/api/v1/mailboxes/:id/emails/:eid/attachments/:aid` | 첨부파일 | storage_key 있으면 presigned URL 302 리다이렉트 |
| POST | `/api/v1/webhooks/email` | 인바운드 이메일 수신 | X-Webhook-Secret 검증 + Redis publish |

---

## 3.3.3 에러 처리 전략

### 구현된 전략 _(P0-1 완료)_

```javascript
// 모든 async 라우터 자동 래핑
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

['get', 'post', 'put', 'delete', 'patch'].forEach((method) => {
  const orig = app[method].bind(app);
  app[method] = (path, ...fns) =>
    orig(path, ...fns.map((fn) => (typeof fn === 'function' ? asyncHandler(fn) : fn)));
});

// 전역 에러 핸들러 (4-arg Express 미들웨어)
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = NODE_ENV === 'production'
    ? 'Internal server error'
    : (err.message || 'Unknown error');
  console.error(`[${req.method}] ${req.path} →`, err);
  res.status(status).json({ success: false, error: { code: err.code || 'INTERNAL_ERROR', message } });
});
```

### 개선 현황

| 개선 | 이전 | 현재 |
|------|------|------|
| 글로벌 에러 핸들러 | 없음 (라우트별 try-catch) | ✅ Express 4-arg 핸들러 구현 |
| async 에러 전파 | 누락 가능 | ✅ asyncHandler 자동 래핑 |
| 에러 코드 체계 | 단일 `"ERROR"` | 부분 구현 (도메인별 확장 예정) |
| SQL 에러 마스킹 | 노출됨 | ✅ production 모드에서 generic 메시지 |
| 구조화 로그 | `console.error` | 향후 Winston/Pino 도입 예정 |

---

## 3.3.4 성능 고려사항

### 현재 구현의 한계

| 문제 | 원인 | 완화책 |
|------|------|--------|
| N+1 쿼리 | 이메일 상세 조회 시 attachments 별도 조회 | JOIN 또는 dataloader |
| 단일 연결 | 하나의 Pool | Primary/Replica 분리 |
| 정렬 컬럼 | 동적 ORDER BY | 화이트리스트 검증 (구현됨) |

### 구현된 최적화

```javascript
const ALLOWED_SORT_COLUMNS = [
  "id", "subject", "sender", "recipient", "date", "read", "starred"
];
```

- SQL Injection 방지: 문자열 보간 없이 컬럼 화이트리스트 매핑
- 폼더 필터: `id::text = $2 OR slug = $2 OR name = $2` (UUID 캐스트)
- 검색 페이지네이션: `LIMIT`/`OFFSET` + `COUNT(*)` 병렬 쿼리로 totalCount 반환 _(P1-2 완료)_
- 폴더 생성: BEGIN/COMMIT/ROLLBACK 트랜잭션으로 원자성 보장
