import "server-only";

import { Resend } from "resend";
import { getOptionalEnv } from "@/lib/env";

const RESEND_API_KEY = getOptionalEnv("RESEND_API_KEY");
const FROM_EMAIL = getOptionalEnv("RESEND_FROM_EMAIL") || "HenryCo <noreply@henrycogroup.com>";

let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  if (!RESEND_API_KEY) return null;
  if (!resendInstance) resendInstance = new Resend(RESEND_API_KEY);
  return resendInstance;
}

export async function sendAccountEmail(
  to: string,
  template: { subject: string; html: string }
): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] Resend not configured, skipping email to", to);
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: template.subject,
      html: template.html,
    });

    if (error) {
      console.error("[email] Send failed:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] Send error:", err);
    return false;
  }
}
