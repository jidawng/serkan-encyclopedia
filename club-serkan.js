(function () {
  const CLIENT = getClientConfig();
  const PROFILE_KEY = scopedStorageKey("CLUB_SERKAN_PROFILE");
  const GOALS_KEY = scopedStorageKey("CLUB_SERKAN_GOALS");
  const ROUTINES_KEY = scopedStorageKey("CLUB_SERKAN_ROUTINES");
  const ROUTINE_CHECKS_KEY = scopedStorageKey("CLUB_SERKAN_ROUTINE_CHECKS");
  const PROGRESS_KEY = scopedStorageKey("CLUB_SERKAN_DAILY_PROGRESS");
  const DAILY_MUST_KEY = scopedStorageKey("CLUB_SERKAN_DAILY_MUST");
  const DAILY_REFLECTION_KEY = scopedStorageKey("CLUB_SERKAN_DAILY_REFLECTION");
  const COACHING_SETTINGS_KEY = scopedStorageKey("CLUB_SERKAN_COACHING_SETTINGS");
  const INITIAL_CALENDAR_YEAR = 2026;
  const INITIAL_CALENDAR_MONTH = 6;
  const ROUTINE_DAY_START_HOUR = 4;
  let TODAY_KEY = getRoutineDayKey();
  const COACHING_START_KEY = getCoachingStartKey();
  const OVERALL_GOAL_KEY = "__overall";
  const dailyMustStatuses = ["미완료", "진행중", "완료"];

  const sectors = [
    { key: "skin", label: "피부", icon: "💧" },
    { key: "grooming", label: "그루밍", icon: "🪒" },
    { key: "body", label: "체형", icon: "🏋️" },
    { key: "food", label: "식단", icon: "🍴" },
    { key: "sleep", label: "수면", icon: "🌙" },
    { key: "life", label: "생활", icon: "🏠" },
  ];

  const timeBlocks = [
    { key: "wake", label: "기상", time: "06:00 ~ 07:30", icon: "☀️" },
    { key: "work", label: "업무", time: "07:30 ~ 12:00", icon: "💼" },
    { key: "afternoon", label: "오후", time: "12:00 ~ 18:00", icon: "☀️" },
    { key: "evening", label: "저녁", time: "18:00 ~ 22:00", icon: "🌇" },
    { key: "sleep", label: "수면", time: "22:00 ~", icon: "🌙" },
  ];

  const profileFields = [
    { key: "name", label: "이름" },
    { key: "age", label: "나이" },
    { key: "job", label: "직업" },
    { key: "wakeTime", label: "기상 시간", icon: "☀️" },
    { key: "sleepTime", label: "취침 시간", icon: "🌙" },
    { key: "skinType", label: "피부 타입", icon: "💧" },
    { key: "exercise", label: "운동 빈도", icon: "🏋️" },
  ];

  const goalNoteConfig = {
    concerns: {
      label: "현재 고민",
      helper: "지금 가장 신경 쓰이는 문제를 빈도와 중요도까지 함께 정리합니다.",
      addLabel: "+ 고민 추가",
      examples: ["턱 여드름 반복", "세안 후 건조함", "선크림 습관 없음", "오후 유분감", "면도 후 트러블"],
      meta: [
        { key: "frequency", label: "빈도", options: ["매일", "자주", "주 3회", "가끔"] },
        { key: "importance", label: "중요도", options: ["높음", "중간", "낮음"] },
      ],
    },
    habits: {
      label: "현재 행동 / 습관",
      helper: "이미 하고 있는 행동과 유지 여부를 기록합니다.",
      addLabel: "+ 행동 추가",
      examples: ["아침 세안 생략", "저녁만 세안", "수분크림 사용 불규칙", "각질 제거 과다", "마스크 자주 착용"],
      meta: [
        { key: "frequency", label: "빈도", options: ["매일", "자주", "주 3회", "가끔"] },
        { key: "status", label: "유지 여부", options: ["진행 중", "줄이기", "중단"] },
      ],
    },
    changes: {
      label: "원하는 변화",
      helper: "2주 뒤 기대하는 변화를 우선순위로 정리합니다.",
      addLabel: "+ 변화 추가",
      examples: ["피부가 깨끗해 보이기", "여드름 자국 완화", "아침 피부 컨디션 개선", "피부 장벽 강화", "유분 밸런스 개선"],
      meta: [
        { key: "priority", label: "우선순위", options: ["1순위", "2순위", "3순위", "후순위"] },
      ],
    },
  };

  const overallGoalNoteConfig = {
    concerns: {
      ...goalNoteConfig.concerns,
      examples: ["아침에 자주 늦음", "수면 시간이 부족함", "루틴을 자주 빼먹음", "피부 컨디션이 불안정함", "방 정리가 안 됨"],
      meta: [],
    },
    changes: {
      ...goalNoteConfig.changes,
      examples: ["아침 준비 시간이 줄어들기", "선크림 습관 만들기", "수면 시간 확보", "피부 상태 안정화", "방을 정리된 상태로 유지하기"],
      meta: [],
    },
  };

  const lifestyleFields = [
    { key: "wakeTime", label: "기상 시간", icon: "☀️", type: "time" },
    { key: "sleepTime", label: "취침 시간", icon: "🌙", type: "time" },
    { key: "skinType", label: "피부 타입", icon: "💧", type: "select", options: ["건성", "지성", "복합성", "민감성", "잘 모름"] },
    { key: "exercise", label: "운동 빈도", icon: "🏋️", type: "select", options: ["안 함", "주 1회", "주 2~3회", "주 4회 이상"] },
  ];

  const conditionFields = [
    { key: "condition", label: "컨디션", icon: "🙂", options: ["좋음", "보통", "낮음"] },
    { key: "stress", label: "스트레스", icon: "🧠", options: ["낮음", "보통", "높음"] },
    { key: "sleepState", label: "수면 상태", icon: "🌙", options: ["충분", "보통", "부족"] },
    { key: "skinState", label: "피부 상태", icon: "💧", options: ["좋음", "보통", "나쁨"] },
  ];

  const state = {
    profile: getProfile(),
    goals: getGoals(),
    dailyMust: getDailyMust(),
    reflections: getDailyReflections(),
    routines: getRoutines(),
    checks: getRoutineChecks(),
    progress: getDailyProgress(),
    coachingSettings: getCoachingSettings(),
    editingProfile: false,
    editingGoals: false,
    activeProfileField: null,
    activeConditionField: null,
    editingRoutineId: null,
    activeGoalSector: null,
    activeDay: null,
    activeDayMode: "reader",
    sheetContext: { timeBlock: "wake", sector: "skin" },
    activeCell: null,
    highlightCellKey: "",
    highlightedRoutineId: "",
    calendarYear: INITIAL_CALENDAR_YEAR,
    calendarMonth: INITIAL_CALENDAR_MONTH,
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function getClientConfig() {
    const params = new URLSearchParams(window.location.search);
    const rawId = params.get("client") || document.body?.dataset.clientId || "default";
    const id = String(rawId || "default")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "default";
    const rawLabel = params.get("name") || document.body?.dataset.clientLabel || "";
    const label = rawLabel.trim() || clientLabelFromId(id);
    return { id, label };
  }

  function clientLabelFromId(id) {
    if (id === "default") return "기본";
    return id
      .split(/[-_]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function scopedStorageKey(key) {
    return CLIENT.id === "default" ? key : `${key}__${CLIENT.id}`;
  }

  function applyClientIdentity() {
    if (CLIENT.id === "default") return;
    document.title = `CLUB SERKAN : ${CLIENT.label} ROUTINE FACE MAKER`;
    const mobileBrand = $(".mobile-brand span");
    const desktopKicker = $(".club-kicker");
    if (mobileBrand) mobileBrand.textContent = `CLUB SERKAN · ${CLIENT.label}`;
    if (desktopKicker) desktopKicker.textContent = `CLUB SERKAN · ${CLIENT.label}`;
  }

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getProfile() {
    return {
      name: "",
      age: "",
      job: "",
      wakeTime: "",
      sleepTime: "",
      skinType: "",
      exercise: "",
      memo: "",
      condition: "",
      stress: "",
      sleepState: "",
      skinState: "",
      photo: "",
      ...readJson(PROFILE_KEY, {}),
    };
  }

  function saveProfile(profile) {
    state.profile = { ...state.profile, ...profile };
    writeJson(PROFILE_KEY, state.profile);
  }

  function saveProfileField(key, value) {
    const nextValue = String(value || "").trim();
    state.profile = { ...state.profile, [key]: nextValue };
    writeJson(PROFILE_KEY, state.profile);
  }

  function getCoachingSettings() {
    const stored = readJson(COACHING_SETTINGS_KEY, {});
    const status = stored?.todayStatus === "checked" ? "checked" : "unchecked";
    const nextCheckDate = /^\d{4}-\d{2}-\d{2}$/.test(stored?.nextCheckDate || "")
      ? stored.nextCheckDate
      : nextCoachingCheckDate(TODAY_KEY);
    return { todayStatus: status, nextCheckDate };
  }

  function saveCoachingSettings(patch) {
    state.coachingSettings = {
      ...state.coachingSettings,
      ...patch,
    };
    writeJson(COACHING_SETTINGS_KEY, state.coachingSettings);
  }

  function getGoals() {
    const stored = readJson(GOALS_KEY, {});
    return {
      [OVERALL_GOAL_KEY]: normalizeGoalEntry(stored?.[OVERALL_GOAL_KEY]),
      ...Object.fromEntries(sectors.map((sector) => [
        sector.key,
        normalizeGoalEntry(stored?.[sector.key]),
      ])),
    };
  }

  function saveGoals(goals) {
    state.goals = {
      [OVERALL_GOAL_KEY]: normalizeGoalEntry({
        ...(state.goals[OVERALL_GOAL_KEY] || {}),
        ...(goals[OVERALL_GOAL_KEY] || {}),
      }),
      ...Object.fromEntries(sectors.map((sector) => [
        sector.key,
        normalizeGoalEntry({ ...(state.goals[sector.key] || {}), ...(goals[sector.key] || {}) }),
      ])),
    };
    writeJson(GOALS_KEY, state.goals);
  }

  function getDailyMust() {
    const stored = readJson(DAILY_MUST_KEY, {});
    return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
  }

  function getDailyReflections() {
    const stored = readJson(DAILY_REFLECTION_KEY, {});
    return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
  }

  function getDailyReflection(dateKey = TODAY_KEY) {
    return String(state.reflections?.[dateKey] || "");
  }

  function saveDailyReflection(dateKey = TODAY_KEY, reflection = "") {
    state.reflections = {
      ...state.reflections,
      [dateKey]: String(reflection || "").trim(),
    };
    writeJson(DAILY_REFLECTION_KEY, state.reflections);
  }

  function defaultDailyMustSlot(index) {
    return {
      sector: index === 0 ? "skin" : "sleep",
      title: "",
      status: "미완료",
    };
  }

  function normalizeDailyMustEntry(entry, index = 0) {
    const validKeys = new Set(sectors.map((sector) => sector.key));
    const fallback = defaultDailyMustSlot(index);
    const status = dailyMustStatuses.includes(entry?.status) ? entry.status : fallback.status;
    return {
      sector: validKeys.has(entry?.sector) ? entry.sector : fallback.sector,
      title: String(entry?.title || "").trim(),
      status,
    };
  }

  function normalizeDailyMustSlots(slots) {
    const list = Array.isArray(slots) ? slots : [];
    return [0, 1].map((index) => normalizeDailyMustEntry(list[index], index));
  }

  function getDailyMustForDate(dateKey = TODAY_KEY) {
    // "금일 필수 루틴" is intentionally scoped to routineDayKey.
    // The content and status reset when a new routine day starts at 04:00.
    return normalizeDailyMustSlots(state.dailyMust?.[dateKey]);
  }

  function saveDailyMust(dateKey, slots, options = {}) {
    const normalized = normalizeDailyMustSlots(slots);
    state.dailyMust = { ...state.dailyMust, [dateKey]: normalized };
    writeJson(DAILY_MUST_KEY, state.dailyMust);
  }

  function updateDailyMustSlot(slotIndex, patch, options = {}) {
    const slots = getDailyMustForDate(TODAY_KEY);
    const index = Number.isFinite(slotIndex) ? Math.max(0, Math.min(1, slotIndex)) : 0;
    slots[index] = normalizeDailyMustEntry({ ...slots[index], ...patch }, index);
    saveDailyMust(TODAY_KEY, slots, options);
  }

  function normalizeGoalEntry(entry) {
    if (typeof entry === "string") {
      return { goal: entry, concerns: [], habits: [], changes: [], memo: "" };
    }
    return {
      goal: String(entry?.goal || "").trim(),
      concerns: normalizeGoalItems("concerns", entry?.concerns),
      habits: normalizeGoalItems("habits", entry?.habits),
      changes: normalizeGoalItems("changes", entry?.changes),
      memo: String(entry?.memo || "").trim(),
    };
  }

  function normalizeGoalItems(field, value) {
    const list = Array.isArray(value) ? value : splitLines(value);
    return list
      .map((item, index) => normalizeGoalItem(field, item, index))
      .filter((item) => item.text);
  }

  function normalizeGoalItem(field, item, index = 0) {
    const source = typeof item === "string" ? { text: item } : item || {};
    const text = String(source.text || source.value || source.label || "").trim();
    if (field === "concerns") {
      return {
        text,
        frequency: source.frequency || (index < 2 ? "매일" : "자주"),
        importance: source.importance || (index === 0 ? "높음" : "중간"),
      };
    }
    if (field === "habits") {
      const status = source.status === "중단 후보" ? "중단" : source.status;
      return {
        text,
        frequency: source.frequency || (index < 2 ? "매일" : "주 3회"),
        status: status || "진행 중",
      };
    }
    if (field === "changes") {
      return {
        text,
        priority: source.priority || `${Math.min(index + 1, 3)}순위`,
      };
    }
    return { text };
  }

  function splitLines(value) {
    return String(value || "")
      .split("\n")
      .map((line) => line.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean);
  }

  function goalTitle(sectorKey) {
    return state.goals[sectorKey]?.goal || "";
  }

  function goalSubjectByKey(key) {
    if (key === OVERALL_GOAL_KEY) {
      return { key: OVERALL_GOAL_KEY, label: "루틴 목표", icon: "🎯" };
    }
    return sectorByKey(key);
  }

  function goalStatus(goal, key = "") {
    const hasGoal = Boolean(goal?.goal);
    const contextCount = key === OVERALL_GOAL_KEY
      ? (goal?.concerns?.length || 0) + (goal?.changes?.length || 0)
      : (goal?.concerns?.length || 0) + (goal?.habits?.length || 0) + (goal?.changes?.length || 0);
    if (hasGoal && contextCount >= 2) return { label: "설정 완료", tone: "done" };
    if (hasGoal || contextCount || goal?.memo) return { label: "작성 중", tone: "draft" };
    return { label: "미입력", tone: "empty" };
  }

  function getRoutines() {
    const routines = readJson(ROUTINES_KEY, []);
    return Array.isArray(routines) ? routines : [];
  }

  function getRoutineDayKey(date = new Date()) {
    const routineDate = new Date(date);
    if (routineDate.getHours() < ROUTINE_DAY_START_HOUR) {
      routineDate.setDate(routineDate.getDate() - 1);
    }
    const year = routineDate.getFullYear();
    const month = String(routineDate.getMonth() + 1).padStart(2, "0");
    const day = String(routineDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function syncRoutineDayKey() {
    const nextKey = getRoutineDayKey();
    if (nextKey === TODAY_KEY) return false;
    saveDailyProgress(calculateBoardProgress(TODAY_KEY), TODAY_KEY);
    TODAY_KEY = nextKey;
    state.calendarYear = Number(TODAY_KEY.slice(0, 4));
    state.calendarMonth = Number(TODAY_KEY.slice(5, 7));
    state.activeDay = null;
    return true;
  }

  function getCoachingStartKey() {
    const key = scopedStorageKey("CLUB_SERKAN_COACHING_START");
    const stored = localStorage.getItem(key);
    if (/^\d{4}-\d{2}-\d{2}$/.test(stored || "")) return stored;
    localStorage.setItem(key, TODAY_KEY);
    return TODAY_KEY;
  }

  function getRoutineChecks() {
    const checks = readJson(ROUTINE_CHECKS_KEY, {});
    return checks && typeof checks === "object" && !Array.isArray(checks) ? checks : {};
  }

  function saveRoutineChecks() {
    writeJson(ROUTINE_CHECKS_KEY, state.checks);
  }

  function getDayChecks(dateKey = TODAY_KEY) {
    const checks = state.checks?.[dateKey];
    return checks && typeof checks === "object" && !Array.isArray(checks) ? checks : {};
  }

  function isRoutineDoneOnDate(routineId, dateKey = TODAY_KEY) {
    const checks = getDayChecks(dateKey);
    return Object.prototype.hasOwnProperty.call(checks, routineId) ? Boolean(checks[routineId]) : false;
  }

  function saveRoutine(routine) {
    const normalized = normalizeRoutine(routine);
    state.routines = [normalized, ...state.routines].slice(0, 80);
    writeJson(ROUTINES_KEY, state.routines);
    saveDailyProgress(calculateBoardProgress(TODAY_KEY), TODAY_KEY);
    return normalized;
  }

  function updateRoutine(id, patch) {
    const current = state.routines.find((routine) => routine.id === id);
    if (!current) return null;
    const updated = normalizeRoutine({ ...current, ...patch, id: current.id, createdAt: current.createdAt });
    state.routines = state.routines.map((routine) => routine.id === id ? updated : routine);
    writeJson(ROUTINES_KEY, state.routines);
    saveDailyProgress(calculateBoardProgress(TODAY_KEY), TODAY_KEY);
    return updated;
  }

  function deleteRoutine(id) {
    state.routines = state.routines.filter((routine) => routine.id !== id);
    state.checks = Object.fromEntries(Object.entries(state.checks || {}).map(([dateKey, checks]) => {
      const nextChecks = { ...(checks || {}) };
      delete nextChecks[id];
      return [dateKey, nextChecks];
    }));
    writeJson(ROUTINES_KEY, state.routines);
    saveRoutineChecks();
    saveDailyProgress(calculateBoardProgress(TODAY_KEY), TODAY_KEY);
  }

  function getDailyProgress() {
    return readJson(PROGRESS_KEY, {});
  }

  function saveDailyProgress(progress, dateKey = TODAY_KEY) {
    state.progress = { ...state.progress, [dateKey]: buildProgressSnapshot(progress, dateKey) };
    writeJson(PROGRESS_KEY, state.progress);
  }

  function saveDayNote(dateKey, note) {
    const current = dateKey === TODAY_KEY
      ? buildProgressSnapshot(calculateBoardProgress(TODAY_KEY), TODAY_KEY)
      : state.progress?.[dateKey] || { total: 0, done: 0, inProgress: 0, todo: 0, rate: 0 };
    state.progress = {
      ...state.progress,
      [dateKey]: {
        ...current,
        note: String(note || ""),
        savedAt: new Date().toISOString(),
      },
    };
    writeJson(PROGRESS_KEY, state.progress);
  }

  function saveCoachFeedback(dateKey, feedback) {
    const current = dateKey === TODAY_KEY
      ? buildProgressSnapshot(calculateBoardProgress(TODAY_KEY), TODAY_KEY)
      : state.progress?.[dateKey] || { total: 0, done: 0, inProgress: 0, todo: 0, rate: 0 };
    state.progress = {
      ...state.progress,
      [dateKey]: {
        ...current,
        coachFeedback: String(feedback || ""),
        savedAt: new Date().toISOString(),
      },
    };
    writeJson(PROGRESS_KEY, state.progress);
  }

  function buildProgressSnapshot(progress = calculateBoardProgress(TODAY_KEY), dateKey = TODAY_KEY) {
    return {
      ...progress,
      routineDayKey: dateKey,
      sectors: Object.fromEntries(sectors.map((sector) => [sector.key, calculateSectorProgress(sector.key, dateKey)])),
      timeBlocks: Object.fromEntries(timeBlocks.map((block) => [block.key, calculateTimeBlockProgress(block.key, dateKey)])),
      routines: state.routines.map((routine) => ({
        id: routine.id,
        title: routine.title,
        timeBlock: routine.timeBlock,
        sector: routine.sector,
        duration: routine.duration,
        frequency: routine.frequency,
        status: isRoutineDoneOnDate(routine.id, dateKey) ? "완료" : "미완료",
        completed: isRoutineDoneOnDate(routine.id, dateKey),
      })),
      note: state.progress?.[dateKey]?.note || "",
      coachFeedback: state.progress?.[dateKey]?.coachFeedback || "",
      reflection: getDailyReflection(dateKey),
      savedAt: new Date().toISOString(),
    };
  }

  function calculateCompletionRate(routines = state.routines, dateKey = TODAY_KEY) {
    const total = routines.length;
    const done = routines.filter((routine) => isRoutineDoneOnDate(routine.id, dateKey)).length;
    const inProgress = 0;
    const todo = Math.max(total - done, 0);
    return {
      total,
      done,
      inProgress,
      todo,
      rate: total ? Math.round((done / total) * 100) : 0,
    };
  }

  function calculateBoardProgress(dateKey = TODAY_KEY) {
    return calculateCompletionRate(state.routines, dateKey);
  }

  function calculateSectorProgress(sectorKey, dateKey = TODAY_KEY) {
    return calculateCompletionRate(state.routines.filter((routine) => routine.sector === sectorKey), dateKey);
  }

  function calculateTimeBlockProgress(timeBlockKey, dateKey = TODAY_KEY) {
    return calculateCompletionRate(state.routines.filter((routine) => routine.timeBlock === timeBlockKey), dateKey);
  }

  function getCellRoutines(timeBlockKey, sectorKey) {
    return state.routines.filter((routine) => routine.timeBlock === timeBlockKey && routine.sector === sectorKey);
  }

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function dateKeyForDay(day, year = state.calendarYear, month = state.calendarMonth) {
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  function addDaysToDateKey(dateKey, offset) {
    const date = new Date(`${dateKey}T00:00:00`);
    date.setDate(date.getDate() + offset);
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  }

  function coachingDateKey(dayNumber) {
    return addDaysToDateKey(COACHING_START_KEY, Math.max(0, dayNumber - 1));
  }

  function coachingDayNumber(dateKey = TODAY_KEY) {
    const start = new Date(`${COACHING_START_KEY}T00:00:00`);
    const current = new Date(`${dateKey}T00:00:00`);
    const diff = Math.floor((current - start) / 86400000) + 1;
    return Math.max(1, Math.min(14, diff));
  }

  function compactDateLabel(dateKey) {
    const [, month, day] = String(dateKey || "").split("-");
    return `${Number(month)}.${Number(day)}`;
  }

  function daysInMonth(year = state.calendarYear, month = state.calendarMonth) {
    return new Date(year, month, 0).getDate();
  }

  function firstDayOffset(year = state.calendarYear, month = state.calendarMonth) {
    return new Date(year, month - 1, 1).getDay();
  }

  function calendarMonthLabel(year = state.calendarYear, month = state.calendarMonth) {
    return `${year}년 ${month}월`;
  }

  function isVisibleCalendarMonth(dateKey) {
    const [year, month] = String(dateKey || "").split("-").map(Number);
    return year === state.calendarYear && month === state.calendarMonth;
  }

  function getDayProgress(dateKey) {
    if (dateKey === TODAY_KEY) return buildProgressSnapshot(calculateBoardProgress(TODAY_KEY), TODAY_KEY);
    if (state.progress?.[dateKey]) return state.progress[dateKey];
    if (state.checks?.[dateKey]) return buildProgressSnapshot(calculateBoardProgress(dateKey), dateKey);
    return null;
  }

  function calendarProgressEntries() {
    const entries = { ...(state.progress || {}) };
    entries[TODAY_KEY] = buildProgressSnapshot(calculateBoardProgress(TODAY_KEY), TODAY_KEY);
    return Object.entries(entries)
      .filter(([dateKey, entry]) => (
        isVisibleCalendarMonth(dateKey)
        && Number(entry?.total || 0) > 0
        && Number.isFinite(Number(entry?.rate))
      ))
      .map(([, entry]) => entry);
  }

  function progressEntryForDate(dateKey) {
    if (dateKey === TODAY_KEY) return buildProgressSnapshot(calculateBoardProgress(TODAY_KEY), TODAY_KEY);
    return state.progress?.[dateKey] || null;
  }

  function calculateStreakDays(dateKey = TODAY_KEY) {
    let streak = 0;
    let cursor = dateKey;
    while (streak < 14) {
      const progress = progressEntryForDate(cursor);
      if (!progress || Number(progress.total || 0) === 0 || Number(progress.rate || 0) === 0) break;
      streak += 1;
      cursor = addDaysToDateKey(cursor, -1);
    }
    return streak;
  }

  function nextCoachingCheckDate(dateKey = TODAY_KEY) {
    const currentDay = coachingDayNumber(dateKey);
    const checkpoints = [3, 7, 10, 14];
    const nextDay = checkpoints.find((day) => day >= currentDay) || 14;
    return coachingDateKey(nextDay);
  }

  function progressLevel(rate) {
    const value = Number(rate || 0);
    if (value >= 80) return 4;
    if (value >= 60) return 3;
    if (value >= 40) return 2;
    if (value >= 20) return 1;
    return 0;
  }

  function formatDateLabel(dateKey) {
    const date = new Date(`${dateKey}T00:00:00`);
    const weekday = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"][date.getDay()];
    const [year, month, day] = dateKey.split("-");
    return `${year}.${month}.${day} ${weekday}`;
  }

  function cellKey(timeBlockKey, sectorKey) {
    return `${timeBlockKey}:${sectorKey}`;
  }

  function toggleRoutineComplete(id) {
    const routine = state.routines.find((entry) => entry.id === id);
    if (!routine) return;
    const dayChecks = { ...getDayChecks(TODAY_KEY) };
    dayChecks[id] = !isRoutineDoneOnDate(id, TODAY_KEY);
    state.checks = { ...state.checks, [TODAY_KEY]: dayChecks };
    saveRoutineChecks();
    state.highlightCellKey = cellKey(routine.timeBlock, routine.sector);
    state.highlightedRoutineId = id;
    saveDailyProgress(calculateBoardProgress(TODAY_KEY), TODAY_KEY);
  }

  function createId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function normalizeRoutine(input) {
    const now = new Date().toISOString();
    return {
      id: input.id || createId("routine"),
      timeBlock: input.timeBlock || "wake",
      sector: input.sector || "skin",
      title: String(input.title || "").trim(),
      action: String(input.action || "").trim(),
      duration: String(input.duration || "").trim(),
      frequency: String(input.frequency || "").trim(),
      status: input.status || "미완료",
      memo: String(input.memo || "").trim(),
      createdAt: input.createdAt || now,
      updatedAt: now,
    };
  }

  function cleanRoutineMeta(value) {
    const text = String(value || "").trim();
    if (!text || text.includes("미정")) return "";
    return text;
  }

  function getRoutineDisplayMeta(routine) {
    return cleanRoutineMeta(routine.duration) || cleanRoutineMeta(routine.frequency);
  }

  function sectorByKey(key) {
    return sectors.find((sector) => sector.key === key) || sectors[0];
  }

  function timeBlockByKey(key) {
    return getDisplayTimeBlocks().find((block) => block.key === key) || getDisplayTimeBlocks()[0];
  }

  function parseClock(value, fallbackMinutes) {
    const match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return fallbackMinutes;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (Number.isNaN(hours) || Number.isNaN(minutes) || hours > 23 || minutes > 59) return fallbackMinutes;
    return hours * 60 + minutes;
  }

  function formatClock(totalMinutes) {
    const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
    const hours = Math.floor(normalized / 60);
    const minutes = normalized % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  function getDisplayTimeBlocks() {
    const wakeStart = parseClock(state.profile.wakeTime, 6 * 60);
    const sleepStart = parseClock(state.profile.sleepTime, 22 * 60);
    const wakeEnd = wakeStart + 90;
    return timeBlocks.map((block) => {
      if (block.key === "wake") return { ...block, time: `${formatClock(wakeStart)} ~ ${formatClock(wakeEnd)}` };
      if (block.key === "work") return { ...block, time: `${formatClock(wakeEnd)} ~ 12:00` };
      if (block.key === "evening") return { ...block, time: `18:00 ~ ${formatClock(sleepStart)}` };
      if (block.key === "sleep") return { ...block, time: `${formatClock(sleepStart)} ~` };
      return block;
    });
  }

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function conditionTone(value) {
    if (["좋음", "충분", "낮음"].includes(value)) return "good";
    if (["높음", "부족", "나쁨"].includes(value)) return "high";
    return "warn";
  }

  function lifestyleControl(field, value) {
    const common = `id="profile-${esc(field.key)}" data-profile-field="${esc(field.key)}" data-quick-profile-field="${esc(field.key)}" aria-label="${esc(field.label)}"`;
    if (field.type === "select") {
      return `
        <select ${common}>
          <option value="">입력 전</option>
          ${(field.options || []).map((option) => `<option value="${esc(option)}" ${option === value ? "selected" : ""}>${esc(option)}</option>`).join("")}
        </select>
      `;
    }
    return `<input ${common} type="${field.type || "text"}" value="${esc(value)}" placeholder="입력 전">`;
  }

  function renderProfile() {
    const card = $("#profile");
    const fields = $("#profile-fields");
    const main = $("#profile-main");
    const dailyMustList = $("#daily-must-list");
    const conditionList = $("#condition-list");
    const avatar = $("#profile-avatar");
    if (!card || !fields || !main || !dailyMustList || !conditionList || !avatar) return;
    card.classList.toggle("is-editing", state.editingProfile);
    avatar.innerHTML = state.profile.photo ? `<img src="${esc(state.profile.photo)}" alt="프로필 사진">` : "📷";
    const deletePhotoButton = $("#delete-photo-button");
    if (deletePhotoButton) deletePhotoButton.disabled = !state.profile.photo;

    const name = state.profile.name || "이름 입력 전";
    const age = state.profile.age || "나이 입력 전";
    const job = state.profile.job || "직업 입력 전";
    const memo = state.profile.memo || "아침 시간이 부족하지만 꾸준한 루틴을 만들고 싶어요.";

    main.innerHTML = `
      <div class="profile-name-row">
        <strong>${esc(name)}</strong>
        <input id="profile-name" data-profile-field="name" value="${esc(state.profile.name || "")}" placeholder="이름">
      </div>
      <div class="profile-meta">
        <span>${esc(age)} · ${esc(job)}</span>
        <input data-profile-field="age" value="${esc(state.profile.age || "")}" placeholder="나이">
        <input data-profile-field="job" value="${esc(state.profile.job || "")}" placeholder="직업">
      </div>
      <div class="coaching-memo">
        <span>${esc(memo)}</span>
        <textarea data-profile-field="memo" placeholder="짧은 코칭 메모를 입력하세요.">${esc(state.profile.memo || "")}</textarea>
      </div>
    `;

    fields.innerHTML = lifestyleFields.map((field) => {
      const value = state.profile[field.key] || "";
      const active = state.editingProfile || state.activeProfileField === field.key;
      return `
        <div class="profile-field ${value ? "" : "is-empty"} ${active ? "is-inline-edit" : ""}" role="button" tabindex="0" data-action="edit-profile-field" data-field="${esc(field.key)}" aria-label="${esc(`${field.label} ${value || "입력 전"}`)}">
          <div style="font-size:25px;">${esc(field.icon)}</div>
          <label for="profile-${esc(field.key)}">${esc(field.label)}</label>
          <span>${esc(value || "입력 전")}</span>
          ${lifestyleControl(field, value)}
          ${active && value ? `<button class="profile-inline-reset" type="button" data-action="clear-profile-field" data-field="${esc(field.key)}" aria-label="${esc(field.label)} 입력 전으로 변경">입력 전</button>` : ""}
          ${active && !state.editingProfile ? `<button class="profile-inline-cancel" type="button" data-action="cancel-profile-field" aria-label="${esc(field.label)} 입력 취소">취소</button>` : ""}
        </div>
      `;
    }).join("");

    const dailyMustSlots = getDailyMustForDate(TODAY_KEY);
    dailyMustList.innerHTML = dailyMustSlots.map((slot, index) => {
      const sector = sectorByKey(slot.sector);
      const isEmpty = !slot.title;
      return `
        <div class="daily-must-card ${isEmpty ? "is-empty" : ""}">
          <span class="daily-must-icon">${esc(sector.icon)}</span>
          <div class="daily-must-body">
            <div class="daily-must-controls">
              <select class="daily-must-sector" data-daily-must-field="sector" data-slot="${index}" aria-label="필수 루틴 ${index + 1} 섹터 선택">
                ${sectors.map((option) => `<option value="${esc(option.key)}" ${option.key === slot.sector ? "selected" : ""}>${esc(option.label)}</option>`).join("")}
              </select>
              <select class="daily-must-status ${slot.status === "완료" ? "done" : slot.status === "진행중" ? "doing" : ""}" data-daily-must-field="status" data-slot="${index}" aria-label="필수 루틴 ${index + 1} 상태 선택">
                ${dailyMustStatuses.map((status) => `<option value="${esc(status)}" ${status === slot.status ? "selected" : ""}>${esc(status)}</option>`).join("")}
              </select>
            </div>
            <input class="daily-must-input" data-daily-must-field="title" data-slot="${index}" value="${esc(slot.title)}" placeholder="오늘 반드시 할 루틴을 입력하세요.">
          </div>
          <span class="daily-must-date">${esc(TODAY_KEY.slice(5).replace("-", "."))}</span>
        </div>
      `;
    }).join("");

    conditionList.innerHTML = conditionFields.map((field) => {
      const value = state.profile[field.key] || "보통";
      const tone = conditionTone(value);
      const active = state.editingProfile || state.activeConditionField === field.key;
      return `
        <div class="condition-row ${active ? "is-inline-edit" : ""}" role="button" tabindex="0" data-action="edit-condition-field" data-field="${esc(field.key)}" aria-label="${esc(`${field.label} ${value}`)}">
          <span>${esc(field.icon)}</span>
          <strong>${esc(field.label)}</strong>
          <span class="condition-badge ${tone}">${esc(value)}</span>
          <select class="${tone}" data-profile-field="${esc(field.key)}" data-quick-profile-field="${esc(field.key)}" aria-label="${esc(field.label)}">
            ${field.options.map((option) => `<option value="${esc(option)}" ${option === value ? "selected" : ""}>${esc(option)}</option>`).join("")}
          </select>
          ${active && !state.editingProfile ? `<button class="profile-inline-cancel condition-cancel" type="button" data-action="cancel-profile-field" aria-label="${esc(field.label)} 입력 취소">취소</button>` : ""}
        </div>
      `;
    }).join("");

    const button = $('[data-action="toggle-profile-edit"]');
    if (button) button.innerHTML = state.editingProfile ? "저장" : "✎ 수정";
  }

  function renderGoals() {
    const list = $("#goal-list");
    if (!list) return;
    const overallGoal = normalizeGoalEntry(state.goals[OVERALL_GOAL_KEY]);
    const overallStatus = goalStatus(overallGoal, OVERALL_GOAL_KEY);
    const overallCard = `
      <button class="goal-card goal-overall ${overallStatus.tone}" data-action="open-goal-detail" data-sector="${OVERALL_GOAL_KEY}">
        <span class="goal-icon">🎯</span>
        <span class="goal-card-main">
          <strong>루틴 목표</strong>
          <small>이번 루틴의 상위 방향</small>
          <b>${esc(overallGoal.goal || "이번 루틴으로 만들고 싶은 변화를 입력하세요.")}</b>
        </span>
        <span class="goal-status ${overallStatus.tone}">${esc(overallStatus.label)}</span>
        <span class="goal-arrow" aria-hidden="true">›</span>
      </button>
    `;
    const sectorCards = sectors.map((sector) => {
      const goal = normalizeGoalEntry(state.goals[sector.key]);
      const status = goalStatus(goal, sector.key);
      const routineCount = state.routines.filter((routine) => routine.sector === sector.key).length;
      return `
        <button class="goal-card ${status.tone}" data-action="open-goal-detail" data-sector="${esc(sector.key)}">
          <span class="goal-icon">${esc(sector.icon)}</span>
          <span class="goal-card-main">
            <strong>${esc(sector.label)}</strong>
            <small>목표</small>
            <b>${esc(goal.goal || "목표를 입력하세요.")}</b>
          </span>
          <span class="goal-card-meta concern-meta">고민 ${goal.concerns.length}개</span>
          <span class="goal-card-meta routine-meta">루틴 ${routineCount}개</span>
          <span class="goal-status ${status.tone}">${esc(status.label)}</span>
          <span class="goal-arrow" aria-hidden="true">›</span>
        </button>
      `;
    }).join("");
    list.innerHTML = `${overallCard}<div class="goal-subtitle-row">섹터별 세부 목표</div>${sectorCards}`;
  }

  function renderBoard() {
    const grid = $("#routine-board-grid");
    if (!grid) return;
    const displayTimeBlocks = getDisplayTimeBlocks();
    const head = [
      `<div class="board-head-cell">시간대</div>`,
      ...sectors.map((sector) => `<div class="board-head-cell">${esc(sector.icon)} ${esc(sector.label)}</div>`),
      `<div class="board-head-cell">시간대 달성률</div>`,
    ].join("");

    const rows = displayTimeBlocks.map((block) => {
      const cells = sectors.map((sector) => {
        const routines = getCellRoutines(block.key, sector.key);
        const progress = calculateCompletionRate(routines);
        const visibleRoutines = routines.slice(0, 2);
        const hiddenCount = Math.max(routines.length - visibleRoutines.length, 0);
        const rateClass = progress.total === 0 ? "cell-empty" : progress.rate === 100 ? "cell-done" : "cell-partial";
        const isHighlighted = state.highlightCellKey === cellKey(block.key, sector.key);
        return `
          <div class="routine-cell ${rateClass} ${isHighlighted ? "is-highlighted" : ""}" data-time="${esc(block.key)}" data-sector="${esc(sector.key)}">
            <div class="cell-summary">${progress.total ? `${progress.done}/${progress.total}` : "루틴 없음"}</div>
            <div class="cell-routine-list">
              ${visibleRoutines.map(renderRoutinePill).join("")}
              ${hiddenCount ? `<button class="cell-more-button" data-action="open-cell-drawer" data-time="${esc(block.key)}" data-sector="${esc(sector.key)}">+${hiddenCount}개 더보기</button>` : ""}
            </div>
            <button class="add-cell" data-action="open-add-sheet" data-time="${esc(block.key)}" data-sector="${esc(sector.key)}" data-hint="${esc(`${block.label} 시간대 ${sector.label} 루틴 추가`)}"><b>+</b><span>루틴 추가</span></button>
          </div>
        `;
      }).join("");
      const timeProgress = calculateTimeBlockProgress(block.key);
      return `
        <div class="time-cell"><strong>${esc(block.icon)} ${esc(block.label)}</strong><span>${esc(block.time)}</span></div>
        ${cells}
        <div class="time-progress-cell">
          <div>
            <strong>${timeProgress.total ? `${timeProgress.done}/${timeProgress.total}` : "0/0"}</strong>
            <span>${timeProgress.total ? `${timeProgress.rate}%` : "루틴 없음"}</span>
            <div class="time-progress-track"><i style="--value:${timeProgress.rate}%;"></i></div>
          </div>
        </div>
      `;
    }).join("");

    grid.innerHTML = head + rows;
  }

  function renderRoutinePill(routine) {
    const done = isRoutineDoneOnDate(routine.id, TODAY_KEY);
    const meta = getRoutineDisplayMeta(routine);
    const highlighted = state.highlightedRoutineId === routine.id;
    return `
      <article class="routine-pill ${done ? "is-done" : ""} ${highlighted ? "just-toggled" : ""}">
        <input class="routine-check" type="checkbox" ${done ? "checked" : ""} data-action="toggle-complete" data-id="${esc(routine.id)}" aria-label="${esc(routine.title || "루틴")} 완료 처리">
        <span class="routine-pill-title">${esc(routine.title || "이름 없는 루틴")}</span>
        ${meta ? `<span class="routine-pill-meta">${esc(meta)}</span>` : ""}
        <button class="routine-more" type="button" data-action="open-cell-drawer" data-time="${esc(routine.timeBlock)}" data-sector="${esc(routine.sector)}" aria-label="셀 전체 루틴 보기">…</button>
      </article>
    `;
  }

  function renderMobileBoard() {
    const target = $("#mobile-board-list");
    if (!target) return;
    target.innerHTML = getDisplayTimeBlocks().map((block) => {
      const timeProgress = calculateTimeBlockProgress(block.key);
      return `
        <details class="mobile-time-card" ${block.key === "wake" ? "open" : ""}>
          <summary>
            <b>${esc(block.icon)} ${esc(block.label)}<span>${esc(block.time)}</span></b>
            <b>${timeProgress.total ? `${timeProgress.done}/${timeProgress.total} · ${timeProgress.rate}%` : "루틴 없음"}</b>
          </summary>
          <div class="mobile-sector-list">
            ${sectors.map((sector) => {
              const routines = getCellRoutines(block.key, sector.key);
              const progress = calculateCompletionRate(routines);
              return `
                <div class="mobile-sector-row">
                  <div class="mobile-sector-head">
                    <span>${esc(sector.icon)} ${esc(sector.label)}</span>
                    <button class="routine-more" data-action="open-cell-drawer" data-time="${esc(block.key)}" data-sector="${esc(sector.key)}">${progress.total ? `${progress.done}/${progress.total}` : "+"}</button>
                  </div>
                  ${routines.slice(0, 3).map(renderRoutinePill).join("")}
                  ${routines.length > 3 ? `<button class="cell-more-button" data-action="open-cell-drawer" data-time="${esc(block.key)}" data-sector="${esc(sector.key)}">+${routines.length - 3}개 더보기</button>` : ""}
                  ${!routines.length ? `<button class="add-cell" data-action="open-add-sheet" data-time="${esc(block.key)}" data-sector="${esc(sector.key)}" data-hint="${esc(`${block.label} 시간대 ${sector.label} 루틴 추가`)}"><b>+</b><span>루틴 추가</span></button>` : ""}
                </div>
              `;
            }).join("")}
          </div>
        </details>
      `;
    }).join("");
  }

  function renderDailyReflection() {
    const input = $("#daily-reflection-input");
    const count = $("#daily-reflection-count");
    const status = $("#daily-reflection-status");
    if (!input) return;
    const reflection = getDailyReflection(TODAY_KEY);
    if (document.activeElement !== input) {
      input.value = reflection;
    }
    resizeTextarea(input);
    if (count) count.textContent = `${input.value.length} / 500`;
    if (status) status.textContent = reflection ? "저장됨" : "아직 저장 전";
  }

  function resizeTextarea(textarea) {
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(122, textarea.scrollHeight)}px`;
  }

  function openCellRoutineDrawer(timeBlockKey, sectorKey) {
    state.activeCell = { timeBlock: timeBlockKey || "wake", sector: sectorKey || "skin" };
    renderCellRoutineDrawer();
    const drawer = $("#cell-drawer");
    drawer?.classList.add("open");
    drawer?.setAttribute("aria-hidden", "false");
  }

  function closeCellRoutineDrawer() {
    const drawer = $("#cell-drawer");
    drawer?.classList.remove("open");
    drawer?.setAttribute("aria-hidden", "true");
  }

  function renderCellRoutineDrawer() {
    if (!state.activeCell) return;
    const block = timeBlockByKey(state.activeCell.timeBlock);
    const sector = sectorByKey(state.activeCell.sector);
    const routines = getCellRoutines(block.key, sector.key);
    const progress = calculateCompletionRate(routines);
    const title = $("#cell-drawer-title");
    const summaryTarget = $("#cell-drawer-summary");
    const body = $("#cell-drawer-body");
    if (title) title.textContent = `${block.label} ${sector.label} 루틴 목록`;
    if (summaryTarget) {
      const progressTone = progress.total && progress.rate === 100 ? "is-done" : progress.done > 0 ? "is-partial" : "is-empty";
      summaryTarget.innerHTML = `
        <div class="cell-summary-card time">
          <span class="cell-summary-icon">◷</span>
          <div>
            <strong>${esc(block.time)}</strong>
            <span>${esc(block.label)} 시간</span>
          </div>
        </div>
        <div class="cell-summary-card sector">
          <span class="cell-summary-icon">${esc(sector.icon)}</span>
          <div>
            <strong>${esc(sector.label)}</strong>
          </div>
        </div>
        <div class="cell-summary-card progress ${progressTone}">
          <div>
            <strong>${Number(progress.done || 0)}/${Number(progress.total || 0)} 완료</strong>
            <span>${Number(progress.rate || 0)}%</span>
          </div>
        </div>
      `;
    }
    if (!body) return;
    if (!routines.length) {
      body.innerHTML = `
        <div class="activity-empty">
          <div style="font-size:34px;color:#d1c8be;">＋</div>
          <b>아직 추가된 루틴이 없습니다.</b>
          <span>${esc(block.label)} 시간대의 ${esc(sector.label)} 루틴을 추가해보세요.</span>
        </div>
      `;
      return;
    }
    body.innerHTML = routines.map((routine) => {
      const done = isRoutineDoneOnDate(routine.id, TODAY_KEY);
      return `
      <article class="drawer-routine-card ${done ? "is-done" : "is-todo"}">
        <div class="drawer-routine-main">
          <input class="routine-check" type="checkbox" ${done ? "checked" : ""} data-action="toggle-complete" data-id="${esc(routine.id)}" aria-label="${esc(routine.title)} 완료 처리">
          <div>
            <strong>${esc(routine.title || "이름 없는 루틴")}</strong>
          </div>
        </div>
        <div class="drawer-routine-actions">
          <button data-action="edit-routine" data-id="${esc(routine.id)}">수정</button>
          <button class="danger" data-action="delete-routine" data-id="${esc(routine.id)}">삭제</button>
        </div>
      </article>
    `;
    }).join("");
  }

  function renderProgress() {
    const summary = calculateBoardProgress();
    $("#progress-ring")?.style.setProperty("--rate", summary.rate);
    const overallRate = $("#overall-rate");
    const overallCount = $("#overall-count");
    const doneCount = $("#done-count");
    const progressCount = $("#progress-count");
    const todoCount = $("#todo-count");
    if (overallRate) overallRate.textContent = `${summary.rate}%`;
    if (overallCount) overallCount.textContent = `완료 ${summary.done} / ${summary.total}`;
    if (doneCount) doneCount.textContent = summary.done;
    if (progressCount) progressCount.textContent = summary.inProgress;
    if (todoCount) todoCount.textContent = summary.todo;

    const mobileHeaderRate = $("#mobile-header-rate");
    const mobileSummaryRate = $("#mobile-summary-rate");
    const mobileSummaryCount = $("#mobile-summary-count");
    const mobileSummaryDate = $("#mobile-summary-date");
    const mobileSummaryTrack = $("#mobile-summary-track");
    if (mobileHeaderRate) mobileHeaderRate.textContent = `${summary.rate}%`;
    if (mobileSummaryRate) mobileSummaryRate.textContent = `${summary.rate}%`;
    if (mobileSummaryCount) mobileSummaryCount.textContent = `완료 ${summary.done} / ${summary.total}`;
    if (mobileSummaryDate) mobileSummaryDate.textContent = TODAY_KEY.replaceAll("-", ".");
    if (mobileSummaryTrack) mobileSummaryTrack.style.setProperty("--value", `${summary.rate}%`);

    const sectorTarget = $("#sector-progress");
    if (!sectorTarget) return;
    sectorTarget.innerHTML = sectors.map((sector) => {
      const sectorSummary = calculateSectorProgress(sector.key);
      return `
        <div class="sector-row">
          <span>${esc(sector.icon)} ${esc(sector.label)}</span>
          <div class="bar"><i style="--value:${sectorSummary.rate}%;"></i></div>
          <b>${sectorSummary.rate}% (${sectorSummary.done}/${sectorSummary.total})</b>
        </div>
      `;
    }).join("");
  }

  function renderCalendar() {
    const grids = $$("[data-calendar-grid]");
    if (!grids.length) return;
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    const label = calendarMonthLabel();
    const title = $("#calendar-month-title");
    if (title) title.textContent = label;
    const modalTitle = $("#calendar-modal-month-title");
    if (modalTitle) modalTitle.textContent = label;
    grids.forEach((grid) => {
      grid.setAttribute("aria-label", grid.id === "calendar-modal-grid" ? `${label} 캘린더 크게 보기` : `${label} 캘린더`);
    });

    const selectedDate = state.activeDay && isVisibleCalendarMonth(state.activeDay) ? state.activeDay : "";
    const blanks = Array.from({ length: firstDayOffset() }, () => `<span class="calendar-blank" aria-hidden="true"></span>`).join("");
    const days = Array.from({ length: daysInMonth() }, (_, index) => {
      const day = index + 1;
      const dateKey = dateKeyForDay(day);
      const progress = getDayProgress(dateKey);
      const hasRecord = Boolean(progress && progress.total);
      const rate = hasRecord ? Number(progress.rate || 0) : 0;
      const hasReflection = Boolean(getDailyReflection(dateKey).trim());
      const selected = selectedDate === dateKey;
      const isToday = dateKey === TODAY_KEY;
      return `
        <button type="button" class="calendar-day level-${progressLevel(rate)} ${selected ? "selected" : ""} ${isToday ? "today" : ""}" data-action="open-day-drawer" data-date="${esc(dateKey)}" aria-label="${esc(`${formatDateLabel(dateKey)} 달성률 ${rate}%`)}">
          <span class="calendar-date">${day}</span>
          <small class="calendar-rate">${rate}%</small>
          ${hasReflection ? `<span class="calendar-reflection-marker" aria-label="회고 있음">📝</span>` : ""}
          <i class="calendar-dot" aria-hidden="true"></i>
        </button>
      `;
    }).join("");
    const calendarMarkup = weekdays.map((day) => `<b>${day}</b>`).join("") + blanks + days;
    grids.forEach((grid) => {
      grid.innerHTML = calendarMarkup;
    });

    const progressValues = calendarProgressEntries().map((entry) => Number(entry?.rate || 0));
    const average = progressValues.length ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length) : 0;
    const best = progressValues.length ? Math.max(...progressValues) : 0;
    const streak = `${calculateStreakDays(TODAY_KEY)}일`;
    ["#streak-days", "#modal-streak-days"].forEach((selector) => {
      const target = $(selector);
      if (target) target.textContent = streak;
    });
    ["#month-average", "#modal-month-average"].forEach((selector) => {
      const target = $(selector);
      if (target) target.textContent = `${average}%`;
    });
    ["#month-best", "#modal-month-best"].forEach((selector) => {
      const target = $(selector);
      if (target) target.textContent = `${best}%`;
    });
  }

  function renderCoachingStatus() {
    const summary = calculateBoardProgress();
    const statusTarget = $("#coaching-state");
    const countsTarget = $("#coaching-counts");
    const noteTarget = $("#coaching-note");
    const periodTarget = $("#coaching-period");
    const nextCheckTarget = $("#coaching-next-check");
    const daysTarget = $("#coaching-days");
    const selectedDate = state.activeDay || TODAY_KEY;

    if (statusTarget) {
      const checked = state.coachingSettings.todayStatus === "checked";
      statusTarget.innerHTML = `
        <button type="button" class="${checked ? "" : "active"}" data-action="set-coaching-check" data-status="unchecked" aria-pressed="${checked ? "false" : "true"}">미점검</button>
        <button type="button" class="${checked ? "active" : ""}" data-action="set-coaching-check" data-status="checked" aria-pressed="${checked ? "true" : "false"}">점검</button>
      `;
    }

    if (countsTarget) {
      countsTarget.textContent = `${summary.done} / ${summary.inProgress} / ${summary.todo}`;
    }

    if (periodTarget) {
      periodTarget.textContent = `Day ${coachingDayNumber(TODAY_KEY)} / 14`;
    }

    if (nextCheckTarget) {
      nextCheckTarget.value = state.coachingSettings.nextCheckDate || nextCoachingCheckDate(TODAY_KEY);
    }

    if (daysTarget) {
      daysTarget.innerHTML = Array.from({ length: 14 }, (_, index) => {
        const dayNumber = index + 1;
        const dateKey = coachingDateKey(dayNumber);
        const progress = getDayProgress(dateKey);
        const hasRecord = Boolean(progress && progress.total);
        const isSelected = selectedDate === dateKey;
        const isFuture = dateKey > TODAY_KEY;
        const label = `D${dayNumber}`;
        const rate = hasRecord ? Number(progress.rate || 0) : 0;
        const classNames = [
          isSelected ? "active" : "",
          hasRecord ? "has-record" : "",
          isFuture ? "future" : "",
        ].filter(Boolean).join(" ");
        return `
          <button type="button" class="${classNames}" data-action="open-coaching-day-drawer" data-date="${esc(dateKey)}" aria-label="${esc(`${label} ${formatDateLabel(dateKey)} 달성률 ${rate}%`)}" title="${esc(`${label} · ${compactDateLabel(dateKey)}`)}">
            ${label}
          </button>
        `;
      }).join("");
    }

    if (noteTarget) {
      noteTarget.textContent = summary.total
        ? `D1~D14를 눌러 날짜별 실행 기록을 확인하고, 독자에게 전달할 피드백을 작성하세요.`
        : "루틴을 추가하면 날짜별 실행 기록과 관리자 피드백 공간이 자동으로 준비됩니다.";
    }
  }

  function shiftCalendarMonth(delta) {
    const nextMonth = new Date(state.calendarYear, state.calendarMonth - 1 + delta, 1);
    state.calendarYear = nextMonth.getFullYear();
    state.calendarMonth = nextMonth.getMonth() + 1;
    if (state.activeDay && !isVisibleCalendarMonth(state.activeDay)) {
      state.activeDay = null;
    }
    renderCalendar();
  }

  function openCalendarModal() {
    renderCalendar();
    const modal = $("#calendar-modal");
    modal?.classList.add("open");
    modal?.setAttribute("aria-hidden", "false");
  }

  function closeCalendarModal() {
    const modal = $("#calendar-modal");
    modal?.classList.remove("open");
    modal?.setAttribute("aria-hidden", "true");
  }

  function openDayDetailDrawer(dateKey = TODAY_KEY, mode = "reader") {
    closeCalendarModal();
    state.activeDay = dateKey;
    state.activeDayMode = mode;
    renderCalendar();
    renderCoachingStatus();
    renderDayDetailDrawer();
    const drawer = $("#day-drawer");
    drawer?.classList.add("open");
    drawer?.setAttribute("aria-hidden", "false");
  }

  function closeDayDetailDrawer() {
    const drawer = $("#day-drawer");
    drawer?.classList.remove("open");
    drawer?.setAttribute("aria-hidden", "true");
  }

  function renderDayDetailDrawer() {
    const dateKey = state.activeDay || TODAY_KEY;
    const mode = state.activeDayMode || "reader";
    const isCoachMode = mode === "coach";
    const progress = getDayProgress(dateKey);
    const reflection = getDailyReflection(dateKey) || progress?.reflection || progress?.note || "";
    const title = $("#day-drawer-title");
    const subtitle = $("#day-drawer-subtitle");
    const body = $("#day-drawer-body");
    if (title) title.textContent = formatDateLabel(dateKey);
    if (subtitle) subtitle.textContent = isCoachMode ? "관리자 코칭 피드백" : "실행 기록 및 독자 메모";
    if (!body) return;

    if (!progress || !progress.total) {
      body.innerHTML = `
        <div class="activity-empty">
          <div style="font-size:34px;color:#d1c8be;">▦</div>
          <b>아직 기록이 없습니다.</b>
          <span>루틴을 실행하면 이곳에 달성 기록이 표시됩니다.</span>
        </div>
        ${isCoachMode ? renderDayMemoCard(dateKey, progress?.coachFeedback || "", false, mode) : renderDayReflectionCard(reflection)}
      `;
      return;
    }

    body.innerHTML = `
      <section class="day-summary-card">
        <div class="day-ring" style="--rate:${Number(progress.rate || 0)};"><strong>${Number(progress.rate || 0)}%</strong></div>
        <div>
          <h3>전체 달성률</h3>
          <p>${Number(progress.done || 0)} / ${Number(progress.total || 0)}개 완료</p>
          <div class="day-mini-stats">
            <span>완료 ${Number(progress.done || 0)}개</span>
            <span>진행중 ${Number(progress.inProgress || 0)}개</span>
            <span>미완료 ${Number(progress.todo || 0)}개</span>
          </div>
        </div>
      </section>
      <section class="day-section-card">
        <h3>섹터별 달성률</h3>
        <div class="day-sector-grid">
          ${sectors.map((sector) => {
            const summary = progress.sectors?.[sector.key] || calculateCompletionRate([]);
            return `
              <div class="day-sector-box">
                <span>${esc(sector.icon)} ${esc(sector.label)}</span>
                <strong>${Number(summary.rate || 0)}%</strong>
              </div>
            `;
          }).join("")}
        </div>
      </section>
      <section class="day-section-card">
        <h3>시간대별 진행 현황</h3>
        <div class="day-time-list">
          ${getDisplayTimeBlocks().map((block) => {
            const summary = progress.timeBlocks?.[block.key] || calculateCompletionRate([]);
            return `
              <div class="day-time-row">
                <div>
                  <b>${esc(block.icon)} ${esc(block.label)}</b>
                  <span>${esc(block.time)}</span>
                </div>
                <strong>${Number(summary.done || 0)} / ${Number(summary.total || 0)}</strong>
              </div>
            `;
          }).join("")}
        </div>
      </section>
      <section class="day-section-card">
        <h3>완료 루틴 목록</h3>
        ${renderDayRoutineList((progress.routines || []).filter((routine) => routine.completed), "완료한 루틴이 없습니다.", "done")}
      </section>
      <section class="day-section-card">
        <h3>미완료 루틴 목록</h3>
        ${renderDayRoutineList((progress.routines || []).filter((routine) => !routine.completed), "미완료 루틴이 없습니다.", "todo")}
      </section>
      <section class="day-memo-card">
        ${isCoachMode ? renderDayMemoCard(dateKey, progress.coachFeedback || "", true, mode) : renderDayReflectionCard(reflection, true)}
      </section>
    `;
  }

  function renderDayRoutineList(routines, emptyText, mode = "done") {
    if (!routines.length) {
      return `<p class="day-routine-empty">${esc(emptyText)}</p>`;
    }
    const visibleSectors = sectors.filter((sector) => sector.key !== "life");
    const hiddenSectors = sectors.filter((sector) => sector.key === "life");
    const orderedSectors = [...visibleSectors, ...hiddenSectors.filter((sector) => routines.some((routine) => routine.sector === sector.key))];
    return `
      <div class="day-routine-list">
        ${orderedSectors.map((sector) => {
          const sectorRoutines = routines.filter((routine) => routine.sector === sector.key);
          return `
            <div class="day-routine-sector ${sectorRoutines.length ? "" : "is-empty"}">
              <div class="day-routine-sector-head">
                <b>${esc(sector.icon)} ${esc(sector.label)}</b>
                <span>${sectorRoutines.length}개</span>
              </div>
              ${sectorRoutines.length ? sectorRoutines.map((routine) => `
                  <div class="day-routine-row ${mode === "done" ? "is-done" : "is-todo"}">
                    <span>${mode === "done" ? "✓" : "□"}</span>
                    <b>${esc(routine.title || "이름 없는 루틴")}</b>
                  </div>
                `).join("") : ""}
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderDayMemoCard(dateKey, note = "", innerOnly = false, mode = "reader") {
    const isCoachMode = mode === "coach";
    const title = isCoachMode ? "피드백 입력" : "오늘 메모";
    const placeholder = isCoachMode
      ? "오늘 실행 기록을 보고 독자에게 전달할 피드백을 작성하세요. 예: 잘한 점, 아쉬운 점, 내일 조정할 루틴, 다음 점검 포인트"
      : "오늘 루틴을 해보며 느낀 점, 놓친 이유, 다음에 조정하고 싶은 내용을 적어주세요.";
    const helper = isCoachMode ? "입력하면 날짜별 피드백으로 자동 저장됩니다." : "입력하면 날짜별 메모로 자동 저장됩니다.";
    const statusText = note ? (isCoachMode ? "피드백 저장됨" : "메모 저장됨") : (isCoachMode ? "피드백 없음" : "메모 없음");
    const inputAttr = isCoachMode ? "data-coach-feedback" : "data-day-note";
    const statusAttr = isCoachMode ? "data-feedback-status" : "data-day-note-status";
    const content = `
      <h3>${title}</h3>
      <textarea class="day-memo-input" ${inputAttr}="${esc(dateKey)}" placeholder="${esc(placeholder)}">${esc(note)}</textarea>
      <div class="day-memo-status">
        <span>${helper}</span>
        <span ${statusAttr}="${esc(dateKey)}">${statusText}</span>
      </div>
    `;
    return innerOnly ? content : `<section class="day-memo-card">${content}</section>`;
  }

  function renderDayReflectionCard(reflection = "", innerOnly = false) {
    const trimmed = String(reflection || "").trim();
    const content = `
      <h3>오늘의 회고</h3>
      ${trimmed
        ? `<p class="day-reflection-text">${esc(trimmed).replace(/\n/g, "<br>")}</p>`
        : `<p class="day-reflection-empty">아직 남긴 회고가 없습니다. 데일리 루틴 보드 아래의 오늘의 회고 영역에서 작성할 수 있습니다.</p>`}
    `;
    return innerOnly ? content : `<section class="day-memo-card">${content}</section>`;
  }

  function populateSheetOptions() {
    const timeSelect = $("#routine-time");
    const sectorSelect = $("#routine-sector");
    if (timeSelect) {
      timeSelect.innerHTML = getDisplayTimeBlocks().map((block) => `<option value="${esc(block.key)}">${esc(block.label)} ${esc(block.time)}</option>`).join("");
    }
    if (sectorSelect) {
      sectorSelect.innerHTML = sectors.map((sector) => `<option value="${esc(sector.key)}">${esc(sector.label)}</option>`).join("");
    }
  }

  function openRoutineSheet(context = {}) {
    const sheet = $("#routine-sheet");
    const form = $("#routine-form");
    const editingRoutine = context.id ? state.routines.find((routine) => routine.id === context.id) : null;
    populateSheetOptions();
    state.editingRoutineId = editingRoutine?.id || null;
    state.sheetContext = {
      timeBlock: editingRoutine?.timeBlock || context.timeBlock || context.time || "wake",
      sector: editingRoutine?.sector || context.sector || "skin",
    };
    $("#sheet-title").textContent = editingRoutine ? "루틴 수정하기" : "루틴 추가하기";
    form.elements.timeBlock.value = state.sheetContext.timeBlock;
    form.elements.sector.value = state.sheetContext.sector;
    form.elements.title.value = editingRoutine?.title || "";
    form.elements.duration.value = editingRoutine?.duration || "";
    form.elements.frequency.value = editingRoutine?.frequency || "";
    form.elements.memo.value = editingRoutine?.memo || editingRoutine?.action || "";
    renderRoutineSheetPreview();
    sheet.classList.add("open");
    sheet.setAttribute("aria-hidden", "false");
    setTimeout(() => $("#routine-title")?.focus(), 0);
  }

  function closeRoutineSheet() {
    const sheet = $("#routine-sheet");
    sheet.classList.remove("open");
    sheet.setAttribute("aria-hidden", "true");
    state.editingRoutineId = null;
  }

  function collectRoutineForm() {
    const form = $("#routine-form");
    const editingRoutine = state.editingRoutineId
      ? state.routines.find((routine) => routine.id === state.editingRoutineId)
      : null;
    return {
      timeBlock: form.elements.timeBlock.value,
      sector: form.elements.sector.value,
      status: editingRoutine && isRoutineDoneOnDate(editingRoutine.id, TODAY_KEY) ? "완료" : "미완료",
      title: form.elements.title.value,
      action: "",
      duration: form.elements.duration.value,
      frequency: form.elements.frequency.value,
      memo: form.elements.memo.value,
    };
  }

  function renderRoutineSheetPreview() {
    const form = $("#routine-form");
    const target = $("#routine-preview-card");
    const memoCount = $("#routine-memo-count");
    if (!form || !target) return;
    const block = timeBlockByKey(form.elements.timeBlock?.value || state.sheetContext.timeBlock);
    const sector = sectorByKey(form.elements.sector?.value || state.sheetContext.sector);
    const title = String(form.elements.title?.value || "").trim() || "루틴명을 입력하세요";
    const duration = cleanRoutineMeta(form.elements.duration?.value);
    const frequency = cleanRoutineMeta(form.elements.frequency?.value);
    const memo = String(form.elements.memo?.value || "").trim();
    if (memoCount) memoCount.textContent = `${Math.min(memo.length, 100)} / 100`;
    target.innerHTML = `
      <div class="routine-preview-meta">
        <span>${esc(block.icon)} ${esc(block.label)} ${esc(block.time)}</span>
        <span>${esc(sector.icon)} ${esc(sector.label)}</span>
        ${frequency ? `<span>↻ ${esc(frequency)}</span>` : ""}
      </div>
      <div class="routine-preview-title">${esc(title)}</div>
      ${duration ? `<div class="routine-preview-meta"><span>⏱ ${esc(duration)}</span></div>` : ""}
      ${memo ? `<p class="routine-preview-note">비고: ${esc(memo)}</p>` : `<p class="routine-preview-note">비고는 필요할 때만 남겨도 됩니다.</p>`}
    `;
  }

  function saveProfileFromInputs() {
    const next = {};
    $$("[data-profile-field]").forEach((input) => {
      next[input.dataset.profileField] = input.value.trim();
    });
    saveProfile(next);
  }

  function saveGoalsFromInputs() {
    const next = {};
    $$("[data-goal-field]").forEach((input) => {
      next[input.dataset.goalField] = normalizeGoalEntry(input.value);
    });
    saveGoals(next);
  }

  function routineCountForGoalKey(key) {
    return key === OVERALL_GOAL_KEY
      ? state.routines.length
      : state.routines.filter((routine) => routine.sector === key).length;
  }

  function goalNoteConfigFor(field) {
    return state.activeGoalSector === OVERALL_GOAL_KEY && overallGoalNoteConfig[field]
      ? overallGoalNoteConfig[field]
      : goalNoteConfig[field];
  }

  function renderGoalNoteItem(field, item, index) {
    const config = goalNoteConfigFor(field);
    const normalized = normalizeGoalItem(field, item, index);
    return `
      <div class="goal-note-item ${config.meta.length ? "" : "is-simple"}" data-goal-note-item data-field="${esc(field)}">
        <span class="goal-note-handle" aria-hidden="true">⋮⋮</span>
        <input class="goal-note-text" data-goal-note-text value="${esc(normalized.text)}" placeholder="${esc(config.label)}을 입력하세요.">
        ${config.meta.length ? `<div class="goal-note-meta">
            ${config.meta.map((meta) => `
              <label>
                <span>${esc(meta.label)}</span>
                <select data-goal-note-meta="${esc(meta.key)}" aria-label="${esc(meta.label)}">
                  ${meta.options.map((option) => `<option value="${esc(option)}" ${normalized[meta.key] === option ? "selected" : ""}>${esc(option)}</option>`).join("")}
                </select>
              </label>
            `).join("")}
          </div>` : ""}
        <button type="button" class="goal-note-remove" data-action="remove-goal-note-item" aria-label="항목 삭제">×</button>
      </div>
    `;
  }

  function renderGoalNoteList(field, items = []) {
    const target = $(`#goal-${field}-list`);
    if (!target) return;
    const normalized = normalizeGoalItems(field, items);
    target.innerHTML = normalized.length
      ? normalized.map((item, index) => renderGoalNoteItem(field, item, index)).join("")
      : `<p class="goal-note-empty">아직 기록된 항목이 없습니다. 오른쪽 추가 버튼으로 직접 기록해보세요.</p>`;
  }

  function renderGoalDetailSection(field, items) {
    renderGoalNoteList(field, items);
  }

  function setGoalSectionMode(isOverall) {
    const habitsSection = $("#goal-section-habits");
    if (habitsSection) habitsSection.hidden = isOverall;

    const mainTitle = $("#goal-main-title");
    if (mainTitle) mainTitle.textContent = isOverall ? "이번 목표" : "목표";

    const goalInput = $("#goal-field-goal");
    if (goalInput) {
      goalInput.placeholder = isOverall
        ? "이번 루틴으로 가장 만들고 싶은 변화를 적어주세요."
        : "예: 여드름 자국 완화 / 아침 선크림 루틴 만들기";
    }

    const memo = $("#goal-field-memo");
    if (memo) {
      memo.placeholder = isOverall
        ? "예:\n수면 루틴 우선\n처음에는 루틴 개수 줄이기\n아침 루틴 2개부터 시작\n피부보다 수면과 생활 리듬 먼저 잡기"
        : "예:\n피부 장벽 강화 우선\n아침 선크림 루틴 정착 필요\n수면 개선과 함께 진행";
    }

    const steps = {
      main: "1",
      concerns: "2",
      habits: isOverall ? "" : "3",
      changes: isOverall ? "3" : "4",
      memo: isOverall ? "4" : "5",
    };
    Object.entries(steps).forEach(([key, value]) => {
      const target = $(`#goal-step-${key}`);
      if (target) target.textContent = value;
    });
  }

  function openGoalDetail(sectorKey = "skin") {
    const subject = goalSubjectByKey(sectorKey);
    const goal = normalizeGoalEntry(state.goals[subject.key]);
    const isOverall = subject.key === OVERALL_GOAL_KEY;
    const status = goalStatus(goal, subject.key);
    state.activeGoalSector = subject.key;
    setGoalSectionMode(isOverall);
    $("#goal-drawer-title").textContent = subject.label;
    $("#goal-drawer-subtitle").textContent = isOverall ? "이번 루틴으로 만들고 싶은 변화를 정리합니다." : "목표 상세";
    $("#goal-drawer-icon").textContent = subject.icon;
    const statusBadge = $("#goal-status-badge");
    if (statusBadge) {
      statusBadge.textContent = status.label;
      statusBadge.className = `goal-status-badge ${status.tone}`;
    }
    const summaryTitle = $("#goal-summary-title");
    const summaryConcerns = $("#goal-summary-concerns");
    const summaryChanges = $("#goal-summary-changes");
    const summaryRoutines = $("#goal-summary-routines");
    if (summaryTitle) summaryTitle.textContent = goal.goal || "목표 미입력";
    if (summaryConcerns) summaryConcerns.textContent = `${goal.concerns.length}개 입력됨`;
    if (summaryChanges) summaryChanges.textContent = `${goal.changes.length}개 입력됨`;
    if (summaryRoutines) summaryRoutines.textContent = `${routineCountForGoalKey(subject.key)}개`;
    $("#goal-field-goal").value = goal.goal;
    renderGoalDetailSection("concerns", goal.concerns);
    renderGoalDetailSection("habits", isOverall ? [] : goal.habits);
    renderGoalDetailSection("changes", goal.changes);
    $("#goal-field-memo").value = goal.memo;
    const drawer = $("#goal-drawer");
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    setTimeout(() => $("#goal-field-goal")?.focus(), 0);
  }

  function closeGoalDetail() {
    const drawer = $("#goal-drawer");
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    state.activeGoalSector = null;
  }

  function collectGoalDetailForm() {
    const isOverall = state.activeGoalSector === OVERALL_GOAL_KEY;
    return {
      goal: $("#goal-field-goal")?.value || "",
      concerns: collectGoalNoteItems("concerns"),
      habits: isOverall ? [] : collectGoalNoteItems("habits"),
      changes: collectGoalNoteItems("changes"),
      memo: $("#goal-field-memo")?.value || "",
    };
  }

  function collectGoalNoteItems(field) {
    return $$(`[data-goal-note-item][data-field="${field}"]`).map((item, index) => {
      const text = item.querySelector("[data-goal-note-text]")?.value || "";
      const meta = Object.fromEntries($$("[data-goal-note-meta]", item).map((select) => [select.dataset.goalNoteMeta, select.value]));
      return normalizeGoalItem(field, { text, ...meta }, index);
    }).filter((item) => item.text);
  }

  function addGoalNoteItem(field, text = "") {
    const target = $(`#goal-${field}-list`);
    if (!target || !goalNoteConfig[field]) return;
    const empty = target.querySelector(".goal-note-empty");
    if (empty) empty.remove();
    const index = target.querySelectorAll("[data-goal-note-item]").length;
    target.insertAdjacentHTML("beforeend", renderGoalNoteItem(field, text, index));
    const inputs = $$("[data-goal-note-text]", target);
    inputs[inputs.length - 1]?.focus();
  }

  function saveActiveGoalDetail() {
    const goalKey = state.activeGoalSector || "skin";
    saveGoals({ [goalKey]: collectGoalDetailForm() });
    closeGoalDetail();
    render();
    showToast("목표가 저장되었습니다.");
  }

  function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function scrollToTarget(selector) {
    const target = $(selector);
    if (target) target.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function closeInlineProfileEditor(options = {}) {
    const wasActive = Boolean(state.activeProfileField || state.activeConditionField);
    state.activeProfileField = null;
    state.activeConditionField = null;
    if (wasActive && options.render !== false) render();
    return wasActive;
  }

  function render() {
    syncRoutineDayKey();
    renderProfile();
    renderGoals();
    renderBoard();
    renderMobileBoard();
    renderDailyReflection();
    renderProgress();
    renderCalendar();
    renderCoachingStatus();
    if (state.activeCell && $("#cell-drawer")?.classList.contains("open")) renderCellRoutineDrawer();
    if (state.activeDay && $("#day-drawer")?.classList.contains("open")) renderDayDetailDrawer();
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const scrollButton = event.target.closest("[data-scroll]");
      if (scrollButton) {
        event.preventDefault();
        scrollToTarget(scrollButton.dataset.scroll);
        return;
      }

      if (event.target.id === "calendar-modal") {
        closeCalendarModal();
        return;
      }

      if (event.target.id === "day-drawer") {
        closeDayDetailDrawer();
        return;
      }

      const inlineEditorTarget = event.target.closest(
        '[data-action="edit-profile-field"], [data-action="edit-condition-field"], [data-action="toggle-profile-edit"], [data-action="cancel-profile-field"], [data-quick-profile-field]'
      );
      if ((state.activeProfileField || state.activeConditionField) && !inlineEditorTarget) {
        closeInlineProfileEditor();
      }

      const actionButton = event.target.closest("[data-action]");
      if (!actionButton) return;
      const action = actionButton.dataset.action;

      if (action === "cancel-profile-field") {
        closeInlineProfileEditor();
        showToast("입력을 취소했습니다.");
        return;
      }

      if (action === "open-calendar-modal") {
        openCalendarModal();
        return;
      }

      if (action === "close-calendar-modal") {
        closeCalendarModal();
        return;
      }

      if (action === "toggle-mobile-section") {
        const target = $(actionButton.dataset.target || "");
        if (!target) return;
        const collapsed = target.classList.toggle("mobile-collapsed");
        actionButton.textContent = collapsed ? "펼치기" : "접기";
        actionButton.setAttribute("aria-expanded", collapsed ? "false" : "true");
        return;
      }

      if (action === "toggle-profile-edit") {
        if (state.editingProfile) {
          saveProfileFromInputs();
        }
        state.editingProfile = !state.editingProfile;
        state.activeProfileField = null;
        state.activeConditionField = null;
        render();
        showToast(state.editingProfile ? "프로필을 수정할 수 있습니다." : "프로필을 저장했습니다.");
        return;
      }

      if (action === "edit-profile-field") {
        if (event.target.closest("input, select")) return;
        state.activeProfileField = actionButton.dataset.field;
        state.activeConditionField = null;
        render();
        setTimeout(() => $(`[data-quick-profile-field="${state.activeProfileField}"]`)?.focus(), 0);
        return;
      }

      if (action === "edit-condition-field") {
        if (event.target.closest("select")) return;
        state.activeConditionField = actionButton.dataset.field;
        state.activeProfileField = null;
        render();
        setTimeout(() => $(`[data-quick-profile-field="${state.activeConditionField}"]`)?.focus(), 0);
        return;
      }

      if (action === "open-goal-detail") {
        if (state.editingProfile && event.target.closest("input")) return;
        openGoalDetail(actionButton.dataset.sector || "skin");
        return;
      }

      if (action === "close-goal-drawer") {
        closeGoalDetail();
        return;
      }

      if (action === "save-goal-detail") {
        saveActiveGoalDetail();
        return;
      }

      if (action === "add-goal-note-item") {
        addGoalNoteItem(actionButton.dataset.field || "concerns");
        return;
      }

      if (action === "remove-goal-note-item") {
        actionButton.closest("[data-goal-note-item]")?.remove();
        return;
      }

      if (action === "change-photo") {
        $("#photo-input")?.click();
        return;
      }

      if (action === "delete-photo") {
        saveProfile({ photo: "" });
        const photoInput = $("#photo-input");
        if (photoInput) photoInput.value = "";
        render();
        showToast("프로필 사진을 삭제했습니다.");
        return;
      }

      if (action === "clear-profile-field") {
        saveProfileField(actionButton.dataset.field, "");
        state.activeProfileField = null;
        state.activeConditionField = null;
        render();
        showToast("입력 전 상태로 되돌렸습니다.");
        return;
      }

      if (action === "open-add-sheet") {
        openRoutineSheet({ time: actionButton.dataset.time, sector: actionButton.dataset.sector });
        return;
      }

      if (action === "open-cell-drawer") {
        openCellRoutineDrawer(actionButton.dataset.time, actionButton.dataset.sector);
        return;
      }

      if (action === "close-cell-drawer") {
        closeCellRoutineDrawer();
        return;
      }

      if (action === "open-day-drawer") {
        openDayDetailDrawer(actionButton.dataset.date || TODAY_KEY, "reader");
        return;
      }

      if (action === "open-coaching-day-drawer") {
        openDayDetailDrawer(actionButton.dataset.date || TODAY_KEY, "coach");
        return;
      }

      if (action === "close-day-drawer") {
        closeDayDetailDrawer();
        return;
      }

      if (action === "prev-calendar-month") {
        shiftCalendarMonth(-1);
        return;
      }

      if (action === "next-calendar-month") {
        shiftCalendarMonth(1);
        return;
      }

      if (action === "set-coaching-check") {
        saveCoachingSettings({ todayStatus: actionButton.dataset.status === "checked" ? "checked" : "unchecked" });
        renderCoachingStatus();
        showToast(state.coachingSettings.todayStatus === "checked" ? "오늘 코칭 상태를 점검으로 표시했습니다." : "오늘 코칭 상태를 미점검으로 표시했습니다.");
        return;
      }

      if (action === "save-reflection") {
        const input = $("#daily-reflection-input");
        saveDailyReflection(TODAY_KEY, input?.value || "");
        renderCalendar();
        if (state.activeDay === TODAY_KEY && $("#day-drawer")?.classList.contains("open")) {
          renderDayDetailDrawer();
        }
        renderDailyReflection();
        showToast("오늘의 회고를 저장했습니다.");
        return;
      }

      if (action === "scroll-to-board") {
        closeDayDetailDrawer();
        scrollToTarget("#board");
        return;
      }

      if (action === "add-from-cell-drawer") {
        openRoutineSheet({
          time: state.activeCell?.timeBlock || "wake",
          sector: state.activeCell?.sector || "skin",
        });
        return;
      }

      if (action === "edit-routine") {
        openRoutineSheet({ id: actionButton.dataset.id });
        return;
      }

      if (action === "toggle-complete") {
        toggleRoutineComplete(actionButton.dataset.id);
        render();
        window.setTimeout(() => {
          state.highlightCellKey = "";
          state.highlightedRoutineId = "";
          render();
        }, 360);
        return;
      }

      if (action === "delete-routine") {
        const routine = state.routines.find((entry) => entry.id === actionButton.dataset.id);
        if (!routine) return;
        if (!window.confirm(`"${routine.title}" 루틴을 삭제할까요?`)) return;
        deleteRoutine(routine.id);
        render();
        showToast("루틴을 삭제했습니다.");
        return;
      }

      if (action === "close-sheet") {
        closeRoutineSheet();
        return;
      }

      if (action === "open-guide") {
        showToast("빈 칸을 눌러 루틴을 추가하고, 체크박스로 실행 여부를 기록합니다.");
      }
    });

    document.addEventListener("input", (event) => {
      if (event.target.closest("#routine-form")) {
        renderRoutineSheetPreview();
      }

      const dailyMustInput = event.target.closest("[data-daily-must-field='title']");
      if (dailyMustInput) {
        const slot = Number(dailyMustInput.dataset.slot || 0);
        updateDailyMustSlot(slot, { title: dailyMustInput.value });
        return;
      }

      const reflectionInput = event.target.closest("[data-daily-reflection]");
      if (reflectionInput) {
        resizeTextarea(reflectionInput);
        const count = $("#daily-reflection-count");
        const status = $("#daily-reflection-status");
        if (count) count.textContent = `${reflectionInput.value.length} / 500`;
        if (status) status.textContent = "저장 필요";
        return;
      }

      const memoInput = event.target.closest("[data-day-note]");
      if (memoInput) {
        const dateKey = memoInput.dataset.dayNote || TODAY_KEY;
        saveDayNote(dateKey, memoInput.value);
        const status = $(`[data-day-note-status="${dateKey}"]`);
        if (status) status.textContent = "메모 저장됨";
        return;
      }

      const feedbackInput = event.target.closest("[data-coach-feedback]");
      if (!feedbackInput) return;
      const dateKey = feedbackInput.dataset.coachFeedback || TODAY_KEY;
      saveCoachFeedback(dateKey, feedbackInput.value);
      const status = $(`[data-feedback-status="${dateKey}"]`);
      if (status) status.textContent = "피드백 저장됨";
    });

    document.addEventListener("keydown", (event) => {
      const editableCard = event.target.closest('[data-action="edit-profile-field"], [data-action="edit-condition-field"]');
      if (!editableCard || event.target.closest("input, select")) return;
      if (!["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      editableCard.click();
    });

    document.addEventListener("focusout", (event) => {
      const fieldInput = event.target.closest("[data-quick-profile-field]");
      if (!fieldInput || state.editingProfile) return;
      const fieldKey = fieldInput.dataset.quickProfileField;
      window.setTimeout(() => {
        const activeEditor = document.activeElement?.closest("[data-field]");
        if (activeEditor?.dataset.field === fieldKey) return;
        const wasActive = state.activeProfileField === fieldKey || state.activeConditionField === fieldKey;
        if (!wasActive) return;
        state.activeProfileField = null;
        state.activeConditionField = null;
        render();
      }, 80);
    });

    document.addEventListener("change", (event) => {
      if (event.target.closest("#routine-form")) {
        renderRoutineSheetPreview();
      }

      const nextCheckInput = event.target.closest("[data-coaching-next-check]");
      if (nextCheckInput) {
        saveCoachingSettings({ nextCheckDate: nextCheckInput.value || nextCoachingCheckDate(TODAY_KEY) });
        renderCoachingStatus();
        showToast("다음 점검 예정일을 저장했습니다.");
        return;
      }

      const fieldInput = event.target.closest("[data-quick-profile-field]");
      if (!fieldInput) return;
      saveProfileField(fieldInput.dataset.quickProfileField, fieldInput.value);
      state.activeProfileField = null;
      state.activeConditionField = null;
      render();
      showToast("프로필 값이 저장되었습니다.");
    });

    document.addEventListener("change", (event) => {
      const dailyMustControl = event.target.closest("[data-daily-must-field]");
      if (!dailyMustControl) return;
      const slot = Number(dailyMustControl.dataset.slot || 0);
      const field = dailyMustControl.dataset.dailyMustField;
      updateDailyMustSlot(slot, { [field]: dailyMustControl.value }, { activity: true });
      render();
      showToast("금일 필수 루틴을 저장했습니다.");
    });

    $("#routine-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const payload = collectRoutineForm();
      if (!payload.title.trim()) {
        showToast("루틴명을 입력해주세요.");
        $("#routine-title")?.focus();
        return;
      }
      const saved = state.editingRoutineId ? updateRoutine(state.editingRoutineId, payload) : saveRoutine(payload);
      if (saved) {
        state.checks = {
          ...state.checks,
          [TODAY_KEY]: {
            ...getDayChecks(TODAY_KEY),
            [saved.id]: payload.status === "완료",
          },
        };
        saveRoutineChecks();
        saveDailyProgress(calculateBoardProgress(TODAY_KEY), TODAY_KEY);
        state.highlightCellKey = cellKey(saved.timeBlock, saved.sector);
        state.highlightedRoutineId = saved.id;
      }
      closeRoutineSheet();
      render();
      window.setTimeout(() => {
        state.highlightCellKey = "";
        state.highlightedRoutineId = "";
        render();
      }, 720);
      showToast("루틴을 저장했습니다.");
    });

    $("#photo-input")?.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        saveProfile({ photo: reader.result });
        render();
        showToast("프로필 사진을 저장했습니다.");
      };
      reader.readAsDataURL(file);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (closeInlineProfileEditor()) {
        showToast("입력을 취소했습니다.");
        return;
      }
      if ($("#routine-sheet")?.classList.contains("open")) closeRoutineSheet();
      else if ($("#goal-drawer")?.classList.contains("open")) closeGoalDetail();
      else if ($("#calendar-modal")?.classList.contains("open")) closeCalendarModal();
      else if ($("#day-drawer")?.classList.contains("open")) closeDayDetailDrawer();
      else if ($("#cell-drawer")?.classList.contains("open")) closeCellRoutineDrawer();
    });
  }

  populateSheetOptions();
  bindEvents();
  applyClientIdentity();
  render();
  window.setInterval(() => {
    if (!syncRoutineDayKey()) return;
    render();
    showToast("새 루틴 데이가 시작되었습니다.");
  }, 60000);
})();
