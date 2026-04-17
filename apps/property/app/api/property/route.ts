import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getDivisionConfig } from "@henryco/config";
import { normalizeEmail } from "@/lib/env";
import { getPropertyViewer, viewerHasRole } from "@/lib/property/auth";
import { getPropertySnapshot } from "@/lib/property/data";
import { sendPropertyEvent } from "@/lib/property/notifications";
import {
  appendCustomerActivity,
  appendCustomerDocument,
  createSupportThread,
  ensureCustomerProfile,
} from "@/lib/property/shared-account";
import { getSharedAccountLoginUrl, getSharedAccountPropertyPath } from "@/lib/property/links";
import { computePropertySubmissionFeeBreakdown } from "@henryco/pricing";
import {
  createListingFromSubmission,
  removeSavedPropertyForUser,
  savePropertyForUser,
  upsertPropertyApplication,
  upsertPropertyInquiry,
  upsertPropertyListing,
  upsertPropertyInspection,
  appendPropertyPolicyEvent,
  upsertPropertyManagedRecord,
  upsertPropertyViewingRequest,
  uploadPropertyDocument,
  uploadPropertyMedia,
} from "@/lib/property/store";
import {
  PROPERTY_POLICY_VERSION,
  evaluatePropertySubmissionPolicy,
} from "@/lib/property/policy";
import {
  countPropertyUploadFiles,
  getPropertyIntentOptions,
  getPropertyKindForService,
  getPropertySubmissionBlueprint,
  readPropertySubmissionContext,
  validatePropertySubmissionBlueprint,
  validatePropertyUploadFile,
  type PropertyDocumentKind,
  type PropertySubmissionBlueprint,
  type PropertySubmissionContext,
} from "@/lib/property/submission";
import {
  isPropertyListingPublicStatus,
  resolveListingStatusFromInspectionStatus,
} from "@/lib/property/governance";
import {
  getPropertyTrustSignals,
  getPropertyWalletSummary,
} from "@/lib/property/trust";
import type {
  PropertyListing,
  PropertyListingApplication,
  PropertyListingInspection,
  PropertyListingInspectionStatus,
  PropertyListingIntent,
  PropertyListingStatus,
  PropertyRole,
  PropertyListingServiceType,
} from "@/lib/property/types";

export const runtime = "nodejs";

const property = getDivisionConfig("property");
const operatorInbox = process.env.RESEND_SUPPORT_INBOX || property.supportEmail;

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function bool(formData: FormData, key: string) {
  return ["1", "true", "on", "yes"].includes(text(formData, key).toLowerCase());
}

function numberValue(formData: FormData, key: string) {
  const value = Number(text(formData, key));
  return Number.isFinite(value) ? value : null;
}

function listValue(formData: FormData, key: string) {
  return text(formData, key)
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function localToIso(value: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function redirectTo(request: Request, target: string) {
  return NextResponse.redirect(new URL(target, request.url), { status: 303 });
}

function wantsJson(request: Request) {
  return (
    request.headers.get("x-henryco-async") === "1" ||
    request.headers.get("accept")?.includes("application/json")
  );
}

function respondError(
  request: Request,
  returnTo: string,
  input: { message: string; code: string; status?: number; extra?: Record<string, unknown> }
) {
  if (wantsJson(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: input.message,
        code: input.code,
        ...(input.extra || {}),
      },
      { status: input.status ?? 400 }
    );
  }

  return redirectTo(request, withQuery(returnTo, "error", input.code));
}

function respondSuccess(
  request: Request,
  redirectTarget: string,
  payload: Record<string, unknown>
) {
  if (wantsJson(request)) {
    return NextResponse.json({
      ok: true,
      ...payload,
    });
  }

  return redirectTo(request, redirectTarget);
}

/** Cross-origin redirect to shared HenryCo account sign-in with return path on this property origin */
function redirectToAccountSignIn(request: Request, returnPath: string) {
  const origin = new URL(request.url).origin;
  const loginUrl = getSharedAccountLoginUrl({
    nextPath: returnPath.startsWith("/") ? returnPath : `/${returnPath}`,
    propertyOrigin: origin,
  });
  return NextResponse.redirect(loginUrl, { status: 303 });
}

function withQuery(target: string, key: string, value: string) {
  const separator = target.includes("?") ? "&" : "?";
  return `${target}${separator}${key}=${encodeURIComponent(value)}`;
}

function revalidatePropertyRoutes(slug?: string | null) {
  const paths = [
    "/",
    "/search",
      "/managed",
      "/trust",
      "/faq",
      "/submit",
      "/account",
      "/owner",
      "/agent",
      "/operations",
    "/moderation",
    "/support",
    "/admin",
  ];

  if (slug) {
    paths.push(`/property/${slug}`);
  }

  for (const path of paths) {
    revalidatePath(path);
  }
}

function dedupe(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function fileValues(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is File => value instanceof File && value.size > 0);
}

const DOCUMENT_UPLOAD_FIELDS = [
  {
    field: "ownership_docs",
    kind: "ownership_proof",
    customerDocumentType: "property_ownership_proof",
  },
  {
    field: "authority_docs",
    kind: "authority_proof",
    customerDocumentType: "property_authority_proof",
  },
  {
    field: "management_docs",
    kind: "management_authorization",
    customerDocumentType: "property_management_authorization",
  },
  {
    field: "identity_docs",
    kind: "identity_evidence",
    customerDocumentType: "property_identity_evidence",
  },
  {
    field: "supporting_docs",
    kind: "supporting_document",
    customerDocumentType: "property_supporting_document",
  },
  {
    field: "inspection_docs",
    kind: "inspection_evidence",
    customerDocumentType: "property_inspection_evidence",
  },
] as const;

type PropertyDocumentUploadFieldName = (typeof DOCUMENT_UPLOAD_FIELDS)[number]["field"];

type PropertyDocumentRecord = PropertyListingApplication["verificationDocs"][number];

function emptyDocumentKindCounts() {
  return {
    ownership_proof: 0,
    authority_proof: 0,
    management_authorization: 0,
    identity_evidence: 0,
    supporting_document: 0,
    inspection_evidence: 0,
  } satisfies Record<PropertyDocumentKind, number>;
}

function isPropertyDocumentKind(value: string): value is PropertyDocumentKind {
  return Object.hasOwn(emptyDocumentKindCounts(), value);
}

function countDocumentKinds(documents: PropertyDocumentRecord[]) {
  const counts = emptyDocumentKindCounts();

  for (const document of documents) {
    const kind = String(document.kind || "").trim().toLowerCase();
    if (isPropertyDocumentKind(kind)) {
      counts[kind] += 1;
    } else {
      counts.supporting_document += 1;
    }
  }

  return counts;
}

function totalDocumentCount(counts: Record<PropertyDocumentKind, number>) {
  return Object.values(counts).reduce((sum, value) => sum + value, 0);
}

function mergeVerificationDocs(
  existing: PropertyDocumentRecord[],
  incoming: PropertyDocumentRecord[]
) {
  return Array.from(
    new Map(
      [...existing, ...incoming].map((document) => [
        `${document.url}::${document.kind}::${document.name}`,
        document,
      ])
    ).values()
  );
}

function mergeSubmissionContext(
  existing: Record<string, string> | null | undefined,
  incoming: PropertySubmissionContext
) {
  return {
    ...(existing || {}),
    ...Object.fromEntries(
      Object.entries(incoming).filter(([, value]) => Boolean(String(value || "").trim()))
    ),
  } satisfies Record<string, string>;
}

function formatSubmissionContextForSupport(
  blueprint: PropertySubmissionBlueprint,
  context: Record<string, string>
) {
  return blueprint.contextFields
    .map((field) => {
      const value = String(context[field.name] || "").trim();
      if (!value) return null;
      return `${field.label}: ${value}`;
    })
    .filter(Boolean)
    .join("\n");
}

function resolveInspectionDrivenStatus(
  currentStatus: PropertyListingStatus,
  policyStatus: PropertyListingStatus,
  inspectionStatus: PropertyListingInspectionStatus
) {
  if (policyStatus === "awaiting_documents" || policyStatus === "awaiting_eligibility") {
    if (inspectionStatus === "failed") return "blocked" satisfies PropertyListingStatus;
    if (inspectionStatus === "cancelled") return "changes_requested" satisfies PropertyListingStatus;
    return policyStatus;
  }

  return resolveListingStatusFromInspectionStatus(currentStatus || policyStatus, inspectionStatus);
}

function getInspectionStatusSummary(status: PropertyListingInspectionStatus) {
  switch (status) {
    case "requested":
      return "Inspection requested";
    case "scheduled":
      return "Inspection scheduled";
    case "completed":
      return "Inspection completed";
    case "waived":
      return "Inspection waived";
    case "failed":
      return "Inspection failed";
    case "cancelled":
      return "Inspection cancelled";
    default:
      return status;
  }
}

function getDocumentUploadsFromFormData(formData: FormData) {
  const uploads = DOCUMENT_UPLOAD_FIELDS.map((field) => ({
    ...field,
    files: fileValues(formData, field.field),
  })).filter((entry) => entry.files.length > 0);

  const legacyVerificationDocs = fileValues(formData, "verification_docs");
  if (legacyVerificationDocs.length > 0) {
    uploads.push({
      field: "supporting_docs",
      kind: "supporting_document",
      customerDocumentType: "property_supporting_document",
      files: legacyVerificationDocs,
    });
  }

  return uploads;
}

function validateUploadFiles(files: File[], mode: "media" | "document") {
  const errors: string[] = [];

  for (const file of files) {
    const validationError = validatePropertyUploadFile(file, mode);
    if (validationError) {
      errors.push(validationError);
    }
  }

  return errors;
}

function toApplicationStatus(status: PropertyListingStatus): PropertyListingApplication["status"] {
  if (status === "approved" || status === "published") return "approved";
  if (status === "rejected") return "rejected";
  if (status === "submitted") return "submitted";
  return "under_review";
}

function isListingOwner(
  viewer: Awaited<ReturnType<typeof getPropertyViewer>>,
  listing: PropertyListing
) {
  if (!viewer.user) return false;
  if (listing.ownerUserId && viewer.user.id === listing.ownerUserId) return true;
  return Boolean(viewer.normalizedEmail && viewer.normalizedEmail === listing.normalizedEmail);
}

function requireRoles(
  viewer: Awaited<ReturnType<typeof getPropertyViewer>>,
  allowed: PropertyRole[]
) {
  return viewerHasRole(viewer, allowed);
}

async function uploadFilesAsMedia(listingId: string, files: File[]) {
  const uploads: string[] = [];

  for (const file of files) {
    uploads.push(await uploadPropertyMedia(listingId, file));
  }

  return uploads;
}

async function uploadFilesAsDocuments(
  listingId: string,
  owner: { userId?: string | null; email?: string | null },
  uploads: Array<{
    field: PropertyDocumentUploadFieldName;
    kind: PropertyDocumentKind;
    customerDocumentType: string;
    files: File[];
  }>
) {
  const documents: PropertyDocumentRecord[] = [];

  for (const upload of uploads) {
    for (const file of upload.files) {
      const url = await uploadPropertyDocument(`${listingId}/${upload.kind}`, file);
      documents.push({
        name: file.name,
        url,
        kind: upload.kind,
      });

      await appendCustomerDocument({
        userId: owner.userId,
        email: owner.email,
        name: file.name,
        type: upload.customerDocumentType,
        fileUrl: url,
        fileSize: file.size,
        mimeType: file.type || null,
        referenceType: "property_listing",
        referenceId: listingId,
        metadata: {
          propertyDocumentKind: upload.kind,
          propertyUploadField: upload.field,
        },
      });
    }
  }

  return documents;
}

async function syncListingApplication(input: {
  snapshot: Awaited<ReturnType<typeof getPropertySnapshot>>;
  listingId: string;
  userId?: string | null;
  normalizedEmail?: string | null;
  applicantName: string;
  companyName?: string | null;
  phone?: string | null;
  email: string;
  verificationDocs: PropertyDocumentRecord[];
  submissionContext?: Record<string, string> | null;
  status?: PropertyListingApplication["status"];
  reviewNote?: string | null;
}) {
  const existing = input.snapshot.applications.find((item) => item.listingId === input.listingId);
  const now = new Date().toISOString();

  await upsertPropertyApplication({
    id: existing?.id || randomUUID(),
    listingId: input.listingId,
    userId: input.userId ?? existing?.userId ?? null,
    normalizedEmail: input.normalizedEmail ?? existing?.normalizedEmail ?? null,
    applicantName: input.applicantName,
    companyName: input.companyName ?? existing?.companyName ?? null,
    phone: input.phone ?? existing?.phone ?? null,
    email: input.email,
    verificationDocs:
      input.verificationDocs.length || existing?.verificationDocs?.length
        ? mergeVerificationDocs(existing?.verificationDocs || [], input.verificationDocs)
        : [],
    submissionContext:
      input.submissionContext && Object.keys(input.submissionContext).length
        ? mergeSubmissionContext(existing?.submissionContext, input.submissionContext)
        : existing?.submissionContext || null,
    status: input.status || existing?.status || "submitted",
    reviewNote: input.reviewNote ?? existing?.reviewNote ?? null,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  });
}

async function ensureListingInspectionRecord(input: {
  snapshot: Awaited<ReturnType<typeof getPropertySnapshot>>;
  listingId: string;
  requestedByUserId: string | null;
  policyStatus: PropertyListingStatus;
  policySummary: string;
  inspectionNotes?: string | null;
}) {
  const existing = input.snapshot.inspections.find((inspection) => inspection.listingId === input.listingId);
  const nextStatus: PropertyListingInspectionStatus =
    existing?.status === "scheduled"
      ? "scheduled"
      : existing?.status === "completed" ||
          existing?.status === "waived" ||
          existing?.status === "failed" ||
          existing?.status === "cancelled"
        ? existing.status
        : "requested";

  const payload: PropertyListingInspection = {
    id: existing?.id || randomUUID(),
    listingId: input.listingId,
    requestedByUserId: existing?.requestedByUserId ?? input.requestedByUserId,
    status: nextStatus,
    reason: input.policySummary,
    scheduledFor: existing?.scheduledFor ?? null,
    assignedAgentId: existing?.assignedAgentId ?? null,
    locationNotes: input.inspectionNotes || existing?.locationNotes || null,
    outcomeNotes: existing?.outcomeNotes ?? null,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await upsertPropertyInspection(payload);

  await appendPropertyPolicyEvent({
    listingId: input.listingId,
    actorUserId: existing ? input.requestedByUserId : null,
    actorRole: existing ? "owner" : "system",
    eventType: existing ? "inspection_updated" : "inspection_created",
    fromStatus: null,
    toStatus: input.policyStatus,
    reason: existing
      ? "Inspection requirement remained active after policy re-evaluation."
      : "Inspection record created from listing policy review.",
    metadata: {
      inspectionId: payload.id,
      inspectionStatus: payload.status,
    },
  });

  return payload;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const intent = text(formData, "intent");
  const viewer = await getPropertyViewer();
  const snapshot = await getPropertySnapshot();
  const returnTo = text(formData, "return_to") || request.headers.get("referer") || "/";

  try {
    switch (intent) {
      case "wishlist_toggle": {
        if (!viewer.user) {
          return redirectToAccountSignIn(request, returnTo);
        }

        const listingId = text(formData, "listing_id");
        const listing = snapshot.listings.find((item) => item.id === listingId);
        if (!listing) return redirectTo(request, withQuery(returnTo, "error", "missing-listing"));

        const exists = snapshot.savedListings.some(
          (item) => item.userId === viewer.user?.id && item.listingId === listingId
        );

        if (exists) {
          await removeSavedPropertyForUser(viewer.user.id, listingId);
        } else {
          await savePropertyForUser(viewer.user.id, listingId);
        }

        await appendCustomerActivity({
          userId: viewer.user.id,
          email: viewer.user.email,
          activityType: exists ? "property_unsaved" : "property_saved",
          title: exists ? "Removed saved property" : "Saved property",
          description: listing.title,
          referenceType: "property_listing",
          referenceId: listing.id,
          actionUrl: getSharedAccountPropertyPath("saved"),
        });

        revalidatePropertyRoutes(listing.slug);
        return redirectTo(request, withQuery(returnTo, exists ? "removed" : "saved", "1"));
      }

      case "inquiry_submit": {
        if (!viewer.user) {
          return redirectToAccountSignIn(request, returnTo);
        }

        const listingId = text(formData, "listing_id");
        const listing = snapshot.listings.find((item) => item.id === listingId);
        if (!listing) return redirectTo(request, withQuery(returnTo, "error", "missing-listing"));

        const name = text(formData, "name") || viewer.user?.fullName || "Property prospect";
        const email = normalizeEmail(text(formData, "email") || viewer.user?.email);
        if (!email) return redirectTo(request, withQuery(returnTo, "error", "missing-email"));

        const phone = text(formData, "phone");
        const message = text(formData, "message");
        const inquiryId = randomUUID();
        const now = new Date().toISOString();

        await upsertPropertyInquiry({
          id: inquiryId,
          listingId,
          userId: viewer.user?.id ?? null,
          normalizedEmail: email,
          name,
          email,
          phone: phone || null,
          message,
          status: "new",
          assignedAgentId: listing.agentId,
          source: "property_detail",
          createdAt: now,
          updatedAt: now,
        });

        await ensureCustomerProfile({
          userId: viewer.user?.id ?? null,
          email,
          fullName: name,
          phone,
        });

        await appendCustomerActivity({
          userId: viewer.user?.id ?? null,
          email,
          activityType: "property_inquiry",
          title: `Inquiry submitted for ${listing.title}`,
          description: message,
          status: "new",
          referenceType: "property_inquiry",
          referenceId: inquiryId,
          actionUrl: getSharedAccountPropertyPath("inquiries"),
          metadata: { listingId },
        });

        await createSupportThread({
          userId: viewer.user?.id ?? null,
          email,
          subject: `Inquiry: ${listing.title}`,
          category: "property_inquiry",
          priority: "normal",
          referenceType: "property_inquiry",
          referenceId: inquiryId,
          initialMessage: message,
        });

        await sendPropertyEvent({
          event: "inquiry_received",
          userId: viewer.user?.id ?? null,
          normalizedEmail: email,
          recipientEmail: email,
          recipientPhone: phone || null,
          entityType: "property_inquiry",
          entityId: inquiryId,
          payload: {
            listingTitle: listing.title,
            locationLabel: listing.locationLabel,
            ctaHref: `/property/${listing.slug}`,
          },
        });

        await sendPropertyEvent({
          event: "new_lead_alert",
          recipientEmail: operatorInbox,
          entityType: "property_inquiry",
          entityId: inquiryId,
          payload: {
            listingTitle: listing.title,
            note: `New inquiry from ${name} is waiting for follow-up.`,
          },
        });

        if (listing.ownerEmail && normalizeEmail(listing.ownerEmail) !== email) {
          await sendPropertyEvent({
            event: "owner_alert",
            recipientEmail: listing.ownerEmail,
            recipientPhone: listing.ownerPhone,
            entityType: "property_inquiry",
            entityId: inquiryId,
            payload: {
              listingTitle: listing.title,
              note: `New inquiry from ${name} has been captured for your listing.`,
            },
          });
        }

        revalidatePropertyRoutes(listing.slug);
        return redirectTo(request, withQuery(returnTo, "inquiry", "sent"));
      }

      case "viewing_request": {
        if (!viewer.user) {
          return redirectToAccountSignIn(request, returnTo);
        }

        const listingId = text(formData, "listing_id");
        const listing = snapshot.listings.find((item) => item.id === listingId);
        if (!listing) return redirectTo(request, withQuery(returnTo, "error", "missing-listing"));

        const attendeeName =
          text(formData, "attendee_name") || viewer.user?.fullName || "Property visitor";
        const attendeeEmail = normalizeEmail(
          text(formData, "attendee_email") || viewer.user?.email
        );
        if (!attendeeEmail) return redirectTo(request, withQuery(returnTo, "error", "missing-email"));

        const attendeePhone = text(formData, "attendee_phone");
        const preferredDate = localToIso(text(formData, "preferred_date"));
        if (!preferredDate) return redirectTo(request, withQuery(returnTo, "error", "missing-date"));

        const backupDate = localToIso(text(formData, "backup_date"));
        const notes = text(formData, "notes");
        const viewingId = randomUUID();
        const now = new Date().toISOString();

        await upsertPropertyViewingRequest({
          id: viewingId,
          listingId,
          inquiryId: null,
          userId: viewer.user?.id ?? null,
          normalizedEmail: attendeeEmail,
          attendeeName,
          attendeePhone: attendeePhone || null,
          attendeeEmail,
          preferredDate,
          backupDate,
          scheduledFor: null,
          reminderAt: null,
          notes,
          status: "requested",
          assignedAgentId: listing.agentId,
          createdAt: now,
          updatedAt: now,
        });

        await ensureCustomerProfile({
          userId: viewer.user?.id ?? null,
          email: attendeeEmail,
          fullName: attendeeName,
          phone: attendeePhone,
        });

        await appendCustomerActivity({
          userId: viewer.user?.id ?? null,
          email: attendeeEmail,
          activityType: "property_viewing_requested",
          title: `Viewing requested for ${listing.title}`,
          description: notes || `Preferred time: ${preferredDate}`,
          status: "requested",
          referenceType: "property_viewing_request",
          referenceId: viewingId,
          actionUrl: getSharedAccountPropertyPath("viewings"),
          metadata: { listingId, preferredDate, backupDate },
        });

        await createSupportThread({
          userId: viewer.user?.id ?? null,
          email: attendeeEmail,
          subject: `Viewing request: ${listing.title}`,
          category: "property_viewing",
          priority: "high",
          referenceType: "property_viewing_request",
          referenceId: viewingId,
          initialMessage: notes || `Preferred time: ${preferredDate}`,
        });

        await sendPropertyEvent({
          event: "viewing_requested",
          userId: viewer.user?.id ?? null,
          normalizedEmail: attendeeEmail,
          recipientEmail: attendeeEmail,
          recipientPhone: attendeePhone || null,
          entityType: "property_viewing_request",
          entityId: viewingId,
          payload: {
            listingTitle: listing.title,
            viewingTime: preferredDate,
          },
        });

        await sendPropertyEvent({
          event: "new_lead_alert",
          recipientEmail: operatorInbox,
          entityType: "property_viewing_request",
          entityId: viewingId,
          payload: {
            listingTitle: listing.title,
            note: `Viewing request from ${attendeeName} is awaiting scheduling.`,
          },
        });

        revalidatePropertyRoutes(listing.slug);
        return redirectTo(request, withQuery(returnTo, "viewing", "requested"));
      }

      case "listing_submit": {
        if (!viewer.user) {
          if (wantsJson(request)) {
            return NextResponse.json(
              {
                ok: false,
                error: "Authentication required.",
                code: "auth_required",
                loginUrl: getSharedAccountLoginUrl({
                  nextPath: "/submit",
                  propertyOrigin: new URL(request.url).origin,
                }).toString(),
              },
              { status: 401 }
            );
          }
          return redirectToAccountSignIn(request, returnTo || "/submit");
        }

        const ownerName = text(formData, "owner_name") || viewer.user?.fullName || "Property owner";
        const ownerEmail = normalizeEmail(text(formData, "owner_email") || viewer.user?.email);
        if (!ownerEmail) {
          return respondError(request, returnTo, {
            message: "Owner email is required before the listing can enter trust review.",
            code: "missing-email",
          });
        }

        const ownerPhone = text(formData, "owner_phone");
        const baseGallery = listValue(formData, "gallery_urls");
        const serviceType = (
          text(formData, "service_type") || "rent"
        ) as PropertyListingServiceType;
        const requestedIntent = text(formData, "listing_intent") as PropertyListingIntent;
        const allowedIntentOptions = getPropertyIntentOptions(serviceType);
        const intentType = allowedIntentOptions.includes(requestedIntent)
          ? requestedIntent
          : allowedIntentOptions[0];
        const blueprint = getPropertySubmissionBlueprint(serviceType, intentType);
        const submissionContext = readPropertySubmissionContext(formData, blueprint);
        const uploadCounts = countPropertyUploadFiles(formData);
        const mediaFiles = fileValues(formData, "media");
        const documentUploads = getDocumentUploadsFromFormData(formData);
        const title = text(formData, "title");
        const summary = text(formData, "summary");
        const description = text(formData, "description");
        const locationSlug = text(formData, "location_slug");
        const locationLabel = text(formData, "location_label");
        const district = text(formData, "district");
        const addressLine = text(formData, "address_line");
        const price = numberValue(formData, "price");
        const priceInterval = text(formData, "price_interval") || "per year";
        const validationErrors = [
          ...validateUploadFiles(mediaFiles, "media"),
          ...documentUploads.flatMap((upload) => validateUploadFiles(upload.files, "document")),
          ...validatePropertySubmissionBlueprint({
            blueprint,
            context: submissionContext,
            uploadCounts,
          }).errors,
        ];

        if (!ownerPhone) {
          validationErrors.push("Phone is required so HenryCo can coordinate trust review and inspection.");
        }
        if (!title) validationErrors.push("Listing title is required.");
        if (!summary) validationErrors.push("Short summary is required.");
        if (!description) validationErrors.push("Description is required.");
        if (!locationSlug) validationErrors.push("Area is required.");
        if (!locationLabel) validationErrors.push("Location label is required.");
        if (!district) validationErrors.push("District is required.");
        if (!addressLine) validationErrors.push("Address line is required.");
        if (blueprint.showPriceFields && (!price || price <= 0)) {
          validationErrors.push("A valid price is required for this submission path.");
        }
        if (blueprint.showPriceFields && !priceInterval) {
          validationErrors.push("Price interval is required for this submission path.");
        }
        if (serviceType !== "inspection_request" && baseGallery.length + mediaFiles.length === 0) {
          validationErrors.push(
            "Add at least one photo or existing media URL so review does not start from an empty listing shell."
          );
        }
        if (documentUploads.reduce((sum, upload) => sum + upload.files.length, 0) < blueprint.docsMin) {
          validationErrors.push(
            `${blueprint.serviceTitle} needs at least ${blueprint.docsMin} supporting document${
              blueprint.docsMin === 1 ? "" : "s"
            } before it can enter trust review.`
          );
        }

        if (validationErrors.length > 0) {
          return respondError(request, returnTo, {
            message: validationErrors[0] || "Property submission requirements were not met.",
            code: "submission-validation",
            extra: {
              errors: validationErrors,
            },
          });
        }

        const listing = await createListingFromSubmission({
          title,
          summary,
          description,
          kind: getPropertyKindForService(serviceType),
          serviceType,
          intent: intentType,
          locationSlug,
          locationLabel,
          district,
          addressLine,
          price: price || 0,
          priceInterval,
          bedrooms: numberValue(formData, "bedrooms"),
          bathrooms: numberValue(formData, "bathrooms"),
          sizeSqm: numberValue(formData, "size_sqm"),
          parkingSpaces: numberValue(formData, "parking_spaces"),
          furnished: bool(formData, "furnished"),
          petFriendly: bool(formData, "pet_friendly"),
          shortletReady: bool(formData, "shortlet_ready"),
          managedByHenryCo:
            bool(formData, "managed_by_henryco") || serviceType === "managed_property",
          ownerUserId: viewer.user?.id ?? null,
          normalizedEmail: viewer.normalizedEmail ?? ownerEmail,
          ownerName,
          ownerPhone,
          ownerEmail,
          gallery: baseGallery,
          amenities: listValue(formData, "amenities"),
          policyVersion: PROPERTY_POLICY_VERSION,
        });

        const uploadedMedia = await uploadFilesAsMedia(listing.id, mediaFiles);
        const gallery = dedupe([...listing.gallery, ...uploadedMedia]);

        const updatedListingBase: PropertyListing = {
          ...listing,
          gallery,
          heroImage: gallery[0] || listing.heroImage,
        };
        await upsertPropertyListing(updatedListingBase);

        await ensureCustomerProfile({
          userId: viewer.user?.id ?? null,
          email: ownerEmail,
          fullName: ownerName,
          phone: ownerPhone,
        });

        const verificationDocs = await uploadFilesAsDocuments(
          listing.id,
          { userId: viewer.user?.id ?? null, email: ownerEmail },
          documentUploads
        );
        const documentKindCounts = countDocumentKinds(verificationDocs);

        const [wallet, trust] = await Promise.all([
          getPropertyWalletSummary(viewer.user.id),
          getPropertyTrustSignals(viewer.user.id),
        ]);

        const policy = evaluatePropertySubmissionPolicy({
          viewer: { userId: viewer.user.id, email: viewer.user.email },
          wallet: { balanceKobo: wallet.balanceKobo, currency: wallet.currency },
          trust,
          submission: {
            serviceType,
            intent: intentType,
            kind: blueprint.kind,
            price: updatedListingBase.price,
            mediaCount: updatedListingBase.gallery.length,
            verificationDocCount: totalDocumentCount(documentKindCounts),
            locationSlug: updatedListingBase.locationSlug,
            ownershipProofCount: documentKindCounts.ownership_proof,
            authorityProofCount: documentKindCounts.authority_proof,
            managementAuthorizationCount: documentKindCounts.management_authorization,
            identityEvidenceCount: documentKindCounts.identity_evidence,
            inspectionEvidenceCount: documentKindCounts.inspection_evidence,
          },
        });
        let nextStatus = policy.nextStatus;
        let inspectionRecord: PropertyListingInspection | null = null;

        if (policy.required.requiresInspection) {
          inspectionRecord = await ensureListingInspectionRecord({
            snapshot,
            listingId: listing.id,
            requestedByUserId: viewer.user.id,
            policyStatus: policy.nextStatus,
            policySummary: policy.summary,
            inspectionNotes: submissionContext.inspection_notes || null,
          });
          nextStatus = resolveInspectionDrivenStatus(
            "submitted",
            policy.nextStatus,
            inspectionRecord.status
          );
        }

        const feeBreakdown = computePropertySubmissionFeeBreakdown({
          serviceType,
          requiresInspection: policy.required.requiresInspection,
          premiumPlacementRequested: Boolean(updatedListingBase.featured || updatedListingBase.promoted),
        });

        const policyListing: PropertyListing = {
          ...updatedListingBase,
          status: nextStatus,
          verificationNotes: dedupe([policy.summary, ...updatedListingBase.verificationNotes]).slice(0, 8),
          trustBadges: dedupe([
            ...updatedListingBase.trustBadges,
            serviceType === "managed_property" ? "Managed track" : "Owner or agent governed",
            policy.required.requiresInspection ? "Inspection required" : "Queued for review",
          ]).slice(0, 6),
          riskScore: policy.riskScore,
          riskFlags: policy.riskFlags,
          policyVersion: PROPERTY_POLICY_VERSION,
          policySummary: policy.summary,
          pricingRuleBookKey: feeBreakdown.meta.ruleBookKey,
          pricingRuleVersion: feeBreakdown.meta.ruleVersion,
          feeBreakdown: {
            currency: feeBreakdown.currency,
            lines: feeBreakdown.lines.map((line) => ({
              code: line.code,
              label: line.label,
              amount: line.amount.amount,
            })),
            total: feeBreakdown.totals.customerTotal.amount,
          },
        };

        await upsertPropertyListing(policyListing);

        await appendPropertyPolicyEvent({
          listingId: listing.id,
          actorUserId: viewer.user.id,
          actorRole: "owner",
          eventType: "policy_evaluated",
          fromStatus: "submitted",
          toStatus: nextStatus,
          reason: policy.summary,
          metadata: {
            serviceType,
            intent: intentType,
            riskScore: policy.riskScore,
            riskFlags: policy.riskFlags,
            required: policy.required,
            pricingRuleBookKey: feeBreakdown.meta.ruleBookKey,
            pricingRuleVersion: feeBreakdown.meta.ruleVersion,
            feeBreakdown,
            walletBalanceKobo: wallet.balanceKobo,
            trustTier: trust.tier,
            trustScore: trust.score,
            verificationStatus: trust.signals.verificationStatus,
            submissionContext,
            documentKindCounts,
          },
        });

        await syncListingApplication({
          snapshot,
          listingId: listing.id,
          userId: viewer.user?.id ?? null,
          normalizedEmail: ownerEmail,
          applicantName: ownerName,
          companyName: submissionContext.agency_name || null,
          phone: ownerPhone,
          email: ownerEmail,
          verificationDocs,
          submissionContext:
            Object.keys(submissionContext).length > 0 ? submissionContext : null,
          status: toApplicationStatus(nextStatus),
          reviewNote: policy.userGuidance.headline,
        });

        const supportContextBlock = formatSubmissionContextForSupport(
          blueprint,
          Object.keys(submissionContext).length > 0 ? submissionContext : {}
        );

        await appendCustomerActivity({
          userId: viewer.user?.id ?? null,
          email: ownerEmail,
          activityType: "property_listing_submitted",
          title: `Submitted ${listing.title}`,
          description: listing.summary,
          status: nextStatus,
          referenceType: "property_listing",
          referenceId: listing.id,
          actionUrl: getSharedAccountPropertyPath("listings"),
          metadata: {
            listingId: listing.id,
            serviceType,
            intent: intentType,
            status: nextStatus,
          },
        });

        await createSupportThread({
          userId: viewer.user?.id ?? null,
          email: ownerEmail,
          subject: `Listing submission: ${listing.title}`,
          category: "listing_submission",
          referenceType: "property_listing",
          referenceId: listing.id,
          initialMessage: [
            listing.summary,
            listing.description,
            supportContextBlock ? `Submission context\n${supportContextBlock}` : null,
          ]
            .filter(Boolean)
            .join("\n\n"),
        });

        await sendPropertyEvent({
          event: "listing_submitted",
          userId: viewer.user?.id ?? null,
          normalizedEmail: ownerEmail,
          recipientEmail: ownerEmail,
          recipientPhone: ownerPhone,
          entityType: "property_listing",
          entityId: listing.id,
          payload: {
            listingTitle: listing.title,
            policyStatus: nextStatus,
            policySummary: policy.summary,
          },
        });

        await sendPropertyEvent({
          event: "new_lead_alert",
          recipientEmail: operatorInbox,
          entityType: "property_listing",
          entityId: listing.id,
          payload: {
            listingTitle: listing.title,
            note: `New listing submission from ${ownerName} entered policy state: ${nextStatus.replaceAll("_", " ")}${
              inspectionRecord ? ` with ${getInspectionStatusSummary(inspectionRecord.status).toLowerCase()}.` : "."
            }`,
          },
        });

        revalidatePropertyRoutes(listing.slug);
        let submitRedirect = withQuery("/submit", "submitted", "1");
        submitRedirect = withQuery(submitRedirect, "policy", nextStatus);
        if (trust.signals.verificationStatus !== "verified") {
          submitRedirect = withQuery(submitRedirect, "verification", trust.signals.verificationStatus);
        }
        return respondSuccess(request, submitRedirect, {
          message:
            "Listing submitted. HenryCo Property queued policy review, moderation, and follow-up notifications.",
          submission: {
            listingId: listing.id,
            listingSlug: listing.slug,
            listingTitle: listing.title,
            policyStatus: nextStatus,
            policySummary: policy.summary,
            nextStepLabel: policy.userGuidance.nextStepLabel,
            guidanceHeadline: policy.userGuidance.headline,
            guidanceBullets: policy.userGuidance.bullets,
            verificationStatus: trust.signals.verificationStatus,
            requiresInspection: policy.required.requiresInspection,
            requiresEnhancedKyc: policy.required.requiresEnhancedKyc,
          },
        });
      }

      case "listing_update": {
        if (!viewer.user) {
          return redirectToAccountSignIn(request, "/owner");
        }

        const listingId = text(formData, "listing_id");
        const listing = snapshot.listings.find((item) => item.id === listingId);
        if (!listing) return redirectTo(request, withQuery(returnTo, "error", "missing-listing"));

        const canEdit = isListingOwner(viewer, listing) || requireRoles(viewer, [
          "listing_manager",
          "moderation",
          "property_admin",
        ]);
        if (!canEdit) return redirectTo(request, "/owner");

        const existingApplication = snapshot.applications.find((item) => item.listingId === listing.id);
        const blueprint = getPropertySubmissionBlueprint(listing.serviceType, listing.intent);
        const currentContext = readPropertySubmissionContext(formData, blueprint);
        const mergedSubmissionContext = mergeSubmissionContext(
          existingApplication?.submissionContext,
          currentContext
        );
        const extraGallery = listValue(formData, "gallery_urls");
        const mediaFiles = fileValues(formData, "media");
        const documentUploads = getDocumentUploadsFromFormData(formData);
        const uploadErrors = [
          ...validateUploadFiles(mediaFiles, "media"),
          ...documentUploads.flatMap((upload) => validateUploadFiles(upload.files, "document")),
        ];
        if (uploadErrors.length > 0) {
          return respondError(request, returnTo, {
            message: uploadErrors[0] || "Property files could not be processed.",
            code: "upload-validation",
            extra: {
              errors: uploadErrors,
            },
          });
        }

        const uploadedMedia = await uploadFilesAsMedia(listing.id, mediaFiles);
        const gallery = dedupe([...listing.gallery, ...extraGallery, ...uploadedMedia]);

        const isLive = isPropertyListingPublicStatus(listing.status);

        const updatedListing: PropertyListing = {
          ...listing,
          summary: text(formData, "summary") || listing.summary,
          description: text(formData, "description") || listing.description,
          price: numberValue(formData, "price") || listing.price,
          priceInterval: text(formData, "price_interval") || listing.priceInterval,
          bedrooms: numberValue(formData, "bedrooms") ?? listing.bedrooms,
          bathrooms: numberValue(formData, "bathrooms") ?? listing.bathrooms,
          sizeSqm: numberValue(formData, "size_sqm") ?? listing.sizeSqm,
          parkingSpaces: numberValue(formData, "parking_spaces") ?? listing.parkingSpaces,
          furnished: bool(formData, "furnished"),
          petFriendly: bool(formData, "pet_friendly"),
          shortletReady: bool(formData, "shortlet_ready"),
          managedByHenryCo:
            bool(formData, "managed_by_henryco") || listing.serviceType === "managed_property",
          amenities: listValue(formData, "amenities").length
            ? listValue(formData, "amenities")
            : listing.amenities,
          gallery,
          heroImage: gallery[0] || listing.heroImage,
          status: listing.status,
          visibility: isLive ? listing.visibility : "private",
          verificationNotes: dedupe(["Listing updated", ...listing.verificationNotes]).slice(0, 8),
        };

        const verificationDocs = await uploadFilesAsDocuments(
          listing.id,
          { userId: viewer.user.id, email: viewer.normalizedEmail || listing.ownerEmail },
          documentUploads
        );
        const mergedVerificationDocs = mergeVerificationDocs(
          existingApplication?.verificationDocs || [],
          verificationDocs
        );
        const documentKindCounts = countDocumentKinds(mergedVerificationDocs);

        const [wallet, trust] = await Promise.all([
          getPropertyWalletSummary(viewer.user.id),
          getPropertyTrustSignals(viewer.user.id),
        ]);

        const policy = evaluatePropertySubmissionPolicy({
          viewer: { userId: viewer.user.id, email: viewer.user.email },
          wallet: { balanceKobo: wallet.balanceKobo, currency: wallet.currency },
          trust,
          submission: {
            serviceType: updatedListing.serviceType,
            intent: updatedListing.intent,
            kind: updatedListing.kind,
            price: updatedListing.price,
            mediaCount: updatedListing.gallery.length,
            verificationDocCount: totalDocumentCount(documentKindCounts),
            locationSlug: updatedListing.locationSlug,
            ownershipProofCount: documentKindCounts.ownership_proof,
            authorityProofCount: documentKindCounts.authority_proof,
            managementAuthorizationCount: documentKindCounts.management_authorization,
            identityEvidenceCount: documentKindCounts.identity_evidence,
            inspectionEvidenceCount: documentKindCounts.inspection_evidence,
          },
        });

        const activeInspection = snapshot.inspections.find(
          (inspection) =>
            inspection.listingId === listing.id &&
            ["requested", "scheduled", "completed", "waived", "failed", "cancelled"].includes(
              inspection.status
            )
        );

        let nextStatus: PropertyListingStatus = isLive ? listing.status : policy.nextStatus;
        let inspectionRecord: PropertyListingInspection | null = null;

        if (!isLive && activeInspection) {
          nextStatus = resolveInspectionDrivenStatus(
            listing.status,
            policy.nextStatus,
            activeInspection.status
          );
        } else if (!isLive && policy.required.requiresInspection) {
          inspectionRecord = await ensureListingInspectionRecord({
            snapshot,
            listingId: listing.id,
            requestedByUserId: viewer.user.id,
            policyStatus: policy.nextStatus,
            policySummary: policy.summary,
            inspectionNotes: mergedSubmissionContext.inspection_notes || null,
          });
          nextStatus = resolveInspectionDrivenStatus(
            listing.status,
            policy.nextStatus,
            inspectionRecord.status
          );
        }

        await upsertPropertyListing({
          ...updatedListing,
          status: nextStatus,
          verificationNotes: dedupe([policy.summary, ...updatedListing.verificationNotes]).slice(0, 8),
          trustBadges: dedupe([
            ...updatedListing.trustBadges,
            updatedListing.managedByHenryCo ? "Managed track" : "Owner or agent governed",
            policy.required.requiresInspection ? "Inspection required" : "Queued for review",
          ]).slice(0, 6),
          riskScore: policy.riskScore,
          riskFlags: policy.riskFlags,
          policyVersion: PROPERTY_POLICY_VERSION,
          policySummary: policy.summary,
        });

        await appendPropertyPolicyEvent({
          listingId: listing.id,
          actorUserId: viewer.user.id,
          actorRole: "owner",
          eventType: "status_transition",
          fromStatus: listing.status,
          toStatus: nextStatus,
          reason: "Listing updated and policy re-evaluated.",
          metadata: {
            policySummary: policy.summary,
            verificationStatus: trust.signals.verificationStatus,
            submissionContext: mergedSubmissionContext,
            documentKindCounts,
            inspectionId: inspectionRecord?.id || activeInspection?.id || null,
          },
        });

        await syncListingApplication({
          snapshot,
          listingId: listing.id,
          userId: viewer.user.id,
          normalizedEmail: viewer.normalizedEmail || listing.normalizedEmail,
          applicantName: listing.ownerName || viewer.user.fullName || "Listing owner",
          companyName:
            mergedSubmissionContext.agency_name || existingApplication?.companyName || null,
          phone: listing.ownerPhone,
          email: listing.ownerEmail || viewer.user.email || "",
          verificationDocs,
          submissionContext:
            Object.keys(mergedSubmissionContext).length > 0 ? mergedSubmissionContext : null,
          status: toApplicationStatus(nextStatus),
          reviewNote: policy.userGuidance.headline,
        });

        await appendCustomerActivity({
          userId: viewer.user.id,
          email: viewer.user.email,
          activityType: "property_listing_updated",
          title: `Updated ${listing.title}`,
          description: "Listing details were revised inside HenryCo Property.",
          status: nextStatus,
          referenceType: "property_listing",
          referenceId: listing.id,
          actionUrl: getSharedAccountPropertyPath("listings"),
        });

        if (nextStatus !== listing.status && !isLive) {
          await sendPropertyEvent({
            event: "listing_submitted",
            userId: viewer.user.id,
            normalizedEmail: viewer.normalizedEmail,
            recipientEmail: listing.ownerEmail || viewer.user.email,
            recipientPhone: listing.ownerPhone,
            entityType: "property_listing",
            entityId: listing.id,
            payload: {
              listingTitle: listing.title,
              policyStatus: nextStatus,
              policySummary: policy.summary,
            },
          });
        }

        revalidatePropertyRoutes(listing.slug);
        return respondSuccess(request, withQuery(returnTo, "updated", "1"), {
          message: "Listing updated and re-evaluated against HenryCo Property trust rules.",
          listing: {
            listingId: listing.id,
            status: nextStatus,
            policySummary: policy.summary,
          },
        });
      }

      case "listing_decision": {
        if (
          !requireRoles(viewer, ["listing_manager", "moderation", "property_admin", "relationship_manager"])
        ) {
          return redirectTo(request, "/account");
        }

        const listingId = text(formData, "listing_id");
        const listing = snapshot.listings.find((item) => item.id === listingId);
        if (!listing) return redirectTo(request, withQuery(returnTo, "error", "missing-listing"));

        const decision = (text(formData, "decision") || "requires_correction") as PropertyListingStatus;
        const note = text(formData, "note");
        const status: PropertyListingStatus =
          decision === "published" ||
          decision === "approved" ||
          decision === "rejected" ||
          decision === "requires_correction" ||
          decision === "changes_requested" ||
          decision === "blocked" ||
          decision === "escalated"
            ? decision
            : "requires_correction";
        const openInspection = snapshot.inspections.find(
          (inspection) =>
            inspection.listingId === listing.id && ["requested", "scheduled"].includes(inspection.status)
        );

        if (
          ["requires_correction", "changes_requested", "rejected", "blocked", "escalated"].includes(
            status
          ) &&
          !note
        ) {
          return respondError(request, returnTo, {
            message: "A note is required when a listing is being held, corrected, rejected, blocked, or escalated.",
            code: "decision-note-required",
          });
        }

        if ((status === "published" || status === "approved") && openInspection) {
          return respondError(request, returnTo, {
            message:
              "Finish or waive the active inspection before publishing this listing. Publication should not skip an open trust check.",
            code: "inspection-still-open",
          });
        }

        if (
          (status === "published" || status === "approved") &&
          ["awaiting_documents", "awaiting_eligibility"].includes(listing.status)
        ) {
          return respondError(request, returnTo, {
            message:
              "Resolve the current document or eligibility hold before forcing publication. The trust gate is still incomplete.",
            code: "trust-gate-incomplete",
          });
        }

        const updatedListing: PropertyListing = {
          ...listing,
          status,
          visibility: status === "published" || status === "approved" ? "public" : "private",
          featured: bool(formData, "featured"),
          promoted: bool(formData, "promoted"),
          agentId: text(formData, "agent_id") || listing.agentId,
          trustBadges:
            status === "published" || status === "approved"
              ? dedupe([...listing.trustBadges, "HenryCo reviewed", "Publication cleared"])
              : listing.trustBadges,
          verificationNotes: note
            ? dedupe([note, ...listing.verificationNotes]).slice(0, 6)
            : listing.verificationNotes,
        };

        await upsertPropertyListing(updatedListing);

        await appendPropertyPolicyEvent({
          listingId: listing.id,
          actorUserId: viewer.user?.id ?? null,
          actorRole: "staff",
          eventType: "status_transition",
          fromStatus: listing.status,
          toStatus: status,
          reason: note || "Staff decision applied.",
          metadata: { featured: updatedListing.featured, promoted: updatedListing.promoted },
        });

        const existingApplication = snapshot.applications.find((item) => item.listingId === listing.id);
        if (existingApplication) {
          await upsertPropertyApplication({
            ...existingApplication,
            status:
              status === "published" || status === "approved"
                ? "approved"
              : status === "rejected"
                  ? "rejected"
                  : "under_review",
            reviewNote: note || existingApplication.reviewNote,
            updatedAt: new Date().toISOString(),
          });
        }

        await appendCustomerActivity({
          userId: listing.ownerUserId,
          email: listing.ownerEmail,
          activityType: "property_listing_reviewed",
          title: `${listing.title} ${status === "published" || status === "approved" ? "published" : "updated"}`,
          description: note || `Listing status changed to ${status}.`,
          status,
          referenceType: "property_listing",
          referenceId: listing.id,
          actionUrl:
            status === "published" || status === "approved"
              ? `/property/${listing.slug}`
              : getSharedAccountPropertyPath("listings"),
        });

        await sendPropertyEvent({
          event: status === "published" || status === "approved" ? "listing_approved" : "listing_rejected",
          userId: listing.ownerUserId,
          normalizedEmail: listing.normalizedEmail,
          recipientEmail: listing.ownerEmail,
          recipientPhone: listing.ownerPhone,
          entityType: "property_listing",
          entityId: listing.id,
          payload: {
            listingTitle: listing.title,
            locationLabel: listing.locationLabel,
            note,
            ctaHref: `/property/${listing.slug}`,
          },
        });

        revalidatePropertyRoutes(listing.slug);
        return redirectTo(request, withQuery(returnTo, "decision", status));
      }

      case "inspection_update": {
        if (
          !requireRoles(viewer, [
            "managed_ops",
            "relationship_manager",
            "listing_manager",
            "moderation",
            "property_admin",
          ])
        ) {
          return redirectTo(request, "/account");
        }

        const inspectionId = text(formData, "inspection_id");
        const listingId = text(formData, "listing_id");
        const existingInspection =
          snapshot.inspections.find((item) => item.id === inspectionId) ||
          snapshot.inspections.find((item) => item.listingId === listingId);
        const listing = snapshot.listings.find(
          (item) => item.id === (existingInspection?.listingId || listingId)
        );
        if (!listing) {
          return respondError(request, returnTo, {
            message: "Associated listing could not be found.",
            code: "missing-listing",
          });
        }

        const inspection: PropertyListingInspection =
          existingInspection || {
            id: randomUUID(),
            listingId: listing.id,
            requestedByUserId: viewer.user?.id ?? null,
            status: "requested",
            reason: "Inspection workflow created from staff review.",
            scheduledFor: null,
            assignedAgentId: null,
            locationNotes: null,
            outcomeNotes: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

        const nextInspectionStatus = (
          text(formData, "status") || inspection.status
        ) as PropertyListingInspectionStatus;
        const scheduledFor = localToIso(text(formData, "scheduled_for")) || inspection.scheduledFor;
        const locationNotes = text(formData, "location_notes") || inspection.locationNotes || null;
        const outcomeNotes = text(formData, "outcome_notes") || inspection.outcomeNotes || null;
        const reason =
          text(formData, "reason") ||
          outcomeNotes ||
          locationNotes ||
          inspection.reason ||
          "Inspection workflow updated.";

        const updatedInspection: PropertyListingInspection = {
          ...inspection,
          status: nextInspectionStatus,
          scheduledFor,
          assignedAgentId: text(formData, "assigned_agent_id") || inspection.assignedAgentId,
          locationNotes,
          outcomeNotes,
          reason,
          updatedAt: new Date().toISOString(),
        };

        await upsertPropertyInspection(updatedInspection);

        const nextListingStatus = isPropertyListingPublicStatus(listing.status)
          ? listing.status
          : resolveInspectionDrivenStatus(listing.status, listing.status, nextInspectionStatus);

        if (nextListingStatus !== listing.status) {
          await upsertPropertyListing({
            ...listing,
            status: nextListingStatus,
            visibility: isPropertyListingPublicStatus(nextListingStatus) ? "public" : "private",
            verificationNotes: dedupe([
              `${getInspectionStatusSummary(nextInspectionStatus)} by HenryCo Property`,
              ...listing.verificationNotes,
            ]).slice(0, 8),
          });
        }

        await appendPropertyPolicyEvent({
          listingId: listing.id,
          actorUserId: viewer.user?.id ?? null,
          actorRole: "staff",
          eventType: "inspection_updated",
          fromStatus: listing.status,
          toStatus: nextListingStatus,
          reason,
          metadata: {
            inspectionId: updatedInspection.id,
            inspectionStatus: nextInspectionStatus,
            scheduledFor: updatedInspection.scheduledFor,
            assignedAgentId: updatedInspection.assignedAgentId,
          },
        });

        const existingApplication = snapshot.applications.find((item) => item.listingId === listing.id);
        if (existingApplication) {
          await upsertPropertyApplication({
            ...existingApplication,
            status:
              nextInspectionStatus === "completed" || nextInspectionStatus === "waived"
                ? "under_review"
                : nextInspectionStatus === "failed"
                  ? "rejected"
                  : existingApplication.status,
            reviewNote: reason,
            updatedAt: new Date().toISOString(),
          });
        }

        await appendCustomerActivity({
          userId: listing.ownerUserId,
          email: listing.ownerEmail,
          activityType: "property_inspection_updated",
          title: `${listing.title} inspection updated`,
          description: reason,
          status: nextInspectionStatus,
          referenceType: "property_listing",
          referenceId: listing.id,
          actionUrl: getSharedAccountPropertyPath("listings"),
          metadata: {
            inspectionId: updatedInspection.id,
            inspectionStatus: nextInspectionStatus,
          },
        });

        revalidatePropertyRoutes(listing.slug);
        return respondSuccess(request, withQuery(returnTo, "inspection", nextInspectionStatus), {
          message: "Inspection workflow updated.",
          inspection: {
            inspectionId: updatedInspection.id,
            listingId: listing.id,
            status: nextInspectionStatus,
            listingStatus: nextListingStatus,
          },
        });
      }

      case "inquiry_update": {
        if (!requireRoles(viewer, ["relationship_manager", "support", "property_admin"])) {
          return redirectTo(request, "/account");
        }

        const inquiryId = text(formData, "inquiry_id");
        const inquiry = snapshot.inquiries.find((item) => item.id === inquiryId);
        if (!inquiry) return redirectTo(request, withQuery(returnTo, "error", "missing-inquiry"));
        const assignedAgentId = text(formData, "assigned_agent_id") || inquiry.assignedAgentId;
        const selectedStatus = text(formData, "status");
        const nextStatus =
          assignedAgentId && (!selectedStatus || selectedStatus === "new")
            ? "assigned"
            : selectedStatus || inquiry.status;

        await upsertPropertyInquiry({
          ...inquiry,
          status: nextStatus as typeof inquiry.status,
          assignedAgentId,
          updatedAt: new Date().toISOString(),
        });

        revalidatePropertyRoutes();
        return redirectTo(request, withQuery(returnTo, "updated", "1"));
      }

      case "viewing_update": {
        if (!requireRoles(viewer, ["relationship_manager", "support", "managed_ops", "property_admin"])) {
          return redirectTo(request, "/account");
        }

        const viewingId = text(formData, "viewing_id");
        const viewing = snapshot.viewingRequests.find((item) => item.id === viewingId);
        if (!viewing) return redirectTo(request, withQuery(returnTo, "error", "missing-viewing"));

        const scheduledFor = localToIso(text(formData, "scheduled_for")) || viewing.scheduledFor;
        const scheduledDate = scheduledFor ? new Date(scheduledFor) : null;
        const reminderAt = scheduledDate
          ? new Date(scheduledDate.getTime() - 6 * 60 * 60 * 1000).toISOString()
          : viewing.reminderAt;
        const status = (text(formData, "status") || viewing.status) as typeof viewing.status;

        await upsertPropertyViewingRequest({
          ...viewing,
          scheduledFor,
          reminderAt,
          assignedAgentId: text(formData, "assigned_agent_id") || viewing.assignedAgentId,
          notes: text(formData, "notes") || viewing.notes,
          status,
          updatedAt: new Date().toISOString(),
        });

        if (status === "scheduled" || status === "confirmed") {
          const listing = snapshot.listings.find((item) => item.id === viewing.listingId);
          await sendPropertyEvent({
            event: "viewing_scheduled",
            userId: viewing.userId,
            normalizedEmail: viewing.normalizedEmail,
            recipientEmail: viewing.attendeeEmail,
            recipientPhone: viewing.attendeePhone,
            entityType: "property_viewing_request",
            entityId: viewing.id,
            payload: {
              listingTitle: listing?.title || "Property viewing",
              scheduledFor,
              viewingTime: scheduledFor,
            },
          });
        }

        revalidatePropertyRoutes();
        return redirectTo(request, withQuery(returnTo, "updated", "1"));
      }

      case "managed_record_update": {
        if (!requireRoles(viewer, ["managed_ops", "property_admin", "relationship_manager"])) {
          return redirectTo(request, "/account");
        }

        const recordId = text(formData, "record_id");
        const record = snapshot.managedRecords.find((item) => item.id === recordId);
        if (!record) return redirectTo(request, withQuery(returnTo, "error", "missing-record"));

        await upsertPropertyManagedRecord({
          ...record,
          status: (text(formData, "status") || record.status) as typeof record.status,
          narrative: text(formData, "narrative") || record.narrative,
          serviceLines: listValue(formData, "service_lines").length
            ? listValue(formData, "service_lines")
            : record.serviceLines,
          assignedManagerId: text(formData, "assigned_manager_id") || record.assignedManagerId,
        });

        await sendPropertyEvent({
          event: "managed_update",
          recipientEmail: operatorInbox,
          entityType: "property_managed_record",
          entityId: record.id,
          payload: {
            listingTitle: record.title,
            note: text(formData, "narrative") || record.narrative,
          },
        });

        revalidatePropertyRoutes();
        return redirectTo(request, withQuery(returnTo, "updated", "1"));
      }

      default:
        return redirectTo(request, withQuery(returnTo, "error", "unknown-intent"));
    }
  } catch (error) {
    return respondError(request, returnTo, {
      message:
        error instanceof Error ? error.message : "Property submission could not be completed.",
      code: "mutation-failed",
      status: 500,
    });
  }
}
