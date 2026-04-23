import { useState, useEffect, useRef } from "react";
import api from "./api";

// ─── THEME ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#0a0c10", surface: "#111318", surface2: "#181c24",
  border: "#1e2430", accent: "#00e5a0", accent2: "#ff4d6d",
  accent3: "#ffd166", text: "#e8ecf4", muted: "#6b7591", purple: "#c084fc",
};

// ─── DATA ────────────────────────────────────────────────────────────────────
const QUIZ_QUESTIONS = [
  { id: 1, q: "Your ₹1 lakh portfolio just dropped 25% in a week. What do you do?",
    options: [
      { key: "A", label: "Sell everything",       detail: "Cut losses before it gets worse.", score: { risk: 0, patience: 0, knowledge: 1 } },
      { key: "B", label: "Sell some, hold some",  detail: "De-risk partially, wait and watch.", score: { risk: 1, patience: 1, knowledge: 2 } },
      { key: "C", label: "Hold my position",      detail: "Volatile, but I believe in my thesis.", score: { risk: 3, patience: 3, knowledge: 2 } },
      { key: "D", label: "Buy more (average down)",detail: "Discount opportunity!", score: { risk: 4, patience: 4, knowledge: 3 } },
    ]},
  { id: 2, q: "What's your investment time horizon?",
    options: [
      { key: "A", label: "< 1 year",   detail: "Need the money back soon.", score: { risk: 0, patience: 0, knowledge: 1 } },
      { key: "B", label: "1–3 years",  detail: "Short-to-medium term goals.", score: { risk: 1, patience: 1, knowledge: 1 } },
      { key: "C", label: "3–7 years",  detail: "Mid-term wealth building.", score: { risk: 2, patience: 3, knowledge: 2 } },
      { key: "D", label: "7+ years",   detail: "Long-term compounding.", score: { risk: 4, patience: 4, knowledge: 3 } },
    ]},
  { id: 3, q: "How do you feel about market volatility?",
    options: [
      { key: "A", label: "It terrifies me",   detail: "Can't sleep when markets fall.", score: { risk: 0, patience: 0, knowledge: 0 } },
      { key: "B", label: "Makes me anxious",  detail: "I check my portfolio daily.", score: { risk: 1, patience: 1, knowledge: 1 } },
      { key: "C", label: "I can handle it",   detail: "Short-term pain for long-term gain.", score: { risk: 3, patience: 3, knowledge: 2 } },
      { key: "D", label: "I welcome it",      detail: "Volatility = opportunity.", score: { risk: 4, patience: 4, knowledge: 4 } },
    ]},
  { id: 4, q: "Which investment do you understand best?",
    options: [
      { key: "A", label: "FD & Savings",       detail: "Safe, predictable.", score: { risk: 0, patience: 1, knowledge: 0 } },
      { key: "B", label: "Mutual Funds",        detail: "SIPs, NAV, expense ratio.", score: { risk: 2, patience: 2, knowledge: 2 } },
      { key: "C", label: "Direct Equities",     detail: "P/E, earnings, fundamentals.", score: { risk: 3, patience: 3, knowledge: 3 } },
      { key: "D", label: "Derivatives/Options", detail: "Greeks, leverage, hedging.", score: { risk: 4, patience: 2, knowledge: 4 } },
    ]},
  { id: 5, q: 'You see a "hot stock tip" going viral. You…',
    options: [
      { key: "A", label: "Buy immediately!",      detail: "FOMO is real.", score: { risk: 3, patience: 0, knowledge: 0 } },
      { key: "B", label: "Research before buying",detail: "Verify first.", score: { risk: 2, patience: 2, knowledge: 3 } },
      { key: "C", label: "Ignore it mostly",      detail: "Social media tips are noise.", score: { risk: 1, patience: 3, knowledge: 3 } },
      { key: "D", label: "Fade the trade",        detail: "Contrarian mindset.", score: { risk: 2, patience: 4, knowledge: 4 } },
    ]},
  { id: 6, q: "What % of savings can you afford to lose?",
    options: [
      { key: "A", label: "0% — need it all", detail: "Emergency fund only.", score: { risk: 0, patience: 0, knowledge: 1 } },
      { key: "B", label: "Up to 10%",        detail: "Conservative.", score: { risk: 1, patience: 1, knowledge: 1 } },
      { key: "C", label: "10–30%",           detail: "Moderate risk-taking.", score: { risk: 3, patience: 2, knowledge: 2 } },
      { key: "D", label: "30–50%+",          detail: "High-risk, high-reward mindset.", score: { risk: 4, patience: 3, knowledge: 3 } },
    ]},
  { id: 7, q: "What does CAGR stand for?",
    options: [
      { key: "A", label: "No idea",                    detail: "—", score: { risk: 1, patience: 1, knowledge: 0 } },
      { key: "B", label: "Compound Annual Growth Rate",detail: "Know it but rarely use it.", score: { risk: 2, patience: 2, knowledge: 3 } },
      { key: "C", label: "I use it to compare funds",  detail: "Practical application.", score: { risk: 2, patience: 3, knowledge: 4 } },
      { key: "D", label: "Heard of it, not sure",      detail: "Somewhat familiar.", score: { risk: 1, patience: 1, knowledge: 1 } },
    ]},
  { id: 8, q: "Which best describes your financial goal?",
    options: [
      { key: "A", label: "Protect my capital",      detail: "Safety above all.", score: { risk: 0, patience: 2, knowledge: 1 } },
      { key: "B", label: "Beat inflation",           detail: "Stay ahead of rising prices.", score: { risk: 2, patience: 2, knowledge: 2 } },
      { key: "C", label: "Build long-term wealth",   detail: "Retirement, property.", score: { risk: 3, patience: 4, knowledge: 3 } },
      { key: "D", label: "Financial freedom ASAP",   detail: "Aggressive growth.", score: { risk: 4, patience: 3, knowledge: 3 } },
    ]},
];

const PROFILES = {
  dragon:  { name: "Dragon Investor", emoji: "", color: C.accent2, bgAlpha: "rgba(255,77,109,0.1)",  tagline: "Bold, knowledgeable, comfortable with high risk. You make calculated aggressive bets." },
  owl:     { name: "Owl Investor",    emoji: "", color: C.accent3, bgAlpha: "rgba(255,209,102,0.1)", tagline: "Wise and methodical. You research thoroughly and let compounding do the heavy lifting." },
  phoenix: { name: "Phoenix Investor",emoji: "", color: "#a78bfa", bgAlpha: "rgba(167,139,250,0.1)", tagline: "Rising from ground zero — the most exciting place to start. Every expert once knew nothing." },
};

const ALLOC = {
  dragon:  { equity: 65, mf: 20, gold: 5,  fd: 10 },
  owl:     { equity: 40, mf: 40, gold: 10, fd: 10 },
  phoenix: { equity: 20, mf: 40, gold: 10, fd: 30 },
};

const CRASH_HISTORY = [
  { name: "COVID Crash (2020)",     drop: 38, recovery: 6  },
  { name: "IL&FS Crisis (2018)",    drop: 16, recovery: 14 },
  { name: "Demonetisation (2016)",  drop: 8,  recovery: 3  },
  { name: "Taper Tantrum (2013)",   drop: 14, recovery: 9  },
  { name: "Global Crisis (2008)",   drop: 61, recovery: 36 },
  { name: "Dot-com Bust (2001)",    drop: 55, recovery: 48 },
];

const ASSET_CAGR = {
  NIFTY50:  { label: "NIFTY 50",  cagr: 12.5 },
  SENSEX:   { label: "SENSEX",    cagr: 12.0 },
  GOLD:     { label: "Gold",      cagr: 9.5  },
  BTC:      { label: "Bitcoin",   cagr: 80   },
  RELIANCE: { label: "Reliance",  cagr: 14.0 },
  INFOSYS:  { label: "Infosys",   cagr: 16.0 },
};

const PRICE_STRUCTURES = {
  bullish: {
    title: "Bullish Structure",
    desc: "Markets move in 'waves'. An uptrend consists of Higher Highs (HH) and Higher Lows (HL). The pullback to an HL is a healthy part of growth, not a reason to panic. It's the market 'catching its breath' before the next leap.",
    data: [20, 55, 38, 75, 58, 95, 78, 115],
    color: "#00e5a0"
  },
  bearish: {
    title: "Bearish Structure",
    desc: "In a downtrend, we see Lower Highs (LH) and Lower Lows (LL). Recognizing this early helps you stay objective. Don't fight the trend; wait for a 'Structure Break' (a Higher High) before building confidence again.",
    data: [115, 78, 95, 58, 75, 38, 55, 20],
    color: "#ff4d6d"
  },
  accumulation: {
    title: "Accumulation Phase",
    desc: "Price moves sideways between tight Highs (H) and Lows (L). This 'sideways' movement often bores retail investors into selling, right before big institutional players push the price into a new Bullish cycle.",
    data: [50, 65, 48, 62, 52, 68, 45, 55],
    color: "#ffd166"
  },
  parabolic: {
    title: "Parabolic Run",
    desc: "A phase of extreme momentum where prices rise exponentially. While exciting, parabolic moves are often unsustainable and lead to sharp corrections. Recognizing this helps you avoid 'buying the top' out of FOMO.",
    data: [10, 15, 25, 45, 80, 150, 300, 600],
    color: "#a78bfa"
  }
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = n => "₹" + Math.round(n).toLocaleString("en-IN");
const pct = (a, b) => (((b / a) - 1) * 100).toFixed(1);

function simulate(amount, years, volIdx) {
  const volatilities = [0, 0.04, 0.12, 0.25];
  const returns = [
    {},
    { eq: 0.08, mf: 0.07, gold: 0.06, fd: 0.055 },
    { eq: 0.12, mf: 0.10, gold: 0.08, fd: 0.055 },
    { eq: 0.18, mf: 0.14, gold: 0.10, fd: 0.055 },
  ][volIdx];
  const vol = volatilities[volIdx];
  const alloc = { eq: 0.4, mf: 0.3, gold: 0.2, fd: 0.1 };

  const chartData = Array.from({ length: years + 1 }, (_, y) => {
    if (y === 0) return amount;
    const noise = 1 + Math.sin(amount * y * 7.3) * vol;
    return (
      amount * alloc.eq   * Math.pow(1 + returns.eq,   y) * noise +
      amount * alloc.mf   * Math.pow(1 + returns.mf,   y) * (1 + Math.sin(y * 3.1) * vol * 0.5) +
      amount * alloc.gold * Math.pow(1 + returns.gold,  y) +
      amount * alloc.fd   * Math.pow(1 + returns.fd,   y)
    );
  });

  return {
    chartData,
    best:   Math.round(amount * Math.pow(1 + returns.eq * 1.3, years)),
    expect: Math.round(amount * Math.pow(1 + returns.mf, years)),
    bad:    Math.round(amount * Math.pow(1 + returns.mf * 0.4 - vol * 0.3, years)),
    worst:  Math.round(amount * (1 - vol * 0.6)),
  };
}

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "rgba(17, 19, 24, 0.7)", 
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: `1px solid rgba(30, 36, 48, 0.5)`, 
      borderRadius: 16,
      padding: "24px 24px 20px", 
      marginBottom: 16, 
      position: "relative", 
      boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      ...style
    }}>
      {children}
    </div>
  );
}

function CardLabel({ children }) {
  return <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.muted, marginBottom: 10 }}>{children}</div>;
}

function H2({ children }) {
  return <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 18 }}>{children}</div>;
}

function Btn({ children, onClick, color = C.accent, textColor = "#000", style = {}, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? C.border : color, color: disabled ? C.muted : textColor,
      border: "none", borderRadius: 10, padding: "11px 22px", fontFamily: "'Syne', sans-serif",
      fontWeight: 700, fontSize: 13, cursor: disabled ? "not-allowed" : "pointer",
      transition: "opacity 0.2s", ...style,
    }}>
      {children}
    </button>
  );
}

function MiniChart({ data, color = C.accent, height = 120 }) {
  const ref = useRef();
  useEffect(() => {
    if (!ref.current || !data?.length) return;
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.offsetWidth; const H = canvas.offsetHeight;
    canvas.width = W; canvas.height = H;
    ctx.clearRect(0, 0, W, H);
    const min = Math.min(...data); const max = Math.max(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => [i / (data.length - 1) * W, H - ((v - min) / range) * (H - 12) - 6]);

    // Fill
    ctx.beginPath();
    pts.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = color + "20"; ctx.fill();

    // Line
    ctx.beginPath();
    pts.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.stroke();
  }, [data, color]);
  return <canvas ref={ref} style={{ width: "100%", height, display: "block", borderRadius: 8 }} />;
}

function StructureChart({ data, type, color, highlightIdx }) {
  const ref = useRef();
  useEffect(() => {
    if (!ref.current || !data?.length) return;
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.offsetWidth; const H = canvas.offsetHeight;
    canvas.width = W; canvas.height = H;
    ctx.clearRect(0, 0, W, H);
    const min = Math.min(...data) - 10; const max = Math.max(...data) + 10;
    const range = max - min || 1;
    const pts = data.map((v, i) => [i / (data.length - 1) * W, H - ((v - min) / range) * (H - 30) - 15]);

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, color + "30");
    grad.addColorStop(1, color + "00");
    
    ctx.beginPath();
    pts.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();

    ctx.beginPath();
    pts.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineJoin = "round"; ctx.stroke();

    pts.forEach(([x, y], i) => {
      const isHigh = i % 2 !== 0;
      const isHighlighted = i === highlightIdx;
      
      ctx.beginPath();
      ctx.arc(x, y, isHighlighted ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = isHighlighted ? color : C.bg;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = isHighlighted ? 3 : 2;
      ctx.stroke();

      if (isHighlighted) {
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.strokeStyle = color + "40";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      ctx.font = isHighlighted ? "bold 10px 'DM Mono'" : "bold 9px 'DM Mono'";
      ctx.fillStyle = isHighlighted ? C.text : C.muted;
      ctx.textAlign = "center";
      let label = "";
      if (type === "bullish") label = i % 2 === 0 ? (i === 0 ? "S" : "HL") : "HH";
      if (type === "bearish") label = i % 2 === 0 ? (i === 0 ? "S" : "LH") : "LL";
      if (type === "accumulation") label = i % 2 === 0 ? "L" : "H";
      
      if (isHighlighted) {
        ctx.fillText("YOU ARE HERE", x, i % 2 === 0 ? y + 28 : y - 22);
      }
      ctx.fillText(label, x, i % 2 === 0 ? y + 16 : y - 10);
    });
  }, [data, color, type, highlightIdx]);
  return <canvas ref={ref} style={{ width: "100%", height: 120, display: "block" }} />;
}

function BarRow({ label, pct: p, color, width = 90 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <span style={{ fontSize: 11, color: C.muted, width }}>{label}</span>
      <div style={{ flex: 1, background: C.border, borderRadius: 99, height: 6, overflow: "hidden" }}>
        <div style={{ width: `${p}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.8s cubic-bezier(.22,1,.36,1)" }} />
      </div>
      <span style={{ fontSize: 11, color: C.text, width: 34, textAlign: "right" }}>{p}%</span>
    </div>
  );
}

function RangeSlider({ label, value, min, max, step = 1, onChange, display }) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted, marginBottom: 6 }}>
        <span>{label}</span>
        <span style={{ color: C.text, fontWeight: 600 }}>{display ?? value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)}
        style={{
          width: "100%", height: 4, borderRadius: 99, outline: "none", cursor: "pointer", appearance: "none",
          background: `linear-gradient(to right, ${C.accent} ${pct}%, ${C.border} ${pct}%)`,
        }}
      />
    </div>
  );
}

// ─── SCREENS ─────────────────────────────────────────────────────────────────

// MODULE 01 + 04: Risk Sandbox
function SandboxScreen() {
  const [amount,  setAmount]  = useState(50000);
  const [horizon, setHorizon] = useState(3);
  const [vol,     setVol]     = useState(2);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const volMap = { 1: "low", 2: "medium", 3: "high" };
      const res = await api.simulate({ amount, years: horizon, volatility: volMap[vol] });
      // Map backend response fields to frontend expectations
      setResult({
        ...res,
        expect: res.expected, // Backend uses 'expected', frontend uses 'expect'
      });
    } catch (err) {
      console.error("Simulation failed:", err);
      // Fallback to local simulation if API fails
      setResult(simulate(amount, horizon, vol));
    } finally {
      setLoading(false);
    }
  }

  const allocs = { equity: 0.4, mf: 0.3, gold: 0.2, fd: 0.1 };
  const assetItems = [
    { label: "Equity",       base: amount * allocs.equity },
    { label: "Mutual Funds", base: amount * allocs.mf },
    { label: "Gold ETF",     base: amount * allocs.gold },
    { label: "Fixed Deposit",base: amount * allocs.fd },
  ];


  return (
    <div>
      {/* Asset tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        {assetItems.map(a => (
          <div key={a.label} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{a.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: "'Syne', sans-serif" }}>{fmt(a.base)}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <CardLabel>🎮 Module 01 — Risk Simulation Sandbox</CardLabel>
            <H2>Simulate Your Portfolio</H2>
            <RangeSlider label="Investment Amount" value={amount} min={5000} max={1000000000} step={5000} onChange={setAmount} display={fmt(amount)} />
            <RangeSlider label="Time Horizon" value={horizon} min={1} max={100} onChange={setHorizon} display={`${horizon} ${horizon === 1 ? "Year" : "Years"}`} />
            <RangeSlider label="Market Volatility" value={vol} min={1} max={3} onChange={setVol} display={["", "Low", "Medium", "High"][vol]} />
            <Btn onClick={run} disabled={loading} style={{ width: "100%" }}>
              {loading ? "Running…" : "▶ Run Simulation"}
            </Btn>
          </Card>

        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {result ? (
            <>
              <Card>
                <CardLabel>📈 Projected Growth</CardLabel>
                <MiniChart data={result.chartData} />
                <div style={{ fontSize: 11, color: C.muted, textAlign: "right", marginTop: 4 }}>
                  {horizon} year projection · {["", "Low", "Medium", "High"][vol]} volatility
                </div>
              </Card>

              <Card>
                <CardLabel>📊 Module 04 — Projected Outcomes</CardLabel>
                <H2>What Could Happen?</H2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { label: "Best Case 🚀",  val: result.best,   up: true },
                    { label: "Expected 📈",   val: result.expect, up: true },
                    { label: "Bad Case 📉",   val: result.bad,    up: false },
                    { label: "Worst Case 💀", val: result.worst,  up: false },
                  ].map(o => (
                    <div key={o.label} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{o.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: o.up ? C.accent : C.accent2, fontFamily: "'Syne', sans-serif" }}>{fmt(o.val)}</div>
                      <div style={{ fontSize: 10, color: o.up ? C.accent : C.accent2, marginTop: 2 }}>
                        {o.up ? "+" : ""}{pct(amount, o.val)}%
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {result.recommendations && (
                <Card>
                  <CardLabel>💡 AI Recommendations</CardLabel>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {result.recommendations.map(r => (
                      <div key={r.symbol} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: C.accent, fontFamily: "'Syne', sans-serif" }}>{r.name}</div>
                          <div style={{ fontSize: 9, color: C.muted }}>{r.symbol}</div>
                        </div>
                        <p style={{ margin: 0, fontSize: 10, color: C.muted, lineHeight: 1.4 }}>{r.desc}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, borderStyle: "dashed" }}>
              <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>🧪</div>
              <div style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: "0 40px" }}>
                Run the simulation to see projected growth and risk scenarios.
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}



function MarketConditionSection({ initialSymbol = "^NSEI" }) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState("1y");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchRes, setSearchRes] = useState([]);
  const searchRef = useRef(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await api.getMarketHistory(symbol, period);
        setData(res);
      } catch (err) {
        console.error("Market history fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [symbol, period]);

  const handleSearch = async (val) => {
    setSearch(val);
    if (val.length > 1) {
      try {
        const res = await api.searchStocks(val);
        setSearchRes(res);
      } catch (err) { console.error(err); }
    } else {
      setSearchRes([]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchRes([]);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Simple peak-finding for HH/HL labels
  const getStructureData = (raw) => {
    if (!raw || raw.length < 10) return { data: raw, highlights: [] };
    const step = Math.max(1, Math.floor(raw.length / 10));
    const sampled = [];
    for (let i = 0; i < raw.length; i += step) sampled.push(raw[i]);
    if (sampled[sampled.length-1] !== raw[raw.length-1]) sampled.push(raw[raw.length-1]);
    return sampled;
  };

  return (
    <Card style={{ marginBottom: 0 }}>
      <CardLabel>Live — Market Context</CardLabel>
      <H2>{data?.name || symbol} Analysis</H2>
      
      <div ref={searchRef} style={{ marginBottom: 16, position: "relative" }}>
        <input 
          type="text" value={search} onChange={e => handleSearch(e.target.value)}
          placeholder="Search ticker (e.g. BTC-INR, AAPL)..."
          style={{
            width: "100%", background: C.surface2, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "8px 12px", color: C.text, outline: "none",
            fontFamily: "'DM Mono', monospace", fontSize: 12
          }}
        />
        {searchRes.length > 0 && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, marginTop: 4, overflow: "hidden", position: "absolute", zIndex: 100, width: "100%", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)" }}>
            {searchRes.map(s => (
              <div key={s.symbol} onClick={() => { setSymbol(s.symbol); setSearch(""); setSearchRes([]); }} 
                style={{ padding: "10px 12px", cursor: "pointer", borderBottom: `1px solid ${C.border}`, fontSize: 12, display: "flex", justifyContent: "space-between" }}
                onMouseEnter={e => e.currentTarget.style.background = C.surface2}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <span style={{ fontWeight: 700, color: C.accent }}>{s.symbol}</span>
                <span style={{ color: C.muted, fontSize: 10 }}>{s.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {["1mo", "6mo", "1y", "5y"].map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            flex: 1, padding: "6px 0", fontSize: 9, fontWeight: 700,
            textTransform: "uppercase", borderRadius: 6,
            background: period === p ? C.accent + "15" : C.surface2,
            border: `1px solid ${period === p ? C.accent : C.border}`,
            color: period === p ? C.accent : C.muted, cursor: "pointer"
          }}>{p}</button>
        ))}
      </div>

      <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "12px 16px", border: `1px solid ${C.border}`, marginBottom: 12 }}>
        {loading ? (
          <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.muted }}>Fetching API data...</div>
        ) : data?.data ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'Syne', sans-serif" }}>{data.symbol}</div>
              <div style={{ fontSize: 10, color: data.change >= 0 ? C.accent : C.accent2, fontWeight: 800, background: (data.change >= 0 ? C.accent : C.accent2) + "20", padding: "2px 6px", borderRadius: 4 }}>
                {data.change >= 0 ? "+" : ""}{data.change}%
              </div>
            </div>
            <StructureChart 
              data={getStructureData(data.data)} 
              type={data.change >= 0 ? "bullish" : "bearish"} 
              color={data.change >= 0 ? C.accent : C.accent2} 
              highlightIdx={getStructureData(data.data).length - 1} 
            />
          </>
        ) : (
          <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.accent2 }}>Error loading live market feed</div>
        )}
      </div>

      <div style={{ background: C.accent + "05", borderLeft: `2px solid ${C.accent}`, padding: "10px 12px", borderRadius: "0 6px 6px 0" }}>
        <p style={{ margin: 0, fontSize: 11, color: C.text, lineHeight: 1.5, fontStyle: "italic" }}>
          "This is real-time market data. Notice how every 'crash' in history eventually becomes a tiny blip on the long-term chart."
        </p>
      </div>
    </Card>
  );
}

// MODULE 05: Emotional Alert System
function PanicAlertScreen() {
  const [drop,    setDrop]    = useState(15);
  const [amount,  setAmount]  = useState(50000);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  // Removed static structure state

  function getSeverity(d) {
    if (d <= 5)  return { level: "Slight Dip",    icon: "", color: C.accent,  action: "Normal market noise. Your portfolio faces similar corrections 2–3 times a year. Continue SIPs." };
    if (d <= 15) return { level: "Notable Drop",  icon: "", color: C.accent3, action: "Stay calm. Historical data shows markets recover within 6–18 months. This is a buying opportunity." };
    if (d <= 30) return { level: "Serious Crash", icon: "", color: "#ff8c00", action: "Painful but survivable. Keep your SIPs running — every rupee you add now buys more units at discount." };
    return                { level: "Market Carnage",icon: "", color: C.accent2, action: "Historic crash territory. Diversify. Check holdings. Avoid panic-selling. Markets have always recovered." };
  }

  function run() {
    setLoading(true);
    setTimeout(() => {
      const sev = getSeverity(drop);
      const similar = CRASH_HISTORY.filter(c => Math.abs(c.drop - drop) <= 15);
      const times = similar.length ? similar.map(c => c.recovery) : [18];
      
      setResult({
        sev, drop, loss: amount * drop / 100,
        rec: { avg: Math.round(times.reduce((a, b) => a + b) / times.length), best: Math.min(...times), worst: Math.max(...times) }
      });
      setLoading(false);
    }, 600);
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 20, marginBottom: 24 }}>
        <Card style={{ marginBottom: 0 }}>
          <CardLabel>Module 05 — Emotional Alert System</CardLabel>
          <H2>Don't Panic — Let Data Calm You</H2>
          <RangeSlider label="Market just dropped by (%)" value={drop} min={1} max={100} onChange={setDrop} display={`${drop}%`} />
          <RangeSlider label="Your investment" value={amount} min={5000} max={1000000000} step={5000} onChange={setAmount} display={fmt(amount)} />
          <Btn onClick={run} disabled={loading} style={{ width: "100%" }}>
            {loading ? "Analyzing…" : "Calm Me Down"}
          </Btn>
        </Card>

        <MarketConditionSection initialSymbol="^NSEI" />
      </div>

      {result && (
        <>
          <div style={{ background: result.sev.color + "15", border: `1px solid ${result.sev.color}60`, borderRadius: 12, padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
            {result.sev.icon && <div style={{ fontSize: 40 }}>{result.sev.icon}</div>}
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: result.sev.color, fontFamily: "'Syne', sans-serif" }}>{result.sev.level}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Market dropped {result.drop}%</div>
            </div>
          </div>

          <Card style={{ borderColor: result.sev.color + "40" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: result.sev.color, marginBottom: 8 }}>What Should You Do?</div>
            <p style={{ margin: 0, fontSize: 13, color: C.text, lineHeight: 1.8 }}>{result.sev.action}</p>
          </Card>

          <Card>
            <CardLabel>Historical Recovery Data</CardLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              {[
                { label: "Avg. Recovery",   val: result.rec.avg,   suffix: "months", color: C.text   },
                { label: "Fastest Recovery",val: result.rec.best,  suffix: "months", color: C.accent  },
                { label: "Slowest Recovery",val: result.rec.worst, suffix: "months", color: C.accent2 },
                { label: "Paper Loss",       val: fmt(result.loss), suffix: "if sold",color: C.accent2, raw: true },
              ].map(s => (
                <div key={s.label} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color, fontFamily: "'Syne', sans-serif" }}>{s.raw ? s.val : s.val}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{s.suffix}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardLabel>Historical Market Crashes</CardLabel>
            {CRASH_HISTORY.map(c => (
              <div key={c.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Recovered in {c.recovery} months</div>
                </div>
                <div style={{ background: C.accent2 + "20", border: `1px solid ${C.accent2}40`, borderRadius: 8, padding: "4px 12px" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.accent2 }}>−{c.drop}%</span>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}

// MODULE 06: What If Simulator
function WhatIfScreen() {
  const [asset,   setAsset]   = useState("NIFTY50");
  const [amount,  setAmount]  = useState(10000);
  const [year,    setYear]    = useState(2015);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [assets,  setAssets]  = useState({});
  const [search,   setSearch]  = useState("");
  const [searchRes, setSearchRes] = useState([]);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await api.getWhatIfAssets();
        if (res.assets) setAssets(res.assets);
      } catch (err) {
        console.error("Failed to fetch assets:", err);
      }
    };
    fetchAssets();
  }, []);

  const handleSearch = async (val) => {
    setSearch(val);
    if (val.length > 1) {
      try {
        const res = await api.searchStocks(val);
        setSearchRes(res);
      } catch (err) { console.error(err); }
    } else {
      setSearchRes([]);
    }
  };

  async function run() {
    setLoading(true);
    try {
      const res = await api.runWhatIf({ asset, amount, fromYear: year });
      setResult(res);
    } catch (err) {
      console.error("What-If simulation failed:", err);
      const cagr = (assets[asset]?.cagr ?? 10) / 100;
      const years = 2025 - year;
      const finalVal = amount * Math.pow(1 + cagr, years);
      const chartData = Array.from({ length: years + 1 }, (_, i) => Math.round(amount * Math.pow(1 + cagr, i)));
      setResult({ finalValue: finalVal, gain: finalVal - amount, gainPct: ((finalVal / amount) - 1) * 100, cagr: cagr * 100, years, chartData, insight: "Simulation fallback" });
    } finally {
      setLoading(false);
    }
  }

  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchRes([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <div>
      <Card>
        <CardLabel>⏳ Module 06 — What If I Invested Earlier?</CardLabel>
        <H2>Discover Your Missed Wealth</H2>

        <div ref={searchRef} style={{ marginBottom: 18, position: "relative" }}>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Search Stock Symbol (e.g. AAPL, TCS.NS)</div>
          <input 
            type="text" 
            value={search} 
            onChange={e => handleSearch(e.target.value)}
            onFocus={async () => {
              if (search.length === 0) {
                try {
                  const res = await api.getTrending();
                  setSearchRes(res);
                } catch (err) { console.error(err); }
              }
            }}
            placeholder="Enter symbol..."
            style={{
              width: "100%", background: C.surface2, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: "10px 14px", color: C.text, outline: "none",
              fontFamily: "'DM Mono', monospace", fontSize: 13
            }}
          />
          {searchRes.length > 0 && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, marginTop: 4, overflow: "hidden", position: "absolute", zIndex: 10, width: "100%", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)" }}>
              <div style={{ padding: "8px 14px", fontSize: 10, color: C.muted, borderBottom: `1px solid ${C.border}`, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {search.length === 0 ? "🔥 Trending Now" : "🔍 Search Results"}
              </div>
              <div style={{ maxHeight: 300, overflowY: "auto" }}>
                {searchRes.map(s => (
                  <div key={s.symbol} onClick={() => { setAsset(s.symbol); setSearch(""); setSearchRes([]); }} 
                    style={{ padding: "12px 14px", cursor: "pointer", borderBottom: `1px solid ${C.border}`, fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center", transition: "background 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(0,229,160,0.05)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 700, color: C.accent }}>{s.symbol}</span>
                      <span style={{ color: C.muted, fontSize: 10 }}>{s.name}</span>
                    </div>
                    {s.price && (
                      <div style={{ fontWeight: 600, color: C.accent, fontSize: 12, background: "rgba(0,229,160,0.1)", padding: "2px 8px", borderRadius: 6 }}>
                        ₹{s.price.toLocaleString("en-IN")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>


        <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Popular Choices</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
          {Object.entries(assets).map(([k, v]) => (
            <button key={k} onClick={() => setAsset(k)} style={{
              background: asset === k ? C.accent + "18" : C.surface2,
              border: `1px solid ${asset === k ? C.accent : C.border}`,
              borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600,
              color: asset === k ? C.accent : C.muted, cursor: "pointer",
            }}>{v.label}</button>
          ))}
          {(!assets[asset] && asset) && (
            <button style={{
              background: C.accent + "18", border: `1px solid ${C.accent}`,
              borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600,
              color: C.accent, cursor: "default",
            }}>{asset}</button>
          )}
        </div>

        <RangeSlider label="If I invested" value={amount} min={1000} max={1000000000} step={1000} onChange={setAmount} display={fmt(amount)} />
        <RangeSlider label="In the year" value={year} min={1980} max={2024} onChange={setYear} display={year} />

        <Btn onClick={run} disabled={loading} style={{ width: "100%" }}>
          {loading ? "Calculating…" : "⏳ Show Me"}
        </Btn>
      </Card>

      {result && (
        <>
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>You invested</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: "'Syne', sans-serif" }}>{fmt(amount)}</div>
                <div style={{ fontSize: 11, color: C.muted }}>in {year}</div>
              </div>
              <div style={{ fontSize: 24, color: C.muted, padding: "0 8px" }}>→</div>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Would be worth today</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.accent, fontFamily: "'Syne', sans-serif" }}>{fmt(result.finalValue)}</div>
                <div style={{ fontSize: 10, color: C.muted }}>CAGR: {(result.cagr || 0).toFixed(1)}% · {result.years}Y</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Total Gain",   val: `+${fmt(result.gain)}` },
                { label: "Return %",     val: `+${result.gainPct.toFixed(1)}%` },
              ].map(b => (
                <div key={b.label} style={{ background: C.surface2, border: `1px solid ${C.accent}40`, borderRadius: 10, padding: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{b.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.accent, fontFamily: "'Syne', sans-serif" }}>{b.val}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardLabel>Year-by-year growth</CardLabel>
            <MiniChart data={result.chartData} color={C.accent} height={130} />
          </Card>
          <div style={{ background: C.accent + "10", border: `1px solid ${C.accent}40`, borderRadius: 12, padding: "16px 18px" }}>
            <p style={{ margin: 0, fontSize: 13, color: C.text, lineHeight: 1.8 }}>
              {result.insight || (result.gainPct > 200
                ? `Even a small investment in ${assets[asset]?.label || asset} back in ${year} would have grown ${result.gainPct.toFixed(0)}%. The second-best time to start is today. 🚀`
                : `${assets[asset]?.label || asset} has compounded at ${result.cagr?.toFixed(1)}% annually since ${year}. Consistency beats timing. Start your SIP now. 📈`)
              }
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// MODULE 08: Goal Planner
function GoalScreen() {
  const [goalName, setGoalName] = useState("Dream Home");
  const [target,   setTarget]   = useState(5000000);
  const [years,    setYears]    = useState(10);
  const [rate,     setRate]     = useState(12);
  const [inflation, setInflation] = useState(6);
  const [result,   setResult]   = useState(null);

  function calculate() {
    // Inflation adjusted target
    const adjTarget = target * Math.pow(1 + inflation / 100, years);
    
    // Normal SIP calculation
    const r = rate / 100 / 12;
    const n = years * 12;
    const sip = (adjTarget * r) / (Math.pow(1 + r, n) - 1);
    
    const chartData = [];
    let balance = 0;
    let totalInvested = 0;
    
    for (let i = 0; i <= years; i++) {
      if (i === 0) {
        chartData.push(0);
      } else {
        for(let m=0; m<12; m++) {
          balance = (balance + sip) * (1 + r);
          totalInvested += sip;
        }
        chartData.push(Math.round(balance));
      }
    }
    
    setResult({ 
      sip: Math.round(sip), 
      adjTarget: Math.round(adjTarget),
      totalInvested: Math.round(totalInvested), 
      wealthGained: Math.round(balance - totalInvested), 
      chartData,
      isHigh: sip > 50000
    });
  }

  const goals = [
    { name: "Home", val: 5000000, y: 10, r: 11 },
    { name: "Car",  val: 1500000, y: 5,  r: 10 },
    { name: "Education", val: 3000000, y: 15, r: 12 },
    { name: "Retirement", val: 20000000, y: 25, r: 13 },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 24 }}>
        <Card style={{ marginBottom: 0 }}>
          <CardLabel>Module 08 — Financial Goal Planner</CardLabel>
          <H2>Set Your North Star</H2>
          
          <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", marginBottom: 8, textAlign: "center" }}>Quick Templates</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20, justifyContent: "center" }}>
            {goals.map(g => (
              <button key={g.name} onClick={() => { setGoalName(g.name); setTarget(g.val); setYears(g.y); setRate(g.r); }} style={{
                background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 20, padding: "6px 14px", fontSize: 12, color: C.text, cursor: "pointer"
              }}>{g.name}</button>
            ))}
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>What are you saving for?</div>
            <input type="text" value={goalName} onChange={e => setGoalName(e.target.value)} style={{
              width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, outline: "none"
            }} />
          </div>

          <RangeSlider label="Target Amount (Today's Value)" value={target} min={100000} max={100000000} step={100000} onChange={setTarget} display={fmt(target)} />
          <RangeSlider label="Years to Reach" value={years} min={1} max={50} onChange={setYears} display={`${years} Years`} />
          <RangeSlider label="Expected Returns (%)" value={rate} min={1} max={30} step={0.5} onChange={setRate} display={`${rate}%`} />
          <RangeSlider label="Expected Inflation (%)" value={inflation} min={0} max={15} step={0.5} onChange={setInflation} display={`${inflation}%`} />

          <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
            <Btn onClick={calculate} style={{ padding: "14px 60px" }}>Calculate Strategy</Btn>
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {result ? (
            <>
              <Card style={{ border: `1px solid ${C.accent}40`, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Required Monthly SIP</div>
                <div style={{ fontSize: 40, fontWeight: 800, color: C.accent, fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>{fmt(result.sip)}</div>
                <div style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>Adjusted for {inflation}% Inflation</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 12, background: C.surface2, padding: "8px", borderRadius: 8 }}>
                  Your {fmt(target)} goal will cost <span style={{ color: C.accent2, fontWeight: 700 }}>{fmt(result.adjTarget)}</span> in {years} years.
                </div>
              </Card>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>Total Invested</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.text, fontFamily: "'Syne', sans-serif" }}>{fmt(result.totalInvested)}</div>
                </div>
                <div style={{ background: C.surface2, border: `1px solid ${C.accent}30`, borderRadius: 16, padding: 20, textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>Wealth Gained</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.accent, fontFamily: "'Syne', sans-serif" }}>{fmt(result.wealthGained)}</div>
                </div>
              </div>

              <Card>
                <CardLabel>Growth Projection</CardLabel>
                <MiniChart data={result.chartData} color={C.accent} height={160} />
              </Card>

              <div style={{ background: result.isHigh ? "rgba(255,77,109,0.1)" : "rgba(0,229,160,0.1)", border: `1px solid ${result.isHigh ? C.accent2 : C.accent}40`, borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ fontSize: 20 }}>{result.isHigh ? "⚠️" : "💡"}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: result.isHigh ? C.accent2 : C.accent, marginBottom: 4 }}>Strategy Insight</div>
                    <p style={{ margin: 0, fontSize: 11, color: C.text, lineHeight: 1.6 }}>
                      {result.isHigh 
                        ? `A SIP of ${fmt(result.sip)} is ambitious. Consider increasing your 'Years to Reach' if this exceeds 30% of your monthly income.`
                        : `Your goal is well-structured. By accounting for inflation, you're already ahead of most investors.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `2px dashed ${C.border}`, borderRadius: 20, minHeight: 400, color: C.muted }}>
              <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.2 }}>🎯</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Goal Analysis Pending</div>
              <p style={{ fontSize: 11, textAlign: "center", maxWidth: 240, marginTop: 8 }}>Fill in your goal details to see your roadmap.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// MODULE 07: Investor Quiz
function QuizScreen() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState(new Array(QUIZ_QUESTIONS.length).fill(null));
  const [result,  setResult]  = useState(null);

  function select(idx) {
    const updated = [...answers]; updated[current] = idx; setAnswers(updated);
  }

  function getProfile(s) {
    const k = s.knowledge + s.risk + s.patience;
    if (k < 18) return "phoenix";
    if (k < 26) return "owl";
    return "dragon";
  }

  function next() {
    if (answers[current] === null) return;
    if (current < QUIZ_QUESTIONS.length - 1) setCurrent(c => c + 1);
    else finish();
  }

  function finish() {
    let risk = 0, patience = 0, knowledge = 0;
    answers.forEach((a, qi) => {
      if (a === null) return;
      const s = QUIZ_QUESTIONS[qi].options[a].score;
      risk += s.risk; patience += s.patience; knowledge += s.knowledge;
    });
    const max = QUIZ_QUESTIONS.length * 4;
    const rP = risk / max * 100, pP = patience / max * 100, kP = knowledge / max * 100;
    const total = (rP + pP + kP) / 3;
    const key = getProfile({ risk, patience, knowledge });
    setResult({ key, rP, pP, kP });
  }

  function retake() {
    setCurrent(0); setAnswers(new Array(QUIZ_QUESTIONS.length).fill(null)); setResult(null);
  }

  if (result) {
    const p = PROFILES[result.key];
    const alloc = ALLOC[result.key];
    return (
      <div>
        <div style={{ background: p.bgAlpha, border: `1px solid ${p.color}60`, borderRadius: 16, padding: 24, textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>{p.emoji}</div>
          <div style={{ fontSize: 11, color: p.color, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>Your Investor Profile</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 10 }}>{p.name}</div>
          <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.8 }}>{p.tagline}</p>
        </div>

        <Card>
          <CardLabel>Your Scores</CardLabel>
          {[
            { label: "Risk Tolerance",       pct: result.rP, color: C.accent2 },
            { label: "Patience & Discipline",pct: result.pP, color: C.accent3 },
            { label: "Market Knowledge",     pct: result.kP, color: C.accent  },
          ].map(d => (
            <div key={d.label} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted, marginBottom: 6 }}>
                <span>{d.label}</span>
                <span style={{ color: d.color, fontWeight: 700 }}>{Math.round(d.pct)}%</span>
              </div>
              <div style={{ background: C.border, borderRadius: 99, height: 8, overflow: "hidden" }}>
                <div style={{ width: `${d.pct}%`, height: "100%", background: d.color, borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <CardLabel>Recommended Portfolio Allocation</CardLabel>
          <BarRow label="Equity"        pct={alloc.equity} color={C.accent} />
          <BarRow label="Mutual Funds"  pct={alloc.mf}     color={C.accent3} />
          <BarRow label="Gold ETF"      pct={alloc.gold}   color={C.purple} />
          <BarRow label="Fixed Deposit" pct={alloc.fd}     color={C.muted} />
        </Card>

        <button onClick={retake} style={{ width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 0", color: C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          ↩ Retake Quiz
        </button>
      </div>
    );
  }

  const q = QUIZ_QUESTIONS[current];
  const progress = (current / QUIZ_QUESTIONS.length) * 100;

  return (
    <Card>
      <CardLabel>🧬 Module 07 — Investor Personality Quiz</CardLabel>
      <div style={{ background: C.border, borderRadius: 99, height: 4, marginBottom: 8 }}>
        <div style={{ width: `${progress}%`, height: "100%", background: C.accent, borderRadius: 99, transition: "width 0.4s ease" }} />
      </div>
      <div style={{ fontSize: 11, color: C.muted, textAlign: "right", marginBottom: 20 }}>Q {current + 1} / {QUIZ_QUESTIONS.length}</div>

      <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Question {q.id} of {QUIZ_QUESTIONS.length}</div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 20, lineHeight: 1.5 }}>{q.q}</div>

      {q.options.map((opt, idx) => (
        <button key={opt.key} onClick={() => select(idx)} style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12,
          background: answers[current] === idx ? C.accent + "15" : C.surface2,
          border: `1px solid ${answers[current] === idx ? C.accent : C.border}`,
          borderRadius: 10, padding: "12px 14px", marginBottom: 10, cursor: "pointer", textAlign: "left",
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: answers[current] === idx ? C.accent : C.surface,
            border: `1px solid ${answers[current] === idx ? C.accent : C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: answers[current] === idx ? "#000" : C.muted,
          }}>{opt.key}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: answers[current] === idx ? C.accent : C.text, marginBottom: 2 }}>{opt.label}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{opt.detail}</div>
          </div>
        </button>
      ))}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <button onClick={() => current > 0 && setCurrent(c => c - 1)} disabled={current === 0} style={{
          background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10,
          padding: "10px 18px", color: current === 0 ? C.muted : C.text, fontSize: 13, fontWeight: 600,
          cursor: current === 0 ? "not-allowed" : "pointer", opacity: current === 0 ? 0.4 : 1,
        }}>← Back</button>
        <button onClick={next} disabled={answers[current] === null} style={{
          background: answers[current] !== null ? C.accent : C.surface2,
          border: `1px solid ${answers[current] !== null ? C.accent : C.border}`,
          borderRadius: 10, padding: "10px 22px",
          color: answers[current] !== null ? "#000" : C.muted,
          fontSize: 13, fontWeight: 700, cursor: answers[current] === null ? "not-allowed" : "pointer",
        }}>
          {current === QUIZ_QUESTIONS.length - 1 ? "See My Profile →" : "Next →"}
        </button>
      </div>
    </Card>
  );
}

// MODULE 09: AI Portfolio Meter
function AIPortfolioMeterScreen() {
  const [alloc, setAlloc] = useState({ equity: 40, mf: 30, gold: 15, fd: 15 });
  const [risk, setRisk] = useState("medium");
  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(false);

  const idealAlloc = aiData?.idealAllocation || {
    low:    { equity: 10, mf: 20, gold: 20, fd: 50 },
    medium: { equity: 30, mf: 40, gold: 15, fd: 15 },
    high:   { equity: 60, mf: 25, gold: 10, fd: 5  },
  }[risk];

  // Calculate alignment score (0-100)
  const calculateAlignment = () => {
    let diff = 0;
    Object.keys(idealAlloc).forEach(k => {
      const current = alloc[k] || 0;
      const target = idealAlloc[k] || 0;
      diff += Math.abs(target - current);
    });
    return Math.max(0, 100 - Math.round(diff / 2)); // Divide by 2 because each diff is counted twice (once for + and once for -)
  };

  const score = calculateAlignment();

  useEffect(() => {
    const fetchAI = async () => {
      setLoading(true);
      try {
        const res = await api.getAIExplanation({
          riskLevel: risk,
          allocation: alloc,
        });
        setAiData(res);
      } catch (err) {
        console.error("AI fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(fetchAI, 1000); // Debounce
    return () => clearTimeout(timer);
  }, [alloc, risk]);

  const updateAlloc = (key, val) => {
    const newVal = Math.max(0, val);
    const otherKeys = Object.keys(alloc).filter(k => k !== key);
    const currentSum = Object.values(alloc).reduce((a, b) => a + b, 0);
    const diff = newVal - alloc[key];
    
    // Simple proportional adjustment for other assets to keep sum at 100
    const updated = { ...alloc, [key]: newVal };
    const remaining = 100 - newVal;
    const currentOtherSum = otherKeys.reduce((s, k) => s + alloc[k], 0) || 1;
    
    otherKeys.forEach(k => {
      updated[k] = Math.round((alloc[k] / currentOtherSum) * remaining);
    });
    
    // Final adjustment for rounding
    const finalSum = Object.values(updated).reduce((a, b) => a + b, 0);
    if (finalSum !== 100) {
      updated[otherKeys[0]] += (100 - finalSum);
    }
    
    setAlloc(updated);
  };

  const gaugeColor = score > 80 ? C.accent : score > 50 ? C.accent3 : C.accent2;

  return (
    <div>
      <Card style={{ textAlign: "center" }}>
        <CardLabel>🤖 Module 09 — AI Portfolio Health Meter</CardLabel>
        <H2>How Optimal is Your Portfolio?</H2>
        
        {/* Semi-circular Gauge */}
        <div style={{ position: "relative", width: 240, height: 140, margin: "0 auto 20px", overflow: "hidden" }}>
          <svg viewBox="0 0 200 100" width="240" height="120">
            <path d="M20,100 A80,80 0 0,1 180,100" fill="none" stroke={C.border} strokeWidth="12" strokeLinecap="round" />
            <path d="M20,100 A80,80 0 0,1 180,100" fill="none" stroke={gaugeColor} strokeWidth="12" strokeLinecap="round"
              strokeDasharray="251.3" strokeDashoffset={251.3 - (251.3 * score / 100)}
              style={{ transition: "stroke-dashoffset 1s ease-out, stroke 0.5s" }}
            />
          </svg>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: gaugeColor, fontFamily: "'Syne', sans-serif" }}>{score}%</div>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Alignment Score</div>
          </div>
        </div>

        {/* Stacked Allocation Bar */}
        <div style={{ marginBottom: 24, padding: "0 20px" }}>
          <div style={{ display: "flex", height: 10, borderRadius: 99, overflow: "hidden", background: C.border, marginBottom: 8 }}>
            <div style={{ width: `${alloc.equity}%`, background: C.accent, transition: "width 0.8s ease" }} />
            <div style={{ width: `${alloc.mf}%`, background: C.accent3, transition: "width 0.8s ease" }} />
            <div style={{ width: `${alloc.gold}%`, background: C.purple, transition: "width 0.8s ease" }} />
            <div style={{ width: `${alloc.fd}%`, background: C.muted, transition: "width 0.8s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            {[
              { label: "Equity", color: C.accent },
              { label: "MF", color: C.accent3 },
              { label: "Gold", color: C.purple },
              { label: "Debt", color: C.muted },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: item.color }} />
                <span style={{ fontSize: 9, color: C.muted, textTransform: "uppercase" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
            {["low", "medium", "high"].map(r => (
              <button key={r} onClick={() => setRisk(r)} style={{
                flex: 1, background: risk === r ? C.accent + "15" : C.surface2,
                border: `1px solid ${risk === r ? C.accent : C.border}`,
                borderRadius: 12, padding: "10px 8px", cursor: "pointer", textAlign: "center",
                transition: "all 0.2s"
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: risk === r ? C.accent : C.text, textTransform: "capitalize" }}>{r} Risk</div>
              </button>
            ))}
          </div>

          <Btn onClick={() => setAlloc({ ...idealAlloc })} style={{ width: "100%", background: "transparent", border: `1px solid ${C.accent}`, color: C.accent }}>
            ✨ Optimize with AI
          </Btn>
        </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        <Card>
          <CardLabel>Adjust Your Current Portfolio</CardLabel>
          <RangeSlider label="Equity (Stocks)" value={alloc.equity} min={0} max={100} onChange={v => updateAlloc("equity", v)} display={`${alloc.equity}%`} />
          <RangeSlider label="Mutual Funds" value={alloc.mf} min={0} max={100} onChange={v => updateAlloc("mf", v)} display={`${alloc.mf}%`} />
          <RangeSlider label="Gold / Commodities" value={alloc.gold} min={0} max={100} onChange={v => updateAlloc("gold", v)} display={`${alloc.gold}%`} />
          <RangeSlider label="Fixed Deposits / Cash" value={alloc.fd} min={0} max={100} onChange={v => updateAlloc("fd", v)} display={`${alloc.fd}%`} />
          
          <div style={{ marginTop: 20, padding: 12, background: C.surface2, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 8, textTransform: "uppercase" }}>AI Ideal for {risk} Risk</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.entries(idealAlloc).map(([k, v]) => (
                <div key={k} style={{ fontSize: 11, color: C.text }}>
                  <span style={{ color: C.accent }}>{k.toUpperCase()}:</span> {v}%
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardLabel>🤖 AI Smart Suggestions</CardLabel>
          {loading ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: C.muted, fontSize: 12 }}>
              <div style={{ animation: "pulse 1s infinite", marginBottom: 12 }}>Analyzing Portfolio...</div>
            </div>
          ) : (
            <div style={{ animation: "fadeIn 0.5s ease" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
                <div style={{ fontSize: 24 }}>💡</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.accent, marginBottom: 6 }}>AI Perspective</div>
                  <p style={{ fontSize: 12, color: C.text, lineHeight: 1.6, margin: 0 }}>
                    {aiData?.explanation || "Based on your current allocation, you are skewed away from the ideal mix for your risk profile."}
                  </p>
                </div>
              </div>

              {aiData?.bestSuggestion && (
                <div style={{ background: C.accent + "15", border: `1px solid ${C.accent}40`, borderRadius: 10, padding: "12px 14px", marginBottom: 20 }}>
                  <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, textTransform: "uppercase", marginBottom: 4, letterSpacing: "0.05em" }}>🌟 Best Suggestion</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{aiData.bestSuggestion}</div>
                </div>
              )}

              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 12, letterSpacing: "0.05em" }}>Next Steps for You</div>
                {aiData?.tips?.map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent, marginTop: 6, flexShrink: 0 }} />
                    <div style={{ fontSize: 12, color: C.muted }}>{tip}</div>
                  </div>
                )) || (
                  <div style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>Adjust your sliders to see real-time suggestions.</div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

const DEEP_DIVE_CONTENT = {
  quiz: {
    title: "Understanding Investor Psychology",
    content: "Investment success is 20% head knowledge and 80% behavior. Your 'Investor Profile' is not just a label; it's a mirror to how you might react during a 20% market crash. Dragons need to watch for overconfidence, while Phoenixes should focus on building the habit of consistency.",
    stats: [
      { label: "Behavioral Gap", val: "4.3%", desc: "Average annual return lost to panic selling" },
      { label: "Retail Duration", val: "2.1Y", desc: "Average time an Indian retail investor holds an equity fund" }
    ]
  },
  sandbox: {
    title: "The Math of Compounding & Volatility",
    content: "Volatility is the price you pay for returns. While a 'High' volatility setting shows scary swings, it also represents the premium earned over safe assets like FDs. In the Sandbox, notice how the green line (best case) spreads further from the red line (worst case) as you increase the 'Time Horizon'.",
    stats: [
      { label: "Nifty 10Y CAGR", val: "12.8%", desc: "Historical average growth of Indian markets" },
      { label: "Recovery Time", val: "14Mo", desc: "Average time for markets to hit a new high after a 20% drop" }
    ]
  },
  aimeter: {
    title: "Modern Portfolio Theory (MPT)",
    content: "AI-driven optimization uses algorithms like Mean-Variance Optimization to find the 'Efficient Frontier'. This is the set of portfolios that offer the highest expected return for a defined level of risk. Diversification isn't just about owning many things; it's about owning things that don't move together.",
    stats: [
      { label: "Diversification Benefit", val: "30%", desc: "Reduction in risk without sacrificing long-term returns" },
      { label: "Ideal Assets", val: "4-6", desc: "Minimum asset classes for a truly balanced portfolio" }
    ]
  },
  panic: {
    title: "Surviving Market Cycles",
    content: "Every major crash in history—from the 2008 Financial Crisis to the 2020 COVID dip—felt like the 'end of the world' at the time. Yet, the Nifty 50 has always recovered. The 'Calm' module uses this historical data to show you that your 'Paper Loss' only becomes a 'Real Loss' if you click the 'Sell' button.",
    stats: [
      { label: "Worst Year (2008)", val: "-52%", desc: "The deepest annual drop in recent Nifty history" },
      { label: "Best Year (2009)", val: "+75%", desc: "The explosive recovery immediately following the crash" }
    ]
  },
  whatif: {
    title: "The Cost of Waiting",
    content: "The most expensive phrase in investing is 'I'll wait for the market to bottom'. As the 'What If' simulator shows, missing even the 10 best days in a decade can halve your total returns. Time in the market is significantly more important than timing the market.",
    stats: [
      { label: "Waiting Cost", val: "₹12L+", desc: "Average wealth lost by delaying a ₹10k SIP by just 5 years" },
      { label: "Compounding Magic", val: "Year 7", desc: "The point where returns typically start exceeding the principal" }
    ]
  },
  goal: {
    title: "Goal-Based Investing",
    content: "A goal without a timeline is just a dream. By accounting for inflation, you ensure that your '₹50 Lakhs' in 2035 actually buys the same lifestyle it does today. Financial freedom isn't about having a lot of money; it's about having enough money at the right time.",
    stats: [
      { label: "Inflation Impact", val: "2x", desc: "Prices in India typically double every 10-12 years" },
      { label: "Success Rate", val: "94%", desc: "Investors with specific goals are more likely to stay invested" }
    ]
  }
};

function DeepDiveSection({ tab }) {
  const content = DEEP_DIVE_CONTENT[tab];
  if (!content) return null;
  
  return (
    <div style={{ marginTop: 60, padding: "40px 0", borderTop: `1px solid ${C.border}` }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 40, alignItems: "start" }}>
        <div>
          <div style={{ display: "inline-block", background: C.accent + "15", color: C.accent, fontSize: 10, fontWeight: 800, padding: "4px 10px", borderRadius: 4, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.1em" }}>Deep Dive</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 20 }}>{content.title}</h2>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8, margin: 0 }}>{content.content}</p>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {content.stats.map(s => (
            <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, transition: "transform 0.3s", cursor: "default" }}
                 onMouseEnter={e => e.currentTarget.style.transform = "translateY(-5px)"}
                 onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
              <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.1em" }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.accent, fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>{s.val}</div>
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>{s.desc}</div>
            </div>
          ))}
          
          <div style={{ gridColumn: "1 / -1", background: `linear-gradient(135deg, ${C.surface} 0%, ${C.bg} 100%)`, border: `1px dashed ${C.border}`, borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
             <div style={{ fontSize: 24 }}>🎓</div>
             <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>
               <strong>Pro Tip:</strong> Data shows that investors who focus on these metrics are <span style={{ color: C.accent }}>3x more likely</span> to stick to their long-term plan during market corrections.
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TICKER ──────────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  { name: "NIFTY50",  val: "▲ 22,418", up: true },
  { name: "SENSEX",   val: "▲ 73,847", up: true },
  { name: "GOLD",     val: "▲ ₹72,300",up: true },
  { name: "BTC/INR",  val: "▼ ₹68,14,000", up: false },
  { name: "RELIANCE", val: "▲ ₹2,943",  up: true },
  { name: "INFOSYS",  val: "▼ ₹1,412",  up: false },
  { name: "TCS",      val: "▲ ₹3,802",  up: true },
];

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: "quiz",      label: "Quiz",       Screen: QuizScreen      },
  { key: "sandbox",   label: "Sandbox",   Screen: SandboxScreen   },
  { key: "aimeter",   label: "AI Portfolio", Screen: AIPortfolioMeterScreen },
  { key: "panic",     label: "Calm",       Screen: PanicAlertScreen},
  { key: "whatif",    label: "What If",    Screen: WhatIfScreen    },
  { key: "goal",      label: "Goal",       Screen: GoalScreen      },
];

export default function App() {
  const [tab, setTab] = useState("quiz");
  const [tickerItems, setTickerItems] = useState([...TICKER_ITEMS, ...TICKER_ITEMS]);

  useEffect(() => {
    const loadTicker = async () => {
      try {
        const data = await api.getTicker();
        if (data && data.items) {
          setTickerItems([...data.items, ...data.items]);
        }
      } catch (err) {
        console.error("Failed to fetch ticker:", err);
      }
    };
    loadTicker();
    const id = setInterval(loadTicker, 30000); // Refresh every 30s
    return () => clearInterval(id);
  }, []);

  const ActiveScreen = TABS.find(t => t.key === tab).Screen;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; color: ${C.text}; font-family: 'DM Mono', monospace; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 99px; }
        input[type=range] { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 99px; outline: none; cursor: pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: ${C.accent}; border: 2px solid ${C.bg}; }
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes pulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
        @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0} }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      {/* Ticker */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "9px 0", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 40, whiteSpace: "nowrap", animation: "ticker 22s linear infinite" }}>
          {tickerItems.map((t, i) => (
            <span key={i} style={{ display: "inline-flex", gap: 8, alignItems: "center", fontSize: 12 }}>
              <span style={{ color: C.muted }}>{t.name}</span>
              <span style={{ fontWeight: 600, color: t.up ? C.accent : C.accent2 }}>{t.val}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Hero Header */}
      <div style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, padding: "32px 20px 24px", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(0,229,160,0.1)", border: "1px solid rgba(0,229,160,0.3)",
          color: C.accent, fontSize: 10, letterSpacing: "0.15em", padding: "5px 14px",
          borderRadius: 100, marginBottom: 16, textTransform: "uppercase",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent, animation: "pulse 1.4s ease infinite", display: "inline-block" }} />
          InvestSafe · Hackathon 2025
        </div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(2rem,7vw,3.2rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
          Invest<span style={{ color: C.accent }}>Safe</span> — Fear <span style={{ color: C.accent2 }}>Less</span>, Grow <span style={{ color: C.accent }}>More</span>
        </h1>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 12, lineHeight: 1.7, maxWidth: 800, margin: "12px auto 0" }}>
          Contextualize risk. Simulate losses. Build real investing confidence — before touching a single rupee.
        </p>
      </div>

      {/* Tab Bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        display: "flex", justifyContent: "stretch", gap: 0,
      }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: "16px 0", fontSize: 11, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.1em",
            fontFamily: "'Syne', sans-serif", border: "none", 
            borderBottom: `2px solid ${tab === t.key ? C.accent : "transparent"}`,
            background: "transparent", color: tab === t.key ? C.accent : C.muted,
            cursor: "pointer", transition: "all 0.2s ease",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Screen Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 100px" }}>
        <ActiveScreen />
        <DeepDiveSection tab={tab} />
      </div>

      {/* Footer */}
      <footer style={{ 
        marginTop: 80, 
        padding: "60px 24px 40px", 
        borderTop: `1px solid ${C.border}`, 
        background: `linear-gradient(to bottom, ${C.surface}, ${C.bg})` 
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 40 }}>
          {/* Brand & About */}
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 16 }}>
              Invest<span style={{ color: C.accent }}>Safe</span>
            </div>
            <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.8, marginBottom: 20 }}>
              InvestSafe is a contextual risk education platform designed to help retail investors conquer market fear through data-driven simulations and AI-powered insights. Build confidence before you invest.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              {["𝕏", "in", "IG"].map(social => (
                <div key={social} style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.muted, cursor: "pointer" }}>{social}</div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>Explore</div>
            <div style={{ display: "grid", gap: 12 }}>
              {TABS.map(t => (
                <a key={t.key} onClick={() => { setTab(t.key); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ fontSize: 13, color: C.muted, cursor: "pointer", transition: "color 0.2s" }}>
                  {t.label}
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>Contact Us</div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.8 }}>
              <div style={{ marginBottom: 8 }}>📍 BKC, Mumbai, Maharashtra, India</div>
              <div style={{ marginBottom: 8 }}>📧 hello@investsafe.io</div>
              <div style={{ marginBottom: 8 }}>📞 +91 98765 43210</div>
            </div>
          </div>

          {/* Legal */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>Legal</div>
            <div style={{ display: "grid", gap: 12 }}>
              {["Privacy Policy", "Terms of Service", "Cookie Policy", "SEBI Disclaimer"].map(link => (
                <span key={link} style={{ fontSize: 13, color: C.muted, cursor: "pointer" }}>{link}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Newsletter Bar */}
        <div style={{ 
          maxWidth: 600, 
          margin: "60px auto 0", 
          background: "rgba(0, 229, 160, 0.05)", 
          border: `1px solid ${C.accent}30`, 
          borderRadius: 16, 
          padding: "30px 40px",
          textAlign: "center"
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text, fontFamily: "'Syne', sans-serif", marginBottom: 8 }}>Stay Ahead of the Market</div>
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Get AI-powered portfolio insights and market risk alerts delivered to your inbox.</p>
          <form onSubmit={(e) => {
            e.preventDefault();
            const email = e.target.email.value;
            if (email) {
              alert(`🚀 Success! ${email} has been subscribed to InvestSafe weekly insights.`);
              e.target.reset();
            }
          }} style={{ display: "flex", gap: 10 }}>
            <input 
              name="email"
              type="email" 
              placeholder="your@email.com" 
              required
              style={{
                flex: 1, background: C.bg, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: "12px 16px", color: C.text, outline: "none",
                fontFamily: "'DM Mono', monospace", fontSize: 13
              }}
            />
            <Btn type="submit" style={{ padding: "0 24px" }}>Subscribe</Btn>
          </form>
        </div>

        <div style={{ 
          maxWidth: 1200, 
          margin: "60px auto 0", 
          paddingTop: 24, 
          borderTop: `1px solid ${C.border}`, 
          textAlign: "center" 
        }}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            © 2025 INVESTSAFE · BUILT FOR THE FUTURE OF INDIAN INVESTING · HACKATHON EDITION
          </div>
        </div>
      </footer>
    </>
  );
}