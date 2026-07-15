from fastapi import APIRouter, HTTPException
from app.models import ChatRequest, ChatResponse
from app.services.llm_client import client, MODEL
from app.services.session_store import get_session, append_message

router = APIRouter()


def build_system_prompt(session: dict) -> str:
    return (
        "You are a farming assistant helping a farmer understand their field's "
        "satellite and climate data. Here is the field data you have available:\n\n"
        f"{session['farm_data']}\n\n"
        f"Here is the summary already given to the farmer:\n{session['summary_text']}\n\n"
        "Rules:\n"
        "- Only answer using the data provided above. Never invent numbers, forecasts, "
        "or facts not present in this data.\n"
        "- If the farmer asks something this data cannot answer, say plainly that you "
        "don't have that information, rather than guessing.\n"
        "- Do not give directive advice unless explicitly asked for your opinion.\n"
        "- Keep answers short and in plain language."
    )


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    session = get_session(req.sessionId)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    system_prompt = build_system_prompt(session)
    messages = [{"role": "system", "content": system_prompt}]
    messages += [{"role": m["role"], "content": m["content"]} for m in session["conversation"]]
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