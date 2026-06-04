"use client";

import type { CSSProperties, ReactNode } from "react";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { getAccountUrl } from "@henryco/config";
import { PublicSiteFooter } from "@henryco/ui/public-design";
import type { HubPublicCopy } from "@henryco/i18n";
import type { HubFooterInputs } from "../lib/site-footer";
import {
  type PublicAccountUser,
  type PublicChromeAccount,
  HenryCoPublicAccountPresets,
  PublicAccountChip,
  PublicChrome,
  PublicShellLayout,
  getSiteNavigationConfig,
} from "@henryco/ui/public-shell";
import { HenryCoMonogram } from "@henryco/ui/brand";
import {
  normalizeCompanySettings,
  type CompanySettingsRecord,
} from "../lib/company-settings-shared";
import PaletteHost from "./PaletteHost";

// The brand mark is always the code-rendered monogram from @henryco/ui/brand —
// never a CMS PNG. The CMS logo_url belongs in <meta> tags only.

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

  // The built-in search pill (and its in-drawer link) cover search, so drop the
  // redundant "Search" primary-nav entry that existed only to surface search in
  // the old mobile drawer.
  const navItems = useMemo(
    () => hubNav.primaryNav.filter((item) => item.href !== "/search"),
    [hubNav.primaryNav]
  );

  // Re-establish hub's accent inside the portaled mobile drawer (BottomSheet
  // mounts at <body>, outside the .home-accent-scope wrapper below).
  const accentStyle = {
    ["--accent" as string]: settings.brand_accent,
  } as CSSProperties;

  const account: PublicChromeAccount | undefined = accountChip
    ? {
        user: accountChip.user,
        loginHref: accountChip.loginHref,
        signupHref: accountChip.signupHref,
        accountHref: accountChip.accountHref,
      }
    : undefined;

  // Signed-IN slot: the existing PublicAccountChip (account dropdown + sign-out)
  // is preserved verbatim. Signed-out, PublicChrome renders its own theme-aware
  // Sign in cluster (the hub's "Explore divisions" primaryCta supplies the
  // signup-side intent), so we pass the chip only when there's a user.
  const accountMenu = accountChip?.user ? (
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
  ) : null;

  return (
    <PublicShellLayout className="bg-[color:var(--home-canvas)] text-[color:var(--home-ink)]">
      {/* home-accent-scope only on inner routes — the certified homepage owns
          its own bespoke chrome and tokens and must not be re-scoped. */}
      <div
        className={isHomepage ? undefined : "home-accent-scope"}
        style={accentStyle}
      >
        <PaletteHost />
        {isHomepage ? (
          children
        ) : (
          <>
            <PublicChrome
              maxWidth="max-w-7xl"
              accentStyle={accentStyle}
              brand={{
                href: "/",
                // Hub IS the company — the brand is "Henry Onyx" itself, no
                // division eyebrow (every division reads "<DIVISION> / Henry
                // Onyx"; the company hub is just the name).
                name: settings.brand_title || copy.brandFallback,
                mark: (
                  <HenryCoMonogram
                    size={26}
                    accent={settings.brand_accent || "#C9A227"}
                    aria-label={settings.brand_title || copy.brandFallback}
                  />
                ),
              }}
              items={navItems}
              search={{ href: "/search" }}
              account={account}
              accountMenu={accountMenu}
              auxLink={hubNav.defaultCtas?.aux}
              primaryCta={hubNav.defaultCtas?.primary}
            />

            <main id="henryco-main" tabIndex={-1}>
              {children}
            </main>

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
