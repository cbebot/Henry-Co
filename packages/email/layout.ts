/**
 * HenryCo dark-mode-safe email layout primitives.
 *
 * Why this exists: Gmail mobile / Apple Mail dark mode aggressively
 * inverts light email backgrounds and re-tints text. Hero sections that
 * relied on dark gradients with light copy ended up illegible because
 * the client recolored both layers. The fix:
 *
 *   - a deliberately dark outer background (#070d14) so dark-mode clients
 *     leave it alone, and a slightly lifted card (#0f1923) so the card
 *     still reads as a card on light *and* dark mode;
 *   - near-white #f5faff for hero copy and #d3dde6 for body — both remain
 *     readable when clients re-tint;
 *   - no fragile decorative gradients behind hero copy (a thin accent rule
 *     replaces them); and
 *   - hard contrast borders / inline `color` / `background-color` on every
 *     node so MSO/Gmail cannot strip the variant the layout depends on.
 *
 * Every public renderer should go through `renderHenryCoEmail` to get the
 * same hardening. `renderHenryCoEmailHeader` and `renderHenryCoEmailFooter`
 * are exported so division-specific custom templates can compose the same
 * brand strap above and below their own hero blocks (V2-EMAIL-BRAND-01).
 */

import { BRAND_EMAILS, COMPANY } from "@henryco/config";

import type { EmailPurpose } from "./types";

/**
 * Brand typography stacks. Source Serif 4 for headings (with wide
 * fallbacks to Source Serif Pro / Newsreader / Georgia so MSO and other
 * clients that cannot fetch web fonts still render a serif). Inter for
 * body, with the same broad fallback chain that resolves to a system
 * sans across every major mail client.
 */
const HEADING_FONT_STACK =
  "'Source Serif 4', 'Source Serif Pro', Newsreader, 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, 'Times New Roman', serif";
const BODY_FONT_STACK =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const HENRYCO_EMAIL_TOKENS = {
  outerBg: "#070d14",
  cardBg: "#0f1923",
  cardBorder: "rgba(255,255,255,0.06)",
  heroText: "#f5faff",
  bodyText: "#d3dde6",
  mutedText: "#94a3b3",
  accent: "#f4c454",
  accentSoft: "rgba(244,196,84,0.16)",
  ctaBg: "#f4c454",
  ctaText: "#0b1018",
  ctaBorder: "#e6b94a",
  divider: "rgba(255,255,255,0.08)",
  footerText: "#7e8b97",
  headingFont: HEADING_FONT_STACK,
  bodyFont: BODY_FONT_STACK,
} as const;

const PURPOSE_KICKER: Record<EmailPurpose, string> = {
  auth: "Henry Onyx Accounts",
  support: "Henry Onyx Support",
  newsletter: "Henry Onyx Editorial",
  care: "Henry Onyx Care",
  studio: "Henry Onyx Studio",
  marketplace: "Henry Onyx Marketplace",
  jobs: "Henry Onyx Jobs",
  learn: "Henry Onyx Learn",
  property: "Henry Onyx Property",
  logistics: "Henry Onyx Logistics",
  security: "Henry Onyx Security",
  generic: "Henry Onyx",
};

/**
 * Per-division accent palette. Each surface in HenryCo carries its own
 * color tone — Care periwinkle, Studio teal, Marketplace amber, etc. —
 * and transactional emails should honour the same identity instead of
 * defaulting to a single gold across every send. Used by
 * `renderHenryCoEmail` to tint the eyebrow, accent rule, highlight
 * card, CTA button, and CTA fallback link colour. Hex values are
 * inline-safe (no CSS custom properties — Outlook strips them) and
 * mirror the `getDivisionConfig(...).accent` values in
 * `packages/config/company.ts`.
 */
const PURPOSE_PALETTE: Record<
  EmailPurpose,
  { accent: string; accentSoft: string; accentBorder: string; ctaText: string }
> = {
  auth: { accent: "#C9A227", accentSoft: "rgba(201,162,39,0.16)", accentBorder: "rgba(201,162,39,0.32)", ctaText: "#0b1018" },
  support: { accent: "#C9A227", accentSoft: "rgba(201,162,39,0.16)", accentBorder: "rgba(201,162,39,0.32)", ctaText: "#0b1018" },
  newsletter: { accent: "#C9A227", accentSoft: "rgba(201,162,39,0.16)", accentBorder: "rgba(201,162,39,0.32)", ctaText: "#0b1018" },
  care: { accent: "#6B7CFF", accentSoft: "rgba(107,124,255,0.18)", accentBorder: "rgba(107,124,255,0.36)", ctaText: "#06080f" },
  studio: { accent: "#49C0C5", accentSoft: "rgba(73,192,197,0.18)", accentBorder: "rgba(73,192,197,0.36)", ctaText: "#03161b" },
  marketplace: { accent: "#E08A3C", accentSoft: "rgba(224,138,60,0.18)", accentBorder: "rgba(224,138,60,0.36)", ctaText: "#1a0d04" },
  jobs: { accent: "#5C6BC0", accentSoft: "rgba(92,107,192,0.18)", accentBorder: "rgba(92,107,192,0.36)", ctaText: "#070912" },
  learn: { accent: "#9F8FFF", accentSoft: "rgba(159,143,255,0.18)", accentBorder: "rgba(159,143,255,0.36)", ctaText: "#0a0716" },
  property: { accent: "#B06C3E", accentSoft: "rgba(176,108,62,0.18)", accentBorder: "rgba(176,108,62,0.36)", ctaText: "#170c05" },
  logistics: { accent: "#D77539", accentSoft: "rgba(215,117,57,0.18)", accentBorder: "rgba(215,117,57,0.36)", ctaText: "#180c05" },
  security: { accent: "#E5564E", accentSoft: "rgba(229,86,78,0.18)", accentBorder: "rgba(229,86,78,0.36)", ctaText: "#1b0605" },
  generic: { accent: "#C9A227", accentSoft: "rgba(201,162,39,0.16)", accentBorder: "rgba(201,162,39,0.32)", ctaText: "#0b1018" },
};

/**
 * V3-04 (S6) — Email CTA integrity: every transactional-email action
 * link must be an ABSOLUTE https URL (email clients have no relative
 * base) AND carry UTM attribution so owner analytics + the deep-link
 * telemetry (S8) can join landings back to the email that drove them.
 *
 * Self-contained here (no `@henryco/seo` dep) so `@henryco/email`
 * keeps its single `@henryco/config` dependency and stays free of the
 * seo → config → i18n graph. Mirrors `withEmailUtm` in
 * `@henryco/seo/deeplinks` — keep the two in sync if the UTM contract
 * changes.
 */
function sanitizeUtmValue(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Append `utm_source=henryco_email` + the campaign to an absolute
 * action URL. No-ops (returns the input unchanged) for non-absolute or
 * non-http(s) URLs and `mailto:`/`tel:` links so a CTA that is a
 * support mailto is never mangled.
 */
function withEmailCtaUtm(
  href: string,
  campaign: string | null | undefined,
  content?: string,
): string {
  const value = String(href || "").trim();
  if (!value) return value;
  // Never tag non-navigational schemes.
  if (/^(mailto:|tel:|sms:)/i.test(value)) return value;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    // Relative path — cannot UTM-tag without an origin, and email CTAs
    // must be absolute anyway. Return unchanged; the caller owns the
    // absolute-URL contract.
    return value;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return value;
  // Do not clobber a campaign the caller already encoded.
  if (!parsed.searchParams.has("utm_source")) {
    parsed.searchParams.set("utm_source", "henryco_email");
    parsed.searchParams.set("utm_medium", "email");
    const normalizedCampaign = sanitizeUtmValue(campaign || "");
    if (normalizedCampaign) parsed.searchParams.set("utm_campaign", normalizedCampaign);
    if (content) parsed.searchParams.set("utm_content", sanitizeUtmValue(content));
  }
  return parsed.toString();
}

export type HenryCoEmailSection = {
  label: string;
  value: string;
};

export type HenryCoEmailLayout = {
  purpose: EmailPurpose;
  subject: string;
  /** Override the auto-derived purpose kicker (e.g., "Henry Onyx Studio") */
  eyebrow?: string;
  title: string;
  /** First paragraph in hero — must be high-contrast. */
  intro: string;
  highlightLabel?: string | null;
  highlightValue?: string | null;
  sections?: HenryCoEmailSection[];
  bullets?: string[];
  /** Optional second paragraph, after sections/bullets. */
  body?: string;
  actionLabel?: string | null;
  actionHref?: string | null;
  /**
   * V3-04 (S6) — UTM campaign for the CTA. When set, `renderHenryCoEmail`
   * appends `utm_source=henryco_email&utm_medium=email&utm_campaign=<this>`
   * to `actionHref` (if it is an absolute http(s) URL and not already
   * UTM-tagged). Typically the email purpose + event, e.g.
   * "care_booking_confirmed". Omit to leave the link untagged.
   */
  campaign?: string | null;
  /** Optional muted footer note (e.g., expiry, recovery instruction). */
  footnote?: string | null;
  /** Optional support contact line. */
  supportLine?: string | null;
  /**
   * PASS 18C — recipient locale. Drives `<html lang>` and `<html dir>`
   * attributes for accessibility and RTL language support. Caller is
   * expected to translate the actual UI strings (subject, title, intro,
   * etc.) before calling renderHenryCoEmail; this field only affects
   * outer document attributes. Defaults to "en".
   */
  locale?: string | null;
};

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

type ResolvedPalette = (typeof PURPOSE_PALETTE)[EmailPurpose];

function paletteFor(purpose: EmailPurpose): ResolvedPalette {
  return PURPOSE_PALETTE[purpose] || PURPOSE_PALETTE.generic;
}

function renderSections(sections: HenryCoEmailSection[]): string {
  if (!sections.length) return "";
  const t = HENRYCO_EMAIL_TOKENS;
  const rows = sections
    .map(
      (s) => `
        <tr>
          <td style="padding:0 0 14px 0;">
            <div style="font-size:11px; letter-spacing:0.22em; text-transform:uppercase; color:${t.mutedText}; font-weight:700;">${escapeHtml(s.label)}</div>
            <div style="margin-top:6px; font-size:15px; line-height:1.7; color:${t.bodyText};">${escapeHtml(s.value)}</div>
          </td>
        </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px; border-top:1px solid ${t.divider}; padding-top:18px;">${rows}</table>`;
}

function renderBullets(bullets: string[]): string {
  if (!bullets.length) return "";
  const t = HENRYCO_EMAIL_TOKENS;
  const items = bullets
    .map(
      (b) =>
        `<li style="margin:0 0 10px 0; padding:0; font-size:14.5px; line-height:1.7; color:${t.bodyText};">${escapeHtml(b)}</li>`
    )
    .join("");
  return `<ul style="margin:18px 0 0 0; padding:0 0 0 20px; list-style:disc; color:${t.bodyText};">${items}</ul>`;
}

function renderHighlight(
  label: string | null | undefined,
  value: string | null | undefined,
  palette: ResolvedPalette,
): string {
  if (!label && !value) return "";
  const t = HENRYCO_EMAIL_TOKENS;
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;">
      <tr>
        <td style="padding:14px 18px; background-color:${palette.accentSoft}; border:1px solid ${palette.accentBorder}; border-radius:14px;">
          ${label ? `<div style="font-size:10.5px; letter-spacing:0.24em; text-transform:uppercase; color:${palette.accent}; font-weight:700;">${escapeHtml(label)}</div>` : ""}
          ${value ? `<div style="margin-top:6px; font-size:18px; line-height:1.4; color:${t.heroText}; font-weight:600;">${escapeHtml(value)}</div>` : ""}
        </td>
      </tr>
    </table>`;
}

function renderCta(
  label: string | null | undefined,
  href: string | null | undefined,
  palette: ResolvedPalette,
): string {
  if (!label || !href) return "";
  const t = HENRYCO_EMAIL_TOKENS;
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;">
      <tr>
        <td style="border-radius:999px; background-color:${palette.accent}; border:1px solid ${palette.accentBorder};">
          <a href="${escapeHtml(href)}" style="display:inline-block; padding:14px 26px; font-size:14.5px; font-weight:700; color:${palette.ctaText}; text-decoration:none; border-radius:999px; letter-spacing:0.01em;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:14px 0 0 0; font-size:12px; line-height:1.6; color:${t.mutedText};">If the button doesn&rsquo;t work, copy this link into your browser:<br/><a href="${escapeHtml(href)}" style="color:${palette.accent}; word-break:break-all;">${escapeHtml(href)}</a></p>`;
}

/**
 * HENRY ONYX wordmark — rendered as native HTML text with a serif font
 * stack rather than as an image. Email clients across Gmail, Apple Mail,
 * Outlook (web + Mac + iOS), and major Android clients render this
 * faithfully from system fonts; clients without web-font support fall
 * back through Newsreader → Iowan Old Style → Palatino → Georgia, all of
 * which carry the same premium serif read. This keeps the brand visible
 * regardless of remote-image blocking and avoids the MSO data-URI strip.
 *
 * The 28×28 monogram tile to the left mirrors the in-app HenryCoMonogram
 * primitive (drawn inline as SVG, dark-mode-safe via the outer card
 * background), and the per-division accent rule beneath ties the email
 * to the website tone the recipient will land on.
 */
function renderBrandMark(palette: ResolvedPalette): string {
  const t = HENRYCO_EMAIL_TOKENS;
  // 28px monogram, inline so every client can render it without remote
  // image blocking. Encoded as a data URI so the email body stays fully
  // self-contained. Uses currentColor so a light variant is implicit on
  // dark cards (the H stroke renders in #f5faff via the surrounding fill).
  const monogramSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 54 64' width='24' height='24' aria-hidden='true'><g fill='none' stroke='%23f5faff' stroke-width='2.6' stroke-linecap='square'><path d='M9 7 H17 V57 H9 Z'/><path d='M37 7 H45 V57 H37 Z'/><path d='M9 28 H45 V34 H9 Z'/></g><rect x='6.5' y='7' width='13' height='2' fill='${encodeURIComponent(palette.accent)}'/><rect x='34.5' y='55' width='13' height='2' fill='${encodeURIComponent(palette.accent)}'/></svg>`;
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;">
      <tr>
        <td style="padding:0; vertical-align:middle;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:40px; height:40px; padding:0; background-color:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:11px; text-align:center; vertical-align:middle;">
                <img src="data:image/svg+xml;utf8,${monogramSvg}" alt="" width="24" height="24" style="display:inline-block; border:0; outline:none; text-decoration:none;" />
              </td>
              <td style="padding:0 0 0 14px; vertical-align:middle;">
                <div style="margin:0; padding:0; font-family:${t.headingFont}; font-size:21px; font-weight:600; line-height:1; letter-spacing:-0.01em; color:${t.heroText};">Henry Onyx</div>
                <div style="margin:4px 0 0 0; padding:0; font-family:${t.bodyFont}; font-size:9.5px; font-weight:700; letter-spacing:0.32em; text-transform:uppercase; color:${palette.accent};">Platform</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

/**
 * Standalone brand header partial. Custom division templates compose
 * this above their existing hero sections so every email leads with
 * the same Henry Onyx brand identity. Returns email-safe table-based
 * markup with inline styles — usable in any of the per-division
 * templates without further hardening.
 *
 * @param purpose drives the per-division accent under the wordmark.
 * @param tone   "dark" (default) renders the strap on a dark band
 *               appropriate for templates whose hero is light;
 *               "transparent" renders it without its own background so
 *               division templates with their own dark hero can place
 *               it on top of their hero gradient.
 */
export function renderHenryCoEmailHeader(
  purpose: EmailPurpose,
  tone: "dark" | "transparent" = "dark",
): string {
  const t = HENRYCO_EMAIL_TOKENS;
  const palette = paletteFor(purpose);
  const monogramSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 54 64' width='22' height='22' aria-hidden='true'><g fill='none' stroke='%23f5faff' stroke-width='2.6' stroke-linecap='square'><path d='M9 7 H17 V57 H9 Z'/><path d='M37 7 H45 V57 H37 Z'/><path d='M9 28 H45 V34 H9 Z'/></g><rect x='6.5' y='7' width='13' height='2' fill='${encodeURIComponent(palette.accent)}'/><rect x='34.5' y='55' width='13' height='2' fill='${encodeURIComponent(palette.accent)}'/></svg>`;
  const bg = tone === "dark" ? t.outerBg : "transparent";
  const border = tone === "dark" ? `border-bottom:1px solid ${t.divider};` : "";
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${bg}; ${border}">
      <tr>
        <td align="left" style="padding:18px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:36px; height:36px; padding:0; background-color:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:10px; text-align:center; vertical-align:middle;">
                <img src="data:image/svg+xml;utf8,${monogramSvg}" alt="" width="22" height="22" style="display:inline-block; border:0; outline:none; text-decoration:none;" />
              </td>
              <td style="padding:0 0 0 12px; vertical-align:middle;">
                <div style="margin:0; padding:0; font-family:${t.headingFont}; font-size:18px; font-weight:600; line-height:1; letter-spacing:-0.01em; color:${t.heroText};">Henry Onyx</div>
                <div style="margin:3px 0 0 0; padding:0; font-family:${t.bodyFont}; font-size:9px; font-weight:700; letter-spacing:0.30em; text-transform:uppercase; color:${palette.accent};">Platform</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

export type HenryCoEmailFooterOptions = {
  /** Sender division for the kicker line ("Henry Onyx Care", etc.). */
  purpose?: EmailPurpose;
  /** Optional support contact line — defaults to `BRAND_EMAILS.support`. */
  supportEmail?: string | null;
  /** Optional one-click unsubscribe URL. Required for marketing
   *  templates per RFC 8058; transactional templates may omit. */
  unsubscribeUrl?: string | null;
  /** Optional preferences URL for granular email-channel control. */
  preferencesUrl?: string | null;
  /** Override the default body of the "you are receiving this" line. */
  reasonLine?: string;
};

/**
 * Standalone brand footer partial. Custom division templates compose
 * this below their existing body / signature so every email closes with
 * the same legal entity, address, and support contact.
 * Email-safe table-based markup with inline styles.
 */
export function renderHenryCoEmailFooter(opts: HenryCoEmailFooterOptions = {}): string {
  const t = HENRYCO_EMAIL_TOKENS;
  const palette = paletteFor(opts.purpose || "generic");
  const eyebrow = opts.purpose ? PURPOSE_KICKER[opts.purpose] : PURPOSE_KICKER.generic;
  const legalEntity = COMPANY.group.legalName;
  const resolvedSupport = opts.supportEmail || BRAND_EMAILS.support;
  const supportLink = `<a href="mailto:${escapeHtml(resolvedSupport)}" style="color:${palette.accent}; text-decoration:none;">${escapeHtml(resolvedSupport)}</a>`;
  const unsubscribeBlock = opts.unsubscribeUrl
    ? ` &middot; <a href="${escapeHtml(opts.unsubscribeUrl)}" style="color:${t.footerText}; text-decoration:underline;">Unsubscribe</a>`
    : "";
  const preferencesBlock = opts.preferencesUrl
    ? ` &middot; <a href="${escapeHtml(opts.preferencesUrl)}" style="color:${t.footerText}; text-decoration:underline;">Email preferences</a>`
    : "";
  const reason =
    opts.reasonLine ||
    "This is a Henry Onyx transactional message. You received it because of an action on your Henry Onyx account.";

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${t.outerBg};">
      <tr>
        <td style="padding:24px 28px 28px 28px;">
          <div style="font-family:${t.bodyFont}; font-size:10.5px; font-weight:700; letter-spacing:0.28em; text-transform:uppercase; color:${palette.accent};">${escapeHtml(eyebrow)}</div>
          <p style="margin:8px 0 0 0; font-family:${t.bodyFont}; font-size:11.5px; line-height:1.7; color:${t.footerText};">
            ${escapeHtml(reason)}
          </p>
          <p style="margin:10px 0 0 0; font-family:${t.bodyFont}; font-size:11.5px; line-height:1.7; color:${t.footerText};">
            ${escapeHtml(legalEntity)} &middot; Lagos, Nigeria
          </p>
          <p style="margin:6px 0 0 0; font-family:${t.bodyFont}; font-size:11.5px; line-height:1.7; color:${t.footerText};">
            Need help? ${supportLink}${unsubscribeBlock}${preferencesBlock}
          </p>
          <p style="margin:14px 0 0 0; font-family:${t.bodyFont}; font-size:11px; line-height:1.7; color:${t.footerText};">
            &copy; 2026 ${escapeHtml(legalEntity)}. All rights reserved.
          </p>
        </td>
      </tr>
    </table>`;
}

/**
 * Render a HenryCo-branded transactional email. Output is dark-mode-safe
 * across Gmail (web + mobile), Apple Mail, and Outlook (with graceful
 * degradation in MSO).
 */
export function renderHenryCoEmail(layout: HenryCoEmailLayout): string {
  const t = HENRYCO_EMAIL_TOKENS;
  const palette = paletteFor(layout.purpose);
  const eyebrow = layout.eyebrow || PURPOSE_KICKER[layout.purpose];
  const brandMark = renderBrandMark(palette);
  const sections = renderSections(layout.sections || []);
  const bullets = renderBullets(layout.bullets || []);
  const highlight = renderHighlight(layout.highlightLabel, layout.highlightValue, palette);
  const ctaHref = withEmailCtaUtm(layout.actionHref || "", layout.campaign, "cta_button");
  const cta = renderCta(layout.actionLabel, ctaHref, palette);
  const body = layout.body
    ? `<p style="margin:18px 0 0 0; font-size:15px; line-height:1.75; color:${t.bodyText};">${escapeHtml(layout.body)}</p>`
    : "";
  const footnote = layout.footnote
    ? `<p style="margin:24px 0 0 0; font-size:12.5px; line-height:1.7; color:${t.mutedText};">${escapeHtml(layout.footnote)}</p>`
    : "";
  const supportLine = layout.supportLine
    ? `<p style="margin:8px 0 0 0; font-size:12.5px; line-height:1.7; color:${t.mutedText};">${escapeHtml(layout.supportLine)}</p>`
    : "";

  const footerSupportEmail = layout.purpose === "auth" ? BRAND_EMAILS.accounts : null;
  const footer = renderHenryCoEmailFooter({
    purpose: layout.purpose,
    supportEmail: footerSupportEmail,
  });

  const lang = (layout.locale || "en").toLowerCase();
  const dir = lang === "ar" ? "rtl" : "ltr";

  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark light" />
    <meta name="supported-color-schemes" content="dark light" />
    <title>${escapeHtml(layout.subject)}</title>
  </head>
  <body style="margin:0; padding:0; background-color:${t.outerBg}; color:${t.bodyText}; font-family:${t.bodyFont};">
    <span style="display:none; visibility:hidden; opacity:0; max-height:0; max-width:0; overflow:hidden; mso-hide:all;">${escapeHtml(layout.intro)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${t.outerBg}; padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; background-color:${t.cardBg}; border:1px solid ${t.cardBorder}; border-radius:22px; overflow:hidden;">
            <tr>
              <td style="padding:36px 32px 28px 32px; background-color:${t.cardBg};">
                ${brandMark}
                <div style="height:2px; width:46px; background-color:${palette.accent}; border-radius:999px;"></div>
                <div style="margin-top:18px; font-family:${t.bodyFont}; font-size:11px; font-weight:700; letter-spacing:0.28em; text-transform:uppercase; color:${palette.accent};">${escapeHtml(eyebrow)}</div>
                <h1 style="margin:14px 0 0 0; font-family:${t.headingFont}; font-size:28px; line-height:1.22; font-weight:600; color:${t.heroText}; letter-spacing:-0.012em;">${escapeHtml(layout.title)}</h1>
                <p style="margin:16px 0 0 0; font-family:${t.bodyFont}; font-size:15.5px; line-height:1.75; color:${t.heroText};">${escapeHtml(layout.intro)}</p>
                ${highlight}
                ${sections}
                ${bullets}
                ${body}
                ${cta}
                ${footnote}
                ${supportLine}
              </td>
            </tr>
            <tr>
              <td style="padding:0; background-color:${t.cardBg};">
                ${footer}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Lightweight plain-text fallback. Email clients that disable HTML still
 * need to be able to read the message and reach the action URL.
 */
export function renderHenryCoEmailText(layout: HenryCoEmailLayout): string {
  const lines: string[] = [];
  lines.push((layout.eyebrow || PURPOSE_KICKER[layout.purpose]).toUpperCase());
  lines.push("");
  lines.push(layout.title);
  lines.push("");
  lines.push(layout.intro);
  if (layout.highlightLabel || layout.highlightValue) {
    lines.push("");
    lines.push(`${layout.highlightLabel || ""}${layout.highlightLabel && layout.highlightValue ? ": " : ""}${layout.highlightValue || ""}`);
  }
  if (layout.sections?.length) {
    lines.push("");
    for (const s of layout.sections) lines.push(`${s.label}: ${s.value}`);
  }
  if (layout.bullets?.length) {
    lines.push("");
    for (const b of layout.bullets) lines.push(`- ${b}`);
  }
  if (layout.body) {
    lines.push("");
    lines.push(layout.body);
  }
  if (layout.actionLabel && layout.actionHref) {
    lines.push("");
    lines.push(
      `${layout.actionLabel}: ${withEmailCtaUtm(layout.actionHref, layout.campaign, "cta_button")}`,
    );
  }
  if (layout.footnote) {
    lines.push("");
    lines.push(layout.footnote);
  }
  if (layout.supportLine) {
    lines.push(layout.supportLine);
  }
  return lines.join("\n");
}
