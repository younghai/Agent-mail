# v0 Cloudflare Deployment Guide

## 1. 사전 준비

### 1.1 필요한 계정 및 서비스

- Cloudflare 계정 (Free tier로 시작 가능)
- Cloudflare에 등록된 도메인 (예: `bizmatrixx.com`)
- Workers AI 활성화 (Dashboard → AI → Workers AI)

### 1.2 로컬 환경 설정

```bash
npm install
npx wrangler login  # OAuth로 Cloudflare 로그인
```

## 2. 설정 파일

### 2.1 `wrangler.jsonc`

```json
{
  "name": "agentic-inbox",
  "compatibility_date": "2025-11-28",
  "main": "./workers/app.ts",
  "vars": {
    "DOMAINS": "bizmatrixx.com",
    "EMAIL_ADDRESSES": []
  },
  "send_email": [{ "name": "EMAIL", "remote": true }],
  "r2_buckets": [{
    "binding": "BUCKET",
    "bucket_name": "agentic-inbox",
    "preview_bucket_name": "agentic-inbox"
  }],
  "ai": { "binding": "AI" },
  "durable_objects": {
    "bindings": [
      { "name": "MAILBOX", "class_name": "MailboxDO" },
      { "name": "EMAIL_AGENT", "class_name": "EmailAgent" },
      { "name": "EMAIL_MCP", "class_name": "EmailMCP" }
    ]
  }
}
```

### 2.2 Secrets (민감 정보)

```bash
# Production 환경 변수 설정
npx wrangler secret put POLICY_AUD        # Cloudflare Access Audience
npx wrangler secret put TEAM_DOMAIN       # Cloudflare Access Team Domain
```

## 3. 배포 단계

### 3.1 R2 버킷 생성

```bash
npx wrangler r2 bucket create agentic-inbox
```

### 3.2 Durable Objects 마이그레이션

최초 배포 시 DO 클래스가 자동으로 등록됩니다. 기존 배포에서 클래스 이름을 변경하면 마이그레이션이 필요합니다.

```bash
npx wrangler deploy
```

### 3.3 Email Routing 설정

1. Cloudflare Dashboard → Email → Email Routing → Routes
2. Catch-all rule 생성: `*@bizmatrixx.com` → `agentic-inbox` Worker
3. `EMAIL_ADDRESSES`에 수신 주소 등록

```json
"vars": {
  "EMAIL_ADDRESSES": ["inbox@bizmatrixx.com", "support@bizmatrixx.com"]
}
```

### 3.4 Cloudflare Access 설정 (Production)

1. Dashboard → Access → Applications → Add
2. Self-hosted app 추가
3. Application URL: `https://agentic-inbox.your-subdomain.workers.dev`
4. Policies 설정 (허용할 팀원 이메일)
5. `POLICY_AUD`와 `TEAM_DOMAIN`를 Wrangler secrets에 저장

## 4. 배포 환경별 구성

| 환경 | 명령어 | 특성 |
|------|--------|------|
| **Local** | `npm run dev` | SQLite 파일, AI 원격 호출 |
| **Preview** | `wrangler deploy` | `.workers.dev` 도메인, 실제 Workers 환경 |
| **Production** | `wrangler deploy --env production` | 커스텀 도메인, Access 인증 활성화 |

## 5. 배포 후 검증 체크리스트

- [ ] Worker가 정상적으로 응답하는가? (`curl https://<domain>/api/v1/config`)
- [ ] R2 버킷에 파일 쓰기/읽기가 가능한가?
- [ ] Durable Object가 정상 생성되는가?
- [ ] Email Routing이 Worker로 전달되는가?
- [ ] Workers AI 모델 호출이 정상인가?
- [ ] Cloudflare Access 로그인 후 UI 접근 가능한가?

## 6. 롤백 전략

Cloudflare Workers는 배포가 즉시 전역에 적용됩니다. 롤백이 필요하면:

```bash
# 이전 버전으로 롤백
npx wrangler rollback

# 또는 특정 버전으로 롤백
npx wrangler rollback --version-id=<version-id>
```

## 7. 비용 예상

| 서비스 | Free Tier | 유료 시 예상 |
|--------|-----------|-------------|
| Workers | 100,000 requests/day | $0.30/ million |
| Workers AI | 10,000 Neurons/day | $0.011 / 1K Neurons |
| R2 | 10GB storage, 1M ops | $0.015/GB storage |
| Durable Objects | 물리적 호출 제한 | 호출당 $0.12/million |
| Email Routing | 수신 물결 | 발신 Workers Email 바인딩 |

## 8. 알려진 제한사항

1. **Durable Object SQLite**: 파일 크기 제한이 있으며, 대용량 데이터는 R2로 오프로드해야 함
2. **Workers AI 지연**: Edge location과 AI inferencing location 간 네트워크 지연 존재
3. **Email Send**: `remote: true`로 설정 시 Cloudflare Email Send API를 사용하며, 일일 발신 한도 존재
4. **DO 위치 제약**: Durable Object는 생성된 리전에 바인딩되며, 전역 분산은 자동으로 이루어지지 않음
