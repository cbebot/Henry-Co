import { getDivisionConfig, getDivisionUrl } from "@henryco/config";

export type MarketplaceTemplateKey =
  | "buyer_welcome"
  | "cart_saved"
  | "checkout_started"
  | "payment_instructions"
  | "order_confirmed"
  | "order_packed"
  | "vendor_application_submitted"
  | "vendor_application_approved"
  | "vendor_application_rejected"
  | "vendor_application_changes_requested"
  | "seller_onboarding_complete"
  | "product_submitted_for_review"
  | "product_approved"
  | "product_changes_requested"
  | "product_rejected"
  | "order_placed"
  | "payment_reminder"
  | "payment_verified"
  | "order_shipped"
  | "order_delivered"
  | "order_delayed"
  | "return_requested"
  | "dispute_opened"
  | "dispute_updated"
  | "dispute_resolved"
  | "refund_approved"
  | "refund_rejected"
  | "payout_requested"
  | "payout_approved"
  | "payout_rejected"
  | "low_stock"
  | "stale_order"
  | "abandoned_cart"
  | "featured_campaign_alert"
  | "review_request"
  | "review_moderation_outcome"
  | "support_reply"
  | "support_escalation"
  | "security_notice"
  | "owner_alert";

export type MarketplaceTemplateInput = {
  templateKey: MarketplaceTemplateKey;
  preview?: string;
  eyebrow: string;
  headline: string;
  summary: string;
  bullets?: string[];
  ctaLabel?: string;
  ctaHref?: string | null;
  secondaryLine?: string | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderMarketplaceEmailTemplate(input: MarketplaceTemplateInput) {
  const marketplace = getDivisionConfig("marketplace");
  const marketplaceUrl = getDivisionUrl("marketplace");
  const ctaHref = input.ctaHref || marketplaceUrl;
  const bullets = input.bullets?.filter(Boolean) ?? [];
  const preview = input.preview || input.summary;

  const subject = `${input.headline} | ${marketplace.shortName}`;
  const bulletMarkup = bullets.length
    ? `<ul style="margin:20px 0;padding-left:20px;color:#6e6557;line-height:1.8;">${bullets
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("")}</ul>`
    : "";

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
  body { margin:0; padding:0; background:#f6f1e7; font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; color:#1d1811; -webkit-font-smoothing:antialiased; }
  .wrap { max-width:640px; margin:0 auto; padding:32px 20px 48px; }
  .card { border:1px solid rgba(63,44,18,0.12); background:rgba(255,251,245,0.96); border-radius:28px; overflow:hidden; box-shadow:0 24px 80px rgba(45,28,9,0.12); }
  .hero { padding:28px 28px 12px; background:linear-gradient(135deg,#fffaf2 0%,#f3e3c5 100%); }
  .eyebrow { font-size:11px; letter-spacing:0.28em; text-transform:uppercase; font-weight:800; color:#b2863b; }
  h1 { margin:18px 0 0; font-family:'Source Serif 4',Georgia,Cambria,'Times New Roman',serif; font-size:34px; line-height:1.05; letter-spacing:-0.03em; color:#1d1811; }
  .lede { margin:18px 0 0; font-size:15px; line-height:1.8; color:#6e6557; }
  .body { padding:0 28px 28px; }
  ul { margin:20px 0; padding-left:20px; color:#6e6557; line-height:1.8; }
  .secondary { margin:0 0 24px; font-size:14px; line-height:1.8; color:#6e6557; }
  .cta { display:inline-block; padding:14px 24px; border-radius:999px; background:linear-gradient(135deg,#7e5f2d 0%,#b2863b 58%,#dec48a 100%); color:#fffaf2 !important; font-size:14px; font-weight:700; text-decoration:none; }
  .sig { margin-top:28px; padding-top:24px; border-top:1px solid rgba(63,44,18,0.12); font-size:13px; line-height:1.8; color:#6e6557; }
  .sig-brand { font-weight:800; color:#1d1811; letter-spacing:-0.005em; }
  .attribution { display:inline-flex; align-items:center; gap:6px; margin-top:14px; font-size:10px; font-weight:700; letter-spacing:0.22em; text-transform:uppercase; color:#6e6557; }
  .attribution::before { content:''; display:inline-block; width:5px; height:5px; border-radius:999px; background:#b2863b; }

  @media (prefers-color-scheme: dark) {
    body { background:#0c0906 !important; color:#f1e7d2 !important; }
    .card { background:#17120a !important; border-color:#2d2319 !important; box-shadow:0 32px 90px rgba(0,0,0,0.62) !important; }
    .hero { background:linear-gradient(135deg,#17120a 0%,#3a2d18 100%) !important; }
    .eyebrow { color:#e1b870 !important; }
    h1 { color:#f6e8c8 !important; }
    .lede, ul, .secondary, .sig { color:#b4a286 !important; }
    .sig-brand { color:#f6e8c8 !important; }
    .attribution { color:#9b8969 !important; }
    .cta { color:#17120a !important; }
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
        ${bulletMarkup}
        ${
          input.secondaryLine
            ? `<p class="secondary">${escapeHtml(input.secondaryLine)}</p>`
            : ""
        }
        ${
          input.ctaLabel
            ? `<a href="${escapeHtml(ctaHref)}" class="cta">${escapeHtml(input.ctaLabel)}</a>`
            : ""
        }
        <div class="sig">
          <div class="sig-brand">${escapeHtml(marketplace.name)}</div>
          <div>${escapeHtml(marketplace.tagline)}</div>
          <div style="margin-top:10px;">Support: ${escapeHtml(marketplace.supportEmail)} &middot; ${escapeHtml(marketplace.supportPhone)}</div>
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
    bullets.length ? "" : null,
    ...bullets.map((item) => `- ${item}`),
    input.secondaryLine ? "" : null,
    input.secondaryLine || null,
    input.ctaLabel ? "" : null,
    input.ctaLabel ? `${input.ctaLabel}: ${ctaHref}` : null,
    "",
    `${marketplace.name}`,
    marketplace.tagline,
    `Support: ${marketplace.supportEmail} | ${marketplace.supportPhone}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject,
    preview,
    html,
    text,
    templateKey: input.templateKey,
  };
}
