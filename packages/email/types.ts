export type EmailProviderId = "brevo" | "resend" | "none";

export type EmailDispatchStatus = "sent" | "skipped" | "error";

export type EmailDispatchResult = {
  provider: EmailProviderId;
  status: EmailDispatchStatus;
  messageId?: string;
  safeError?: string;
  skippedReason?: string;
};

export type SendTransactionalEmailInput = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
};

export type ResolvedSender = {
  email: string;
  name: string;
};
