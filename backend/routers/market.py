"""
GET /api/market/ticker
Returns scrolling ticker data (live via yfinance, or deterministic mock).
"""

import math
import time
import yfinance as yf
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

from config import settings

router = APIRouter()

# ── Baseline symbols (yfinance compatible) ───────────────────────────────────
BASELINE_MAP = {
    "^NSEI":       "NIFTY 50",
    "^BSESN":      "SENSEX",
    "RELIANCE.NS": "RELIANCE",
    "HDFCBANK.NS": "HDFC BANK",
    "TATAMOTORS.NS":"TATA MOTORS",
    "NVDA":        "NVIDIA",
    "TSLA":        "TESLA",
    "AAPL":        "APPLE",
    "AMZN":        "AMAZON",
    "BTC-INR":     "BTC/INR",
    "ETH-INR":     "ETH/INR",
    "GC=F":        "GOLD",
}

# ── In-process cache ──────────────────────────────────────────────────────────
_cache: dict = {"data": None, "ts": 0.0}

class TickerItem(BaseModel):
    name: str
    symbol: str
    raw: float
    val: str
    change: str
    up: bool

class TickerResponse(BaseModel):
    items: List[TickerItem]
    source: str
    ts: int

def _fmt_inr(val: float, is_crypto=False) -> str:
    if is_crypto:
        if val >= 100_000:
            return f"₹{val / 100_000:.2f}L"
    if val >= 100_000:
        return f"₹{val / 100_000:.2f}L"
    if val >= 1_000:
        return f"₹{int(val):,}"
    return f"₹{val:.2f}"

async def _fetch_yfinance() -> List[dict]:
    symbols = list(BASELINE_MAP.keys())
    try:
        # download is often faster and more reliable for bulk data
        data = yf.download(symbols, period="5d", progress=False, group_by='ticker')
        items = []
        
        for sym, name in BASELINE_MAP.items():
            try:
                # Handle both single and multi-symbol results
                ticker_data = data[sym] if len(symbols) > 1 else data
                
                # Filter out NaN rows
                valid_data = ticker_data.dropna(subset=['Close'])
                
                if not valid_data.empty:
                    last_row = valid_data.iloc[-1]
                    price = last_row['Close']
                    
                    # For change, try to get the previous close
                    if len(valid_data) > 1:
                        prev_close = valid_data.iloc[-2]['Close']
                    else:
                        prev_close = price # No change if only one day
                    
                    change_pct = ((price - prev_close) / prev_close) * 100
                    up = change_pct >= 0
                    
                    items.append({
                        "name": name,
                        "symbol": sym,
                        "raw": float(price),
                        "val": f"{'▲' if up else '▼'} {_fmt_inr(float(price), 'BTC' in sym)}",
                        "change": f"{'+' if up else ''}{float(change_pct):.2f}%",
                        "up": bool(up)
                    })
            except Exception as e:
                print(f"Error processing {sym}: {e}")
                continue
                
        return items
    except Exception as e:
        print(f"yfinance fetch failed: {e}")
        return []

def _build_mock_items() -> List[dict]:
    # Keeping a fallback just in case yf fails completely
    items = []
    # Simplified mock for fallback
    mock_data = [
        ("NIFTY 50", 22418), ("SENSEX", 73847), ("GOLD", 72300), ("BTC/INR", 6814000)
    ]
    for name, base in mock_data:
        items.append({
            "name": name,
            "symbol": "MOCK",
            "raw": base,
            "val": f"▲ {_fmt_inr(base)}",
            "change": "+0.00%",
            "up": True
        })
    return items

@router.get("/ticker", response_model=TickerResponse)
async def get_ticker():
    ttl = settings.MARKET_CACHE_TTL
    now = time.time()

    if _cache["data"] and (now - _cache["ts"]) < ttl:
        return _cache["data"]

    items = await _fetch_yfinance()
    source = "yfinance"

    if not items:
        items = _build_mock_items()
        source = "mock"

    payload = {"items": items, "source": source, "ts": int(now * 1000)}
    _cache["data"] = payload
    _cache["ts"]   = now
    return payload

@router.get("/history")
async def get_market_history(symbol: str = "^NSEI", period: str = "1y"):
    """Fetch historical data for a symbol to describe market condition."""
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period)
        if hist.empty:
            return {"data": []}
        
        # Simplify data for the chart
        data = [round(float(x), 2) for x in hist['Close'].tolist()]
        # Get labels (dates)
        labels = hist.index.strftime('%b %d').tolist()
        
        return {
            "symbol": symbol,
            "name": BASELINE_MAP.get(symbol, symbol),
            "data": data,
            "labels": labels,
            "current": data[-1],
            "change": round(((data[-1] - data[0]) / data[0]) * 100, 2)
        }
    except Exception as e:
        print(f"History fetch failed: {e}")
        return {"data": [], "error": str(e)}


if __name__ == "__main__":
    import asyncio
    import json

    async def test():
        print("🧪 Testing Market Router Logic...")
        
        print("\n--- 1. Testing /ticker ---")
        ticker_data = await get_ticker()
        print(f"Source: {ticker_data['source']}")
        print(f"Items Count: {len(ticker_data['items'])}")
        if ticker_data['items']:
            # Handle both dict and Pydantic model
            first_item = ticker_data['items'][0]
            if hasattr(first_item, "model_dump"):
                print(f"First Item: {json.dumps(first_item.model_dump(), indent=2)}")
            else:
                print(f"First Item: {json.dumps(first_item, indent=2)}")
            
        print("\n--- 2. Testing /history (^NSEI) ---")
        history_data = await get_market_history(symbol="^NSEI", period="1mo")
        if "error" in history_data:
            print(f"❌ Error: {history_data['error']}")
        else:
            print(f"✅ Success: {history_data['name']} ({history_data['symbol']})")
            print(f"Current Price: {history_data['current']}")
            print(f"1-Month Change: {history_data['change']}%")
            print(f"Data Points: {len(history_data['data'])}")

    asyncio.run(test())