from fastapi import APIRouter, HTTPException
from app.models import SummarizeRequest, SummarizeResponse
from app.services.llm_client import client, MODEL
from app.services.session_store import create_session

router = APIRouter()

SUMMARY_SYSTEM_PROMPT = (
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


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize(req: SummarizeRequest):
    farm_data = req.model_dump()

    try:
        response = await client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": SUMMARY_SYSTEM_PROMPT},
                {"role": "user", "content": f"Here is the field data:\n{farm_data}"},
            ],
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI summary generation failed: {e}")

    summary_text = response.choices[0].message.content
    if not summary_text:
        raise HTTPException(status_code=502, detail="AI returned an empty summary")

    session_id = create_session(
        user_id=req.userId,
        farm_data=farm_data,
        summary_text=summary_text,
    )

    return SummarizeResponse(summary=summary_text, sessionId=session_id)