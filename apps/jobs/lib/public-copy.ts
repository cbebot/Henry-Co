import type { AppLocale } from "@henryco/i18n/server";

export type JobsPublicCopy = {
  shell: {
    browseOpenJobs: string;
    hiring: string;
    account: string;
    candidateHome: string;
    applications: string;
    savedJobs: string;
    employerWorkspace: string;
    recruiters: string;
    careers: string;
    discover: string;
    forTeams: string;
    henryCo: string;
    jobs: string;
    talent: string;
    trust: string;
    help: string;
    groupHub: string;
    internalCareers: string;
  };
  home: {
    kicker: string;
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    searchButton: string;
    tryLabel: string;
    featuredRoles: string;
    featuredRolesLink: string;
    differentiators: string;
    ready: string;
    browseAllJobs: string;
    hiringHowItWorks: string;
    browseJobs: string;
    myAccount: string;
    candidateHub: string;
    hireWithHenryCo: string;
    safetyTrust: string;
    pathsTitle: string;
  };
  browse: {
    searchPlaceholder: string;
    searchButton: string;
    popularStartingPoints: string;
    filters: {
      category: string;
      location: string;
      workMode: string;
      roleType: string;
      allCategories: string;
      anyMode: string;
      anyType: string;
      verifiedOnly: string;
      internalOnly: string;
      filters: string;
      tapToExpand: string;
    };
    suggestions: {
      remote: string;
      hybrid: string;
      verifiedOnly: string;
      fullTime: string;
      lagos: string;
      internalHenryCo: string;
    };
  };
  card: {
    internal: string;
    verifiedEmployer: string;
    featured: string;
    highTrust: string;
    response: string;
    applicants: string;
    soFar: string;
    compensation: string;
    verified: string;
    inProgress: string;
    posted: string;
    viewRole: string;
  };
};

const EN: JobsPublicCopy = {
  shell: {
    browseOpenJobs: "Browse open jobs",
    hiring: "I'm hiring",
    account: "HenryCo account",
    candidateHome: "Candidate home",
    applications: "Applications",
    savedJobs: "Saved jobs",
    employerWorkspace: "Employer workspace",
    recruiters: "Recruiters",
    careers: "Careers",
    discover: "Discover",
    forTeams: "For teams",
    henryCo: "HenryCo",
    jobs: "Jobs",
    talent: "Talent",
    trust: "Trust",
    help: "Help",
    groupHub: "Group Hub",
    internalCareers: "Internal Careers",
  },
  home: {
    kicker: "HenryCo Jobs",
    title: "Hiring, verified talent, without the usual noise.",
    subtitle:
      "Whether you are hiring or looking, you get plain language, obvious next steps, and a team that checks employers and posts where it matters-so fewer fake listings and fewer dead-end applications.",
    searchPlaceholder: "Role, skill, or company",
    searchButton: "Search jobs",
    tryLabel: "Try:",
    featuredRoles: "Featured roles",
    featuredRolesLink: "See everything",
    differentiators: "What makes this board different",
    ready: "Ready?",
    browseAllJobs: "Browse jobs",
    hiringHowItWorks: "I'm hiring - how it works",
    browseJobs: "Browse jobs",
    myAccount: "My HenryCo account",
    candidateHub: "Candidate hub",
    hireWithHenryCo: "Hire with HenryCo",
    safetyTrust: "Safety & trust",
    pathsTitle: "Pick the one that fits today.",
  },
  browse: {
    searchPlaceholder: "Try a role, skill, team, or company name",
    searchButton: "Search",
    popularStartingPoints: "Popular starting points",
    filters: {
      category: "Category",
      location: "Location",
      workMode: "Work mode",
      roleType: "Role type",
      allCategories: "All categories",
      anyMode: "Any mode",
      anyType: "Any type",
      verifiedOnly: "Verified employers only",
      internalOnly: "Internal HenryCo roles only",
      filters: "Filters",
      tapToExpand: "Tap to expand",
    },
    suggestions: {
      remote: "Remote",
      hybrid: "Hybrid",
      verifiedOnly: "Verified only",
      fullTime: "Full-time",
      lagos: "Lagos",
      internalHenryCo: "Internal HenryCo",
    },
  },
  card: {
    internal: "Internal",
    verifiedEmployer: "Verified employer",
    featured: "Featured",
    highTrust: "High trust",
    response: "response",
    applicants: "Applicants",
    soFar: "so far",
    compensation: "Compensation discussed in process",
    verified: "Verified employer",
    inProgress: "Verification in progress",
    posted: "Posted",
    viewRole: "View role",
  },
};

const FR: Partial<JobsPublicCopy> = {
  shell: {
    browseOpenJobs: "Voir les offres",
    hiring: "Je recrute",
    account: "Compte HenryCo",
    candidateHome: "Accueil candidat",
    applications: "Candidatures",
    savedJobs: "Offres enregistrées",
    employerWorkspace: "Espace employeur",
    recruiters: "Recruteurs",
    careers: "Carrières",
    discover: "Découvrir",
    forTeams: "Pour les équipes",
    henryCo: "HenryCo",
    jobs: "Offres",
    talent: "Talents",
    trust: "Confiance",
    help: "Aide",
    groupHub: "Hub du groupe",
    internalCareers: "Carrières internes",
  },
  home: {
    kicker: "HenryCo Jobs",
    title: "Recrutement de talents vérifiés, sans le bruit habituel.",
    subtitle:
      "Que vous recrutiez ou cherchiez, vous obtenez un langage clair, des étapes évidentes et une équipe qui vérifie les employeurs et les annonces là où cela compte-pour moins de faux postes et moins de candidatures sans suite.",
    searchPlaceholder: "Poste, compétence ou entreprise",
    searchButton: "Rechercher",
    tryLabel: "Essayer :",
    featuredRoles: "Postes à la une",
    featuredRolesLink: "Voir tout",
    differentiators: "Ce qui rend ce board différent",
    ready: "Prêt ?",
    browseAllJobs: "Voir les offres",
    hiringHowItWorks: "Je recrute - comment ça marche",
    browseJobs: "Voir les offres",
    myAccount: "Mon compte HenryCo",
    candidateHub: "Espace candidat",
    hireWithHenryCo: "Recruter avec HenryCo",
    safetyTrust: "Sécurité et confiance",
    pathsTitle: "Choisissez ce qui vous convient aujourd'hui.",
  },
  browse: {
    searchPlaceholder: "Essayez un poste, une compétence, une équipe ou une entreprise",
    searchButton: "Rechercher",
    popularStartingPoints: "Points de départ populaires",
    filters: {
      category: "Catégorie",
      location: "Lieu",
      workMode: "Mode de travail",
      roleType: "Type de poste",
      allCategories: "Toutes les catégories",
      anyMode: "Tous les modes",
      anyType: "Tous les types",
      verifiedOnly: "Employeurs vérifiés uniquement",
      internalOnly: "Postes internes HenryCo uniquement",
      filters: "Filtres",
      tapToExpand: "Appuyez pour ouvrir",
    },
    suggestions: {
      remote: "Télétravail",
      hybrid: "Hybride",
      verifiedOnly: "Vérifiés uniquement",
      fullTime: "Temps plein",
      lagos: "Lagos",
      internalHenryCo: "HenryCo interne",
    },
  },
  card: {
    internal: "Interne",
    verifiedEmployer: "Employeur vérifié",
    featured: "À la une",
    highTrust: "Fort niveau de confiance",
    response: "réponse",
    applicants: "Candidats",
    soFar: "à ce jour",
    compensation: "Rémunération discutée pendant le processus",
    verified: "Employeur vérifié",
    inProgress: "Vérification en cours",
    posted: "Publié",
    viewRole: "Voir le poste",
  },
};

const ES: Partial<JobsPublicCopy> = {
  shell: {
    browseOpenJobs: "Explorar vacantes",
    hiring: "Estoy contratando",
    account: "Cuenta HenryCo",
    candidateHome: "Inicio del candidato",
    applications: "Postulaciones",
    savedJobs: "Vacantes guardadas",
    employerWorkspace: "Espacio del empleador",
    recruiters: "Reclutadores",
    careers: "Carreras",
    discover: "Descubrir",
    forTeams: "Para equipos",
    henryCo: "HenryCo",
    jobs: "Vacantes",
    talent: "Talento",
    trust: "Confianza",
    help: "Ayuda",
    groupHub: "Centro del grupo",
    internalCareers: "Carreras internas",
  },
  home: {
    kicker: "HenryCo Jobs",
    title: "Contratación de talento verificado, sin el ruido habitual.",
    subtitle:
      "Si contratas o buscas, obtienes lenguaje claro, siguientes pasos evidentes y un equipo que revisa empleadores y publicaciones donde importa-para menos anuncios falsos y menos candidaturas sin salida.",
    searchPlaceholder: "Cargo, habilidad o empresa",
    searchButton: "Buscar vacantes",
    tryLabel: "Prueba:",
    featuredRoles: "Vacantes destacadas",
    featuredRolesLink: "Ver todo",
    differentiators: "Lo que hace diferente a esta bolsa",
    ready: "¿Listo?",
    browseAllJobs: "Explorar vacantes",
    hiringHowItWorks: "Estoy contratando - cómo funciona",
    browseJobs: "Explorar vacantes",
    myAccount: "Mi cuenta HenryCo",
    candidateHub: "Panel del candidato",
    hireWithHenryCo: "Contrata con HenryCo",
    safetyTrust: "Seguridad y confianza",
    pathsTitle: "Elige la opción que encaja hoy.",
  },
  browse: {
    searchPlaceholder: "Prueba con un cargo, habilidad, equipo o empresa",
    searchButton: "Buscar",
    popularStartingPoints: "Puntos de partida populares",
    filters: {
      category: "Categoría",
      location: "Ubicación",
      workMode: "Modalidad",
      roleType: "Tipo de puesto",
      allCategories: "Todas las categorías",
      anyMode: "Cualquier modalidad",
      anyType: "Cualquier tipo",
      verifiedOnly: "Solo empleadores verificados",
      internalOnly: "Solo puestos internos de HenryCo",
      filters: "Filtros",
      tapToExpand: "Toca para expandir",
    },
    suggestions: {
      remote: "Remoto",
      hybrid: "Híbrido",
      verifiedOnly: "Solo verificados",
      fullTime: "Tiempo completo",
      lagos: "Lagos",
      internalHenryCo: "HenryCo interno",
    },
  },
  card: {
    internal: "Interno",
    verifiedEmployer: "Empleador verificado",
    featured: "Destacado",
    highTrust: "Alta confianza",
    response: "respuesta",
    applicants: "Postulantes",
    soFar: "hasta ahora",
    compensation: "Compensación se comenta durante el proceso",
    verified: "Empleador verificado",
    inProgress: "Verificación en curso",
    posted: "Publicado hace",
    viewRole: "Ver vacante",
  },
};

const PT: Partial<JobsPublicCopy> = {
  shell: {
    browseOpenJobs: "Ver vagas",
    hiring: "Estou contratando",
    account: "Conta HenryCo",
    candidateHome: "Início do candidato",
    applications: "Candidaturas",
    savedJobs: "Vagas salvas",
    employerWorkspace: "Espaço do empregador",
    recruiters: "Recrutadores",
    careers: "Carreiras",
    discover: "Descobrir",
    forTeams: "Para equipes",
    henryCo: "HenryCo",
    jobs: "Vagas",
    talent: "Talentos",
    trust: "Confiança",
    help: "Ajuda",
    groupHub: "Central do grupo",
    internalCareers: "Carreiras internas",
  },
  home: {
    kicker: "HenryCo Jobs",
    title: "Contratação de talentos verificados, sem o ruído habitual.",
    subtitle:
      "Seja para contratar ou procurar, você recebe linguagem clara, próximos passos evidentes e uma equipe que verifica empregadores e vagas onde importa-para menos anúncios falsos e menos candidaturas sem retorno.",
    searchPlaceholder: "Cargo, habilidade ou empresa",
    searchButton: "Buscar vagas",
    tryLabel: "Experimente:",
    featuredRoles: "Vagas em destaque",
    featuredRolesLink: "Ver tudo",
    differentiators: "O que torna este board diferente",
    ready: "Pronto?",
    browseAllJobs: "Ver vagas",
    hiringHowItWorks: "Estou contratando - como funciona",
    browseJobs: "Ver vagas",
    myAccount: "Minha conta HenryCo",
    candidateHub: "Área do candidato",
    hireWithHenryCo: "Contrate com HenryCo",
    safetyTrust: "Segurança e confiança",
    pathsTitle: "Escolha o que faz sentido hoje.",
  },
  browse: {
    searchPlaceholder: "Tente um cargo, habilidade, equipe ou empresa",
    searchButton: "Buscar",
    popularStartingPoints: "Pontos de partida populares",
    filters: {
      category: "Categoria",
      location: "Localização",
      workMode: "Modo de trabalho",
      roleType: "Tipo de vaga",
      allCategories: "Todas as categorias",
      anyMode: "Qualquer modo",
      anyType: "Qualquer tipo",
      verifiedOnly: "Somente empregadores verificados",
      internalOnly: "Somente vagas internas da HenryCo",
      filters: "Filtros",
      tapToExpand: "Toque para expandir",
    },
    suggestions: {
      remote: "Remoto",
      hybrid: "Híbrido",
      verifiedOnly: "Somente verificados",
      fullTime: "Tempo integral",
      lagos: "Lagos",
      internalHenryCo: "HenryCo interno",
    },
  },
  card: {
    internal: "Interno",
    verifiedEmployer: "Empregador verificado",
    featured: "Destaque",
    highTrust: "Alta confiança",
    response: "resposta",
    applicants: "Candidatos",
    soFar: "até agora",
    compensation: "Compensação discutida no processo",
    verified: "Empregador verificado",
    inProgress: "Verificação em andamento",
    posted: "Publicado há",
    viewRole: "Ver vaga",
  },
};

const AR: Partial<JobsPublicCopy> = {
  shell: {
    browseOpenJobs: "تصفح الوظائف",
    hiring: "أبحث عن توظيف",
    account: "حساب HenryCo",
    candidateHome: "الصفحة الرئيسية للمرشح",
    applications: "الطلبات",
    savedJobs: "الوظائف المحفوظة",
    employerWorkspace: "مساحة صاحب العمل",
    recruiters: "الموظفون المسؤولون عن التوظيف",
    careers: "الوظائف",
    discover: "استكشاف",
    forTeams: "للفرق",
    henryCo: "HenryCo",
    jobs: "الوظائف",
    talent: "المواهب",
    trust: "الثقة",
    help: "المساعدة",
    groupHub: "مركز المجموعة",
    internalCareers: "الوظائف الداخلية",
  },
  home: {
    kicker: "HenryCo Jobs",
    title: "توظيف مواهب موثوقة من دون الضوضاء المعتادة.",
    subtitle:
      "سواء كنت توظف أو تبحث عن عمل، تحصل على لغة واضحة وخطوات تالية مباشرة وفريق يراجع أصحاب العمل والإعلانات حيث يهم-لذلك تقل الإعلانات الوهمية وتقل الطلبات التي لا تقود إلى نتيجة.",
    searchPlaceholder: "المسمى الوظيفي أو المهارة أو الشركة",
    searchButton: "بحث عن وظائف",
    tryLabel: "جرّب:",
    featuredRoles: "الوظائف المميزة",
    featuredRolesLink: "عرض الكل",
    differentiators: "ما الذي يميز هذه المنصة",
    ready: "هل أنت مستعد؟",
    browseAllJobs: "تصفح الوظائف",
    hiringHowItWorks: "أبحث عن توظيف - كيف يعمل",
    browseJobs: "تصفح الوظائف",
    myAccount: "حسابي في HenryCo",
    candidateHub: "لوحة المرشح",
    hireWithHenryCo: "التوظيف مع HenryCo",
    safetyTrust: "الأمان والثقة",
    pathsTitle: "اختر ما يناسبك اليوم.",
  },
  browse: {
    searchPlaceholder: "جرّب مسمى وظيفي أو مهارة أو فريق أو شركة",
    searchButton: "بحث",
    popularStartingPoints: "نقاط بداية شائعة",
    filters: {
      category: "الفئة",
      location: "الموقع",
      workMode: "نمط العمل",
      roleType: "نوع الوظيفة",
      allCategories: "كل الفئات",
      anyMode: "أي نمط",
      anyType: "أي نوع",
      verifiedOnly: "أصحاب العمل الموثقون فقط",
      internalOnly: "وظائف HenryCo الداخلية فقط",
      filters: "المرشحات",
      tapToExpand: "اضغط للتوسيع",
    },
    suggestions: {
      remote: "عن بعد",
      hybrid: "هجين",
      verifiedOnly: "الموثق فقط",
      fullTime: "دوام كامل",
      lagos: "لاغوس",
      internalHenryCo: "HenryCo الداخلي",
    },
  },
  card: {
    internal: "داخلي",
    verifiedEmployer: "صاحب عمل موثق",
    featured: "مميز",
    highTrust: "ثقة عالية",
    response: "استجابة",
    applicants: "المتقدمون",
    soFar: "حتى الآن",
    compensation: "تُناقش التعويضات أثناء العملية",
    verified: "صاحب عمل موثق",
    inProgress: "التحقق جارٍ",
    posted: "نُشر منذ",
    viewRole: "عرض الوظيفة",
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, Partial<JobsPublicCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
};

function mergeDeep<T extends Record<string, unknown>>(base: T, override?: Partial<T>): T {
  if (!override) return base;
  const output: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const existing = (base as Record<string, unknown>)[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      existing &&
      typeof existing === "object" &&
      !Array.isArray(existing)
    ) {
      output[key] = mergeDeep(existing as Record<string, unknown>, value as Record<string, unknown>);
    } else {
      output[key] = value;
    }
  }
  return output as T;
}

export function getJobsPublicCopy(locale: AppLocale): JobsPublicCopy {
  return mergeDeep(EN, LOCALE_MAP[locale] as Partial<JobsPublicCopy> | undefined);
}
