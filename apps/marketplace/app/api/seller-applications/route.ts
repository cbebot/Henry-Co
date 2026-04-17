import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { shouldAutoFlag } from "@henryco/trust";
import { normalizeEmail } from "@/lib/env";
import { getMarketplaceViewer } from "@/lib/marketplace/auth";
import { sendMarketplaceEvent } from "@/lib/marketplace/notifications";
import { createAdminSupabase } from "@/lib/supabase";
import type { MarketplaceSellerDocumentRecord } from "@/lib/marketplace/types";

export const runtime = "nodejs";

type SellerApplicationPayload = {
  mode?: "draft" | "submit";
  progressStep?: string;
  storeName?: string;
  storeSlug?: string;
  legalName?: string;
  phone?: string;
  categoryFocus?: string;
  story?: string;
  documents?: Record<string, MarketplaceSellerDocumentRecord | string>;
  agreementAccepted?: boolean;
};

function normalizeDocuments(
  documents: SellerApplicationPayload["documents"]
): Record<string, MarketplaceSellerDocumentRecord> {
  if (!documents || typeof documents !== "object") return {};

  return Object.entries(documents).reduce<Record<string, MarketplaceSellerDocumentRecord>>((accumulator, [key, value]) => {
    if (typeof value === "string" && value.trim()) {
      accumulator[key] = {
        kind:
          key === "businessRegistration" || key === "founderIdentity" || key === "payoutProof"
            ? key
            : "other",
        name: value.split("/").pop() || `${key}.pdf`,
        fileUrl: value.trim(),
        mimeType: null,
        size: null,
        publicId: null,
        uploadedAt: new Date().toISOString(),
        status: "uploaded",
      };
      return accumulator;
    }

    if (!value || typeof value !== "object" || Array.isArray(value)) return accumulator;
    const document = value as Partial<MarketplaceSellerDocumentRecord>;
    if (!document.fileUrl || !document.name) return accumulator;
    accumulator[key] = {
      kind:
        document.kind === "businessRegistration" ||
        document.kind === "founderIdentity" ||
        document.kind === "payoutProof" ||
        document.kind === "other"
          ? document.kind
          : key === "businessRegistration" || key === "founderIdentity" || key === "payoutProof"
            ? key
            : "other",
      name: document.name,
      fileUrl: document.fileUrl,
      mimeType: document.mimeType || null,
      size: typeof document.size === "number" ? document.size : null,
      publicId: document.publicId || null,
      uploadedAt: document.uploadedAt || new Date().toISOString(),
      status:
        document.status === "uploaded" ||
        document.status === "under_review" ||
        document.status === "approved" ||
        document.status === "rejected"
          ? document.status
          : "uploaded",
    };
    return accumulator;
  }, {});
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  const viewer = await getMarketplaceViewer();
  if (!viewer.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("marketplace_vendor_applications")
    .select("*")
    .eq("user_id", viewer.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    application: data,
  });
}

export async function POST(request: Request) {
  const viewer = await getMarketplaceViewer();
  if (!viewer.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as SellerApplicationPayload;
  const mode = payload.mode === "submit" ? "submit" : "draft";
  const storeName = String(payload.storeName || "").trim();
  const storeSlug = String(payload.storeSlug || (storeName ? slugify(storeName) : "")).trim();
  const legalName = String(payload.legalName || "").trim();
  const phone = String(payload.phone || "").trim();
  const categoryFocus = String(payload.categoryFocus || "").trim();
  const story = String(payload.story || "").trim();
  const progressStep = String(payload.progressStep || "start").trim();
  const documents = normalizeDocuments(payload.documents);
  const agreementAccepted = Boolean(payload.agreementAccepted);
  const missingCriticalDocuments = ["founderIdentity", "payoutProof"].filter((key) => !documents[key]?.fileUrl);

  if (mode === "submit" && (!storeName || !storeSlug || !legalName)) {
    return NextResponse.json({ error: "Store identity is incomplete." }, { status: 400 });
  }

  if (mode === "submit" && missingCriticalDocuments.length > 0) {
    return NextResponse.json(
      {
        error:
          missingCriticalDocuments.length === 1
            ? `Upload the ${missingCriticalDocuments[0] === "founderIdentity" ? "founder identity" : "payout proof"} document before submitting.`
            : "Founder identity and payout proof must be uploaded before submission.",
      },
      { status: 400 }
    );
  }

  if (mode === "submit" && !agreementAccepted) {
    return NextResponse.json({ error: "Agreement acceptance is required before submission." }, { status: 400 });
  }

  // Content safety: block submissions whose store story contains high/critical
  // off-platform contact attempts or payout diversion language.
  if (mode === "submit" && story) {
    const storyFlag = shouldAutoFlag(story);
    if (storyFlag.flag && (storyFlag.severity === "high" || storyFlag.severity === "critical")) {
      return NextResponse.json(
        {
          error:
            "The store story contains content that cannot be accepted. " +
            "Remove any contact details, off-platform payment instructions, or bypass language before resubmitting.",
        },
        { status: 422 }
      );
    }
  }

  const admin = createAdminSupabase();
  const { data: existing } = await admin
    .from("marketplace_vendor_applications")
    .select("id, status, submitted_at, agreement_accepted_at")
    .eq("user_id", viewer.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const existingStatus = String(existing?.status || "");
  const preservedStatus =
    mode === "submit"
      ? "submitted"
      : ["submitted", "under_review", "approved", "changes_requested", "rejected"].includes(existingStatus)
      ? existingStatus
      : "draft";

  const applicationPayload = {
    user_id: viewer.user.id,
    normalized_email: normalizeEmail(viewer.user.email),
    store_name: storeName || "Untitled store",
    proposed_store_slug: storeSlug || slugify(storeName || "untitled-store"),
    legal_name: legalName || "Pending legal entity",
    contact_phone: phone || null,
    category_focus: categoryFocus || null,
    story: story || null,
    status: preservedStatus,
    submitted_at:
      mode === "submit"
        ? existing?.submitted_at || new Date().toISOString()
        : existing?.submitted_at || null,
    progress_step: progressStep,
    documents_json: documents,
    draft_payload: {
      storeName,
      storeSlug,
      legalName,
      phone,
      categoryFocus,
      story,
      documents,
    },
    agreement_accepted_at:
      agreementAccepted ? existing?.agreement_accepted_at || new Date().toISOString() : existing?.agreement_accepted_at || null,
  };

  const mutation = existing?.id
    ? admin
        .from("marketplace_vendor_applications")
        .update(applicationPayload as never)
        .eq("id", existing.id)
        .select("*")
        .maybeSingle()
    : admin
        .from("marketplace_vendor_applications")
        .insert(applicationPayload as never)
        .select("*")
        .maybeSingle();

  const { data: application, error } = await mutation;
  if (error || !application) {
    return NextResponse.json({ error: error?.message || "Application save failed." }, { status: 500 });
  }

  if (mode === "submit") {
    await admin.from("marketplace_role_memberships").upsert({
      user_id: viewer.user.id,
      normalized_email: normalizeEmail(viewer.user.email),
      scope_type: "platform",
      scope_id: null,
      role: "vendor_applicant",
      is_active: true,
    } as never);

    await sendMarketplaceEvent({
      event: "vendor_application_submitted",
      userId: viewer.user.id,
      normalizedEmail: normalizeEmail(viewer.user.email),
      recipientEmail: viewer.user.email,
      recipientPhone: phone || null,
      actorUserId: viewer.user.id,
      actorEmail: viewer.user.email,
      entityType: "vendor_application",
      entityId: String(application.id),
      payload: {
        storeName: String(application.store_name || storeName),
      },
    });

    await sendMarketplaceEvent({
      event: "owner_alert",
      recipientEmail:
        process.env.MARKETPLACE_OWNER_ALERT_EMAIL ||
        process.env.RESEND_SUPPORT_INBOX ||
        "marketplace@henrycogroup.com",
      actorUserId: viewer.user.id,
      actorEmail: viewer.user.email,
      entityType: "vendor_application",
      entityId: String(application.id),
      payload: {
        note: `New seller application submitted for ${String(application.store_name || storeName)}.`,
      },
    });
  }

  revalidatePath("/account/seller-application");
  revalidatePath("/vendor");

  return NextResponse.json({
    ok: true,
    mode,
    application,
  });
}
