from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str


class TabInfo(BaseModel):
    title: str
    url: str
    id: int | None = None


class AnalyzeTabsRequest(BaseModel):
    tabs: list[TabInfo]


class TabRecommendation(BaseModel):
    title: str
    url: str
    reason: str


class DomainCount(BaseModel):
    domain: str
    count: int


class TabAnalysis(BaseModel):
    shame_score: int
    shame_reason: str
    read_now: list[TabRecommendation]
    save_for_later: list[TabRecommendation]
    close_guilt_free: list[TabRecommendation]
    anxiety_tabs: list[TabRecommendation]
    next_action: str


class AnalyzeTabsResponse(BaseModel):
    tab_count: int
    domain_breakdown: list[DomainCount]
    analysis: TabAnalysis
