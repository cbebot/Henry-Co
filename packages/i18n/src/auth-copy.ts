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

const ES: Partial<AuthCopy> = {
  login: {
    heading: "Bienvenido de vuelta",
    subheading: "Inicia sesión para continuar con tu cuenta Henry & Co.",
    emailLabel: "Correo electrónico",
    passwordLabel: "Contraseña",
    rememberMe: "Recuérdame",
    forgotPassword: "¿Olvidaste tu contraseña?",
    submitButton: "Iniciar sesión",
    signupPrompt: "¿Aún no tienes una cuenta?",
    signupCta: "Crear cuenta",
  },
  signup: {
    heading: "Crea tu cuenta",
    subheading: "Una sola cuenta para todas las divisiones de Henry & Co.",
    fullNameLabel: "Nombre completo",
    emailLabel: "Correo electrónico",
    passwordLabel: "Contraseña",
    confirmPasswordLabel: "Confirmar contraseña",
    consentLine: "Al continuar, aceptas nuestros Términos y Aviso de privacidad.",
    submitButton: "Crear cuenta",
    loginPrompt: "¿Ya tienes una cuenta?",
    loginCta: "Iniciar sesión",
  },
  reset: {
    heading: "Restablece tu contraseña",
    subheading: "Te enviaremos un enlace seguro de restablecimiento a tu correo.",
    emailLabel: "Correo electrónico",
    submitButton: "Enviar enlace",
    success: "Enlace enviado. Revisa tu correo electrónico.",
  },
  errors: {
    invalidCredentials: "El correo o la contraseña son incorrectos.",
    invalidEmail: "Ingresa una dirección de correo válida.",
    passwordTooShort: "La contraseña debe tener al menos 8 caracteres.",
    sessionExpired: "Tu sesión expiró. Inicia sesión de nuevo.",
    generic: "Algo salió mal. Inténtalo de nuevo.",
  },
};

const PT: Partial<AuthCopy> = {
  login: {
    heading: "Bem-vindo de volta",
    subheading: "Faça login para continuar com sua conta Henry & Co.",
    emailLabel: "Endereço de e-mail",
    passwordLabel: "Senha",
    rememberMe: "Lembrar de mim",
    forgotPassword: "Esqueceu a senha?",
    submitButton: "Entrar",
    signupPrompt: "Ainda não tem uma conta?",
    signupCta: "Criar conta",
  },
  signup: {
    heading: "Crie sua conta",
    subheading: "Uma conta para todas as divisões da Henry & Co.",
    fullNameLabel: "Nome completo",
    emailLabel: "Endereço de e-mail",
    passwordLabel: "Senha",
    confirmPasswordLabel: "Confirmar senha",
    consentLine: "Ao continuar, você aceita nossos Termos e Aviso de privacidade.",
    submitButton: "Criar conta",
    loginPrompt: "Já tem uma conta?",
    loginCta: "Entrar",
  },
  reset: {
    heading: "Redefina sua senha",
    subheading: "Enviaremos um link seguro de redefinição para seu e-mail.",
    emailLabel: "Endereço de e-mail",
    submitButton: "Enviar link",
    success: "Link enviado. Verifique seu e-mail.",
  },
  errors: {
    invalidCredentials: "E-mail ou senha incorretos.",
    invalidEmail: "Insira um endereço de e-mail válido.",
    passwordTooShort: "A senha deve ter pelo menos 8 caracteres.",
    sessionExpired: "Sua sessão expirou. Faça login novamente.",
    generic: "Algo deu errado. Tente novamente.",
  },
};

const AR: Partial<AuthCopy> = {
  login: {
    heading: "مرحباً بعودتك",
    subheading: "سجّل الدخول للمتابعة مع حسابك في Henry & Co.",
    emailLabel: "البريد الإلكتروني",
    passwordLabel: "كلمة المرور",
    rememberMe: "تذكّرني",
    forgotPassword: "نسيت كلمة المرور؟",
    submitButton: "تسجيل الدخول",
    signupPrompt: "ليس لديك حساب بعد؟",
    signupCta: "إنشاء حساب",
  },
  signup: {
    heading: "أنشئ حسابك",
    subheading: "حساب واحد لجميع أقسام Henry & Co.",
    fullNameLabel: "الاسم الكامل",
    emailLabel: "البريد الإلكتروني",
    passwordLabel: "كلمة المرور",
    confirmPasswordLabel: "تأكيد كلمة المرور",
    consentLine: "بالمتابعة، تقبل شروطنا وإشعار الخصوصية.",
    submitButton: "إنشاء حساب",
    loginPrompt: "هل لديك حساب بالفعل؟",
    loginCta: "تسجيل الدخول",
  },
  reset: {
    heading: "إعادة تعيين كلمة المرور",
    subheading: "سنرسل رابط إعادة تعيين آمن إلى بريدك الإلكتروني.",
    emailLabel: "البريد الإلكتروني",
    submitButton: "إرسال الرابط",
    success: "تم إرسال الرابط. يرجى مراجعة بريدك الإلكتروني.",
  },
  errors: {
    invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    invalidEmail: "يرجى إدخال عنوان بريد إلكتروني صحيح.",
    passwordTooShort: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.",
    sessionExpired: "انتهت صلاحية جلستك. يرجى تسجيل الدخول مجدداً.",
    generic: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
  },
};

const LOCALE_OVERRIDES: Partial<Record<AppLocale, Partial<AuthCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
};

export function getAuthCopy(locale: AppLocale): AuthCopy {
  const overrides = LOCALE_OVERRIDES[locale];
  if (overrides) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as AuthCopy;
  }
  return EN;
}
