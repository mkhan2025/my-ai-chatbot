from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from config import settings
from schemas import ChatRequest
from services.llm import LLMService
from data.system_prompt import SYSTEM_PROMPT

llm_service = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global llm_service
    llm_service = LLMService()
    yield


app = FastAPI(title="my-ai-chatbot", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_conversation_history: list = []


@app.post("/chat")
async def chat(request: ChatRequest):
    _conversation_history.append({"role": "user", "content": request.message})

    async def event_generator():
        full_response = ""
        async for token in llm_service.stream_chat(SYSTEM_PROMPT, _conversation_history):
            full_response += token
            yield "data: " + token + "\n\n"
        _conversation_history.append({"role": "assistant", "content": full_response})
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/health")
async def health():
    return {"status": "ok"}
