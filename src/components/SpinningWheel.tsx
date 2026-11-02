"use client";

import React, { useState, useRef, useEffect, useCallback, useId } from "react";
import Image from "next/image";
import gsap from "gsap";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import {
  OFFICIAL_POKEMON_TYPES,
  getPokemonById,
  getPokemonListByType,
  getTypeIconUrl,
  getRandomInts,
  PokemonSummary,
} from "@/lib/pokeApi";
import {
  playTick,
  playWinFanfare,
  triggerHaptic,
} from "@/lib/soundAndHaptics";
import {
  Play,
  RotateCcw,
  Settings,
  Sparkles,
  Trash2,
  Plus,
  Shuffle,
  PackageOpen,
  Award,
  X,
  Sliders,
  Hand,
} from "lucide-react";

interface SpinningWheelProps {
  initialPokemonList?: PokemonSummary[];
  isShortsMode?: boolean;
  onOpenTypeManager?: () => void;
}

export function SpinningWheel({
  initialPokemonList,
  isShortsMode = false,
  onOpenTypeManager,
}: SpinningWheelProps) {
  // Slices state (2 to 24 Pokémon)
  const [slices, setSlices] = useState<PokemonSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [sliceCount, setSliceCount] = useState<number>(10);

  // Winner state
  const [winner, setWinner] = useState<PokemonSummary | null>(null);
  const [winningIndex, setWinningIndex] = useState<number | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState<boolean>(false);

  // Customizer Drawer State
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");

  // Physics & GSAP Animation State
  const wheelContainerRef = useRef<HTMLDivElement | null>(null);
  const wheelGroupRef = useRef<SVGGElement | null>(null);
  const pegRef = useRef<SVGGElement | null>(null);
  const currentRotationRef = useRef<number>(0);
  const lastPegStepRef = useRef<number>(-1);
  const pegTweenRef = useRef<gsap.core.Tween | null>(null);
  const spinTweenRef = useRef<gsap.core.Tween | null>(null);
  const gradientIdPrefix = useId().replace(/:/g, "_");

  // Touch Drag State for Mobile Gestures
  const isDraggingRef = useRef<boolean>(false);
  const hasDraggedRef = useRef<boolean>(false);
  const lastAngleRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const angularVelocityRef = useRef<number>(0);

  // Load default 10 Pokémon on initial mount
  useEffect(() => {
    if (initialPokemonList && initialPokemonList.length >= 2) {
      setSlices(initialPokemonList.slice(0, 24));
      setSliceCount(Math.min(24, initialPokemonList.length));
      setIsLoading(false);
      return;
    }

    async function loadDefaults() {
      setIsLoading(true);
      try {
        const randomIds = getRandomInts(1, 1025, 10);
        const fetched = await Promise.all(
          randomIds.map((id) =>
            getPokemonById(id).catch(() => getPokemonById(25))
          )
        );
        const packPresets = [
          "5 Packs",
          "10 Packs",
          "15 Packs",
          "20 Packs",
          "25 Packs",
          "ESCALATOR",
          "CHASE CARD",
          "RTYH",
          "DOUBLE RIP",
          "GOD PACK",
        ];
        const withLabels = fetched.map((p, idx) => ({
          ...p,
          customLabel: packPresets[idx % packPresets.length],
        }));
        setSlices(withLabels);
        setSliceCount(withLabels.length);
      } catch (err) {
        console.error("Failed to load initial wheel slices:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDefaults();
  }, [initialPokemonList]);

  // Re-roll all slices with random Pokémon
  const reRollPool = useCallback(
    async (type?: string) => {
      setIsLoading(true);
      try {
        let ids: number[] = [];
        if (type && type !== "all") {
          const typeIds = await getPokemonListByType(type);
          const shuffled = [...typeIds].sort(() => 0.5 - Math.random());
          ids = shuffled.slice(0, sliceCount);
        } else {
          ids = getRandomInts(1, 1025, sliceCount);
        }

        const fetched = await Promise.all(
          ids.map((id) => getPokemonById(id).catch(() => getPokemonById(25)))
        );

        setSlices((prev) =>
          fetched.map((p, idx) => ({
            ...p,
            customLabel: prev[idx]?.customLabel || `${(idx + 1) * 5} Packs`,
          }))
        );
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [sliceCount]
  );

  // Dynamic Slice Count Change
  const updateSliceCount = async (newCount: number) => {
    const clamped = Math.max(2, Math.min(24, newCount));
    setSliceCount(clamped);

    if (clamped > slices.length) {
      const diff = clamped - slices.length;
      const newIds = getRandomInts(1, 1025, diff);
      const newPkmn = await Promise.all(
        newIds.map((id) => getPokemonById(id).catch(() => getPokemonById(25)))
      );
      setSlices((prev) => [
        ...prev,
        ...newPkmn.map((p, i) => ({
          ...p,
          customLabel: `${(prev.length + i + 1) * 5} Packs`,
        })),
      ]);
    } else if (clamped < slices.length) {
      setSlices((prev) => prev.slice(0, clamped));
    }
  };

  // Mechanical Clicker Peg Deflection via native SVG transform
  const flickPeg = useCallback((speedFactor: number) => {
    if (!pegRef.current) return;

    if (pegTweenRef.current) {
      pegTweenRef.current.kill();
    }

    const pegObj = { angle: -28 };
    pegRef.current.setAttribute("transform", `rotate(-28 32 16)`);

    pegTweenRef.current = gsap.to(pegObj, {
      angle: 0,
      duration: Math.max(0.06, 0.2 - speedFactor * 0.12),
      ease: "back.out(2.5)",
      onUpdate: () => {
        if (pegRef.current) {
          pegRef.current.setAttribute(
            "transform",
            `rotate(${pegObj.angle} 32 16)`
          );
        }
      },
    });

    const pitch = 1.0 + Math.min(0.65, speedFactor * 0.55);
    playTick(pitch);
    triggerHaptic(10);
  }, []);

  // START WHEEL SPIN (Triggered by button click or touch flick gesture)
  const spinWheel = useCallback(
    (initialVelocityBoost = 0) => {
      if (isSpinning || slices.length < 2 || !wheelGroupRef.current) return;

      setIsSpinning(true);
      setShowWinnerModal(false);
      setWinningIndex(null);

      const N = slices.length;
      const sliceAngle = 360 / N;

      const chosenIndex = Math.floor(Math.random() * N);
      const jitter = (Math.random() - 0.5) * (sliceAngle * 0.6);
      const wedgeCenterAngle = chosenIndex * sliceAngle + sliceAngle / 2 + jitter;

      const extraRounds = Math.min(4, Math.floor(Math.abs(initialVelocityBoost) * 1.5));
      const fullRotations = Math.floor(Math.random() * 3) + 8 + extraRounds;
      const baseTargetAngle = (360 - wedgeCenterAngle + 360) % 360;

      const startRot = currentRotationRef.current;
      const currentRotMod = startRot % 360;
      let delta = baseTargetAngle - currentRotMod;
      if (delta <= 0) delta += 360;
      const finalRot = startRot + fullRotations * 360 + delta;

      lastPegStepRef.current = Math.floor(startRot / sliceAngle);

      const animObj = { rot: startRot };

      spinTweenRef.current = gsap.to(animObj, {
        rot: finalRot,
        duration: 5.5,
        ease: "power4.out",
        onUpdate: () => {
          const curRot = animObj.rot;
          currentRotationRef.current = curRot;

          if (wheelGroupRef.current) {
            wheelGroupRef.current.setAttribute(
              "transform",
              `rotate(${curRot} 250 250)`
            );
          }

          const currentPegStep = Math.floor(curRot / sliceAngle);
          if (currentPegStep !== lastPegStepRef.current) {
            lastPegStepRef.current = currentPegStep;
            const remainingRot = finalRot - curRot;
            const speedFactor = Math.min(1, remainingRot / (fullRotations * 360));
            flickPeg(speedFactor);
          }
        },
        onComplete: () => {
          setIsSpinning(false);
          setWinningIndex(chosenIndex);
          const winningPkmn = slices[chosenIndex];
          setWinner(winningPkmn);
          setShowWinnerModal(true);

          playWinFanfare();
          triggerHaptic([40, 30, 100]);

          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6, x: 0.5 },
            colors: ["#FFD700", "#FF4500", "#00E5FF", "#76FF03", "#D500F9"],
          });
        },
      });
    },
    [isSpinning, slices, flickPeg]
  );

  // TOUCH & DRAG EVENT HANDLERS FOR MOBILE SCREENS
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isSpinning || slices.length < 2 || !wheelContainerRef.current) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    hasDraggedRef.current = false;

    const rect = wheelContainerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const rad = Math.atan2(e.clientY - cy, e.clientX - cx);
    const deg = (rad * 180) / Math.PI;

    lastAngleRef.current = deg;
    lastTimeRef.current = Date.now();
    angularVelocityRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !wheelContainerRef.current) return;

    const rect = wheelContainerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const rad = Math.atan2(e.clientY - cy, e.clientX - cx);
    const deg = (rad * 180) / Math.PI;

    let delta = deg - lastAngleRef.current;
    if (delta > 180) delta -= 360;
    else if (delta < -180) delta += 360;

    const now = Date.now();
    const dt = Math.max(1, now - lastTimeRef.current);

    if (Math.abs(delta) > 0.4) {
      hasDraggedRef.current = true;
      currentRotationRef.current += delta;

      if (wheelGroupRef.current) {
        wheelGroupRef.current.setAttribute(
          "transform",
          `rotate(${currentRotationRef.current} 250 250)`
        );
      }

      const sliceAngle = 360 / slices.length;
      const currentPegStep = Math.floor(currentRotationRef.current / sliceAngle);
      if (currentPegStep !== lastPegStepRef.current) {
        lastPegStepRef.current = currentPegStep;
        flickPeg(0.3);
      }

      angularVelocityRef.current = delta / dt;
    }

    lastAngleRef.current = deg;
    lastTimeRef.current = now;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const velocity = angularVelocityRef.current;

    if (hasDraggedRef.current) {
      spinWheel(Math.abs(velocity));
    } else {
      spinWheel(0);
    }
  };

  const removeWinnerSlice = () => {
    if (winningIndex === null || slices.length <= 2) {
      alert("At least 2 slices are required for the wheel.");
      return;
    }
    const updated = slices.filter((_, idx) => idx !== winningIndex);
    setSlices(updated);
    setSliceCount(updated.length);
    setShowWinnerModal(false);
    setWinningIndex(null);
  };

  const applyEscalatorPreset = () => {
    const presets = [
      "1 Pack",
      "2 Packs",
      "3 Packs",
      "5 Packs",
      "7 Packs",
      "10 Packs",
      "15 Packs",
      "20 Packs",
      "25 Packs",
      "CHASE CARD",
      "ESCALATOR",
      "DOUBLE RIP",
      "GOD PACK",
    ];
    setSlices((prev) =>
      prev.map((s, idx) => ({
        ...s,
        customLabel: presets[idx % presets.length],
      }))
    );
  };

  const N = slices.length;
  const sliceAngle = 360 / Math.max(1, N);

  // Maximum badge width inside slice so it NEVER overflows into neighbor slices
  const maxPillWidth = Math.min(52, Math.max(34, 540 / N));

  return (
    <div className="w-full flex flex-col items-center justify-center p-1 sm:p-4">
      {/* MOBILE-FRIENDLY COMPACT TOOLBAR (Hidden in Shorts Mode) */}
      {!isShortsMode && (
        <div className="w-full max-w-sm sm:max-w-md mb-2 sm:mb-4 flex items-center justify-between gap-2 px-3 sm:px-4 py-2 bg-slate-900/90 border border-white/10 rounded-2xl shadow-md backdrop-blur-xl">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] flex-shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-200 truncate">
              Wheel ({N} Slices)
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              disabled={isSpinning || isLoading}
              onClick={() => reRollPool(selectedTypeFilter)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/5 transition"
            >
              <Shuffle className="w-3.5 h-3.5 text-blue-400" />
              <span>Re-Roll</span>
            </button>

            <button
              onClick={() => setIsCustomizerOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white text-xs font-bold shadow-sm transition"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>
        </div>
      )}

      {/* WHEEL STAGE HOUSING — EXPANDED ON MOBILE */}
      <div
        ref={wheelContainerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative flex flex-col items-center justify-center w-full max-w-[390px] sm:max-w-[480px] aspect-square rounded-2xl sm:rounded-[3rem] p-1.5 sm:p-5 bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-950 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_40px_rgba(245,158,11,0.12)] backdrop-blur-2xl touch-none cursor-grab active:cursor-grabbing select-none ${
          isShortsMode ? "max-w-[380px]" : ""
        }`}
      >
        {/* Dynamic ambient backlight */}
        <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-amber-500/10 via-rose-500/10 to-blue-500/10 blur-xl pointer-events-none" />

        {/* Mobile Swipe Hint Badge */}
        {/* <div className="absolute top-2.5 left-4 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.08] border border-white/10 text-[9px] font-bold text-slate-300 pointer-events-none">
          <Hand className="w-3 h-3 text-amber-400 animate-pulse" />
          <span>Swipe to Spin</span>
        </div> */}

        {/* TOP MECHANICAL CLICKER PEG BRACKET */}
        <div className="absolute top-1 sm:top-2 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
          <svg
            width="56"
            height="68"
            viewBox="0 0 64 76"
            className="overflow-visible filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]"
          >
            <rect
              x="18"
              y="0"
              width="28"
              height="14"
              rx="4"
              fill="#0f172a"
              stroke="#64748b"
              strokeWidth="2.5"
            />
            <circle cx="32" cy="7" r="3" fill="#cbd5e1" />

            {/* GSAP Deflecting White Clicker Peg */}
            <g id="peg-group" ref={pegRef} transform="rotate(0 32 16)">
              <path
                d="M 24 16 L 40 16 L 35 54 L 32 68 L 29 54 Z"
                fill="#ffffff"
                stroke="#94a3b8"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <circle
                cx="32"
                cy="16"
                r="6"
                fill="#334155"
                stroke="#cbd5e1"
                strokeWidth="2.5"
              />
              <circle cx="32" cy="16" r="2.5" fill="#f8fafc" />
            </g>
          </svg>
        </div>

        {/* HIGH-DPI SVG PHYSICAL PRIZE WHEEL */}
        <div className="relative w-full h-full flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
              <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
              <span className="text-[10px] font-black tracking-widest uppercase">
                Loading Wheel...
              </span>
            </div>
          ) : (
            <svg
              viewBox="0 0 500 500"
              className="w-full h-full select-none"
              style={{ overflow: "visible" }}
            >
              <defs>
                <filter
                  id={`${gradientIdPrefix}_wheelShadow`}
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="140%"
                >
                  <feDropShadow
                    dx="0"
                    dy="16"
                    stdDeviation="16"
                    floodColor="#000000"
                    floodOpacity="0.9"
                  />
                </filter>
                <filter
                  id={`${gradientIdPrefix}_pegShadow`}
                  x="-40%"
                  y="-40%"
                  width="180%"
                  height="180%"
                >
                  <feDropShadow
                    dx="0"
                    dy="3"
                    stdDeviation="4"
                    floodColor="#000000"
                    floodOpacity="0.7"
                  />
                </filter>

                {/* Slices Gradients */}
                {slices.map((pkmn, idx) => {
                  const type = OFFICIAL_POKEMON_TYPES.find(
                    (t) => t.id === pkmn.primaryType
                  );
                  const pColor = type?.primaryColor || "#3b82f6";
                  const sColor = type?.secondaryColor || "#1d4ed8";
                  return (
                    <linearGradient
                      key={`${pkmn.id}_${idx}`}
                      id={`${gradientIdPrefix}_sliceGrad_${idx}`}
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={pColor} />
                      <stop offset="100%" stopColor={sColor} />
                    </linearGradient>
                  );
                })}
              </defs>

              {/* HEAVY BLACK RIM WITH GOLD BEVEL */}
              <circle
                cx="250"
                cy="250"
                r="246"
                fill="#090d16"
                stroke="#1e293b"
                strokeWidth="8"
                filter={`url(#${gradientIdPrefix}_wheelShadow)`}
              />
              <circle
                cx="250"
                cy="250"
                r="238"
                fill="none"
                stroke="#d97706"
                strokeWidth="3.5"
                opacity="0.8"
              />

              {/* ROTATING WHEEL GROUP */}
              <g id="wheel-spindle" ref={wheelGroupRef} transform="rotate(0 250 250)">
                {slices.map((pkmn, idx) => {
                  const startA = idx * sliceAngle - 90;
                  const endA = (idx + 1) * sliceAngle - 90;
                  const midA = startA + sliceAngle / 2;

                  const startRad = (startA * Math.PI) / 180;
                  const endRad = (endA * Math.PI) / 180;

                  const R = 236;
                  const x1 = 250 + R * Math.cos(startRad);
                  const y1 = 250 + R * Math.sin(startRad);
                  const x2 = 250 + R * Math.cos(endRad);
                  const y2 = 250 + R * Math.sin(endRad);

                  const largeArc = sliceAngle > 180 ? 1 : 0;
                  const pathData = `M 250 250 L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`;

                  return (
                    <g key={`wedge_${pkmn.id}_${idx}`}>
                      <path
                        d={pathData}
                        fill={`url(#${gradientIdPrefix}_sliceGrad_${idx})`}
                        stroke="#0a0f1d"
                        strokeWidth="2.5"
                      />

                      {/* Content inside Wedge: Clean, properly spaced, non-overlapping */}
                      <g
                        transform={`rotate(${midA + 90} 250 250)`}
                        className="select-none pointer-events-none"
                      >
                        {/* 1. Pokémon Sprite (Near outer rim) */}
                        <image
                          href={pkmn.spriteUrl || pkmn.artworkUrl}
                          x="225"
                          y="40"
                          width="50"
                          height="50"
                          preserveAspectRatio="xMidYMid meet"
                          className="filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)]"
                        />

                        {/* 2. Type Icon Badge */}
                        <image
                          href={getTypeIconUrl(pkmn.primaryType)}
                          x="240"
                          y="94"
                          width="20"
                          height="20"
                          preserveAspectRatio="xMidYMid meet"
                          className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                        />

                        {/* 3. Pokémon Name */}
                        <text
                          x="250"
                          y="124"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize={N > 12 ? "9" : "11"}
                          fontWeight="900"
                          className="uppercase tracking-tight"
                          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.95))"
                        >
                          {pkmn.name.length > 8
                            ? `${pkmn.name.slice(0, 7)}.`
                            : pkmn.name}
                        </text>

                        {/* 4. YouTuber Pack Hunt Label: Perfectly proportioned to NEVER overlap */}
                        {pkmn.customLabel && (
                          <g>
                            <rect
                              x={250 - maxPillWidth / 2}
                              y="132"
                              width={maxPillWidth}
                              height="14"
                              rx="7"
                              fill="#facc15"
                              stroke="#ca8a04"
                              strokeWidth="0.8"
                              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
                            />
                            <text
                              x="250"
                              y="142.5"
                              textAnchor="middle"
                              fill="#0f172a"
                              fontSize={N > 14 ? "7" : "8"}
                              fontWeight="900"
                              letterSpacing="0.02em"
                            >
                              {pkmn.customLabel.length > 9
                                ? `${pkmn.customLabel.slice(0, 8)}.`
                                : pkmn.customLabel}
                            </text>
                          </g>
                        )}
                      </g>
                    </g>
                  );
                })}

                {/* METALLIC BRASS PEGS (At slice boundaries) */}
                {slices.map((_, idx) => {
                  const angle = idx * sliceAngle - 90;
                  const rad = (angle * Math.PI) / 180;
                  const pegR = 238;
                  const px = 250 + pegR * Math.cos(rad);
                  const py = 250 + pegR * Math.sin(rad);

                  return (
                    <g
                      key={`peg_${idx}`}
                      filter={`url(#${gradientIdPrefix}_pegShadow)`}
                    >
                      <circle
                        cx={px}
                        cy={py}
                        r="4.5"
                        fill="#fbbf24"
                        stroke="#78350f"
                        strokeWidth="1.5"
                      />
                      <circle cx={px} cy={py} r="1.5" fill="#fef3c7" />
                    </g>
                  );
                })}
              </g>

              {/* CENTER CAP: METALLIC POKÉBALL HUB */}
              <circle
                cx="250"
                cy="250"
                r="44"
                fill="#090d16"
                stroke="#334155"
                strokeWidth="4"
                filter="drop-shadow(0 8px 16px rgba(0,0,0,0.8))"
              />
              <path d="M 210 250 A 40 40 0 0 1 290 250 Z" fill="#ef4444" />
              <path d="M 210 250 A 40 40 0 0 0 290 250 Z" fill="#f8fafc" />
              <line
                x1="210"
                y1="250"
                x2="290"
                y2="250"
                stroke="#090d16"
                strokeWidth="7"
              />
              <circle cx="250" cy="250" r="14" fill="#090d16" />
              <circle
                cx="250"
                cy="250"
                r="9"
                fill="#ffffff"
                stroke="#94a3b8"
                strokeWidth="2"
              />
              <circle cx="250" cy="250" r="3.5" fill="#e2e8f0" />
            </svg>
          )}
        </div>

        {/* MASSIVE GLOWING SPIN BUTTON */}
        <div className="mt-2.5 sm:mt-4 w-full flex justify-center">
          <button
            disabled={isSpinning || isLoading || slices.length < 2}
            onClick={() => spinWheel(0)}
            className={`group relative overflow-hidden w-full max-w-sm py-3.5 sm:py-4 px-6 sm:px-8 rounded-2xl font-black text-base sm:text-lg uppercase tracking-wider text-white shadow-2xl flex items-center justify-center gap-2.5 transition-all transform active:scale-95 ${
              isSpinning
                ? "bg-slate-800/80 cursor-not-allowed opacity-70"
                : "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:brightness-110 shadow-[0_10px_35px_rgba(245,158,11,0.4)]"
            }`}
          >
            <div className="absolute inset-0 holo-gradient pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity" />
            <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
            <span>{isSpinning ? "SPINNING PRIZE WHEEL..." : "SPIN THE WHEEL!"}</span>
          </button>
        </div>
      </div>

      {/* WINNER SHOWCASE MODAL */}
      <AnimatePresence>
        {showWinnerModal && winner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 30 }}
              className="relative w-full max-w-sm sm:max-w-md rounded-3xl bg-slate-900 border-2 border-amber-500/80 shadow-[0_0_60px_rgba(245,158,11,0.3)] p-5 sm:p-6 text-center text-white overflow-hidden"
            >
              <button
                onClick={() => setShowWinnerModal(false)}
                className="absolute top-3.5 right-3.5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider mb-2">
                <Award className="w-4 h-4 text-amber-400" />
                Wheel Champion!
              </div>

              {/* Official Artwork */}
              <div className="w-40 h-40 sm:w-48 sm:h-48 mx-auto my-2 flex items-center justify-center">
                <Image
                  src={winner.artworkUrl}
                  alt={winner.name}
                  width={180}
                  height={180}
                  className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)]"
                  unoptimized
                />
              </div>

              {/* Name & Dex */}
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                  {winner.dexNumber}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black capitalize text-white">
                  {winner.name}
                </h3>
              </div>

              {/* Pack Rule */}
              {winner.customLabel && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md">
                  <PackageOpen className="w-4 h-4 text-slate-950" />
                  RULE: {winner.customLabel}
                </div>
              )}

              {/* Base Stats Pills */}
              {winner.stats && (
                <div className="mt-3 grid grid-cols-4 gap-1.5 text-xs">
                  <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-rose-400 font-bold">HP</div>
                    <div className="font-black text-white">{winner.stats.hp}</div>
                  </div>
                  <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-amber-400 font-bold">ATK</div>
                    <div className="font-black text-white">{winner.stats.attack}</div>
                  </div>
                  <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-blue-400 font-bold">DEF</div>
                    <div className="font-black text-white">{winner.stats.defense}</div>
                  </div>
                  <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-emerald-400 font-bold">SPD</div>
                    <div className="font-black text-white">{winner.stats.speed}</div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-5 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setShowWinnerModal(false);
                    spinWheel(0);
                  }}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 text-white shadow-md flex items-center justify-center gap-2 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  Spin Again
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={removeWinnerSlice}
                    className="py-2 px-3 rounded-xl font-semibold text-xs bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 flex items-center justify-center gap-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                  <button
                    onClick={() => {
                      setShowWinnerModal(false);
                      reRollPool(selectedTypeFilter);
                    }}
                    className="py-2 px-3 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    Re-Roll Pool
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WHEEL CUSTOMIZER DRAWER */}
      <AnimatePresence>
        {isCustomizerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-lg h-full bg-slate-900 border-l border-white/10 flex flex-col shadow-2xl text-white"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-base sm:text-lg">Wheel Customizer</h3>
                </div>
                <button
                  onClick={() => setIsCustomizerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                {/* 1. Slices Count Slider */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-200">
                      Slice Count ({sliceCount})
                    </span>
                    <span className="text-[11px] text-slate-400">Min: 2 &bull; Max: 24</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="24"
                    value={sliceCount}
                    onChange={(e) =>
                      updateSliceCount(parseInt(e.target.value, 10))
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 font-mono">
                    <span>2</span>
                    <span>10 (Default)</span>
                    <span>24</span>
                  </div>
                </div>

                {/* 2. Type Generator Filter */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-xs sm:text-sm font-bold text-slate-200 block mb-2">
                    Generate Wheel by Pokémon Type
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1">
                    <button
                      onClick={() => {
                        setSelectedTypeFilter("all");
                        reRollPool("all");
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition ${
                        selectedTypeFilter === "all"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      All Types
                    </button>
                    {OFFICIAL_POKEMON_TYPES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setSelectedTypeFilter(t.id);
                          reRollPool(t.id);
                        }}
                        className="py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                        style={{
                          backgroundColor:
                            selectedTypeFilter === t.id
                              ? t.primaryColor
                              : "#1e293b",
                          color: "#ffffff",
                        }}
                      >
                        {t.displayName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Quick Pack Hunt Presets */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-xs sm:text-sm font-bold text-slate-200 block mb-2">
                    YouTuber Pack Hunt Rules
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={applyEscalatorPreset}
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <PackageOpen className="w-3.5 h-3.5" />
                      Apply Escalator
                    </button>
                    <button
                      onClick={() => {
                        setSlices((prev) =>
                          prev.map((s) => ({ ...s, customLabel: "" }))
                        );
                      }}
                      className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold transition"
                    >
                      Clear Labels
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
                {onOpenTypeManager && (
                  <button
                    onClick={onOpenTypeManager}
                    className="text-xs font-bold text-amber-400 hover:underline"
                  >
                    Custom Logos
                  </button>
                )}
                <button
                  onClick={() => setIsCustomizerOpen(false)}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
