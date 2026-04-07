import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/app/lib/owner-auth";
import { ownerAuthDeniedResponse } from "@/lib/owner-api-auth";
import {
  normalizeCompanyPerson,
  type CompanyPersonRecord,
} from "@/app/lib/company-people-shared";
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

export async function GET() {
  const auth = await requireOwner();
  if (!auth.ok) {
    return ownerAuthDeniedResponse(auth);
  }

  const admin = createAdminSupabase();

  const { data, error } = await admin
    .from("company_people")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("full_name", { ascending: true });

  if (error) {
    console.error("[owner/people][GET]", error);
    return NextResponse.json({ error: "Could not load people records right now." }, { status: 400 });
  }

  return NextResponse.json({
    people: Array.isArray(data)
      ? (data as Partial<CompanyPersonRecord>[]).map((row) => normalizeCompanyPerson(row))
      : [],
  });
}

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (!auth.ok) {
    return ownerAuthDeniedResponse(auth);
  }

  const admin = createAdminSupabase();
  const body = await request.json();
  const normalized = normalizeCompanyPerson({
    id: cleanText(body.id),
    page_key: cleanText(body.page_key ?? body.page_slug, "about"),
    page_slug: cleanText(body.page_slug ?? body.page_key, "about"),
    group_key: cleanText(body.group_key, "leadership"),
    kind: nullableText(body.kind),
    full_name: cleanText(body.full_name),
    job_title: nullableText(body.job_title),
    role_title: nullableText(body.role_title) ?? nullableText(body.role_label),
    role_label: nullableText(body.role_label) ?? nullableText(body.role_title),
    division_slug: nullableText(body.division_slug),
    department: nullableText(body.department),
    short_bio: nullableText(body.short_bio),
    long_bio: nullableText(body.long_bio),
    bio: nullableText(body.bio),
    email: nullableText(body.email),
    phone: nullableText(body.phone),
    linkedin_url: nullableText(body.linkedin_url),
    photo_url: nullableText(body.photo_url),
    image_url: nullableText(body.image_url),
    photo_public_id: nullableText(body.photo_public_id),
    sort_order: Number(body.sort_order ?? 100),
    is_owner: Boolean(body.is_owner),
    is_manager: Boolean(body.is_manager),
    is_featured: Boolean(body.is_featured),
    is_published: body.is_published !== false,
    updated_at: new Date().toISOString(),
  });

  const payload = {
    id: normalized.id || undefined,
    page_key: normalized.page_key,
    page_slug: normalized.page_slug ?? normalized.page_key,
    group_key: normalized.group_key,
    kind: normalized.kind ?? "leadership",
    full_name: normalized.full_name,
    job_title: normalized.job_title,
    role_title: normalized.role_title ?? normalized.role_label ?? normalized.job_title,
    role_label: normalized.role_label ?? normalized.role_title ?? normalized.job_title,
    division_slug: normalized.division_slug,
    department: normalized.department,
    short_bio: normalized.short_bio,
    long_bio: normalized.long_bio,
    bio: normalized.bio ?? normalized.short_bio ?? normalized.long_bio ?? "",
    email: normalized.email,
    phone: normalized.phone,
    linkedin_url: normalized.linkedin_url,
    photo_url: normalized.photo_url,
    image_url: normalized.image_url ?? normalized.photo_url,
    photo_public_id: normalized.photo_public_id,
    sort_order: normalized.sort_order,
    is_owner: normalized.is_owner,
    is_manager: normalized.is_manager,
    is_featured: normalized.is_featured,
    is_published: normalized.is_published,
    updated_at: new Date().toISOString(),
  };

  if (!payload.full_name) {
    return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  }

  const result = body.id
    ? await admin.from("company_people").update(payload).eq("id", body.id)
    : await admin.from("company_people").insert(payload);

  if (result.error) {
    console.error("[owner/people][POST]", result.error);
    return NextResponse.json({ error: "Could not save this person record right now." }, { status: 400 });
  }

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/owner");

  return NextResponse.json({ ok: true });
}
