"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCompany } from "@henryco/brand";
import { ArrowRight, Menu, Search, X } from "lucide-react";

const links = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export default function Navigation() {
  const pathname = usePathname();
  const company = getCompany("hub") as
    | {
        parentBrand?: string;
        title?: string;
        accent?: string;
      }
    | undefined;

  const [open, setOpen] = useState(false);

  const brandTitle = company?.parentBrand?.trim() || "Henry & Co.";
  const accent = company?.accent?.trim() || "#C9A227";

  return (
    <header
      className="sticky top-0 z-40 border-b bg-[var(--site-header-bg)] backdrop-blur-2xl transition-colors duration-300"
      style={{ borderColor: "var(--site-border)", "--accent": accent } as CSSProperties}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div
            className="grid h-11 w-11 place-items-center rounded-2xl shadow-[0_14px_40px_rgba(0,0,0,0.16)]"
            style={{ background: "var(--accent)" }}
          >
            <span className="text-sm font-bold text-black">H</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-[0.18em] text-[var(--site-text)]">
              {brandTitle}
            </div>
            <div className="text-[11px] uppercase tracking-[0.26em] text-[var(--site-text-muted)]">
              Corporate platform
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition ${
                  active
                    ? "text-[var(--site-text)]"
                    : "text-[var(--site-text-soft)] hover:text-[var(--site-text)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          <Link
            href="/#divisions"
            className="inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm transition"
            style={{
              borderColor: "var(--site-border)",
              background: "var(--site-surface)",
              color: "var(--site-text)",
            }}
          >
            <Search className="h-4 w-4" />
            <span>Search hub</span>
          </Link>
          <Link
            href="/#divisions"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
            style={{ background: "var(--accent)" }}
          >
            Explore hub
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex items-center justify-center rounded-xl border p-2 lg:hidden"
          style={{
            borderColor: "var(--site-border)",
            background: "var(--site-surface)",
            color: "var(--site-text)",
          }}
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div
          className="border-t px-4 py-4 sm:px-6 lg:hidden"
          style={{
            borderColor: "var(--site-border)",
            background: "var(--site-surface-strong)",
          }}
        >
          <div className="grid gap-2">
            {links.map((link) => (
              <Link
                key={`${link.label}-${link.href}`}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-sm transition"
                style={{
                  background: "var(--site-surface)",
                  color: "var(--site-text)",
                }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/#divisions"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-black"
              style={{ background: "var(--accent)" }}
            >
              Explore hub
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
