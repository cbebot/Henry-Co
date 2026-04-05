import "server-only";

/** Reserved / high-risk labels — we avoid suggesting these as new brands */
const BRANDISH_SLUGS = new Set(
  [
    "google",
    "apple",
    "microsoft",
    "amazon",
    "meta",
    "facebook",
    "instagram",
    "whatsapp",
    "netflix",
    "spotify",
    "uber",
    "stripe",
    "paypal",
    "henryco",
    "henry",
    "nike",
    "adidas",
    "tesla",
    "openai",
    "chatgpt",
  ].map((s) => s.toLowerCase())
);

export function slugifyDomainLabel(raw: string) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split(/[/?#]/)[0]
    .replace(/\.(com|io|app|co|dev|net|org|ng|com\.ng)$/i, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function isBlockedBrandishSlug(sld: string) {
  const s = sld.toLowerCase();
  if (s.length < 3) return true;
  if (BRANDISH_SLUGS.has(s)) return true;
  for (const b of BRANDISH_SLUGS) {
    if (s.includes(b) && b.length >= 5) return true;
  }
  return false;
}

/**
 * Thoughtful alternates — not live WHOIS; copy makes clear these are ideas for discussion.
 */
export function suggestProfessionalDomains(sld: string): string[] {
  const base = slugifyDomainLabel(sld);
  if (!base || isBlockedBrandishSlug(base)) return [];

  const tlds = [".com", ".io", ".app", ".net"] as const;
  const out: string[] = [];

  for (const tld of tlds) {
    out.push(`${base}${tld}`);
  }
  if (base.length > 8) {
    const short = base.slice(0, 8).replace(/-$/, "");
    if (short.length >= 4 && !isBlockedBrandishSlug(short)) {
      out.push(`${short}.com`);
    }
  }
  const prefixed = [`get${base}`, `my${base}`, `${base}hq`, `${base}group`];
  for (const p of prefixed) {
    if (p.length <= 32 && !isBlockedBrandishSlug(p)) out.push(`${p}.com`);
  }

  return [...new Set(out)].slice(0, 8);
}

export function normalizeFqdnForLookup(input: string): string | null {
  const trimmed = String(input || "").trim().toLowerCase();
  if (!trimmed) return null;
  const noProto = trimmed.replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(noProto)) {
    return null;
  }
  return noProto;
}

export type DomainLookupMode = "off" | "rdap_com";

export function getDomainLookupMode(): DomainLookupMode {
  const v = String(process.env.STUDIO_DOMAIN_RDAP_ENABLED || "").toLowerCase();
  if (v === "1" || v === "true" || v === "yes") return "rdap_com";
  return "off";
}

/**
 * Verisign RDAP for .COM — returns `true` likely available, `false` registered, `null` inconclusive.
 * Do not treat as legal guarantee of registrability.
 */
export async function lookupComDomainAvailability(fqdn: string): Promise<boolean | null> {
  const normalized = normalizeFqdnForLookup(fqdn);
  if (!normalized || !normalized.endsWith(".com")) return null;

  const labels = normalized.split(".");
  if (labels.length !== 2 || labels[1] !== "com") return null;
  const sld = labels[0];
  if (!sld || sld.length < 2) return null;

  try {
    const url = `https://rdap.verisign.com/com/v1/domain/${encodeURIComponent(sld.toUpperCase())}.COM`;
    const res = await fetch(url, {
      method: "GET",
      headers: { accept: "application/rdap+json, application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (res.status === 404) return true;
    if (res.ok) return false;
    return null;
  } catch {
    return null;
  }
}
