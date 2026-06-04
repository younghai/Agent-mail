# 5. 테스트 전략 (Test Strategy)

> 워터폴 5단계 — 기능, 통합, 성능 테스트 계획을 다룬다.

---

## 5.1 테스트 계층

```
┌─────────────────────────────────────────┐
│       E2E / UI Tests (Playwright)        │
├─────────────────────────────────────────┤
│     API Integration Tests (Supertest)    │
├─────────────────────────────────────────┤
│  Unit Tests (Jest/Pytest)               │
├─────────────────────────────────────────┤
│  Manual / Smoke Tests                   │
└─────────────────────────────────────────┘
```

---

## 5.2 단위 테스트 (Unit Tests)

### Mail Server (Jest)

```javascript
// __tests__/routes.test.js (예시)
describe('GET /api/v1/mailboxes/:id/emails', () => {
  test('폼더별 이메일 목록 반환', async () => {
    const res = await request(app)
      .get('/api/v1/mailboxes/test-id/emails?folder=inbox')
      .expect(200);
    expect(res.body.data.emails).toBeInstanceOf(Array);
  });

  test('정렬 컬럼 화이트리스트 검증', async () => {
    const res = await request(app)
      .get('/api/v1/mailboxes/test-id/emails?sortColumn=injected')
      .expect(400);
    expect(res.body.error.code).toBe('INVALID_SORT_COLUMN');
  });
});
```

### AI Agent (Pytest)

```python
# tests/test_draft.py (예시)
def test_draft_endpoint_requires_openai_key(client):
    res = client.post('/api/v1/mailboxes/test-id/ai/draft',
                      json={'email_id': 'test', 'body_text': 'test'})
    assert res.status_code == 503
    assert res.json()['error']['code'] == 'AI_PROVIDER_NOT_CONFIGURED'
```

---

## 5.3 통합 테스트 (Integration Tests)

### Mail Server + PostgreSQL

- Docker Compose로 PostgreSQL 컨테이너 실행
- 마이그레이션 적용 후 API 호출
- 데이터 일관성 검증

```bash
# scripts/test-integration.sh (예시)
docker-compose -f docker-compose.test.yml up -d
npm test -- --testPathPattern=integration
```

### AI Agent + OpenAI Mock

- OpenAI API를 WireMock / pytest-httpx로 모킹
- 응답 포맷, 에러 처리 검증

---

## 5.4 성능 테스트 (Performance Tests)

| 시나리오 | 도구 | 목표 |
|----------|------|------|
| 이메일 목록 조회 1000건 | k6 / autocannon | p95 < 200ms |
| AI Draft 생성 동시 10건 | k6 | p95 < 5s |
| 검색 Full-Text 10000건 | k6 | p95 < 500ms |

### k6 스크립트 예시

```javascript
// tests/perf/load-test.js
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  http.get('http://localhost:8080/api/v1/mailboxes/test-id/emails');
}
```

---

## 5.5 현재 테스트 현황

| 레벨 | 상태 | 커버리지 |
|------|------|----------|
| 단위 테스트 | ❌ 미구현 | 0% |
| 통합 테스트 | ❌ 미구현 | 0% |
| E2E 테스트 | ❌ 미구현 | 0% |
| Smoke Test | ✅ 수동 | 핵심 API 확인 |

### Smoke Test 체크리스트

```bash
# Mail Server
✅ GET /health → 200 {"status":"healthy"}
✅ GET /api/v1/config → 도메인 목록
✅ GET /api/v1/mailboxes → 메일박스 목록
✅ GET /api/v1/mailboxes/:id/emails?folder=inbox → 이메일 목록
✅ GET /api/v1/mailboxes/:id/threads/:tid → 스레드 이메일

# AI Agent
✅ GET /health → DB ok, AI Provider ok
✅ POST /api/v1/mailboxes/:id/ai/draft → draft 생성 (키 있을 때)
✅ POST /api/v1/mailboxes/:id/ai/chat → SSE 스트리밍
```

---

## 5.6 CI/CD 테스트 계획

| 단계 | 작업 | 조건 |
|------|------|------|
| **Build** | Docker 이미지 빌드 | 매 PR |
| **Lint** | ESLint + Prettier + Ruff | 매 PR |
| **Unit** | Jest + Pytest | 매 PR |
| **Integration** | Docker Compose up + API 테스트 | main 브랜치 |
| **E2E** | Playwright (선택적) | 릴리즈 전 |
