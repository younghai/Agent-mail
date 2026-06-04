# 07-Maintenance — Agentic Inbox (v0)

## 모니터링

### Wrangler 로그

```bash
pnpm dlx wrangler tail
# 실시간 로그 스트리밍
```

### Cloudflare Analytics

- Dashboard → Workers → `agentic-inbox` → Analytics
- 확인 지표:
  - 요청 수/분, 오류율 (4xx, 5xx)
  - CPU 시간 (ms)
  - Subrequests (DO, R2, AI 호출)

### Workers AI 사용량

- Dashboard → AI → Workers AI
- 토큰 수 (입력/출력), 모델별 호출, 지연 시간

## 비용 관리

| 항목 | 절감 전략 |
|------|-----------|
| Workers AI | Triage Router로 불필요한 AI 호출 스킵 |
| R2 저장 | 오래된 첨부파일 정책 수립 |
| DO 요청 | 배치 처리로 호출 빈도 감소 |

**월간 예상**: 1,000메일/월, AI 초안 500건 기준 약 $10~30

## 알려진 이슈

| 이슈 | 영향 | 완화책 |
|------|------|--------|
| 메일박스 삭제 시 고아 데이터 | 디스크 공간 낭비 | 주기적 정비 스크립트 필요 |
| 로컬에서 이메일 수신 불가 | 수신 테스트 불가 | 배포 후 Email Routing으로 테스트 |
| Workers AI 과금 | 개발 비용 | 짧은 프롬프트 사용 |

## 장애 대응

### 이메일 라우팅 중단
1. Dashboard → Email → Routes 확인
2. Catch-all 규칙이 Worker를 가리키는지 확인
3. DNS MX 레코드가 Cloudflare를 가리키는지 확인

### AI 응답 지연/실패
1. Workers AI Analytics 확인
2. Moonshot AI 모델 상태 확인
3. 임시로 다른 모델 폴리백 고려

### Durable Object 데이터 손상
- DO SQLite 직접 접근 불가 (Cloudflare 관리)
- R2 설정 JSON 백업 확인
- 복구 불가 시 메일박스 재생성 + 재동기화

### R2 버킷 접근 오류
1. Dashboard → R2 → 버킷 존재 여부
2. Worker `BUCKET` 바인딩 확인
3. 객체 키 패턴 확인

## 업데이트 절차

```bash
# 1. 로컬 테스트
pnpm run dev
pnpm test

# 2. 스테이징 배포
pnpm run deploy
# 스테이징 도메인에서 수신/발송 테스트

# 3. 프로덕션 배포
wrangler deploy --env production

# 4. 롤백 준비
wrangler rollback
```
