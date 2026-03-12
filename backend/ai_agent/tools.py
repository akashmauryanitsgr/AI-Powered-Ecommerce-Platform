"""
LangChain tools for the AI shopping assistant.

Two types of tools:
1. DATA tools     — fetch products/categories from DB
2. UI ACTION tools — tell frontend what to do

LLM reads each tool's description and decides which to call.
No hardcoded switch needed on frontend anymore.
"""
from langchain.tools import tool
from database.db import get_connection
import json


# ─────────────────────────────────────────────────────────────────
# DATA TOOLS — fetch information from database
# ─────────────────────────────────────────────────────────────────

@tool
def search_products(query: str) -> str:
    """
    Search for products by name, brand, description or tags.
    Use this when the user wants to find specific products.
    Input: a search string like 'wireless earbuds' or 'running shoes'
    Returns: JSON list of matching products with id, name, price, category
    """
    conn = get_connection()
    cursor = conn.cursor()
    term = f"%{query}%"
    cursor.execute("""
        SELECT p.id, p.name, p.price, p.rating, p.brand, c.name as category
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.name LIKE ? OR p.description LIKE ? OR p.brand LIKE ? OR p.tags LIKE ?
        LIMIT 5
    """, [term, term, term, term])
    rows = cursor.fetchall()
    conn.close()
    if not rows:
        return json.dumps({"results": [], "message": "No products found."})
    return json.dumps({"results": [dict(r) for r in rows]})


@tool
def filter_by_category(category_slug: str) -> str:
    """
    Filter products by category slug.
    Valid slugs: electronics, fashion, footwear, beauty,
    home-decor, groceries, accessories, fitness, books
    Input: a category slug string
    Returns: JSON list of products in that category
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT p.id, p.name, p.price, p.rating, p.brand
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE c.slug = ?
        LIMIT 8
    """, [category_slug])
    rows = cursor.fetchall()
    conn.close()
    if not rows:
        return json.dumps({"results": [], "message": f"No products in: {category_slug}"})
    return json.dumps({"results": [dict(r) for r in rows], "category": category_slug})


@tool
def filter_by_price_range(min_price: float, max_price: float) -> str:
    """
    Filter products by price range in Indian Rupees.
    Input: min_price and max_price as numbers
    Returns: JSON list of products within that price range
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT p.id, p.name, p.price, p.rating, p.brand, c.name as category
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.price BETWEEN ? AND ?
        ORDER BY p.price ASC
        LIMIT 8
    """, [min_price, max_price])
    rows = cursor.fetchall()
    conn.close()
    if not rows:
        return json.dumps({"results": [], "message": f"No products between ₹{min_price} and ₹{max_price}"})
    return json.dumps({"results": [dict(r) for r in rows]})


@tool
def get_product_details(product_id: int) -> str:
    """
    Get full details for a specific product by its ID.
    Use when user asks about a specific product.
    Input: product_id as an integer
    Returns: JSON with full product details
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
    """, [product_id])
    row = cursor.fetchone()
    conn.close()
    if not row:
        return json.dumps({"error": f"Product {product_id} not found"})
    return json.dumps(dict(row))


@tool
def get_categories() -> str:
    """
    Get the list of all available product categories.
    Use when user asks what categories are available.
    Returns: JSON list of categories
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name, slug, description, icon FROM categories")
    rows = cursor.fetchall()
    conn.close()
    return json.dumps({"categories": [dict(r) for r in rows]})


@tool
def get_featured_products() -> str:
    """
    Get the featured/bestseller products.
    Use when user asks for recommendations or popular items.
    Returns: JSON list of featured products
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT p.id, p.name, p.price, p.rating, p.brand, c.name as category
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_featured = 1
        LIMIT 6
    """)
    rows = cursor.fetchall()
    conn.close()
    return json.dumps({"featured": [dict(r) for r in rows]})


@tool
def compare_products(product_ids: str) -> str:
    """
    Compare multiple products side by side.
    Input: comma-separated product IDs like '1,2,3'
    Returns: JSON comparison of those products
    """
    try:
        ids = [int(x.strip()) for x in product_ids.split(",")]
    except Exception:
        return json.dumps({"error": "Please provide comma-separated product IDs"})

    conn = get_connection()
    cursor = conn.cursor()
    placeholders = ",".join(["?" for _ in ids])
    cursor.execute(f"""
        SELECT p.id, p.name, p.price, p.rating, p.brand, p.description, c.name as category
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id IN ({placeholders})
    """, ids)
    rows = cursor.fetchall()
    conn.close()
    return json.dumps({"comparison": [dict(r) for r in rows]})


# ─────────────────────────────────────────────────────────────────
# UI ACTION TOOLS
# These tools tell the frontend WHAT TO DO.
# LLM calls these instead of returning a hardcoded action string.
# Frontend reads "ui_action" key from output and executes it.
# No switch-case matching needed — LLM picks the right tool itself.
# ─────────────────────────────────────────────────────────────────

@tool
def ui_search_products(query: str) -> str:
    """
    FRONTEND ACTION: Show search results on the products page.
    Call this when user wants to see products by a search term.
    Examples: 'show me earbuds', 'find yoga mats', 'search laptops',
    'i want to see shoes', 'display headphones'
    Input: search query string
    """
    return json.dumps({
        "ui_action": "SEARCH",
        "params": {"query": query}
    })


@tool
def ui_filter_category(category_slug: str) -> str:
    """
    FRONTEND ACTION: Filter the products page by a specific category.
    Call this when user wants to browse a category.
    Valid slugs: electronics, fashion, footwear, beauty,
    home-decor, groceries, accessories, fitness, books
    Examples: 'show me electronics', 'browse fashion',
    'open footwear section', 'take me to books'
    Input: category slug string
    """
    return json.dumps({
        "ui_action": "FILTER_CATEGORY",
        "params": {"slug": category_slug}
    })


@tool
def ui_filter_price(min_price: float, max_price: float) -> str:
    """
    FRONTEND ACTION: Filter products by price range on the products page.
    Call this when user mentions a price limit or range.
    Examples: 'under 5000', 'between 1000 and 3000',
    'below 2000', 'less than 500 rupees'
    Input: min_price and max_price as numbers in INR
    """
    return json.dumps({
        "ui_action": "FILTER_PRICE",
        "params": {"min": min_price, "max": max_price}
    })


@tool
def ui_sort_products(sort_by: str) -> str:
    """
    FRONTEND ACTION: Sort the product listing on the products page.
    Call this when user wants to sort products.
    Valid sort_by values:
    - 'newest'     → newest first
    - 'price_asc'  → price low to high
    - 'price_desc' → price high to low
    - 'rating'     → highest rated first
    - 'popular'    → most popular first
    Examples: 'sort by price', 'show cheapest first', 'highest rated'
    Input: one of the valid sort_by values above
    """
    return json.dumps({
        "ui_action": "SORT",
        "params": {"by": sort_by}
    })


@tool
def ui_open_product(product_id: int) -> str:
    """
    FRONTEND ACTION: Open a specific product detail page.
    Call this when user wants to see details of one product.
    Examples: 'open product 3', 'show me that laptop',
    'tell me more about it', 'open the first result'
    Input: product_id as integer
    """
    return json.dumps({
        "ui_action": "OPEN_PRODUCT",
        "params": {"id": product_id}
    })


@tool
def ui_navigate(page: str) -> str:
    """
    FRONTEND ACTION: Navigate to a specific page of the website.
    Call this when user wants to go to a different page.
    Valid pages:
    - 'cart'       → shopping cart
    - 'checkout'   → checkout page
    - 'orders'     → order history
    - 'wishlist'   → saved wishlist
    - 'categories' → all categories
    - 'home'       → homepage
    - 'profile'    → user account
    Examples: 'go to cart', 'open checkout', 'show my orders',
    'take me home', 'view wishlist'
    Input: page name from the valid list above
    """
    page_map = {
        "cart": "/cart",
        "checkout": "/checkout",
        "orders": "/orders",
        "wishlist": "/wishlist",
        "categories": "/categories",
        "home": "/",
        "profile": "/auth",
        "account": "/auth",
    }
    path = page_map.get(page.lower().strip(), f"/{page}")
    return json.dumps({
        "ui_action": "NAVIGATE",
        "params": {"path": path}
    })


@tool
def ui_scroll(direction: str) -> str:
    """
    FRONTEND ACTION: Scroll the current page up or down.
    Call this when user wants to scroll.
    Examples: 'scroll down', 'scroll up', 'go down',
    'show more', 'go back up'
    Input: 'up' or 'down'
    """
    return json.dumps({
        "ui_action": "SCROLL",
        "params": {"direction": direction}
    })


# ─────────────────────────────────────────────────────────────────
# ALL TOOLS LIST — passed to LangChain AgentExecutor
# LLM reads every tool's description and picks the right one.
# ─────────────────────────────────────────────────────────────────

ALL_TOOLS = [
    # Data tools — fetch from DB
    search_products,
    filter_by_category,
    filter_by_price_range,
    get_product_details,
    get_categories,
    get_featured_products,
    compare_products,

    # UI action tools — drive the frontend
    ui_search_products,
    ui_filter_category,
    ui_filter_price,
    ui_sort_products,
    ui_open_product,
    ui_navigate,
    ui_scroll,
]