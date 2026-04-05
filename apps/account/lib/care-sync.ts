import "server-only";

import { after } from "next/server";
import {
  emailsMatch,
  getDivisionUrl,
  normalizeEmail,
  normalizePhone,
  phoneSearchVariants,
  phonesMatch,
} from "@henryco/config";
import { createAdminSupabase } from "@/lib/supabase";

export type CareAccountIdentity = {
  userId: string;
  email?: string | null;
  fullName?: string | null;
  phone?: string | null;
};

type CareBookingRow = {
  id: string;
  tracking_code: string | null;
  customer_name: string | null;
  email: string | null;
  phone: string | null;
  phone_normalized: string | null;
  service_type: string | null;
  item_summary: string | null;
  pickup_address: string | null;
  pickup_date: string | null;
  pickup_slot: string | null;
  status: string | null;
  quoted_total: number | null;
  amount_paid: number | null;
  balance_due: number | null;
  payment_status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type CarePaymentRequestRow = {
  id: string;
  booking_id: string;
  request_kind: string | null;
  amount_due: number | null;
  status: string | null;
  requested_at: string | null;
  sent_at: string | null;
  paid_at: string | null;
  payload: Record<string, unknown> | null;
};

export type LinkedCareBooking = CareBookingRow & {
  trackUrl: string;
  reviewUrl: string | null;
  payment: {
    verificationStatus: string;
    verificationLabel: string;
    verificationMessage: string;
    amountDue: number;
    amountPaidRecorded: number;
    balanceDue: number;
    paymentStatus: string | null;
    receiptCount: number;
    canSubmitReceipt: boolean;
    lastSubmittedAt: string | null;
    lastReviewedAt: string | null;
    latestReviewReason: string | null;
  };
  nextAction: {
    label: string;
    description: string;
    href: string;
    tone: "normal" | "warning" | "success";
  };
};

function cleanText(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function sanitizeAmount(value: unknown) {
  const normalized = Number(value ?? 0);
  return Number.isFinite(normalized) ? Math.max(0, normalized) : 0;
}

function canLeaveReview(status?: string | null) {
  const normalized = cleanText(status)?.toLowerCase() || "";
  return [
    "delivered",
    "customer_confirmed",
    "inspection_completed",
    "service_completed",
    "supervisor_signoff",
  ].includes(normalized);
}

function latestVerificationStatus(
  booking: CareBookingRow,
  request: CarePaymentRequestRow | null
) {
  const payload = asRecord(request?.payload);
  const explicit = cleanText(payload?.verification_status);

  if (cleanText(request?.status)?.toLowerCase() === "paid" || sanitizeAmount(booking.balance_due) <= 0) {
    return "approved";
  }

  return explicit || "awaiting_receipt";
}

function latestVerificationLabel(status: string) {
  const normalized = cleanText(status)?.toLowerCase() || "awaiting_receipt";
  if (normalized === "approved") return "Payment approved";
  if (normalized === "receipt_submitted") return "Receipt submitted";
  if (normalized === "under_review") return "Under review";
  if (normalized === "awaiting_corrected_proof") return "Corrected receipt needed";
  if (normalized === "rejected") return "Receipt rejected";
  return "Receipt pending";
}

function latestVerificationMessage(
  status: string,
  booking: CareBookingRow,
  payload: Record<string, unknown> | null
) {
  const normalized = cleanText(status)?.toLowerCase() || "awaiting_receipt";
  const latestReason =
    cleanText(payload?.latest_review_reason) || cleanText(payload?.last_review_reason);
  const balanceDue = sanitizeAmount(booking.balance_due);

  if (normalized === "approved") {
    return "Payment has been verified and the booking can continue through live operations.";
  }

  if (normalized === "receipt_submitted") {
    return "Your receipt has been received and is waiting for verification.";
  }

  if (normalized === "under_review") {
    return "The submitted payment proof is under review by the Care team.";
  }

  if (normalized === "awaiting_corrected_proof" || normalized === "rejected") {
    return latestReason || "A clearer or corrected receipt is needed before the booking can continue.";
  }

  return balanceDue > 0
    ? "Outstanding payment is still pending. Submit the receipt once payment is complete."
    : "Payment follow-up is still being prepared for this booking.";
}

function buildTrackUrl(booking: CareBookingRow) {
  const params = new URLSearchParams();
  params.set("code", String(booking.tracking_code || ""));

  if (booking.phone) {
    params.set("phone", booking.phone);
  }

  return `${getDivisionUrl("care")}/track?${params.toString()}`;
}

function buildReviewUrl(booking: CareBookingRow) {
  if (!canLeaveReview(booking.status)) {
    return null;
  }

  const params = new URLSearchParams();
  params.set("code", String(booking.tracking_code || ""));

  if (booking.phone) {
    params.set("phone", booking.phone);
  }

  return `${getDivisionUrl("care")}/review?${params.toString()}`;
}

function buildActivityTitle(booking: CareBookingRow) {
  return `Care booking • ${booking.tracking_code || booking.id}`;
}

function buildActivityDescription(booking: CareBookingRow) {
  const dateSummary = booking.pickup_date
    ? `${booking.pickup_date}${booking.pickup_slot ? ` • ${booking.pickup_slot}` : ""}`
    : "Schedule to be confirmed";

  return `${booking.service_type || "Care service"} • ${dateSummary}`;
}

function buildNotificationBody(booking: CareBookingRow) {
  const balanceDue = sanitizeAmount(booking.balance_due);

  if (balanceDue > 0) {
    return `Tracking ${booking.tracking_code || booking.id} is available in your account. Outstanding balance: ₦${balanceDue.toLocaleString()}.`;
  }

  return `Tracking ${booking.tracking_code || booking.id} is available in your account with live service status.`;
}

function buildNextAction(booking: CareBookingRow, paymentRequest: CarePaymentRequestRow | null) {
  const trackUrl = buildTrackUrl(booking);
  const payload = asRecord(paymentRequest?.payload);
  const verificationStatus = latestVerificationStatus(booking, paymentRequest).toLowerCase();
  const balanceDue = sanitizeAmount(booking.balance_due);

  if (verificationStatus === "approved" || balanceDue <= 0) {
    return {
      label: "Track live progress",
      description: "Payment is clear. Follow the current service stage and the next operational handoff.",
      href: trackUrl,
      tone: "success",
    } as const;
  }

  if (verificationStatus === "receipt_submitted" || verificationStatus === "under_review") {
    return {
      label: "Check receipt status",
      description:
        cleanText(payload?.latest_review_reason) ||
        "The payment proof is already in the verification queue.",
      href: trackUrl,
      tone: "normal",
    } as const;
  }

  return {
    label: "Pay and upload receipt",
    description:
      balanceDue > 0
        ? `Outstanding balance: ₦${balanceDue.toLocaleString()}. Upload the receipt once payment is complete.`
        : "Open the booking and confirm the current payment instructions.",
    href: trackUrl,
    tone: "warning",
  } as const;
}

function paymentSnapshot(
  booking: CareBookingRow,
  request: CarePaymentRequestRow | null
) {
  const payload = asRecord(request?.payload);
  const submissions = Array.isArray(payload?.receipt_submissions)
    ? payload?.receipt_submissions.filter(Boolean)
    : [];
  const verificationStatus = latestVerificationStatus(booking, request);

  return {
    verificationStatus,
    verificationLabel: latestVerificationLabel(verificationStatus),
    verificationMessage: latestVerificationMessage(verificationStatus, booking, payload),
    amountDue: sanitizeAmount(request?.amount_due ?? booking.balance_due),
    amountPaidRecorded: sanitizeAmount(booking.amount_paid),
    balanceDue: sanitizeAmount(booking.balance_due),
    paymentStatus: booking.payment_status,
    receiptCount: submissions.length,
    canSubmitReceipt: verificationStatus.toLowerCase() !== "approved",
    lastSubmittedAt:
      cleanText(payload?.latest_submission_at) || cleanText(payload?.last_submission_at),
    lastReviewedAt:
      cleanText(payload?.reviewed_at) || cleanText(payload?.latest_reviewed_at) || request?.paid_at || null,
    latestReviewReason:
      cleanText(payload?.latest_review_reason) || cleanText(payload?.last_review_reason),
  };
}

async function loadMappedBookingIds(userId: string) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("customer_activity")
    .select("reference_id")
    .eq("user_id", userId)
    .eq("division", "care")
    .eq("reference_type", "care_booking")
    .limit(200);

  return (data ?? [])
    .map((row) => cleanText((row as { reference_id?: string | null }).reference_id))
    .filter(Boolean) as string[];
}

async function loadBookingsByIds(ids: string[]) {
  if (ids.length === 0) {
    return [] as CareBookingRow[];
  }

  const admin = createAdminSupabase();
  const { data } = await admin
    .from("care_bookings")
    .select(
      "id, tracking_code, customer_name, email, phone, phone_normalized, service_type, item_summary, pickup_address, pickup_date, pickup_slot, status, quoted_total, amount_paid, balance_due, payment_status, created_at, updated_at"
    )
    .in("id", ids)
    .order("created_at", { ascending: false });

  return (data ?? []) as CareBookingRow[];
}

async function loadBookingsByEmail(email: string | null) {
  if (!email) {
    return [] as CareBookingRow[];
  }

  const admin = createAdminSupabase();
  const { data } = await admin
    .from("care_bookings")
    .select(
      "id, tracking_code, customer_name, email, phone, phone_normalized, service_type, item_summary, pickup_address, pickup_date, pickup_slot, status, quoted_total, amount_paid, balance_due, payment_status, created_at, updated_at"
    )
    .ilike("email", email)
    .order("created_at", { ascending: false })
    .limit(80);

  return (data ?? []) as CareBookingRow[];
}

async function loadBookingsByPhone(phone: string | null) {
  const variants = phoneSearchVariants(phone);
  if (variants.length === 0) {
    return [] as CareBookingRow[];
  }

  const admin = createAdminSupabase();
  const [normalizedResult, rawResult] = await Promise.all([
    admin
      .from("care_bookings")
      .select(
        "id, tracking_code, customer_name, email, phone, phone_normalized, service_type, item_summary, pickup_address, pickup_date, pickup_slot, status, quoted_total, amount_paid, balance_due, payment_status, created_at, updated_at"
      )
      .in("phone_normalized", variants)
      .order("created_at", { ascending: false })
      .limit(80),
    admin
      .from("care_bookings")
      .select(
        "id, tracking_code, customer_name, email, phone, phone_normalized, service_type, item_summary, pickup_address, pickup_date, pickup_slot, status, quoted_total, amount_paid, balance_due, payment_status, created_at, updated_at"
      )
      .in("phone", variants)
      .order("created_at", { ascending: false })
      .limit(80),
  ]);

  return [...((normalizedResult.data ?? []) as CareBookingRow[]), ...((rawResult.data ?? []) as CareBookingRow[])];
}

async function updateBookingContactProjection(
  booking: CareBookingRow,
  identity: CareAccountIdentity
) {
  const admin = createAdminSupabase();
  const normalizedEmail = normalizeEmail(identity.email);
  const normalizedPhone = normalizePhone(identity.phone);
  const nextEmail = normalizedEmail || normalizeEmail(booking.email);
  const nextPhone = normalizedPhone || normalizePhone(booking.phone_normalized || booking.phone);

  const needsUpdate =
    (nextEmail && nextEmail !== normalizeEmail(booking.email)) ||
    (nextPhone && nextPhone !== normalizePhone(booking.phone_normalized));

  if (!needsUpdate) {
    return;
  }

  await admin
    .from("care_bookings")
    .update({
      email: nextEmail,
      phone_normalized: nextPhone,
    } as never)
    .eq("id", booking.id);
}

async function syncCareArtifacts(identity: CareAccountIdentity, bookings: CareBookingRow[]) {
  const admin = createAdminSupabase();
  const { data: existingActivities } = await admin
    .from("customer_activity")
    .select("id, reference_id")
    .eq("user_id", identity.userId)
    .eq("division", "care")
    .eq("reference_type", "care_booking")
    .limit(200);
  const { data: existingNotifications } = await admin
    .from("customer_notifications")
    .select("id, reference_id")
    .eq("user_id", identity.userId)
    .eq("division", "care")
    .eq("reference_type", "care_booking")
    .limit(200);

  const activityIds = new Map(
    (existingActivities ?? []).map((row) => [
      cleanText((row as { reference_id?: string | null }).reference_id) || "",
      cleanText((row as { id?: string | null }).id) || "",
    ])
  );
  const notificationIds = new Map(
    (existingNotifications ?? []).map((row) => [
      cleanText((row as { reference_id?: string | null }).reference_id) || "",
      cleanText((row as { id?: string | null }).id) || "",
    ])
  );

  for (const booking of bookings) {
    const actionUrl = `/care?booking=${encodeURIComponent(booking.id)}`;
    const activityId = activityIds.get(booking.id);
    const notificationId = notificationIds.get(booking.id);
    const activityPayload = {
      title: buildActivityTitle(booking),
      description: buildActivityDescription(booking),
      status: booking.status || null,
      action_url: actionUrl,
      metadata: {
        tracking_code: booking.tracking_code,
        balance_due: sanitizeAmount(booking.balance_due),
        synced_via: "care_identity_reconciliation",
      },
    };
    const notificationPayload = {
      title: "Care booking available in your account",
      body: buildNotificationBody(booking),
      category: "general",
      priority: sanitizeAmount(booking.balance_due) > 0 ? "high" : "normal",
      action_url: actionUrl,
      action_label: "Open booking",
      division: "care",
      reference_type: "care_booking",
      reference_id: booking.id,
    };

    if (activityId) {
      await admin
        .from("customer_activity")
        .update(activityPayload as never)
        .eq("id", activityId);
    } else {
      await admin.from("customer_activity").insert({
        user_id: identity.userId,
        division: "care",
        activity_type: "care_booking",
        reference_type: "care_booking",
        reference_id: booking.id,
        ...activityPayload,
      } as never);
    }

    if (notificationId) {
      await admin
        .from("customer_notifications")
        .update(notificationPayload as never)
        .eq("id", notificationId);
    } else {
      await admin.from("customer_notifications").insert({
        user_id: identity.userId,
        ...notificationPayload,
      } as never);
    }
  }
}

async function upsertCustomerProfileProjection(identity: CareAccountIdentity) {
  const admin = createAdminSupabase();
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    id: identity.userId,
    last_seen_at: now,
    updated_at: now,
    is_active: true,
  };

  const normalizedEmail = normalizeEmail(identity.email);
  const normalizedPhone = normalizePhone(identity.phone);
  const fullName = cleanText(identity.fullName);

  if (normalizedEmail) payload.email = normalizedEmail;
  if (normalizedPhone) payload.phone = normalizedPhone;
  if (fullName) payload.full_name = fullName;

  await admin.from("customer_profiles").upsert(payload as never, {
    onConflict: "id",
  });
}

async function loadLatestPaymentRequests(bookingIds: string[]) {
  if (bookingIds.length === 0) {
    return new Map<string, CarePaymentRequestRow>();
  }

  const admin = createAdminSupabase();
  const { data } = await admin
    .from("care_payment_requests")
    .select("id, booking_id, request_kind, amount_due, status, requested_at, sent_at, paid_at, payload")
    .in("booking_id", bookingIds)
    .order("created_at", { ascending: false });

  const latestByBooking = new Map<string, CarePaymentRequestRow>();
  for (const row of (data ?? []) as CarePaymentRequestRow[]) {
    if (!row.booking_id || latestByBooking.has(row.booking_id)) {
      continue;
    }

    latestByBooking.set(row.booking_id, row);
  }

  return latestByBooking;
}

/**
 * Read-only match for dashboard views — no per-booking writes (those blocked Care page TTFB).
 */
async function findMatchedCareBookings(identity: CareAccountIdentity): Promise<CareBookingRow[]> {
  const normalizedEmail = normalizeEmail(identity.email);
  const normalizedPhone = normalizePhone(identity.phone);
  const [mappedIds, bookingsByEmail, bookingsByPhone] = await Promise.all([
    loadMappedBookingIds(identity.userId),
    loadBookingsByEmail(normalizedEmail),
    loadBookingsByPhone(normalizedPhone),
  ]);
  const mappedBookings = await loadBookingsByIds(mappedIds);

  const bookingsById = new Map<string, CareBookingRow>();
  for (const booking of [...mappedBookings, ...bookingsByEmail, ...bookingsByPhone]) {
    bookingsById.set(booking.id, booking);
  }

  return [...bookingsById.values()]
    .filter((booking) => {
      if (mappedIds.includes(booking.id)) {
        return true;
      }

      return (
        emailsMatch(booking.email, normalizedEmail) ||
        phonesMatch(booking.phone_normalized || booking.phone, normalizedPhone)
      );
    })
    .sort(
      (left, right) =>
        new Date(right.updated_at || right.created_at || 0).getTime() -
        new Date(left.updated_at || left.created_at || 0).getTime()
    );
}

async function applyCareBookingLinkSideEffects(
  identity: CareAccountIdentity,
  matchedBookings: CareBookingRow[]
) {
  await upsertCustomerProfileProjection(identity);
  for (const booking of matchedBookings) {
    await updateBookingContactProjection(booking, identity);
  }
  await syncCareArtifacts(identity, matchedBookings);
}

async function resolveLinkedCareBookings(identity: CareAccountIdentity) {
  const matchedBookings = await findMatchedCareBookings(identity);
  await applyCareBookingLinkSideEffects(identity, matchedBookings);
  return matchedBookings;
}

export async function syncLinkedCareBookingsForUser(identity: CareAccountIdentity) {
  await resolveLinkedCareBookings(identity);
}

/** Runs after the response is sent so account navigation is not blocked by Care linkage work. */
export function scheduleLinkedCareBookingsSync(identity: CareAccountIdentity) {
  after(() => {
    void syncLinkedCareBookingsForUser(identity).catch((error) => {
      console.error("[henryco/account] Deferred care booking sync failed:", error);
    });
  });
}

function buildLinkedCareBookings(
  matchedBookings: CareBookingRow[],
  paymentRequests: Map<string, CarePaymentRequestRow>
): LinkedCareBooking[] {
  return matchedBookings.map((booking) => {
    const paymentRequest = paymentRequests.get(booking.id) ?? null;
    return {
      ...booking,
      trackUrl: buildTrackUrl(booking),
      reviewUrl: buildReviewUrl(booking),
      payment: paymentSnapshot(booking, paymentRequest),
      nextAction: buildNextAction(booking, paymentRequest),
    } satisfies LinkedCareBooking;
  });
}

function scheduleCareLinkageWrites(identity: CareAccountIdentity, matchedBookings: CareBookingRow[]) {
  after(() => {
    void applyCareBookingLinkSideEffects(identity, matchedBookings).catch((error) => {
      console.error("[henryco/account] Deferred care linkage writes failed:", error);
    });
  });
}

export async function listLinkedCareBookingsForUser(identity: CareAccountIdentity) {
  const matchedBookings = await findMatchedCareBookings(identity);
  scheduleCareLinkageWrites(identity, matchedBookings);

  const paymentRequests = await loadLatestPaymentRequests(matchedBookings.map((booking) => booking.id));

  return buildLinkedCareBookings(matchedBookings, paymentRequests);
}

export async function listLinkedCarePaymentsForUser(identity: CareAccountIdentity) {
  const matchedBookings = await findMatchedCareBookings(identity);
  scheduleCareLinkageWrites(identity, matchedBookings);

  if (matchedBookings.length === 0) {
    return [] as Array<Record<string, unknown>>;
  }

  const paymentRequests = await loadLatestPaymentRequests(matchedBookings.map((booking) => booking.id));
  const bookings = buildLinkedCareBookings(matchedBookings, paymentRequests);

  const admin = createAdminSupabase();
  const bookingIds = bookings.map((booking) => booking.id);
  const bookingById = new Map(bookings.map((booking) => [booking.id, booking]));
  const { data } = await admin
    .from("care_payments")
    .select("id, booking_id, payment_no, amount, payment_method, reference, notes, received_by, created_at, division")
    .in("booking_id", bookingIds)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    ...row,
    booking: bookingById.get(String((row as { booking_id?: string | null }).booking_id || "")) || null,
  }));
}
