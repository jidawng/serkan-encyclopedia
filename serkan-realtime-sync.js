(function () {
  const config = window.SERKAN_REALTIME_CONFIG || {};
  const localKey = config.storageKey || "SERKAN_TEAM_SHARED_STATE";
  const userKey = "SERKAN_TEAM_USER_NAME";
  const panelKey = "SERKAN_TEAM_PANEL_OPEN";
  const maxActivity = 60;
  const statusLabels = {
    review: "검수 필요",
    approved: "승인",
    hold: "보류",
    needs_fix: "수정 필요",
  };

  let currentContext = window.SERKAN_CURRENT_CONTEXT || {
    type: "view",
    code: "dashboard",
    title: "SERKAN Dashboard",
  };
  let teamState = loadLocalState();
  let remoteClient = null;
  let remoteReady = false;
  let syncingRemote = false;
  let syncTimer = null;
  let lastRoutineDoneSignature = "";
  let lastRoutineDoneAt = 0;

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function loadLocalState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(localKey) || "{}");
      return normalizeState(parsed);
    } catch (error) {
      return normalizeState({});
    }
  }

  function normalizeState(value) {
    return {
      reviews: value.reviews && typeof value.reviews === "object" ? value.reviews : {},
      routineDone: value.routineDone && typeof value.routineDone === "object" ? value.routineDone : {},
      customEntries: Array.isArray(value.customEntries) ? value.customEntries : [],
      comments: Array.isArray(value.comments) ? value.comments : [],
      activity: Array.isArray(value.activity) ? value.activity : [],
      updatedAt: value.updatedAt || new Date().toISOString(),
    };
  }

  function saveLocalState() {
    teamState.updatedAt = new Date().toISOString();
    localStorage.setItem(localKey, JSON.stringify(teamState));
  }

  function userName() {
    return localStorage.getItem(userKey) || "팀원";
  }

  function setUserName(value) {
    localStorage.setItem(userKey, value.trim() || "팀원");
  }

  function contextKey(context = currentContext) {
    return `${context.type || "view"}:${context.code || context.view || "dashboard"}`;
  }

  function shortCode(context = currentContext) {
    return context.code && context.code !== context.view ? context.code : context.type || "view";
  }

  function nowLabel(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  }

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function uid(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function mergeRemoteState(nextValue) {
    const next = normalizeState(nextValue || {});
    teamState = {
      reviews: { ...teamState.reviews, ...next.reviews },
      routineDone: { ...teamState.routineDone, ...next.routineDone },
      customEntries: Array.isArray(next.customEntries) ? next.customEntries : teamState.customEntries,
      comments: uniqueById([...teamState.comments, ...next.comments]).slice(-200),
      activity: uniqueById([...teamState.activity, ...next.activity]).slice(-maxActivity),
      updatedAt: next.updatedAt || teamState.updatedAt,
    };
    applySharedRoutineDone(teamState.routineDone);
    applySharedCustomEntries(teamState.customEntries);
    saveLocalState();
    renderPanel();
  }

  function uniqueById(rows) {
    const seen = new Set();
    return rows.filter((row) => {
      const id = row.id || JSON.stringify(row);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  function scheduleRemoteSync() {
    saveLocalState();
    renderPanel();
    if (!remoteReady || syncingRemote) return;
    window.clearTimeout(syncTimer);
    syncTimer = window.setTimeout(pushRemoteState, 250);
  }

  function applySharedRoutineDone(routineDoneMap) {
    if (!window.SERKAN_TEAM_API?.setRoutineDone) return;
    Object.values(routineDoneMap || {}).forEach((entry) => {
      if (!entry || !entry.bucket || !entry.code) return;
      window.SERKAN_TEAM_API.setRoutineDone(entry.bucket, entry.code, entry.done);
    });
  }

  function applySharedCustomEntries(entries) {
    if (!window.SERKAN_TEAM_API?.setCustomEntries || !Array.isArray(entries)) return;
    window.SERKAN_TEAM_API.setCustomEntries(entries);
  }

  function titleForEntity(type, code) {
    const collectionByType = {
      routine: "routines",
      manual: "manuals",
      item: "items",
      product: "products",
      situation: "situations",
    };
    const collection = window.SERKAN_DATA?.[collectionByType[type]] || [];
    const entity = collection.find((item) => item.code === code);
    return entity?.title || entity?.name || entity?.productName || code || "";
  }

  function recordSharedRoutineDone(detail) {
    if (!detail.bucket || !detail.targetCode) return;
    const key = `${detail.bucket}:${detail.targetCode}`;
    teamState.routineDone[key] = {
      done: Boolean(detail.done),
      bucket: detail.bucket,
      code: detail.targetCode,
      title: titleForEntity("routine", detail.targetCode),
      updatedBy: userName(),
      updatedAt: new Date().toISOString(),
    };
  }

  function recordSharedCustomEntries(entries) {
    if (!Array.isArray(entries)) return;
    teamState.customEntries = entries;
    addActivity("custom_entries_update", "추가 루틴 목록 업데이트", currentContext);
    scheduleRemoteSync();
  }

  function syncRoutineDone(detail, context) {
    if (!detail.bucket || !detail.targetCode) return;
    const signature = `${detail.bucket}:${detail.targetCode}:${Boolean(detail.done)}`;
    const now = Date.now();
    if (signature === lastRoutineDoneSignature && now - lastRoutineDoneAt < 600) return;
    lastRoutineDoneSignature = signature;
    lastRoutineDoneAt = now;
    recordSharedRoutineDone(detail);
    const routineTitle = titleForEntity("routine", detail.targetCode);
    addActivity("routine_check", detail.done ? "루틴 완료 표시" : "루틴 완료 해제", {
      type: "routine",
      code: detail.targetCode,
      title: routineTitle || context?.title || detail.targetCode,
    });
    scheduleRemoteSync();
  }

  async function pushRemoteState() {
    if (!remoteReady || !remoteClient) return;
    syncingRemote = true;
    try {
      const payload = {
        client_id: config.clientId,
        storage_key: config.storageKey,
        value: teamState,
        updated_by: userName(),
        updated_at: new Date().toISOString(),
      };
      await remoteClient.from(config.table).upsert(payload, { onConflict: "client_id,storage_key" });
    } catch (error) {
      remoteReady = false;
      renderPanel();
    } finally {
      syncingRemote = false;
    }
  }

  async function initRemote() {
    if (!config.enabled || !config.url || !config.anonKey || !window.supabase?.createClient) {
      renderPanel();
      return;
    }
    try {
      remoteClient = window.supabase.createClient(config.url, config.anonKey);
      const { data: rows } = await remoteClient
        .from(config.table)
        .select("value")
        .eq("client_id", config.clientId)
        .eq("storage_key", config.storageKey)
        .limit(1);

      if (rows && rows[0]?.value) mergeRemoteState(rows[0].value);
      remoteReady = true;
      renderPanel();

      remoteClient
        .channel("serkan-team-shared-state")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: config.table,
            filter: `client_id=eq.${config.clientId}`,
          },
          (payload) => {
            if (payload.new?.storage_key !== config.storageKey) return;
            mergeRemoteState(payload.new.value);
          },
        )
        .subscribe();
      pushRemoteState();
    } catch (error) {
      remoteReady = false;
      renderPanel();
    }
  }

  function setReviewStatus(status) {
    const key = contextKey();
    teamState.reviews[key] = {
      status,
      label: statusLabels[status] || status,
      targetType: currentContext.type,
      targetCode: currentContext.code,
      targetTitle: currentContext.title,
      updatedBy: userName(),
      updatedAt: new Date().toISOString(),
    };
    addActivity("review_status", `${statusLabels[status] || status} 상태로 표시`);
    scheduleRemoteSync();
  }

  function addComment(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    teamState.comments.push({
      id: uid("comment"),
      targetType: currentContext.type,
      targetCode: currentContext.code,
      targetTitle: currentContext.title,
      text: trimmed,
      userName: userName(),
      createdAt: new Date().toISOString(),
    });
    addActivity("comment", "코멘트 추가");
    scheduleRemoteSync();
  }

  function addActivity(actionType, message, context = currentContext) {
    teamState.activity.push({
      id: uid("activity"),
      actionType,
      targetType: context.type,
      targetCode: context.code,
      targetTitle: context.title,
      userName: userName(),
      message,
      createdAt: new Date().toISOString(),
    });
    teamState.activity = teamState.activity.slice(-maxActivity);
  }

  function commentsForCurrent() {
    const key = contextKey();
    return teamState.comments
      .filter((comment) => `${comment.targetType}:${comment.targetCode}` === key)
      .slice(-8)
      .reverse();
  }

  function reviewForCurrent() {
    return teamState.reviews[contextKey()];
  }

  function injectStyles() {
    if ($("#serkan-realtime-style")) return;
    const style = document.createElement("style");
    style.id = "serkan-realtime-style";
    style.textContent = `
      .team-share-toggle {
        position: fixed;
        right: 22px;
        bottom: 22px;
        z-index: 2200;
        border: 1px solid rgba(112, 44, 30, 0.22);
        border-radius: 999px;
        background: #7f1d13;
        color: #fff;
        font-weight: 800;
        padding: 12px 16px;
        box-shadow: 0 14px 35px rgba(34, 20, 10, 0.18);
        cursor: pointer;
      }
      .team-share-panel {
        position: fixed;
        right: 22px;
        bottom: 78px;
        width: min(392px, calc(100vw - 28px));
        max-height: min(720px, calc(100vh - 108px));
        overflow: auto;
        z-index: 2200;
        border: 1px solid rgba(112, 44, 30, 0.18);
        border-radius: 22px;
        background: rgba(255, 253, 248, 0.98);
        box-shadow: 0 20px 60px rgba(34, 20, 10, 0.18);
        padding: 16px;
        color: #2b2d33;
      }
      .team-share-panel[hidden] { display: none; }
      .team-share-head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: flex-start;
        margin-bottom: 12px;
      }
      .team-share-head strong {
        display: block;
        font-size: 18px;
      }
      .team-share-status {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-top: 5px;
        color: #6b7280;
        font-size: 12px;
        font-weight: 700;
      }
      .team-share-status::before {
        content: "";
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #22c55e;
      }
      .team-share-status.local::before { background: #f59e0b; }
      .team-share-close {
        border: 0;
        background: transparent;
        font-size: 22px;
        cursor: pointer;
      }
      .team-share-card {
        border: 1px solid rgba(112, 44, 30, 0.14);
        border-radius: 16px;
        background: #fff;
        padding: 12px;
        margin-top: 10px;
      }
      .team-share-card h4 {
        margin: 0 0 8px;
        font-size: 13px;
        color: #6f2a1d;
      }
      .team-share-context strong {
        display: block;
        font-size: 16px;
        line-height: 1.35;
      }
      .team-share-context span {
        display: block;
        color: #777;
        font-size: 12px;
        margin-top: 4px;
      }
      .team-share-user {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid rgba(112, 44, 30, 0.18);
        border-radius: 12px;
        padding: 10px 12px;
        font-weight: 700;
      }
      .team-share-status-buttons {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }
      .team-share-status-buttons button,
      .team-share-comment button {
        border: 1px solid rgba(112, 44, 30, 0.16);
        border-radius: 12px;
        background: #fbf6f1;
        color: #6f2a1d;
        font-weight: 800;
        padding: 10px;
        cursor: pointer;
      }
      .team-share-status-buttons button.active {
        background: #7f1d13;
        color: #fff;
      }
      .team-share-comment textarea {
        width: 100%;
        min-height: 76px;
        resize: vertical;
        box-sizing: border-box;
        border: 1px solid rgba(112, 44, 30, 0.18);
        border-radius: 12px;
        padding: 10px 12px;
        font: inherit;
      }
      .team-share-comment button {
        width: 100%;
        margin-top: 8px;
        background: #7f1d13;
        color: #fff;
      }
      .team-share-list {
        display: grid;
        gap: 8px;
      }
      .team-share-row {
        border-radius: 12px;
        background: #faf7f2;
        padding: 9px 10px;
      }
      .team-share-row strong {
        display: block;
        font-size: 12px;
        color: #6f2a1d;
      }
      .team-share-row p {
        margin: 4px 0 0;
        font-size: 13px;
        line-height: 1.45;
      }
      .team-share-empty {
        color: #8a8178;
        font-size: 13px;
        margin: 0;
      }
    `;
    document.head.appendChild(style);
  }

  function panelMarkup() {
    const review = reviewForCurrent();
    const comments = commentsForCurrent();
    const activity = teamState.activity.slice(-10).reverse();
    const isOpen = localStorage.getItem(panelKey) !== "closed";
    return `
      <button class="team-share-toggle" type="button" data-team-action="toggle">팀 공유</button>
      <aside class="team-share-panel" ${isOpen ? "" : "hidden"} aria-label="팀 실시간 공유">
        <div class="team-share-head">
          <div>
            <strong>팀 실시간 공유</strong>
            <span class="team-share-status ${remoteReady ? "" : "local"}">${remoteReady ? "공유 연결됨" : "로컬 모드"}</span>
          </div>
          <button class="team-share-close" type="button" data-team-action="toggle" aria-label="닫기">×</button>
        </div>
        <input class="team-share-user" data-team-input="user" value="${esc(userName())}" aria-label="팀원 이름" />
        <section class="team-share-card team-share-context">
          <h4>현재 항목</h4>
          <strong>${esc(currentContext.title || "SERKAN Dashboard")}</strong>
          <span>${esc(currentContext.type || "view")} · ${esc(shortCode())}</span>
        </section>
        <section class="team-share-card">
          <h4>검수 상태</h4>
          <div class="team-share-status-buttons">
            ${Object.entries(statusLabels).map(([key, label]) => `
              <button type="button" class="${review?.status === key ? "active" : ""}" data-team-status="${esc(key)}">${esc(label)}</button>
            `).join("")}
          </div>
        </section>
        <section class="team-share-card team-share-comment">
          <h4>팀 코멘트</h4>
          <textarea data-team-input="comment" placeholder="회의 중 남길 코멘트를 적어주세요"></textarea>
          <button type="button" data-team-action="comment">코멘트 남기기</button>
        </section>
        <section class="team-share-card">
          <h4>이 항목 코멘트</h4>
          <div class="team-share-list">
            ${comments.length ? comments.map((comment) => `
              <article class="team-share-row">
                <strong>${esc(comment.userName)} · ${esc(nowLabel(comment.createdAt))}</strong>
                <p>${esc(comment.text)}</p>
              </article>
            `).join("") : `<p class="team-share-empty">아직 코멘트가 없습니다.</p>`}
          </div>
        </section>
        <section class="team-share-card">
          <h4>실시간 활동</h4>
          <p class="team-share-empty">공유 추가 루틴 ${esc((teamState.customEntries || []).length)}개</p>
          <div class="team-share-list">
            ${activity.length ? activity.map((item) => `
              <article class="team-share-row">
                <strong>${esc(item.userName)} · ${esc(nowLabel(item.createdAt))}</strong>
                <p>${esc(item.message)} · ${esc(item.targetTitle || item.targetCode || "")}</p>
              </article>
            `).join("") : `<p class="team-share-empty">아직 활동이 없습니다.</p>`}
          </div>
        </section>
      </aside>
    `;
  }

  function renderPanel() {
    injectStyles();
    let root = $("#serkan-team-share-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "serkan-team-share-root";
      document.body.appendChild(root);
    }
    root.innerHTML = panelMarkup();
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      if (!event.target.matches("[data-action='toggle-weekly'], [data-action='toggle-routine-check']")) return;
      const target = event.target;
      window.setTimeout(() => {
        syncRoutineDone({
          targetCode: target.dataset.code,
          bucket: target.dataset.day || target.dataset.key,
          done: target.checked,
        }, currentContext);
      }, 0);
    }, true);

    document.addEventListener("click", (event) => {
      const toggle = event.target.closest("[data-team-action='toggle']");
      if (toggle) {
        const panel = $(".team-share-panel");
        const nextOpen = panel?.hasAttribute("hidden");
        localStorage.setItem(panelKey, nextOpen ? "open" : "closed");
        renderPanel();
        return;
      }

      const statusButton = event.target.closest("[data-team-status]");
      if (statusButton) {
        setReviewStatus(statusButton.dataset.teamStatus);
        return;
      }

      const commentButton = event.target.closest("[data-team-action='comment']");
      if (commentButton) {
        const textarea = $("[data-team-input='comment']");
        addComment(textarea?.value || "");
      }
    });

    document.addEventListener("change", (event) => {
      if (event.target.matches("[data-team-input='user']")) {
        setUserName(event.target.value);
        renderPanel();
      }
      if (event.target.matches("[data-action='toggle-weekly'], [data-action='toggle-routine-check']")) {
        syncRoutineDone({
          targetCode: event.target.dataset.code,
          bucket: event.target.dataset.day || event.target.dataset.key,
          done: event.target.checked,
        }, currentContext);
      }
    });

    window.addEventListener("serkan:context-change", (event) => {
      currentContext = event.detail || currentContext;
      renderPanel();
    });

    window.addEventListener("serkan:team-action", (event) => {
      const detail = event.detail || {};
      const context = detail.context || currentContext;
      if (detail.actionType === "open_detail") {
        addActivity("open_detail", "상세 열람", context);
        scheduleRemoteSync();
      }
      if (detail.actionType === "routine_check") {
        syncRoutineDone(detail, context);
      }
      if (detail.actionType === "custom_entries_update") {
        recordSharedCustomEntries(detail.customEntries || []);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    applySharedRoutineDone(teamState.routineDone);
    applySharedCustomEntries(teamState.customEntries);
    renderPanel();
    initRemote();
  });
})();
