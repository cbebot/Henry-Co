import {
  listSavedItems,
} from "@henryco/cart-saved-items/server";
import type { SavedItemRecord } from "@henryco/cart-saved-items";
import { requireAccountUser } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase";
import PageHeader from "@/components/layout/PageHeader";
import { SavedItemsClient } from "@/components/saved-items/SavedItemsClient";

export const dynamic = "force-dynamic";

export default async function SavedItemsPage() {
  const user = await requireAccountUser();
  const admin = createAdminSupabase();

  const [active, expired] = await Promise.all([
    listSavedItems(admin, user.id, { includeStatuses: ["active"] }),
    listSavedItems(admin, user.id, { includeStatuses: ["expired"], limit: 30 }),
  ]);

  const grouped = groupByDivision(active);

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title="Saved for later"
        description="Items you set aside from any HenryCo cart. We'll keep them for 90 days and warn you a week before they expire."
      />

      <SavedItemsClient
        initialActive={active}
        initialExpired={expired}
        groupedByDivision={grouped}
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
