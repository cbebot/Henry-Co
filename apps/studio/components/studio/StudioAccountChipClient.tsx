"use client";

import { HenryCoPublicAccountPresets, PublicAccountChip } from "@henryco/ui";
import { getAccountUrl } from "@henryco/config";
import { logoutEverywhere } from "@henryco/auth/client";
import { getBrowserSupabase } from "@/lib/supabase/browser";

type MenuItem = { label: string; href: string; external?: boolean };

export function StudioAccountChipClient({
  user,
  loginHref,
  signupHref,
  accountHref,
  menuItems,
}: {
  user: { displayName: string; email?: string | null; avatarUrl?: string | null } | null;
  loginHref: string;
  signupHref: string;
  accountHref: string;
  menuItems: MenuItem[];
}) {
  return (
    <PublicAccountChip
      {...HenryCoPublicAccountPresets.standard}
      user={user}
      loginHref={loginHref}
      accountHref={accountHref}
      preferencesHref={getAccountUrl("/settings")}
      settingsHref={getAccountUrl("/security")}
      signupHref={signupHref}
      showSignOut
      onSignOut={async () => {
        const supabase = getBrowserSupabase();
        await logoutEverywhere({ supabase, redirectTo: "/" });
      }}
      buttonClassName="border-[var(--studio-line)] bg-black/15 text-[var(--studio-ink)] hover:border-[rgba(151,244,243,0.28)] hover:bg-black/25 dark:text-[var(--studio-ink)]"
      dropdownClassName="border-[var(--studio-line)] bg-[color-mix(in_srgb,var(--studio-bg)_100%,#0a1620)]"
      menuItems={menuItems}
    />
  );
}
