import os
from langchain_groq import ChatGroq

_api_key = os.getenv("GROQ_API_KEY")
if not _api_key:
    raise RuntimeError(
        "GROQ_API_KEY is not set. Add it to agent-service/.env before starting the service."
    )

MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# Shared LangChain LLM instance — used by all chains
llm = ChatGroq(
    api_key=_api_key,
    model=MODEL,
    temperature=0.7,
)
