"use client";

/**
 * V2-CART-01 — Save-for-Later client primitives.
 *
 * These are headless-first: every component takes a `classNames` prop so each
 * division can apply its own brand language (marketplace dark glass, account
 * gold-on-paper, care indigo). The shared visual choice is structural
 * (rounded-2xl card, two-row layout), not chromatic.
 */

import { useCallback, useMemo, useState } from "react";
import type {
  SavedItemDivision,
  SavedItemRecord,
  SavedItemSnapshotCore,
} from "../types";

export type SaveForLaterButtonProps = {
  /** When pressed, the parent posts to its own /api endpoint. */
  onMove: () => Promise<void> | void;
  pending?: boolean;
  /** Compact icon-only mode (cart drawer, narrow contexts). */
  compact?: boolean;
  className?: string;
  labelIdle?: string;
  labelBusy?: string;
};

/** A button that says "Move to saved for later". Headless styling — bring your own. */
export function SaveForLaterButton({
  onMove,
  pending,
  compact = false,
  className,
  labelIdle = "Save for later",
  labelBusy = "Saving...",
}: SaveForLaterButtonProps) {
  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending}
      onClick={() => void onMove()}
      className={className}
      data-state={pending ? "busy" : "idle"}
    >
      <span className="inline-flex items-center gap-2">
        <BookmarkGlyph filled={false} />
        {!compact ? <span>{pending ? labelBusy : labelIdle}</span> : null}
      </span>
    </button>
  );
}

export type SavedBadgeProps = {
  count: number;
  className?: string;
};

export function SavedBadge({ count, className }: SavedBadgeProps) {
  if (!count) return null;
  return (
    <span className={className} aria-label={`${count} items saved for later`}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

export type SavedItemCardClassNames = {
  root?: string;
  body?: string;
  image?: string;
  title?: string;
  meta?: string;
  price?: string;
  compareAt?: string;
  primaryButton?: string;
  secondaryButton?: string;
  ghostButton?: string;
  expiringNote?: string;
  divisionPill?: string;
  expiredVeil?: string;
};

export type SavedItemCardProps = {
  item: SavedItemRecord;
  onRestore: (item: SavedItemRecord) => Promise<void> | void;
  onRemove: (item: SavedItemRecord) => Promise<void> | void;
  classNames?: SavedItemCardClassNames;
  formatCurrency?: (kobo: number, currency?: string) => string;
  divisionLabel?: (division: SavedItemDivision) => string;
};

export function SavedItemCard({
  item,
  onRestore,
  onRemove,
  classNames,
  formatCurrency,
  divisionLabel,
}: SavedItemCardProps) {
  const [busy, setBusy] = useState<"none" | "restore" | "remove">("none");

  const snapshot = item.itemSnapshot as SavedItemSnapshotCore;
  const expiresAt = useMemo(() => new Date(item.expiresAt), [item.expiresAt]);
  const daysToExpire = Math.max(
    0,
    Math.round((expiresAt.getTime() - Date.now()) / 86_400_000)
  );

  const isExpiring = daysToExpire <= 7 && item.status === "active";
  const isExpired = item.status === "expired";

  const restore = useCallback(async () => {
    setBusy("restore");
    try {
      await onRestore(item);
    } finally {
      setBusy("none");
    }
  }, [item, onRestore]);

  const remove = useCallback(async () => {
    setBusy("remove");
    try {
      await onRemove(item);
    } finally {
      setBusy("none");
    }
  }, [item, onRemove]);

  return (
    <article
      className={classNames?.root}
      data-status={item.status}
      data-expiring={isExpiring ? "true" : "false"}
    >
      {snapshot?.image ? (
        <img
          src={snapshot.image}
          alt={snapshot?.title || "Saved item"}
          className={classNames?.image}
          loading="lazy"
        />
      ) : null}

      <div className={classNames?.body}>
        <div>
          {divisionLabel ? (
            <p className={classNames?.divisionPill}>{divisionLabel(item.division)}</p>
          ) : null}
          <h3 className={classNames?.title}>{snapshot?.title || "Saved item"}</h3>
          {snapshot?.subtitle ? (
            <p className={classNames?.meta}>{snapshot.subtitle}</p>
          ) : null}
          {snapshot?.vendorName ? (
            <p className={classNames?.meta}>{snapshot.vendorName}</p>
          ) : null}
        </div>

        {snapshot?.priceKobo != null ? (
          <div>
            <p className={classNames?.price}>
              {formatCurrency
                ? formatCurrency(snapshot.priceKobo, snapshot.currency)
                : `${snapshot.priceKobo}`}
            </p>
            {snapshot?.compareAtKobo ? (
              <p className={classNames?.compareAt}>
                {formatCurrency
                  ? formatCurrency(snapshot.compareAtKobo, snapshot.currency)
                  : `${snapshot.compareAtKobo}`}
              </p>
            ) : null}
          </div>
        ) : null}

        {isExpiring && !isExpired ? (
          <p className={classNames?.expiringNote}>
            {daysToExpire <= 1
              ? "Expires today"
              : `Expires in ${daysToExpire} days`}
          </p>
        ) : null}

        {isExpired ? (
          <p className={classNames?.expiringNote}>
            Saved item expired — restore moves it back to cart and resets the
            90-day window.
          </p>
        ) : null}

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={restore}
            disabled={busy !== "none"}
            className={classNames?.primaryButton}
          >
            {busy === "restore" ? "Moving..." : "Move back to cart"}
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={busy !== "none"}
            className={classNames?.ghostButton}
          >
            {busy === "remove" ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>

      {isExpired ? <div className={classNames?.expiredVeil} /> : null}
    </article>
  );
}

function BookmarkGlyph({ filled }: { filled: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 2h8v10l-4-2.5L3 12V2z" />
    </svg>
  );
}

export type {
  SavedItemRecord,
  SavedItemSnapshotCore,
  SavedItemDivision,
} from "../types";
