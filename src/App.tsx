import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ──────────────────────────────────────────────────────────────

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
  { id: "u4", name: "Кликерские перчатки", desc: "×5 к клику", emoji: "🥊", cost: 1500, multiplier: 5, purchased: false },
  { id: "u5", name: "Роботизированная рука", desc: "×10 к клику", emoji: "🦾", cost: 5000, multiplier: 10, purchased: false },
  { id: "u6", name: "Квантовый клик", desc: "×25 к клику", emoji: "⚛️", cost: 20000, multiplier: 25, purchased: false },
  { id: "u7", name: "Монетный шторм", desc: "×50 к клику", emoji: "🌪️", cost: 75000, multiplier: 50, purchased: false },
  { id: "u8", name: "Галактика", desc: "×100 к клику", emoji: "🌌", cost: 250000, multiplier: 100, purchased: false },
];

const BUSINESSES: Business[] = [
  { id: "b1", name: "Лимонадный ларёк", emoji: "🍋", desc: "Простой, но прибыльный", baseCost: 100, baseIncome: 1, level: 0, maxLevel: 50 },
  { id: "b2", name: "Пекарня", emoji: "🥐", desc: "Свежие булки = монеты", baseCost: 500, baseIncome: 5, level: 0, maxLevel: 50 },
  { id: "b3", name: "Кофейня", emoji: "☕", desc: "Кофе за деньги", baseCost: 2000, baseIncome: 20, level: 0, maxLevel: 50 },
  { id: "b4", name: "Пиццерия", emoji: "🍕", desc: "Горячие деньги", baseCost: 8000, baseIncome: 80, level: 0, maxLevel: 50 },
  { id: "b5", name: "Банк", emoji: "🏦", desc: "Деньги делают деньги", baseCost: 30000, baseIncome: 300, level: 0, maxLevel: 50 },
  { id: "b6", name: "Казино", emoji: "🎰", desc: "Риск — благородное дело", baseCost: 100000, baseIncome: 1000, level: 0, maxLevel: 50 },
  { id: "b7", name: "Ракетная фабрика", emoji: "🚀", desc: "Буквально деньги улетают", baseCost: 400000, baseIncome: 4000, level: 0, maxLevel: 50 },
];

const EVENT_POOL: Omit<GameEvent, "timeLeft">[] = [
  { id: "e1", title: "Золотой час!", emoji: "⭐", desc: "×3 к доходу 30 сек", duration: 30, multiplier: 3 },
  { id: "e2", title: "Монетный дождь", emoji: "🌧️", desc: "×5 к кликам 20 сек", duration: 20, multiplier: 5 },
  { id: "e3", title: "Щедрый бог", emoji: "👑", desc: "×10 на 15 секунд!", duration: 15, multiplier: 10 },
  { id: "e4", title: "Праздник клика", emoji: "🎉", desc: "×2 на 45 секунд", duration: 45, multiplier: 2 },
];

const ACHIEVE_DEF: Omit<Achievement, "unlocked">[] = [
  { id: "a1", name: "Первый клик!", emoji: "👆", desc: "Сделай первый клик", condition: (g) => g.totalClicks >= 1 },
  { id: "a2", name: "Кликоман", emoji: "🤙", desc: "100 кликов", condition: (g) => g.totalClicks >= 100 },
  { id: "a3", name: "Кликер-мания", emoji: "🖱️", desc: "1 000 кликов", condition: (g) => g.totalClicks >= 1000 },
  { id: "a4", name: "Монетный мешок", emoji: "💰", desc: "1 000 монет", condition: (g) => g.totalCoins >= 1000 },
  { id: "a5", name: "Богатей", emoji: "🤑", desc: "10 000 монет", condition: (g) => g.totalCoins >= 10000 },
  { id: "a6", name: "Миллионер", emoji: "💎", desc: "1 000 000 монет", condition: (g) => g.totalCoins >= 1000000 },
  { id: "a7", name: "Бизнес-ангел", emoji: "🏢", desc: "Первый бизнес", condition: (g) => g.hasBiz },
  { id: "a8", name: "Машина дохода", emoji: "⚡", desc: "Автоклик 100/сек", condition: (g) => g.autoRate >= 100 },
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
function calcAuto(businesses: Business[]): number {
  return businesses.reduce((s, b) => s + b.baseIncome * b.level, 0);
}
function bizCost(b: Business): number {
  return Math.floor(b.baseCost * Math.pow(1.15, b.level));
}

type Screen = "home" | "upgrades" | "business" | "achievements" | "settings";

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
  const [charClicked, setCharClicked] = useState(false);
  const [animOn, setAnimOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const floatId = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clickValue = calcClick(upgrades);
  const autoRate = calcAuto(businesses);
  const eventMult = events.reduce((m, e) => m * e.multiplier, 1) || 1;

  useEffect(() => {
    if (autoRate <= 0) return;
    const t = setInterval(() => {
      const earned = autoRate * eventMult * 0.1;
      setCoins((c) => c + earned);
      setTotalCoins((c) => c + earned);
    }, 100);
    return () => clearInterval(t);
  }, [autoRate, eventMult]);

  useEffect(() => {
    const t = setInterval(() => {
      setEvents((prev) => prev.map((e) => ({ ...e, timeLeft: e.timeLeft - 1 })).filter((e) => e.timeLeft > 0));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      if (Math.random() < 0.35 && totalCoins > 50) {
        const tmpl = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
        setEvents((prev) => prev.find((e) => e.id === tmpl.id) ? prev : [...prev, { ...tmpl, timeLeft: tmpl.duration }]);
      }
    }, 18000);
    return () => clearInterval(t);
  }, [totalCoins]);

  useEffect(() => {
    const hasBiz = businesses.some((b) => b.level > 0);
    setAchievements((prev) =>
      prev.map((a) => {
        if (a.unlocked) return a;
        const ok = a.condition({ totalCoins, totalClicks, autoRate, hasBiz });
        if (ok) showToast(`🏆 ${a.name}`);
        return ok ? { ...a, unlocked: true } : a;
      })
    );
  }, [totalCoins, totalClicks, autoRate, businesses]);

  function showToast(msg: string) {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3000);
  }

  const handleClick = useCallback((e: React.MouseEvent) => {
    const earned = clickValue * eventMult;
    setCoins((c) => c + earned);
    setTotalCoins((c) => c + earned);
    setTotalClicks((c) => c + 1);

    if (animOn) {
      setCharClicked(true);
      setTimeout(() => setCharClicked(false), 160);

      const id = ++floatId.current;
      const colors = ["#FFD700", "#FF6B35", "#7BC67E", "#5BC8F5", "#FF69B4"];
      const color = eventMult > 1 ? "#FF69B4" : colors[Math.floor(Math.random() * colors.length)];
      setFloats((prev) => [...prev, {
        id, color,
        x: e.clientX + (Math.random() - 0.5) * 50,
        y: e.clientY - 15,
        value: eventMult > 1 ? `+${fmt(earned)} 🔥` : `+${fmt(earned)} 🪙`,
      }]);
      setTimeout(() => setFloats((prev) => prev.filter((f) => f.id !== id)), 870);
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

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const progressPct = Math.min(100, (Math.log10(Math.max(1, totalCoins)) / 9) * 100);

  return (
    <div className="font-nunito select-none" style={{ maxWidth: 420, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
      <div className="sky-bg" />

      {floats.map((f) => (
        <div key={f.id} className="float-text" style={{ left: f.x, top: f.y, color: f.color }}>{f.value}</div>
      ))}

      {toastMsg && <div className="achieve-toast">{toastMsg}</div>}

      {/* TOP BAR */}
      <div className="top-bar">
        <div className="top-bar-currency">
          <div className="coin-icon">🪙</div>
          <span style={{ color: "hsl(45 100% 70%)", fontWeight: 900, fontSize: 15 }}>{fmt(coins)}</span>
        </div>
        <div className="top-bar-title">КликИмперия</div>
        <div className="top-bar-currency" style={{ borderColor: "hsl(280 60% 45%)" }}>
          <span style={{ fontSize: 16 }}>💎</span>
          <span style={{ color: "hsl(280 70% 75%)", fontWeight: 900, fontSize: 14 }}>{unlockedCount}</span>
        </div>
      </div>

      {/* Events */}
      {events.length > 0 && (
        <div style={{ position: "relative", zIndex: 25, margin: "8px 10px 0", display: "flex", flexDirection: "column", gap: 4 }}>
          {events.map((ev) => (
            <div key={ev.id} className="event-banner">
              <span style={{ fontSize: 20 }}>{ev.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900, fontSize: 13 }}>{ev.title}</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>{ev.desc}</div>
              </div>
              <div style={{ fontWeight: 900, fontSize: 14, background: "hsl(0 0% 0% / 0.2)", padding: "3px 8px", borderRadius: 50 }}>{ev.timeLeft}с</div>
            </div>
          ))}
        </div>
      )}

      {/* HOME: scene + stats */}
      {screen === "home" && (
        <>
          <div className="scene-panel" onClick={handleClick}>
            <div className="scene-bg" />
            <div className="scene-overlay" />
            <div className="scene-coin-label">
              <div className="coin-icon">🪙</div>
              <span>{fmt(coins)}</span>
            </div>
            <img
              src="https://cdn.poehali.dev/projects/762a1b30-b86b-4dec-8f91-6e3e5e53f21b/files/bcfdd06d-c82b-4cba-8b48-cc6391143af9.jpg"
              alt="персонаж"
              className={`scene-character ${charClicked ? "clicked" : "idle"}`}
            />
            {eventMult > 1 && (
              <div style={{ position: "absolute", top: 10, right: 10, background: "hsl(320 80% 55%)", color: "white", fontWeight: 900, fontSize: 13, padding: "4px 10px", borderRadius: 50, border: "2px solid hsl(320 60% 40%)" }}>
                🔥 ×{eventMult}
              </div>
            )}
          </div>

          <div className="progress-row">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "hsl(35 55% 78%)" }}>Прогресс до миллиарда</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: "hsl(var(--coin-gold))" }}>{fmt(totalCoins)}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div style={{ position: "relative", zIndex: 10, margin: "8px 10px 0", display: "flex", gap: 6 }}>
            <div className="stat-box" style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "hsl(var(--muted-foreground))" }}>За клик</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "hsl(115 65% 38%)" }}>
                +{fmt(clickValue * eventMult)}
                {eventMult > 1 && <span style={{ fontSize: 11, color: "hsl(320 70% 50%)", marginLeft: 3 }}>🔥</span>}
              </div>
            </div>
            <div className="stat-box" style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "hsl(var(--muted-foreground))" }}>В секунду</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "hsl(var(--btn-orange))" }}>+{fmt(autoRate * eventMult)}</div>
            </div>
            <div className="stat-box" style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "hsl(var(--muted-foreground))" }}>Кликов</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "hsl(var(--brown-dark))" }}>{fmt(totalClicks)}</div>
            </div>
          </div>

          <div style={{ position: "relative", zIndex: 10, margin: "8px 10px 0" }}>
            <button className="big-btn big-btn-orange" onClick={handleClick}>
              🪙 КЛИКАЙ И БОГАТЕЙ!
            </button>
          </div>
        </>
      )}

      {/* INNER PAGES */}
      {screen !== "home" && (
        <div style={{ position: "relative", zIndex: 10, margin: "8px 10px 0", flex: 1, overflow: "hidden" }}>
          <div className="bottom-card page-enter" style={{ maxHeight: "calc(100vh - 155px)", overflowY: "auto" }}>
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
      )}

      {/* NAV TABS */}
      <div className="nav-tabs">
        {([
          { key: "home", label: "Главная", icon: "Home" },
          { key: "upgrades", label: "Улучшения", icon: "Zap" },
          { key: "business", label: "Бизнесы", icon: "Building2" },
          { key: "achievements", label: "Награды", icon: "Trophy" },
          { key: "settings", label: "Настройки", icon: "Settings" },
        ] as { key: Screen; label: string; icon: string }[]).map(({ key, label, icon }) => (
          <button key={key} className={`nav-tab ${screen === key ? "active" : ""}`} style={{ position: "relative" }} onClick={() => setScreen(key)}>
            <Icon name={icon} size={18} />
            <span>{label}</span>
            {key === "achievements" && unlockedCount > 0 && (
              <span style={{ position: "absolute", top: -4, right: -2, background: "hsl(var(--coin-gold))", color: "hsl(25 50% 15%)", fontSize: 9, fontWeight: 900, borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {unlockedCount}
              </span>
            )}
          </button>
        ))}
      </div>
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
      <div className="section-title">⚡ Улучшения клика — {bought}/{upgrades.length}</div>
      {upgrades.map((u) => (
        <div key={u.id} className={`item-row ${u.purchased ? "purchased" : coins < u.cost ? "locked" : ""}`} onClick={() => onBuy(u.id)}>
          <div className="item-icon-wrap">{u.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="item-name">{u.name}</div>
            <div className="item-sub">{u.desc}</div>
          </div>
          {u.purchased
            ? <div className="cost-btn done">✓ Куплено</div>
            : <div className={`cost-btn ${coins >= u.cost ? "can" : "cant"}`}><div className="coin-icon">🪙</div>{fmt(u.cost)}</div>
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
      <div className="section-title">🏢 Бизнесы — +{fmt(autoRate)}/сек</div>
      {businesses.map((b) => {
        const cost = bizCost(b);
        const can = coins >= cost;
        const maxed = b.level >= b.maxLevel;
        return (
          <div key={b.id} className={`item-row ${!can && b.level === 0 ? "locked" : ""}`} onClick={() => onBuy(b.id)}>
            <div className="item-icon-wrap">{b.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="item-name">{b.name}</div>
              <div className="item-sub">{b.desc}</div>
              {b.level > 0 && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ height: 6, borderRadius: 50, background: "hsl(var(--brown-light))", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 50, width: `${(b.level / b.maxLevel) * 100}%`, background: "linear-gradient(90deg, hsl(var(--btn-orange)), hsl(var(--coin-gold)))" }} />
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "hsl(var(--muted-foreground))", marginTop: 2 }}>
                    Ур.{b.level}/{b.maxLevel} · +{fmt(b.baseIncome * b.level)}/сек
                  </div>
                </div>
              )}
            </div>
            {maxed
              ? <div className="cost-btn done">МАКС</div>
              : <div className={`cost-btn ${can ? "can" : "cant"}`}><div className="coin-icon">🪙</div>{fmt(cost)}</div>
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
      <div className="section-title">🏆 Достижения — {unlocked}/{achievements.length}</div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ height: 14, borderRadius: 50, background: "hsl(var(--brown-light))", overflow: "hidden", border: "2px solid hsl(var(--border))" }}>
          <div style={{ height: "100%", borderRadius: 50, width: `${pct}%`, background: "linear-gradient(90deg, hsl(var(--coin-gold)), hsl(var(--btn-orange)))", transition: "width 0.5s ease" }} />
        </div>
        <div style={{ textAlign: "right", fontSize: 11, fontWeight: 800, color: "hsl(var(--muted-foreground))", marginTop: 3 }}>{pct}% выполнено</div>
      </div>
      {achievements.map((a) => (
        <div key={a.id} className={`item-row ${a.unlocked ? "purchased" : "locked"}`} style={{ cursor: "default" }}>
          <div className="item-icon-wrap" style={{ fontSize: a.unlocked ? 26 : 20, filter: a.unlocked ? "none" : "grayscale(1) opacity(0.5)" }}>{a.emoji}</div>
          <div style={{ flex: 1 }}>
            <div className="item-name" style={{ color: a.unlocked ? "hsl(var(--brown-dark))" : "hsl(var(--muted-foreground))" }}>{a.name}</div>
            <div className="item-sub">{a.desc}</div>
          </div>
          {a.unlocked && <div className="cost-btn done" style={{ cursor: "default" }}>✓</div>}
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
      <div className="section-title">⚙️ Настройки</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        <div className="stat-box">
          <div style={{ fontSize: 11, fontWeight: 700, color: "hsl(var(--muted-foreground))" }}>Всего монет</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "hsl(var(--coin-gold))" }}>{fmt(totalCoins)}</div>
        </div>
        <div className="stat-box">
          <div style={{ fontSize: 11, fontWeight: 700, color: "hsl(var(--muted-foreground))" }}>Всего кликов</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "hsl(var(--btn-green))" }}>{fmt(totalClicks)}</div>
        </div>
      </div>

      <div className="item-row" style={{ cursor: "default", marginBottom: 6 }}>
        <span style={{ fontSize: 22 }}>🔊</span>
        <div style={{ flex: 1 }}><div className="item-name">Звук</div></div>
        <div className={`toggle-wrap ${soundOn ? "on" : "off"}`} onClick={onToggleSound}><div className="toggle-knob" /></div>
      </div>
      <div className="item-row" style={{ cursor: "default", marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>✨</span>
        <div style={{ flex: 1 }}><div className="item-name">Анимации клика</div></div>
        <div className={`toggle-wrap ${animOn ? "on" : "off"}`} onClick={onToggleAnim}><div className="toggle-knob" /></div>
      </div>

      {!confirm ? (
        <button className="big-btn" style={{ background: "hsl(0 80% 60% / 0.12)", border: "3px solid hsl(0 80% 60% / 0.45)", color: "hsl(0 75% 45%)", fontSize: 15, boxShadow: "none" }} onClick={() => setConfirm(true)}>
          🗑️ Сбросить прогресс
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ textAlign: "center", fontSize: 14, fontWeight: 800, color: "hsl(0 75% 45%)" }}>Точно сбросить всё?</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="big-btn big-btn-orange" style={{ flex: 1, fontSize: 14, padding: "10px" }} onClick={() => { onReset(); setConfirm(false); }}>Да!</button>
            <button className="big-btn" style={{ flex: 1, fontSize: 14, padding: "10px", background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))", boxShadow: "none" }} onClick={() => setConfirm(false)}>Нет</button>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "hsl(var(--muted-foreground))", marginTop: 14 }}>
        КликИмперия v1.0 · сделано с ❤️
      </div>
    </>
  );
}
