// Sample scenarios keep their subject/identity metadata, without UI disclaimer banners.
import { campaignDetails, campaignEmailHtml } from "./campaign-email-content.js";

export const demoEmailHtml = campaignEmailHtml;

export const FIELD_LABELS = {
  brand: "브랜드", product: "상품 / 서비스", productStage: "신규 / 기존",
  objective: "캠페인 목적", channel: "캠페인 채널", audience: "대상 고객",
  startDate: "시작일 (KST)", endDate: "종료일 (KST)", landingUrl: "랜딩 URL",
  budget: "예산", assets: "소재 / 규격", kpi: "성과 지표",
  placement: "노출 위치 / 조건", frequencyCap: "노출 빈도 제한", consent: "수신 동의 기준",
};

const scenario = (key, sender, title, fields) => ({
  key, sender, subject: `[DEMO] ${fields.brand} · ${title}`,
  fields: { startDate: "2026-11-16", endDate: "2026-11-30", ...fields },
});

export const DEMO_CAMPAIGNS = [
  scenario("lg-oled-launch", "oled-campaign@lg.example", "OLED evo 신모델 런칭 Popup 캠페인", {
    brand: "LG전자", product: "OLED evo 신모델 (가상)", productStage: "신규 제품",
    objective: "신제품 인지도 및 사전 알림 신청 확대", channel: "Popup",
    audience: "최근 30일 TV 카테고리 방문 고객", landingUrl: "https://lg.example/demo/oled",
    budget: "300만원 (가상)", kpi: "사전 알림 신청 500건", placement: "TV 상세 페이지 15초 체류 후",
  }),
  scenario("lg-puricare-subscribe", "subscription@lg.example", "퓨리케어 정수기 구독 Web push 요청", {
    brand: "LG전자", product: "퓨리케어 정수기 구독", productStage: "기존 제품",
    objective: "구독 혜택 안내 및 상담 신청", channel: "Web push",
    audience: "정수기 구독 페이지 방문 후 미신청 고객", assets: "제목 30자 / 본문 60자 / 아이콘 192×192",
    kpi: "구독 상담 신청 200건", frequencyCap: "주 1회",
  }),
  scenario("lg-codezero-info", "homecare@lg.example", "코드제로 A9S 상품안내 Inline banner", {
    brand: "LG전자", product: "코드제로 A9S", productStage: "기존 제품",
    objective: "기존 제품 주요 기능 및 비교 콘텐츠 안내", channel: "Inline banner",
    audience: "청소기 카테고리 방문 고객", landingUrl: "https://lg.example/demo/codezero",
    assets: "PC 1200×240 / 모바일 720×360", placement: "청소기 목록 상단",
    kpi: "제품 상세 클릭률 3%", frequencyCap: "세션당 1회",
  }),
  scenario("samsung-galaxy-launch", "galaxy@Samsung.example".toLowerCase(), "Galaxy 신제품 런칭 Web push 캠페인", {
    brand: "삼성전자", product: "Galaxy 스마트폰 신모델 (가상)", productStage: "신규 제품",
    objective: "신제품 공개 및 사전 구매 알림", channel: "Web push",
    audience: "Galaxy 신제품 알림 신청 고객", landingUrl: "https://samsung.example/demo/galaxy",
    budget: "500만원 (가상)", consent: "웹 푸시 및 마케팅 수신에 동의한 고객만",
    kpi: "사전 구매 페이지 방문 2,000건",
  }),
  scenario("samsung-bespoke-subscribe", "bespoke@samsung.example", "Bespoke AI 콤보 구독안내 Popup", {
    brand: "삼성전자", product: "Bespoke AI 콤보", productStage: "기존 제품",
    objective: "가전 구독 서비스 안내 및 상담 전환", channel: "Popup",
    audience: "세탁·건조 제품 상세 방문 고객", assets: "PC 600×600 / 모바일 360×480",
    placement: "제품 상세 페이지 이탈 시", frequencyCap: "고객당 7일에 1회",
    kpi: "구독 상담 신청 150건",
  }),
  scenario("samsung-buds-info", "audio@samsung.example", "Galaxy Buds 상품 비교 Inline banner", {
    brand: "삼성전자", product: "Galaxy Buds", productStage: "기존 제품",
    objective: "무선 이어폰 기능 비교 및 상품안내", channel: "Inline banner",
    audience: "오디오 카테고리 방문 고객", landingUrl: "https://samsung.example/demo/buds",
    assets: "PC 1080×240 / 모바일 규격 미확정", kpi: "제품 비교 페이지 클릭률 4%",
  }),
  scenario("koreanair-route-launch", "routes@koreanair.example", "신규 노선 런칭 Popup 캠페인", {
    brand: "대한항공", product: "인천–리스본 신규 노선 (가상)", productStage: "신규 서비스",
    objective: "가상 신규 노선 소개 및 운임 조회 유도", channel: "Popup",
    audience: "유럽 노선 검색 고객", budget: "400만원 (가상)",
    placement: "유럽 노선 검색 결과 페이지", kpi: "운임 조회 1,000건",
    frequencyCap: "고객당 하루 1회",
  }),
  scenario("koreanair-news-subscribe", "skypass@koreanair.example", "SKYPASS 여행소식 구독 Web push", {
    brand: "대한항공", product: "SKYPASS 여행소식 구독 (가상)", productStage: "기존 서비스",
    objective: "맞춤 여행소식 구독 및 관심 노선 등록 안내", channel: "Web push",
    audience: "로그인한 SKYPASS 회원 중 미구독 고객", landingUrl: "https://koreanair.example/demo/news",
    assets: "제목 25자 / 본문 60자 / 아이콘 192×192", frequencyCap: "월 2회",
    kpi: "여행소식 구독 300건",
  }),
  scenario("koreanair-tokyo-info", "japan@koreanair.example", "인천–도쿄 항공권 상품안내 Inline banner", {
    brand: "대한항공", product: "인천–도쿄 항공권", productStage: "기존 상품",
    objective: "운항 일정 및 항공권 검색 안내", channel: "Inline banner",
    audience: "일본 여행 콘텐츠 열람 고객", landingUrl: "https://koreanair.example/demo/tokyo",
    placement: "일본 여행 콘텐츠 중간", kpi: "항공권 검색 전환율 5%",
  }),
];

export function demoBody(fixture) {
  const detail = campaignDetails(fixture);
  return [
    "안녕하세요, 캠페인 운영 담당자님.",
    detail.intro,
    "",
    "이번 요청에서 부탁드리는 작업",
    ...detail.requests,
    "",
    "전달드리는 요구사항",
    ...Object.entries(fixture.fields).map(([key, value]) => `• ${FIELD_LABELS[key]}: ${value}`),
    "",
    "제안 카피 · 이미지 구성",
    detail.headline,
    detail.description,
    `CTA: ${detail.cta}`,
    "",
    "다음 회신에서 확인할 내용",
    ...detail.reviewNotes.map((note) => `• ${note}`),
    "진행 가능 일정과 추가로 필요한 자료를 회신 부탁드립니다.",
    "",
    `${fixture.fields.brand} 캠페인 담당팀`,
    `데모 시나리오 ID: ${fixture.key}`,
  ].join("\n");
}

export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

export function findDemo(email) {
  const body = email?.body_text || email?.body || email?.body_html || "";
  return DEMO_CAMPAIGNS.find((f) => email?.subject === f.subject &&
    email?.sender === f.sender && body.includes(`데모 시나리오 ID: ${f.key}`));
}

export async function stableDemoId(scope, key) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${scope}:${key}`)));
  bytes[6] = (bytes[6] & 15) | 80;
  bytes[8] = (bytes[8] & 63) | 128;
  const h = [...bytes.slice(0, 16)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function validateRequirements(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("요구사항 형식이 올바르지 않습니다.");
  const result = {};
  for (const [key, value] of Object.entries(input)) {
    if (!Object.hasOwn(FIELD_LABELS, key) || typeof value !== "string" || value.length > 2000) {
      throw new Error("요구사항 항목 또는 길이가 올바르지 않습니다.");
    }
    result[key] = value.trim();
  }
  if (result.channel && !["Popup", "Web push", "Inline banner"].includes(result.channel)) {
    throw new Error("채널은 Popup, Web push, Inline banner 중 선택해 주세요.");
  }
  for (const key of ["startDate", "endDate"]) {
    if (result[key] && (!/^\d{4}-\d{2}-\d{2}$/.test(result[key]) || Number.isNaN(Date.parse(result[key])) ||
      new Date(result[key]).toISOString().slice(0, 10) !== result[key])) {
      throw new Error("일정은 YYYY-MM-DD 형식으로 입력해 주세요.");
    }
  }
  if (result.startDate && result.endDate && result.endDate < result.startDate) throw new Error("종료일은 시작일 이후여야 합니다.");
  if (result.landingUrl) {
    let url;
    try { url = new URL(result.landingUrl); } catch { throw new Error("랜딩 URL을 확인해 주세요."); }
    if (!["https:", "http:"].includes(url.protocol)) throw new Error("랜딩 URL은 http 또는 https 주소여야 합니다.");
  }
  return result;
}

export function normalizedOverrides(fixture, input) {
  const values = validateRequirements(input);
  validateRequirements({ ...fixture.fields, ...values });
  return Object.fromEntries(Object.entries(values).filter(([key, value]) => value !== (fixture.fields[key] || "")));
}

export function validateReply(input) {
  if (!input || typeof input.subject !== "string" || typeof input.body !== "string" ||
    !input.subject.trim() || !input.body.trim() || input.subject.length > 500 || input.body.length > 30000) {
    throw new Error("제목과 본문을 입력해 주세요. 제목은 500자, 본문은 30,000자 이내입니다.");
  }
  return { subject: input.subject.trim(), body: input.body.trim() };
}

export function buildWorkspace(email, stored = {}) {
  const fixture = findDemo(email);
  if (!fixture) throw new Error("이 기능은 가상 캠페인 메일용 데모입니다. 실제 메일 AI 분석은 별도로 연결해야 합니다.");
  const overrides = stored.requirements || {};
  const fields = { ...fixture.fields, ...overrides };
  const required = new Set(["brand", "product", "objective", "channel", "audience", "startDate", "endDate", "landingUrl", "assets", "kpi"]);
  if (fields.channel === "Web push") { required.add("consent"); required.add("frequencyCap"); }
  else { required.add("placement"); if (fields.channel === "Popup") required.add("frequencyCap"); }
  const requirements = Object.entries(FIELD_LABELS).map(([key, label]) => ({
    key, label, value: fields[key] || "", required: required.has(key),
    source: Object.hasOwn(overrides, key) ? "user" : fixture.fields[key] ? "email" : "missing",
    evidence: fixture.fields[key] ? `• ${label}: ${fixture.fields[key]}` : null,
  }));
  const missing = requirements.filter((r) => r.required && (!r.value || /미확정|미정/.test(r.value))).map((r) => ({
    key: r.key, label: r.label, blocking: true,
    reason: `${fields.channel || "캠페인"} 설정 초안 검토에 필요한 ${r.label}이 아직 확정되지 않았습니다.`,
    question: `${r.label}을 확인해 주실 수 있을까요?`,
  }));
  const suggestedReply = {
    subject: `Re: ${email.subject}`,
    body: [
      `${fields.brand} 캠페인 담당자님, 안녕하세요.`, "",
      `${fields.product}의 ${fields.channel} 캠페인 요청 내용을 확인했습니다.`,
      `요청 목적은 ${fields.objective || "추가 확인 필요"}이며, 희망 일정은 ${fields.startDate || "미확인"}부터 ${fields.endDate || "미확인"}까지로 이해했습니다.`,
      "",
      ...(missing.length ? ["구성안 검토를 위해 아래 사항을 확인 부탁드립니다.", ...missing.map((m, i) => `${i + 1}. ${m.question}`)] :
        ["전달해 주신 조건을 기준으로 구성안을 검토하겠습니다."]),
      "", "운영 가능 여부와 최종 일정은 검토 후 별도 안내드리겠습니다.", "감사합니다.", "캠페인 운영팀",
    ].join("\n"),
  };
  return {
    mode: "demo", fixtureId: fixture.key,
    brand: fields.brand, product: fields.product,
    summary: {
      headline: `${fields.brand}의 ${fields.product} ${fields.channel} 캠페인 요청`,
      bullets: [
        `목적: ${fields.objective || "미확인"}`,
        `대상: ${fields.audience || "미확인"}`,
        `희망 일정: ${fields.startDate || "미확인"} ~ ${fields.endDate || "미확인"} (KST)`,
        `성과 지표: ${fields.kpi || "미확인"}`,
        `집행 전 확인할 항목: ${missing.length}건 · 일정과 집행은 아직 확정되지 않았습니다.`,
      ],
    },
    requirements, missing,
    reply: stored.reply || suggestedReply,
    suggestedReply,
    replyDraftId: stored.replyDraftId || null,
    campaign: stored.campaign || null,
    campaignStale: Boolean(stored.campaign && requirements.some((r) => r.value !== (stored.campaign.fields[r.key] || ""))),
    updatedAt: stored.updatedAt || null,
  };
}

export function makeCampaign(workspace, input, previous, id) {
  if (typeof input.title !== "string" || !input.title.trim() || input.title.length > 300 ||
    (input.notes !== undefined && (typeof input.notes !== "string" || input.notes.length > 5000))) {
    throw new Error("캠페인 이름(300자 이내)과 메모(5,000자 이내)를 확인해 주세요.");
  }
  const now = new Date().toISOString();
  return {
    id, title: input.title.trim(), status: "draft",
    fields: Object.fromEntries(workspace.requirements.map((r) => [r.key, r.value])),
    notes: input.notes || "", blockers: workspace.missing.map((m) => m.label),
    createdAt: previous?.createdAt || now, updatedAt: now,
  };
}
