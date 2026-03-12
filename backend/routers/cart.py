from fastapi import APIRouter, HTTPException
from database.db import get_connection
from schemas.schemas import CartItemIn, CartOut, CartItemOut, UpdateQuantityRequest

router = APIRouter()


def get_cart_items(cursor, user_id=None, session_id=None):
    """Fetch cart items for a user or session."""
    if user_id:
        cursor.execute("""
            SELECT ci.*, p.name as product_name, p.price, p.image_url as product_image
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.user_id = ?
        """, [user_id])
    elif session_id:
        cursor.execute("""
            SELECT ci.*, p.name as product_name, p.price, p.image_url as product_image
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.session_id = ?
        """, [session_id])
    else:
        return []
    return cursor.fetchall()


@router.get("/", response_model=CartOut)
def get_cart(user_id: int = None, session_id: str = None):
    """Get current cart contents."""
    conn = get_connection()
    cursor = conn.cursor()
    rows = get_cart_items(cursor, user_id, session_id)
    conn.close()

    items = [
        CartItemOut(
            id=r["id"],
            product_id=r["product_id"],
            product_name=r["product_name"],
            product_image=r["product_image"],
            price=r["price"],
            quantity=r["quantity"],
            subtotal=r["price"] * r["quantity"],
        )
        for r in rows
    ]
    total = sum(i.subtotal for i in items)
    return CartOut(items=items, total=total, item_count=sum(i.quantity for i in items))


@router.post("/add")
def add_to_cart(item: CartItemIn):
    """Add a product to cart."""
    conn = get_connection()
    cursor = conn.cursor()

    # Check product exists
    cursor.execute("SELECT id FROM products WHERE id = ?", [item.product_id])
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")

    # Check if already in cart
    if item.user_id:
        cursor.execute(
            "SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?",
            [item.user_id, item.product_id]
        )
    elif item.session_id:
        cursor.execute(
            "SELECT id, quantity FROM cart_items WHERE session_id = ? AND product_id = ?",
            [item.session_id, item.product_id]
        )
    else:
        conn.close()
        raise HTTPException(status_code=400, detail="Provide user_id or session_id")

    existing = cursor.fetchone()
    if existing:
        # Update quantity
        new_qty = existing["quantity"] + item.quantity
        cursor.execute("UPDATE cart_items SET quantity = ? WHERE id = ?", [new_qty, existing["id"]])
    else:
        # Insert new item
        cursor.execute(
            "INSERT INTO cart_items (user_id, session_id, product_id, quantity) VALUES (?, ?, ?, ?)",
            [item.user_id, item.session_id, item.product_id, item.quantity]
        )

    conn.commit()
    conn.close()
    return {"message": "Item added to cart"}


@router.put("/{item_id}")
def update_quantity(item_id: int, data: UpdateQuantityRequest):
    """Update quantity of a cart item."""
    conn = get_connection()
    cursor = conn.cursor()

    if data.quantity <= 0:
        # Remove item
        cursor.execute("DELETE FROM cart_items WHERE id = ?", [item_id])
        msg = "Item removed from cart"
    else:
        cursor.execute("UPDATE cart_items SET quantity = ? WHERE id = ?", [data.quantity, item_id])
        msg = "Quantity updated"

    conn.commit()
    conn.close()
    return {"message": msg}


@router.delete("/{item_id}")
def remove_from_cart(item_id: int):
    """Remove an item from cart."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM cart_items WHERE id = ?", [item_id])
    conn.commit()
    conn.close()
    return {"message": "Item removed from cart"}


@router.delete("/clear/all")
def clear_cart(user_id: int = None, session_id: str = None):
    """Clear all items from cart."""
    conn = get_connection()
    cursor = conn.cursor()

    if user_id:
        cursor.execute("DELETE FROM cart_items WHERE user_id = ?", [user_id])
    elif session_id:
        cursor.execute("DELETE FROM cart_items WHERE session_id = ?", [session_id])

    conn.commit()
    conn.close()
    return {"message": "Cart cleared"}
