import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  emitEngagementEvent,
  listSavedItems,
  removeSavedItem,
  restoreSavedItem,
  saveItemForLater,
} from "@henryco/cart-saved-items/server";
import { getMarketplaceViewer } from "@/lib/marketplace/auth";
import { getMarketplaceHomeData, getMarketplaceShellState } from "@/lib/marketplace/data";
import { logMarketplaceAction } from "@/lib/marketplace/notifications";
import { createAdminSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

type MovePayload = {
  cartItemId?: string;
  productSlug?: string;
};

type RestorePayload = {
  savedItemId?: string;
};

type RemovePayload = {
  savedItemId?: string;
};

export async function GET() {
  const viewer = await getMarketplaceViewer();
  if (!viewer.user) {
    return NextResponse.json({ items: [] });
  }
  const admin = createAdminSupabase();
  const items = await listSavedItems(admin, viewer.user.id, {
    division: "marketplace",
  });
  return NextResponse.json({ items });
}

/**
 * POST — move a cart item to saved-for-later. Body:
 *   { cartItemId: string }   — preferred, looks up product from cart
 * or
 *   { productSlug: string }  — direct product save (e.g. from product page)
 */
export async function POST(request: Request) {
  const viewer = await getMarketplaceViewer();
  if (!viewer.user) {
    return NextResponse.json({ error: "Sign in to save items." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as MovePayload;
  const cartItemId = String(payload.cartItemId || "").trim();
  const productSlug = String(payload.productSlug || "").trim();
  if (!cartItemId && !productSlug) {
    return NextResponse.json({ error: "Missing item reference." }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const snapshot = await getMarketplaceHomeData();

  let resolvedProductSlug = productSlug;
  let resolvedCartItemId: string | null = null;
  let resolvedQuantity = 1;

  if (cartItemId) {
    const { data: cartItem } = await admin
      .from("marketplace_cart_items")
      .select("id, product_id, quantity, cart_id")
      .eq("id", cartItemId)
      .maybeSingle();
    if (!cartItem) {
      return NextResponse.json({ error: "Cart item not found." }, { status: 404 });
    }
    const { data: cart } = await admin
      .from("marketplace_carts")
      .select("user_id")
      .eq("id", cartItem.cart_id)
      .maybeSingle();
    if (!cart || String((cart as { user_id?: string }).user_id) !== viewer.user.id) {
      return NextResponse.json({ error: "Cart item not yours." }, { status: 403 });
    }
    const product = snapshot.products.find(
      (item) => item.id === String(cartItem.product_id)
    );
    if (!product) {
      return NextResponse.json({ error: "Product no longer available." }, { status: 410 });
    }
    resolvedProductSlug = product.slug;
    resolvedCartItemId = cartItemId;
    resolvedQuantity = Number(cartItem.quantity || 1);
  }

  const product = snapshot.products.find((item) => item.slug === resolvedProductSlug);
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }
  const vendor = snapshot.vendors.find((item) => item.slug === product.vendorSlug) ?? null;

  const saved = await saveItemForLater(admin, viewer.user.id, {
    division: "marketplace",
    itemType: "product",
    itemId: product.id,
    sourceCartItemId: resolvedCartItemId,
    snapshot: {
      title: product.title,
      subtitle: product.summary ?? null,
      image: product.gallery?.[0] ?? null,
      href: `/product/${product.slug}`,
      // marketplace stores prices in major units (naira). Snapshot in kobo so
      // any cross-division renderer (account /saved-items) can format uniformly.
      priceKobo: Math.round(product.basePrice * 100),
      compareAtKobo:
        product.compareAtPrice == null ? null : Math.round(product.compareAtPrice * 100),
      currency: product.currency || "NGN",
      vendorName: vendor?.name ?? null,
      badges: product.trustBadges ?? [],
      // marketplace-specific extras
      productSlug: product.slug,
      vendorSlug: product.vendorSlug ?? null,
      quantity: resolvedQuantity,
    },
  });

  if (resolvedCartItemId) {
    await admin.from("marketplace_cart_items").delete().eq("id", resolvedCartItemId);
  }

  await emitEngagementEvent(admin, {
    userId: viewer.user.id,
    eventType: "saved_item_added",
    division: "marketplace",
    subjectType: "product",
    subjectId: product.id,
    dedupeKey: `move:${product.id}`,
    payload: { source: resolvedCartItemId ? "cart" : "direct" },
  });

  await logMarketplaceAction({
    eventType: "cart_item_saved_for_later",
    actorUserId: viewer.user.id,
    actorEmail: viewer.user.email ?? null,
    entityType: "product",
    entityId: product.id,
    details: { productSlug: product.slug, source: resolvedCartItemId ? "cart" : "direct" },
  });

  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath("/account/saved");

  const shell = await getMarketplaceShellState();
  return NextResponse.json({ ok: true, shell, saved });
}

/**
 * PATCH — restore a saved item back to the cart.
 */
export async function PATCH(request: Request) {
  const viewer = await getMarketplaceViewer();
  if (!viewer.user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as RestorePayload;
  const savedItemId = String(payload.savedItemId || "").trim();
  if (!savedItemId) {
    return NextResponse.json({ error: "Missing saved item id." }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const { data: row } = await admin
    .from("saved_items")
    .select("id, item_id, item_snapshot, division")
    .eq("id", savedItemId)
    .eq("user_id", viewer.user.id)
    .maybeSingle();

  if (!row) {
    return NextResponse.json({ error: "Saved item not found." }, { status: 404 });
  }
  if (String((row as { division?: string }).division) !== "marketplace") {
    return NextResponse.json({ error: "Wrong division." }, { status: 400 });
  }

  const snapshot = (row as { item_snapshot?: Record<string, unknown> }).item_snapshot ?? {};
  const productId = String((row as { item_id: string }).item_id);
  const quantity = Math.max(1, Number((snapshot as { quantity?: number }).quantity ?? 1));

  // Resolve or create an active marketplace_cart row.
  const { data: existingCart } = await admin
    .from("marketplace_carts")
    .select("id")
    .eq("status", "active")
    .eq("user_id", viewer.user.id)
    .maybeSingle();

  let cartId = existingCart?.id ? String(existingCart.id) : null;
  if (!cartId) {
    const { data: created } = await admin
      .from("marketplace_carts")
      .insert({
        user_id: viewer.user.id,
        status: "active",
      })
      .select("id")
      .maybeSingle();
    cartId = created?.id ? String(created.id) : null;
  }
  if (!cartId) {
    return NextResponse.json({ error: "Could not resolve cart." }, { status: 500 });
  }

  // Look up live price (don't trust the snapshot — listing may have re-priced).
  const home = await getMarketplaceHomeData();
  const product = home.products.find((item) => item.id === productId);
  const vendor = product?.vendorSlug
    ? home.vendors.find((item) => item.slug === product.vendorSlug) ?? null
    : null;
  if (!product) {
    return NextResponse.json(
      { error: "Listing is no longer available — saved item kept for reference." },
      { status: 410 }
    );
  }

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
        quantity: Number((existingItem as { quantity: number }).quantity || 0) + quantity,
        price: product.basePrice,
        compare_at_price: product.compareAtPrice ?? null,
      })
      .eq("id", existingItem.id);
  } else {
    await admin.from("marketplace_cart_items").insert({
      cart_id: cartId,
      product_id: productId,
      vendor_id: vendor?.id ?? null,
      quantity,
      price: product.basePrice,
      compare_at_price: product.compareAtPrice ?? null,
    });
  }

  await restoreSavedItem(admin, viewer.user.id, savedItemId);
  await emitEngagementEvent(admin, {
    userId: viewer.user.id,
    eventType: "saved_item_restored",
    division: "marketplace",
    subjectType: "product",
    subjectId: productId,
    dedupeKey: `restore:${savedItemId}`,
    payload: { savedItemId },
  });

  revalidatePath("/cart");
  revalidatePath("/account/saved");

  const shell = await getMarketplaceShellState();
  return NextResponse.json({ ok: true, shell });
}

/**
 * DELETE — permanently remove a saved item.
 */
export async function DELETE(request: Request) {
  const viewer = await getMarketplaceViewer();
  if (!viewer.user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as RemovePayload;
  const savedItemId = String(payload.savedItemId || "").trim();
  if (!savedItemId) {
    return NextResponse.json({ error: "Missing saved item id." }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const ok = await removeSavedItem(admin, viewer.user.id, savedItemId);
  revalidatePath("/account/saved");
  return NextResponse.json({ ok });
}
