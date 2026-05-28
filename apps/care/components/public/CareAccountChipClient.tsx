"use client";

import { HenryCoPublicAccountPresets, PublicAccountChip } from "@henryco/ui";
import { getAccountUrl } from "@henryco/config";
import { logoutEverywhere } from "@henryco/auth/client";
import { getBrowserSupabase } from "@/lib/auth/client";

type MenuItem = { label: string; href: string; external?: boolean };

export function CareAccountChipClient({
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
      menuItems={menuItems}
    />
  );
}
