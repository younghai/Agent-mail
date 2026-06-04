# 05-Testing — Agentic Inbox (v0)

## 테스트 전략

| 레벨 | 도구 | 범위 | 자동화 |
|------|------|------|--------|
| 단위 테스트 | Node.js built-in test runner | 유틸리티 함수 | ✅ CI |
| 통합 테스트 | Miniflare / Vitest | DO, API 라우트 | ✅ CI |
| E2E 테스트 | Playwright | React SPA 플로우 | 수동 |
| 에지 테스트 | Wrangler dev + curl | 실제 엣지 동작 | 수동 |

## 단위 테스트

```typescript
// tests/admin-logic.test.ts (기존)
import { test } from 'node:test';
import assert from 'node:assert';
import { calculateCompletionRate, groupTasksByStatus } from '../workers/lib/admin';

test('calculateCompletionRate returns correct percentage', () => {
  const tasks = [
    { status: 'completed' },
    { status: 'completed' },
    { status: 'pending' }
  ];
  assert.strictEqual(calculateCompletionRate(tasks), 66.67);
});
```

## 통합 테스트 (Miniflare)

```typescript
// tests/api.test.ts (예시)
import { Miniflare } from 'miniflare';

const mf = new Miniflare({
  scriptPath: './workers/app.ts',
  modules: true,
  durableObjects: {
    MAILBOX: 'MailboxDO'
  }
});

test('create mailbox', async () => {
  const res = await mf.dispatchFetch('http://localhost/api/v1/mailboxes', {
    method: 'POST',
    body: JSON.stringify({ email: 'test@bizmatrixx.com' })
  });
  assert.strictEqual(res.status, 200);
});
```

## E2E 테스트 시나리오

### TC-01 메일박스 생성 → 이메일 수신 → 초안 확인

| 단계 | 동작 | 기대 결과 |
|------|------|-----------|
| 1 | 메일박스 `test@bizmatrixx.com` 생성 | R2 설정 JSON 저장 |
| 2 | Email Routing catch-all 테스트 | Worker가 이메일 수신 |
| 3 | React SPA에서 메일박스 선택 | 이메일 목록 표시 |
| 4 | Drafts 폴리 확인 | AI 초안이 자동 생성됨 |

### TC-02 MCP 연동

| 단계 | 동작 | 기대 결과 |
|------|------|-----------|
| 1 | Claude Code에서 MCP 서버 추가 | `https://<worker>/mcp` |
| 2 | `list_mailboxes` 호출 | 메일박스 목록 반환 |
| 3 | `draft_reply` 호출 | 초안 생성 및 반환 |

## 보안 테스트

| 항목 | 방법 | 기준 |
|------|------|------|
| 프롬프트 인젝션 | OWASP LLM 케이스 | `isPromptInjection` 탐지 확인 |
| Access JWT 위조 | 잘못된 JWT로 API 호출 | 401 응답 |
| DO 격리 | 메일박스 A에서 B 데이터 접근 | 접근 불가 |

## CI/CD (권장)

```yaml
# .github/workflows/test.yml
name: Test
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```
