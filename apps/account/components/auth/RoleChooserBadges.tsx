"use client";

import { useEffect, useState } from "react";

/**
 * V3-02 S3 — client-side fetch + render for per-role chooser badges.
 *
 * The chooser server component renders the role tiles statically;
 * this client island augments each tile with live counts (unread
 * notifications, pending actions, last visited). We hydrate after
 * the initial paint so the static chooser is interactive instantly
 * even if /api/auth/role-status is slow.
 *
 * The `tileKey` prop selects which role's badge to render. Mounting
 * one of these inside each tile keeps the chooser markup simple and
 * lets each badge fail independently (a slow query for "owner" does
 * not block the customer badge).
 */

export type RoleChooserBadgeKey = "customer" | "staff" | "owner";

type RoleStatus = {
  key: RoleChooserBadgeKey;
  unreadCount: number;
  pendingActions: number;
  lastVisitedAt: number | null;
};

type FetchState =
  | { kind: "loading" }
  | { kind: "ready"; status: RoleStatus | null }
  | { kind: "error" };

let inflight: Promise<Map<RoleChooserBadgeKey, RoleStatus>> | null = null;
let cached: Map<RoleChooserBadgeKey, RoleStatus> | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30 * 1000;

async function fetchRoleStatuses(): Promise<Map<RoleChooserBadgeKey, RoleStatus>> {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL_MS) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const response = await fetch("/api/auth/role-status", {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`status:${response.status}`);
      const body = (await response.json()) as { roles: RoleStatus[] };
      const map = new Map<RoleChooserBadgeKey, RoleStatus>();
      for (const status of body.roles ?? []) map.set(status.key, status);
      cached = map;
      cachedAt = Date.now();
      return map;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

function formatRelative(ts: number | null): string | null {
  if (!ts) return null;
  const now = Date.now();
  const diffSeconds = Math.max(0, Math.floor((now - ts) / 1000));
  if (diffSeconds < 60) return "just now";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return "30d+ ago";
}

export function RoleChooserBadges({ tileKey }: { tileKey: RoleChooserBadgeKey }) {
  const [state, setState] = useState<FetchState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetchRoleStatuses()
      .then((map) => {
        if (cancelled) return;
        setState({ kind: "ready", status: map.get(tileKey) ?? null });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ kind: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [tileKey]);

  if (state.kind === "error") return null;
  if (state.kind === "loading") {
    return (
      <span
        aria-hidden="true"
        className="mt-2 inline-block h-4 w-24 animate-pulse rounded-full bg-[var(--acct-line)]/40"
      />
    );
  }

  const status = state.status;
  if (!status) return null;
  const lastVisitedLabel = formatRelative(status.lastVisitedAt);

  const badges: { label: string; tone: "neutral" | "accent" | "warn" }[] = [];
  if (status.unreadCount > 0) {
    badges.push({
      label: `${status.unreadCount > 99 ? "99+" : status.unreadCount} unread`,
      tone: "accent",
    });
  }
  if (status.pendingActions > 0) {
    badges.push({
      label: `${status.pendingActions} pending`,
      tone: "warn",
    });
  }
  if (lastVisitedLabel) {
    badges.push({ label: `Visited ${lastVisitedLabel}`, tone: "neutral" });
  }

  if (badges.length === 0) {
    return (
      <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[var(--acct-muted)]/70">
        No new activity
      </p>
    );
  }

  return (
    <ul
      aria-label={`${tileKey} role activity`}
      className="mt-2 flex flex-wrap items-center gap-1.5"
    >
      {badges.map((badge) => (
        <li
          key={badge.label}
          className={
            badge.tone === "accent"
              ? "inline-flex items-center rounded-full bg-[var(--acct-gold-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--acct-gold)]"
              : badge.tone === "warn"
                ? "inline-flex items-center rounded-full bg-[var(--acct-blue-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--acct-div-staff)]"
                : "inline-flex items-center rounded-full border border-[var(--acct-line)] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--acct-muted)]"
          }
        >
          {badge.label}
        </li>
      ))}
    </ul>
  );
}
