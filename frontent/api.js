/**
 * investsafe-api.js  — FastAPI edition
 * Drop alongside your React components.
 * Set VITE_API_URL in your .env (defaults to http://localhost:4000/api).
 *
 * All functions are async and throw on HTTP errors.
 */

const BASE = import.meta.env?.VITE_API_URL ?? "http://localhost:4000/api";

// ── Core helpers ──────────────────────────────────────────────────────────────
async function _post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

async function _get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Market ────────────────────────────────────────────────────────────────────
/**
 * Live/mock ticker data for the scrolling bar.
 * @returns {{ items: Array<{name,val,raw,up,change}>, source: string, ts: number }}
 */
export const getTicker = () => _get("/market/ticker");

/**
 * Fetch historical data for a market symbol.
 * @param {string} symbol 
 * @param {string} period 
 */
export const getMarketHistory = (symbol = "^NSEI", period = "1y") => 
  _get(`/market/history?symbol=${encodeURIComponent(symbol)}&period=${period}`);

// ── Simulation ────────────────────────────────────────────────────────────────
/**
 * Monte Carlo portfolio simulation (500 paths).
 * @param {{ amount: number, years: number, volatility: "low"|"medium"|"high" }} p
 * @returns {{ chartData, scenarios, best, expected, bad, worst, annualBreakdown }}
 */
export const simulate = (p) =>
  _post("/simulate", { amount: p.amount, years: p.years, volatility: p.volatility ?? "medium" });

// ── Quiz ──────────────────────────────────────────────────────────────────────
/** @returns {{ questions: Array }} */
export const getQuizQuestions = () => _get("/quiz/questions");

/**
 * Score a completed quiz.
 * @param {{ answers: (number|null)[] }} p  — 0-based index per question
 * @returns {{ profileKey, profile, allocation, scores }}
 */
export const scoreQuiz = (p) => _post("/quiz/score", { answers: p.answers });

// ── AI Explainer ──────────────────────────────────────────────────────────────
/**
 * AI or static portfolio explanation.
 * @param {{ riskLevel: "low"|"medium"|"high", allocation: object, profileKey?: string }} p
 * @returns {{ explanation: string, tips: string[], source: "ai"|"static" }}
 */
export const getAIExplanation = (p) =>
  _post("/ai-explain", { riskLevel: p.riskLevel, allocation: p.allocation, profileKey: p.profileKey });

// ── What-If ───────────────────────────────────────────────────────────────────
/** @returns {{ assets: Record<string, { label, cagr, desc }> }} */
export const getWhatIfAssets = () => _get("/whatif/assets");

/**
 * Historical "what if I invested earlier" simulation.
 * @param {{ asset: string, amount: number, fromYear: number }} p
 * @returns {{ finalValue, gain, gainPct, chartData, insight, ... }}
 */
export const runWhatIf = (p) =>
  _post("/whatif", { asset: p.asset, amount: p.amount, fromYear: p.fromYear });

/**
 * Search for stock symbols.
 * @param {string} q 
 * @returns {Promise<Array<{symbol, name, type, price}>>}
 */
export const searchStocks = (q) => _get(`/whatif/search?q=${encodeURIComponent(q)}`);

/**
 * Get trending stocks with prices.
 * @returns {Promise<Array<{symbol, name, type, price}>>}
 */
export const getTrending = () => _get("/whatif/trending");

// ── Default export ────────────────────────────────────────────────────────────
export default { getTicker, getMarketHistory, simulate, getQuizQuestions, scoreQuiz, getAIExplanation, getWhatIfAssets, runWhatIf, searchStocks, getTrending };


/* ─── Usage examples in your React screens ───────────────────────────────────

// SandboxScreen — replace the inline simulate() call:
import api from "./investsafe-api";
const volMap = { 1: "low", 2: "medium", 3: "high" };
const result = await api.simulate({ amount, years: horizon, volatility: volMap[vol] });

// LossMeterScreen — get AI explanation when risk button changes:
const { explanation, tips } = await api.getAIExplanation({
  riskLevel: risk,                      // "low" | "medium" | "high"
  allocation: allocMap[risk],
  profileKey: undefined,
});

// QuizScreen — score on finish:
const { profileKey, profile, allocation, scores } = await api.scoreQuiz({ answers });

// WhatIfScreen — run historical sim:
const result = await api.runWhatIf({ asset, amount, fromYear: year });

// Ticker — poll every 60 s:
useEffect(() => {
  const load = async () => { const { items } = await api.getTicker(); setTicker(items); };
  load();
  const id = setInterval(load, 60_000);
  return () => clearInterval(id);
}, []);

─────────────────────────────────────────────────────────────────────────────── */