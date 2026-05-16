import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * LogisticsPricingCopy — i18n surface for the public Logistics /pricing
 * page. Covers page metadata, the "honest from base to final" hero,
 * the zone rail (eyebrow + per-zone column labels), the indicative rate
 * card section (eyebrow, currency note, table column headers) and the
 * closing booking CTA.
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each locale is
 * a Partial that deep-merges over EN so missing keys fall through to EN
 * silently. Mirrors the shape of `logistics-business-copy.ts`.
 */
export type LogisticsPricingCopy = {
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    body: string;
  };
  zones: {
    eyebrow: string;
    baseFromLabel: string;
    typicalWindowLabel: string;
  };
  rateCards: {
    eyebrow: string;
    currencyNote: string;
    serviceHeader: string;
    urgencyHeader: string;
    baseAddOnHeader: string;
    perKgHeader: string;
    fragileHeader: string;
  };
  cta: {
    startBooking: string;
  };
};

const LOGISTICS_PRICING_COPY_EN: LogisticsPricingCopy = {
  metadata: {
    title: "Pricing | HenryCo Logistics",
    description:
      "Zone-based logistics pricing with indicative rate cards and promise windows.",
  },
  hero: {
    eyebrow: "Pricing",
    title: "Honest from base to final.",
    body: "Base fee combines your zone with a service rate card; weight, size, urgency, and fragile handling layer on predictably. Dispatch may confirm final numbers only on genuine edge cases.",
  },
  zones: {
    eyebrow: "Zones",
    baseFromLabel: "Base from",
    typicalWindowLabel: "Typical window",
  },
  rateCards: {
    eyebrow: "Indicative rate cards",
    currencyNote:
      "Amounts are combined with zone base fees during booking. Values shown in NGN.",
    serviceHeader: "Service",
    urgencyHeader: "Urgency",
    baseAddOnHeader: "Base add-on",
    perKgHeader: "Per kg",
    fragileHeader: "Fragile",
  },
  cta: {
    startBooking: "Start a booking",
  },
};

const LOGISTICS_PRICING_COPY_FR: DeepPartial<LogisticsPricingCopy> = {
  metadata: {
    title: "Tarification | HenryCo Logistics",
    description:
      "Tarification logistique par zone avec grilles tarifaires indicatives et fenêtres de promesse.",
  },
  hero: {
    eyebrow: "Tarification",
    title: "Honnête du tarif de base au tarif final.",
    body: "Le tarif de base combine votre zone avec une grille tarifaire de service ; poids, taille, urgence et manipulation fragile s’ajoutent de façon prévisible. La répartition peut confirmer les chiffres définitifs uniquement sur de véritables cas particuliers.",
  },
  zones: {
    eyebrow: "Zones",
    baseFromLabel: "Base à partir de",
    typicalWindowLabel: "Fenêtre typique",
  },
  rateCards: {
    eyebrow: "Grilles tarifaires indicatives",
    currencyNote:
      "Les montants sont combinés aux tarifs de base de zone lors de la réservation. Valeurs affichées en NGN.",
    serviceHeader: "Service",
    urgencyHeader: "Urgence",
    baseAddOnHeader: "Supplément de base",
    perKgHeader: "Par kg",
    fragileHeader: "Fragile",
  },
  cta: {
    startBooking: "Commencer une réservation",
  },
};

const LOGISTICS_PRICING_COPY_ES: DeepPartial<LogisticsPricingCopy> = {
  metadata: {
    title: "Precios | HenryCo Logistics",
    description:
      "Precios logísticos por zona con tarifas indicativas y ventanas de promesa.",
  },
  hero: {
    eyebrow: "Precios",
    title: "Honestos desde la base hasta el total.",
    body: "La tarifa base combina tu zona con una tabla de tarifas de servicio; el peso, el tamaño, la urgencia y el manejo frágil se suman de forma predecible. Despacho solo confirma cifras finales en casos verdaderamente excepcionales.",
  },
  zones: {
    eyebrow: "Zonas",
    baseFromLabel: "Base desde",
    typicalWindowLabel: "Ventana típica",
  },
  rateCards: {
    eyebrow: "Tarifas indicativas",
    currencyNote:
      "Los importes se combinan con las tarifas base de zona durante la reserva. Valores mostrados en NGN.",
    serviceHeader: "Servicio",
    urgencyHeader: "Urgencia",
    baseAddOnHeader: "Suplemento de base",
    perKgHeader: "Por kg",
    fragileHeader: "Frágil",
  },
  cta: {
    startBooking: "Comenzar una reserva",
  },
};

const LOGISTICS_PRICING_COPY_PT: DeepPartial<LogisticsPricingCopy> = {
  metadata: {
    title: "Preços | HenryCo Logistics",
    description:
      "Preços logísticos por zona com tabelas tarifárias indicativas e janelas de promessa.",
  },
  hero: {
    eyebrow: "Preços",
    title: "Honestos da base ao final.",
    body: "A tarifa base combina a sua zona com uma tabela tarifária de serviço; peso, tamanho, urgência e manuseio frágil somam-se de forma previsível. O despacho só confirma valores finais em casos verdadeiramente excepcionais.",
  },
  zones: {
    eyebrow: "Zonas",
    baseFromLabel: "Base a partir de",
    typicalWindowLabel: "Janela típica",
  },
  rateCards: {
    eyebrow: "Tabelas tarifárias indicativas",
    currencyNote:
      "Os valores são combinados com as tarifas base de zona durante a reserva. Valores mostrados em NGN.",
    serviceHeader: "Serviço",
    urgencyHeader: "Urgência",
    baseAddOnHeader: "Adicional de base",
    perKgHeader: "Por kg",
    fragileHeader: "Frágil",
  },
  cta: {
    startBooking: "Iniciar uma reserva",
  },
};

const LOGISTICS_PRICING_COPY_AR: DeepPartial<LogisticsPricingCopy> = {
  metadata: {
    title: "التسعير | HenryCo Logistics",
    description:
      "تسعير لوجستي حسب المنطقة مع بطاقات أسعار إرشادية ونوافذ وعد التسليم.",
  },
  hero: {
    eyebrow: "التسعير",
    title: "صادق من الأساس إلى النهائي.",
    body: "تجمع الرسوم الأساسية بين منطقتك وبطاقة أسعار الخدمة؛ يُضاف الوزن والحجم والاستعجال والتعامل الحذر مع الهشّ بشكل متوقّع. قد يؤكّد قسم الإرسال الأرقام النهائية فقط في الحالات الاستثنائية الحقيقية.",
  },
  zones: {
    eyebrow: "المناطق",
    baseFromLabel: "الأساس بدءاً من",
    typicalWindowLabel: "النافذة المعتادة",
  },
  rateCards: {
    eyebrow: "بطاقات أسعار إرشادية",
    currencyNote:
      "تُدمج المبالغ مع رسوم المنطقة الأساسية أثناء الحجز. القيم مذكورة بالنايرا.",
    serviceHeader: "الخدمة",
    urgencyHeader: "الاستعجال",
    baseAddOnHeader: "إضافة على الأساس",
    perKgHeader: "لكل كغ",
    fragileHeader: "هشّ",
  },
  cta: {
    startBooking: "ابدأ الحجز",
  },
};

const LOGISTICS_PRICING_COPY_DE: DeepPartial<LogisticsPricingCopy> = {
  metadata: {
    title: "Preise | HenryCo Logistics",
    description:
      "Zonenbasierte Logistikpreise mit indikativen Tarifkarten und Versprechensfenstern.",
  },
  hero: {
    eyebrow: "Preise",
    title: "Ehrlich von der Basis bis zum Endpreis.",
    body: "Die Grundgebühr verbindet Ihre Zone mit einer Servicetarifkarte; Gewicht, Größe, Dringlichkeit und Handhabung zerbrechlicher Ware kommen vorhersehbar hinzu. Die Disposition bestätigt endgültige Zahlen nur bei echten Sonderfällen.",
  },
  zones: {
    eyebrow: "Zonen",
    baseFromLabel: "Basis ab",
    typicalWindowLabel: "Typisches Fenster",
  },
  rateCards: {
    eyebrow: "Indikative Tarifkarten",
    currencyNote:
      "Beträge werden bei der Buchung mit den Zonen-Grundgebühren kombiniert. Werte in NGN.",
    serviceHeader: "Service",
    urgencyHeader: "Dringlichkeit",
    baseAddOnHeader: "Basis-Zuschlag",
    perKgHeader: "Pro kg",
    fragileHeader: "Zerbrechlich",
  },
  cta: {
    startBooking: "Buchung starten",
  },
};

const LOGISTICS_PRICING_COPY_IT: DeepPartial<LogisticsPricingCopy> = {
  metadata: {
    title: "Prezzi | HenryCo Logistics",
    description:
      "Prezzi logistici per zona con tariffari indicativi e finestre di promessa.",
  },
  hero: {
    eyebrow: "Prezzi",
    title: "Onesti dalla base al finale.",
    body: "La tariffa base combina la tua zona con un tariffario di servizio; peso, dimensioni, urgenza e gestione fragile si aggiungono in modo prevedibile. Il dispatch conferma i numeri finali solo in casi veramente eccezionali.",
  },
  zones: {
    eyebrow: "Zone",
    baseFromLabel: "Base da",
    typicalWindowLabel: "Finestra tipica",
  },
  rateCards: {
    eyebrow: "Tariffari indicativi",
    currencyNote:
      "Gli importi vengono combinati con le tariffe base di zona al momento della prenotazione. Valori indicati in NGN.",
    serviceHeader: "Servizio",
    urgencyHeader: "Urgenza",
    baseAddOnHeader: "Aggiunta base",
    perKgHeader: "Al kg",
    fragileHeader: "Fragile",
  },
  cta: {
    startBooking: "Avvia una prenotazione",
  },
};

const LOGISTICS_PRICING_COPY_ZH: DeepPartial<LogisticsPricingCopy> = {
  metadata: {
    title: "定价 | HenryCo Logistics",
    description: "基于区域的物流定价，附带参考费率卡和承诺时间窗口。",
  },
  hero: {
    eyebrow: "定价",
    title: "从基础到最终都诚实。",
    body: "基础费用将您的区域与服务费率卡结合;重量、尺寸、紧急程度和易碎处理按可预测的方式叠加。调度仅在真正的特殊情况下确认最终金额。",
  },
  zones: {
    eyebrow: "区域",
    baseFromLabel: "基础起价",
    typicalWindowLabel: "典型时间窗口",
  },
  rateCards: {
    eyebrow: "参考费率卡",
    currencyNote: "金额将在预订时与区域基础费用合并。数值以奈拉(NGN)显示。",
    serviceHeader: "服务",
    urgencyHeader: "紧急程度",
    baseAddOnHeader: "基础附加",
    perKgHeader: "每公斤",
    fragileHeader: "易碎",
  },
  cta: {
    startBooking: "开始预订",
  },
};

const LOGISTICS_PRICING_COPY_HI: DeepPartial<LogisticsPricingCopy> = {
  metadata: {
    title: "मूल्य निर्धारण | HenryCo Logistics",
    description:
      "ज़ोन-आधारित लॉजिस्टिक्स मूल्य निर्धारण, संकेतात्मक दर कार्ड और वादा-समय खिड़कियों के साथ।",
  },
  hero: {
    eyebrow: "मूल्य निर्धारण",
    title: "आधार से अंतिम तक ईमानदार।",
    body: "आधार शुल्क आपके ज़ोन को सेवा दर कार्ड के साथ जोड़ता है; वज़न, आकार, अत्यावश्यकता और नाज़ुक हैंडलिंग पूर्वानुमेय ढंग से जुड़ती है। डिस्पैच केवल वास्तविक विशेष मामलों में अंतिम संख्याओं की पुष्टि करता है।",
  },
  zones: {
    eyebrow: "ज़ोन",
    baseFromLabel: "आधार से",
    typicalWindowLabel: "विशिष्ट खिड़की",
  },
  rateCards: {
    eyebrow: "संकेतात्मक दर कार्ड",
    currencyNote:
      "बुकिंग के दौरान राशियाँ ज़ोन आधार शुल्क के साथ जोड़ी जाती हैं। मूल्य NGN में दिखाए गए।",
    serviceHeader: "सेवा",
    urgencyHeader: "अत्यावश्यकता",
    baseAddOnHeader: "आधार ऐड-ऑन",
    perKgHeader: "प्रति किग्रा",
    fragileHeader: "नाज़ुक",
  },
  cta: {
    startBooking: "बुकिंग शुरू करें",
  },
};

const LOGISTICS_PRICING_COPY_IG: DeepPartial<LogisticsPricingCopy> = {
  metadata: {
    title: "Ọnụ ahịa | HenryCo Logistics",
    description:
      "Ọnụ ahịa logistics dabere na mpaghara na kaadị ọnụ ego nrụnye na windo nkwa.",
  },
  hero: {
    eyebrow: "Ọnụ ahịa",
    title: "Ezi okwu site na ntọala ruo na ngwụcha.",
    body: "Ụgwọ ntọala na-ejikọta mpaghara gị na kaadị ọnụ ego ọrụ; ịdị arọ, nha, mgbalịrịị na njikwa ihe nwere mfe na-agbakwunye n’ụzọ a na-atụ anya ya. Nzipu nwere ike ịkwado ọnụ ọgụgụ ikpeazụ naanị n’ọnọdụ pụrụ iche.",
  },
  zones: {
    eyebrow: "Mpaghara",
    baseFromLabel: "Ntọala site na",
    typicalWindowLabel: "Windo nkịtị",
  },
  rateCards: {
    eyebrow: "Kaadị ọnụ ego nrụnye",
    currencyNote:
      "A na-ejikọta ego ndị a na ụgwọ ntọala mpaghara n’oge nzọrọ. Egosipụtara ụkpụrụ na NGN.",
    serviceHeader: "Ọrụ",
    urgencyHeader: "Mgbalịrịị",
    baseAddOnHeader: "Mgbakwunye ntọala",
    perKgHeader: "Kwa kg",
    fragileHeader: "Mfe ịgbaji",
  },
  cta: {
    startBooking: "Malite nzọrọ",
  },
};

const LOGISTICS_PRICING_COPY_YO: DeepPartial<LogisticsPricingCopy> = {
  metadata: {
    title: "Ìdíyelé | HenryCo Logistics",
    description:
      "Ìdíyelé logistics tó dá lórí àgbègbè pẹ̀lú káàdì ìdíyelé àgbéyẹ̀wò àti àkókò ìlérí.",
  },
  hero: {
    eyebrow: "Ìdíyelé",
    title: "Òtítọ́ láti ìpilẹ̀ títí dé ìkẹ́yìn.",
    body: "Owó ìpilẹ̀ ń darapọ̀ àgbègbè rẹ pẹ̀lú káàdì ìdíyelé iṣẹ́; ìwúwo, ìwọ̀n, kíákíá, àti ìmúdúró ohun ẹlẹgẹ́ máa ń kún sí i lọ́nà tí a lè fojú-sọ́nà. Dìsípátì lè jẹ́risí àwọn nọ́mbà ìkẹyìn nìkan ní àwọn ọ̀ràn pàtàkì gidi.",
  },
  zones: {
    eyebrow: "Àwọn àgbègbè",
    baseFromLabel: "Ìpilẹ̀ láti",
    typicalWindowLabel: "Àkókò tó sábà máa wáyé",
  },
  rateCards: {
    eyebrow: "Káàdì ìdíyelé àgbéyẹ̀wò",
    currencyNote:
      "Wọ́n ń darapọ̀ àwọn iye pẹ̀lú owó ìpilẹ̀ àgbègbè nígbà ìfọwọ́sí. Iye ti hàn ní NGN.",
    serviceHeader: "Iṣẹ́",
    urgencyHeader: "Kíákíá",
    baseAddOnHeader: "Àfikún sí ìpilẹ̀",
    perKgHeader: "Fún kg",
    fragileHeader: "Ẹlẹgẹ́",
  },
  cta: {
    startBooking: "Bẹ̀rẹ̀ ìfọwọ́sí",
  },
};

const LOGISTICS_PRICING_COPY_HA: DeepPartial<LogisticsPricingCopy> = {
  metadata: {
    title: "Farashi | HenryCo Logistics",
    description:
      "Farashin logistics bisa yanki tare da katunan farashi na ja-gora da tagogin alkawari.",
  },
  hero: {
    eyebrow: "Farashi",
    title: "Gaskiya daga tushe har zuwa karshe.",
    body: "Kuɗin tushe yana haɗa yankinka tare da katin farashi na sabis; nauyi, girma, gaggawa, da kulawa da abubuwa masu sauƙin karyewa suna ƙarawa cikin hanyar da ake iya hango. Sashen aikawa zai iya tabbatar da lambobin ƙarshe ne kaɗai a cikin lamuran musamman na gaske.",
  },
  zones: {
    eyebrow: "Yankuna",
    baseFromLabel: "Tushe daga",
    typicalWindowLabel: "Tagar al’ada",
  },
  rateCards: {
    eyebrow: "Katunan farashi na ja-gora",
    currencyNote:
      "Ana haɗa kuɗaɗen tare da kuɗin tushe na yanki yayin yin rijista. An nuna ƙimomi a NGN.",
    serviceHeader: "Sabis",
    urgencyHeader: "Gaggawa",
    baseAddOnHeader: "Ƙarin kan tushe",
    perKgHeader: "Kowace kg",
    fragileHeader: "Mai sauƙin karyewa",
  },
  cta: {
    startBooking: "Fara rijista",
  },
};

const LOGISTICS_PRICING_LOCALE_MAP: Partial<
  Record<AppLocale, DeepPartial<LogisticsPricingCopy>>
> = {
  fr: LOGISTICS_PRICING_COPY_FR,
  es: LOGISTICS_PRICING_COPY_ES,
  pt: LOGISTICS_PRICING_COPY_PT,
  ar: LOGISTICS_PRICING_COPY_AR,
  de: LOGISTICS_PRICING_COPY_DE,
  it: LOGISTICS_PRICING_COPY_IT,
  zh: LOGISTICS_PRICING_COPY_ZH,
  hi: LOGISTICS_PRICING_COPY_HI,
  ig: LOGISTICS_PRICING_COPY_IG,
  yo: LOGISTICS_PRICING_COPY_YO,
  ha: LOGISTICS_PRICING_COPY_HA,
};

export function getLogisticsPricingCopy(locale: AppLocale): LogisticsPricingCopy {
  const overrides = LOGISTICS_PRICING_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      LOGISTICS_PRICING_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as LogisticsPricingCopy;
  }
  return LOGISTICS_PRICING_COPY_EN;
}

/** @internal */
export function __dangerouslyGetEnglishLogisticsPricingCopy(): LogisticsPricingCopy {
  return LOGISTICS_PRICING_COPY_EN;
}
