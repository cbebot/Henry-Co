// surface:staff_predictive — V3-41 predictive quality & workload (typed Pattern-A operator copy).
//
// Every operator-visible string for the predictive panels lives here. The engines
// emit CODES (`forecast_above_capacity`, `provider_silent`, `item_not_received_reported`);
// this module is the only place those codes become words, which is what keeps
// `i18n:check:strict` green and the engines free of English.
//
// Foundation locale is English — every key must exist in EN. Each other locale is
// a DeepPartial that deep-merges over EN, so an untranslated key silently falls
// back rather than rendering blank. Per the Onyx Line policy, ig/yo/ha/hi are
// deliberately OMITTED from the locale map (never machine-translated) and pass
// through to English by construction.
//
// TONE (Register-D, operator): plain, factual, no drama. These panels describe
// people's live bookings and orders; a staff member reading "URGENT: failing!"
// makes worse decisions than one reading "no provider message in 72h".

import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

export type StaffPredictiveCopy = {
  panel: {
    kicker: string;
    forecastTitle: string;
    staffingTitle: string;
    atRiskTitle: string;
    disputeTitle: string;
    /** Shown while the model is in its shadow window — the honesty line. */
    shadowNotice: string;
    emptyForecast: string;
    emptyAtRisk: string;
    emptyDispute: string;
    advisoryNote: string;
  };
  evidence: {
    seasonal: string;
    sparse: string;
    empty: string;
    /** "{count} observed hours" */
    sampleSize: string;
  };
  forecast: {
    nextSevenDays: string;
    busiestHour: string;
    recommendedAgents: string;
  };
  staffingRationale: {
    forecast_within_capacity: string;
    forecast_above_capacity: string;
    forecast_peak_hour_pressure: string;
    insufficient_history: string;
  };
  riskBand: {
    low: string;
    elevated: string;
    high: string;
  };
  disputeBand: {
    low: string;
    watch: string;
    high: string;
  };
  qualityReason: {
    provider_silent: string;
    milestone_overdue: string;
    payment_stalled: string;
    provider_low_completion_rate: string;
    provider_slow_response: string;
    customer_disengaged: string;
    prior_complaint_on_unit: string;
    delivery_window_missed: string;
  };
  intervention: {
    staff_review: string;
    staff_contact_customer: string;
    staff_contact_provider: string;
    staff_reassign_provider: string;
    staff_offer_goodwill: string;
  };
  disputeFactor: {
    high_value_transaction: string;
    delivery_confirmation_gap: string;
    category_base_rate: string;
    buyer_prior_dispute_rate: string;
    seller_prior_dispute_rate: string;
    refund_requested_unresolved: string;
    item_not_received_reported: string;
    settlement_age: string;
  };
  unitType: {
    care_booking: string;
    studio_project: string;
    learn_enrolment: string;
    marketplace_order: string;
  };
};

const EN: StaffPredictiveCopy = {
  panel: {
    kicker: "Predicted",
    forecastTitle: "Next 7 days",
    staffingTitle: "Suggested cover",
    atRiskTitle: "Needs a look",
    disputeTitle: "Dispute watch-list",
    shadowNotice:
      "Advisory while the model is being validated. Suggested cover is not yet an approved staffing figure.",
    emptyForecast: "Not enough history yet to forecast this queue.",
    emptyAtRisk: "Nothing flagged right now.",
    emptyDispute: "No transactions on the watch-list.",
    advisoryNote: "These are suggestions for a person to act on. Nothing here changes a customer's account.",
  },
  evidence: {
    seasonal: "Based on weekly patterns",
    sparse: "Limited history — treat as a rough guide",
    empty: "No history yet",
    sampleSize: "{count} observed hours",
  },
  forecast: {
    nextSevenDays: "Expected items",
    busiestHour: "Busiest hour",
    recommendedAgents: "Suggested people per day",
  },
  staffingRationale: {
    forecast_within_capacity: "Within current cover",
    forecast_above_capacity: "Above the cover ceiling — plan ahead",
    forecast_peak_hour_pressure: "Concentrated in a few hours",
    insufficient_history: "Not enough history to suggest cover",
  },
  riskBand: {
    low: "Steady",
    elevated: "Worth a look",
    high: "Needs attention",
  },
  disputeBand: {
    low: "Steady",
    watch: "Watch",
    high: "Needs attention",
  },
  qualityReason: {
    provider_silent: "No provider message recently",
    milestone_overdue: "A milestone is past its date",
    payment_stalled: "A payment step is waiting",
    provider_low_completion_rate: "Provider completes fewer jobs than usual",
    provider_slow_response: "Provider is slower than usual to reply",
    customer_disengaged: "Little customer activity",
    prior_complaint_on_unit: "A complaint was already raised here",
    delivery_window_missed: "The delivery window has passed",
  },
  intervention: {
    staff_review: "Review this one",
    staff_contact_customer: "Contact the customer",
    staff_contact_provider: "Contact the provider",
    staff_reassign_provider: "Consider reassigning",
    staff_offer_goodwill: "Consider a goodwill gesture",
  },
  disputeFactor: {
    high_value_transaction: "Higher order value",
    delivery_confirmation_gap: "No delivery confirmation yet",
    category_base_rate: "Category disputes more often",
    buyer_prior_dispute_rate: "Buyer has disputed before",
    seller_prior_dispute_rate: "Seller has had disputes before",
    refund_requested_unresolved: "Refund asked for, still open",
    item_not_received_reported: "Buyer reported non-receipt",
    settlement_age: "Time since payment",
  },
  unitType: {
    care_booking: "Care booking",
    studio_project: "Studio project",
    learn_enrolment: "Learn enrolment",
    marketplace_order: "Marketplace order",
  },
};

const FR: DeepPartial<StaffPredictiveCopy> = {
  panel: {
    kicker: "Prévision",
    forecastTitle: "7 prochains jours",
    staffingTitle: "Effectif suggéré",
    atRiskTitle: "À examiner",
    disputeTitle: "Litiges à surveiller",
    shadowNotice:
      "Indicatif pendant la validation du modèle. L'effectif suggéré n'est pas encore approuvé.",
    emptyForecast: "Pas encore assez d'historique pour cette file.",
    emptyAtRisk: "Rien à signaler pour le moment.",
    emptyDispute: "Aucune transaction à surveiller.",
    advisoryNote: "Ce sont des suggestions destinées à une personne. Rien ici ne modifie un compte client.",
  },
  riskBand: { low: "Stable", elevated: "À examiner", high: "À traiter" },
  disputeBand: { low: "Stable", watch: "À surveiller", high: "À traiter" },
  intervention: {
    staff_review: "Examiner ce dossier",
    staff_contact_customer: "Contacter le client",
    staff_contact_provider: "Contacter le prestataire",
    staff_reassign_provider: "Envisager une réattribution",
    staff_offer_goodwill: "Envisager un geste commercial",
  },
};

const ES: DeepPartial<StaffPredictiveCopy> = {
  panel: {
    kicker: "Previsión",
    forecastTitle: "Próximos 7 días",
    staffingTitle: "Cobertura sugerida",
    atRiskTitle: "Requiere revisión",
    disputeTitle: "Disputas en observación",
    shadowNotice:
      "Orientativo mientras se valida el modelo. La cobertura sugerida aún no está aprobada.",
    emptyForecast: "Todavía no hay suficiente historial para esta cola.",
    emptyAtRisk: "Nada marcado por ahora.",
    emptyDispute: "No hay transacciones en observación.",
    advisoryNote: "Son sugerencias para que actúe una persona. Nada de esto cambia la cuenta de un cliente.",
  },
  riskBand: { low: "Estable", elevated: "Revisar", high: "Requiere atención" },
  disputeBand: { low: "Estable", watch: "Observar", high: "Requiere atención" },
  intervention: {
    staff_review: "Revisar este caso",
    staff_contact_customer: "Contactar al cliente",
    staff_contact_provider: "Contactar al proveedor",
    staff_reassign_provider: "Considerar reasignar",
    staff_offer_goodwill: "Considerar un gesto comercial",
  },
};

const PT: DeepPartial<StaffPredictiveCopy> = {
  panel: {
    kicker: "Previsão",
    forecastTitle: "Próximos 7 dias",
    staffingTitle: "Cobertura sugerida",
    atRiskTitle: "Precisa de atenção",
    disputeTitle: "Disputas em observação",
    shadowNotice:
      "Indicativo enquanto o modelo é validado. A cobertura sugerida ainda não foi aprovada.",
    emptyForecast: "Ainda não há histórico suficiente para esta fila.",
    emptyAtRisk: "Nada sinalizado no momento.",
    emptyDispute: "Nenhuma transação em observação.",
    advisoryNote: "São sugestões para uma pessoa agir. Nada aqui altera a conta de um cliente.",
  },
  riskBand: { low: "Estável", elevated: "Rever", high: "Precisa de atenção" },
  disputeBand: { low: "Estável", watch: "Observar", high: "Precisa de atenção" },
};

const DE: DeepPartial<StaffPredictiveCopy> = {
  panel: {
    kicker: "Prognose",
    forecastTitle: "Nächste 7 Tage",
    staffingTitle: "Empfohlene Besetzung",
    atRiskTitle: "Bitte prüfen",
    disputeTitle: "Beobachtete Streitfälle",
    shadowNotice:
      "Richtwert, solange das Modell validiert wird. Die empfohlene Besetzung ist noch nicht freigegeben.",
    emptyForecast: "Noch nicht genug Verlauf für diese Warteschlange.",
    emptyAtRisk: "Derzeit nichts markiert.",
    emptyDispute: "Keine Transaktionen auf der Beobachtungsliste.",
    advisoryNote: "Das sind Vorschläge für einen Menschen. Nichts davon ändert ein Kundenkonto.",
  },
  riskBand: { low: "Stabil", elevated: "Prüfen", high: "Handlungsbedarf" },
  disputeBand: { low: "Stabil", watch: "Beobachten", high: "Handlungsbedarf" },
};

const IT: DeepPartial<StaffPredictiveCopy> = {
  panel: {
    kicker: "Previsione",
    forecastTitle: "Prossimi 7 giorni",
    staffingTitle: "Copertura suggerita",
    atRiskTitle: "Da controllare",
    disputeTitle: "Controversie da monitorare",
    shadowNotice:
      "Indicativo mentre il modello viene validato. La copertura suggerita non è ancora approvata.",
    emptyForecast: "Storico ancora insufficiente per questa coda.",
    emptyAtRisk: "Nessuna segnalazione al momento.",
    emptyDispute: "Nessuna transazione da monitorare.",
    advisoryNote: "Sono suggerimenti per una persona. Nulla qui modifica l'account di un cliente.",
  },
  riskBand: { low: "Stabile", elevated: "Da controllare", high: "Richiede attenzione" },
  disputeBand: { low: "Stabile", watch: "Monitorare", high: "Richiede attenzione" },
};

const AR: DeepPartial<StaffPredictiveCopy> = {
  panel: {
    kicker: "توقّع",
    forecastTitle: "الأيام السبعة القادمة",
    staffingTitle: "التغطية المقترحة",
    atRiskTitle: "يحتاج مراجعة",
    disputeTitle: "نزاعات تحت المراقبة",
    shadowNotice: "إرشادي أثناء التحقق من النموذج. التغطية المقترحة غير معتمدة بعد.",
    emptyForecast: "لا يوجد سجل كافٍ بعد لهذا الطابور.",
    emptyAtRisk: "لا شيء مُعلَّم حاليًا.",
    emptyDispute: "لا توجد معاملات تحت المراقبة.",
    advisoryNote: "هذه اقتراحات ليتصرف بناءً عليها شخص. لا شيء هنا يغيّر حساب عميل.",
  },
  riskBand: { low: "مستقر", elevated: "يستحق المراجعة", high: "يحتاج انتباه" },
  disputeBand: { low: "مستقر", watch: "مراقبة", high: "يحتاج انتباه" },
};

const ZH: DeepPartial<StaffPredictiveCopy> = {
  panel: {
    kicker: "预测",
    forecastTitle: "未来 7 天",
    staffingTitle: "建议人力",
    atRiskTitle: "需要查看",
    disputeTitle: "争议观察名单",
    shadowNotice: "模型验证期间仅供参考。建议人力尚未获得批准。",
    emptyForecast: "该队列的历史数据尚不足以预测。",
    emptyAtRisk: "目前没有标记项。",
    emptyDispute: "观察名单中没有交易。",
    advisoryNote: "这些是供人工处理的建议。此处不会更改任何客户账户。",
  },
  riskBand: { low: "平稳", elevated: "值得查看", high: "需要处理" },
  disputeBand: { low: "平稳", watch: "观察", high: "需要处理" },
};

// ig / yo / ha / hi are intentionally absent — never machine-translated; they
// fall through to English by construction (the Onyx Line WS-2 policy).
const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<StaffPredictiveCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  de: DE,
  it: IT,
  ar: AR,
  zh: ZH,
};

export function getStaffPredictiveCopy(locale: AppLocale): StaffPredictiveCopy {
  const overrides = LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as StaffPredictiveCopy;
  }
  return EN;
}

/** @internal */
export function __dangerouslyGetEnglishStaffPredictiveCopy(): StaffPredictiveCopy {
  return EN;
}
