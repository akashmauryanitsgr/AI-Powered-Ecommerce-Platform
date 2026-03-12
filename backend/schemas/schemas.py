from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ─── Category Schemas ────────────────────────────────────────────────────────

class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    image_url: Optional[str] = None


# ─── Product Schemas ──────────────────────────────────────────────────────────

class ProductOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: float
    original_price: Optional[float] = None
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    image_url: Optional[str] = None
    rating: float = 4.0
    review_count: int = 0
    stock: int = 100
    brand: Optional[str] = None
    tags: Optional[str] = None
    is_featured: bool = False


class ProductListResponse(BaseModel):
    products: List[ProductOut]
    total: int
    page: int
    page_size: int


# ─── Auth Schemas ─────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    name: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None


class AuthResponse(BaseModel):
    user: UserOut
    token: str
    message: str


# ─── Cart Schemas ─────────────────────────────────────────────────────────────

class CartItemIn(BaseModel):
    product_id: int
    quantity: int = 1
    session_id: Optional[str] = None
    user_id: Optional[int] = None


class CartItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_image: Optional[str] = None
    price: float
    quantity: int
    subtotal: float


class CartOut(BaseModel):
    items: List[CartItemOut]
    total: float
    item_count: int


class UpdateQuantityRequest(BaseModel):
    quantity: int
    session_id: Optional[str] = None
    user_id: Optional[int] = None


# ─── Order Schemas ────────────────────────────────────────────────────────────

class OrderItem(BaseModel):
    product_id: int
    product_name: str
    price: float
    quantity: int


class CreateOrderRequest(BaseModel):
    session_id: Optional[str] = None
    user_id: Optional[int] = None
    shipping_address: str
    payment_method: str = "cod"
    items: List[OrderItem]
    total: float


class OrderOut(BaseModel):
    id: int
    total: float
    status: str
    shipping_address: Optional[str] = None
    payment_method: Optional[str] = None
    items: Optional[str] = None
    created_at: Optional[str] = None


# ─── AI Agent Schemas ─────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_id: Optional[int] = None
    history: Optional[List[ChatMessage]] = []


class ActionPayload(BaseModel):
    type: str  # e.g. "NAVIGATE", "SEARCH", "FILTER", "ADD_TO_CART", etc.
    data: Optional[dict] = None


class ChatResponse(BaseModel):
    reply: str
    action: Optional[ActionPayload] = None


# ─── Wishlist Schemas ─────────────────────────────────────────────────────────

class WishlistItemIn(BaseModel):
    product_id: int
    session_id: Optional[str] = None
    user_id: Optional[int] = None


class WishlistItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_image: Optional[str] = None
    price: float
