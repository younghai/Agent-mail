# v1 Disaster Recovery Plan

## 1. RTO / RPO 목표

| 시스템 | RTO (복구 시간) | RPO (데이터 손실 허용) |
|--------|----------------|----------------------|
| **Mail Server** | 5분 | 0 (Active-Active) |
| **AI Agent** | 10분 | 0 (Queue에 보관) |
| **PostgreSQL** | 15분 | 5분 (WAL 아카이빙) |
| **Redis** | 5분 | 5분 (AOF 지속성) |
| **S3/MinIO** | 0분 | 0 (Cross-region replication) |
| **Frontend** | 5분 | 0 (Immutable deployment) |

## 2. 재난 시나리오 및 대응

### 2.1 시나리오 A: 단일 가용영역 장애

**원인**: 데이터센터 정전, 네트워크 단절

**영향**: 해당 AZ 내 Pod, 노드 장애

**대응**:
```
1. Kubernetes가 자동으로 다른 AZ에 Pod 재스케줄링
2. PostgreSQL: Replica가 다른 AZ에 있으면 자동 Failover
3. Redis: Sentinel이 자동으로 새 Primary 선출
4. MinIO: Erasure Coding으로 데이터 복구
```

**예방**:
- Pod Anti-Affinity 설정 (같은 AZ에 중복 배치 방지)
- PostgreSQL: 동기 복제 (synchronous_commit = remote_apply)
- Redis: Sentinel 3개를 다른 AZ에 분산

### 2.2 시나리오 B: 전체 리전 장애

**원인**: 지진, 홍수, 리전 전체 네트워크 장애

**영향**: 모든 서비스 중단

**대응**:
```
1. 재해 복구 리전으로 DNS 전환 (Route53 / Cloudflare)
2. S3 Cross-Region Replication에서 데이터 복원
3. PostgreSQL: DR 리전의 standby 승격
4. Redis: DR 리전에서 새 클러스터 구축
5. Kubernetes: DR 클러스터에 애플리케이션 배포
```

**DR 환경**:
```
Primary Region: ap-northeast-2 (서울)
DR Region:      ap-northeast-1 (도쿄)

- S3: CRR (Cross-Region Replication) 활성화
- RDS: Cross-Region Read Replica
- EKS: DR 클러스터는 0개 노드로 유지 (비용 절감), 장애 시 스케일 아웃
```

### 2.3 시나리오 C: 데이터 손실 (PostgreSQL)

**원인**: 실수로 DROP TABLE, 랜섬웨어, 스토리지 손상

**대응**:
```bash
# 1. 즉시 서비스 중지 (데이터 덮어쓰기 방지)
kubectl scale deployment mail-server --replicas=0 -n agentic-inbox

# 2. 백업 확인
aws s3 ls s3://agentic-inbox-backups/postgres/ | tail -5

# 3. 특정 시점 복구 (PITR)
# pgBackRest 사용 시
pgbackrest restore --type=time --target="2026-04-15 09:30:00"

# 4. 데이터 검증
pg_dump --schema-only agentic_inbox | wc -l

# 5. 서비스 재개
kubectl scale deployment mail-server --replicas=3 -n agentic-inbox
```

### 2.4 시나리오 D: AI Provider 전면 장애

**원인**: OpenAI/Anthropic 전역 장애

**대응**:
```
1. 자동 Fallback:
   - OpenAI 실패 → Anthropic 시도
   - Anthropic 실패 → Azure OpenAI 시도
   - 모두 실패 → Ollama (자체 호스팅) 시도

2. 자체 호스팅 모델 긴급 스케일 아웃:
   - Ollama Pod replica 증가
   - GPU 노드 추가 (EKS/GKE)

3. 수동 모드 전환:
   - AI 자동 draft 생성 비활성화
   - 사용자에게 "수동 draft" 안내
```

### 2.5 시나리오 E: 보안 침해 (데이터 유출)

**원인**: API key 유출, 취약점 공격

**대응**:
```
1. 즉시 조치 (0~1시간):
   - 유출 의심 API key 폐기 및 재발급
   - 관련 계정 세션 전체 무효화
   - WAF 규칙 긴급 업데이트

2. 단기 조치 (1~24시간):
   - 취약점 패치 및 배포
   - 접근 로그 분석
   - 영향 범위 파악

3. 장기 조치 (1~7일):
   - 포렌식 조사
   - 규제 당국 보고 (필요시)
   - 보안 강화 조치
```

## 3. 복구 자동화

### 3.1 Runbook 자동화 (StackStorm / Rundeck)

```yaml
# automation/dr-failover.yaml
name: "Regional Failover"
triggers:
  - type: monitoring
    condition: "primary_region_availability < 50%"

steps:
  - name: "Update DNS"
    action: "cloudflare.update_dns"
    params:
      record: "api.agentic-inbox.example.com"
      value: "dr-alb.ap-northeast-1.elb.amazonaws.com"

  - name: "Scale DR Cluster"
    action: "eks.scale_nodegroup"
    params:
      cluster: "agentic-inbox-dr"
      nodegroup: "main"
      desired_size: 5

  - name: "Promote DB Replica"
    action: "rds.promote_read_replica"
    params:
      db_instance: "agentic-inbox-dr-postgres"

  - name: "Notify Team"
    action: "slack.send_message"
    params:
      channel: "#incidents"
      message: "🚨 Regional failover initiated. DR is now active."
```

### 3.2 Chaos Engineering

```bash
# Chaos Mesh를 통한 정기적 장애 주입
# 매주 금요일 오전 (낮은 트래픽 시간대)

# 1. Pod 강제 종료
chaosctl delete pod --namespace agentic-inbox --label app=mail-server --count 1

# 2. 네트워크 지연
chaosctl network delay --namespace agentic-inbox --label app=ai-agent --duration 30s

# 3. DB 장애 시뮬레이션
chaosctl delete pod --namespace agentic-inbox --name postgres-0

# 4. 검증
./scripts/verify_system_health.sh
```

## 4. DR 테스트 계획

| 테스트 유형 | 주기 | 방법 |
|------------|------|------|
| **Tabletop Exercise** | 분기 | 가상 시나리오 토론 |
| **Failover Test** | 월간 | DR 리전으로 수동 전환 |
| **Backup Restore Test** | 월간 | 백업에서 테스트 DB 복원 |
| **Chaos Test** | 주간 | 생산 환경에 제한적 장애 주입 |
| **Full DR Drill** | 반기 | 실제 전체 시스템 DR 전환 |

## 5. 복구 후 점검 사항

- [ ] 모든 서비스 Pod Ready 상태 확인
- [ ] DB replication lag 확인 (< 1초)
- [ ] Queue backlog 처리 완료 확인
- [ ] 이메일 수신/발신 정상 확인
- [ ] AI draft 생성 정상 확인
- [ ] 사용자 로그인 정상 확인
- [ ] 모니터링/알림 시스템 정상 확인
- [ ] 보안 정책 적용 상태 확인
- [ ] 비용 영향 분석
- [ ] 사후 분석 (Post-mortem) 작성

## 6. 연락처

| 역할 | 이름 | 연락처 | 대체 연락처 |
|------|------|--------|------------|
| SRE 온콜 | — | PagerDuty | Slack #incidents |
| DBA | — | 전화/Slack | 전화 |
| 보안팀 | — | 전화/Slack | 전화 |
| 클라우드 계정 관리자 | — | 전화/이메일 | 전화 |
