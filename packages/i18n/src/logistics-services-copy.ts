import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * LogisticsServicesCopy — i18n surface for the /services page on the Logistics
 * division. Covers metadata, the hero (eyebrow / title / body), the per-service
 * row label prefix ("Service NN"), and the bottom CTA pair.
 *
 * Note: per-service `name`, `badge`, `summary`, `promise`, and `highlights`
 * come from `getPublicLogisticsSnapshot()` — they are runtime data, not
 * static copy, so they are translated through the dynamic-content pipeline,
 * not this module.
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each locale is a
 * Partial that deep-merges over EN so missing keys fall through to EN
 * silently. Mirrors the shape of `logistics-book-copy.ts`.
 */
export type LogisticsServicesCopy = {
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    /**
     * The first portion of the hero body. The full sentence in the rendered
     * page is `${body} ${pickupHours}`, where pickupHours is dynamic data
     * from the snapshot.
     */
    body: string;
  };
  serviceRow: {
    /**
     * Label prefix shown above each service heading; the rendered string is
     * `${label} ${NN} · ${s.badge}`.
     */
    label: string;
  };
  cta: {
    book: string;
    quote: string;
  };
};

const LOGISTICS_SERVICES_COPY_EN: LogisticsServicesCopy = {
  metadata: {
    title: "Services | HenryCo Logistics",
    description:
      "Same-day, scheduled, dispatch, and inter-city logistics services with governed pricing.",
  },
  hero: {
    eyebrow: "Services",
    title: "What we move.",
    body: "Parcels, documents, retail replenishment, operational freight — disciplined pickup, milestone tracking, proof-backed delivery.",
  },
  serviceRow: {
    label: "Service",
  },
  cta: {
    book: "Book now",
    quote: "Request quote",
  },
};

const LOGISTICS_SERVICES_COPY_FR: DeepPartial<LogisticsServicesCopy> = {
  metadata: {
    title: "Services | HenryCo Logistics",
    description:
      "Services logistiques le jour même, programmés, en coursier et inter-villes avec une tarification encadrée.",
  },
  hero: {
    eyebrow: "Services",
    title: "Ce que nous transportons.",
    body: "Colis, documents, réassort retail, fret opérationnel — enlèvement rigoureux, suivi des jalons, livraison avec preuve.",
  },
  serviceRow: {
    label: "Service",
  },
  cta: {
    book: "Réserver",
    quote: "Demander un devis",
  },
};

const LOGISTICS_SERVICES_COPY_ES: DeepPartial<LogisticsServicesCopy> = {
  metadata: {
    title: "Servicios | HenryCo Logistics",
    description:
      "Servicios logísticos en el día, programados, de mensajería e interurbanos con precios regulados.",
  },
  hero: {
    eyebrow: "Servicios",
    title: "Lo que movemos.",
    body: "Paquetes, documentos, reposición retail, carga operativa — recogida rigurosa, seguimiento por hitos, entrega con prueba.",
  },
  serviceRow: {
    label: "Servicio",
  },
  cta: {
    book: "Reservar",
    quote: "Solicitar presupuesto",
  },
};

const LOGISTICS_SERVICES_COPY_PT: DeepPartial<LogisticsServicesCopy> = {
  metadata: {
    title: "Serviços | HenryCo Logistics",
    description:
      "Serviços de logística no próprio dia, agendados, de despacho e inter-cidades com preços regulamentados.",
  },
  hero: {
    eyebrow: "Serviços",
    title: "O que movimentamos.",
    body: "Encomendas, documentos, reposição de retalho, carga operacional — recolha rigorosa, acompanhamento por marcos, entrega com comprovativo.",
  },
  serviceRow: {
    label: "Serviço",
  },
  cta: {
    book: "Reservar",
    quote: "Pedir orçamento",
  },
};

const LOGISTICS_SERVICES_COPY_AR: DeepPartial<LogisticsServicesCopy> = {
  metadata: {
    title: "الخدمات | HenryCo Logistics",
    description:
      "خدمات لوجستية في اليوم نفسه ومجدولة وللإرسال السريع وبين المدن بتسعير منضبط.",
  },
  hero: {
    eyebrow: "الخدمات",
    title: "ما الذي ننقله.",
    body: "طرود ووثائق وإعادة تخزين للتجزئة وشحن تشغيلي — استلام منضبط، ومتابعة بالمراحل، وتسليم موثَّق.",
  },
  serviceRow: {
    label: "الخدمة",
  },
  cta: {
    book: "احجز الآن",
    quote: "اطلب عرض سعر",
  },
};

const LOGISTICS_SERVICES_COPY_DE: DeepPartial<LogisticsServicesCopy> = {
  metadata: {
    title: "Leistungen | HenryCo Logistics",
    description:
      "Logistik am selben Tag, geplant, als Kurier und interurban — mit geregelten Preisen.",
  },
  hero: {
    eyebrow: "Leistungen",
    title: "Was wir bewegen.",
    body: "Pakete, Dokumente, Retail-Nachschub, operative Fracht — disziplinierte Abholung, Meilensteinverfolgung, Lieferung mit Nachweis.",
  },
  serviceRow: {
    label: "Leistung",
  },
  cta: {
    book: "Jetzt buchen",
    quote: "Angebot anfordern",
  },
};

const LOGISTICS_SERVICES_COPY_IT: DeepPartial<LogisticsServicesCopy> = {
  metadata: {
    title: "Servizi | HenryCo Logistics",
    description:
      "Servizi logistici in giornata, programmati, di corriere e interurbani con tariffe regolate.",
  },
  hero: {
    eyebrow: "Servizi",
    title: "Cosa muoviamo.",
    body: "Pacchi, documenti, riassortimento retail, merci operative — ritiro disciplinato, tracciamento per tappe, consegna con prova.",
  },
  serviceRow: {
    label: "Servizio",
  },
  cta: {
    book: "Prenota ora",
    quote: "Richiedi un preventivo",
  },
};

const LOGISTICS_SERVICES_COPY_ZH: DeepPartial<LogisticsServicesCopy> = {
  metadata: {
    title: "服务 | HenryCo Logistics",
    description: "当日达、预约、急送与城际物流服务,均采用规范定价。",
  },
  hero: {
    eyebrow: "服务",
    title: "我们运送什么。",
    body: "包裹、文件、零售补货、运营货物——严谨取件,里程碑追踪,带凭证的送达。",
  },
  serviceRow: {
    label: "服务",
  },
  cta: {
    book: "立即预约",
    quote: "申请报价",
  },
};

const LOGISTICS_SERVICES_COPY_HI: DeepPartial<LogisticsServicesCopy> = {
  metadata: {
    title: "सेवाएँ | HenryCo Logistics",
    description:
      "एक ही दिन की, निर्धारित, डिस्पैच और अंतर-शहर लॉजिस्टिक्स सेवाएँ — नियंत्रित मूल्य निर्धारण के साथ।",
  },
  hero: {
    eyebrow: "सेवाएँ",
    title: "हम क्या पहुँचाते हैं।",
    body: "पार्सल, दस्तावेज़, रिटेल पुनःपूर्ति, ऑपरेशनल फ़्रेट — अनुशासित पिकअप, माइलस्टोन ट्रैकिंग, प्रमाण-समर्थित डिलीवरी।",
  },
  serviceRow: {
    label: "सेवा",
  },
  cta: {
    book: "अभी बुक करें",
    quote: "कोटेशन माँगें",
  },
};

const LOGISTICS_SERVICES_COPY_IG: DeepPartial<LogisticsServicesCopy> = {
  metadata: {
    title: "Ọrụ | HenryCo Logistics",
    description:
      "Ọrụ logistics nke otu ụbọchị, nke ahaziri ahazi, nke ezigara ozugbo, na nke ọtụtụ obodo — yana ọnụahịa achịkwara achịkwa.",
  },
  hero: {
    eyebrow: "Ọrụ",
    title: "Ihe anyị na-ebufe.",
    body: "Ngwugwu, akwụkwọ, mwetaghachi azụmahịa, ibu ọrụ — mbutere doro anya, nyocha nzọụkwụ, nnyefe nwere ihe àmà.",
  },
  serviceRow: {
    label: "Ọrụ",
  },
  cta: {
    book: "Debe ugbu a",
    quote: "Rịọ ọnụ ahịa",
  },
};

const LOGISTICS_SERVICES_COPY_YO: DeepPartial<LogisticsServicesCopy> = {
  metadata: {
    title: "Awọn iṣẹ́ | HenryCo Logistics",
    description:
      "Awọn iṣẹ́ logistics ti ọjọ́ kan náà, ti a ṣètò, ìṣíkiri, àti àárín-ìlú — pẹ̀lú ìṣètò owó tó tọ́.",
  },
  hero: {
    eyebrow: "Awọn iṣẹ́",
    title: "Ohun tí à ń kó.",
    body: "Àpótí ìránṣẹ́, ìwé, àtúnsílẹ̀ ohun-ọjà, ẹrù ìṣiṣẹ́ — ìgbé pẹ̀lú ìṣesí, àtẹ̀lé ìpele, ìfijiṣẹ́ pẹ̀lú ẹ̀rí.",
  },
  serviceRow: {
    label: "Iṣẹ́",
  },
  cta: {
    book: "Ṣe ìfìránṣẹ́ báyìí",
    quote: "Béèrè ìdíyelé",
  },
};

const LOGISTICS_SERVICES_COPY_HA: DeepPartial<LogisticsServicesCopy> = {
  metadata: {
    title: "Sabis | HenryCo Logistics",
    description:
      "Sabis na logistics na rana ɗaya, na tsari, na aikawa cikin sauri, da na tsakanin birane — tare da farashi mai tsari.",
  },
  hero: {
    eyebrow: "Sabis",
    title: "Abin da muke jigilarsa.",
    body: "Fakitoci, takardu, sake cika kantuna, kayan aikin gudana — ɗauka mai tsari, bin matakai, isar tare da tabbaci.",
  },
  serviceRow: {
    label: "Sabis",
  },
  cta: {
    book: "Yi rijista yanzu",
    quote: "Nemi farashi",
  },
};

const LOGISTICS_SERVICES_LOCALE_MAP: Partial<
  Record<AppLocale, DeepPartial<LogisticsServicesCopy>>
> = {
  fr: LOGISTICS_SERVICES_COPY_FR,
  es: LOGISTICS_SERVICES_COPY_ES,
  pt: LOGISTICS_SERVICES_COPY_PT,
  ar: LOGISTICS_SERVICES_COPY_AR,
  de: LOGISTICS_SERVICES_COPY_DE,
  it: LOGISTICS_SERVICES_COPY_IT,
  zh: LOGISTICS_SERVICES_COPY_ZH,
  hi: LOGISTICS_SERVICES_COPY_HI,
  ig: LOGISTICS_SERVICES_COPY_IG,
  yo: LOGISTICS_SERVICES_COPY_YO,
  ha: LOGISTICS_SERVICES_COPY_HA,
};

export function getLogisticsServicesCopy(locale: AppLocale): LogisticsServicesCopy {
  const overrides = LOGISTICS_SERVICES_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      LOGISTICS_SERVICES_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as LogisticsServicesCopy;
  }
  return LOGISTICS_SERVICES_COPY_EN;
}

/** @internal */
export function __dangerouslyGetEnglishLogisticsServicesCopy(): LogisticsServicesCopy {
  return LOGISTICS_SERVICES_COPY_EN;
}
