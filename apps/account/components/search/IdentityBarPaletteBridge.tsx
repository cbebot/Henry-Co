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
import type { ComponentProps } from "react";

import { usePaletteOpen } from "./PaletteOpenProvider";

type IdentityBarProps = ComponentProps<typeof IdentityBar>;

export type IdentityBarPaletteBridgeProps = Omit<IdentityBarProps, "onSearchClick">;

export default function IdentityBarPaletteBridge(props: IdentityBarPaletteBridgeProps) {
  const palette = usePaletteOpen();
  const wrappedSignOut = props.onSignOut
    ? () => {
        // Clear the per-user palette recents *before* signOut. The
        // server action redirects to /api/auth/logout which clears
        // the Supabase session — this happens after our local store
        // is already wiped, so a subsequent user on the same device
        // never sees the prior user's recents.
        palette.clearRecentsForViewer();
        props.onSignOut?.();
      }
    : undefined;
  return (
    <IdentityBar
      {...props}
      onSearchClick={() => palette.open()}
      onSignOut={wrappedSignOut}
    />
  );
}
