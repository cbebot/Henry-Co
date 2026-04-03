import { NextResponse } from "next/server";
import { uploadCareReceiptAsset } from "@/lib/cloudinary";
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
      const uploaded = await uploadCareReceiptAsset(receipt, {
        folderSuffix: "payment-receipts",
        publicIdPrefix: trackingCode,
      });

      uploadedAttachment = {
        url: uploaded.secureUrl,
        publicId: uploaded.publicId,
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

    return NextResponse.json({
      ok: true,
      duplicate: result.duplicate,
      requestId: result.requestId,
      bookingId: result.bookingId,
      snapshot: result.snapshot,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "The payment proof could not be submitted.",
      },
      { status: 400 }
    );
  }
}
