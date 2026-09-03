import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * CarePricingCopy — i18n surface for the Care division public `/pricing`
 * page. Covers page metadata, the pricing-clarity hero, package rail
 * labels (home/office), structured add-on + quote modifier rails,
 * garment-category section headers, the "move forward" CTA block, and
 * shared rail micro-copy (per-piece / per-kg / staff / cadence labels).
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each locale is
 * a Partial that deep-merges over EN so missing keys fall through to EN
 * silently. Mirrors the shape of `hub-public-copy.ts`.
 */
export type CarePricingCopy = {
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    body: string;
    pricingNoteEyebrow: string;
  };
  packages: {
    eyebrow: string;
    homeTitle: string;
    officeTitle: string;
    staffSuffix: string;
  };
  modifiers: {
    eyebrow: string;
    addOnsTitle: string;
    quoteModifiersTitle: string;
  };
  garment: {
    eyebrow: string;
    currentItemPricing: string;
    perUnit: string;
  };
  cta: {
    eyebrow: string;
    title: string;
    body: string;
    button: string;
  };
};

const CARE_PRICING_COPY_EN: CarePricingCopy = {
  metadata: {
    title: "Pricing",
    description:
      "Transparent garment pricing, home cleaning packages, office cleaning packages, and service add-ons across Henry Onyx Fabric Care.",
  },
  hero: {
    eyebrow: "Pricing clarity",
    title: "You see the price before you book.",
    body:
      "Garment pricing, home and office packages, and service add-ons — stated before the request is placed, not after.",
    pricingNoteEyebrow: "Pricing note",
  },
  packages: {
    eyebrow: "Package pricing",
    homeTitle: "Home cleaning packages",
    officeTitle: "Office cleaning packages",
    staffSuffix: "staff",
  },
  modifiers: {
    eyebrow: "Quote structure",
    addOnsTitle: "Structured add-ons",
    quoteModifiersTitle: "Quote modifiers",
  },
  garment: {
    eyebrow: "Garment category",
    currentItemPricing: "Current item pricing",
    perUnit: "per",
  },
  cta: {
    eyebrow: "Move forward",
    title: "Review the price structure, then book with clarity.",
    body:
      "Garment care stays item-based. Home and office services stay grounded in package scope, travel, urgency, team size, and optional extras.",
    button: "Plan service",
  },
};

const CARE_PRICING_COPY_FR: DeepPartial<CarePricingCopy> = {
  metadata: {
    title: "Tarifs",
    description:
      "Tarification transparente du textile, forfaits ménage à domicile, forfaits ménage de bureau et options de service à travers Henry Onyx Fabric Care.",
  },
  hero: {
    eyebrow: "Tarifs en clair",
    title: "Vous connaissez le prix avant de réserver.",
    body:
      "Tarification au textile, forfaits domicile et bureau, et options de service — annoncés avant la demande, pas après.",
    pricingNoteEyebrow: "Note tarifaire",
  },
  packages: {
    eyebrow: "Tarifs des forfaits",
    homeTitle: "Forfaits ménage à domicile",
    officeTitle: "Forfaits ménage de bureau",
    staffSuffix: "intervenants",
  },
  modifiers: {
    eyebrow: "Structure du devis",
    addOnsTitle: "Options structurées",
    quoteModifiersTitle: "Modificateurs de devis",
  },
  garment: {
    eyebrow: "Catégorie textile",
    currentItemPricing: "Tarifs actuels des articles",
    perUnit: "par",
  },
  cta: {
    eyebrow: "Passer à l’étape suivante",
    title: "Examinez la structure tarifaire, puis réservez en toute clarté.",
    body:
      "Le soin du textile reste au coupon par article. Les prestations domicile et bureau restent fondées sur le périmètre du forfait, le déplacement, l’urgence, la taille de l’équipe et les options éventuelles.",
    button: "Planifier la prestation",
  },
};

const CARE_PRICING_COPY_ES: DeepPartial<CarePricingCopy> = {
  metadata: {
    title: "Tarifas",
    description:
      "Precios transparentes para prendas, paquetes de limpieza para el hogar, paquetes de limpieza para oficina y servicios complementarios en Henry Onyx Fabric Care.",
  },
  hero: {
    eyebrow: "Tarifas claras",
    title: "Conoce el precio antes de reservar.",
    body:
      "Precios por prenda, paquetes para hogar y oficina, y servicios complementarios — comunicados antes de la solicitud, no después.",
    pricingNoteEyebrow: "Nota tarifaria",
  },
  packages: {
    eyebrow: "Precio de los paquetes",
    homeTitle: "Paquetes de limpieza para el hogar",
    officeTitle: "Paquetes de limpieza para oficina",
    staffSuffix: "personas",
  },
  modifiers: {
    eyebrow: "Estructura del presupuesto",
    addOnsTitle: "Complementos estructurados",
    quoteModifiersTitle: "Modificadores del presupuesto",
  },
  garment: {
    eyebrow: "Categoría de prenda",
    currentItemPricing: "Precios actuales por artículo",
    perUnit: "por",
  },
  cta: {
    eyebrow: "Siguiente paso",
    title: "Revise la estructura de precios y reserve con total claridad.",
    body:
      "El cuidado de prendas se cobra por artículo. Los servicios de hogar y oficina se basan en el alcance del paquete, los desplazamientos, la urgencia, el tamaño del equipo y los complementos opcionales.",
    button: "Programar servicio",
  },
};

const CARE_PRICING_COPY_PT: DeepPartial<CarePricingCopy> = {
  metadata: {
    title: "Preços",
    description:
      "Preços transparentes para vestuário, pacotes de limpeza doméstica, pacotes de limpeza para escritório e complementos de serviço em todo o Henry Onyx Fabric Care.",
  },
  hero: {
    eyebrow: "Preços com clareza",
    title: "Vê o preço antes de reservar.",
    body:
      "Preços por peça, pacotes de casa e escritório e complementos de serviço — anunciados antes do pedido, não depois.",
    pricingNoteEyebrow: "Nota de preços",
  },
  packages: {
    eyebrow: "Preço dos pacotes",
    homeTitle: "Pacotes de limpeza doméstica",
    officeTitle: "Pacotes de limpeza para escritório",
    staffSuffix: "pessoas",
  },
  modifiers: {
    eyebrow: "Estrutura do orçamento",
    addOnsTitle: "Complementos estruturados",
    quoteModifiersTitle: "Modificadores de orçamento",
  },
  garment: {
    eyebrow: "Categoria de peça",
    currentItemPricing: "Preços actuais por artigo",
    perUnit: "por",
  },
  cta: {
    eyebrow: "Avançar",
    title: "Reveja a estrutura de preços e depois reserve com clareza.",
    body:
      "O cuidado das peças mantém-se ao artigo. Os serviços de casa e escritório mantêm-se ancorados no âmbito do pacote, deslocação, urgência, dimensão da equipa e extras opcionais.",
    button: "Planear o serviço",
  },
};

const CARE_PRICING_COPY_AR: DeepPartial<CarePricingCopy> = {
  metadata: {
    title: "الأسعار",
    description:
      "أسعار شفّافة للملابس، باقات تنظيف للمنازل، باقات تنظيف للمكاتب، وخدمات إضافية في جميع أقسام Henry Onyx Fabric Care.",
  },
  hero: {
    eyebrow: "وضوح في الأسعار",
    title: "ترى السعر قبل أن تحجز.",
    body:
      "أسعار الملابس، وباقات المنازل والمكاتب، والخدمات الإضافية — مُعلَنة قبل تقديم الطلب، لا بعده.",
    pricingNoteEyebrow: "ملاحظة بشأن السعر",
  },
  packages: {
    eyebrow: "أسعار الباقات",
    homeTitle: "باقات تنظيف المنازل",
    officeTitle: "باقات تنظيف المكاتب",
    staffSuffix: "من فريق العمل",
  },
  modifiers: {
    eyebrow: "هيكل عرض السعر",
    addOnsTitle: "خدمات إضافية مُنظَّمة",
    quoteModifiersTitle: "معدِّلات عرض السعر",
  },
  garment: {
    eyebrow: "فئة الملابس",
    currentItemPricing: "الأسعار الحالية للأصناف",
    perUnit: "لكل",
  },
  cta: {
    eyebrow: "الخطوة التالية",
    title: "راجع هيكل الأسعار، ثم احجز بثقة.",
    body:
      "تظل العناية بالملابس قائمة على القطعة. أما خدمات المنازل والمكاتب فتستند إلى نطاق الباقة، والتنقل، ومستوى الإلحاح، وحجم الفريق، والإضافات الاختيارية.",
    button: "تخطيط الخدمة",
  },
};

const CARE_PRICING_COPY_DE: DeepPartial<CarePricingCopy> = {
  metadata: {
    title: "Preise",
    description:
      "Transparente Preise für Textilreinigung, Reinigungspakete für Privathaushalte, Bürorreinigungspakete und Zusatzleistungen bei Henry Onyx Fabric Care.",
  },
  hero: {
    eyebrow: "Preisklarheit",
    title: "Sie sehen den Preis vor der Buchung.",
    body:
      "Textilpreise, Pakete für Privathaushalt und Büro sowie Zusatzleistungen — vor der Anfrage genannt, nicht erst danach.",
    pricingNoteEyebrow: "Preishinweis",
  },
  packages: {
    eyebrow: "Paketpreise",
    homeTitle: "Reinigungspakete für Privathaushalte",
    officeTitle: "Reinigungspakete für Büros",
    staffSuffix: "Personen",
  },
  modifiers: {
    eyebrow: "Angebotsstruktur",
    addOnsTitle: "Strukturierte Zusatzleistungen",
    quoteModifiersTitle: "Angebotsmodifikatoren",
  },
  garment: {
    eyebrow: "Textilkategorie",
    currentItemPricing: "Aktuelle Stückpreise",
    perUnit: "pro",
  },
  cta: {
    eyebrow: "Weiter",
    title: "Prüfen Sie die Preisstruktur und buchen Sie dann mit Klarheit.",
    body:
      "Textilpflege bleibt artikelbasiert. Privathaushalt und Büro orientieren sich am Paketumfang, Anfahrt, Dringlichkeit, Teamgröße und optionalen Extras.",
    button: "Service planen",
  },
};

const CARE_PRICING_COPY_IT: DeepPartial<CarePricingCopy> = {
  metadata: {
    title: "Tariffe",
    description:
      "Prezzi trasparenti per capi, pacchetti di pulizia per la casa, pacchetti di pulizia per ufficio e servizi aggiuntivi in tutto Henry Onyx Fabric Care.",
  },
  hero: {
    eyebrow: "Tariffe chiare",
    title: "Vede il prezzo prima di prenotare.",
    body:
      "Prezzi al capo, pacchetti casa e ufficio, e servizi aggiuntivi — comunicati prima della richiesta, non dopo.",
    pricingNoteEyebrow: "Nota tariffaria",
  },
  packages: {
    eyebrow: "Prezzo dei pacchetti",
    homeTitle: "Pacchetti di pulizia per la casa",
    officeTitle: "Pacchetti di pulizia per ufficio",
    staffSuffix: "persone",
  },
  modifiers: {
    eyebrow: "Struttura del preventivo",
    addOnsTitle: "Servizi aggiuntivi strutturati",
    quoteModifiersTitle: "Modificatori del preventivo",
  },
  garment: {
    eyebrow: "Categoria capo",
    currentItemPricing: "Prezzi attuali per articolo",
    perUnit: "per",
  },
  cta: {
    eyebrow: "Prosegui",
    title: "Esamini la struttura dei prezzi, poi prenoti con chiarezza.",
    body:
      "La cura del capo resta a singolo articolo. I servizi casa e ufficio restano ancorati al perimetro del pacchetto, alla trasferta, all’urgenza, alla dimensione del team e agli eventuali extra.",
    button: "Pianifica il servizio",
  },
};

const CARE_PRICING_COPY_ZH: DeepPartial<CarePricingCopy> = {
  metadata: {
    title: "价格",
    description:
      "Henry Onyx Fabric Care 全线提供透明的衣物清洗价格、家庭清洁套餐、办公清洁套餐及服务附加项。",
  },
  hero: {
    eyebrow: "价格清晰",
    title: "下单前即可看到价格。",
    body:
      "衣物清洗价格、家庭与办公套餐、服务附加项——在提交需求之前明示,而非事后。",
    pricingNoteEyebrow: "价格说明",
  },
  packages: {
    eyebrow: "套餐价格",
    homeTitle: "家庭清洁套餐",
    officeTitle: "办公清洁套餐",
    staffSuffix: "位人员",
  },
  modifiers: {
    eyebrow: "报价结构",
    addOnsTitle: "结构化附加项",
    quoteModifiersTitle: "报价修正项",
  },
  garment: {
    eyebrow: "衣物类别",
    currentItemPricing: "当前单品价格",
    perUnit: "每",
  },
  cta: {
    eyebrow: "继续",
    title: "了解价格结构后,清晰下单。",
    body:
      "衣物护理按件计价。家庭与办公服务基于套餐范围、上门距离、紧急程度、团队规模及可选附加项。",
    button: "安排服务",
  },
};

const CARE_PRICING_COPY_HI: DeepPartial<CarePricingCopy> = {
  metadata: {
    title: "मूल्य",
    description:
      "Henry Onyx Fabric Care पर वस्त्रों की पारदर्शी कीमतें, घरेलू सफ़ाई पैकेज, कार्यालय सफ़ाई पैकेज और सेवा ऐड-ऑन।",
  },
  hero: {
    eyebrow: "स्पष्ट मूल्य",
    title: "बुक करने से पहले ही आपको मूल्य दिख जाता है।",
    body:
      "वस्त्रों की दरें, घर और कार्यालय के पैकेज, और सेवा ऐड-ऑन — अनुरोध रखने से पहले बताए जाते हैं, बाद में नहीं।",
    pricingNoteEyebrow: "मूल्य संबंधी सूचना",
  },
  packages: {
    eyebrow: "पैकेज मूल्य",
    homeTitle: "घरेलू सफ़ाई पैकेज",
    officeTitle: "कार्यालय सफ़ाई पैकेज",
    staffSuffix: "कर्मचारी",
  },
  modifiers: {
    eyebrow: "कोटेशन की संरचना",
    addOnsTitle: "संरचित ऐड-ऑन",
    quoteModifiersTitle: "कोटेशन समायोजक",
  },
  garment: {
    eyebrow: "वस्त्र श्रेणी",
    currentItemPricing: "वर्तमान आइटम मूल्य",
    perUnit: "प्रति",
  },
  cta: {
    eyebrow: "आगे बढ़ें",
    title: "मूल्य संरचना देखें और स्पष्टता के साथ बुक करें।",
    body:
      "वस्त्रों की देखभाल आइटम-आधारित ही रहती है। घर और कार्यालय की सेवाएँ पैकेज के दायरे, यात्रा, तत्परता, टीम आकार और वैकल्पिक अतिरिक्त सेवाओं पर टिकी रहती हैं।",
    button: "सेवा शेड्यूल करें",
  },
};

const CARE_PRICING_COPY_IG: DeepPartial<CarePricingCopy> = {
  metadata: {
    title: "Ọnụ ahịa",
    description:
      "Ọnụ ahịa doro anya maka ịsa uwe, ngwugwu nhicha ụlọ, ngwugwu nhicha ọfịs, na ọrụ mgbakwunye n’ụlọ ọrụ Henry Onyx Fabric Care niile.",
  },
  hero: {
    eyebrow: "Ọnụ ahịa doro anya",
    title: "Ị na-ahụ ọnụ ahịa tupu ị tinye akwụkwọ.",
    body:
      "Ọnụ ahịa nke uwe, ngwugwu ụlọ na ọfịs, na ọrụ mgbakwunye — a na-akpọpụta ya tupu arịrịọ, ọ bụghị mgbe e mesịrị.",
    pricingNoteEyebrow: "Ndetu ọnụ ahịa",
  },
  packages: {
    eyebrow: "Ọnụ ahịa ngwugwu",
    homeTitle: "Ngwugwu nhicha ụlọ",
    officeTitle: "Ngwugwu nhicha ọfịs",
    staffSuffix: "ndị ọrụ",
  },
  modifiers: {
    eyebrow: "Nhazi nke ego ekwuru",
    addOnsTitle: "Mgbakwunye ahaziri ahazi",
    quoteModifiersTitle: "Ihe na-agbanwe ego ekwuru",
  },
  garment: {
    eyebrow: "Ụdị uwe",
    currentItemPricing: "Ọnụ ahịa ihe ugbu a",
    perUnit: "kwa",
  },
  cta: {
    eyebrow: "Gaa n’ihu",
    title: "Lelee usoro ọnụ ahịa, mesịa tinye akwụkwọ n’enweghị mgbagwoju anya.",
    body:
      "Nlekọta uwe ka na-adabere n’otu n’otu. Ọrụ ụlọ na ọfịs na-eguzo n’oke ngwugwu, ije, ọsọ ọsọ, oke otu, na ihe ndị ọzọ a na-ahọrọ ahọrọ.",
    button: "Hazie ọrụ",
  },
};

const CARE_PRICING_COPY_YO: DeepPartial<CarePricingCopy> = {
  metadata: {
    title: "Iye owó",
    description:
      "Iye owó tó ṣe kedere fún ìfọṣọ aṣọ, àwọn pákéjì ìmọ́tótó ilé, àwọn pákéjì ìmọ́tótó ọ́físì, àti ìṣẹ́ àfikún jákèjádò Henry Onyx Fabric Care.",
  },
  hero: {
    eyebrow: "Iye owó tó dájú",
    title: "O máa rí iye owó kí o tó forí jin.",
    body:
      "Iye owó aṣọ, pákéjì ilé àti ọ́físì, àti ìṣẹ́ àfikún — a sọ ọ́ kí ìbéèrè náà tó dé, kì í ṣe lẹ́yìn rẹ̀.",
    pricingNoteEyebrow: "Àkíyèsí lórí iye owó",
  },
  packages: {
    eyebrow: "Iye owó pákéjì",
    homeTitle: "Pákéjì ìmọ́tótó ilé",
    officeTitle: "Pákéjì ìmọ́tótó ọ́físì",
    staffSuffix: "òṣìṣẹ́",
  },
  modifiers: {
    eyebrow: "Ìṣètò iye owó tí a yọ jáde",
    addOnsTitle: "Àwọn àfikún tó ní ìṣètò",
    quoteModifiersTitle: "Àtúnṣe iye owó tí a yọ jáde",
  },
  garment: {
    eyebrow: "Ẹ̀ka aṣọ",
    currentItemPricing: "Iye owó nǹkan lọ́wọ́lọ́wọ́",
    perUnit: "fún",
  },
  cta: {
    eyebrow: "Tẹ̀síwájú",
    title: "Wo ìṣètò iye owó, kí o sì forí jin pẹ̀lú òye tó péye.",
    body:
      "Ìtọ́jú aṣọ máa ń wà lórí ìpín kọ̀ọ̀kan. Ìṣẹ́ ilé àti ọ́físì máa ń dúró lórí ààlà pákéjì, ìrìnnà, ìyára, ìwọ̀n ẹgbẹ́, àti àwọn àfikún tí a lè yan.",
    button: "Ṣètò iṣẹ́",
  },
};

const CARE_PRICING_COPY_HA: DeepPartial<CarePricingCopy> = {
  metadata: {
    title: "Farashi",
    description:
      "Farashi a fili na wanke tufafi, fakitin tsabtace gida, fakitin tsabtace ofis, da ƙarin ayyuka a faɗin Henry Onyx Fabric Care.",
  },
  hero: {
    eyebrow: "Farashi a sarari",
    title: "Kana ganin farashi kafin ka yi rijista.",
    body:
      "Farashin tufafi, fakitocin gida da ofis, da ƙarin ayyuka — ana sanar da su kafin a aika buƙatar, ba bayan ba.",
    pricingNoteEyebrow: "Bayanin farashi",
  },
  packages: {
    eyebrow: "Farashin fakiti",
    homeTitle: "Fakitin tsabtace gida",
    officeTitle: "Fakitin tsabtace ofis",
    staffSuffix: "ma'aikata",
  },
  modifiers: {
    eyebrow: "Tsarin farashin da aka bayar",
    addOnsTitle: "Ƙarin ayyukan da aka tsara",
    quoteModifiersTitle: "Masu canza farashin da aka bayar",
  },
  garment: {
    eyebrow: "Nau'in tufafi",
    currentItemPricing: "Farashin kayan na yanzu",
    perUnit: "kowane",
  },
  cta: {
    eyebrow: "Ci gaba",
    title: "Duba tsarin farashi, sannan ka yi rijista a sarari.",
    body:
      "Kula da tufafi yana kasancewa a kowane abu. Ayyukan gida da ofis suna dogara da iyakar fakiti, tafiya, gaggawa, girman ƙungiya, da ƙarin abubuwan zaɓi.",
    button: "Tsara aiki",
  },
};

const CARE_PRICING_LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<CarePricingCopy>>> = {
  fr: CARE_PRICING_COPY_FR,
  es: CARE_PRICING_COPY_ES,
  pt: CARE_PRICING_COPY_PT,
  ar: CARE_PRICING_COPY_AR,
  de: CARE_PRICING_COPY_DE,
  it: CARE_PRICING_COPY_IT,
  zh: CARE_PRICING_COPY_ZH,
  hi: CARE_PRICING_COPY_HI,
  ig: CARE_PRICING_COPY_IG,
  yo: CARE_PRICING_COPY_YO,
  ha: CARE_PRICING_COPY_HA,
};

export function getCarePricingCopy(locale: AppLocale): CarePricingCopy {
  const overrides = CARE_PRICING_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      CARE_PRICING_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as CarePricingCopy;
  }
  return CARE_PRICING_COPY_EN;
}

/** @internal */
export function __dangerouslyGetEnglishCarePricingCopy(): CarePricingCopy {
  return CARE_PRICING_COPY_EN;
}
