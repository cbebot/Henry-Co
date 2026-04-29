export type {
  EmailDispatchResult,
  EmailDispatchStatus,
  EmailProviderId,
  ResolvedSender,
  SendTransactionalEmailInput,
} from "./types";

export {
  resolveEmailProvider,
  sendTransactionalEmail,
  type ResolvedEmailProvider,
} from "./send";

export { sendBrevoEmail, getBrevoApiKey, getBrevoSender } from "./providers/brevo";
export { sendResendEmail, getResendApiKey, getResendSender } from "./providers/resend";
