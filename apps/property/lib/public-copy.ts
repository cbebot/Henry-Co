import type { AppLocale } from "@henryco/i18n/server";
import { deepMergeMessages, type DeepPartial } from "@henryco/i18n";

export type PropertyPublicCopy = {
  home: {
    heroKicker: string;
    heroTitle: string;
    heroBody: string;
    primaryCta: string;
    secondaryCta: string;
    searchSubmit: string;
    whyKicker: string;
    whyCards: Array<{ title: string; body: string }>;
    featuredKicker: string;
    featuredTitle: string;
    featuredDescription: string;
    featuredCta: string;
    areasKicker: string;
    areasTitle: string;
    areasDescription: string;
    managedKicker: string;
    managedTitle: string;
    managedBody: string;
    trustPills: Array<{ title: string; body: string }>;
    differentiatorsKicker: string;
    differentiatorsTitle: string;
    differentiatorsDescription: string;
    agentsKicker: string;
    agentsTitle: string;
    agentsDescription: string;
    metrics: Array<{ label: string; hint: string }>;
    /**
     * Pass A1 additions — typed copy for every literal previously
     * hardcoded on apps/property/app/(public)/page.tsx.
     */
    trustStrip: {
      vetted: string;
      curatedBeforePublic: string;
      inventoryUnderReview: string;
      inventoryLabel: string; // e.g. "Henry Onyx Property · Inventory" (year appended at render time)
      listingsLiveTemplate: string; // e.g. "{count} listings live"
    };
    heroPage: {
      title: string;
      body: string;
    };
    intentLedger: Array<{ kicker: string; title: string; body: string }>;
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
      areasCoveredEmptyHint: string;
      managedPortfolioLabel: string;
      managedPipelineTemplate: string; // e.g. "{pipeline} in pipeline · {value} under management" — handled in code
      managedPipelinePartialTemplate: string; // e.g. "{pipeline} in pipeline · value under setup"
      managedUnderManagementSuffix: string; // e.g. "NGN under management"
      managedValueUnderSetup: string; // e.g. "value under setup"
      pendingReviewLabel: string;
      pendingReviewHint: string;
      refineSearchLabel: string;
    };
    featuredEmpty: {
      eyebrow: string;
      body: string;
      browseCta: string;
      submitCta: string;
    };
    areasTable: {
      headerArea: string;
      headerAvgRent: string;
      headerAvgSale: string;
      headerLive: string;
      emptyEyebrow: string;
      emptyBody: string;
    };
    managedAside: {
      title: string;
      activeEngagementsLabel: string;
      inPipelineLabel: string;
      combinedValueLabel: string;
      combinedValueHint: string;
      footnote: string;
    };
    agentsEmpty: {
      eyebrow: string;
      body: string;
    };
    closingCta: {
      eyebrow: string;
      title: string;
      body: string;
      browseCta: string;
      submitCta: string;
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
    shareableFilters: string;
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
    managedStockBody: string;
    featuredSurfaces: string;
    featuredSurfacesBody: string;
    managedValue: string;
    managedValueBody: string;
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
    heroKicker: "Henry Onyx Property",
    heroTitle: "Property discovery for people who do not want noise, guesswork, or weak follow-through.",
    heroBody:
      "Browse curated rentals, sale inventory, commercial spaces, and managed homes with better listing quality, stronger trust notes, structured viewing requests, and calmer owner communication.",
    primaryCta: "Explore listings",
    secondaryCta: "Submit a property",
    searchSubmit: "Start a calm search",
    whyKicker: "Why this feels different",
    whyCards: [
      {
        title: "Trust signals on every serious listing",
        body: "Managed status, verification notes, and readiness context are surfaced before contact is made.",
      },
      {
        title: "Viewing flow with less waste",
        body: "Requests, confirmation, reminders, and agent assignment are structured to reduce dead-end tours.",
      },
      {
        title: "Managed-property layer beyond lead capture",
        body: "HenryCo can keep operating the home, short-let, or portfolio after the listing goes live.",
      },
    ],
    featuredKicker: "Featured listings",
    featuredTitle: "Premium homes and workspaces with stronger context before the first viewing.",
    featuredDescription:
      "The featured surface prioritizes better photography, clearer positioning, tighter moderation, and listings with higher-conviction next steps.",
    featuredCta: "View all listings",
    areasKicker: "Areas",
    areasTitle: "Location pages that explain the market, not just the stock.",
    areasDescription:
      "Each area surface gives serious renters and buyers the market context, hotspots, and trust rails behind the shortlist.",
    managedKicker: "Managed-property services",
    managedTitle: "A property platform that continues after marketing, inquiries, and move-in.",
    managedBody:
      "Henry Onyx Property is designed to market, qualify, coordinate, and then keep operating selected properties through owner reporting, inspections, maintenance coordination, and ongoing trust services.",
    trustPills: [
      {
        title: "Editorial moderation",
        body: "Listing quality is improved before publication so premium inventory does not look like clutter.",
      },
      {
        title: "Owner and operator trust notes",
        body: "Trust rails are attached to listings so serious inquiries start with better information.",
      },
      {
        title: "Viewing accountability",
        body: "Scheduling and reminders are tracked server-side, which reduces low-confidence follow-up.",
      },
      {
        title: "Unified HenryCo memory",
        body: "Saved properties, inquiries, and viewings are mirrored for future cross-division account continuity.",
      },
    ],
    differentiatorsKicker: "Differentiators",
    differentiatorsTitle: "Designed to be calmer, tighter, and more operationally serious than a classified board.",
    differentiatorsDescription:
      "These are the product and operations choices that turn the platform into a trust surface, not just a listing dump.",
    agentsKicker: "Relationship managers",
    agentsTitle: "People behind the listings, viewings, and managed-property follow-through.",
    agentsDescription:
      "The operator layer is visible because premium real estate decisions need stronger coordination than anonymous form handoffs.",
    metrics: [
      { label: "Live listings", hint: "Public inventory currently available on Henry Onyx Property." },
      { label: "Managed portfolio", hint: "Active managed-property records tracked in HenryCo operations." },
      { label: "Viewing pipeline", hint: "Open viewing requests currently being scheduled or confirmed." },
    ],
    trustStrip: {
      vetted: "Vetted listings · Verified owners",
      curatedBeforePublic: "Curated, vetted before public",
      inventoryUnderReview: "Inventory under review",
      inventoryLabel: "Henry Onyx Property · Inventory",
      listingsLiveTemplate: "{count} listings live",
    },
    heroPage: {
      title: "A property platform that respects your time, the listing, and the work that comes after move-in.",
      body: "Curated rentals, sale inventory, commercial spaces, and managed homes — every listing carries trust notes, a verified owner path, and a structured viewing flow. Intent first, paperwork when you need it.",
    },
    intentLedger: [
      {
        kicker: "01 · Live in it",
        title: "Browse vetted homes for rent or sale",
        body: "Filter by area, price, managed status. Save listings, request viewings, message owners — all from your HenryCo account.",
      },
      {
        kicker: "02 · Own it without operating it",
        title: "Managed-property browse",
        body: "HenryCo continues to operate selected portfolios after move-in: viewings, screening, maintenance, and owner reporting on one ledger.",
      },
      {
        kicker: "03 · List or steward it",
        title: "Submit a property for review",
        body: "Built for owners and agents. Inquiries land in your HenryCo inbox; managed support is available if you want HenryCo to handle the operating side.",
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
      areasCoveredEmptyHint: "Areas open as inventory clears review",
      managedPortfolioLabel: "Managed portfolio",
      managedPipelineTemplate: "{pipeline} in pipeline · {value} {suffix}",
      managedPipelinePartialTemplate: "{pipeline} in pipeline · {setupLabel}",
      managedUnderManagementSuffix: "NGN under management",
      managedValueUnderSetup: "value under setup",
      pendingReviewLabel: "Pending review",
      pendingReviewHint: "Listings clearing moderation before they go public",
      refineSearchLabel: "Refine the search",
    },
    featuredEmpty: {
      eyebrow: "Featured surface · clearing review",
      body: "The featured rail is empty by design while inventory clears moderation. New listings are reviewed for quality, owner verification, and trust posture before they’re elevated here.",
      browseCta: "Browse all listings",
      submitCta: "Submit a property",
    },
    areasTable: {
      headerArea: "Area",
      headerAvgRent: "Avg rent · year",
      headerAvgSale: "Avg sale",
      headerLive: "Live",
      emptyEyebrow: "Areas opening soon",
      emptyBody: "Area ledger entries appear once at least one approved listing lands in moderation. Submit a listing to help the area become visible.",
    },
    managedAside: {
      title: "Managed-property ledger",
      activeEngagementsLabel: "Active engagements",
      inPipelineLabel: "In pipeline",
      combinedValueLabel: "Combined value",
      combinedValueHint: "Combined portfolio under HenryCo trust operations",
      footnote: "Owner reporting, inspections, and maintenance coordination run on the same ledger as the marketing surface. One audit trail.",
    },
    agentsEmpty: {
      eyebrow: "Operator layer publishing soon",
      body: "Relationship managers appear here once their profiles are verified. Until then, owner inquiries route directly to the property desk and a manager is assigned during review.",
    },
    closingCta: {
      eyebrow: "Continue",
      title: "Search the inventory or submit a property — the rest of the flow is on a single ledger.",
      body: "Saved listings, viewing requests, owner replies, and the eventual managed handoff stay in one HenryCo account. No portal hopping.",
      browseCta: "Browse all listings",
      submitCta: "Submit a property",
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
    shareableFilters:
      "Filters stay in the URL so you can share the exact search or come back to it later.",
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
    managedStock: "Managed stock",
    managedStockBody: "Listings currently running through HenryCo managed-property rails.",
    featuredSurfaces: "Featured surfaces",
    featuredSurfacesBody: "Listings currently elevated across editorial and campaign surfaces.",
    managedValue: "Managed value",
    managedValueBody: "Combined managed-property portfolio value under HenryCo trust operations.",
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
const FR: PropertyPublicCopy = {
  home: {
    heroKicker: "Henry Onyx Property",
    heroTitle: "La découverte immobilière pour ceux qui ne veulent ni bruit, ni approximations, ni suivi faible.",
    heroBody:
      "Parcourez des locations sélectionnées, des biens à vendre, des espaces commerciaux et des logements gérés avec une meilleure qualité d’annonce, des notes de confiance plus solides, des demandes de visite structurées et une communication propriétaire plus sereine.",
    primaryCta: "Explorer les annonces",
    secondaryCta: "Proposer un bien",
    searchSubmit: "Lancer une recherche sereine",
    whyKicker: "Pourquoi c’est différent",
    whyCards: [
      {
        title: "Des signaux de confiance sur chaque annonce sérieuse",
        body: "Le statut géré, les notes de vérification et le contexte de préparation apparaissent avant tout contact.",
      },
      {
        title: "Un parcours de visite avec moins de perte",
        body: "Demandes, confirmations, rappels et affectation d’agent sont structurés pour réduire les visites sans suite.",
      },
      {
        title: "Une couche de gestion au-delà du simple lead",
        body: "HenryCo peut continuer à exploiter le logement, la location courte durée ou le portefeuille après la mise en ligne.",
      },
    ],
    featuredKicker: "Annonces vedettes",
    featuredTitle: "Biens et espaces premium avec plus de contexte avant la première visite.",
    featuredDescription:
      "La surface vedette privilégie de meilleures photos, un positionnement plus clair, une modération plus stricte et des annonces avec des prochaines étapes plus nettes.",
    featuredCta: "Voir toutes les annonces",
    areasKicker: "Zones",
    areasTitle: "Des pages de zone qui expliquent le marché, pas seulement le stock.",
    areasDescription:
      "Chaque surface de zone donne aux locataires et acheteurs sérieux le contexte de marché, les points chauds et les rails de confiance derrière la sélection.",
    managedKicker: "Services de gestion immobilière",
    managedTitle: "Une plateforme immobilière qui continue après le marketing, les demandes et l’emménagement.",
    managedBody:
      "Henry Onyx Property est conçu pour commercialiser, qualifier, coordonner puis poursuivre l’exploitation de biens sélectionnés via le reporting propriétaire, les inspections, la coordination de maintenance et les services de confiance.",
    trustPills: [
      {
        title: "Modération éditoriale",
        body: "La qualité des annonces est améliorée avant publication afin que l’inventaire premium ne ressemble pas à un simple flux désordonné.",
      },
      {
        title: "Notes de confiance pour propriétaires et opérateurs",
        body: "Des rails de confiance sont associés aux annonces afin que les demandes sérieuses partent avec de meilleures informations.",
      },
      {
        title: "Responsabilité des visites",
        body: "La planification et les rappels sont suivis côté serveur, ce qui réduit les relances peu fiables.",
      },
      {
        title: "Mémoire HenryCo unifiée",
        body: "Les biens enregistrés, demandes et visites sont répercutés pour la continuité de compte entre divisions.",
      },
    ],
    differentiatorsKicker: "Différenciateurs",
    differentiatorsTitle: "Pensé pour être plus calme, plus rigoureux et plus opérationnel qu’un simple tableau de petites annonces.",
    differentiatorsDescription:
      "Ces choix produit et opération transforment la plateforme en surface de confiance, pas seulement en dépôt d’annonces.",
    agentsKicker: "Responsables relationnels",
    agentsTitle: "Les personnes derrière les annonces, les visites et le suivi de gestion.",
    agentsDescription:
      "La couche opérateur est visible parce que les décisions immobilières premium demandent plus de coordination qu’un formulaire anonyme.",
    metrics: [
      { label: "Annonces actives", hint: "Inventaire public actuellement disponible sur Henry Onyx Property." },
      { label: "Portefeuille géré", hint: "Dossiers de gestion actifs suivis dans les opérations HenryCo." },
      { label: "Flux de visites", hint: "Demandes de visite ouvertes actuellement planifiées ou confirmées." },
    ],
    trustStrip: {
      vetted: "Annonces vérifiées · Propriétaires authentifiés",
      curatedBeforePublic: "Sélectionnées, vérifiées avant publication",
      inventoryUnderReview: "Inventaire en cours de revue",
      inventoryLabel: "Henry Onyx Property · Inventaire",
      listingsLiveTemplate: "{count} annonces actives",
    },
    heroPage: {
      title: "Une plateforme immobilière qui respecte votre temps, l’annonce et le travail qui suit l’emménagement.",
      body: "Locations sélectionnées, biens à vendre, espaces commerciaux et logements gérés — chaque annonce porte des notes de confiance, un parcours propriétaire vérifié et une visite structurée. L’intention d’abord, la paperasse au moment voulu.",
    },
    intentLedger: [
      {
        kicker: "01 · Y habiter",
        title: "Parcourir des biens vérifiés à louer ou à vendre",
        body: "Filtrez par zone, prix, statut géré. Enregistrez des annonces, demandez des visites, contactez les propriétaires — depuis votre compte HenryCo.",
      },
      {
        kicker: "02 · En être propriétaire sans l’exploiter",
        title: "Parcourir les biens gérés",
        body: "HenryCo continue à exploiter certains portefeuilles après l’emménagement : visites, sélection, maintenance et reporting propriétaire sur un seul registre.",
      },
      {
        kicker: "03 · Le proposer ou le confier",
        title: "Soumettre un bien à la revue",
        body: "Conçu pour propriétaires et agents. Les demandes arrivent dans votre boîte HenryCo ; le support géré est disponible si vous souhaitez que HenryCo prenne en charge l’exploitation.",
      },
    ],
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
      areasCoveredEmptyHint: "Les zones s’ouvrent à mesure que l’inventaire passe la revue",
      managedPortfolioLabel: "Portefeuille géré",
      managedPipelineTemplate: "{pipeline} en pipeline · {value} {suffix}",
      managedPipelinePartialTemplate: "{pipeline} en pipeline · {setupLabel}",
      managedUnderManagementSuffix: "NGN sous gestion",
      managedValueUnderSetup: "valeur en cours de configuration",
      pendingReviewLabel: "En attente de revue",
      pendingReviewHint: "Annonces en cours de modération avant publication",
      refineSearchLabel: "Affiner la recherche",
    },
    featuredEmpty: {
      eyebrow: "Surface vedette · revue en cours",
      body: "Le rail vedette reste volontairement vide pendant la modération. Les nouvelles annonces sont examinées pour leur qualité, la vérification du propriétaire et leur posture de confiance avant d’être mises en avant.",
      browseCta: "Parcourir toutes les annonces",
      submitCta: "Proposer un bien",
    },
    areasTable: {
      headerArea: "Zone",
      headerAvgRent: "Loyer moyen · an",
      headerAvgSale: "Prix moyen",
      headerLive: "En ligne",
      emptyEyebrow: "Zones bientôt ouvertes",
      emptyBody: "Les entrées du registre des zones apparaissent dès qu’au moins une annonce approuvée passe en modération. Soumettez une annonce pour aider la zone à devenir visible.",
    },
    managedAside: {
      title: "Registre des biens gérés",
      activeEngagementsLabel: "Mandats actifs",
      inPipelineLabel: "En pipeline",
      combinedValueLabel: "Valeur consolidée",
      combinedValueHint: "Portefeuille combiné sous opérations de confiance HenryCo",
      footnote: "Reporting propriétaire, inspections et coordination de maintenance suivent le même registre que la surface marketing. Une seule piste d’audit.",
    },
    agentsEmpty: {
      eyebrow: "Couche opérateur bientôt publiée",
      body: "Les responsables relationnels apparaissent ici dès que leurs profils sont vérifiés. En attendant, les demandes propriétaires arrivent directement au bureau immobilier et un responsable est affecté lors de la revue.",
    },
    closingCta: {
      eyebrow: "Continuer",
      title: "Cherchez dans l’inventaire ou proposez un bien — la suite reste sur un seul registre.",
      body: "Annonces enregistrées, demandes de visite, réponses propriétaires et la transition vers la gestion restent dans un seul compte HenryCo. Pas de jonglage entre portails.",
      browseCta: "Parcourir toutes les annonces",
      submitCta: "Proposer un bien",
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
    shareableFilters:
      "Les filtres restent dans l’URL pour partager la recherche exacte ou y revenir plus tard.",
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
  stats: {
    managedStock: "Stock géré",
    managedStockBody: "Annonces actuellement pilotées via les rails de gestion HenryCo.",
    featuredSurfaces: "Surfaces vedettes",
    featuredSurfacesBody: "Annonces actuellement mises en avant dans les surfaces éditoriales et de campagne.",
    managedValue: "Valeur gérée",
    managedValueBody: "Valeur totale du portefeuille géré sous opérations de confiance HenryCo.",
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
      vetted: "Anuncios verificados · Propietarios autenticados",
      curatedBeforePublic: "Seleccionados y verificados antes de publicarse",
      inventoryUnderReview: "Inventario en revisión",
      inventoryLabel: "Henry Onyx Property · Inventario",
      listingsLiveTemplate: "{count} anuncios activos",
    },
    heroPage: {
      title: "Una plataforma inmobiliaria que respeta tu tiempo, el anuncio y el trabajo posterior a la mudanza.",
      body: "Alquileres seleccionados, propiedades en venta, espacios comerciales y viviendas gestionadas: cada anuncio incluye notas de confianza, una vía verificada del propietario y un flujo de visita estructurado. La intención primero, el papeleo cuando lo necesites.",
    },
    intentLedger: [
      {
        kicker: "01 · Para vivirla",
        title: "Explora viviendas verificadas en alquiler o venta",
        body: "Filtra por zona, precio y estado de gestión. Guarda anuncios, solicita visitas y contacta a los propietarios desde tu cuenta HenryCo.",
      },
      {
        kicker: "02 · Para ser dueño sin operarlo",
        title: "Explorar propiedades gestionadas",
        body: "HenryCo continúa operando carteras seleccionadas tras la mudanza: visitas, selección, mantenimiento y reportes al propietario en un único registro.",
      },
      {
        kicker: "03 · Para publicarla o confiarla",
        title: "Enviar una propiedad para revisión",
        body: "Pensado para propietarios y agentes. Las consultas llegan a tu bandeja HenryCo; el soporte gestionado está disponible si quieres que HenryCo se encargue de la operación.",
      },
    ],
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
      areasCoveredEmptyHint: "Las zonas se abren a medida que el inventario pasa la revisión",
      managedPortfolioLabel: "Cartera gestionada",
      managedPipelineTemplate: "{pipeline} en proceso · {value} {suffix}",
      managedPipelinePartialTemplate: "{pipeline} en proceso · {setupLabel}",
      managedUnderManagementSuffix: "NGN bajo gestión",
      managedValueUnderSetup: "valor en configuración",
      pendingReviewLabel: "Pendientes de revisión",
      pendingReviewHint: "Anuncios en moderación antes de hacerse públicos",
      refineSearchLabel: "Refinar la búsqueda",
    },
    featuredEmpty: {
      eyebrow: "Surface destacada · revisión en curso",
      body: "El carril destacado permanece vacío de forma intencional mientras el inventario pasa la moderación. Los nuevos anuncios se revisan por calidad, verificación del propietario y postura de confianza antes de elevarse aquí.",
      browseCta: "Ver todos los anuncios",
      submitCta: "Enviar una propiedad",
    },
    areasTable: {
      headerArea: "Zona",
      headerAvgRent: "Alquiler medio · año",
      headerAvgSale: "Venta media",
      headerLive: "Activos",
      emptyEyebrow: "Zonas próximamente",
      emptyBody: "Las entradas del registro de zonas aparecen cuando al menos un anuncio aprobado entra en moderación. Envía un anuncio para que la zona empiece a ser visible.",
    },
    managedAside: {
      title: "Registro de propiedades gestionadas",
      activeEngagementsLabel: "Mandatos activos",
      inPipelineLabel: "En proceso",
      combinedValueLabel: "Valor combinado",
      combinedValueHint: "Cartera combinada bajo operaciones de confianza HenryCo",
      footnote: "Reportes al propietario, inspecciones y coordinación de mantenimiento se ejecutan sobre el mismo registro que la superficie de marketing. Un único rastro de auditoría.",
    },
    agentsEmpty: {
      eyebrow: "Capa de operador próximamente",
      body: "Los gestores de relación aparecen aquí cuando sus perfiles están verificados. Mientras tanto, las consultas de propietarios se enrutan directamente a la mesa inmobiliaria y se asigna un gestor durante la revisión.",
    },
    closingCta: {
      eyebrow: "Continuar",
      title: "Busca en el inventario o envía una propiedad — el resto del flujo está en un solo registro.",
      body: "Anuncios guardados, solicitudes de visita, respuestas de propietarios y el eventual traspaso a gestión permanecen en una única cuenta HenryCo. Sin saltar entre portales.",
      browseCta: "Ver todos los anuncios",
      submitCta: "Enviar una propiedad",
    },
  },
};

/* ─── PT partial (native-ui-ready) ─────────────────────────────────── */
const PT: DeepPartial<PropertyPublicCopy> = {
  home: {
    trustStrip: {
      vetted: "Anúncios verificados · Proprietários autenticados",
      curatedBeforePublic: "Selecionados e verificados antes da publicação",
      inventoryUnderReview: "Inventário em revisão",
      inventoryLabel: "Henry Onyx Property · Inventário",
      listingsLiveTemplate: "{count} anúncios ativos",
    },
    heroPage: {
      title: "Uma plataforma imobiliária que respeita o seu tempo, o anúncio e o trabalho que vem depois da mudança.",
      body: "Aluguéis selecionados, imóveis à venda, espaços comerciais e imóveis sob gestão — cada anúncio traz notas de confiança, um percurso verificado do proprietário e um fluxo de visita estruturado. Intenção primeiro, burocracia quando for preciso.",
    },
    intentLedger: [
      {
        kicker: "01 · Para morar",
        title: "Explore imóveis verificados para alugar ou comprar",
        body: "Filtre por zona, preço e estado de gestão. Guarde anúncios, peça visitas e contacte proprietários — tudo a partir da sua conta HenryCo.",
      },
      {
        kicker: "02 · Para possuir sem operar",
        title: "Explorar imóveis sob gestão",
        body: "A HenryCo continua a operar carteiras selecionadas após a mudança: visitas, triagem, manutenção e reporte ao proprietário num único registo.",
      },
      {
        kicker: "03 · Para anunciar ou confiar",
        title: "Submeter um imóvel para análise",
        body: "Pensado para proprietários e agentes. Os contactos chegam à sua caixa HenryCo; o suporte sob gestão está disponível se quiser que a HenryCo assuma a operação.",
      },
    ],
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
      areasCoveredEmptyHint: "As zonas abrem à medida que o inventário passa a revisão",
      managedPortfolioLabel: "Carteira sob gestão",
      managedPipelineTemplate: "{pipeline} em pipeline · {value} {suffix}",
      managedPipelinePartialTemplate: "{pipeline} em pipeline · {setupLabel}",
      managedUnderManagementSuffix: "NGN sob gestão",
      managedValueUnderSetup: "valor em configuração",
      pendingReviewLabel: "Em análise",
      pendingReviewHint: "Anúncios em moderação antes de ficarem públicos",
      refineSearchLabel: "Refinar a pesquisa",
    },
    featuredEmpty: {
      eyebrow: "Superfície em destaque · análise em curso",
      body: "O carrossel em destaque está intencionalmente vazio enquanto o inventário passa a moderação. Os novos anúncios são analisados pela qualidade, verificação do proprietário e postura de confiança antes de serem elevados aqui.",
      browseCta: "Ver todos os anúncios",
      submitCta: "Submeter um imóvel",
    },
    areasTable: {
      headerArea: "Zona",
      headerAvgRent: "Renda média · ano",
      headerAvgSale: "Venda média",
      headerLive: "Ativos",
      emptyEyebrow: "Zonas em breve",
      emptyBody: "As entradas do registo de zonas aparecem assim que pelo menos um anúncio aprovado entra em moderação. Submeta um imóvel para a zona se tornar visível.",
    },
    managedAside: {
      title: "Registo de imóveis sob gestão",
      activeEngagementsLabel: "Mandatos ativos",
      inPipelineLabel: "Em pipeline",
      combinedValueLabel: "Valor combinado",
      combinedValueHint: "Carteira combinada sob operações de confiança HenryCo",
      footnote: "Reporte ao proprietário, inspeções e coordenação de manutenção correm no mesmo registo da superfície de marketing. Uma única trilha de auditoria.",
    },
    agentsEmpty: {
      eyebrow: "Camada de operador em breve",
      body: "Os gestores de relacionamento aparecem aqui assim que os perfis estiverem verificados. Até lá, os contactos de proprietários seguem diretamente para a mesa imobiliária e um gestor é atribuído durante a análise.",
    },
    closingCta: {
      eyebrow: "Continuar",
      title: "Pesquise no inventário ou submeta um imóvel — o resto do fluxo está num único registo.",
      body: "Anúncios guardados, pedidos de visita, respostas dos proprietários e a eventual passagem para gestão permanecem numa só conta HenryCo. Sem saltar entre portais.",
      browseCta: "Ver todos os anúncios",
      submitCta: "Submeter um imóvel",
    },
  },
};

/* ─── DE partial (native-ui-ready) ─────────────────────────────────── */
const DE: DeepPartial<PropertyPublicCopy> = {
  home: {
    trustStrip: {
      vetted: "Geprüfte Inserate · Verifizierte Eigentümer",
      curatedBeforePublic: "Kuratiert und geprüft vor Veröffentlichung",
      inventoryUnderReview: "Bestand in Prüfung",
      inventoryLabel: "Henry Onyx Property · Bestand",
      listingsLiveTemplate: "{count} aktive Inserate",
    },
    heroPage: {
      title: "Eine Immobilienplattform, die Ihre Zeit, das Inserat und die Arbeit nach dem Einzug respektiert.",
      body: "Kuratierte Mietobjekte, Verkaufsbestand, Gewerbeflächen und gemanagte Objekte — jedes Inserat trägt Vertrauenshinweise, einen verifizierten Eigentümerpfad und einen strukturierten Besichtigungsablauf. Absicht zuerst, Papierkram dann, wenn er gebraucht wird.",
    },
    intentLedger: [
      {
        kicker: "01 · Darin wohnen",
        title: "Geprüfte Wohnungen und Häuser zur Miete oder zum Kauf",
        body: "Filtern nach Gebiet, Preis und Verwaltungsstatus. Inserate speichern, Besichtigungen anfragen, Eigentümer kontaktieren — alles aus Ihrem HenryCo-Konto.",
      },
      {
        kicker: "02 · Besitzen, ohne zu betreiben",
        title: "Verwaltete Objekte durchsuchen",
        body: "HenryCo betreibt ausgewählte Portfolios auch nach dem Einzug weiter: Besichtigungen, Screening, Instandhaltung und Eigentümerberichte auf einem Register.",
      },
      {
        kicker: "03 · Inserieren oder anvertrauen",
        title: "Objekt zur Prüfung einreichen",
        body: "Gebaut für Eigentümer und Makler. Anfragen landen in Ihrem HenryCo-Postfach; Verwaltungsunterstützung ist verfügbar, falls HenryCo den Betrieb übernehmen soll.",
      },
    ],
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
      areasCoveredEmptyHint: "Gebiete werden freigeschaltet, sobald der Bestand die Prüfung passiert",
      managedPortfolioLabel: "Verwaltetes Portfolio",
      managedPipelineTemplate: "{pipeline} in Bearbeitung · {value} {suffix}",
      managedPipelinePartialTemplate: "{pipeline} in Bearbeitung · {setupLabel}",
      managedUnderManagementSuffix: "NGN unter Verwaltung",
      managedValueUnderSetup: "Wert in Vorbereitung",
      pendingReviewLabel: "In Prüfung",
      pendingReviewHint: "Inserate in Moderation, bevor sie öffentlich werden",
      refineSearchLabel: "Suche verfeinern",
    },
    featuredEmpty: {
      eyebrow: "Hervorgehobene Fläche · in Prüfung",
      body: "Die Hervorhebung bleibt bewusst leer, während der Bestand die Moderation durchläuft. Neue Inserate werden auf Qualität, Eigentümerverifikation und Vertrauenshaltung geprüft, bevor sie hier erscheinen.",
      browseCta: "Alle Inserate ansehen",
      submitCta: "Objekt einreichen",
    },
    areasTable: {
      headerArea: "Gebiet",
      headerAvgRent: "Ø Miete · Jahr",
      headerAvgSale: "Ø Verkaufspreis",
      headerLive: "Aktiv",
      emptyEyebrow: "Gebiete in Kürze",
      emptyBody: "Einträge im Gebietsregister erscheinen, sobald mindestens ein freigegebenes Inserat in Moderation steht. Reichen Sie ein Inserat ein, damit das Gebiet sichtbar wird.",
    },
    managedAside: {
      title: "Register der verwalteten Objekte",
      activeEngagementsLabel: "Aktive Mandate",
      inPipelineLabel: "In Bearbeitung",
      combinedValueLabel: "Gesamtwert",
      combinedValueHint: "Kombiniertes Portfolio unter HenryCo-Treuhandbetrieb",
      footnote: "Eigentümerberichte, Inspektionen und Instandhaltungskoordination laufen auf demselben Register wie die Marketingfläche. Ein Prüfpfad.",
    },
    agentsEmpty: {
      eyebrow: "Operator-Schicht erscheint in Kürze",
      body: "Beziehungsmanager erscheinen hier, sobald ihre Profile verifiziert sind. Bis dahin laufen Eigentümeranfragen direkt zur Immobilienabteilung, und während der Prüfung wird ein Manager zugewiesen.",
    },
    closingCta: {
      eyebrow: "Weiter",
      title: "Den Bestand durchsuchen oder ein Objekt einreichen — der Rest des Ablaufs bleibt auf einem Register.",
      body: "Gespeicherte Inserate, Besichtigungsanfragen, Eigentümerantworten und die spätere Übergabe an die Verwaltung bleiben in einem HenryCo-Konto. Kein Portalwechsel.",
      browseCta: "Alle Inserate ansehen",
      submitCta: "Objekt einreichen",
    },
  },
};

/* ─── IT partial (native-ui-ready) ─────────────────────────────────── */
const IT: DeepPartial<PropertyPublicCopy> = {
  home: {
    trustStrip: {
      vetted: "Annunci verificati · Proprietari autenticati",
      curatedBeforePublic: "Selezionati e verificati prima della pubblicazione",
      inventoryUnderReview: "Inventario in revisione",
      inventoryLabel: "Henry Onyx Property · Inventario",
      listingsLiveTemplate: "{count} annunci attivi",
    },
    heroPage: {
      title: "Una piattaforma immobiliare che rispetta il tuo tempo, l’annuncio e il lavoro che segue il trasloco.",
      body: "Affitti selezionati, immobili in vendita, spazi commerciali e immobili gestiti — ogni annuncio porta note di fiducia, un percorso verificato del proprietario e un flusso di visita strutturato. Prima l’intenzione, poi la burocrazia quando serve.",
    },
    intentLedger: [
      {
        kicker: "01 · Per viverci",
        title: "Sfoglia case verificate in affitto o vendita",
        body: "Filtra per zona, prezzo e stato di gestione. Salva annunci, richiedi visite e contatta i proprietari — tutto dal tuo account HenryCo.",
      },
      {
        kicker: "02 · Per possederlo senza gestirlo",
        title: "Sfoglia gli immobili in gestione",
        body: "HenryCo continua a operare portafogli selezionati dopo il trasloco: visite, screening, manutenzione e reportistica al proprietario su un unico registro.",
      },
      {
        kicker: "03 · Per pubblicarlo o affidarlo",
        title: "Invia un immobile per la revisione",
        body: "Pensato per proprietari e agenti. Le richieste arrivano nella tua casella HenryCo; il supporto in gestione è disponibile se vuoi che HenryCo si occupi della parte operativa.",
      },
    ],
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
      areasCoveredEmptyHint: "Le zone si aprono man mano che l’inventario supera la revisione",
      managedPortfolioLabel: "Portafoglio in gestione",
      managedPipelineTemplate: "{pipeline} in pipeline · {value} {suffix}",
      managedPipelinePartialTemplate: "{pipeline} in pipeline · {setupLabel}",
      managedUnderManagementSuffix: "NGN in gestione",
      managedValueUnderSetup: "valore in configurazione",
      pendingReviewLabel: "In attesa di revisione",
      pendingReviewHint: "Annunci in moderazione prima della pubblicazione",
      refineSearchLabel: "Affina la ricerca",
    },
    featuredEmpty: {
      eyebrow: "Superficie in evidenza · revisione in corso",
      body: "La sezione in evidenza resta volutamente vuota mentre l’inventario passa la moderazione. I nuovi annunci vengono esaminati per qualità, verifica del proprietario e postura di fiducia prima di essere promossi qui.",
      browseCta: "Sfoglia tutti gli annunci",
      submitCta: "Invia un immobile",
    },
    areasTable: {
      headerArea: "Zona",
      headerAvgRent: "Affitto medio · anno",
      headerAvgSale: "Vendita media",
      headerLive: "Attivi",
      emptyEyebrow: "Zone in apertura",
      emptyBody: "Le voci del registro delle zone compaiono non appena almeno un annuncio approvato entra in moderazione. Invia un annuncio perché la zona diventi visibile.",
    },
    managedAside: {
      title: "Registro degli immobili in gestione",
      activeEngagementsLabel: "Mandati attivi",
      inPipelineLabel: "In pipeline",
      combinedValueLabel: "Valore complessivo",
      combinedValueHint: "Portafoglio combinato sotto le operazioni di fiducia HenryCo",
      footnote: "Reportistica al proprietario, ispezioni e coordinamento della manutenzione corrono sullo stesso registro della superficie marketing. Una sola traccia di audit.",
    },
    agentsEmpty: {
      eyebrow: "Livello operatore in arrivo",
      body: "I responsabili relazione compaiono qui non appena i profili sono verificati. Nel frattempo, le richieste dei proprietari vanno direttamente all’ufficio immobiliare e un responsabile viene assegnato durante la revisione.",
    },
    closingCta: {
      eyebrow: "Continua",
      title: "Cerca nell’inventario o invia un immobile — il resto del flusso resta su un unico registro.",
      body: "Annunci salvati, richieste di visita, risposte dei proprietari e l’eventuale passaggio in gestione restano in un unico account HenryCo. Niente salti tra portali.",
      browseCta: "Sfoglia tutti gli annunci",
      submitCta: "Invia un immobile",
    },
  },
};

/* ─── AR partial (native-ui-ready, RTL) ────────────────────────────── */
const AR: DeepPartial<PropertyPublicCopy> = {
  home: {
    trustStrip: {
      vetted: "إعلانات مدققة · مالكون موثّقون",
      curatedBeforePublic: "منتقاة ومدققة قبل النشر",
      inventoryUnderReview: "المخزون قيد المراجعة",
      inventoryLabel: "Henry Onyx Property · مخزون",
      listingsLiveTemplate: "{count} إعلانات نشطة",
    },
    heroPage: {
      title: "منصة عقارية تحترم وقتك، الإعلان، والعمل الذي يأتي بعد الانتقال.",
      body: "إيجارات منتقاة، عقارات للبيع، مساحات تجارية، ووحدات تحت الإدارة — كل إعلان يحمل ملاحظات ثقة، مساراً موثّقاً للمالك، وتدفق معاينة منظماً. النية أولاً، والأوراق عند الحاجة.",
    },
    intentLedger: [
      {
        kicker: "01 · للسكن فيه",
        title: "تصفّح وحدات مدققة للإيجار أو البيع",
        body: "صفّ حسب المنطقة والسعر وحالة الإدارة. احفظ الإعلانات، اطلب المعاينات، وتواصل مع المالكين — كل ذلك من حسابك في HenryCo.",
      },
      {
        kicker: "02 · للتملك دون التشغيل",
        title: "تصفّح العقارات المُدارة",
        body: "تواصل HenryCo تشغيل محافظ مختارة بعد الانتقال: المعاينات، الفرز، الصيانة، وتقارير الملاك على سجل واحد.",
      },
      {
        kicker: "03 · لإعلانه أو تكليف إدارته",
        title: "أرسل عقاراً للمراجعة",
        body: "مصمم للملاك والوكلاء. تصل الاستفسارات إلى صندوقك في HenryCo؛ الدعم المُدار متاح إذا أردت أن تتولى HenryCo الجانب التشغيلي.",
      },
    ],
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
      areasCoveredEmptyHint: "تُفتح المناطق مع اجتياز المخزون للمراجعة",
      managedPortfolioLabel: "المحفظة المُدارة",
      managedPipelineTemplate: "{pipeline} قيد المعالجة · {value} {suffix}",
      managedPipelinePartialTemplate: "{pipeline} قيد المعالجة · {setupLabel}",
      managedUnderManagementSuffix: "NGN تحت الإدارة",
      managedValueUnderSetup: "القيمة قيد الإعداد",
      pendingReviewLabel: "بانتظار المراجعة",
      pendingReviewHint: "إعلانات تجتاز الإشراف قبل أن تصبح علنية",
      refineSearchLabel: "حسّن البحث",
    },
    featuredEmpty: {
      eyebrow: "المساحة المميزة · مراجعة جارية",
      body: "المسار المميز يبقى فارغاً عمداً ريثما يجتاز المخزون الإشراف. تُراجع الإعلانات الجديدة من حيث الجودة، وتوثيق المالك، وموقف الثقة قبل ترقيتها هنا.",
      browseCta: "تصفّح جميع الإعلانات",
      submitCta: "أرسل عقاراً",
    },
    areasTable: {
      headerArea: "المنطقة",
      headerAvgRent: "متوسط الإيجار · سنوياً",
      headerAvgSale: "متوسط البيع",
      headerLive: "نشط",
      emptyEyebrow: "مناطق ستُفتح قريباً",
      emptyBody: "تظهر إدخالات سجل المناطق فور أن يدخل إعلان معتمد واحد على الأقل إلى الإشراف. أرسل إعلاناً لتساعد المنطقة على الظهور.",
    },
    managedAside: {
      title: "سجل العقارات المُدارة",
      activeEngagementsLabel: "تكليفات نشطة",
      inPipelineLabel: "قيد المعالجة",
      combinedValueLabel: "القيمة المجمّعة",
      combinedValueHint: "محفظة مجمّعة تحت عمليات الثقة في HenryCo",
      footnote: "تقارير الملاك والمعاينات وتنسيق الصيانة تجري على نفس السجل الذي تجري عليه واجهة التسويق. أثر تدقيق واحد.",
    },
    agentsEmpty: {
      eyebrow: "طبقة المشغّل ستُنشر قريباً",
      body: "يظهر مديرو العلاقات هنا فور التحقق من ملفاتهم. حتى ذلك الحين، توجَّه استفسارات الملاك مباشرة إلى مكتب العقارات ويُعيَّن مدير أثناء المراجعة.",
    },
    closingCta: {
      eyebrow: "متابعة",
      title: "ابحث في المخزون أو أرسل عقاراً — بقية المسار على سجل واحد.",
      body: "الإعلانات المحفوظة وطلبات المعاينة وردود الملاك والانتقال اللاحق إلى الإدارة تبقى في حساب HenryCo واحد. دون التنقل بين بوابات.",
      browseCta: "تصفّح جميع الإعلانات",
      submitCta: "أرسل عقاراً",
    },
  },
};

/* ─── ZH partial (native-quality manual) ───────────────────────────── */
const ZH: DeepPartial<PropertyPublicCopy> = {
  home: {
    trustStrip: {
      vetted: "审核房源 · 实名业主",
      curatedBeforePublic: "上线前完成精选与审核",
      inventoryUnderReview: "房源审核中",
      inventoryLabel: "Henry Onyx Property · 房源库",
      listingsLiveTemplate: "{count} 套在线房源",
    },
    heroPage: {
      title: "一个尊重您的时间、尊重每一份房源、也尊重入住之后实际工作的房产平台。",
      body: "精选出租、出售房源、商业空间与托管物业——每一套房源都附带信任备注、可核验的业主路径以及结构化的看房流程。先意图,再文书。",
    },
    intentLedger: [
      {
        kicker: "01 · 自住",
        title: "浏览经审核的出租与出售房源",
        body: "按区域、价格、托管状态筛选。收藏房源、申请看房、联系业主——一切都在您的 HenryCo 账户中完成。",
      },
      {
        kicker: "02 · 持有但不亲自打理",
        title: "浏览托管物业",
        body: "HenryCo 在入住之后继续运营选定的房产组合:看房、筛选、维修与业主报告均在同一账本上完成。",
      },
      {
        kicker: "03 · 出租或委托管理",
        title: "提交房源以供审核",
        body: "为业主与中介而设。咨询将直接进入您的 HenryCo 收件箱;如希望 HenryCo 接管运营,可启用托管支持。",
      },
    ],
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
      areasCoveredEmptyHint: "房源通过审核后,相应区域将逐步开放",
      managedPortfolioLabel: "托管组合",
      managedPipelineTemplate: "{pipeline} 个进行中 · {value} {suffix}",
      managedPipelinePartialTemplate: "{pipeline} 个进行中 · {setupLabel}",
      managedUnderManagementSuffix: "NGN 托管资产",
      managedValueUnderSetup: "估值筹备中",
      pendingReviewLabel: "待审房源",
      pendingReviewHint: "正在通过审核、即将公开发布的房源",
      refineSearchLabel: "细化搜索",
    },
    featuredEmpty: {
      eyebrow: "精选展位 · 审核中",
      body: "在房源完成审核之前,精选展位会有意保持空缺。新房源需通过质量、业主验证与信任态势审核,方可在此展出。",
      browseCta: "浏览全部房源",
      submitCta: "提交房源",
    },
    areasTable: {
      headerArea: "区域",
      headerAvgRent: "年均租金",
      headerAvgSale: "均价",
      headerLive: "在线",
      emptyEyebrow: "区域即将开放",
      emptyBody: "当至少一套已批准的房源进入审核,该区域的账本条目即会出现。提交房源即可帮助该区域显现。",
    },
    managedAside: {
      title: "托管物业账本",
      activeEngagementsLabel: "进行中的委托",
      inPipelineLabel: "推进中",
      combinedValueLabel: "合计资产",
      combinedValueHint: "由 HenryCo 信托运营管理的合计组合",
      footnote: "业主报告、巡检与维修协调与营销面板共用同一账本。仅有一条审计轨迹。",
    },
    agentsEmpty: {
      eyebrow: "运营层即将上线",
      body: "关系经理在档案完成核验后会在此呈现。在此之前,业主咨询将直达房产前台,并在审核期间分配经理对接。",
    },
    closingCta: {
      eyebrow: "继续",
      title: "搜索房源或提交一套房源——后续流程都在同一账本上。",
      body: "收藏的房源、看房请求、业主回复以及后续的托管交接,都保留在同一个 HenryCo 账户中。无需在多个平台之间跳转。",
      browseCta: "浏览全部房源",
      submitCta: "提交房源",
    },
  },
};

/* ─── HI partial (scaffold, native Hindi) ──────────────────────────── */
const HI: DeepPartial<PropertyPublicCopy> = {
  home: {
    trustStrip: {
      vetted: "जाँची-परखी लिस्टिंग · सत्यापित मालिक",
      curatedBeforePublic: "सार्वजनिक होने से पहले चयनित और जाँची गई",
      inventoryUnderReview: "इन्वेंटरी समीक्षाधीन",
      inventoryLabel: "Henry Onyx Property · इन्वेंटरी",
      listingsLiveTemplate: "{count} लाइव लिस्टिंग",
    },
    heroPage: {
      title: "एक प्रॉपर्टी प्लेटफ़ॉर्म जो आपके समय, लिस्टिंग और मूव-इन के बाद के काम — सबका सम्मान करता है।",
      body: "चयनित किराये, बिक्री, व्यावसायिक स्पेस और मैनेज्ड होम — हर लिस्टिंग में ट्रस्ट नोट्स, सत्यापित मालिक का रास्ता और संरचित विज़िट फ़्लो होता है। पहले इरादा, ज़रूरत पड़ने पर कागज़ी काम।",
    },
    intentLedger: [
      {
        kicker: "01 · रहने के लिए",
        title: "जाँचे-परखे किराये और बिक्री के घर देखें",
        body: "इलाक़े, क़ीमत और मैनेजमेंट स्टेटस से फ़िल्टर करें। लिस्टिंग सहेजें, विज़िट माँगें, मालिकों को मैसेज करें — सब आपके HenryCo अकाउंट से।",
      },
      {
        kicker: "02 · ख़रीदारी, संचालन की झंझट के बिना",
        title: "मैनेज्ड प्रॉपर्टी ब्राउज़ करें",
        body: "मूव-इन के बाद भी HenryCo चुनिंदा पोर्टफ़ोलियो को चलाती है: विज़िट, स्क्रीनिंग, मेंटेनेंस और ओनर रिपोर्ट — एक ही लेजर पर।",
      },
      {
        kicker: "03 · लिस्ट करें या सौंपें",
        title: "समीक्षा के लिए प्रॉपर्टी सबमिट करें",
        body: "मालिकों और एजेंट्स के लिए बनाई गई। पूछताछ आपके HenryCo इनबॉक्स में आती है; अगर संचालन HenryCo को सौंपना हो तो मैनेज्ड सपोर्ट उपलब्ध है।",
      },
    ],
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
      areasCoveredEmptyHint: "जैसे-जैसे इन्वेंटरी समीक्षा पास करती है, इलाक़े खुलते हैं",
      managedPortfolioLabel: "मैनेज्ड पोर्टफ़ोलियो",
      managedPipelineTemplate: "{pipeline} पाइपलाइन में · {value} {suffix}",
      managedPipelinePartialTemplate: "{pipeline} पाइपलाइन में · {setupLabel}",
      managedUnderManagementSuffix: "NGN प्रबंधन में",
      managedValueUnderSetup: "मूल्य सेटअप जारी",
      pendingReviewLabel: "समीक्षा में",
      pendingReviewHint: "सार्वजनिक होने से पहले मॉडरेशन से गुज़र रही लिस्टिंग",
      refineSearchLabel: "खोज को बेहतर बनाएँ",
    },
    featuredEmpty: {
      eyebrow: "फ़ीचर्ड सरफ़ेस · समीक्षा जारी",
      body: "जब तक इन्वेंटरी मॉडरेशन पास नहीं करती, फ़ीचर्ड रेल जान-बूझकर ख़ाली रहती है। नई लिस्टिंग की गुणवत्ता, मालिक सत्यापन और ट्रस्ट पॉश्चर की जाँच होती है, फिर ही यहाँ लाई जाती हैं।",
      browseCta: "सारी लिस्टिंग देखें",
      submitCta: "प्रॉपर्टी सबमिट करें",
    },
    areasTable: {
      headerArea: "इलाक़ा",
      headerAvgRent: "औसत किराया · सालाना",
      headerAvgSale: "औसत बिक्री",
      headerLive: "लाइव",
      emptyEyebrow: "इलाक़े जल्द खुलेंगे",
      emptyBody: "जब कम से कम एक स्वीकृत लिस्टिंग मॉडरेशन में आती है, तो इलाक़े का लेजर एंट्री दिखती है। इलाक़े को दिखाने में मदद के लिए लिस्टिंग सबमिट करें।",
    },
    managedAside: {
      title: "मैनेज्ड प्रॉपर्टी लेजर",
      activeEngagementsLabel: "सक्रिय कार्यभार",
      inPipelineLabel: "पाइपलाइन में",
      combinedValueLabel: "संयुक्त मूल्य",
      combinedValueHint: "HenryCo ट्रस्ट ऑपरेशंस के तहत संयुक्त पोर्टफ़ोलियो",
      footnote: "ओनर रिपोर्टिंग, इंस्पेक्शन और मेंटेनेंस कोऑर्डिनेशन — सब उसी लेजर पर चलते हैं जिस पर मार्केटिंग सरफ़ेस। एक ही ऑडिट ट्रेल।",
    },
    agentsEmpty: {
      eyebrow: "ऑपरेटर लेयर जल्द प्रकाशित",
      body: "रिलेशनशिप मैनेजर तभी यहाँ दिखते हैं जब उनके प्रोफ़ाइल सत्यापित हो जाते हैं। तब तक मालिकों की पूछताछ सीधे प्रॉपर्टी डेस्क पर जाती है और समीक्षा के दौरान एक मैनेजर नियुक्त होता है।",
    },
    closingCta: {
      eyebrow: "जारी रखें",
      title: "इन्वेंटरी खोजें या प्रॉपर्टी सबमिट करें — बाक़ी फ़्लो एक ही लेजर पर है।",
      body: "सहेजी गई लिस्टिंग, विज़िट रिक्वेस्ट, मालिकों के जवाब और बाद में मैनेज्ड हैंडऑफ़ — सब एक ही HenryCo अकाउंट में रहते हैं। पोर्टल बदलने की ज़रूरत नहीं।",
      browseCta: "सारी लिस्टिंग देखें",
      submitCta: "प्रॉपर्टी सबमिट करें",
    },
  },
};

/* ─── IG partial (Igbo — Lagos/Onitsha-natural) ────────────────────── */
const IG: DeepPartial<PropertyPublicCopy> = {
  home: {
    trustStrip: {
      vetted: "Ndepụta a nyochara · Ndị nwe ya akwadoro",
      curatedBeforePublic: "Họpụtara, nyochaa tupu ọ pụta n’ihu ọha",
      inventoryUnderReview: "Ngwongwo na nyocha",
      inventoryLabel: "Henry Onyx Property · Ngwongwo",
      listingsLiveTemplate: "Ndepụta {count} dị ndụ",
    },
    heroPage: {
      title: "Ikpo okwu ụlọ na-akwanyere oge gị, ndepụta ahụ, na ọrụ na-esote mgbe ị banyere ugwu.",
      body: "Mgbazinye ahọpụtara, ụlọ a na-ere, ebe azụmaahịa, na ụlọ a na-elekọta — ndepụta ọ bụla na-eburu akụkọ ntụkwasị obi, ụzọ ezi onye nwe, na usoro nleta ahaziri ahazi. Ebumnobi buru ụzọ, akwụkwọ esote.",
    },
    intentLedger: [
      {
        kicker: "01 · Maka ibi n’ime ya",
        title: "Chọgharịa ụlọ a nyochara maka mgbazinye ma ọ bụ ire",
        body: "Họrọ site na mpaghara, ọnụahịa, na ọnọdụ nlekọta. Chekwaa ndepụta, rịọ nleta, ziga ozi nye ndị nwe — niile n’akaụntụ HenryCo gị.",
      },
      {
        kicker: "02 · Inwe ya n’enweghị ịrụ ọrụ ya",
        title: "Chọgharịa ụlọ a na-elekọta",
        body: "HenryCo na-aga n’ihu na-arụ ọrụ akpa ahọpụtara mgbe i banyere ugwu: nleta, nyocha, mmezi, na mkpesa ndị nwe n’otu akwụkwọ ndekọ aha.",
      },
      {
        kicker: "03 · Idepụta ma ọ bụ inyefe ya",
        title: "Nyefee ụlọ maka nyocha",
        body: "Emepụtara maka ndị nwe na ndị nnọchi anya. Ajụjụ na-eruba na igbe ozi HenryCo gị; nkwado nlekọta dị ma ọ bụrụ na ị chọrọ ka HenryCo lebara akụkụ ọrụ anya.",
      },
    ],
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
      areasCoveredEmptyHint: "Mpaghara na-emeghe ka ngwongwo na-agafe nyocha",
      managedPortfolioLabel: "Akpa a na-elekọta",
      managedPipelineTemplate: "{pipeline} dị na mpịakọta · {value} {suffix}",
      managedPipelinePartialTemplate: "{pipeline} dị na mpịakọta · {setupLabel}",
      managedUnderManagementSuffix: "NGN n’okpuru nlekọta",
      managedValueUnderSetup: "uru ka na-edozi",
      pendingReviewLabel: "Na-eche nyocha",
      pendingReviewHint: "Ndepụta na-agafe nlekọta tupu ọ pụta n’ihu ọha",
      refineSearchLabel: "Mezie nchọcha",
    },
    featuredEmpty: {
      eyebrow: "Ebe pụtara ìhè · nyocha na-aga",
      body: "Ebe ahụ pụtara ìhè na-anọrọ tọgbọrọ chakoo n’uche ka ngwongwo na-agafe nlekọta. A na-elele ndepụta ọhụrụ maka àgwà, nkwenye onye nwe, na ọnọdụ ntụkwasị obi tupu e bulie ha ebe a.",
      browseCta: "Chọgharịa ndepụta niile",
      submitCta: "Nyefee ụlọ",
    },
    areasTable: {
      headerArea: "Mpaghara",
      headerAvgRent: "Mgbazinye nkezi · n’afọ",
      headerAvgSale: "Ọnụahịa ire nkezi",
      headerLive: "Dị ndụ",
      emptyEyebrow: "Mpaghara na-emepe n’oge na-adịghị anya",
      emptyBody: "Ihe ndekọ mpaghara na-apụta naanị mgbe otu ndepụta akwadoro batara na nlekọta. Nyefee ndepụta ka mpaghara wee bido ipụta.",
    },
    managedAside: {
      title: "Akwụkwọ ndekọ ụlọ a na-elekọta",
      activeEngagementsLabel: "Ọrụ na-aga n’ihu",
      inPipelineLabel: "Na mpịakọta",
      combinedValueLabel: "Uru kpokọtara",
      combinedValueHint: "Akpa kpokọtara n’okpuru ọrụ ntụkwasị obi nke HenryCo",
      footnote: "Mkpesa ndị nwe, nyocha, na nhazi mmezi na-agba n’otu akwụkwọ ndekọ ahụ na ihu ahịa azụmaahịa. Otu ụzọ nyocha.",
    },
    agentsEmpty: {
      eyebrow: "Ọkwa ndị na-arụ ọrụ ga-apụta n’oge na-adịghị anya",
      body: "Ndị na-elekọta mmekọrịta na-apụta ebe a mgbe akwadoro profaịlụ ha. N’oge ahụ, ajụjụ ndị nwe na-aga ozugbo n’ụlọ ọrụ ụlọ ma a họpụta onye nlekọta n’oge nyocha.",
    },
    closingCta: {
      eyebrow: "Gaa n’ihu",
      title: "Chọọ na ngwongwo ma ọ bụ nyefee ụlọ — usoro fọdụrụ dị n’otu akwụkwọ ndekọ.",
      body: "Ndepụta echekwara, arịrịọ nleta, azịza ndị nwe, na nyefe nlekọta ga-abịa n’ihu — niile na-anọrọ n’otu akaụntụ HenryCo. Enweghị ịgafe site n’otu ọnụ ụzọ gaa ọzọ.",
      browseCta: "Chọgharịa ndepụta niile",
      submitCta: "Nyefee ụlọ",
    },
  },
};

/* ─── YO partial (Yorùbá — Lagos-natural) ──────────────────────────── */
const YO: DeepPartial<PropertyPublicCopy> = {
  home: {
    trustStrip: {
      vetted: "Àwọn àkọsílẹ̀ tí a yẹ̀wò · Onílé tí a fọwọ́sí",
      curatedBeforePublic: "A yan, a yẹ̀wò ṣáájú kí ó tó wá síta",
      inventoryUnderReview: "Àkójọ ní àyẹ̀wò",
      inventoryLabel: "Henry Onyx Property · Àkójọ",
      listingsLiveTemplate: "Àkọsílẹ̀ {count} ń lọ́wọ́",
    },
    heroPage: {
      title: "Pẹpẹ ohun-ìní tí ó bọ̀wọ̀ fún àkókò rẹ, àkọsílẹ̀ náà, àti iṣẹ́ tí ó wà lẹ́yìn tí o bá ti kó wọlé.",
      body: "Àwọn ilé àyàá tí a yan, ilé tí à ń tà, àyè òwò, àti ilé tí a ń ṣàkóso — gbogbo àkọsílẹ̀ ní àkíyèsí ìgbẹ́kẹ̀lé, ọ̀nà onílé tí a fọwọ́sí, àti àkànṣe ìbẹ̀wò tí ó wà létòlétò. Èrò wá ṣáájú, ìwé wá nígbà tí o bá nílò rẹ̀.",
    },
    intentLedger: [
      {
        kicker: "01 · Láti gbé inú rẹ̀",
        title: "Wo àwọn ilé tí a yẹ̀wò — àyàá tàbí ìtà",
        body: "Yan nípa àdúgbò, owó, àti ipò ìṣàkóso. Tọju àwọn àkọsílẹ̀, béèrè fún ìbẹ̀wò, fi ọ̀rọ̀ ránṣẹ́ sí onílé — gbogbo rẹ̀ láti inú àkáǹtì HenryCo rẹ.",
      },
      {
        kicker: "02 · Láti ní láìṣe gbogbo iṣẹ́ rẹ̀",
        title: "Wo ilé tí a ń ṣàkóso",
        body: "HenryCo ń bá àwọn àkójọ tí a yan ṣiṣẹ́ lẹ́yìn tí o bá kó wọlé: ìbẹ̀wò, àyẹ̀wò, ìtọ́jú, àti ìròyìn fún onílé — gbogbo rẹ̀ lórí ìwé kan.",
      },
      {
        kicker: "03 · Láti ṣe àkọsílẹ̀ tàbí láti gbé e lé wa lọ́wọ́",
        title: "Fi ohun-ìní hàn fún àyẹ̀wò",
        body: "A ṣe é fún onílé àti aṣojú. Ìbéèrè máa wọ inú àpótí ọ̀rọ̀ HenryCo rẹ; ìtìlẹ́yìn ìṣàkóso wà tí o bá fẹ́ kí HenryCo gba ojúṣe iṣẹ́ náà.",
      },
    ],
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
      areasCoveredEmptyHint: "Àwọn àdúgbò máa ṣí bí àkójọ ṣe ń kọjá àyẹ̀wò",
      managedPortfolioLabel: "Àkójọ ìṣàkóso",
      managedPipelineTemplate: "{pipeline} ní ìlà · {value} {suffix}",
      managedPipelinePartialTemplate: "{pipeline} ní ìlà · {setupLabel}",
      managedUnderManagementSuffix: "NGN labẹ́ ìṣàkóso",
      managedValueUnderSetup: "iye ní ìmúrasílẹ̀",
      pendingReviewLabel: "Ń dúró àyẹ̀wò",
      pendingReviewHint: "Àkọsílẹ̀ ń kọjá àfìpapadà ṣáájú kí ó tó wá síta",
      refineSearchLabel: "Ṣe àtúnṣe wíwá",
    },
    featuredEmpty: {
      eyebrow: "Ojú-ìwé pàtàkì · àyẹ̀wò ń lọ",
      body: "Pẹpẹ pàtàkì máa wà ní òfìfo bí àkójọ ṣe ń kọjá àfìpapadà. A ń ṣàyẹ̀wò àkọsílẹ̀ tuntun fún ìjẹ́jẹ́, ìfọwọ́sí onílé, àti ìgbẹ́kẹ̀lé ṣáájú kí a tó gbé e sókè síbí.",
      browseCta: "Wo gbogbo àkọsílẹ̀",
      submitCta: "Fi ohun-ìní hàn",
    },
    areasTable: {
      headerArea: "Àdúgbò",
      headerAvgRent: "Owó àyàá ìpíndọ́gba · ọdún",
      headerAvgSale: "Owó ìtà ìpíndọ́gba",
      headerLive: "Ń lọ́wọ́",
      emptyEyebrow: "Àwọn àdúgbò ń bọ̀",
      emptyBody: "Àwọn ìjápọ̀ àdúgbò máa fi ara wọn hàn nígbà tí ó kéré jù bí àkọsílẹ̀ kan tí a fọwọ́sí bá wọ inú àfìpapadà. Fi àkọsílẹ̀ hàn láti ràn àdúgbò lọ́wọ́ láti yọ jáde.",
    },
    managedAside: {
      title: "Ìwé ìṣàkóso ohun-ìní",
      activeEngagementsLabel: "Iṣẹ́ ń lọ́wọ́",
      inPipelineLabel: "Ní ìlà",
      combinedValueLabel: "Iye gbogbogbò",
      combinedValueHint: "Àkójọ gbogbogbò labẹ́ iṣẹ́ ìgbẹ́kẹ̀lé HenryCo",
      footnote: "Ìròyìn onílé, àyẹ̀wò, àti ìtọ́jú ìtọ́sọ́nà ń lọ lórí ìwé kan náà pẹ̀lú ojú-ìwé tita. Ọ̀nà àyẹ̀wò kan ṣoṣo.",
    },
    agentsEmpty: {
      eyebrow: "Ipele aṣojú máa jáde láìpẹ́",
      body: "Àwọn aṣojú ìbáṣepọ̀ máa farahàn níbí nígbà tí àwọn àkọsílẹ̀ wọn bá ti gba ìfọwọ́sí. Títí di ìgbà náà, àwọn ìbéèrè onílé máa lọ tààrà sí àpótí ohun-ìní, a sì máa yan aṣojú nígbà àyẹ̀wò.",
    },
    closingCta: {
      eyebrow: "Tẹ̀síwájú",
      title: "Wá nínú àkójọ tàbí fi ohun-ìní hàn — ìyókù gbogbo rẹ̀ wà lórí ìwé kan.",
      body: "Àkọsílẹ̀ tí a tọju, ìbéèrè ìbẹ̀wò, ìdáhùn onílé, àti ìfàséhìn ìṣàkóso máa wà nínú àkáǹtì HenryCo kan ṣoṣo. Kò sí ìfò láàrín àwọn ojú-ìwé.",
      browseCta: "Wo gbogbo àkọsílẹ̀",
      submitCta: "Fi ohun-ìní hàn",
    },
  },
};

/* ─── HA partial (Hausa — Kano/Abuja-natural) ──────────────────────── */
const HA: DeepPartial<PropertyPublicCopy> = {
  home: {
    trustStrip: {
      vetted: "Tallace-tallace da aka tantance · Masu mallaka da aka tabbatar",
      curatedBeforePublic: "An zaɓa, an tantance kafin a fito a fili",
      inventoryUnderReview: "Ana sake duba kayan",
      inventoryLabel: "Henry Onyx Property · Kaya",
      listingsLiveTemplate: "Tallace-tallace {count} suna kunne",
    },
    heroPage: {
      title: "Dandali na kadara mai mutunta lokacin ku, talla, da aikin da yake bayan an shiga gida.",
      body: "Hayar gidaje da aka zaɓa, gidajen sayarwa, wuraren kasuwanci, da gidajen da ake sarrafa — kowane talla yana ɗauke da bayanan amincewa, hanyar mai gida tabbatacciya, da tsarin ziyara tsararre. Niyya da farko, takardu sa’ad da ake bukata.",
    },
    intentLedger: [
      {
        kicker: "01 · Don zama a ciki",
        title: "Bincika gidaje tantattu na haya ko sayarwa",
        body: "Tace ta yanki, farashi, da matsayin sarrafawa. Adana tallace-tallace, nemi ziyara, aika saƙo ga masu gida — duka daga asusun HenryCo naka.",
      },
      {
        kicker: "02 · Mallaka ba tare da gudanarwa ba",
        title: "Bincika gidajen da ake sarrafa",
        body: "HenryCo na ci gaba da gudanar da zaɓaɓɓun ƙungiyoyi bayan an shiga: ziyara, gwaji, gyara, da rahoton mai gida a kan littafi ɗaya.",
      },
      {
        kicker: "03 · Sanya talla ko ba da amana",
        title: "Mika kadara don bita",
        body: "An gina shi don masu gida da wakilai. Tambayoyi suna shiga akwatin saƙon HenryCo naka; goyon bayan sarrafawa yana nan idan kana son HenryCo ya ɗauki bangaren aiki.",
      },
    ],
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
      areasCoveredEmptyHint: "Yankuna na buɗewa yayin da kayan ke wuce bita",
      managedPortfolioLabel: "Ƙungiyar sarrafawa",
      managedPipelineTemplate: "{pipeline} a bututu · {value} {suffix}",
      managedPipelinePartialTemplate: "{pipeline} a bututu · {setupLabel}",
      managedUnderManagementSuffix: "NGN a ƙarƙashin sarrafawa",
      managedValueUnderSetup: "ƙimar tana shiri",
      pendingReviewLabel: "Ana jiran bita",
      pendingReviewHint: "Tallace-tallace na wucewa daga kulawa kafin su bayyana ga jama’a",
      refineSearchLabel: "Inganta bincike",
    },
    featuredEmpty: {
      eyebrow: "Wuri na musamman · ana bita",
      body: "Layin na musamman zai kasance babu komai da gangan yayin da kayan ke wuce kulawa. Ana bita sabbin tallace-tallace don inganci, tabbatar da mai gida, da matsayin amincewa kafin a ɗaga su nan.",
      browseCta: "Duba duk tallace-tallace",
      submitCta: "Mika kadara",
    },
    areasTable: {
      headerArea: "Yanki",
      headerAvgRent: "Matsakaicin haya · shekara",
      headerAvgSale: "Matsakaicin sayarwa",
      headerLive: "Kunne",
      emptyEyebrow: "Yankuna za su buɗe nan ba da daɗewa ba",
      emptyBody: "Bayanin yankin yana bayyana sa’ad da aƙalla talla ɗaya da aka amince da ita ta shiga bita. Mika talla don taimaka wa yankin ya bayyana.",
    },
    managedAside: {
      title: "Littafin gidajen da ake sarrafa",
      activeEngagementsLabel: "Ayyukan aiki",
      inPipelineLabel: "A bututu",
      combinedValueLabel: "Jimillar ƙima",
      combinedValueHint: "Haɗaɗɗiyar ƙungiya a ƙarƙashin ayyukan amincewa na HenryCo",
      footnote: "Rahoton mai gida, dubawa, da gudanar da gyara suna gudana a kan littafi ɗaya da fuskar tallace-tallace. Hanyar bita ɗaya.",
    },
    agentsEmpty: {
      eyebrow: "Tsarin masu aiki zai bayyana nan ba da daɗewa ba",
      body: "Manajan dangantaka suna bayyana a nan sa’ad da aka tabbatar da bayanan martabar su. Har sai lokacin, tambayoyin masu gida suna zuwa kai tsaye zuwa teburin kadara kuma ana ba da manajan a lokacin bita.",
    },
    closingCta: {
      eyebrow: "Ci gaba",
      title: "Bincika kayan ko ka mika kadara — sauran tsarin yana kan littafi ɗaya.",
      body: "Tallace-tallace da aka adana, buƙatun ziyara, amsoshin masu gida, da daga ƙarshe miƙa wa sarrafawa — duka suna zama a asusu ɗaya na HenryCo. Ba sai an tsalle tsakanin tashoshi ba.",
      browseCta: "Duba duk tallace-tallace",
      submitCta: "Mika kadara",
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
