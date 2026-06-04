# 06-Deployment — Agentic Inbox (v0)

## 배포 토폴로지

```
[Client]
   │
[Cloudflare DNS / CDN]
   │
[Cloudflare Workers (에지)]
   │
[Email Routing] → Worker.email 핸들러
   │
[R2] [Durable Objects] [Workers AI]
```

## 배포 절차

### 1. 사전 준비

- Cloudflare 계정 (유료 권장)
- 커스텀 도메인 (예: `bizmatrixx.com`)
- Wrangler CLI v4.x

### 2. 초기 설정

```bash
cd v0/agent-inbox
pnpm install
pnpm dlx wrangler login
pnpm dlx wrangler r2 bucket create agentic-inbox
cp .dev.vars.example .dev.vars
```

### 3. 배포

```bash
pnpm run deploy
# 내부: pnpm run build && wrangler deploy
```

### 4. 배포 후 수동 설정

#### 4.1 도메인 및 라우트
- Dashboard → Workers & Pages → `agentic-inbox` → Domains & Routes
- `wrangler.jsonc`의 `vars.DOMAINS`에 도메인 기입

#### 4.2 Email Routing
- Dashboard → Email → Routes → Catch-all 규칙
- `@bizmatrixx.com` → `agentic-inbox` Worker
- Settings → `send_email` 바인딩 활성화

#### 4.3 Cloudflare Access
- Dashboard → Access → Applications → `agentic-inbox` 추가
- 정책 설정 → `POLICY_AUD` 복사
- `TEAM_DOMAIN` 또는 `/cdn-cgi/access/certs` URL 확보

#### 4.4 Secrets 등록

```bash
pnpm dlx wrangler secret put POLICY_AUD
pnpm dlx wrangler secret put TEAM_DOMAIN
```

## 환경 변수 및 Secrets

| 이름 | 종류 | 목적 | 설정 위치 |
|------|------|------|-----------|
| `DOMAINS` | Wrangler var | 수신 허용 도메인 | `wrangler.jsonc` |
| `EMAIL_ADDRESSES` | Wrangler var | 화이트리스트 | `wrangler.jsonc` |
| `ADMIN_EMAILS` | Wrangler var | 관리자 이메일 | `wrangler.jsonc` |
| `POLICY_AUD` | Secret | Access Policy Audience | `wrangler secret put` |
| `TEAM_DOMAIN` | Secret | Access 팀 도메인 | `wrangler secret put` |
| `.dev.vars` | 로컬 파일 | 개발용 오버라이드 | `.dev.vars` (Git 제외) |

## 롤백

```bash
# 즉시 롤백
npx wrangler rollback

# 특정 호환성 날짜로 롤백
npx wrangler deploy --compatibility-date 2025-10-01
```

> Workers 배포는 전 세계 엣지에 1~2분 내 전파됩니다.

## 프로덕션 체크리스트

- [ ] `wrangler.jsonc`의 `compatibility_date` 최신 확인
- [ ] R2 버킷 생성 및 바인딩 확인
- [ ] Email Routing catch-all 규칙 확인
- [ ] `send_email` 바인딩 활성화 확인
- [ ] Access Policy 및 secrets 등록 확인
- [ ] `ADMIN_EMAILS` 설정 확인
- [ ] `wrangler tail`로 에러 로그 확인
- [ ] 실제 이메일 수신/발송 테스트
- [ ] MCP 연동 테스트

## 비용 구조

| 항목 | 묵과 한도 | 초과 단가 |
|------|-----------|-----------|
| Workers 요청 | 100,000/일 | $0.50/백만 |
| Workers AI | 없음 | 토큰당 과금 |
| R2 저장 | 10GB | $0.015/GB/월 |
| R2 egress | 1GB/월 | $0.045/GB |
| DO 요청 | 100만/월 | $0.12/백만 |
| Email Routing | 묵과 | $0 |

## 보안 체크리스트

- [ ] Access JWT만으로 인증, 토큰 없는 요청 차단
- [ ] `ADMIN_EMAILS`로 write 권한 제한
- [ ] 프롬프트 인젝션 필터 활성화
- [ ] R2 객체 키에 예측 불가능한 ID 사용
- [ ] `.dev.vars`가 Git에 커밋되지 않음
