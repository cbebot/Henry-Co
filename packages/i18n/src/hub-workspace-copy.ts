import type { AppLocale } from "./locales";
import { DEFAULT_LOCALE } from "./locales";
import { deepMergeMessages } from "./merge-messages";

// ─────────────────────────────────────────────────────────────────────────────
// HubWorkspaceCopy — typed copy for the hub staff workspace surfaces
//
// Section keys:
//   workspaceScreen   – WorkspaceScreen.tsx UI labels & empty states
//   workspaceNav      – navigation.ts section labels, nav-item labels, section titles
// ─────────────────────────────────────────────────────────────────────────────

export type HubWorkspaceCopy = {
  /** Copy for WorkspaceScreen.tsx — all user-visible labels, empty states, and badges */
  workspaceScreen: {
    /** Header eyebrow */
    headerEyebrow: string;
    /** Header info cards */
    activeStaffProfileLabel: string;
    helperModeLabel: string;
    helperModeValue: string;
    helperModeDescription: string;
    noWorkspaceFamilies: string;
    /** Status bar badges */
    badgeLiveSignals: string;
    badgeSharedAuth: string;
    badgeRoleModules: string;
    badgeFallbackRoute: string;
    /** Fallback access route notice (use {workspaceUrl} and {preferredUrl} placeholders) */
    fallbackRouteNotice: string;
    /** Empty state – no workspace access */
    accessPendingTitle: string;
    accessPendingDescription: string;
    /** Empty state – no helper signals */
    noHelperSignalsTitle: string;
    noHelperSignalsDescription: string;
    /** Empty state – no active tasks */
    noActiveTasksTitle: string;
    noActiveTasksDescription: string;
    /** Empty state – inbox is clear */
    inboxCalmTitle: string;
    inboxCalmDescription: string;
    /** Empty state – no approvals */
    noApprovalsTitle: string;
    noApprovalsDescription: string;
    /** Empty state – no history */
    noHistoryTitle: string;
    noHistoryDescription: string;
    /** Empty state – no visible task workload (division detail) */
    noTaskWorkloadTitle: string;
    noTaskWorkloadDescription: string;
    /** Empty state – no queue lanes (division detail) */
    noQueueLanesTitle: string;
    noQueueLanesDescription: string;
    /** Empty state – module unavailable */
    moduleUnavailableTitle: string;
    moduleUnavailableDescription: string;
    /** Operations Helper panel (overview section) */
    operationsHelperLabel: string;
    operationsHelperTitle: string;
    operationsHelperDescription: string;
    /** InsightCard */
    helperInsightLabel: string;
    insightOpenLabel: string;
    /** TaskCard */
    suggestedNextAction: string;
    /** QueueLaneCard empty lane */
    queueLaneEmpty: string;
    /** ModuleCard CTAs */
    openModuleLabel: string;
    openDivisionAppLabel: string;
    /** Reports section */
    previousWindowLabel: string;
    deltaLabel: string;
    /** Settings section – identity panel labels */
    staffIdentityLabel: string;
    unnamedStaffAccount: string;
    noEmailAddress: string;
    profileRoleLabel: string;
    primaryDivisionLabel: string;
    currentAccessRouteLabel: string;
    preferredWorkspaceHostLabel: string;
    notAssigned: string;
    noPrimaryDivision: string;
    /** Settings section – permission scope panel */
    permissionScopeLabel: string;
    /** Settings section – division memberships panel */
    divisionMembershipsLabel: string;
    /** Source mode labels (shown on ModuleCard and division Data Mode panel) */
    sourceModeStructured: string;
    sourceModeSharedSignals: string;
    sourceModePlanned: string;
    /** Division detail – data mode panel label */
    dataModeLabel: string;
    /** Inbox badge */
    unreadBadge: string;
    /** Section intro descriptions — one per WorkspaceSectionKey */
    introOverview: string;
    introTasks: string;
    introInbox: string;
    introApprovals: string;
    introQueues: string;
    introArchive: string;
    introReports: string;
    introSettings: string;
    /** Section intro for "division" key uses a dynamic module label; this is the fallback */
    introDivisionFallback: string;
    /** Dynamic division-section intro template (use {shortName} placeholder) */
    introDivisionTemplate: string;
    /** Dynamic "is calm" empty state for division insights (use {label} placeholder) */
    divisionCalmTitle: string;
    divisionCalmDescription: string;
  };
  /** Copy for navigation.ts nav sections, item labels, and section titles */
  workspaceNav: {
    /** Nav section group labels */
    sectionWorkspace: string;
    sectionOperations: string;
    sectionDivisions: string;
    /** Nav item labels */
    navOverview: string;
    navMyTasks: string;
    navInbox: string;
    navApprovals: string;
    navQueues: string;
    navHistory: string;
    navReports: string;
    navSettings: string;
    /** Section titles (used in page header h1) */
    titleOverview: string;
    titleMyTasks: string;
    titleInbox: string;
    titleApprovals: string;
    titleQueues: string;
    titleHistory: string;
    titleReports: string;
    titleSettings: string;
    /** Division section title template (use {shortName} placeholder) */
    titleDivisionTemplate: string;
    /** Fallback title */
    titleFallback: string;
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// EN baseline
// ─────────────────────────────────────────────────────────────────────────────

const HUB_WORKSPACE_COPY_EN: HubWorkspaceCopy = {
  workspaceScreen: {
    headerEyebrow: "HenryCo Staff Workspace",
    activeStaffProfileLabel: "Active staff profile",
    helperModeLabel: "Helper mode",
    helperModeValue: "Real workload signals",
    helperModeDescription: "Stale tasks, approvals, unread alerts, and division pressure only.",
    noWorkspaceFamilies: "No workspace families",
    badgeLiveSignals: "Generated from live Supabase signals",
    badgeSharedAuth: "Shared identity via Supabase Auth",
    badgeRoleModules: "Role-aware modules",
    badgeFallbackRoute: "Fallback access route active",
    fallbackRouteNotice:
      "Shared login now returns to the reachable live deployment at {workspaceUrl} until the preferred workspace host at {preferredUrl} is attached on Vercel.",
    accessPendingTitle: "Workspace access is pending",
    accessPendingDescription:
      "This internal workspace only opens for recognized HenryCo staff memberships or division role assignments. Shared authentication is working, but there is no staff scope attached to this account yet.",
    noHelperSignalsTitle: "No helper signals yet",
    noHelperSignalsDescription:
      "Once live work lands in the permitted division scopes, the workspace helper will summarize stale tasks, SLA risks, and workload pressure here.",
    noActiveTasksTitle: "No active tasks",
    noActiveTasksDescription: "No prioritized tasks are visible in the current role scope.",
    inboxCalmTitle: "Inbox is calm",
    inboxCalmDescription:
      "There are no unread alerts or open conversation threads inside the current workspace scope.",
    noApprovalsTitle: "No approvals waiting",
    noApprovalsDescription: "There are no active approval items in the current role scope.",
    noHistoryTitle: "No visible history",
    noHistoryDescription:
      "Shared audit events have not been surfaced for the current role scope yet.",
    noTaskWorkloadTitle: "No visible task workload",
    noTaskWorkloadDescription:
      "This division is either calm or the current role scope is intentionally not exposing active task cards here.",
    noQueueLanesTitle: "No queue lanes in scope",
    noQueueLanesDescription:
      "Queue boards are hidden when the current role family does not carry queue visibility for this division.",
    moduleUnavailableTitle: "Module unavailable",
    moduleUnavailableDescription: "This division is not visible in the current role scope.",
    operationsHelperLabel: "Operations Helper",
    operationsHelperTitle: "Evidence-based next actions",
    operationsHelperDescription:
      "The helper layer is ranking real backlog, stale work, unread alerts, and approval pressure pulled from the live HenryCo signal stream.",
    helperInsightLabel: "Helper Insight",
    insightOpenLabel: "Open",
    suggestedNextAction: "Suggested next action:",
    queueLaneEmpty: "Nothing is currently parked in this lane.",
    openModuleLabel: "Open module",
    openDivisionAppLabel: "Open division app",
    previousWindowLabel: "Previous window:",
    deltaLabel: "Delta",
    staffIdentityLabel: "Staff Identity",
    unnamedStaffAccount: "Unnamed staff account",
    noEmailAddress: "No email address",
    profileRoleLabel: "Profile role:",
    primaryDivisionLabel: "Primary division:",
    currentAccessRouteLabel: "Current access route:",
    preferredWorkspaceHostLabel: "Preferred workspace host:",
    notAssigned: "Not assigned",
    noPrimaryDivision: "None",
    permissionScopeLabel: "Permission Scope",
    divisionMembershipsLabel: "Division Memberships",
    sourceModeStructured: "Dedicated data",
    sourceModeSharedSignals: "Shared signals",
    sourceModePlanned: "Planned",
    dataModeLabel: "Data Mode",
    unreadBadge: "unread",
    introOverview:
      "Cross-division operating view tuned to the staff member's live role scope.",
    introTasks:
      "Priority-weighted worklist generated from bookings, approvals, alerts, and support activity.",
    introInbox:
      "Notification center combining unread alerts and active customer or operational conversations.",
    introApprovals:
      "Review queues for submissions, moderation, finance, and cross-division sign-off.",
    introQueues:
      "Lane-based operational boards for active workload across each visible division.",
    introArchive: "Shared audit and operational history for staff-visible divisions.",
    introReports:
      "Signals, throughput, readiness, and workload deltas across the workspace.",
    introSettings:
      "Staff identity, role family, permission scope, and module access details.",
    introDivisionFallback: "Division detail surface.",
    introDivisionTemplate:
      "{shortName} operations, queues, insights, and live workload.",
    divisionCalmTitle: "{label} is calm",
    divisionCalmDescription:
      "No active insight cards are being generated for this module right now.",
  },
  workspaceNav: {
    sectionWorkspace: "Workspace",
    sectionOperations: "Operations",
    sectionDivisions: "Divisions",
    navOverview: "Overview",
    navMyTasks: "My Tasks",
    navInbox: "Inbox",
    navApprovals: "Approvals",
    navQueues: "Queues",
    navHistory: "History",
    navReports: "Reports",
    navSettings: "Settings",
    titleOverview: "Overview",
    titleMyTasks: "My Tasks",
    titleInbox: "Inbox",
    titleApprovals: "Approvals",
    titleQueues: "Queues",
    titleHistory: "History",
    titleReports: "Reports",
    titleSettings: "Settings",
    titleDivisionTemplate: "{shortName} Module",
    titleFallback: "Workspace",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Locale partials — DeepPartial overrides merged onto EN baseline
// ─────────────────────────────────────────────────────────────────────────────

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

const HUB_WORKSPACE_COPY_FR: DeepPartial<HubWorkspaceCopy> = {
  workspaceScreen: {
    headerEyebrow: "Espace de travail HenryCo",
    activeStaffProfileLabel: "Profil du membre actif",
    helperModeLabel: "Mode assistant",
    helperModeValue: "Signaux de charge réelle",
    helperModeDescription:
      "Tâches obsolètes, approbations, alertes non lues et pression divisionnaire uniquement.",
    noWorkspaceFamilies: "Aucune famille d'espace de travail",
    badgeLiveSignals: "Généré depuis les signaux Supabase en direct",
    badgeSharedAuth: "Identité partagée via Supabase Auth",
    badgeRoleModules: "Modules basés sur les rôles",
    badgeFallbackRoute: "Route d'accès de secours active",
    fallbackRouteNotice:
      "La connexion partagée renvoie maintenant vers le déploiement actif {workspaceUrl} jusqu'à ce que l'hôte préféré {preferredUrl} soit rattaché sur Vercel.",
    accessPendingTitle: "Accès à l'espace en attente",
    accessPendingDescription:
      "Cet espace interne s'ouvre uniquement pour les membres du personnel HenryCo reconnus ou les attributions de rôles divisionnaires. L'authentification partagée fonctionne, mais aucune portée staff n'est encore associée à ce compte.",
    noHelperSignalsTitle: "Aucun signal d'assistant pour l'instant",
    noHelperSignalsDescription:
      "Une fois que du travail actif atterrit dans les portées divisionnaires autorisées, l'assistant résumera les tâches obsolètes, les risques SLA et la pression de charge ici.",
    noActiveTasksTitle: "Aucune tâche active",
    noActiveTasksDescription: "Aucune tâche prioritaire n'est visible dans la portée de rôle actuelle.",
    inboxCalmTitle: "La boîte de réception est calme",
    inboxCalmDescription:
      "Il n'y a aucune alerte non lue ni fil de conversation ouvert dans la portée de l'espace de travail actuel.",
    noApprovalsTitle: "Aucune approbation en attente",
    noApprovalsDescription: "Il n'y a aucun élément d'approbation actif dans la portée de rôle actuelle.",
    noHistoryTitle: "Aucun historique visible",
    noHistoryDescription:
      "Les événements d'audit partagés n'ont pas encore été exposés pour la portée de rôle actuelle.",
    noTaskWorkloadTitle: "Aucune charge de travail visible",
    noTaskWorkloadDescription:
      "Cette division est soit calme, soit la portée de rôle actuelle n'expose intentionnellement pas de cartes de tâches actives ici.",
    noQueueLanesTitle: "Aucune file en portée",
    noQueueLanesDescription:
      "Les tableaux de files sont masqués quand la famille de rôle actuelle ne porte pas la visibilité de file pour cette division.",
    moduleUnavailableTitle: "Module indisponible",
    moduleUnavailableDescription: "Cette division n'est pas visible dans la portée de rôle actuelle.",
    operationsHelperLabel: "Assistant opérationnel",
    operationsHelperTitle: "Actions suivantes basées sur les preuves",
    operationsHelperDescription:
      "L'assistant classe le backlog réel, le travail obsolète, les alertes non lues et la pression des approbations extraites du flux de signaux HenryCo en direct.",
    helperInsightLabel: "Insight Assistant",
    insightOpenLabel: "Ouvrir",
    suggestedNextAction: "Action suivante suggérée :",
    queueLaneEmpty: "Rien n'est actuellement dans cette file.",
    openModuleLabel: "Ouvrir le module",
    openDivisionAppLabel: "Ouvrir l'app divisionnaire",
    previousWindowLabel: "Fenêtre précédente :",
    deltaLabel: "Delta",
    staffIdentityLabel: "Identité du membre",
    unnamedStaffAccount: "Compte sans nom",
    noEmailAddress: "Pas d'adresse e-mail",
    profileRoleLabel: "Rôle du profil :",
    primaryDivisionLabel: "Division principale :",
    currentAccessRouteLabel: "Route d'accès actuelle :",
    preferredWorkspaceHostLabel: "Hôte d'espace préféré :",
    notAssigned: "Non assigné",
    noPrimaryDivision: "Aucune",
    permissionScopeLabel: "Portée des permissions",
    divisionMembershipsLabel: "Adhésions divisionnaires",
    sourceModeStructured: "Données dédiées",
    sourceModeSharedSignals: "Signaux partagés",
    sourceModePlanned: "Planifié",
    dataModeLabel: "Mode données",
    unreadBadge: "non lu",
    introOverview: "Vue opérationnelle inter-divisions adaptée à la portée de rôle active du membre.",
    introTasks:
      "Liste de travail pondérée par priorité générée à partir des réservations, approbations, alertes et activité de support.",
    introInbox:
      "Centre de notifications combinant les alertes non lues et les conversations clients ou opérationnelles actives.",
    introApprovals:
      "Files de révision pour les soumissions, la modération, la finance et les validations inter-divisions.",
    introQueues:
      "Tableaux opérationnels par couloirs pour la charge active dans chaque division visible.",
    introArchive: "Historique d'audit partagé et opérationnel pour les divisions visibles par le staff.",
    introReports:
      "Signaux, débit, disponibilité et deltas de charge à travers l'espace de travail.",
    introSettings: "Identité du staff, famille de rôle, portée des permissions et détails d'accès aux modules.",
    introDivisionFallback: "Surface de détail divisionnaire.",
    introDivisionTemplate: "Opérations, files, insights et charge active de {shortName}.",
    divisionCalmTitle: "{label} est calme",
    divisionCalmDescription:
      "Aucune carte d'insight active n'est générée pour ce module pour le moment.",
  },
  workspaceNav: {
    sectionWorkspace: "Espace de travail",
    sectionOperations: "Opérations",
    sectionDivisions: "Divisions",
    navOverview: "Vue d'ensemble",
    navMyTasks: "Mes tâches",
    navInbox: "Boîte de réception",
    navApprovals: "Approbations",
    navQueues: "Files",
    navHistory: "Historique",
    navReports: "Rapports",
    navSettings: "Paramètres",
    titleOverview: "Vue d'ensemble",
    titleMyTasks: "Mes tâches",
    titleInbox: "Boîte de réception",
    titleApprovals: "Approbations",
    titleQueues: "Files",
    titleHistory: "Historique",
    titleReports: "Rapports",
    titleSettings: "Paramètres",
    titleDivisionTemplate: "Module {shortName}",
    titleFallback: "Espace de travail",
  },
};

const HUB_WORKSPACE_COPY_ES: DeepPartial<HubWorkspaceCopy> = {
  workspaceScreen: {
    headerEyebrow: "Espacio de trabajo HenryCo",
    activeStaffProfileLabel: "Perfil de personal activo",
    helperModeLabel: "Modo asistente",
    helperModeValue: "Señales de carga real",
    helperModeDescription:
      "Solo tareas obsoletas, aprobaciones, alertas no leídas y presión divisional.",
    noWorkspaceFamilies: "Sin familias de espacio de trabajo",
    badgeLiveSignals: "Generado desde señales Supabase en vivo",
    badgeSharedAuth: "Identidad compartida vía Supabase Auth",
    badgeRoleModules: "Módulos por rol",
    badgeFallbackRoute: "Ruta de acceso alternativa activa",
    accessPendingTitle: "Acceso al espacio pendiente",
    accessPendingDescription:
      "Este espacio interno solo se abre para miembros del personal de HenryCo reconocidos o asignaciones de roles divisionales.",
    noHelperSignalsTitle: "Aún no hay señales del asistente",
    noHelperSignalsDescription:
      "Una vez que llegue trabajo activo a los ámbitos divisionales permitidos, el asistente resumirá las tareas obsoletas, los riesgos de SLA y la presión de carga aquí.",
    noActiveTasksTitle: "Sin tareas activas",
    noActiveTasksDescription: "No hay tareas priorizadas visibles en el ámbito de rol actual.",
    inboxCalmTitle: "La bandeja está tranquila",
    inboxCalmDescription:
      "No hay alertas no leídas ni hilos de conversación abiertos en el ámbito del espacio de trabajo actual.",
    noApprovalsTitle: "Sin aprobaciones pendientes",
    noApprovalsDescription: "No hay elementos de aprobación activos en el ámbito de rol actual.",
    noHistoryTitle: "Sin historial visible",
    noHistoryDescription:
      "Los eventos de auditoría compartidos aún no se han expuesto para el ámbito de rol actual.",
    noTaskWorkloadTitle: "Sin carga de tareas visible",
    noTaskWorkloadDescription:
      "Esta división está tranquila o el ámbito de rol actual no expone intencionalmente tarjetas de tareas activas aquí.",
    noQueueLanesTitle: "Sin colas en ámbito",
    noQueueLanesDescription:
      "Los tableros de colas se ocultan cuando la familia de roles actual no lleva visibilidad de colas para esta división.",
    moduleUnavailableTitle: "Módulo no disponible",
    moduleUnavailableDescription: "Esta división no es visible en el ámbito de rol actual.",
    operationsHelperLabel: "Asistente operacional",
    operationsHelperTitle: "Próximas acciones basadas en evidencia",
    helperInsightLabel: "Insight del Asistente",
    insightOpenLabel: "Abrir",
    suggestedNextAction: "Acción siguiente sugerida:",
    queueLaneEmpty: "Actualmente no hay nada en esta cola.",
    openModuleLabel: "Abrir módulo",
    openDivisionAppLabel: "Abrir app divisional",
    previousWindowLabel: "Ventana anterior:",
    deltaLabel: "Delta",
    staffIdentityLabel: "Identidad del personal",
    unnamedStaffAccount: "Cuenta de personal sin nombre",
    noEmailAddress: "Sin dirección de email",
    profileRoleLabel: "Rol del perfil:",
    primaryDivisionLabel: "División principal:",
    currentAccessRouteLabel: "Ruta de acceso actual:",
    preferredWorkspaceHostLabel: "Host de espacio preferido:",
    notAssigned: "No asignado",
    noPrimaryDivision: "Ninguna",
    permissionScopeLabel: "Ámbito de permisos",
    divisionMembershipsLabel: "Membresías divisionales",
    sourceModeStructured: "Datos dedicados",
    sourceModeSharedSignals: "Señales compartidas",
    sourceModePlanned: "Planificado",
    dataModeLabel: "Modo de datos",
    unreadBadge: "no leído",
    introOverview: "Vista operacional entre divisiones ajustada al ámbito de rol activo del miembro.",
    introDivisionFallback: "Superficie de detalle divisional.",
    introDivisionTemplate: "Operaciones, colas, insights y carga activa de {shortName}.",
    divisionCalmTitle: "{label} está tranquilo",
    divisionCalmDescription: "No se están generando tarjetas de insight activas para este módulo ahora mismo.",
  },
  workspaceNav: {
    sectionWorkspace: "Espacio de trabajo",
    sectionOperations: "Operaciones",
    sectionDivisions: "Divisiones",
    navOverview: "Resumen",
    navMyTasks: "Mis tareas",
    navInbox: "Bandeja",
    navApprovals: "Aprobaciones",
    navQueues: "Colas",
    navHistory: "Historial",
    navReports: "Informes",
    navSettings: "Configuración",
    titleOverview: "Resumen",
    titleMyTasks: "Mis tareas",
    titleInbox: "Bandeja",
    titleApprovals: "Aprobaciones",
    titleQueues: "Colas",
    titleHistory: "Historial",
    titleReports: "Informes",
    titleSettings: "Configuración",
    titleDivisionTemplate: "Módulo {shortName}",
    titleFallback: "Espacio de trabajo",
  },
};

const HUB_WORKSPACE_COPY_PT: DeepPartial<HubWorkspaceCopy> = {
  workspaceScreen: {
    headerEyebrow: "Espaço de trabalho HenryCo",
    activeStaffProfileLabel: "Perfil de funcionário ativo",
    helperModeLabel: "Modo assistente",
    helperModeValue: "Sinais de carga real",
    helperModeDescription:
      "Apenas tarefas obsoletas, aprovações, alertas não lidos e pressão divisional.",
    noWorkspaceFamilies: "Sem famílias de espaço de trabalho",
    badgeLiveSignals: "Gerado a partir de sinais Supabase ao vivo",
    badgeSharedAuth: "Identidade compartilhada via Supabase Auth",
    badgeRoleModules: "Módulos por função",
    badgeFallbackRoute: "Rota de acesso alternativa ativa",
    accessPendingTitle: "Acesso ao espaço pendente",
    accessPendingDescription:
      "Este espaço interno só abre para membros reconhecidos da equipe HenryCo ou atribuições de funções divisionais.",
    noHelperSignalsTitle: "Nenhum sinal do assistente ainda",
    noHelperSignalsDescription:
      "Quando trabalho ativo chegar aos escopos divisionais permitidos, o assistente resumirá tarefas obsoletas, riscos de SLA e pressão de carga aqui.",
    noActiveTasksTitle: "Sem tarefas ativas",
    noActiveTasksDescription: "Nenhuma tarefa priorizada está visível no escopo de função atual.",
    inboxCalmTitle: "A caixa de entrada está calma",
    inboxCalmDescription:
      "Não há alertas não lidos nem encadeamentos de conversa abertos no escopo do espaço de trabalho atual.",
    noApprovalsTitle: "Sem aprovações pendentes",
    noApprovalsDescription: "Não há itens de aprovação ativos no escopo de função atual.",
    noHistoryTitle: "Sem histórico visível",
    noHistoryDescription:
      "Os eventos de auditoria compartilhados ainda não foram expostos para o escopo de função atual.",
    noTaskWorkloadTitle: "Sem carga de tarefas visível",
    noTaskWorkloadDescription:
      "Esta divisão está calma ou o escopo de função atual não está expondo intencionalmente cartões de tarefas ativos aqui.",
    noQueueLanesTitle: "Sem filas em escopo",
    noQueueLanesDescription:
      "Os quadros de filas ficam ocultos quando a família de funções atual não carrega visibilidade de fila para esta divisão.",
    moduleUnavailableTitle: "Módulo indisponível",
    moduleUnavailableDescription: "Esta divisão não está visível no escopo de função atual.",
    operationsHelperLabel: "Assistente operacional",
    operationsHelperTitle: "Próximas ações baseadas em evidências",
    helperInsightLabel: "Insight do Assistente",
    insightOpenLabel: "Abrir",
    suggestedNextAction: "Próxima ação sugerida:",
    queueLaneEmpty: "Nada está atualmente estacionado nesta fila.",
    openModuleLabel: "Abrir módulo",
    openDivisionAppLabel: "Abrir app divisional",
    previousWindowLabel: "Janela anterior:",
    deltaLabel: "Delta",
    staffIdentityLabel: "Identidade do funcionário",
    unnamedStaffAccount: "Conta de funcionário sem nome",
    noEmailAddress: "Sem endereço de e-mail",
    profileRoleLabel: "Função do perfil:",
    primaryDivisionLabel: "Divisão principal:",
    currentAccessRouteLabel: "Rota de acesso atual:",
    preferredWorkspaceHostLabel: "Host de espaço preferido:",
    notAssigned: "Não atribuído",
    noPrimaryDivision: "Nenhuma",
    permissionScopeLabel: "Escopo de permissões",
    divisionMembershipsLabel: "Associações divisionais",
    sourceModeStructured: "Dados dedicados",
    sourceModeSharedSignals: "Sinais compartilhados",
    sourceModePlanned: "Planejado",
    dataModeLabel: "Modo de dados",
    unreadBadge: "não lido",
    introOverview: "Visão operacional entre divisões ajustada ao escopo de função ativo do membro.",
    introDivisionFallback: "Superfície de detalhe divisional.",
    introDivisionTemplate: "Operações, filas, insights e carga ativa de {shortName}.",
    divisionCalmTitle: "{label} está calmo",
    divisionCalmDescription: "Nenhum cartão de insight ativo está sendo gerado para este módulo agora.",
  },
  workspaceNav: {
    sectionWorkspace: "Espaço de trabalho",
    sectionOperations: "Operações",
    sectionDivisions: "Divisões",
    navOverview: "Visão geral",
    navMyTasks: "Minhas tarefas",
    navInbox: "Caixa de entrada",
    navApprovals: "Aprovações",
    navQueues: "Filas",
    navHistory: "Histórico",
    navReports: "Relatórios",
    navSettings: "Configurações",
    titleOverview: "Visão geral",
    titleMyTasks: "Minhas tarefas",
    titleInbox: "Caixa de entrada",
    titleApprovals: "Aprovações",
    titleQueues: "Filas",
    titleHistory: "Histórico",
    titleReports: "Relatórios",
    titleSettings: "Configurações",
    titleDivisionTemplate: "Módulo {shortName}",
    titleFallback: "Espaço de trabalho",
  },
};

const HUB_WORKSPACE_COPY_AR: DeepPartial<HubWorkspaceCopy> = {
  workspaceScreen: {
    headerEyebrow: "مساحة عمل HenryCo",
    activeStaffProfileLabel: "ملف الموظف النشط",
    helperModeLabel: "وضع المساعد",
    helperModeValue: "إشارات عبء العمل الحقيقي",
    helperModeDescription:
      "المهام المتأخرة والموافقات والتنبيهات غير المقروءة وضغط الأقسام فقط.",
    noWorkspaceFamilies: "لا توجد عائلات مساحة عمل",
    badgeLiveSignals: "مولّد من إشارات Supabase الحية",
    badgeSharedAuth: "هوية مشتركة عبر Supabase Auth",
    badgeRoleModules: "وحدات مبنية على الأدوار",
    badgeFallbackRoute: "مسار الوصول الاحتياطي نشط",
    accessPendingTitle: "وصول المساحة قيد الانتظار",
    accessPendingDescription:
      "تفتح هذه المساحة الداخلية فقط لأعضاء فريق HenryCo المعترف بهم أو تعيينات أدوار الأقسام.",
    noHelperSignalsTitle: "لا توجد إشارات مساعد بعد",
    noHelperSignalsDescription:
      "بمجرد وصول العمل النشط إلى نطاقات الأقسام المسموح بها، سيلخص المساعد المهام المتأخرة ومخاطر SLA وضغط عبء العمل هنا.",
    noActiveTasksTitle: "لا توجد مهام نشطة",
    noActiveTasksDescription: "لا توجد مهام ذات أولوية مرئية في نطاق الدور الحالي.",
    inboxCalmTitle: "صندوق الوارد هادئ",
    inboxCalmDescription:
      "لا توجد تنبيهات غير مقروءة أو خيوط محادثة مفتوحة داخل نطاق مساحة العمل الحالية.",
    noApprovalsTitle: "لا توجد موافقات معلقة",
    noApprovalsDescription: "لا توجد عناصر موافقة نشطة في نطاق الدور الحالي.",
    noHistoryTitle: "لا يوجد سجل مرئي",
    noHistoryDescription: "لم يتم عرض أحداث التدقيق المشتركة لنطاق الدور الحالي بعد.",
    noTaskWorkloadTitle: "لا يوجد عبء مهام مرئي",
    noTaskWorkloadDescription:
      "هذا القسم إما هادئ أو أن نطاق الدور الحالي لا يعرض بطاقات المهام النشطة هنا عن قصد.",
    noQueueLanesTitle: "لا توجد مسارات قائمة في النطاق",
    noQueueLanesDescription:
      "تُخفى لوحات القوائم عندما لا تحمل عائلة الدور الحالية رؤية القائمة لهذا القسم.",
    moduleUnavailableTitle: "الوحدة غير متاحة",
    moduleUnavailableDescription: "هذا القسم غير مرئي في نطاق الدور الحالي.",
    operationsHelperLabel: "المساعد التشغيلي",
    operationsHelperTitle: "الإجراءات التالية المبنية على الأدلة",
    helperInsightLabel: "رؤية المساعد",
    insightOpenLabel: "فتح",
    suggestedNextAction: "الإجراء التالي المقترح:",
    queueLaneEmpty: "لا يوجد شيء في هذا المسار حالياً.",
    openModuleLabel: "فتح الوحدة",
    openDivisionAppLabel: "فتح تطبيق القسم",
    previousWindowLabel: "النافذة السابقة:",
    deltaLabel: "الفارق",
    staffIdentityLabel: "هوية الموظف",
    unnamedStaffAccount: "حساب موظف بدون اسم",
    noEmailAddress: "لا يوجد عنوان بريد إلكتروني",
    profileRoleLabel: "دور الملف الشخصي:",
    primaryDivisionLabel: "القسم الأساسي:",
    currentAccessRouteLabel: "مسار الوصول الحالي:",
    preferredWorkspaceHostLabel: "مضيف المساحة المفضل:",
    notAssigned: "غير مُعيَّن",
    noPrimaryDivision: "لا يوجد",
    permissionScopeLabel: "نطاق الصلاحيات",
    divisionMembershipsLabel: "عضويات الأقسام",
    sourceModeStructured: "بيانات مخصصة",
    sourceModeSharedSignals: "إشارات مشتركة",
    sourceModePlanned: "مخطط",
    dataModeLabel: "وضع البيانات",
    unreadBadge: "غير مقروء",
    introOverview: "عرض تشغيلي متعدد الأقسام مضبوط على نطاق دور العضو النشط.",
    introDivisionFallback: "سطح تفاصيل القسم.",
    introDivisionTemplate: "عمليات {shortName} وقوائمه ورؤاه وعبء عمله الحي.",
    divisionCalmTitle: "{label} هادئ",
    divisionCalmDescription: "لا يتم توليد بطاقات رؤية نشطة لهذه الوحدة الآن.",
  },
  workspaceNav: {
    sectionWorkspace: "مساحة العمل",
    sectionOperations: "العمليات",
    sectionDivisions: "الأقسام",
    navOverview: "نظرة عامة",
    navMyTasks: "مهامي",
    navInbox: "صندوق الوارد",
    navApprovals: "الموافقات",
    navQueues: "القوائم",
    navHistory: "السجل",
    navReports: "التقارير",
    navSettings: "الإعدادات",
    titleOverview: "نظرة عامة",
    titleMyTasks: "مهامي",
    titleInbox: "صندوق الوارد",
    titleApprovals: "الموافقات",
    titleQueues: "القوائم",
    titleHistory: "السجل",
    titleReports: "التقارير",
    titleSettings: "الإعدادات",
    titleDivisionTemplate: "وحدة {shortName}",
    titleFallback: "مساحة العمل",
  },
};

const HUB_WORKSPACE_COPY_DE: DeepPartial<HubWorkspaceCopy> = {
  workspaceScreen: {
    headerEyebrow: "HenryCo Mitarbeiterbereich",
    activeStaffProfileLabel: "Aktives Mitarbeiterprofil",
    helperModeLabel: "Assistentenmodus",
    helperModeValue: "Echte Arbeitslastsignale",
    helperModeDescription:
      "Nur veraltete Aufgaben, Genehmigungen, ungelesene Benachrichtigungen und Bereichsdruck.",
    noWorkspaceFamilies: "Keine Arbeitsbereichsfamilien",
    badgeLiveSignals: "Aus Live-Supabase-Signalen generiert",
    badgeSharedAuth: "Geteilte Identität via Supabase Auth",
    badgeRoleModules: "Rollenbasierte Module",
    badgeFallbackRoute: "Fallback-Zugriffsroute aktiv",
    accessPendingTitle: "Bereichszugang ausstehend",
    accessPendingDescription:
      "Dieser interne Bereich öffnet sich nur für erkannte HenryCo-Mitarbeiter oder Bereichsrollenzuweisungen.",
    noHelperSignalsTitle: "Noch keine Assistentensignale",
    noHelperSignalsDescription:
      "Sobald aktive Arbeit in den erlaubten Bereichsumfängen eintrifft, fasst der Assistent veraltete Aufgaben, SLA-Risiken und Arbeitslastdruck hier zusammen.",
    noActiveTasksTitle: "Keine aktiven Aufgaben",
    noActiveTasksDescription: "Im aktuellen Rollenumfang sind keine priorisierten Aufgaben sichtbar.",
    inboxCalmTitle: "Der Posteingang ist ruhig",
    inboxCalmDescription:
      "Es gibt keine ungelesenen Benachrichtigungen oder offenen Gesprächsthreads im aktuellen Arbeitsbereichsumfang.",
    noApprovalsTitle: "Keine ausstehenden Genehmigungen",
    noApprovalsDescription: "Es gibt keine aktiven Genehmigungselemente im aktuellen Rollenumfang.",
    noHistoryTitle: "Kein sichtbarer Verlauf",
    noHistoryDescription:
      "Geteilte Auditereignisse wurden für den aktuellen Rollenumfang noch nicht angezeigt.",
    noTaskWorkloadTitle: "Keine sichtbare Aufgabenlast",
    noTaskWorkloadDescription:
      "Dieser Bereich ist entweder ruhig oder der aktuelle Rollenumfang zeigt absichtlich keine aktiven Aufgabenkarten hier an.",
    noQueueLanesTitle: "Keine Warteschlangen im Umfang",
    noQueueLanesDescription:
      "Warteschlangenboards werden ausgeblendet, wenn die aktuelle Rollenfamilie keine Warteschlangensichtbarkeit für diesen Bereich trägt.",
    moduleUnavailableTitle: "Modul nicht verfügbar",
    moduleUnavailableDescription: "Dieser Bereich ist im aktuellen Rollenumfang nicht sichtbar.",
    operationsHelperLabel: "Betriebsassistent",
    operationsHelperTitle: "Evidenzbasierte nächste Schritte",
    helperInsightLabel: "Assistenten-Einblick",
    insightOpenLabel: "Öffnen",
    suggestedNextAction: "Vorgeschlagene nächste Aktion:",
    queueLaneEmpty: "Diese Warteschlange ist derzeit leer.",
    openModuleLabel: "Modul öffnen",
    openDivisionAppLabel: "Bereichs-App öffnen",
    previousWindowLabel: "Vorheriges Fenster:",
    deltaLabel: "Delta",
    staffIdentityLabel: "Mitarbeiteridentität",
    unnamedStaffAccount: "Unbenanntes Mitarbeiterkonto",
    noEmailAddress: "Keine E-Mail-Adresse",
    profileRoleLabel: "Profilrolle:",
    primaryDivisionLabel: "Hauptbereich:",
    currentAccessRouteLabel: "Aktuelle Zugriffsroute:",
    preferredWorkspaceHostLabel: "Bevorzugter Bereichshost:",
    notAssigned: "Nicht zugewiesen",
    noPrimaryDivision: "Keiner",
    permissionScopeLabel: "Berechtigungsumfang",
    divisionMembershipsLabel: "Bereichsmitgliedschaften",
    sourceModeStructured: "Dedizierte Daten",
    sourceModeSharedSignals: "Geteilte Signale",
    sourceModePlanned: "Geplant",
    dataModeLabel: "Datenmodus",
    unreadBadge: "ungelesen",
    introOverview: "Bereichsübergreifende Betriebsansicht angepasst an den aktiven Rollenumfang des Mitarbeiters.",
    introDivisionFallback: "Bereichsdetailoberfläche.",
    introDivisionTemplate: "{shortName}-Betrieb, Warteschlangen, Einblicke und Live-Arbeitslast.",
    divisionCalmTitle: "{label} ist ruhig",
    divisionCalmDescription: "Für dieses Modul werden gerade keine aktiven Einblickskarten generiert.",
  },
  workspaceNav: {
    sectionWorkspace: "Arbeitsbereich",
    sectionOperations: "Betrieb",
    sectionDivisions: "Bereiche",
    navOverview: "Übersicht",
    navMyTasks: "Meine Aufgaben",
    navInbox: "Posteingang",
    navApprovals: "Genehmigungen",
    navQueues: "Warteschlangen",
    navHistory: "Verlauf",
    navReports: "Berichte",
    navSettings: "Einstellungen",
    titleOverview: "Übersicht",
    titleMyTasks: "Meine Aufgaben",
    titleInbox: "Posteingang",
    titleApprovals: "Genehmigungen",
    titleQueues: "Warteschlangen",
    titleHistory: "Verlauf",
    titleReports: "Berichte",
    titleSettings: "Einstellungen",
    titleDivisionTemplate: "{shortName}-Modul",
    titleFallback: "Arbeitsbereich",
  },
};

const HUB_WORKSPACE_COPY_IT: DeepPartial<HubWorkspaceCopy> = {
  workspaceScreen: {
    headerEyebrow: "Area di lavoro HenryCo",
    activeStaffProfileLabel: "Profilo collaboratore attivo",
    helperModeLabel: "Modalità assistente",
    helperModeValue: "Segnali di carico reale",
    helperModeDescription:
      "Solo attività obsolete, approvazioni, avvisi non letti e pressione divisionale.",
    noWorkspaceFamilies: "Nessuna famiglia di area di lavoro",
    badgeLiveSignals: "Generato dai segnali Supabase live",
    badgeSharedAuth: "Identità condivisa tramite Supabase Auth",
    badgeRoleModules: "Moduli basati sul ruolo",
    badgeFallbackRoute: "Percorso di accesso alternativo attivo",
    accessPendingTitle: "Accesso all'area in attesa",
    accessPendingDescription:
      "Quest'area interna si apre solo per i collaboratori HenryCo riconosciuti o le assegnazioni di ruolo divisionali.",
    noHelperSignalsTitle: "Ancora nessun segnale dall'assistente",
    noHelperSignalsDescription:
      "Quando arriverà lavoro attivo negli ambiti divisionali consentiti, l'assistente riassumerà le attività obsolete, i rischi SLA e la pressione del carico di lavoro qui.",
    noActiveTasksTitle: "Nessuna attività attiva",
    noActiveTasksDescription: "Non ci sono attività prioritarie visibili nell'ambito di ruolo attuale.",
    inboxCalmTitle: "La casella è tranquilla",
    inboxCalmDescription:
      "Non ci sono avvisi non letti o thread di conversazione aperti nell'ambito dell'area di lavoro attuale.",
    noApprovalsTitle: "Nessuna approvazione in attesa",
    noApprovalsDescription: "Non ci sono elementi di approvazione attivi nell'ambito di ruolo attuale.",
    noHistoryTitle: "Nessuna cronologia visibile",
    noHistoryDescription:
      "Gli eventi di audit condivisi non sono ancora stati esposti per l'ambito di ruolo attuale.",
    noTaskWorkloadTitle: "Nessun carico di attività visibile",
    noTaskWorkloadDescription:
      "Questa divisione è tranquilla o l'ambito di ruolo attuale non espone intenzionalmente schede di attività attive qui.",
    noQueueLanesTitle: "Nessuna coda nell'ambito",
    noQueueLanesDescription:
      "I pannelli delle code sono nascosti quando la famiglia di ruoli attuale non porta visibilità delle code per questa divisione.",
    moduleUnavailableTitle: "Modulo non disponibile",
    moduleUnavailableDescription: "Questa divisione non è visibile nell'ambito di ruolo attuale.",
    operationsHelperLabel: "Assistente operativo",
    operationsHelperTitle: "Prossime azioni basate su evidenze",
    helperInsightLabel: "Insight dell'Assistente",
    insightOpenLabel: "Apri",
    suggestedNextAction: "Azione successiva suggerita:",
    queueLaneEmpty: "Questa coda è attualmente vuota.",
    openModuleLabel: "Apri modulo",
    openDivisionAppLabel: "Apri app divisionale",
    previousWindowLabel: "Finestra precedente:",
    deltaLabel: "Delta",
    staffIdentityLabel: "Identità del collaboratore",
    unnamedStaffAccount: "Account collaboratore senza nome",
    noEmailAddress: "Nessun indirizzo email",
    profileRoleLabel: "Ruolo del profilo:",
    primaryDivisionLabel: "Divisione principale:",
    currentAccessRouteLabel: "Percorso di accesso attuale:",
    preferredWorkspaceHostLabel: "Host preferito dell'area:",
    notAssigned: "Non assegnato",
    noPrimaryDivision: "Nessuna",
    permissionScopeLabel: "Ambito autorizzazioni",
    divisionMembershipsLabel: "Iscrizioni divisionali",
    sourceModeStructured: "Dati dedicati",
    sourceModeSharedSignals: "Segnali condivisi",
    sourceModePlanned: "Pianificato",
    dataModeLabel: "Modalità dati",
    unreadBadge: "non letto",
    introOverview: "Vista operativa tra divisioni sintonizzata sull'ambito di ruolo attivo del membro.",
    introDivisionFallback: "Superficie di dettaglio divisionale.",
    introDivisionTemplate: "Operazioni, code, insight e carico attivo di {shortName}.",
    divisionCalmTitle: "{label} è tranquillo",
    divisionCalmDescription: "Non vengono generate schede di insight attive per questo modulo al momento.",
  },
  workspaceNav: {
    sectionWorkspace: "Area di lavoro",
    sectionOperations: "Operazioni",
    sectionDivisions: "Divisioni",
    navOverview: "Panoramica",
    navMyTasks: "Le mie attività",
    navInbox: "Casella in arrivo",
    navApprovals: "Approvazioni",
    navQueues: "Code",
    navHistory: "Cronologia",
    navReports: "Report",
    navSettings: "Impostazioni",
    titleOverview: "Panoramica",
    titleMyTasks: "Le mie attività",
    titleInbox: "Casella in arrivo",
    titleApprovals: "Approvazioni",
    titleQueues: "Code",
    titleHistory: "Cronologia",
    titleReports: "Report",
    titleSettings: "Impostazioni",
    titleDivisionTemplate: "Modulo {shortName}",
    titleFallback: "Area di lavoro",
  },
};

const HUB_WORKSPACE_COPY_ZH: DeepPartial<HubWorkspaceCopy> = {
  workspaceScreen: {
    headerEyebrow: "HenryCo 员工工作区",
    activeStaffProfileLabel: "当前活跃员工档案",
    helperModeLabel: "助手模式",
    helperModeValue: "真实工作负载信号",
    helperModeDescription: "仅显示过期任务、审批、未读提醒和部门压力。",
    noWorkspaceFamilies: "无工作区族群",
    badgeLiveSignals: "基于 Supabase 实时信号生成",
    badgeSharedAuth: "通过 Supabase Auth 共享身份",
    badgeRoleModules: "基于角色的模块",
    badgeFallbackRoute: "备用访问路由已激活",
    accessPendingTitle: "工作区访问待定",
    accessPendingDescription: "此内部工作区仅对已认可的 HenryCo 员工或部门角色分配开放。",
    noHelperSignalsTitle: "暂无助手信号",
    noHelperSignalsDescription: "当活跃工作进入允许的部门范围后，助手将在此汇总过期任务、SLA 风险和工作负载压力。",
    noActiveTasksTitle: "暂无活跃任务",
    noActiveTasksDescription: "当前角色范围内没有可见的优先任务。",
    inboxCalmTitle: "收件箱平静",
    inboxCalmDescription: "当前工作区范围内没有未读提醒或开放的对话线程。",
    noApprovalsTitle: "无待审批项",
    noApprovalsDescription: "当前角色范围内没有活跃的审批项。",
    noHistoryTitle: "无可见历史",
    noHistoryDescription: "共享审计事件尚未对当前角色范围开放。",
    noTaskWorkloadTitle: "无可见任务负载",
    noTaskWorkloadDescription: "此部门目前平静，或当前角色范围有意不在此处展示活跃任务卡。",
    noQueueLanesTitle: "范围内无队列通道",
    noQueueLanesDescription: "当当前角色族群对此部门没有队列查看权限时，队列板将被隐藏。",
    moduleUnavailableTitle: "模块不可用",
    moduleUnavailableDescription: "此部门在当前角色范围内不可见。",
    operationsHelperLabel: "运营助手",
    operationsHelperTitle: "基于证据的下一步行动",
    helperInsightLabel: "助手洞察",
    insightOpenLabel: "打开",
    suggestedNextAction: "建议下一步操作：",
    queueLaneEmpty: "此通道当前没有任何项目。",
    openModuleLabel: "打开模块",
    openDivisionAppLabel: "打开部门应用",
    previousWindowLabel: "上一窗口：",
    deltaLabel: "差值",
    staffIdentityLabel: "员工身份",
    unnamedStaffAccount: "未命名员工账户",
    noEmailAddress: "无电子邮件地址",
    profileRoleLabel: "档案角色：",
    primaryDivisionLabel: "主部门：",
    currentAccessRouteLabel: "当前访问路由：",
    preferredWorkspaceHostLabel: "首选工作区主机：",
    notAssigned: "未分配",
    noPrimaryDivision: "无",
    permissionScopeLabel: "权限范围",
    divisionMembershipsLabel: "部门成员资格",
    sourceModeStructured: "专用数据",
    sourceModeSharedSignals: "共享信号",
    sourceModePlanned: "计划中",
    dataModeLabel: "数据模式",
    unreadBadge: "未读",
    introOverview: "跨部门运营视图，针对员工的实时角色范围调整。",
    introDivisionFallback: "部门详情界面。",
    introDivisionTemplate: "{shortName} 的运营、队列、洞察和实时工作负载。",
    divisionCalmTitle: "{label} 平静",
    divisionCalmDescription: "当前没有为此模块生成活跃洞察卡。",
  },
  workspaceNav: {
    sectionWorkspace: "工作区",
    sectionOperations: "运营",
    sectionDivisions: "部门",
    navOverview: "概览",
    navMyTasks: "我的任务",
    navInbox: "收件箱",
    navApprovals: "审批",
    navQueues: "队列",
    navHistory: "历史",
    navReports: "报告",
    navSettings: "设置",
    titleOverview: "概览",
    titleMyTasks: "我的任务",
    titleInbox: "收件箱",
    titleApprovals: "审批",
    titleQueues: "队列",
    titleHistory: "历史",
    titleReports: "报告",
    titleSettings: "设置",
    titleDivisionTemplate: "{shortName} 模块",
    titleFallback: "工作区",
  },
};

const HUB_WORKSPACE_COPY_HI: DeepPartial<HubWorkspaceCopy> = {
  workspaceScreen: {
    headerEyebrow: "HenryCo स्टाफ वर्कस्पेस",
    activeStaffProfileLabel: "सक्रिय स्टाफ प्रोफाइल",
    helperModeLabel: "सहायक मोड",
    helperModeValue: "वास्तविक कार्यभार संकेत",
    helperModeDescription: "केवल पुराने कार्य, अनुमोदन, अपठित अलर्ट और विभागीय दबाव।",
    noWorkspaceFamilies: "कोई वर्कस्पेस परिवार नहीं",
    badgeLiveSignals: "लाइव Supabase संकेतों से उत्पन्न",
    badgeSharedAuth: "Supabase Auth के माध्यम से साझा पहचान",
    badgeRoleModules: "भूमिका-आधारित मॉड्यूल",
    badgeFallbackRoute: "फ़ॉलबैक एक्सेस रूट सक्रिय",
    accessPendingTitle: "वर्कस्पेस एक्सेस लंबित है",
    accessPendingDescription:
      "यह आंतरिक वर्कस्पेस केवल मान्यता प्राप्त HenryCo स्टाफ सदस्यों या विभागीय भूमिका असाइनमेंट के लिए खुलता है।",
    noHelperSignalsTitle: "अभी तक कोई सहायक संकेत नहीं",
    noHelperSignalsDescription:
      "जब अनुमत विभागीय दायरे में लाइव काम आएगा, तो सहायक यहाँ पुराने कार्यों, SLA जोखिमों और कार्यभार दबाव का सारांश देगा।",
    noActiveTasksTitle: "कोई सक्रिय कार्य नहीं",
    noActiveTasksDescription: "वर्तमान भूमिका दायरे में कोई प्राथमिकता वाले कार्य दृश्यमान नहीं हैं।",
    inboxCalmTitle: "इनबॉक्स शांत है",
    inboxCalmDescription:
      "वर्तमान वर्कस्पेस दायरे में कोई अपठित अलर्ट या खुले संवाद धागे नहीं हैं।",
    noApprovalsTitle: "कोई अनुमोदन लंबित नहीं",
    noApprovalsDescription: "वर्तमान भूमिका दायरे में कोई सक्रिय अनुमोदन आइटम नहीं हैं।",
    noHistoryTitle: "कोई दृश्यमान इतिहास नहीं",
    noHistoryDescription: "वर्तमान भूमिका दायरे के लिए साझा ऑडिट घटनाएँ अभी तक प्रकट नहीं की गई हैं।",
    noTaskWorkloadTitle: "कोई दृश्यमान कार्यभार नहीं",
    noTaskWorkloadDescription:
      "यह विभाग या तो शांत है या वर्तमान भूमिका दायरे जानबूझकर यहाँ सक्रिय कार्य कार्ड प्रकट नहीं कर रहा।",
    noQueueLanesTitle: "दायरे में कोई कतार लेन नहीं",
    noQueueLanesDescription:
      "कतार बोर्ड छिपे रहते हैं जब वर्तमान भूमिका परिवार इस विभाग के लिए कतार दृश्यता नहीं रखता।",
    moduleUnavailableTitle: "मॉड्यूल अनुपलब्ध",
    moduleUnavailableDescription: "यह विभाग वर्तमान भूमिका दायरे में दृश्यमान नहीं है।",
    operationsHelperLabel: "परिचालन सहायक",
    operationsHelperTitle: "साक्ष्य-आधारित अगले कदम",
    helperInsightLabel: "सहायक अंतर्दृष्टि",
    insightOpenLabel: "खोलें",
    suggestedNextAction: "सुझाई गई अगली कार्रवाई:",
    queueLaneEmpty: "इस लेन में अभी कुछ नहीं है।",
    openModuleLabel: "मॉड्यूल खोलें",
    openDivisionAppLabel: "विभाग ऐप खोलें",
    previousWindowLabel: "पिछली विंडो:",
    deltaLabel: "डेल्टा",
    staffIdentityLabel: "स्टाफ पहचान",
    unnamedStaffAccount: "बिना नाम का स्टाफ खाता",
    noEmailAddress: "कोई ईमेल पता नहीं",
    profileRoleLabel: "प्रोफाइल भूमिका:",
    primaryDivisionLabel: "प्राथमिक विभाग:",
    currentAccessRouteLabel: "वर्तमान एक्सेस रूट:",
    preferredWorkspaceHostLabel: "पसंदीदा वर्कस्पेस होस्ट:",
    notAssigned: "असाइन नहीं किया गया",
    noPrimaryDivision: "कोई नहीं",
    permissionScopeLabel: "अनुमति दायरा",
    divisionMembershipsLabel: "विभागीय सदस्यताएँ",
    sourceModeStructured: "समर्पित डेटा",
    sourceModeSharedSignals: "साझा संकेत",
    sourceModePlanned: "नियोजित",
    dataModeLabel: "डेटा मोड",
    unreadBadge: "अपठित",
    introOverview: "स्टाफ सदस्य के लाइव भूमिका दायरे के अनुसार क्रॉस-डिवीजन ऑपरेटिंग व्यू।",
    introDivisionFallback: "विभाग विस्तार सतह।",
    introDivisionTemplate: "{shortName} के संचालन, कतारें, अंतर्दृष्टि और लाइव कार्यभार।",
    divisionCalmTitle: "{label} शांत है",
    divisionCalmDescription: "इस मॉड्यूल के लिए अभी कोई सक्रिय अंतर्दृष्टि कार्ड नहीं बनाए जा रहे।",
  },
  workspaceNav: {
    sectionWorkspace: "वर्कस्पेस",
    sectionOperations: "परिचालन",
    sectionDivisions: "विभाग",
    navOverview: "अवलोकन",
    navMyTasks: "मेरे कार्य",
    navInbox: "इनबॉक्स",
    navApprovals: "अनुमोदन",
    navQueues: "कतारें",
    navHistory: "इतिहास",
    navReports: "रिपोर्ट",
    navSettings: "सेटिंग्स",
    titleOverview: "अवलोकन",
    titleMyTasks: "मेरे कार्य",
    titleInbox: "इनबॉक्स",
    titleApprovals: "अनुमोदन",
    titleQueues: "कतारें",
    titleHistory: "इतिहास",
    titleReports: "रिपोर्ट",
    titleSettings: "सेटिंग्स",
    titleDivisionTemplate: "{shortName} मॉड्यूल",
    titleFallback: "वर्कस्पेस",
  },
};

const HUB_WORKSPACE_COPY_IG: DeepPartial<HubWorkspaceCopy> = {
  workspaceScreen: {
    headerEyebrow: "Ọnọdụ ọrụ HenryCo",
    activeStaffProfileLabel: "Profaịlụ ọrụ na-arụ ọrụ ugbu a",
    helperModeLabel: "Ọnọdụ onye inyeaka",
    helperModeValue: "Ihe ngosi ọrụ ezigbo",
    helperModeDescription: "Naanị ọrụ ochie, nkwenye, ọjụjụ na nrụpụta ngalaba.",
    noWorkspaceFamilies: "Enweghị ezinụlọ ọnọdụ ọrụ",
    badgeLiveSignals: "Emepụtara si n'ihe ngosi Supabase dị ndụ",
    badgeSharedAuth: "Nnabata nkwekọrịta site na Supabase Auth",
    badgeRoleModules: "Modul nke ọrụ",
    badgeFallbackRoute: "Ụzọ abata nke ndabere na-arụ ọrụ",
    accessPendingTitle: "Abata ọnọdụ ọrụ na-atọ ọdịda anya",
    noHelperSignalsTitle: "Enweghị ihe ngosi onye inyeaka ugbu a",
    noActiveTasksTitle: "Enweghị ọrụ na-arụ ọrụ",
    inboxCalmTitle: "Igbe ozi dị jụụ",
    noApprovalsTitle: "Enweghị nkwenye na-atọ ọdịda anya",
    noHistoryTitle: "Enweghị akụkọ ihe mere eme dị ìhè",
    noTaskWorkloadTitle: "Enweghị ibu ọrụ dị ìhè",
    noQueueLanesTitle: "Enweghị ụzọ akara n'ime okirikiri",
    moduleUnavailableTitle: "Modul adịghị eme ihe",
    operationsHelperLabel: "Onye inyeaka mmemme",
    operationsHelperTitle: "Ihe ọrụ ọzọ guzosie ike n'ihe akaebe",
    helperInsightLabel: "Ihe ọmụma onye inyeaka",
    insightOpenLabel: "Mepee",
    suggestedNextAction: "Omume ọzọ a tụrụ aro:",
    queueLaneEmpty: "Enweghị ihe ọ bụla n'ụzọ a ugbu a.",
    openModuleLabel: "Mepee modul",
    openDivisionAppLabel: "Mepee ngwa ngalaba",
    previousWindowLabel: "Windo gara aga:",
    deltaLabel: "Delta",
    staffIdentityLabel: "Njirimara ndị ọrụ",
    unnamedStaffAccount: "Akaụntụ ndị ọrụ enweghị aha",
    noEmailAddress: "Enweghị adreesị ozi-e",
    notAssigned: "Ekenyeghị",
    noPrimaryDivision: "Ọ dịghị",
    permissionScopeLabel: "Okirikiri ikike",
    divisionMembershipsLabel: "Ọnụ ọgụgụ ndị otu ngalaba",
    sourceModeStructured: "Data Nkwado",
    sourceModeSharedSignals: "Ihe ngosi ọ bụ ike",
    sourceModePlanned: "Atụmatụ",
    dataModeLabel: "Ọnọdụ data",
    unreadBadge: "agụtaghị",
    introOverview: "Nlele mmemme n'ofe ngalaba dabara iche na okirikiri ọrụ ndụ nke onye ọrụ.",
    introDivisionFallback: "Elu nkọwa ngalaba.",
    introDivisionTemplate: "Mmemme, akara, ihe ọmụma na ibu ọrụ ndụ {shortName}.",
    divisionCalmTitle: "{label} dị jụụ",
    divisionCalmDescription: "Enweghị kaadị ihe ọmụma na-arụ ọrụ maka modul a ugbu a.",
  },
  workspaceNav: {
    sectionWorkspace: "Ọnọdụ ọrụ",
    sectionOperations: "Mmemme",
    sectionDivisions: "Ngalaba",
    navOverview: "Nlele",
    navMyTasks: "Ọrụ m",
    navInbox: "Igbe ozi",
    navApprovals: "Nkwenye",
    navQueues: "Akara",
    navHistory: "Akụkọ",
    navReports: "Ọkọwa",
    navSettings: "Ntọala",
    titleOverview: "Nlele",
    titleMyTasks: "Ọrụ m",
    titleInbox: "Igbe ozi",
    titleApprovals: "Nkwenye",
    titleQueues: "Akara",
    titleHistory: "Akụkọ",
    titleReports: "Ọkọwa",
    titleSettings: "Ntọala",
    titleDivisionTemplate: "Modul {shortName}",
    titleFallback: "Ọnọdụ ọrụ",
  },
};

const HUB_WORKSPACE_COPY_YO: DeepPartial<HubWorkspaceCopy> = {
  workspaceScreen: {
    headerEyebrow: "Àyè iṣẹ́ HenryCo",
    activeStaffProfileLabel: "Profaili òṣìṣẹ́ tí ń ṣiṣẹ́",
    helperModeLabel: "Ìpele olùrànlọ́wọ́",
    helperModeValue: "Àmì ẹrù iṣẹ́ gidi",
    helperModeDescription: "Àwọn iṣẹ́ àgbàyanu, fọwọ́sí, àwọn ìkìlọ̀ tí a kò ka àti ìfàámọ́ ìpínlẹ̀ nìkan.",
    noWorkspaceFamilies: "Kò sí ìdílé àyè iṣẹ́",
    badgeLiveSignals: "A ṣe é láti àwọn àmì Supabase tí ó wà láàyè",
    badgeSharedAuth: "Ìdánimọ̀ tí a pín nípa Supabase Auth",
    badgeRoleModules: "Àwọn kókó tí ó dá lórí ipa",
    badgeFallbackRoute: "Ọ̀nà ìráàwọ̀sílẹ̀ ẹ̀yìn tí ó ń ṣiṣẹ́",
    accessPendingTitle: "Ìráàwọ̀sílẹ̀ àyè tí ń dúró",
    noHelperSignalsTitle: "Kò sí àmì olùrànlọ́wọ́ síbẹ̀",
    noActiveTasksTitle: "Kò sí iṣẹ́ tí ó ń ṣiṣẹ́",
    inboxCalmTitle: "Apótí ìgbàríyè dákẹ́",
    noApprovalsTitle: "Kò sí fọwọ́sí tí ń dúró",
    noHistoryTitle: "Kò sí ìtàn tí a rí",
    noTaskWorkloadTitle: "Kò sí ẹrù iṣẹ́ tí a rí",
    noQueueLanesTitle: "Kò sí àwọn ojú ọ̀nà ìtòlẹ́sẹẹsẹ nínú ìwọ̀n",
    moduleUnavailableTitle: "Kókó kò sí",
    operationsHelperLabel: "Olùrànlọ́wọ́ iṣẹ́ àárọ̀",
    operationsHelperTitle: "Àwọn ìgbésẹ̀ ìtẹ̀lé dáadáa",
    helperInsightLabel: "Ìmọ̀ olùrànlọ́wọ́",
    insightOpenLabel: "Ṣii",
    suggestedNextAction: "Ìgbésẹ̀ ìtẹ̀lé tí a dábàá:",
    queueLaneEmpty: "Kò sí nǹkan kankan nínú ojú ọ̀nà yìí báyìí.",
    openModuleLabel: "Ṣii kókó",
    openDivisionAppLabel: "Ṣii àpẹẹrẹ ìpínlẹ̀",
    notAssigned: "A kò yàn",
    noPrimaryDivision: "Kò sí",
    permissionScopeLabel: "Ìwọ̀n àṣẹ",
    divisionMembershipsLabel: "Ìpínlẹ̀ àwọn ọmọ ẹgbẹ́",
    sourceModeStructured: "Ìsọfúnni àkọsílẹ̀",
    sourceModeSharedSignals: "Àwọn àmì tí a pín",
    sourceModePlanned: "Tí a gbìmọ̀",
    dataModeLabel: "Ìpele ìsọfúnni",
    unreadBadge: "a kò ka",
    introOverview: "Ìwò iṣẹ́ àárọ̀ kárárá tí ó bá àyè ipa tí ó ń ṣiṣẹ́ mu.",
    introDivisionFallback: "Ilẹ̀ àlàyé ìpínlẹ̀.",
    introDivisionTemplate: "Iṣẹ́, ìtòlẹ́sẹẹsẹ, ìmọ̀ àti ẹrù iṣẹ́ tí ó wà láàyè {shortName}.",
    divisionCalmTitle: "{label} dákẹ́",
    divisionCalmDescription: "Kò sí káàdì ìmọ̀ tí ó ń ṣiṣẹ́ fún kókó yìí báyìí.",
  },
  workspaceNav: {
    sectionWorkspace: "Àyè iṣẹ́",
    sectionOperations: "Iṣẹ́ àárọ̀",
    sectionDivisions: "Àwọn ìpínlẹ̀",
    navOverview: "Àgbékalẹ̀",
    navMyTasks: "Àwọn iṣẹ́ mi",
    navInbox: "Apótí ìgbàríyè",
    navApprovals: "Fọwọ́sí",
    navQueues: "Ìtòlẹ́sẹẹsẹ",
    navHistory: "Ìtàn",
    navReports: "Ìjábọ̀",
    navSettings: "Ìtọ́jú",
    titleOverview: "Àgbékalẹ̀",
    titleMyTasks: "Àwọn iṣẹ́ mi",
    titleInbox: "Apótí ìgbàríyè",
    titleApprovals: "Fọwọ́sí",
    titleQueues: "Ìtòlẹ́sẹẹsẹ",
    titleHistory: "Ìtàn",
    titleReports: "Ìjábọ̀",
    titleSettings: "Ìtọ́jú",
    titleDivisionTemplate: "Kókó {shortName}",
    titleFallback: "Àyè iṣẹ́",
  },
};

const HUB_WORKSPACE_COPY_HA: DeepPartial<HubWorkspaceCopy> = {
  workspaceScreen: {
    headerEyebrow: "Wurin aiki na ma'aikata HenryCo",
    activeStaffProfileLabel: "Bayanan ma'aikaci mai aiki",
    helperModeLabel: "Yanayin mataimaki",
    helperModeValue: "Siginar aiki na gaskiya",
    helperModeDescription: "Kawai ayyukan da suka tsufa, amincewa, sanarwa da ba a karanta ba da matsin bangare.",
    noWorkspaceFamilies: "Babu iyalan wurin aiki",
    badgeLiveSignals: "An ƙirƙiro daga siginar Supabase na yau da kullun",
    badgeSharedAuth: "Shaida ta haɗaɗɗe ta Supabase Auth",
    badgeRoleModules: "Ƙungiyoyin aiki bisa rawar gani",
    badgeFallbackRoute: "Hanyar isa ta taka-taka tana aiki",
    accessPendingTitle: "Shiga wurin aiki yana jiran",
    noHelperSignalsTitle: "Babu siginar mataimaki tukuna",
    noActiveTasksTitle: "Babu ayyuka masu aiki",
    inboxCalmTitle: "Akwatin wasiƙa yana kwance",
    noApprovalsTitle: "Babu amincewa da ke jiran",
    noHistoryTitle: "Babu tarihi da ake gani",
    noTaskWorkloadTitle: "Babu nauyin aiki da ake gani",
    noQueueLanesTitle: "Babu layin jerin gwano a cikin iyaka",
    moduleUnavailableTitle: "Ƙungiya ba ta nan",
    operationsHelperLabel: "Mataimaki na ayyuka",
    operationsHelperTitle: "Matakan gaba bisa shaida",
    helperInsightLabel: "Fahimtar mataimaki",
    insightOpenLabel: "Buɗe",
    suggestedNextAction: "Mataki na gaba da aka ba da shawarar:",
    queueLaneEmpty: "Babu komai a cikin wannan layin yanzu.",
    openModuleLabel: "Buɗe ƙungiya",
    openDivisionAppLabel: "Buɗe app na bangare",
    notAssigned: "Ba a ba wa kowa ba",
    noPrimaryDivision: "Babu",
    permissionScopeLabel: "Iyakar izini",
    divisionMembershipsLabel: "Membobichi na bangare",
    sourceModeStructured: "Bayanan da aka keɓe",
    sourceModeSharedSignals: "Siginar haɗaɗɗe",
    sourceModePlanned: "An tsara",
    dataModeLabel: "Yanayin bayanan",
    unreadBadge: "ba a karanta ba",
    introOverview: "Ra'ayin aiki ɗaya daga bangare zuwa wani da aka tsara bisa iyakar rawar gani mai aiki.",
    introDivisionFallback: "Saman bayanin bangare.",
    introDivisionTemplate: "Ayyuka, jerin gwano, fahimta da nauyin aiki na yau da kullun na {shortName}.",
    divisionCalmTitle: "{label} yana kwance",
    divisionCalmDescription: "Babu katunan fahimta masu aiki da ake ƙirƙiro wa wannan ƙungiyar yanzu.",
  },
  workspaceNav: {
    sectionWorkspace: "Wurin aiki",
    sectionOperations: "Ayyuka",
    sectionDivisions: "Bangarori",
    navOverview: "Taƙaitawa",
    navMyTasks: "Ayyukana",
    navInbox: "Akwatin wasiƙa",
    navApprovals: "Amincewa",
    navQueues: "Jerin gwano",
    navHistory: "Tarihi",
    navReports: "Rahotannai",
    navSettings: "Saituna",
    titleOverview: "Taƙaitawa",
    titleMyTasks: "Ayyukana",
    titleInbox: "Akwatin wasiƙa",
    titleApprovals: "Amincewa",
    titleQueues: "Jerin gwano",
    titleHistory: "Tarihi",
    titleReports: "Rahotannai",
    titleSettings: "Saituna",
    titleDivisionTemplate: "Ƙungiya {shortName}",
    titleFallback: "Wurin aiki",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Locale map + getter
// ─────────────────────────────────────────────────────────────────────────────

const HUB_WORKSPACE_COPY_LOCALES: Record<string, DeepPartial<HubWorkspaceCopy>> = {
  fr: HUB_WORKSPACE_COPY_FR,
  es: HUB_WORKSPACE_COPY_ES,
  pt: HUB_WORKSPACE_COPY_PT,
  ar: HUB_WORKSPACE_COPY_AR,
  de: HUB_WORKSPACE_COPY_DE,
  it: HUB_WORKSPACE_COPY_IT,
  zh: HUB_WORKSPACE_COPY_ZH,
  hi: HUB_WORKSPACE_COPY_HI,
  ig: HUB_WORKSPACE_COPY_IG,
  yo: HUB_WORKSPACE_COPY_YO,
  ha: HUB_WORKSPACE_COPY_HA,
};

export function getHubWorkspaceCopy(locale: AppLocale): HubWorkspaceCopy {
  const override = locale !== DEFAULT_LOCALE ? HUB_WORKSPACE_COPY_LOCALES[locale] : undefined;
  if (!override) return HUB_WORKSPACE_COPY_EN;
  return deepMergeMessages(HUB_WORKSPACE_COPY_EN, override as Record<string, unknown>) as HubWorkspaceCopy;
}
