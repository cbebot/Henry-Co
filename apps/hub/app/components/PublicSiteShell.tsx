"use client";

import type { CSSProperties, ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers3, Mail, Phone } from "lucide-react";
import { getAccountUrl } from "@henryco/config";
import {
  type PublicAccountUser,
  HenryCoSearchBreadcrumb,
  HenryCoPublicAccountPresets,
  PublicAccountChip,
  PublicHeader,
  PublicShellLayout,
  getSiteNavigationConfig,
} from "@henryco/ui/public-shell";
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
  const hubNav = useMemo(() => getSiteNavigationConfig("hub"), []);

  return (
    <PublicShellLayout className="bg-[var(--site-bg,#050816)] text-[var(--site-text,#ffffff)]">
      <div
        style={{ ["--accent" as string]: settings.brand_accent } as CSSProperties}
      >
      {isHomepage ? (
        children
      ) : (
        <>
      <PublicHeader
        variant={hubNav.headerVariant ?? "default"}
        groupIdentityActions={false}
        brand={{
          href: "/",
          name: settings.brand_title || "Henry & Co.",
          sub: settings.brand_subtitle ?? undefined,
          mark: (
            <BrandLogo
              src={settings.logo_url}
              alt={settings.brand_title || "Henry & Co."}
              accent={settings.brand_accent || "#C9A227"}
              wrapperClassName="h-11 w-11"
              imageClassName="max-h-8 max-w-8 p-1"
            />
          ),
        }}
        items={hubNav.primaryNav}
        auxLink={hubNav.defaultCtas?.aux}
        primaryCta={hubNav.defaultCtas?.primary}
        actions={
          <HenryCoSearchBreadcrumb
            href="/search"
            className="hidden lg:inline-flex border-white/12 bg-white/5 text-[var(--site-text-soft,rgba(255,255,255,0.92))] hover:bg-white/10 dark:border-white/12 dark:bg-white/5"
          />
        }
        accountMenu={
          accountChip ? (
            <PublicAccountChip
              {...HenryCoPublicAccountPresets.onDarkMarketing}
              user={accountChip.user}
              loginHref={accountChip.loginHref}
              signupHref={accountChip.signupHref}
              accountHref={accountChip.accountHref}
              preferencesHref={getAccountUrl("/settings")}
              settingsHref={getAccountUrl("/security")}
              showSignOut
              menuItems={[
                { label: "Divisions directory", href: "/#divisions" },
                { label: "About", href: "/about" },
                { label: "Contact", href: "/contact" },
              ]}
            />
          ) : null
        }
        accountMenuFirst
        showThemeToggle={false}
        headerClassName="z-40 border-white/10 bg-[var(--site-header-bg,rgba(5,8,22,0.84))] text-[var(--site-text,#ffffff)] backdrop-blur-2xl"
        maxWidth="max-w-7xl"
        toolbarClassName="px-4 py-4 sm:px-6 lg:px-8"
        mobileMenuContainerClassName="px-4 py-4 sm:px-6 lg:px-8"
        menuButtonClassName="border-white/12 bg-white/5 text-white hover:bg-white/10 dark:border-white/12 dark:bg-white/5"
        mobileDrawerClassName="border-white/10 bg-black/20"
        getNavItemClassName={(_item, active, placement) =>
          placement === "bar"
            ? [
                "text-sm font-medium text-[var(--site-text-soft,rgba(255,255,255,0.72))] transition hover:text-white",
                active ? "text-white" : "",
              ]
                .filter(Boolean)
                .join(" ")
            : "rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-medium text-[var(--site-text-soft,rgba(255,255,255,0.92))]"
        }
        auxLinkClassName="rounded-xl border border-white/12 bg-white/5 px-3.5 py-2 text-sm text-[var(--site-text-soft,rgba(255,255,255,0.92))] hover:bg-white/10 dark:border-white/12 dark:bg-white/5"
        primaryCtaClassName="inline-flex items-center gap-2 rounded-xl border-0 bg-[color:var(--accent)] px-4 py-2.5 text-sm font-semibold text-black hover:opacity-90"
        navClassName="hidden shrink-0 items-center gap-6 lg:flex"
      />

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
                  href={getAccountUrl("/settings")}
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

        <div className="border-t border-white/8 px-4 py-4 text-xs text-[var(--site-text-muted,rgba(255,255,255,0.55))] sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              © {new Date().getFullYear()} {settings.copyright_label || settings.brand_title}
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--site-text-muted,rgba(255,255,255,0.55))]">
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--accent,#C9A227)]/85"
              />
              Designed by HenryCo Studio
            </span>
          </div>
        </div>
      </footer>
        </>
      )}
      </div>
    </PublicShellLayout>
  );
}
