import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * LogisticsCoverageCopy — i18n surface for the public `/coverage` page on
 * the Logistics division. Covers metadata, the coverage hero, the dynamic
 * region/zone rail labels (region count, ETA suffix, empty state, region
 * fallback), and the closing request-coverage CTA row.
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each locale is a
 * Partial that deep-merges over EN so missing keys fall through silently.
 * Mirrors the shape of `logistics-business-copy.ts`.
 */
export type LogisticsCoverageCopy = {
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    /** Template: "{activeZones} active zones · {pickupHours}. Outside these zones we route via inter-city dispatch — request a quote and we will confirm feasibility before we accept." */
    bodyTemplate: string;
  };
  zones: {
    /** Template: "{count} zones" — appears beside each region name */
    regionCountTemplate: string;
    /** Template: "{min}–{max}h ETA" — appears under each zone base fee */
    etaSuffixTemplate: string;
    /** Empty state when no zones are published yet */
    empty: string;
    /** Fallback region label when a zone has no `region` set */
    regionFallback: string;
  };
  ctas: {
    quote: string;
    business: string;
  };
};

const LOGISTICS_COVERAGE_COPY_EN: LogisticsCoverageCopy = {
  metadata: {
    title: "Coverage | Henry Onyx Logistics",
    description:
      "Service zones, delivery windows, and base coverage across the areas we deliver.",
  },
  hero: {
    eyebrow: "Coverage",
    title: "Where we deliver.",
    bodyTemplate:
      "{activeZones} active zones · {pickupHours}. Outside these zones we route via inter-city dispatch — request a quote and we will confirm feasibility before we accept.",
  },
  zones: {
    regionCountTemplate: "{count} zones",
    etaSuffixTemplate: "{min}–{max}h ETA",
    empty:
      "Coverage is being refreshed. Request a quote and we will confirm your zone manually.",
    regionFallback: "Other",
  },
  ctas: {
    quote: "Request a quote",
    business: "For business",
  },
};

const LOGISTICS_COVERAGE_COPY_FR: DeepPartial<LogisticsCoverageCopy> = {
  metadata: {
    title: "Zones de couverture | Henry Onyx Logistics",
    description:
      "Zones de service, fenêtres de livraison et couverture de base dans les zones où nous livrons.",
  },
  hero: {
    eyebrow: "Couverture",
    title: "Là où nous livrons.",
    bodyTemplate:
      "{activeZones} zones actives · {pickupHours}. En dehors de ces zones, nous routons via la répartition inter-villes — demandez un devis et nous confirmerons la faisabilité avant d’accepter.",
  },
  zones: {
    regionCountTemplate: "{count} zones",
    etaSuffixTemplate: "{min}–{max} h d’ETA",
    empty:
      "La couverture est en cours d’actualisation. Demandez un devis et nous confirmerons votre zone manuellement.",
    regionFallback: "Autre",
  },
  ctas: {
    quote: "Demander un devis",
    business: "Pour les entreprises",
  },
};

const LOGISTICS_COVERAGE_COPY_ES: DeepPartial<LogisticsCoverageCopy> = {
  metadata: {
    title: "Cobertura | Henry Onyx Logistics",
    description:
      "Zonas de servicio, ventanas de entrega y cobertura base en las áreas donde entregamos.",
  },
  hero: {
    eyebrow: "Cobertura",
    title: "Donde entregamos.",
    bodyTemplate:
      "{activeZones} zonas activas · {pickupHours}. Fuera de estas zonas enrutamos por despacho intermunicipal — solicite una cotización y confirmaremos la viabilidad antes de aceptar.",
  },
  zones: {
    regionCountTemplate: "{count} zonas",
    etaSuffixTemplate: "{min}–{max} h de ETA",
    empty:
      "La cobertura se está actualizando. Solicite una cotización y confirmaremos su zona manualmente.",
    regionFallback: "Otra",
  },
  ctas: {
    quote: "Solicitar cotización",
    business: "Para empresas",
  },
};

const LOGISTICS_COVERAGE_COPY_PT: DeepPartial<LogisticsCoverageCopy> = {
  metadata: {
    title: "Cobertura | Henry Onyx Logistics",
    description:
      "Zonas de serviço, janelas de entrega e cobertura base nas áreas onde entregamos.",
  },
  hero: {
    eyebrow: "Cobertura",
    title: "Onde entregamos.",
    bodyTemplate:
      "{activeZones} zonas ativas · {pickupHours}. Fora destas zonas, encaminhamos via despacho intermunicipal — solicite um orçamento e confirmaremos a viabilidade antes de aceitar.",
  },
  zones: {
    regionCountTemplate: "{count} zonas",
    etaSuffixTemplate: "{min}–{max} h de ETA",
    empty:
      "A cobertura está sendo atualizada. Solicite um orçamento e confirmaremos a sua zona manualmente.",
    regionFallback: "Outra",
  },
  ctas: {
    quote: "Solicitar um orçamento",
    business: "Para empresas",
  },
};

const LOGISTICS_COVERAGE_COPY_AR: DeepPartial<LogisticsCoverageCopy> = {
  metadata: {
    title: "نطاق التغطية | Henry Onyx Logistics",
    description:
      "مناطق الخدمة، ونوافذ التسليم، والتغطية الأساسية في المناطق التي نوصل إليها.",
  },
  hero: {
    eyebrow: "التغطية",
    title: "حيث نوصل.",
    bodyTemplate:
      "{activeZones} مناطق نشطة · {pickupHours}. خارج هذه المناطق نمرّر عبر إرسال بين المدن — اطلب عرض سعر وسنؤكد الجدوى قبل القبول.",
  },
  zones: {
    regionCountTemplate: "{count} منطقة",
    etaSuffixTemplate: "وقت تقديري {min}–{max} ساعة",
    empty: "يجري تحديث التغطية. اطلب عرض سعر وسنؤكد منطقتك يدويًا.",
    regionFallback: "أخرى",
  },
  ctas: {
    quote: "اطلب عرض سعر",
    business: "للشركات",
  },
};

const LOGISTICS_COVERAGE_COPY_DE: DeepPartial<LogisticsCoverageCopy> = {
  metadata: {
    title: "Liefergebiet | Henry Onyx Logistics",
    description:
      "Servicezonen, Lieferfenster und Grundabdeckung in den Gebieten, in die wir liefern.",
  },
  hero: {
    eyebrow: "Liefergebiet",
    title: "Wohin wir liefern.",
    bodyTemplate:
      "{activeZones} aktive Zonen · {pickupHours}. Außerhalb dieser Zonen leiten wir über interstädtischen Versand — fordern Sie ein Angebot an und wir bestätigen die Machbarkeit vor der Annahme.",
  },
  zones: {
    regionCountTemplate: "{count} Zonen",
    etaSuffixTemplate: "{min}–{max} h ETA",
    empty:
      "Das Liefergebiet wird aktualisiert. Fordern Sie ein Angebot an und wir bestätigen Ihre Zone manuell.",
    regionFallback: "Sonstige",
  },
  ctas: {
    quote: "Angebot anfordern",
    business: "Für Unternehmen",
  },
};

const LOGISTICS_COVERAGE_COPY_IT: DeepPartial<LogisticsCoverageCopy> = {
  metadata: {
    title: "Copertura | Henry Onyx Logistics",
    description:
      "Zone di servizio, finestre di consegna e copertura di base nelle aree in cui consegniamo.",
  },
  hero: {
    eyebrow: "Copertura",
    title: "Dove consegniamo.",
    bodyTemplate:
      "{activeZones} zone attive · {pickupHours}. Al di fuori di queste zone instradiamo tramite spedizione interurbana — richiedi un preventivo e confermeremo la fattibilità prima di accettare.",
  },
  zones: {
    regionCountTemplate: "{count} zone",
    etaSuffixTemplate: "{min}–{max} h di ETA",
    empty:
      "La copertura è in aggiornamento. Richiedi un preventivo e confermeremo la tua zona manualmente.",
    regionFallback: "Altra",
  },
  ctas: {
    quote: "Richiedi un preventivo",
    business: "Per le aziende",
  },
};

const LOGISTICS_COVERAGE_COPY_ZH: DeepPartial<LogisticsCoverageCopy> = {
  metadata: {
    title: "服务范围 | Henry Onyx Logistics",
    description: "我们送达区域内的服务区域、配送时段与基础覆盖范围。",
  },
  hero: {
    eyebrow: "服务范围",
    title: "我们送达的范围。",
    bodyTemplate:
      "{activeZones} 个活跃区域 · {pickupHours}。在这些区域之外,我们将通过城际调度路由——请先申请报价,我们会在接单前确认可行性。",
  },
  zones: {
    regionCountTemplate: "{count} 个区域",
    etaSuffixTemplate: "预计 {min}–{max} 小时送达",
    empty: "服务范围正在刷新。请申请报价,我们将为您手动确认所属区域。",
    regionFallback: "其他",
  },
  ctas: {
    quote: "申请报价",
    business: "面向企业",
  },
};

const LOGISTICS_COVERAGE_COPY_HI: DeepPartial<LogisticsCoverageCopy> = {
  metadata: {
    title: "कवरेज | Henry Onyx Logistics",
    description:
      "हम जिन क्षेत्रों में डिलीवर करते हैं वहाँ की सेवा क्षेत्र, डिलीवरी विंडो और बेस कवरेज।",
  },
  hero: {
    eyebrow: "कवरेज",
    title: "हम कहाँ डिलीवर करते हैं।",
    bodyTemplate:
      "{activeZones} सक्रिय क्षेत्र · {pickupHours}। इन क्षेत्रों के बाहर हम अंतर-शहर डिस्पैच के माध्यम से रूट करते हैं — कोटेशन माँगें, हम स्वीकार करने से पहले संभाव्यता की पुष्टि करेंगे।",
  },
  zones: {
    regionCountTemplate: "{count} क्षेत्र",
    etaSuffixTemplate: "{min}–{max} घंटे ETA",
    empty:
      "कवरेज ताज़ा किया जा रहा है। कोटेशन माँगें और हम आपके क्षेत्र की मैन्युअल रूप से पुष्टि करेंगे।",
    regionFallback: "अन्य",
  },
  ctas: {
    quote: "कोटेशन माँगें",
    business: "व्यवसाय के लिए",
  },
};

const LOGISTICS_COVERAGE_COPY_IG: DeepPartial<LogisticsCoverageCopy> = {
  metadata: {
    title: "Mpaghara Ozi | Henry Onyx Logistics",
    description:
      "Service zones, delivery windows, and base coverage across the areas we deliver.",
  },
  hero: {
    eyebrow: "Mpaghara Ozi",
    title: "Ebe anyị na-ebuga.",
    bodyTemplate:
      "{activeZones} mpaghara na-arụ ọrụ · {pickupHours}. Na mpụga mpaghara ndị a, anyị na-eziga site na nzipu obodo na obodo — rịọ maka ọnụahịa ka anyị wee kwado iji nabata.",
  },
  zones: {
    regionCountTemplate: "{count} mpaghara",
    etaSuffixTemplate: "ETA {min}–{max} elekere",
    empty:
      "A na-emelite mpaghara ozi ugbu a. Rịọ maka ọnụahịa, anyị ga-akwado mpaghara gị n'aka.",
    regionFallback: "Ndị ọzọ",
  },
  ctas: {
    quote: "Rịọ ọnụahịa",
    business: "Maka azụmahịa",
  },
};

const LOGISTICS_COVERAGE_COPY_YO: DeepPartial<LogisticsCoverageCopy> = {
  metadata: {
    title: "Agbègbè Ìfijíṣẹ́ | Henry Onyx Logistics",
    description:
      "Service zones, delivery windows, and base coverage across the areas we deliver.",
  },
  hero: {
    eyebrow: "Agbègbè Ìfijíṣẹ́",
    title: "Ibi tí a ti ń fi jíṣẹ́.",
    bodyTemplate:
      "{activeZones} agbègbè tó ń ṣiṣẹ́ · {pickupHours}. Ní ìta àwọn agbègbè wọ̀nyí, a ń lo ìfiránṣẹ́ aárín-ìlú — béèrè fún ìdájọ́ owó, a óò sì jẹ́rìí àṣeyọrí ṣáájú kí a tó gba.",
  },
  zones: {
    regionCountTemplate: "{count} agbègbè",
    etaSuffixTemplate: "ETA {min}–{max} wákàtí",
    empty:
      "A ń tún agbègbè ìfijíṣẹ́ ṣe. Béèrè fún ìdájọ́ owó, a óò sì jẹ́rìí agbègbè rẹ pẹ̀lú ọwọ́.",
    regionFallback: "Mìíràn",
  },
  ctas: {
    quote: "Béèrè ìdájọ́ owó",
    business: "Fún àwọn iléeṣẹ́",
  },
};

const LOGISTICS_COVERAGE_COPY_HA: DeepPartial<LogisticsCoverageCopy> = {
  metadata: {
    title: "Yankin Isarwa | Henry Onyx Logistics",
    description:
      "Service zones, delivery windows, and base coverage across the areas we deliver.",
  },
  hero: {
    eyebrow: "Yankin Isarwa",
    title: "Inda muke isarwa.",
    bodyTemplate:
      "{activeZones} yankuna masu aiki · {pickupHours}. A wajen waɗannan yankuna muna tura ta hanyar aikawa tsakanin biranen — nemi farashi, mu tabbatar yiwuwarsa kafin mu karɓa.",
  },
  zones: {
    regionCountTemplate: "yankuna {count}",
    etaSuffixTemplate: "ETA awa {min}–{max}",
    empty: "Ana sabunta yankin isarwa. Nemi farashi, za mu tabbatar yankinku da hannu.",
    regionFallback: "Sauran",
  },
  ctas: {
    quote: "Nemi farashi",
    business: "Don kasuwanci",
  },
};

const LOGISTICS_COVERAGE_LOCALE_MAP: Partial<
  Record<AppLocale, DeepPartial<LogisticsCoverageCopy>>
> = {
  fr: LOGISTICS_COVERAGE_COPY_FR,
  es: LOGISTICS_COVERAGE_COPY_ES,
  pt: LOGISTICS_COVERAGE_COPY_PT,
  ar: LOGISTICS_COVERAGE_COPY_AR,
  de: LOGISTICS_COVERAGE_COPY_DE,
  it: LOGISTICS_COVERAGE_COPY_IT,
  zh: LOGISTICS_COVERAGE_COPY_ZH,
  hi: LOGISTICS_COVERAGE_COPY_HI,
  ig: LOGISTICS_COVERAGE_COPY_IG,
  yo: LOGISTICS_COVERAGE_COPY_YO,
  ha: LOGISTICS_COVERAGE_COPY_HA,
};

export function getLogisticsCoverageCopy(locale: AppLocale): LogisticsCoverageCopy {
  const overrides = LOGISTICS_COVERAGE_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      LOGISTICS_COVERAGE_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as LogisticsCoverageCopy;
  }
  return LOGISTICS_COVERAGE_COPY_EN;
}

/** @internal */
export function __dangerouslyGetEnglishLogisticsCoverageCopy(): LogisticsCoverageCopy {
  return LOGISTICS_COVERAGE_COPY_EN;
}
