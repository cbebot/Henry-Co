"use client";

import type { CSSProperties, ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Layers3, Mail, Phone } from "lucide-react";
import type { PublicAccountUser } from "@henryco/ui";
import { PublicAccountChip } from "@henryco/ui";
import {
  normalizeCompanySettings,
  type CompanySettingsRecord,
} from "../lib/company-settings-shared";

function BrandLogo({
  src,
  alt,
  accent,
  wrapperClassName,
  imageClassName,
}: {
  src?: string | null;
  alt: string;
  accent: string;
  wrapperClassName?: string;
  imageClassName?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const cleanSrc = typeof src === "string" && src.trim() ? src.trim() : null;
  const isFailed = Boolean(cleanSrc && failedSrc === cleanSrc);

  return (
    <div
      className={[
        "grid place-items-center overflow-hidden rounded-2xl border border-white/12 bg-white/5",
        wrapperClassName,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {cleanSrc && !isFailed ? (
        <img
          src={cleanSrc}
          alt={alt}
          className={[
            "h-full w-full object-contain",
            imageClassName,
          ]
            .filter(Boolean)
            .join(" ")}
          loading="eager"
          decoding="async"
          onLoad={() => setFailedSrc(null)}
          onError={() => {
            if (cleanSrc) {
              setFailedSrc(cleanSrc);
            }
          }}
        />
      ) : (
        <Layers3 className="h-5 w-5" style={{ color: accent }} />
      )}
    </div>
  );
}

export default function PublicSiteShell({
  initialSettings,
  accountChip,
  children,
}: {
  initialSettings:
    | Partial<CompanySettingsRecord>
    | Record<string, unknown>
    | { settings?: Partial<CompanySettingsRecord> | null; hasServerError?: boolean }
    | null;
  /** Shared HenryCo identity in the header (session-aware). */
  accountChip?: {
    user: PublicAccountUser | null;
    loginHref: string;
    signupHref: string;
    accountHref: string;
  };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const settings = useMemo(
    () => normalizeCompanySettings(initialSettings as Partial<CompanySettingsRecord> | null),
    [initialSettings]
  );
  const isHomepage = pathname === "/";

  return (
    <div
      className="min-h-screen bg-[var(--site-bg,#050816)] text-[var(--site-text,#ffffff)]"
      style={{ ["--accent" as string]: settings.brand_accent } as CSSProperties}
    >
      {isHomepage ? (
        children
      ) : (
        <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[var(--site-header-bg,rgba(5,8,22,0.84))] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo
              src={settings.logo_url}
              alt={settings.brand_title || "Henry & Co."}
              accent={settings.brand_accent || "#C9A227"}
              wrapperClassName="h-11 w-11"
              imageClassName="max-h-8 max-w-8 p-1"
            />

            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-[0.18em] text-[var(--site-text,#ffffff)]">
                {settings.brand_title}
              </div>
              <div className="text-[11px] uppercase tracking-[0.26em] text-[var(--site-text-muted,rgba(255,255,255,0.55))]">
                {settings.brand_subtitle}
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-[var(--site-text-soft,rgba(255,255,255,0.72))] lg:flex">
            <Link className="transition hover:text-white" href="/">
              Home
            </Link>
            <Link className="transition hover:text-white" href="/about">
              About
            </Link>
            <Link className="transition hover:text-white" href="/contact">
              Contact
            </Link>
            <Link className="transition hover:text-white" href="/privacy">
              Privacy
            </Link>
            <Link className="transition hover:text-white" href="/terms">
              Terms
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {accountChip ? (
              <PublicAccountChip
                user={accountChip.user}
                loginHref={accountChip.loginHref}
                signupHref={accountChip.signupHref}
                accountHref={accountChip.accountHref}
                preferencesHref="/preferences"
                showSignOut
                buttonClassName="border-white/14 bg-white/[0.08] text-white hover:border-white/22 hover:bg-white/[0.12]"
                dropdownClassName="border-zinc-700/80 bg-[#0a0f1f]"
                menuItems={[
                  { label: "Divisions directory", href: "/#divisions" },
                  { label: "About", href: "/about" },
                  { label: "Contact", href: "/contact" },
                ]}
              />
            ) : null}
            <div className="hidden items-center gap-3 sm:flex">
              <Link
                href="/contact"
                className="rounded-xl border border-white/12 bg-white/5 px-3.5 py-2 text-sm text-[var(--site-text-soft,rgba(255,255,255,0.92))] transition hover:bg-white/10"
              >
                Contact
              </Link>
              <Link
                href="/#divisions"
                className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--accent)] px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
              >
                Explore
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/8 bg-black/15 lg:hidden">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="whitespace-nowrap rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs text-[var(--site-text-soft,rgba(255,255,255,0.78))] transition hover:bg-white/10"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="whitespace-nowrap rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs text-[var(--site-text-soft,rgba(255,255,255,0.78))] transition hover:bg-white/10"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="whitespace-nowrap rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs text-[var(--site-text-soft,rgba(255,255,255,0.78))] transition hover:bg-white/10"
            >
              Contact
            </Link>
            <Link
              href="/privacy"
              className="whitespace-nowrap rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs text-[var(--site-text-soft,rgba(255,255,255,0.78))] transition hover:bg-white/10"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="whitespace-nowrap rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs text-[var(--site-text-soft,rgba(255,255,255,0.78))] transition hover:bg-white/10"
            >
              Terms
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-white/10 bg-[var(--site-footer-bg,rgba(0,0,0,0.22))]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <BrandLogo
                src={settings.logo_url}
                alt={settings.brand_title || "Henry & Co."}
                accent={settings.brand_accent || "#C9A227"}
                wrapperClassName="h-11 w-11"
                imageClassName="max-h-8 max-w-8 p-1"
              />

              <div>
                <div className="text-sm font-semibold tracking-[0.18em] text-[var(--site-text,#ffffff)]">
                  {settings.brand_title}
                </div>
                <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--site-text-muted,rgba(255,255,255,0.55))]">
                  {settings.brand_subtitle}
                </div>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--site-text-soft,rgba(255,255,255,0.72))]">
              {settings.footer_blurb || settings.brand_description}
            </p>

            <div className="mt-6 flex flex-wrap gap-4 text-sm text-[var(--site-text-soft,rgba(255,255,255,0.72))]">
              {settings.support_email ? (
                <a
                  href={`mailto:${settings.support_email}`}
                  className="inline-flex items-center gap-2 transition hover:text-white"
                >
                  <Mail className="h-4 w-4 text-[color:var(--accent)]" />
                  {settings.support_email}
                </a>
              ) : null}

              {settings.support_phone ? (
                <a
                  href={`tel:${settings.support_phone}`}
                  className="inline-flex items-center gap-2 transition hover:text-white"
                >
                  <Phone className="h-4 w-4 text-[color:var(--accent)]" />
                  {settings.support_phone}
                </a>
              ) : null}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-text-muted,rgba(255,255,255,0.55))]">
                Company
              </div>
              <div className="mt-4 grid gap-2">
                <Link
                  href="/"
                  className="text-sm text-[var(--site-text-soft,rgba(255,255,255,0.72))] transition hover:text-[var(--site-text,#ffffff)]"
                >
                  Home
                </Link>
                <Link
                  href="/about"
                  className="text-sm text-[var(--site-text-soft,rgba(255,255,255,0.72))] transition hover:text-[var(--site-text,#ffffff)]"
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className="text-sm text-[var(--site-text-soft,rgba(255,255,255,0.72))] transition hover:text-[var(--site-text,#ffffff)]"
                >
                  Contact
                </Link>
                <Link
                  href="/preferences"
                  className="text-sm text-[var(--site-text-soft,rgba(255,255,255,0.72))] transition hover:text-[var(--site-text,#ffffff)]"
                >
                  Language & preferences
                </Link>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-text-muted,rgba(255,255,255,0.55))]">
                Legal
              </div>
              <div className="mt-4 grid gap-2">
                <Link
                  href="/privacy"
                  className="text-sm text-[var(--site-text-soft,rgba(255,255,255,0.72))] transition hover:text-[var(--site-text,#ffffff)]"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  className="text-sm text-[var(--site-text-soft,rgba(255,255,255,0.72))] transition hover:text-[var(--site-text,#ffffff)]"
                >
                  Terms
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/8 px-4 py-4 text-center text-xs text-[var(--site-text-muted,rgba(255,255,255,0.55))] sm:px-6 lg:px-8">
          © {new Date().getFullYear()} {settings.copyright_label || settings.brand_title}
        </div>
      </footer>
        </>
      )}
    </div>
  );
}
