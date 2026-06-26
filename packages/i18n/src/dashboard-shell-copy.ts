import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * Copy for the shared dashboard-shell + dashboard module widgets
 * (customer-overview account cards, wallet cards, and the shell chrome
 * primitives). One top-level key per file/component; nested keys per
 * string. EN is the exhaustive baseline; fr/es/pt/ar/de/it/zh are
 * authored. ig/yo/ha/hi intentionally fall back to EN.
 */
export type DashboardShellCopy = {
  activeSubscriptions: {
    label: string;
    allSynced: string;
    noActivePlans: string;
  };
  trustTier: {
    label: string;
    scoreWithDocuments: (score: number) => string;
    scoreUploadToAdvance: (score: number) => string;
  };
  walletBalance: {
    label: string;
    pendingVerification: string;
    liveSyncedNow: string;
  };
  welcomeBack: {
    kicker: string;
    greeting: (firstName: string) => string;
    greetingFallback: string;
    savedItemsWaiting: (count: number) => string;
    cartReady: string;
    pickUpWhereYouLeftOff: string;
    viewSaved: string;
    savedForLater: string;
    savedItemsCount: (count: number) => string;
    addItemsHere: string;
    recentlyViewed: string;
    keepBrowsing: string;
    resumeCart: string;
    resumeCartHint: string;
  };
  payoutMethods: {
    label: string;
    savedMethod: string;
    defaultLabel: string;
    manageSavedMethods: string;
    addPayoutMethod: string;
  };
  pendingFunding: {
    label: string;
    allClear: string;
    requestCount: (count: number) => string;
    awaitingVerification: string;
    noRequestsInReview: string;
  };
  actionButton: {
    locked: string;
  };
  advancedFilterBar: {
    ariaLabel: string;
    anyOption: string;
    searchPlaceholder: string;
    clearFilters: (count: number) => string;
  };
  bulkActionBar: {
    selectedCount: (count: number) => string;
    clearSelection: string;
    clear: string;
    applyToSelected: (action: string, count: number) => string;
    reasonLabel: string;
    reasonPlaceholder: string;
    reasonRequired: string;
    actionFailed: string;
    cancel: string;
    working: string;
    confirmCount: (count: number) => string;
  };
  identityBar: {
    viewerFallback: string;
    searchAria: string;
    searchLabel: string;
    switchLane: string;
    signOut: string;
    roleCustomer: string;
    roleStaff: string;
    roleOperator: string;
    roleOwner: string;
  };
  workspaceRail: {
    navAria: string;
  };
};

const EN: DashboardShellCopy = {
  activeSubscriptions: {
    label: "Active subscriptions",
    allSynced: "All synced",
    noActivePlans: "No active plans",
  },
  trustTier: {
    label: "Trust tier",
    scoreWithDocuments: (score: number) => `Score ${score} · documents on file`,
    scoreUploadToAdvance: (score: number) => `Score ${score} · upload to advance`,
  },
  walletBalance: {
    label: "Wallet balance",
    pendingVerification: "pending verification",
    liveSyncedNow: "Live · synced now",
  },
  welcomeBack: {
    kicker: "Pick up",
    greeting: (firstName: string) => `Welcome back, ${firstName}`,
    greetingFallback: "Welcome back",
    savedItemsWaiting: (count: number) =>
      `${count} saved item${count === 1 ? "" : "s"} waiting`,
    cartReady: "Your cart is ready to resume",
    pickUpWhereYouLeftOff: "Pick up where you left off",
    viewSaved: "View saved",
    savedForLater: "Saved for later",
    savedItemsCount: (count: number) => `${count} item${count === 1 ? "" : "s"}`,
    addItemsHere: "Add items here",
    recentlyViewed: "Recently viewed",
    keepBrowsing: "Keep browsing",
    resumeCart: "Resume cart",
    resumeCartHint: "Picks up where you left off",
  },
  payoutMethods: {
    label: "Payout methods",
    savedMethod: "Saved method",
    defaultLabel: "default",
    manageSavedMethods: "Manage saved methods",
    addPayoutMethod: "Add a payout method",
  },
  pendingFunding: {
    label: "Pending funding",
    allClear: "All clear",
    requestCount: (count: number) => `${count} request${count === 1 ? "" : "s"}`,
    awaitingVerification: "awaiting verification",
    noRequestsInReview: "No requests in review",
  },
  actionButton: {
    locked: "Locked",
  },
  advancedFilterBar: {
    ariaLabel: "Advanced filters",
    anyOption: "Any",
    searchPlaceholder: "Search…",
    clearFilters: (count: number) =>
      `Clear ${count} ${count === 1 ? "filter" : "filters"}`,
  },
  bulkActionBar: {
    selectedCount: (count: number) => `${count} selected`,
    clearSelection: "Clear selection",
    clear: "Clear",
    applyToSelected: (action: string, count: number) =>
      `Apply "${action}" to ${count} selected ${count === 1 ? "item" : "items"}.`,
    reasonLabel: "Reason (audit log)",
    reasonPlaceholder: "Brief justification — appears in audit_log.reason",
    reasonRequired: "Reason is required (3+ characters).",
    actionFailed: "Action failed. Try again.",
    cancel: "Cancel",
    working: "Working…",
    confirmCount: (count: number) => `Confirm ${count}`,
  },
  identityBar: {
    viewerFallback: "HenryCo viewer",
    searchAria: "Search HenryCo",
    searchLabel: "Search",
    switchLane: "Switch lane",
    signOut: "Sign out",
    roleCustomer: "Customer",
    roleStaff: "Staff",
    roleOperator: "Operator",
    roleOwner: "Owner",
  },
  workspaceRail: {
    navAria: "Workspace navigation",
  },
};

const FR: DeepPartial<DashboardShellCopy> = {
  activeSubscriptions: {
    label: "Abonnements actifs",
    allSynced: "Tout est synchronisé",
    noActivePlans: "Aucun forfait actif",
  },
  trustTier: {
    label: "Niveau de confiance",
    scoreWithDocuments: (score: number) => `Score ${score} · documents au dossier`,
    scoreUploadToAdvance: (score: number) => `Score ${score} · importez pour progresser`,
  },
  walletBalance: {
    label: "Solde du portefeuille",
    pendingVerification: "vérification en attente",
    liveSyncedNow: "En direct · synchronisé à l'instant",
  },
  welcomeBack: {
    kicker: "Reprenez",
    greeting: (firstName: string) => `Bon retour, ${firstName}`,
    greetingFallback: "Bon retour",
    savedItemsWaiting: (count: number) =>
      `${count} article${count === 1 ? "" : "s"} enregistré${count === 1 ? "" : "s"} en attente`,
    cartReady: "Votre panier est prêt à être repris",
    pickUpWhereYouLeftOff: "Reprenez là où vous vous êtes arrêté",
    viewSaved: "Voir les enregistrements",
    savedForLater: "Enregistré pour plus tard",
    savedItemsCount: (count: number) => `${count} article${count === 1 ? "" : "s"}`,
    addItemsHere: "Ajoutez des articles ici",
    recentlyViewed: "Vus récemment",
    keepBrowsing: "Continuez à parcourir",
    resumeCart: "Reprendre le panier",
    resumeCartHint: "Reprend là où vous vous êtes arrêté",
  },
  payoutMethods: {
    label: "Modes de versement",
    savedMethod: "Mode enregistré",
    defaultLabel: "par défaut",
    manageSavedMethods: "Gérer les modes enregistrés",
    addPayoutMethod: "Ajouter un mode de versement",
  },
  pendingFunding: {
    label: "Approvisionnement en attente",
    allClear: "Tout est réglé",
    requestCount: (count: number) => `${count} demande${count === 1 ? "" : "s"}`,
    awaitingVerification: "en attente de vérification",
    noRequestsInReview: "Aucune demande en cours",
  },
  actionButton: {
    locked: "Verrouillé",
  },
  advancedFilterBar: {
    ariaLabel: "Filtres avancés",
    anyOption: "Tous",
    searchPlaceholder: "Rechercher…",
    clearFilters: (count: number) =>
      `Effacer ${count} filtre${count === 1 ? "" : "s"}`,
  },
  bulkActionBar: {
    selectedCount: (count: number) => `${count} sélectionné${count === 1 ? "" : "s"}`,
    clearSelection: "Effacer la sélection",
    clear: "Effacer",
    applyToSelected: (action: string, count: number) =>
      `Appliquer « ${action} » à ${count} élément${count === 1 ? "" : "s"} sélectionné${count === 1 ? "" : "s"}.`,
    reasonLabel: "Motif (journal d'audit)",
    reasonPlaceholder: "Brève justification — apparaît dans audit_log.reason",
    reasonRequired: "Un motif est requis (au moins 3 caractères).",
    actionFailed: "L'action a échoué. Réessayez.",
    cancel: "Annuler",
    working: "En cours…",
    confirmCount: (count: number) => `Confirmer ${count}`,
  },
  identityBar: {
    viewerFallback: "Utilisateur HenryCo",
    searchAria: "Rechercher sur HenryCo",
    searchLabel: "Rechercher",
    switchLane: "Changer de voie",
    signOut: "Se déconnecter",
    roleCustomer: "Client",
    roleStaff: "Personnel",
    roleOperator: "Opérateur",
    roleOwner: "Propriétaire",
  },
  workspaceRail: {
    navAria: "Navigation de l'espace de travail",
  },
};

const ES: DeepPartial<DashboardShellCopy> = {
  activeSubscriptions: {
    label: "Suscripciones activas",
    allSynced: "Todo sincronizado",
    noActivePlans: "Sin planes activos",
  },
  trustTier: {
    label: "Nivel de confianza",
    scoreWithDocuments: (score: number) => `Puntuación ${score} · documentos en archivo`,
    scoreUploadToAdvance: (score: number) => `Puntuación ${score} · sube para avanzar`,
  },
  walletBalance: {
    label: "Saldo de la billetera",
    pendingVerification: "verificación pendiente",
    liveSyncedNow: "En vivo · sincronizado ahora",
  },
  welcomeBack: {
    kicker: "Retomar",
    greeting: (firstName: string) => `Bienvenido de nuevo, ${firstName}`,
    greetingFallback: "Bienvenido de nuevo",
    savedItemsWaiting: (count: number) =>
      `${count} artículo${count === 1 ? "" : "s"} guardado${count === 1 ? "" : "s"} esperando`,
    cartReady: "Tu carrito está listo para retomar",
    pickUpWhereYouLeftOff: "Retoma donde lo dejaste",
    viewSaved: "Ver guardados",
    savedForLater: "Guardado para después",
    savedItemsCount: (count: number) => `${count} artículo${count === 1 ? "" : "s"}`,
    addItemsHere: "Agrega artículos aquí",
    recentlyViewed: "Vistos recientemente",
    keepBrowsing: "Sigue explorando",
    resumeCart: "Retomar el carrito",
    resumeCartHint: "Retoma donde lo dejaste",
  },
  payoutMethods: {
    label: "Métodos de pago",
    savedMethod: "Método guardado",
    defaultLabel: "predeterminado",
    manageSavedMethods: "Gestionar métodos guardados",
    addPayoutMethod: "Agregar un método de pago",
  },
  pendingFunding: {
    label: "Financiación pendiente",
    allClear: "Todo en orden",
    requestCount: (count: number) => `${count} solicitud${count === 1 ? "" : "es"}`,
    awaitingVerification: "esperando verificación",
    noRequestsInReview: "Sin solicitudes en revisión",
  },
  actionButton: {
    locked: "Bloqueado",
  },
  advancedFilterBar: {
    ariaLabel: "Filtros avanzados",
    anyOption: "Cualquiera",
    searchPlaceholder: "Buscar…",
    clearFilters: (count: number) =>
      `Borrar ${count} filtro${count === 1 ? "" : "s"}`,
  },
  bulkActionBar: {
    selectedCount: (count: number) => `${count} seleccionado${count === 1 ? "" : "s"}`,
    clearSelection: "Borrar selección",
    clear: "Borrar",
    applyToSelected: (action: string, count: number) =>
      `Aplicar «${action}» a ${count} elemento${count === 1 ? "" : "s"} seleccionado${count === 1 ? "" : "s"}.`,
    reasonLabel: "Motivo (registro de auditoría)",
    reasonPlaceholder: "Breve justificación — aparece en audit_log.reason",
    reasonRequired: "Se requiere un motivo (3+ caracteres).",
    actionFailed: "La acción falló. Inténtalo de nuevo.",
    cancel: "Cancelar",
    working: "Procesando…",
    confirmCount: (count: number) => `Confirmar ${count}`,
  },
  identityBar: {
    viewerFallback: "Usuario de HenryCo",
    searchAria: "Buscar en HenryCo",
    searchLabel: "Buscar",
    switchLane: "Cambiar de canal",
    signOut: "Cerrar sesión",
    roleCustomer: "Cliente",
    roleStaff: "Personal",
    roleOperator: "Operador",
    roleOwner: "Propietario",
  },
  workspaceRail: {
    navAria: "Navegación del espacio de trabajo",
  },
};

const PT: DeepPartial<DashboardShellCopy> = {
  activeSubscriptions: {
    label: "Assinaturas ativas",
    allSynced: "Tudo sincronizado",
    noActivePlans: "Nenhum plano ativo",
  },
  trustTier: {
    label: "Nível de confiança",
    scoreWithDocuments: (score: number) => `Pontuação ${score} · documentos em arquivo`,
    scoreUploadToAdvance: (score: number) => `Pontuação ${score} · envie para avançar`,
  },
  walletBalance: {
    label: "Saldo da carteira",
    pendingVerification: "verificação pendente",
    liveSyncedNow: "Ao vivo · sincronizado agora",
  },
  welcomeBack: {
    kicker: "Retomar",
    greeting: (firstName: string) => `Bem-vindo de volta, ${firstName}`,
    greetingFallback: "Bem-vindo de volta",
    savedItemsWaiting: (count: number) =>
      `${count} item${count === 1 ? "" : "ns"} salvo${count === 1 ? "" : "s"} aguardando`,
    cartReady: "Seu carrinho está pronto para retomar",
    pickUpWhereYouLeftOff: "Continue de onde parou",
    viewSaved: "Ver salvos",
    savedForLater: "Salvo para depois",
    savedItemsCount: (count: number) => `${count} item${count === 1 ? "" : "ns"}`,
    addItemsHere: "Adicione itens aqui",
    recentlyViewed: "Vistos recentemente",
    keepBrowsing: "Continue navegando",
    resumeCart: "Retomar carrinho",
    resumeCartHint: "Continua de onde você parou",
  },
  payoutMethods: {
    label: "Métodos de pagamento",
    savedMethod: "Método salvo",
    defaultLabel: "padrão",
    manageSavedMethods: "Gerenciar métodos salvos",
    addPayoutMethod: "Adicionar um método de pagamento",
  },
  pendingFunding: {
    label: "Financiamento pendente",
    allClear: "Tudo em ordem",
    requestCount: (count: number) => `${count} solicitação${count === 1 ? "" : "ões"}`,
    awaitingVerification: "aguardando verificação",
    noRequestsInReview: "Nenhuma solicitação em análise",
  },
  actionButton: {
    locked: "Bloqueado",
  },
  advancedFilterBar: {
    ariaLabel: "Filtros avançados",
    anyOption: "Qualquer",
    searchPlaceholder: "Pesquisar…",
    clearFilters: (count: number) =>
      `Limpar ${count} filtro${count === 1 ? "" : "s"}`,
  },
  bulkActionBar: {
    selectedCount: (count: number) => `${count} selecionado${count === 1 ? "" : "s"}`,
    clearSelection: "Limpar seleção",
    clear: "Limpar",
    applyToSelected: (action: string, count: number) =>
      `Aplicar "${action}" a ${count} item${count === 1 ? "" : "ns"} selecionado${count === 1 ? "" : "s"}.`,
    reasonLabel: "Motivo (registro de auditoria)",
    reasonPlaceholder: "Breve justificativa — aparece em audit_log.reason",
    reasonRequired: "Um motivo é obrigatório (3+ caracteres).",
    actionFailed: "A ação falhou. Tente novamente.",
    cancel: "Cancelar",
    working: "Processando…",
    confirmCount: (count: number) => `Confirmar ${count}`,
  },
  identityBar: {
    viewerFallback: "Usuário HenryCo",
    searchAria: "Pesquisar na HenryCo",
    searchLabel: "Pesquisar",
    switchLane: "Trocar de faixa",
    signOut: "Sair",
    roleCustomer: "Cliente",
    roleStaff: "Equipe",
    roleOperator: "Operador",
    roleOwner: "Proprietário",
  },
  workspaceRail: {
    navAria: "Navegação do espaço de trabalho",
  },
};

const AR: DeepPartial<DashboardShellCopy> = {
  activeSubscriptions: {
    label: "الاشتراكات النشطة",
    allSynced: "كل شيء متزامن",
    noActivePlans: "لا توجد خطط نشطة",
  },
  trustTier: {
    label: "مستوى الثقة",
    scoreWithDocuments: (score: number) => `النتيجة ${score} · المستندات في الملف`,
    scoreUploadToAdvance: (score: number) => `النتيجة ${score} · حمّل للتقدم`,
  },
  walletBalance: {
    label: "رصيد المحفظة",
    pendingVerification: "في انتظار التحقق",
    liveSyncedNow: "مباشر · تمت المزامنة الآن",
  },
  welcomeBack: {
    kicker: "تابع",
    greeting: (firstName: string) => `مرحبًا بعودتك، ${firstName}`,
    greetingFallback: "مرحبًا بعودتك",
    savedItemsWaiting: (count: number) => `${count} عنصر محفوظ في الانتظار`,
    cartReady: "سلتك جاهزة للاستئناف",
    pickUpWhereYouLeftOff: "تابع من حيث توقفت",
    viewSaved: "عرض المحفوظات",
    savedForLater: "محفوظ لوقت لاحق",
    savedItemsCount: (count: number) => `${count} عنصر`,
    addItemsHere: "أضف عناصر هنا",
    recentlyViewed: "شوهد مؤخرًا",
    keepBrowsing: "تابع التصفح",
    resumeCart: "استئناف السلة",
    resumeCartHint: "يتابع من حيث توقفت",
  },
  payoutMethods: {
    label: "طرق الدفع",
    savedMethod: "طريقة محفوظة",
    defaultLabel: "افتراضي",
    manageSavedMethods: "إدارة الطرق المحفوظة",
    addPayoutMethod: "إضافة طريقة دفع",
  },
  pendingFunding: {
    label: "التمويل المعلق",
    allClear: "كل شيء على ما يرام",
    requestCount: (count: number) => `${count} طلب`,
    awaitingVerification: "في انتظار التحقق",
    noRequestsInReview: "لا توجد طلبات قيد المراجعة",
  },
  actionButton: {
    locked: "مقفل",
  },
  advancedFilterBar: {
    ariaLabel: "عوامل تصفية متقدمة",
    anyOption: "الكل",
    searchPlaceholder: "بحث…",
    clearFilters: (count: number) => `مسح ${count} عامل تصفية`,
  },
  bulkActionBar: {
    selectedCount: (count: number) => `${count} محدد`,
    clearSelection: "مسح التحديد",
    clear: "مسح",
    applyToSelected: (action: string, count: number) =>
      `تطبيق "${action}" على ${count} عنصر محدد.`,
    reasonLabel: "السبب (سجل التدقيق)",
    reasonPlaceholder: "مبرر موجز — يظهر في audit_log.reason",
    reasonRequired: "السبب مطلوب (3 أحرف على الأقل).",
    actionFailed: "فشل الإجراء. حاول مرة أخرى.",
    cancel: "إلغاء",
    working: "جارٍ التنفيذ…",
    confirmCount: (count: number) => `تأكيد ${count}`,
  },
  identityBar: {
    viewerFallback: "مستخدم HenryCo",
    searchAria: "البحث في HenryCo",
    searchLabel: "بحث",
    switchLane: "تبديل المسار",
    signOut: "تسجيل الخروج",
    roleCustomer: "عميل",
    roleStaff: "موظف",
    roleOperator: "مشغّل",
    roleOwner: "المالك",
  },
  workspaceRail: {
    navAria: "التنقل في مساحة العمل",
  },
};

const DE: DeepPartial<DashboardShellCopy> = {
  activeSubscriptions: {
    label: "Aktive Abonnements",
    allSynced: "Alles synchronisiert",
    noActivePlans: "Keine aktiven Tarife",
  },
  trustTier: {
    label: "Vertrauensstufe",
    scoreWithDocuments: (score: number) => `Punktzahl ${score} · Dokumente hinterlegt`,
    scoreUploadToAdvance: (score: number) => `Punktzahl ${score} · hochladen zum Aufsteigen`,
  },
  walletBalance: {
    label: "Wallet-Guthaben",
    pendingVerification: "Überprüfung ausstehend",
    liveSyncedNow: "Live · gerade synchronisiert",
  },
  welcomeBack: {
    kicker: "Weiter",
    greeting: (firstName: string) => `Willkommen zurück, ${firstName}`,
    greetingFallback: "Willkommen zurück",
    savedItemsWaiting: (count: number) =>
      `${count} gespeicherte${count === 1 ? "r" : ""} Artikel${count === 1 ? "" : ""} wartet${count === 1 ? "" : "en"}`,
    cartReady: "Ihr Warenkorb ist bereit zum Fortsetzen",
    pickUpWhereYouLeftOff: "Machen Sie dort weiter, wo Sie aufgehört haben",
    viewSaved: "Gespeicherte ansehen",
    savedForLater: "Für später gespeichert",
    savedItemsCount: (count: number) => `${count} Artikel`,
    addItemsHere: "Artikel hier hinzufügen",
    recentlyViewed: "Kürzlich angesehen",
    keepBrowsing: "Weiter stöbern",
    resumeCart: "Warenkorb fortsetzen",
    resumeCartHint: "Macht dort weiter, wo Sie aufgehört haben",
  },
  payoutMethods: {
    label: "Auszahlungsmethoden",
    savedMethod: "Gespeicherte Methode",
    defaultLabel: "Standard",
    manageSavedMethods: "Gespeicherte Methoden verwalten",
    addPayoutMethod: "Auszahlungsmethode hinzufügen",
  },
  pendingFunding: {
    label: "Ausstehende Einzahlung",
    allClear: "Alles erledigt",
    requestCount: (count: number) => `${count} Anfrage${count === 1 ? "" : "n"}`,
    awaitingVerification: "wartet auf Überprüfung",
    noRequestsInReview: "Keine Anfragen in Bearbeitung",
  },
  actionButton: {
    locked: "Gesperrt",
  },
  advancedFilterBar: {
    ariaLabel: "Erweiterte Filter",
    anyOption: "Alle",
    searchPlaceholder: "Suchen…",
    clearFilters: (count: number) =>
      `${count} Filter löschen`,
  },
  bulkActionBar: {
    selectedCount: (count: number) => `${count} ausgewählt`,
    clearSelection: "Auswahl aufheben",
    clear: "Löschen",
    applyToSelected: (action: string, count: number) =>
      `„${action}" auf ${count} ausgewählte${count === 1 ? "s" : ""} Element${count === 1 ? "" : "e"} anwenden.`,
    reasonLabel: "Grund (Audit-Protokoll)",
    reasonPlaceholder: "Kurze Begründung — erscheint in audit_log.reason",
    reasonRequired: "Ein Grund ist erforderlich (mindestens 3 Zeichen).",
    actionFailed: "Aktion fehlgeschlagen. Bitte erneut versuchen.",
    cancel: "Abbrechen",
    working: "Wird ausgeführt…",
    confirmCount: (count: number) => `${count} bestätigen`,
  },
  identityBar: {
    viewerFallback: "HenryCo-Nutzer",
    searchAria: "HenryCo durchsuchen",
    searchLabel: "Suchen",
    switchLane: "Bereich wechseln",
    signOut: "Abmelden",
    roleCustomer: "Kunde",
    roleStaff: "Mitarbeiter",
    roleOperator: "Betreiber",
    roleOwner: "Inhaber",
  },
  workspaceRail: {
    navAria: "Arbeitsbereich-Navigation",
  },
};

const IT: DeepPartial<DashboardShellCopy> = {
  activeSubscriptions: {
    label: "Abbonamenti attivi",
    allSynced: "Tutto sincronizzato",
    noActivePlans: "Nessun piano attivo",
  },
  trustTier: {
    label: "Livello di fiducia",
    scoreWithDocuments: (score: number) => `Punteggio ${score} · documenti in archivio`,
    scoreUploadToAdvance: (score: number) => `Punteggio ${score} · carica per avanzare`,
  },
  walletBalance: {
    label: "Saldo del portafoglio",
    pendingVerification: "verifica in sospeso",
    liveSyncedNow: "In diretta · sincronizzato ora",
  },
  welcomeBack: {
    kicker: "Riprendi",
    greeting: (firstName: string) => `Bentornato, ${firstName}`,
    greetingFallback: "Bentornato",
    savedItemsWaiting: (count: number) =>
      `${count} articolo${count === 1 ? "" : "i"} salvato${count === 1 ? "" : "i"} in attesa`,
    cartReady: "Il tuo carrello è pronto per essere ripreso",
    pickUpWhereYouLeftOff: "Riprendi da dove avevi lasciato",
    viewSaved: "Vedi salvati",
    savedForLater: "Salvato per dopo",
    savedItemsCount: (count: number) => `${count} articolo${count === 1 ? "" : "i"}`,
    addItemsHere: "Aggiungi articoli qui",
    recentlyViewed: "Visti di recente",
    keepBrowsing: "Continua a esplorare",
    resumeCart: "Riprendi il carrello",
    resumeCartHint: "Riprende da dove avevi lasciato",
  },
  payoutMethods: {
    label: "Metodi di pagamento",
    savedMethod: "Metodo salvato",
    defaultLabel: "predefinito",
    manageSavedMethods: "Gestisci i metodi salvati",
    addPayoutMethod: "Aggiungi un metodo di pagamento",
  },
  pendingFunding: {
    label: "Finanziamento in sospeso",
    allClear: "Tutto a posto",
    requestCount: (count: number) => `${count} richiesta${count === 1 ? "" : "e"}`,
    awaitingVerification: "in attesa di verifica",
    noRequestsInReview: "Nessuna richiesta in revisione",
  },
  actionButton: {
    locked: "Bloccato",
  },
  advancedFilterBar: {
    ariaLabel: "Filtri avanzati",
    anyOption: "Qualsiasi",
    searchPlaceholder: "Cerca…",
    clearFilters: (count: number) =>
      `Cancella ${count} filtro${count === 1 ? "" : "i"}`,
  },
  bulkActionBar: {
    selectedCount: (count: number) => `${count} selezionato${count === 1 ? "" : "i"}`,
    clearSelection: "Cancella selezione",
    clear: "Cancella",
    applyToSelected: (action: string, count: number) =>
      `Applica "${action}" a ${count} elemento${count === 1 ? "" : "i"} selezionato${count === 1 ? "" : "i"}.`,
    reasonLabel: "Motivo (registro di controllo)",
    reasonPlaceholder: "Breve motivazione — appare in audit_log.reason",
    reasonRequired: "È richiesto un motivo (almeno 3 caratteri).",
    actionFailed: "Azione non riuscita. Riprova.",
    cancel: "Annulla",
    working: "In corso…",
    confirmCount: (count: number) => `Conferma ${count}`,
  },
  identityBar: {
    viewerFallback: "Utente HenryCo",
    searchAria: "Cerca in HenryCo",
    searchLabel: "Cerca",
    switchLane: "Cambia corsia",
    signOut: "Esci",
    roleCustomer: "Cliente",
    roleStaff: "Personale",
    roleOperator: "Operatore",
    roleOwner: "Proprietario",
  },
  workspaceRail: {
    navAria: "Navigazione dell'area di lavoro",
  },
};

const ZH: DeepPartial<DashboardShellCopy> = {
  activeSubscriptions: {
    label: "活跃订阅",
    allSynced: "全部已同步",
    noActivePlans: "没有活跃套餐",
  },
  trustTier: {
    label: "信任等级",
    scoreWithDocuments: (score: number) => `评分 ${score} · 文件已存档`,
    scoreUploadToAdvance: (score: number) => `评分 ${score} · 上传以提升`,
  },
  walletBalance: {
    label: "钱包余额",
    pendingVerification: "待验证",
    liveSyncedNow: "实时 · 刚刚同步",
  },
  welcomeBack: {
    kicker: "继续",
    greeting: (firstName: string) => `欢迎回来，${firstName}`,
    greetingFallback: "欢迎回来",
    savedItemsWaiting: (count: number) => `${count} 件已保存的商品在等待`,
    cartReady: "您的购物车已可继续",
    pickUpWhereYouLeftOff: "从上次离开的地方继续",
    viewSaved: "查看已保存",
    savedForLater: "稍后保存",
    savedItemsCount: (count: number) => `${count} 件商品`,
    addItemsHere: "在此添加商品",
    recentlyViewed: "最近浏览",
    keepBrowsing: "继续浏览",
    resumeCart: "继续购物车",
    resumeCartHint: "从您上次离开的地方继续",
  },
  payoutMethods: {
    label: "付款方式",
    savedMethod: "已保存的方式",
    defaultLabel: "默认",
    manageSavedMethods: "管理已保存的方式",
    addPayoutMethod: "添加付款方式",
  },
  pendingFunding: {
    label: "待处理充值",
    allClear: "全部完成",
    requestCount: (count: number) => `${count} 个请求`,
    awaitingVerification: "等待验证",
    noRequestsInReview: "没有正在审核的请求",
  },
  actionButton: {
    locked: "已锁定",
  },
  advancedFilterBar: {
    ariaLabel: "高级筛选",
    anyOption: "任意",
    searchPlaceholder: "搜索…",
    clearFilters: (count: number) => `清除 ${count} 个筛选条件`,
  },
  bulkActionBar: {
    selectedCount: (count: number) => `已选择 ${count} 项`,
    clearSelection: "清除选择",
    clear: "清除",
    applyToSelected: (action: string, count: number) =>
      `将"${action}"应用于 ${count} 个选定项。`,
    reasonLabel: "原因（审计日志）",
    reasonPlaceholder: "简要说明 — 显示在 audit_log.reason 中",
    reasonRequired: "需要填写原因（至少 3 个字符）。",
    actionFailed: "操作失败。请重试。",
    cancel: "取消",
    working: "处理中…",
    confirmCount: (count: number) => `确认 ${count}`,
  },
  identityBar: {
    viewerFallback: "HenryCo 用户",
    searchAria: "搜索 HenryCo",
    searchLabel: "搜索",
    switchLane: "切换通道",
    signOut: "退出登录",
    roleCustomer: "客户",
    roleStaff: "员工",
    roleOperator: "运营者",
    roleOwner: "所有者",
  },
  workspaceRail: {
    navAria: "工作区导航",
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<DashboardShellCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
};
// ig, yo, ha, hi are intentionally OMITTED -> fall back to EN (human-translation only).

export function getDashboardShellCopy(locale: AppLocale): DashboardShellCopy {
  const o = LOCALE_MAP[locale];
  if (o)
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      o as unknown as Record<string, unknown>,
    ) as unknown as DashboardShellCopy;
  return EN;
}
