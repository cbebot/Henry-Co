import { NextResponse, type NextRequest } from "next/server";
import { getAccountUser } from "@/lib/auth";

/**
 * /api/proxy/download — generic same-origin download proxy for the
 * account app. Same role as studio's /api/portal/download — it lets
 * us route cross-origin asset URLs (Cloudinary, Supabase Storage)
 * through the account origin so the browser honours the `download`
 * attribute and saves the file instead of opening it in a new tab.
 *
 * Why a NEW route in account (separate from
 * /api/documents/file/[id]):
 *
 *   - The /api/documents/file/[id] route is row-driven — it looks up a
 *     customer_documents row by ID and validates ownership. That works
 *     for the documents page, but not for ad-hoc URLs like support
 *     thread attachments, learn certificates, marketplace order
 *     receipts, etc., which don't live in customer_documents.
 *   - This route accepts an arbitrary URL via ?u=... and validates it
 *     against a tight host allowlist (Cloudinary + Supabase storage),
 *     so it can serve any trusted asset reference without each callsite
 *     having to provision its own auth gate.
 *
 * Security:
 *   - Caller must be a signed-in account user.
 *   - The remote URL is validated against an allowlist of trusted hosts.
 *   - Filename is sanitised (no path traversal, no header injection).
 *   - Force HTTPS upstream.
 *   - No request credentials forwarded (asset hosts use their own auth).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_HOST_SUFFIXES = [".cloudinary.com", ".supabase.co"];
const ALLOWED_HOSTS = new Set<string>(["res.cloudinary.com"]);

function isAllowedRemoteUrl(raw: string): { ok: true; url: URL } | { ok: false; reason: string } {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }
  if (parsed.protocol !== "https:") {
    return { ok: false, reason: "non_https" };
  }
  const host = parsed.hostname.toLowerCase();
  if (ALLOWED_HOSTS.has(host)) return { ok: true, url: parsed };
  if (ALLOWED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    return { ok: true, url: parsed };
  }
  return { ok: false, reason: "host_not_allowed" };
}

function sanitiseFilename(raw: string | null, urlPath: string): string {
  const fromUrl = decodeURIComponent(urlPath.split("/").pop() || "").trim();
  const candidate = (raw && raw.trim()) || fromUrl || "download";
  const safe = candidate.replace(/[\\/\r\n"\t]+/g, "_").slice(0, 200);
  return safe.length > 0 ? safe : "download";
}

export async function GET(request: NextRequest) {
  const user = await getAccountUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const sourceParam = request.nextUrl.searchParams.get("u");
  const filenameParam = request.nextUrl.searchParams.get("n");
  if (!sourceParam) {
    return NextResponse.json({ error: "missing_url" }, { status: 400 });
  }

  const validation = isAllowedRemoteUrl(sourceParam);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.reason }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(validation.url.toString(), {
      method: "GET",
      next: { revalidate: 300 },
      redirect: "follow",
      headers: {},
    });
  } catch {
    return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "upstream_status", status: upstream.status }, { status: 502 });
  }

  const filename = sanitiseFilename(filenameParam, validation.url.pathname);
  const contentType = upstream.headers.get("content-type") || "application/octet-stream";
  const contentLength = upstream.headers.get("content-length");

  const headers: Record<string, string> = {
    "Content-Type": contentType,
    // RFC 6266: filename* (UTF-8) + filename (ASCII) for compatibility.
    "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    "Cache-Control": "private, max-age=300",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  };
  if (contentLength) headers["Content-Length"] = contentLength;

  return new Response(upstream.body, {
    status: 200,
    headers,
  });
}
