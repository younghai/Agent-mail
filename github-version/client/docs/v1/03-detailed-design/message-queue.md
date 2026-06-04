# v1 Message Queue Design

## 1. 개요

v1 아키텍처에서는 서비스 간 느슨한 결합과 비동기 처리를 위해 **Redis Streams**를 기본 메시지 큐로 사용합니다. 복잡한 라우팅이 필요한 경우 **RabbitMQ**로 확장 가능합니다.

## 2. 기술 선택

| 기술 | 사용 사례 | 이유 |
|------|-----------|------|
| **Redis Streams** | 기본 메시지 큐 | 단순함, Pub/Sub, 이미 Redis 캐시 인프라 존재 |
| **RabbitMQ** | 복잡한 라우팅, DLQ | Exchange/Routing Key 기반 라우팅 필요 시 |
| **Kafka** | 대용량 이벤트 스트림 | 초당 10K+ 이벤트, 이벤트 소싱 패턴 시 |

## 3. Redis Streams 설계

### 3.1 Stream 정의

```
┌─────────────────────────────────────────────────────────────┐
│                     Redis Streams                            │
├─────────────────────────────────────────────────────────────┤
│  Stream: email-events                                       │
│  ├─ new_email          → AI Agent Service                   │
│  ├─ draft_created      → Mail Server Service                │
│  ├─ email_sent         → Analytics / Notification           │
│  └─ email_moved        → Search Index 업데이트              │
│                                                             │
│  Stream: ai-agent-events                                   │
│  ├─ draft_failed       → Alert / Retry                      │
│  ├─ injection_detected → Security Log                       │
│  └─ model_error        → Fallback Provider                  │
│                                                             │
│  Stream: user-events                                       │
│  ├─ user_created       → Mail Server (기본 메일박스 생성)    │
│  └─ mailbox_deleted    → Cleanup Worker                     │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Consumer Group

```
Stream: email-events
├─ Consumer Group: ai-agent-group
│   ├─ Consumer: ai-agent-1 (Pod 1)
│   ├─ Consumer: ai-agent-2 (Pod 2)
│   └─ Consumer: ai-agent-3 (Pod 3)
│
├─ Consumer Group: analytics-group
│   └─ Consumer: analytics-worker
│
└─ Consumer Group: notification-group
    └─ Consumer: notification-worker
```

### 3.3 메시지 형식

```json
{
  "event_type": "new_email",
  "version": "1.0",
  "timestamp": "2026-04-15T09:30:00Z",
  "trace_id": "abc123",
  "payload": {
    "mailbox_id": "uuid",
    "email_id": "uuid",
    "sender": "client@example.com",
    "subject": "...",
    "thread_id": "uuid",
    "priority": "normal"
  }
}
```

## 4. 이벤트 흐름

### 4.1 새 이메일 → AI Draft

```
[Haraka SMTP]
    │
    ▼ HTTP
[Mail Server]
    │
    ├──► PostgreSQL (INBOX 저장)
    │
    └──► Redis Streams XADD email-events
              │
              │ XREADGROUP GROUP ai-agent-group ai-agent-1
              ▼
        [AI Agent Service]
              │
              ├──► AI 처리
              │
              └──► HTTP POST /api/v1/drafts (Mail Server)
                        │
                        └──► PostgreSQL (DRAFT 저장)
```

### 4.2 이벤트 소비 예시 (Python)

```python
import asyncio
import redis.asyncio as redis
import json

class EmailEventConsumer:
    def __init__(self, redis_client: redis.Redis, group_name: str, consumer_name: str):
        self.redis = redis_client
        self.group = group_name
        self.consumer = consumer_name
        self.stream = "email-events"

    async def setup(self):
        try:
            await self.redis.xgroup_create(
                self.stream, self.group, id="0", mkstream=True
            )
        except redis.ResponseError:
            pass  # Group already exists

    async def consume(self):
        while True:
            try:
                messages = await self.redis.xreadgroup(
                    groupname=self.group,
                    consumername=self.consumer,
                    streams={self.stream: ">"},
                    count=10,
                    block=5000
                )

                for stream_name, entries in messages:
                    for message_id, fields in entries:
                        event = json.loads(fields["data"])
                        await self.process_event(event, message_id)

            except Exception as e:
                logger.error(f"Consumer error: {e}")
                await asyncio.sleep(5)

    async def process_event(self, event: dict, message_id: bytes):
        try:
            if event["event_type"] == "new_email":
                await self.handle_new_email(event["payload"])

            # 성공 시 ACK
            await self.redis.xack(self.stream, self.group, message_id)

        except Exception as e:
            logger.error(f"Event processing failed: {e}")
            # 실패 시 NACK - 재처리 대기
            # DLQ (Dead Letter Queue) 로직은 여기에 추가
```

## 5. Dead Letter Queue (DLQ)

재처리 실패한 메시지를 별도 Stream으로 이동:

```
Stream: email-events-dlq
├─ original_stream: email-events
├─ original_id: 1234567890-0
├─ error_message: "AI provider timeout"
├─ retry_count: 3
├─ failed_at: 2026-04-15T09:35:00Z
└─ payload: { ... }
```

### DLQ 처리 정책

| 재시도 횟수 | 지연 시간 | 처리 |
|------------|----------|------|
| 1 | 30초 후 | 자동 재시도 |
| 2 | 5분 후 | 자동 재시도 |
| 3 | 30분 후 | DLQ 이동, 알림 발송 |

## 6. 이벤트 스키마

### 6.1 `new_email`

```json
{
  "event_type": "new_email",
  "version": "1.0",
  "timestamp": "2026-04-15T09:30:00Z",
  "trace_id": "uuid",
  "payload": {
    "mailbox_id": "uuid",
    "email_id": "uuid",
    "sender": "client@example.com",
    "sender_name": "김철수",
    "subject": "견적 문의",
    "thread_id": "uuid",
    "has_attachments": true,
    "priority": "normal"
  }
}
```

### 6.2 `draft_created`

```json
{
  "event_type": "draft_created",
  "version": "1.0",
  "timestamp": "2026-04-15T09:32:00Z",
  "trace_id": "uuid",
  "payload": {
    "mailbox_id": "uuid",
    "draft_id": "uuid",
    "original_email_id": "uuid",
    "thread_id": "uuid",
    "ai_provider": "openai",
    "ai_model": "gpt-4o",
    "processing_time_ms": 2500
  }
}
```

### 6.3 `email_sent`

```json
{
  "event_type": "email_sent",
  "version": "1.0",
  "timestamp": "2026-04-15T10:00:00Z",
  "trace_id": "uuid",
  "payload": {
    "mailbox_id": "uuid",
    "email_id": "uuid",
    "recipient": "client@example.com",
    "subject": "Re: 견적 문의",
    "smtp_provider": "aws-ses",
    "message_id": "<smtp-msg-id>",
    "status": "delivered"
  }
}
```

## 7. 모니터링

### 7.1 Queue Metrics

| 메트릭 | 설명 |
|--------|------|
| `queue_length` | Stream 내 대기 중인 메시지 수 |
| `consumer_lag` | 각 Consumer Group의 처리 지연 |
| `processing_time` | 메시지 처리 소요 시간 |
| `dlq_count` | DLQ로 이동된 메시지 수 |
| `retry_count` | 재시도 발생 횟수 |

### 7.2 Prometheus Exporter

```python
from prometheus_client import Gauge, Histogram

queue_length = Gauge('redis_stream_length', 'Stream length', ['stream'])
consumer_lag = Gauge('redis_consumer_lag', 'Consumer lag', ['stream', 'group'])
processing_time = Histogram('event_processing_seconds', 'Event processing time', ['event_type'])
```
