"use client";

import { HenryCoPublicAccountPresets, PublicAccountChip } from "@henryco/ui";
import { getAccountUrl } from "@henryco/config";
import { logoutEverywhere } from "@henryco/auth/client";
import { getBrowserSupabase } from "@/lib/supabase/browser";

type MenuItem = { label: string; href: string; external?: boolean };

export function LogisticsAccountChipClient({
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
      signupHref={signupHref}
      accountHref={accountHref}
      preferencesHref={getAccountUrl("/settings")}
      settingsHref={getAccountUrl("/security")}
      showSignOut
      onSignOut={async () => {
        const supabase = getBrowserSupabase();
        await logoutEverywhere({ supabase, redirectTo: "/" });
      }}
      buttonClassName="border-[var(--logistics-line-strong)] bg-[rgba(215,117,57,0.14)] text-[var(--logistics-accent-soft)] hover:bg-[rgba(215,117,57,0.24)]"
      dropdownClassName="border-[var(--logistics-line)] bg-[#120a14]"
      menuItems={menuItems}
    />
  );
}
