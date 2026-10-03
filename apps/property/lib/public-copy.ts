import type { AppLocale } from "@henryco/i18n/server";
import { deepMergeMessages, type DeepPartial } from "@henryco/i18n";

export type PropertyPublicCopy = {
  home: {
    searchSubmit: string;
    featuredTitle: string;
    featuredCta: string;
    areasTitle: string;
    agentsTitle: string;
    /**
     * Pass A1 additions — typed copy for every literal previously
     * hardcoded on apps/property/app/(public)/page.tsx.
     */
    trustStrip: {
      vetted: string;
      curatedBeforePublic: string;
      inventoryUnderReview: string;
      listingsLiveTemplate: string; // e.g. "{count} listings live"
    };
    heroPage: {
      title: string;
    };
    intentLedger: Array<{ kicker: string; title: string }>;
    returningVisitor: {
      signedIn: string; // "Signed in" — locale-natural lead-in
      continueLink: string;
      returningPrompt: string;
      openActivityLink: string;
      trackViewingLink: string;
    };
    inventorySnapshot: {
      title: string;
      liveListingsLabel: string;
      areasCoveredLabel: string;
      managedPortfolioLabel: string;
      managedPipelineTemplate: string; // e.g. "{pipeline} in pipeline · {value} under management" — handled in code
      managedPipelinePartialTemplate: string; // e.g. "{pipeline} in pipeline · value under setup"
      managedUnderManagementSuffix: string; // e.g. "NGN under management"
      managedValueUnderSetup: string; // e.g. "value under setup"
      pendingReviewLabel: string;
    };
    featuredEmpty: {
      eyebrow: string;
      submitCta: string;
    };
    areasTable: {
      headerArea: string;
      headerAvgRent: string;
      headerAvgSale: string;
      headerLive: string;
      emptyEyebrow: string;
    };
  };
  searchBar: {
    search: string;
    searchPlaceholder: string;
    category: string;
    allCategories: string;
    residentialRent: string;
    residentialSale: string;
    commercial: string;
    managed: string;
    shortlet: string;
    area: string;
    allAreas: string;
    updatingResults: string;
    resetFilters: string;
    managedOnly: string;
    furnished: string;
    refreshingResults: string;
  };
  listingCard: {
    saved: string;
    openPlan: string;
    premiumFit: string;
    noParking: string;
    view: string;
    beds: string;
    baths: string;
    sqm: string;
    parking: string;
  };
  areaCard: {
    averageRent: string;
    averageSale: string;
    liveListings: string;
    exploreArea: string;
  };
  recommended: {
    title: string;
    body: string;
    openFullSearch: string;
  };
  stats: {
    managedStock: string;
    featuredSurfaces: string;
    managedValue: string;
  };
  status: {
    approved: string;
    active: string;
    completed: string;
    rejected: string;
    cancelled: string;
    failed: string;
  };
};

const EN: PropertyPublicCopy = {
  home: {
    searchSubmit: "Search listings",
    featuredTitle: "Featured listings",
    featuredCta: "View all listings",
    areasTitle: "Areas",
    agentsTitle: "Relationship managers",
    trustStrip: {
      vetted: "Reviewed before publication",
      curatedBeforePublic: "Curated inventory",
      inventoryUnderReview: "Inventory under review",
      listingsLiveTemplate: "{count} listings live",
    },
    heroPage: {
      title: "Rent, buy, or list property with Henry Onyx.",
    },
    intentLedger: [
      {
        kicker: "01",
        title: "Browse homes for rent or sale",
      },
      {
        kicker: "02",
        title: "Browse managed homes",
      },
      {
        kicker: "03",
        title: "Submit a property for review",
      },
    ],
    returningVisitor: {
      signedIn: "Signed in",
      continueLink: "Continue in your property activity",
      returningPrompt: "Returning?",
      openActivityLink: "Open your property activity",
      trackViewingLink: "Track a viewing",
    },
    inventorySnapshot: {
      title: "Inventory snapshot",
      liveListingsLabel: "Live listings",
      areasCoveredLabel: "Areas covered",
      managedPortfolioLabel: "Managed portfolio",
      managedPipelineTemplate: "{pipeline} in pipeline · {value} {suffix}",
      managedPipelinePartialTemplate: "{pipeline} in pipeline · {setupLabel}",
      managedUnderManagementSuffix: "NGN under management",
      managedValueUnderSetup: "value under setup",
      pendingReviewLabel: "Pending review",
    },
    featuredEmpty: {
      eyebrow: "No featured listings yet",
      submitCta: "Submit a property",
    },
    areasTable: {
      headerArea: "Area",
      headerAvgRent: "Avg rent · year",
      headerAvgSale: "Avg sale",
      headerLive: "Live",
      emptyEyebrow: "Areas opening soon",
    },
  },
  searchBar: {
    search: "Search",
    searchPlaceholder: "Ikoyi penthouse, serviced residence, office suite...",
    category: "Category",
    allCategories: "All categories",
    residentialRent: "Residential rent",
    residentialSale: "Residential sale",
    commercial: "Commercial",
    managed: "Managed",
    shortlet: "Short-let",
    area: "Area",
    allAreas: "All areas",
    updatingResults: "Updating results",
    resetFilters: "Reset filters",
    managedOnly: "Managed only",
    furnished: "Furnished",
    refreshingResults: "Refreshing results without losing your place.",
  },
  listingCard: {
    saved: "Saved",
    openPlan: "Open plan",
    premiumFit: "Premium fit",
    noParking: "No parking",
    view: "View",
    beds: "beds",
    baths: "baths",
    sqm: "sqm",
    parking: "parking",
  },
  areaCard: {
    averageRent: "Average rent",
    averageSale: "Average sale",
    liveListings: "live listings",
    exploreArea: "Explore area",
  },
  recommended: {
    title: "Recommended for you",
    body: "Based on your last area selection on this device. Clear your browser data to reset.",
    openFullSearch: "Open full search",
  },
  stats: {
    managedStock: "Managed listings",
    featuredSurfaces: "Featured listings",
    managedValue: "Portfolio value",
  },
  status: {
    approved: "Approved",
    active: "Active",
    completed: "Completed",
    rejected: "Rejected",
    cancelled: "Cancelled",
    failed: "Failed",
  },
};

/* ─── FR (production-ready) ─────────────────────────────────────────── */
// COPY-RESET: DeepPartial — keys whose English changed were stripped for
// re-translation (docs/copy-audit/translation-manifest.json); FR falls back
// to the new English until then, like every other locale.
const FR: DeepPartial<PropertyPublicCopy> = {
  home: {
    featuredCta: "Voir toutes les annonces",
    trustStrip: {
      inventoryUnderReview: "Inventaire en cours de revue",
      listingsLiveTemplate: "{count} annonces actives",
    },
    returningVisitor: {
      signedIn: "Connecté",
      continueLink: "Poursuivre votre activité immobilière",
      returningPrompt: "Vous revenez ?",
      openActivityLink: "Ouvrir votre activité immobilière",
      trackViewingLink: "Suivre une visite",
    },
    inventorySnapshot: {
      title: "Aperçu de l’inventaire",
      liveListingsLabel: "Annonces actives",
      areasCoveredLabel: "Zones couvertes",
      managedPortfolioLabel: "Portefeuille géré",
      managedPipelineTemplate: "{pipeline} en pipeline · {value} {suffix}",
      managedPipelinePartialTemplate: "{pipeline} en pipeline · {setupLabel}",
      managedUnderManagementSuffix: "NGN sous gestion",
      managedValueUnderSetup: "valeur en cours de configuration",
      pendingReviewLabel: "En attente de revue",
    },
    featuredEmpty: {
      submitCta: "Proposer un bien",
    },
    areasTable: {
      headerArea: "Zone",
      headerAvgRent: "Loyer moyen · an",
      headerAvgSale: "Prix moyen",
      headerLive: "En ligne",
      emptyEyebrow: "Zones bientôt ouvertes",
    },
  },
  searchBar: {
    search: "Rechercher",
    searchPlaceholder: "Penthouse à Ikoyi, résidence avec services, bureau...",
    category: "Catégorie",
    allCategories: "Toutes les catégories",
    residentialRent: "Location résidentielle",
    residentialSale: "Vente résidentielle",
    commercial: "Commercial",
    managed: "Géré",
    shortlet: "Location courte durée",
    area: "Zone",
    allAreas: "Toutes les zones",
    updatingResults: "Mise à jour des résultats",
    resetFilters: "Réinitialiser les filtres",
    managedOnly: "Gérés uniquement",
    furnished: "Meublé",
    refreshingResults: "Rafraîchissement des résultats sans perdre votre place.",
  },
  listingCard: {
    saved: "Enregistré",
    openPlan: "Plan ouvert",
    premiumFit: "Finition premium",
    noParking: "Pas de parking",
    view: "Voir",
    beds: "ch.",
    baths: "sdb",
    sqm: "m²",
    parking: "parking",
  },
  areaCard: {
    averageRent: "Loyer moyen",
    averageSale: "Prix moyen",
    liveListings: "annonces actives",
    exploreArea: "Explorer la zone",
  },
  recommended: {
    title: "Recommandé pour vous",
    body: "Basé sur votre dernière sélection de zone sur cet appareil. Effacez les données du navigateur pour réinitialiser.",
    openFullSearch: "Ouvrir la recherche complète",
  },
  status: {
    approved: "Approuvé",
    active: "Actif",
    completed: "Terminé",
    rejected: "Rejeté",
    cancelled: "Annulé",
    failed: "Échoué",
  },
};

/* ─── ES partial (native-ui-ready) ─────────────────────────────────── */
const ES: DeepPartial<PropertyPublicCopy> = {
  home: {
    trustStrip: {
      inventoryUnderReview: "Inventario en revisión",
      listingsLiveTemplate: "{count} anuncios activos",
    },
    returningVisitor: {
      signedIn: "Sesión iniciada",
      continueLink: "Continuar con tu actividad inmobiliaria",
      returningPrompt: "¿Vuelves?",
      openActivityLink: "Abrir tu actividad inmobiliaria",
      trackViewingLink: "Seguir una visita",
    },
    inventorySnapshot: {
      title: "Resumen del inventario",
      liveListingsLabel: "Anuncios activos",
      areasCoveredLabel: "Zonas cubiertas",
      managedPortfolioLabel: "Cartera gestionada",
      managedPipelineTemplate: "{pipeline} en proceso · {value} {suffix}",
      managedPipelinePartialTemplate: "{pipeline} en proceso · {setupLabel}",
      managedUnderManagementSuffix: "NGN bajo gestión",
      managedValueUnderSetup: "valor en configuración",
      pendingReviewLabel: "Pendientes de revisión",
    },
    featuredEmpty: {
      submitCta: "Enviar una propiedad",
    },
    areasTable: {
      headerArea: "Zona",
      headerAvgRent: "Alquiler medio · año",
      headerAvgSale: "Venta media",
      headerLive: "Activos",
      emptyEyebrow: "Zonas próximamente",
    },
  },
};

/* ─── PT partial (native-ui-ready) ─────────────────────────────────── */
const PT: DeepPartial<PropertyPublicCopy> = {
  home: {
    trustStrip: {
      inventoryUnderReview: "Inventário em revisão",
      listingsLiveTemplate: "{count} anúncios ativos",
    },
    returningVisitor: {
      signedIn: "Sessão iniciada",
      continueLink: "Continuar a sua atividade imobiliária",
      returningPrompt: "De volta?",
      openActivityLink: "Abrir a sua atividade imobiliária",
      trackViewingLink: "Acompanhar uma visita",
    },
    inventorySnapshot: {
      title: "Resumo do inventário",
      liveListingsLabel: "Anúncios ativos",
      areasCoveredLabel: "Zonas cobertas",
      managedPortfolioLabel: "Carteira sob gestão",
      managedPipelineTemplate: "{pipeline} em pipeline · {value} {suffix}",
      managedPipelinePartialTemplate: "{pipeline} em pipeline · {setupLabel}",
      managedUnderManagementSuffix: "NGN sob gestão",
      managedValueUnderSetup: "valor em configuração",
      pendingReviewLabel: "Em análise",
    },
    featuredEmpty: {
      submitCta: "Submeter um imóvel",
    },
    areasTable: {
      headerArea: "Zona",
      headerAvgRent: "Renda média · ano",
      headerAvgSale: "Venda média",
      headerLive: "Ativos",
      emptyEyebrow: "Zonas em breve",
    },
  },
};

/* ─── DE partial (native-ui-ready) ─────────────────────────────────── */
const DE: DeepPartial<PropertyPublicCopy> = {
  home: {
    trustStrip: {
      inventoryUnderReview: "Bestand in Prüfung",
      listingsLiveTemplate: "{count} aktive Inserate",
    },
    returningVisitor: {
      signedIn: "Angemeldet",
      continueLink: "Mit Ihrer Immobilienaktivität fortfahren",
      returningPrompt: "Zurück?",
      openActivityLink: "Ihre Immobilienaktivität öffnen",
      trackViewingLink: "Besichtigung verfolgen",
    },
    inventorySnapshot: {
      title: "Bestandsüberblick",
      liveListingsLabel: "Aktive Inserate",
      areasCoveredLabel: "Abgedeckte Gebiete",
      managedPortfolioLabel: "Verwaltetes Portfolio",
      managedPipelineTemplate: "{pipeline} in Bearbeitung · {value} {suffix}",
      managedPipelinePartialTemplate: "{pipeline} in Bearbeitung · {setupLabel}",
      managedUnderManagementSuffix: "NGN unter Verwaltung",
      managedValueUnderSetup: "Wert in Vorbereitung",
      pendingReviewLabel: "In Prüfung",
    },
    featuredEmpty: {
      submitCta: "Objekt einreichen",
    },
    areasTable: {
      headerArea: "Gebiet",
      headerAvgRent: "Ø Miete · Jahr",
      headerAvgSale: "Ø Verkaufspreis",
      headerLive: "Aktiv",
      emptyEyebrow: "Gebiete in Kürze",
    },
  },
};

/* ─── IT partial (native-ui-ready) ─────────────────────────────────── */
const IT: DeepPartial<PropertyPublicCopy> = {
  home: {
    trustStrip: {
      inventoryUnderReview: "Inventario in revisione",
      listingsLiveTemplate: "{count} annunci attivi",
    },
    returningVisitor: {
      signedIn: "Connesso",
      continueLink: "Continua la tua attività immobiliare",
      returningPrompt: "Bentornato?",
      openActivityLink: "Apri la tua attività immobiliare",
      trackViewingLink: "Segui una visita",
    },
    inventorySnapshot: {
      title: "Panoramica dell’inventario",
      liveListingsLabel: "Annunci attivi",
      areasCoveredLabel: "Zone coperte",
      managedPortfolioLabel: "Portafoglio in gestione",
      managedPipelineTemplate: "{pipeline} in pipeline · {value} {suffix}",
      managedPipelinePartialTemplate: "{pipeline} in pipeline · {setupLabel}",
      managedUnderManagementSuffix: "NGN in gestione",
      managedValueUnderSetup: "valore in configurazione",
      pendingReviewLabel: "In attesa di revisione",
    },
    featuredEmpty: {
      submitCta: "Invia un immobile",
    },
    areasTable: {
      headerArea: "Zona",
      headerAvgRent: "Affitto medio · anno",
      headerAvgSale: "Vendita media",
      headerLive: "Attivi",
      emptyEyebrow: "Zone in apertura",
    },
  },
};

/* ─── AR partial (native-ui-ready, RTL) ────────────────────────────── */
const AR: DeepPartial<PropertyPublicCopy> = {
  home: {
    trustStrip: {
      inventoryUnderReview: "المخزون قيد المراجعة",
      listingsLiveTemplate: "{count} إعلانات نشطة",
    },
    returningVisitor: {
      signedIn: "تم تسجيل الدخول",
      continueLink: "تابع نشاطك العقاري",
      returningPrompt: "هل عدت؟",
      openActivityLink: "افتح نشاطك العقاري",
      trackViewingLink: "تتبّع معاينة",
    },
    inventorySnapshot: {
      title: "لمحة عن المخزون",
      liveListingsLabel: "الإعلانات النشطة",
      areasCoveredLabel: "المناطق المغطاة",
      managedPortfolioLabel: "المحفظة المُدارة",
      managedPipelineTemplate: "{pipeline} قيد المعالجة · {value} {suffix}",
      managedPipelinePartialTemplate: "{pipeline} قيد المعالجة · {setupLabel}",
      managedUnderManagementSuffix: "NGN تحت الإدارة",
      managedValueUnderSetup: "القيمة قيد الإعداد",
      pendingReviewLabel: "بانتظار المراجعة",
    },
    featuredEmpty: {
      submitCta: "أرسل عقاراً",
    },
    areasTable: {
      headerArea: "المنطقة",
      headerAvgRent: "متوسط الإيجار · سنوياً",
      headerAvgSale: "متوسط البيع",
      headerLive: "نشط",
      emptyEyebrow: "مناطق ستُفتح قريباً",
    },
  },
};

/* ─── ZH partial (native-quality manual) ───────────────────────────── */
const ZH: DeepPartial<PropertyPublicCopy> = {
  home: {
    trustStrip: {
      inventoryUnderReview: "房源审核中",
      listingsLiveTemplate: "{count} 套在线房源",
    },
    returningVisitor: {
      signedIn: "已登录",
      continueLink: "继续您的房产活动",
      returningPrompt: "再次回到这里?",
      openActivityLink: "打开您的房产活动",
      trackViewingLink: "跟进看房",
    },
    inventorySnapshot: {
      title: "房源概览",
      liveListingsLabel: "在线房源",
      areasCoveredLabel: "覆盖区域",
      managedPortfolioLabel: "托管组合",
      managedPipelineTemplate: "{pipeline} 个进行中 · {value} {suffix}",
      managedPipelinePartialTemplate: "{pipeline} 个进行中 · {setupLabel}",
      managedUnderManagementSuffix: "NGN 托管资产",
      managedValueUnderSetup: "估值筹备中",
      pendingReviewLabel: "待审房源",
    },
    featuredEmpty: {
      submitCta: "提交房源",
    },
    areasTable: {
      headerArea: "区域",
      headerAvgRent: "年均租金",
      headerAvgSale: "均价",
      headerLive: "在线",
      emptyEyebrow: "区域即将开放",
    },
  },
};

/* ─── HI partial (scaffold, native Hindi) ──────────────────────────── */
const HI: DeepPartial<PropertyPublicCopy> = {
  home: {
    trustStrip: {
      inventoryUnderReview: "इन्वेंटरी समीक्षाधीन",
      listingsLiveTemplate: "{count} लाइव लिस्टिंग",
    },
    returningVisitor: {
      signedIn: "साइन इन",
      continueLink: "अपनी प्रॉपर्टी एक्टिविटी आगे बढ़ाएँ",
      returningPrompt: "वापस आए?",
      openActivityLink: "अपनी प्रॉपर्टी एक्टिविटी खोलें",
      trackViewingLink: "विज़िट ट्रैक करें",
    },
    inventorySnapshot: {
      title: "इन्वेंटरी झलक",
      liveListingsLabel: "लाइव लिस्टिंग",
      areasCoveredLabel: "कवर किए गए इलाक़े",
      managedPortfolioLabel: "मैनेज्ड पोर्टफ़ोलियो",
      managedPipelineTemplate: "{pipeline} पाइपलाइन में · {value} {suffix}",
      managedPipelinePartialTemplate: "{pipeline} पाइपलाइन में · {setupLabel}",
      managedUnderManagementSuffix: "NGN प्रबंधन में",
      managedValueUnderSetup: "मूल्य सेटअप जारी",
      pendingReviewLabel: "समीक्षा में",
    },
    featuredEmpty: {
      submitCta: "प्रॉपर्टी सबमिट करें",
    },
    areasTable: {
      headerArea: "इलाक़ा",
      headerAvgRent: "औसत किराया · सालाना",
      headerAvgSale: "औसत बिक्री",
      headerLive: "लाइव",
      emptyEyebrow: "इलाक़े जल्द खुलेंगे",
    },
  },
};

/* ─── IG partial (Igbo — Lagos/Onitsha-natural) ────────────────────── */
const IG: DeepPartial<PropertyPublicCopy> = {
  home: {
    trustStrip: {
      inventoryUnderReview: "Ngwongwo na nyocha",
      listingsLiveTemplate: "Ndepụta {count} dị ndụ",
    },
    returningVisitor: {
      signedIn: "Abanyela",
      continueLink: "Gaa n’ihu na mmegharị ụlọ gị",
      returningPrompt: "Ị laghachiri?",
      openActivityLink: "Meghe mmegharị ụlọ gị",
      trackViewingLink: "Soro nleta",
    },
    inventorySnapshot: {
      title: "Nhụta ngwongwo",
      liveListingsLabel: "Ndepụta dị ndụ",
      areasCoveredLabel: "Mpaghara akpuchiri",
      managedPortfolioLabel: "Akpa a na-elekọta",
      managedPipelineTemplate: "{pipeline} dị na mpịakọta · {value} {suffix}",
      managedPipelinePartialTemplate: "{pipeline} dị na mpịakọta · {setupLabel}",
      managedUnderManagementSuffix: "NGN n’okpuru nlekọta",
      managedValueUnderSetup: "uru ka na-edozi",
      pendingReviewLabel: "Na-eche nyocha",
    },
    featuredEmpty: {
      submitCta: "Nyefee ụlọ",
    },
    areasTable: {
      headerArea: "Mpaghara",
      headerAvgRent: "Mgbazinye nkezi · n’afọ",
      headerAvgSale: "Ọnụahịa ire nkezi",
      headerLive: "Dị ndụ",
      emptyEyebrow: "Mpaghara na-emepe n’oge na-adịghị anya",
    },
  },
};

/* ─── YO partial (Yorùbá — Lagos-natural) ──────────────────────────── */
const YO: DeepPartial<PropertyPublicCopy> = {
  home: {
    trustStrip: {
      inventoryUnderReview: "Àkójọ ní àyẹ̀wò",
      listingsLiveTemplate: "Àkọsílẹ̀ {count} ń lọ́wọ́",
    },
    returningVisitor: {
      signedIn: "O wọlé",
      continueLink: "Tẹ̀síwájú nínú iṣẹ́ ohun-ìní rẹ",
      returningPrompt: "O padà bọ̀?",
      openActivityLink: "Ṣí iṣẹ́ ohun-ìní rẹ",
      trackViewingLink: "Tẹ̀lé ìbẹ̀wò",
    },
    inventorySnapshot: {
      title: "Àkójọpọ̀ ní kíkún",
      liveListingsLabel: "Àkọsílẹ̀ ń lọ́wọ́",
      areasCoveredLabel: "Àdúgbò tí a bo",
      managedPortfolioLabel: "Àkójọ ìṣàkóso",
      managedPipelineTemplate: "{pipeline} ní ìlà · {value} {suffix}",
      managedPipelinePartialTemplate: "{pipeline} ní ìlà · {setupLabel}",
      managedUnderManagementSuffix: "NGN labẹ́ ìṣàkóso",
      managedValueUnderSetup: "iye ní ìmúrasílẹ̀",
      pendingReviewLabel: "Ń dúró àyẹ̀wò",
    },
    featuredEmpty: {
      submitCta: "Fi ohun-ìní hàn",
    },
    areasTable: {
      headerArea: "Àdúgbò",
      headerAvgRent: "Owó àyàá ìpíndọ́gba · ọdún",
      headerAvgSale: "Owó ìtà ìpíndọ́gba",
      headerLive: "Ń lọ́wọ́",
      emptyEyebrow: "Àwọn àdúgbò ń bọ̀",
    },
  },
};

/* ─── HA partial (Hausa — Kano/Abuja-natural) ──────────────────────── */
const HA: DeepPartial<PropertyPublicCopy> = {
  home: {
    trustStrip: {
      inventoryUnderReview: "Ana sake duba kayan",
      listingsLiveTemplate: "Tallace-tallace {count} suna kunne",
    },
    returningVisitor: {
      signedIn: "Ka shiga",
      continueLink: "Ci gaba da aikinka na kadara",
      returningPrompt: "Ka dawo?",
      openActivityLink: "Bude aikinka na kadara",
      trackViewingLink: "Bi ziyarar",
    },
    inventorySnapshot: {
      title: "Taƙaitaccen kayan",
      liveListingsLabel: "Tallace-tallace masu kunne",
      areasCoveredLabel: "Yankunan da aka kawo",
      managedPortfolioLabel: "Ƙungiyar sarrafawa",
      managedPipelineTemplate: "{pipeline} a bututu · {value} {suffix}",
      managedPipelinePartialTemplate: "{pipeline} a bututu · {setupLabel}",
      managedUnderManagementSuffix: "NGN a ƙarƙashin sarrafawa",
      managedValueUnderSetup: "ƙimar tana shiri",
      pendingReviewLabel: "Ana jiran bita",
    },
    featuredEmpty: {
      submitCta: "Mika kadara",
    },
    areasTable: {
      headerArea: "Yanki",
      headerAvgRent: "Matsakaicin haya · shekara",
      headerAvgSale: "Matsakaicin sayarwa",
      headerLive: "Kunne",
      emptyEyebrow: "Yankuna za su buɗe nan ba da daɗewa ba",
    },
  },
};

/* ─── locale registry ──────────────────────────────────────────────── */
const LOCALE_PARTIALS: Partial<Record<AppLocale, DeepPartial<PropertyPublicCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  de: DE,
  it: IT,
  ar: AR,
  zh: ZH,
  hi: HI,
  ig: IG,
  yo: YO,
  ha: HA,
};

export function getPropertyPublicCopy(locale: AppLocale): PropertyPublicCopy {
  if (locale === "en") return EN;
  const partial = LOCALE_PARTIALS[locale];
  if (!partial) return EN;
  return deepMergeMessages(EN, partial as Partial<PropertyPublicCopy>);
}
