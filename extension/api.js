// Tab Therapist — API client (talks to your FastAPI backend on Render)

/**
 * Fetch all open tabs in the current window.
 * @returns {Promise<Array<{id: number, title: string, url: string}>>}
 */
async function getOpenTabs() {
  // TODO: optionally use chrome.tabs.query({}) for ALL windows
  const tabs = await chrome.tabs.query({ currentWindow: true });
  return tabs.map((tab) => ({
    id: tab.id,
    title: tab.title || "Untitled",
    url: tab.url || "",
  }));
}

/**
 * Send tabs to POST /analyze-tabs on your backend.
 * @param {Array<{id: number, title: string, url: string}>} tabs
 * @returns {Promise<{analysis: string, tab_count: number}>}
 */
async function analyzeTabs(tabs) {
  const response = await fetch(`${CONFIG.API_URL}/analyze-tabs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tabs }),
  });

  if (!response.ok) {
    throw new Error(`API error: HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Close tabs by Chrome tab ID.
 * TODO: implement after analysis parsing works
 * @param {number[]} tabIds
 */
async function closeTabs(tabIds) {
  await Promise.all(tabIds.map((id) => chrome.tabs.remove(id)));
}
