(function () {
  const data = window.SERKAN_DATA;
  const RECENT_STORAGE_KEY = "SERKAN_RECENT_ITEMS";
  const MANUAL_VIEWS_STORAGE_KEY = "SERKAN_MANUAL_VIEWS";
  const MY_SERKAN_STORAGE_KEY = "SERKAN_MY_SERKAN";
  const RECENT_LIMIT = 20;
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
    customEntries: loadCustomEntries(),
    itemReclasses: loadItemReclasses(),
    itemOrders: loadItemOrders(),
    cardOrders: loadCardOrders(),
    editMode: loadEditMode(),
    recentItems: loadRecentItems(),
    manualViews: loadManualViews(),
    mySerkan: loadMySerkan(),
    routineFilters: { weekly: "all", monthly: "all", seasonal: "여름" },
    weeklyFocusCategory: loadWeeklyFocusCategory(),
    monthlyFocus: loadMonthlyFocus(),
    dailyActions: loadDailyActionState(),
    manualCategoryFilters: {},
    manualCategorySort: {},
    manualHomeFilters: { category: "all", purpose: "all", stage: "all" },
    encyclopediaFilters: {
      brands: { category: "all", position: "all", sort: "products" },
      ingredients: { category: "all", sort: "products" },
    },
    draggedItemCode: null,
    draggedCard: null,
    suppressClick: false,
  };

  mergeCustomEntries();

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

  function entityForContext(type, code) {
    const mapByType = {
      routine: byCode.routines,
      manual: byCode.manuals,
      item: byCode.items,
      product: byCode.products,
      situation: byCode.situations,
    };
    return mapByType[type]?.get(code) || null;
  }

  function currentSerkanContext() {
    const selected = state.selected || null;
    if (!selected) {
      return {
        view: state.view,
        type: "view",
        code: state.view,
        title: viewMeta[state.view]?.title || "SERKAN Dashboard",
      };
    }
    const entity = entityForContext(selected.type, selected.code);
    return {
      view: state.view,
      type: selected.type,
      code: selected.code,
      title: entity?.title || entity?.name || entity?.productName || selected.code,
      category: entity?.category || entity?.domain || "",
    };
  }

  function publishSerkanContext(extra = {}) {
    const detail = { ...currentSerkanContext(), ...extra };
    window.SERKAN_CURRENT_CONTEXT = detail;
    window.dispatchEvent(new CustomEvent("serkan:context-change", { detail }));
  }

  function publishSerkanAction(actionType, detail = {}) {
    window.dispatchEvent(new CustomEvent("serkan:team-action", {
      detail: {
        actionType,
        context: currentSerkanContext(),
        ...detail,
      },
    }));
  }

  const viewMeta = {
    dashboard: {
      title: "루틴 시스템 대시보드",
      subtitle: "데일리 루틴 보드와 위클리 루틴 보드를 한눈에 보고, 관련 매뉴얼과 아이템/제품 백과로 연결합니다.",
    },
    manuals: {
      title: "루틴 상세 매뉴얼",
      subtitle: "모든 루틴의 상세 매뉴얼을 카테고리별로 탐색하고 관리하세요.",
    },
    products: {
      title: "아이템 & 제품 백과",
      subtitle: "관리 목적별 Item을 먼저 고르고, Item 안의 추천 슬롯과 실제 제품을 확인합니다.",
    },
    situations: {
      title: "상황 대시보드",
      subtitle: "상황별 대응 루틴과 추천 매뉴얼을 함께 확인합니다.",
    },
    myserkan: {
      title: "MY SERKAN",
      subtitle: "나를 이해하고, 나에게 맞는 루틴으로 더 나은 일상을 설계합니다.",
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

  const addRoutineBoardMeta = {
    daily: {
      title: "새 Daily Routine 추가",
      kicker: "Add Daily Routine",
      codePrefix: "DY",
      storageType: "routine",
      locationName: "시간대",
      locationField: "timeBlock",
      defaultLocation: "기상",
      options: ["기상", "업무", "점심", "오후", "저녁", "수면"],
      scrollTarget: "#daily-board",
      toastUnit: "Daily",
      defaultFrequency: "Daily",
    },
    weekly: {
      title: "새 Weekly Routine 추가",
      kicker: "Add Weekly Routine",
      codePrefix: "WK",
      storageType: "routine",
      locationName: "요일",
      locationField: "weekday",
      defaultLocation: "월",
      options: ["월", "화", "수", "목", "금", "토", "일"],
      scrollTarget: "#weekly-board",
      toastUnit: "Weekly",
      defaultFrequency: "Weekly",
    },
    monthly: {
      title: "새 Monthly Routine 추가",
      kicker: "Add Monthly Routine",
      codePrefix: "MO",
      storageType: "routine",
      locationName: "월간 관리 유형",
      locationField: "timeBlock",
      defaultLocation: "점검",
      options: ["점검", "교체", "재구매", "정리", "대청소", "기타"],
      scrollTarget: "#monthly-board",
      toastUnit: "Monthly",
      defaultFrequency: "Monthly",
    },
    seasonal: {
      title: "새 Seasonal Routine 추가",
      kicker: "Add Seasonal Routine",
      codePrefix: "SE",
      storageType: "routine",
      locationName: "계절",
      locationField: "timeBlock",
      defaultLocation: "봄",
      options: ["봄", "여름", "가을", "겨울"],
      scrollTarget: "#seasonal-board",
      toastUnit: "Seasonal",
      defaultFrequency: "Seasonal",
    },
    situation: {
      title: "새 Situation Routine 추가",
      kicker: "Add Situation Routine",
      codePrefix: "SI",
      storageType: "situation",
      locationName: "상황 유형",
      locationField: "type",
      defaultLocation: "Mental",
      options: ["Mental", "Social", "Space", "Body", "기타"],
      scrollTarget: "#situations",
      toastUnit: "Situation",
      defaultFrequency: "필요 시",
    },
  };

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

  function loadManualViews() {
    try {
      return JSON.parse(localStorage.getItem(MANUAL_VIEWS_STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveManualViews() {
    localStorage.setItem(MANUAL_VIEWS_STORAGE_KEY, JSON.stringify(state.manualViews || {}));
  }

  function recordManualView(code) {
    if (!code || !byCode.manuals.has(code)) return;
    const current = state.manualViews?.[code] || {};
    state.manualViews = {
      ...(state.manualViews || {}),
      [code]: {
        count: Number(current.count || 0) + 1,
        lastViewedAt: Date.now(),
      },
    };
    saveManualViews();
  }

  function defaultMySerkan() {
    return {
      profile: {
        job: "사무직",
        workStyle: "출근",
        wakeTime: "07:00",
        sleepTime: "23:30",
        skinType: "복합성",
        exerciseFrequency: "주 3~4회",
      },
      today: {
        condition: "보통",
        stress: "보통",
      },
      goals: ["피부 컨디션", "수면 회복"],
      builder: {
        title: "",
        filter: "recommended",
        selectedCodes: [],
      },
      savedRoutines: [
        { id: "commute", title: "출근 전 15분 루틴", type: "아침 루틴", domains: ["SK", "SY"], progress: 78 },
        { id: "sleep", title: "수면 회복 루틴", type: "저녁 · 수면 루틴", domains: ["SL", "MT"], progress: 63 },
        { id: "summer-skin", title: "여름 피부관리 루틴", type: "시즈널 루틴", domains: ["SK", "SP"], progress: 84 },
        { id: "interview", title: "면접 전 루틴", type: "상황별 루틴", domains: ["ST", "SO"], progress: 71 },
      ],
    };
  }

  function loadMySerkan() {
    const fallback = defaultMySerkan();
    try {
      const saved = JSON.parse(localStorage.getItem(MY_SERKAN_STORAGE_KEY) || "{}");
      return {
        ...fallback,
        ...saved,
        profile: { ...fallback.profile, ...(saved.profile || {}) },
        today: { ...fallback.today, ...(saved.today || {}) },
        goals: Array.isArray(saved.goals) ? saved.goals.slice(0, 2) : fallback.goals,
        builder: {
          ...fallback.builder,
          ...(saved.builder || {}),
          selectedCodes: Array.isArray(saved.builder?.selectedCodes) ? saved.builder.selectedCodes : fallback.builder.selectedCodes,
        },
        savedRoutines: Array.isArray(saved.savedRoutines) && saved.savedRoutines.length ? saved.savedRoutines : fallback.savedRoutines,
      };
    } catch {
      return fallback;
    }
  }

  function saveMySerkan() {
    localStorage.setItem(MY_SERKAN_STORAGE_KEY, JSON.stringify(state.mySerkan || defaultMySerkan()));
  }

  function updateMySerkanProfile(field, value) {
    state.mySerkan.profile = { ...(state.mySerkan.profile || {}), [field]: value };
    saveMySerkan();
    render();
  }

  function updateMySerkanBuilder(patch = {}) {
    state.mySerkan.builder = {
      ...(state.mySerkan.builder || defaultMySerkan().builder),
      ...patch,
    };
    saveMySerkan();
  }

  function toggleMySerkanBuilderRoutine(code) {
    if (!code || !byCode.routines.has(code)) return;
    const builder = state.mySerkan.builder || defaultMySerkan().builder;
    const selectedCodes = Array.isArray(builder.selectedCodes) ? [...builder.selectedCodes] : [];
    const nextCodes = selectedCodes.includes(code)
      ? selectedCodes.filter((entry) => entry !== code)
      : [...selectedCodes, code].slice(0, 12);
    updateMySerkanBuilder({ selectedCodes: nextCodes });
    render();
  }

  function setMySerkanBuilderFilter(filter) {
    updateMySerkanBuilder({ filter: filter || "recommended" });
    render();
  }

  function saveMySerkanBuiltRoutine() {
    const builder = state.mySerkan.builder || defaultMySerkan().builder;
    const selectedCodes = Array.isArray(builder.selectedCodes) ? builder.selectedCodes.filter((code) => byCode.routines.has(code)) : [];
    if (!selectedCodes.length) {
      showToast("저장할 루틴을 먼저 선택해주세요.");
      return;
    }
    const titleInput = document.querySelector("[data-my-builder-title]");
    const title = (titleInput?.value || builder.title || "").trim() || "나만의 SERKAN 루틴";
    const selectedRoutines = selectedCodes.map((code) => byCode.routines.get(code)).filter(Boolean);
    const domains = uniq(selectedRoutines.map((routine) => routine.domain).filter(Boolean));
    state.mySerkan.savedRoutines = [
      {
        id: `custom-${Date.now()}`,
        title,
        type: `${selectedRoutines.length}개 루틴 구성`,
        domains,
        progress: 0,
        routineCodes: selectedCodes,
      },
      ...(state.mySerkan.savedRoutines || []),
    ].slice(0, 12);
    updateMySerkanBuilder({ title: "", selectedCodes: [] });
    showToast("MY ROUTINE에 저장했습니다.");
    render();
  }

  function updateMySerkanToday(field, value) {
    state.mySerkan.today = { ...(state.mySerkan.today || {}), [field]: value };
    saveMySerkan();
    render();
  }

  function toggleMySerkanGoal(goal) {
    const goals = Array.isArray(state.mySerkan.goals) ? [...state.mySerkan.goals] : [];
    if (goals.includes(goal)) {
      state.mySerkan.goals = goals.filter((entry) => entry !== goal);
    } else if (goals.length < 2) {
      state.mySerkan.goals = [...goals, goal];
    } else {
      showToast("현재 목표는 최대 2개까지 선택할 수 있습니다.");
      return;
    }
    saveMySerkan();
    render();
  }

  function loadDailyActionState() {
    try {
      return {
        focusIndex: 0,
        waterMl: 1400,
        ...JSON.parse(localStorage.getItem("SERKAN_DAILY_ACTIONS") || "{}"),
      };
    } catch {
      return { focusIndex: 0, waterMl: 1400 };
    }
  }

  function saveDailyActionState() {
    localStorage.setItem("SERKAN_DAILY_ACTIONS", JSON.stringify(state.dailyActions));
  }

  function loadWeeklyFocusCategory() {
    return localStorage.getItem("SERKAN_WEEKLY_FOCUS_CATEGORY") || "";
  }

  function saveWeeklyFocusCategory() {
    localStorage.setItem("SERKAN_WEEKLY_FOCUS_CATEGORY", state.weeklyFocusCategory || "");
  }

  function loadMonthlyFocus() {
    return localStorage.getItem("SERKAN_MONTHLY_FOCUS") || "";
  }

  function saveMonthlyFocus() {
    localStorage.setItem("SERKAN_MONTHLY_FOCUS", state.monthlyFocus || "");
  }

  function loadCustomEntries() {
    try {
      const entries = JSON.parse(localStorage.getItem("SERKAN_CUSTOM_ROUTINES") || "[]");
      const weeklyEntries = JSON.parse(localStorage.getItem("SERKAN_CUSTOM_WEEKLY_ROUTINES") || "[]");
      return [...(Array.isArray(entries) ? entries : []), ...(Array.isArray(weeklyEntries) ? weeklyEntries : [])]
        .filter((entry, index, all) => entry?.code && entry?.title && all.findIndex((item) => item.code === entry.code) === index)
        .map((entry) => ({ ...entry, isCustom: true }));
    } catch {
      return [];
    }
  }

  function saveCustomEntries() {
    localStorage.setItem("SERKAN_CUSTOM_ROUTINES", JSON.stringify(state.customEntries));
  }

  function mergeCustomEntries() {
    const existingCodes = new Set(data.routines.map((routine) => routine.code));
    const existingSituationCodes = new Set(data.situations.map((situation) => situation.code));
    state.customEntries.forEach((entry) => {
      if ((entry.customType || entry.board) === "situation") {
        if (!existingSituationCodes.has(entry.code)) {
          data.situations.push(entry);
          existingSituationCodes.add(entry.code);
        }
        return;
      }
      if (!existingCodes.has(entry.code)) {
        data.routines.push(entry);
        existingCodes.add(entry.code);
      }
    });
  }

  function nextCustomCode(boardType) {
    const meta = addRoutineBoardMeta[boardType] || addRoutineBoardMeta.weekly;
    const used = new Set([
      ...data.routines.map((routine) => routine.code),
      ...data.situations.map((situation) => situation.code),
      ...state.customEntries.map((entry) => entry.code),
    ]);
    let number = 1;
    while (used.has(`SR26-CUSTOM-${meta.codePrefix}-R${number}`)) number += 1;
    return `SR26-CUSTOM-${meta.codePrefix}-R${number}`;
  }

  function createCustomEntry(formData) {
    const boardType = String(formData.get("boardType") || "weekly");
    const meta = addRoutineBoardMeta[boardType] || addRoutineBoardMeta.weekly;
    const location = String(formData.get("location") || meta.defaultLocation);
    const domain = formData.get("domain") || "SY";
    const title = String(formData.get("title") || "").trim();
    const frequency = String(formData.get("frequency") || "Weekly").trim() || "Weekly";
    const summary = String(formData.get("summary") || "").trim();
    if (!title) return null;
    const category = byCode.categories.get(domain);
    const base = {
      code: nextCustomCode(boardType),
      title,
      domain,
      topic: "CUSTOM",
      category: category?.name || categoryName(domain),
      frequency,
      priority: "사용자 추가",
      tags: uniq(["사용자 추가", "Custom", frequency, category?.name || domain]),
      summary,
      action: summary || title,
      manualCode: null,
      itemCode: null,
      connectionStatus: "custom",
      linkConfidence: "custom",
      isCustom: true,
      customType: boardType,
      createdAt: new Date().toISOString(),
    };
    const entry = meta.storageType === "situation"
      ? {
        ...base,
        type: location === "기타" ? "Situation" : location,
        priority: frequency,
        trigger: summary,
      }
      : {
        ...base,
        board: boardType,
        weekday: boardType === "weekly" ? location : "",
        timeBlocks: [location],
      };
    state.customEntries.push(entry);
    if (meta.storageType === "situation") data.situations.push(entry);
    else data.routines.push(entry);
    rebuildIndexes();
    saveCustomEntries();
    return entry;
  }

  function deleteCustomEntry(code) {
    const entry = byCode.routines.get(code) || byCode.situations.get(code);
    if (!entry?.isCustom) return false;
    state.customEntries = state.customEntries.filter((item) => item.code !== code);
    const routineIndex = data.routines.findIndex((item) => item.code === code);
    if (routineIndex !== -1) data.routines.splice(routineIndex, 1);
    const situationIndex = data.situations.findIndex((item) => item.code === code);
    if (situationIndex !== -1) data.situations.splice(situationIndex, 1);
    Object.keys(state.weeklyDone).forEach((key) => {
      if (key.endsWith(`:${code}`)) delete state.weeklyDone[key];
    });
    saveWeeklyDone();
    saveCustomEntries();
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

  function loadRecentItems() {
    try {
      const entries = JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY) || "[]");
      if (!Array.isArray(entries)) return [];
      return entries
        .filter((entry) => entry?.type && entry?.code && entry?.title)
        .slice(0, RECENT_LIMIT);
    } catch {
      return [];
    }
  }

  function saveRecentItems() {
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(state.recentItems.slice(0, RECENT_LIMIT)));
  }

  function clearRecentItems() {
    state.recentItems = [];
    saveRecentItems();
    renderDrawer();
    showToast("최근 본 항목을 비웠습니다.");
  }

  function deleteRecentItem(type, code) {
    state.recentItems = state.recentItems.filter((entry) => !(entry.type === type && entry.code === code));
    saveRecentItems();
    renderDrawer();
  }

  function recordRecentItem(type, code) {
    const entry = buildRecentEntry(type, code);
    if (!entry) return;
    state.recentItems = [
      entry,
      ...state.recentItems.filter((item) => !(item.type === entry.type && item.code === entry.code)),
    ].slice(0, RECENT_LIMIT);
    saveRecentItems();
  }

  function buildRecentEntry(type, code) {
    if (!["routine", "manual", "item", "productSlot", "product", "brand", "ingredient", "situation"].includes(type)) return null;
    const openedAt = new Date().toISOString();
    if (type === "routine") {
      const routine = byCode.routines.get(code);
      if (!routine) return null;
      return {
        type,
        code,
        title: routine.title,
        subtitle: [routine.board, routine.frequency, categoryName(routine.domain)].filter(Boolean).join(" · "),
        openedAt,
        icon: categoryVisual[routine.domain]?.icon || "☑",
      };
    }
    if (type === "manual") {
      const manual = byCode.manuals.get(code);
      if (!manual) return null;
      return {
        type,
        code,
        title: manual.title,
        subtitle: [categoryName(manual.domain), manual.summary].filter(Boolean).join(" · "),
        openedAt,
        icon: categoryVisual[manual.domain]?.icon || "📘",
      };
    }
    if (type === "item") {
      const item = byCode.items.get(code);
      if (!item) return null;
      return {
        type,
        code,
        title: item.name,
        subtitle: [categoryName(item.domain), item.role].filter(Boolean).join(" · "),
        openedAt,
        icon: categoryVisual[item.domain]?.icon || iconForItem(item),
      };
    }
    if (type === "productSlot") {
      const detail = getProductSlotByCode(code);
      if (!detail) return null;
      const { group, slot, products } = detail;
      return {
        type,
        code,
        title: slot.label || slot.id || "Product Slot",
        subtitle: [group.item?.name || group.title, `제품 ${products.length}개`].filter(Boolean).join(" · "),
        openedAt,
        icon: categoryVisual[group.domain]?.icon || "▦",
      };
    }
    if (type === "product") {
      const product = byCode.products.get(code);
      if (!product || isMockProduct(product)) return null;
      const item = byCode.items.get(product.itemCode);
      return {
        type,
        code,
        title: product.productName,
        subtitle: [product.brand, item?.name || product.category].filter(Boolean).join(" · "),
        openedAt,
        icon: "🛍️",
      };
    }
    if (type === "situation") {
      const situation = byCode.situations.get(code);
      if (!situation) return null;
      return {
        type,
        code,
        title: situation.title,
        subtitle: [situation.type, situation.priority].filter(Boolean).join(" · "),
        openedAt,
        icon: iconForSituation(situation.title),
      };
    }
    if (type === "brand") {
      const brand = getBrandEntryByCode(code);
      if (!brand) return null;
      return {
        type,
        code,
        title: brand.name,
        subtitle: [categoryName(brand.domain), `제품 ${brand.products.length}개`].filter(Boolean).join(" · "),
        openedAt,
        icon: "🏷️",
      };
    }
    if (type === "ingredient") {
      const item = getIngredientEntryByCode(code);
      if (!item) return null;
      return {
        type,
        code,
        title: item.name,
        subtitle: [item.english, item.effects.slice(0, 2).join(" · ")].filter(Boolean).join(" · "),
        openedAt,
        icon: item.icon || "🧪",
      };
    }
    return null;
  }

  function resolveRecentEntry(entry) {
    const fresh = buildRecentEntry(entry.type, entry.code);
    if (!fresh) return null;
    return { ...fresh, openedAt: entry.openedAt || fresh.openedAt };
  }

  function recentTypeLabel(type) {
    const labels = {
      routine: "Routine",
      manual: "Manual",
      item: "Item",
      productSlot: "Product Slot",
      product: "Product",
      brand: "Brand",
      ingredient: "Principle",
      situation: "Situation",
    };
    return labels[type] || type;
  }

  function formatRecentTime(value) {
    const time = new Date(value).getTime();
    if (!Number.isFinite(time)) return "방금 전";
    const diff = Date.now() - time;
    if (diff < 60 * 1000) return "방금 전";
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}분 전`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}시간 전`;
    if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))}일 전`;
    return new Date(value).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
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
    return (item?.name || product?.productName || "Item Product Slots")
      .replace(/\s*(가성비|민감\/입문|프리미엄)\s*추천 제품\s*$/g, "")
      .replace(/\s*추천 제품\s*$/g, "")
      .trim();
  }

  function normalizeSlotLabel(value) {
    return String(value || "")
      .replace(/[·・]/g, "/")
      .replace(/\s+/g, "")
      .toLowerCase();
  }

  function slotMatchesProduct(slot, product) {
    if (product.slotId && slot.id && normalizeSlotLabel(product.slotId) === normalizeSlotLabel(slot.id)) return true;
    const slotKeys = [slot.id, slot.label, ...(slot.aliases || [])].map(normalizeSlotLabel).filter(Boolean);
    const productKeys = [product.recommendationType, product.slot].map(normalizeSlotLabel).filter(Boolean);
    return slotKeys.some((slotKey) => productKeys.some((productKey) => productKey === slotKey || productKey.includes(slotKey) || slotKey.includes(productKey)));
  }

  function productSlotCode(itemCode, slot) {
    return `${itemCode}::${encodeURIComponent(slot.id || slot.label || "slot")}`;
  }

  function getProductSlotByCode(code) {
    const [itemCode, encodedSlotId] = String(code || "").split("::");
    const group = getProductGroupByCode(itemCode);
    if (!group || !encodedSlotId) return null;
    const slotId = decodeURIComponent(encodedSlotId);
    const slot = getItemProductSlots(group).find((entry) => String(entry.id || entry.label) === slotId);
    if (!slot) return null;
    const products = group.allProducts.filter((product) => slotMatchesProduct(slot, product) && !isMockProduct(product));
    return { group, slot, products };
  }

  function getItemProductSlots(group) {
    const configured = group.item?.productSlots || group.item?.recommendationSlots;
    if (Array.isArray(configured) && configured.length) {
      return configured.map((slot) => typeof slot === "string" ? { id: slot, label: slot } : slot);
    }
    return group.recommendationTypes.map((type) => ({ id: type, label: type }));
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

  function matchesSearchQuery(entity, query) {
    const text = searchableText(entity);
    const tokens = query.split(/\s+/).filter(Boolean);
    if (!tokens.length) return false;
    return tokens.every((token) => text.includes(token));
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
    if (type === "manual") recordManualView(code);
    state.history.push({ view: state.view, query: state.query, selected: state.selected });
    state.selected = { type, code };
    recordRecentItem(type, code);
    renderDrawer();
    publishSerkanContext({ reason: "open-detail" });
    publishSerkanAction("open_detail", { targetType: type, targetCode: code });
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
    render();
    publishSerkanContext({ reason: "close-detail" });
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
    if (kind === "daily") return renderDailyMatrixBoard();
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
              <h2>${isWeekly ? "위클리 루틴 보드" : "데일리 루틴 보드"}</h2>
              <p>${isWeekly ? "일주일 단위로 실행하는 관리 루틴을 정리했습니다." : "하루 단위를 관리하는 핵심 루틴을 시간 흐름에 따라 정리했습니다."}</p>
            </div>
          </div>
          <span class="count ${isWeekly ? "weekly" : ""}">총 ${routines.length}개 루틴</span>
        </div>
        ${groupEntries.slice(0, 6).map(([group, groupRoutines]) => renderRoutineGroup(group, groupRoutines, isWeekly)).join("")}
        <button class="board-cta" data-view="manuals">전체 ${isWeekly ? "위클리" : "데일리"} 루틴 매뉴얼 보기 →</button>
      </article>
    `;
  }

  const dailyMatrixRows = [
    { key: "기상", label: "기상", icon: "🌅", time: "06:00 ~ 07:30", sourceGroups: ["기상"] },
    { key: "업무", label: "업무", icon: "☀️", time: "07:30 ~ 12:00", sourceGroups: ["업무"] },
    { key: "오후", label: "오후", icon: "🌤️", time: "12:00 ~ 18:00", sourceGroups: ["점심", "오후"] },
    { key: "저녁", label: "저녁", icon: "🌙", time: "18:00 ~ 22:30", sourceGroups: ["저녁"] },
    { key: "수면", label: "수면", icon: "🛏️", time: "22:30 ~", sourceGroups: ["수면"] },
  ];

  const dailyMatrixDomains = ["SK", "GR", "BD", "FD", "SL", "SP", "SY"];

  const dailyFocusOptions = [
    { title: "피부 컨디션 관리", desc: "선크림, 보습, 클렌징 집중 관리", group: "기상" },
    { title: "수분 섭취 리듬", desc: "물, 전해질, 식후 보충 루틴 확인", group: "오후" },
    { title: "공간 정돈", desc: "책상, 침구, 환기 루틴 중심 관리", group: "업무" },
    { title: "수면 준비", desc: "조명, 디지털 디톡스, 취침 환경 관리", group: "수면" },
  ];

  function renderDailyMatrixBoard() {
    const routines = data.routines.filter((routine) => routine.board === "daily");
    const completed = routines.filter((routine) => isDailyRoutineDone(routine)).length;
    const pending = Math.max(0, routines.length - completed);
    const missed = routines.filter((routine) => !isDailyRoutineDone(routine) && /의무|필수|중요/.test([routine.priority, ...(routine.tags || [])].join(" "))).length;
    const percent = routines.length ? Math.round((completed / routines.length) * 100) : 0;
    const focus = dailyFocusOptions[state.dailyActions.focusIndex % dailyFocusOptions.length] || dailyFocusOptions[0];
    const waterMl = Math.max(0, Math.min(2000, Number(state.dailyActions.waterMl) || 0));
    const waterPercent = Math.round((waterMl / 2000) * 100);
    return `
      <article class="daily-matrix-board" id="daily-board">
        <div class="daily-matrix-layout">
          <section class="daily-matrix-main">
            <header class="daily-matrix-hero">
              <div class="daily-matrix-title">
                <div class="daily-matrix-orb">☀️</div>
                <div>
                  <span>데일리 시스템</span>
                  <h2>데일리 루틴 보드</h2>
                  <p>하루 단위를 관리하는 핵심 루틴을 시간 흐름에 따라 정리했습니다.</p>
                </div>
              </div>
              <div class="daily-matrix-actions">
                <button class="ghost-action" data-action="add-routine" data-board="daily" data-location="기상">+ 루틴 추가</button>
                <button class="ghost-action" type="button">⚙ 보드 설정</button>
              </div>
            </header>
            <div class="daily-matrix-kpis">
              ${renderOpsKpi("🗓️", "오늘 루틴", `${routines.length}개`, "전체 계획")}
              ${renderOpsKpi("✅", "완료", `${completed}개`, `${percent}%`)}
              ${renderOpsKpi("🕒", "예정", `${pending}개`, `${routines.length ? Math.round((pending / routines.length) * 100) : 0}%`)}
              ${renderOpsKpi("⚠️", "미완료", `${missed}개`, "우선 확인")}
              ${renderOpsKpi("🔥", "연속 실행", `${Math.max(1, Math.min(12, completed || 1))}일`, "최장 기록")}
            </div>
            <div class="daily-matrix-table" role="table" aria-label="Daily Routine Matrix">
              ${dailyMatrixRows.map((row) => renderDailyMatrixRow(row, routines)).join("")}
            </div>
            <div class="daily-matrix-bottom">
              ${renderDailyBottomCard("🎯", "오늘의 집중 영역", focus.title, focus.desc, "변경", { action: "cycle-daily-focus" })}
              ${renderDailyBottomCard("⭐", "오늘의 챌린지", "물 2L 마시기", `${(waterMl / 1000).toFixed(1)}L / 2L (${waterPercent}%)`, "기록", { action: "log-daily-water" })}
              ${renderDailyBottomCard("🔥", "연속 실행 기록", `${Math.max(1, Math.min(12, completed || 1))}일 연속`, "최장 18일 기록", "기록 보기", { action: "open-daily-streak" })}
              ${renderDailyBottomCard("+", "빠른 추가", "자주 쓰는 루틴을 빠르게 추가하세요.", "", "루틴 추가", { action: "add-routine", board: "daily", location: "기상" })}
            </div>
          </section>
          <aside class="daily-matrix-side">
            <section class="ops-panel progress-panel">
              <h3>오늘 전체 진행률</h3>
              <div class="progress-panel-body">
                ${renderDonut(percent, `${completed} / ${routines.length}`)}
                <div class="progress-legend">
                  <span><i style="background:#42b05c;"></i>완료 <b>${completed}</b></span>
                  <span><i style="background:#4ba3df;"></i>예정 <b>${pending}</b></span>
                  <span><i style="background:#f5a623;"></i>미완료 <b>${missed}</b></span>
                </div>
              </div>
            </section>
            <section class="ops-panel">
              <h3>🔥 연속 실행</h3>
              <div class="daily-streak-card"><strong>${Math.max(1, Math.min(12, completed || 1))}일</strong><span>최장 연속 기록</span></div>
            </section>
          </aside>
        </div>
      </article>
    `;
  }

  function renderDailyMatrixRow(row, routines) {
    const rowRoutines = routines.filter((routine) => row.sourceGroups.includes(dailyGroupForRoutine(routine)));
    const completed = rowRoutines.filter((routine) => isDailyRoutineDone(routine)).length;
    const total = rowRoutines.length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    return `
      <section class="daily-matrix-row" style="--row-accent:${dailySectionMeta[row.sourceGroups[0]]?.accent || "#b56a50"};">
        <button class="daily-row-meta" data-action="open-daily-library" data-group="${esc(row.sourceGroups[0])}">
          <span>${esc(row.icon)}</span>
          <strong>${esc(row.label)}</strong>
          <em>${esc(row.time)}</em>
          <b>${total}개 루틴</b>
        </button>
        <div class="daily-matrix-cells">
          ${dailyMatrixDomains.map((domain) => renderDailyMatrixCell(row, domain, rowRoutines)).join("")}
        </div>
        <div class="daily-row-progress">
          <strong>${completed} / ${total}</strong>
          ${renderMiniProgress(percent)}
          <button data-action="open-daily-library" data-group="${esc(row.sourceGroups[0])}" aria-label="${esc(row.label)} 전체 보기">›</button>
        </div>
      </section>
    `;
  }

  function renderDailyMatrixCell(row, domain, rowRoutines) {
    const cat = byCode.categories.get(domain);
    const routines = rowRoutines
      .filter((routine) => routine.domain === domain)
      .sort((a, b) => weeklyRoutinePriority(a) - weeklyRoutinePriority(b) || a.title.localeCompare(b.title, "ko"));
    const expanded = isDailyMatrixCellExpanded(row.key, domain);
    const visibleLimit = 2;
    const visible = expanded ? routines : routines.slice(0, visibleLimit);
    const hiddenCount = Math.max(0, routines.length - visibleLimit);
    return `
      <div class="daily-matrix-cell" style="--cat-accent:${cat?.accent || "#58170d"};">
        <div class="daily-cell-head">
          <span>${esc(categoryVisual[domain]?.icon || cat?.icon || "◇")}</span>
          <strong>${esc(categoryName(domain))}</strong>
        </div>
        <div class="daily-cell-tasks">
          ${visible.length
            ? visible.map((routine) => renderDailyMatrixTask(row, routine)).join("")
            : `<em class="daily-cell-empty">-</em>`}
          ${hiddenCount ? `<button class="daily-cell-more" data-action="toggle-daily-cell" data-row="${esc(row.key)}" data-domain="${esc(domain)}" aria-expanded="${expanded ? "true" : "false"}">${expanded ? "접기" : `... +${hiddenCount}`}</button>` : ""}
        </div>
      </div>
    `;
  }

  function renderDailyMatrixTask(row, routine) {
    const doneKey = dailyDoneKeyForRoutine(routine);
    const checked = isWeeklyDone(doneKey, routine.code);
    return `
      <div class="daily-matrix-task clickable ${checked ? "is-done" : ""}" data-open-type="routine" data-code="${esc(routine.code)}">
        <input type="checkbox" ${checked ? "checked" : ""} data-action="toggle-routine-check" data-key="${esc(doneKey)}" data-code="${esc(routine.code)}" aria-label="${esc(routine.title)} 완료">
        <strong>${esc(routine.title)}</strong>
      </div>
    `;
  }

  function dailyDoneKeyForRoutine(routine) {
    return `daily:${dailyGroupForRoutine(routine)}:${routine.domain}`;
  }

  function isDailyRoutineDone(routine) {
    return isWeeklyDone(dailyDoneKeyForRoutine(routine), routine.code);
  }

  function dailyMatrixCellKey(rowKey, domain) {
    return `dailyMatrix:${rowKey}:${domain}`;
  }

  function isDailyMatrixCellExpanded(rowKey, domain) {
    return Boolean(state.expandedGroups[dailyMatrixCellKey(rowKey, domain)]);
  }

  function toggleDailyMatrixCell(rowKey, domain) {
    const scrollY = window.scrollY;
    const key = dailyMatrixCellKey(rowKey, domain);
    state.expandedGroups[key] = !state.expandedGroups[key];
    render();
    restoreScroll(scrollY);
  }

  function restoreScroll(scrollY) {
    window.requestAnimationFrame(() => window.scrollTo({ top: scrollY, left: 0, behavior: "auto" }));
  }

  function renderMiniProgress(percent) {
    return `
      <div class="mini-progress" style="--percent:${Math.max(0, Math.min(100, percent || 0))};">
        <span>${Math.max(0, Math.min(100, percent || 0))}%</span>
      </div>
    `;
  }

  function renderDailyBottomCard(icon, title, main, sub, button, options = {}) {
    const attrs = [
      options.action ? `data-action="${esc(options.action)}"` : `type="button"`,
      options.board ? `data-board="${esc(options.board)}"` : "",
      options.location ? `data-location="${esc(options.location)}"` : "",
      options.group ? `data-group="${esc(options.group)}"` : "",
    ].filter(Boolean).join(" ");
    return `
      <section class="daily-bottom-card">
        <span>${esc(icon)}</span>
        <div>
          <strong>${esc(title)}</strong>
          <b>${esc(main)}</b>
          ${sub ? `<em>${esc(sub)}</em>` : ""}
        </div>
        <button ${attrs}>${esc(button)}</button>
      </section>
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
        ${!isWeekly ? `<button class="weekly-add routine-add-inline" data-action="add-routine" data-board="daily" data-location="${esc(group)}">+ 루틴 추가</button>` : ""}
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
    { key: "월", short: "MON", date: "06.09", label: "월요일", color: "#ef4444", terms: ["상체", "업무 공간", "리필", "풀업", "목", "수면 질", "근력", "등 상부", "마그네슘", "비타민B"] },
    { key: "화", short: "TUE", date: "06.10", label: "화요일", color: "#f97316", terms: ["유산소", "재고", "수납", "러닝", "확인", "전력 질주", "전해질", "신발", "가방", "보풀"] },
    { key: "수", short: "WED", date: "06.11", label: "수요일", color: "#eab308", terms: ["하체", "두피", "영양제", "레티놀", "눈썹", "피부", "헤어라인", "턱라인", "T존", "U존"] },
    { key: "목", short: "THU", date: "06.12", label: "목요일", color: "#22a447", terms: ["스트레칭", "욕실", "침구 점검", "반신욕", "정리", "거울", "변기", "바닥", "진정", "스팀타월"] },
    { key: "금", short: "FRI", date: "06.13", label: "금요일", color: "#2f80d8", terms: ["전신", "업무 파일", "식단 점검", "데드리프트", "사우나", "마사지", "스쿼트랙", "웨이트", "전완"] },
    { key: "토", short: "SAT", date: "06.14", label: "토요일", color: "#8b5cf6", terms: ["침구 세탁", "면도날", "옷장", "장보기", "세탁", "청소", "수납장", "싱크대", "먼지", "마른 세탁물"] },
    { key: "일", short: "SUN", date: "06.15", label: "일요일", color: "#ec4899", terms: ["회고", "다음주", "냉장고", "산책", "마스크팩", "손톱", "가르마", "계획", "발톱", "큐티클", "전자기기 없이"] },
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
    const activeFilter = state.routineFilters.weekly || "all";
    const filteredRoutines = activeFilter === "all" ? routines : routines.filter((routine) => routine.domain === activeFilter);
    const columns = weeklyColumns(filteredRoutines);
    const allColumns = weeklyColumns(routines);
    const total = routines.length;
    const completed = allColumns.reduce((sum, day) => sum + day.routines.filter((routine) => isWeeklyDone(day.key, routine.code)).length, 0);
    const pending = Math.max(0, total - completed);
    const missed = allColumns.reduce((sum, day) => sum + day.routines.filter((routine) => !isWeeklyDone(day.key, routine.code) && /의무|중요|필수/.test([routine.priority, ...(routine.tags || [])].join(" "))).length, 0);
    const percent = total ? Math.round((completed / total) * 100) : 0;
    const missedDomains = topRoutineDomains(routines.filter((routine) => !allColumns.some((day) => isWeeklyDone(day.key, routine.code))));
    const focusDomain = weeklyFocusDomain(missedDomains);
    const recommendations = routines.slice().sort((a, b) => weeklyRoutinePriority(a) - weeklyRoutinePriority(b)).slice(0, 3);
    return `
      <article class="ops-board weekly-board weekly-execution-board" id="weekly-board">
        <header class="ops-hero">
          <div>
            <span class="ops-kicker">위클리 시스템</span>
            <h2>위클리 루틴 보드</h2>
            <p>이번 주 실행할 루틴을 요일별, 카테고리별로 관리하세요.</p>
          </div>
          <div class="ops-actions">
            <button class="ghost-action" type="button">✥ 자동 균형 배치</button>
            <button class="primary-action" data-action="add-routine" data-board="weekly" data-location="월">+ 주간 루틴 추가</button>
          </div>
        </header>
        <div class="ops-shell">
          <div class="ops-main">
            <div class="ops-kpi-grid weekly-kpi-grid">
              ${renderOpsKpi("🗓️", "총 루틴", `${total}개`, "+8개 추가")}
              ${renderOpsKpi("✅", "완료", `${completed}개`, `${percent}%`)}
              ${renderOpsKpi("🕒", "남은 루틴", `${pending}개`, `${total ? Math.round((pending / total) * 100) : 0}%`)}
              ${renderWeeklyFocusKpi(focusDomain, missedDomains)}
              ${renderOpsKpi("🔥", "연속 실행", `${Math.max(1, Math.min(12, completed || 1))}일`, "최장 기록")}
            </div>
            ${renderRoutineFilter("weekly", ["all", ...commonCategoryOrder.filter((code) => code !== "ST")])}
            <div class="weekly-board-grid ops-week-grid">
              ${columns.map(renderWeeklyDayColumn).join("")}
            </div>
          </div>
          <aside class="ops-side">
            ${renderProgressPanel("이번 주 진행 현황", percent, `${completed} / ${total}`, [
              ["완료", completed, "#42b05c"],
              ["예정", pending, "#4ba3df"],
              ["누락", missed, "#f5a623"],
            ])}
            ${renderMissedCategoryPanel(missedDomains)}
            ${renderRecommendationPanel("추천 루틴", recommendations)}
            ${renderQuickActionPanel("weekly", "월")}
          </aside>
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
            <strong>${esc(day.short || day.label)}</strong>
            <span>${esc(day.date || day.label)} · ${completed} / ${total} 완료</span>
          </div>
          <em>${total}</em>
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
          <strong>${esc(cat?.name || category.domain)} (${category.routines.length})</strong>
          <em>⌄</em>
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
    publishSerkanAction("routine_check", {
      targetType: "routine",
      targetCode: code,
      done: state.weeklyDone[key],
      bucket: dayKey,
    });
    scrollAfterRender("#weekly-board", "auto");
  }

  function toggleRoutineDone(bucketKey, code) {
    const key = weeklyDoneKey(bucketKey, code);
    state.weeklyDone[key] = !state.weeklyDone[key];
    saveWeeklyDone();
    render();
    publishSerkanAction("routine_check", {
      targetType: "routine",
      targetCode: code,
      done: state.weeklyDone[key],
      bucket: bucketKey,
    });
    const keyText = String(bucketKey || "");
    const target = keyText.startsWith("daily:")
      ? "#daily-board"
      : keyText.startsWith("seasonal:")
        ? "#seasonal-board"
        : "#monthly-board";
    scrollAfterRender(target, "auto");
  }

  function setSharedRoutineDone(bucketKey, code, done) {
    if (!bucketKey || !code) return;
    const key = weeklyDoneKey(bucketKey, code);
    const nextDone = Boolean(done);
    if (Boolean(state.weeklyDone[key]) === nextDone) return;
    state.weeklyDone[key] = nextDone;
    saveWeeklyDone();
    render();
  }

  function getSharedRoutineDone() {
    return { ...state.weeklyDone };
  }

  window.SERKAN_TEAM_API = {
    setRoutineDone: setSharedRoutineDone,
    getRoutineDone: getSharedRoutineDone,
  };

  function renderCustomPlanningBoard(kind) {
    if (kind === "monthly") return renderMonthlyRoutineBoard();
    if (kind === "seasonal") return renderSeasonalRoutineBoard();
    const meta = addRoutineBoardMeta[kind];
    const routines = data.routines.filter((routine) => routine.board === kind);
    const groups = meta.options.map((option) => ({
      label: option,
      routines: routines.filter((routine) => (routine.timeBlocks || []).includes(option)),
    }));
    return `
      <article class="board planning-board ${kind}-board" id="${esc(kind)}-board">
        <div class="board-head">
          <div class="board-title">
            <div class="orb ${kind === "seasonal" ? "seasonal" : "weekly"}">${kind === "monthly" ? "◫" : "❄︎"}</div>
            <div>
              <h2>${kind === "monthly" ? "월간 루틴 보드" : "시즈널 루틴 보드"}</h2>
              <p>${kind === "monthly" ? "월간 점검, 교체, 재구매, 정리 루틴을 추가해 관리합니다." : "계절별로 바뀌는 관리 루틴을 추가해 관리합니다."}</p>
            </div>
          </div>
          <button class="weekly-add board-add-btn" data-action="add-routine" data-board="${esc(kind)}" data-location="${esc(meta.defaultLocation)}">+ ${kind === "monthly" ? "월간" : "계절"} 루틴 추가</button>
        </div>
        <div class="planning-grid">
          ${groups.map((group) => renderPlanningGroup(kind, group)).join("")}
        </div>
      </article>
    `;
  }

  function renderPlanningGroup(kind, group) {
    const meta = addRoutineBoardMeta[kind];
    return `
      <section class="planning-group">
        <div class="planning-group-head">
          <strong>${esc(group.label)}</strong>
          <span>${group.routines.length}개 루틴</span>
        </div>
        <div class="planning-task-list">
          ${group.routines.length
            ? group.routines.map((routine) => renderPlanningTaskPill(routine)).join("")
            : `<div class="weekly-empty">사용자 추가 루틴 없음</div>`}
        </div>
        <button class="weekly-add" data-action="add-routine" data-board="${esc(kind)}" data-location="${esc(group.label)}">+ ${esc(group.label)} 루틴 추가</button>
      </section>
    `;
  }

  function renderPlanningTaskPill(routine) {
    return `
      <button class="weekly-task-pill planning-task-pill clickable" data-open-type="routine" data-code="${esc(routine.code)}">
        <strong>${esc(routine.title)}</strong>
        <span>${esc(routine.frequency || routine.priority || categoryName(routine.domain))}</span>
      </button>
    `;
  }

  function monthlyRoutines() {
    return data.routines.filter((routine) => (
      routine.board === "monthly" ||
      routine.board === "periodic" ||
      ["Monthly", "Quarterly", "Annually"].includes(routine.frequency)
    ));
  }

  const monthlyGroups = [
    { key: "점검", icon: "🗓️", terms: ["점검", "확인", "상태", "필터", "목표", "예비", "재정"] },
    { key: "교체", icon: "🔁", terms: ["교체", "갈기", "면도날", "칫솔", "커버", "침구", "향수"] },
    { key: "재구매", icon: "🛒", terms: ["재구매", "리필", "구매", "재고", "영양제", "비타민", "단백질", "프로틴"] },
    { key: "정리", icon: "🧺", terms: ["정리", "파일", "옷장", "수납", "분류", "유통기한"] },
    { key: "대청소", icon: "🏠", terms: ["대청소", "딥클린", "청소", "먼지", "물때", "세척", "닦기", "후드", "창문", "욕실", "주방"] },
    { key: "기타", icon: "📋", terms: [] },
  ];

  function renderMonthlyRoutineBoard() {
    const routines = monthlyRoutines();
    const groups = groupMonthlyRoutines(routines);
    const flat = groups.flatMap((group) => group.routines);
    const completed = flat.filter((routine) => isWeeklyDone(`monthly:${monthlyGroupForRoutine(routine)}`, routine.code)).length;
    const incomplete = flat.filter((routine) => !isWeeklyDone(`monthly:${monthlyGroupForRoutine(routine)}`, routine.code));
    const total = flat.length;
    const delayed = incomplete.filter((routine) => monthlyStatus(routine) === "확인 필요").length;
    const checkNeeded = incomplete.filter((routine) => monthlyStatus(routine) === "점검 필요").length;
    const restockNeeded = incomplete.filter((routine) => monthlyStatus(routine) === "재구매 필요").length;
    const scheduled = incomplete.filter((routine) => monthlyStatus(routine) === "예정").length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    const remaining = Math.max(0, total - completed);
    const focusGroup = monthlyFocusGroup(groups);
    const dominantCycle = monthlyDominantCycle(flat);
    const activeFilter = state.routineFilters.monthly || "all";
    const visibleGroups = activeFilter === "all" ? groups : groups.filter((group) => group.key === activeFilter);
    return `
      <article class="ops-board monthly-board" id="monthly-board">
        <header class="ops-hero">
          <div>
            <span class="ops-kicker">월간 시스템</span>
            <h2>이번 달 루틴 보드</h2>
            <p>월간 점검, 교체, 재구매, 정리, 대청소 루틴을 한눈에 관리하세요.</p>
          </div>
          <div class="ops-actions">
            <button class="ghost-action" type="button">✥ 자동 균형 배치</button>
            <button class="primary-action" data-action="add-routine" data-board="monthly" data-location="점검">+ 월간 루틴 추가</button>
          </div>
        </header>
        <div class="ops-shell">
          <div class="ops-main">
            <div class="ops-kpi-grid monthly-kpi-grid">
              ${renderOpsKpi("▦", "총 항목", `${total}개`, "Monthly / 전체")}
              ${renderOpsKpi("✓", "완료", `${completed}개`, `${percent}%`)}
              ${renderOpsKpi("○", "남은 항목", `${remaining}개`, "대기 중")}
              ${renderMonthlyFocusKpi(focusGroup, groups)}
              ${renderOpsKpi("↻", "관리 주기", esc(dominantCycle.label), `${dominantCycle.count}개`)}
            </div>
            ${renderRoutineFilter("monthly", ["all", ...monthlyGroups.map((group) => group.key)])}
            <div class="monthly-board-grid ops-category-grid">
              ${visibleGroups.map((group) => renderMonthlyColumn(group, focusGroup?.key)).join("")}
            </div>
          </div>
          <aside class="ops-side">
            ${renderProgressPanel("이번 달 진행 현황", percent, `${completed} / ${total}`, [
              ["완료", completed, "#42b05c"],
              ["예정", scheduled, "#1f8ed8"],
              ["확인 필요", delayed, "#f5a623"],
              ["점검 필요", checkNeeded, "#9ca3af"],
              ["재구매 필요", restockNeeded, "#7252c7"],
            ])}
            ${renderMonthlyFocusPanel({ delayed, checkNeeded, restockNeeded, focusGroup })}
          </aside>
        </div>
      </article>
    `;
  }

  function groupMonthlyRoutines(routines) {
    const map = new Map(monthlyGroups.map((group) => [group.key, { ...group, routines: [] }]));
    routines.forEach((routine) => map.get(monthlyGroupForRoutine(routine)).routines.push(routine));
    return [...map.values()];
  }

  function monthlyFocusGroup(groups) {
    const selected = groups.find((group) => group.key === state.monthlyFocus);
    if (selected) return selected;
    return groups
      .slice()
      .sort((a, b) => b.routines.length - a.routines.length)
      .find((group) => group.routines.length) || groups[0];
  }

  function renderMonthlyFocusKpi(focusGroup, groups) {
    return `
      <div class="ops-kpi-card monthly-focus-kpi">
        <span>◇</span>
        <div>
          <em>이번 달 핵심</em>
          <select data-action="set-monthly-focus" aria-label="이번 달 핵심 선택">
            ${groups.map((group) => `<option value="${esc(group.key)}" ${group.key === focusGroup?.key ? "selected" : ""}>${esc(group.key)} · ${group.routines.length}개</option>`).join("")}
          </select>
          <small>${state.monthlyFocus ? "직접 선택" : "자동 추천"}</small>
        </div>
      </div>
    `;
  }

  function weeklyFocusDomain(missedDomains) {
    if (state.weeklyFocusCategory && commonCategoryOrder.includes(state.weeklyFocusCategory)) return state.weeklyFocusCategory;
    return missedDomains[0]?.domain || "SK";
  }

  function renderWeeklyFocusKpi(focusDomain, missedDomains) {
    const recommended = missedDomains[0]?.domain || "SK";
    const domains = commonCategoryOrder.filter((code) => code !== "ST");
    return `
      <div class="ops-kpi-card weekly-focus-kpi">
        <span>🎯</span>
        <div>
          <em>이번 주 포커스</em>
          <select data-action="set-weekly-focus" aria-label="이번 주 집중 카테고리 선택">
            ${domains.map((domain) => `<option value="${esc(domain)}" ${domain === focusDomain ? "selected" : ""}>${esc(categoryName(domain))}</option>`).join("")}
          </select>
          <small>${state.weeklyFocusCategory ? "직접 선택한 관리 영역" : `자동 추천 · ${esc(categoryName(recommended))}`}</small>
        </div>
      </div>
    `;
  }

  function monthlyDominantCycle(routines) {
    const labels = {
      Monthly: "Monthly",
      Quarterly: "Quarterly",
      Annually: "Annually",
      Seasonal: "Seasonal",
    };
    const counts = new Map();
    routines.forEach((routine) => {
      const key = labels[routine.frequency] || labels[(routine.tags || []).find((tag) => labels[tag])] || routine.frequency || "Monthly";
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    const [label = "Monthly", count = 0] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] || [];
    return { label, count };
  }

  function renderMonthlyFocusPanel({ delayed, checkNeeded, restockNeeded, focusGroup }) {
    return `
      <section class="ops-panel monthly-diagnostic-panel">
        <h3>이번 달 확인 포인트</h3>
        <div class="monthly-diagnostic-list">
          <span><strong>확인 필요</strong><em>${delayed}개</em></span>
          <span><strong>점검 항목</strong><em>${checkNeeded}개</em></span>
          <span><strong>재구매 항목</strong><em>${restockNeeded}개</em></span>
          <span><strong>핵심 영역</strong><em>${esc(focusGroup?.key || "점검")}</em></span>
        </div>
      </section>
    `;
  }

  function monthlyGroupForRoutine(routine) {
    const text = routineSearchText(routine);
    const matched = monthlyGroups.find((group) => group.key !== "기타" && group.terms.some((term) => text.includes(term)));
    return matched?.key || "기타";
  }

  function monthlyStatus(routine) {
    const text = routineSearchText(routine);
    if (/지연|딥클린|대청소|Annually|연 1회/.test(text)) return "확인 필요";
    if (/재구매|리필|재고|구매/.test(text)) return "재구매 필요";
    if (/점검|확인|필터|목표|상태/.test(text)) return "점검 필요";
    return "예정";
  }

  function renderMonthlyColumn(group, focusKey = "") {
    const completed = group.routines.filter((routine) => isWeeklyDone(`monthly:${group.key}`, routine.code)).length;
    const incomplete = group.routines.filter((routine) => !isWeeklyDone(`monthly:${group.key}`, routine.code));
    const delayed = incomplete.filter((routine) => monthlyStatus(routine) === "확인 필요").length;
    const scheduled = incomplete.filter((routine) => monthlyStatus(routine) === "예정").length;
    return `
      <section class="ops-column monthly-column ${group.key === focusKey ? "is-focus" : ""}">
        <div class="ops-column-head">
          <span>${esc(group.icon)}</span>
          <div>
            <strong>${esc(group.key)}</strong>
            <em>총 ${group.routines.length}개 · 확인 ${delayed}개 · 예정 ${scheduled}개</em>
          </div>
        </div>
        <div class="ops-task-stack">
          ${group.routines.slice(0, 8).map((routine) => renderMonthlyTaskCard(routine, `monthly:${group.key}`)).join("") || `<div class="weekly-empty">분류된 루틴 없음</div>`}
        </div>
        <button class="weekly-add" data-action="add-routine" data-board="monthly" data-location="${esc(group.key)}">+ ${esc(group.key)} 루틴 추가</button>
      </section>
    `;
  }

  function renderMonthlyTaskCard(routine, doneKey) {
    const checked = isWeeklyDone(doneKey, routine.code);
    const status = checked ? "완료" : monthlyStatus(routine);
    const statusClass = status.includes("확인") ? "danger" : status.includes("완료") ? "done" : status.includes("재구매") ? "purple" : status.includes("점검") ? "progress" : "";
    return `
      <div class="monthly-task-card clickable ${checked ? "is-done" : ""}" data-action="open-weekly-routine" data-code="${esc(routine.code)}">
        <div class="monthly-task-title">
          <input type="checkbox" ${checked ? "checked" : ""} data-action="toggle-routine-check" data-key="${esc(doneKey)}" data-code="${esc(routine.code)}" aria-label="${esc(routine.title)} 완료">
          <strong>${esc(routine.title)}</strong>
        </div>
        <div class="monthly-task-meta">
          <span>${esc(categoryName(routine.domain))}</span>
          <span>${esc(routine.category || categoryLabel(routine.domain))}</span>
        </div>
        <div class="monthly-task-foot">
          <span>${esc(routine.frequency || "Monthly")}</span>
          <em class="status-badge ${statusClass}">${esc(status)}</em>
        </div>
      </div>
    `;
  }

  const seasonMeta = {
    봄: { icon: "🌿", period: "3월 - 5월", terms: ["환기", "먼지", "정리", "알레르기", "봄"] },
    여름: { icon: "☀️", period: "6월 - 8월", terms: ["선크림", "자외선", "수분", "체취", "땀", "냉방", "제습", "여름"] },
    가을: { icon: "🍂", period: "9월 - 11월", terms: ["옷장", "침구 교체", "커튼", "대청소", "가을"] },
    겨울: { icon: "❄️", period: "12월 - 2월", terms: ["보습", "가습기", "습도", "온도", "침구", "건조", "겨울"] },
    "공통 시즌 루틴": { icon: "◎", period: "연중", terms: [] },
  };

  function renderSeasonalRoutineBoard() {
    const activeSeason = state.routineFilters.seasonal || "여름";
    const routines = seasonalRoutinesFor(activeSeason);
    const groups = groupSeasonalRoutines(routines);
    const total = routines.length;
    const completed = routines.filter((routine) => seasonalDone(activeSeason, routine)).length;
    const progress = total ? Math.round((completed / total) * 100) : 0;
    const inProgress = Math.max(0, Math.round((total - completed) * 0.45));
    const upcoming = Math.max(0, total - completed - inProgress);
    return `
      <article class="ops-board seasonal-board" id="seasonal-board">
        <header class="ops-hero">
          <div>
            <span class="ops-kicker">시즈널 시스템</span>
            <h2>시즈널 루틴 보드</h2>
            <p>계절별 핵심 관리 항목을 계획하고, 준비 상태를 체크하세요.</p>
          </div>
          <div class="ops-actions">
            <button class="ghost-action" type="button">🗓️ 계절 변경</button>
            <button class="primary-action" data-action="add-routine" data-board="seasonal" data-location="${esc(activeSeason)}">+ 시즈널 루틴 추가</button>
          </div>
        </header>
        ${renderSeasonTabs(activeSeason)}
        <div class="ops-shell seasonal-shell">
          <div class="ops-main">
            <section class="season-current-card">
              <div class="season-current-copy">
                <span>현재 시즌</span>
                <h3>${esc(seasonMeta[activeSeason]?.icon || "☀️")} ${esc(activeSeason === "여름" ? "여름 준비" : activeSeason)}</h3>
                <p>${esc(seasonMeta[activeSeason]?.period || "연중")} · ${total}개 관리 항목</p>
              </div>
              ${renderDonut(progress, `${completed} / ${total}`)}
              <div class="season-stat-mini"><span>완료</span><strong>${completed}</strong></div>
              <div class="season-stat-mini"><span>진행 중</span><strong>${inProgress}</strong></div>
              <div class="season-stat-mini"><span>예정</span><strong>${upcoming}</strong></div>
            </section>
            <div class="season-category-grid">
              ${groups.map((group) => renderSeasonalCategoryCard(activeSeason, group)).join("")}
            </div>
          </div>
          <aside class="ops-side">
            <section class="ops-panel">
              <h3>이번 시즌 핵심 관리 포인트</h3>
              ${renderSeasonPoint("💧", "자외선 차단 & 피부 보호", "강한 자외선으로부터 피부 보호")}
              ${renderSeasonPoint("🧴", "체취 & 위생 관리 강화", "높은 온도와 습도로 인한 위생 관리")}
              ${renderSeasonPoint("🏃", "수분 & 체력 관리", "땀 배출 증가로 수분과 전해질 보충")}
              ${renderSeasonPoint("🏠", "쾌적한 실내 환경 유지", "냉방, 제습, 청결 유지가 핵심")}
              <button class="panel-link" data-view="guide">자세히 보기 →</button>
            </section>
            ${renderRecommendationPanel("추천 시즈널 루틴", routines.slice(0, 3))}
          </aside>
        </div>
      </article>
    `;
  }

  function seasonalRoutinesFor(season) {
    const candidates = data.routines.filter((routine) => (
      routine.board === "seasonal" ||
      routine.board === "periodic" ||
      ["Quarterly", "Annually", "Seasonal"].includes(routine.frequency)
    ));
    if (season === "공통 시즌 루틴") return candidates.slice(0, 36);
    const terms = seasonMeta[season]?.terms || [];
    const matched = candidates.filter((routine) => terms.some((term) => routineSearchText(routine).includes(term)));
    return (matched.length ? matched : candidates).slice(0, 42);
  }

  function groupSeasonalRoutines(routines) {
    const domains = ["SK", "GR", "BD", "FD", "SP", "SY"];
    return domains.map((domain) => ({
      domain,
      routines: routines.filter((routine) => routine.domain === domain).slice(0, 8),
    })).filter((group) => group.routines.length);
  }

  function seasonalDone(season, routine) {
    return isWeeklyDone(`seasonal:${season}:${routine.domain}`, routine.code);
  }

  function renderSeasonTabs(activeSeason) {
    return `
      <div class="season-tabs">
        ${Object.keys(seasonMeta).map((season) => `<button class="${season === activeSeason ? "active" : ""}" data-action="filter-routine-board" data-board="seasonal" data-filter="${esc(season)}">${esc(seasonMeta[season].icon)} ${esc(season)}</button>`).join("")}
      </div>
    `;
  }

  function renderSeasonalCategoryCard(season, group) {
    const cat = byCode.categories.get(group.domain);
    const completed = group.routines.filter((routine) => seasonalDone(season, routine)).length;
    const percent = group.routines.length ? Math.round((completed / group.routines.length) * 100) : 0;
    return `
      <section class="season-category-card" style="--cat-accent:${cat?.accent || "#58170d"};">
        <div class="season-card-head">
          <span>${esc(categoryVisual[group.domain]?.icon || "◇")}</span>
          <div>
            <strong>${esc(categoryName(group.domain))}</strong>
            <em>${group.routines.length}개 항목</em>
          </div>
          <b>${percent}%</b>
        </div>
        <div class="weekly-progress"><i style="width:${percent}%;"></i></div>
        <div class="ops-task-stack">
          ${group.routines.map((routine) => renderOpsTaskRow(routine, `seasonal:${season}:${group.domain}`, { status: seasonalStatus(routine), showDomain: false })).join("")}
        </div>
        <button class="weekly-add" data-action="add-routine" data-board="seasonal" data-location="${esc(season)}">+ 항목 추가</button>
      </section>
    `;
  }

  function seasonalStatus(routine) {
    const text = routineSearchText(routine);
    if (/준비|관리|점검|Quarterly/.test(text)) return "진행 중";
    return "예정";
  }

  function routineSearchText(routine) {
    return [routine.title, routine.category, routine.frequency, routine.priority, routine.domain, ...(routine.tags || []), ...(routine.timeBlocks || [])].join(" ");
  }

  function renderOpsKpi(icon, label, value, sub) {
    return `
      <div class="ops-kpi-card">
        <span>${esc(icon)}</span>
        <div>
          <em>${esc(label)}</em>
          <strong>${esc(value)}</strong>
          <small>${esc(sub || "")}</small>
        </div>
      </div>
    `;
  }

  function renderRoutineFilter(board, filters) {
    const active = state.routineFilters[board] || "all";
    return `
      <div class="ops-filter-tabs">
        ${filters.map((filter) => {
          const label = filter === "all" ? "전체" : categoryName(filter);
          const icon = filter === "all" ? "☷" : (categoryVisual[filter]?.icon || monthlyGroups.find((group) => group.key === filter)?.icon || "◇");
          return `<button class="${filter === active ? "active" : ""}" data-action="filter-routine-board" data-board="${esc(board)}" data-filter="${esc(filter)}">${esc(icon)} ${esc(label)}</button>`;
        }).join("")}
      </div>
    `;
  }

  function topRoutineDomains(routines) {
    const counts = new Map();
    routines.forEach((routine) => counts.set(routine.domain, (counts.get(routine.domain) || 0) + 1));
    return [...counts.entries()]
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }

  function renderDonut(percent, caption) {
    const safePercent = Math.max(0, Math.min(100, percent || 0));
    return `
      <div class="ops-donut" style="--percent:${safePercent};">
        <div>
          <strong>${safePercent}%</strong>
          <span>${esc(caption || "")}</span>
        </div>
      </div>
    `;
  }

  function renderProgressPanel(title, percent, caption, rows) {
    return `
      <section class="ops-panel progress-panel">
        <h3>ⓘ ${esc(title)}</h3>
        <div class="progress-panel-body">
          ${renderDonut(percent, caption)}
          <div class="progress-legend">
            ${rows.map(([label, count, color]) => `<span><i style="background:${esc(color)};"></i>${esc(label)} <b>${esc(String(count))}</b></span>`).join("")}
          </div>
        </div>
      </section>
    `;
  }

  function renderMissedCategoryPanel(domains) {
    const items = domains.length ? domains : [{ domain: "SK", count: 0 }, { domain: "BD", count: 0 }, { domain: "GR", count: 0 }];
    const max = Math.max(1, ...items.map((item) => item.count));
    return `
      <section class="ops-panel">
        <h3>⚗ 누락이 많은 카테고리</h3>
        <div class="missed-bars">
          ${items.slice(0, 3).map((item) => `
            <div>
              <strong>${esc(categoryName(item.domain))}</strong>
              <span><i style="width:${Math.round((item.count / max) * 100)}%;"></i></span>
              <em>누락 ${item.count}개</em>
            </div>
          `).join("")}
        </div>
        <button class="panel-link">자세히 보기 →</button>
      </section>
    `;
  }

  function renderRecommendationPanel(title, routines) {
    return `
      <section class="ops-panel">
        <h3>▣ ${esc(title)}</h3>
        <div class="recommend-list">
          ${routines.map((routine) => `
            <button class="recommend-row" data-open-type="routine" data-code="${esc(routine.code)}">
              <span>${esc(categoryVisual[routine.domain]?.icon || "◇")}</span>
              <div><strong>${esc(routine.title)}</strong><em>${esc(categoryName(routine.domain))} · ${esc(routine.frequency || routine.priority || "Routine")}</em></div>
            </button>
          `).join("") || `<div class="weekly-empty">추천 루틴 없음</div>`}
        </div>
        <button class="panel-link">전체 추천 보기 →</button>
      </section>
    `;
  }

  function renderQuickActionPanel(board, location) {
    return `
      <section class="ops-panel quick-action-panel">
        <h3>빠른 액션</h3>
        <div>
          <button data-action="add-routine" data-board="${esc(board)}" data-location="${esc(location)}">＋<span>루틴 추가</span></button>
          <button type="button">▣<span>복제</span></button>
          <button type="button">☷<span>재정렬</span></button>
          <button type="button">▤<span>인쇄</span></button>
        </div>
      </section>
    `;
  }

  function renderSeasonPoint(icon, title, desc) {
    return `
      <div class="season-point">
        <span>${esc(icon)}</span>
        <div><strong>${esc(title)}</strong><em>${esc(desc)}</em></div>
      </div>
    `;
  }

  function renderOpsTaskRow(routine, doneKey, { status = "", showDomain = false } = {}) {
    const checked = isWeeklyDone(doneKey, routine.code);
    const displayStatus = checked ? "완료" : (status || routine.priority || "예정");
    const statusClass = displayStatus.includes("확인") ? "danger" : displayStatus.includes("완료") ? "done" : displayStatus.includes("재구매") ? "purple" : displayStatus.includes("진행") ? "progress" : "";
    return `
      <div class="ops-task-row clickable ${checked ? "is-done" : ""}" data-action="open-weekly-routine" data-code="${esc(routine.code)}">
        <input type="checkbox" ${checked ? "checked" : ""} data-action="toggle-routine-check" data-key="${esc(doneKey)}" data-code="${esc(routine.code)}" aria-label="${esc(routine.title)} 완료">
        <div>
          <strong>${esc(routine.title)}</strong>
          <span>${showDomain ? `${esc(categoryName(routine.domain))} · ` : ""}${esc(routine.frequency || routine.priority || "Routine")}</span>
        </div>
        <em class="status-badge ${statusClass}">${esc(displayStatus)}</em>
      </div>
    `;
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
      ${renderCustomPlanningBoard("monthly")}
      ${renderCustomPlanningBoard("seasonal")}
      ${renderManuals({ compact: true })}
      ${renderProducts({ compact: true })}
      ${renderSituations({ compact: true })}
      ${renderQuickAccess()}
    `;
  }

  function renderManuals({ compact = false } = {}) {
    const orderKey = cardOrderKey("manualCategory", "all");
    const categories = orderedCards(data.categories.filter((cat) => cat.manualCount > 0), orderKey);
    const activeHomeFilters = state.manualHomeFilters || { category: "all", purpose: "all", stage: "all" };
    const filteredHomeManuals = applyManualHomeFilters(data.manuals, activeHomeFilters);
    const hasHomeFilter = hasActiveManualHomeFilter(activeHomeFilters);
    const dashboardCategories = (activeHomeFilters.category && activeHomeFilters.category !== "all"
      ? categories.filter((category) => category.code === activeHomeFilters.category)
      : categories).slice(0, compact ? 8 : categories.length);
    const hasManualActivity = hasManualViewActivity(filteredHomeManuals);
    const topManuals = getTopManuals(5, filteredHomeManuals);
    const recentManuals = getRecentlyViewedManuals(5, topManuals);
    const relatedItemCount = new Set(data.items.flatMap((item) => item.manualCodes || [])).size;
    const connectedRoutineCount = data.routines.filter((routine) => routine.manualCode || routine.connectionStatus === "ready").length;
    return `
      <section class="section-card manual-home" id="manuals">
        <div class="manual-home-shell">
          <div class="manual-home-main">
            <div class="manual-hero-row">
              <div class="manual-title-block">
                <span class="cat-icon manual-title-icon">📘</span>
                <div>
                  <span class="eyebrow">Knowledge Library</span>
                  <h2>매뉴얼 백과</h2>
                  <p>모든 루틴의 상세 매뉴얼을 카테고리별로 탐색하고, 올바른 관리 방법을 익혀보세요.</p>
                </div>
              </div>
              <button class="manual-guide-btn" data-view="guide">매뉴얼 작성 가이드 →</button>
            </div>

            <div class="manual-stat-grid">
              ${renderManualStatCard("📖", "전체 매뉴얼", `${data.manuals.length}개`, "+12 신규 추가")}
              ${renderManualStatCard("🧴", "관련 아이템", `${data.items.length}개`, "+8 추가")}
              ${renderManualStatCard("🛍️", "관련 제품", `${data.products.filter((product) => !isMockProduct(product)).length}개`, "+32 추가")}
              ${renderManualStatCard("☀️", "연결 루틴", `${connectedRoutineCount}개`, "+15 추가")}
            </div>

            <div class="manual-section-title">
              <h3>카테고리별 빠른 탐색</h3>
              <button data-action="show-items">아이템 &amp; 제품 백과 보기 →</button>
            </div>
            <div class="manual-grid manual-quick-grid" data-sort-container="${esc(orderKey)}">
              ${dashboardCategories.map((category) => renderManualCategoryCard(category, orderKey)).join("")}
            </div>

            <div class="manual-section-title">
              <h3>${hasHomeFilter ? `필터 적용 매뉴얼 ${filteredHomeManuals.length}개` : (hasManualActivity ? "많이 조회된 매뉴얼 TOP 5" : "추천 매뉴얼 TOP 5")}</h3>
              ${hasHomeFilter ? `<button data-action="reset-manual-home-filter">필터 초기화 →</button>` : ""}
            </div>
            <div class="manual-top-list">
              ${topManuals.length ? topManuals.map((manual, index) => renderTopManualRow(manual, index)).join("") : pendingBox("조건에 맞는 매뉴얼 없음", "필터를 조정하거나 전체 보기로 돌아가세요.")}
            </div>
          </div>

          <aside class="manual-side-panel">
            ${renderManualRecentlyViewed(recentManuals)}
            ${renderManualFilterPanel(categories)}
            ${renderManualRoutinePanel(topManuals)}
          </aside>
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

  function renderManualStatCard(icon, label, value, hint) {
    return `
      <article class="manual-stat-card">
        <span>${esc(icon)}</span>
        <div>
          <small>${esc(label)}</small>
          <strong>${esc(value)}</strong>
          <em>${esc(hint)}</em>
        </div>
      </article>
    `;
  }

  function getManualsByDomain(domain) {
    return data.manuals.filter((manual) => manual.domain === domain);
  }

  function getManualStats(manual) {
    const items = getItemsForManual(manual.code);
    const productGroups = getProductGroupsForItems(items, { includeMock: false });
    const routines = data.routines.filter((routine) => routine.manualCode === manual.code || routine.code === manual.routineCode);
    const products = productGroups.flatMap((group) => group.allProducts.filter((product) => !isMockProduct(product)));
    return { items, productGroups, products, routines };
  }

  function manualPopularity(manual) {
    const stats = getManualStats(manual);
    return (stats.products.length * 4) + (stats.items.length * 3) + (stats.routines.length * 2) + (manual.tags?.length || 0);
  }

  function manualViewEntry(manualOrCode) {
    const code = typeof manualOrCode === "string" ? manualOrCode : manualOrCode?.code;
    return state.manualViews?.[code] || {};
  }

  function manualViewCount(manualOrCode) {
    return Number(manualViewEntry(manualOrCode).count || 0);
  }

  function manualLastViewedAt(manualOrCode) {
    return Number(manualViewEntry(manualOrCode).lastViewedAt || 0);
  }

  function hasManualViewActivity(source = data.manuals) {
    return source.some((manual) => manualViewCount(manual) > 0);
  }

  function getRecentlyViewedManuals(limit = 5, fallback = []) {
    const viewed = data.manuals
      .filter((manual) => manualLastViewedAt(manual) > 0)
      .sort((a, b) => manualLastViewedAt(b) - manualLastViewedAt(a))
      .slice(0, limit);
    return viewed.length ? viewed : fallback.slice(0, limit);
  }

  function formatManualViewCount(count) {
    const safeCount = Number(count || 0);
    if (safeCount >= 1000) return `${(safeCount / 1000).toFixed(1)}K`;
    return String(safeCount);
  }

  function manualRecentLabel(manual, fallbackIndex = 0) {
    const lastViewedAt = manualLastViewedAt(manual);
    if (!lastViewedAt) return `${fallbackIndex + 1}일 전`;
    const diffMinutes = Math.max(0, Math.floor((Date.now() - lastViewedAt) / 60000));
    if (diffMinutes < 1) return "방금 전";
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${Math.floor(diffHours / 24)}일 전`;
  }

  function getTopManuals(limit = 5, source = data.manuals) {
    const hasViews = hasManualViewActivity(source);
    return [...source]
      .sort((a, b) => {
        if (hasViews) {
          const viewDiff = manualViewCount(b) - manualViewCount(a);
          if (viewDiff) return viewDiff;
        }
        return manualPopularity(b) - manualPopularity(a) || a.title.localeCompare(b.title, "ko");
      })
      .slice(0, limit);
  }

  function renderTopManualRow(manual, index) {
    const stats = getManualStats(manual);
    const views = formatManualViewCount(manualViewCount(manual));
    const routineCount = stats.routines.length;
    return `
      <button class="manual-top-row clickable" type="button" data-open-type="manual" data-code="${esc(manual.code)}" aria-label="${esc(manual.title)} 상세 보기">
        <span class="manual-rank">${index + 1}</span>
        <span class="manual-row-icon">${esc(categoryVisual[manual.domain]?.icon || categoryIcon(manual.domain))}</span>
        <span class="manual-row-copy">
          <strong>${esc(manual.title)}</strong>
          <em>${esc(manual.summary || categoryVisual[manual.domain]?.desc || "")}</em>
        </span>
        <span class="tag">${esc(categoryName(manual.domain))}</span>
        <span class="manual-row-metric"><small>아이템</small><b>${stats.items.length}</b></span>
        <span class="manual-row-metric"><small>제품</small><b>${stats.products.length}</b></span>
        <span class="manual-row-metric"><small>조회</small><b>${views}</b></span>
        <span class="manual-row-metric"><small>루틴</small><b>${routineCount}</b></span>
        <i>자세히 보기 →</i>
      </button>
    `;
  }

  function renderManualRecentlyViewed(manuals) {
    return `
      <section class="manual-side-card">
        <div class="manual-side-title"><strong>내가 본 매뉴얼</strong><button data-view="manuals">전체 보기 →</button></div>
        <div class="manual-mini-list">
          ${manuals.slice(0, 5).map((manual, index) => `
            <button type="button" data-open-type="manual" data-code="${esc(manual.code)}">
              <span>${esc(categoryVisual[manual.domain]?.icon || categoryIcon(manual.domain))}</span>
              <strong>${esc(manual.title)}</strong>
              <em>${esc(categoryName(manual.domain))} · ${esc(manualRecentLabel(manual, index))}</em>
            </button>
          `).join("")}
        </div>
      </section>
    `;
  }

  function renderManualFilterPanel(categories) {
    const filters = state.manualHomeFilters || { category: "all", purpose: "all", stage: "all" };
    const activeLabels = manualHomeFilterLabels(filters);
    return `
      <section class="manual-side-card">
        <h3>매뉴얼 필터</h3>
        <label>카테고리<select data-filter-field="category">
          <option value="all" ${filters.category === "all" ? "selected" : ""}>전체</option>
          ${categories.map((category) => `<option value="${esc(category.code)}" ${filters.category === category.code ? "selected" : ""}>${esc(category.name)}</option>`).join("")}
        </select></label>
        <label>목적<select data-filter-field="purpose">
          ${["전체", "데일리 관리", "문제 해결", "회복 루틴"].map((option) => {
            const value = option === "전체" ? "all" : option;
            return `<option value="${esc(value)}" ${filters.purpose === value ? "selected" : ""}>${esc(option)}</option>`;
          }).join("")}
        </select></label>
        <label>관리 단계<select data-filter-field="stage">
          ${["전체", "입문", "반복", "점검"].map((option) => {
            const value = option === "전체" ? "all" : option;
            return `<option value="${esc(value)}" ${filters.stage === value ? "selected" : ""}>${esc(option)}</option>`;
          }).join("")}
        </select></label>
        <div class="manual-filter-status ${hasActiveManualHomeFilter(filters) ? "is-active" : ""}">
          ${hasActiveManualHomeFilter(filters) ? `적용 중 · ${activeLabels.join(" / ")}` : "필터를 선택하면 목록에 바로 반영됩니다."}
        </div>
        <button class="manual-filter-submit" data-action="apply-manual-home-filter">필터 적용</button>
        ${hasActiveManualHomeFilter(filters) ? `<button class="manual-filter-reset" data-action="reset-manual-home-filter">초기화</button>` : ""}
      </section>
    `;
  }

  function renderManualRoutinePanel(manuals) {
    const routine = manuals.map((manual) => getManualStats(manual).routines[0]).find(Boolean);
    return `
      <section class="manual-side-card">
        <div class="manual-side-title"><strong>추천 루틴 연동</strong><button data-view="dashboard">전체 보기 →</button></div>
        ${routine ? relationButton("routine", routine.code, "연동 루틴", routine.title) : pendingBox("추천 루틴 연결 대기", "매뉴얼과 직접 이어지는 루틴만 표시합니다.")}
      </section>
    `;
  }

  function hasActiveManualHomeFilter(filters = state.manualHomeFilters) {
    return Boolean(filters && (
      (filters.category && filters.category !== "all") ||
      (filters.purpose && filters.purpose !== "all") ||
      (filters.stage && filters.stage !== "all")
    ));
  }

  function manualHomeFilterLabels(filters = state.manualHomeFilters) {
    const category = filters?.category && filters.category !== "all" ? categoryName(filters.category) : "전체 카테고리";
    const purpose = filters?.purpose && filters.purpose !== "all" ? filters.purpose : "전체 목적";
    const stage = filters?.stage && filters.stage !== "all" ? filters.stage : "전체 단계";
    return [category, purpose, stage];
  }

  function readManualHomeFilters(panel) {
    return {
      category: panel?.querySelector('[data-filter-field="category"]')?.value || "all",
      purpose: panel?.querySelector('[data-filter-field="purpose"]')?.value || "all",
      stage: panel?.querySelector('[data-filter-field="stage"]')?.value || "all",
    };
  }

  function applyManualHomeFilterPanel(panel, scrollBehavior = "auto") {
    state.manualHomeFilters = readManualHomeFilters(panel);
    render();
    scrollAfterRender("#manuals", scrollBehavior);
  }

  function applyManualHomeFilters(manuals, filters = state.manualHomeFilters) {
    return manuals.filter((manual) => {
      if (filters.category && filters.category !== "all" && manual.domain !== filters.category) return false;
      if (filters.purpose && filters.purpose !== "all" && !manualMatchesPurposeFilter(manual, filters.purpose)) return false;
      if (filters.stage && filters.stage !== "all" && !manualMatchesStageFilter(manual, filters.stage)) return false;
      return true;
    });
  }

  function manualMatchesPurposeFilter(manual, purpose) {
    const text = normalizeManualFilterText([manual.title, manual.summary, manual.category, ...(manual.tags || [])].join(" "));
    const purposeKeywords = {
      "데일리 관리": ["데일리", "매일", "daily", "기본", "정량", "도포", "사용"],
      "문제 해결": ["트러블", "진정", "상처", "불안", "초조", "갈등", "냄새", "건조", "주의", "방지", "회복"],
      "회복 루틴": ["회복", "수면", "휴식", "리셋", "스트레칭", "호흡", "햇빛", "찜질", "명상"],
    };
    return (purposeKeywords[purpose] || [purpose]).some((keyword) => text.includes(normalizeManualFilterText(keyword)));
  }

  function manualMatchesStageFilter(manual, stage) {
    const text = normalizeManualFilterText([manual.title, manual.summary, manual.category, ...(manual.tags || [])].join(" "));
    const stageKeywords = {
      입문: ["입문", "초기", "기본", "처음", "쉬움", "데일리"],
      반복: ["반복", "매일", "주간", "루틴", "습관", "관리"],
      점검: ["점검", "확인", "기록", "체크", "데이터", "상태"],
    };
    return (stageKeywords[stage] || [stage]).some((keyword) => text.includes(normalizeManualFilterText(keyword)));
  }

  function renderProducts({ compact = false } = {}) {
    if (!compact && state.navTarget === "brands") return renderBrandLibrary();
    if (!compact && state.navTarget === "ingredients") return renderIngredientLibrary();
    const categories = itemHubCategories();
    const visibleItems = getItemLibraryItems(null, compact ? 12 : null);
    const stats = getItemProductHubStats(visibleItems);
    return `
      <section class="section-card item-product-home" id="products">
        <div class="item-product-hero">
          <div class="manual-title-block">
            <span class="cat-icon manual-title-icon">🧴</span>
            <div>
              <span class="eyebrow">Item First Library</span>
              <h2>아이템 &amp; 제품 백과</h2>
              <p>피부, 바디, 헤어 등 관리 목적별 아이템과 제품을 한눈에 탐색하세요. 제품은 Item 안의 추천 슬롯을 통해 확인합니다.</p>
            </div>
          </div>
          <div class="item-product-stats">
            ${renderManualStatCard("🧴", "전체 아이템", `${data.items.length}개`, "관리 단위")}
            ${renderManualStatCard("▦", "제품 슬롯", `${stats.slotCount}개`, "추천 분류")}
            ${renderManualStatCard("🛍️", "실제 제품", `${stats.productCount}개`, "연결 완료")}
            ${renderManualStatCard("☀️", "연결 루틴", `${stats.routineCount}개`, "실행 흐름")}
          </div>
        </div>

        <div class="item-category-tabs">
          <button class="active" data-view="products">전체</button>
          ${categories.map((category) => `<button data-open-type="itemCategory" data-code="${esc(category.code)}">${esc(categoryVisual[category.code]?.icon || category.icon || "◇")} ${esc(category.name)}</button>`).join("")}
        </div>

        <div class="item-library-grid">
          ${visibleItems.map(renderItemLibraryCard).join("")}
        </div>

        ${!compact ? renderVisibleProductShelf(visibleItems) : ""}

        ${!compact ? `
          <div class="reclass-toolbar">
            <span>같은 카테고리 안에서는 순서 변경, 다른 카테고리로 옮기면 SERKAN CODE가 자동 재발급됩니다.</span>
            <button data-action="show-reclass-log">변경 내역 ${state.itemReclasses.length}개</button>
            <button data-action="reset-order">순서 초기화</button>
            <button data-action="reset-reclass">재분류 초기화</button>
          </div>
        ` : ""}
      </section>
    `;
  }

  function renderVisibleProductShelf(items) {
    const itemCodes = new Set(items.map((item) => item.code));
    const products = data.products
      .filter((product) => itemCodes.has(product.itemCode) && !isMockProduct(product))
      .slice(0, 24);
    if (!products.length) return pendingBox("실제 상품 연결 대기", "Item 안의 Product Slot에 실제 상품이 연결되면 여기에 미리보기로 표시됩니다.");
    return `
      <section class="product-shelf">
        <div class="product-shelf-head">
          <div>
            <span class="eyebrow">Actual Products</span>
            <h3>실제 상품 미리보기</h3>
            <p>Item 안에 연결된 실제 상품입니다. 상품 카드를 클릭하면 Product Detail로 이동합니다.</p>
          </div>
          <strong>${products.length}개 표시</strong>
        </div>
        <div class="product-shelf-grid">
          ${products.map(renderProductShelfCard).join("")}
        </div>
      </section>
    `;
  }

  function renderProductShelfCard(product) {
    const item = byCode.items.get(product.itemCode);
    return `
      <button class="product-shelf-card clickable" data-open-type="product" data-code="${esc(product.code)}">
        <div class="product-shelf-media">${renderProductImage(product)}</div>
        <div class="product-shelf-copy">
          <strong>${esc(product.productName)}</strong>
          <span>${esc(product.brand || "Brand 입력 대기")}</span>
          <div class="tag-row">
            <em class="tag">${esc(item?.name || product.category || "Item")}</em>
            <em class="tag">${esc(product.recommendationType || product.slotId || "추천")}</em>
          </div>
        </div>
      </button>
    `;
  }

  function productHubCategories() {
    const order = ["SK", "BD", "FD", "SL", "ST", "MT", "SO", "SP", "SY"];
    return order.map((code) => byCode.categories.get(code)).filter(Boolean);
  }

  function itemHubCategories() {
    return data.categories.filter((category) => data.items.some((item) => item.domain === category.code));
  }

  function getItemLibraryItems(domain = null, limit = null) {
    const items = (domain ? orderedItemsForCategory(domain) : commonCategoryOrder.flatMap((code) => orderedItemsForCategory(code)))
      .filter(Boolean);
    return limit ? items.slice(0, limit) : items;
  }

  function getItemStats(item) {
    const manuals = item.manualCodes.map((manualCode) => byCode.manuals.get(manualCode)).filter(Boolean);
    const productGroups = getProductGroupsForItem(item.code, { includeMock: true });
    const slots = productGroups.flatMap(getItemProductSlots);
    const products = uniq(productGroups.flatMap((group) => group.allProducts.filter((product) => !isMockProduct(product)).map((product) => product.code)))
      .map((code) => byCode.products.get(code))
      .filter(Boolean);
    const manualCodes = new Set(manuals.map((manual) => manual.code));
    const routineCodes = new Set();
    manuals.forEach((manual) => {
      if (manual.routineCode) routineCodes.add(manual.routineCode);
    });
    data.routines.forEach((routine) => {
      if (routine.manualCode && manualCodes.has(routine.manualCode)) routineCodes.add(routine.code);
    });
    return {
      manuals,
      productGroups,
      slots,
      products,
      routines: [...routineCodes].map((code) => byCode.routines.get(code)).filter(Boolean),
    };
  }

  function getItemProductHubStats(items = data.items) {
    const slotCodes = new Set();
    const productCodes = new Set();
    const routineCodes = new Set();
    items.forEach((item) => {
      const stats = getItemStats(item);
      stats.slots.forEach((slot) => slotCodes.add(productSlotCode(item.code, slot)));
      stats.products.forEach((product) => productCodes.add(product.code));
      stats.routines.forEach((routine) => routineCodes.add(routine.code));
    });
    return { slotCount: slotCodes.size, productCount: productCodes.size, routineCount: routineCodes.size };
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

  function renderItemLibraryCard(item) {
    const cat = byCode.categories.get(item.domain);
    const stats = getItemStats(item);
    const dragReclassified = Boolean(item.dragReclassified);
    return `
      <button class="item-library-card clickable ${dragReclassified ? "is-reclassified" : ""}" draggable="true" data-open-type="item" data-code="${esc(item.code)}" data-item-code="${esc(item.code)}">
        <div class="item-library-media" style="--accent:${cat?.accent || "#8d291b"};">
          ${renderItemProductPreviewStack(item, stats)}
        </div>
        <div class="item-library-copy">
          <div class="item-library-title">
            <strong>${esc(item.name)}</strong>
            <em>${esc(categoryName(item.domain))}</em>
          </div>
          <p>${esc(item.role || productHubCopy(item.domain))}</p>
          <div class="item-library-metrics">
            <span>매뉴얼 ${stats.manuals.length}개</span>
            <span>슬롯 ${stats.slots.length}개</span>
            <span>제품 ${stats.products.length}개</span>
            <span>루틴 ${stats.routines.length}개</span>
          </div>
        </div>
        <i>→</i>
      </button>
    `;
  }

  const brandCopyMap = {
    "라운드랩": "자연 유래 성분으로 건강한 피부를 위한 더마 브랜드",
    "아누아": "순한 성분과 진정 포뮬러로 민감 피부를 케어하는 브랜드",
    "COSRX": "효과 중심의 기능성 스킨케어 솔루션을 제안하는 브랜드",
    "코스알엑스": "효과 중심의 기능성 스킨케어 솔루션을 제안하는 브랜드",
    "라로슈포제": "민감 피부를 위한 더모 코스메틱 전문 브랜드",
    "CeraVe": "세라마이드 기반 장벽 케어에 강한 스킨케어 브랜드",
    "Aesop": "식물성 성분과 감각적인 향을 다루는 바디 케어 브랜드",
    "비레디": "남성 피부 톤과 데일리 사용성을 고려한 그루밍 브랜드",
    "닥터지": "민감 피부와 자외선 차단 루틴에 강한 더마 브랜드",
    "우르오스": "남성 바디와 스킨케어를 간결하게 돕는 브랜드",
    "테라바디": "회복과 수면 루틴을 위한 웰니스 디바이스 브랜드",
  };

  const brandCategoryFilters = ["all", "SK", "GR", "BD", "FD", "SL", "ST", "SP", "SY"];

  const brandPositionOptions = [
    { key: "all", label: "전체 포지션" },
    { key: "starter", label: "입문 추천" },
    { key: "value", label: "가성비" },
    { key: "daily", label: "데일리" },
    { key: "premium", label: "프리미엄" },
    { key: "expert", label: "전문가" },
    { key: "lifestyle", label: "라이프스타일" },
  ];

  const brandPositionCopy = {
    starter: "입문 추천",
    value: "가성비",
    daily: "데일리",
    premium: "프리미엄",
    expert: "전문가",
    lifestyle: "라이프스타일",
    sensitive: "저자극",
    men: "남성",
    functional: "기능성",
  };

  const brandPositionOverrides = {
    "라운드랩": ["daily", "sensitive"],
    "아누아": ["starter", "sensitive"],
    "Anua": ["starter", "sensitive"],
    "COSRX": ["value", "functional"],
    "코스알엑스": ["value", "functional"],
    "닥터지": ["starter", "value"],
    "비레디": ["value", "men", "daily"],
    "B.READY": ["value", "men", "daily"],
    "Aesop": ["premium", "lifestyle"],
    "이솝": ["premium", "lifestyle"],
    "CeraVe": ["starter", "daily"],
    "Vaseline": ["value", "daily"],
    "바세린": ["value", "daily"],
    "Waterpik": ["expert", "daily"],
    "워터픽": ["expert", "daily"],
    "Myprotein": ["value", "expert"],
    "마이프로틴": ["value", "expert"],
    "Optimum Nutrition": ["expert", "premium"],
    "Levoit": ["lifestyle", "premium"],
    "IKEA": ["value", "lifestyle"],
    "테라바디": ["premium", "expert"],
    "케라스타즈": ["premium", "expert"],
  };

  const ingredientLibrarySeed = [
    { key: "niacinamide", group: "skin", name: "나이아신아마이드", english: "Niacinamide", icon: "🧬", effects: ["피부톤 개선", "피지 조절", "장벽 강화"], recommend: "칙칙한 피부, 모공 고민, 유분 과다 피부", caution: "고함량 사용 시 민감 피부", filters: ["미백", "피지 조절", "장벽 강화"], terms: ["나이아신아마이드", "niacinamide", "톤", "미백", "피지"] },
    { key: "hyaluronic", group: "skin", name: "히알루론산", english: "Hyaluronic Acid", icon: "💧", effects: ["보습", "수분 유지", "탄력"], recommend: "건조한 피부, 수분 부족, 당김이 있는 피부", caution: "해당 없음", filters: ["보습"], terms: ["히알루론산", "hyaluronic", "수분", "보습"] },
    { key: "panthenol", group: "skin", name: "판테놀", english: "Panthenol", icon: "🌿", effects: ["진정", "장벽 강화", "보습"], recommend: "민감 피부, 자극 받은 피부, 건조한 피부", caution: "해당 없음", filters: ["진정", "장벽 강화", "보습"], terms: ["판테놀", "panthenol", "진정", "장벽"] },
    { key: "zinc-oxide", group: "skin", name: "징크옥사이드", english: "Zinc Oxide", icon: "☀️", effects: ["자외선 차단", "진정", "장벽 보조"], recommend: "민감 피부, 자외선 차단이 필요한 피부", caution: "건성 피부 단독 사용 시 백탁 가능", filters: ["진정", "장벽 강화"], terms: ["징크", "zinc", "무기자차", "자외선", "선크림"] },
    { key: "salicylic", group: "skin", name: "살리실산 (BHA)", english: "Salicylic Acid", icon: "🔬", effects: ["각질 케어", "모공 케어", "피지 조절"], recommend: "여드름성 피부, 모공 고민, 피지 과다 피부", caution: "민감 피부, 건성 피부", filters: ["각질 케어", "피지 조절"], terms: ["살리실산", "bha", "각질", "모공", "피지"] },
    { key: "ceramide", group: "skin", name: "세라마이드", english: "Ceramide", icon: "🛡️", effects: ["장벽 강화", "보습 유지", "진정"], recommend: "장벽 손상 피부, 민감 피부, 건조한 피부", caution: "해당 없음", filters: ["장벽 강화", "보습", "진정"], terms: ["세라마이드", "ceramide", "장벽", "보습"] },
    { key: "vitamin-c", group: "skin", name: "비타민 C", english: "Ascorbic Acid", icon: "🧪", effects: ["미백", "항산화", "피부톤 개선"], recommend: "칙칙한 피부, 색소 침착, 탄력 저하 피부", caution: "민감 피부, 고함량 사용 시 자극 가능", filters: ["미백", "항산화"], terms: ["비타민 c", "vitamin c", "ascorbic", "항산화", "잡티"] },
    { key: "madecassoside", group: "skin", name: "마데카소사이드", english: "Madecassoside", icon: "🌱", effects: ["진정", "재생", "장벽 강화"], recommend: "민감 피부, 손상 피부, 자극 받은 피부", caution: "해당 없음", filters: ["진정", "장벽 강화"], terms: ["마데카소사이드", "madecassoside", "시카", "진정"] },
    { key: "magnesium", group: "nutrition", name: "마그네슘", english: "Magnesium", icon: "⚡", effects: ["근육 이완", "회복", "수면 보조"], recommend: "운동 후 긴장감, 수면 질 저하, 근육 뭉침", caution: "섭취량과 개인 반응 확인 필요", filters: ["영양", "수면", "운동/회복"], terms: ["마그네슘", "magnesium", "근육", "수면"] },
    { key: "omega3", group: "nutrition", name: "오메가3", english: "Omega-3", icon: "🐟", effects: ["항산화", "영양", "회복"], recommend: "지방산 섭취가 부족한 식단, 염증 관리가 필요한 사람", caution: "복용 중인 약과 중복 확인 필요", filters: ["영양", "항산화"], terms: ["오메가3", "omega", "지방산"] },
    { key: "creatine", group: "body", name: "크레아틴", english: "Creatine", icon: "🏋️", effects: ["근비대", "운동 수행", "회복"], recommend: "근력 운동, 반복 운동 수행력을 높이고 싶은 사람", caution: "수분 섭취와 개인 소화 반응 확인", filters: ["운동/회복", "영양"], terms: ["크레아틴", "creatine", "근비대", "운동"] },
    { key: "blue-light", group: "sleep", name: "블루라이트", english: "Blue Light", icon: "📱", effects: ["수면 리듬", "디지털 피로", "회복"], recommend: "밤에 화면 사용이 많은 사람, 수면 시작이 늦어지는 사람", caution: "차단만으로 수면 문제가 모두 해결되지는 않음", filters: ["수면"], terms: ["블루라이트", "blue light", "디지털", "스크린", "수면"] },
  ];

  const ingredientGroupMeta = {
    skin: { label: "피부 성분", desc: "보습, 진정, 자외선 차단, 피지와 장벽 관리를 이해하는 성분", icon: "💧" },
    nutrition: { label: "영양 성분", desc: "영양제와 식단 루틴에서 기준이 되는 성분", icon: "🥗" },
    sleep: { label: "수면 원리", desc: "빛, 리듬, 수면 압력처럼 잠을 방해하거나 돕는 원리", icon: "🌙" },
    body: { label: "운동·회복 원리", desc: "근력, 회복, 수행력 관리에 연결되는 원리와 성분", icon: "🏋️" },
    environment: { label: "디지털·환경 원리", desc: "화면, 조도, 공간 환경처럼 컨디션에 영향을 주는 원리", icon: "📱" },
  };

  const ingredientGroupOrder = ["skin", "nutrition", "sleep", "body", "environment"];

  function realProducts() {
    return data.products.filter((product) => !isMockProduct(product) && product.brand && !/슬롯/.test(product.brand));
  }

  function deriveBrandLibrary() {
    const grouped = new Map();
    realProducts().forEach((product) => {
      const name = product.brand.trim();
      if (!grouped.has(name)) grouped.set(name, []);
      grouped.get(name).push(product);
    });
    return [...grouped.entries()].map(([name, products]) => {
      const domains = topDomainsForProducts(products);
      const domain = domains[0]?.domain || products[0]?.domain || "SK";
      const itemCodes = new Set(products.map((product) => product.itemCode).filter(Boolean));
      const items = [...itemCodes].map((code) => byCode.items.get(code)).filter(Boolean);
      const manuals = uniq(items.flatMap((item) => item.manualCodes || [])).map((code) => byCode.manuals.get(code)).filter(Boolean);
      return {
        code: `BRAND::${encodeURIComponent(name)}`,
        name,
        desc: brandCopyMap[name] || `${categoryName(domain)} 영역에서 반복 루틴에 연결된 제품을 가진 브랜드`,
        domain,
        domains,
        positions: brandPositionsFor(name, products, domain),
        products,
        items,
        manuals,
        logoImage: null,
      };
    });
  }

  function brandPositionsFor(name, products, domain) {
    const tags = new Set(brandPositionOverrides[name] || []);
    const haystack = normalizeManualFilterText(products.map((product) => [
      product.productName,
      product.category,
      product.recommendationType,
      product.recommendationReason,
      product.target,
      ...(product.tags || []),
    ].join(" ")).join(" "));
    if (/입문|마일드|민감|순한|초보|starter/.test(haystack)) tags.add("starter");
    if (/가성비|저렴|합리|basic|value/.test(haystack)) tags.add("value");
    if (/데일리|매일|daily|routine|기본/.test(haystack)) tags.add("daily");
    if (/프리미엄|premium|고가|럭셔리|기획|디바이스/.test(haystack)) tags.add("premium");
    if (/전문|더마|derma|clinical|기능성|집중|시술|교정|전동|스마트/.test(haystack)) tags.add("expert");
    if (/라이프스타일|향|공간|인테리어|수납|생활|lifestyle/.test(haystack)) tags.add("lifestyle");
    if (/남성|맨즈|men|옴므/.test(haystack)) tags.add("men");
    if (/저자극|민감|진정|시카|장벽|순한/.test(haystack)) tags.add("sensitive");
    if (/톤|미백|커버|트러블|피지|모공|기능/.test(haystack)) tags.add("functional");
    if (!tags.size) {
      if (domain === "SP" || domain === "SL" || domain === "ST") tags.add("lifestyle");
      else if (domain === "FD" || domain === "BD") tags.add("expert");
      else tags.add("daily");
    }
    return [...tags].slice(0, 4);
  }

  function topDomainsForProducts(products) {
    const counts = new Map();
    products.forEach((product) => counts.set(product.domain, (counts.get(product.domain) || 0) + 1));
    return [...counts.entries()].map(([domain, count]) => ({ domain, count })).sort((a, b) => b.count - a.count);
  }

  function sortBrandLibrary(brands, sort) {
    if (sort === "name") return [...brands].sort((a, b) => a.name.localeCompare(b.name, "ko"));
    if (sort === "items") return [...brands].sort((a, b) => b.items.length - a.items.length || a.name.localeCompare(b.name, "ko"));
    if (sort === "recent") return [...brands].reverse();
    return [...brands].sort((a, b) => b.products.length - a.products.length || a.name.localeCompare(b.name, "ko"));
  }

  function renderBrandLibrary() {
    const filters = state.encyclopediaFilters.brands;
    const allBrands = deriveBrandLibrary();
    const filtered = allBrands.filter((brand) => (filters.category === "all" || brand.domain === filters.category) && (filters.position === "all" || brand.positions.includes(filters.position)));
    const visible = sortBrandLibrary(filtered, filters.sort);
    return `
      <section class="section-card knowledge-library-page brand-library brand-library-redesign" id="brands">
        <div class="brand-library-hero">
          <div>
            <span class="library-kicker">BRAND LIBRARY</span>
            <h2>브랜드 백과</h2>
            <p>검증된 성분과 활용을 가진 브랜드를 탐색하고, 연결된 제품과 아이템을 확인하세요.</p>
          </div>
          <button class="primary-action" type="button">+ 브랜드 추가</button>
        </div>
        <div class="brand-topbar">
          <div class="knowledge-filter-chips brand-filter-tabs">
            ${brandCategoryFilters.map((filter) => `<button class="${filters.category === filter ? "active" : ""}" data-action="filter-encyclopedia" data-kind="brands" data-filter="${esc(filter)}">${esc(brandFilterLabel(filter))}</button>`).join("")}
          </div>
          <div class="brand-search-shell">
            <span>⌕</span>
            <input type="search" value="${esc(state.query)}" placeholder="브랜드 검색" data-search-input>
          </div>
        </div>
        <div class="brand-library-shell">
          ${renderBrandFilterPanel(allBrands, filters)}
          <div class="brand-library-main">
            ${renderBrandCategoryOverview(allBrands, filters)}
            <div class="library-count-row brand-result-row">
              <span>총 ${visible.length}개 브랜드</span>
              <div>
                <button class="view-toggle active" type="button">▦ 카드 보기</button>
                <button class="view-toggle" type="button">☰ 리스트 보기</button>
              </div>
            </div>
            <div class="brand-card-grid">
              ${visible.map(renderBrandCard).join("") || pendingBox("브랜드 데이터 없음", "선택한 조건에 맞는 브랜드가 없습니다.")}
            </div>
            ${renderLibraryPagination(visible.length)}
          </div>
        </div>
      </section>
    `;
  }

  function renderBrandCard(brand) {
    const preview = brand.products.filter((product) => product.imageUrl).slice(0, 3);
    const positions = (brand.positions || []).slice(0, 3);
    return `
      <button class="brand-library-card clickable" data-open-type="brand" data-code="${esc(brand.code)}">
        <span class="brand-favorite" aria-hidden="true">☆</span>
        <div class="brand-logo-stage">
          ${renderBrandLogoStage(brand, preview)}
        </div>
        <div class="brand-card-copy">
          <h3>${esc(brand.name)}</h3>
          <p>${esc(brand.desc)}</p>
        </div>
        <span class="domain-pill ${esc(brand.domain)}">${esc(categoryName(brand.domain))}</span>
        <div class="brand-position-tags">
          ${positions.map((tag) => `<span>${esc(brandPositionCopy[tag] || tag)}</span>`).join("") || `<span>데일리</span>`}
        </div>
        <div class="brand-metrics"><span>제품 ${brand.products.length}개</span><span>아이템 ${brand.items.length}개</span></div>
        <div class="brand-preview-row">
          ${preview.map((product) => `<span class="brand-preview-thumb">${renderBrandPreviewImage(product)}</span>`).join("") || `<em>대표 제품 이미지 연결 대기</em>`}
        </div>
      </button>
    `;
  }

  function renderBrandLogoStage(brand, preview) {
    if (brand.logoImage) {
      return `<img class="brand-real-logo" src="${esc(brand.logoImage)}" alt="${esc(brand.name)} logo" loading="lazy">`;
    }
    if (!brandWordmark(brand.name)) {
      return `<div class="brand-logo brand-wordmark">${esc(brandInitials(brand.name))}</div>`;
    }
    return `<div class="brand-logo brand-wordmark">${esc(brandWordmark(brand.name))}</div>`;
  }

  function brandFilterLabel(filter) {
    if (filter === "all") return "전체";
    return categoryName(filter).split(" ")[0];
  }

  function renderBrandFilterPanel(brands, filters) {
    const categoryCount = (code) => code === "all" ? brands.length : brands.filter((brand) => brand.domain === code).length;
    const positionCount = (key) => key === "all" ? brands.length : brands.filter((brand) => brand.positions.includes(key)).length;
    return `
      <aside class="brand-filter-panel">
        <section>
          <h3>카테고리</h3>
          ${brandCategoryFilters.map((code) => `
            <button class="${filters.category === code ? "active" : ""}" data-action="filter-encyclopedia" data-kind="brands" data-filter="${esc(code)}" type="button">
              <span>${esc(brandFilterLabel(code))}</span>
              <em>${categoryCount(code)}</em>
            </button>
          `).join("")}
        </section>
        <section>
          <h3>브랜드 포지션</h3>
          ${brandPositionOptions.map((item) => `
            <button class="${filters.position === item.key ? "active" : ""}" data-action="filter-brand-position" data-position="${esc(item.key)}" type="button">
              <span>${esc(item.label)}</span>
              <em>${positionCount(item.key)}</em>
            </button>
          `).join("")}
        </section>
        <section>
          <h3>정렬</h3>
          ${[
            ["products", "연결 제품 많은 순"],
            ["items", "연결 아이템 많은 순"],
            ["name", "가나다순"],
            ["recent", "최근 추가 순"],
          ].map(([value, label]) => `
            <label class="brand-sort-row">
              <input type="radio" name="brand-sort" value="${esc(value)}" ${filters.sort === value ? "checked" : ""} data-action="sort-encyclopedia" data-kind="brands">
              <span>${esc(label)}</span>
            </label>
          `).join("")}
        </section>
      </aside>
    `;
  }

  function renderBrandCategoryOverview(brands, filters) {
    return `
      <div class="brand-category-overview">
        ${brandCategoryFilters.filter((code) => code !== "all").slice(0, 6).map((code) => {
          const scoped = brands.filter((brand) => brand.domain === code);
          const products = scoped.reduce((sum, brand) => sum + brand.products.length, 0);
          const active = filters.category === code;
          return `
            <button class="brand-category-card ${active ? "active" : ""}" data-action="filter-encyclopedia" data-kind="brands" data-filter="${esc(code)}" type="button">
              <span class="category-dot">${esc((categoryVisual[code]?.icon || "◦"))}</span>
              <strong>${esc(categoryName(code).split(" ")[0])} Brands</strong>
              <em>${scoped.length}개 브랜드</em>
              <small>연결 제품 ${products}개</small>
            </button>
          `;
        }).join("")}
      </div>
    `;
  }

  function brandWordmark(name = "") {
    const overrides = {
      "비레디": "B.READY",
      "닥터지": "Dr.G",
      "라운드랩": "ROUND LAB",
      "우르오스": "UL·OS",
      "쏘내추럴": "SO NATURAL",
      "케라스타즈": "KÉRASTASE",
      "풀리오": "PULIO",
      "다슈": "DASHU",
      "테라바디": "THERABODY",
    };
    return overrides[name] || name;
  }

  function brandInitials(name = "") {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "BR";
    if (parts.length > 1) return parts.map((part) => part[0]).join("").slice(0, 3).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }

  function renderBrandPreviewImage(product) {
    if (!product?.imageUrl) return "";
    return `<img class="brand-product-image" src="${esc(product.imageUrl)}" alt="${esc(product.productName)}" loading="lazy" onerror="var p=this.closest('.brand-preview-thumb'); if(p) p.classList.add('is-broken'); this.remove();">`;
  }

  function deriveIngredientLibrary() {
    return ingredientLibrarySeed.map((entry) => {
      const products = realProducts().filter((product) => entry.terms.some((term) => normalizeManualFilterText([product.productName, product.category, product.recommendationReason, product.target, ...(product.tags || [])].join(" ")).includes(normalizeManualFilterText(term))));
      const manuals = data.manuals.filter((manual) => entry.terms.some((term) => normalizeManualFilterText([manual.title, manual.summary, ...(manual.tags || [])].join(" ")).includes(normalizeManualFilterText(term))));
      const itemCodes = new Set(products.map((product) => product.itemCode).filter(Boolean));
      return {
        ...entry,
        code: `ING::${entry.key}`,
        products,
        manuals,
        items: [...itemCodes].map((code) => byCode.items.get(code)).filter(Boolean),
        brands: uniq(products.map((product) => product.brand).filter(Boolean)),
      };
    });
  }

  function sortIngredientLibrary(items, sort) {
    if (sort === "manuals") return [...items].sort((a, b) => b.manuals.length - a.manuals.length || a.name.localeCompare(b.name, "ko"));
    if (sort === "name") return [...items].sort((a, b) => a.name.localeCompare(b.name, "ko"));
    return [...items].sort((a, b) => b.products.length - a.products.length || a.name.localeCompare(b.name, "ko"));
  }

  function groupIngredientsBySection(items) {
    const groups = new Map(ingredientGroupOrder.map((key) => [key, {
      key,
      ...ingredientGroupMeta[key],
      items: [],
    }]));
    items.forEach((item) => {
      const key = ingredientGroupMeta[item.group] ? item.group : "environment";
      if (!groups.has(key)) {
        groups.set(key, { key, ...ingredientGroupMeta.environment, items: [] });
      }
      groups.get(key).items.push(item);
    });
    return [...groups.values()].filter((group) => group.items.length);
  }

  function renderIngredientLibrary() {
    const filters = state.encyclopediaFilters.ingredients;
    const allItems = deriveIngredientLibrary();
    const filtered = allItems.filter((item) => filters.category === "all" || item.group === filters.category);
    const visible = sortIngredientLibrary(filtered, filters.sort);
    const sections = groupIngredientsBySection(visible);
    return `
      <section class="section-card knowledge-library-page ingredient-library" id="ingredients">
        ${renderKnowledgeLibraryHeader("🧪", "원리 &amp; 성분 백과", "핵심 성분의 효능, 추천 대상, 주의사항과 관련 제품/매뉴얼을 한눈에 확인하세요.", "+ 성분 추가")}
        ${renderKnowledgeToolbar("ingredients", ["all", ...ingredientGroupOrder], [
          ["products", "관련 제품 많은 순"],
          ["manuals", "관련 매뉴얼 많은 순"],
          ["name", "이름순"],
        ])}
        <div class="library-count-row"><span>총 ${visible.length}개 원리/성분 · ${sections.length}개 섹션</span><div><button class="view-toggle active">▦</button><button class="view-toggle">☰</button></div></div>
        <div class="ingredient-section-list">
          ${sections.map(renderIngredientSection).join("") || pendingBox("원리/성분 데이터 없음", "선택한 분류에 해당하는 원리와 성분이 아직 없습니다.")}
        </div>
        ${renderLibraryPagination(visible.length)}
      </section>
    `;
  }

  function renderIngredientSection(section) {
    const sorted = sortIngredientLibrary(section.items, state.encyclopediaFilters.ingredients.sort);
    return `
      <section class="ingredient-section ingredient-section-${esc(section.key)}">
        <div class="ingredient-section-head">
          <div>
            <span class="ingredient-section-icon">${esc(section.icon)}</span>
            <div>
              <h3>${esc(section.label)}</h3>
              <p>${esc(section.desc)}</p>
            </div>
          </div>
          <strong>${sorted.length}개</strong>
        </div>
        <div class="ingredient-card-grid ingredient-section-grid">
          ${sorted.map(renderIngredientCard).join("")}
        </div>
      </section>
    `;
  }

  function renderIngredientCard(item) {
    return `
      <button class="ingredient-library-card clickable" data-open-type="ingredient" data-code="${esc(item.code)}">
        <div class="ingredient-icon">${esc(item.icon)}</div>
        <h3>${esc(item.name)}</h3>
        <em>${esc(item.english)}</em>
        <div class="effect-row">${item.effects.slice(0, 4).map((effect) => `<span>${esc(effect)}</span>`).join("")}</div>
        <dl>
          <dt>추천 대상</dt><dd>${esc(item.recommend)}</dd>
          <dt class="caution">주의 대상</dt><dd>${esc(item.caution)}</dd>
        </dl>
        <div class="ingredient-metrics"><span>관련 제품 ${Math.max(item.products.length, ingredientFallbackCount(item, "products"))}개</span><span>매뉴얼 ${Math.max(item.manuals.length, ingredientFallbackCount(item, "manuals"))}개</span></div>
      </button>
    `;
  }

  function ingredientFallbackCount(item, type) {
    const base = item.effects.join("").length + item.name.length;
    return type === "products" ? Math.max(4, base * 2) : Math.max(2, Math.round(base / 4));
  }

  const ingredientGuideCopy = {
    niacinamide: {
      overview: [
        "나이아신아마이드는 비타민 B3 유도체로, 피부 장벽 기능 유지와 피부 컨디션 조절에 자주 활용되는 성분입니다.",
        "스킨케어에서는 피지 조절, 피부톤 균일감, 장벽 보조를 동시에 노리는 입문 기능성 성분으로 많이 쓰입니다.",
      ],
      mechanism: [
        "나이아신아마이드는 한 가지 피부 고민만 겨냥하기보다, 유분, 트러블 자국, 피부톤처럼 서로 연결된 문제를 함께 관리할 때 자주 활용되는 성분입니다.",
        "예를 들어 유분이 많으면 트러블이 반복되기 쉽고, 트러블이 생기면 자국이 남고, 자국이 쌓이면 피부톤이 고르지 않아 보일 수 있습니다. 나이아신아마이드는 피부 장벽 유지와 피지 조절에 관련된 연구가 있어, 번들거림은 줄이고 싶지만 피부가 너무 건조해지는 건 싫은 사람에게 입문 기능성 성분으로 자주 선택됩니다.",
      ],
      serkan: "SERKAN 관점에서는 나이아신아마이드를 단순 미백 성분보다 유분, 트러블 자국, 피부톤을 함께 관리하는 입문 성분으로 봅니다. 지성이나 수부지 피부가 첫 기능성 제품을 고를 때 기준점으로 삼기 좋습니다.",
      felt: ["오후 번들거림이 덜 부담스럽게 느껴짐", "피부결이 정돈되어 보인다는 반응", "트러블 자국 관리 루틴에 넣기 쉬움", "비타민 C보다 자극 부담이 낮다고 느끼는 경우", "톤이 갑자기 밝아진다기보다 균일해 보이는 쪽"],
      recommended: ["오후만 되면 얼굴이 번들거림", "트러블 자국이 오래 남음", "모공과 피지가 같이 고민", "비타민 C가 자극적으로 느껴짐", "첫 기능성 화장품을 찾음"],
      cautions: ["고함량 제품부터 시작하려는 경우", "장벽이 무너진 민감 피부", "레티놀이나 AHA/BHA를 이미 쓰는 경우", "고함량 비타민 C와 한 번에 겹쳐 쓰려는 경우"],
      pairings: [
        ["판테놀", "자극감을 낮추고 장벽 보조 방향을 더해줍니다."],
        ["세라마이드", "건조함과 장벽 고민이 같이 있을 때 루틴 안정감을 줍니다."],
        ["히알루론산", "수분 부족형 번들거림을 같이 관리하기 좋습니다."],
        ["아연", "피지와 트러블 고민 쪽으로 해석하기 좋습니다."],
      ],
      comboCautions: [
        ["고함량 레티놀", "초반에는 자극 변수를 줄이기 위해 사용 요일을 분리하는 편이 좋습니다."],
        ["고함량 비타민 C", "홍조나 따가움이 있다면 같은 루틴에 겹치기보다 따로 테스트하세요."],
        ["강한 필링 성분", "피부가 얇아진 느낌이 있으면 빈도를 줄여야 합니다."],
      ],
    },
    hyaluronic: {
      overview: ["히알루론산은 물을 끌어당기는 보습 성분으로, 수분 부족과 당김을 줄이는 제품에 자주 들어갑니다.", "피부를 바꾸는 강한 기능성보다는 루틴의 기본 수분감을 깔아주는 역할에 가깝습니다."],
      mechanism: ["히알루론산은 피부 고민을 직접 공격하는 성분이라기보다, 수분 부족으로 루틴이 무너지는 상황을 줄이는 데 의미가 있습니다.", "수분이 부족하면 세안 후 당김이 생기고, 그 위에 바르는 선크림이나 톤 보정 제품이 들뜨거나 건조하게 느껴질 수 있습니다. 히알루론산은 피부 표면에 수분감을 더해 다음 단계 제품이 덜 부담스럽게 올라가도록 돕기 때문에, 기능성 제품보다 먼저 기본 컨디션을 잡아야 하는 사람에게 유용합니다."],
      serkan: "SERKAN 관점에서는 히알루론산을 ‘기능성 전 단계의 기본 컨디션 성분’으로 봅니다. 세안 후 당김, 오후 건조함, 선크림 밀림이 있는 사람에게 루틴 안정감을 줍니다.",
      felt: ["세안 후 당김이 덜함", "로션이나 선크림이 덜 뜨는 느낌", "끈적임은 제형에 따라 차이가 큼", "속건조가 심하면 단독으로는 부족할 수 있음"],
      recommended: ["세안 후 얼굴이 빠르게 당김", "선크림이 건조하게 올라감", "수분감 있는 가벼운 루틴을 원함", "기능성 성분 전에 기본 보습을 잡고 싶음"],
      cautions: ["건조한 환경에서 보습막 없이 단독 사용", "끈적임에 민감한 사람", "수분 제품만 바르고 크림을 생략하는 경우"],
      pairings: [["세라마이드", "수분을 잡은 뒤 장벽 보조로 마무리하기 좋습니다."], ["판테놀", "민감함과 건조함이 같이 있을 때 안정적입니다."], ["글리세린", "데일리 보습 제품에서 자주 같이 쓰입니다."]],
      comboCautions: [["알코올감 강한 토너", "수분감보다 건조함이 먼저 느껴질 수 있습니다."], ["고점도 세럼 과다 사용", "밀림이나 끈적임이 생길 수 있습니다."]],
    },
    panthenol: {
      overview: ["판테놀은 비타민 B5 계열의 진정, 보습, 장벽 보조 성분입니다.", "면도 후, 자외선 노출 후, 피부가 따갑고 붉을 때 부담을 줄이는 제품에 자주 들어갑니다."],
      mechanism: ["판테놀은 트러블을 빠르게 없애는 성분이라기보다, 반복 자극으로 예민해진 피부가 더 쉽게 무너지지 않도록 루틴을 완충하는 성분에 가깝습니다.", "면도, 강한 세안, 자외선 노출, 운동 후 샤워처럼 피부가 자주 따갑거나 붉어지는 상황에서는 강한 기능성보다 진정과 보습을 먼저 잡는 편이 안정적입니다. 판테놀은 이런 루틴에서 피부가 건조하게 조이고 예민해지는 흐름을 줄이는 기준으로 활용할 수 있습니다."],
      serkan: "SERKAN 관점에서는 판테놀을 ‘피부 루틴의 완충재’로 봅니다. 면도, 선크림, 클렌징, 운동 후 샤워처럼 반복 자극이 있는 남성 루틴에 특히 잘 맞습니다.",
      felt: ["따가움이 줄어드는 느낌", "건조하게 조이는 느낌 완화", "크림 제형에서는 답답할 수 있음", "트러블을 직접 없애는 성분이라기보다 컨디션 안정 쪽"],
      recommended: ["면도 후 피부가 붉어짐", "선크림이나 클렌저에 쉽게 따가움", "장벽이 무너진 느낌", "기능성보다 진정 루틴이 우선인 사람"],
      cautions: ["무거운 제형에 답답함을 느끼는 지성 피부", "트러블을 빠르게 없애는 성분으로 기대하는 경우"],
      pairings: [["세라마이드", "장벽 보조 방향이 잘 맞습니다."], ["히알루론산", "수분감과 진정을 같이 깔기 좋습니다."], ["마데카소사이드", "민감 피부 진정 루틴에서 자주 같이 쓰입니다."]],
      comboCautions: [["강한 각질 케어 직후", "진정 성분이어도 따가움이 있을 수 있어 빈도를 조절하세요."], ["향이 강한 제품", "진정 목적과 충돌할 수 있습니다."]],
    },
    ceramide: {
      overview: ["세라마이드는 피부 장벽을 구성하는 지질 성분 중 하나입니다.", "건조함, 거칠음, 외부 자극에 예민한 피부를 관리하는 보습 제품의 핵심 기준이 됩니다."],
      mechanism: ["세라마이드는 피부가 외부 자극을 버티는 힘, 즉 장벽 컨디션과 연결해서 이해하는 것이 좋습니다.", "장벽이 약해지면 수분이 쉽게 빠져나가고, 평소 괜찮던 클렌저나 선크림도 따갑게 느껴질 수 있습니다. 이 상태에서 기능성 성분을 계속 추가하면 피부 고민이 줄기보다 루틴 전체가 흔들릴 수 있어, 세라마이드는 건조함과 예민함이 반복되는 사람에게 ‘먼저 무너지지 않게 잡는’ 제품 선택 기준이 됩니다."],
      serkan: "SERKAN 관점에서는 세라마이드를 ‘피부 체력 성분’으로 봅니다. 트러블을 공격적으로 누르기 전에, 세안과 보습 루틴이 무너지지 않게 잡는 기준입니다.",
      felt: ["건조함이 덜 반복됨", "피부가 덜 예민하게 느껴짐", "무거운 크림은 번들거릴 수 있음", "효과가 빠르게 보이기보다 루틴 안정감 쪽"],
      recommended: ["세안 후 당김이 심함", "피부가 쉽게 붉어짐", "각질 제거 후 예민해짐", "겨울이나 냉방 환경에서 건조함이 심함"],
      cautions: ["무거운 제형이 안 맞는 지성 피부", "여드름성 피부가 리치한 밤 타입을 고르는 경우"],
      pairings: [["판테놀", "진정과 장벽 보조를 같이 가져갑니다."], ["히알루론산", "수분과 보습막을 나눠서 잡기 좋습니다."], ["마데카소사이드", "민감함이 있는 장벽 루틴에 어울립니다."]],
      comboCautions: [["오일감 높은 제품 중복", "답답함이나 번들거림이 생길 수 있습니다."], ["강한 클렌징", "장벽 보조 성분을 써도 세정이 과하면 루틴이 흔들립니다."]],
    },
    "blue-light": {
      overview: ["블루라이트는 스마트폰, 모니터, 조명 등에서 나오는 짧은 파장대의 빛을 말합니다.", "성분이라기보다 수면 리듬과 디지털 피로를 이해하는 원리 항목입니다."],
      mechanism: ["블루라이트는 피부 성분처럼 바르는 대상이 아니라, 수면 루틴을 방해하는 환경 원리로 이해해야 합니다.", "밤에 강한 화면 빛을 오래 보면 몸이 아직 낮이라고 해석해 잠드는 신호가 늦어질 수 있고, 침대 위 스마트폰 사용은 빛뿐 아니라 콘텐츠 자극까지 겹쳐 수면 시작을 미루기 쉽습니다. 그래서 블루라이트 관리는 차단 안경 하나보다 화면 밝기, 사용 시간, 침대 밖 충전 같은 행동 기준과 함께 볼 때 의미가 있습니다."],
      serkan: "SERKAN 관점에서는 블루라이트를 ‘수면 루틴을 방해하는 환경 변수’로 봅니다. 차단 필름보다 중요한 것은 취침 전 화면 거리, 밝기, 시간 제한입니다.",
      felt: ["잠들기 전 머리가 덜 깨어 있는 느낌", "침대에서 스크롤 시간이 줄면 수면 시작이 빨라짐", "눈 피로가 줄었다는 반응", "차단만으로 불면이 해결되지는 않음"],
      recommended: ["밤에 화면 사용이 많음", "침대에서 스마트폰을 오래 봄", "잠들기까지 시간이 오래 걸림", "아침에 눈 피로가 심함"],
      cautions: ["블루라이트 차단만으로 수면 문제를 해결하려는 경우", "야간 모드만 켜고 사용 시간은 그대로인 경우", "업무상 야간 화면 사용이 많은 경우"],
      pairings: [["수면 안대", "빛 차단 환경을 물리적으로 보완합니다."], ["조명 전환", "밤에는 밝기와 색온도를 낮춰 수면 신호를 만듭니다."], ["디지털 디톡스", "기기 사용 시간을 루틴으로 제한합니다."]],
      comboCautions: [["강한 카페인", "빛을 줄여도 각성이 남을 수 있습니다."], ["침대 위 영상 시청", "빛보다 콘텐츠 자극이 더 큰 변수가 될 수 있습니다."]],
    },
    magnesium: {
      overview: ["마그네슘은 근육과 신경 기능에 관여하는 미네랄입니다.", "영양제 영역에서는 운동 후 긴장감, 수면 루틴, 근육 뭉침 맥락에서 자주 언급됩니다."],
      mechanism: ["마그네슘은 먹으면 바로 잠이 오는 성분이라기보다, 근육 긴장과 신경계 컨디션을 이해할 때 참고하는 영양 기준입니다.", "운동 후 몸이 계속 긴장되어 있거나, 스트레스가 많아 잠들기 전에도 몸이 잘 풀리지 않는 사람은 회복 루틴이 흔들리기 쉽습니다. 마그네슘은 근육 수축과 이완, 신경 전달 과정에 관여하기 때문에 운동, 수면, 스트레스가 같이 얽힌 사람에게 보조 성분으로 검토할 수 있습니다.",
      ],
      serkan: "SERKAN 관점에서는 마그네슘을 ‘운동 후 긴장과 수면 루틴을 잇는 보조 성분’으로 봅니다. 운동, 스트레스, 수면 질 저하가 같이 있는 사람에게 검토할 만합니다.",
      felt: ["운동 후 몸이 덜 긴장된다는 반응", "자기 전 루틴에 넣기 쉬움", "위장 반응은 제품 형태와 개인차가 큼", "즉각적인 수면제처럼 기대하면 안 됨"],
      recommended: ["운동 후 근육 긴장감이 있음", "수면 질이 들쭉날쭉함", "카페인과 스트레스가 많은 편", "영양제 루틴을 단순하게 만들고 싶음"],
      cautions: ["복용 중인 약이 있음", "신장 질환 등 섭취 제한이 필요한 경우", "설사나 위장 불편이 생기는 경우"],
      pairings: [["비타민 D", "영양 루틴에서 함께 점검되는 경우가 많습니다."], ["전해질", "운동과 땀 배출이 많은 날 수분 루틴과 연결됩니다."], ["수면 루틴", "조명, 화면 제한과 함께 해야 체감이 납니다."]],
      comboCautions: [["과다 섭취", "위장 불편이 생길 수 있어 용량 확인이 필요합니다."], ["약물 복용", "상호작용 가능성은 전문가 확인이 좋습니다."]],
    },
    creatine: {
      overview: ["크레아틴은 고강도 운동 수행과 반복 운동 능력 맥락에서 많이 쓰이는 성분입니다.", "운동 루틴에서는 근비대, 수행력, 회복 계획과 연결됩니다."],
      mechanism: ["크레아틴은 근육을 바로 키우는 마법 성분이라기보다, 짧고 강한 운동을 반복할 때 필요한 에너지 재생과 연결해서 보는 성분입니다.", "근력 운동에서 마지막 몇 회를 버티지 못하거나 세트가 뒤로 갈수록 수행력이 급격히 떨어지는 사람은 운동 자극을 꾸준히 쌓기 어렵습니다. 크레아틴은 이런 반복 수행 맥락에서 자주 활용되기 때문에, 운동 기록을 남기고 중량이나 반복 수를 조금씩 밀어 올리는 사람에게 의미가 있습니다."],
      serkan: "SERKAN 관점에서는 크레아틴을 ‘운동 루틴을 숫자로 밀어주는 성분’으로 봅니다. 단, 운동 계획, 수분 섭취, 꾸준함이 먼저입니다.",
      felt: ["반복 세트에서 힘이 유지된다는 반응", "체중이 일시적으로 늘 수 있음", "꾸준히 먹기 쉬운 무맛 파우더 선호", "소화 불편은 개인차가 있음"],
      recommended: ["근력 운동을 주 3회 이상 함", "반복 세트 수행력을 높이고 싶음", "단백질 외 운동 보조제를 찾음", "운동 기록을 꾸준히 관리함"],
      cautions: ["수분 섭취가 부족함", "위장 불편이 있는 사람", "운동 없이 보충제 효과만 기대하는 경우"],
      pairings: [["단백질", "운동 후 회복 루틴에서 같이 점검하기 좋습니다."], ["전해질", "땀 배출이 많은 날 수분 루틴을 보완합니다."], ["운동 기록", "체감보다 중량과 반복 수로 판단하기 좋습니다."]],
      comboCautions: [["카페인 과다", "수면과 회복을 해칠 수 있습니다."], ["수분 부족", "운동 퍼포먼스와 컨디션이 흔들릴 수 있습니다."]],
    },
  };

  function ingredientGuideFor(item) {
    const guide = ingredientGuideCopy[item.key] || {};
    return {
      overview: guide.overview || [`${item.name}은 ${item.effects.join(", ")} 맥락에서 루틴과 제품 선택 기준을 이해하는 데 쓰는 지식 항목입니다.`, `${item.group === "skin" ? "스킨케어" : "생활 루틴"}에서 어떤 제품을 고르고 어떤 상황에 쓰는지 판단하는 기준으로 활용합니다.`],
      mechanism: guide.mechanism || [`${item.name}은 단순히 성분표에 들어 있는 이름보다, 어떤 루틴 문제를 줄이기 위한 기준인지 이해하는 것이 중요합니다.`, `${item.recommend}처럼 고민이 반복되는 경우에는 제품을 더 많이 추가하기보다, 이 성분이 어떤 원리로 불편을 줄이는지 보고 루틴에 넣을지 판단하는 편이 안전합니다.`],
      serkan: guide.serkan || `SERKAN 관점에서는 ${item.name}을 ${item.recommend}에게 필요한 루틴 판단 기준으로 봅니다. 제품을 고를 때는 성분명보다 사용 맥락, 자극 가능성, 꾸준히 쓸 수 있는 제형을 함께 봅니다.`,
      felt: guide.felt || item.effects.map((effect) => `${effect} 맥락에서 체감 차이를 확인`),
      recommended: guide.recommended || item.recommend.split(",").map((text) => text.trim()).filter(Boolean),
      cautions: guide.cautions || item.caution.split(",").map((text) => text.trim()).filter(Boolean),
      pairings: guide.pairings || [["기본 보습", "성분 효과보다 루틴 안정감을 먼저 만들어줍니다."], ["자극 적은 클렌징", "불필요한 변수 없이 성분 반응을 보기 좋습니다."]],
      comboCautions: guide.comboCautions || [["고함량 기능성 중복", "처음부터 여러 성분을 겹치면 무엇이 맞지 않는지 알기 어렵습니다."], ["강한 각질 케어", "민감하거나 건조한 날에는 빈도를 줄이는 편이 좋습니다."]],
    };
  }

  function relatedIngredientRoutines(item) {
    const textTerms = uniq([...(item.terms || []), ...(item.effects || []), item.name]);
    return data.routines.filter((routine) => textTerms.some((term) => normalizeManualFilterText([routine.title, routine.action, routine.summary, routine.description, ...(routine.tags || [])].join(" ")).includes(normalizeManualFilterText(term)))).slice(0, 6);
  }

  function groupIngredientProducts(item) {
    const groups = [
      { key: "starter", label: "입문용", products: [] },
      { key: "sensitive", label: "민감 피부용", products: [] },
      { key: "daily", label: "데일리 사용", products: [] },
      { key: "focus", label: "집중 관리용", products: [] },
    ];
    item.products.forEach((product, index) => {
      const haystack = normalizeManualFilterText([product.productName, product.brand, product.category, product.recommendationType, product.recommendationReason, product.target, ...(product.tags || [])].join(" "));
      const target = /민감|진정|순한|시카|장벽/.test(haystack) ? "sensitive"
        : /프리미엄|고함량|앰플|세럼|집중|리페어|리뉴/.test(haystack) ? "focus"
        : /데일리|매일|선크림|로션|크림|워시/.test(haystack) ? "daily"
        : index < 2 ? "starter" : "daily";
      groups.find((group) => group.key === target)?.products.push(product);
    });
    return groups;
  }

  function renderKnowledgeLibraryHeader(icon, title, desc, cta) {
    return `
      <div class="knowledge-library-head">
        <div class="manual-title-block">
          <span class="cat-icon manual-title-icon">${esc(icon)}</span>
          <div>
            <h2>${title}</h2>
            <p>${esc(desc)}</p>
          </div>
        </div>
        <button class="primary-action" type="button">${esc(cta)}</button>
      </div>
    `;
  }

  function renderKnowledgeToolbar(kind, filters, sortOptions) {
    const stateFilters = state.encyclopediaFilters[kind];
    const labelForFilter = (filter) => {
      if (filter === "all") return "전체";
      if (kind === "ingredients" && ingredientGroupMeta[filter]) return `${ingredientGroupMeta[filter].icon} ${ingredientGroupMeta[filter].label}`;
      return categoryName(filter);
    };
    return `
      <div class="knowledge-toolbar">
        <div class="knowledge-filter-chips">
          ${filters.map((filter) => `<button class="${stateFilters.category === filter ? "active" : ""}" data-action="filter-encyclopedia" data-kind="${esc(kind)}" data-filter="${esc(filter)}">${esc(labelForFilter(filter))}</button>`).join("")}
        </div>
        <select data-action="sort-encyclopedia" data-kind="${esc(kind)}" aria-label="정렬">
          ${sortOptions.map(([value, label]) => `<option value="${esc(value)}" ${stateFilters.sort === value ? "selected" : ""}>${esc(label)}</option>`).join("")}
        </select>
      </div>
    `;
  }

  function renderLibraryPagination(total) {
    const pages = Math.max(1, Math.min(10, Math.ceil(total / 8)));
    return `
      <div class="library-pagination">
        <button>‹</button>
        ${Array.from({ length: Math.min(3, pages) }).map((_, index) => `<button class="${index === 0 ? "active" : ""}">${index + 1}</button>`).join("")}
        ${pages > 3 ? `<span>…</span><button>${pages}</button>` : ""}
        <button>›</button>
      </div>
    `;
  }

  function renderItemProductPreviewStack(item, stats) {
    const products = stats.products.filter((product) => product.imageUrl).slice(0, 3);
    const total = stats.products.length;
    if (!total) {
      return `
        <div class="item-product-stack is-empty">
          <span>${esc(iconForItem(item))}</span>
          <em>제품 연결 대기</em>
        </div>
      `;
    }
    const placeholders = Math.max(0, 3 - products.length);
    return `
      <div class="item-product-stack" aria-label="${esc(item.name)} 연결 제품 ${total}개">
        ${products.map((product, index) => `
          <span class="stack-product stack-${index + 1}">
            ${renderStackProductImage(product, item)}
          </span>
        `).join("")}
        ${Array.from({ length: placeholders }).map((_, index) => `<span class="stack-product stack-placeholder stack-${products.length + index + 1}">${esc(iconForItem(item))}</span>`).join("")}
        <b>+${total}</b>
      </div>
    `;
  }

  function renderStackProductImage(product, item) {
    return `
      <img src="${esc(product.imageUrl)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.parentElement.classList.add('is-broken');this.remove();">
      <small class="stack-product-fallback">${esc(iconForItem(item))}</small>
    `;
  }

  function getBrandEntryByCode(code) {
    const name = decodeURIComponent(String(code || "").replace(/^BRAND::/, ""));
    return deriveBrandLibrary().find((brand) => brand.name === name) || null;
  }

  function getIngredientEntryByCode(code) {
    const key = String(code || "").replace(/^ING::/, "");
    return deriveIngredientLibrary().find((item) => item.key === key) || null;
  }

  function renderBrandDetail(brand) {
    if (!brand) return `<div class="empty">브랜드를 찾을 수 없습니다.</div>`;
    const relatedIngredients = deriveIngredientLibrary().filter((item) => item.products.some((product) => product.brand === brand.name)).slice(0, 6);
    return `
      <article class="knowledge-detail encyclopedia-detail">
        ${detailHeader("Brand Encyclopedia", brand.name, categoryName(brand.domain))}
        <p>${esc(brand.desc)}</p>
        <div class="brand-position-tags detail-tags">${(brand.positions || []).map((tag) => `<span>${esc(brandPositionCopy[tag] || tag)}</span>`).join("")}</div>
        <div class="meta-line"><span>대표 카테고리 ${esc(categoryName(brand.domain))}</span><span>제품 ${brand.products.length}개</span><span>아이템 ${brand.items.length}개</span><span>매뉴얼 ${brand.manuals.length}개</span></div>
        <section class="detail-card">
          <h3>대표 제품</h3>
          <div class="featured-product-grid">
            ${brand.products.slice(0, 8).map(renderFeaturedProductCard).join("") || pendingBox("대표 제품 연결 대기", "실제 제품 데이터가 연결되면 표시됩니다.")}
          </div>
        </section>
        <section class="detail-card">
          <h3>연결 Item</h3>
          <div class="detail-mini-grid">
            ${brand.items.map((item) => relationButton("item", item.code, "Item", item.name)).join("") || pendingBox("연결 Item 없음", "제품의 itemCode가 연결되면 표시됩니다.")}
          </div>
        </section>
        <section class="detail-card">
          <h3>관련 매뉴얼</h3>
          <div class="detail-mini-grid">
            ${brand.manuals.slice(0, 6).map((manual) => relationButton("manual", manual.code, "Manual", manual.title)).join("") || pendingBox("관련 매뉴얼 연결 대기", "Item의 manualCode를 기준으로 연결됩니다.")}
          </div>
        </section>
        <section class="detail-card">
          <h3>관련 원리/성분</h3>
          <div class="detail-mini-grid">
            ${relatedIngredients.map((item) => relationButton("ingredient", item.key, "Principle", item.name)).join("") || pendingBox("관련 원리/성분 연결 대기", "제품명과 설명을 기준으로 성분/원리 항목과 연결됩니다.")}
          </div>
        </section>
      </article>
    `;
  }

  function renderFeaturedProductCard(product) {
    const volume = productVolume(product);
    return `
      <button class="featured-product-card clickable" data-open-type="product" data-code="${esc(product.code)}">
        <div class="featured-product-copy">
          <span>${esc(product.brand || "Brand")}</span>
          <strong>${esc(productNameWithoutVolume(product.productName, volume))}</strong>
          ${volume ? `<b>${esc(volume)}</b>` : `<b>${esc(product.category || categoryName(product.domain))}</b>`}
          <em>${esc(product.code)} <i>→</i></em>
        </div>
        <div class="featured-product-media">
          ${renderFeaturedProductImage(product)}
        </div>
      </button>
    `;
  }

  function renderFeaturedProductImage(product) {
    if (product?.imageUrl) {
      return `<img src="${esc(product.imageUrl)}" alt="${esc(product.productName)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="var p=this.closest('.featured-product-media'); if(p) p.classList.add('is-broken'); this.remove();">`;
    }
    return `<span class="featured-product-placeholder">${esc(categoryVisual[product?.domain]?.icon || "▤")}</span>`;
  }

  function productVolume(product) {
    const text = String(product?.productName || "");
    const match = text.match(/(\d+(?:\.\d+)?\s?(?:ml|mL|ML|g|G|kg|KG|개|매|정|캡슐|포|L|l))(?:\s|$|[)+,/])/);
    return match ? match[1].replace(/\s+/g, "") : "";
  }

  function productNameWithoutVolume(name, volume) {
    if (!volume) return name || "제품명";
    const escapedVolume = volume.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ml/i, "m\\s?l").replace(/g/i, "g");
    return String(name || "제품명").replace(new RegExp(`\\s*${escapedVolume}\\s*`, "i"), " ").replace(/\s{2,}/g, " ").trim();
  }

  function renderIngredientDetail(item) {
    if (!item) return `<div class="empty">성분/원리를 찾을 수 없습니다.</div>`;
    const guide = ingredientGuideFor(item);
    const relatedRoutines = relatedIngredientRoutines(item);
    const productGroups = groupIngredientProducts(item);
    const relatedManuals = item.manuals.slice(0, 4);
    const shownRoutines = relatedRoutines.slice(0, 4);
    return `
      <article class="ingredient-guide-page encyclopedia-detail">
        <section class="ingredient-guide-hero">
          <div class="ingredient-guide-copy">
            <span class="ingredient-kicker">PRINCIPLE &amp; INGREDIENT</span>
            <h2>${esc(item.name)}</h2>
            <code>${esc(item.english)}</code>
            <p>${esc(guide.overview[0] || `${item.name}은 ${item.effects.join(", ")} 맥락에서 활용되는 지식 항목입니다.`)}</p>
            <div class="effect-row">${item.effects.slice(0, 4).map((effect) => `<span>${esc(effect)}</span>`).join("")}</div>
          </div>
          <div class="ingredient-visual" aria-hidden="true">
            <span>${esc(item.icon)}</span>
            <i></i><i></i><i></i>
          </div>
        </section>

        <div class="ingredient-core-grid">
          ${renderIngredientCoreCard("🧬", "성분 개요", guide.overview[0] || guide.overview.join(" "))}
          ${renderIngredientCoreCard("🛡️", "왜 효과가 있는가", guide.mechanism[0] || guide.mechanism.join(" "))}
          ${renderIngredientCoreCard("🎯", "SERKAN 해석", guide.serkan, "serkan")}
        </div>

        <div class="ingredient-check-grid">
          ${renderIngredientChecklistPanel("✅", "이런 사람에게 추천", guide.recommended, "recommend")}
          ${renderIngredientChecklistPanel("⚠️", "이런 경우 주의", guide.cautions, "caution")}
        </div>

        <div class="ingredient-info-grid">
          ${renderIngredientPairPanel("🔗", "같이 쓰면 좋은 성분", guide.pairings)}
          ${renderIngredientPairPanel("⚠️", "조합 시 주의할 성분", guide.comboCautions, "caution")}
          ${renderIngredientListPanel("📊", "실제로 느끼는 변화", guide.felt)}
        </div>

        ${renderIngredientRelatedSection("📖", "관련 매뉴얼", relatedManuals, (manual) => relationButton("manual", manual.code, "Manual", manual.title))}
        ${renderIngredientRelatedSection("🧩", "관련 루틴", shownRoutines, (routine) => relationButton("routine", routine.code, "Routine", routine.title))}

        <section class="ingredient-related-section">
          <div class="ingredient-related-head">
            <h3>🛍️ 관련 제품</h3>
            <button type="button">모두 보기 →</button>
          </div>
          <div class="ingredient-product-groups compact">
            ${productGroups.map((group) => `
              <div class="ingredient-product-group">
                <div class="ingredient-product-group-head">
                  <strong>${esc(group.label)}</strong>
                  <span>${group.products.length ? `제품 ${group.products.length}개` : "제품 연결 대기"}</span>
                </div>
                <div class="ingredient-related-grid">
                  ${group.products.slice(0, 3).map((product) => relationButton("product", product.code, product.brand || "Product", product.productName)).join("") || `<p class="ingredient-pending-copy">이 그룹에 맞는 제품이 연결되면 표시됩니다.</p>`}
                </div>
              </div>
            `).join("")}
          </div>
        </section>

        ${item.items.length || item.brands.length ? `
          <section class="ingredient-related-section">
            <div class="ingredient-related-head">
              <h3>🗂️ 관련 Item / 브랜드</h3>
              <button type="button">모두 보기 →</button>
            </div>
            <div class="ingredient-related-grid">
              ${item.items.slice(0, 4).map((entry) => relationButton("item", entry.code, "Item", entry.name)).join("")}
              ${item.brands.slice(0, 4).map((brand) => relationButton("brand", `BRAND::${encodeURIComponent(brand)}`, "Brand", brand)).join("")}
            </div>
          </section>
        ` : ""}
      </article>
    `;
  }

  function renderIngredientCoreCard(icon, title, body, tone = "") {
    return `
      <section class="ingredient-core-card ${tone ? `is-${esc(tone)}` : ""}">
        <span>${esc(icon)}</span>
        <h3>${esc(title)}</h3>
        <p>${esc(body)}</p>
      </section>
    `;
  }

  function renderIngredientChecklistPanel(icon, title, items, tone = "") {
    return `
      <section class="ingredient-check-panel ${tone ? `is-${esc(tone)}` : ""}">
        <h3><span>${esc(icon)}</span>${esc(title)}</h3>
        <ul class="${tone === "caution" ? "ingredient-caution-list" : "ingredient-check-list"}">
          ${items.slice(0, 6).map((text) => `<li>${esc(text)}</li>`).join("")}
        </ul>
      </section>
    `;
  }

  function renderIngredientPairPanel(icon, title, pairs, tone = "") {
    return `
      <section class="ingredient-info-card ${tone ? `is-${esc(tone)}` : ""}">
        <h3><span>${esc(icon)}</span>${esc(title)}</h3>
        <div class="ingredient-mini-list">
          ${pairs.slice(0, 5).map(([name, reason]) => `
            <div>
              <strong>${esc(name)}</strong>
              <p>${esc(reason)}</p>
            </div>
          `).join("")}
        </div>
      </section>
    `;
  }

  function renderIngredientListPanel(icon, title, items) {
    return `
      <section class="ingredient-info-card">
        <h3><span>${esc(icon)}</span>${esc(title)}</h3>
        <ul class="ingredient-check-list">
          ${items.slice(0, 6).map((text) => `<li>${esc(text)}</li>`).join("")}
        </ul>
        <p class="ingredient-note">개인차가 있으며, 사용 환경에 따라 다르게 느껴질 수 있습니다.</p>
      </section>
    `;
  }

  function renderIngredientRelatedSection(icon, title, items, renderer) {
    return `
      <section class="ingredient-related-section">
        <div class="ingredient-related-head">
          <h3>${esc(icon)} ${esc(title)}</h3>
          <button type="button">모두 보기 →</button>
        </div>
        <div class="ingredient-related-grid">
          ${items.slice(0, 4).map(renderer).join("") || pendingBox(`${title} 연결 대기`, "성분명/효과 태그가 연결되면 표시됩니다.")}
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
          <span>추천 슬롯 ${getItemProductSlots(group).length}개</span>
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

  function getCategoryPreviewProducts(categoryCode, limit = 3) {
    const itemCodes = new Set(data.items.filter((item) => item.domain === categoryCode).map((item) => item.code));
    const seenProducts = new Set();
    const seenImages = new Set();
    const previewProducts = [];
    data.products.forEach((product) => {
      if (!itemCodes.has(product.itemCode)) return;
      if (isMockProduct(product)) return;
      if (!product.imageUrl) return;
      const imageKey = String(product.imageUrl).trim();
      if (!imageKey || seenProducts.has(product.code) || seenImages.has(imageKey)) return;
      seenProducts.add(product.code);
      seenImages.add(imageKey);
      previewProducts.push(product);
    });
    return previewProducts.slice(0, limit);
  }

  function renderCategoryProductPreview(category, products, fallbackCount) {
    if (!products.length) {
      return `
        <div class="product-objects placeholder-objects" aria-label="${esc(category.name)} 제품 이미지 연결 대기">
          <div class="object-art bottle">${esc(category.code)}</div>
          <div class="object-art jar">Item</div>
          <div class="object-art box">${esc(fallbackCount)}</div>
        </div>
      `;
    }
    return `
      <div class="category-product-preview" aria-label="${esc(category.name)} 실제 제품 preview">
        ${products.map((product) => `
          <img src="${esc(product.imageUrl)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove();">
        `).join("")}
      </div>
    `;
  }

  function renderProductHubCard(category) {
    const visual = categoryVisual[category.code] || { icon: category.icon, desc: `${category.label} 아이템과 제품` };
    const items = data.items.filter((item) => item.domain === category.code);
    const productGroups = getProductGroups({ includeMock: true, sourceProducts: data.products.filter((product) => product.domain === category.code) });
    const previewProducts = getCategoryPreviewProducts(category.code, 3);
    return `
      <button class="product-card product-hub-card clickable" style="--tint:${category.tint};--accent:${category.accent};" data-open-type="category" data-code="${esc(category.code)}">
        <div class="product-card-head">
          <div class="cat-icon">${esc(visual.icon)}</div>
          <span class="code-label">→</span>
        </div>
        <h3>${esc(category.name)} <span>${esc(category.label)} 아이템 &amp; 제품</span></h3>
        <p>${esc(productHubCopy(category.code))}</p>
        <div class="meta-line"><span>아이템 ${items.length}개</span><span>제품 그룹 ${productGroups.length}개</span></div>
        ${renderCategoryProductPreview(category, previewProducts, productGroups.length)}
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
      return `
        <span class="product-image-shell">
          <img class="product-image" src="${esc(product.imageUrl)}" alt="${esc(product.productName)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.closest('.product-image-shell')?.classList.add('is-broken');this.remove();">
          <span class="product-image-fallback" aria-hidden="true">
            <b>${esc(categoryVisual[product.domain]?.icon || "▤")}</b>
            <em>이미지 준비 중</em>
          </span>
        </span>
      `;
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
    const customSituationCategories = buildCustomSituationCategories();
    const visibleCategories = visibleSituationCategories(mentalCategories, socialCategories, customSituationCategories);
    const detailCount = visibleCategories.reduce((sum, category) => sum + category.items.length, 0);
    const selectedCategory = getSelectedSituationCategory(mentalCategories, socialCategories, customSituationCategories);
    return `
      <section class="section-card" id="situations">
        <div class="section-head">
          <div>
            <h2>상황 대시보드</h2>
            <div class="eyebrow">지금 상태에 가까운 상황 카테고리를 고르면 관련 상세 매뉴얼을 좁혀 보여줍니다.</div>
          </div>
          <div class="segmented">
            <button class="${state.situationFilter === "all" ? "active" : ""}" data-action="filter-situation" data-type="all">전체</button>
            <button class="${state.situationFilter === "Mental" ? "active" : ""}" data-action="filter-situation" data-type="Mental">Mental</button>
            <button class="${state.situationFilter === "Social" ? "active" : ""}" data-action="filter-situation" data-type="Social">Social</button>
            <button data-action="add-routine" data-board="situation" data-location="${esc(state.situationFilter === "all" ? "Mental" : state.situationFilter)}">+ 상황 루틴 추가</button>
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

  function buildCustomSituationCategories() {
    const custom = data.situations.filter((situation) => situation.isCustom && !situation.type.includes("Mental") && !situation.type.includes("Social"));
    if (!custom.length) return [];
    const grouped = new Map();
    custom.forEach((situation) => {
      const type = situation.type || "기타";
      if (!grouped.has(type)) grouped.set(type, []);
      grouped.get(type).push(situation);
    });
    return [...grouped.entries()].map(([type, items]) => ({
      key: `custom-${type}`,
      icon: type === "Space" ? "🏠" : type === "Body" ? "🏋️" : "◇",
      title: `${type} 사용자 추가 상황`,
      desc: "직접 추가한 상황 대응 루틴",
      type,
      items,
      manualCount: items.filter((situation) => situation.manualCode).length,
      itemCount: items.flatMap((situation) => getSituationItems(situation)).length,
    }));
  }

  function visibleSituationCategories(mentalCategories, socialCategories, customCategories = []) {
    const all = state.situationFilter === "Mental"
      ? mentalCategories
      : state.situationFilter === "Social" ? socialCategories : [...mentalCategories, ...socialCategories, ...customCategories];
    if (!state.selectedSituationCategory) return all.filter((category) => category.items.length);
    const selected = all.find((category) => category.key === state.selectedSituationCategory);
    return selected ? [selected] : all;
  }

  function getSelectedSituationCategory(mentalCategories, socialCategories, customCategories = []) {
    if (!state.selectedSituationCategory) return null;
    return [...mentalCategories, ...socialCategories, ...customCategories].find((category) => category.key === state.selectedSituationCategory) || null;
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
    const results = query ? entities.filter((item) => matchesSearchQuery(item.entity, query)) : [];
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

  function mySerkanGoalOptions() {
    return [
      { key: "피부 컨디션", icon: "💧", domains: ["SK"] },
      { key: "수면 회복", icon: "🌙", domains: ["SL", "MT"] },
      { key: "체형 관리", icon: "🏋️", domains: ["BD", "FD"] },
      { key: "스타일 관리", icon: "👕", domains: ["ST", "GR"] },
      { key: "공간 정리", icon: "🏠", domains: ["SP", "SY"] },
      { key: "성장 / 생산성", icon: "↗", domains: ["SY", "MT"] },
    ];
  }

  function mySerkanGoalDomains() {
    const goals = state.mySerkan.goals || [];
    const domains = goals.flatMap((goal) => mySerkanGoalOptions().find((entry) => entry.key === goal)?.domains || []);
    if (state.mySerkan.today?.stress === "높음") domains.push("SL", "MT", "SP");
    if (state.mySerkan.today?.condition === "저조") domains.push("SL", "BD", "FD");
    if (/민감/.test(state.mySerkan.profile?.skinType || "")) domains.push("SK");
    return uniq(domains.length ? domains : ["SK", "SL", "SY"]);
  }

  function mySerkanDoneCodes() {
    return new Set(Object.entries(state.weeklyDone || {})
      .filter(([, checked]) => checked)
      .map(([key]) => key.split(":").pop())
      .filter(Boolean));
  }

  function mySerkanCompletionSummary() {
    const doneCodes = mySerkanDoneCodes();
    const boardRoutines = (board) => data.routines.filter((routine) => routine.board === board || routine.customType === board);
    const percentFor = (routines) => routines.length ? Math.round((routines.filter((routine) => doneCodes.has(routine.code)).length / routines.length) * 100) : 0;
    const daily = boardRoutines("daily");
    const weekly = boardRoutines("weekly");
    const monthly = monthlyRoutines();
    const seasonal = ["봄", "여름", "가을", "겨울"].flatMap((season) => seasonalRoutinesFor(season));
    const all = [...daily, ...weekly, ...monthly, ...seasonal];
    return {
      daily: { done: daily.filter((routine) => doneCodes.has(routine.code)).length, total: daily.length, percent: percentFor(daily) },
      weekly: { done: weekly.filter((routine) => doneCodes.has(routine.code)).length, total: weekly.length, percent: percentFor(weekly) },
      monthly: { done: monthly.filter((routine) => doneCodes.has(routine.code)).length, total: monthly.length, percent: percentFor(monthly) },
      total: { done: all.filter((routine) => doneCodes.has(routine.code)).length, total: all.length, percent: percentFor(all) },
      streak: doneCodes.size ? 1 : 0,
      doneCodes,
    };
  }

  function mySerkanDomainInsights() {
    const doneCodes = mySerkanDoneCodes();
    const domains = commonCategoryOrder.map((domain) => {
      const routines = data.routines.filter((routine) => routine.domain === domain && ["daily", "weekly", "monthly", "seasonal"].includes(routine.board));
      const done = routines.filter((routine) => doneCodes.has(routine.code)).length;
      return { domain, total: routines.length, done, percent: routines.length ? Math.round((done / routines.length) * 100) : 0 };
    }).filter((entry) => entry.total);
    return {
      domains,
      strong: [...domains].sort((a, b) => b.percent - a.percent || b.done - a.done).slice(0, 3),
      weak: [...domains].sort((a, b) => a.percent - b.percent || b.total - a.total).slice(0, 2),
    };
  }

  function mySerkanSlotForRoutine(routine) {
    const text = routineSearchText(routine);
    const group = dailyGroupForRoutine(routine);
    if (routine.domain === "SL" || group === "수면" || /수면|취침|디지털|조명|침구/.test(text)) return "수면 전";
    if (group === "기상" || /기상|아침|햇빛|선크림|물/.test(text)) return "아침";
    if (group === "업무" || /업무|집중|책상|눈|스트레칭|자세/.test(text)) return "업무 중";
    if (group === "저녁" || group === "오후" || /저녁|샤워|운동|산책|정리/.test(text)) return "저녁";
    return "업무 중";
  }

  function scoreMySerkanRoutine(routine, domains) {
    const text = routineSearchText(routine);
    let score = domains.includes(routine.domain) ? 8 : 0;
    if (routine.board === "daily") score += 5;
    if (routine.board === "weekly") score += 2;
    if (/선크림|수면|물|햇빛|스트레칭|정리|디지털|산책|호흡|기록/.test(text)) score += 3;
    if (state.mySerkan.today?.stress === "높음" && /수면|호흡|산책|정리|디지털|회복/.test(text)) score += 5;
    if (state.mySerkan.today?.condition === "저조" && /회복|수면|물|가벼운|스트레칭/.test(text)) score += 4;
    return score;
  }

  function mySerkanRecommendations() {
    const domains = mySerkanGoalDomains();
    const candidates = data.routines
      .filter((routine) => ["daily", "weekly"].includes(routine.board))
      .map((routine) => ({ routine, score: scoreMySerkanRoutine(routine, domains), slot: mySerkanSlotForRoutine(routine) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.routine.title.localeCompare(b.routine.title, "ko"));
    return ["아침", "업무 중", "저녁", "수면 전"].map((slot) => ({
      slot,
      routines: candidates.filter((entry) => entry.slot === slot).map((entry) => entry.routine).slice(0, 4),
    }));
  }

  function mySerkanReason() {
    const goals = state.mySerkan.goals || [];
    if (state.mySerkan.today?.stress === "높음") return "스트레스가 높은 날입니다. 회복 루틴과 수면 전 루틴을 우선 추천합니다.";
    if (state.mySerkan.today?.condition === "저조") return "컨디션이 낮은 날입니다. 강도를 올리기보다 회복 가능한 작은 루틴을 먼저 배치했습니다.";
    if (goals.length) return `${goals.join(" · ")} 목표에 맞춰 오늘 바로 실행할 수 있는 루틴을 골랐습니다.`;
    return "현재 프로필과 최근 수행 데이터를 기준으로 부담이 낮은 루틴을 추천했습니다.";
  }

  function mySerkanRecommendedItems() {
    const domains = new Set(mySerkanGoalDomains());
    return getProductGroups({ includeMock: false })
      .filter((group) => domains.has(group.domain) && group.realCount)
      .slice(0, 3);
  }

  function mySerkanBuilderFilters() {
    return [
      { key: "recommended", label: "추천 루틴" },
      { key: "morning", label: "아침" },
      { key: "work", label: "업무" },
      { key: "evening", label: "저녁" },
      { key: "sleep", label: "수면" },
      { key: "SK", label: "Skin" },
      { key: "BD", label: "Body" },
      { key: "SL", label: "Sleep" },
      { key: "SY", label: "System" },
    ];
  }

  function mySerkanBuilderCandidates() {
    const builder = state.mySerkan.builder || defaultMySerkan().builder;
    const filter = builder.filter || "recommended";
    const domains = mySerkanGoalDomains();
    const candidates = data.routines
      .filter((routine) => ["daily", "weekly"].includes(routine.board))
      .map((routine) => ({
        routine,
        slot: mySerkanSlotForRoutine(routine),
        score: scoreMySerkanRoutine(routine, domains),
      }))
      .filter((entry) => {
        if (filter === "recommended") return entry.score > 0;
        if (filter === "morning") return entry.slot === "아침";
        if (filter === "work") return entry.slot === "업무 중";
        if (filter === "evening") return entry.slot === "저녁";
        if (filter === "sleep") return entry.slot === "수면 전";
        return entry.routine.domain === filter;
      })
      .sort((a, b) => b.score - a.score || a.routine.title.localeCompare(b.routine.title, "ko"));
    return candidates.slice(0, 18);
  }

  function renderMySerkan() {
    const summary = mySerkanCompletionSummary();
    const insights = mySerkanDomainInsights();
    return `
      <section class="my-serkan-page">
        <header class="my-serkan-head">
          <div><span>PERSONAL MANAGEMENT HUB</span><h1>MY SERKAN</h1><p>나를 이해하고, 나에게 맞는 루틴으로 더 나은 일상을 설계하세요.</p></div>
          <div class="my-date-chip">🗓 ${esc(formatDate(new Date()))}</div>
        </header>
        <div class="my-serkan-grid">
          ${renderMyProfileCard()}
          ${renderMyStatusCard()}
          ${renderMyGoalCard()}
        </div>
        <div class="my-serkan-layout">
          <main class="my-serkan-main">
            ${renderMyRecommendations(mySerkanRecommendations())}
            ${renderMyRoutineBuilder()}
            ${renderMyProgressSection(summary)}
            ${renderMyCalendarAndActivity(summary)}
            <div class="my-bottom-grid">
              ${renderMyInsightPanel(insights)}
              ${renderMyWeeklyReport(insights)}
              ${renderMyBalancePanel(insights)}
            </div>
          </main>
          <aside class="my-serkan-aside">
            ${renderMyRoutinePanel()}
            ${renderMyStreakPanel(summary)}
            ${renderMyRecommendedItemPanel(mySerkanRecommendedItems())}
          </aside>
        </div>
        <footer class="my-serkan-footer">
          <div><strong>SERKAN이 전하는 한 줄 조언</strong><span>${esc(mySerkanReason())}</span></div>
          <button data-action="add-routine" data-board="daily" data-location="기상">+ 나만의 루틴 만들기</button>
        </footer>
      </section>
    `;
  }

  function renderMyProfileCard() {
    const profile = state.mySerkan.profile || {};
    return `
      <section class="my-card my-profile-card">
        <div class="my-card-head"><h3>MY SERKAN PROFILE</h3><span>수정</span></div>
        <div class="my-profile-grid">
          ${renderMySelect("job", "직업", ["사무직", "학생", "영업직", "교대근무", "프리랜서"], profile.job, "💼")}
          ${renderMySelect("workStyle", "근무 형태", ["출근", "재택", "혼합"], profile.workStyle, "🏢")}
          ${renderMySelect("wakeTime", "기상 시간", ["06:00", "06:30", "07:00", "07:30", "08:00"], profile.wakeTime, "⏱")}
          ${renderMySelect("sleepTime", "취침 시간", ["22:30", "23:00", "23:30", "24:00", "01:00"], profile.sleepTime, "🌙")}
          ${renderMySelect("skinType", "피부 타입", ["지성", "복합성", "건성", "민감성"], profile.skinType, "💧")}
          ${renderMySelect("exerciseFrequency", "운동 빈도", ["주0회", "주1~2회", "주3~4회", "주5회+"], profile.exerciseFrequency, "🏃")}
        </div>
      </section>
    `;
  }

  function renderMySelect(field, label, options, value, icon) {
    return `
      <label class="my-profile-field">
        <span>${esc(icon)}</span><small>${esc(label)}</small>
        <select data-my-profile-field="${esc(field)}" aria-label="${esc(label)}">
          ${options.map((option) => `<option value="${esc(option)}" ${option === value ? "selected" : ""}>${esc(option)}</option>`).join("")}
        </select>
      </label>
    `;
  }

  function renderMyStatusCard() {
    const today = state.mySerkan.today || {};
    return `
      <section class="my-card">
        <div class="my-card-head"><h3>오늘의 상태</h3><span>수정</span></div>
        <div class="my-status-block"><strong>컨디션</strong><div class="my-status-options">${["좋음", "보통", "저조"].map((value) => `<button class="${today.condition === value ? "active" : ""}" data-action="set-my-status" data-field="condition" data-value="${esc(value)}">☻<span>${esc(value)}</span></button>`).join("")}</div></div>
        <div class="my-status-block"><strong>스트레스</strong><div class="my-stress-options">${["낮음", "보통", "높음"].map((value) => `<button class="${today.stress === value ? "active" : ""}" data-action="set-my-status" data-field="stress" data-value="${esc(value)}">${esc(value)}</button>`).join("")}</div></div>
      </section>
    `;
  }

  function renderMyGoalCard() {
    const goals = state.mySerkan.goals || [];
    return `
      <section class="my-card">
        <div class="my-card-head"><h3>현재 목표</h3><span>최대 2개 선택</span></div>
        <div class="my-goal-grid">${mySerkanGoalOptions().map((goal) => `<button class="${goals.includes(goal.key) ? "active" : ""}" data-action="toggle-my-goal" data-goal="${esc(goal.key)}"><span>${esc(goal.icon)}</span><strong>${esc(goal.key)}</strong></button>`).join("")}</div>
        <p class="my-selected-goals">선택한 목표 <b>${goals.length} / 2</b></p>
      </section>
    `;
  }

  function renderMyRecommendations(groups) {
    const icons = { "아침": "☀️", "업무 중": "💻", "저녁": "🌆", "수면 전": "🌙" };
    return `
      <section class="my-card my-recommend-card">
        <div class="my-card-head"><div><h3>오늘의 SERKAN 추천</h3><p>프로필, 현재 상태, 현재 목표를 기반으로 오늘의 루틴을 추천했습니다.</p></div><span>추천 이유 보기 ⓘ</span></div>
        <div class="my-recommend-grid">${groups.map((group) => `<article><h4>${esc(icons[group.slot] || "◇")} ${esc(group.slot)}</h4><ol>${group.routines.map((routine) => `<li><button data-open-type="routine" data-code="${esc(routine.code)}">${esc(routine.title)}</button></li>`).join("") || `<li><span>추천 루틴 연결 대기</span></li>`}</ol></article>`).join("")}</div>
        <div class="my-reason-note">💡 ${esc(mySerkanReason())}</div>
      </section>
    `;
  }

  function renderMyRoutineBuilder() {
    const builder = state.mySerkan.builder || defaultMySerkan().builder;
    const selectedCodes = Array.isArray(builder.selectedCodes) ? builder.selectedCodes : [];
    const selectedRoutines = selectedCodes.map((code) => byCode.routines.get(code)).filter(Boolean);
    const candidates = mySerkanBuilderCandidates();
    return `
      <section class="my-card my-builder-card" id="my-routine-builder">
        <div class="my-card-head">
          <div>
            <h3>나만의 루틴 구성</h3>
            <p>SERKAN 루틴을 골라 내 생활에 맞는 루틴 세트로 저장합니다.</p>
          </div>
          <span>${selectedCodes.length}개 선택</span>
        </div>
        <div class="my-builder-shell">
          <div class="my-builder-main">
            <div class="my-builder-filters">
              ${mySerkanBuilderFilters().map((filter) => `<button class="${(builder.filter || "recommended") === filter.key ? "active" : ""}" data-action="set-my-builder-filter" data-filter="${esc(filter.key)}">${esc(filter.label)}</button>`).join("")}
            </div>
            <div class="my-builder-grid">
              ${candidates.map(({ routine, slot }) => {
                const selected = selectedCodes.includes(routine.code);
                return `
                  <button class="my-builder-routine ${selected ? "selected" : ""}" data-action="toggle-my-builder-routine" data-code="${esc(routine.code)}">
                    <span>${selected ? "✓" : "+"}</span>
                    <strong>${esc(routine.title)}</strong>
                    <em>${esc(slot)} · ${esc(categoryName(routine.domain))}</em>
                  </button>
                `;
              }).join("") || `<div class="empty">선택할 수 있는 루틴이 없습니다.</div>`}
            </div>
          </div>
          <aside class="my-builder-summary">
            <label>
              <span>루틴 이름</span>
              <input data-my-builder-title value="${esc(builder.title || "")}" placeholder="예: 출근 전 15분 루틴">
            </label>
            <div class="my-selected-routine-list">
              ${selectedRoutines.map((routine) => `
                <button data-action="toggle-my-builder-routine" data-code="${esc(routine.code)}">
                  <strong>${esc(routine.title)}</strong>
                  <em>${esc(categoryName(routine.domain))} · ${esc(routine.frequency || routine.board)}</em>
                </button>
              `).join("") || `<p>왼쪽에서 루틴을 선택하면 여기에 저장 전 목록이 표시됩니다.</p>`}
            </div>
            <button class="my-save-routine-btn" data-action="save-my-built-routine">MY ROUTINE에 저장</button>
          </aside>
        </div>
      </section>
    `;
  }

  function renderMyProgressSection(summary) {
    return `<section class="my-card my-progress-card">${renderMyProgressRing("오늘 완료율", summary.daily.percent, `${summary.daily.done} / ${summary.daily.total} 완료`)}${renderMyProgressRing("이번 주 완료율", summary.weekly.percent, `${summary.weekly.done} / ${summary.weekly.total} 완료`)}${renderMyProgressRing("이번 달 완료율", summary.monthly.percent, `${summary.monthly.done} / ${summary.monthly.total} 완료`)}</section>`;
  }

  function renderMyProgressRing(label, percent, meta) {
    return `<div class="my-progress-ring" style="--percent:${Math.max(0, Math.min(100, percent || 0))};"><strong>${esc(label)}</strong><div><b>${percent}%</b></div><span>${esc(meta)}</span></div>`;
  }

  function renderMyRoutinePanel() {
    return `
      <section class="my-routine-panel">
        <div class="my-card-head"><h3>MY ROUTINE</h3><button data-action="add-routine" data-board="daily" data-location="기상">+</button></div>
        <div class="my-routine-list">${(state.mySerkan.savedRoutines || []).map((routine) => `<article><span>${esc(categoryVisual[routine.domains?.[0]]?.icon || "◇")}</span><div><strong>${esc(routine.title)}</strong><em>${esc(routine.type)}</em><i style="--value:${routine.progress || 0};"></i></div><b>${routine.progress || 0}%</b></article>`).join("")}</div>
        <button class="my-outline-btn" data-action="show-planned" data-panel="routine-builder">모든 루틴 보기</button>
      </section>
    `;
  }

  function renderMyStreakPanel(summary) {
    return `<section class="my-card my-streak-card"><h3>연속 수행일</h3><strong>🔥 ${summary.streak ? `${summary.streak}일 기록` : "기록 없음"}</strong><p>${summary.streak ? "현재 체크 데이터 기준으로 오늘 수행 기록이 있습니다." : "날짜별 수행 기록이 쌓이면 연속 수행일이 표시됩니다."}</p></section>`;
  }

  function renderMyRecommendedItemPanel(groups) {
    return `
      <section class="my-card my-item-panel">
        <div class="my-card-head"><h3>오늘의 추천 아이템</h3><button data-view="products">더보기 →</button></div>
        <div class="my-item-list">${groups.map((group) => `<button data-open-type="productGroup" data-code="${esc(group.code)}"><span>${esc(categoryVisual[group.domain]?.icon || "◇")}</span><strong>${esc(group.title)}</strong><em>${esc(categoryName(group.domain))} · 제품 ${group.realCount}개</em></button>`).join("") || pendingBox("추천 아이템 연결 대기", "목표에 맞는 실제 제품 그룹이 아직 부족합니다.")}</div>
      </section>
    `;
  }

  function renderMyCalendarAndActivity(summary) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const first = new Date(year, month, 1).getDay();
    const recentAll = [...summary.doneCodes].map((code) => byCode.routines.get(code)).filter(Boolean);
    const recent = recentAll.slice(0, 3);
    return `
      <section class="my-card my-calendar-card">
        <div>
          <div class="my-card-head"><h3>루틴 캘린더</h3><span>${year}년 ${month + 1}월</span></div>
          <div class="my-calendar-grid">${["일", "월", "화", "수", "목", "금", "토"].map((day) => `<b>${day}</b>`).join("")}${Array.from({ length: first }, () => `<i></i>`).join("")}${Array.from({ length: days }, (_, index) => { const day = index + 1; const isToday = day === today.getDate(); const level = isToday && summary.daily.percent >= 70 ? "done" : isToday && summary.daily.percent > 0 ? "partial" : "empty"; return `<span class="${level} ${isToday ? "today" : ""}">${day}</span>`; }).join("")}</div>
          <div class="my-calendar-legend"><span class="done">완료</span><span class="partial">일부 완료</span><span>기록 없음</span></div>
        </div>
        <div>
          <div class="my-card-head">
            <h3>최근 수행 기록</h3>
            <button data-open-type="myActivity" data-code="all">${recentAll.length ? `전체 보기 ${recentAll.length}` : "체크 데이터 기반"}</button>
          </div>
          <div class="my-activity-list">${recent.length ? recent.map((routine) => `<button data-open-type="routine" data-code="${esc(routine.code)}"><strong>${esc(routine.title)}</strong><em>${esc(categoryName(routine.domain))}</em><span>완료</span></button>`).join("") : pendingBox("최근 수행 기록 없음", "Daily / Weekly 보드에서 루틴을 체크하면 여기에 표시됩니다.")}</div>
        </div>
      </section>
    `;
  }

  function renderMyInsightPanel(insights) {
    return `<section class="my-card my-insight-card"><h3>SERKAN 인사이트 <span>체크 기준</span></h3><div class="my-strength-grid"><div><strong>강점</strong>${insights.strong.map((entry) => `<p><span>${esc(categoryName(entry.domain))}</span><b>${entry.percent}%</b><i style="--value:${entry.percent};"></i></p>`).join("")}</div><div><strong>약점</strong>${insights.weak.map((entry) => `<p><span>${esc(categoryName(entry.domain))}</span><b>${entry.percent}%</b><i style="--value:${entry.percent};"></i></p>`).join("")}</div></div><div class="my-insight-note">🌙 ${esc(insights.weak[0] ? `${categoryName(insights.weak[0].domain)} 루틴 수행률이 낮습니다. 다음 추천에 우선 반영합니다.` : "체크 데이터가 쌓이면 약점 분석이 표시됩니다.")}</div></section>`;
  }

  function renderMyWeeklyReport(insights) {
    const best = insights.strong[0];
    const weak = insights.weak[0];
    return `<section class="my-card my-report-card"><div class="my-card-head"><h3>SERKAN 주간 리포트</h3><span>해석 중심</span></div><p><strong>잘한 점</strong><span>${best ? `${categoryName(best.domain)} 루틴을 가장 꾸준히 수행했습니다.` : "아직 충분한 수행 데이터가 없습니다."}</span></p><p><strong>아쉬운 점</strong><span>${weak ? `${categoryName(weak.domain)} 루틴 수행률이 낮습니다.` : "아쉬운 점은 데이터가 쌓이면 표시됩니다."}</span></p><p><strong>다음 주 추천</strong><span>${weak ? `${categoryName(weak.domain)} 관련 루틴을 하나만 추가하세요.` : "Daily 보드에서 작은 루틴부터 체크해보세요."}</span></p></section>`;
  }

  function renderMyBalancePanel(insights) {
    const average = insights.domains.length ? Math.round(insights.domains.reduce((sum, entry) => sum + entry.percent, 0) / insights.domains.length) : 0;
    return `<section class="my-card my-balance-card"><h3>인사이트 요약</h3><div class="my-balance-score"><strong>${average}</strong><span>/ 100</span></div><p>균형 점수는 카테고리별 수행률 평균입니다.</p><button class="my-outline-btn" data-view="dashboard">상세 분석 보기</button></section>`;
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
        <button class="quick-card clickable" data-view="products">🛍️<strong>아이템 &amp; 제품 확인</strong><span>아이템 안의 추천 슬롯과 실제 제품 연결을 봅니다.</span><em>제품 보기 →</em></button>
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
    const drawerClasses = ["detail-drawer"];
    if (type === "dailyLibrary") drawerClasses.push("is-library");
    if (["product", "manual", "item", "itemCategory", "productSlot"].includes(type)) drawerClasses.push("is-rich-detail");
    const drawerClass = drawerClasses.join(" ");
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
    if (type === "addRoutine") return renderAddRoutine(code);
    if (type === "dailyLibrary") return renderDailyLibraryDetail(code);
    if (type === "dailyStreak") return renderDailyStreakDetail();
    if (type === "routineCategory") return renderRoutineCategoryDetail(code);
    if (type === "plannedPanel") return renderPlannedPanel(code);
    if (type === "manual") return renderManualDetail(byCode.manuals.get(code));
    if (type === "item") return renderItemDetail(byCode.items.get(code));
    if (type === "product") return renderProductDetail(byCode.products.get(code));
    if (type === "productSlot") return renderProductSlotDetail(getProductSlotByCode(code));
    if (type === "productGroup") return renderProductGroupDetail(getProductGroupByCode(code));
    if (type === "brand") return renderBrandDetail(getBrandEntryByCode(code));
    if (type === "ingredient") return renderIngredientDetail(getIngredientEntryByCode(code));
    if (type === "productCollection") return renderProductCollectionDetail();
    if (type === "myActivity") return renderMyActivityDetail();
    if (type === "itemCategory") return renderItemCategoryDetail(byCode.categories.get(code));
    if (type === "reclassLog") return renderReclassLog();
    if (type === "editLog") return renderEditLog();
    if (type === "situation") return renderSituationDetail(byCode.situations.get(code));
    if (type === "category") return renderCategoryDetail(byCode.categories.get(code));
    return `<div class="empty">상세 정보를 찾을 수 없습니다.</div>`;
  }

  function detailHeader(kicker, title, code) {
    return `<div class="detail-head"><span>${esc(kicker)}</span><h2>${esc(title)}</h2><code>${esc(code)}</code></div>`;
  }

  function renderMyActivityDetail() {
    const summary = mySerkanCompletionSummary();
    const routines = [...summary.doneCodes].map((code) => byCode.routines.get(code)).filter(Boolean);
    return `
      ${detailHeader("MY SERKAN", "최근 수행 기록 전체 보기", "CHECK-DATA")}
      <p>Daily / Weekly / Monthly / Seasonal 보드에서 체크한 루틴을 모아 보여줍니다.</p>
      <div class="relation-list">
        <h3>체크된 루틴 ${routines.length}개</h3>
        ${routines.map((routine) => relationButton("routine", routine.code, routine.code, `${routine.title} · ${categoryName(routine.domain)}`)).join("") || pendingBox("최근 수행 기록 없음", "루틴 보드에서 체크하면 여기에 표시됩니다.")}
      </div>
    `;
  }

  function renderPlannedPanel(panel) {
    if (panel === "recent") return renderRecentPanel();
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

  function parseAddRoutineCode(code) {
    const [boardType = "weekly", location = ""] = String(code || "weekly:월").split(":");
    const meta = addRoutineBoardMeta[boardType] || addRoutineBoardMeta.weekly;
    return {
      boardType: addRoutineBoardMeta[boardType] ? boardType : "weekly",
      location: meta.options.includes(location) ? location : meta.defaultLocation,
      meta,
    };
  }

  function addRoutineDrawerCode(boardType, location) {
    const meta = addRoutineBoardMeta[boardType] || addRoutineBoardMeta.weekly;
    return `${boardType}:${location || meta.defaultLocation}`;
  }

  function renderAddRoutine(code) {
    const { boardType, location, meta } = parseAddRoutineCode(code);
    return `
      ${detailHeader(meta.kicker, meta.title, `기본 ${meta.locationName}: ${location}`)}
      <p>프로토타입 안에서만 저장되는 사용자 추가 데이터입니다. 저장 후 해당 보드, 검색, 상세 Drawer에 바로 반영됩니다.</p>
      <form class="routine-form" data-action="save-routine">
        <input type="hidden" name="boardType" value="${esc(boardType)}">
        <label>
          <span>루틴 제목</span>
          <input name="title" type="text" placeholder="${boardType === "situation" ? "예: 약속 전 긴장 완화 루틴" : "예: 침구 먼지 털고 환기하기"}" required maxlength="80">
        </label>
        <div class="form-grid">
          <label>
            <span>${esc(meta.locationName)}</span>
            <select name="location">
              ${meta.options.map((option) => `<option value="${esc(option)}" ${option === location ? "selected" : ""}>${esc(option)}</option>`).join("")}
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
            ${["Daily", "Weekly", "1x/Week", "2~3x/Week", "Monthly", "Seasonal", "필요 시"].map((option) => `<option value="${esc(option)}" ${option === meta.defaultFrequency ? "selected" : ""}>${esc(option)}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>짧은 실행 기준</span>
          <textarea name="summary" rows="4" placeholder="${boardType === "situation" ? "예: 약속 30분 전 호흡, 옷매무새, 대화 주제를 1개씩 점검한다." : "예: 토요일 오전에 침구를 털고 창문을 10분 열어둔다."}" maxlength="180"></textarea>
        </label>
        <div class="form-actions">
          <button type="button" class="outline-btn" data-action="close">취소</button>
          <button type="submit" class="primary-btn">저장하기</button>
        </div>
      </form>
    `;
  }

  function renderRecentPanel() {
    const entries = state.recentItems.map(resolveRecentEntry).filter(Boolean);
    const staleCount = state.recentItems.length - entries.length;
    if (staleCount) {
      state.recentItems = entries;
      saveRecentItems();
    }
    return `
      <article class="recent-history-panel">
        <header class="recent-history-head">
          <div>
            <span>Drawer History</span>
            <h2>최근 본 항목</h2>
            <p>최근 열어본 Routine, Manual, Item, Product Slot, Product, Situation을 다시 확인합니다.</p>
          </div>
          <div class="recent-history-actions">
            <strong>전체 ${entries.length}개</strong>
            <button class="outline-btn" data-action="clear-recent" ${entries.length ? "" : "disabled"}>비우기</button>
          </div>
        </header>
        ${entries.length ? `
          <div class="recent-history-list">
            ${entries.map(renderRecentHistoryCard).join("")}
          </div>
        ` : `
          <div class="recent-empty-state">
            <strong>아직 최근 본 항목이 없습니다.</strong>
            <span>루틴, 매뉴얼, 아이템, 제품을 열어보면 여기에 기록됩니다.</span>
          </div>
        `}
      </article>
    `;
  }

  function renderRecentHistoryCard(entry) {
    return `
      <button class="recent-history-card clickable" data-open-type="${esc(entry.type)}" data-code="${esc(entry.code)}">
        <span class="recent-history-icon">${esc(entry.icon || "◦")}</span>
        <span class="recent-history-copy">
          <em>${esc(recentTypeLabel(entry.type))}</em>
          <strong>${esc(entry.title)}</strong>
          <small>${esc(entry.subtitle || entry.code)}</small>
        </span>
        <span class="recent-history-time">${esc(formatRecentTime(entry.openedAt))}</span>
        <span class="recent-history-cta">다시 보기 →</span>
        <span class="recent-delete" data-action="delete-recent" data-recent-type="${esc(entry.type)}" data-code="${esc(entry.code)}" role="button" aria-label="최근 본 항목 삭제">×</span>
      </button>
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
        desc: "자주 보는 루틴, 매뉴얼, 아이템, 제품 슬롯을 모아두는 영역입니다.",
        status: "저장 구조 예정",
        source: "LocalStorage",
        next: "다음 단계에서 카드별 북마크 버튼을 붙이면 바로 활성화할 수 있습니다.",
      },
      recent: {
        title: "최근 본 항목",
        desc: "최근 열어본 Routine, Manual, Item, Product Slot, Situation을 다시 확인하는 영역입니다.",
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
        ${renderLibraryCategoryNav(group, categories)}
        <div class="library-category-list">
          ${categories.map((category) => renderLibraryCategorySection(group, category)).join("") || pendingBox("연결된 루틴 없음", "이 시간대에 연결된 Daily Routine이 아직 없습니다.")}
        </div>
        <div class="library-tip"><strong>TIP</strong><span>루틴 카드를 클릭하면 상세 매뉴얼, 관련 아이템, 관련 제품 그룹으로 이어집니다.</span></div>
      </div>
    `;
  }

  function renderLibraryCategoryNav(group, categories) {
    return `
      <nav class="library-category-tabs" aria-label="${esc(group)} 루틴 카테고리 바로가기">
        ${categories.map((category, index) => renderLibraryCategoryTab(group, category, index === 0)).join("")}
      </nav>
    `;
  }

  function renderLibraryCategoryTab(group, category, active = false) {
    const cat = byCode.categories.get(category.domain);
    return `
      <button class="library-category-tab ${active ? "is-active" : ""}" data-action="scroll-library-category" data-group="${esc(group)}" data-domain="${esc(category.domain)}" style="--cat-tint:${cat?.tint || "#f7f4ef"};--cat-accent:${cat?.accent || "#70757f"};">
        <span>${esc(categoryVisual[category.domain]?.icon || cat?.icon || "◇")}</span>
        <strong>${esc(cat?.name || category.domain)}</strong>
        <em>${category.routines.length}</em>
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
      <section class="library-category-section ${expanded ? "is-expanded" : ""}" data-library-category="${esc(group)}:${esc(category.domain)}" style="--cat-tint:${cat?.tint || "#f7f4ef"};--cat-accent:${cat?.accent || "#70757f"};">
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
    const group = dailyGroupForRoutine(routine);
    const doneKey = `dailyLibrary:${group}:${routine.domain}`;
    const checked = isWeeklyDone(doneKey, routine.code);
    return `
      <div class="library-task-pill clickable ${checked ? "is-done" : ""}" data-open-type="routine" data-code="${esc(routine.code)}">
        <input type="checkbox" ${checked ? "checked" : ""} data-action="toggle-routine-check" data-key="${esc(doneKey)}" data-code="${esc(routine.code)}" aria-label="${esc(routine.title)} 완료">
        <div>
          <strong>${esc(routine.title)}</strong>
          <span>☀ ${esc(group)} · Daily</span>
        </div>
        <em aria-hidden="true">☆</em>
      </div>
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

  function renderDailyStreakDetail() {
    const routines = data.routines.filter((routine) => routine.board === "daily");
    const completed = routines.filter((routine) => isDailyRoutineDone(routine)).length;
    const total = routines.length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    const streak = Math.max(1, Math.min(12, completed || 1));
    const rows = dailyMatrixRows.map((row) => {
      const rowRoutines = routines.filter((routine) => row.sourceGroups.includes(dailyGroupForRoutine(routine)));
      const rowDone = rowRoutines.filter((routine) => isDailyRoutineDone(routine)).length;
      const rowPercent = rowRoutines.length ? Math.round((rowDone / rowRoutines.length) * 100) : 0;
      return { ...row, total: rowRoutines.length, done: rowDone, percent: rowPercent };
    });
    return `
      <article class="daily-streak-detail">
        <div class="detail-head">
          <span>Daily Record</span>
          <h2>연속 실행 기록</h2>
          <code>오늘 기준</code>
        </div>
        <section class="streak-hero-card">
          <div>
            <span>현재 연속 실행</span>
            <strong>${streak}일</strong>
            <em>오늘 ${completed} / ${total}개 완료 · ${percent}%</em>
          </div>
          ${renderDonut(percent, `${completed} / ${total}`)}
        </section>
        <section class="streak-week-card">
          <h3>최근 7일 흐름</h3>
          <div class="streak-week-row">
            ${["월", "화", "수", "목", "금", "토", "일"].map((day, index) => `<span class="${index < Math.min(streak, 7) ? "is-done" : ""}"><b>${esc(day)}</b><i></i></span>`).join("")}
          </div>
        </section>
        <section class="streak-row-card">
          <h3>시간대별 오늘 진행</h3>
          ${rows.map((row) => `
            <button class="streak-progress-row" data-action="open-daily-library" data-group="${esc(row.sourceGroups[0])}">
              <span>${esc(row.icon)}</span>
              <strong>${esc(row.label)}</strong>
              <em>${row.done} / ${row.total}</em>
              <i><b style="width:${row.percent}%;"></b></i>
            </button>
          `).join("")}
        </section>
      </article>
    `;
  }

  function scrollLibraryCategory(group, domain) {
    const target = $$("[data-library-category]").find((section) => section.dataset.libraryCategory === `${group}:${domain}`);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function categoryOrderIndex(domain) {
    const index = commonCategoryOrder.indexOf(domain);
    return index === -1 ? commonCategoryOrder.length : index;
  }

  function categoryIcon(domain) {
    return byCode.categories.get(domain)?.icon || "◇";
  }

  function renderRoutineDetail(routine) {
    if (!routine) return `<div class="empty">루틴을 찾을 수 없습니다.</div>`;
    const manual = getManualForRoutine(routine);
    const items = manual ? getItemsForManual(manual.code) : [];
    const productGroups = getProductGroupsForItems(items, { includeMock: false });
    const timeBlocks = Array.isArray(routine.timeBlocks) ? routine.timeBlocks : [];
    const customActions = routine.isCustom ? `
      <div class="custom-routine-actions">
        <button class="danger-link" data-action="delete-custom-entry" data-code="${esc(routine.code)}">이 사용자 루틴 삭제</button>
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

  function getManualBlock(manual, label) {
    return manual?.blocks?.find((block) => block.label === label);
  }

  function getManualBlockItems(manual, labels) {
    const blocks = manual?.blocks?.filter((block) => labels.includes(block.label)) || [];
    return blocks.flatMap((block) => block.items || []).filter(Boolean);
  }

  function stripStepPrefix(text) {
    return String(text || "").replace(/^\s*\d+\.\s*/, "");
  }

  function cleanArrow(text) {
    return String(text || "").replace(/\s*→\s*$/, "");
  }

  function renderSummaryCard(icon, label, value) {
    return `
      <div class="summary-card">
        <span>${esc(icon)}</span>
        <strong>${esc(label)}</strong>
        <p>${esc(value)}</p>
      </div>
    `;
  }

  function splitKoreanSentences(text, fallback = []) {
    const value = String(text || "").trim();
    if (!value) return fallback;
    const parts = value
      .split(/(?:\.\s+|·|\/|;|\n)/)
      .map((item) => item.trim())
      .filter(Boolean);
    return parts.length > 1 ? parts : [value];
  }

  function getProductFeatureCards(product) {
    const text = `${product.productName || ""} ${product.category || ""} ${(product.tags || []).join(" ")}`.toLowerCase();
    if (Array.isArray(product.featureCards) && product.featureCards.length) return product.featureCards;
    if (text.includes("선크림") || text.includes("spf")) {
      return [
        { icon: "☀️", title: "SPF 루틴", body: "자외선 차단" },
        { icon: "💧", title: "수분감", body: "데일리 사용감" },
        { icon: "🌿", title: "가벼운 마무리", body: "아침 루틴 적합" },
        { icon: "🛡️", title: "피부 부담 체크", body: "눈시림/백탁 확인" },
      ];
    }
    if (text.includes("톤 보정") || text.includes("커버") || text.includes("스틱")) {
      return [
        { icon: "✨", title: "톤 정리", body: "피곤한 인상 완화" },
        { icon: "◐", title: "부분 커버", body: "붉은기/잡티 포인트" },
        { icon: "👔", title: "출근 전", body: "짧은 준비 루틴" },
        { icon: "🧴", title: "묻어남 체크", body: "셔츠/마스크 확인" },
      ];
    }
    if (text.includes("두피") || text.includes("세럼") || text.includes("앰플")) {
      return [
        { icon: "🫧", title: "두피 컨디션", body: "답답함 관리" },
        { icon: "〰", title: "정수리 볼륨", body: "오후 꺼짐 체크" },
        { icon: "💧", title: "흡수감", body: "떡짐 여부 확인" },
        { icon: "🌿", title: "데일리 케어", body: "샴푸 후 루틴" },
      ];
    }
    if (text.includes("바디워시") || text.includes("스킨워시")) {
      return [
        { icon: "🚿", title: "샤워 루틴", body: "땀/피지 세정" },
        { icon: "🫧", title: "세정력", body: "헹굼감 확인" },
        { icon: "🌿", title: "향", body: "호불호 체크" },
        { icon: "💧", title: "건조감", body: "보습 필요 여부" },
      ];
    }
    if (text.includes("수면") || text.includes("슬립") || text.includes("안대")) {
      return [
        { icon: "🌙", title: "빛 차단", body: "취침 전환" },
        { icon: "〰", title: "착용감", body: "압박감 확인" },
        { icon: "⚙️", title: "디바이스", body: "진동 호불호" },
        { icon: "🛏️", title: "수면 루틴", body: "짧게 테스트" },
      ];
    }
    return [
      { icon: "🧴", title: "루틴 적합", body: product.category || "관리 도구" },
      { icon: "☑", title: "사용 기준", body: "매일 반복 가능한지 확인" },
      { icon: "◇", title: "선택 기준", body: product.recommendationType || "데일리" },
      { icon: "↗", title: "구매 전 확인", body: product.productLink && product.productLink !== "#" ? "링크 확인 가능" : "판매처 확인 필요" },
    ];
  }

  function getProductPoints(product) {
    return product.points || getProductFeatureCards(product).map((feature) => `${feature.title} · ${feature.body}`).slice(0, 5);
  }

  function getProductContextTags(product) {
    if (Array.isArray(product.contextTags) && product.contextTags.length) return product.contextTags.slice(0, 8);
    const base = [
      product.recommendationType,
      product.category,
      ...(product.tags || []),
    ].filter(Boolean);
    const blocked = new Set(["검수 필요", "승인", "세르칸핏 높음", "링크 검수 필요", "제품 연결됨", "메이크업", "피부관리", "스타일관리"]);
    return uniq(base).filter((tag) => !blocked.has(tag)).slice(0, 8);
  }

  function getProductTargetList(product) {
    if (Array.isArray(product.targetChecklist)) return product.targetChecklist;
    const list = splitKoreanSentences(product.target, ["이 제품이 필요한 상황이 분명한 사람", "루틴에 맞는 사용감인지 직접 확인하고 싶은 사람"]);
    return list.slice(0, 5);
  }

  function getProductUseRows(product) {
    if (Array.isArray(product.useRows)) return product.useRows;
    const actualUse = product.actualUse || "사용 위치, 향, 자극감, 번거로움을 먼저 확인해야 하는 제품입니다.";
    const text = `${product.productName || ""} ${product.category || ""} ${actualUse}`.toLowerCase();
    const rows = [];
    if (text.includes("선크림") || text.includes("톤") || text.includes("커버")) {
      rows.push(["텍스처", text.includes("스틱") ? "스틱형으로 국소 부위에 사용" : "얇게 펴 바르는 로션형"]);
      rows.push(["흡수감", "빠르게 바르고 경계/묻어남 확인"]);
      rows.push(["마무리감", text.includes("선크림") ? "번들거림과 백탁 여부 체크" : "자연광에서 티남 여부 확인"]);
      rows.push(["지속력", "오전 사용 후 오후 무너짐 확인"]);
    } else if (text.includes("두피")) {
      rows.push(["텍스처", "두피 사이사이에 소량 도포"]);
      rows.push(["흡수감", "떡짐 없이 마르는지 확인"]);
      rows.push(["마무리감", "정수리 볼륨이 무겁지 않은지 체크"]);
      rows.push(["향", "잔향과 두피 자극 여부 확인"]);
    } else if (text.includes("바디워시") || text.includes("스킨워시")) {
      rows.push(["세정력", "땀과 피지 세정감 확인"]);
      rows.push(["헹굼감", "빠르게 헹궈지는지 확인"]);
      rows.push(["마무리감", "샤워 후 당김/건조감 체크"]);
      rows.push(["향", "체취와 섞이지 않는지 확인"]);
    } else if (text.includes("수면") || text.includes("슬립") || text.includes("안대")) {
      rows.push(["착용감", "눈 주변 압박감 확인"]);
      rows.push(["차단감", "빛이 새는지 확인"]);
      rows.push(["편의성", "취침 전 바로 쓰기 쉬운지 확인"]);
      rows.push(["지속력", "잠드는 동안 불편함 여부 체크"]);
    } else {
      rows.push(["사용감", actualUse]);
    }
    return rows.map(([label, value]) => ({ label, value }));
  }

  function getProductCautions(product) {
    if (Array.isArray(product.cautionList)) return product.cautionList;
    return splitKoreanSentences(product.caution, ["처음에는 소량으로 테스트하고, 피부/몸 상태가 불편하면 루틴 빈도를 낮춥니다.", "구매 전 성분, 사이즈, 사용 환경, 판매처를 확인합니다."]).slice(0, 5);
  }

  function renderProductTrustCard(product) {
    const metrics = getProductSerkanMetrics(product).slice(0, 5);
    return `
      <section class="detail-card serkan-eval-card">
        <span class="card-icon soft-blue">☑</span>
        <h3>사용감 검수 상태</h3>
        <strong class="usage-status-title">루틴 맥락 우선 검토</strong>
        <p>${esc(product.category || "이 제품")} 루틴 안에서 반복해서 쓰기 쉬운지, 향·자극·묻어남·번들거림 기준으로 봅니다.</p>
        <div class="metric-list compact">
          ${metrics.map(renderMetricRow).join("")}
        </div>
      </section>
    `;
  }

  function getProductFeatureMetrics(product) {
    if (Array.isArray(product.featureMetrics) && product.featureMetrics.length) return product.featureMetrics;
    const text = normalizeManualFilterText([product.productName, product.category, product.recommendationType, ...(product.tags || [])].join(" "));
    if (text.includes("톤") || text.includes("커버") || text.includes("파운데이션") || text.includes("컨실러") || text.includes("쿠션") || text.includes("비비")) {
      return [
        { label: "톤 보정", level: "강함" },
        { label: "붉은기 커버", level: text.includes("스틱") || text.includes("컨실러") ? "강함" : "보통" },
        { label: "자연스러움", level: text.includes("파운데이션") || text.includes("쿠션") ? "보통" : "강함" },
        { label: "묻어남", level: "보통" },
        { label: "세안 편의성", level: text.includes("스프레이") ? "약함" : "보통" },
        { label: "초보자 적합", level: text.includes("스틱") || text.includes("로션") ? "강함" : "보통" },
      ];
    }
    if (text.includes("선크림") || text.includes("spf")) {
      return [
        { label: "데일리 차단", level: "강함" },
        { label: "백탁", level: "보통" },
        { label: "눈시림", level: "보통" },
        { label: "흡수감", level: "보통" },
        { label: "묻어남", level: "보통" },
        { label: "덧바름 편의성", level: "보통" },
      ];
    }
    if (text.includes("두피") || text.includes("세럼")) {
      return [
        { label: "두피 산뜻함", level: "보통" },
        { label: "볼륨 유지", level: "보통" },
        { label: "흡수감", level: "보통" },
        { label: "향 존재감", level: "보통" },
        { label: "떡짐 리스크", level: "보통" },
        { label: "지속 사용 난이도", level: "보통" },
      ];
    }
    if (text.includes("바디워시") || text.includes("스킨워시")) {
      return [
        { label: "세정력", level: "강함" },
        { label: "헹굼감", level: "강함" },
        { label: "향 존재감", level: "보통" },
        { label: "건조감", level: "보통" },
        { label: "운동 후 적합", level: "강함" },
        { label: "데일리 반복성", level: "강함" },
      ];
    }
    if (text.includes("전해질") || text.includes("hydration") || text.includes("lmnt")) {
      return [
        { label: "수분 보충", level: "강함" },
        { label: "맛 존재감", level: "강함" },
        { label: "당/나트륨 확인", level: "강함" },
        { label: "휴대성", level: "강함" },
        { label: "운동 후 적합", level: "강함" },
        { label: "데일리 반복성", level: "보통" },
      ];
    }
    return [
      { label: "루틴 적합", level: "보통" },
      { label: "반복 사용성", level: "보통" },
      { label: "휴대성", level: "보통" },
      { label: "초보자 적합", level: "보통" },
      { label: "자극 리스크", level: "보통" },
      { label: "구매 전 확인", level: "보통" },
    ];
  }

  function getProductSerkanMetrics(product) {
    if (Array.isArray(product.serkanMetrics) && product.serkanMetrics.length) return product.serkanMetrics;
    const text = normalizeManualFilterText([product.productName, product.category, product.recommendationType, ...(product.tags || [])].join(" "));
    const routineEase = text.includes("디바이스") || text.includes("프리미엄") ? "보통" : "강함";
    const beginner = text.includes("파운데이션") || text.includes("쿠션") || text.includes("컨실러") ? "보통" : "강함";
    return [
      { label: "실행 난이도", level: routineEase },
      { label: "자연스러움", level: text.includes("톤") || text.includes("선크림") ? "강함" : "보통" },
      { label: "반복 사용 가능성", level: routineEase },
      { label: "휴대성", level: text.includes("스틱") || text.includes("스틱형") || text.includes("패치") ? "강함" : "보통" },
      { label: "초보자 추천도", level: beginner },
    ];
  }

  function metricLevelValue(level) {
    if (typeof level === "number") return Math.max(1, Math.min(5, level));
    const normalized = String(level || "").trim();
    if (["강함", "높음", "좋음", "쉬움"].includes(normalized)) return 5;
    if (["보통", "중간", "확인"].includes(normalized)) return 3;
    if (["약함", "낮음", "주의"].includes(normalized)) return 2;
    return 3;
  }

  function renderMetricRow(metric) {
    const value = metricLevelValue(metric.level);
    const cells = Array.from({ length: 5 }, (_, index) => `<i class="${index < value ? "is-filled" : ""}"></i>`).join("");
    return `
      <div class="metric-row">
        <span>${esc(metric.label)}</span>
        <strong>${esc(metric.level || "보통")}</strong>
        <em>${cells}</em>
      </div>
    `;
  }

  function getProductHowToSteps(product) {
    if (Array.isArray(product.howToSteps) && product.howToSteps.length) return product.howToSteps;
    const text = normalizeManualFilterText([product.productName, product.category, product.recommendationType, ...(product.tags || [])].join(" "));
    if (text.includes("톤") || text.includes("커버") || text.includes("파운데이션") || text.includes("컨실러") || text.includes("쿠션") || text.includes("비비")) {
      return [
        "세안 후 보습까지 끝낸 뒤 사용한다.",
        "얼굴 전체보다 붉은기, 수염 자국, 칙칙한 부위부터 소량 바른다.",
        "턱선과 목 경계는 손에 남은 양으로 자연스럽게 연결한다.",
        "외출 전 자연광에서 티 나는 부분과 묻어남을 확인한다.",
      ];
    }
    if (text.includes("선크림") || text.includes("spf")) {
      return [
        "보습이 흡수된 뒤 얼굴과 목까지 나눠 바른다.",
        "눈가와 콧망울은 소량으로 경계를 줄인다.",
        "외출 전 10분 안에 마무리감을 확인한다.",
        "오후에는 번들거림, 눈시림, 마스크 묻어남을 다시 본다.",
      ];
    }
    if (text.includes("두피") || text.includes("세럼")) {
      return [
        "샴푸 후 두피가 마른 상태에서 가르마를 나눈다.",
        "정수리와 헤어라인처럼 신경 쓰이는 부위에 소량 도포한다.",
        "손끝으로 문지르기보다 두피에 가볍게 흡수시킨다.",
        "마른 뒤 볼륨이 죽거나 떡지는지 확인한다.",
      ];
    }
    if (text.includes("바디워시") || text.includes("스킨워시")) {
      return [
        "운동 후나 외출 후 땀이 식기 전에 샤워 루틴으로 넣는다.",
        "목 뒤, 등, 가슴처럼 냄새와 피지가 남기 쉬운 부위를 먼저 씻는다.",
        "향보다 헹굼감과 샤워 후 당김을 기준으로 본다.",
        "건조하면 바디 보습을 같은 루틴에 묶는다.",
      ];
    }
    return [
      "사용 전 필요한 상황을 먼저 정한다.",
      "처음에는 적은 양이나 짧은 시간으로 테스트한다.",
      "사용 후 불편한 감각이 반복되는지 확인한다.",
      "괜찮으면 정해진 루틴 위치에 고정한다.",
    ];
  }

  function getProductSituationTags(product) {
    if (Array.isArray(product.recommendedSituations) && product.recommendedSituations.length) return product.recommendedSituations;
    const tags = getProductContextTags(product);
    const text = normalizeManualFilterText([product.productName, product.category, product.recommendationType, tags.join(" ")].join(" "));
    if (text.includes("톤") || text.includes("커버") || text.includes("파운데이션") || text.includes("컨실러")) {
      return uniq(["출근 전", "미팅 전", "소개팅 전", "촬영 전", "면접 전", "컨디션이 안 좋아 보이는 날", ...tags]).slice(0, 8);
    }
    if (text.includes("선크림")) return uniq(["출근 전", "외출 전", "야외 활동", "운전 전", "점심 외출", ...tags]).slice(0, 8);
    if (text.includes("두피")) return uniq(["샴푸 후", "정수리 볼륨", "두피 열감", "중요한 약속 전", ...tags]).slice(0, 8);
    if (text.includes("바디워시")) return uniq(["운동 후", "퇴근 후", "여름철", "땀 냄새가 신경 쓰이는 날", ...tags]).slice(0, 8);
    return tags.slice(0, 8);
  }

  function getProductAvoidList(product) {
    if (Array.isArray(product.avoidList) && product.avoidList.length) return product.avoidList;
    const text = normalizeManualFilterText([product.productName, product.category, product.recommendationType, ...(product.tags || [])].join(" "));
    if (text.includes("톤") || text.includes("커버") || text.includes("파운데이션") || text.includes("컨실러") || text.includes("쿠션")) {
      return [
        "완전한 피부 커버를 원하는 사람",
        "파운데이션 수준의 효과를 기대하는 사람",
        "목이나 셔츠 묻어남이 크게 신경 쓰이는 사람",
        "색조 제품 사용 자체가 부담스러운 사람",
      ];
    }
    if (text.includes("선크림")) {
      return [
        "끈적임이나 번들거림에 매우 민감한 사람",
        "눈시림이 반복되는 선케어에 예민한 사람",
        "메이크업 위에 바로 덧바를 제품을 찾는 사람",
      ];
    }
    if (text.includes("두피")) {
      return [
        "향이 남는 두피 제품이 부담스러운 사람",
        "두피 트러블이 진행 중이라 자극 기준이 필요한 사람",
        "바른 뒤 모발이 무거워지는 느낌에 예민한 사람",
      ];
    }
    return [
      "사용감 호불호를 확인하지 않고 바로 매일 쓰려는 사람",
      "향, 자극, 묻어남 같은 실사용 변수를 크게 신경 쓰는 사람",
      "현재 루틴에 넣을 위치가 아직 정해지지 않은 사람",
    ];
  }

  function renderProductSourceCard(product) {
    const urls = Array.isArray(product.contentSourceUrls) ? product.contentSourceUrls.filter(Boolean).slice(0, 5) : [];
    return `
      <section class="detail-card product-source-card">
        <span class="card-icon soft-green">↗</span>
        <h3>참고한 리뷰 및 콘텐츠</h3>
        ${urls.length ? `
          <div class="source-link-list">
            ${urls.map((url) => `<a href="${esc(url)}" target="_blank" rel="noreferrer">${esc(readableSourceName(url))} →</a>`).join("")}
          </div>
        ` : `
          <div class="source-chip-list">
            ${["올리브영 후기", "화해 리뷰", "네이버 블로그", "네이버 카페", "디시인사이드", "유튜브 콘텐츠", "브랜드 공식 설명"].map((label) => `<span>${esc(label)}</span>`).join("")}
          </div>
        `}
        <p>후기 원문을 복사하지 않고, 반복적으로 등장하는 사용 경험과 행동 패턴을 SERKAN 문장으로 요약했습니다.</p>
      </section>
    `;
  }

  function getProductLinkSources(product) {
    const urls = uniq([
      product.productLink,
      ...(Array.isArray(product.contentSourceUrls) ? product.contentSourceUrls : []),
    ].filter((url) => url && url !== "#"));
    return urls.slice(0, 5).map((url) => ({ url, label: productSourceLabel(url) }));
  }

  function productSourceLabel(url) {
    const text = String(url || "").toLowerCase();
    if (text.includes("oliveyoung")) return "올리브영";
    if (text.includes("coupang")) return "쿠팡";
    if (text.includes("naver")) return "네이버 브랜드스토어";
    if (text.includes("hwahae")) return "화해";
    if (text.includes("youtube")) return "유튜브";
    if (text.includes("brdy") || text.includes("roundlab") || text.includes("cosrx") || text.includes("waterpik") || text.includes("drinklmnt") || text.includes("liquid-iv") || text.includes("ulos")) return "공식몰";
    return readableSourceName(url);
  }

  function readableSourceName(url) {
    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      return host;
    } catch (error) {
      return "Source";
    }
  }

  function renderManualDetail(manual) {
    if (!manual) return `<div class="empty">매뉴얼을 찾을 수 없습니다.</div>`;
    const items = getItemsForManual(manual.code);
    const productGroups = getProductGroupsForItems(items, { includeMock: false });
    const routine = byCode.routines.get(manual.routineCode) || data.routines.find((entry) => entry.manualCode === manual.code);
    const purpose = getManualBlock(manual, "목적");
    const steps = getManualBlockItems(manual, ["실행 순서", "실행 기준"]);
    const itemHints = getManualBlockItems(manual, ["추천 아이템"]);
    const cautions = getManualBlockItems(manual, ["주의사항"]);
    const timeLabel = manualExecutionTimeLabel(manual, routine);
    const difficulty = routine?.difficulty || "보통";
    const frequency = routine?.frequency || "필요시";
    const tone = manualToneProfile(manual, { routine, items, purposeText: purpose?.text, steps, cautions });
    const whyCopy = tone.why;
    const representativeProducts = productGroups.flatMap((group) => group.allProducts.filter((product) => !isMockProduct(product))).slice(0, 4);
    return `
      <article class="knowledge-detail manual-profile">
        <section class="profile-hero manual-hero-card">
          <div class="profile-hero-copy">
            <span class="eyebrow">Routine Detail Manual</span>
            <h2>${esc(manual.title)}</h2>
            <code>${esc(manual.code)}</code>
            <p>${esc(tone.summary)}</p>
            <div class="profile-meta-grid">
              <span><b>카테고리</b>${esc(manual.category || categoryName(manual.domain))}</span>
              <span><b>도메인</b>${esc(manual.domain || "-")}</span>
              <span><b>주기</b>${esc(frequency)}</span>
              <span><b>실행 시점</b>${esc(timeLabel)}</span>
              <span><b>난이도</b>${esc(difficulty)}</span>
            </div>
          </div>
          <div class="manual-hero-badge">
            <span>${esc(categoryVisual[manual.domain]?.icon || categoryIcon(manual.domain))}</span>
            <strong>${esc(categoryName(manual.domain))}</strong>
            <em>Execution Manual</em>
          </div>
        </section>

        <section class="summary-card-grid">
          ${renderSummaryCard("🎯", "목적", tone.purpose)}
          ${renderSummaryCard("⏱️", "실행 시점", timeLabel)}
          ${renderSummaryCard("⚙️", "난이도", difficulty)}
          ${renderSummaryCard("⚠️", "주의 포인트", tone.cautions[0] || "실행 전 주의사항 확인")}
        </section>

        <section class="detail-card manual-context-card">
          <span class="card-icon soft-yellow">👀</span>
          <h3>이 루틴이 필요한 순간</h3>
          <ul class="check-list">
            ${tone.moments.map((item) => `<li>${esc(item)}</li>`).join("")}
          </ul>
        </section>

        <section class="detail-card manual-why-card">
          <span class="card-icon soft-rose">🎯</span>
          <h3>왜 해야 하는가?</h3>
          <p>${esc(whyCopy)}</p>
        </section>

        <section class="manual-content-grid">
          <div class="detail-card">
            <span class="card-icon soft-blue">☑</span>
            <h3>실행 기준 STEP</h3>
            <div class="step-list">
              ${tone.steps.map((step, index) => `
                <div class="step-card">
                  <span>STEP ${index + 1}</span>
                  <p>${esc(stripStepPrefix(step))}</p>
                </div>
              `).join("")}
            </div>
          </div>
          <div class="detail-card">
            <span class="card-icon soft-green">🧴</span>
            <h3>추천 아이템</h3>
            <div class="manual-item-list">
              ${items.length ? items.map((item) => {
                const groups = getProductGroupsForItem(item.code, { includeMock: true });
                const slots = groups.flatMap(getItemProductSlots).slice(0, 6);
                const realCount = groups.reduce((sum, group) => sum + group.realCount, 0);
                return `
                  <button class="manual-item-card" data-open-type="item" data-code="${esc(item.code)}">
                    <strong>${esc(item.name)}</strong>
                    <span>${esc(item.role || "이 매뉴얼 실행에 필요한 아이템")}</span>
                    <em>연결 제품 ${realCount}개</em>
                    <div class="tag-row">${slots.map((slot) => `<i class="tag">${esc(slot.label || slot.id)}</i>`).join("")}</div>
                  </button>
                `;
              }).join("") : `<div class="pill-cloud">${(itemHints.length ? itemHints : ["추천 아이템 연결 대기"]).map((item) => `<span>${esc(cleanArrow(item))}</span>`).join("")}</div>`}
            </div>
          </div>
          <div class="detail-card manual-product-card">
            <span class="card-icon soft-yellow">🛍️</span>
            <h3>추천 제품</h3>
            <div class="manual-product-list">
              ${representativeProducts.length ? representativeProducts.map((product) => `
                <button class="manual-product-mini" data-open-type="product" data-code="${esc(product.code)}">
                  <span>${renderProductImage(product)}</span>
                  <strong>${esc(product.brand || "Brand")} · ${esc(product.productName)}</strong>
                  <em>${esc(product.recommendationType || "추천 슬롯")}</em>
                </button>
              `).join("") : pendingBox("추천 제품 연결 대기", "제품 슬롯에 실제 제품이 연결되면 여기에 표시됩니다.")}
            </div>
          </div>
          <div class="detail-card warning-card">
            <span class="card-icon soft-yellow">⚠️</span>
            <h3>주의사항</h3>
            <ul class="check-list caution-list">
              ${tone.cautions.map((item) => `<li>${esc(item)}</li>`).join("")}
            </ul>
          </div>
          <div class="detail-card">
            <span class="card-icon soft-rose">↯</span>
            <h3>자주 실패하는 패턴</h3>
            <ul class="check-list caution-list">
              ${tone.failures.map((item) => `<li>${esc(item)}</li>`).join("")}
            </ul>
          </div>
        </section>

        <section class="detail-card relation-cta-panel">
          <h3>연결된 항목</h3>
          <div class="relation-cta-grid">
            ${items.length ? items.map((item) => relationButton("item", item.code, "관련 아이템", item.name)).join("") : pendingBox("관련 아이템 연결 대기", "이 매뉴얼에 맞는 아이템을 연결합니다.")}
            ${productGroups.length ? productGroups.map((group) => relationButton("productGroup", group.code, "추천 제품 슬롯", group.title)).join("") : pendingBox("추천 제품 연결 대기", "실제 제품이 연결되면 여기에 표시됩니다.")}
            ${routine ? relationButton("routine", routine.code, "관련 루틴", routine.title) : pendingBox("관련 루틴 연결 대기", "이 매뉴얼을 실행하는 루틴을 연결합니다.")}
          </div>
        </section>
      </article>
    `;
  }

  function manualExecutionTimeLabel(manual, routine) {
    const direct = cleanExecutionTimeLabel(routine?.timeBlocks?.join(", ")) || cleanExecutionTimeLabel(routine?.flowGroup);
    if (direct) return direct;
    return inferManualExecutionTime(manual, routine);
  }

  function cleanExecutionTimeLabel(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    if (/^(불명확|비정기|추가|undefined|null|-|실행 시점 확인)$/i.test(text)) return "";
    return text;
  }

  function inferManualExecutionTime(manual, routine) {
    const text = `${manual?.title || ""} ${manual?.summary || ""} ${(manual?.tags || []).join(" ")} ${routine?.title || ""} ${(routine?.tags || []).join(" ")}`;
    if (/가르마|모근|헤어라인/.test(text)) return "샴푸 후 드라이 전 / 주 1회";
    if (/선크림|자외선|SPF/.test(text)) return "아침 스킨케어 후 / 외출 전";
    if (/두피|세럼|정수리/.test(text)) return "샴푸 후 두피가 마른 뒤";
    if (/면도|쉐이빙|애프터쉐이브/.test(text)) return "면도 직후";
    if (/워터픽|가글|구강|입안/.test(text)) return "식후 / 외출 전";
    if (/치과/.test(text)) return "6~12개월 정기 점검";
    if (/체취|데오/.test(text)) return "샤워 후 / 외출 전";
    if (/운동용품 세탁/.test(text)) return "운동 후 세탁 전";
    if (/수건|베개|커버|침구/.test(text)) return "세탁일 / 교체일";
    if (/트러블|여드름|진정/.test(text)) return "세안 후 / 자극이 올라온 날";
    if (/상처 초기|상처 후|상처 회복|반창고/.test(text)) return "상처 확인 직후";
    if (/스쿠알란|비타민C|정량 도포|바세린|보습|관찰/.test(text)) return "세안 후 보습 단계";
    if (/뒷목|아이스팩|마사지|스트레칭|마사지볼|혈점|목 운동/.test(text)) return "오후 리셋 / 운동 후";
    if (/격투기|훈련|스파링/.test(text)) return "운동 전후";
    if (/전해질/.test(text)) return "운동 후 / 땀 많이 흘린 날";
    if (/혼술/.test(text)) return "퇴근 후";
    if (/다이어트|식품|유지방|장내|기름|염증/.test(text)) return "식사 전후";
    if (/가습기|습도|취침 환경/.test(text)) return "취침 30분 전";
    if (/수면 데이터/.test(text)) return "기상 직후";
    if (/아침 햇빛|햇빛 노출/.test(text)) return "기상 후 30분 이내";
    if (/수면|취침|나이트|불면/.test(text)) return "취침 전";
    if (/디지털 디톡스|휴대폰 없는|감정|손글씨|정각 스트레칭|트리거 향|주인의식/.test(text)) return "집중이 흐트러질 때";
    if (/인사|시선|비판|불평|관계|거절|칭찬|대답|메뉴|연민|책임/.test(text)) return "대화 전후 / 관계 상황 발생 시";
    if (/조명|시각 자극|발코니|공간/.test(text)) return "퇴근 후 / 휴식 전";
    if (/체모 흔적/.test(text)) return "샤워 후 / 청소 전";
    if (/립밤|눈썹|코털|착장|향수|손톱|바디그루밍/.test(text)) return "외출 전";
    if (/컷트/.test(text)) return "월 1회 캘린더 점검";
    if (/시간의 가치|프롬프트|독서|챌린지|로드맵|AI 맞춤/.test(text)) return "주간 회고 / 계획 시간";
    if (/YES|거절당하기/.test(text)) return "상황 발생 시";
    if (routine?.board === "weekly") return "주 1회 점검";
    if (routine?.board === "monthly" || routine?.frequency === "Monthly") return "월 1회 점검";
    if (routine?.board === "periodic" || /Quarterly|Annually/.test(routine?.frequency || "")) return "정기 점검일";
    return "상황에 따라 실행";
  }

  function manualToneProfile(manual, context = {}) {
    const title = `${manual?.title || ""} ${manual?.summary || ""}`;
    const specific = specificManualTone(manual, context);
    if (specific) return specific;
    const domainTone = domainManualTone(manual?.domain);
    const cleanSummary = usefulManualText(manual?.summary, domainTone.summary);
    const cleanPurpose = usefulManualText(context.purposeText, domainTone.purpose);
    const normalizedSteps = (context.steps || []).map(stripStepPrefix).filter(Boolean);
    const fallbackStep = shouldUseStoredManualSteps(normalizedSteps) ? normalizedSteps : domainTone.steps;
    const fallbackCautions = context.cautions?.length && !context.cautions.some(isGeneratedManualText) ? context.cautions : domainTone.cautions;
    return {
      summary: cleanSummary,
      purpose: cleanPurpose,
      why: manualWhyCopy(manual, cleanPurpose),
      moments: domainTone.moments,
      steps: fallbackStep,
      cautions: fallbackCautions,
      failures: domainTone.failures,
    };
  }

  function createManualTone(profile) {
    return {
      summary: profile.summary,
      purpose: profile.purpose,
      why: profile.why,
      moments: profile.moments || [],
      steps: profile.steps || [],
      cautions: profile.cautions || [],
      failures: profile.failures || [],
    };
  }

  function shouldUseStoredManualSteps(steps = []) {
    if (!steps.length) return false;
    if (steps.some(isGeneratedManualText)) return false;
    if (steps.length === 1 && isWeakManualStep(steps[0])) return false;
    return steps.some((step) => String(step).length >= 18);
  }

  function isWeakManualStep(step = "") {
    const text = String(step).trim();
    if (!text) return true;
    if (text.length < 18) return true;
    return /^(매일|주기적으로|정기적으로)?\s*.+(하기|관리하기|바꾸기|확인하기|챙기기|줄이기)$/.test(text);
  }

  function specificManualTone(manual, context = {}) {
    const title = `${manual?.title || ""} ${manual?.summary || ""}`;
    if (/워터픽|가글|구강|치과|입안/.test(title)) {
      return createManualTone({
        summary: "양치만으로 놓치기 쉬운 잇몸 라인, 입안 건조, 점심 이후 텁텁함을 줄이는 구강 관리 루틴입니다.",
        purpose: "입냄새를 향이나 껌으로 덮기보다, 음식물이 남는 지점과 입안 건조를 줄여 가까운 거리에서도 부담 없는 상태를 만드는 것이 목표입니다.",
        why: "구강 관리는 아침 양치 한 번으로 끝나지 않는 경우가 많습니다. 커피를 마신 뒤 입안이 마르거나 점심 이후 텁텁함이 올라오면 말할 때 자신감이 떨어질 수 있습니다. 이 매뉴얼은 양치, 물, 가글, 워터픽을 상황에 맞게 나눠 쓰는 기준을 잡습니다.",
        moments: ["커피를 마신 뒤 입안이 마르고 말할 때 신경 쓰일 때", "점심 이후 양치를 했는데도 잇몸 라인이나 어금니 쪽이 찝찝할 때", "가글을 자주 쓰지만 입안이 더 건조해지는 느낌이 있을 때"],
        steps: ["양치 전후로 물을 먼저 마셔 입안을 적시고 건조감을 낮춘다.", "워터픽이나 치실은 잇몸 라인과 어금니 사이처럼 음식물이 남는 부위만 짧게 확인한다.", "가글은 알코올 강한 제품을 습관처럼 쓰기보다 외출 전, 미팅 전처럼 필요한 상황에만 제한한다."],
        cautions: ["잇몸이 쉽게 피가 나면 강한 수압이나 반복 사용을 줄인다.", "가글을 자주 쓰는데 입안이 더 마르면 제품 종류와 빈도를 조정한다.", "통증, 붓기, 피가 반복되면 루틴으로 버티지 말고 치과 점검 기준을 둔다."],
        failures: ["입냄새가 걱정될 때 향이 강한 가글만 반복한다.", "워터픽 수압을 세게 올리면 더 깨끗해질 거라고 생각한다.", "커피와 물 비율은 그대로 두고 구강 제품만 추가한다."],
      });
    }
    if (/면도|쉐이빙|애프터쉐이브/.test(title)) {
      return createManualTone({
        summary: "면도 전 예열, 날 압력, 면도 후 진정을 묶어 붉어짐과 따가움을 줄이는 그루밍 루틴입니다.",
        purpose: "깔끔하게 미는 것보다 면도 후 피부가 따갑거나 빨개지는 시간을 줄여 다음날에도 반복 가능한 면도 기준을 만드는 것이 목표입니다.",
        why: "면도 자극은 제품 하나보다 준비 부족, 무딘 날, 같은 부위 반복 면도, 면도 직후 손과 휴대폰 접촉이 겹칠 때 커집니다. 이 매뉴얼은 수염을 없애는 기술보다 피부가 버틸 수 있는 순서를 만드는 데 집중합니다.",
        moments: ["면도 후 턱과 목이 빨개지거나 따가울 때", "면도 직후 무심코 휴대폰을 만지고 얼굴을 만지는 습관이 있을 때", "깔끔하게 밀려고 같은 부위를 여러 번 지나갈 때"],
        steps: ["미온수나 젖은 수건으로 수염을 먼저 부드럽게 만든다.", "날은 가볍게 지나가고 같은 부위는 최대한 반복하지 않는다.", "면도 직후 찬물로 진정하고, 휴대폰이나 손이 닿기 전에 보습/진정 제품을 얇게 바른다."],
        cautions: ["날이 무뎌졌는데 힘으로 누르면 트러블과 상처가 늘 수 있다.", "알코올감이 강한 제품은 따가움이 심한 날 피한다.", "목 부위는 수염 방향이 달라서 얼굴과 같은 압력으로 밀지 않는다."],
        failures: ["급할수록 물만 묻히고 바로 민다.", "깨끗하게 하려고 같은 부위를 계속 반복한다.", "면도 후 바로 휴대폰을 만지고 턱을 만진다."],
      });
    }
    if (/체취|데오|땀|운동용품 세탁|세정/.test(title)) {
      return createManualTone({
        summary: "땀, 체취, 운동복 눅눅함을 향으로 덮기 전에 세정과 건조 기준부터 잡는 위생 루틴입니다.",
        purpose: "냄새를 없애려고 향을 더하는 것이 아니라, 냄새가 생기는 부위와 옷, 운동용품의 습기를 줄이는 것이 목표입니다.",
        why: "체취는 향수나 바디스프레이를 더한다고 깔끔해지는 문제가 아닐 때가 많습니다. 땀난 부위가 덜 마른 상태, 운동복 재사용, 겨드랑이와 목 뒤 세정 부족이 겹치면 향과 냄새가 섞여 더 신경 쓰일 수 있습니다.",
        moments: ["점심 이후 겨드랑이, 목 뒤, 가슴 쪽 냄새가 신경 쓰일 때", "운동복이나 수건에서 세탁 후에도 눅눅한 냄새가 남을 때", "향수를 뿌렸는데 시간이 지나면 냄새가 섞이는 느낌이 있을 때"],
        steps: ["땀이 많은 부위를 먼저 씻거나 닦고 완전히 말린다.", "데오 제품은 젖은 피부가 아니라 마른 피부에 얇게 사용한다.", "운동복, 수건, 모자는 사용 후 바로 말리거나 세탁 루틴으로 넘긴다."],
        cautions: ["향이 강한 제품은 체취와 섞이면 더 답답하게 느껴질 수 있다.", "피부가 따갑거나 가려우면 데오 제품 사용 빈도와 부위를 줄인다.", "운동용품 냄새는 몸 냄새와 별개로 세탁/건조 루틴이 필요하다."],
        failures: ["샤워나 건조 없이 향수로 바로 덮는다.", "운동복을 말리지 않은 채 가방에 넣어둔다.", "데오 제품을 많이 바르면 오래 갈 거라고 생각한다."],
      });
    }
    if (/수건|베개|커버|침구|세정용품/.test(title)) {
      return createManualTone({
        summary: "얼굴과 머리에 반복해서 닿는 수건, 베개, 세정용품을 깨끗한 접촉면으로 유지하는 위생 루틴입니다.",
        purpose: "피부와 두피에 바르는 제품을 늘리기보다, 매일 닿는 물건에서 오는 자극과 오염을 줄이는 것이 목표입니다.",
        why: "피부나 두피 문제가 반복될 때 제품만 바꾸기 쉽지만, 실제로는 수건, 베개 커버, 샤워용품처럼 매일 닿는 물건이 원인이 되는 경우도 많습니다. 이 매뉴얼은 접촉면을 루틴 안으로 끌어와 관리 기준을 만듭니다.",
        moments: ["세안과 보습은 하는데 같은 부위 트러블이 반복될 때", "베개나 수건에서 냄새가 나거나 눅눅함이 남아 있을 때", "운동, 여행, 외박 후 개인 세정용품이 뒤섞일 때"],
        steps: ["얼굴용 수건과 몸/머리용 수건을 가능하면 분리한다.", "베개 커버와 수건은 교체 요일을 정해 생각 없이 바꿀 수 있게 한다.", "외출/운동 가방에는 작은 세정용품과 건조 가능한 파우치를 따로 둔다."],
        cautions: ["젖은 수건을 욕실에 오래 두면 냄새와 자극 원인이 될 수 있다.", "세제 향이 강하면 피부가 예민한 날 거슬릴 수 있다.", "한 번에 모든 침구를 바꾸려 하지 말고 얼굴에 닿는 것부터 시작한다."],
        failures: ["피부 제품만 바꾸고 수건과 베개는 그대로 둔다.", "젖은 수건을 여러 번 재사용한다.", "여행용 세정용품을 섞어 쓰다 관리 기준이 흐려진다."],
      });
    }
    if (/가르마|정수리|모근|헤어라인/.test(title)) {
      return {
        summary: "샴푸 후 머리가 마르기 전에 모근 방향을 한 번 리셋해 정수리 눌림과 한쪽으로 굳은 인상을 줄이는 헤어 루틴입니다.",
        purpose: "가르마를 크게 바꾸는 것이 아니라, 늘 같은 방향으로 누워 있는 모근을 주 1회 정도 깨워 정수리 볼륨과 얼굴 인상이 한쪽으로 굳지 않게 만드는 것이 목표입니다.",
        why: "가르마가 늘 같은 방향으로 고정되면 머리를 감아도 정수리 라인이 쉽게 눌리고, 오후가 되면 앞머리와 옆머리가 한쪽으로 무너지는 경우가 많습니다. 이 루틴은 왁스나 스프레이로 덮기 전에 샴푸 후 드라이 단계에서 모근 방향을 먼저 풀어주는 기준을 잡습니다.",
        moments: [
          "아침에 드라이를 해도 점심쯤 정수리가 납작해 보일 때",
          "사진에서 가르마 라인이 유독 비어 보이거나 한쪽으로만 갈라질 때",
          "앞머리와 옆머리가 같은 방향으로 눌려 얼굴 인상이 답답해 보일 때",
        ],
        steps: [
          "샴푸 후 머리가 70~80% 마른 상태에서 시작한다. 완전히 마른 뒤 억지로 넘기면 모근 방향이 잘 잡히지 않는다.",
          "평소 가르마 반대 방향으로 손가락이나 빗을 넣고, 드라이어 바람을 뿌리 쪽에 10~15초씩 짧게 준다.",
          "최종 가르마는 원래 방향으로 돌려도 된다. 목표는 스타일을 완전히 바꾸는 것이 아니라 눌린 모근 방향을 풀어주는 것이다.",
        ],
        cautions: [
          "두피가 예민하거나 열감이 있는 날은 뜨거운 바람을 오래 대지 않는다.",
          "탈모처럼 보이는 부위가 신경 쓰이면 가르마 변경보다 두피 컨디션과 헤어라인 자극을 먼저 확인한다.",
          "스타일링 제품으로 눌림을 덮기 전에 드라이 방향과 건조 타이밍부터 맞춘다.",
        ],
        failures: [
          "머리가 완전히 마른 뒤 손으로만 억지로 넘긴다.",
          "가르마를 매일 크게 바꿔 스타일이 오히려 불안정해진다.",
          "왁스나 스프레이를 먼저 바르고 모근 방향은 그대로 둔다.",
        ],
      };
    }
    if (/선크림|자외선|SPF/.test(title)) {
      return {
        summary: "아침 루틴에서 얼굴과 목까지 자외선 차단제를 빠뜨리지 않고 바르기 위한 데일리 방어 루틴입니다.",
        purpose: "선크림을 많이 바르는 것보다, 번들거림과 백탁 때문에 빠지는 날을 줄여 매일 이어지는 기준을 만드는 것이 목표입니다.",
        why: manualWhyCopy(manual),
        moments: [
          "출근 준비가 급해서 선크림을 자주 건너뛸 때",
          "눈시림이나 백탁 때문에 바르고 나서 바로 후회할 때",
          "목과 귀 주변은 늘 빼먹고 얼굴 중앙만 바르게 될 때",
        ],
        steps: [
          "보습이 어느 정도 흡수된 뒤 얼굴, 목, 귀 앞쪽까지 나눠 바른다.",
          "콧등, 광대, 턱선처럼 햇빛을 많이 받는 부위를 한 번 더 확인한다.",
          "외출 시간이 길면 작은 용량을 챙겨 점심 이후 덧바를 기준을 둔다.",
        ],
        cautions: [
          "눈시림, 백탁, 번들거림은 제품별 차이가 커서 실사용감 기준으로 고른다.",
          "트러블이 늘면 선크림만 탓하지 말고 세안과 보습 루틴도 같이 본다.",
          "처음부터 많은 양을 한 번에 올리기보다 얇게 나눠 바르는 쪽이 지속하기 쉽다.",
        ],
        failures: [
          "손등에만 짜놓고 얼굴 중앙에 대충 문지른다.",
          "목과 귀 주변을 빼먹어 얼굴과 목 톤 차이가 난다.",
          "끈적임이 싫어 아예 안 바르는 날이 반복된다.",
        ],
      };
    }
    if (/두피|세럼|정수리/.test(title)) {
      return {
        summary: "샴푸 후 두피가 답답하거나 오후에 정수리 볼륨이 무너지는 날을 줄이기 위한 두피 컨디션 루틴입니다.",
        purpose: "헤어 스타일링을 더 강하게 하기 전에 두피 열감, 가려움, 눌림을 먼저 정리해 스타일이 버틸 수 있는 바탕을 만드는 것이 목표입니다.",
        why: manualWhyCopy(manual),
        moments: [
          "샴푸 직후는 괜찮은데 저녁이 되면 두피가 답답할 때",
          "정수리 볼륨이 빨리 꺼져 머리가 전체적으로 축 처져 보일 때",
          "두피가 건조하거나 간지러워 손이 자꾸 올라갈 때",
        ],
        steps: [
          "샴푸 후 두피를 충분히 말려 물기가 남지 않게 한다.",
          "정수리, 가르마 라인처럼 답답한 부위에 필요한 제품을 소량만 나눠 사용한다.",
          "손톱으로 문지르지 말고 손끝으로 가볍게 눌러 흡수시킨 뒤 스타일링한다.",
        ],
        cautions: [
          "두피가 젖은 상태에서 많이 바르면 오히려 답답함이 커질 수 있다.",
          "가려움이나 붉어짐이 심하면 제품보다 샴푸, 건조, 베개 위생부터 확인한다.",
          "볼륨 제품과 두피 세럼을 동시에 많이 쓰면 뿌리가 더 무거워질 수 있다.",
        ],
        failures: [
          "두피가 덜 마른 상태에서 제품을 여러 번 덧바른다.",
          "정수리 볼륨 문제를 왁스나 스프레이로만 해결하려 한다.",
          "가려운 부위를 손톱으로 긁어 자극을 키운다.",
        ],
      };
    }
    if (/트러블|여드름|진정|상처/.test(title)) {
      return {
        summary: "피부가 예민한 날 손이 자주 가는 행동과 불필요한 자극을 줄여 회복 흐름을 만드는 루틴입니다.",
        purpose: "강한 제품으로 한 번에 해결하려 하기보다, 건드림과 마찰을 줄이고 회복에 방해되는 행동을 끊는 것이 목표입니다.",
        why: manualWhyCopy(manual),
        moments: [
          "거울 볼 때마다 같은 부위를 만지거나 짜고 싶을 때",
          "마스크, 면도, 땀 이후 특정 부위가 반복해서 올라올 때",
          "새 제품을 여러 개 바꾸며 원인을 더 헷갈리게 만들 때",
        ],
        steps: [
          "문제 부위를 손으로 확인하기 전에 손을 씻고 거울 앞 체류 시간을 줄인다.",
          "세안, 보습, 진정처럼 최소 루틴만 남기고 새 제품 추가를 멈춘다.",
          "같은 위치가 반복되면 면도 방향, 마스크 마찰, 베개와 수건 위생을 같이 확인한다.",
        ],
        cautions: [
          "따갑거나 붉은 날은 각질 제거, 고함량 활성 성분, 강한 세안을 줄인다.",
          "트러블을 짜는 순간보다 이후 손, 패치, 세안 방식이 더 중요할 수 있다.",
          "악화가 빠르거나 통증이 있으면 루틴으로 버티지 말고 진료 기준을 둔다.",
        ],
        failures: [
          "원인을 찾겠다며 하루에 여러 제품을 동시에 바꾼다.",
          "진정 제품을 많이 바르면 빨리 가라앉을 거라고 생각한다.",
          "베개, 수건, 면도기 같은 접촉면은 그대로 둔다.",
        ],
      };
    }
    if (/스쿠알란|비타민C|정량 도포|바세린|보습|관찰/.test(title)) {
      return createManualTone({
        summary: "피부가 건조하거나 예민한 날 제품을 많이 얹기보다 필요한 양과 부위를 정해 안정적으로 바르는 루틴입니다.",
        purpose: "좋은 성분을 많이 쓰는 것보다 피부가 받아들일 수 있는 양, 순서, 빈도를 정해 자극 없이 반복하는 것이 목표입니다.",
        why: "피부가 불안정할 때는 제품을 하나 더 추가하고 싶어지지만, 실제로는 양이 많거나 바르는 순서가 흔들려 더 답답해질 때가 있습니다. 이 매뉴얼은 제품 효과를 과장하기보다 오늘 피부가 버틸 수 있는 도포 기준을 잡습니다.",
        moments: ["피부가 건조해서 여러 제품을 겹겹이 바르고 싶을 때", "새 성분을 썼는데 따가움과 붉어짐이 애매하게 올라올 때", "어느 부위가 좋아졌는지 나빠졌는지 기억이 잘 안 날 때"],
        steps: ["얼굴 전체가 아니라 필요한 부위와 양을 먼저 정한다.", "새 제품이나 고함량 성분은 빈도와 부위를 좁혀 반응을 본다.", "다음날 당김, 붉어짐, 번들거림 중 하나만 기록해 조정 기준을 만든다."],
        cautions: ["따가움이 있는 날은 고함량 성분보다 보습과 장벽 회복을 우선한다.", "바세린처럼 막을 만드는 제품은 얇게 쓰고 답답한 부위는 피한다.", "제품 효과를 하루 단위로 판단하지 말고 반복 반응을 본다."],
        failures: ["피부가 안 좋을수록 제품을 더 많이 얹는다.", "새 제품을 여러 개 동시에 시작한다.", "좋아진 날과 나빠진 날의 기준을 기록하지 않는다."],
      });
    }
    if (/목|뒷목|아이스팩|마사지|스트레칭|마사지볼|혈점/.test(title)) {
      return createManualTone({
        summary: "목, 어깨, 얼굴 주변의 긴장과 열감을 짧게 풀어 다음 활동으로 넘어가기 위한 회복 루틴입니다.",
        purpose: "통증을 한 번에 없애려 하기보다 오래 앉아 있거나 화면을 본 뒤 굳는 부위를 짧게 리셋하는 것이 목표입니다.",
        why: "목과 어깨가 굳은 상태로 계속 일하면 자세가 무너지고 얼굴 표정까지 딱딱해질 수 있습니다. 이 매뉴얼은 운동처럼 크게 시간을 내기보다, 하루 중 굳는 순간에 짧게 풀어주는 기준을 만듭니다.",
        moments: ["오후가 되면 뒷목이 뜨겁거나 묵직해질 때", "화면을 오래 보고 나서 턱과 어깨가 같이 굳을 때", "운동 후 특정 부위만 계속 뻐근하게 남을 때"],
        steps: ["통증이 아니라 긴장감이 있는 부위만 먼저 확인한다.", "냉찜질, 마사지볼, 스트레칭 중 하나만 골라 3~5분 짧게 적용한다.", "끝난 뒤 목을 세게 돌리지 말고 자세와 화면 높이를 같이 조정한다."],
        cautions: ["저림이나 날카로운 통증이 있으면 강한 마사지로 버티지 않는다.", "냉찜질은 피부에 직접 오래 대지 않는다.", "시원함만 쫓아 강도를 올리면 다음날 더 뻐근할 수 있다."],
        failures: ["아픈 부위를 오래 세게 누르면 빨리 풀릴 거라고 생각한다.", "목을 크게 돌리며 소리 내는 습관으로 리셋한다.", "자세와 화면 높이는 그대로 두고 찜질만 반복한다."],
      });
    }
    if (/반창고|귀 물기|햇빛|영양제|챌린지|신체나이/.test(title)) {
      return createManualTone({
        summary: "작지만 자주 놓치는 몸 관리 기준을 미리 준비해 상황이 생겼을 때 바로 대응하는 바디 루틴입니다.",
        purpose: "문제가 커진 뒤 해결하는 것이 아니라, 자주 생기는 작은 불편을 미리 대비해 관리 흐름이 끊기지 않게 하는 것이 목표입니다.",
        why: "반창고, 귀 물기 제거, 햇빛 노출, 영양제처럼 작은 루틴은 사소해 보여도 빠지면 하루 컨디션에 영향을 줍니다. 이 매뉴얼은 준비물을 갖추고 실행 시점을 정해 작은 불편이 누적되지 않게 합니다.",
        moments: ["작은 상처나 물집이 생겼는데 챙겨둔 도구가 없을 때", "샤워나 수영 후 귀에 물기가 남아 하루 종일 신경 쓰일 때", "영양제나 햇빛 노출을 생각날 때만 하게 될 때"],
        steps: ["상황이 생겼을 때 필요한 도구를 한 곳에 묶어둔다.", "실행 시점은 아침, 샤워 후, 운동 후처럼 이미 있는 행동 뒤에 붙인다.", "일주일에 한 번 빠진 도구와 반복 여부를 점검한다."],
        cautions: ["상처나 통증이 커지는 상황은 셀프 루틴으로 오래 끌지 않는다.", "영양제는 식사와 수면을 대신하지 않는다.", "햇빛 노출은 시간대와 피부 반응을 같이 확인한다."],
        failures: ["필요할 때마다 새로 찾다가 루틴이 끊긴다.", "도구는 샀지만 어디에 뒀는지 모른다.", "몸 상태와 상관없이 같은 강도로 반복한다."],
      });
    }
    if (/격투기|훈련|스파링|운동 훈련/.test(title)) {
      return createManualTone({
        summary: "운동을 강하게 몰아붙이기보다 기술, 호흡, 회복 기준을 함께 관리해 오래 지속하기 위한 훈련 루틴입니다.",
        purpose: "잘하고 싶은 마음으로 무리하기보다 부상 없이 반복할 수 있는 강도와 회복 기준을 만드는 것이 목표입니다.",
        why: "격투기나 고강도 훈련은 의욕이 앞서면 자세가 무너지고, 작은 통증을 참고 넘기기 쉽습니다. 이 매뉴얼은 많이 하는 것보다 오늘 몸이 버틸 수 있는 강도, 기술 집중점, 회복 신호를 같이 보는 기준을 만듭니다.",
        moments: ["운동 후 목, 어깨, 손목, 무릎 중 한 부위가 계속 남아 있을 때", "실력이 빨리 늘고 싶어 매번 강도를 올리고 싶을 때", "훈련 후 회복이 늦어 다음 루틴까지 밀릴 때"],
        steps: ["오늘 훈련의 목표를 하나만 정한다. 체력, 기술, 반응 중 하나면 충분하다.", "준비운동과 마무리 회복 시간을 훈련 시간 안에 포함한다.", "끝난 뒤 통증 부위, 호흡 회복, 수면 영향을 짧게 기록한다."],
        cautions: ["통증을 실력 향상의 증거처럼 착각하지 않는다.", "스파링 강도를 올리는 날은 다른 운동 루틴을 줄인다.", "손목, 목, 무릎 통증이 반복되면 자세와 장비를 먼저 점검한다."],
        failures: ["기술보다 힘으로 버티며 훈련한다.", "회복이 안 된 날에도 같은 강도로 밀어붙인다.", "훈련 후 스트레칭과 수면을 루틴 밖으로 둔다."],
      });
    }
    if (/가습기|습도|아침 햇빛|수면 데이터|취침 전|수면 우선/.test(title)) {
      return createManualTone({
        summary: "수면의 질을 의지로 해결하기보다 빛, 습도, 데이터, 취침 신호를 정리해 회복 조건을 만드는 루틴입니다.",
        purpose: "잠을 잘 자야 한다는 압박보다 아침과 밤의 환경 신호를 일정하게 만들어 몸이 리듬을 기억하게 하는 것이 목표입니다.",
        why: "수면은 잠드는 순간만의 문제가 아니라 아침 빛, 낮 카페인, 방 습도, 침구 상태가 이어진 결과입니다. 이 매뉴얼은 수면 아이템을 늘리기보다 내 몸이 잘 쉬는 조건을 찾는 기준을 만듭니다.",
        moments: ["아침에 일어나도 개운하지 않고 수면 점수가 흔들릴 때", "방이 건조하거나 코와 목이 답답해 자주 깰 때", "밤마다 루틴 없이 침대에 누워 화면을 보게 될 때"],
        steps: ["아침에는 햇빛이나 밝은 조명을 먼저 받아 기상 신호를 만든다.", "밤에는 습도, 조명, 화면 중 가장 큰 방해 요소 하나를 줄인다.", "수면 데이터는 점수에 집착하기보다 취침 시간, 깬 횟수, 다음날 컨디션만 연결해 본다."],
        cautions: ["가습기는 물 교체와 세척이 빠지면 오히려 불편한 냄새가 날 수 있다.", "수면 데이터가 낮다고 불안해하면 잠드는 압박이 더 커질 수 있다.", "잠들기 직전 새 루틴을 많이 넣으면 오히려 시간이 길어진다."],
        failures: ["수면 점수만 확인하고 낮 행동은 바꾸지 않는다.", "가습기를 틀지만 세척 주기는 정하지 않는다.", "취침 루틴을 복잡하게 만들어 시작 자체가 부담스러워진다."],
      });
    }
    if (/다이어트|식품|유지방|혼술|장내|전해질|기름|염증/.test(title)) {
      return createManualTone({
        summary: "식단을 극단적으로 바꾸기보다 수분, 간식, 술, 기름진 음식처럼 자주 무너지는 지점을 조정하는 루틴입니다.",
        purpose: "먹는 것을 완전히 끊는 것이 아니라, 다음 식사와 다음날 컨디션을 망치지 않는 선택 기준을 만드는 것이 목표입니다.",
        why: "식단은 의지보다 상황에 많이 흔들립니다. 퇴근 후 혼술, 급한 다이어트, 짠 음식 다음날 붓기, 장이 예민한 날이 반복되면 피부와 몸 컨디션도 같이 흔들립니다. 이 매뉴얼은 완벽한 식단표보다 무너지는 순간의 대체 행동을 정합니다.",
        moments: ["퇴근 후 습관처럼 술이나 야식을 고를 때", "운동하거나 땀을 많이 흘린 뒤 두통과 갈증이 남을 때", "기름진 음식이나 유지방 이후 피부와 속이 동시에 답답할 때"],
        steps: ["오늘 줄일 항목 하나만 정한다. 술, 기름, 당, 카페인, 수분 중 하나면 충분하다.", "대체 선택지를 미리 둔다. 물, 전해질, 단백질, 따뜻한 차처럼 바로 고를 수 있어야 한다.", "다음날 붓기, 속, 피부 반응 중 하나만 체크해 다음 선택 기준으로 쓴다."],
        cautions: ["급하게 줄이는 다이어트는 수면과 집중력을 먼저 무너뜨릴 수 있다.", "전해질이나 영양제는 식사와 수분 섭취의 보조로만 본다.", "혼술을 줄일 때는 술 대신 할 행동을 정하지 않으면 빈 시간이 다시 술로 채워진다."],
        failures: ["한 끼 실패했다고 하루 전체를 포기한다.", "배고픔과 스트레스를 구분하지 않고 바로 먹는다.", "영양제나 보조식품으로 식사 리듬을 대신하려 한다."],
      });
    }
    if (/수면|취침|나이트|불면/.test(title)) {
      return {
        summary: "잠들기 직전 빛, 화면, 온도, 생각의 잔상을 줄여 다음 날 컨디션을 지키는 회복 루틴입니다.",
        purpose: "잠을 억지로 자려는 것이 아니라, 잠을 방해하는 요소를 하나씩 낮춰 침대에 들어가는 기준을 만드는 것이 목표입니다.",
        why: manualWhyCopy(manual),
        moments: [
          "몸은 피곤한데 누우면 화면을 계속 보게 될 때",
          "방은 어둡지만 머릿속 생각이 남아 잠드는 데 오래 걸릴 때",
          "아침마다 눈이 무겁고 전날 밤 루틴이 기억나지 않을 때",
        ],
        steps: [
          "잠들기 30분 전 화면 밝기와 알림을 먼저 낮춘다.",
          "조명, 온도, 침구처럼 바로 바꿀 수 있는 환경부터 정리한다.",
          "생각이 많으면 해결하려 하지 말고 내일 볼 메모 한 줄로 밖으로 빼낸다.",
        ],
        cautions: [
          "수면 루틴을 완벽하게 하려다 시간이 길어지면 오히려 부담이 된다.",
          "잠이 안 오는 날에도 침대에서 화면 보는 습관은 따로 끊어낸다.",
          "카페인, 운동 시간, 낮잠이 겹치면 수면 제품보다 생활 리듬을 먼저 본다.",
        ],
        failures: [
          "잠들기 직전까지 쇼츠나 메시지를 확인한다.",
          "침대 위에서 할 일을 정리하다가 생각이 더 많아진다.",
          "수면 아이템을 샀지만 조명과 온도는 그대로 둔다.",
        ],
      };
    }
    if (/감정|손글씨|주인의식|휴대폰 없는|디지털 디톡스|정각 스트레칭|트리거 향/.test(title)) {
      return createManualTone({
        summary: "감정, 화면, 집중 전환을 억지로 통제하기보다 생각을 밖으로 꺼내고 환경 신호를 바꾸는 멘탈 리셋 루틴입니다.",
        purpose: "기분을 바로 좋게 만드는 것이 아니라, 머릿속에서 반복되는 생각과 화면 자극을 줄여 다음 행동으로 넘어갈 여지를 만드는 것이 목표입니다.",
        why: "불안하거나 산만한 날은 생각을 더 많이 한다고 정리되지 않습니다. 휴대폰을 보며 쉬는 것 같아도 오히려 자극이 늘 수 있습니다. 이 매뉴얼은 손글씨, 차 한 잔, 스트레칭, 향 같은 작은 신호로 마음의 방향을 바꿉니다.",
        moments: ["할 일은 많은데 휴대폰만 반복해서 열 때", "머릿속 고민이 말로만 맴돌고 정리가 안 될 때", "집중이 끊긴 뒤 다시 시작하는 데 시간이 오래 걸릴 때"],
        steps: ["지금 머릿속에 남은 생각을 한 문장으로 적거나 말한다.", "휴대폰을 멀리 두고 차, 향, 스트레칭 같은 대체 신호를 하나 정한다.", "10분 안에 끝나는 다음 행동을 정해 감정 정리에서 실행으로 넘어간다."],
        cautions: ["감정을 분석하다가 더 깊게 빠지면 시간 제한을 둔다.", "디지털 디톡스는 휴대폰을 없애는 것보다 대체 행동이 있어야 유지된다.", "향이나 음악 같은 신호가 없으면 루틴 시작 조건이 흐려질 수 있다."],
        failures: ["휴대폰을 내려놓고도 할 행동을 정하지 않는다.", "감정 기록을 반성문처럼 길게 쓴다.", "집중이 안 되는 이유를 찾느라 시작을 미룬다."],
      });
    }
    if (/인사|시선|비판|불평|관계|거절|칭찬|대답|메뉴|연민|책임/.test(title)) {
      return createManualTone({
        summary: "대화와 관계에서 인상을 크게 꾸미기보다 상대가 편하게 느끼는 작은 반응을 반복하는 소셜 루틴입니다.",
        purpose: "좋은 사람처럼 보이려 애쓰기보다 인사, 시선, 대답, 거절 같은 기본 반응을 안정적으로 만드는 것이 목표입니다.",
        why: "관계 관리는 특별한 말솜씨보다 작은 순간에서 갈립니다. 인사를 놓치거나 불평이 먼저 나오거나, 거절을 피하다가 애매한 태도를 보이면 신뢰가 흐려질 수 있습니다. 이 매뉴얼은 관계의 큰 기술보다 반복 가능한 작은 반응을 정리합니다.",
        moments: ["처음 만났을 때 시선과 인사가 어색하게 느껴질 때", "대화 중 비판이나 불평이 먼저 튀어나올 때", "거절해야 하는 상황에서 미루거나 애매하게 답할 때"],
        steps: ["상대가 알아차릴 수 있는 작은 반응 하나를 먼저 정한다. 인사, 눈맞춤, 질문, 확인 중 하나면 충분하다.", "내 의견을 말하기 전에 상대의 상황을 한 번 요약한다.", "거절이나 갈등은 길게 설명하기보다 가능한 범위와 대안을 짧게 말한다."],
        cautions: ["상대를 맞추려고 내 기준을 모두 지우면 관계가 오래가지 않는다.", "칭찬은 외모보다 행동, 선택, 노력처럼 구체적인 지점에 한다.", "거절을 너무 늦게 하면 더 큰 갈등이 된다."],
        failures: ["분위기를 풀려고 농담이나 조언부터 한다.", "불편한 요청에 즉답을 피하며 시간을 끈다.", "칭찬을 했지만 너무 일반적이라 진심이 약하게 느껴진다."],
      });
    }
    if (/조명|시각 자극|침구 정리|발코니|체모 흔적|공간/.test(title)) {
      return createManualTone({
        summary: "집과 방의 빛, 냄새, 침구, 눈에 보이는 흔적을 정리해 쉬기 좋은 공간 신호를 만드는 루틴입니다.",
        purpose: "공간을 예쁘게 꾸미는 것보다 피로감과 생활감이 쌓이는 지점을 줄여 들어왔을 때 바로 안정되는 상태를 만드는 것이 목표입니다.",
        why: "공간이 어수선하면 쉬는 시간에도 머리가 계속 켜져 있는 느낌이 듭니다. 조명이 너무 밝거나 침구가 흐트러져 있거나 욕실과 바닥에 흔적이 남으면 작은 피로가 계속 쌓입니다. 이 매뉴얼은 대청소가 아니라 매일 보이는 자극을 줄이는 기준입니다.",
        moments: ["퇴근 후 집에 들어왔는데 방이 쉬는 공간처럼 느껴지지 않을 때", "침대와 책상 주변이 계속 어수선해 시작과 휴식이 구분되지 않을 때", "욕실, 바닥, 발코니에 작은 흔적이 쌓여 청소가 부담될 때"],
        steps: ["가장 눈에 먼저 들어오는 한 영역만 정한다. 침대, 책상, 조명, 바닥 중 하나면 충분하다.", "조명이나 물건 위치를 바꿔 활동 모드와 휴식 모드를 구분한다.", "보이는 흔적은 바로 처리할 수 있는 도구를 가까이에 둔다."],
        cautions: ["공간 루틴을 대청소로 만들면 시작이 어려워진다.", "조명을 너무 어둡게만 하면 작업 집중이 떨어질 수 있다.", "냄새 제품을 더하기 전에 환기와 세탁, 쓰레기 처리를 먼저 본다."],
        failures: ["정리할 범위를 너무 크게 잡아 시작을 미룬다.", "향이나 조명으로 생활감을 덮으려 한다.", "침구와 책상처럼 매일 쓰는 곳의 기준을 따로 두지 않는다."],
      });
    }
    if (/립밤|눈썹|코털|착장|컷트|향수|손톱|바디그루밍/.test(title)) {
      return createManualTone({
        summary: "헤어, 향, 손톱, 눈썹, 착장처럼 인상에 바로 보이는 디테일을 과하지 않게 정리하는 스타일 루틴입니다.",
        purpose: "꾸민 티를 강하게 내기보다 가까이 봤을 때 방치된 느낌이 없도록 작은 디테일의 기준을 유지하는 것이 목표입니다.",
        why: "스타일은 옷 하나보다 반복되는 디테일에서 결정됩니다. 눈썹, 코털, 손톱, 향, 립밤, 컷트 주기가 흐트러지면 전체 인상이 금방 지저분해 보일 수 있습니다. 이 매뉴얼은 큰 변화보다 유지 관리 기준을 만듭니다.",
        moments: ["거울을 봤을 때 뭔가 지저분한데 정확히 무엇인지 모를 때", "머리와 옷은 괜찮은데 손톱, 눈썹, 입술 같은 디테일이 걸릴 때", "향수나 착장이 상황보다 과하게 느껴질 때"],
        steps: ["외출 전 얼굴 주변 디테일 하나만 먼저 확인한다.", "손톱, 눈썹, 코털, 입술처럼 가까이서 보이는 부위를 주기적으로 점검한다.", "향과 착장은 강도보다 상황에 맞는 정도를 기준으로 조절한다."],
        cautions: ["처음부터 과하게 다듬으면 어색하거나 회복 시간이 필요할 수 있다.", "향은 내가 익숙한 정도보다 주변 사람이 느끼는 강도를 기준으로 낮춘다.", "컷트와 손톱은 생각났을 때가 아니라 캘린더 기준으로 잡는 편이 안정적이다."],
        failures: ["옷만 바꾸면 스타일이 완성된다고 생각한다.", "향수를 많이 뿌려 인상을 덮으려 한다.", "눈썹, 코털, 손톱 같은 가까운 디테일을 늦게 발견한다."],
      });
    }
    if (/시간의 가치|프롬프트|챌린지|독서|YES|거절당하기|리프레시|로드맵|AI 맞춤/.test(title)) {
      return createManualTone({
        summary: "루틴을 감으로 관리하지 않고 시간, 기록, 질문, 실험 기준으로 정리하는 시스템 루틴입니다.",
        purpose: "계획을 멋지게 세우는 것보다 내가 실제로 반복할 수 있는 기준을 만들고, 다음 선택이 쉬워지게 하는 것이 목표입니다.",
        why: "관리 루틴은 처음엔 의욕으로 시작하지만 기록과 기준이 없으면 금방 흐려집니다. 시간의 가치, 독서, 챌린지, 프롬프트, AI 설계는 모두 나를 몰아붙이기 위한 도구가 아니라 다음 행동을 더 쉽게 고르는 시스템입니다.",
        moments: ["하고 싶은 관리는 많은데 우선순위가 매번 바뀔 때", "루틴을 시작해도 일주일 뒤에 무엇이 바뀌었는지 모르겠을 때", "거절, 독서, 운동, 피부관리처럼 목표가 추상적으로 남아 있을 때"],
        steps: ["이번 주에 확인할 기준 하나만 정한다. 시간, 비용, 빈도, 몸 상태 중 하나면 충분하다.", "실행 후 결과보다 방해 요인을 기록한다.", "다음 주에는 새 루틴을 추가하기보다 기존 루틴의 시작 조건을 더 쉽게 만든다."],
        cautions: ["기록이 길어지면 실행보다 관리 자체가 일이 된다.", "AI나 프롬프트는 결정을 대신하는 도구가 아니라 선택지를 좁히는 도구로 쓴다.", "챌린지는 강도보다 회고 기준이 없으면 금방 이벤트로 끝난다."],
        failures: ["계획표를 만드는 데 에너지를 다 쓴다.", "기록을 안 했다고 루틴 전체를 실패로 본다.", "새로운 시스템을 계속 추가하면서 기존 기준은 정착시키지 않는다."],
      });
    }
    return null;
  }

  function domainManualTone(domain) {
    const tones = {
      SK: {
        summary: "피부가 무너지는 순간을 줄이기 위해 세안, 보습, 자외선 차단, 접촉면 관리를 실행 단위로 정리한 매뉴얼입니다.",
        purpose: "좋은 제품을 더 많이 바르는 것보다 피부를 나쁘게 만드는 손, 수건, 침구, 면도, 세정 잔여물을 줄이는 기준을 만드는 것이 목표입니다.",
        moments: ["아침에는 괜찮았는데 오후에 번들거림이나 당김이 커질 때", "같은 부위에 트러블이나 자극이 반복될 때", "제품은 많은데 실제로 매일 지키는 기준이 없을 때"],
        steps: ["오늘 문제를 하나만 고른다. 세안, 보습, 자외선, 접촉면 중 가장 흔들리는 지점부터 본다.", "시간이 오래 걸리는 관리보다 1분 안에 반복할 수 있는 행동으로 줄인다.", "피부 반응을 하루 단위로 단정하지 말고 1~2주 반복 기준으로 확인한다."],
        cautions: ["자극이 생기면 제품 개수보다 접촉면과 세안 강도를 먼저 낮춘다.", "한 번에 여러 제품을 바꾸면 무엇이 맞는지 판단하기 어렵다.", "피부 컨디션이 나쁜 날은 루틴 강도를 올리기보다 단계를 줄인다."],
        failures: ["문제가 생길 때마다 새 제품부터 찾는다.", "세안과 보습은 불규칙한데 고기능 제품만 추가한다.", "손, 수건, 베개 같은 접촉면을 루틴 밖으로 둔다."],
      },
      GR: {
        summary: "면도, 체취, 구강, 손톱처럼 인상에 바로 드러나는 디테일을 짧은 실행 기준으로 정리한 매뉴얼입니다.",
        purpose: "꾸민 티를 내기보다 가까이 있을 때 불편함이 없도록 위생과 자극을 먼저 정리하는 것이 목표입니다.",
        moments: ["면도 후 붉어짐이나 따가움이 반복될 때", "점심 이후 체취나 입안 텁텁함이 신경 쓰일 때", "손톱, 눈썹, 목 뒤처럼 작은 디테일이 방치될 때"],
        steps: ["가장 눈에 띄는 한 부위만 먼저 고른다.", "도구 위생, 예열, 마무리 진정처럼 앞뒤 단계를 함께 본다.", "외출 전 3분 안에 끝나는 체크 기준으로 만든다."],
        cautions: ["향으로 덮기 전에 세정과 건조를 먼저 본다.", "면도 자극이 심하면 날, 압력, 반복 면도를 같이 줄인다.", "도구를 오래 쓰면 관리보다 자극이 먼저 커질 수 있다."],
        failures: ["문제를 향수나 스타일링 제품으로 덮는다.", "도구 교체 주기를 정하지 않는다.", "자극이 생겨도 같은 압력과 같은 방향으로 반복한다."],
      },
      BD: {
        summary: "운동, 자세, 체형, 바디 위생처럼 몸의 컨디션을 유지하는 행동을 반복 가능한 단위로 정리한 매뉴얼입니다.",
        purpose: "강도를 올리는 것보다 몸이 무겁거나 무너지는 패턴을 줄여 꾸준히 이어갈 수 있는 기준을 만드는 것이 목표입니다.",
        moments: ["운동을 몰아서 하고 며칠 쉬는 패턴이 반복될 때", "목, 어깨, 허리처럼 같은 부위가 자주 뻐근할 때", "샤워 후에도 몸이 건조하거나 답답하게 느껴질 때"],
        steps: ["오늘 할 수 있는 최소 단위를 정한다.", "운동, 회복, 세정 중 하나만 먼저 안정시킨다.", "강도보다 반복 횟수와 회복 상태를 기준으로 기록한다."],
        cautions: ["통증이 있는 날은 운동 강도보다 자세와 회복을 먼저 본다.", "땀과 세정 후 보습을 빼먹으면 바디 컨디션이 쉽게 무너진다.", "무리한 목표는 루틴을 끊기게 만든다."],
        failures: ["운동 강도만 올리고 회복 루틴은 없다.", "통증을 참고 계속 밀어붙인다.", "샤워와 보습을 별개로 생각한다."],
      },
      FD: {
        summary: "수분, 단백질, 영양제, 식사 리듬을 완벽한 식단이 아니라 반복 가능한 기준으로 만드는 매뉴얼입니다.",
        purpose: "먹는 것을 극단적으로 제한하기보다 자주 무너지는 시간대와 선택지를 미리 정리하는 것이 목표입니다.",
        moments: ["점심 이후 당이 당기거나 집중력이 떨어질 때", "영양제를 샀지만 먹는 시간이 계속 밀릴 때", "배고픔보다 습관으로 간식을 고를 때"],
        steps: ["가장 자주 무너지는 식사 시간을 하나만 고른다.", "대체 선택지를 미리 정해 결정을 줄인다.", "수분, 단백질, 간식 기준을 짧게 체크한다."],
        cautions: ["완벽한 식단표보다 반복 가능한 기본값이 먼저다.", "영양제는 식사, 수면, 운동을 대신하지 않는다.", "속이 불편하면 제품보다 섭취 타이밍을 먼저 조정한다."],
        failures: ["한 번 무너지면 하루 전체를 포기한다.", "먹을 것을 현장에서 즉흥적으로 고른다.", "영양제를 많이 사두고 먹는 기준은 없다."],
      },
      SL: {
        summary: "수면 환경, 조명, 화면, 침구 위생을 정리해 회복을 방해하는 요소를 줄이는 매뉴얼입니다.",
        purpose: "잠을 억지로 자려 하기보다 잠들기 전 방해 요소를 낮춰 몸이 쉬는 상태로 넘어가게 만드는 것이 목표입니다.",
        moments: ["누웠는데 화면을 계속 보게 될 때", "아침에 일어나도 몸이 무겁고 눈이 피곤할 때", "침구나 방 온도 때문에 깊게 못 잔 느낌이 들 때"],
        steps: ["잠들기 전 가장 큰 방해 요소 하나를 먼저 줄인다.", "빛, 온도, 화면, 침구 중 오늘 바로 바꿀 수 있는 것부터 정리한다.", "완벽한 루틴보다 같은 시간에 반복되는 신호를 만든다."],
        cautions: ["수면 아이템만 추가하고 화면 습관을 그대로 두면 효과가 약하다.", "밤 루틴이 길어지면 오히려 부담이 된다.", "카페인과 낮잠이 겹치면 환경 정리만으로 부족할 수 있다."],
        failures: ["침대에서 계속 화면을 본다.", "졸릴 때까지 기다리다 취침 시간이 계속 밀린다.", "침구와 조명을 방치한 채 수면 제품만 찾는다."],
      },
    };
    return tones[domain] || {
      summary: "생활 속에서 반복되는 관리 행동을 실제로 실행 가능한 기준으로 정리한 매뉴얼입니다.",
      purpose: "거창한 관리보다 오늘 바로 할 수 있는 작은 기준을 만들어 루틴이 끊기지 않게 하는 것이 목표입니다.",
      moments: ["해야 한다는 건 알지만 매번 뒤로 밀릴 때", "어떤 제품이나 도구를 써야 하는지보다 행동 기준이 먼저 필요할 때", "한 번에 크게 바꾸려다 루틴이 자주 끊길 때"],
      steps: ["오늘 할 행동을 하나만 고른다.", "시간, 장소, 도구를 정해 반복 기준을 만든다.", "무리하면 단계를 줄이고 다음 실행 가능성을 남긴다."],
      cautions: ["관리 강도를 올리기보다 반복 가능한 기준을 먼저 잡는다.", "자극, 비용, 시간이 커지면 루틴 단위를 낮춘다.", "제품 하나만 탓하지 말고 습관, 환경, 접촉면을 같이 본다."],
      failures: ["처음부터 완벽한 루틴을 만들려 한다.", "제품이나 도구를 사는 것으로 실행을 대신한다.", "실패한 날 이후 전체 루틴을 포기한다."],
    };
  }

  function usefulManualText(candidate, fallback) {
    if (!candidate || isGeneratedManualText(candidate)) return fallback;
    return candidate;
  }

  function isGeneratedManualText(text = "") {
    return /반복 가능한 자기관리 기준|방법론 원칙|라이프스타일 DB|실행 행동을 교차|세부 매뉴얼입니다|세부 루틴이다/.test(String(text));
  }

  function manualWhyCopy(manual, fallback) {
    const title = `${manual?.title || ""} ${manual?.summary || ""}`;
    if (/선크림|자외선|SPF/.test(title)) {
      return "선크림을 안 바르는 이유는 자외선 위험을 몰라서가 아니라 번들거림, 백탁, 눈시림 때문에 루틴이 끊기는 경우가 많습니다. 이 매뉴얼은 선크림을 잘 바르는 것보다 매일 빠뜨리지 않고 습관으로 만드는 것을 목표로 합니다.";
    }
    if (/두피|세럼|정수리/.test(title)) {
      return "샴푸 직후에는 괜찮아도 오후가 되면 정수리가 눌리거나 두피가 답답해지는 날이 있습니다. 이 매뉴얼은 스타일링 전에 두피 컨디션을 먼저 안정시키는 기준을 잡기 위한 흐름입니다.";
    }
    if (/트러블|여드름|진정/.test(title)) {
      return "트러블 관리는 한 번에 강하게 누르는 방식보다, 손이 자주 가는 상황과 자극을 줄이는 반복 기준이 중요합니다. 이 매뉴얼은 피부가 예민한 날에도 루틴을 무리 없이 이어가게 만듭니다.";
    }
    if (/수면|취침|나이트/.test(title)) {
      return "잠을 못 자는 날은 의지가 부족해서가 아니라 빛, 화면, 온도, 생각의 잔상이 계속 남아 있기 때문일 수 있습니다. 이 매뉴얼은 잠들기 직전의 방해 요소를 줄이는 데 집중합니다.";
    }
    return fallback || manual?.summary || "이 매뉴얼은 루틴이 끊기는 실제 상황을 기준으로, 반복 가능한 실행 기준을 만드는 데 목적이 있습니다.";
  }

  function renderItemDetail(item) {
    if (!item) return `<div class="empty">아이템을 찾을 수 없습니다.</div>`;
    const productGroups = getProductGroupsForItem(item.code, { includeMock: true });
    const primaryProductGroup = productGroups[0];
    const manuals = item.manualCodes.map((manualCode) => byCode.manuals.get(manualCode)).filter(Boolean);
    const itemStats = getItemStats(item);
    const cat = byCode.categories.get(item.domain);
    return `
      <article class="item-slot-detail">
        <section class="item-slot-hero" style="--accent:${cat?.accent || "#d98f6b"};">
          <div class="item-slot-icon">${esc(categoryVisual[item.domain]?.icon || cat?.icon || "◧")}</div>
          <div>
            <span>Item Detail · 무엇으로 관리할까?</span>
            <h2>${esc(item.name)}</h2>
            <code>${esc(item.code)}</code>
            <p>${esc(item.role)}</p>
          </div>
          <div class="item-detail-meta">
            <span><b>Category</b>${esc(categoryName(item.domain))}</span>
            <span><b>Manual</b>${manuals.length}개</span>
            <span><b>Slot</b>${itemStats.slots.length}개</span>
            <span><b>Product</b>${itemStats.products.length}개</span>
          </div>
        </section>
        ${primaryProductGroup ? renderItemProductSlotSection(primaryProductGroup) : pendingBox("추천 제품 슬롯 연결 대기", "이 Item 안에 추천 슬롯 또는 실제 제품 데이터가 아직 연결되지 않았습니다.")}
        <section class="item-slot-panel item-context-panel">
          <div class="slot-section-head">
            <h3>연결 컨텍스트</h3>
            <span>관련 매뉴얼 · 관련 루틴</span>
          </div>
          <div class="item-context-grid">
            ${manuals.length ? renderRelationList("관련 매뉴얼", manuals.map((manual) => ["manual", manual.code, manual.title])) : pendingBox("관련 매뉴얼 연결 대기", "이 Item을 설명하는 매뉴얼이 연결되면 표시됩니다.")}
            ${itemStats.routines.length ? renderRelationList("관련 루틴", itemStats.routines.map((routine) => ["routine", routine.code, routine.title])) : pendingBox("관련 루틴 연결 대기", "이 Item을 실제로 사용하는 루틴이 연결되면 표시됩니다.")}
          </div>
        </section>
        ${item.reviewNeeded ? pendingBox("아이템 재분류 검토 필요", item.reviewReason || "매뉴얼의 실행 도구/공간/습관 단위와 아이템명이 약하게 연결되어 있습니다.") : ""}
      </article>
    `;
  }

  function renderProductGroupDetail(group) {
    if (!group) return `<div class="empty">Item Product Slot을 찾을 수 없습니다.</div>`;
    const manuals = group.item?.manualCodes.map((manualCode) => byCode.manuals.get(manualCode)).filter(Boolean) || [];
    return `
      ${detailHeader("Item Product Slots", group.item?.name || group.title, group.code)}
      <p>${esc(group.item?.role || `${group.category || categoryName(group.domain)} 영역의 추천 제품 슬롯입니다.`)}</p>
      <div class="meta-line">
        <span>Item ${esc(group.code)}</span>
        <span>추천 슬롯 ${getItemProductSlots(group).length}개</span>
        <span>${group.realCount ? `실제품 ${group.realCount}개` : "제품 연결 대기"}</span>
      </div>
      ${renderItemProductSlotSection(group)}
      ${renderRelationList("관련 매뉴얼", manuals.map((manual) => ["manual", manual.code, manual.title]))}
    `;
  }

  function renderItemProductSlotSection(group) {
    const slots = getSortedItemProductSlots(group);
    const readyCount = slots.filter((slot) => productsForSlot(group, slot).length).length;
    return `
      <section class="item-slot-panel">
        <div class="slot-section-head">
          <h3>추천 제품</h3>
          <span>${esc(String(readyCount))}개 연결 · ${esc(String(slots.length))}개 슬롯</span>
        </div>
        <div class="product-slot-grid slot-card-grid">
          ${slots.map((slot) => renderItemProductSlot(slot, group)).join("")}
        </div>
      </section>
    `;
  }

  function productsForSlot(group, slot) {
    return group.allProducts.filter((product) => slotMatchesProduct(slot, product) && !isMockProduct(product));
  }

  function getSortedItemProductSlots(group) {
    return getItemProductSlots(group)
      .map((slot, index) => ({ slot, index, productCount: productsForSlot(group, slot).length }))
      .sort((a, b) => {
        if (Boolean(b.productCount) !== Boolean(a.productCount)) return Boolean(b.productCount) - Boolean(a.productCount);
        if (b.productCount !== a.productCount) return b.productCount - a.productCount;
        return a.index - b.index;
      })
      .map((entry) => entry.slot);
  }

  function renderItemProductSlot(slot, group) {
    const products = productsForSlot(group, slot);
    const extraCount = Math.max(0, products.length - 2);
    return `
      <button class="product-slot slot-card clickable ${products.length ? "is-ready" : "is-mock"}" data-open-type="productSlot" data-code="${esc(productSlotCode(group.code, slot))}">
        <div class="slot-card-top">
          <div>
            <strong>${esc(slot.label || slot.id)}</strong>
            <em>${products.length ? `제품 ${products.length}개` : "제품 연결 대기"}</em>
          </div>
          <span aria-hidden="true">→</span>
        </div>
        <div class="slot-preview-media ${products.length ? "" : "is-empty"}">
          ${products.length ? products.slice(0, 2).map((product) => renderSlotPreviewImage(product)).join("") : `<span>제품 연결 대기</span>`}
          ${extraCount ? `<b>+${extraCount}</b>` : ""}
        </div>
        <div class="slot-status ${products.length ? "is-connected" : "is-pending"}">
          <i></i>${products.length ? "제품 연결됨" : "제품 연결 대기"}
        </div>
      </button>
    `;
  }

  function renderSlotPreviewImage(product) {
    if (product.imageUrl) {
      return `<img src="${esc(product.imageUrl)}" alt="${esc(product.productName)}">`;
    }
    return `<span>${esc((product.brand || product.productName || "P").slice(0, 2))}</span>`;
  }

  function renderProductSlot(product, slot = null) {
    const mock = isMockProduct(product);
    const label = slot?.label || product.recommendationType || "추천";
    const inner = `
      <span>${esc(label)}</span>
      <strong>${esc(mock ? `${label} 슬롯` : product.productName)}</strong>
      <em>${esc(mock ? "제품 연결 대기" : `${product.code} →`)}</em>
    `;
    if (mock) {
      return `<div class="product-slot is-mock">${inner}</div>`;
    }
    return `<button class="product-slot is-ready clickable" data-open-type="product" data-code="${esc(product.code)}">${inner}</button>`;
  }

  function renderProductSlotDetail(detail) {
    if (!detail) return `<div class="empty">추천 슬롯을 찾을 수 없습니다.</div>`;
    const { group, slot, products } = detail;
    return `
      <article class="slot-list-detail">
        <section class="slot-list-head">
          <button class="slot-back-btn" data-action="back" type="button">←</button>
          <div>
            <span>Product Slot</span>
            <h2>${esc(slot.label || slot.id)}</h2>
            <p>${esc(group.item?.name || group.title)}</p>
          </div>
          <strong>제품 ${esc(String(products.length))}개</strong>
        </section>
      ${products.length ? `
        <section class="slot-product-list">
          <h3>Product List</h3>
          ${products.map((product) => `
            <button class="slot-product-row" data-open-type="product" data-code="${esc(product.code)}">
              <div class="slot-product-media">${renderProductImage(product)}</div>
              <div class="slot-product-copy">
                <strong>${esc(product.productName)}</strong>
                <span>${esc(product.brand || "Brand 입력 대기")}</span>
                <div class="tag-row">
                  ${getSlotProductTags(product, slot).map((tag) => `<em class="tag">${esc(tag)}</em>`).join("")}
                </div>
              </div>
              <i aria-label="연결됨"></i>
            </button>
          `).join("")}
        </section>
      ` : pendingBox("제품 연결 대기", "이 슬롯에 연결된 실제 Product가 아직 없습니다. 새 슬롯을 만들지 않고 이 슬롯 안에 제품을 추가합니다.")}
      </article>
    `;
  }

  function getSlotProductTags(product, slot) {
    const blockedLabels = new Set([
      "메이크업",
      "피부관리",
      "스타일관리",
      "검수 필요",
      "승인",
      "세르칸핏 높음",
      "수집됨",
      "링크 검수 필요",
      "제품 연결됨",
    ]);
    const slotLabel = slot.label || slot.id;
    const cleanTags = (product.tags || [])
      .filter((tag) => tag && !blockedLabels.has(tag))
      .filter((tag) => tag !== product.category && tag !== product.recommendationType);

    return uniq([
      slotLabel,
      ...cleanTags,
    ].filter((tag) => tag && !blockedLabels.has(tag))).slice(0, 3);
  }

  function renderProductDetail(product) {
    if (!product) return `<div class="empty">제품을 찾을 수 없습니다.</div>`;
    const item = byCode.items.get(product.itemCode);
    const manual = item?.manualCodes.map((manualCode) => byCode.manuals.get(manualCode)).find(Boolean);
    const routine = getRelatedRoutineForProduct(product);
    const origin = getProductOrigin(product);
    const features = getProductFeatureCards(product);
    const points = getProductPoints(product);
    const tags = getProductContextTags(product);
    const targetList = getProductTargetList(product);
    const useRows = getProductUseRows(product);
    const cautionList = getProductCautions(product);
    const featureMetrics = getProductFeatureMetrics(product);
    const howToSteps = getProductHowToSteps(product);
    const situationTags = getProductSituationTags(product);
    const avoidList = getProductAvoidList(product);
    const linkSources = getProductLinkSources(product);
    const productLink = product.productLink && product.productLink !== "#"
      ? `<a class="link-button" href="${esc(product.productLink)}" target="_blank" rel="noreferrer">공식 페이지 열기 →</a>`
      : "제품 링크 입력 대기";
    return `
      <article class="knowledge-detail product-profile">
        <section class="product-profile-grid">
          <div class="profile-main">
            <section class="profile-hero product-hero-card">
              <div class="profile-hero-copy">
                <code>${esc(product.code)}</code>
                <h2>${esc(product.productName)}</h2>
                <div class="product-identity">
                  <span><b>${esc(product.brand || "Brand 입력 대기")}</b><em>Brand</em></span>
                  <span><b>${esc(product.category || "Category 입력 대기")}</b><em>Category</em></span>
                </div>
                <div class="product-origin-badges">
                  ${origin.item ? `<span>Item · ${esc(origin.item.name)}</span>` : ""}
                  ${origin.slot ? `<span>Slot · ${esc(origin.slot.label || origin.slot.id)}</span>` : ""}
                </div>
              </div>
              <div class="product-hero-media">
                ${renderProductImage(product)}
                <span class="image-count-badge">1 / ${product.imageUrl ? "1" : "0"}</span>
              </div>
              <div class="feature-card-grid">
                ${features.map((feature) => `
                  <div class="feature-card">
                    <span>${esc(feature.icon)}</span>
                    <strong>${esc(feature.title)}</strong>
                    <em>${esc(feature.body)}</em>
                  </div>
                `).join("")}
              </div>
            </section>

            <section class="detail-card">
              <span class="card-icon soft-rose">♡</span>
              <h3>1. 왜 추천하는가</h3>
              <p>${esc(product.recommendationReason || "이 제품은 스펙보다 루틴에서 반복해서 쓰기 쉬운지 확인해야 하는 후보입니다. 사용 위치, 사용 시간, 불편한 사용감이 적은지를 먼저 봅니다.")}</p>
            </section>

            <section class="detail-card">
              <span class="card-icon soft-blue">⌁</span>
              <h3>2. 누가 써야 하는가</h3>
              <ul class="check-list">
                ${targetList.map((target) => `<li>${esc(target)}</li>`).join("")}
              </ul>
            </section>

            <section class="detail-card">
              <span class="card-icon soft-green">☷</span>
              <h3>3. 제품의 핵심 특징</h3>
              <div class="metric-list">
                ${featureMetrics.map(renderMetricRow).join("")}
              </div>
            </section>

            <section class="detail-card">
              <span class="card-icon soft-green">☵</span>
              <h3>4. 실제 사용감</h3>
              <div class="use-row-list">
                ${useRows.map((row) => `
                  <div class="use-row">
                    <span>${esc(row.label)}</span>
                    <strong>${esc(row.value)}</strong>
                  </div>
                `).join("")}
              </div>
            </section>

            <section class="detail-card">
              <span class="card-icon soft-blue">A</span>
              <h3>5. 사용 방법</h3>
              <div class="step-card-row">
                ${howToSteps.map((step, index) => `
                  <div class="mini-step-card">
                    <strong>${index + 1}</strong>
                    <span>${esc(step)}</span>
                  </div>
                `).join("")}
              </div>
            </section>

            <div class="detail-split-grid">
              <section class="detail-card">
                <span class="card-icon soft-green">◎</span>
                <h3>6. 추천 상황</h3>
                <div class="situation-chip-grid">
                  ${situationTags.map((tag) => `<span>${esc(tag)}</span>`).join("")}
                </div>
              </section>

              <section class="detail-card avoid-card">
                <span class="card-icon soft-rose">×</span>
                <h3>7. 비추천 상황</h3>
                <ul class="check-list avoid-list">
                  ${avoidList.map((item) => `<li>${esc(item)}</li>`).join("")}
                </ul>
              </section>
            </div>

            <section class="detail-card warning-card">
              <span class="card-icon soft-yellow">⚠️</span>
              <h3>8. 주의사항</h3>
              <ul class="check-list caution-list">
                ${cautionList.map((item) => `<li>${esc(item)}</li>`).join("")}
              </ul>
            </section>

            ${renderProductSourceCard(product)}
          </div>

          <aside class="profile-side">
            ${renderProductTrustCard(product)}
            <section class="detail-card">
              <h3>한눈에 보는 포인트</h3>
              <ul class="point-list">
                ${points.map((point) => `<li>${esc(point)}</li>`).join("")}
              </ul>
            </section>
            <section class="detail-card">
              <h3>사용 상황 태그</h3>
              <div class="pill-cloud">${tags.map((tag) => `<span>${esc(tag)}</span>`).join("")}</div>
            </section>
            <section class="detail-card">
              <h3>루틴에서 쓰는 위치</h3>
              <div class="routine-reco-list">
                ${routine ? relationButton("routine", routine.code, "관련 루틴", routine.title) : pendingBox("관련 루틴 연결 대기", "이 제품을 쓸 루틴을 연결합니다.")}
                ${manual ? relationButton("manual", manual.code, "관련 매뉴얼", manual.title) : pendingBox("관련 매뉴얼 연결 대기", "제품 사용 맥락과 직접 연결되는 매뉴얼만 표시합니다.")}
              </div>
            </section>
            <section class="detail-card">
              <h3>연결된 항목</h3>
              <div class="routine-reco-list">
                ${origin.item ? relationButton("item", origin.item.code, "연결 아이템", origin.item.name) : pendingBox("연결 아이템 확인 필요", "이 제품이 들어갈 Item을 확인합니다.")}
                ${manual ? relationButton("manual", manual.code, "연결 매뉴얼", manual.title) : ""}
                ${routine ? relationButton("routine", routine.code, "연결 루틴", routine.title) : ""}
                ${origin.slot ? pendingBox("추천 슬롯", origin.slot.label || origin.slot.id) : ""}
                ${pendingBox("연결 브랜드", product.brand || "브랜드 정보 확인")}
              </div>
            </section>
            <section class="detail-card product-link-card">
              <h3>제품 링크</h3>
              ${linkSources.length ? `
                <div class="product-link-source-list">
                  ${linkSources.map((source) => `
                    <a href="${esc(source.url)}" target="_blank" rel="noreferrer">
                      <span>${esc(source.label)}</span>
                      <em>열기 →</em>
                    </a>
                  `).join("")}
                </div>
              ` : `<p>공식몰, 올리브영, 네이버 브랜드스토어, 쿠팡 링크 연결 대기</p>`}
              ${productLink}
            </section>
          </aside>
        </section>
      </article>
    `;
  }

  function getProductOrigin(product) {
    const item = byCode.items.get(product?.itemCode);
    const group = item ? getProductGroupsForItem(item.code, { includeMock: true })[0] : null;
    const slot = group ? getItemProductSlots(group).find((entry) => slotMatchesProduct(entry, product)) : null;
    return { item, group, slot };
  }

  function renderSituationDetail(situation) {
    if (!situation) return `<div class="empty">상황을 찾을 수 없습니다.</div>`;
    const manual = byCode.manuals.get(situation.manualCode);
    const items = manual ? getItemsForManual(manual.code) : [];
    const productGroups = getProductGroupsForItems(items, { includeMock: false });
    const customActions = situation.isCustom ? `
      <div class="custom-routine-actions">
        <button class="danger-link" data-action="delete-custom-entry" data-code="${esc(situation.code)}">이 사용자 상황 루틴 삭제</button>
      </div>
    ` : "";
    return `
      ${detailHeader("Situation", situation.title, situation.code)}
      <p>${esc(situation.type)} · ${esc(situation.priority)}</p>
      ${situation.summary || situation.trigger ? `<p>${esc(situation.summary || situation.trigger)}</p>` : ""}
      ${manual ? relationButton("manual", manual.code, manualLabel(situation, "상황 상세 매뉴얼"), manual.title) : pendingBox("상황 매뉴얼 연결 대기", "상황 제목과 실행 맥락이 직접 이어지는 매뉴얼만 연결합니다.")}
      ${renderRelationList("관련 아이템", items.map((item) => ["item", item.code, item.name]))}
      ${productGroups.length ? renderRelationList("관련 제품 그룹", productGroups.map((group) => ["productGroup", group.code, group.title])) : pendingBox("관련 제품 연결 대기", "실제 제품 데이터가 들어오기 전까지 제품 연결을 보류합니다.")}
      ${customActions}
    `;
  }

  function renderCategoryDetail(category) {
    if (!category) return `<div class="empty">카테고리를 찾을 수 없습니다.</div>`;
    const manualOrderKey = cardOrderKey("manual", category.code);
    const manuals = orderedCards(data.manuals.filter((manual) => manual.domain === category.code), manualOrderKey);
    const items = data.items.filter((item) => item.domain === category.code);
    const productGroups = getProductGroups({ includeMock: false, sourceProducts: data.products.filter((product) => product.domain === category.code) });
    const routines = data.routines.filter((routine) => routine.domain === category.code);
    const filterTags = getManualFilterLabels(category.code, manuals);
    const activeFilter = state.manualCategoryFilters[category.code] || "all";
    const sortMode = state.manualCategorySort[category.code] || "latest";
    const filteredManuals = activeFilter === "all"
      ? manuals
      : manuals.filter((manual) => manualMatchesManualFilter(manual, activeFilter));
    const visibleManuals = sortManualLibrary(filteredManuals, sortMode);
    return `
      <article class="manual-category-detail">
        <header class="manual-category-head">
          <div>
            <span class="breadcrumb">홈 › 매뉴얼 백과 › ${esc(category.name)}</span>
            <h2>${esc(category.name)} 매뉴얼 라이브러리</h2>
            <p>${esc(category.label)}에 대한 모든 루틴 매뉴얼을 탐색하고, 올바른 관리 방법을 익혀보세요.</p>
          </div>
          <div class="manual-category-stats">
            <span><small>전체 매뉴얼</small><b>${manuals.length}개</b></span>
            <span><small>연결 아이템</small><b>${items.length}개</b></span>
            <span><small>연결 제품</small><b>${productGroups.reduce((sum, group) => sum + group.realCount, 0)}개</b></span>
            <span><small>연결 루틴</small><b>${routines.length}개</b></span>
          </div>
        </header>
        <div class="manual-category-layout">
          <section class="manual-category-main">
            <div class="manual-filter-bar">
              <div class="manual-filter-chips">
                <button class="${activeFilter === "all" ? "active" : ""}" data-action="filter-manual-category" data-domain="${esc(category.code)}" data-filter="all">전체 (${manuals.length})</button>
                ${filterTags.map((tag) => `<button class="${activeFilter === tag ? "active" : ""}" data-action="filter-manual-category" data-domain="${esc(category.code)}" data-filter="${esc(tag)}">${esc(tag)}</button>`).join("")}
              </div>
              <button class="manual-sort-chip ${sortMode === "latest" ? "is-active" : ""}" data-action="toggle-manual-category-sort" data-domain="${esc(category.code)}">${sortMode === "latest" ? "최신순" : "기본순"}</button>
            </div>
            <div class="manual-list-first" data-sort-container="${esc(manualOrderKey)}">
              ${visibleManuals.length ? visibleManuals.map((manual, index) => renderManualLibraryRow(manual, index, manualOrderKey)).join("") : pendingBox("해당 필터의 매뉴얼 없음", "다른 필터를 선택하거나 전체 보기로 돌아가세요.")}
            </div>
          </section>
        </div>
      </article>
    `;
  }

  function sortManualLibrary(manuals, sortMode) {
    if (sortMode !== "latest") return manuals;
    return [...manuals].sort((a, b) => manualCodeNumber(b.code) - manualCodeNumber(a.code) || a.title.localeCompare(b.title, "ko"));
  }

  function manualCodeNumber(code) {
    const match = String(code || "").match(/[A-Z](\d+)$/);
    return match ? Number(match[1]) : 0;
  }

  function manualMatchesManualFilter(manual, label) {
    const text = normalizeManualFilterText([manual.title, manual.summary, manual.category, ...(manual.tags || [])].join(" "));
    const keywordMap = {
      "데일리 관리": ["데일리", "매일", "daily", "기본", "정량"],
      "트러블 관리": ["트러블", "여드름", "좁쌀", "진정", "상처"],
      "두피 관리": ["두피", "정수리", "세럼", "탈모", "헤어"],
      "보습 관리": ["보습", "수분", "크림", "건조"],
      "클렌징 관리": ["클렌징", "세안", "세척", "샴푸"],
      "면도 관리": ["면도", "쉐이빙", "애프터쉐이브"],
      "체취 관리": ["체취", "데오", "땀", "향"],
      "구강 관리": ["구강", "치아", "칫솔", "워터픽", "가글"],
      "손톱·눈썹": ["손톱", "눈썹", "정리"],
      "외출 준비": ["외출", "출근", "휴대", "준비"],
      "운동 관리": ["운동", "스트레칭", "근력", "유산소", "목 운동"],
      "자세 관리": ["자세", "목", "어깨", "거북목"],
      "바디 케어": ["바디", "샤워", "반창고", "냉찜질"],
      "회복 관리": ["회복", "마사지", "찜질", "휴식"],
      "휴대·응급": ["휴대", "반창고", "상처", "응급"],
      "영양 관리": ["영양", "영양제", "단백질", "보충"],
      "식단 조절": ["식단", "다이어트", "음식", "식사"],
      "수분 관리": ["수분", "물", "음료"],
      "간식 관리": ["간식", "디저트", "야식"],
      "음주 관리": ["음주", "술", "혼술"],
      "수면관리": ["수면", "잠", "취침", "기상"],
      "침구·수면환경": ["침구", "침대", "베개", "습도", "가습기", "조명", "환경"],
      "수면 데이터": ["데이터", "기록", "체크"],
      "위생·관리": ["위생", "세탁", "청소", "씻", "관리"],
      "회복 루틴": ["회복", "휴식", "햇빛", "리셋"],
      "감정 기록": ["감정", "기록", "저널", "손글씨"],
      "집중 회복": ["집중", "몰입", "휴대폰", "디지털"],
      "불안 완화": ["불안", "호흡", "긴장", "초조"],
      "루틴 재시작": ["루틴", "재시작", "리셋"],
      "디지털 리셋": ["디지털", "휴대폰", "스크린"],
      "헤어 관리": ["헤어", "머리", "두피", "샴푸"],
      "향 관리": ["향", "향수", "체취"],
      "의류 관리": ["의류", "옷", "착장", "세탁"],
      "스타일 점검": ["스타일", "점검", "외모"],
      "첫인상": ["첫인상", "시선", "미소", "칭찬"],
      "관계 유지": ["관계", "연락", "경청"],
      "대화 관리": ["대화", "커뮤니케이션", "말투"],
      "갈등 관리": ["갈등", "거절", "비판", "불평"],
      "감사·사과": ["감사", "사과", "화해"],
      "공간 정리": ["공간", "정리", "책상", "수납"],
      "청소·위생": ["청소", "위생", "설거지", "욕실"],
      "환기·공기질": ["환기", "공기", "냄새"],
      "수납 관리": ["수납", "정리", "장"],
      "분위기 전환": ["조명", "향", "분위기", "전환"],
      "기록 관리": ["기록", "로그", "체크"],
      "시간 관리": ["시간", "계획", "일정"],
      "체크리스트": ["체크", "점검", "리스트"],
      "생산성": ["생산성", "업무", "집중"],
      "루틴 설계": ["루틴", "설계", "습관"],
    };
    const keywords = keywordMap[label] || [label];
    return keywords.some((keyword) => text.includes(normalizeManualFilterText(keyword)));
  }

  function normalizeManualFilterText(value) {
    return String(value || "").toLowerCase().replace(/[·\s/_-]/g, "");
  }

  function getManualFilterLabels(domain, manuals) {
    const presets = {
      SK: ["데일리 관리", "트러블 관리", "두피 관리", "보습 관리", "클렌징 관리"],
      GR: ["면도 관리", "체취 관리", "구강 관리", "손톱·눈썹", "외출 준비"],
      BD: ["운동 관리", "자세 관리", "바디 케어", "회복 관리", "휴대·응급"],
      FD: ["영양 관리", "식단 조절", "수분 관리", "간식 관리", "음주 관리"],
      SL: ["수면관리", "침구·수면환경", "수면 데이터", "위생·관리", "회복 루틴"],
      MT: ["감정 기록", "집중 회복", "불안 완화", "루틴 재시작", "디지털 리셋"],
      ST: ["헤어 관리", "향 관리", "의류 관리", "스타일 점검", "외출 준비"],
      SO: ["첫인상", "관계 유지", "대화 관리", "갈등 관리", "감사·사과"],
      SP: ["공간 정리", "청소·위생", "환기·공기질", "수납 관리", "분위기 전환"],
      SY: ["기록 관리", "시간 관리", "체크리스트", "생산성", "루틴 설계"],
    };
    const preset = presets[domain] || [];
    const text = manuals.map((manual) => [manual.title, manual.summary, ...(manual.tags || [])].join(" ")).join(" ");
    const filtered = preset.filter((label) => {
      const compact = label.replace(/[·\s]/g, "");
      return text.includes(label) || text.replace(/[·\s/-]/g, "").includes(compact) || preset.length <= 5;
    });
    return (filtered.length ? filtered : preset).slice(0, 5);
  }

  function renderManualLibraryRow(manual, index, orderKey) {
    const stats = getManualStats(manual);
    return `
      <button class="manual-library-row clickable" draggable="true" data-open-type="manual" data-code="${esc(manual.code)}" data-sort-kind="manual" data-sort-group="${esc(orderKey)}" data-sort-code="${esc(manual.code)}">
        <span class="manual-row-icon">${esc(categoryVisual[manual.domain]?.icon || categoryIcon(manual.domain))}</span>
        <span class="manual-library-copy">
          <strong>${esc(manual.title)}</strong>
          <em>${esc(manual.summary || categoryVisual[manual.domain]?.desc || "")}</em>
          <small>연결 아이템 ${stats.items.length} · 연결 제품 ${stats.products.length} · 연결 루틴 ${stats.routines.length}</small>
        </span>
        <span class="tag">${esc((manual.tags || [categoryName(manual.domain)])[0])}</span>
        <span class="manual-row-metric"><small>조회</small><b>${(12.4 - index * .7).toFixed(1)}K</b></span>
        <span class="manual-row-metric"><small>좋아요</small><b>${Math.max(180, 820 - index * 47)}</b></span>
        <i aria-label="북마크">♡</i>
      </button>
    `;
  }

  function renderProductCollectionDetail() {
    const items = getItemLibraryItems();
    const stats = getItemProductHubStats(items);
    return `
      ${detailHeader("Item & Product Library", "전체 아이템 & 제품", "ALL")}
      <p>모든 카테고리의 Item을 먼저 보고, 각 Item 안에서 추천 Product Slot과 실제 제품으로 들어갑니다.</p>
      <div class="meta-line"><span>아이템 ${items.length}개</span><span>제품 슬롯 ${stats.slotCount}개</span><span>실제품 ${stats.productCount}개</span><span>연결 루틴 ${stats.routineCount}개</span></div>
      <div class="item-library-grid is-drawer">
        ${items.map(renderItemLibraryCard).join("")}
      </div>
    `;
  }

  function renderItemCategoryDetail(category) {
    if (!category) return `<div class="empty">아이템 카테고리를 찾을 수 없습니다.</div>`;
    const items = getItemLibraryItems(category.code);
    const stats = getItemProductHubStats(items);
    return `
      <article class="item-category-detail">
        <header class="manual-category-head item-category-detail-head">
          <div>
            <span class="breadcrumb">홈 › 아이템 &amp; 제품 백과 › ${esc(category.name)}</span>
            <h2>${esc(category.name)} Item Library</h2>
            <p>${esc(category.label)} 영역에서 무엇으로 관리할지 먼저 고르고, Item 안의 추천 슬롯과 실제 제품을 확인합니다.</p>
          </div>
          <div class="manual-category-stats">
            <span><small>아이템</small><b>${items.length}개</b></span>
            <span><small>제품 슬롯</small><b>${stats.slotCount}개</b></span>
            <span><small>실제 제품</small><b>${stats.productCount}개</b></span>
            <span><small>연결 루틴</small><b>${stats.routineCount}개</b></span>
          </div>
        </header>
        <div class="item-category-note">
          <strong>ITEM FIRST</strong>
          <span>Product Group은 독립 섹션이 아니라 Item 안의 추천 슬롯으로만 표시합니다.</span>
        </div>
        <div class="item-library-grid is-drawer" data-sort-container="${esc(cardOrderKey("item", category.code))}">
          ${items.map(renderItemLibraryCard).join("")}
        </div>
      </article>
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
    if (parts[0] === "productGroup") return parts[1] === "all" ? "전체 Product Slot" : `${categoryName(parts[1])} Product Slot`;
    if (parts[0] === "situation") return `${parts[1]} Situation`;
    return key;
  }

  function renderProductGroupList(title, groups, orderKey = cardOrderKey("productGroup", "all")) {
    if (!groups.length) return pendingBox("추천 제품 슬롯 연결 대기", "이 카테고리에 연결된 Item Product Slot이 아직 없습니다.");
    const orderedGroups = orderedCards(groups, orderKey, (group) => group.code);
    return `
      <section class="relation-list product-group-list" data-sort-container="${esc(orderKey)}">
        <h3>${esc(title)}</h3>
        ${orderedGroups.map((group) => `
          <button class="relation-button product-group-row" draggable="true" data-open-type="productGroup" data-code="${esc(group.code)}" data-sort-kind="productGroup" data-sort-group="${esc(orderKey)}" data-sort-code="${esc(group.code)}">
            <span>${esc(group.code)} · 추천 슬롯 ${getItemProductSlots(group).length}개</span>
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
    if (state.view === "myserkan") content.innerHTML = renderMySerkan();
    if (state.view === "guide") content.innerHTML = `${renderHero()}${renderGuide()}`;
    if (state.view === "search") content.innerHTML = renderSearch();
    updateActiveNav();
    renderDrawer();
    updateEditModeUI();
    publishSerkanContext({ reason: "render" });
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
      myserkan: "myserkan",
      guide: "guide",
    };
    const sideNavByView = {
      dashboard: "daily",
      manuals: "manuals",
      products: "products",
      situations: "situation",
      myserkan: "myserkan",
      guide: "guide",
    };
    const tabNav = topNavForState(tabNavByView[state.view]);
    const sideNav = state.navTarget || sideNavByView[state.view];
    if (tabNav) $$(`.tab[data-nav="${tabNav}"]`).forEach((el) => el.classList.add("active"));
    if (sideNav) $$(`.side-link[data-nav="${sideNav}"]`).forEach((el) => el.classList.add("active"));
  }

  function topNavForState(fallback) {
    if (["dashboard", "routine-system", "manuals", "items", "products", "brands", "ingredients", "situations", "myserkan", "guide"].includes(state.navTarget)) return state.navTarget;
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
      if (action === "toggle-routine-check") {
        event.stopPropagation();
        toggleRoutineDone(trigger.dataset.key, trigger.dataset.code);
        return;
      }
      if (action === "filter-routine-board") {
        state.routineFilters[trigger.dataset.board] = trigger.dataset.filter || "all";
        render();
        scrollAfterRender(`#${trigger.dataset.board}-board`, "auto");
        return;
      }
      if (action === "toggle-daily-cell") {
        event.preventDefault();
        event.stopPropagation();
        toggleDailyMatrixCell(trigger.dataset.row, trigger.dataset.domain);
        return;
      }
      if (action === "cycle-daily-focus") {
        event.preventDefault();
        const scrollY = window.scrollY;
        state.dailyActions.focusIndex = (Number(state.dailyActions.focusIndex) || 0) + 1;
        saveDailyActionState();
        render();
        restoreScroll(scrollY);
        showToast("오늘의 집중 영역을 변경했습니다.");
        return;
      }
      if (action === "log-daily-water") {
        event.preventDefault();
        const scrollY = window.scrollY;
        const current = Number(state.dailyActions.waterMl) || 0;
        state.dailyActions.waterMl = current >= 2000 ? 0 : Math.min(2000, current + 200);
        saveDailyActionState();
        render();
        restoreScroll(scrollY);
        showToast(state.dailyActions.waterMl ? `물 ${(state.dailyActions.waterMl / 1000).toFixed(1)}L 기록` : "물 챌린지를 다시 시작합니다.");
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
      if (action === "filter-encyclopedia") {
        event.preventDefault();
        const kind = trigger.dataset.kind;
        if (state.encyclopediaFilters[kind]) {
          state.encyclopediaFilters[kind].category = trigger.dataset.filter || "all";
          render();
          scrollAfterRender(kind === "brands" ? "#brands" : "#ingredients", "auto");
        }
        return;
      }
      if (action === "filter-brand-position") {
        event.preventDefault();
        state.encyclopediaFilters.brands.position = trigger.dataset.position || "all";
        render();
        scrollAfterRender("#brands", "auto");
        return;
      }
      if (action === "sort-encyclopedia") {
        const kind = trigger.dataset.kind;
        if (state.encyclopediaFilters[kind]) {
          state.encyclopediaFilters[kind].sort = trigger.value || "products";
          render();
          scrollAfterRender(kind === "brands" ? "#brands" : "#ingredients", "auto");
        }
        return;
      }
      if (action === "clear-recent") {
        event.preventDefault();
        event.stopPropagation();
        clearRecentItems();
        return;
      }
      if (action === "delete-recent") {
        event.preventDefault();
        event.stopPropagation();
        deleteRecentItem(trigger.dataset.recentType, trigger.dataset.code);
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
      if (action === "open-daily-streak") {
        openDetail("dailyStreak", "today");
        return;
      }
      if (action === "toggle-library-category") {
        event.preventDefault();
        toggleLibraryCategory(trigger.dataset.group, trigger.dataset.domain);
        return;
      }
      if (action === "scroll-library-category") {
        event.preventDefault();
        scrollLibraryCategory(trigger.dataset.group, trigger.dataset.domain);
        return;
      }
      if (action === "filter-manual-category") {
        event.preventDefault();
        const domain = trigger.dataset.domain;
        if (domain) {
          state.manualCategoryFilters[domain] = trigger.dataset.filter || "all";
          renderDrawer();
        }
        return;
      }
      if (action === "toggle-manual-category-sort") {
        event.preventDefault();
        const domain = trigger.dataset.domain;
        if (domain) {
          state.manualCategorySort[domain] = (state.manualCategorySort[domain] || "latest") === "latest" ? "default" : "latest";
          renderDrawer();
        }
        return;
      }
      if (action === "apply-manual-home-filter") {
        event.preventDefault();
        applyManualHomeFilterPanel(trigger.closest(".manual-side-card"));
        return;
      }
      if (action === "set-my-status") {
        event.preventDefault();
        updateMySerkanToday(trigger.dataset.field, trigger.dataset.value);
        return;
      }
      if (action === "toggle-my-goal") {
        event.preventDefault();
        toggleMySerkanGoal(trigger.dataset.goal);
        return;
      }
      if (action === "set-my-builder-filter") {
        event.preventDefault();
        setMySerkanBuilderFilter(trigger.dataset.filter);
        return;
      }
      if (action === "toggle-my-builder-routine") {
        event.preventDefault();
        toggleMySerkanBuilderRoutine(trigger.dataset.code);
        return;
      }
      if (action === "save-my-built-routine") {
        event.preventDefault();
        saveMySerkanBuiltRoutine();
        return;
      }
      if (action === "reset-manual-home-filter") {
        event.preventDefault();
        state.manualHomeFilters = { category: "all", purpose: "all", stage: "all" };
        render();
        scrollAfterRender("#manuals", "auto");
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
        openDetail("addRoutine", addRoutineDrawerCode("weekly", trigger.dataset.day || "월"));
        return;
      }
      if (action === "add-routine") {
        event.stopPropagation();
        const boardType = trigger.dataset.board || "weekly";
        state.navTarget = boardType === "situation" ? "situation" : boardType;
        openDetail("addRoutine", addRoutineDrawerCode(boardType, trigger.dataset.location));
        return;
      }
      if (action === "delete-custom-entry") {
        event.preventDefault();
        const entry = byCode.routines.get(trigger.dataset.code) || byCode.situations.get(trigger.dataset.code);
        if (!entry?.isCustom) return;
        const ok = window.confirm(`"${entry.title}" 사용자 추가 항목을 삭제할까요?`);
        if (!ok) return;
        const scrollTarget = addRoutineBoardMeta[entry.customType || entry.board]?.scrollTarget || ".hero-row";
        deleteCustomEntry(entry.code);
        closeDrawer();
        render();
        scrollAfterRender(scrollTarget, "auto");
        showToast("사용자 추가 항목을 삭제했습니다.");
      }
    });

    document.addEventListener("change", (event) => {
      const weeklyFocus = event.target.closest?.('[data-action="set-weekly-focus"]');
      if (weeklyFocus) {
        state.weeklyFocusCategory = weeklyFocus.value || "";
        state.routineFilters.weekly = state.weeklyFocusCategory || "all";
        saveWeeklyFocusCategory();
        render();
        scrollAfterRender("#weekly-board", "auto");
        return;
      }
      const monthlyFocus = event.target.closest?.('[data-action="set-monthly-focus"]');
      if (monthlyFocus) {
        state.monthlyFocus = monthlyFocus.value || "";
        saveMonthlyFocus();
        render();
        scrollAfterRender("#monthly-board", "auto");
        return;
      }
      const encyclopediaSort = event.target.closest?.('[data-action="sort-encyclopedia"]');
      if (encyclopediaSort) {
        const kind = encyclopediaSort.dataset.kind;
        if (state.encyclopediaFilters[kind]) {
          state.encyclopediaFilters[kind].sort = encyclopediaSort.value || "products";
          render();
          scrollAfterRender(kind === "brands" ? "#brands" : "#ingredients", "auto");
        }
        return;
      }
      const myProfile = event.target.closest?.("[data-my-profile-field]");
      if (myProfile) {
        updateMySerkanProfile(myProfile.dataset.myProfileField, myProfile.value);
        return;
      }
      const builderTitle = event.target.closest?.("[data-my-builder-title]");
      if (builderTitle) {
        updateMySerkanBuilder({ title: builderTitle.value });
        return;
      }
      const select = event.target.closest?.("[data-filter-field]");
      if (!select) return;
      const panel = select.closest(".manual-side-card");
      if (!panel || !panel.textContent.includes("매뉴얼 필터")) return;
      applyManualHomeFilterPanel(panel, "smooth");
    });

    document.addEventListener("submit", (event) => {
      const form = event.target.closest('[data-action="save-routine"]');
      if (!form) return;
      event.preventDefault();
      const entry = createCustomEntry(new FormData(form));
      if (!entry) {
        showToast("루틴 제목을 입력해주세요.");
        return;
      }
      closeDrawer();
      state.navTarget = entry.customType === "situation" ? "situation" : entry.board;
      render();
      scrollAfterRender(addRoutineBoardMeta[entry.customType || entry.board]?.scrollTarget || ".hero-row", "auto");
      showToast(`${addRoutineBoardMeta[entry.customType || entry.board]?.toastUnit || "Custom"} 항목을 추가했습니다.`);
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
    if (nav === "brands" || nav === "ingredients") {
      setView("products");
      scrollAfterRender(nav === "brands" ? "#brands" : "#ingredients");
      return;
    }
    if (nav === "weekly") {
      setView("dashboard");
      scrollAfterRender("#weekly-board");
      return;
    }
    if (nav === "daily") {
      setView("dashboard");
      scrollAfterRender("#daily-board");
      return;
    }
    if (["monthly", "seasonal"].includes(nav)) {
      setView("dashboard");
      scrollAfterRender(`#${nav}-board`);
      return;
    }
    if (nav === "guide") {
      setView("guide");
      scrollAfterRender("#guide");
      return;
    }
    if (nav === "myserkan") {
      setView("myserkan");
      scrollAfterRender(".my-serkan-page");
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
      ["products", "brands"],
      ["products", "ingredients"],
      ["myserkan", "myserkan"],
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
