import { query } from './db.js';

async function seed() {
  const mailboxId = '00000000-0000-0000-0000-000000000001';

  // Get folder IDs
  const { rows: folders } = await query('SELECT id, slug FROM folders WHERE mailbox_id = $1', [mailboxId]);
  const folderMap = Object.fromEntries(folders.map(f => [f.slug, f.id]));

  const emails = [
    { id: 'a0010000-0000-0000-0000-000000000001', folder: 'inbox', subject: '웹사이트 리디자인 견적 문의드립니다', sender: 'client@designcorp.com', recipient: 'bzengage@example.com', date: '2026-04-15T09:30:00.000Z', read: true, thread: 'thread-web-redesign', body: '안녕하세요, 견적 문의드립니다.' },
    { id: 'a0010000-0000-0000-0000-000000000002', folder: 'sent', subject: 'Re: 웹사이트 리디자인 견적 문의드립니다', sender: 'bzengage@example.com', recipient: 'client@designcorp.com', date: '2026-04-15T14:20:00.000Z', read: true, thread: 'thread-web-redesign', body: '견적 문의 감사합니다.' },
    { id: 'a0010000-0000-0000-0000-000000000003', folder: 'inbox', subject: '4월 미팅 일정 조율 요청', sender: 'partner@techventure.co.kr', recipient: 'bzengage@example.com', date: '2026-04-18T10:00:00.000Z', read: true, thread: 'thread-meeting-april', body: '미팅 일정 조율 요청드립니다.' },
    { id: 'a0010000-0000-0000-0000-000000000004', folder: 'sent', subject: 'Re: 4월 미팅 일정 조율 요청', sender: 'bzengage@example.com', recipient: 'partner@techventure.co.kr', date: '2026-04-18T11:30:00.000Z', read: true, thread: 'thread-meeting-april', body: '화요일 오후 2시 어떠신가요?' },
    { id: 'a0010000-0000-0000-0000-000000000005', folder: 'inbox', subject: '3월 인보이스 발송', sender: 'billing@cloudservice.io', recipient: 'bzengage@example.com', date: '2026-04-20T09:00:00.000Z', read: true, thread: 'thread-invoice-march', body: '3월 인보이스를 발송드립니다.' },
    { id: 'a0010000-0000-0000-0000-000000000006', folder: 'inbox', subject: '주간 AI 뉴스레터', sender: 'newsletter@techhub.com', recipient: 'bzengage@example.com', date: '2026-04-22T07:00:00.000Z', read: false, thread: 'a0010000-0000-0000-0000-000000000006', body: '주간 AI 뉴스레터입니다.' },
    { id: 'a0010000-0000-0000-0000-000000000007', folder: 'spam', subject: '축하드립니다! 당첨!', sender: 'spam@lottery-event.kr', recipient: 'bzengage@example.com', date: '2026-04-24T03:30:00.000Z', read: false, thread: 'a0010000-0000-0000-0000-000000000007', body: '당신은 1억원에 당첨되셨습니다!' },
  ];

  for (const e of emails) {
    await query(
      `INSERT INTO emails (id, mailbox_id, folder_id, thread_id, subject, sender, recipient, body_text, body_html, email_date, is_read, is_starred)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO NOTHING`,
      [e.id, mailboxId, folderMap[e.folder], e.thread, e.subject, e.sender, e.recipient, e.body, `<p>${e.body}</p>`, e.date, e.read, false]
    );
  }

  console.log('Seeded', emails.length, 'emails');
}

seed().catch(console.error).finally(() => process.exit());
