"use client";

import { translateSurfaceLabel, useHenryCoLocale } from "@henryco/i18n";
import { EmptyStateGlyph } from "./icons/HenryCoIcons";

/**
 * V2-NOT-01-B-2: Premium empty state shared by the popover and the inbox.
 * Typographic minimalism with a single keystone glyph.
 *
 * Final user-facing copy is owned by V2-COPY-01. The literal strings here
 * are PLACEHOLDERS — every word will be re-written against HenryCo's
 * proprietary voice in the copy pass.
 */
export function NotificationsFeedEmptyState({
  variant = "inbox",
  filterLabel,
}: {
  variant?: "inbox" | "filter";
  filterLabel?: string;
}) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-[1.8rem] border border-dashed border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-6 py-16 text-center">
      <span className="text-[var(--acct-muted)]" aria-hidden>
        <EmptyStateGlyph size={64} />
      </span>
      <div className="max-w-sm space-y-2">
        {/* PLACEHOLDER COPY — final wording owned by V2-COPY-01 */}
        <h2 className="acct-display text-2xl text-[var(--acct-ink)]">
          {variant === "filter"
            ? t("Nothing matches that view.")
            : t("All caught up.")}
        </h2>
        <p className="text-sm leading-7 text-[var(--acct-muted)]">
          {variant === "filter" && filterLabel
            ? t("Try a different filter to bring activity back into view.")
            : t("New activity from across HenryCo will arrive here in real time.")}
        </p>
      </div>
    </div>
  );
}
