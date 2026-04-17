import type { AppLocale } from "./locales";
import { deepMergeMessages } from "./merge-messages";

export type AuthCopy = {
  login: {
    heading: string;
    subheading: string;
    emailLabel: string;
    passwordLabel: string;
    rememberMe: string;
    forgotPassword: string;
    submitButton: string;
    signupPrompt: string;
    signupCta: string;
  };
  signup: {
    heading: string;
    subheading: string;
    fullNameLabel: string;
    emailLabel: string;
    passwordLabel: string;
    confirmPasswordLabel: string;
    consentLine: string;
    submitButton: string;
    loginPrompt: string;
    loginCta: string;
  };
  reset: {
    heading: string;
    subheading: string;
    emailLabel: string;
    submitButton: string;
    success: string;
  };
  errors: {
    invalidCredentials: string;
    invalidEmail: string;
    passwordTooShort: string;
    sessionExpired: string;
    generic: string;
  };
};

const EN: AuthCopy = {
  login: {
    heading: "Welcome back",
    subheading: "Sign in to continue with your Henry & Co. account.",
    emailLabel: "Email address",
    passwordLabel: "Password",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    submitButton: "Sign in",
    signupPrompt: "Don't have an account yet?",
    signupCta: "Create account",
  },
  signup: {
    heading: "Create your account",
    subheading: "Set up one account for all Henry & Co. divisions.",
    fullNameLabel: "Full name",
    emailLabel: "Email address",
    passwordLabel: "Password",
    confirmPasswordLabel: "Confirm password",
    consentLine: "By continuing, you accept our Terms and Privacy Notice.",
    submitButton: "Create account",
    loginPrompt: "Already have an account?",
    loginCta: "Sign in",
  },
  reset: {
    heading: "Reset your password",
    subheading: "We'll email a secure reset link to your inbox.",
    emailLabel: "Email address",
    submitButton: "Send reset link",
    success: "Reset link sent. Please check your email.",
  },
  errors: {
    invalidCredentials: "Email or password is incorrect.",
    invalidEmail: "Please enter a valid email address.",
    passwordTooShort: "Password must be at least 8 characters.",
    sessionExpired: "Your session expired. Please sign in again.",
    generic: "Something went wrong. Please try again.",
  },
};

const FR: Partial<AuthCopy> = {
  login: {
    heading: "Bon retour",
    subheading: "Connectez-vous pour continuer avec votre compte Henry & Co.",
    emailLabel: "Adresse e-mail",
    passwordLabel: "Mot de passe",
    rememberMe: "Se souvenir de moi",
    forgotPassword: "Mot de passe oublié ?",
    submitButton: "Se connecter",
    signupPrompt: "Vous n'avez pas encore de compte ?",
    signupCta: "Créer un compte",
  },
  signup: {
    heading: "Créer votre compte",
    subheading: "Un seul compte pour toutes les divisions Henry & Co.",
    fullNameLabel: "Nom complet",
    emailLabel: "Adresse e-mail",
    passwordLabel: "Mot de passe",
    confirmPasswordLabel: "Confirmer le mot de passe",
    consentLine: "En continuant, vous acceptez nos Conditions et la Notice de confidentialité.",
    submitButton: "Créer un compte",
    loginPrompt: "Vous avez déjà un compte ?",
    loginCta: "Se connecter",
  },
  reset: {
    heading: "Réinitialiser votre mot de passe",
    subheading: "Nous vous enverrons un lien sécurisé par e-mail.",
    emailLabel: "Adresse e-mail",
    submitButton: "Envoyer le lien",
    success: "Lien envoyé. Vérifiez votre boîte e-mail.",
  },
  errors: {
    invalidCredentials: "L'e-mail ou le mot de passe est incorrect.",
    invalidEmail: "Veuillez saisir une adresse e-mail valide.",
    passwordTooShort: "Le mot de passe doit contenir au moins 8 caractères.",
    sessionExpired: "Votre session a expiré. Veuillez vous reconnecter.",
    generic: "Une erreur est survenue. Veuillez réessayer.",
  },
};

export function getAuthCopy(locale: AppLocale): AuthCopy {
  if (locale === "fr") {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      FR as unknown as Record<string, unknown>,
    ) as unknown as AuthCopy;
  }
  return EN;
}
