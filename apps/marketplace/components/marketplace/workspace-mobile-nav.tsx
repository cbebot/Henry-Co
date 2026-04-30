"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type WorkspaceNavItem = {
  href: string;
  label: string;
  active?: boolean;
};

export type WorkspaceNavGroup = {
  label: string;
  items: WorkspaceNavItem[];
};

type Props = {
  title: string;
  description: string;
  groups: WorkspaceNavGroup[];
  /** Pre-computed label of the currently active item (e.g., "Orders"). */
  currentLabel?: string | null;
};

/**
 * Mobile-first workspace navigation. Desktop renders the existing sidebar
 * (this component is only mounted at lg-and-below). Tapping the trigger
 * opens a bottom-anchored sheet with the nav grouped into Activity /
 * Commerce / Saved / Selling / Support so a 10-item flat list never
 * dominates the first mobile screen.
 *
 * Each group expands independently so we don't snap the entire menu shut
 * when the user taps "Selling" while already in "Orders".
 */
export function WorkspaceMobileNav({ title, description, groups, currentLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const seed: Record<string, boolean> = {};
    for (const group of groups) {
      seed[group.label] = group.items.some((item) => item.active);
    }
    // Ensure at least the first group is open by default so the user
    // immediately sees a target without having to expand anything.
    if (groups[0] && !Object.values(seed).some(Boolean)) {
      seed[groups[0].label] = true;
    }
    return seed;
  });

  // Close the sheet when the route changes — Next.js client transitions
  // don't unmount this client component, so we listen on history pushes.
  useEffect(() => {
    if (!open) return undefined;
    const close = () => setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("popstate", close);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("popstate", close);
    };
  }, [open]);

  const activeLabel = currentLabel
    ? currentLabel
    : groups.flatMap((g) => g.items).find((item) => item.active)?.label || "Overview";

  return (
    <div className="lg:hidden">
      <div className="market-panel rounded-[1.6rem] p-4 sm:p-5">
        <p className="market-kicker">Workspace</p>
        <h1 className="mt-2 text-[1.45rem] font-semibold tracking-tight text-[var(--market-paper-white)]">
          {title}
        </h1>
        <p className="mt-2 text-[13px] leading-6 text-[var(--market-muted)]">{description}</p>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-3.5 py-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
              Current section
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-[var(--market-paper-white)]">
              {activeLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={open}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--market-line)] bg-[var(--market-paper-white)] px-3.5 py-2 text-[12px] font-semibold text-[#0b1018] transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--market-brass)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f17]"
          >
            <Menu className="h-3.5 w-3.5" />
            Open workspace menu
          </button>
        </div>
      </div>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Workspace navigation"
          className="fixed inset-0 z-50 flex items-end justify-center"
        >
          <button
            type="button"
            aria-label="Close workspace menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-[rgba(2,4,10,0.78)] backdrop-blur-sm"
          />
          <div className="relative w-full max-w-[640px] rounded-t-[1.8rem] border-t border-[var(--market-line)] bg-[rgba(8,12,20,0.98)] shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--market-line)] px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--market-brass)]">
                  Workspace menu
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--market-paper-white)]">{title}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--market-line)] text-[var(--market-muted)] transition hover:text-[var(--market-paper-white)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--market-brass)]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-3 pb-6 pt-3">
              {groups.map((group) => {
                const isExpanded = expanded[group.label] ?? false;
                return (
                  <section key={group.label} className="border-b border-[var(--market-line)] last:border-b-0">
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((prev) => ({ ...prev, [group.label]: !isExpanded }))
                      }
                      aria-expanded={isExpanded}
                      className="flex w-full items-center justify-between gap-3 px-3 py-3.5 text-left text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--market-brass)]"
                    >
                      <span>{group.label}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isExpanded ? "rotate-180" : "rotate-0",
                        )}
                      />
                    </button>
                    {isExpanded ? (
                      <ul className="space-y-1 px-2 pb-3">
                        {group.items.map((item) => (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={() => setOpen(false)}
                              aria-current={item.active ? "page" : undefined}
                              className={cn(
                                "flex items-center justify-between gap-2 rounded-2xl px-3.5 py-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--market-brass)]",
                                item.active
                                  ? "bg-[linear-gradient(135deg,rgba(246,240,222,0.16),rgba(117,209,255,0.12))] text-[var(--market-paper-white)]"
                                  : "text-[var(--market-muted)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--market-paper-white)]",
                              )}
                            >
                              <span>{item.label}</span>
                              <ChevronRight className="h-4 w-4 opacity-70" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
