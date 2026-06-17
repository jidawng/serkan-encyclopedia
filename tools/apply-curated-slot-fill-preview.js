const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const generatedPath = path.join(root, "app-data.generated.js");
const stableGeneratedPath = path.join(root, "app-data.full-products.generated.js");
const stagingPath = path.join(root, "data", "product-curation-import-staging.json");
const reportPath = path.join(root, "data", "product-slot-curated-fill-report.md");

function readGeneratedData() {
  const source = fs.readFileSync(generatedPath, "utf8");
  const match = source.match(/window\.SERKAN_DATA\s*=\s*([\s\S]*?);\s*$/);
  if (!match) throw new Error("Could not parse app-data.generated.js");
  return JSON.parse(match[1]);
}

function writeGeneratedData(data) {
  const payload = `window.SERKAN_DATA = ${JSON.stringify(data, null, 2)};\n`;
  fs.writeFileSync(generatedPath, payload);
  fs.writeFileSync(stableGeneratedPath, payload);
}

function readStagingRecords() {
  if (!fs.existsSync(stagingPath)) return [];
  const staging = JSON.parse(fs.readFileSync(stagingPath, "utf8"));
  return staging.records || [];
}

function manualCodeForItem(itemCode) {
  return String(itemCode || "").replace(/-C(\d+)$/, "-M$1");
}

function toProductFromStaging(record) {
  return {
    code: record.code,
    itemCode: record.itemCode,
    manualCode: record.manualCode,
    domain: record.domain,
    topic: record.topic,
    brand: record.brand,
    productName: record.productName,
    category: record.productGroup || record.category,
    imageUrl: record.productImage,
    productImage: record.productImage,
    productLink: record.productLink,
    recommendationType: record.recommendationType,
    slotId: record.slotId,
    recommendationReason: record.reason || "Notion Product DB에서 가져온 제품 후보입니다.",
    target: "해당 루틴 맥락에 맞는 제품을 고르고 싶은 사용자",
    actualUse: "제품 상세 사용감은 구매처 후기와 실제 사용 맥락 기준으로 추가 보강합니다.",
    caution: "가격, 재고, 성분, 피부 반응은 구매 전 확인이 필요합니다.",
    serkanFit: record.serkanFit || 4,
    reviewStatus: record.importStatus === "IMPORTED" ? "검수 필요" : record.importStatus,
    importStatus: record.importStatus || "READY",
    source: record.source || "notion_product_curation",
    sourceId: record.sourceId || record.code || record.originalCode,
    tags: [record.category, record.productGroup, record.recommendationType].filter(Boolean),
  };
}

const directProducts = {
  "direct-nordic-omega": {
    brand: "Nordic Naturals",
    productName: "Ultimate Omega Soft Gels",
    category: "영양제 / 건강 보조",
    imageUrl: "https://www.nordic.com/wp-content/uploads/2022/01/ultimate-omega-180-soft-gels.png",
    productImage: "https://www.nordic.com/wp-content/uploads/2022/01/ultimate-omega-180-soft-gels.png",
    productLink: "https://www.nordic.com/products/ultimate-omega/",
    serkanFit: 4,
    recommendationReason: "오메가/지방산 슬롯을 분리하기 위한 대표 오메가3 제품입니다.",
    target: "영양제를 하나로 뭉뚱그리지 않고 지방산 보충 목적을 따로 관리하려는 사용자",
    actualUse: "캡슐형이라 아침 식후 루틴에 붙이기 쉽지만, 알 크기와 비린 향 호불호를 확인해야 합니다.",
    caution: "어류 알레르기, 복용 중인 약, 산패 여부, 보관 조건을 확인하세요.",
  },
  "direct-dyson-dryer": {
    brand: "Dyson",
    productName: "Dyson Supersonic Hair Dryer",
    category: "헤어 스타일링 도구",
    imageUrl: "https://dyson-h.assetsadobe2.com/is/image/content/dam/dyson/images/products/primary/389920-01.png",
    productImage: "https://dyson-h.assetsadobe2.com/is/image/content/dam/dyson/images/products/primary/389920-01.png",
    productLink: "https://www.dyson.com/hair-care/hair-dryers/supersonic",
    serkanFit: 4,
    recommendationReason: "드라이 방향과 볼륨 고정을 위한 드라이 도구 슬롯 대표 제품입니다.",
    target: "아침에 머리 모양이 눌리거나 앞머리 방향이 자주 무너지는 사용자",
    actualUse: "빠르게 말리고 방향을 잡기 좋지만, 가격 부담이 커서 프리미엄 도구로 분류합니다.",
    caution: "예산, 무게감, 보관 공간, 소음 체감은 구매 전 확인하세요.",
  },
  "direct-philips-fabric-shaver": {
    brand: "Philips",
    productName: "Philips Fabric Shaver GC026",
    category: "의류 관리 / 세탁 도구",
    imageUrl: "https://images.philips.com/is/image/philipsconsumer/GC026_00-IMS-en_US?$jpglarge$",
    productImage: "https://images.philips.com/is/image/philipsconsumer/GC026_00-IMS-en_US?$jpglarge$",
    productLink: "https://www.philips.com/c-p/GC026_00/fabric-shaver",
    serkanFit: 4,
    recommendationReason: "니트, 맨투맨, 코트 표면의 보풀을 정리하는 먼지/보풀 슬롯 제품입니다.",
    target: "옷은 깨끗한데 보풀 때문에 전체 인상이 낡아 보이는 사용자를 위한 도구",
    actualUse: "외출 전 넓은 면적의 보풀을 빠르게 정리하기 좋지만 얇은 원단에는 힘 조절이 필요합니다.",
    caution: "섬세한 니트, 울, 실크 소재에는 낮은 압력으로 테스트하세요.",
  },
  "direct-the-laundress-detergent": {
    brand: "The Laundress",
    productName: "Signature Detergent Classic",
    category: "의류 관리 / 세탁 도구",
    imageUrl: "https://www.thelaundress.com/cdn/shop/files/Signature_Detergent_Classic_32oz_Front.png",
    productImage: "https://www.thelaundress.com/cdn/shop/files/Signature_Detergent_Classic_32oz_Front.png",
    productLink: "https://www.thelaundress.com/products/signature-detergent-classic",
    serkanFit: 4,
    recommendationReason: "옷 냄새와 세탁 루틴을 관리하는 세탁/섬유 슬롯 제품입니다.",
    target: "셔츠, 티셔츠, 운동복을 대충 빨지 않고 향과 소재감을 같이 관리하려는 사용자",
    actualUse: "향과 세탁 후 잔향이 장점이지만 향 호불호와 가격 부담이 있을 수 있습니다.",
    caution: "민감 피부, 향 민감도, 세탁기 권장량을 확인하세요.",
  },
};

const fills = [
  // Scalp / hair
  ["SR26-SK-HR-C1", "scaler", "스케일링/각질", "SR26-GR-SC-P102"],
  ["SR26-HR-DCL-C1", "budget", "가성비", "SR26-HR-DCL-P1"],
  ["SR26-HR-DCL-C1", "daily", "데일리/집중관리", "SR26-SK-HR-P108"],
  ["SR26-HR-DCL-C1", "premium", "프리미엄", "SR26-SK-HR-P106"],
  ["SR26-HR-DCL-C1", "volume", "정수리 볼륨", "SR26-SK-HR-P701"],
  ["SR26-HR-DCL-C1", "scaler", "스케일링/각질", "SR26-HR-DCL-P1"],
  ["SR26-ST-HS-C1", "serumOil", "세럼/오일", "SR26-ST-HR-P025"],
  ["SR26-ST-HS-C1", "spray", "스프레이", "SR26-GR-HR-P105"],
  ["SR26-ST-HS-C1", "dryerTool", "드라이 도구", "direct-dyson-dryer"],
  ["SR26-ST-HC-C1", "damage", "손상모", "SR26-GR-HC-P103"],
  ["SR26-ST-HC-C1", "premium", "프리미엄", "SR26-GR-HC-P001"],

  // Shaving
  ["SR26-GR-SH-C1", "razor", "면도기", "SR26-BD-SH-P705"],
  ["SR26-GR-SH-C1", "shavingGel", "쉐이빙젤/폼", "SR26-BD-SH-P035"],
  ["SR26-GR-SH-C1", "aftershave", "애프터쉐이브", "SR26-GR-SH-P9237"],
  ["SR26-GR-SH-C2", "premium", "프리미엄", "SR26-BD-SH-P705"],

  // Body wash duplicated import item
  ["SR26-BD-BC-C1", "bodyWash", "바디워시", "SR26-BD-BC-P9287"],
  ["SR26-BD-BO-C1", "bodyWash", "바디워시", "SR26-BD-BO-P1"],
  ["SR26-BD-BO-C1", "moisturizing", "보습/로션", "SR26-BD-BC-P032"],
  ["SR26-BD-BO-C1", "sensitive", "민감성", "SR26-BD-BC-P702"],
  ["SR26-BD-BO-C1", "scent", "향 중심", "SR26-BD-BC-P703"],
  ["SR26-BD-BO-C1", "cleansing", "세정력 중심", "SR26-BD-BO-P1"],

  // Skin barrier / cleansing
  ["SR26-SK-CG-C1", "moisturizing", "보습 세안", "SR26-SK-CL-P105"],
  ["SR26-SK-CG-C1", "premium", "프리미엄", "SR26-SK-CL-P103"],
  ["SR26-SK-BR-C1", "hydration", "수분 보충", "SR26-SK-BR-P001"],
  ["SR26-SK-BR-C1", "soothing", "진정", "SR26-SK-BR-P101"],
  ["SR26-SK-BR-C1", "premium", "프리미엄", "SR26-SK-BR-P002"],
  ["SR26-SK-ER-C1", "hydration", "수분 보충", "SR26-SK-BR-P001"],
  ["SR26-SK-ER-C1", "soothing", "진정", "SR26-SK-BR-P101"],
  ["SR26-SK-ER-C1", "tonerPad", "패드/토너", "SR26-SK-BR-P008"],
  ["SR26-SK-ER-C1", "cica", "시카/흔적", "SR26-SK-BR-P013"],
  ["SR26-SK-ER-C1", "premium", "프리미엄", "SR26-SK-BR-P002"],
  ["SR26-SK-HC-C1", "deviceSupport", "디바이스 보조", "SR26-SK-BR-P001"],
  ["SR26-SK-HD-C1", "led", "LED/탄력", "SR26-SK-HD-P016"],

  // Food / supplement / sleep
  ["SR26-FD-SU-C1", "omega", "오메가/지방산", "direct-nordic-omega"],
  ["SR26-FD-SU-C1", "electrolyte", "전해질/수분", "SR26-FD-FT-P301"],
  ["SR26-SL-SU-C1", "sleepMask", "수면 안대", "SR26-SL-LB-P302"],
  ["SR26-SL-SU-C1", "relaxing", "릴렉싱", "SR26-SL-SU-P9271"],

  // Space / wardrobe
  ["SR26-SP-HM-C1", "budget", "가성비", "SR26-SL-RS-P401"],
  ["SR26-SP-HM-C1", "smartLarge", "대용량/스마트", "SR26-SL-RS-P201"],
  ["SR26-SP-HM-C1", "hygrometer", "습도계", "SR26-SL-RS-P402"],
  ["SR26-SP-HM-C1", "premium", "프리미엄", "SR26-SP-HM-P047"],
  ["SR26-ST-WC-C1", "lint", "먼지/보풀", "direct-philips-fabric-shaver"],
  ["SR26-ST-WC-C1", "laundry", "세탁/섬유", "direct-the-laundress-detergent"],
];

function main() {
  const data = readGeneratedData();
  const stagingRecords = readStagingRecords();
  const productsByCode = new Map(data.products.map((product) => [product.code, product]));
  const stagingByCode = new Map(stagingRecords.map((record) => [record.code, record]));
  const itemsByCode = new Map(data.items.map((item) => [item.code, item]));
  const usedCodes = new Set(data.products.map((product) => product.code));
  const existingSlotKeys = new Set(data.products.map((product) => [
    product.itemCode,
    product.slotId || "",
    product.brand || "",
    product.productName || "",
  ].join("::")));

  const added = [];
  const skipped = [];
  let directIndex = 0;
  let cloneIndex = 0;

  const sourceFor = (sourceCode) => {
    if (directProducts[sourceCode]) return { ...directProducts[sourceCode], source: "curated_direct_slot_fill", sourceId: sourceCode };
    if (productsByCode.has(sourceCode)) return productsByCode.get(sourceCode);
    if (stagingByCode.has(sourceCode)) return toProductFromStaging(stagingByCode.get(sourceCode));
    return null;
  };

  const nextCode = (itemCode, isDirect) => {
    const stem = String(itemCode).replace(/-C\d+$/, "");
    let code;
    do {
      code = `${stem}-P${isDirect ? 9800 + directIndex++ : 9700 + cloneIndex++}`;
    } while (usedCodes.has(code));
    usedCodes.add(code);
    return code;
  };

  for (const [itemCode, slotId, slotLabel, sourceCode] of fills) {
    const item = itemsByCode.get(itemCode);
    const sourceProduct = sourceFor(sourceCode);
    if (!item || !sourceProduct) {
      skipped.push({ itemCode, slotId, sourceCode, reason: !item ? "missing-item" : "missing-source" });
      continue;
    }

    const slotKey = [itemCode, slotId, sourceProduct.brand || "", sourceProduct.productName || ""].join("::");
    if (existingSlotKeys.has(slotKey)) {
      skipped.push({ itemCode, slotId, sourceCode, reason: "already-in-slot" });
      continue;
    }

    const code = nextCode(itemCode, Boolean(directProducts[sourceCode]));
    const product = {
      ...sourceProduct,
      code,
      itemCode,
      manualCode: manualCodeForItem(itemCode),
      domain: item.domain,
      topic: item.topic,
      slotId,
      recommendationType: slotLabel,
      category: item.name,
      imageUrl: sourceProduct.imageUrl || sourceProduct.productImage,
      productImage: sourceProduct.productImage || sourceProduct.imageUrl,
      recommendationReason: sourceProduct.recommendationReason || `${item.name}의 ${slotLabel} 슬롯에 맞춰 연결한 실제 제품입니다.`,
      target: sourceProduct.target || `${item.name}의 ${slotLabel} 기준으로 제품을 고르고 싶은 사용자`,
      actualUse: sourceProduct.actualUse || "실제 사용감은 제품 리뷰와 구매처 정보를 기준으로 추가 검수합니다.",
      caution: sourceProduct.caution || "성분, 피부 반응, 가격, 구매처는 실제 구매 전 확인이 필요합니다.",
      tags: [...new Set([...(sourceProduct.tags || []), item.name, slotLabel, "curated-slot-fill"].filter(Boolean))],
      importStatus: "READY",
      connectionStatus: "ready",
      reviewStatus: sourceProduct.reviewStatus || "슬롯 재분류 검수 필요",
      source: sourceProduct.source || "curated_slot_fill",
      sourceId: sourceProduct.sourceId || sourceProduct.code || sourceCode,
      curatedSlotFill: true,
      promotedFromProductCode: sourceProduct.code || sourceCode,
    };

    data.products.push(product);
    productsByCode.set(product.code, product);
    existingSlotKeys.add(slotKey);
    if (!Array.isArray(item.productCodes)) item.productCodes = [];
    if (!item.productCodes.includes(product.code)) item.productCodes.push(product.code);
    added.push({ itemCode, itemName: item.name, slotLabel, sourceCode, code, productName: product.productName, brand: product.brand });
  }

  const genericItem = itemsByCode.get("SR26-SY-GN-C1");
  let removedGenericSlots = 0;
  if (genericItem && Array.isArray(genericItem.productSlots)) {
    removedGenericSlots = genericItem.productSlots.length;
    genericItem.productSlots = [];
    genericItem.slotReviewStatus = "generic-item-disabled";
    genericItem.slotReviewReason = "추천 제품 제품군은 실제 관리 Item이 아니므로 목적형 Product Slot에서 제외함.";
  }

  writeGeneratedData(data);

  const lines = [
    "# Product Slot Curated Fill Report",
    "",
    "Generated at: 2026-06-17",
    "",
    `- Added curated slot products: ${added.length}`,
    `- Skipped: ${skipped.length}`,
    `- Disabled generic item slots: ${removedGenericSlots}`,
    "",
    "## Added",
    "",
    "| Item | Slot | Product | Source | New Code |",
    "|---|---|---|---|---|",
    ...added.map((row) => `| ${row.itemName} | ${row.slotLabel} | ${row.brand} ${row.productName} | \`${row.sourceCode}\` | \`${row.code}\` |`),
    "",
    "## Skipped",
    "",
    "| Item Code | Slot | Source | Reason |",
    "|---|---|---|---|",
    ...skipped.map((row) => `| \`${row.itemCode}\` | ${row.slotId} | \`${row.sourceCode}\` | ${row.reason} |`),
  ];

  fs.writeFileSync(reportPath, `${lines.join("\n")}\n`);
  console.log(JSON.stringify({
    added: added.length,
    skipped: skipped.length,
    disabledGenericItemSlots: removedGenericSlots,
    generatedPath: path.relative(root, generatedPath),
    stableGeneratedPath: path.relative(root, stableGeneratedPath),
    reportPath: path.relative(root, reportPath),
  }, null, 2));
}

main();
