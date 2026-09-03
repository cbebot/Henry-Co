/**
 * V3-04 (S6) — Email / campaign UTM tagging for deep links.
 *
 * Every transactional-email CTA appends UTM params so the owner-workspace
 * analytics can attribute landings to the email that drove them, and so
 * the deep-link telemetry (S8) can join arrivals back to a source.
 *
 * Survives email-client URL rewriting: UTM params live in the query
 * string of an absolute https URL, which Resend/Brevo click-tracking
 * preserves when it wraps the link (the tracker redirects to the original
 * URL including its query). We do NOT rely on fragments for attribution
 * because some trackers strip the fragment.
 */

export type UtmSource =
  | "henryco_email"
  | "henryco_notification"
  | "henryco_share"
  | "henryco_sms";

export type UtmParams = {
  source: UtmSource;
  /** Campaign / purpose, e.g. "care_booking_confirmed", "invoice_due". */
  campaign: string;
  /** Optional medium override (defaults derived from source). */
  medium?: string;
  /** Optional content slot, e.g. "cta_button" vs "footer_link". */
  content?: string;
  /** Optional term. */
  term?: string;
};

const DEFAULT_MEDIUM: Record<UtmSource, string> = {
  henryco_email: "email",
  henryco_notification: "in_app",
  henryco_share: "share",
  henryco_sms: "sms",
};

function sanitizeUtmValue(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Append UTM params to a canonical absolute deep-link URL. Returns the
 * URL unchanged if it is not a parseable absolute http(s) URL (defensive —
 * builders always produce absolute URLs, but a mis-wired caller passing a
 * relative path should not crash a notification publish).
 */
export function withUtm(url: string, params: UtmParams): string {
  const medium = params.medium
    ? sanitizeUtmValue(params.medium)
    : DEFAULT_MEDIUM[params.source];
  const campaign = sanitizeUtmValue(params.campaign);

  try {
    const parsed = new URL(url);
    parsed.searchParams.set("utm_source", params.source);
    parsed.searchParams.set("utm_medium", medium);
    if (campaign) parsed.searchParams.set("utm_campaign", campaign);
    if (params.content) {
      parsed.searchParams.set("utm_content", sanitizeUtmValue(params.content));
    }
    if (params.term) {
      parsed.searchParams.set("utm_term", sanitizeUtmValue(params.term));
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Convenience: tag a deep link for a transactional email CTA. The
 * canonical S6 contract — `utm_source=henryco_email` + the email purpose
 * as the campaign.
 */
export function withEmailUtm(
  url: string,
  campaign: string,
  content?: string,
): string {
  return withUtm(url, { source: "henryco_email", campaign, content });
}
