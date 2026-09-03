/**
 * @henryco/i18n/error-fallback-copy — surface:error namespace.
 *
 * V3-10 (S7 + A8) — the canonical error.tsx fallback copy. Shape mirrors
 * `ErrorFallbackCopy` from `@henryco/ui/public-shell/error-fallback`,
 * with the addition of `referenceLabel` (caption-style line that
 * surfaces the Sentry ref id to the user).
 *
 * Coverage: all 12 ALL_LOCALES locales. Source-of-truth strings are EN;
 * each locale supplies a `Partial<ErrorFallbackCopy>` that
 * `deepMergeMessages` merges over EN, so any future field addition
 * gracefully falls back to English until the locale gets translated.
 *
 * Strings are intentionally calm — owner bar is "no stack traces leaked
 * to the user", so the body never references the underlying exception.
 */
import type { AppLocale } from "./locales";
import { deepMergeMessages } from "./merge-messages";

export type ErrorFallbackCopy = {
  /** Eyebrow / section label above the heading. */
  eyebrow: string;
  /** Headline. */
  heading: string;
  /** Body paragraph. */
  body: string;
  /** Primary action label — calls `reset()`. */
  retryLabel: string;
  /** Secondary action label — navigates home. */
  homeLabel: string;
  /**
   * Reference-id prefix shown when the boundary receives an
   * `error.digest`. Followed by ` <digest>`. Example:
   *   "Reference: a1b2c3d4"
   */
  referenceLabel: string;
  /**
   * Trailing hint shown after the reference id ("— share with support
   * if this repeats"). Kept separate from `referenceLabel` so locales
   * with different punctuation conventions can adjust freely.
   */
  referenceHint: string;
};

const EN: ErrorFallbackCopy = {
  eyebrow: "Something went wrong",
  heading: "This page didn’t load.",
  body: "Your data is safe. Try again — and if the issue repeats, share the reference below with support so we can trace it quickly.",
  retryLabel: "Try again",
  homeLabel: "Go home",
  referenceLabel: "Reference",
  referenceHint: "share with support if this repeats",
};

const FR: Partial<ErrorFallbackCopy> = {
  eyebrow: "Une erreur est survenue",
  heading: "Cette page n’a pas pu se charger.",
  body: "Vos données sont en sécurité. Réessayez — et si le problème persiste, partagez la référence ci-dessous avec le support pour un diagnostic rapide.",
  retryLabel: "Réessayer",
  homeLabel: "Accueil",
  referenceLabel: "Référence",
  referenceHint: "à partager avec le support si cela se reproduit",
};

const ES: Partial<ErrorFallbackCopy> = {
  eyebrow: "Algo salió mal",
  heading: "Esta página no se cargó.",
  body: "Tus datos están seguros. Inténtalo de nuevo — y si el problema persiste, comparte la referencia con soporte para que podamos rastrearlo rápidamente.",
  retryLabel: "Intentar de nuevo",
  homeLabel: "Inicio",
  referenceLabel: "Referencia",
  referenceHint: "compártela con soporte si vuelve a ocurrir",
};

const PT: Partial<ErrorFallbackCopy> = {
  eyebrow: "Algo deu errado",
  heading: "Esta página não foi carregada.",
  body: "Seus dados estão seguros. Tente novamente — e, se o problema persistir, compartilhe a referência abaixo com o suporte para que possamos rastreá-lo rapidamente.",
  retryLabel: "Tentar novamente",
  homeLabel: "Início",
  referenceLabel: "Referência",
  referenceHint: "compartilhe com o suporte se isso se repetir",
};

const AR: Partial<ErrorFallbackCopy> = {
  eyebrow: "حدث خطأ ما",
  heading: "تعذّر تحميل هذه الصفحة.",
  body: "بياناتك في أمان. حاول مرة أخرى — وإذا تكرّرت المشكلة، شارك المرجع أدناه مع الدعم لتتبّعها بسرعة.",
  retryLabel: "حاول مرة أخرى",
  homeLabel: "الرئيسية",
  referenceLabel: "المرجع",
  referenceHint: "شاركه مع الدعم إذا تكرّر الأمر",
};

const DE: Partial<ErrorFallbackCopy> = {
  eyebrow: "Etwas ist schiefgelaufen",
  heading: "Diese Seite konnte nicht geladen werden.",
  body: "Ihre Daten sind sicher. Versuchen Sie es erneut — und wenn das Problem weiterhin auftritt, geben Sie die Referenz unten an den Support weiter, damit wir es schnell nachverfolgen können.",
  retryLabel: "Erneut versuchen",
  homeLabel: "Zur Startseite",
  referenceLabel: "Referenz",
  referenceHint: "an den Support weiterleiten, falls dies erneut auftritt",
};

const IT: Partial<ErrorFallbackCopy> = {
  eyebrow: "Qualcosa è andato storto",
  heading: "Questa pagina non è stata caricata.",
  body: "I tuoi dati sono al sicuro. Riprova — e se il problema persiste, condividi il riferimento qui sotto con il supporto per tracciarlo rapidamente.",
  retryLabel: "Riprova",
  homeLabel: "Vai alla home",
  referenceLabel: "Riferimento",
  referenceHint: "condividilo con il supporto se si ripete",
};

const ZH: Partial<ErrorFallbackCopy> = {
  eyebrow: "出现了问题",
  heading: "此页面未能加载。",
  body: "您的数据是安全的。请重试——如果问题持续，请将下方的参考编号发送给客服，以便我们快速追踪。",
  retryLabel: "重试",
  homeLabel: "返回首页",
  referenceLabel: "参考编号",
  referenceHint: "如再次出现请发送给客服",
};

const HI: Partial<ErrorFallbackCopy> = {
  eyebrow: "कुछ गलत हो गया",
  heading: "यह पृष्ठ लोड नहीं हो सका।",
  body: "आपका डेटा सुरक्षित है। पुनः प्रयास करें — और यदि समस्या बनी रहती है, तो नीचे दिए गए संदर्भ को सहायता टीम के साथ साझा करें ताकि हम इसे जल्दी ट्रेस कर सकें।",
  retryLabel: "पुनः प्रयास करें",
  homeLabel: "मुखपृष्ठ",
  referenceLabel: "संदर्भ",
  referenceHint: "यदि यह दोबारा हो तो सहायता के साथ साझा करें",
};

const IG: Partial<ErrorFallbackCopy> = {
  eyebrow: "Ihe ọjọọ mere",
  heading: "Ibe a ebughị.",
  body: "Data gị dị mma. Nwaa ọzọ — ọ bụrụ na nsogbu a aga n'ihu, kesaa ntụaka dị n'okpuru na nkwado ka anyị nwee ike ịchọta ya ngwa ngwa.",
  retryLabel: "Nwaa ọzọ",
  homeLabel: "Laghachi n'ụlọ",
  referenceLabel: "Ntụaka",
  referenceHint: "kesaa ya na nkwado ma ọ bụrụ na ọ na-eme ọzọ",
};

const YO: Partial<ErrorFallbackCopy> = {
  eyebrow: "Nǹkan kan ti ṣẹlẹ̀",
  heading: "Ojúewé yìí kò gbé.",
  body: "Àwọn dátà rẹ wà ní ààbò. Gbìyànjú lẹ́ẹ̀kan sí — bí àìnídárayá náà bá ń tẹ̀síwájú, fi ìtọ́kasí tó wà nísàlẹ̀ ránṣẹ́ sí àtìlẹ́yìn kí a lè tọpa rẹ̀ kíákíá.",
  retryLabel: "Gbìyànjú lẹ́ẹ̀kan sí",
  homeLabel: "Lọ sí ojú-ìwé àkọ́kọ́",
  referenceLabel: "Ìtọ́kasí",
  referenceHint: "fi ránṣẹ́ sí àtìlẹ́yìn bí ó bá tún ṣẹlẹ̀",
};

const HA: Partial<ErrorFallbackCopy> = {
  eyebrow: "Wani abu ya faru",
  heading: "Wannan shafin bai loda ba.",
  body: "Bayanan ku suna cikin aminci. Sake gwadawa — kuma idan matsalar ta ci gaba, raba alamar tunani da ke ƙasa tare da tallafi don mu iya bin sahu da sauri.",
  retryLabel: "Sake gwadawa",
  homeLabel: "Komawa shafin gida",
  referenceLabel: "Alamar tunani",
  referenceHint: "raba tare da tallafi idan ya sake faruwa",
};

const LOCALE_OVERRIDES: Partial<Record<AppLocale, Partial<ErrorFallbackCopy>>> = {
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

/**
 * Resolve the error-fallback copy for a locale. Falls back to EN for
 * any string the locale doesn't override.
 */
export function getErrorFallbackCopy(locale: AppLocale): ErrorFallbackCopy {
  const overrides = LOCALE_OVERRIDES[locale];
  if (overrides) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as ErrorFallbackCopy;
  }
  return EN;
}
