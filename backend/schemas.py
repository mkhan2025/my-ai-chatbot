# Schemas — my-ai-chatbot

from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str


class TabInfo(BaseModel):
    """A single browser tab sent from the Chrome extension."""

    title: str
    url: str
    id: int | None = None  # Chrome tab ID — used later for batch close


class AnalyzeTabsRequest(BaseModel):
    """Request body for POST /analyze-tabs."""

    tabs: list[TabInfo]
