import { NextResponse, type NextRequest } from "next/server";
import { getClientPortalViewer } from "@/lib/portal/auth";
import { isAllowedRemoteUrl } from "@/lib/portal/download-allowlist";

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
 *   - The remote URL is validated against an EXACT-host allowlist of
 *     trusted hosts (see @/lib/portal/download-allowlist) — pinned hosts
 *     only, no broad suffix matching — to prevent SSRF / using the route
 *     as an open proxy.
 *   - The upstream fetch is bounded by a timeout (slow-origin DoS) and a
 *     Content-Length cap (oversized-payload relay).
 *   - Filename is sanitised (no path traversal, no header injection).
 */

// Bound the upstream connection / time-to-first-byte so a slow or hung
// origin can't pin a request open indefinitely. The body stream is not
// killed once headers arrive.
const FETCH_TIMEOUT_MS = 15_000;
// Hard ceiling on the relayed payload so the proxy can't be used to stream
// arbitrarily large files through the app server. Studio deliverables are
// documents / images, comfortably under this.
const MAX_DOWNLOAD_BYTES = 100 * 1024 * 1024; // 100 MB

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
  // Bound time-to-first-byte only; cleared once headers arrive so the body
  // stream itself is never aborted mid-transfer.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    upstream = await fetch(validation.url.toString(), {
      // Cache GETs at the edge for 5 minutes — same file rarely changes.
      next: { revalidate: 300 },
      // Don't forward viewer cookies upstream; the source hosts use
      // their own auth (signed URL or public).
      headers: {},
      signal: controller.signal,
    });
  } catch {
    return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }

  if (!upstream.ok || !upstream.body) {
    console.error("[studio] portal download upstream failure:", upstream.status);
    return NextResponse.json(
      { error: "This file could not be downloaded right now. Please try again from your project workspace." },
      { status: 502 },
    );
  }

  const filename = sanitiseFilename(filenameParam, validation.url.pathname);
  const contentType = upstream.headers.get("content-type") || "application/octet-stream";
  const contentLength = upstream.headers.get("content-length");

  // Reject oversized payloads up front when the origin advertises a size.
  if (contentLength && Number(contentLength) > MAX_DOWNLOAD_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }

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
