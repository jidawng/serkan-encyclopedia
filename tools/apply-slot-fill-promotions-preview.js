const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const generatedPath = path.join(root, "app-data.generated.js");
const coveragePath = path.join(root, "data", "product-slot-fill-coverage.json");
const reportPath = path.join(root, "data", "product-slot-fill-promotions-report.md");

function normalize(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function isSafePromotion(record, candidate) {
  if (!record || !candidate) return false;
  if (record.itemCode === "SR26-SY-GN-C1") return false;
  if (candidate.slotMatched) return true;
  return normalize(candidate.currentSlot) === normalize(record.slotLabel);
}

function readGeneratedData() {
  const source = fs.readFileSync(generatedPath, "utf8");
  const match = source.match(/window\.SERKAN_DATA\s*=\s*([\s\S]*?);\s*$/);
  if (!match) throw new Error("Could not parse app-data.generated.js");
  return JSON.parse(match[1]);
}

function manualCodeForItem(itemCode) {
  return String(itemCode || "").replace(/-C(\d+)$/, "-M$1");
}

function productPromotionCode(record, index) {
  const stem = String(record.itemCode).replace(/-C\d+$/, "");
  return `${stem}-P${8600 + index}`;
}

function cloneForSlot({ sourceProduct, record, code }) {
  return {
    ...sourceProduct,
    code,
    itemCode: record.itemCode,
    manualCode: manualCodeForItem(record.itemCode),
    domain: record.domain,
    topic: record.topic,
    slotId: record.slotId,
    recommendationType: record.slotLabel,
    category: record.itemName,
    recommendationReason: sourceProduct.recommendationReason || `${record.itemName}의 ${record.slotLabel} 슬롯에 연결할 실제 제품 후보입니다.`,
    target: sourceProduct.target || `${record.itemName}의 ${record.slotLabel} 기준으로 제품을 고르고 싶은 사용자`,
    actualUse: sourceProduct.actualUse || "실제 사용감은 제품 리뷰와 구매처 정보를 기준으로 추가 검수합니다.",
    caution: sourceProduct.caution || "성분, 피부 반응, 가격, 구매처는 실제 구매 전 확인이 필요합니다.",
    tags: [
      ...(sourceProduct.tags || []),
      record.itemName,
      record.slotLabel,
      "slot-fill",
    ].filter(Boolean),
    reviewStatus: sourceProduct.reviewStatus || "슬롯 재분류 검수 필요",
    source: sourceProduct.source || "generated_slot_promotion",
    sourceId: sourceProduct.code,
    importStatus: "READY",
    connectionStatus: "ready",
    slotPromotion: true,
    promotedFromProductCode: sourceProduct.code,
  };
}

function run() {
  const data = readGeneratedData();
  const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
  const productsByCode = new Map(data.products.map((product) => [product.code, product]));
  const existingSlotKeys = new Set(data.products.map((product) => [
    product.itemCode,
    product.slotId || "",
    product.productName,
    product.brand,
  ].join("::")));
  const usedCodes = new Set(data.products.map((product) => product.code));

  const candidates = coverage.records
    .filter((record) => record.status === "INTERNAL_REVIEW")
    .filter((record) => Array.isArray(record.topCandidates) && record.topCandidates.length)
    .map((record) => ({ record, candidate: record.topCandidates[0] }))
    .filter(({ record, candidate }) => isSafePromotion(record, candidate))
    .filter(({ candidate }) => productsByCode.has(candidate.code));

  const added = [];
  const skipped = [];

  candidates.forEach(({ record, candidate }, index) => {
    const sourceProduct = productsByCode.get(candidate.code);
    const slotKey = [record.itemCode, record.slotId || "", sourceProduct.productName, sourceProduct.brand].join("::");
    if (existingSlotKeys.has(slotKey)) {
      skipped.push({ record, sourceProduct, reason: "already-in-slot" });
      return;
    }

    let code = productPromotionCode(record, index);
    let offset = 1;
    while (usedCodes.has(code)) {
      code = `${String(record.itemCode).replace(/-C\d+$/, "")}-P${8600 + index + offset}`;
      offset += 1;
    }
    usedCodes.add(code);
    existingSlotKeys.add(slotKey);

    const promoted = cloneForSlot({ sourceProduct, record, code });
    data.products.push(promoted);
    added.push({ record, sourceProduct, promoted });
  });

  fs.writeFileSync(generatedPath, `window.SERKAN_DATA = ${JSON.stringify(data, null, 2)};\n`);

  const lines = [
    "# Product Slot Fill Promotions",
    "",
    `Generated at: 2026-06-17`,
    "",
    `- Source coverage: \`data/product-slot-fill-coverage.json\``,
    `- Added promoted products: ${added.length}`,
    `- Skipped: ${skipped.length}`,
    "",
    "## Added",
    "",
    "| Item | Slot | Promoted Product | Source Code | New Code |",
    "|---|---|---|---|---|",
    ...added.map(({ record, sourceProduct, promoted }) => `| ${record.itemName} | ${record.slotLabel} | ${sourceProduct.brand} ${sourceProduct.productName} | \`${sourceProduct.code}\` | \`${promoted.code}\` |`),
  ];

  fs.writeFileSync(reportPath, `${lines.join("\n")}\n`);
  console.log(JSON.stringify({
    added: added.length,
    skipped: skipped.length,
    reportPath: path.relative(root, reportPath),
    generatedPath: path.relative(root, generatedPath),
  }, null, 2));
}

run();
