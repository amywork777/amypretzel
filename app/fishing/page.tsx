"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

interface Fish {
  name: string;
  img: string;
  rarity: "common" | "uncommon" | "rare";
  points: number;
  width: number;
  height: number;
}

const FISH_TYPES: Fish[] = [
  { name: "jellyfish", img: "/graphics/jellyfish.png", rarity: "common", points: 10, width: 50, height: 50 },
  { name: "blue fish", img: "/graphics/fish.png", rarity: "common", points: 15, width: 45, height: 45 },
  { name: "goldfish", img: "/graphics/goldfish.png", rarity: "uncommon", points: 25, width: 45, height: 30 },
  { name: "yellow tang", img: "/graphics/yellowtang.png", rarity: "uncommon", points: 30, width: 50, height: 30 },
  { name: "angelfish", img: "/graphics/angelfish.png", rarity: "rare", points: 50, width: 45, height: 35 },
];

const RARITY_COLORS = {
  common: "#a0c8b8",
  uncommon: "#c0a0d8",
  rare: "#f0b8c0",
};

type GameState = "idle" | "casting" | "waiting" | "bite" | "reeling" | "caught" | "missed";

function pickFish(): Fish {
  const roll = Math.random();
  if (roll < 0.15) return FISH_TYPES[4]; // angelfish — rare
  if (roll < 0.40) return FISH_TYPES[2 + Math.floor(Math.random() * 2)]; // uncommon
  return FISH_TYPES[Math.floor(Math.random() * 2)]; // common
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

        // Miss window
        biteTimerRef.current = setTimeout(() => {
          setState("missed");
          setMessage("too slow... the fish got away!");
          setCurrentFish(null);
        }, 2000);
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

      <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
        {/* title */}
        <h1 className="font-pixel text-lg text-[#7a5a8a] mb-4 animate-scale-in">fishing pond</h1>

        {/* pond scene */}
        <div
          className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden cursor-pointer window-frame"
          onClick={() => {
            if (canCast) cast();
            else if (canReel) reel();
          }}
        >
          {/* sky */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#c8e0f8] via-[#d0d8f0] to-[#a8d0e8]" style={{ height: "40%" }} />

          {/* water */}
          <div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-[#a0d0e8] via-[#90c0d8] to-[#78a8c8]"
            style={{ height: "65%", top: "35%" }}
          >
            {/* water shimmer */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-[10%] left-[10%] w-[80%] h-[2px] bg-white/40 rounded-full" />
              <div className="absolute top-[25%] left-[20%] w-[60%] h-[2px] bg-white/30 rounded-full" />
              <div className="absolute top-[45%] left-[5%] w-[70%] h-[2px] bg-white/25 rounded-full" />
              <div className="absolute top-[65%] left-[15%] w-[50%] h-[2px] bg-white/20 rounded-full" />
            </div>

            {/* underwater plants */}
            <div className="absolute bottom-0 left-[10%] w-3 h-12 bg-[#80b8a0] rounded-t-full opacity-40" />
            <div className="absolute bottom-0 left-[13%] w-2.5 h-10 bg-[#90c8a8] rounded-t-full opacity-35" />
            <div className="absolute bottom-0 right-[15%] w-3 h-14 bg-[#80b8a0] rounded-t-full opacity-40" />
            <div className="absolute bottom-0 right-[18%] w-2 h-9 bg-[#90c8a8] rounded-t-full opacity-30" />
            <div className="absolute bottom-0 left-[45%] w-2.5 h-11 bg-[#88c0a8] rounded-t-full opacity-35" />
          </div>

          {/* clouds */}
          <div className="absolute top-[5%] left-[8%] w-16 h-6 bg-white/50 rounded-full" />
          <div className="absolute top-[3%] left-[12%] w-10 h-5 bg-white/40 rounded-full" />
          <div className="absolute top-[8%] right-[15%] w-12 h-5 bg-white/35 rounded-full" />

          {/* fishing rod */}
          {state !== "idle" && (
            <div className="absolute top-[10%] right-[30%] z-10">
              {/* rod */}
              <div
                className="w-[3px] h-20 bg-[#c8a080] origin-bottom"
                style={{ transform: "rotate(-20deg)" }}
              />
              {/* line */}
              <div
                className="absolute top-0 right-0 w-[1px] bg-[#d0c0b8]"
                style={{
                  height: state === "casting" ? "40px" : "90px",
                  transform: "translateX(12px) translateY(4px)",
                  transition: "height 0.4s ease",
                }}
              />
              {/* bobber */}
              {state !== "casting" && (
                <div
                  className="absolute w-3 h-3 rounded-full bg-[#f08080] border border-white/60"
                  style={{
                    right: -11,
                    top: 94,
                    transform: `translateY(${bobberY}px)`,
                    transition: state === "bite" ? "none" : "transform 0.1s",
                    boxShadow: state === "bite" ? "0 0 8px rgba(240,128,128,0.6)" : "none",
                  }}
                />
              )}
            </div>
          )}

          {/* splash effect */}
          {showSplash && (
            <div className="absolute top-[38%] right-[26%] z-10">
              <div className="w-8 h-3 bg-white/40 rounded-full animate-ping" />
            </div>
          )}

          {/* fish approaching on bite */}
          {(state === "bite" || state === "reeling") && currentFish && (
            <div
              className="absolute top-[52%] z-10 transition-transform"
              style={{
                right: `calc(28% + ${-fishX}px)`,
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
            <div className="absolute top-[15%] right-[22%] z-20 animate-bounce">
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
