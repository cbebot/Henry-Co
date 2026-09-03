import { NextResponse } from "next/server";
import { uploadCarePaymentReceipt } from "@/lib/care-media-store";
import { submitPaymentProof } from "@/lib/payments/verification";

export const runtime = "nodejs";

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function cleanNumber(value: unknown) {
  const normalized = Number(value ?? null);
  return Number.isFinite(normalized) ? normalized : null;
}

export async function POST(request: Request) {
  try {
    const contentType = String(request.headers.get("content-type") || "").toLowerCase();
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        {
          ok: false,
          error: "Receipt submissions must be sent as multipart form data.",
        },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const trackingCode = cleanText(formData.get("tracking_code")).toUpperCase();
    const phone = cleanText(formData.get("phone"));
    const payerName = cleanText(formData.get("payer_name"));
    const amountPaid = cleanNumber(formData.get("amount_paid"));
    const paymentReference = cleanText(formData.get("payment_reference"));
    const paidAt = cleanText(formData.get("paid_at"));
    const note = cleanText(formData.get("note"));
    const receipt = formData.get("receipt");

    if (!trackingCode || !phone || !payerName || amountPaid == null || !paidAt) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Tracking code, booking phone, payer name, amount paid, and payment time are required.",
        },
        { status: 400 }
      );
    }

    let uploadedAttachment:
      | {
          url: string;
          publicId: string | null;
          fileName: string | null;
          mimeType: string | null;
          sizeBytes: number | null;
          kind: "image" | "pdf" | "file";
        }
      | null = null;

    if (receipt instanceof File && receipt.size > 0) {
      // SENSITIVE: the bank-transfer receipt now lands in the RLS-private
      // care-documents bucket as a `media://private/...` reference (signed at
      // read time) instead of a publicly dereferenceable CDN URL. The
      // attachment record shape and every monetary field below are unchanged —
      // only the stored `url` is now a media reference rather than a public URL.
      const ref = await uploadCarePaymentReceipt(receipt, trackingCode);

      uploadedAttachment = {
        url: ref,
        publicId: null,
        fileName: receipt.name || null,
        mimeType: receipt.type || null,
        sizeBytes: receipt.size || null,
        kind:
          receipt.type === "application/pdf"
            ? "pdf"
            : receipt.type.startsWith("image/")
              ? "image"
              : "file",
      };
    }

    const result = await submitPaymentProof({
      trackingCode,
      phone,
      source: "tracking_page",
      payerName,
      amountPaid,
      paymentReference: paymentReference || null,
      paidAt,
      note: note || null,
      customerPhone: phone,
      attachments: uploadedAttachment ? [uploadedAttachment] : [],
    });

    // The proof-submit UI only needs ok/duplicate. Do not ship the internal
    // booking/request UUIDs or the full verification snapshot (payer email/
    // phone, bank reference, attachments) back over the wire.
    return NextResponse.json({
      ok: true,
      duplicate: result.duplicate,
    });
  } catch (error) {
    console.error("[care:receipt] submit failed", error);
    return NextResponse.json(
      {
        ok: false,
        error: "The payment proof could not be submitted. Please try again.",
      },
      { status: 400 }
    );
  }
}
