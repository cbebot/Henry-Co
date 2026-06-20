import { getBrevoApiKey, sendBrevoEmail } from "./providers/brevo";
import { getResendApiKey, sendResendEmail } from "./providers/resend";
import { getSesConfig, sendSesEmail } from "./providers/ses";
import { resolveSenderIdentity } from "./sender-identity";
import type {
  EmailDispatchResult,
  EmailProviderId,
  EmailPurpose,
  SendTransactionalEmailInput,
} from "./types";

export type ResolvedEmailProvider =
  | { provider: "ses"; reason: "default" | "explicit" | "fallback" | "purpose" }
  | { provider: "brevo"; reason: "explicit" | "fallback" | "purpose" }
  | { provider: "resend"; reason: "default" | "explicit" | "fallback" | "purpose" }
  | { provider: "none"; reason: "no_provider_configured" };

function readEnvProvider(name: "EMAIL_PROVIDER" | "EMAIL_FALLBACK_PROVIDER"): EmailProviderId | null {
  const raw = process.env[name]?.trim().toLowerCase();
  if (raw === "brevo" || raw === "resend" || raw === "ses") return raw;
  return null;
}

const readPreference = () => readEnvProvider("EMAIL_PROVIDER");
const readFallback = () => readEnvProvider("EMAIL_FALLBACK_PROVIDER");

function configuredProviders(): Record<EmailProviderId, boolean> {
  return {
    ses: Boolean(getSesConfig()),
    resend: Boolean(getResendApiKey()),
    brevo: Boolean(getBrevoApiKey()),
    none: false,
  };
}

/**
 * Ordered list of CONFIGURED providers to attempt, primary first.
 *
 * Channel separation (V2-PNH-03B) is preserved: transactional auth/support and
 * the per-division purposes ride the authenticated transactional rail (SES first
 * when configured, then Resend) and never depend on the bulk newsletter rail
 * (Brevo) except as a last-resort fallback. Newsletter stays Brevo-first.
 *
 * SES is purely additive: with no AWS_SES_* env, `getSesConfig()` is null so SES
 * is simply absent from the chain and routing is byte-identical to the pre-SES
 * Resend/Brevo behaviour. Set AWS_SES_* (or EMAIL_PROVIDER=ses) to make SES the
 * primary rail — ~$0.10 / 1,000 emails, no per-message vendor markup.
 */
export function resolveProviderChain(purpose?: EmailPurpose): EmailProviderId[] {
  const ok = configuredProviders();
  const chain: EmailProviderId[] = [];
  const add = (p: EmailProviderId | null) => {
    if (p && p !== "none" && ok[p] && !chain.includes(p)) chain.push(p);
  };

  if (purpose === "newsletter") {
    // Bulk/editorial sender stays Brevo-first; SES/Resend back it up.
    add("brevo");
    add("ses");
    add("resend");
    return chain;
  }

  if (purpose === "support" || purpose === "auth") {
    // Authenticated transactional rail: SES -> Resend -> Brevo (last resort).
    add("ses");
    add("resend");
    add("brevo");
    return chain;
  }

  // Generic + per-division transactional: an explicit preference leads, then an
  // explicit fallback, then the standard transactional order.
  add(readPreference());
  add(readFallback());
  add("ses");
  add("resend");
  add("brevo");
  return chain;
}

/**
 * Back-compat single-provider resolver — the primary of the chain.
 */
export function resolveEmailProvider(purpose?: EmailPurpose): ResolvedEmailProvider {
  const primary = resolveProviderChain(purpose)[0];
  if (!primary || primary === "none") {
    return { provider: "none", reason: "no_provider_configured" };
  }

  const pref = readPreference();
  let reason: "default" | "explicit" | "fallback" | "purpose";
  if (purpose === "auth" || purpose === "support" || purpose === "newsletter") {
    reason = "purpose";
  } else if (pref && pref === primary) {
    reason = "explicit";
  } else if (pref) {
    reason = "fallback";
  } else {
    reason = "default";
  }
  return { provider: primary, reason } as ResolvedEmailProvider;
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

async function sendVia(
  provider: EmailProviderId,
  input: SendTransactionalEmailInput,
): Promise<EmailDispatchResult> {
  if (provider === "ses") return sendSesEmail(input);
  if (provider === "resend") return sendResendEmail(input);
  if (provider === "brevo") return sendBrevoEmail(input);
  return {
    provider: "none",
    status: "skipped",
    skippedReason: "No email provider is configured for this deployment.",
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
  const chain = resolveProviderChain(enriched.purpose);

  if (chain.length === 0) {
    return {
      provider: "none",
      status: "skipped",
      skippedReason: "No email provider is configured for this deployment.",
    };
  }

  // Try the chain primary-first; the first "sent" wins. A provider that errors
  // (an SES sandbox rejection for an unverified recipient, a transient 5xx, an
  // exhausted vendor quota) falls through to the next configured provider, so a
  // deliverable message is never lost to a single rail's outage.
  let last: EmailDispatchResult | null = null;
  for (const provider of chain) {
    const result = await sendVia(provider, enriched);
    if (result.status === "sent") return result;
    last = result;
  }

  return (
    last ?? {
      provider: "none",
      status: "skipped",
      skippedReason: "No email provider attempted.",
    }
  );
}
