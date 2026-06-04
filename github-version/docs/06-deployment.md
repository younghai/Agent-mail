# 06-Deployment — Agent Mail (v1-present)

## 배포 토폴로지

```
[Client]
   │
[Nginx Ingress Controller]
   │
[API Gateway: Kong]
   │
┌──┴───┐
│Mail  │────▶ [AI Agent]
│Server│        :8000
│:8080 │
└──┬───┘
   │
┌──┴──────────┐
│PostgreSQL   │
│Redis        │
│MinIO / S3   │
└─────────────┘
```

## 로컬 배포

```bash
cd v1-present
cp .env.example .env
# .env 편집: OPENAI_API_KEY, POSTGRES_PASSWORD, LOCAL_SERVICE_TOKEN
docker compose up --build -d
```

### 서비스 포트

| 서비스 | 포트 | 접속 |
|--------|------|------|
| PostgreSQL | 127.0.0.1:5432 | psql |
| Redis | 127.0.0.1:6379 | redis-cli |
| MinIO API | 127.0.0.1:9000 | SDK |
| MinIO Console | 127.0.0.1:9001 | 웹 UI |
| Mail Server | 127.0.0.1:8080 | HTTP API |
| AI Agent | 127.0.0.1:8000 | HTTP API |

## 프로덕션 배포

### Kubernetes 매니페스트 예시

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mail-server
spec:
  replicas: 3
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
---
apiVersion: v1
kind: Service
metadata:
  name: mail-server
spec:
  selector:
    app: mail-server
  ports:
    - port: 8080
```

### 프로덕션 변경사항

| 영역 | 로컬 | 프로덕션 |
|------|------|----------|
| 오케스트레이션 | Docker Compose | Kubernetes |
| DB | 단일 컨테이너 | RDS PostgreSQL 16 Multi-AZ |
| 캐시 | 단일 Redis | ElastiCache Redis Cluster |
| 스토리지 | MinIO | AWS S3 또는 S3-compatible object storage |
| TLS | 없음 | cert-manager + Let's Encrypt |
| 게이트웨이 | 없음 | Kong / Nginx Ingress |
| 모니터링 | 없음 | Prometheus + Grafana |
| 비밀 관리 | `.env` | Kubernetes Secrets |

## 환경 변수

| 변수 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `POSTGRES_PASSWORD` | ✅ | — | DB 비밀번호 |
| `DATABASE_URL` | ✅ | — | PostgreSQL 연결 문자열 |
| `REDIS_URL` | ✅ | — | Redis 연결 문자열 |
| `OPENAI_API_KEY` | ✅ | — | OpenAI API 키 |
| `LOCAL_SERVICE_TOKEN` | ✅ | — | 서비스 간 인증 토큰 |
| `WEBHOOK_SECRET` | ✅ | — | 수신 웹훅 검증 |
| `AI_MODEL` | — | gpt-4o-mini | AI 모델 |
| `AI_RATE_LIMIT_PER_MINUTE` | — | 20 | 메일박스당 분당 제한 |
| `S3_ENDPOINT` | — | http://localhost:9000 | S3/MinIO 엔드포인트 |
| `S3_ACCESS_KEY` | — | minioadmin | 접근 키 |
| `S3_SECRET_KEY` | — | — | 비밀 키 |

## 롤백

```bash
# Docker Compose
docker compose down
git checkout <이전 버전>
docker compose up --build -d

# Kubernetes
kubectl rollout undo deployment/mail-server
kubectl rollout undo deployment/ai-agent
```

## 보안 체크리스트

- [ ] `LOCAL_SERVICE_TOKEN`은 32바이트 이상 무작위 문자열
- [ ] `WEBHOOK_SECRET`은 외부 서비스와 별도 관리
- [ ] `.env` 파일 권한 `chmod 600`
- [ ] PostgreSQL은 `127.0.0.1`에만 바인딩 (로컬)
- [ ] MinIO Console은 외부 노출 금지 또는 강력한 비밀번호
- [ ] 프로덕션 VPC 내부 배치
