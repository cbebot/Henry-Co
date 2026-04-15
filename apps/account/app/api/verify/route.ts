import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  buildSharedCookieHandlers,
  buildSupabaseCookieOptions,
  resolveRequestCookieDomain,
} from "@henryco/config";
import { uploadOwnedAsset } from "@/lib/cloudinary";
import { createAdminSupabase } from "@/lib/supabase";
import {
  getDocumentTypeLabel,
  getVerificationState,
  submitVerificationDocument,
} from "@/lib/verification";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const VALID_DOC_TYPES = new Set([
  "government_id",
  "selfie",
  "address_proof",
  "business_cert",
]);

function wantsJson(request: Request) {
  return (
    request.headers.get("x-henryco-async") === "1" ||
    request.headers.get("accept")?.includes("application/json")
  );
}

function redirectOrJson(
  request: Request,
  input:
    | { ok: false; error: string; status: number; code: string }
    | { ok: true; payload: Record<string, unknown> }
) {
  if (wantsJson(request)) {
    if (!input.ok) {
      return NextResponse.json({ error: input.error, code: input.code }, { status: input.status });
    }
    return NextResponse.json(input.payload);
  }

  if (!input.ok) {
    return NextResponse.redirect(new URL(`/verification?error=${input.code}`, request.url));
  }

  return NextResponse.redirect(new URL("/verification?submitted=1", request.url));
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const headerStore = await headers();
    const cookieDomain = resolveRequestCookieDomain((name) => headerStore.get(name));
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: buildSupabaseCookieOptions(cookieDomain),
        cookies: buildSharedCookieHandlers(cookieStore, cookieDomain),
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      if (wantsJson(request)) {
        return NextResponse.json({ error: "Authentication required." }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const formData = await request.formData();
    const documentType = String(formData.get("document_type") || "").trim();
    const file = formData.get("file") as File | null;

    if (!VALID_DOC_TYPES.has(documentType)) {
      return redirectOrJson(request, {
        ok: false,
        error: "That document type is not supported.",
        status: 400,
        code: "invalid_type",
      });
    }

    if (!file || file.size <= 0) {
      return redirectOrJson(request, {
        ok: false,
        error: "Select a file before uploading.",
        status: 400,
        code: "no_file",
      });
    }

    if (file.size > MAX_FILE_SIZE) {
      return redirectOrJson(request, {
        ok: false,
        error: "File size must be 10 MB or less.",
        status: 400,
        code: "too_large",
      });
    }

    if (!ALLOWED_TYPES.has(file.type.toLowerCase())) {
      return redirectOrJson(request, {
        ok: false,
        error: "Upload a JPG, PNG, WebP, or PDF file.",
        status: 400,
        code: "invalid_format",
      });
    }

    // Upload to Cloudinary in a private folder.
    const upload = await uploadOwnedAsset(file, user.id, {
      folder: "verification",
      resourceType: "auto",
      maxBytes: MAX_FILE_SIZE,
      allowedTypes: ALLOWED_TYPES,
      invalidTypeMessage: "Upload a JPG, PNG, WebP, or PDF file.",
    });

    // Store the document record.
    const admin = createAdminSupabase();
    const { data: docRecord } = await admin
      .from("customer_documents")
      .insert({
        user_id: user.id,
        division: "account",
        type: "id_document",
        name: `${documentType} – ${file.name}`,
        file_url: upload.secureUrl,
        file_size: file.size,
        mime_type: file.type || "application/octet-stream",
        reference_type: "verification",
        reference_id: documentType,
        metadata: {
          public_id: upload.publicId,
          document_type: documentType,
        },
      })
      .select("id")
      .maybeSingle();

    if (!docRecord?.id) {
      throw new Error("Document record could not be created.");
    }

    // Link the document to the verification submission.
    await submitVerificationDocument(user.id, {
      documentType,
      documentId: docRecord.id,
    });

    await admin.from("customer_activity").insert({
      user_id: user.id,
      division: "account",
      activity_type: "verification_document_submitted",
      title: `${getDocumentTypeLabel(documentType)} submitted for review`,
      description: `${file.name} is now attached to your identity verification queue.`,
      status: "pending",
      reference_type: "verification_document",
      reference_id: docRecord.id,
      action_url: "/verification",
      metadata: {
        document_type: documentType,
        source: "account_verification",
      },
    } as never);

    await admin.from("customer_notifications").insert({
      user_id: user.id,
      division: "account",
      title: "Verification document received",
      body: `${getDocumentTypeLabel(documentType)} is now in the review queue.`,
      category: "verification",
      action_url: "/verification",
      reference_type: "verification_document",
      reference_id: docRecord.id,
    } as never);

    const verification = await getVerificationState(user.id);
    const submission =
      verification.submissions.find((item) => item.documentType === documentType) || null;

    if (!submission) {
      throw new Error("Verification submission could not be refreshed.");
    }

    return redirectOrJson(request, {
      ok: true,
      payload: {
        ok: true,
        message: `${getDocumentTypeLabel(documentType)} uploaded successfully.`,
        verification,
        submission,
      },
    });
  } catch (err) {
    console.error("[verify] Upload error:", err);
    return redirectOrJson(request, {
      ok: false,
      error: err instanceof Error ? err.message : "Upload failed.",
      status: 500,
      code: "upload_failed",
    });
  }
}
