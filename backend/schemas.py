# Schemas — my-ai-chatbot

from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
