from fastapi import APIRouter, HTTPException
from schemas.schemas import ChatRequest, ChatResponse, ActionPayload
from ai_agent.agent import run_agent

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main AI chat endpoint.
    Accepts user message + conversation history.
    Returns assistant reply + optional frontend action to trigger.
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    history = [msg.dict() for msg in (request.history or [])]

    result = run_agent(
        user_message=request.message,
        history=history,
    )

    action = None
    if result.get("action"):
        action = ActionPayload(
            type=result["action"].get("type", "NONE"),
            data=result["action"].get("data"),
        )

    return ChatResponse(
        reply=result["reply"],
        action=action,
    )


@router.get("/suggestions")
def get_suggestions():
    """Return example prompts to show in the chat UI."""
    return {
        "suggestions": [
            "Show me wireless earbuds under ₹5000",
            "What are your best-selling products?",
            "Search for yoga mats",
            "Show me all electronics",
            "Find shoes between ₹2000 and ₹5000",
            "What books do you recommend?",
            "Add the first product to my cart",
            "Compare the top 2 laptops",
            "Go to my cart",
            "Show me beauty products",
        ]
    }
