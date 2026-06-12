import json
import re
from urllib.parse import urlparse

from schemas import DomainCount, TabAnalysis, TabRecommendation
from services.llm import LLMService


class TabAnalyzer:
    def __init__(self, llm_service: LLMService):
        self.llm = llm_service

    def format_tabs_message(self, tabs: list[dict]) -> str:
        lines = [f"I have {len(tabs)} open tabs:\n"]
        for i, tab in enumerate(tabs, 1):
            title = tab.get("title", "Untitled")
            url = tab.get("url", "")
            lines.append(f"{i}. {title}\n   {url}")
        return "\n".join(lines)

    def compute_domain_breakdown(self, tabs: list[dict]) -> list[DomainCount]:
        counts: dict[str, int] = {}
        for tab in tabs:
            url = tab.get("url", "")
            try:
                domain = urlparse(url).netloc or "unknown"
            except Exception:
                domain = "unknown"
            if domain.startswith("www."):
                domain = domain[4:]
            counts[domain] = counts.get(domain, 0) + 1

        sorted_domains = sorted(counts.items(), key=lambda x: x[1], reverse=True)
        return [DomainCount(domain=d, count=c) for d, c in sorted_domains[:10]]

    def _parse_llm_json(self, raw: str) -> dict:
        text = raw.strip()

        fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
        if fence_match:
            text = fence_match.group(1).strip()

        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            text = text[start : end + 1]

        return json.loads(text)

    def _to_recommendations(self, items: list) -> list[TabRecommendation]:
        result = []
        for item in items or []:
            if isinstance(item, dict) and item.get("url"):
                result.append(
                    TabRecommendation(
                        title=item.get("title", "Untitled"),
                        url=item["url"],
                        reason=item.get("reason", ""),
                    )
                )
        return result[:3]

    def _fallback_analysis(self, raw: str, tab_count: int) -> TabAnalysis:
        return TabAnalysis(
            shame_score=min(tab_count, 10),
            shame_reason="Couldn't parse the model response.",
            read_now=[],
            save_for_later=[],
            close_guilt_free=[],
            anxiety_tabs=[],
            next_action=raw[:200] if raw else "Try again.",
        )

    def _build_analysis(self, data: dict, raw_fallback: str, tab_count: int) -> TabAnalysis:
        try:
            return TabAnalysis(
                shame_score=max(1, min(10, int(data.get("shame_score", 5)))),
                shame_reason=data.get("shame_reason", ""),
                read_now=self._to_recommendations(data.get("read_now")),
                save_for_later=self._to_recommendations(data.get("save_for_later")),
                close_guilt_free=self._to_recommendations(data.get("close_guilt_free")),
                anxiety_tabs=self._to_recommendations(data.get("anxiety_tabs")),
                next_action=data.get("next_action", ""),
            )
        except (TypeError, ValueError):
            return self._fallback_analysis(raw_fallback, tab_count)

    async def analyze(self, tabs: list[dict], system_prompt: str) -> tuple[TabAnalysis, list[DomainCount]]:
        user_message = self.format_tabs_message(tabs)
        conversation = [{"role": "user", "content": user_message}]
        raw = await self.llm.complete_chat(system_prompt, conversation)
        domain_breakdown = self.compute_domain_breakdown(tabs)

        try:
            data = self._parse_llm_json(raw)
            analysis = self._build_analysis(data, raw, len(tabs))
        except (json.JSONDecodeError, KeyError):
            analysis = self._fallback_analysis(raw, len(tabs))

        return analysis, domain_breakdown
