import "server-only";

import { getCareSettings } from "@/lib/care-data";

function normalizeOriginCandidate(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const normalized = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;

  try {
    const url = new URL(normalized);
    url.pathname = "";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export async function getCarePublicOrigin() {
  const settings = await getCareSettings();
  const baseDomain = String(process.env.NEXT_PUBLIC_BASE_DOMAIN || "").trim();

  return (
    normalizeOriginCandidate(settings.public_site_url) ||
    normalizeOriginCandidate(settings.care_domain) ||
    (baseDomain ? normalizeOriginCandidate(`care.${baseDomain}`) : null) ||
    "https://care-bice.vercel.app"
  );
}

export async function buildCarePublicUrl(
  path: string,
  params?: Record<string, string | null | undefined>
) {
  const origin = await getCarePublicOrigin();
  const url = new URL(path.startsWith("/") ? path : `/${path}`, origin);

  for (const [key, value] of Object.entries(params ?? {})) {
    if (typeof value === "string" && value.trim()) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}
