"use client";

import React, { useState, useEffect } from "react";
import { RapidDrafter } from "@/components/RapidDrafter";
import { SpinningWheel } from "@/components/SpinningWheel";
import { TypeLogoManager } from "@/components/TypeLogoManager";
import {
  PokemonSummary,
  getPokemonListByType,
  getPokemonById,
  getRandomElements,
} from "@/lib/pokeApi";
import { setMuted, getMuted } from "@/lib/soundAndHaptics";
import {
  Sparkles,
  Smartphone,
  Volume2,
  VolumeX,
  Palette,
  Disc,
  Zap,
  Minimize2,
  Radio,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"drafter" | "wheel">("wheel");
  const [isShortsMode, setIsShortsMode] = useState<boolean>(false);
  const [isMuted, setIsMutedState] = useState<boolean>(false);
  const [isTypeManagerOpen, setIsTypeManagerOpen] = useState<boolean>(false);
  const [wheelSeedList, setWheelSeedList] = useState<PokemonSummary[] | undefined>(
    undefined
  );

  // Sync mute state on mount
  useEffect(() => {
    setIsMutedState(getMuted());
  }, []);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMutedState(next);
    setMuted(next);
  };

  // Transfer single drawn Pokémon to wheel
  const handleSendToWheel = (pokemon: PokemonSummary) => {
    setWheelSeedList((prev) => {
      const base = prev && prev.length > 0 ? prev : [];
      const filtered = base.filter((p) => p.id !== pokemon.id);
      return [pokemon, ...filtered].slice(0, 24);
    });
    setActiveTab("wheel");
  };

  // Load 10 drawn type Pokémon into wheel
  const handleLoadTypeToWheel = async (typeId: string) => {
    try {
      const validIds = await getPokemonListByType(typeId);
      const chosenIds = getRandomElements(validIds, 10);
      const pkmnList = await Promise.all(
        chosenIds.map((id) => getPokemonById(id).catch(() => getPokemonById(25)))
      );
      setWheelSeedList(pkmnList);
      setActiveTab("wheel");
    } catch (err) {
      console.error("Failed to load type into wheel:", err);
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col bg-[#030611] text-slate-100 overflow-x-hidden selection:bg-rose-500 selection:text-white font-sans">
      {/* AMBIENT BACKGROUND GLOWS & GRID */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.7) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />

        <div className="absolute -top-32 left-1/4 w-[650px] h-[650px] bg-rose-600/12 rounded-full blur-[150px] neon-pulse" />
        <div
          className="absolute top-1/3 -right-24 w-[600px] h-[600px] bg-blue-600/12 rounded-full blur-[150px] neon-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute -bottom-24 left-1/3 w-[650px] h-[650px] bg-amber-500/10 rounded-full blur-[170px] neon-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* FLOATING SHORTS MODE EXIT PILL */}
      {isShortsMode && (
        <div className="fixed top-3 right-3 z-50 animate-in fade-in duration-200">
          <button
            onClick={() => setIsShortsMode(false)}
            className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-bold backdrop-blur-xl shadow-xl transition-all"
          >
            <Minimize2 className="w-3.5 h-3.5 text-rose-400 group-hover:rotate-90 transition-transform" />
            <span>Exit 9:16 Shorts</span>
          </button>
        </div>
      )}

      {/* MOBILE-FIRST STUDIO HEADER */}
      {!isShortsMode && (
        <header className="relative z-30 border-b border-white/[0.08] bg-slate-950/85 backdrop-blur-2xl sticky top-0 transition-all">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col gap-2.5">
            {/* Top Row: Branding on left, Action tools on right */}
            <div className="flex items-center justify-between gap-2">
              {/* Branding */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-white/20 p-1.5 flex items-center justify-center shadow-inner">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400 filter drop-shadow-[0_0_8px_#f59e0b]" />
                </div>
                <div>
                  <h1 className="text-sm sm:text-lg font-black tracking-tight text-white uppercase flex items-center gap-1">
                    PokéDraft
                    <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                      Studio
                    </span>
                  </h1>
                </div>
              </div>

              {/* Utility Tools */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Type Logos Manager */}
                <button
                  onClick={() => setIsTypeManagerOpen(true)}
                  title="Manage Custom Type Logos"
                  className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Palette className="w-4 h-4 text-amber-400" />
                  <span className="hidden md:inline">Logos</span>
                </button>

                {/* Sound Toggle */}
                <button
                  onClick={toggleMute}
                  title={isMuted ? "Unmute Sound Effects" : "Mute Sound Effects"}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition shadow-sm ${
                    isMuted
                      ? "bg-slate-900/90 hover:bg-slate-800 text-rose-400 border-rose-500/30"
                      : "bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-white/10"
                  }`}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="hidden md:inline">
                    {isMuted ? "Muted" : "Sound ON"}
                  </span>
                </button>

                {/* Shorts Mode Toggle */}
                <button
                  onClick={() => setIsShortsMode(true)}
                  title="YouTube Shorts 9:16 Mode"
                  className="p-2 sm:px-3 sm:py-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:brightness-110 text-white text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-1.5 transition"
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="hidden sm:inline">Shorts 9:16</span>
                </button>
              </div>
            </div>

            {/* Bottom Row on Mobile / Main Segmented Tabs */}
            <div className="w-full flex items-center p-1 bg-slate-900/95 border border-white/10 rounded-2xl shadow-inner">
              <button
                onClick={() => setActiveTab("drafter")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 ${
                  activeTab === "drafter"
                    ? "bg-gradient-to-r from-rose-500 via-pink-600 to-orange-500 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Rapid Drafter</span>
              </button>
              <button
                onClick={() => setActiveTab("wheel")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 ${
                  activeTab === "wheel"
                    ? "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Disc className="w-4 h-4 fill-current" />
                <span>Prize Wheel</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* MAIN STAGE */}
      <div
        className={`relative z-10 flex-1 flex flex-col items-center justify-center ${
          isShortsMode ? "p-0 min-h-screen" : "py-4 sm:py-8 px-2 sm:px-6"
        }`}
      >
        <AnimatePresence mode="wait">
          {activeTab === "drafter" ? (
            <motion.div
              key="view-drafter"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="w-full flex justify-center"
            >
              <RapidDrafter
                onSendToWheel={handleSendToWheel}
                onLoadTypeToWheel={handleLoadTypeToWheel}
                isShortsMode={isShortsMode}
              />
            </motion.div>
          ) : (
            <motion.div
              key="view-wheel"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="w-full flex justify-center"
            >
              <SpinningWheel
                initialPokemonList={wheelSeedList}
                isShortsMode={isShortsMode}
                onOpenTypeManager={() => setIsTypeManagerOpen(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FOOTER (Hidden in Shorts Recording Mode) */}
      {!isShortsMode && (
        <footer className="hidden relative z-20 border-t border-white/[0.06] bg-slate-950/80 backdrop-blur-xl py-3 px-4 text-center text-[11px] text-slate-500">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5">
            <div>Built for Pokémon TCG YouTubers &bull; Stateless</div>
            <div className="font-mono text-slate-400">
              National Dex #0001 &ndash; #1025
            </div>
          </div>
        </footer>
      )}

      {/* Custom Type Logo Manager Modal */}
      <TypeLogoManager
        isOpen={isTypeManagerOpen}
        onClose={() => setIsTypeManagerOpen(false)}
      />
    </main>
  );
}
