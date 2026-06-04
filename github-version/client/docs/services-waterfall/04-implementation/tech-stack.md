# 4.2 기술 스택 (Tech Stack)

> 워터폴 4단계 구현 — 각 레이어별 기술 선정 사유와 버전 정보를 다룬다.

---

## 4.2.1 전체 스택 개요

| 레이어 | 기술 | 버전 | 선정 사유 |
|--------|------|------|-----------|
| **Frontend** | React + Vite | 18.x / 5.x | v0 그대로 사용, 번들링 속도 |
| **Styling** | Tailwind CSS + shadcn/ui | 3.x | v0 그대로 사용, 빠른 UI 개발 |
| **Mail Server** | Node.js + Express | 22.x / 4.x | 팀 낶부 Node.js 친숙도, v0 API 복제 용이 |
| **AI Agent** | Python + FastAPI | 3.9+ / 0.111 | Python AI 생태계, SSE 스트리밍, 타입 힌트 |
| **Database** | PostgreSQL | 16 | Full-Text Search, JSONB, 안정성 |
| **AI Provider** | OpenAI API | gpt-4o-mini | 비용 효율, 빠른 응답, API 안정성 |
| **Container** | Docker | 24.x | 일관된 배포, 로컬 개발 편의 |
| **ORM/DB** | pg (node-postgres) | 8.x | 가벼움, raw SQL 가능 |
| | psycopg2-binary | 2.9.9 | Python 표준 PostgreSQL 드라이버 |

---

## 4.2.2 Frontend (React + Vite)

### 의존성 (package.json 주요 항목)

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@tanstack/react-router": "^1.31.0",
    "zustand": "^4.5.0",
    "axios": "^1.7.0",
    "lucide-react": "^0.373.0"
  },
  "devDependencies": {
    "vite": "^5.2.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0"
  }
}
```

### Vite Proxy 설정 (v1 개발용)

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': { target: 'http://localhost:8080', changeOrigin: true },
    '/agents': { target: 'http://localhost:8000', changeOrigin: true }
  }
}
```

---

## 4.2.3 Mail Server (Node.js/Express)

### 의존성 (package.json)

```json
{
  "dependencies": {
    "express": "^4.19.2",
    "cors": "^2.8.5",
    "pg": "^8.11.5",
    "dotenv": "^16.4.5"
  }
}
```

### 왜 Express인가?

| 대안 | 평가 | 결론 |
|------|------|------|
| Fastify | 속도가 빠름, TypeScript 지원 | 팀 학습 곡선, v0 API 복제 시 차이 큼 |
| NestJS | 구조적, 장기 유지보수 유리 | MVP 과다설계 |
| Hono | 경량, Cloudflare 호환 | v0와의 일관성 부족 |
| **Express** | 팀 친숙, 미들웨어 풍부, v0 API 복제 용이 | **선택** |

---

## 4.2.4 AI Agent (Python/FastAPI)

### 의존성 (requirements.txt)

```
fastapi==0.111.0
uvicorn[standard]==0.30.0
openai==1.30.0
psycopg2-binary==2.9.9
pydantic==2.7.0
python-dotenv==1.0.1
```

### 왜 FastAPI인가?

| 대안 | 평가 | 결론 |
|------|------|------|
| Flask | 단순, 익숙 | 비동기 미지원, SSE 어려움 |
| Django | 풀스택 | 과다설계 |
| Tornado | 비동기 | 레거시, 커뮤니티 축소 |
| **FastAPI** | 자동 OpenAPI 문서, 타입 힌트, SSE/비동기 내장 | **선택** |

---

## 4.2.5 PostgreSQL

### 왜 PostgreSQL인가?

| 기능 | SQLite (v0) | PostgreSQL (v1) | 비고 |
|------|-------------|-----------------|------|
| Full-Text Search | FTS5 (제한적) | `tsvector` + GIN (강력) | 검색 품질 향상 |
| 동시성 | 파일 락 | MVCC (고성능) | 다중 사용자 지원 |
| 확장성 | 단일 파일 | 수평 확장 가능 | 향후 확장 |
| JSONB | 지원 | 지원 | 비정형 데이터 저장 |
| 복제 | 미지원 | Streaming Replication | 고가용성 |

---

## 4.2.6 AI Provider: OpenAI

### 왜 OpenAI인가?

| 대안 | 평가 | 결론 |
|------|------|------|
| Anthropic Claude | 긴 컨텍스트, 안전성 | 가격 높음 |
| Google Gemini | 무료 할당량 | API 안정성 이슈 |
| Local LLM (Ollama) | 프라이버시 | 하드웨어 요구, 속도 느림 |
| Cloudflare Workers AI (v0) | 무료, 서버리스 | 모델 한정, 제어 부족 |
| **OpenAI** | API 안정성, 비용 효율(gpt-4o-mini), 팀 익숙 | **선택** |

### 모델 선택

| 모델 | 용도 | 비용 (1000 토큰) |
|------|------|-----------------|
| `gpt-4o-mini` | Draft 생성, 채팅 | $0.15 / $0.60 |
| `gpt-4o` | 복잡한 분석 (향후) | $5.00 / $15.00 |
| `text-embedding-3-small` | 의미 검색 (향후) | $0.02 |
