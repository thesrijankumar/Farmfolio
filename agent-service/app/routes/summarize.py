from fastapi import APIRouter, HTTPException
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from app.models import SummarizeRequest, SummarizeResponse
from app.services.llm_client import llm
from app.services.session_store import create_session

router = APIRouter()

_SYSTEM_PROMPT = (
    "You are an agricultural data assistant. You will be given raw satellite and "
    "climate data for a farmer's field (soil moisture, temperature, rainfall, "
    "vegetation index, etc.). Write a short, plain-language summary — 3 to 5 "
    "sentences — describing what the data shows about current field conditions.\n\n"
    "Rules:\n"
    "- Only describe the data given. Never invent numbers, dates, or conditions not present.\n"
    "- Do NOT give advice or tell the farmer what to do. Describe, don't recommend.\n"
    "- Use plain language — avoid raw variable names like GWETROOT or NDVI; explain what they mean.\n"
    "- If a value is missing or null, say the data wasn't available rather than skipping it silently."
)

# LCEL chain: prompt → llm → plain string
_prompt = ChatPromptTemplate.from_messages([
    ("system", _SYSTEM_PROMPT),
    ("human", "Here is the field data:\n{farm_data}"),
])

_chain = _prompt | llm | StrOutputParser()


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize(req: SummarizeRequest):
    farm_data = req.model_dump()

    try:
        summary_text = await _chain.ainvoke({"farm_data": farm_data})
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI summary generation failed: {e}")

    if not summary_text:
        raise HTTPException(status_code=502, detail="AI returned an empty summary")

    session_id = create_session(
        user_id=req.userId,
        farm_data=farm_data,
        summary_text=summary_text,
    )

    return SummarizeResponse(summary=summary_text, sessionId=session_id)