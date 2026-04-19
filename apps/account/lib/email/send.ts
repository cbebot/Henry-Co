import "server-only";

import { Resend } from "resend";
import { getOptionalEnv } from "@/lib/env";

// ─── env ───────────────────────────────────────────────────────────────────
// Active provider is controlled by EMAIL_PROVIDER env var.
//   "resend" (default) → requires RESEND_API_KEY
//   "brevo"            → requires BREVO_API_KEY + optionally BREVO_SENDER_NAME / BREVO_SENDER_EMAIL
//
// Brevo transactional send endpoint: https://api.brevo.com/v3/smtp/email
// Required env vars for Brevo:
//   BREVO_API_KEY        — account-level transactional API key (api-key header)
//   BREVO_SENDER_EMAIL   — verified sender address (e.g. noreply@henrycogroup.com)
//   BREVO_SENDER_NAME    — display name (e.g. HenryCo)
// ───────────────────────────────────────────────────────────────────────────

const EMAIL_PROVIDER = getOptionalEnv("EMAIL_PROVIDER") || "resend";

const RESEND_API_KEY = getOptionalEnv("RESEND_API_KEY");
const RESEND_FROM = getOptionalEnv("RESEND_FROM_EMAIL") || "HenryCo <noreply@henrycogroup.com>";

const BREVO_API_KEY = getOptionalEnv("BREVO_API_KEY");
const BREVO_SENDER_EMAIL = getOptionalEnv("BREVO_SENDER_EMAIL") || "noreply@henrycogroup.com";
const BREVO_SENDER_NAME = getOptionalEnv("BREVO_SENDER_NAME") || "HenryCo";

let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  if (!RESEND_API_KEY) return null;
  if (!resendInstance) resendInstance = new Resend(RESEND_API_KEY);
  return resendInstance;
}

async function sendViaResend(to: string, subject: string, html: string): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email/resend] RESEND_API_KEY is not configured, skipping email to", to);
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: RESEND_FROM,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[email/resend] Send failed:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email/resend] Send error:", err);
    return false;
  }
}

async function sendViaBrevo(to: string, subject: string, html: string): Promise<boolean> {
  if (!BREVO_API_KEY) {
    console.warn("[email/brevo] BREVO_API_KEY is not configured, skipping email to", to);
    return false;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      console.error("[email/brevo] Send failed:", payload?.message || response.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email/brevo] Send error:", err);
    return false;
  }
}

export async function sendAccountEmail(
  to: string,
  template: { subject: string; html: string }
): Promise<boolean> {
  if (EMAIL_PROVIDER === "brevo") {
    return sendViaBrevo(to, template.subject, template.html);
  }
  return sendViaResend(to, template.subject, template.html);
}
