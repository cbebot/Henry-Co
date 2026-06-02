"use client";

import type { CSSProperties, ReactNode } from "react";
import { useMemo, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getAccountUrl } from "@henryco/config";
import { PublicSiteFooter } from "@henryco/ui/public-design";
import type { HubPublicCopy } from "@henryco/i18n";
import type { HubFooterInputs } from "../lib/site-footer";
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
  footer,
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
  /** Pre-assembled shared-footer inputs (see lib/site-footer.ts). */
  footer: HubFooterInputs;
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

      <PublicSiteFooter
        copy={footer.copy}
        columns={footer.columns}
        support={footer.support}
      />
        </>
      )}
      </div>
    </PublicShellLayout>
  );
}
