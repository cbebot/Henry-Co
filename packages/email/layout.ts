/**
 * Email-safe HenryCo font stacks. Hardcoded as a literal string here
 * (instead of imported from @henryco/ui/brand-typography) because this
 * file runs in non-Next contexts: edge functions, server actions,
 * Resend background workers. We accept the duplication so that an
 * email rendered from a worker without Next still gets the same
 * brand-aligned font family the website serves.
 *
 * Email clients cannot self-host or preload web fonts reliably:
 *   - Outlook strips @font-face
 *   - Gmail rewrites font declarations
 *   - Apple Mail honours them inconsistently across iOS/macOS
 *
 * So the stacks below lead with our brand families (Inter, Source
 * Serif 4) for clients that *can* fetch them, then drop into the
 * widest-available system fallback. Body always uses sans for legibility.
 * If you change Inter / Source Serif 4 in @henryco/ui/brand-typography,
 * change them here too.
 */
export const HENRYCO_EMAIL_FONT_STACK =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export const HENRYCO_EMAIL_SERIF_STACK =
  "'Source Serif 4', Georgia, Cambria, 'Times New Roman', serif";

/**
 * HenryCo dark-mode-safe email layout primitives.
 *
 * Why this exists: Gmail mobile / Apple Mail dark mode aggressively
 * inverts light email backgrounds and re-tints text. Hero sections that
 * relied on dark gradients with light copy ended up illegible because
 * the client recolored both layers. We fix this by:
 *
 *   - using a deliberately dark outer background (#070d14) so dark-mode
 *     clients leave it alone, and a slightly lifted card (#0f1923) so the
 *     card still reads as a card on light *and* dark mode;
 *   - using near-white #f5faff for hero copy and #d3dde6 for body — both
 *     remain readable when clients re-tint;
 *   - dropping fragile decorative gradients from behind hero copy (a thin
 *     accent rule replaces them); and
 *   - putting hard contrast borders/inline `color`/`background-color` on
 *     every node so MSO/Gmail can't strip the variant we depend on.
 *
 * Every public renderer should go through `renderHenryCoEmail` to get
 * the same hardening.
 */

import type { EmailPurpose } from "./types";

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
} as const;

const PURPOSE_KICKER: Record<EmailPurpose, string> = {
  auth: "HenryCo Accounts",
  support: "HenryCo Support",
  newsletter: "HenryCo Editorial",
  care: "HenryCo Care",
  studio: "HenryCo Studio",
  marketplace: "HenryCo Marketplace",
  jobs: "HenryCo Jobs",
  learn: "HenryCo Learn",
  property: "HenryCo Property",
  logistics: "HenryCo Logistics",
  security: "HenryCo Security",
  generic: "HenryCo",
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

export type HenryCoEmailSection = {
  label: string;
  value: string;
};

export type HenryCoEmailLayout = {
  purpose: EmailPurpose;
  subject: string;
  /** Override the auto-derived purpose kicker (e.g., "HenryCo Studio") */
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
 * Inline SVG monogram rendered in the header of every email so the
 * brand identity carries past clients that strip remote images. The
 * `H` armature mirrors the in-app HenryCoMonogram primitive; the
 * accent rule below it picks up the per-division palette to tie the
 * email to the website tone the recipient will land on.
 */
function renderBrandMark(palette: ResolvedPalette): string {
  // 28px monogram, inline so Gmail / Outlook can render it without
  // remote-image blocking. Encoded as a data URI to keep the email
  // body fully self-contained.
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 54 64' width='28' height='28' aria-hidden='true'><g fill='none' stroke='%23f5faff' stroke-width='2.6' stroke-linecap='square'><path d='M9 7 H17 V57 H9 Z'/><path d='M37 7 H45 V57 H37 Z'/><path d='M9 28 H45 V34 H9 Z'/></g><rect x='6.5' y='7' width='13' height='2' fill='${encodeURIComponent(palette.accent)}'/><rect x='34.5' y='55' width='13' height='2' fill='${encodeURIComponent(palette.accent)}'/></svg>`;
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;">
      <tr>
        <td style="width:48px; height:48px; padding:0; background-color:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; text-align:center; vertical-align:middle;">
          <img src="data:image/svg+xml;utf8,${svg}" alt="HenryCo" width="28" height="28" style="display:inline-block; border:0; outline:none; text-decoration:none;" />
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
  const cta = renderCta(layout.actionLabel, layout.actionHref, palette);
  const body = layout.body
    ? `<p style="margin:18px 0 0 0; font-size:15px; line-height:1.75; color:${t.bodyText};">${escapeHtml(layout.body)}</p>`
    : "";
  const footnote = layout.footnote
    ? `<p style="margin:24px 0 0 0; font-size:12.5px; line-height:1.7; color:${t.mutedText};">${escapeHtml(layout.footnote)}</p>`
    : "";
  const supportLine = layout.supportLine
    ? `<p style="margin:8px 0 0 0; font-size:12.5px; line-height:1.7; color:${t.mutedText};">${escapeHtml(layout.supportLine)}</p>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark light" />
    <meta name="supported-color-schemes" content="dark light" />
    <title>${escapeHtml(layout.subject)}</title>
  </head>
  <body style="margin:0; padding:0; background-color:${t.outerBg}; color:${t.bodyText}; font-family:${HENRYCO_EMAIL_FONT_STACK};">
    <span style="display:none; visibility:hidden; opacity:0; max-height:0; max-width:0; overflow:hidden; mso-hide:all;">${escapeHtml(layout.intro)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${t.outerBg}; padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; background-color:${t.cardBg}; border:1px solid ${t.cardBorder}; border-radius:22px; overflow:hidden;">
            <tr>
              <td style="padding:36px 32px 28px 32px; background-color:${t.cardBg};">
                ${brandMark}
                <div style="height:2px; width:46px; background-color:${palette.accent}; border-radius:999px;"></div>
                <div style="margin-top:18px; font-size:11px; font-weight:700; letter-spacing:0.28em; text-transform:uppercase; color:${palette.accent};">${escapeHtml(eyebrow)}</div>
                <h1 style="margin:14px 0 0 0; font-size:26px; line-height:1.25; font-weight:700; color:${t.heroText}; letter-spacing:-0.01em;">${escapeHtml(layout.title)}</h1>
                <p style="margin:14px 0 0 0; font-size:15.5px; line-height:1.75; color:${t.heroText};">${escapeHtml(layout.intro)}</p>
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
              <td style="padding:18px 32px 28px 32px; background-color:${t.cardBg}; border-top:1px solid ${t.divider};">
                <p style="margin:0; font-size:11.5px; line-height:1.7; color:${t.footerText};">
                  This is a HenryCo transactional message. You received it because of an action on your HenryCo account.
                </p>
                <p style="margin:6px 0 0 0; font-size:11.5px; line-height:1.7; color:${t.footerText};">
                  &copy; ${new Date().getFullYear()} HenryCo. All rights reserved.
                </p>
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
    lines.push(`${layout.actionLabel}: ${layout.actionHref}`);
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
