import { getAuthCopy, type AppLocale } from "@henryco/i18n";

export type AccountAuthMessageContext =
  | "sign_in"
  | "sign_up"
  | "forgot_password"
  | "reset_password"
  | "change_password";

function fallbackMessage(context: AccountAuthMessageContext, locale: AppLocale) {
  const copy = getAuthCopy(locale);
  if (context === "forgot_password") {
    return copy.errors.generic;
  }

  if (context === "reset_password" || context === "change_password") {
    return copy.errors.sessionExpired;
  }

  return copy.errors.generic;
}

export function mapAccountAuthMessage(
  message: string | null | undefined,
  context: AccountAuthMessageContext,
  locale: AppLocale = "en"
) {
  const copy = getAuthCopy(locale);
  const clean = String(message || "").trim();
  if (!clean) {
    return fallbackMessage(context, locale);
  }

  if (/invalid login credentials/i.test(clean)) {
    return copy.errors.invalidCredentials;
  }

  if (/email.*not.*confirm|confirm.*email/i.test(clean)) {
    return copy.errors.generic;
  }

  if (/too many requests|rate limit/i.test(clean)) {
    return copy.errors.generic;
  }

  if (/database error|saving new user|creating new user/i.test(clean)) {
    return copy.errors.generic;
  }

  if (/already registered|user already registered/i.test(clean)) {
    return copy.errors.generic;
  }

  if (/weak password|password should/i.test(clean)) {
    return copy.errors.passwordTooShort;
  }

  if (
    (context === "reset_password" || context === "change_password") &&
    /expired|session.*missing|session.*not found|invalid token|token has expired/i.test(clean)
  ) {
    return copy.errors.sessionExpired;
  }

  if (context === "forgot_password" && /rate limit/i.test(clean)) {
    return copy.errors.generic;
  }

  return copy.errors.generic;
}
