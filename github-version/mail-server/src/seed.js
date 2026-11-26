import { pool } from './db.js';

// Development sample mail for the mailbox the initial migration creates.
// The nine sample campaign emails are not seeded here: they come from
// POST /api/v1/mailboxes/:id/demo-campaigns/seed, which the inbox's empty state calls.
const mailboxId = '00000000-0000-0000-0000-000000000001';

// Re-running adds nothing: every row has a fixed id. `thread` defaults to the email's own id.
const emails = [
    { id: 'a0010000-0000-0000-0000-000000000001', folder: 'inbox', subject: '웹사이트 리디자인 견적 문의드립니다', sender: 'client@designcorp.com', recipient: 'bzengage@example.com', date: '2026-04-15T09:30:00.000Z', read: true, thread: 'thread-web-redesign', body: '안녕하세요, 견적 문의드립니다.' },
    { id: 'a0010000-0000-0000-0000-000000000002', folder: 'sent', subject: 'Re: 웹사이트 리디자인 견적 문의드립니다', sender: 'bzengage@example.com', recipient: 'client@designcorp.com', date: '2026-04-15T14:20:00.000Z', read: true, thread: 'thread-web-redesign', body: '견적 문의 감사합니다.' },
    { id: 'a0010000-0000-0000-0000-000000000003', folder: 'inbox', subject: '4월 미팅 일정 조율 요청', sender: 'partner@techventure.co.kr', recipient: 'bzengage@example.com', date: '2026-04-18T10:00:00.000Z', read: true, thread: 'thread-meeting-april', body: '미팅 일정 조율 요청드립니다.' },
    { id: 'a0010000-0000-0000-0000-000000000004', folder: 'sent', subject: 'Re: 4월 미팅 일정 조율 요청', sender: 'bzengage@example.com', recipient: 'partner@techventure.co.kr', date: '2026-04-18T11:30:00.000Z', read: true, thread: 'thread-meeting-april', body: '화요일 오후 2시 어떠신가요?' },
    { id: 'a0010000-0000-0000-0000-000000000005', folder: 'inbox', subject: '3월 인보이스 발송', sender: 'billing@cloudservice.io', recipient: 'bzengage@example.com', date: '2026-04-20T09:00:00.000Z', read: true, thread: 'thread-invoice-march', body: '3월 인보이스를 발송드립니다.' },
    { id: 'a0010000-0000-0000-0000-000000000006', folder: 'inbox', subject: '주간 AI 뉴스레터', sender: 'newsletter@techhub.com', recipient: 'bzengage@example.com', date: '2026-04-22T07:00:00.000Z', read: false, thread: 'a0010000-0000-0000-0000-000000000006', body: '주간 AI 뉴스레터입니다.' },
    { id: 'a0010000-0000-0000-0000-000000000007', folder: 'spam', subject: '축하드립니다! 당첨!', sender: 'spam@lottery-event.kr', recipient: 'bzengage@example.com', date: '2026-04-24T03:30:00.000Z', read: false, thread: 'a0010000-0000-0000-0000-000000000007', body: '당신은 1억원에 당첨되셨습니다!' },

    // ── inbox ──────────────────────────────────────────────────────────
    { id: 'b0020000-0000-0000-0000-000000000001', folder: 'inbox', subject: '[긴급] 서버 장애 발생 — 즉각 조치 필요', sender: 'infra@company.io', date: '2026-05-17T08:12:00Z', read: false, body: '운영 서버 #3에서 메모리 누수가 감지되었습니다. 즉시 확인 바랍니다.' },
    { id: 'b0020000-0000-0000-0000-000000000002', folder: 'inbox', subject: 'Q2 마케팅 예산 승인 요청', sender: 'marketing@company.io', date: '2026-05-17T09:45:00Z', read: false, body: 'Q2 마케팅 캠페인 예산 3,500만원 승인 요청드립니다. 상세 내역 첨부합니다.' },
    { id: 'b0020000-0000-0000-0000-000000000003', folder: 'inbox', subject: '신규 파트너십 제안 — TechCorp Korea', sender: 'bd@techcorp.kr', date: '2026-05-17T10:20:00Z', read: false, body: '안녕하세요, TechCorp Korea 사업개발팀입니다. 파트너십 협력 제안을 드리고자 연락드립니다.' },
    { id: 'b0020000-0000-0000-0000-000000000004', folder: 'inbox', subject: '5월 팀 회식 일정 조율', sender: 'hr@company.io', date: '2026-05-16T16:30:00Z', read: true, body: '5월 팀 회식 일정을 조율하고자 합니다. 가능한 날짜를 알려주세요.' },
    { id: 'b0020000-0000-0000-0000-000000000005', folder: 'inbox', subject: 'API 연동 문서 검토 요청', sender: 'dev@partnerco.com', date: '2026-05-16T14:00:00Z', read: false, body: '신규 API 연동을 위한 문서 검토를 요청드립니다. 3일 내 피드백 부탁드립니다.' },
    { id: 'b0020000-0000-0000-0000-000000000006', folder: 'inbox', subject: '계약서 최종 검토 — 법무 확인 필요', sender: 'legal@lawfirm.co.kr', date: '2026-05-16T11:00:00Z', read: false, body: '첨부된 계약서를 최종 검토해주시기 바랍니다. 서명 기한은 5월 20일입니다.' },
    { id: 'b0020000-0000-0000-0000-000000000007', folder: 'inbox', subject: 'AWS 비용 이상 알림 — 5월 예산 초과', sender: 'billing@aws.amazon.com', date: '2026-05-15T23:00:00Z', read: false, body: '이번 달 AWS 사용 비용이 설정된 예산 한도를 초과했습니다.' },
    { id: 'b0020000-0000-0000-0000-000000000008', folder: 'inbox', subject: '신입사원 온보딩 자료 요청', sender: 'newstaff@company.io', date: '2026-05-15T09:30:00Z', read: true, body: '다음 주 입사 예정입니다. 온보딩 자료와 장비 신청 절차를 안내해주시면 감사하겠습니다.' },
    { id: 'b0020000-0000-0000-0000-000000000009', folder: 'inbox', subject: 'Re: 프로덕트 로드맵 공유', sender: 'cto@company.io', date: '2026-05-15T14:20:00Z', read: true, body: 'H2 로드맵 검토했습니다. AI 기능 우선순위를 상향 조정하는 방향으로 논의해봅시다.' },
    { id: 'b0020000-0000-0000-0000-000000000010', folder: 'inbox', subject: '고객사 A사 NPS 점수 하락 — 대응 필요', sender: 'csm@company.io', date: '2026-05-14T10:00:00Z', read: true, body: 'A사 NPS가 지난 분기 대비 15점 하락했습니다. 원인 분석과 대응 방안을 논의해야 합니다.' },
    { id: 'b0020000-0000-0000-0000-000000000011', folder: 'inbox', subject: '투자자 미팅 자료 준비 요청 (5/22)', sender: 'cfo@company.io', date: '2026-05-14T08:45:00Z', read: false, body: '5월 22일 시리즈 A 투자자 미팅 자료를 5월 19일까지 준비해주세요.' },
    { id: 'b0020000-0000-0000-0000-000000000012', folder: 'inbox', subject: 'GitHub Actions CI 실패 알림', sender: 'noreply@github.com', date: '2026-05-13T22:15:00Z', read: true, body: '[agentic-inbox] CI workflow failed on branch main. 3 tests failed.' },
    { id: 'b0020000-0000-0000-0000-000000000013', folder: 'inbox', subject: '월간 보고서 제출 요청 (5월)', sender: 'management@company.io', date: '2026-05-13T09:00:00Z', read: true, body: '5월 월간 운영 보고서를 5월 31일까지 제출해주세요.' },
    { id: 'b0020000-0000-0000-0000-000000000014', folder: 'inbox', subject: 'B사 견적 문의 — 엔터프라이즈 플랜', sender: 'procurement@bcompany.com', date: '2026-05-12T13:30:00Z', read: true, body: '엔터프라이즈 플랜 100석 기준 견적을 요청드립니다. 연간 계약 조건도 함께 안내 바랍니다.' },
    { id: 'b0020000-0000-0000-0000-000000000015', folder: 'inbox', subject: '보안 패치 긴급 적용 안내', sender: 'security@company.io', date: '2026-05-12T08:00:00Z', read: false, body: 'CVE-2026-1234 관련 긴급 보안 패치가 배포되었습니다. 72시간 내 적용 필수입니다.' },
    { id: 'b0020000-0000-0000-0000-000000000016', folder: 'inbox', subject: '주간 스프린트 회의 안건', sender: 'pm@company.io', date: '2026-05-12T07:30:00Z', read: true, body: '이번 주 스프린트 회의 안건 공유드립니다. 화요일 오전 10시 Zoom 링크 첨부.' },
    { id: 'b0020000-0000-0000-0000-000000000017', folder: 'inbox', subject: 'C사 기술 검토 피드백', sender: 'cto@ccompany.io', date: '2026-05-11T16:00:00Z', read: true, body: '지난주 기술 검토 결과를 공유드립니다. 전반적으로 긍정적이나 데이터 보안 부분 보완 요청드립니다.' },
    { id: 'b0020000-0000-0000-0000-000000000018', folder: 'inbox', subject: '결제 시스템 오류 — 즉각 대응 요망', sender: 'ops@company.io', date: '2026-05-11T11:20:00Z', read: true, body: '오전 11시부터 결제 모듈에서 간헐적 오류가 발생하고 있습니다. 즉시 확인 바랍니다.' },
    { id: 'b0020000-0000-0000-0000-000000000019', folder: 'inbox', subject: '특허 출원 관련 서류 검토 요청', sender: 'ip@lawfirm.co.kr', date: '2026-05-10T14:00:00Z', read: true, body: 'AI 알고리즘 관련 특허 출원 서류를 검토해주시기 바랍니다. 기한은 5월 17일입니다.' },
    { id: 'b0020000-0000-0000-0000-000000000020', folder: 'inbox', subject: 'D사 POC 결과 보고', sender: 'sales@company.io', date: '2026-05-10T10:30:00Z', read: true, body: 'D사 POC를 성공적으로 완료했습니다. 정식 계약으로 전환 논의가 필요합니다.' },
    { id: 'b0020000-0000-0000-0000-000000000021', folder: 'inbox', subject: '팀 오프사이트 장소 추천 요청', sender: 'admin@company.io', date: '2026-05-09T15:00:00Z', read: true, body: '6월 팀 오프사이트 행사 장소를 추천해주세요. 인원 25명, 1박 2일 기준입니다.' },
    { id: 'b0020000-0000-0000-0000-000000000022', folder: 'inbox', subject: '[웨비나] AI 기반 고객 서비스 자동화', sender: 'events@techsummit.io', date: '2026-05-09T08:00:00Z', read: false, body: '5월 28일 AI 기반 고객 서비스 자동화 웨비나에 초대합니다.' },
    { id: 'b0020000-0000-0000-0000-000000000023', folder: 'inbox', subject: '연봉 협상 일정 안내', sender: 'hr@company.io', date: '2026-05-08T10:00:00Z', read: true, body: '2026년도 연봉 협상 일정을 안내드립니다. 5월 20일~30일 진행 예정입니다.' },
    { id: 'b0020000-0000-0000-0000-000000000024', folder: 'inbox', subject: 'E사 SLA 위반 클레임 접수', sender: 'support@ecompany.kr', date: '2026-05-08T09:00:00Z', read: false, body: '지난달 SLA 기준 미달 관련 공식 클레임을 접수하였습니다. 5영업일 내 답변 요청드립니다.' },
    { id: 'b0020000-0000-0000-0000-000000000025', folder: 'inbox', subject: '데이터 분석 보고서 — 4월 사용자 현황', sender: 'analytics@company.io', date: '2026-05-07T09:00:00Z', read: true, body: '4월 사용자 현황 데이터 분석 보고서를 공유드립니다. MAU 23% 성장을 기록했습니다.' },

    // ── sent ──────────────────────────────────────────────────────────
    { id: 'b0020000-0000-0000-0000-000000000031', folder: 'sent', subject: 'Re: [긴급] 서버 장애 발생', sender: 'bzengage@example.com', recipient: 'infra@company.io', date: '2026-05-17T08:35:00Z', read: true, body: '확인했습니다. 팀에 즉시 공유하고 30분 내 상황 공유하겠습니다.' },
    { id: 'b0020000-0000-0000-0000-000000000032', folder: 'sent', subject: 'Re: 신규 파트너십 제안', sender: 'bzengage@example.com', recipient: 'bd@techcorp.kr', date: '2026-05-17T11:00:00Z', read: true, body: '제안 감사합니다. 다음 주 미팅을 통해 구체적인 협력 방안을 논의해보고 싶습니다.' },
    { id: 'b0020000-0000-0000-0000-000000000033', folder: 'sent', subject: 'Re: API 연동 문서 검토', sender: 'bzengage@example.com', recipient: 'dev@partnerco.com', date: '2026-05-16T16:00:00Z', read: true, body: '문서 검토 완료했습니다. 섹션 3의 인증 방식 수정이 필요합니다. 상세 피드백 첨부합니다.' },
    { id: 'b0020000-0000-0000-0000-000000000034', folder: 'sent', subject: 'Q1 성과 리포트 공유', sender: 'bzengage@example.com', recipient: 'management@company.io', date: '2026-05-15T10:00:00Z', read: true, body: 'Q1 팀 성과 리포트를 공유드립니다. 매출 목표 115% 달성했습니다.' },
    { id: 'b0020000-0000-0000-0000-000000000035', folder: 'sent', subject: 'B사 엔터프라이즈 견적서', sender: 'bzengage@example.com', recipient: 'procurement@bcompany.com', date: '2026-05-13T14:00:00Z', read: true, body: '엔터프라이즈 플랜 100석 기준 견적서를 첨부해드립니다.' },

    // ── starred (inbox) ───────────────────────────────────────────────
    { id: 'b0020000-0000-0000-0000-000000000041', folder: 'inbox', subject: '[중요] 이사회 보고 자료 — 최종 검토', sender: 'board@company.io', date: '2026-05-16T08:00:00Z', read: false, starred: true, body: '6월 이사회 보고 자료 최종 검토를 요청드립니다. 5월 28일까지 제출 바랍니다.' },
    { id: 'b0020000-0000-0000-0000-000000000042', folder: 'inbox', subject: '[중요] Series A 텀시트 수령', sender: 'partner@vcfund.com', date: '2026-05-11T09:00:00Z', read: true, starred: true, body: 'Series A 투자 관련 텀시트를 첨부합니다. 검토 후 협의를 진행하겠습니다.' },
];

const client = await pool.connect();
try {
  await client.query('BEGIN');
  const { rows: folders } = await client.query('SELECT slug, id FROM folders WHERE mailbox_id = $1', [mailboxId]);
  const folderId = Object.fromEntries(folders.map((folder) => [folder.slug, folder.id]));
  const missing = [...new Set(emails.map((email) => email.folder))].filter((slug) => !folderId[slug]);
  if (missing.length) throw new Error(`Run the migrations first. No folder for mailbox ${mailboxId}: ${missing.join(', ')}`);

  let inserted = 0;
  for (const email of emails) {
    const result = await client.query(
      `INSERT INTO emails (id, mailbox_id, folder_id, thread_id, subject, sender, recipient, body_text, body_html,
         email_date, is_read, is_starred)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO NOTHING`,
      [email.id, mailboxId, folderId[email.folder], email.thread || email.id, email.subject, email.sender,
        email.recipient || 'bzengage@example.com', email.body, `<p>${email.body}</p>`,
        email.date, email.read ?? false, email.starred ?? false],
    );
    inserted += result.rowCount;
  }
  await client.query('COMMIT');
  console.log(`Seeded ${inserted} of ${emails.length} sample emails`);
} catch (error) {
  // Nothing is left half-written, and a caller can tell the run failed.
  await client.query('ROLLBACK');
  console.error('Seed failed:', error.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
