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
        mark: <HenryCoMonogram size={26} accent={learn.accent || "#3C8C7A"} />,
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
            menuItems={[
              { label: t("My courses"), href: "/learner/courses" },
              { label: t("Browse catalog"), href: "/courses" },
              { label: t("Teach with Henry Onyx"), href: "/teach" },
            ]}
          />
        ) : null
      }
      primaryCta={learnNav.defaultCtas?.primary}
      prepend={
        <div className="mx-auto flex max-w-[92rem] items-center justify-between gap-4 px-5 py-2 text-xs text-[color:var(--home-ink-60)] sm:px-8 xl:px-10">
          <span className="flex items-center gap-2">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[color:var(--home-accent-text)]" />
            {t("Structured courses, fair assessments, and certificates anyone can verify")}
          </span>
          <a
            href={accountHref}
            className="hidden font-semibold text-[color:var(--home-ink)] transition hover:text-[color:var(--home-accent-text)] lg:inline-flex"
          >
            {t("Henry Onyx account")}
          </a>
        </div>
      }
    />
  );
}
