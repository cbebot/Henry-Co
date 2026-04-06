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
import {
  createListingFromSubmission,
  removeSavedPropertyForUser,
  savePropertyForUser,
  upsertPropertyApplication,
  upsertPropertyInquiry,
  upsertPropertyListing,
  upsertPropertyManagedRecord,
  upsertPropertyViewingRequest,
  uploadPropertyDocument,
  uploadPropertyMedia,
} from "@/lib/property/store";
import type {
  PropertyListing,
  PropertyListingApplication,
  PropertyListingStatus,
  PropertyRole,
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
  files: File[]
) {
  const documents: Array<{ name: string; url: string; kind: string }> = [];

  for (const file of files) {
    const url = await uploadPropertyDocument(listingId, file);
    documents.push({
      name: file.name,
      url,
      kind: file.type || "document",
    });

    await appendCustomerDocument({
      userId: owner.userId,
      email: owner.email,
      name: file.name,
      type: "property_verification",
      fileUrl: url,
      fileSize: file.size,
      mimeType: file.type || null,
      referenceType: "property_listing",
      referenceId: listingId,
    });
  }

  return documents;
}

async function syncListingApplication(input: {
  snapshot: Awaited<ReturnType<typeof getPropertySnapshot>>;
  listingId: string;
  userId?: string | null;
  normalizedEmail?: string | null;
  applicantName: string;
  phone?: string | null;
  email: string;
  verificationDocs: Array<{ name: string; url: string; kind: string }>;
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
    companyName: existing?.companyName || null,
    phone: input.phone ?? existing?.phone ?? null,
    email: input.email,
    verificationDocs: input.verificationDocs.length
      ? input.verificationDocs
      : existing?.verificationDocs || [],
    status: input.status || existing?.status || "submitted",
    reviewNote: input.reviewNote ?? existing?.reviewNote ?? null,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  });
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
          return redirectTo(request, `/login?next=${encodeURIComponent(returnTo)}`);
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
          return redirectToAccountSignIn(request, returnTo || "/submit");
        }

        const ownerName = text(formData, "owner_name") || viewer.user?.fullName || "Property owner";
        const ownerEmail = normalizeEmail(text(formData, "owner_email") || viewer.user?.email);
        if (!ownerEmail) return redirectTo(request, withQuery(returnTo, "error", "missing-email"));

        const ownerPhone = text(formData, "owner_phone");
        const baseGallery = listValue(formData, "gallery_urls");

        const listing = await createListingFromSubmission({
          title: text(formData, "title"),
          summary: text(formData, "summary"),
          description: text(formData, "description"),
          kind: (text(formData, "kind") || "rent") as PropertyListing["kind"],
          locationSlug: text(formData, "location_slug"),
          locationLabel: text(formData, "location_label"),
          district: text(formData, "district"),
          addressLine: text(formData, "address_line"),
          price: numberValue(formData, "price") || 0,
          priceInterval: text(formData, "price_interval") || "per year",
          bedrooms: numberValue(formData, "bedrooms"),
          bathrooms: numberValue(formData, "bathrooms"),
          sizeSqm: numberValue(formData, "size_sqm"),
          parkingSpaces: numberValue(formData, "parking_spaces"),
          furnished: bool(formData, "furnished"),
          petFriendly: bool(formData, "pet_friendly"),
          shortletReady: bool(formData, "shortlet_ready"),
          managedByHenryCo: bool(formData, "managed_by_henryco"),
          ownerUserId: viewer.user?.id ?? null,
          normalizedEmail: viewer.normalizedEmail ?? ownerEmail,
          ownerName,
          ownerPhone,
          ownerEmail,
          gallery: baseGallery,
          amenities: listValue(formData, "amenities"),
        });

        const mediaFiles = formData
          .getAll("media")
          .filter((value): value is File => value instanceof File && value.size > 0);
        const verificationFiles = formData
          .getAll("verification_docs")
          .filter((value): value is File => value instanceof File && value.size > 0);

        const uploadedMedia = await uploadFilesAsMedia(listing.id, mediaFiles);
        const gallery = dedupe([...listing.gallery, ...uploadedMedia]);

        const updatedListing: PropertyListing = {
          ...listing,
          gallery,
          heroImage: gallery[0] || listing.heroImage,
        };
        await upsertPropertyListing(updatedListing);

        await ensureCustomerProfile({
          userId: viewer.user?.id ?? null,
          email: ownerEmail,
          fullName: ownerName,
          phone: ownerPhone,
        });

        const verificationDocs = await uploadFilesAsDocuments(
          listing.id,
          { userId: viewer.user?.id ?? null, email: ownerEmail },
          verificationFiles
        );

        await syncListingApplication({
          snapshot,
          listingId: listing.id,
          userId: viewer.user?.id ?? null,
          normalizedEmail: ownerEmail,
          applicantName: ownerName,
          phone: ownerPhone,
          email: ownerEmail,
          verificationDocs,
          status: "submitted",
        });

        await appendCustomerActivity({
          userId: viewer.user?.id ?? null,
          email: ownerEmail,
          activityType: "property_listing_submitted",
          title: `Submitted ${listing.title}`,
          description: listing.summary,
          status: "submitted",
          referenceType: "property_listing",
          referenceId: listing.id,
          actionUrl: getSharedAccountPropertyPath("listings"),
          metadata: { listingId: listing.id },
        });

        await createSupportThread({
          userId: viewer.user?.id ?? null,
          email: ownerEmail,
          subject: `Listing submission: ${listing.title}`,
          category: "listing_submission",
          referenceType: "property_listing",
          referenceId: listing.id,
          initialMessage: `${listing.summary}\n\n${listing.description}`,
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
          },
        });

        await sendPropertyEvent({
          event: "new_lead_alert",
          recipientEmail: operatorInbox,
          entityType: "property_listing",
          entityId: listing.id,
          payload: {
            listingTitle: listing.title,
            note: `New listing submission from ${ownerName} is waiting for moderation.`,
          },
        });

        revalidatePropertyRoutes(listing.slug);
        return redirectTo(request, "/submit?submitted=1");
      }

      case "listing_update": {
        if (!viewer.user) {
          return redirectTo(request, `/login?next=${encodeURIComponent("/owner")}`);
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

        const extraGallery = listValue(formData, "gallery_urls");
        const mediaFiles = formData
          .getAll("media")
          .filter((value): value is File => value instanceof File && value.size > 0);
        const verificationFiles = formData
          .getAll("verification_docs")
          .filter((value): value is File => value instanceof File && value.size > 0);
        const uploadedMedia = await uploadFilesAsMedia(listing.id, mediaFiles);
        const gallery = dedupe([...listing.gallery, ...extraGallery, ...uploadedMedia]);
        const nextStatus: PropertyListingStatus =
          listing.status === "changes_requested" ||
          listing.status === "rejected" ||
          listing.status === "draft"
            ? "submitted"
            : listing.status;

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
          managedByHenryCo: bool(formData, "managed_by_henryco"),
          amenities: listValue(formData, "amenities").length
            ? listValue(formData, "amenities")
            : listing.amenities,
          gallery,
          heroImage: gallery[0] || listing.heroImage,
          status: nextStatus,
          visibility: nextStatus === "approved" ? listing.visibility : "private",
          verificationNotes:
            nextStatus === "submitted"
              ? dedupe(["Updated and resubmitted for moderation", ...listing.verificationNotes]).slice(
                  0,
                  5
                )
              : listing.verificationNotes,
        };

        await upsertPropertyListing(updatedListing);

        const verificationDocs = await uploadFilesAsDocuments(
          listing.id,
          { userId: viewer.user.id, email: viewer.normalizedEmail || listing.ownerEmail },
          verificationFiles
        );

        await syncListingApplication({
          snapshot,
          listingId: listing.id,
          userId: viewer.user.id,
          normalizedEmail: viewer.normalizedEmail || listing.normalizedEmail,
          applicantName: listing.ownerName || viewer.user.fullName || "Listing owner",
          phone: listing.ownerPhone,
          email: listing.ownerEmail || viewer.user.email || "",
          verificationDocs,
          status: "submitted",
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

        if (nextStatus === "submitted") {
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
            },
          });
        }

        revalidatePropertyRoutes(listing.slug);
        return redirectTo(request, withQuery(returnTo, "updated", "1"));
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

        const decision = (text(formData, "decision") || "changes_requested") as PropertyListingStatus;
        const note = text(formData, "note");
        const status =
          decision === "approved" || decision === "rejected" || decision === "changes_requested"
            ? decision
            : "changes_requested";

        const updatedListing: PropertyListing = {
          ...listing,
          status,
          visibility: status === "approved" ? "public" : "private",
          featured: bool(formData, "featured"),
          promoted: bool(formData, "promoted"),
          agentId: text(formData, "agent_id") || listing.agentId,
          trustBadges:
            status === "approved"
              ? dedupe([...listing.trustBadges, "HenryCo reviewed"])
              : listing.trustBadges,
          verificationNotes: note
            ? dedupe([note, ...listing.verificationNotes]).slice(0, 6)
            : listing.verificationNotes,
        };

        await upsertPropertyListing(updatedListing);

        const existingApplication = snapshot.applications.find((item) => item.listingId === listing.id);
        if (existingApplication) {
          await upsertPropertyApplication({
            ...existingApplication,
            status:
              status === "approved"
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
          title: `${listing.title} ${status === "approved" ? "approved" : "updated"}`,
          description: note || `Listing status changed to ${status}.`,
          status,
          referenceType: "property_listing",
          referenceId: listing.id,
          actionUrl:
            status === "approved"
              ? `/property/${listing.slug}`
              : getSharedAccountPropertyPath("listings"),
        });

        await sendPropertyEvent({
          event: status === "approved" ? "listing_approved" : "listing_rejected",
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
    return redirectTo(
      request,
      withQuery(
        returnTo,
        "error",
        error instanceof Error ? error.message.slice(0, 120) : "mutation-failed"
      )
    );
  }
}
