"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyValueButton({
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
  const [done, setDone] = useState(false);

  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      window.setTimeout(() => setDone(false), 2000);
    } catch {
      setDone(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-1.5 rounded-xl border border-[var(--acct-line)] bg-[var(--acct-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--acct-ink)] transition hover:border-[var(--acct-gold)]/40 hover:bg-[var(--acct-bg-elevated)] ${className}`.trim()}
    >
      {done ? <Check size={14} className="text-[var(--acct-green)]" /> : <Copy size={14} />}
      {done ? copiedLabel : label}
    </button>
  );
}
