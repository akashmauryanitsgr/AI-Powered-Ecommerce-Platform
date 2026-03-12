# 🛍️ ShopMind — AI-Powered E-Commerce Platform

A full-stack e-commerce application with an intelligent AI shopping assistant powered by LangChain. Shop using natural language voice commands or text chat.

## ✨ Features

### 🤖 AI Shopping Assistant
- **Voice Commands** — Use your microphone to control the store
- **Chat Interface** — Natural language product discovery
- **Smart Actions** — AI triggers real UI actions (search, filter, navigate, scroll)
- **Product Intelligence** — Compare products, get recommendations, answer questions
- **LangChain Powered** — Modular, swappable LLM providers (Gemini, Groq, OpenAI)

### 🛒 E-Commerce Features
- Product catalog with 9 categories and 45+ products
- Advanced filtering (category, price range, brand)
- Multi-field sorting (newest, price, rating, popularity)
- Full-text product search
- Product detail pages with ratings
- Shopping cart with quantity management
- Wishlist (client-side persisted)
- User authentication (register/login)
- Multi-step checkout (address → payment → confirm)
- Order history tracking

### 🎨 Design
- Minimal, luxury aesthetic — warm stone palette
- Playfair Display + DM Sans typography pairing
- Fully responsive (mobile + desktop)
- Smooth animations and transitions
- High-quality Unsplash product images

---

## 📁 Project Structure

```
shopmind/
├── backend/                    # FastAPI Python backend
│   ├── main.py                 # App entry point + CORS
│   ├── database/
│   │   └── db.py              # SQLite setup + data seeding
│   ├── routers/
│   │   ├── products.py        # Product CRUD + filtering
│   │   ├── categories.py      # Category listing
│   │   ├── cart.py            # Cart management
│   │   ├── orders.py          # Order creation + history
│   │   ├── auth.py            # Register + Login
│   │   └── ai_agent.py        # AI chat endpoint
│   ├── ai_agent/
│   │   ├── agent.py           # LangChain agent + LLM setup
│   │   └── tools.py           # LangChain tools (search, filter, etc.)
│   ├── schemas/
│   │   └── schemas.py         # Pydantic request/response models
│   └── requirements.txt
│
└── frontend/                   # Next.js 15 frontend
    ├── src/
    │   ├── app/               # Next.js App Router pages
    │   │   ├── page.tsx       # Homepage (hero + categories + featured)
    │   │   ├── products/
    │   │   │   ├── page.tsx   # Product listing + filters
    │   │   │   └── [id]/
    │   │   │       └── page.tsx # Product detail
    │   │   ├── cart/page.tsx
    │   │   ├── checkout/page.tsx
    │   │   ├── categories/page.tsx
    │   │   ├── wishlist/page.tsx
    │   │   ├── orders/page.tsx
    │   │   └── auth/page.tsx
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── Navbar.tsx
    │   │   │   └── Footer.tsx
    │   │   ├── product/
    │   │   │   └── ProductCard.tsx
    │   │   └── ai/
    │   │       └── ChatWidget.tsx  # Voice + chat AI assistant
    │   └── lib/
    │       ├── api.ts         # Backend API client
    │       ├── store.ts       # Zustand global state
    │       └── utils.ts       # Helpers (price format, images, etc.)
    └── package.json
```

---

## 🚀 Setup Instructions

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- An API key from one of: [Google AI Studio](https://aistudio.google.com) (Gemini), [Groq Console](https://console.groq.com/keys) (Groq), or OpenAI

---

### 1️⃣ Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate    # Linux/Mac
# venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Create backend/.env and add your API key
```

**Edit `backend/.env`:**
```env
LLM_PROVIDER=gemini              # or: groq | openai
GEMINI_API_KEY=your_key_here     # from https://aistudio.google.com
GEMINI_MODEL=gemini-1.5-flash
```

**Start the backend:**
```bash
uvicorn main:app --reload --port 8000
```

Backend runs at: http://localhost:8000  
API docs at: http://localhost:8000/docs

---

### 2️⃣ Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
# Create frontend/.env.local
# Add NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

**Start the frontend:**
```bash
npm run dev
```

Frontend runs at: http://localhost:3000

---

## 🤖 AI Assistant Usage

### Chat Commands (type in the chat widget)
```
"Show me wireless earbuds under ₹5000"
"Find yoga mats"
"What are your featured products?"
"Compare products 1 and 3"
"Go to cart"
"Show me all electronics"
"Search for running shoes"
"Filter by price ₹1000 to ₹3000"
```

### Voice Commands (click microphone button)
```
"Show me shoes under 2000"
"Search for headphones"
"Scroll down"
"Go to checkout"
"What books do you have?"
"Show me beauty products"
```

### AI Action Types
The AI agent can trigger these frontend actions:
| Action | Description |
|--------|-------------|
| `SEARCH` | Search for products |
| `FILTER_CATEGORY` | Filter by category |
| `FILTER_PRICE` | Filter by price range |
| `OPEN_PRODUCT` | Navigate to product page |
| `NAVIGATE` | Go to any page (/cart, /checkout) |
| `SCROLL` | Scroll the page up/down |
| `SORT` | Sort product results |

---

## 🔧 Configuration

### Switching LLM Providers

**Use Gemini (Recommended — free tier available):**
```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-1.5-flash
```

**Use Groq:**
```env
LLM_PROVIDER=groq
GROQ_API_KEY=your_key
GROQ_MODEL=llama-3.3-70b-versatile
```

**Use OpenAI:**
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4o-mini
```

### Adding Products
Products are seeded in `backend/database/db.py` in the `seed_data()` function. Add rows to the `products` list array and restart the backend (after deleting `shopmind.db` to re-seed).

---

## 🏪 Product Categories
1. 💻 Electronics
2. 👗 Fashion
3. 👟 Footwear
4. ✨ Beauty
5. 🏠 Home Decor
6. 🛒 Groceries
7. 💍 Accessories
8. 🏋️ Fitness
9. 📚 Books

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 18, TypeScript |
| Styling | Tailwind CSS, Framer Motion |
| State | Zustand |
| Backend | FastAPI, Python 3.10+ |
| Database | SQLite (via sqlite3) |
| AI Orchestration | LangChain |
| LLM | Gemini / Groq / OpenAI (configurable) |
| Voice | Web Speech API (browser native) |

---

## 📝 Notes

- **Voice support** requires Chrome browser (Web Speech API)
- **Database** auto-creates and seeds on first run (SQLite file: `shopmind.db`)
- **Auth tokens** are simplified for demo — use JWT in production
- **Images** are fetched from Unsplash based on product names — no local storage needed
- To **reset data**, delete `backend/shopmind.db` and restart the backend
