from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from database.db import get_connection
from schemas.schemas import ProductOut, ProductListResponse

router = APIRouter()


def row_to_product(row) -> dict:
    """Convert a DB row to a product dict."""
    return {
        "id": row["id"],
        "name": row["name"],
        "description": row["description"],
        "price": row["price"],
        "original_price": row["original_price"],
        "category_id": row["category_id"],
        "category_name": row["category_name"] if "category_name" in row.keys() else None,
        "image_url": row["image_url"],
        "rating": row["rating"],
        "review_count": row["review_count"],
        "stock": row["stock"],
        "brand": row["brand"],
        "tags": row["tags"],
        "is_featured": bool(row["is_featured"]),
    }


@router.get("/", response_model=ProductListResponse)
def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: Optional[str] = "newest",  # newest, price_asc, price_desc, rating, popular
    featured: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
):
    """Get products with filtering, search, and sorting."""
    conn = get_connection()
    cursor = conn.cursor()

    query = """
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE 1=1
    """
    params = []

    if category:
        query += " AND c.slug = ?"
        params.append(category)

    if search:
        query += " AND (p.name LIKE ? OR p.description LIKE ? OR p.brand LIKE ? OR p.tags LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term, term])

    if min_price is not None:
        query += " AND p.price >= ?"
        params.append(min_price)

    if max_price is not None:
        query += " AND p.price <= ?"
        params.append(max_price)

    if featured is not None:
        query += " AND p.is_featured = ?"
        params.append(1 if featured else 0)

    # Sort
    sort_map = {
        "newest": "p.id DESC",
        "price_asc": "p.price ASC",
        "price_desc": "p.price DESC",
        "rating": "p.rating DESC",
        "popular": "p.review_count DESC",
    }
    query += f" ORDER BY {sort_map.get(sort, 'p.id DESC')}"

    # Count total
    count_query = f"SELECT COUNT(*) FROM ({query})"
    cursor.execute(count_query, params)
    total = cursor.fetchone()[0]

    # Pagination
    offset = (page - 1) * page_size
    query += f" LIMIT ? OFFSET ?"
    params.extend([page_size, offset])

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    products = [row_to_product(r) for r in rows]
    return {"products": products, "total": total, "page": page, "page_size": page_size}


@router.get("/featured", response_model=list[ProductOut])
def get_featured_products(limit: int = 8):
    """Get featured products for homepage."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_featured = 1
        ORDER BY p.rating DESC
        LIMIT ?
    """, [limit])
    rows = cursor.fetchall()
    conn.close()
    return [row_to_product(r) for r in rows]


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int):
    """Get a single product by ID."""
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
        raise HTTPException(status_code=404, detail="Product not found")

    return row_to_product(row)
