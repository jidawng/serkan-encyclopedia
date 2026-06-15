const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const appDataPath = path.join(root, "app-data.js");
const stagingPath = path.join(root, "data", "staging-product-import.json");
const generatedPath = path.join(root, "app-data.generated.js");
const previewPath = path.join(root, "index.generated-preview.html");
const indexPath = path.join(root, "index.html");

function readRuntimeData() {
  const source = fs.readFileSync(appDataPath, "utf8");
  const match = source.match(/window\.SERKAN_DATA\s*=\s*([\s\S]*?);\s*$/);
  if (!match) throw new Error("Could not parse window.SERKAN_DATA from app-data.js");
  return JSON.parse(match[1]);
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

function manualBlocks({ purpose, method, steps, cadence, items, cautions }) {
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
  return {
    code: overrides.code || record.notionSerkanCode || overrides.fallbackCode,
    brand: record.brand,
    productName: record.productName,
    category: overrides.category || record.candidateProductGroup,
    itemCode: record.candidateItemCode,
    domain: record.candidateDomain,
    recommendationType: record.recommendationType || "데일리",
    imageUrl: record.productImage,
    productLink: record.productLink,
    recommendationReason: overrides.recommendationReason || record.reason,
    target: overrides.target || "SERKAN 루틴에 맞춰 실제 제품 검증이 필요한 사용자",
    caution: overrides.caution || "성분, 피부 반응, 재고/가격, 공식 판매처는 실제 구매 전 확인이 필요합니다.",
    tags: [
      record.notionCategory,
      record.notionAssetType,
      record.candidateProductGroup,
      record.recommendationType,
      ...(overrides.tags || []),
    ].filter(Boolean),
    connectionStatus: "ready",
    source: record.source,
    sourceId: record.sourceId,
  };
}

function run() {
  const data = readRuntimeData();
  const staging = JSON.parse(fs.readFileSync(stagingPath, "utf8"));

  const readyProductNames = new Set([
    "비레디 블루 수분 선크림 SPF50+/PA++++",
    "쏘내추럴 파우더포룸 피치 데오 팩트 10g 기획 (+퍼프 증정)",
    "솔랩 프리미엄 탈모/두피진정 두피앰플 40ml (+탈모샴푸100ml)",
    "풀리오 목어깨 마사지기",
    "케라스타즈 제네시스 옴므 세럼 안티-슈트 포티피앙",
  ]);

  staging.records = staging.records.map((record) => {
    if (!readyProductNames.has(record.productName)) return record;
    return {
      ...record,
      importStatus: "READY",
      risk: "Batch A existing-code absorption approved for generated preview.",
      reason: "기존 Item/Manual 안에서 의미를 넓혀 실제 Product Group 동작을 검증하는 샘플입니다.",
    };
  });
  staging.summary = staging.records.reduce((acc, record) => {
    acc.sampleRecords += 1;
    acc[record.importStatus] = (acc[record.importStatus] || 0) + 1;
    return acc;
  }, { sampleRecords: 0, READY: 0, REVIEW: 0, PENDING: 0, NEEDS_ITEM: 0, NEEDS_MANUAL: 0, SOURCE_CONFLICT: 0 });
  staging.meta.batchAAppliedAt = "2026-06-15";
  staging.meta.batchAApplication = "READY status applied to existing-code absorption records only. Runtime app data is unchanged.";
  fs.writeFileSync(stagingPath, `${JSON.stringify(staging, null, 2)}\n`);

  normalizeItem(data, "SR26-SK-SS-C1", {
    name: "데일리 선크림",
    role: "매일 얼굴과 목에 바르는 자외선 차단 제품군",
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

  const recordsByName = new Map(staging.records.map((record) => [record.productName, record]));
  const readyProducts = [
    productFromRecord(recordsByName.get("비레디 블루 수분 선크림 SPF50+/PA++++"), {
      code: "SR26-SK-SS-P114",
      category: "데일리 선크림",
      recommendationType: "입문/데일리",
      recommendationReason: "끈적임 때문에 선크림을 빼먹는 남성에게 매일 바르는 SPF 루틴을 만들기 좋은 후보입니다.",
      target: "출퇴근, 운전, 야외 이동이 잦고 선크림 사용감에 민감한 사람",
      tags: ["선크림", "SPF", "아침 루틴"],
    }),
    productFromRecord(recordsByName.get("쏘내추럴 파우더포룸 피치 데오 팩트 10g 기획 (+퍼프 증정)"), {
      code: "SR26-GR-FR-P114",
      category: "체취 / 데오 관리",
      recommendationType: "휴대/상황형",
      recommendationReason: "향으로 덮기 전에 겨드랑이, 목 뒤, 가슴 윗부분의 끈적임을 짧게 낮추는 데오 관리 후보입니다.",
      target: "셔츠를 입는 날 땀과 눅눅함이 신경 쓰이는 사람",
      tags: ["데오", "체취", "위생"],
    }),
    productFromRecord(recordsByName.get("솔랩 프리미엄 탈모/두피진정 두피앰플 40ml (+탈모샴푸100ml)"), {
      code: "SR26-SK-HR-P108",
      category: "두피케어 / 두피 세럼",
      recommendationType: "데일리/집중관리",
      recommendationReason: "샴푸 후에도 두피가 답답하거나 정수리 볼륨이 빨리 꺼지는 날에 두피 루틴을 한 단계 보강하는 후보입니다.",
      target: "두피 열감, 가려움, 정수리 볼륨 저하가 신경 쓰이는 사람",
      tags: ["두피", "앰플", "헤어"],
    }),
    productFromRecord(recordsByName.get("풀리오 목어깨 마사지기"), {
      code: "SR26-BD-RC-P040",
      category: "회복 디바이스 / 목어깨 마사지",
      recommendationType: "프리미엄/디바이스",
      recommendationReason: "목과 어깨가 굳는 사무직, 운동 후 상체 긴장을 집에서 짧게 풀기 위한 회복 디바이스 후보입니다.",
      target: "장시간 노트북 사용, 운전, 운동 후 목어깨 피로가 잦은 사람",
      tags: ["목어깨", "회복", "마사지기"],
    }),
    productFromRecord(recordsByName.get("케라스타즈 제네시스 옴므 세럼 안티-슈트 포티피앙"), {
      code: "SR26-SK-HR-P106",
      category: "두피케어 / 두피 세럼",
      recommendationType: "프리미엄",
      recommendationReason: "샴푸만으로 부족한 두피 관리 단계를 프리미엄 세럼 루틴으로 확장하는 후보입니다.",
      target: "두피 케어를 샴푸 이후 단계까지 확장하고 싶은 사람",
      tags: ["두피", "세럼", "프리미엄"],
    }),
  ];

  const existingCodes = new Set(data.products.map((product) => product.code));
  readyProducts.forEach((product) => {
    if (existingCodes.has(product.code)) {
      throw new Error(`Product code already exists: ${product.code}`);
    }
    data.products.push(product);
  });

  fs.writeFileSync(generatedPath, `window.SERKAN_DATA = ${JSON.stringify(data, null, 2)};\n`);

  const previewHtml = fs.readFileSync(indexPath, "utf8")
    .replace(/<script src="app-data\.js"><\/script>/, '<script src="app-data.generated.js"></script>')
    .replace(/<script src="app\.js"><\/script>/, '<script src="app.js?v=batch-a-product-preview"></script>');
  fs.writeFileSync(previewPath, previewHtml);

  console.log(JSON.stringify({
    ready: staging.summary.READY,
    review: staging.summary.REVIEW,
    needsItem: staging.summary.NEEDS_ITEM,
    generatedProducts: readyProducts.length,
    generatedProductGroups: [...new Set(readyProducts.map((product) => product.itemCode))].length,
    generatedPath: path.relative(root, generatedPath),
    previewPath: path.relative(root, previewPath),
  }, null, 2));
}

run();
