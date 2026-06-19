"use client";

import type { ReactNode } from "react";

export const inputCls =
  "w-full rounded-md border border-[color:var(--hc-border,#d1d5db)] bg-[color:var(--hc-surface,#ffffff)] px-3 py-2 text-sm text-[color:var(--hc-text,#111827)]";
export const buttonCls =
  "rounded-md bg-[color:var(--hc-accent,#111827)] px-4 py-2 text-sm font-medium text-[color:var(--hc-accent-text,#ffffff)] disabled:opacity-60";
export const buttonGhostCls =
  "rounded-md border border-[color:var(--hc-border,#d1d5db)] px-3 py-1.5 text-sm text-[color:var(--hc-text,#111827)] disabled:opacity-60";

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-[color:var(--hc-text,#111827)]">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-[color:var(--hc-text-muted,#6b7280)]">{hint}</p> : null}
    </div>
  );
}

export function StatusLine({ tone, message }: { tone: "error" | "success"; message: string }) {
  const color = tone === "error" ? "var(--hc-danger,#b91c1c)" : "var(--hc-success,#15803d)";
  return (
    <p aria-live="polite" className="min-h-[1rem] text-sm" style={{ color: `color-mix(in srgb, ${color} 100%, transparent)` }}>
      {message}
    </p>
  );
}
