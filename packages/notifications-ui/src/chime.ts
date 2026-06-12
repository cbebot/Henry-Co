/**
 * The canonical Henry Onyx notification chime — Web Audio, calm and premium.
 *
 * Lives in the shared notification design system so the live toast viewport
 * (@henryco/dashboard-shell) and the settings "test sound" control
 * (apps/account) play the SAME sound. One chime, one place.
 *
 * Design:
 *   - Each note is a warm voice: a sine fundamental + a quiet octave partial,
 *     rounded by a gentle low-pass — richer than a bare sine, never harsh.
 *   - A short, soft attack (~14ms) and exponential release; the whole gesture
 *     is < 600ms so it never overstays.
 *   - Master gain stays low (peak ≤ 0.05) so it sits under media volume.
 *   - Two severity-aware voicings:
 *       "default" — info/success/warning: a calm ascending perfect fourth.
 *       "high"    — urgent/security: a brighter rising fifth→octave, a touch
 *                   more present but never alarming.
 *   - AudioContext is created lazily on first gesture; calling before unlock
 *     returns false instead of throwing. All errors are swallowed — the audio
 *     path must never spam the console or break notification delivery.
 */

export type ChimeVariant = "default" | "high" | "action-success" | "action-error";

type Voice = { freq: number; at: number; dur: number; gain: number };

const VOICINGS: Record<ChimeVariant, { peak: number; voices: Voice[] }> = {
  // Ascending perfect fourth (A5 → D6). Warm, unobtrusive, "something arrived".
  default: {
    peak: 0.04,
    voices: [
      { freq: 880.0, at: 0.0, dur: 0.3, gain: 1.0 },
      { freq: 1174.7, at: 0.13, dur: 0.34, gain: 0.92 },
    ],
  },
  // Rising fifth → octave (A5 → E6 → A6). Brighter and more present for
  // urgent / security, but the same soft envelope keeps it calm, not an alarm.
  high: {
    peak: 0.05,
    voices: [
      { freq: 880.0, at: 0.0, dur: 0.28, gain: 1.0 },
      { freq: 1318.5, at: 0.12, dur: 0.3, gain: 0.95 },
      { freq: 1760.0, at: 0.26, dur: 0.34, gain: 0.8 },
    ],
  },
  // The Onyx action motif (V3-FEEDBACK-01) — "done, and done well".
  // Ascending perfect fifth (A5 → E6): same root and same instrument as the
  // notification fourth so it is unmistakably the same product, but a wider,
  // more affirming interval for something the USER just completed. Quieter
  // than an arrival (an action chime confirms, it never announces) and the
  // whole gesture resolves inside 400ms.
  "action-success": {
    peak: 0.035,
    voices: [
      { freq: 880.0, at: 0.0, dur: 0.2, gain: 1.0 },
      { freq: 1318.5, at: 0.1, dur: 0.26, gain: 0.9 },
    ],
  },
  // A single low D4 — neutral, grounded, never a buzzer. The same warm voice
  // an octave-cluster lower simply says "that didn't go through"; the toast
  // carries the explanation, the sound only sets the register.
  "action-error": {
    peak: 0.035,
    voices: [{ freq: 293.66, at: 0.0, dur: 0.3, gain: 1.0 }],
  },
};

const SignalAudio = (() => {
  let context: AudioContext | null = null;
  let unlocked = false;

  function getCtor(): typeof AudioContext | null {
    if (typeof window === "undefined") return null;
    const w = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    return w.AudioContext ?? w.webkitAudioContext ?? null;
  }

  function ensureContext(): AudioContext | null {
    if (context) return context;
    const Ctor = getCtor();
    if (!Ctor) return null;
    try {
      context = new Ctor();
    } catch {
      context = null;
    }
    return context;
  }

  /**
   * Call on the first user gesture (click, keydown, touch). Required by the
   * Chrome / Safari autoplay policy — without it the context stays "suspended"
   * and the chime is silent. Safe to call repeatedly.
   */
  async function unlock(): Promise<boolean> {
    const ctx = ensureContext();
    if (!ctx) return false;
    try {
      if (ctx.state === "suspended") await ctx.resume();
      unlocked = ctx.state === "running";
      return unlocked;
    } catch {
      return false;
    }
  }

  function isSupported(): boolean {
    return getCtor() !== null;
  }

  function isUnlocked(): boolean {
    return unlocked && context?.state === "running";
  }

  /** One warm voice: sine fundamental + quiet octave, soft exponential envelope. */
  function scheduleVoice(
    ctx: AudioContext,
    destination: AudioNode,
    voice: Voice,
    peak: number,
  ): void {
    const startAt = ctx.currentTime + voice.at;
    const attack = 0.014;
    const release = Math.max(0.16, voice.dur - attack);
    const amp = Math.max(0.0001, peak * voice.gain);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(amp, startAt + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + attack + release);
    gain.connect(destination);

    const fundamental = ctx.createOscillator();
    fundamental.type = "sine";
    fundamental.frequency.setValueAtTime(voice.freq, startAt);
    fundamental.connect(gain);

    // Quiet octave partial for warmth — its own gentle gain so it colours
    // rather than competes with the fundamental.
    const octave = ctx.createOscillator();
    const octaveGain = ctx.createGain();
    octave.type = "sine";
    octave.frequency.setValueAtTime(voice.freq * 2, startAt);
    octaveGain.gain.setValueAtTime(0.28, startAt);
    octave.connect(octaveGain);
    octaveGain.connect(gain);

    const stopAt = startAt + attack + release + 0.05;
    fundamental.start(startAt);
    fundamental.stop(stopAt);
    octave.start(startAt);
    octave.stop(stopAt);
  }

  /**
   * Play the chime. Returns false if the context is unavailable, locked, or
   * playback fails.
   */
  function playChime(variant: ChimeVariant = "default"): boolean {
    const ctx = ensureContext();
    if (!ctx || ctx.state !== "running") return false;

    try {
      const voicing = VOICINGS[variant] ?? VOICINGS.default;

      // A gentle low-pass rounds the highs so the chime reads as warm, not
      // glassy, on bright laptop speakers.
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.setValueAtTime(3600, ctx.currentTime);
      lowpass.Q.setValueAtTime(0.7, ctx.currentTime);
      lowpass.connect(ctx.destination);

      for (const voice of voicing.voices) {
        scheduleVoice(ctx, lowpass, voice, voicing.peak);
      }
      return true;
    } catch {
      return false;
    }
  }

  /** Best-effort cleanup — used by tests and HMR cleanup paths only. */
  function dispose(): void {
    try {
      void context?.close();
    } catch {
      // ignore
    }
    context = null;
    unlocked = false;
  }

  return { unlock, isSupported, isUnlocked, playChime, dispose };
})();

export const signalAudio = SignalAudio;
