import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/env";
import { getMarketplaceViewer } from "@/lib/marketplace/auth";
import { getMarketplaceHomeData, getMarketplaceShellState } from "@/lib/marketplace/data";
import { logMarketplaceAction } from "@/lib/marketplace/notifications";
import { summarizeMarketplaceCartCurrencies } from "@/lib/cart-truth";
import { createAdminSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

type CartPayload = {
  productSlug?: string;
  quantity?: number;
  itemId?: string;
  sessionToken?: string;
};

function asQuantity(value: unknown, fallback = 1) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.floor(parsed));
}

async function resolveCartId(preferredSessionToken?: string | null) {
  const viewer = await getMarketplaceViewer();
  const cookieStore = await cookies();
  const admin = createAdminSupabase();
  const sessionToken = cookieStore.get("marketplace_cart_token")?.value || preferredSessionToken || null;

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
          .select("id, session_token, user_id")
          .eq("status", "active")
          .eq("session_token", sessionToken)
          .maybeSingle()
      : { data: null };

  if (viewer.user && byUser?.id && byToken?.id && String(byUser.id) !== String(byToken.id) && !byToken.user_id) {
    const guestCartId = String(byToken.id);
    const userCartId = String(byUser.id);

    const { data: guestItems } = await admin
      .from("marketplace_cart_items")
      .select("product_id, quantity, price, compare_at_price, vendor_id")
      .eq("cart_id", guestCartId);

    if (guestItems && guestItems.length > 0) {
      const { data: userItems } = await admin
        .from("marketplace_cart_items")
        .select("id, product_id, quantity")
        .eq("cart_id", userCartId);

      const userItemMap = new Map(
        (userItems || []).map((item: Record<string, unknown>) => [String(item.product_id), item])
      );

      for (const guestItem of guestItems) {
        const existing = userItemMap.get(String(guestItem.product_id));
        if (existing) {
          await admin
            .from("marketplace_cart_items")
            .update({
              quantity: Number(existing.quantity || 0) + Number(guestItem.quantity || 1),
              price: guestItem.price,
              compare_at_price: guestItem.compare_at_price,
            } as never)
            .eq("id", existing.id);
        } else {
          await admin.from("marketplace_cart_items").insert({
            cart_id: userCartId,
            product_id: guestItem.product_id,
            vendor_id: guestItem.vendor_id,
            quantity: guestItem.quantity,
            price: guestItem.price,
            compare_at_price: guestItem.compare_at_price,
          } as never);
        }
      }
    }

    await admin
      .from("marketplace_cart_items")
      .delete()
      .eq("cart_id", guestCartId);
    await admin
      .from("marketplace_carts")
      .update({ status: "merged" } as never)
      .eq("id", guestCartId);

    return {
      viewer,
      cartId: userCartId,
      sessionToken: byUser.session_token ? String(byUser.session_token) : sessionToken,
    };
  }

  if (viewer.user && byToken?.id && !byToken.user_id && !byUser?.id) {
    await admin
      .from("marketplace_carts")
      .update({
        user_id: viewer.user.id,
        normalized_email: normalizeEmail(viewer.user.email),
      } as never)
      .eq("id", byToken.id);

    return {
      viewer,
      cartId: String(byToken.id),
      sessionToken: byToken.session_token ? String(byToken.session_token) : sessionToken,
    };
  }

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

async function verifyCartItemOwnership(itemId: string) {
  const viewer = await getMarketplaceViewer();
  const cookieStore = await cookies();
  const admin = createAdminSupabase();
  const sessionToken = cookieStore.get("marketplace_cart_token")?.value || null;

  const { data: item } = await admin
    .from("marketplace_cart_items")
    .select("id, cart_id")
    .eq("id", itemId)
    .maybeSingle();

  if (!item) return null;

  const { data: cart } = await admin
    .from("marketplace_carts")
    .select("id, user_id, session_token")
    .eq("id", item.cart_id)
    .maybeSingle();

  if (!cart) return null;

  const ownerMatch =
    (viewer.user && cart.user_id && String(cart.user_id) === viewer.user.id) ||
    (sessionToken && cart.session_token && String(cart.session_token) === sessionToken);

  if (!ownerMatch) return null;

  return item;
}

function setCartCookie(response: NextResponse, sessionToken: string) {
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set("marketplace_cart_token", sessionToken, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    secure: isProduction,
    maxAge: 60 * 60 * 24 * 30,
  });
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
  const { viewer, cartId, sessionToken } = await resolveCartId(payload.sessionToken || null);
  const vendor = snapshot.vendors.find((item) => item.slug === product.vendorSlug) ?? null;
  const { data: existingCartRows } = await admin
    .from("marketplace_cart_items")
    .select("product_id, quantity, price")
    .eq("cart_id", cartId);
  const candidateCurrencySummary = summarizeMarketplaceCartCurrencies([
    ...(existingCartRows ?? []).map((row: Record<string, unknown>) => {
      const existingProduct = snapshot.products.find((item) => item.id === String(row.product_id));
      return {
        quantity: Number(row.quantity || 0),
        price: Number(row.price || 0),
        currency: existingProduct?.currency || "NGN",
      };
    }),
    {
      quantity,
      price: product.basePrice,
      currency: product.currency,
    },
  ]);

  if (candidateCurrencySummary.mixedPricing) {
    return NextResponse.json(
      { error: candidateCurrencySummary.blockingReason },
      { status: 409 }
    );
  }

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

  const shell = await getMarketplaceShellState({ sessionToken });
  const response = NextResponse.json({
    ok: true,
    shell,
    addedProductSlug: product.slug,
  });

  if (sessionToken) {
    setCartCookie(response, sessionToken);
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

  const verified = await verifyCartItemOwnership(itemId);
  if (!verified) {
    return NextResponse.json({ error: "Cart item not found." }, { status: 404 });
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

  const verified = await verifyCartItemOwnership(itemId);
  if (!verified) {
    return NextResponse.json({ error: "Cart item not found." }, { status: 404 });
  }

  const admin = createAdminSupabase();
  await admin.from("marketplace_cart_items").delete().eq("id", itemId);

  revalidatePath("/cart");
  revalidatePath("/checkout");

  const shell = await getMarketplaceShellState();
  return NextResponse.json({ ok: true, shell });
}
