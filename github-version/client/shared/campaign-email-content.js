// Self-contained email content: campaign-demo.js imports this module.
const LABELS = {
  brand: "브랜드", product: "상품 / 서비스", productStage: "신규 / 기존",
  objective: "캠페인 목적", channel: "캠페인 채널", audience: "대상 고객",
  startDate: "시작일 (KST)", endDate: "종료일 (KST)", landingUrl: "랜딩 URL",
  budget: "예산", assets: "소재 / 규격", kpi: "성과 지표",
  placement: "노출 위치 / 조건", frequencyCap: "노출 빈도 제한", consent: "수신 동의 기준",
};

const CONTENT = {
  "lg-oled-launch": {
    intro: "OLED evo 신모델을 살펴보는 고객이 신제품 소식을 놓치지 않도록, TV 상세 페이지에서 사전 알림 신청으로 이어지는 팝업을 요청드립니다. 바로 구매를 재촉하기보다는 제품에 대한 관심을 알림 신청으로 연결하는 구성이었으면 합니다.",
    requests: [
      "최근 30일 TV 카테고리 방문 고객을 대상으로, TV 상세 페이지에서 15초 체류한 뒤 노출하는 안을 검토해 주세요. 제품을 읽는 흐름을 가리지 않도록 핵심 문장과 알림 신청 안내를 간결하게 배치하고, 닫기 동선도 함께 설계 부탁드립니다.",
      "거실 속 TV가 중심이 되는 이미지와 짧은 신제품 소개를 조합해 주세요. 아래 이미지는 화면 구성과 분위기를 설명하기 위한 참고이며, 실제 모델의 디자인이나 화질 성능을 확정하는 자료로 사용하지 않았으면 합니다.",
      "신청 버튼 이후에는 전달드린 랜딩에서 알림 신청을 마칠 수 있는지 확인하고, 신청 완료를 성과로 구분하는 측정안을 준비해 주세요. 가격, 출시일, 구매 혜택은 확인되지 않았으므로 카피에 넣지 말아 주세요.",
    ],
    headline: "OLED evo, 새로운 화면을 만나다",
    description: "신모델 소식이 궁금하다면 사전 알림을 신청해 보세요.",
    cta: "사전 알림 신청",
    reviewNotes: [
      "최종 제품명과 공개 가능한 신제품 소개 문구를 전달해 주실 수 있을까요?",
      "PC·모바일 팝업 규격과 실제 사용 가능한 제품 이미지, 로고 원본이 필요합니다.",
      "고객별 노출 빈도, 닫은 뒤 재노출 기준과 알림 신청 완료 이벤트를 확인해 주세요.",
    ],
  },
  "lg-puricare-subscribe": {
    intro: "퓨리케어 정수기 구독 페이지를 방문했지만 아직 신청하지 않은 고객에게 상담 동선을 다시 안내하고 싶습니다. 웹 푸시에서는 구독 조건을 길게 나열하기보다, 필요한 내용을 확인하고 상담을 신청할 수 있다는 점을 명확하게 전달해 주세요.",
    requests: [
      "구독 혜택을 안내하되 월 구독료, 관리 주기, 약정 기간처럼 확정 자료가 필요한 내용은 임의로 작성하지 말아 주세요. 상담을 통해 자신의 사용 환경에 맞는 조건을 확인하도록 유도하는 문구를 제안 부탁드립니다.",
      "제목 30자, 본문 60자 기준으로 모바일 알림에서도 읽히는 짧은 문장을 준비해 주세요. 주 1회 제한을 적용하는 안이며, 이미 상담을 신청한 고객의 제외 방식도 함께 검토해 주세요.",
      "아래 정수기 이미지는 크리에이티브 방향 참고용입니다. 실제 발송용 192×192 아이콘은 별도 확인이 필요하며, 상담 페이지로 이어지는 랜딩과 신청 완료 측정 방식도 정리 부탁드립니다.",
    ],
    headline: "퓨리케어 구독, 상담으로 알아보세요",
    description: "우리 집에 맞는 정수기 구독 조건을 확인하고 상담을 신청해 보세요.",
    cta: "구독 상담 알아보기",
    reviewNotes: [
      "상담 신청 랜딩 URL과 최종 구독 혜택·조건 자료를 전달해 주세요.",
      "웹 푸시 및 마케팅 수신 동의 기준과 상담 완료 고객 제외 기준을 확인해 주세요.",
      "승인된 192×192 아이콘 원본과 발송 시간대, 미수신 시 재시도 정책이 필요합니다.",
    ],
  },
  "lg-codezero-info": {
    intro: "청소기 카테고리를 둘러보는 고객이 코드제로 A9S의 주요 기능과 비교 콘텐츠를 쉽게 찾을 수 있도록 목록 상단 인라인 배너를 요청드립니다. 신제품 출시나 가격 혜택이 아니라, 기존 제품을 이해하는 데 필요한 정보를 연결하는 캠페인입니다.",
    requests: [
      "목록 탐색을 방해하지 않도록 제품 이미지, 핵심 안내 문장, 상세 보기 동선으로 구성해 주세요. 세션당 1회 노출 조건을 유지하고, 배너 클릭 이후 제품 소개와 비교 콘텐츠가 자연스럽게 이어지도록 검토 부탁드립니다.",
      "PC 1200×240, 모바일 720×360 기준으로 각각 시안을 준비해 주세요. 가로형에서는 문구와 제품을 나누고 모바일에서는 문장 길이를 줄이되, 확인되지 않은 흡입력 수치나 경쟁 제품 대비 우위는 넣지 말아 주세요.",
      "아래 이미지는 제품 배치와 여백을 참고하기 위한 예시입니다. 실제 A9S 모델의 이미지와 승인된 기능 설명을 받은 뒤 최종 소재에 반영하고, 제품 상세 클릭률을 구분해 볼 수 있도록 측정 항목을 정리해 주세요.",
    ],
    headline: "코드제로 A9S, 기능부터 살펴보세요",
    description: "제품 소개와 비교 콘텐츠에서 내게 필요한 청소기 정보를 확인하세요.",
    cta: "제품 자세히 보기",
    reviewNotes: [
      "PC·모바일 규격은 전달되었으며, 해당 규격에 사용할 제품 원본과 승인된 기능 카피가 필요합니다.",
      "비교 콘텐츠의 비교 대상과 공개 가능한 항목을 확인해 주세요.",
      "전달된 랜딩이 상세·비교 콘텐츠로 연결되는지, 클릭률의 노출 집계 기준이 무엇인지 확인 부탁드립니다.",
    ],
  },
  "samsung-galaxy-launch": {
    intro: "Galaxy 신제품 알림을 신청한 고객에게 신모델 공개 소식과 사전 구매 페이지를 안내하는 웹 푸시를 요청드립니다. 이미 관심을 표시한 고객인 만큼, 과장된 기능 소개보다 공개된 제품 정보를 확인할 수 있는 명확한 안내가 필요합니다.",
    requests: [
      "웹 푸시와 마케팅 수신에 모두 동의한 고객만 대상으로 설정해 주세요. 알림 신청 이력과 발송 시점의 동의 상태를 함께 확인하고, 동의를 철회한 고객은 발송 대상에서 제외하는 방식으로 검토 부탁드립니다.",
      "신제품 공개 사실과 페이지 방문 동선을 중심으로 제목과 본문을 제안해 주세요. 출시일, 가격, 사은품, 카메라나 배터리 성능은 승인 자료를 받기 전까지 언급하지 말아 주세요.",
      "아래 스마트폰 이미지는 알림 소재의 색감과 제품 중심 구도를 설명하는 예시입니다. 실제 신모델 이미지로 해석되지 않도록 최종 제품 원본으로 교체하고, 랜딩 방문을 성과 지표와 연결하는 측정안을 준비해 주세요.",
    ],
    headline: "Galaxy 신제품 소식을 확인하세요",
    description: "관심을 두셨던 Galaxy 신모델, 공개 내용과 사전 구매 안내를 살펴보세요.",
    cta: "신제품 안내 보기",
    reviewNotes: [
      "발송 일시, 고객별 빈도 제한과 중복 발송 방지 기준을 확인해 주세요.",
      "제목·본문 글자 수 제한, 아이콘 규격과 승인된 신제품 이미지가 필요합니다.",
      "사전 구매 페이지의 공개 시점 및 최종 문구 승인 여부를 확인 부탁드립니다.",
    ],
  },
  "samsung-bespoke-subscribe": {
    intro: "Bespoke AI 콤보 상세 페이지를 살펴본 고객이 가전 구독 서비스를 함께 검토할 수 있도록 이탈 시점 팝업을 요청드립니다. 제품 탐색을 붙잡기 위한 강한 구매 권유보다는, 구독이라는 이용 방법을 소개하고 상담으로 연결하는 톤을 원합니다.",
    requests: [
      "제품 상세 페이지 이탈 시 노출하되 고객당 7일에 1회 조건을 적용해 주세요. 특히 모바일에서 이탈 의도를 어떤 행동으로 판단할지는 운영 검토가 필요하므로, 임의의 동작을 확정하지 말고 적용 가능한 조건을 제안 부탁드립니다.",
      "PC 600×600, 모바일 360×480을 기준으로 제품 이미지와 상담 안내를 구성해 주세요. 실제 구독료, 계약 기간, 관리 서비스 범위가 확인되기 전에는 비용 절감이나 특정 혜택을 약속하는 문구를 사용하지 않았으면 합니다.",
      "아래 세탁·건조 가전 이미지는 구독 안내 팝업의 분위기 참고용입니다. 실제 제품 소재로 교체할 항목을 표시하고, 상담 신청 이후 완료까지의 흐름과 전환 집계를 함께 정리해 주세요.",
    ],
    headline: "Bespoke AI 콤보, 구독으로 알아보기",
    description: "가전 구독 서비스가 궁금하다면 이용 조건부터 상담해 보세요.",
    cta: "구독 상담 안내",
    reviewNotes: [
      "상담 신청 랜딩 URL과 승인된 구독 조건 자료가 필요합니다.",
      "전달된 PC·모바일 규격에 맞는 실제 제품 이미지와 로고를 전달해 주세요.",
      "모바일 이탈 판단 방식, 닫기 동선과 상담 완료 고객 제외 여부를 확인 부탁드립니다.",
    ],
  },
  "samsung-buds-info": {
    intro: "오디오 카테고리 방문 고객이 Galaxy Buds 제품 정보를 비교하며 살펴볼 수 있도록 인라인 배너를 요청드립니다. 특정 모델이 더 우수하다는 결론을 먼저 제시하기보다, 사용자가 필요한 기능을 확인하도록 비교 페이지의 진입점을 만들어 주세요.",
    requests: [
      "PC 배너는 1080×240 기준으로 제품 이미지와 비교 안내 문구를 간결하게 배치해 주세요. 모바일 규격은 아직 정해지지 않았으므로 최종 납품 규격으로 간주하지 말고, 필요한 화면별 규격을 먼저 제안 부탁드립니다.",
      "비교 대상 모델과 기능 항목은 승인 자료를 받은 뒤 반영해 주세요. 노이즈 캔슬링, 착용감, 배터리 등과 관련된 성능이나 지원 여부를 임의로 단정하지 않고, 비교 콘텐츠를 확인하도록 안내하는 문구를 원합니다.",
      "아래 이어버드 이미지는 제품 중심 구도 참고용이며 최종 사용 소재가 아닙니다. 제공한 랜딩의 비교 콘텐츠 연결 여부와 제품 비교 페이지 클릭률 집계 기준도 함께 점검 부탁드립니다.",
    ],
    headline: "나에게 맞는 Galaxy Buds 찾기",
    description: "제품별 기능과 정보를 비교하며 필요한 선택 기준을 살펴보세요.",
    cta: "제품 비교하기",
    reviewNotes: [
      "모바일 배너 규격과 실제 노출 위치·조건을 확정해 주세요.",
      "비교 대상 모델, 공개 가능한 기능표와 승인된 제품 이미지가 필요합니다.",
      "빈도 제한 및 비교 페이지 클릭률의 분모·이벤트 정의를 확인 부탁드립니다.",
    ],
  },
  "koreanair-route-launch": {
    intro: "유럽 노선을 검색하는 고객에게 인천–리스본 신규 노선 소개와 운임 조회 동선을 제안하는 팝업을 요청드립니다. 여행지의 분위기를 먼저 보여주되 실제 운항 일정이나 운임이 확정된 것처럼 읽히지 않도록 구성해 주세요.",
    requests: [
      "유럽 노선 검색 결과 페이지에서 고객당 하루 1회 노출하는 안입니다. 고객이 검색 결과로 바로 돌아갈 수 있는 닫기 동선을 확보하고, 목적지 소개와 운임 조회 안내에 집중해 주세요.",
      "리스본의 도시 풍경을 활용해 여행을 상상할 수 있는 시안을 부탁드립니다. 직항 여부, 운항 요일, 취항일, 특가 금액이나 좌석 조건은 현재 자료에 없으므로 카피와 이미지 안에 임의로 넣지 말아 주세요.",
      "아래 도시는 여행지 분위기 참고 이미지입니다. 실제 광고용 원본과 사용 권한을 별도로 확인하고, 노선 소개에서 운임 조회까지 연결되는 랜딩 및 조회 완료 집계 방식을 정리해 주세요.",
    ],
    headline: "다음 여행의 목적지, 리스본",
    description: "인천–리스본 노선 소개를 살펴보고 여행 계획에 맞는 운임을 확인해 보세요.",
    cta: "노선·운임 알아보기",
    reviewNotes: [
      "노선 안내 및 운임 조회 랜딩 URL을 전달해 주실 수 있을까요?",
      "공개 가능한 노선 정보, 운항 일정과 운임 조회 제공 범위를 확인해 주세요.",
      "PC·모바일 팝업 규격과 승인된 여행지 소재, 사용 권한 확인이 필요합니다.",
    ],
  },
  "koreanair-news-subscribe": {
    intro: "로그인한 SKYPASS 회원 중 아직 여행소식을 구독하지 않은 고객에게 관심 노선 등록과 여행소식 구독을 안내하고 싶습니다. 항공권 구매를 바로 유도하기보다 고객이 관심 있는 여행 정보를 선택하도록 웹 푸시를 구성해 주세요.",
    requests: [
      "제목 25자, 본문 60자 제한 안에서 구독 목적과 다음 행동이 분명하게 읽히는 안을 부탁드립니다. 월 2회 빈도 제한을 유지하고, 구독 완료 고객은 이후 대상에서 제외할 수 있는지 확인해 주세요.",
      "관심 노선 등록과 구독 설정을 전달드린 랜딩에서 마칠 수 있는지 점검 부탁드립니다. 회원 로그인 상태와 웹 푸시 수신 동의는 서로 다른 조건이므로 로그인만으로 발송 대상에 포함하지 말아 주세요.",
      "아래 여행 이미지는 소식 구독의 분위기를 전달하는 예시이며 특정 노선 추천이나 회원 혜택을 보장하지 않습니다. 발송용 192×192 아이콘은 승인된 별도 원본으로 준비하고, 구독 완료를 성과로 측정해 주세요.",
    ],
    headline: "관심 노선의 여행소식을 받아보세요",
    description: "SKYPASS 여행소식 구독과 관심 노선 등록을 확인해 보세요.",
    cta: "여행소식 구독 안내",
    reviewNotes: [
      "웹 푸시·마케팅 수신 동의 기준과 미구독 회원 판별 방법을 확인해 주세요.",
      "192×192 아이콘 원본과 브랜드 소재 사용 승인이 필요합니다.",
      "발송 일시, 구독 설정 저장 시점과 관심 노선 등록 가능 범위를 확인 부탁드립니다.",
    ],
  },
  "koreanair-tokyo-info": {
    intro: "일본 여행 콘텐츠를 읽는 고객이 인천–도쿄 항공권 검색으로 자연스럽게 이어질 수 있도록 본문 중간 인라인 배너를 요청드립니다. 콘텐츠의 흐름을 끊지 않으면서 운항 일정과 항공권 검색 안내를 쉽게 찾을 수 있는 구성이 필요합니다.",
    requests: [
      "도쿄의 여행 분위기를 보여주는 이미지에 짧은 안내와 검색 동선을 배치해 주세요. 공항, 편명, 운항 시간, 최저 운임이나 할인 조건은 확인된 자료가 없으므로 특정 정보로 확정해 표시하지 말아 주세요.",
      "일본 여행 콘텐츠 중간이라는 노출 위치를 기준으로 PC·모바일 화면의 가독성을 검토해 주세요. 배너 규격은 아직 전달되지 않았으니 이미지와 문장이 잘리지 않는 화면별 구성안을 먼저 제안 부탁드립니다.",
      "아래 도쿄 이미지는 크리에이티브 방향 참고용입니다. 최종 여행지 소재와 사용 권한은 별도 확인하고, 전달한 랜딩에서 검색으로 연결되는 과정과 항공권 검색 전환율의 측정 기준을 함께 정리해 주세요.",
    ],
    headline: "도쿄 여행, 항공편부터 살펴보세요",
    description: "인천–도쿄 운항 일정과 항공권 검색 안내를 확인해 보세요.",
    cta: "항공권 검색 안내",
    reviewNotes: [
      "PC·모바일 배너 규격과 승인된 여행지 이미지가 필요합니다.",
      "랜딩의 출발·도착 공항 선택 방식과 공개 가능한 운항 정보를 확인해 주세요.",
      "노출 빈도, 검색 완료 이벤트와 전환율 집계 기준을 확인 부탁드립니다.",
    ],
  },
};

const IMAGE_ALTS = {
  "lg-oled-launch": "거실에 놓인 TV와 화면을 보여주는 OLED 팝업 이미지 방향 예시",
  "lg-puricare-subscribe": "정수기를 중심으로 구성한 퓨리케어 구독 알림 이미지 방향 예시",
  "lg-codezero-info": "무선 청소기를 중심으로 구성한 코드제로 제품 안내 이미지 방향 예시",
  "samsung-galaxy-launch": "스마트폰 앞면과 뒷면을 보여주는 Galaxy 신제품 알림 이미지 방향 예시",
  "samsung-bespoke-subscribe": "세탁·건조 가전을 중심으로 구성한 Bespoke 구독 팝업 이미지 방향 예시",
  "samsung-buds-info": "무선 이어버드를 보여주는 Galaxy Buds 비교 배너 이미지 방향 예시",
  "koreanair-route-launch": "붉은 지붕이 이어지는 리스본 도심의 신규 노선 팝업 이미지 방향 예시",
  "koreanair-news-subscribe": "여행의 분위기를 담은 SKYPASS 여행소식 구독 알림 이미지 방향 예시",
  "koreanair-tokyo-info": "도쿄 여행 분위기를 담은 항공권 안내 배너 이미지 방향 예시",
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]).replace(/[\r\n]+/g, " ");
}

export function campaignDetails(fixture) {
  const content = CONTENT[fixture.key];
  if (!content) throw new Error(`지원하지 않는 캠페인: ${fixture.key}`);
  // Return fresh arrays so caller-side edits cannot alter the shared scenarios.
  return { ...content, requests: [...content.requests], reviewNotes: [...content.reviewNotes] };
}

export function campaignEmailHtml(fixture) {
  const detail = campaignDetails(fixture);
  const e = escapeHtml;
  const fields = fixture.fields;
  const isPush = fields.channel === "Web push";
  const isInline = fields.channel === "Inline banner";
  const accent = fixture.key.startsWith("koreanair-") ? "#245969" : fixture.key.startsWith("samsung-") ? "#384b78" : "#79513f";
  const tint = fixture.key.startsWith("koreanair-") ? "#eef5f5" : fixture.key.startsWith("samsung-") ? "#f0f2f8" : "#f7f1eb";
  const paragraph = "margin:0 0 16px;font-size:14px;line-height:1.85;color:#36434a;";
  const sectionTitle = "margin:0 0 14px;font-size:17px;line-height:1.5;color:#23343d;font-weight:700;";
  const image = `<img src="/campaign-examples/${e(fixture.key)}.jpg" alt="${e(IMAGE_ALTS[fixture.key])}" width="480" height="480" style="display:block;width:100%;max-width:480px;height:auto;margin:0 auto;border:0;">`;
  const copy = `<div style="padding:${isPush ? "18px" : "22px"};"><p style="margin:0 0 8px;color:${accent};font-size:11px;font-weight:700;letter-spacing:1px;">${e(fields.brand)} · ${e(fields.channel)}</p><h3 style="margin:0 0 10px;font-size:${isInline ? "22px" : "24px"};line-height:1.4;color:#23343d;word-break:keep-all;overflow-wrap:anywhere;">${e(detail.headline)}</h3><p style="${paragraph}">${e(detail.description)}</p><span style="display:inline-block;padding:11px 18px;border-radius:${isPush ? "20px" : "5px"};background:${accent};color:#fffdf8;font-size:13px;line-height:1.5;font-weight:700;">${e(detail.cta)}</span></div>`;
  // Stacked at narrow widths; inline banners wrap naturally without media queries.
  const visual = isInline
    ? `<div style="display:flex;flex-wrap:wrap;align-items:center;background:${tint};"><div style="flex:1 1 160px;max-width:100%;">${image}</div><div style="flex:2 1 220px;max-width:100%;">${copy}</div></div>`
    : isPush
      ? `<div style="max-width:380px;margin:0 auto;background:#fffdf9;border:1px solid #dce3e4;border-radius:12px;overflow:hidden;"><p style="margin:0;padding:12px 18px;background:${tint};color:${accent};font-size:11px;letter-spacing:1px;font-weight:700;">WEB PUSH · 알림 구성 제안</p><div style="width:96px;max-width:100%;padding:18px 18px 0;">${image}</div>${copy}</div>`
      : `<div style="max-width:400px;margin:0 auto;background:#fffdf9;border:1px solid #dce3e4;border-radius:10px;overflow:hidden;"><p style="margin:0;padding:10px 16px;background:${tint};color:${accent};font-size:11px;text-align:right;">팝업 구성 제안 · 닫기 영역</p>${image}${copy}</div>`;
  const rows = Object.entries(fields).map(([key, value]) => `<tr><th scope="row" style="width:32%;padding:11px 10px;border-bottom:1px solid #e2e7e5;text-align:left;vertical-align:top;font-size:12px;font-weight:600;color:#607178;overflow-wrap:anywhere;">${e(LABELS[key] || key)}</th><td style="padding:11px 10px;border-bottom:1px solid #e2e7e5;font-size:13px;line-height:1.65;color:#283b43;overflow-wrap:anywhere;word-break:break-word;">${e(value)}</td></tr>`).join("");
  const questions = [...detail.reviewNotes];
  if (!fields.budget) questions.push("예산이 전달되지 않았습니다. 집행 예산과 제작 범위를 확인해 주실 수 있을까요?");
  return `<!-- 데모 시나리오 ID: ${e(fixture.key)} --><div lang="ko" style="width:100%;max-width:680px;margin:0 auto;background:#fffdf9;color:#283b43;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;overflow-wrap:anywhere;"><div style="padding:22px 16px 20px;border-top:4px solid ${accent};border-bottom:1px solid #e2e7e5;"><p style="margin:0 0 10px;font-size:11px;letter-spacing:1.5px;font-weight:700;color:${accent};">CAMPAIGN REQUEST · ${e(fields.channel)}</p><h2 style="margin:0 0 8px;font-size:23px;line-height:1.45;color:#23343d;">${e(fields.product)} 캠페인 요청</h2><p style="margin:0;font-size:12px;line-height:1.7;color:#687980;">${e(fields.brand)} 캠페인 담당팀 → 캠페인 운영 담당자</p></div><div style="padding:24px 16px 8px;"><p style="${paragraph}">안녕하세요, 캠페인 운영 담당자님.</p><p style="${paragraph}">${e(detail.intro)}</p><h3 style="${sectionTitle}">이번 요청에서 부탁드리는 작업</h3>${detail.requests.map((text) => `<p style="${paragraph}">${e(text)}</p>`).join("")}</div><div style="padding:16px;background:${tint};"><h3 style="${sectionTitle}">제안 카피 · 이미지 구성</h3><p style="margin:0 0 16px;font-size:12px;line-height:1.75;color:#607178;">아래 구성과 카피를 기준으로 채널별 시안을 제안해 주세요.</p>${visual}<p style="margin:14px 0 0;font-size:11px;line-height:1.7;color:#607178;">${e(IMAGE_ALTS[fixture.key])}.</p></div><div style="padding:26px 16px 8px;"><h3 style="${sectionTitle}">전달드리는 요구사항</h3><p style="margin:0 0 12px;font-size:12px;line-height:1.75;color:#607178;">아래 값은 요청 기준입니다. 기재된 일정과 예산은 운영 검토 후 확정 부탁드리며, 기재되지 않은 조건은 추가 확인이 필요합니다.</p><table style="width:100%;table-layout:fixed;border-collapse:collapse;background:#f8faf7;"><tbody>${rows}</tbody></table></div><div style="padding:24px 16px;border-bottom:1px solid #e2e7e5;"><h3 style="${sectionTitle}">다음 회신에서 확인할 내용</h3><ol style="margin:0;padding-left:20px;">${questions.map((text) => `<li style="padding:0 0 10px;font-size:13px;line-height:1.8;color:#36434a;">${e(text)}</li>`).join("")}</ol><p style="margin:14px 0 0;font-size:13px;line-height:1.8;color:#36434a;">진행 가능 일정과 추가로 필요한 자료를 회신 부탁드립니다.</p></div><p style="margin:0;padding:20px 16px;font-size:13px;line-height:1.8;color:#607178;">감사합니다.<br>${e(fields.brand)} 캠페인 담당팀</p></div>`.replace(/[\r\n]+/g, "");
}
