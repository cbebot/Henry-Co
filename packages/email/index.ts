export type {
  EmailDispatchResult,
  EmailDispatchStatus,
  EmailProviderId,
  EmailPurpose,
  ResolvedSender,
  SendTransactionalEmailInput,
} from "./types";

export { sendTransactionalEmail, type ResolvedEmailProvider } from "./send";

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
