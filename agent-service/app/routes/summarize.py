from fastapi import APIRouter, HTTPException
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from app.models import SummarizeRequest, SummarizeResponse
from app.services.llm_client import llm
from app.services.session_store import create_session

router = APIRouter()

_SYSTEM_PROMPT_EN = (
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

_SYSTEM_PROMPT_HI = (
    "आप एक कृषि डेटा सहायक हैं। आपको एक किसान के खेत के लिए कच्चे उपग्रह और "
    "जलवायु डेटा (मिट्टी की नमी, तापमान, वर्षा, वनस्पति सूचकांक, आदि) दिए जाएंगे। "
    "एक छोटा, सरल भाषा में सारांश लिखें — 3 से 5 वाक्य — जो यह बताए कि डेटा "
    "वर्तमान खेत की स्थितियों के बारे में क्या दर्शाता है। सारांश हिंदी में लिखें।\n\n"
    "नियम:\n"
    "- केवल दिए गए डेटा का वर्णन करें। कभी भी कोई संख्या, तारीख, या स्थिति का "
    "आविष्कार न करें जो मौजूद नहीं है।\n"
    "- किसान को सलाह न दें या यह न बताएं कि क्या करें। वर्णन करें, सिफारिश न करें।\n"
    "- सरल भाषा का उपयोग करें — GWETROOT या NDVI जैसे कच्चे चर नामों से बचें; "
    "समझाएं कि उनका क्या मतलब है।\n"
    "- यदि कोई मान अनुपलब्ध या शून्य है, तो कहें कि डेटा उपलब्ध नहीं था।"
)


def _build_chain(language: str):
    system_prompt = _SYSTEM_PROMPT_HI if language == "hi" else _SYSTEM_PROMPT_EN
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "Here is the field data:\n{farm_data}"),
    ])
    return prompt | llm | StrOutputParser()


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize(req: SummarizeRequest):
    farm_data = req.model_dump(exclude={"language"})

    chain = _build_chain(req.language)

    try:
        summary_text = await chain.ainvoke({"farm_data": farm_data})
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