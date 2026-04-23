"""
GET  /api/whatif/assets  — Asset catalogue
GET  /api/whatif/search  — Search for stock symbols
POST /api/whatif          — Historical "what if I invested earlier" simulation
"""

import math
import yfinance as yf
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

router = APIRouter()

MIN_YEAR = 1980
REF_YEAR = 2025  # "today"

# ── Asset catalogue (Static/Fixed-rate assets) ────────────────────────────────
STATIC_ASSETS: dict[str, dict] = {
    "REALESTATE": {"label": "Real Estate",   "cagr":  7.5, "desc": "Average Indian residential property appreciation"},
    "FD":         {"label": "Bank FD",       "cagr":  6.5, "desc": "Typical SBI/HDFC FD average over a decade"},
    "PPF":        {"label": "PPF",           "cagr":  7.5, "desc": "Public Provident Fund — sovereign guarantee"},
}

# Default popular stocks for the UI
POPULAR_STOCKS = {
    "^NSEI":       {"label": "NIFTY 50",    "desc": "NSE's benchmark index"},
    "^BSESN":      {"label": "SENSEX",      "desc": "BSE's benchmark index"},
    "RELIANCE.NS": {"label": "Reliance",    "desc": "RIL stock on NSE"},
    "HDFCBANK.NS": {"label": "HDFC Bank",   "desc": "India's largest private bank"},
    "TATAMOTORS.NS":{"label": "Tata Motors", "desc": "Leading auto manufacturer"},
    "NVDA":        {"label": "NVIDIA",      "desc": "AI chip leader"},
    "TSLA":        {"label": "Tesla",       "desc": "EV and energy giant"},
    "AAPL":        {"label": "Apple",       "desc": "iPhone maker"},
    "BTC-INR":     {"label": "Bitcoin",     "desc": "Leading cryptocurrency"},
    "ETH-INR":     {"label": "Ethereum",    "desc": "Smart contract leader"},
    "GC=F":        {"label": "Gold",        "desc": "Universal store of value"},
}

# ── Schemas ───────────────────────────────────────────────────────────────────
class WhatIfRequest(BaseModel):
    asset:    str   = "NIFTY50"
    amount:   float = Field(..., gt=100)
    fromYear: int   = Field(..., ge=MIN_YEAR, lt=REF_YEAR)

class WhatIfResponse(BaseModel):
    asset:      dict
    amount:     float
    fromYear:   int
    toYear:     int
    years:      int
    finalValue: int
    gain:       float
    gainPct:    float
    chartData:  List[int]
    insight:    str

class SearchResult(BaseModel):
    symbol: str
    name: str
    type: str
    price: Optional[float] = None

# ── Helpers ───────────────────────────────────────────────────────────────────
def _insight(label: str, from_year: int, gain_pct: float, cagr: float) -> str:
    if gain_pct > 500:
        return (
            f"A {from_year} investment in {label} would have returned over {gain_pct:.0f}% — "
            "a truly life-changing outcome. The best time to invest was then; the second-best time is now."
        )
    if gain_pct > 150:
        return (
            f"{label} compounded at ~{cagr:.1f}% annually since {from_year}, "
            "turning modest savings into meaningful wealth. Consistency beats market timing every time."
        )
    return (
        f"{label} delivered ~{cagr:.1f}% CAGR since {from_year}. "
        "Even steady, 'boring' compounding builds real wealth — the key is starting and staying invested."
    )

# ── Routes ────────────────────────────────────────────────────────────────────
@router.get("/trending", response_model=List[SearchResult])
async def get_trending():
    """Get trending/popular stocks with current prices."""
    symbols = list(POPULAR_STOCKS.keys())
    try:
        data = yf.download(symbols, period="1d", progress=False, group_by='ticker')
        results = []
        for sym in symbols:
            price = None
            try:
                ticker_data = data[sym] if len(symbols) > 1 else data
                if not ticker_data.empty:
                    valid_rows = ticker_data.dropna(subset=['Close'])
                    if not valid_rows.empty:
                        price = round(float(valid_rows['Close'].iloc[-1]), 2)
            except:
                pass
            
            results.append({
                "symbol": sym,
                "name": POPULAR_STOCKS[sym]["label"],
                "type": "EQUITY",
                "price": price
            })
        return results
    except Exception as e:
        print(f"Trending fetch failed: {e}")
        return []

@router.get("/assets")
async def get_assets():
    # Combine static and popular
    all_assets = {**POPULAR_STOCKS, **STATIC_ASSETS}
    return {"assets": all_assets}

@router.get("/search", response_model=List[SearchResult])
async def search_stocks(q: str = Query(..., min_length=1)):
    """Search for symbols using yfinance."""
    try:
        # Use yfinance Search to find matches
        search = yf.Search(q, max_results=8)
        quotes = search.quotes
        
        if not quotes:
            return []
            
        results = []
        symbols = [q.get('symbol') for q in quotes if q.get('symbol')]
        
        # Fetch current prices for these symbols in bulk
        if symbols:
            # download is usually faster for multi-ticker price checks
            data = yf.download(symbols, period="1d", progress=False, group_by='ticker')
            
            for quote in quotes:
                sym = quote.get('symbol')
                if not sym: continue
                
                price = None
                try:
                    # Handle both single and multi-symbol results from download
                    if len(symbols) == 1:
                        ticker_data = data
                    else:
                        ticker_data = data[sym]
                    
                    if not ticker_data.empty:
                        # Some tickers might not have data for today yet, try to get the last valid close
                        valid_rows = ticker_data.dropna(subset=['Close'])
                        if not valid_rows.empty:
                            price = round(float(valid_rows['Close'].iloc[-1]), 2)
                except Exception as e:
                    print(f"Error getting price for {sym}: {e}")
                
                results.append({
                    "symbol": sym,
                    "name": quote.get('shortname', quote.get('longname', sym)),
                    "type": quote.get('quoteType', 'EQUITY'),
                    "price": price
                })
        
        return results
    except Exception as e:
        print(f"Search failed: {e}")
        # Fallback to a single ticker lookup if Search fails
        try:
            ticker = yf.Ticker(q)
            hist = ticker.history(period="1d")
            if not hist.empty:
                return [{
                    "symbol": q.upper(),
                    "name": ticker.info.get('longName', q.upper()),
                    "type": "EQUITY",
                    "price": round(hist['Close'].iloc[-1], 2)
                }]
        except:
            pass
        return []

@router.post("/", response_model=WhatIfResponse)
async def whatif(req: WhatIfRequest):
    # Asset key normalization/mapping
    MAPPING = {
        "NIFTY50":  "^NSEI",
        "SENSEX":   "^BSESN",
        "GOLD":     "GC=F",
        "BITCOIN":  "BTC-INR",
    }
    asset_key = MAPPING.get(req.asset.upper(), req.asset)
    label = asset_key
    desc = ""
    
    # 1. Check if it's a static asset
    if asset_key in STATIC_ASSETS:
        meta = STATIC_ASSETS[asset_key]
        label = meta["label"]
        cagr = meta["cagr"]
        years = REF_YEAR - req.fromYear
        final_val = req.amount * math.pow(1 + cagr / 100, years)
        chart_data = [int(req.amount * math.pow(1 + cagr / 100, i)) for i in range(years + 1)]
    else:
        # 2. Try fetching from yfinance
        try:
            ticker = yf.Ticker(asset_key)
            label = POPULAR_STOCKS.get(asset_key, {}).get("label", asset_key)
            
            # Fetch historical data
            # We want annual prices to build the chart
            start_date = f"{req.fromYear}-01-01"
            end_date = f"{REF_YEAR}-01-01"
            hist = ticker.history(start=start_date, end=end_date, interval="1mo")
            
            if hist.empty:
                raise HTTPException(status_code=404, detail="No historical data found for this period.")
            
            # Get the first price and latest price
            start_price = hist['Close'].iloc[0]
            current_price = hist['Close'].iloc[-1]
            
            years = REF_YEAR - req.fromYear
            # Calculate final value based on real growth
            multiplier = current_price / start_price
            final_val = req.amount * multiplier
            
            # Build chart data by sampling annual-ish points
            # We take the close price at the start of each year (or nearest)
            chart_data = []
            for y in range(req.fromYear, REF_YEAR + 1):
                # Find the closest date to Jan 1st of year 'y'
                year_data = hist[hist.index.year == y]
                if not year_data.empty:
                    price_at_y = year_data['Close'].iloc[0]
                    val = req.amount * (price_at_y / start_price)
                    chart_data.append(int(val))
                else:
                    # If missing, just repeat last or interpolate (simplified)
                    if chart_data: chart_data.append(chart_data[-1])
                    else: chart_data.append(int(req.amount))
            
            # Recalculate CAGR for the insight
            if years > 0:
                cagr = (math.pow(multiplier, 1/years) - 1) * 100
            else:
                cagr = 0
                
        except Exception as e:
            print(f"yfinance whatif failed: {e}")
            raise HTTPException(status_code=422, detail=f"Could not fetch historical data for {asset_key}")

    gain = final_val - req.amount
    gain_pct = ((final_val / req.amount) - 1) * 100

    return WhatIfResponse(
        asset      = {"key": asset_key, "label": label, "desc": desc},
        amount     = req.amount,
        fromYear   = req.fromYear,
        toYear     = REF_YEAR,
        years      = years,
        finalValue = int(final_val),
        gain       = round(gain, 2),
        gainPct    = round(gain_pct, 2),
        chartData  = chart_data,
        insight    = _insight(label, req.fromYear, gain_pct, cagr),
    )