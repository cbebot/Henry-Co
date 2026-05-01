import { getBrevoApiKey, sendBrevoEmail } from "./providers/brevo";
import { getResendApiKey, sendResendEmail } from "./providers/resend";
import { resolveSenderIdentity } from "./sender-identity";
import type {
  EmailDispatchResult,
  EmailProviderId,
  EmailPurpose,
  SendTransactionalEmailInput,
} from "./types";

export type ResolvedEmailProvider =
  | { provider: "brevo"; reason: "explicit" | "fallback" | "purpose" }
  | { provider: "resend"; reason: "default" | "explicit" | "fallback" | "purpose" }
  | { provider: "none"; reason: "no_provider_configured" };

function readPreference(): EmailProviderId | null {
  const raw = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (raw === "brevo" || raw === "resend") return raw;
  return null;
}

function readFallback(): EmailProviderId | null {
  const raw = process.env.EMAIL_FALLBACK_PROVIDER?.trim().toLowerCase();
  if (raw === "brevo" || raw === "resend") return raw;
  return null;
}

/**
 * Provider routing rules (V2-PNH-03B channel separation):
 *  - purpose === "auth" prefers Resend (DKIM-authenticated henrycogroup.com),
 *    then Brevo as fallback. Auth and marketing must never share rails —
 *    the Brevo limit-exhaustion that broke production signup proved why.
 *  - purpose === "support" prefers Resend, then Brevo.
 *  - purpose === "newsletter" stays on Brevo (bulk sender, retained for
 *    editorial volume), with Resend as fallback only.
 *  - Without a purpose, the EMAIL_PROVIDER preference wins, then a
 *    configured fallback, then any provider that has a key.
 */
export function resolveEmailProvider(purpose?: EmailPurpose): ResolvedEmailProvider {
  const preference = readPreference();
  const fallback = readFallback();
  const brevoConfigured = Boolean(getBrevoApiKey());
  const resendConfigured = Boolean(getResendApiKey());

  if (purpose === "support" || purpose === "auth") {
    if (resendConfigured) return { provider: "resend", reason: "purpose" };
    if (brevoConfigured) return { provider: "brevo", reason: "fallback" };
    return { provider: "none", reason: "no_provider_configured" };
  }

  if (purpose === "newsletter") {
    if (brevoConfigured) return { provider: "brevo", reason: "purpose" };
    if (resendConfigured) return { provider: "resend", reason: "fallback" };
    return { provider: "none", reason: "no_provider_configured" };
  }

  if (preference === "brevo") {
    if (brevoConfigured) return { provider: "brevo", reason: "explicit" };
    if (fallback === "resend" && resendConfigured) return { provider: "resend", reason: "fallback" };
    if (resendConfigured) return { provider: "resend", reason: "fallback" };
    return { provider: "none", reason: "no_provider_configured" };
  }

  if (preference === "resend") {
    if (resendConfigured) return { provider: "resend", reason: "explicit" };
    if (fallback === "brevo" && brevoConfigured) return { provider: "brevo", reason: "fallback" };
    if (brevoConfigured) return { provider: "brevo", reason: "fallback" };
    return { provider: "none", reason: "no_provider_configured" };
  }

  if (resendConfigured) return { provider: "resend", reason: "default" };
  if (brevoConfigured) return { provider: "brevo", reason: "fallback" };
  return { provider: "none", reason: "no_provider_configured" };
}

function applySenderIdentity(input: SendTransactionalEmailInput): SendTransactionalEmailInput {
  if (!input.purpose) return input;
  // Explicit overrides win — never overwrite an explicit `from`/`fromName`.
  if (input.from && input.fromName) return input;
  const identity = resolveSenderIdentity(input.purpose);
  return {
    ...input,
    from: input.from || identity.email,
    fromName: input.fromName || identity.name,
  };
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

  const enriched = applySenderIdentity(input);
  const resolved = resolveEmailProvider(enriched.purpose);

  if (resolved.provider === "brevo") {
    return sendBrevoEmail(enriched);
  }
  if (resolved.provider === "resend") {
    return sendResendEmail(enriched);
  }

  return {
    provider: "none",
    status: "skipped",
    skippedReason: "No email provider is configured for this deployment.",
  };
}
