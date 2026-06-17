const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const appDataPath = path.join(root, "app-data.js");
const stagingPath = path.join(root, "data", "staging-product-import.json");
const generatedPath = path.join(root, "app-data.generated.js");
const previewPath = path.join(root, "index.generated-preview.html");
const indexPath = path.join(root, "index.html");
const approvalPath = path.join(root, "data", "product-import-batch-b-approved-expansion.json");
const crawlBatch1Path = path.join(root, "data", "product-import-crawl-batch-1.json");
const crawlBatch2Path = path.join(root, "data", "product-import-crawl-batch-2.json");
const crawlBatch3Path = path.join(root, "data", "product-import-crawl-batch-3.json");
const crawlBatch4Path = path.join(root, "data", "product-import-crawl-batch-4.json");
const crawlBatch5Path = path.join(root, "data", "product-import-crawl-batch-5.json");
const crawlBatch6Path = path.join(root, "data", "product-import-crawl-batch-6.json");
const crawlBatch7Path = path.join(root, "data", "product-import-crawl-batch-7.json");

function readRuntimeData() {
  const source = fs.readFileSync(appDataPath, "utf8");
  const match = source.match(/window\.SERKAN_DATA\s*=\s*([\s\S]*?);\s*$/);
  if (!match) throw new Error("Could not parse window.SERKAN_DATA from app-data.js");
  return JSON.parse(match[1]);
}

function ensureUniqueCode(collection, code, type) {
  if (collection.some((entry) => entry.code === code)) {
    throw new Error(`${type} code already exists: ${code}`);
  }
}

function normalizeItem(data, code, patch) {
  const item = data.items.find((entry) => entry.code === code);
  if (!item) throw new Error(`Missing item ${code}`);
  Object.assign(item, patch);
}

function normalizeManual(data, code, patch) {
  const manual = data.manuals.find((entry) => entry.code === code);
  if (!manual) throw new Error(`Missing manual ${code}`);
  Object.assign(manual, patch);
}

function addItem(data, item) {
  ensureUniqueCode(data.items, item.code, "Item");
  data.items.push(item);
}

function addManual(data, manual) {
  ensureUniqueCode(data.manuals, manual.code, "Manual");
  data.manuals.push(manual);
}

function addRoutine(data, routine) {
  ensureUniqueCode(data.routines, routine.code, "Routine");
  data.routines.push(routine);
}

function manualBlocks({ purpose, method = [], steps = [], cadence = [], items = [], cautions = [] }) {
  return [
    { label: "목적", text: purpose, items: [] },
    { label: "방법론 연결", text: "", items: method },
    { label: "실행 순서", text: "", items: steps.map((step, index) => `${index + 1}. ${step}`) },
    { label: "반복 기준", text: "", items: cadence },
    { label: "추천 아이템", text: "", items: items.map((item) => `${item} →`) },
    { label: "주의사항", text: "", items: cautions },
  ];
}

function productFromRecord(record, overrides = {}) {
  if (!record) throw new Error(`Missing staging record for ${overrides.code || overrides.productName || "unknown product"}`);
  return {
    code: overrides.code,
    brand: record.brand,
    productName: record.productName,
    category: overrides.category || record.candidateProductGroup,
    itemCode: record.candidateItemCode,
    domain: record.candidateDomain,
    slotId: overrides.slotId || null,
    recommendationType: overrides.recommendationType || record.recommendationType || "데일리",
    imageUrl: record.productImage,
    productLink: record.productLink,
    recommendationReason: overrides.recommendationReason || record.reason,
    target: overrides.target || "SERKAN 루틴에 맞춰 실제 제품 검증이 필요한 사용자",
    actualUse: overrides.actualUse || "향, 끈적임, 흡수감, 휴대성 같은 실사용 감각은 리뷰 검수 후 업데이트합니다.",
    caution: overrides.caution || "성분, 피부 반응, 재고/가격, 공식 판매처는 실제 구매 전 확인이 필요합니다.",
    tags: [
      record.notionCategory,
      record.notionAssetType,
      overrides.category || record.candidateProductGroup,
      overrides.recommendationType || record.recommendationType,
      ...(overrides.tags || []),
    ].filter(Boolean),
    connectionStatus: "ready",
    source: record.source,
    sourceId: record.sourceId,
  };
}

const productSlotPresets = {
  sunscreen: [
    { id: "budget", label: "가성비" },
    { id: "sensitive", label: "민감/입문", aliases: ["민감·입문"] },
    { id: "premium", label: "프리미엄" },
    { id: "oily", label: "지성" },
    { id: "combination", label: "복합성" },
    { id: "dry", label: "건성" },
  ],
  deodorant: [
    { id: "budget", label: "가성비" },
    { id: "sensitive", label: "민감/입문", aliases: ["민감성"] },
    { id: "portable", label: "휴대/상황형" },
    { id: "lowScent", label: "저향" },
    { id: "powdery", label: "보송함 중심" },
  ],
  scalpSerum: [
    { id: "budget", label: "가성비" },
    { id: "daily", label: "데일리/집중관리" },
    { id: "premium", label: "프리미엄" },
    { id: "cooling", label: "두피 열감" },
    { id: "volume", label: "정수리 볼륨" },
  ],
  recoveryDevice: [
    { id: "budget", label: "가성비" },
    { id: "sensitive", label: "민감/입문" },
    { id: "premium", label: "프리미엄" },
    { id: "device", label: "프리미엄/디바이스" },
    { id: "portable", label: "휴대성" },
  ],
  maleTone: [
    { id: "toneLotion", label: "톤 보정 로션" },
    { id: "coverStick", label: "부분 커버 스틱" },
    { id: "concealer", label: "컨실러" },
    { id: "cushionFoundation", label: "쿠션 / 파운데이션" },
    { id: "primerFinisher", label: "프라이머 / 피니셔" },
    { id: "sebumPowder", label: "세범 파우더" },
    { id: "settingSpray", label: "세팅 스프레이" },
    { id: "skinExpression", label: "피부 표현 보정" },
    { id: "classificationReview", label: "분류 검수 필요" },
  ],
  bodyWash: [
    { id: "budget", label: "가성비" },
    { id: "sensitive", label: "민감성", aliases: ["민감/입문"] },
    { id: "scent", label: "향 중심" },
    { id: "cleansing", label: "세정력 중심" },
    { id: "daily", label: "입문/데일리" },
  ],
  sleepMask: [
    { id: "budget", label: "가성비" },
    { id: "entry", label: "입문" },
    { id: "premium", label: "프리미엄" },
    { id: "device", label: "프리미엄/디바이스" },
    { id: "lightBlock", label: "빛 차단" },
  ],
  acneCare: [
    { id: "budget", label: "가성비" },
    { id: "spotPatch", label: "스팟 패치" },
    { id: "soothing", label: "진정 크림" },
    { id: "emergency", label: "응급 케어" },
    { id: "premium", label: "프리미엄" },
  ],
  waterFlosser: [
    { id: "budget", label: "가성비" },
    { id: "entry", label: "입문" },
    { id: "portable", label: "휴대형" },
    { id: "orthodontic", label: "교정/임플란트" },
    { id: "premium", label: "프리미엄" },
  ],
  humidifier: [
    { id: "budget", label: "가성비" },
    { id: "bedroom", label: "침실 저소음" },
    { id: "smartLarge", label: "대용량/스마트" },
    { id: "hygrometer", label: "습도계" },
    { id: "premium", label: "프리미엄" },
  ],
  aftershave: [
    { id: "budget", label: "가성비" },
    { id: "sensitive", label: "민감/입문" },
    { id: "alcoholFree", label: "알코올프리" },
    { id: "soothingBalm", label: "진정 밤" },
    { id: "premium", label: "프리미엄" },
  ],
  electrolyte: [
    { id: "budget", label: "가성비" },
    { id: "portable", label: "운동/휴대" },
    { id: "tablet", label: "타블렛" },
    { id: "lowSugar", label: "저당" },
    { id: "premium", label: "프리미엄" },
  ],
  woundKit: [
    { id: "basic", label: "기본 상처" },
    { id: "waterproof", label: "방수" },
    { id: "friction", label: "마찰 보호" },
    { id: "portableKit", label: "휴대 키트" },
    { id: "premium", label: "프리미엄" },
  ],
  mouthwash: [
    { id: "alcoholFree", label: "알코올프리" },
    { id: "coffeeAfter", label: "커피 후" },
    { id: "whitening", label: "착색 관리" },
    { id: "portable", label: "휴대용" },
    { id: "premium", label: "프리미엄" },
  ],
  squalane: [
    { id: "budget", label: "가성비" },
    { id: "lightOil", label: "가벼운 오일" },
    { id: "drySkin", label: "건성" },
    { id: "premium", label: "프리미엄" },
  ],
  vitaminCSerum: [
    { id: "gentleVitaminC", label: "입문/순한 비타민C" },
    { id: "brightening", label: "톤/칙칙함" },
    { id: "sensitive", label: "민감/입문" },
    { id: "premium", label: "프리미엄" },
  ],
  moistureBalm: [
    { id: "occlusive", label: "보습막" },
    { id: "lipHand", label: "입술/손" },
    { id: "bedside", label: "침대 곁" },
    { id: "premium", label: "프리미엄" },
  ],
  sleepTracker: [
    { id: "wearable", label: "웨어러블" },
    { id: "app", label: "앱 기록" },
    { id: "ring", label: "링" },
    { id: "premium", label: "프리미엄" },
  ],
  detailTrimmer: [
    { id: "noseEyebrow", label: "코털/눈썹" },
    { id: "portable", label: "휴대형" },
    { id: "waterproof", label: "방수" },
    { id: "premium", label: "프리미엄" },
  ],
  lipBalm: [
    { id: "daily", label: "데일리" },
    { id: "tinted", label: "발색" },
    { id: "men", label: "남성 입문" },
    { id: "premium", label: "프리미엄" },
  ],
  ambientLighting: [
    { id: "warmIndirect", label: "따뜻한 간접 조명" },
    { id: "dimmable", label: "조도 조절" },
    { id: "smart", label: "스마트" },
    { id: "budget", label: "가성비" },
  ],
  deskOrganizer: [
    { id: "deskOrganizer", label: "책상 정리" },
    { id: "vertical", label: "세로 수납" },
    { id: "cableTray", label: "케이블 정리" },
    { id: "minimal", label: "미니멀" },
  ],
  journalNotebook: [
    { id: "dailyJournal", label: "데일리 저널" },
    { id: "reflection", label: "리플렉션" },
    { id: "pocket", label: "휴대형" },
    { id: "premium", label: "프리미엄" },
  ],
  digitalBlocker: [
    { id: "lockBox", label: "물리 차단" },
    { id: "appBlocker", label: "앱 차단" },
    { id: "focusMode", label: "집중 모드" },
    { id: "premium", label: "프리미엄" },
  ],
  timeTracker: [
    { id: "visualTimer", label: "시각 타이머" },
    { id: "deskTimer", label: "데스크 타이머" },
    { id: "app", label: "앱 기록" },
    { id: "premium", label: "프리미엄" },
  ],
  coldPack: [
    { id: "neckColdPack", label: "목 냉찜질" },
    { id: "portable", label: "휴대형" },
    { id: "wrap", label: "랩/고정형" },
    { id: "premium", label: "프리미엄" },
  ],
};

function readOptionalJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureItemProductSlots(data, code, productSlots) {
  const item = data.items.find((entry) => entry.code === code);
  if (!item) throw new Error(`Missing item ${code}`);
  const existingSlots = item.productSlots || item.recommendationSlots || [];
  const seen = new Set(existingSlots.map((slot) => String(slot.id || slot.label || slot)));
  const merged = [...existingSlots];
  productSlots.forEach((slot) => {
    const key = String(slot.id || slot.label || slot);
    if (!seen.has(key)) {
      merged.push(slot);
      seen.add(key);
    }
  });
  item.productSlots = merged;
}

function addProductCodesToItem(data, itemCode, productCodes) {
  const item = data.items.find((entry) => entry.code === itemCode);
  if (!item) throw new Error(`Missing item ${itemCode}`);
  const existing = new Set(item.productCodes || []);
  productCodes.forEach((code) => existing.add(code));
  item.productCodes = Array.from(existing);
}

function crawlProductFromRecord(record) {
  return {
    code: record.code,
    brand: record.brand,
    productName: record.productName,
    category: record.category,
    itemCode: record.itemCode,
    manualCode: record.manualCode,
    domain: record.domain,
    topic: record.topic,
    slotId: record.slotId,
    recommendationType: record.recommendationType,
    imageUrl: record.imageUrl,
    productLink: record.productLink,
    recommendationReason: record.recommendationReason,
    target: record.target,
    actualUse: record.actualUse,
    caution: record.caution,
    tags: record.tags || [],
    serkanFit: record.serkanFit || null,
    reviewStatus: record.reviewStatus || null,
    connectionStatus: "ready",
    source: record.source,
    sourceId: record.sourceId || record.code,
    importStatus: record.importStatus || "READY",
  };
}

function applyCrawlBatch1(data) {
  const batch = readOptionalJson(crawlBatch1Path, { products: [] });
  if (!batch.products.length) return [];

  ensureItemProductSlots(data, "SR26-SK-AC-C1", productSlotPresets.acneCare);
  ensureItemProductSlots(data, "SR26-GR-RS-C1", productSlotPresets.waterFlosser);
  ensureItemProductSlots(data, "SR26-SL-RS-C1", productSlotPresets.humidifier);

  return batch.products.map(crawlProductFromRecord);
}

function applyCrawlBatch2(data) {
  const batch = readOptionalJson(crawlBatch2Path, { products: [] });
  if (!batch.products.length) return [];

  ensureItemProductSlots(data, "SR26-SK-AC-C1", productSlotPresets.acneCare);
  ensureItemProductSlots(data, "SR26-SK-SH-C1", productSlotPresets.aftershave);
  ensureItemProductSlots(data, "SR26-FD-FT-C1", productSlotPresets.electrolyte);
  ensureItemProductSlots(data, "SR26-BD-DT-C1", productSlotPresets.woundKit);
  ensureItemProductSlots(data, "SR26-GR-DT-C1", productSlotPresets.mouthwash);

  return batch.products.map(crawlProductFromRecord);
}

function applyCrawlBatch3(data) {
  const batch = readOptionalJson(crawlBatch3Path, { products: [] });
  if (!batch.products.length) return [];

  ensureItemProductSlots(data, "SR26-SK-DT-C1", productSlotPresets.squalane);
  ensureItemProductSlots(data, "SR26-SK-SP-C1", productSlotPresets.vitaminCSerum);
  ensureItemProductSlots(data, "SR26-SK-BD-C1", productSlotPresets.moistureBalm);
  ensureItemProductSlots(data, "SR26-SL-BD-C1", productSlotPresets.sleepTracker);
  ensureItemProductSlots(data, "SR26-ST-SH-C1", productSlotPresets.detailTrimmer);
  ensureItemProductSlots(data, "SR26-ST-RS-C1", productSlotPresets.lipBalm);

  return batch.products.map(crawlProductFromRecord);
}

function applyCrawlBatch4(data) {
  const batch = readOptionalJson(crawlBatch4Path, { products: [] });
  if (!batch.products.length) return [];

  ensureItemProductSlots(data, "SR26-SP-RS-C1", productSlotPresets.ambientLighting);
  ensureItemProductSlots(data, "SR26-SP-CN-C1", productSlotPresets.deskOrganizer);
  ensureItemProductSlots(data, "SR26-MT-CN-C1", productSlotPresets.journalNotebook);
  ensureItemProductSlots(data, "SR26-MT-RC-C1", productSlotPresets.digitalBlocker);
  ensureItemProductSlots(data, "SR26-SY-RS-C1", productSlotPresets.timeTracker);
  ensureItemProductSlots(data, "SR26-BD-FT-C1", productSlotPresets.coldPack);

  return batch.products.map(crawlProductFromRecord);
}

function applyCrawlBatch5(data) {
  const batch = readOptionalJson(crawlBatch5Path, { products: [] });
  if (!batch.products.length) return [];

  ensureItemProductSlots(data, "SR26-GR-RS-C1", productSlotPresets.waterFlosser);
  ensureItemProductSlots(data, "SR26-GR-DT-C1", productSlotPresets.mouthwash);
  ensureItemProductSlots(data, "SR26-BD-DT-C1", productSlotPresets.woundKit);
  ensureItemProductSlots(data, "SR26-SL-LB-C1", productSlotPresets.sleepMask);
  ensureItemProductSlots(data, "SR26-SK-BD-C1", productSlotPresets.moistureBalm);
  ensureItemProductSlots(data, "SR26-SK-SP-C1", productSlotPresets.vitaminCSerum);
  ensureItemProductSlots(data, "SR26-SK-DT-C1", productSlotPresets.squalane);
  ensureItemProductSlots(data, "SR26-SK-SH-C1", productSlotPresets.aftershave);
  ensureItemProductSlots(data, "SR26-FD-FT-C1", productSlotPresets.electrolyte);

  return batch.products.map(crawlProductFromRecord);
}

function applyCrawlBatch6(data) {
  const batch = readOptionalJson(crawlBatch6Path, { products: [] });
  if (!batch.products.length) return [];

  ensureItemProductSlots(data, "SR26-SP-RS-C1", productSlotPresets.ambientLighting);
  ensureItemProductSlots(data, "SR26-SP-CN-C1", productSlotPresets.deskOrganizer);
  ensureItemProductSlots(data, "SR26-MT-CN-C1", productSlotPresets.journalNotebook);
  ensureItemProductSlots(data, "SR26-MT-RC-C1", productSlotPresets.digitalBlocker);
  ensureItemProductSlots(data, "SR26-SY-RS-C1", productSlotPresets.timeTracker);
  ensureItemProductSlots(data, "SR26-SL-BD-C1", productSlotPresets.sleepTracker);
  ensureItemProductSlots(data, "SR26-SL-RS-C1", productSlotPresets.humidifier);

  return batch.products.map(crawlProductFromRecord);
}

function applyCrawlBatch7(data) {
  const batch = readOptionalJson(crawlBatch7Path, { products: [] });
  if (!batch.products.length) return [];

  ensureItemProductSlots(data, "SR26-BD-FT-C1", productSlotPresets.coldPack);
  ensureItemProductSlots(data, "SR26-SK-HR-C1", productSlotPresets.scalpSerum);
  ensureItemProductSlots(data, "SR26-SK-SS-C1", productSlotPresets.sunscreen);
  ensureItemProductSlots(data, "SR26-SK-AC-C1", productSlotPresets.acneCare);
  ensureItemProductSlots(data, "SR26-ST-RS-C1", productSlotPresets.lipBalm);
  ensureItemProductSlots(data, "SR26-GR-FR-C1", productSlotPresets.deodorant);
  ensureItemProductSlots(data, "SR26-ST-SH-C1", productSlotPresets.detailTrimmer);
  ensureItemProductSlots(data, "SR26-BD-RC-C1", productSlotPresets.recoveryDevice);
  ensureItemProductSlots(data, "SR26-SK-MK-C1", productSlotPresets.maleTone);
  ensureItemProductSlots(data, "SR26-BD-BC-C1", productSlotPresets.bodyWash);
  ensureItemProductSlots(data, "SR26-SL-LB-C1", productSlotPresets.sleepMask);

  return batch.products.map(crawlProductFromRecord);
}

function applyBatchANormalization(data) {
  normalizeItem(data, "SR26-SK-SS-C1", {
    name: "데일리 선크림",
    role: "매일 얼굴과 목에 바르는 자외선 차단 제품군",
    productSlots: productSlotPresets.sunscreen,
  });
  normalizeManual(data, "SR26-SK-SS-M1", {
    title: "데일리 선크림 도포 관리 매뉴얼",
    summary: "아침 루틴에서 얼굴과 목까지 자외선 차단제를 안정적으로 바르기 위한 매뉴얼입니다.",
    blocks: manualBlocks({
      purpose: "데일리 선크림 도포는 피부를 꾸미기보다 매일 자외선 손상을 줄이는 기본 방어 루틴이다.",
      method: [
        "아침 세안과 보습 이후 얼굴, 목, 귀 주변까지 빠뜨리지 않고 바른다.",
        "끈적임 때문에 루틴을 포기하지 않도록 사용감이 맞는 제품을 고른다.",
        "야외 이동이 길거나 땀이 많은 날은 덧바름 기준을 따로 둔다.",
      ],
      steps: [
        "보습이 흡수된 뒤 선크림을 얼굴과 목에 나눠 바르기",
        "콧등, 광대, 턱선, 귀 앞처럼 빠지기 쉬운 부위 확인하기",
        "외출 시간이 길면 작은 용량을 가방에 넣어 덧바름 준비하기",
      ],
      cadence: ["주기: Daily", "요일: 매일", "중요도: 의무", "난이도: 쉬움"],
      items: ["데일리 선크림", "거울", "휴대용 선케어"],
      cautions: [
        "눈시림, 백탁, 번들거림은 제품별로 차이가 커서 실사용 검수가 필요하다.",
        "트러블이 심해지면 사용량보다 세안과 보습 루틴을 함께 점검한다.",
      ],
    }),
    tags: ["피부관리", "선크림", "데일리 SPF", "아침 루틴"],
  });

  normalizeItem(data, "SR26-GR-FR-C1", {
    name: "체취 / 데오 관리",
    role: "땀, 체취, 끈적임을 상황별로 정리하는 데오 관리 제품군",
    productSlots: productSlotPresets.deodorant,
  });
  normalizeManual(data, "SR26-GR-FR-M1", {
    title: "체취 / 데오 관리 매뉴얼",
    summary: "몸의 냄새와 끈적임을 향으로 덮기 전에 정리하는 그루밍 매뉴얼입니다.",
    blocks: manualBlocks({
      purpose: "체취 / 데오 관리는 향수를 뿌리기 전에 땀, 끈적임, 옷에 남는 눅눅함을 먼저 줄이는 루틴이다.",
      method: [
        "체취는 향보다 세정, 건조, 보송함 관리가 먼저다.",
        "외출 전과 점심 전처럼 무너지기 쉬운 시간대를 기준으로 짧게 리셋한다.",
      ],
      steps: [
        "땀이 잘 나는 부위를 씻거나 닦아내기",
        "완전히 마른 뒤 데오 제품이나 보송 제품을 얇게 사용하기",
        "향수는 체취를 덮는 용도가 아니라 마지막 인상 정리로만 사용하기",
      ],
      cadence: ["주기: Daily / 필요시", "요일: 매일", "중요도: 권장", "난이도: 쉬움"],
      items: ["데오 제품", "물티슈", "휴대용 타월"],
      cautions: [
        "향이 강한 제품은 땀냄새와 섞일 수 있어 무향/저향 제품부터 검수한다.",
        "피부 자극이 생기면 겨드랑이, 목 뒤, 가슴 등 부위별 사용 빈도를 낮춘다.",
      ],
    }),
    tags: ["위생관리", "체취", "데오", "그루밍"],
  });

  normalizeItem(data, "SR26-SK-HR-C1", {
    name: "두피케어 / 두피 세럼",
    role: "두피 컨디션과 정수리 볼륨 관리를 위한 두피 제품군",
    productSlots: productSlotPresets.scalpSerum,
  });
  normalizeManual(data, "SR26-SK-HR-M1", {
    title: "두피케어 / 두피 세럼 관리 매뉴얼",
    summary: "샴푸 이후 두피 컨디션을 관리하고 정수리 볼륨 저하를 줄이기 위한 매뉴얼입니다.",
    blocks: manualBlocks({
      purpose: "두피케어는 헤어스타일링 전에 두피 열감, 가려움, 정수리 볼륨 저하를 관리하는 기반 루틴이다.",
      method: [
        "샴푸만으로 끝내지 않고 두피가 마른 뒤 필요한 제품을 소량 사용한다.",
        "정수리 볼륨이 무너지는 날은 스타일링 제품보다 두피 컨디션을 먼저 본다.",
      ],
      steps: [
        "샴푸 후 두피를 완전히 말리기",
        "정수리와 가려운 부위 중심으로 두피 세럼을 소량 바르기",
        "손끝으로 문지르기보다 가볍게 눌러 흡수시키기",
      ],
      cadence: ["주기: Daily / 필요시", "요일: 매일", "중요도: 권장", "난이도: 보통"],
      items: ["두피 세럼", "드라이기", "두피 체크 거울"],
      cautions: [
        "탈모 치료 표현으로 과장하지 않고 두피 컨디션 관리로 다룬다.",
        "끈적임이나 떡짐이 생기면 사용량과 사용 시간을 줄인다.",
      ],
    }),
    tags: ["두피", "헤어", "세럼", "정수리 볼륨"],
  });

  normalizeItem(data, "SR26-BD-RC-C1", {
    name: "회복 디바이스 / 목어깨 마사지",
    role: "목, 어깨, 상체 피로를 짧게 회복하는 마사지 및 회복 도구 제품군",
    productSlots: productSlotPresets.recoveryDevice,
  });
  normalizeManual(data, "SR26-BD-RC-M1", {
    title: "회복 디바이스 / 목어깨 마사지 관리 매뉴얼",
    summary: "퇴근 후 또는 운동 후 목과 어깨 긴장을 풀어 다음 날 컨디션을 회복하는 매뉴얼입니다.",
    blocks: manualBlocks({
      purpose: "회복 디바이스 / 목어깨 마사지는 긴장된 상체를 짧게 풀어 자세와 컨디션을 회수하는 루틴이다.",
      method: [
        "통증을 버티는 것이 아니라 뭉친 부위를 짧게 풀고 휴식으로 전환한다.",
        "강도를 높이기보다 매일 반복 가능한 시간과 압력을 정한다.",
      ],
      steps: [
        "목과 어깨가 뻐근한 부위를 확인하기",
        "마사지기나 회복 도구를 5~10분만 사용하기",
        "사용 후 물을 마시고 목 스트레칭으로 마무리하기",
      ],
      cadence: ["주기: 필요시 / Weekly", "요일: 피로한 날", "중요도: 권장", "난이도: 쉬움"],
      items: ["목어깨 마사지기", "마사지볼", "타이머"],
      cautions: [
        "통증이 심하거나 저림이 있으면 제품 사용으로 해결하려 하지 않는다.",
        "한 부위를 오래 누르지 않고 짧은 시간부터 검수한다.",
      ],
    }),
    tags: ["회복", "목어깨", "마사지", "바디관리"],
  });
}

function applyBatchBExpansion(data) {
  const approval = JSON.parse(fs.readFileSync(approvalPath, "utf8"));
  const approved = approval.approvedExpansions;
  const byId = new Map(approved.map((entry) => [entry.id, entry]));

  const skinTone = byId.get("SK-MK");
  const bodyCleanse = byId.get("BD-BC");
  const lightBlock = byId.get("SL-LB");

  addItem(data, {
    ...skinTone.item,
    productSlots: productSlotPresets.maleTone,
    productCodes: ["SR26-SK-MK-P114", "SR26-SK-MK-P111"],
  });
  addManual(data, {
    ...skinTone.manual,
    routineCode: skinTone.routine.code,
    itemCodes: [skinTone.item.code],
  });
  addRoutine(data, {
    code: skinTone.routine.code,
    title: skinTone.routine.title,
    board: "daily",
    frequency: "Daily",
    weekday: ["매일"],
    timeBlocks: ["기상"],
    priority: "권장",
    difficulty: "쉬움",
    manualCode: skinTone.manual.code,
    itemCode: skinTone.item.code,
    sourceId: "BATCH-B-SK-MK",
    sourceType: "generated_preview",
    sourceCount: 1,
    domain: "SK",
    topic: "MK",
    category: "피부관리",
    tags: ["피부관리", "톤 보정", "부분 커버", "Daily", "권장"],
    connectionStatus: "ready",
    linkConfidence: "approved",
    reviewNeeded: false,
  });

  addItem(data, {
    ...bodyCleanse.item,
    productSlots: productSlotPresets.bodyWash,
    productCodes: ["SR26-BD-BC-P112"],
  });
  addManual(data, {
    ...bodyCleanse.manual,
    routineCode: bodyCleanse.routine.code,
    itemCodes: [bodyCleanse.item.code],
  });
  addRoutine(data, {
    code: bodyCleanse.routine.code,
    title: bodyCleanse.routine.title,
    board: "daily",
    frequency: "Daily",
    weekday: ["매일"],
    timeBlocks: ["저녁"],
    priority: "권장",
    difficulty: "쉬움",
    manualCode: bodyCleanse.manual.code,
    itemCode: bodyCleanse.item.code,
    sourceId: "BATCH-B-BD-BC",
    sourceType: "generated_preview",
    sourceCount: 1,
    domain: "BD",
    topic: "BC",
    category: "바디관리",
    tags: ["바디관리", "바디워시", "샤워", "Daily", "권장"],
    connectionStatus: "ready",
    linkConfidence: "approved",
    reviewNeeded: false,
  });

  addItem(data, {
    ...lightBlock.item,
    productSlots: productSlotPresets.sleepMask,
    productCodes: ["SR26-SL-LB-P102"],
  });
  addManual(data, {
    ...lightBlock.manual,
    routineCode: "SR26-SL-RS-R65",
    itemCodes: [lightBlock.item.code],
  });
}

function applyStagingBatchB(staging) {
  const readyByName = {
    "비레디 트루 톤 로션 하이드로/에어리 40ml 기획": {
      domain: "SK",
      topic: "MK",
      itemCode: "SR26-SK-MK-C1",
      manualCode: "SR26-SK-MK-M1",
      group: "남성 톤 보정 / 부분 커버",
      recommendationType: "톤 보정 로션",
    },
    "다슈 맨즈 듀얼 트릭 스틱 샌드 / 라이트": {
      domain: "SK",
      topic: "MK",
      itemCode: "SR26-SK-MK-C1",
      manualCode: "SR26-SK-MK-M1",
      group: "남성 톤 보정 / 부분 커버",
      recommendationType: "부분 커버 스틱",
    },
    "우르오스 스킨워시": {
      domain: "BD",
      topic: "BC",
      itemCode: "SR26-BD-BC-C1",
      manualCode: "SR26-BD-BC-M1",
      group: "바디워시 / 바디 클렌징",
      recommendationType: "입문/데일리",
    },
    "테라바디 슬립마스크 진동 수면 안대": {
      domain: "SL",
      topic: "LB",
      itemCode: "SR26-SL-LB-C1",
      manualCode: "SR26-SL-LB-M1",
      group: "수면 안대 / 빛 차단",
      recommendationType: "프리미엄/디바이스",
    },
  };

  const batchAReady = new Set([
    "비레디 블루 수분 선크림 SPF50+/PA++++",
    "쏘내추럴 파우더포룸 피치 데오 팩트 10g 기획 (+퍼프 증정)",
    "솔랩 프리미엄 탈모/두피진정 두피앰플 40ml (+탈모샴푸100ml)",
    "풀리오 목어깨 마사지기",
    "케라스타즈 제네시스 옴므 세럼 안티-슈트 포티피앙",
  ]);

  staging.records = staging.records.map((record) => {
    if (readyByName[record.productName]) {
      const patch = readyByName[record.productName];
      return {
        ...record,
        candidateDomain: patch.domain,
        candidateTopic: patch.topic,
        candidateItemCode: patch.itemCode,
        candidateManualCode: patch.manualCode,
        candidateProductGroup: patch.group,
        recommendationType: patch.recommendationType,
        importStatus: "READY",
        risk: "Batch B approved item/manual/product group expansion applied to generated preview.",
        reason: "승인된 신규 Item/Manual/Product Group 안에서 실제 제품 import 검증이 가능합니다.",
      };
    }

    if (batchAReady.has(record.productName)) {
      return {
        ...record,
        importStatus: "READY",
        risk: "Batch A existing-code absorption approved for generated preview.",
        reason: "기존 Item/Manual 안에서 의미를 넓혀 실제 Product Group 동작을 검증하는 샘플입니다.",
      };
    }

    if (record.productName === "다슈 맨즈 매직커버 니플밴드 더블 기획") {
      return {
        ...record,
        importStatus: "NEEDS_ITEM",
        risk: "BD-WR is intentionally deferred. Do not create this item/manual/product group yet.",
        reason: "착장/바디 리스크 제품군은 Style 흡수 가능성과 Body 유지 기준을 추가 검토한 뒤 승인합니다.",
      };
    }

    return record;
  });

  staging.summary = staging.records.reduce((acc, record) => {
    acc.sampleRecords += 1;
    acc[record.importStatus] = (acc[record.importStatus] || 0) + 1;
    return acc;
  }, { sampleRecords: 0, READY: 0, REVIEW: 0, PENDING: 0, NEEDS_ITEM: 0, NEEDS_MANUAL: 0, SOURCE_CONFLICT: 0 });

  staging.meta.batchBAppliedAt = "2026-06-15";
  staging.meta.batchBApplication = "SK-MK, BD-BC, and SL-LB approved expansions applied to generated preview only. BD-WR remains deferred.";
  return staging;
}

function run() {
  const data = readRuntimeData();
  const staging = applyStagingBatchB(JSON.parse(fs.readFileSync(stagingPath, "utf8")));
  fs.writeFileSync(stagingPath, `${JSON.stringify(staging, null, 2)}\n`);

  applyBatchANormalization(data);
  applyBatchBExpansion(data);

  const recordsByName = new Map(staging.records.map((record) => [record.productName, record]));
  const crawlBatchProducts = [
    ...applyCrawlBatch1(data),
    ...applyCrawlBatch2(data),
    ...applyCrawlBatch3(data),
    ...applyCrawlBatch4(data),
    ...applyCrawlBatch5(data),
    ...applyCrawlBatch6(data),
    ...applyCrawlBatch7(data),
  ];
  const readyProducts = [
    productFromRecord(recordsByName.get("비레디 블루 수분 선크림 SPF50+/PA++++"), {
      code: "SR26-SK-SS-P114",
      category: "데일리 선크림",
      slotId: "sensitive",
      recommendationType: "입문/데일리",
      recommendationReason: "아침에 보습까지 했는데 선크림 단계에서 번들거림이 싫어 루틴이 끊기는 경우를 줄이기 위한 후보입니다.",
      target: "출근 전 빠르게 바르고 나가야 해서 백탁, 눈시림, 끈적임 때문에 선크림을 자주 건너뛰는 사람",
      actualUse: "수분감 있는 로션형 선케어로 쓰는 맥락이 맞습니다. 출근 직전 얼굴과 목에 얇게 펴 바르고, 손에 남는 미끈함이나 오후 번들거림이 루틴 지속 여부를 가르는 포인트입니다.",
      caution: "피부톤에 따라 백탁이 보일 수 있고, 눈가 가까이 바르면 눈시림이 생길 수 있습니다. 마스크나 셔츠 목 부분 묻어남도 확인이 필요합니다.",
      tags: ["선크림", "SPF", "아침 루틴"],
    }),
    productFromRecord(recordsByName.get("쏘내추럴 파우더포룸 피치 데오 팩트 10g 기획 (+퍼프 증정)"), {
      code: "SR26-GR-FR-P114",
      category: "체취 / 데오 관리",
      slotId: "portable",
      recommendationType: "휴대/상황형",
      recommendationReason: "점심 이후 셔츠 안쪽이 눅눅해지고 향수로 덮어도 체취가 섞이는 상황에서 보송함을 먼저 회복하기 위한 후보입니다.",
      target: "겨드랑이, 목 뒤, 가슴 윗부분의 끈적임이 신경 쓰이지만 강한 향 제품은 부담스러운 사람",
      actualUse: "팩트처럼 눌러 쓰는 방식이라 휴대 리셋용에 가깝습니다. 땀을 완전히 막기보다 피부 표면의 축축함을 줄이고 옷 입었을 때 들러붙는 느낌을 낮추는 쪽으로 봐야 합니다.",
      caution: "파우더가 옷에 묻거나 건조하게 느껴질 수 있습니다. 향이 있는 제품은 체취와 섞일 수 있어 처음에는 소량만 테스트하는 편이 안전합니다.",
      tags: ["데오", "체취", "위생"],
    }),
    productFromRecord(recordsByName.get("솔랩 프리미엄 탈모/두피진정 두피앰플 40ml (+탈모샴푸100ml)"), {
      code: "SR26-SK-HR-P108",
      category: "두피케어 / 두피 세럼",
      slotId: "cooling",
      recommendationType: "데일리/집중관리",
      recommendationReason: "아침에 머리를 감아도 오후가 되면 정수리가 눌리고 두피가 답답해지는 날, 샴푸 이후 단계를 보강하기 위한 후보입니다.",
      target: "샴푸 직후는 괜찮지만 저녁이 되면 두피가 답답하거나 정수리 볼륨이 빨리 죽는 사람",
      actualUse: "두피에 직접 바르는 앰플이라 머리카락보다 두피 사이사이에 소량 나눠 쓰는 것이 핵심입니다. 바른 직후 떡짐 없이 마르는지, 드라이 후 볼륨이 꺼지지 않는지가 실제 사용 포인트입니다.",
      caution: "많이 바르면 모근 쪽이 무겁거나 끈적하게 느껴질 수 있습니다. 두피가 예민한 날에는 열감, 따가움, 향 지속감을 먼저 확인해야 합니다.",
      tags: ["두피", "앰플", "헤어"],
    }),
    productFromRecord(recordsByName.get("풀리오 목어깨 마사지기"), {
      code: "SR26-BD-RC-P040",
      category: "회복 디바이스 / 목어깨 마사지",
      slotId: "device",
      recommendationType: "프리미엄/디바이스",
      recommendationReason: "하루 종일 노트북을 보고 난 뒤 목 뒤와 승모근이 굳어 스트레칭만으로는 잘 풀리지 않는 날에 짧게 회복 루틴을 만들기 위한 후보입니다.",
      target: "퇴근 후 목과 어깨가 단단하게 뭉치고, 손으로 주무르기엔 귀찮아서 회복 루틴이 자주 밀리는 사람",
      actualUse: "목에 걸고 5~10분 쓰는 회복 장비에 가깝습니다. 압이 시원한지보다 매일 부담 없이 꺼내 쓸 수 있는 무게감, 소음, 착용 편의성이 중요합니다.",
      caution: "압이 강하면 다음 날 뻐근함이 남을 수 있습니다. 저림, 통증, 염증이 있는 부위에는 오래 쓰지 말고 짧은 시간부터 확인해야 합니다.",
      tags: ["목어깨", "회복", "마사지기"],
    }),
    productFromRecord(recordsByName.get("케라스타즈 제네시스 옴므 세럼 안티-슈트 포티피앙"), {
      code: "SR26-SK-HR-P106",
      category: "두피케어 / 두피 세럼",
      slotId: "premium",
      recommendationType: "프리미엄",
      recommendationReason: "샴푸와 드라이만으로는 정수리 컨디션이 오래 버티지 않고, 두피 관리 단계를 좀 더 정돈하고 싶은 경우의 프리미엄 후보입니다.",
      target: "두피가 쉽게 기름지거나 힘없이 가라앉아 아침 스타일링이 오후까지 유지되지 않는 사람",
      actualUse: "고가 세럼인 만큼 매일 넓게 바르기보다 정수리와 헤어라인처럼 신경 쓰이는 부위에 나눠 쓰는 방식이 맞습니다. 향, 흡수 후 끈적임, 머리 떡짐 여부가 핵심 사용감입니다.",
      caution: "가격 대비 체감이 개인차가 큽니다. 향이 오래 남거나 모발이 무겁게 느껴지면 사용량을 줄이고, 두피 트러블이 있으면 중단 기준을 정해야 합니다.",
      tags: ["두피", "세럼", "프리미엄"],
    }),
    productFromRecord(recordsByName.get("비레디 트루 톤 로션 하이드로/에어리 40ml 기획"), {
      code: "SR26-SK-MK-P114",
      category: "남성 톤 보정 / 부분 커버",
      slotId: "toneLotion",
      recommendationType: "톤 보정 로션",
      recommendationReason: "아침에 세안은 했는데 얼굴이 칙칙하거나 붉어 보여 셔츠를 입어도 피곤해 보이는 날, 화장한 느낌 없이 톤을 정리하기 위한 후보입니다.",
      target: "파운데이션은 부담스럽지만 출근, 촬영, 약속 전 얼굴 톤과 붉은기를 한 단계 정리하고 싶은 사람",
      actualUse: "로션처럼 얇게 펴 바르는 쪽이 자연스럽습니다. 손가락으로 빠르게 바를 수 있는지, 목과 얼굴 경계가 뜨지 않는지, 마스크나 옷깃에 묻는지가 실사용 체크 포인트입니다.",
      caution: "많이 바르면 얼굴만 밝아 보이거나 목과 톤 차이가 날 수 있습니다. 건조한 피부는 각질이 부각될 수 있어 보습 후 소량부터 시작해야 합니다.",
      tags: ["톤 보정", "남성 베이스", "출근 전"],
    }),
    productFromRecord(recordsByName.get("다슈 맨즈 듀얼 트릭 스틱 샌드 / 라이트"), {
      code: "SR26-SK-MK-P111",
      category: "남성 톤 보정 / 부분 커버",
      slotId: "coverStick",
      recommendationType: "부분 커버 스틱",
      recommendationReason: "전체 얼굴을 바꾸기보다 코 옆 붉은기, 트러블 자국, 다크서클처럼 시선이 가는 부분만 빠르게 숨기기 위한 후보입니다.",
      target: "약속 직전 거울을 봤을 때 특정 잡티나 붉은기만 신경 쓰여 전체 베이스까지 하고 싶지는 않은 사람",
      actualUse: "스틱형이라 손에 덜 묻고 국소 부위에 바로 찍어 쓰기 좋습니다. 다만 경계가 남지 않게 손끝으로 살짝 펴야 하며, 피부결이 건조하면 커버 부위가 더 도드라질 수 있습니다.",
      caution: "두껍게 올리면 티가 나고, 색상이 피부톤과 맞지 않으면 오히려 커버 부위가 뜰 수 있습니다. 자연광에서 확인하고 소량만 쓰는 게 안전합니다.",
      tags: ["부분 커버", "스틱", "남성 베이스"],
    }),
    productFromRecord(recordsByName.get("우르오스 스킨워시"), {
      code: "SR26-BD-BC-P112",
      category: "바디워시 / 바디 클렌징",
      slotId: "cleansing",
      recommendationType: "입문/데일리",
      recommendationReason: "운동 후 땀 냄새와 피지가 남아 옷을 갈아입어도 몸이 개운하지 않은 날, 바디 세정 루틴을 명확히 만들기 위한 후보입니다.",
      target: "샤워를 빨리 끝내고 싶지만 등, 가슴, 목 뒤의 땀 냄새와 끈적임은 제대로 씻어내고 싶은 사람",
      actualUse: "멘톨감이나 강한 향으로 덮는 제품이라기보다 넓은 부위를 빠르게 씻는 데 맞는 바디워시 맥락입니다. 거품, 헹굼 속도, 샤워 후 당김 여부가 루틴 지속의 기준입니다.",
      caution: "세정 후 건조함이 느껴질 수 있어 겨울이나 운동 후 잦은 샤워에는 보습이 필요합니다. 향 호불호와 얼굴 겸용 사용 여부는 별도로 확인해야 합니다.",
      tags: ["바디워시", "샤워", "위생"],
    }),
    productFromRecord(recordsByName.get("테라바디 슬립마스크 진동 수면 안대"), {
      code: "SR26-SL-LB-P102",
      category: "수면 안대 / 빛 차단",
      slotId: "premium",
      recommendationType: "프리미엄/디바이스",
      recommendationReason: "방 조명을 꺼도 스마트폰, 창문 빛, 머릿속 긴장 때문에 잠드는 전환이 늦어지는 날에 빛 차단 루틴을 강제로 시작하기 위한 후보입니다.",
      target: "침실을 완전히 어둡게 만들기 어렵거나, 눈을 감아도 화면 자극이 남아 잠들기까지 시간이 오래 걸리는 사람",
      actualUse: "일반 안대보다 디바이스에 가까워 착용감이 가장 중요합니다. 빛 차단은 확실한지, 진동이 편안한지 방해되는지, 옆으로 누웠을 때 압박감이 있는지를 먼저 봐야 합니다.",
      caution: "무게감, 압박감, 진동 호불호가 클 수 있습니다. 예민한 사람은 오히려 잠을 방해할 수 있어 짧은 시간 테스트 후 루틴에 넣는 편이 안전합니다.",
      tags: ["수면 안대", "빛 차단", "수면 디바이스"],
    }),
    ...crawlBatchProducts,
  ];

  const existingCodes = new Set(data.products.map((product) => product.code));
  readyProducts.forEach((product) => {
    if (existingCodes.has(product.code)) {
      throw new Error(`Product code already exists: ${product.code}`);
    }
    data.products.push(product);
    existingCodes.add(product.code);
  });
  const crawlProductCodesByItem = crawlBatchProducts.reduce((acc, product) => {
    acc[product.itemCode] = acc[product.itemCode] || [];
    acc[product.itemCode].push(product.code);
    return acc;
  }, {});
  Object.entries(crawlProductCodesByItem).forEach(([itemCode, productCodes]) => {
    addProductCodesToItem(data, itemCode, productCodes);
  });

  fs.writeFileSync(generatedPath, `window.SERKAN_DATA = ${JSON.stringify(data, null, 2)};\n`);

  const previewHtml = fs.readFileSync(indexPath, "utf8")
    .replace(/<script src="app-data\.js"><\/script>/, '<script src="app-data.generated.js"></script>')
    .replace(/<script src="app\.js(?:\?[^"]*)?"><\/script>/, '<script src="app.js?v=manual-top-activation"></script>');
  fs.writeFileSync(previewPath, previewHtml);

  const readyGroupCount = new Set(readyProducts.map((product) => product.itemCode)).size;
  console.log(JSON.stringify({
    ready: staging.summary.READY,
    review: staging.summary.REVIEW,
    needsItem: staging.summary.NEEDS_ITEM,
    generatedProducts: readyProducts.length,
    crawlBatchProducts: crawlBatchProducts.length,
    generatedProductGroups: readyGroupCount,
    newItems: ["SR26-SK-MK-C1", "SR26-BD-BC-C1", "SR26-SL-LB-C1"],
    newManuals: ["SR26-SK-MK-M1", "SR26-BD-BC-M1", "SR26-SL-LB-M1"],
    deferred: ["BD-WR", "다슈 맨즈 매직커버 니플밴드 더블 기획"],
    generatedPath: path.relative(root, generatedPath),
    previewPath: path.relative(root, previewPath),
  }, null, 2));
}

run();
