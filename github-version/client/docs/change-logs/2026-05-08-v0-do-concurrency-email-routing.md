# Track F — M3: DO 동시성 + Email Routing 통합 테스트

**날짜**: 2026-05-08
**결과**: 127 tests pass (기존 101 + 신규 26)

---

## Part A — DO 동시성 helper 분리

### 배경

`MailboxDO`의 mutating 메서드(`updateEmail`, `moveEmail`, `markThreadRead`)는
Cloudflare Worker 런타임(SQLite WAL, `ctx.storage`) 에 직접 의존하므로 표준
Node.js `node:test` 환경에서 instantiate 불가.

기존 코드에 동시성 가드 로직이 inline으로 존재하지 않았으므로 **신규 pure-logic
helper 모듈**을 작성. DO 내부의 미래 리팩터 시 이 helpers를 참조해 동일 불변식을
적용하도록 의도된 additive 추가다.

### 신규 파일

**`workers/lib/mailbox/operations.ts`**

| 함수 | 설명 |
|---|---|
| `applyMarkRead(currentRead, requested)` | markRead 호출이 실제 상태 변경을 필요로 하는지 판단. 같은 값 → `changed=false` (idempotent). |
| `resolveDraftConflict(existing, incoming)` | draft 저장 충돌 해소. `null` → `'create'`; incoming이 더 새로우면 → `'replace'`; stale write → `'reject'`. |
| `isValidFolderTransition(from, to)` | 폴더 이동 유효성. 같은 폴더 → `false`; trash에서 non-trash로 이동 → `false` (복원은 별도 API). |

### 테스트 파일

**`tests/do-concurrency.test.ts`** — 17 tests

동시성 시나리오 매트릭스:

| 시나리오 | 커버 |
|---|---|
| 이미 read인 이메일에 markRead=true | idempotent (changed=false) |
| 이미 unread인 이메일에 markRead=false | idempotent |
| unread → read | changed=true |
| read → unread | changed=true |
| 순차 동시 markRead (같은 대상, 모두 true) | 첫 번째만 changed, 이후는 no-op |
| 순차 동시 markRead (mixed read/unread) | last-write-wins |
| Promise.all markRead simulation | 모든 결과 구조 유효, trueCount ≥ 1 |
| draft conflict: existing=null | 'create' |
| draft conflict: incoming newer | 'replace' |
| draft conflict: same timestamp | 'reject' |
| draft conflict: incoming older | 'reject' |
| folder: same folder | false |
| folder: inbox → sent | true |
| folder: inbox → trash | true |
| folder: trash → inbox | false (restore API 필요) |
| folder: trash → sent | false |
| folder: trash → trash | false |

---

## Part B — Email Routing processor 분리

### 배경

`workers/index.ts`의 `receiveEmail`은 다음 관심사를 하나로 결합:
- 허용 주소 필터링
- 우편함 존재 확인 (R2 head)
- PostalMime 파싱
- 첨부 파일 R2 저장
- 스레드 resolution
- DO `createEmail` 호출
- `ctx.waitUntil` agent trigger

실제 함수를 분리하면 기존 동작이 변경될 위험이 있으므로, **순수 의존성-주입형
standalone processor**를 신규 작성. 실제 `receiveEmail`과의 통합은 후속 작업.

### R2 → DO 호출 순서

```
드레인 스트림 → ArrayBuffer
→ parseRawEmail (messageId 추출)
→ r2Put (raw bytes 저장)          ← R2 실패 시 여기서 throw; DO 미호출
→ mailboxStub.saveIncomingEmail   ← R2 성공 후에만 호출
→ return { stored, mailboxId, rawKey }
```

R2가 실패하면 DO는 절대 호출되지 않는다 (순서 보장).
parseRawEmail이 실패하면 R2도 DO도 호출되지 않는다.

### 에러 전파 정책

| 실패 지점 | r2Put 호출 | DO 호출 | 동작 |
|---|---|---|---|
| parseRawEmail throw | 0회 | 0회 | 즉시 throw |
| r2Put throw | 1회 (실패) | 0회 | 즉시 throw |
| saveIncomingEmail throw | 1회 (성공) | 1회 (실패) | throw 전파 |

### 테스트 파일

**`tests/email-routing.test.ts`** — 8 tests

| 테스트 | 검증 내용 |
|---|---|
| processes simple email | R2 1회 + DO 1회, stored=true |
| extracts mailbox ID | to 주소의 로컬 파트만 추출 |
| rawKey contains messageId | parseRawEmail 반환 값이 키에 포함 |
| handles empty body | 0바이트 저장, DO 여전히 호출 |
| handles large body (chunked) | 512-byte 청크로 분할된 10,000바이트 전체 조립 |
| propagates R2 failure | throw 전파, DO 호출 0 |
| propagates parse failure | throw 전파, R2 0 + DO 0 |
| idempotent same messageId | 동일 messageId → 동일 rawKey |
| DO fields correct | from/to/rawKey 필드 검증 |

---

## 한계 및 주의사항

1. **실 Cloudflare Worker 환경의 SQLite WAL 동시성은 미검증**.
   Cloudflare DO는 JavaScript 단일 스레드 + SQLite WAL을 사용하므로 실제로는
   요청이 직렬화된다. 본 테스트는 비즈니스 로직 불변식만 검증하며, 실제 WAL
   isolation level 동작은 `vitest pool=workers` 환경에서 별도 검증 필요.

2. **helpers는 additive** — 현재 `MailboxDO` 메서드나 `receiveEmail`에 wiring
   되어 있지 않다. 이 모듈들은 문서화 및 미래 리팩터 가이드 역할.

3. **Part B processor는 단순화된 파이프라인** — 허용 주소 필터링, 첨부 파일
   개별 저장, 스레드 resolution, agent trigger는 포함되지 않음.

---

## 다음 후보

- `vitest pool=workers`로 실 DO 환경 테스트 (Miniflare 기반)
- `MailboxDO.updateEmail`에 `applyMarkRead` 가드 wiring
- `processIncomingEmail`을 `receiveEmail` 내부 서브루틴으로 통합
- draft 저장 경로에 `resolveDraftConflict` 적용
