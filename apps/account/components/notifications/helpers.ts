import type { EnrichedNotification } from "@/lib/account-data";

const DIVISION_PALETTE: Record<string, { color: string; label: string }> = {
  account:     { color: "#C9A227", label: "Account" },
  wallet:      { color: "#C9A227", label: "Wallet" },
  support:     { color: "#10B981", label: "Support" },
  marketplace: { color: "#3B82F6", label: "Marketplace" },
  studio:      { color: "#C9A227", label: "Studio" },
  jobs:        { color: "#8B5CF6", label: "Jobs" },
  learn:       { color: "#0EA5E9", label: "Learn" },
  property:    { color: "#6366F1", label: "Property" },
  logistics:   { color: "#D06F32", label: "Logistics" },
  care:        { color: "#10B981", label: "Care" },
  security:    { color: "#EF4444", label: "Security" },
};

export function divisionForKey(key: string): { color: string; label: string } {
  return DIVISION_PALETTE[key] ?? { color: "#6B6560", label: key };
}

/** Aggregate stats consumed by NotificationsHero. Calls `Date.now()`
 * inside this `.ts` helper to keep `.tsx` components clean under React
 * 19's `react-hooks/purity` rule. */
export function notificationStats(notifications: ReadonlyArray<EnrichedNotification>) {
  const now = Date.now();
  let totalUnread = 0;
  let totalToday = 0;
  let totalThisWeek = 0;
  let lastActivity: string | null = null;
  const divisionBuckets = new Map<string, number>();

  for (const n of notifications) {
    if (!n.is_read) totalUnread += 1;
    const ms = Date.parse(String(n.created_at ?? ""));
    if (Number.isFinite(ms)) {
      const age = now - ms;
      if (age <= 86_400_000) totalToday += 1;
      if (age <= 7 * 86_400_000) totalThisWeek += 1;
      if (!lastActivity || ms > Date.parse(lastActivity)) {
        lastActivity = String(n.created_at);
      }
    }
    if (!n.is_read) {
      const key = n.source?.key || "account";
      divisionBuckets.set(key, (divisionBuckets.get(key) ?? 0) + 1);
    }
  }

  const divisions = Array.from(divisionBuckets.entries())
    .map(([key, count]) => {
      const palette = divisionForKey(key);
      return { key, label: palette.label, color: palette.color, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalUnread,
    totalToday,
    totalThisWeek,
    lastActivity,
    divisions,
  };
}
