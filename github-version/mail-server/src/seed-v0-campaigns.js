import { query } from './db.js';

const MAILBOX_ID = '00000000-0000-0000-0000-000000000001';

const FOLDERS = {
  inbox: '964acdd0-0ec5-4904-920f-d6ede000e6b7',
  sent:  '2e440e9f-48ec-4260-aed3-54001e827d86',
  spam:  'b7d64a8b-8ae4-41e9-864e-e52863b7eef5',
};

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Deterministic UUID-format IDs
// General emails: a001XXXX-0000-0000-0000-00000000NNNN
// Samsung emails: cXXXXXXX-0000-0000-0000-00000000NNNN
// Attachments:    d000XXXX-0000-0000-0000-00000000NNNN

const E = (n) => `a0010000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const S = (campaign, n) => `c0${campaign}0000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const A = (n) => `d0010000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const SA = (n) => `d0020000-0000-0000-0000-${String(n).padStart(12, '0')}`;

const emails = [
  // ── THREAD 1: Website Redesign ─────────────────────────────────────
  { id: E(1),  folder: 'inbox', subject: '웹사이트 리디자인 견적 문의드립니다', sender: 'client@designcorp.com', recipient: 'bzengage@example.com', date: '2026-04-15T09:30:00.000Z', read: true,  starred: false, thread_id: 'thread-web-redesign', message_id: '<msg-e001>', in_reply_to: null, refs: null,
    body_html: '<html><body><p>안녕하세요,</p><p>저희 회사 홈페이지 리디자인을 검토 중입니다. <strong>견적과 일정</strong>을 문의드립니다.</p><p>주요 요구사항:</p><ul><li>반응형 디자인</li><li>콘텐츠 관리 시스템(CMS) 연동</li><li>SEO 최적화</li></ul><p>감사합니다.<br>김철수 드림<br>디자인코퍼레이션 마케팅팀</p></body></html>' },
  { id: E(2),  folder: 'sent',  subject: 'Re: 웹사이트 리디자인 견적 문의드립니다', sender: 'bzengage@example.com', recipient: 'client@designcorp.com', date: '2026-04-15T14:20:00.000Z', read: true,  starred: false, thread_id: 'thread-web-redesign', message_id: '<msg-e002>', in_reply_to: '<msg-e001>', refs: ['<msg-e001>'],
    body_html: '<html><body><p>김철수 님, 안녕하세요.</p><p>견적 문의 감사합니다. 몇 가지 추가 질문드립니다:</p><ol><li>예상 페이지 수가 어떻게 되실까요?</li><li>기존 콘텐츠 마이그레이션이 필요하신가요?</li><li>희망 런칭 일정이 있으신가요?</li></ol><p>답변 주시면 상세 견적서를 준비하겠습니다.</p><p>감사합니다.<br>비즈매트릭스 팀</p></body></html>' },
  { id: E(3),  folder: 'inbox', subject: 'Re: 웹사이트 리디자인 견적 문의드립니다', sender: 'client@designcorp.com', recipient: 'bzengage@example.com', date: '2026-04-16T08:45:00.000Z', read: true,  starred: false, thread_id: 'thread-web-redesign', message_id: '<msg-e003>', in_reply_to: '<msg-e002>', refs: ['<msg-e001>', '<msg-e002>'],
    body_html: '<html><body><p>안녕하세요,</p><ul><li>예상 페이지 수는 <strong>약 10페이지</strong> 정도입니다.</li><li>기존 블로그 콘텐츠 50여 개 마이그레이션 필요합니다.</li><li>희망 런칭은 6월 말까지입니다.</li></ul><p>감사합니다.<br>김철수 드림</p></body></html>' },
  { id: E(4),  folder: 'sent',  subject: 'Re: 웹사이트 리디자인 견적 문의드립니다', sender: 'bzengage@example.com', recipient: 'client@designcorp.com', date: '2026-04-16T16:00:00.000Z', read: true,  starred: true, thread_id: 'thread-web-redesign', message_id: '<msg-e004>', in_reply_to: '<msg-e003>', refs: ['<msg-e001>', '<msg-e002>', '<msg-e003>'],
    body_html: '<html><body><p>김철수 님, 안녕하세요.</p><p>확인 감사합니다. 요청하신 사항을 반영한 <strong>견적서를 첨부</strong>드립니다.</p><table border="1"><tr><th>항목</th><th>금액</th></tr><tr><td>디자인 (10페이지)</td><td>₩3,500,000</td></tr><tr><td>개발 (반응형+CMS)</td><td>₩4,500,000</td></tr><tr><td>콘텐츠 마이그레이션</td><td>₩1,000,000</td></tr><tr><td>합계</td><td><strong>₩9,000,000</strong></td></tr></table><p>감사합니다.<br>비즈매트릭스 팀</p></body></html>' },

  // ── THREAD 2: Meeting Schedule ──────────────────────────────────────
  { id: E(5),  folder: 'inbox', subject: '4월 미팅 일정 조율 요청', sender: 'partner@techventure.co.kr', recipient: 'bzengage@example.com', date: '2026-04-18T10:00:00.000Z', read: true,  starred: false, thread_id: 'thread-meeting-april', message_id: '<msg-e005>', in_reply_to: null, refs: null,
    body_html: '<html><body><p>비즈매트릭스 팀 여러분, 안녕하세요.</p><p>다음 주 <strong>신규 파트너십 관련 미팅</strong>을 제안드립니다.</p><ul><li>4월 22일 (화) 오전 10시</li><li>4월 23일 (수) 오후 2시</li><li>4월 24일 (목) 오전 11시</li></ul><p>감사합니다.<br>박영희 드림<br>테크벤처</p></body></html>' },
  { id: E(6),  folder: 'sent',  subject: 'Re: 4월 미팅 일정 조율 요청', sender: 'bzengage@example.com', recipient: 'partner@techventure.co.kr', date: '2026-04-18T11:30:00.000Z', read: true,  starred: false, thread_id: 'thread-meeting-april', message_id: '<msg-e006>', in_reply_to: '<msg-e005>', refs: ['<msg-e005>'],
    body_html: '<html><body><p>박영희 님, 안녕하세요.</p><p>4월 22일 <strong>화요일 오후 2시</strong>로 진행하면 어떠실까요? 장소는 저희 사무실(강남구 테헤란로 123)이 편하실 것 같습니다.</p><p>감사합니다.<br>비즈매트릭스 팀</p></body></html>' },
  { id: E(7),  folder: 'inbox', subject: 'Re: 4월 미팅 일정 조율 요청', sender: 'partner@techventure.co.kr', recipient: 'bzengage@example.com', date: '2026-04-18T14:15:00.000Z', read: false, starred: false, thread_id: 'thread-meeting-april', message_id: '<msg-e007>', in_reply_to: '<msg-e006>', refs: ['<msg-e005>', '<msg-e006>'],
    body_html: '<html><body><p>비즈매트릭스 팀, 안녕하세요.</p><p>네, <strong>4월 22일 화요일 오후 2시</strong>로 확정하겠습니다. 강남구 테헤란로 123으로 방문하겠습니다.</p><p>감사합니다.<br>박영희 드림</p></body></html>' },

  // ── THREAD 3: Invoice ────────────────────────────────────────────────
  { id: E(8),  folder: 'inbox', subject: '3월 인보이스 발송 - 클라우드 서비스 이용료', sender: 'billing@cloudservice.io', recipient: 'bzengage@example.com', date: '2026-04-20T09:00:00.000Z', read: true,  starred: false, thread_id: 'thread-invoice-march', message_id: '<msg-e008>', in_reply_to: null, refs: null,
    body_html: '<html><body><p>비즈매트릭스 담당자님, 안녕하세요.</p><p>2026년 3월 클라우드 서비스 이용료 <strong>인보이스</strong>를 발송드립니다.</p><table border="1"><tr><td>Compute Instances (3대)</td><td>₩450,000</td></tr><tr><td>Storage (500GB)</td><td>₩75,000</td></tr><tr><td>Bandwidth</td><td>₩120,000</td></tr><tr><td>합계 (부가세 별도)</td><td><strong>₩645,000</strong></td></tr></table><p>결제 기한: <strong>2026년 4월 30일</strong></p><p>감사합니다.<br>클라우드서비스 청구팀</p></body></html>' },
  { id: E(9),  folder: 'sent',  subject: 'Re: 3월 인보이스 발송 - 클라우드 서비스 이용료', sender: 'bzengage@example.com', recipient: 'billing@cloudservice.io', date: '2026-04-21T13:00:00.000Z', read: true,  starred: false, thread_id: 'thread-invoice-march', message_id: '<msg-e009>', in_reply_to: '<msg-e008>', refs: ['<msg-e008>'],
    body_html: '<html><body><p>클라우드서비스 청구팀, 안녕하세요.</p><p>3월 인보이스 확인했습니다. <strong>이번 주 내로 결제 진행</strong>하겠습니다.</p><p>감사합니다.<br>비즈매트릭스 팀</p></body></html>' },

  // ── STANDALONE ───────────────────────────────────────────────────────
  { id: E(10), folder: 'inbox', subject: '주간 AI 뉴스레터 - 2026년 4월 3주차', sender: 'newsletter@techhub.com', recipient: 'bzengage@example.com', date: '2026-04-22T07:00:00.000Z', read: false, starred: false, thread_id: E(10), message_id: '<msg-e010>', in_reply_to: null, refs: null,
    body_html: '<html><body><h2>주간 AI 뉴스레터</h2><ul><li><strong>OpenAI GPT-5</strong> 베타 출시 임박</li><li><strong>구글 DeepMind</strong>, 새로운 단백질 구조 예측 모델 발표</li><li><strong>국내 스타트업</strong> AI 반도체 투자 유치 소식</li></ul></body></html>' },
  { id: E(11), folder: 'inbox', subject: '[중요] 서버 점검 안내 - 4월 25일 새벽 2시 ~ 6시', sender: 'notice@cloudhost.com', recipient: 'bzengage@example.com', date: '2026-04-23T11:00:00.000Z', read: true,  starred: true, thread_id: E(11), message_id: '<msg-e011>', in_reply_to: null, refs: null,
    body_html: '<html><body><h2>서버 점검 안내</h2><p>서비스 안정성 향상을 위한 <strong>정기 점검</strong>을 진행합니다.</p><p>점검 일시: 2026년 4월 25일 (토) 02:00 ~ 06:00 (KST)</p><p>영향 범위: 웹사이트 접속 일시 중단 (최대 30분)</p></body></html>' },
  { id: E(12), folder: 'spam',  subject: '축하드립니다! 당신은 1억원에 당첨되셨습니다!', sender: 'spam@lottery-event.kr', recipient: 'bzengage@example.com', date: '2026-04-24T03:30:00.000Z', read: false, starred: false, thread_id: E(12), message_id: '<msg-e012>', in_reply_to: null, refs: null,
    body_html: '<html><body><h1>축하드립니다!</h1><p>당신은 <strong>2026년 봄맞이 특별 이벤트</strong>에 당첨되셨습니다. 상금: ₩100,000,000</p></body></html>' },
  { id: E(13), folder: 'sent',  subject: '4월 프로젝트 진행 상황 공유', sender: 'bzengage@example.com', recipient: 'team@bizmatrixx.com', date: '2026-04-25T16:30:00.000Z', read: true,  starred: false, thread_id: E(13), message_id: '<msg-e013>', in_reply_to: null, refs: null, cc: 'cc@bizmatrixx.com',
    body_html: '<html><body><p>팀 여러분, 안녕하세요.</p><ul><li>Agentic Inbox MVP: <strong>90% 완료</strong></li><li>Cloudflare Workers 마이그레이션: <strong>완료</strong></li><li>AI 에이전트 통합 테스트: <strong>진행 중</strong></li></ul></body></html>' },
  { id: E(14), folder: 'inbox', subject: '[지원] 백엔드 개발자 지원 - 홍길동', sender: 'applicant@devmail.com', recipient: 'bzengage@example.com', date: '2026-04-26T10:15:00.000Z', read: false, starred: false, thread_id: E(14), message_id: '<msg-e014>', in_reply_to: null, refs: null,
    body_html: '<html><body><p>비즈매트릭스 채용팀 담당자님, 안녕하세요.</p><p>홍길동입니다. 백엔드 개발자 포지션에 지원하고자 이력서를 보내드립니다.</p><ul><li>Node.js / TypeScript 5년</li><li>PostgreSQL, Redis 운영 경험</li><li>Cloudflare Workers, AWS Lambda 서버리스 경험</li></ul></body></html>' },
  { id: E(15), folder: 'inbox', subject: '마케팅 콜라보 제안드립니다', sender: 'marketing@brandpartner.kr', recipient: 'bzengage@example.com', date: '2026-04-27T14:00:00.000Z', read: true,  starred: false, thread_id: E(15), message_id: '<msg-e015>', in_reply_to: null, refs: null,
    body_html: '<html><body><p>비즈매트릭스 팀, 안녕하세요.</p><p>브랜드파트너 마케팅팀입니다. 귀사와의 <strong>콘텐츠 마케팅 콜라보레이션</strong>을 제안드리고자 합니다.</p><ul><li>기술 블로그 게스트 포스팅 교환</li><li>소셜 미디어 크로스 프로모션</li><li>웨비나 공동 주최</li></ul></body></html>' },
  { id: E(16), folder: 'sent',  subject: 'Re: 마케팅 콜라보 제안드립니다', sender: 'bzengage@example.com', recipient: 'marketing@brandpartner.kr', date: '2026-04-28T09:30:00.000Z', read: true,  starred: false, thread_id: E(15), message_id: '<msg-e016>', in_reply_to: '<msg-e015>', refs: ['<msg-e015>'],
    body_html: '<html><body><p>브랜드파트너 마케팅팀, 안녕하세요.</p><p>콜라보 제안 감사합니다. <strong>기술 블로그 게스트 포스팅</strong> 아이디어가 흥미롭습니다.</p><p>다음 주 초에 구체적인 방향성을 가지고 다시 연락드리겠습니다.</p><p>감사합니다.<br>비즈매트릭스 팀</p></body></html>' },

  // ── SAMSUNG: 갤럭시 S25 Ultra Web Push (sam-10) ──────────────────────
  { id: S('10',1), folder: 'inbox', subject: '[요청] 갤럭시 S25 Ultra Web Push Notification 디자인 의뢰', sender: 'minjun.kim@samsung.com', recipient: 'bzengage@example.com', date: '2026-04-21T00:00:00.000Z', read: true,  starred: false, thread_id: 'thread-samsung-10', message_id: '<msg-sam-10-e1>', in_reply_to: null, refs: null,
    body_html: '<html><body><p>비즈매트릭스 팀, 안녕하세요.</p><p><strong>갤럭시 S25 Ultra</strong> 신제품 런칭을 위한 <strong>Web Push Notification</strong> 디자인 및 개발을 요청드립니다.</p><ul><li>메인 비주얼: 제품 이미지 중심의 클린한 디자인</li><li>카피: "갤럭시 S25 Ultra — 당신의 일상을 바꾸다"</li><li>CTA 버튼: "지금 예약하기" / "자세히 보기"</li><li>반응형 대응 (PC/Mobile/Tablet)</li></ul><p>런칭 일정: <strong>5월 15일</strong></p><p>1차 시안은 <strong>2026-04-21 이후 3영업일</strong> 내로 부탁드립니다.</p><p>감사합니다.<br>김민준 드림<br>삼성전자 디지털마케팅팀</p></body></html>' },
  { id: S('10',2), folder: 'sent',  subject: 'Re: [요청] 갤럭시 S25 Ultra Web Push Notification 디자인 의뢰', sender: 'bzengage@example.com', recipient: 'minjun.kim@samsung.com', date: '2026-04-24T05:30:00.000Z', read: true,  starred: false, thread_id: 'thread-samsung-10', message_id: '<msg-sam-10-e2>', in_reply_to: '<msg-sam-10-e1>', refs: ['<msg-sam-10-e1>'],
    body_html: '<html><body><p>김민준 님, 안녕하세요.</p><p><strong>갤럭시 S25 Ultra</strong> Web Push Notification 1차 시안을 준비했습니다.</p><ul><li>메인 비주얼: 제품 3D 렌더링 이미지 + 그라데이션 배경</li><li>카피 적용 완료</li><li>PC/Mobile 반응형 레이아웃 적용</li></ul><p>첨부 파일에서 시안을 확인해 주시고, 피드백 부탁드립니다.</p><p>감사합니다.<br>비즈매트릭스 팀</p></body></html>' },
  { id: S('10',3), folder: 'inbox', subject: 'Re: [요청] 갤럭시 S25 Ultra Web Push Notification 디자인 의뢰 - 수정 요청', sender: 'minjun.kim@samsung.com', recipient: 'bzengage@example.com', date: '2026-04-26T01:15:00.000Z', read: true,  starred: true, thread_id: 'thread-samsung-10', message_id: '<msg-sam-10-e3>', in_reply_to: '<msg-sam-10-e2>', refs: ['<msg-sam-10-e1>', '<msg-sam-10-e2>'],
    body_html: '<html><body><p>비즈매트릭스 팀, 안녕하세요.</p><p>1차 시안 확인했습니다. <strong>아래 수정 사항</strong>을 반영 부탁드립니다.</p><ol><li>메인 비주얼 배경색을 <strong>코발트 블루</strong> 톤으로 변경</li><li>CTA 버튼 색상을 삼성 브랜드 컬러로 조정</li><li>모바일 버전에서 폰트 사이즈 1pt 업</li><li>하단에 <strong>"자세한 사양 비교하기"</strong> 링크 추가</li></ol><p>감사합니다.<br>김민준 드림</p></body></html>' },
  { id: S('10',4), folder: 'sent',  subject: 'Re: [요청] 갤럭시 S25 Ultra Web Push Notification 디자인 의뢰 - 2차 시안', sender: 'bzengage@example.com', recipient: 'minjun.kim@samsung.com', date: '2026-04-28T07:00:00.000Z', read: true,  starred: false, thread_id: 'thread-samsung-10', message_id: '<msg-sam-10-e4>', in_reply_to: '<msg-sam-10-e3>', refs: ['<msg-sam-10-e1>', '<msg-sam-10-e2>', '<msg-sam-10-e3>'],
    body_html: '<html><body><p>김민준 님, 안녕하세요.</p><p>요청하신 수정 사항을 모두 반영한 <strong>2차 시안</strong>을 준비했습니다.</p><ul><li>배경색 → 코발트 블루 그라데이션 적용 완료</li><li>CTA 버튼 색상 → 삼성 블루 #1428A0 적용</li><li>모바일 폰트 사이즈 1pt 증가 완료</li><li>"자세한 사양 비교하기" 링크 하단 추가 완료</li></ul><p>감사합니다.<br>비즈매트릭스 팀</p></body></html>' },
  { id: S('10',5), folder: 'inbox', subject: 'Re: [요청] 갤럭시 S25 Ultra Web Push Notification 디자인 의뢰 - 컨펌 및 최종 가이드', sender: 'minjun.kim@samsung.com', recipient: 'bzengage@example.com', date: '2026-04-29T02:00:00.000Z', read: false, starred: true, thread_id: 'thread-samsung-10', message_id: '<msg-sam-10-e5>', in_reply_to: '<msg-sam-10-e4>', refs: ['<msg-sam-10-e1>', '<msg-sam-10-e2>', '<msg-sam-10-e3>', '<msg-sam-10-e4>'],
    body_html: '<html><body><p>비즈매트릭스 팀, 안녕하세요.</p><p>2차 시안 확인했습니다. <strong>디자인 컨펌</strong>합니다.</p><ul><li>최종 파일 형식: PSD, AI, HTML</li><li>배너 사이즈: 1920x600 (PC), 768x400 (Mobile), 320x250 (App)</li><li>웹폰트: 삼성 One 폰트 사용</li></ul><p>최종 파일은 <strong>5월 10일</strong>까지 전달 부탁드립니다.</p><p>감사합니다.<br>김민준 드림</p></body></html>' },

  // ── SAMSUNG: 갤럭시 Z Fold6 Popup Banner (sam-11) ───────────────────
  { id: S('11',1), folder: 'inbox', subject: '[요청] 갤럭시 Z Fold6 Popup Banner 디자인 의뢰', sender: 'seoyeon.lee@samsung.com', recipient: 'bzengage@example.com', date: '2026-04-23T00:00:00.000Z', read: true,  starred: false, thread_id: 'thread-samsung-11', message_id: '<msg-sam-11-e1>', in_reply_to: null, refs: null,
    body_html: '<html><body><p>비즈매트릭스 팀, 안녕하세요.</p><p><strong>갤럭시 Z Fold6</strong> 신제품 런칭을 위한 <strong>Popup Banner</strong> 디자인 및 개발을 요청드립니다.</p><ul><li>카피: "갤럭시 Z Fold6 — 당신의 일상을 바꾸다"</li><li>CTA 버튼: "지금 예약하기" / "자세히 보기"</li><li>반응형 대응 (PC/Mobile/Tablet)</li></ul><p>런칭 일정: <strong>5월 15일</strong></p><p>감사합니다.<br>이서연 드림<br>삼성전자 브랜드마케팅팀</p></body></html>' },
  { id: S('11',2), folder: 'sent',  subject: 'Re: [요청] 갤럭시 Z Fold6 Popup Banner 디자인 의뢰', sender: 'bzengage@example.com', recipient: 'seoyeon.lee@samsung.com', date: '2026-04-26T05:30:00.000Z', read: true,  starred: false, thread_id: 'thread-samsung-11', message_id: '<msg-sam-11-e2>', in_reply_to: '<msg-sam-11-e1>', refs: ['<msg-sam-11-e1>'],
    body_html: '<html><body><p>이서연 님, 안녕하세요.</p><p><strong>갤럭시 Z Fold6</strong> Popup Banner 1차 시안을 준비했습니다. 첨부 파일에서 시안을 확인해 주시고, 피드백 부탁드립니다.</p><p>감사합니다.<br>비즈매트릭스 팀</p></body></html>' },
  { id: S('11',3), folder: 'inbox', subject: 'Re: [요청] 갤럭시 Z Fold6 Popup Banner 디자인 의뢰 - 수정 요청', sender: 'seoyeon.lee@samsung.com', recipient: 'bzengage@example.com', date: '2026-04-28T01:15:00.000Z', read: true,  starred: true, thread_id: 'thread-samsung-11', message_id: '<msg-sam-11-e3>', in_reply_to: '<msg-sam-11-e2>', refs: ['<msg-sam-11-e1>', '<msg-sam-11-e2>'],
    body_html: '<html><body><p>비즈매트릭스 팀, 안녕하세요.</p><p>1차 시안 확인했습니다. <strong>아래 수정 사항</strong>을 반영 부탁드립니다.</p><ol><li>배경색 → <strong>코발트 블루</strong> 톤으로 변경</li><li>CTA 버튼 → 삼성 브랜드 컬러로 조정</li><li>모바일 폰트 사이즈 1pt 업</li><li>하단 "자세한 사양 비교하기" 링크 추가</li></ol><p>감사합니다.<br>이서연 드림</p></body></html>' },
  { id: S('11',4), folder: 'sent',  subject: 'Re: [요청] 갤럭시 Z Fold6 Popup Banner 디자인 의뢰 - 2차 시안', sender: 'bzengage@example.com', recipient: 'seoyeon.lee@samsung.com', date: '2026-04-30T07:00:00.000Z', read: true,  starred: false, thread_id: 'thread-samsung-11', message_id: '<msg-sam-11-e4>', in_reply_to: '<msg-sam-11-e3>', refs: ['<msg-sam-11-e1>', '<msg-sam-11-e2>', '<msg-sam-11-e3>'],
    body_html: '<html><body><p>이서연 님, 안녕하세요.</p><p>수정 사항 반영한 <strong>2차 시안</strong>을 준비했습니다.</p><ul><li>배경색 → 코발트 블루 그라데이션 적용 완료</li><li>CTA → 삼성 블루 #1428A0 적용</li><li>모바일 폰트 1pt 증가 완료</li></ul><p>감사합니다.<br>비즈매트릭스 팀</p></body></html>' },
  { id: S('11',5), folder: 'inbox', subject: 'Re: [요청] 갤럭시 Z Fold6 Popup Banner 디자인 의뢰 - 추가 수정 요청', sender: 'seoyeon.lee@samsung.com', recipient: 'bzengage@example.com', date: '2026-05-01T02:00:00.000Z', read: false, starred: false, thread_id: 'thread-samsung-11', message_id: '<msg-sam-11-e5>', in_reply_to: '<msg-sam-11-e4>', refs: ['<msg-sam-11-e1>', '<msg-sam-11-e2>', '<msg-sam-11-e3>', '<msg-sam-11-e4>'],
    body_html: '<html><body><p>비즈매트릭스 팀, 안녕하세요.</p><p>2차 시안 확인했습니다. <strong>추가 수정</strong>이 필요합니다.</p><ol><li>상단 헤더에 <strong>"NEW"</strong> 뱃지 추가</li><li>가격 정보 노출 영역 추가 ("1,099,000원부터")</li><li>배너 좌측 하단에 삼성 로고 위치 조정</li></ol><p>감사합니다.<br>이서연 드림</p></body></html>' },

  // ── SAMSUNG: 갤럭시 Z Flip6 Homepage Banner (sam-12) ────────────────
  { id: S('12',1), folder: 'inbox', subject: '[요청] 갤럭시 Z Flip6 Homepage Main Banner 디자인 의뢰', sender: 'jihoon.park@samsung.com', recipient: 'bzengage@example.com', date: '2026-04-25T00:00:00.000Z', read: true,  starred: false, thread_id: 'thread-samsung-12', message_id: '<msg-sam-12-e1>', in_reply_to: null, refs: null,
    body_html: '<html><body><p>비즈매트릭스 팀, 안녕하세요.</p><p><strong>갤럭시 Z Flip6</strong> 신제품 런칭을 위한 <strong>Homepage Main Banner</strong> 디자인 및 개발을 요청드립니다.</p><ul><li>카피: "갤럭시 Z Flip6 — 당신의 일상을 바꾸다"</li><li>런칭 일정: <strong>5월 15일</strong></li></ul><p>감사합니다.<br>박지훈 드림<br>삼성전자 글로벌캠페인팀</p></body></html>' },
  { id: S('12',2), folder: 'sent',  subject: 'Re: [요청] 갤럭시 Z Flip6 Homepage Main Banner 디자인 의뢰', sender: 'bzengage@example.com', recipient: 'jihoon.park@samsung.com', date: '2026-04-28T05:30:00.000Z', read: true,  starred: false, thread_id: 'thread-samsung-12', message_id: '<msg-sam-12-e2>', in_reply_to: '<msg-sam-12-e1>', refs: ['<msg-sam-12-e1>'],
    body_html: '<html><body><p>박지훈 님, 안녕하세요.</p><p><strong>갤럭시 Z Flip6</strong> Homepage Main Banner 1차 시안을 준비했습니다. 피드백 부탁드립니다.</p><p>감사합니다.<br>비즈매트릭스 팀</p></body></html>' },
  { id: S('12',3), folder: 'inbox', subject: 'Re: [요청] 갤럭시 Z Flip6 Homepage Main Banner 디자인 의뢰 - 수정 요청', sender: 'jihoon.park@samsung.com', recipient: 'bzengage@example.com', date: '2026-04-30T01:15:00.000Z', read: true,  starred: true, thread_id: 'thread-samsung-12', message_id: '<msg-sam-12-e3>', in_reply_to: '<msg-sam-12-e2>', refs: ['<msg-sam-12-e1>', '<msg-sam-12-e2>'],
    body_html: '<html><body><p>수정 요청: 배경색 코발트 블루, CTA 삼성 브랜드 컬러, 모바일 폰트 1pt 업, 사양 비교 링크 추가 부탁드립니다.</p><p>감사합니다.<br>박지훈 드림</p></body></html>' },
  { id: S('12',4), folder: 'sent',  subject: 'Re: [요청] 갤럭시 Z Flip6 Homepage Main Banner 디자인 의뢰 - 2차 시안', sender: 'bzengage@example.com', recipient: 'jihoon.park@samsung.com', date: '2026-05-02T07:00:00.000Z', read: true,  starred: false, thread_id: 'thread-samsung-12', message_id: '<msg-sam-12-e4>', in_reply_to: '<msg-sam-12-e3>', refs: ['<msg-sam-12-e1>', '<msg-sam-12-e2>', '<msg-sam-12-e3>'],
    body_html: '<html><body><p>박지훈 님, 수정 사항 모두 반영한 2차 시안을 준비했습니다. 검토 부탁드립니다.</p><p>감사합니다.<br>비즈매트릭스 팀</p></body></html>' },
  { id: S('12',5), folder: 'inbox', subject: 'Re: [요청] 갤럭시 Z Flip6 Homepage Main Banner 디자인 의뢰 - 컨펌 및 최종 가이드', sender: 'jihoon.park@samsung.com', recipient: 'bzengage@example.com', date: '2026-05-03T02:00:00.000Z', read: false, starred: true, thread_id: 'thread-samsung-12', message_id: '<msg-sam-12-e5>', in_reply_to: '<msg-sam-12-e4>', refs: ['<msg-sam-12-e1>', '<msg-sam-12-e2>', '<msg-sam-12-e3>', '<msg-sam-12-e4>'],
    body_html: '<html><body><p>2차 시안 확인했습니다. <strong>디자인 컨펌</strong>합니다. 최종 파일은 <strong>5월 10일</strong>까지 전달 부탁드립니다.</p><p>감사합니다.<br>박지훈 드림</p></body></html>' },

  // ── SAMSUNG: 갤럭시 A55 Product Detail Page Banner (sam-13) ─────────
  { id: S('13',1), folder: 'inbox', subject: '[요청] 갤럭시 A55 Product Detail Page Banner 디자인 의뢰', sender: 'sooah.choi@samsung.com', recipient: 'bzengage@example.com', date: '2026-04-27T00:00:00.000Z', read: true,  starred: false, thread_id: 'thread-samsung-13', message_id: '<msg-sam-13-e1>', in_reply_to: null, refs: null,
    body_html: '<html><body><p>비즈매트릭스 팀, 안녕하세요.</p><p><strong>갤럭시 A55</strong> 신제품 런칭을 위한 <strong>Product Detail Page Banner</strong> 디자인 및 개발을 요청드립니다.</p><p>런칭 일정: <strong>5월 15일</strong></p><p>감사합니다.<br>최수아 드림<br>삼성전자 온라인세일즈팀</p></body></html>' },
  { id: S('13',2), folder: 'sent',  subject: 'Re: [요청] 갤럭시 A55 Product Detail Page Banner 디자인 의뢰', sender: 'bzengage@example.com', recipient: 'sooah.choi@samsung.com', date: '2026-04-30T05:30:00.000Z', read: true,  starred: false, thread_id: 'thread-samsung-13', message_id: '<msg-sam-13-e2>', in_reply_to: '<msg-sam-13-e1>', refs: ['<msg-sam-13-e1>'],
    body_html: '<html><body><p>최수아 님, 안녕하세요.</p><p><strong>갤럭시 A55</strong> Product Detail Page Banner 1차 시안을 준비했습니다. 피드백 부탁드립니다.</p><p>감사합니다.<br>비즈매트릭스 팀</p></body></html>' },
  { id: S('13',3), folder: 'inbox', subject: 'Re: [요청] 갤럭시 A55 Product Detail Page Banner 디자인 의뢰 - 수정 요청', sender: 'sooah.choi@samsung.com', recipient: 'bzengage@example.com', date: '2026-05-02T01:15:00.000Z', read: true,  starred: true, thread_id: 'thread-samsung-13', message_id: '<msg-sam-13-e3>', in_reply_to: '<msg-sam-13-e2>', refs: ['<msg-sam-13-e1>', '<msg-sam-13-e2>'],
    body_html: '<html><body><p>수정 요청: 배경색 코발트 블루, CTA 삼성 브랜드 컬러, 모바일 폰트 1pt 업, 사양 비교 링크 추가 부탁드립니다.</p><p>감사합니다.<br>최수아 드림</p></body></html>' },
  { id: S('13',4), folder: 'sent',  subject: 'Re: [요청] 갤럭시 A55 Product Detail Page Banner 디자인 의뢰 - 2차 시안', sender: 'bzengage@example.com', recipient: 'sooah.choi@samsung.com', date: '2026-05-04T07:00:00.000Z', read: true,  starred: false, thread_id: 'thread-samsung-13', message_id: '<msg-sam-13-e4>', in_reply_to: '<msg-sam-13-e3>', refs: ['<msg-sam-13-e1>', '<msg-sam-13-e2>', '<msg-sam-13-e3>'],
    body_html: '<html><body><p>최수아 님, 수정 사항 반영한 2차 시안을 준비했습니다. 검토 부탁드립니다.</p><p>감사합니다.<br>비즈매트릭스 팀</p></body></html>' },
  { id: S('13',5), folder: 'inbox', subject: 'Re: [요청] 갤럭시 A55 Product Detail Page Banner 디자인 의뢰 - 추가 수정 요청', sender: 'sooah.choi@samsung.com', recipient: 'bzengage@example.com', date: '2026-05-05T02:00:00.000Z', read: false, starred: false, thread_id: 'thread-samsung-13', message_id: '<msg-sam-13-e5>', in_reply_to: '<msg-sam-13-e4>', refs: ['<msg-sam-13-e1>', '<msg-sam-13-e2>', '<msg-sam-13-e3>', '<msg-sam-13-e4>'],
    body_html: '<html><body><p>추가 수정: "NEW" 뱃지 추가, 가격 정보 노출, 삼성 로고 위치 조정 부탁드립니다.</p><p>감사합니다.<br>최수아 드림</p></body></html>' },

  // ── SAMSUNG: 비스포크 냉장고 Mobile App Push (sam-14) ────────────────
  { id: S('14',1), folder: 'inbox', subject: '[요청] 비스포크 냉장고 Mobile App Push 디자인 의뢰', sender: 'doyun.jung@samsung.com', recipient: 'bzengage@example.com', date: '2026-04-29T00:00:00.000Z', read: true,  starred: false, thread_id: 'thread-samsung-14', message_id: '<msg-sam-14-e1>', in_reply_to: null, refs: null,
    body_html: '<html><body><p>비즈매트릭스 팀, 안녕하세요.</p><p><strong>비스포크 냉장고</strong> 신제품 런칭을 위한 <strong>Mobile App Push</strong> 디자인 및 개발을 요청드립니다.</p><p>런칭 일정: <strong>5월 15일</strong></p><p>감사합니다.<br>정도윤 드림<br>삼성전자 프로덕트마케팅팀</p></body></html>' },
  { id: S('14',2), folder: 'sent',  subject: 'Re: [요청] 비스포크 냉장고 Mobile App Push 디자인 의뢰', sender: 'bzengage@example.com', recipient: 'doyun.jung@samsung.com', date: '2026-05-02T05:30:00.000Z', read: true,  starred: false, thread_id: 'thread-samsung-14', message_id: '<msg-sam-14-e2>', in_reply_to: '<msg-sam-14-e1>', refs: ['<msg-sam-14-e1>'],
    body_html: '<html><body><p>정도윤 님, 안녕하세요.</p><p><strong>비스포크 냉장고</strong> Mobile App Push 1차 시안을 준비했습니다. 피드백 부탁드립니다.</p><p>감사합니다.<br>비즈매트릭스 팀</p></body></html>' },
  { id: S('14',3), folder: 'inbox', subject: 'Re: [요청] 비스포크 냉장고 Mobile App Push 디자인 의뢰 - 수정 요청', sender: 'doyun.jung@samsung.com', recipient: 'bzengage@example.com', date: '2026-05-04T01:15:00.000Z', read: true,  starred: true, thread_id: 'thread-samsung-14', message_id: '<msg-sam-14-e3>', in_reply_to: '<msg-sam-14-e2>', refs: ['<msg-sam-14-e1>', '<msg-sam-14-e2>'],
    body_html: '<html><body><p>수정 요청: 배경색 코발트 블루, CTA 삼성 브랜드 컬러, 모바일 폰트 1pt 업, 사양 비교 링크 추가 부탁드립니다.</p><p>감사합니다.<br>정도윤 드림</p></body></html>' },
  { id: S('14',4), folder: 'sent',  subject: 'Re: [요청] 비스포크 냉장고 Mobile App Push 디자인 의뢰 - 2차 시안', sender: 'bzengage@example.com', recipient: 'doyun.jung@samsung.com', date: '2026-05-06T07:00:00.000Z', read: true,  starred: false, thread_id: 'thread-samsung-14', message_id: '<msg-sam-14-e4>', in_reply_to: '<msg-sam-14-e3>', refs: ['<msg-sam-14-e1>', '<msg-sam-14-e2>', '<msg-sam-14-e3>'],
    body_html: '<html><body><p>정도윤 님, 수정 사항 반영한 2차 시안을 준비했습니다. 검토 부탁드립니다.</p><p>감사합니다.<br>비즈매트릭스 팀</p></body></html>' },
  { id: S('14',5), folder: 'inbox', subject: 'Re: [요청] 비스포크 냉장고 Mobile App Push 디자인 의뢰 - 컨펌 및 최종 가이드', sender: 'doyun.jung@samsung.com', recipient: 'bzengage@example.com', date: '2026-05-07T02:00:00.000Z', read: false, starred: true, thread_id: 'thread-samsung-14', message_id: '<msg-sam-14-e5>', in_reply_to: '<msg-sam-14-e4>', refs: ['<msg-sam-14-e1>', '<msg-sam-14-e2>', '<msg-sam-14-e3>', '<msg-sam-14-e4>'],
    body_html: '<html><body><p>2차 시안 확인했습니다. <strong>디자인 컨펌</strong>합니다. 최종 파일은 <strong>5월 10일</strong>까지 전달 부탁드립니다.</p><p>감사합니다.<br>정도윤 드림</p></body></html>' },

  // ── SAMSUNG: 비스포크 그랑데 AI 세탁기 Email Newsletter Banner (sam-15) ──
  { id: S('15',1), folder: 'inbox', subject: '[요청] 비스포크 그랑데 AI 세탁기 Email Newsletter Banner 디자인 의뢰', sender: 'yerin.kang@samsung.com', recipient: 'bzengage@example.com', date: '2026-05-01T00:00:00.000Z', read: true,  starred: false, thread_id: 'thread-samsung-15', message_id: '<msg-sam-15-e1>', in_reply_to: null, refs: null,
    body_html: '<html><body><p>비즈매트릭스 팀, 안녕하세요.</p><p><strong>비스포크 그랑데 AI 세탁기</strong> 신제품 런칭을 위한 <strong>Email Newsletter Banner</strong> 디자인 및 개발을 요청드립니다.</p><p>런칭 일정: <strong>5월 15일</strong></p><p>감사합니다.<br>강예린 드림<br>삼성전자 퍼포먼스마케팅팀</p></body></html>' },
  { id: S('15',2), folder: 'sent',  subject: 'Re: [요청] 비스포크 그랑데 AI 세탁기 Email Newsletter Banner 디자인 의뢰', sender: 'bzengage@example.com', recipient: 'yerin.kang@samsung.com', date: '2026-05-04T05:30:00.000Z', read: true,  starred: false, thread_id: 'thread-samsung-15', message_id: '<msg-sam-15-e2>', in_reply_to: '<msg-sam-15-e1>', refs: ['<msg-sam-15-e1>'],
    body_html: '<html><body><p>강예린 님, 안녕하세요.</p><p><strong>비스포크 그랑데 AI 세탁기</strong> Email Newsletter Banner 1차 시안을 준비했습니다. 피드백 부탁드립니다.</p><p>감사합니다.<br>비즈매트릭스 팀</p></body></html>' },
  { id: S('15',3), folder: 'inbox', subject: 'Re: [요청] 비스포크 그랑데 AI 세탁기 Email Newsletter Banner 디자인 의뢰 - 수정 요청', sender: 'yerin.kang@samsung.com', recipient: 'bzengage@example.com', date: '2026-05-06T01:15:00.000Z', read: true,  starred: true, thread_id: 'thread-samsung-15', message_id: '<msg-sam-15-e3>', in_reply_to: '<msg-sam-15-e2>', refs: ['<msg-sam-15-e1>', '<msg-sam-15-e2>'],
    body_html: '<html><body><p>수정 요청: 배경색 코발트 블루, CTA 삼성 브랜드 컬러, 모바일 폰트 1pt 업, 사양 비교 링크 추가 부탁드립니다.</p><p>감사합니다.<br>강예린 드림</p></body></html>' },
  { id: S('15',4), folder: 'sent',  subject: 'Re: [요청] 비스포크 그랑데 AI 세탁기 Email Newsletter Banner 디자인 의뢰 - 2차 시안', sender: 'bzengage@example.com', recipient: 'yerin.kang@samsung.com', date: '2026-05-08T07:00:00.000Z', read: true,  starred: false, thread_id: 'thread-samsung-15', message_id: '<msg-sam-15-e4>', in_reply_to: '<msg-sam-15-e3>', refs: ['<msg-sam-15-e1>', '<msg-sam-15-e2>', '<msg-sam-15-e3>'],
    body_html: '<html><body><p>강예린 님, 수정 사항 반영한 2차 시안을 준비했습니다. 검토 부탁드립니다.</p><p>감사합니다.<br>비즈매트릭스 팀</p></body></html>' },
  { id: S('15',5), folder: 'inbox', subject: 'Re: [요청] 비스포크 그랑데 AI 세탁기 Email Newsletter Banner 디자인 의뢰 - 추가 수정 요청', sender: 'yerin.kang@samsung.com', recipient: 'bzengage@example.com', date: '2026-05-09T02:00:00.000Z', read: false, starred: false, thread_id: 'thread-samsung-15', message_id: '<msg-sam-15-e5>', in_reply_to: '<msg-sam-15-e4>', refs: ['<msg-sam-15-e1>', '<msg-sam-15-e2>', '<msg-sam-15-e3>', '<msg-sam-15-e4>'],
    body_html: '<html><body><p>추가 수정: "NEW" 뱃지 추가, 가격 정보 노출, 삼성 로고 위치 조정 부탁드립니다.</p><p>감사합니다.<br>강예린 드림</p></body></html>' },
];

const attachments = [
  { id: A(1),  email_id: E(4),       filename: '견적서_웹사이트리디자인.pdf',                       mimetype: 'application/pdf',                                       size: 245760  },
  { id: A(2),  email_id: E(8),       filename: 'Invoice_2026_03_CloudService.pdf',                  mimetype: 'application/pdf',                                       size: 183500  },
  { id: A(3),  email_id: E(13),      filename: '4월_프로젝트_진행상황.xlsx',                        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 51200 },
  { id: SA(1), email_id: S('10',2),  filename: '갤럭시_S25_Ultra_1차시안.zip',                     mimetype: 'application/zip',                                       size: 5242880 },
  { id: SA(2), email_id: S('10',4),  filename: '갤럭시_S25_Ultra_2차시안.psd',                     mimetype: 'image/vnd.adobe.photoshop',                             size: 15728640 },
  { id: SA(3), email_id: S('12',2),  filename: '갤럭시_Z_Flip6_1차시안.zip',                       mimetype: 'application/zip',                                       size: 5242880 },
  { id: SA(4), email_id: S('13',4),  filename: '갤럭시_A55_2차시안.psd',                           mimetype: 'image/vnd.adobe.photoshop',                             size: 15728640 },
  { id: SA(5), email_id: S('14',2),  filename: '비스포크_냉장고_1차시안.zip',                      mimetype: 'application/zip',                                       size: 5242880 },
];

async function seedCampaigns() {
  // Remove previously seeded b0020000... demo emails so we start clean
  await query(
    `DELETE FROM emails WHERE mailbox_id = $1 AND id::text LIKE 'b0020000%'`,
    [MAILBOX_ID]
  );

  // Remove any leftover emails from previous runs of this script
  const idsToDelete = emails.map(e => e.id);
  if (idsToDelete.length) {
    await query(
      `DELETE FROM emails WHERE id = ANY($1::uuid[])`,
      [idsToDelete]
    );
  }

  let inserted = 0;
  for (const e of emails) {
    const folderId = FOLDERS[e.folder];
    if (!folderId) { console.warn('unknown folder:', e.folder); continue; }
    await query(
      `INSERT INTO emails
         (id, mailbox_id, folder_id, thread_id, subject, sender, recipient, cc, body_text, body_html,
          message_id, in_reply_to, email_references, email_date, is_read, is_starred)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       ON CONFLICT (id) DO NOTHING`,
      [
        e.id, MAILBOX_ID, folderId,
        e.thread_id,
        e.subject, e.sender, e.recipient,
        e.cc || null,
        stripHtml(e.body_html), e.body_html,
        e.message_id, e.in_reply_to,
        e.refs ? JSON.stringify(e.refs) : null,
        e.date,
        e.read, e.starred,
      ]
    );
    inserted++;
  }
  console.log(`Seeded ${inserted} emails`);

  let attInserted = 0;
  for (const a of attachments) {
    await query(
      `INSERT INTO attachments (id, email_id, filename, mimetype, size_bytes, storage_key, disposition)
       VALUES ($1,$2,$3,$4,$5,$6,'attachment')
       ON CONFLICT (id) DO NOTHING`,
      [a.id, a.email_id, a.filename, a.mimetype, a.size, `placeholder/${a.filename}`]
    );
    attInserted++;
  }
  console.log(`Seeded ${attInserted} attachments`);
}

seedCampaigns().catch(console.error).finally(() => process.exit());
