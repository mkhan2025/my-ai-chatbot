import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_model: str = "google/gemini-2.5-flash-lite"

    app_host: str = "0.0.0.0"
    app_port: int = int(os.environ.get("PORT", 8000))

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
