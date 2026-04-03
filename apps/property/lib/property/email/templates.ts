import { getDivisionConfig, getDivisionUrl } from "@henryco/config";

export type PropertyTemplateKey =
  | "inquiry_received"
  | "viewing_requested"
  | "viewing_scheduled"
  | "viewing_reminder"
  | "listing_submitted"
  | "listing_approved"
  | "listing_rejected"
  | "new_lead_alert"
  | "managed_update"
  | "support_alert"
  | "owner_alert";

export type PropertyTemplateInput = {
  templateKey: PropertyTemplateKey;
  eyebrow: string;
  headline: string;
  summary: string;
  bullets?: string[];
  ctaLabel?: string;
  ctaHref?: string | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderPropertyEmailTemplate(input: PropertyTemplateInput) {
  const property = getDivisionConfig("property");
  const propertyUrl = getDivisionUrl("property");
  const ctaHref = input.ctaHref || propertyUrl;
  const bullets = input.bullets?.filter(Boolean) ?? [];

  const subject = `${input.headline} | ${property.shortName}`;

  const html = `
  <body style="margin:0;padding:0;background:#f5eee9;font-family:Manrope,Aptos,Segoe UI,sans-serif;color:#1c1511;">
    <div style="max-width:640px;margin:0 auto;padding:32px 20px 48px;">
      <div style="border:1px solid rgba(74,44,24,0.1);background:rgba(255,251,248,0.95);border-radius:28px;overflow:hidden;box-shadow:0 24px 80px rgba(39,22,12,0.12);">
        <div style="padding:28px 28px 12px;background:linear-gradient(135deg,#fff9f5 0%,#f2d8ca 100%);">
          <div style="font-size:11px;letter-spacing:0.28em;text-transform:uppercase;font-weight:800;color:#b06c3e;">
            ${escapeHtml(input.eyebrow)}
          </div>
          <h1 style="margin:18px 0 0;font-family:Fraunces,Georgia,serif;font-size:36px;line-height:1.02;letter-spacing:-0.03em;">
            ${escapeHtml(input.headline)}
          </h1>
          <p style="margin:18px 0 0;font-size:15px;line-height:1.8;color:#6e5d54;">
            ${escapeHtml(input.summary)}
          </p>
        </div>
        <div style="padding:0 28px 28px;">
          ${
            bullets.length
              ? `<ul style="margin:20px 0;padding-left:20px;color:#6e5d54;line-height:1.8;">${bullets
                  .map((item) => `<li>${escapeHtml(item)}</li>`)
                  .join("")}</ul>`
              : ""
          }
          ${
            input.ctaLabel
              ? `<a href="${escapeHtml(ctaHref)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:linear-gradient(135deg,#7f4e2f 0%,#b06c3e 58%,#e3b38e 100%);color:#fffaf6;font-size:14px;font-weight:700;text-decoration:none;">${escapeHtml(
                  input.ctaLabel
                )}</a>`
              : ""
          }
          <div style="margin-top:28px;padding-top:24px;border-top:1px solid rgba(74,44,24,0.1);font-size:13px;line-height:1.8;color:#6e5d54;">
            <div style="font-weight:700;color:#1c1511;">${escapeHtml(property.name)}</div>
            <div>${escapeHtml(property.tagline)}</div>
            <div style="margin-top:10px;">Support: ${escapeHtml(property.supportEmail)} · ${escapeHtml(
              property.supportPhone
            )}</div>
          </div>
        </div>
      </div>
    </div>
  </body>`;

  const text = [
    input.eyebrow.toUpperCase(),
    input.headline,
    "",
    input.summary,
    ...bullets.map((item) => `- ${item}`),
    "",
    input.ctaLabel ? `${input.ctaLabel}: ${ctaHref}` : null,
    property.name,
    property.tagline,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject,
    html,
    text,
    templateKey: input.templateKey,
  };
}
