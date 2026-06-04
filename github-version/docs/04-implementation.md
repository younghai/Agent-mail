# 04-Implementation — Agent Mail (v1-present)

## 구현 현황

| 모듈 | 상태 | 파일 | 비고 |
|------|------|------|------|
| Mail Server API | ✅ 완료 | `mail-server/src/index.js` (928줄) | 모든 REST 엔드포인트 구현 |
| DB 연결 | ✅ 완료 | `mail-server/src/db.js` | pg.Pool, 마이그레이션 지원 |
| Redis Pub | ✅ 완료 | `mail-server/src/redis.js` | Stream 발행 |
| MinIO 연동 | ✅ 완료 | `mail-server/src/storage.js` | presigned URL 1시간 |
| AI Agent API | ✅ 완료 | `ai-agent/main.py` (395줄) | FastAPI, SSE, Redis 소비자 |
| DB 스키마 | ✅ 완료 | `mail-server/migrations/001_initial.sql` | 14개 테이블, 인덱스, 트리거 |
| Docker 이미지 | ✅ 완료 | `mail-server/Dockerfile`, `ai-agent/Dockerfile` | Alpine 기반, 비루트 사용자 |
| Seed 데이터 | ✅ 완료 | `mail-server/src/seed.js` | 7개 샘플 이메일 |
| 단위 테스트 | 🔶 부분 | `ai-agent/tests/test_utils.py` | 일부 유틸리티만 테스트 |
| 통합 테스트 | ❌ 없음 | — | E2E 테스트 미작성 |

## 코드 구조

```
v1-present/
├── docker-compose.yml          # 5서비스 오케스트레이션
├── .env.example                # 환경변수 템플릿
├── README.md                   # 독립 실행 가이드
├── mail-server/
│   ├── Dockerfile              # node:22-alpine
│   ├── package.json            # Express, pg, ioredis, minio, multer
│   ├── src/
│   │   ├── index.js            # Express 앱 & 라우트
│   │   ├── db.js               # PostgreSQL pool
│   │   ├── redis.js            # Redis publisher
│   │   ├── storage.js          # MinIO client
│   │   └── seed.js             # 더미 데이터
│   └── migrations/
│       └── 001_initial.sql     # 초기 스키마
└── ai-agent/
    ├── Dockerfile              # python:3.12-slim
    ├── requirements.txt        # fastapi, uvicorn, openai, asyncpg, redis
    ├── main.py                 # FastAPI 앱
    └── tests/
        └── test_utils.py       # 유틸리티 테스트
```

## 환경 설정

```bash
cd v1-present
cp .env.example .env
# 필수: OPENAI_API_KEY, POSTGRES_PASSWORD, LOCAL_SERVICE_TOKEN
docker compose up --build -d
```

## 의존성 버전

| 패키지 | 버전 | 용도 |
|--------|------|------|
| express | ^4.19.2 | HTTP 서버 |
| pg | ^8.11.5 | PostgreSQL 드라이버 |
| ioredis | ^5.3.2 | Redis 클라이언트 |
| minio | ^8.0.0 | S3/MinIO 클라이언트 |
| multer | ^1.4.5-lts.1 | multipart 업로드 |
| fastapi | 0.111.0 | Python API 프레임워크 |
| uvicorn | 0.30.0 | ASGI 서버 |
| openai | 1.30.0 | OpenAI SDK |
| asyncpg | 0.29.0 | 비동기 PostgreSQL |
