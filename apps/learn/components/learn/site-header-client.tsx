"use client";

import { COMPANY, getDivisionConfig, getHubUrl } from "@henryco/config";
import {
  HenryCoPublicAccountPresets,
  PublicAccountChip,
  PublicChrome,
  getSiteNavigationConfig,
} from "@henryco/ui/public-shell";
import { HenryCoMonogram } from "@henryco/ui/brand";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { logoutEverywhere } from "@henryco/auth/client";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { LEARN_PUBLIC_THEME_STYLE } from "@/components/learn/learn-public-theme";

type AwareCta = { label: string; href: string };

type LearnSiteHeaderClientProps = {
  accountChipUser:
    | {
        displayName: string;
        email: string | null;
        avatarUrl: string | null;
      }
    | null;
  accountHref: string;
  loginHref: string;
  signupHref: string;
  preferencesHref: string;
  settingsHref: string;
  /** AWARE-SP3: role-aware chrome CTAs resolved server-side (labels
   *  already localized). Fall back to the static learn nav when absent. */
  primaryCta?: AwareCta;
  auxLink?: AwareCta;
  /** When set (operator standing), leads the account menu with the
   *  instructor console. */
  operatorMenuItem?: AwareCta;
};

const learn = getDivisionConfig("learn");
const learnNav = getSiteNavigationConfig("learn");

/**
 * Learn public header — thin config wrapper over the shared, theme-aware
 * PublicChrome (V3-PUBLIC-REBUILD-learn). Brand reads "LEARN / Henry Onyx";
 * the account dropdown + sign-out are preserved via the slotted
 * PublicAccountChip; the bar flips with the page and wears learn's viridian
 * accent (resolved from the page's LEARN_PUBLIC_THEME_STYLE).
 */
export function LearnSiteHeaderClient({
  accountChipUser,
  accountHref,
  loginHref,
  signupHref,
  preferencesHref,
  settingsHref,
  primaryCta,
  auxLink,
  operatorMenuItem,
}: LearnSiteHeaderClientProps) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <PublicChrome
      maxWidth="max-w-[92rem]"
      accentStyle={LEARN_PUBLIC_THEME_STYLE}
      brand={{
        href: "/",
        name: COMPANY.group.name,
        eyebrow: learn.shortName,
        mark: <HenryCoMonogram size={22} accent={learn.accent || "#3C8C7A"} />,
      }}
      items={learnNav.primaryNav}
      search={{ href: getHubUrl("/search"), label: "Search Henry Onyx" }}
      account={{
        user: accountChipUser,
        loginHref,
        signupHref,
        accountHref,
      }}
      accountMenu={
        accountChipUser ? (
          <PublicAccountChip
            {...HenryCoPublicAccountPresets.standard}
            user={accountChipUser}
            loginHref={loginHref}
            accountHref={accountHref}
            preferencesHref={preferencesHref}
            settingsHref={settingsHref}
            signupHref={signupHref}
            showSignOut
            signOutApiPath="/api/auth/logout"
            signOutRedirectHref="/"
            buttonClassName="border-[color:var(--home-line-15)] bg-[color:var(--home-surface-04)] text-[color:var(--home-ink)] hover:border-[color:var(--home-accent)] hover:bg-[color:var(--home-surface-07)]"
            dropdownClassName="border-[color:var(--home-line-15)] bg-[color:var(--home-sheet)] text-[color:var(--home-ink)]"
            onSignOut={async () => {
              const supabase = createSupabaseBrowser();
              await logoutEverywhere({
                supabase,
                redirectTo: "/",
              });
            }}
            // AWARE-SP5: the instructor console rides the chip's unified
            // workspaceHref contract (leads the menu); the "teach with us"
            // recruit link stays dropped for people who already teach.
            workspaceHref={operatorMenuItem?.href}
            workspaceLabel={operatorMenuItem?.label}
            menuItems={[
              { label: t("My courses"), href: "/learner/courses" },
              { label: t("Browse catalog"), href: "/courses" },
              ...(operatorMenuItem
                ? []
                : [{ label: t("Teach with Henry Onyx"), href: "/teach" }]),
            ]}
          />
        ) : null
      }
      auxLink={auxLink}
      primaryCta={primaryCta ?? learnNav.defaultCtas?.primary}
      /* CHROME-64 (redesign 2026-07-08): announcement strip retired (the
       * account link lives in the chip) and the toolbar rests dense —
       * 111px -> ~63px, inside the owner's 64px budget. */
      dense
    />
  );
}
