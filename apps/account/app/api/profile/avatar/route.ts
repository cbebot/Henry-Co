import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { uploadProfileAvatar } from "@/lib/cloudinary";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ensureAccountProfileRecords } from "@/lib/account-profile";

export async function POST(request: Request) {
  try {
    await cookies();
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureAccountProfileRecords(user);

    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const { secureUrl } = await uploadProfileAvatar(file, user.id);

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: updateError } = await admin
      .from("customer_profiles")
      .upsert(
        {
          id: user.id,
          email: user.email || null,
          avatar_url: secureUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (updateError) throw updateError;

    return NextResponse.json({ avatar_url: secureUrl });
  } catch (err: unknown) {
    console.error("[profile/avatar] Upload error:", err);
    return NextResponse.json(
      { error: "We couldn't update your photo. Please try again." },
      { status: 500 },
    );
  }
}
