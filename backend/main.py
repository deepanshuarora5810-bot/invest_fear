"""
InvestSafe — FastAPI Backend
Run: uvicorn main:app --reload --port 4000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routers import market, simulate, quiz, ai_explain, whatif


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("✅  InvestSafe FastAPI backend starting up...")
    yield
    print("👋  Shutting down.")


app = FastAPI(
    title="InvestSafe API",
    description="Portfolio simulation, quiz scoring, AI explainer & market data for InvestSafe.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
from config import settings

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(market.router,     prefix="/api/market",     tags=["Market"])
app.include_router(simulate.router,   prefix="/api/simulate",   tags=["Simulation"])
app.include_router(quiz.router,       prefix="/api/quiz",       tags=["Quiz"])
app.include_router(ai_explain.router, prefix="/api/ai-explain", tags=["AI Explainer"])
app.include_router(whatif.router,     prefix="/api/whatif",     tags=["What-If"])


# ── Health ────────────────────────────────────────────────────────────────────
from datetime import datetime, timezone

@app.get("/api/health", tags=["Health"])
async def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}