"use server";

import { randomBytes, createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { findCountryByCode, getAccountUrl } from "@henryco/config";
import { getBusinessCopy } from "@henryco/i18n/server";
import type { AppLocale } from "@henryco/i18n";
import { requireAccountUser } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getAccountAppLocale } from "@/lib/locale-server";
import { getBusinessMembershipBySlug, type BusinessPartnerType, type BusinessRole } from "@/lib/business";
import { sendBusinessInvitationEmail } from "@/lib/business-email";
import { auditBusinessAction } from "@/lib/business-audit";
import { emitIntelligenceEvent, BusinessIntelEvents } from "@/lib/intelligence-rollout";

const INVITE_TTL_DAYS = 7;
const PARTNER_TYPES: BusinessPartnerType[] = [
  "marketplace_seller",
  "service_provider",
  "employer",
  "studio_client",
  "logistics_shipper",
];

export type ActionResult = { ok: boolean; error?: string; message?: string };

async function copyFor() {
  const locale = (await getAccountAppLocale()) as AppLocale;
  return getBusinessCopy(locale);
}

function field(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/** S4 — create a business; the creator is seeded as owner by the RPC. */
export async function createBusinessAction(form: FormData): Promise<ActionResult> {
  const user = await requireAccountUser();
  const copy = await copyFor();

  const slug = field(form, "slug").toLowerCase();
  const legalName = field(form, "legalName");
  const tradingName = field(form, "tradingName");
  const registration = field(form, "registration");
  const country = field(form, "country").toUpperCase();
  const partnerType = field(form, "partnerType") as BusinessPartnerType;

  if (!slug || !/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/.test(slug)) {
    return { ok: false, error: copy.errors.generic };
  }
  if (legalName.length < 2) return { ok: false, error: copy.errors.generic };
  if (!findCountryByCode(country)) return { ok: false, error: copy.errors.invalidCountry };
  if (!PARTNER_TYPES.includes(partnerType)) return { ok: false, error: copy.errors.generic };

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .rpc("create_business", {
      p_slug: slug,
      p_legal_name: legalName,
      p_country: country,
      p_primary_partner_type: partnerType,
      p_trading_name: tradingName || null,
      p_business_registration: registration || null,
    })
    .maybeSingle();

  if (error || !data) {
    const message = (error?.message ?? "").toLowerCase();
    if (message.includes("duplicate") || message.includes("unique")) {
      return { ok: false, error: copy.errors.slugTaken };
    }
    return { ok: false, error: copy.errors.generic };
  }

  const business = data as { id: string; slug: string };
  await auditBusinessAction({
    action: "business.profile.created",
    businessId: business.id,
    actorUserId: user.id,
    details: { slug: business.slug, partnerType },
  });
  try {
    await emitIntelligenceEvent({
      name: BusinessIntelEvents.profileCreated,
      division: "account",
      eventId: `business_profile:${business.id}`,
      actor: { kind: "user", subjectRef: user.id, roleHint: "owner" },
      properties: {
        title: "Business created",
        summary: "A new business profile was created.",
        businessId: business.id,
        slug: business.slug,
      },
    });
  } catch {
    // telemetry best-effort
  }

  redirect(`/business/${business.slug}`);
}

/** S4 — invite a member by email (owner: admin|member; admin: member only). */
export async function inviteMemberAction(form: FormData): Promise<ActionResult> {
  const user = await requireAccountUser();
  const copy = await copyFor();

  const slug = field(form, "slug");
  const email = field(form, "email").toLowerCase();
  const role = field(form, "role") as Exclude<BusinessRole, "owner">;

  if (!email || !email.includes("@")) return { ok: false, error: copy.errors.generic };
  if (role !== "admin" && role !== "member") return { ok: false, error: copy.errors.generic };

  const membership = await getBusinessMembershipBySlug(slug);
  if (!membership) return { ok: false, error: copy.errors.notMember };
  if (membership.role === "member") return { ok: false, error: copy.errors.forbidden };
  if (membership.role === "admin" && role !== "member") {
    return { ok: false, error: copy.errors.forbidden };
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("business_invitations").upsert(
    {
      business_id: membership.business.id,
      email,
      role,
      token_hash: tokenHash,
      invited_by: user.id,
      expires_at: expiresAt,
      accepted_at: null,
    },
    { onConflict: "business_id,email" },
  );
  if (error) return { ok: false, error: copy.errors.generic };

  const acceptUrl = getAccountUrl(`/business/accept?token=${token}`);
  await sendBusinessInvitationEmail({
    to: email,
    businessName: membership.business.tradingName || membership.business.legalName,
    role,
    acceptUrl,
    expiresAt,
  });

  await auditBusinessAction({
    action: "business.member.invited",
    businessId: membership.business.id,
    actorUserId: user.id,
    details: { invitedEmail: email, role },
  });

  revalidatePath(`/business/${slug}/team`);
  return { ok: true, message: copy.team.invite.sent.replace("{email}", email) };
}

/** S4 — accept an invitation by token; adds the caller to the roster. */
export async function acceptInvitationAction(token: string): Promise<ActionResult> {
  const user = await requireAccountUser();
  const copy = await copyFor();
  if (!token) return { ok: false, error: copy.errors.invalidInvitation };

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .rpc("accept_business_invitation", { p_token_hash: tokenHash })
    .maybeSingle();
  if (error || !data) return { ok: false, error: copy.errors.invalidInvitation };

  const member = data as { business_id: string; role: BusinessRole };
  const { data: biz } = await supabase
    .from("businesses")
    .select("slug")
    .eq("id", member.business_id)
    .maybeSingle();
  const slug = (biz as { slug?: string } | null)?.slug;

  await auditBusinessAction({
    action: "business.member.added",
    businessId: member.business_id,
    actorUserId: user.id,
    targetUserId: user.id,
    details: { role: member.role, via: "invitation" },
  });
  try {
    await emitIntelligenceEvent({
      name: BusinessIntelEvents.memberAdded,
      division: "account",
      eventId: `business_member:${member.business_id}:${user.id}`,
      actor: { kind: "user", subjectRef: user.id, roleHint: member.role },
      properties: {
        title: "Joined a business",
        summary: "A member accepted a business invitation.",
        businessId: member.business_id,
        role: member.role,
      },
    });
  } catch {
    // telemetry best-effort
  }

  if (slug) redirect(`/business/${slug}`);
  redirect("/business");
}

/** S4 — remove a member (owner only; cannot remove an owner here). */
export async function removeMemberAction(form: FormData): Promise<ActionResult> {
  const user = await requireAccountUser();
  const copy = await copyFor();
  const slug = field(form, "slug");
  const targetUserId = field(form, "userId");

  const membership = await getBusinessMembershipBySlug(slug);
  if (!membership) return { ok: false, error: copy.errors.notMember };
  if (membership.role !== "owner") return { ok: false, error: copy.errors.forbidden };

  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("business_members")
    .delete()
    .eq("business_id", membership.business.id)
    .eq("user_id", targetUserId)
    .neq("role", "owner");
  if (error) return { ok: false, error: copy.errors.generic };

  await auditBusinessAction({
    action: "business.member.removed",
    businessId: membership.business.id,
    actorUserId: user.id,
    targetUserId,
  });
  revalidatePath(`/business/${slug}/team`);
  return { ok: true, message: copy.team.removed };
}

/** S4 — change a member's role between admin and member (owner only). */
export async function changeRoleAction(form: FormData): Promise<ActionResult> {
  const user = await requireAccountUser();
  const copy = await copyFor();
  const slug = field(form, "slug");
  const targetUserId = field(form, "userId");
  const nextRole = field(form, "role") as BusinessRole;

  if (nextRole !== "admin" && nextRole !== "member") {
    return { ok: false, error: copy.errors.generic };
  }
  const membership = await getBusinessMembershipBySlug(slug);
  if (!membership) return { ok: false, error: copy.errors.notMember };
  if (membership.role !== "owner") return { ok: false, error: copy.errors.forbidden };

  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("business_members")
    .update({ role: nextRole })
    .eq("business_id", membership.business.id)
    .eq("user_id", targetUserId)
    .neq("role", "owner");
  if (error) return { ok: false, error: copy.errors.generic };

  await auditBusinessAction({
    action: "business.member.role_changed",
    businessId: membership.business.id,
    actorUserId: user.id,
    targetUserId,
    details: { role: nextRole },
  });
  revalidatePath(`/business/${slug}/team`);
  return { ok: true, message: copy.team.roleChanged };
}

/** S3 — update business metadata (owner/admin). */
export async function updateBusinessAction(form: FormData): Promise<ActionResult> {
  const user = await requireAccountUser();
  const copy = await copyFor();
  const slug = field(form, "slug");

  const membership = await getBusinessMembershipBySlug(slug);
  if (!membership) return { ok: false, error: copy.errors.notMember };
  if (membership.role === "member") return { ok: false, error: copy.errors.forbidden };

  const tradingName = field(form, "tradingName");
  const registration = field(form, "registration");
  const country = field(form, "country").toUpperCase();
  if (country && !findCountryByCode(country)) {
    return { ok: false, error: copy.errors.invalidCountry };
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("businesses")
    .update({
      trading_name: tradingName || null,
      business_registration: registration || null,
      ...(country ? { country } : {}),
    })
    .eq("id", membership.business.id);
  if (error) return { ok: false, error: copy.errors.generic };

  await auditBusinessAction({
    action: "business.profile.updated",
    businessId: membership.business.id,
    actorUserId: user.id,
  });
  revalidatePath(`/business/${slug}`);
  return { ok: true, message: copy.profile.saved };
}
