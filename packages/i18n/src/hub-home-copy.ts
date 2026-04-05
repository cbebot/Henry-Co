import type { AppLocale } from "./locales";
import { DEFAULT_LOCALE } from "./locales";
import { deepMergeMessages } from "./merge-messages";

export type HubNavLink = { label: string; href: string };

export type HubHomeCopy = {
  nav: {
    featured: string;
    directory: string;
    company: string;
    faq: string;
    about: string;
    contact: string;
  };
  companyPages: {
    about: string;
    contact: string;
    privacy: string;
    terms: string;
  };
  status: { active: string; comingSoon: string; paused: string };
  hero: {
    badgeBefore: string;
    badgeAfter: string;
    titleBefore: string;
    titleAfter: string;
    ctaExplore: string;
    ctaFeatured: string;
  };
  introDefault: string;
  brandPanel: {
    eyebrow: string;
    baseDomain: string;
    accent: string;
    logoStatus: string;
    logoConfigured: string;
    logoFallback: string;
  };
  stats: {
    divisions: string;
    activeNow: string;
    comingSoon: string;
    sectors: string;
  };
  standardCard: {
    eyebrow: string;
    title: string;
    bullets: string[];
    latestUpdate: string;
    operatingStandard: string;
    operatingStandardValue: string;
    spotlightEyebrow: string;
    spotlightFallback: string;
    featured: string;
    viewDetails: string;
    visitDivision: string;
    serverError: string;
  };
  premiumRow: {
    discovery: { eyebrow: string; title: string; text: string };
    corporate: { eyebrow: string; title: string; text: string };
    scale: { eyebrow: string; title: string; text: string };
  };
  featuredSection: {
    eyebrow: string;
    title: string;
    body: string;
    viewDirectory: string;
  };
  directory: {
    eyebrow: string;
    title: string;
    body: string;
    searchPlaceholder: string;
    clearSearchAria: string;
    popularSectors: string;
    featuredOn: string;
    featuredOff: string;
    allCategories: string;
    filterAll: string;
    filterActive: string;
    filterSoon: string;
    filterPaused: string;
    showing: string;
    total: string;
    featured: string;
    overviewEyebrow: string;
    clearAll: string;
    ready: string;
    activeRefinements: string;
    lastUpdated: string;
    companyPagesEyebrow: string;
    empty: string;
  };
  ecosystem: {
    eyebrow: string;
    title: string;
    body: string;
    bullets: string[];
    big: [string, string, string];
    bigText: [string, string, string];
  };
  access: {
    eyebrow: string;
    title: string;
    body: string;
    ctaPages: string;
    ctaDirectory: string;
    cards: [string, string, string];
    cardValues: [string, string, string];
  };
  faq: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  topBar: { search: string; explore: string };
  footer: {
    exploreDivisions: string;
    companyPages: string;
    colHub: string;
    colGlobal: string;
  };
  cards: {
    divisionFallbackLong: string;
    divisionFallbackShort: string;
    destination: string;
    notConfigured: string;
    openDivision: string;
    divisionDestination: string;
    lead: string;
    details: string;
    open: string;
    featured: string;
  };
  modal: {
    closeAria: string;
    enterDivision: string;
    kpiStatus: string;
    kpiSubdomain: string;
    kpiFeatured: string;
    kpiUpdated: string;
    kpiYes: string;
    kpiNo: string;
    who: string;
    how: string;
    trust: string;
    highlights: string;
    leadEyebrow: string;
    leadFallbackTitle: string;
    links: string;
  };
  faqFallback: { q: string; a: string }[];
};

const HUB_HOME_COPY_EN: HubHomeCopy = {
  nav: {
    featured: "Featured",
    directory: "Directory",
    company: "Company",
    faq: "FAQ",
    about: "About",
    contact: "Contact",
  },
  companyPages: {
    about: "About Henry & Co.",
    contact: "Contact the company",
    privacy: "Privacy notice",
    terms: "Terms & conditions",
  },
  status: {
    active: "Active",
    comingSoon: "Coming soon",
    paused: "Paused",
  },
  hero: {
    badgeBefore: "Premium company network • press ",
    badgeAfter: " to search",
    titleBefore: "Explore the businesses, services, and operating divisions of ",
    titleAfter: ".",
    ctaExplore: "Explore all divisions",
    ctaFeatured: "View featured divisions",
  },
  introDefault:
    "Henry & Co. brings together focused businesses under one respected group identity. This hub helps customers, partners, and stakeholders understand the company, locate the right division, and move forward with confidence.",
  brandPanel: {
    eyebrow: "Company brand system",
    baseDomain: "Base domain",
    accent: "Accent",
    logoStatus: "Logo status",
    logoConfigured: "Configured",
    logoFallback: "Fallback mark",
  },
  stats: {
    divisions: "Divisions",
    activeNow: "Active now",
    comingSoon: "Coming soon",
    sectors: "Service sectors",
  },
  standardCard: {
    eyebrow: "Group standard",
    title: "A unified standard across every division.",
    bullets: [
      "Each division operates with its own market focus while reflecting the standards of the wider Henry & Co. group.",
      "The company hub helps visitors understand where to go, who to engage, and how the group is organized.",
      "As the company expands, new divisions can be introduced inside one clear and credible structure.",
      "The result is a stronger public presence, better navigation, and a more professional experience at every touchpoint.",
    ],
    latestUpdate: "Latest company update",
    operatingStandard: "Operating standard",
    operatingStandardValue: "Consistent and maintained",
    spotlightEyebrow: "Current spotlight",
    spotlightFallback:
      "A featured Henry & Co. division representing the group with clarity and focus.",
    featured: "Featured",
    viewDetails: "View details",
    visitDivision: "Visit division",
    serverError: "Some information is currently being refreshed.",
  },
  premiumRow: {
    discovery: {
      eyebrow: "Discovery",
      title: "Direct people to the right business",
      text: "The hub removes ambiguity, strengthens confidence, and helps every visitor reach the most relevant Henry & Co. division without confusion.",
    },
    corporate: {
      eyebrow: "Corporate presence",
      title: "Present the group with maturity",
      text: "This public layer supports company reputation, clearer communication, and a stronger group-level identity across every market-facing touchpoint.",
    },
    scale: {
      eyebrow: "Scalability",
      title: "Built for growth and continuity",
      text: "As the group grows, new businesses and corporate pages can be introduced inside the same premium framework without weakening consistency.",
    },
  },
  featuredSection: {
    eyebrow: "Featured divisions",
    title: "Selected divisions currently representing the group",
    body: "These businesses currently serve as key public entry points into the Henry & Co. group.",
    viewDirectory: "View full directory",
  },
  directory: {
    eyebrow: "Directory",
    title: "Locate the right Henry & Co. business",
    body: "Search by division name, category, service emphasis, or business focus. This directory exists to help people move quickly and confidently to the right part of the company.",
    searchPlaceholder: "Search divisions, services, categories, subdomains…",
    clearSearchAria: "Clear search",
    popularSectors: "Popular sectors",
    featuredOn: "Showing featured only",
    featuredOff: "Limit to featured",
    allCategories: "All categories",
    filterAll: "All",
    filterActive: "Active",
    filterSoon: "Coming soon",
    filterPaused: "Paused",
    showing: "Showing",
    total: "Total",
    featured: "Featured",
    overviewEyebrow: "Directory overview",
    clearAll: "Clear all",
    ready: "Ready",
    activeRefinements: "Active refinements",
    lastUpdated: "Last updated",
    companyPagesEyebrow: "Company-level pages",
    empty: "No matching divisions were found. Clear your filters or broaden the search criteria.",
  },
  ecosystem: {
    eyebrow: "Why this matters",
    title: "A clearer company presence creates trust before the first conversation",
    body: "A well-structured corporate hub helps audiences understand the scope of the company, the relationship between its divisions, and the level of professionalism behind every service.",
    bullets: [
      "Stronger brand confidence across all public touchpoints.",
      "More efficient routing for customers, partners, and stakeholders.",
      "A better foundation for future businesses, campaigns, and announcements.",
      "A credible base for company, media, and investor-facing communication.",
    ],
    big: [
      "Independent business units",
      "Corporate-grade presentation",
      "Prepared for long-term growth",
    ],
    bigText: [
      "Each division can grow through its own workflows, public pages, and commercial direction while remaining aligned with the parent company.",
      "The group can communicate with greater maturity, stronger trust signals, and clearer positioning across markets and audiences.",
      "As new divisions and public initiatives are introduced, the company can continue expanding without compromising consistency.",
    ],
  },
  access: {
    eyebrow: "Company access",
    title: "Everything starts with a clearer first impression",
    body: "Whether someone is discovering the company for the first time or returning to work with a specific division, the hub provides a clear, polished pathway into the wider Henry & Co. group.",
    ctaPages: "Explore company pages",
    ctaDirectory: "View the directory",
    cards: ["Company standard", "Customer navigation", "Brand confidence"],
    cardValues: [
      "Consistent and professional",
      "Clear and guided",
      "Premium public presence",
    ],
  },
  faq: {
    eyebrow: "Frequently asked",
    title: "Frequently asked questions",
    subtitle:
      "These answers help customers, partners, and stakeholders understand how the company works before they need to reach out.",
  },
  topBar: {
    search: "Search hub",
    explore: "Explore",
  },
  footer: {
    exploreDivisions: "Explore divisions",
    companyPages: "Company pages",
    colHub: "Company hub",
    colGlobal: "Global pages",
  },
  cards: {
    divisionFallbackLong:
      "A public-facing Henry & Co. division built to serve a focused market with clarity and premium presentation.",
    divisionFallbackShort:
      "A focused Henry & Co. division presented as an independent operating brand inside the wider company ecosystem.",
    destination: "Destination",
    notConfigured: "Not configured yet",
    openDivision: "Open division",
    divisionDestination: "Division destination",
    lead: "Lead",
    details: "Details",
    open: "Open",
    featured: "Featured",
  },
  modal: {
    closeAria: "Close",
    enterDivision: "Enter division",
    kpiStatus: "Status",
    kpiSubdomain: "Subdomain",
    kpiFeatured: "Featured",
    kpiUpdated: "Updated",
    kpiYes: "Yes",
    kpiNo: "No",
    who: "Who it serves",
    how: "How it works",
    trust: "Why clients choose it",
    highlights: "Highlights",
    leadEyebrow: "Division lead",
    leadFallbackTitle: "Leadership profile",
    links: "Links",
  },
  faqFallback: [
    {
      q: "Can I go directly to a division without starting from this page?",
      a: "Yes. Each division may still be accessed directly through its own destination. This hub exists to make the wider company easier to understand and to help visitors reach the right business more quickly.",
    },
    {
      q: "Will additional divisions appear here as the company grows?",
      a: "Yes. As Henry & Co. expands, new divisions can be introduced through the same company framework so the public experience remains clear, consistent, and well organized.",
    },
    {
      q: "Who is this website designed for?",
      a: "The hub serves customers, partners, suppliers, media, talent, and stakeholders who need a clearer view of the Henry & Co. group and its operating businesses.",
    },
    {
      q: "What company pages should I review first?",
      a: "The best starting points are the About, Contact, Privacy Notice, and Terms & Conditions pages. Together, they provide a clearer view of the company, its standards, and its public policies.",
    },
  ],
};

const HUB_HOME_COPY_FR: Partial<HubHomeCopy> = {
  nav: {
    featured: "À la une",
    directory: "Annuaire",
    company: "Entreprise",
    faq: "FAQ",
    about: "À propos",
    contact: "Contact",
  },
  companyPages: {
    about: "À propos de Henry & Co.",
    contact: "Contacter l’entreprise",
    privacy: "Notice de confidentialité",
    terms: "Conditions générales",
  },
  status: {
    active: "Actif",
    comingSoon: "Bientôt",
    paused: "En pause",
  },
  hero: {
    badgeBefore: "Réseau d’entreprises premium • appuyez sur ",
    badgeAfter: " pour rechercher",
    titleBefore: "Explorez les activités, services et divisions opérationnelles de ",
    titleAfter: ".",
    ctaExplore: "Explorer toutes les divisions",
    ctaFeatured: "Voir les divisions à la une",
  },
  introDefault:
    "Henry & Co. réunit des entreprises ciblées sous une identité de groupe respectée. Ce hub aide clients, partenaires et parties prenantes à comprendre le groupe, à trouver la bonne division et à avancer sereinement.",
  brandPanel: {
    eyebrow: "Système de marque",
    baseDomain: "Domaine de base",
    accent: "Couleur d’accent",
    logoStatus: "État du logo",
    logoConfigured: "Configuré",
    logoFallback: "Marque de secours",
  },
  stats: {
    divisions: "Divisions",
    activeNow: "Actives",
    comingSoon: "Bientôt",
    sectors: "Secteurs de service",
  },
  standardCard: {
    eyebrow: "Standard groupe",
    title: "Un standard unifié pour chaque division.",
    bullets: [
      "Chaque division conserve son marché tout en reflétant les standards du groupe Henry & Co.",
      "Le hub aide à comprendre où aller, avec qui échanger et comment le groupe est organisé.",
      "À mesure que l’entreprise grandit, de nouvelles divisions s’intègrent dans une structure claire et crédible.",
      "Résultat : une présence publique plus forte, une navigation plus simple et une expérience plus professionnelle.",
    ],
    latestUpdate: "Dernière mise à jour",
    operatingStandard: "Standard opérationnel",
    operatingStandardValue: "Cohérent et maintenu",
    spotlightEyebrow: "Focus actuel",
    spotlightFallback:
      "Une division Henry & Co. mise en avant avec clarté et exigence.",
    featured: "À la une",
    viewDetails: "Voir les détails",
    visitDivision: "Visiter la division",
    serverError: "Certaines informations sont en cours de mise à jour.",
  },
  premiumRow: {
    discovery: {
      eyebrow: "Découverte",
      title: "Orientez chacun vers le bon métier",
      text: "Le hub réduit l’ambiguïté, renforce la confiance et aide chaque visiteur à rejoindre la division Henry & Co. la plus pertinente.",
    },
    corporate: {
      eyebrow: "Présence corporate",
      title: "Présenter le groupe avec maturité",
      text: "Cette couche publique soutient la réputation, clarifie la communication et renforce l’identité groupe sur tous les points de contact.",
    },
    scale: {
      eyebrow: "Évolutivité",
      title: "Pensé pour la croissance",
      text: "Quand le groupe s’étend, de nouvelles activités et pages s’ajoutent dans le même cadre premium sans perdre en cohérence.",
    },
  },
  featuredSection: {
    eyebrow: "Divisions à la une",
    title: "Divisions sélectionnées pour représenter le groupe",
    body: "Ces activités sont aujourd’hui des entrées clés vers le groupe Henry & Co.",
    viewDirectory: "Voir l’annuaire complet",
  },
  directory: {
    eyebrow: "Annuaire",
    title: "Trouvez la bonne activité Henry & Co.",
    body: "Recherchez par nom, catégorie, service ou focus métier. L’annuaire aide à aller vite et sûrement vers la bonne partie du groupe.",
    searchPlaceholder: "Rechercher divisions, services, catégories, sous-domaines…",
    clearSearchAria: "Effacer la recherche",
    popularSectors: "Secteurs populaires",
    featuredOn: "Uniquement à la une",
    featuredOff: "Limiter à la une",
    allCategories: "Toutes les catégories",
    filterAll: "Tout",
    filterActive: "Actif",
    filterSoon: "Bientôt",
    filterPaused: "En pause",
    showing: "Affichées",
    total: "Total",
    featured: "À la une",
    overviewEyebrow: "Vue d’ensemble",
    clearAll: "Tout effacer",
    ready: "Prêt",
    activeRefinements: "Filtres actifs",
    lastUpdated: "Dernière mise à jour",
    companyPagesEyebrow: "Pages groupe",
    empty: "Aucune division ne correspond. Réinitialisez les filtres ou élargissez la recherche.",
  },
  ecosystem: {
    eyebrow: "Pourquoi c’est important",
    title: "Une présence plus claire crée la confiance avant le premier échange",
    body: "Un hub corporate bien structuré aide à comprendre l’ampleur du groupe, les liens entre divisions et le niveau d’exigence derrière chaque service.",
    bullets: [
      "Confiance de marque renforcée sur tous les points de contact.",
      "Routage plus efficace pour clients, partenaires et parties prenantes.",
      "Meilleure base pour futures activités, campagnes et annonces.",
      "Socle crédible pour communication corporate, médias et investisseurs.",
    ],
    big: [
      "Unités commerciales indépendantes",
      "Présentation de niveau corporate",
      "Prêt pour la croissance long terme",
    ],
    bigText: [
      "Chaque division évolue avec ses propres flux, pages publiques et direction commerciale tout en restant alignée avec la maison mère.",
      "Le groupe communique avec plus de maturité, des signaux de confiance plus nets et un positionnement plus lisible.",
      "Les nouvelles divisions et initiatives s’intègrent sans rompre la cohérence d’ensemble.",
    ],
  },
  access: {
    eyebrow: "Accès entreprise",
    title: "Tout commence par une première impression plus claire",
    body: "Que l’on découvre le groupe ou que l’on revienne vers une division précise, le hub offre un parcours net et soigné vers l’ensemble Henry & Co.",
    ctaPages: "Explorer les pages entreprise",
    ctaDirectory: "Voir l’annuaire",
    cards: ["Standard groupe", "Navigation client", "Confiance de marque"],
    cardValues: ["Cohérent et professionnel", "Claire et guidée", "Présence publique premium"],
  },
  faq: {
    eyebrow: "Questions fréquentes",
    title: "Questions fréquentes",
    subtitle:
      "Ces réponses aident clients, partenaires et parties prenantes à comprendre le fonctionnement du groupe avant de vous écrire.",
  },
  topBar: {
    search: "Rechercher",
    explore: "Explorer",
  },
  footer: {
    exploreDivisions: "Explorer les divisions",
    companyPages: "Pages entreprise",
    colHub: "Hub entreprise",
    colGlobal: "Pages globales",
  },
  cards: {
    divisionFallbackLong:
      "Une division Henry & Co. tournée vers un marché précis, avec clarté et exigence.",
    divisionFallbackShort:
      "Une division Henry & Co. présentée comme une marque autonome au sein de l’écosystème groupe.",
    destination: "Destination",
    notConfigured: "Pas encore configuré",
    openDivision: "Ouvrir la division",
    divisionDestination: "Destination de la division",
    lead: "Référent",
    details: "Détails",
    open: "Ouvrir",
    featured: "À la une",
  },
  modal: {
    closeAria: "Fermer",
    enterDivision: "Entrer dans la division",
    kpiStatus: "Statut",
    kpiSubdomain: "Sous-domaine",
    kpiFeatured: "À la une",
    kpiUpdated: "Mis à jour",
    kpiYes: "Oui",
    kpiNo: "Non",
    who: "Pour qui",
    how: "Comment ça marche",
    trust: "Pourquoi les clients choisissent",
    highlights: "Points forts",
    leadEyebrow: "Référent division",
    leadFallbackTitle: "Profil de direction",
    links: "Liens",
  },
  faqFallback: [
    {
      q: "Puis-je aller directement sur une division sans passer par cette page ?",
      a: "Oui. Chaque division reste accessible directement. Ce hub clarifie l’ensemble du groupe et aide à rejoindre plus vite la bonne activité.",
    },
    {
      q: "D’autres divisions apparaîtront-elles quand l’entreprise grandit ?",
      a: "Oui. À mesure que Henry & Co. se développe, de nouvelles divisions s’intègrent dans le même cadre pour garder une expérience publique claire et cohérente.",
    },
    {
      q: "À qui s’adresse ce site ?",
      a: "Le hub sert clients, partenaires, fournisseurs, médias, talents et parties prenantes qui veulent une vision plus nette du groupe et de ses activités.",
    },
    {
      q: "Quelles pages lire en premier ?",
      a: "Commencez par À propos, Contact, Confidentialité et Conditions. Ensemble, elles expliquent le groupe, ses standards et ses politiques publiques.",
    },
  ],
};

export function getHubHomeCopy(locale: AppLocale): HubHomeCopy {
  if (locale === "fr") {
    return deepMergeMessages(
      HUB_HOME_COPY_EN as unknown as Record<string, unknown>,
      HUB_HOME_COPY_FR as unknown as Record<string, unknown>
    ) as unknown as HubHomeCopy;
  }
  return HUB_HOME_COPY_EN;
}

export function getFaqFallbackForLocale(locale: AppLocale): { q: string; a: string }[] {
  return getHubHomeCopy(locale).faqFallback;
}

/** @internal */
export function __dangerouslyGetEnglishHubHomeCopy(): HubHomeCopy {
  return HUB_HOME_COPY_EN;
}
