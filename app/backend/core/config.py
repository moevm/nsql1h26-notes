from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    SECRET_KEY: str
    ALGORITHM: str
    ARANGO_ROOT_PASSWORD: str
    ARANGO_HOST: str
    ARANGO_PORT: int
    ARANGO_DB: str
    ARANGO_USER: str
    ARANGO_PASSWORD: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    @property
    def database_url(self) -> str:
        return f"http://{self.ARANGO_HOST}:{self.ARANGO_PORT}"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
