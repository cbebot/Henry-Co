/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, PhoneCall, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";

export type PublicNavItem = { href: string; label: string };

export type DivisionPublicConfig = {
  name: string;
  sub?: string;
  shortName?: string;
  accent?: string | null;
  logoUrl?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  publicNav?: PublicNavItem[];
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function BrandMark({
  name,
  shortName,
  logoUrl,
}: {
  name: string;
  shortName?: string;
  logoUrl?: string | null;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const cleanSrc = typeof logoUrl === "string" && logoUrl.trim() ? logoUrl.trim() : null;
  const isFailed = Boolean(cleanSrc && failedSrc === cleanSrc);
  const fallback = (shortName || name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.08] shadow-[0_12px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      {cleanSrc && !isFailed ? (
        <img
          src={cleanSrc}
          alt={name}
          className="h-full w-full object-contain p-1.5"
          loading="eager"
          decoding="async"
          onError={() => {
            if (cleanSrc) setFailedSrc(cleanSrc);
          }}
        />
      ) : (
        <span className="text-sm font-black tracking-tight text-white">{fallback || "HC"}</span>
      )}
    </div>
  );
}

export default function CareNavbar({ division }: { division: DivisionPublicConfig }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = useMemo<PublicNavItem[]>(
    () =>
      division.publicNav?.length
        ? division.publicNav
        : [
            { href: "/", label: "Home" },
            { href: "/services", label: "Services" },
            { href: "/pricing", label: "Pricing" },
            { href: "/book", label: "Book" },
            { href: "/track", label: "Track" },
            { href: "/review", label: "Reviews" },
            { href: "/about", label: "About" },
            { href: "/contact", label: "Contact" },
          ],
    [division.publicNav]
  );

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

  return (
    <header className="sticky top-0 z-50 border-b border-black/8 bg-[rgba(244,246,255,0.84)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#071020]/84">
      <div className="mx-auto flex max-w-[92rem] items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-10">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <BrandMark
            name={division.name}
            shortName={division.shortName}
            logoUrl={division.logoUrl}
          />

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-zinc-950 dark:text-white">
              {division.name}
            </div>
            <div className="truncate text-xs text-zinc-500 dark:text-white/58">
              {division.sub ?? "Garment care, home cleaning, office cleaning, and pickup delivery"}
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-black/8 bg-white/72 p-1 shadow-[0_16px_40px_rgba(12,17,45,0.08)] lg:flex dark:border-white/10 dark:bg-white/[0.04]">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-3.5 py-2 text-[13px] font-semibold transition xl:px-4 xl:text-sm",
                isActive(item.href)
                  ? "bg-[color:var(--accent-deep)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] dark:bg-white/[0.08]"
                  : "text-zinc-600 hover:bg-black/[0.04] hover:text-zinc-950 dark:text-white/66 dark:hover:bg-white/[0.06] dark:hover:text-white"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="hidden items-center gap-2 rounded-full border border-black/8 bg-white/68 px-4 py-2 text-xs font-medium text-zinc-600 shadow-[0_12px_32px_rgba(12,17,45,0.06)] xl:flex dark:border-white/10 dark:bg-white/[0.04] dark:text-white/68">
            <Sparkles className="h-4 w-4 text-[color:var(--accent)]" />
            Pickup delivery, home cleaning, office cleaning, and recurring care
          </div>
          {division.supportPhone ? (
            <div className="hidden items-center gap-2 rounded-full border border-black/8 bg-white/68 px-4 py-2 text-xs font-medium text-zinc-600 shadow-[0_12px_32px_rgba(12,17,45,0.06)] 2xl:flex dark:border-white/10 dark:bg-white/[0.04] dark:text-white/68">
              <PhoneCall className="h-4 w-4 text-[color:var(--accent)]" />
              {division.supportPhone}
            </div>
          ) : null}
          <Link
            href="/track"
            className="hidden items-center gap-2 rounded-full border border-black/8 bg-white/80 px-4 py-3 text-sm font-semibold text-zinc-900 shadow-[0_12px_32px_rgba(12,17,45,0.06)] transition hover:bg-white xl:inline-flex dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
          >
            Track
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/book"
            className="care-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
          >
            Book now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex items-center justify-center rounded-2xl border border-black/8 bg-white/70 p-2.5 text-zinc-950 shadow-[0_12px_28px_rgba(15,18,28,0.06)] lg:hidden dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-black/8 bg-[rgba(245,248,255,0.96)] px-5 py-4 backdrop-blur-2xl dark:border-white/10 dark:bg-[#071020]/94 lg:hidden">
          <div className="mx-auto grid max-w-[92rem] gap-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Link
                href="/book"
                onClick={() => setOpen(false)}
                className="care-button-primary inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
              >
                Book now
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/track"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/8 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              >
                Track a booking
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm font-semibold transition",
                    isActive(item.href)
                      ? "bg-[#121829] text-white dark:bg-white/[0.08]"
                      : "bg-white text-zinc-700 hover:bg-black/[0.04] hover:text-zinc-950 dark:bg-white/[0.03] dark:text-white/72 dark:hover:bg-white/[0.06] dark:hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="rounded-2xl border border-black/8 bg-white px-4 py-4 text-sm text-zinc-700 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70">
              <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white">
                <Sparkles className="h-4 w-4 text-[color:var(--accent)]" />
                Premium care across garments, homes, and workplaces
              </div>
              {division.supportPhone ? (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <PhoneCall className="h-4 w-4 text-[color:var(--accent)]" />
                  {division.supportPhone}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
