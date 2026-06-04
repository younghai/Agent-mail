# v1 System Architecture

## 1. 전체 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Client Layer                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Browser   │  │ Mobile App  │  │ IMAP Client │  │ External Mail Svcs  │ │
│  │  (React)    │  │  (Future)   │  │  (Read-only)│  │  (SES/SendGrid)     │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────┼────────────────────┼────────────┘
          │                │                │                    │
          └────────────────┴────────────────┘                    │
                           │                                     │
          ┌────────────────▼────────────────┐                    │
          │         API Gateway             │                    │
          │     (Kong / Nginx / Traefik)    │                    │
          │  - Auth (OAuth/JWT)             │                    │
          │  - Rate Limiting                │                    │
          │  - SSL Termination              │                    │
          └────────────────┬────────────────┘                    │
                           │                                     │
    ┌──────────────────────┼──────────────────────┐              │
    │                      │                      │              │
    ▼                      ▼                      ▼              │
┌────────────┐    ┌───────────────┐    ┌────────────────┐       │
│   Mail     │    │    User       │    │    AI Agent    │       │
│  Server    │    │   Service     │    │   Service      │       │
│  (Node.js) │    │   (Node.js)   │    │  (Python/Node) │       │
└─────┬──────┘    └───────┬───────┘    └───────┬────────┘       │
      │                   │                    │                │
      │    ┌──────────────┴────────────────────┘                │
      │    │              Message Queue                          │
      │    │         (Redis Streams / RabbitMQ)                  │
      │    └─────────────────────────────────────┐               │
      │                                          │               │
      ▼                                          ▼               │
┌────────────┐                          ┌──────────────┐        │
│ PostgreSQL │                          │   Redis      │        │
│ (Primary)  │                          │  (Cache/Queue)│       │
└─────┬──────┘                          └──────────────┘        │
      │                                                         │
      ▼                                                         │
┌────────────┐                                                 │
│ PostgreSQL │                                                 │
│ (Replica)  │                                                 │
└────────────┘                                                 │
                                                               │
┌──────────────────────────────────────────────────────────────┼────────────┐
│                         Object Storage                        │            │
│              (AWS S3 / MinIO / GCS)                          │            │
│   - Attachments                                               │            │
│   - Mailbox configs                                           │            │
│   - Email raw dumps                                           │            │
└──────────────────────────────────────────────────────────────┘            │
                                                                            │
┌───────────────────────────────────────────────────────────────────────────┘
│                         SMTP Inbound                                       │
│              (Haraka / Postfix / AWS SES Inbound)                          │
└────────────────────────────────────────────────────────────────────────────┘
```

## 2. 서비스 구성

### 2.1 API Gateway

**기술**: Kong, Nginx, 또는 Traefik
**역할**:
- 모든 외부 트래픽의 단일 진입점
- JWT/OAuth 2.0 인증
- Rate Limiting (Token Bucket)
- SSL/TLS 종료
- 라우팅: `/api/v1/mail/*` → Mail Server, `/api/v1/ai/*` → AI Agent

### 2.2 Mail Server Service

**기술**: Node.js + Express/Fastify
**역할**:
- 이메일 CRUD API
- SMTP 수신 처리
- IMAP 읽기 전용 서비스
- 첨부파일 업로드/다운로드 (S3 presigned URL)
- 스레드 관리
- 폼더 관리

**데이터베이스**: PostgreSQL (primary + replica)

### 2.3 User Service

**기술**: Node.js + Express
**역할**:
- 사용자 인증 (OAuth 2.0 / OIDC)
- 메일박스 관리
- RBAC (역할 기반 접근 제어)
- 설정 저장 (PostgreSQL)

### 2.4 AI Agent Service

**기술**: Python (FastAPI) 또는 Node.js (NestJS)
**역할**:
- 이메일 분석 및 답변 초안 생성
- 채팅 스트리밍 API (SSE)
- 프롬프트 인젝션 검사
- Draft 검증
- 다중 AI Provider 관리

**AI Provider 지원**:
- OpenAI (GPT-4, GPT-4o)
- Anthropic (Claude 3.5 Sonnet, Claude 3 Opus)
- Ollama (자체 호스팅: Llama, Mistral 등)
- vLLM (고성능 자체 호스팅)

### 2.5 Message Queue

**기술**: Redis Streams 또는 RabbitMQ
**용도**:
- `new_email` 이벤트: Mail Server → AI Agent
- `draft_created` 이벤트: AI Agent → Mail Server
- `email_sent` 이벤트: Mail Server → Analytics
- 비동기 이메일 발신

### 2.6 Cache

**기술**: Redis
**용도**:
- 이메일 목록 캐싱 (TTL: 5분)
- 세션 저장 (OAuth token)
- Rate Limiting 카운터
- AI 응답 캐싱 (동일 요청)

### 2.7 Object Storage

**기술**: AWS S3 또는 MinIO
**용도**:
- 첨부파일 저장
- 메일박스 설정 JSON
- 이메일 원본 보관 (선택)

### 2.8 SMTP Inbound

**기술**: Haraka (Node.js 기반) 또는 Postfix
**용도**:
- 외부로부터 이메일 수신
- 수신 후 Mail Server API로 전달 (Webhook 또는 Queue)

## 3. 데이터 흐름

### 3.1 이메일 수신 → AI Draft 생성

```
[External Sender]
      │
      ▼ SMTP
[Haraka SMTP Server]
      │
      ▼ HTTP/Queue
[Mail Server]
      │
      ├──► PostgreSQL (INBOX 저장)
      │
      └──► Message Queue ("new_email" event)
                │
                ▼
        [AI Agent Service]
                │
                ├──► PostgreSQL (thread context 로드)
                ├──► AI API (OpenAI/Claude/Ollama)
                └──► PostgreSQL (DRAFT 저장 via Mail Server API)
```

### 3.2 사용자 채팅 → AI 응답

```
[User Browser]
      │
      ▼ SSE/WebSocket
[API Gateway]
      │
      ▼
[AI Agent Service]
      │
      ├──► PostgreSQL (email lookup)
      ├──► Redis (cache)
      ├──► AI API (streaming)
      └──► PostgreSQL (draft save)
      │
      └──► Streaming response to browser
```

## 4. 네트워크 아키텍처

```
┌─────────────────────────────────────────┐
│              Ingress Controller          │
│         (TLS 1.3, WAF rules)             │
└─────────────────┬───────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
┌────────┐  ┌──────────┐  ┌──────────┐
│ Public │  │ Internal │  │ Database │
│  Net   │  │   Net    │  │   Net    │
└───┬────┘  └────┬─────┘  └────┬─────┘
    │            │             │
    ▼            ▼             ▼
 Frontend    Services     PostgreSQL
 (React)     (K8s Pods)   Redis
             (No public IP)  S3/MinIO
```

## 5. 보안 아키텍처

```
┌────────────────────────────────────────────┐
│  WAF (SQL Injection, XSS, DDoS 방어)       │
└────────────────────────────────────────────┘
                  │
┌─────────────────▼──────────────────────────┐
│  OAuth 2.0 / OIDC (Keycloak/Auth0)         │
│  - JWT 발급 및 검증                         │
│  - RBAC (Admin, User, Viewer)               │
└────────────────────────────────────────────┘
                  │
┌─────────────────▼──────────────────────────┐
│  mTLS (서비스 간 통신)                      │
│  - Mail Server ↔ AI Agent                   │
│  - AI Agent ↔ AI Provider API               │
└────────────────────────────────────────────┘
                  │
┌─────────────────▼──────────────────────────┐
│  데이터 암호화                               │
│  - PostgreSQL: 저장 시 AES-256               │
│  - S3: 서버측 암호화 (SSE-S3)                │
│  - Redis: TLS                               │
└────────────────────────────────────────────┘
```
