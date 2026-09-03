import type { AppLocale } from "./locales";
import { deepMergeMessages } from "./merge-messages";

/**
 * V3-25 — Content moderation copy.
 *
 * Two surfaces: the user-facing report sheet ("Report this listing") + the
 * "content under review" notices, and the operator staff-review labels (decision
 * / status / scanner / reason-code labels for the unified moderation queue).
 *
 * Foundation locale is English (the source of truth — every key must exist
 * here). FR + ES + AR are seeded statically for the user-facing report sheet
 * because they cover the bulk of customer traffic; remaining locales fall
 * through to English at the static layer and PASS 18B runtime auto-translation
 * fills the DeepL-supported ones. ig/yo/ha pass through to English.
 */

export type ModerationCopy = {
  report: {
    title: string;
    description: string;
    reasonLabel: string;
    reasonOptions: {
      scam_or_fraud: string;
      prohibited_item: string;
      offensive_content: string;
      personal_info: string;
      spam: string;
      impersonation: string;
      other: string;
    };
    detailLabel: string;
    detailPlaceholder: string;
    submit: string;
    submitting: string;
    successTitle: string;
    successBody: string;
    errorTitle: string;
    errorGeneric: string;
    errorRateLimited: string;
    errorUnauthorized: string;
    cancel: string;
  };
  notice: {
    underReviewTitle: string;
    underReviewBody: string;
    blockedTitle: string;
    blockedBody: string;
  };
  review: {
    reportsTitle: string;
    reportsDescription: string;
    empty: string;
    columns: {
      content: string;
      type: string;
      reason: string;
      status: string;
      reporter: string;
      filed: string;
      decision: string;
      scanner: string;
    };
    decisions: { approve: string; hold: string; reject: string };
    statuses: { open: string; reviewing: string; resolved: string; dismissed: string };
    scanners: { deterministic_rule: string; ai_check: string; manual: string };
    reasonCodes: {
      banned_goods: string;
      hate_speech: string;
      profanity: string;
      pii_leak: string;
      off_platform_contact: string;
      scam_suspected: string;
      image_hash_match: string;
      ai_flagged_scam: string;
      ai_flagged_nsfw: string;
      ai_flagged_abuse: string;
      ai_flagged_other: string;
      user_reported: string;
    };
    actions: { approve: string; hold: string; reject: string; dismiss: string };
    overrideReasonLabel: string;
    overrideReasonPlaceholder: string;
  };
};

const EN: ModerationCopy = {
  report: {
    title: "Report this content",
    description: "Tell us what's wrong. Our team reviews every report.",
    reasonLabel: "Reason",
    reasonOptions: {
      scam_or_fraud: "Scam or fraud",
      prohibited_item: "Prohibited or illegal item",
      offensive_content: "Offensive or hateful content",
      personal_info: "Shares personal contact information",
      spam: "Spam or misleading",
      impersonation: "Impersonation",
      other: "Something else",
    },
    detailLabel: "Details (optional)",
    detailPlaceholder: "Add anything that helps our team review this faster.",
    submit: "Submit report",
    submitting: "Submitting…",
    successTitle: "Report received",
    successBody: "Thanks — our team will review this shortly.",
    errorTitle: "Couldn't submit report",
    errorGeneric: "Something went wrong. Please try again.",
    errorRateLimited: "You're reporting too quickly. Please wait a moment and try again.",
    errorUnauthorized: "Please sign in to report content.",
    cancel: "Cancel",
  },
  notice: {
    underReviewTitle: "Under review",
    underReviewBody: "This content is being reviewed and isn't visible publicly yet.",
    blockedTitle: "Not published",
    blockedBody: "This content couldn't be published because it doesn't meet our content policy.",
  },
  review: {
    reportsTitle: "User reports",
    reportsDescription: "Cross-division reports filed against published content.",
    empty: "No open reports.",
    columns: {
      content: "Content",
      type: "Type",
      reason: "Reason",
      status: "Status",
      reporter: "Reporter",
      filed: "Filed",
      decision: "Decision",
      scanner: "Scanner",
    },
    decisions: { approve: "Approved", hold: "On hold", reject: "Rejected" },
    statuses: { open: "Open", reviewing: "Reviewing", resolved: "Resolved", dismissed: "Dismissed" },
    scanners: { deterministic_rule: "Automated rule", ai_check: "AI-assisted", manual: "Staff decision" },
    reasonCodes: {
      banned_goods: "Prohibited goods",
      hate_speech: "Hate speech",
      profanity: "Profanity",
      pii_leak: "Personal information leak",
      off_platform_contact: "Off-platform contact",
      scam_suspected: "Suspected scam",
      image_hash_match: "Banned image match",
      ai_flagged_scam: "AI: suspected scam",
      ai_flagged_nsfw: "AI: explicit content",
      ai_flagged_abuse: "AI: abusive content",
      ai_flagged_other: "AI: flagged for review",
      user_reported: "User reported",
    },
    actions: { approve: "Approve", hold: "Hold", reject: "Reject", dismiss: "Dismiss report" },
    overrideReasonLabel: "Decision reason",
    overrideReasonPlaceholder: "Required — explain this decision for the audit trail.",
  },
};

const FR: Partial<ModerationCopy> = {
  report: {
    title: "Signaler ce contenu",
    description: "Dites-nous ce qui ne va pas. Notre équipe examine chaque signalement.",
    reasonLabel: "Motif",
    reasonOptions: {
      scam_or_fraud: "Arnaque ou fraude",
      prohibited_item: "Article interdit ou illégal",
      offensive_content: "Contenu offensant ou haineux",
      personal_info: "Partage de coordonnées personnelles",
      spam: "Spam ou trompeur",
      impersonation: "Usurpation d'identité",
      other: "Autre chose",
    },
    detailLabel: "Détails (facultatif)",
    detailPlaceholder: "Ajoutez tout ce qui peut aider notre équipe à examiner plus vite.",
    submit: "Envoyer le signalement",
    submitting: "Envoi…",
    successTitle: "Signalement reçu",
    successBody: "Merci — notre équipe examinera cela sous peu.",
    errorTitle: "Échec de l'envoi",
    errorGeneric: "Une erreur s'est produite. Veuillez réessayer.",
    errorRateLimited: "Vous signalez trop vite. Patientez un instant et réessayez.",
    errorUnauthorized: "Connectez-vous pour signaler du contenu.",
    cancel: "Annuler",
  },
  notice: {
    underReviewTitle: "En cours d'examen",
    underReviewBody: "Ce contenu est en cours d'examen et n'est pas encore visible publiquement.",
    blockedTitle: "Non publié",
    blockedBody: "Ce contenu n'a pas pu être publié car il ne respecte pas notre politique de contenu.",
  },
};

const ES: Partial<ModerationCopy> = {
  report: {
    title: "Reportar este contenido",
    description: "Cuéntanos qué está mal. Nuestro equipo revisa cada reporte.",
    reasonLabel: "Motivo",
    reasonOptions: {
      scam_or_fraud: "Estafa o fraude",
      prohibited_item: "Artículo prohibido o ilegal",
      offensive_content: "Contenido ofensivo o de odio",
      personal_info: "Comparte datos de contacto personales",
      spam: "Spam o engañoso",
      impersonation: "Suplantación de identidad",
      other: "Otra cosa",
    },
    detailLabel: "Detalles (opcional)",
    detailPlaceholder: "Añade cualquier cosa que ayude a nuestro equipo a revisar más rápido.",
    submit: "Enviar reporte",
    submitting: "Enviando…",
    successTitle: "Reporte recibido",
    successBody: "Gracias: nuestro equipo lo revisará en breve.",
    errorTitle: "No se pudo enviar",
    errorGeneric: "Algo salió mal. Inténtalo de nuevo.",
    errorRateLimited: "Estás reportando demasiado rápido. Espera un momento e inténtalo de nuevo.",
    errorUnauthorized: "Inicia sesión para reportar contenido.",
    cancel: "Cancelar",
  },
  notice: {
    underReviewTitle: "En revisión",
    underReviewBody: "Este contenido está en revisión y aún no es visible públicamente.",
    blockedTitle: "No publicado",
    blockedBody: "Este contenido no se pudo publicar porque no cumple nuestra política de contenido.",
  },
};

const AR: Partial<ModerationCopy> = {
  report: {
    title: "الإبلاغ عن هذا المحتوى",
    description: "أخبرنا بالمشكلة. يراجع فريقنا كل بلاغ.",
    reasonLabel: "السبب",
    reasonOptions: {
      scam_or_fraud: "احتيال أو نصب",
      prohibited_item: "عنصر محظور أو غير قانوني",
      offensive_content: "محتوى مسيء أو يحض على الكراهية",
      personal_info: "يشارك معلومات اتصال شخصية",
      spam: "بريد مزعج أو مضلل",
      impersonation: "انتحال شخصية",
      other: "شيء آخر",
    },
    detailLabel: "تفاصيل (اختياري)",
    detailPlaceholder: "أضف أي شيء يساعد فريقنا على المراجعة بشكل أسرع.",
    submit: "إرسال البلاغ",
    submitting: "جارٍ الإرسال…",
    successTitle: "تم استلام البلاغ",
    successBody: "شكرًا — سيراجع فريقنا ذلك قريبًا.",
    errorTitle: "تعذر إرسال البلاغ",
    errorGeneric: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    errorRateLimited: "أنت تبلغ بسرعة كبيرة. انتظر لحظة وحاول مرة أخرى.",
    errorUnauthorized: "يرجى تسجيل الدخول للإبلاغ عن المحتوى.",
    cancel: "إلغاء",
  },
  notice: {
    underReviewTitle: "قيد المراجعة",
    underReviewBody: "هذا المحتوى قيد المراجعة وغير مرئي للعامة بعد.",
    blockedTitle: "غير منشور",
    blockedBody: "تعذّر نشر هذا المحتوى لأنه لا يستوفي سياسة المحتوى لدينا.",
  },
};

const LOCALE_OVERRIDES: Partial<Record<AppLocale, Partial<ModerationCopy>>> = {
  fr: FR,
  es: ES,
  ar: AR,
};

export function getModerationCopy(locale: AppLocale): ModerationCopy {
  const overrides = LOCALE_OVERRIDES[locale];
  if (overrides) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as ModerationCopy;
  }
  return EN;
}
