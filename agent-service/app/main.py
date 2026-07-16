from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.routes import summarize, chat  # noqa: E402

app = FastAPI(title="Soil Advisory - Agent Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your actual origins later
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "agent-service"}


app.include_router(summarize.router)
app.include_router(chat.router)


if __name__ == "__main__":
    import os
    import uvicorn

    port = int(os.getenv("PORT", "8001"))
    reload = os.getenv("ENV") == "development"
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=reload)