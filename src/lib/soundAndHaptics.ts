// Procedural Web Audio API + Haptics Engine
// 100% synthesized - zero external MP3 dependencies

let audioCtx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;
let isAudioMuted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Pre-generate 0.1s of white noise for fast mechanical snap playback
function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const bufferSize = Math.floor(ctx.sampleRate * 0.05); // 50ms of noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return buffer;
}

export function setMuted(muted: boolean) {
  isAudioMuted = muted;
  if (typeof window !== "undefined") {
    localStorage.setItem("poke_audio_muted", muted ? "true" : "false");
  }
}

export function getMuted(): boolean {
  if (typeof window !== "undefined") {
    return localStorage.getItem("poke_audio_muted") === "true";
  }
  return false;
}

/**
 * Procedural mechanical plastic clicker sound
 * Combines high-passed noise burst with a resonant square/triangle pop
 */
export function playTick(pitchMultiplier = 1.0) {
  if (isAudioMuted || getMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // 1. Mechanical snap - noise through bandpass
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(2800 * pitchMultiplier, now);
    noiseFilter.Q.setValueAtTime(4.0, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.016); // 16ms decay

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.02);

    // 2. Plastic body "thud / thwack" oscillator
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(450 * pitchMultiplier, now);
    osc.frequency.exponentialRampToValueAtTime(110 * pitchMultiplier, now + 0.018);

    oscGain.gain.setValueAtTime(0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.022);
  } catch {
    // Ignore audio errors during rapid trigger
  }
}

/**
 * Triumphant major chord fanfare arpeggio + shimmer
 * Used when lock-in occurs
 */
export function playWinFanfare() {
  if (isAudioMuted || getMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Notes: C5 (523.25), E5 (659.25), G5 (783.99), B5 (987.77), C6 (1046.50), G6 (1567.98)
    const notes = [
      { freq: 523.25, time: 0.0, dur: 0.28 },
      { freq: 659.25, time: 0.08, dur: 0.28 },
      { freq: 783.99, time: 0.16, dur: 0.35 },
      { freq: 1046.5, time: 0.25, dur: 0.75 },
      { freq: 1318.51, time: 0.35, dur: 0.8 },
      { freq: 1567.98, time: 0.42, dur: 1.1 },
    ];

    notes.forEach(({ freq, time, dur }) => {
      const start = now + time;

      // Primary tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + dur + 0.05);

      // Shimmer harmonic (sine an octave up)
      const shimmer = ctx.createOscillator();
      const sGain = ctx.createGain();
      shimmer.type = "sine";
      shimmer.frequency.setValueAtTime(freq * 2, start);

      sGain.gain.setValueAtTime(0.001, start);
      sGain.gain.linearRampToValueAtTime(0.08, start + 0.03);
      sGain.gain.exponentialRampToValueAtTime(0.0001, start + dur * 0.9);

      shimmer.connect(sGain);
      sGain.connect(ctx.destination);

      shimmer.start(start);
      shimmer.stop(start + dur + 0.05);
    });
  } catch {
    // Ignore audio errors
  }
}

/**
 * Fast whoosh / transition sweep sound
 */
export function playWhoosh() {
  if (isAudioMuted || getMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.18);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.23);
  } catch {}
}

/**
 * Vibration / Haptics API wrapper
 * @param pattern number | number[] - duration or pulse array
 */
export function triggerHaptic(pattern: number | number[] = 12) {
  if (typeof window === "undefined" || typeof navigator === "undefined") return;
  try {
    if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
    }
  } catch {
    // Desktop or unsupported platform safe fallback
  }
}

