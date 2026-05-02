"use client";

/**
 * Account-shell palette host. See apps/hub/app/components/PaletteHost
 * for rationale; same pattern, account-scoped endpoint default.
 */

import dynamic from "next/dynamic";

const CommandPalette = dynamic(
  () => import("@henryco/search-ui").then((m) => m.CommandPalette),
  { ssr: false },
);

export default function AccountPaletteHost() {
  return <CommandPalette endpoint="/api/search" />;
}
