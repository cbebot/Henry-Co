import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/app/lib/owner-auth";
import { ownerAuthDeniedResponse } from "@/lib/owner-api-auth";
import { createAdminSupabase } from "@/app/lib/supabase-admin";
import { normalizeCompanySettings } from "@/app/lib/company-settings-shared";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireOwner();
  if (!auth.ok) {
    return ownerAuthDeniedResponse(auth);
  }

  const admin = createAdminSupabase();

  const { data, error } = await admin
    .from("company_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[owner/settings][GET]", error);
    return NextResponse.json({ error: "Could not load company settings right now." }, { status: 400 });
  }

  return NextResponse.json({ settings: data ?? null });
}

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (!auth.ok) {
    return ownerAuthDeniedResponse(auth);
  }

  const body = await request.json();
  const admin = createAdminSupabase();
  const normalized = normalizeCompanySettings(body);

  const payload = {
    ...normalized,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await admin
    .from("company_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  const result = existing?.id
    ? await admin.from("company_settings").update(payload).eq("id", existing.id)
    : await admin.from("company_settings").insert(payload);

  if (result.error) {
    console.error("[owner/settings][POST]", result.error);
    return NextResponse.json({ error: "Could not save company settings right now." }, { status: 400 });
  }

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/privacy");
  revalidatePath("/terms");
  revalidatePath("/owner");

  return NextResponse.json({ ok: true });
}
