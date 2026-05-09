import { NextResponse } from "next/server";
import { getAccountUser } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * Same-origin download proxy for customer_documents rows.
 *
 * Why this exists:
 *   - Most files in customer_documents.file_url are cross-origin (Cloudinary,
 *     Supabase Storage). Browsers ignore the `download` attribute on
 *     <a href="..."> for cross-origin URLs, so clicking the download button
 *     just *opens* the file in a new tab instead of saving it. That is the
 *     "download is not working" report.
 *   - Routing through a same-origin endpoint:
 *       1. Forces browsers to honour `download="<filename>"`.
 *       2. Lets us auth-gate (a doc must belong to the requester).
 *       3. Hides the raw upstream URL.
 *       4. Returns a clean error message when the upstream is missing.
 *
 * Behaviour:
 *   - 401 if no signed-in account user.
 *   - 404 if the document doesn't belong to the viewer or has been deleted.
 *   - 502 if the upstream fetch fails.
 *   - 200 with Content-Type from upstream (or sane default) and
 *     Content-Disposition: attachment; filename="<safe-name>".
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeFilename(name: string, mimeType: string | null) {
  const baseRaw = (name || "document").trim();
  const base = baseRaw.replace(/[^\w\s.\-()]+/g, "_").slice(0, 120) || "document";
  if (/\.[A-Za-z0-9]{2,5}$/.test(base)) return base;
  const ext =
    mimeType?.toLowerCase() === "application/pdf"
      ? ".pdf"
      : mimeType?.toLowerCase().startsWith("image/")
        ? "." + (mimeType.split("/")[1]?.split(";")[0] || "bin")
        : "";
  return `${base}${ext}`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const documentId = (params?.id || "").trim();
  if (!documentId) {
    return NextResponse.json(
      { error: "missing_id", message: "Missing document id." },
      { status: 400 },
    );
  }

  const user = await getAccountUser();
  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", message: "Sign in to download documents." },
      { status: 401 },
    );
  }

  const admin = createAdminSupabase();
  const { data: doc, error } = await admin
    .from("customer_documents")
    .select("id, user_id, name, file_url, mime_type, deleted_at, archived_at")
    .eq("id", documentId)
    .maybeSingle();

  if (error || !doc) {
    return NextResponse.json(
      { error: "not_found", message: "Document not found." },
      { status: 404 },
    );
  }

  const row = doc as Record<string, unknown>;

  if (
    typeof row.user_id !== "string" ||
    row.user_id !== user.id ||
    row.deleted_at !== null
  ) {
    return NextResponse.json(
      { error: "not_found", message: "Document not found." },
      { status: 404 },
    );
  }

  const fileUrl =
    typeof row.file_url === "string" && row.file_url.trim()
      ? row.file_url.trim()
      : null;
  if (!fileUrl) {
    return NextResponse.json(
      {
        error: "no_file",
        message: "This document does not have a downloadable file attached.",
      },
      { status: 410 },
    );
  }

  // Refuse anything that isn't HTTPS — defence-in-depth against an
  // accidental upstream that points at internal infrastructure.
  let parsed: URL;
  try {
    parsed = new URL(fileUrl);
  } catch {
    return NextResponse.json(
      { error: "bad_upstream", message: "Document source is unavailable." },
      { status: 502 },
    );
  }
  if (parsed.protocol !== "https:") {
    return NextResponse.json(
      { error: "bad_upstream", message: "Document source is unavailable." },
      { status: 502 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(parsed.toString(), {
      method: "GET",
      // No credentials — these are public delivery URLs.
      redirect: "follow",
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "fetch_failed", message: "Could not retrieve the document." },
      { status: 502 },
    );
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: "fetch_failed", message: "Could not retrieve the document." },
      { status: 502 },
    );
  }

  const upstreamMime =
    upstream.headers.get("content-type") ||
    (typeof row.mime_type === "string" ? row.mime_type : null) ||
    "application/octet-stream";
  const upstreamLength = upstream.headers.get("content-length");
  const filename = safeFilename(
    typeof row.name === "string" ? row.name : "document",
    typeof row.mime_type === "string" ? row.mime_type : null,
  );

  // RFC 5987 filename* — properly encoded for non-ASCII names.
  const encoded = encodeURIComponent(filename);
  const disposition = `attachment; filename="${filename.replace(/"/g, "")}"; filename*=UTF-8''${encoded}`;

  const responseHeaders: Record<string, string> = {
    "Content-Type": upstreamMime,
    "Content-Disposition": disposition,
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  };
  if (upstreamLength) responseHeaders["Content-Length"] = upstreamLength;

  return new NextResponse(upstream.body, {
    status: 200,
    headers: responseHeaders,
  });
}
