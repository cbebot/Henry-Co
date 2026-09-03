"use client";

/**
 * useFounderVoice — browser-native voice for the founder command portal (Mark II).
 *
 * Speech IN via the Web Speech API SpeechRecognition (mic → interim + final
 * transcript); speech OUT via SpeechSynthesis. Both feature-detected, degrading
 * to typing. No extra dependency, no server round-trip: mic audio never leaves
 * the device except as the recognised text the owner chose to send.
 *
 * Mark II hardening (each fixes a real turn-taking defect):
 *  - speak() returns a PROMISE that resolves when speech finishes, so the host
 *    can run a conversation loop (reply spoken → listening resumes — Jarvis
 *    turn-taking, not click-the-mic-every-time).
 *  - Long replies are CHUNKED by sentence (~200 chars): Chrome's synthesis
 *    engine stalls/mutes on long utterances (the notorious ~15s cutoff); short
 *    queued utterances never hit it.
 *  - Voices load via `voiceschanged` + retry: Chrome returns [] from
 *    getVoices() until the async voice list lands, which used to force the
 *    robotic default voice on first replies.
 *  - Errors are SURFACED, not swallowed: onError reports a typed kind
 *    ("mic-denied" | "no-speech" | "network" | "aborted" | "unavailable"),
 *    so the host can tell the owner exactly why listening stopped —
 *    mic-denied (Permissions-Policy or browser setting) was previously
 *    indistinguishable from silence.
 *  - BARGE-IN: startListening() cancels any in-flight speech first — talking
 *    over the assistant interrupts it, like interrupting a person.
 */

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition || w.webkitSpeechRecognition || null) as
    | (new () => SpeechRecognitionLike)
    | null;
}

export type FounderVoiceErrorKind =
  | "mic-denied"
  | "no-speech"
  | "network"
  | "aborted"
  | "unavailable";

/**
 * Split text into speakable chunks on sentence boundaries, keeping each chunk
 * under ~200 chars (Chrome's synthesis engine is reliable well below its
 * long-utterance stall threshold at this size). Falls back to comma/space
 * splits for run-on sentences.
 */
export function chunkSpeech(text: string, max = 200): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  if (clean.length <= max) return [clean];

  const sentences = clean.match(/[^.!?…]+[.!?…]+["')\]]*|[^.!?…]+$/g) ?? [clean];
  const chunks: string[] = [];
  let current = "";
  const push = () => {
    if (current.trim()) chunks.push(current.trim());
    current = "";
  };
  for (const sentence of sentences) {
    if ((current + sentence).length <= max) {
      current += sentence;
      continue;
    }
    push();
    if (sentence.length <= max) {
      current = sentence;
      continue;
    }
    // Run-on sentence — split on commas, then hard-wrap on spaces.
    let piece = "";
    for (const part of sentence.split(/(?:,\s*)/)) {
      const withSep = piece ? `${piece}, ${part}` : part;
      if (withSep.length <= max) {
        piece = withSep;
        continue;
      }
      if (piece) chunks.push(piece.trim());
      piece = "";
      if (part.length <= max) {
        piece = part;
      } else {
        for (const word of part.split(" ")) {
          const joined = piece ? `${piece} ${word}` : word;
          if (joined.length <= max) piece = joined;
          else {
            if (piece) chunks.push(piece.trim());
            piece = word;
          }
        }
      }
    }
    current = piece;
  }
  push();
  return chunks;
}

export type FounderVoice = {
  /** SpeechRecognition available in this browser. */
  canListen: boolean;
  /** SpeechSynthesis available in this browser. */
  canSpeak: boolean;
  listening: boolean;
  speaking: boolean;
  /** Live interim transcript while listening (before the owner sends). */
  transcript: string;
  /** Owner toggle — when true the assistant never speaks aloud. */
  muted: boolean;
  setMuted: (v: boolean) => void;
  /** Begin listening (cancels any in-flight speech — barge-in). */
  startListening: () => void;
  stopListening: () => void;
  /** Speak a reply aloud; resolves when finished (or immediately when muted/unsupported). */
  speak: (text: string) => Promise<void>;
  cancelSpeech: () => void;
  /** True while the always-on wake-phrase listener is running. */
  wakeActive: boolean;
  /**
   * Start the always-on wake listener ("Henry Onyx…"). Continuous, restart-on-
   * end, never auto-sends; fires onWake once when the phrase is heard and
   * stops itself (the host then opens a real command turn). Silently refuses
   * while a command turn is listening.
   */
  startWake: (onWake: () => void) => void;
  stopWake: () => void;
};

/** The phrases that wake the portal. Deliberately fuzzy — ASR mangles brand
 *  names ("henry onyx" → "henry on x", "henri onix"). */
const WAKE_RE = /\bhenry\b|\bonyx\b|\bon[iy]x\b|\bhey\s+(?:henry|onyx)\b/i;

export function useFounderVoice({
  lang = "en-US",
  onFinal,
  onError,
}: {
  lang?: string;
  /** Fires with the FINAL transcript when the owner finishes an utterance. */
  onFinal?: (text: string) => void;
  /** Fires with a typed reason whenever listening stops abnormally. */
  onError?: (kind: FounderVoiceErrorKind) => void;
} = {}): FounderVoice {
  const [canListen, setCanListen] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [muted, setMutedState] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef<((t: string) => void) | undefined>(onFinal);
  finalRef.current = onFinal;
  const errorRef = useRef<((k: FounderVoiceErrorKind) => void) | undefined>(onError);
  errorRef.current = onError;
  const mutedRef = useRef(false);
  // Wake listener state — its own recognition instance, never the command one.
  const [wakeActive, setWakeActive] = useState(false);
  const wakeRecRef = useRef<SpeechRecognitionLike | null>(null);
  const wakeWantedRef = useRef(false);
  const wakeCallbackRef = useRef<(() => void) | null>(null);
  const listeningRef = useRef(false);

  // Voice inventory — Chrome populates getVoices() asynchronously; without the
  // voiceschanged subscription the first replies get the robotic default.
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  // Speech queue state: generation counter invalidates stale chunk callbacks
  // after cancelSpeech(), so an interrupted reply can't resolve/continue.
  const speechGenRef = useRef(0);

  useEffect(() => {
    setCanListen(Boolean(getRecognitionCtor()));
    const hasSynth = typeof window !== "undefined" && "speechSynthesis" in window;
    setCanSpeak(hasSynth);

    let onVoices: (() => void) | null = null;
    if (hasSynth) {
      const load = () => {
        const list = window.speechSynthesis.getVoices();
        if (list.length) voicesRef.current = list;
      };
      load();
      onVoices = load;
      window.speechSynthesis.addEventListener?.("voiceschanged", onVoices);
    }

    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        /* already stopped */
      }
      wakeWantedRef.current = false;
      try {
        wakeRecRef.current?.abort();
      } catch {
        /* already stopped */
      }
      try {
        if (hasSynth) {
          if (onVoices) window.speechSynthesis.removeEventListener?.("voiceschanged", onVoices);
          window.speechSynthesis.cancel();
        }
      } catch {
        /* noop */
      }
    };
  }, []);

  const pickVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = voicesRef.current.length
      ? voicesRef.current
      : typeof window !== "undefined" && "speechSynthesis" in window
        ? window.speechSynthesis.getVoices()
        : [];
    if (!voices.length) return null;
    const short = lang.slice(0, 2);
    // Preference ladder: premium/natural voices in our language, then any
    // language match, then the platform default.
    return (
      voices.find((v) => /natural|neural|premium|enhanced/i.test(v.name) && v.lang.startsWith(short)) ||
      voices.find((v) => /google|samantha|daniel|aria|jenny/i.test(v.name) && v.lang.startsWith(short)) ||
      voices.find((v) => v.lang.startsWith(lang)) ||
      voices.find((v) => v.lang.startsWith(short)) ||
      null
    );
  }, [lang]);

  const cancelSpeech = useCallback(() => {
    speechGenRef.current += 1; // invalidate queued chunk callbacks
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } catch {
      /* noop */
    }
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string): Promise<void> => {
      if (
        mutedRef.current ||
        typeof window === "undefined" ||
        !("speechSynthesis" in window)
      ) {
        return Promise.resolve();
      }
      const chunks = chunkSpeech(text);
      if (!chunks.length) return Promise.resolve();

      // Replace any in-flight speech (a new reply supersedes the old one).
      speechGenRef.current += 1;
      const gen = speechGenRef.current;
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* noop */
      }

      return new Promise<void>((resolve) => {
        const voice = pickVoice();
        let index = 0;

        const finish = () => {
          if (gen === speechGenRef.current) setSpeaking(false);
          resolve();
        };

        const speakNext = () => {
          if (gen !== speechGenRef.current) return resolve(); // interrupted
          if (index >= chunks.length) return finish();
          const utter = new SpeechSynthesisUtterance(chunks[index]);
          index += 1;
          utter.lang = lang;
          utter.rate = 1.03;
          utter.pitch = 0.98;
          if (voice) utter.voice = voice;
          utter.onstart = () => {
            if (gen === speechGenRef.current) setSpeaking(true);
          };
          utter.onend = () => speakNext();
          utter.onerror = () => {
            // "interrupted"/"canceled" arrive on cancel(); anything else we
            // just stop the queue — never leave the promise hanging.
            if (gen === speechGenRef.current) setSpeaking(false);
            resolve();
          };
          try {
            window.speechSynthesis.speak(utter);
          } catch {
            finish();
          }
        };

        speakNext();
      });
    },
    [lang, pickVoice],
  );

  const startListening = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      errorRef.current?.("unavailable");
      return;
    }
    // One microphone, one recogniser: the wake listener yields to a command turn.
    wakeWantedRef.current = false;
    try {
      wakeRecRef.current?.abort();
    } catch {
      /* noop */
    }
    setWakeActive(false);
    // Barge-in: the owner talking over the assistant interrupts it.
    cancelSpeech();
    try {
      recognitionRef.current?.abort();
    } catch {
      /* noop */
    }
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;
    let finalText = "";
    let errored: FounderVoiceErrorKind | null = null;

    rec.onresult = (event: unknown) => {
      const e = event as {
        results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
      };
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i];
        const text = res[0]?.transcript ?? "";
        if (res.isFinal) finalText += text;
        else interim += text;
      }
      setTranscript(finalText || interim);
    };
    rec.onerror = (event: unknown) => {
      const code = String((event as { error?: unknown })?.error ?? "");
      errored =
        code === "not-allowed" || code === "service-not-allowed"
          ? "mic-denied"
          : code === "no-speech"
            ? "no-speech"
            : code === "network"
              ? "network"
              : code === "aborted"
                ? "aborted"
                : "unavailable";
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
      listeningRef.current = false;
      const text = finalText.trim();
      setTranscript("");
      if (text) {
        finalRef.current?.(text);
      } else if (errored && errored !== "aborted") {
        errorRef.current?.(errored);
      } else if (!errored) {
        // Ended cleanly with nothing heard (silence window elapsed).
        errorRef.current?.("no-speech");
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
      listeningRef.current = true;
      setTranscript("");
    } catch {
      setListening(false);
      listeningRef.current = false;
      errorRef.current?.("unavailable");
    }
  }, [lang, cancelSpeech]);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* noop */
    }
    setListening(false);
    listeningRef.current = false;
  }, []);

  // ── The wake listener — "Henry Onyx…" opens a command turn ────────────────
  // A separate continuous recogniser that idles in the background, restarts
  // itself when the engine times out, and NEVER sends anything: hearing the
  // wake phrase only hands control back to the host via onWake. It yields the
  // microphone to command turns and to speech output (the host orchestrates
  // when it may run).
  const stopWake = useCallback(() => {
    wakeWantedRef.current = false;
    try {
      wakeRecRef.current?.abort();
    } catch {
      /* noop */
    }
    wakeRecRef.current = null;
    setWakeActive(false);
  }, []);

  const startWake = useCallback(
    (onWake: () => void) => {
      const Ctor = getRecognitionCtor();
      if (!Ctor || listeningRef.current || wakeWantedRef.current) return;
      wakeCallbackRef.current = onWake;
      wakeWantedRef.current = true;

      const spin = () => {
        if (!wakeWantedRef.current || listeningRef.current) return;
        const rec = new Ctor();
        rec.lang = lang;
        rec.continuous = true;
        rec.interimResults = true;
        let woke = false;
        rec.onresult = (event: unknown) => {
          if (woke || !wakeWantedRef.current) return;
          const e = event as { results: ArrayLike<ArrayLike<{ transcript: string }>> };
          let heard = "";
          for (let i = 0; i < e.results.length; i++) {
            heard += e.results[i][0]?.transcript ?? "";
          }
          if (WAKE_RE.test(heard)) {
            woke = true;
            wakeWantedRef.current = false;
            try {
              rec.abort();
            } catch {
              /* noop */
            }
            setWakeActive(false);
            wakeCallbackRef.current?.();
          }
        };
        rec.onerror = (event: unknown) => {
          const code = String((event as { error?: unknown })?.error ?? "");
          // Permission loss kills the loop for good; transient errors restart.
          if (code === "not-allowed" || code === "service-not-allowed") {
            wakeWantedRef.current = false;
            setWakeActive(false);
          }
        };
        rec.onend = () => {
          // The engine times continuous sessions out — respin while wanted.
          if (wakeWantedRef.current && !listeningRef.current) {
            window.setTimeout(spin, 250);
          } else if (!wakeWantedRef.current) {
            setWakeActive(false);
          }
        };
        wakeRecRef.current = rec;
        try {
          rec.start();
          setWakeActive(true);
        } catch {
          wakeWantedRef.current = false;
          setWakeActive(false);
        }
      };

      spin();
    },
    [lang],
  );

  const setMuted = useCallback(
    (v: boolean) => {
      mutedRef.current = v;
      setMutedState(v);
      if (v) cancelSpeech();
    },
    [cancelSpeech],
  );

  return {
    canListen,
    canSpeak,
    listening,
    speaking,
    transcript,
    muted,
    setMuted,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
    wakeActive,
    startWake,
    stopWake,
  };
}
