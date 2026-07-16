import uuid
from typing import Any, Optional

# In-memory for now — resets on restart,
# Swap this file for real DB calls later; keep these 3 function signatures
# the same so nothing else in the app needs to change.

_sessions: dict[str, dict[str, Any]] = {}


def create_session(user_id: str, farm_data: dict, summary_text: str) -> str:
    session_id = str(uuid.uuid4())
    _sessions[session_id] = {
        "user_id": user_id,
        "farm_data": farm_data,
        "summary_text": summary_text,
        "conversation": [],
    }
    return session_id


def get_session(session_id: str) -> Optional[dict[str, Any]]:
    return _sessions.get(session_id)


def append_message(session_id: str, role: str, content: str) -> None:
    session = _sessions.get(session_id)
    if session is not None:
        session["conversation"].append({"role": role, "content": content})