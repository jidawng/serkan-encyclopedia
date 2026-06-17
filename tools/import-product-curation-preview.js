const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sourceCsvPath = path.join(root, "data", "product-curation-source.csv");
const generatedPath = path.join(root, "app-data.generated.js");
const stagingPath = path.join(root, "data", "product-curation-import-staging.json");
const reportPath = path.join(root, "data", "product-curation-import-report.md");

const categoryDomain = {
  "피부관리": "SK",
  "스타일관리": "ST",
  "바디관리": "BD",
  "위생관리": "GR",
  "식단관리": "FD",
  "공간관리": "SP",
  "수면관리": "SL",
};

const domainCategory = {
  SK: "피부관리",
  ST: "스타일관리",
  BD: "바디관리",
  GR: "위생관리",
  FD: "식단관리",
  SP: "공간관리",
  SL: "수면관리",
  MT: "멘탈관리",
  SY: "시스템관리",
};

const productGroupItemMap = {
  "선케어": { itemCode: "SR26-SK-SS-C1", name: "데일리 선크림" },
  "클렌징": { itemCode: "SR26-SK-CG-C1", name: "클렌징 / 세안 도구" },
  "장벽케어": { itemCode: "SR26-SK-BR-C1", name: "장벽 케어 / 진정 보습" },
  "홈케어": { itemCode: "SR26-SK-HC-C1", name: "홈케어 / 피부 관리 도구" },
  "홈케어디바이스": { itemCode: "SR26-SK-HD-C1", name: "홈케어 디바이스" },
  "슬로우에이징": { itemCode: "SR26-SK-AG-C1", name: "슬로우에이징 / 피부결 관리" },
  "메이크업": { itemCode: "SR26-SK-MK-C1", name: "남성 톤 보정 / 부분 커버" },
  "두피케어": { itemCode: "SR26-SK-HR-C1", name: "두피케어 / 두피 세럼" },
  "바디케어": { itemCode: "SR26-BD-BC-C1", name: "바디워시 / 바디 클렌징" },
  "운동회복": { itemCode: "SR26-BD-RC-C1", name: "회복 디바이스 / 목어깨 마사지" },
  "체모·면도": { itemCode: "SR26-GR-SH-C2", name: "면도기 / 체모 관리" },
  "영양제": { itemCode: "SR26-FD-SU-C1", name: "영양제 / 건강 보조" },
  "향수": { itemCode: "SR26-ST-FR-C2", name: "향수 / 데일리 프래그런스" },
  "의류관리": { itemCode: "SR26-ST-WC-C1", name: "의류 관리 / 세탁 도구" },
  "헤어스타일링": { itemCode: "SR26-ST-HS-C1", name: "헤어 스타일링 도구" },
  "헤어케어": { itemCode: "SR26-ST-HC-C1", name: "헤어 케어 / 트리트먼트" },
  "립케어": { itemCode: "SR26-ST-RS-C1", name: "발색 립밤" },
  "수면관리": { itemCode: "SR26-SL-SU-C1", name: "수면 보조 / 취침 루틴" },
  "가습기": { itemCode: "SR26-SL-RS-C1", name: "가습기 / 습도계" },
};

const slotPresetsByProductGroup = {
  "선케어": [
    { id: "budget", label: "가성비" },
    { id: "sensitive", label: "민감/입문" },
    { id: "premium", label: "프리미엄" },
    { id: "oily", label: "지성" },
    { id: "combination", label: "복합성" },
    { id: "dry", label: "건성" },
  ],
  "클렌징": [
    { id: "cleansingOil", label: "클렌징 오일" },
    { id: "cleansingFoam", label: "클렌징 폼" },
    { id: "lowPh", label: "약산성/민감" },
    { id: "moisturizing", label: "보습 세안" },
    { id: "premium", label: "프리미엄" },
  ],
  "장벽케어": [
    { id: "hydration", label: "수분 보충" },
    { id: "soothing", label: "진정" },
    { id: "barrierCream", label: "장벽 크림" },
    { id: "tonerPad", label: "패드/토너" },
    { id: "cica", label: "시카/흔적" },
    { id: "premium", label: "프리미엄" },
  ],
  "홈케어": [
    { id: "pore", label: "모공/블랙헤드" },
    { id: "maskPad", label: "마스크/패드" },
    { id: "skinTexture", label: "피부결" },
    { id: "deviceSupport", label: "디바이스 보조" },
    { id: "premium", label: "프리미엄" },
  ],
  "홈케어디바이스": [
    { id: "booster", label: "부스터/흡수" },
    { id: "led", label: "LED/탄력" },
    { id: "cleansingDevice", label: "클렌징 디바이스" },
    { id: "premiumDevice", label: "프리미엄 디바이스" },
  ],
  "슬로우에이징": [
    { id: "vitaminC", label: "비타민C/톤" },
    { id: "retinol", label: "레티놀" },
    { id: "elasticity", label: "탄력" },
    { id: "skinTexture", label: "피부결" },
    { id: "premium", label: "프리미엄" },
  ],
  "메이크업": [
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
  "두피케어": [
    { id: "budget", label: "가성비" },
    { id: "daily", label: "데일리/집중관리" },
    { id: "premium", label: "프리미엄" },
    { id: "cooling", label: "두피 열감" },
    { id: "volume", label: "정수리 볼륨" },
    { id: "scaler", label: "스케일링/각질" },
  ],
  "바디케어": [
    { id: "bodyWash", label: "바디워시" },
    { id: "moisturizing", label: "보습/로션" },
    { id: "deodorant", label: "데오/체취" },
    { id: "sensitive", label: "민감성" },
    { id: "scent", label: "향 중심" },
    { id: "cleansing", label: "세정력 중심" },
  ],
  "운동회복": [
    { id: "massage", label: "마사지/이완" },
    { id: "coldPack", label: "냉찜질" },
    { id: "stretch", label: "스트레칭" },
    { id: "device", label: "회복 디바이스" },
    { id: "premium", label: "프리미엄" },
  ],
  "체모·면도": [
    { id: "razor", label: "면도기" },
    { id: "shavingGel", label: "쉐이빙젤/폼" },
    { id: "aftershave", label: "애프터쉐이브" },
    { id: "bodyGroomer", label: "바디그루밍" },
    { id: "premium", label: "프리미엄" },
  ],
  "영양제": [
    { id: "multivitamin", label: "멀티비타민" },
    { id: "omega", label: "오메가/지방산" },
    { id: "protein", label: "단백질" },
    { id: "electrolyte", label: "전해질/수분" },
    { id: "sleep", label: "수면 보조" },
    { id: "premium", label: "프리미엄" },
  ],
  "향수": [
    { id: "daily", label: "데일리" },
    { id: "clean", label: "클린/비누향" },
    { id: "woody", label: "우디/머스크" },
    { id: "hairMist", label: "헤어미스트" },
    { id: "solid", label: "고체/밤" },
    { id: "premium", label: "프리미엄" },
  ],
  "의류관리": [
    { id: "steamer", label: "스팀/주름" },
    { id: "lint", label: "먼지/보풀" },
    { id: "laundry", label: "세탁/섬유" },
    { id: "storage", label: "보관/수납" },
    { id: "scent", label: "향/탈취" },
  ],
  "헤어스타일링": [
    { id: "waxPomade", label: "왁스/포마드" },
    { id: "serumOil", label: "세럼/오일" },
    { id: "spray", label: "스프레이" },
    { id: "dryerTool", label: "드라이 도구" },
    { id: "volume", label: "볼륨" },
  ],
  "헤어케어": [
    { id: "shampoo", label: "샴푸" },
    { id: "treatment", label: "트리트먼트" },
    { id: "scalp", label: "두피" },
    { id: "damage", label: "손상모" },
    { id: "premium", label: "프리미엄" },
  ],
  "립케어": [
    { id: "daily", label: "데일리" },
    { id: "tinted", label: "발색" },
    { id: "men", label: "남성 입문" },
    { id: "premium", label: "프리미엄" },
  ],
  "수면관리": [
    { id: "sleepSupplement", label: "수면 보조" },
    { id: "sleepMask", label: "수면 안대" },
    { id: "relaxing", label: "릴렉싱" },
    { id: "premium", label: "프리미엄" },
  ],
  "가습기": [
    { id: "budget", label: "가성비" },
    { id: "bedroom", label: "침실 저소음" },
    { id: "smartLarge", label: "대용량/스마트" },
    { id: "hygrometer", label: "습도계" },
    { id: "premium", label: "프리미엄" },
  ],
};

const fallbackSlotPresets = [
  { id: "daily", label: "입문/데일리" },
  { id: "sensitive", label: "민감/입문" },
  { id: "premium", label: "프리미엄" },
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const normalized = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    const next = normalized[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        field += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((cell) => cell !== "")) rows.push(row);

  const headers = rows.shift() || [];
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header.trim(), (values[index] || "").trim()])));
}

function readGeneratedData() {
  const source = fs.readFileSync(generatedPath, "utf8");
  const match = source.match(/window\.SERKAN_DATA\s*=\s*([\s\S]*?);\s*$/);
  if (!match) throw new Error("Could not parse generated data");
  return JSON.parse(match[1]);
}

function codeParts(code) {
  const match = String(code || "").trim().match(/^SR26-([A-Z0-9]+)-([A-Z0-9]+)(?:-[A-Z]\d+)?$/);
  if (!match) return null;
  return { domain: match[1], topic: match[2] };
}

function sectionItemCode(sectionCode) {
  const parts = codeParts(sectionCode);
  if (!parts) return null;
  return `SR26-${parts.domain}-${parts.topic}-C1`;
}

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function productIdentity(product) {
  return `${normalizeKey(product.brand)}::${normalizeKey(product.productName)}`;
}

function safeTopicFromGroup(productGroup, fallback = "GN") {
  const mapped = {
    "선케어": "SS",
    "클렌징": "CG",
    "장벽케어": "BR",
    "홈케어": "HC",
    "홈케어디바이스": "HD",
    "슬로우에이징": "AG",
    "메이크업": "MK",
    "두피케어": "HR",
    "바디케어": "BC",
    "운동회복": "RC",
    "체모·면도": "SH",
    "영양제": "SU",
    "향수": "FR",
    "의류관리": "WC",
    "헤어스타일링": "HS",
    "헤어케어": "HC",
    "립케어": "RS",
    "수면관리": "SU",
    "가습기": "RS",
  };
  return mapped[productGroup] || fallback;
}

function itemNameFor(row, itemCode) {
  const group = row["제품군"] || "추천 제품";
  if (productGroupItemMap[group]) return productGroupItemMap[group].name;
  return `${group} 제품군`;
}

function resolveItem(row) {
  const section = sectionItemCode(row["연결 섹션 코드"]);
  if (section) return { itemCode: section, reason: "linked-section-code" };

  const group = row["제품군"] || "";
  if (productGroupItemMap[group]) return { itemCode: productGroupItemMap[group].itemCode, reason: "product-group-map" };

  const originalParts = codeParts(row["SERKAN Code"]);
  if (originalParts) {
    return { itemCode: `SR26-${originalParts.domain}-${originalParts.topic}-C1`, reason: "serkan-code" };
  }

  const domain = categoryDomain[row["카테고리"]] || "SY";
  const topic = safeTopicFromGroup(group, "GN");
  return { itemCode: `SR26-${domain}-${topic}-C1`, reason: "category-product-group-fallback" };
}

function roleNumber(code, role) {
  const match = String(code).match(new RegExp(`-${role}(\\d+)$`));
  return match ? match[1] : "1";
}

function manualCodeForItem(itemCode) {
  const number = roleNumber(itemCode, "C");
  return itemCode.replace(/-C\d+$/, `-M${number}`);
}

function ensureUniqueProductCode(baseCode, row, usedCodes, index) {
  const resolved = resolveItem(row);
  const itemParts = codeParts(resolved.itemCode);
  const domain = itemParts?.domain || categoryDomain[row["카테고리"]] || "SY";
  const topic = itemParts?.topic || safeTopicFromGroup(row["제품군"], "GN");
  const clean = String(baseCode || "").trim();
  let candidate = /^SR26-[A-Z0-9]+-[A-Z0-9]+-P\d+$/.test(clean)
    ? clean
    : `SR26-${domain}-${topic}-P${9000 + index}`;

  if (!usedCodes.has(candidate)) {
    usedCodes.add(candidate);
    return candidate;
  }

  let suffix = 1;
  const stem = candidate.replace(/-P\d+$/, "");
  do {
    candidate = `${stem}-P${9000 + index + suffix}`;
    suffix += 1;
  } while (usedCodes.has(candidate));

  usedCodes.add(candidate);
  return candidate;
}

function textForClassify(row) {
  return [
    row["제품명"],
    row["브랜드"],
    row["제품군"],
    row["카테고리"],
    row["추천 대상"],
    row["추천 이유 한 줄"],
    row["태그"],
    row["트렌드 근거"],
  ].join(" ").toLowerCase();
}

function productTextForClassify(product) {
  return [
    product.productName,
    product.brand,
  ].join(" ").toLowerCase();
}

function makeupSlotFromText(text) {
  if (/브러쉬|브러시|퍼프|스펀지|도구|tool|brush|sponge|puff/i.test(text)) return { id: "classificationReview", label: "분류 검수 필요" };
  if (/세팅\s*스프레이|픽서|fix|mist\s*&\s*fix|미스트\s*앤\s*픽스|setting\s*spray/i.test(text)) return { id: "settingSpray", label: "세팅 스프레이" };
  if (/트릭\s*스틱|듀얼\s*트릭|스틱|부분\s*커버|spot|stick/i.test(text)) return { id: "coverStick", label: "부분 커버 스틱" };
  if (/컨실러|concealer|커버\s*퍼펙션\s*팁|롱래스팅\s*팁|radiant\s*creamy/i.test(text)) return { id: "concealer", label: "컨실러" };
  if (/쿠션|파운데이션|foundation|블루\s*파운데이션|cover\s*cushion|벨벳\s*커버\s*쿠션/i.test(text)) return { id: "cushionFoundation", label: "쿠션 / 파운데이션" };
  if (/세범|sebum|파우더\s*팩트|블러\s*파우더|powder\s*pact/i.test(text)) return { id: "sebumPowder", label: "세범 파우더" };
  if (/프라이머|피니셔|피니쉬|오일\s*컨트롤|primer|finisher|finish/i.test(text)) return { id: "primerFinisher", label: "프라이머 / 피니셔" };
  if (/비비|bb\s*크림|bbcream|퍼펙트\s*커버\s*비비|피부\s*표현/i.test(text)) return { id: "skinExpression", label: "피부 표현 보정" };
  if (/톤\s*보정|톤업|톤\s*업|톤\s*로션|트루\s*톤|true\s*tone|커버\s*로션|올인원/i.test(text)) return { id: "toneLotion", label: "톤 보정 로션" };
  return { id: "classificationReview", label: "분류 검수 필요" };
}

function productSlotsForRow(row) {
  return slotPresetsByProductGroup[row["제품군"]] || fallbackSlotPresets;
}

function slotForRow(row) {
  const group = row["제품군"] || "";
  const text = textForClassify(row);
  const brand = row["브랜드"] || "";
  const fit = Number(row["세르칸핏"] || 0);

  if (group === "선케어") {
    if (/랑콤|시세이도|키엘|프리미엄|la mer|sk-ii/i.test(text)) return { id: "premium", label: "프리미엄" };
    if (/닥터지|시카|센텔라|마데카|어성초|마일드|무기자차|민감|진정|아토|레이저/i.test(text)) return { id: "sensitive", label: "민감/입문" };
    if (/워터|수분|히알루|촉촉|선젤|선세럼|birch|자작나무/i.test(text)) return { id: "dry", label: "건성" };
    if (/피지|오일|보송|매트|파우더|포어/i.test(text)) return { id: "oily", label: "지성" };
    return { id: "budget", label: "가성비" };
  }

  if (group === "클렌징") {
    if (/오일|cleansing oil|클렌징오일/i.test(text)) return { id: "cleansingOil", label: "클렌징 오일" };
    if (/약산성|low ph|민감|세이프|릴리프/i.test(text)) return { id: "lowPh", label: "약산성/민감" };
    if (/수분|모이스처|크림|보습/i.test(text)) return { id: "moisturizing", label: "보습 세안" };
    return { id: "cleansingFoam", label: "클렌징 폼" };
  }

  if (group === "장벽케어") {
    if (/패드|토너/i.test(text)) return { id: "tonerPad", label: "패드/토너" };
    if (/시카|마데카|흔적|cica|centella|센텔라/i.test(text)) return { id: "cica", label: "시카/흔적" };
    if (/크림|아토|장벽|barrier|밤|balm/i.test(text)) return { id: "barrierCream", label: "장벽 크림" };
    if (/히알루|수분|토리든|앰플|세럼/i.test(text)) return { id: "hydration", label: "수분 보충" };
    return { id: "soothing", label: "진정" };
  }

  if (group === "홈케어") {
    if (/모공|블랙헤드|포어|pore|clay|클레이/i.test(text)) return { id: "pore", label: "모공/블랙헤드" };
    if (/패드|마스크|팩|mask/i.test(text)) return { id: "maskPad", label: "마스크/패드" };
    if (/결|texture|부스터|디바이스/i.test(text)) return { id: "skinTexture", label: "피부결" };
    return { id: "premium", label: "프리미엄" };
  }

  if (group === "홈케어디바이스") {
    if (/led|엘이디|마스크/i.test(text)) return { id: "led", label: "LED/탄력" };
    if (/클렌징|세안/i.test(text)) return { id: "cleansingDevice", label: "클렌징 디바이스" };
    if (/부스터|booster|에이지알|age-r/i.test(text)) return { id: "booster", label: "부스터/흡수" };
    return { id: "premiumDevice", label: "프리미엄 디바이스" };
  }

  if (group === "슬로우에이징") {
    if (/비타민|vitamin|ascorbyl|glucoside|c\d/i.test(text)) return { id: "vitaminC", label: "비타민C/톤" };
    if (/레티놀|retinol|레티날|retinal/i.test(text)) return { id: "retinol", label: "레티놀" };
    if (/탄력|collagen|콜라겐|elastic/i.test(text)) return { id: "elasticity", label: "탄력" };
    if (/결|모공|pore|texture/i.test(text)) return { id: "skinTexture", label: "피부결" };
    return { id: "premium", label: "프리미엄" };
  }

  if (group === "메이크업") {
    return makeupSlotFromText([row["제품명"], row["브랜드"]].join(" ").toLowerCase());
  }

  if (group === "두피케어") {
    if (/프리미엄|케라스타즈|kerastase/i.test(text)) return { id: "premium", label: "프리미엄" };
    if (/열감|쿨|쿨링|스케일러|스케일링|씨솔트|각질/i.test(text)) return { id: "cooling", label: "두피 열감" };
    if (/볼륨|정수리|탈모|폴리젠|강화|앰플|세럼/i.test(text)) return { id: "volume", label: "정수리 볼륨" };
    if (/샴푸|shampoo/i.test(text)) return { id: "daily", label: "데일리/집중관리" };
    return { id: "budget", label: "가성비" };
  }

  if (group === "바디케어") {
    if (/데오|deodorant|안티퍼스|perspirex|old spice|땀|체취/i.test(text)) return { id: "deodorant", label: "데오/체취" };
    if (/로션|크림|밤|balm|hand|핸드|보습|세라마이드|우레아|아토덤|세타필/i.test(text)) return { id: "moisturizing", label: "보습/로션" };
    if (/향|라벤더|논픽션|젠틀|scent/i.test(text)) return { id: "scent", label: "향 중심" };
    if (/민감|약산성|아토|세라마이드/i.test(text)) return { id: "sensitive", label: "민감성" };
    if (/워시|솝|soap|스킨워시|바디워시/i.test(text)) return { id: "bodyWash", label: "바디워시" };
    return { id: "cleansing", label: "세정력 중심" };
  }

  if (group === "운동회복") {
    if (/아이스|냉|cold|ice|쿨/i.test(text)) return { id: "coldPack", label: "냉찜질" };
    if (/스트레칭|stretch|폼롤러|roller/i.test(text)) return { id: "stretch", label: "스트레칭" };
    if (/테라건|마사지기|풀리오|device|디바이스/i.test(text)) return { id: "device", label: "회복 디바이스" };
    return { id: "massage", label: "마사지/이완" };
  }

  if (group === "체모·면도") {
    if (/젤|폼|쉐이빙|shaving foam|shaving gel/i.test(text)) return { id: "shavingGel", label: "쉐이빙젤/폼" };
    if (/애프터|after|밤|balm|진정/i.test(text)) return { id: "aftershave", label: "애프터쉐이브" };
    if (/바디|body|그루머|trimmer|트리머/i.test(text)) return { id: "bodyGroomer", label: "바디그루밍" };
    return { id: "razor", label: "면도기" };
  }

  if (group === "영양제") {
    if (/오메가|omega|dha|epa/i.test(text)) return { id: "omega", label: "오메가/지방산" };
    if (/단백|protein|프로틴/i.test(text)) return { id: "protein", label: "단백질" };
    if (/전해질|electrolyte|수분|hydration/i.test(text)) return { id: "electrolyte", label: "전해질/수분" };
    if (/수면|락티움|sleep|멜라토닌/i.test(text)) return { id: "sleep", label: "수면 보조" };
    return fit >= 5 ? { id: "premium", label: "프리미엄" } : { id: "multivitamin", label: "멀티비타민" };
  }

  if (group === "향수") {
    if (/헤어미스트|hair mist/i.test(text)) return { id: "hairMist", label: "헤어미스트" };
    if (/밤|balm|solid|고체/i.test(text)) return { id: "solid", label: "고체/밤" };
    if (/우디|머스크|woody|musk|가이악/i.test(text)) return { id: "woody", label: "우디/머스크" };
    if (/비누|솝|clean|클린|dirty|더티/i.test(text)) return { id: "clean", label: "클린/비누향" };
    return fit >= 5 ? { id: "premium", label: "프리미엄" } : { id: "daily", label: "데일리" };
  }

  if (group === "의류관리") {
    if (/스팀|주름|steamer/i.test(text)) return { id: "steamer", label: "스팀/주름" };
    if (/보풀|먼지|lint/i.test(text)) return { id: "lint", label: "먼지/보풀" };
    if (/세탁|laundry|망/i.test(text)) return { id: "laundry", label: "세탁/섬유" };
    if (/향|탈취|스프레이/i.test(text)) return { id: "scent", label: "향/탈취" };
    return { id: "storage", label: "보관/수납" };
  }

  if (group === "헤어스타일링") {
    if (/왁스|포마드|wax|pomade/i.test(text)) return { id: "waxPomade", label: "왁스/포마드" };
    if (/세럼|오일|serum|oil/i.test(text)) return { id: "serumOil", label: "세럼/오일" };
    if (/스프레이|spray/i.test(text)) return { id: "spray", label: "스프레이" };
    if (/드라이|dryer|빗|브러시/i.test(text)) return { id: "dryerTool", label: "드라이 도구" };
    return { id: "volume", label: "볼륨" };
  }

  if (group === "헤어케어") {
    if (/트리트먼트|팩|treatment|mask/i.test(text)) return { id: "treatment", label: "트리트먼트" };
    if (/두피|scalp/i.test(text)) return { id: "scalp", label: "두피" };
    if (/손상|damage|딥 데미지/i.test(text)) return { id: "damage", label: "손상모" };
    return { id: "shampoo", label: "샴푸" };
  }

  if (group === "립케어") {
    if (/틴트|발색|tinted|컬러/i.test(text)) return { id: "tinted", label: "발색" };
    if (/맨|men|남성/i.test(text)) return { id: "men", label: "남성 입문" };
    return fit >= 5 ? { id: "premium", label: "프리미엄" } : { id: "daily", label: "데일리" };
  }

  if (group === "수면관리") {
    if (/안대|mask|빛/i.test(text)) return { id: "sleepMask", label: "수면 안대" };
    if (/샷|락티움|멜라토닌|supplement|영양/i.test(text)) return { id: "sleepSupplement", label: "수면 보조" };
    return fit >= 5 ? { id: "premium", label: "프리미엄" } : { id: "relaxing", label: "릴렉싱" };
  }

  if (group === "가습기") {
    if (/대용량|스마트|smart|오브제|퓨리케어/i.test(text)) return { id: "smartLarge", label: "대용량/스마트" };
    if (/저소음|침실|sleep|bedroom/i.test(text)) return { id: "bedroom", label: "침실 저소음" };
    if (/습도계|hygrometer/i.test(text)) return { id: "hygrometer", label: "습도계" };
    return fit >= 5 ? { id: "premium", label: "프리미엄" } : { id: "budget", label: "가성비" };
  }

  return fit >= 5 ? { id: "premium", label: "프리미엄" } : { id: "daily", label: "입문/데일리" };
}

function splitTags(row) {
  const values = [
    row["카테고리"],
    row["제품군"],
    row["검수 상태"],
    row["이미지 상태"],
    ...(row["태그"] || "").split(/[,/]/),
  ];
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function copyForRow(row) {
  const group = row["제품군"] || "관리 제품";
  const trend = row["트렌드 근거"];
  const reason = row["추천 이유 한 줄"] || trend || `${group} 루틴에서 실제 제품 선택지를 넓히기 위한 후보입니다.`;
  const target = row["추천 대상"] || `${group} 관리가 필요하지만 어떤 제품을 먼저 볼지 기준이 필요한 사람`;

  return {
    recommendationReason: reason,
    target,
    actualUse: row["추천 이유 한 줄"]
      ? `실사용 기준은 향, 끈적임, 흡수감, 세정력, 휴대성처럼 루틴을 계속하게 만드는 감각을 우선 확인합니다. ${trend || ""}`.trim()
      : `${group} 제품은 스펙보다 실제 루틴에 넣었을 때 귀찮지 않은지가 중요합니다. 향, 질감, 사용 시간, 보관 편의성을 먼저 확인합니다.`,
    caution: row["공식 링크"]
      ? "가격, 재고, 성분, 피부 반응, 공식 판매처는 구매 전 다시 확인해야 합니다."
      : "공식 링크가 비어 있어 구매처 검수가 필요합니다. 제품명, 이미지, 브랜드가 맞는지 확인 전까지 추천 후보로만 봅니다.",
  };
}

function ensureItem(data, itemCode, row, generatedItems, generatedManuals) {
  let item = data.items.find((entry) => entry.code === itemCode);
  const parts = codeParts(itemCode);
  const domain = parts?.domain || categoryDomain[row["카테고리"]] || "SY";
  const topic = parts?.topic || safeTopicFromGroup(row["제품군"], "GN");
  const manualCode = manualCodeForItem(itemCode);

  if (!item) {
    item = {
      code: itemCode,
      name: itemNameFor(row, itemCode),
      category: `${domainCategory[domain] || row["카테고리"] || "시스템관리"} Item Encyclopedia`,
      domain,
      topic,
      role: `${itemNameFor(row, itemCode)} 제품과 추천 슬롯을 묶은 큐레이션 아이템 그룹`,
      manualCodes: [manualCode],
      productCodes: [],
      tags: splitTags(row),
      itemType: "product-curation",
      source: "notion_product_curation",
      generatedOnly: true,
      productSlots: [],
    };
    data.items.push(item);
    generatedItems.push(item.code);
  }

  item.productCodes = item.productCodes || [];
  item.manualCodes = item.manualCodes || [];
  if (!item.manualCodes.includes(manualCode)) item.manualCodes.push(manualCode);
  item.tags = [...new Set([...(item.tags || []), ...splitTags(row)])];
  item.productSlots = item.productSlots || item.recommendationSlots || [];
  const slotIds = new Set(item.productSlots.map((slot) => String(slot.id || slot.label || slot)));
  productSlotsForRow(row).forEach((slot) => {
    if (!slotIds.has(slot.id)) {
      item.productSlots.push(slot);
      slotIds.add(slot.id);
    }
  });

  if (!data.manuals.some((entry) => entry.code === manualCode)) {
    data.manuals.push({
      code: manualCode,
      routineCode: null,
      title: `${item.name} 추천 제품 관리 매뉴얼`,
      breadcrumb: `Product Curation / ${row["카테고리"] || domainCategory[domain] || "SERKAN"} / ${item.name}`,
      category: row["카테고리"] || domainCategory[domain] || "시스템관리",
      domain,
      topic,
      summary: `${item.name} 제품군을 SERKAN 루틴 안에서 검수하고 선택하기 위한 generated preview 매뉴얼입니다.`,
      blocks: [
        { label: "목적", text: `${item.name}은 제품 스펙보다 실제 루틴에서 반복 가능하게 쓰이는지가 중요합니다.`, items: [] },
        { label: "선택 기준", text: "", items: ["향, 끈적임, 자극, 보관 편의성부터 확인한다.", "공식 링크와 이미지가 비어 있는 후보는 검수 후 추천 슬롯에 올린다.", "제품 하나로 문제를 해결하려 하지 말고 루틴, 환경, 사용 빈도와 함께 본다."] },
        { label: "추천 아이템", text: "", items: [`${item.name} →`] },
        { label: "주의사항", text: "", items: ["검수 필요 상품은 구매 추천이 아니라 큐레이션 후보입니다.", "피부나 건강 반응은 개인차가 크므로 제품 상세와 성분을 확인합니다."] },
      ],
      tags: splitTags(row),
      source: "notion_product_curation",
      generatedOnly: true,
    });
    generatedManuals.push(manualCode);
  }

  return item;
}

function normalizeExistingProductSlots(data) {
  const makeupItemCode = productGroupItemMap["메이크업"].itemCode;
  const makeupItem = data.items.find((entry) => entry.code === makeupItemCode);
  let normalizedProducts = 0;

  if (makeupItem) {
    makeupItem.productSlots = slotPresetsByProductGroup["메이크업"].map((slot) => ({ ...slot }));
    makeupItem.productCodes = [
      ...new Set([
        ...(makeupItem.productCodes || []),
        ...data.products.filter((product) => product.itemCode === makeupItemCode).map((product) => product.code),
      ]),
    ];
  }

  data.products.forEach((product) => {
    if (product.itemCode !== makeupItemCode) return;
    const slot = makeupSlotFromText(productTextForClassify(product));
    if (product.slotId !== slot.id || product.recommendationType !== slot.label) {
      product.slotId = slot.id;
      product.recommendationType = slot.label;
      normalizedProducts += 1;
    }
  });

  return { normalizedProducts };
}

function run() {
  const data = readGeneratedData();
  const rows = parseCsv(fs.readFileSync(sourceCsvPath, "utf8"));
  const usedCodes = new Set(data.products.map((product) => product.code));
  const existingIdentities = new Set(data.products.map(productIdentity));
  const generatedItems = [];
  const generatedManuals = [];
  const importedProducts = [];
  const skippedDuplicates = [];
  const stagingRecords = [];

  rows.forEach((row, index) => {
    const identity = `${normalizeKey(row["브랜드"])}::${normalizeKey(row["제품명"])}`;
    const resolved = resolveItem(row);
    const item = ensureItem(data, resolved.itemCode, row, generatedItems, generatedManuals);
    const manualCode = manualCodeForItem(item.code);
    const slot = slotForRow(row);
    const copy = copyForRow(row);
    const code = ensureUniqueProductCode(row["SERKAN Code"], row, usedCodes, index + 1);
    const parts = codeParts(item.code);

    const stagingRecord = {
      sourceRow: index + 1,
      source: "notion_product_curation",
      originalCode: row["SERKAN Code"] || null,
      code,
      brand: row["브랜드"] || "브랜드 검수 필요",
      productName: row["제품명"],
      productImage: row["제품 사진"] || null,
      productLink: row["공식 링크"] || null,
      category: row["카테고리"] || null,
      productGroup: row["제품군"] || null,
      itemCode: item.code,
      manualCode,
      domain: parts?.domain || null,
      topic: parts?.topic || null,
      slotId: slot.id,
      recommendationType: slot.label,
      importStatus: existingIdentities.has(identity) ? "ALREADY_EXISTS" : "IMPORTED",
      risk: row["공식 링크"] ? "source-provided" : "missing-product-link",
      reason: resolved.reason,
    };
    stagingRecords.push(stagingRecord);

    if (existingIdentities.has(identity)) {
      skippedDuplicates.push(stagingRecord);
      return;
    }

    const product = {
      code,
      brand: row["브랜드"] || "브랜드 검수 필요",
      productName: row["제품명"],
      category: row["제품군"] || row["카테고리"] || "추천 제품",
      itemCode: item.code,
      manualCode,
      domain: parts?.domain || categoryDomain[row["카테고리"]] || "SY",
      topic: parts?.topic || safeTopicFromGroup(row["제품군"], "GN"),
      slotId: slot.id,
      recommendationType: slot.label,
      imageUrl: row["제품 사진"] || "",
      productLink: row["공식 링크"] || "",
      recommendationReason: copy.recommendationReason,
      target: copy.target,
      actualUse: copy.actualUse,
      caution: copy.caution,
      tags: splitTags(row),
      connectionStatus: row["공식 링크"] ? "ready" : "reviewNeeded",
      source: "notion_product_curation",
      sourceId: row["SERKAN Code"] || `curation-row-${index + 1}`,
      importStatus: "IMPORTED",
      reviewStatus: row["검수 상태"] || "검수 필요",
      serkanFit: row["세르칸핏"] || null,
      sponsorshipPotential: row["협찬 가능성"] || null,
      trendReason: row["트렌드 근거"] || null,
    };

    data.products.push(product);
    item.productCodes.push(product.code);
    existingIdentities.add(identity);
    importedProducts.push(product);
  });

  const normalization = normalizeExistingProductSlots(data);

  const summary = {
    sourceRows: rows.length,
    importedProducts: importedProducts.length,
    alreadyExisting: skippedDuplicates.length,
    generatedItems: generatedItems.length,
    generatedManuals: generatedManuals.length,
    normalizedProducts: normalization.normalizedProducts,
    missingLinks: stagingRecords.filter((record) => !record.productLink).length,
    missingImages: stagingRecords.filter((record) => !record.productImage).length,
    totalProductsAfter: data.products.length,
    realProductsAfter: data.products.filter((product) => product.brand && product.imageUrl && !String(product.productName || "").includes("Mock Product")).length,
  };

  fs.writeFileSync(generatedPath, `window.SERKAN_DATA = ${JSON.stringify(data, null, 2)};\n`);
  fs.writeFileSync(stagingPath, `${JSON.stringify({ meta: { createdAt: "2026-06-17", source: "data/product-curation-source.csv" }, summary, records: stagingRecords }, null, 2)}\n`);

  const report = [
    "# Product Curation Full Import Report",
    "",
    "Generated at: 2026-06-17",
    "",
    "## Summary",
    "",
    `- Source rows: ${summary.sourceRows}`,
    `- Newly imported products: ${summary.importedProducts}`,
    `- Already existing products kept: ${summary.alreadyExisting}`,
    `- Existing products normalized into purpose slots: ${summary.normalizedProducts}`,
    `- Generated-only items: ${summary.generatedItems}`,
    `- Generated-only manuals: ${summary.generatedManuals}`,
    `- Rows missing product link: ${summary.missingLinks}`,
    `- Rows missing product image: ${summary.missingImages}`,
    `- Total product records after import: ${summary.totalProductsAfter}`,
    `- Real products with image after import: ${summary.realProductsAfter}`,
    "",
    "## Generated Items",
    "",
    generatedItems.length ? generatedItems.map((code) => `- ${code}`).join("\n") : "- None",
    "",
    "## Import Notes",
    "",
    "- Original `app-data.js` was not modified.",
    "- Products already present in generated preview were not duplicated.",
    "- Rows without SERKAN Code were assigned generated preview product codes.",
    "- Rows without official links were imported with `reviewNeeded` connection status.",
    "- Review status fields are not used as Product Slots. Slots are assigned by product group and product usage context.",
  ].join("\n");
  fs.writeFileSync(reportPath, `${report}\n`);

  console.log(JSON.stringify(summary, null, 2));
}

run();
