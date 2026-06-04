# v1-present Agent Mail — 배포 가이드

> **대상**: 운영 중인 Docker 기반 mail-server + ai-agent 마이크로서비스
> **핵심 목표**: `docker compose up --build` 한 줄로 로컬 전체 기동 → 프로덕션 Kubernetes 전환

---

## 1. 사전 준비

| 항목 | 버전/요건 | 비고 |
|------|-----------|------|
| Docker Engine | 24.x+ | compose v2 지원 |
| Docker Compose | 2.20+ | `docker compose` 명령어 |
| OpenAI API Key | 유효한 키 | `sk-...` 형식. 없으면 AI 초안 기능 비활성화 |
| 도메인 (프로덕션) | bzconnect.co 하위 | TLS 인증서 발급용 |

---

## 2. 로컬 배포

```bash
cd v1-present
cp .env.example .env
# .env 편집: OPENAI_API_KEY, POSTGRES_PASSWORD, LOCAL_SERVICE_TOKEN 등 필수값 입력
docker compose up --build -d
```

### 2.1 구동되는 서비스

| 서비스 | 컨테이너명 | 호스트 포트 | 낮부 포트 | 역할 |
|--------|-----------|-------------|-----------|------|
| PostgreSQL | `v1-present-postgres-1` | 127.0.0.1:5432 | 5432 | 관계형 데이터 저장 |
| Redis | `v1-present-redis-1` | 127.0.0.1:6379 | 6379 | 이벤트 스트림 버스 |
| MinIO | `v1-present-minio-1` | 127.0.0.1:9000/9001 | 9000/9001 | S3 호환 오브젝트 스토리지 |
| Mail Server | `v1-present-mail-server-1` | 127.0.0.1:8080 | 8080 | Express REST API |
| AI Agent | `v1-present-ai-agent-1` | 127.0.0.1:8000 | 8000 | FastAPI AI 서비스 |

### 2.2 초기 데이터베이스 초기화

PostgreSQL 첫 기동 시 `mail-server/migrations/001_initial.sql`이 자동 실행됩니다.
수동 재실행이 필요하면:

```bash
docker compose exec postgres psql -U agentic -d agentic_inbox -f /docker-entrypoint-initdb.d/001_initial.sql
```

### 2.3 더미 데이터 시드

```bash
cd mail-server
pnpm install
node src/seed.js
```

---

## 3. 환경 변수

### 3.1 필수 변수

| 변수 | 예시값 | 설명 |
|------|--------|------|
| `POSTGRES_PASSWORD` | `agentic-local-change-me` | PostgreSQL 슈퍼유저 비밀번호 |
| `OPENAI_API_KEY` | `sk-...` | OpenAI API 키. AI 초안/챗 필수 |
| `LOCAL_SERVICE_TOKEN` | `local-dev-token-change-me` | 서비스 간 인증 Bearer 토큰 |
| `WEBHOOK_SECRET` | `wh-...` | 수신 이메일 웹훅 검증용 |

### 3.2 선택/튜닝 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `AI_MODEL` | `gpt-4o-mini` | AI Agent 사용 모델 |
| `AI_TIMEOUT_SECONDS` | `30` | OpenAI 요청 타임아웃 |
| `AI_RATE_LIMIT_PER_MINUTE` | `20` | 메일박스당 분당 요청 제한 |
| `AI_MAX_RETRIES` | `2` | 실패 시 재시도 횟수 |
| `CORS_ORIGINS` | `http://localhost:5173` | 프론트엔드 개발 서버 주소 |
| `S3_ENDPOINT` | `http://localhost:9000` | MinIO 엔드포인트 |
| `S3_ACCESS_KEY` | `minioadmin` | MinIO 접근 키 |
| `S3_SECRET_KEY` | `minio-local-change-me` | MinIO 비밀 키 |
| `RUN_MIGRATIONS` | `false` | mail-server 기동 시 마이그레이션 실행 여부 |

> **보안 주의**: `.env` 파일은 `chmod 600 .env`로 권한 제한. Git에 커밋 금지.

---

## 4. 프로덕션 배포

### 4.1 아키텍처 전환

```
[Ingress: NGINX Ingress Controller]
         │
    [API Gateway: Kong]
         │
    ┌────┴────┐
 Mail Server  AI Agent
 :8080        :8000
    │            │
[PostgreSQL] [Redis] [AWS S3]
```

### 4.2 프로덕션 변경사항

| 영역 | 로컬 | 프로덕션 권장 |
|------|------|---------------|
| 오케스트레이션 | Docker Compose | Kubernetes (Deployment + Service + HPA) |
| 오브젝트 스토리지 | MinIO | AWS S3 또는 S3-compatible object storage |
| 데이터베이스 | 단일 PostgreSQL 컨테이너 | RDS PostgreSQL 16 (Multi-AZ) |
| 캐시/이벤트 | 단일 Redis 컨테이너 | ElastiCache Redis (Cluster Mode) |
| TLS | 없음 | cert-manager + Let's Encrypt |
| API 게이트웨이 | 없음 | Kong 또는 NGINX Ingress Controller |
| 모니터링 | 없음 | Prometheus + Grafana + Loki |
| 비밀 관리 | `.env` | Kubernetes Secrets + External Secrets Operator |

### 4.3 Kubernetes 배포 개요

```yaml
# mail-server deployment 예시
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mail-server
spec:
  replicas: 3          # 무상태 확장
  selector:
    matchLabels:
      app: mail-server
  template:
    spec:
      containers:
        - name: mail-server
          image: <registry>/mail-server:v1.0.0
          ports:
            - containerPort: 8080
          envFrom:
            - secretRef:
                name: mail-server-secrets
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
```

### 4.4 배포 시퀀스

1. **이미지 빌드 & 푸시**
   ```bash
   docker build -t <registry>/mail-server:v1.0.0 ./mail-server
   docker build -t <registry>/ai-agent:v1.0.0 ./ai-agent
   docker push <registry>/mail-server:v1.0.0
   docker push <registry>/ai-agent:v1.0.0
   ```

2. **데이터베이스 마이그레이션**
   ```bash
   kubectl run migrate --rm -i --image=<registry>/mail-server:v1.0.0 -- node src/migrate.js
   ```

3. **롤링 업데이트**
   ```bash
   kubectl set image deployment/mail-server mail-server=<registry>/mail-server:v1.0.1
   kubectl rollout status deployment/mail-server
   ```

### 4.5 롤백 절차

```bash
# Kubernetes 롤백
kubectl rollout undo deployment/mail-server

# Docker Compose 롤백 (로컬)
docker compose down
git checkout <이전 버전>
docker compose up --build -d
```

---

## 5. 상태 확인 (Health & Readiness)

| 서비스 | Health | Ready | 체크 내용 |
|--------|--------|-------|-----------|
| Mail Server | `GET /health` | `GET /ready` | DB 연결 + 토큰 설정 여부 |
| AI Agent | `GET /health` | `GET /ready` | DB + AI Provider 연결 |
| PostgreSQL | `pg_isready` | — | — |
| Redis | `redis-cli ping` | — | — |

---

## 6. 백업 전략

### 6.1 PostgreSQL

```bash
# 수동 백업
docker compose exec postgres pg_dump -U agentic agentic_inbox > backup_$(date +%Y%m%d).sql

# 프로덕션 (RDS): 자동 스냅샷 + AWS Backup
```

### 6.2 MinIO / S3

```bash
# 로컬 MinIO
mc mirror local/agentic-inbox /backup/s3-$(date +%Y%m%d)

# 프로덕션 S3: Cross-Region Replication + S3 Versioning
```

### 6.3 Redis

Redis는 주로 이벤트 버퍼 역할이므로 영속화는 `appendonly yes`로 충분.
프로덕션에서는 ElastiCache 자동 백업 사용.

---

## 7. 보안 체크리스트

- [ ] `LOCAL_SERVICE_TOKEN`은 32바이트 이상의 무작위 문자열
- [ ] `WEBHOOK_SECRET`은 외부 이메일 서비스와 별도로 관리
- [ ] `OPENAI_API_KEY`는 환경변수 주입, 소스코드 내 하드코딩 금지
- [ ] `.env` 파일은 `chmod 600`
- [ ] PostgreSQL은 `127.0.0.1:5432`에만 바인딩 (로컬)
- [ ] 프로덕션에서는 모든 내부 서비스를 VPC 내부에 배치
- [ ] MinIO 콘솔(9001)은 외부 노출 금지 또는 강력한 비밀번호
