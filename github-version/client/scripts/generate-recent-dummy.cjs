// Generate dummy emails for May 10 ~ May 21, 2026
// Threads 16~21 (continues from existing sam-10~15)
const fs = require('fs');
const { execSync } = require('child_process');

const DB_FILE = '.wrangler/state/v3/do/agentic-inbox-MailboxDO/60e6c0a6f9d8fb8a9a1727f5a2edd35bf7945a97c3904a605d6f648f5861d9f9.sqlite';

const products = [
  '갤럭시 S25 Edge', '삼성 Neo QLED 8K TV', '갤럭시 링', '비스포크 AI 청소기',
  '갤럭시 버즈3 Pro', '삼성 Odyssey OLED G9', '갤럭시 탭 S10 FE', '비스포크 에어드레서'
];

const campaignTypes = [
  'Landing Page Banner', 'YouTube Pre-roll Banner', 'SNS 광고 배너',
  'Mobile App Push', 'Email Newsletter Banner', '카카오톡 비즈 배너',
  'Web Push Notification', 'Popup Banner'
];

const senders = [
  { name: '오지민', email: 'jimin.oh@samsung.com', dept: '디지털마케팅팀' },
  { name: '윤하준', email: 'hajun.yoon@samsung.com', dept: '브랜드마케팅팀' },
  { name: '신채원', email: 'chaewon.shin@samsung.com', dept: '글로벌캠페인팀' },
  { name: '임서준', email: 'seojun.lim@samsung.com', dept: '온라인세일즈팀' },
  { name: '한지우', email: 'jiwoo.han@samsung.com', dept: '퍼포먼스마케팅팀' },
  { name: '백수빈', email: 'subeen.baek@samsung.com', dept: '프로덕트마케팅팀' },
];

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''").replace(/\n/g, '\\n') + "'";
}

function generateThread(threadIdx, product, campaign, sender) {
  const emails = [];
  const threadId = `thread-samsung-${threadIdx}`;
  // Start from May 10, each thread 2 days apart
  const baseDate = new Date('2026-05-10T09:00:00Z');
  baseDate.setDate(baseDate.getDate() + (threadIdx - 16) * 2);

  // Email 1: Initial request (INBOX)
  const e1Id = `sam-${threadIdx}-e1`;
  const e1MsgId = `msg-sam-${threadIdx}-e1`;
  const e1Date = new Date(baseDate);
  e1Date.setHours(9, 0, 0, 0);

  const e1Body = `<html><body>
<p>비즈매트릭스 팀, 안녕하세요.</p>
<p><strong>${product}</strong> 신제품 런칭을 위한 <strong>${campaign}</strong> 디자인 및 개발을 요청드립니다.</p>
<h3>요청 사항:</h3>
<ul>
<li>메인 비주얼: 제품 이미지 중심의 클린한 디자인</li>
<li>카피: "${product} — 혁신을 일상으로"</li>
<li>CTA 버튼: "지금 구매하기" / "자세히 보기"</li>
<li>반응형 대응 (PC/Mobile/Tablet)</li>
</ul>
<p>런칭 일정: <strong>6월 1일</strong></p>
<p>1차 시안은 <strong>${e1Date.toISOString().slice(0, 10)} 이후 3영업일</strong> 내로 부탁드립니다.</p>
<p>감사합니다.<br>${sender.name} 드림<br>삼성전자 ${sender.dept}</p>
</body></html>`;

  emails.push({
    id: e1Id, folder: 'inbox', subject: `[요청] ${product} ${campaign} 디자인 의뢰`,
    sender: sender.email, recipient: 'bzengage@example.com', date: e1Date.toISOString(),
    read: threadIdx % 2, starred: 0, body: e1Body, in_reply_to: null, references: null,
    thread_id: threadId, message_id: e1MsgId,
    headers: JSON.stringify([
      { key: 'from', value: `${sender.name} <${sender.email}>` },
      { key: 'to', value: 'bzengage@example.com' },
      { key: 'subject', value: `[요청] ${product} ${campaign} 디자인 의뢰` },
      { key: 'date', value: e1Date.toISOString() },
      { key: 'message-id', value: `<${e1MsgId}>` },
    ])
  });

  // Email 2: 1st draft reply (SENT)
  const e2Id = `sam-${threadIdx}-e2`;
  const e2MsgId = `msg-sam-${threadIdx}-e2`;
  const e2Date = new Date(e1Date);
  e2Date.setDate(e2Date.getDate() + 2);
  e2Date.setHours(14, 30, 0, 0);

  const e2Body = `<html><body>
<p>${sender.name} 님, 안녕하세요.</p>
<p><strong>${product}</strong> ${campaign} 1차 시안을 준비했습니다.</p>
<h3>시안 개요:</h3>
<ul>
<li>메인 비주얼: 제품 3D 렌더링 이미지 + 그라데이션 배경</li>
<li>카피 적용 완료</li>
<li>PC/Mobile 반응형 레이아웃 적용</li>
</ul>
<p>첨부 파일에서 시안을 확인해 주시고, 피드백 부탁드립니다.</p>
<p>감사합니다.<br>비즈매트릭스 팀</p>
</body></html>`;

  emails.push({
    id: e2Id, folder: 'sent', subject: `Re: [요청] ${product} ${campaign} 디자인 의뢰`,
    sender: 'bzengage@example.com', recipient: sender.email, date: e2Date.toISOString(),
    read: 1, starred: 0, body: e2Body, in_reply_to: e1MsgId, references: JSON.stringify([e1MsgId]),
    thread_id: threadId, message_id: e2MsgId,
    headers: JSON.stringify([
      { key: 'from', value: `비즈매트릭스 <bzengage@example.com>` },
      { key: 'to', value: sender.email },
      { key: 'subject', value: `Re: [요청] ${product} ${campaign} 디자인 의뢰` },
      { key: 'date', value: e2Date.toISOString() },
      { key: 'message-id', value: `<${e2MsgId}>` },
      { key: 'in-reply-to', value: `<${e1MsgId}>` },
      { key: 'references', value: `<${e1MsgId}>` },
    ])
  });

  // Only add reply emails if the thread has had enough time (e2Date < today)
  const today = new Date('2026-05-21T23:59:59Z');
  if (e2Date > today) return emails;

  // Email 3: Revision request (INBOX)
  const e3Id = `sam-${threadIdx}-e3`;
  const e3MsgId = `msg-sam-${threadIdx}-e3`;
  const e3Date = new Date(e2Date);
  e3Date.setDate(e3Date.getDate() + 1);
  e3Date.setHours(10, 15, 0, 0);

  if (e3Date > today) return emails;

  const e3Body = `<html><body>
<p>비즈매트릭스 팀, 안녕하세요.</p>
<p>1차 시안 확인했습니다. 전반적으로 좋습니다만, <strong>아래 수정 사항</strong>을 반영 부탁드립니다.</p>
<h3>수정 요청 사항:</h3>
<ol>
<li>메인 비주얼 배경색을 <strong>삼성 네이비</strong> 톤으로 변경</li>
<li>CTA 버튼 색상을 삼성 브랜드 컬러(#1428A0)로 조정</li>
<li>모바일 버전에서 폰트 사이즈 1pt 업</li>
<li>하단에 <strong>"사양 자세히 보기"</strong> 링크 추가</li>
</ol>
<p>수정본은 <strong>${e3Date.toISOString().slice(0, 10)} 이후 2영업일</strong> 내로 부탁드립니다.</p>
<p>감사합니다.<br>${sender.name} 드림</p>
</body></html>`;

  emails.push({
    id: e3Id, folder: 'inbox', subject: `Re: [요청] ${product} ${campaign} 디자인 의뢰 - 수정 요청`,
    sender: sender.email, recipient: 'bzengage@example.com', date: e3Date.toISOString(),
    read: threadIdx % 3 === 0 ? 0 : 1, starred: threadIdx % 3 === 0 ? 1 : 0,
    body: e3Body, in_reply_to: e2MsgId, references: JSON.stringify([e1MsgId, e2MsgId]),
    thread_id: threadId, message_id: e3MsgId,
    headers: JSON.stringify([
      { key: 'from', value: `${sender.name} <${sender.email}>` },
      { key: 'to', value: 'bzengage@example.com' },
      { key: 'subject', value: `Re: [요청] ${product} ${campaign} 디자인 의뢰 - 수정 요청` },
      { key: 'date', value: e3Date.toISOString() },
      { key: 'message-id', value: `<${e3MsgId}>` },
      { key: 'in-reply-to', value: `<${e2MsgId}>` },
      { key: 'references', value: `<${e1MsgId}> <${e2MsgId}>` },
    ])
  });

  // Email 4: 2nd draft (SENT) — only if time allows
  const e4Id = `sam-${threadIdx}-e4`;
  const e4MsgId = `msg-sam-${threadIdx}-e4`;
  const e4Date = new Date(e3Date);
  e4Date.setDate(e4Date.getDate() + 2);
  e4Date.setHours(16, 0, 0, 0);

  if (e4Date > today) return emails;

  const e4Body = `<html><body>
<p>${sender.name} 님, 안녕하세요.</p>
<p>요청하신 수정 사항을 모두 반영한 <strong>2차 시안</strong>을 준비했습니다.</p>
<h3>반영 내용:</h3>
<ul>
<li>배경색 → 삼성 네이비 그라데이션 적용 완료</li>
<li>CTA 버튼 색상 → 삼성 블루 #1428A0 적용</li>
<li>모바일 폰트 사이즈 1pt 증가 완료</li>
<li>"사양 자세히 보기" 링크 하단 추가 완료</li>
</ul>
<p>검토 부탁드립니다.</p>
<p>감사합니다.<br>비즈매트릭스 팀</p>
</body></html>`;

  emails.push({
    id: e4Id, folder: 'sent', subject: `Re: [요청] ${product} ${campaign} 디자인 의뢰 - 2차 시안`,
    sender: 'bzengage@example.com', recipient: sender.email, date: e4Date.toISOString(),
    read: 1, starred: 0, body: e4Body, in_reply_to: e3MsgId,
    references: JSON.stringify([e1MsgId, e2MsgId, e3MsgId]),
    thread_id: threadId, message_id: e4MsgId,
    headers: JSON.stringify([
      { key: 'from', value: `비즈매트릭스 <bzengage@example.com>` },
      { key: 'to', value: sender.email },
      { key: 'subject', value: `Re: [요청] ${product} ${campaign} 디자인 의뢰 - 2차 시안` },
      { key: 'date', value: e4Date.toISOString() },
      { key: 'message-id', value: `<${e4MsgId}>` },
      { key: 'in-reply-to', value: `<${e3MsgId}>` },
      { key: 'references', value: `<${e1MsgId}> <${e2MsgId}> <${e3MsgId}>` },
    ])
  });

  // Email 5: Final confirm or extra revision — only for even threads
  const e5Id = `sam-${threadIdx}-e5`;
  const e5MsgId = `msg-sam-${threadIdx}-e5`;
  const e5Date = new Date(e4Date);
  e5Date.setDate(e5Date.getDate() + 1);
  e5Date.setHours(11, 0, 0, 0);

  if (e5Date > today) return emails;

  const isFinal = threadIdx % 2 === 0;
  const e5Body = isFinal
    ? `<html><body>
<p>비즈매트릭스 팀, 안녕하세요.</p>
<p>2차 시안 확인했습니다. <strong>디자인 컨펌</strong>합니다.</p>
<ul>
<li>최종 파일 형식: PSD, AI, HTML</li>
<li>배너 사이즈: 1920x600 (PC), 768x400 (Mobile)</li>
<li>최종 파일은 <strong>5월 30일</strong>까지 전달 부탁드립니다.</li>
</ul>
<p>감사합니다.<br>${sender.name} 드림</p>
</body></html>`
    : `<html><body>
<p>비즈매트릭스 팀, 안녕하세요.</p>
<p>2차 시안 확인했습니다. <strong>추가 수정</strong>이 필요합니다.</p>
<ol>
<li>상단 헤더에 <strong>"NEW"</strong> 뱃지 추가</li>
<li>가격 정보 노출 ("출시가 1,099,000원부터")</li>
<li>삼성 로고 위치 좌측 하단으로 조정</li>
</ol>
<p>감사합니다.<br>${sender.name} 드림</p>
</body></html>`;

  emails.push({
    id: e5Id, folder: 'inbox',
    subject: isFinal
      ? `Re: [요청] ${product} ${campaign} 디자인 의뢰 - 컨펌`
      : `Re: [요청] ${product} ${campaign} 디자인 의뢰 - 추가 수정`,
    sender: sender.email, recipient: 'bzengage@example.com', date: e5Date.toISOString(),
    read: 0, starred: isFinal ? 1 : 0, body: e5Body, in_reply_to: e4MsgId,
    references: JSON.stringify([e1MsgId, e2MsgId, e3MsgId, e4MsgId]),
    thread_id: threadId, message_id: e5MsgId,
    headers: JSON.stringify([
      { key: 'from', value: `${sender.name} <${sender.email}>` },
      { key: 'to', value: 'bzengage@example.com' },
      { key: 'subject', value: isFinal
        ? `Re: [요청] ${product} ${campaign} 디자인 의뢰 - 컨펌`
        : `Re: [요청] ${product} ${campaign} 디자인 의뢰 - 추가 수정` },
      { key: 'date', value: e5Date.toISOString() },
      { key: 'message-id', value: `<${e5MsgId}>` },
      { key: 'in-reply-to', value: `<${e4MsgId}>` },
      { key: 'references', value: `<${e1MsgId}> <${e2MsgId}> <${e3MsgId}> <${e4MsgId}>` },
    ])
  });

  return emails;
}

// Generate threads 16~21 (May 10 ~ May 20, 2 days apart each)
let allEmails = [];
for (let i = 0; i < 6; i++) {
  const threadIdx = 16 + i;
  const product = products[i % products.length];
  const campaign = campaignTypes[i % campaignTypes.length];
  const sender = senders[i % senders.length];
  const threadEmails = generateThread(threadIdx, product, campaign, sender);
  allEmails = allEmails.concat(threadEmails);
}

// Add 3 standalone recent emails (newsletter, urgent notice, new inquiry)
const standaloneEmails = [
  {
    id: 'recent-s1', folder: 'inbox',
    subject: '[공지] 삼성전자 2026 상반기 디지털 마케팅 가이드라인 업데이트',
    sender: 'notice@samsung.com', recipient: 'bzengage@example.com',
    date: '2026-05-12T09:00:00.000Z', read: 0, starred: 1,
    body: `<html><body>
<h2>📋 2026 상반기 가이드라인 업데이트 안내</h2>
<p>비즈매트릭스 팀, 안녕하세요.</p>
<p>삼성전자 디지털 마케팅 가이드라인이 업데이트되었습니다.</p>
<ul>
<li>브랜드 컬러 팔레트 2026 버전 적용</li>
<li>Galaxy AI 관련 비주얼 가이드 신규 추가</li>
<li>모바일 퍼스트 레이아웃 원칙 강화</li>
</ul>
<p>첨부 PDF를 확인해 주시기 바랍니다.</p>
<p>삼성전자 브랜드마케팅팀 드림</p>
</body></html>`,
    in_reply_to: null, references: null,
    thread_id: 'recent-s1', message_id: 'msg-recent-s1',
    headers: JSON.stringify([
      { key: 'from', value: '삼성전자 <notice@samsung.com>' },
      { key: 'to', value: 'bzengage@example.com' },
      { key: 'subject', value: '[공지] 삼성전자 2026 상반기 디지털 마케팅 가이드라인 업데이트' },
      { key: 'date', value: '2026-05-12T09:00:00.000Z' },
      { key: 'message-id', value: '<msg-recent-s1>' },
    ])
  },
  {
    id: 'recent-s2', folder: 'inbox',
    subject: '[긴급] 갤럭시 S25 Edge 런칭 일정 앞당김 — 즉시 확인 요청',
    sender: 'jimin.oh@samsung.com', recipient: 'bzengage@example.com',
    date: '2026-05-16T08:00:00.000Z', read: 0, starred: 1,
    body: `<html><body>
<p>비즈매트릭스 팀, 안녕하세요. 오지민 입니다.</p>
<p><strong>긴급 공지</strong>드립니다.</p>
<p>갤럭시 S25 Edge 글로벌 런칭 일정이 <strong>6월 15일 → 5월 29일</strong>로 앞당겨졌습니다.</p>
<table border="1" cellpadding="6">
<tr><th>배너 종류</th><th>기존 마감</th><th>변경 마감</th></tr>
<tr><td>홈페이지 메인</td><td>6월 5일</td><td>5월 22일</td></tr>
<tr><td>모바일 앱 푸시</td><td>6월 8일</td><td>5월 24일</td></tr>
<tr><td>이메일 뉴스레터</td><td>6월 10일</td><td>5월 26일</td></tr>
</table>
<p>일정 조율 가능 여부를 <strong>오늘 중</strong>으로 회신 부탁드립니다.</p>
<p>감사합니다.<br>오지민 드림</p>
</body></html>`,
    in_reply_to: null, references: null,
    thread_id: 'recent-s2', message_id: 'msg-recent-s2',
    headers: JSON.stringify([
      { key: 'from', value: '오지민 <jimin.oh@samsung.com>' },
      { key: 'to', value: 'bzengage@example.com' },
      { key: 'subject', value: '[긴급] 갤럭시 S25 Edge 런칭 일정 앞당김 — 즉시 확인 요청' },
      { key: 'date', value: '2026-05-16T08:00:00.000Z' },
      { key: 'message-id', value: '<msg-recent-s2>' },
    ])
  },
  {
    id: 'recent-s3', folder: 'inbox',
    subject: '[신규 의뢰] 갤럭시 링 SNS 캠페인 배너 제작 요청',
    sender: 'subeen.baek@samsung.com', recipient: 'bzengage@example.com',
    date: '2026-05-20T10:30:00.000Z', read: 0, starred: 0,
    body: `<html><body>
<p>비즈매트릭스 팀, 안녕하세요. 삼성전자 프로덕트마케팅팀 백수빈입니다.</p>
<p><strong>갤럭시 링</strong> 신제품 출시에 맞춰 SNS 캠페인 배너 제작을 의뢰드립니다.</p>
<h3>요청 상세:</h3>
<ul>
<li>채널: Instagram, Facebook, X(트위터)</li>
<li>사이즈: 1:1 (1080x1080), 4:5 (1080x1350), 16:9 (1920x1080)</li>
<li>콘셉트: "건강한 일상, 갤럭시 링과 함께"</li>
<li>희망 납기: <strong>5월 27일</strong></li>
</ul>
<p>견적 및 일정 확인 후 회신 부탁드립니다.</p>
<p>감사합니다.<br>백수빈 드림<br>삼성전자 프로덕트마케팅팀</p>
</body></html>`,
    in_reply_to: null, references: null,
    thread_id: 'recent-s3', message_id: 'msg-recent-s3',
    headers: JSON.stringify([
      { key: 'from', value: '백수빈 <subeen.baek@samsung.com>' },
      { key: 'to', value: 'bzengage@example.com' },
      { key: 'subject', value: '[신규 의뢰] 갤럭시 링 SNS 캠페인 배너 제작 요청' },
      { key: 'date', value: '2026-05-20T10:30:00.000Z' },
      { key: 'message-id', value: '<msg-recent-s3>' },
    ])
  },
];

allEmails = allEmails.concat(standaloneEmails);

// Build SQL INSERT statements
let sql = '';
allEmails.forEach(e => {
  sql += `INSERT OR IGNORE INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES\n`;
  sql += `(${escapeSql(e.id)}, ${escapeSql(e.folder)}, ${escapeSql(e.subject)}, ${escapeSql(e.sender)}, ${escapeSql(e.recipient)}, ${escapeSql(e.date)}, ${e.read}, ${e.starred}, ${escapeSql(e.body)}, ${e.in_reply_to ? escapeSql(e.in_reply_to) : 'NULL'}, ${e.references ? escapeSql(e.references) : 'NULL'}, ${escapeSql(e.thread_id)}, ${escapeSql(e.message_id)}, ${escapeSql(e.headers)}, NULL, NULL);\n`;
});

const sqlFile = 'scripts/recent-dummy-data.sql';
fs.writeFileSync(sqlFile, sql, 'utf8');
console.log(`Generated ${allEmails.length} emails → ${sqlFile}`);

// Apply to SQLite DB
try {
  execSync(`sqlite3 "${DB_FILE}" < "${sqlFile}"`, { stdio: 'inherit' });
  console.log('✅ Applied to DB successfully');
} catch (err) {
  console.error('❌ DB apply failed:', err.message);
  process.exit(1);
}

// Restart workerd so the Durable Object reloads from the updated SQLite file.
// Direct SQLite writes are not visible to a running workerd DO until it restarts.
try {
  const result = execSync(
    `pgrep -f 'workerd.*agent-inbox' 2>/dev/null || true`,
    { encoding: 'utf8' }
  ).trim();
  if (result) {
    const pids = result.split('\n').filter(Boolean);
    for (const pid of pids) {
      try {
        execSync(`kill -HUP ${pid}`, { stdio: 'ignore' });
      } catch { /* already gone */ }
    }
    console.log(`🔄 Sent HUP to workerd (PID ${pids.join(', ')}) — DO will reload from SQLite`);
  } else {
    console.log('ℹ️  No workerd process found — start the dev server to see new emails');
  }
} catch (err) {
  console.warn('⚠️  Could not restart workerd:', err.message);
}
