import uuid
from typing import Any, Optional
from langchain_core.chat_history import InMemoryChatMessageHistory

# In-memory store — resets on restart.
# Swap these dicts for DB-backed implementations later; keep the 4 function
# signatures identical so nothing else in the app needs to change.

_sessions: dict[str, dict[str, Any]] = {}
_histories: dict[str, InMemoryChatMessageHistory] = {}


def create_session(user_id: str, farm_data: dict, summary_text: str) -> str:
    session_id = str(uuid.uuid4())
    _sessions[session_id] = {
        "user_id": user_id,
        "farm_data": farm_data,
        "summary_text": summary_text,
    }
    _histories[session_id] = InMemoryChatMessageHistory()
    return session_id


def get_session(session_id: str) -> Optional[dict[str, Any]]:
    return _sessions.get(session_id)


def get_chat_history(session_id: str) -> Optional[InMemoryChatMessageHistory]:
    return _histories.get(session_id)