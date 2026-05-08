"use client";

/**
 * Account-shell palette host (DASH-5).
 *
 * Mounts the `<PaletteOpenProvider>` so any client descendant — the
 * IdentityBar's search button via IdentityBarPaletteBridge — can
 * call `openPalette()`.
 *
 * The DashboardCommandPalette itself is rendered inside the provider
 * (so the controller ref + recents listener are co-located).
 *
 * `userId` is required to scope recents storage; `moduleJumpEntries`
 * power Cmd+1..9. Both are computed server-side and threaded through
 * the layout.
 */

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import type { ModuleJumpEntry } from "@henryco/search-ui";

const PaletteOpenProvider = dynamic(
  () => import("./PaletteOpenProvider").then((m) => m.default),
  { ssr: false },
);

export interface AccountPaletteHostProps {
  userId: string | null;
  moduleJumpEntries?: ReadonlyArray<ModuleJumpEntry>;
  children?: ReactNode;
}

export default function AccountPaletteHost({
  userId,
  moduleJumpEntries,
  children,
}: AccountPaletteHostProps) {
  return (
    <PaletteOpenProvider userId={userId} moduleJumpEntries={moduleJumpEntries}>
      {children}
    </PaletteOpenProvider>
  );
}
