export type EmailProviderId = "brevo" | "resend" | "none";

export type EmailDispatchStatus = "sent" | "skipped" | "error";

export type EmailDispatchResult = {
  provider: EmailProviderId;
  status: EmailDispatchStatus;
  messageId?: string;
  safeError?: string;
  skippedReason?: string;
};

export type EmailPurpose =
  | "auth"
  | "support"
  | "newsletter"
  | "care"
  | "studio"
  | "marketplace"
  | "jobs"
  | "learn"
  | "property"
  | "logistics"
  | "security"
  | "generic";

export type SendTransactionalEmailInput = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  /**
   * Routing/sender purpose. When set, the resolver picks the correct
   * per-division sender identity (and prefers Resend for support if
   * configured). Explicit `from` / `fromName` always win over the
   * resolved purpose identity.
   */
  purpose?: EmailPurpose;
};

export type ResolvedSender = {
  email: string;
  name: string;
};
