import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/env";
import { getMarketplaceViewer } from "@/lib/marketplace/auth";
import { getMarketplaceHomeData, getMarketplaceShellState } from "@/lib/marketplace/data";
import { logMarketplaceAction } from "@/lib/marketplace/notifications";
import { createAdminSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const viewer = await getMarketplaceViewer();
  if (!viewer.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as { productSlug?: string };
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
  const { data: existing } = await admin
    .from("marketplace_wishlists")
    .select("id")
    .eq("user_id", viewer.user.id)
    .eq("product_id", product.id)
    .maybeSingle();

  if (existing?.id) {
    await admin.from("marketplace_wishlists").delete().eq("id", existing.id);
  } else {
    await admin.from("marketplace_wishlists").insert({
      user_id: viewer.user.id,
      normalized_email: normalizeEmail(viewer.user.email),
      product_id: product.id,
    } as never);
  }

  await logMarketplaceAction({
    eventType: existing?.id ? "wishlist_removed" : "wishlist_added",
    actorUserId: viewer.user.id,
    actorEmail: viewer.user.email,
    entityType: "product",
    entityId: product.id,
    details: { productSlug, source: "api_wishlist" },
  });

  revalidatePath("/account/wishlist");
  revalidatePath(`/product/${product.slug}`);

  const shell = await getMarketplaceShellState();
  return NextResponse.json({
    ok: true,
    active: !existing?.id,
    shell,
  });
}
