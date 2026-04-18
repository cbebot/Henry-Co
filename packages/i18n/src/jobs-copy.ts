import type { AppLocale } from "./locales";
import { deepMergeMessages } from "./merge-messages";

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
};

const FR: Partial<JobsCopy> = {
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
};

const ES: Partial<JobsCopy> = {
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
};

const PT: Partial<JobsCopy> = {
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
};

const AR: Partial<JobsCopy> = {
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
};

const IG: Partial<JobsCopy> = {
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
};

const YO: Partial<JobsCopy> = {
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
};

const HA: Partial<JobsCopy> = {
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
};

const DE: Partial<JobsCopy> = {
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
};

const ZH: Partial<JobsCopy> = {
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
};

const HI: Partial<JobsCopy> = {
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
};

const IT: Partial<JobsCopy> = {
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
  }
};

const LOCALE_OVERRIDES: Partial<Record<AppLocale, Partial<JobsCopy>>> = {
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
