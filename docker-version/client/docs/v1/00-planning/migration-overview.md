# v1 Migration Overview

## 1. 마이그레이션 목표

Agentic Inbox를 **Cloudflare Workers 종속성으로부터 완전히 분리**하여 독립적인 서비스로 운영할 수 있도록 재설계합니다. 이는 다음과 같은 비즈니스/기술적 요구를 충족합니다:

- **멀티 클라우드 이식성**: AWS, GCP, 온프레미스 등 어디서든 배포 가능
- **AI 모델 자율성**: OpenAI, Anthropic, 자체 호스팅 LLM 등 자유로운 모델 선택
- **데이터 주권**: 고객 데이터를 자사 인프라에서 완전히 통제
- **확장성**: Kubernetes 기반 오토스케일링
- **엔터프라이즈 통합**: 기존 SSO, LDAP, SIEM 시스템과의 연동

## 2. v0 → v1 주요 변경사항

| 영역 | v0 (Cloudflare) | v1 (Independent) |
| --- | --- | --- |
| **Runtime** | Cloudflare Workers (V8 Isolate) | Node.js / Docker / Kubernetes |
| **Database** | Durable Object SQLite (per mailbox) | PostgreSQL (shared/cluster) |
| **Storage** | Cloudflare R2 | AWS S3 / MinIO / GCS |
| **AI** | Workers AI (`@cf/moonshotai/kimi-k2.5`) | OpenAI / Claude / Ollama 등 |
| **Email Inbound** | Cloudflare Email Routing | Haraka SMTP / AWS SES / Webhook |
| **Email Outbound** | Workers Email Send binding | AWS SES / SendGrid / SMTP |
| **Auth** | Cloudflare Access JWT | OAuth 2.0 / OIDC / Keycloak |
| **Cache** | 없음 | Redis |
| **Queue** | 없음 (동기 처리) | Redis Streams / RabbitMQ |
| **Frontend** | React Router SPA | React Router SPA (유지) |

## 3. 마이그레이션 전략

### 3.1 단계적 전환 (Strangler Fig)

```
Phase 1: AI Agent 서비스 분리
  - EmailAgent를 별도 컨테이너로 추출
  - 메일 서버와 AI 서비스 간 gRPC/HTTP 통신

Phase 2: 데이터베이스 이관
  - SQLite → PostgreSQL 마이그레이션
  - R2 → S3 마이그레이션

Phase 3: 메일 서버 독립
  - SMTP 수신 서버 구축
  - Cloudflare Email Routing 점진적 이관

Phase 4: 인프라 전환
  - Kubernetes 배포
  - CI/CD 파이프라인 구축

Phase 5: Cloudflare 완전 분리
  - Workers 코드 제거
  - DNS 전환
```

### 3.2 리스크 및 완화책

| 리스크 | 영향 | 완화책 |
| --- | --- | --- |
| 데이터 이관 실패 | 높음 | 단계적 이관 + 듀얼 라이트 기간 유지 |
| AI 모델 성능 저하 | 중간 | A/B 테스트로 v0/v1 모델 응답 품질 비교 |
| 이메일 수신 누락 | 높음 | Cloudflare Routing + 자체 SMTP 병행 운영 |
| 운영 복잡도 증가 | 중간 | Terraform IaC, 모니터링, Runbook 강화 |

## 4. 예상 일정

| 단계 | 기간 | 산출물 |
| --- | --- | --- |
| 설계 및 POC | 4주 | v1 아키텍처 문서, AI 서비스 프로토타입 |
| 데이터 이관 | 2주 | 마이그레이션 스크립트, 데이터 검증 |
| 서비스 구현 | 6주 | 모든 마이크로서비스 구현 |
| 통합 테스트 | 3주 | E2E 테스트, 부하 테스트 |
| 스테이징 검증 | 2주 | 운영팀 교육, Runbook 작성 |
| 프로덕션 전환 | 2주 | 블루/그린 배포, 모니터링 |

**총 예상 기간: 19주 (약 5개월)**

## 5. 비용 비교 (월간 예상)

| 항목 | v0 (Cloudflare) | v1 (AWS/GCP 자체 운영) |
| --- | --- | --- |
| 컴퓨팅 | $50\~100 | $200\~500 (EKS/GKE) |
| 데이터베이스 | $0 (DO SQLite) | $100\~300 (RDS/Cloud SQL) |
| 스토리지 | $10 | $20\~50 |
| AI API | $0 (Workers AI 물결) | $300\~1,000 (OpenAI/Claude 사용량 기반) |
| 이메일 발신 | $0 | $50\~100 (SES/SendGrid) |
| **합계** | **$60\~110** | **$670\~1,950** |

> 참고: v1은 초기 비용이 높지만, 대규모 트래픽 시 유닛 경제가 유리해질 수 있음