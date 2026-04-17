import type { AppLocale } from "@henryco/i18n/server";

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
    heroKicker: "HenryCo Property",
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
      "HenryCo Property is designed to market, qualify, coordinate, and then keep operating selected properties through owner reporting, inspections, maintenance coordination, and ongoing trust services.",
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
      { label: "Live listings", hint: "Public inventory currently available on HenryCo Property." },
      { label: "Managed portfolio", hint: "Active managed-property records tracked in HenryCo operations." },
      { label: "Viewing pipeline", hint: "Open viewing requests currently being scheduled or confirmed." },
    ],
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

const FR: PropertyPublicCopy = {
  home: {
    heroKicker: "HenryCo Property",
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
      "HenryCo Property est conçu pour commercialiser, qualifier, coordonner puis poursuivre l’exploitation de biens sélectionnés via le reporting propriétaire, les inspections, la coordination de maintenance et les services de confiance.",
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
      { label: "Annonces actives", hint: "Inventaire public actuellement disponible sur HenryCo Property." },
      { label: "Portefeuille géré", hint: "Dossiers de gestion actifs suivis dans les opérations HenryCo." },
      { label: "Flux de visites", hint: "Demandes de visite ouvertes actuellement planifiées ou confirmées." },
    ],
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

const LOCALE_COPY: Partial<Record<AppLocale, PropertyPublicCopy>> = {
  fr: FR,
};

export function getPropertyPublicCopy(locale: AppLocale): PropertyPublicCopy {
  return LOCALE_COPY[locale] ?? EN;
}
