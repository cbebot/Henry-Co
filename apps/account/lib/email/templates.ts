// HenryCo Account Email Templates
// All templates return plain HTML strings for Resend

const BRAND_COLOR = "#C9A227";
const BG_COLOR = "#FAFAF8";
const DARK_TEXT = "#1A1814";
const MUTED_TEXT = "#6B6560";

function layout(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin: 0; padding: 0; background: ${BG_COLOR}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: ${DARK_TEXT}; }
  .wrapper { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
  .card { background: #FFFFFF; border: 1px solid #E8E4DD; border-radius: 20px; padding: 32px; }
  .brand { text-align: center; margin-bottom: 24px; }
  .brand-logo { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: ${BRAND_COLOR}; color: white; font-weight: bold; font-size: 18px; border-radius: 12px; }
  h1 { font-size: 22px; font-weight: 700; margin: 0 0 8px; }
  p { font-size: 15px; line-height: 1.6; color: ${MUTED_TEXT}; margin: 0 0 16px; }
  .btn { display: inline-block; padding: 12px 28px; background: ${BRAND_COLOR}; color: white !important; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 12px; }
  .footer { text-align: center; margin-top: 24px; font-size: 12px; color: ${MUTED_TEXT}; }
  .metric { background: #F5F3EF; border-radius: 12px; padding: 16px; margin: 12px 0; }
  .metric-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: ${MUTED_TEXT}; }
  .metric-value { font-size: 24px; font-weight: 700; color: ${DARK_TEXT}; margin-top: 4px; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="brand"><div class="brand-logo">H</div></div>
  <div class="card">${content}</div>
  <div class="footer">
    <p>Henry & Co. Group &middot; <a href="https://account.henrycogroup.com" style="color:${BRAND_COLOR}">Manage account</a></p>
    <p>You received this because you have an account with HenryCo.</p>
  </div>
</div>
</body>
</html>`;
}

export function welcomeEmail(name: string) {
  return {
    subject: "Welcome to HenryCo",
    html: layout(`
      <h1>Welcome to Henry & Co., ${name || "there"}!</h1>
      <p>Your unified HenryCo account is ready. From here you can manage everything across all our services — Care, Marketplace, Studio, and more.</p>
      <p>Here's what you can do:</p>
      <ul style="color:${MUTED_TEXT};font-size:15px;line-height:2;">
        <li>Fund your HenryCo Wallet for quick payments</li>
        <li>Track orders, bookings, and projects</li>
        <li>Manage addresses and payment methods</li>
        <li>Get unified support across all services</li>
      </ul>
      <p style="text-align:center;margin-top:24px;">
        <a href="https://account.henrycogroup.com" class="btn">Go to your dashboard</a>
      </p>
    `),
  };
}

export function securityAlertEmail(event: string, details: string) {
  return {
    subject: `Security alert: ${event}`,
    html: layout(`
      <h1>Security Alert</h1>
      <p>We detected a security event on your HenryCo account:</p>
      <div class="metric">
        <div class="metric-label">Event</div>
        <div class="metric-value" style="font-size:16px;">${event}</div>
      </div>
      <p>${details}</p>
      <p>If this wasn't you, please change your password immediately and contact support.</p>
      <p style="text-align:center;margin-top:24px;">
        <a href="https://account.henrycogroup.com/security" class="btn">Review security</a>
      </p>
    `),
  };
}

export function walletFundedEmail(name: string, amountNaira: number, newBalanceNaira: number) {
  return {
    subject: `NGN ${amountNaira.toLocaleString()} added to your wallet`,
    html: layout(`
      <h1>Wallet funded</h1>
      <p>Hi ${name || "there"}, money has been added to your HenryCo Wallet.</p>
      <div class="metric">
        <div class="metric-label">Amount added</div>
        <div class="metric-value" style="color:#10B981;">+NGN ${amountNaira.toLocaleString()}</div>
      </div>
      <div class="metric">
        <div class="metric-label">New balance</div>
        <div class="metric-value">NGN ${newBalanceNaira.toLocaleString()}</div>
      </div>
      <p style="text-align:center;margin-top:24px;">
        <a href="https://account.henrycogroup.com/wallet" class="btn">View wallet</a>
      </p>
    `),
  };
}

export function paymentConfirmationEmail(name: string, amountNaira: number, description: string, division: string) {
  return {
    subject: `Payment confirmed — NGN ${amountNaira.toLocaleString()}`,
    html: layout(`
      <h1>Payment confirmed</h1>
      <p>Hi ${name || "there"}, your payment has been processed.</p>
      <div class="metric">
        <div class="metric-label">Amount</div>
        <div class="metric-value">NGN ${amountNaira.toLocaleString()}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Service</div>
        <div class="metric-value" style="font-size:16px;">${division}</div>
      </div>
      <p>${description}</p>
      <p style="text-align:center;margin-top:24px;">
        <a href="https://account.henrycogroup.com/invoices" class="btn">View receipt</a>
      </p>
    `),
  };
}

export function supportUpdateEmail(name: string, subject: string, threadId: string) {
  return {
    subject: `Update on: ${subject}`,
    html: layout(`
      <h1>Support update</h1>
      <p>Hi ${name || "there"}, there's a new update on your support request:</p>
      <div class="metric">
        <div class="metric-label">Request</div>
        <div class="metric-value" style="font-size:16px;">${subject}</div>
      </div>
      <p style="text-align:center;margin-top:24px;">
        <a href="https://account.henrycogroup.com/support/${threadId}" class="btn">View conversation</a>
      </p>
    `),
  };
}

export function subscriptionChangeEmail(name: string, planName: string, action: "activated" | "cancelled" | "renewed" | "paused") {
  const actionText: Record<string, string> = {
    activated: "has been activated",
    cancelled: "has been cancelled",
    renewed: "has been renewed",
    paused: "has been paused",
  };

  return {
    subject: `Subscription ${action}: ${planName}`,
    html: layout(`
      <h1>Subscription ${action}</h1>
      <p>Hi ${name || "there"}, your subscription <strong>${planName}</strong> ${actionText[action]}.</p>
      <p style="text-align:center;margin-top:24px;">
        <a href="https://account.henrycogroup.com/subscriptions" class="btn">Manage subscriptions</a>
      </p>
    `),
  };
}

export function weeklyDigestEmail(
  name: string,
  stats: { activity: number; notifications: number; walletBalance: number }
) {
  return {
    subject: "Your weekly HenryCo summary",
    html: layout(`
      <h1>Your week at HenryCo</h1>
      <p>Hi ${name || "there"}, here's a quick look at your account this week.</p>
      <div style="display:flex;gap:12px;">
        <div class="metric" style="flex:1;text-align:center;">
          <div class="metric-label">Activities</div>
          <div class="metric-value">${stats.activity}</div>
        </div>
        <div class="metric" style="flex:1;text-align:center;">
          <div class="metric-label">Notifications</div>
          <div class="metric-value">${stats.notifications}</div>
        </div>
        <div class="metric" style="flex:1;text-align:center;">
          <div class="metric-label">Wallet</div>
          <div class="metric-value">NGN ${stats.walletBalance.toLocaleString()}</div>
        </div>
      </div>
      <p style="text-align:center;margin-top:24px;">
        <a href="https://account.henrycogroup.com" class="btn">Go to dashboard</a>
      </p>
    `),
  };
}
