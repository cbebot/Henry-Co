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

  const html = `
  <body style="margin:0;padding:0;background:#f6f1e7;font-family:Manrope,Aptos,Segoe UI,sans-serif;color:#1d1811;">
    <div style="max-width:640px;margin:0 auto;padding:32px 20px 48px;">
      <div style="border:1px solid rgba(63,44,18,0.12);background:rgba(255,251,245,0.94);border-radius:28px;overflow:hidden;box-shadow:0 24px 80px rgba(45,28,9,0.12);">
        <div style="padding:28px 28px 12px;background:linear-gradient(135deg,#fffaf2 0%,#f3e3c5 100%);">
          <div style="font-size:11px;letter-spacing:0.28em;text-transform:uppercase;font-weight:800;color:#b2863b;">
            ${escapeHtml(input.eyebrow)}
          </div>
          <h1 style="margin:18px 0 0;font-family:Fraunces,Georgia,serif;font-size:36px;line-height:1.02;letter-spacing:-0.03em;">
            ${escapeHtml(input.headline)}
          </h1>
          <p style="margin:18px 0 0;font-size:15px;line-height:1.8;color:#6e6557;">
            ${escapeHtml(input.summary)}
          </p>
        </div>
        <div style="padding:0 28px 28px;">
          ${bulletMarkup}
          ${
            input.secondaryLine
              ? `<p style="margin:0 0 24px;font-size:14px;line-height:1.8;color:#6e6557;">${escapeHtml(
                  input.secondaryLine
                )}</p>`
              : ""
          }
          ${
            input.ctaLabel
              ? `<a href="${escapeHtml(ctaHref)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:linear-gradient(135deg,#7e5f2d 0%,#b2863b 58%,#dec48a 100%);color:#fffaf2;font-size:14px;font-weight:700;text-decoration:none;">${escapeHtml(
                  input.ctaLabel
                )}</a>`
              : ""
          }
          <div style="margin-top:28px;padding-top:24px;border-top:1px solid rgba(63,44,18,0.12);font-size:13px;line-height:1.8;color:#6e6557;">
            <div style="font-weight:700;color:#1d1811;">${escapeHtml(marketplace.name)}</div>
            <div>${escapeHtml(marketplace.tagline)}</div>
            <div style="margin-top:10px;">Support: ${escapeHtml(marketplace.supportEmail)} · ${escapeHtml(
              marketplace.supportPhone
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
