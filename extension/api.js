function normalizeUrl(url) {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`.replace(/\/$/, "");
  } catch {
    return url;
  }
}

function matchTabId(url, openTabs) {
  const target = normalizeUrl(url);
  const exact = openTabs.find((t) => normalizeUrl(t.url) === target);
  if (exact) return exact.id;

  const loose = openTabs.find((t) => t.url && t.url.startsWith(url.split("#")[0]));
  return loose?.id ?? null;
}

async function getOpenTabs() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  return tabs
    .filter((t) => t.id && t.url && !t.url.startsWith("chrome://"))
    .map((t) => ({
      id: t.id,
      title: t.title || "Untitled",
      url: t.url,
    }));
}

async function getAllTabs() {
  const tabs = await chrome.tabs.query({});
  return tabs
    .filter((t) => t.id && t.url && !t.url.startsWith("chrome://"))
    .map((t) => ({
      id: t.id,
      title: t.title || "Untitled",
      url: t.url,
    }));
}

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

async function closeTabs(tabIds) {
  const valid = tabIds.filter((id) => id != null);
  await Promise.all(valid.map((id) => chrome.tabs.remove(id)));
}
