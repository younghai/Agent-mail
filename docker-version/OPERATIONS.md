# v1-present Agent Mail — 운영 런북

> **대상**: SRE, DevOps, 운영 담당자
> **목표**: 장애 발생 시 5분 내 원인 파악 및 복구할 수 있는 절차 제공

---

## 1. 아키텍처 개요

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Client/    │────▶│  Mail       │────▶│  AI Agent   │
│  Frontend   │     │  Server     │     │  :8000      │
│             │◀────│  :8080      │◀────│             │
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                           │                    │
              ┌────────────┴────────────────────┤
              ▼                                 ▼
      ┌──────────────┐                ┌──────────────┐
      │  PostgreSQL  │                │    Redis     │
      │   :5432      │                │   :6379      │
      │  ( emails,   │                │  (streams)   │
      │   tasks,     │                └──────────────┘
      │   usage )    │
      └──────────────┘
              │
              ▼
      ┌──────────────┐
      │    MinIO     │
      │  :9000/9001  │
      │ (attachments)│
      └──────────────┘
```

**데이터 흐름**:
1. 수신 이메일 → `POST /api/v1/webhooks/email` → PostgreSQL 저장 → Redis Stream `XADD`
2. AI Agent 백그라운드 소비자 → `XREADGROUP` → OpenAI 초안 생성 → PostgreSQL drafts 저장
3. 사용자 요청 → Mail Server → AI Agent 호출 (동기) 또는 DB 직접 조회
4. 첨부파일 → Mail Server가 MinIO에 업로드 → 메타데이터는 PostgreSQL

---

## 2. 일일 점검 체크리스트

### 2.1 아침 점검 (5분)

```bash
# 1. 모든 컨테이너 Running 상태
docker compose ps

# 2. Health 엔드포인트 정상
curl -s http://localhost:8080/ready | jq .
curl -s http://localhost:8000/ready | jq .

# 3. 최근 에러 로그 유무
docker compose logs --tail=50 mail-server 2>&1 | grep -i error || echo "No errors"
docker compose logs --tail=50 ai-agent 2>&1 | grep -i error || echo "No errors"

# 4. AI 사용량 및 비용
psql $DATABASE_URL -c "SELECT DATE(created_at), model, COUNT(*), SUM(cost_usd) FROM admin_agent_usage_events GROUP BY 1,2 ORDER BY 1 DESC LIMIT 7;"

# 5. Redis Stream 백로그 (소비 지연 확인)
docker compose exec redis redis-cli XLEN email-events
```

### 2.2 주간 점검

- [ ] PostgreSQL 디스크 사용량 (`\l+` 또는 `df`)
- [ ] MinIO 버킷 크기 추이
- [ ] AI 초안 평균 지연 시간 (`admin_agent_usage_events.latency_ms` 평균)
- [ ] 미처리 승인 대기 메일 수 (drafts 폴리에서 `is_pending_review = true` 등)
- [ ] `pg_dump` 기반 수동 백업 1회 실행

---

## 3. 로그 및 모니터링

### 3.1 로그 위치

| 서비스 | Docker 로그 명령 | 파일 로그 (프로덕션) |
|--------|------------------|---------------------|
| Mail Server | `docker compose logs -f mail-server` | `/var/log/mail-server/app.log` |
| AI Agent | `docker compose logs -f ai-agent` | `/var/log/ai-agent/app.log` |
| PostgreSQL | `docker compose logs -f postgres` | PG 로그 + `pg_stat_statements` |
| Redis | `docker compose logs -f redis` | `slowlog get 10` |

### 3.2 핵심 메트릭

| 메트릭 | 수집 방법 | 임계값 | 알림 |
|--------|-----------|--------|------|
| Mail Server 응답 시간 | `curl -w '%{time_total}'` | > 500ms | P2 |
| AI Agent 응답 시간 | `curl -w '%{time_total}'` | > 5s | P2 |
| OpenAI API 오류율 | `admin_agent_usage_events` 필터링 | > 5% | P1 |
| Redis Stream 길이 | `XLEN email-events` | > 100건 (10분 지속) | P1 |
| PostgreSQL 연결 수 | `pg_stat_activity` | > 80% pool | P2 |
| 디스크 사용량 | `df -h` | > 85% | P1 |

---

## 4. 데이터베이스 운영

### 4.1 연결

```bash
# 로컬
docker compose exec postgres psql -U agentic -d agentic_inbox

# 프로덕션
psql $DATABASE_URL
```

### 4.2 자주 사용하는 쿼리

```sql
-- 현재 연결 세션 확인
SELECT pid, usename, state, query_start, query FROM pg_stat_activity WHERE datname = 'agentic_inbox';

-- 슬로우 쿼리 (1초 이상)
SELECT query, mean_exec_time, calls FROM pg_stat_statements WHERE mean_exec_time > 1000 ORDER BY mean_exec_time DESC LIMIT 10;

-- 이메일 분포
SELECT f.name, COUNT(e.id) FROM emails e JOIN folders f ON e.folder_id = f.id GROUP BY f.name;

-- 미답변 스레드 (3일 이상 경과)
SELECT thread_id, MAX(created_at) as last_activity FROM emails GROUP BY thread_id HAVING MAX(created_at) < NOW() - INTERVAL '3 days';

-- AI 사용량 TOP 10 메일박스 (월간)
SELECT mailbox_id, COUNT(*) as draft_count, SUM(cost_usd) as total_cost FROM admin_agent_usage_events WHERE created_at > DATE_TRUNC('month', NOW()) GROUP BY 1 ORDER BY 3 DESC LIMIT 10;
```

### 4.3 인덱스 유지보수

```sql
-- 인덱스 상태 확인
SELECT schemaname, tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid)) as size FROM pg_stat_user_indexes WHERE tablename IN ('emails', 'admin_tasks', 'admin_agent_usage_events') ORDER BY pg_relation_size(indexrelid) DESC;

-- VACUUM (주간)
VACUUM ANALYZE emails;
VACUUM ANALYZE admin_agent_usage_events;
```

---

## 5. Redis 운영

```bash
docker compose exec redis redis-cli

# 스트림 소비자 그룹 상태
XINFO GROUPS email-events
XINFO CONSUMERS email-events ai-agent-group

# 백로그 긴급 확인
XLEN email-events

# 메모리 사용량
INFO memory

# 키 통계
DBSIZE
```

**주의**: Redis Stream이 계속 쌓이면 AI Agent 소비자가 죽었거나 느린 것입니다. 즉시 `docker compose logs -f ai-agent`로 확인하세요.

---

## 6. MinIO 운영

### 6.1 웹 콘솔

http://localhost:9001 접속 (minioadmin / 비밀번호)

### 6.2 CLI (mc)

```bash
mc alias set local http://localhost:9000 minioadmin minio-local-change-me
mc ls local/agentic-inbox
mc du local/agentic-inbox          # 버킷 전체 크기
```

### 6.3 첨부파일 유실 대응

메타데이터는 PostgreSQL `attachments` 테이블에, 실제 파일은 MinIO에 저장됩니다.
**메타데이터-파일 불일치**가 발생하면:

```sql
-- MinIO에는 없는 메타데이터 찾기 (프로덕션 스크립트 필요)
-- 청소 정책: 90일 이상 지난 첨부파일 자동 삭제 등 고려
```

---

## 7. 장애 대응 시나리오

### 7.1 PostgreSQL 다운

**징후**: `/ready` 실패, 모든 API 500 오류
**조치**:
```bash
# 1. 상태 확인
docker compose ps postgres

# 2. 재시작
docker compose restart postgres

# 3. 복구 불가 시 마지막 백업 복원
docker compose exec -T postgres psql -U agentic agentic_inbox < backup_YYYYMMDD.sql
```

### 7.2 Redis 다운

**징후**: AI 자동 초안 생성 중단, 웹훅은 정상 작동
**조치**:
```bash
docker compose restart redis
# 재기동 후 ai-agent도 재시작 (컨슈머 재연결)
docker compose restart ai-agent
```

### 7.3 Mail Server 장애

**징후**: 8080 포트 응답 없음
**조치**:
```bash
# 로그 확인
docker compose logs --tail=100 mail-server

# 재시작
docker compose restart mail-server

# 심각한 경우 DB 연결 풀 고갈 가능성 → PostgreSQL 동시 연결 확인
```

### 7.4 AI Agent 장애

**징후**: 8000 포트 응답 없음, 초안 생성 실패
**조치**:
```bash
docker compose logs --tail=100 ai-agent

# OpenAI API 오류인지 확인
docker compose logs ai-agent | grep -i "openai\|rate limit\|timeout"

# 재시작
docker compose restart ai-agent
```

### 7.5 OpenAI API 장애 / Rate Limit

**징후**: `admin_agent_usage_events`에 `error_code` 급증
**조치**:
- 임시로 `AI_RATE_LIMIT_PER_MINUTE`를 낮춤
- 백업 모델로 전환 (예: OpenAI → Anthropic Claude) — v1-present는 단일 모델이라 아키텍처 개선 필요
- 프롬프트 캐싱 또는 배치 처리로 호출 빈도 감소

### 7.6 디스크 가득 참

**징후**: 컨테이너 재시작 실패, 쓰기 오류
**조치**:
```bash
# 용량 확인
docker system df

# 오래된 Docker 이미지/빌드 캐시 정리
docker system prune -a

# PostgreSQL WAL 정리 (비상)
docker compose exec postgres psql -U agentic -c "CHECKPOINT;"
```

---

## 8. 스케일 아웃 고려사항

### 8.1 Mail Server

- **무상태(stateless)** 설계로 수평 확장 가능
- 세션/캐시를 Redis 외부에 두지 않음
- 주의: 파일 업로드 시 `multer` 메모리 스토리지 사용 → 대용량 첨부 동시 업로드 시 메모리 부족 가능. 스트리밍 업로드 또는 임시 디스크 저장 권장

### 8.2 AI Agent

- OpenAI API 호출이 병목이므로 단순 replica 증가만으로는 한계
- **배치 처리** 또는 **비동기 큐(Trigger.dev, Celery, BullMQ)** 도입 고려
- Rate Limit은 메일박스별 sliding window로 관리 중이나, Redis 기반이므로 확장 시 분산 락 필요

### 8.3 데이터베이스

- 현재 단일 PostgreSQL. Write 부하 증가 시:
  1. Read Replica 추가 (읽기 쿼리 분산)
  2. `emails` 테이블 파티셔닝 (월/년 단위)
  3. TSVECTOR 검색 전용 인덱스 튜닝 또는 Elasticsearch 도입

---

## 9. 연락처 및 에스컬레이션

| 역할 | 담당 | 연락처 | 비고 |
|------|------|--------|------|
| 서비스 오너 | — | — | 기능/정책 결정 |
| SRE / 인프라 | — | — | 장애 복구, 배포 |
| AI/ML 엔지니어 | — | — | 초안 품질, 프롬프트 튜닝 |
| 고객 성공 | — | — | 고객사별 워크플로우 설정 |

---

## 10. 문서 변경 이력

| 날짜 | 버전 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 2026-05-05 | 1.0 | — | 초안 작성 |
