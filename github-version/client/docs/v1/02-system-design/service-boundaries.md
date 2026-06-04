# v1 Service Boundaries

## 1. 서비스 분리 원칙

v1은 **도메인 중심 마이크로서비스**로 분리합니다. 각 서비스는 독립적으로 배포/확장 가능하며, 명확한 API 계약으로 통신합니다.

## 2. 서비스 경계 정의

### 2.1 Mail Server Service

**소유 데이터**: 이메일, 첨부파일 메타데이터, 폼더, 스레드
**API 노출**: RESTful HTTP
**이벤트 발행**: `new_email`, `email_moved`, `email_deleted`
**이벤트 구독**: `draft_created`

**책임**:
- 이메일 CRUD
- 폼더 관리
- 스레드 그룹핑
- 첨부파일 메타데이터 관리 (실제 바이너리는 S3)
- SMTP 수신 처리
- IMAP 읽기 서비스
- 발신 이메일 전달 (SMTP relay)

**비책임** (다른 서비스로 위임):
- AI 처리 → AI Agent Service
- 사용자 인증 → User Service
- 첨부파일 저장 → Object Storage (S3)

### 2.2 AI Agent Service

**소유 데이터**: AI 대화 히스토리, 프롬프트 템플릿
**API 노출**: RESTful HTTP + SSE (Streaming)
**이벤트 발행**: `draft_created`
**이벤트 구독**: `new_email`

**책임**:
- 이메일 자동 답변 초안 생성
- 사용자 채팅 응답 (스트리밍)
- 프롬프트 인젝션 검사
- Draft 검증
- AI Provider 관리 및 라우팅

**비책임**:
- 이메일 저장 → Mail Server Service
- 사용자 인증 → User Service / API Gateway

### 2.3 User Service

**소유 데이터**: 사용자 계정, 역할, 권한, 메일박스 설정
**API 노출**: RESTful HTTP
**이벤트 발행**: `user_created`, `mailbox_created`
**이벤트 구독**: 없음

**책임**:
- 사용자 등록/인증/인가
- OAuth 2.0 / OIDC 연동
- 메일박스 설정 관리
- RBAC (역할: superadmin, admin, user, viewer)

**비책임**:
- 이메일 처리 → Mail Server Service
- AI 처리 → AI Agent Service

### 2.4 API Gateway

**소유 데이터**: 없음 (stateless)
**API 노출**: 모든 외부 트래픽

**책임**:
- 라우팅
- 인증 (JWT 검증)
- Rate Limiting
- SSL 종료
- 요청/응답 로깅

## 3. 서비스 간 통신

### 3.1 동기 통신 (HTTP/gRPC)

| 호출자 | 피호출자 | 용도 | 프로토콜 |
|--------|----------|------|----------|
| API Gateway | Mail Server | 이메일 API 프록시 | HTTP |
| API Gateway | User Service | 인증/사용자 API 프록시 | HTTP |
| API Gateway | AI Agent | 채팅/AI API 프록시 | HTTP/SSE |
| AI Agent | Mail Server | thread context 조회 | HTTP/gRPC |
| AI Agent | Mail Server | draft 저장 | HTTP |
| Mail Server | User Service | 메일박스 권한 확인 | HTTP |

### 3.2 비동기 통신 (Message Queue)

| 발행자 | 이벤트 | 구독자 | 용도 |
|--------|--------|--------|------|
| Mail Server | `new_email` | AI Agent | 새 메일 도착 알림 |
| AI Agent | `draft_created` | Mail Server | 초안 저장 요청 |
| Mail Server | `email_sent` | Analytics | 발신 이력 집계 |
| User Service | `user_created` | Mail Server | 기본 메일박스 설정 초기화 |

## 4. 데이터 소유권

```
┌─────────────────────────────────────────────────────────────┐
│  Mail Server Service                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  emails, folders, attachments (metadata), threads   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ reads/writes
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PostgreSQL (Shared DB 또는 Per-Service DB)                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  AI Agent Service                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  chat_history, prompt_templates, provider_configs   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ reads/writes
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PostgreSQL / Redis                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  User Service                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  users, roles, permissions, mailbox_settings        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ reads/writes
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PostgreSQL                                                │
└─────────────────────────────────────────────────────────────┘
```

## 5. 공유 라이브러리 (Shared Libraries)

모든 서비스가 공유하는 코드는 별도 npm/Python 패키지로 관리합니다:

```
packages/
├── shared-types/          # TypeScript 인터페이스 (Email, Attachment, etc.)
├── shared-schemas/        # Zod 검증 스키마
├── shared-queue/          # Message Queue 클라이언트
├── shared-storage/        # S3/MinIO 클라이언트
└── shared-auth/           # JWT 검증 유틸리티
```

## 6. 장애 격리

| 장애 시나리오 | 영향 범위 | 완화책 |
|--------------|-----------|--------|
| AI Agent 다운 | 자동 draft 생성 불가, 채팅 불가 | 메일 수신/발신은 정상 동작. AI 복구 후 백로그 처리 |
| Mail Server 다운 | 이메일 CRUD 불가 | SMTP 수신 큐에 적재. 서버 복구 후 재처리 |
| User Service 다운 | 신규 로그인 불가 | 기존 JWT는 Gateway에서 검증되므로 기존 세션 유지 |
| PostgreSQL 다운 | 전체 서비스 장애 | Replica로 failover. RPO < 1분 |
| Redis 다운 | 캐시/큐 불가 | PostgreSQL advisory lock으로 큐 대체. 캐시는 DB 직접 조회 |
| S3/MinIO 다운 | 첨부파일 불가 | 메일 텍스트는 정상. 첨부파일 업로드는 큐에 보류 |
