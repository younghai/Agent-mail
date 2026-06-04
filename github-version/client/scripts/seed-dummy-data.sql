-- Dummy data seed for agentic-inbox local development

-- ============================================
-- THREAD 1: Website Redesign Quote
-- ============================================

-- Email 1: Client inquiry (INBOX)
INSERT INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('e001', 'inbox', '웹사이트 리디자인 견적 문의드립니다', 'client@designcorp.com', 'bzengage@example.com', '2026-04-15T09:30:00.000Z', 1, 0, '<html><body><p>안녕하세요,</p><p>저희 회사 홈페이지 리디자인을 검토 중입니다. <strong>견적과 일정</strong>을 문의드립니다.</p><p>주요 요구사항:</p><ul><li>반응형 디자인</li><li>콘텐츠 관리 시스템(CMS) 연동</li><li>SEO 최적화</li></ul><p>검토 부탁드립니다.</p><p>감사합니다.<br>김철수 드림<br>디자인코퍼레이션 마케팅팀</p></body></html>', NULL, NULL, 'thread-web-redesign', 'msg-e001', '[{"key":"from","value":"김철수 <client@designcorp.com>"},{"key":"to","value":"bzengage@example.com"},{"key":"subject","value":"웹사이트 리디자인 견적 문의드립니다"},{"key":"date","value":"2026-04-15T09:30:00.000Z"},{"key":"message-id","value":"<msg-e001>"}]', NULL, NULL);

-- Email 2: Our reply (SENT)
INSERT INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('e002', 'sent', 'Re: 웹사이트 리디자인 견적 문의드립니다', 'bzengage@example.com', 'client@designcorp.com', '2026-04-15T14:20:00.000Z', 1, 0, '<html><body><p>김철수 님, 안녕하세요.</p><p>견적 문의 감사합니다. 몇 가지 추가 질문드립니다:</p><ol><li>예상 페이지 수가 어떻게 되실까요?</li><li>기존 콘텐츠 마이그레이션이 필요하신가요?</li><li>희망 런칭 일정이 있으신가요?</li></ol><p>답변 주시면 상세 견적서를 준비하겠습니다.</p><p>감사합니다.<br>비즈매트릭스 팀</p></body></html>', 'msg-e001', '["msg-e001"]', 'thread-web-redesign', 'msg-e002', '[{"key":"from","value":"비즈매트릭스 <bzengage@example.com>"},{"key":"to","value":"client@designcorp.com"},{"key":"subject","value":"Re: 웹사이트 리디자인 견적 문의드립니다"},{"key":"date","value":"2026-04-15T14:20:00.000Z"},{"key":"message-id","value":"<msg-e002>"},{"key":"in-reply-to","value":"<msg-e001>"},{"key":"references","value":"<msg-e001>"}]', NULL, NULL);

-- Email 3: Client follow-up (INBOX)
INSERT INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('e003', 'inbox', 'Re: 웹사이트 리디자인 견적 문의드립니다', 'client@designcorp.com', 'bzengage@example.com', '2026-04-16T08:45:00.000Z', 1, 0, '<html><body><p>안녕하세요,</p><p>답변드립니다.</p><ul><li>예상 페이지 수는 <strong>약 10페이지</strong> 정도입니다.</li><li>기존 블로그 콘텐츠 50여 개의 마이그레이션이 필요합니다.</li><li>희망 런칭은 6월 말까지입니다.</li></ul><p>추가로 브랜드 가이드라인 PDF를 첨부드립니다.</p><p>감사합니다.<br>김철수 드림</p></body></html>', 'msg-e002', '["msg-e001","msg-e002"]', 'thread-web-redesign', 'msg-e003', '[{"key":"from","value":"김철수 <client@designcorp.com>"},{"key":"to","value":"bzengage@example.com"},{"key":"subject","value":"Re: 웹사이트 리디자인 견적 문의드립니다"},{"key":"date","value":"2026-04-16T08:45:00.000Z"},{"key":"message-id","value":"<msg-e003>"},{"key":"in-reply-to","value":"<msg-e002>"},{"key":"references","value":"<msg-e001> <msg-e002>"}]', NULL, NULL);

-- Email 4: Our reply with attachment (SENT)
INSERT INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('e004', 'sent', 'Re: 웹사이트 리디자인 견적 문의드립니다', 'bzengage@example.com', 'client@designcorp.com', '2026-04-16T16:00:00.000Z', 1, 1, '<html><body><p>김철수 님, 안녕하세요.</p><p>확인 감사합니다. 요청하신 사항을 반영한 <strong>견적서를 첨부</strong>드립니다.</p><table border="1" cellpadding="6"><tr><th>항목</th><th>금액</th></tr><tr><td>디자인 (10페이지)</td><td>₩3,500,000</td></tr><tr><td>개발 (반응형 + CMS)</td><td>₩4,500,000</td></tr><tr><td>콘텐츠 마이그레이션</td><td>₩1,000,000</td></tr><tr><td>합계</td><td><strong>₩9,000,000</strong></td></tr></table><p>검토 후 회신 부탁드립니다.</p><p>감사합니다.<br>비즈매트릭스 팀</p></body></html>', 'msg-e003', '["msg-e001","msg-e002","msg-e003"]', 'thread-web-redesign', 'msg-e004', '[{"key":"from","value":"비즈매트릭스 <bzengage@example.com>"},{"key":"to","value":"client@designcorp.com"},{"key":"subject","value":"Re: 웹사이트 리디자인 견적 문의드립니다"},{"key":"date","value":"2026-04-16T16:00:00.000Z"},{"key":"message-id","value":"<msg-e004>"},{"key":"in-reply-to","value":"<msg-e003>"},{"key":"references","value":"<msg-e001> <msg-e002> <msg-e003>"}]', NULL, NULL);

INSERT INTO attachments (id, email_id, filename, mimetype, size, content_id, disposition) VALUES
('att001', 'e004', '견적서_웹사이트리디자인.pdf', 'application/pdf', 245760, NULL, 'attachment');

-- ============================================
-- THREAD 2: Meeting Schedule
-- ============================================

-- Email 5: Meeting request (INBOX)
INSERT INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('e005', 'inbox', '4월 미팅 일정 조율 요청', 'partner@techventure.co.kr', 'bzengage@example.com', '2026-04-18T10:00:00.000Z', 1, 0, '<html><body><p>비즈매트릭스 팀 여러분, 안녕하세요.</p><p>다음 주 <strong>신규 파트너십 관련 미팅</strong>을 제안드립니다.</p><p>가능한 시간대를 공유드립니다:</p><ul><li>4월 22일 (화) 오전 10시 ~ 12시</li><li>4월 23일 (수) 오후 2시 ~ 4시</li><li>4월 24일 (목) 오전 11시 ~ 1시</li></ul><p>편하신 시간대 회신 부탁드립니다.</p><p>감사합니다.<br>박영희 드림<br>테크벤처 파트너십팀</p></body></html>', NULL, NULL, 'thread-meeting-april', 'msg-e005', '[{"key":"from","value":"박영희 <partner@techventure.co.kr>"},{"key":"to","value":"bzengage@example.com"},{"key":"subject","value":"4월 미팅 일정 조율 요청"},{"key":"date","value":"2026-04-18T10:00:00.000Z"},{"key":"message-id","value":"<msg-e005>"}]', NULL, NULL);

-- Email 6: Our reply (SENT)
INSERT INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('e006', 'sent', 'Re: 4월 미팅 일정 조율 요청', 'bzengage@example.com', 'partner@techventure.co.kr', '2026-04-18T11:30:00.000Z', 1, 0, '<html><body><p>박영희 님, 안녕하세요.</p><p>미팅 제안 감사합니다.</p><p>4월 22일 <strong>화요일 오후 2시</strong>로 진행하면 어떠실까요? 장소는 저희 사무실(강남구 테헤란로 123)이 편하실 것 같습니다.</p><p>일정 확인 후 회신 부탁드립니다.</p><p>감사합니다.<br>비즈매트릭스 팀</p></body></html>', 'msg-e005', '["msg-e005"]', 'thread-meeting-april', 'msg-e006', '[{"key":"from","value":"비즈매트릭스 <bzengage@example.com>"},{"key":"to","value":"partner@techventure.co.kr"},{"key":"subject","value":"Re: 4월 미팅 일정 조율 요청"},{"key":"date","value":"2026-04-18T11:30:00.000Z"},{"key":"message-id","value":"<msg-e006>"},{"key":"in-reply-to","value":"<msg-e005>"},{"key":"references","value":"<msg-e005>"}]', NULL, NULL);

-- Email 7: Partner confirmation (INBOX)
INSERT INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('e007', 'inbox', 'Re: 4월 미팅 일정 조율 요청', 'partner@techventure.co.kr', 'bzengage@example.com', '2026-04-18T14:15:00.000Z', 0, 0, '<html><body><p>비즈매트릭스 팀, 안녕하세요.</p><p>네, <strong>4월 22일 화요일 오후 2시</strong>로 확정하겠습니다.</p><p>강남구 테헤란로 123으로 방문하겠습니다. 미팅 당일 뵙겠습니다.</p><p>감사합니다.<br>박영희 드림</p></body></html>', 'msg-e006', '["msg-e005","msg-e006"]', 'thread-meeting-april', 'msg-e007', '[{"key":"from","value":"박영희 <partner@techventure.co.kr>"},{"key":"to","value":"bzengage@example.com"},{"key":"subject","value":"Re: 4월 미팅 일정 조율 요청"},{"key":"date","value":"2026-04-18T14:15:00.000Z"},{"key":"message-id","value":"<msg-e007>"},{"key":"in-reply-to","value":"<msg-e006>"},{"key":"references","value":"<msg-e005> <msg-e006>"}]', NULL, NULL);

-- ============================================
-- THREAD 3: Invoice & Payment
-- ============================================

-- Email 8: Invoice received (INBOX) with attachment
INSERT INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('e008', 'inbox', '3월 인보이스 발송 - 클라우드 서비스 이용료', 'billing@cloudservice.io', 'bzengage@example.com', '2026-04-20T09:00:00.000Z', 1, 0, '<html><body><p>비즈매트릭스 담당자님, 안녕하세요.</p><p>2026년 3월 클라우드 서비스 이용료 <strong>인보이스</strong>를 발송드립니다.</p><table border="1" cellpadding="6"><tr><th>항목</th><th>금액</th></tr><tr><td>Compute Instances (3대)</td><td>₩450,000</td></tr><tr><td>Storage (500GB)</td><td>₩75,000</td></tr><tr><td>Bandwidth</td><td>₩120,000</td></tr><tr><td>합계 (부가세 별도)</td><td><strong>₩645,000</strong></td></tr></table><p>결제 기한: <strong>2026년 4월 30일</strong></p><p>인보이서 PDF를 첨부드리오니 확인 부탁드립니다.</p><p>감사합니다.<br>클라우드서비스 청구팀</p></body></html>', NULL, NULL, 'thread-invoice-march', 'msg-e008', '[{"key":"from","value":"클라우드서비스 청구팀 <billing@cloudservice.io>"},{"key":"to","value":"bzengage@example.com"},{"key":"subject","value":"3월 인보이스 발송 - 클라우드 서비스 이용료"},{"key":"date","value":"2026-04-20T09:00:00.000Z"},{"key":"message-id","value":"<msg-e008>"}]', NULL, NULL);

INSERT INTO attachments (id, email_id, filename, mimetype, size, content_id, disposition) VALUES
('att002', 'e008', 'Invoice_2026_03_CloudService.pdf', 'application/pdf', 183500, NULL, 'attachment');

-- Email 9: Our payment confirmation (SENT)
INSERT INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('e009', 'sent', 'Re: 3월 인보이스 발송 - 클라우드 서비스 이용료', 'bzengage@example.com', 'billing@cloudservice.io', '2026-04-21T13:00:00.000Z', 1, 0, '<html><body><p>클라우드서비스 청구팀, 안녕하세요.</p><p>3월 인보이스 확인했습니다. <strong>이번 주 내로 결제 진행</strong>하겠습니다.</p><p>결제 완료 후 영수증을 다시 공유드리겠습니다.</p><p>감사합니다.<br>비즈매트릭스 팀</p></body></html>', 'msg-e008', '["msg-e008"]', 'thread-invoice-march', 'msg-e009', '[{"key":"from","value":"비즈매트릭스 <bzengage@example.com>"},{"key":"to","value":"billing@cloudservice.io"},{"key":"subject","value":"Re: 3월 인보이스 발송 - 클라우드 서비스 이용료"},{"key":"date","value":"2026-04-21T13:00:00.000Z"},{"key":"message-id","value":"<msg-e009>"},{"key":"in-reply-to","value":"<msg-e008>"},{"key":"references","value":"<msg-e008>"}]', NULL, NULL);

-- ============================================
-- STANDALONE EMAILS
-- ============================================

-- Email 10: Newsletter (INBOX)
INSERT INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('e010', 'inbox', '주간 AI 뉴스레터 - 2026년 4월 3주차', 'newsletter@techhub.com', 'bzengage@example.com', '2026-04-22T07:00:00.000Z', 0, 0, '<html><body><h2>🚀 주간 AI 뉴스레터</h2><p>이번 주 주요 소식입니다:</p><ul><li><strong>OpenAI GPT-5</strong> 베타 출시 임박</li><li><strong>구글 DeepMind</strong>, 새로운 단백질 구조 예측 모델 발표</li><li><strong>국내 스타트업</strong> AI 반도체 투자 유치 소식</li></ul><p><a href="https://techhub.com">자세히 보기</a></p><p>구독 해지는 <a href="#">여기</a>를 클릭하세요.</p></body></html>', NULL, NULL, 'e010', 'msg-e010', '[{"key":"from","value":"TechHub <newsletter@techhub.com>"},{"key":"to","value":"bzengage@example.com"},{"key":"subject","value":"주간 AI 뉴스레터 - 2026년 4월 3주차"},{"key":"date","value":"2026-04-22T07:00:00.000Z"},{"key":"message-id","value":"<msg-e010>"}]', NULL, NULL);

-- Email 11: Server maintenance notice (INBOX)
INSERT INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('e011', 'inbox', '[중요] 서버 점검 안내 - 4월 25일 새벽 2시 ~ 6시', 'notice@cloudhost.com', 'bzengage@example.com', '2026-04-23T11:00:00.000Z', 1, 1, '<html><body><h2>서버 점검 안내</h2><p>안녕하세요. 클라우드호스트입니다.</p><p>서비스 안정성 향상을 위한 <strong>정기 점검</strong>을 진행합니다.</p><table border="1" cellpadding="6"><tr><th>항목</th><th>내용</th></tr><tr><td>점검 일시</td><td>2026년 4월 25일 (토) 02:00 ~ 06:00 (KST)</td></tr><tr><td>영향 범위</td><td>웹사이트 접속 일시 중단 (최대 30분)</td></tr><tr><td>대상 서버</td><td>web-01, web-02, db-primary</td></tr></table><p>문의사항은 고객센터로 연락 부탁드립니다.</p></body></html>', NULL, NULL, 'e011', 'msg-e011', '[{"key":"from","value":"CloudHost <notice@cloudhost.com>"},{"key":"to","value":"bzengage@example.com"},{"key":"subject","value":"[중요] 서버 점검 안내 - 4월 25일 새벽 2시 ~ 6시"},{"key":"date","value":"2026-04-23T11:00:00.000Z"},{"key":"message-id","value":"<msg-e011>"}]', NULL, NULL);

-- Email 12: Spam (SPAM folder)
INSERT INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('e012', 'spam', '축하드립니다! 당신은 1억원에 당첨되셨습니다!', 'spam@lottery-event.kr', 'bzengage@example.com', '2026-04-24T03:30:00.000Z', 0, 0, '<html><body><h1>🎉 축하드립니다!</h1><p>당신은 <strong>2026년 봄맞이 특별 이벤트</strong>에 당첨되셨습니다.</p><p>상금: <span style="color:red;font-size:24px">₩100,000,000</span></p><p>지금 바로 <a href="http://suspicious-link.example">여기</a>를 클릭하여 수령하세요!</p><p>기한: 24시간 이내</p></body></html>', NULL, NULL, 'e012', 'msg-e012', '[{"key":"from","value":"이벤트센터 <spam@lottery-event.kr>"},{"key":"to","value":"bzengage@example.com"},{"key":"subject","value":"축하드립니다! 당신은 1억원에 당첨되셨습니다!"},{"key":"date","value":"2026-04-24T03:30:00.000Z"},{"key":"message-id","value":"<msg-e012>"}]', NULL, NULL);

-- Email 13: Internal project update (SENT) with attachment
INSERT INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('e013', 'sent', '4월 프로젝트 진행 상황 공유', 'bzengage@example.com', 'team@bizmatrixx.com', '2026-04-25T16:30:00.000Z', 1, 0, '<html><body><p>팀 여러분, 안녕하세요.</p><p>4월 프로젝트 진행 상황을 공유드립니다.</p><ul><li>Agentic Inbox MVP: <strong>90% 완료</strong></li><li>Cloudflare Workers 마이그레이션: <strong>완료</strong></li><li>AI 에이전트 통합 테스트: <strong>진행 중</strong></li></ul><p>상세 내용은 첨부된 엑셀 파일을 확인해 주세요.</p><p>감사합니다.</p></body></html>', NULL, NULL, 'e013', 'msg-e013', '[{"key":"from","value":"비즈매트릭스 <bzengage@example.com>"},{"key":"to","value":"team@bizmatrixx.com"},{"key":"subject","value":"4월 프로젝트 진행 상황 공유"},{"key":"date","value":"2026-04-25T16:30:00.000Z"},{"key":"message-id","value":"<msg-e013>"}]', 'cc@bizmatrixx.com', NULL);

INSERT INTO attachments (id, email_id, filename, mimetype, size, content_id, disposition) VALUES
('att003', 'e013', '4월_프로젝트_진행상황.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 51200, NULL, 'attachment');

-- Email 14: Job application (INBOX)
INSERT INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('e014', 'inbox', '[지원] 백엔드 개발자 지원 - 홍길동', 'applicant@devmail.com', 'bzengage@example.com', '2026-04-26T10:15:00.000Z', 0, 0, '<html><body><p>비즈매트릭스 채용팀 담당자님, 안녕하세요.</p><p>홍길동입니다. 백엔드 개발자 포지션에 지원하고자 이력서를 보내드립니다.</p><p><strong>주요 경력:</strong></p><ul><li>Node.js / TypeScript 5년</li><li>PostgreSQL, Redis 운영 경험</li><li>Cloudflare Workers, AWS Lambda 서버리스 경험</li></ul><p>검토 부탁드립니다.</p></body></html>', NULL, NULL, 'e014', 'msg-e014', '[{"key":"from","value":"홍길동 <applicant@devmail.com>"},{"key":"to","value":"bzengage@example.com"},{"key":"subject","value":"[지원] 백엔드 개발자 지원 - 홍길동"},{"key":"date","value":"2026-04-26T10:15:00.000Z"},{"key":"message-id","value":"<msg-e014>"}]', NULL, NULL);

-- Email 15: Marketing collaboration offer (INBOX)
INSERT INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('e015', 'inbox', '마케팅 콜라보 제안드립니다', 'marketing@brandpartner.kr', 'bzengage@example.com', '2026-04-27T14:00:00.000Z', 1, 0, '<html><body><p>비즈매트릭스 팀, 안녕하세요.</p><p>브랜드파트너 마케팅팀입니다. 귀사와의 <strong>콘텐츠 마케팅 콜라보레이션</strong>을 제안드리고자 합니다.</p><p>제안 개요:</p><ul><li>기술 블로그 게스트 포스팅 교환</li><li>소셜 미디어 크로스 프로모션</li><li>웨비나 공동 주최</li></ul><p>관심 있으시면 미팅 일정을 조율하겠습니다.</p><p>감사합니다.<br>브랜드파트너 마케팅팀</p></body></html>', NULL, NULL, 'e015', 'msg-e015', '[{"key":"from","value":"브랜드파트너 <marketing@brandpartner.kr>"},{"key":"to","value":"bzengage@example.com"},{"key":"subject","value":"마케팅 콜라보 제안드립니다"},{"key":"date","value":"2026-04-27T14:00:00.000Z"},{"key":"message-id","value":"<msg-e015>"}]', NULL, NULL);

-- Email 16: Sent follow-up (SENT)
INSERT INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('e016', 'sent', 'Re: 마케팅 콜라보 제안드립니다', 'bzengage@example.com', 'marketing@brandpartner.kr', '2026-04-28T09:30:00.000Z', 1, 0, '<html><body><p>브랜드파트너 마케팅팀, 안녕하세요.</p><p>콜라보 제안 감사합니다. <strong>기술 블로그 게스트 포스팅</strong> 아이디어가 흥미롭습니다.</p><p>다음 주 초에 구체적인 방향성을 가지고 다시 연락드리겠습니다.</p><p>감사합니다.<br>비즈매트릭스 팀</p></body></html>', 'msg-e015', '["msg-e015"]', 'e015', 'msg-e016', '[{"key":"from","value":"비즈매트릭스 <bzengage@example.com>"},{"key":"to","value":"marketing@brandpartner.kr"},{"key":"subject","value":"Re: 마케팅 콜라보 제안드립니다"},{"key":"date","value":"2026-04-28T09:30:00.000Z"},{"key":"message-id","value":"<msg-e016>"},{"key":"in-reply-to","value":"<msg-e015>"},{"key":"references","value":"<msg-e015>"}]', NULL, NULL);
