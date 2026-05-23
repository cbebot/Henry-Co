import {
  listSavedItems,
} from "@henryco/cart-saved-items/server";
import type { SavedItemRecord } from "@henryco/cart-saved-items";
import { getAccountCopy } from "@henryco/i18n/server";
import { formatAccountTemplate } from "@henryco/i18n";
import {
  HeroCard,
  DivisionLanding,
  type HeroCardTile,
} from "@henryco/dashboard-shell/surfaces";

import { requireAccountUser } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase";
import { getAccountAppLocale } from "@/lib/locale-server";
import { SavedItemsClient } from "@/components/saved-items/SavedItemsClient";

export const dynamic = "force-dynamic";

/**
 * Saved Items landing.
 *
 * ACCOUNT-PREMIUM-01 (session 2, Phase 2E). Lifts PageHeader to HeroCard.
 * SavedItemsClient preserved.
 *
 * TODO (Wave 3 backlog): per-record snapshot title/subtitle translations.
 * These are system-generated copy from upstream products/listings and flow
 * into the client grid below. Pre-localising on the server would require
 * either piping a per-record map via prop or making SavedItemsClient pure
 * server. Out of scope this session — documented in the audit hand-off.
 */
export default async function SavedItemsPage() {
  const [locale, user] = await Promise.all([
    getAccountAppLocale(),
    requireAccountUser(),
  ]);
  const admin = createAdminSupabase();

  const [active, expired] = await Promise.all([
    listSavedItems(admin, user.id, { includeStatuses: ["active"] }),
    listSavedItems(admin, user.id, { includeStatuses: ["expired"], limit: 30 }),
  ]);

  const grouped = groupByDivision(active);
  const copy = getAccountCopy(locale).savedItems;

  const totalSaved = active.length + expired.length;

  const tiles: ReadonlyArray<HeroCardTile> = [
    {
      label: copy.summary.activeTemplate
        ? copy.summary.activeTemplate.replace(/\{count\}\s*/, "").trim()
        : "Active",
      value: active.length,
      foot:
        active.length > 0
          ? formatAccountTemplate(copy.summary.activeTemplate, {
              count: active.length,
            })
          : undefined,
      tone: active.length > 0 ? "active" : "default",
    },
    {
      label: copy.summary.expiredTemplate
        ? copy.summary.expiredTemplate.replace(/\{count\}\s*/, "").trim()
        : "Expired",
      value: expired.length,
      foot:
        expired.length > 0
          ? formatAccountTemplate(copy.summary.expiredTemplate, {
              count: expired.length,
            })
          : undefined,
      tone: expired.length > 0 ? "warning" : "default",
    },
    {
      label: copy.summary.savedTemplate
        ? copy.summary.savedTemplate.replace(/\{count\}\s*/, "").trim()
        : "Saved",
      value: totalSaved,
      foot: copy.summary.expiryNote,
    },
  ];

  return (
    <DivisionLanding
      className="acct-fade-in"
      hero={
        <HeroCard
          variant="paired"
          tone={totalSaved === 0 ? "empty" : "calm"}
          eyebrow={copy.metadata.title}
          headline={copy.hero.title}
          blurb={copy.hero.description}
          tiles={tiles}
          side={{
            kicker: copy.metadata.title,
            title: copy.hero.title,
            body: copy.summary.expiryNote,
          }}
        />
      }
      sections={[
        {
          id: "saved-items-grid",
          title: copy.hero.title,
          meta: `${totalSaved}`,
          content: (
            <SavedItemsClient
              initialActive={active}
              initialExpired={expired}
              groupedByDivision={grouped}
              copy={copy}
            />
          ),
        },
      ]}
    />
  );
}

function groupByDivision(items: SavedItemRecord[]) {
  const groups: Record<string, SavedItemRecord[]> = {};
  for (const item of items) {
    if (!groups[item.division]) groups[item.division] = [];
    groups[item.division].push(item);
  }
  return groups;
}
