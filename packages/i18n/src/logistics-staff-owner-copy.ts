import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * LogisticsStaffOwnerCopy — i18n surface for the `/owner` staff dashboard
 * landing page on apps/logistics. Covers metadata, the hero (eyebrow,
 * title, body), the four KPI tiles (volume, revenue, B2B accounts, open
 * claims) with their dynamic trend phrases, the top-corridors panel, the
 * unknown-zone fallback, and the singular/plural shipment count template.
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each locale is
 * a Partial that deep-merges over EN so missing keys fall back silently.
 * Mirrors the shape of `logistics-home-copy.ts`.
 */
export type LogisticsStaffOwnerCopy = {
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    body: string;
  };
  metrics: {
    volumeLabel: string;
    volumeUniqueCustomers: string;
    revenueLabel: string;
    revenueVs: string;
    revenueMargin: string;
    b2bLabel: string;
    b2bActive: string;
    b2bAcquireFirst: string;
    claimsLabel: string;
    claimsAtRisk: string;
    claimsIntact: string;
  };
  corridors: {
    title: string;
    unknownZone: string;
    shipmentSingular: string;
    shipmentPlural: string;
  };
};

const LOGISTICS_STAFF_OWNER_COPY_EN: LogisticsStaffOwnerCopy = {
  metadata: {
    title: "Owner suite — Strategic monthly view | Henry Onyx Logistics",
    description:
      "The monthly view. Growth, margin, top corridors, customer trust, and claim rate for Henry Onyx Logistics owners.",
  },
  hero: {
    eyebrow: "Owner suite",
    title: "Strategic",
    body: "The monthly view. Growth, margin, top corridors, customer trust, and claim rate.",
  },
  metrics: {
    volumeLabel: "Volume (period)",
    volumeUniqueCustomers: "{count} unique customers",
    revenueLabel: "Revenue",
    revenueVs: "settled total",
    revenueMargin: "Margin {amount}",
    b2bLabel: "B2B accounts",
    b2bActive: "{count} active",
    b2bAcquireFirst: "Acquire first B2B account",
    claimsLabel: "Open claims",
    claimsAtRisk: "Trust at risk",
    claimsIntact: "Trust intact",
  },
  corridors: {
    title: "Top corridors (by volume)",
    unknownZone: "Unknown",
    shipmentSingular: "shipment",
    shipmentPlural: "shipments",
  },
};

const LOGISTICS_STAFF_OWNER_COPY_FR: DeepPartial<LogisticsStaffOwnerCopy> = {
  metadata: {
    title: "Suite propriétaire — Vue mensuelle stratégique | Henry Onyx Logistics",
    description:
      "La vue mensuelle. Croissance, marge, corridors principaux, confiance client et taux de réclamation pour les propriétaires Henry Onyx Logistics.",
  },
  hero: {
    eyebrow: "Suite propriétaire",
    title: "Stratégique",
    body: "La vue mensuelle. Croissance, marge, corridors principaux, confiance client et taux de réclamation.",
  },
  metrics: {
    volumeLabel: "Volume (période)",
    volumeUniqueCustomers: "{count} clients uniques",
    revenueLabel: "Chiffre d'affaires",
    revenueVs: "total réglé",
    revenueMargin: "Marge {amount}",
    b2bLabel: "Comptes B2B",
    b2bActive: "{count} actifs",
    b2bAcquireFirst: "Acquérir le premier compte B2B",
    claimsLabel: "Réclamations ouvertes",
    claimsAtRisk: "Confiance en danger",
    claimsIntact: "Confiance préservée",
  },
  corridors: {
    title: "Principaux corridors (par volume)",
    unknownZone: "Inconnu",
    shipmentSingular: "envoi",
    shipmentPlural: "envois",
  },
};

const LOGISTICS_STAFF_OWNER_COPY_ES: DeepPartial<LogisticsStaffOwnerCopy> = {
  metadata: {
    title: "Suite del propietario — Vista mensual estratégica | Henry Onyx Logistics",
    description:
      "La vista mensual. Crecimiento, margen, principales corredores, confianza del cliente y tasa de reclamaciones para propietarios de Henry Onyx Logistics.",
  },
  hero: {
    eyebrow: "Suite del propietario",
    title: "Estratégica",
    body: "La vista mensual. Crecimiento, margen, principales corredores, confianza del cliente y tasa de reclamaciones.",
  },
  metrics: {
    volumeLabel: "Volumen (período)",
    volumeUniqueCustomers: "{count} clientes únicos",
    revenueLabel: "Ingresos",
    revenueVs: "total liquidado",
    revenueMargin: "Margen {amount}",
    b2bLabel: "Cuentas B2B",
    b2bActive: "{count} activas",
    b2bAcquireFirst: "Adquirir la primera cuenta B2B",
    claimsLabel: "Reclamaciones abiertas",
    claimsAtRisk: "Confianza en riesgo",
    claimsIntact: "Confianza intacta",
  },
  corridors: {
    title: "Principales corredores (por volumen)",
    unknownZone: "Desconocido",
    shipmentSingular: "envío",
    shipmentPlural: "envíos",
  },
};

const LOGISTICS_STAFF_OWNER_COPY_PT: DeepPartial<LogisticsStaffOwnerCopy> = {
  metadata: {
    title: "Suite do proprietário — Visão mensal estratégica | Henry Onyx Logistics",
    description:
      "A visão mensal. Crescimento, margem, principais corredores, confiança do cliente e taxa de reclamações para proprietários da Henry Onyx Logistics.",
  },
  hero: {
    eyebrow: "Suite do proprietário",
    title: "Estratégica",
    body: "A visão mensal. Crescimento, margem, principais corredores, confiança do cliente e taxa de reclamações.",
  },
  metrics: {
    volumeLabel: "Volume (período)",
    volumeUniqueCustomers: "{count} clientes únicos",
    revenueLabel: "Receita",
    revenueVs: "total liquidado",
    revenueMargin: "Margem {amount}",
    b2bLabel: "Contas B2B",
    b2bActive: "{count} ativas",
    b2bAcquireFirst: "Conquistar a primeira conta B2B",
    claimsLabel: "Reclamações abertas",
    claimsAtRisk: "Confiança em risco",
    claimsIntact: "Confiança intacta",
  },
  corridors: {
    title: "Principais corredores (por volume)",
    unknownZone: "Desconhecido",
    shipmentSingular: "envio",
    shipmentPlural: "envios",
  },
};

const LOGISTICS_STAFF_OWNER_COPY_AR: DeepPartial<LogisticsStaffOwnerCopy> = {
  metadata: {
    title: "جناح المالك — العرض الشهري الاستراتيجي | Henry Onyx Logistics",
    description:
      "العرض الشهري. النمو والهامش والممرات الرئيسية وثقة العملاء ومعدل المطالبات لمالكي Henry Onyx Logistics.",
  },
  hero: {
    eyebrow: "جناح المالك",
    title: "استراتيجي",
    body: "العرض الشهري. النمو والهامش والممرات الرئيسية وثقة العملاء ومعدل المطالبات.",
  },
  metrics: {
    volumeLabel: "الحجم (الفترة)",
    volumeUniqueCustomers: "{count} عميل فريد",
    revenueLabel: "الإيرادات",
    revenueVs: "الإجمالي المسوّى",
    revenueMargin: "الهامش {amount}",
    b2bLabel: "حسابات B2B",
    b2bActive: "{count} نشط",
    b2bAcquireFirst: "اكتساب أول حساب B2B",
    claimsLabel: "المطالبات المفتوحة",
    claimsAtRisk: "الثقة في خطر",
    claimsIntact: "الثقة سليمة",
  },
  corridors: {
    title: "أهم الممرات (حسب الحجم)",
    unknownZone: "غير معروف",
    shipmentSingular: "شحنة",
    shipmentPlural: "شحنات",
  },
};

const LOGISTICS_STAFF_OWNER_COPY_DE: DeepPartial<LogisticsStaffOwnerCopy> = {
  metadata: {
    title: "Eigentümer-Suite — Strategische Monatsübersicht | Henry Onyx Logistics",
    description:
      "Die monatliche Übersicht. Wachstum, Marge, wichtigste Korridore, Kundenvertrauen und Reklamationsquote für Henry Onyx-Logistics-Eigentümer.",
  },
  hero: {
    eyebrow: "Eigentümer-Suite",
    title: "Strategisch",
    body: "Die monatliche Übersicht. Wachstum, Marge, wichtigste Korridore, Kundenvertrauen und Reklamationsquote.",
  },
  metrics: {
    volumeLabel: "Volumen (Zeitraum)",
    volumeUniqueCustomers: "{count} eindeutige Kunden",
    revenueLabel: "Umsatz",
    revenueVs: "abgerechnete Summe",
    revenueMargin: "Marge {amount}",
    b2bLabel: "B2B-Konten",
    b2bActive: "{count} aktiv",
    b2bAcquireFirst: "Erstes B2B-Konto gewinnen",
    claimsLabel: "Offene Reklamationen",
    claimsAtRisk: "Vertrauen gefährdet",
    claimsIntact: "Vertrauen intakt",
  },
  corridors: {
    title: "Top-Korridore (nach Volumen)",
    unknownZone: "Unbekannt",
    shipmentSingular: "Sendung",
    shipmentPlural: "Sendungen",
  },
};

const LOGISTICS_STAFF_OWNER_COPY_IT: DeepPartial<LogisticsStaffOwnerCopy> = {
  metadata: {
    title: "Suite proprietario — Vista mensile strategica | Henry Onyx Logistics",
    description:
      "La vista mensile. Crescita, margine, principali corridoi, fiducia dei clienti e tasso di reclami per i proprietari Henry Onyx Logistics.",
  },
  hero: {
    eyebrow: "Suite proprietario",
    title: "Strategica",
    body: "La vista mensile. Crescita, margine, principali corridoi, fiducia dei clienti e tasso di reclami.",
  },
  metrics: {
    volumeLabel: "Volume (periodo)",
    volumeUniqueCustomers: "{count} clienti unici",
    revenueLabel: "Ricavi",
    revenueVs: "totale liquidato",
    revenueMargin: "Margine {amount}",
    b2bLabel: "Account B2B",
    b2bActive: "{count} attivi",
    b2bAcquireFirst: "Acquisire il primo account B2B",
    claimsLabel: "Reclami aperti",
    claimsAtRisk: "Fiducia a rischio",
    claimsIntact: "Fiducia intatta",
  },
  corridors: {
    title: "Principali corridoi (per volume)",
    unknownZone: "Sconosciuto",
    shipmentSingular: "spedizione",
    shipmentPlural: "spedizioni",
  },
};

const LOGISTICS_STAFF_OWNER_COPY_ZH: DeepPartial<LogisticsStaffOwnerCopy> = {
  metadata: {
    title: "所有者套件 — 战略月度视图 | Henry Onyx Logistics",
    description: "月度视图。Henry Onyx Logistics 所有者的增长、利润率、主要走廊、客户信任度与理赔率。",
  },
  hero: {
    eyebrow: "所有者套件",
    title: "战略",
    body: "月度视图。增长、利润率、主要走廊、客户信任度与理赔率。",
  },
  metrics: {
    volumeLabel: "量(周期)",
    volumeUniqueCustomers: "{count} 位独立客户",
    revenueLabel: "营收",
    revenueVs: "已结算总额",
    revenueMargin: "利润 {amount}",
    b2bLabel: "B2B 账户",
    b2bActive: "{count} 个活跃",
    b2bAcquireFirst: "获取首个 B2B 账户",
    claimsLabel: "未结理赔",
    claimsAtRisk: "信任受损",
    claimsIntact: "信任完好",
  },
  corridors: {
    title: "主要走廊(按量)",
    unknownZone: "未知",
    shipmentSingular: "件",
    shipmentPlural: "件",
  },
};

const LOGISTICS_STAFF_OWNER_COPY_HI: DeepPartial<LogisticsStaffOwnerCopy> = {
  metadata: {
    title: "मालिक सूट — रणनीतिक मासिक दृश्य | Henry Onyx Logistics",
    description:
      "मासिक दृश्य। Henry Onyx Logistics मालिकों के लिए वृद्धि, मार्जिन, शीर्ष कॉरिडोर, ग्राहक विश्वास और दावा दर।",
  },
  hero: {
    eyebrow: "मालिक सूट",
    title: "रणनीतिक",
    body: "मासिक दृश्य। वृद्धि, मार्जिन, शीर्ष कॉरिडोर, ग्राहक विश्वास और दावा दर।",
  },
  metrics: {
    volumeLabel: "मात्रा (अवधि)",
    volumeUniqueCustomers: "{count} अद्वितीय ग्राहक",
    revenueLabel: "राजस्व",
    revenueVs: "निपटाया गया कुल",
    revenueMargin: "मार्जिन {amount}",
    b2bLabel: "B2B खाते",
    b2bActive: "{count} सक्रिय",
    b2bAcquireFirst: "पहला B2B खाता प्राप्त करें",
    claimsLabel: "खुले दावे",
    claimsAtRisk: "विश्वास जोखिम में",
    claimsIntact: "विश्वास सुरक्षित",
  },
  corridors: {
    title: "शीर्ष कॉरिडोर (मात्रा अनुसार)",
    unknownZone: "अज्ञात",
    shipmentSingular: "शिपमेंट",
    shipmentPlural: "शिपमेंट",
  },
};

const LOGISTICS_STAFF_OWNER_COPY_IG: DeepPartial<LogisticsStaffOwnerCopy> = {
  metadata: {
    title: "Ụlọ onye nwe — Nlere ọnwa nke atụmatụ | Henry Onyx Logistics",
    description:
      "Nlere ọnwa. Uto, ego fọrọ, ụzọ ndị kasị, ntụkwasị obi ndị ahịa, na ọnụego mkpesa maka ndị nwe Henry Onyx Logistics.",
  },
  hero: {
    eyebrow: "Ụlọ onye nwe",
    title: "Atụmatụ",
    body: "Nlere ọnwa. Uto, ego fọrọ, ụzọ ndị kasị, ntụkwasị obi ndị ahịa, na ọnụego mkpesa.",
  },
  metrics: {
    volumeLabel: "Ọnụọgụgụ (oge)",
    volumeUniqueCustomers: "ndị ahịa pụrụ iche {count}",
    revenueLabel: "Ego batara",
    revenueVs: "ngụkọta a kwụrụ",
    revenueMargin: "Ego fọrọ {amount}",
    b2bLabel: "Akaụntụ B2B",
    b2bActive: "{count} na-arụ ọrụ",
    b2bAcquireFirst: "Nweta akaụntụ B2B mbụ",
    claimsLabel: "Mkpesa mepere emepe",
    claimsAtRisk: "Ntụkwasị obi nọ n'ihe ize ndụ",
    claimsIntact: "Ntụkwasị obi guzosiri ike",
  },
  corridors: {
    title: "Ụzọ ndị kasị (site na ọnụọgụgụ)",
    unknownZone: "Amaghị",
    shipmentSingular: "mbufe",
    shipmentPlural: "mbufe",
  },
};

const LOGISTICS_STAFF_OWNER_COPY_YO: DeepPartial<LogisticsStaffOwnerCopy> = {
  metadata: {
    title: "Yara onílé — Ìwòye oṣooṣù tó dá lórí ìlànà | Henry Onyx Logistics",
    description:
      "Ìwòye oṣooṣù. Ìdàgbàsókè, èrè, ọ̀nà ìgbé tó ga jù, ìgbẹ́kẹ̀lé oníbàárà, àti ìwọ̀n ẹ̀sùn fún àwọn onílé Henry Onyx Logistics.",
  },
  hero: {
    eyebrow: "Yara onílé",
    title: "Ìlànà",
    body: "Ìwòye oṣooṣù. Ìdàgbàsókè, èrè, ọ̀nà ìgbé tó ga jù, ìgbẹ́kẹ̀lé oníbàárà, àti ìwọ̀n ẹ̀sùn.",
  },
  metrics: {
    volumeLabel: "Iye (àkókò)",
    volumeUniqueCustomers: "oníbàárà ọ̀tọ̀ọ̀tọ̀ {count}",
    revenueLabel: "Owó tí ó wọlé",
    revenueVs: "àpapọ̀ tó ti yanjú",
    revenueMargin: "Èrè {amount}",
    b2bLabel: "Àwọn àkáǹtì B2B",
    b2bActive: "{count} ń ṣiṣẹ́",
    b2bAcquireFirst: "Gba àkáǹtì B2B àkọ́kọ́",
    claimsLabel: "Ẹ̀sùn tó ṣí",
    claimsAtRisk: "Ìgbẹ́kẹ̀lé wà nínú ewu",
    claimsIntact: "Ìgbẹ́kẹ̀lé wà láìbàjẹ́",
  },
  corridors: {
    title: "Ọ̀nà ìgbé tó ga jù (nípa iye)",
    unknownZone: "Aimọ̀",
    shipmentSingular: "ẹrù",
    shipmentPlural: "ẹrù",
  },
};

const LOGISTICS_STAFF_OWNER_COPY_HA: DeepPartial<LogisticsStaffOwnerCopy> = {
  metadata: {
    title: "Ɗakin mai shi — Ra'ayin wata mai dabara | Henry Onyx Logistics",
    description:
      "Ra'ayin wata. Bunƙasa, ribar haƙƙi, manyan hanyoyi, amincewar abokin ciniki, da yawan da'awa ga masu Henry Onyx Logistics.",
  },
  hero: {
    eyebrow: "Ɗakin mai shi",
    title: "Dabara",
    body: "Ra'ayin wata. Bunƙasa, ribar haƙƙi, manyan hanyoyi, amincewar abokin ciniki, da yawan da'awa.",
  },
  metrics: {
    volumeLabel: "Yawa (lokaci)",
    volumeUniqueCustomers: "abokan ciniki na musamman {count}",
    revenueLabel: "Kuɗin shiga",
    revenueVs: "jimillar da aka biya",
    revenueMargin: "Riba {amount}",
    b2bLabel: "Asusun B2B",
    b2bActive: "{count} masu aiki",
    b2bAcquireFirst: "Samun asusun B2B na farko",
    claimsLabel: "Da'awa a buɗe",
    claimsAtRisk: "Amincewa cikin haɗari",
    claimsIntact: "Amincewa lafiya",
  },
  corridors: {
    title: "Manyan hanyoyi (ta yawa)",
    unknownZone: "Ba a sani ba",
    shipmentSingular: "jigila",
    shipmentPlural: "jigilai",
  },
};

const LOGISTICS_STAFF_OWNER_LOCALE_MAP: Partial<
  Record<AppLocale, DeepPartial<LogisticsStaffOwnerCopy>>
> = {
  fr: LOGISTICS_STAFF_OWNER_COPY_FR,
  es: LOGISTICS_STAFF_OWNER_COPY_ES,
  pt: LOGISTICS_STAFF_OWNER_COPY_PT,
  ar: LOGISTICS_STAFF_OWNER_COPY_AR,
  de: LOGISTICS_STAFF_OWNER_COPY_DE,
  it: LOGISTICS_STAFF_OWNER_COPY_IT,
  zh: LOGISTICS_STAFF_OWNER_COPY_ZH,
  hi: LOGISTICS_STAFF_OWNER_COPY_HI,
  ig: LOGISTICS_STAFF_OWNER_COPY_IG,
  yo: LOGISTICS_STAFF_OWNER_COPY_YO,
  ha: LOGISTICS_STAFF_OWNER_COPY_HA,
};

export function getLogisticsStaffOwnerCopy(
  locale: AppLocale,
): LogisticsStaffOwnerCopy {
  const overrides = LOGISTICS_STAFF_OWNER_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      LOGISTICS_STAFF_OWNER_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as LogisticsStaffOwnerCopy;
  }
  return LOGISTICS_STAFF_OWNER_COPY_EN;
}

/** @internal */
export function __dangerouslyGetEnglishLogisticsStaffOwnerCopy(): LogisticsStaffOwnerCopy {
  return LOGISTICS_STAFF_OWNER_COPY_EN;
}
