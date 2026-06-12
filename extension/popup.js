const analyzeBtn = document.getElementById("analyze-btn");
const saveSessionBtn = document.getElementById("save-session-btn");
const tabCountEl = document.getElementById("tab-count");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const resultsEl = document.getElementById("results");

function setLoading(loading) {
  loadingEl.classList.toggle("hidden", !loading);
  analyzeBtn.disabled = loading;
  saveSessionBtn.disabled = loading;
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.toggle("hidden", !msg);
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeAnalysisResponse(data) {
  if (!data) throw new Error("Empty response from server.");
  if (typeof data.analysis === "string") {
    throw new Error("Server returned old response format. Redeploy the backend.");
  }

  const a = data.analysis || {};
  return {
    domain_breakdown: data.domain_breakdown || [],
    analysis: {
      shame_score: a.shame_score ?? "?",
      shame_reason: a.shame_reason || "",
      read_now: a.read_now || [],
      save_for_later: a.save_for_later || [],
      close_guilt_free: a.close_guilt_free || [],
      anxiety_tabs: a.anxiety_tabs || [],
      next_action: a.next_action || "",
    },
  };
}

function renderTabList(items, openTabs, { checkboxes = false, sectionId = "" } = {}) {
  if (!items || items.length === 0) {
    return '<p class="empty">None flagged.</p>';
  }

  return items
    .map((item, i) => {
      const tabId = matchTabId(item.url, openTabs);
      const checkbox = checkboxes
        ? `<input type="checkbox" class="tab-checkbox" data-tab-id="${tabId ?? ""}" data-section="${sectionId}" id="${sectionId}-${i}" ${tabId ? "checked" : ""} />`
        : "";
      const disabled = tabId ? "" : ' <span class="muted">(tab not found)</span>';

      return `
        <label class="tab-item" for="${sectionId}-${i}">
          ${checkbox}
          <div class="tab-item-body">
            <a href="${escapeHtml(item.url)}" target="_blank" class="tab-title">${escapeHtml(item.title)}</a>
            <p class="tab-reason">${escapeHtml(item.reason)}</p>
            ${disabled}
          </div>
        </label>`;
    })
    .join("");
}

function renderDomainBreakdown(domains) {
  if (!domains || domains.length === 0) return "";
  const max = domains[0].count;
  const bars = domains
    .map((d) => {
      const pct = Math.round((d.count / max) * 100);
      return `
        <div class="domain-row">
          <span class="domain-name">${escapeHtml(d.domain)}</span>
          <div class="domain-bar-track"><div class="domain-bar" style="width:${pct}%"></div></div>
          <span class="domain-count">${d.count}</span>
        </div>`;
    })
    .join("");

  return `<h3 class="section-title">Domain breakdown</h3>${bars}`;
}

function renderResults(data, openTabs) {
  const { analysis, domain_breakdown } = data;

  document.getElementById("shame-score").innerHTML = `
    <div class="score-circle">${analysis.shame_score}</div>
    <div class="score-label">Tab Shame Score</div>
    <p class="score-reason">${escapeHtml(analysis.shame_reason)}</p>`;

  document.getElementById("domain-breakdown").innerHTML = renderDomainBreakdown(domain_breakdown);

  document.getElementById("read-now").innerHTML = `
    <h3 class="section-title">Read now</h3>
    ${renderTabList(analysis.read_now, openTabs)}`;

  document.getElementById("close-section").innerHTML = `
    <h3 class="section-title">Close guilt-free</h3>
    ${renderTabList(analysis.close_guilt_free, openTabs, { checkboxes: true, sectionId: "close" })}
    <button id="close-selected-btn" class="danger-btn">Close selected tabs</button>`;

  document.getElementById("anxiety-section").innerHTML = `
    <h3 class="section-title">Anxiety, not research</h3>
    ${renderTabList(analysis.anxiety_tabs, openTabs, { checkboxes: true, sectionId: "anxiety" })}
    <button id="close-anxiety-btn" class="danger-btn secondary-danger">Close anxiety tabs</button>`;

  document.getElementById("next-action").innerHTML = `
    <h3 class="section-title">Do this next</h3>
    <p>${escapeHtml(analysis.next_action)}</p>`;

  resultsEl.classList.remove("hidden");

  document.getElementById("close-selected-btn")?.addEventListener("click", () => {
    closeCheckedTabs("close");
  });
  document.getElementById("close-anxiety-btn")?.addEventListener("click", () => {
    closeCheckedTabs("anxiety");
  });
}

function getCheckedTabIds(section) {
  return Array.from(document.querySelectorAll(`.tab-checkbox[data-section="${section}"]:checked`))
    .map((el) => parseInt(el.dataset.tabId, 10))
    .filter((id) => !isNaN(id));
}

async function closeCheckedTabs(section) {
  const ids = getCheckedTabIds(section);
  if (ids.length === 0) {
    showError("No tabs selected to close.");
    return;
  }
  if (!confirm(`Close ${ids.length} tab(s)?`)) return;

  await closeTabs(ids);
  showError("");
  await refreshTabCount();
  handleAnalyze();
}

async function handleAnalyze() {
  setLoading(true);
  showError("");
  resultsEl.classList.add("hidden");

  try {
    const tabs = await getAllTabs();
    tabCountEl.textContent = `${tabs.length} tabs across all windows`;

    const raw = await analyzeTabs(tabs);
    renderResults(normalizeAnalysisResponse(raw), tabs);
  } catch (err) {
    showError(err.message || "Something went wrong. Is the backend running?");
  } finally {
    setLoading(false);
  }
}

async function handleSaveSession() {
  const tabs = await getAllTabs();
  if (tabs.length === 0) {
    showError("No tabs to save.");
    return;
  }

  const name = prompt(`Name this session (${tabs.length} tabs):`, `Capsule ${new Date().toLocaleDateString()}`);
  if (!name) return;

  await saveSession(name, tabs);
  showError("");
  await renderSessionsList();
}

async function renderSessionsList() {
  const sessions = await getSessions();
  const list = document.getElementById("sessions-list");

  if (sessions.length === 0) {
    list.innerHTML = '<p class="empty">No saved sessions yet.</p>';
    return;
  }

  list.innerHTML = sessions
    .map(
      (s) => `
      <div class="session-item">
        <div class="session-info">
          <strong>${escapeHtml(s.name)}</strong>
          <span class="muted">${s.tabs.length} tabs · ${new Date(s.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="session-actions">
          <button class="small-btn restore-btn" data-id="${s.id}">Restore</button>
          <button class="small-btn delete-btn" data-id="${s.id}">Delete</button>
        </div>
      </div>`
    )
    .join("");

  list.querySelectorAll(".restore-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const ok = await restoreSession(btn.dataset.id);
      if (!ok) showError("Could not restore session.");
    });
  });

  list.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (confirm("Delete this session?")) {
        await deleteSession(btn.dataset.id);
        await renderSessionsList();
      }
    });
  });
}

async function refreshTabCount() {
  const tabs = await getAllTabs();
  tabCountEl.textContent = `${tabs.length} tabs across all windows`;
}

analyzeBtn.addEventListener("click", handleAnalyze);
saveSessionBtn.addEventListener("click", handleSaveSession);

refreshTabCount();
renderSessionsList();
