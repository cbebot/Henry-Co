/**
 * Henry Onyx — bespoke arena sound, synthesized entirely with the Web Audio API.
 *
 * No samples, no libraries, no imitation: every cue is generated from oscillators
 * + envelopes so the sonic identity is our own. The signature is a rising perfect
 * fifth (3:2) — an "onyx" motif that recurs in the place and win cues. The player's
 * move rings BRIGHT (high FM bell); the AI's is DARKER/warmer, so the two are
 * distinguishable by ear alone.
 *
 * One shared AudioContext (browsers cap ~6). Audio only starts after a user
 * gesture (autoplay policy). Quiet-by-default for reduced-motion users; mute +
 * volume persist to localStorage. SSR-safe (every entry guards on `window`).
 */
export type SoundCue = "place" | "place-ai" | "win" | "loss" | "threat" | "ui" | "ui-secondary";

const STORE_KEY = "henryco.arena.sound";
const MASTER = 0.6; // ~4-6 dB headroom under clipping

type State = { muted: boolean; volume: number };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let attached = false;
let lastUi = 0;
let state: State = { muted: false, volume: 0.5 };

const isBrowser = (): boolean => typeof window !== "undefined" && typeof window.AudioContext !== "undefined";

function loadState(): void {
  if (!isBrowser()) return;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<State>;
      state = { muted: !!parsed.muted, volume: typeof parsed.volume === "number" ? Math.min(1, Math.max(0, parsed.volume)) : 0.5 };
      return;
    }
  } catch {
    /* ignore corrupt prefs */
  }
  // no stored preference → quiet by default for reduced-motion users
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) state = { muted: true, volume: 0.5 };
}

function persist(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    /* storage may be unavailable */
  }
}

function getCtx(): AudioContext | null {
  if (!isBrowser()) return null;
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = state.muted ? 0 : state.volume * MASTER;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -10;
    comp.ratio.value = 4;
    comp.attack.value = 0.003;
    comp.release.value = 0.1;
    master.connect(comp);
    comp.connect(ctx.destination);
  }
  return ctx;
}

function unlock(): void {
  const c = getCtx();
  if (c && c.state === "suspended") void c.resume();
}

function autoAttach(): void {
  if (attached || !isBrowser()) return;
  attached = true;
  const handler = () => unlock();
  for (const ev of ["pointerdown", "keydown", "touchend", "click"]) {
    window.addEventListener(ev, handler, { once: true, passive: true });
  }
}

/** Click-free ADSR on a gain node: ramp up to peak, exponential decay to silence. */
function env(g: GainNode, t0: number, peak: number, attack: number, decay: number): void {
  const v = state.volume; // per-cue scaling is via peak; master holds global volume
  const p = Math.max(0.0001, peak * (0.5 + v * 0.5));
  g.gain.cancelScheduledValues(t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(p, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
  g.gain.setValueAtTime(0, t0 + attack + decay + 0.005);
}

/** One FM "bell" voice: modulator → carrier frequency, carrier → lowpass → env → master. */
function fmHit(opts: {
  carrier: number;
  ratio: number;
  depth0: number;
  depthDecay: number;
  peak: number;
  attack: number;
  decay: number;
  lp: number;
  type?: OscillatorType;
}): void {
  const c = getCtx();
  if (!c || !master) return;
  const t = c.currentTime + 0.02;
  const car = c.createOscillator();
  car.type = opts.type ?? "sine";
  car.frequency.value = opts.carrier;
  const mod = c.createOscillator();
  mod.type = "sine";
  mod.frequency.value = opts.carrier * opts.ratio;
  const modGain = c.createGain();
  modGain.gain.setValueAtTime(opts.depth0, t);
  modGain.gain.exponentialRampToValueAtTime(0.0001, t + opts.depthDecay);
  mod.connect(modGain);
  modGain.connect(car.frequency);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = opts.lp;
  const amp = c.createGain();
  env(amp, t, opts.peak, opts.attack, opts.decay);
  car.connect(lp);
  lp.connect(amp);
  amp.connect(master);
  const end = t + opts.attack + opts.decay + 0.05;
  mod.start(t);
  car.start(t);
  mod.stop(end);
  car.stop(end);
}

/** A simple tone voice (osc → lowpass → env → master), optionally delayed/detuned. */
function tone(opts: {
  freq: number;
  type: OscillatorType;
  peak: number;
  attack: number;
  decay: number;
  lp?: number;
  at?: number;
  detune?: number;
  gainScale?: number;
}): void {
  const c = getCtx();
  if (!c || !master) return;
  const t = c.currentTime + 0.02 + (opts.at ?? 0);
  const osc = c.createOscillator();
  osc.type = opts.type;
  osc.frequency.value = opts.freq;
  if (opts.detune) osc.detune.value = opts.detune;
  const amp = c.createGain();
  env(amp, t, opts.peak * (opts.gainScale ?? 1), opts.attack, opts.decay);
  let node: AudioNode = osc;
  if (opts.lp) {
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = opts.lp;
    osc.connect(lp);
    node = lp;
  }
  node.connect(amp);
  amp.connect(master);
  const end = t + opts.attack + opts.decay + 0.05;
  osc.start(t);
  osc.stop(end);
}

function render(cue: SoundCue): void {
  switch (cue) {
    case "place":
      fmHit({ carrier: 783.99, ratio: 3.5, depth0: 600, depthDecay: 0.06, peak: 0.18, attack: 0.003, decay: 0.18, lp: 6000 });
      break;
    case "place-ai":
      fmHit({ carrier: 293.66, ratio: 2.01, depth0: 300, depthDecay: 0.09, peak: 0.2, attack: 0.004, decay: 0.26, lp: 2600 });
      break;
    case "win": {
      // rising perfect-fifth arpeggio with shimmer — the brand motif, triumphant
      const notes = [523.25, 783.99, 1046.5];
      notes.forEach((f, i) => {
        tone({ freq: f, type: "triangle", peak: 0.16, attack: 0.005, decay: 0.22, at: i * 0.09 });
        tone({ freq: f, type: "sine", peak: 0.16, attack: 0.005, decay: 0.22, at: i * 0.09, detune: 6, gainScale: 0.3 });
      });
      tone({ freq: 1318.51, type: "sine", peak: 0.07, attack: 0.005, decay: 0.3, at: 0.27, lp: 4000 });
      break;
    }
    case "loss": {
      // graceful falling fifth G4 → C4 with a settling sub-octave (consonant)
      tone({ freq: 392, type: "triangle", peak: 0.14, attack: 0.02, decay: 0.5, lp: 1800 });
      tone({ freq: 261.63, type: "triangle", peak: 0.14, attack: 0.02, decay: 0.6, at: 0.26, lp: 1800 });
      tone({ freq: 130.81, type: "sine", peak: 0.05, attack: 0.03, decay: 0.7, at: 0.26 });
      break;
    }
    case "threat": {
      // low minor-second double pulse — tasteful tension, felt more than heard
      for (let i = 0; i < 2; i += 1) {
        tone({ freq: 220, type: "sine", peak: 0.1, attack: 0.008, decay: 0.14, at: i * 0.18, lp: 900 });
        tone({ freq: 233.08, type: "sine", peak: 0.08, attack: 0.008, decay: 0.14, at: i * 0.18, lp: 900 });
      }
      break;
    }
    case "ui":
      tone({ freq: 880, type: "sine", peak: 0.07, attack: 0.001, decay: 0.01 });
      tone({ freq: 1760, type: "sine", peak: 0.07, attack: 0.001, decay: 0.01, gainScale: 0.2 });
      break;
    case "ui-secondary":
      tone({ freq: 660, type: "sine", peak: 0.06, attack: 0.001, decay: 0.012 });
      break;
  }
}

let loaded = false;
function ensureLoaded(): void {
  if (loaded) return;
  loaded = true;
  loadState();
  autoAttach();
}

export const SoundEngine = {
  play(cue: SoundCue): void {
    if (!isBrowser()) return;
    ensureLoaded();
    if (state.muted) return;
    if (cue === "ui" || cue === "ui-secondary") {
      const t = Date.now();
      if (t - lastUi < 30) return; // debounce UI ticks
      lastUi = t;
    }
    const c = getCtx();
    if (!c) return;
    if (c.state === "suspended") {
      void c.resume();
      return; // first gesture primes it; the cue after will sound
    }
    render(cue);
  },
  unlock(): void {
    ensureLoaded();
    unlock();
  },
  setMuted(muted: boolean): void {
    ensureLoaded();
    state = { ...state, muted };
    persist();
    if (master && ctx) master.gain.linearRampToValueAtTime(muted ? 0 : state.volume * MASTER, ctx.currentTime + 0.03);
  },
  toggleMute(): void {
    this.setMuted(!state.muted);
  },
  setVolume(volume: number): void {
    ensureLoaded();
    state = { ...state, volume: Math.min(1, Math.max(0, volume)) };
    persist();
    if (master && ctx && !state.muted) master.gain.linearRampToValueAtTime(state.volume * MASTER, ctx.currentTime + 0.03);
  },
  get muted(): boolean {
    ensureLoaded();
    return state.muted;
  },
  get volume(): number {
    ensureLoaded();
    return state.volume;
  },
};
