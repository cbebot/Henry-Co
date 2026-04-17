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

const HUB_HOME_COPY_ES: Partial<HubHomeCopy> = {
  nav: {
    featured: "Destacados",
    directory: "Directorio",
    company: "Empresa",
    faq: "FAQ",
    about: "Acerca de",
    contact: "Contacto",
  },
  companyPages: {
    about: "Acerca de Henry & Co.",
    contact: "Contactar con la empresa",
    privacy: "Aviso de privacidad",
    terms: "Términos y condiciones",
  },
  status: {
    active: "Activo",
    comingSoon: "Próximamente",
    paused: "En pausa",
  },
  hero: {
    badgeBefore: "Red de empresas premium • presiona ",
    badgeAfter: " para buscar",
    titleBefore: "Explora los negocios, servicios y divisiones operativas de ",
    titleAfter: ".",
    ctaExplore: "Explorar todas las divisiones",
    ctaFeatured: "Ver divisiones destacadas",
  },
  introDefault:
    "Henry & Co. reúne negocios enfocados bajo una identidad de grupo reconocida. Este hub ayuda a clientes, socios y partes interesadas a comprender la empresa, encontrar la división correcta y avanzar con confianza.",
  brandPanel: {
    eyebrow: "Sistema de marca corporativa",
    baseDomain: "Dominio base",
    accent: "Acento",
    logoStatus: "Estado del logo",
    logoConfigured: "Configurado",
    logoFallback: "Marca de respaldo",
  },
  stats: {
    divisions: "Divisiones",
    activeNow: "Activas ahora",
    comingSoon: "Próximamente",
    sectors: "Sectores de servicio",
  },
  standardCard: {
    eyebrow: "Estándar del grupo",
    title: "Un estándar unificado en cada división.",
    bullets: [
      "Cada división opera con su propio enfoque de mercado mientras refleja los estándares del grupo Henry & Co.",
      "El hub de la empresa ayuda a los visitantes a saber adónde ir, con quién relacionarse y cómo está organizado el grupo.",
      "A medida que la empresa crece, se pueden introducir nuevas divisiones dentro de una estructura clara y creíble.",
      "El resultado es una presencia pública más sólida, mejor navegación y una experiencia más profesional en cada punto de contacto.",
    ],
    latestUpdate: "Última actualización corporativa",
    operatingStandard: "Estándar operativo",
    operatingStandardValue: "Consistente y mantenido",
    spotlightEyebrow: "Destacado actual",
    spotlightFallback:
      "Una división destacada de Henry & Co. que representa al grupo con claridad y enfoque.",
    featured: "Destacado",
    viewDetails: "Ver detalles",
    visitDivision: "Visitar división",
    serverError: "Parte de la información se está actualizando.",
  },
  premiumRow: {
    discovery: {
      eyebrow: "Descubrimiento",
      title: "Dirige a las personas hacia el negocio correcto",
      text: "El hub elimina la ambigüedad, refuerza la confianza y ayuda a cada visitante a llegar a la división de Henry & Co. más relevante sin confusión.",
    },
    corporate: {
      eyebrow: "Presencia corporativa",
      title: "Presenta el grupo con madurez",
      text: "Esta capa pública apoya la reputación de la empresa, una comunicación más clara y una identidad de grupo más sólida en cada punto de contacto.",
    },
    scale: {
      eyebrow: "Escalabilidad",
      title: "Construido para el crecimiento y la continuidad",
      text: "A medida que el grupo crece, se pueden introducir nuevos negocios y páginas corporativas dentro del mismo marco premium sin debilitar la consistencia.",
    },
  },
  featuredSection: {
    eyebrow: "Divisiones destacadas",
    title: "Divisiones seleccionadas que representan al grupo",
    body: "Estos negocios sirven actualmente como puntos de entrada públicos clave al grupo Henry & Co.",
    viewDirectory: "Ver directorio completo",
  },
  directory: {
    eyebrow: "Directorio",
    title: "Encuentra el negocio de Henry & Co. adecuado",
    body: "Busca por nombre de división, categoría, énfasis de servicio o enfoque de negocio. Este directorio existe para ayudar a las personas a moverse rápida y confiadamente hacia la parte correcta de la empresa.",
    searchPlaceholder: "Buscar divisiones, servicios, categorías, subdominios…",
    clearSearchAria: "Limpiar búsqueda",
    popularSectors: "Sectores populares",
    featuredOn: "Mostrando solo destacados",
    featuredOff: "Limitar a destacados",
    allCategories: "Todas las categorías",
    filterAll: "Todos",
    filterActive: "Activo",
    filterSoon: "Próximamente",
    filterPaused: "En pausa",
    showing: "Mostrando",
    total: "Total",
    featured: "Destacado",
    overviewEyebrow: "Vista del directorio",
    clearAll: "Limpiar todo",
    ready: "Listo",
    activeRefinements: "Filtros activos",
    lastUpdated: "Última actualización",
    companyPagesEyebrow: "Páginas corporativas",
    empty: "No se encontraron divisiones que coincidan. Limpia los filtros o amplía los criterios de búsqueda.",
  },
  ecosystem: {
    eyebrow: "Por qué importa",
    title: "Una presencia empresarial más clara genera confianza antes de la primera conversación",
    body: "Un hub corporativo bien estructurado ayuda a los públicos a entender el alcance de la empresa, la relación entre sus divisiones y el nivel de profesionalismo detrás de cada servicio.",
    bullets: [
      "Mayor confianza de marca en todos los puntos de contacto públicos.",
      "Enrutamiento más eficiente para clientes, socios y partes interesadas.",
      "Una mejor base para futuros negocios, campañas y anuncios.",
      "Una base creíble para comunicación corporativa, medios e inversores.",
    ],
    big: [
      "Unidades de negocio independientes",
      "Presentación de nivel corporativo",
      "Preparado para el crecimiento a largo plazo",
    ],
    bigText: [
      "Cada división puede crecer a través de sus propios flujos de trabajo, páginas públicas y dirección comercial mientras permanece alineada con la empresa matriz.",
      "El grupo puede comunicarse con mayor madurez, señales de confianza más sólidas y un posicionamiento más claro en todos los mercados y públicos.",
      "A medida que se introducen nuevas divisiones e iniciativas públicas, la empresa puede seguir expandiéndose sin comprometer la consistencia.",
    ],
  },
  access: {
    eyebrow: "Acceso empresarial",
    title: "Todo comienza con una primera impresión más clara",
    body: "Ya sea que alguien esté descubriendo la empresa por primera vez o regresando para trabajar con una división específica, el hub proporciona un camino claro y pulido hacia el grupo Henry & Co.",
    ctaPages: "Explorar páginas corporativas",
    ctaDirectory: "Ver el directorio",
    cards: ["Estándar corporativo", "Navegación del cliente", "Confianza de marca"],
    cardValues: [
      "Consistente y profesional",
      "Clara y guiada",
      "Presencia pública premium",
    ],
  },
  faq: {
    eyebrow: "Preguntas frecuentes",
    title: "Preguntas frecuentes",
    subtitle:
      "Estas respuestas ayudan a clientes, socios y partes interesadas a entender cómo funciona la empresa antes de ponerse en contacto.",
  },
  topBar: {
    search: "Buscar",
    explore: "Explorar",
  },
  footer: {
    exploreDivisions: "Explorar divisiones",
    companyPages: "Páginas corporativas",
    colHub: "Hub corporativo",
    colGlobal: "Páginas globales",
  },
  cards: {
    divisionFallbackLong:
      "Una división de Henry & Co. orientada al público, construida para servir a un mercado enfocado con claridad y presentación premium.",
    divisionFallbackShort:
      "Una división enfocada de Henry & Co. presentada como una marca operativa independiente dentro del ecosistema del grupo.",
    destination: "Destino",
    notConfigured: "Aún no configurado",
    openDivision: "Abrir división",
    divisionDestination: "Destino de la división",
    lead: "Responsable",
    details: "Detalles",
    open: "Abrir",
    featured: "Destacado",
  },
  modal: {
    closeAria: "Cerrar",
    enterDivision: "Entrar a la división",
    kpiStatus: "Estado",
    kpiSubdomain: "Subdominio",
    kpiFeatured: "Destacado",
    kpiUpdated: "Actualizado",
    kpiYes: "Sí",
    kpiNo: "No",
    who: "A quién sirve",
    how: "Cómo funciona",
    trust: "Por qué los clientes lo eligen",
    highlights: "Destacados",
    leadEyebrow: "Responsable de división",
    leadFallbackTitle: "Perfil de liderazgo",
    links: "Enlaces",
  },
  faqFallback: [
    {
      q: "¿Puedo ir directamente a una división sin comenzar desde esta página?",
      a: "Sí. Cada división puede seguir siendo accedida directamente a través de su propio destino. Este hub existe para hacer más fácil entender la empresa y ayudar a los visitantes a llegar al negocio correcto más rápidamente.",
    },
    {
      q: "¿Aparecerán divisiones adicionales aquí a medida que la empresa crezca?",
      a: "Sí. A medida que Henry & Co. se expande, se pueden introducir nuevas divisiones a través del mismo marco corporativo para que la experiencia pública siga siendo clara, consistente y bien organizada.",
    },
    {
      q: "¿Para quién está diseñado este sitio web?",
      a: "El hub sirve a clientes, socios, proveedores, medios, talento y partes interesadas que necesitan una visión más clara del grupo Henry & Co. y sus negocios operativos.",
    },
    {
      q: "¿Qué páginas corporativas debo revisar primero?",
      a: "Los mejores puntos de partida son las páginas Acerca de, Contacto, Aviso de Privacidad y Términos y Condiciones. Juntas, proporcionan una visión más clara de la empresa, sus estándares y sus políticas públicas.",
    },
  ],
};

const HUB_HOME_COPY_PT: Partial<HubHomeCopy> = {
  nav: {
    featured: "Destaques",
    directory: "Diretório",
    company: "Empresa",
    faq: "FAQ",
    about: "Sobre",
    contact: "Contato",
  },
  companyPages: {
    about: "Sobre a Henry & Co.",
    contact: "Contatar a empresa",
    privacy: "Aviso de privacidade",
    terms: "Termos e condições",
  },
  status: {
    active: "Ativo",
    comingSoon: "Em breve",
    paused: "Pausado",
  },
  hero: {
    badgeBefore: "Rede de empresas premium • pressione ",
    badgeAfter: " para pesquisar",
    titleBefore: "Explore os negócios, serviços e divisões operacionais da ",
    titleAfter: ".",
    ctaExplore: "Explorar todas as divisões",
    ctaFeatured: "Ver divisões em destaque",
  },
  introDefault:
    "A Henry & Co. reúne negócios focados sob uma identidade de grupo respeitada. Este hub ajuda clientes, parceiros e partes interessadas a entender a empresa, localizar a divisão certa e avançar com confiança.",
  brandPanel: {
    eyebrow: "Sistema de marca corporativa",
    baseDomain: "Domínio base",
    accent: "Destaque",
    logoStatus: "Status do logo",
    logoConfigured: "Configurado",
    logoFallback: "Marca de reserva",
  },
  stats: {
    divisions: "Divisões",
    activeNow: "Ativas agora",
    comingSoon: "Em breve",
    sectors: "Setores de serviço",
  },
  standardCard: {
    eyebrow: "Padrão do grupo",
    title: "Um padrão unificado em cada divisão.",
    bullets: [
      "Cada divisão opera com seu próprio foco de mercado enquanto reflete os padrões do grupo Henry & Co.",
      "O hub da empresa ajuda os visitantes a entender para onde ir, com quem se envolver e como o grupo está organizado.",
      "À medida que a empresa cresce, novas divisões podem ser introduzidas dentro de uma estrutura clara e confiável.",
      "O resultado é uma presença pública mais forte, melhor navegação e uma experiência mais profissional em cada ponto de contato.",
    ],
    latestUpdate: "Última atualização corporativa",
    operatingStandard: "Padrão operacional",
    operatingStandardValue: "Consistente e mantido",
    spotlightEyebrow: "Destaque atual",
    spotlightFallback:
      "Uma divisão de destaque da Henry & Co. representando o grupo com clareza e foco.",
    featured: "Destaque",
    viewDetails: "Ver detalhes",
    visitDivision: "Visitar divisão",
    serverError: "Algumas informações estão sendo atualizadas.",
  },
  premiumRow: {
    discovery: {
      eyebrow: "Descoberta",
      title: "Direcione as pessoas para o negócio certo",
      text: "O hub elimina a ambiguidade, fortalece a confiança e ajuda cada visitante a chegar à divisão mais relevante da Henry & Co. sem confusão.",
    },
    corporate: {
      eyebrow: "Presença corporativa",
      title: "Apresente o grupo com maturidade",
      text: "Esta camada pública apoia a reputação da empresa, uma comunicação mais clara e uma identidade de grupo mais forte em cada ponto de contato.",
    },
    scale: {
      eyebrow: "Escalabilidade",
      title: "Construído para crescimento e continuidade",
      text: "À medida que o grupo cresce, novos negócios e páginas corporativas podem ser introduzidos dentro do mesmo framework premium sem enfraquecer a consistência.",
    },
  },
  featuredSection: {
    eyebrow: "Divisões em destaque",
    title: "Divisões selecionadas representando atualmente o grupo",
    body: "Esses negócios servem atualmente como pontos de entrada públicos chave para o grupo Henry & Co.",
    viewDirectory: "Ver diretório completo",
  },
  directory: {
    eyebrow: "Diretório",
    title: "Encontre o negócio certo da Henry & Co.",
    body: "Pesquise por nome de divisão, categoria, ênfase de serviço ou foco de negócio. Este diretório existe para ajudar as pessoas a se moverem rápida e confiadamente para a parte certa da empresa.",
    searchPlaceholder: "Pesquisar divisões, serviços, categorias, subdomínios…",
    clearSearchAria: "Limpar pesquisa",
    popularSectors: "Setores populares",
    featuredOn: "Mostrando apenas destaques",
    featuredOff: "Limitar a destaques",
    allCategories: "Todas as categorias",
    filterAll: "Todos",
    filterActive: "Ativo",
    filterSoon: "Em breve",
    filterPaused: "Pausado",
    showing: "Mostrando",
    total: "Total",
    featured: "Destaque",
    overviewEyebrow: "Visão do diretório",
    clearAll: "Limpar tudo",
    ready: "Pronto",
    activeRefinements: "Filtros ativos",
    lastUpdated: "Última atualização",
    companyPagesEyebrow: "Páginas corporativas",
    empty: "Nenhuma divisão correspondente foi encontrada. Limpe seus filtros ou amplie os critérios de pesquisa.",
  },
  ecosystem: {
    eyebrow: "Por que isso importa",
    title: "Uma presença empresarial mais clara gera confiança antes da primeira conversa",
    body: "Um hub corporativo bem estruturado ajuda os públicos a entender o alcance da empresa, a relação entre suas divisões e o nível de profissionalismo por trás de cada serviço.",
    bullets: [
      "Maior confiança de marca em todos os pontos de contato públicos.",
      "Roteamento mais eficiente para clientes, parceiros e partes interessadas.",
      "Uma base melhor para futuros negócios, campanhas e anúncios.",
      "Uma base confiável para comunicação corporativa, mídia e investidores.",
    ],
    big: [
      "Unidades de negócio independentes",
      "Apresentação de nível corporativo",
      "Preparado para crescimento de longo prazo",
    ],
    bigText: [
      "Cada divisão pode crescer por meio de seus próprios fluxos de trabalho, páginas públicas e direção comercial enquanto permanece alinhada com a empresa-mãe.",
      "O grupo pode se comunicar com maior maturidade, sinais de confiança mais fortes e um posicionamento mais claro em todos os mercados e públicos.",
      "À medida que novas divisões e iniciativas públicas são introduzidas, a empresa pode continuar se expandindo sem comprometer a consistência.",
    ],
  },
  access: {
    eyebrow: "Acesso corporativo",
    title: "Tudo começa com uma primeira impressão mais clara",
    body: "Seja alguém descobrindo a empresa pela primeira vez ou retornando para trabalhar com uma divisão específica, o hub oferece um caminho claro e refinado para o grupo Henry & Co.",
    ctaPages: "Explorar páginas corporativas",
    ctaDirectory: "Ver o diretório",
    cards: ["Padrão corporativo", "Navegação do cliente", "Confiança de marca"],
    cardValues: [
      "Consistente e profissional",
      "Clara e guiada",
      "Presença pública premium",
    ],
  },
  faq: {
    eyebrow: "Perguntas frequentes",
    title: "Perguntas frequentes",
    subtitle:
      "Estas respostas ajudam clientes, parceiros e partes interessadas a entender como a empresa funciona antes de entrar em contato.",
  },
  topBar: {
    search: "Pesquisar",
    explore: "Explorar",
  },
  footer: {
    exploreDivisions: "Explorar divisões",
    companyPages: "Páginas corporativas",
    colHub: "Hub corporativo",
    colGlobal: "Páginas globais",
  },
  cards: {
    divisionFallbackLong:
      "Uma divisão voltada ao público da Henry & Co. construída para servir um mercado focado com clareza e apresentação premium.",
    divisionFallbackShort:
      "Uma divisão focada da Henry & Co. apresentada como uma marca operacional independente dentro do ecossistema do grupo.",
    destination: "Destino",
    notConfigured: "Ainda não configurado",
    openDivision: "Abrir divisão",
    divisionDestination: "Destino da divisão",
    lead: "Responsável",
    details: "Detalhes",
    open: "Abrir",
    featured: "Destaque",
  },
  modal: {
    closeAria: "Fechar",
    enterDivision: "Entrar na divisão",
    kpiStatus: "Status",
    kpiSubdomain: "Subdomínio",
    kpiFeatured: "Destaque",
    kpiUpdated: "Atualizado",
    kpiYes: "Sim",
    kpiNo: "Não",
    who: "A quem serve",
    how: "Como funciona",
    trust: "Por que os clientes escolhem",
    highlights: "Destaques",
    leadEyebrow: "Responsável da divisão",
    leadFallbackTitle: "Perfil de liderança",
    links: "Links",
  },
  faqFallback: [
    {
      q: "Posso ir diretamente a uma divisão sem começar por esta página?",
      a: "Sim. Cada divisão ainda pode ser acessada diretamente pelo seu próprio destino. Este hub existe para tornar a empresa mais fácil de entender e ajudar os visitantes a chegar ao negócio certo mais rapidamente.",
    },
    {
      q: "Divisões adicionais aparecerão aqui à medida que a empresa crescer?",
      a: "Sim. À medida que a Henry & Co. se expande, novas divisões podem ser introduzidas pelo mesmo framework corporativo para que a experiência pública permaneça clara, consistente e bem organizada.",
    },
    {
      q: "Para quem este site foi projetado?",
      a: "O hub serve clientes, parceiros, fornecedores, mídia, talentos e partes interessadas que precisam de uma visão mais clara do grupo Henry & Co. e seus negócios operacionais.",
    },
    {
      q: "Quais páginas corporativas devo revisar primeiro?",
      a: "Os melhores pontos de partida são as páginas Sobre, Contato, Aviso de Privacidade e Termos e Condições. Juntas, fornecem uma visão mais clara da empresa, seus padrões e suas políticas públicas.",
    },
  ],
};

const HUB_HOME_COPY_AR: Partial<HubHomeCopy> = {
  nav: {
    featured: "المميزة",
    directory: "الدليل",
    company: "الشركة",
    faq: "الأسئلة الشائعة",
    about: "من نحن",
    contact: "اتصل بنا",
  },
  companyPages: {
    about: "عن Henry & Co.",
    contact: "التواصل مع الشركة",
    privacy: "إشعار الخصوصية",
    terms: "الشروط والأحكام",
  },
  status: {
    active: "نشط",
    comingSoon: "قريباً",
    paused: "متوقف",
  },
  hero: {
    badgeBefore: "شبكة شركات متميزة • اضغط ",
    badgeAfter: " للبحث",
    titleBefore: "استكشف الأعمال والخدمات والأقسام التشغيلية لـ ",
    titleAfter: ".",
    ctaExplore: "استكشاف جميع الأقسام",
    ctaFeatured: "عرض الأقسام المميزة",
  },
  introDefault:
    "تجمع Henry & Co. الأعمال المتخصصة تحت هوية مجموعة موثوقة. يساعد هذا المركز العملاء والشركاء وأصحاب المصلحة على فهم الشركة وتحديد القسم المناسب والمضي قدماً بثقة.",
  brandPanel: {
    eyebrow: "نظام علامة الشركة",
    baseDomain: "النطاق الأساسي",
    accent: "اللون المميز",
    logoStatus: "حالة الشعار",
    logoConfigured: "مُهيأ",
    logoFallback: "علامة احتياطية",
  },
  stats: {
    divisions: "الأقسام",
    activeNow: "نشطة الآن",
    comingSoon: "قريباً",
    sectors: "قطاعات الخدمة",
  },
  standardCard: {
    eyebrow: "معيار المجموعة",
    title: "معيار موحد عبر كل قسم.",
    bullets: [
      "يعمل كل قسم بتركيز سوقي خاص به مع عكس معايير مجموعة Henry & Co. الأشمل.",
      "يساعد مركز الشركة الزوار على فهم أين يذهبون ومع من يتفاعلون وكيف ينظم المجموعة.",
      "مع نمو الشركة، يمكن تقديم أقسام جديدة ضمن هيكل واضح وموثوق.",
      "النتيجة هي حضور عام أقوى، وتنقل أفضل، وتجربة أكثر احترافية في كل نقطة تواصل.",
    ],
    latestUpdate: "آخر تحديث للشركة",
    operatingStandard: "المعيار التشغيلي",
    operatingStandardValue: "متسق ومستمر",
    spotlightEyebrow: "الضوء الحالي",
    spotlightFallback:
      "قسم مميز من Henry & Co. يمثل المجموعة بوضوح وتركيز.",
    featured: "مميز",
    viewDetails: "عرض التفاصيل",
    visitDivision: "زيارة القسم",
    serverError: "بعض المعلومات قيد التحديث حالياً.",
  },
  premiumRow: {
    discovery: {
      eyebrow: "الاكتشاف",
      title: "وجّه الناس نحو العمل الصحيح",
      text: "يزيل المركز الغموض ويقوي الثقة ويساعد كل زائر على الوصول إلى قسم Henry & Co. الأكثر ملاءمة دون ارتباك.",
    },
    corporate: {
      eyebrow: "الحضور المؤسسي",
      title: "قدّم المجموعة بنضج",
      text: "تدعم هذه الطبقة العامة سمعة الشركة وتوضح التواصل وتقوي هوية المجموعة عبر كل نقطة تواصل عامة.",
    },
    scale: {
      eyebrow: "قابلية التوسع",
      title: "مبني للنمو والاستمرارية",
      text: "مع نمو المجموعة، يمكن تقديم أعمال جديدة وصفحات مؤسسية ضمن نفس الإطار المتميز دون الإخلال بالاتساق.",
    },
  },
  featuredSection: {
    eyebrow: "الأقسام المميزة",
    title: "أقسام مختارة تمثل المجموعة حالياً",
    body: "تعمل هذه الأعمال حالياً كنقاط دخول عامة رئيسية إلى مجموعة Henry & Co.",
    viewDirectory: "عرض الدليل الكامل",
  },
  directory: {
    eyebrow: "الدليل",
    title: "ابحث عن عمل Henry & Co. المناسب",
    body: "ابحث باسم القسم أو الفئة أو التخصص أو التركيز التجاري. يوجد هذا الدليل لمساعدة الناس على التنقل بسرعة وثقة نحو الجزء المناسب من الشركة.",
    searchPlaceholder: "ابحث في الأقسام والخدمات والفئات والنطاقات الفرعية…",
    clearSearchAria: "مسح البحث",
    popularSectors: "القطاعات الشائعة",
    featuredOn: "عرض المميزة فقط",
    featuredOff: "تحديد المميزة",
    allCategories: "جميع الفئات",
    filterAll: "الكل",
    filterActive: "نشط",
    filterSoon: "قريباً",
    filterPaused: "متوقف",
    showing: "يظهر",
    total: "المجموع",
    featured: "مميز",
    overviewEyebrow: "نظرة عامة على الدليل",
    clearAll: "مسح الكل",
    ready: "جاهز",
    activeRefinements: "المرشحات النشطة",
    lastUpdated: "آخر تحديث",
    companyPagesEyebrow: "صفحات الشركة",
    empty: "لم يتم العثور على أقسام مطابقة. امسح المرشحات أو وسّع معايير البحث.",
  },
  ecosystem: {
    eyebrow: "لماذا هذا مهم",
    title: "حضور مؤسسي أوضح يبني الثقة قبل أول محادثة",
    body: "يساعد مركز مؤسسي منظم جيداً الجماهير على فهم نطاق الشركة والعلاقة بين أقسامها ومستوى الاحترافية خلف كل خدمة.",
    bullets: [
      "ثقة أقوى بالعلامة التجارية عبر جميع نقاط التواصل العامة.",
      "توجيه أكثر كفاءة للعملاء والشركاء وأصحاب المصلحة.",
      "أساس أفضل للأعمال والحملات والإعلانات المستقبلية.",
      "قاعدة موثوقة للتواصل المؤسسي والإعلامي والاستثماري.",
    ],
    big: [
      "وحدات أعمال مستقلة",
      "عرض بمستوى مؤسسي",
      "مستعد للنمو طويل الأمد",
    ],
    bigText: [
      "يمكن لكل قسم أن ينمو من خلال سير عمله الخاص وصفحاته العامة وتوجهه التجاري مع البقاء متوافقاً مع الشركة الأم.",
      "يمكن للمجموعة التواصل بنضج أكبر وإشارات ثقة أقوى وتموضع أوضح عبر الأسواق والجماهير.",
      "مع تقديم أقسام ومبادرات عامة جديدة، يمكن للشركة الاستمرار في التوسع دون المساس بالاتساق.",
    ],
  },
  access: {
    eyebrow: "الوصول المؤسسي",
    title: "كل شيء يبدأ بانطباع أول أوضح",
    body: "سواء كان شخص ما يكتشف الشركة لأول مرة أو يعود للعمل مع قسم محدد، يوفر المركز مساراً واضحاً ومصقولاً إلى مجموعة Henry & Co. الأشمل.",
    ctaPages: "استكشاف صفحات الشركة",
    ctaDirectory: "عرض الدليل",
    cards: ["معيار الشركة", "تنقل العملاء", "ثقة العلامة التجارية"],
    cardValues: [
      "متسق واحترافي",
      "واضح وموجه",
      "حضور عام متميز",
    ],
  },
  faq: {
    eyebrow: "الأسئلة المتكررة",
    title: "الأسئلة الشائعة",
    subtitle:
      "هذه الإجابات تساعد العملاء والشركاء وأصحاب المصلحة على فهم كيفية عمل الشركة قبل التواصل معنا.",
  },
  topBar: {
    search: "بحث",
    explore: "استكشاف",
  },
  footer: {
    exploreDivisions: "استكشاف الأقسام",
    companyPages: "صفحات الشركة",
    colHub: "مركز الشركة",
    colGlobal: "الصفحات العالمية",
  },
  cards: {
    divisionFallbackLong:
      "قسم Henry & Co. المواجه للجمهور مبني لخدمة سوق متخصصة بوضوح وعرض متميز.",
    divisionFallbackShort:
      "قسم متخصص من Henry & Co. مقدم كعلامة تشغيلية مستقلة ضمن نظام بيئي المجموعة الأشمل.",
    destination: "الوجهة",
    notConfigured: "لم يُهيأ بعد",
    openDivision: "فتح القسم",
    divisionDestination: "وجهة القسم",
    lead: "القائد",
    details: "التفاصيل",
    open: "فتح",
    featured: "مميز",
  },
  modal: {
    closeAria: "إغلاق",
    enterDivision: "دخول القسم",
    kpiStatus: "الحالة",
    kpiSubdomain: "النطاق الفرعي",
    kpiFeatured: "مميز",
    kpiUpdated: "محدّث",
    kpiYes: "نعم",
    kpiNo: "لا",
    who: "من يخدم",
    how: "كيف يعمل",
    trust: "لماذا يختاره العملاء",
    highlights: "أبرز المميزات",
    leadEyebrow: "قائد القسم",
    leadFallbackTitle: "الملف القيادي",
    links: "الروابط",
  },
  faqFallback: [
    {
      q: "هل يمكنني الذهاب مباشرة إلى قسم دون البدء من هذه الصفحة؟",
      a: "نعم. يمكن الوصول إلى كل قسم مباشرة عبر وجهته الخاصة. يوجد هذا المركز لتسهيل فهم الشركة الأشمل ومساعدة الزوار على الوصول إلى العمل الصحيح بشكل أسرع.",
    },
    {
      q: "هل ستظهر أقسام إضافية هنا مع نمو الشركة؟",
      a: "نعم. مع توسع Henry & Co.، يمكن تقديم أقسام جديدة من خلال نفس الإطار المؤسسي ليبقى التجربة العامة واضحة ومتسقة ومنظمة.",
    },
    {
      q: "لمن صُمم هذا الموقع؟",
      a: "يخدم المركز العملاء والشركاء والموردين والإعلام والكفاءات وأصحاب المصلحة الذين يحتاجون إلى رؤية أوضح لمجموعة Henry & Co. وأعمالها التشغيلية.",
    },
    {
      q: "ما صفحات الشركة التي يجب مراجعتها أولاً؟",
      a: "أفضل نقاط البداية هي صفحات من نحن والاتصال وإشعار الخصوصية والشروط والأحكام. معاً توفر رؤية أوضح للشركة ومعاييرها وسياساتها العامة.",
    },
  ],
};

const HUB_HOME_LOCALE_MAP: Partial<Record<AppLocale, Partial<HubHomeCopy>>> = {
  fr: HUB_HOME_COPY_FR,
  es: HUB_HOME_COPY_ES,
  pt: HUB_HOME_COPY_PT,
  ar: HUB_HOME_COPY_AR,
};

export function getHubHomeCopy(locale: AppLocale): HubHomeCopy {
  const overrides = HUB_HOME_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      HUB_HOME_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>
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
