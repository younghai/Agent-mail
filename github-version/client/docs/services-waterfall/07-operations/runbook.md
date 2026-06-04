# 7. 운영 매뉴얼 (Operations Runbook)

> 워터폴 7단계 — 장애 대응, 모니터링, 유지보수 절차를 다룬다.

---

## 7.1 서비스 상태 확인

### 헬스체크 엔드포인트

```bash
# Mail Server
curl http://localhost:8080/health
# 예상 응답: {"status":"healthy","timestamp":"..."}

# AI Agent
curl http://localhost:8000/health
# 예상 응답: {"status":"healthy","checks":{"database":"ok","ai_provider":"ok"}}
```

### 프로세스 확인

```bash
# Mail Server
ps aux | grep "node src/index.js"
lsof -i :8080

# AI Agent
ps aux | grep "uvicorn"
lsof -i :8000

# PostgreSQL
ps aux | grep postgres
lsof -i :5432
```

---

## 7.2 로그 확인

### Docker Compose

```bash
# 실시간 로그
docker-compose logs -f mail-server
docker-compose logs -f ai-agent

# 최근 100줄
docker-compose logs --tail=100 mail-server
```

### Native (로깅 미구현 → 개선 필요)

현재는 `console.log` / `print` 출력. 개선:
- Mail Server: `pino` 또는 `winston` 도입
- AI Agent: Python `logging` 모듈 설정

---

## 7.3 장애 시나리오

### 시나리오 1: PostgreSQL 연결 실패

**증상**:
```
Mail Server: Database connection error
AI Agent: DB connection failed
```

**조치**:
```bash
# 1. PostgreSQL 프로세스 확인
pg_isready -h localhost -p 5432

# 2. 서비스 재시작
brew services restart postgresql@16

# 3. 연결 테스트
psql postgresql://postgres:paperclip@localhost:5432/agentic_inbox -c "SELECT 1;"

# 4. Mail Server / AI Agent 재시작
```

---

### 시나리오 2: AI Draft 생성 실패 (503)

**증상**:
```json
{
  "success": false,
  "error": {
    "code": "AI_PROVIDER_NOT_CONFIGURED",
    "message": "AI provider not configured"
  }
}
```

**조치**:
```bash
# 1. 환경변수 확인
echo $OPENAI_API_KEY

# 2. .env 파일 확인
cat .env | grep OPENAI

# 3. AI Agent 재시작 (환경변수 로드)
kill $(lsof -t -i:8000)
cd services/ai-agent && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000

# 4. 헬스체크
curl http://localhost:8000/health
```

---

### 시나리오 3: 이메일 목록 조회 지연

**증상**: API 응답 시간 > 2초

**조치**:
```bash
# 1. 쿼리 실행 계획 확인
psql agentic_inbox -c "EXPLAIN ANALYZE SELECT * FROM emails WHERE mailbox_id = '...' ORDER BY received_at DESC LIMIT 20;"

# 2. 인덱스 확인
psql agentic_inbox -c "\di idx_emails_*"

# 3. 통계 업데이트
psql agentic_inbox -c "ANALYZE emails;"

# 4. 슬로우 쿼리 로그 확인
```

---

### 시나리오 4: 디스크 공간 부족

**조치**:
```bash
# 디스크 사용량 확인
df -h

# PostgreSQL WAL 파일 정리
psql agentic_inbox -c "VACUUM FULL;"

# 오래된 로그/임시 파일 삭제
```

---

## 7.4 백업 및 복구

### PostgreSQL 백업

```bash
# 전체 DB 백업
pg_dump agentic_inbox > backup_$(date +%Y%m%d_%H%M%S).sql

# 특정 테이블 백업
pg_dump -t emails agentic_inbox > emails_backup.sql

# 압축 백업
pg_dump agentic_inbox | gzip > backup_$(date +%Y%m%d).sql.gz
```

### 복구

```bash
# DB 삭제 후 재생성
dropdb agentic_inbox
createdb agentic_inbox

# 백업 복원
psql agentic_inbox < backup_20250501_120000.sql
```

---

## 7.5 모니터링 지표 (계획)

| 지표 | 도구 | 임계값 |
|------|------|--------|
| API 응답 시간 | Prometheus + Grafana | p95 > 500ms 알림 |
| DB 연결 수 | PostgreSQL stats | max_connections * 0.8 |
| AI API 호출 실패률 | OpenAI Dashboard | > 5% |
| 디스크 사용량 | node_exporter | > 80% |
| 메모리 사용량 | cAdvisor | > 85% |

---

## 7.6 스케줄 유지보수

| 작업 | 주기 | 담당 |
|------|------|------|
| PostgreSQL VACUUM ANALYZE | 주간 | 자동 (cron) |
| 백업 검증 | 월간 | 운영팀 |
| 의존성 업데이트 | 분기 | 개발팀 |
| 보안 패치 | 수시 | 운영팀 |
| 로그 로테이션 | 일간 | 자동 |
