import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/env";
import { getMarketplaceViewer } from "@/lib/marketplace/auth";
import { getMarketplaceHomeData, getMarketplaceShellState } from "@/lib/marketplace/data";
import { logMarketplaceAction } from "@/lib/marketplace/notifications";
import { createAdminSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

type CartPayload = {
  productSlug?: string;
  quantity?: number;
  itemId?: string;
};

function asQuantity(value: unknown, fallback = 1) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.floor(parsed));
}

async function resolveCartId() {
  const viewer = await getMarketplaceViewer();
  const cookieStore = await cookies();
  const admin = createAdminSupabase();
  const sessionToken = cookieStore.get("marketplace_cart_token")?.value || null;

  const { data: byUser } = viewer.user
    ? await admin
        .from("marketplace_carts")
        .select("id, session_token")
        .eq("status", "active")
        .eq("user_id", viewer.user.id)
        .maybeSingle()
    : { data: null };

  const { data: byToken } =
    !byUser?.id && sessionToken
      ? await admin
          .from("marketplace_carts")
          .select("id, session_token")
          .eq("status", "active")
          .eq("session_token", sessionToken)
          .maybeSingle()
      : { data: null };

  let id = byUser?.id ? String(byUser.id) : byToken?.id ? String(byToken.id) : null;
  let token = byUser?.session_token
    ? String(byUser.session_token)
    : byToken?.session_token
    ? String(byToken.session_token)
    : sessionToken;

  if (!id) {
    token = token || randomUUID();
    const { data: created, error } = await admin
      .from("marketplace_carts")
      .insert({
        user_id: viewer.user?.id ?? null,
        normalized_email: normalizeEmail(viewer.user?.email) ?? null,
        session_token: token,
        status: "active",
      } as never)
      .select("id")
      .maybeSingle();

    if (error || !created?.id) {
      throw error ?? new Error("Could not create marketplace cart.");
    }
    id = String(created.id);
  }

  return { viewer, cartId: id, sessionToken: token };
}

export async function GET() {
  const shell = await getMarketplaceShellState();
  return NextResponse.json(shell.cart, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as CartPayload;
  const quantity = Math.max(1, asQuantity(payload.quantity, 1));
  const productSlug = String(payload.productSlug || "").trim();

  if (!productSlug) {
    return NextResponse.json({ error: "Missing product slug." }, { status: 400 });
  }

  const snapshot = await getMarketplaceHomeData();
  const product = snapshot.products.find((item) => item.slug === productSlug);
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const admin = createAdminSupabase();
  const { viewer, cartId, sessionToken } = await resolveCartId();
  const vendor = snapshot.vendors.find((item) => item.slug === product.vendorSlug) ?? null;

  const { data: existingItem } = await admin
    .from("marketplace_cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("product_id", product.id)
    .maybeSingle();

  if (existingItem?.id) {
    await admin
      .from("marketplace_cart_items")
      .update({
        quantity: Number(existingItem.quantity || 0) + quantity,
        price: product.basePrice,
        compare_at_price: product.compareAtPrice,
      } as never)
      .eq("id", existingItem.id);
  } else {
    await admin.from("marketplace_cart_items").insert({
      cart_id: cartId,
      product_id: product.id,
      vendor_id: vendor?.id ?? null,
      quantity,
      price: product.basePrice,
      compare_at_price: product.compareAtPrice,
    } as never);
  }

  await logMarketplaceAction({
    eventType: "cart_item_added",
    actorUserId: viewer.user?.id ?? null,
    actorEmail: viewer.user?.email ?? null,
    entityType: "product",
    entityId: product.id,
    details: { productSlug, quantity, source: "api_cart" },
  });

  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath(`/product/${product.slug}`);

  const shell = await getMarketplaceShellState();
  const response = NextResponse.json({
    ok: true,
    shell,
    addedProductSlug: product.slug,
  });

  if (sessionToken) {
    response.cookies.set("marketplace_cart_token", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}

export async function PATCH(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as CartPayload;
  const itemId = String(payload.itemId || "").trim();
  const quantity = asQuantity(payload.quantity, 1);

  if (!itemId) {
    return NextResponse.json({ error: "Missing cart item id." }, { status: 400 });
  }

  const admin = createAdminSupabase();
  if (quantity <= 0) {
    await admin.from("marketplace_cart_items").delete().eq("id", itemId);
  } else {
    await admin
      .from("marketplace_cart_items")
      .update({ quantity } as never)
      .eq("id", itemId);
  }

  revalidatePath("/cart");
  revalidatePath("/checkout");

  const shell = await getMarketplaceShellState();
  return NextResponse.json({ ok: true, shell });
}

export async function DELETE(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as CartPayload;
  const itemId = String(payload.itemId || "").trim();

  if (!itemId) {
    return NextResponse.json({ error: "Missing cart item id." }, { status: 400 });
  }

  const admin = createAdminSupabase();
  await admin.from("marketplace_cart_items").delete().eq("id", itemId);

  revalidatePath("/cart");
  revalidatePath("/checkout");

  const shell = await getMarketplaceShellState();
  return NextResponse.json({ ok: true, shell });
}
