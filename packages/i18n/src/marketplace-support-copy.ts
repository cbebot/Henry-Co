import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

export type MarketplaceSupportCopy = {
  finance: {
    title: string;
    description: string;
    paymentFallback: string;
    methodFallback: string;
    statusFallback: string;
    viewProof: string;
    noReference: string;
    feeFallback: string;
    notePlaceholder: string;
    verifyPayment: string;
    payoutFallback: string;
    financeNotePlaceholder: string;
    approve: string;
    reject: string;
  };
  support: {
    title: string;
    description: string;
    disputeFallback: string;
    issueFallback: string;
    notePlaceholder: string;
    investigating: string;
    resolve: string;
  };
  helpCentre: {
    searchPlaceholder: string;
    searchAriaLabel: string;
    matchesLabel: (count: number) => string;
    noMatches: string;
  };
};

const EN: MarketplaceSupportCopy = {
  finance: {
    title: "Finance",
    description:
      "Manual payment verification, payout approvals, and finance-led exceptions stay isolated here.",
    paymentFallback: "Payment",
    methodFallback: "bank transfer",
    statusFallback: "pending",
    viewProof: "View payment proof",
    noReference: "No reference",
    feeFallback: "Fee",
    notePlaceholder: "Verification note",
    verifyPayment: "Verify payment",
    payoutFallback: "Payout",
    financeNotePlaceholder: "Finance note",
    approve: "Approve",
    reject: "Reject",
  },
  support: {
    title: "Support",
    description:
      "Buyer issues, dispute notes, and order pressure are resolved here with the audit trail preserved.",
    disputeFallback: "Dispute",
    issueFallback: "Issue",
    notePlaceholder: "Support note",
    investigating: "Investigating",
    resolve: "Resolve",
  },
  helpCentre: {
    searchPlaceholder: "Search help — e.g. refund, missing item, payout",
    searchAriaLabel: "Search the help centre",
    matchesLabel: (count: number) => `${count} match${count === 1 ? "" : "es"} for`,
    noMatches:
      "No FAQ matches yet. Try fewer words, or open a support ticket below and a person will read it.",
  },
};

const FR: DeepPartial<MarketplaceSupportCopy> = {
  finance: {
    title: "Finances",
    description:
      "La vérification manuelle des paiements, l'approbation des versements et les exceptions pilotées par les finances restent isolées ici.",
    paymentFallback: "Paiement",
    methodFallback: "virement bancaire",
    statusFallback: "en attente",
    viewProof: "Voir le justificatif de paiement",
    noReference: "Aucune référence",
    feeFallback: "Frais",
    notePlaceholder: "Note de vérification",
    verifyPayment: "Vérifier le paiement",
    payoutFallback: "Versement",
    financeNotePlaceholder: "Note des finances",
    approve: "Approuver",
    reject: "Rejeter",
  },
  support: {
    title: "Assistance",
    description:
      "Les problèmes des acheteurs, les notes de litige et la pression sur les commandes sont résolus ici tout en préservant la piste d'audit.",
    disputeFallback: "Litige",
    issueFallback: "Problème",
    notePlaceholder: "Note d'assistance",
    investigating: "En cours d'examen",
    resolve: "Résoudre",
  },
  helpCentre: {
    searchPlaceholder:
      "Rechercher de l'aide — par ex. remboursement, article manquant, versement",
    searchAriaLabel: "Rechercher dans le centre d'aide",
    matchesLabel: (count: number) =>
      `${count} résultat${count === 1 ? "" : "s"} pour`,
    noMatches:
      "Aucune correspondance dans la FAQ pour l'instant. Essayez moins de mots ou ouvrez un ticket d'assistance ci-dessous et une personne le lira.",
  },
};

const ES: DeepPartial<MarketplaceSupportCopy> = {
  finance: {
    title: "Finanzas",
    description:
      "La verificación manual de pagos, la aprobación de desembolsos y las excepciones gestionadas por finanzas se mantienen aisladas aquí.",
    paymentFallback: "Pago",
    methodFallback: "transferencia bancaria",
    statusFallback: "pendiente",
    viewProof: "Ver comprobante de pago",
    noReference: "Sin referencia",
    feeFallback: "Comisión",
    notePlaceholder: "Nota de verificación",
    verifyPayment: "Verificar pago",
    payoutFallback: "Desembolso",
    financeNotePlaceholder: "Nota de finanzas",
    approve: "Aprobar",
    reject: "Rechazar",
  },
  support: {
    title: "Soporte",
    description:
      "Los problemas de los compradores, las notas de disputa y la presión sobre los pedidos se resuelven aquí conservando el registro de auditoría.",
    disputeFallback: "Disputa",
    issueFallback: "Incidencia",
    notePlaceholder: "Nota de soporte",
    investigating: "Investigando",
    resolve: "Resolver",
  },
  helpCentre: {
    searchPlaceholder:
      "Buscar ayuda — p. ej. reembolso, artículo faltante, desembolso",
    searchAriaLabel: "Buscar en el centro de ayuda",
    matchesLabel: (count: number) =>
      `${count} resultado${count === 1 ? "" : "s"} para`,
    noMatches:
      "Aún no hay coincidencias en las preguntas frecuentes. Prueba con menos palabras o abre un ticket de soporte abajo y una persona lo leerá.",
  },
};

const PT: DeepPartial<MarketplaceSupportCopy> = {
  finance: {
    title: "Finanças",
    description:
      "A verificação manual de pagamentos, a aprovação de repasses e as exceções conduzidas pelas finanças permanecem isoladas aqui.",
    paymentFallback: "Pagamento",
    methodFallback: "transferência bancária",
    statusFallback: "pendente",
    viewProof: "Ver comprovante de pagamento",
    noReference: "Sem referência",
    feeFallback: "Taxa",
    notePlaceholder: "Nota de verificação",
    verifyPayment: "Verificar pagamento",
    payoutFallback: "Repasse",
    financeNotePlaceholder: "Nota das finanças",
    approve: "Aprovar",
    reject: "Rejeitar",
  },
  support: {
    title: "Suporte",
    description:
      "Os problemas dos compradores, as notas de disputa e a pressão sobre os pedidos são resolvidos aqui com a trilha de auditoria preservada.",
    disputeFallback: "Disputa",
    issueFallback: "Problema",
    notePlaceholder: "Nota de suporte",
    investigating: "Investigando",
    resolve: "Resolver",
  },
  helpCentre: {
    searchPlaceholder:
      "Pesquisar ajuda — por ex. reembolso, item faltando, repasse",
    searchAriaLabel: "Pesquisar na central de ajuda",
    matchesLabel: (count: number) =>
      `${count} resultado${count === 1 ? "" : "s"} para`,
    noMatches:
      "Ainda não há correspondências nas perguntas frequentes. Tente menos palavras ou abra um chamado de suporte abaixo e uma pessoa irá lê-lo.",
  },
};

const AR: DeepPartial<MarketplaceSupportCopy> = {
  finance: {
    title: "المالية",
    description:
      "يبقى التحقق اليدوي من المدفوعات والموافقة على المدفوعات الصادرة والاستثناءات التي تقودها المالية معزولة هنا.",
    paymentFallback: "دفعة",
    methodFallback: "تحويل بنكي",
    statusFallback: "قيد الانتظار",
    viewProof: "عرض إثبات الدفع",
    noReference: "لا يوجد مرجع",
    feeFallback: "رسوم",
    notePlaceholder: "ملاحظة التحقق",
    verifyPayment: "التحقق من الدفع",
    payoutFallback: "دفعة صادرة",
    financeNotePlaceholder: "ملاحظة مالية",
    approve: "موافقة",
    reject: "رفض",
  },
  support: {
    title: "الدعم",
    description:
      "تُحل مشكلات المشترين وملاحظات النزاعات وضغط الطلبات هنا مع الحفاظ على سجل التدقيق.",
    disputeFallback: "نزاع",
    issueFallback: "مشكلة",
    notePlaceholder: "ملاحظة الدعم",
    investigating: "قيد التحقيق",
    resolve: "حل",
  },
  helpCentre: {
    searchPlaceholder: "ابحث عن مساعدة — مثل استرداد، عنصر مفقود، دفعة صادرة",
    searchAriaLabel: "ابحث في مركز المساعدة",
    matchesLabel: (count: number) => `${count} نتيجة لـ`,
    noMatches:
      "لا توجد نتائج في الأسئلة الشائعة بعد. جرّب كلمات أقل أو افتح تذكرة دعم أدناه وسيقرأها شخص ما.",
  },
};

const DE: DeepPartial<MarketplaceSupportCopy> = {
  finance: {
    title: "Finanzen",
    description:
      "Manuelle Zahlungsprüfung, Auszahlungsfreigaben und finanzgeführte Ausnahmen bleiben hier isoliert.",
    paymentFallback: "Zahlung",
    methodFallback: "Banküberweisung",
    statusFallback: "ausstehend",
    viewProof: "Zahlungsnachweis ansehen",
    noReference: "Keine Referenz",
    feeFallback: "Gebühr",
    notePlaceholder: "Prüfungsnotiz",
    verifyPayment: "Zahlung bestätigen",
    payoutFallback: "Auszahlung",
    financeNotePlaceholder: "Finanznotiz",
    approve: "Genehmigen",
    reject: "Ablehnen",
  },
  support: {
    title: "Support",
    description:
      "Käuferprobleme, Streitfallnotizen und Bestelldruck werden hier unter Wahrung des Prüfprotokolls gelöst.",
    disputeFallback: "Streitfall",
    issueFallback: "Problem",
    notePlaceholder: "Support-Notiz",
    investigating: "Wird untersucht",
    resolve: "Lösen",
  },
  helpCentre: {
    searchPlaceholder:
      "Hilfe suchen — z. B. Erstattung, fehlender Artikel, Auszahlung",
    searchAriaLabel: "Im Hilfecenter suchen",
    matchesLabel: (count: number) =>
      `${count} Treffer für`,
    noMatches:
      "Noch keine FAQ-Treffer. Versuchen Sie weniger Wörter oder eröffnen Sie unten ein Support-Ticket, das eine Person lesen wird.",
  },
};

const IT: DeepPartial<MarketplaceSupportCopy> = {
  finance: {
    title: "Finanza",
    description:
      "La verifica manuale dei pagamenti, l'approvazione dei versamenti e le eccezioni gestite dalla finanza restano isolate qui.",
    paymentFallback: "Pagamento",
    methodFallback: "bonifico bancario",
    statusFallback: "in sospeso",
    viewProof: "Vedi prova di pagamento",
    noReference: "Nessun riferimento",
    feeFallback: "Commissione",
    notePlaceholder: "Nota di verifica",
    verifyPayment: "Verifica pagamento",
    payoutFallback: "Versamento",
    financeNotePlaceholder: "Nota della finanza",
    approve: "Approva",
    reject: "Rifiuta",
  },
  support: {
    title: "Assistenza",
    description:
      "I problemi degli acquirenti, le note di contestazione e la pressione sugli ordini vengono risolti qui mantenendo la traccia di controllo.",
    disputeFallback: "Contestazione",
    issueFallback: "Problema",
    notePlaceholder: "Nota di assistenza",
    investigating: "In esame",
    resolve: "Risolvi",
  },
  helpCentre: {
    searchPlaceholder:
      "Cerca assistenza — es. rimborso, articolo mancante, versamento",
    searchAriaLabel: "Cerca nel centro assistenza",
    matchesLabel: (count: number) =>
      `${count} risultato${count === 1 ? "" : "i"} per`,
    noMatches:
      "Nessuna corrispondenza nelle FAQ per ora. Prova con meno parole o apri un ticket di assistenza qui sotto e una persona lo leggerà.",
  },
};

const ZH: DeepPartial<MarketplaceSupportCopy> = {
  finance: {
    title: "财务",
    description: "手动付款核验、付款审批以及财务主导的例外情况均在此独立处理。",
    paymentFallback: "付款",
    methodFallback: "银行转账",
    statusFallback: "待处理",
    viewProof: "查看付款凭证",
    noReference: "无参考编号",
    feeFallback: "费用",
    notePlaceholder: "核验备注",
    verifyPayment: "核验付款",
    payoutFallback: "付款发放",
    financeNotePlaceholder: "财务备注",
    approve: "批准",
    reject: "拒绝",
  },
  support: {
    title: "支持",
    description: "买家问题、争议备注和订单压力均在此处理，并保留审计记录。",
    disputeFallback: "争议",
    issueFallback: "问题",
    notePlaceholder: "支持备注",
    investigating: "调查中",
    resolve: "解决",
  },
  helpCentre: {
    searchPlaceholder: "搜索帮助 — 例如退款、缺货商品、付款发放",
    searchAriaLabel: "搜索帮助中心",
    matchesLabel: (count: number) => `${count} 条匹配结果`,
    noMatches: "暂无常见问题匹配。请尝试更少的关键词，或在下方提交支持工单，会有专人查看。",
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<MarketplaceSupportCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
};
// ig, yo, ha, hi are intentionally OMITTED -> fall back to EN (human-translation only).

export function getMarketplaceSupportCopy(locale: AppLocale): MarketplaceSupportCopy {
  const o = LOCALE_MAP[locale];
  if (o)
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      o as unknown as Record<string, unknown>,
    ) as unknown as MarketplaceSupportCopy;
  return EN;
}
