import "server-only";

import { COMPANY } from "@henryco/config";
import {
  renderHenryCoEmail,
  renderHenryCoEmailText,
  sendTransactionalEmail,
} from "@henryco/email";

import {
  buildSignInSecurityLayout,
  type SignInSecurityEmailInput,
} from "./security-email-content";

/**
 * Render + send the "Was this you?" sign-in alert. The brand name comes from
 * the single source of truth (never hardcoded), and the send uses the
 * `security` purpose so it is signed/labelled as "Henry Onyx Security".
 */
export async function sendSignInSecurityEmail(
  to: string,
  input: Omit<SignInSecurityEmailInput, "brandName">,
): Promise<boolean> {
  const layout = buildSignInSecurityLayout({
    ...input,
    brandName: COMPANY.group.name,
  });

  const result = await sendTransactionalEmail({
    to,
    purpose: "security",
    subject: layout.subject,
    html: renderHenryCoEmail(layout),
    text: renderHenryCoEmailText(layout),
  });

  return result.status === "sent";
}
