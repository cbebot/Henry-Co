import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/app/lib/owner-auth";
import { createAdminSupabase } from "@/app/lib/supabase-admin";

export const runtime = "nodejs";

function ensureTextArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item).trim())
    .filter(Boolean);
}

function cleanText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function nullableText(value: unknown) {
  const text = cleanText(value);
  return text || null;
}

function normalizeSubdomain(value: unknown) {
  const text = cleanText(value).toLowerCase();

  if (!text) return null;

  try {
    const url = new URL(text.startsWith("http") ? text : `https://${text}`);
    return url.hostname.split(".")[0] || text;
  } catch {
    return text.replace(/^https?:\/\//i, "").replace(/[/.].*$/, "");
  }
}

export async function GET() {
  const auth = await requireOwner();
  if (!auth.ok) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const admin = createAdminSupabase();

  const { data, error } = await admin
    .from("company_divisions")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ divisions: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (!auth.ok) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const admin = createAdminSupabase();
  const body = await request.json();
  const leadPersonId = nullableText(body.lead_person_id);
  let linkedLead:
    | {
        full_name: string | null;
        role_title: string | null;
        role_label: string | null;
        job_title: string | null;
        photo_url: string | null;
      }
    | null = null;

  if (leadPersonId) {
    const { data } = await admin
      .from("company_people")
      .select("full_name, role_title, role_label, job_title, photo_url")
      .eq("id", leadPersonId)
      .maybeSingle();

    linkedLead = data ?? null;
  }

  const payload = {
    id: body.id ?? undefined,
    slug: cleanText(body.slug).toLowerCase(),
    name: cleanText(body.name),
    tagline: nullableText(body.tagline),
    description: nullableText(body.description),
    accent: cleanText(body.accent, "#C9A227"),
    primary_url: nullableText(body.primary_url),
    subdomain: normalizeSubdomain(body.subdomain),
    logo_url: nullableText(body.logo_url),
    logo_public_id: nullableText(body.logo_public_id),
    cover_url: nullableText(body.cover_url),
    cover_public_id: nullableText(body.cover_public_id),
    categories: ensureTextArray(body.categories),
    highlights: ensureTextArray(body.highlights),
    who_its_for: ensureTextArray(body.who_its_for),
    how_it_works: ensureTextArray(body.how_it_works),
    trust: ensureTextArray(body.trust),
    status: ["active", "coming_soon", "paused"].includes(body.status)
      ? body.status
      : "active",
    lead_person_id: leadPersonId,
    lead_name: nullableText(body.lead_name) ?? linkedLead?.full_name ?? null,
    lead_title:
      nullableText(body.lead_title) ??
      linkedLead?.role_title ??
      linkedLead?.role_label ??
      linkedLead?.job_title ??
      null,
    lead_avatar_url: nullableText(body.lead_avatar_url) ?? linkedLead?.photo_url ?? null,
    is_featured: Boolean(body.is_featured),
    is_published: body.is_published !== false,
    sort_order: Number(body.sort_order ?? 100),
    updated_at: new Date().toISOString(),
  };

  if (!payload.slug || !payload.name) {
    return NextResponse.json(
      { error: "Division slug and name are required." },
      { status: 400 }
    );
  }

  const { error } = await admin.from("company_divisions").upsert(payload, {
    onConflict: "slug",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/owner");

  return NextResponse.json({ ok: true });
}
