import Link from "next/link";
import { Bookmark } from "lucide-react";
import { PageHeader as ShellPageHeader } from "@henryco/dashboard-shell";
import { getAccountHeroesCopy, type AccountHeroesCopy } from "@henryco/i18n";
import { getAccountAppLocale } from "@/lib/locale-server";
import { formatRelative } from "@/lib/smart-home/format";
import { RealtimeStatusOrb } from "./RealtimeStatusOrb";

type SmartHomeHeaderCopy = AccountHeroesCopy["smartHomeHeader"];

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
 *   - RealtimeStatusOrb — the calm "live data" indicator. It supersedes
 *     the older "Live · 30s refresh" chip; DASH-6's realtime listener
 *     drives its state when `revalidateTag(signalFeedTag(...))` fires.
 *     Honours `prefers-reduced-motion: reduce`.
 */
export type SmartHomeHeaderProps = {
  firstName: string | null;
  unreadCount: number;
  attentionCount: number;
  lastActivityIso: string | null;
  savedItemsCount?: number;
  fallbackBody?: string;
};

export async function SmartHomeHeader({
  firstName,
  unreadCount,
  attentionCount,
  lastActivityIso,
  savedItemsCount = 0,
  fallbackBody,
}: SmartHomeHeaderProps) {
  const locale = await getAccountAppLocale();
  const copy = getAccountHeroesCopy(locale).smartHomeHeader;
  const lead = buildLead({ unreadCount, attentionCount, lastActivityIso }, copy);
  const title = firstName ? firstName : copy.fallbackTitle;
  const description = lead || fallbackBody || copy.fallbackBody;
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
          {savedItemsCount > 0 ? <SavedItemsRail count={savedItemsCount} copy={copy} /> : null}
          <RealtimeStatusOrb />
        </div>
      }
    />
  );
}

function buildLead(
  {
    unreadCount,
    attentionCount,
    lastActivityIso,
  }: {
    unreadCount: number;
    attentionCount: number;
    lastActivityIso: string | null;
  },
  copy: SmartHomeHeaderCopy,
): string | null {
  const parts: string[] = [];
  if (unreadCount > 0) {
    parts.push(
      (unreadCount === 1 ? copy.unreadSignalSingular : copy.unreadSignalPlural).replace(
        "{count}",
        String(unreadCount),
      ),
    );
  }
  if (attentionCount > 0) {
    parts.push(
      (attentionCount === 1 ? copy.needsAttentionSingular : copy.needsAttentionPlural).replace(
        "{count}",
        String(attentionCount),
      ),
    );
  }
  const last = lastActivityIso ? formatRelative(lastActivityIso) : null;
  if (last) parts.push(copy.lastActivity.replace("{time}", last));
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
function SavedItemsRail({ count, copy }: { count: number; copy: SmartHomeHeaderCopy }) {
  return (
    <Link
      href="/saved-items"
      className="hc-smart-home-saved-rail"
      aria-label={(count === 1 ? copy.savedRailAriaSingular : copy.savedRailAriaPlural).replace(
        "{count}",
        String(count),
      )}
    >
      <Bookmark size={12} aria-hidden />
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{count}</span>
      <span>{copy.savedRailLabel}</span>
    </Link>
  );
}
