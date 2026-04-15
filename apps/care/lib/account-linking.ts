import "server-only";

import { buildCanonicalActivityMetadata } from "@henryco/intelligence";
import { createAdminSupabase } from "@/lib/supabase";
import { normalizeEmail, normalizePhone } from "@henryco/config";

type BookingLinkRecord = {
  id: string;
  tracking_code: string;
  customer_name: string;
  service_type: string;
  pickup_date: string | null;
  pickup_slot: string | null;
  status: string | null;
  balance_due: number | null;
};

type EnsureCareBookingAccountLinkInput = {
  userId: string;
  email?: string | null;
  fullName?: string | null;
  phone?: string | null;
  booking: BookingLinkRecord;
  source: "authenticated_booking" | "account_reconciliation";
};

function buildBookingActionUrl(bookingId: string) {
  return `/care?booking=${encodeURIComponent(bookingId)}`;
}

function buildActivitySummary(booking: BookingLinkRecord) {
  const dateSummary = booking.pickup_date
    ? `${booking.pickup_date}${booking.pickup_slot ? ` • ${booking.pickup_slot}` : ""}`
    : "Schedule to be confirmed";

  return `${booking.service_type} • ${dateSummary}`;
}

function buildNotificationBody(booking: BookingLinkRecord) {
  const balanceDue = Number(booking.balance_due || 0);

  if (balanceDue > 0) {
    return `Tracking ${booking.tracking_code} is linked to your account. Outstanding balance: ₦${balanceDue.toLocaleString()}.`;
  }

  return `Tracking ${booking.tracking_code} is linked to your account and ready for live status follow-up.`;
}

export async function ensureCustomerProfileProjection(input: {
  userId: string;
  email?: string | null;
  fullName?: string | null;
  phone?: string | null;
}) {
  const supabase = createAdminSupabase();
  const normalizedEmail = normalizeEmail(input.email);
  const normalizedPhone = normalizePhone(input.phone);
  const now = new Date().toISOString();
  const fullName = String(input.fullName || "").trim();
  const payload: Record<string, unknown> = {
    id: input.userId,
    last_seen_at: now,
    updated_at: now,
    is_active: true,
  };

  if (normalizedEmail) payload.email = normalizedEmail;
  if (normalizedPhone) payload.phone = normalizedPhone;
  if (fullName) payload.full_name = fullName;

  await supabase.from("customer_profiles").upsert(
    payload as never,
    { onConflict: "id" }
  );
}

export async function ensureCareBookingAccountLink(
  input: EnsureCareBookingAccountLinkInput
) {
  const supabase = createAdminSupabase();
  await ensureCustomerProfileProjection(input);
  const normalizedEmail = normalizeEmail(input.email);
  const normalizedPhone = normalizePhone(input.phone);

  try {
    await supabase
      .from("care_bookings")
      .update({
        customer_id: input.userId,
        email: normalizedEmail || undefined,
        phone_normalized: normalizedPhone || undefined,
      } as never)
      .eq("id", input.booking.id);
  } catch {
    // Avoid blocking booking creation if a partially provisioned environment
    // is still missing one of the newer linkage columns.
  }

  const activityTitle =
    input.source === "authenticated_booking"
      ? `Care booking confirmed • ${input.booking.tracking_code}`
      : `Care booking linked • ${input.booking.tracking_code}`;
  const actionUrl = buildBookingActionUrl(input.booking.id);

  const { data: existingActivity } = await supabase
    .from("customer_activity")
    .select("id")
    .eq("user_id", input.userId)
    .eq("division", "care")
    .eq("reference_type", "care_booking")
    .eq("reference_id", input.booking.id)
    .maybeSingle();

  if (existingActivity?.id) {
    await supabase
      .from("customer_activity")
      .update({
        title: activityTitle,
        description: buildActivitySummary(input.booking),
        status: input.booking.status || null,
        action_url: actionUrl,
        metadata: buildCanonicalActivityMetadata({
          division: "care",
          activityType: "care_booking",
          status: input.booking.status,
          referenceType: "care_booking",
          referenceId: input.booking.id,
          metadata: {
            tracking_code: input.booking.tracking_code,
            source: input.source,
            balance_due: Number(input.booking.balance_due || 0),
          },
        }),
      } as never)
      .eq("id", existingActivity.id);
  } else {
    await supabase.from("customer_activity").insert({
      user_id: input.userId,
      division: "care",
      activity_type: "care_booking",
      title: activityTitle,
      description: buildActivitySummary(input.booking),
      status: input.booking.status || null,
      reference_type: "care_booking",
      reference_id: input.booking.id,
      action_url: actionUrl,
      metadata: buildCanonicalActivityMetadata({
        division: "care",
        activityType: "care_booking",
        status: input.booking.status,
        referenceType: "care_booking",
        referenceId: input.booking.id,
        metadata: {
          tracking_code: input.booking.tracking_code,
          source: input.source,
          balance_due: Number(input.booking.balance_due || 0),
        },
      }),
    } as never);
  }

  const { data: existingNotification } = await supabase
    .from("customer_notifications")
    .select("id")
    .eq("user_id", input.userId)
    .eq("division", "care")
    .eq("reference_type", "care_booking")
    .eq("reference_id", input.booking.id)
    .maybeSingle();

  const notificationPayload = {
    title:
      input.source === "authenticated_booking"
        ? "Care booking is in your account"
        : "Existing Care booking linked",
    body: buildNotificationBody(input.booking),
    category: "general",
    priority: Number(input.booking.balance_due || 0) > 0 ? "high" : "normal",
    action_url: actionUrl,
    action_label: "Open booking",
    division: "care",
    reference_type: "care_booking",
    reference_id: input.booking.id,
  };

  if (existingNotification?.id) {
    await supabase
      .from("customer_notifications")
      .update(notificationPayload as never)
      .eq("id", existingNotification.id);
  } else {
    await supabase.from("customer_notifications").insert({
      user_id: input.userId,
      ...notificationPayload,
    } as never);
  }
}
