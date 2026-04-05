"use server";

import { revalidatePath } from "next/cache";
import { getAccountUrl } from "@henryco/config";
import { requireOwner } from "@/lib/owner-auth";
import { createAdminSupabase } from "@/lib/supabase";
import { normalizeEmail } from "@/lib/env";
import type { OwnerFormState } from "@/lib/owner-form-state";
import { rethrowIfRedirect, toOwnerFacingError } from "@/lib/owner-form-state";

type JsonRecord = Record<string, unknown>;

function toText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || "";
}

function toNullableText(value: unknown) {
  const text = toText(value);
  return text || null;
}

function splitCsv(value: unknown) {
  return toText(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readPermissionList(formData: FormData) {
  const fromBoxes = formData
    .getAll("permissions")
    .map((entry) => String(entry).trim())
    .filter(Boolean);
  if (fromBoxes.length) return fromBoxes;
  return splitCsv(formData.get("permissions"));
}

function splitStructuredLines(value: unknown) {
  return toText(value)
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function safeJsonParseArray(value: unknown) {
  const text = toText(value);
  if (!text) return [] as unknown[];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function findAuthUserByEmail(email: string) {
  const admin = createAdminSupabase();
  let page = 1;

  while (page <= 5) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      console.error("[owner] listUsers failed while resolving invite target", error.message);
      return null;
    }

    const match = (data?.users ?? []).find(
      (user) => normalizeEmail(user.email) === normalizeEmail(email)
    );
    if (match) return match;
    if ((data?.users?.length ?? 0) < 200) break;
    page += 1;
  }

  return null;
}

async function writeStaffAudit(input: {
  action: string;
  entityId: string;
  meta: JsonRecord;
}) {
  try {
    const owner = await requireOwner();
    const admin = createAdminSupabase();
    const { error } = await admin.from("staff_audit_logs").insert({
      actor_id: owner.id,
      actor_role: owner.ownerRole || "owner",
      action: input.action,
      entity: "staff",
      entity_id: input.entityId,
      meta: input.meta,
    } as never);
    if (error) {
      console.error("[owner] staff_audit_logs insert failed", error.message);
    }
  } catch (e) {
    rethrowIfRedirect(e);
    console.error("[owner] writeStaffAudit failed", e);
  }
}

async function upsertCompanyPerson(input: {
  email: string | null;
  fullName: string;
  phone: string | null;
  role: string;
  division: string | null;
  isManager: boolean;
  isOwner?: boolean;
}) {
  if (!input.email) return null;

  const admin = createAdminSupabase();
  const existing = await admin
    .from("company_people")
    .select("id")
    .eq("email", input.email)
    .limit(1)
    .maybeSingle();

  const payload = {
    page_key: "about",
    page_slug: "about",
    group_key: "workforce",
    kind: input.isOwner ? "owner" : input.isManager ? "manager" : "staff",
    full_name: input.fullName,
    job_title: input.role,
    role_title: input.role,
    role_label: input.role,
    division_slug: input.division,
    department: input.division,
    short_bio: null,
    long_bio: null,
    bio: null,
    email: input.email,
    phone: input.phone,
    photo_url: null,
    image_url: null,
    is_owner: Boolean(input.isOwner),
    is_manager: input.isManager,
    is_featured: false,
    is_published: false,
    sort_order: 900,
    updated_at: new Date().toISOString(),
  };

  if (existing.data?.id) {
    await admin.from("company_people").update(payload as never).eq("id", existing.data.id);
    return existing.data.id;
  }

  const inserted = await admin.from("company_people").insert(payload as never).select("id").maybeSingle();
  return inserted.data?.id ?? null;
}

async function revalidateOwnerSurfaces() {
  revalidatePath("/owner");
  revalidatePath("/owner/staff");
  revalidatePath("/owner/brand");
  revalidatePath("/owner/settings");
}

function buildStaffMetadata(input: {
  fullName: string;
  phone: string | null;
  division: string | null;
  role: string;
  permissions: string[];
}) {
  return {
    user_metadata: {
      full_name: input.fullName,
      phone: input.phone,
      role: input.role,
      division: input.division,
      permissions: input.permissions,
    },
    app_metadata: {
      role: input.role,
      henryco: {
        role: input.role,
        division: input.division,
        permissions: input.permissions,
      },
    },
  };
}

export async function inviteStaffMemberAction(
  _prevState: OwnerFormState,
  formData: FormData
): Promise<OwnerFormState> {
  try {
    const owner = await requireOwner();
    const admin = createAdminSupabase();

    const email = normalizeEmail(toNullableText(formData.get("email")));
    const fullName = toText(formData.get("fullName"));
    const phone = toNullableText(formData.get("phone"));
    const division = toNullableText(formData.get("division"));
    const role = toText(formData.get("role")).toLowerCase() || "staff";
    const permissions = readPermissionList(formData);

    if (!email || !fullName) {
      return { ok: false, message: "Email and full name are required." };
    }

    const existingUser = await findAuthUserByEmail(email);
    const metadata = buildStaffMetadata({ fullName, phone, division, role, permissions });

    let userId = existingUser?.id ?? null;

    if (existingUser) {
      const { error } = await admin.auth.admin.updateUserById(existingUser.id, {
        email,
        user_metadata: {
          ...(existingUser.user_metadata ?? {}),
          ...(metadata.user_metadata as JsonRecord),
        },
        app_metadata: {
          ...(existingUser.app_metadata ?? {}),
          ...(metadata.app_metadata as JsonRecord),
        },
      });

      if (error) throw error;
    } else {
      const invite = await admin.auth.admin.inviteUserByEmail(email, {
        data: metadata.user_metadata,
        redirectTo: getAccountUrl("/login"),
      });
      if (invite.error) throw invite.error;
      userId = invite.data.user?.id ?? null;

      if (userId) {
        const { error } = await admin.auth.admin.updateUserById(userId, {
          app_metadata: metadata.app_metadata,
        });
        if (error) throw error;
      }
    }

    if (userId) {
      await admin.from("customer_profiles").upsert({
        id: userId,
        full_name: fullName,
        phone,
      } as never);
    }

    await upsertCompanyPerson({
      email,
      fullName,
      phone,
      role,
      division,
      isManager: role.includes("manager") || role.includes("lead"),
    });

    if (userId) {
      await writeStaffAudit({
        action: "staff.invite",
        entityId: userId,
        meta: {
          by_owner_id: owner.id,
          email,
          role,
          division,
          permissions,
        },
      });
    }

    await revalidateOwnerSurfaces();
    return { ok: true, message: "Invitation sent and workforce records updated." };
  } catch (error) {
    rethrowIfRedirect(error);
    console.error("[owner] inviteStaffMemberAction", error);
    return { ok: false, message: toOwnerFacingError(error) };
  }
}

export async function saveStaffMemberAction(
  _prevState: OwnerFormState,
  formData: FormData
): Promise<OwnerFormState> {
  try {
    await requireOwner();
    const admin = createAdminSupabase();
    const userId = toText(formData.get("userId"));
    const email = normalizeEmail(toNullableText(formData.get("email")));
    const fullName = toText(formData.get("fullName"));
    const phone = toNullableText(formData.get("phone"));
    const division = toNullableText(formData.get("division"));
    const role = toText(formData.get("role")).toLowerCase() || "staff";
    const permissions = readPermissionList(formData);

    if (!userId || !email || !fullName) {
      return { ok: false, message: "User, email, and full name are required." };
    }

    const current = await admin.auth.admin.getUserById(userId);
    if (current.error || !current.data.user) {
      throw current.error || new Error("Staff account not found.");
    }

    const metadata = buildStaffMetadata({ fullName, phone, division, role, permissions });
    const { error } = await admin.auth.admin.updateUserById(userId, {
      email,
      user_metadata: {
        ...(current.data.user.user_metadata ?? {}),
        ...(metadata.user_metadata as JsonRecord),
      },
      app_metadata: {
        ...(current.data.user.app_metadata ?? {}),
        ...(metadata.app_metadata as JsonRecord),
      },
    });

    if (error) throw error;

    await admin.from("customer_profiles").upsert({
      id: userId,
      full_name: fullName,
      phone,
    } as never);

    await upsertCompanyPerson({
      email,
      fullName,
      phone,
      role,
      division,
      isManager: role.includes("manager") || role.includes("lead"),
    });

    await writeStaffAudit({
      action: "staff.update",
      entityId: userId,
      meta: {
        email,
        role,
        division,
        permissions,
      },
    });

    await revalidateOwnerSurfaces();
    return { ok: true, message: "Staff profile saved." };
  } catch (error) {
    rethrowIfRedirect(error);
    console.error("[owner] saveStaffMemberAction", error);
    return { ok: false, message: toOwnerFacingError(error) };
  }
}

export async function toggleStaffMemberStatusAction(
  _prevState: OwnerFormState,
  formData: FormData
): Promise<OwnerFormState> {
  try {
    await requireOwner();
    const admin = createAdminSupabase();
    const userId = toText(formData.get("userId"));
    const intent = toText(formData.get("intent")).toLowerCase();

    if (!userId || !["suspend", "reactivate"].includes(intent)) {
      return { ok: false, message: "Invalid staff status change request." };
    }

    const result = await admin.auth.admin.updateUserById(userId, {
      ban_duration: intent === "suspend" ? "876000h" : "none",
    });
    if (result.error) throw result.error;

    await writeStaffAudit({
      action: intent === "suspend" ? "staff.suspend" : "staff.reactivate",
      entityId: userId,
      meta: {},
    });

    await revalidateOwnerSurfaces();
    return {
      ok: true,
      message: intent === "suspend" ? "Access suspended for this account." : "Account reactivated.",
    };
  } catch (error) {
    rethrowIfRedirect(error);
    console.error("[owner] toggleStaffMemberStatusAction", error);
    return { ok: false, message: toOwnerFacingError(error) };
  }
}

export async function saveCompanySettingsAction(
  _prevState: OwnerFormState,
  formData: FormData
): Promise<OwnerFormState> {
  try {
    await requireOwner();
    const admin = createAdminSupabase();

    const payload = {
      id: toText(formData.get("id")) || "primary",
      company_name: toNullableText(formData.get("company_name")),
      legal_name: toNullableText(formData.get("legal_name")),
      brand_title: toText(formData.get("brand_title")) || "Henry & Co.",
      brand_subtitle: toNullableText(formData.get("brand_subtitle")),
      brand_description: toNullableText(formData.get("brand_description")),
      footer_blurb: toNullableText(formData.get("footer_blurb")),
      support_email: toNullableText(formData.get("support_email")),
      support_phone: toNullableText(formData.get("support_phone")),
      office_address: toNullableText(formData.get("office_address")),
      address: toNullableText(formData.get("office_address")),
      base_domain: toNullableText(formData.get("base_domain")),
      brand_accent: toNullableText(formData.get("brand_accent")),
      logo_url: toNullableText(formData.get("logo_url")),
      favicon_url: toNullableText(formData.get("favicon_url")),
      default_meta_title: toNullableText(formData.get("default_meta_title")),
      default_meta_description: toNullableText(formData.get("default_meta_description")),
      copyright_label: toNullableText(formData.get("copyright_label")),
      socials: {
        instagram: toNullableText(formData.get("social_instagram")),
        linkedin: toNullableText(formData.get("social_linkedin")),
        whatsapp: toNullableText(formData.get("social_whatsapp")),
        x: toNullableText(formData.get("social_x")),
      },
      updated_at: new Date().toISOString(),
    };

    const { error } = await admin.from("company_settings").upsert(payload as never, {
      onConflict: "id",
    });
    if (error) throw error;

    revalidatePath("/");
    await revalidateOwnerSurfaces();
    return { ok: true, message: "Company settings saved." };
  } catch (error) {
    rethrowIfRedirect(error);
    console.error("[owner] saveCompanySettingsAction", error);
    return { ok: false, message: toOwnerFacingError(error) };
  }
}

export async function saveCompanySiteSettingsAction(
  _prevState: OwnerFormState,
  formData: FormData
): Promise<OwnerFormState> {
  try {
    await requireOwner();
    const admin = createAdminSupabase();

    const payload = {
      id: toNullableText(formData.get("id")),
      site_key: toText(formData.get("site_key")) || "hub",
      brand_title: toText(formData.get("brand_title")) || "Henry & Co.",
      brand_subtitle: toNullableText(formData.get("brand_subtitle")),
      legal_company_name: toNullableText(formData.get("legal_company_name")),
      support_email: toNullableText(formData.get("support_email")),
      support_phone: toNullableText(formData.get("support_phone")),
      address_line: toNullableText(formData.get("address_line")),
      logo_url: toNullableText(formData.get("logo_url")),
      light_logo_url: toNullableText(formData.get("light_logo_url")),
      favicon_url: toNullableText(formData.get("favicon_url")),
      primary_accent: toNullableText(formData.get("primary_accent")),
      secondary_accent: toNullableText(formData.get("secondary_accent")),
      theme_preference: toNullableText(formData.get("theme_preference")) || "system",
      meta_title: toNullableText(formData.get("meta_title")),
      meta_description: toNullableText(formData.get("meta_description")),
      footer_notice: toNullableText(formData.get("footer_notice")),
      updated_at: new Date().toISOString(),
    };

    const { error } = await admin.from("company_site_settings").upsert(payload as never, {
      onConflict: "site_key",
    });
    if (error) throw error;

    revalidatePath("/");
    await revalidateOwnerSurfaces();
    return { ok: true, message: "Hub shell settings saved." };
  } catch (error) {
    rethrowIfRedirect(error);
    console.error("[owner] saveCompanySiteSettingsAction", error);
    return { ok: false, message: toOwnerFacingError(error) };
  }
}

export async function saveDivisionBrandAction(
  _prevState: OwnerFormState,
  formData: FormData
): Promise<OwnerFormState> {
  try {
    await requireOwner();
    const admin = createAdminSupabase();

    const slug = toText(formData.get("slug")).toLowerCase();
    if (!slug) {
      return { ok: false, message: "Division slug is required." };
    }

    const payload = {
      id: toNullableText(formData.get("id")),
      slug,
      name: toText(formData.get("name")) || slug,
      tagline: toNullableText(formData.get("tagline")),
      description: toNullableText(formData.get("description")),
      short_description: toNullableText(formData.get("description")),
      accent: toNullableText(formData.get("accent")) || "#C9A227",
      status: toNullableText(formData.get("status")) || "active",
      subdomain: toNullableText(formData.get("subdomain")),
      domain: toNullableText(formData.get("domain")),
      primary_url: toNullableText(formData.get("primary_url")),
      logo_url: toNullableText(formData.get("logo_url")),
      cover_url: toNullableText(formData.get("cover_url")),
      categories: splitCsv(formData.get("categories")),
      highlights: splitStructuredLines(formData.get("highlights")),
      who_its_for: splitStructuredLines(formData.get("who_its_for")),
      how_it_works: splitStructuredLines(formData.get("how_it_works")),
      trust: splitStructuredLines(formData.get("trust")),
      lead_name: toNullableText(formData.get("lead_name")),
      lead_title: toNullableText(formData.get("lead_title")),
      is_featured: toText(formData.get("is_featured")) === "true",
      is_published: toText(formData.get("is_published")) !== "false",
      sort_order: Number(formData.get("sort_order") || 100),
      updated_at: new Date().toISOString(),
    };

    const { error } = await admin.from("company_divisions").upsert(payload as never, {
      onConflict: "slug",
    });
    if (error) throw error;

    revalidatePath("/");
    await revalidateOwnerSurfaces();
    return { ok: true, message: `Division “${slug}” saved.` };
  } catch (error) {
    rethrowIfRedirect(error);
    console.error("[owner] saveDivisionBrandAction", error);
    return { ok: false, message: toOwnerFacingError(error) };
  }
}

export async function saveCompanyPageAction(
  _prevState: OwnerFormState,
  formData: FormData
): Promise<OwnerFormState> {
  try {
    await requireOwner();
    const admin = createAdminSupabase();

    const slug = toText(formData.get("slug")).toLowerCase();
    if (!slug) {
      return { ok: false, message: "Page slug is required." };
    }

    const payload = {
      id: toNullableText(formData.get("id")),
      slug,
      page_key: slug,
      title: toText(formData.get("title")) || "Henry & Co.",
      subtitle: toNullableText(formData.get("subtitle")),
      hero_badge: toNullableText(formData.get("hero_badge")),
      intro: toNullableText(formData.get("intro")),
      hero_image_url: toNullableText(formData.get("hero_image_url")),
      primary_cta_label: toNullableText(formData.get("primary_cta_label")),
      primary_cta_href: toNullableText(formData.get("primary_cta_href")),
      secondary_cta_label: toNullableText(formData.get("secondary_cta_label")),
      secondary_cta_href: toNullableText(formData.get("secondary_cta_href")),
      hero_kicker: toNullableText(formData.get("hero_badge")),
      hero_title: toText(formData.get("hero_title")) || toText(formData.get("title")) || "Henry & Co.",
      hero_body: toNullableText(formData.get("hero_body")) || toNullableText(formData.get("intro")),
      hero_primary_label: toNullableText(formData.get("hero_primary_label")),
      hero_primary_href: toNullableText(formData.get("hero_primary_href")),
      hero_secondary_label: toNullableText(formData.get("hero_secondary_label")),
      hero_secondary_href: toNullableText(formData.get("hero_secondary_href")),
      seo_title: toNullableText(formData.get("seo_title")),
      seo_description: toNullableText(formData.get("seo_description")),
      stats: safeJsonParseArray(formData.get("stats")),
      sections: safeJsonParseArray(formData.get("sections")),
      body: safeJsonParseArray(formData.get("body")),
      is_published: toText(formData.get("is_published")) !== "false",
      sort_order: Number(formData.get("sort_order") || 100),
      updated_at: new Date().toISOString(),
    };

    const { error } = await admin.from("company_pages").upsert(payload as never, {
      onConflict: "slug",
    });
    if (error) throw error;

    revalidatePath("/");
    await revalidateOwnerSurfaces();
    return { ok: true, message: `Page “${slug}” saved.` };
  } catch (error) {
    rethrowIfRedirect(error);
    console.error("[owner] saveCompanyPageAction", error);
    return { ok: false, message: toOwnerFacingError(error) };
  }
}
