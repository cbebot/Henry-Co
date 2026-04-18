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

// ─── Tier B: Architecture-ready scaffold ────────────────────────────────────

const DE: Partial<AuthCopy> = {
  login: {
    heading: "Willkommen zurück",
    subheading: "Melden Sie sich an, um mit Ihrem Henry & Co.-Konto fortzufahren.",
    emailLabel: "E-Mail-Adresse",
    passwordLabel: "Passwort",
    rememberMe: "Angemeldet bleiben",
    forgotPassword: "Passwort vergessen?",
    submitButton: "Anmelden",
    signupPrompt: "Noch kein Konto?",
    signupCta: "Konto erstellen",
  },
  signup: {
    heading: "Konto erstellen",
    subheading: "Ein Konto für alle Henry & Co.-Bereiche.",
    fullNameLabel: "Vollständiger Name",
    emailLabel: "E-Mail-Adresse",
    passwordLabel: "Passwort",
    confirmPasswordLabel: "Passwort bestätigen",
    consentLine: "Mit der Fortführung akzeptieren Sie unsere Nutzungsbedingungen und Datenschutzerklärung.",
    submitButton: "Konto erstellen",
    loginPrompt: "Bereits ein Konto?",
    loginCta: "Anmelden",
  },
  reset: {
    heading: "Passwort zurücksetzen",
    subheading: "Wir senden Ihnen einen sicheren Reset-Link per E-Mail.",
    emailLabel: "E-Mail-Adresse",
    submitButton: "Link senden",
    success: "Link gesendet. Bitte prüfen Sie Ihre E-Mails.",
  },
  errors: {
    invalidCredentials: "E-Mail oder Passwort ist falsch.",
    invalidEmail: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    passwordTooShort: "Das Passwort muss mindestens 8 Zeichen lang sein.",
    sessionExpired: "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.",
    generic: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
  },
};

const ZH: Partial<AuthCopy> = {
  login: {
    heading: "欢迎回来",
    subheading: "登录以继续使用您的 Henry & Co. 账户。",
    emailLabel: "电子邮件地址",
    passwordLabel: "密码",
    rememberMe: "记住我",
    forgotPassword: "忘记密码？",
    submitButton: "登录",
    signupPrompt: "还没有账户？",
    signupCta: "创建账户",
  },
  signup: {
    heading: "创建您的账户",
    subheading: "一个账户，畅享所有 Henry & Co. 服务。",
    fullNameLabel: "全名",
    emailLabel: "电子邮件地址",
    passwordLabel: "密码",
    confirmPasswordLabel: "确认密码",
    consentLine: "继续即表示您同意我们的服务条款和隐私声明。",
    submitButton: "创建账户",
    loginPrompt: "已有账户？",
    loginCta: "登录",
  },
  reset: {
    heading: "重置密码",
    subheading: "我们将向您的邮箱发送一个安全的重置链接。",
    emailLabel: "电子邮件地址",
    submitButton: "发送重置链接",
    success: "重置链接已发送。请检查您的电子邮件。",
  },
  errors: {
    invalidCredentials: "电子邮件或密码不正确。",
    invalidEmail: "请输入有效的电子邮件地址。",
    passwordTooShort: "密码至少需要 8 个字符。",
    sessionExpired: "您的会话已过期。请重新登录。",
    generic: "出现了问题。请重试。",
  },
};

const HI: Partial<AuthCopy> = {
  login: {
    heading: "वापस स्वागत है",
    subheading: "अपने Henry & Co. खाते के साथ जारी रखने के लिए साइन इन करें।",
    emailLabel: "ईमेल पता",
    passwordLabel: "पासवर्ड",
    rememberMe: "मुझे याद रखें",
    forgotPassword: "पासवर्ड भूल गए?",
    submitButton: "साइन इन करें",
    signupPrompt: "अभी तक खाता नहीं है?",
    signupCta: "खाता बनाएं",
  },
  signup: {
    heading: "अपना खाता बनाएं",
    subheading: "Henry & Co. के सभी विभागों के लिए एक खाता।",
    fullNameLabel: "पूरा नाम",
    emailLabel: "ईमेल पता",
    passwordLabel: "पासवर्ड",
    confirmPasswordLabel: "पासवर्ड की पुष्टि करें",
    consentLine: "जारी रखकर आप हमारी शर्तें और गोपनीयता नोटिस स्वीकार करते हैं।",
    submitButton: "खाता बनाएं",
    loginPrompt: "पहले से खाता है?",
    loginCta: "साइन इन करें",
  },
  reset: {
    heading: "अपना पासवर्ड रीसेट करें",
    subheading: "हम आपके इनबॉक्स में एक सुरक्षित रीसेट लिंक भेजेंगे।",
    emailLabel: "ईमेल पता",
    submitButton: "रीसेट लिंक भेजें",
    success: "रीसेट लिंक भेजा गया। कृपया अपना ईमेल जांचें।",
  },
  errors: {
    invalidCredentials: "ईमेल या पासवर्ड गलत है।",
    invalidEmail: "कृपया एक वैध ईमेल पता दर्ज करें।",
    passwordTooShort: "पासवर्ड कम से कम 8 वर्णों का होना चाहिए।",
    sessionExpired: "आपका सत्र समाप्त हो गया। कृपया फिर से साइन इन करें।",
    generic: "कुछ गलत हो गया। कृपया पुनः प्रयास करें।",
  },
};

// ─── Nigerian regional ───────────────────────────────────────────────────────

const IG: Partial<AuthCopy> = {
  login: {
    heading: "Nnọọ, ọ bịakwasịa",
    subheading: "Banye ka ị gaa n'ihu na akaụntụ gị nke Henry & Co.",
    emailLabel: "Adreesị email",
    passwordLabel: "Paswọọdụ",
    rememberMe: "Cheta m",
    forgotPassword: "Ichefuo paswọọdụ?",
    submitButton: "Banye",
    signupPrompt: "Onweghị akaụntụ gị?",
    signupCta: "Mepụta akaụntụ",
  },
  signup: {
    heading: "Mepụta akaụntụ gị",
    subheading: "Otu akaụntụ maka ngalaba Henry & Co. niile.",
    fullNameLabel: "Aha zuru oke",
    emailLabel: "Adreesị email",
    passwordLabel: "Paswọọdụ",
    confirmPasswordLabel: "Nkwenye paswọọdụ",
    consentLine: "Site n'ịga n'ihu, ị nabatara ụkpụrụ anyị na Nkọwa nzuzo.",
    submitButton: "Mepụta akaụntụ",
    loginPrompt: "Ị nweela akaụntụ?",
    loginCta: "Banye",
  },
  reset: {
    heading: "Tọgharia paswọọdụ gị",
    subheading: "Anyị ga-eziga njikọ ntọgharia na email gị.",
    emailLabel: "Adreesị email",
    submitButton: "Ziga njikọ",
    success: "Ezigara njikọ. Biko lelee email gị.",
  },
  errors: {
    invalidCredentials: "Email ma ọ bụ paswọọdụ ezighi ezi.",
    invalidEmail: "Biko tinye adreesị email ziri ezi.",
    passwordTooShort: "Paswọọdụ kwesịrị inwe opekata mpe mkpụrụedemede 8.",
    sessionExpired: "Oge nchekwa gị agwụla. Biko banyezie.",
    generic: "Ihe ọjọọ mere. Biko nwalee ọzọ.",
  },
};

const YO: Partial<AuthCopy> = {
  login: {
    heading: "Ẹ káàbọ̀ padà",
    subheading: "Wọlé láti bá àkọọ́lẹ̀ rẹ Henry & Co. lọ siwájú.",
    emailLabel: "Àdírẹ́sì ímeèlì",
    passwordLabel: "Ọ̀rọ̀ aṣínà",
    rememberMe: "Rántí mi",
    forgotPassword: "Ẹ̀ gbà ọ̀rọ̀ aṣínà?",
    submitButton: "Wọlé",
    signupPrompt: "Kò sí àkọọ́lẹ̀ rẹ̀ tó?",
    signupCta: "Ṣẹ̀dá àkọọ́lẹ̀",
  },
  signup: {
    heading: "Ṣẹ̀dá àkọọ́lẹ̀ rẹ",
    subheading: "Àkọọ́lẹ̀ kan fún gbogbo ẹ̀ka Henry & Co.",
    fullNameLabel: "Orúkọ ní kíkún",
    emailLabel: "Àdírẹ́sì ímeèlì",
    passwordLabel: "Ọ̀rọ̀ aṣínà",
    confirmPasswordLabel: "Jẹ́rìí ọ̀rọ̀ aṣínà",
    consentLine: "Nípa títẹ̀síwájú, o gba Àwọn Ìṣọ̀ àti Ìpolówó Àṣírí wa.",
    submitButton: "Ṣẹ̀dá àkọọ́lẹ̀",
    loginPrompt: "Ó ti ní àkọọ́lẹ̀ tẹ́lẹ̀?",
    loginCta: "Wọlé",
  },
  reset: {
    heading: "Tún ọ̀rọ̀ aṣínà rẹ ṣe",
    subheading: "A máa rán ọ́ atúnsè aláìléwu sí ìbộsọ rẹ.",
    emailLabel: "Àdírẹ́sì ímeèlì",
    submitButton: "Firanṣẹ́ atúnsè",
    success: "Atúnsè tí a fi ránṣẹ́. Ẹ ṣàyẹ̀wò ímeèlì rẹ.",
  },
  errors: {
    invalidCredentials: "Ímeèlì tàbí ọ̀rọ̀ aṣínà kò tọ̀.",
    invalidEmail: "Jọwọ ẹ tẹ àdírẹ́sì ímeèlì tó wúlò.",
    passwordTooShort: "Ọ̀rọ̀ aṣínà gbọdọ̀ ní ó kéré jùlọ ọ̀rọ̀ 8.",
    sessionExpired: "Àkókò ìgbà iṣẹ́ rẹ ti parí. Jọwọ wọlé ní ẹ̀ẹ̀kejì.",
    generic: "Nǹkan kan ti ṣẹlẹ̀. Jọwọ gbìyànjú lẹ́ẹ̀kan sí.",
  },
};

const HA: Partial<AuthCopy> = {
  login: {
    heading: "Barka da dawowar ku",
    subheading: "Yi shiga don ci gaba da asusun ku na Henry & Co.",
    emailLabel: "Adireshin imel",
    passwordLabel: "Kalmar sirri",
    rememberMe: "Ka tuna ni",
    forgotPassword: "Manta kalmar sirri?",
    submitButton: "Yi shiga",
    signupPrompt: "Ba ku da asusu tukuna?",
    signupCta: "Ƙirƙiri asusu",
  },
  signup: {
    heading: "Ƙirƙiri asusun ku",
    subheading: "Asusu ɗaya don dukkan sassan Henry & Co.",
    fullNameLabel: "Cikakken suna",
    emailLabel: "Adireshin imel",
    passwordLabel: "Kalmar sirri",
    confirmPasswordLabel: "Tabbatar da kalmar sirri",
    consentLine: "Ta hanyar ci gaba, kun yarda da Sharuɗɗanmu da Sanarwar Sirri.",
    submitButton: "Ƙirƙiri asusu",
    loginPrompt: "Kuna da asusu tuni?",
    loginCta: "Yi shiga",
  },
  reset: {
    heading: "Sake saita kalmar sirri",
    subheading: "Za mu aika muku da hanyar sake saita a imel ɗinku.",
    emailLabel: "Adireshin imel",
    submitButton: "Aika hanyar sake saita",
    success: "An aika hanyar. Da fatan za ku duba imel ɗinku.",
  },
  errors: {
    invalidCredentials: "Imel ko kalmar sirri ba daidai ba ne.",
    invalidEmail: "Da fatan za ku shigar da adireshin imel ingantacce.",
    passwordTooShort: "Kalmar sirri dole ne ta ƙunshi haruffa 8 aƙalla.",
    sessionExpired: "Zaman ku ya ƙare. Da fatan za ku yi shiga a sake.",
    generic: "Wani abu ya faru. Da fatan za ku sake gwadawa.",
  },
};

const IT: Partial<AuthCopy> = {
  "login": {
    "heading": "Bentornato",
    "subheading": "Accedi per continuare con il tuo account Henry & Co.",
    "emailLabel": "Indirizzo e-mail",
    "passwordLabel": "Password",
    "rememberMe": "Ricordami",
    "forgotPassword": "Password dimenticata?",
    "submitButton": "Accedi",
    "signupPrompt": "Non hai ancora un account?",
    "signupCta": "Crea un account"
  },
  "signup": {
    "heading": "Crea il tuo account",
    "subheading": "Configura un unico account per tutte le divisioni Henry & Co.",
    "fullNameLabel": "Nome completo",
    "emailLabel": "Indirizzo e-mail",
    "passwordLabel": "Password",
    "confirmPasswordLabel": "Conferma la password",
    "consentLine": "Continuando, accetti i nostri Termini e l'Informativa sulla privacy.",
    "submitButton": "Crea un account",
    "loginPrompt": "Hai già un account?",
    "loginCta": "Accedi"
  },
  "reset": {
    "heading": "Reimposta la tua password",
    "subheading": "Ti invieremo via e-mail un link sicuro per reimpostare la password.",
    "emailLabel": "Indirizzo e-mail",
    "submitButton": "Invia il link di reset",
    "success": "Link di reset inviato. Controlla la tua e-mail."
  },
  "errors": {
    "invalidCredentials": "L'e-mail o la password non sono corrette.",
    "invalidEmail": "Inserisci un indirizzo e-mail valido.",
    "passwordTooShort": "La password deve contenere almeno 8 caratteri.",
    "sessionExpired": "La sessione è scaduta. Accedi di nuovo.",
    "generic": "Qualcosa è andato storto. Riprova."
  }
};

const LOCALE_OVERRIDES: Partial<Record<AppLocale, Partial<AuthCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
  hi: HI,
  ig: IG,
  yo: YO,
  ha: HA,
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
