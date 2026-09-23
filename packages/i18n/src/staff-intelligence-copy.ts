// surface:staff_intelligence — V3-42 advanced staff dashboards (typed Pattern-A operator copy).
//
// The engines emit CODES: a lens key, a series key, an anomaly window code, a
// recommendation kind plus numeric params. This module is the only place those
// become words, which is what keeps `i18n:check:strict` green and the engines
// free of English. Every code the dashboards can produce has an entry here, and
// a test asserts that coverage in all 12 locales.
//
// Foundation locale is English — every key must exist in EN. Other locales are
// DeepPartials that deep-merge over EN, so an untranslated key falls back
// rather than rendering blank. Per the Onyx Line policy ig/yo/ha/hi are
// deliberately OMITTED (never machine-translated) and pass through to English.
//
// TONE (Register-D, operator): factual and calm. These dashboards describe
// people's live orders, bookings and accounts. "3.5x above the usual" helps an
// operator decide; "CRITICAL SPIKE" just raises their heart rate. And nothing
// here may imply the platform acted — every card PROPOSES.

import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

export type StaffIntelligenceCopy = {
  module: {
    title: string;
    description: string;
    kicker: string;
  };
  lens: {
    trust: string;
    finance: string;
    support: string;
    moderation: string;
    switchLabel: string;
  };
  chart: {
    /** Series titles, keyed by the engine's series key. */
    risk_flagged: string;
    enforcement_actions: string;
    refund_requests: string;
    payout_requests: string;
    dispute_rate: string;
    support_volume: string;
    support_forecast: string;
    at_risk_units: string;
    report_volume: string;
    kyc_submissions: string;
    /** Axis + affordance labels. */
    last28Days: string;
    next7Days: string;
    noData: string;
    drillDown: string;
  };
  anomaly: {
    title: string;
    /** windowDescription codes. */
    window_rolling: string;
    window_insufficient: string;
    band: { watch: string; alert: string };
    /** "{observed} vs {expected} typical — {deviation}x the usual spread" */
    summary: string;
    dismiss: string;
    none: string;
  };
  recommendation: {
    title: string;
    none: string;
    advisoryNote: string;
    /** Card text per kind. Params are interpolated by the consumer. */
    staffing_increase: string;
    investigate_anomaly: string;
    review_at_risk_units: string;
    review_dispute_watchlist: string;
    review_risk_backlog: string;
    rule_suggestion_hindsight: string;
    severity: { info: string; attention: string };
    actions: {
      accept: string;
      dismiss: string;
      snooze: string;
      open: string;
      accepted: string;
      dismissed: string;
      snoozed: string;
      /** Shown when the decision could not be recorded — never a false "Agreed". */
      failed: string;
    };
  };
  drill: {
    title: string;
    empty: string;
    /** Column headers. */
    reference: string;
    band: string;
    seen: string;
    restricted: string;
  };
  mobile: {
    summaryTitle: string;
    openRecommendations: string;
    fullViewOnDesktop: string;
  };
};

const EN: StaffIntelligenceCopy = {
  module: {
    title: "Intelligence",
    description: "Trends, outliers and suggestions drawn from the platform's own history.",
    kicker: "Staff · intelligence",
  },
  lens: {
    trust: "Trust & risk",
    finance: "Finance",
    support: "Support",
    moderation: "Moderation",
    switchLabel: "View",
  },
  chart: {
    risk_flagged: "Entities flagged for review",
    enforcement_actions: "Enforcement actions",
    refund_requests: "Refund requests",
    payout_requests: "Payout requests",
    dispute_rate: "Transactions on the dispute watch-list",
    support_volume: "Support conversations opened",
    support_forecast: "Expected support conversations",
    at_risk_units: "In-flight items flagged at risk",
    report_volume: "Moderation items arriving",
    kyc_submissions: "Identity checks submitted",
    last28Days: "Last 28 days",
    next7Days: "Next 7 days",
    noData: "No history yet.",
    drillDown: "See the items",
  },
  anomaly: {
    title: "Worth a look",
    window_rolling: "compared with the last 28 days",
    window_insufficient: "not enough history to judge yet",
    band: { watch: "Unusual", alert: "Well outside the usual" },
    summary: "{observed} today against {expected} typical — {deviation}x the usual spread, {window}.",
    dismiss: "Hide",
    none: "Nothing unusual right now.",
  },
  recommendation: {
    title: "Suggestions",
    none: "No suggestions right now.",
    advisoryNote:
      "Suggestions only. Accepting one records your decision and opens the surface — it changes nothing on its own.",
    staffing_increase:
      "The {queue} queue looks like it needs about {recommended} people a day next week ({extra} more than now).",
    investigate_anomaly:
      "{series} is {deviation}x its usual spread — {observed} against {expected} typical. Worth checking.",
    review_at_risk_units: "{high} in-flight items need attention, {elevated} more are worth a look.",
    review_dispute_watchlist: "{high} transactions need attention and {watch} are on the watch-list.",
    review_risk_backlog: "{review} entities are waiting on review, {freeze} are held.",
    rule_suggestion_hindsight:
      "{disputes} disputes in the last {windowDays} days shared the same cause ({factor}). A rule here may be worth designing.",
    severity: { info: "For information", attention: "Needs attention" },
    actions: {
      accept: "Agree",
      dismiss: "Not useful",
      snooze: "Remind me later",
      open: "Open",
      accepted: "Agreed",
      dismissed: "Dismissed",
      snoozed: "Snoozed",
      failed: "That did not save. Please try again.",
    },
  },
  drill: {
    title: "Underlying items",
    empty: "Nothing to show.",
    reference: "Reference",
    band: "Status",
    seen: "Seen",
    restricted: "Your role does not include these records.",
  },
  mobile: {
    summaryTitle: "Summary",
    openRecommendations: "{count} open suggestions",
    fullViewOnDesktop: "Charts and drill-down open on a larger screen.",
  },
};

const FR: DeepPartial<StaffIntelligenceCopy> = {
  module: { title: "Intelligence", kicker: "Personnel · intelligence" },
  lens: { trust: "Confiance et risque", finance: "Finance", support: "Assistance", moderation: "Modération", switchLabel: "Vue" },
  anomaly: { title: "À examiner", band: { watch: "Inhabituel", alert: "Très inhabituel" }, none: "Rien d'inhabituel pour le moment.", dismiss: "Masquer" },
  recommendation: {
    title: "Suggestions",
    none: "Aucune suggestion pour le moment.",
    advisoryNote:
      "Suggestions uniquement. Accepter enregistre votre décision et ouvre la surface — cela ne modifie rien en soi.",
    severity: { info: "Pour information", attention: "À traiter" },
    actions: { accept: "D'accord", dismiss: "Peu utile", snooze: "Me le rappeler", open: "Ouvrir", accepted: "Accepté", dismissed: "Écarté", snoozed: "Reporté" },
  },
  drill: { title: "Éléments concernés", empty: "Rien à afficher.", restricted: "Votre rôle ne couvre pas ces enregistrements." },
};

const ES: DeepPartial<StaffIntelligenceCopy> = {
  module: { title: "Inteligencia", kicker: "Personal · inteligencia" },
  lens: { trust: "Confianza y riesgo", finance: "Finanzas", support: "Soporte", moderation: "Moderación", switchLabel: "Vista" },
  anomaly: { title: "Merece revisión", band: { watch: "Inusual", alert: "Muy fuera de lo normal" }, none: "Nada inusual por ahora.", dismiss: "Ocultar" },
  recommendation: {
    title: "Sugerencias",
    none: "No hay sugerencias por ahora.",
    advisoryNote:
      "Solo sugerencias. Aceptar registra tu decisión y abre la pantalla — por sí solo no cambia nada.",
    severity: { info: "Informativo", attention: "Requiere atención" },
    actions: { accept: "De acuerdo", dismiss: "Poco útil", snooze: "Recordar luego", open: "Abrir", accepted: "Aceptada", dismissed: "Descartada", snoozed: "Pospuesta" },
  },
  drill: { title: "Elementos relacionados", empty: "Nada que mostrar.", restricted: "Tu rol no incluye estos registros." },
};

const PT: DeepPartial<StaffIntelligenceCopy> = {
  module: { title: "Inteligência", kicker: "Equipa · inteligência" },
  lens: { trust: "Confiança e risco", finance: "Finanças", support: "Apoio", moderation: "Moderação", switchLabel: "Vista" },
  anomaly: { title: "Merece atenção", band: { watch: "Invulgar", alert: "Muito fora do normal" }, none: "Nada invulgar de momento.", dismiss: "Ocultar" },
  recommendation: {
    title: "Sugestões",
    none: "Sem sugestões de momento.",
    advisoryNote: "Apenas sugestões. Aceitar regista a sua decisão e abre o ecrã — por si só não altera nada.",
    severity: { info: "Informativo", attention: "Precisa de atenção" },
    actions: { accept: "Concordo", dismiss: "Pouco útil", snooze: "Lembrar depois", open: "Abrir", accepted: "Aceite", dismissed: "Dispensada", snoozed: "Adiada" },
  },
  drill: { title: "Itens relacionados", empty: "Nada a mostrar.", restricted: "A sua função não inclui estes registos." },
};

const DE: DeepPartial<StaffIntelligenceCopy> = {
  module: { title: "Intelligence", kicker: "Team · Intelligence" },
  lens: { trust: "Vertrauen & Risiko", finance: "Finanzen", support: "Support", moderation: "Moderation", switchLabel: "Ansicht" },
  anomaly: { title: "Bitte prüfen", band: { watch: "Ungewöhnlich", alert: "Deutlich ungewöhnlich" }, none: "Derzeit nichts Ungewöhnliches.", dismiss: "Ausblenden" },
  recommendation: {
    title: "Vorschläge",
    none: "Derzeit keine Vorschläge.",
    advisoryNote:
      "Nur Vorschläge. Zustimmen hält Ihre Entscheidung fest und öffnet die Ansicht — es ändert für sich genommen nichts.",
    severity: { info: "Zur Information", attention: "Handlungsbedarf" },
    actions: { accept: "Zustimmen", dismiss: "Nicht hilfreich", snooze: "Später erinnern", open: "Öffnen", accepted: "Zugestimmt", dismissed: "Verworfen", snoozed: "Zurückgestellt" },
  },
  drill: { title: "Zugrunde liegende Einträge", empty: "Nichts anzuzeigen.", restricted: "Ihre Rolle umfasst diese Einträge nicht." },
};

const IT: DeepPartial<StaffIntelligenceCopy> = {
  module: { title: "Intelligence", kicker: "Staff · intelligence" },
  lens: { trust: "Fiducia e rischio", finance: "Finanza", support: "Assistenza", moderation: "Moderazione", switchLabel: "Vista" },
  anomaly: { title: "Da controllare", band: { watch: "Insolito", alert: "Molto fuori norma" }, none: "Nulla di insolito al momento.", dismiss: "Nascondi" },
  recommendation: {
    title: "Suggerimenti",
    none: "Nessun suggerimento al momento.",
    advisoryNote: "Solo suggerimenti. Accettare registra la tua decisione e apre la schermata — da solo non cambia nulla.",
    severity: { info: "Informativo", attention: "Richiede attenzione" },
    actions: { accept: "D'accordo", dismiss: "Poco utile", snooze: "Ricordamelo", open: "Apri", accepted: "Accettato", dismissed: "Scartato", snoozed: "Rimandato" },
  },
  drill: { title: "Elementi correlati", empty: "Niente da mostrare.", restricted: "Il tuo ruolo non include questi record." },
};

const AR: DeepPartial<StaffIntelligenceCopy> = {
  module: { title: "الذكاء التشغيلي", kicker: "الفريق · الذكاء التشغيلي" },
  lens: { trust: "الثقة والمخاطر", finance: "المالية", support: "الدعم", moderation: "الإشراف", switchLabel: "العرض" },
  anomaly: { title: "يستحق المراجعة", band: { watch: "غير معتاد", alert: "خارج المعتاد بوضوح" }, none: "لا شيء غير معتاد حاليًا.", dismiss: "إخفاء" },
  recommendation: {
    title: "اقتراحات",
    none: "لا توجد اقتراحات حاليًا.",
    advisoryNote: "اقتراحات فقط. الموافقة تسجّل قرارك وتفتح الشاشة — ولا تغيّر شيئًا بذاتها.",
    severity: { info: "للعلم", attention: "يحتاج انتباه" },
    actions: { accept: "موافق", dismiss: "غير مفيد", snooze: "ذكّرني لاحقًا", open: "فتح", accepted: "تمت الموافقة", dismissed: "تم التجاهل", snoozed: "مؤجل" },
  },
  drill: { title: "العناصر ذات الصلة", empty: "لا شيء لعرضه.", restricted: "دورك لا يشمل هذه السجلات." },
};

const ZH: DeepPartial<StaffIntelligenceCopy> = {
  module: { title: "运营智能", kicker: "员工 · 运营智能" },
  lens: { trust: "信任与风险", finance: "财务", support: "支持", moderation: "审核", switchLabel: "视图" },
  anomaly: { title: "值得查看", band: { watch: "异常", alert: "明显异常" }, none: "目前没有异常。", dismiss: "隐藏" },
  recommendation: {
    title: "建议",
    none: "目前没有建议。",
    advisoryNote: "仅为建议。同意会记录你的决定并打开相应页面，本身不会更改任何内容。",
    severity: { info: "供参考", attention: "需要处理" },
    actions: { accept: "同意", dismiss: "没有帮助", snooze: "稍后提醒", open: "打开", accepted: "已同意", dismissed: "已忽略", snoozed: "已延后" },
  },
  drill: { title: "相关条目", empty: "没有可显示的内容。", restricted: "你的角色不包含这些记录。" },
};

// ig / yo / ha / hi are intentionally absent — never machine-translated; they
// fall through to English by construction (the Onyx Line WS-2 policy).
const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<StaffIntelligenceCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  de: DE,
  it: IT,
  ar: AR,
  zh: ZH,
};

export function getStaffIntelligenceCopy(locale: AppLocale): StaffIntelligenceCopy {
  const overrides = LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as StaffIntelligenceCopy;
  }
  return EN;
}

/** @internal */
export function __dangerouslyGetEnglishStaffIntelligenceCopy(): StaffIntelligenceCopy {
  return EN;
}
