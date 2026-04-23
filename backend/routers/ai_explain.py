"""
POST /api/ai-explain
Generates a personalised portfolio explanation via Claude Sonnet.
Falls back to curated static copy when ANTHROPIC_API_KEY is not set.
"""

import json
import httpx
from typing import Literal, Optional, List
from fastapi import APIRouter
from pydantic import BaseModel

from config import settings

router = APIRouter()

# ── Static fallback copy ──────────────────────────────────────────────────────
STATIC = {
    "low": {
        "explanation": (
            "With a low-risk profile your portfolio is built for capital preservation. "
            "FDs and bonds offer predictable returns with minimal downside — perfect for "
            "financial goals within 1–3 years or anyone who needs liquidity."
        ),
        "tips": [
            "Keep 3–6 months of expenses as an emergency fund before investing.",
            "Ladder your FDs (1-year, 2-year, 3-year) so you always have liquidity.",
            "Slowly add a gold ETF; a 10–15% allocation acts as inflation insurance.",
        ],
        "bestSuggestion": "Focus on high-quality debt instruments and liquid funds to ensure your principal is protected while beating inflation slightly.",
        "idealAllocation": {"equity": 10, "mf": 20, "gold": 20, "fd": 50},
    },
    "medium": {
        "explanation": (
            "A medium-risk setup balances growth and stability. Index funds track the "
            "broader market — diversified exposure without the volatility of individual stocks. "
            "Ideal for wealth accumulation over a 3–7 year horizon."
        ),
        "tips": [
            "Automate a monthly SIP — even ₹2,000/month compounds dramatically over a decade.",
            "Use a NIFTY 50 index fund as your equity core; add a midcap fund for extra upside.",
            "Rebalance once a year: trim asset classes that have grown beyond target allocation.",
        ],
        "bestSuggestion": "A balanced '60/40' approach (or 70/30) between growth assets and stability assets will help you ride out market cycles comfortably.",
        "idealAllocation": {"equity": 30, "mf": 40, "gold": 15, "fd": 15},
    },
    "high": {
        "explanation": (
            "High risk, high reward — but only with discipline. Stocks and crypto can generate "
            "3–5× returns over 5+ years, but can also drop 40–70% in bear markets. "
            "Your edge is staying invested when others panic-sell."
        ),
        "tips": [
            "Set a pre-determined stop-loss on speculative positions (e.g. sell if down >40%).",
            "Never invest money in equities that you need within 3 years.",
            "Track your thesis for every stock; sell when the thesis breaks, not when price drops.",
        ],
        "bestSuggestion": "Aggressively allocate to mid-cap and small-cap opportunities where long-term growth potential is highest, but keep a small gold hedge.",
        "idealAllocation": {"equity": 60, "mf": 25, "gold": 10, "fd": 5},
    },
}

# ── Schemas ────────────────────────────────────────────────────────────────────
class AIExplainRequest(BaseModel):
    riskLevel:  Literal["low", "medium", "high"] = "medium"
    allocation: dict = {}
    profileKey: Optional[str] = None


class AIExplainResponse(BaseModel):
    explanation:    str
    tips:           List[str]
    bestSuggestion: str
    idealAllocation: dict
    source:         Literal["ai", "static"]


# ── AI call ───────────────────────────────────────────────────────────────────
async def _call_claude(risk_level: str, allocation: dict, profile_key: Optional[str]) -> Optional[dict]:
    api_key = settings.ANTHROPIC_API_KEY
    if not api_key or api_key.startswith("sk-ant-YOUR"):
        return None

    prompt = (
        "You are a SEBI-registered financial educator helping Indian retail investors.\n\n"
        f"User profile:\n"
        f"- Risk level: {risk_level}\n"
        f"- Investor archetype: {profile_key or 'unknown'}\n"
        f"- Current Allocation: Equity {allocation.get('equity','?')}%, "
        f"Mutual Funds {allocation.get('mf','?')}%, "
        f"Gold ETF {allocation.get('gold','?')}%, "
        f"Fixed Deposit {allocation.get('fd','?')}%\n\n"
        "Tasks:\n"
        "1. Write a SHORT (3 sentences max), warm, jargon-light explanation of WHY this allocation suits them.\n"
        "2. Give 3 actionable tips for an Indian retail investor with this profile.\n"
        "3. Provide one 'Best Suggestion' for their next move (e.g., 'Increase SIP', 'Diversify into Midcaps').\n"
        "4. Suggest an 'Ideal Allocation' (%) for their risk level across: equity, mf, gold, fd.\n\n"
        "Respond ONLY with valid JSON (no markdown, no backticks):\n"
        '{"explanation": "...", "tips": ["tip1", "tip2", "tip3"], "bestSuggestion": "...", "idealAllocation": {"equity": 0, "mf": 0, "gold": 0, "fd": 0}}'
    )

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "claude-3-5-sonnet-20240620",
                    "max_tokens": 500,
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            resp.raise_for_status()
            text = resp.json()["content"][0]["text"]
            # Strip accidental markdown fences
            clean = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            return json.loads(clean)
    except Exception as e:
        print(f"AI Call Error: {e}")
        return None


# ── Route ─────────────────────────────────────────────────────────────────────
@router.post("/", response_model=AIExplainResponse)
async def ai_explain(req: AIExplainRequest):
    ai = await _call_claude(req.riskLevel, req.allocation, req.profileKey)

    if ai and ai.get("explanation") and isinstance(ai.get("tips"), list) and ai.get("bestSuggestion") and ai.get("idealAllocation"):
        return AIExplainResponse(
            explanation    = ai["explanation"], 
            tips           = ai["tips"], 
            bestSuggestion = ai["bestSuggestion"],
            idealAllocation = ai["idealAllocation"],
            source         = "ai"
        )

    fallback = STATIC[req.riskLevel]
    return AIExplainResponse(**fallback, source="static")