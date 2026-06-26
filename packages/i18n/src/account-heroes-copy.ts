import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

export type AccountHeroesCopy = {
  applicationsList: {
    listLabel: string;
    lastUpdate: string;
    rowAria: string;
  };
  jobsHero: {
    heroAria: string;
    eyebrow: string;
    headlineStart: string;
    headlineApplicationsSingular: string;
    headlineApplicationsPlural: string;
    headlineSavedSingular: string;
    headlineSavedPlural: string;
    blurbEmpty: string;
    blurbActive: string;
    browseRoles: string;
    interviewRooms: string;
    candidateWorkspace: string;
    summaryAria: string;
    activeApplications: string;
    savedRoles: string;
    recruiterUpdates: string;
    recruiterUpdatesFoot: string;
    profileReadinessAria: string;
    profileReadinessLabel: string;
  };
  readinessCard: {
    cardAria: string;
  };
  savedRolesList: {
    listLabel: string;
    saved: string;
    rowAria: string;
  };
  activityList: {
    listLabel: string;
  };
  securityHero: {
    heroAria: string;
    accountActiveSingular: string;
    accountActivePlural: string;
    flaggedSingular: string;
    flaggedPlural: string;
    flaggedSuffix: string;
    trustSignalAria: string;
    trustScore: string;
    nextTierAria: string;
    nextTier: string;
  };
  signalsStrip: {
    listLabel: string;
  };
  attentionPanel: {
    kicker: string;
    title: string;
    chipSecurity: string;
    chipUrgent: string;
    chipBlocking: string;
    continueLabel: string;
  };
  signalFeed: {
    kicker: string;
    emptyHeadline: string;
    emptyBody: string;
    headline: string;
    openInbox: string;
    paginationAria: string;
    newer: string;
    older: string;
    emailed: string;
  };
  smartHomeHeader: {
    fallbackTitle: string;
    fallbackBody: string;
    unreadSignalSingular: string;
    unreadSignalPlural: string;
    needsAttentionSingular: string;
    needsAttentionPlural: string;
    lastActivity: string;
    savedRailAriaSingular: string;
    savedRailAriaPlural: string;
    savedRailLabel: string;
  };
  tasksHero: {
    heroAria: string;
    volumeAria: string;
    guidanceAria: string;
    blockingFootZero: string;
    blockingFootSome: string;
    urgentFootRoutine: string;
    totalFootSingular: string;
    totalFootPlural: string;
    bySource: string;
  };
  tasksList: {
    listLabel: string;
    priorityUrgent: string;
    priorityHigh: string;
    priorityRoutine: string;
    priorityQuiet: string;
  };
};

const EN: AccountHeroesCopy = {
  applicationsList: {
    listLabel: "Active applications",
    lastUpdate: "last update",
    rowAria: "at",
  },
  jobsHero: {
    heroAria: "Jobs overview",
    eyebrow: "Jobs · live",
    headlineStart: "Start your job hunt.",
    headlineApplicationsSingular: "application in motion.",
    headlineApplicationsPlural: "applications in motion.",
    headlineSavedSingular: "role on your shortlist.",
    headlineSavedPlural: "roles on your shortlist.",
    blurbEmpty:
      "Browse live roles on {host}, save shortlists, and apply with one tap. Recruiter updates land in your account in real time.",
    blurbActive:
      "Applications, saved roles, recruiter updates, and profile signal — all mirrored from HenryCo Jobs into your account.",
    browseRoles: "Browse live roles",
    interviewRooms: "Interview rooms",
    candidateWorkspace: "Candidate workspace",
    summaryAria: "Hunt summary",
    activeApplications: "Active applications",
    savedRoles: "Saved roles",
    recruiterUpdates: "Recruiter updates",
    recruiterUpdatesFoot: "In your jobs inbox",
    profileReadinessAria: "Profile readiness",
    profileReadinessLabel: "Profile readiness",
  },
  readinessCard: {
    cardAria: "Profile readiness checklist",
  },
  savedRolesList: {
    listLabel: "Saved roles",
    saved: "saved",
    rowAria: "at",
  },
  activityList: {
    listLabel: "Recent security events",
  },
  securityHero: {
    heroAria: "Security overview",
    accountActiveSingular: "Account active {count} day",
    accountActivePlural: "Account active {count} days",
    flaggedSingular: "{count} flagged event on file",
    flaggedPlural: "{count} flagged events on file",
    flaggedSuffix: "review below",
    trustSignalAria: "Trust signal",
    trustScore: "Trust score",
    nextTierAria: "Next tier {tier}",
    nextTier: "Next ·",
  },
  signalsStrip: {
    listLabel: "Security signals",
  },
  attentionPanel: {
    kicker: "Attention",
    title: "Open threads ranked by what blocks first",
    chipSecurity: "security",
    chipUrgent: "urgent",
    chipBlocking: "blocking",
    continueLabel: "Continue where you left off",
  },
  signalFeed: {
    kicker: "Signal feed",
    emptyHeadline: "Nothing to surface yet.",
    emptyBody:
      "When notifications, lifecycle updates, or division activity land, they appear here ranked by priority.",
    headline: "Everything across HenryCo, ranked",
    openInbox: "Open inbox",
    paginationAria: "Signal feed pagination",
    newer: "Newer",
    older: "Older",
    emailed: "Emailed",
  },
  smartHomeHeader: {
    fallbackTitle: "Your dashboard",
    fallbackBody: "Live signals across HenryCo will surface here as they land.",
    unreadSignalSingular: "{count} unread signal",
    unreadSignalPlural: "{count} unread signals",
    needsAttentionSingular: "{count} needs attention",
    needsAttentionPlural: "{count} need attention",
    lastActivity: "last activity {time}",
    savedRailAriaSingular: "{count} saved item — resume",
    savedRailAriaPlural: "{count} saved items — resume",
    savedRailLabel: "saved · resume",
  },
  tasksHero: {
    heroAria: "Tasks overview",
    volumeAria: "Task volume",
    guidanceAria: "How the queue works",
    blockingFootZero: "Nothing blocking right now",
    blockingFootSome: "Resolve to unblock other lanes",
    urgentFootRoutine: "routine",
    totalFootSingular: "division represented",
    totalFootPlural: "divisions represented",
    bySource: "By source",
  },
  tasksList: {
    listLabel: "Pending tasks",
    priorityUrgent: "Urgent",
    priorityHigh: "High",
    priorityRoutine: "Routine",
    priorityQuiet: "Quiet",
  },
};

const FR: DeepPartial<AccountHeroesCopy> = {
  applicationsList: {
    listLabel: "Candidatures actives",
    lastUpdate: "dernière mise à jour",
    rowAria: "chez",
  },
  jobsHero: {
    heroAria: "Aperçu des emplois",
    eyebrow: "Emplois · en direct",
    headlineStart: "Lancez votre recherche d'emploi.",
    headlineApplicationsSingular: "candidature en cours.",
    headlineApplicationsPlural: "candidatures en cours.",
    headlineSavedSingular: "poste dans votre sélection.",
    headlineSavedPlural: "postes dans votre sélection.",
    blurbEmpty:
      "Parcourez les postes en direct sur {host}, enregistrez des sélections et postulez en un clic. Les mises à jour des recruteurs arrivent dans votre compte en temps réel.",
    blurbActive:
      "Candidatures, postes enregistrés, mises à jour des recruteurs et signal de profil — tout est synchronisé depuis HenryCo Jobs vers votre compte.",
    browseRoles: "Parcourir les postes en direct",
    interviewRooms: "Salles d'entretien",
    candidateWorkspace: "Espace candidat",
    summaryAria: "Résumé de la recherche",
    activeApplications: "Candidatures actives",
    savedRoles: "Postes enregistrés",
    recruiterUpdates: "Mises à jour des recruteurs",
    recruiterUpdatesFoot: "Dans votre boîte de réception emplois",
    profileReadinessAria: "État du profil",
    profileReadinessLabel: "État du profil",
  },
  readinessCard: {
    cardAria: "Liste de vérification de l'état du profil",
  },
  savedRolesList: {
    listLabel: "Postes enregistrés",
    saved: "enregistré",
    rowAria: "chez",
  },
  activityList: {
    listLabel: "Événements de sécurité récents",
  },
  securityHero: {
    heroAria: "Aperçu de la sécurité",
    accountActiveSingular: "Compte actif depuis {count} jour",
    accountActivePlural: "Compte actif depuis {count} jours",
    flaggedSingular: "{count} événement signalé au dossier",
    flaggedPlural: "{count} événements signalés au dossier",
    flaggedSuffix: "voir ci-dessous",
    trustSignalAria: "Signal de confiance",
    trustScore: "Score de confiance",
    nextTierAria: "Niveau suivant {tier}",
    nextTier: "Suivant ·",
  },
  signalsStrip: {
    listLabel: "Signaux de sécurité",
  },
  attentionPanel: {
    kicker: "Attention",
    title: "Fils ouverts classés selon ce qui bloque en premier",
    chipSecurity: "sécurité",
    chipUrgent: "urgent",
    chipBlocking: "bloquant",
    continueLabel: "Reprendre là où vous vous êtes arrêté",
  },
  signalFeed: {
    kicker: "Flux de signaux",
    emptyHeadline: "Rien à afficher pour le moment.",
    emptyBody:
      "Lorsque des notifications, des mises à jour de cycle de vie ou de l'activité de division arrivent, elles apparaissent ici, classées par priorité.",
    headline: "Tout sur HenryCo, classé",
    openInbox: "Ouvrir la boîte de réception",
    paginationAria: "Pagination du flux de signaux",
    newer: "Plus récents",
    older: "Plus anciens",
    emailed: "Envoyé par e-mail",
  },
  smartHomeHeader: {
    fallbackTitle: "Votre tableau de bord",
    fallbackBody: "Les signaux en direct de HenryCo apparaîtront ici dès qu'ils arrivent.",
    unreadSignalSingular: "{count} signal non lu",
    unreadSignalPlural: "{count} signaux non lus",
    needsAttentionSingular: "{count} requiert votre attention",
    needsAttentionPlural: "{count} requièrent votre attention",
    lastActivity: "dernière activité {time}",
    savedRailAriaSingular: "{count} élément enregistré — reprendre",
    savedRailAriaPlural: "{count} éléments enregistrés — reprendre",
    savedRailLabel: "enregistrés · reprendre",
  },
  tasksHero: {
    heroAria: "Aperçu des tâches",
    volumeAria: "Volume de tâches",
    guidanceAria: "Comment fonctionne la file",
    blockingFootZero: "Rien ne bloque pour le moment",
    blockingFootSome: "Résolvez pour débloquer les autres voies",
    urgentFootRoutine: "courantes",
    totalFootSingular: "division représentée",
    totalFootPlural: "divisions représentées",
    bySource: "Par source",
  },
  tasksList: {
    listLabel: "Tâches en attente",
    priorityUrgent: "Urgent",
    priorityHigh: "Élevée",
    priorityRoutine: "Courante",
    priorityQuiet: "Calme",
  },
};

const ES: DeepPartial<AccountHeroesCopy> = {
  applicationsList: {
    listLabel: "Solicitudes activas",
    lastUpdate: "última actualización",
    rowAria: "en",
  },
  jobsHero: {
    heroAria: "Resumen de empleos",
    eyebrow: "Empleos · en vivo",
    headlineStart: "Comienza tu búsqueda de empleo.",
    headlineApplicationsSingular: "solicitud en curso.",
    headlineApplicationsPlural: "solicitudes en curso.",
    headlineSavedSingular: "puesto en tu lista.",
    headlineSavedPlural: "puestos en tu lista.",
    blurbEmpty:
      "Explora puestos en vivo en {host}, guarda tus listas y postúlate con un solo toque. Las novedades de los reclutadores llegan a tu cuenta en tiempo real.",
    blurbActive:
      "Solicitudes, puestos guardados, novedades de reclutadores y señal de perfil: todo reflejado desde HenryCo Jobs en tu cuenta.",
    browseRoles: "Explorar puestos en vivo",
    interviewRooms: "Salas de entrevista",
    candidateWorkspace: "Espacio del candidato",
    summaryAria: "Resumen de la búsqueda",
    activeApplications: "Solicitudes activas",
    savedRoles: "Puestos guardados",
    recruiterUpdates: "Novedades de reclutadores",
    recruiterUpdatesFoot: "En tu bandeja de empleos",
    profileReadinessAria: "Preparación del perfil",
    profileReadinessLabel: "Preparación del perfil",
  },
  readinessCard: {
    cardAria: "Lista de verificación de preparación del perfil",
  },
  savedRolesList: {
    listLabel: "Puestos guardados",
    saved: "guardado",
    rowAria: "en",
  },
  activityList: {
    listLabel: "Eventos de seguridad recientes",
  },
  securityHero: {
    heroAria: "Resumen de seguridad",
    accountActiveSingular: "Cuenta activa desde hace {count} día",
    accountActivePlural: "Cuenta activa desde hace {count} días",
    flaggedSingular: "{count} evento marcado en el registro",
    flaggedPlural: "{count} eventos marcados en el registro",
    flaggedSuffix: "revisar abajo",
    trustSignalAria: "Señal de confianza",
    trustScore: "Puntuación de confianza",
    nextTierAria: "Siguiente nivel {tier}",
    nextTier: "Siguiente ·",
  },
  signalsStrip: {
    listLabel: "Señales de seguridad",
  },
  attentionPanel: {
    kicker: "Atención",
    title: "Hilos abiertos ordenados por lo que bloquea primero",
    chipSecurity: "seguridad",
    chipUrgent: "urgente",
    chipBlocking: "bloqueante",
    continueLabel: "Continúa donde lo dejaste",
  },
  signalFeed: {
    kicker: "Flujo de señales",
    emptyHeadline: "Nada que mostrar todavía.",
    emptyBody:
      "Cuando lleguen notificaciones, actualizaciones de ciclo de vida o actividad de divisiones, aparecerán aquí ordenadas por prioridad.",
    headline: "Todo en HenryCo, ordenado",
    openInbox: "Abrir bandeja",
    paginationAria: "Paginación del flujo de señales",
    newer: "Más recientes",
    older: "Más antiguas",
    emailed: "Enviado por correo",
  },
  smartHomeHeader: {
    fallbackTitle: "Tu panel",
    fallbackBody: "Las señales en vivo de HenryCo aparecerán aquí en cuanto lleguen.",
    unreadSignalSingular: "{count} señal sin leer",
    unreadSignalPlural: "{count} señales sin leer",
    needsAttentionSingular: "{count} requiere atención",
    needsAttentionPlural: "{count} requieren atención",
    lastActivity: "última actividad {time}",
    savedRailAriaSingular: "{count} elemento guardado — reanudar",
    savedRailAriaPlural: "{count} elementos guardados — reanudar",
    savedRailLabel: "guardados · reanudar",
  },
  tasksHero: {
    heroAria: "Resumen de tareas",
    volumeAria: "Volumen de tareas",
    guidanceAria: "Cómo funciona la cola",
    blockingFootZero: "Nada bloquea por ahora",
    blockingFootSome: "Resuelve para desbloquear otras vías",
    urgentFootRoutine: "rutinarias",
    totalFootSingular: "división representada",
    totalFootPlural: "divisiones representadas",
    bySource: "Por origen",
  },
  tasksList: {
    listLabel: "Tareas pendientes",
    priorityUrgent: "Urgente",
    priorityHigh: "Alta",
    priorityRoutine: "Rutinaria",
    priorityQuiet: "Tranquila",
  },
};

const PT: DeepPartial<AccountHeroesCopy> = {
  applicationsList: {
    listLabel: "Candidaturas ativas",
    lastUpdate: "última atualização",
    rowAria: "na",
  },
  jobsHero: {
    heroAria: "Visão geral de empregos",
    eyebrow: "Empregos · ao vivo",
    headlineStart: "Comece sua busca por emprego.",
    headlineApplicationsSingular: "candidatura em andamento.",
    headlineApplicationsPlural: "candidaturas em andamento.",
    headlineSavedSingular: "vaga na sua lista.",
    headlineSavedPlural: "vagas na sua lista.",
    blurbEmpty:
      "Explore vagas ao vivo em {host}, salve listas e candidate-se com um toque. As atualizações dos recrutadores chegam à sua conta em tempo real.",
    blurbActive:
      "Candidaturas, vagas salvas, atualizações de recrutadores e sinal de perfil — tudo espelhado do HenryCo Jobs na sua conta.",
    browseRoles: "Explorar vagas ao vivo",
    interviewRooms: "Salas de entrevista",
    candidateWorkspace: "Espaço do candidato",
    summaryAria: "Resumo da busca",
    activeApplications: "Candidaturas ativas",
    savedRoles: "Vagas salvas",
    recruiterUpdates: "Atualizações de recrutadores",
    recruiterUpdatesFoot: "Na sua caixa de empregos",
    profileReadinessAria: "Prontidão do perfil",
    profileReadinessLabel: "Prontidão do perfil",
  },
  readinessCard: {
    cardAria: "Lista de verificação de prontidão do perfil",
  },
  savedRolesList: {
    listLabel: "Vagas salvas",
    saved: "salvo",
    rowAria: "na",
  },
  activityList: {
    listLabel: "Eventos de segurança recentes",
  },
  securityHero: {
    heroAria: "Visão geral de segurança",
    accountActiveSingular: "Conta ativa há {count} dia",
    accountActivePlural: "Conta ativa há {count} dias",
    flaggedSingular: "{count} evento sinalizado no registro",
    flaggedPlural: "{count} eventos sinalizados no registro",
    flaggedSuffix: "revise abaixo",
    trustSignalAria: "Sinal de confiança",
    trustScore: "Pontuação de confiança",
    nextTierAria: "Próximo nível {tier}",
    nextTier: "Próximo ·",
  },
  signalsStrip: {
    listLabel: "Sinais de segurança",
  },
  attentionPanel: {
    kicker: "Atenção",
    title: "Tópicos abertos ordenados pelo que bloqueia primeiro",
    chipSecurity: "segurança",
    chipUrgent: "urgente",
    chipBlocking: "bloqueador",
    continueLabel: "Continue de onde você parou",
  },
  signalFeed: {
    kicker: "Fluxo de sinais",
    emptyHeadline: "Nada para mostrar ainda.",
    emptyBody:
      "Quando notificações, atualizações de ciclo de vida ou atividade de divisão chegarem, elas aparecerão aqui ordenadas por prioridade.",
    headline: "Tudo no HenryCo, ordenado",
    openInbox: "Abrir caixa de entrada",
    paginationAria: "Paginação do fluxo de sinais",
    newer: "Mais recentes",
    older: "Mais antigos",
    emailed: "Enviado por e-mail",
  },
  smartHomeHeader: {
    fallbackTitle: "Seu painel",
    fallbackBody: "Os sinais ao vivo do HenryCo aparecerão aqui assim que chegarem.",
    unreadSignalSingular: "{count} sinal não lido",
    unreadSignalPlural: "{count} sinais não lidos",
    needsAttentionSingular: "{count} precisa de atenção",
    needsAttentionPlural: "{count} precisam de atenção",
    lastActivity: "última atividade {time}",
    savedRailAriaSingular: "{count} item salvo — retomar",
    savedRailAriaPlural: "{count} itens salvos — retomar",
    savedRailLabel: "salvos · retomar",
  },
  tasksHero: {
    heroAria: "Visão geral das tarefas",
    volumeAria: "Volume de tarefas",
    guidanceAria: "Como funciona a fila",
    blockingFootZero: "Nada bloqueando no momento",
    blockingFootSome: "Resolva para desbloquear outras frentes",
    urgentFootRoutine: "rotineiras",
    totalFootSingular: "divisão representada",
    totalFootPlural: "divisões representadas",
    bySource: "Por origem",
  },
  tasksList: {
    listLabel: "Tarefas pendentes",
    priorityUrgent: "Urgente",
    priorityHigh: "Alta",
    priorityRoutine: "Rotineira",
    priorityQuiet: "Tranquila",
  },
};

const AR: DeepPartial<AccountHeroesCopy> = {
  applicationsList: {
    listLabel: "الطلبات النشطة",
    lastUpdate: "آخر تحديث",
    rowAria: "في",
  },
  jobsHero: {
    heroAria: "نظرة عامة على الوظائف",
    eyebrow: "الوظائف · مباشر",
    headlineStart: "ابدأ بحثك عن عمل.",
    headlineApplicationsSingular: "طلب قيد المعالجة.",
    headlineApplicationsPlural: "طلبات قيد المعالجة.",
    headlineSavedSingular: "وظيفة في قائمتك المختصرة.",
    headlineSavedPlural: "وظائف في قائمتك المختصرة.",
    blurbEmpty:
      "تصفّح الوظائف المباشرة على {host}، واحفظ قوائمك المختصرة، وقدّم بنقرة واحدة. تصلك تحديثات جهات التوظيف إلى حسابك مباشرة.",
    blurbActive:
      "الطلبات والوظائف المحفوظة وتحديثات جهات التوظيف وإشارة الملف الشخصي — كلها مرآة من HenryCo Jobs إلى حسابك.",
    browseRoles: "تصفّح الوظائف المباشرة",
    interviewRooms: "غرف المقابلات",
    candidateWorkspace: "مساحة المرشح",
    summaryAria: "ملخص البحث",
    activeApplications: "الطلبات النشطة",
    savedRoles: "الوظائف المحفوظة",
    recruiterUpdates: "تحديثات جهات التوظيف",
    recruiterUpdatesFoot: "في صندوق وظائفك",
    profileReadinessAria: "جاهزية الملف الشخصي",
    profileReadinessLabel: "جاهزية الملف الشخصي",
  },
  readinessCard: {
    cardAria: "قائمة التحقق من جاهزية الملف الشخصي",
  },
  savedRolesList: {
    listLabel: "الوظائف المحفوظة",
    saved: "محفوظة",
    rowAria: "في",
  },
  activityList: {
    listLabel: "أحداث الأمان الأخيرة",
  },
  securityHero: {
    heroAria: "نظرة عامة على الأمان",
    accountActiveSingular: "الحساب نشط منذ {count} يوم",
    accountActivePlural: "الحساب نشط منذ {count} يومًا",
    flaggedSingular: "{count} حدث مُعلَّم في السجل",
    flaggedPlural: "{count} أحداث مُعلَّمة في السجل",
    flaggedSuffix: "راجع أدناه",
    trustSignalAria: "إشارة الثقة",
    trustScore: "درجة الثقة",
    nextTierAria: "المستوى التالي {tier}",
    nextTier: "التالي ·",
  },
  signalsStrip: {
    listLabel: "إشارات الأمان",
  },
  attentionPanel: {
    kicker: "انتباه",
    title: "المواضيع المفتوحة مرتّبة حسب ما يعرقل أولًا",
    chipSecurity: "أمان",
    chipUrgent: "عاجل",
    chipBlocking: "معرقِل",
    continueLabel: "تابع من حيث توقفت",
  },
  signalFeed: {
    kicker: "تدفق الإشارات",
    emptyHeadline: "لا شيء لعرضه بعد.",
    emptyBody:
      "عند وصول الإشعارات أو تحديثات دورة الحياة أو نشاط الأقسام، ستظهر هنا مرتّبة حسب الأولوية.",
    headline: "كل شيء عبر HenryCo، مرتّبًا",
    openInbox: "فتح صندوق الوارد",
    paginationAria: "ترقيم صفحات تدفق الإشارات",
    newer: "الأحدث",
    older: "الأقدم",
    emailed: "أُرسل بالبريد",
  },
  smartHomeHeader: {
    fallbackTitle: "لوحة التحكم الخاصة بك",
    fallbackBody: "ستظهر الإشارات المباشرة عبر HenryCo هنا فور وصولها.",
    unreadSignalSingular: "{count} إشارة غير مقروءة",
    unreadSignalPlural: "{count} إشارات غير مقروءة",
    needsAttentionSingular: "{count} يحتاج إلى انتباه",
    needsAttentionPlural: "{count} تحتاج إلى انتباه",
    lastActivity: "آخر نشاط {time}",
    savedRailAriaSingular: "{count} عنصر محفوظ — استئناف",
    savedRailAriaPlural: "{count} عناصر محفوظة — استئناف",
    savedRailLabel: "محفوظة · استئناف",
  },
  tasksHero: {
    heroAria: "نظرة عامة على المهام",
    volumeAria: "حجم المهام",
    guidanceAria: "كيف تعمل قائمة الانتظار",
    blockingFootZero: "لا شيء يعرقل الآن",
    blockingFootSome: "قم بالحل لإلغاء عرقلة المسارات الأخرى",
    urgentFootRoutine: "روتينية",
    totalFootSingular: "قسم ممثَّل",
    totalFootPlural: "أقسام ممثَّلة",
    bySource: "حسب المصدر",
  },
  tasksList: {
    listLabel: "المهام المعلّقة",
    priorityUrgent: "عاجل",
    priorityHigh: "عالية",
    priorityRoutine: "روتينية",
    priorityQuiet: "هادئة",
  },
};

const DE: DeepPartial<AccountHeroesCopy> = {
  applicationsList: {
    listLabel: "Aktive Bewerbungen",
    lastUpdate: "letzte Aktualisierung",
    rowAria: "bei",
  },
  jobsHero: {
    heroAria: "Jobs-Überblick",
    eyebrow: "Jobs · live",
    headlineStart: "Starten Sie Ihre Jobsuche.",
    headlineApplicationsSingular: "Bewerbung in Bearbeitung.",
    headlineApplicationsPlural: "Bewerbungen in Bearbeitung.",
    headlineSavedSingular: "Stelle auf Ihrer Auswahlliste.",
    headlineSavedPlural: "Stellen auf Ihrer Auswahlliste.",
    blurbEmpty:
      "Durchstöbern Sie aktuelle Stellen auf {host}, speichern Sie Auswahllisten und bewerben Sie sich mit einem Tippen. Updates von Recruitern landen in Echtzeit in Ihrem Konto.",
    blurbActive:
      "Bewerbungen, gespeicherte Stellen, Recruiter-Updates und Profilsignal — alles aus HenryCo Jobs in Ihr Konto gespiegelt.",
    browseRoles: "Aktuelle Stellen durchsuchen",
    interviewRooms: "Interview-Räume",
    candidateWorkspace: "Kandidaten-Arbeitsbereich",
    summaryAria: "Suchübersicht",
    activeApplications: "Aktive Bewerbungen",
    savedRoles: "Gespeicherte Stellen",
    recruiterUpdates: "Recruiter-Updates",
    recruiterUpdatesFoot: "In Ihrem Jobs-Posteingang",
    profileReadinessAria: "Profilbereitschaft",
    profileReadinessLabel: "Profilbereitschaft",
  },
  readinessCard: {
    cardAria: "Checkliste zur Profilbereitschaft",
  },
  savedRolesList: {
    listLabel: "Gespeicherte Stellen",
    saved: "gespeichert",
    rowAria: "bei",
  },
  activityList: {
    listLabel: "Aktuelle Sicherheitsereignisse",
  },
  securityHero: {
    heroAria: "Sicherheitsüberblick",
    accountActiveSingular: "Konto seit {count} Tag aktiv",
    accountActivePlural: "Konto seit {count} Tagen aktiv",
    flaggedSingular: "{count} markiertes Ereignis im Protokoll",
    flaggedPlural: "{count} markierte Ereignisse im Protokoll",
    flaggedSuffix: "siehe unten",
    trustSignalAria: "Vertrauenssignal",
    trustScore: "Vertrauenswert",
    nextTierAria: "Nächste Stufe {tier}",
    nextTier: "Nächste ·",
  },
  signalsStrip: {
    listLabel: "Sicherheitssignale",
  },
  attentionPanel: {
    kicker: "Achtung",
    title: "Offene Vorgänge geordnet nach dem, was zuerst blockiert",
    chipSecurity: "Sicherheit",
    chipUrgent: "dringend",
    chipBlocking: "blockierend",
    continueLabel: "Dort weitermachen, wo Sie aufgehört haben",
  },
  signalFeed: {
    kicker: "Signal-Feed",
    emptyHeadline: "Noch nichts anzuzeigen.",
    emptyBody:
      "Wenn Benachrichtigungen, Lebenszyklus-Updates oder Divisionsaktivitäten eintreffen, erscheinen sie hier nach Priorität geordnet.",
    headline: "Alles bei HenryCo, geordnet",
    openInbox: "Posteingang öffnen",
    paginationAria: "Seitennavigation des Signal-Feeds",
    newer: "Neuere",
    older: "Ältere",
    emailed: "Per E-Mail gesendet",
  },
  smartHomeHeader: {
    fallbackTitle: "Ihr Dashboard",
    fallbackBody: "Live-Signale aus HenryCo erscheinen hier, sobald sie eintreffen.",
    unreadSignalSingular: "{count} ungelesenes Signal",
    unreadSignalPlural: "{count} ungelesene Signale",
    needsAttentionSingular: "{count} erfordert Aufmerksamkeit",
    needsAttentionPlural: "{count} erfordern Aufmerksamkeit",
    lastActivity: "letzte Aktivität {time}",
    savedRailAriaSingular: "{count} gespeichertes Element — fortsetzen",
    savedRailAriaPlural: "{count} gespeicherte Elemente — fortsetzen",
    savedRailLabel: "gespeichert · fortsetzen",
  },
  tasksHero: {
    heroAria: "Aufgabenübersicht",
    volumeAria: "Aufgabenvolumen",
    guidanceAria: "So funktioniert die Warteschlange",
    blockingFootZero: "Derzeit blockiert nichts",
    blockingFootSome: "Lösen, um andere Bereiche freizugeben",
    urgentFootRoutine: "Routine",
    totalFootSingular: "Division vertreten",
    totalFootPlural: "Divisionen vertreten",
    bySource: "Nach Quelle",
  },
  tasksList: {
    listLabel: "Ausstehende Aufgaben",
    priorityUrgent: "Dringend",
    priorityHigh: "Hoch",
    priorityRoutine: "Routine",
    priorityQuiet: "Ruhig",
  },
};

const IT: DeepPartial<AccountHeroesCopy> = {
  applicationsList: {
    listLabel: "Candidature attive",
    lastUpdate: "ultimo aggiornamento",
    rowAria: "presso",
  },
  jobsHero: {
    heroAria: "Panoramica lavori",
    eyebrow: "Lavoro · in diretta",
    headlineStart: "Inizia la tua ricerca di lavoro.",
    headlineApplicationsSingular: "candidatura in corso.",
    headlineApplicationsPlural: "candidature in corso.",
    headlineSavedSingular: "ruolo nella tua selezione.",
    headlineSavedPlural: "ruoli nella tua selezione.",
    blurbEmpty:
      "Esplora i ruoli in diretta su {host}, salva le selezioni e candidati con un tocco. Gli aggiornamenti dei recruiter arrivano nel tuo account in tempo reale.",
    blurbActive:
      "Candidature, ruoli salvati, aggiornamenti dei recruiter e segnale del profilo: tutto rispecchiato da HenryCo Jobs nel tuo account.",
    browseRoles: "Esplora i ruoli in diretta",
    interviewRooms: "Sale colloqui",
    candidateWorkspace: "Area candidato",
    summaryAria: "Riepilogo ricerca",
    activeApplications: "Candidature attive",
    savedRoles: "Ruoli salvati",
    recruiterUpdates: "Aggiornamenti dei recruiter",
    recruiterUpdatesFoot: "Nella tua casella lavori",
    profileReadinessAria: "Prontezza del profilo",
    profileReadinessLabel: "Prontezza del profilo",
  },
  readinessCard: {
    cardAria: "Elenco di controllo della prontezza del profilo",
  },
  savedRolesList: {
    listLabel: "Ruoli salvati",
    saved: "salvato",
    rowAria: "presso",
  },
  activityList: {
    listLabel: "Eventi di sicurezza recenti",
  },
  securityHero: {
    heroAria: "Panoramica sicurezza",
    accountActiveSingular: "Account attivo da {count} giorno",
    accountActivePlural: "Account attivo da {count} giorni",
    flaggedSingular: "{count} evento segnalato in archivio",
    flaggedPlural: "{count} eventi segnalati in archivio",
    flaggedSuffix: "rivedi sotto",
    trustSignalAria: "Segnale di fiducia",
    trustScore: "Punteggio di fiducia",
    nextTierAria: "Livello successivo {tier}",
    nextTier: "Successivo ·",
  },
  signalsStrip: {
    listLabel: "Segnali di sicurezza",
  },
  attentionPanel: {
    kicker: "Attenzione",
    title: "Conversazioni aperte ordinate per ciò che blocca prima",
    chipSecurity: "sicurezza",
    chipUrgent: "urgente",
    chipBlocking: "bloccante",
    continueLabel: "Riprendi da dove avevi lasciato",
  },
  signalFeed: {
    kicker: "Flusso di segnali",
    emptyHeadline: "Niente da mostrare per ora.",
    emptyBody:
      "Quando arrivano notifiche, aggiornamenti del ciclo di vita o attività di divisione, appariranno qui ordinati per priorità.",
    headline: "Tutto su HenryCo, in ordine",
    openInbox: "Apri la posta",
    paginationAria: "Impaginazione del flusso di segnali",
    newer: "Più recenti",
    older: "Più vecchi",
    emailed: "Inviato via e-mail",
  },
  smartHomeHeader: {
    fallbackTitle: "La tua dashboard",
    fallbackBody: "I segnali in diretta di HenryCo appariranno qui appena arrivano.",
    unreadSignalSingular: "{count} segnale non letto",
    unreadSignalPlural: "{count} segnali non letti",
    needsAttentionSingular: "{count} richiede attenzione",
    needsAttentionPlural: "{count} richiedono attenzione",
    lastActivity: "ultima attività {time}",
    savedRailAriaSingular: "{count} elemento salvato — riprendi",
    savedRailAriaPlural: "{count} elementi salvati — riprendi",
    savedRailLabel: "salvati · riprendi",
  },
  tasksHero: {
    heroAria: "Panoramica attività",
    volumeAria: "Volume di attività",
    guidanceAria: "Come funziona la coda",
    blockingFootZero: "Nulla blocca al momento",
    blockingFootSome: "Risolvi per sbloccare le altre corsie",
    urgentFootRoutine: "di routine",
    totalFootSingular: "divisione rappresentata",
    totalFootPlural: "divisioni rappresentate",
    bySource: "Per origine",
  },
  tasksList: {
    listLabel: "Attività in sospeso",
    priorityUrgent: "Urgente",
    priorityHigh: "Alta",
    priorityRoutine: "Routine",
    priorityQuiet: "Tranquilla",
  },
};

const ZH: DeepPartial<AccountHeroesCopy> = {
  applicationsList: {
    listLabel: "进行中的申请",
    lastUpdate: "最近更新",
    rowAria: "于",
  },
  jobsHero: {
    heroAria: "工作概览",
    eyebrow: "工作 · 实时",
    headlineStart: "开始你的求职。",
    headlineApplicationsSingular: "份申请进行中。",
    headlineApplicationsPlural: "份申请进行中。",
    headlineSavedSingular: "个职位在你的候选名单中。",
    headlineSavedPlural: "个职位在你的候选名单中。",
    blurbEmpty:
      "在 {host} 浏览实时职位、保存候选名单，并一键申请。招聘方的更新会实时显示在你的账户中。",
    blurbActive:
      "申请、已保存职位、招聘方更新和资料信号——全部从 HenryCo Jobs 同步到你的账户。",
    browseRoles: "浏览实时职位",
    interviewRooms: "面试室",
    candidateWorkspace: "候选人工作区",
    summaryAria: "求职摘要",
    activeApplications: "进行中的申请",
    savedRoles: "已保存职位",
    recruiterUpdates: "招聘方更新",
    recruiterUpdatesFoot: "在你的工作收件箱中",
    profileReadinessAria: "资料完备度",
    profileReadinessLabel: "资料完备度",
  },
  readinessCard: {
    cardAria: "资料完备度清单",
  },
  savedRolesList: {
    listLabel: "已保存职位",
    saved: "已保存",
    rowAria: "于",
  },
  activityList: {
    listLabel: "近期安全事件",
  },
  securityHero: {
    heroAria: "安全概览",
    accountActiveSingular: "账户已活跃 {count} 天",
    accountActivePlural: "账户已活跃 {count} 天",
    flaggedSingular: "记录中有 {count} 个标记事件",
    flaggedPlural: "记录中有 {count} 个标记事件",
    flaggedSuffix: "查看下方",
    trustSignalAria: "信任信号",
    trustScore: "信任分数",
    nextTierAria: "下一级 {tier}",
    nextTier: "下一级 ·",
  },
  signalsStrip: {
    listLabel: "安全信号",
  },
  attentionPanel: {
    kicker: "需要关注",
    title: "按最先造成阻碍的顺序排列的待办事项",
    chipSecurity: "安全",
    chipUrgent: "紧急",
    chipBlocking: "阻碍",
    continueLabel: "从上次中断处继续",
  },
  signalFeed: {
    kicker: "信号流",
    emptyHeadline: "暂无内容可显示。",
    emptyBody: "当通知、生命周期更新或部门活动到达时，它们会按优先级排列显示在此处。",
    headline: "HenryCo 全部内容，已排序",
    openInbox: "打开收件箱",
    paginationAria: "信号流分页",
    newer: "更新",
    older: "更早",
    emailed: "已发送邮件",
  },
  smartHomeHeader: {
    fallbackTitle: "你的仪表板",
    fallbackBody: "HenryCo 的实时信号到达后会显示在此处。",
    unreadSignalSingular: "{count} 条未读信号",
    unreadSignalPlural: "{count} 条未读信号",
    needsAttentionSingular: "{count} 项需要关注",
    needsAttentionPlural: "{count} 项需要关注",
    lastActivity: "最近活动 {time}",
    savedRailAriaSingular: "{count} 个已保存项目 — 继续",
    savedRailAriaPlural: "{count} 个已保存项目 — 继续",
    savedRailLabel: "已保存 · 继续",
  },
  tasksHero: {
    heroAria: "任务概览",
    volumeAria: "任务量",
    guidanceAria: "队列的运作方式",
    blockingFootZero: "目前没有阻碍",
    blockingFootSome: "解决后即可解除其他通道的阻碍",
    urgentFootRoutine: "常规",
    totalFootSingular: "个部门参与",
    totalFootPlural: "个部门参与",
    bySource: "按来源",
  },
  tasksList: {
    listLabel: "待处理任务",
    priorityUrgent: "紧急",
    priorityHigh: "高",
    priorityRoutine: "常规",
    priorityQuiet: "平缓",
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<AccountHeroesCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
};
// ig, yo, ha, hi are intentionally OMITTED -> fall back to EN (human-translation only).

export function getAccountHeroesCopy(locale: AppLocale): AccountHeroesCopy {
  const o = LOCALE_MAP[locale];
  if (o)
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      o as unknown as Record<string, unknown>,
    ) as unknown as AccountHeroesCopy;
  return EN;
}
