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
  resolveProviderChain,
  sendTransactionalEmail,
  type ResolvedEmailProvider,
} from "./send";

// EMAIL-SES-ONLY (2026-07-09): the Resend/Brevo provider modules are deleted —
// SES is the only outbound rail. Import sendTransactionalEmail, not a provider.
export { sendSesEmail, getSesConfig, getSesSender } from "./providers/ses";

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
