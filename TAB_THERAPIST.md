# Tab Therapist — Build Guide

Chrome extension + FastAPI backend that analyzes tab overload using AI.

---

## What you have now (project structure in simple terms)

Think of your project as **3 parts**:

```
my-ai-chatbot/
├── backend/          ← The brain (Python server on Render)
├── frontend/         ← The old chat website (Vercel) — optional now
└── extension/        ← The new product (Chrome extension) — NEW
```

### `backend/` — The brain

| File | What it does (simple) |
|------|------------------------|
| `main.py` | Front door of the server. Defines URLs like `/health`, `/chat`, `/analyze-tabs` |
| `config.py` | Reads secrets from `.env` (API keys) |
| `schemas.py` | Defines shape of JSON requests (what data looks like) |
| `services/llm.py` | Talks to OpenRouter AI |
| `services/tab_analyzer.py` | Formats your tabs and asks AI to analyze them |
| `data/tab_therapist_prompt.py` | Instructions that tell AI *how* to act (Tab Therapist persona) |
| `data/system_prompt.py` | Old generic chat prompt (can ignore for now) |

**Flow:** Extension sends tab list → `main.py` → `tab_analyzer.py` → `llm.py` → OpenRouter → analysis text back

### `frontend/` — The old chat website

A React website with a floating chat bubble. You built this from the scaffold. **Tab Therapist doesn't need it** — the extension has its own UI. Keep it for portfolio diversity or remove later.

### `extension/` — The Chrome extension (NEW)

| File | What it does (simple) |
|------|------------------------|
| `manifest.json` | Extension config — tells Chrome what permissions it needs |
| `config.js` | Your backend URL (localhost or Render) |
| `popup.html` | The small window when you click the extension icon |
| `popup.js` | Button logic — "Analyze my tabs" |
| `api.js` | Reads tabs from Chrome + calls your backend |
| `background.js` | Runs in background (optional tab count badge) |
| `styles.css` | Makes the popup look good |

**Flow:** User clicks icon → popup opens → reads tabs via Chrome API → POST to Render → shows AI analysis

### Deployed services

| Service | URL | Role |
|---------|-----|------|
| Render | `https://my-ai-chatbot-3jv4.onrender.com` | Hosts `backend/` |
| Vercel | `https://my-ai-chatbot-dun.vercel.app` | Hosts `frontend/` (optional) |
| Chrome | `chrome://extensions` | Loads `extension/` locally |

---

## Build order (fastest path to resume-ready demo)

### Phase 1 — Backend works locally (30 min)

- [ ] **1.1** Start backend:
  ```bash
  cd backend
  python3 -m uvicorn main:app --reload
  ```
- [ ] **1.2** Test new endpoint:
  ```bash
  curl -X POST http://localhost:8000/analyze-tabs \
    -H "Content-Type: application/json" \
    -d '{"tabs":[{"title":"GitHub","url":"https://github.com"},{"title":"Reddit","url":"https://reddit.com"}]}'
  ```
  Expected: JSON with `"analysis"` containing Tab Therapist sections.
- [ ] **1.3** Tweak `backend/data/tab_therapist_prompt.py` until output looks good.

### Phase 2 — Extension works locally (45 min)

- [ ] **2.1** Set `extension/config.js` → `API_URL: "http://localhost:8000"`
- [ ] **2.2** Add icons OR remove `"icons"` block from `manifest.json` for now.
- [ ] **2.3** Open Chrome → `chrome://extensions` → Enable **Developer mode**
- [ ] **2.4** Click **Load unpacked** → select the `extension/` folder
- [ ] **2.5** Open 10+ tabs, click Tab Therapist icon → **Analyze my tabs**
- [ ] **2.6** Fix errors (CORS should already work — backend allows `*`)

### Phase 3 — Deploy backend (15 min)

- [ ] **3.1** Commit and push:
  ```bash
  git add .
  git commit -m "Add Tab Therapist extension and /analyze-tabs endpoint"
  git push
  ```
- [ ] **3.2** Render → Manual Deploy → wait for **Deploy live**
- [ ] **3.3** Test production:
  ```bash
  curl -X POST https://my-ai-chatbot-3jv4.onrender.com/analyze-tabs \
    -H "Content-Type: application/json" \
    -d '{"tabs":[{"title":"Test","url":"https://example.com"}]}'
  ```

### Phase 4 — Point extension at production (10 min)

- [ ] **4.1** Update `extension/config.js`:
  ```js
  API_URL: "https://my-ai-chatbot-3jv4.onrender.com",
  ```
- [ ] **4.2** Update `extension/manifest.json` `host_permissions` if URL changed
- [ ] **4.3** Chrome → extension → click **Reload** (refresh icon)
- [ ] **4.4** Test with real tabs against live backend

### Phase 5 — Polish for resume (1–2 hours, optional but high value)

- [ ] **5.1** Parse "Close Guilt-Free" section → add **Close tabs** button
- [ ] **5.2** Tab shame score as a big number at top of popup
- [ ] **5.3** Record 30-sec demo video (Loom)
- [ ] **5.4** Update GitHub README with Tab Therapist description + screenshot
- [ ] **5.5** Rename repo to `tab-therapist` on GitHub

---

## TODOs in code (what to implement next)

| File | TODO |
|------|------|
| `extension/config.js` | Switch API_URL between local and Render |
| `extension/icons/` | Add PNG icons or remove from manifest |
| `extension/api.js` | `closeTabs()` — batch close from analysis |
| `extension/popup.js` | Parse markdown properly; wire close button |
| `extension/background.js` | Optional tab count badge |
| `backend/services/tab_analyzer.py` | Improve tab formatting (group by domain, etc.) |

---

## Resume bullet (copy when done)

> **Tab Therapist** — Chrome extension + FastAPI backend that analyzes browser tab overload using LLM clustering. Reads open tabs via Chrome Tabs API, returns prioritized read/close recommendations, deployed on Render with OpenRouter.

**Tech:** Python, FastAPI, Chrome Extension MV3, OpenRouter, Render

---

## Learning checkpoints

As you build, you should understand:

1. **Chrome Tabs API** — `chrome.tabs.query()` reads tab metadata
2. **Extension permissions** — `manifest.json` declares what extension can access
3. **REST API** — extension `fetch()` → backend `POST /analyze-tabs`
4. **System prompts** — `tab_therapist_prompt.py` controls AI behavior
5. **CORS** — backend must allow requests from extension origin (already set to `*`)
6. **Deploy flow** — code → GitHub → Render auto-deploy → update extension config

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Extension can't reach backend | Check `config.js` API_URL; backend running? |
| `Failed to fetch` on Render | Free tier cold start — wait 60s, retry |
| No icons error | Add PNGs to `extension/icons/` or remove icons from manifest |
| Generic AI response | Edit `tab_therapist_prompt.py`; redeploy Render |
| 402 error | Add OpenRouter credits |
