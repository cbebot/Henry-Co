"use client";

import { useState, useCallback } from "react";
import { Check, Copy } from "lucide-react";
import { emitCareToast } from "@/components/feedback/CareToaster";

export default function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!value || typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      const normalizedLabel = String(label || "").trim();
      emitCareToast({
        tone: "success",
        title:
          normalizedLabel && normalizedLabel.toLowerCase() !== "copy"
            ? `${normalizedLabel} copied`
            : "Copied",
        description: value,
        durationMs: 2600,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      emitCareToast({
        tone: "error",
        title: "Copy failed",
        description: "The clipboard could not be updated on this device.",
      });
    }
  }, [label, value]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={
        className ||
        "inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-600 transition hover:bg-zinc-50 active:scale-95 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/60 dark:hover:bg-white/[0.08]"
      }
      title={label || `Copy ${value}`}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-emerald-500" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          {label || "Copy"}
        </>
      )}
    </button>
  );
}
