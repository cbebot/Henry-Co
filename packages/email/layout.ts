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

function renderHighlight(label?: string | null, value?: string | null): string {
  if (!label && !value) return "";
  const t = HENRYCO_EMAIL_TOKENS;
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;">
      <tr>
        <td style="padding:14px 18px; background-color:${t.accentSoft}; border:1px solid rgba(244,196,84,0.3); border-radius:14px;">
          ${label ? `<div style="font-size:10.5px; letter-spacing:0.24em; text-transform:uppercase; color:${t.accent}; font-weight:700;">${escapeHtml(label)}</div>` : ""}
          ${value ? `<div style="margin-top:6px; font-size:18px; line-height:1.4; color:${t.heroText}; font-weight:600;">${escapeHtml(value)}</div>` : ""}
        </td>
      </tr>
    </table>`;
}

function renderCta(label?: string | null, href?: string | null): string {
  if (!label || !href) return "";
  const t = HENRYCO_EMAIL_TOKENS;
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;">
      <tr>
        <td style="border-radius:999px; background-color:${t.ctaBg}; border:1px solid ${t.ctaBorder};">
          <a href="${escapeHtml(href)}" style="display:inline-block; padding:14px 26px; font-size:14.5px; font-weight:700; color:${t.ctaText}; text-decoration:none; border-radius:999px; letter-spacing:0.01em;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:14px 0 0 0; font-size:12px; line-height:1.6; color:${t.mutedText};">If the button doesn&rsquo;t work, copy this link into your browser:<br/><a href="${escapeHtml(href)}" style="color:${t.accent}; word-break:break-all;">${escapeHtml(href)}</a></p>`;
}

/**
 * Render a HenryCo-branded transactional email. Output is dark-mode-safe
 * across Gmail (web + mobile), Apple Mail, and Outlook (with graceful
 * degradation in MSO).
 */
export function renderHenryCoEmail(layout: HenryCoEmailLayout): string {
  const t = HENRYCO_EMAIL_TOKENS;
  const eyebrow = layout.eyebrow || PURPOSE_KICKER[layout.purpose];
  const sections = renderSections(layout.sections || []);
  const bullets = renderBullets(layout.bullets || []);
  const highlight = renderHighlight(layout.highlightLabel, layout.highlightValue);
  const cta = renderCta(layout.actionLabel, layout.actionHref);
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
  <body style="margin:0; padding:0; background-color:${t.outerBg}; color:${t.bodyText}; font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;">
    <span style="display:none; visibility:hidden; opacity:0; max-height:0; max-width:0; overflow:hidden; mso-hide:all;">${escapeHtml(layout.intro)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${t.outerBg}; padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; background-color:${t.cardBg}; border:1px solid ${t.cardBorder}; border-radius:22px; overflow:hidden;">
            <tr>
              <td style="padding:36px 32px 28px 32px; background-color:${t.cardBg};">
                <div style="height:2px; width:46px; background-color:${t.accent}; border-radius:999px;"></div>
                <div style="margin-top:18px; font-size:11px; font-weight:700; letter-spacing:0.28em; text-transform:uppercase; color:${t.accent};">${escapeHtml(eyebrow)}</div>
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
