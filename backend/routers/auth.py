from fastapi import APIRouter, HTTPException
import hashlib
import base64
import json
from database.db import get_connection
from schemas.schemas import RegisterRequest, LoginRequest, AuthResponse, UserOut

router = APIRouter()


def hash_password(password: str) -> str:
    """Simple SHA256 hash for demo. Use bcrypt in production."""
    return hashlib.sha256(password.encode()).hexdigest()


def make_token(user_id: int, email: str) -> str:
    """Create a simple demo token. Use JWT in production."""
    payload = {"user_id": user_id, "email": email}
    encoded = base64.b64encode(json.dumps(payload).encode()).decode()
    return f"demo_token_{encoded}"


def decode_token(token: str) -> dict:
    """Decode the demo token."""
    try:
        encoded = token.replace("demo_token_", "")
        payload = json.loads(base64.b64decode(encoded).decode())
        return payload
    except Exception:
        return {}


@router.post("/register", response_model=AuthResponse)
def register(data: RegisterRequest):
    """Register a new user."""
    conn = get_connection()
    cursor = conn.cursor()

    # Check if email exists
    cursor.execute("SELECT id FROM users WHERE email = ?", [data.email])
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    password_hash = hash_password(data.password)
    cursor.execute(
        "INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)",
        [data.email, data.name, password_hash]
    )
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()

    user = UserOut(id=user_id, email=data.email, name=data.name)
    token = make_token(user_id, data.email)
    return {"user": user, "token": token, "message": "Account created successfully"}


@router.post("/login", response_model=AuthResponse)
def login(data: LoginRequest):
    """Login with email and password."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE email = ?", [data.email])
    user = cursor.fetchone()
    conn.close()

    if not user or user["password_hash"] != hash_password(data.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_out = UserOut(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        phone=user["phone"],
        address=user["address"]
    )
    token = make_token(user["id"], user["email"])
    return {"user": user_out, "token": token, "message": "Login successful"}


@router.get("/me", response_model=UserOut)
def get_me(token: str):
    """Get current user from token."""
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", [payload["user_id"]])
    user = cursor.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserOut(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        phone=user["phone"],
        address=user["address"]
    )
