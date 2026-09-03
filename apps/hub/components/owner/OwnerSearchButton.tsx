"use client";

/**
 * OwnerSearchButton — V3 PASS 21 / H3.
 *
 * Compact owner-shell trigger that opens the DashboardCommandPalette
 * via the surrounding OwnerPaletteOpenProvider. Wired in the sidebar +
 * mobile nav so the operator can hit Cmd+K or click the chip to search
 * across every division (federated search reaches Typesense + outbox).
 */

import { Search } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useOptionalHenryCoLocale } from "@henryco/i18n/react";
import { useOwnerPaletteOpen } from "./OwnerPaletteOpenProvider";

export type OwnerSearchButtonProps = {
  className?: string;
  variant?: "sidebar" | "mobile";
};

export default function OwnerSearchButton({
  className,
  variant = "sidebar",
}: OwnerSearchButtonProps) {
  const palette = useOwnerPaletteOpen();
  const open = palette.open;
  const locale = useOptionalHenryCoLocale() ?? "en";
  const t = (text: string) => translateSurfaceLabel(locale, text);

  if (variant === "mobile") {
    return (
      <button
        type="button"
        onClick={open}
        className={
          className ??
          "inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--acct-line)] bg-[var(--acct-surface)] text-[var(--acct-muted)] transition-colors hover:text-[var(--acct-ink)]"
        }
        aria-label={t("Open command palette")}
      >
        <Search className="h-4 w-4" aria-hidden />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      className={
        className ??
        "flex w-full items-center gap-3 rounded-xl border border-[var(--acct-line)] bg-[var(--acct-surface)] px-3 py-2 text-left text-xs text-[var(--acct-muted)] transition-colors hover:border-[var(--owner-accent)]/40 hover:bg-[var(--owner-accent-soft)]/60"
      }
      aria-label={t("Search Henry Onyx across divisions")}
    >
      <Search className="h-3.5 w-3.5" aria-hidden />
      <span className="flex-1 truncate">{t("Search Henry Onyx")}</span>
      <kbd className="rounded-md border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-1.5 py-0.5 text-[0.65rem] font-semibold text-[var(--acct-muted)]">
        Cmd K
      </kbd>
    </button>
  );
}
