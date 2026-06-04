# Agentic Inbox 로컬 실행 가이드 (macOS/Linux)

> `cloudflare/agentic-inbox` 저장소를 클론한 뒤 localhost에서 개발 서버를 실행하는 방법

---

## ✅ 사전 준비사항

| 항목 | 버전/요건 | 확인 명령 |
| --- | --- | --- |
| **Node.js** | 20.x 이상 권장 | `node --version` |
| **pnpm** | 10.x 이상 권장 | `pnpm --version` |
| **Cloudflare 계정** | 필수 (묶가) | [dash.cloudflare.com](https://dash.cloudflare.com) |
| **Wrangler CLI 로그인** | 필수 | `pnpm dlx wrangler login` |

---

## 1. 저장소 클론 & 의존성 설치

이미 클론되어 있다면 **2번 단계**로 걸러뛰세요.

```bash
git clone https://github.com/cloudflare/agentic-inbox.git
cd agentic-inbox
pnpm install
```

> ⚠️ 설치 시 `npm warn` 및 취약점(vulnerabilities) 메시지가 나올 수 있습니다. 이는 로컬 실행을 막지 않습니다.

---

## 2. Wrangler 로그인 (필수)

`@cloudflare/vite-plugin`이 Workers runtime(AI, R2, Durable Objects)과 통신하려면 Cloudflare 계정 인증이 필요합니다.

```bash
pnpm dlx wrangler login
```

- 브라우저가 열리면 Cloudflare 계정으로 로그인하고 승인합니다.
- 성공하면 터미널에 `Successfully logged in.` 메시지가 표시됩니다.

> **로그인하지 않으면?**\
> `Failed to start the remote proxy session... You must be logged in to use wrangler dev in remote mode.` 오류가 발생합니다.

---

## 3. R2 버킷 생성 (필수)

`wrangler.jsonc`에 정의된 `agentic-inbox` 버킷을 생성해야 첨부파일 저장 기능이 동작합니다.

```bash
pnpm dlx wrangler r2 bucket create agentic-inbox
```

> 이미 생성된 버킷이 있다면 스킵. 버킷 이름은 `wrangler.jsonc`의 `r2_buckets[0].bucket_name`과 일치해야 합니다.

---

## 4. 환경변수/설정 파일 준비

### 4.1 `.dev.vars` 생성 (로컬 개발용)

```bash
cp .dev.vars.example .dev.vars
```

로컬 개발 시에는 **Cloudflare Access 인증이 자동으로 스킵**됩니다 (`workers/app.ts`의 `import.meta.env.DEV` 분기).\
따라서 `.dev.vars`의 값을 채울 필요는 없습니다. 빈 값 또는 예시 그대로 두면 됩니다.

### 4.2 `wrangler.jsonc` 도메인 수정 (선택)

```json
"vars": {
  "DOMAINS": "example.com",
  "EMAIL_ADDRESSES": []
}
```

- 로컬 개발에서는 **반드시 수정할 필요는 없습니다**.
- 실제 이메일 송수신 테스트를 하려면 본인이 소유한 도메인으로 변경해야 합니다.

---

## 5. 개발 서버 실행

```bash
npm run dev
```

정상 실행 시 터미널 출력 예시:

```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
  ➜  press h + enter to show help
```

브라우저에서 `http://localhost:5173` 로 접속합니다.

### 5.1 첫 화면 사용 흐름

1. 브라우저에서 `http://localhost:5173` 접속
2. **"Create mailbox"** 버튼 클릭
3. 원하는 메일 주소 입력 (예: `hello@example.com`)\
   ⚠️ 실제 도메인이 아니라면 이메일 송수신은 불가. UI 기능만 확인 가능.
4. 메일박스 생성 후 Inbox, Compose, Agent 패널 등 탐색

---

## 6. 로컬 개발 시 바인딩 동작 방식

| 바인딩 | 로컬 동작 | 비고 |
| --- | --- | --- |
| **Durable Objects** | 로컬 SQLite 파일로 에뮬레이트 | `~/.wrangler/state/v3/` 아래에 저장 |
| **R2** | 실제 `agentic-inbox` 버킷에 접근 (preview) | 첨부파일 업로드/다운로드 가능 |
| **Workers AI** | 실제 Cloudflare AI API 호출 | AI 크레딧 소모됨 |
| **send_email** | 로컬에서 제한적 동작 | 실제 발송은 Email Service 설정 후 가능 |
| **Cloudflare Access** | 자동 스킵 | `.env.DEV === true` 일 때 JWT 검증 생략 |

---

## 7. 주요 명령어 정리

| 명령어 | 설명 |
| --- | --- |
| `pnpm run dev` | 개발 서버 시작 (Vite + Wrangler 통합) |
| `pnpm run build` | 프로덕션 빌드 |
| `pnpm run preview` | 빌드 결과 로컬 미리보기 |
| `pnpm run deploy` | Cloudflare Workers에 배포 |
| `pnpm run cf-typegen` | Wrangler 바인딩 TypeScript 타입 생성 |

---

## 8. 트러블슈팅

### 8.1 `You must be logged in to use wrangler dev in remote mode`

```bash
pnpm dlx wrangler login
```

### 8.2 `R2 bucket not found`

```bash
pnpm dlx wrangler r2 bucket create agentic-inbox
```

### 8.3 `AI binding error` / Workers AI 호출 실패

- Cloudflare 대시보드에서 **Workers AI**가 활성화되어 있는지 확인
- 묶가 플랜도 일일 quota가 있음 ([가격 정책](https://developers.cloudflare.com/workers-ai/pricing/))

### 8.4 포트 충돌

```bash
# 5173 포트가 이미 사용 중이면
pnpm run dev -- --port 3000
```

### 8.5 로컬 상태 초기화 (Durable Objects 데이터 삭제)

```bash
rm -rf ~/.wrangler/state/v3/
```

---

## 9. 실제 이메일 송수신을 테스트하려면?

로컬 개발 서버만으로는 **Cloudflare Email Routing**을 통한 실제 수신이 불가능합니다. 다음 단계가 추가로 필요합니다:

1. 본인 소유 도메인을 Cloudflare에 등록
2. Email Routing 활성화 + catch-all 규칙 생성 (Worker 전달)
3. Email Service 활성화 (`send_email` binding)
4. `wrangler.jsonc`의 `DOMAINS`를 실제 도메인으로 수정
5. `pnpm run deploy`로 배포

> 자세한 내용은 원본 README의 [How to setup](https://github.com/cloudflare/agentic-inbox#how-to-setup) 참고

---

> **마지막 업데이트:** 2026-05-01
