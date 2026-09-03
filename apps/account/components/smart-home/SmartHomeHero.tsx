import "server-only";

import {
  HeroCard,
  type HeroCardTile,
} from "@henryco/dashboard-shell/surfaces";
import { getAccountCopy } from "@henryco/i18n/server";

import { formatRelative } from "@/lib/smart-home/format";
import { getAccountAppLocale } from "@/lib/locale-server";

/**
 * SmartHomeHero — editorial hero band for the root account home.
 *
 * ACCOUNT-PREMIUM-01 (session 1 reference rebuild).
 *
 * Sits above the SmartHome composition (`AttentionPanel`, `NextBestActions`,
 * `RankedMetricStrip`, `SignalFeed`, `ModuleWidgetGrid`). It is the single
 * owner of the greeting + stat lead; the retired `SmartHomeHeader` used to
 * re-render that same lead below the hero (a duplicate). The realtime
 * status orb now mounts on a thin `.hc-smart-home-live-row` directly below
 * the hero, so the live indicator stays near the data it describes without
 * competing for hero attention.
 *
 * State tone:
 *   - "empty"     → no signals, no attention, no last activity
 *   - "attention" → attentionCount > 0
 *   - "active"    → unreadCount > 0
 *   - "calm"      → otherwise
 *
 * Copy: all visible strings flow through the existing `overview` slice
 * in `@henryco/i18n` — no new keys introduced this pass. The headline
 * lead ("X unread signal{s} · last activity Yh ago") inherits the same
 * EN-only formatter the old SmartHomeHeader used (already-baselined
 * pattern; not in scope to localise this session).
 */
export type SmartHomeHeroProps = {
  firstName: string | null;
  unreadCount: number;
  attentionCount: number;
  lastActivityIso: string | null;
  savedItemsCount: number;
};

export async function SmartHomeHero({
  firstName,
  unreadCount,
  attentionCount,
  lastActivityIso,
  savedItemsCount,
}: SmartHomeHeroProps) {
  const locale = await getAccountAppLocale();
  const accountCopy = getAccountCopy(locale);
  const copy = accountCopy.overview;
  const savedItemsCopy = accountCopy.savedItems;

  const headline = firstName ? firstName : copy.welcomeBack;

  // The blurb composes the same lead the previous SmartHomeHeader used —
  // already-baselined EN-only formatter. Wave 3 i18n will lift this.
  const lead = buildLead({ unreadCount, attentionCount, lastActivityIso });
  const blurb = lead || copy.description;

  const tone: "empty" | "attention" | "active" | "calm" =
    attentionCount > 0
      ? "attention"
      : unreadCount > 0
        ? "active"
        : unreadCount === 0 && attentionCount === 0 && lastActivityIso === null
          ? "empty"
          : "calm";

  const tiles: ReadonlyArray<HeroCardTile> = [
    {
      label: copy.notifications,
      value: unreadCount,
      foot: unreadCount === 0 ? copy.allCaughtUp : copy.unreadMessages,
      tone: unreadCount > 0 ? "active" : "default",
    },
    {
      label: copy.attentionKicker,
      value: attentionCount,
      foot:
        attentionCount === 0
          ? copy.allSettled
          : attentionCount === 1
            ? copy.unreadNotificationsAttentionDetail
            : copy.unreadNotificationsAttention,
      tone: attentionCount > 0 ? "warning" : "default",
    },
    ...(savedItemsCount > 0
      ? [
          {
            label: savedItemsCopy.hero.title,
            value: savedItemsCount,
            foot: savedItemsCopy.hero.description,
          } as HeroCardTile,
        ]
      : []),
  ];

  return (
    <HeroCard
      variant="solo"
      tone={tone}
      eyebrow={copy.welcomeBack}
      headline={headline}
      blurb={blurb}
      tiles={tiles}
      ariaLabel={copy.welcomeBack}
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
