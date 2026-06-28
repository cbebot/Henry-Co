import { NextResponse } from "next/server";
import {
  bulkRestoreSavedItems,
  emitEngagementEvent,
} from "@henryco/cart-saved-items/server";
import { requireAccountUser } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase";
import { getUnifiedSavedItems, removeUnifiedSavedItem } from "@/lib/saved-items-sync";

export const runtime = "nodejs";

type RestorePayload = {
  ids?: string[];
};

type RemovePayload = {
  id?: string;
};

export async function GET() {
  const user = await requireAccountUser();
  const items = await getUnifiedSavedItems(user.id, user.email);
  return NextResponse.json({ items: [...items.active, ...items.expired] });
}

/**
 * PATCH — restore one or many saved items back to their division's cart.
 *
 * Marketplace cart saves are the only records that can be restored into a
 * persistent cart today. Native division saves (jobs, property, learn,
 * marketplace wishlist) stay as open/remove actions in the client.
 */
export async function PATCH(request: Request) {
  const user = await requireAccountUser();
  const admin = createAdminSupabase();
  const payload = (await request.json().catch(() => ({}))) as RestorePayload;
  const ids = Array.isArray(payload.ids)
    ? payload.ids.filter((id) => typeof id === "string" && id.length > 0 && !id.includes(":"))
    : [];
  if (ids.length === 0) {
    return NextResponse.json(
      { error: "No cart-restorable saved items selected." },
      { status: 400 },
    );
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
  const restorableIds = items
    .filter((row) => row.division === "marketplace")
    .map((row) => row.id);
  if (restorableIds.length === 0) {
    return NextResponse.json(
      { error: "No cart-restorable saved items selected." },
      { status: 400 },
    );
  }

  // Marketplace direct-restore: ensure cart, insert items, then emit events.
  const marketplaceItems = items.filter((row) => restorableIds.includes(row.id));
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

  await bulkRestoreSavedItems(admin, user.id, restorableIds);

  for (const row of marketplaceItems) {
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

  return NextResponse.json({ ok: true, restored: restorableIds.length });
}

export async function DELETE(request: Request) {
  const user = await requireAccountUser();
  const payload = (await request.json().catch(() => ({}))) as RemovePayload;
  const id = String(payload.id || "").trim();
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const ok = await removeUnifiedSavedItem(user.id, user.email, id);
  return NextResponse.json({ ok });
}
