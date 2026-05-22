import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/app/lib/owner-auth";
import { ownerAuthDeniedResponse } from "@/lib/owner-api-auth";
import { createAdminSupabase } from "@/app/lib/supabase-admin";
import { normalizeCompanySettings } from "@/app/lib/company-settings-shared";
import { writeOwnerAudit } from "@/lib/owner-audit-log";
import { withOwnerMutationContext, actorFromOwnerAuth } from "@/lib/owner-mutation-context";
import { getHubPublicLocale } from "@/lib/locale-server";
import { autoTranslate } from "@/lib/i18n/auto-translate";

export const runtime = "nodejs";

export async function GET() {
  const locale = await getHubPublicLocale();
  const tx = (s: string) => autoTranslate(s, locale);

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
    return NextResponse.json({ error: await tx("Could not load company settings right now.") }, { status: 400 });
  }

  return NextResponse.json({ settings: data ?? null });
}

export async function POST(request: Request) {
  const locale = await getHubPublicLocale();
  const tx = (s: string) => autoTranslate(s, locale);

  const auth = await requireOwner();
  if (!auth.ok) {
    return ownerAuthDeniedResponse(auth);
  }

  return withOwnerMutationContext(
    {
      route: "/api/owner/settings",
      method: "POST",
      actor: actorFromOwnerAuth(auth),
    },
    async () => {
      const body = await request.json();
      const admin = createAdminSupabase();
      const normalized = normalizeCompanySettings(body);

      const payload = {
        ...normalized,
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await admin
        .from("company_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      const result = existing?.id
        ? await admin.from("company_settings").update(payload).eq("id", existing.id)
        : await admin.from("company_settings").insert(payload);

      if (result.error) {
        console.error("[owner/settings][POST]", result.error);
        return {
          outcome: "server_error" as const,
          value: NextResponse.json({ error: await tx("Could not save company settings right now.") }, { status: 400 }),
        };
      }

      await writeOwnerAudit({
        action: "owner.brand.settings.update",
        entityType: "company_settings",
        entityId: existing?.id ? String(existing.id) : null,
        oldValues: existing ?? null,
        newValues: payload,
        division: "hub",
      });

      revalidatePath("/");
      revalidatePath("/about");
      revalidatePath("/contact");
      revalidatePath("/privacy");
      revalidatePath("/terms");
      revalidatePath("/owner");

      return {
        outcome: "ok" as const,
        value: NextResponse.json({ ok: true }),
      };
    },
  );
}
