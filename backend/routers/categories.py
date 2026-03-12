from fastapi import APIRouter, HTTPException
from database.db import get_connection
from schemas.schemas import CategoryOut

router = APIRouter()


@router.get("/", response_model=list[CategoryOut])
def get_categories():
    """Get all product categories."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM categories ORDER BY name")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.get("/{slug}", response_model=CategoryOut)
def get_category(slug: str):
    """Get a category by slug."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM categories WHERE slug = ?", [slug])
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Category not found")
    return dict(row)
