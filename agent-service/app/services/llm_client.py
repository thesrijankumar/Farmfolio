import os
from openai import AsyncOpenAI

_api_key = os.getenv("GROQ_API_KEY")
if not _api_key:
    raise RuntimeError(
        "GROQ_API_KEY is not set. Add it to agent-service/.env before starting the service."
    )

client = AsyncOpenAI(
    api_key=_api_key,
    base_url="https://api.groq.com/openai/v1",
)

MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
