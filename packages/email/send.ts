import { sendSesEmail } from "./providers/ses";
import { resolveSenderIdentity } from "./sender-identity";
import type { EmailDispatchResult, SendTransactionalEmailInput } from "./types";

export type ResolvedEmailProvider =
  | { provider: "ses"; reason: "configured" }
  | { provider: "none"; reason: "no_provider_configured" };

function applySenderIdentity(input: SendTransactionalEmailInput): SendTransactionalEmailInput {
  if (!input.purpose) return input;
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

  return sendSesEmail(applySenderIdentity(input));
}
