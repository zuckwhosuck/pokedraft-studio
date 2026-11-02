"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import gsap from "gsap";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import {
  OFFICIAL_POKEMON_TYPES,
  getPokemonById,
  getPokemonListByType,
  getTypeIconUrl,
  formatDexNumber,
  PokemonSummary,
  PokemonTypeInfo,
} from "@/lib/pokeApi";
import {
  playTick,
  playWinFanfare,
  playWhoosh,
  triggerHaptic,
} from "@/lib/soundAndHaptics";
import {
  Dices,
  Flame,
  Layers,
  Sparkles,
  RotateCcw,
  ArrowRight,
  Shield,
  Zap,
  Heart,
  Swords,
  Gauge,
  CircleCheck,
  Award,
  Hash,
  Copy,
  Check,
} from "lucide-react";

type SubMode = "number" | "type" | "combined";

interface RapidDrafterProps {
  onSendToWheel?: (pokemon: PokemonSummary) => void;
  onLoadTypeToWheel?: (typeId: string) => void;
  isShortsMode?: boolean;
}

export function RapidDrafter({
  onSendToWheel,
  onLoadTypeToWheel,
  isShortsMode = false,
}: RapidDrafterProps) {
  // Sub-Mode: 'number' (Pure Number Draw), 'type' (Pure 18 Types), 'combined' (Two-stage pipeline)
  const [subMode, setSubMode] = useState<SubMode>("number");

  // Number Draw Bounds
  const [minDex, setMinDex] = useState<number>(1);
  const [maxDex, setMaxDex] = useState<number>(1025);

  // Drafting state
  const [isDrafting, setIsDrafting] = useState<boolean>(false);
  const [hasCompleted, setHasCompleted] = useState<boolean>(false);

  // Cycling display states (What is actively visible on the screen)
  const [displayNumber, setDisplayNumber] = useState<number>(25);
  const [displayType, setDisplayType] = useState<PokemonTypeInfo>(OFFICIAL_POKEMON_TYPES[0]);
  const [displayPokemonPreview, setDisplayPokemonPreview] = useState<{ id: number; name: string } | null>(null);

  // Combined mode pipeline steps: 'type' -> 'pokemon'
  const [combinedStep, setCombinedStep] = useState<"type" | "pokemon">("type");
  const [selectedType, setSelectedType] = useState<PokemonTypeInfo | null>(null);

  // Winners
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [winnerType, setWinnerType] = useState<PokemonTypeInfo | null>(null);
  const [winnerPokemon, setWinnerPokemon] = useState<PokemonSummary | null>(null);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [copiedNumber, setCopiedNumber] = useState<boolean>(false);

  // Refs for Shockwave & Animation
  const shockwaveRef = useRef<HTMLDivElement | null>(null);
  const cardContainerRef = useRef<HTMLDivElement | null>(null);
  const lastStepIndexRef = useRef<number>(-1);
  const activeTweenRef = useRef<gsap.core.Tween | null>(null);

  // Handle GSAP Radial Shockwave
  const triggerShockwave = useCallback(() => {
    if (!shockwaveRef.current) return;
    gsap.killTweensOf(shockwaveRef.current);
    gsap.fromTo(
      shockwaveRef.current,
      { scale: 0.1, opacity: 0.95 },
      { scale: 3.8, opacity: 0, duration: 0.85, ease: "power2.out" }
    );
  }, []);

  // Handle Confetti Fireworks
  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6, x: 0.2 },
      colors: ["#FF595E", "#FFCA3A", "#8AC926", "#1982C4", "#6A4C93"],
    });
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6, x: 0.8 },
      colors: ["#FF595E", "#FFCA3A", "#8AC926", "#1982C4", "#6A4C93"],
    });
    setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 100,
        origin: { y: 0.5, x: 0.5 },
        shapes: ["star"],
        colors: ["#FFE600", "#FFAA00", "#FFFFFF"],
      });
    }, 250);
  }, []);

  // START DRAFT DISPATCHER
  const startDraft = async () => {
    if (isDrafting) return;

    setIsDrafting(true);
    setHasCompleted(false);
    setIsRevealed(false);
    setWinningNumber(null);
    setWinnerPokemon(null);
    setWinnerType(null);
    setCopiedNumber(false);
    playWhoosh();

    if (subMode === "number") {
      await runSmoothNumberDraft();
    } else if (subMode === "type") {
      await runSmoothTypeDraft();
    } else if (subMode === "combined") {
      if (combinedStep === "type") {
        await runSmoothCombinedTypeStep();
      } else {
        await runSmoothCombinedPokemonStep(selectedType || OFFICIAL_POKEMON_TYPES[0]);
      }
    }
  };

  /**
   * 1. SMOOTH NUMBER DRAFT (NO POKÉMON - ONLY NUMBER WINNER)
   * Creates a predefined sequence that rolls and decelerates organically,
   * stopping EXACTLY on the winning number with zero jumping!
   */
  const runSmoothNumberDraft = async () => {
    const validMin = Math.max(0, Math.min(minDex, maxDex));
    const validMax = Math.min(1025, Math.max(minDex, maxDex));
    const targetDex = Math.floor(Math.random() * (validMax - validMin + 1)) + validMin;

    // Build a sequence of 38 numbers where sequence[37] is strictly targetDex
    const totalSteps = 38;
    const sequence: number[] = [];
    for (let i = 0; i < totalSteps - 1; i++) {
      let randNum = Math.floor(Math.random() * (validMax - validMin + 1)) + validMin;
      // Ensure adjacent numbers aren't identical for maximum motion feel
      if (sequence.length > 0 && randNum === sequence[sequence.length - 1]) {
        randNum = (randNum + 1) > validMax ? validMin : randNum + 1;
      }
      sequence.push(randNum);
    }
    sequence.push(targetDex); // Guaranteed final stopping item!

    lastStepIndexRef.current = -1;
    const anim = { progress: 0 };

    activeTweenRef.current = gsap.to(anim, {
      progress: 1,
      duration: 3.2,
      ease: "power4.out", // Fast spin -> organic, suspenseful crawl
      onUpdate: () => {
        const step = Math.min(totalSteps - 1, Math.floor(anim.progress * totalSteps));
        if (step !== lastStepIndexRef.current) {
          lastStepIndexRef.current = step;
          const currentVal = sequence[step];
          setDisplayNumber(currentVal);

          // Pitch drops organically as wheel/counter decelerates
          const pitch = 1.35 - anim.progress * 0.55;
          playTick(pitch);
          triggerHaptic(10);
        }
      },
      onComplete: () => {
        // EXACT number that stopped is the winner
        setDisplayNumber(targetDex);
        setWinningNumber(targetDex);
        setIsDrafting(false);
        setHasCompleted(true);

        triggerShockwave();
        triggerConfetti();
        playWinFanfare();
        triggerHaptic([40, 30, 100]);
      },
    });
  };

  /**
   * 2. SMOOTH TYPE DRAFT
   * Circularly traverses the 18 types with progressive deceleration,
   * stopping on the exact final type seen on screen!
   */
  const runSmoothTypeDraft = async () => {
    const typeCount = OFFICIAL_POKEMON_TYPES.length;
    const targetIdx = Math.floor(Math.random() * typeCount);
    const chosenType = OFFICIAL_POKEMON_TYPES[targetIdx];

    // Find starting index
    const currentIdx = OFFICIAL_POKEMON_TYPES.findIndex((t) => t.id === displayType.id);
    const startIdx = currentIdx >= 0 ? currentIdx : 0;

    // Full rotations + offset so it lands exactly on targetIdx
    const fullRounds = 3;
    const delta = (targetIdx - startIdx + typeCount) % typeCount;
    const totalSteps = fullRounds * typeCount + delta;

    // Sequence of types
    const sequence: PokemonTypeInfo[] = [];
    for (let i = 0; i <= totalSteps; i++) {
      sequence.push(OFFICIAL_POKEMON_TYPES[(startIdx + i) % typeCount]);
    }

    lastStepIndexRef.current = -1;
    const anim = { progress: 0 };

    activeTweenRef.current = gsap.to(anim, {
      progress: 1,
      duration: 3.4,
      ease: "power4.out",
      onUpdate: () => {
        const step = Math.min(sequence.length - 1, Math.floor(anim.progress * sequence.length));
        if (step !== lastStepIndexRef.current) {
          lastStepIndexRef.current = step;
          const currentType = sequence[step];
          setDisplayType(currentType);

          const pitch = 1.35 - anim.progress * 0.55;
          playTick(pitch);
          triggerHaptic(12);
        }
      },
      onComplete: () => {
        setDisplayType(chosenType);
        setWinnerType(chosenType);
        setIsDrafting(false);
        setHasCompleted(true);

        triggerShockwave();
        triggerConfetti();
        playWinFanfare();
        triggerHaptic([40, 30, 100]);
      },
    });
  };

  /**
   * 3A. SMOOTH COMBINED PIPELINE - STEP 1 (TYPE)
   */
  const runSmoothCombinedTypeStep = async () => {
    const typeCount = OFFICIAL_POKEMON_TYPES.length;
    const targetIdx = Math.floor(Math.random() * typeCount);
    const chosenType = OFFICIAL_POKEMON_TYPES[targetIdx];

    const currentIdx = OFFICIAL_POKEMON_TYPES.findIndex((t) => t.id === displayType.id);
    const startIdx = currentIdx >= 0 ? currentIdx : 0;
    const totalSteps = 2 * typeCount + ((targetIdx - startIdx + typeCount) % typeCount);

    const sequence: PokemonTypeInfo[] = [];
    for (let i = 0; i <= totalSteps; i++) {
      sequence.push(OFFICIAL_POKEMON_TYPES[(startIdx + i) % typeCount]);
    }

    lastStepIndexRef.current = -1;
    const anim = { progress: 0 };

    activeTweenRef.current = gsap.to(anim, {
      progress: 1,
      duration: 3.2,
      ease: "power4.out",
      onUpdate: () => {
        const step = Math.min(sequence.length - 1, Math.floor(anim.progress * sequence.length));
        if (step !== lastStepIndexRef.current) {
          lastStepIndexRef.current = step;
          setDisplayType(sequence[step]);
          playTick(1.35 - anim.progress * 0.55);
          triggerHaptic(10);
        }
      },
      onComplete: () => {
        setDisplayType(chosenType);
        setSelectedType(chosenType);
        setWinnerType(chosenType);
        setIsDrafting(false);

        triggerShockwave();
        triggerConfetti();
        playWinFanfare();
        triggerHaptic([40, 30, 100]);

        // Preload type Pokémon in background
        getPokemonListByType(chosenType.id).catch(() => {});
      },
    });
  };

  /**
   * 3B. SMOOTH COMBINED PIPELINE - STEP 2 (POKÉMON OF THAT TYPE)
   * Builds an exact sequence of Pokémon of that element.
   * As it decelerates, the last Pokémon that stops on screen IS the winner!
   */
  const runSmoothCombinedPokemonStep = async (type: PokemonTypeInfo) => {
    setIsDrafting(true);
    setHasCompleted(false);
    setIsRevealed(false);

    try {
      const validIds = await getPokemonListByType(type.id);
      if (validIds.length === 0) throw new Error("No Pokémon found for this type");

      const targetId = validIds[Math.floor(Math.random() * validIds.length)];
      const fetchPromise = getPokemonById(targetId);

      // Build sequence of Pokémon IDs ending on targetId
      const totalSteps = 34;
      const sequenceIds: number[] = [];
      for (let i = 0; i < totalSteps - 1; i++) {
        sequenceIds.push(validIds[Math.floor(Math.random() * validIds.length)]);
      }
      sequenceIds.push(targetId); // Guaranteed final stop!

      lastStepIndexRef.current = -1;
      const anim = { progress: 0 };

      activeTweenRef.current = gsap.to(anim, {
        progress: 1,
        duration: 3.4,
        ease: "power4.out",
        onUpdate: () => {
          const step = Math.min(sequenceIds.length - 1, Math.floor(anim.progress * sequenceIds.length));
          if (step !== lastStepIndexRef.current) {
            lastStepIndexRef.current = step;
            const currentId = sequenceIds[step];
            setDisplayNumber(currentId);

            playTick(1.35 - anim.progress * 0.55);
            triggerHaptic(10);
          }
        },
        onComplete: async () => {
          const pkmn = await fetchPromise;
          setDisplayNumber(targetId);
          setWinnerPokemon(pkmn);
          setIsDrafting(false);
          setHasCompleted(true);

          triggerShockwave();
          triggerConfetti();
          playWinFanfare();
          triggerHaptic([40, 30, 100]);

          setTimeout(() => {
            setIsRevealed(true);
          }, 600);
        },
      });
    } catch {
      setIsDrafting(false);
    }
  };

  // Reset current state
  const resetDraft = () => {
    if (activeTweenRef.current) {
      activeTweenRef.current.kill();
    }
    setIsDrafting(false);
    setHasCompleted(false);
    setIsRevealed(false);
    setWinningNumber(null);
    setWinnerPokemon(null);
    setWinnerType(null);
    setCopiedNumber(false);
    if (subMode === "combined") {
      setCombinedStep("type");
      setSelectedType(null);
    }
  };

  // Copy number to clipboard
  const handleCopyNumber = (num: number) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(num.toString());
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 2000);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-1 sm:p-4">
      {/* Sub-Mode Segmented Selector (Mobile-First 3-Tab Grid) */}
      {!isShortsMode && (
        <div className="w-full max-w-sm sm:max-w-md mb-3 sm:mb-6 flex items-center p-1 bg-slate-900/90 border border-white/10 rounded-2xl shadow-md backdrop-blur-xl">
          <button
            onClick={() => {
              setSubMode("number");
              resetDraft();
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-1 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 ${
              subMode === "number"
                ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Hash className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Number</span>
          </button>
          <button
            onClick={() => {
              setSubMode("type");
              resetDraft();
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-1 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 ${
              subMode === "type"
                ? "bg-gradient-to-r from-rose-500 via-pink-600 to-orange-500 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Flame className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Type</span>
          </button>
          <button
            onClick={() => {
              setSubMode("combined");
              resetDraft();
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-1 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 ${
              subMode === "combined"
                ? "bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Combined</span>
          </button>
        </div>
      )}

      {/* MAIN VIRAL SMARTPHONE / DRAFTER HOUSING */}
      <div
        ref={cardContainerRef}
        className={`relative w-full overflow-hidden rounded-2xl sm:rounded-[3rem] border border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(244,63,94,0.12)] backdrop-blur-2xl transition-all duration-300 ${
          isShortsMode
            ? "max-w-[420px] aspect-[9/16] min-h-[720px] flex flex-col justify-between"
            : "max-w-[420px] min-h-[560px] sm:min-h-[640px] flex flex-col justify-between"
        } bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-950`}
      >
        {/* Dynamic Holographic Foil Overlay */}
        <div className="absolute inset-0 holo-gradient opacity-15 pointer-events-none" />

        {/* GSAP Radial Shockwave Element */}
        <div
          ref={shockwaveRef}
          className="pointer-events-none absolute inset-0 z-30 m-auto w-64 h-64 rounded-full bg-white opacity-0 blur-md transform -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"
        />

        {/* TOP STATUS BAR (Authentic Smartphone / Recording Notch) */}
        <div className="relative z-20 px-6 pt-5 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {isDrafting ? "SUSPENSE DRAWING..." : "RAPID DRAFTER"}
            </span>
          </div>

          {/* Sub-mode Tag */}
          <div className="px-3 py-1 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-wider text-slate-200">
            {subMode === "number" && `Dex #${minDex} – #${maxDex}`}
            {subMode === "type" && "18 Elements"}
            {subMode === "combined" &&
              (combinedStep === "type" ? "Step 1: Type" : "Step 2: Pokémon")}
          </div>
        </div>

        {/* CENTER STAGE: VIBRANT VIRAL DRAW SCREEN */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center">
          <AnimatePresence mode="wait">
            {/* 1. DRAFTING ACTIVE STATE: The iconic viral "Winner is..." screen */}
            {isDrafting ? (
              <motion.div
                key="drafting"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="w-full h-full flex flex-col items-center justify-center relative"
              >
                {/* Pulsing neon energy backlight */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-pink-600 via-rose-500 to-amber-500 opacity-90 blur-xl animate-pulse" />

                <div className="relative z-10 w-full py-12 px-6 rounded-3xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 shadow-2xl border border-white/30 flex flex-col items-center justify-center text-white overflow-hidden">
                  <div className="absolute inset-0 holo-gradient opacity-30 pointer-events-none" />

                  {/* Viral TikTok/Shorts Text Header */}
                  <motion.h2
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    className="text-4xl sm:text-5xl font-black italic tracking-tighter text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)] uppercase mb-4"
                  >
                    Winner is...
                  </motion.h2>

                  {/* Cycling Slot Content */}
                  {subMode === "number" ||
                  (subMode === "combined" && combinedStep === "pokemon") ? (
                    <div className="flex flex-col items-center">
                      <div
                        id="drafter-display-number"
                        className="text-6xl sm:text-7xl font-black tracking-widest text-white drop-shadow-[0_8px_25px_rgba(0,0,0,0.8)] font-mono"
                      >
                        {formatDexNumber(displayNumber)}
                      </div>
                      <span className="text-[11px] font-black text-white/90 uppercase tracking-widest mt-3 bg-black/25 px-3 py-1 rounded-full border border-white/20">
                        {subMode === "number"
                          ? "Decelerating Dex IDs..."
                          : `Crawling ${selectedType?.displayName || "Type"} Pokémon...`}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white/20 backdrop-blur-md p-3 mb-3 border border-white/40 shadow-inner flex items-center justify-center">
                        <Image
                          src={getTypeIconUrl(displayType.id)}
                          alt={displayType.displayName}
                          width={80}
                          height={80}
                          className="w-full h-full object-contain filter drop-shadow-md"
                          unoptimized
                        />
                      </div>
                      <div className="text-3xl sm:text-4xl font-black tracking-wider uppercase drop-shadow-lg">
                        {displayType.displayName}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : hasCompleted && winningNumber !== null && subMode === "number" ? (
              /* 2. PURE NUMBER WINNER SHOWCASE (NO POKÉMON - ONLY THE WINNING NUMBER!) */
              <motion.div
                key="winner-number"
                initial={{ opacity: 0, scale: 0.85, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 15, stiffness: 140 }}
                className="w-full flex flex-col items-center"
              >
                <div className="relative w-full rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/80 p-8 shadow-[0_0_60px_rgba(245,158,11,0.25)] flex flex-col items-center text-white overflow-hidden">
                  <div className="absolute inset-0 holo-gradient opacity-20 pointer-events-none" />

                  {/* Header Badge */}
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider mb-4 shadow-sm">
                    <Award className="w-4 h-4 text-amber-400" />
                    Winner Locked!
                  </div>

                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Selected National Dex Number
                  </span>

                  {/* Huge Grand Winner Number */}
                  <div className="my-6 relative">
                    <div
                      id="drafter-winner-number"
                      className="text-7xl sm:text-8xl font-black font-mono tracking-wider bg-gradient-to-br from-white via-amber-200 to-amber-500 bg-clip-text text-transparent filter drop-shadow-[0_10px_30px_rgba(245,158,11,0.5)]"
                    >
                      {formatDexNumber(winningNumber)}
                    </div>
                    <div className="text-sm font-black text-amber-400 mt-1 uppercase tracking-widest">
                      National Dex #{winningNumber}
                    </div>
                  </div>

                  {/* Range Callout */}
                  <div className="w-full p-3 rounded-2xl bg-slate-950/80 border border-white/5 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>Pool Min: #{minDex}</span>
                    <span className="text-slate-600">&bull;</span>
                    <span>Pool Max: #{maxDex}</span>
                  </div>

                  {/* Copy Number Button */}
                  <button
                    onClick={() => handleCopyNumber(winningNumber)}
                    className="mt-4 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition"
                  >
                    {copiedNumber ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Copied #{winningNumber}!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-400" />
                        <span>Copy Winning Number</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : hasCompleted && winnerPokemon && subMode === "combined" && combinedStep === "pokemon" ? (
              /* 3. COMBINED PIPELINE STEP 2 POKÉMON WINNER CARD */
              <motion.div
                key="winner-pokemon"
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", damping: 16, stiffness: 120 }}
                className="w-full flex flex-col items-center"
              >
                <div className="relative w-full rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 p-6 shadow-2xl overflow-hidden">
                  <div
                    className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
                    style={{
                      backgroundColor:
                        OFFICIAL_POKEMON_TYPES.find(
                          (t) => t.id === winnerPokemon.primaryType
                        )?.primaryColor || "#3b82f6",
                    }}
                  />

                  {/* Header: Dex and Name */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-mono font-bold text-xs tracking-wider">
                      {winnerPokemon.dexNumber}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {winnerPokemon.types.map((type) => {
                        const typeInfo = OFFICIAL_POKEMON_TYPES.find(
                          (t) => t.id === type
                        );
                        return (
                          <div
                            key={type}
                            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm"
                            style={{
                              backgroundColor: typeInfo?.primaryColor || "#64748b",
                            }}
                          >
                            <Image
                              src={getTypeIconUrl(type)}
                              alt={type}
                              width={12}
                              height={12}
                              className="w-3 h-3 object-contain"
                              unoptimized
                            />
                            {type}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Artwork with Silhouette Reveal */}
                  <div className="relative w-full aspect-square max-w-[240px] mx-auto my-2 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-radial from-white/10 to-transparent blur-md pointer-events-none" />

                    <motion.div
                      initial={{ filter: "brightness(0) contrast(2)" }}
                      animate={{
                        filter: isRevealed
                          ? "brightness(1) contrast(1)"
                          : "brightness(0) contrast(2)",
                      }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                      className="w-full h-full flex items-center justify-center"
                    >
                      <Image
                        src={winnerPokemon.artworkUrl}
                        alt={winnerPokemon.name}
                        width={240}
                        height={240}
                        className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]"
                        priority
                        unoptimized
                      />
                    </motion.div>
                  </div>

                  <div className="mt-2">
                    <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white capitalize">
                      {winnerPokemon.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {isRevealed
                        ? "Drawn Champion Winner!"
                        : "Who's That Pokémon?..."}
                    </p>
                  </div>

                  {/* Base Stats Pills */}
                  {winnerPokemon.stats && (
                    <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-center gap-1 text-rose-400 font-bold text-[10px] uppercase">
                          <Heart className="w-2.5 h-2.5" /> HP
                        </div>
                        <span className="font-extrabold text-white text-xs">
                          {winnerPokemon.stats.hp}
                        </span>
                      </div>
                      <div className="bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-center gap-1 text-amber-400 font-bold text-[10px] uppercase">
                          <Swords className="w-2.5 h-2.5" /> ATK
                        </div>
                        <span className="font-extrabold text-white text-xs">
                          {winnerPokemon.stats.attack}
                        </span>
                      </div>
                      <div className="bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-center gap-1 text-blue-400 font-bold text-[10px] uppercase">
                          <Shield className="w-2.5 h-2.5" /> DEF
                        </div>
                        <span className="font-extrabold text-white text-xs">
                          {winnerPokemon.stats.defense}
                        </span>
                      </div>
                      <div className="bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-center gap-1 text-emerald-400 font-bold text-[10px] uppercase">
                          <Gauge className="w-2.5 h-2.5" /> SPD
                        </div>
                        <span className="font-extrabold text-white text-xs">
                          {winnerPokemon.stats.speed}
                        </span>
                      </div>
                    </div>
                  )}

                  {onSendToWheel && (
                    <button
                      onClick={() => onSendToWheel(winnerPokemon)}
                      className="mt-4 w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 text-white shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Send {winnerPokemon.name} into Spinning Wheel
                    </button>
                  )}
                </div>
              </motion.div>
            ) : hasCompleted && winnerType && subMode === "type" ? (
              /* 4. TYPE WINNER SHOWCASE */
              <motion.div
                key="winner-type"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full flex flex-col items-center"
              >
                <div
                  className="w-full rounded-3xl p-8 border shadow-2xl flex flex-col items-center text-white"
                  style={{
                    backgroundColor: winnerType.primaryColor,
                    borderColor: winnerType.secondaryColor,
                  }}
                >
                  <div className="w-28 h-28 rounded-2xl bg-white/20 backdrop-blur-md p-4 mb-4 border border-white/40 shadow-inner flex items-center justify-center">
                    <Image
                      src={getTypeIconUrl(winnerType.id)}
                      alt={winnerType.displayName}
                      width={96}
                      height={96}
                      className="w-full h-full object-contain filter drop-shadow"
                      unoptimized
                    />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-white/80">
                    Type Winner Stopped
                  </span>
                  <h3 className="text-4xl font-black uppercase tracking-tight text-white drop-shadow-md mt-1">
                    {winnerType.displayName}
                  </h3>

                  {onLoadTypeToWheel && (
                    <button
                      onClick={() => onLoadTypeToWheel(winnerType.id)}
                      className="mt-6 w-full py-3 px-4 rounded-xl font-bold text-xs bg-slate-950 text-white hover:bg-slate-900 border border-white/20 shadow-xl flex items-center justify-center gap-2 transition"
                    >
                      <Zap className="w-4 h-4 text-amber-400" />
                      Load 10 {winnerType.displayName} Pokémon into Wheel
                    </button>
                  )}
                </div>
              </motion.div>
            ) : subMode === "combined" && selectedType && combinedStep === "type" ? (
              /* 5. COMBINED STEP 1 COMPLETED -> PROMPT FOR STEP 2 */
              <motion.div
                key="combined-step1-done"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full flex flex-col items-center p-6 rounded-3xl bg-slate-900 border border-slate-800"
              >
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center p-3 mb-3 shadow-lg"
                  style={{ backgroundColor: selectedType.primaryColor }}
                >
                  <Image
                    src={getTypeIconUrl(selectedType.id)}
                    alt={selectedType.displayName}
                    width={56}
                    height={56}
                    className="w-full h-full object-contain filter drop-shadow"
                    unoptimized
                  />
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <CircleCheck className="w-3.5 h-3.5" />
                  Step 1 Locked: {selectedType.displayName}
                </div>
                <h3 className="text-xl font-bold text-white mb-4">
                  Draft a {selectedType.displayName} Pokémon!
                </h3>
                <button
                  onClick={() => {
                    setCombinedStep("pokemon");
                    runSmoothCombinedPokemonStep(selectedType);
                  }}
                  className="w-full py-3 px-5 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 text-white shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 transition transform active:scale-95"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  Proceed to Step 2: Pokémon Draft
                </button>
              </motion.div>
            ) : (
              /* 6. IDLE / READY STATE */
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center text-center py-6"
              >
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center mb-5 shadow-inner">
                  <Sparkles className="w-10 h-10 text-amber-400 animate-bounce" />
                </div>
                <h3 className="text-2xl font-black tracking-tight text-white mb-2">
                  {subMode === "number" && "Pure Number Randomizer"}
                  {subMode === "type" && "18 Type Rapid Drafter"}
                  {subMode === "combined" && "Two-Stage Pipeline"}
                </h3>
                <p className="text-xs text-slate-400 max-w-[280px] leading-relaxed">
                  {subMode === "number" &&
                    "Decelerates smoothly like an authentic slot machine. The exact number that crawls to a stop is the winner!"}
                  {subMode === "type" &&
                    "Spins across the 18 element types. The final element to land on screen is the winner!"}
                  {subMode === "combined" &&
                    "Draft an Element Type, then draft an authentic Pokémon of that Element!"}
                </p>

                {/* Min / Max Inputs for Number Mode */}
                {subMode === "number" && (
                  <div className="mt-5 flex items-center gap-3 bg-slate-900/90 p-2.5 rounded-2xl border border-white/10 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-bold">Min:</span>
                      <input
                        type="number"
                        min={0}
                        max={1025}
                        value={minDex}
                        onChange={(e) => setMinDex(parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-center font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <span className="text-slate-600 font-bold">&ndash;</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-bold">Max:</span>
                      <input
                        type="number"
                        min={0}
                        max={1025}
                        value={maxDex}
                        onChange={(e) => setMaxDex(parseInt(e.target.value) || 1025)}
                        className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-center font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="relative z-20 p-6 bg-slate-950/80 border-t border-white/10 flex items-center gap-3">
          {hasCompleted ? (
            <button
              onClick={resetDraft}
              className="flex-1 py-4 px-4 rounded-2xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white border border-white/10 flex items-center justify-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4" />
              Draw Again
            </button>
          ) : (
            <button
              id="start-draft-button"
              disabled={isDrafting}
              onClick={startDraft}
              className={`flex-1 py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider text-white shadow-2xl flex items-center justify-center gap-2.5 transition transform active:scale-95 ${
                isDrafting
                  ? "bg-slate-800 cursor-not-allowed opacity-60"
                  : "bg-gradient-to-r from-rose-500 via-pink-600 to-amber-500 hover:brightness-110 shadow-rose-500/30"
              }`}
            >
              <Zap className="w-5 h-5 fill-white" />
              {isDrafting ? "Locking In Winner..." : "Spin Winner"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
