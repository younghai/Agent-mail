# v1 Operations Runbook

## 1. 일상 모니터링 체크리스트

### 1.1 매일 (Daily)

- [ ] Grafana 대시보드 확인: 에러율, 응답 시간, 큐 길이
- [ ] AI Provider API 사용량 및 비용 확인
- [ ] 이메일 수신/발신 통계 확인
- [ ] DLQ (Dead Letter Queue) 확인 및 처리
- [ ] 백업 상태 확인

### 1.2 매주 (Weekly)

- [ ] Pod 리소스 사용량 리뷰 (CPU/Memory)
- [ ] HPA 설정 최적화
- [ ] 로그 이상 패턴 분석
- [ ] 보안 패치 가능 여부 확인
- [ ] AI 모델 성능 리뷰 (응답 품질, 지연)

### 1.3 매월 (Monthly)

- [ ] 비용 리포트 검토 (AWS/GCP 청구서)
- [ ] 데이터베이스 용량 증가 추이 분석
- [ ] RPO/RTO 테스트 수행
- [ ] 접근 권한 리뷰 (RBAC)
- [ ] AI 시스템 프롬프트 효과성 평가

## 2. 알람 응답

### 2.1 P1 (Critical) — 15분 내 응답

| 알람 | 증상 | 즉시 조치 | 에스컬레이션 |
|------|------|-----------|-------------|
| **Mail Server 5xx > 5%** | 이메일 API 장애 | Pod restart, replica 증가 | SRE 팀 |
| **PostgreSQL Down** | 모든 DB 접근 불가 | Replica 승격, failover | DBA |
| **SMTP 수신 불가** | 이메일 수신 누락 | Haraka Pod 확인, DNS/MX 확인 | 인프라팀 |
| **AI Agent Down > 5분** | 자동 draft 생성 불가 | Pod restart, queue backlog 확인 | ML 엔지니어 |

### 2.2 P2 (High) — 1시간 내 응답

| 알람 | 증상 | 조치 |
|------|------|------|
| **AI 응답 시간 > 30s** | AI Provider 지연 | Fallback provider 전환, rate limit 확인 |
| **Redis 메모리 > 90%** | 캐시/큐 장애 위험 | TTL 조정, 메모리 증가, 불필요 데이터 삭제 |
| **Queue Lag > 1000** | 이벤트 처리 지연 | Consumer replica 증가 |
| **S3/MinIO 지연** | 첨부파일 업로드 느림 | 스토리지 클래스 확인, 네트워크 확인 |

### 2.3 P3 (Medium) — 4시간 내 응답

| 알람 | 증상 | 조치 |
|------|------|------|
| **Pod OOMKilled** | 메모리 부족 | 리소스 limit 증가 또는 메모리 누수 조사 |
| **Certificate 만료 < 7일** | TLS 인증서 만료 임박 | cert-manager 확인, 수동 갱신 |
| **디스크 용량 > 80%** | 저장 공간 부족 | 데이터 아카이빙, 파티션 추가 |

## 3. 장애 대응 시나리오

### 3.1 메일 서버 장애

**증상**: `/api/v1/mailboxes/*/emails` 5xx 응답

**진단**:
```bash
# Pod 상태 확인
kubectl get pods -n agentic-inbox -l app=mail-server
kubectl describe pod mail-server-xxx

# 로그 확인
kubectl logs -n agentic-inbox -l app=mail-server --tail=100

# DB 연결 확인
kubectl exec -it mail-server-xxx -- nc -zv postgres 5432
```

**복구**:
```bash
# 1. Pod 재시작
kubectl rollout restart deployment/mail-server -n agentic-inbox

# 2. Replica 긴급 증가
kubectl scale deployment/mail-server --replicas=6 -n agentic-inbox

# 3. DB connection pool 확인
kubectl exec -it postgres-0 -- psql -U agentic -c "SELECT count(*) FROM pg_stat_activity;"
```

### 3.2 PostgreSQL 장애

**증상**: DB 접속 불가, 모든 서비스 5xx

**진단**:
```bash
# Primary 상태
kubectl exec -it postgres-0 -- pg_isready

# 로그
kubectl logs postgres-0 --tail=200
```

**복구 (Failover)**:
```bash
# 1. Replica 승격 (수동 failover)
kubectl exec -it postgres-1 -- pg_ctl promote

# 2. 서비스 엔드포인트 업데이트
kubectl patch service postgres -p '{"spec":{"selector":{"role":"primary"}}}'

# 3. 새 Replica 생성
kubectl delete pod postgres-0
# StatefulSet이 자동으로 새 replica 생성
```

### 3.3 AI Provider 장애

**증상**: AI 응답 시간 초과, draft 생성 실패

**진단**:
```bash
# AI Agent 로그
kubectl logs -n agentic-inbox -l app=ai-agent --tail=100

# OpenAI API 상태 확인
curl https://status.openai.com/api/v2/status.json
```

**복구**:
```bash
# 1. Fallback provider 설정 변경
kubectl set env deployment/ai-agent \
  AI_PROVIDER=anthropic \
  AI_MODEL=claude-3-5-sonnet \
  -n agentic-inbox

# 2. Pod 재시작
kubectl rollout restart deployment/ai-agent -n agentic-inbox

# 3. Queue backlog 모니터링
kubectl exec -it redis-0 -- redis-cli XLEN email-events
```

### 3.4 프롬프트 인젝션 공격

**증상**: 다수의 이메일이 AI draft 생성 차단됨

**진단**:
```bash
# DLQ 및 보안 로그 확인
kubectl logs -n agentic-inbox -l app=ai-agent | grep "injection_detected"

# 차단된 이메일 발신자 분석
kubectl exec -it postgres-0 -- psql -U agentic -c \
  "SELECT sender, COUNT(*) FROM email_events WHERE event_type='injection_detected' GROUP BY sender;"
```

**복구**:
```bash
# 1. 의심 발신자 블록 (메일 서버 레벨)
# 메일 서버 설정에 블록 리스트 추가

# 2. 인젝션 탐지 민감도 조정 (필요시)
kubectl set env deployment/ai-agent \
  INJECTION_KEYWORDS='ignore previous instructions,you are now,DAN' \
  -n agentic-inbox

# 3. 보안 팀에 알림
```

## 4. 데이터 백업 및 복구

### 4.1 PostgreSQL 백업

```bash
# 일일 전체 백업 (CronJob)
kubectl create cronjob postgres-backup \
  --image=postgres:16-alpine \
  --schedule="0 2 * * *" \
  --command -- sh -c 'pg_dump $DATABASE_URL | gzip > /backup/$(date +%Y%m%d).sql.gz'

# PITR (Point-in-Time Recovery) — WAL 아카이빙
# pgBackRest 또는 WAL-G 사용
```

### 4.2 S3/MinIO 백업

```bash
# rclone을 통한 크로스 리전 복제
rclone sync s3:agentic-inbox-prod s3:agentic-inbox-backup

# 또는 Velero
velero backup create agentic-inbox --include-namespaces agentic-inbox
```

### 4.3 복구 절차

```bash
# 1. 마지막 백업 확인
ls -la /backups/

# 2. PostgreSQL 복구
pg_restore -d agentic_inbox /backups/20260415.sql.gz

# 3. S3 객체 복구
rclone sync s3:agentic-inbox-backup s3:agentic-inbox-prod

# 4. 서비스 재시작
kubectl rollout restart deployment/mail-server deployment/ai-agent -n agentic-inbox
```

## 5. 패치 및 업데이트

### 5.1 무중단 배포 (Blue-Green)

```bash
# 1. Green 환경 배포
kubectl apply -k k8s/overlays/green

# 2. 헬스체크
kubectl rollout status deployment/mail-server -n agentic-inbox-green

# 3. 트래픽 전환 (Ingress)
kubectl patch ingress agentic-inbox-ingress \
  -p '{"spec":{"rules":[{"host":"api.agentic-inbox.example.com","http":{"paths":[{"path":"/","pathType":"Prefix","backend":{"service":{"name":"mail-server-green","port":{"number":8080}}}}]}}]}}'

# 4. Blue 환경 유지 (롤백 대비)
# 24시간 후 Blue 제거
```

### 5.2 데이터베이스 마이그레이션

```bash
# 1. 마이그레이션 Job 실행
kubectl apply -f k8s/jobs/migration.yaml

# 2. 완료 확인
kubectl logs -f job/db-migration -n agentic-inbox

# 3. 애플리케이션 배포
kubectl apply -k k8s/overlays/production
```

## 6. 문의 및 에스컬레이션

| 상황 | 1차 담당자 | 2차 담당자 | 3차 담당자 |
|------|-----------|-----------|-----------|
| 서비스 장애 | SRE 온콜 | SRE 리드 | CTO |
| AI 품질 이슈 | ML 엔지니어 | AI 리드 | CTO |
| 보안 사고 | 보안팀 | CISO | CEO |
| 데이터 손실 | DBA | SRE 리드 | CTO |
| 비용 급증 | SRE | CFO | CEO |
