export type {
  EmailDispatchResult,
  EmailDispatchStatus,
  EmailProviderId,
  EmailPurpose,
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

export { resolveSenderIdentity, getNoReplyIdentity } from "./sender-identity";

export {
  HENRYCO_EMAIL_TOKENS,
  renderHenryCoEmail,
  renderHenryCoEmailText,
  renderHenryCoEmailHeader,
  renderHenryCoEmailFooter,
  escapeHtml,
  type HenryCoEmailLayout,
  type HenryCoEmailSection,
  type HenryCoEmailFooterOptions,
} from "./layout";

export {
  renderAuthEmail,
  renderLocalizedAuthEmail,
  type AuthHookEmailData,
  type SupabaseEmailActionType,
} from "./auth-hook-templates";

export {
  localizeEmailError,
  localizeEmailErrorAsync,
  isOperatorOnlyEmailError,
  type ErrorAudience,
} from "./localize-error";

export {
  resolveRecipientLocale,
  resolveRecipientLocales,
  normalizeAppLocaleSafe,
  type RecipientLocaleIdentifier,
} from "./recipient-locale";

export {
  translateStrings,
  localizeSubjectPrefix,
  type LocalizableTranslator,
} from "./localize-layout";
