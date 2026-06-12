# Tab Therapist

A Chrome extension for people who open too many tabs and feel bad about it.

You click one button. It reads your open tabs, sends them to a small FastAPI backend, and gets back a structured triage: what to read now, what's safe to close, and which tabs are just procrastination dressed up as research. You can close tabs in bulk from the popup, or save the whole session and restore it later in one window.

Most tab managers organize bookmarks. This one tries to understand *why* you have 40 tabs open.

## What it does

- **Analyze** — AI sorts your tabs into read now / save for later / close guilt-free / anxiety
- **Tab shame score** — 1–10, with a short explanation
- **Domain breakdown** — see where your tabs actually live (github.com × 12, etc.)
- **Batch close** — checkboxes on close-worthy tabs, one confirm, done
- **Time Capsules** — save all open tabs locally, restore them later in a single window

## Stack

- Chrome Extension (Manifest V3, vanilla JS)
- Python / FastAPI
- OpenRouter (Gemini 2.5 Flash Lite)
- Hosted on Render

## Project structure

```
tab-therapist/
├── extension/          Chrome extension (the actual product)
├── backend/            FastAPI API + OpenRouter integration
└── frontend/           Original scaffold chat UI (optional, not required)
```

## Local setup

### Backend

```bash
cd backend
cp .env.example .env
# Add your OPENROUTER_API_KEY to .env

pip install -r requirements.txt
python3 -m uvicorn main:app --reload
```

API runs at `http://localhost:8000`. Check `http://localhost:8000/health`.

### Extension

1. Set `extension/config.js`:
   ```js
   const CONFIG = {
     API_URL: "http://localhost:8000",
   };
   ```
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. **Load unpacked** → select the `extension/` folder
5. Open a bunch of tabs, click the extension icon, hit **Analyze my tabs**

## Deploy backend (Render)

1. Push this repo to GitHub
2. Create a Web Service on [Render](https://render.com)
3. Build command: `cd backend && pip install -r requirements.txt`
4. Start command: `cd backend && python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables:
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_MODEL` = `google/gemini-2.5-flash-lite`
6. Point `extension/config.js` at your Render URL and reload the extension

## Environment variables

| `OPENROUTER_API_KEY` | `backend/.env` or Render | API key from [openrouter.ai/keys](https://openrouter.ai/keys) |
| `OPENROUTER_MODEL` | `backend/.env` or Render | Model slug (default: `google/gemini-2.5-flash-lite`) |
| `API_URL` | `extension/config.js` | Backend URL the extension calls |

Never commit `.env`. Never put API keys in `config.py`.

## API

`POST /analyze-tabs`

```json
{
  "tabs": [
    { "title": "GitHub", "url": "https://github.com", "id": 123 }
  ]
}
```

Returns structured analysis with `shame_score`, categorized tab lists, and `domain_breakdown`.

## Why this exists

I kept ending up with 30+ tabs across three windows, telling myself I'd "get back to them." Closing felt risky. Bookmarking everything felt like giving up. Tab Therapist is the thing I wanted: something that looks at the mess, tells me what's actually worth keeping, and lets me close the rest without guilt.

The session save feature came from the same place — sometimes you need to shut the laptop, not lose the research rabbit hole.
