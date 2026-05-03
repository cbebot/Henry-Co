"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          // intentionally swallow — clipboard may be unavailable
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--studio-line-strong)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-[12px] font-semibold text-[var(--studio-ink)] transition hover:bg-[rgba(255,255,255,0.07)]"
      aria-label={copied ? "Copied" : `Copy ${label}`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-[#8de8b3]" /> : <Copy className="h-3.5 w-3.5" />}
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
}
