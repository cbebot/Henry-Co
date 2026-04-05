"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

export function ProjectCollapsiblePanel({
  defaultOpen,
  badge,
  title,
  subtitle,
  children,
}: {
  defaultOpen: boolean;
  badge: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <details
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      className="group rounded-[1.85rem] border border-[var(--studio-line)] bg-[color-mix(in_srgb,var(--studio-surface)_88%,transparent)] open:border-[rgba(151,244,243,0.22)]"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 pr-5 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 text-left">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-signal)]">{badge}</div>
          <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-[var(--studio-ink)]">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm leading-6 text-[var(--studio-ink-soft)]">{subtitle}</p> : null}
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-[var(--studio-signal)] transition duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </summary>
      <div className="border-t border-[var(--studio-line)] px-6 pb-8 pt-4">{children}</div>
    </details>
  );
}
