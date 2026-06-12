const STORAGE_KEY = "tab_therapist_sessions";
const MAX_SESSIONS = 20;

async function getSessions() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return data[STORAGE_KEY] || [];
}

async function saveSessions(sessions) {
  await chrome.storage.local.set({ [STORAGE_KEY]: sessions });
}

async function saveSession(name, tabs) {
  const sessions = await getSessions();
  const session = {
    id: crypto.randomUUID(),
    name: name || `Session ${new Date().toLocaleString()}`,
    createdAt: new Date().toISOString(),
    tabs: tabs.map(({ title, url }) => ({ title, url })),
  };
  sessions.unshift(session);
  await saveSessions(sessions.slice(0, MAX_SESSIONS));
  return session;
}

async function restoreSession(sessionId) {
  const sessions = await getSessions();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session || session.tabs.length === 0) return false;

  const urls = session.tabs.map((t) => t.url).filter(Boolean);
  if (urls.length === 0) return false;

  await chrome.windows.create({ url: urls });
  return true;
}

async function deleteSession(sessionId) {
  const sessions = await getSessions();
  await saveSessions(sessions.filter((s) => s.id !== sessionId));
}
