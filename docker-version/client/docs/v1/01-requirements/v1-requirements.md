# v1 Requirements

## 1. 기능 요구사항 (Functional)

### FR-01 메일 서버 (Mail Server Service)

- **FR-01.1**: SMTP 프로토콜로 이메일 수신 (Port 25/587)
- **FR-01.2**: 수신된 이메일을 PostgreSQL에 저장
- **FR-01.3**: 첨부파일을 S3/MinIO에 업로드
- **FR-01.4**: 스레드 자동 그룹핑 (In-Reply-To, References, Subject)
- **FR-01.5**: Webhook 수신 지원 (외부 메일 서비스 연동)
- **FR-01.6**: IMAP 프로토콜 지원 (읽기 전용, 외부 클라이언트 연동)

### FR-02 AI Agent 서비스 (AI Agent Service)

- **FR-02.1**: 독립적인 AI 서비스로 운영 (REST/gRPC API)
- **FR-02.2**: 다중 AI Provider 지원 (OpenAI, Anthropic, Ollama, vLLM)
- **FR-02.3**: 메일 서버로부터 `/onNewEmail` 이벤트 수신 (Queue 기반)
- **FR-02.4**: 스레드 컨텍스트 로드 후 답변 초안 생성
- **FR-02.5**: 생성된 초안을 메일 서버 API로 전달 (DRAFT 저장)
- **FR-02.6**: 프롬프트 인젝션 감지 및 차단
- **FR-02.7**: 시스템 프롬프트 핫 리로드 (설정 변경 시 재배포 불필요)
- **FR-02.8**: AI 응답 스트리밍 지원 (SSE/WebSocket)

### FR-03 사용자 서비스 (User Service)

- **FR-03.1**: 메일박스 CRUD
- **FR-03.2**: 사용자 계정 관리 (OAuth 2.0 / OIDC)
- **FR-03.3**: 역할 기반 접근 제어 (RBAC)
- **FR-03.4**: 메일박스별 AI 설정 관리 (프롬프트, 모델 선택)

### FR-04 API Gateway

- **FR-04.1**: 모든 서비스의 단일 진입점
- **FR-04.2**: JWT/OAuth 인증 및 인가
- **FR-04.3**: Rate Limiting (IP/사용자별)
- **FR-04.4**: 요청/응답 로깅
- **FR-04.5**: API 버저닝 (`/api/v1`, `/api/v2`)

### FR-05 프론트엔드

- **FR-05.1**: v0 UI와 동일한 기능 유지
- **FR-05.2**: AI 채팅 스트리밍 지원
- **FR-05.3**: 다크 모드 지원
- **FR-05.4**: 모바일 반응형 UI

### FR-06 이메일 발신

- **FR-06.1**: 외부 SMTP (AWS SES, SendGrid) 연동
- **FR-06.2**: 발신 이력 및 상태 추적 (bounced, delivered)
- **FR-06.3**: 발신 Rate Limiting

## 2. 비기능 요구사항 (Non-Functional)

### NFR-01 성능

- **NFR-01.1**: 이메일 목록 조회: 1000건 기준 < 200ms (p95)
- **NFR-01.2**: AI 답변 생성: < 15s (p95)
- **NFR-01.3**: API 응답: < 100ms (p95, 캐시 히트 시)
- **NFR-01.4**: 동시 접속: 1000명 이상 지원

### NFR-02 가용성

- **NFR-02.1**: SLA 99.9% (월간 다운타임 < 43분)
- **NFR-02.2**: 무중단 배포 (Rolling Update / Blue-Green)
- **NFR-02.3**: 장애 시 자동 복구 (Kubernetes Self-healing)

### NFR-03 보안

- **NFR-03.1**: 모든 통신 TLS 1.3
- **NFR-03.2**: 데이터베이스 암호화 (AES-256, 저장 시)
- **NFR-03.3**: AI 프롬프트 인젝션 방지
- **NFR-03.4**: OWASP Top 10 대응
- **NFR-03.5**: 감사 로그 (Audit Log) 저장

### NFR-04 확장성

- **NFR-04.1**: 수평 확장 (Horizontal Pod Autoscaling)
- **NFR-04.2**: 데이터베이스 샤딩/리플리카 지원
- **NFR-04.3**: 메시지 큐 기반 비동기 처리

### NFR-05 관측 가능성

- **NFR-05.1**: 메트릭스 수집 (Prometheus)
- **NFR-05.2**: 분산 추적 (OpenTelemetry / Jaeger)
- **NFR-05.3**: 중앙 집중 로깅 (ELK / Loki)
- **NFR-05.4**: 알림 (PagerDuty / Slack)

### NFR-06 데이터 이관

- **NFR-06.1**: v0 SQLite → v1 PostgreSQL 데이터 마이그레이션
- **NFR-06.2**: v0 R2 → v1 S3/MinIO 객체 마이그레이션
- **NFR-06.3**: Zero-downtime migration 지원
