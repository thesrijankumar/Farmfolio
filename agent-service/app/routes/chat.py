from typing import cast
from fastapi import APIRouter, HTTPException
from openai.types.chat import ChatCompletionMessageParam
from app.models import ChatRequest, ChatResponse
from app.services.llm_client import client, MODEL
from app.services.session_store import get_session, append_message

router = APIRouter()


def build_system_prompt(session: dict) -> str:
    return (
        "You are an expert agronomy assistant helping a farmer understand their field's "
        "satellite and climate data. Here is the field data you have available:\n\n"
        f"{session['farm_data']}\n\n"
        f"Here is the summary already given to the farmer:\n{session['summary_text']}\n\n"
        "Rules:\n"
        "- Use the provided field data as the factual basis for the current conditions.\n"
        "- You may use your broad agronomic knowledge to suggest suitable crops, irrigation strategies, and best practices based on this data.\n"
        "- If asked about something completely unrelated to farming or the data, gently steer the conversation back to the field.\n"
        "- Keep answers concise, practical, and in plain language."
    )


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    session = get_session(req.sessionId)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    system_prompt = build_system_prompt(session)

    messages: list[ChatCompletionMessageParam] = [
        {"role": "system", "content": system_prompt}
    ]
    messages += [
        {"role": m["role"], "content": m["content"]} for m in session["conversation"]
    ]
    messages.append({"role": "user", "content": req.question})

    try:
        response = await client.chat.completions.create(model=MODEL, messages=messages)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI chat failed: {e}")

    reply_text = response.choices[0].message.content
    if not reply_text:
        raise HTTPException(status_code=502, detail="AI returned an empty reply")

    append_message(req.sessionId, "user", req.question)
    append_message(req.sessionId, "assistant", reply_text)

    return ChatResponse(reply=reply_text)