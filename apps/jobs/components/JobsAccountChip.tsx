"use client";

import type { ComponentProps } from "react";
import { PublicAccountChip } from "@henryco/ui";
import { logoutEverywhere } from "@henryco/auth/client";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

/**
 * V3-02b — client wrapper that supplies the `onSignOut` orchestrator to
 * the shared `PublicAccountChip`. The Jobs public shell is a server
 * component, so the browser-only logout handler (`logoutEverywhere` +
 * the Supabase browser client) cannot live there. This thin client
 * boundary owns the handler and forwards every other prop verbatim,
 * matching the marketplace template wiring.
 */
export function JobsAccountChip(props: ComponentProps<typeof PublicAccountChip>) {
  return (
    <PublicAccountChip
      {...props}
      signOutApiPath="/api/auth/logout"
      signOutRedirectHref="/"
      onSignOut={async () => {
        const supabase = createSupabaseBrowser();
        await logoutEverywhere({
          supabase,
          redirectTo: "/",
        });
      }}
    />
  );
}
