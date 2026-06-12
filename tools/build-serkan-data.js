const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "app-data.js");
const outputPath = path.join(root, "app-data.generated.js");
const reportPath = path.join(root, "app-data.generated.report.json");

const DOMAIN_FALLBACKS = {
  SK: { name: "Skin", label: "피부 관리", tint: "#fff1f0", accent: "#e85d68", icon: "◒" },
  GR: { name: "Grooming", label: "그루밍 관리", tint: "#fff5e8", accent: "#e17a2f", icon: "✦" },
  BD: { name: "Body", label: "바디 & 건강 관리", tint: "#fff3dc", accent: "#d99622", icon: "▥" },
  FD: { name: "Food", label: "식단 & 영양 관리", tint: "#eef8ea", accent: "#59a05b", icon: "⋔" },
  SL: { name: "Sleep", label: "수면 관리", tint: "#edf7ff", accent: "#4d84cc", icon: "◐" },
  MT: { name: "Mental", label: "멘탈 관리", tint: "#f2efff", accent: "#8970d5", icon: "✺" },
  ST: { name: "Style", label: "스타일 관리", tint: "#f5efff", accent: "#8b62c7", icon: "▣" },
  SO: { name: "Relationship", label: "관계 관리", tint: "#fff0f5", accent: "#d96c8b", icon: "♡" },
  SP: { name: "Space", label: "공간 관리", tint: "#fff5e7", accent: "#c57b2a", icon: "⌂" },
  SY: { name: "System", label: "시스템 관리", tint: "#eef3fb", accent: "#5c7fb9", icon: "⚙" },
};

function loadSource(filePath) {
  const code = fs.readFileSync(filePath, "utf8");
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(code, context, { filename: filePath });
  if (!context.window.SERKAN_DATA) {
    throw new Error("window.SERKAN_DATA was not found in app-data.js");
  }
  return context.window.SERKAN_DATA;
}

function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function uniq(values) {
  return [...new Set(asArray(values))];
}

function domainFromCode(code) {
  const parts = String(code || "").split("-");
  return parts[1] || "SY";
}

function topicFromCode(code) {
  const parts = String(code || "").split("-");
  return parts[2] || "GEN";
}

function normalizeRoutine(routine, index) {
  const code = routine.code || `SR26-SY-GEN-R${index + 1}`;
  return {
    code,
    title: routine.title || routine.name || `Routine ${index + 1}`,
    board: routine.board || "daily",
    frequency: routine.frequency || (routine.board === "weekly" ? "Weekly" : "Daily"),
    weekday: uniq(routine.weekday || []),
    timeBlocks: uniq(routine.timeBlocks || []),
    priority: routine.priority || "권장",
    difficulty: routine.difficulty || "보통",
    manualCode: routine.manualCode || "",
    itemCode: routine.itemCode || "",
    sourceId: routine.sourceId || "",
    sourceType: routine.sourceType || "merged_source",
    sourceCount: Number(routine.sourceCount || 1),
    domain: routine.domain || domainFromCode(code),
    topic: routine.topic || topicFromCode(code),
    category: routine.category || "",
    tags: uniq(routine.tags || []),
  };
}

function normalizeManual(manual, index) {
  const code = manual.code || `SR26-SY-GEN-M${index + 1}`;
  return {
    code,
    routineCode: manual.routineCode || "",
    title: manual.title || `Manual ${index + 1}`,
    breadcrumb: manual.breadcrumb || "",
    category: manual.category || "",
    domain: manual.domain || domainFromCode(code),
    topic: manual.topic || topicFromCode(code),
    summary: manual.summary || "",
    blocks: asArray(manual.blocks).map((block) => ({
      label: block.label || "본문",
      text: block.text || "",
      items: uniq(block.items || []),
    })),
    sourceCount: Number(manual.sourceCount || 1),
    sourceIds: uniq(manual.sourceIds || []),
    tags: uniq(manual.tags || []),
  };
}

function normalizeItem(item, index) {
  const code = item.code || `SR26-SY-GEN-C${index + 1}`;
  return {
    code,
    name: item.name || `Item ${index + 1}`,
    category: item.category || "Item Encyclopedia",
    domain: item.domain || domainFromCode(code),
    topic: item.topic || topicFromCode(code),
    role: item.role || "",
    manualCodes: uniq(item.manualCodes || []),
    productCodes: uniq(item.productCodes || []),
    tags: uniq(item.tags || []),
  };
}

function normalizeProduct(product, index) {
  const code = product.code || `SR26-SY-GEN-P${index + 1}`;
  return {
    code,
    brand: product.brand || "브랜드 검수 필요",
    productName: product.productName || product.name || `제품 후보 ${index + 1}`,
    category: product.category || "Product",
    itemCode: product.itemCode || "",
    domain: product.domain || domainFromCode(code),
    recommendationType: product.recommendationType || "추천 후보",
    imageUrl: product.imageUrl || "",
    productLink: product.productLink || "#",
    recommendationReason: product.recommendationReason || "",
    target: product.target || "",
    caution: product.caution || "",
    tags: uniq(product.tags || []),
  };
}

function normalizeSituation(situation, index) {
  const code = situation.code || `SR26-MT-GEN-C${index + 1}`;
  return {
    code,
    title: situation.title || `Situation ${index + 1}`,
    type: situation.type || (domainFromCode(code) === "SO" ? "Social Management" : "Mental Management"),
    manualCode: situation.manualCode || "",
    domain: situation.domain || domainFromCode(code),
    topic: situation.topic || topicFromCode(code),
    priority: situation.priority || "권장",
    sourceCount: Number(situation.sourceCount || 1),
    tags: uniq(situation.tags || []),
  };
}

function addLink(map, from, to, type, label) {
  if (!from || !to) return;
  map.push({ from, to, type, label });
}

function buildData(source) {
  const routines = asArray(source.routines).map(normalizeRoutine);
  const manuals = asArray(source.manuals).map(normalizeManual);
  const items = asArray(source.items).map(normalizeItem);
  const products = asArray(source.products).map(normalizeProduct);
  const situations = asArray(source.situations).map(normalizeSituation);

  const routineByCode = new Map(routines.map((entry) => [entry.code, entry]));
  const manualByCode = new Map(manuals.map((entry) => [entry.code, entry]));
  const itemByCode = new Map(items.map((entry) => [entry.code, entry]));
  const productByCode = new Map(products.map((entry) => [entry.code, entry]));

  for (const routine of routines) {
    const manual = manualByCode.get(routine.manualCode);
    if (manual && !manual.routineCode) manual.routineCode = routine.code;
  }

  for (const manual of manuals) {
    if (!manual.routineCode) {
      const routine = routines.find((entry) => entry.manualCode === manual.code);
      if (routine) manual.routineCode = routine.code;
    }
  }

  for (const item of items) {
    item.manualCodes = uniq(item.manualCodes.filter((code) => manualByCode.has(code)));
    item.productCodes = uniq([
      ...item.productCodes.filter((code) => productByCode.has(code)),
      ...products.filter((product) => product.itemCode === item.code).map((product) => product.code),
    ]);
  }

  for (const product of products) {
    if (!product.itemCode || !itemByCode.has(product.itemCode)) {
      const inferred = items.find((item) => item.productCodes.includes(product.code));
      if (inferred) product.itemCode = inferred.code;
    }
  }

  const linkMap = [];
  for (const routine of routines) {
    addLink(linkMap, routine.code, routine.manualCode, "routine_to_manual", "상세 매뉴얼 보기 →");
    addLink(linkMap, routine.code, routine.itemCode, "routine_to_item", "관련 아이템 보기 →");
  }
  for (const manual of manuals) {
    const relatedItems = items.filter((item) => item.manualCodes.includes(manual.code));
    for (const item of relatedItems) {
      addLink(linkMap, manual.code, item.code, "manual_to_item", "관련 아이템 보기 →");
    }
    const routine = routineByCode.get(manual.routineCode);
    if (routine) addLink(linkMap, manual.code, routine.code, "manual_to_routine", "연결 루틴 보기 →");
  }
  for (const item of items) {
    for (const productCode of item.productCodes) {
      addLink(linkMap, item.code, productCode, "item_to_product", "제품 후보 보기 →");
    }
    for (const manualCode of item.manualCodes) {
      addLink(linkMap, item.code, manualCode, "item_to_manual", "관련 매뉴얼 보기 →");
    }
  }
  for (const product of products) {
    addLink(linkMap, product.code, product.itemCode, "product_to_item", "관련 아이템 보기 →");
  }
  for (const situation of situations) {
    addLink(linkMap, situation.code, situation.manualCode, "situation_to_manual", "상황 상세 매뉴얼 보기 →");
  }

  const categories = Object.entries(DOMAIN_FALLBACKS).map(([code, fallback]) => {
    const original = asArray(source.categories).find((category) => category.code === code) || {};
    return {
      code,
      name: original.name || fallback.name,
      label: original.label || fallback.label,
      tint: original.tint || fallback.tint,
      accent: original.accent || fallback.accent,
      icon: original.icon || fallback.icon,
      manualCount: manuals.filter((entry) => entry.domain === code).length,
      itemCount: items.filter((entry) => entry.domain === code).length,
      productCount: products.filter((entry) => entry.domain === code).length,
      routineCount: routines.filter((entry) => entry.domain === code).length,
      situationCount: situations.filter((entry) => entry.domain === code).length,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    source: {
      project: "SERKAN Lifestyle Encyclopedia / Routine Board",
      mode: "HTML prototype data ledger",
      sourceFiles: ["남자 관리 모음집", "세르칸 라이프스타일 DB", "추천 제품 큐레이션", "SERKAN CODE"],
      previousFigmaFile: "백과사전용 / dHXIFXgjXtGwPWUWNADe9H",
      target: "serkan-dashboard-prototype",
      note: "Generated from existing local app-data.js and normalized for HTML insertion.",
    },
    routines,
    manuals,
    items,
    products,
    situations,
    categories,
    linkMap,
  };
}

function audit(data) {
  const manualCodes = new Set(data.manuals.map((entry) => entry.code));
  const routineCodes = new Set(data.routines.map((entry) => entry.code));
  const itemCodes = new Set(data.items.map((entry) => entry.code));
  const productCodes = new Set(data.products.map((entry) => entry.code));
  const situationCodes = new Set(data.situations.map((entry) => entry.code));
  const allCodes = new Set([...manualCodes, ...routineCodes, ...itemCodes, ...productCodes, ...situationCodes]);

  const duplicateProducts = Object.entries(
    data.products.reduce((acc, product) => {
      const key = `${product.brand} / ${product.productName}`.toLowerCase();
      acc[key] = acc[key] || [];
      acc[key].push(product.code);
      return acc;
    }, {})
  ).filter(([, codes]) => codes.length > 1);

  const report = {
    counts: {
      routines: data.routines.length,
      manuals: data.manuals.length,
      items: data.items.length,
      products: data.products.length,
      situations: data.situations.length,
      categories: data.categories.length,
      linkMap: data.linkMap.length,
    },
    missing: {
      routineManual: data.routines.filter((entry) => entry.manualCode && !manualCodes.has(entry.manualCode)).map((entry) => [entry.code, entry.manualCode]),
      manualRoutine: data.manuals.filter((entry) => entry.routineCode && !routineCodes.has(entry.routineCode)).map((entry) => [entry.code, entry.routineCode]),
      itemManuals: data.items.flatMap((item) => item.manualCodes.filter((code) => !manualCodes.has(code)).map((code) => [item.code, code])),
      itemProducts: data.items.flatMap((item) => item.productCodes.filter((code) => !productCodes.has(code)).map((code) => [item.code, code])),
      productItem: data.products.filter((entry) => entry.itemCode && !itemCodes.has(entry.itemCode)).map((entry) => [entry.code, entry.itemCode]),
      situationManual: data.situations.filter((entry) => entry.manualCode && !manualCodes.has(entry.manualCode)).map((entry) => [entry.code, entry.manualCode]),
      linkDestinations: data.linkMap.filter((link) => !allCodes.has(link.to)).map((link) => [link.from, link.to, link.type]),
    },
    quality: {
      productsWithoutImage: data.products.filter((entry) => !entry.imageUrl).length,
      productsWithoutExternalLink: data.products.filter((entry) => !entry.productLink || entry.productLink === "#").length,
      placeholderProducts: data.products.filter((entry) => /placeholder|검수|추천 제품|추천 후보|가성비 추천 제품/i.test(`${entry.brand} ${entry.productName} ${entry.recommendationType}`)).length,
      duplicateProducts: duplicateProducts.slice(0, 100),
    },
  };

  return report;
}

const source = loadSource(sourcePath);
const data = buildData(source);
const report = audit(data);

fs.writeFileSync(outputPath, `window.SERKAN_DATA = ${JSON.stringify(data, null, 2)};\n`);
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(JSON.stringify({ outputPath, reportPath, counts: report.counts, quality: report.quality }, null, 2));
