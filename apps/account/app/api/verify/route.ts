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
import { submitVerificationDocument } from "@/lib/verification";

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
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const formData = await request.formData();
    const documentType = String(formData.get("document_type") || "").trim();
    const file = formData.get("file") as File | null;

    if (!VALID_DOC_TYPES.has(documentType)) {
      return NextResponse.redirect(
        new URL("/verify?error=invalid_type", request.url)
      );
    }

    if (!file || file.size <= 0) {
      return NextResponse.redirect(
        new URL("/verify?error=no_file", request.url)
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.redirect(
        new URL("/verify?error=too_large", request.url)
      );
    }

    if (!ALLOWED_TYPES.has(file.type.toLowerCase())) {
      return NextResponse.redirect(
        new URL("/verify?error=invalid_format", request.url)
      );
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

    // Link the document to the verification submission.
    await submitVerificationDocument(user.id, {
      documentType,
      documentId: docRecord?.id || "",
    });

    return NextResponse.redirect(
      new URL("/verify?submitted=true", request.url)
    );
  } catch (err) {
    console.error("[verify] Upload error:", err);
    return NextResponse.redirect(
      new URL("/verify?error=upload_failed", request.url)
    );
  }
}
