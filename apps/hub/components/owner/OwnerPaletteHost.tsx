"use client";

/**
 * OwnerPaletteHost — V3 PASS 21 / H3.
 *
 * Mounts the `<DashboardCommandPalette>` (Cmd+K) on the Track B owner
 * workspace shell with a `PaletteOpenProvider` so the search button in
 * the OwnerSidebar / OwnerMobileNav can call `openPalette()` without a
 * navigation.
 *
 * The palette aggregates four sources (per-module commands, federated
 * search, recents, suggestions) — federated search reaches every
 * division via `/api/search` (Typesense / outbox spine).
 *
 * `userId` scopes recents storage; `moduleJumpEntries` power Cmd+1..9
 * across the owner rail (server-derived in the layout from
 * `getOwnerRailEntries(viewer)`).
 */

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import type { ModuleJumpEntry } from "@henryco/search-ui";

const PaletteOpenProvider = dynamic(
  () => import("./OwnerPaletteOpenProvider").then((m) => m.default),
  { ssr: false },
);

export interface OwnerPaletteHostProps {
  userId: string | null;
  moduleJumpEntries?: ReadonlyArray<ModuleJumpEntry>;
  children?: ReactNode;
}

export default function OwnerPaletteHost({
  userId,
  moduleJumpEntries,
  children,
}: OwnerPaletteHostProps) {
  return (
    <PaletteOpenProvider userId={userId} moduleJumpEntries={moduleJumpEntries}>
      {children}
    </PaletteOpenProvider>
  );
}
