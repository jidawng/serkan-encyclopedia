(function () {
  const data = window.SERKAN_DATA;
  const state = {
    view: "dashboard",
    query: "",
    history: [],
    selected: null,
    expandedGroups: {},
    navTarget: "daily",
    situationFilter: "all",
    selectedSituationCategory: null,
    weeklyDone: loadWeeklyDone(),
    customWeeklyRoutines: loadCustomWeeklyRoutines(),
    itemReclasses: loadItemReclasses(),
    itemOrders: loadItemOrders(),
    cardOrders: loadCardOrders(),
    editMode: loadEditMode(),
    draggedItemCode: null,
    draggedCard: null,
    suppressClick: false,
  };

  mergeCustomWeeklyRoutines();

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
      subtitle: "Daily Routine Overview와 Weekly Routine Overview를 한눈에 보고, 관련 매뉴얼과 제품군/아이템 백과로 연결합니다.",
    },
    manuals: {
      title: "SR26-SY / Routine Detail Manuals",
      subtitle: "모든 루틴의 상세 매뉴얼을 카테고리별로 탐색하고 관리하세요.",
    },
    products: {
      title: "SR26-PD / Product Group & Item Encyclopedia",
      subtitle: "제품군과 아이템을 카테고리별로 탐색하고 비교할 수 있습니다.",
    },
    situations: {
      title: "SR26-MT-SO / Situation Dashboard",
      subtitle: "상황별 대응 루틴과 추천 매뉴얼을 함께 확인합니다.",
    },
    guide: {
      title: "SR26-GD / 사용법 & 운영 매뉴얼",
      subtitle: "SERKAN 백과사전을 어떻게 보고, 어떻게 고치고, 어떤 기준으로 연결해야 하는지 쉽게 정리한 사용 설명서입니다.",
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

  const commonCategoryOrder = ["SK", "GR", "BD", "FD", "SL", "MT", "ST", "SO", "SP", "SY"];

  const situationCategoryDefs = {
    Mental: [
      {
        key: "mental-routine-recovery",
        icon: "🔄",
        title: "루틴 붕괴 회복",
        desc: "무너진 흐름을 작게 다시 시작해야 할 때",
        actions: ["디지털 디톡스", "작은 루틴 다시 시작", "회복 우선하기"],
        keywords: ["루틴", "리셋", "15분", "선택", "대비책", "신호", "트리거"],
      },
      {
        key: "mental-emotion-wave",
        icon: "📝",
        title: "감정 기복",
        desc: "감정이 커지거나 생각이 엉켜 정리가 필요할 때",
        actions: ["감정 인식하기", "감정 기록하기", "호흡 안정시키기"],
        keywords: ["고민", "감정", "기분", "자책", "손글씨", "멍때리기", "간식"],
      },
      {
        key: "mental-anxiety",
        icon: "😮‍💨",
        title: "불안 / 초조감",
        desc: "몸이 긴장되고 마음이 급해질 때",
        actions: ["4-7-6 호흡", "턱 긴장 풀기", "짧은 스트레칭"],
        keywords: ["호흡", "턱", "어깨", "명상", "스트레칭", "하늘"],
      },
      {
        key: "mental-focus",
        icon: "🧠",
        title: "집중력 저하",
        desc: "휴대폰과 자극에서 벗어나 집중을 회복할 때",
        actions: ["휴대폰 멀리두기", "시야 환기하기", "산책으로 리셋"],
        keywords: ["디지털", "휴대폰", "집중", "산책", "자연", "창밖", "차 한 잔", "걷기"],
      },
      {
        key: "mental-self-esteem",
        icon: "🪞",
        title: "자기 자존감 하락",
        desc: "자신감이 떨어지고 관점 전환이 필요할 때",
        actions: ["자책 멈추기", "충전 행동 고르기", "관점 다시 잡기"],
        keywords: ["자신감", "마인드셋", "주인의식", "충전", "자존감"],
      },
    ],
    Social: [
      {
        key: "social-first-impression",
        icon: "✨",
        title: "첫인상 점검",
        desc: "처음 만나는 자리에서 인상을 정돈할 때",
        actions: ["눈맞춤 준비", "미소 연습", "따뜻한 인사"],
        keywords: ["첫인상", "시선", "미소", "인사", "칭찬"],
      },
      {
        key: "social-relationship",
        icon: "🤝",
        title: "관계 유지",
        desc: "관계를 오래 건강하게 이어가고 싶을 때",
        actions: ["먼저 안부 묻기", "경청하기", "작은 도움 주기"],
        keywords: ["관계", "사회적 교류", "경청", "힘이", "약자", "세심한"],
      },
      {
        key: "social-conflict",
        icon: "🛡️",
        title: "갈등 상황",
        desc: "거절, 비판, 불편한 대화를 다뤄야 할 때",
        actions: ["감정 낮추기", "거절 문장 준비", "불평 줄이기"],
        keywords: ["갈등", "거절", "비판", "불평", "호불호"],
      },
      {
        key: "social-communication",
        icon: "💬",
        title: "커뮤니케이션",
        desc: "말투와 대화 흐름을 더 분명하게 만들 때",
        actions: ["짧게 말하기", "세심하게 답하기", "낯선 대화 열기"],
        keywords: ["언어", "대화", "대답", "낯선"],
      },
      {
        key: "social-apology",
        icon: "🕊️",
        title: "사과 / 화해",
        desc: "어색해진 관계를 다시 풀어야 할 때",
        actions: ["잘못 인정하기", "짧게 사과하기", "다음 행동 약속하기"],
        keywords: ["사과", "화해"],
      },
    ],
  };

  const dailySectionMeta = {
    기상: { icon: "☀️", desc: "하루의 시작을 상쾌하고 안정적으로 만드는 루틴", tint: "#fff9e9", accent: "#e9a928", border: "#f2d59b" },
    업무: { icon: "💼", desc: "집중력과 생산성을 높이는 업무 루틴", tint: "#f0f7ff", accent: "#4d84cc", border: "#cfe0f7" },
    점심: { icon: "🥗", desc: "건강한 식사와 에너지 관리를 위한 루틴", tint: "#f0faef", accent: "#59a05b", border: "#cde8c9" },
    오후: { icon: "🌤️", desc: "컨디션 유지와 활력을 위한 루틴", tint: "#effaff", accent: "#4aa3d8", border: "#cde8f6" },
    저녁: { icon: "🌙", desc: "하루를 정리하고 회복하는 루틴", tint: "#f8f2ff", accent: "#8970d5", border: "#ddd0f4" },
    수면: { icon: "🛏️", desc: "깊고 질 좋은 수면을 위한 루틴", tint: "#eef3ff", accent: "#4f6fb4", border: "#cad7f4" },
  };

  const routineCategoryPresets = {
    "cat-morning": {
      icon: "☀️",
      label: "아침 루틴",
      desc: "기상 직후부터 출근/업무 전까지 몸과 외모, 집중 상태를 정돈하는 루틴입니다.",
      groups: ["기상"],
      terms: ["기상", "아침", "세안", "선크림", "침구", "샤워", "구강", "햇빛"],
    },
    "cat-day": {
      icon: "◌",
      label: "낮 루틴",
      desc: "업무, 점심, 오후 컨디션을 관리하는 루틴입니다.",
      groups: ["업무", "점심", "오후"],
      terms: ["업무", "점심", "오후", "집중", "수분", "카페인", "식사", "스트레칭"],
    },
    "cat-evening": {
      icon: "🌙",
      label: "저녁 루틴",
      desc: "퇴근 후 회복, 관계, 정리, 수면 준비로 이어지는 루틴입니다.",
      groups: ["저녁", "수면"],
      terms: ["저녁", "귀가", "수면", "취침", "독서", "정리", "전자기기", "조명"],
    },
    "cat-exercise": {
      icon: "◇",
      label: "운동 루틴",
      desc: "근력, 유산소, 자세, 스트레칭처럼 몸의 컨디션을 끌어올리는 루틴입니다.",
      domains: ["BD"],
      terms: ["운동", "스트레칭", "유산소", "근력", "웨이트", "자세", "목", "어깨", "스쿼트", "데드리프트"],
    },
    "cat-rest": {
      icon: "◐",
      label: "휴식 루틴",
      desc: "피로 회복, 멘탈 리셋, 수면 질 개선을 위한 루틴입니다.",
      domains: ["SL", "MT"],
      groups: ["오후", "수면"],
      terms: ["휴식", "회복", "리셋", "명상", "호흡", "수면", "피로", "디지털"],
    },
    "cat-relation": {
      icon: "♡",
      label: "관계 루틴",
      desc: "대화, 연락, 감사, 관계 유지처럼 사람과 연결되는 루틴입니다.",
      domains: ["SO"],
      terms: ["관계", "대화", "연락", "친구", "감사", "칭찬", "커뮤니케이션", "갈등"],
    },
    "cat-hygiene": {
      icon: "♨",
      label: "위생 루틴",
      desc: "피부, 세안, 샤워, 면도, 구강, 손톱처럼 청결과 인상을 관리하는 루틴입니다.",
      domains: ["SK", "GR"],
      terms: ["위생", "세안", "클렌징", "샤워", "면도", "구강", "손톱", "귀", "보습", "선크림", "체취"],
    },
    "cat-space": {
      icon: "✦",
      label: "환경 루틴",
      desc: "공간 정리, 청소, 환기, 침구, 조명처럼 생활 환경을 정돈하는 루틴입니다.",
      domains: ["SP"],
      terms: ["공간", "환경", "정리", "청소", "환기", "침구", "데스크", "조명", "습도", "냄새"],
    },
    "cat-growth": {
      icon: "✎",
      label: "성장 루틴",
      desc: "기록, 회고, 계획, 독서, 목표 관리처럼 자기관리 시스템을 키우는 루틴입니다.",
      domains: ["SY", "MT"],
      terms: ["성장", "기록", "회고", "계획", "목표", "독서", "리플렉션", "시간", "생산성"],
    },
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

  const itemIconRules = [
    ["발코니|청소|먼지|욕실|싱크대|세탁망|세탁", "🧽"],
    ["간접 조명|조도|조명", "💡"],
    ["데스크|책상", "🖥️"],
    ["침구|베개|커버", "🛏️"],
    ["체모|바디그루밍|면도|쉐이브", "🪒"],
    ["리플렉션|가치|태도", "🪞"],
    ["차/머그컵|머그컵|차/", "🍵"],
    ["스트레칭|운동|격투기|마사지볼|리프레시", "🧘"],
    ["디지털|차단", "📵"],
    ["시간|트래커|캘린더|루틴 설계", "⏱️"],
    ["외모|착장|첫인상|시선|표정", "✨"],
    ["대화|관계|칭찬|거절", "🤝"],
    ["감정|기록|메모|노트|독서", "📝"],
    ["수면|취침", "🌙"],
    ["가습기|습도계|습도", "💧"],
    ["햇빛|선크림", "☀️"],
    ["식단|음식|메뉴|영양제|전해질|유지방|혼술|장 자극", "🥗"],
    ["반창고|상처|패치", "🩹"],
    ["뒷목|아이스팩", "🧊"],
    ["마사지|얼굴 마사지", "💆"],
    ["두피|헤어|헤어컷", "💇"],
    ["귀 물기|수건|타월|세정|세면|구강|가글|워터픽|치과", "🫧"],
    ["트러블|여드름|모공|블랙헤드", "🔍"],
    ["립밤|바세린|보습|스쿠알란|도포", "🧴"],
    ["비타민C|세럼|화장품", "💧"],
    ["손톱|눈썹|코털", "✂️"],
    ["향수|디퓨저", "🌫️"],
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

  function loadWeeklyDone() {
    try {
      return JSON.parse(localStorage.getItem("SERKAN_WEEKLY_DONE") || "{}");
    } catch {
      return {};
    }
  }

  function saveWeeklyDone() {
    localStorage.setItem("SERKAN_WEEKLY_DONE", JSON.stringify(state.weeklyDone));
  }

  function loadCustomWeeklyRoutines() {
    try {
      const routines = JSON.parse(localStorage.getItem("SERKAN_CUSTOM_WEEKLY_ROUTINES") || "[]");
      return Array.isArray(routines) ? routines.filter((routine) => routine?.code && routine?.title) : [];
    } catch {
      return [];
    }
  }

  function saveCustomWeeklyRoutines() {
    localStorage.setItem("SERKAN_CUSTOM_WEEKLY_ROUTINES", JSON.stringify(state.customWeeklyRoutines));
  }

  function mergeCustomWeeklyRoutines() {
    const existingCodes = new Set(data.routines.map((routine) => routine.code));
    state.customWeeklyRoutines.forEach((routine) => {
      if (!existingCodes.has(routine.code)) {
        data.routines.push(routine);
        existingCodes.add(routine.code);
      }
    });
  }

  function nextCustomWeeklyCode() {
    const used = new Set([
      ...data.routines.map((routine) => routine.code),
      ...state.customWeeklyRoutines.map((routine) => routine.code),
    ]);
    let number = 1;
    while (used.has(`SR26-CUSTOM-WK-R${number}`)) number += 1;
    return `SR26-CUSTOM-WK-R${number}`;
  }

  function createCustomWeeklyRoutine(formData) {
    const dayKey = formData.get("weekday") || "월";
    const domain = formData.get("domain") || "SY";
    const title = String(formData.get("title") || "").trim();
    const frequency = String(formData.get("frequency") || "Weekly").trim() || "Weekly";
    const summary = String(formData.get("summary") || "").trim();
    if (!title) return null;
    const category = byCode.categories.get(domain);
    const routine = {
      code: nextCustomWeeklyCode(),
      title,
      board: "weekly",
      domain,
      topic: "CUSTOM",
      category: category?.name || categoryName(domain),
      weekday: dayKey,
      frequency,
      priority: "사용자 추가",
      timeBlocks: [dayKey],
      tags: uniq(["사용자 추가", "Custom", frequency, category?.name || domain]),
      summary,
      action: summary || title,
      manualCode: null,
      itemCode: null,
      connectionStatus: "custom",
      linkConfidence: "custom",
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    state.customWeeklyRoutines.push(routine);
    data.routines.push(routine);
    rebuildIndexes();
    saveCustomWeeklyRoutines();
    return routine;
  }

  function deleteCustomWeeklyRoutine(code) {
    const routine = byCode.routines.get(code);
    if (!routine?.isCustom) return false;
    state.customWeeklyRoutines = state.customWeeklyRoutines.filter((item) => item.code !== code);
    const dataIndex = data.routines.findIndex((item) => item.code === code);
    if (dataIndex !== -1) data.routines.splice(dataIndex, 1);
    Object.keys(state.weeklyDone).forEach((key) => {
      if (key.endsWith(`:${code}`)) delete state.weeklyDone[key];
    });
    saveWeeklyDone();
    saveCustomWeeklyRoutines();
    rebuildIndexes();
    return true;
  }

  function loadItemReclasses() {
    try {
      return JSON.parse(localStorage.getItem("SERKAN_ITEM_RECLASSES") || "[]");
    } catch {
      return [];
    }
  }

  function saveItemReclasses() {
    localStorage.setItem("SERKAN_ITEM_RECLASSES", JSON.stringify(state.itemReclasses));
  }

  function loadItemOrders() {
    try {
      const orders = JSON.parse(localStorage.getItem("SERKAN_ITEM_ORDERS") || "{}");
      return orders && typeof orders === "object" && !Array.isArray(orders) ? orders : {};
    } catch {
      return {};
    }
  }

  function saveItemOrders() {
    localStorage.setItem("SERKAN_ITEM_ORDERS", JSON.stringify(state.itemOrders));
  }

  function loadCardOrders() {
    try {
      const orders = JSON.parse(localStorage.getItem("SERKAN_CARD_ORDERS") || "{}");
      return orders && typeof orders === "object" && !Array.isArray(orders) ? orders : {};
    } catch {
      return {};
    }
  }

  function saveCardOrders() {
    localStorage.setItem("SERKAN_CARD_ORDERS", JSON.stringify(state.cardOrders));
  }

  function loadEditMode() {
    try {
      return localStorage.getItem("SERKAN_EDIT_MODE") === "true";
    } catch {
      return false;
    }
  }

  function saveEditMode() {
    localStorage.setItem("SERKAN_EDIT_MODE", state.editMode ? "true" : "false");
  }

  function rebuildIndexes() {
    Object.entries({
      routines: data.routines,
      manuals: data.manuals,
      items: data.items,
      products: data.products,
      categories: data.categories,
      situations: data.situations,
    }).forEach(([key, values]) => {
      byCode[key].clear();
      values.forEach((item) => byCode[key].set(item.code, item));
    });
  }

  function codeParts(code) {
    const match = String(code || "").match(/^SR26-([A-Z]{2})-([A-Z0-9]+)-([A-Z]+)(\d+)$/);
    if (!match) return null;
    return { domain: match[1], topic: match[2], role: match[3], number: Number(match[4]) };
  }

  function makeCode(domain, topic, role, number) {
    return `SR26-${domain}-${topic}-${role}${number}`;
  }

  function nextAvailableCode({ domain, topic, role, preferredNumber, exclude = new Set(), reserved = new Set() }) {
    const used = new Set([
      ...data.items.map((item) => item.code),
      ...data.products.map((product) => product.code),
      ...data.routines.map((routine) => routine.code),
      ...data.manuals.map((manual) => manual.code),
      ...data.situations.map((situation) => situation.code),
    ].filter((code) => !exclude.has(code)));
    reserved.forEach((code) => used.add(code));
    let number = preferredNumber || 1;
    while (used.has(makeCode(domain, topic, role, number))) number += 1;
    return makeCode(domain, topic, role, number);
  }

  function productSlotNumber(product, fallbackIndex) {
    return codeParts(product.code)?.number || fallbackIndex + 1;
  }

  function buildItemReclassPlan(itemCode, targetDomain) {
    const item = byCode.items.get(itemCode);
    const targetCategory = byCode.categories.get(targetDomain);
    if (!item || !targetCategory || item.domain === targetDomain) return null;
    const originalCode = item.originalCode || item.reclassOriginalCode || item.code;
    const oldCode = item.code;
    const itemParts = codeParts(item.code);
    if (!itemParts) return null;
    const exclude = new Set([oldCode, ...(item.productCodes || [])]);
    const newCode = nextAvailableCode({
      domain: targetDomain,
      topic: itemParts.topic,
      role: "C",
      preferredNumber: itemParts.number,
      exclude,
    });
    const productCodeMap = {};
    const movedProducts = data.products.filter((product) => product.itemCode === oldCode || item.productCodes?.includes(product.code));
    const reservedProductCodes = new Set();
    movedProducts.forEach((product, index) => {
      const parts = codeParts(product.code);
      const preferredNumber = parts?.number || productSlotNumber(product, index);
      const newProductCode = nextAvailableCode({
        domain: targetDomain,
        topic: itemParts.topic,
        role: "P",
        preferredNumber,
        exclude,
        reserved: reservedProductCodes,
      });
      productCodeMap[product.code] = newProductCode;
      reservedProductCodes.add(newProductCode);
    });
    return {
      originalCode,
      oldCode,
      newCode,
      itemName: item.name,
      fromDomain: item.domain,
      toDomain: targetDomain,
      fromCategory: categoryName(item.domain),
      toCategory: categoryName(targetDomain),
      productCodeMap,
      changedAt: new Date().toISOString(),
    };
  }

  function applyItemReclass(itemCode, targetDomain, { persist = true } = {}) {
    const plan = buildItemReclassPlan(itemCode, targetDomain);
    if (!plan) return null;
    const item = byCode.items.get(plan.oldCode);
    const targetCategory = byCode.categories.get(plan.toDomain);
    item.originalCode = plan.originalCode;
    item.reclassOriginalCode = plan.originalCode;
    item.previousCode = plan.oldCode;
    item.previousDomain = plan.fromDomain;
    item.code = plan.newCode;
    item.domain = plan.toDomain;
    item.category = `${targetCategory?.name || plan.toDomain} 아이템 백과`;
    item.dragReclassified = true;
    item.reclassChangedAt = plan.changedAt;
    item.productCodes = (item.productCodes || []).map((code) => plan.productCodeMap[code] || code);

    data.products.forEach((product) => {
      const newProductCode = plan.productCodeMap[product.code];
      if (!newProductCode) return;
      product.previousCode = product.code;
      product.code = newProductCode;
      product.domain = plan.toDomain;
      product.category = targetCategory?.name || product.category;
      product.itemCode = plan.newCode;
    });

    [...data.routines, ...data.situations].forEach((source) => {
      if (source.itemCode === plan.oldCode) {
        source.previousItemCode = plan.oldCode;
        source.itemCode = plan.newCode;
      }
    });

    Object.values(data.linkMap || {}).forEach((link) => {
      if (link.from === plan.oldCode) link.from = plan.newCode;
      if (link.to === plan.oldCode) link.to = plan.newCode;
      if (plan.productCodeMap[link.from]) link.from = plan.productCodeMap[link.from];
      if (plan.productCodeMap[link.to]) link.to = plan.productCodeMap[link.to];
    });

    if (persist) {
      const existingIndex = state.itemReclasses.findIndex((entry) => entry.originalCode === plan.originalCode);
      if (existingIndex >= 0) state.itemReclasses[existingIndex] = plan;
      else state.itemReclasses.push(plan);
      saveItemReclasses();
    }
    rebuildIndexes();
    return plan;
  }

  function applySavedItemReclasses() {
    const records = [...state.itemReclasses];
    state.itemReclasses = [];
    const appliedRecords = [];
    records.forEach((record) => {
      const sourceCode = byCode.items.has(record.originalCode) ? record.originalCode : record.oldCode;
      const plan = sourceCode ? applyItemReclass(sourceCode, record.toDomain, { persist: false }) : null;
      if (plan) appliedRecords.push(plan);
    });
    state.itemReclasses = appliedRecords;
    if (records.length) saveItemReclasses();
    rebuildIndexes();
  }

  function resetItemReclasses() {
    localStorage.removeItem("SERKAN_ITEM_RECLASSES");
    window.location.reload();
  }

  function orderedItemsForCategory(domain) {
    const items = data.items.filter((item) => item.domain === domain);
    const order = Array.isArray(state.itemOrders[domain]) ? state.itemOrders[domain] : [];
    const rank = new Map(order.map((code, index) => [code, index]));
    return [...items].sort((a, b) => {
      const rankA = rank.has(a.code) ? rank.get(a.code) : Number.MAX_SAFE_INTEGER;
      const rankB = rank.has(b.code) ? rank.get(b.code) : Number.MAX_SAFE_INTEGER;
      if (rankA !== rankB) return rankA - rankB;
      return data.items.indexOf(a) - data.items.indexOf(b);
    });
  }

  function removeItemFromOrders(itemCode) {
    Object.keys(state.itemOrders).forEach((domain) => {
      state.itemOrders[domain] = (state.itemOrders[domain] || []).filter((code) => code !== itemCode);
      if (!state.itemOrders[domain].length) delete state.itemOrders[domain];
    });
  }

  function placeItemInCategoryOrder(itemCode, domain, targetCode, placeAfter = false) {
    const item = byCode.items.get(itemCode);
    if (!item || item.domain !== domain || itemCode === targetCode) return null;
    const codes = orderedItemsForCategory(domain).map((entry) => entry.code).filter((code) => code !== itemCode);
    let insertIndex = targetCode ? codes.indexOf(targetCode) : codes.length;
    if (insertIndex < 0) insertIndex = codes.length;
    if (placeAfter && targetCode) insertIndex += 1;
    codes.splice(insertIndex, 0, itemCode);
    state.itemOrders[domain] = codes;
    saveItemOrders();
    return { item, position: insertIndex + 1, total: codes.length };
  }

  function resetItemOrder() {
    const keepCurrentDrawer = state.selected?.type === "editLog";
    localStorage.removeItem("SERKAN_ITEM_ORDERS");
    localStorage.removeItem("SERKAN_CARD_ORDERS");
    state.itemOrders = {};
    state.cardOrders = {};
    render();
    if (!keepCurrentDrawer) showItemsSection();
    showToast("저장된 카드 순서를 초기화했습니다.");
  }

  function resetAllEdits() {
    localStorage.removeItem("SERKAN_ITEM_ORDERS");
    localStorage.removeItem("SERKAN_CARD_ORDERS");
    localStorage.removeItem("SERKAN_ITEM_RECLASSES");
    window.location.reload();
  }

  function editOrderEntries() {
    const cardOrders = Object.entries(state.cardOrders || {})
      .filter(([, codes]) => Array.isArray(codes) && codes.length)
      .map(([key, codes]) => ({ type: "cardOrder", key, count: codes.length, codes }));
    const itemOrders = Object.entries(state.itemOrders || {})
      .filter(([, codes]) => Array.isArray(codes) && codes.length)
      .map(([key, codes]) => ({ type: "itemOrder", key, count: codes.length, codes }));
    return { cardOrders, itemOrders };
  }

  function editChangeSummary() {
    const { cardOrders, itemOrders } = editOrderEntries();
    return {
      orderGroups: cardOrders.length + itemOrders.length,
      orderedCards: cardOrders.reduce((sum, entry) => sum + entry.count, 0) + itemOrders.reduce((sum, entry) => sum + entry.count, 0),
      reclassifications: state.itemReclasses.length,
    };
  }

  function editExportPayload() {
    return {
      exportedAt: new Date().toISOString(),
      source: "serkan-dashboard-prototype",
      summary: editChangeSummary(),
      cardOrders: state.cardOrders,
      itemOrders: state.itemOrders,
      itemReclasses: state.itemReclasses,
    };
  }

  function downloadEditExport() {
    const payload = editExportPayload();
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `serkan-dashboard-edits-${stamp}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("변경 내역 JSON을 내보냈습니다.");
  }

  function toggleEditMode() {
    state.editMode = !state.editMode;
    saveEditMode();
    updateEditModeUI();
    if (state.selected?.type === "editLog") renderDrawer();
    showToast(state.editMode ? "편집 모드 ON: 카드를 드래그할 수 있습니다." : "편집 모드 OFF: 카드 클릭 모드입니다.");
  }

  function cardOrderKey(...parts) {
    return parts.filter(Boolean).join(":");
  }

  function orderedCards(values, orderKey, getCode = (item) => item.code) {
    const order = Array.isArray(state.cardOrders[orderKey]) ? state.cardOrders[orderKey] : [];
    const rank = new Map(order.map((code, index) => [code, index]));
    return [...values].sort((a, b) => {
      const codeA = getCode(a);
      const codeB = getCode(b);
      const rankA = rank.has(codeA) ? rank.get(codeA) : Number.MAX_SAFE_INTEGER;
      const rankB = rank.has(codeB) ? rank.get(codeB) : Number.MAX_SAFE_INTEGER;
      if (rankA !== rankB) return rankA - rankB;
      return values.indexOf(a) - values.indexOf(b);
    });
  }

  function placeCardInOrder(orderKey, code, targetCode, placeAfter = false, currentCodes = []) {
    if (!orderKey || !code || code === targetCode) return null;
    const baseCodes = currentCodes.length
      ? currentCodes
      : Array.isArray(state.cardOrders[orderKey]) ? state.cardOrders[orderKey] : [];
    const codes = uniq(baseCodes).filter((entry) => entry && entry !== code);
    let insertIndex = targetCode ? codes.indexOf(targetCode) : codes.length;
    if (insertIndex < 0) insertIndex = codes.length;
    if (placeAfter && targetCode) insertIndex += 1;
    codes.splice(insertIndex, 0, code);
    state.cardOrders[orderKey] = codes;
    saveCardOrders();
    return { position: insertIndex + 1, total: codes.length };
  }

  function visibleSortCodesForGroup(group, root = document) {
    return $$("[data-sort-code]", root)
      .filter((entry) => entry.dataset.sortGroup === group)
      .map((entry) => entry.dataset.sortCode)
      .filter(Boolean);
  }

  function clearDragMarkers() {
    $$(".is-drop-target").forEach((entry) => entry.classList.remove("is-drop-target"));
    $$(".is-sort-target").forEach((entry) => entry.classList.remove("is-sort-target"));
    $$(".is-dragging").forEach((entry) => entry.classList.remove("is-dragging"));
  }

  function suppressNextClick() {
    state.suppressClick = true;
    window.clearTimeout(suppressNextClick.timer);
    suppressNextClick.timer = window.setTimeout(() => {
      state.suppressClick = false;
    }, 180);
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

  function cleanProductTopic(product) {
    const item = byCode.items.get(product?.itemCode);
    return (item?.name || product?.productName || "Product Group")
      .replace(/\s*(가성비|민감\/입문|프리미엄)\s*추천 제품\s*$/g, "")
      .replace(/\s*추천 제품\s*$/g, "")
      .trim();
  }

  function productGroupCode(product) {
    if (product?.itemCode) return product.itemCode;
    return String(product?.code || "").replace(/-P\d+$/i, "-PG");
  }

  function getProductGroups({ includeMock = true, sourceProducts = data.products } = {}) {
    const buckets = new Map();
    sourceProducts.forEach((product) => {
      const key = productGroupCode(product);
      if (!key) return;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(product);
    });
    return [...buckets.entries()].map(([code, allProducts]) => {
      const products = includeMock ? allProducts : allProducts.filter((product) => !isMockProduct(product));
      if (!products.length) return null;
      const first = allProducts[0];
      const item = byCode.items.get(code) || byCode.items.get(first.itemCode);
      const cat = byCode.categories.get(first.domain);
      const realCount = allProducts.filter((product) => !isMockProduct(product)).length;
      const recommendationTypes = uniq(allProducts.map((product) => product.recommendationType || product.brand));
      return {
        code,
        title: cleanProductTopic(first),
        domain: first.domain,
        category: first.category || cat?.name,
        item,
        cat,
        products,
        allProducts,
        realCount,
        mockCount: allProducts.length - realCount,
        recommendationTypes,
      };
    }).filter(Boolean);
  }

  function getProductGroupByCode(code) {
    return getProductGroups({ includeMock: true }).find((group) => group.code === code);
  }

  function getProductGroupsForItem(itemCode, options = {}) {
    return getProductGroups(options).filter((group) => group.code === itemCode || group.item?.code === itemCode);
  }

  function getProductGroupsForItems(items, options = {}) {
    const itemCodes = new Set(items.map((item) => item.code));
    return getProductGroups(options).filter((group) => itemCodes.has(group.code) || itemCodes.has(group.item?.code));
  }

  function productGroupSearchEntity(group) {
    return {
      code: group.code,
      title: group.title,
      productName: group.title,
      category: group.category,
      domain: group.domain,
      recommendationTypes: group.recommendationTypes,
      productCodes: group.allProducts.map((product) => product.code),
      searchText: [
        group.title,
        group.code,
        group.category,
        group.item?.role,
        ...group.recommendationTypes,
        ...group.allProducts.flatMap((product) => [product.productName, product.brand, ...(product.tags || [])]),
      ].join(" "),
    };
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
      entity.searchText,
      ...(entity.recommendationTypes || []),
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
    if (state.view === "products") {
      const productGroups = getProductGroups({ includeMock: true });
      const mockSlots = data.products.filter(isMockProduct).length;
      return `
        <div class="stats">
          <button class="stat stat-button" data-action="show-items"><span>◧ 전체 아이템 수</span><strong>${data.items.length}개</strong></button>
          <button class="stat stat-button" data-view="products"><span>▤ 제품 그룹 수</span><strong>${productGroups.length}개</strong></button>
          <button class="stat stat-button" data-view="products"><span>◇ Mock 제품 슬롯</span><strong>${mockSlots}개</strong></button>
          <button class="stat stat-button" data-view="products"><span>◷ 최근 업데이트</span><strong>${formatDate(data.generatedAt)}</strong></button>
        </div>
      `;
    }
    return `
      <div class="stats">
        <button class="stat stat-button" data-view="manuals"><span>📘 전체 매뉴얼</span><strong>${data.manuals.length}개</strong></button>
        <button class="stat stat-button" data-view="products"><span>🧴 관련 아이템</span><strong>${data.items.length}개</strong></button>
        <button class="stat stat-button" data-view="products"><span>🛍️ 관련 제품</span><strong>${data.products.length}개</strong></button>
        <button class="stat stat-button" data-view="dashboard"><span>☀️ 루틴 보드</span><strong>${daily + weekly}개</strong></button>
      </div>
    `;
  }

  function formatDate(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return "2026.06.12";
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}.${mm}.${dd}`;
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
    if (isWeekly) return renderWeeklyExecutionBoard();
    const routines = data.routines.filter((routine) => routine.board === kind);
    const groups = new Map();
    if (kind === "daily") dailyFlowGroups.forEach((group) => groups.set(group.label, []));
    routines.forEach((routine) => {
      const label = kind === "daily"
        ? dailyGroupForRoutine(routine)
        : routine.timeBlocks[0] && routine.timeBlocks[0] !== "불명확" ? routine.timeBlocks[0] : categoryName(routine.domain);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(routine);
    });
    const groupEntries = kind === "daily"
      ? dailyFlowGroups.map((group) => [group.label, groups.get(group.label) || []]).filter(([, groupRoutines]) => groupRoutines.length)
      : Array.from(groups.entries());

    return `
      <article class="board ${isWeekly ? "weekly-board" : "daily-board"}" id="${isWeekly ? "weekly-board" : "daily-board"}">
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
        ${groupEntries.slice(0, 6).map(([group, groupRoutines]) => renderRoutineGroup(group, groupRoutines, isWeekly)).join("")}
        <button class="board-cta" data-view="manuals">전체 ${isWeekly ? "Weekly" : "Daily"} Routine 매뉴얼 보기 →</button>
      </article>
    `;
  }

  function renderRoutineGroup(group, routines, isWeekly) {
    const meta = dailySectionMeta[group] || {};
    const icon = meta.icon || iconForGroup(group);
    const key = groupKey(isWeekly ? "weekly" : "daily", group);
    const expanded = Boolean(state.expandedGroups[key]);
    const orderKey = cardOrderKey("routine", isWeekly ? "weekly" : "daily", group);
    const orderedRoutines = orderedCards(routines, orderKey);
    const visibleLimit = 5;
    const visibleRoutines = isWeekly && expanded ? orderedRoutines : orderedRoutines.slice(0, visibleLimit);
    const pills = visibleRoutines.map((routine) => `
      <button class="routine-chip clickable" draggable="true" data-open-type="routine" data-code="${esc(routine.code)}" data-sort-kind="routine" data-sort-group="${esc(orderKey)}" data-sort-code="${esc(routine.code)}">
        <strong>${esc(routine.title)}</strong>
        <span>${esc(isWeekly ? routine.frequency || routine.priority : group)}</span>
      </button>
    `).join("");
    const moreButton = routines.length > 5
      ? isWeekly
        ? `<button class="more-card" data-action="show-group" data-group="${esc(group)}" data-kind="weekly" aria-expanded="${expanded ? "true" : "false"}"><span>${expanded ? "접기" : "전체"}</span>${expanded ? "↑" : "→"}</button>`
        : `<button class="more-card daily-more-card" data-action="open-daily-library" data-group="${esc(group)}"><span>+${routines.length - visibleLimit}개</span>더 보기</button>`
      : "";
    return `
      <div class="routine-group ${isWeekly ? "weekly" : "daily-library-section"}" style="${!isWeekly ? `--section-tint:${meta.tint || "#fff8f7"};--section-accent:${meta.accent || "#e85d68"};--section-border:${meta.border || "#f1d8d4"};` : ""}">
        <div class="group-head">
          <div class="group-title">
            <span class="group-emoji">${esc(icon)}</span>
            <div>
              <strong>${esc(group)}</strong>
              <small>${esc(meta.desc || `${group} 루틴`)}</small>
            </div>
          </div>
          <div class="group-actions">
            <span>${routines.length}개 루틴</span>
            ${!isWeekly ? `<button class="group-open" data-action="open-daily-library" data-group="${esc(group)}">전체 →</button>` : ""}
          </div>
        </div>
        <div class="routine-strip" data-sort-container="${esc(orderKey)}">
          ${pills}
          ${moreButton}
        </div>
      </div>
    `;
  }

  const dailyFlowGroups = [
    { label: "기상", terms: ["기상", "아침", "일어나", "물 한잔", "햇빛", "침구 정리", "세안", "샤워", "선크림", "구강", "칫솔"] },
    { label: "업무", terms: ["업무", "집중", "작업", "책상", "데스크", "스마트폰", "눈높이", "회의", "메일", "파일"] },
    { label: "점심", terms: ["점심", "식사", "식후", "영양제", "단백질", "카페인", "수분", "물", "걷기"] },
    { label: "오후", terms: ["오후", "리셋", "스트레칭", "피로", "눈", "목", "어깨", "휴식", "보충"] },
    { label: "저녁", terms: ["저녁", "귀가", "운동", "샤워", "관계", "사회", "독서", "정리", "식단"] },
    { label: "수면", terms: ["수면", "취침", "잠", "침구", "습도", "조명", "디지털", "전자기기", "명상", "침실"] },
  ];

  function dailyGroupForRoutine(routine) {
    const text = [routine.title, routine.category, ...(routine.tags || []), ...(routine.timeBlocks || [])].join(" ");
    const matched = dailyFlowGroups.find((group) => group.terms.some((term) => text.includes(term)));
    return matched?.label || "오후";
  }

  const weekDays = [
    { key: "월", label: "월요일", color: "#ef4444", terms: ["상체", "업무 공간", "리필", "풀업", "목", "수면 질", "근력", "등 상부", "마그네슘", "비타민B"] },
    { key: "화", label: "화요일", color: "#f97316", terms: ["유산소", "재고", "수납", "러닝", "확인", "전력 질주", "전해질", "신발", "가방", "보풀"] },
    { key: "수", label: "수요일", color: "#eab308", terms: ["하체", "두피", "영양제", "레티놀", "눈썹", "피부", "헤어라인", "턱라인", "T존", "U존"] },
    { key: "목", label: "목요일", color: "#22a447", terms: ["스트레칭", "욕실", "침구 점검", "반신욕", "정리", "거울", "변기", "바닥", "진정", "스팀타월"] },
    { key: "금", label: "금요일", color: "#2f80d8", terms: ["전신", "업무 파일", "식단 점검", "데드리프트", "사우나", "마사지", "스쿼트랙", "웨이트", "전완"] },
    { key: "토", label: "토요일", color: "#8b5cf6", terms: ["침구 세탁", "면도날", "옷장", "장보기", "세탁", "청소", "수납장", "싱크대", "먼지", "마른 세탁물"] },
    { key: "일", label: "일요일", color: "#ec4899", terms: ["회고", "다음주", "냉장고", "산책", "마스크팩", "손톱", "가르마", "계획", "발톱", "큐티클", "전자기기 없이"] },
  ];

  const weeklyDomainAffinity = {
    BD: { 월: 2, 수: 2, 금: 2, 화: 1, 목: 1 },
    SP: { 토: 3, 목: 2, 화: 1 },
    FD: { 화: 2, 금: 2, 일: 1 },
    SK: { 수: 2, 목: 2, 일: 1 },
    GR: { 토: 2, 일: 2, 수: 1 },
    ST: { 화: 2, 수: 2, 일: 1 },
    SL: { 월: 2, 목: 2, 일: 1 },
    SY: { 금: 2, 일: 2, 월: 1 },
  };

  const monthlyRoutineCandidates = ["계절 침구 교체", "운동 목표 점검", "영양제 재구매", "향수 교체", "의류 정리", "대청소"];
  const seasonalRoutineBuckets = {
    봄: ["자외선 관리", "침구 교체"],
    여름: ["자외선 관리", "제습기 관리"],
    가을: ["침구 교체", "피부 장벽 관리"],
    겨울: ["가습기 관리", "보습 루틴 점검"],
  };

  function renderWeeklyExecutionBoard() {
    const routines = data.routines.filter((routine) => routine.board === "weekly");
    const columns = weeklyColumns(routines);
    return `
      <article class="board weekly-board weekly-execution-board" id="weekly-board">
        <div class="board-head weekly-planner-head">
          <div class="board-title">
            <div class="orb weekly">📅</div>
            <div>
              <h2>Weekly Routine Overview</h2>
              <p>이번 주에 실행할 정기 관리 루틴을 요일별로 정리했습니다.</p>
            </div>
          </div>
          <div class="weekly-actions">
            <span class="count weekly">총 ${routines.length}개 루틴</span>
            <span class="weekly-date">자동 균형 배치</span>
          </div>
        </div>
        <div class="weekly-board-grid">
          ${columns.map(renderWeeklyDayColumn).join("")}
        </div>
        <div class="weekly-planning-note">
          <strong>Monthly / Seasonal 분리 기준</strong>
          <span>월간 후보: ${monthlyRoutineCandidates.join(" · ")}</span>
          <span>계절 후보: ${Object.entries(seasonalRoutineBuckets).map(([season, items]) => `${season} ${items.length}개`).join(" · ")}</span>
        </div>
      </article>
    `;
  }

  function weeklyColumns(routines) {
    const columns = weekDays.map((day) => ({ ...day, routines: [] }));
    const byKey = new Map(columns.map((column) => [column.key, column]));
    const targetCount = Math.ceil(routines.length / weekDays.length);
    routines
      .slice()
      .sort((a, b) => weeklyFlexibility(a) - weeklyFlexibility(b) || a.code.localeCompare(b.code))
      .forEach((routine, index) => {
        const day = chooseWeeklyDay(routine, columns, byKey, targetCount, index);
        byKey.get(day).routines.push(routine);
      });
    columns.forEach((column) => {
      column.routines.sort((a, b) => weeklyRoutinePriority(a) - weeklyRoutinePriority(b) || a.title.localeCompare(b.title, "ko"));
    });
    return columns;
  }

  function normalizeWeekdays(weekday) {
    const aliases = { 월요일: "월", 화요일: "화", 수요일: "수", 목요일: "목", 금요일: "금", 토요일: "토", 일요일: "일" };
    const values = Array.isArray(weekday)
      ? weekday
      : String(weekday || "").split(/[,\s/]+/).filter(Boolean);
    return values
      .map((day) => aliases[day] || day)
      .filter((day) => weekDays.some((entry) => entry.key === day));
  }

  function inferWeeklyDay(routine, index) {
    const matched = rankedWeeklyDays(routine).find((day) => day.score > 0);
    return matched?.key || weekDays[index % weekDays.length].key;
  }

  function chooseWeeklyDay(routine, columns, byKey, targetCount, index) {
    const ranked = rankedWeeklyDays(routine);
    const preferredUnderTarget = ranked.find((day) => day.score > 0 && byKey.get(day.key).routines.length < targetCount);
    if (preferredUnderTarget) return preferredUnderTarget.key;

    const leastBusy = leastBusyWeeklyColumn(columns);
    const bestPreferred = ranked.find((day) => day.score > 0);
    if (!bestPreferred) return leastBusy.key || inferWeeklyDay(routine, index);

    const bestPreferredColumn = byKey.get(bestPreferred.key);
    if (leastBusy.routines.length + 1 < bestPreferredColumn.routines.length) return leastBusy.key;
    if (bestPreferredColumn.routines.length < targetCount + 1) return bestPreferred.key;
    return leastBusy.key;
  }

  function rankedWeeklyDays(routine) {
    const originalDays = new Set(normalizeWeekdays(routine.weekday));
    const text = [routine.title, routine.category, ...(routine.tags || []), ...(routine.timeBlocks || [])].join(" ");
    const affinity = weeklyDomainAffinity[routine.domain] || {};
    return weekDays
      .map((day, index) => {
        const termHits = day.terms.filter((term) => text.includes(term)).length;
        const score = (originalDays.has(day.key) ? 6 : 0) + (termHits * 5) + (affinity[day.key] || 0);
        return { key: day.key, score, index };
      })
      .sort((a, b) => b.score - a.score || a.index - b.index);
  }

  function weeklyFlexibility(routine) {
    const strongOptions = rankedWeeklyDays(routine).filter((day) => day.score >= 6).length;
    return strongOptions || weekDays.length;
  }

  function weeklyRoutinePriority(routine) {
    const text = [routine.title, ...(routine.tags || [])].join(" ");
    if (/운동|웨이트|풀업|데드리프트|스쿼트|유산소|질주|스트레칭/.test(text)) return 1;
    if (/청소|세탁|정리|수납|싱크대|변기|먼지|침구/.test(text)) return 2;
    if (/면도|눈썹|손톱|발톱|헤어|피부|레티놀|마스크팩/.test(text)) return 3;
    if (/식단|영양제|전해질|비타민|단백질/.test(text)) return 4;
    return 5;
  }

  function leastBusyWeeklyColumn(columns) {
    return columns.reduce((least, column) => {
      if (column.routines.length < least.routines.length) return column;
      return least;
    }, columns[0]);
  }

  function groupedRoutinesByCategory(routines) {
    const groups = new Map(commonCategoryOrder.map((code) => [code, []]));
    routines.forEach((routine) => {
      if (!groups.has(routine.domain)) groups.set(routine.domain, []);
      groups.get(routine.domain).push(routine);
    });
    return [...groups.entries()]
      .map(([domain, groupRoutines]) => ({ domain, routines: groupRoutines }))
      .filter((group) => group.routines.length);
  }

  function renderWeeklyDayColumn(day) {
    const orderKey = cardOrderKey("routine", "weekly", day.key);
    const routines = orderedCards(day.routines, orderKey);
    const completedRoutines = routines.filter((routine) => isWeeklyDone(day.key, routine.code));
    const pendingRoutines = routines.filter((routine) => !isWeeklyDone(day.key, routine.code));
    const categories = groupedRoutinesByCategory(pendingRoutines);
    const total = routines.length;
    const completed = completedRoutines.length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    return `
      <section class="weekly-day-column" style="--day-color:${day.color};">
        <div class="weekly-day-head">
          <div>
            <strong>${esc(day.label)}</strong>
            <span>${total}개 루틴</span>
          </div>
          <b>${percent}%</b>
        </div>
        <div class="weekly-progress" aria-label="${esc(day.label)} 완료율 ${percent}%">
          <i style="width:${percent}%;"></i>
        </div>
        <div class="weekly-task-list" data-sort-container="${esc(orderKey)}">
          ${completedRoutines.length ? renderWeeklyCompletedBlock(day.key, completedRoutines, orderKey) : ""}
          ${categories.length ? categories.map((category) => renderWeeklyCategoryBlock(day.key, category, orderKey)).join("") : (!completedRoutines.length ? `<div class="weekly-empty">배정된 루틴 없음</div>` : "")}
        </div>
        <button class="weekly-add" data-action="weekly-add" data-day="${esc(day.key)}">+ 루틴 추가</button>
      </section>
    `;
  }

  function renderWeeklyCompletedBlock(dayKey, routines, orderKey) {
    return `
      <section class="weekly-completed-block">
        <div class="weekly-category-title">
          <span>✅</span>
          <strong>완료한 루틴</strong>
        </div>
        ${routines.map((routine) => renderWeeklyTaskPill(dayKey, routine, orderKey)).join("")}
      </section>
    `;
  }

  function renderWeeklyCategoryBlock(dayKey, category, orderKey) {
    const cat = byCode.categories.get(category.domain);
    return `
      <section class="weekly-category-block" style="--cat-accent:${cat?.accent || "var(--day-color)"};">
        <div class="weekly-category-title">
          <span>${esc(categoryVisual[category.domain]?.icon || cat?.icon || "◇")}</span>
          <strong>${esc(cat?.name || category.domain)}</strong>
        </div>
        ${category.routines.map((routine) => renderWeeklyTaskPill(dayKey, routine, orderKey)).join("")}
      </section>
    `;
  }

  function renderWeeklyTaskPill(dayKey, routine, orderKey) {
    const checked = isWeeklyDone(dayKey, routine.code);
    return `
      <div class="weekly-task-pill clickable ${checked ? "is-done" : ""}" draggable="true" role="button" tabindex="0" data-action="open-weekly-routine" data-code="${esc(routine.code)}" data-sort-kind="routine" data-sort-group="${esc(orderKey)}" data-sort-code="${esc(routine.code)}" aria-label="${esc(routine.title)} 상세 열기">
        <input type="checkbox" ${checked ? "checked" : ""} data-action="toggle-weekly" data-day="${esc(dayKey)}" data-code="${esc(routine.code)}" aria-label="${esc(routine.title)} 완료">
        <strong>${esc(routine.title)}</strong>
        <span>${esc(routine.frequency || routine.priority || "Weekly")}</span>
      </div>
    `;
  }

  function weeklyDoneKey(dayKey, code) {
    return `${dayKey}:${code}`;
  }

  function isWeeklyDone(dayKey, code) {
    return Boolean(state.weeklyDone[weeklyDoneKey(dayKey, code)]);
  }

  function toggleWeeklyDone(dayKey, code) {
    const key = weeklyDoneKey(dayKey, code);
    state.weeklyDone[key] = !state.weeklyDone[key];
    saveWeeklyDone();
    render();
    scrollAfterRender("#weekly-board", "auto");
  }

  function groupKey(kind, group) {
    return `${kind}:${group}`;
  }

  function toggleRoutineGroup(kind, group) {
    const key = groupKey(kind, group);
    state.expandedGroups[key] = !state.expandedGroups[key];
    render();
  }

  function iconForGroup(group) {
    return groupIcons.find(([keyword]) => group.includes(keyword))?.[1] || "◇";
  }

  function iconForSituation(title) {
    return situationIcons.find(([keyword]) => title.includes(keyword))?.[1] || "🚨";
  }

  function iconForItem(item) {
    const text = [item?.name, item?.category].join(" ");
    const match = itemIconRules.find(([pattern]) => new RegExp(pattern).test(text));
    if (match) return match[1];
    return categoryVisual[item?.domain]?.icon || "◧";
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
    const orderKey = cardOrderKey("manualCategory", "all");
    const categories = orderedCards(data.categories.filter((cat) => cat.manualCount > 0), orderKey);
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
        <div class="manual-grid" data-sort-container="${esc(orderKey)}">
          ${categories.slice(0, compact ? 8 : categories.length).map((category) => renderManualCategoryCard(category, orderKey)).join("")}
        </div>
      </section>
    `;
  }

  function renderManualCategoryCard(category, orderKey) {
    const manuals = data.manuals.filter((manual) => manual.domain === category.code).slice(0, 4);
    const visual = categoryVisual[category.code] || { icon: category.icon, desc: `${category.label} 매뉴얼` };
    return `
      <button class="category-card clickable" draggable="true" style="--tint:${category.tint};--accent:${category.accent};" data-open-type="category" data-code="${esc(category.code)}" data-sort-kind="manualCategory" data-sort-group="${esc(orderKey)}" data-sort-code="${esc(category.code)}">
        <div class="category-top"><div class="cat-icon">${esc(visual.icon)}</div><div class="arrow">→</div></div>
        <h3>${esc(category.name)} <span>${esc(category.label)}</span></h3>
        <p>${esc(visual.desc)}</p>
        <div class="meta-line"><span>매뉴얼 ${category.manualCount}개</span><span>아이템 ${category.itemCount}개</span><span>제품 ${category.productCount}개</span></div>
        <div class="tag-row">${manuals.map((manual) => `<span class="tag">${esc(manual.title)}</span>`).join("")}</div>
      </button>
    `;
  }

  function renderProducts({ compact = false } = {}) {
    const categories = productHubCategories();
    return `
      <section class="section-card" id="products">
        <div class="section-head">
          <div>
            <h2>SR26-PD / Product Group &amp; Item Encyclopedia</h2>
            <div class="eyebrow">모든 제품군과 아이템을 카테고리별로 탐색하고, 카테고리 안에서 Product Group을 확인합니다.</div>
          </div>
          <div class="segmented">
            <button class="active" data-view="products">제품</button>
            <button data-action="show-items">아이템</button>
            <button data-view="manuals">매뉴얼</button>
          </div>
        </div>
        <div class="product-grid product-hub-grid">
          ${categories.map(renderProductHubCard).join("")}
          ${renderAllProductsHubCard()}
        </div>
        <details class="item-collapse">
          <summary>
            <span>Item Encyclopedia</span>
            <em>전체 ${data.items.length}개 아이템 카테고리별 펼쳐보기</em>
          </summary>
          <div class="reclass-toolbar">
            <span>같은 카테고리 안에서는 순서 변경, 다른 카테고리로 옮기면 SERKAN CODE가 자동 재발급됩니다.</span>
            <button data-action="show-reclass-log">변경 내역 ${state.itemReclasses.length}개</button>
            <button data-action="reset-order">순서 초기화</button>
            <button data-action="reset-reclass">재분류 초기화</button>
          </div>
          <div class="item-category-stack">
            ${itemHubCategories().map(renderItemCategorySection).join("")}
          </div>
        </details>
      </section>
    `;
  }

  function productHubCategories() {
    const order = ["SK", "BD", "FD", "SL", "ST", "MT", "SO", "SP", "SY"];
    return order.map((code) => byCode.categories.get(code)).filter(Boolean);
  }

  function itemHubCategories() {
    return data.categories.filter((category) => data.items.some((item) => item.domain === category.code));
  }

  function renderItemCategorySection(category) {
    const visual = categoryVisual[category.code] || { icon: category.icon, desc: `${category.label} 아이템` };
    const items = orderedItemsForCategory(category.code);
    const productGroups = getProductGroups({ includeMock: true, sourceProducts: data.products.filter((product) => product.domain === category.code) });
    return `
      <section class="item-category-section" style="--tint:${category.tint};--accent:${category.accent};" data-drop-domain="${esc(category.code)}">
        <div class="item-category-head">
          <div class="cat-icon">${esc(visual.icon)}</div>
          <div>
            <h3>${esc(category.name)} <span>${esc(category.label)}</span></h3>
            <p>${esc(productHubCopy(category.code))}</p>
          </div>
          <div class="meta-line"><span>아이템 ${items.length}개</span><span>제품 그룹 ${productGroups.length}개</span></div>
        </div>
        <div class="item-grid item-category-grid">
          ${items.map(renderItemCard).join("")}
        </div>
      </section>
    `;
  }

  function renderProductGroupCard(group) {
    const cat = group.cat || byCode.categories.get(group.domain);
    const products = group.allProducts.slice(0, 3);
    const statusText = group.realCount ? `실제품 ${group.realCount}개` : "Mock 상태";
    return `
      <button class="product-card product-group-card clickable" style="--tint:${cat?.tint || "#fff"};--accent:${cat?.accent || "var(--ink)"};" data-open-type="productGroup" data-code="${esc(group.code)}">
        <div class="product-card-head">
          <div class="cat-icon" style="color:${cat?.accent || "var(--ink)"};">${esc(categoryVisual[group.domain]?.icon || cat?.icon || "▤")}</div>
          <span class="code-label">${esc(group.code.replace(/-C\d+$/i, ""))}</span>
        </div>
        <h3>${esc(group.title)}</h3>
        <p>${esc(group.item?.role || `${group.category || "Product"} 추천 슬롯 그룹`)}</p>
        <div class="meta-line">
          <span>Product ${group.allProducts.length}개</span>
          <span>${esc(statusText)}</span>
        </div>
        <div class="product-preview-list">
          ${products.map((product) => `<span>${esc(productPreviewLabel(product))}</span>`).join("")}
        </div>
        <div class="tag-row">
          ${group.recommendationTypes.slice(0, 4).map((type) => `<span class="tag">${esc(type)}</span>`).join("")}
        </div>
      </button>
    `;
  }

  function productPreviewLabel(product) {
    if (isMockProduct(product)) return `${product.recommendationType || "추천"} 슬롯`;
    return product.productName;
  }

  function renderProductHubCard(category) {
    const visual = categoryVisual[category.code] || { icon: category.icon, desc: `${category.label} 아이템과 제품` };
    const items = data.items.filter((item) => item.domain === category.code);
    const productGroups = getProductGroups({ includeMock: true, sourceProducts: data.products.filter((product) => product.domain === category.code) });
    return `
      <button class="product-card product-hub-card clickable" style="--tint:${category.tint};--accent:${category.accent};" data-open-type="category" data-code="${esc(category.code)}">
        <div class="product-card-head">
          <div class="cat-icon">${esc(visual.icon)}</div>
          <span class="code-label">→</span>
        </div>
        <h3>${esc(category.name)} <span>${esc(category.label)} 아이템 &amp; 제품</span></h3>
        <p>${esc(productHubCopy(category.code))}</p>
        <div class="meta-line"><span>아이템 ${items.length}개</span><span>제품 그룹 ${productGroups.length}개</span></div>
        <div class="product-objects placeholder-objects" aria-label="${esc(category.name)} 제품 데이터 연결 예정">
          <div class="object-art bottle">${esc(category.code)}</div>
          <div class="object-art jar">Item</div>
          <div class="object-art box">${esc(productGroups.length)}</div>
        </div>
        <div class="tag-row">
          ${items.slice(0, 5).map((item) => `<span class="tag">${esc(item.name)}</span>`).join("")}
        </div>
      </button>
    `;
  }

  function renderAllProductsHubCard() {
    const groups = getProductGroups({ includeMock: true });
    return `
      <button class="product-card product-hub-card product-all-card clickable" style="--tint:#f7f9ff;--accent:#4d84cc;" data-open-type="productCollection" data-code="ALL">
        <div class="product-card-head">
          <div class="cat-icon">⌘</div>
          <span class="code-label">→</span>
        </div>
        <h3>전체 아이템 &amp; 제품 <span>모든 카테고리 한눈에 보기</span></h3>
        <p>전체 아이템과 제품 그룹을 검색하고 카테고리 없이 탐색할 수 있습니다.</p>
        <div class="meta-line"><span>아이템 ${data.items.length}개</span><span>제품 그룹 ${groups.length}개</span></div>
        <div class="product-objects placeholder-objects is-overview" aria-label="전체 아이템과 제품">
          <div class="object-art lens">⌕</div>
          <div class="object-art jar">All</div>
          <div class="object-art box">${esc(groups.length)}</div>
        </div>
        <div class="tag-row">
          <span class="tag">전체 목록</span>
          <span class="tag">검색</span>
          <span class="tag">연동 관리</span>
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
    const productGroups = getProductGroupsForItem(item.code, { includeMock: true });
    const dragReclassified = Boolean(item.dragReclassified);
    return `
      <button class="item-card clickable ${dragReclassified ? "is-reclassified" : ""}" draggable="true" data-open-type="item" data-code="${esc(item.code)}" data-item-code="${esc(item.code)}">
        <div class="cat-icon" style="color:${cat?.accent || "var(--ink)"};">${esc(iconForItem(item))}</div>
        <strong>${esc(item.name)}</strong>
        <span>${esc(item.code)}</span>
        <p>${esc(item.role)}</p>
        <div class="meta-line"><span>매뉴얼 ${item.manualCodes.length}개</span><span>제품 그룹 ${productGroups.length}개</span></div>
        ${dragReclassified ? `<div class="reclass-badge">${esc(item.previousDomain || item.reclassOriginalCode?.split("-")[1] || "이전")} → ${esc(item.domain)}</div>` : ""}
      </button>
    `;
  }

  function renderSituations({ compact = false } = {}) {
    const mentalOrderKey = cardOrderKey("situation", "Mental");
    const socialOrderKey = cardOrderKey("situation", "Social");
    const mental = orderedCards(data.situations.filter((situation) => situation.type.includes("Mental")), mentalOrderKey);
    const social = orderedCards(data.situations.filter((situation) => situation.type.includes("Social")), socialOrderKey);
    const mentalCategories = buildSituationCategories("Mental", mental);
    const socialCategories = buildSituationCategories("Social", social);
    const visibleCategories = visibleSituationCategories(mentalCategories, socialCategories);
    const detailCount = visibleCategories.reduce((sum, category) => sum + category.items.length, 0);
    const selectedCategory = getSelectedSituationCategory(mentalCategories, socialCategories);
    return `
      <section class="section-card" id="situations">
        <div class="section-head">
          <div>
            <h2>SR26-MT-SO / Situation Dashboard</h2>
            <div class="eyebrow">지금 상태에 가까운 상황 카테고리를 고르면 관련 상세 매뉴얼을 좁혀 보여줍니다.</div>
          </div>
          <div class="segmented">
            <button class="${state.situationFilter === "all" ? "active" : ""}" data-action="filter-situation" data-type="all">전체</button>
            <button class="${state.situationFilter === "Mental" ? "active" : ""}" data-action="filter-situation" data-type="Mental">Mental</button>
            <button class="${state.situationFilter === "Social" ? "active" : ""}" data-action="filter-situation" data-type="Social">Social</button>
          </div>
        </div>
        <div class="situation">
          ${renderSituationRanking("🧠 Mental Management", mentalCategories, false)}
          ${renderSituationRanking("🤝 Social Management", socialCategories, true)}
        </div>
        <section class="situation-manual-section">
          <div class="subsection-label">
            <strong>${esc(selectedCategory ? `${selectedCategory.title} Detail Manuals` : "Situation Detail Manuals")}</strong>
            <span>${detailCount}개 세부 매뉴얼 · ${selectedCategory ? "선택한 상황 카테고리" : "카테고리별 묶음"} · 클릭 시 상세 Drawer</span>
          </div>
          <div class="situation-detail-grid">
            ${renderSituationDetailGroups(visibleCategories, compact)}
          </div>
        </section>
      </section>
    `;
  }

  function renderSituationRanking(title, categories, social) {
    const visible = categories.slice(0, 5);
    const situations = categories.flatMap((category) => category.items);
    const manuals = situations.filter((situation) => situation.manualCode).length;
    const relatedItems = situations.flatMap((situation) => getSituationItems(situation));
    const itemCount = relatedItems.length;
    const productGroups = getProductGroupsForItems(relatedItems, { includeMock: false }).length;
    return `
      <div class="ranking ${social ? "social" : ""}">
        <div class="situation-summary">
          <div>
            <h3>${esc(title)}</h3>
            <p>${social ? "관계, 대화, 첫인상 상황을 먼저 고릅니다." : "감정, 집중, 회복 상황을 먼저 고릅니다."}</p>
          </div>
          <div><strong>${categories.length}</strong><span>상황 카테고리</span></div>
        </div>
        <div class="situation-stat-row">
          <span>매뉴얼 ${manuals}개</span>
          <span>아이템 ${itemCount}개</span>
          <span>제품 그룹 ${productGroups}개</span>
        </div>
        <div class="situation-top-label">대표 상황 TOP 5</div>
        <div class="situation-category-stack">
          ${visible.map((category, index) => renderSituationCategoryCard(category, index >= 3)).join("")}
        </div>
      </div>
    `;
  }

  function renderSituationCategoryCard(category, compact = false) {
    const productGroupCount = getSituationCategoryProductGroupCount(category);
    if (compact) {
      return `
        <button class="situation-category-row clickable ${state.selectedSituationCategory === category.key ? "is-selected" : ""}" data-action="select-situation-category" data-category-key="${esc(category.key)}">
          <span class="category-row-icon">${esc(category.icon)}</span>
          <span><strong>${esc(category.title)}</strong><em>${esc(category.desc)}</em></span>
          <b>매뉴얼 ${category.manualCount}</b>
          <b>아이템 ${category.itemCount}</b>
          <b>제품 그룹 ${productGroupCount}</b>
          <i>→</i>
        </button>
      `;
    }
    const manuals = getRepresentativeSituationManuals(category, 3);
    const recent = getRecentSituationManuals(category, 2);
    return `
      <button class="situation-category-card clickable ${state.selectedSituationCategory === category.key ? "is-selected" : ""}" data-action="select-situation-category" data-category-key="${esc(category.key)}">
        <div class="situation-category-card-head">
          <span class="category-card-icon">${esc(category.icon)}</span>
          <div>
            <strong>${esc(category.title)}</strong>
            <p>${esc(category.desc)}</p>
          </div>
          <i>→</i>
        </div>
        <div class="category-card-stats">
          <span><em>매뉴얼</em><b>${esc(category.manualCount)}</b></span>
          <span><em>아이템</em><b>${esc(category.itemCount)}</b></span>
          <span><em>제품 그룹</em><b>${esc(productGroupCount)}</b></span>
        </div>
        <div class="category-card-body">
          <div>
            <small>대표 매뉴얼 TOP 3</small>
            <div class="category-manual-list">
              ${manuals.map((situation) => `<span><strong>${esc(situation.title)}</strong><em>${esc(situation.manualCode || situation.code)}</em></span>`).join("") || `<span><strong>연결 대기</strong><em>pending</em></span>`}
            </div>
          </div>
          <div>
            <small>최근 추가 매뉴얼</small>
            <div class="category-recent-list">
              ${recent.map((situation) => `<span><strong>${esc(situation.title)}</strong><em>${esc(situation.manualCode || situation.code)}</em></span>`).join("") || `<span><strong>연결 대기</strong><em>pending</em></span>`}
            </div>
          </div>
          <div>
            <small>대표 액션</small>
            <ul>${(category.actions || []).slice(0, 3).map((action) => `<li>${esc(action)}</li>`).join("")}</ul>
          </div>
        </div>
      </button>
    `;
  }

  function getRepresentativeSituationManuals(category, limit) {
    return category.items.filter((situation) => situation.manualCode).slice(0, limit);
  }

  function getRecentSituationManuals(category, limit) {
    return category.items.filter((situation) => situation.manualCode).slice(-limit).reverse();
  }

  function getSituationCategoryProductGroupCount(category) {
    return getProductGroupsForItems(category.items.flatMap((situation) => getSituationItems(situation)), { includeMock: false }).length;
  }

  function renderSituationDetailGroups(categories, compact) {
    return categories.map((category) => {
      const items = compact ? category.items.slice(0, 6) : category.items;
      const productGroupCount = getProductGroupsForItems(category.items.flatMap((situation) => getSituationItems(situation)), { includeMock: false }).length;
      return `
      <section class="situation-detail-category ${category.type === "Social" ? "is-social" : ""}">
        <div class="situation-category-dashboard ${state.selectedSituationCategory === category.key ? "is-active" : ""}">
          <div class="situation-category-main">
            <span class="situation-category-icon">${esc(category.icon)}</span>
            <div>
              <strong>${esc(category.title)}</strong>
              <p>${esc(category.desc)}</p>
            </div>
          </div>
          <div class="situation-category-stats">
            <span><b>${esc(category.manualCount)}</b>매뉴얼</span>
            <span><b>${esc(category.itemCount)}</b>아이템</span>
            <span><b>${esc(productGroupCount)}</b>제품 그룹</span>
          </div>
          <div class="situation-category-actions">
            <em>대표 액션</em>
            ${(category.actions || []).slice(0, 3).map((action) => `<span>${esc(action)}</span>`).join("")}
          </div>
        </div>
        ${items.length ? renderSituationManualCards(items) : `<div class="empty">연결된 세부 매뉴얼이 없습니다.</div>`}
      </section>
    `;
    }).join("");
  }

  function buildSituationCategories(type, situations) {
    const defs = situationCategoryDefs[type] || [];
    const fallback = {
      key: `${type.toLowerCase()}-etc`,
      icon: type === "Social" ? "◇" : "◎",
      title: type === "Social" ? "기타 관계 상황" : "기타 멘탈 상황",
      desc: "추가 분류가 필요한 상황",
      keywords: [],
    };
    const groups = [...defs, fallback].map((def) => ({ ...def, type, items: [] }));
    situations.forEach((situation) => {
      const text = searchableText(situation);
      const matched = groups.find((group) => group.key !== fallback.key && group.keywords.some((keyword) => text.includes(keyword.toLowerCase())));
      (matched || groups[groups.length - 1]).items.push(situation);
    });
    return groups
      .map((group) => ({
        ...group,
        manualCount: group.items.filter((situation) => situation.manualCode).length,
        itemCount: group.items.flatMap((situation) => getSituationItems(situation)).length,
      }))
      .filter((group) => group.key !== fallback.key || group.items.length);
  }

  function visibleSituationCategories(mentalCategories, socialCategories) {
    const all = state.situationFilter === "Mental"
      ? mentalCategories
      : state.situationFilter === "Social" ? socialCategories : [...mentalCategories, ...socialCategories];
    if (!state.selectedSituationCategory) return all.filter((category) => category.items.length);
    const selected = all.find((category) => category.key === state.selectedSituationCategory);
    return selected ? [selected] : all;
  }

  function getSelectedSituationCategory(mentalCategories, socialCategories) {
    if (!state.selectedSituationCategory) return null;
    return [...mentalCategories, ...socialCategories].find((category) => category.key === state.selectedSituationCategory) || null;
  }

  function renderSituationManualCards(situations) {
    return `
      <div class="manual-cards">
        ${situations.map((situation) => {
          const manual = byCode.manuals.get(situation.manualCode);
          const items = getSituationItems(situation);
          const productGroups = getProductGroupsForItems(items, { includeMock: false });
          const actions = situationActions(situation, manual);
          const orderKey = cardOrderKey("situation", situation.type.includes("Social") ? "Social" : "Mental");
          return `
            <button class="manual-card situation-manual-card clickable" draggable="true" data-open-type="situation" data-code="${esc(situation.code)}" data-sort-kind="situation" data-sort-group="${esc(orderKey)}" data-sort-code="${esc(situation.code)}">
              <div class="situation-card-top">
                <div class="situation-card-icon">${esc(iconForSituation(situation.title))}</div>
                <span>${esc(situation.priority || "관리")}</span>
              </div>
              <h4>${esc(situation.title)}</h4>
              <p>${esc(situationDetailCopy(situation, manual))}</p>
              <div class="manual-card-meta">
                <span>${esc(manual ? "매뉴얼 연결" : "연결 대기")}</span>
                <span>아이템 ${items.length}개</span>
                <span>제품그룹 ${productGroups.length}개</span>
              </div>
              <ul>${actions.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
              <em class="card-arrow">→</em>
            </button>
          `;
        }).join("")}
      </div>
    `;
  }

  function getSituationItems(situation) {
    const manual = byCode.manuals.get(situation.manualCode);
    return manual ? getItemsForManual(manual.code) : [];
  }

  function situationSummary(situation) {
    if (situation.manualCode) {
      const manual = byCode.manuals.get(situation.manualCode);
      return manual?.summary?.replace(/\s*세부 매뉴얼입니다\.\s*$/, "") || `${situation.code} · ${situation.priority}`;
    }
    return situation.connectionStatus === "pending" ? "상세 매뉴얼 연결 대기" : `${situation.code} · ${situation.priority}`;
  }

  function situationDetailCopy(situation, manual) {
    if (manual?.summary) return manual.summary;
    if (situation.connectionStatus === "pending") return "상황 제목과 실행 맥락이 직접 맞는 매뉴얼만 연결 대기 중입니다.";
    return `${situation.title} 상황에서 필요한 실행 기준을 확인합니다.`;
  }

  function situationActions(situation, manual) {
    const block = manual?.blocks?.find((entry) => entry.label === "실행 순서" && entry.items?.length)
      || manual?.blocks?.find((entry) => entry.items?.length);
    const items = (block?.items || []).map((item) => item.replace(/^\d+\.\s*/, "")).slice(0, 3);
    if (items.length) return items;
    if (situation.connectionStatus === "pending") return ["직접 연결되는 매뉴얼 확인", "아이템 연결 보류", "제품 그룹 연결 대기"];
    return ["상황 확인", "작은 실행 기준 선택", "관련 매뉴얼 열기"];
  }

  function renderSearch() {
    const query = state.query.trim().toLowerCase();
    const productGroups = getProductGroups({ includeMock: true });
    const entities = [
      ...data.routines.map((item) => ({ type: "routine", title: item.title, code: item.code, meta: item.frequency, entity: item })),
      ...data.manuals.map((item) => ({ type: "manual", title: item.title, code: item.code, meta: item.category, entity: item })),
      ...data.items.map((item) => ({ type: "item", title: item.name, code: item.code, meta: item.category, entity: item })),
      ...productGroups.map((group) => ({ type: "productGroup", title: group.title, code: group.code, meta: `Product ${group.allProducts.length}개`, entity: productGroupSearchEntity(group) })),
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
    const typeLabel = {
      productGroup: "product group",
    }[result.type] || result.type;
    return `
      <button class="search-result clickable" data-open-type="${esc(result.type)}" data-code="${esc(result.code)}">
        <span>${esc(typeLabel)}</span>
        <strong>${esc(result.title)}</strong>
        <em>${esc(result.code)} · ${esc(result.meta || "")}</em>
      </button>
    `;
  }

  function renderGuide() {
    const flowSteps = [
      ["1", "루틴 보기", "매일/매주 해야 할 행동 카드를 먼저 확인합니다."],
      ["2", "설명 연결", "그 행동을 어떻게 하면 되는지 알려주는 매뉴얼을 연결합니다."],
      ["3", "준비물 연결", "그 루틴을 할 때 필요한 도구나 준비물을 연결합니다."],
      ["4", "제품 묶음 확인", "실제 제품이 없으면 임시 추천 자리로만 남겨둡니다."],
      ["5", "상황 점검", "상황 카드가 엉뚱한 매뉴얼과 이어지지 않았는지 확인합니다."],
    ];
    const domainLegend = commonCategoryOrder.map((code) => {
      const category = byCode.categories.get(code);
      const visual = categoryVisual[code] || {};
      return `<span><b>${esc(code)}</b>${esc(visual.icon || category?.icon || "◇")} ${esc(category?.name || code)}</span>`;
    }).join("");
    return `
      <section class="section-card guide-page" id="guide">
        <div class="guide-intro">
          <div class="guide-intro-copy">
            <span class="guide-kicker">SERKAN 운영 매뉴얼</span>
            <h2>이 페이지는 SERKAN 백과사전을 함께 관리하기 위한 쉬운 사용 설명서입니다.</h2>
            <p>SERKAN 백과사전은 자기관리 루틴을 카드로 정리해두고, 각 루틴에 필요한 설명, 준비물, 제품 묶음, 상황별 대응 방법을 이어주는 대시보드입니다.</p>
            <p>팀원들은 이 페이지에서 “어디를 눌러야 하는지”, “코드는 어떻게 읽는지”, “카드를 옮길 때 무엇을 조심해야 하는지”를 먼저 확인하면 됩니다.</p>
          </div>
          <div class="guide-intro-panel">
            <strong>가장 중요한 연결 흐름</strong>
            <ol>
              <li>루틴 카드 → 자세한 설명</li>
              <li>자세한 설명 → 필요한 준비물</li>
              <li>준비물 → 관련 제품 묶음</li>
              <li>상황 카드 → 관련 루틴과 설명</li>
            </ol>
            <p>중요한 건 “뜻이 정말 맞는 것끼리만 연결한다”는 점입니다. 코드가 비슷하다는 이유만으로 억지로 연결하지 않습니다.</p>
          </div>
        </div>

        <div class="guide-flow">
          ${flowSteps.map(([num, title, body]) => `
            <div class="guide-flow-step">
              <span>${esc(num)}</span>
              <strong>${esc(title)}</strong>
              <p>${esc(body)}</p>
            </div>
          `).join("")}
        </div>

        <div class="guide-section-grid">
          <article class="guide-manual-card">
            <div class="guide-card-head"><span>☀️</span><strong>사용법</strong></div>
            <p>루틴 보드에서 카드를 누르면 자세한 설명창이 열립니다. 검색창에서는 루틴 이름, 코드, 태그, 제품 이름을 찾을 수 있습니다.</p>
            <ul>
              <li>Daily는 매일 하는 행동을 모아둔 곳입니다.</li>
              <li>Weekly는 주마다 챙길 일을 모아둔 곳입니다.</li>
              <li>카드 아무 곳이나 눌러도 상세 설명창이 열립니다.</li>
              <li>Weekly에서 체크한 항목은 같은 요일 안에서 위로 올라갑니다.</li>
              <li>왼쪽 카테고리를 누르면 해당 분야만 따로 볼 수 있습니다.</li>
            </ul>
            <button class="guide-action" data-view="dashboard" data-nav="daily">루틴 보드 보기 →</button>
          </article>

          <article class="guide-manual-card">
            <div class="guide-card-head"><span>🔖</span><strong>SERKAN CODE 쉽게 읽기</strong></div>
            <p>SERKAN CODE는 각 카드의 주소 같은 역할을 합니다. 이 코드 덕분에 루틴, 설명, 준비물, 제품 묶음이 서로 이어집니다.</p>
            <div class="code-sample">SR26-[DOMAIN]-[TOPIC]-[ROLE][NUMBER]</div>
            <ul>
              <li>SR26은 SERKAN 2026 기준이라는 뜻입니다.</li>
              <li>SK는 Skin처럼 관리 분야를 뜻합니다.</li>
              <li>SS는 선크림처럼 세부 주제를 뜻합니다.</li>
              <li>R은 루틴, M은 설명, C는 준비물, P는 제품 자리를 뜻합니다.</li>
              <li>예시: SR26-SK-SS-R1은 선크림 루틴입니다.</li>
            </ul>
            <div class="guide-domain-row">${domainLegend}</div>
          </article>

          <article class="guide-manual-card">
            <div class="guide-card-head"><span>✍️</span><strong>편집 모드 사용법</strong></div>
            <p>상단의 편집 버튼을 켜면 카드를 드래그해서 순서를 바꿀 수 있습니다. 준비물 카드는 다른 카테고리로 옮길 수도 있습니다.</p>
            <ul>
              <li>Daily / Weekly 카드는 같은 묶음 안에서 순서를 바꿀 수 있습니다.</li>
              <li>매뉴얼, 준비물, 제품 묶음, 상황 카드도 같은 카테고리 안에서 순서를 바꿀 수 있습니다.</li>
              <li>준비물을 다른 카테고리로 옮기면 코드가 새로 만들어집니다.</li>
              <li>바꾼 내용은 이 브라우저에 저장되어 새로고침해도 유지됩니다.</li>
            </ul>
            <button class="guide-action" data-action="show-change-log">변경 내역 보기 →</button>
          </article>
        </div>

        <div class="guide-two-col">
          <article class="guide-manual-card guide-qa-card">
            <div class="guide-card-head"><span>✅</span><strong>연결 확인 기준</strong></div>
            <div class="guide-checklist">
              <span>루틴 이름과 설명 내용이 같은 행동을 말하고 있나요?</span>
              <span>준비물이 실제로 그 루틴을 할 때 필요한 물건인가요?</span>
              <span>임시 제품 자리가 실제 추천 제품처럼 보이지 않나요?</span>
              <span>상황 카드가 정말 관련 있는 설명과 연결되어 있나요?</span>
              <span>내부 메모나 작업용 데이터가 화면에 보이지 않나요?</span>
            </div>
          </article>

          <article class="guide-manual-card guide-qa-card">
            <div class="guide-card-head"><span>🧭</span><strong>팀 운영 규칙</strong></div>
            <p>새 카드를 추가하기 전에는 먼저 “이 카드가 어떤 관리 분야에 들어가는지”를 확인합니다. 애매하면 억지로 연결하지 말고 연결 대기 상태로 둡니다.</p>
            <div class="guide-rule-row">
              <span>애매하면 연결하지 않기</span>
              <span>코드가 비슷해도 뜻이 다르면 연결하지 않기</span>
              <span>실제 제품 전에는 임시 자리로 표시하기</span>
              <span>수정 후 검색과 상세창까지 확인하기</span>
            </div>
          </article>
        </div>
      </section>
    `;
  }

  function renderQuickAccess() {
    return `
      <section class="quick-grid" aria-label="Quick access">
        <button class="quick-card clickable" data-view="guide" data-nav="guide">🔖<strong>운영 매뉴얼</strong><span>사용법, 코드 규칙, 편집 모드, QA 기준을 확인합니다.</span><em>가이드 보기 →</em></button>
        <button class="quick-card clickable" data-action="show-items">🧴<strong>관련 아이템 확인</strong><span>루틴과 연결된 아이템 백과를 함께 확인합니다.</span><em>아이템 보기 →</em></button>
        <button class="quick-card clickable" data-view="products">🛍️<strong>관련 제품군 확인</strong><span>제품군 카드에서 추천 슬롯과 연결 정보를 봅니다.</span><em>제품군 보기 →</em></button>
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
    const drawerClass = type === "dailyLibrary" ? "detail-drawer is-library" : "detail-drawer";
    host.innerHTML = `
      <div class="drawer-backdrop" data-action="close"></div>
      <aside class="${drawerClass}" aria-label="Detail drawer">
        <div class="drawer-actions">
          <button class="back-btn" data-action="back">← 이전</button>
          <button class="icon-btn" data-action="close" aria-label="닫기">×</button>
        </div>
        ${renderDetail(type, code)}
      </aside>
    `;
    updateEditModeUI();
  }

  function renderDetail(type, code) {
    if (type === "routine") return renderRoutineDetail(byCode.routines.get(code));
    if (type === "addWeeklyRoutine") return renderAddWeeklyRoutine(code);
    if (type === "dailyLibrary") return renderDailyLibraryDetail(code);
    if (type === "routineCategory") return renderRoutineCategoryDetail(code);
    if (type === "plannedPanel") return renderPlannedPanel(code);
    if (type === "manual") return renderManualDetail(byCode.manuals.get(code));
    if (type === "item") return renderItemDetail(byCode.items.get(code));
    if (type === "product") return renderProductDetail(byCode.products.get(code));
    if (type === "productGroup") return renderProductGroupDetail(getProductGroupByCode(code));
    if (type === "productCollection") return renderProductCollectionDetail();
    if (type === "reclassLog") return renderReclassLog();
    if (type === "editLog") return renderEditLog();
    if (type === "situation") return renderSituationDetail(byCode.situations.get(code));
    if (type === "category") return renderCategoryDetail(byCode.categories.get(code));
    return `<div class="empty">상세 정보를 찾을 수 없습니다.</div>`;
  }

  function detailHeader(kicker, title, code) {
    return `<div class="detail-head"><span>${esc(kicker)}</span><h2>${esc(title)}</h2><code>${esc(code)}</code></div>`;
  }

  function renderPlannedPanel(panel) {
    const meta = plannedPanelMeta(panel);
    return `
      ${detailHeader("Planned Module", meta.title, panel)}
      <p>${esc(meta.desc)}</p>
      <div class="meta-line">
        <span>${esc(meta.status)}</span>
        <span>${esc(meta.source)}</span>
      </div>
      <div class="pending-box">
        <strong>아직 독립 화면으로 분리하지 않았습니다.</strong>
        <span>${esc(meta.next)}</span>
      </div>
      ${meta.relatedView ? relationButton(meta.relatedView.type, meta.relatedView.code, meta.relatedView.label, meta.relatedView.title) : ""}
    `;
  }

  function renderAddWeeklyRoutine(dayKey = "월") {
    const activeDay = weekDays.some((day) => day.key === dayKey) ? dayKey : "월";
    return `
      ${detailHeader("Add Weekly Routine", "새 Weekly Routine 추가", `기본 요일: ${activeDay}`)}
      <p>프로토타입 안에서만 저장되는 사용자 루틴입니다. 저장 후 해당 요일 보드, 검색, 상세 Drawer, 완료율에 바로 반영됩니다.</p>
      <form class="routine-form" data-action="save-weekly-routine">
        <label>
          <span>루틴 제목</span>
          <input name="title" type="text" placeholder="예: 침구 먼지 털고 환기하기" required maxlength="80">
        </label>
        <div class="form-grid">
          <label>
            <span>요일</span>
            <select name="weekday">
              ${weekDays.map((day) => `<option value="${esc(day.key)}" ${day.key === activeDay ? "selected" : ""}>${esc(day.label)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>카테고리</span>
            <select name="domain">
              ${commonCategoryOrder.map((domain) => {
                const category = byCode.categories.get(domain);
                const label = category?.name || categoryName(domain);
                return `<option value="${esc(domain)}">${esc(label)}</option>`;
              }).join("")}
            </select>
          </label>
        </div>
        <label>
          <span>빈도 / 상태</span>
          <select name="frequency">
            <option value="Weekly">Weekly</option>
            <option value="1x/Week">1x/Week</option>
            <option value="2~3x/Week">2~3x/Week</option>
            <option value="Monthly">Monthly</option>
            <option value="필요 시">필요 시</option>
          </select>
        </label>
        <label>
          <span>짧은 실행 기준</span>
          <textarea name="summary" rows="4" placeholder="예: 토요일 오전에 침구를 털고 창문을 10분 열어둔다." maxlength="180"></textarea>
        </label>
        <div class="form-actions">
          <button type="button" class="outline-btn" data-action="close">취소</button>
          <button type="submit" class="primary-btn">저장하기</button>
        </div>
      </form>
    `;
  }

  function plannedPanelMeta(panel) {
    const map = {
      ingredients: {
        title: "Ingredients Encyclopedia",
        desc: "성분, 소재, 원료 기준으로 제품과 아이템을 역추적하는 백과 영역입니다.",
        status: "구조 설계 예정",
        source: "Product DB 확장",
        next: "제품 데이터가 실제 브랜드/성분 중심으로 들어오면 Skin, Food, Grooming 영역부터 성분 필터를 만들면 좋습니다.",
        relatedView: { type: "productCollection", code: "ALL", label: "관련 화면", title: "전체 아이템 & 제품" },
      },
      brands: {
        title: "Brand Encyclopedia",
        desc: "브랜드별 제품, 카테고리, 추천 슬롯을 모아 보는 백과 영역입니다.",
        status: "제품 데이터 보강 후 생성",
        source: "Product DB 확장",
        next: "현재는 mock product 슬롯이 많아서, 실제 브랜드명이 충분히 쌓인 뒤 독립 화면으로 분리하는 것이 좋습니다.",
        relatedView: { type: "productCollection", code: "ALL", label: "관련 화면", title: "전체 아이템 & 제품" },
      },
      "routine-builder": {
        title: "나만의 루틴 만들기",
        desc: "즐겨찾기, 루틴 카드, 아이템 그룹을 조합해 개인 루틴을 만드는 영역입니다.",
        status: "편집 기능 기반 확장",
        source: "Edit Mode",
        next: "현재 만든 드래그/변경 내역 구조를 바탕으로 루틴 빌더를 붙일 수 있습니다.",
        relatedView: { type: "editLog", code: "changes", label: "관련 기능", title: "편집 변경 내역" },
      },
      favorites: {
        title: "즐겨찾기",
        desc: "자주 보는 루틴, 매뉴얼, 아이템, 제품 그룹을 모아두는 영역입니다.",
        status: "저장 구조 예정",
        source: "LocalStorage",
        next: "다음 단계에서 카드별 북마크 버튼을 붙이면 바로 활성화할 수 있습니다.",
      },
      recent: {
        title: "최근 본 항목",
        desc: "최근 열어본 Routine, Manual, Item, Product Group, Situation을 다시 확인하는 영역입니다.",
        status: "히스토리 저장 예정",
        source: "Drawer History",
        next: "상세 드로어를 열 때마다 최근 본 항목을 저장하도록 연결하면 됩니다.",
      },
    };
    return map[panel] || {
      title: "준비 중인 영역",
      desc: "아직 독립 화면으로 분리되지 않은 모듈입니다.",
      status: "Planned",
      source: "SERKAN Prototype",
      next: "데이터가 충분해지면 별도 화면으로 확장합니다.",
    };
  }

  function renderRoutineCategoryDetail(categoryKey) {
    const preset = routineCategoryPresets[categoryKey];
    if (!preset) return `<div class="empty">루틴 카테고리를 찾을 수 없습니다.</div>`;
    const routines = data.routines
      .filter((routine) => routineMatchesRoutineCategory(routine, preset))
      .sort((a, b) => routineCategorySort(a, b));
    const daily = routines.filter((routine) => routine.board === "daily");
    const weekly = routines.filter((routine) => routine.board === "weekly");
    const domains = uniq(routines.map((routine) => routine.domain)).map(categoryName).join(" · ") || "연결 영역 없음";
    return `
      ${detailHeader("Routine Category", `${preset.icon} ${preset.label}`, categoryKey)}
      <p>${esc(preset.desc)}</p>
      <div class="meta-line">
        <span>Daily ${daily.length}개</span>
        <span>Weekly ${weekly.length}개</span>
        <span>${esc(domains)}</span>
      </div>
      ${renderRoutineCategoryList("Daily Routine", daily)}
      ${renderRoutineCategoryList("Weekly Routine", weekly)}
      ${!routines.length ? pendingBox("연결 루틴 없음", "이 카테고리에 연결된 루틴이 아직 없습니다.") : ""}
    `;
  }

  function routineMatchesRoutineCategory(routine, preset) {
    const text = [
      routine.title,
      routine.category,
      routine.frequency,
      routine.priority,
      ...(routine.tags || []),
      ...(routine.timeBlocks || []),
    ].join(" ");
    const group = routine.board === "daily" ? dailyGroupForRoutine(routine) : "";
    const groupMatch = preset.groups?.includes(group);
    const domainMatch = preset.domains?.includes(routine.domain);
    const termMatch = preset.terms?.some((term) => text.includes(term));
    return Boolean(groupMatch || domainMatch || termMatch);
  }

  function routineCategorySort(a, b) {
    if (a.board !== b.board) return a.board === "daily" ? -1 : 1;
    const groupCompare = dailyGroupSortIndex(a) - dailyGroupSortIndex(b);
    if (groupCompare) return groupCompare;
    const domainCompare = categoryOrderIndex(a.domain) - categoryOrderIndex(b.domain);
    if (domainCompare) return domainCompare;
    return a.title.localeCompare(b.title, "ko");
  }

  function dailyGroupSortIndex(routine) {
    if (routine.board !== "daily") return 99;
    const group = dailyGroupForRoutine(routine);
    const index = dailyFlowGroups.findIndex((entry) => entry.label === group);
    return index >= 0 ? index : 99;
  }

  function renderRoutineCategoryList(title, routines) {
    if (!routines.length) return "";
    return `
      <section class="relation-list routine-category-list">
        <h3>${esc(title)}</h3>
        ${routines.map((routine) => `
          <button class="relation-button" data-open-type="routine" data-code="${esc(routine.code)}">
            <span>${esc(routine.board === "daily" ? dailyGroupForRoutine(routine) : routine.weekday || "Weekly")}</span>
            <strong>${esc(routine.title)}</strong>
            <em>${esc(routine.code)} →</em>
          </button>
        `).join("")}
      </section>
    `;
  }

  function renderDailyLibraryDetail(group) {
    const meta = dailySectionMeta[group] || {};
    const routines = data.routines
      .filter((routine) => routine.board === "daily" && dailyGroupForRoutine(routine) === group)
      .sort((a, b) => categoryOrderIndex(a.domain) - categoryOrderIndex(b.domain) || a.title.localeCompare(b.title, "ko"));
    const categories = groupedRoutinesByCategory(routines);
    return `
      <div class="daily-library" style="--section-tint:${meta.tint || "#fff8f7"};--section-accent:${meta.accent || "#e85d68"};--section-border:${meta.border || "#f1d8d4"};">
        <div class="daily-library-head">
          <div class="library-orb">${esc(meta.icon || iconForGroup(group))}</div>
          <div>
            <span>Daily Routine Library</span>
            <h2>${esc(group)} 루틴 전체 보기</h2>
            <p>${esc(meta.desc || `${group} 시간대 루틴을 공통 카테고리 기준으로 탐색합니다.`)}</p>
          </div>
        </div>
        <div class="library-summary"><strong>총 ${routines.length}개 루틴</strong><span>시간대는 언제 하는지, 카테고리는 무엇을 관리하는지를 보여줍니다.</span></div>
        <div class="library-category-cards">
          ${categories.map((category) => renderLibraryCategoryCard(group, category)).join("")}
        </div>
        <div class="library-category-list">
          ${categories.map((category) => renderLibraryCategorySection(group, category)).join("") || pendingBox("연결된 루틴 없음", "이 시간대에 연결된 Daily Routine이 아직 없습니다.")}
        </div>
        <div class="library-tip"><strong>TIP</strong><span>루틴 카드를 클릭하면 상세 매뉴얼, 관련 아이템, 관련 제품 그룹으로 이어집니다.</span></div>
      </div>
    `;
  }

  function renderLibraryCategoryCard(group, category) {
    const cat = byCode.categories.get(category.domain);
    const expanded = isLibraryCategoryExpanded(group, category.domain);
    const representative = category.routines.slice(0, 3).map((routine) => routine.title).join(" · ");
    return `
      <button class="library-category-card ${expanded ? "is-expanded" : ""}" data-action="toggle-library-category" data-group="${esc(group)}" data-domain="${esc(category.domain)}" style="--cat-tint:${cat?.tint || "#f7f4ef"};--cat-accent:${cat?.accent || "#70757f"};">
        <span>${esc(categoryVisual[category.domain]?.icon || cat?.icon || "◇")}</span>
        <strong>${esc(cat?.name || category.domain)}</strong>
        <em>${category.routines.length}개 루틴</em>
        <small>${esc(representative)}</small>
      </button>
    `;
  }

  function renderLibraryCategorySection(group, category) {
    const cat = byCode.categories.get(category.domain);
    const expanded = isLibraryCategoryExpanded(group, category.domain);
    const visibleLimit = 5;
    const visibleRoutines = expanded ? category.routines : category.routines.slice(0, visibleLimit);
    const moreCount = category.routines.length - visibleLimit;
    return `
      <section class="library-category-section ${expanded ? "is-expanded" : ""}" style="--cat-tint:${cat?.tint || "#f7f4ef"};--cat-accent:${cat?.accent || "#70757f"};">
        <button class="library-category-head" data-action="toggle-library-category" data-group="${esc(group)}" data-domain="${esc(category.domain)}" aria-expanded="${expanded ? "true" : "false"}">
          <div>
            <span>${esc(categoryVisual[category.domain]?.icon || cat?.icon || "◇")}</span>
            <strong>${esc(cat?.name || category.domain)}</strong>
            <small>${esc(categoryVisual[category.domain]?.desc || cat?.label || "")}</small>
          </div>
          <em>${category.routines.length}개 루틴 ${expanded ? "⌃" : "⌄"}</em>
        </button>
        <div class="library-task-grid">
          ${visibleRoutines.map((routine) => renderLibraryTaskPill(routine)).join("")}
          ${!expanded && moreCount > 0 ? `<button class="library-more" data-action="toggle-library-category" data-group="${esc(group)}" data-domain="${esc(category.domain)}">+${moreCount}개 더 보기</button>` : ""}
        </div>
      </section>
    `;
  }

  function renderLibraryTaskPill(routine) {
    return `
      <button class="library-task-pill clickable" data-open-type="routine" data-code="${esc(routine.code)}">
        <strong>${esc(routine.title)}</strong>
        <span>${esc(routine.frequency || routine.priority || categoryName(routine.domain))}</span>
      </button>
    `;
  }

  function isLibraryCategoryExpanded(group, domain) {
    return Boolean(state.expandedGroups[`dailyLibrary:${group}:${domain}`]);
  }

  function toggleLibraryCategory(group, domain) {
    const key = `dailyLibrary:${group}:${domain}`;
    state.expandedGroups[key] = !state.expandedGroups[key];
    renderDrawer();
  }

  function categoryOrderIndex(domain) {
    const index = commonCategoryOrder.indexOf(domain);
    return index === -1 ? commonCategoryOrder.length : index;
  }

  function renderRoutineDetail(routine) {
    if (!routine) return `<div class="empty">루틴을 찾을 수 없습니다.</div>`;
    const manual = getManualForRoutine(routine);
    const items = manual ? getItemsForManual(manual.code) : [];
    const productGroups = getProductGroupsForItems(items, { includeMock: false });
    const timeBlocks = Array.isArray(routine.timeBlocks) ? routine.timeBlocks : [];
    const customActions = routine.isCustom ? `
      <div class="custom-routine-actions">
        <button class="danger-link" data-action="delete-custom-weekly" data-code="${esc(routine.code)}">이 사용자 루틴 삭제</button>
      </div>
    ` : "";
    return `
      ${detailHeader("Routine Task", routine.title, routine.code)}
      <p>${esc(routine.frequency)} · ${esc(routine.priority)} · ${esc(timeBlocks.join(", ") || categoryName(routine.domain))}</p>
      ${routine.summary ? `<p>${esc(routine.summary)}</p>` : ""}
      ${manual ? relationButton("manual", manual.code, manualLabel(routine), manual.title) : pendingBox("상세 매뉴얼 연결 대기", "핵심 행동, 대상, 목적이 맞는 매뉴얼만 연결합니다.")}
      ${renderRelationList("관련 아이템", items.map((item) => ["item", item.code, item.name]))}
      ${productGroups.length ? renderRelationList("관련 제품 그룹", productGroups.map((group) => ["productGroup", group.code, group.title])) : pendingBox("관련 제품 연결 대기", "실제 제품명, 이미지 또는 구매 링크가 확인된 제품 그룹만 표시합니다.")}
      ${customActions}
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
      ${renderRelationList("관련 제품 그룹", getProductGroupsForItems(items, { includeMock: false }).map((group) => ["productGroup", group.code, group.title]))}
    `;
  }

  function renderItemDetail(item) {
    if (!item) return `<div class="empty">아이템을 찾을 수 없습니다.</div>`;
    const productGroups = getProductGroupsForItem(item.code, { includeMock: true });
    const manuals = item.manualCodes.map((manualCode) => byCode.manuals.get(manualCode)).filter(Boolean);
    return `
      ${detailHeader("Item Encyclopedia", item.name, item.code)}
      <p>${esc(item.role)}</p>
      ${item.reviewNeeded ? pendingBox("아이템 재분류 검토 필요", item.reviewReason || "매뉴얼의 실행 도구/공간/습관 단위와 아이템명이 약하게 연결되어 있습니다.") : ""}
      ${renderRelationList("관련 매뉴얼", manuals.map((manual) => ["manual", manual.code, manual.title]))}
      ${productGroups.length ? renderRelationList("관련 제품 그룹", productGroups.map((group) => ["productGroup", group.code, `${group.title} · ${group.allProducts.length}개 슬롯`])) : pendingBox("관련 제품 연결 대기", "추천 슬롯 또는 실제 제품 데이터가 아직 연결되지 않았습니다.")}
    `;
  }

  function renderProductGroupDetail(group) {
    if (!group) return `<div class="empty">제품 그룹을 찾을 수 없습니다.</div>`;
    const manuals = group.item?.manualCodes.map((manualCode) => byCode.manuals.get(manualCode)).filter(Boolean) || [];
    return `
      ${detailHeader("Product Group", group.title, group.code)}
      <p>${esc(group.category || categoryName(group.domain))} · Product ${group.allProducts.length}개 · ${group.realCount ? `실제품 ${group.realCount}개` : "Mock Product 연결 대기"}</p>
      <div class="meta-line">
        <span>Topic ${esc(group.title)}</span>
        <span>Product Count ${group.allProducts.length}</span>
        <span>${group.mockCount ? `Mock ${group.mockCount}개` : "Ready"}</span>
      </div>
      <section class="relation-list">
        <h3>추천 타입 슬롯</h3>
        <div class="product-slot-grid">
          ${group.allProducts.map(renderProductSlot).join("")}
        </div>
      </section>
      ${group.item ? relationButton("item", group.item.code, "관련 아이템", group.item.name) : ""}
      ${renderRelationList("관련 매뉴얼", manuals.map((manual) => ["manual", manual.code, manual.title]))}
    `;
  }

  function renderProductSlot(product) {
    const mock = isMockProduct(product);
    const label = product.recommendationType || "추천";
    return `
      <div class="product-slot ${mock ? "is-mock" : "is-ready"}">
        <span>${esc(label)}</span>
        <strong>${esc(mock ? `${label} 슬롯` : product.productName)}</strong>
        <em>${esc(mock ? "Mock Product · 제품 연결 대기" : product.code)}</em>
      </div>
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
    const productGroups = getProductGroupsForItems(items, { includeMock: false });
    return `
      ${detailHeader("Situation", situation.title, situation.code)}
      <p>${esc(situation.type)} · ${esc(situation.priority)}</p>
      ${manual ? relationButton("manual", manual.code, manualLabel(situation, "상황 상세 매뉴얼"), manual.title) : pendingBox("상황 매뉴얼 연결 대기", "상황 제목과 실행 맥락이 직접 이어지는 매뉴얼만 연결합니다.")}
      ${renderRelationList("관련 아이템", items.map((item) => ["item", item.code, item.name]))}
      ${productGroups.length ? renderRelationList("관련 제품 그룹", productGroups.map((group) => ["productGroup", group.code, group.title])) : pendingBox("관련 제품 연결 대기", "실제 제품 데이터가 들어오기 전까지 제품 연결을 보류합니다.")}
    `;
  }

  function renderCategoryDetail(category) {
    if (!category) return `<div class="empty">카테고리를 찾을 수 없습니다.</div>`;
    const manualOrderKey = cardOrderKey("manual", category.code);
    const productGroupOrderKey = cardOrderKey("productGroup", category.code);
    const manuals = orderedCards(data.manuals.filter((manual) => manual.domain === category.code), manualOrderKey);
    const items = data.items.filter((item) => item.domain === category.code);
    const productGroups = getProductGroups({ includeMock: true, sourceProducts: data.products.filter((product) => product.domain === category.code) });
    return `
      ${detailHeader("Category", `${category.name} / ${category.label}`, category.code)}
      <p>${category.label} 영역의 아이템과 Product Group을 카테고리 안에서 확인합니다.</p>
      ${renderProductGroupList("Product Groups", productGroups, productGroupOrderKey)}
      ${renderRelationList("아이템", items.map((item) => ["item", item.code, item.name]))}
      ${renderRelationList("매뉴얼", manuals.map((manual) => ["manual", manual.code, manual.title]), { sortKind: "manual", orderKey: manualOrderKey })}
    `;
  }

  function renderProductCollectionDetail() {
    const groups = getProductGroups({ includeMock: true });
    return `
      ${detailHeader("Product Group & Item Collection", "전체 제품군 & 아이템", "ALL")}
      <p>모든 카테고리의 Product Group과 아이템 연결을 한 번에 봅니다.</p>
      <div class="meta-line"><span>아이템 ${data.items.length}개</span><span>제품 그룹 ${groups.length}개</span><span>Mock 슬롯 ${data.products.filter(isMockProduct).length}개</span></div>
      ${renderProductGroupList("전체 Product Groups", groups, cardOrderKey("productGroup", "all"))}
    `;
  }

  function renderReclassLog() {
    const records = state.itemReclasses;
    return `
      ${detailHeader("SERKAN CODE Reissue Log", "아이템 재분류 변경 내역", `${records.length} changes`)}
      <p>드래그 재분류는 브라우저 localStorage에 저장됩니다. 원본 데이터에 반영할 때 아래 코드 변경을 기준으로 업데이트하세요.</p>
      ${records.length ? `
        <div class="reclass-log">
          ${records.map((record) => `
            <section>
              <h3>${esc(record.itemName)}</h3>
              <p>${esc(record.fromCategory)} → ${esc(record.toCategory)}</p>
              <code>${esc(record.oldCode)} → ${esc(record.newCode)}</code>
              <ul>
                ${Object.entries(record.productCodeMap || {}).map(([from, to]) => `<li>${esc(from)} → ${esc(to)}</li>`).join("")}
              </ul>
            </section>
          `).join("")}
        </div>
      ` : pendingBox("변경 내역 없음", "아이템 카드를 다른 카테고리로 드래그하면 재발급 로그가 여기에 표시됩니다.")}
    `;
  }

  function renderEditLog() {
    const { cardOrders, itemOrders } = editOrderEntries();
    const summary = editChangeSummary();
    const payload = editExportPayload();
    return `
      ${detailHeader("Edit Mode", "편집 변경 내역", `${summary.orderGroups + summary.reclassifications} changes`)}
      <p>드래그로 바꾼 카드 순서와 아이템 재분류 기록입니다. 이 내용은 브라우저 localStorage에 저장됩니다.</p>
      <div class="edit-summary-grid">
        <div><span>순서 변경 묶음</span><strong>${summary.orderGroups}개</strong></div>
        <div><span>정렬된 카드</span><strong>${summary.orderedCards}개</strong></div>
        <div><span>아이템 재분류</span><strong>${summary.reclassifications}개</strong></div>
      </div>
      <div class="edit-panel-actions">
        <button class="relation-button" data-action="toggle-edit-mode"><span>편집 모드</span><strong>${state.editMode ? "ON" : "OFF"}</strong><em>${state.editMode ? "끄기" : "켜기"} →</em></button>
        <button class="relation-button" data-action="export-changes"><span>Export</span><strong>JSON 다운로드</strong><em>changes →</em></button>
        <button class="relation-button" data-action="reset-order"><span>Reset</span><strong>순서만 초기화</strong><em>orders →</em></button>
        <button class="relation-button" data-action="reset-reclass"><span>Reset</span><strong>재분류만 초기화</strong><em>codes →</em></button>
        <button class="relation-button danger" data-action="reset-all-edits"><span>Reset</span><strong>전체 편집 초기화</strong><em>all →</em></button>
      </div>
      ${renderOrderLog("카드 순서 변경", cardOrders)}
      ${renderOrderLog("아이템 순서 변경", itemOrders)}
      ${renderReclassLogBody(state.itemReclasses)}
      <details class="export-preview">
        <summary>JSON 미리보기</summary>
        <pre>${esc(JSON.stringify(payload, null, 2))}</pre>
      </details>
    `;
  }

  function renderOrderLog(title, entries) {
    return `
      <section class="reclass-log">
        <h3>${esc(title)}</h3>
        ${entries.length ? entries.map((entry) => `
          <section>
            <h3>${esc(editOrderLabel(entry.key))}</h3>
            <p>${esc(entry.count)}개 카드 순서 저장</p>
            <code>${esc(entry.key)}</code>
            <ul>${entry.codes.slice(0, 12).map((code, index) => `<li>${index + 1}. ${esc(code)}</li>`).join("")}</ul>
          </section>
        `).join("") : pendingBox(`${title} 없음`, "아직 이 영역의 순서 변경이 없습니다.")}
      </section>
    `;
  }

  function renderReclassLogBody(records) {
    return `
      <section class="reclass-log">
        <h3>아이템 재분류 / SERKAN CODE 재발급</h3>
        ${records.length ? records.map((record) => `
          <section>
            <h3>${esc(record.itemName)}</h3>
            <p>${esc(record.fromCategory)} → ${esc(record.toCategory)}</p>
            <code>${esc(record.oldCode)} → ${esc(record.newCode)}</code>
            <ul>${Object.entries(record.productCodeMap || {}).map(([from, to]) => `<li>${esc(from)} → ${esc(to)}</li>`).join("")}</ul>
          </section>
        `).join("") : pendingBox("재분류 변경 없음", "다른 카테고리로 아이템을 옮기면 코드 재발급 기록이 여기에 표시됩니다.")}
      </section>
    `;
  }

  function editOrderLabel(key) {
    const parts = String(key || "").split(":");
    if (parts[0] === "routine" && parts[1] === "daily") return `Daily · ${parts.slice(2).join(":")}`;
    if (parts[0] === "routine" && parts[1] === "weekly") return `Weekly · ${parts.slice(2).join(":")}`;
    if (parts[0] === "manualCategory") return "Manual Encyclopedia 카테고리";
    if (parts[0] === "manual") return `${categoryName(parts[1])} 매뉴얼`;
    if (parts[0] === "productGroup") return parts[1] === "all" ? "전체 Product Group" : `${categoryName(parts[1])} Product Group`;
    if (parts[0] === "situation") return `${parts[1]} Situation`;
    return key;
  }

  function renderProductGroupList(title, groups, orderKey = cardOrderKey("productGroup", "all")) {
    if (!groups.length) return pendingBox("제품 그룹 연결 대기", "이 카테고리에 연결된 Product Group이 아직 없습니다.");
    const orderedGroups = orderedCards(groups, orderKey, (group) => group.code);
    return `
      <section class="relation-list product-group-list" data-sort-container="${esc(orderKey)}">
        <h3>${esc(title)}</h3>
        ${orderedGroups.map((group) => `
          <button class="relation-button product-group-row" draggable="true" data-open-type="productGroup" data-code="${esc(group.code)}" data-sort-kind="productGroup" data-sort-group="${esc(orderKey)}" data-sort-code="${esc(group.code)}">
            <span>${esc(group.code)} · Product ${group.allProducts.length}개</span>
            <strong>${esc(group.title)}</strong>
            <div class="tag-row">
              ${group.recommendationTypes.slice(0, 4).map((type) => `<em class="tag">${esc(type)}</em>`).join("")}
            </div>
          </button>
        `).join("")}
      </section>
    `;
  }

  function relationButton(type, code, label, title, options = {}) {
    const draggable = options.orderKey && options.sortKind
      ? `draggable="true" data-sort-kind="${esc(options.sortKind)}" data-sort-group="${esc(options.orderKey)}" data-sort-code="${esc(code)}"`
      : "";
    return `
      <button class="relation-button" ${draggable} data-open-type="${esc(type)}" data-code="${esc(code)}">
        <span>${esc(label)}</span>
        <strong>${esc(title)}</strong>
        <em>${esc(code)} →</em>
      </button>
    `;
  }

  function manualLabel(source, fallback = "상세 매뉴얼") {
    if (source?.reviewNeeded) return `${fallback} · 검토 필요`;
    if (source?.linkConfidence === "low") return `${fallback} · 낮은 신뢰도`;
    return fallback;
  }

  function pendingBox(title, body) {
    return `
      <div class="pending-box">
        <strong>${esc(title)}</strong>
        <span>${esc(body)}</span>
      </div>
    `;
  }

  function renderRelationList(title, rows, options = {}) {
    const uniqueRows = uniq(rows.map((row) => row.join("|"))).map((row) => row.split("|")).slice(0, 12);
    if (!uniqueRows.length) return "";
    const orderKey = options.orderKey || "";
    const orderedRows = orderKey
      ? orderedCards(uniqueRows, orderKey, ([, code]) => code)
      : uniqueRows;
    return `
      <section class="relation-list" ${orderKey ? `data-sort-container="${esc(orderKey)}"` : ""}>
        <h3>${esc(title)}</h3>
        ${orderedRows.map(([type, code, label]) => relationButton(type, code, code, label, options)).join("")}
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
    if (state.view === "guide") content.innerHTML = `${renderHero()}${renderGuide()}`;
    if (state.view === "search") content.innerHTML = renderSearch();
    updateActiveNav();
    renderDrawer();
    updateEditModeUI();
  }

  function updateEditModeUI() {
    document.body.classList.toggle("edit-mode", state.editMode);
    $$(".edit-toggle").forEach((button) => {
      button.classList.toggle("active", state.editMode);
      button.textContent = state.editMode ? "편집 중" : "편집";
      button.setAttribute("aria-pressed", state.editMode ? "true" : "false");
    });
    $$(".change-log-button").forEach((button) => {
      const summary = editChangeSummary();
      button.textContent = `변경 ${summary.orderGroups + summary.reclassifications}`;
    });
    $$("[data-sort-code], [data-item-code]").forEach((entry) => {
      entry.draggable = state.editMode;
      entry.setAttribute("draggable", state.editMode ? "true" : "false");
    });
  }

  function updateActiveNav() {
    $$(".tab, .side-link").forEach((el) => el.classList.remove("active"));
    const tabNavByView = {
      dashboard: "routine-system",
      manuals: "manuals",
      products: "products",
      situations: "situations",
      guide: "guide",
    };
    const sideNavByView = {
      dashboard: "daily",
      manuals: "manuals",
      products: "products",
      situations: "situation",
      guide: "guide",
    };
    const tabNav = topNavForState(tabNavByView[state.view]);
    const sideNav = state.navTarget || sideNavByView[state.view];
    if (tabNav) $$(`.tab[data-nav="${tabNav}"]`).forEach((el) => el.classList.add("active"));
    if (sideNav) $$(`.side-link[data-nav="${sideNav}"]`).forEach((el) => el.classList.add("active"));
  }

  function topNavForState(fallback) {
    if (["dashboard", "routine-system", "manuals", "items", "products", "situations", "guide"].includes(state.navTarget)) return state.navTarget;
    if (["daily", "weekly", "monthly", "seasonal"].includes(state.navTarget)) return "routine-system";
    if (state.navTarget === "situation") return "situations";
    if (state.navTarget?.startsWith("cat-")) return "routine-system";
    if (state.navTarget?.startsWith("domain-")) return "manuals";
    return fallback;
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      if (state.suppressClick) {
        state.suppressClick = false;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      const trigger = event.target.closest("[data-view], [data-open-type], [data-action]");
      if (!trigger) return;
      const view = trigger.dataset.view;
      const openType = trigger.dataset.openType;
      const action = trigger.dataset.action;
      const nav = trigger.dataset.nav;
      if (state.editMode && trigger.closest("[data-sort-code], [data-item-code]") && action !== "toggle-weekly") {
        event.preventDefault();
        showToast("편집 모드에서는 카드를 드래그해 순서를 조정합니다.");
        return;
      }
      if (action === "toggle-weekly") {
        event.stopPropagation();
        toggleWeeklyDone(trigger.dataset.day, trigger.dataset.code);
        return;
      }
      if (action === "toggle-edit-mode") {
        toggleEditMode();
        return;
      }
      if (action === "show-change-log") {
        openDetail("editLog", "changes");
        return;
      }
      if (action === "show-planned") {
        openDetail("plannedPanel", trigger.dataset.panel || "planned");
        return;
      }
      if (action === "export-changes") {
        downloadEditExport();
        return;
      }
      if (action === "reset-all-edits") {
        resetAllEdits();
        return;
      }
      if (action === "open-weekly-routine") {
        openDetail("routine", trigger.dataset.code);
        return;
      }
      if (action === "open-daily-library") {
        openDetail("dailyLibrary", trigger.dataset.group);
        return;
      }
      if (action === "toggle-library-category") {
        event.preventDefault();
        toggleLibraryCategory(trigger.dataset.group, trigger.dataset.domain);
        return;
      }
      if (view) navigateTo(view, nav);
      if (openType) openDetail(openType, trigger.dataset.code);
      if (action === "back") goBack();
      if (action === "close") closeDrawer();
      if (action === "show-items") showItemsSection();
      if (action === "show-group") toggleRoutineGroup(trigger.dataset.kind || "daily", trigger.dataset.group || "");
      if (action === "filter-situation") {
        state.situationFilter = trigger.dataset.type || "all";
        state.selectedSituationCategory = null;
        render();
        scrollAfterRender("#situations");
      }
      if (action === "select-situation-category") {
        state.selectedSituationCategory = trigger.dataset.categoryKey || null;
        render();
        scrollAfterRender(".situation-manual-section");
      }
      if (action === "show-reclass-log") openDetail("reclassLog", "log");
      if (action === "reset-order") resetItemOrder();
      if (action === "reset-reclass") resetItemReclasses();
      if (action === "weekly-add") {
        event.stopPropagation();
        state.navTarget = "weekly";
        openDetail("addWeeklyRoutine", trigger.dataset.day || "월");
        return;
      }
      if (action === "delete-custom-weekly") {
        event.preventDefault();
        const routine = byCode.routines.get(trigger.dataset.code);
        if (!routine?.isCustom) return;
        const ok = window.confirm(`"${routine.title}" 루틴을 삭제할까요?`);
        if (!ok) return;
        const dayKey = routine.weekday || "월";
        deleteCustomWeeklyRoutine(routine.code);
        closeDrawer();
        render();
        scrollAfterRender("#weekly-board", "auto");
        showToast(`${dayKey}요일 사용자 루틴을 삭제했습니다.`);
      }
    });

    document.addEventListener("submit", (event) => {
      const form = event.target.closest('[data-action="save-weekly-routine"]');
      if (!form) return;
      event.preventDefault();
      const routine = createCustomWeeklyRoutine(new FormData(form));
      if (!routine) {
        showToast("루틴 제목을 입력해주세요.");
        return;
      }
      closeDrawer();
      state.navTarget = "weekly";
      render();
      scrollAfterRender("#weekly-board", "auto");
      showToast(`${routine.weekday}요일에 루틴을 추가했습니다.`);
    });

    document.addEventListener("keydown", (event) => {
      const trigger = event.target.closest('[data-action="open-weekly-routine"]');
      if (!trigger || !["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      openDetail("routine", trigger.dataset.code);
    });

    document.addEventListener("dragstart", (event) => {
      if (!state.editMode) {
        event.preventDefault();
        return;
      }
      if (event.target.matches("input, textarea, select, a")) return;
      const card = event.target.closest("[data-item-code], [data-sort-code]");
      if (!card) return;
      const itemCode = card.dataset.itemCode || "";
      const item = itemCode ? byCode.items.get(itemCode) : null;
      const code = card.dataset.sortCode || itemCode;
      const kind = card.dataset.sortKind || (itemCode ? "item" : "");
      const group = card.dataset.sortGroup || (item ? cardOrderKey("item", item.domain) : "");
      if (!code || !kind) return;
      state.draggedItemCode = itemCode;
      state.draggedCard = { kind, code, group };
      card.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", code);
    });

    document.addEventListener("dragend", (event) => {
      event.target.closest("[data-item-code], [data-sort-code]")?.classList.remove("is-dragging");
      clearDragMarkers();
      state.draggedItemCode = null;
      state.draggedCard = null;
    });

    document.addEventListener("dragover", (event) => {
      if (!state.editMode) return;
      const dragged = state.draggedCard;
      if (!dragged) return;
      const dropZone = event.target.closest("[data-drop-domain]");
      const sortTarget = event.target.closest("[data-sort-code]");
      const sortContainer = event.target.closest("[data-sort-container]");
      const sortGroup = sortTarget?.dataset.sortGroup || sortContainer?.dataset.sortContainer || "";
      const itemTarget = event.target.closest("[data-item-code]");
      const canSort = sortGroup && sortGroup === dragged.group && sortTarget?.dataset.sortCode !== dragged.code;
      const canDropItem = dragged.kind === "item" && dropZone;
      if (!canSort && !canDropItem) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      clearDragMarkers();
      if (canDropItem) dropZone.classList.add("is-drop-target");
      if (sortContainer && canSort) sortContainer.classList.add("is-drop-target");
      if (sortTarget && canSort) sortTarget.classList.add("is-sort-target");
      if (itemTarget && itemTarget.dataset.itemCode !== dragged.code) itemTarget.classList.add("is-sort-target");
    });

    document.addEventListener("dragleave", (event) => {
      const dropZone = event.target.closest("[data-drop-domain]");
      if (!dropZone || dropZone.contains(event.relatedTarget)) return;
      dropZone.classList.remove("is-drop-target");
    });

    document.addEventListener("drop", (event) => {
      if (!state.editMode) return;
      const dropZone = event.target.closest("[data-drop-domain]");
      const sortTarget = event.target.closest("[data-sort-code]");
      const sortContainer = event.target.closest("[data-sort-container]");
      const dragged = state.draggedCard;
      if (!dragged) return;
      event.preventDefault();
      const itemCode = state.draggedItemCode || (dragged.kind === "item" ? dragged.code : "");
      const item = byCode.items.get(itemCode);
      const targetCard = event.target.closest("[data-item-code]");
      const sortGroup = sortTarget?.dataset.sortGroup || sortContainer?.dataset.sortContainer || "";
      const sortCode = sortTarget?.dataset.sortCode || "";
      const targetCode = targetCard?.dataset.itemCode || sortCode || "";
      const targetRect = (targetCard || sortTarget)?.getBoundingClientRect();
      const placeAfter = targetRect ? event.clientY > targetRect.top + targetRect.height / 2 : false;
      const dropDomain = dropZone?.dataset.dropDomain || "";
      const sortScope = sortContainer || sortTarget?.parentElement || document;
      clearDragMarkers();
      state.draggedItemCode = null;
      state.draggedCard = null;

      if (dragged.kind === "item" && item && dropDomain && item.domain === dropDomain) {
        const orderResult = placeItemInCategoryOrder(itemCode, dropDomain, targetCode, placeAfter);
        if (!orderResult) {
          showToast("같은 위치입니다.");
          return;
        }
        suppressNextClick();
        state.view = "products";
        state.selected = null;
        render();
        showItemsSection();
        showToast(`${orderResult.item.name}: ${dropDomain} ${orderResult.position}번째로 이동`);
        return;
      }

      if (sortGroup && sortGroup === dragged.group) {
        const visibleCodes = visibleSortCodesForGroup(sortGroup, sortScope);
        const orderResult = placeCardInOrder(sortGroup, dragged.code, targetCode, placeAfter, visibleCodes);
        if (!orderResult) {
          showToast("같은 위치입니다.");
          return;
        }
        suppressNextClick();
        render();
        showToast(`카드 순서 변경: ${orderResult.position}번째로 이동`);
        return;
      }

      if (dragged.kind !== "item") {
        showToast("같은 묶음 안에서만 순서 변경할 수 있습니다.");
        return;
      }

      if (!item || !dropDomain) {
        showToast("이동할 아이템을 찾지 못했습니다.");
        return;
      }

      const plan = applyItemReclass(itemCode, dropDomain, { persist: true });
      if (!plan) {
        showToast("이미 같은 카테고리이거나 이동할 수 없는 아이템입니다.");
        return;
      }
      removeItemFromOrders(plan.oldCode);
      placeItemInCategoryOrder(plan.newCode, plan.toDomain, targetCode, placeAfter);
      suppressNextClick();
      state.view = "products";
      state.selected = null;
      render();
      showItemsSection();
      showToast(`${plan.itemName}: ${plan.oldCode} → ${plan.newCode}`);
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

  function navigateTo(view, nav) {
    state.navTarget = nav || "";
    if (nav === "items") {
      showItemsSection();
      return;
    }
    if (nav === "products") {
      setView("products");
      scrollAfterRender("#products");
      return;
    }
    if (nav === "weekly") {
      setView("dashboard");
      scrollAfterRender("#weekly-board");
      return;
    }
    if (["daily", "monthly", "seasonal"].includes(nav)) {
      setView("dashboard");
      scrollAfterRender("#daily-board");
      return;
    }
    if (nav === "guide") {
      setView("guide");
      scrollAfterRender("#guide");
      return;
    }
    if (nav?.startsWith("domain-")) {
      const domain = nav.replace("domain-", "");
      setView("manuals");
      openDetail("category", domain);
      scrollAfterRender("#manuals");
      return;
    }
    if (nav === "dashboard" || nav === "routine-system") {
      state.navTarget = nav === "dashboard" ? "dashboard" : "daily";
      setView("dashboard");
      scrollAfterRender(nav === "dashboard" ? ".hero-row" : "#daily-board");
      return;
    }
    if (nav?.startsWith("cat-")) {
      setView("dashboard");
      openDetail("routineCategory", nav);
      scrollAfterRender(".hero-row");
      return;
    }
    setView(view);
    scrollAfterRender(".hero-row");
  }

  function scrollAfterRender(selector, behavior = "smooth") {
    setTimeout(() => {
      const target = $(selector);
      if (target) target.scrollIntoView({ block: "start", behavior });
    }, 0);
  }

  function showItemsSection() {
    state.navTarget = "items";
    if (state.view !== "products") {
      setView("products");
    } else {
      render();
    }
    setTimeout(() => {
      const details = $(".item-collapse");
      if (!details) return;
      details.open = true;
      details.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 0);
  }

  function showToast(message) {
    let toast = $(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
  }

  function initNavigationData() {
    const tabMap = [
      ["dashboard", "dashboard"],
      ["dashboard", "routine-system"],
      ["manuals", "manuals"],
      ["products", "products"],
      ["products", "items"],
      ["guide", "guide"],
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

  applySavedItemReclasses();
  initNavigationData();
  bindEvents();
  render();
})();
