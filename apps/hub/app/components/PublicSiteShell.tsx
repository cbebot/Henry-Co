"use client";

import type { CSSProperties, ReactNode } from "react";
import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import { getAccountUrl } from "@henryco/config";
import type { HubPublicCopy } from "@henryco/i18n";
import {
  type PublicAccountUser,
  HenryCoSearchBreadcrumb,
  HenryCoPublicAccountPresets,
  PublicAccountChip,
  PublicHeader,
  PublicShellLayout,
  getSiteNavigationConfig,
} from "@henryco/ui/public-shell";
import { HenryCoMonogram } from "@henryco/ui/brand";
import {
  normalizeCompanySettings,
  type CompanySettingsRecord,
} from "../lib/company-settings-shared";
import PaletteHost from "./PaletteHost";

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
        "grid place-items-center overflow-hidden rounded-2xl border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-04)]",
        wrapperClassName,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {cleanSrc && !isFailed ? (
        <Image
          src={cleanSrc}
          alt={alt}
          width={64}
          height={64}
          priority
          unoptimized
          className={[
            "h-full w-full object-contain",
            imageClassName,
          ]
            .filter(Boolean)
            .join(" ")}
          onLoad={() => setFailedSrc(null)}
          onError={() => {
            if (cleanSrc) {
              setFailedSrc(cleanSrc);
            }
          }}
        />
      ) : (
        <HenryCoMonogram size={28} accent={accent} />
      )}
    </div>
  );
}

/**
 * PublicSiteShell — the hub's public chrome.
 *
 * The homepage (`/`) renders its own bespoke header/footer, so the shell renders its
 * children alone there. Every OTHER public route renders inside this shell's header +
 * footer. V3-PUBLIC-DESIGN-01 moved that chrome from a permanently-dark `--site-*`
 * treatment onto the theme-aware `--home-*` public design system (warm paper ⇄
 * near-black) and enabled the theme toggle, so the non-home routes now match the
 * homepage and follow system/light/dark instead of being locked dark. Hub-local — the
 * other 9 division shells are untouched (they migrate in Phase 2).
 */
export default function PublicSiteShell({
  initialSettings,
  accountChip,
  children,
  copy,
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
  copy: HubPublicCopy["publicSiteShell"];
}) {
  const pathname = usePathname();
  const settings = useMemo(
    () => normalizeCompanySettings(initialSettings as Partial<CompanySettingsRecord> | null),
    [initialSettings]
  );
  const isHomepage = pathname === "/";
  const hubNav = useMemo(() => getSiteNavigationConfig("hub"), []);

  return (
    <PublicShellLayout className="bg-[color:var(--home-canvas)] text-[color:var(--home-ink)]">
      <div
        style={{ ["--accent" as string]: settings.brand_accent } as CSSProperties}
      >
      <PaletteHost />
      {isHomepage ? (
        children
      ) : (
        <>
      <PublicHeader
        variant={hubNav.headerVariant ?? "default"}
        groupIdentityActions={false}
        brand={{
          href: "/",
          name: settings.brand_title || copy.brandFallback,
          sub: settings.brand_subtitle ?? undefined,
          mark: (
            <BrandLogo
              src={settings.logo_url}
              alt={settings.brand_title || copy.brandFallback}
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
            className="hidden lg:inline-flex border-[color:var(--home-line-12)] bg-[color:var(--home-surface-04)] text-[color:var(--home-ink-70)] hover:bg-[color:var(--home-surface-07)]"
          />
        }
        accountMenu={
          accountChip ? (
            <PublicAccountChip
              {...HenryCoPublicAccountPresets.standard}
              user={accountChip.user}
              loginHref={accountChip.loginHref}
              signupHref={accountChip.signupHref}
              accountHref={accountChip.accountHref}
              preferencesHref={getAccountUrl("/settings")}
              settingsHref={getAccountUrl("/security")}
              showSignOut
              menuItems={[
                { label: copy.menuDivisionsDirectory, href: "/#divisions" },
                { label: copy.menuAbout, href: "/about" },
                { label: copy.menuContact, href: "/contact" },
              ]}
            />
          ) : null
        }
        accountMenuFirst
        showThemeToggle
        headerClassName="z-40 border-[color:var(--home-line-12)] bg-[color:var(--home-glass-strong)] text-[color:var(--home-ink)] backdrop-blur-2xl"
        maxWidth="max-w-7xl"
        toolbarClassName="px-4 py-4 sm:px-6 lg:px-8"
        mobileMenuContainerClassName="px-4 py-4 sm:px-6 lg:px-8"
        menuButtonClassName="border-[color:var(--home-line-12)] bg-[color:var(--home-surface-04)] text-[color:var(--home-ink)] hover:bg-[color:var(--home-surface-07)]"
        mobileDrawerClassName="border-[color:var(--home-line)] bg-[color:var(--home-surface-04)]"
        getNavItemClassName={(_item, active, placement) =>
          placement === "bar"
            ? [
                "text-sm font-medium text-[color:var(--home-ink-60)] transition hover:text-[color:var(--home-ink)]",
                active ? "text-[color:var(--home-ink)]" : "",
              ]
                .filter(Boolean)
                .join(" ")
            : "rounded-2xl border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-04)] px-4 py-3 text-sm font-medium text-[color:var(--home-ink-70)]"
        }
        auxLinkClassName="rounded-xl border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-04)] px-3.5 py-2 text-sm text-[color:var(--home-ink-70)] hover:bg-[color:var(--home-surface-07)]"
        primaryCtaClassName="inline-flex items-center gap-2 rounded-full border-0 bg-[color:var(--home-accent)] px-4 py-2.5 text-sm font-semibold text-[color:var(--home-accent-ink)] hover:bg-[color:var(--home-accent-strong)]"
        navClassName="hidden shrink-0 items-center gap-6 lg:flex"
      />

      <main id="henryco-main" tabIndex={-1}>{children}</main>

      <footer className="mt-20 border-t border-[color:var(--home-line)] bg-[color:var(--home-canvas-deep)]">
        <div
          aria-hidden
          className="pointer-events-none mx-auto h-px max-w-7xl bg-gradient-to-r from-transparent via-[color:var(--home-accent)] to-transparent opacity-40"
        />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-8">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <BrandLogo
                src={settings.logo_url}
                alt={settings.brand_title || copy.brandFallback}
                accent={settings.brand_accent || "#C9A227"}
                wrapperClassName="h-10 w-10"
                imageClassName="max-h-7 max-w-7 p-1"
              />
              <div>
                <div
                  className="text-sm font-semibold tracking-[0.18em] text-[color:var(--home-ink)]"
                  style={{ fontFamily: "var(--home-font-display)" }}
                >
                  {settings.brand_title}
                </div>
                <div className="home-eyebrow text-[color:var(--home-ink-50)]">
                  {settings.brand_subtitle}
                </div>
              </div>
            </div>

            <p className="max-w-md text-sm leading-7 text-[color:var(--home-ink-65)]">
              {settings.footer_blurb || settings.brand_description}
            </p>

            <div className="space-y-1.5 text-sm text-[color:var(--home-ink-65)]">
              {settings.support_email ? (
                <a
                  href={`mailto:${settings.support_email}`}
                  className="inline-flex items-center gap-2 font-medium text-[color:var(--home-ink)] transition hover:text-[color:var(--home-accent-text)]"
                >
                  <Mail className="h-3.5 w-3.5 text-[color:var(--home-accent-text)]" />
                  {settings.support_email}
                </a>
              ) : null}
              {settings.support_phone ? (
                <a
                  href={`tel:${settings.support_phone}`}
                  className="inline-flex items-center gap-2 transition hover:text-[color:var(--home-ink)]"
                >
                  <Phone className="h-3.5 w-3.5 text-[color:var(--home-accent-text)]" />
                  {settings.support_phone}
                </a>
              ) : null}
            </div>
          </div>

          <div>
            <div className="home-eyebrow text-[color:var(--home-ink-50)]">{copy.colCompany}</div>
            <div className="mt-4 grid gap-3">
              <Link
                href="/"
                className="text-sm text-[color:var(--home-ink-65)] transition hover:text-[color:var(--home-ink)]"
              >
                {copy.linkHome}
              </Link>
              <Link
                href="/about"
                className="text-sm text-[color:var(--home-ink-65)] transition hover:text-[color:var(--home-ink)]"
              >
                {copy.linkAbout}
              </Link>
              <Link
                href="/contact"
                className="text-sm text-[color:var(--home-ink-65)] transition hover:text-[color:var(--home-ink)]"
              >
                {copy.linkContact}
              </Link>
              <Link
                href="/search"
                className="text-sm text-[color:var(--home-ink-65)] transition hover:text-[color:var(--home-ink)]"
              >
                {copy.linkSearch}
              </Link>
            </div>
          </div>

          <div>
            <div className="home-eyebrow text-[color:var(--home-ink-50)]">{copy.colHenryCo}</div>
            <div className="mt-4 grid gap-3">
              <Link
                href={getAccountUrl("/")}
                className="text-sm text-[color:var(--home-ink-65)] transition hover:text-[color:var(--home-ink)]"
              >
                {copy.linkHenryCoAccount}
              </Link>
              <Link
                href={getAccountUrl("/settings")}
                className="text-sm text-[color:var(--home-ink-65)] transition hover:text-[color:var(--home-ink)]"
              >
                {copy.linkLanguagePrefs}
              </Link>
              <Link
                href="/preferences"
                className="text-sm text-[color:var(--home-ink-65)] transition hover:text-[color:var(--home-ink)]"
              >
                {copy.linkEmailPrefs}
              </Link>
            </div>
          </div>

          <div>
            <div className="home-eyebrow text-[color:var(--home-ink-50)]">{copy.colLegal}</div>
            <div className="mt-4 grid gap-3">
              <Link
                href="/privacy"
                className="text-sm text-[color:var(--home-ink-65)] transition hover:text-[color:var(--home-ink)]"
              >
                {copy.linkPrivacy}
              </Link>
              <Link
                href="/terms"
                className="text-sm text-[color:var(--home-ink-65)] transition hover:text-[color:var(--home-ink)]"
              >
                {copy.linkTerms}
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-[color:var(--home-line-08)] px-4 py-5 text-xs text-[color:var(--home-ink-50)] sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              © {new Date().getFullYear()} {settings.copyright_label || settings.brand_title}. {copy.allRightsReserved}
            </div>
            <span className="home-eyebrow inline-flex items-center gap-1.5 text-[color:var(--home-ink-50)]">
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--home-accent)]"
              />
              {copy.builtBy}
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
