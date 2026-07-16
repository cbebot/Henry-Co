import { getPostmarkServerToken, sendPostmarkEmail } from "./providers/postmark";
import { resolveSenderIdentity } from "./sender-identity";
import type {
  EmailDispatchResult,
  EmailProviderId,
  EmailPurpose,
  SendTransactionalEmailInput,
} from "./types";

export type ResolvedEmailProvider =
  | { provider: "postmark"; reason: "default" }
  | { provider: "none"; reason: "no_provider_configured" };

/**
 * EMAIL-POSTMARK (2026-07-14) — Postmark is the ONLY outbound email rail.
 *
 * Amazon SES and the earlier Resend/Brevo vendors are permanently retired
 * (owner directive: every email going out from the company ships through
 * Postmark). That retirement is a CODE invariant, not an env accident: the
 * chain below can never contain another provider, so a leftover AWS_SES_* /
 * RESEND_API_KEY / BREVO_API_KEY on some deployment can never silently
 * re-route mail through a retired vendor. EMAIL_PROVIDER /
 * EMAIL_FALLBACK_PROVIDER are intentionally ignored for the same reason.
 *
 * Every purpose (auth, support, newsletter, per-division transactional) rides
 * Postmark. Channel separation (V2-PNH-03B) is preserved where it always
 * mattered — in sender identity (which mailbox a purpose sends FROM, see
 * `resolveSenderIdentity`) and now additionally in Postmark Message Streams
 * (which reputation lane it rides, see `resolvePostmarkStream`) — not in
 * vendor routing.
 */
export function resolveProviderChain(purpose?: EmailPurpose): EmailProviderId[] {
  // The purpose parameter stays for API stability; routing no longer varies
  // by purpose — one rail for everything.
  void purpose;
  return getPostmarkServerToken() ? ["postmark"] : [];
}

/**
 * Back-compat single-provider resolver — the primary of the chain.
 */
export function resolveEmailProvider(purpose?: EmailPurpose): ResolvedEmailProvider {
  return resolveProviderChain(purpose).length > 0
    ? { provider: "postmark", reason: "default" }
    : { provider: "none", reason: "no_provider_configured" };
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

  if (resolveProviderChain(enriched.purpose).length === 0) {
    return {
      provider: "none",
      status: "skipped",
      skippedReason: "No email provider is configured for this deployment.",
    };
  }

  return sendPostmarkEmail(enriched);
}
