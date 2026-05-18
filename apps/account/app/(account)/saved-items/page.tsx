import {
  listSavedItems,
} from "@henryco/cart-saved-items/server";
import type { SavedItemRecord } from "@henryco/cart-saved-items";
import { getAccountCopy } from "@henryco/i18n/server";
import { requireAccountUser } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase";
import { getAccountAppLocale } from "@/lib/locale-server";
import PageHeader from "@/components/layout/PageHeader";
import { SavedItemsClient } from "@/components/saved-items/SavedItemsClient";

export const dynamic = "force-dynamic";

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

  // TODO(wave3-account): itemSnapshot.title/subtitle on saved items are
  // system-generated copy from upstream products/listings. They flow into a
  // client component (SavedItemsClient) — translating them here on the
  // server would require either a server-rendered wrapper or piping
  // pre-translated snapshots via prop. Skipped for now; revisit when the
  // grouped view becomes a pure server component or once SavedItemsClient
  // accepts a per-record localized map.

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader title={copy.hero.title} description={copy.hero.description} />

      <SavedItemsClient
        initialActive={active}
        initialExpired={expired}
        groupedByDivision={grouped}
        copy={copy}
      />
    </div>
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
