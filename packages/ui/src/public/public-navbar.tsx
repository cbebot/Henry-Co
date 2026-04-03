"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/cn";
import { PublicButton } from "./public-button";
import { ThemeToggle } from "./theme-toggle";

type NavItem = {
  label: string;
  href: string;
  external?: boolean;
};

export function PublicNavbar({
  brand,
  items,
  primaryCta,
  secondaryCta,
  auxLink,
}: {
  brand: {
    name: string;
    sub?: string;
    href?: string;
  };
  items: NavItem[];
  primaryCta?: NavItem;
  secondaryCta?: NavItem;
  auxLink?: NavItem;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/75 backdrop-blur-2xl dark:border-white/10 dark:bg-[#07111F]/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 sm:px-8 lg:px-10">
        <Link href={brand.href || "/"} className="min-w-0">
          <div className="text-base font-black tracking-[0.02em] text-zinc-950 dark:text-white">
            {brand.name}
          </div>
          {brand.sub ? (
            <div className="truncate text-[11px] uppercase tracking-[0.2em] text-zinc-500 dark:text-white/45">
              {brand.sub}
            </div>
          ) : null}
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {items.map((item) =>
            item.external ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-zinc-600 transition hover:text-zinc-950 dark:text-white/70 dark:hover:text-white"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-zinc-600 transition hover:text-zinc-950 dark:text-white/70 dark:hover:text-white"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {auxLink ? (
            <PublicButton href={auxLink.href} variant="ghost" size="sm">
              {auxLink.label}
            </PublicButton>
          ) : null}
          {secondaryCta ? (
            <PublicButton href={secondaryCta.href} variant="secondary" size="sm">
              {secondaryCta.label}
            </PublicButton>
          ) : null}
          {primaryCta ? (
            <PublicButton href={primaryCta.href} size="sm">
              {primaryCta.label}
            </PublicButton>
          ) : null}
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-white/70 text-zinc-950 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-white"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-black/10 transition-[max-height,opacity] duration-300 dark:border-white/10 lg:hidden",
          open ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-4 sm:px-8 lg:px-10">
          {items.map((item) =>
            item.external ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-medium text-zinc-800 dark:border-white/10 dark:bg-white/5 dark:text-white/80"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-medium text-zinc-800 dark:border-white/10 dark:bg-white/5 dark:text-white/80"
              >
                {item.label}
              </Link>
            )
          )}

          <div className="mt-2 flex flex-col gap-3">
            {auxLink ? (
              <PublicButton href={auxLink.href} variant="ghost" size="md">
                {auxLink.label}
              </PublicButton>
            ) : null}
            {secondaryCta ? (
              <PublicButton href={secondaryCta.href} variant="secondary" size="md">
                {secondaryCta.label}
              </PublicButton>
            ) : null}
            {primaryCta ? <PublicButton href={primaryCta.href}>{primaryCta.label}</PublicButton> : null}
          </div>
        </div>
      </div>
    </header>
  );
}