import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

export type JobsCopy = {
  nav: {
    browse: string;
    post: string;
    applications: string;
    account: string;
  };
  hero: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    ctaBrowse: string;
    ctaHire: string;
  };
  filters: {
    allRoles: string;
    fullTime: string;
    partTime: string;
    contract: string;
    remote: string;
    onsite: string;
    hybrid: string;
    location: string;
    salary: string;
    experience: string;
    clearAll: string;
  };
  listing: {
    applyNow: string;
    saveJob: string;
    shareJob: string;
    postedAgo: string;
    deadline: string;
    salary: string;
    jobType: string;
    location: string;
    experience: string;
    skills: string;
    aboutRole: string;
    aboutCompany: string;
    viewCompany: string;
  };
  application: {
    title: string;
    resume: string;
    coverLetter: string;
    submit: string;
    submitted: string;
    underReview: string;
    shortlisted: string;
    rejected: string;
    offerMade: string;
  };
  hiring: {
    postJob: string;
    managePostings: string;
    reviewApplications: string;
    closePosting: string;
    editPosting: string;
  };
  empty: {
    noJobs: string;
    noApplications: string;
    noPostings: string;
  };
  // V3 PASS 21 — interview room + verification + offer-letter labels.
  interviewRoom: {
    kicker: string;
    candidateFallback: string;
    employerFallback: string;
    minutes: string;
    iframeTitle: string;
    placeholder: string;
    tabChat: string;
    tabNotes: string;
    chatHint: string;
    notesLabel: string;
    notesPlaceholder: string;
    notesSaving: string;
    notesSavedAt: string;
    notesAutosave: string;
    notesSaveError: string;
  };
  verification: {
    skillTitle: string;
    skillSubtitle: string;
    experienceTitle: string;
    experienceSubtitle: string;
    referenceTitle: string;
    referenceSubtitle: string;
    badgeVerified: string;
    badgePending: string;
    badgeRejected: string;
  };
  offerLetter: {
    title: string;
    subtitle: string;
    statusDraft: string;
    statusSent: string;
    statusSigned: string;
    statusExpired: string;
    statusDeclined: string;
    signCta: string;
    typedFallbackTitle: string;
    typedFallbackPrompt: string;
  };
  salary: {
    rangeLabel: string;
    benchmarkLabel: string;
    p25Label: string;
    p50Label: string;
    p75Label: string;
    sampleLabel: string;
    sourceLabel: string;
    discloseRequiredError: string;
  };
  profileBuilder: {
    sectionBasics: string;
    sectionExperience: string;
    sectionEducation: string;
    sectionSkills: string;
    sectionPortfolio: string;
    fullName: string;
    headline: string;
    summary: string;
    location: string;
    phone: string;
    email: string;
    saving: string;
    savedAt: string;
    autosaveHint: string;
    saveError: string;
  };
  employerHiring: {
    pageTitle: string;
    pageSubtitle: string;
    sectionTitle: string;
    sectionBody: string;
    emptyMessage: string;
    applicantSingular: string;
    applicantPlural: string;
    statusActive: string;
    statusPaused: string;
    statusClosed: string;
  };
};

const EN: JobsCopy = {
  nav: {
    browse: "Browse jobs",
    post: "Post a job",
    applications: "Applications",
    account: "Account",
  },
  hero: {
    title: "Hiring, verified talent, without the usual noise.",
    subtitle: "Find focused roles from employers who are serious about who they bring in.",
    searchPlaceholder: "Role, skill, or company",
    ctaBrowse: "Browse open jobs",
    ctaHire: "I'm hiring",
  },
  filters: {
    allRoles: "All roles",
    fullTime: "Full-time",
    partTime: "Part-time",
    contract: "Contract",
    remote: "Remote",
    onsite: "On-site",
    hybrid: "Hybrid",
    location: "Location",
    salary: "Salary",
    experience: "Experience",
    clearAll: "Clear all",
  },
  listing: {
    applyNow: "Apply now",
    saveJob: "Save job",
    shareJob: "Share",
    postedAgo: "Posted",
    deadline: "Application deadline",
    salary: "Salary",
    jobType: "Job type",
    location: "Location",
    experience: "Experience required",
    skills: "Skills",
    aboutRole: "About the role",
    aboutCompany: "About the company",
    viewCompany: "View company",
  },
  application: {
    title: "Apply for this role",
    resume: "Resume / CV",
    coverLetter: "Cover letter",
    submit: "Submit application",
    submitted: "Application submitted",
    underReview: "Under review",
    shortlisted: "Shortlisted",
    rejected: "Not progressing",
    offerMade: "Offer made",
  },
  hiring: {
    postJob: "Post a job",
    managePostings: "Manage postings",
    reviewApplications: "Review applications",
    closePosting: "Close posting",
    editPosting: "Edit posting",
  },
  empty: {
    noJobs: "No matching jobs found. Try adjusting your filters.",
    noApplications: "No applications yet.",
    noPostings: "No active job postings.",
  },
  interviewRoom: {
    kicker: "Interview room",
    candidateFallback: "Candidate",
    employerFallback: "Hiring team",
    minutes: "min",
    iframeTitle: "Video interview room",
    placeholder:
      "Room provisioning is pending. Your interviewer will share a meeting link in chat shortly.",
    tabChat: "Chat",
    tabNotes: "Notes",
    chatHint:
      "In-room chat is provided by the video provider. Use it to share links during the call.",
    notesLabel: "Private notes",
    notesPlaceholder:
      "Capture observations. Visible to your hiring team only.",
    notesSaving: "Saving…",
    notesSavedAt: "Saved",
    notesAutosave: "Auto-saves every 30s",
    notesSaveError: "Couldn't save notes.",
  },
  verification: {
    skillTitle: "Verified skills",
    skillSubtitle: "Skills employers can trust at a glance.",
    experienceTitle: "Verified experience",
    experienceSubtitle: "Confirmed roles and tenure.",
    referenceTitle: "Reference checks",
    referenceSubtitle: "Responses captured from your professional references.",
    badgeVerified: "Verified",
    badgePending: "Pending",
    badgeRejected: "Not verified",
  },
  offerLetter: {
    title: "Offer letter",
    subtitle: "Review your offer and sign when ready.",
    statusDraft: "Draft",
    statusSent: "Awaiting your signature",
    statusSigned: "Signed",
    statusExpired: "Expired",
    statusDeclined: "Declined",
    signCta: "Open signature room",
    typedFallbackTitle: "Confirm acceptance",
    typedFallbackPrompt:
      "Type your full name to acknowledge this offer. A signed PDF is kept in your files.",
  },
  salary: {
    rangeLabel: "Posted range",
    benchmarkLabel: "Market benchmark",
    p25Label: "25th percentile",
    p50Label: "Median",
    p75Label: "75th percentile",
    sampleLabel: "Sample size",
    sourceLabel: "Source",
    discloseRequiredError:
      "Salary disclosure is required. Provide a numeric range or a concrete label.",
  },
  profileBuilder: {
    sectionBasics: "Basics",
    sectionExperience: "Experience",
    sectionEducation: "Education",
    sectionSkills: "Skills",
    sectionPortfolio: "Portfolio",
    fullName: "Full name",
    headline: "Headline",
    summary: "Summary",
    location: "Location",
    phone: "Phone",
    email: "Email",
    saving: "Saving…",
    savedAt: "Saved",
    autosaveHint: "Auto-saves every 30s and on blur",
    saveError: "Couldn't save your draft.",
  },
  employerHiring: {
    pageTitle: "Hiring Pipelines",
    pageSubtitle:
      "Manage your active hiring pipelines, communicate with candidates, and schedule interviews from one workspace.",
    sectionTitle: "All pipelines",
    sectionBody:
      "Each pipeline corresponds to a live or past role. Open a pipeline to review applicants, conversations, and interviews.",
    emptyMessage:
      "No hiring pipelines yet. Pipelines are created automatically when you publish a role.",
    applicantSingular: "applicant",
    applicantPlural: "applicants",
    statusActive: "Active",
    statusPaused: "Paused",
    statusClosed: "Closed",
  },
};

const FR: DeepPartial<JobsCopy> = {
  nav: {
    browse: "Parcourir les offres",
    post: "Publier une offre",
    applications: "Candidatures",
    account: "Compte",
  },
  hero: {
    title: "Recrutement de talents vérifiés, sans le bruit habituel.",
    subtitle: "Trouvez des postes ciblés auprès d'employeurs sérieux dans leur recrutement.",
    searchPlaceholder: "Poste, compétence ou entreprise",
    ctaBrowse: "Voir les offres",
    ctaHire: "Je recrute",
  },
  filters: {
    allRoles: "Tous les postes",
    fullTime: "Temps plein",
    partTime: "Temps partiel",
    contract: "Contrat",
    remote: "Télétravail",
    onsite: "Sur site",
    hybrid: "Hybride",
    location: "Lieu",
    salary: "Salaire",
    experience: "Expérience",
    clearAll: "Tout effacer",
  },
  listing: {
    applyNow: "Postuler",
    saveJob: "Sauvegarder",
    shareJob: "Partager",
    postedAgo: "Publié",
    deadline: "Date limite de candidature",
    salary: "Salaire",
    jobType: "Type de contrat",
    location: "Lieu",
    experience: "Expérience requise",
    skills: "Compétences",
    aboutRole: "À propos du poste",
    aboutCompany: "À propos de l'entreprise",
    viewCompany: "Voir l'entreprise",
  },
  application: {
    title: "Postuler à ce poste",
    resume: "CV",
    coverLetter: "Lettre de motivation",
    submit: "Envoyer la candidature",
    submitted: "Candidature envoyée",
    underReview: "En cours d'examen",
    shortlisted: "Présélectionné",
    rejected: "Non retenu",
    offerMade: "Offre proposée",
  },
  hiring: {
    postJob: "Publier une offre",
    managePostings: "Gérer les offres",
    reviewApplications: "Examiner les candidatures",
    closePosting: "Clôturer l'offre",
    editPosting: "Modifier l'offre",
  },
  empty: {
    noJobs: "Aucun poste trouvé. Ajustez vos filtres.",
    noApplications: "Pas encore de candidatures.",
    noPostings: "Aucune offre active.",
  },
  employerHiring: {
    pageTitle: "Pipelines de recrutement",
    pageSubtitle:
      "Gérez vos pipelines de recrutement actifs, communiquez avec les candidats et planifiez les entretiens depuis un seul espace.",
    sectionTitle: "Tous les pipelines",
    sectionBody:
      "Chaque pipeline correspond à un poste actif ou passé. Ouvrez-en un pour consulter les candidats, les échanges et les entretiens.",
    emptyMessage:
      "Aucun pipeline de recrutement pour l'instant. Les pipelines sont créés automatiquement lorsque vous publiez un poste.",
    applicantSingular: "candidat",
    applicantPlural: "candidats",
    statusActive: "Actif",
    statusPaused: "En pause",
    statusClosed: "Clôturé",
  },
};

const ES: DeepPartial<JobsCopy> = {
  nav: {
    browse: "Ver ofertas",
    post: "Publicar empleo",
    applications: "Candidaturas",
    account: "Cuenta",
  },
  hero: {
    title: "Contratación de talento verificado, sin el ruido habitual.",
    subtitle: "Encuentra roles enfocados de empleadores serios en su selección.",
    searchPlaceholder: "Rol, habilidad o empresa",
    ctaBrowse: "Ver empleos disponibles",
    ctaHire: "Estoy contratando",
  },
  filters: {
    allRoles: "Todos los roles",
    fullTime: "Tiempo completo",
    partTime: "Tiempo parcial",
    contract: "Contrato",
    remote: "Remoto",
    onsite: "Presencial",
    hybrid: "Híbrido",
    location: "Ubicación",
    salary: "Salario",
    experience: "Experiencia",
    clearAll: "Limpiar todo",
  },
  listing: {
    applyNow: "Postular ahora",
    saveJob: "Guardar empleo",
    shareJob: "Compartir",
    postedAgo: "Publicado",
    deadline: "Fecha límite de postulación",
    salary: "Salario",
    jobType: "Tipo de empleo",
    location: "Ubicación",
    experience: "Experiencia requerida",
    skills: "Habilidades",
    aboutRole: "Sobre el rol",
    aboutCompany: "Sobre la empresa",
    viewCompany: "Ver empresa",
  },
  application: {
    title: "Postular a este rol",
    resume: "Currículum / CV",
    coverLetter: "Carta de presentación",
    submit: "Enviar candidatura",
    submitted: "Candidatura enviada",
    underReview: "En revisión",
    shortlisted: "Preseleccionado",
    rejected: "No avanza",
    offerMade: "Oferta realizada",
  },
  hiring: {
    postJob: "Publicar empleo",
    managePostings: "Gestionar publicaciones",
    reviewApplications: "Revisar candidaturas",
    closePosting: "Cerrar publicación",
    editPosting: "Editar publicación",
  },
  empty: {
    noJobs: "No se encontraron empleos. Ajusta tus filtros.",
    noApplications: "Aún sin candidaturas.",
    noPostings: "Sin publicaciones activas.",
  },
  employerHiring: {
    pageTitle: "Pipelines de contratación",
    pageSubtitle:
      "Gestiona tus pipelines de contratación activos, comunícate con los candidatos y agenda entrevistas desde un único espacio.",
    sectionTitle: "Todos los pipelines",
    sectionBody:
      "Cada pipeline corresponde a un puesto activo o pasado. Abre uno para revisar candidatos, conversaciones y entrevistas.",
    emptyMessage:
      "Aún no hay pipelines de contratación. Los pipelines se crean automáticamente al publicar un puesto.",
    applicantSingular: "candidato",
    applicantPlural: "candidatos",
    statusActive: "Activo",
    statusPaused: "En pausa",
    statusClosed: "Cerrado",
  },
};

const PT: DeepPartial<JobsCopy> = {
  nav: {
    browse: "Ver vagas",
    post: "Publicar vaga",
    applications: "Candidaturas",
    account: "Conta",
  },
  hero: {
    title: "Contratação de talentos verificados, sem o ruído habitual.",
    subtitle: "Encontre vagas focadas de empregadores sérios em suas contratações.",
    searchPlaceholder: "Cargo, habilidade ou empresa",
    ctaBrowse: "Ver vagas abertas",
    ctaHire: "Estou contratando",
  },
  filters: {
    allRoles: "Todos os cargos",
    fullTime: "Tempo integral",
    partTime: "Meio período",
    contract: "Contrato",
    remote: "Remoto",
    onsite: "Presencial",
    hybrid: "Híbrido",
    location: "Localização",
    salary: "Salário",
    experience: "Experiência",
    clearAll: "Limpar tudo",
  },
  listing: {
    applyNow: "Candidatar-se",
    saveJob: "Salvar vaga",
    shareJob: "Compartilhar",
    postedAgo: "Publicado",
    deadline: "Prazo de candidatura",
    salary: "Salário",
    jobType: "Tipo de vaga",
    location: "Localização",
    experience: "Experiência necessária",
    skills: "Habilidades",
    aboutRole: "Sobre a vaga",
    aboutCompany: "Sobre a empresa",
    viewCompany: "Ver empresa",
  },
  application: {
    title: "Candidatar-se a esta vaga",
    resume: "Currículo / CV",
    coverLetter: "Carta de apresentação",
    submit: "Enviar candidatura",
    submitted: "Candidatura enviada",
    underReview: "Em análise",
    shortlisted: "Pré-selecionado",
    rejected: "Não avançou",
    offerMade: "Oferta realizada",
  },
  hiring: {
    postJob: "Publicar vaga",
    managePostings: "Gerenciar publicações",
    reviewApplications: "Revisar candidaturas",
    closePosting: "Encerrar publicação",
    editPosting: "Editar publicação",
  },
  empty: {
    noJobs: "Nenhuma vaga encontrada. Ajuste seus filtros.",
    noApplications: "Sem candidaturas ainda.",
    noPostings: "Sem publicações ativas.",
  },
  employerHiring: {
    pageTitle: "Pipelines de contratação",
    pageSubtitle:
      "Gerencie seus pipelines de contratação ativos, converse com candidatos e agende entrevistas em um único espaço.",
    sectionTitle: "Todos os pipelines",
    sectionBody:
      "Cada pipeline corresponde a uma vaga ativa ou passada. Abra um para revisar candidatos, conversas e entrevistas.",
    emptyMessage:
      "Ainda não há pipelines de contratação. Os pipelines são criados automaticamente quando você publica uma vaga.",
    applicantSingular: "candidato",
    applicantPlural: "candidatos",
    statusActive: "Ativo",
    statusPaused: "Em pausa",
    statusClosed: "Encerrado",
  },
};

const AR: DeepPartial<JobsCopy> = {
  nav: {
    browse: "تصفح الوظائف",
    post: "نشر وظيفة",
    applications: "الطلبات",
    account: "الحساب",
  },
  hero: {
    title: "توظيف مواهب موثقة، بدون الضوضاء المعتادة.",
    subtitle: "اعثر على وظائف مركزة من أصحاب عمل جادين في اختياراتهم.",
    searchPlaceholder: "المنصب، المهارة، أو الشركة",
    ctaBrowse: "تصفح الوظائف المتاحة",
    ctaHire: "أنا أوظف",
  },
  filters: {
    allRoles: "جميع الأدوار",
    fullTime: "دوام كامل",
    partTime: "دوام جزئي",
    contract: "عقد",
    remote: "عن بُعد",
    onsite: "في الموقع",
    hybrid: "هجين",
    location: "الموقع",
    salary: "الراتب",
    experience: "الخبرة",
    clearAll: "مسح الكل",
  },
  listing: {
    applyNow: "تقدم الآن",
    saveJob: "حفظ الوظيفة",
    shareJob: "مشاركة",
    postedAgo: "نُشر",
    deadline: "الموعد النهائي للتقديم",
    salary: "الراتب",
    jobType: "نوع الوظيفة",
    location: "الموقع",
    experience: "الخبرة المطلوبة",
    skills: "المهارات",
    aboutRole: "عن الدور",
    aboutCompany: "عن الشركة",
    viewCompany: "عرض الشركة",
  },
  application: {
    title: "التقدم لهذا الدور",
    resume: "السيرة الذاتية",
    coverLetter: "خطاب التقديم",
    submit: "إرسال الطلب",
    submitted: "تم إرسال الطلب",
    underReview: "قيد المراجعة",
    shortlisted: "في القائمة المختصرة",
    rejected: "لم يتقدم",
    offerMade: "تم تقديم عرض",
  },
  hiring: {
    postJob: "نشر وظيفة",
    managePostings: "إدارة الإعلانات",
    reviewApplications: "مراجعة الطلبات",
    closePosting: "إغلاق الإعلان",
    editPosting: "تعديل الإعلان",
  },
  empty: {
    noJobs: "لم يتم العثور على وظائف مطابقة. جرب تعديل فلاترك.",
    noApplications: "لا توجد طلبات بعد.",
    noPostings: "لا توجد إعلانات وظيفية نشطة.",
  },
  employerHiring: {
    pageTitle: "خطوط التوظيف",
    pageSubtitle:
      "أدر خطوط التوظيف النشطة، وتواصل مع المرشحين، وحدد مواعيد المقابلات من مكان عمل واحد.",
    sectionTitle: "كل الخطوط",
    sectionBody:
      "كل خط توظيف يقابل دورًا نشطًا أو سابقًا. افتح خطًا لمراجعة المرشحين والمحادثات والمقابلات.",
    emptyMessage:
      "لا توجد خطوط توظيف بعد. تُنشأ الخطوط تلقائيًا عند نشر دور.",
    applicantSingular: "مرشح",
    applicantPlural: "مرشحون",
    statusActive: "نشط",
    statusPaused: "متوقف",
    statusClosed: "مغلق",
  },
};

const IG: DeepPartial<JobsCopy> = {
  nav: {
    browse: "Lelee ọrụ",
    post: "Dee ọrụ",
    applications: "Arịrịọ",
    account: "Akaụntụ",
  },
  hero: {
    title: "Ịchụ ndị ọrụ amara, na-enweghị ọtọ.",
    subtitle: "Hụ ọrụ kwụsịrị kwụsị site n'aka ndị ọchịchị jụrụ ogu.",
    searchPlaceholder: "Ọrụ, nka, ma ọ bụ ụlọ ọrụ",
    ctaBrowse: "Lelee ọrụ ndị dị mfe",
    ctaHire: "Achọrọ m ndị ọrụ",
  },
  filters: {
    allRoles: "Ọrụ niile",
    fullTime: "Oge zuru oke",
    partTime: "Oge ụfọdụ",
    contract: "Nkwekọrịta",
    remote: "Ọrụ site n'ụlọ",
    onsite: "N'ebe ọrụ dị",
    hybrid: "Ngwakọta",
    location: "Ọnọdụ",
    salary: "Ụgwọ",
    experience: "Ahụmahụ",
    clearAll: "Hichapụ ihe niile",
  },
  listing: {
    applyNow: "Rịọ ugbu a",
    saveJob: "Chekwa ọrụ",
    shareJob: "Kee",
    postedAgo: "Edere",
    deadline: "Ụbọchị ikpeazụ ị nwerụ arịrịọ",
    salary: "Ụgwọ",
    jobType: "Ụdị ọrụ",
    location: "Ọnọdụ",
    experience: "Ahụmahụ dị mkpa",
    skills: "Nka",
    aboutRole: "Maka ọrụ a",
    aboutCompany: "Maka ụlọ ọrụ",
    viewCompany: "Hụ ụlọ ọrụ",
  },
  application: {
    title: "Rịọ ọrụ a",
    resume: "CV",
    coverLetter: "Akwụkwọ ozi",
    submit: "Zipu arịrịọ",
    submitted: "Eziputara arịrịọ",
    underReview: "Na-atụle",
    shortlisted: "Họpụtara",
    rejected: "Agaghị n'ihu",
    offerMade: "Enyela ofee",
  },
  hiring: {
    postJob: "Dee ọrụ",
    managePostings: "Jikwaa nkwupụta",
    reviewApplications: "Lelee arịrịọ",
    closePosting: "Mechie nkwupụta",
    editPosting: "Dezie nkwupụta",
  },
  empty: {
    noJobs: "Enweghị ọrụ dabara. Gbanwee ndọta gị.",
    noApplications: "Enweghị arịrịọ ọ bụla.",
    noPostings: "Enweghị nkwupụta ọrụ dị ndụ.",
  },
  employerHiring: {
    pageTitle: "Akara ịchụ ndị ọrụ",
    pageSubtitle:
      "Jikwaa akara ịchụ ndị ọrụ gị na-arụ ọrụ, kparịta ụka na ndị nwere mmasị, ma hazie nzukọ ajụjụ ọnụ site n'otu ebe ọrụ.",
    sectionTitle: "Akara niile",
    sectionBody:
      "Akara nke ọ bụla na-egosi ọrụ dị ndụ ma ọ bụ ọrụ gara aga. Mepee otu iji lelee ndị nwere mmasị, mkparịta ụka, na ajụjụ ọnụ.",
    emptyMessage:
      "Enweghị akara ịchụ ndị ọrụ ọ bụla. A na-emepụta akara n'onwe ya mgbe ị bipụtara ọrụ.",
    applicantSingular: "onye nwere mmasị",
    applicantPlural: "ndị nwere mmasị",
    statusActive: "Na-arụ ọrụ",
    statusPaused: "Akwụsịrị",
    statusClosed: "Emechiri",
  },
};

const YO: DeepPartial<JobsCopy> = {
  nav: {
    browse: "Wo awọn iṣẹ",
    post: "Firanṣẹ iṣẹ",
    applications: "Awọn ìbéèrè",
    account: "Akọọlẹ",
  },
  hero: {
    title: "Gbigba ẹgbẹ amọja, laisi ariwo ti o wọpọ.",
    subtitle: "Wa awọn ipa idojukọ lati ọdọ awọn agbanisiṣẹ to ṣe pataki nipa gbigba wọn.",
    searchPlaceholder: "Ipa, ẹgbẹ, tabi ile-iṣẹ",
    ctaBrowse: "Wo awọn iṣẹ ti o ṣii",
    ctaHire: "Mo n gba ẹgbẹ",
  },
  filters: {
    allRoles: "Gbogbo awọn ipa",
    fullTime: "Akoko kikun",
    partTime: "Akoko apakan",
    contract: "Adehun",
    remote: "Lati ibikan",
    onsite: "Ni ibi",
    hybrid: "Idapọ",
    location: "Ipo",
    salary: "Owo-iṣẹ",
    experience: "Iriri",
    clearAll: "Mọ gbogbo",
  },
  listing: {
    applyNow: "Beere bayi",
    saveJob: "Fi iṣẹ pamọ",
    shareJob: "Pin",
    postedAgo: "Ti firanṣẹ",
    deadline: "Ọjọ ikẹhin fun ìbéèrè",
    salary: "Owo-iṣẹ",
    jobType: "Iru iṣẹ",
    location: "Ipo",
    experience: "Iriri ti a nilo",
    skills: "Awọn ẹgbẹ",
    aboutRole: "Nipa ipa naa",
    aboutCompany: "Nipa ile-iṣẹ",
    viewCompany: "Wo ile-iṣẹ",
  },
  application: {
    title: "Beere fun ipa yii",
    resume: "CV",
    coverLetter: "Lẹta ibọwọ",
    submit: "Fi ìbéèrè ranṣẹ",
    submitted: "Ìbéèrè ti firanṣẹ",
    underReview: "Ni atunyẹwo",
    shortlisted: "Ti yan",
    rejected: "Ko nlọsiwaju",
    offerMade: "Ìfunni ti ṣe",
  },
  hiring: {
    postJob: "Firanṣẹ iṣẹ",
    managePostings: "Ṣakoso awọn atẹjade",
    reviewApplications: "Wo awọn ìbéèrè",
    closePosting: "Pa atẹjade",
    editPosting: "Ṣatunṣe atẹjade",
  },
  empty: {
    noJobs: "Ko si iṣẹ ti o baamu. Gbiyanju lati ṣatunṣe àlẹmọ rẹ.",
    noApplications: "Ko si ìbéèrè sibẹsibẹ.",
    noPostings: "Ko si atẹjade iṣẹ ti nṣiṣẹ.",
  },
  employerHiring: {
    pageTitle: "Awọn ọna gbigba iṣẹ",
    pageSubtitle:
      "Ṣakoso awọn ọna gbigba iṣẹ rẹ ti nṣiṣẹ, ba awọn olubẹwẹ sọrọ, ki o si ṣeto awọn ifọrọwanilẹnuwo lati ibi iṣẹ kanṣoṣo.",
    sectionTitle: "Gbogbo awọn ọna",
    sectionBody:
      "Ọna kọọkan baamu ipa kan ti nṣiṣẹ tabi ti tẹlẹ. Ṣii ọna lati ṣayẹwo awọn olubẹwẹ, awọn ibaraẹnisọrọ, ati awọn ifọrọwanilẹnuwo.",
    emptyMessage:
      "Ko si ọna gbigba iṣẹ sibẹsibẹ. A ṣẹda awọn ọna laifọwọyi nigbati o ba tẹjade ipa kan.",
    applicantSingular: "olubẹwẹ",
    applicantPlural: "awọn olubẹwẹ",
    statusActive: "Nṣiṣẹ",
    statusPaused: "Duro",
    statusClosed: "Ti pa",
  },
};

const HA: DeepPartial<JobsCopy> = {
  nav: {
    browse: "Duba ayyuka",
    post: "Sanya aikin",
    applications: "Aikace-aikace",
    account: "Asusun",
  },
  hero: {
    title: "Daukar ma'aikata tabbatattu, ba tare da hayaniyar da aka saba ba.",
    subtitle: "Sami matsayi mai mayar da hankali daga masu daukar ma'aikata masu girma a zaɓin su.",
    searchPlaceholder: "Matsayi, ƙwarewa, ko kamfani",
    ctaBrowse: "Duba ayyukan da suke buɗe",
    ctaHire: "Ina daukar ma'aikata",
  },
  filters: {
    allRoles: "Duk matsayi",
    fullTime: "Cikakken lokaci",
    partTime: "Rabin lokaci",
    contract: "Kwantiragin",
    remote: "Nesa",
    onsite: "A wurin",
    hybrid: "Haɗin",
    location: "Wuri",
    salary: "Albashi",
    experience: "Gogewa",
    clearAll: "Share duka",
  },
  listing: {
    applyNow: "Nemi yanzu",
    saveJob: "Adana aikin",
    shareJob: "Raba",
    postedAgo: "An buga",
    deadline: "Ƙarshen rana don nema",
    salary: "Albashi",
    jobType: "Nau'in aiki",
    location: "Wuri",
    experience: "Gogewa da ake buƙata",
    skills: "Ƙwarewa",
    aboutRole: "Game da matsayi",
    aboutCompany: "Game da kamfani",
    viewCompany: "Duba kamfani",
  },
  application: {
    title: "Nemi wannan matsayi",
    resume: "CV",
    coverLetter: "Wasiƙar gabatarwa",
    submit: "Aika nema",
    submitted: "An aika nema",
    underReview: "Ana duba",
    shortlisted: "An zaɓa",
    rejected: "Ba zai ci gaba ba",
    offerMade: "An yi tayin",
  },
  hiring: {
    postJob: "Sanya aikin",
    managePostings: "Sarrafa sanarwa",
    reviewApplications: "Duba aikace-aikace",
    closePosting: "Rufe sanarwa",
    editPosting: "Gyara sanarwa",
  },
  empty: {
    noJobs: "Ba a sami ayyuka masu dacewa ba. Gwada canza tacewa.",
    noApplications: "Babu aikace-aikace tukuna.",
    noPostings: "Babu sanarwar aiki mai aiki.",
  },
  employerHiring: {
    pageTitle: "Layukan daukar ma'aikata",
    pageSubtitle:
      "Sarrafa layukan daukar ma'aikata masu aiki, sadarwa da masu nema, da tsara hira daga wuri ɗaya.",
    sectionTitle: "Dukkan layuka",
    sectionBody:
      "Kowane layi yana wakiltar matsayi mai aiki ko na baya. Buɗe layi don duba masu nema, tattaunawa, da hirarraki.",
    emptyMessage:
      "Babu layukan daukar ma'aikata tukuna. Ana ƙirƙirar layuka ta atomatik lokacin da ka buga matsayi.",
    applicantSingular: "mai nema",
    applicantPlural: "masu nema",
    statusActive: "Mai aiki",
    statusPaused: "An dakatar",
    statusClosed: "An rufe",
  },
};

const DE: DeepPartial<JobsCopy> = {
  nav: {
    browse: "Jobs durchsuchen",
    post: "Job veröffentlichen",
    applications: "Bewerbungen",
    account: "Konto",
  },
  hero: {
    title: "Einstellung geprüfter Talente, ohne den üblichen Lärm.",
    subtitle: "Finden Sie fokussierte Stellen von Arbeitgebern, die bei der Einstellung ernst machen.",
    searchPlaceholder: "Stelle, Fähigkeit oder Unternehmen",
    ctaBrowse: "Offene Stellen ansehen",
    ctaHire: "Ich stelle ein",
  },
  filters: {
    allRoles: "Alle Stellen",
    fullTime: "Vollzeit",
    partTime: "Teilzeit",
    contract: "Vertrag",
    remote: "Remote",
    onsite: "Vor Ort",
    hybrid: "Hybrid",
    location: "Standort",
    salary: "Gehalt",
    experience: "Erfahrung",
    clearAll: "Alle löschen",
  },
  listing: {
    applyNow: "Jetzt bewerben",
    saveJob: "Job speichern",
    shareJob: "Teilen",
    postedAgo: "Veröffentlicht",
    deadline: "Bewerbungsfrist",
    salary: "Gehalt",
    jobType: "Jobtyp",
    location: "Standort",
    experience: "Erforderliche Erfahrung",
    skills: "Fähigkeiten",
    aboutRole: "Über die Stelle",
    aboutCompany: "Über das Unternehmen",
    viewCompany: "Unternehmen ansehen",
  },
  application: {
    title: "Für diese Stelle bewerben",
    resume: "Lebenslauf / CV",
    coverLetter: "Anschreiben",
    submit: "Bewerbung einreichen",
    submitted: "Bewerbung eingereicht",
    underReview: "In Prüfung",
    shortlisted: "In der engeren Auswahl",
    rejected: "Nicht weiterverfolgt",
    offerMade: "Angebot gemacht",
  },
  hiring: {
    postJob: "Job veröffentlichen",
    managePostings: "Veröffentlichungen verwalten",
    reviewApplications: "Bewerbungen prüfen",
    closePosting: "Veröffentlichung schließen",
    editPosting: "Veröffentlichung bearbeiten",
  },
  empty: {
    noJobs: "Keine passenden Jobs gefunden. Passen Sie Ihre Filter an.",
    noApplications: "Noch keine Bewerbungen.",
    noPostings: "Keine aktiven Stellenanzeigen.",
  },
  employerHiring: {
    pageTitle: "Einstellungspipelines",
    pageSubtitle:
      "Verwalten Sie Ihre aktiven Einstellungspipelines, kommunizieren Sie mit Bewerbern und planen Sie Interviews aus einem Arbeitsbereich.",
    sectionTitle: "Alle Pipelines",
    sectionBody:
      "Jede Pipeline entspricht einer aktiven oder vergangenen Stelle. Öffnen Sie eine Pipeline, um Bewerber, Gespräche und Interviews einzusehen.",
    emptyMessage:
      "Noch keine Einstellungspipelines. Pipelines werden automatisch erstellt, sobald Sie eine Stelle veröffentlichen.",
    applicantSingular: "Bewerber",
    applicantPlural: "Bewerber",
    statusActive: "Aktiv",
    statusPaused: "Pausiert",
    statusClosed: "Geschlossen",
  },
};

const ZH: DeepPartial<JobsCopy> = {
  nav: {
    browse: "浏览职位",
    post: "发布职位",
    applications: "申请",
    account: "账户",
  },
  hero: {
    title: "招募经过验证的人才，没有通常的干扰。",
    subtitle: "从认真筛选人才的雇主处发现专注的职位。",
    searchPlaceholder: "职位、技能或公司",
    ctaBrowse: "浏览空缺职位",
    ctaHire: "我在招聘",
  },
  filters: {
    allRoles: "所有职位",
    fullTime: "全职",
    partTime: "兼职",
    contract: "合同",
    remote: "远程",
    onsite: "现场",
    hybrid: "混合",
    location: "地点",
    salary: "薪资",
    experience: "经验",
    clearAll: "清除所有",
  },
  listing: {
    applyNow: "立即申请",
    saveJob: "保存职位",
    shareJob: "分享",
    postedAgo: "已发布",
    deadline: "申请截止日期",
    salary: "薪资",
    jobType: "工作类型",
    location: "地点",
    experience: "所需经验",
    skills: "技能",
    aboutRole: "关于此职位",
    aboutCompany: "关于公司",
    viewCompany: "查看公司",
  },
  application: {
    title: "申请此职位",
    resume: "简历 / CV",
    coverLetter: "求职信",
    submit: "提交申请",
    submitted: "申请已提交",
    underReview: "审核中",
    shortlisted: "已入围",
    rejected: "未推进",
    offerMade: "已发出邀约",
  },
  hiring: {
    postJob: "发布职位",
    managePostings: "管理发布",
    reviewApplications: "查看申请",
    closePosting: "关闭发布",
    editPosting: "编辑发布",
  },
  empty: {
    noJobs: "未找到匹配的职位。请尝试调整筛选条件。",
    noApplications: "还没有申请。",
    noPostings: "没有活跃的职位发布。",
  },
  employerHiring: {
    pageTitle: "招聘流程",
    pageSubtitle: "在一个工作区中管理活跃招聘流程、与候选人沟通并安排面试。",
    sectionTitle: "全部流程",
    sectionBody: "每条流程对应一个活跃或已结束的职位。打开流程以查看候选人、对话和面试。",
    emptyMessage: "暂无招聘流程。发布职位后将自动创建流程。",
    applicantSingular: "位申请人",
    applicantPlural: "位申请人",
    statusActive: "进行中",
    statusPaused: "已暂停",
    statusClosed: "已关闭",
  },
};

const HI: DeepPartial<JobsCopy> = {
  nav: {
    browse: "नौकरियां देखें",
    post: "नौकरी पोस्ट करें",
    applications: "आवेदन",
    account: "खाता",
  },
  hero: {
    title: "सत्यापित प्रतिभा की भर्ती, सामान्य शोर के बिना।",
    subtitle: "उन नियोक्ताओं से केंद्रित भूमिकाएं खोजें जो भर्ती में गंभीर हैं।",
    searchPlaceholder: "भूमिका, कौशल, या कंपनी",
    ctaBrowse: "खुली नौकरियां देखें",
    ctaHire: "मैं भर्ती कर रहा हूं",
  },
  filters: {
    allRoles: "सभी भूमिकाएं",
    fullTime: "पूर्णकालिक",
    partTime: "अंशकालिक",
    contract: "अनुबंध",
    remote: "रिमोट",
    onsite: "साइट पर",
    hybrid: "हाइब्रिड",
    location: "स्थान",
    salary: "वेतन",
    experience: "अनुभव",
    clearAll: "सब साफ करें",
  },
  listing: {
    applyNow: "अभी आवेदन करें",
    saveJob: "नौकरी सहेजें",
    shareJob: "शेयर करें",
    postedAgo: "पोस्ट किया",
    deadline: "आवेदन की अंतिम तिथि",
    salary: "वेतन",
    jobType: "नौकरी का प्रकार",
    location: "स्थान",
    experience: "आवश्यक अनुभव",
    skills: "कौशल",
    aboutRole: "भूमिका के बारे में",
    aboutCompany: "कंपनी के बारे में",
    viewCompany: "कंपनी देखें",
  },
  application: {
    title: "इस भूमिका के लिए आवेदन करें",
    resume: "रेज़्युमे / CV",
    coverLetter: "कवर लेटर",
    submit: "आवेदन सबमिट करें",
    submitted: "आवेदन सबमिट किया गया",
    underReview: "समीक्षाधीन",
    shortlisted: "शॉर्टलिस्ट किया गया",
    rejected: "आगे नहीं बढ़ा",
    offerMade: "ऑफर दिया गया",
  },
  hiring: {
    postJob: "नौकरी पोस्ट करें",
    managePostings: "पोस्टिंग प्रबंधित करें",
    reviewApplications: "आवेदन देखें",
    closePosting: "पोस्टिंग बंद करें",
    editPosting: "पोस्टिंग संपादित करें",
  },
  empty: {
    noJobs: "कोई मिलान नौकरी नहीं मिली। अपने फिल्टर समायोजित करें।",
    noApplications: "अभी तक कोई आवेदन नहीं।",
    noPostings: "कोई सक्रिय नौकरी पोस्टिंग नहीं।",
  },
  employerHiring: {
    pageTitle: "भर्ती पाइपलाइन",
    pageSubtitle:
      "एक ही कार्यक्षेत्र से अपनी सक्रिय भर्ती पाइपलाइनों का प्रबंधन करें, उम्मीदवारों से संवाद करें और साक्षात्कार निर्धारित करें।",
    sectionTitle: "सभी पाइपलाइनें",
    sectionBody:
      "प्रत्येक पाइपलाइन एक सक्रिय या पिछली भूमिका से संबंधित है। आवेदकों, बातचीतों और साक्षात्कारों की समीक्षा के लिए कोई पाइपलाइन खोलें।",
    emptyMessage:
      "अभी तक कोई भर्ती पाइपलाइन नहीं है। जब आप कोई भूमिका प्रकाशित करते हैं तो पाइपलाइनें स्वचालित रूप से बन जाती हैं।",
    applicantSingular: "आवेदक",
    applicantPlural: "आवेदक",
    statusActive: "सक्रिय",
    statusPaused: "रोका गया",
    statusClosed: "बंद",
  },
};

const IT: DeepPartial<JobsCopy> = {
  "nav": {
    "browse": "Sfoglia i lavori",
    "post": "Pubblica un lavoro",
    "applications": "Applicazioni",
    "account": "Conto"
  },
  "hero": {
    "title": "Assumere talenti verificati, senza il solito rumore.",
    "subtitle": "Trova ruoli mirati da datori di lavoro che prendono sul serio le persone che assumono.",
    "searchPlaceholder": "Ruolo, competenza o azienda",
    "ctaBrowse": "Sfoglia i lavori aperti",
    "ctaHire": "Sto assumendo"
  },
  "filters": {
    "allRoles": "Tutti i ruoli",
    "fullTime": "A tempo pieno",
    "partTime": "Part-time",
    "contract": "Contratto",
    "remote": "Remoto",
    "onsite": "Sul posto",
    "hybrid": "Ibrido",
    "location": "Posizione",
    "salary": "Stipendio",
    "experience": "Esperienza",
    "clearAll": "Cancella tutto"
  },
  "listing": {
    "applyNow": "Candidati ora",
    "saveJob": "Salva lavoro",
    "shareJob": "Condividi",
    "postedAgo": "Pubblicato",
    "deadline": "Scadenza per la domanda",
    "salary": "Stipendio",
    "jobType": "Tipo di lavoro",
    "location": "Posizione",
    "experience": "Esperienza richiesta",
    "skills": "Abilità",
    "aboutRole": "Sul ruolo",
    "aboutCompany": "Informazioni sull'azienda",
    "viewCompany": "Visualizza azienda"
  },
  "application": {
    "title": "Candidati per questo ruolo",
    "resume": "Curriculum vitae/curriculum vitae",
    "coverLetter": "Lettera di presentazione",
    "submit": "Invia domanda",
    "submitted": "Domanda presentata",
    "underReview": "In corso di revisione",
    "shortlisted": "Selezionato",
    "rejected": "Non progredendo",
    "offerMade": "Offerta fatta"
  },
  "hiring": {
    "postJob": "Pubblica un lavoro",
    "managePostings": "Gestisci i post",
    "reviewApplications": "Esaminare le applicazioni",
    "closePosting": "Chiudi la pubblicazione",
    "editPosting": "Modifica pubblicazione"
  },
  "empty": {
    "noJobs": "Nessun lavoro corrispondente trovato. Prova a modificare i filtri.",
    "noApplications": "Nessuna candidatura ancora.",
    "noPostings": "Nessuna offerta di lavoro attiva."
  },
  "employerHiring": {
    "pageTitle": "Pipeline di assunzione",
    "pageSubtitle":
      "Gestisci le tue pipeline di assunzione attive, comunica con i candidati e pianifica i colloqui da un unico spazio di lavoro.",
    "sectionTitle": "Tutte le pipeline",
    "sectionBody":
      "Ogni pipeline corrisponde a un ruolo attivo o passato. Apri una pipeline per esaminare candidati, conversazioni e colloqui.",
    "emptyMessage":
      "Nessuna pipeline di assunzione per ora. Le pipeline vengono create automaticamente quando pubblichi un ruolo.",
    "applicantSingular": "candidato",
    "applicantPlural": "candidati",
    "statusActive": "Attiva",
    "statusPaused": "In pausa",
    "statusClosed": "Chiusa"
  }
};

const LOCALE_OVERRIDES: Partial<Record<AppLocale, DeepPartial<JobsCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  ig: IG,
  yo: YO,
  ha: HA,
  de: DE,
  it: IT,
  zh: ZH,
  hi: HI,
};

export function getJobsCopy(locale: AppLocale): JobsCopy {
  const overrides = LOCALE_OVERRIDES[locale];
  if (overrides) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as JobsCopy;
  }
  return EN;
}
