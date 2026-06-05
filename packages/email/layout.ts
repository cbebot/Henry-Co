/**
 * Henry Onyx — premium, theme-aware transactional email design system.
 *
 * Design intent ("Onyx"): a quietly luxurious, editorial transactional
 * email. A deep onyx-black signature surface (the brand name *is* the
 * aesthetic), an editorial serif display voice (Fraunces, with a wide
 * serif fallback so MSO/Gmail still read premium), a refined H·Onyx
 * lockup, and a per-division accent that tunes every send to the surface
 * the recipient will land on.
 *
 * Rendering strategy (why it survives every inbox):
 *   - Inline styles carry the DARK ("onyx") baseline, so Gmail (which
 *     ignores <style>/media queries) and every other client get the
 *     bulletproof dark surface with no inversion surprises.
 *   - A <style> block adds a refined LIGHT ("alabaster") variant via
 *     `@media (prefers-color-scheme: light)`, applied through `.ox-*`
 *     classes, for clients that honour it (Apple Mail, iOS Mail). Dark
 *     stays the signature; light is the graceful adaptation.
 *   - Buttons get a VML round-rect fallback so Outlook/MSO render the
 *     pill CTA, not a square block.
 *   - Every themeable node carries BOTH an inline color and a class, so
 *     clients that re-tint can be steered and clients that strip <style>
 *     still have the inline truth.
 *
 * Code identifiers stay `HenryCo*` (per the brand decision: the brand is
 * "Henry Onyx"; code names are unchanged). Every *rendered* string is
 * Henry Onyx.
 */

import { BRAND_EMAILS } from "@henryco/config";

import type { EmailPurpose } from "./types";

/** Brand display name (rendered) and registered legal entity (fine print). */
const BRAND_NAME = "Henry Onyx";
const LEGAL_ENTITY = "Henry Onyx Limited";
const COMPANY_LOCALE_LINE = "Lagos, Nigeria";

/**
 * Editorial serif display (Fraunces — the website display face) with a
 * deep fallback chain so clients that cannot fetch web fonts still land
 * on a premium serif. System sans for body, resolving cleanly across
 * every major mail client without a web-font fetch.
 */
const HEADING_FONT_STACK =
  "'Fraunces', 'Fraunces 72', 'Newsreader', 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, 'Times New Roman', serif";
const BODY_FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/**
 * Onyx (dark, signature) token set — the inline baseline every client
 * receives. Light overrides live in the `<style>` block keyed to `.ox-*`.
 */
export const HENRYCO_EMAIL_TOKENS = {
  outerBg: "#05070B",
  cardBg: "#0C111A",
  cardEdge: "#161D28",
  cardBorder: "rgba(255,255,255,0.07)",
  heroText: "#F6F8FB",
  bodyText: "#C6CFDB",
  mutedText: "#8C97A6",
  accent: "#C9A227",
  accentSoft: "rgba(201,162,39,0.14)",
  ctaBg: "#C9A227",
  ctaText: "#0B1018",
  ctaBorder: "rgba(201,162,39,0.55)",
  divider: "rgba(255,255,255,0.08)",
  footerText: "#7A8593",
  headingFont: HEADING_FONT_STACK,
  bodyFont: BODY_FONT_STACK,
} as const;

const PURPOSE_KICKER: Record<EmailPurpose, string> = {
  auth: `${BRAND_NAME} Accounts`,
  support: `${BRAND_NAME} Support`,
  newsletter: `${BRAND_NAME} Editorial`,
  care: `${BRAND_NAME} Fabric Care`,
  studio: `${BRAND_NAME} Studio`,
  marketplace: `${BRAND_NAME} Marketplace`,
  jobs: `${BRAND_NAME} Jobs`,
  learn: `${BRAND_NAME} Learn`,
  property: `${BRAND_NAME} Property`,
  logistics: `${BRAND_NAME} Logistics`,
  security: `${BRAND_NAME} Security`,
  generic: BRAND_NAME,
};

/**
 * Per-division accent palette. Each Henry Onyx surface carries its own
 * tone — Accounts/owner gold, Care cobalt, Studio teal, Marketplace amber,
 * Logistics copper, Property terracotta, Security signal-red — and a send
 * honours the same identity instead of defaulting to one gold. Mirrors
 * `getDivisionConfig(...).accent` in `packages/config/company.ts`.
 *
 *   accent     — bright fill, legible on the onyx surface (rules, CTA, glow)
 *   accentSoft — translucent wash for the highlight card
 *   accentBorder — hairline around accent surfaces
 *   accentInk  — DARKER sibling for accent-colored TEXT on the light variant
 *   ctaText    — text color that sits on the accent CTA fill (both themes)
 */
const PURPOSE_PALETTE: Record<
  EmailPurpose,
  { accent: string; accentSoft: string; accentBorder: string; accentInk: string; ctaText: string }
> = {
  auth: { accent: "#D8B23E", accentSoft: "rgba(216,178,62,0.14)", accentBorder: "rgba(216,178,62,0.34)", accentInk: "#8A6F00", ctaText: "#0B1018" },
  support: { accent: "#D8B23E", accentSoft: "rgba(216,178,62,0.14)", accentBorder: "rgba(216,178,62,0.34)", accentInk: "#8A6F00", ctaText: "#0B1018" },
  newsletter: { accent: "#D8B23E", accentSoft: "rgba(216,178,62,0.14)", accentBorder: "rgba(216,178,62,0.34)", accentInk: "#8A6F00", ctaText: "#0B1018" },
  care: { accent: "#7B8BFF", accentSoft: "rgba(123,139,255,0.16)", accentBorder: "rgba(123,139,255,0.34)", accentInk: "#4F5BD0", ctaText: "#06080F" },
  studio: { accent: "#52CBD0", accentSoft: "rgba(82,203,208,0.16)", accentBorder: "rgba(82,203,208,0.34)", accentInk: "#1F7375", ctaText: "#03161B" },
  marketplace: { accent: "#E5933F", accentSoft: "rgba(229,147,63,0.16)", accentBorder: "rgba(229,147,63,0.34)", accentInk: "#7E5E1F", ctaText: "#1A0D04" },
  jobs: { accent: "#1EAAB2", accentSoft: "rgba(30,170,178,0.16)", accentBorder: "rgba(30,170,178,0.34)", accentInk: "#0A5C63", ctaText: "#04161A" },
  learn: { accent: "#A99CFF", accentSoft: "rgba(169,156,255,0.16)", accentBorder: "rgba(169,156,255,0.34)", accentInk: "#2E6E5F", ctaText: "#0A0716" },
  property: { accent: "#C07A47", accentSoft: "rgba(192,122,71,0.16)", accentBorder: "rgba(192,122,71,0.34)", accentInk: "#7A4924", ctaText: "#170C05" },
  logistics: { accent: "#E0833F", accentSoft: "rgba(224,131,63,0.16)", accentBorder: "rgba(224,131,63,0.34)", accentInk: "#9D4F1F", ctaText: "#180C05" },
  security: { accent: "#EC6A5E", accentSoft: "rgba(236,106,94,0.16)", accentBorder: "rgba(236,106,94,0.34)", accentInk: "#B23A30", ctaText: "#1B0605" },
  generic: { accent: "#D8B23E", accentSoft: "rgba(216,178,62,0.14)", accentBorder: "rgba(216,178,62,0.34)", accentInk: "#8A6F00", ctaText: "#0B1018" },
};

export type HenryCoEmailSection = {
  label: string;
  value: string;
};

export type HenryCoEmailLayout = {
  purpose: EmailPurpose;
  subject: string;
  /** Override the auto-derived purpose kicker (e.g., "Henry Onyx Studio"). */
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
  /** Optional muted footer note (e.g., expiry, recovery instruction). */
  footnote?: string | null;
  /** Optional support contact line. */
  supportLine?: string | null;
  /**
   * Optional security reassurance shown beneath the CTA as a small
   * lock-marked strip ("Secure, single-use link"). Defaults on for auth.
   */
  secureNote?: string | null;
  /**
   * Recipient locale → `<html lang>`/`<html dir>`. Caller translates the
   * visible strings before render; this only affects document attributes.
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

/**
 * Brand lockup: H·Onyx monogram tile + "Henry Onyx" set in the serif
 * display face. Rendered as native text (not an image) so the wordmark is
 * always legible regardless of image blocking. Used at the top of the card.
 */
function renderBrandMark(): string {
  const t = HENRYCO_EMAIL_TOKENS;
  // The H·Onyx mark is rendered as native HTML/CSS text — a serif "H" on the
  // onyx tile — NOT an image. Gmail and Outlook never render inline SVG or
  // `data:` URI images, so an image-based mark shows broken; pure text always
  // renders. The tile stays onyx in both light/dark variants (`.ox-tile`),
  // so the near-white "H" keeps its contrast either way.
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 22px 0;">
      <tr>
        <td class="ox-tile" width="44" height="44" align="center" valign="middle" style="width:44px; height:44px; padding:0; background-color:#10161F; border:1px solid rgba(255,255,255,0.10); border-radius:12px; text-align:center; vertical-align:middle; box-shadow:inset 0 1px 0 rgba(255,255,255,0.05);">
          <span style="display:inline-block; font-family:${t.headingFont}; font-size:25px; line-height:44px; font-weight:600; color:${t.heroText}; letter-spacing:0;">H</span>
        </td>
        <td style="padding:0 0 0 14px; vertical-align:middle;">
          <div class="ox-hero" style="margin:0; padding:0; font-family:${t.headingFont}; font-size:22px; font-weight:600; line-height:1; letter-spacing:-0.01em; color:${t.heroText};">Henry Onyx</div>
        </td>
      </tr>
    </table>`;
}

function renderSections(sections: HenryCoEmailSection[]): string {
  if (!sections.length) return "";
  const t = HENRYCO_EMAIL_TOKENS;
  const rows = sections
    .map(
      (s) => `
        <tr>
          <td style="padding:0 0 14px 0;">
            <div class="ox-muted" style="font-family:${t.bodyFont}; font-size:11px; letter-spacing:0.22em; text-transform:uppercase; color:${t.mutedText}; font-weight:700;">${escapeHtml(s.label)}</div>
            <div class="ox-body" style="margin-top:6px; font-family:${t.bodyFont}; font-size:15px; line-height:1.7; color:${t.bodyText};">${escapeHtml(s.value)}</div>
          </td>
        </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="ox-hair" style="margin-top:26px; border-top:1px solid ${t.divider}; padding-top:20px;">${rows}</table>`;
}

function renderBullets(bullets: string[]): string {
  if (!bullets.length) return "";
  const t = HENRYCO_EMAIL_TOKENS;
  const items = bullets
    .map(
      (b) =>
        `<li class="ox-body" style="margin:0 0 10px 0; padding:0; font-family:${t.bodyFont}; font-size:14.5px; line-height:1.7; color:${t.bodyText};">${escapeHtml(b)}</li>`
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
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr>
        <td class="ox-soft" style="padding:16px 18px; background-color:${palette.accentSoft}; border:1px solid ${palette.accentBorder}; border-radius:14px;">
          ${label ? `<div class="ox-accent" style="font-family:${t.bodyFont}; font-size:10.5px; letter-spacing:0.24em; text-transform:uppercase; color:${palette.accent}; font-weight:700;">${escapeHtml(label)}</div>` : ""}
          ${value ? `<div class="ox-hero" style="margin-top:7px; font-family:${t.headingFont}; font-size:19px; line-height:1.35; color:${t.heroText}; font-weight:600;">${escapeHtml(value)}</div>` : ""}
        </td>
      </tr>
    </table>`;
}

/**
 * Premium pill CTA with an Outlook/MSO VML round-rect fallback so the
 * button keeps its shape in Word-engine clients. The accent fill works on
 * both onyx and alabaster surfaces.
 */
function renderCta(
  label: string | null | undefined,
  href: string | null | undefined,
  palette: ResolvedPalette,
): string {
  if (!label || !href) return "";
  const t = HENRYCO_EMAIL_TOKENS;
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:30px;">
      <tr>
        <td>
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeHref}" style="height:48px;v-text-anchor:middle;width:236px;" arcsize="50%" strokecolor="${palette.accent}" fillcolor="${palette.accent}">
            <w:anchorlock/>
            <center style="color:${palette.ctaText};font-family:${BODY_FONT_STACK};font-size:14.5px;font-weight:700;letter-spacing:0.02em;">${safeLabel}</center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-- -->
          <a href="${safeHref}" style="display:inline-block; padding:15px 30px; font-family:${t.bodyFont}; font-size:14.5px; font-weight:700; color:${palette.ctaText}; background-color:${palette.accent}; text-decoration:none; border-radius:999px; letter-spacing:0.02em; border:1px solid ${palette.accentBorder};">${safeLabel}</a>
          <!--<![endif]-->
        </td>
      </tr>
    </table>
    <p class="ox-muted" style="margin:16px 0 0 0; font-family:${t.bodyFont}; font-size:12px; line-height:1.6; color:${t.mutedText};">If the button doesn&rsquo;t work, copy this link into your browser:<br/><a class="ox-accent" href="${safeHref}" style="color:${palette.accent}; word-break:break-all;">${safeHref}</a></p>`;
}

function renderSecureNote(note: string | null | undefined): string {
  if (!note) return "";
  const t = HENRYCO_EMAIL_TOKENS;
  // Text-only — no icon image. (Gmail/Outlook strip inline-SVG `data:` URIs,
  // which rendered the old lock glyph as a broken image.) A leading accent
  // dot drawn with a bordered cell gives a premium marker that always renders.
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:18px;">
      <tr>
        <td style="vertical-align:middle; padding-right:8px;"><div style="width:5px; height:5px; border-radius:999px; background-color:${t.mutedText}; line-height:5px; font-size:0;">&nbsp;</div></td>
        <td class="ox-muted" style="vertical-align:middle; font-family:${t.bodyFont}; font-size:11.5px; letter-spacing:0.02em; color:${t.mutedText};">${escapeHtml(note)}</td>
      </tr>
    </table>`;
}

/**
 * Standalone brand header partial — used by division templates that
 * compose their own hero. Mirrors the in-card lockup.
 */
export function renderHenryCoEmailHeader(
  purpose: EmailPurpose,
  tone: "dark" | "transparent" = "dark",
): string {
  const t = HENRYCO_EMAIL_TOKENS;
  const palette = paletteFor(purpose);
  const bg = tone === "dark" ? t.outerBg : "transparent";
  const border = tone === "dark" ? `border-bottom:1px solid ${t.divider};` : "";
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="ox-bg" style="background-color:${bg}; ${border}">
      <tr>
        <td align="left" style="padding:18px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td class="ox-tile" width="38" height="38" align="center" valign="middle" style="width:38px; height:38px; padding:0; background-color:#10161F; border:1px solid rgba(255,255,255,0.10); border-radius:10px; text-align:center; vertical-align:middle;">
                <span style="display:inline-block; font-family:${t.headingFont}; font-size:21px; line-height:38px; font-weight:600; color:${t.heroText};">H</span>
              </td>
              <td style="padding:0 0 0 12px; vertical-align:middle;">
                <div class="ox-hero" style="margin:0; padding:0; font-family:${t.headingFont}; font-size:18px; font-weight:600; line-height:1; letter-spacing:-0.01em; color:${t.heroText};">Henry Onyx</div>
              </td>
            </tr>
          </table>
          <div style="height:2px; width:34px; margin-top:12px; background-color:${palette.accent}; border-radius:999px; line-height:2px; font-size:0;">&nbsp;</div>
        </td>
      </tr>
    </table>`;
}

export type HenryCoEmailFooterOptions = {
  purpose?: EmailPurpose;
  supportEmail?: string | null;
  unsubscribeUrl?: string | null;
  preferencesUrl?: string | null;
  reasonLine?: string;
  /** Year for the copyright line. Pass-in keeps the renderer pure/testable. */
  year?: number;
};

/**
 * Brand footer — eyebrow (division), reason line, legal entity + locale,
 * support contact, and copyright. Email-safe, theme-aware via `.ox-*`.
 */
export function renderHenryCoEmailFooter(opts: HenryCoEmailFooterOptions = {}): string {
  const t = HENRYCO_EMAIL_TOKENS;
  const palette = paletteFor(opts.purpose || "generic");
  const eyebrow = opts.purpose ? PURPOSE_KICKER[opts.purpose] : PURPOSE_KICKER.generic;
  const resolvedSupport = opts.supportEmail || BRAND_EMAILS.support;
  const supportLink = `<a class="ox-accent" href="mailto:${escapeHtml(resolvedSupport)}" style="color:${palette.accent}; text-decoration:none;">${escapeHtml(resolvedSupport)}</a>`;
  const unsubscribeBlock = opts.unsubscribeUrl
    ? ` &middot; <a class="ox-foot" href="${escapeHtml(opts.unsubscribeUrl)}" style="color:${t.footerText}; text-decoration:underline;">Unsubscribe</a>`
    : "";
  const preferencesBlock = opts.preferencesUrl
    ? ` &middot; <a class="ox-foot" href="${escapeHtml(opts.preferencesUrl)}" style="color:${t.footerText}; text-decoration:underline;">Email preferences</a>`
    : "";
  const reason =
    opts.reasonLine ||
    `This is a ${BRAND_NAME} transactional message, sent because of an action on your ${BRAND_NAME} account.`;
  const year = opts.year ?? new Date().getFullYear();

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="ox-bg" style="background-color:${t.outerBg};">
      <tr>
        <td style="padding:26px 32px 30px 32px;">
          <div class="ox-hair" style="height:1px; background-color:${t.divider}; line-height:1px; font-size:0;">&nbsp;</div>
          <div class="ox-accent" style="margin-top:22px; font-family:${t.bodyFont}; font-size:10.5px; font-weight:700; letter-spacing:0.28em; text-transform:uppercase; color:${palette.accent};">${escapeHtml(eyebrow)}</div>
          <p class="ox-foot" style="margin:9px 0 0 0; font-family:${t.bodyFont}; font-size:11.5px; line-height:1.7; color:${t.footerText};">
            ${escapeHtml(reason)}
          </p>
          <p class="ox-foot" style="margin:10px 0 0 0; font-family:${t.bodyFont}; font-size:11.5px; line-height:1.7; color:${t.footerText};">
            ${escapeHtml(BRAND_NAME)} is a trading name of ${escapeHtml(LEGAL_ENTITY)} &middot; ${escapeHtml(COMPANY_LOCALE_LINE)}
          </p>
          <p class="ox-foot" style="margin:6px 0 0 0; font-family:${t.bodyFont}; font-size:11.5px; line-height:1.7; color:${t.footerText};">
            Need help? ${supportLink}${unsubscribeBlock}${preferencesBlock}
          </p>
          <p class="ox-foot" style="margin:14px 0 0 0; font-family:${t.bodyFont}; font-size:11px; line-height:1.7; color:${t.footerText};">
            &copy; ${year} ${escapeHtml(LEGAL_ENTITY)}. All rights reserved.
          </p>
        </td>
      </tr>
    </table>`;
}

/** The `<style>` block: web font, responsive tweaks, and the light variant. */
function headStyle(): string {
  return `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap');
      :root { color-scheme: light dark; }
      body { margin:0 !important; padding:0 !important; width:100% !important; color-scheme: light dark; }
      a { text-decoration:none; }
      img { -ms-interpolation-mode:bicubic; }
      .ox-card-glow { background:radial-gradient(120% 90% at 50% -10%, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 60%); }
      @media only screen and (max-width:620px) {
        .ox-pad { padding:30px 22px 24px 22px !important; }
        .ox-foot-pad { padding:22px 22px 26px 22px !important; }
        .ox-title { font-size:25px !important; }
      }
      @media (prefers-color-scheme: light) {
        .ox-bg { background-color:#F1EDE4 !important; }
        .ox-card { background-color:#FFFFFF !important; border-color:rgba(10,16,24,0.10) !important; }
        .ox-card-glow { background:radial-gradient(120% 90% at 50% -10%, rgba(11,16,24,0.035) 0%, rgba(11,16,24,0) 60%) !important; }
        .ox-tile { background-color:#0C111A !important; border-color:rgba(0,0,0,0.10) !important; }
        .ox-hero { color:#0C111A !important; }
        .ox-body { color:#3A434F !important; }
        .ox-muted { color:#6B7480 !important; }
        .ox-foot, .ox-foot a { color:#76808C !important; }
        .ox-hair { background-color:rgba(10,16,24,0.10) !important; border-color:rgba(10,16,24,0.10) !important; }
        .ox-accent { color:var(--ox-ink) !important; }
      }
    </style>`;
}

/**
 * Render a Henry Onyx transactional email. Onyx-dark baseline (inline) +
 * alabaster-light variant (prefers-color-scheme). Bulletproof across Gmail
 * (web + mobile), Apple Mail, and Outlook (graceful MSO degradation).
 */
export function renderHenryCoEmail(layout: HenryCoEmailLayout): string {
  const t = HENRYCO_EMAIL_TOKENS;
  const palette = paletteFor(layout.purpose);
  const eyebrow = layout.eyebrow || PURPOSE_KICKER[layout.purpose];
  const brandMark = renderBrandMark();
  const sections = renderSections(layout.sections || []);
  const bullets = renderBullets(layout.bullets || []);
  const highlight = renderHighlight(layout.highlightLabel, layout.highlightValue, palette);
  const cta = renderCta(layout.actionLabel, layout.actionHref, palette);
  const secure = renderSecureNote(layout.secureNote);
  const body = layout.body
    ? `<p class="ox-body" style="margin:18px 0 0 0; font-family:${t.bodyFont}; font-size:15px; line-height:1.78; color:${t.bodyText};">${escapeHtml(layout.body)}</p>`
    : "";
  const footnote = layout.footnote
    ? `<p class="ox-muted" style="margin:26px 0 0 0; font-family:${t.bodyFont}; font-size:12.5px; line-height:1.7; color:${t.mutedText};">${escapeHtml(layout.footnote)}</p>`
    : "";
  const supportLine = layout.supportLine
    ? `<p class="ox-muted" style="margin:8px 0 0 0; font-family:${t.bodyFont}; font-size:12.5px; line-height:1.7; color:${t.mutedText};">${escapeHtml(layout.supportLine)}</p>`
    : "";

  const footerSupportEmail = layout.purpose === "auth" ? BRAND_EMAILS.accounts : null;
  const footer = renderHenryCoEmailFooter({
    purpose: layout.purpose,
    supportEmail: footerSupportEmail,
  });

  const lang = (layout.locale || "en").toLowerCase();
  const dir = lang === "ar" ? "rtl" : "ltr";

  return `<!doctype html>
<html lang="${lang}" dir="${dir}" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>${escapeHtml(layout.subject)}</title>
    <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
    ${headStyle()}
  </head>
  <body class="ox-bg" style="margin:0; padding:0; background-color:${t.outerBg}; color:${t.bodyText}; font-family:${t.bodyFont}; color-scheme:light dark; --ox-ink:${palette.accentInk};">
    <span style="display:none; visibility:hidden; opacity:0; max-height:0; max-width:0; overflow:hidden; mso-hide:all;">${escapeHtml(layout.intro)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="ox-bg" style="background-color:${t.outerBg}; padding:36px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="ox-card" style="max-width:600px; background-color:${t.cardBg}; border:1px solid ${t.cardBorder}; border-radius:22px; overflow:hidden;">
            <tr>
              <td class="ox-card-glow ox-pad" style="padding:40px 36px 30px 36px;">
                ${brandMark}
                <div style="height:2px; width:42px; background-color:${palette.accent}; border-radius:999px; line-height:2px; font-size:0;">&nbsp;</div>
                <div class="ox-accent" style="margin-top:20px; font-family:${t.bodyFont}; font-size:11px; font-weight:700; letter-spacing:0.28em; text-transform:uppercase; color:${palette.accent};">${escapeHtml(eyebrow)}</div>
                <h1 class="ox-hero ox-title" style="margin:13px 0 0 0; font-family:${t.headingFont}; font-size:29px; line-height:1.22; font-weight:600; color:${t.heroText}; letter-spacing:-0.014em;">${escapeHtml(layout.title)}</h1>
                <p class="ox-hero" style="margin:16px 0 0 0; font-family:${t.bodyFont}; font-size:15.5px; line-height:1.78; color:${t.heroText};">${escapeHtml(layout.intro)}</p>
                ${highlight}
                ${sections}
                ${bullets}
                ${body}
                ${cta}
                ${secure}
                ${footnote}
                ${supportLine}
              </td>
            </tr>
            <tr>
              <td class="ox-card ox-foot-pad" style="padding:0; background-color:${t.cardBg};">
                ${footer}
              </td>
            </tr>
          </table>
          <div class="ox-foot" style="max-width:600px; margin:18px auto 0 auto; font-family:${t.bodyFont}; font-size:10.5px; line-height:1.6; color:${t.footerText}; text-align:center;">
            ${escapeHtml(BRAND_NAME)} &middot; one account across every division
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Plain-text fallback for clients with HTML disabled. Mirrors the visible
 * content and keeps the action URL reachable.
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
    lines.push(`${layout.actionLabel}: ${layout.actionHref}`);
  }
  if (layout.secureNote) {
    lines.push("");
    lines.push(layout.secureNote);
  }
  if (layout.footnote) {
    lines.push("");
    lines.push(layout.footnote);
  }
  if (layout.supportLine) {
    lines.push(layout.supportLine);
  }
  lines.push("");
  lines.push(`— ${BRAND_NAME} · ${LEGAL_ENTITY} · ${COMPANY_LOCALE_LINE}`);
  return lines.join("\n");
}
