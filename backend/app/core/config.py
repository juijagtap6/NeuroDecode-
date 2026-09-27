"""Application configuration settings."""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_CACHE_DIR = BASE_DIR / "data" / "allen_cache"

class Settings:
    PROJECT_NAME: str = "NeuroDecode"
    VERSION: str = "0.1.0"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = os.getenv("NEURODECODE_DEBUG", "True").lower() == "true"
    
    # Allen Institute Cache Path
    ALLEN_CACHE_DIR: Path = Path(os.getenv("ALLEN_CACHE_DIR", str(DEFAULT_CACHE_DIR)))
    
    # CORS Origins
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

settings = Settings()
