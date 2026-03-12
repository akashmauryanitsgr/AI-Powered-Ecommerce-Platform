"""
AI Shopping Agent powered by LangChain.
Supports Gemini API, Groq API, and OpenAI API (configurable via environment variables).
"""
import os
import json
import re
import traceback
from typing import Optional, List

from langchain.agents import AgentExecutor, create_react_agent
from langchain.prompts import PromptTemplate

from ai_agent.tools import (
    ALL_TOOLS,
    filter_by_category,
    filter_by_price_range,
    get_categories,
    get_featured_products,
    search_products,
)


# ─── LLM Setup ───────────────────────────────────────────────────────────────

def get_llm():
    """
    Returns the configured LLM instance.
    Set LLM_PROVIDER to 'gemini', 'groq', or 'openai' in your .env file.
    """
    provider = os.getenv("LLM_PROVIDER", "gemini").lower()
    if provider == "grok":
        provider = "groq"

    if provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model=os.getenv("GEMINI_MODEL", "gemini-1.5-flash"),
            google_api_key=os.getenv("GEMINI_API_KEY"),
            temperature=0.3,
        )

    elif provider == "groq":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            openai_api_key=os.getenv("GROQ_API_KEY") or os.getenv("GROK_API_KEY"),
            openai_api_base="https://api.groq.com/openai/v1",
            temperature=0.3,
        )

    elif provider == "openai":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            temperature=0.3,
        )

    else:
        raise ValueError(f"Unknown LLM_PROVIDER: {provider}. Choose: gemini, groq, openai")


# ─── Agent Prompt ─────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are ShopMind, a helpful and friendly AI shopping assistant for an e-commerce store.

You help users find products, filter by category/price, navigate the store, and answer product questions.

Available categories: Electronics, Fashion, Footwear, Beauty, Home Decor, Groceries, Accessories, Fitness, Books
All prices are in Indian Rupees (₹).

TOOL USAGE RULES:
- User wants to SEE products → call data tool (search_products/filter_by_category) + ui tool (ui_search_products/ui_filter_category)
- User wants to NAVIGATE → call ui_navigate
- User wants to SCROLL → call ui_scroll
- User asks a QUESTION only → call data tools only, no ui tool needed
- Data tools give product info to build your reply
- UI tools drive what the frontend displays

You have access to these tools:
{tools}

Use this format:
Question: the input question you must answer
Thought: think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: your helpful reply to the user

Begin!

Previous conversation:
{chat_history}

Question: {input}
Thought: {agent_scratchpad}"""


# ─── Agent Execution ──────────────────────────────────────────────────────────

def run_agent(
    user_message: str,
    history: Optional[List[dict]] = None
) -> dict:
    """
    Run the shopping agent and return reply + optional frontend action.
    Returns: {"reply": str, "action": {"type": str, "data": dict} | None}
    """
    try:
        llm = get_llm()

        # Format chat history for the prompt
        chat_history_str = ""
        if history:
            for msg in history[-6:]:  # Last 6 messages for context
                role = "User" if msg.get("role") == "user" else "Assistant"
                chat_history_str += f"{role}: {msg.get('content', '')}\n"

        prompt = PromptTemplate(
            template=SYSTEM_PROMPT,
            input_variables=["tools", "tool_names", "chat_history", "input", "agent_scratchpad"]
        )

        agent = create_react_agent(llm, ALL_TOOLS, prompt)
        agent_executor = AgentExecutor(
            agent=agent,
            tools=ALL_TOOLS,
            verbose=False,
            max_iterations=5,
            handle_parsing_errors=True,
            return_intermediate_steps=True,
        )

        # Return intermediate steps so we can extract ui_action from tool outputs
        result = agent_executor.invoke({
            "input": user_message,
            "chat_history": chat_history_str,
        })

        reply = result.get("output", "").strip()

        # Extract ui_action from tool outputs in intermediate steps.
        # LLM called a ui_* tool -> that tool returned {"ui_action": ..., "params": ...}
        # We scan all tool observations and pick the last ui_action found.
        action = extract_ui_action_from_steps(
            result.get("intermediate_steps", [])
        )

        return {"reply": reply, "action": action}

    except Exception as e:
        print(f"Agent error: {e}")
        traceback.print_exc()
        fallback = run_fallback_agent(user_message)
        return {
            "reply": fallback["reply"],
            "action": fallback["action"],
        }


def extract_ui_action_from_steps(intermediate_steps: list) -> Optional[dict]:
    """
    Scan all tool calls made by the agent.
    If any ui_* tool was called, extract its ui_action and params.
    This completely replaces the hardcoded switch-case on the frontend.

    intermediate_steps is a list of (AgentAction, tool_output) tuples.
    """
    ui_action = None

    for agent_action, tool_output in intermediate_steps:
        try:
            output_data = json.loads(tool_output)
        except (json.JSONDecodeError, TypeError):
            continue

        # If this tool returned a ui_action key -> it is a UI action tool
        if "ui_action" in output_data:
            ui_action = {
                "type": output_data["ui_action"],      # e.g. "SEARCH", "NAVIGATE"
                "data": output_data.get("params", {})  # e.g. {"query": "earbuds"}
            }
            # keep going, use the LAST ui_action found

    return ui_action


CATEGORY_MAP = {
    "electronics": "electronics",
    "fashion": "fashion",
    "footwear": "footwear",
    "beauty": "beauty",
    "home decor": "home-decor",
    "home-decor": "home-decor",
    "groceries": "groceries",
    "accessories": "accessories",
    "fitness": "fitness",
    "books": "books",
}


def run_fallback_agent(user_message: str) -> dict:
    message = user_message.strip()
    lowered = message.lower()

    category_slug = detect_category(lowered)
    price_range = detect_price_range(lowered)

    if any(word in lowered for word in ["cart", "checkout", "order", "wishlist", "home", "profile", "account"]):
        page = detect_page(lowered)
        return {
            "reply": f"Opening {page} for you.",
            "action": {"type": "NAVIGATE", "data": {"path": page_to_path(page)}},
        }

    if "category" in lowered or "categories" in lowered:
        categories = json.loads(get_categories.invoke({}))
        names = ", ".join(cat["name"] for cat in categories.get("categories", []))
        return {
            "reply": f"Available categories: {names}.",
            "action": None,
        }

    if any(word in lowered for word in ["best", "featured", "popular", "recommend"]):
        featured = json.loads(get_featured_products.invoke({}))
        items = featured.get("featured", [])[:3]
        if items:
            reply = "Here are some featured picks: " + "; ".join(
                f'{item["name"]} ({item["category"]}) for ₹{item["price"]}'
                for item in items
            )
        else:
            reply = "I couldn't find featured products right now."
        return {"reply": reply, "action": None}

    if category_slug and price_range:
        products = json.loads(filter_by_category.invoke({"category_slug": category_slug}))
        filtered = [
            item for item in products.get("results", [])
            if price_range[0] <= float(item["price"]) <= price_range[1]
        ][:5]
        reply = build_product_reply(
            filtered,
            empty_message=f"No {category_slug.replace('-', ' ')} products found in that price range.",
        )
        return {
            "reply": reply,
            "action": {"type": "FILTER_CATEGORY", "data": {"slug": category_slug}},
        }

    if category_slug:
        products = json.loads(filter_by_category.invoke({"category_slug": category_slug}))
        reply = build_product_reply(
            products.get("results", []),
            empty_message=f"No products found in {category_slug.replace('-', ' ')}.",
        )
        return {
            "reply": reply,
            "action": {"type": "FILTER_CATEGORY", "data": {"slug": category_slug}},
        }

    if price_range:
        products = json.loads(filter_by_price_range.invoke({
            "min_price": price_range[0],
            "max_price": price_range[1],
        }))
        reply = build_product_reply(
            products.get("results", []),
            empty_message=f"No products found between ₹{price_range[0]} and ₹{price_range[1]}.",
        )
        return {
            "reply": reply,
            "action": {"type": "FILTER_PRICE", "data": {"min": price_range[0], "max": price_range[1]}},
        }

    search_query = clean_search_query(message)
    products = json.loads(search_products.invoke({"query": search_query}))
    reply = build_product_reply(
        products.get("results", []),
        empty_message=f'I could not find products for "{search_query}".',
    )
    return {
        "reply": reply,
        "action": {"type": "SEARCH", "data": {"query": search_query}},
    }


def detect_category(message: str) -> Optional[str]:
    for name, slug in CATEGORY_MAP.items():
        if name in message:
            return slug
    return None


def detect_price_range(message: str) -> Optional[tuple[float, float]]:
    between_match = re.search(r"between\s+(\d+)\s+(?:and|to)\s+(\d+)", message)
    if between_match:
        return float(between_match.group(1)), float(between_match.group(2))

    under_match = re.search(r"(?:under|below|less than)\s+(\d+)", message)
    if under_match:
        return 0.0, float(under_match.group(1))

    above_match = re.search(r"(?:above|over|more than)\s+(\d+)", message)
    if above_match:
        return float(above_match.group(1)), 999999.0

    return None


def detect_page(message: str) -> str:
    for page in ["checkout", "wishlist", "orders", "cart", "profile", "account", "home"]:
        if page in message:
            return page
    return "home"


def page_to_path(page: str) -> str:
    page_map = {
        "cart": "/cart",
        "checkout": "/checkout",
        "orders": "/orders",
        "wishlist": "/wishlist",
        "home": "/",
        "profile": "/auth",
        "account": "/auth",
    }
    return page_map.get(page, "/")


def clean_search_query(message: str) -> str:
    query = re.sub(
        r"\b(show me|find|search for|search|look for|i want|please|products?|product)\b",
        "",
        message,
        flags=re.IGNORECASE,
    ).strip(" .")
    return query or message


def build_product_reply(products: list, empty_message: str) -> str:
    if not products:
        return empty_message

    top_items = products[:3]
    return "Here are a few options: " + "; ".join(
        f'{item["name"]} for ₹{item["price"]}'
        + (f' by {item["brand"]}' if item.get("brand") else "")
        for item in top_items
    )
