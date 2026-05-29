"use client";

import { getHubUrl, getDivisionConfig } from "@henryco/config";
import {
  HenryCoSearchBreadcrumb,
  HenryCoPublicAccountPresets,
  PublicAccountChip,
  PublicHeader,
  getSiteNavigationConfig,
} from "@henryco/ui/public-shell";
import { DrawerAccountSection } from "@henryco/ui/public";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { translateSurfaceLabel } from "@henryco/i18n";

type LearnSiteHeaderClientProps = {
  brandName: string;
  brandMark: React.ReactNode;
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

const learnNav = getSiteNavigationConfig("learn");
const learnAccent = getDivisionConfig("learn").accentStrong;

export function LearnSiteHeaderClient({
  brandName,
  brandMark,
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
    <PublicHeader
      brand={{
        name: t(brandName),
        sub: t("HenryCo"),
        mark: brandMark,
      }}
      items={learnNav.primaryNav}
      primaryCta={learnNav.defaultCtas?.primary}
      actions={
        <HenryCoSearchBreadcrumb
          href={getHubUrl("/search")}
          className="hidden xl:inline-flex"
        />
      }
      accountMenu={
        <PublicAccountChip
          {...HenryCoPublicAccountPresets.standard}
          user={accountChipUser}
          loginHref={loginHref}
          accountHref={accountHref}
          preferencesHref={preferencesHref}
          settingsHref={settingsHref}
          signupHref={signupHref}
          showSignOut
          menuItems={[
            { label: t("My courses"), href: "/learner/courses" },
            { label: t("Browse catalog"), href: "/courses" },
            { label: t("Teach with HenryCo"), href: "/teach" },
          ]}
        />
      }
      // Premium in-place profile card for the mobile drawer
      // (FIX-CHROME-02). Client Component → uses render-function
      // variant so dismiss is wired through DrawerAccountSection's
      // onSelect prop.
      renderMobileSheetProfile={(dismiss) => (
        <DrawerAccountSection
          user={accountChipUser}
          accountHref={accountHref}
          preferencesHref={preferencesHref}
          settingsHref={settingsHref}
          loginHref={loginHref}
          signupHref={signupHref}
          showSignOut
          accent={learnAccent}
          extraItems={[
            { label: "My courses", href: "/learner/courses" },
            { label: "Browse catalog", href: "/courses" },
            { label: "Teach with HenryCo", href: "/teach" },
          ]}
          onSelect={dismiss}
        />
      )}
      showThemeToggle
      themeToggleClassName="h-11 w-11 shrink-0 rounded-xl border border-[var(--learn-line)] bg-[rgba(8,14,22,0.45)] text-[var(--learn-ink)] shadow-none hover:bg-[rgba(12,18,28,0.55)] dark:border-[var(--learn-line)]"
      maxWidth="max-w-[92rem]"
      toolbarClassName="px-5 sm:px-8 xl:px-10"
      mobileMenuContainerClassName="px-5 sm:px-8 xl:px-10"
      navClassName="hidden items-center gap-5 lg:flex"
      headerClassName="z-40 border-b border-[var(--learn-line)] bg-[var(--learn-bg)] shadow-[0_1px_0_rgba(255,255,255,0.04)]"
      getNavItemClassName={(_item, active, placement) =>
        placement === "bar"
          ? [
              "text-sm font-medium text-[var(--learn-ink-soft)] transition hover:text-[var(--learn-ink)]",
              active ? "text-[var(--learn-ink)]" : "",
            ]
              .filter(Boolean)
              .join(" ")
          : [
              "flex rounded-[1.2rem] border border-[var(--learn-line)] bg-[rgba(6,10,16,0.55)] px-4 py-3 text-sm font-semibold text-[var(--learn-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-md transition hover:border-[var(--learn-line-strong)]",
              active ? "border-[var(--learn-line-strong)] bg-[rgba(8,14,22,0.72)]" : "",
            ]
              .filter(Boolean)
              .join(" ")
      }
    />
  );
}
