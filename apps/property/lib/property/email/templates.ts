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

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(input.headline)}</title>
<style>
  :root { color-scheme: light dark; }
  body { margin:0; padding:0; background:#f5eee9; font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; color:#1c1511; -webkit-font-smoothing:antialiased; }
  .wrap { max-width:640px; margin:0 auto; padding:32px 20px 48px; }
  .card { border:1px solid rgba(74,44,24,0.1); background:rgba(255,251,248,0.96); border-radius:28px; overflow:hidden; box-shadow:0 24px 80px rgba(39,22,12,0.12); }
  .hero { padding:28px 28px 12px; background:linear-gradient(135deg,#fff9f5 0%,#f2d8ca 100%); }
  .eyebrow { font-size:11px; letter-spacing:0.28em; text-transform:uppercase; font-weight:800; color:#b06c3e; }
  h1 { margin:18px 0 0; font-family:'Source Serif 4',Georgia,Cambria,'Times New Roman',serif; font-size:34px; line-height:1.05; letter-spacing:-0.03em; color:#1c1511; }
  .lede { margin:18px 0 0; font-size:15px; line-height:1.8; color:#6e5d54; }
  .body { padding:0 28px 28px; }
  ul { margin:20px 0; padding-left:20px; color:#6e5d54; line-height:1.8; }
  .cta { display:inline-block; padding:14px 24px; border-radius:999px; background:linear-gradient(135deg,#7f4e2f 0%,#b06c3e 58%,#e3b38e 100%); color:#fffaf6 !important; font-size:14px; font-weight:700; text-decoration:none; }
  .sig { margin-top:28px; padding-top:24px; border-top:1px solid rgba(74,44,24,0.1); font-size:13px; line-height:1.8; color:#6e5d54; }
  .sig-brand { font-weight:800; color:#1c1511; letter-spacing:-0.005em; }
  .attribution { display:inline-flex; align-items:center; gap:6px; margin-top:14px; font-size:10px; font-weight:700; letter-spacing:0.22em; text-transform:uppercase; color:#6e5d54; }
  .attribution::before { content:''; display:inline-block; width:5px; height:5px; border-radius:999px; background:#b06c3e; }

  @media (prefers-color-scheme: dark) {
    body { background:#0d0806 !important; color:#f1e6dc !important; }
    .card { background:#1a1210 !important; border-color:#2d201a !important; box-shadow:0 32px 90px rgba(0,0,0,0.6) !important; }
    .hero { background:linear-gradient(135deg,#1a1210 0%,#3b281f 100%) !important; }
    .eyebrow { color:#dfa781 !important; }
    h1 { color:#f6ead0 !important; }
    .lede, ul, .sig { color:#b4998a !important; }
    .sig-brand { color:#f6ead0 !important; }
    .attribution { color:#9c8273 !important; }
    .cta { color:#1a1210 !important; }
  }
</style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="hero">
        <div class="eyebrow">${escapeHtml(input.eyebrow)}</div>
        <h1>${escapeHtml(input.headline)}</h1>
        <p class="lede">${escapeHtml(input.summary)}</p>
      </div>
      <div class="body">
        ${
          bullets.length
            ? `<ul>${bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
            : ""
        }
        ${
          input.ctaLabel
            ? `<a href="${escapeHtml(ctaHref)}" class="cta">${escapeHtml(input.ctaLabel)}</a>`
            : ""
        }
        <div class="sig">
          <div class="sig-brand">${escapeHtml(property.name)}</div>
          <div>${escapeHtml(property.tagline)}</div>
          <div style="margin-top:10px;">Support: ${escapeHtml(property.supportEmail)} &middot; ${escapeHtml(property.supportPhone)}</div>
          <div class="attribution">Designed by HenryCo Studio</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

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
