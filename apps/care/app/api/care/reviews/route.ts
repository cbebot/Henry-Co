import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { uploadCareImage } from "@/lib/cloudinary";
import { applyEffectiveBookingStatus } from "@/lib/care-runtime-overrides";
import { sendAdminNotificationEmail } from "@/lib/email/send";
import { notifyStaffRoles } from "@/lib/staff-alerts";
import { inferCareServiceFamily, isReviewEligibleStatus } from "@/lib/care-tracking";
import { normalizeCareSettings } from "@/lib/care-settings-shared";

export const runtime = "nodejs";

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error("Supabase admin env vars are missing.");
  }

  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function normalizePhone(value: string) {
  return String(value || "").replace(/\D+/g, "");
}

function parseAddressCity(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const parts = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];
  return parts[parts.length - 1];
}

export async function POST(req: Request) {
  try {
    const contentType = String(req.headers.get("content-type") || "").toLowerCase();
    let trackingCode = "";
    let phone = "";
    let rating = 0;
    let reviewText = "";
    let photoFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      trackingCode = String(formData.get("tracking_code") || "").trim().toUpperCase();
      phone = normalizePhone(String(formData.get("phone") || ""));
      rating = Number(formData.get("rating") || 0);
      reviewText = String(formData.get("review_text") || "").trim();
      const candidate = formData.get("photo");
      photoFile = candidate instanceof File && candidate.size > 0 ? candidate : null;
    } else {
      const body = await req.json();
      trackingCode = String(body.tracking_code || "").trim().toUpperCase();
      phone = normalizePhone(String(body.phone || ""));
      rating = Number(body.rating || 0);
      reviewText = String(body.review_text || "").trim();
    }

    if (!trackingCode || !phone || !reviewText || rating < 1 || rating > 5) {
      return NextResponse.json(
        { ok: false, error: "Tracking code, phone, rating, and review text are required." },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabase();
    const { data: booking, error: bookingError } = await supabase
      .from("care_bookings")
      .select(
        "id, tracking_code, customer_name, phone, phone_normalized, email, pickup_address, service_type, item_summary, status"
      )
      .eq("tracking_code", trackingCode)
      .maybeSingle();

    if (bookingError || !booking?.id) {
      return NextResponse.json(
        { ok: false, error: "That tracking code could not be verified." },
        { status: 404 }
      );
    }

    const savedPhone = normalizePhone(String(booking.phone_normalized || booking.phone || ""));
    if (!savedPhone || savedPhone !== phone) {
      return NextResponse.json(
        { ok: false, error: "The phone number does not match that booking." },
        { status: 404 }
      );
    }

    const patchedBooking = await applyEffectiveBookingStatus(booking);
    const family = inferCareServiceFamily(patchedBooking ?? booking);

    if (!isReviewEligibleStatus(family, (patchedBooking ?? booking).status)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Reviews open only after the booking reaches its completed stage.",
        },
        { status: 400 }
      );
    }

    let uploadedPhoto:
      | {
          secureUrl: string;
          publicId: string;
        }
      | null = null;

    if (photoFile) {
      try {
        uploadedPhoto = await uploadCareImage(photoFile, {
          folderSuffix: "reviews",
          publicIdPrefix: trackingCode,
        });
      } catch (error) {
        return NextResponse.json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : "Review image upload failed. Please try again.",
          },
          { status: 400 }
        );
      }
    }

    const payload = {
      customer_name: String(booking.customer_name || "Verified customer").trim(),
      city: parseAddressCity(booking.pickup_address),
      rating,
      review_text: reviewText,
      is_approved: false,
    };

    const { data: reviewRow, error } = await supabase
      .from("care_reviews")
      .insert(payload as never)
      .select("id")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }

    if (uploadedPhoto?.secureUrl && reviewRow?.id) {
      await supabase.from("care_security_logs").insert({
        event_type: "review_media_attached",
        route: "/review",
        success: true,
        email: booking.email ?? null,
        details: {
          review_id: reviewRow.id,
          booking_id: booking.id,
          tracking_code: booking.tracking_code,
          photo_url: uploadedPhoto.secureUrl,
          photo_public_id: uploadedPhoto.publicId,
        },
      } as never);
    }

    await supabase.from("care_security_logs").insert({
      event_type: "verified_review_submitted",
      route: "/review",
      success: true,
      email: booking.email ?? null,
      details: {
        booking_id: booking.id,
        tracking_code: booking.tracking_code,
        family,
        rating,
        review_id: reviewRow?.id ?? null,
        has_photo: Boolean(uploadedPhoto?.secureUrl),
      },
    } as never);

    const { data: settingsRow } = await supabase.from("care_settings").select("*").limit(1).maybeSingle();
    const settings = normalizeCareSettings((settingsRow ?? null) as Record<string, unknown> | null);
    const internalEmail =
      settings.support_email ||
      settings.payment_support_email ||
      settings.notification_reply_to_email;

    if (internalEmail) {
      await sendAdminNotificationEmail(internalEmail, {
        heading: "A verified review is awaiting approval",
        summary: "A completed booking submitted a new review and it is now waiting in the moderation queue.",
        lines: [
          `Tracking code: ${booking.tracking_code}`,
          `Customer: ${payload.customer_name}`,
          `Service: ${String(booking.service_type || "").trim() || "Service booking"}`,
          `Rating: ${rating}/5`,
          `Photo attached: ${uploadedPhoto?.secureUrl ? "Yes" : "No"}`,
        ],
      });
    }

    try {
      await notifyStaffRoles({
        roles: ["owner", "support"],
        heading: `Review moderation alert • ${booking.tracking_code}`,
        summary: "A verified customer review is waiting in the moderation queue.",
        lines: [
          `Tracking code: ${booking.tracking_code}`,
          `Customer: ${payload.customer_name}`,
          `Service: ${String(booking.service_type || "").trim() || "Service booking"}`,
          `Rating: ${rating}/5`,
          `Photo attached: ${uploadedPhoto?.secureUrl ? "Yes" : "No"}`,
        ],
      });
    } catch {
      // review submission should not fail because internal alert fanout is unavailable
    }

    return NextResponse.json({
      ok: true,
      message: "Review submitted successfully and is awaiting approval.",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
