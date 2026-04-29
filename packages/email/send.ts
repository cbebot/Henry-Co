import { getBrevoApiKey, sendBrevoEmail } from "./providers/brevo";
import { getResendApiKey, sendResendEmail } from "./providers/resend";
import type {
  EmailDispatchResult,
  EmailProviderId,
  SendTransactionalEmailInput,
} from "./types";

export type ResolvedEmailProvider =
  | { provider: "brevo"; reason: "explicit" | "fallback" }
  | { provider: "resend"; reason: "default" | "explicit" | "fallback" }
  | { provider: "none"; reason: "no_provider_configured" };

function readPreference(): EmailProviderId | null {
  const raw = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (raw === "brevo" || raw === "resend") return raw;
  return null;
}

export function resolveEmailProvider(): ResolvedEmailProvider {
  const preference = readPreference();
  const brevoConfigured = Boolean(getBrevoApiKey());
  const resendConfigured = Boolean(getResendApiKey());

  if (preference === "brevo") {
    if (brevoConfigured) return { provider: "brevo", reason: "explicit" };
    if (resendConfigured) return { provider: "resend", reason: "fallback" };
    return { provider: "none", reason: "no_provider_configured" };
  }

  if (preference === "resend") {
    if (resendConfigured) return { provider: "resend", reason: "explicit" };
    if (brevoConfigured) return { provider: "brevo", reason: "fallback" };
    return { provider: "none", reason: "no_provider_configured" };
  }

  if (resendConfigured) return { provider: "resend", reason: "default" };
  if (brevoConfigured) return { provider: "brevo", reason: "fallback" };
  return { provider: "none", reason: "no_provider_configured" };
}

export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput,
): Promise<EmailDispatchResult> {
  if (!input.to || !input.to.trim()) {
    return {
      provider: "none",
      status: "skipped",
      skippedReason: "Recipient email is missing.",
    };
  }

  if (!input.html && !input.text) {
    return {
      provider: "none",
      status: "skipped",
      skippedReason: "Email body is missing — provide html or text.",
    };
  }

  const resolved = resolveEmailProvider();

  if (resolved.provider === "brevo") {
    return sendBrevoEmail(input);
  }
  if (resolved.provider === "resend") {
    return sendResendEmail(input);
  }

  return {
    provider: "none",
    status: "skipped",
    skippedReason: "No email provider is configured for this deployment.",
  };
}
