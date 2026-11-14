import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import {
  DEMO_CAMPAIGNS, demoBody, demoEmailHtml, findDemo, buildWorkspace, stableDemoId,
  validateRequirements, validateReply, makeCampaign, escapeHtml, normalizedOverrides,
} from '../../client/shared/campaign-demo.js';

const fixture = DEMO_CAMPAIGNS[0];
const email = { id: 'demo-email', subject: fixture.subject, sender: fixture.sender, body_text: demoBody(fixture) };

test('nine clearly fictional emails cover three brands, channels, and campaign purposes', () => {
  assert.equal(DEMO_CAMPAIGNS.length, 9);
  for (const brand of ['LG전자', '삼성전자', '대한항공']) {
    assert.equal(DEMO_CAMPAIGNS.filter((f) => f.fields.brand === brand).length, 3);
  }
  assert.deepEqual(new Set(DEMO_CAMPAIGNS.map((f) => f.fields.channel)), new Set(['Popup', 'Web push', 'Inline banner']));
  for (const f of DEMO_CAMPAIGNS) {
    assert.ok(f.subject.startsWith('[DEMO]'));
    assert.match(f.sender, /\.example$/);
    assert.match(demoBody(f), /이번 요청에서 부탁드리는 작업/);
    assert.ok(findDemo({ subject: f.subject, sender: f.sender, body: demoBody(f) }));
  }
});

test('rich email bodies have distinct request copy, safe image examples and no disclaimer banner', () => {
  const bodies = new Set();
  for (const f of DEMO_CAMPAIGNS) {
    const body = demoEmailHtml(f);
    bodies.add(body);
    assert.ok(body.includes(`src="/campaign-examples/${f.key}.jpg"`));
    assert.ok(existsSync(new URL(`../../client/public/campaign-examples/${f.key}.jpg`, import.meta.url)));
    assert.match(body, /alt="[^"]+"/);
    assert.match(body, /이번 요청에서 부탁드리는 작업/);
    assert.match(body, /다음 회신에서 확인할 내용/);
    assert.doesNotMatch(body, /실제 AI 호출|실제 기업의 요청이 아닙니다|FICTIONAL DEMO/);
    assert.doesNotMatch(body, /<(script|iframe|style|button)\b|onload=|onclick=|[\r\n]/i);
    for (const value of Object.values(f.fields)) assert.ok(body.includes(escapeHtml(value)));
    assert.ok(findDemo({ subject: f.subject, sender: f.sender, body }));
    assert.ok(demoBody(f).length > 800);
  }
  assert.equal(bodies.size, 9);
});

test('demo IDs are stable and isolated by mailbox', async () => {
  assert.equal(await stableDemoId('a@example.com', fixture.key), await stableDemoId('a@example.com', fixture.key));
  assert.notEqual(await stableDemoId('a@example.com', fixture.key), await stableDemoId('b@example.com', fixture.key));
});

test('actual mail is never silently treated as demo or AI generated', () => {
  assert.equal(findDemo({ ...email, sender: 'real@lg.com' }), undefined);
  assert.equal(findDemo({ ...email, body_text: 'ordinary request' }), undefined);
  assert.throws(() => buildWorkspace({ ...email, subject: 'real mail' }), /데모/);
});

test('summary, evidence and missing requirements are specific to the email', () => {
  const workspace = buildWorkspace(email);
  assert.equal(workspace.mode, 'demo');
  assert.match(workspace.summary.headline, /LG전자.*OLED.*Popup/);
  assert.ok(workspace.missing.some((r) => r.key === 'assets'));
  assert.ok(workspace.missing.some((r) => r.key === 'frequencyCap'));
  assert.ok(!workspace.missing.some((r) => r.key === 'consent'));
  assert.ok(!workspace.missing.some((r) => r.key === 'landingUrl'));
  assert.equal(workspace.requirements.find((r) => r.key === 'assets').value, '');
  for (const r of workspace.requirements.filter((r) => r.source === 'email')) assert.ok(email.body_text.includes(r.evidence));
});

test('requirement updates resolve gaps without overwriting saved human reply', () => {
  const stored = { requirements: { assets: 'PC 600×600', frequencyCap: '하루 1회' }, reply: { subject: '내 제목', body: '직접 수정한 답변' } };
  const workspace = buildWorkspace(email, stored);
  assert.equal(workspace.missing.length, 0);
  assert.equal(workspace.reply.body, '직접 수정한 답변');
  assert.ok(!workspace.suggestedReply.body.includes('소재 / 규격을 확인'));
  assert.equal(workspace.requirements.find((r) => r.key === 'assets').source, 'user');
});

test('campaign remains a draft with blockers, preserves ID, and marks stale requirements', () => {
  const w = buildWorkspace(email);
  const campaign = makeCampaign(w, { title: '검토용 캠페인', notes: '확인 후 진행' }, null, 'draft-id');
  assert.equal(campaign.status, 'draft');
  assert.ok(campaign.blockers.length > 0);
  assert.equal(makeCampaign(w, { title: '수정한 캠페인' }, campaign, campaign.id).createdAt, campaign.createdAt);
  assert.equal(buildWorkspace(email, { campaign }).campaignStale, false);
  assert.equal(buildWorkspace(email, { campaign, requirements: { audience: '변경된 대상' } }).campaignStale, true);
});

test('all fixture requirements validate and malformed inputs are rejected', () => {
  for (const f of DEMO_CAMPAIGNS) assert.doesNotThrow(() => validateRequirements(f.fields));
  assert.throws(() => validateRequirements({ unknown: 'x' }));
  assert.throws(() => validateRequirements({ channel: 'Email send' }));
  assert.throws(() => validateRequirements({ landingUrl: 'javascript:alert(1)' }));
  assert.throws(() => validateRequirements({ startDate: '2026-11-20', endDate: '2026-11-01' }));
  assert.throws(() => validateRequirements({ startDate: 'invalid' }));
  assert.throws(() => validateRequirements({ startDate: '2026-02-31' }));
  assert.throws(() => normalizedOverrides(fixture, { endDate: '2026-11-01' }));
  assert.throws(() => validateReply({ subject: '', body: '' }));
  assert.deepEqual(validateReply({ subject: ' 제안 ', body: ' 검토 ' }), { subject: '제안', body: '검토' });
  assert.equal(escapeHtml('<script>&'), '&lt;script&gt;&amp;');
});
