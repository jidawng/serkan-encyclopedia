(function () {
  const data = window.SERKAN_DATA;
  const state = {
    view: "dashboard",
    query: "",
    history: [],
    selected: null,
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const byCode = {
    routines: new Map(data.routines.map((item) => [item.code, item])),
    manuals: new Map(data.manuals.map((item) => [item.code, item])),
    items: new Map(data.items.map((item) => [item.code, item])),
    products: new Map(data.products.map((item) => [item.code, item])),
    categories: new Map(data.categories.map((item) => [item.code, item])),
    situations: new Map(data.situations.map((item) => [item.code, item])),
  };

  const viewMeta = {
    dashboard: {
      title: "SR26 / Routine System Dashboard",
      subtitle: "Daily Routine Overview와 Weekly Routine Overview를 한눈에 보고, 관련 매뉴얼과 아이템/제품 백과로 연결합니다.",
    },
    manuals: {
      title: "SR26-SY / Routine Detail Manuals",
      subtitle: "모든 루틴의 상세 매뉴얼을 카테고리별로 탐색하고 관리하세요.",
    },
    products: {
      title: "SR26-PD / Product & Item Encyclopedia",
      subtitle: "아이템과 제품을 카테고리별로 탐색하고 비교할 수 있습니다.",
    },
    situations: {
      title: "SR26-MT-SO / Situation Dashboard",
      subtitle: "상황별 대응 루틴과 추천 매뉴얼을 함께 확인합니다.",
    },
    search: {
      title: "Search Results",
      subtitle: "루틴, 매뉴얼, 아이템, 제품, 카테고리, SERKAN CODE, 태그를 통합 검색합니다.",
    },
  };

  const categoryVisual = {
    SK: { icon: "💧", desc: "클렌징, 보습, 자외선 차단, 트러블 관리 등 피부 컨디션을 유지하기 위한 매뉴얼" },
    GR: { icon: "🪒", desc: "면도, 체취, 구강, 손톱, 눈썹 등 인상을 정리하는 그루밍 매뉴얼" },
    BD: { icon: "🏋️", desc: "운동, 자세, 체형, 바디 케어 등 몸의 컨디션을 끌어올리는 매뉴얼" },
    FD: { icon: "🥗", desc: "영양제, 단백질, 수분, 식단 밸런스를 반복 가능한 기준으로 정리" },
    SL: { icon: "🌙", desc: "수면 습관, 수면 환경, 침구 위생, 회복 루틴을 위한 매뉴얼" },
    MT: { icon: "🧠", desc: "감정 기록, 집중 회복, 불안 완화, 루틴 재시작을 위한 매뉴얼" },
    ST: { icon: "👕", desc: "헤어, 향, 의류 관리, 스타일 일관성을 만드는 매뉴얼" },
    SO: { icon: "❤️", desc: "대화, 관계 유지, 사과, 감사, 갈등 관리를 위한 매뉴얼" },
    SP: { icon: "🏠", desc: "청소, 정리, 환기, 향기, 작업 공간을 관리하는 매뉴얼" },
    SY: { icon: "⚙️", desc: "루틴 설계, 시간 관리, 기록, 생산성 도구를 다루는 매뉴얼" },
  };

  const groupIcons = [
    ["기상", "🌤️"],
    ["아침", "🌤️"],
    ["업무", "🧠"],
    ["집중", "🧠"],
    ["점심", "🍽️"],
    ["운동", "🏋️"],
    ["오후", "⚡"],
    ["저녁", "🌙"],
    ["수면", "🛏️"],
    ["Skin", "💧"],
    ["Grooming", "🪒"],
    ["Body", "🏋️"],
    ["Food", "🥗"],
    ["Sleep", "🌙"],
    ["Mental", "🧠"],
    ["Relationship", "❤️"],
    ["Space", "🏠"],
    ["System", "⚙️"],
  ];

  const situationIcons = [
    ["회복", "🔄"],
    ["기록", "📝"],
    ["불안", "😮‍💨"],
    ["초조", "😮‍💨"],
    ["집중", "🧠"],
    ["자존감", "🪞"],
    ["무기력", "🪫"],
    ["첫인상", "✨"],
    ["관계", "🤝"],
    ["커뮤니케이션", "💬"],
    ["갈등", "🛡️"],
    ["거절", "🛡️"],
  ];

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function uniq(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function getManualForRoutine(routine) {
    return byCode.manuals.get(routine.manualCode) || data.manuals.find((manual) => manual.routineCode === routine.code);
  }

  function getItemsForManual(manualCode) {
    if (!manualCode) return [];
    return data.items.filter((item) => item.manualCodes.includes(manualCode));
  }

  function getProductsForItem(itemCode) {
    if (!itemCode) return [];
    return data.products.filter((product) => product.itemCode === itemCode && !isMockProduct(product));
  }

  function getProductsForManual(manualCode) {
    return getItemsForManual(manualCode).flatMap((item) => getProductsForItem(item.code));
  }

  function getRelatedRoutineForProduct(product) {
    if (isMockProduct(product)) return null;
    const item = byCode.items.get(product.itemCode);
    if (!item) return null;
    const manualCode = item.manualCodes[0];
    const manual = byCode.manuals.get(manualCode);
    if (!manual) return null;
    return byCode.routines.get(manual.routineCode) || null;
  }

  function isMockProduct(product) {
    if (!product) return true;
    const text = [product.brand, product.productName, product.imageUrl, product.productLink, product.connectionStatus].join(" ");
    return product.connectionStatus === "mock"
      || (!product.imageUrl && (!product.productLink || product.productLink === "#"))
      || /가성비 추천 제품|민감\/입문 추천 제품|프리미엄 추천 제품|placeholder/i.test(text);
  }

  function searchableText(entity) {
    return [
      entity.code,
      entity.title,
      entity.name,
      entity.productName,
      entity.category,
      entity.domain,
      entity.topic,
      entity.frequency,
      entity.priority,
      entity.recommendationType,
      entity.brand,
      entity.target,
      entity.caution,
      ...(entity.weekday || []),
      ...(entity.timeBlocks || []),
      ...(entity.manualCodes || []),
      ...(entity.productCodes || []),
    ].join(" ").toLowerCase();
  }

  function setView(view, options = {}) {
    if (!viewMeta[view]) return;
    if (!options.skipHistory) state.history.push({ view: state.view, query: state.query, selected: state.selected });
    state.view = view;
    state.selected = null;
    if (view !== "search" && !options.keepQuery) state.query = "";
    render();
  }

  function openDetail(type, code) {
    state.history.push({ view: state.view, query: state.query, selected: state.selected });
    state.selected = { type, code };
    renderDrawer();
  }

  function goBack() {
    const prev = state.history.pop();
    if (!prev) {
      closeDrawer();
      return;
    }
    state.view = prev.view;
    state.query = prev.query;
    state.selected = prev.selected;
    render();
  }

  function closeDrawer() {
    state.selected = null;
    renderDrawer();
  }

  function statCards() {
    const daily = data.routines.filter((routine) => routine.board === "daily").length;
    const weekly = data.routines.filter((routine) => routine.board === "weekly").length;
    return `
      <div class="stats">
        <button class="stat stat-button" data-view="manuals"><span>📘 전체 매뉴얼</span><strong>${data.manuals.length}개</strong></button>
        <button class="stat stat-button" data-view="products"><span>🧴 관련 아이템</span><strong>${data.items.length}개</strong></button>
        <button class="stat stat-button" data-view="products"><span>🛍️ 관련 제품</span><strong>${data.products.length}개</strong></button>
        <button class="stat stat-button" data-view="dashboard"><span>☀️ 루틴 보드</span><strong>${daily + weekly}개</strong></button>
      </div>
    `;
  }

  function renderHero() {
    const meta = viewMeta[state.view] || viewMeta.dashboard;
    const back = state.history.length ? `<button class="back-btn" data-action="back">← 이전으로</button>` : "";
    return `
      <section class="hero-row">
        <div>
          <div class="hero-title-line">
            ${back}
            <h1>${esc(meta.title)}</h1>
          </div>
          <div class="eyebrow">${esc(meta.subtitle)}</div>
        </div>
        ${statCards()}
      </section>
    `;
  }

  function renderRoutineBoard(kind) {
    const isWeekly = kind === "weekly";
    const routines = data.routines.filter((routine) => routine.board === kind);
    const groups = new Map();
    routines.forEach((routine) => {
      const label = isWeekly
        ? categoryName(routine.domain)
        : routine.timeBlocks[0] && routine.timeBlocks[0] !== "불명확" ? routine.timeBlocks[0] : categoryName(routine.domain);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(routine);
    });

    return `
      <article class="board ${isWeekly ? "weekly-board" : "daily-board"}">
        <div class="board-head">
          <div class="board-title">
            <div class="orb ${isWeekly ? "weekly" : ""}">${isWeekly ? "📅" : "☀️"}</div>
            <div>
              <h2>${isWeekly ? "Weekly Routine Overview" : "Daily Routine Overview"}</h2>
              <p>${isWeekly ? "일주일 단위로 실행하는 관리 루틴을 정리했습니다." : "하루 단위를 관리하는 핵심 루틴을 시간 흐름에 따라 정리했습니다."}</p>
            </div>
          </div>
          <span class="count ${isWeekly ? "weekly" : ""}">총 ${routines.length}개 루틴</span>
        </div>
        ${Array.from(groups.entries()).slice(0, 5).map(([group, groupRoutines]) => renderRoutineGroup(group, groupRoutines, isWeekly)).join("")}
        <button class="board-cta" data-view="manuals">전체 ${isWeekly ? "Weekly" : "Daily"} Routine 매뉴얼 보기 →</button>
      </article>
    `;
  }

  function renderRoutineGroup(group, routines, isWeekly) {
    const icon = iconForGroup(group);
    const pills = routines.slice(0, 5).map((routine) => `
      <button class="routine-chip clickable" data-open-type="routine" data-code="${esc(routine.code)}">
        <strong>${esc(routine.title)}</strong>
        <span>${esc(routine.code)}</span>
        <em>${esc(routine.frequency || routine.priority)} · ${esc(routine.timeBlocks?.[0] || categoryName(routine.domain))}</em>
      </button>
    `).join("");
    return `
      <div class="routine-group ${isWeekly ? "weekly" : ""}">
        <div class="group-head"><span class="group-emoji">${esc(icon)}</span>${esc(group)} <small>${routines.length}개 연결</small></div>
        <div class="routine-strip">
          ${pills}
          <button class="more-card" data-action="show-group" data-group="${esc(group)}" data-kind="${isWeekly ? "weekly" : "daily"}"><span>전체</span>→</button>
        </div>
      </div>
    `;
  }

  function iconForGroup(group) {
    return groupIcons.find(([keyword]) => group.includes(keyword))?.[1] || "◇";
  }

  function iconForSituation(title) {
    return situationIcons.find(([keyword]) => title.includes(keyword))?.[1] || "🚨";
  }

  function categoryName(domain) {
    return byCode.categories.get(domain)?.name || domain || "System";
  }

  function categoryLabel(domain) {
    return byCode.categories.get(domain)?.label || categoryName(domain);
  }

  function renderDashboard() {
    return `
      ${renderHero()}
      <section class="overview">
        ${renderRoutineBoard("daily")}
        ${renderRoutineBoard("weekly")}
      </section>
      ${renderManuals({ compact: true })}
      ${renderProducts({ compact: true })}
      ${renderSituations({ compact: true })}
      ${renderQuickAccess()}
    `;
  }

  function renderManuals({ compact = false } = {}) {
    const categories = data.categories.filter((cat) => cat.manualCount > 0);
    return `
      <section class="section-card" id="manuals">
        <div class="section-head">
          <div>
            <h2>SR26-SY / Routine Detail Manuals</h2>
            <div class="eyebrow">카테고리 카드를 누르면 관련 매뉴얼 목록과 연결 아이템을 확인합니다.</div>
          </div>
          <div class="segmented">
            <button class="active" data-view="manuals">전체</button>
            <button data-view="dashboard">Routine</button>
            <button data-view="products">Item/Product</button>
          </div>
        </div>
        <div class="manual-grid">
          ${categories.slice(0, compact ? 8 : categories.length).map(renderManualCategoryCard).join("")}
        </div>
      </section>
    `;
  }

  function renderManualCategoryCard(category) {
    const manuals = data.manuals.filter((manual) => manual.domain === category.code).slice(0, 4);
    const visual = categoryVisual[category.code] || { icon: category.icon, desc: `${category.label} 매뉴얼` };
    return `
      <button class="category-card clickable" style="--tint:${category.tint};--accent:${category.accent};" data-open-type="category" data-code="${esc(category.code)}">
        <div class="category-top"><div class="cat-icon">${esc(visual.icon)}</div><div class="arrow">→</div></div>
        <h3>${esc(category.name)} <span>${esc(category.label)}</span></h3>
        <p>${esc(visual.desc)}</p>
        <div class="meta-line"><span>매뉴얼 ${category.manualCount}개</span><span>아이템 ${category.itemCount}개</span><span>제품 ${category.productCount}개</span></div>
        <div class="tag-row">${manuals.map((manual) => `<span class="tag">${esc(manual.title)}</span>`).join("")}</div>
      </button>
    `;
  }

  function renderProducts({ compact = false } = {}) {
    const categories = data.categories.filter((cat) => cat.itemCount || cat.productCount);
    return `
      <section class="section-card" id="products">
        <div class="section-head">
          <div>
            <h2>SR26-PD / Product &amp; Item Encyclopedia</h2>
            <div class="eyebrow">제품 카드는 SERKAN CODE를 기준으로 루틴, 매뉴얼, 아이템과 양방향 연결됩니다.</div>
          </div>
          <div class="segmented">
            <button class="active" data-view="products">제품</button>
            <button data-action="show-items">아이템</button>
            <button data-view="manuals">매뉴얼</button>
          </div>
        </div>
        <div class="product-grid">
          ${categories.slice(0, compact ? 8 : categories.length).map(renderProductHubCard).join("")}
        </div>
        <div class="item-grid ${compact ? "is-compact" : ""}">
          ${data.items.slice(0, compact ? 12 : data.items.length).map(renderItemCard).join("")}
        </div>
      </section>
    `;
  }

  function renderProductHubCard(category) {
    const visual = categoryVisual[category.code] || { icon: category.icon, desc: `${category.label} 아이템과 제품` };
    const items = data.items.filter((item) => item.domain === category.code).slice(0, 4);
    return `
      <button class="product-card product-hub-card clickable" style="--tint:${category.tint};--accent:${category.accent};" data-open-type="category" data-code="${esc(category.code)}">
        <div class="product-card-head">
          <div class="cat-icon">${esc(visual.icon)}</div>
          <span class="code-label">${esc(category.code)} Hub</span>
        </div>
        <h3>${esc(category.name)}</h3>
        <p>${esc(productHubCopy(category.code))}</p>
        <div class="product-objects placeholder-objects" aria-label="${esc(category.name)} 제품 데이터 연결 예정">
          <div class="object-art bottle">${esc(category.code)}</div>
          <div class="object-art jar">Item</div>
          <div class="object-art box">Mock</div>
        </div>
        <div class="placeholder-status">추천 제품 준비 중 · 제품 데이터 연결 예정</div>
        <div class="tag-row">
          ${items.map((item) => `<span class="tag">${esc(item.name)}</span>`).join("")}
          <span class="tag">전체 ${category.productCount}개</span>
        </div>
      </button>
    `;
  }

  function productHubCopy(code) {
    return {
      SK: "클렌저, 선크림, 보습, 트러블 케어",
      GR: "면도기, 쉐이빙젤, 데오드란트, 구강 관리",
      BD: "운동용품, 바디워시, 체모 관리",
      FD: "영양제, 단백질, 수분, 건강식품",
      SL: "베개커버, 가습기, 수면 보조, 릴렉싱",
      MT: "노트, 타이머, 명상, 집중 회복 도구",
      ST: "헤어, 향수, 의류 관리, 액세서리",
      SO: "대화, 선물, 관계 관리 도구",
      SP: "청소, 정리, 향기, 인테리어",
      SY: "루틴 관리, 시간 관리, 생산성 도구",
    }[code] || "아이템과 제품을 루틴 기준으로 연결";
  }

  function renderProductCard(product) {
    const item = byCode.items.get(product.itemCode);
    const routine = getRelatedRoutineForProduct(product);
    const cat = byCode.categories.get(product.domain);
    return `
      <button class="product-card clickable" style="--tint:${cat?.tint || "#fff"};" data-open-type="product" data-code="${esc(product.code)}">
        <div class="product-card-head">
          <div class="cat-icon" style="color:${cat?.accent || "var(--ink)"};">${esc(cat?.icon || "◇")}</div>
          <span class="code-label">${esc(product.code)}</span>
        </div>
        <h3>${esc(product.productName)}</h3>
        <p>${esc(product.brand)} · ${esc(product.category)}</p>
        ${renderProductImage(product)}
        <div class="tag-row">
          <span class="tag">${esc(item?.name || product.itemCode)}</span>
          <span class="tag">${esc(routine?.title || "관련 루틴")}</span>
        </div>
      </button>
    `;
  }

  function renderProductImage(product) {
    if (product.imageUrl) {
      return `<img class="product-image" src="${esc(product.imageUrl)}" alt="${esc(product.productName)}">`;
    }
    const seed = product.code.split("-").slice(1, 4).join("");
    return `
      <div class="product-objects" aria-label="${esc(product.productName)} 이미지 자리">
        <div class="object-art bottle">${esc(seed.slice(0, 2))}</div>
        <div class="object-art jar">${esc(seed.slice(2, 4))}</div>
        <div class="object-art box">${esc(product.recommendationType || "P")}</div>
      </div>
    `;
  }

  function renderItemCard(item) {
    const cat = byCode.categories.get(item.domain);
    return `
      <button class="item-card clickable" data-open-type="item" data-code="${esc(item.code)}">
        <div class="cat-icon" style="color:${cat?.accent || "var(--ink)"};">${esc(categoryVisual[item.domain]?.icon || cat?.icon || "🧴")}</div>
        <strong>${esc(item.name)}</strong>
        <span>${esc(item.code)}</span>
        <p>${esc(item.role)}</p>
        <div class="meta-line"><span>매뉴얼 ${item.manualCodes.length}개</span><span>제품 ${getProductsForItem(item.code).length}개</span></div>
      </button>
    `;
  }

  function renderSituations({ compact = false } = {}) {
    const mental = data.situations.filter((situation) => situation.type.includes("Mental"));
    const social = data.situations.filter((situation) => situation.type.includes("Social"));
    return `
      <section class="section-card" id="situations">
        <div class="section-head">
          <div>
            <h2>SR26-MT-SO / Situation Dashboard</h2>
            <div class="eyebrow">상황을 누르면 관련 상세 매뉴얼, 아이템, 제품 연결 흐름을 확인합니다.</div>
          </div>
          <div class="segmented">
            <button class="active" data-view="situations">전체</button>
            <button data-action="filter-situation" data-type="Mental">Mental</button>
            <button data-action="filter-situation" data-type="Social">Social</button>
          </div>
        </div>
        <div class="situation">
          ${renderSituationRanking("🧠 Mental Management", mental.slice(0, compact ? 5 : mental.length), false)}
          ${renderSituationRanking("🤝 Social Management", social.slice(0, compact ? 5 : social.length), true)}
        </div>
        <div class="situation-detail-grid">
          ${renderSituationManualCards((compact ? [...mental.slice(0, 3), ...social.slice(0, 3)] : [...mental, ...social]))}
        </div>
      </section>
    `;
  }

  function renderSituationRanking(title, situations, social) {
    return `
      <div class="ranking ${social ? "social" : ""}">
        <div class="situation-summary">
          <h3>${esc(title)}</h3>
          <div><strong>${situations.length}</strong><span>대표 상황</span></div>
        </div>
        ${situations.map((situation, index) => `
          <button class="rank-item clickable" data-open-type="situation" data-code="${esc(situation.code)}">
            <div class="badge">${esc(iconForSituation(situation.title))}</div>
            <div><strong>${esc(situation.title)}</strong><span>${esc(situation.code)} · ${esc(situation.priority)}</span></div>
            <b>원천 ${situation.sourceCount}개</b>
          </button>
        `).join("")}
      </div>
    `;
  }

  function renderSituationManualCards(situations) {
    return `
      <div class="manual-cards">
        ${situations.map((situation) => {
          const manual = byCode.manuals.get(situation.manualCode);
          return `
            <button class="manual-card clickable" data-open-type="situation" data-code="${esc(situation.code)}">
              <div class="situation-card-icon">${esc(iconForSituation(situation.title))}</div>
              <h4>${esc(situation.title)}</h4>
              <p>${esc(manual?.summary || "상황에 맞는 루틴과 매뉴얼을 연결합니다.")}</p>
              <div class="difficulty">${esc(situation.code)}</div>
              <ul>${(manual?.blocks?.find((block) => block.items)?.items || []).slice(0, 3).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
            </button>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderSearch() {
    const query = state.query.trim().toLowerCase();
    const entities = [
      ...data.routines.map((item) => ({ type: "routine", title: item.title, code: item.code, meta: item.frequency, entity: item })),
      ...data.manuals.map((item) => ({ type: "manual", title: item.title, code: item.code, meta: item.category, entity: item })),
      ...data.items.map((item) => ({ type: "item", title: item.name, code: item.code, meta: item.category, entity: item })),
      ...data.products.map((item) => ({ type: "product", title: item.productName, code: item.code, meta: item.brand, entity: item })),
      ...data.situations.map((item) => ({ type: "situation", title: item.title, code: item.code, meta: item.type, entity: item })),
      ...data.categories.map((item) => ({ type: "category", title: item.name, code: item.code, meta: item.label, entity: item })),
    ];
    const results = query ? entities.filter((item) => searchableText(item.entity).includes(query)) : [];
    return `
      ${renderHero()}
      <section class="section-card">
        <div class="section-head">
          <div>
            <h2>${query ? `"${esc(state.query)}" 검색 결과 ${results.length}개` : "검색어를 입력해주세요"}</h2>
            <div class="eyebrow">SERKAN CODE, 카테고리, 태그, 제목, 제품명 기준으로 검색합니다.</div>
          </div>
        </div>
        <div class="result-grid">
          ${results.map(renderSearchResult).join("") || `<div class="empty">검색 결과가 없습니다.</div>`}
        </div>
      </section>
    `;
  }

  function renderSearchResult(result) {
    return `
      <button class="search-result clickable" data-open-type="${esc(result.type)}" data-code="${esc(result.code)}">
        <span>${esc(result.type)}</span>
        <strong>${esc(result.title)}</strong>
        <em>${esc(result.code)} · ${esc(result.meta || "")}</em>
      </button>
    `;
  }

  function renderQuickAccess() {
    return `
      <section class="quick-grid" aria-label="Quick access">
        <button class="quick-card clickable" data-view="dashboard">☀️<strong>루틴 사용 가이드</strong><span>루틴 카드를 클릭하면 상세 매뉴얼로 이동합니다.</span><em>루틴 보기 →</em></button>
        <button class="quick-card clickable" data-action="show-items">🧴<strong>관련 아이템 확인</strong><span>루틴과 연결된 아이템 백과를 함께 확인합니다.</span><em>아이템 보기 →</em></button>
        <button class="quick-card clickable" data-view="products">🛍️<strong>관련 제품 확인</strong><span>제품 카드에서 상세 정보와 주의사항을 봅니다.</span><em>제품 보기 →</em></button>
        <button class="quick-card clickable" data-view="situations">🚨<strong>상황별 관리</strong><span>멘탈/소셜 상황에 맞는 대응 루틴을 확인합니다.</span><em>상황 보기 →</em></button>
        <button class="quick-card clickable" data-view="manuals">📘<strong>매뉴얼 백과</strong><span>생활감 있는 상세 실행 설명을 확인합니다.</span><em>매뉴얼 보기 →</em></button>
        <button class="quick-card clickable" data-view="dashboard">⚙️<strong>전체 루틴 수</strong><span>Daily · Weekly · Situation 연결 현황</span><em>전체 보기 →</em></button>
      </section>
    `;
  }

  function renderDrawer() {
    let host = $("#drawer-root");
    if (!host) {
      host = document.createElement("div");
      host.id = "drawer-root";
      document.body.appendChild(host);
    }
    if (!state.selected) {
      host.innerHTML = "";
      return;
    }
    const { type, code } = state.selected;
    host.innerHTML = `
      <div class="drawer-backdrop" data-action="close"></div>
      <aside class="detail-drawer" aria-label="Detail drawer">
        <div class="drawer-actions">
          <button class="back-btn" data-action="back">← 이전</button>
          <button class="icon-btn" data-action="close" aria-label="닫기">×</button>
        </div>
        ${renderDetail(type, code)}
      </aside>
    `;
  }

  function renderDetail(type, code) {
    if (type === "routine") return renderRoutineDetail(byCode.routines.get(code));
    if (type === "manual") return renderManualDetail(byCode.manuals.get(code));
    if (type === "item") return renderItemDetail(byCode.items.get(code));
    if (type === "product") return renderProductDetail(byCode.products.get(code));
    if (type === "situation") return renderSituationDetail(byCode.situations.get(code));
    if (type === "category") return renderCategoryDetail(byCode.categories.get(code));
    return `<div class="empty">상세 정보를 찾을 수 없습니다.</div>`;
  }

  function detailHeader(kicker, title, code) {
    return `<div class="detail-head"><span>${esc(kicker)}</span><h2>${esc(title)}</h2><code>${esc(code)}</code></div>`;
  }

  function renderRoutineDetail(routine) {
    if (!routine) return `<div class="empty">루틴을 찾을 수 없습니다.</div>`;
    const manual = getManualForRoutine(routine);
    const items = manual ? getItemsForManual(manual.code) : [];
    const products = items.flatMap((item) => getProductsForItem(item.code));
    return `
      ${detailHeader("Routine Task", routine.title, routine.code)}
      <p>${esc(routine.frequency)} · ${esc(routine.priority)} · ${esc(routine.timeBlocks.join(", ") || categoryName(routine.domain))}</p>
      ${manual ? relationButton("manual", manual.code, "상세 매뉴얼", manual.title) : pendingBox("상세 매뉴얼 연결 대기", "루틴 행동과 직접 일치하는 매뉴얼만 연결합니다.")}
      ${renderRelationList("관련 아이템", items.map((item) => ["item", item.code, item.name]))}
      ${products.length ? renderRelationList("관련 제품", products.map((product) => ["product", product.code, product.productName])) : pendingBox("관련 제품 연결 대기", "실제 제품명, 이미지 또는 구매 링크가 확인된 제품만 표시합니다.")}
    `;
  }

  function renderManualDetail(manual) {
    if (!manual) return `<div class="empty">매뉴얼을 찾을 수 없습니다.</div>`;
    const items = getItemsForManual(manual.code);
    return `
      ${detailHeader("Routine Detail Manual", manual.title, manual.code)}
      <p>${esc(manual.summary)}</p>
      <div class="manual-blocks">
        ${manual.blocks.filter((block) => block.label !== "참고").map((block) => `
          <section>
            <h3>${esc(block.label)}</h3>
            ${block.text ? `<p>${esc(block.text)}</p>` : ""}
            ${block.items ? `<ul>${block.items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : ""}
          </section>
        `).join("")}
      </div>
      ${renderRelationList("관련 아이템", items.map((item) => ["item", item.code, item.name]))}
      ${renderRelationList("관련 제품", getProductsForManual(manual.code).map((product) => ["product", product.code, product.productName]))}
    `;
  }

  function renderItemDetail(item) {
    if (!item) return `<div class="empty">아이템을 찾을 수 없습니다.</div>`;
    const products = getProductsForItem(item.code);
    const manuals = item.manualCodes.map((manualCode) => byCode.manuals.get(manualCode)).filter(Boolean);
    return `
      ${detailHeader("Item Encyclopedia", item.name, item.code)}
      <p>${esc(item.role)}</p>
      ${renderRelationList("관련 매뉴얼", manuals.map((manual) => ["manual", manual.code, manual.title]))}
      ${products.length ? renderRelationList("관련 제품", products.map((product) => ["product", product.code, product.productName])) : pendingBox("관련 제품 연결 대기", "Mock Product와 추천 단계 placeholder는 상세 연결에서 제외했습니다.")}
    `;
  }

  function renderProductDetail(product) {
    if (!product) return `<div class="empty">제품을 찾을 수 없습니다.</div>`;
    const item = byCode.items.get(product.itemCode);
    const routine = getRelatedRoutineForProduct(product);
    const manual = item?.manualCodes.map((manualCode) => byCode.manuals.get(manualCode)).find(Boolean);
    return `
      ${detailHeader("Product Card", product.productName, product.code)}
      ${renderProductImage(product)}
      <dl class="detail-list">
        <dt>Brand</dt><dd>${esc(product.brand)}</dd>
        <dt>Product Name</dt><dd>${esc(product.productName)}</dd>
        <dt>Category</dt><dd>${esc(product.category)}</dd>
        <dt>Related Routine</dt><dd>${routine ? esc(routine.title) : "연결 루틴 확인 필요"}</dd>
        <dt>Related Manual</dt><dd>${manual ? esc(manual.title) : "연결 매뉴얼 확인 필요"}</dd>
        <dt>Product Link</dt><dd>${product.productLink && product.productLink !== "#" ? `<a href="${esc(product.productLink)}">${esc(product.productLink)}</a>` : "제품 링크 입력 대기"}</dd>
        <dt>추천 이유</dt><dd>${esc(product.recommendationReason)}</dd>
        <dt>추천 대상</dt><dd>${esc(product.target)}</dd>
        <dt>주의사항</dt><dd>${esc(product.caution)}</dd>
      </dl>
      ${item ? relationButton("item", item.code, "관련 아이템", item.name) : ""}
      ${routine ? relationButton("routine", routine.code, "관련 루틴", routine.title) : ""}
    `;
  }

  function renderSituationDetail(situation) {
    if (!situation) return `<div class="empty">상황을 찾을 수 없습니다.</div>`;
    const manual = byCode.manuals.get(situation.manualCode);
    const items = manual ? getItemsForManual(manual.code) : [];
    const products = items.flatMap((item) => getProductsForItem(item.code));
    return `
      ${detailHeader("Situation", situation.title, situation.code)}
      <p>${esc(situation.type)} · ${esc(situation.priority)}</p>
      ${manual ? relationButton("manual", manual.code, "상황 상세 매뉴얼", manual.title) : pendingBox("상황 매뉴얼 연결 대기", "상황 제목과 직접 연결되는 매뉴얼만 유지합니다.")}
      ${renderRelationList("관련 아이템", items.map((item) => ["item", item.code, item.name]))}
      ${products.length ? renderRelationList("관련 제품", products.map((product) => ["product", product.code, product.productName])) : pendingBox("관련 제품 연결 대기", "실제 제품 데이터가 들어오기 전까지 제품 연결을 보류합니다.")}
    `;
  }

  function renderCategoryDetail(category) {
    if (!category) return `<div class="empty">카테고리를 찾을 수 없습니다.</div>`;
    const manuals = data.manuals.filter((manual) => manual.domain === category.code);
    const items = data.items.filter((item) => item.domain === category.code);
    const products = data.products.filter((product) => product.domain === category.code);
    return `
      ${detailHeader("Category", `${category.name} / ${category.label}`, category.code)}
      <p>${category.label} 영역의 루틴, 매뉴얼, 아이템, 제품 연결입니다.</p>
      ${renderRelationList("매뉴얼", manuals.map((manual) => ["manual", manual.code, manual.title]))}
      ${renderRelationList("아이템", items.map((item) => ["item", item.code, item.name]))}
      ${renderRelationList("제품", products.map((product) => ["product", product.code, product.productName]))}
    `;
  }

  function relationButton(type, code, label, title) {
    return `
      <button class="relation-button" data-open-type="${esc(type)}" data-code="${esc(code)}">
        <span>${esc(label)}</span>
        <strong>${esc(title)}</strong>
        <em>${esc(code)} →</em>
      </button>
    `;
  }

  function pendingBox(title, body) {
    return `
      <div class="pending-box">
        <strong>${esc(title)}</strong>
        <span>${esc(body)}</span>
      </div>
    `;
  }

  function renderRelationList(title, rows) {
    const uniqueRows = uniq(rows.map((row) => row.join("|"))).map((row) => row.split("|")).slice(0, 12);
    if (!uniqueRows.length) return "";
    return `
      <section class="relation-list">
        <h3>${esc(title)}</h3>
        ${uniqueRows.map(([type, code, label]) => relationButton(type, code, code, label)).join("")}
      </section>
    `;
  }

  function render() {
    const content = $(".content");
    const searchInput = $(".search input");
    if (searchInput && searchInput.value !== state.query) searchInput.value = state.query;
    if (state.view === "dashboard") content.innerHTML = renderDashboard();
    if (state.view === "manuals") content.innerHTML = `${renderHero()}${renderManuals()}`;
    if (state.view === "products") content.innerHTML = `${renderHero()}${renderProducts()}`;
    if (state.view === "situations") content.innerHTML = `${renderHero()}${renderSituations()}`;
    if (state.view === "search") content.innerHTML = renderSearch();
    updateActiveNav();
    renderDrawer();
  }

  function updateActiveNav() {
    $$(".tab, .side-link").forEach((el) => el.classList.remove("active"));
    const tabNavByView = {
      dashboard: "routine-system",
      manuals: "manuals",
      products: "products",
      situations: "situations",
    };
    const sideNavByView = {
      dashboard: "daily",
      manuals: "manuals",
      products: "products",
      situations: "situation",
    };
    const tabNav = tabNavByView[state.view];
    const sideNav = sideNavByView[state.view];
    if (tabNav) $$(`.tab[data-nav="${tabNav}"]`).forEach((el) => el.classList.add("active"));
    if (sideNav) $$(`.side-link[data-nav="${sideNav}"]`).forEach((el) => el.classList.add("active"));
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-view], [data-open-type], [data-action]");
      if (!trigger) return;
      const view = trigger.dataset.view;
      const openType = trigger.dataset.openType;
      const action = trigger.dataset.action;
      if (view) setView(view);
      if (openType) openDetail(openType, trigger.dataset.code);
      if (action === "back") goBack();
      if (action === "close") closeDrawer();
      if (action === "show-items") setView("products");
      if (action === "show-group") setView(trigger.dataset.kind === "weekly" ? "dashboard" : "dashboard");
    });

    const search = $(".search input");
    if (search) {
      search.addEventListener("input", (event) => {
        state.query = event.target.value;
        state.view = state.query.trim() ? "search" : "dashboard";
        render();
      });
      search.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          state.query = "";
          state.view = "dashboard";
          render();
        }
      });
    }
  }

  function initNavigationData() {
    const tabMap = [
      ["dashboard", "dashboard"],
      ["dashboard", "routine-system"],
      ["manuals", "manuals"],
      ["products", "items"],
      ["products", "products"],
      ["situations", "situations"],
    ];
    $$(".tab").forEach((tab, index) => {
      const [view, nav] = tabMap[index] || ["dashboard", "dashboard"];
      tab.dataset.view = view;
      tab.dataset.nav = nav;
    });
    $$(".side-link").forEach((link) => {
      if (link.dataset.view) return;
      const text = link.textContent;
      if (text.includes("Daily") || text.includes("Weekly") || text.includes("Monthly") || text.includes("Seasonal")) link.dataset.view = "dashboard";
      if (text.includes("Situation")) link.dataset.view = "situations";
      if (text.includes("Manual")) link.dataset.view = "manuals";
      if (text.includes("Item") || text.includes("Product")) link.dataset.view = "products";
      if (text.includes("Skin") || text.includes("Grooming") || text.includes("Body") || text.includes("Food") || text.includes("Sleep") || text.includes("Mental") || text.includes("Relationship") || text.includes("Space") || text.includes("System")) {
        link.dataset.view = "manuals";
      }
    });
  }

  initNavigationData();
  bindEvents();
  render();
})();
