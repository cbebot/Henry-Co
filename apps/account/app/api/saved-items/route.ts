import { NextResponse } from "next/server";
import {
  bulkRestoreSavedItems,
  emitEngagementEvent,
  listSavedItems,
  removeSavedItem,
} from "@henryco/cart-saved-items/server";
import { requireAccountUser } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

type RestorePayload = {
  ids?: string[];
};

type RemovePayload = {
  id?: string;
};

export async function GET() {
  const user = await requireAccountUser();
  const admin = createAdminSupabase();
  const items = await listSavedItems(admin, user.id, {
    includeStatuses: ["active", "expired"],
  });
  return NextResponse.json({ items });
}

/**
 * PATCH — restore one or many saved items back to their division's cart.
 *
 * Marketplace is the only division with a true persistent cart today, so the
 * restore path inserts directly into marketplace_cart_items for marketplace
 * items. For other divisions (care, learn, logistics) the snapshot already
 * carries the data — we mark them restored and link the user back to the
 * division surface; the division flow re-uses the snapshot to pre-fill.
 */
export async function PATCH(request: Request) {
  const user = await requireAccountUser();
  const admin = createAdminSupabase();
  const payload = (await request.json().catch(() => ({}))) as RestorePayload;
  const ids = Array.isArray(payload.ids) ? payload.ids.filter(Boolean) : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "No items to restore." }, { status: 400 });
  }

  // Look up the rows we're about to restore so we know which divisions/items
  // they belong to.
  const { data: rows } = await admin
    .from("saved_items")
    .select("id, division, item_id, item_snapshot")
    .eq("user_id", user.id)
    .in("id", ids);

  const items = (rows ?? []) as Array<{
    id: string;
    division: string;
    item_id: string;
    item_snapshot: Record<string, unknown>;
  }>;

  // Marketplace direct-restore: ensure cart, insert items, then emit events.
  const marketplaceItems = items.filter((r) => r.division === "marketplace");
  if (marketplaceItems.length) {
    let cartId: string | null = null;
    const { data: cart } = await admin
      .from("marketplace_carts")
      .select("id")
      .eq("status", "active")
      .eq("user_id", user.id)
      .maybeSingle();
    cartId = cart?.id ? String(cart.id) : null;
    if (!cartId) {
      const { data: created } = await admin
        .from("marketplace_carts")
        .insert({ user_id: user.id, status: "active" })
        .select("id")
        .maybeSingle();
      cartId = created?.id ? String(created.id) : null;
    }
    if (cartId) {
      for (const row of marketplaceItems) {
        const snap = row.item_snapshot ?? {};
        const productId = String(row.item_id);
        const quantity = Math.max(1, Number((snap as { quantity?: number }).quantity ?? 1));
        const priceMinor = Number((snap as { priceKobo?: number }).priceKobo ?? 0);
        const compareMinor = (snap as { compareAtKobo?: number | null }).compareAtKobo ?? null;
        // marketplace_cart_items.price stores major units (naira).
        const priceMajor = Math.round(priceMinor / 100);
        const compareMajor = compareMinor == null ? null : Math.round(Number(compareMinor) / 100);

        const { data: existingItem } = await admin
          .from("marketplace_cart_items")
          .select("id, quantity")
          .eq("cart_id", cartId)
          .eq("product_id", productId)
          .maybeSingle();
        if (existingItem?.id) {
          await admin
            .from("marketplace_cart_items")
            .update({
              quantity:
                Number((existingItem as { quantity: number }).quantity || 0) + quantity,
              price: priceMajor,
              compare_at_price: compareMajor,
            })
            .eq("id", existingItem.id);
        } else {
          await admin.from("marketplace_cart_items").insert({
            cart_id: cartId,
            product_id: productId,
            quantity,
            price: priceMajor,
            compare_at_price: compareMajor,
          });
        }
      }
    }
  }

  await bulkRestoreSavedItems(admin, user.id, ids);

  for (const row of items) {
    await emitEngagementEvent(admin, {
      userId: user.id,
      eventType: "saved_item_restored",
      division: row.division as never,
      subjectType: "saved_item",
      subjectId: row.id,
      dedupeKey: `restore:${row.id}`,
      payload: {},
    });
  }

  return NextResponse.json({ ok: true, restored: ids.length });
}

export async function DELETE(request: Request) {
  const user = await requireAccountUser();
  const admin = createAdminSupabase();
  const payload = (await request.json().catch(() => ({}))) as RemovePayload;
  const id = String(payload.id || "").trim();
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const ok = await removeSavedItem(admin, user.id, id);
  return NextResponse.json({ ok });
}
