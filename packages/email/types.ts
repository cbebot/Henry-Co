export type EmailProviderId = "postmark" | "none";

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
   * per-division sender identity and Postmark Message Stream. Explicit
   * `from` / `fromName` always win over the resolved purpose identity.
   */
  purpose?: EmailPurpose;
  /**
   * Optional explicit Postmark Message Stream ID. Overrides the per-purpose
   * stream mapping so a division can route a specific send down a dedicated
   * reputation lane. Falls back to the purpose map, then the built-in
   * `outbound` transactional stream.
   */
  messageStream?: string;
};

export type ResolvedSender = {
  email: string;
  name: string;
};
