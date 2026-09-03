"use client";

import type { AccountCopy } from "@henryco/i18n";
import { EmptyStateGlyph } from "./icons/HenryCoIcons";

type EmptyStateCopy = AccountCopy["notifications"]["emptyState"];

export function NotificationsFeedEmptyState({
  variant = "inbox",
  filterLabel,
  copy,
}: {
  variant?: "inbox" | "filter";
  filterLabel?: string;
  copy: EmptyStateCopy;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-[1.8rem] border border-dashed border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-6 py-16 text-center">
      <span className="text-[var(--acct-muted)]" aria-hidden>
        <EmptyStateGlyph size={64} />
      </span>
      <div className="max-w-sm space-y-2">
        <h2 className="acct-display text-2xl text-[var(--acct-ink)]">
          {variant === "filter" ? copy.filterTitle : copy.inboxTitle}
        </h2>
        <p className="text-sm leading-7 text-[var(--acct-muted)]">
          {variant === "filter" && filterLabel ? copy.filterBody : copy.inboxBody}
        </p>
      </div>
    </div>
  );
}
