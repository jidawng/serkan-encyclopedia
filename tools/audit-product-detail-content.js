const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const FILES = ["app-data.generated.js", "app-data.full-products.generated.js"];
const RAW_LABEL_RE = /(훅|문제|각도|근거|포지션|대상|연결):/;
const RAW_LABEL_GLOBAL_RE = /(?:^| \/ )([^:\/]+):\s*([^/]+?)(?=\s*\/\s*[^:\/]+:|$)/g;
const ADMIN_TAG_RE = /^(검수 필요|승인|세르칸핏 높음|누끼\/단독컷 있음|제품 연결됨|링크 검수 필요|연결 대기)$/;

function loadData(file) {
  const fullPath = path.join(ROOT, file);
  const code = fs.readFileSync(fullPath, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: file });
  return sandbox.window.SERKAN_DATA;
}

function saveData(file, data) {
  const fullPath = path.join(ROOT, file);
  fs.writeFileSync(fullPath, `window.SERKAN_DATA = ${JSON.stringify(data, null, 2)};\n`);
}

function parseMemo(text = "") {
  const memo = {};
  let match;
  RAW_LABEL_GLOBAL_RE.lastIndex = 0;
  while ((match = RAW_LABEL_GLOBAL_RE.exec(text))) {
    const key = match[1].trim();
    const value = match[2].trim();
    if (["훅", "문제", "각도", "근거", "포지션", "대상", "연결"].includes(key)) {
      memo[key] = value;
    }
  }
  return memo;
}

function hasRawMemo(product) {
  return [
    product.recommendationReason,
    product.trendReason,
    product.target,
    product.actualUse,
    product.caution,
  ].some((value) => RAW_LABEL_RE.test(String(value || "")));
}

function needsCleanup(product) {
  return (
    hasRawMemo(product) ||
    product.contentReviewStatus === "serkan-usage-guide-cleaned" ||
    !product.recommendationReason ||
    !Array.isArray(product.targetChecklist) ||
    !product.targetChecklist.length ||
    !Array.isArray(product.useRows) ||
    !product.useRows.length ||
    !Array.isArray(product.howToSteps) ||
    !product.howToSteps.length ||
    !Array.isArray(product.avoidList) ||
    !product.avoidList.length ||
    !Array.isArray(product.cautionList) ||
    !product.cautionList.length
  );
}

function isMockProduct(product) {
  return product.isMock || product.mockProduct || product.importStatus === "MOCK" || /Mock Product|추천 슬롯|제품 연결 대기/.test(product.productName || "");
}

function cleanTags(product) {
  const tags = [
    product.recommendationType,
    product.category,
    ...(Array.isArray(product.tags) ? product.tags : []),
  ]
    .filter(Boolean)
    .map((tag) => String(tag).trim())
    .filter((tag) => tag && !ADMIN_TAG_RE.test(tag));
  return Array.from(new Set(tags)).slice(0, 8);
}

function classifyProduct(product) {
  const text = [
    product.productName,
    product.brand,
    product.category,
    product.recommendationType,
    product.itemCode,
    product.manualCode,
    ...(Array.isArray(product.tags) ? product.tags : []),
  ].join(" ");

  if (/선크림|선스크린|선젤|sunscreen|SPF|자외선|UV/i.test(text)) return "sunscreen";
  if (/클렌징|클렌저|폼|세안|클렌징오일|cleansing|cleanser/i.test(text)) return "cleanser";
  if (/톤|커버|컨실러|쿠션|파운데이션|비비|BB|세범|프라이머|피니셔|메이크업/i.test(text)) return "tone";
  if (/샴푸|두피|트리트먼트|헤어|탈모|정수리|볼륨|scalp|shampoo/i.test(text)) return "scalp";
  if (/면도|쉐이빙|애프터쉐이브|razor|shaving/i.test(text)) return "shaving";
  if (/바디워시|바디|데오|체취|body|deodorant/i.test(text)) return "body";
  if (/수면|안대|가습|베개|sleep|humidifier/i.test(text)) return "sleep";
  if (/영양제|단백질|전해질|비타민|supplement|protein/i.test(text)) return "food";
  if (/패치|트러블|여드름|진정|시카|장벽|보습|크림|세럼|앰플/i.test(text)) return "skinCare";
  if (/향수|섬유|의류|스타일|셔츠|옷/i.test(text)) return "style";
  if (/정리|청소|조명|데스크|타이머|노트|디지털/i.test(text)) return "system";
  return "generic";
}

function phrase(product, memo) {
  const productName = product.productName || "이 제품";
  const brand = product.brand || "해당 브랜드";
  const slot = product.recommendationType || memo["포지션"] || "추천";
  const item = product.category || "관리";
  return { productName, brand, slot, item };
}

function recommendationReason(product, memo, type) {
  const { productName, brand, slot, item } = phrase(product, memo);
  const problem = memo["문제"];
  const hook = memo["훅"];
  const angle = memo["각도"];
  const reason = memo["근거"];
  const target = memo["대상"];

  const problemSentence = problem ? `${problem} 상황에서는 제품을 고를 때 사용감과 반복 가능성을 함께 봐야 합니다.` : "";
  const typeReason = {
    sunscreen: `선크림은 자외선 차단 효과보다도 매일 빠뜨리지 않고 바를 수 있는 사용감이 중요합니다. ${problemSentence || "끈적임, 백탁, 눈시림이 있으면 루틴이 쉽게 끊기기 때문에 외출 전 손이 가는 제형인지 먼저 봐야 합니다."} ${productName}은 ${slot} 기준에서 ${item} 루틴에 연결하기 좋은 후보이며, 목과 얼굴 경계까지 자연스럽게 바를 수 있는지 확인하면 좋습니다.`,
    cleanser: `세안제는 강하게 씻기는 느낌보다 세안 후 루틴이 이어지는지가 핵심입니다. ${problemSentence || "세안 후 당김이나 붉어짐이 생기면 보습 단계까지 가기 전에 루틴이 흐트러지기 쉽습니다."} ${productName}은 ${slot} 기준에서 매일 세안 루틴에 넣어볼 만한 후보이며, 헹굼 후 당김과 잔여감을 함께 확인해야 합니다.`,
    tone: `톤 보정 제품은 꾸미기보다 피곤해 보이는 인상을 줄이기 위해 쓰는 경우가 많습니다. ${problemSentence || "붉은기, 수염 자국, 칙칙함이 있는 날에는 얼굴 컨디션이 실제보다 더 나빠 보일 수 있습니다."} ${productName}은 ${slot} 기준에서 출근 전이나 미팅 전 빠르게 인상을 정리하는 용도로 검토하기 좋습니다.`,
    scalp: `두피 제품은 한 번의 시원함보다 오후까지 정수리와 두피 컨디션이 무너지지 않는지가 중요합니다. ${problemSentence || "두피가 답답하거나 머리카락이 축 처지면 전체 인상이 피곤해 보이기 쉽습니다."} ${productName}은 ${slot} 기준에서 샴푸 또는 두피 관리 루틴에 붙여볼 만한 후보입니다.`,
    shaving: `면도 제품은 절삭력만큼 면도 후 따가움과 건조함을 줄이는지가 중요합니다. ${problemSentence || "턱과 목 주변이 붉어지면 아침 루틴 전체가 불편해지기 쉽습니다."} ${productName}은 ${slot} 기준에서 면도 직후 피부 부담을 낮추는 후보로 볼 수 있습니다.`,
    body: `바디 제품은 향이나 세정력보다 샤워 후 피부가 편한지, 체취 관리가 과하지 않은지가 중요합니다. ${problem || "샤워 후 건조함이나 잔향 부담이 있으면 매일 쓰기 어렵습니다."} ${productName}은 ${slot} 기준에서 반복 가능한 바디 루틴 후보입니다.`,
    sleep: `수면 관련 제품은 스펙보다 실제로 잠들기 전 루틴을 방해하지 않는지가 중요합니다. ${problem || "빛, 건조함, 답답함 같은 작은 불편이 수면 준비를 끊을 수 있습니다."} ${productName}은 ${slot} 기준에서 취침 전 환경을 안정시키는 후보입니다.`,
    food: `영양 제품은 성분표보다 언제, 얼마나 쉽게 챙길 수 있는지가 루틴 지속성을 좌우합니다. ${problem || "먹는 타이밍이 애매하면 며칠 쓰고 중단되기"} 쉽습니다. ${productName}은 ${slot} 기준에서 식사나 운동 루틴에 붙여볼 만한 후보입니다.`,
    skinCare: `스킨케어 제품은 성분 이름보다 문제가 생기는 순간에 루틴을 단순하게 유지할 수 있는지가 중요합니다. ${problem || "붉어짐, 건조함, 트러블을 만지는 습관이 반복되면 회복이 늦어질 수 있습니다."} ${productName}은 ${slot} 기준에서 피부 컨디션을 안정시키는 후보입니다.`,
    style: `스타일 제품은 멋을 내는 것보다 하루 중 정돈감이 무너지지 않게 돕는지가 중요합니다. ${problem || "향, 묻어남, 지속력이 맞지 않으면 사용 빈도가 떨어집니다."} ${productName}은 ${slot} 기준에서 외출 전 정리 루틴에 넣어볼 수 있습니다.`,
    system: `관리 도구는 기능이 많은 것보다 실제 생활 동선에 놓고 반복할 수 있는지가 중요합니다. ${problem || "준비와 정리 과정이 번거로우면 루틴이 오래가지 않습니다."} ${productName}은 ${slot} 기준에서 작은 행동을 고정시키는 후보입니다.`,
    generic: `${item} 제품은 스펙보다 실제 루틴에 넣었을 때 귀찮지 않은지가 중요합니다. ${problemSentence || "사용 위치와 타이밍이 애매하면 좋은 제품이어도 반복하기 어렵습니다."} ${productName}은 ${slot} 기준에서 사용 맥락이 분명한지 확인하며 볼 만한 후보입니다.`,
  };

  const base = typeReason[type] || typeReason.generic;
  const sourceContext = [hook, angle].filter(Boolean).slice(0, 2).join(", ");
  const targetContext = target ? ` 특히 ${target}에게 맞는지 확인할 만합니다.` : "";
  const reasonContext = reason ? ` ${reason}라는 배경은 참고하되,` : " 최종 판단은";
  return sourceContext
    ? `${base} ${sourceContext}라는 사용 맥락이 분명합니다.${targetContext}${reasonContext} 향, 자극, 묻어남, 반복 사용성 기준으로 보는 것이 좋습니다.`
    : `${base}${targetContext}`;
}

function targetChecklist(product, memo, type) {
  const target = memo["대상"];
  const defaults = {
    sunscreen: ["선크림을 바르면 번들거림이나 백탁 때문에 자주 건너뛰는 사람", "출근 전 얼굴과 목까지 빠르게 바를 데일리 SPF가 필요한 사람", "눈시림이나 끈적임 때문에 선크림을 오래 못 쓰는 사람", "야외 활동보다 매일 반복하는 자외선 차단 루틴이 먼저 필요한 사람"],
    cleanser: ["세안 후 얼굴이 당기거나 붉어지는 사람", "선크림이나 피지 잔여감이 남는 느낌이 싫은 사람", "강한 뽀드득함보다 편한 세안을 원하는 사람", "세안 후 보습 단계까지 자연스럽게 이어가고 싶은 사람"],
    tone: ["화장은 부담스럽지만 피부가 좋아 보이고 싶은 사람", "붉은기, 수염 자국, 칙칙한 톤이 신경 쓰이는 사람", "출근, 미팅, 촬영 전 얼굴 인상을 빠르게 정리하고 싶은 사람", "파운데이션보다 자연스러운 보정을 원하는 사람"],
    scalp: ["오후만 되면 정수리 볼륨이 죽는 사람", "샴푸 직후는 괜찮지만 저녁에 두피가 답답한 사람", "두피 냄새나 유분 때문에 머리를 자주 만지는 사람", "강한 스타일링보다 두피 컨디션부터 잡고 싶은 사람"],
    shaving: ["면도 후 턱과 목이 따갑거나 붉어지는 사람", "향이 강한 스킨 제품이 부담스러운 사람", "면도 후 보습 단계를 자주 건너뛰는 사람", "아침 면도 루틴을 짧고 안정적으로 만들고 싶은 사람"],
    body: ["샤워 후 피부가 건조하거나 가려운 사람", "향은 원하지만 과한 잔향은 부담스러운 사람", "운동 후 체취와 땀 냄새가 신경 쓰이는 사람", "매일 쓰기 쉬운 바디 루틴이 필요한 사람"],
    sleep: ["잠들기 전 빛, 건조함, 답답함에 예민한 사람", "수면 준비 루틴을 물건 하나로 단순화하고 싶은 사람", "출장이나 이동 중에도 수면 환경을 맞추고 싶은 사람", "취침 전 스마트폰 사용을 줄이고 싶은 사람"],
    food: ["운동 전후나 식후에 챙길 기준이 필요한 사람", "영양제를 사두고 자주 빼먹는 사람", "맛, 휴대성, 섭취 타이밍이 루틴 지속에 중요한 사람", "몸 관리 루틴을 음식과 함께 묶고 싶은 사람"],
    skinCare: ["트러블이나 붉어짐이 생기면 손으로 자주 만지는 사람", "피부가 예민해졌을 때 루틴을 줄이고 싶은 사람", "보습과 진정을 한 단계로 단순화하고 싶은 사람", "피부 컨디션이 흔들릴 때 쓸 후보가 필요한 사람"],
    style: ["외출 전 정돈감이 쉽게 무너지는 사람", "향, 묻어남, 지속력 기준으로 제품을 고르고 싶은 사람", "과한 스타일링보다 자연스러운 정리를 원하는 사람", "첫인상이나 촬영 전 빠른 보정이 필요한 사람"],
    system: ["좋은 계획보다 실제 행동을 고정할 도구가 필요한 사람", "책상, 수면, 기록 루틴이 자주 흐트러지는 사람", "사용 위치가 명확한 관리 도구를 찾는 사람", "복잡한 앱보다 바로 쓰는 도구가 맞는 사람"],
    generic: ["루틴에서 이 제품을 쓸 위치가 분명한 사람", "향, 자극, 번거로움보다 반복 사용성을 먼저 보는 사람", "비슷한 제품 중 실사용 기준으로 고르고 싶은 사람"],
  };
  const list = defaults[type] || defaults.generic;
  return target ? [`${target}에 가까운 사람`, ...list].slice(0, 5) : list.slice(0, 5);
}

function featureMetrics(product, type) {
  const defaults = {
    sunscreen: [["발림성", "강함"], ["백탁 부담", "보통"], ["눈시림 리스크", "보통"], ["번들거림", "보통"], ["데일리 반복성", "강함"], ["목까지 바르기", "보통"]],
    cleanser: [["세정력", "보통"], ["세안 후 당김", "약함"], ["헹굼감", "강함"], ["잔여감", "약함"], ["민감 피부 부담", "보통"], ["보습 루틴 연결", "강함"]],
    tone: [["톤 보정", "강함"], ["붉은기 커버", "보통"], ["자연스러운 마무리", "강함"], ["묻어남", "보통"], ["세안 편의성", "강함"], ["초보자 적합", "강함"]],
    scalp: [["두피 산뜻함", "보통"], ["볼륨 유지", "보통"], ["향 호불호", "보통"], ["세정감", "강함"], ["저녁 답답함", "보통"], ["반복 사용성", "강함"]],
    shaving: [["면도 후 진정", "강함"], ["따가움 부담", "보통"], ["보습감", "보통"], ["향 호불호", "보통"], ["끈적임", "약함"], ["아침 루틴 적합", "강함"]],
    body: [["세정력", "강함"], ["보습감", "보통"], ["향 지속", "보통"], ["건조함 리스크", "보통"], ["운동 후 사용", "강함"], ["데일리 반복성", "강함"]],
    sleep: [["착용/사용 편의", "강함"], ["답답함", "보통"], ["휴대성", "강함"], ["취침 루틴 적합", "강함"], ["관리 난이도", "보통"], ["반복 사용성", "보통"]],
    food: [["섭취 편의", "강함"], ["맛 호불호", "보통"], ["휴대성", "강함"], ["식후 루틴 연결", "보통"], ["운동 루틴 연결", "강함"], ["재구매 확인", "보통"]],
    skinCare: [["진정감", "보통"], ["보습감", "보통"], ["끈적임", "보통"], ["자극 리스크", "보통"], ["국소 사용", "강함"], ["루틴 단순화", "강함"]],
    style: [["정돈감", "강함"], ["지속력", "보통"], ["향 호불호", "보통"], ["묻어남", "보통"], ["외출 전 사용", "강함"], ["초보자 적합", "보통"]],
    system: [["사용 편의", "강함"], ["보관 편의", "보통"], ["반복 사용성", "강함"], ["설정 난이도", "보통"], ["생활 동선 적합", "강함"], ["관리 부담", "보통"]],
    generic: [["루틴 적합", "보통"], ["반복 사용성", "보통"], ["휴대성", "보통"], ["초보자 적합", "보통"], ["자극 리스크", "보통"], ["구매 전 확인", "보통"]],
  };
  return (defaults[type] || defaults.generic).map(([label, level]) => ({ label, level }));
}

function useRows(product, type) {
  const rows = {
    sunscreen: [["발림성", "얼굴과 목에 빠르게 펴 바를 수 있는지, 손에 남는 끈적임이 루틴을 방해하지 않는지 봅니다."], ["마무리감", "완전 매트보다 자연스러운 마무리가 데일리 사용에는 유리합니다. 지성 피부는 오후 유분을 확인하세요."], ["눈시림", "눈가 가까이 바를 때 따가움이 생기면 양을 줄이거나 눈 주변은 피해서 테스트합니다."], ["묻어남", "마스크, 셔츠 목, 손수건에 묻어나는지 외출 전 한 번 확인하는 것이 좋습니다."]],
    cleanser: [["거품/세정감", "강한 뽀드득함보다 세안 후 피부가 편한지 확인합니다."], ["헹굼감", "미끌거림이 오래 남으면 아침 루틴에서 귀찮아질 수 있어 헹굼 시간을 봅니다."], ["당김", "세안 후 3분 안에 당김이 심하면 보습 루틴과 함께 조정해야 합니다."], ["향/자극", "향이 강하거나 눈가가 따가우면 사용 빈도를 낮춰 테스트합니다."]],
    tone: [["텍스처", "로션이나 크림처럼 얇게 퍼지는지, 두껍게 얹히는지 먼저 확인합니다."], ["발림성", "손으로 빠르게 펴 바를 수 있지만 한 번에 많이 바르면 경계가 생길 수 있습니다."], ["마무리", "피부가 좋아 보이는 정도인지, 화장한 티가 나는지 자연광에서 확인합니다."], ["묻어남", "셔츠 목, 마스크 안쪽, 손수건에 묻어나는지 확인해야 합니다."]],
    scalp: [["세정감", "두피가 시원한 느낌보다 헹군 뒤 답답함이 남지 않는지가 중요합니다."], ["볼륨감", "정수리 볼륨은 샴푸 직후보다 오후에 무너지는지를 기준으로 봅니다."], ["향", "향이 오래 남는 제품은 호불호가 커서 직장/운동 후 상황을 함께 생각해야 합니다."], ["사용 빈도", "매일 쓰는지 주 2~3회 쓰는지에 따라 건조함이나 뻣뻣함을 확인합니다."]],
    shaving: [["진정감", "면도 직후 따가움이 빠르게 가라앉는지 봅니다."], ["보습감", "바른 뒤 턱과 목이 당기지 않아야 다음 단계가 이어집니다."], ["향", "강한 스킨 향이 부담스러우면 소량 테스트가 필요합니다."], ["끈적임", "출근 전 셔츠나 마스크에 닿아도 불편하지 않은지 확인합니다."]],
    body: [["세정력", "운동 후 땀과 체취가 씻기는 느낌은 보되, 과한 건조함은 피해야 합니다."], ["향", "샤워 직후 향은 좋더라도 잔향이 과하면 데일리 사용이 부담될 수 있습니다."], ["보습감", "샤워 후 팔과 정강이가 당기는지 확인합니다."], ["사용 편의", "펌프, 용량, 보관 위치가 매일 쓰기 쉬운지 봅니다."]],
    sleep: [["착용감", "잠들기 전 거슬림이 있으면 좋은 제품이어도 오래 쓰기 어렵습니다."], ["차단감", "빛이나 건조함을 얼마나 줄이는지 실제 취침 환경에서 확인합니다."], ["관리", "세척이나 충전처럼 유지 관리가 번거로운지 봅니다."], ["휴대성", "출장이나 이동 중에도 쓸 수 있는지 확인합니다."]],
    food: [["맛", "맛이 맞지 않으면 루틴 유지가 어렵기 때문에 처음부터 대용량보다 소량 테스트가 좋습니다."], ["섭취 타이밍", "식후, 운동 전후, 아침 중 언제 챙길지 고정해야 합니다."], ["휴대성", "가방이나 책상에 두고 챙기기 쉬운 형태인지 봅니다."], ["속 부담", "공복 섭취가 불편하면 식사 루틴과 묶어야 합니다."]],
    skinCare: [["흡수감", "바른 뒤 겉돌거나 끈적이면 사용량을 줄여야 합니다."], ["진정감", "붉어짐이나 열감이 있는 날 바로 편해지는지보다 다음날 컨디션을 봅니다."], ["국소 사용", "얼굴 전체보다 필요한 부위에만 쓰는 편이 루틴을 단순하게 만듭니다."], ["자극", "따가움이나 가려움이 반복되면 사용을 중단하고 세안/보습 루틴을 먼저 점검합니다."]],
    style: [["정돈감", "바른 직후보다 외출 후에도 자연스럽게 유지되는지 봅니다."], ["묻어남", "옷, 손, 마스크에 닿는 제품은 묻어남 확인이 필요합니다."], ["향", "향이 강하면 좋은 인상보다 부담으로 느껴질 수 있습니다."], ["재정리", "하루 중 다시 손보기 쉬운지 확인합니다."]],
    system: [["설치/준비", "꺼내고 준비하는 시간이 길면 루틴에 남기 어렵습니다."], ["사용 위치", "책상, 욕실, 침대 옆처럼 고정 위치가 있어야 반복됩니다."], ["관리 부담", "세척, 충전, 보관이 귀찮으면 사용 빈도가 떨어집니다."], ["실행감", "작은 행동을 바로 시작하게 만드는지 봅니다."]],
    generic: [["사용감", "스펙보다 실제 루틴에 넣었을 때 귀찮지 않은지가 중요합니다."], ["편의성", "꺼내기 쉽고 사용 시간이 짧아야 루틴에 남습니다."], ["지속성", "한 번 좋았는지보다 일주일 이상 반복 가능한지를 봅니다."], ["호불호", "향, 자극, 묻어남, 보관 위치를 함께 확인합니다."]],
  };
  return (rows[type] || rows.generic).map(([label, value]) => ({ label, value }));
}

function howToSteps(type) {
  const steps = {
    sunscreen: ["세안과 보습 후 외출 전 마지막 단계에 바른다.", "얼굴 중앙보다 광대, 이마, 코, 목처럼 노출 부위에 먼저 나눠 올린다.", "눈가 가까이는 양을 줄이고 목 경계까지 자연스럽게 연결한다.", "외출 시간이 길면 오후에 덧바를 방법을 미리 정한다."],
    cleanser: ["손을 먼저 씻고 얼굴을 미온수로 적신다.", "거품을 충분히 낸 뒤 코, 턱, 이마처럼 잔여감이 남기 쉬운 부위부터 문지른다.", "30초 안팎으로 끝내고 미온수로 충분히 헹군다.", "수건으로 문지르지 말고 눌러 닦은 뒤 보습 단계로 바로 넘어간다."],
    tone: ["세안 후 보습까지 끝낸 뒤 사용한다.", "붉은기, 수염 자국, 칙칙한 부위부터 소량 도포한다.", "턱선과 목 경계는 손에 남은 양으로 자연스럽게 연결한다.", "외출 전 자연광에서 티 나는 부분과 묻어남을 확인한다."],
    scalp: ["두피를 충분히 적신 뒤 손끝으로 정수리와 헤어라인을 나눠 문지른다.", "손톱이 아니라 지문 부분으로 두피를 마사지한다.", "잔여감이 남지 않도록 충분히 헹군다.", "오후 두피 답답함이나 볼륨 변화를 기준으로 사용 빈도를 조절한다."],
    shaving: ["면도 직후 물기를 가볍게 정리한다.", "따가운 부위와 목 라인부터 소량 바른다.", "문지르기보다 눌러 흡수시킨다.", "건조함이 남으면 가벼운 보습제를 이어 바른다."],
    body: ["샤워 중 땀과 피지가 많은 부위부터 사용한다.", "겨드랑이, 등, 가슴처럼 체취가 남기 쉬운 부위를 충분히 헹군다.", "샤워 후 당김이 있으면 보습을 바로 이어간다.", "운동 후와 평일 사용감을 나눠 확인한다."],
    sleep: ["취침 30분 전 사용할 위치에 미리 둔다.", "빛, 습도, 착용감처럼 수면을 방해하는 요소를 하나씩 줄인다.", "잠들기 직전 불편하면 강도를 낮추거나 위치를 바꾼다.", "아침에 답답함이나 피부 자국이 남는지 확인한다."],
    food: ["섭취 타이밍을 아침, 식후, 운동 전후 중 하나로 고정한다.", "처음에는 소량 또는 짧은 기간으로 반응을 본다.", "속 불편함이나 맛 호불호를 기록한다.", "괜찮으면 보관 위치를 고정해 빼먹지 않게 만든다."],
    skinCare: ["세안 후 피부가 마르기 전에 필요한 부위부터 바른다.", "처음에는 적은 양으로 테스트한다.", "따가움이나 붉어짐이 반복되는지 확인한다.", "문제가 없으면 정해진 루틴 위치에 고정한다."],
    style: ["외출 전 필요한 부위를 먼저 정한다.", "한 번에 많이 쓰지 말고 소량씩 더한다.", "자연광이나 실내 조명에서 티 나는지 확인한다.", "묻어남과 향이 부담스럽지 않은지 본다."],
    system: ["사용할 위치를 하나로 정한다.", "처음에는 1분 안에 끝나는 행동으로 시작한다.", "불편한 준비 과정이 있으면 줄인다.", "일주일 후 계속 쓰는지 확인한다."],
    generic: ["사용 전 필요한 상황을 먼저 정한다.", "처음에는 적은 양이나 짧은 시간으로 테스트한다.", "사용 후 불편한 감각이 반복되는지 확인한다.", "괜찮으면 정해진 루틴 위치에 고정한다."],
  };
  return steps[type] || steps.generic;
}

function recommendedSituations(product, type) {
  const map = {
    sunscreen: ["외출 전", "출근 전", "야외 활동", "목까지 바르는 날", "햇빛 강한 날"],
    cleanser: ["아침 세안", "선크림 사용 후", "운동 후", "피지 많은 날", "보습 전"],
    tone: ["출근 전", "미팅 전", "소개팅 전", "촬영 전", "면접 전", "컨디션이 안 좋아 보이는 날"],
    scalp: ["아침 샴푸", "운동 후", "정수리 볼륨이 죽는 날", "두피가 답답한 날", "저녁 약속 전"],
    shaving: ["면도 직후", "출근 전", "턱 라인이 붉은 날", "목 면도 후", "향 강한 제품이 부담스러운 날"],
    body: ["운동 후", "샤워 루틴", "여름철", "체취가 신경 쓰이는 날", "피부가 건조한 날"],
    sleep: ["취침 전", "출장", "빛이 거슬리는 밤", "수면 환경 리셋", "스마트폰 줄이는 날"],
    food: ["식후", "운동 전후", "아침 루틴", "컨디션 보충", "외출 전 챙기기"],
    skinCare: ["초기 트러블", "면도 후", "피부가 예민한 날", "건조한 날", "루틴을 줄이고 싶은 날"],
    style: ["외출 전", "미팅 전", "사진 찍는 날", "첫인상 관리", "저녁 약속 전"],
    system: ["업무 시작 전", "퇴근 후", "주간 정리", "디지털 디톡스", "루틴 리셋"],
    generic: ["루틴 시작 전", "외출 전", "사용 기준을 정하는 날", "반복 루틴 테스트"],
  };
  return Array.from(new Set([...(map[type] || map.generic), ...cleanTags(product).slice(0, 2)])).slice(0, 8);
}

function avoidList(type) {
  const map = {
    sunscreen: ["백탁이나 눈시림에 매우 예민한데 테스트 없이 바로 장시간 쓰려는 사람", "수분감보다 완전 보송한 마무리만 원하는 사람", "목과 얼굴 톤 차이를 확인하지 않는 사람"],
    cleanser: ["강한 뽀드득함을 세정력의 기준으로 보는 사람", "세안 후 바로 보습하지 않는 사람", "눈가 자극을 확인하지 않고 얼굴 전체에 오래 문지르는 사람"],
    tone: ["완전한 피부 커버를 원하는 사람", "파운데이션 수준의 커버력을 기대하는 사람", "셔츠 목 묻어남이 신경 쓰이는 사람", "색조 제품 사용 자체가 부담스러운 사람"],
    scalp: ["강한 쿨링감만 기대하는 사람", "두피가 건조한데 매일 강하게 세정하려는 사람", "향이 남는 헤어 제품에 민감한 사람"],
    shaving: ["알코올감이나 향에 민감한데 테스트 없이 쓰려는 사람", "면도 상처가 난 부위에 바로 바르려는 사람", "보습 단계를 완전히 생략하려는 사람"],
    body: ["향이 강한 제품을 싫어하는 사람", "샤워 후 건조함이 심한데 보습을 하지 않는 사람", "등이나 가슴 트러블이 반복되는 사람"],
    sleep: ["얼굴에 닿는 제품이 조금만 답답해도 잠을 못 자는 사람", "세척이나 관리가 번거로운 제품을 싫어하는 사람", "수면 문제를 제품 하나로만 해결하려는 사람"],
    food: ["성분이나 복용 기준을 확인하지 않는 사람", "공복 섭취에 예민한 사람", "맛이 맞지 않아도 대용량부터 사려는 사람"],
    skinCare: ["피부가 따가운데 계속 덧바르려는 사람", "원인을 모른 채 제품만 계속 늘리는 사람", "향이나 끈적임에 민감한 사람"],
    style: ["묻어남이나 향을 확인하지 않고 바로 외출하는 사람", "강한 스타일링 효과만 기대하는 사람", "자연스러운 마무리보다 확실한 변화만 원하는 사람"],
    system: ["준비 과정이 복잡한 도구를 오래 못 쓰는 사람", "사용 위치를 정하지 않고 구매부터 하려는 사람", "루틴보다 장비 수집이 먼저 되는 사람"],
    generic: ["사용감 호불호를 확인하지 않고 바로 매일 쓰려는 사람", "향, 자극, 묻어남 같은 실사용 변수를 크게 신경 쓰는 사람", "현재 루틴에 넣을 위치가 아직 정해지지 않은 사람"],
  };
  return map[type] || map.generic;
}

function cautionList(product, type) {
  const base = {
    sunscreen: ["눈가 가까이는 소량부터 테스트하세요.", "목과 얼굴 톤 차이가 생기지 않게 경계를 확인하세요.", "마스크나 셔츠 목에 묻어나는지 확인하세요.", "피부가 따가우면 세안 후 보습 루틴을 먼저 점검하세요."],
    cleanser: ["오래 문지를수록 좋은 세안은 아닙니다.", "세안 후 당김이 반복되면 사용량과 세안 시간을 줄이세요.", "눈가 자극이 있으면 해당 부위를 피하세요.", "세안 후 보습을 바로 이어가세요."],
    tone: ["많이 바르면 얼굴만 밝아 보이거나 목과 톤 차이가 날 수 있습니다.", "건조한 피부는 각질이 부각될 수 있어 보습 후 소량부터 시작하세요.", "셔츠 목, 마스크, 손수건에 묻어남이 있는지 확인하세요.", "트러블이 반복되면 사용을 중단하고 세안 루틴을 점검하세요."],
    scalp: ["두피가 건조하면 매일 사용보다 빈도 조절이 필요합니다.", "강한 향이나 쿨링감은 호불호가 큽니다.", "두피 가려움이 반복되면 사용을 중단하세요.", "헤어라인과 정수리 헹굼을 충분히 하세요."],
    shaving: ["상처 난 부위에는 바로 바르지 마세요.", "향이나 알코올감이 부담되면 턱 아래부터 테스트하세요.", "면도날 상태가 나쁘면 제품만으로 진정이 어렵습니다.", "당김이 남으면 보습제를 이어 바르세요."],
    body: ["향이 강한 제품은 외출 전 사용 시 잔향을 확인하세요.", "건조함이 반복되면 샤워 후 보습을 추가하세요.", "등이나 가슴 트러블이 늘면 사용을 중단하세요.", "운동 후에는 충분히 헹궈 잔여감을 줄이세요."],
    sleep: ["얼굴에 닿는 제품은 세척 주기를 정하세요.", "답답하면 강도나 착용 위치를 조절하세요.", "수면 불편이 반복되면 환경 전체를 함께 점검하세요.", "피부 자국이나 압박감이 남는지 아침에 확인하세요."],
    food: ["복용 기준과 성분을 구매 전 확인하세요.", "공복 섭취가 불편하면 식후로 옮기세요.", "특정 질환이나 복용 약이 있으면 전문가 확인이 필요합니다.", "맛이 맞는지 소량부터 테스트하세요."],
    skinCare: ["따가움이 반복되면 사용을 중단하세요.", "여러 제품을 동시에 바꾸지 마세요.", "국소 제품은 필요한 부위부터 소량 사용하세요.", "피부 상태가 악화되면 세안과 보습을 단순화하세요."],
    style: ["향, 묻어남, 지속력은 외출 전 소량으로 확인하세요.", "의류에 닿는 제품은 얼룩 가능성을 봐야 합니다.", "과한 사용은 자연스러움을 떨어뜨릴 수 있습니다.", "피부 트러블이 생기면 세안 루틴을 함께 점검하세요."],
    system: ["구매 전 실제 둘 위치를 정하세요.", "세척, 충전, 보관 부담을 확인하세요.", "한 번에 여러 도구를 늘리지 마세요.", "일주일 사용 후 계속 쓰는지 점검하세요."],
    generic: ["구매 전 성분, 사이즈, 사용 환경, 판매처를 확인하세요.", "처음에는 적은 양이나 짧은 시간으로 테스트하세요.", "불편감이 반복되면 사용 빈도를 낮추거나 중단하세요.", "제품 하나만 탓하지 말고 습관과 환경을 함께 보세요."],
  };
  return base[type] || base.generic;
}

function serkanMetrics(type) {
  const defaults = {
    tone: [["실행 난이도", "쉬움"], ["자연스러움", "강함"], ["반복 사용 가능성", "강함"], ["묻어남 체크", "보통"], ["초보자 추천도", "강함"]],
    sunscreen: [["실행 난이도", "쉬움"], ["반복 사용 가능성", "강함"], ["눈시림 체크", "보통"], ["목까지 바르기", "보통"], ["초보자 추천도", "강함"]],
    cleanser: [["실행 난이도", "쉬움"], ["반복 사용 가능성", "강함"], ["자극 체크", "보통"], ["보습 연결성", "강함"], ["초보자 추천도", "강함"]],
    scalp: [["실행 난이도", "쉬움"], ["반복 사용 가능성", "보통"], ["향 호불호", "보통"], ["두피 답답함 체크", "강함"], ["초보자 추천도", "보통"]],
    generic: [["실행 난이도", "보통"], ["반복 사용 가능성", "보통"], ["사용감 확인", "보통"], ["루틴 적합성", "보통"], ["초보자 추천도", "보통"]],
  };
  return (defaults[type] || defaults.generic).map(([label, level]) => ({ label, level }));
}

function cleanProduct(product) {
  if (isMockProduct(product) || !needsCleanup(product)) return { changed: false };
  const original = product.recommendationReason || product.trendReason || "";
  const memo = parseMemo(original);
  const type = classifyProduct(product);
  const reason = recommendationReason(product, memo, type);
  const tags = cleanTags(product);

  product.recommendationReason = reason;
  product.trendReason = reason;
  product.target = targetChecklist(product, memo, type).join(" / ");
  product.targetChecklist = targetChecklist(product, memo, type);
  product.actualUse = useRows(product, type).map((row) => `${row.label}: ${row.value}`).join(" ");
  product.useRows = useRows(product, type);
  product.featureMetrics = featureMetrics(product, type);
  product.howToSteps = howToSteps(type);
  product.recommendedSituations = recommendedSituations(product, type);
  product.avoidList = avoidList(type);
  product.cautionList = cautionList(product, type);
  product.caution = product.cautionList.join(" ");
  product.serkanMetrics = serkanMetrics(type);
  product.contentReviewStatus = "serkan-usage-guide-cleaned";
  product.points = tags.slice(0, 5);
  product.contextTags = tags.slice(0, 8);

  return {
    changed: true,
    type,
    before: original,
    after: reason,
  };
}

const report = [];
const summary = [];

for (const file of FILES) {
  const data = loadData(file);
  const products = Array.isArray(data.products) ? data.products : [];
  let scanned = 0;
  let changed = 0;
  const samples = [];

  for (const product of products) {
    if (isMockProduct(product)) continue;
    scanned += 1;
    const result = cleanProduct(product);
    if (result.changed) {
      changed += 1;
      if (samples.length < 12) {
      samples.push({
          code: product.code,
          productName: product.productName,
          type: result.type,
          after: result.after,
        });
      }
    }
  }

  saveData(file, data);

  const remaining = products.filter((product) => !isMockProduct(product) && hasRawMemo(product)).length;
  summary.push({ file, scanned, changed, remaining });
  report.push(`## ${file}`);
  report.push("");
  report.push(`- Real products scanned: ${scanned}`);
  report.push(`- Raw memo products cleaned: ${changed}`);
  report.push(`- Remaining raw memo products: ${remaining}`);
  report.push("");
  report.push("| Code | Product | Type | Cleaned Display Copy |");
  report.push("|---|---|---|---|");
  for (const sample of samples) {
    report.push(`| ${sample.code || "-"} | ${String(sample.productName || "-").replace(/\|/g, "/")} | ${sample.type} | ${sample.after.replace(/\|/g, "/")} |`);
  }
  report.push("");
}

const reportPath = path.join(ROOT, "data/product-detail-content-audit.md");
fs.writeFileSync(
  reportPath,
  [
    "# Product Detail Content Audit",
    "",
    "Generated preview 데이터에서 Product Detail에 노출될 수 있는 내부 큐레이션 메모를 점검하고 사용자용 실사용 문장으로 변환했습니다.",
    "",
    "## Summary",
    "",
    "| File | Scanned | Cleaned | Remaining |",
    "|---|---:|---:|---:|",
    ...summary.map((row) => `| ${row.file} | ${row.scanned} | ${row.changed} | ${row.remaining} |`),
    "",
    ...report,
  ].join("\n")
);

console.log(JSON.stringify({ summary, reportPath }, null, 2));
