"""
config.py — centralised environment config via pydantic-settings.
Values are read from .env automatically.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Server
    PORT: int = 4000

    # CORS — comma-separated origins, e.g. "http://localhost:5173,https://investsafe.app"
    ALLOWED_ORIGINS: List[str] = ["*"]

    # Anthropic
    ANTHROPIC_API_KEY: str = ""

    # Alpha Vantage (free: 25 req/day)
    ALPHA_VANTAGE_KEY: str = ""

    # Market ticker cache TTL in seconds
    MARKET_CACHE_TTL: int = 60

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()