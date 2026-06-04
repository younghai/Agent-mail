# v0 Agentic Inbox — 배포 가이드

> **대상**: Cloudflare Workers 기반 에지 아키텍처
> **핵심**: `wrangler deploy` 한 줄 배포 + Cloudflare Dashboard 후속 설정

---

## 1. 사전 준비

| 항목 | 요건 | 비고 |
|------|------|------|
| Cloudflare 계정 | 유료 요금제 권장 | Workers AI, Email Routing, R2 사용 |
| 커스텀 도메인 | 예: `bizmatrixx.com` | Email Routing에 필요 |
| Wrangler CLI | v4.x | `pnpm add -g wrangler` |
| Node.js | 22+ | `node --version` |

---

## 2. 초기 설정

### 2.1 Wrangler 로그인

```bash
pnpm dlx wrangler login
```

### 2.2 R2 버킷 생성

```bash
pnpm dlx wrangler r2 bucket create agentic-inbox
```

### 2.3 로컬 개발 변수 (선택)

```bash
cp .dev.vars.example .dev.vars
# .dev.vars는 로컬에서만 사용. 값을 비워두어도 Access 인증이 자동 스킵됨
```

---

## 3. 배포

### 3.1 명령어

```bash
pnpm run deploy
# 내부: pnpm run build && wrangler deploy
```

### 3.2 배포 확인

```bash
pnpm dlx wrangler tail
# 실시간 로그 스트리밍
```

---

## 4. 배포 후 Cloudflare Dashboard 설정

배포만으로는 이메일 수신/발송이 불가능합니다. 아래 4가지를 반드시 수동 설정합니다.

### 4.1 도메인 및 라우트

1. Cloudflare Dashboard → Workers & Pages → `agentic-inbox` 선택
2. Settings → Domains & Routes 에서 커스텀 도메인 연결
3. `wrangler.jsonc`의 `vars.DOMAINS`에 사용 도메인 기입

### 4.2 Email Routing (수신)

1. Dashboard → Email → Email Routing → Routes
2. Catch-all 규칙 생성: `@bizmatrixx.com` → `agentic-inbox` Worker 로 전달
3. Email → Settings → `send_email` 바인딩 활성화

### 4.3 Cloudflare Access (인증)

1. Dashboard → Access → Applications → `agentic-inbox` 추가
2. 정책 설정 후 `POLICY_AUD` 값 복사
3. 팀 도메인 또는 `/cdn-cgi/access/certs` URL을 `TEAM_DOMAIN`으로 사용

### 4.4 Secrets 등록

```bash
# 대화형 입력
pnpm dlx wrangler secret put POLICY_AUD
pnpm dlx wrangler secret put TEAM_DOMAIN
```

### 4.5 Wrangler 변수 설정

```bash
# wrangler.jsonc의 vars는 코드에 포함되므로 민감하지 않은 값만 사용
# ADMIN_EMAILS, DOMAINS, EMAIL_ADDRESSES는 wrangler.jsonc에서 직접 수정 후 재배포
```

---

## 5. 환경 변수 및 Secrets

| 이름 | 종류 | 목적 | 설정 위치 |
|------|------|------|-----------|
| `DOMAINS` | Wrangler var | 수신 허용 도메인 | `wrangler.jsonc` |
| `EMAIL_ADDRESSES` | Wrangler var | 허용 메일박스 화이트리스트 | `wrangler.jsonc` |
| `ADMIN_EMAILS` | Wrangler var | 관리자 이메일 목록 | `wrangler.jsonc` |
| `POLICY_AUD` | Secret | Cloudflare Access Policy Audience | `wrangler secret put` |
| `TEAM_DOMAIN` | Secret | Access 팀 도메인 또는 certs URL | `wrangler secret put` |
| `.dev.vars` | 로컬 파일 | 로컬 개발 시 Access secrets 오버라이드 | `.dev.vars` (Git 제외) |

---

## 6. 롤백

```bash
# 이전 버전으로 즉시 롤백
pnpm dlx wrangler rollback

# 특정 호환성 날짜로 롤백
pnpm dlx wrangler deploy --compatibility-date 2025-10-01
```

> Workers 배포는 전 세계 엣지에 1~2분 내 전파됩니다.

---

## 7. 프로덕션 체크리스트

- [ ] `wrangler.jsonc`의 `compatibility_date`가 최신인지 확인
- [ ] R2 버킷 `agentic-inbox`가 생성되었고 Worker에 바인딩됨
- [ ] Email Routing catch-all 규칙이 Worker를 가리킴
- [ ] `send_email` 바인딩이 활성화됨
- [ ] Access Policy가 설정되고 `POLICY_AUD` / `TEAM_DOMAIN` secrets가 등록됨
- [ ] `ADMIN_EMAILS`에 최소 1명의 관리자 이메일이 설정됨
- [ ] `pnpm dlx wrangler tail`로 에러 로그가 없는지 확인
- [ ] 실제 이메일 발송/수신 테스트 완료
- [ ] Workers AI 사용량 대시보드 확인 (비용 예상)

---

## 8. 비용 구조

| 항목 | 과금 기준 | 예상 (월 1,000건) |
|------|-----------|-------------------|
| Workers 요청 | 100만회/일 묵과 후 $0.50/백만 | ~$0 |
| Workers AI (@cf/moonshotai/kimi-k2.5) | 토큰당 과금 | 약 $5~20 |
| R2 저장 | 10GB 묵과 후 $0.015/GB | ~$0 |
| R2 egress | 1GB/월 묵과 후 $0.045/GB | ~$0 |
| Email Routing | 묵과 | $0 |

> Workers AI는 로컬 개발 중에도 실제 API를 호출하므로 크레딧이 소모됩니다.
