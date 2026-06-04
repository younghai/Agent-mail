# 07-Maintenance — Agent Mail (v1-present)

## 일일 점검 체크리스트

```bash
# 1. 컨테이너 상태
docker compose ps

# 2. 헬스체크
curl -s http://localhost:8080/ready | jq .
curl -s http://localhost:8000/ready | jq .

# 3. 에러 로그
docker compose logs --tail=50 mail-server 2>&1 | grep -i error || echo "No errors"
docker compose logs --tail=50 ai-agent 2>&1 | grep -i error || echo "No errors"

# 4. AI 사용량
psql $DATABASE_URL -c "SELECT DATE(created_at), model, COUNT(*), SUM(cost_usd) FROM admin_agent_usage_events GROUP BY 1,2 ORDER BY 1 DESC LIMIT 7;"

# 5. Redis Stream 백로그
docker compose exec redis redis-cli XLEN email-events
```

## 주간 점검

- [ ] PostgreSQL 디스크 사용량 (`\l+` 또는 `df`)
- [ ] MinIO 버킷 크기 추이
- [ ] AI 초안 평균 지연 시간 (`latency_ms` 평균)
- [ ] 미처리 승인 대기 메일 수
- [ ] `pg_dump` 수동 백업 1회

## 로그 및 모니터링

| 서비스 | 로그 명령 | 메트릭 |
|--------|-----------|--------|
| Mail Server | `docker compose logs -f mail-server` | 응답 시간 P95 < 500ms |
| AI Agent | `docker compose logs -f ai-agent` | 응답 시간 P95 < 5s |
| PostgreSQL | `docker compose logs -f postgres` | 연결 수 < 80% pool |
| Redis | `docker compose logs -f redis` | Stream 길이 < 100 |

## 데이터베이스 운영

```bash
# 연결 확인
docker compose exec postgres psql -U agentic -d agentic_inbox

# 슬로우 쿼리
SELECT query, mean_exec_time, calls FROM pg_stat_statements WHERE mean_exec_time > 1000 ORDER BY mean_exec_time DESC LIMIT 10;

# VACUUM
VACUUM ANALYZE emails;
VACUUM ANALYZE admin_agent_usage_events;
```

## 백업

```bash
# PostgreSQL
docker compose exec postgres pg_dump -U agentic agentic_inbox > backup_$(date +%Y%m%d).sql

# MinIO
mc mirror local/agentic-inbox /backup/s3-$(date +%Y%m%d)
```

## 장애 대응

### PostgreSQL 다운
```bash
docker compose restart postgres
```

### Redis 다운
```bash
docker compose restart redis
docker compose restart ai-agent
```

### AI Agent 장애
```bash
docker compose logs --tail=100 ai-agent
docker compose restart ai-agent
```

### OpenAI Rate Limit
- `AI_RATE_LIMIT_PER_MINUTE` 임시 하향
- 폴리백 모델 준비 (아키텍처 개선 필요)

## 업데이트 절차

```bash
# 1. 백업
pg_dump ... > backup.sql

# 2. 이미지 빌드 & 푸시
docker build -t <registry>/mail-server:v1.0.1 ./mail-server
docker push <registry>/mail-server:v1.0.1

# 3. 롤링 업데이트
kubectl set image deployment/mail-server mail-server=<registry>/mail-server:v1.0.1
kubectl rollout status deployment/mail-server
```
