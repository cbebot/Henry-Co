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
  nav: { featured: "Destacados", directory: "Directorio", company: "Empresa", faq: "FAQ", about: "Acerca de", contact: "Contacto" },
  companyPages: { about: "Acerca de Henry & Co.", contact: "Contactar con la empresa", privacy: "Aviso de privacidad", terms: "Términos y condiciones" },
  status: { active: "Activo", comingSoon: "Próximamente", paused: "En pausa" },
  hero: {
    badgeBefore: "Red de empresas premium • presiona ",
    badgeAfter: " para buscar",
    titleBefore: "Explora los negocios, servicios y divisiones operativas de ",
    titleAfter: ".",
    ctaExplore: "Explorar todas las divisiones",
    ctaFeatured: "Ver divisiones destacadas",
  },
  introDefault: "Henry & Co. reúne negocios enfocados bajo una identidad de grupo reconocida. Este hub ayuda a clientes, socios y partes interesadas a comprender la empresa, encontrar la división correcta y avanzar con confianza.",
  brandPanel: { eyebrow: "Sistema de marca corporativa", baseDomain: "Dominio base", accent: "Acento", logoStatus: "Estado del logo", logoConfigured: "Configurado", logoFallback: "Marca de respaldo" },
  stats: { divisions: "Divisiones", activeNow: "Activas ahora", comingSoon: "Próximamente", sectors: "Sectores de servicio" },
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
    spotlightFallback: "Una división destacada de Henry & Co. que representa al grupo con claridad y enfoque.",
    featured: "Destacado",
    viewDetails: "Ver detalles",
    visitDivision: "Visitar división",
    serverError: "Parte de la información se está actualizando.",
  },
  premiumRow: {
    discovery: { eyebrow: "Descubrimiento", title: "Dirige a las personas hacia el negocio correcto", text: "El hub elimina la ambigüedad, refuerza la confianza y ayuda a cada visitante a llegar a la división de Henry & Co. más relevante sin confusión." },
    corporate: { eyebrow: "Presencia corporativa", title: "Presenta el grupo con madurez", text: "Esta capa pública apoya la reputación de la empresa, una comunicación más clara y una identidad de grupo más sólida en cada punto de contacto." },
    scale: { eyebrow: "Escalabilidad", title: "Construido para el crecimiento y la continuidad", text: "A medida que el grupo crece, se pueden introducir nuevos negocios y páginas corporativas dentro del mismo marco premium sin debilitar la consistencia." },
  },
  featuredSection: { eyebrow: "Divisiones destacadas", title: "Divisiones seleccionadas que representan al grupo", body: "Estos negocios sirven actualmente como puntos de entrada públicos clave al grupo Henry & Co.", viewDirectory: "Ver directorio completo" },
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
    bullets: ["Mayor confianza de marca en todos los puntos de contacto públicos.", "Enrutamiento más eficiente para clientes, socios y partes interesadas.", "Una mejor base para futuros negocios, campañas y anuncios.", "Una base creíble para comunicación corporativa, medios e inversores."],
    big: ["Unidades de negocio independientes", "Presentación de nivel corporativo", "Preparado para el crecimiento a largo plazo"],
    bigText: ["Cada división puede crecer a través de sus propios flujos de trabajo, páginas públicas y dirección comercial mientras permanece alineada con la empresa matriz.", "El grupo puede comunicarse con mayor madurez, señales de confianza más sólidas y un posicionamiento más claro en todos los mercados y públicos.", "A medida que se introducen nuevas divisiones e iniciativas públicas, la empresa puede seguir expandiéndose sin comprometer la consistencia."],
  },
  access: {
    eyebrow: "Acceso empresarial",
    title: "Todo comienza con una primera impresión más clara",
    body: "Ya sea que alguien esté descubriendo la empresa por primera vez o regresando para trabajar con una división específica, el hub proporciona un camino claro y pulido hacia el grupo Henry & Co.",
    ctaPages: "Explorar páginas corporativas",
    ctaDirectory: "Ver el directorio",
    cards: ["Estándar corporativo", "Navegación del cliente", "Confianza de marca"],
    cardValues: ["Consistente y profesional", "Clara y guiada", "Presencia pública premium"],
  },
  faq: { eyebrow: "Preguntas frecuentes", title: "Preguntas frecuentes", subtitle: "Estas respuestas ayudan a clientes, socios y partes interesadas a entender cómo funciona la empresa antes de ponerse en contacto." },
  topBar: { search: "Buscar", explore: "Explorar" },
  footer: { exploreDivisions: "Explorar divisiones", companyPages: "Páginas corporativas", colHub: "Hub corporativo", colGlobal: "Páginas globales" },
  cards: {
    divisionFallbackLong: "Una división de Henry & Co. orientada al público, construida para servir a un mercado enfocado con claridad y presentación premium.",
    divisionFallbackShort: "Una división enfocada de Henry & Co. presentada como una marca operativa independiente dentro del ecosistema del grupo.",
    destination: "Destino", notConfigured: "Aún no configurado", openDivision: "Abrir división", divisionDestination: "Destino de la división", lead: "Responsable", details: "Detalles", open: "Abrir", featured: "Destacado",
  },
  modal: {
    closeAria: "Cerrar", enterDivision: "Entrar a la división", kpiStatus: "Estado", kpiSubdomain: "Subdominio", kpiFeatured: "Destacado", kpiUpdated: "Actualizado", kpiYes: "Sí", kpiNo: "No",
    who: "A quién sirve", how: "Cómo funciona", trust: "Por qué los clientes lo eligen", highlights: "Destacados", leadEyebrow: "Responsable de división", leadFallbackTitle: "Perfil de liderazgo", links: "Enlaces",
  },
  faqFallback: [
    { q: "¿Puedo ir directamente a una división sin comenzar desde esta página?", a: "Sí. Cada división puede seguir siendo accedida directamente. Este hub existe para hacer más fácil entender la empresa y ayudar a los visitantes a llegar al negocio correcto más rápidamente." },
    { q: "¿Aparecerán divisiones adicionales aquí a medida que la empresa crezca?", a: "Sí. A medida que Henry & Co. se expande, se pueden introducir nuevas divisiones a través del mismo marco corporativo para que la experiencia pública siga siendo clara, consistente y bien organizada." },
    { q: "¿Para quién está diseñado este sitio web?", a: "El hub sirve a clientes, socios, proveedores, medios, talento y partes interesadas que necesitan una visión más clara del grupo Henry & Co. y sus negocios operativos." },
    { q: "¿Qué páginas corporativas debo revisar primero?", a: "Los mejores puntos de partida son las páginas Acerca de, Contacto, Aviso de Privacidad y Términos y Condiciones. Juntas, proporcionan una visión más clara de la empresa, sus estándares y sus políticas públicas." },
  ],
};

const HUB_HOME_COPY_PT: Partial<HubHomeCopy> = {
  nav: { featured: "Destaques", directory: "Diretório", company: "Empresa", faq: "FAQ", about: "Sobre", contact: "Contato" },
  companyPages: { about: "Sobre a Henry & Co.", contact: "Contatar a empresa", privacy: "Aviso de privacidade", terms: "Termos e condições" },
  status: { active: "Ativo", comingSoon: "Em breve", paused: "Pausado" },
  hero: {
    badgeBefore: "Rede de empresas premium • pressione ",
    badgeAfter: " para pesquisar",
    titleBefore: "Explore os negócios, serviços e divisões operacionais da ",
    titleAfter: ".",
    ctaExplore: "Explorar todas as divisões",
    ctaFeatured: "Ver divisões em destaque",
  },
  introDefault: "A Henry & Co. reúne negócios focados sob uma identidade de grupo respeitada. Este hub ajuda clientes, parceiros e partes interessadas a entender a empresa, localizar a divisão certa e avançar com confiança.",
  brandPanel: { eyebrow: "Sistema de marca corporativa", baseDomain: "Domínio base", accent: "Destaque", logoStatus: "Status do logo", logoConfigured: "Configurado", logoFallback: "Marca de reserva" },
  stats: { divisions: "Divisões", activeNow: "Ativas agora", comingSoon: "Em breve", sectors: "Setores de serviço" },
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
    spotlightFallback: "Uma divisão de destaque da Henry & Co. representando o grupo com clareza e foco.",
    featured: "Destaque",
    viewDetails: "Ver detalhes",
    visitDivision: "Visitar divisão",
    serverError: "Algumas informações estão sendo atualizadas.",
  },
  premiumRow: {
    discovery: { eyebrow: "Descoberta", title: "Direcione as pessoas para o negócio certo", text: "O hub elimina a ambiguidade, fortalece a confiança e ajuda cada visitante a chegar à divisão mais relevante da Henry & Co. sem confusão." },
    corporate: { eyebrow: "Presença corporativa", title: "Apresente o grupo com maturidade", text: "Esta camada pública apoia a reputação da empresa, uma comunicação mais clara e uma identidade de grupo mais forte em cada ponto de contato." },
    scale: { eyebrow: "Escalabilidade", title: "Construído para crescimento e continuidade", text: "À medida que o grupo cresce, novos negócios e páginas corporativas podem ser introduzidos dentro do mesmo framework premium sem enfraquecer a consistência." },
  },
  featuredSection: { eyebrow: "Divisões em destaque", title: "Divisões selecionadas representando atualmente o grupo", body: "Esses negócios servem atualmente como pontos de entrada públicos chave para o grupo Henry & Co.", viewDirectory: "Ver diretório completo" },
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
    bullets: ["Maior confiança de marca em todos os pontos de contato públicos.", "Roteamento mais eficiente para clientes, parceiros e partes interessadas.", "Uma base melhor para futuros negócios, campanhas e anúncios.", "Uma base confiável para comunicação corporativa, mídia e investidores."],
    big: ["Unidades de negócio independentes", "Apresentação de nível corporativo", "Preparado para crescimento de longo prazo"],
    bigText: ["Cada divisão pode crescer por meio de seus próprios fluxos de trabalho, páginas públicas e direção comercial enquanto permanece alinhada com a empresa-mãe.", "O grupo pode se comunicar com maior maturidade, sinais de confiança mais fortes e um posicionamento mais claro em todos os mercados e públicos.", "À medida que novas divisões e iniciativas públicas são introduzidas, a empresa pode continuar se expandindo sem comprometer a consistência."],
  },
  access: {
    eyebrow: "Acesso corporativo",
    title: "Tudo começa com uma primeira impressão mais clara",
    body: "Seja alguém descobrindo a empresa pela primeira vez ou retornando para trabalhar com uma divisão específica, o hub oferece um caminho claro e refinado para o grupo Henry & Co.",
    ctaPages: "Explorar páginas corporativas",
    ctaDirectory: "Ver o diretório",
    cards: ["Padrão corporativo", "Navegação do cliente", "Confiança de marca"],
    cardValues: ["Consistente e profissional", "Clara e guiada", "Presença pública premium"],
  },
  faq: { eyebrow: "Perguntas frequentes", title: "Perguntas frequentes", subtitle: "Estas respostas ajudam clientes, parceiros e partes interessadas a entender como a empresa funciona antes de entrar em contato." },
  topBar: { search: "Pesquisar", explore: "Explorar" },
  footer: { exploreDivisions: "Explorar divisões", companyPages: "Páginas corporativas", colHub: "Hub corporativo", colGlobal: "Páginas globais" },
  cards: {
    divisionFallbackLong: "Uma divisão voltada ao público da Henry & Co. construída para servir um mercado focado com clareza e apresentação premium.",
    divisionFallbackShort: "Uma divisão focada da Henry & Co. apresentada como uma marca operacional independente dentro do ecossistema do grupo.",
    destination: "Destino", notConfigured: "Ainda não configurado", openDivision: "Abrir divisão", divisionDestination: "Destino da divisão", lead: "Responsável", details: "Detalhes", open: "Abrir", featured: "Destaque",
  },
  modal: {
    closeAria: "Fechar", enterDivision: "Entrar na divisão", kpiStatus: "Status", kpiSubdomain: "Subdomínio", kpiFeatured: "Destaque", kpiUpdated: "Atualizado", kpiYes: "Sim", kpiNo: "Não",
    who: "A quem serve", how: "Como funciona", trust: "Por que os clientes escolhem", highlights: "Destaques", leadEyebrow: "Responsável da divisão", leadFallbackTitle: "Perfil de liderança", links: "Links",
  },
  faqFallback: [
    { q: "Posso ir diretamente a uma divisão sem começar por esta página?", a: "Sim. Cada divisão ainda pode ser acessada diretamente pelo seu próprio destino. Este hub existe para tornar a empresa mais fácil de entender e ajudar os visitantes a chegar ao negócio certo mais rapidamente." },
    { q: "Divisões adicionais aparecerão aqui à medida que a empresa crescer?", a: "Sim. À medida que a Henry & Co. se expande, novas divisões podem ser introduzidas pelo mesmo framework corporativo para que a experiência pública permaneça clara, consistente e bem organizada." },
    { q: "Para quem este site foi projetado?", a: "O hub serve clientes, parceiros, fornecedores, mídia, talentos e partes interessadas que precisam de uma visão mais clara do grupo Henry & Co. e seus negócios operacionais." },
    { q: "Quais páginas corporativas devo revisar primeiro?", a: "Os melhores pontos de partida são as páginas Sobre, Contato, Aviso de Privacidade e Termos e Condições. Juntas, fornecem uma visão mais clara da empresa, seus padrões e suas políticas públicas." },
  ],
};

const HUB_HOME_COPY_AR: Partial<HubHomeCopy> = {
  nav: { featured: "المميزة", directory: "الدليل", company: "الشركة", faq: "الأسئلة الشائعة", about: "من نحن", contact: "اتصل بنا" },
  companyPages: { about: "عن Henry & Co.", contact: "التواصل مع الشركة", privacy: "إشعار الخصوصية", terms: "الشروط والأحكام" },
  status: { active: "نشط", comingSoon: "قريباً", paused: "متوقف" },
  hero: {
    badgeBefore: "شبكة شركات متميزة • اضغط ",
    badgeAfter: " للبحث",
    titleBefore: "استكشف الأعمال والخدمات والأقسام التشغيلية لـ ",
    titleAfter: ".",
    ctaExplore: "استكشاف جميع الأقسام",
    ctaFeatured: "عرض الأقسام المميزة",
  },
  introDefault: "تجمع Henry & Co. الأعمال المتخصصة تحت هوية مجموعة موثوقة. يساعد هذا المركز العملاء والشركاء وأصحاب المصلحة على فهم الشركة وتحديد القسم المناسب والمضي قدماً بثقة.",
  brandPanel: { eyebrow: "نظام علامة الشركة", baseDomain: "النطاق الأساسي", accent: "اللون المميز", logoStatus: "حالة الشعار", logoConfigured: "مُهيأ", logoFallback: "علامة احتياطية" },
  stats: { divisions: "الأقسام", activeNow: "نشطة الآن", comingSoon: "قريباً", sectors: "قطاعات الخدمة" },
  standardCard: {
    eyebrow: "معيار المجموعة",
    title: "معيار موحد عبر كل قسم.",
    bullets: [
      "يعمل كل قسم بتركيز سوقي خاص به مع عكس معايير مجموعة Henry & Co. الأشمل.",
      "يساعد مركز الشركة الزوار على فهم أين يذهبون ومع من يتفاعلون وكيف تنظم المجموعة.",
      "مع نمو الشركة، يمكن تقديم أقسام جديدة ضمن هيكل واضح وموثوق.",
      "النتيجة هي حضور عام أقوى، وتنقل أفضل، وتجربة أكثر احترافية في كل نقطة تواصل.",
    ],
    latestUpdate: "آخر تحديث للشركة",
    operatingStandard: "المعيار التشغيلي",
    operatingStandardValue: "متسق ومستمر",
    spotlightEyebrow: "الضوء الحالي",
    spotlightFallback: "قسم مميز من Henry & Co. يمثل المجموعة بوضوح وتركيز.",
    featured: "مميز",
    viewDetails: "عرض التفاصيل",
    visitDivision: "زيارة القسم",
    serverError: "بعض المعلومات قيد التحديث حالياً.",
  },
  premiumRow: {
    discovery: { eyebrow: "الاكتشاف", title: "وجّه الناس نحو العمل الصحيح", text: "يزيل المركز الغموض ويقوي الثقة ويساعد كل زائر على الوصول إلى قسم Henry & Co. الأكثر ملاءمة دون ارتباك." },
    corporate: { eyebrow: "الحضور المؤسسي", title: "قدّم المجموعة بنضج", text: "تدعم هذه الطبقة العامة سمعة الشركة وتوضح التواصل وتقوي هوية المجموعة عبر كل نقطة تواصل عامة." },
    scale: { eyebrow: "قابلية التوسع", title: "مبني للنمو والاستمرارية", text: "مع نمو المجموعة، يمكن تقديم أعمال جديدة وصفحات مؤسسية ضمن نفس الإطار المتميز دون الإخلال بالاتساق." },
  },
  featuredSection: { eyebrow: "الأقسام المميزة", title: "أقسام مختارة تمثل المجموعة حالياً", body: "تعمل هذه الأعمال حالياً كنقاط دخول عامة رئيسية إلى مجموعة Henry & Co.", viewDirectory: "عرض الدليل الكامل" },
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
    bullets: ["ثقة أقوى بالعلامة التجارية عبر جميع نقاط التواصل العامة.", "توجيه أكثر كفاءة للعملاء والشركاء وأصحاب المصلحة.", "أساس أفضل للأعمال والحملات والإعلانات المستقبلية.", "قاعدة موثوقة للتواصل المؤسسي والإعلامي والاستثماري."],
    big: ["وحدات أعمال مستقلة", "عرض بمستوى مؤسسي", "مستعد للنمو طويل الأمد"],
    bigText: ["يمكن لكل قسم أن ينمو من خلال سير عمله الخاص وصفحاته العامة وتوجهه التجاري مع البقاء متوافقاً مع الشركة الأم.", "يمكن للمجموعة التواصل بنضج أكبر وإشارات ثقة أقوى وتموضع أوضح عبر الأسواق والجماهير.", "مع تقديم أقسام ومبادرات عامة جديدة، يمكن للشركة الاستمرار في التوسع دون المساس بالاتساق."],
  },
  access: {
    eyebrow: "الوصول المؤسسي",
    title: "كل شيء يبدأ بانطباع أول أوضح",
    body: "سواء كان شخص ما يكتشف الشركة لأول مرة أو يعود للعمل مع قسم محدد، يوفر المركز مساراً واضحاً ومصقولاً إلى مجموعة Henry & Co. الأشمل.",
    ctaPages: "استكشاف صفحات الشركة",
    ctaDirectory: "عرض الدليل",
    cards: ["معيار الشركة", "تنقل العملاء", "ثقة العلامة التجارية"],
    cardValues: ["متسق واحترافي", "واضح وموجه", "حضور عام متميز"],
  },
  faq: { eyebrow: "الأسئلة المتكررة", title: "الأسئلة الشائعة", subtitle: "هذه الإجابات تساعد العملاء والشركاء وأصحاب المصلحة على فهم كيفية عمل الشركة قبل التواصل معنا." },
  topBar: { search: "بحث", explore: "استكشاف" },
  footer: { exploreDivisions: "استكشاف الأقسام", companyPages: "صفحات الشركة", colHub: "مركز الشركة", colGlobal: "الصفحات العالمية" },
  cards: {
    divisionFallbackLong: "قسم Henry & Co. المواجه للجمهور مبني لخدمة سوق متخصصة بوضوح وعرض متميز.",
    divisionFallbackShort: "قسم متخصص من Henry & Co. مقدم كعلامة تشغيلية مستقلة ضمن نظام بيئي المجموعة الأشمل.",
    destination: "الوجهة", notConfigured: "لم يُهيأ بعد", openDivision: "فتح القسم", divisionDestination: "وجهة القسم", lead: "القائد", details: "التفاصيل", open: "فتح", featured: "مميز",
  },
  modal: {
    closeAria: "إغلاق", enterDivision: "دخول القسم", kpiStatus: "الحالة", kpiSubdomain: "النطاق الفرعي", kpiFeatured: "مميز", kpiUpdated: "محدّث", kpiYes: "نعم", kpiNo: "لا",
    who: "من يخدم", how: "كيف يعمل", trust: "لماذا يختاره العملاء", highlights: "أبرز المميزات", leadEyebrow: "قائد القسم", leadFallbackTitle: "الملف القيادي", links: "الروابط",
  },
  faqFallback: [
    { q: "هل يمكنني الذهاب مباشرة إلى قسم دون البدء من هذه الصفحة؟", a: "نعم. يمكن الوصول إلى كل قسم مباشرة عبر وجهته الخاصة. يوجد هذا المركز لتسهيل فهم الشركة الأشمل ومساعدة الزوار على الوصول إلى العمل الصحيح بشكل أسرع." },
    { q: "هل ستظهر أقسام إضافية هنا مع نمو الشركة؟", a: "نعم. مع توسع Henry & Co.، يمكن تقديم أقسام جديدة من خلال نفس الإطار المؤسسي ليبقى التجربة العامة واضحة ومتسقة ومنظمة." },
    { q: "لمن صُمم هذا الموقع؟", a: "يخدم المركز العملاء والشركاء والموردين والإعلام والكفاءات وأصحاب المصلحة الذين يحتاجون إلى رؤية أوضح لمجموعة Henry & Co. وأعمالها التشغيلية." },
    { q: "ما صفحات الشركة التي يجب مراجعتها أولاً؟", a: "أفضل نقاط البداية هي صفحات من نحن والاتصال وإشعار الخصوصية والشروط والأحكام. معاً توفر رؤية أوضح للشركة ومعاييرها وسياساتها العامة." },
  ],
};

const HUB_HOME_COPY_DE: Partial<HubHomeCopy> = {
  nav: { featured: "Highlights", directory: "Verzeichnis", company: "Unternehmen", faq: "FAQ", about: "Über uns", contact: "Kontakt" },
  companyPages: { about: "Über Henry & Co.", contact: "Unternehmen kontaktieren", privacy: "Datenschutzhinweis", terms: "Allgemeine Geschäftsbedingungen" },
  status: { active: "Aktiv", comingSoon: "Demnächst", paused: "Pausiert" },
  hero: {
    badgeBefore: "Premium-Unternehmensnetzwerk • drücken Sie ",
    badgeAfter: " zum Suchen",
    titleBefore: "Entdecken Sie die Unternehmen, Dienste und operativen Abteilungen von ",
    titleAfter: ".",
    ctaExplore: "Alle Abteilungen erkunden",
    ctaFeatured: "Ausgewählte Abteilungen anzeigen",
  },
  introDefault: "Henry & Co. vereint fokussierte Unternehmen unter einer angesehenen Gruppenidentität. Dieser Hub hilft Kunden, Partnern und Stakeholdern dabei, das Unternehmen zu verstehen, die richtige Abteilung zu finden und sicher voranzuschreiten.",
  brandPanel: { eyebrow: "Unternehmens-Markensystem", baseDomain: "Basisdomain", accent: "Akzent", logoStatus: "Logo-Status", logoConfigured: "Konfiguriert", logoFallback: "Ersatzmarke" },
  stats: { divisions: "Abteilungen", activeNow: "Derzeit aktiv", comingSoon: "Demnächst", sectors: "Dienstleistungssektoren" },
  standardCard: {
    eyebrow: "Gruppenstandard",
    title: "Ein einheitlicher Standard in jeder Abteilung.",
    bullets: [
      "Jede Abteilung operiert mit eigenem Marktfokus und spiegelt dabei die Standards der Henry & Co. Gruppe wider.",
      "Der Unternehmens-Hub hilft Besuchern zu verstehen, wohin sie gehen, mit wem sie interagieren und wie die Gruppe organisiert ist.",
      "Mit dem Wachstum des Unternehmens können neue Abteilungen in eine klare und glaubwürdige Struktur eingeführt werden.",
      "Das Ergebnis ist eine stärkere öffentliche Präsenz, bessere Navigation und eine professionellere Erfahrung an jedem Kontaktpunkt.",
    ],
    latestUpdate: "Neueste Unternehmensmeldung",
    operatingStandard: "Betriebsstandard",
    operatingStandardValue: "Konsistent und gepflegt",
    spotlightEyebrow: "Aktueller Fokus",
    spotlightFallback: "Eine ausgewählte Henry & Co. Abteilung, die die Gruppe mit Klarheit und Fokus repräsentiert.",
    featured: "Highlights",
    viewDetails: "Details anzeigen",
    visitDivision: "Abteilung besuchen",
    serverError: "Einige Informationen werden derzeit aktualisiert.",
  },
  premiumRow: {
    discovery: { eyebrow: "Entdeckung", title: "Leiten Sie Menschen zum richtigen Unternehmen", text: "Der Hub beseitigt Unklarheiten, stärkt das Vertrauen und hilft jedem Besucher, die relevanteste Henry & Co. Abteilung ohne Verwirrung zu erreichen." },
    corporate: { eyebrow: "Unternehmensauftritt", title: "Die Gruppe mit Reife präsentieren", text: "Diese öffentliche Ebene unterstützt den Unternehmensruf, eine klarere Kommunikation und eine stärkere Gruppenidentität an jedem marktorientierten Kontaktpunkt." },
    scale: { eyebrow: "Skalierbarkeit", title: "Für Wachstum und Kontinuität gebaut", text: "Mit dem Wachstum der Gruppe können neue Unternehmen und Unternehmensseiten im gleichen Premium-Rahmen eingeführt werden, ohne die Konsistenz zu schwächen." },
  },
  featuredSection: { eyebrow: "Ausgewählte Abteilungen", title: "Ausgewählte Abteilungen, die derzeit die Gruppe repräsentieren", body: "Diese Unternehmen dienen derzeit als wichtige öffentliche Einstiegspunkte in die Henry & Co. Gruppe.", viewDirectory: "Vollständiges Verzeichnis anzeigen" },
  directory: {
    eyebrow: "Verzeichnis",
    title: "Das richtige Henry & Co. Unternehmen finden",
    body: "Suchen Sie nach Abteilungsname, Kategorie, Dienstleistungsschwerpunkt oder Geschäftsfokus. Dieses Verzeichnis hilft Menschen, schnell und sicher zum richtigen Teil des Unternehmens zu gelangen.",
    searchPlaceholder: "Abteilungen, Dienste, Kategorien, Subdomains suchen…",
    clearSearchAria: "Suche löschen",
    popularSectors: "Beliebte Sektoren",
    featuredOn: "Nur ausgewählte anzeigen",
    featuredOff: "Auf ausgewählte beschränken",
    allCategories: "Alle Kategorien",
    filterAll: "Alle",
    filterActive: "Aktiv",
    filterSoon: "Demnächst",
    filterPaused: "Pausiert",
    showing: "Angezeigt",
    total: "Gesamt",
    featured: "Highlights",
    overviewEyebrow: "Verzeichnisübersicht",
    clearAll: "Alles löschen",
    ready: "Bereit",
    activeRefinements: "Aktive Filter",
    lastUpdated: "Zuletzt aktualisiert",
    companyPagesEyebrow: "Unternehmensseiten",
    empty: "Keine passenden Abteilungen gefunden. Filter löschen oder Suchkriterien erweitern.",
  },
  ecosystem: {
    eyebrow: "Warum das wichtig ist",
    title: "Eine klarere Unternehmensdarstellung schafft Vertrauen vor dem ersten Gespräch",
    body: "Ein gut strukturierter Unternehmens-Hub hilft Zielgruppen dabei, den Umfang des Unternehmens, die Beziehung zwischen seinen Abteilungen und das Niveau der Professionalität hinter jedem Service zu verstehen.",
    bullets: ["Stärkeres Markenvertrauen an allen öffentlichen Kontaktpunkten.", "Effizientere Navigation für Kunden, Partner und Stakeholder.", "Eine bessere Grundlage für zukünftige Unternehmen, Kampagnen und Ankündigungen.", "Eine glaubwürdige Basis für Unternehmens-, Medien- und Investorenkommunikation."],
    big: ["Unabhängige Geschäftseinheiten", "Unternehmensgerechte Präsentation", "Für langfristiges Wachstum vorbereitet"],
    bigText: ["Jede Abteilung kann durch ihre eigenen Arbeitsabläufe, öffentlichen Seiten und kommerzielle Ausrichtung wachsen und dabei mit dem Mutterunternehmen ausgerichtet bleiben.", "Die Gruppe kann mit mehr Reife, stärkeren Vertrauenssignalen und klarerem Positioning über Märkte und Zielgruppen hinweg kommunizieren.", "Mit der Einführung neuer Abteilungen und öffentlicher Initiativen kann das Unternehmen weiter expandieren, ohne die Konsistenz zu beeinträchtigen."],
  },
  access: {
    eyebrow: "Unternehmenszugang",
    title: "Alles beginnt mit einem klareren ersten Eindruck",
    body: "Ob jemand das Unternehmen zum ersten Mal entdeckt oder zurückkommt, um mit einer bestimmten Abteilung zu arbeiten – der Hub bietet einen klaren, polierten Weg in die gesamte Henry & Co. Gruppe.",
    ctaPages: "Unternehmensseiten erkunden",
    ctaDirectory: "Das Verzeichnis anzeigen",
    cards: ["Unternehmensstandard", "Kundennavigation", "Markenvertrauen"],
    cardValues: ["Konsistent und professionell", "Klar und geführt", "Premium öffentliche Präsenz"],
  },
  faq: { eyebrow: "Häufig gestellt", title: "Häufig gestellte Fragen", subtitle: "Diese Antworten helfen Kunden, Partnern und Stakeholdern dabei, zu verstehen, wie das Unternehmen funktioniert, bevor sie sich melden müssen." },
  topBar: { search: "Hub durchsuchen", explore: "Erkunden" },
  footer: { exploreDivisions: "Abteilungen erkunden", companyPages: "Unternehmensseiten", colHub: "Unternehmens-Hub", colGlobal: "Globale Seiten" },
  cards: {
    divisionFallbackLong: "Eine öffentlich zugängliche Henry & Co. Abteilung, die darauf ausgelegt ist, einen fokussierten Markt mit Klarheit und Premium-Präsentation zu bedienen.",
    divisionFallbackShort: "Eine fokussierte Henry & Co. Abteilung, die als unabhängige Betriebsmarke innerhalb des weiteren Unternehmensökosystems präsentiert wird.",
    destination: "Ziel", notConfigured: "Noch nicht konfiguriert", openDivision: "Abteilung öffnen", divisionDestination: "Abteilungsziel", lead: "Leitung", details: "Details", open: "Öffnen", featured: "Highlights",
  },
  modal: {
    closeAria: "Schließen", enterDivision: "Abteilung betreten", kpiStatus: "Status", kpiSubdomain: "Subdomain", kpiFeatured: "Highlights", kpiUpdated: "Aktualisiert", kpiYes: "Ja", kpiNo: "Nein",
    who: "Wen es bedient", how: "Wie es funktioniert", trust: "Warum Kunden es wählen", highlights: "Highlights", leadEyebrow: "Abteilungsleitung", leadFallbackTitle: "Führungsprofil", links: "Links",
  },
  faqFallback: [
    { q: "Kann ich direkt zu einer Abteilung gehen, ohne von dieser Seite aus zu starten?", a: "Ja. Jede Abteilung kann weiterhin direkt über ihr eigenes Ziel aufgerufen werden. Dieser Hub existiert, um das Verständnis des breiteren Unternehmens zu erleichtern und Besuchern zu helfen, das richtige Unternehmen schneller zu erreichen." },
    { q: "Werden hier weitere Abteilungen erscheinen, wenn das Unternehmen wächst?", a: "Ja. Mit der Expansion von Henry & Co. können neue Abteilungen im gleichen Unternehmensrahmen eingeführt werden, sodass das öffentliche Erlebnis klar, konsistent und gut organisiert bleibt." },
    { q: "Für wen ist diese Website konzipiert?", a: "Der Hub dient Kunden, Partnern, Lieferanten, Medien, Talenten und Stakeholdern, die einen klareren Überblick über die Henry & Co. Gruppe und ihre operativen Unternehmen benötigen." },
    { q: "Welche Unternehmensseiten sollte ich zuerst ansehen?", a: "Die besten Ausgangspunkte sind die Seiten Über uns, Kontakt, Datenschutzhinweis und Allgemeine Geschäftsbedingungen. Zusammen bieten sie einen klareren Überblick über das Unternehmen, seine Standards und seine öffentlichen Richtlinien." },
  ],
};

const HUB_HOME_COPY_ZH: Partial<HubHomeCopy> = {
  nav: { featured: "精选", directory: "目录", company: "公司", faq: "常见问题", about: "关于我们", contact: "联系我们" },
  companyPages: { about: "关于 Henry & Co.", contact: "联系公司", privacy: "隐私声明", terms: "条款与条件" },
  status: { active: "活跃", comingSoon: "即将推出", paused: "暂停" },
  hero: {
    badgeBefore: "优质企业网络 • 按 ",
    badgeAfter: " 搜索",
    titleBefore: "探索 ",
    titleAfter: " 的业务、服务和运营部门。",
    ctaExplore: "探索所有部门",
    ctaFeatured: "查看精选部门",
  },
  introDefault: "Henry & Co. 将专注型业务集合在一个受人尊敬的集团品牌下。这个中心帮助客户、合作伙伴和利益相关者了解公司、找到合适的部门并自信地前进。",
  brandPanel: { eyebrow: "公司品牌体系", baseDomain: "基础域名", accent: "强调色", logoStatus: "标志状态", logoConfigured: "已配置", logoFallback: "备用标志" },
  stats: { divisions: "部门", activeNow: "当前活跃", comingSoon: "即将推出", sectors: "服务领域" },
  standardCard: {
    eyebrow: "集团标准",
    title: "每个部门统一的标准。",
    bullets: [
      "每个部门在保持自身市场专注的同时，也体现了 Henry & Co. 集团的标准。",
      "公司中心帮助访客了解该去哪里、与谁接触以及集团是如何组织的。",
      "随着公司的扩张，可以在清晰可信的结构中引入新部门。",
      "结果是更强大的公众形象、更好的导航以及每个接触点更专业的体验。",
    ],
    latestUpdate: "最新公司动态",
    operatingStandard: "运营标准",
    operatingStandardValue: "一致且稳定",
    spotlightEyebrow: "当前焦点",
    spotlightFallback: "一个精选的 Henry & Co. 部门，以清晰和专注的方式代表集团。",
    featured: "精选",
    viewDetails: "查看详情",
    visitDivision: "访问部门",
    serverError: "部分信息正在更新中。",
  },
  premiumRow: {
    discovery: { eyebrow: "发现", title: "引导人们找到正确的业务", text: "该中心消除歧义，增强信心，帮助每位访客毫无困惑地到达最相关的 Henry & Co. 部门。" },
    corporate: { eyebrow: "企业形象", title: "以成熟的方式展示集团", text: "这一公开层面支持公司声誉、更清晰的沟通以及在每个面向市场的接触点上更强的集团级身份认同。" },
    scale: { eyebrow: "可扩展性", title: "为增长和持续性而建", text: "随着集团的成长，可以在同一优质框架内引入新的业务和企业页面，而不会削弱一致性。" },
  },
  featuredSection: { eyebrow: "精选部门", title: "当前代表集团的精选部门", body: "这些业务目前作为进入 Henry & Co. 集团的重要公开入口。", viewDirectory: "查看完整目录" },
  directory: {
    eyebrow: "目录",
    title: "找到合适的 Henry & Co. 业务",
    body: "按部门名称、类别、服务重点或业务焦点搜索。该目录帮助人们快速自信地找到公司的合适部分。",
    searchPlaceholder: "搜索部门、服务、类别、子域名…",
    clearSearchAria: "清除搜索",
    popularSectors: "热门领域",
    featuredOn: "仅显示精选",
    featuredOff: "限制为精选",
    allCategories: "所有类别",
    filterAll: "全部",
    filterActive: "活跃",
    filterSoon: "即将推出",
    filterPaused: "暂停",
    showing: "显示",
    total: "总计",
    featured: "精选",
    overviewEyebrow: "目录概览",
    clearAll: "清除全部",
    ready: "就绪",
    activeRefinements: "活跃筛选",
    lastUpdated: "最后更新",
    companyPagesEyebrow: "公司页面",
    empty: "未找到匹配的部门。请清除筛选条件或扩大搜索范围。",
  },
  ecosystem: {
    eyebrow: "为何重要",
    title: "更清晰的企业形象在第一次对话之前就建立信任",
    body: "结构良好的企业中心帮助受众了解公司的范围、各部门之间的关系以及每项服务背后的专业水平。",
    bullets: ["在所有公开接触点上更强的品牌信心。", "为客户、合作伙伴和利益相关者提供更高效的导航。", "为未来的业务、活动和公告提供更好的基础。", "为公司、媒体和投资者沟通提供可信的基础。"],
    big: ["独立业务单元", "企业级展示", "为长期增长做好准备"],
    bigText: ["每个部门都可以通过自己的工作流程、公开页面和商业方向成长，同时与母公司保持一致。", "集团可以以更成熟、更强的信任信号和更清晰的市场定位进行沟通。", "随着新部门和公开举措的引入，公司可以继续扩张而不影响一致性。"],
  },
  access: {
    eyebrow: "公司访问",
    title: "一切从更清晰的第一印象开始",
    body: "无论是第一次发现公司还是回来与特定部门合作，该中心都提供通往 Henry & Co. 集团的清晰、精致路径。",
    ctaPages: "探索公司页面",
    ctaDirectory: "查看目录",
    cards: ["公司标准", "客户导航", "品牌信心"],
    cardValues: ["一致且专业", "清晰且引导", "优质公众形象"],
  },
  faq: { eyebrow: "常见问题", title: "常见问题解答", subtitle: "这些解答帮助客户、合作伙伴和利益相关者在需要联系之前了解公司的运作方式。" },
  topBar: { search: "搜索中心", explore: "探索" },
  footer: { exploreDivisions: "探索部门", companyPages: "公司页面", colHub: "公司中心", colGlobal: "全球页面" },
  cards: {
    divisionFallbackLong: "Henry & Co. 的一个面向公众的部门，旨在以清晰和优质的展示服务于专注的市场。",
    divisionFallbackShort: "Henry & Co. 的一个专注部门，作为更广泛公司生态系统内的独立运营品牌呈现。",
    destination: "目的地", notConfigured: "尚未配置", openDivision: "打开部门", divisionDestination: "部门目的地", lead: "负责人", details: "详情", open: "打开", featured: "精选",
  },
  modal: {
    closeAria: "关闭", enterDivision: "进入部门", kpiStatus: "状态", kpiSubdomain: "子域名", kpiFeatured: "精选", kpiUpdated: "已更新", kpiYes: "是", kpiNo: "否",
    who: "服务对象", how: "运作方式", trust: "客户选择原因", highlights: "亮点", leadEyebrow: "部门负责人", leadFallbackTitle: "领导简介", links: "链接",
  },
  faqFallback: [
    { q: "我可以直接前往某个部门而不从此页开始吗？", a: "可以。每个部门仍然可以通过其自己的目的地直接访问。该中心的存在是为了让更广泛的公司更容易理解，并帮助访客更快地到达正确的业务。" },
    { q: "随着公司的成长，这里会出现更多部门吗？", a: "会的。随着 Henry & Co. 的扩张，可以通过同一企业框架引入新部门，使公众体验保持清晰、一致且组织良好。" },
    { q: "这个网站是为谁设计的？", a: "该中心服务于需要更清晰了解 Henry & Co. 集团及其运营业务的客户、合作伙伴、供应商、媒体、人才和利益相关者。" },
    { q: "我应该首先查看哪些公司页面？", a: "最佳起点是关于我们、联系我们、隐私声明和条款与条件页面。它们共同提供了对公司、其标准和公共政策的更清晰了解。" },
  ],
};

const HUB_HOME_COPY_HI: Partial<HubHomeCopy> = {
  nav: { featured: "फीचर्ड", directory: "निर्देशिका", company: "कंपनी", faq: "सामान्य प्रश्न", about: "हमारे बारे में", contact: "संपर्क" },
  companyPages: { about: "Henry & Co. के बारे में", contact: "कंपनी से संपर्क करें", privacy: "गोपनीयता नोटिस", terms: "नियम और शर्तें" },
  status: { active: "सक्रिय", comingSoon: "जल्द आ रहा है", paused: "विराम" },
  hero: {
    badgeBefore: "प्रीमियम कंपनी नेटवर्क • खोजने के लिए ",
    badgeAfter: " दबाएं",
    titleBefore: "",
    titleAfter: " के व्यवसायों, सेवाओं और परिचालन प्रभागों का अन्वेषण करें।",
    ctaExplore: "सभी प्रभाग देखें",
    ctaFeatured: "फीचर्ड प्रभाग देखें",
  },
  introDefault: "Henry & Co. एक सम्मानित समूह पहचान के तहत केंद्रित व्यवसायों को एकत्रित करती है। यह हब ग्राहकों, भागीदारों और हितधारकों को कंपनी समझने, सही प्रभाग खोजने और आत्मविश्वास के साथ आगे बढ़ने में मदद करता है।",
  brandPanel: { eyebrow: "कंपनी ब्रांड सिस्टम", baseDomain: "बेस डोमेन", accent: "एक्सेंट", logoStatus: "लोगो स्थिति", logoConfigured: "कॉन्फ़िगर किया गया", logoFallback: "फ़ॉलबैक मार्क" },
  stats: { divisions: "प्रभाग", activeNow: "अभी सक्रिय", comingSoon: "जल्द आ रहा है", sectors: "सेवा क्षेत्र" },
  standardCard: {
    eyebrow: "समूह मानक",
    title: "हर प्रभाग में एकीकृत मानक।",
    bullets: [
      "प्रत्येक प्रभाग अपने बाजार फोकस के साथ काम करता है और व्यापक Henry & Co. समूह के मानकों को दर्शाता है।",
      "कंपनी हब आगंतुकों को यह समझने में मदद करता है कि कहां जाना है, किससे जुड़ना है और समूह कैसे संगठित है।",
      "जैसे-जैसे कंपनी का विस्तार होता है, नए प्रभागों को एक स्पष्ट और विश्वसनीय संरचना के भीतर पेश किया जा सकता है।",
      "परिणाम एक मजबूत सार्वजनिक उपस्थिति, बेहतर नेविगेशन और हर टचपॉइंट पर अधिक पेशेवर अनुभव है।",
    ],
    latestUpdate: "नवीनतम कंपनी अपडेट",
    operatingStandard: "परिचालन मानक",
    operatingStandardValue: "सुसंगत और बनाए रखा गया",
    spotlightEyebrow: "वर्तमान स्पॉटलाइट",
    spotlightFallback: "Henry & Co. का एक फीचर्ड प्रभाग जो स्पष्टता और फोकस के साथ समूह का प्रतिनिधित्व करता है।",
    featured: "फीचर्ड",
    viewDetails: "विवरण देखें",
    visitDivision: "प्रभाग विजिट करें",
    serverError: "कुछ जानकारी वर्तमान में अपडेट हो रही है।",
  },
  premiumRow: {
    discovery: { eyebrow: "खोज", title: "लोगों को सही व्यवसाय तक पहुंचाएं", text: "हब अस्पष्टता दूर करता है, आत्मविश्वास बढ़ाता है और हर आगंतुक को बिना भ्रम के सबसे प्रासंगिक Henry & Co. प्रभाग तक पहुंचने में मदद करता है।" },
    corporate: { eyebrow: "कॉर्पोरेट उपस्थिति", title: "समूह को परिपक्वता के साथ प्रस्तुत करें", text: "यह सार्वजनिक परत कंपनी की प्रतिष्ठा, स्पष्ट संचार और हर बाजार-सामना टचपॉइंट पर मजबूत समूह-स्तरीय पहचान का समर्थन करती है।" },
    scale: { eyebrow: "स्केलेबिलिटी", title: "विकास और निरंतरता के लिए बनाया गया", text: "जैसे-जैसे समूह बढ़ता है, नए व्यवसाय और कॉर्पोरेट पेज उसी प्रीमियम ढांचे के भीतर पेश किए जा सकते हैं।" },
  },
  featuredSection: { eyebrow: "फीचर्ड प्रभाग", title: "वर्तमान में समूह का प्रतिनिधित्व करने वाले चुनिंदा प्रभाग", body: "ये व्यवसाय वर्तमान में Henry & Co. समूह में प्रमुख सार्वजनिक प्रवेश बिंदु के रूप में काम करते हैं।", viewDirectory: "पूरी निर्देशिका देखें" },
  directory: {
    eyebrow: "निर्देशिका",
    title: "सही Henry & Co. व्यवसाय खोजें",
    body: "प्रभाग नाम, श्रेणी, सेवा जोर या व्यवसाय फोकस द्वारा खोजें। यह निर्देशिका लोगों को कंपनी के सही हिस्से तक जल्दी और आत्मविश्वास से जाने में मदद करती है।",
    searchPlaceholder: "प्रभाग, सेवाएं, श्रेणियां, सबडोमेन खोजें…",
    clearSearchAria: "खोज साफ करें",
    popularSectors: "लोकप्रिय क्षेत्र",
    featuredOn: "केवल फीचर्ड दिखाएं",
    featuredOff: "फीचर्ड तक सीमित करें",
    allCategories: "सभी श्रेणियां",
    filterAll: "सभी",
    filterActive: "सक्रिय",
    filterSoon: "जल्द आ रहा है",
    filterPaused: "विराम",
    showing: "दिखाए जा रहे",
    total: "कुल",
    featured: "फीचर्ड",
    overviewEyebrow: "निर्देशिका अवलोकन",
    clearAll: "सभी साफ करें",
    ready: "तैयार",
    activeRefinements: "सक्रिय फिल्टर",
    lastUpdated: "अंतिम अपडेट",
    companyPagesEyebrow: "कंपनी-स्तरीय पेज",
    empty: "कोई मिलान प्रभाग नहीं मिला। अपने फिल्टर साफ करें या खोज मानदंड व्यापक करें।",
  },
  ecosystem: {
    eyebrow: "यह क्यों मायने रखता है",
    title: "स्पष्ट कंपनी उपस्थिति पहली बातचीत से पहले विश्वास बनाती है",
    body: "एक सुव्यवस्थित कॉर्पोरेट हब दर्शकों को कंपनी के दायरे, इसके प्रभागों के बीच संबंध और हर सेवा के पीछे व्यावसायिकता के स्तर को समझने में मदद करता है।",
    bullets: ["सभी सार्वजनिक टचपॉइंट पर मजबूत ब्रांड आत्मविश्वास।", "ग्राहकों, भागीदारों और हितधारकों के लिए अधिक कुशल रूटिंग।", "भविष्य के व्यवसायों, अभियानों और घोषणाओं के लिए बेहतर आधार।", "कंपनी, मीडिया और निवेशक-सामना संचार के लिए विश्वसनीय आधार।"],
    big: ["स्वतंत्र व्यावसायिक इकाइयां", "कॉर्पोरेट-ग्रेड प्रस्तुति", "दीर्घकालिक विकास के लिए तैयार"],
    bigText: ["प्रत्येक प्रभाग अपने वर्कफ्लो, सार्वजनिक पेज और वाणिज्यिक दिशा के माध्यम से बढ़ सकता है।", "समूह अधिक परिपक्वता, मजबूत विश्वास संकेतों और बाजारों और दर्शकों में स्पष्ट स्थिति के साथ संवाद कर सकता है।", "जैसे-जैसे नए प्रभाग और सार्वजनिक पहल पेश की जाती हैं, कंपनी निरंतरता से समझौता किए बिना विस्तार करना जारी रख सकती है।"],
  },
  access: {
    eyebrow: "कंपनी एक्सेस",
    title: "सब कुछ एक स्पष्ट पहली छाप से शुरू होता है",
    body: "चाहे कोई पहली बार कंपनी की खोज कर रहा हो या किसी विशिष्ट प्रभाग के साथ काम करने के लिए लौट रहा हो, हब व्यापक Henry & Co. समूह में एक स्पष्ट, परिष्कृत मार्ग प्रदान करता है।",
    ctaPages: "कंपनी पेज एक्सप्लोर करें",
    ctaDirectory: "निर्देशिका देखें",
    cards: ["कंपनी मानक", "ग्राहक नेविगेशन", "ब्रांड आत्मविश्वास"],
    cardValues: ["सुसंगत और पेशेवर", "स्पष्ट और निर्देशित", "प्रीमियम सार्वजनिक उपस्थिति"],
  },
  faq: { eyebrow: "अक्सर पूछे जाने वाले प्रश्न", title: "अक्सर पूछे जाने वाले प्रश्न", subtitle: "ये उत्तर ग्राहकों, भागीदारों और हितधारकों को संपर्क करने से पहले कंपनी के काम को समझने में मदद करते हैं।" },
  topBar: { search: "हब खोजें", explore: "एक्सप्लोर करें" },
  footer: { exploreDivisions: "प्रभाग एक्सप्लोर करें", companyPages: "कंपनी पेज", colHub: "कंपनी हब", colGlobal: "ग्लोबल पेज" },
  cards: {
    divisionFallbackLong: "Henry & Co. का एक सार्वजनिक-सामना प्रभाग स्पष्टता और प्रीमियम प्रस्तुति के साथ एक केंद्रित बाजार की सेवा करने के लिए बनाया गया है।",
    divisionFallbackShort: "Henry & Co. का एक केंद्रित प्रभाग व्यापक कंपनी इकोसिस्टम के भीतर एक स्वतंत्र ऑपरेटिंग ब्रांड के रूप में प्रस्तुत किया गया है।",
    destination: "गंतव्य", notConfigured: "अभी तक कॉन्फ़िगर नहीं", openDivision: "प्रभाग खोलें", divisionDestination: "प्रभाग गंतव्य", lead: "प्रमुख", details: "विवरण", open: "खोलें", featured: "फीचर्ड",
  },
  modal: {
    closeAria: "बंद करें", enterDivision: "प्रभाग में प्रवेश करें", kpiStatus: "स्थिति", kpiSubdomain: "सबडोमेन", kpiFeatured: "फीचर्ड", kpiUpdated: "अपडेट किया गया", kpiYes: "हां", kpiNo: "नहीं",
    who: "यह किसकी सेवा करता है", how: "यह कैसे काम करता है", trust: "ग्राहक इसे क्यों चुनते हैं", highlights: "हाइलाइट्स", leadEyebrow: "प्रभाग प्रमुख", leadFallbackTitle: "नेतृत्व प्रोफ़ाइल", links: "लिंक",
  },
  faqFallback: [
    { q: "क्या मैं इस पेज से शुरू किए बिना सीधे किसी प्रभाग में जा सकता हूं?", a: "हां। प्रत्येक प्रभाग अभी भी अपने गंतव्य के माध्यम से सीधे पहुंचा जा सकता है। यह हब व्यापक कंपनी को समझना आसान बनाने और आगंतुकों को सही व्यवसाय तक अधिक तेजी से पहुंचने में मदद करने के लिए है।" },
    { q: "क्या कंपनी के बढ़ने पर यहां अतिरिक्त प्रभाग दिखाई देंगे?", a: "हां। जैसे-जैसे Henry & Co. का विस्तार होता है, उसी कंपनी ढांचे के माध्यम से नए प्रभाग पेश किए जा सकते हैं ताकि सार्वजनिक अनुभव स्पष्ट, सुसंगत और सुव्यवस्थित रहे।" },
    { q: "यह वेबसाइट किसके लिए डिज़ाइन की गई है?", a: "हब ग्राहकों, भागीदारों, आपूर्तिकर्ताओं, मीडिया, प्रतिभाओं और हितधारकों की सेवा करता है जिन्हें Henry & Co. समूह और इसके परिचालन व्यवसायों का स्पष्ट दृश्य चाहिए।" },
    { q: "मुझे पहले कौन से कंपनी पेज देखने चाहिए?", a: "सबसे अच्छे शुरुआती बिंदु हमारे बारे में, संपर्क, गोपनीयता नोटिस और नियम और शर्तें पेज हैं। साथ में, वे कंपनी, इसके मानकों और इसकी सार्वजनिक नीतियों का स्पष्ट दृश्य प्रदान करते हैं।" },
  ],
};

const HUB_HOME_COPY_IG: Partial<HubHomeCopy> = {
  nav: { featured: "Ndị a họpụtara", directory: "Ndepụta", company: "Ụlọ ọrụ", faq: "Ajụjụ ndị a na-ajụ", about: "Maka anyị", contact: "Kpọtụrụ anyị" },
  companyPages: { about: "Maka Henry & Co.", contact: "Kpọtụrụ ụlọ ọrụ ahụ", privacy: "Ọkwa nzuzo", terms: "Usoro na Ọnọdụ" },
  status: { active: "Na-arụ ọrụ", comingSoon: "Na-abịa n'oge na-adịghị anya", paused: "Akwụsịrị" },
  hero: {
    badgeBefore: "Netwọk ụlọ ọrụ kacha mma • pịa ",
    badgeAfter: " iji chọọ",
    titleBefore: "Nyochaa azụmahịa, ọrụ na ngalaba arụmọrụ nke ",
    titleAfter: ".",
    ctaExplore: "Nyochaa ngalaba niile",
    ctaFeatured: "Hụ ngalaba a họpụtara",
  },
  introDefault: "Henry & Co. na-ewebata azụmahịa ndị lekwasị anya n'okpuru otu akara ìgwè a na-asọpụrụ. Hub a na-enyere ndị ahịa, ndị mmekọ, na ndị nwere ọrụ aka ịghọta ụlọ ọrụ ahụ, ịchọta ngalaba ziri ezi ma gaa n'ihu n'obi ụtọ.",
  brandPanel: { eyebrow: "Sistemụ akara ụlọ ọrụ", baseDomain: "Domain bụ isi", accent: "Ọcha nkọwa", logoStatus: "Ọnọdụ akara", logoConfigured: "Atọhapụtara", logoFallback: "Akara mbu" },
  stats: { divisions: "Ngalaba", activeNow: "Na-arụ ọrụ ugbu a", comingSoon: "Na-abịa n'oge na-adịghị anya", sectors: "Ngalaba ọrụ" },
  standardCard: {
    eyebrow: "Ọkọlọtọ ìgwè",
    title: "Ọkọlọtọ nke otu n'ime ngalaba ọ bụla.",
    bullets: [
      "Ngalaba ọ bụla na-arụ ọrụ n'ọhụụ ahịa ya n'oge na-egosipụta ọkọlọtọ nke ìgwè Henry & Co. ka ọ bụ.",
      "Hub ụlọ ọrụ na-enyere ndị ọbịa aka ịghọta ebe ha ga-aga, onye ha ga-ejikọ ọnụ na otu ìgwè ahụ si edozi.",
      "Ka ụlọ ọrụ ahụ na-eto eto, enwere ike iwebata ngalaba ọhụụ n'ime usoro doro anya na a pụrụ ịdabere ya.",
      "Nsonaazụ bụ nnabata ọha ka siri ike, ọganihu ka mma, na ahụmịhe ka ọ dị ọcha n'oge ọ bụla.",
    ],
    latestUpdate: "Nkọwa ụlọ ọrụ ikpeazụ",
    operatingStandard: "Ọkọlọtọ arụmọrụ",
    operatingStandardValue: "Họrọ ma na-edozi",
    spotlightEyebrow: "Ọkụ ugbu a",
    spotlightFallback: "Ngalaba Henry & Co. a họpụtara na-anọchite anya ìgwè ahụ n'ụzọ doro anya.",
    featured: "A họpụtara",
    viewDetails: "Hụ nkọwa",
    visitDivision: "Gaa ngalaba ahụ",
    serverError: "A na-emelite ụfọdụ ozi ugbu a.",
  },
  premiumRow: {
    discovery: { eyebrow: "Nchọpụta", title: "Duzie ndị mmadụ gaa azụmahịa ziri ezi", text: "Hub na-ewepụ ihe na-enweghị ọdịmma, na-agbali ntụkwasị obi ma na-enyere ndị ọbịa ọ bụla aka iru ngalaba Henry & Co. kacha mkpa." },
    corporate: { eyebrow: "Nnọchiteanya ụlọ ọrụ", title: "Gosipụta ìgwè ahụ n'ụzọ ín oshi", text: "Ókè ọha a na-akwado okike ụlọ ọrụ, nkwurita okwu ka ọ dị mma, na nnabata ìgwè ka ọ siri ike n'oge ọ bụla." },
    scale: { eyebrow: "Ikike ịgbatị", title: "Wuru maka uto na nsonaazụ", text: "Ka ìgwè ahụ na-eto eto, enwere ike iwebata azụmahịa ọhụụ na peeji ụlọ ọrụ n'ime otu ihe mgbochi kacha mma." },
  },
  featuredSection: { eyebrow: "Ngalaba a họpụtara", title: "Ngalaba a họpụtara na-anọchite anya ìgwè ahụ ugbu a", body: "Azụmahịa ndị a na-ejere ọrụ dị ka ọnụ ụzọ ọha ndị bụ isi n'ìgwè Henry & Co. ugbu a.", viewDirectory: "Hụ ndepụta niile" },
  directory: {
    eyebrow: "Ndepụta",
    title: "Chọta azụmahịa Henry & Co. ziri ezi",
    body: "Chọọ site n'aha ngalaba, ụdị, nlebara anya ọrụ, ma ọ bụ nlebara anya azụmahịa. Ndepụta a dị maka inyere ndị mmadụ aka iga n'oge na n'obi ụtọ gaa akụkụ ziri ezi nke ụlọ ọrụ ahụ.",
    searchPlaceholder: "Chọọ ngalaba, ọrụ, ụdị, subdomains…",
    clearSearchAria: "Hichapụ nchọọ",
    popularSectors: "Ngalaba ndị a na-ama",
    featuredOn: "Ngosipụta naanị ndị a họpụtara",
    featuredOff: "Machi ndị a họpụtara",
    allCategories: "Ụdị niile",
    filterAll: "Niile",
    filterActive: "Na-arụ ọrụ",
    filterSoon: "Na-abịa n'oge na-adịghị anya",
    filterPaused: "Akwụsịrị",
    showing: "Na-egosipụta",
    total: "Niile",
    featured: "A họpụtara",
    overviewEyebrow: "Ntọala ndepụta",
    clearAll: "Hichapụ niile",
    ready: "Dị njikere",
    activeRefinements: "Nzacha ndị na-arụ ọrụ",
    lastUpdated: "Emelitere oge ikpeazụ",
    companyPagesEyebrow: "Peeji ụlọ ọrụ",
    empty: "Ọ dịghị ngalaba dabara. Hichapụ nzacha gị ma ọ bụ gbasaa usoro nchọọ.",
  },
  ecosystem: {
    eyebrow: "Ihe kpatara o dị mkpa",
    title: "Nnabata ụlọ ọrụ doro anya na-ewu ntụkwasị obi tupu mkparịta ụka mbụ",
    body: "Hub ụlọ ọrụ arụnyere ọrụ mma na-enyere ndị mmadụ aka ịghọta nnukwu ụlọ ọrụ ahụ, mmekọahụ dị n'etiti ngalaba ya na ọkwa nchekasị n'azụ ọrụ ọ bụla.",
    bullets: ["Ntụkwasị obi akara ndi ka siri ike n'ohere ọha niile.", "Ọganihu ka mma maka ndị ahịa, ndị mmekọ, na ndị nwere ọrụ.", "Isi mmalite ka mma maka azụmahịa ọhụụ, mkpọsa, na mmekọrịta.", "Ntọala a pụrụ ịdabere ya maka nkwurita okwu ụlọ ọrụ, ndị ọchịchọ, na ndị mbadamba."],
    big: ["Otu arụmọrụ dịpụrụ adịpụ", "Ngosipụta ọkwa ụlọ ọrụ", "Dị njikere maka uto ogologo oge"],
    bigText: ["Ngalaba ọ bụla nwere ike ito site na usoro arụmọrụ ya, peeji ọha ya na ụzọ azụmahịa ya na-anọdụ n'oke ụlọ ọrụ nne ya.", "Ìgwè ahụ nwere ike ikwurịta okwu n'ụzọ ka ọ dị ín oshi, ihe ngosi ntụkwasị obi ka siri ike, na ọnọdụ doro anya n'ofe ahịa na ndị mmadụ.", "Ka ọ na-awebata ngalaba ọhụụ na ihe omume ọha, ụlọ ọrụ ahụ nwere ike ịga n'ihu na-agbasawanye."],
  },
  access: {
    eyebrow: "Ohere ụlọ ọrụ",
    title: "Ihe niile na-amalite site na nzụlite mbụ doro anya",
    body: "Ma ọ bụ onye chọpụta ụlọ ọrụ ahụ n'oge mbụ ma ọ bụ onye na-alọghachi iji rụọ ọrụ na ngalaba a kapịtara, hub na-enye ụzọ doro anya, họrọ ọcha n'ìgwè Henry & Co. ka ọ bụ.",
    ctaPages: "Nyochaa peeji ụlọ ọrụ",
    ctaDirectory: "Hụ ndepụta",
    cards: ["Ọkọlọtọ ụlọ ọrụ", "Ọganihu ndị ahịa", "Ntụkwasị obi akara"],
    cardValues: ["Họrọ na ọ dị ọcha", "Doro anya ma duzie", "Nnabata ọha kacha mma"],
  },
  faq: { eyebrow: "A na-ajụ ajụjụ ndị a mgbe niile", title: "Ajụjụ ndị a na-ajụ mgbe niile", subtitle: "Azịza ndị a na-enyere ndị ahịa, ndị mmekọ na ndị nwere ọrụ aka ịghọta otu ụlọ ọrụ ahụ si arụ ọrụ tupu ha kpọtụrụ." },
  topBar: { search: "Chọọ hub", explore: "Nyochaa" },
  footer: { exploreDivisions: "Nyochaa ngalaba", companyPages: "Peeji ụlọ ọrụ", colHub: "Hub ụlọ ọrụ", colGlobal: "Peeji zuru ụwa ọnụ" },
  cards: {
    divisionFallbackLong: "Ngalaba Henry & Co. e wuru iji jụ ahịa lekwasịrị anya n'ụzọ doro anya na ngosipụta kacha mma.",
    divisionFallbackShort: "Ngalaba Henry & Co. lekwasịrị anya gosipụtara dị ka akara arụmọrụ nke nọ n'onwe ya n'ime ikike ụlọ ọrụ ka ọ bụ.",
    destination: "Ebe ọ na-aga", notConfigured: "Atọhapụtabeghị ya", openDivision: "Mepee ngalaba", divisionDestination: "Ebe ngalaba na-aga", lead: "Onye ndu", details: "Nkọwa", open: "Mepe", featured: "A họpụtara",
  },
  modal: {
    closeAria: "Mechie", enterDivision: "Bata ngalaba", kpiStatus: "Ọnọdụ", kpiSubdomain: "Subdomain", kpiFeatured: "A họpụtara", kpiUpdated: "Emelitere", kpiYes: "Ee", kpiNo: "Mba",
    who: "Onye ọ na-ejere ọrụ", how: "Otu ọ si arụ ọrụ", trust: "Ihe kpatara ndị ahịa na-ahọrọ ya", highlights: "Ihe kachasị mma", leadEyebrow: "Onye ndu ngalaba", leadFallbackTitle: "Profaịlụ ndu", links: "Njikọ",
  },
  faqFallback: [
    { q: "Enwere m ike iga ozugbo n'ime ngalaba na-amalitebeghị n'ibe a?", a: "Ee. Enwere ike iru ngalaba ọ bụla ozugbo site n'ebe ya. Hub a dị iji mee ka ịghọta ụlọ ọrụ ka ọ bụ dị mfe ma enyere ndị ọbịa aka iru azụmahịa ziri ezi ngwa ngwa." },
    { q: "Ọ ga-adị ngalaba ndị ọzọ ebe a ka ụlọ ọrụ na-eto eto?", a: "Ee. Ka Henry & Co. na-agbasawanye, enwere ike iwebata ngalaba ọhụụ site n'otu usoro ụlọ ọrụ ahụ ka ahụmịhe ọha nọdụ doro anya, họrọ ma dị njikere." },
    { q: "Maka onye e wuru saịtị a?", a: "Hub na-ejere ọrụ ndị ahịa, ndị mmekọ, ndị na-enye ngwaahịa, ndị ọchịchọ, ndị nka, na ndị nwere ọrụ ndị chọrọ ọhụụ doro anya nke ìgwè Henry & Co. na azụmahịa ya na-arụ ọrụ." },
    { q: "Kedu peeji ụlọ ọrụ m kwesịrị nyochaa ụzọ mbụ?", a: "Isi mmalite ndị kacha mma bụ peeji Maka anyị, Kpọtụrụ anyị, Ọkwa Nzuzo, na Usoro na Ọnọdụ. Ọ bụ ọnụ ọgụgụ, ha na-enye ọhụụ doro anya nke ụlọ ọrụ, ọkọlọtọ ya, na iwu ya n'ọha." },
  ],
};

const HUB_HOME_COPY_YO: Partial<HubHomeCopy> = {
  nav: { featured: "Àwọn tí a yàn", directory: "Àtọ́kàn", company: "Ilé-iṣẹ́", faq: "Àwọn ìbéèrè tó máa ń wọ́pọ̀", about: "Nípa wa", contact: "Kàn sí wa" },
  companyPages: { about: "Nípa Henry & Co.", contact: "Kàn sí ilé-iṣẹ́", privacy: "Ìkìlọ̀ ìpamọ́", terms: "Àwọn òfin àti ìpèsè" },
  status: { active: "Ń ṣiṣẹ́", comingSoon: "Máa wá ní kùtùkùtù", paused: "Dúró dè" },
  hero: {
    badgeBefore: "Nẹ́tíwọ̀ọ̀kì ilé-iṣẹ́ àgbéga • tẹ ",
    badgeAfter: " láti wá",
    titleBefore: "Ṣàwárí àwọn iṣẹ́-ṣe, iṣẹ́, àti àwọn ẹ̀ka iṣẹ́ ti ",
    titleAfter: ".",
    ctaExplore: "Ṣàwárí gbogbo àwọn ẹ̀ka",
    ctaFeatured: "Wo àwọn ẹ̀ka tí a yàn",
  },
  introDefault: "Henry & Co. ń kojọ àwọn iṣẹ́-ṣe tó dójútì sí abẹ́ ìdánimọ̀ ìjọ tí wọn bọ̀wọ̀ fún. Hub yìí ń ràn àwọn oníbàárà, àwọn alábàákẹ́gbẹ́, àti àwọn tó ní àfikún lọ́wọ́ láti mọ ilé-iṣẹ́, wá ẹ̀ka tó péye, tí wọ́n sì máa ń rìnrìn àjò pẹ̀lú ìgboyà.",
  brandPanel: { eyebrow: "Ètò àmi ilé-iṣẹ́", baseDomain: "Domein ìpìlẹ̀", accent: "Àwọ̀ àkíyèsí", logoStatus: "Ipò àmì ìdánimọ̀", logoConfigured: "Tí a ṣètò", logoFallback: "Àmì ìfiṣe" },
  stats: { divisions: "Àwọn ẹ̀ka", activeNow: "Ń ṣiṣẹ́ báyìí", comingSoon: "Máa wá ní kùtùkùtù", sectors: "Àwọn ẹ̀ka iṣẹ́" },
  standardCard: {
    eyebrow: "Ìtọ́kasí ìjọ",
    title: "Ìtọ́kasí tí kò yàtọ̀ ní gbogbo ẹ̀ka.",
    bullets: [
      "Ẹ̀ka kọ̀ọ̀kan ń ṣiṣẹ́ pẹ̀lú ìdájú ọjà tirẹ̀ nígbà tí ó ń ṣàfihàn ìtọ́kasí ìjọ Henry & Co. tó gbòòrò.",
      "Hub ilé-iṣẹ́ ń ràn àwọn àlejò lọ́wọ́ láti mọ ibi tí wọn gbọdọ̀ lọ, ẹni tí wọn gbọdọ̀ ṣe àjọṣe pẹ̀lú, àti bí a ṣe ṣètò ìjọ.",
      "Bí ilé-iṣẹ́ ṣe ń gbilẹ̀, àwọn ẹ̀ka tuntun lè jẹ́ mọ̀ sí abẹ́ ètò tó mọ̀ àti tí a gbára lé.",
      "Èyí yọrísí ìhànjú àwùjọ tó pọ̀ sí i, ìtọ́nisọ́nà tó dára jùlọ, àti ìrírí tó dára jùlọ ní gbogbo ọ̀nà ìfọwọ́kan.",
    ],
    latestUpdate: "Ìmúdójú-ìwọ̀ ilé-iṣẹ́ tó gbẹ̀yìn",
    operatingStandard: "Ìtọ́kasí ìṣiṣẹ́",
    operatingStandardValue: "Tó ní ìbámu tí a sì ń tọ́jú",
    spotlightEyebrow: "Àfiyèsí lọ́wọ́lọ́wọ́",
    spotlightFallback: "Ẹ̀ka Henry & Co. tí a yàn tó ń ṣàfihàn ìjọ pẹ̀lú ìmọ̀ àti ìdájú.",
    featured: "Tí a yàn",
    viewDetails: "Wo àwọn alaye",
    visitDivision: "Ṣèbẹ̀wò ẹ̀ka",
    serverError: "Àwọn ìsọfúnni kan ń jẹ́ mímúdójú-ìwọ̀.",
  },
  premiumRow: {
    discovery: { eyebrow: "Ìṣàwárí", title: "Darí àwọn ènìyàn sí iṣẹ́ tó péye", text: "Hub ń yọ àwọn ìdásọ́tọ̀, ń fẹ̀ mọ ìgbẹ́kẹ̀lé, tí ó sì ń ràn àlejò kọ̀ọ̀kan lọ́wọ́ láti dé ẹ̀ka Henry & Co. tó kàn jù lọ̀ láìní ìdarúdàpọ̀." },
    corporate: { eyebrow: "Ìhànjú ilé-iṣẹ́", title: "Ṣàgbéjáde ìjọ pẹ̀lú ìpékúnrẹrẹ", text: "Ìpele gbangba yìí ń ṣàtìlẹ́yìn fún orúkọ rere ilé-iṣẹ́, ìbáraẹniṣọ̀rọ̀ tó mọ̀ síi, àti ìdánimọ̀ ìjọ tó lágbára ní gbogbo ọ̀nà ìfọwọ́kan." },
    scale: { eyebrow: "Ìgbòòrò", title: "Tí a kọ́ fún ìdàgbàsókè àti ìtẹ̀síwájú", text: "Bí ìjọ ṣe ń gbilẹ̀, àwọn iṣẹ́-ṣe tuntun àti àwọn ojúewé ilé-iṣẹ́ lè jẹ́ mọ̀ sí abẹ́ ètò àgbéga kannáà láì fọ ìbámu." },
  },
  featuredSection: { eyebrow: "Àwọn ẹ̀ka tí a yàn", title: "Àwọn ẹ̀ka tí a yàn tó ń ṣàfihàn ìjọ lọ́wọ́lọ́wọ́", body: "Àwọn iṣẹ́-ṣe wọ̀nyí ń ṣiṣẹ́ gẹ́gẹ́ bí àwọn ọ̀nà wọlé gbangba pataki sí ìjọ Henry & Co.", viewDirectory: "Wo àtọ́kàn pípé" },
  directory: {
    eyebrow: "Àtọ́kàn",
    title: "Wá iṣẹ́-ṣe Henry & Co. tó péye",
    body: "Wá nipasẹ orúkọ ẹ̀ka, ẹ̀ka iṣẹ́, ìtẹnu iṣẹ́, tàbí ìdájú iṣẹ́-ṣe. Àtọ́kàn yìí wà láti ràn àwọn ènìyàn lọ́wọ́ láti lọ ni iyára àti pẹ̀lú ìgboyà sí apá tó péye nínú ilé-iṣẹ́.",
    searchPlaceholder: "Wá àwọn ẹ̀ka, iṣẹ́, àwọn ẹ̀ka iṣẹ́, àwọn subdomain…",
    clearSearchAria: "Pa ìwádìí mọ́",
    popularSectors: "Àwọn ẹ̀ka tó gbajúmọ̀",
    featuredOn: "Ṣàfihàn àwọn tí a yàn nìkan",
    featuredOff: "Di ẹ̀yà sí àwọn tí a yàn",
    allCategories: "Gbogbo àwọn ẹ̀ka iṣẹ́",
    filterAll: "Gbogbo",
    filterActive: "Ń ṣiṣẹ́",
    filterSoon: "Máa wá ní kùtùkùtù",
    filterPaused: "Dúró dè",
    showing: "Ń ṣàfihàn",
    total: "Àpapọ̀",
    featured: "Tí a yàn",
    overviewEyebrow: "Àkópọ̀ àtọ́kàn",
    clearAll: "Pa gbogbo rẹ̀ mọ́",
    ready: "Ṣetán",
    activeRefinements: "Àwọn àlẹ̀mọ tó ń ṣiṣẹ́",
    lastUpdated: "Ìgbà tó kẹ́yìn tí a ṣe àtúnṣe",
    companyPagesEyebrow: "Àwọn ojúewé ìpele ilé-iṣẹ́",
    empty: "A kò rí àwọn ẹ̀ka tó bá a mu. Pa àwọn àlẹ̀mọ rẹ mọ́ tàbí gbòòrò àwọn ìpèsè ìwádìí.",
  },
  ecosystem: {
    eyebrow: "Ìdí tó fi ṣe pàtàkì",
    title: "Ìhànjú ilé-iṣẹ́ tó mọ̀ síi ń ṣẹ̀dá ìgbẹ́kẹ̀lé ṣáájú ìjíròrò àkọ́kọ́",
    body: "Hub ilé-iṣẹ́ tí a ṣètò dáadáa ń ràn àwọn olùgbọ́ lọ́wọ́ láti mọ bí ìjọ ti gba gbòòrò tó, ìbáṣepọ̀ ti ó wà láàárín àwọn ẹ̀ka rẹ̀, àti ìpele ọjọgbọ́n tí ó wà lẹ́hìn iṣẹ́ kọ̀ọ̀kan.",
    bullets: ["Ìgbẹ́kẹ̀lé àmì-ìdánimọ̀ tó lágbára ní gbogbo ọ̀nà ìfọwọ́kan gbangba.", "Ìtọ́nisọ́nà tó ṣiṣẹ́ dáadáa fún àwọn oníbàárà, àwọn alábàákẹ́gbẹ́, àti àwọn olùjọpọ̀.", "Ìpìlẹ̀ tó dára jùlọ fún àwọn iṣẹ́-ṣe ọjọ́ iwájú, àwọn ìpolongo, àti àwọn ìkéde.", "Ìpìlẹ̀ tí a gbára lé fún ìbáraẹniṣọ̀rọ̀ ilé-iṣẹ́, àwọn oníròyìn, àti àwọn olùdókòwò."],
    big: ["Àwọn ẹ̀ka iṣẹ́-ṣe tí kò gbarale", "Àgbéjáde ìpele ilé-iṣẹ́", "Ṣetán fún ìdàgbàsókè ìgbà pẹ́"],
    bigText: ["Ẹ̀ka kọ̀ọ̀kan lè dàgbà nípasẹ̀ àwọn ìlànà iṣẹ́ tirẹ̀, àwọn ojúewé gbangba, àti ìtọ́nisọ́nà oní-òwò nígbà tí ó ń ṣetọrọ pẹ̀lú ilé-iṣẹ́ ìyá.", "Ìjọ lè bá àwọn ènìyàn sọ̀rọ̀ pẹ̀lú ìpékúnrẹrẹ tó pọ̀ jùlọ, àwọn àmì ìgbẹ́kẹ̀lé tó lágbára jùlọ, àti ìgbékalẹ̀ tó mọ̀ jùlọ kárí àwọn ọjà àti àwọn olùgbọ́.", "Bí a ṣe ń gbé àwọn ẹ̀ka tuntun àti àwọn iṣẹ́ gbangba jáde, ilé-iṣẹ́ lè máa ń gbòòrò láì tọrọ ìbámu."],
  },
  access: {
    eyebrow: "Ìwọlé sí ilé-iṣẹ́",
    title: "Gbogbo rẹ̀ bẹ̀rẹ̀ pẹ̀lú ìfẹnukò àkọ́kọ́ tó mọ̀ síi",
    body: "Bóyá ẹnìkan ń ṣàwárí ilé-iṣẹ́ fún ìgbà àkọ́kọ́ tàbí tó ń padà láti ṣiṣẹ́ pẹ̀lú ẹ̀ka pàtó kan, hub ń pèsè ọ̀nà tó mọ̀, tó ṣe mọlẹ̀ sí ìjọ Henry & Co. tó gbòòrò.",
    ctaPages: "Ṣàwárí àwọn ojúewé ilé-iṣẹ́",
    ctaDirectory: "Wo àtọ́kàn",
    cards: ["Ìtọ́kasí ilé-iṣẹ́", "Ìtọ́nisọ́nà oníbàárà", "Ìgbẹ́kẹ̀lé àmì-ìdánimọ̀"],
    cardValues: ["Tó ní ìbámu tí ó sì ṣọ́jọgbọ́n", "Tó mọ̀ tí a sì ń darí", "Ìhànjú àgbéga gbangba"],
  },
  faq: { eyebrow: "Tí a máa ń béèrè", title: "Àwọn ìbéèrè tó máa ń wọ́pọ̀", subtitle: "Àwọn ìdáhùn wọ̀nyí ń ràn àwọn oníbàárà, àwọn alábàákẹ́gbẹ́, àti àwọn olùjọpọ̀ lọ́wọ́ láti mọ bí ilé-iṣẹ́ ṣe ń ṣiṣẹ́ ṣáájú kí wọn to kàn sí." },
  topBar: { search: "Wá hub", explore: "Ṣàwárí" },
  footer: { exploreDivisions: "Ṣàwárí àwọn ẹ̀ka", companyPages: "Àwọn ojúewé ilé-iṣẹ́", colHub: "Hub ilé-iṣẹ́", colGlobal: "Àwọn ojúewé àgbáyé" },
  cards: {
    divisionFallbackLong: "Ẹ̀ka Henry & Co. tó ń dojú kọ gbangba tí a kọ́ láti sìn ọjà tó dájú pẹ̀lú ìmọ̀ àti àgbéjáde àgbéga.",
    divisionFallbackShort: "Ẹ̀ka tó dájú ti Henry & Co. tó jẹ́ àgbéjáde bí àmì-iṣẹ́ tó ṣiṣẹ́ nìkanṣoṣo abẹ́ ètò-ẹ̀ka ilé-iṣẹ́ tó gbòòrò.",
    destination: "Ìgbésẹ̀", notConfigured: "Kò tíì ṣètò", openDivision: "Ṣí ẹ̀ka", divisionDestination: "Ìgbésẹ̀ ẹ̀ka", lead: "Olórí", details: "Àlàyé", open: "Ṣí", featured: "Tí a yàn",
  },
  modal: {
    closeAria: "Pa dé", enterDivision: "Wọlé sí ẹ̀ka", kpiStatus: "Ipò", kpiSubdomain: "Subdomain", kpiFeatured: "Tí a yàn", kpiUpdated: "Tí a ṣe àtúnṣe", kpiYes: "Bẹ̃ẹ̃ni", kpiNo: "Bẹ́ẹ̀kọ́",
    who: "Ẹni tó ń sìn", how: "Bí ó ṣe ń ṣiṣẹ́", trust: "Ìdí tí àwọn oníbàárà fi ń yàn", highlights: "Àwọn ìfẹnukò", leadEyebrow: "Olórí ẹ̀ka", leadFallbackTitle: "Profáìlù ìdarí", links: "Àwọn ọ̀nà asopọ̀",
  },
  faqFallback: [
    { q: "Ṣé mo lè lọ tààrà sí ẹ̀ka kan láì bẹ̀rẹ̀ láti ojúewé yìí?", a: "Bẹ̃ẹ̃ni. A ṣì lè wọlé sí ẹ̀ka kọ̀ọ̀kan tààrà nípasẹ̀ ìgbésẹ̀ tirẹ̀. Hub yìí wà láti mú kí ó rọrùn láti mọ ilé-iṣẹ́ tó gbòòrò àti láti ràn àwọn àlejò lọ́wọ́ láti dé iṣẹ́-ṣe tó péye ní iyára jùlọ." },
    { q: "Ṣé àwọn ẹ̀ka àfikún yóò hàn ibí bí ilé-iṣẹ́ ṣe ń gbilẹ̀?", a: "Bẹ̃ẹ̃ni. Bí Henry & Co. ṣe ń gbòòrò, àwọn ẹ̀ka tuntun lè jẹ́ mọ̀ sí nípasẹ̀ ètò ilé-iṣẹ́ kannáà kí ìrírí gbangba máa ṣetọrọ tó mọ̀, tó ní ìbámu, tí a sì ṣètò dáadáa." },
    { q: "Fún tani a ṣe ojúewé ìntánẹ́ẹ̀tì yìí?", a: "Hub ń sìn àwọn oníbàárà, àwọn alábàákẹ́gbẹ́, àwọn olùpèsè, àwọn oníròyìn, àwọn ẹni tí wọ́n ń wá iṣẹ́, àti àwọn olùjọpọ̀ tí wọ́n nílò ìwò tó mọ̀ síi ti ìjọ Henry & Co. àti àwọn iṣẹ́-ṣe ìṣiṣẹ́ rẹ̀." },
    { q: "Àwọn ojúewé ilé-iṣẹ́ wo nì mí gbọdọ̀ tún wo àkọ́kọ́?", a: "Àwọn ìbẹ̀rẹ̀ tó dára jùlọ ni àwọn ojúewé Nípa Wa, Kàn Sí Wa, Ìkìlọ̀ Ìpamọ́, àti Àwọn Òfin àti Ìpèsè. Pọ̀pọ̀, wọ́n pèsè ìwò tó mọ̀ síi ti ilé-iṣẹ́, àwọn ìtọ́kasí rẹ̀, àti àwọn ìlànà gbangba rẹ̀." },
  ],
};

const HUB_HOME_COPY_HA: Partial<HubHomeCopy> = {
  nav: { featured: "Zaɓaɓɓu", directory: "Jerin sunayen", company: "Kamfani", faq: "Tambayoyi na kowa", about: "Game da mu", contact: "Tuntuɓi mu" },
  companyPages: { about: "Game da Henry & Co.", contact: "Tuntuɓi kamfani", privacy: "Sanarwar sirri", terms: "Sharuɗɗa da yanayi" },
  status: { active: "Aiki", comingSoon: "Zai zo ba da daɗewa ba", paused: "An daina" },
  hero: {
    badgeBefore: "Cibiyar sadarwa ta kamfanoni na musamman • danna ",
    badgeAfter: " don bincika",
    titleBefore: "Bincika kasuwancin, ayyuka, da sassan aiki na ",
    titleAfter: ".",
    ctaExplore: "Bincika dukkan sassan",
    ctaFeatured: "Duba sassan da aka zaɓa",
  },
  introDefault: "Henry & Co. tana tattara kasuwancin da ke mai da hankali ƙarƙashin sunan ƙungiya da ake girmamawa. Wannan hub yana taimaka wa abokan ciniki, abokan hulɗa, da masu ruwa da tsaki su fahimci kamfani, su nemo sasshen da ya dace, su ci gaba da kwarin gwiwa.",
  brandPanel: { eyebrow: "Tsarin alamar kamfani", baseDomain: "Domein na asali", accent: "Launi na musamman", logoStatus: "Halin tambarin", logoConfigured: "An saita", logoFallback: "Alamar madadin" },
  stats: { divisions: "Sassan", activeNow: "Aiki yanzu", comingSoon: "Zai zo ba da daɗewa ba", sectors: "Fannonin sabis" },
  standardCard: {
    eyebrow: "Ma'aunin ƙungiya",
    title: "Ma'aunin haɗaɗɗe a kowanne sashi.",
    bullets: [
      "Kowanne sashi yana aiki da nufin kasarsa na musamman yayin da yake nuna ma'aunin ƙungiyar Henry & Co. mafi girma.",
      "Hub na kamfani yana taimaka wa baƙi su fahimci inda za su je, wa za su yi mu'amala da shi, da yadda ƙungiyar take tsarawa.",
      "Yayin da kamfani ke girma, ana iya gabatar da sabbin sassan a cikin tsari bayyananne kuma mai inganci.",
      "Sakamakon shine ƙarfin kasancewar jama'a, haɓaka ya fi kyau, da ƙarin ƙwararren ƙwarewa a kowanne wurin tuntuɓi.",
    ],
    latestUpdate: "Sabon labarun kamfani",
    operatingStandard: "Ma'aunin aiki",
    operatingStandardValue: "Daidaitacce kuma an kiyaye shi",
    spotlightEyebrow: "Fitowar yanzu",
    spotlightFallback: "Sashi na Henry & Co. da aka zaɓa wanda ke wakiltar ƙungiyar da ƙarfi da manufa.",
    featured: "Zaɓaɓɓu",
    viewDetails: "Duba cikakkun bayanai",
    visitDivision: "Ziyarci sashi",
    serverError: "An na sabunta wasu bayanan yanzu.",
  },
  premiumRow: {
    discovery: { eyebrow: "Bincike", title: "Jagoranci mutane zuwa kasuwancin da ya dace", text: "Hub yana cire rudani, yana ƙarfafa amincewa, kuma yana taimaka wa kowane baƙi su isa ga mafi dacen sashi na Henry & Co. ba tare da rikicewa ba." },
    corporate: { eyebrow: "Kasancewar kamfani", title: "Gabatar da ƙungiya da balaga", text: "Wannan Layer na jama'a yana goyan bayan suna na kamfani, sadarwa mafi bayyananniya, da ƙarfin ƙungiya a kowanne wurin tuntuɓi na kasuwanci." },
    scale: { eyebrow: "Haɓaka", title: "An gina don girma da ci gaba", text: "Yayin da ƙungiyar ke girma, za a iya gabatar da sabbin kasuwancin da shafukan kamfani a cikin tsarin musamman ɗaya ba tare da raunana daidaito ba." },
  },
  featuredSection: { eyebrow: "Sassan da aka zaɓa", title: "Sassan da aka zaɓa waɗanda ke wakiltar ƙungiyar yanzu", body: "Waɗannan kasuwancin yanzu suna aiki a matsayin muhimman ƙofofin jama'a zuwa ƙungiyar Henry & Co.", viewDirectory: "Duba cikakken jerin" },
  directory: {
    eyebrow: "Jerin sunayen",
    title: "Nemo kasuwancin Henry & Co. da ya dace",
    body: "Bincika ta hanyar sunan sashi, rukunin, mai da hankali kan sabis, ko nufin kasuwanci. Wannan directory yana nan don taimaka wa mutane su matsa da sauri kuma da kwarin gwiwa zuwa sashin da ya dace na kamfani.",
    searchPlaceholder: "Bincika sassan, ayyuka, rukunoni, subdomains…",
    clearSearchAria: "Share bincike",
    popularSectors: "Fannonin da aka fi so",
    featuredOn: "Nuna zaɓaɓɓu kawai",
    featuredOff: "Iyakance ga zaɓaɓɓu",
    allCategories: "Duk rukunoni",
    filterAll: "Duka",
    filterActive: "Aiki",
    filterSoon: "Zai zo ba da daɗewa ba",
    filterPaused: "An daina",
    showing: "Ana nuna",
    total: "Jimilla",
    featured: "Zaɓaɓɓu",
    overviewEyebrow: "Taƙaitaccen jerin",
    clearAll: "Share duka",
    ready: "Shirye",
    activeRefinements: "Tacewar da ke aiki",
    lastUpdated: "An sabunta ƙarshe",
    companyPagesEyebrow: "Shafukan matakin kamfani",
    empty: "Ba a sami daidaitaccen sassan ba. Share tacewar ku ko faɗaɗa ƙa'idodin bincike.",
  },
  ecosystem: {
    eyebrow: "Dalilin da yasa yana da mahimmanci",
    title: "Ƙarin bayyananniyar kasancewar kamfani na ƙirƙira amana kafin tattaunawar farko",
    body: "Hub na kamfani da aka tsara da kyau yana taimaka wa masu sauraro su fahimci faɗin kamfani, alaƙar da ke tsakanin sassansa, da matakin ƙwarewa a bayan kowanne sabis.",
    bullets: ["Ƙarfin amincewa da alama a duk wuraren tuntuɓi na jama'a.", "Tafiyarwa mafi tasiri ga abokan ciniki, abokan hulɗa, da masu ruwa da tsaki.", "Mafi kyawun tushe ga kasuwancin gaba, kamfen, da sanarwa.", "Ingantaccen tushe don sadarwa ta kamfani, kafofin watsa labarai, da masu saka hannun jari."],
    big: ["Sassan kasuwanci masu zaman kansu", "Gabatarwa ta matakin kamfani", "An shirya don girma na dogon lokaci"],
    bigText: ["Kowanne sashi na iya girma ta hanyar ayyukansa na musamman, shafukan jama'a, da alkiblar kasuwanci yayin da yake iyakance da kamfanin uwa.", "Ƙungiyar na iya sadarwa da cikakkiyar balaga, alamomin amana masu ƙarfi, da ƙarin bayyananniyar matsayi a duk kasuwanni da masu sauraro.", "Yayin da ake gabatar da sabbin sassan da yunƙurin jama'a, kamfani na iya ci gaba da faɗaɗa ba tare da yin ɓarna daidaito ba."],
  },
  access: {
    eyebrow: "Shiga kamfani",
    title: "Komai yana farawa da ƙarin bayyananniyar ra'ayi na farko",
    body: "Ko dai wani yana gano kamfani a karon farko ko yana dawowa don yin aiki da wani sashi na musamman, hub yana ba da hanya bayyananniya, ta goge zuwa ƙungiyar Henry & Co. mafi girma.",
    ctaPages: "Bincika shafukan kamfani",
    ctaDirectory: "Duba jerin",
    cards: ["Ma'aunin kamfani", "Haɓakar abokin ciniki", "Amincewa da alama"],
    cardValues: ["Daidaitacce kuma ƙwararren", "Bayyananne kuma jagora", "Kasancewar jama'a na musamman"],
  },
  faq: { eyebrow: "Ana tambaya akai-akai", title: "Tambayoyin da ake yi akai-akai", subtitle: "Waɗannan amsoshi suna taimaka wa abokan ciniki, abokan hulɗa, da masu ruwa da tsaki su fahimci yadda kamfani ke aiki kafin su tuntuɓa." },
  topBar: { search: "Bincika hub", explore: "Bincika" },
  footer: { exploreDivisions: "Bincika sassan", companyPages: "Shafukan kamfani", colHub: "Hub na kamfani", colGlobal: "Shafukan duniya" },
  cards: {
    divisionFallbackLong: "Sashi na Henry & Co. da ke fuskanta jama'a da aka gina don sabis ɗin kasuwancin da ke mai da hankali da ƙarfi kuma gabatarwa na musamman.",
    divisionFallbackShort: "Sashi mai mai da hankali na Henry & Co. da aka gabatar a matsayin alamar aiki mai zaman kanta a cikin tsarin kamfani mafi girma.",
    destination: "Wurin zuwa", notConfigured: "Ba a saita tukuna", openDivision: "Buɗe sashi", divisionDestination: "Wurin zuwa na sashi", lead: "Shugaba", details: "Cikakkun bayanai", open: "Buɗe", featured: "Zaɓaɓɓu",
  },
  modal: {
    closeAria: "Rufe", enterDivision: "Shiga sashi", kpiStatus: "Halin", kpiSubdomain: "Subdomain", kpiFeatured: "Zaɓaɓɓu", kpiUpdated: "An sabunta", kpiYes: "Eh", kpiNo: "A'a",
    who: "Wa yake yi masa sabis", how: "Yadda yake aiki", trust: "Dalilin da abokan ciniki ke zaɓa", highlights: "Manyan abubuwa", leadEyebrow: "Shugaban sashi", leadFallbackTitle: "Bayanan shugabanci", links: "Hanyoyin haɗi",
  },
  faqFallback: [
    { q: "Zan iya zuwa kai tsaye zuwa sashi ba tare da farawa daga wannan shafi ba?", a: "Eh. Ana iya shiga kowanne sashi kai tsaye ta hanyar wurinsa. Wannan hub yana nan don sauƙaƙa fahimtar ƙungiyar mafi girma kuma taimaka wa baƙi su isa kasuwancin da ya dace da sauri." },
    { q: "Shin za a sami ƙarin sassan a nan yayin da kamfani ke girma?", a: "Eh. Yayin da Henry & Co. ke faɗaɗa, ana iya gabatar da sabbin sassan ta tsarin kamfani ɗaya don ƙwarewar jama'a ta kasance bayyananniya, daidaitacciya, da yadda ya kamata ta tsarawa." },
    { q: "Ga wa aka tsara wannan gidan yanar gizo?", a: "Hub yana sabis ga abokan ciniki, abokan hulɗa, masu ba da kayayyaki, kafofin watsa labarai, ƙwararru, da masu ruwa da tsaki waɗanda ke buƙatar ƙarin bayyananniyar ra'ayi na ƙungiyar Henry & Co. da kasuwancinta na aiki." },
    { q: "Waɗanne shafukan kamfani ya kamata na duba da farko?", a: "Mafi kyawun wuraren farawa sune shafukan Game da Mu, Tuntuɓa Mu, Sanarwar Sirri, da Sharuɗɗa da Yanayi. Tare, suna ba da ƙarin bayyananniyar ra'ayi na kamfani, ma'aunansa, da manufofinsa na jama'a." },
  ],
};

const HUB_HOME_COPY_IT: Partial<HubHomeCopy> = {
  "nav": {
    "featured": "In primo piano",
    "directory": "Directory",
    "company": "Azienda",
    "faq": "Domande frequenti",
    "about": "Chi siamo",
    "contact": "Contatto"
  },
  "companyPages": {
    "about": "Informazioni su Henry & Co.",
    "contact": "Contatta l'azienda",
    "privacy": "Informativa sulla privacy",
    "terms": "Termini e condizioni"
  },
  "status": {
    "active": "Attivo",
    "comingSoon": "Prossimamente",
    "paused": "In pausa"
  },
  "hero": {
    "badgeBefore": "Rete aziendale premium • premi",
    "badgeAfter": " per cercare",
    "titleBefore": "Esplora le attività, i servizi e le divisioni operative di",
    "titleAfter": ".",
    "ctaExplore": "Esplora tutte le divisioni",
    "ctaFeatured": "Visualizza le divisioni in primo piano"
  },
  "introDefault": "Henry & Co. riunisce aziende mirate sotto un'identità di gruppo rispettata. Questo hub aiuta clienti, partner e stakeholder a comprendere l'azienda, individuare la divisione giusta e andare avanti con sicurezza.",
  "brandPanel": {
    "eyebrow": "Sistema di marchi aziendali",
    "baseDomain": "Dominio di base",
    "accent": "Accento",
    "logoStatus": "Stato del logo",
    "logoConfigured": "Configurato",
    "logoFallback": "Marchio di riserva"
  },
  "stats": {
    "divisions": "Divisioni",
    "activeNow": "Attivo adesso",
    "comingSoon": "Prossimamente",
    "sectors": "Settori dei servizi"
  },
  "standardCard": {
    "eyebrow": "Norma del gruppo",
    "title": "Uno standard unificato in ogni divisione.",
    "bullets": [
      "Ciascuna divisione opera con il proprio focus sul mercato riflettendo al tempo stesso gli standard del gruppo Henry & Co. più ampio.",
      "L'hub aziendale aiuta i visitatori a capire dove andare, chi coinvolgere e come è organizzato il gruppo.",
      "Man mano che l'azienda si espande, nuove divisioni possono essere introdotte all'interno di un'unica struttura chiara e credibile.",
      "Il risultato è una presenza pubblica più forte, una migliore navigazione e un'esperienza più professionale in ogni punto di contatto."
    ],
    "latestUpdate": "Ultimo aggiornamento aziendale",
    "operatingStandard": "Norma operativa",
    "operatingStandardValue": "Coerente e mantenuto",
    "spotlightEyebrow": "Riflettori attuali",
    "spotlightFallback": "Una divisione Henry & Co. in primo piano che rappresenta il gruppo con chiarezza e concentrazione.",
    "featured": "In primo piano",
    "viewDetails": "Visualizza i dettagli",
    "visitDivision": "Divisione visite",
    "serverError": "Alcune informazioni sono attualmente in fase di aggiornamento."
  },
  "premiumRow": {
    "discovery": {
      "eyebrow": "Scoperta",
      "title": "Indirizza le persone al business giusto",
      "text": "L'hub rimuove le ambiguità, rafforza la fiducia e aiuta ogni visitatore a raggiungere la divisione Henry & Co. più pertinente senza confusione."
    },
    "corporate": {
      "eyebrow": "Presenza aziendale",
      "title": "Presentare il gruppo con maturità",
      "text": "Questo livello pubblico supporta la reputazione dell’azienda, una comunicazione più chiara e un’identità più forte a livello di gruppo in ogni punto di contatto affacciato sul mercato."
    },
    "scale": {
      "eyebrow": "Scalabilità",
      "title": "Costruito per la crescita e la continuità",
      "text": "Man mano che il gruppo cresce, nuove attività e pagine aziendali possono essere introdotte all'interno dello stesso quadro premium senza indebolire la coerenza."
    }
  },
  "featuredSection": {
    "eyebrow": "Divisioni in primo piano",
    "title": "Divisioni selezionate che attualmente rappresentano il gruppo",
    "body": "Queste attività fungono attualmente da principali punti di accesso pubblico al gruppo Henry & Co.",
    "viewDirectory": "Visualizza l'elenco completo"
  },
  "directory": {
    "eyebrow": "Directory",
    "title": "Individua l'attività Henry & Co. giusta",
    "body": "Cerca per nome della divisione, categoria, enfasi sul servizio o focus aziendale. Questa directory esiste per aiutare le persone a spostarsi rapidamente e con sicurezza nella parte giusta dell'azienda.",
    "searchPlaceholder": "Cerca divisioni, servizi, categorie, sottodomini...",
    "clearSearchAria": "Cancella ricerca",
    "popularSectors": "Settori popolari",
    "featuredOn": "Mostra solo in primo piano",
    "featuredOff": "Limita a in primo piano",
    "allCategories": "Tutte le categorie",
    "filterAll": "Tutto",
    "filterActive": "Attivo",
    "filterSoon": "Prossimamente",
    "filterPaused": "In pausa",
    "showing": "Mostrare",
    "total": "Totale",
    "featured": "In primo piano",
    "overviewEyebrow": "Panoramica della directory",
    "clearAll": "Cancella tutto",
    "ready": "Pronto",
    "activeRefinements": "Raffinamenti attivi",
    "lastUpdated": "Ultimo aggiornamento",
    "companyPagesEyebrow": "Pagine a livello aziendale",
    "empty": "Non è stata trovata alcuna divisione corrispondente. Cancella i filtri o amplia i criteri di ricerca."
  },
  "ecosystem": {
    "eyebrow": "Perché questo è importante",
    "title": "Una presenza aziendale più chiara crea fiducia già prima della prima conversazione",
    "body": "Un hub aziendale ben strutturato aiuta il pubblico a comprendere la portata dell'azienda, la relazione tra le sue divisioni e il livello di professionalità dietro ogni servizio.",
    "bullets": [
      "Maggiore fiducia nel marchio in tutti i punti di contatto pubblici.",
      "Routing più efficiente per clienti, partner e stakeholder.",
      "Una base migliore per attività, campagne e annunci futuri.",
      "Una base credibile per la comunicazione rivolta all'azienda, ai media e agli investitori."
    ],
    "big": [
      "Unità aziendali indipendenti",
      "Presentazione di livello aziendale",
      "Preparati per una crescita a lungo termine"
    ],
    "bigText": [
      "Ogni divisione può crescere attraverso i propri flussi di lavoro, pagine pubbliche e direzione commerciale pur rimanendo allineata con la società madre.",
      "Il gruppo può comunicare con maggiore maturità, segnali di fiducia più forti e un posizionamento più chiaro nei mercati e nel pubblico.",
      "Con l’introduzione di nuove divisioni e iniziative pubbliche, l’azienda può continuare ad espandersi senza compromettere la coerenza."
    ]
  },
  "access": {
    "eyebrow": "Accesso aziendale",
    "title": "Tutto inizia con una prima impressione più chiara",
    "body": "Che qualcuno scopra l'azienda per la prima volta o ritorni a lavorare con una divisione specifica, l'hub fornisce un percorso chiaro e raffinato verso il gruppo Henry & Co. più ampio.",
    "ctaPages": "Esplora le pagine aziendali",
    "ctaDirectory": "Visualizza l'elenco",
    "cards": [
      "Standard aziendale",
      "Navigazione del cliente",
      "Fiducia nel marchio"
    ],
    "cardValues": [
      "Coerente e professionale",
      "Chiaro e guidato",
      "Presenza pubblica premium"
    ]
  },
  "faq": {
    "eyebrow": "Chiesto frequentemente",
    "title": "Domande frequenti",
    "subtitle": "Queste risposte aiutano i clienti, i partner e le parti interessate a comprendere come funziona l'azienda prima che abbiano bisogno di contattarli."
  },
  "topBar": {
    "search": "Centro di ricerca",
    "explore": "Esplora"
  },
  "footer": {
    "exploreDivisions": "Esplora le divisioni",
    "companyPages": "Pagine aziendali",
    "colHub": "Polo aziendale",
    "colGlobal": "Pagine globali"
  },
  "cards": {
    "divisionFallbackLong": "Una divisione Henry & Co. rivolta al pubblico, creata per servire un mercato mirato con chiarezza e presentazione premium.",
    "divisionFallbackShort": "Una divisione Henry & Co. focalizzata presentata come un marchio operativo indipendente all'interno del più ampio ecosistema aziendale.",
    "destination": "Destinazione",
    "notConfigured": "Non ancora configurato",
    "openDivision": "Divisione aperta",
    "divisionDestination": "Destinazione della Divisione",
    "lead": "Piombo",
    "details": "Dettagli",
    "open": "Aperto",
    "featured": "In primo piano"
  },
  "modal": {
    "closeAria": "Chiudi",
    "enterDivision": "Inserisci la divisione",
    "kpiStatus": "Stato",
    "kpiSubdomain": "Sottodominio",
    "kpiFeatured": "In primo piano",
    "kpiUpdated": "Aggiornato",
    "kpiYes": "Sì",
    "kpiNo": "No",
    "who": "A chi serve",
    "how": "Come funziona",
    "trust": "Perché i clienti lo scelgono",
    "highlights": "Punti salienti",
    "leadEyebrow": "Guida della divisione",
    "leadFallbackTitle": "Profilo dirigenziale",
    "links": "Collegamenti"
  },
  "faqFallback": [
    {
      "q": "Posso andare direttamente ad una divisione senza partire da questa pagina?",
      "a": "Sì. Ad ogni divisione è comunque possibile accedere direttamente attraverso la propria destinazione. Questo hub esiste per rendere più semplice la comprensione dell'azienda nel suo insieme e per aiutare i visitatori a raggiungere più rapidamente l'azienda giusta."
    },
    {
      "q": "Verranno visualizzate ulteriori divisioni man mano che l'azienda cresce?",
      "a": "Sì. Man mano che Henry & Co. si espande, nuove divisioni possono essere introdotte attraverso la stessa struttura aziendale in modo che l'esperienza pubblica rimanga chiara, coerente e ben organizzata."
    },
    {
      "q": "Per chi è progettato questo sito web?",
      "a": "L'hub è al servizio di clienti, partner, fornitori, media, talenti e parti interessate che necessitano di una visione più chiara del gruppo Henry & Co. e delle sue attività operative."
    },
    {
      "q": "Quali pagine aziendali dovrei rivedere per prime?",
      "a": "I migliori punti di partenza sono le pagine Informazioni, Contatti, Informativa sulla privacy e Termini e condizioni. Insieme, forniscono una visione più chiara dell’azienda, dei suoi standard e delle sue politiche pubbliche."
    }
  ]
};

const HUB_HOME_LOCALE_MAP: Partial<Record<AppLocale, Partial<HubHomeCopy>>> = {
  fr: HUB_HOME_COPY_FR,
  es: HUB_HOME_COPY_ES,
  pt: HUB_HOME_COPY_PT,
  ar: HUB_HOME_COPY_AR,
  ig: HUB_HOME_COPY_IG,
  yo: HUB_HOME_COPY_YO,
  ha: HUB_HOME_COPY_HA,
  de: HUB_HOME_COPY_DE,
  it: HUB_HOME_COPY_IT,
  zh: HUB_HOME_COPY_ZH,
  hi: HUB_HOME_COPY_HI,
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
