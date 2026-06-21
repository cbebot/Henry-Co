/**
 * V3-73 — Studio Project Suite: safe remote-asset streaming for the gated
 * final-file download. Mirrors the SSRF allowlist of /api/portal/download but is
 * only ever reached AFTER a valid short-lived asset grant + payment re-check, so
 * the raw Cloudinary URL is never handed to the client.
 */
const ALLOWED_HOSTS = new Set<string>([
  "res.cloudinary.com",
  "rzkbgwuznmdxnnhmjazy.supabase.co",
]);

const ALLOWED_HOST_SUFFIXES = [".cloudinary.com", ".supabase.co"];

export function isAllowedRemoteUrl(
  raw: string,
): { ok: true; url: URL } | { ok: false; reason: string } {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }
  if (parsed.protocol !== "https:") return { ok: false, reason: "non_https" };
  const host = parsed.hostname.toLowerCase();
  if (ALLOWED_HOSTS.has(host)) return { ok: true, url: parsed };
  if (ALLOWED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    return { ok: true, url: parsed };
  }
  return { ok: false, reason: "host_not_allowed" };
}

export function sanitiseFilename(raw: string | null, urlPath: string): string {
  const fromUrl = decodeURIComponent(urlPath.split("/").pop() || "").trim();
  const candidate = (raw && raw.trim()) || fromUrl || "download";
  const safe = candidate.replace(/[\\/\r\n"\t]+/g, "_").slice(0, 200);
  return safe.length > 0 ? safe : "download";
}

/** Fetch a validated remote URL and re-stream it as a forced attachment. */
export async function streamRemoteAttachment(
  rawUrl: string,
  filename: string | null,
): Promise<Response> {
  const validation = isAllowedRemoteUrl(rawUrl);
  if (!validation.ok) {
    return new Response(JSON.stringify({ error: validation.reason }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let upstream: Response;
  try {
    upstream = await fetch(validation.url.toString(), { next: { revalidate: 60 }, headers: {} });
  } catch {
    return new Response(JSON.stringify({ error: "fetch_failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!upstream.ok || !upstream.body) {
    return new Response(JSON.stringify({ error: "upstream_status", status: upstream.status }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const safeName = sanitiseFilename(filename, validation.url.pathname);
  const contentType = upstream.headers.get("content-type") || "application/octet-stream";
  const contentLength = upstream.headers.get("content-length");
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
    // Final files are payment-gated + viewer-bound — never cache shared.
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
  if (contentLength) headers["Content-Length"] = contentLength;

  return new Response(upstream.body, { status: 200, headers });
}
