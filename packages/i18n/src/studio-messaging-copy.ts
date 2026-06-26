import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * Studio messaging surface copy.
 *
 * One top-level key per messaging component. English is the exhaustive
 * baseline; fr/es/pt/ar/de/it/zh are authored in full. ig/yo/ha/hi are
 * intentionally omitted and fall back to English (human-translation only).
 *
 * Placeholders such as {projectName}, {teamLabel}, {senderName}, {label},
 * {team}, {count}, {projects}, {unread}, {new} are substituted by the caller
 * and must be preserved verbatim in every locale. "HenryCo" is a brand name
 * and stays verbatim across all locales.
 */
export type StudioMessagingCopy = {
  contextPanel: {
    panelLabel: string;
    closeLabel: string;
    currentMilestone: string;
    noMilestone: string;
    dueTbd: string;
    recentFiles: string;
    noFiles: string;
    viewAllFiles: string;
    timeline: string;
    timelineEmpty: string;
    team: string;
    teamEmpty: string;
    activeLabel: string;
  };
  emptyState: {
    headline: string;
    supporting: string;
    welcomeWithTeam: string;
    welcomeNoTeam: string;
    featureRealtime: string;
    featureFileSharing: string;
    featureTeamAccess: string;
    openingNote: string;
  };
  messageList: {
    conversationLabel: string;
  };
  reactions: {
    reactionLabel: string;
    pickerLabel: string;
    reactFallback: string;
  };
  replyPreview: {
    replyingTo: string;
    noContent: string;
    cancelReply: string;
    jumpToOriginal: string;
  };
  centre: {
    heading: string;
    projectsSummary: string;
    attachment: string;
    noMessages: string;
    newCount: string;
    projectWorkspace: string;
    backToList: string;
    placeholderBody: string;
    openConversation: string;
    selectPrompt: string;
    yourProjects: string;
  };
  notifications: {
    projectUpdate: string;
    studioSenderFallback: string;
    attachment: string;
    regionLabel: string;
    newBadge: string;
    dismiss: string;
  };
  systemMessage: {
    studioTeam: string;
    theMilestone: string;
    verbComplete: string;
    verbStarted: string;
    verbBlocked: string;
    verbUpdated: string;
    milestoneHeadline: string;
    aFile: string;
    fileShared: string;
    theInvoice: string;
    paymentHeadline: string;
    anApproval: string;
    approvalRequested: string;
    projectUpdate: string;
    update: string;
  };
  thread: {
    backToList: string;
    reconnecting: string;
    searchConversation: string;
    hideContext: string;
    showContext: string;
    newMessage: string;
    jumpToNewMessage: string;
    closeContext: string;
    statusLive: string;
    statusConnecting: string;
    statusReconnecting: string;
    statusOffline: string;
    currentMilestone: string;
  };
};

const EN: StudioMessagingCopy = {
  contextPanel: {
    panelLabel: "Project context",
    closeLabel: "Close project context",
    currentMilestone: "Current milestone",
    noMilestone: "No active milestone yet.",
    dueTbd: "Due TBD",
    recentFiles: "Recent files",
    noFiles:
      "No files shared yet. Files appear here when the team uploads deliverables.",
    viewAllFiles: "View all files",
    timeline: "Project timeline",
    timelineEmpty: "Timeline will appear here as milestones are added.",
    team: "Studio team",
    teamEmpty: "The Studio team for this project will appear here.",
    activeLabel: "Active",
  },
  emptyState: {
    headline: "Your project conversation starts here.",
    supporting:
      "Everything about {projectName} — questions, updates, files, and decisions — in one organised place.",
    welcomeWithTeam:
      "{projectName} is open in Studio. Your Studio team is {teamLabel}. Questions, updates, files, and decisions all live here in one organised place — ask anything any time.",
    welcomeNoTeam:
      "{projectName} is open in Studio. Questions, updates, files, and decisions all live here in one organised place — ask anything any time.",
    featureRealtime: "Real-time updates",
    featureFileSharing: "File sharing",
    featureTeamAccess: "Direct team access",
    openingNote: "Opening note",
  },
  messageList: {
    conversationLabel: "Project conversation",
  },
  reactions: {
    reactionLabel: "{label} reaction, {count}",
    pickerLabel: "React with",
    reactFallback: "React",
  },
  replyPreview: {
    replyingTo: "Replying to {senderName}",
    noContent: "(no content)",
    cancelReply: "Cancel reply",
    jumpToOriginal: "Jump to original message from {senderName}",
  },
  centre: {
    heading: "Messages",
    projectsSummary: "{projects} project{plural} · {unread} unread",
    attachment: "(attachment)",
    noMessages: "No messages yet",
    newCount: "{new} new",
    projectWorkspace: "Project workspace",
    backToList: "Back to message list",
    placeholderBody:
      "Open this project's full conversation, including history, files, and team context.",
    openConversation: "Open project conversation",
    selectPrompt: "Select a project to open its conversation.",
    yourProjects: "your projects",
  },
  notifications: {
    projectUpdate: "Project update",
    studioSenderFallback: "HenryCo Studio",
    attachment: "(attachment)",
    regionLabel: "Project notifications",
    newBadge: "New",
    dismiss: "Dismiss notification",
  },
  systemMessage: {
    studioTeam: "the Studio team",
    theMilestone: "the milestone",
    verbComplete: "marked complete",
    verbStarted: "started",
    verbBlocked: "flagged blocked",
    verbUpdated: "updated",
    milestoneHeadline: "{title} {verb} by {team}",
    aFile: "a file",
    fileShared: "{team} shared {label}",
    theInvoice: "the invoice",
    paymentHeadline: "{label} {status}",
    anApproval: "an approval",
    approvalRequested: "{team} requested {label}",
    projectUpdate: "Project update",
    update: "Update",
  },
  thread: {
    backToList: "Back to message list",
    reconnecting: "Reconnecting",
    searchConversation: "Search this conversation",
    hideContext: "Hide project context",
    showContext: "Show project context",
    newMessage: "New message",
    jumpToNewMessage: "Jump to new message",
    closeContext: "Close project context",
    statusLive: "Live",
    statusConnecting: "Connecting…",
    statusReconnecting: "Reconnecting…",
    statusOffline: "Offline",
    currentMilestone: "Current milestone",
  },
};

const FR: DeepPartial<StudioMessagingCopy> = {
  contextPanel: {
    panelLabel: "Contexte du projet",
    closeLabel: "Fermer le contexte du projet",
    currentMilestone: "Jalon actuel",
    noMilestone: "Aucun jalon actif pour le moment.",
    dueTbd: "Échéance à définir",
    recentFiles: "Fichiers récents",
    noFiles:
      "Aucun fichier partagé pour le moment. Les fichiers apparaissent ici lorsque l'équipe télécharge des livrables.",
    viewAllFiles: "Voir tous les fichiers",
    timeline: "Chronologie du projet",
    timelineEmpty:
      "La chronologie apparaîtra ici à mesure que des jalons sont ajoutés.",
    team: "Équipe Studio",
    teamEmpty: "L'équipe Studio de ce projet apparaîtra ici.",
    activeLabel: "Actif",
  },
  emptyState: {
    headline: "La conversation de votre projet commence ici.",
    supporting:
      "Tout ce qui concerne {projectName} — questions, mises à jour, fichiers et décisions — dans un seul endroit organisé.",
    welcomeWithTeam:
      "{projectName} est ouvert dans Studio. Votre équipe Studio est {teamLabel}. Questions, mises à jour, fichiers et décisions sont tous réunis ici dans un seul endroit organisé — posez vos questions à tout moment.",
    welcomeNoTeam:
      "{projectName} est ouvert dans Studio. Questions, mises à jour, fichiers et décisions sont tous réunis ici dans un seul endroit organisé — posez vos questions à tout moment.",
    featureRealtime: "Mises à jour en temps réel",
    featureFileSharing: "Partage de fichiers",
    featureTeamAccess: "Accès direct à l'équipe",
    openingNote: "Note d'ouverture",
  },
  messageList: {
    conversationLabel: "Conversation du projet",
  },
  reactions: {
    reactionLabel: "Réaction {label}, {count}",
    pickerLabel: "Réagir avec",
    reactFallback: "Réagir",
  },
  replyPreview: {
    replyingTo: "Réponse à {senderName}",
    noContent: "(aucun contenu)",
    cancelReply: "Annuler la réponse",
    jumpToOriginal: "Accéder au message original de {senderName}",
  },
  centre: {
    heading: "Messages",
    projectsSummary: "{projects} projet{plural} · {unread} non lus",
    attachment: "(pièce jointe)",
    noMessages: "Aucun message pour le moment",
    newCount: "{new} nouveaux",
    projectWorkspace: "Espace de travail du projet",
    backToList: "Retour à la liste des messages",
    placeholderBody:
      "Ouvrez la conversation complète de ce projet, y compris l'historique, les fichiers et le contexte de l'équipe.",
    openConversation: "Ouvrir la conversation du projet",
    selectPrompt: "Sélectionnez un projet pour ouvrir sa conversation.",
    yourProjects: "vos projets",
  },
  notifications: {
    projectUpdate: "Mise à jour du projet",
    studioSenderFallback: "HenryCo Studio",
    attachment: "(pièce jointe)",
    regionLabel: "Notifications du projet",
    newBadge: "Nouveau",
    dismiss: "Ignorer la notification",
  },
  systemMessage: {
    studioTeam: "l'équipe Studio",
    theMilestone: "le jalon",
    verbComplete: "marqué comme terminé",
    verbStarted: "démarré",
    verbBlocked: "signalé comme bloqué",
    verbUpdated: "mis à jour",
    milestoneHeadline: "{title} {verb} par {team}",
    aFile: "un fichier",
    fileShared: "{team} a partagé {label}",
    theInvoice: "la facture",
    paymentHeadline: "{label} {status}",
    anApproval: "une approbation",
    approvalRequested: "{team} a demandé {label}",
    projectUpdate: "Mise à jour du projet",
    update: "Mise à jour",
  },
  thread: {
    backToList: "Retour à la liste des messages",
    reconnecting: "Reconnexion",
    searchConversation: "Rechercher dans cette conversation",
    hideContext: "Masquer le contexte du projet",
    showContext: "Afficher le contexte du projet",
    newMessage: "Nouveau message",
    jumpToNewMessage: "Accéder au nouveau message",
    closeContext: "Fermer le contexte du projet",
    statusLive: "En direct",
    statusConnecting: "Connexion…",
    statusReconnecting: "Reconnexion…",
    statusOffline: "Hors ligne",
    currentMilestone: "Jalon actuel",
  },
};

const ES: DeepPartial<StudioMessagingCopy> = {
  contextPanel: {
    panelLabel: "Contexto del proyecto",
    closeLabel: "Cerrar el contexto del proyecto",
    currentMilestone: "Hito actual",
    noMilestone: "Aún no hay ningún hito activo.",
    dueTbd: "Fecha límite por definir",
    recentFiles: "Archivos recientes",
    noFiles:
      "Aún no se han compartido archivos. Los archivos aparecen aquí cuando el equipo sube entregables.",
    viewAllFiles: "Ver todos los archivos",
    timeline: "Cronología del proyecto",
    timelineEmpty:
      "La cronología aparecerá aquí a medida que se añadan hitos.",
    team: "Equipo de Studio",
    teamEmpty: "El equipo de Studio de este proyecto aparecerá aquí.",
    activeLabel: "Activo",
  },
  emptyState: {
    headline: "La conversación de tu proyecto comienza aquí.",
    supporting:
      "Todo sobre {projectName} — preguntas, actualizaciones, archivos y decisiones — en un único lugar organizado.",
    welcomeWithTeam:
      "{projectName} está abierto en Studio. Tu equipo de Studio es {teamLabel}. Preguntas, actualizaciones, archivos y decisiones están todos aquí en un único lugar organizado — pregunta lo que quieras en cualquier momento.",
    welcomeNoTeam:
      "{projectName} está abierto en Studio. Preguntas, actualizaciones, archivos y decisiones están todos aquí en un único lugar organizado — pregunta lo que quieras en cualquier momento.",
    featureRealtime: "Actualizaciones en tiempo real",
    featureFileSharing: "Compartir archivos",
    featureTeamAccess: "Acceso directo al equipo",
    openingNote: "Nota de apertura",
  },
  messageList: {
    conversationLabel: "Conversación del proyecto",
  },
  reactions: {
    reactionLabel: "Reacción {label}, {count}",
    pickerLabel: "Reaccionar con",
    reactFallback: "Reaccionar",
  },
  replyPreview: {
    replyingTo: "Respondiendo a {senderName}",
    noContent: "(sin contenido)",
    cancelReply: "Cancelar respuesta",
    jumpToOriginal: "Ir al mensaje original de {senderName}",
  },
  centre: {
    heading: "Mensajes",
    projectsSummary: "{projects} proyecto{plural} · {unread} sin leer",
    attachment: "(archivo adjunto)",
    noMessages: "Aún no hay mensajes",
    newCount: "{new} nuevos",
    projectWorkspace: "Espacio de trabajo del proyecto",
    backToList: "Volver a la lista de mensajes",
    placeholderBody:
      "Abre la conversación completa de este proyecto, incluido el historial, los archivos y el contexto del equipo.",
    openConversation: "Abrir la conversación del proyecto",
    selectPrompt: "Selecciona un proyecto para abrir su conversación.",
    yourProjects: "tus proyectos",
  },
  notifications: {
    projectUpdate: "Actualización del proyecto",
    studioSenderFallback: "HenryCo Studio",
    attachment: "(archivo adjunto)",
    regionLabel: "Notificaciones del proyecto",
    newBadge: "Nuevo",
    dismiss: "Descartar notificación",
  },
  systemMessage: {
    studioTeam: "el equipo de Studio",
    theMilestone: "el hito",
    verbComplete: "marcado como completado",
    verbStarted: "iniciado",
    verbBlocked: "marcado como bloqueado",
    verbUpdated: "actualizado",
    milestoneHeadline: "{title} {verb} por {team}",
    aFile: "un archivo",
    fileShared: "{team} compartió {label}",
    theInvoice: "la factura",
    paymentHeadline: "{label} {status}",
    anApproval: "una aprobación",
    approvalRequested: "{team} solicitó {label}",
    projectUpdate: "Actualización del proyecto",
    update: "Actualización",
  },
  thread: {
    backToList: "Volver a la lista de mensajes",
    reconnecting: "Reconectando",
    searchConversation: "Buscar en esta conversación",
    hideContext: "Ocultar el contexto del proyecto",
    showContext: "Mostrar el contexto del proyecto",
    newMessage: "Nuevo mensaje",
    jumpToNewMessage: "Ir al nuevo mensaje",
    closeContext: "Cerrar el contexto del proyecto",
    statusLive: "En vivo",
    statusConnecting: "Conectando…",
    statusReconnecting: "Reconectando…",
    statusOffline: "Sin conexión",
    currentMilestone: "Hito actual",
  },
};

const PT: DeepPartial<StudioMessagingCopy> = {
  contextPanel: {
    panelLabel: "Contexto do projeto",
    closeLabel: "Fechar o contexto do projeto",
    currentMilestone: "Marco atual",
    noMilestone: "Ainda não há nenhum marco ativo.",
    dueTbd: "Prazo a definir",
    recentFiles: "Arquivos recentes",
    noFiles:
      "Nenhum arquivo compartilhado ainda. Os arquivos aparecem aqui quando a equipe envia entregas.",
    viewAllFiles: "Ver todos os arquivos",
    timeline: "Cronograma do projeto",
    timelineEmpty:
      "O cronograma aparecerá aqui à medida que os marcos forem adicionados.",
    team: "Equipe do Studio",
    teamEmpty: "A equipe do Studio deste projeto aparecerá aqui.",
    activeLabel: "Ativo",
  },
  emptyState: {
    headline: "A conversa do seu projeto começa aqui.",
    supporting:
      "Tudo sobre {projectName} — perguntas, atualizações, arquivos e decisões — em um único lugar organizado.",
    welcomeWithTeam:
      "{projectName} está aberto no Studio. Sua equipe do Studio é {teamLabel}. Perguntas, atualizações, arquivos e decisões ficam todos aqui em um único lugar organizado — pergunte o que quiser a qualquer momento.",
    welcomeNoTeam:
      "{projectName} está aberto no Studio. Perguntas, atualizações, arquivos e decisões ficam todos aqui em um único lugar organizado — pergunte o que quiser a qualquer momento.",
    featureRealtime: "Atualizações em tempo real",
    featureFileSharing: "Compartilhamento de arquivos",
    featureTeamAccess: "Acesso direto à equipe",
    openingNote: "Nota de abertura",
  },
  messageList: {
    conversationLabel: "Conversa do projeto",
  },
  reactions: {
    reactionLabel: "Reação {label}, {count}",
    pickerLabel: "Reagir com",
    reactFallback: "Reagir",
  },
  replyPreview: {
    replyingTo: "Respondendo a {senderName}",
    noContent: "(sem conteúdo)",
    cancelReply: "Cancelar resposta",
    jumpToOriginal: "Ir para a mensagem original de {senderName}",
  },
  centre: {
    heading: "Mensagens",
    projectsSummary: "{projects} projeto{plural} · {unread} não lidas",
    attachment: "(anexo)",
    noMessages: "Ainda não há mensagens",
    newCount: "{new} novas",
    projectWorkspace: "Espaço de trabalho do projeto",
    backToList: "Voltar à lista de mensagens",
    placeholderBody:
      "Abra a conversa completa deste projeto, incluindo histórico, arquivos e contexto da equipe.",
    openConversation: "Abrir a conversa do projeto",
    selectPrompt: "Selecione um projeto para abrir sua conversa.",
    yourProjects: "seus projetos",
  },
  notifications: {
    projectUpdate: "Atualização do projeto",
    studioSenderFallback: "HenryCo Studio",
    attachment: "(anexo)",
    regionLabel: "Notificações do projeto",
    newBadge: "Novo",
    dismiss: "Dispensar notificação",
  },
  systemMessage: {
    studioTeam: "a equipe do Studio",
    theMilestone: "o marco",
    verbComplete: "marcado como concluído",
    verbStarted: "iniciado",
    verbBlocked: "sinalizado como bloqueado",
    verbUpdated: "atualizado",
    milestoneHeadline: "{title} {verb} por {team}",
    aFile: "um arquivo",
    fileShared: "{team} compartilhou {label}",
    theInvoice: "a fatura",
    paymentHeadline: "{label} {status}",
    anApproval: "uma aprovação",
    approvalRequested: "{team} solicitou {label}",
    projectUpdate: "Atualização do projeto",
    update: "Atualização",
  },
  thread: {
    backToList: "Voltar à lista de mensagens",
    reconnecting: "Reconectando",
    searchConversation: "Pesquisar nesta conversa",
    hideContext: "Ocultar o contexto do projeto",
    showContext: "Mostrar o contexto do projeto",
    newMessage: "Nova mensagem",
    jumpToNewMessage: "Ir para a nova mensagem",
    closeContext: "Fechar o contexto do projeto",
    statusLive: "Ao vivo",
    statusConnecting: "Conectando…",
    statusReconnecting: "Reconectando…",
    statusOffline: "Offline",
    currentMilestone: "Marco atual",
  },
};

const AR: DeepPartial<StudioMessagingCopy> = {
  contextPanel: {
    panelLabel: "سياق المشروع",
    closeLabel: "إغلاق سياق المشروع",
    currentMilestone: "المرحلة الحالية",
    noMilestone: "لا توجد مرحلة نشطة بعد.",
    dueTbd: "موعد التسليم لم يُحدد بعد",
    recentFiles: "الملفات الأخيرة",
    noFiles:
      "لم تتم مشاركة أي ملفات بعد. تظهر الملفات هنا عندما يرفع الفريق المخرجات.",
    viewAllFiles: "عرض جميع الملفات",
    timeline: "الجدول الزمني للمشروع",
    timelineEmpty: "سيظهر الجدول الزمني هنا عند إضافة المراحل.",
    team: "فريق Studio",
    teamEmpty: "سيظهر فريق Studio الخاص بهذا المشروع هنا.",
    activeLabel: "نشط",
  },
  emptyState: {
    headline: "تبدأ محادثة مشروعك من هنا.",
    supporting:
      "كل ما يتعلق بـ {projectName} — الأسئلة والتحديثات والملفات والقرارات — في مكان واحد منظم.",
    welcomeWithTeam:
      "{projectName} مفتوح في Studio. فريق Studio الخاص بك هو {teamLabel}. الأسئلة والتحديثات والملفات والقرارات كلها هنا في مكان واحد منظم — اسأل أي شيء في أي وقت.",
    welcomeNoTeam:
      "{projectName} مفتوح في Studio. الأسئلة والتحديثات والملفات والقرارات كلها هنا في مكان واحد منظم — اسأل أي شيء في أي وقت.",
    featureRealtime: "تحديثات فورية",
    featureFileSharing: "مشاركة الملفات",
    featureTeamAccess: "وصول مباشر إلى الفريق",
    openingNote: "ملاحظة افتتاحية",
  },
  messageList: {
    conversationLabel: "محادثة المشروع",
  },
  reactions: {
    reactionLabel: "تفاعل {label}، {count}",
    pickerLabel: "تفاعل بـ",
    reactFallback: "تفاعل",
  },
  replyPreview: {
    replyingTo: "رد على {senderName}",
    noContent: "(لا يوجد محتوى)",
    cancelReply: "إلغاء الرد",
    jumpToOriginal: "الانتقال إلى الرسالة الأصلية من {senderName}",
  },
  centre: {
    heading: "الرسائل",
    projectsSummary: "{projects} مشروع{plural} · {unread} غير مقروءة",
    attachment: "(مرفق)",
    noMessages: "لا توجد رسائل بعد",
    newCount: "{new} جديدة",
    projectWorkspace: "مساحة عمل المشروع",
    backToList: "العودة إلى قائمة الرسائل",
    placeholderBody:
      "افتح المحادثة الكاملة لهذا المشروع، بما في ذلك السجل والملفات وسياق الفريق.",
    openConversation: "فتح محادثة المشروع",
    selectPrompt: "اختر مشروعًا لفتح محادثته.",
    yourProjects: "مشاريعك",
  },
  notifications: {
    projectUpdate: "تحديث المشروع",
    studioSenderFallback: "HenryCo Studio",
    attachment: "(مرفق)",
    regionLabel: "إشعارات المشروع",
    newBadge: "جديد",
    dismiss: "تجاهل الإشعار",
  },
  systemMessage: {
    studioTeam: "فريق Studio",
    theMilestone: "المرحلة",
    verbComplete: "تم وضع علامة مكتمل",
    verbStarted: "بدأ",
    verbBlocked: "تم وضع علامة محظور",
    verbUpdated: "تم التحديث",
    milestoneHeadline: "{title} {verb} بواسطة {team}",
    aFile: "ملف",
    fileShared: "شارك {team} {label}",
    theInvoice: "الفاتورة",
    paymentHeadline: "{label} {status}",
    anApproval: "موافقة",
    approvalRequested: "طلب {team} {label}",
    projectUpdate: "تحديث المشروع",
    update: "تحديث",
  },
  thread: {
    backToList: "العودة إلى قائمة الرسائل",
    reconnecting: "إعادة الاتصال",
    searchConversation: "البحث في هذه المحادثة",
    hideContext: "إخفاء سياق المشروع",
    showContext: "إظهار سياق المشروع",
    newMessage: "رسالة جديدة",
    jumpToNewMessage: "الانتقال إلى الرسالة الجديدة",
    closeContext: "إغلاق سياق المشروع",
    statusLive: "مباشر",
    statusConnecting: "جارٍ الاتصال…",
    statusReconnecting: "إعادة الاتصال…",
    statusOffline: "غير متصل",
    currentMilestone: "المرحلة الحالية",
  },
};

const DE: DeepPartial<StudioMessagingCopy> = {
  contextPanel: {
    panelLabel: "Projektkontext",
    closeLabel: "Projektkontext schließen",
    currentMilestone: "Aktueller Meilenstein",
    noMilestone: "Noch kein aktiver Meilenstein.",
    dueTbd: "Fällig: noch offen",
    recentFiles: "Neueste Dateien",
    noFiles:
      "Noch keine Dateien geteilt. Dateien erscheinen hier, sobald das Team Ergebnisse hochlädt.",
    viewAllFiles: "Alle Dateien anzeigen",
    timeline: "Projektzeitleiste",
    timelineEmpty:
      "Die Zeitleiste erscheint hier, sobald Meilensteine hinzugefügt werden.",
    team: "Studio-Team",
    teamEmpty: "Das Studio-Team für dieses Projekt erscheint hier.",
    activeLabel: "Aktiv",
  },
  emptyState: {
    headline: "Die Unterhaltung zu Ihrem Projekt beginnt hier.",
    supporting:
      "Alles zu {projectName} — Fragen, Updates, Dateien und Entscheidungen — an einem organisierten Ort.",
    welcomeWithTeam:
      "{projectName} ist in Studio geöffnet. Ihr Studio-Team ist {teamLabel}. Fragen, Updates, Dateien und Entscheidungen finden Sie hier an einem organisierten Ort — stellen Sie jederzeit Ihre Fragen.",
    welcomeNoTeam:
      "{projectName} ist in Studio geöffnet. Fragen, Updates, Dateien und Entscheidungen finden Sie hier an einem organisierten Ort — stellen Sie jederzeit Ihre Fragen.",
    featureRealtime: "Echtzeit-Updates",
    featureFileSharing: "Dateifreigabe",
    featureTeamAccess: "Direkter Teamzugriff",
    openingNote: "Eröffnungshinweis",
  },
  messageList: {
    conversationLabel: "Projektunterhaltung",
  },
  reactions: {
    reactionLabel: "Reaktion {label}, {count}",
    pickerLabel: "Reagieren mit",
    reactFallback: "Reagieren",
  },
  replyPreview: {
    replyingTo: "Antwort an {senderName}",
    noContent: "(kein Inhalt)",
    cancelReply: "Antwort abbrechen",
    jumpToOriginal: "Zur ursprünglichen Nachricht von {senderName} springen",
  },
  centre: {
    heading: "Nachrichten",
    projectsSummary: "{projects} Projekt{plural} · {unread} ungelesen",
    attachment: "(Anhang)",
    noMessages: "Noch keine Nachrichten",
    newCount: "{new} neu",
    projectWorkspace: "Projekt-Arbeitsbereich",
    backToList: "Zurück zur Nachrichtenliste",
    placeholderBody:
      "Öffnen Sie die vollständige Unterhaltung dieses Projekts, einschließlich Verlauf, Dateien und Teamkontext.",
    openConversation: "Projektunterhaltung öffnen",
    selectPrompt: "Wählen Sie ein Projekt aus, um seine Unterhaltung zu öffnen.",
    yourProjects: "Ihre Projekte",
  },
  notifications: {
    projectUpdate: "Projekt-Update",
    studioSenderFallback: "HenryCo Studio",
    attachment: "(Anhang)",
    regionLabel: "Projektbenachrichtigungen",
    newBadge: "Neu",
    dismiss: "Benachrichtigung schließen",
  },
  systemMessage: {
    studioTeam: "das Studio-Team",
    theMilestone: "der Meilenstein",
    verbComplete: "als abgeschlossen markiert",
    verbStarted: "gestartet",
    verbBlocked: "als blockiert markiert",
    verbUpdated: "aktualisiert",
    milestoneHeadline: "{title} von {team} {verb}",
    aFile: "eine Datei",
    fileShared: "{team} hat {label} geteilt",
    theInvoice: "die Rechnung",
    paymentHeadline: "{label} {status}",
    anApproval: "eine Freigabe",
    approvalRequested: "{team} hat {label} angefordert",
    projectUpdate: "Projekt-Update",
    update: "Update",
  },
  thread: {
    backToList: "Zurück zur Nachrichtenliste",
    reconnecting: "Verbindung wird wiederhergestellt",
    searchConversation: "In dieser Unterhaltung suchen",
    hideContext: "Projektkontext ausblenden",
    showContext: "Projektkontext anzeigen",
    newMessage: "Neue Nachricht",
    jumpToNewMessage: "Zur neuen Nachricht springen",
    closeContext: "Projektkontext schließen",
    statusLive: "Live",
    statusConnecting: "Verbinden…",
    statusReconnecting: "Verbindung wird wiederhergestellt…",
    statusOffline: "Offline",
    currentMilestone: "Aktueller Meilenstein",
  },
};

const IT: DeepPartial<StudioMessagingCopy> = {
  contextPanel: {
    panelLabel: "Contesto del progetto",
    closeLabel: "Chiudi il contesto del progetto",
    currentMilestone: "Traguardo attuale",
    noMilestone: "Nessun traguardo attivo per il momento.",
    dueTbd: "Scadenza da definire",
    recentFiles: "File recenti",
    noFiles:
      "Nessun file condiviso per il momento. I file appaiono qui quando il team carica i deliverable.",
    viewAllFiles: "Visualizza tutti i file",
    timeline: "Cronologia del progetto",
    timelineEmpty:
      "La cronologia apparirà qui man mano che vengono aggiunti i traguardi.",
    team: "Team Studio",
    teamEmpty: "Il team Studio di questo progetto apparirà qui.",
    activeLabel: "Attivo",
  },
  emptyState: {
    headline: "La conversazione del tuo progetto inizia qui.",
    supporting:
      "Tutto su {projectName} — domande, aggiornamenti, file e decisioni — in un unico posto organizzato.",
    welcomeWithTeam:
      "{projectName} è aperto in Studio. Il tuo team Studio è {teamLabel}. Domande, aggiornamenti, file e decisioni sono tutti qui in un unico posto organizzato — chiedi quello che vuoi in qualsiasi momento.",
    welcomeNoTeam:
      "{projectName} è aperto in Studio. Domande, aggiornamenti, file e decisioni sono tutti qui in un unico posto organizzato — chiedi quello che vuoi in qualsiasi momento.",
    featureRealtime: "Aggiornamenti in tempo reale",
    featureFileSharing: "Condivisione di file",
    featureTeamAccess: "Accesso diretto al team",
    openingNote: "Nota di apertura",
  },
  messageList: {
    conversationLabel: "Conversazione del progetto",
  },
  reactions: {
    reactionLabel: "Reazione {label}, {count}",
    pickerLabel: "Reagisci con",
    reactFallback: "Reagisci",
  },
  replyPreview: {
    replyingTo: "Risposta a {senderName}",
    noContent: "(nessun contenuto)",
    cancelReply: "Annulla risposta",
    jumpToOriginal: "Vai al messaggio originale di {senderName}",
  },
  centre: {
    heading: "Messaggi",
    projectsSummary: "{projects} progetto{plural} · {unread} non letti",
    attachment: "(allegato)",
    noMessages: "Nessun messaggio per il momento",
    newCount: "{new} nuovi",
    projectWorkspace: "Spazio di lavoro del progetto",
    backToList: "Torna all'elenco dei messaggi",
    placeholderBody:
      "Apri la conversazione completa di questo progetto, inclusi cronologia, file e contesto del team.",
    openConversation: "Apri la conversazione del progetto",
    selectPrompt: "Seleziona un progetto per aprirne la conversazione.",
    yourProjects: "i tuoi progetti",
  },
  notifications: {
    projectUpdate: "Aggiornamento del progetto",
    studioSenderFallback: "HenryCo Studio",
    attachment: "(allegato)",
    regionLabel: "Notifiche del progetto",
    newBadge: "Nuovo",
    dismiss: "Ignora notifica",
  },
  systemMessage: {
    studioTeam: "il team Studio",
    theMilestone: "il traguardo",
    verbComplete: "contrassegnato come completato",
    verbStarted: "avviato",
    verbBlocked: "segnalato come bloccato",
    verbUpdated: "aggiornato",
    milestoneHeadline: "{title} {verb} da {team}",
    aFile: "un file",
    fileShared: "{team} ha condiviso {label}",
    theInvoice: "la fattura",
    paymentHeadline: "{label} {status}",
    anApproval: "un'approvazione",
    approvalRequested: "{team} ha richiesto {label}",
    projectUpdate: "Aggiornamento del progetto",
    update: "Aggiornamento",
  },
  thread: {
    backToList: "Torna all'elenco dei messaggi",
    reconnecting: "Riconnessione",
    searchConversation: "Cerca in questa conversazione",
    hideContext: "Nascondi il contesto del progetto",
    showContext: "Mostra il contesto del progetto",
    newMessage: "Nuovo messaggio",
    jumpToNewMessage: "Vai al nuovo messaggio",
    closeContext: "Chiudi il contesto del progetto",
    statusLive: "In diretta",
    statusConnecting: "Connessione…",
    statusReconnecting: "Riconnessione…",
    statusOffline: "Offline",
    currentMilestone: "Traguardo attuale",
  },
};

const ZH: DeepPartial<StudioMessagingCopy> = {
  contextPanel: {
    panelLabel: "项目背景",
    closeLabel: "关闭项目背景",
    currentMilestone: "当前里程碑",
    noMilestone: "尚无进行中的里程碑。",
    dueTbd: "截止日期待定",
    recentFiles: "最近的文件",
    noFiles: "尚未共享任何文件。当团队上传交付物时，文件会显示在此处。",
    viewAllFiles: "查看所有文件",
    timeline: "项目时间线",
    timelineEmpty: "随着里程碑的添加，时间线将显示在此处。",
    team: "Studio 团队",
    teamEmpty: "本项目的 Studio 团队将显示在此处。",
    activeLabel: "活跃",
  },
  emptyState: {
    headline: "您的项目对话从这里开始。",
    supporting:
      "关于 {projectName} 的一切——问题、更新、文件和决策——都集中在一个有序的地方。",
    welcomeWithTeam:
      "{projectName} 已在 Studio 中打开。您的 Studio 团队是 {teamLabel}。问题、更新、文件和决策都集中在这里一个有序的地方——随时提出任何问题。",
    welcomeNoTeam:
      "{projectName} 已在 Studio 中打开。问题、更新、文件和决策都集中在这里一个有序的地方——随时提出任何问题。",
    featureRealtime: "实时更新",
    featureFileSharing: "文件共享",
    featureTeamAccess: "直接联系团队",
    openingNote: "开场说明",
  },
  messageList: {
    conversationLabel: "项目对话",
  },
  reactions: {
    reactionLabel: "{label} 反应，{count}",
    pickerLabel: "添加反应",
    reactFallback: "反应",
  },
  replyPreview: {
    replyingTo: "回复 {senderName}",
    noContent: "（无内容）",
    cancelReply: "取消回复",
    jumpToOriginal: "跳转到 {senderName} 的原始消息",
  },
  centre: {
    heading: "消息",
    projectsSummary: "{projects} 个项目{plural} · {unread} 未读",
    attachment: "（附件）",
    noMessages: "尚无消息",
    newCount: "{new} 条新消息",
    projectWorkspace: "项目工作区",
    backToList: "返回消息列表",
    placeholderBody: "打开此项目的完整对话，包括历史记录、文件和团队背景。",
    openConversation: "打开项目对话",
    selectPrompt: "选择一个项目以打开其对话。",
    yourProjects: "您的项目",
  },
  notifications: {
    projectUpdate: "项目更新",
    studioSenderFallback: "HenryCo Studio",
    attachment: "（附件）",
    regionLabel: "项目通知",
    newBadge: "新",
    dismiss: "忽略通知",
  },
  systemMessage: {
    studioTeam: "Studio 团队",
    theMilestone: "该里程碑",
    verbComplete: "标记为完成",
    verbStarted: "已开始",
    verbBlocked: "标记为受阻",
    verbUpdated: "已更新",
    milestoneHeadline: "{team}将{title}{verb}",
    aFile: "一个文件",
    fileShared: "{team} 共享了 {label}",
    theInvoice: "该发票",
    paymentHeadline: "{label}{status}",
    anApproval: "一项审批",
    approvalRequested: "{team} 请求了 {label}",
    projectUpdate: "项目更新",
    update: "更新",
  },
  thread: {
    backToList: "返回消息列表",
    reconnecting: "正在重新连接",
    searchConversation: "搜索此对话",
    hideContext: "隐藏项目背景",
    showContext: "显示项目背景",
    newMessage: "新消息",
    jumpToNewMessage: "跳转到新消息",
    closeContext: "关闭项目背景",
    statusLive: "实时",
    statusConnecting: "正在连接…",
    statusReconnecting: "正在重新连接…",
    statusOffline: "离线",
    currentMilestone: "当前里程碑",
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<StudioMessagingCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
};
// ig, yo, ha, hi are intentionally OMITTED -> fall back to EN (human-translation only).

export function getStudioMessagingCopy(locale: AppLocale): StudioMessagingCopy {
  const o = LOCALE_MAP[locale];
  if (o)
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      o as unknown as Record<string, unknown>,
    ) as unknown as StudioMessagingCopy;
  return EN;
}
