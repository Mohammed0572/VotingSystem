from pydantic_settings import BaseSettings, SettingsConfigDict # pyright: ignore[reportMissingImports]

class Settings(BaseSettings):
    FASTAPI_SECRET_KEY: str
    JWT_EXPIRY_HOURS: int = 24
    MATCH_TOLERANCE: float = 0.5

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
