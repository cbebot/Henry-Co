import "server-only";

import { sendTransactionalEmail } from "@henryco/config/email";
import { getOptionalEnv } from "@/lib/env";

export async function sendAccountEmail(
  to: string,
  template: { subject: string; html: string }
): Promise<boolean> {
  const result = await sendTransactionalEmail({
    to,
    subject: template.subject,
    html: template.html,
    fromName: "HenryCo Account",
    fromEmail: getOptionalEnv("BREVO_SENDER_EMAIL") || "noreply@henrycogroup.com",
    replyTo: getOptionalEnv("BREVO_REPLY_TO_EMAIL") || "support@henrycogroup.com",
    missingConfigStatus: "queued",
    tags: ["account"],
  });

  if (!result.ok && result.status !== "failed") {
    console.warn("[email] Brevo not configured, skipping email to", to);
    return false;
  }

  if (!result.ok) {
    console.error("[email] Send error:", result.reason);
    return false;
  }

  return true;
}
