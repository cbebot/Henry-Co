"use client";

/**
 * useFounderVoice — browser-native voice for the founder command portal.
 *
 * Speech IN via the Web Speech API SpeechRecognition (mic → interim + final
 * transcript); speech OUT via SpeechSynthesis (the assistant's reply, spoken in
 * a calm voice). Both are feature-detected and degrade to silence on browsers
 * that lack them (Firefox has no SpeechRecognition) — the portal stays fully
 * usable by typing. No extra dependency, no server round-trip: the mic audio
 * never leaves the device except as the recognised text the owner chose to send.
 *
 * Reduced-motion does not gag the assistant, but `muted` (owner toggle) does.
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
  /** Begin listening; resolves the FINAL transcript to `onFinal`. */
  startListening: () => void;
  stopListening: () => void;
  /** Speak a reply aloud (no-op when muted / unsupported). */
  speak: (text: string) => void;
  cancelSpeech: () => void;
};

export function useFounderVoice({
  lang = "en-US",
  onFinal,
}: {
  lang?: string;
  onFinal?: (text: string) => void;
} = {}): FounderVoice {
  const [canListen, setCanListen] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [muted, setMuted] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef<((t: string) => void) | undefined>(onFinal);
  finalRef.current = onFinal;

  useEffect(() => {
    setCanListen(Boolean(getRecognitionCtor()));
    setCanSpeak(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        /* already stopped */
      }
      try {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
      } catch {
        /* noop */
      }
    };
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
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

    rec.onresult = (event: unknown) => {
      const e = event as { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> };
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i];
        const text = res[0]?.transcript ?? "";
        if (res.isFinal) finalText += text;
        else interim += text;
      }
      setTranscript(finalText || interim);
    };
    rec.onerror = () => {
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
      const text = finalText.trim();
      setTranscript("");
      if (text) finalRef.current?.(text);
    };

    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
      setTranscript("");
    } catch {
      setListening(false);
    }
  }, [lang]);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* noop */
    }
    setListening(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (muted || typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const clean = text.replace(/\s+/g, " ").trim();
      if (!clean) return;
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(clean);
        utter.lang = lang;
        utter.rate = 1.02;
        utter.pitch = 0.98;
        // Prefer a calm, natural voice when the platform offers a choice.
        const voices = window.speechSynthesis.getVoices();
        const preferred =
          voices.find((v) => /natural|neural|google|samantha|daniel/i.test(v.name) && v.lang.startsWith("en")) ||
          voices.find((v) => v.lang.startsWith(lang.slice(0, 2)));
        if (preferred) utter.voice = preferred;
        utter.onstart = () => setSpeaking(true);
        utter.onend = () => setSpeaking(false);
        utter.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(utter);
      } catch {
        setSpeaking(false);
      }
    },
    [muted, lang],
  );

  const cancelSpeech = useCallback(() => {
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } catch {
      /* noop */
    }
    setSpeaking(false);
  }, []);

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
  };
}
