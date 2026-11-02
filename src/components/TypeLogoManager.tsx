"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  OFFICIAL_POKEMON_TYPES,
  getTypeIconUrl,
  setCustomTypeLogo,
  resetCustomTypeLogo,
  getCustomTypeLogo,
} from "@/lib/pokeApi";
import { X, Upload, RotateCcw, Check, Sparkles } from "lucide-react";

interface TypeLogoManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onLogosUpdated?: () => void;
}

export function TypeLogoManager({
  isOpen,
  onClose,
  onLogosUpdated,
}: TypeLogoManagerProps) {
  const [customLogos, setCustomLogos] = useState<Record<string, string | null>>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Load active custom logos on open
  useEffect(() => {
    if (isOpen) {
      const logos: Record<string, string | null> = {};
      OFFICIAL_POKEMON_TYPES.forEach((t) => {
        logos[t.id] = getCustomTypeLogo(t.id);
      });
      setCustomLogos(logos);
    }
  }, [isOpen]);

  const handleFileUpload = (typeId: string, file: File) => {
    if (!file) return;

    // Check size limit (max 1.5MB for localStorage safety)
    if (file.size > 1.5 * 1024 * 1024) {
      alert("Please upload an image smaller than 1.5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setCustomTypeLogo(typeId, result);
        setCustomLogos((prev) => ({ ...prev, [typeId]: result }));
        setSuccessToast(`Custom ${typeId.toUpperCase()} logo uploaded!`);
        setTimeout(() => setSuccessToast(null), 2500);
        if (onLogosUpdated) onLogosUpdated();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetType = (typeId: string) => {
    resetCustomTypeLogo(typeId);
    setCustomLogos((prev) => ({ ...prev, [typeId]: null }));
    setSuccessToast(`Reset ${typeId.toUpperCase()} logo to default SVG.`);
    setTimeout(() => setSuccessToast(null), 2500);
    if (onLogosUpdated) onLogosUpdated();
  };

  const handleResetAll = () => {
    if (confirm("Reset all 18 custom type logos to default official SVGs?")) {
      OFFICIAL_POKEMON_TYPES.forEach((t) => resetCustomTypeLogo(t.id));
      const resetObj: Record<string, string | null> = {};
      OFFICIAL_POKEMON_TYPES.forEach((t) => {
        resetObj[t.id] = null;
      });
      setCustomLogos(resetObj);
      setSuccessToast("All type logos reset to official SVGs.");
      setTimeout(() => setSuccessToast(null), 2500);
      if (onLogosUpdated) onLogosUpdated();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Type Logo & Brand Manager
              </h2>
              <p className="text-xs text-slate-400">
                Upload your custom YouTuber / channel branding PNG or SVG logos for any of the 18 Pokémon types.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success toast */}
        {successToast && (
          <div className="mx-6 mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-emerald-300 text-xs font-semibold animate-in slide-in-from-top duration-200">
            <Check className="w-4 h-4 text-emerald-400" />
            {successToast}
          </div>
        )}

        {/* Content - 18 types grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {OFFICIAL_POKEMON_TYPES.map((type) => {
            const hasCustom = Boolean(customLogos[type.id]);
            const iconUrl = customLogos[type.id] || getTypeIconUrl(type.id);

            return (
              <div
                key={type.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition group"
                style={{
                  borderLeftWidth: "4px",
                  borderLeftColor: type.primaryColor,
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center p-1.5 shadow-inner"
                    style={{ backgroundColor: type.bgRgba }}
                  >
                    <Image
                      src={iconUrl}
                      alt={type.displayName}
                      width={32}
                      height={32}
                      className="w-full h-full object-contain filter drop-shadow"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-sm block truncate text-slate-100">
                      {type.displayName}
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {hasCustom ? (
                        <span className="text-amber-400 font-medium">Custom Logo</span>
                      ) : (
                        "Official SVG"
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Upload button */}
                  <label className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition">
                    <Upload className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/png, image/svg+xml, image/jpeg, image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(type.id, file);
                      }}
                    />
                  </label>

                  {/* Reset button */}
                  {hasCustom && (
                    <button
                      onClick={() => handleResetType(type.id)}
                      title="Reset to default official SVG"
                      className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90 text-xs text-slate-400">
          <div>
            Files can also be placed into <code className="text-amber-400">/public/types/{`{type}`}.png</code>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleResetAll}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition"
            >
              Reset All to Defaults
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 shadow-lg shadow-blue-500/20 transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

