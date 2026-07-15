from pydantic import BaseModel
from typing import Any


class Location(BaseModel):
    lat: float
    lon: float


class SummarizeRequest(BaseModel):
    """Matches the `farmData` object your Elysia /api/land-report sends."""
    location: Location
    climate: dict[str, Any]
    vegetation: dict[str, Any]
    userId: str


class SummarizeResponse(BaseModel):
    summary: str
    sessionId: str


class ChatRequest(BaseModel):
    """Matches what your Elysia /api/ask forwards."""
    sessionId: str
    question: str


class ChatResponse(BaseModel):
    reply: str