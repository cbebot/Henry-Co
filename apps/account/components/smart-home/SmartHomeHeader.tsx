import Link from "next/link";
import { Bookmark } from "lucide-react";
import { PageHeader as ShellPageHeader } from "@henryco/dashboard-shell";
import { formatRelative } from "@/lib/smart-home/format";
import { RealtimeStatusOrb } from "./RealtimeStatusOrb";

/**
 * SmartHomeHeader — content-first lead. Closes anti-pattern #17.
 *
 * No "Welcome to your dashboard". The header reads:
 *
 *   "{firstName ?? 'You'} · {N} unread signal{s} · {M} need attention · last activity {timeAgo}"
 *
 * If the viewer has zero signals AND zero attention items AND no last
 * activity, the description falls back to the lifecycle teaching
 * surface instead of a hollow welcome string.
 *
 * Action slot composition (right side):
 *   - SavedItemsRail (when count > 0) — surfaces saved-for-later work the
 *     viewer can resume. Without this, saved items were dark matter on
 *     the home surface — fetched but never visible unless the page was
 *     also empty (and then they vanished into the empty fallback).
 *   - LiveChip — the calm "live data" indicator. The pulse is driven
 *     by `[data-state="pulsing"]` so DASH-6's realtime listener can
 *     flip it via a CSS variable when `revalidateTag(signalFeedTag(...))`
 *     fires. Honours `prefers-reduced-motion: reduce`.
 */
export type SmartHomeHeaderProps = {
  firstName: string | null;
  unreadCount: number;
  attentionCount: number;
  lastActivityIso: string | null;
  savedItemsCount?: number;
  fallbackBody?: string;
};

export function SmartHomeHeader({
  firstName,
  unreadCount,
  attentionCount,
  lastActivityIso,
  savedItemsCount = 0,
  fallbackBody,
}: SmartHomeHeaderProps) {
  const lead = buildLead({ unreadCount, attentionCount, lastActivityIso });
  const title = firstName ? firstName : "Your dashboard";
  const description =
    lead || fallbackBody || "Live signals across HenryCo will surface here as they land.";
  return (
    <ShellPageHeader
      title={title}
      description={description}
      action={
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          {savedItemsCount > 0 ? <SavedItemsRail count={savedItemsCount} /> : null}
          <RealtimeStatusOrb />
        </div>
      }
    />
  );
}

function buildLead({
  unreadCount,
  attentionCount,
  lastActivityIso,
}: {
  unreadCount: number;
  attentionCount: number;
  lastActivityIso: string | null;
}): string | null {
  const parts: string[] = [];
  if (unreadCount > 0) {
    parts.push(`${unreadCount} unread signal${unreadCount === 1 ? "" : "s"}`);
  }
  if (attentionCount > 0) {
    parts.push(`${attentionCount} need${attentionCount === 1 ? "s" : ""} attention`);
  }
  const last = lastActivityIso ? formatRelative(lastActivityIso) : null;
  if (last) parts.push(`last activity ${last}`);
  if (parts.length === 0) return null;
  return parts.join(" · ");
}

/**
 * SavedItemsRail — quiet header pill exposing saved-for-later count.
 * Closes the "saved items are dark matter" gap from the audit: the
 * SmartHome already fetches savedItems but only consulted them inside
 * the empty-state gate. Now they earn a permanent header slot when the
 * viewer has any.
 */
function SavedItemsRail({ count }: { count: number }) {
  return (
    <Link
      href="/saved-items"
      className="hc-smart-home-saved-rail"
      aria-label={`${count} saved item${count === 1 ? "" : "s"} — resume`}
    >
      <Bookmark size={12} aria-hidden />
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{count}</span>
      <span>saved · resume</span>
    </Link>
  );
}

/**
 * LiveChip — the calm "live data" indicator. Uses className-driven CSS
 * (rather than inline style) so DASH-6's realtime listener can flip
 * `data-state="pulsing"` on the chip when an invalidation lands and the
 * stylesheet drives the animation. `prefers-reduced-motion: reduce`
 * short-circuits the pulse so it never bothers users who opt out.
 */
function LiveChip() {
  return (
    <div
      className="hc-live-chip"
      data-state="idle"
      role="status"
      aria-label="Smart home is live; data refreshes every 30 seconds"
    >
      <span aria-hidden className="hc-live-chip__dot" />
      Live · 30s refresh
    </div>
  );
}
