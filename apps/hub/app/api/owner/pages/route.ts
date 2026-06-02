import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/app/lib/owner-auth";
import { ownerAuthDeniedResponse } from "@/lib/owner-api-auth";
import { createAdminSupabase } from "@/app/lib/supabase-admin";
import { writeOwnerAudit } from "@/lib/owner-audit-log";
import { withOwnerMutationContext, actorFromOwnerAuth } from "@/lib/owner-mutation-context";
import { getHubPublicLocale } from "@/lib/locale-server";
import { autoTranslate } from "@/lib/i18n/auto-translate";

export const runtime = "nodejs";

function cleanText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function nullableText(value: unknown) {
  const text = cleanText(value);
  return text || null;
}

function parseJsonArray(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    const parsed = JSON.parse(value || "[]");
    if (!Array.isArray(parsed)) {
      throw new Error("Structured page content must be a JSON array.");
    }

    return parsed;
  }

  return [];
}

export async function GET() {
  const locale = await getHubPublicLocale();
  const tx = (s: string) => autoTranslate(s, locale);

  const auth = await requireOwner();
  if (!auth.ok) {
    return ownerAuthDeniedResponse(auth);
  }

  const admin = createAdminSupabase();

  const { data, error } = await admin
    .from("company_pages")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[owner/pages][GET]", error);
    return NextResponse.json({ error: await tx("Could not load company pages right now.") }, { status: 400 });
  }

  return NextResponse.json({ pages: data ?? [] });
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
      route: "/api/owner/pages",
      method: "POST",
      actor: actorFromOwnerAuth(auth),
    },
    async () => {
      const admin = createAdminSupabase();
      const body = await request.json();

      const slug = cleanText(body.slug ?? body.page_key).toLowerCase();
      const title = cleanText(body.title, slug === "home" ? "Henry & Co." : "Henry & Co.");
      let stats: unknown[] = [];
      let sections: unknown[] = [];

      try {
        stats = parseJsonArray(body.stats);
        sections = parseJsonArray(body.sections ?? body.body);
      } catch (error) {
        return {
          outcome: "validation" as const,
          value: NextResponse.json(
            { error: error instanceof Error ? error.message : "Invalid page JSON payload." },
            { status: 400 },
          ),
        };
      }

      if (!slug || !title) {
        return {
          outcome: "validation" as const,
          value: NextResponse.json(
            { error: "Page slug and title are required." },
            { status: 400 },
          ),
        };
      }

      const payload = {
        id: body.id ?? undefined,
        slug,
        page_key: slug,
        title,
        subtitle: nullableText(body.subtitle),
        hero_badge: nullableText(body.hero_badge ?? body.hero_kicker),
        intro: nullableText(body.intro ?? body.hero_body ?? body.intro_body),
        hero_image_url: nullableText(body.hero_image_url ?? body.cover_image_url),
        primary_cta_label: nullableText(body.primary_cta_label ?? body.cta_primary_label),
        primary_cta_href: nullableText(body.primary_cta_href ?? body.cta_primary_href),
        secondary_cta_label: nullableText(body.secondary_cta_label ?? body.cta_secondary_label),
        secondary_cta_href: nullableText(body.secondary_cta_href ?? body.cta_secondary_href),
        cta_primary_label: nullableText(body.primary_cta_label ?? body.cta_primary_label),
        cta_primary_href: nullableText(body.primary_cta_href ?? body.cta_primary_href),
        cta_secondary_label: nullableText(body.secondary_cta_label ?? body.cta_secondary_label),
        cta_secondary_href: nullableText(body.secondary_cta_href ?? body.cta_secondary_href),
        hero_kicker: nullableText(body.hero_badge ?? body.hero_kicker),
        hero_title: title,
        hero_body: nullableText(body.intro ?? body.hero_body ?? body.intro_body),
        hero_primary_label: nullableText(body.primary_cta_label ?? body.hero_primary_label),
        hero_primary_href: nullableText(body.primary_cta_href ?? body.hero_primary_href),
        hero_secondary_label: nullableText(
          body.secondary_cta_label ?? body.hero_secondary_label,
        ),
        hero_secondary_href: nullableText(
          body.secondary_cta_href ?? body.hero_secondary_href,
        ),
        body: sections,
        stats,
        sections,
        seo_title: nullableText(body.seo_title),
        seo_description: nullableText(body.seo_description),
        is_published: body.is_published !== false,
        sort_order: Number(body.sort_order ?? 100),
        updated_at: new Date().toISOString(),
      };

      const { data: beforeRecord } = await admin
        .from("company_pages")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      const { error } = await admin.from("company_pages").upsert(payload, {
        onConflict: "slug",
      });

      if (error) {
        console.error("[owner/pages][POST]", error);
        return {
          outcome: "server_error" as const,
          value: NextResponse.json({ error: await tx("Could not save this page right now.") }, { status: 400 }),
        };
      }

      await writeOwnerAudit({
        action: beforeRecord ? "owner.brand.page.update" : "owner.brand.page.create",
        entityType: "company_page",
        entityId: (beforeRecord?.id as string | undefined) ?? null,
        oldValues: beforeRecord,
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
