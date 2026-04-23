"""
GET  /api/quiz/questions  — Return question bank
POST /api/quiz/score      — Score answers → investor profile
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()

# ── Question bank ─────────────────────────────────────────────────────────────
QUESTIONS = [
    {
        "id": 1,
        "q": "Your ₹1 lakh portfolio just dropped 25% in a week. What do you do?",
        "options": [
            {"key": "A", "label": "Sell everything",        "detail": "Cut losses before it gets worse.", "score": {"risk": 0, "patience": 0, "knowledge": 1}},
            {"key": "B", "label": "Sell some, hold some",   "detail": "De-risk partially, wait and watch.", "score": {"risk": 1, "patience": 1, "knowledge": 2}},
            {"key": "C", "label": "Hold my position",        "detail": "Volatile, but I believe in my thesis.", "score": {"risk": 3, "patience": 3, "knowledge": 2}},
            {"key": "D", "label": "Buy more (average down)", "detail": "Discount opportunity!", "score": {"risk": 4, "patience": 4, "knowledge": 3}},
        ],
    },
    {
        "id": 2,
        "q": "What's your investment time horizon?",
        "options": [
            {"key": "A", "label": "< 1 year",  "detail": "Need the money back soon.", "score": {"risk": 0, "patience": 0, "knowledge": 1}},
            {"key": "B", "label": "1–3 years", "detail": "Short-to-medium term goals.", "score": {"risk": 1, "patience": 1, "knowledge": 1}},
            {"key": "C", "label": "3–7 years", "detail": "Mid-term wealth building.", "score": {"risk": 2, "patience": 3, "knowledge": 2}},
            {"key": "D", "label": "7+ years",  "detail": "Long-term compounding.", "score": {"risk": 4, "patience": 4, "knowledge": 3}},
        ],
    },
    {
        "id": 3,
        "q": "How do you feel about market volatility?",
        "options": [
            {"key": "A", "label": "It terrifies me",  "detail": "Can't sleep when markets fall.", "score": {"risk": 0, "patience": 0, "knowledge": 0}},
            {"key": "B", "label": "Makes me anxious", "detail": "I check my portfolio daily.", "score": {"risk": 1, "patience": 1, "knowledge": 1}},
            {"key": "C", "label": "I can handle it",  "detail": "Short-term pain for long-term gain.", "score": {"risk": 3, "patience": 3, "knowledge": 2}},
            {"key": "D", "label": "I welcome it",     "detail": "Volatility = opportunity.", "score": {"risk": 4, "patience": 4, "knowledge": 4}},
        ],
    },
    {
        "id": 4,
        "q": "Which investment do you understand best?",
        "options": [
            {"key": "A", "label": "FD & Savings",       "detail": "Safe, predictable.", "score": {"risk": 0, "patience": 1, "knowledge": 0}},
            {"key": "B", "label": "Mutual Funds",        "detail": "SIPs, NAV, expense ratio.", "score": {"risk": 2, "patience": 2, "knowledge": 2}},
            {"key": "C", "label": "Direct Equities",     "detail": "P/E, earnings, fundamentals.", "score": {"risk": 3, "patience": 3, "knowledge": 3}},
            {"key": "D", "label": "Derivatives/Options", "detail": "Greeks, leverage, hedging.", "score": {"risk": 4, "patience": 2, "knowledge": 4}},
        ],
    },
    {
        "id": 5,
        "q": 'You see a "hot stock tip" going viral. You…',
        "options": [
            {"key": "A", "label": "Buy immediately!",       "detail": "FOMO is real.", "score": {"risk": 3, "patience": 0, "knowledge": 0}},
            {"key": "B", "label": "Research before buying", "detail": "Verify first.", "score": {"risk": 2, "patience": 2, "knowledge": 3}},
            {"key": "C", "label": "Ignore it mostly",       "detail": "Social media tips are noise.", "score": {"risk": 1, "patience": 3, "knowledge": 3}},
            {"key": "D", "label": "Fade the trade",         "detail": "Contrarian mindset.", "score": {"risk": 2, "patience": 4, "knowledge": 4}},
        ],
    },
    {
        "id": 6,
        "q": "What % of savings can you afford to lose?",
        "options": [
            {"key": "A", "label": "0% — need it all", "detail": "Emergency fund only.", "score": {"risk": 0, "patience": 0, "knowledge": 1}},
            {"key": "B", "label": "Up to 10%",        "detail": "Conservative.", "score": {"risk": 1, "patience": 1, "knowledge": 1}},
            {"key": "C", "label": "10–30%",           "detail": "Moderate risk-taking.", "score": {"risk": 3, "patience": 2, "knowledge": 2}},
            {"key": "D", "label": "30–50%+",          "detail": "High-risk, high-reward mindset.", "score": {"risk": 4, "patience": 3, "knowledge": 3}},
        ],
    },
    {
        "id": 7,
        "q": "What does CAGR stand for?",
        "options": [
            {"key": "A", "label": "No idea",                    "detail": "—", "score": {"risk": 1, "patience": 1, "knowledge": 0}},
            {"key": "B", "label": "Compound Annual Growth Rate", "detail": "Know it but rarely use it.", "score": {"risk": 2, "patience": 2, "knowledge": 3}},
            {"key": "C", "label": "I use it to compare funds",  "detail": "Practical application.", "score": {"risk": 2, "patience": 3, "knowledge": 4}},
            {"key": "D", "label": "Heard of it, not sure",      "detail": "Somewhat familiar.", "score": {"risk": 1, "patience": 1, "knowledge": 1}},
        ],
    },
    {
        "id": 8,
        "q": "Which best describes your financial goal?",
        "options": [
            {"key": "A", "label": "Protect my capital",    "detail": "Safety above all.", "score": {"risk": 0, "patience": 2, "knowledge": 1}},
            {"key": "B", "label": "Beat inflation",         "detail": "Stay ahead of rising prices.", "score": {"risk": 2, "patience": 2, "knowledge": 2}},
            {"key": "C", "label": "Build long-term wealth", "detail": "Retirement, property.", "score": {"risk": 3, "patience": 4, "knowledge": 3}},
            {"key": "D", "label": "Financial freedom ASAP", "detail": "Aggressive growth.", "score": {"risk": 4, "patience": 3, "knowledge": 3}},
        ],
    },
]

# ── Profile definitions ───────────────────────────────────────────────────────
PROFILES = {
    "dragon": {
        "name": "Dragon Investor", "emoji": "",
        "tagline": "Bold, knowledgeable, comfortable with high risk. You make calculated aggressive bets.",
        "description": "You have both the knowledge and the stomach for aggressive investing. You understand that high conviction + long time horizon turns volatility into wealth.",
        "allocation": {"equity": 65, "mf": 20, "gold": 5,  "fd": 10},
        "tips": [
            "Concentrate positions in high-conviction ideas (stay diversified across sectors).",
            "Keep a 10–15% cash war chest to deploy during crashes.",
            "Track your thesis for every stock; sell when the thesis breaks, not when price drops.",
        ],
    },
    "owl": {
        "name": "Owl Investor", "emoji": "",
        "tagline": "Wise and methodical. You research thoroughly and let compounding do the heavy lifting.",
        "description": "Your edge is patience and research. You may not chase the biggest returns, but your risk-adjusted performance is likely to beat most active traders over a decade.",
        "allocation": {"equity": 40, "mf": 40, "gold": 10, "fd": 10},
        "tips": [
            "Automate SIPs so discipline is baked in — remove emotion from execution.",
            "Rebalance annually: trim winners, add to laggards back to target allocation.",
            "Use index funds as your core (70%) and add satellite active bets (30%).",
        ],
    },
    "phoenix": {
        "name": "Phoenix Investor", "emoji": "",
        "tagline": "Rising from ground zero — the most exciting place to start. Every expert once knew nothing.",
        "description": "You are at the beginning of your investment journey — genuinely the best position to be in. Every lesson you learn now will compound just like your money.",
        "allocation": {"equity": 20, "mf": 40, "gold": 10, "fd": 30},
        "tips": [
            "Start a ₹500/month SIP today — consistency beats amount at this stage.",
            "Study one company per week: after 52 weeks you'll understand markets better than 90% of investors.",
            "Never invest money you need within 3 years in equity.",
        ],
    },
}

# ── Schemas ────────────────────────────────────────────────────────────────────
class ScoreRequest(BaseModel):
    answers: List[Optional[int]] = Field(
        ...,
        description="0-based option index per question. Use null for unanswered.",
    )


class ScoreResponse(BaseModel):
    profileKey: str
    profile:    dict
    allocation: dict
    scores:     dict


# ── Routes ────────────────────────────────────────────────────────────────────
@router.get("/questions")
async def get_questions():
    return {"questions": QUESTIONS}


@router.post("/score", response_model=ScoreResponse)
async def score_quiz(req: ScoreRequest):
    if len(req.answers) != len(QUESTIONS):
        raise HTTPException(
            status_code=422,
            detail=f"Expected {len(QUESTIONS)} answers, got {len(req.answers)}.",
        )

    max_per = len(QUESTIONS) * 4
    risk = patience = knowledge = 0

    for qi, ans_idx in enumerate(req.answers):
        if ans_idx is None:
            continue
        opts = QUESTIONS[qi]["options"]
        if ans_idx < 0 or ans_idx >= len(opts):
            raise HTTPException(status_code=422, detail=f"Invalid answer index {ans_idx} for question {qi + 1}.")
        s = opts[ans_idx]["score"]
        risk      += s["risk"]
        patience  += s["patience"]
        knowledge += s["knowledge"]

    r_pct = risk      / max_per * 100
    p_pct = patience  / max_per * 100
    k_pct = knowledge / max_per * 100
    total = (r_pct + p_pct + k_pct) / 3

    if total >= 60:
        key = "dragon"
    elif total >= 35:
        key = "owl"
    else:
        key = "phoenix"

    profile = PROFILES[key]
    return ScoreResponse(
        profileKey = key,
        profile    = {
            "name":        profile["name"],
            "emoji":       profile["emoji"],
            "tagline":     profile["tagline"],
            "description": profile["description"],
            "tips":        profile["tips"],
        },
        allocation = profile["allocation"],
        scores     = {"risk": round(r_pct, 1), "patience": round(p_pct, 1), "knowledge": round(k_pct, 1), "overall": round(total, 1)},
    )


if __name__ == "__main__":
    import asyncio

    async def test():
        print("🧪 Testing Quiz Scoring...")
        # Sample: Mostly 'D' (Aggressive)
        sample_answers = [3, 3, 3, 3, 1, 3, 1, 3] 
        req = ScoreRequest(answers=sample_answers)
        res = await score_quiz(req)
        print(f"✅ Profile: {res.profileKey.upper()} ({res.profile['name']})")
        print(f"📊 Scores: {res.scores}")
        print(f"💰 Allocation: {res.allocation}")

    asyncio.run(test())