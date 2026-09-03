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

// EMAIL-POSTMARK (2026-07-14): the SES/Resend/Brevo provider modules are
// deleted — Postmark is the only outbound rail. Import sendTransactionalEmail,
// not a provider, unless you specifically need the token/stream helpers.
export {
  sendPostmarkEmail,
  getPostmarkServerToken,
  getPostmarkSender,
  resolvePostmarkStream,
} from "./providers/postmark";

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
