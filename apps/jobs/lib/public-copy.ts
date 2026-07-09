import type { AppLocale } from "@henryco/i18n/server";
import type { DeepPartial } from "@henryco/i18n";

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
  landingWhy: {
    browseBody: string;
    safetyBody: string;
    hiringBody: string;
  };
  landingHow: {
    sectionLink: string;
    stepLabel: string;
    lookAroundTitle: string;
    lookAroundBody: string;
    signInTitle: string;
    signInBody: string;
    followTitle: string;
    followBody: string;
  };
  landingFeatured: {
    kicker: string;
    heading: string;
    differentiatorsBody: string;
  };
  landingClosing: {
    title: string;
    body: string;
  };
};

const EN: JobsPublicCopy = {
  shell: {
    browseOpenJobs: "Browse open jobs",
    hiring: "I'm hiring",
    account: "Henry Onyx account",
    candidateHome: "Candidate home",
    applications: "Applications",
    savedJobs: "Saved jobs",
    employerWorkspace: "Employer workspace",
    recruiters: "Recruiters",
    careers: "Careers",
    discover: "Discover",
    forTeams: "For teams",
    henryCo: "Henry Onyx",
    jobs: "Jobs",
    talent: "Talent",
    trust: "Trust",
    help: "Help",
    groupHub: "Group Hub",
    internalCareers: "Internal Careers",
  },
  home: {
    kicker: "Henry Onyx Jobs",
    title: "Verified hiring. No noise.",
    subtitle:
      "Plain language, clear next steps, and employers checked where it matters — so fewer fake listings for candidates, fewer dead-end applications for teams.",
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
    myAccount: "My Henry Onyx account",
    candidateHub: "Candidate hub",
    hireWithHenryCo: "Hire with Henry Onyx",
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
      internalOnly: "Internal Henry Onyx roles only",
      filters: "Filters",
      tapToExpand: "Tap to expand",
    },
    suggestions: {
      remote: "Remote",
      hybrid: "Hybrid",
      verifiedOnly: "Verified only",
      fullTime: "Full-time",
      lagos: "Lagos",
      internalHenryCo: "Internal Henry Onyx",
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
  landingWhy: {
    browseBody:
      "Search and save roles with no pressure. Apply when it feels right — we show what you have already sent.",
    safetyBody:
      "Employer verification and post review cut down scam listings before they waste anyone's week.",
    hiringBody:
      "Post with context, pass review, and run shortlist + interviews in one workspace tied to your Henry Onyx account.",
  },
  landingHow: {
    sectionLink: "How hiring works",
    stepLabel: "Step",
    lookAroundTitle: "Look around",
    lookAroundBody:
      "Search by title, category, place, and how you want to work. Save anything interesting — there is no clock.",
    signInTitle: "Sign in when you apply",
    signInBody:
      "We ask for your Henry Onyx account so applications and saves stay private and tied to you — not a throwaway email.",
    followTitle: "Follow what happens next",
    followBody:
      "Shortlisted, interview, offer — stages show up in your candidate area with guidance on what to do next.",
  },
  landingFeatured: {
    kicker: "Featured roles",
    heading: "Roles we are highlighting right now",
    differentiatorsBody:
      "No throwaway emails, no hidden fees, no black-hole applications — the differences add up.",
  },
  landingClosing: {
    title: "Browse for free. Sign in when you want to save or apply.",
    body: "Employers start with a short walkthrough so expectations stay clear. Candidates keep saves, applications, and stages in one Henry Onyx profile.",
  },
};

const FR: DeepPartial<JobsPublicCopy> = {
  shell: {
    browseOpenJobs: "Voir les offres",
    hiring: "Je recrute",
    account: "Compte Henry Onyx",
    candidateHome: "Accueil candidat",
    applications: "Candidatures",
    savedJobs: "Offres enregistrées",
    employerWorkspace: "Espace employeur",
    recruiters: "Recruteurs",
    careers: "Carrières",
    discover: "Découvrir",
    forTeams: "Pour les équipes",
    henryCo: "Henry Onyx",
    jobs: "Offres",
    talent: "Talents",
    trust: "Confiance",
    help: "Aide",
    groupHub: "Hub du groupe",
    internalCareers: "Carrières internes",
  },
  home: {
    kicker: "Henry Onyx Jobs",
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
    myAccount: "Mon compte Henry Onyx",
    candidateHub: "Espace candidat",
    hireWithHenryCo: "Recruter avec Henry Onyx",
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
      internalOnly: "Postes internes Henry Onyx uniquement",
      filters: "Filtres",
      tapToExpand: "Appuyez pour ouvrir",
    },
    suggestions: {
      remote: "Télétravail",
      hybrid: "Hybride",
      verifiedOnly: "Vérifiés uniquement",
      fullTime: "Temps plein",
      lagos: "Lagos",
      internalHenryCo: "Henry Onyx interne",
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
  landingWhy: {
    browseBody:
      "Cherchez et enregistrez des postes sans pression. Postulez quand le moment vous semble juste — vous voyez ce que vous avez déjà envoyé.",
    safetyBody:
      "La vérification des employeurs et la relecture des annonces écartent les fausses offres avant qu'elles ne gâchent votre semaine.",
    hiringBody:
      "Publiez avec du contexte, passez la relecture, et menez présélection et entretiens dans un seul espace lié à votre compte Henry Onyx.",
  },
  landingHow: {
    sectionLink: "Comment fonctionne le recrutement",
    stepLabel: "Étape",
    lookAroundTitle: "Regardez autour",
    lookAroundBody:
      "Cherchez par intitulé, catégorie, lieu, et la manière dont vous voulez travailler. Enregistrez tout ce qui vous intéresse — sans horloge.",
    signInTitle: "Connectez-vous au moment de postuler",
    signInBody:
      "Nous vous demandons votre compte Henry Onyx pour que candidatures et favoris restent privés et liés à vous — pas à une adresse jetable.",
    followTitle: "Suivez la suite des étapes",
    followBody:
      "Présélection, entretien, offre — les étapes apparaissent dans votre espace candidat, avec des indications sur la suite.",
  },
  landingFeatured: {
    kicker: "Postes à la une",
    heading: "Les postes que nous mettons en avant en ce moment",
    differentiatorsBody:
      "Pas d'adresses jetables, pas de frais cachés, pas de candidatures sans retour — les différences s'additionnent.",
  },
  landingClosing: {
    title: "Parcourez librement. Connectez-vous quand vous voulez enregistrer ou postuler.",
    body: "Les employeurs commencent par un court parcours guidé pour cadrer les attentes. Les candidats gardent favoris, candidatures et étapes dans un seul profil Henry Onyx.",
  },
};

const ES: DeepPartial<JobsPublicCopy> = {
  shell: {
    browseOpenJobs: "Explorar vacantes",
    hiring: "Estoy contratando",
    account: "Cuenta Henry Onyx",
    candidateHome: "Inicio del candidato",
    applications: "Postulaciones",
    savedJobs: "Vacantes guardadas",
    employerWorkspace: "Espacio del empleador",
    recruiters: "Reclutadores",
    careers: "Carreras",
    discover: "Descubrir",
    forTeams: "Para equipos",
    henryCo: "Henry Onyx",
    jobs: "Vacantes",
    talent: "Talento",
    trust: "Confianza",
    help: "Ayuda",
    groupHub: "Centro del grupo",
    internalCareers: "Carreras internas",
  },
  home: {
    kicker: "Henry Onyx Jobs",
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
    myAccount: "Mi cuenta Henry Onyx",
    candidateHub: "Panel del candidato",
    hireWithHenryCo: "Contrata con Henry Onyx",
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
      internalOnly: "Solo puestos internos de Henry Onyx",
      filters: "Filtros",
      tapToExpand: "Toca para expandir",
    },
    suggestions: {
      remote: "Remoto",
      hybrid: "Híbrido",
      verifiedOnly: "Solo verificados",
      fullTime: "Tiempo completo",
      lagos: "Lagos",
      internalHenryCo: "Henry Onyx interno",
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
  landingWhy: {
    browseBody:
      "Busca y guarda vacantes sin presión. Postula cuando lo sientas — verás lo que ya enviaste.",
    safetyBody:
      "La verificación de empleadores y la revisión de publicaciones recortan los anuncios falsos antes de que arruinen tu semana.",
    hiringBody:
      "Publica con contexto, supera la revisión y maneja preselección y entrevistas en un solo espacio vinculado a tu cuenta Henry Onyx.",
  },
  landingHow: {
    sectionLink: "Cómo funciona la contratación",
    stepLabel: "Paso",
    lookAroundTitle: "Echa un vistazo",
    lookAroundBody:
      "Busca por cargo, categoría, lugar y forma de trabajo. Guarda lo que te interese — no hay reloj.",
    signInTitle: "Inicia sesión cuando postules",
    signInBody:
      "Pedimos tu cuenta Henry Onyx para que postulaciones y guardados queden privados y vinculados a ti — no a un correo desechable.",
    followTitle: "Sigue lo que pasa después",
    followBody:
      "Preseleccionado, entrevista, oferta — las etapas aparecen en tu panel de candidato con guía sobre el siguiente paso.",
  },
  landingFeatured: {
    kicker: "Vacantes destacadas",
    heading: "Los puestos que destacamos ahora mismo",
    differentiatorsBody:
      "Sin correos desechables, sin tarifas ocultas, sin candidaturas que se pierden — las diferencias se suman.",
  },
  landingClosing: {
    title: "Explora gratis. Inicia sesión cuando quieras guardar o postular.",
    body: "Los empleadores empiezan con un recorrido breve para alinear expectativas. Los candidatos guardan favoritos, postulaciones y etapas en un solo perfil Henry Onyx.",
  },
};

const PT: DeepPartial<JobsPublicCopy> = {
  shell: {
    browseOpenJobs: "Ver vagas",
    hiring: "Estou contratando",
    account: "Conta Henry Onyx",
    candidateHome: "Início do candidato",
    applications: "Candidaturas",
    savedJobs: "Vagas salvas",
    employerWorkspace: "Espaço do empregador",
    recruiters: "Recrutadores",
    careers: "Carreiras",
    discover: "Descobrir",
    forTeams: "Para equipes",
    henryCo: "Henry Onyx",
    jobs: "Vagas",
    talent: "Talentos",
    trust: "Confiança",
    help: "Ajuda",
    groupHub: "Central do grupo",
    internalCareers: "Carreiras internas",
  },
  home: {
    kicker: "Henry Onyx Jobs",
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
    myAccount: "Minha conta Henry Onyx",
    candidateHub: "Área do candidato",
    hireWithHenryCo: "Contrate com Henry Onyx",
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
      internalOnly: "Somente vagas internas da Henry Onyx",
      filters: "Filtros",
      tapToExpand: "Toque para expandir",
    },
    suggestions: {
      remote: "Remoto",
      hybrid: "Híbrido",
      verifiedOnly: "Somente verificados",
      fullTime: "Tempo integral",
      lagos: "Lagos",
      internalHenryCo: "Henry Onyx interno",
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
  landingWhy: {
    browseBody:
      "Busque e salve vagas sem pressão. Candidate-se quando fizer sentido — você vê o que já enviou.",
    safetyBody:
      "A verificação de empregadores e a revisão de anúncios reduzem golpes antes que arruínem a sua semana.",
    hiringBody:
      "Publique com contexto, passe na revisão e conduza seleção e entrevistas em um único espaço ligado à sua conta Henry Onyx.",
  },
  landingHow: {
    sectionLink: "Como funciona a contratação",
    stepLabel: "Etapa",
    lookAroundTitle: "Dê uma olhada",
    lookAroundBody:
      "Busque por cargo, categoria, lugar e modo de trabalho. Salve o que interessar — sem relógio correndo.",
    signInTitle: "Entre quando for se candidatar",
    signInBody:
      "Pedimos a sua conta Henry Onyx para que candidaturas e salvos fiquem privados e ligados a você — não a um e-mail descartável.",
    followTitle: "Acompanhe o que vem depois",
    followBody:
      "Pré-selecionado, entrevista, oferta — as etapas aparecem na sua área do candidato com orientação sobre o próximo passo.",
  },
  landingFeatured: {
    kicker: "Vagas em destaque",
    heading: "As vagas que estamos destacando agora",
    differentiatorsBody:
      "Sem e-mails descartáveis, sem taxas escondidas, sem candidaturas que somem — as diferenças se somam.",
  },
  landingClosing: {
    title: "Navegue de graça. Entre quando quiser salvar ou se candidatar.",
    body: "Empregadores começam com um curto passo a passo para alinhar expectativas. Candidatos guardam salvos, candidaturas e etapas em um único perfil Henry Onyx.",
  },
};

const AR: DeepPartial<JobsPublicCopy> = {
  shell: {
    browseOpenJobs: "تصفح الوظائف",
    hiring: "أبحث عن توظيف",
    account: "حساب Henry Onyx",
    candidateHome: "الصفحة الرئيسية للمرشح",
    applications: "الطلبات",
    savedJobs: "الوظائف المحفوظة",
    employerWorkspace: "مساحة صاحب العمل",
    recruiters: "الموظفون المسؤولون عن التوظيف",
    careers: "الوظائف",
    discover: "استكشاف",
    forTeams: "للفرق",
    henryCo: "Henry Onyx",
    jobs: "الوظائف",
    talent: "المواهب",
    trust: "الثقة",
    help: "المساعدة",
    groupHub: "مركز المجموعة",
    internalCareers: "الوظائف الداخلية",
  },
  home: {
    kicker: "Henry Onyx Jobs",
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
    myAccount: "حسابي في Henry Onyx",
    candidateHub: "لوحة المرشح",
    hireWithHenryCo: "التوظيف مع Henry Onyx",
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
      internalOnly: "وظائف Henry Onyx الداخلية فقط",
      filters: "المرشحات",
      tapToExpand: "اضغط للتوسيع",
    },
    suggestions: {
      remote: "عن بعد",
      hybrid: "هجين",
      verifiedOnly: "الموثق فقط",
      fullTime: "دوام كامل",
      lagos: "لاغوس",
      internalHenryCo: "Henry Onyx الداخلي",
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
  landingWhy: {
    browseBody:
      "ابحث واحفظ الوظائف دون أي ضغط. تقدّم حين يكون التوقيت مناسبًا — نعرض لك ما أرسلته من قبل.",
    safetyBody:
      "توثيق أصحاب العمل ومراجعة الإعلانات يقلّلان من الإعلانات الاحتيالية قبل أن تُضيع أسبوع أي شخص.",
    hiringBody:
      "انشر مع السياق، اجتز المراجعة، وأدر القائمة المختصرة والمقابلات في مساحة عمل واحدة مرتبطة بحساب Henry Onyx.",
  },
  landingHow: {
    sectionLink: "كيف يعمل التوظيف",
    stepLabel: "الخطوة",
    lookAroundTitle: "تجوّل واستكشف",
    lookAroundBody:
      "ابحث حسب المسمى والفئة والمكان وطريقة العمل التي تناسبك. احفظ كل ما يهمّك — لا ساعة تجري.",
    signInTitle: "سجّل الدخول عند التقديم",
    signInBody:
      "نطلب حساب Henry Onyx حتى تبقى طلباتك ومحفوظاتك خاصة ومرتبطة بك — لا ببريد عابر.",
    followTitle: "تابع ما يأتي بعد ذلك",
    followBody:
      "قائمة مختصرة، مقابلة، عرض — تظهر المراحل في منطقة المرشح لديك مع إرشاد للخطوة التالية.",
  },
  landingFeatured: {
    kicker: "الوظائف المميزة",
    heading: "الوظائف التي نسلّط الضوء عليها الآن",
    differentiatorsBody:
      "لا بريد عابر، ولا رسوم خفية، ولا طلبات تختفي في فراغ — الفروقات تتراكم.",
  },
  landingClosing: {
    title: "تصفّح مجانًا. سجّل الدخول حين تريد الحفظ أو التقديم.",
    body: "يبدأ أصحاب العمل بجولة قصيرة لتوضيح التوقعات. ويحتفظ المرشحون بالمحفوظات والطلبات والمراحل في ملف Henry Onyx واحد.",
  },
};

const DE: DeepPartial<JobsPublicCopy> = {
  landingWhy: {
    browseBody:
      "Suchen und merken Sie Stellen ohne Druck. Bewerben Sie sich, wenn es passt — wir zeigen, was Sie schon eingereicht haben.",
    safetyBody:
      "Arbeitgeber-Verifizierung und Anzeigenprüfung sortieren Fake-Stellen aus, bevor sie jemandem die Woche kosten.",
    hiringBody:
      "Veröffentlichen Sie mit Kontext, bestehen Sie die Prüfung und führen Sie Shortlist plus Gespräche in einem Arbeitsbereich, der mit Ihrem Henry Onyx-Konto verknüpft ist.",
  },
  landingHow: {
    sectionLink: "So funktioniert das Einstellen",
    stepLabel: "Schritt",
    lookAroundTitle: "Schauen Sie sich um",
    lookAroundBody:
      "Suchen Sie nach Titel, Kategorie, Ort und Arbeitsweise. Merken Sie sich alles Interessante — keine Uhr läuft.",
    signInTitle: "Beim Bewerben anmelden",
    signInBody:
      "Wir fragen nach Ihrem Henry Onyx-Konto, damit Bewerbungen und Merklisten privat bleiben und Ihnen zugeordnet sind — nicht einer Wegwerf-Adresse.",
    followTitle: "Verfolgen Sie, wie es weitergeht",
    followBody:
      "Engere Wahl, Gespräch, Angebot — die Phasen erscheinen in Ihrem Kandidatenbereich mit Hinweisen zum nächsten Schritt.",
  },
  landingFeatured: {
    kicker: "Hervorgehobene Stellen",
    heading: "Stellen, die wir gerade besonders hervorheben",
    differentiatorsBody:
      "Keine Wegwerf-Adressen, keine versteckten Gebühren, keine Bewerbungen ins Leere — die Unterschiede summieren sich.",
  },
  landingClosing: {
    title: "Kostenlos stöbern. Anmelden, wenn Sie speichern oder sich bewerben wollen.",
    body: "Arbeitgeber starten mit einer kurzen Einführung, damit die Erwartungen klar bleiben. Kandidaten halten Merklisten, Bewerbungen und Phasen in einem einzigen Henry Onyx-Profil zusammen.",
  },
};

const IT: DeepPartial<JobsPublicCopy> = {
  landingWhy: {
    browseBody:
      "Cerca e salva ruoli senza fretta. Candidati quando ti sembra il momento — vedi cosa hai già inviato.",
    safetyBody:
      "La verifica dei datori di lavoro e la revisione degli annunci tagliano le truffe prima che rovinino la settimana a qualcuno.",
    hiringBody:
      "Pubblica con contesto, supera la revisione e gestisci shortlist e colloqui in un unico spazio collegato al tuo account Henry Onyx.",
  },
  landingHow: {
    sectionLink: "Come funziona l'assunzione",
    stepLabel: "Passo",
    lookAroundTitle: "Guardati intorno",
    lookAroundBody:
      "Cerca per titolo, categoria, luogo e modalità di lavoro. Salva tutto ciò che ti interessa — nessun orologio.",
    signInTitle: "Accedi quando ti candidi",
    signInBody:
      "Ti chiediamo il tuo account Henry Onyx così candidature e salvataggi restano privati e legati a te — non a una mail usa e getta.",
    followTitle: "Segui ciò che succede dopo",
    followBody:
      "Selezionato, colloquio, offerta — le fasi compaiono nella tua area candidato con indicazioni sul prossimo passo.",
  },
  landingFeatured: {
    kicker: "Ruoli in primo piano",
    heading: "I ruoli che mettiamo in evidenza in questo momento",
    differentiatorsBody:
      "Niente mail usa e getta, niente costi nascosti, niente candidature nel vuoto — le differenze si sommano.",
  },
  landingClosing: {
    title: "Naviga gratis. Accedi quando vuoi salvare o candidarti.",
    body: "I datori di lavoro iniziano con una breve guida per chiarire le aspettative. I candidati tengono salvataggi, candidature e fasi in un unico profilo Henry Onyx.",
  },
};

const ZH: DeepPartial<JobsPublicCopy> = {
  landingWhy: {
    browseBody:
      "无压力地搜索和收藏职位。时机合适时再申请——我们会显示你已经投递过的。",
    safetyBody:
      "雇主验证与岗位审核会在虚假招聘浪费任何人时间之前将其拦下。",
    hiringBody:
      "带上下文发布、通过审核,并在与你的 Henry Onyx 账户绑定的同一工作区里完成入围与面试。",
  },
  landingHow: {
    sectionLink: "招聘如何运作",
    stepLabel: "步骤",
    lookAroundTitle: "先看看",
    lookAroundBody:
      "按职位、类别、地点和工作方式搜索。任何感兴趣的都可以收藏——没有倒计时。",
    signInTitle: "申请时再登录",
    signInBody:
      "我们需要你的 Henry Onyx 账户,这样申请和收藏才能保持私密、绑定到你本人——而不是一个临时邮箱。",
    followTitle: "跟进后续进展",
    followBody:
      "入围、面试、录用——各阶段都会出现在你的候选人区,并提示下一步该做什么。",
  },
  landingFeatured: {
    kicker: "精选职位",
    heading: "我们当前重点推荐的职位",
    differentiatorsBody:
      "没有临时邮箱、没有隐藏费用、没有石沉大海的申请——这些差别会一点点累积。",
  },
  landingClosing: {
    title: "免费浏览。需要收藏或申请时再登录。",
    body: "雇主会先经过简短引导,确保期望清晰。候选人将收藏、申请与进度都集中在同一个 Henry Onyx 个人档案里。",
  },
};

const HI: DeepPartial<JobsPublicCopy> = {
  landingWhy: {
    browseBody:
      "बिना दबाव के भूमिकाएँ खोजें और सहेजें। जब सही लगे तब आवेदन करें — हम दिखाते हैं कि आप पहले क्या भेज चुके हैं।",
    safetyBody:
      "नियोक्ता सत्यापन और पोस्ट समीक्षा फर्जी विज्ञापनों को किसी का सप्ताह बिगाड़ने से पहले छाँट देती है।",
    hiringBody:
      "संदर्भ के साथ पोस्ट करें, समीक्षा पार करें, और शॉर्टलिस्ट व इंटरव्यू एक ही वर्कस्पेस में चलाएँ जो आपके Henry Onyx खाते से जुड़ा हो।",
  },
  landingHow: {
    sectionLink: "भर्ती कैसे काम करती है",
    stepLabel: "चरण",
    lookAroundTitle: "इधर-उधर देखें",
    lookAroundBody:
      "शीर्षक, श्रेणी, स्थान और काम करने के तरीके से खोजें। जो भी रोचक लगे सहेज लें — कोई घड़ी नहीं चल रही।",
    signInTitle: "आवेदन करते समय साइन-इन करें",
    signInBody:
      "हम आपका Henry Onyx खाता माँगते हैं ताकि आवेदन और सहेजी गई भूमिकाएँ निजी और आपसे जुड़ी रहें — किसी थ्रोअवे ईमेल से नहीं।",
    followTitle: "आगे क्या होता है, उस पर नज़र रखें",
    followBody:
      "शॉर्टलिस्ट, इंटरव्यू, ऑफर — चरण आपके कैंडिडेट क्षेत्र में अगले कदम के मार्गदर्शन के साथ दिखते हैं।",
  },
  landingFeatured: {
    kicker: "विशेष भूमिकाएँ",
    heading: "अभी जिन भूमिकाओं को हम सामने ला रहे हैं",
    differentiatorsBody:
      "कोई थ्रोअवे ईमेल नहीं, कोई छिपा शुल्क नहीं, कोई बेजवाब आवेदन नहीं — फ़र्क जुड़ता जाता है।",
  },
  landingClosing: {
    title: "मुफ्त में देखें। जब सहेजना या आवेदन करना हो तब साइन-इन करें।",
    body: "नियोक्ता एक छोटे से वॉकथ्रू से शुरू करते हैं ताकि अपेक्षाएँ साफ़ रहें। उम्मीदवार अपनी सहेजी, आवेदन और चरण एक ही Henry Onyx प्रोफ़ाइल में रखते हैं।",
  },
};

const IG: DeepPartial<JobsPublicCopy> = {
  landingWhy: {
    browseBody:
      "Chọọ ma chekwaa ọrụ na-enweghị mmanye. Tinye akwụkwọ mgbe oge dabara — anyị na-egosi ihe i zigaralarị.",
    safetyBody:
      "Nkwado ndị ọchịchị na nyocha mbipụta na-egbochi mkpọsa wayo tupu ha emefuo izu mmadụ.",
    hiringBody:
      "Bipụta na mkpụrụokwu kwesịrị ekwesị, gafee nyocha, ma duzie ndepụta mkpirisi na ajụjụ ọnụ n'otu ebe ọrụ jikọrọ na akaụntụ Henry Onyx gị.",
  },
  landingHow: {
    sectionLink: "Otu nlere ọrụ si arụ ọrụ",
    stepLabel: "Nzọụkwụ",
    lookAroundTitle: "Lee gburugburu",
    lookAroundBody:
      "Chọọ site n'aha, ụdị, ebe, na ka ị chọrọ isi rụọ ọrụ. Chekwaa ihe ọ bụla na-amasị gị — ọ dịghị elekere.",
    signInTitle: "Banye mgbe ị na-arịọ",
    signInBody:
      "Anyị na-arịọ akaụntụ Henry Onyx gị ka arịrịọ na nchekwa gị nọrọ nzuzo ma jikọta gị — ọ bụghị ozi-e mberede.",
    followTitle: "Soro ihe na-eso",
    followBody:
      "Ndepụta mkpirisi, ajụjụ ọnụ, onyinye — usoro ndị ahụ na-egosi na mpaghara onye nchọta gị site na nduzi maka ihe ga-eso.",
  },
  landingFeatured: {
    kicker: "Ọrụ a kpọmkwem",
    heading: "Ọrụ anyị na-akọwapụta ugbu a",
    differentiatorsBody:
      "Enweghị ozi-e mberede, enweghị ego zoro ezo, enweghị arịrịọ na-efu efu — ọdịiche niile na-amịkọta.",
  },
  landingClosing: {
    title: "Lelee n'efu. Banye mgbe ịchọrọ ichekwa ma ọ bụ ịrịọ.",
    body: "Ndị ọchịchị na-amalite na nduzi dị mkpụmkpụ ka atụmanya doo anya. Ndị nchọta na-ejide ihe a chekwaara, arịrịọ, na usoro niile n'otu profaịlụ Henry Onyx.",
  },
};

const YO: DeepPartial<JobsPublicCopy> = {
  landingWhy: {
    browseBody:
      "Ṣawari ki o si fipamọ awọn ipa laisi titẹ. Beere nigba ti o ba dabi ẹnipe o yẹ — a fihan ohun ti o ti firanṣẹ tẹlẹ.",
    safetyBody:
      "Ìmúdájú agbanisiṣẹ ati àtúnyẹ̀wò àkọsílẹ̀ máa ń ge àwọn ìpolówó ìtànjẹ kúrò ṣáájú kí wọ́n tó fi ìṣẹ́jú ẹnikẹ́ni ṣòfò.",
    hiringBody:
      "Tẹjáde pẹ̀lú àyíká ọ̀rọ̀, kọjá àtúnyẹ̀wò, kí o sì rí àyẹ̀wò ìpinnu àti ìfọ̀rọ̀wánilẹ́nuwò ní ibi iṣẹ́ kan tí ó so mọ́ àkọọ́lẹ̀ Henry Onyx rẹ.",
  },
  landingHow: {
    sectionLink: "Bí gbígba iṣẹ́ ṣe ń ṣiṣẹ́",
    stepLabel: "Ìgbésẹ̀",
    lookAroundTitle: "Wo àyíká",
    lookAroundBody:
      "Ṣàwárí nípa àkọlé, ẹ̀ka, ibi, àti bí o ṣe fẹ́ ṣiṣẹ́. Fipamọ́ ohunkóhun tó wúlò — kò sí aago kankan.",
    signInTitle: "Wọlé nígbà tí o bá ń béèrè",
    signInBody:
      "A ń béèrè àkọọ́lẹ̀ Henry Onyx rẹ kí àwọn ìbéèrè àti ìfipamọ́ wà ní ìpamọ́ tí ó sì so mọ́ ọ — kì í ṣe sí ímeèlì àtilẹyìn.",
    followTitle: "Tẹ̀lé ohun tí ó ń ṣẹlẹ̀ tókàn",
    followBody:
      "Tí a yàn, ìfọ̀rọ̀wánilẹ́nuwò, ìfunni — àwọn ìpele yóò hàn ní agbègbè olùdíje rẹ pẹ̀lú ìtọ́nisọ́nà fún ohun tí ó tẹ̀lé.",
  },
  landingFeatured: {
    kicker: "Àwọn ipa pàtàkì",
    heading: "Àwọn ipa tí à ń tẹnu mọ́ báyìí",
    differentiatorsBody:
      "Kò sí ímeèlì àtilẹyìn, kò sí owó tó pamọ́, kò sí ìbéèrè tó di òfo — ìyàtọ̀ náà ń kó papọ̀.",
  },
  landingClosing: {
    title: "Ṣàwárí lọ́fẹ̀ẹ́. Wọlé nígbà tí o bá fẹ́ fipamọ́ tàbí béèrè.",
    body: "Àwọn agbanisiṣẹ máa ń bẹ̀rẹ̀ pẹ̀lú ìtọ́sọ́nà kúkúrú kí ìfojúsọ́nà má fi ṣòro. Àwọn olùdíje sì máa ń tọ́jú ohun tí wọ́n fipamọ́, àwọn ìbéèrè, àti àwọn ìpele nínú profaìlì Henry Onyx kan ṣoṣo.",
  },
};

const HA: DeepPartial<JobsPublicCopy> = {
  landingWhy: {
    browseBody:
      "Nemi ka ajiye matsayoyi babu danniya. Nema lokacin da ya yi daidai — muna nuna abin da ka riga ka aika.",
    safetyBody:
      "Tabbatar da masu daukar ma'aikata da bita na sanarwa suna yanke jerin sunaye na zamba kafin su lalata mako na kowa.",
    hiringBody:
      "Buga tare da ma'ana, ka wuce bita, kuma ka gudanar da gajeren jeri da hira a wuri daya da aka haɗa da asusunka na Henry Onyx.",
  },
  landingHow: {
    sectionLink: "Yadda ɗaukar ma'aikata ke aiki",
    stepLabel: "Mataki",
    lookAroundTitle: "Dubi gaba ɗaya",
    lookAroundBody:
      "Nemi ta hanyar take, rukuni, wuri, da yadda kake son yin aiki. Ajiye duk abin da ya burge ka — ba lokaci yake gudana.",
    signInTitle: "Shiga lokacin da kake nema",
    signInBody:
      "Muna neman asusunka na Henry Onyx don tambayoyi da ajiya su kasance na sirri kuma a haɗa su da kai — ba imel na ɗan lokaci ba.",
    followTitle: "Bi abin da zai biyo baya",
    followBody:
      "An zaba, hira, tayi — matakai suna bayyana a yankin ɗan takarar ku tare da jagora kan abin da za a yi na gaba.",
  },
  landingFeatured: {
    kicker: "Matsayoyi na musamman",
    heading: "Matsayoyin da muke daga yanzu",
    differentiatorsBody:
      "Babu imel na ɗan lokaci, babu kuɗi a ɓoye, babu neman da ya ɓace — bambance-bambance suna taruwa.",
  },
  landingClosing: {
    title: "Bincika kyauta. Shiga lokacin da kake son ajiyewa ko nema.",
    body: "Masu daukar ma'aikata suna farawa da gajeren jagora don kiyaye fata. 'Yan takara suna riƙe da ajiya, nema, da matakai a cikin bayanin Henry Onyx guda ɗaya.",
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<JobsPublicCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
  hi: HI,
  ig: IG,
  yo: YO,
  ha: HA,
};

function mergeDeep(
  base: Record<string, unknown>,
  override?: Record<string, unknown>,
): Record<string, unknown> {
  if (!override) return base;
  const output: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const existing = base[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      existing &&
      typeof existing === "object" &&
      !Array.isArray(existing)
    ) {
      output[key] = mergeDeep(
        existing as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    } else {
      output[key] = value;
    }
  }
  return output;
}

export function getJobsPublicCopy(locale: AppLocale): JobsPublicCopy {
  return mergeDeep(
    EN as unknown as Record<string, unknown>,
    LOCALE_MAP[locale] as unknown as Record<string, unknown> | undefined,
  ) as unknown as JobsPublicCopy;
}
