-- Inbox dummy emails: 2026-05-22 ~ 2026-05-30 09:00 KST (2026-05-29T23:59Z UTC)
-- Continues from existing data (last inbox: sam-20-e3 on 2026-05-21T01:15Z)

-- 5/22 (Thursday) 09:30 KST — S25 Edge: 오지민이 홈페이지 배너 브리핑 전달
INSERT OR IGNORE INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('new-22-e1', 'inbox', 'Re: [긴급] 갤럭시 S25 Edge 런칭 일정 앞당김 — 홈페이지 배너 브리핑 전달', 'jimin.oh@samsung.com', 'bzengage@example.com', '2026-05-22T00:30:00.000Z', 0, 1,
'<html><body><p>비즈매트릭스 팀, 안녕하세요. 오지민입니다.</p><p>바쁘신 와중에 긴급 요청 드려 죄송합니다. 갤럭시 S25 Edge 홈페이지 메인 배너 브리핑을 전달드립니다.</p><h3>브리핑 상세:</h3><ul><li>사이즈: 1920x600 (PC) / 768x400 (Mobile)</li><li>카피: "Galaxy S25 Edge — 경계를 넘다"</li><li>컨셉: 엣지 디자인 강조, 다크 그라데이션 배경</li><li>CTA: "사전예약하기"</li></ul><p>1차 시안을 <strong>오늘 중</strong>으로 전달 부탁드립니다.</p><p>감사합니다.<br>오지민 드림<br>삼성전자 디지털마케팅팀</p></body></html>',
'msg-recent-s2', '["msg-recent-s2"]', 'recent-s2', 'msg-new-22-e1',
'[{"key":"from","value":"오지민 <jimin.oh@samsung.com>"},{"key":"to","value":"bzengage@example.com"},{"key":"subject","value":"Re: [긴급] 갤럭시 S25 Edge 런칭 일정 앞당김 — 홈페이지 배너 브리핑 전달"},{"key":"date","value":"2026-05-22T00:30:00.000Z"},{"key":"message-id","value":"<msg-new-22-e1>"},{"key":"in-reply-to","value":"<msg-recent-s2>"},{"key":"references","value":"<msg-recent-s2>"}]',
NULL, NULL);

-- 5/22 (Thursday) 15:00 KST — Odyssey OLED G9: 백수빈이 1차 시안 피드백
INSERT OR IGNORE INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('new-22-e2', 'inbox', 'Re: [요청] 삼성 Odyssey OLED G9 카카오톡 비즈 배너 디자인 의뢰 - 1차 시안 피드백', 'subeen.baek@samsung.com', 'bzengage@example.com', '2026-05-22T06:00:00.000Z', 0, 0,
'<html><body><p>비즈매트릭스 팀, 안녕하세요. 백수빈입니다.</p><p>1차 시안 잘 받았습니다. 전반적인 방향은 좋으나 아래 수정을 요청드립니다.</p><h3>수정 요청 사항:</h3><ol><li>배경 그라데이션을 더 어둡게 — 모니터 제품 특성상 다크 톤 강조 필요</li><li>제품 이미지 크기 10% 확대</li><li>카피 폰트를 삼성 브랜드 폰트(SamsungOne)로 교체</li><li>카카오톡 배너 규격 재확인 — 800x400 기준 적용</li></ol><p>수정본을 <strong>5월 26일(월)</strong>까지 전달 부탁드립니다.</p><p>감사합니다.<br>백수빈 드림<br>삼성전자 프로덕트마케팅팀</p></body></html>',
'msg-sam-21-e2', '["msg-sam-21-e1","msg-sam-21-e2"]', 'thread-samsung-21', 'msg-new-22-e2',
'[{"key":"from","value":"백수빈 <subeen.baek@samsung.com>"},{"key":"to","value":"bzengage@example.com"},{"key":"subject","value":"Re: [요청] 삼성 Odyssey OLED G9 카카오톡 비즈 배너 디자인 의뢰 - 1차 시안 피드백"},{"key":"date","value":"2026-05-22T06:00:00.000Z"},{"key":"message-id","value":"<msg-new-22-e2>"},{"key":"in-reply-to","value":"<msg-sam-21-e2>"},{"key":"references","value":"<msg-sam-21-e1> <msg-sam-21-e2>"}]',
NULL, NULL);

-- 5/23 (Friday) 09:30 KST — 신규 의뢰: 갤럭시 탭 S10 FE 네이버쇼핑 배너
INSERT OR IGNORE INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('new-23-e1', 'inbox', '[요청] 갤럭시 탭 S10 FE 네이버쇼핑 배너 디자인 의뢰', 'daeun.jung@samsung.com', 'bzengage@example.com', '2026-05-23T00:30:00.000Z', 0, 0,
'<html><body><p>비즈매트릭스 팀, 안녕하세요. 삼성전자 퍼포먼스마케팅팀 정다은입니다.</p><p><strong>갤럭시 탭 S10 FE</strong> 네이버쇼핑 메인 배너 디자인을 의뢰드립니다.</p><h3>요청 사항:</h3><ul><li>플랫폼: 네이버쇼핑 메인 배너 (PC/Mobile)</li><li>PC 사이즈: 1200x400 / Mobile: 750x300</li><li>카피: "갤럭시 탭 S10 FE — 창의적인 일상을 위한 선택"</li><li>CTA: "지금 구매하기"</li><li>컨셉: 학생/직장인 라이프스타일 이미지 활용</li></ul><p>납기: <strong>6월 5일</strong><br>1차 시안은 <strong>5월 28일</strong>까지 부탁드립니다.</p><p>견적서도 함께 보내주시면 감사하겠습니다.</p><p>감사합니다.<br>정다은 드림<br>삼성전자 퍼포먼스마케팅팀</p></body></html>',
NULL, NULL, 'thread-tab-s10fe', 'msg-new-23-e1',
'[{"key":"from","value":"정다은 <daeun.jung@samsung.com>"},{"key":"to","value":"bzengage@example.com"},{"key":"subject","value":"[요청] 갤럭시 탭 S10 FE 네이버쇼핑 배너 디자인 의뢰"},{"key":"date","value":"2026-05-23T00:30:00.000Z"},{"key":"message-id","value":"<msg-new-23-e1>"}]',
NULL, NULL);

-- 5/23 (Friday) 14:00 KST — 갤럭시 링 SNS 캠페인: 백수빈이 브리핑 상세 전달
INSERT OR IGNORE INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('new-23-e2', 'inbox', 'Re: [신규 의뢰] 갤럭시 링 SNS 캠페인 배너 제작 요청 — 브리핑 상세 전달', 'subeen.baek@samsung.com', 'bzengage@example.com', '2026-05-23T05:00:00.000Z', 0, 0,
'<html><body><p>비즈매트릭스 팀, 안녕하세요. 백수빈입니다.</p><p>갤럭시 링 SNS 캠페인 배너 제작 관련 브리핑 상세를 전달드립니다.</p><h3>브리핑 상세:</h3><ul><li>채널별 사이즈:<br>- Instagram Feed: 1080x1080 (1:1)<br>- Instagram Stories/Reels: 1080x1920 (9:16)<br>- Facebook: 1200x630<br>- X(트위터): 1600x900</li><li>컬러 팔레트: 삼성 블루 (#1428A0) + 화이트 + 그레이 계열</li><li>메인 비주얼: 착용 라이프스타일 이미지 (별도 제공 예정)</li><li>카피 가이드: "건강한 일상, 갤럭시 링과 함께" — 영문 버전도 병행 제작</li></ul><p>소재 이미지는 <strong>내일(5/24)</strong> 중으로 전달드릴 예정입니다.<br>1차 시안을 <strong>5월 27일</strong>까지 부탁드립니다.</p><p>감사합니다.<br>백수빈 드림</p></body></html>',
'msg-recent-s3', '["msg-recent-s3"]', 'recent-s3', 'msg-new-23-e2',
'[{"key":"from","value":"백수빈 <subeen.baek@samsung.com>"},{"key":"to","value":"bzengage@example.com"},{"key":"subject","value":"Re: [신규 의뢰] 갤럭시 링 SNS 캠페인 배너 제작 요청 — 브리핑 상세 전달"},{"key":"date","value":"2026-05-23T05:00:00.000Z"},{"key":"message-id","value":"<msg-new-23-e2>"},{"key":"in-reply-to","value":"<msg-recent-s3>"},{"key":"references","value":"<msg-recent-s3>"}]',
NULL, NULL);

-- 5/26 (Monday) 10:00 KST — S25 Edge: 오지민이 모바일 앱 푸시 시안 컨펌 요청
INSERT OR IGNORE INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('new-26-e1', 'inbox', 'Re: [긴급] 갤럭시 S25 Edge — 모바일 앱 푸시 시안 검토 요청', 'jimin.oh@samsung.com', 'bzengage@example.com', '2026-05-26T01:00:00.000Z', 0, 1,
'<html><body><p>비즈매트릭스 팀, 안녕하세요. 오지민입니다.</p><p>홈페이지 메인 배너 잘 수령했습니다. 감사합니다.</p><p>이어서 <strong>모바일 앱 푸시 배너</strong> 시안 검토를 요청드립니다.</p><h3>모바일 앱 푸시 스펙:</h3><ul><li>사이즈: 1080x360 (Android) / 1125x432 (iOS)</li><li>파일 형식: PNG, 용량 200KB 이하</li><li>카피: "Galaxy S25 Edge 사전예약 — 지금 바로 혜택 확인"</li></ul><p>오늘(5/26) 중으로 1차 시안 전달 부탁드립니다.<br>마감이 <strong>5월 24일</strong>에서 하루 연장되었으나 더 이상 조정이 어렵습니다.</p><p>감사합니다.<br>오지민 드림</p></body></html>',
'msg-new-22-e1', '["msg-recent-s2","msg-new-22-e1"]', 'recent-s2', 'msg-new-26-e1',
'[{"key":"from","value":"오지민 <jimin.oh@samsung.com>"},{"key":"to","value":"bzengage@example.com"},{"key":"subject","value":"Re: [긴급] 갤럭시 S25 Edge — 모바일 앱 푸시 시안 검토 요청"},{"key":"date","value":"2026-05-26T01:00:00.000Z"},{"key":"message-id","value":"<msg-new-26-e1>"},{"key":"in-reply-to","value":"<msg-new-22-e1>"},{"key":"references","value":"<msg-recent-s2> <msg-new-22-e1>"}]',
NULL, NULL);

-- 5/26 (Monday) 15:00 KST — Odyssey OLED G9: 백수빈이 2차 수정 사항 전달
INSERT OR IGNORE INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('new-26-e2', 'inbox', 'Re: [요청] 삼성 Odyssey OLED G9 카카오톡 비즈 배너 — 2차 시안 추가 수정 요청', 'subeen.baek@samsung.com', 'bzengage@example.com', '2026-05-26T06:00:00.000Z', 0, 0,
'<html><body><p>비즈매트릭스 팀, 안녕하세요. 백수빈입니다.</p><p>2차 시안 수령했습니다. 거의 다 왔습니다! 소소한 추가 수정만 부탁드립니다.</p><h3>추가 수정 사항:</h3><ol><li>CTA 버튼 라운드 코너 반경 8px → 4px로 조정</li><li>하단 법적 고지 문구 폰트 사이즈 9pt → 8pt</li><li>모바일 버전 제품 이미지 위치 — 중앙 정렬로 변경</li></ol><p>수정본은 <strong>내일(5/27)</strong>까지 부탁드립니다. 런칭 전 최종 확인 진행 예정입니다.</p><p>감사합니다.<br>백수빈 드림</p></body></html>',
'msg-new-22-e2', '["msg-sam-21-e1","msg-sam-21-e2","msg-new-22-e2"]', 'thread-samsung-21', 'msg-new-26-e2',
'[{"key":"from","value":"백수빈 <subeen.baek@samsung.com>"},{"key":"to","value":"bzengage@example.com"},{"key":"subject","value":"Re: [요청] 삼성 Odyssey OLED G9 카카오톡 비즈 배너 — 2차 시안 추가 수정 요청"},{"key":"date","value":"2026-05-26T06:00:00.000Z"},{"key":"message-id","value":"<msg-new-26-e2>"},{"key":"in-reply-to","value":"<msg-new-22-e2>"},{"key":"references","value":"<msg-sam-21-e1> <msg-sam-21-e2> <msg-new-22-e2>"}]',
NULL, NULL);

-- 5/27 (Tuesday) 09:30 KST — 갤럭시 링 SNS: 백수빈이 1차 시안 피드백
INSERT OR IGNORE INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('new-27-e1', 'inbox', 'Re: [신규 의뢰] 갤럭시 링 SNS 캠페인 배너 — 1차 시안 피드백', 'subeen.baek@samsung.com', 'bzengage@example.com', '2026-05-27T00:30:00.000Z', 0, 0,
'<html><body><p>비즈매트릭스 팀, 안녕하세요. 백수빈입니다.</p><p>1차 시안 잘 받았습니다. 빠른 작업 감사드립니다!</p><p>전반적으로 좋으나 아래 항목만 수정 요청드립니다.</p><h3>피드백:</h3><ul><li><strong>Instagram Feed</strong>: 제품 컷을 중앙에서 좌측으로 이동, 우측에 카피 배치</li><li><strong>Stories 버전</strong>: 상단 여백 확보 필요 (인터페이스 UI 가림 방지)</li><li><strong>Facebook</strong>: 컨펌. 수정 불필요</li><li><strong>X(트위터)</strong>: 배경 명도 5% 낮춰주세요</li></ul><p>수정본을 <strong>5월 29일</strong>까지 전달 부탁드립니다.</p><p>감사합니다.<br>백수빈 드림</p></body></html>',
'msg-new-23-e2', '["msg-recent-s3","msg-new-23-e2"]', 'recent-s3', 'msg-new-27-e1',
'[{"key":"from","value":"백수빈 <subeen.baek@samsung.com>"},{"key":"to","value":"bzengage@example.com"},{"key":"subject","value":"Re: [신규 의뢰] 갤럭시 링 SNS 캠페인 배너 — 1차 시안 피드백"},{"key":"date","value":"2026-05-27T00:30:00.000Z"},{"key":"message-id","value":"<msg-new-27-e1>"},{"key":"in-reply-to","value":"<msg-new-23-e2>"},{"key":"references","value":"<msg-recent-s3> <msg-new-23-e2>"}]',
NULL, NULL);

-- 5/27 (Tuesday) 14:00 KST — 신규 의뢰: 비스포크 에어드레서 YouTube Pre-roll 배너
INSERT OR IGNORE INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('new-27-e2', 'inbox', '[요청] 비스포크 에어드레서 YouTube Pre-roll 배너 디자인 의뢰', 'hajun.yoon@samsung.com', 'bzengage@example.com', '2026-05-27T05:00:00.000Z', 0, 0,
'<html><body><p>비즈매트릭스 팀, 안녕하세요. 삼성전자 브랜드마케팅팀 윤하준입니다.</p><p>처음 연락드립니다. 타 팀으로부터 비즈매트릭스 팀을 소개받아 연락드립니다.</p><p><strong>비스포크 에어드레서</strong> 신제품 YouTube Pre-roll 광고 배너 디자인을 요청드립니다.</p><h3>요청 상세:</h3><ul><li>소재 타입: YouTube Pre-roll (스킵 가능 6초 + 전체 15초)</li><li>해상도: 1920x1080 (16:9)</li><li>카피: "비스포크 에어드레서 — 옷의 가치를 더하다"</li><li>톤앤매너: 프리미엄, 미니멀, 라이프스타일</li><li>컬러: 제품 컬러(코타 블루/베이지) 활용</li></ul><p>런칭: <strong>6월 15일</strong><br>1차 시안 희망일: <strong>6월 3일</strong></p><p>견적과 포트폴리오 사례도 함께 보내주시면 감사하겠습니다.</p><p>감사합니다.<br>윤하준 드림<br>삼성전자 브랜드마케팅팀</p></body></html>',
NULL, NULL, 'thread-airdresser', 'msg-new-27-e2',
'[{"key":"from","value":"윤하준 <hajun.yoon@samsung.com>"},{"key":"to","value":"bzengage@example.com"},{"key":"subject","value":"[요청] 비스포크 에어드레서 YouTube Pre-roll 배너 디자인 의뢰"},{"key":"date","value":"2026-05-27T05:00:00.000Z"},{"key":"message-id","value":"<msg-new-27-e2>"}]',
NULL, NULL);

-- 5/28 (Wednesday) 10:30 KST — S25 Edge: 오지민이 뉴스레터 배너 컨펌
INSERT OR IGNORE INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('new-28-e1', 'inbox', 'Re: [긴급] 갤럭시 S25 Edge — 이메일 뉴스레터 배너 최종 컨펌', 'jimin.oh@samsung.com', 'bzengage@example.com', '2026-05-28T01:30:00.000Z', 0, 1,
'<html><body><p>비즈매트릭스 팀, 안녕하세요. 오지민입니다.</p><p>이메일 뉴스레터 배너 최종본 수령했습니다.</p><p>내부 검토 완료 후 <strong>최종 컨펌</strong>합니다. 수고 많으셨습니다!</p><ul><li>PC 버전: 컨펌</li><li>Mobile 버전: 컨펌</li><li>다크모드 버전: 컨펌</li></ul><p>내일(5/29) 갤럭시 S25 Edge 글로벌 런칭에 배포 예정입니다.<br>최종 파일(PSD, HTML, PNG)을 오늘 오후 5시까지 전달 부탁드립니다.</p><p>감사합니다.<br>오지민 드림</p></body></html>',
'msg-new-26-e1', '["msg-recent-s2","msg-new-22-e1","msg-new-26-e1"]', 'recent-s2', 'msg-new-28-e1',
'[{"key":"from","value":"오지민 <jimin.oh@samsung.com>"},{"key":"to","value":"bzengage@example.com"},{"key":"subject","value":"Re: [긴급] 갤럭시 S25 Edge — 이메일 뉴스레터 배너 최종 컨펌"},{"key":"date","value":"2026-05-28T01:30:00.000Z"},{"key":"message-id","value":"<msg-new-28-e1>"},{"key":"in-reply-to","value":"<msg-new-26-e1>"},{"key":"references","value":"<msg-recent-s2> <msg-new-22-e1> <msg-new-26-e1>"}]',
NULL, NULL);

-- 5/28 (Wednesday) 14:30 KST — 갤럭시 탭 S10 FE: 정다은이 추가 요구사항 전달
INSERT OR IGNORE INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('new-28-e2', 'inbox', 'Re: [요청] 갤럭시 탭 S10 FE 네이버쇼핑 배너 — 추가 요구사항 및 소재 이미지 전달', 'daeun.jung@samsung.com', 'bzengage@example.com', '2026-05-28T05:30:00.000Z', 0, 0,
'<html><body><p>비즈매트릭스 팀, 안녕하세요. 정다은입니다.</p><p>추가 요구사항과 소재 이미지를 전달드립니다.</p><h3>추가 요구사항:</h3><ul><li>배너 하단에 "교육 할인 최대 20% 적용" 문구 추가</li><li>학생증 아이콘 삽입 (아이콘 시안 첨부)</li><li>네이버페이 로고 우측 하단 배치</li></ul><h3>소재 이미지:</h3><ul><li>제품 투명 배경 PNG (4종)</li><li>라이프스타일 이미지 (3종) — 카페/도서관/야외 촬영본</li></ul><p>첨부 파일 확인 후 작업 진행 부탁드립니다.<br>5월 28일 내 1차 시안을 부탁드렸으나, 내일(5/29)로 하루 연장해도 괜찮습니다.</p><p>감사합니다.<br>정다은 드림</p></body></html>',
'msg-new-23-e1', '["msg-new-23-e1"]', 'thread-tab-s10fe', 'msg-new-28-e2',
'[{"key":"from","value":"정다은 <daeun.jung@samsung.com>"},{"key":"to","value":"bzengage@example.com"},{"key":"subject","value":"Re: [요청] 갤럭시 탭 S10 FE 네이버쇼핑 배너 — 추가 요구사항 및 소재 이미지 전달"},{"key":"date","value":"2026-05-28T05:30:00.000Z"},{"key":"message-id","value":"<msg-new-28-e2>"},{"key":"in-reply-to","value":"<msg-new-23-e1>"},{"key":"references","value":"<msg-new-23-e1>"}]',
NULL, NULL);

-- 5/29 (Thursday) 09:30 KST — Odyssey OLED G9: 백수빈이 최종 컨펌
INSERT OR IGNORE INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('new-29-e1', 'inbox', 'Re: [요청] 삼성 Odyssey OLED G9 카카오톡 비즈 배너 — 최종 컨펌', 'subeen.baek@samsung.com', 'bzengage@example.com', '2026-05-29T00:30:00.000Z', 0, 1,
'<html><body><p>비즈매트릭스 팀, 안녕하세요. 백수빈입니다.</p><p>최종 수정본 확인했습니다. <strong>디자인 최종 컨펌</strong>합니다!</p><ul><li>카카오톡 비즈 배너 (800x400): 컨펌</li><li>모바일 리사이즈 버전: 컨펌</li></ul><p>최종 파일 전달 사항:</p><ul><li>파일 형식: PSD, PNG, HTML</li><li>전달 기한: <strong>5월 30일(금) 오전 중</strong></li></ul><p>좋은 작업 감사드립니다. 향후에도 잘 부탁드립니다.</p><p>감사합니다.<br>백수빈 드림<br>삼성전자 프로덕트마케팅팀</p></body></html>',
'msg-new-26-e2', '["msg-sam-21-e1","msg-sam-21-e2","msg-new-22-e2","msg-new-26-e2"]', 'thread-samsung-21', 'msg-new-29-e1',
'[{"key":"from","value":"백수빈 <subeen.baek@samsung.com>"},{"key":"to","value":"bzengage@example.com"},{"key":"subject","value":"Re: [요청] 삼성 Odyssey OLED G9 카카오톡 비즈 배너 — 최종 컨펌"},{"key":"date","value":"2026-05-29T00:30:00.000Z"},{"key":"message-id","value":"<msg-new-29-e1>"},{"key":"in-reply-to","value":"<msg-new-26-e2>"},{"key":"references","value":"<msg-sam-21-e1> <msg-sam-21-e2> <msg-new-22-e2> <msg-new-26-e2>"}]',
NULL, NULL);

-- 5/29 (Thursday) 10:00 KST — S25 Edge 런칭: 오지민 감사 메일
INSERT OR IGNORE INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('new-29-e2', 'inbox', 'Re: 갤럭시 S25 Edge 글로벌 런칭 완료 — 수고 많으셨습니다', 'jimin.oh@samsung.com', 'bzengage@example.com', '2026-05-29T01:00:00.000Z', 0, 1,
'<html><body><p>비즈매트릭스 팀, 안녕하세요. 오지민입니다.</p><p>오늘 <strong>갤럭시 S25 Edge 글로벌 런칭</strong>이 성공적으로 완료되었습니다.</p><p>촉박한 일정에도 불구하고 홈페이지 배너, 모바일 푸시, 뉴스레터 배너 모두 완벽하게 납품해 주셔서 진심으로 감사드립니다.</p><p>런칭 당일 클릭률이 기대치를 20% 상회했습니다. 좋은 결과에 비즈매트릭스 팀의 역할이 컸습니다.</p><p>다음 프로젝트(갤럭시 Z Fold 7)도 함께 진행하고 싶습니다. 별도로 연락드리겠습니다.</p><p>감사합니다.<br>오지민 드림<br>삼성전자 디지털마케팅팀</p></body></html>',
'msg-new-28-e1', '["msg-recent-s2","msg-new-22-e1","msg-new-26-e1","msg-new-28-e1"]', 'recent-s2', 'msg-new-29-e2',
'[{"key":"from","value":"오지민 <jimin.oh@samsung.com>"},{"key":"to","value":"bzengage@example.com"},{"key":"subject","value":"Re: 갤럭시 S25 Edge 글로벌 런칭 완료 — 수고 많으셨습니다"},{"key":"date","value":"2026-05-29T01:00:00.000Z"},{"key":"message-id","value":"<msg-new-29-e2>"},{"key":"in-reply-to","value":"<msg-new-28-e1>"},{"key":"references","value":"<msg-recent-s2> <msg-new-22-e1> <msg-new-26-e1> <msg-new-28-e1>"}]',
NULL, NULL);

-- 5/29 (Thursday) 15:00 KST — 신규 의뢰: 갤럭시 Watch Ultra 2 쿠팡 배너
INSERT OR IGNORE INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('new-29-e3', 'inbox', '[요청] 갤럭시 Watch Ultra 2 쿠팡 상품상세 배너 디자인 의뢰', 'minjun.lee@samsung.com', 'bzengage@example.com', '2026-05-29T06:00:00.000Z', 0, 0,
'<html><body><p>비즈매트릭스 팀, 안녕하세요. 삼성전자 온라인세일즈팀 이민준입니다.</p><p><strong>갤럭시 Watch Ultra 2</strong> 쿠팡 온라인 채널 상품상세 배너 디자인을 의뢰드립니다.</p><h3>요청 상세:</h3><ul><li>플랫폼: 쿠팡 상품상세 페이지 배너</li><li>사이즈: 1000x1000, 1000x500 (총 2종)</li><li>카피: "갤럭시 Watch Ultra 2 — 한계 없는 퍼포먼스"</li><li>컨셉: 스포츠/아웃도어 액티비티 이미지 활용</li><li>강조 요소: 내구성(군용 규격), 배터리 지속시간, 심박수 측정</li></ul><p>납기: <strong>6월 10일</strong><br>1차 시안: <strong>6월 3일</strong></p><p>감사합니다.<br>이민준 드림<br>삼성전자 온라인세일즈팀</p></body></html>',
NULL, NULL, 'thread-watch-ultra2', 'msg-new-29-e3',
'[{"key":"from","value":"이민준 <minjun.lee@samsung.com>"},{"key":"to","value":"bzengage@example.com"},{"key":"subject","value":"[요청] 갤럭시 Watch Ultra 2 쿠팡 상품상세 배너 디자인 의뢰"},{"key":"date","value":"2026-05-29T06:00:00.000Z"},{"key":"message-id","value":"<msg-new-29-e3>"}]',
NULL, NULL);

-- 5/30 08:00 KST (2026-05-29T23:00Z) — 신규 긴급 의뢰: 갤럭시 Z Fold 7 사전예약 배너
INSERT OR IGNORE INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('new-30-e1', 'inbox', '[긴급] 갤럭시 Z Fold 7 사전예약 배너 디자인 의뢰 — 6월 1일 마감', 'eunseo.kim@samsung.com', 'bzengage@example.com', '2026-05-29T23:00:00.000Z', 0, 1,
'<html><body><p>비즈매트릭스 팀, 안녕하세요. 삼성전자 디지털마케팅팀 김은서입니다.</p><p>오지민 팀장님께서 비즈매트릭스를 강력 추천해 주셔서 긴급 연락드립니다.</p><p><strong>갤럭시 Z Fold 7</strong> 사전예약 이벤트 배너 제작을 긴급 의뢰드립니다.</p><h3>요청 상세:</h3><ul><li>홈페이지 메인 히어로 배너: 1920x800</li><li>모바일 배너: 768x500</li><li>SNS 배너 (Instagram, Facebook): 각 1종</li></ul><p><strong>카피:</strong> "Galaxy Z Fold 7 사전예약 — 6월 7일부터"</p><p><strong>컨셉:</strong> 접히는 디스플레이의 혁신성 강조, 블루/골드 컬러</p><p>⚠️ <strong>마감: 6월 1일(일) 오전 10시</strong> — 월요일 오전 사전예약 페이지 오픈 예정</p><p>가능 여부를 <strong>오늘 중</strong>으로 회신 부탁드립니다.</p><p>감사합니다.<br>김은서 드림<br>삼성전자 디지털마케팅팀</p></body></html>',
NULL, NULL, 'thread-zfold7', 'msg-new-30-e1',
'[{"key":"from","value":"김은서 <eunseo.kim@samsung.com>"},{"key":"to","value":"bzengage@example.com"},{"key":"subject","value":"[긴급] 갤럭시 Z Fold 7 사전예약 배너 디자인 의뢰 — 6월 1일 마감"},{"key":"date","value":"2026-05-29T23:00:00.000Z"},{"key":"message-id","value":"<msg-new-30-e1>"}]',
NULL, NULL);

-- 5/30 08:45 KST (2026-05-29T23:45Z) — 갤럭시 링 SNS: 백수빈 최종 컨펌
INSERT OR IGNORE INTO emails (id, folder_id, subject, sender, recipient, date, read, starred, body, in_reply_to, email_references, thread_id, message_id, raw_headers, cc, bcc) VALUES
('new-30-e2', 'inbox', 'Re: [신규 의뢰] 갤럭시 링 SNS 캠페인 배너 — 최종 컨펌', 'subeen.baek@samsung.com', 'bzengage@example.com', '2026-05-29T23:45:00.000Z', 0, 0,
'<html><body><p>비즈매트릭스 팀, 안녕하세요. 백수빈입니다.</p><p>갤럭시 링 SNS 캠페인 배너 2차 수정본 모두 확인했습니다.</p><p><strong>전 소재 최종 컨펌</strong>합니다!</p><ul><li>Instagram Feed (1:1): ✅ 컨펌</li><li>Instagram Stories (9:16): ✅ 컨펌</li><li>Facebook (1200x630): ✅ 컨펌</li><li>X(트위터) (1600x900): ✅ 컨펌</li></ul><p>최종 파일(PSD, PNG 각 사이즈)을 <strong>오늘 오후 3시</strong>까지 전달 부탁드립니다.<br>SNS 캠페인 오늘 오후 6시 런칭 예정입니다.</p><p>빠른 작업 항상 감사드립니다!<br>백수빈 드림</p></body></html>',
'msg-new-27-e1', '["msg-recent-s3","msg-new-23-e2","msg-new-27-e1"]', 'recent-s3', 'msg-new-30-e2',
'[{"key":"from","value":"백수빈 <subeen.baek@samsung.com>"},{"key":"to","value":"bzengage@example.com"},{"key":"subject","value":"Re: [신규 의뢰] 갤럭시 링 SNS 캠페인 배너 — 최종 컨펌"},{"key":"date","value":"2026-05-29T23:45:00.000Z"},{"key":"message-id","value":"<msg-new-30-e2>"},{"key":"in-reply-to","value":"<msg-new-27-e1>"},{"key":"references","value":"<msg-recent-s3> <msg-new-23-e2> <msg-new-27-e1>"}]',
NULL, NULL);
