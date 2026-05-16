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
