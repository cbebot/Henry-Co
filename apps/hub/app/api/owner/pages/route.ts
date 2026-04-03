import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/app/lib/owner-auth";
import { createAdminSupabase } from "@/app/lib/supabase-admin";

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
  const auth = await requireOwner();
  if (!auth.ok) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const admin = createAdminSupabase();

  const { data, error } = await admin
    .from("company_pages")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ pages: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (!auth.ok) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid page JSON payload." },
      { status: 400 }
    );
  }

  if (!slug || !title) {
    return NextResponse.json(
      { error: "Page slug and title are required." },
      { status: 400 }
    );
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
      body.secondary_cta_label ?? body.hero_secondary_label
    ),
    hero_secondary_href: nullableText(
      body.secondary_cta_href ?? body.hero_secondary_href
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

  const { error } = await admin.from("company_pages").upsert(payload, {
    onConflict: "slug",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/privacy");
  revalidatePath("/terms");
  revalidatePath("/owner");

  return NextResponse.json({ ok: true });
}
