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
  biteWindow: number; // ms to react before fish escapes
}

const FISH_TYPES: Fish[] = [
  // common — 2.5s to react
  { name: "wobbleblob", img: "/graphics/jellyfish.png", rarity: "common", points: 10, width: 50, height: 50, biteWindow: 2500 },
  { name: "pond skipper", img: "/graphics/fish.png", rarity: "common", points: 15, width: 45, height: 45, biteWindow: 2500 },
  { name: "blossom drifter", img: "/graphics/jellyfish.png", rarity: "common", points: 12, width: 50, height: 50, filter: "hue-rotate(280deg) saturate(1.3)", biteWindow: 2500 },
  { name: "mossback minnow", img: "/graphics/fish.png", rarity: "common", points: 18, width: 45, height: 45, filter: "hue-rotate(90deg) saturate(1.2)", biteWindow: 2300 },
  // uncommon — 1.8s to react
  { name: "marmalade koi", img: "/graphics/goldfish.png", rarity: "uncommon", points: 25, width: 45, height: 30, biteWindow: 1800 },
  { name: "lemon dart", img: "/graphics/yellowtang.png", rarity: "uncommon", points: 30, width: 50, height: 30, biteWindow: 1800 },
  { name: "peach sorbet", img: "/graphics/goldfish.png", rarity: "uncommon", points: 28, width: 45, height: 30, filter: "hue-rotate(330deg) saturate(1.4)", biteWindow: 1700 },
  { name: "lavender fin", img: "/graphics/yellowtang.png", rarity: "uncommon", points: 35, width: 50, height: 30, filter: "hue-rotate(240deg) saturate(1.3)", biteWindow: 1600 },
  // rare — 1.2s to react
  { name: "moonstripe", img: "/graphics/angelfish.png", rarity: "rare", points: 50, width: 45, height: 35, biteWindow: 1200 },
  { name: "ember veil", img: "/graphics/angelfish.png", rarity: "rare", points: 60, width: 45, height: 35, filter: "hue-rotate(30deg) saturate(1.5)", biteWindow: 1100 },
  // legendary — 0.7s to react!
  { name: "sun sovereign", img: "/graphics/jellyfish.png", rarity: "legendary", points: 100, width: 50, height: 50, filter: "hue-rotate(15deg) saturate(2) brightness(1.2)", biteWindow: 700 },
  { name: "ghost phantom", img: "/graphics/angelfish.png", rarity: "legendary", points: 150, width: 45, height: 35, filter: "hue-rotate(160deg) saturate(1.8) brightness(1.15)", biteWindow: 600 },
];

const RARITY_COLORS: Record<string, string> = {
  common: "#a0c8b8",
  uncommon: "#c0a0d8",
  rare: "#f0b8c0",
  legendary: "#f0d060",
};

type GameState = "idle" | "casting" | "waiting" | "bite" | "reeling" | "caught" | "missed";

function pickFish(): Fish {
  const roll = Math.random();
  if (roll < 0.05) return FISH_TYPES[10 + Math.floor(Math.random() * 2)]; // legendary (5%)
  if (roll < 0.18) return FISH_TYPES[8 + Math.floor(Math.random() * 2)]; // rare (13%)
  if (roll < 0.45) return FISH_TYPES[4 + Math.floor(Math.random() * 4)]; // uncommon (27%)
  return FISH_TYPES[Math.floor(Math.random() * 4)]; // common (55%)
}

export default function FishingGame() {
  const [state, setState] = useState<GameState>("idle");
  const [currentFish, setCurrentFish] = useState<Fish | null>(null);
  const [caught, setCaught] = useState<Fish[]>([]);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("click the pond to cast your line!");
  const [bobberY, setBobberY] = useState(0);
  const [fishX, setFishX] = useState(-80);
  const [showSplash, setShowSplash] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const biteTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const animRef = useRef<number>(0);

  // Bobber animation
  useEffect(() => {
    if (state !== "waiting" && state !== "bite") return;
    let t = 0;
    const animate = () => {
      t += 0.05;
      if (state === "bite") {
        setBobberY(Math.sin(t * 8) * 6 + 4);
      } else {
        setBobberY(Math.sin(t * 2) * 2);
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [state]);

  // Fish swimming in on bite
  useEffect(() => {
    if (state !== "bite" && state !== "reeling") {
      setFishX(-80);
      return;
    }
    if (state === "bite") {
      let x = -80;
      const swim = () => {
        x += 3;
        if (x > 20) x = 20;
        setFishX(x);
        if (x < 20) animRef.current = requestAnimationFrame(swim);
      };
      animRef.current = requestAnimationFrame(swim);
      return () => cancelAnimationFrame(animRef.current);
    }
  }, [state]);

  const cast = useCallback(() => {
    if (state !== "idle" && state !== "caught" && state !== "missed") return;

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
        setMessage("!! a fish is biting! click reel!");

        // Miss window — rarer fish escape faster
        biteTimerRef.current = setTimeout(() => {
          setState("missed");
          setMessage("too slow... the " + fish.name + " got away!");
          setCurrentFish(null);
        }, fish.biteWindow);
      }, waitTime);
    }, 600);
  }, [state]);

  const reel = useCallback(() => {
    if (state !== "bite" || !currentFish) return;
    clearTimeout(biteTimerRef.current);

    setState("reeling");
    setMessage(`reeling in...`);

    setTimeout(() => {
      setState("caught");
      setCaught((prev) => [...prev, currentFish]);
      setScore((s) => s + currentFish.points);
      setMessage(`you caught a ${currentFish.name}! +${currentFish.points} pts`);
    }, 500);
  }, [state, currentFish]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(biteTimerRef.current);
    };
  }, []);

  const canCast = state === "idle" || state === "caught" || state === "missed";
  const canReel = state === "bite";

  // Count unique fish caught
  const uniqueCaught = FISH_TYPES.map((ft) => ({
    ...ft,
    count: caught.filter((c) => c.name === ft.name).length,
  }));

  return (
    <div className="bg-aero h-screen flex flex-col overflow-hidden relative">
      {/* decorative clouds — same as main site */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
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

        {/* sparkles */}
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

      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
        {/* title */}
        <h1 className="font-pixel text-lg text-[#7a5a8a] mb-4 animate-scale-in">fishing pond</h1>

        {/* pond scene */}
        <div
          className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer window-frame"
          onClick={() => {
            if (canCast) cast();
            else if (canReel) reel();
          }}
        >
          {/* sky */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#c8e0f8] via-[#d0d8f0] to-[#a8d0e8]" style={{ height: "55%" }} />

          {/* water */}
          <div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-[#a0d0e8] via-[#90c0d8] to-[#78a8c8]"
            style={{ height: "48%", top: "52%" }}
          >
            {/* water shimmer */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-[10%] left-[10%] w-[80%] h-[2px] bg-white/40 rounded-full" />
              <div className="absolute top-[30%] left-[20%] w-[60%] h-[2px] bg-white/30 rounded-full" />
              <div className="absolute top-[55%] left-[5%] w-[70%] h-[2px] bg-white/25 rounded-full" />
              <div className="absolute top-[75%] left-[15%] w-[50%] h-[2px] bg-white/20 rounded-full" />
            </div>

            {/* underwater plants */}
            <div className="absolute bottom-0 left-[8%] w-3 h-12 bg-[#80b8a0] rounded-t-full opacity-40" />
            <div className="absolute bottom-0 left-[11%] w-2.5 h-10 bg-[#90c8a8] rounded-t-full opacity-35" />
            <div className="absolute bottom-0 left-[45%] w-2.5 h-11 bg-[#88c0a8] rounded-t-full opacity-35" />
          </div>

          {/* grassy bank on right side */}
          <div
            className="absolute right-0 bottom-0 z-[5]"
            style={{
              width: "40%",
              height: "52%",
              background: "linear-gradient(180deg, #a8d8a8 0%, #90c898 20%, #80b888 100%)",
              borderTopLeftRadius: "40% 15%",
            }}
          >
            {/* grass texture dots */}
            <div className="absolute top-[8%] left-[15%] w-1.5 h-3 bg-[#98d098] rounded-full opacity-60" />
            <div className="absolute top-[5%] left-[30%] w-1 h-2.5 bg-[#a0d8a0] rounded-full opacity-50" />
            <div className="absolute top-[10%] left-[50%] w-1.5 h-2 bg-[#90c890] rounded-full opacity-55" />
            <div className="absolute top-[3%] left-[70%] w-1 h-3 bg-[#98d098] rounded-full opacity-45" />
          </div>

          {/* wooden dock extending over water */}
          <div className="absolute z-[6]" style={{ right: "10%", top: "48%", width: "35%", height: "6%" }}>
            {/* dock planks */}
            <div className="absolute inset-0 bg-[#d4b896] rounded-l-sm border-t-2 border-l-2 border-[#e0c8a8] border-b-2 border-b-[#b89870]" />
            {/* plank lines */}
            <div className="absolute top-0 left-[25%] w-[1px] h-full bg-[#c8a880] opacity-50" />
            <div className="absolute top-0 left-[50%] w-[1px] h-full bg-[#c8a880] opacity-50" />
            <div className="absolute top-0 left-[75%] w-[1px] h-full bg-[#c8a880] opacity-50" />
            {/* dock posts */}
            <div className="absolute -bottom-4 left-[5%] w-2 h-6 bg-[#c8a070] rounded-b-sm" />
            <div className="absolute -bottom-4 left-[48%] w-2 h-6 bg-[#c8a070] rounded-b-sm" />
          </div>

          {/* small clouds in scene */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/graphics/cloud5.png" alt="" width={70} height={42}
            className="absolute top-[3%] left-[5%] opacity-60" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/graphics/cloud2.png" alt="" width={60} height={25}
            className="absolute top-[8%] left-[35%] opacity-50" />

          {/* amy fishing — feet on dock (dock top is at 48%) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/graphics/amy-fishing.png"
            alt="amy fishing"
            width={90}
            height={119}
            className="absolute z-[8] drop-shadow-md"
            style={{
              right: "28%",
              top: "calc(48% - 90px)",
              transform: state === "bite" ? "translateY(-2px)" : "translateY(0)",
              transition: "transform 0.2s ease",
            }}
          />

          {/* bobber in water */}
          {state !== "idle" && state !== "casting" && (
            <div
              className="absolute z-10"
              style={{
                left: "25%",
                top: "56%",
                transform: `translateY(${bobberY}px)`,
                transition: state === "bite" ? "none" : "transform 0.1s",
              }}
            >
              <div
                className="w-3 h-3 rounded-full bg-[#f08080] border border-white/60"
                style={{
                  boxShadow: state === "bite" ? "0 0 8px rgba(240,128,128,0.6)" : "0 2px 4px rgba(0,0,0,0.1)",
                }}
              />
              {/* ripple */}
              <div className="absolute -left-1 top-1/2 w-5 h-[2px] bg-white/30 rounded-full" />
            </div>
          )}

          {/* splash effect */}
          {showSplash && (
            <div className="absolute top-[54%] left-[23%] z-10">
              <div className="w-8 h-3 bg-white/40 rounded-full animate-ping" />
            </div>
          )}

          {/* fish approaching on bite */}
          {(state === "bite" || state === "reeling") && currentFish && (
            <div
              className="absolute top-[62%] z-10 transition-transform"
              style={{
                left: `calc(20% + ${fishX}px)`,
                transform: state === "reeling" ? "scale(1.2) translateY(-10px)" : "scale(1)",
                transition: state === "reeling" ? "all 0.3s ease" : "none",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentFish.img}
                alt={currentFish.name}
                width={currentFish.width}
                height={currentFish.height}
                style={{ filter: currentFish.filter }}
              />
            </div>
          )}

          {/* caught fish display */}
          {state === "caught" && currentFish && (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/10">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 text-center animate-scale-in border-2 border-[#e8d0e0]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentFish.img}
                  alt={currentFish.name}
                  width={currentFish.width * 1.5}
                  height={currentFish.height * 1.5}
                  className="mx-auto mb-2"
                  style={{ filter: currentFish.filter }}
                />
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
        <p className="font-pixel text-[11px] text-[#8a6080] mt-4 text-center min-h-[2em]">
          {message}
        </p>

        {/* action buttons */}
        <div className="flex gap-3 mt-3">
          <button
            onClick={cast}
            disabled={!canCast}
            className={`btn-glossy px-5 py-2 text-[11px] font-bold text-[#8a6080] tracking-wide ${
              !canCast ? "opacity-40 cursor-not-allowed" : ""
            }`}
          >
            cast
          </button>
          <button
            onClick={reel}
            disabled={!canReel}
            className={`btn-glossy px-5 py-2 text-[11px] font-bold tracking-wide ${
              canReel
                ? "text-[#f08080] animate-pulse border-[#f0b0b0]"
                : "text-[#8a6080] opacity-40 cursor-not-allowed"
            }`}
          >
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
                <div
                  key={f.name}
                  className="bg-white/60 backdrop-blur-sm rounded-lg p-2 border border-[#e8d0e0] text-center min-w-[70px]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.img}
                    alt={f.name}
                    width={f.width * 0.7}
                    height={f.height * 0.7}
                    className="mx-auto mb-1"
                    style={{ filter: f.filter }}
                  />
                  <p className="font-pixel text-[8px] text-[#8a6080]">{f.name}</p>
                  <p className="font-pixel text-[8px]" style={{ color: RARITY_COLORS[f.rarity] }}>
                    x{f.count}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
