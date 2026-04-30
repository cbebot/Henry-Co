import "server-only";

import { sendTransactionalEmail } from "@henryco/email";

export async function sendAccountEmail(
  to: string,
  template: { subject: string; html: string },
): Promise<boolean> {
  const result = await sendTransactionalEmail({
    to,
    purpose: "auth",
    subject: template.subject,
    html: template.html,
  });

  if (result.status === "sent") return true;

  if (result.status === "skipped") {
    console.warn("[email/account] Skipped:", result.skippedReason || "unknown reason");
  } else {
    console.error("[email/account] Send failed:", result.safeError || "unknown error");
  }
  return false;
}
