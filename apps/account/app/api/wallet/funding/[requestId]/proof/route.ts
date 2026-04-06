import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { uploadOwnedAsset } from "@/lib/cloudinary";
import { ensureAccountProfileRecords } from "@/lib/account-profile";
import { LEGACY_WALLET_TRANSACTION_PENDING_STATUS } from "@/lib/wallet-storage";

type Props = {
  params: Promise<{ requestId: string }>;
};

const ALLOWED_PROOF_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export async function POST(request: Request, { params }: Props) {
  try {
    const { requestId } = await params;
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureAccountProfileRecords(user);

    const admin = createAdminSupabase();

    const { data: dedicated } = await admin
      .from("customer_wallet_funding_requests")
      .select("*")
      .eq("id", requestId)
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: legacy } = !dedicated
      ? await admin
          .from("customer_wallet_transactions")
          .select("*")
          .eq("id", requestId)
          .eq("user_id", user.id)
          .eq("reference_type", "wallet_funding_request")
          .maybeSingle()
      : { data: null };

    const record = dedicated ?? legacy;
    if (!record) {
      return NextResponse.json({ error: "Funding request not found." }, { status: 404 });
    }

    const formData = await request.formData();
    const proof = formData.get("proof") as File | null;
    if (!proof) {
      return NextResponse.json({ error: "Payment proof is required." }, { status: 400 });
    }

    const upload = await uploadOwnedAsset(proof, user.id, {
      folder: "wallet-proofs",
      resourceType: "auto",
      maxBytes: 10 * 1024 * 1024,
      allowedTypes: ALLOWED_PROOF_TYPES,
      invalidTypeMessage: "Upload a JPG, PNG, WebP, or PDF proof file.",
      publicIdPrefix: "wallet-proof",
    });

    if (dedicated) {
      const metadata = {
        ...(record.metadata && typeof record.metadata === "object" ? record.metadata : {}),
        proof_url: upload.secureUrl,
        proof_name: proof.name,
        proof_public_id: upload.publicId,
        proof_uploaded_at: new Date().toISOString(),
      };

      const { error } = await admin
        .from("customer_wallet_funding_requests")
        .update({
          proof_url: upload.secureUrl,
          proof_public_id: upload.publicId,
          proof_name: proof.name,
          metadata,
          status: "pending_verification",
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq("user_id", user.id);

      if (error) {
        return NextResponse.json({ error: "Unable to save proof. Please try again." }, { status: 500 });
      }
    } else {
      const metadata = {
        ...(record.metadata && typeof record.metadata === "object" ? record.metadata : {}),
        proof_url: upload.secureUrl,
        proof_name: proof.name,
        proof_public_id: upload.publicId,
        proof_uploaded_at: new Date().toISOString(),
      };

      const { error } = await admin
        .from("customer_wallet_transactions")
        .update({
          metadata,
          status: LEGACY_WALLET_TRANSACTION_PENDING_STATUS,
        })
        .eq("id", requestId)
        .eq("user_id", user.id);

      if (error) {
        return NextResponse.json({ error: "Unable to save proof. Please try again." }, { status: 500 });
      }
    }

    await admin.from("customer_documents").insert({
      user_id: user.id,
      division: "wallet",
      type: "payment_proof",
      name: proof.name,
      file_url: upload.secureUrl,
      file_size: proof.size,
      mime_type: proof.type || "application/octet-stream",
      reference_type: "wallet_funding_request",
      reference_id: requestId,
      metadata: {
        public_id: upload.publicId,
      },
    });

    await admin.from("customer_activity").insert({
      user_id: user.id,
      division: "wallet",
      activity_type: "wallet_funding_proof_uploaded",
      title: "Wallet proof uploaded",
      description: "HenryCo can now review your transfer against this request.",
      status: "pending_verification",
      reference_type: "wallet_funding_request",
      reference_id: requestId,
      action_url: `/wallet/funding/${requestId}`,
      metadata: {
        proof_url: upload.secureUrl,
      },
    });

    await admin.from("customer_notifications").insert({
      user_id: user.id,
      division: "wallet",
      title: "Proof received",
      body: "We have your transfer proof and will review it shortly.",
      category: "wallet",
      action_url: `/wallet/funding/${requestId}`,
    });

    return NextResponse.json({
      success: true,
      proof_url: upload.secureUrl,
      proof_name: proof.name,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to upload proof.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
