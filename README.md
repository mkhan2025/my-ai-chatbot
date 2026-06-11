# my-ai-chatbot

AI Chatbot powered by OpenRouter

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env and add your API key
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Deploy

### Backend — Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/YOUR_USERNAME/my-ai-chatbot)

Create a new Web Service, set the build command to `cd backend && pip install -r requirements.txt` and start command to `cd backend && python -m uvicorn main:app --host 0.0.0.0 --port $PORT`.

### Frontend — Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/my-ai-chatbot)

Set the root directory to `frontend` and add environment variable `VITE_API_URL` pointing to your backend URL.

## Environment Variables

| Variable | Description |
|---|---|
| `OPENROUTER_API_KEY` | Get your free key at https://openrouter.ai/keys |
| `OPENROUTER_MODEL` | Model to use (default: `google/gemini-2.0-flash-lite-001`) |
| `VITE_API_URL` | Backend URL (default: `http://localhost:8000`) |

## Project Structure

```
my-ai-chatbot/
├── backend/
│   ├── main.py          # FastAPI app with /chat and /health endpoints
│   ├── config.py        # Settings via pydantic-settings
│   ├── schemas.py       # Pydantic request/response models
│   ├── services/
│   │   └── llm.py       # LLM service with streaming support
│   ├── data/
│   │   └── system_prompt.py  # Customize your system prompt here
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   └── Chat.tsx
│   │   └── lib/
│   │       └── api.ts
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Customization

### Change the System Prompt

Edit `backend/data/system_prompt.py` to define your chatbot's personality and capabilities.

### Add Tools

Edit `backend/main.py` to add function-calling tools. See the [OpenRouter docs](https://openrouter.ai/docs) for the tool calling format.

### Change the Theme

Edit `frontend/tailwind.config.js` to customize colors, fonts, and styling.

## License

MIT
