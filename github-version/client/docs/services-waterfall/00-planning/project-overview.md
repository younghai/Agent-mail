# 0. 프로젝트 계획 (Project Planning)

> 워터폴 0단계 — 프로젝트의 존재 이유, 범위, 제약조건, 이해관계자를 정의한다. 본 문서는 `agentic-inbox/services/`에 구현된 v1 독립 서비스 아키텍처를 대상으로 한다.

---

## 0.1 프로젝트 개요

### 명칭

Agentic Inbox v1 — Independent Service Architecture

### 한 줄 정의

Cloudflare Workers 종속성에서 벗어나, Docker 기반 독립 마이크로서비스로 운영되는 AI 이메일 에이전트 시스템.

### 배경

v0(Cloudflare Workers 기반)은 다음과 같은 한계를 가지고 있었다:

1. **플랫폼 종속성**: Cloudflare Workers, Durable Objects, R2, Workers AI에 전적으로 의존
2. **AI 모델 제한**: Cloudflare가 제공하는 모델(`@cf/moonshotai/kimi-k2.5`)만 사용 가능
3. **데이터 이식성**: Durable Object SQLite는 Cloudflare 외부로 납품/백업이 복잡
4. **확장성**: Workers AI의 일일 할당량 제한, DO의 단일 파일 제한

이를 해결하기 위해 v1에서는 다음을 목표로 한다:

- **멀티 클라우드 이식성**: AWS, GCP, 온프레미스 등 어디서든 Docker로 배포 가능
- **AI 모델 자율성**: OpenAI, Anthropic, 자체 호스팅(Ollama) 등 자유로운 선택
- **표준 데이터베이스**: PostgreSQL로 마이그레이션하여 기존 DBA/백업 도구 활용
- **마이크로서비스 분리**: Mail Server / AI Agent / User Service를 독립적으로 확장

---

## 0.2 프로젝트 범위

### In Scope

| 영역 | 설명 |
| --- | --- |
| **Mail Server** | 이메일 CRUD, 폼더 관리, 스레드 추적, 첨부파일 메타데이터, 검색 |
| **AI Agent** | 자동 답변 초안 생성(draft), 실시간 채팅 스트리밍(SSE), 다중 AI Provider |
| **Database** | PostgreSQL 16, Full-Text Search(tsvector), 파티셔닝 기반 설계 |
| **배포** | Docker Compose 기반 로컬/스테이징, Kubernetes 기반 프로덕션 |
| **Frontend** | v0 React 코드 재사용 (API Gateway 프록시만 변경) |

### Out of Scope (v1)

| 영역 | 설명 | 비고 |
| --- | --- | --- |
| **실제 SMTP 수신 서버** | Haraka/Postfix 구현 | v1.1에서 추가 예정 |
| **User Service (OAuth/RBAC)** | Keycloak 연동 | v1.1에서 추가 예정 |
| **캘린더 연동** | Google/Outlook Calendar | 미정 |
| **모바일 네이티브 앱** | iOS/Android | 미정 |

---

## 0.3 이해관계자

| 역할 | 설명 | 관심사 |
| --- | --- | --- |
| **운영자** | 메일박스 설정, AI 프롬프트 튜닝, draft 검토/발송 | UI 반응성, AI 응답 품질 |
| **개발팀** | v1 아키텍처 구축 및 유지보수 | 코드 품질, 배포 자동화 |
| **인프라팀** | PostgreSQL, Redis, K8s 운영 | 가용성, 모니터링, 백업 |
| **보안팀** | 데이터 유출 방지, 프롬프트 인젝션 차단 | 감사 로그, 접근 제어 |

---

## 0.4 제약조건

| 제약 | 내용 | 완화책 |
| --- | --- | --- |
| **AI API 비용** | OpenAI/Anthropic 사용료 | Ollama 자체 호스팅 옵션 제공 |
| **PostgreSQL 용량** | 대용량 이메일/첨부파일 | 월간 파티셔닝, S3 오프로드 |
| **네트워크 지연** | AI Provider API 호출 지연 | 비동기 큐, fallback provider |
| **인력** | 1인 개발 | MVP 범위 축소, 자동화 강조 |

---

## 0.5 참고 문서

| 문서 | 위치 | 설명 |
| --- | --- | --- |
| v0 아키텍처 문서 | `docs/v0/` | Cloudflare Workers 기반 원본 설계 |
| v1 설계 문서 | `docs/v1/` | 독립 서비스 설계 (이론) |
| 본 문서 | `docs/services-waterfall/` | 실제 구현체 기반 문서 |
