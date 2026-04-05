import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";

// ─── IMAGES ──────────────────────────────────────────────────────────────
const HERO_IMG = "https://cdn.poehali.dev/projects/762a1b30-b86b-4dec-8f91-6e3e5e53f21b/files/3ba9025d-0add-4331-9acf-b5f2c2f32b07.jpg";
const COIN_IMG = "https://cdn.poehali.dev/projects/762a1b30-b86b-4dec-8f91-6e3e5e53f21b/files/debae1a6-80dc-4318-bfad-6a466af4ab11.jpg";

// ─── Types ───────────────────────────────────────────────────────────────

interface FloatText { id: number; x: number; y: number; value: string; color: string; }

interface Upgrade {
  id: string; name: string; desc: string; emoji: string;
  cost: number; multiplier: number; purchased: boolean;
}
interface Business {
  id: string; name: string; emoji: string; desc: string;
  baseCost: number; baseIncome: number; level: number; maxLevel: number;
}
interface Achievement {
  id: string; name: string; emoji: string; desc: string;
  condition: (g: { totalCoins: number; totalClicks: number; autoRate: number; hasBiz: boolean }) => boolean;
  unlocked: boolean;
}
interface GameEvent {
  id: string; title: string; emoji: string; desc: string;
  duration: number; multiplier: number; timeLeft: number;
}

// ─── Data ────────────────────────────────────────────────────────────────

const UPGRADES: Upgrade[] = [
  { id: "u1", name: "Острые ногти", desc: "+1 к клику", emoji: "💅", cost: 50, multiplier: 1, purchased: false },
  { id: "u2", name: "Золотой палец", desc: "×2 к клику", emoji: "☝️", cost: 200, multiplier: 2, purchased: false },
  { id: "u3", name: "Магнит монет", desc: "×3 к клику", emoji: "🧲", cost: 500, multiplier: 3, purchased: false },
  { id: "u4", name: "Перчатки кликера", desc: "×5 к клику", emoji: "🥊", cost: 1500, multiplier: 5, purchased: false },
  { id: "u5", name: "Роборука", desc: "×10 к клику", emoji: "🦾", cost: 5000, multiplier: 10, purchased: false },
  { id: "u6", name: "Квантовый клик", desc: "×25 к клику", emoji: "⚛️", cost: 20000, multiplier: 25, purchased: false },
  { id: "u7", name: "Монетный шторм", desc: "×50 к клику", emoji: "🌪️", cost: 75000, multiplier: 50, purchased: false },
  { id: "u8", name: "Галактика монет", desc: "×100 к клику", emoji: "🌌", cost: 250000, multiplier: 100, purchased: false },
];

const BUSINESSES: Business[] = [
  { id: "b1", name: "Ларёк лимонада", emoji: "🍋", desc: "+1 монета/сек", baseCost: 100, baseIncome: 1, level: 0, maxLevel: 50 },
  { id: "b2", name: "Пекарня", emoji: "🥐", desc: "+5 монет/сек", baseCost: 500, baseIncome: 5, level: 0, maxLevel: 50 },
  { id: "b3", name: "Кофейня", emoji: "☕", desc: "+20 монет/сек", baseCost: 2000, baseIncome: 20, level: 0, maxLevel: 50 },
  { id: "b4", name: "Пиццерия", emoji: "🍕", desc: "+80 монет/сек", baseCost: 8000, baseIncome: 80, level: 0, maxLevel: 50 },
  { id: "b5", name: "Банк", emoji: "🏦", desc: "+300 монет/сек", baseCost: 30000, baseIncome: 300, level: 0, maxLevel: 50 },
  { id: "b6", name: "Казино", emoji: "🎰", desc: "+1К монет/сек", baseCost: 100000, baseIncome: 1000, level: 0, maxLevel: 50 },
  { id: "b7", name: "Ракетный завод", emoji: "🚀", desc: "+4К монет/сек", baseCost: 400000, baseIncome: 4000, level: 0, maxLevel: 50 },
];

const EVENT_POOL: Omit<GameEvent, "timeLeft">[] = [
  { id: "e1", title: "Золотой час!", emoji: "⭐", desc: "×3 на 30 сек", duration: 30, multiplier: 3 },
  { id: "e2", title: "Монетный ливень", emoji: "🌧️", desc: "×5 на 20 сек", duration: 20, multiplier: 5 },
  { id: "e3", title: "Щедрый бог", emoji: "👑", desc: "×10 на 15 сек!", duration: 15, multiplier: 10 },
  { id: "e4", title: "Праздник!", emoji: "🎉", desc: "×2 на 45 сек", duration: 45, multiplier: 2 },
];

const ACHIEVE_DEF: Omit<Achievement, "unlocked">[] = [
  { id: "a1", name: "Первый клик!", emoji: "👆", desc: "Первый клик", condition: (g) => g.totalClicks >= 1 },
  { id: "a2", name: "Кликоман", emoji: "🤙", desc: "100 кликов", condition: (g) => g.totalClicks >= 100 },
  { id: "a3", name: "Кликер-мания", emoji: "🖱️", desc: "1 000 кликов", condition: (g) => g.totalClicks >= 1000 },
  { id: "a4", name: "Монетный мешок", emoji: "💰", desc: "1 000 монет заработано", condition: (g) => g.totalCoins >= 1000 },
  { id: "a5", name: "Богатей", emoji: "🤑", desc: "10 000 монет", condition: (g) => g.totalCoins >= 10000 },
  { id: "a6", name: "Миллионер", emoji: "💎", desc: "1 000 000 монет", condition: (g) => g.totalCoins >= 1000000 },
  { id: "a7", name: "Бизнес-ангел", emoji: "🏢", desc: "Первый бизнес", condition: (g) => g.hasBiz },
  { id: "a8", name: "Машина дохода", emoji: "⚡", desc: "Авто 100+/сек", condition: (g) => g.autoRate >= 100 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + "Т";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "Б";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "М";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "К";
  return Math.floor(n).toString();
}

function calcClick(upgrades: Upgrade[]): number {
  let base = 1, mult = 1;
  upgrades.filter((u) => u.purchased).forEach((u) => {
    if (u.id === "u1") base += 1; else mult *= u.multiplier;
  });
  return base * mult;
}
function calcAuto(biz: Business[]): number {
  return biz.reduce((s, b) => s + b.baseIncome * b.level, 0);
}
function bizCost(b: Business): number {
  return Math.floor(b.baseCost * Math.pow(1.15, b.level));
}

// Next unlockable business
function nextBiz(businesses: Business[]): Business | null {
  return businesses.find((b) => b.level === 0) || null;
}

// Progress to next milestone
function getGoal(totalCoins: number): { label: string; target: number } {
  const milestones = [1000, 5000, 10000, 50000, 100000, 500000, 1000000, 5000000];
  const target = milestones.find((m) => m > totalCoins) || milestones[milestones.length - 1];
  return { label: fmt(target), target };
}

type Screen = "home" | "upgrades" | "business" | "achievements" | "settings";

// Sparkle positions
const SPARKLES = [
  { top: "10%", left: "5%", delay: "0s" },
  { top: "15%", right: "8%", delay: "0.4s" },
  { top: "55%", left: "2%", delay: "0.8s" },
  { top: "70%", right: "5%", delay: "0.2s" },
  { top: "30%", left: "12%", delay: "1.1s" },
  { top: "45%", right: "12%", delay: "0.6s" },
];

// ═══════════════════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════════════════

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [coins, setCoins] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [upgrades, setUpgrades] = useState<Upgrade[]>(UPGRADES.map((u) => ({ ...u })));
  const [businesses, setBusinesses] = useState<Business[]>(BUSINESSES.map((b) => ({ ...b })));
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVE_DEF.map((a) => ({ ...a, unlocked: false })));
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [floats, setFloats] = useState<FloatText[]>([]);
  const [tapping, setTapping] = useState(false);
  const [animOn, setAnimOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const floatId = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clickValue = calcClick(upgrades);
  const autoRate = calcAuto(businesses);
  const eventMult = events.reduce((m, e) => m * e.multiplier, 1) || 1;
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const nb = nextBiz(businesses);
  const goal = getGoal(totalCoins);
  const goalPct = Math.min(100, Math.round((totalCoins / goal.target) * 100));

  // auto income
  useEffect(() => {
    if (autoRate <= 0) return;
    const t = setInterval(() => {
      const earned = autoRate * eventMult * 0.1;
      setCoins((c) => c + earned);
      setTotalCoins((c) => c + earned);
    }, 100);
    return () => clearInterval(t);
  }, [autoRate, eventMult]);

  // event countdown
  useEffect(() => {
    const t = setInterval(() => {
      setEvents((prev) => prev.map((e) => ({ ...e, timeLeft: e.timeLeft - 1 })).filter((e) => e.timeLeft > 0));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // event spawner
  useEffect(() => {
    const t = setInterval(() => {
      if (Math.random() < 0.35 && totalCoins > 50) {
        const tmpl = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
        setEvents((prev) => prev.find((e) => e.id === tmpl.id) ? prev : [...prev, { ...tmpl, timeLeft: tmpl.duration }]);
      }
    }, 18000);
    return () => clearInterval(t);
  }, [totalCoins]);

  // achievements
  useEffect(() => {
    const hasBiz = businesses.some((b) => b.level > 0);
    setAchievements((prev) =>
      prev.map((a) => {
        if (a.unlocked) return a;
        const ok = a.condition({ totalCoins, totalClicks, autoRate, hasBiz });
        if (ok) showToast(`🏆 ${a.name}!`);
        return ok ? { ...a, unlocked: true } : a;
      })
    );
  }, [totalCoins, totalClicks, autoRate, businesses]);

  function showToast(msg: string) {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2800);
  }

  const handleClick = useCallback((e: React.MouseEvent) => {
    const earned = clickValue * eventMult;
    setCoins((c) => c + earned);
    setTotalCoins((c) => c + earned);
    setTotalClicks((c) => c + 1);

    if (animOn) {
      setTapping(true);
      setTimeout(() => setTapping(false), 160);

      const id = ++floatId.current;
      const colors = ["#FFD700", "#FF9800", "#4CAF50", "#2196F3", "#FF4081"];
      const color = eventMult > 1 ? "#FF4081" : colors[Math.floor(Math.random() * colors.length)];
      setFloats((prev) => [...prev, {
        id, color,
        x: e.clientX + (Math.random() - 0.5) * 60,
        y: e.clientY - 10,
        value: eventMult > 1 ? `+${fmt(earned)} 🔥` : `+${fmt(earned)} 🪙`,
      }]);
      setTimeout(() => setFloats((prev) => prev.filter((f) => f.id !== id)), 820);
    }
  }, [clickValue, eventMult, animOn]);

  const buyUpgrade = (id: string) => {
    const u = upgrades.find((x) => x.id === id);
    if (!u || u.purchased || coins < u.cost) return;
    setCoins((c) => c - u.cost);
    setUpgrades((prev) => prev.map((x) => x.id === id ? { ...x, purchased: true } : x));
  };

  const buyBiz = (id: string) => {
    const b = businesses.find((x) => x.id === id);
    if (!b || b.level >= b.maxLevel) return;
    const cost = bizCost(b);
    if (coins < cost) return;
    setCoins((c) => c - cost);
    setBusinesses((prev) => prev.map((x) => x.id === id ? { ...x, level: x.level + 1 } : x));
  };

  const resetGame = () => {
    setCoins(0); setTotalCoins(0); setTotalClicks(0);
    setUpgrades(UPGRADES.map((u) => ({ ...u })));
    setBusinesses(BUSINESSES.map((b) => ({ ...b })));
    setAchievements(ACHIEVE_DEF.map((a) => ({ ...a, unlocked: false })));
    setEvents([]);
  };

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", overflowX: "hidden" }}>

      {/* Warm yellow background */}
      <div className="game-bg">
        {/* Building silhouettes SVG */}
        <svg style={{ position: "absolute", bottom: 0, left: 0, right: 0, width: "100%", height: "45%" }} viewBox="0 0 430 200" preserveAspectRatio="none">
          <rect x="10" y="80" width="35" height="120" rx="4" fill="#FFD54F" opacity="0.4" />
          <rect x="15" y="60" width="25" height="20" rx="2" fill="#FFB300" opacity="0.3" />
          <rect x="55" y="110" width="50" height="90" rx="6" fill="#FFA726" opacity="0.35" />
          <rect x="70" y="90" width="20" height="25" rx="3" fill="#FF8F00" opacity="0.3" />
          <rect x="115" y="130" width="30" height="70" rx="4" fill="#FFD54F" opacity="0.4" />
          <rect x="300" y="60" width="60" height="140" rx="5" fill="#FFA726" opacity="0.3" />
          <rect x="310" y="40" width="40" height="25" rx="3" fill="#FF8F00" opacity="0.25" />
          <rect x="370" y="130" width="45" height="70" rx="4" fill="#FFD54F" opacity="0.35" />
          <rect x="155" y="145" width="25" height="55" rx="3" fill="#FFB300" opacity="0.3" />
          <rect x="190" y="155" width="20" height="45" rx="3" fill="#FFA726" opacity="0.3" />
        </svg>
      </div>

      {/* Float texts */}
      {floats.map((f) => (
        <div key={f.id} className="float-text" style={{ left: f.x, top: f.y, color: f.color }}>{f.value}</div>
      ))}

      {/* Achievement toast */}
      {toastMsg && <div className="achieve-toast">{toastMsg}</div>}

      {/* ── TOP BAR ───────────────────────────────────────────────────── */}
      <div className="top-bar">
        <div className="avatar-box">
          <img src={HERO_IMG} alt="герой" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        <div className="currency-box">
          <span style={{ fontSize: 20 }}>🪙</span>
          <span className="currency-num">{fmt(coins)}</span>
        </div>

        <div className="icon-btn" style={{ background: "#4CAF50" }} onClick={() => setScreen("achievements")}>
          🏅
        </div>
        <div className="icon-btn" style={{ background: "white" }} onClick={() => setScreen("settings")}>
          ⚙️
        </div>
      </div>

      {/* ── EVENTS ────────────────────────────────────────────────────── */}
      {events.length > 0 && (
        <div style={{ position: "relative", zIndex: 25, padding: "6px 10px 0", display: "flex", flexDirection: "column", gap: 4 }}>
          {events.map((ev) => (
            <div key={ev.id} className="event-pill">
              <span>{ev.emoji}</span>
              <span style={{ flex: 1 }}>{ev.title} · {ev.desc}</span>
              <span style={{ background: "rgba(0,0,0,0.2)", borderRadius: 50, padding: "2px 8px" }}>{ev.timeLeft}с</span>
            </div>
          ))}
        </div>
      )}

      {/* ── HOME SCENE ────────────────────────────────────────────────── */}
      {screen === "home" && (
        <>
          <div className="scene-wrap">
            {/* Sparkles */}
            {SPARKLES.map((s, i) => (
              <div key={i} className="sparkle" style={{ ...s, animationDelay: s.delay }}>✨</div>
            ))}

            {/* Stats row */}
            <div style={{ display: "flex", gap: 6, width: "100%", marginBottom: 8 }}>
              <div className="stat-box">
                <div className="stat-lbl">За клик</div>
                <div className="stat-val" style={{ color: "#FF9800" }}>
                  +{fmt(clickValue * eventMult)}
                  {eventMult > 1 && <span style={{ fontSize: 12, color: "#FF4081" }}> 🔥</span>}
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-lbl">В секунду</div>
                <div className="stat-val" style={{ color: "#4CAF50" }}>+{fmt(autoRate * eventMult)}</div>
              </div>
              <div className="stat-box">
                <div className="stat-lbl">Кликов</div>
                <div className="stat-val">{fmt(totalClicks)}</div>
              </div>
            </div>

            {/* Hero + Coin click zone */}
            <div className="coin-zone" onClick={handleClick}>
              <img src={HERO_IMG} alt="герой" className={`hero-img ${tapping ? "tap" : ""}`} />
              <img src={COIN_IMG} alt="монета" className={`coin-img ${tapping ? "tap" : ""}`} />
              {eventMult > 1 && (
                <div style={{
                  position: "absolute", top: 8, right: 8,
                  background: "#FF4081", color: "white",
                  border: "3px solid #111", borderRadius: 50,
                  padding: "4px 12px", fontWeight: 900, fontSize: 14
                }}>🔥 ×{eventMult}</div>
              )}
            </div>

            {/* Progress */}
            <div style={{ width: "100%", marginTop: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 900, marginBottom: 3, color: "#555" }}>
                <span>🎯 Цель: {goal.label}</span>
                <span>{goalPct}%</span>
              </div>
              <div className="progress-wrap">
                <div className="progress-fill" style={{ width: `${goalPct}%` }} />
                <div className="progress-label">
                  {fmt(totalCoins)} / {goal.label}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="bottom-bar">
            {nb ? (
              <button
                className={`c-btn ${coins >= bizCost(nb) ? "c-btn-green" : "c-btn-gray"}`}
                style={{ width: "100%", padding: "14px", fontSize: 16, borderRadius: 50 }}
                onClick={() => buyBiz(nb.id)}
              >
                {nb.emoji} КУПИТЬ: {nb.name}
                <span style={{ marginLeft: 8, fontSize: 13, background: "rgba(0,0,0,0.15)", borderRadius: 50, padding: "2px 10px" }}>
                  🪙 {fmt(bizCost(nb))}
                </span>
              </button>
            ) : (
              <button className="c-btn c-btn-gold" style={{ width: "100%", padding: "14px", fontSize: 16, borderRadius: 50 }}>
                🏆 ВСЕ БИЗНЕСЫ КУПЛЕНЫ!
              </button>
            )}
            <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#888", marginTop: 5 }}>
              {nb ? `Следующий бизнес: ${nb.name}` : "Максимальный прогресс!"}
            </div>

            {/* Nav */}
            <div className="nav-row" style={{ marginTop: 8, marginBottom: 0 }}>
              {([
                { key: "home", label: "Главная", icon: "🏠" },
                { key: "upgrades", label: "Улучшения", icon: "⚡" },
                { key: "business", label: "Бизнесы", icon: "🏢" },
                { key: "achievements", label: "Награды", icon: "🏆" },
                { key: "settings", label: "Настройки", icon: "⚙️" },
              ] as { key: Screen; label: string; icon: string }[]).map(({ key, label, icon }) => (
                <button key={key} className={`nav-tab ${screen === key ? "active" : ""}`} onClick={() => setScreen(key)}>
                  <span className="t-icon">{icon}</span>
                  <span>{label}</span>
                  {key === "achievements" && unlockedCount > 0 && (
                    <span style={{ position: "absolute", top: -4, right: -4, background: "#FF4081", color: "white", fontSize: 9, fontWeight: 900, borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #111" }}>
                      {unlockedCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── INNER PAGES ───────────────────────────────────────────────── */}
      {screen !== "home" && (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, position: "relative", zIndex: 10 }}>
          <div className="page-wrap">
            <div className="inner-list page-in">
              {screen === "upgrades" && <UpgradesPage upgrades={upgrades} coins={coins} onBuy={buyUpgrade} />}
              {screen === "business" && <BusinessPage businesses={businesses} coins={coins} autoRate={autoRate} onBuy={buyBiz} />}
              {screen === "achievements" && <AchievePage achievements={achievements} unlocked={unlockedCount} />}
              {screen === "settings" && (
                <SettingsPage soundOn={soundOn} animOn={animOn}
                  onToggleSound={() => setSoundOn((s) => !s)}
                  onToggleAnim={() => setAnimOn((a) => !a)}
                  onReset={resetGame} totalCoins={totalCoins} totalClicks={totalClicks} />
              )}
            </div>
          </div>

          {/* Bottom nav for inner pages */}
          <div className="bottom-bar" style={{ marginTop: "auto" }}>
            <div className="nav-row" style={{ marginBottom: 0 }}>
              {([
                { key: "home", label: "Главная", icon: "🏠" },
                { key: "upgrades", label: "Улучшения", icon: "⚡" },
                { key: "business", label: "Бизнесы", icon: "🏢" },
                { key: "achievements", label: "Награды", icon: "🏆" },
                { key: "settings", label: "Настройки", icon: "⚙️" },
              ] as { key: Screen; label: string; icon: string }[]).map(({ key, label, icon }) => (
                <button key={key} className={`nav-tab ${screen === key ? "active" : ""}`} style={{ position: "relative" }} onClick={() => setScreen(key)}>
                  <span className="t-icon">{icon}</span>
                  <span>{label}</span>
                  {key === "achievements" && unlockedCount > 0 && (
                    <span style={{ position: "absolute", top: -4, right: -4, background: "#FF4081", color: "white", fontSize: 9, fontWeight: 900, borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #111" }}>
                      {unlockedCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// UPGRADES PAGE
// ═══════════════════════════════════════════════════════════════════════════

function UpgradesPage({ upgrades, coins, onBuy }: { upgrades: Upgrade[]; coins: number; onBuy: (id: string) => void }) {
  const bought = upgrades.filter((u) => u.purchased).length;
  return (
    <>
      <div className="list-title">⚡ Улучшения — {bought}/{upgrades.length}</div>
      {upgrades.map((u) => (
        <div key={u.id} className={`list-item ${u.purchased ? "purchased" : coins < u.cost ? "locked" : ""}`} onClick={() => onBuy(u.id)}>
          <div className="list-icon">{u.emoji}</div>
          <div className="list-body">
            <div className="list-name">{u.name}</div>
            <div className="list-desc">{u.desc}</div>
          </div>
          {u.purchased
            ? <div className="list-action done">✓</div>
            : <div className={`list-action ${coins >= u.cost ? "buy" : "no-money"}`}>🪙 {fmt(u.cost)}</div>
          }
        </div>
      ))}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BUSINESS PAGE
// ═══════════════════════════════════════════════════════════════════════════

function BusinessPage({ businesses, coins, autoRate, onBuy }: { businesses: Business[]; coins: number; autoRate: number; onBuy: (id: string) => void }) {
  return (
    <>
      <div className="list-title">🏢 Бизнесы · авто +{fmt(autoRate)}/сек</div>
      {businesses.map((b) => {
        const cost = bizCost(b);
        const can = coins >= cost;
        const maxed = b.level >= b.maxLevel;
        return (
          <div key={b.id} className={`list-item ${!can && b.level === 0 ? "locked" : ""}`} onClick={() => onBuy(b.id)}>
            <div className="list-icon" style={{ background: b.level > 0 ? "#FFF9C4" : undefined }}>{b.emoji}</div>
            <div className="list-body">
              <div className="list-name">{b.name}</div>
              <div className="list-desc">{b.desc}{b.level > 0 ? ` · ур.${b.level}/${b.maxLevel}` : ""}</div>
              {b.level > 0 && (
                <div className="biz-bar-wrap" style={{ marginTop: 4 }}>
                  <div className="biz-bar-fill" style={{ width: `${(b.level / b.maxLevel) * 100}%` }} />
                </div>
              )}
            </div>
            {maxed
              ? <div className="list-action done">МАКС</div>
              : <div className={`list-action ${can ? "buy" : "no-money"}`}>🪙 {fmt(cost)}</div>
            }
          </div>
        );
      })}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ACHIEVEMENTS PAGE
// ═══════════════════════════════════════════════════════════════════════════

function AchievePage({ achievements, unlocked }: { achievements: Achievement[]; unlocked: number }) {
  const pct = Math.round((unlocked / achievements.length) * 100);
  return (
    <>
      <div className="list-title">🏆 Достижения — {unlocked}/{achievements.length}</div>
      <div style={{ padding: "10px 12px 6px" }}>
        <div className="progress-wrap" style={{ height: 20, marginBottom: 0 }}>
          <div className="progress-fill" style={{ width: `${pct}%`, background: "#FFD700" }} />
          <div className="progress-label" style={{ color: "#333" }}>{pct}% выполнено</div>
        </div>
      </div>
      {achievements.map((a) => (
        <div key={a.id} className={`list-item ${a.unlocked ? "purchased" : "locked"}`} style={{ cursor: "default" }}>
          <div className="list-icon" style={{ background: a.unlocked ? "#FFD700" : "#EEE", filter: a.unlocked ? "none" : "grayscale(1)" }}>{a.emoji}</div>
          <div className="list-body">
            <div className="list-name" style={{ color: a.unlocked ? "#111" : "#AAA" }}>{a.name}</div>
            <div className="list-desc">{a.desc}</div>
          </div>
          {a.unlocked && <div className="list-action done" style={{ cursor: "default" }}>✓</div>}
        </div>
      ))}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════════════════

interface SettingsProps {
  soundOn: boolean; animOn: boolean;
  onToggleSound: () => void; onToggleAnim: () => void;
  onReset: () => void; totalCoins: number; totalClicks: number;
}

function SettingsPage({ soundOn, animOn, onToggleSound, onToggleAnim, onReset, totalCoins, totalClicks }: SettingsProps) {
  const [confirm, setConfirm] = useState(false);

  return (
    <>
      <div className="list-title">⚙️ Настройки</div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "10px 12px 0" }}>
        <div className="stat-box">
          <div className="stat-lbl">Всего монет</div>
          <div className="stat-val" style={{ color: "#FF9800" }}>{fmt(totalCoins)}</div>
        </div>
        <div className="stat-box">
          <div className="stat-lbl">Всего кликов</div>
          <div className="stat-val" style={{ color: "#4CAF50" }}>{fmt(totalClicks)}</div>
        </div>
      </div>

      {/* Toggles */}
      <div className="list-item" style={{ cursor: "default" }}>
        <span style={{ fontSize: 26 }}>🔊</span>
        <div className="list-body"><div className="list-name">Звук</div></div>
        <div className={`toggle-wrap ${soundOn ? "on" : "off"}`} onClick={onToggleSound}><div className="toggle-knob" /></div>
      </div>
      <div className="list-item" style={{ cursor: "default" }}>
        <span style={{ fontSize: 26 }}>✨</span>
        <div className="list-body"><div className="list-name">Анимации</div></div>
        <div className={`toggle-wrap ${animOn ? "on" : "off"}`} onClick={onToggleAnim}><div className="toggle-knob" /></div>
      </div>

      {/* Reset */}
      <div style={{ padding: "10px 12px" }}>
        {!confirm ? (
          <button className="c-btn c-btn-pink" style={{ width: "100%", padding: "12px", borderRadius: 50, fontSize: 15 }} onClick={() => setConfirm(true)}>
            🗑️ Сбросить прогресс
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ textAlign: "center", fontWeight: 900, fontSize: 15 }}>Точно всё сбросить? 😱</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="c-btn c-btn-orange" style={{ flex: 1, padding: "10px", borderRadius: 50 }} onClick={() => { onReset(); setConfirm(false); }}>Да!</button>
              <button className="c-btn c-btn-green" style={{ flex: 1, padding: "10px", borderRadius: 50 }} onClick={() => setConfirm(false)}>Нет!</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#AAA", padding: "8px 0 12px" }}>
        КликИмперия v1.0 · сделано с ❤️
      </div>
    </>
  );
}
