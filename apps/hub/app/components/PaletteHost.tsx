"use client";

/**
 * PaletteHost — mounts the cross-division CommandPalette globally.
 *
 * Lazy-loaded so the bundle for users who never invoke search is small.
 * The palette listens for Cmd/Ctrl+K and "/" via the package-level
 * useCommandKey hook, so this component does not need any props beyond
 * the endpoint override.
 */

import dynamic from "next/dynamic";

const CommandPalette = dynamic(
  () => import("@henryco/search-ui").then((m) => m.CommandPalette),
  { ssr: false },
);

export default function PaletteHost() {
  return <CommandPalette endpoint="/api/search" />;
}
