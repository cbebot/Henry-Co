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

  const payload = (await request.json().catch(() => ({}))) as { vendorSlug?: string };
  const vendorSlug = String(payload.vendorSlug || "").trim();
  if (!vendorSlug) {
    return NextResponse.json({ error: "Missing vendor slug." }, { status: 400 });
  }

  const snapshot = await getMarketplaceHomeData();
  const vendor = snapshot.vendors.find((item) => item.slug === vendorSlug);
  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
  }

  const admin = createAdminSupabase();
  const { data: existing } = await admin
    .from("marketplace_vendor_follows")
    .select("id")
    .eq("user_id", viewer.user.id)
    .eq("vendor_id", vendor.id)
    .maybeSingle();

  if (existing?.id) {
    await admin.from("marketplace_vendor_follows").delete().eq("id", existing.id);
    await admin
      .from("marketplace_vendors")
      .update({ followers_count: Math.max(0, vendor.followersCount - 1) } as never)
      .eq("id", vendor.id);
  } else {
    await admin.from("marketplace_vendor_follows").insert({
      user_id: viewer.user.id,
      normalized_email: normalizeEmail(viewer.user.email),
      vendor_id: vendor.id,
    } as never);
    await admin
      .from("marketplace_vendors")
      .update({ followers_count: vendor.followersCount + 1 } as never)
      .eq("id", vendor.id);
  }

  await logMarketplaceAction({
    eventType: existing?.id ? "vendor_unfollowed" : "vendor_followed",
    actorUserId: viewer.user.id,
    actorEmail: viewer.user.email,
    entityType: "vendor",
    entityId: vendor.id,
    details: { vendorSlug, source: "api_follows" },
  });

  revalidatePath("/account/following");
  revalidatePath(`/store/${vendor.slug}`);

  const shell = await getMarketplaceShellState();
  return NextResponse.json({
    ok: true,
    active: !existing?.id,
    shell,
  });
}
