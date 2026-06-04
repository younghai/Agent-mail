# 01-Requirements — Agent Mail (v1-present)

## 기능 요구사항 (FR)

### FR-1 메일 관리
- FR-1.1: 메일박스 생성/조회/수정/삭제
- FR-1.2: 이메일 목록 조회 (폴리별, 스레드별, 페이지네이션)
- FR-1.3: 이메일 발송 (to, cc, bcc, 첨부파일)
- FR-1.4: 이메일 이동 (폴리 간)
- FR-1.5: 스레드 조회 및 읽음 처리
- FR-1.6: 전문 검색 (`tsvector` 기반)

### FR-2 AI 기능
- FR-2.1: 수신 이메일 자동 초안 생성 (OpenAI)
- FR-2.2: 스레드 컨텍스트 기반 SSE 챗
- FR-2.3: 프롬프트 인젝션 탐지 및 차단
- FR-2.4: 메일박스별 AI 모델/프롬프트 설정

### FR-3 관리자 CRM
- FR-3.1: 고객(클리이언트) CRUD
- FR-3.2: 작업(Task) CRUD 및 상태 추적
- FR-3.3: 이메일 → 작업 변환
- FR-3.4: AI 사용량 추적 및 리포트

### FR-4 인프라
- FR-4.1: 수신 이메일 웹훅 처리
- FR-4.2: 첨부파일 MinIO 업로드/다운로드 (presigned URL)
- FR-4.3: Redis Stream 기반 이벤트 버스

## 비기능 요구사항 (NFR)

| ID | 항목 | 요건 |
|----|------|------|
| NFR-1 | 성능 | API 응답 P95 < 500ms, AI 초안 P95 < 10s |
| NFR-2 | 가용성 | 월간 가동률 99.5% |
| NFR-3 | 보안 | Bearer Token 인증, SQL Injection 방지, 프롬프트 인젝션 방지 |
| NFR-4 | 확장성 | 메일박스 100개, 월 10,000건 처리 가능 |
| NFR-5 | 감사 | 모든 데이터 변경에 audit_log 기록 |

## 유스케이스

### UC-01 수신 이메일 자동 처리
1. 외부 메일 서비스가 웹훅 호출 (`POST /webhooks/email`)
2. Mail Server가 이메일 저장 및 Redis Stream에 이벤트 발행
3. AI Agent가 소비하여 OpenAI로 초안 생성
4. 초안을 `emails` 테이블에 `is_draft=true`로 저장
5. (향후) 운영자가 콘솔에서 검토 및 승인

### UC-02 운영자 AI 챗
1. 운영자가 스레드를 선택
2. `POST /ai/chat`에 `"이 스레드를 요약해줘"` 전송
3. AI Agent가 스레드 컨텍스트 로드 → OpenAI SSE 스트리밍 응답
4. 대화 기록 `ai_conversations` 테이블에 저장
