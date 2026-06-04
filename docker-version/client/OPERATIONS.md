# v0 Agentic Inbox — 운영 런북

> **대상**: Cloudflare Workers 기반 서비스 운영자
> **목표**: 엣지 아키텍처 특성상의 모니터링, 비용, 보안, 장애 대응 절차 정의

---

## 1. 서비스 개요

| 구성 요소 | 기술 | 상태 관리 방식 |
|-----------|------|---------------|
| 프론트엔드 | React 19 SPA (Vite) | 상태 없음 (SSR) |
| API / Worker | Hono + Cloudflare Workers | 상태 없음 |
| 메일박스 데이터 | Durable Objects (SQLite) | 메일박스별 격리 저장 |
| 에이전트 상태 | EmailAgent DO | WebSocket 기반 세션 |
| 첨부파일 | R2 | 메타데이터는 DO, blob은 R2 |
| AI 추론 | Workers AI (@cf/moonshotai/kimi-k2.5) | 상태 없음 |
| 관리자/CRM | AdminDO (글로벌 싱글톤) | SQLite |

---

## 2. 모니터링

### 2.1 Wrangler 로그 (실시간)

```bash
npx wrangler tail
```

- 모든 `console.log`, `console.error`가 실시간 스트리밍됨
- 프로덕션에서는 로그가 너무 많으므로 필터링 사용

### 2.2 Cloudflare Analytics

- Dashboard → Workers → `agentic-inbox` → Analytics
- 확인 지표:
  - 요청 수 / 분
  - 오류율 (4xx, 5xx)
  - CPU 시간 (밀리초)
  - Subrequests (DO, R2, AI 호출 횟수)

### 2.3 Workers AI 사용량

- Dashboard → AI → Workers AI
- 확인 지표:
  - 총 토큰 수 (입력/출력)
  - 모델별 호출 횟수
  - 추론 지연 시간

---

## 3. 비용 관리

| 항목 | 묵과 한도 | 초과 시 단가 | 절감 전략 |
|------|-----------|-------------|-----------|
| Workers 요청 | 100,000/일 | $0.30/백만 | 캐싱, 불필요한 폴리 제거 |
| Workers AI | 없음 (토큰 과금) | 모델별 상이 | Triage Router로 불필요한 AI 호출 스킵 |
| R2 저장 | 10GB | $0.015/GB/월 | 오래된 첨부파일 정책 수립 |
| R2 egress | 1GB/월 | $0.045/GB | CDN 캐싱 활용 |
| DO 요청 | 100만/월 | $0.12/백만 | 배치 처리 |

**월간 비용 예측**:
- 1,000메일/월, AI 초안 500건 기준: 약 $10~30

---

## 4. 보안

### 4.1 Access JWT 인증

- 프로덕션에서는 Cloudflare Access를 통해 모든 요청이 JWT로 보호됨
- `import.meta.env.DEV`가 아닌 경우, `POLICY_AUD`와 `TEAM_DOMAIN` secrets가 필수
- `.dev.vars`는 개발자 로컬에만 존재하도록 Git 제외 확인

### 4.2 RBAC

- `ADMIN_EMAILS` wrangler var에 콤마로 구분된 관리자 이메일 등록
- API는 `cf-access-authenticated-user-email` 헤더를 기반으로 역할 검증
- 역할: `admin`, `manager`, `operator`, `viewer`

### 4.3 프롬프트 인젝션 방지

- `EmailAgent`가 이메일 본문 + 스레드 컨텍스트를 `isPromptInjection`으로 사전 검사
- 실패 시 초안 생성을 중단하고 fallback 메시지 반환

---

## 5. 알려진 이슈 및 한계

| 이슈 | 위치 | 영향 | 완화책 |
|------|------|------|--------|
| 메일박스 삭제 시 고아 데이터 | `workers/index.ts:388` | 디스크 공간 낭비 | 주기적 정비 스크립트 필요 (미구현) |
| 로컬에서 이메일 수신 불가 | 아키텍처 한계 | 수신 기능 로컬 테스트 불가 | 배포 후 Email Routing으로 테스트 |
| Workers AI 과금 | 개발 환경 | 로컬 개발 시에도 비용 발생 | 짧은 프롬프트, 캐싱 사용 |
| DO SQLite 마이그레이션 | `applyMigrations()` | 대규모 메일박스에서 초기 기동 지연 | 마이그레이션 최소화 설계 |

---

## 6. 장애 시나리오 및 대응

### 6.1 이메일 라우팅 중단

**징후**: 수신 이메일이 Worker에 도달하지 않음
**조치**:
1. Dashboard → Email → Routing → Routes 확인
2. Catch-all 규칙이 여전히 Worker를 가리키는지 확인
3. DNS MX 레코드가 Cloudflare를 가리키는지 확인
4. Worker 자체는 정상인지 `wrangler tail`로 확인

### 6.2 AI 응답 지연/실패

**징후**: 초안 생성 시간 초과, 빈 응답
**조치**:
1. Workers AI Analytics에서 지연 시간 및 오류율 확인
2. Moonshot AI 모델 상태 확인 (Cloudflare 상태 페이지)
3. 임시로 다른 모델로 폴리백 고려 (아키텍처 개선 필요)

### 6.3 Durable Object 데이터 손상

**징후**: 특정 메일박스만 500 오류, 나머지는 정상
**조치**:
1. DO SQLite 파일 직접 접근은 불가능 (Cloudflare 관리)
2. 해당 메일박스의 R2 설정 JSON 백업 확인
3. 복구 불가 시 메일박스 재생성 + 이메일 재동기화

### 6.4 R2 버킷 접근 오류

**징후**: 첨부파일 다운로드 404
**조치**:
1. Dashboard → R2 → `agentic-inbox` 버킷 존재 여부
2. Worker의 `BUCKET` 바인딩 설정 확인
3. 객체 키 패턴 일관성 확인 (`attachments/{emailId}/{attachmentId}/{filename}`)

---

## 7. 연락처 및 에스컬레이션

| 역할 | 담당 | 연락처 | 비고 |
|------|------|--------|------|
| 서비스 오너 | — | — | 기능/정책 결정 |
| 인프라 / Cloudflare | — | — | 엣지 설정, 도메인, 라우팅 |
| AI/ML 엔지니어 | — | — | 프롬프트, Workers AI 튜닝 |
| 보안 | — | — | Access Policy, secrets 관리 |
