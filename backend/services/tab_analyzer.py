# Tab Analyzer — formats tabs and sends them to the LLM

from services.llm import LLMService


class TabAnalyzer:
    """Analyzes open browser tabs using the Tab Therapist prompt."""

    def __init__(self, llm_service: LLMService):
        self.llm = llm_service

    def format_tabs_message(self, tabs: list[dict]) -> str:
        """Turn tab objects into a message the LLM can understand."""
        # TODO: implement formatting
        lines = [f"I have {len(tabs)} open tabs:\n"]
        for i, tab in enumerate(tabs, 1):
            title = tab.get("title", "Untitled")
            url = tab.get("url", "")
            lines.append(f"{i}. {title}\n   {url}")
        return "\n".join(lines)

    async def analyze(self, tabs: list[dict], system_prompt: str) -> str:
        """Send tabs to OpenRouter and return the full analysis."""
        user_message = self.format_tabs_message(tabs)
        conversation = [{"role": "user", "content": user_message}]
        # TODO: wire up llm.complete_chat once implemented
        return await self.llm.complete_chat(system_prompt, conversation)
