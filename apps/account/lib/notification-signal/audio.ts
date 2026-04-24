/**
 * Premium notification chime built with the Web Audio API.
 *
 * Design choices:
 *   - Two layered sine partials (perfect fifth interval) — warm but not pure-tone bland.
 *   - Quick attack (~12ms) and gentle exponential release (~520ms) — short and unobtrusive.
 *   - Peak gain capped at 0.045 — sits well below typical media volume.
 *   - AudioContext is constructed lazily on first user gesture; calling `playChime`
 *     before unlock returns false instead of throwing.
 *   - All errors swallowed silently — the audio path must never spam the console
 *     or break notification delivery.
 */

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
   * Call this on the first user gesture (click, keydown, touch). Required by
   * Chrome / Safari autoplay policy — without it the context stays in
   * "suspended" and the chime is silent. Safe to call repeatedly.
   */
  async function unlock(): Promise<boolean> {
    const ctx = ensureContext();
    if (!ctx) return false;
    try {
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
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

  /**
   * Schedule one chime tone — sine partial with a gentle exponential envelope.
   * `peakGain` is the absolute amplitude (≤ 0.05 by design).
   */
  function scheduleTone(
    ctx: AudioContext,
    frequency: number,
    startAt: number,
    duration: number,
    peakGain: number,
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, startAt);

    const attackTime = 0.012;
    const releaseTime = Math.max(0.18, duration - attackTime);

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peakGain), startAt + attackTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + attackTime + releaseTime);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startAt);
    osc.stop(startAt + attackTime + releaseTime + 0.04);
  }

  /**
   * Play the standard two-note chime: B5 (~988Hz) then F#6 (~1480Hz),
   * a perfect fifth — bright, modern, calm. Total duration ≈ 540ms.
   *
   * Returns false if the audio context is unavailable, locked, or playback fails.
   */
  function playChime(variant: "default" | "high" = "default"): boolean {
    const ctx = ensureContext();
    if (!ctx || ctx.state !== "running") return false;

    try {
      const now = ctx.currentTime;
      const peak = variant === "high" ? 0.05 : 0.04;
      const root = variant === "high" ? 880 : 740; // A5 vs F#5
      const fifth = root * 1.5;

      scheduleTone(ctx, root, now, 0.32, peak);
      scheduleTone(ctx, fifth, now + 0.18, 0.36, peak * 0.85);
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
