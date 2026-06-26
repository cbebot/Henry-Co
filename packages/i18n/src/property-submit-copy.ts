import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * Copy for the HenryCo Property public submit + auth-callback surfaces.
 *
 * Each top-level key maps to one component/page; nested keys are the
 * individual user-visible strings within it.
 *
 * Pattern A module: author EN + fr/es/pt/ar/de/it/zh only. ig/yo/ha/hi are
 * intentionally omitted and fall back to EN (human-translation only).
 *
 * The brand token "HenryCo" is kept VERBATIM in every locale.
 */
export type PropertySubmitCopy = {
  callback: {
    kicker: string;
    heading: string;
    completing: string;
    missingCredentials: string;
  };
};

const EN: PropertySubmitCopy = {
  callback: {
    kicker: "Property access",
    heading: "Finishing your sign-in.",
    completing: "Completing your HenryCo Property sign-in...",
    missingCredentials: "This sign-in link is missing session credentials.",
  },
};

const FR: DeepPartial<PropertySubmitCopy> = {
  callback: {
    kicker: "Accès à Property",
    heading: "Finalisation de votre connexion.",
    completing: "Finalisation de votre connexion HenryCo Property...",
    missingCredentials: "Ce lien de connexion ne contient pas les identifiants de session.",
  },
};

const ES: DeepPartial<PropertySubmitCopy> = {
  callback: {
    kicker: "Acceso a Property",
    heading: "Finalizando tu inicio de sesión.",
    completing: "Completando tu inicio de sesión en HenryCo Property...",
    missingCredentials: "A este enlace de inicio de sesión le faltan las credenciales de sesión.",
  },
};

const PT: DeepPartial<PropertySubmitCopy> = {
  callback: {
    kicker: "Acesso ao Property",
    heading: "Concluindo o seu acesso.",
    completing: "Concluindo o seu acesso ao HenryCo Property...",
    missingCredentials: "Este link de acesso não contém as credenciais de sessão.",
  },
};

const AR: DeepPartial<PropertySubmitCopy> = {
  callback: {
    kicker: "الوصول إلى Property",
    heading: "جارٍ إتمام تسجيل دخولك.",
    completing: "جارٍ إتمام تسجيل دخولك إلى HenryCo Property...",
    missingCredentials: "رابط تسجيل الدخول هذا يفتقر إلى بيانات اعتماد الجلسة.",
  },
};

const DE: DeepPartial<PropertySubmitCopy> = {
  callback: {
    kicker: "Property-Zugang",
    heading: "Anmeldung wird abgeschlossen.",
    completing: "Ihre Anmeldung bei HenryCo Property wird abgeschlossen...",
    missingCredentials: "Diesem Anmeldelink fehlen die Sitzungsdaten.",
  },
};

const IT: DeepPartial<PropertySubmitCopy> = {
  callback: {
    kicker: "Accesso a Property",
    heading: "Completamento dell'accesso in corso.",
    completing: "Completamento del tuo accesso a HenryCo Property...",
    missingCredentials: "A questo link di accesso mancano le credenziali di sessione.",
  },
};

const ZH: DeepPartial<PropertySubmitCopy> = {
  callback: {
    kicker: "Property 访问",
    heading: "正在完成登录。",
    completing: "正在完成您的 HenryCo Property 登录...",
    missingCredentials: "此登录链接缺少会话凭据。",
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<PropertySubmitCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
};
// ig, yo, ha, hi are intentionally OMITTED -> fall back to EN (human-translation only).

export function getPropertySubmitCopy(locale: AppLocale): PropertySubmitCopy {
  const o = LOCALE_MAP[locale];
  if (o)
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      o as unknown as Record<string, unknown>,
    ) as unknown as PropertySubmitCopy;
  return EN;
}
