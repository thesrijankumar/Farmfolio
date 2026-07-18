from fastapi import APIRouter, HTTPException
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from app.models import ChatRequest, ChatResponse
from app.services.llm_client import llm
from app.services.session_store import get_session, get_chat_history

router = APIRouter()

_SYSTEM_PROMPT = (
    "You are an expert agronomy assistant helping a farmer understand their field's "
    "satellite and climate data. Here is the field data you have available:\n\n"
    "{farm_data}\n\n"
    "Here is the summary already given to the farmer:\n{summary_text}\n\n"
    "Rules:\n"
    "- Use the provided field data as the factual basis for the current conditions.\n"
    "- You may use your broad agronomic knowledge to suggest suitable crops, irrigation "
    "strategies, and best practices based on this data.\n"
    "- If asked about something completely unrelated to farming or the data, gently steer "
    "the conversation back to the field.\n"
    "- Keep answers concise, practical, and in plain language."
)

# MessagesPlaceholder injects the full LangChain message history into the prompt
_prompt = ChatPromptTemplate.from_messages([
    ("system", _SYSTEM_PROMPT),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{question}"),
])

_chain = _prompt | llm | StrOutputParser()


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    session = get_session(req.sessionId)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    history = get_chat_history(req.sessionId)
    if history is None:
        raise HTTPException(status_code=404, detail="Chat history not found")

    try:
        reply_text = await _chain.ainvoke({
            "farm_data": session["farm_data"],
            "summary_text": session["summary_text"],
            "history": history.messages,   # list[BaseMessage]
            "question": req.question,
        })
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI chat failed: {e}")

    if not reply_text:
        raise HTTPException(status_code=502, detail="AI returned an empty reply")

    # Persist turn into LangChain history
    history.add_user_message(req.question)
    history.add_ai_message(reply_text)

    return ChatResponse(reply=reply_text)