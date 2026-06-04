# 6. 배포 가이드 (Deployment Guide)

> 워터폴 6단계 — 로컬 개발부터 프로덕션 배포까지의 절차를 다룬다.

---

## 6.1 로컬 개발 (Native macOS)

### 사전 조건

| 도구 | 버전 | 확인 방법 |
|------|------|-----------|
| Node.js | 22.x | `node -v` |
| Python | 3.9+ | `python3 -V` |
| PostgreSQL | 16 | `psql --version` |
| pnpm | 10.x | `pnpm -v` |

### PostgreSQL 설치 및 시작

```bash
# Homebrew로 설치 (처음 한 번)
brew install postgresql@16

# 서비스 시작
brew services start postgresql@16
# 또는 수동 시작
pg_ctl -D /opt/homebrew/var/postgresql@16 start
```

### 환경변수 설정

```bash
# .env 파일 생성
cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres:paperclip@localhost:5432/agentic_inbox
OPENAI_API_KEY=sk-...
MAIL_SERVER_PORT=8080
AI_AGENT_PORT=8000
EOF
```

### 서비스 시작

```bash
# 터미널 1: PostgreSQL (이미 실행 중이면 skip)
brew services start postgresql@16

# 터미널 2: Mail Server
cd services/mail-server
pnpm install
node src/index.js
# → http://localhost:8080

# 터미널 3: AI Agent
cd services/ai-agent
pip install -r requirements.txt
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
# → http://localhost:8000

# 터미널 4: Frontend (v1 proxy 설정)
cd ../..
pnpm run dev -- --port 5173
# → http://localhost:5173
```

### 데이터베이스 초기화

```bash
cd services/mail-server
# DB 생성 (처음 한 번)
createdb agentic_inbox

# 스키마 + 시드 적용
psql agentic_inbox -f migrations/001_initial.sql

# 시드 데이터 확인
psql agentic_inbox -c "SELECT COUNT(*) FROM emails;"
```

---

## 6.2 Docker Compose 배포

### 사전 조건

- Docker Desktop 실행 중
- `docker-compose` 또는 `docker compose`

### 전체 스택 실행

```bash
# .env 준비 (OPENAI_API_KEY 필수)
cp .env.example .env
# vi .env  # OPENAI_API_KEY 입력

# 빌드 및 실행
docker-compose up --build

# 백그라운드 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f mail-server
docker-compose logs -f ai-agent
```

### 서비스별 포트

| 서비스 | 컨테이너 낶부 | 호스트 매핑 |
|--------|-------------|------------|
| PostgreSQL | 5432 | 5432 |
| Mail Server | 8080 | 8080 |
| AI Agent | 8000 | 8000 |

---

## 6.3 프로덕션 배포 (계획)

### Kubernetes 매니페스트 구조

```
k8s/
├── namespace.yaml
├── configmap.yaml          # 비민감 설정
├── secret.yaml             # OPENAI_API_KEY, DB_URL
├── postgres/
│   ├── statefulset.yaml
│   ├── service.yaml
│   └── pvc.yaml
├── mail-server/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── hpa.yaml
├── ai-agent/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── hpa.yaml
└── ingress.yaml
```

### 배포 절차

```bash
# 1. 네임스페이스 생성
kubectl apply -f k8s/namespace.yaml

# 2. 설정/시크릿 적용
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# 3. PostgreSQL 배포
kubectl apply -f k8s/postgres/

# 4. 애플리케이션 배포
kubectl apply -f k8s/mail-server/
kubectl apply -f k8s/ai-agent/

# 5. Ingress 배포
kubectl apply -f k8s/ingress.yaml

# 6. 상태 확인
kubectl get pods -n agentic-inbox
kubectl get svc -n agentic-inbox
```

---

## 6.4 환경별 설정 매트릭스

| 설정 | Local | Docker Compose | K8s Production |
|------|-------|---------------|----------------|
| DB Host | `localhost` | `postgres` | `postgres-svc` |
| DB User | `postgres` | `postgres` | `agentic` |
| DB Password | `paperclip` | `paperclip` | Secret 참조 |
| OpenAI Key | `.env` | `.env` | K8s Secret |
| Log Level | `debug` | `info` | `warn` |
| CORS | `*` | `*` | 특정 오리진 |
| Workers | 1 | 1 | 3+ (HPA) |

---

## 6.5 롤백 절차

### Docker Compose

```bash
# 이전 버전 이미지로 롤백
docker-compose down
docker-compose pull  # 또는 특정 태그 지정
docker-compose up -d
```

### Kubernetes

```bash
# 롤아웃 히스토리 확인
kubectl rollout history deployment/mail-server -n agentic-inbox

# 이전 리비전으로 롤백
kubectl rollout undo deployment/mail-server -n agentic-inbox

# 특정 리비전으로 롤백
kubectl rollout undo deployment/mail-server --to-revision=2 -n agentic-inbox
```
