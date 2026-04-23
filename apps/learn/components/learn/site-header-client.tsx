"use client";

import { getHubUrl } from "@henryco/config";
import {
  HenryCoSearchBreadcrumb,
  HenryCoPublicAccountPresets,
  PublicAccountChip,
  PublicHeader,
  getSiteNavigationConfig,
} from "@henryco/ui/public-shell";

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
  return (
    <PublicHeader
      brand={{
        name: brandName,
        sub: "HenryCo",
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
            { label: "My courses", href: "/learner/courses" },
            { label: "Browse catalog", href: "/courses" },
            { label: "Teach with HenryCo", href: "/teach" },
          ]}
        />
      }
      showThemeToggle
      themeToggleClassName="h-9 w-9 shrink-0 rounded-xl border border-[var(--learn-line)] bg-[rgba(8,14,22,0.45)] text-[var(--learn-ink)] shadow-none hover:bg-[rgba(12,18,28,0.55)] dark:border-[var(--learn-line)]"
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
