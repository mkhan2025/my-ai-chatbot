// Tab Therapist — background service worker
// TODO: optional — show tab count badge on extension icon

chrome.runtime.onInstalled.addListener(() => {
  console.log("Tab Therapist installed");
});

/**
 * Update badge with open tab count across all windows.
 * TODO: uncomment to enable badge
 */
async function updateBadge() {
  const tabs = await chrome.tabs.query({});
  const count = tabs.length;
  chrome.action.setBadgeText({ text: count > 99 ? "99+" : String(count) });
  chrome.action.setBadgeBackgroundColor({ color: "#6366f1" });
}

// updateBadge();
