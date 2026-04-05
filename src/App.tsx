import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FloatText {
  id: number;
  x: number;
  y: number;
  value: string;
  color: string;
}

interface Upgrade {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  cost: number;
  multiplier: number;
  purchased: boolean;
}

interface Business {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  baseCost: number;
  baseIncome: number;
  level: number;
  maxLevel: number;
}

interface Achievement {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  condition: (g: GameState) => boolean;
  unlocked: boolean;
}

interface GameEvent {
  id: string;
  title: string;
  emoji: string;
  desc: string;
  duration: number;
  multiplier: number;
  timeLeft: number;
  active: boolean;
}

interface GameState {
  coins: number;
  totalCoins: number;
  clickValue: number;
  autoClickRate: number;
  totalClicks: number;
  prestigeLevel: number;
}

// ─── Initial Data ─────────────────────────────────────────────────────────────

const INITIAL_UPGRADES: Upgrade[] = [
  { id: "u1", name: "Острые ногти", desc: "+1 к каждому клику", emoji: "💅", cost: 50, multiplier: 1, purchased: false },
  { id: "u2", name: "Золотой палец", desc: "×2 к каждому клику", emoji: "☝️", cost: 200, multiplier: 2, purchased: false },
  { id: "u3", name: "Магнит монет", desc: "Монеты летят сами!", emoji: "🧲", cost: 500, multiplier: 3, purchased: false },
  { id: "u4", name: "Кликерские перчатки", desc: "×5 к каждому клику", emoji: "🥊", cost: 1500, multiplier: 5, purchased: false },
  { id: "u5", name: "Роботизированная рука", desc: "×10 к клику", emoji: "🦾", cost: 5000, multiplier: 10, purchased: false },
  { id: "u6", name: "Квантовый клик", desc: "×25 к каждому клику", emoji: "⚛️", cost: 20000, multiplier: 25, purchased: false },
  { id: "u7", name: "Монетный дождь", desc: "×50 к клику!", emoji: "🌧️", cost: 75000, multiplier: 50, purchased: false },
  { id: "u8", name: "Галактический импульс", desc: "×100 к клику!!", emoji: "🌌", cost: 250000, multiplier: 100, purchased: false },
];

const INITIAL_BUSINESSES: Business[] = [
  { id: "b1", name: "Лимонадный ларёк", emoji: "🍋", desc: "Простой бизнес, но прибыльный", baseCost: 100, baseIncome: 1, level: 0, maxLevel: 50 },
  { id: "b2", name: "Пекарня", emoji: "🥐", desc: "Свежие булки каждый час", baseCost: 500, baseIncome: 5, level: 0, maxLevel: 50 },
  { id: "b3", name: "Кофейня", emoji: "☕", desc: "Кофе = монеты!", baseCost: 2000, baseIncome: 20, level: 0, maxLevel: 50 },
  { id: "b4", name: "Пиццерия", emoji: "🍕", desc: "Горячая пицца = горячие деньги", baseCost: 8000, baseIncome: 80, level: 0, maxLevel: 50 },
  { id: "b5", name: "Банк", emoji: "🏦", desc: "Деньги делают деньги", baseCost: 30000, baseIncome: 300, level: 0, maxLevel: 50 },
  { id: "b6", name: "Казино", emoji: "🎰", desc: "Риск — дело благородное", baseCost: 100000, baseIncome: 1000, level: 0, maxLevel: 50 },
  { id: "b7", name: "Ракетная фабрика", emoji: "🚀", desc: "Буквально улетают деньги", baseCost: 400000, baseIncome: 4000, level: 0, maxLevel: 50 },
];

const POSSIBLE_EVENTS: Omit<GameEvent, "timeLeft" | "active">[] = [
  { id: "e1", title: "Золотой час!", emoji: "⚡", desc: "×3 к доходу 30 секунд", duration: 30, multiplier: 3 },
  { id: "e2", title: "Монетный дождь", emoji: "🌧️", desc: "×5 к кликам 20 секунд", duration: 20, multiplier: 5 },
  { id: "e3", title: "Щедрый бог", emoji: "👑", desc: "×10 к всему на 15 секунд!", duration: 15, multiplier: 10 },
  { id: "e4", title: "Праздник клика", emoji: "🎉", desc: "×2 к всему на 45 секунд", duration: 45, multiplier: 2 },
];

const ACHIEVEMENTS_DEF: Omit<Achievement, "unlocked">[] = [
  { id: "a1", name: "Первый клик!", emoji: "👆", desc: "Сделай первый клик", condition: (g) => g.totalClicks >= 1 },
  { id: "a2", name: "Кликоман", emoji: "🤙", desc: "100 кликов", condition: (g) => g.totalClicks >= 100 },
  { id: "a3", name: "Кликер-мания", emoji: "🖱️", desc: "1000 кликов", condition: (g) => g.totalClicks >= 1000 },
  { id: "a4", name: "Монетный мешок", emoji: "💰", desc: "Накопи 1000 монет", condition: (g) => g.totalCoins >= 1000 },
  { id: "a5", name: "Богатей", emoji: "🤑", desc: "Накопи 10 000 монет", condition: (g) => g.totalCoins >= 10000 },
  { id: "a6", name: "Миллионер", emoji: "💎", desc: "Накопи 1 000 000 монет", condition: (g) => g.totalCoins >= 1000000 },
  { id: "a7", name: "Бизнес-ангел", emoji: "🏢", desc: "Открой первый бизнес", condition: () => false },
  { id: "a8", name: "Скоростной клик", emoji: "⚡", desc: "Автоклик > 100 в сек", condition: (g) => g.autoClickRate >= 100 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNum(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + "Т";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "Б";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "М";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "К";
  return Math.floor(n).toString();
}

function getUpgradedClickValue(upgrades: Upgrade[]): number {
  let base = 1;
  let multiplier = 1;
  upgrades.filter((u) => u.purchased).forEach((u) => {
    if (u.id === "u1") base += 1;
    else multiplier *= u.multiplier;
  });
  return base * multiplier;
}

function getAutoRate(businesses: Business[]): number {
  return businesses.reduce((sum, b) => sum + b.baseIncome * b.level, 0);
}

function getBizCost(b: Business): number {
  return Math.floor(b.baseCost * Math.pow(1.15, b.level));
}

type Screen = "home" | "upgrades" | "business" | "achievements" | "settings";

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [coins, setCoins] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [upgrades, setUpgrades] = useState<Upgrade[]>(INITIAL_UPGRADES);
  const [businesses, setBusinesses] = useState<Business[]>(INITIAL_BUSINESSES);
  const [achievements, setAchievements] = useState<Achievement[]>(
    ACHIEVEMENTS_DEF.map((a) => ({ ...a, unlocked: false }))
  );
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [floatTexts, setFloatTexts] = useState<FloatText[]>([]);
  const [soundOn, setSoundOn] = useState(true);
  const [animationsOn, setAnimationsOn] = useState(true);
  const [coinAnim, setCoinAnim] = useState(false);
  const [activeEventMultiplier, setActiveEventMultiplier] = useState(1);
  const floatIdRef = useRef(0);
  const eventTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventSpawnRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clickValue = getUpgradedClickValue(upgrades);
  const autoRate = getAutoRate(businesses);

  useEffect(() => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    if (autoRate <= 0) return;
    autoTimerRef.current = setInterval(() => {
      const earned = autoRate * activeEventMultiplier * 0.1;
      setCoins((c) => c + earned);
      setTotalCoins((c) => c + earned);
    }, 100);
    return () => { if (autoTimerRef.current) clearInterval(autoTimerRef.current); };
  }, [autoRate, activeEventMultiplier]);

  useEffect(() => {
    if (eventTimerRef.current) clearInterval(eventTimerRef.current);
    eventTimerRef.current = setInterval(() => {
      setEvents((prev) => {
        const updated = prev.map((e) => ({ ...e, timeLeft: e.timeLeft - 1 })).filter((e) => e.timeLeft > 0);
        const mult = updated.reduce((m, e) => m * e.multiplier, 1);
        setActiveEventMultiplier(mult || 1);
        return updated;
      });
    }, 1000);
    return () => { if (eventTimerRef.current) clearInterval(eventTimerRef.current); };
  }, []);

  useEffect(() => {
    if (eventSpawnRef.current) clearInterval(eventSpawnRef.current);
    eventSpawnRef.current = setInterval(() => {
      if (Math.random() < 0.3 && totalCoins > 100) {
        const template = POSSIBLE_EVENTS[Math.floor(Math.random() * POSSIBLE_EVENTS.length)];
        setEvents((prev) => {
          if (prev.find((e) => e.id === template.id)) return prev;
          return [...prev, { ...template, active: true, timeLeft: template.duration }];
        });
      }
    }, 15000);
    return () => { if (eventSpawnRef.current) clearInterval(eventSpawnRef.current); };
  }, [totalCoins]);

  useEffect(() => {
    const gs: GameState = { coins, totalCoins, clickValue, autoClickRate: autoRate, totalClicks, prestigeLevel: 0 };
    const hasOpenBiz = businesses.some((b) => b.level > 0);
    setAchievements((prev) =>
      prev.map((a) => {
        if (a.unlocked) return a;
        const cond = a.id === "a7" ? hasOpenBiz : a.condition(gs);
        return cond ? { ...a, unlocked: true } : a;
      })
    );
  }, [coins, totalCoins, totalClicks, autoRate, businesses, clickValue]);

  const handleCoinClick = useCallback((e: React.MouseEvent) => {
    const earned = clickValue * activeEventMultiplier;
    setCoins((c) => c + earned);
    setTotalCoins((c) => c + earned);
    setTotalClicks((c) => c + 1);

    if (animationsOn) {
      setCoinAnim(true);
      setTimeout(() => setCoinAnim(false), 150);

      const id = ++floatIdRef.current;
      const x = e.clientX + (Math.random() - 0.5) * 40;
      const y = e.clientY - 10;
      const colors = ["#FFD700", "#ADFF2F", "#FF69B4", "#00CED1", "#FFA500"];
      const color = activeEventMultiplier > 1 ? "#FF69B4" : colors[Math.floor(Math.random() * colors.length)];
      const value = activeEventMultiplier > 1 ? `+${formatNum(earned)} 🔥` : `+${formatNum(earned)}`;
      setFloatTexts((prev) => [...prev, { id, x, y, value, color }]);
      setTimeout(() => setFloatTexts((prev) => prev.filter((t) => t.id !== id)), 900);
    }
  }, [clickValue, activeEventMultiplier, animationsOn]);

  const buyUpgrade = (id: string) => {
    const upg = upgrades.find((u) => u.id === id);
    if (!upg || upg.purchased || coins < upg.cost) return;
    setCoins((c) => c - upg.cost);
    setUpgrades((prev) => prev.map((u) => u.id === id ? { ...u, purchased: true } : u));
  };

  const buyBusiness = (id: string) => {
    const biz = businesses.find((b) => b.id === id);
    if (!biz || biz.level >= biz.maxLevel) return;
    const cost = getBizCost(biz);
    if (coins < cost) return;
    setCoins((c) => c - cost);
    setBusinesses((prev) => prev.map((b) => b.id === id ? { ...b, level: b.level + 1 } : b));
  };

  const resetGame = () => {
    setCoins(0);
    setTotalCoins(0);
    setTotalClicks(0);
    setUpgrades(INITIAL_UPGRADES);
    setBusinesses(INITIAL_BUSINESSES);
    setAchievements(ACHIEVEMENTS_DEF.map((a) => ({ ...a, unlocked: false })));
    setEvents([]);
    setActiveEventMultiplier(1);
  };

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="min-h-screen font-nunito select-none relative">
      <div className="stars-bg" />

      {floatTexts.map((ft) => (
        <div
          key={ft.id}
          className="float-text text-xl"
          style={{ left: ft.x, top: ft.y, color: ft.color }}
        >
          {ft.value}
        </div>
      ))}

      {events.length > 0 && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-1 w-[calc(100%-2rem)] max-w-sm">
          {events.map((ev) => (
            <div key={ev.id} className="bonus-banner animate-event-enter">
              <span className="text-2xl">{ev.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-sm text-[hsl(320_80%_75%)]">{ev.title}</div>
                <div className="text-xs text-muted-foreground truncate">{ev.desc}</div>
              </div>
              <div className="text-[hsl(320_80%_75%)] font-black text-sm shrink-0">{ev.timeLeft}с</div>
            </div>
          ))}
        </div>
      )}

      <div className="pb-24 pt-4 px-4 max-w-md mx-auto relative z-10">
        {screen === "home" && (
          <HomeScreen
            coins={coins}
            totalCoins={totalCoins}
            totalClicks={totalClicks}
            autoRate={autoRate}
            clickValue={clickValue}
            activeEventMultiplier={activeEventMultiplier}
            coinAnim={coinAnim}
            onCoinClick={handleCoinClick}
          />
        )}
        {screen === "upgrades" && (
          <UpgradesScreen upgrades={upgrades} coins={coins} onBuy={buyUpgrade} />
        )}
        {screen === "business" && (
          <BusinessScreen businesses={businesses} coins={coins} onBuy={buyBusiness} />
        )}
        {screen === "achievements" && (
          <AchievementsScreen achievements={achievements} unlocked={unlockedCount} />
        )}
        {screen === "settings" && (
          <SettingsScreen
            soundOn={soundOn}
            animationsOn={animationsOn}
            onToggleSound={() => setSoundOn((s) => !s)}
            onToggleAnim={() => setAnimationsOn((a) => !a)}
            onReset={resetGame}
            totalCoins={totalCoins}
            totalClicks={totalClicks}
          />
        )}
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center px-2 py-2"
        style={{
          background: "hsl(258 40% 10% / 0.95)",
          borderTop: "2px solid hsl(var(--border))",
          backdropFilter: "blur(12px)",
        }}
      >
        {([
          { key: "home", label: "Главная", icon: "Home" },
          { key: "upgrades", label: "Улучшения", icon: "Zap" },
          { key: "business", label: "Бизнесы", icon: "Building2" },
          { key: "achievements", label: "Награды", icon: "Trophy" },
          { key: "settings", label: "Настройки", icon: "Settings" },
        ] as { key: Screen; label: string; icon: string }[]).map(({ key, label, icon }) => (
          <button
            key={key}
            className={`nav-btn relative ${screen === key ? "active" : ""}`}
            onClick={() => setScreen(key)}
          >
            <Icon name={icon} size={20} />
            <span>{label}</span>
            {key === "achievements" && unlockedCount > 0 && (
              <span
                className="absolute -top-1 -right-1 text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center"
                style={{ background: "hsl(var(--coin))", color: "hsl(258 40% 10%)" }}
              >
                {unlockedCount}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOME SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

interface HomeScreenProps {
  coins: number;
  totalCoins: number;
  totalClicks: number;
  autoRate: number;
  clickValue: number;
  activeEventMultiplier: number;
  coinAnim: boolean;
  onCoinClick: (e: React.MouseEvent) => void;
}

function HomeScreen({ coins, totalCoins, autoRate, clickValue, activeEventMultiplier, coinAnim, onCoinClick }: HomeScreenProps) {
  const effectiveClick = clickValue * activeEventMultiplier;
  const effectiveAuto = autoRate * activeEventMultiplier;

  return (
    <div className="flex flex-col items-center gap-6 pt-2 animate-fade-in">
      <div className="text-center">
        <h1
          className="text-3xl font-black"
          style={{ color: "hsl(var(--coin))", textShadow: "0 2px 12px hsl(45 100% 55% / 0.4)" }}
        >
          🪙 КликИмперия
        </h1>
        <p className="text-muted-foreground text-sm font-semibold mt-1">Кликай и богатей!</p>
      </div>

      <div className="game-card w-full text-center py-6">
        <div
          className="text-5xl font-black"
          style={{ color: "hsl(var(--coin))", textShadow: "0 0 20px hsl(45 100% 55% / 0.5)" }}
        >
          {formatNum(coins)}
        </div>
        <div className="text-muted-foreground font-bold mt-1">монет</div>
        <div className="flex justify-center gap-6 mt-4">
          <div className="stat-pill">
            <div className="text-xs text-muted-foreground font-semibold">за клик</div>
            <div className="font-black text-lg" style={{ color: "hsl(var(--green))" }}>
              +{formatNum(effectiveClick)}
              {activeEventMultiplier > 1 && (
                <span className="text-sm ml-1" style={{ color: "hsl(var(--pink))" }}>
                  🔥×{activeEventMultiplier}
                </span>
              )}
            </div>
          </div>
          <div className="stat-pill">
            <div className="text-xs text-muted-foreground font-semibold">в секунду</div>
            <div className="font-black text-lg" style={{ color: "hsl(var(--orange))" }}>
              +{formatNum(effectiveAuto)}
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-center my-4">
        <div
          className="coin-button flex items-center justify-center"
          style={{ transform: coinAnim ? "scale(0.9)" : "scale(1)" }}
          onClick={onCoinClick}
        >
          <span style={{ fontSize: 80, lineHeight: 1, filter: "drop-shadow(0 4px 8px hsl(35 80% 30% / 0.6))" }}>
            🪙
          </span>
        </div>
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, hsl(45 100% 55% / 0.15) 0%, transparent 70%)",
            transform: "scale(1.5)",
          }}
        />
      </div>

      <div className="game-card w-full">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-muted-foreground">Всего заработано</span>
          <span className="font-black" style={{ color: "hsl(var(--coin))" }}>{formatNum(totalCoins)}</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, (Math.log10(Math.max(1, totalCoins)) / 9) * 100)}%`,
              background: "linear-gradient(90deg, hsl(82 90% 55%), hsl(45 100% 55%))",
            }}
          />
        </div>
        <div className="text-xs text-muted-foreground mt-1 text-right font-semibold">
          До миллиарда: {formatNum(Math.max(0, 1e9 - totalCoins))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPGRADES SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

function UpgradesScreen({ upgrades, coins, onBuy }: { upgrades: Upgrade[]; coins: number; onBuy: (id: string) => void }) {
  const bought = upgrades.filter((u) => u.purchased).length;

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black" style={{ color: "hsl(var(--green))" }}>⚡ Улучшения</h2>
        <span className="stat-pill text-sm font-bold">{bought}/{upgrades.length}</span>
      </div>

      <div className="game-card">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-semibold">Ваши монеты:</span>
          <span className="font-black ml-auto" style={{ color: "hsl(var(--coin))" }}>{formatNum(coins)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {upgrades.map((u) => (
          <button
            key={u.id}
            className={`upgrade-card ${u.purchased ? "purchased" : coins < u.cost ? "locked" : ""}`}
            onClick={() => onBuy(u.id)}
          >
            <span className="text-3xl">{u.emoji}</span>
            <div className="flex-1 text-left min-w-0">
              <div className="font-extrabold text-sm truncate">{u.name}</div>
              <div className="text-xs text-muted-foreground">{u.desc}</div>
            </div>
            <div className="shrink-0 text-right">
              {u.purchased ? (
                <span
                  className="text-xs font-black px-2 py-1 rounded-xl"
                  style={{ background: "hsl(var(--green))", color: "hsl(258 40% 10%)" }}
                >
                  ✓ Куплено
                </span>
              ) : (
                <span
                  className="text-sm font-black px-3 py-1 rounded-xl"
                  style={{
                    background: coins >= u.cost ? "hsl(var(--coin))" : "hsl(var(--muted))",
                    color: coins >= u.cost ? "hsl(258 40% 10%)" : "hsl(var(--muted-foreground))",
                  }}
                >
                  🪙 {formatNum(u.cost)}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUSINESS SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

function BusinessScreen({ businesses, coins, onBuy }: { businesses: Business[]; coins: number; onBuy: (id: string) => void }) {
  const totalIncome = getAutoRate(businesses);

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black" style={{ color: "hsl(var(--orange))" }}>🏢 Бизнесы</h2>
        <span className="stat-pill text-sm font-bold">+{formatNum(totalIncome)}/с</span>
      </div>

      <div className="game-card">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground font-semibold">Монеты:</span>
          <span className="font-black" style={{ color: "hsl(var(--coin))" }}>{formatNum(coins)}</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-sm text-muted-foreground font-semibold">Пассивный доход:</span>
          <span className="font-black" style={{ color: "hsl(var(--orange))" }}>+{formatNum(totalIncome)}/сек</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {businesses.map((b) => {
          const cost = getBizCost(b);
          const canAfford = coins >= cost;
          const maxed = b.level >= b.maxLevel;
          return (
            <button
              key={b.id}
              className={`biz-card ${!canAfford && b.level === 0 ? "locked" : ""}`}
              onClick={() => onBuy(b.id)}
            >
              <span className="text-3xl">{b.emoji}</span>
              <div className="flex-1 text-left min-w-0">
                <div className="font-extrabold text-sm">{b.name}</div>
                <div className="text-xs text-muted-foreground">{b.desc}</div>
                {b.level > 0 && (
                  <div className="mt-1">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(b.level / b.maxLevel) * 100}%`,
                          background: "linear-gradient(90deg, hsl(var(--orange)), hsl(var(--coin)))",
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Ур. {b.level}/{b.maxLevel} · +{formatNum(b.baseIncome * b.level)}/с
                    </div>
                  </div>
                )}
              </div>
              <div className="shrink-0 text-right">
                {maxed ? (
                  <span
                    className="text-xs font-black px-2 py-1 rounded-xl"
                    style={{ background: "hsl(var(--coin))", color: "hsl(258 40% 10%)" }}
                  >
                    МАКС
                  </span>
                ) : (
                  <span
                    className="text-sm font-black px-3 py-1 rounded-xl"
                    style={{
                      background: canAfford ? "hsl(var(--orange))" : "hsl(var(--muted))",
                      color: canAfford ? "hsl(258 40% 10%)" : "hsl(var(--muted-foreground))",
                    }}
                  >
                    🪙 {formatNum(cost)}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACHIEVEMENTS SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

function AchievementsScreen({ achievements, unlocked }: { achievements: Achievement[]; unlocked: number }) {
  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black" style={{ color: "hsl(var(--coin))" }}>🏆 Достижения</h2>
        <span className="stat-pill text-sm font-bold">{unlocked}/{achievements.length}</span>
      </div>

      <div className="game-card">
        <div className="text-sm font-bold text-muted-foreground mb-2">Прогресс</div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${(unlocked / achievements.length) * 100}%`,
              background: "linear-gradient(90deg, hsl(var(--coin)), hsl(var(--orange)))",
            }}
          />
        </div>
        <div className="text-right text-xs text-muted-foreground mt-1 font-semibold">
          {Math.round((unlocked / achievements.length) * 100)}% выполнено
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {achievements.map((a) => (
          <div key={a.id} className={`achieve-card ${a.unlocked ? "unlocked" : ""}`}>
            <span className={`text-3xl ${!a.unlocked ? "grayscale opacity-50" : ""}`}>{a.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className={`font-extrabold text-sm ${a.unlocked ? "" : "text-muted-foreground"}`}>{a.name}</div>
              <div className="text-xs text-muted-foreground">{a.desc}</div>
            </div>
            {a.unlocked && (
              <span
                className="shrink-0 text-xs font-black px-2 py-1 rounded-xl"
                style={{ background: "hsl(var(--coin))", color: "hsl(258 40% 10%)" }}
              >
                ✓
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

interface SettingsScreenProps {
  soundOn: boolean;
  animationsOn: boolean;
  onToggleSound: () => void;
  onToggleAnim: () => void;
  onReset: () => void;
  totalCoins: number;
  totalClicks: number;
}

function SettingsScreen({ soundOn, animationsOn, onToggleSound, onToggleAnim, onReset, totalCoins, totalClicks }: SettingsScreenProps) {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <h2 className="text-2xl font-black" style={{ color: "hsl(var(--cyan))" }}>⚙️ Настройки</h2>

      <div className="game-card">
        <div className="text-sm font-bold text-muted-foreground mb-3">Статистика</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="stat-pill">
            <div className="text-xs text-muted-foreground font-semibold">Всего монет</div>
            <div className="font-black text-lg" style={{ color: "hsl(var(--coin))" }}>{formatNum(totalCoins)}</div>
          </div>
          <div className="stat-pill">
            <div className="text-xs text-muted-foreground font-semibold">Всего кликов</div>
            <div className="font-black text-lg" style={{ color: "hsl(var(--green))" }}>{formatNum(totalClicks)}</div>
          </div>
        </div>
      </div>

      <div className="game-card flex flex-col gap-4">
        <div className="text-sm font-bold text-muted-foreground">Параметры</div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔊</span>
            <span className="font-bold text-sm">Звук</span>
          </div>
          <button
            onClick={onToggleSound}
            className="w-12 h-6 rounded-full transition-all duration-200 relative"
            style={{ background: soundOn ? "hsl(var(--green))" : "hsl(var(--muted))" }}
          >
            <div
              className="absolute top-1 w-4 h-4 rounded-full transition-all duration-200"
              style={{ background: "white", left: soundOn ? "26px" : "2px" }}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <span className="font-bold text-sm">Анимации</span>
          </div>
          <button
            onClick={onToggleAnim}
            className="w-12 h-6 rounded-full transition-all duration-200 relative"
            style={{ background: animationsOn ? "hsl(var(--green))" : "hsl(var(--muted))" }}
          >
            <div
              className="absolute top-1 w-4 h-4 rounded-full transition-all duration-200"
              style={{ background: "white", left: animationsOn ? "26px" : "2px" }}
            />
          </button>
        </div>
      </div>

      <div className="game-card">
        <div className="text-sm font-bold text-muted-foreground mb-3">Опасная зона</div>
        {!confirmReset ? (
          <button
            className="w-full py-3 rounded-2xl font-black text-sm transition-all"
            style={{
              background: "hsl(0 84% 60% / 0.15)",
              border: "2px solid hsl(0 84% 60% / 0.4)",
              color: "hsl(0 84% 70%)",
            }}
            onClick={() => setConfirmReset(true)}
          >
            🗑️ Сбросить прогресс
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-center font-bold" style={{ color: "hsl(0 84% 70%)" }}>
              Точно сбросить всё?
            </p>
            <div className="flex gap-2">
              <button
                className="flex-1 py-3 rounded-2xl font-black text-sm"
                style={{ background: "hsl(0 84% 60%)", color: "white" }}
                onClick={() => { onReset(); setConfirmReset(false); }}
              >
                Да, сбросить
              </button>
              <button
                className="flex-1 py-3 rounded-2xl font-black text-sm"
                style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
                onClick={() => setConfirmReset(false)}
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-muted-foreground font-semibold py-2">
        КликИмперия v1.0 · сделано с ❤️
      </div>
    </div>
  );
}
