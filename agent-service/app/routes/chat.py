from fastapi import APIRouter, HTTPException
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from app.models import ChatRequest, ChatResponse
from app.services.llm_client import llm
from app.services.session_store import get_session, get_chat_history

router = APIRouter()

_SYSTEM_PROMPT_EN = (
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

_SYSTEM_PROMPT_HI = (
    "आप एक विशेषज्ञ कृषि सहायक हैं जो एक किसान को उनके खेत के उपग्रह और जलवायु डेटा "
    "को समझने में मदद कर रहे हैं। यहाँ उपलब्ध खेत का डेटा है:\n\n"
    "{farm_data}\n\n"
    "यहाँ किसान को पहले दिया गया सारांश है:\n{summary_text}\n\n"
    "नियम:\n"
    "- वर्तमान स्थितियों के लिए प्रदान किए गए खेत डेटा को तथ्यात्मक आधार के रूप में उपयोग करें।\n"
    "- आप इस डेटा के आधार पर उपयुक्त फसलों, सिंचाई रणनीतियों और सर्वोत्तम प्रथाओं का "
    "सुझाव देने के लिए अपने व्यापक कृषि ज्ञान का उपयोग कर सकते हैं।\n"
    "- यदि खेती या डेटा से पूरी तरह असंबंधित कुछ पूछा जाए, तो धीरे से बातचीत को खेत "
    "की ओर वापस मोड़ें।\n"
    "- उत्तर संक्षिप्त, व्यावहारिक और सरल भाषा में हिंदी में दें।"
)


def _build_chain(language: str):
    system_prompt = _SYSTEM_PROMPT_HI if language == "hi" else _SYSTEM_PROMPT_EN
    # MessagesPlaceholder injects the full LangChain message history into the prompt
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{question}"),
    ])
    return prompt | llm | StrOutputParser()


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    session = get_session(req.sessionId)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    history = get_chat_history(req.sessionId)
    if history is None:
        raise HTTPException(status_code=404, detail="Chat history not found")

    chain = _build_chain(req.language)

    try:
        reply_text = await chain.ainvoke({
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