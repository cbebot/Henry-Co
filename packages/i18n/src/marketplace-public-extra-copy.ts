import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

export type MarketplacePublicExtraCopy = {
  home: {
    selectiveCatalogLabel: string;
    qualityOverVolumeValue: string;
    selectiveCatalogHint: string;
    moreListingsArriving: string;
    selectiveCatalogHeadline: string;
    selectiveCatalogBody: string;
    listingsSuffix: string;
  };
  search: {
    kicker: string;
    title: string;
    description: string;
  };
  header: {
    homeAriaLabel: string;
    searchHenryCo: string;
    avatarAlt: (name: string) => string;
  };
};

const EN: MarketplacePublicExtraCopy = {
  home: {
    selectiveCatalogLabel: "Selective catalog",
    qualityOverVolumeValue: "Quality over volume",
    selectiveCatalogHint:
      "We onboard sellers slowly so listings are vetted before they go public.",
    moreListingsArriving: "More listings arriving",
    selectiveCatalogHeadline: "Selective catalog — quality over volume.",
    selectiveCatalogBody:
      "We onboard sellers slowly so the listings you do see are vetted before they go public.",
    listingsSuffix: "listings",
  },
  search: {
    kicker: "Search",
    title: "Find it fast. Trust what you see.",
    description:
      "Refine by verified seller, brand, category, and COD readiness. Results update as you filter, stay readable on mobile, and surface the trust signals you care about before you click through.",
  },
  header: {
    homeAriaLabel: "HenryCo Marketplace home",
    searchHenryCo: "Search HenryCo",
    avatarAlt: (name: string) => `${name} avatar`,
  },
};

const FR: DeepPartial<MarketplacePublicExtraCopy> = {
  home: {
    selectiveCatalogLabel: "Catalogue sélectif",
    qualityOverVolumeValue: "La qualité avant la quantité",
    selectiveCatalogHint:
      "Nous intégrons les vendeurs progressivement afin que chaque annonce soit vérifiée avant sa publication.",
    moreListingsArriving: "D'autres annonces arrivent",
    selectiveCatalogHeadline: "Catalogue sélectif — la qualité avant la quantité.",
    selectiveCatalogBody:
      "Nous intégrons les vendeurs progressivement, si bien que les annonces que vous voyez sont vérifiées avant leur publication.",
    listingsSuffix: "annonces",
  },
  search: {
    kicker: "Recherche",
    title: "Trouvez vite. Faites confiance à ce que vous voyez.",
    description:
      "Affinez par vendeur vérifié, marque, catégorie et disponibilité du paiement à la livraison. Les résultats se mettent à jour au fil de vos filtres, restent lisibles sur mobile et mettent en avant les signaux de confiance qui comptent pour vous avant que vous ne cliquiez.",
  },
  header: {
    homeAriaLabel: "Accueil de HenryCo Marketplace",
    searchHenryCo: "Rechercher dans HenryCo",
    avatarAlt: (name: string) => `Avatar de ${name}`,
  },
};

const ES: DeepPartial<MarketplacePublicExtraCopy> = {
  home: {
    selectiveCatalogLabel: "Catálogo selectivo",
    qualityOverVolumeValue: "Calidad antes que cantidad",
    selectiveCatalogHint:
      "Incorporamos a los vendedores poco a poco para que los anuncios se verifiquen antes de hacerse públicos.",
    moreListingsArriving: "Llegan más anuncios",
    selectiveCatalogHeadline: "Catálogo selectivo: calidad antes que cantidad.",
    selectiveCatalogBody:
      "Incorporamos a los vendedores poco a poco, de modo que los anuncios que ves se verifican antes de hacerse públicos.",
    listingsSuffix: "anuncios",
  },
  search: {
    kicker: "Buscar",
    title: "Encuéntralo rápido. Confía en lo que ves.",
    description:
      "Filtra por vendedor verificado, marca, categoría y disponibilidad de pago contra entrega. Los resultados se actualizan a medida que filtras, se ven bien en el móvil y muestran las señales de confianza que te importan antes de que hagas clic.",
  },
  header: {
    homeAriaLabel: "Inicio de HenryCo Marketplace",
    searchHenryCo: "Buscar en HenryCo",
    avatarAlt: (name: string) => `Avatar de ${name}`,
  },
};

const PT: DeepPartial<MarketplacePublicExtraCopy> = {
  home: {
    selectiveCatalogLabel: "Catálogo seletivo",
    qualityOverVolumeValue: "Qualidade acima de quantidade",
    selectiveCatalogHint:
      "Integramos os vendedores aos poucos para que os anúncios sejam verificados antes de ficarem públicos.",
    moreListingsArriving: "Mais anúncios a caminho",
    selectiveCatalogHeadline: "Catálogo seletivo — qualidade acima de quantidade.",
    selectiveCatalogBody:
      "Integramos os vendedores aos poucos, por isso os anúncios que você vê são verificados antes de ficarem públicos.",
    listingsSuffix: "anúncios",
  },
  search: {
    kicker: "Pesquisar",
    title: "Encontre rápido. Confie no que você vê.",
    description:
      "Refine por vendedor verificado, marca, categoria e disponibilidade de pagamento na entrega. Os resultados se atualizam conforme você filtra, permanecem legíveis no celular e destacam os sinais de confiança que importam para você antes de clicar.",
  },
  header: {
    homeAriaLabel: "Página inicial do HenryCo Marketplace",
    searchHenryCo: "Pesquisar no HenryCo",
    avatarAlt: (name: string) => `Avatar de ${name}`,
  },
};

const AR: DeepPartial<MarketplacePublicExtraCopy> = {
  home: {
    selectiveCatalogLabel: "كتالوج انتقائي",
    qualityOverVolumeValue: "الجودة قبل الكمية",
    selectiveCatalogHint:
      "نضمّ البائعين برويّة حتى تتمّ مراجعة الإعلانات قبل نشرها للجمهور.",
    moreListingsArriving: "المزيد من الإعلانات في الطريق",
    selectiveCatalogHeadline: "كتالوج انتقائي — الجودة قبل الكمية.",
    selectiveCatalogBody:
      "نضمّ البائعين برويّة، لذا تخضع الإعلانات التي تراها للمراجعة قبل نشرها للجمهور.",
    listingsSuffix: "إعلان",
  },
  search: {
    kicker: "بحث",
    title: "اعثر عليه بسرعة. وثق بما تراه.",
    description:
      "صفّ النتائج حسب البائع الموثّق والعلامة التجارية والفئة وتوفّر الدفع عند الاستلام. تتحدّث النتائج أثناء التصفية، وتبقى واضحة على الهاتف، وتبرز إشارات الثقة التي تهمّك قبل أن تنقر.",
  },
  header: {
    homeAriaLabel: "الصفحة الرئيسية لـ HenryCo Marketplace",
    searchHenryCo: "البحث في HenryCo",
    avatarAlt: (name: string) => `الصورة الرمزية لـ ${name}`,
  },
};

const DE: DeepPartial<MarketplacePublicExtraCopy> = {
  home: {
    selectiveCatalogLabel: "Ausgewählter Katalog",
    qualityOverVolumeValue: "Qualität vor Quantität",
    selectiveCatalogHint:
      "Wir nehmen Verkäufer behutsam auf, damit die Angebote vor der Veröffentlichung geprüft werden.",
    moreListingsArriving: "Weitere Angebote folgen",
    selectiveCatalogHeadline: "Ausgewählter Katalog — Qualität vor Quantität.",
    selectiveCatalogBody:
      "Wir nehmen Verkäufer behutsam auf, sodass die Angebote, die Sie sehen, vor der Veröffentlichung geprüft werden.",
    listingsSuffix: "Angebote",
  },
  search: {
    kicker: "Suche",
    title: "Schnell finden. Dem vertrauen, was Sie sehen.",
    description:
      "Filtern Sie nach verifiziertem Verkäufer, Marke, Kategorie und Verfügbarkeit der Zahlung bei Lieferung. Die Ergebnisse aktualisieren sich beim Filtern, bleiben auf dem Smartphone gut lesbar und heben die Vertrauenssignale hervor, die Ihnen wichtig sind, bevor Sie weiterklicken.",
  },
  header: {
    homeAriaLabel: "Startseite von HenryCo Marketplace",
    searchHenryCo: "HenryCo durchsuchen",
    avatarAlt: (name: string) => `Avatar von ${name}`,
  },
};

const IT: DeepPartial<MarketplacePublicExtraCopy> = {
  home: {
    selectiveCatalogLabel: "Catalogo selettivo",
    qualityOverVolumeValue: "Qualità prima della quantità",
    selectiveCatalogHint:
      "Inseriamo i venditori con gradualità affinché gli annunci vengano verificati prima di diventare pubblici.",
    moreListingsArriving: "Altri annunci in arrivo",
    selectiveCatalogHeadline: "Catalogo selettivo — qualità prima della quantità.",
    selectiveCatalogBody:
      "Inseriamo i venditori con gradualità, così gli annunci che vedi vengono verificati prima di diventare pubblici.",
    listingsSuffix: "annunci",
  },
  search: {
    kicker: "Cerca",
    title: "Trovalo in fretta. Fidati di ciò che vedi.",
    description:
      "Affina per venditore verificato, marca, categoria e disponibilità del pagamento alla consegna. I risultati si aggiornano mentre filtri, restano leggibili su mobile e mettono in evidenza i segnali di fiducia che ti interessano prima di cliccare.",
  },
  header: {
    homeAriaLabel: "Home di HenryCo Marketplace",
    searchHenryCo: "Cerca in HenryCo",
    avatarAlt: (name: string) => `Avatar di ${name}`,
  },
};

const ZH: DeepPartial<MarketplacePublicExtraCopy> = {
  home: {
    selectiveCatalogLabel: "精选目录",
    qualityOverVolumeValue: "重质不重量",
    selectiveCatalogHint:
      "我们稳步引入卖家，确保每个商品都经过审核后才公开上线。",
    moreListingsArriving: "更多商品即将上线",
    selectiveCatalogHeadline: "精选目录 — 重质不重量。",
    selectiveCatalogBody:
      "我们稳步引入卖家，因此您看到的商品都已经过审核后才公开。",
    listingsSuffix: "件商品",
  },
  search: {
    kicker: "搜索",
    title: "快速找到，看得放心。",
    description:
      "按认证卖家、品牌、类别和货到付款可用性筛选。结果随筛选实时更新，在手机上依然清晰易读，并在您点击前突出您所重视的信任信号。",
  },
  header: {
    homeAriaLabel: "HenryCo Marketplace 首页",
    searchHenryCo: "搜索 HenryCo",
    avatarAlt: (name: string) => `${name} 的头像`,
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<MarketplacePublicExtraCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
};
// ig, yo, ha, hi are intentionally OMITTED -> fall back to EN (human-translation only).

export function getMarketplacePublicExtraCopy(locale: AppLocale): MarketplacePublicExtraCopy {
  const o = LOCALE_MAP[locale];
  if (o)
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      o as unknown as Record<string, unknown>,
    ) as unknown as MarketplacePublicExtraCopy;
  return EN;
}
