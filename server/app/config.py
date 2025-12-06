# app/config.py
from functools import lru_cache
from typing import List

from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Comma-separated list of allowed origins for CORS
    CORS_ORIGINS: str = ""

    @property
    def cors_origins_list(self) -> List[AnyHttpUrl] | List[str]:
        if not self.CORS_ORIGINS:
            return []
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
