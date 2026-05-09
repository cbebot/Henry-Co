import { NextResponse } from "next/server";
import { createSupportThread } from "@/lib/support/data";
import {
  normalizeSupportContactMethod,
  normalizeSupportServiceCategory,
  normalizeSupportUrgency,
} from "@/lib/support/shared";
import {
  checkContactRate,
  extractClientIp,
} from "@/lib/support/contact-rate-limit";

export const runtime = "nodejs";

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: Request) {
  // V5-3 B4: rate-limit care contact submissions (5 per 60s per IP).
  const ip = extractClientIp(req.headers);
  const rate = checkContactRate(ip || "");
  if (!rate.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Too many contact submissions from this network. Please try again in a moment.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      },
    );
  }

  try {
    const contentType = String(req.headers.get("content-type") || "").toLowerCase();
    let payload: Record<string, unknown> = {};

    if (contentType.includes("application/json")) {
      payload = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    } else {
      const formData = await req.formData();
      payload = Object.fromEntries(formData.entries());
    }

    const fullName = cleanText(payload.full_name);
    const email = cleanText(payload.email).toLowerCase();
    const phone = cleanText(payload.phone);
    const subject = cleanText(payload.subject);
    const message = cleanText(payload.message);
    const trackingCode = cleanText(payload.tracking_code).toUpperCase();
    const preferredContactMethod = normalizeSupportContactMethod(
      cleanText(payload.preferred_contact_method)
    );
    const serviceCategory = normalizeSupportServiceCategory(cleanText(payload.service_category));
    const urgency = normalizeSupportUrgency(cleanText(payload.urgency));

    if (fullName.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Please enter your full name." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if ((preferredContactMethod === "phone" || preferredContactMethod === "whatsapp") && phone.length < 7) {
      return NextResponse.json(
        { ok: false, error: "Please add a phone number for the selected contact route." },
        { status: 400 }
      );
    }

    if (subject.length < 4 || message.length < 16) {
      return NextResponse.json(
        {
          ok: false,
          error: "Please include a clear subject and enough detail for support to respond accurately.",
        },
        { status: 400 }
      );
    }

    const result = await createSupportThread({
      fullName,
      email,
      phone: phone || null,
      preferredContactMethod,
      serviceCategory,
      urgency,
      subject,
      message,
      trackingCode: trackingCode || null,
    });

    return NextResponse.json({
      ok: true,
      threadRef: result.threadRef,
      receiptStatus: result.receiptStatus,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "The contact message could not be saved.",
      },
      { status: 500 }
    );
  }
}
