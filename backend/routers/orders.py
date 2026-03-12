from fastapi import APIRouter, HTTPException
import json
from database.db import get_connection
from schemas.schemas import CreateOrderRequest, OrderOut

router = APIRouter()


@router.post("/", response_model=OrderOut)
def create_order(data: CreateOrderRequest):
    """Create a new order."""
    conn = get_connection()
    cursor = conn.cursor()

    items_json = json.dumps([item.dict() for item in data.items])

    cursor.execute(
        """INSERT INTO orders (user_id, session_id, total, status, shipping_address, payment_method, items)
           VALUES (?, ?, ?, 'confirmed', ?, ?, ?)""",
        [data.user_id, data.session_id, data.total, data.shipping_address, data.payment_method, items_json]
    )
    order_id = cursor.lastrowid

    # Clear cart after order
    if data.user_id:
        cursor.execute("DELETE FROM cart_items WHERE user_id = ?", [data.user_id])
    elif data.session_id:
        cursor.execute("DELETE FROM cart_items WHERE session_id = ?", [data.session_id])

    conn.commit()

    cursor.execute("SELECT * FROM orders WHERE id = ?", [order_id])
    order = cursor.fetchone()
    conn.close()

    return dict(order)


@router.get("/", response_model=list[OrderOut])
def get_orders(user_id: int = None, session_id: str = None):
    """Get all orders for a user."""
    conn = get_connection()
    cursor = conn.cursor()

    if user_id:
        cursor.execute("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC", [user_id])
    elif session_id:
        cursor.execute("SELECT * FROM orders WHERE session_id = ? ORDER BY id DESC", [session_id])
    else:
        conn.close()
        return []

    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int):
    """Get a specific order by ID."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders WHERE id = ?", [order_id])
    order = cursor.fetchone()
    conn.close()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return dict(order)
