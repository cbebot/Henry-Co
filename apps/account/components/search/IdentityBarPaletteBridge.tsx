"use client";

/**
 * IdentityBarPaletteBridge — a thin client wrapper that injects an
 * `onSearchClick` handler into the IdentityBar and a wrapped
 * `onSignOut` that clears the user-scoped palette recents before
 * invoking the server signOut action.
 *
 * Why this exists: the layout that renders `<IdentityBar>` is a
 * server component (auth + viewer build). The IdentityBar's
 * `onSearchClick` prop expects a client-side function — it cannot be
 * a server action because it needs to open the palette without a
 * navigation. So we render the IdentityBar inside this client
 * component, pulling the `openPalette` from the PaletteOpenProvider
 * context that wraps the layout below.
 */

import { IdentityBar } from "@henryco/dashboard-shell/shell";
import { ThemeToggle } from "@henryco/ui";
import { logoutEverywhere } from "@henryco/auth/client";
import type { ComponentProps } from "react";

import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { usePaletteOpen } from "./PaletteOpenProvider";

type IdentityBarProps = ComponentProps<typeof IdentityBar>;

export type IdentityBarPaletteBridgeProps = Omit<
  IdentityBarProps,
  "onSearchClick" | "trailing"
>;

export default function IdentityBarPaletteBridge(props: IdentityBarPaletteBridgeProps) {
  const palette = usePaletteOpen();
  const wrappedSignOut = props.onSignOut
    ? async () => {
        // Clear the per-user palette recents *before* logoutEverywhere
        // so a subsequent user on the same device never sees the prior
        // user's recents. V3-02 S2: logoutEverywhere tears down all
        // henryco_* localStorage / sessionStorage / IndexedDB / caches
        // + Supabase session + broadcasts sign-out across this device's
        // tabs, then redirects.
        palette.clearRecentsForViewer();
        const supabase = createSupabaseBrowser();
        await logoutEverywhere({
          supabase,
          redirectTo: "/login",
        });
      }
    : undefined;
  return (
    <IdentityBar
      {...props}
      onSearchClick={() => palette.open()}
      onSignOut={wrappedSignOut}
      // V5-4: actually mount the ThemeToggle in the chrome. Until this,
      // the dashboard had no UI to flip light/dark — users were stuck on
      // their system default. The toggle cycles light → dark → system.
      trailing={<ThemeToggle />}
    />
  );
}
