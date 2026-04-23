import math
import random
import json
import httpx
from typing import Literal, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from config import settings

router = APIRouter()

# ── Return / volatility matrix ────────────────────────────────────────────────
RETURN_MATRIX = {
    "low": {
        "equity": {"mu": 0.10, "sigma": 0.12},
        "mf":     {"mu": 0.09, "sigma": 0.08},
        "gold":   {"mu": 0.08, "sigma": 0.06},
        "fd":     {"mu": 0.065,"sigma": 0.00},
    },
    "medium": {
        "equity": {"mu": 0.13, "sigma": 0.18},
        "mf":     {"mu": 0.11, "sigma": 0.12},
        "gold":   {"mu": 0.09, "sigma": 0.09},
        "fd":     {"mu": 0.065,"sigma": 0.00},
    },
    "high": {
        "equity": {"mu": 0.17, "sigma": 0.30},
        "mf":     {"mu": 0.14, "sigma": 0.20},
        "gold":   {"mu": 0.10, "sigma": 0.12},
        "fd":     {"mu": 0.065,"sigma": 0.00},
    },
}

ALLOC = {"equity": 0.40, "mf": 0.30, "gold": 0.20, "fd": 0.10}
PATHS = 500


# ── Schema ────────────────────────────────────────────────────────────────────
class SimulateRequest(BaseModel):
    amount:     float = Field(..., gt=100, description="Investment amount in ₹")
    years:      int   = Field(..., ge=1, le=100, description="Time horizon in years")
    volatility: Literal["low", "medium", "high"] = "medium"


class Scenarios(BaseModel):
    worst:    int
    bad:      int
    expected: int
    good:     int
    best:     int


class AnnualEntry(BaseModel):
    year:    int
    value:   int
    gain:    float
    gainPct: str


# ── Recommendations ───────────────────────────────────────────────────────────
class Recommendation(BaseModel):
    name:   str
    symbol: str
    desc:   str
    type:   str

RECS_STATIC = {
    "low": [
        {"name": "Reliance Industries", "symbol": "RELIANCE.NS", "desc": "India's largest conglomerate, energy to retail.", "type": "Blue-chip"},
        {"name": "TCS", "symbol": "TCS.NS", "desc": "Global IT services leader with consistent dividends.", "type": "Defensive"},
        {"name": "HDFC Bank", "symbol": "HDFCBANK.NS", "desc": "Private banking giant with strong fundamentals.", "type": "Banking"}
    ],
    "medium": [
        {"name": "Infosys", "symbol": "INFY.NS", "desc": "Leading digital services and consulting firm.", "type": "Growth"},
        {"name": "ICICI Bank", "symbol": "ICICIBANK.NS", "desc": "Diversified financial services group.", "type": "Banking"},
        {"name": "Nifty 50 ETF", "symbol": "NIFTYBEES.NS", "desc": "Broad exposure to top 50 Indian companies.", "type": "Index"}
    ],
    "high": [
        {"name": "NVIDIA", "symbol": "NVDA", "desc": "Global leader in AI and graphics processing units.", "type": "Tech/AI"},
        {"name": "Tesla", "symbol": "TSLA", "desc": "Electric vehicle and clean energy innovator.", "type": "EV/Growth"},
        {"name": "Bitcoin", "symbol": "BTC-INR", "desc": "Leading decentralized digital asset.", "type": "Crypto"}
    ]
}

async def _fetch_ai_recommendations(amount: float, years: int, volatility: str) -> Optional[List[dict]]:
    api_key = settings.ANTHROPIC_API_KEY
    if not api_key or api_key.startswith("sk-ant-YOUR"):
        return None

    prompt = (
        "You are an expert investment advisor.\n\n"
        f"Context:\n- Amount: ₹{amount}\n- Horizon: {years} years\n- Risk Appetite: {volatility}\n\n"
        "Suggest exactly 3 real stock/asset symbols (use Yahoo Finance symbols like .NS for Indian stocks) "
        "that would be the BEST investment for this profile.\n\n"
        "Respond ONLY with valid JSON list of 3 objects (no markdown, no backticks):\n"
        '[{"name": "...", "symbol": "...", "desc": "...", "type": "..."}]'
    )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 500,
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            resp.raise_for_status()
            text = resp.json()["content"][0]["text"]
            clean = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            return json.loads(clean)
    except Exception:
        return None


class SimulateResponse(BaseModel):
    chartData:       List[int]
    annualBreakdown: List[AnnualEntry]
    scenarios:       Scenarios
    # Flat aliases for backward compatibility with the existing frontend
    best:     int
    expected: int
    bad:      int
    worst:    int
    recommendations: List[Recommendation]
    meta:     dict


# ── Engine ────────────────────────────────────────────────────────────────────
def _randn() -> float:
    """Box-Muller normal sample."""
    u, v = 0.0, 0.0
    while u == 0:
        u = random.random()
    while v == 0:
        v = random.random()
    return math.sqrt(-2 * math.log(u)) * math.cos(2 * math.pi * v)


def _simulate_path(amount: float, years: int, params: dict) -> List[int]:
    values = [int(amount)]
    current = amount
    for _ in range(years):
        year_return = sum(
            ALLOC[asset] * (p["mu"] + p["sigma"] * _randn())
            for asset, p in params.items()
        )
        current = max(0.0, current * (1 + year_return))
        values.append(int(current))
    return values


def _percentile(sorted_vals: List[int], pct: float) -> int:
    idx = int((pct / 100) * len(sorted_vals))
    return sorted_vals[min(idx, len(sorted_vals) - 1)]


# ── Route ─────────────────────────────────────────────────────────────────────
@router.post("/", response_model=SimulateResponse)
async def simulate(req: SimulateRequest):
    params = RETURN_MATRIX[req.volatility]

    all_paths = [_simulate_path(req.amount, req.years, params) for _ in range(PATHS)]

    final_values = sorted(p[-1] for p in all_paths)
    scenarios = Scenarios(
        worst   =_percentile(final_values, 5),
        bad     =_percentile(final_values, 25),
        expected=_percentile(final_values, 50),
        good    =_percentile(final_values, 75),
        best    =_percentile(final_values, 95),
    )

    # Median path for chart
    sorted_paths = sorted(all_paths, key=lambda p: p[-1])
    median_path  = sorted_paths[PATHS // 2]

    annual = [
        AnnualEntry(
            year    = i,
            value   = v,
            gain    = v - req.amount,
            gainPct = f"{((v / req.amount) - 1) * 100:.1f}",
        )
        for i, v in enumerate(median_path)
    ]

    # Try AI recommendations first, then fallback
    recs = await _fetch_ai_recommendations(req.amount, req.years, req.volatility)
    if not recs or not isinstance(recs, list) or len(recs) == 0:
        recs = RECS_STATIC[req.volatility]

    return SimulateResponse(
        chartData       = median_path,
        annualBreakdown = annual,
        scenarios       = scenarios,
        best            = scenarios.best,
        expected        = scenarios.expected,
        bad             = scenarios.bad,
        worst           = scenarios.worst,
        recommendations = recs,
        meta            = {
            "amount":     req.amount,
            "years":      req.years,
            "volatility": req.volatility,
            "paths":      PATHS,
            "alloc":      ALLOC,
        },
    )