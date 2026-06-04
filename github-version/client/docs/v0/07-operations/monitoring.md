# v0 Operations & Monitoring

## 1. 로깅

### 1.1 Workers 로그

Cloudflare Dashboard → Workers & Pages → agentic-inbox → Logs

주요 로그 패턴:
```
"Auto-draft trigger failed: ..."       # EmailAgent 호출 실패
"Skipping auto-draft due to detected prompt injection: ..."  # 보안 차단
"Deferred email delivery failed: ..."   # 발신 지연 실패
"Pre-read failed, agent will use tools: ..."  # 이메일 사전 읽기 실패
```

### 1.2 로컬 개발 로그

```bash
pnpm run dev  # 터미널에 실시간 로그 출력
```

## 2. 메트릭스

### 2.1 Cloudflare Analytics

Dashboard에서 확인 가능:
- **Requests**: 초당 요청 수, 오류율
- **CPU Time**: DO 실행 시간
- **Subrequests**: 외부 API 호출 수 (AI, R2)

### 2.2 커스텀 메트릭스 (코드 내)

```typescript
// 예시: AI 응답 시간 측정
const start = Date.now();
const result = await generateText({ ... });
console.log(`AI response time: ${Date.now() - start}ms`);
```

## 3. 알림 설정

### 3.1 Workers 오류 알림

Cloudflare Dashboard → Notifications:
- Workers Error Rate > 1%
- Workers CPU Time > 50ms (평균)

### 3.2 사용자 정의 알림 (향후)

```typescript
// 심각한 오류 시 외부 웹훅 호출
if (errorSeverity === "critical") {
  await fetch("https://alerts.slack.com/...", { ... });
}
```

## 4. 백업 및 복구

### 4.1 Durable Object SQLite

- **자동 백업**: Cloudflare가 자동으로 복제 및 백업
- **수동 내보내기**: 현재는 DO SQLite 직접 접근 API가 제한적
- **복구**: DO는 자동 복구되며, 수동 복구는 Cloudflare Support 필요

### 4.2 R2 데이터

```bash
# R2 버킷 동기화 (로컬 백업)
pnpm dlx wrangler r2 object get agentic-inbox/mailboxes/... --local

# 버킷 전체 백업
rclone sync r2:agentic-inbox ./backup/
```

## 5. 장애 대응 Runbook

### 5.1 AI 응답 지연/실패

**증상**: Draft 생성이 느리거나 실패함

**대응**:
1. Cloudflare Status 페이지 확인 (workers.ai 상태)
2. Workers AI 사용량 대시보드 확인 (할당량 초과 여부)
3. 로그에서 `Auto-draft failed` 메시지 확인
4. 임시 해결: `DEFAULT_SYSTEM_PROMPT`를 단순화하여 토큰 사용량 감소

### 5.2 Durable Object 응답 지연

**증상**: 이메일 목록 로딩이 느림

**대응**:
1. 해당 DO의 SQLite 파일 크기 확인 (수 GB 이상이면 성능 저하)
2. 오래된 이메일을 Archive 폼더로 이동하거나 삭제
3. 필요 시 메일박스 분할 (새 메일박스 생성)

### 5.3 Email Routing 실패

**증상**: 이메일이 수신되지 않음

**대응**:
1. Cloudflare Email Routing Dashboard에서 상태 확인
2. DNS MX 레코드 확인 (`bizmatrixx.com` → Cloudflare)
3. Workers 로그에서 `receiveEmail` 호출 여부 확인
4. `EMAIL_ADDRESSES` 설정 확인

### 5.4 프롬프트 인젝션 오탐

**증상**: 정상 이메일이 draft 생성 차단됨

**대응**:
1. 로그에서 차단된 이메일 ID 확인
2. `isPromptInjection` 함수의 임계값 조정 (현재는 문자열 매칭)
3. 차단된 이메일에 대해 수동으로 draft 생성 (UI에서)

## 6. 정기 유지보수

| 작업 | 주기 | 방법 |
|------|------|------|
| 오래된 Trash 삭제 | 월간 | SQL `DELETE FROM emails WHERE folder_id='trash' AND date < DATE('now', '-30 days')` |
| R2 스토리지 정리 | 분기 | 미사용 첨부파일 정리 |
| Wrangler 업데이트 | 분기 | `pnpm install wrangler@latest` |
| 보안 패치 | 수시 | `npm audit fix` |
| AI 모델 버전 검토 | 분기 | Cloudflare Workers AI 신규 모델 확인 |

## 7. 확장 고려사항

현재 v0 아키텍처의 한계를 인지하고 확장 시 다음을 고려:

- DO SQLite의 단일 파일 제한 → v1에서 PostgreSQL 분리 고려
- Workers AI의 할당량 제한 → v1에서 외부 AI API 고려
- Cloudflare 종속성 → v1에서 멀티 클라우드 이식성 고려
