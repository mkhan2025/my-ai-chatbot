# LLM Service — my-ai-chatbot

import json
from typing import AsyncGenerator
import httpx

from config import settings


class LLMService:
    """
    LLM service via OpenRouter (OpenAI-compatible API).
    Supports streaming responses.
    """

    def __init__(self):
        self.api_key = settings.openrouter_api_key
        self.base_url = settings.openrouter_base_url
        self.model = settings.openrouter_model

    async def stream_chat(
        self,
        system_prompt: str,
        conversation: list[dict[str, str]],
    ) -> AsyncGenerator[str, None]:
        messages = [{"role": "system", "content": system_prompt}] + conversation

        payload = {
            "model": self.model,
            "messages": messages,
            "stream": True,
            "temperature": 0.7,
            "max_tokens": 2048,
        }

        async with httpx.AsyncClient(
            base_url=self.base_url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
        ) as client:
            try:
                async with client.stream(
                    method="POST",
                    url="/chat/completions",
                    json=payload,
                    timeout=60.0,
                ) as response:
                    response.raise_for_status()

                    async for line in response.aiter_lines():
                        if not line.startswith("data: "):
                            continue

                        data_str = line[6:]

                        if data_str.strip() == "[DONE]":
                            break

                        try:
                            chunk = json.loads(data_str)
                            if chunk.get("choices") and len(chunk["choices"]) > 0:
                                delta = chunk["choices"][0].get("delta", {})
                                content = delta.get("content")
                                if content:
                                    yield content
                        except json.JSONDecodeError:
                            continue

            except httpx.ConnectError:
                yield "\n\nConnection error. Please check your network."
            except httpx.TimeoutException:
                yield "\n\nRequest timed out. Please try again."
            except httpx.HTTPStatusError as e:
                status_code = getattr(getattr(e, "response", None), "status_code", "unknown")
                yield f"\n\nAPI error: HTTP {status_code}"
            except Exception as e:
                yield f"\n\nUnexpected error: {str(e)}"

    async def complete_chat(
        self,
        system_prompt: str,
        conversation: list[dict[str, str]],
    ) -> str:
        """Non-streaming chat — collects full response (used by Tab Analyzer)."""
        parts: list[str] = []
        async for token in self.stream_chat(system_prompt, conversation):
            parts.append(token)
        return "".join(parts)
