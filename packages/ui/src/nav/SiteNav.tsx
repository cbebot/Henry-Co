"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ThemeToggle } from "../theme/ThemeToggle";
import { cn } from "../cn";

export type SiteNavItem = { label: string; href: string; external?: boolean };

export function SiteNav({
  brandLeft,
  items,
  cta
}: {
  brandLeft: { title: string; sub?: string; href?: string };
  items: SiteNavItem[];
  cta?: { label: string; href: string };
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-black/50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href={brandLeft.href ?? "/"} className="group">
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide">
              {brandLeft.title}
            </div>
            {brandLeft.sub ? (
              <div className="text-xs text-black/60 dark:text-white/60">
                {brandLeft.sub}
              </div>
            ) : null}
          </div>
          <div className="mt-1 h-[2px] w-0 bg-[color:var(--accent)] transition-all group-hover:w-full" />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {items.map((it) =>
            it.external ? (
              <a
                key={it.href}
                href={it.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-black/70 hover:text-black dark:text-white/70 dark:hover:text-white"
              >
                {it.label} <ExternalLink className="h-4 w-4 opacity-70" />
              </a>
            ) : (
              <Link
                key={it.href}
                href={it.href}
                className="text-sm text-black/70 hover:text-black dark:text-white/70 dark:hover:text-white"
              >
                {it.label}
              </Link>
            )
          )}
        </nav>

        <div className="flex items-center gap-3">
          {cta ? (
            <Link
              href={cta.href}
              className={cn(
                "hidden sm:inline-flex rounded-xl px-4 py-2 text-sm font-semibold",
                "bg-[color:var(--accent)] text-black shadow-sm hover:opacity-90"
              )}
            >
              {cta.label}
            </Link>
          ) : null}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}