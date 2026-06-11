// Tab Therapist — popup UI logic

const analyzeBtn = document.getElementById("analyze-btn");
const tabCountEl = document.getElementById("tab-count");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const resultsEl = document.getElementById("results");

/** Show/hide UI sections */
function setState({ loading = false, error = "", results = "" }) {
  loadingEl.classList.toggle("hidden", !loading);
  analyzeBtn.disabled = loading;
  errorEl.classList.toggle("hidden", !error);
  errorEl.textContent = error;
  resultsEl.classList.toggle("hidden", !results);
  resultsEl.textContent = results;
}

/** Convert markdown-ish analysis to simple HTML (TODO: use a markdown lib) */
function renderAnalysis(text) {
  // Basic: preserve line breaks. Upgrade later with marked.js or similar.
  return text.replace(/\n/g, "<br>");
}

/** Main flow: read tabs → call backend → show results */
async function handleAnalyze() {
  setState({ loading: true, error: "", results: "" });

  try {
    const tabs = await getOpenTabs();
    tabCountEl.textContent = `${tabs.length} tabs in this window`;

    const data = await analyzeTabs(tabs);
    resultsEl.innerHTML = renderAnalysis(data.analysis);
    setState({ loading: false, results: data.analysis });
  } catch (err) {
    setState({
      loading: false,
      error: err.message || "Something went wrong. Is the backend running?",
    });
  }
}

analyzeBtn.addEventListener("click", handleAnalyze);

// Show tab count on popup open
getOpenTabs().then((tabs) => {
  tabCountEl.textContent = `${tabs.length} tabs in this window`;
});
