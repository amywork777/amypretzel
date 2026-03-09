"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

interface Fish {
  name: string;
  img: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  points: number;
  width: number;
  height: number;
  filter?: string;
  biteWindow: number;
}

const FISH_TYPES: Fish[] = [
  { name: "wobbleblob", img: "/graphics/jellyfish.png", rarity: "common", points: 10, width: 50, height: 50, biteWindow: 2500 },
  { name: "pond skipper", img: "/graphics/fish.png", rarity: "common", points: 15, width: 45, height: 45, biteWindow: 2500 },
  { name: "blossom drifter", img: "/graphics/jellyfish.png", rarity: "common", points: 12, width: 50, height: 50, filter: "hue-rotate(280deg) saturate(1.3)", biteWindow: 2500 },
  { name: "mossback minnow", img: "/graphics/fish.png", rarity: "common", points: 18, width: 45, height: 45, filter: "hue-rotate(90deg) saturate(1.2)", biteWindow: 2300 },
  { name: "marmalade koi", img: "/graphics/goldfish.png", rarity: "uncommon", points: 25, width: 45, height: 30, biteWindow: 1800 },
  { name: "lemon dart", img: "/graphics/yellowtang.png", rarity: "uncommon", points: 30, width: 50, height: 30, biteWindow: 1800 },
  { name: "peach sorbet", img: "/graphics/goldfish.png", rarity: "uncommon", points: 28, width: 45, height: 30, filter: "hue-rotate(330deg) saturate(1.4)", biteWindow: 1700 },
  { name: "lavender fin", img: "/graphics/yellowtang.png", rarity: "uncommon", points: 35, width: 50, height: 30, filter: "hue-rotate(240deg) saturate(1.3)", biteWindow: 1600 },
  { name: "moonstripe", img: "/graphics/angelfish.png", rarity: "rare", points: 50, width: 45, height: 35, biteWindow: 1200 },
  { name: "ember veil", img: "/graphics/angelfish.png", rarity: "rare", points: 60, width: 45, height: 35, filter: "hue-rotate(30deg) saturate(1.5)", biteWindow: 1100 },
  { name: "sun sovereign", img: "/graphics/jellyfish.png", rarity: "legendary", points: 100, width: 50, height: 50, filter: "hue-rotate(15deg) saturate(2) brightness(1.2)", biteWindow: 700 },
  { name: "ghost phantom", img: "/graphics/angelfish.png", rarity: "legendary", points: 150, width: 45, height: 35, filter: "hue-rotate(160deg) saturate(1.8) brightness(1.15)", biteWindow: 600 },
];

const RARITY_COLORS: Record<string, string> = {
  common: "#a0c8b8",
  uncommon: "#c0a0d8",
  rare: "#f0b8c0",
  legendary: "#f0d060",
};

const CATCH_REACTIONS = ["yay!", "nice!", "got it!", "wooo!", "hehe~"];
const RARE_REACTIONS = ["ooh!", "wow!!", "no way!", "amazing!"];
const MISS_REACTIONS = ["nooo...", "aw man", "so close!", "next time!"];
const IDLE_REACTIONS = ["hmm...", "...", "~"];

const ACHIEVEMENTS = [
  { count: 1, msg: "first catch!" },
  { count: 5, msg: "5 fish! nice~" },
  { count: 10, msg: "10 fish! pro angler" },
  { count: 25, msg: "25 fish! obsessed" },
  { count: 50, msg: "50 fish! legendary" },
];

type GameState = "idle" | "casting" | "waiting" | "bite" | "reeling" | "caught" | "missed";

function pickFish(): Fish {
  const roll = Math.random();
  if (roll < 0.05) return FISH_TYPES[10 + Math.floor(Math.random() * 2)];
  if (roll < 0.18) return FISH_TYPES[8 + Math.floor(Math.random() * 2)];
  if (roll < 0.45) return FISH_TYPES[4 + Math.floor(Math.random() * 4)];
  return FISH_TYPES[Math.floor(Math.random() * 4)];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const LIFE_QUOTES = [
  "everything you need is already within you",
  "growth is not linear and that's okay",
  "you don't have to have it all figured out",
  "the best time to start is now",
  "be gentle with yourself today",
  "your pace is not behind, it's yours",
  "rest is not giving up, it's recharging",
  "you are more capable than you think",
  "comparison is the thief of joy",
  "it's okay to change direction",
  "small consistent steps move mountains",
  "you are allowed to take up space",
  "not everything that weighs you down is yours to carry",
  "progress looks different for everyone",
  "your worth is not measured by your productivity",
  "the things that make you different make you beautiful",
  "it's okay to outgrow people, places, and things",
  "you are exactly where you need to be",
  "sometimes the bravest thing is asking for help",
  "there is no wrong way to feel",
  "you don't need permission to be yourself",
  "every ending is also a beginning",
  "the hard days make the good days better",
  "you are someone's reason to smile",
  "let go of what you can't control",
];

// Sound effects
function playSound(type: "cast" | "catch" | "miss" | "legendary") {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "cast") {
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === "catch") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === "legendary") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.08);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.16);
      osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.24);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } else {
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {}
}

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

export default function FishingGame() {
  const [state, setState] = useState<GameState>("idle");
  const [currentFish, setCurrentFish] = useState<Fish | null>(null);
  const [caught, setCaught] = useState<Fish[]>([]);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("click the pond to cast!");
  const [bobberY, setBobberY] = useState(0);
  const [fishX, setFishX] = useState(-80);
  const [showSplash, setShowSplash] = useState(false);
  const [speechBubble, setSpeechBubble] = useState("");
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [achievement, setAchievement] = useState("");
  const [quote, setQuote] = useState(() => pick(LIFE_QUOTES));
  const [quoteFade, setQuoteFade] = useState(true);
  const [bgFishTime, setBgFishTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const biteTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const animRef = useRef<number>(0);
  const speechTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const idleTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Show speech bubble
  const showSpeech = useCallback((text: string, duration = 1500) => {
    clearTimeout(speechTimerRef.current);
    setSpeechBubble(text);
    speechTimerRef.current = setTimeout(() => setSpeechBubble(""), duration);
  }, []);

  // Show achievement toast
  const showAchievement = useCallback((msg: string) => {
    setAchievement(msg);
    setTimeout(() => setAchievement(""), 2500);
  }, []);

  // Spawn sparkles for rare catches
  const spawnSparkles = useCallback((count: number) => {
    const newSparkles: Sparkle[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: 30 + Math.random() * 40,
      y: 20 + Math.random() * 40,
      size: 6 + Math.random() * 10,
      delay: Math.random() * 0.3,
    }));
    setSparkles(newSparkles);
    setTimeout(() => setSparkles([]), 1500);
  }, []);

  // Shuffle and cycle motivational quotes
  const shuffledQuotes = useRef<string[]>([]);
  const quoteIndex = useRef(0);
  useEffect(() => {
    // Fisher-Yates shuffle
    shuffledQuotes.current = [...LIFE_QUOTES].sort(() => Math.random() - 0.5);
    quoteIndex.current = 0;
    setQuote(shuffledQuotes.current[0]);

    const interval = setInterval(() => {
      setQuoteFade(false);
      setTimeout(() => {
        quoteIndex.current = (quoteIndex.current + 1) % shuffledQuotes.current.length;
        if (quoteIndex.current === 0) {
          shuffledQuotes.current = [...LIFE_QUOTES].sort(() => Math.random() - 0.5);
        }
        setQuote(shuffledQuotes.current[quoteIndex.current]);
        setQuoteFade(true);
      }, 500);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Idle speech bubbles
  useEffect(() => {
    if (state === "waiting") {
      idleTimerRef.current = setInterval(() => {
        if (Math.random() < 0.3) showSpeech(pick(IDLE_REACTIONS), 1200);
      }, 3500);
      return () => clearInterval(idleTimerRef.current);
    }
  }, [state, showSpeech]);

  // Background fish animation
  useEffect(() => {
    let t = 0;
    const animate = () => {
      t += 0.01;
      setBgFishTime(t);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Bobber animation (override animRef only when needed)
  const bobberAnimRef = useRef<number>(0);
  useEffect(() => {
    if (state !== "waiting" && state !== "bite") return;
    let t = 0;
    const animate = () => {
      t += 0.05;
      setBobberY(state === "bite" ? Math.sin(t * 8) * 6 + 4 : Math.sin(t * 2) * 2);
      bobberAnimRef.current = requestAnimationFrame(animate);
    };
    bobberAnimRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(bobberAnimRef.current);
  }, [state]);

  // Fish swimming in on bite
  const fishAnimRef = useRef<number>(0);
  useEffect(() => {
    if (state !== "bite" && state !== "reeling") { setFishX(-80); return; }
    if (state === "bite") {
      let x = -80;
      const swim = () => {
        x += 3;
        if (x > 20) x = 20;
        setFishX(x);
        if (x < 20) fishAnimRef.current = requestAnimationFrame(swim);
      };
      fishAnimRef.current = requestAnimationFrame(swim);
      return () => cancelAnimationFrame(fishAnimRef.current);
    }
  }, [state]);

  const cast = useCallback(() => {
    if (state !== "idle" && state !== "caught" && state !== "missed") return;
    playSound("cast");
    setState("casting");
    setMessage("casting...");
    setShowSplash(true);
    setTimeout(() => setShowSplash(false), 400);

    setTimeout(() => {
      setState("waiting");
      setMessage("waiting for a bite...");

      const waitTime = 1500 + Math.random() * 3000;
      timerRef.current = setTimeout(() => {
        const fish = pickFish();
        setCurrentFish(fish);
        setState("bite");
        setMessage("!! reel it in!");
        showSpeech("!", 800);

        biteTimerRef.current = setTimeout(() => {
          setState("missed");
          playSound("miss");
          setMessage("the " + fish.name + " got away!");
          showSpeech(pick(MISS_REACTIONS));
          setCurrentFish(null);
        }, fish.biteWindow);
      }, waitTime);
    }, 600);
  }, [state, showSpeech]);

  const reel = useCallback(() => {
    if (state !== "bite" || !currentFish) return;
    clearTimeout(biteTimerRef.current);
    setState("reeling");
    setMessage("reeling in...");

    setTimeout(() => {
      setState("caught");
      const newCaught = [...caught, currentFish];
      setCaught(newCaught);
      setScore((s) => s + currentFish.points);
      setMessage(`${currentFish.name}! +${currentFish.points} pts`);

      if (currentFish.rarity === "legendary") {
        playSound("legendary");
        showSpeech(pick(RARE_REACTIONS), 2000);
        spawnSparkles(16);
      } else if (currentFish.rarity === "rare") {
        playSound("catch");
        showSpeech(pick(RARE_REACTIONS));
        spawnSparkles(8);
      } else {
        playSound("catch");
        showSpeech(pick(CATCH_REACTIONS));
      }

      // Check achievements
      const total = newCaught.length;
      const ach = ACHIEVEMENTS.find((a) => a.count === total);
      if (ach) showAchievement(ach.msg);

      // First legendary
      if (currentFish.rarity === "legendary" && newCaught.filter((f) => f.rarity === "legendary").length === 1) {
        setTimeout(() => showAchievement("first legendary catch!!"), 1500);
      }
    }, 500);
  }, [state, currentFish, caught, showSpeech, spawnSparkles, showAchievement]);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(biteTimerRef.current);
      clearTimeout(speechTimerRef.current);
      clearInterval(idleTimerRef.current);
    };
  }, []);

  const canCast = state === "idle" || state === "caught" || state === "missed";
  const canReel = state === "bite";

  const uniqueCaught = FISH_TYPES.map((ft) => ({
    ...ft,
    count: caught.filter((c) => c.name === ft.name).length,
  }));

  // Background fish positions
  const bgFish1X = (Math.sin(bgFishTime * 0.7) * 0.5 + 0.5) * 35 + 5;
  const bgFish1Y = Math.sin(bgFishTime * 0.3) * 3 + 68;
  const bgFish2X = (Math.sin(bgFishTime * 0.5 + 2) * 0.5 + 0.5) * 30 + 10;
  const bgFish2Y = Math.sin(bgFishTime * 0.4 + 1) * 2 + 78;
  const bgFish3X = (Math.sin(bgFishTime * 0.6 + 4) * 0.5 + 0.5) * 25 + 15;
  const bgFish3Y = Math.sin(bgFishTime * 0.35 + 3) * 2 + 85;

  // Butterfly positions
  const bf1X = Math.sin(bgFishTime * 0.8) * 15 + 20;
  const bf1Y = Math.sin(bgFishTime * 1.2) * 8 + 15;
  const bf2X = Math.sin(bgFishTime * 0.6 + 3) * 12 + 55;
  const bf2Y = Math.sin(bgFishTime * 0.9 + 1) * 6 + 10;

  // Lily pad bob
  const lilyBob1 = Math.sin(bgFishTime * 1.5) * 1.5;
  const lilyBob2 = Math.sin(bgFishTime * 1.2 + 2) * 1.5;

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="bg-aero-fixed" />
      {/* decorative clouds */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/graphics/cloud1.png" alt="" width={200} height={118}
          className="absolute top-[2%] left-[0%] animate-drift opacity-80" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/graphics/cloud2.png" alt="" width={160} height={67}
          className="absolute top-[1%] right-[3%] animate-drift opacity-75" style={{ animationDelay: "3s" }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/graphics/cloud3.png" alt="" width={120} height={71}
          className="absolute top-[8%] left-[30%] animate-drift opacity-55" style={{ animationDelay: "7s" }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/graphics/cloud4.png" alt="" width={140} height={60}
          className="absolute top-[5%] right-[22%] animate-drift opacity-60" style={{ animationDelay: "5s" }} />
        <div className="absolute top-[10%] left-[25%] w-2.5 h-2.5 bg-white rounded-full animate-sparkle opacity-60" style={{ boxShadow: "0 0 10px 3px rgba(255,255,255,0.5)" }} />
        <div className="absolute top-[20%] right-[15%] w-2 h-2 bg-white rounded-full animate-sparkle opacity-45" style={{ boxShadow: "0 0 8px 3px rgba(255,255,255,0.4)", animationDelay: "1.5s" }} />
      </div>

      {/* back button */}
      <div className="fixed top-3 left-3 z-30">
        <Link href="/" className="btn-glossy px-3 py-1.5 text-[10px] font-bold text-[#8a6080] tracking-wide inline-block">
          back
        </Link>
      </div>

      {/* score */}
      <div className="fixed top-3 right-3 z-30">
        <div className="font-pixel text-[11px] text-[#7a5a8a] bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-[#e8d0e0]">
          {score} pts
        </div>
      </div>

      {/* achievement toast */}
      {achievement && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-40 animate-fade-up">
          <div className="font-pixel text-[11px] text-[#f0d060] bg-[#3a2a4a]/90 backdrop-blur-sm px-4 py-2 rounded-full border border-[#f0d060]/40 whitespace-nowrap">
            {achievement}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center p-4 pb-8 relative z-10">
        <h1 className="font-pixel text-lg text-[#7a5a8a] mb-4 animate-scale-in">fishing pond</h1>

        {/* pond scene */}
        <div
          className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer window-frame"
          onClick={() => { if (canCast) cast(); else if (canReel) reel(); }}
        >
          {/* sky */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#c8e0f8] via-[#d0d8f0] to-[#a8d0e8]" style={{ height: "55%" }} />

          {/* sun with rays */}
          <div className="absolute top-[4%] left-[6%] z-[1]">
            <div
              className="w-10 h-10 rounded-full"
              style={{
                background: "radial-gradient(circle, #fff8e0 30%, #f8e8a0 60%, transparent 70%)",
                boxShadow: "0 0 20px 8px rgba(255,240,160,0.4), 0 0 40px 16px rgba(255,220,100,0.15)",
                animation: "rayPulse 5s ease-in-out infinite alternate",
              }}
            />
          </div>

          {/* water */}
          <div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-[#a0d0e8] via-[#90c0d8] to-[#78a8c8]"
            style={{ height: "48%", top: "52%" }}
          >
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-[10%] left-[10%] w-[80%] h-[2px] bg-white/40 rounded-full" />
              <div className="absolute top-[30%] left-[20%] w-[60%] h-[2px] bg-white/30 rounded-full" />
              <div className="absolute top-[55%] left-[5%] w-[70%] h-[2px] bg-white/25 rounded-full" />
              <div className="absolute top-[75%] left-[15%] w-[50%] h-[2px] bg-white/20 rounded-full" />
            </div>
            <div className="absolute bottom-0 left-[8%] w-3 h-12 bg-[#80b8a0] rounded-t-full opacity-40" />
            <div className="absolute bottom-0 left-[11%] w-2.5 h-10 bg-[#90c8a8] rounded-t-full opacity-35" />
            <div className="absolute bottom-0 left-[45%] w-2.5 h-11 bg-[#88c0a8] rounded-t-full opacity-35" />
          </div>

          {/* background fish swimming lazily */}
          <div className="absolute z-[2] opacity-25 pointer-events-none"
            style={{ left: `${bgFish1X}%`, top: `${bgFish1Y}%`, transition: "left 1s ease, top 1s ease" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/graphics/goldfish.png" alt="" width={25} height={17}
              style={{ transform: Math.sin(bgFishTime * 0.7) > 0 ? "scaleX(1)" : "scaleX(-1)" }} />
          </div>
          <div className="absolute z-[2] opacity-20 pointer-events-none"
            style={{ left: `${bgFish2X}%`, top: `${bgFish2Y}%`, transition: "left 1s ease, top 1s ease" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/graphics/fish.png" alt="" width={20} height={20}
              style={{ transform: Math.sin(bgFishTime * 0.5 + 2) > 0 ? "scaleX(1)" : "scaleX(-1)", filter: "hue-rotate(40deg)" }} />
          </div>
          <div className="absolute z-[2] opacity-15 pointer-events-none"
            style={{ left: `${bgFish3X}%`, top: `${bgFish3Y}%`, transition: "left 1s ease, top 1s ease" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/graphics/yellowtang.png" alt="" width={22} height={14}
              style={{ transform: Math.sin(bgFishTime * 0.6 + 4) > 0 ? "scaleX(1)" : "scaleX(-1)" }} />
          </div>

          {/* grassy bank */}
          <div
            className="absolute right-0 bottom-0 z-[5]"
            style={{
              width: "40%", height: "52%",
              background: "linear-gradient(180deg, #a8d8a8 0%, #90c898 20%, #80b888 100%)",
              borderTopLeftRadius: "40% 15%",
            }}
          >
            <div className="absolute top-[8%] left-[15%] w-1.5 h-3 bg-[#98d098] rounded-full opacity-60" />
            <div className="absolute top-[5%] left-[30%] w-1 h-2.5 bg-[#a0d8a0] rounded-full opacity-50" />
            <div className="absolute top-[10%] left-[50%] w-1.5 h-2 bg-[#90c890] rounded-full opacity-55" />
            <div className="absolute top-[3%] left-[70%] w-1 h-3 bg-[#98d098] rounded-full opacity-45" />
            {/* flowers scattered across grass */}
            <div className="absolute top-[6%] left-[20%] text-[12px] text-[#f0a0b8]">&#10047;</div>
            <div className="absolute top-[14%] left-[45%] text-[10px] text-[#e8b0d0]">&#10047;</div>
            <div className="absolute top-[4%] left-[70%] text-[14px] text-[#f8c8a8]">&#10047;</div>
            <div className="absolute top-[20%] left-[80%] text-[11px] text-[#c8b0e8]">&#10047;</div>
            <div className="absolute top-[10%] left-[55%] text-[9px] text-[#f0d0a0]">&#10047;</div>
            <div className="absolute top-[22%] left-[30%] text-[13px] text-[#f0b8c8]">&#10047;</div>
            <div className="absolute top-[16%] left-[90%] text-[10px] text-[#d0c0f0]">&#10047;</div>
            <div className="absolute top-[28%] left-[60%] text-[8px] text-[#f0c0b0]">&#10047;</div>
            <div className="absolute top-[35%] left-[25%] text-[11px] text-[#e8a0c0]">&#10047;</div>
            <div className="absolute top-[42%] left-[70%] text-[13px] text-[#f0b8d0]">&#10047;</div>
            <div className="absolute top-[38%] left-[50%] text-[9px] text-[#d8c0e8]">&#10047;</div>
            <div className="absolute top-[50%] left-[35%] text-[12px] text-[#f8c0a8]">&#10047;</div>
            <div className="absolute top-[48%] left-[85%] text-[10px] text-[#e0a8d0]">&#10047;</div>
            <div className="absolute top-[56%] left-[60%] text-[14px] text-[#f0a8b8]">&#10047;</div>
            <div className="absolute top-[62%] left-[40%] text-[10px] text-[#c8b8e8]">&#10047;</div>
            <div className="absolute top-[58%] left-[80%] text-[11px] text-[#f0d0b0]">&#10047;</div>
            <div className="absolute top-[70%] left-[25%] text-[13px] text-[#e8b0c8]">&#10047;</div>
            <div className="absolute top-[68%] left-[65%] text-[9px] text-[#f0c8d0]">&#10047;</div>
            <div className="absolute top-[75%] left-[50%] text-[12px] text-[#d0b8e0]">&#10047;</div>
            <div className="absolute top-[80%] left-[75%] text-[10px] text-[#f8b8a8]">&#10047;</div>
            <div className="absolute top-[85%] left-[35%] text-[11px] text-[#e0c0d8]">&#10047;</div>
          </div>

          {/* dock */}
          <div className="absolute z-[6]" style={{ right: "10%", top: "48%", width: "35%", height: "6%" }}>
            <div className="absolute inset-0 bg-[#d4b896] rounded-l-sm border-t-2 border-l-2 border-[#e0c8a8] border-b-2 border-b-[#b89870]" />
            <div className="absolute top-0 left-[25%] w-[1px] h-full bg-[#c8a880] opacity-50" />
            <div className="absolute top-0 left-[50%] w-[1px] h-full bg-[#c8a880] opacity-50" />
            <div className="absolute top-0 left-[75%] w-[1px] h-full bg-[#c8a880] opacity-50" />
            <div className="absolute -bottom-4 left-[5%] w-2 h-6 bg-[#c8a070] rounded-b-sm" />
            <div className="absolute -bottom-4 left-[48%] w-2 h-6 bg-[#c8a070] rounded-b-sm" />
          </div>

          {/* clouds in scene */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/graphics/cloud5.png" alt="" width={70} height={42}
            className="absolute top-[3%] right-[5%] opacity-50" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/graphics/cloud1.png" alt="" width={90} height={53}
            className="absolute top-[8%] left-[3%] opacity-45 animate-drift" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/graphics/cloud3.png" alt="" width={60} height={36}
            className="absolute top-[15%] left-[40%] opacity-35 animate-drift" style={{ animationDelay: "4s" }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/graphics/cloud4.png" alt="" width={55} height={23}
            className="absolute top-[6%] left-[55%] opacity-40 animate-drift" style={{ animationDelay: "8s" }} />

          {/* amy fishing */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/graphics/amy-fishing.png" alt="amy fishing" width={90} height={119}
            className="absolute z-[8] drop-shadow-md"
            style={{
              right: "28%", top: "calc(48% - 90px)",
              transform: state === "bite" ? "translateY(-2px)" : "translateY(0)",
              transition: "transform 0.2s ease",
            }}
          />

          {/* speech bubble (reactions) */}
          {speechBubble && (
            <div className="absolute z-[12] animate-fade-up"
              style={{ right: "24%", top: "calc(48% - 108px)" }}>
              <div className="relative bg-white/90 rounded-lg px-2 py-0.5 font-pixel text-[9px] text-[#7a5a8a] border border-[#e8d0e0] whitespace-nowrap">
                {speechBubble}
                {/* speech triangle pointing down-right toward her head */}
                <div className="absolute -bottom-1.5 right-3 w-0 h-0"
                  style={{ borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: "6px solid rgba(255,255,255,0.9)" }} />
                <div className="absolute -bottom-[5px] right-[13px] w-0 h-0"
                  style={{ borderLeft: "3px solid transparent", borderRight: "3px solid transparent", borderTop: "5px solid #e8d0e0" }} />
              </div>
            </div>
          )}

          {/* thought bubble (motivational quotes) — cloud shape, no trailing dots */}
          <div className="absolute z-[11]" style={{ right: "40%", top: "calc(48% - 120px)" }}>
            <svg
              className="absolute"
              width="150" height="50" viewBox="0 0 150 50"
              style={{
                opacity: quoteFade ? 1 : 0,
                transition: "opacity 0.5s ease",
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.05))",
              }}
            >
              <path
                d="M20,40 C8,40 2,34 2,26 C2,20 6,15 12,14 C10,10 12,4 20,3 C26,2 30,5 32,8 C36,3 44,0 52,2 C58,3 62,7 63,12 C68,8 78,6 86,9 C92,11 96,16 96,22 C102,18 112,17 120,20 C128,23 134,28 134,34 C134,38 130,42 124,43 C120,46 112,48 104,46 C98,48 88,48 80,46 C72,48 62,48 54,46 C46,48 36,47 28,44 C24,43 21,42 20,40 Z"
                fill="rgba(255,255,255,0.9)"
                stroke="#e8d0e0"
                strokeWidth="1"
              />
            </svg>
            <div
              className="relative px-3 py-1 max-w-[140px]"
              style={{
                opacity: quoteFade ? 1 : 0,
                transition: "opacity 0.5s ease",
                top: "4px",
                left: "5px",
              }}
            >
              <p className="font-pixel text-[8px] text-[#b090b8] leading-relaxed text-center italic">
                {quote}
              </p>
            </div>
          </div>

          {/* bobber */}
          {state !== "idle" && state !== "casting" && (
            <div className="absolute z-10" style={{
              left: "25%", top: "56%",
              transform: `translateY(${bobberY}px)`,
              transition: state === "bite" ? "none" : "transform 0.1s",
            }}>
              <div className="w-3 h-3 rounded-full bg-[#f08080] border border-white/60"
                style={{ boxShadow: state === "bite" ? "0 0 8px rgba(240,128,128,0.6)" : "0 2px 4px rgba(0,0,0,0.1)" }} />
              <div className="absolute -left-1 top-1/2 w-5 h-[2px] bg-white/30 rounded-full" />
            </div>
          )}

          {/* splash */}
          {showSplash && (
            <div className="absolute top-[54%] left-[23%] z-10">
              <div className="w-8 h-3 bg-white/40 rounded-full animate-ping" />
            </div>
          )}

          {/* fish on bite */}
          {(state === "bite" || state === "reeling") && currentFish && (
            <div className="absolute top-[62%] z-10" style={{
              left: `calc(20% + ${fishX}px)`,
              transform: state === "reeling" ? "scale(1.2) translateY(-10px)" : "scale(1)",
              transition: state === "reeling" ? "all 0.3s ease" : "none",
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={currentFish.img} alt={currentFish.name}
                width={currentFish.width} height={currentFish.height}
                style={{ filter: currentFish.filter }} />
            </div>
          )}

          {/* catch sparkles */}
          {sparkles.map((s) => (
            <div key={s.id} className="absolute z-[25] animate-sparkle pointer-events-none"
              style={{ left: `${s.x}%`, top: `${s.y}%`, animationDelay: `${s.delay}s` }}>
              <div style={{
                width: s.size, height: s.size,
                background: "white",
                clipPath: "polygon(50% 0%, 58% 38%, 100% 50%, 58% 62%, 50% 100%, 42% 62%, 0% 50%, 42% 38%)",
                filter: "drop-shadow(0 0 4px rgba(255,255,255,0.8))",
              }} />
            </div>
          ))}

          {/* caught overlay */}
          {state === "caught" && currentFish && (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/10">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 text-center animate-scale-in border-2 border-[#e8d0e0]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={currentFish.img} alt={currentFish.name}
                  width={currentFish.width * 1.5} height={currentFish.height * 1.5}
                  className="mx-auto mb-2" style={{ filter: currentFish.filter }} />
                <p className="font-pixel text-[12px] text-[#7a5a8a]">{currentFish.name}!</p>
                <p className="font-pixel text-[10px] mt-1" style={{ color: RARITY_COLORS[currentFish.rarity] }}>
                  {currentFish.rarity} &middot; +{currentFish.points} pts
                </p>
              </div>
            </div>
          )}

          {/* missed overlay */}
          {state === "missed" && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl px-5 py-3 text-center animate-scale-in border-2 border-[#e8d0e0]">
                <p className="font-pixel text-[12px] text-[#b080a0]">it got away...</p>
              </div>
            </div>
          )}

          {/* bite alert */}
          {state === "bite" && (
            <div className="absolute top-[10%] right-[35%] z-20 animate-bounce">
              <div className="font-pixel text-2xl text-[#f08080] drop-shadow-md">!</div>
            </div>
          )}
        </div>

        {/* message */}
        <p className="font-pixel text-[11px] text-[#8a6080] mt-4 text-center min-h-[2em]">{message}</p>


        {/* buttons */}
        <div className="flex gap-3 mt-3">
          <button onClick={cast} disabled={!canCast}
            className={`btn-glossy px-5 py-2 text-[11px] font-bold text-[#8a6080] tracking-wide ${!canCast ? "opacity-40 cursor-not-allowed" : ""}`}>
            cast
          </button>
          <button onClick={reel} disabled={!canReel}
            className={`btn-glossy px-5 py-2 text-[11px] font-bold tracking-wide ${canReel ? "text-[#f08080] animate-pulse border-[#f0b0b0]" : "text-[#8a6080] opacity-40 cursor-not-allowed"}`}>
            reel!
          </button>
        </div>

        {/* collection */}
        {caught.length > 0 && (
          <div className="mt-6 w-full max-w-sm">
            <h2 className="font-pixel text-[11px] text-[#7a5a8a] mb-2 text-center">
              collection ({caught.length} caught)
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              {uniqueCaught.filter((f) => f.count > 0).map((f) => (
                <div key={f.name}
                  className="bg-white/60 backdrop-blur-sm rounded-lg p-2 border border-[#e8d0e0] text-center min-w-[70px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.img} alt={f.name}
                    width={f.width * 0.7} height={f.height * 0.7}
                    className="mx-auto mb-1" style={{ filter: f.filter }} />
                  <p className="font-pixel text-[8px] text-[#8a6080]">{f.name}</p>
                  <p className="font-pixel text-[8px]" style={{ color: RARITY_COLORS[f.rarity] }}>x{f.count}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
