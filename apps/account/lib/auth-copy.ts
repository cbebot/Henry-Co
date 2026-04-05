export type AccountAuthMessageContext =
  | "sign_in"
  | "sign_up"
  | "forgot_password"
  | "reset_password"
  | "change_password";

function fallbackMessage(context: AccountAuthMessageContext) {
  if (context === "forgot_password") {
    return "We couldn't send the reset link right now. Please try again shortly.";
  }

  if (context === "reset_password" || context === "change_password") {
    return "We couldn't update your password right now. Please try again.";
  }

  return "We couldn't complete that right now. Please try again.";
}

export function mapAccountAuthMessage(
  message: string | null | undefined,
  context: AccountAuthMessageContext
) {
  const clean = String(message || "").trim();
  if (!clean) {
    return fallbackMessage(context);
  }

  if (/invalid login credentials/i.test(clean)) {
    return "Email or password is incorrect.";
  }

  if (/email.*not.*confirm|confirm.*email/i.test(clean)) {
    return "Check your inbox and confirm your email before signing in.";
  }

  if (/too many requests|rate limit/i.test(clean)) {
    return "Too many attempts right now. Please wait a moment and try again.";
  }

  if (/database error|saving new user|creating new user/i.test(clean)) {
    return "We couldn't finish online account setup just now. Email hello@henrycogroup.com and the HenryCo team will help you complete access.";
  }

  if (/already registered|user already registered/i.test(clean)) {
    return "This email is already linked to a HenryCo account. Sign in instead or reset your password.";
  }

  if (/weak password|password should/i.test(clean)) {
    return "Choose a stronger password with at least 8 characters.";
  }

  if (
    (context === "reset_password" || context === "change_password") &&
    /expired|session.*missing|session.*not found|invalid token|token has expired/i.test(clean)
  ) {
    return "This password link has expired. Request a new reset email and try again.";
  }

  if (context === "forgot_password" && /rate limit/i.test(clean)) {
    return "We couldn't send another reset email just yet. Please wait a moment and try again.";
  }

  return clean;
}
