# v1 Integration Testing Strategy

## 1. 테스트 피라미드

```
        ┌─────────┐
        │   E2E   │  ← Playwright (Browser)
        │  (10%)  │
       ┌┴─────────┴┐
       │ Integration│  ← TestContainers, MockServer
       │   (30%)   │
      ┌┴───────────┴┐
      │    Unit     │  ← Jest, pytest
      │   (60%)     │
      └─────────────┘
```

## 2. 통합 테스트 환경

### 2.1 TestContainers

```typescript
// tests/integration/setup.ts
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer } from '@testcontainers/redis';
import { GenericContainer } from 'testcontainers';

export async function setupTestEnvironment() {
  const postgres = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('test_db')
    .withUsername('test')
    .withPassword('test')
    .start();

  const redis = await new RedisContainer('redis:7-alpine').start();

  const minio = await new GenericContainer('minio/minio:latest')
    .withExposedPorts(9000)
    .withCommand(['server', '/data'])
    .withEnvironment({
      MINIO_ROOT_USER: 'test',
      MINIO_ROOT_PASSWORD: 'test12345'
    })
    .start();

  return { postgres, redis, minio };
}
```

### 2.2 WireMock (외부 AI API 모킹)

```yaml
# tests/mocks/openai-mock.yaml
mappings:
  - request:
      method: POST
      url: /v1/chat/completions
    response:
      status: 200
      body: |
        {
          "choices": [{
            "message": {
              "content": "{\"tool_calls\": [{\"tool\": \"draft_reply\", \"arguments\": {\"body\": \"Thank you for your inquiry.\"}}]}"
            }
          }]
        }
```

## 3. 서비스별 통합 테스트

### 3.1 Mail Server + Database

```typescript
// tests/integration/mail-server.test.ts
describe('Mail Server Integration', () => {
  let db: Pool;
  let app: Express;
  let testEnv: TestEnvironment;

  beforeAll(async () => {
    testEnv = await setupTestEnvironment();
    db = new Pool({ connectionString: testEnv.postgres.getConnectionUri() });
    app = createApp({ databaseUrl: testEnv.postgres.getConnectionUri() });
  });

  afterAll(async () => {
    await db.end();
    await testEnv.postgres.stop();
  });

  it('should create email and store in PostgreSQL', async () => {
    const response = await request(app)
      .post('/api/v1/mailboxes/test-box/emails')
      .send({
        to: 'recipient@example.com',
        subject: 'Test',
        body_html: '<p>Hello</p>'
      })
      .expect(201);

    const result = await db.query(
      'SELECT * FROM emails WHERE id = $1',
      [response.body.data.id]
    );
    expect(result.rows[0].subject).toBe('Test');
  });

  it('should move email between folders', async () => {
    // Create email
    const email = await createTestEmail(db, { folder_id: 'inbox' });

    // Move to archive
    await request(app)
      .post(`/api/v1/mailboxes/test-box/emails/${email.id}/move`)
      .send({ folder_id: 'archive' })
      .expect(200);

    const result = await db.query(
      'SELECT folder_id FROM emails WHERE id = $1',
      [email.id]
    );
    expect(result.rows[0].folder_id).toBe('archive');
  });
});
```

### 3.2 AI Agent + Mail Server + Mock AI

```python
# tests/integration/test_ai_agent.py
import pytest
from httpx import AsyncClient
from testcontainers.postgres import PostgresContainer
from testcontainers.redis import RedisContainer

@pytest.fixture
async def test_services():
    postgres = PostgresContainer("postgres:16-alpine").start()
    redis = RedisContainer("redis:7-alpine").start()

    # Start mock OpenAI server
    mock_ai = await start_mock_ai_server()

    # Start Mail Server
    mail_server = await start_mail_server(
        database_url=postgres.get_connection_url(),
        redis_url=redis.get_connection_url()
    )

    # Start AI Agent
    ai_agent = await start_ai_agent(
        database_url=postgres.get_connection_url(),
        redis_url=redis.get_connection_url(),
        mail_server_url=mail_server.url,
        openai_base_url=mock_ai.url
    )

    yield {
        'postgres': postgres,
        'redis': redis,
        'mail_server': mail_server,
        'ai_agent': ai_agent,
        'mock_ai': mock_ai
    }

    # Cleanup
    await mail_server.stop()
    await ai_agent.stop()
    postgres.stop()
    redis.stop()

@pytest.mark.asyncio
async def test_auto_draft_creation(test_services):
    mail_server = test_services['mail_server']
    ai_agent = test_services['ai_agent']

    # 1. Create incoming email
    email = await mail_server.create_email(
        mailbox_id='test-box',
        folder='inbox',
        sender='client@example.com',
        subject='Quote request',
        body_text='Please send me a quote for website redesign.'
    )

    # 2. Publish event to Redis
    await test_services['redis'].xadd('email-events', {
        'data': json.dumps({
            'event_type': 'new_email',
            'payload': {
                'mailbox_id': 'test-box',
                'email_id': email['id'],
                'sender': 'client@example.com',
                'subject': 'Quote request',
                'thread_id': email['thread_id']
            }
        })
    })

    # 3. Wait for AI agent to process
    await asyncio.sleep(2)

    # 4. Verify draft was created
    drafts = await mail_server.get_emails(
        mailbox_id='test-box',
        folder='draft'
    )

    assert len(drafts['emails']) == 1
    assert drafts['emails'][0]['subject'] == 'Re: Quote request'
    assert 'quote' in drafts['emails'][0]['body_text'].lower()
```

### 3.3 Message Queue 신뢰성 테스트

```typescript
describe('Queue Reliability', () => {
  it('should process message exactly once', async () => {
    const event = createTestEvent();

    // Publish event
    await redis.xadd('email-events', '*', 'data', JSON.stringify(event));

    // Multiple consumers start simultaneously
    const consumers = await Promise.all([
      startConsumer('consumer-1'),
      startConsumer('consumer-2'),
      startConsumer('consumer-3')
    ]);

    // Wait for processing
    await sleep(3000);

    // Verify exactly one draft was created
    const drafts = await db.query('SELECT COUNT(*) FROM emails WHERE folder_id = $1', ['draft']);
    expect(parseInt(drafts.rows[0].count)).toBe(1);
  });

  it('should move failed messages to DLQ after 3 retries', async () => {
    // Configure mock AI to always fail
    mockAI.setFailureRate(1.0);

    const event = createTestEvent();
    await redis.xadd('email-events', '*', 'data', JSON.stringify(event));

    await sleep(30000); // Wait for retries

    // Verify DLQ
    const dlq = await redis.xrange('email-events-dlq', '-', '+');
    expect(dlq.length).toBe(1);
    expect(dlq[0][1].retry_count).toBe('3');
  });
});
```

## 4. E2E 테스트

### 4.1 Playwright 시나리오

```typescript
// tests/e2e/draft-creation.spec.ts
import { test, expect } from '@playwright/test';

test('user receives email and AI creates draft', async ({ page }) => {
  // 1. Login
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.click('[data-testid="login-button"]');

  // 2. Select mailbox
  await page.click('[data-testid="mailbox-sales"]');

  // 3. Verify incoming email appears
  await expect(page.locator('[data-testid="email-subject"]').first())
    .toContainText('Quote request');

  // 4. Open AI chat
  await page.click('[data-testid="ai-chat-button"]');

  // 5. Ask AI to draft reply
  await page.fill('[data-testid="chat-input"]', 'Draft a reply to the quote request');
  await page.press('[data-testid="chat-input"]', 'Enter');

  // 6. Verify AI response
  await expect(page.locator('[data-testid="chat-message"]').last())
    .toContainText('Drafted a reply');

  // 7. Navigate to Drafts
  await page.click('[data-testid="folder-drafts"]');

  // 8. Verify draft exists
  await expect(page.locator('[data-testid="email-subject"]').first())
    .toContainText('Re: Quote request');
});
```

## 5. 성능 테스트

### 5.1 k6 부하 테스트

```javascript
// tests/performance/email-list.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 100 },   // Ramp up
    { duration: '3m', target: 100 },   // Steady state
    { duration: '1m', target: 200 },   // Spike
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get(
    'http://localhost:8080/api/v1/mailboxes/test-box/emails?folder=inbox&limit=20',
    { headers: { Authorization: `Bearer ${__ENV.TEST_TOKEN}` } }
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}
```

### 5.2 AI 응답 시간 테스트

```typescript
describe('AI Response Performance', () => {
  it('should generate draft within 15 seconds', async () => {
    const start = Date.now();

    const response = await request(aiAgent)
      .post('/api/v1/mailboxes/test-box/ai/draft')
      .send({ email_id: testEmailId })
      .expect(200);

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(15000);
    expect(response.body.data.draft_id).toBeDefined();
  });
});
```

## 6. CI/CD 파이프라인

```yaml
# .github/workflows/test.yml
name: Integration Tests
on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run unit tests
        run: |
          cd services/mail-server && npm test
          cd ../ai-agent && pytest
          cd ../user-service && npm test

  integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Start test environment
        run: docker-compose -f docker-compose.test.yml up -d
      - name: Run integration tests
        run: npm run test:integration
      - name: Cleanup
        run: docker-compose -f docker-compose.test.yml down -v

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Start full stack
        run: docker-compose up -d
      - name: Run Playwright
        run: npx playwright test
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```
