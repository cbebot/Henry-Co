"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { getDivisionConfig } from "@henryco/config";
import { StudioThemeToggle } from "@/components/studio/theme-toggle";

const studio = getDivisionConfig("studio");

const nav = [
  { href: "/pick", label: "Project types" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Packages" },
  { href: "/work", label: "Case Studies" },
  { href: "/teams", label: "Teams" },
  { href: "/process", label: "Process" },
  { href: "/trust", label: "Trust" },
  { href: "/contact", label: "Contact" },
];

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function StudioSiteHeader({
  supportEmail,
  accountHref,
  accountMenu,
}: {
  supportEmail: string | null;
  accountHref: string;
  accountMenu?: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--studio-line)] bg-[color:color-mix(in_srgb,var(--studio-bg)_82%,transparent)]/90 backdrop-blur-2xl">
      <div className="border-b border-[rgba(146,241,240,0.08)]">
        <div className="mx-auto flex max-w-[92rem] flex-wrap items-center justify-between gap-4 px-5 py-2 text-xs text-[var(--studio-ink-soft)] sm:px-8 lg:px-10">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--studio-signal)]" />
            Premium briefs, verified payment guidance, and project history aligned with HenryCo account
          </div>
          <div className="hidden items-center gap-5 lg:flex">
            <div>{supportEmail || studio.supportEmail}</div>
            <Link href={accountHref} className="font-semibold text-[var(--studio-ink)]">
              HenryCo account
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[92rem] items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="studio-brand-mark">
              <span>HC</span>
            </div>
            <div>
              <div className="studio-kicker">{studio.shortName}</div>
              <div className="text-sm font-semibold text-[var(--studio-ink)]">{studio.name}</div>
            </div>
          </Link>
          <div className="hidden rounded-full border border-[var(--studio-line)] bg-black/10 px-3 py-2 text-xs text-[var(--studio-ink-soft)] xl:flex">
            Premium digital product delivery
          </div>
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => {
            const active =
              pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={joinClassNames(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  active
                    ? "bg-[rgba(146,241,240,0.14)] text-[var(--studio-ink)]"
                    : "text-[var(--studio-ink-soft)] hover:text-[var(--studio-ink)]"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {accountMenu}
          <StudioThemeToggle />
          <Link
            href="/contact"
            className="hidden rounded-full border border-[var(--studio-line)] px-4 py-3 text-sm font-semibold text-[var(--studio-ink-soft)] xl:inline-flex"
          >
            Speak to Studio
          </Link>
          <Link
            href="/request"
            className="hidden rounded-full bg-[linear-gradient(135deg,#cfe9ef_0%,#83ebe8_46%,#46aab4_100%)] px-5 py-3 text-sm font-semibold text-[#041117] shadow-[0_18px_50px_rgba(74,193,197,0.25)] sm:inline-flex"
          >
            Start a project
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--studio-line)] text-[var(--studio-ink)] lg:hidden"
            aria-label="Toggle navigation"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-[var(--studio-line)] px-5 py-4 sm:px-8 lg:hidden">
          <nav className="grid gap-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-[1.2rem] border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm font-medium text-[var(--studio-ink)]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={accountHref}
              onClick={() => setOpen(false)}
              className="rounded-[1.2rem] border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm font-medium text-[var(--studio-ink)]"
            >
              HenryCo account
            </Link>
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="rounded-[1.2rem] border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm font-medium text-[var(--studio-ink)]"
            >
              Speak to Studio
            </Link>
            <Link
              href="/request"
              onClick={() => setOpen(false)}
              className="rounded-[1.2rem] bg-[linear-gradient(135deg,#cfe9ef_0%,#83ebe8_46%,#46aab4_100%)] px-4 py-3 text-sm font-semibold text-[#041117]"
            >
              Start a project
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
