const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const generatedPath = path.join(root, "app-data.generated.js");
const outputJsonPath = path.join(root, "data", "product-slot-fill-coverage.json");
const outputMdPath = path.join(root, "data", "product-slot-fill-coverage.md");

const slotPatterns = [
  ["가성비", ["가성비", "저가", "입문", "basic", "daily", "데일리"]],
  ["프리미엄", ["프리미엄", "고급", "하이엔드", "premium", "luxury"]],
  ["민감/입문", ["민감", "입문", "마일드", "저자극", "순한", "sensitive", "mild"]],
  ["입문", ["입문", "초보", "easy", "basic"]],
  ["데일리", ["데일리", "매일", "daily"]],
  ["휴대", ["휴대", "포켓", "미니", "compact", "portable"]],
  ["스마트", ["스마트", "앱", "연동", "wifi", "bluetooth", "블루투스", "iot"]],
  ["조도", ["조도", "밝기", "디밍", "dimming", "dimmable", "무드등"]],
  ["침실", ["침실", "저소음", "수면", "sleep", "bedroom", "quiet"]],
  ["습도계", ["습도계", "습도", "hygrometer"]],
  ["저당", ["저당", "무설탕", "제로", "sugar free", "low sugar"]],
  ["상처", ["상처", "밴드", "반창고", "드레싱", "밴드에이드", "bandage", "wound"]],
  ["마찰", ["마찰", "물집", "쓸림", "보호", "friction"]],
  ["냉찜질", ["냉찜질", "아이스", "쿨링", "cold", "ice"]],
  ["스케일링", ["스케일링", "각질", "스케일러", "scaler", "exfoliating"]],
  ["복합성", ["복합성", "수부지", "combination"]],
  ["응급", ["응급", "스팟", "긴급", "emergency", "spot"]],
  ["교정", ["교정", "임플란트", "치간", "orthodontic", "implant"]],
  ["면도기", ["면도기", "razor", "쉐이버"]],
  ["쉐이빙젤", ["쉐이빙", "쉐이빙젤", "폼", "shaving", "gel", "foam"]],
  ["애프터쉐이브", ["애프터쉐이브", "aftershave", "면도 후", "진정"]],
  ["코털", ["코털", "눈썹", "트리머", "trimmer"]],
  ["오일", ["오일", "oil"]],
  ["비타민C", ["비타민", "vitamin", "c세럼", "c serum"]],
  ["톤", ["톤", "칙칙", "브라이트닝", "brightening"]],
  ["패드", ["패드", "토너", "pad", "toner"]],
  ["시카", ["시카", "센텔라", "마데카", "cica", "centella"]],
  ["장벽", ["장벽", "세라마이드", "barrier", "ceramide"]],
  ["수분", ["수분", "히알루론", "hydration", "moisture"]],
  ["모공", ["모공", "블랙헤드", "pore", "blackhead"]],
  ["마스크", ["마스크", "팩", "mask", "pack"]],
  ["부스터", ["부스터", "흡수", "booster"]],
  ["LED", ["led", "엘이디", "탄력"]],
  ["클렌징", ["클렌징", "세안", "cleanser", "cleansing"]],
  ["바디워시", ["바디워시", "워시", "솝", "body wash", "soap"]],
  ["보습", ["보습", "로션", "크림", "moisturizing", "lotion", "cream"]],
  ["데오", ["데오", "체취", "땀", "deodorant", "odor"]],
  ["향", ["향", "프래그런스", "퍼퓸", "scent", "fragrance"]],
  ["마사지", ["마사지", "이완", "massager", "massage"]],
  ["스트레칭", ["스트레칭", "stretch"]],
  ["고체", ["고체", "밤", "balm"]],
  ["스프레이", ["스프레이", "spray"]],
  ["세탁", ["세탁", "런드리", "laundry"]],
  ["수납", ["수납", "정리", "organizer", "storage"]],
  ["케이블", ["케이블", "cable"]],
  ["타이머", ["타이머", "timer"]],
  ["웨어러블", ["웨어러블", "watch", "fitbit", "tracker"]],
  ["노트", ["노트", "저널", "기록", "journal", "notebook"]],
  ["차단", ["차단", "잠금", "block", "lock", "detox"]],
];

function readData() {
  const code = fs.readFileSync(generatedPath, "utf8");
  const ctx = { window: {} };
  vm.runInNewContext(code, ctx);
  return ctx.window.SERKAN_DATA;
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function productText(product) {
  return normalize([
    product.productName,
    product.brand,
    product.category,
    product.recommendationType,
    product.recommendationReason,
    product.target,
    product.actualUse,
    product.trendReason,
    ...(product.tags || []),
  ].join(" "));
}

function productCoreText(product) {
  return normalize([
    product.productName,
    product.brand,
    product.category,
    product.recommendationType,
  ].join(" "));
}

function itemText(item) {
  return normalize([
    item.name,
    item.category,
    item.role,
    ...(item.tags || []),
  ].join(" "));
}

function getSlotKeywords(slot) {
  const label = slot.label || slot.id || "";
  const base = [label, slot.id].filter(Boolean);
  const matches = slotPatterns
    .filter(([key]) => normalize(label).includes(normalize(key)) || normalize(slot.id).includes(normalize(key)))
    .flatMap(([, words]) => words);
  return [...new Set([...base, ...matches].map(normalize).filter(Boolean))];
}

function includesAny(text, keywords) {
  return keywords.some((keyword) => keyword && text.includes(keyword));
}

function isRealProduct(product) {
  const name = normalize(product.productName);
  if (!name || name.includes("mock product") || name.includes("추천 제품 준비") || name.includes("제품 연결 대기")) return false;
  return Boolean(product.brand && product.brand !== "Mock Brand");
}

function fitNumber(product) {
  const fit = Number(product.serkanFit || 0);
  return Number.isFinite(fit) ? fit : 0;
}

function scoreCandidate({ item, slot, product }) {
  const pText = productText(product);
  const pCoreText = productCoreText(product);
  const iText = itemText(item);
  const keywords = getSlotKeywords(slot);
  const coreSlotMatched = includesAny(pCoreText, keywords);
  const slotMatched = coreSlotMatched || includesAny(pText, keywords);
  const itemMatched = item.name
    .split(/[ /·,]+/)
    .map(normalize)
    .filter((token) => token.length >= 2)
    .some((token) => pText.includes(token));
  let score = 0;

  if (product.itemCode === item.code) score += 80;
  if (product.domain && item.domain && product.domain === item.domain) score += 20;
  if (product.topic && item.topic && product.topic === item.topic) score += 20;
  if (coreSlotMatched) score += 70;
  else if (slotMatched) score += 20;
  if (itemMatched) score += 25;
  if (normalize(product.recommendationType) === normalize(slot.label)) score += 90;
  if (iText && itemMatched) score += 10;
  score += fitNumber(product) * 6;
  if (product.productLink) score += 8;
  if (product.imageUrl) score += 8;
  if (normalize(product.reviewStatus).includes("승인")) score += 8;
  if (normalize(product.reviewStatus).includes("검수")) score -= 4;

  return { score, slotMatched, coreSlotMatched, itemMatched };
}

function isRelatedCandidateScope(item, product, scored) {
  if (product.itemCode === item.code) return true;
  if (product.domain && item.domain && product.topic && item.topic && product.domain === item.domain && product.topic === item.topic && scored.itemMatched) return true;
  return false;
}

function candidateStatus(candidates) {
  if (candidates.some((candidate) => candidate.score >= 145 && candidate.coreSlotMatched && candidate.currentItemCode === candidate.targetItemCode)) return "INTERNAL_READY";
  if (candidates.some((candidate) => candidate.score >= 120)) return "INTERNAL_REVIEW";
  return "NEEDS_EXTERNAL_SEARCH";
}

function searchQueryFor(item, slot) {
  const domainHint = {
    SK: "올리브영",
    GR: "올리브영",
    BD: "올리브영",
    FD: "네이버쇼핑",
    SL: "네이버쇼핑",
    SP: "네이버쇼핑",
    ST: "올리브영",
    HR: "올리브영",
    MT: "네이버쇼핑",
    SY: "네이버쇼핑",
  }[item.domain] || "네이버쇼핑";
  return `${domainHint} ${item.name} ${slot.label} 추천 제품`;
}

function groupBy(records, key) {
  return records.reduce((acc, record) => {
    const value = record[key] || "NA";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function main() {
  const data = readData();
  const items = (data.items || []).filter((item) => Array.isArray(item.productSlots) && item.productSlots.length);
  const products = (data.products || []).filter(isRealProduct);
  const highFitProducts = products.filter((product) => fitNumber(product) >= 4);
  const records = [];

  for (const item of items) {
    for (const slot of item.productSlots) {
      const existing = products.filter((product) => product.itemCode === item.code && (product.slotId === slot.id || product.recommendationType === slot.label));
      const candidates = highFitProducts
        .map((product) => {
          const scored = scoreCandidate({ item, slot, product });
          return { product, ...scored };
        })
        .filter((candidate) => isRelatedCandidateScope(item, candidate.product, candidate))
        .filter((candidate) => candidate.score >= 110 || candidate.product.itemCode === item.code)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((candidate) => ({
          code: candidate.product.code,
          brand: candidate.product.brand,
          productName: candidate.product.productName,
          targetItemCode: item.code,
          currentItemCode: candidate.product.itemCode,
          currentSlot: candidate.product.recommendationType || null,
          serkanFit: fitNumber(candidate.product),
          score: candidate.score,
          slotMatched: candidate.slotMatched,
          itemMatched: candidate.itemMatched,
          hasImage: Boolean(candidate.product.imageUrl),
          hasLink: Boolean(candidate.product.productLink),
          reviewStatus: candidate.product.reviewStatus || null,
        }));

      const status = existing.length ? "FILLED" : candidateStatus(candidates);
      records.push({
        itemCode: item.code,
        itemName: item.name,
        domain: item.domain || null,
        topic: item.topic || null,
        slotId: slot.id || null,
        slotLabel: slot.label || slot.id || null,
        currentProductCount: existing.length,
        status,
        priority: status === "FILLED" ? "DONE" : ["SK", "GR", "BD", "SL", "FD"].includes(item.domain) ? "HIGH" : "NORMAL",
        topCandidates: status === "FILLED" ? [] : candidates,
        suggestedSearchQuery: status === "FILLED" ? null : searchQueryFor(item, slot),
      });
    }
  }

  const emptyRecords = records.filter((record) => record.status !== "FILLED");
  const summary = {
    generatedAt: "2026-06-17",
    source: "app-data.generated.js",
    itemsWithSlots: items.length,
    totalSlots: records.length,
    filledSlots: records.filter((record) => record.status === "FILLED").length,
    emptySlots: emptyRecords.length,
    internalReady: records.filter((record) => record.status === "INTERNAL_READY").length,
    internalReview: records.filter((record) => record.status === "INTERNAL_REVIEW").length,
    needsExternalSearch: records.filter((record) => record.status === "NEEDS_EXTERNAL_SEARCH").length,
    highFitProducts: highFitProducts.length,
    emptyByDomain: groupBy(emptyRecords, "domain"),
    emptyByStatus: groupBy(emptyRecords, "status"),
  };

  const payload = { summary, records };
  fs.writeFileSync(outputJsonPath, `${JSON.stringify(payload, null, 2)}\n`);

  const priorityOpen = emptyRecords
    .sort((a, b) => {
      const pa = a.priority === "HIGH" ? 0 : 1;
      const pb = b.priority === "HIGH" ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return a.itemName.localeCompare(b.itemName, "ko");
    })
    .slice(0, 40);

  const md = [
    "# Product Slot Fill Coverage",
    "",
    "Generated at: 2026-06-17",
    "",
    "## Summary",
    "",
    `- Source: \`${summary.source}\``,
    `- Items with Product Slots: ${summary.itemsWithSlots}`,
    `- Total Product Slots: ${summary.totalSlots}`,
    `- Filled Slots: ${summary.filledSlots}`,
    `- Empty Slots: ${summary.emptySlots}`,
    `- Internal READY candidates: ${summary.internalReady}`,
    `- Internal REVIEW candidates: ${summary.internalReview}`,
    `- Needs external search: ${summary.needsExternalSearch}`,
    `- High-fit product pool (SERKAN Fit 4~5): ${summary.highFitProducts}`,
    "",
    "## Empty Slots by Domain",
    "",
    "| Domain | Empty Slots |",
    "|---|---:|",
    ...Object.entries(summary.emptyByDomain).sort((a, b) => b[1] - a[1]).map(([domain, count]) => `| ${domain} | ${count} |`),
    "",
    "## Priority Empty Slots",
    "",
    "| Priority | Status | Item Code | Item | Slot | Top Internal Candidate | SERKAN Fit | Suggested Search Query |",
    "|---|---|---|---|---|---|---:|---|",
    ...priorityOpen.map((record) => {
      const candidate = record.topCandidates[0];
      return [
        record.priority,
        record.status,
        `\`${record.itemCode}\``,
        record.itemName,
        record.slotLabel,
        candidate ? `${candidate.brand} ${candidate.productName} (${candidate.currentSlot || "-"})` : "-",
        candidate ? candidate.serkanFit : "-",
        record.suggestedSearchQuery || "-",
      ].map((value) => String(value).replace(/\|/g, "/")).join(" | ").replace(/^/, "| ").replace(/$/, " |");
    }),
    "",
    "## Rules",
    "",
    "- 원본 `app-data.js`는 수정하지 않았다.",
    "- 후보는 현재 `app-data.generated.js` 안의 실제 제품 중 SERKAN Fit 4~5 제품을 우선으로 계산했다.",
    "- `INTERNAL_READY`는 내부 DB만으로 바로 슬롯 채움 후보가 강한 경우다.",
    "- `INTERNAL_REVIEW`는 내부 후보가 있지만 슬롯 이동/중복 사용 검토가 필요한 경우다.",
    "- `NEEDS_EXTERNAL_SEARCH`는 기존 제품 DB만으로는 슬롯을 채우기 어려운 경우다.",
    "- 외부 검색은 이 리포트의 Suggested Search Query를 기준으로 진행한다.",
  ].join("\n");
  fs.writeFileSync(outputMdPath, `${md}\n`);

  console.log(JSON.stringify(summary, null, 2));
}

main();
