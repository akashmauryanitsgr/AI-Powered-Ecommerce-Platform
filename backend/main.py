from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pathlib import Path
import os

from dotenv import load_dotenv

from database.db import create_tables, seed_data
from routers import products, categories, cart, auth, orders, ai_agent


load_dotenv(Path(__file__).resolve().parent / ".env")


def get_allowed_origins() -> list[str]:
    cors_origins = os.getenv("CORS_ORIGINS")
    if cors_origins:
        return [origin.strip() for origin in cors_origins.split(",") if origin.strip()]
    return ["http://localhost:3000", "http://127.0.0.1:3000"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed sample data
    create_tables()
    seed_data()
    yield
    # Shutdown: nothing needed


app = FastAPI(
    title="ShopMind AI E-Commerce API",
    description="Full-stack e-commerce backend with AI shopping assistant",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(cart.router, prefix="/api/cart", tags=["Cart"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(ai_agent.router, prefix="/api/ai", tags=["AI Agent"])


@app.get("/")
def root():
    return {"message": "ShopMind AI E-Commerce API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}
