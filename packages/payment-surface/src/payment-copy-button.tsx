"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@henryco/ui/cn";

export interface PaymentCopyButtonProps {
  value: string;
  label: string;
  className?: string;
}

/**
 * PaymentCopyButton — small icon button next to bank details. Mirrors
 * StudioCopyButton but theme-agnostic via CSS vars so it can render in
 * marketplace, care, or studio without per-app duplication.
 */
export function PaymentCopyButton({ value, label, className }: PaymentCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // best-effort; clipboard may be denied in iframes / older browsers
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      className={cn(
        "inline-flex h-8 items-center justify-center gap-1.5 rounded-full border px-3 text-[11px] font-semibold uppercase tracking-[0.16em]",
        "border-[color:var(--payment-line,rgba(255,255,255,0.18))] bg-black/15 text-[color:var(--payment-accent,#97f4f3)]",
        "transition outline-none active:translate-y-[0.5px]",
        "focus-visible:ring-2 focus-visible:ring-[color:var(--payment-accent,#97f4f3)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40",
        "[@media(hover:hover)]:hover:border-[color:var(--payment-accent,#97f4f3)]/60 [@media(hover:hover)]:hover:bg-[color:var(--payment-accent,#97f4f3)]/[0.08]",
        copied ? "text-emerald-200" : "",
        className,
      )}
    >
      {copied ? <Check className="h-3 w-3" aria-hidden /> : <Copy className="h-3 w-3" aria-hidden />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
