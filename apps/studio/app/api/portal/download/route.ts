import { NextResponse, type NextRequest } from "next/server";
import { getClientPortalViewer } from "@/lib/portal/auth";

/**
 * /api/portal/download — server-proxy that forces a real attachment
 * download instead of the browser opening the file in a new tab.
 *
 * Why this exists: the legacy <a href={fileUrl} download> pattern only
 * triggers a download when the resource is **same-origin**. Studio
 * deliverable URLs come from Cloudinary (cross-origin), so the browser
 * silently ignores the `download` attribute and just navigates to the
 * file URL — which Cloudinary serves with `Content-Disposition: inline`,
 * causing PDFs/images to render in a new tab and other types to either
 * preview or do nothing useful. This is a documented browser behavior,
 * not a bug — see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#download
 *
 * The route fetches the file server-side and re-streams it back to the
 * client with the right `Content-Disposition` header, so the browser
 * always treats it as an attachment regardless of origin.
 *
 * Security:
 *   - Caller must be an authenticated portal viewer.
 *   - The remote URL is validated against an allowlist of trusted
 *     hosts (Cloudinary, Supabase storage). Anything else is rejected
 *     to prevent SSRF / using the route as an open proxy.
 *   - Filename is sanitised (no path traversal, no header injection).
 */

const ALLOWED_HOSTS = new Set<string>([
  "res.cloudinary.com",
  "rzkbgwuznmdxnnhmjazy.supabase.co",
]);

const ALLOWED_HOST_SUFFIXES = [
  ".cloudinary.com",
  ".supabase.co",
];

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
  // Strip path separators + control chars + quotes so the
  // Content-Disposition header can't be split via injection.
  const safe = candidate.replace(/[\\/\r\n"\t]+/g, "_").slice(0, 200);
  // Always end with at least one safe character.
  return safe.length > 0 ? safe : "download";
}

export async function GET(request: NextRequest) {
  const viewer = await getClientPortalViewer();
  if (!viewer) {
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
      // Cache GETs at the edge for 5 minutes — same file rarely changes.
      next: { revalidate: 300 },
      // Don't forward viewer cookies upstream; the source hosts use
      // their own auth (signed URL or public).
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
    // RFC 6266 — `filename*` form supports UTF-8 names; `filename` form
    // is the ASCII fallback for old clients. Both are safe to include.
    "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    "Cache-Control": "private, max-age=300",
    "X-Content-Type-Options": "nosniff",
  };
  if (contentLength) {
    headers["Content-Length"] = contentLength;
  }

  return new Response(upstream.body, {
    status: 200,
    headers,
  });
}
