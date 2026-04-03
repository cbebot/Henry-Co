"use client";

import { Check, Copy, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type CopyState = "idle" | "copying" | "copied" | "failed";

function fallbackCopy(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  return copied;
}

export function StudioCopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  className = "",
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
}) {
  const [state, setState] = useState<CopyState>("idle");
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  async function handleCopy() {
    if (!value) {
      setState("failed");
      return;
    }

    setState("copying");

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else if (!fallbackCopy(value)) {
        throw new Error("Clipboard write failed.");
      }

      setState("copied");
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setState("idle"), 1800);
    } catch {
      setState("failed");
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setState("idle"), 1800);
    }
  }

  const icon =
    state === "copying" ? (
      <LoaderCircle className="h-4 w-4 animate-spin" />
    ) : state === "copied" ? (
      <Check className="h-4 w-4" />
    ) : (
      <Copy className="h-4 w-4" />
    );

  const text =
    state === "copied"
      ? copiedLabel
      : state === "failed"
        ? "Try again"
        : label;

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-[var(--studio-line)] bg-white/5 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--studio-ink)] transition hover:border-[rgba(151,244,243,0.28)] hover:bg-white/8 ${className}`.trim()}
      aria-live="polite"
    >
      {icon}
      <span>{text}</span>
    </button>
  );
}
