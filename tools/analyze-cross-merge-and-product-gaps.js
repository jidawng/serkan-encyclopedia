const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const lifestyleCsvPath =
  "/Users/jidaewng/Desktop/일/개인 페이지 & 공유된 페이지/세르칸 라이프스타일/Serkan Lifestyle 35e43a1ad2c480d986b6e5bb035cadb9_all.csv";
const generatedPath = path.join(root, "app-data.generated.js");
const reportPath = path.join(root, "data", "cross-merge-product-gap-report.md");
const stagingPath = path.join(root, "data", "product-crawl-staging-candidates.json");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
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
      field = "";
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      continue;
    }
    field += char;
  }
  row.push(field);
  if (row.some((value) => value.trim() !== "")) rows.push(row);

  const headers = rows.shift() || [];
  return rows.map((values) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header.trim()] = (values[index] || "").trim();
    });
    return record;
  });
}

function readGeneratedData() {
  global.window = {};
  delete require.cache[require.resolve(generatedPath)];
  require(generatedPath);
  return global.window.SERKAN_DATA;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function isRealProduct(product) {
  const brand = product.brand || "";
  const name = product.productName || "";
  return (
    brand &&
    !/슬롯|placeholder|mock/i.test(brand) &&
    !/추천 슬롯|Mock Product|제품 연결 대기/i.test(name)
  );
}

function inferProductSearchQuery(item) {
  const name = item.name || item.title || item.code;
  const domainHints = {
    SK: "올리브영 피부관리",
    GR: "올리브영 남성 그루밍",
    BD: "올리브영 바디케어",
    FD: "올리브영 영양제",
    SL: "수면용품",
    ST: "남성 스타일 관리",
    SP: "생활용품",
    MT: "문구 생산성 도구",
    SY: "생산성 도구",
    SO: "관계 대화 도구",
  };
  return `${domainHints[item.domain] || "남성 자기관리 제품"} ${name} 추천`;
}

function groupCount(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || "unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function main() {
  const csvRows = parseCsv(fs.readFileSync(lifestyleCsvPath, "utf8").replace(/^\uFEFF/, ""));
  const data = readGeneratedData();

  const routines = data.routines || [];
  const manuals = data.manuals || [];
  const items = data.items || [];
  const products = data.products || [];
  const realProducts = products.filter(isRealProduct);

  const routineTitleSet = new Set(routines.map((routine) => normalizeText(routine.title)));
  const csvMissingInRoutines = csvRows.filter((row) => !routineTitleSet.has(normalizeText(row["구체 행동"])));

  const csvByFrequency = groupCount(csvRows.map((row) => ({ frequency: row["주기"] })), "frequency");
  const routineByBoard = groupCount(routines, "board");

  const productsByItem = new Map();
  for (const product of products) {
    if (!product.itemCode) continue;
    const list = productsByItem.get(product.itemCode) || [];
    list.push(product);
    productsByItem.set(product.itemCode, list);
  }

  const itemProductCoverage = items.map((item) => {
    const itemProducts = productsByItem.get(item.code) || [];
    const real = itemProducts.filter(isRealProduct);
    return {
      code: item.code,
      name: item.name || item.title || "",
      domain: item.domain,
      topic: item.topic,
      manualCount: (item.manualCodes || []).length,
      slotCount: itemProducts.length,
      realProductCount: real.length,
      searchQuery: inferProductSearchQuery(item),
    };
  });

  const itemsWithoutRealProducts = itemProductCoverage.filter((entry) => entry.realProductCount === 0);
  const itemsWithRealProducts = itemProductCoverage.filter((entry) => entry.realProductCount > 0);

  const manualWithoutRealProducts = manuals
    .map((manual) => {
      const linkedItems = items.filter((item) => (item.manualCodes || []).includes(manual.code));
      const realCount = linkedItems.reduce((sum, item) => {
        const itemProducts = productsByItem.get(item.code) || [];
        return sum + itemProducts.filter(isRealProduct).length;
      }, 0);
      return {
        code: manual.code,
        title: manual.title,
        domain: manual.domain,
        topic: manual.topic,
        linkedItemCount: linkedItems.length,
        realProductCount: realCount,
      };
    })
    .filter((entry) => entry.realProductCount === 0);

  const crawlStaging = {
    meta: {
      createdAt: new Date().toISOString(),
      purpose: "Product candidates needed for manuals/items without real products.",
      source: "Generated SERKAN data coverage analysis",
      note: "These are search/crawl candidates only. Do not merge without review.",
    },
    candidates: itemsWithoutRealProducts.map((item) => ({
      itemCode: item.code,
      itemName: item.name,
      domain: item.domain,
      topic: item.topic,
      currentManualCount: item.manualCount,
      currentSlotCount: item.slotCount,
      currentRealProductCount: item.realProductCount,
      searchQuery: item.searchQuery,
      importStatus: "NEEDS_PRODUCT_CRAWL",
      risk: "No verified Product DB row or image mapped to this item yet.",
    })),
  };

  fs.writeFileSync(stagingPath, `${JSON.stringify(crawlStaging, null, 2)}\n`);

  const lines = [];
  lines.push("# Cross-Merge / Product Gap Report");
  lines.push("");
  lines.push(`Generated at: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Lifestyle CSV rows: ${csvRows.length}`);
  lines.push(`- Generated routines: ${routines.length}`);
  lines.push(`- CSV actions not matched by exact routine title: ${csvMissingInRoutines.length}`);
  lines.push(`- Manuals: ${manuals.length}`);
  lines.push(`- Items: ${items.length}`);
  lines.push(`- Product records including slots/placeholders: ${products.length}`);
  lines.push(`- Real products with brand/image-style data: ${realProducts.length}`);
  lines.push(`- Items with at least 1 real product: ${itemsWithRealProducts.length}`);
  lines.push(`- Items with no real product: ${itemsWithoutRealProducts.length}`);
  lines.push(`- Manuals with no real product through linked items: ${manualWithoutRealProducts.length}`);
  lines.push("");
  lines.push("## CSV Frequency Distribution");
  lines.push("");
  lines.push("| Frequency | Count |");
  lines.push("| --- | ---: |");
  Object.entries(csvByFrequency)
    .sort((a, b) => b[1] - a[1])
    .forEach(([frequency, count]) => lines.push(`| ${frequency || "blank"} | ${count} |`));
  lines.push("");
  lines.push("## Generated Routine Board Distribution");
  lines.push("");
  lines.push("| Board | Count |");
  lines.push("| --- | ---: |");
  Object.entries(routineByBoard)
    .sort((a, b) => b[1] - a[1])
    .forEach(([board, count]) => lines.push(`| ${board || "blank"} | ${count} |`));
  lines.push("");
  lines.push("## CSV Rows Missing By Exact Title Match");
  lines.push("");
  lines.push("> Exact title matching is intentionally strict. Similar wording may already exist and needs manual review.");
  lines.push("");
  lines.push("| Category | Action | Frequency | Keyword | Difficulty | Priority |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  csvMissingInRoutines.slice(0, 80).forEach((row) => {
    lines.push(
      `| ${row["카테고리"] || ""} | ${row["구체 행동"] || ""} | ${row["주기"] || ""} | ${row["실천 키워드"] || ""} | ${row["난이도"] || ""} | ${row["중요도"] || ""} |`
    );
  });
  if (csvMissingInRoutines.length > 80) {
    lines.push(`| ... | ${csvMissingInRoutines.length - 80} more rows omitted in report preview |  |  |  |  |`);
  }
  lines.push("");
  lines.push("## Items Without Real Products");
  lines.push("");
  lines.push("| Item Code | Item | Domain | Topic | Manuals | Slots | Search Query |");
  lines.push("| --- | --- | --- | --- | ---: | ---: | --- |");
  itemsWithoutRealProducts.forEach((item) => {
    lines.push(
      `| ${item.code} | ${item.name} | ${item.domain || ""} | ${item.topic || ""} | ${item.manualCount} | ${item.slotCount} | ${item.searchQuery} |`
    );
  });
  lines.push("");
  lines.push("## Items With Real Products");
  lines.push("");
  lines.push("| Item Code | Item | Domain | Topic | Real Products |");
  lines.push("| --- | --- | --- | --- | ---: |");
  itemsWithRealProducts.forEach((item) => {
    lines.push(`| ${item.code} | ${item.name} | ${item.domain || ""} | ${item.topic || ""} | ${item.realProductCount} |`);
  });
  lines.push("");
  lines.push("## Manual Product Gaps");
  lines.push("");
  lines.push("| Manual Code | Manual | Domain | Topic | Linked Items | Real Products |");
  lines.push("| --- | --- | --- | --- | ---: | ---: |");
  manualWithoutRealProducts.slice(0, 120).forEach((manual) => {
    lines.push(
      `| ${manual.code} | ${manual.title} | ${manual.domain || ""} | ${manual.topic || ""} | ${manual.linkedItemCount} | ${manual.realProductCount} |`
    );
  });
  if (manualWithoutRealProducts.length > 120) {
    lines.push(`| ... | ${manualWithoutRealProducts.length - 120} more manuals omitted in report preview |  |  |  |  |`);
  }
  lines.push("");
  lines.push("## Next Import Rule");
  lines.push("");
  lines.push("- Product DB CSV/export is required for full import with no missing rows.");
  lines.push("- Items listed in `data/product-crawl-staging-candidates.json` can be filled by external crawl/search only after product DB rows are exhausted.");
  lines.push("- Generated preview should be updated before touching `app-data.js`.");
  lines.push("");

  fs.writeFileSync(reportPath, `${lines.join("\n")}\n`);

  console.log(
    JSON.stringify(
      {
        lifestyleCsvRows: csvRows.length,
        generatedRoutines: routines.length,
        csvMissingExactTitle: csvMissingInRoutines.length,
        realProducts: realProducts.length,
        itemsWithoutRealProducts: itemsWithoutRealProducts.length,
        manualWithoutRealProducts: manualWithoutRealProducts.length,
        reportPath,
        stagingPath,
      },
      null,
      2
    )
  );
}

main();
