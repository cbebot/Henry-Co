"use client";

import type { ComponentProps } from "react";
import { PublicAccountChip } from "@henryco/ui";
import { logoutEverywhere } from "@henryco/auth/client";
import { getBrowserSupabase } from "@/lib/supabase/browser";

/**
 * V3-02b — client wrapper that supplies the `onSignOut` orchestrator to
 * the shared `PublicAccountChip`. The Studio public shell is a server
 * component, so the browser-only logout handler (`logoutEverywhere` +
 * the Supabase browser client) cannot live there. This thin client
 * boundary owns the handler and forwards every other prop verbatim,
 * matching the marketplace template wiring.
 */
export function StudioAccountChip(props: ComponentProps<typeof PublicAccountChip>) {
  return (
    <PublicAccountChip
      {...props}
      signOutApiPath="/api/auth/logout"
      signOutRedirectHref="/"
      onSignOut={async () => {
        const supabase = getBrowserSupabase();
        await logoutEverywhere({
          supabase,
          redirectTo: "/",
        });
      }}
    />
  );
}
