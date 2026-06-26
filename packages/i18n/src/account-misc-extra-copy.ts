import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

export type AccountMiscExtraCopy = {
  layout: {
    loadingTitle: string;
    loadingDescription: string;
  };
  search: {
    metadataTitle: string;
    metadataDescription: string;
    title: string;
    description: string;
    placeholder: string;
  };
  og: {
    tagline: string;
    title: string;
    description: string;
  };
  resetPassword: {
    metadataTitle: string;
    heading: string;
    subtitle: string;
  };
  downloadButton: {
    defaultLabel: string;
    preparing: string;
    error: string;
  };
  divisionModule: {
    goTo: (label: string) => string;
    recentActivity: string;
    allActivity: string;
    noActivity: (label: string) => string;
    notifications: string;
    all: string;
    noNotifications: (label: string) => string;
    invoices: (label: string) => string;
    allInvoices: string;
    invoiceFallback: (invoiceNo: string) => string;
    support: (label: string) => string;
    allSupport: string;
  };
  welcomeBack: {
    kicker: string;
    headingNamed: (firstName: string) => string;
    heading: string;
    subtitle: string;
    savedItemsLink: string;
    resumeBasket: string;
    basketWaiting: (division: string, count: number) => string;
    subtotal: (amount: string) => string;
    continueCheckout: string;
    savedExpiringSoon: string;
    today: string;
    daysShort: (days: number) => string;
    openSavedItems: string;
    recentlyViewed: string;
  };
  studioWallet: {
    chargingLabel: string;
    charging: string;
    payFromWallet: string;
    failed: string;
    submitted: string;
    failedRetry: string;
  };
  documentSubmissions: {
    queueError: string;
    addedToQueue: (fileName: string) => string;
    serviceError: string;
    docTitles: {
      governmentId: string;
      selfie: string;
      addressProof: string;
      businessCert: string;
    };
    docDescriptions: {
      governmentId: string;
      selfie: string;
      addressProof: string;
      businessCert: string;
    };
    submitted: (when: string) => string;
    requiredForReview: string;
    optionalReinforcement: string;
    reviewed: (when: string) => string;
    uploading: string;
    replaceFile: string;
    uploadFile: string;
  };
  reviewerNote: {
    label: string;
  };
};

const EN: AccountMiscExtraCopy = {
  layout: {
    loadingTitle: "Opening your account",
    loadingDescription: "Confirming your session and loading navigation.",
  },
  search: {
    metadataTitle: "Search Account",
    metadataDescription: "Search HenryCo account workflows and connected division routes.",
    title: "Search your HenryCo workflows.",
    description:
      "Jump directly to exact account actions and connected division routes without falling back to generic dashboards.",
    placeholder: "Search account: notifications, wallet, invoices, support, jobs applications...",
  },
  og: {
    tagline: "Single sign-on across every Henry & Co. division",
    title: "HenryCo Account",
    description: "One identity, one secure session, every HenryCo service in one place.",
  },
  resetPassword: {
    metadataTitle: "Set New Password — Henry & Co.",
    heading: "Set new password",
    subtitle: "Choose a new password for your account",
  },
  downloadButton: {
    defaultLabel: "Download",
    preparing: "Preparing…",
    error: "We couldn't prepare that document. Please try again.",
  },
  divisionModule: {
    goTo: (label: string) => `Go to ${label}`,
    recentActivity: "Recent Activity",
    allActivity: "All activity",
    noActivity: (label: string) => `No ${label} activity yet`,
    notifications: "Notifications",
    all: "All",
    noNotifications: (label: string) => `No notifications from ${label}`,
    invoices: (label: string) => `${label} Invoices`,
    allInvoices: "All invoices",
    invoiceFallback: (invoiceNo: string) => `Invoice ${invoiceNo}`,
    support: (label: string) => `${label} Support`,
    allSupport: "All support",
  },
  welcomeBack: {
    kicker: "For you",
    headingNamed: (firstName: string) => `Pick up where you left off, ${firstName}.`,
    heading: "Pick up where you left off.",
    subtitle:
      "Saved items, recent finds, and an unfinished basket — all kept for you across every device.",
    savedItemsLink: "Saved items",
    resumeBasket: "Resume basket",
    basketWaiting: (division: string, count: number) =>
      `${division} — ${count} item${count === 1 ? "" : "s"} waiting`,
    subtotal: (amount: string) => `Subtotal ${amount}`,
    continueCheckout: "Continue checkout →",
    savedExpiringSoon: "Saved · expiring soon",
    today: "today",
    daysShort: (days: number) => `${days}d`,
    openSavedItems: "Open saved items →",
    recentlyViewed: "Recently viewed",
  },
  studioWallet: {
    chargingLabel: "Charging wallet",
    charging: "Charging wallet…",
    payFromWallet: "Pay from wallet balance",
    failed: "Wallet checkout failed.",
    submitted: "Wallet debit submitted. Finance review is now in progress.",
    failedRetry: "Wallet checkout failed. Please retry.",
  },
  documentSubmissions: {
    queueError:
      "We couldn't add that file to the review queue. Try again in a moment, or contact support if it keeps happening.",
    addedToQueue: (fileName: string) => `${fileName} added to the review queue.`,
    serviceError:
      "We couldn't reach the verification service. Check your connection and try again.",
    docTitles: {
      governmentId: "Government-issued ID",
      selfie: "Selfie with ID",
      addressProof: "Proof of address",
      businessCert: "Business registration",
    },
    docDescriptions: {
      governmentId:
        "National ID, passport, or driver's licence — the page with your full name + photo + document number visible.",
      selfie:
        "A selfie holding the same ID. Lets reviewers confirm liveness and document ownership in one shot.",
      addressProof:
        "Utility bill, bank statement, or official letter from the last three months that matches your saved address.",
      businessCert:
        "CAC certificate, business registration, or equivalent operating proof — used for seller and employer review lanes.",
    },
    submitted: (when: string) => `Submitted ${when}`,
    requiredForReview: "Required for review.",
    optionalReinforcement: "Optional reinforcement.",
    reviewed: (when: string) => `Reviewed ${when}`,
    uploading: "Uploading without leaving the page",
    replaceFile: "Replace file",
    uploadFile: "Upload file",
  },
  reviewerNote: {
    label: "Reviewer note",
  },
};

const FR: DeepPartial<AccountMiscExtraCopy> = {
  layout: {
    loadingTitle: "Ouverture de votre compte",
    loadingDescription: "Confirmation de votre session et chargement de la navigation.",
  },
  search: {
    metadataTitle: "Rechercher dans le compte",
    metadataDescription:
      "Recherchez les parcours de compte HenryCo et les routes de division connectées.",
    title: "Recherchez dans vos parcours HenryCo.",
    description:
      "Accédez directement aux actions de compte précises et aux routes de division connectées sans repasser par des tableaux de bord génériques.",
    placeholder:
      "Rechercher dans le compte : notifications, portefeuille, factures, assistance, candidatures...",
  },
  og: {
    tagline: "Authentification unique sur chaque division Henry & Co.",
    title: "Compte HenryCo",
    description: "Une seule identité, une seule session sécurisée, tous les services HenryCo réunis.",
  },
  resetPassword: {
    metadataTitle: "Définir un nouveau mot de passe — Henry & Co.",
    heading: "Définir un nouveau mot de passe",
    subtitle: "Choisissez un nouveau mot de passe pour votre compte",
  },
  downloadButton: {
    defaultLabel: "Télécharger",
    preparing: "Préparation…",
    error: "Nous n'avons pas pu préparer ce document. Veuillez réessayer.",
  },
  divisionModule: {
    goTo: (label: string) => `Accéder à ${label}`,
    recentActivity: "Activité récente",
    allActivity: "Toute l'activité",
    noActivity: (label: string) => `Aucune activité ${label} pour l'instant`,
    notifications: "Notifications",
    all: "Tout",
    noNotifications: (label: string) => `Aucune notification de ${label}`,
    invoices: (label: string) => `Factures ${label}`,
    allInvoices: "Toutes les factures",
    invoiceFallback: (invoiceNo: string) => `Facture ${invoiceNo}`,
    support: (label: string) => `Assistance ${label}`,
    allSupport: "Toute l'assistance",
  },
  welcomeBack: {
    kicker: "Pour vous",
    headingNamed: (firstName: string) => `Reprenez où vous en étiez, ${firstName}.`,
    heading: "Reprenez où vous en étiez.",
    subtitle:
      "Articles enregistrés, découvertes récentes et un panier inachevé — tout est conservé pour vous sur chaque appareil.",
    savedItemsLink: "Articles enregistrés",
    resumeBasket: "Reprendre le panier",
    basketWaiting: (division: string, count: number) =>
      `${division} — ${count} article${count === 1 ? "" : "s"} en attente`,
    subtotal: (amount: string) => `Sous-total ${amount}`,
    continueCheckout: "Continuer le paiement →",
    savedExpiringSoon: "Enregistrés · bientôt expirés",
    today: "aujourd'hui",
    daysShort: (days: number) => `${days} j`,
    openSavedItems: "Ouvrir les articles enregistrés →",
    recentlyViewed: "Consultés récemment",
  },
  studioWallet: {
    chargingLabel: "Débit du portefeuille",
    charging: "Débit du portefeuille…",
    payFromWallet: "Payer avec le solde du portefeuille",
    failed: "Le paiement par portefeuille a échoué.",
    submitted: "Débit du portefeuille soumis. L'examen financier est en cours.",
    failedRetry: "Le paiement par portefeuille a échoué. Veuillez réessayer.",
  },
  documentSubmissions: {
    queueError:
      "Nous n'avons pas pu ajouter ce fichier à la file de vérification. Réessayez dans un instant ou contactez l'assistance si le problème persiste.",
    addedToQueue: (fileName: string) => `${fileName} ajouté à la file de vérification.`,
    serviceError:
      "Nous n'avons pas pu joindre le service de vérification. Vérifiez votre connexion et réessayez.",
    docTitles: {
      governmentId: "Pièce d'identité officielle",
      selfie: "Selfie avec la pièce d'identité",
      addressProof: "Justificatif de domicile",
      businessCert: "Immatriculation de l'entreprise",
    },
    docDescriptions: {
      governmentId:
        "Carte nationale, passeport ou permis de conduire — la page où votre nom complet, votre photo et le numéro du document sont visibles.",
      selfie:
        "Un selfie tenant la même pièce d'identité. Permet aux examinateurs de confirmer en une seule prise la présence réelle et la propriété du document.",
      addressProof:
        "Facture de service, relevé bancaire ou courrier officiel des trois derniers mois correspondant à votre adresse enregistrée.",
      businessCert:
        "Certificat CAC, immatriculation d'entreprise ou preuve d'activité équivalente — utilisé pour les parcours d'examen vendeur et employeur.",
    },
    submitted: (when: string) => `Soumis ${when}`,
    requiredForReview: "Requis pour l'examen.",
    optionalReinforcement: "Renfort facultatif.",
    reviewed: (when: string) => `Examiné ${when}`,
    uploading: "Téléversement sans quitter la page",
    replaceFile: "Remplacer le fichier",
    uploadFile: "Téléverser un fichier",
  },
  reviewerNote: {
    label: "Note de l'examinateur",
  },
};

const ES: DeepPartial<AccountMiscExtraCopy> = {
  layout: {
    loadingTitle: "Abriendo tu cuenta",
    loadingDescription: "Confirmando tu sesión y cargando la navegación.",
  },
  search: {
    metadataTitle: "Buscar en la cuenta",
    metadataDescription:
      "Busca flujos de la cuenta HenryCo y rutas de división conectadas.",
    title: "Busca en tus flujos de HenryCo.",
    description:
      "Ve directamente a las acciones exactas de la cuenta y a las rutas de división conectadas sin recurrir a paneles genéricos.",
    placeholder:
      "Buscar en la cuenta: notificaciones, monedero, facturas, soporte, solicitudes de empleo...",
  },
  og: {
    tagline: "Inicio de sesión único en cada división de Henry & Co.",
    title: "Cuenta HenryCo",
    description: "Una identidad, una sesión segura, todos los servicios de HenryCo en un solo lugar.",
  },
  resetPassword: {
    metadataTitle: "Establecer nueva contraseña — Henry & Co.",
    heading: "Establecer nueva contraseña",
    subtitle: "Elige una nueva contraseña para tu cuenta",
  },
  downloadButton: {
    defaultLabel: "Descargar",
    preparing: "Preparando…",
    error: "No pudimos preparar ese documento. Vuelve a intentarlo.",
  },
  divisionModule: {
    goTo: (label: string) => `Ir a ${label}`,
    recentActivity: "Actividad reciente",
    allActivity: "Toda la actividad",
    noActivity: (label: string) => `Aún no hay actividad de ${label}`,
    notifications: "Notificaciones",
    all: "Todo",
    noNotifications: (label: string) => `No hay notificaciones de ${label}`,
    invoices: (label: string) => `Facturas de ${label}`,
    allInvoices: "Todas las facturas",
    invoiceFallback: (invoiceNo: string) => `Factura ${invoiceNo}`,
    support: (label: string) => `Soporte de ${label}`,
    allSupport: "Todo el soporte",
  },
  welcomeBack: {
    kicker: "Para ti",
    headingNamed: (firstName: string) => `Retoma donde lo dejaste, ${firstName}.`,
    heading: "Retoma donde lo dejaste.",
    subtitle:
      "Artículos guardados, hallazgos recientes y una cesta sin terminar — todo guardado para ti en cada dispositivo.",
    savedItemsLink: "Artículos guardados",
    resumeBasket: "Retomar la cesta",
    basketWaiting: (division: string, count: number) =>
      `${division} — ${count} artículo${count === 1 ? "" : "s"} en espera`,
    subtotal: (amount: string) => `Subtotal ${amount}`,
    continueCheckout: "Continuar con el pago →",
    savedExpiringSoon: "Guardados · caducan pronto",
    today: "hoy",
    daysShort: (days: number) => `${days} d`,
    openSavedItems: "Abrir artículos guardados →",
    recentlyViewed: "Vistos recientemente",
  },
  studioWallet: {
    chargingLabel: "Cargando del monedero",
    charging: "Cargando del monedero…",
    payFromWallet: "Pagar con el saldo del monedero",
    failed: "El pago con el monedero falló.",
    submitted: "Débito del monedero enviado. La revisión financiera está en curso.",
    failedRetry: "El pago con el monedero falló. Vuelve a intentarlo.",
  },
  documentSubmissions: {
    queueError:
      "No pudimos añadir ese archivo a la cola de revisión. Vuelve a intentarlo en un momento o contacta con soporte si sigue ocurriendo.",
    addedToQueue: (fileName: string) => `${fileName} añadido a la cola de revisión.`,
    serviceError:
      "No pudimos conectar con el servicio de verificación. Comprueba tu conexión e inténtalo de nuevo.",
    docTitles: {
      governmentId: "Documento de identidad oficial",
      selfie: "Selfie con el documento",
      addressProof: "Comprobante de domicilio",
      businessCert: "Registro de empresa",
    },
    docDescriptions: {
      governmentId:
        "Documento nacional, pasaporte o carné de conducir — la página donde se ven tu nombre completo, tu foto y el número del documento.",
      selfie:
        "Un selfie sosteniendo el mismo documento. Permite a los revisores confirmar la presencia real y la titularidad del documento de una sola vez.",
      addressProof:
        "Factura de suministros, extracto bancario o carta oficial de los últimos tres meses que coincida con tu dirección guardada.",
      businessCert:
        "Certificado CAC, registro de empresa o prueba operativa equivalente — se usa para los procesos de revisión de vendedores y empleadores.",
    },
    submitted: (when: string) => `Enviado ${when}`,
    requiredForReview: "Obligatorio para la revisión.",
    optionalReinforcement: "Refuerzo opcional.",
    reviewed: (when: string) => `Revisado ${when}`,
    uploading: "Subiendo sin salir de la página",
    replaceFile: "Reemplazar archivo",
    uploadFile: "Subir archivo",
  },
  reviewerNote: {
    label: "Nota del revisor",
  },
};

const PT: DeepPartial<AccountMiscExtraCopy> = {
  layout: {
    loadingTitle: "Abrindo a sua conta",
    loadingDescription: "Confirmando a sua sessão e carregando a navegação.",
  },
  search: {
    metadataTitle: "Pesquisar na conta",
    metadataDescription:
      "Pesquise fluxos da conta HenryCo e rotas de divisão conectadas.",
    title: "Pesquise nos seus fluxos da HenryCo.",
    description:
      "Vá diretamente às ações exatas da conta e às rotas de divisão conectadas sem recorrer a painéis genéricos.",
    placeholder:
      "Pesquisar na conta: notificações, carteira, faturas, suporte, candidaturas a vagas...",
  },
  og: {
    tagline: "Login único em todas as divisões da Henry & Co.",
    title: "Conta HenryCo",
    description: "Uma identidade, uma sessão segura, todos os serviços HenryCo num só lugar.",
  },
  resetPassword: {
    metadataTitle: "Definir nova senha — Henry & Co.",
    heading: "Definir nova senha",
    subtitle: "Escolha uma nova senha para a sua conta",
  },
  downloadButton: {
    defaultLabel: "Baixar",
    preparing: "Preparando…",
    error: "Não conseguimos preparar esse documento. Tente novamente.",
  },
  divisionModule: {
    goTo: (label: string) => `Ir para ${label}`,
    recentActivity: "Atividade recente",
    allActivity: "Toda a atividade",
    noActivity: (label: string) => `Ainda não há atividade de ${label}`,
    notifications: "Notificações",
    all: "Tudo",
    noNotifications: (label: string) => `Nenhuma notificação de ${label}`,
    invoices: (label: string) => `Faturas de ${label}`,
    allInvoices: "Todas as faturas",
    invoiceFallback: (invoiceNo: string) => `Fatura ${invoiceNo}`,
    support: (label: string) => `Suporte de ${label}`,
    allSupport: "Todo o suporte",
  },
  welcomeBack: {
    kicker: "Para você",
    headingNamed: (firstName: string) => `Continue de onde parou, ${firstName}.`,
    heading: "Continue de onde parou.",
    subtitle:
      "Itens salvos, descobertas recentes e um carrinho inacabado — tudo guardado para você em todos os dispositivos.",
    savedItemsLink: "Itens salvos",
    resumeBasket: "Retomar o carrinho",
    basketWaiting: (division: string, count: number) =>
      `${division} — ${count} ${count === 1 ? "item" : "itens"} aguardando`,
    subtotal: (amount: string) => `Subtotal ${amount}`,
    continueCheckout: "Continuar o pagamento →",
    savedExpiringSoon: "Salvos · expirando em breve",
    today: "hoje",
    daysShort: (days: number) => `${days} d`,
    openSavedItems: "Abrir itens salvos →",
    recentlyViewed: "Vistos recentemente",
  },
  studioWallet: {
    chargingLabel: "Debitando a carteira",
    charging: "Debitando a carteira…",
    payFromWallet: "Pagar com o saldo da carteira",
    failed: "O pagamento com a carteira falhou.",
    submitted: "Débito da carteira enviado. A análise financeira está em andamento.",
    failedRetry: "O pagamento com a carteira falhou. Tente novamente.",
  },
  documentSubmissions: {
    queueError:
      "Não conseguimos adicionar esse arquivo à fila de análise. Tente novamente em instantes ou contate o suporte se continuar acontecendo.",
    addedToQueue: (fileName: string) => `${fileName} adicionado à fila de análise.`,
    serviceError:
      "Não conseguimos contactar o serviço de verificação. Verifique sua conexão e tente novamente.",
    docTitles: {
      governmentId: "Documento de identidade oficial",
      selfie: "Selfie com o documento",
      addressProof: "Comprovante de endereço",
      businessCert: "Registro da empresa",
    },
    docDescriptions: {
      governmentId:
        "Documento nacional, passaporte ou carteira de motorista — a página em que seu nome completo, sua foto e o número do documento ficam visíveis.",
      selfie:
        "Uma selfie segurando o mesmo documento. Permite que os analistas confirmem a presença real e a titularidade do documento de uma só vez.",
      addressProof:
        "Conta de serviço, extrato bancário ou carta oficial dos últimos três meses que corresponda ao seu endereço salvo.",
      businessCert:
        "Certificado CAC, registro da empresa ou prova operacional equivalente — usado para as filas de análise de vendedores e empregadores.",
    },
    submitted: (when: string) => `Enviado ${when}`,
    requiredForReview: "Obrigatório para a análise.",
    optionalReinforcement: "Reforço opcional.",
    reviewed: (when: string) => `Analisado ${when}`,
    uploading: "Enviando sem sair da página",
    replaceFile: "Substituir arquivo",
    uploadFile: "Enviar arquivo",
  },
  reviewerNote: {
    label: "Nota do analista",
  },
};

const AR: DeepPartial<AccountMiscExtraCopy> = {
  layout: {
    loadingTitle: "جارٍ فتح حسابك",
    loadingDescription: "جارٍ تأكيد جلستك وتحميل التنقل.",
  },
  search: {
    metadataTitle: "البحث في الحساب",
    metadataDescription: "ابحث في مسارات حساب HenryCo ومسارات الأقسام المتصلة.",
    title: "ابحث في مسارات عمل HenryCo الخاصة بك.",
    description:
      "انتقل مباشرة إلى إجراءات الحساب الدقيقة ومسارات الأقسام المتصلة دون الرجوع إلى لوحات التحكم العامة.",
    placeholder:
      "البحث في الحساب: الإشعارات، المحفظة، الفواتير، الدعم، طلبات الوظائف...",
  },
  og: {
    tagline: "تسجيل دخول موحّد عبر كل قسم من أقسام Henry & Co.",
    title: "حساب HenryCo",
    description: "هوية واحدة، جلسة آمنة واحدة، وكل خدمات HenryCo في مكان واحد.",
  },
  resetPassword: {
    metadataTitle: "تعيين كلمة مرور جديدة — Henry & Co.",
    heading: "تعيين كلمة مرور جديدة",
    subtitle: "اختر كلمة مرور جديدة لحسابك",
  },
  downloadButton: {
    defaultLabel: "تنزيل",
    preparing: "جارٍ التحضير…",
    error: "تعذر علينا تحضير هذا المستند. يرجى المحاولة مرة أخرى.",
  },
  divisionModule: {
    goTo: (label: string) => `الانتقال إلى ${label}`,
    recentActivity: "النشاط الأخير",
    allActivity: "كل النشاط",
    noActivity: (label: string) => `لا يوجد نشاط ${label} بعد`,
    notifications: "الإشعارات",
    all: "الكل",
    noNotifications: (label: string) => `لا توجد إشعارات من ${label}`,
    invoices: (label: string) => `فواتير ${label}`,
    allInvoices: "كل الفواتير",
    invoiceFallback: (invoiceNo: string) => `الفاتورة ${invoiceNo}`,
    support: (label: string) => `دعم ${label}`,
    allSupport: "كل الدعم",
  },
  welcomeBack: {
    kicker: "من أجلك",
    headingNamed: (firstName: string) => `تابِع من حيث توقفت، ${firstName}.`,
    heading: "تابِع من حيث توقفت.",
    subtitle:
      "العناصر المحفوظة، والاكتشافات الأخيرة، وسلة غير مكتملة — كلها محفوظة لك على كل جهاز.",
    savedItemsLink: "العناصر المحفوظة",
    resumeBasket: "استئناف السلة",
    basketWaiting: (division: string, count: number) =>
      `${division} — ${count} عنصر في الانتظار`,
    subtotal: (amount: string) => `الإجمالي الفرعي ${amount}`,
    continueCheckout: "متابعة الدفع ←",
    savedExpiringSoon: "محفوظة · على وشك الانتهاء",
    today: "اليوم",
    daysShort: (days: number) => `${days} يوم`,
    openSavedItems: "فتح العناصر المحفوظة ←",
    recentlyViewed: "شوهدت مؤخرًا",
  },
  studioWallet: {
    chargingLabel: "جارٍ الخصم من المحفظة",
    charging: "جارٍ الخصم من المحفظة…",
    payFromWallet: "ادفع من رصيد المحفظة",
    failed: "فشل الدفع من المحفظة.",
    submitted: "تم إرسال الخصم من المحفظة. المراجعة المالية قيد التنفيذ الآن.",
    failedRetry: "فشل الدفع من المحفظة. يرجى إعادة المحاولة.",
  },
  documentSubmissions: {
    queueError:
      "تعذر علينا إضافة هذا الملف إلى قائمة المراجعة. حاول مرة أخرى بعد لحظة، أو تواصل مع الدعم إذا استمر الأمر.",
    addedToQueue: (fileName: string) => `تمت إضافة ${fileName} إلى قائمة المراجعة.`,
    serviceError:
      "تعذر علينا الوصول إلى خدمة التحقق. تحقق من اتصالك وحاول مرة أخرى.",
    docTitles: {
      governmentId: "هوية صادرة عن الحكومة",
      selfie: "صورة ذاتية مع الهوية",
      addressProof: "إثبات العنوان",
      businessCert: "سجل تجاري",
    },
    docDescriptions: {
      governmentId:
        "بطاقة هوية وطنية أو جواز سفر أو رخصة قيادة — الصفحة التي يظهر فيها اسمك الكامل وصورتك ورقم المستند.",
      selfie:
        "صورة ذاتية وأنت تحمل الهوية نفسها. تتيح للمراجعين تأكيد الوجود الحي وملكية المستند في لقطة واحدة.",
      addressProof:
        "فاتورة مرافق أو كشف حساب بنكي أو خطاب رسمي من الأشهر الثلاثة الأخيرة يطابق عنوانك المحفوظ.",
      businessCert:
        "شهادة CAC أو سجل تجاري أو إثبات تشغيلي مكافئ — يُستخدم لمسارات مراجعة البائعين وأصحاب العمل.",
    },
    submitted: (when: string) => `تم الإرسال ${when}`,
    requiredForReview: "مطلوب للمراجعة.",
    optionalReinforcement: "تعزيز اختياري.",
    reviewed: (when: string) => `تمت المراجعة ${when}`,
    uploading: "جارٍ الرفع دون مغادرة الصفحة",
    replaceFile: "استبدال الملف",
    uploadFile: "رفع ملف",
  },
  reviewerNote: {
    label: "ملاحظة المراجع",
  },
};

const DE: DeepPartial<AccountMiscExtraCopy> = {
  layout: {
    loadingTitle: "Dein Konto wird geöffnet",
    loadingDescription: "Sitzung wird bestätigt und Navigation geladen.",
  },
  search: {
    metadataTitle: "Konto durchsuchen",
    metadataDescription:
      "Durchsuche HenryCo-Konto-Workflows und verbundene Divisionsrouten.",
    title: "Durchsuche deine HenryCo-Workflows.",
    description:
      "Springe direkt zu genauen Kontoaktionen und verbundenen Divisionsrouten, ohne auf generische Dashboards zurückzufallen.",
    placeholder:
      "Konto durchsuchen: Benachrichtigungen, Wallet, Rechnungen, Support, Jobbewerbungen...",
  },
  og: {
    tagline: "Single Sign-on über jede Henry & Co.-Division",
    title: "HenryCo-Konto",
    description: "Eine Identität, eine sichere Sitzung, jeder HenryCo-Service an einem Ort.",
  },
  resetPassword: {
    metadataTitle: "Neues Passwort festlegen — Henry & Co.",
    heading: "Neues Passwort festlegen",
    subtitle: "Wähle ein neues Passwort für dein Konto",
  },
  downloadButton: {
    defaultLabel: "Herunterladen",
    preparing: "Wird vorbereitet…",
    error: "Wir konnten dieses Dokument nicht vorbereiten. Bitte versuche es erneut.",
  },
  divisionModule: {
    goTo: (label: string) => `Zu ${label}`,
    recentActivity: "Letzte Aktivität",
    allActivity: "Gesamte Aktivität",
    noActivity: (label: string) => `Noch keine ${label}-Aktivität`,
    notifications: "Benachrichtigungen",
    all: "Alle",
    noNotifications: (label: string) => `Keine Benachrichtigungen von ${label}`,
    invoices: (label: string) => `${label}-Rechnungen`,
    allInvoices: "Alle Rechnungen",
    invoiceFallback: (invoiceNo: string) => `Rechnung ${invoiceNo}`,
    support: (label: string) => `${label}-Support`,
    allSupport: "Gesamter Support",
  },
  welcomeBack: {
    kicker: "Für dich",
    headingNamed: (firstName: string) => `Mach dort weiter, wo du aufgehört hast, ${firstName}.`,
    heading: "Mach dort weiter, wo du aufgehört hast.",
    subtitle:
      "Gespeicherte Artikel, kürzliche Funde und ein unvollendeter Warenkorb — alles für dich auf jedem Gerät aufbewahrt.",
    savedItemsLink: "Gespeicherte Artikel",
    resumeBasket: "Warenkorb fortsetzen",
    basketWaiting: (division: string, count: number) =>
      `${division} — ${count} Artikel ${count === 1 ? "wartet" : "warten"}`,
    subtotal: (amount: string) => `Zwischensumme ${amount}`,
    continueCheckout: "Zur Kasse fortfahren →",
    savedExpiringSoon: "Gespeichert · läuft bald ab",
    today: "heute",
    daysShort: (days: number) => `${days} T`,
    openSavedItems: "Gespeicherte Artikel öffnen →",
    recentlyViewed: "Kürzlich angesehen",
  },
  studioWallet: {
    chargingLabel: "Wallet wird belastet",
    charging: "Wallet wird belastet…",
    payFromWallet: "Mit Wallet-Guthaben bezahlen",
    failed: "Die Wallet-Zahlung ist fehlgeschlagen.",
    submitted: "Wallet-Belastung übermittelt. Die Finanzprüfung läuft jetzt.",
    failedRetry: "Die Wallet-Zahlung ist fehlgeschlagen. Bitte erneut versuchen.",
  },
  documentSubmissions: {
    queueError:
      "Wir konnten diese Datei nicht zur Prüfungswarteschlange hinzufügen. Versuche es gleich noch einmal oder kontaktiere den Support, wenn es weiterhin auftritt.",
    addedToQueue: (fileName: string) => `${fileName} zur Prüfungswarteschlange hinzugefügt.`,
    serviceError:
      "Wir konnten den Verifizierungsdienst nicht erreichen. Überprüfe deine Verbindung und versuche es erneut.",
    docTitles: {
      governmentId: "Amtlicher Ausweis",
      selfie: "Selfie mit Ausweis",
      addressProof: "Adressnachweis",
      businessCert: "Gewerbeanmeldung",
    },
    docDescriptions: {
      governmentId:
        "Personalausweis, Reisepass oder Führerschein — die Seite mit deinem vollständigen Namen, Foto und der Dokumentnummer sichtbar.",
      selfie:
        "Ein Selfie, auf dem du denselben Ausweis hältst. So können Prüfende Lebendigkeit und Dokumentbesitz in einer Aufnahme bestätigen.",
      addressProof:
        "Versorgerrechnung, Kontoauszug oder offizielles Schreiben aus den letzten drei Monaten, das zu deiner gespeicherten Adresse passt.",
      businessCert:
        "CAC-Zertifikat, Gewerbeanmeldung oder gleichwertiger Betriebsnachweis — wird für die Prüfungswege von Verkäufern und Arbeitgebern verwendet.",
    },
    submitted: (when: string) => `Eingereicht ${when}`,
    requiredForReview: "Für die Prüfung erforderlich.",
    optionalReinforcement: "Optionale Ergänzung.",
    reviewed: (when: string) => `Geprüft ${when}`,
    uploading: "Hochladen, ohne die Seite zu verlassen",
    replaceFile: "Datei ersetzen",
    uploadFile: "Datei hochladen",
  },
  reviewerNote: {
    label: "Hinweis des Prüfers",
  },
};

const IT: DeepPartial<AccountMiscExtraCopy> = {
  layout: {
    loadingTitle: "Apertura del tuo account",
    loadingDescription: "Conferma della sessione e caricamento della navigazione.",
  },
  search: {
    metadataTitle: "Cerca nell'account",
    metadataDescription:
      "Cerca tra i flussi dell'account HenryCo e le rotte di divisione collegate.",
    title: "Cerca nei tuoi flussi HenryCo.",
    description:
      "Vai direttamente alle azioni esatte dell'account e alle rotte di divisione collegate senza ripiegare su dashboard generiche.",
    placeholder:
      "Cerca nell'account: notifiche, portafoglio, fatture, assistenza, candidature di lavoro...",
  },
  og: {
    tagline: "Single sign-on su ogni divisione Henry & Co.",
    title: "Account HenryCo",
    description: "Un'unica identità, un'unica sessione sicura, tutti i servizi HenryCo in un solo posto.",
  },
  resetPassword: {
    metadataTitle: "Imposta una nuova password — Henry & Co.",
    heading: "Imposta una nuova password",
    subtitle: "Scegli una nuova password per il tuo account",
  },
  downloadButton: {
    defaultLabel: "Scarica",
    preparing: "Preparazione…",
    error: "Non siamo riusciti a preparare quel documento. Riprova.",
  },
  divisionModule: {
    goTo: (label: string) => `Vai a ${label}`,
    recentActivity: "Attività recente",
    allActivity: "Tutta l'attività",
    noActivity: (label: string) => `Nessuna attività ${label} ancora`,
    notifications: "Notifiche",
    all: "Tutte",
    noNotifications: (label: string) => `Nessuna notifica da ${label}`,
    invoices: (label: string) => `Fatture ${label}`,
    allInvoices: "Tutte le fatture",
    invoiceFallback: (invoiceNo: string) => `Fattura ${invoiceNo}`,
    support: (label: string) => `Assistenza ${label}`,
    allSupport: "Tutta l'assistenza",
  },
  welcomeBack: {
    kicker: "Per te",
    headingNamed: (firstName: string) => `Riprendi da dove avevi lasciato, ${firstName}.`,
    heading: "Riprendi da dove avevi lasciato.",
    subtitle:
      "Articoli salvati, scoperte recenti e un carrello incompleto — tutto conservato per te su ogni dispositivo.",
    savedItemsLink: "Articoli salvati",
    resumeBasket: "Riprendi il carrello",
    basketWaiting: (division: string, count: number) =>
      `${division} — ${count} articol${count === 1 ? "o" : "i"} in attesa`,
    subtotal: (amount: string) => `Subtotale ${amount}`,
    continueCheckout: "Continua il pagamento →",
    savedExpiringSoon: "Salvati · in scadenza",
    today: "oggi",
    daysShort: (days: number) => `${days} g`,
    openSavedItems: "Apri articoli salvati →",
    recentlyViewed: "Visti di recente",
  },
  studioWallet: {
    chargingLabel: "Addebito sul portafoglio",
    charging: "Addebito sul portafoglio…",
    payFromWallet: "Paga con il saldo del portafoglio",
    failed: "Il pagamento dal portafoglio non è riuscito.",
    submitted: "Addebito dal portafoglio inviato. La revisione finanziaria è in corso.",
    failedRetry: "Il pagamento dal portafoglio non è riuscito. Riprova.",
  },
  documentSubmissions: {
    queueError:
      "Non siamo riusciti ad aggiungere quel file alla coda di revisione. Riprova tra un momento o contatta l'assistenza se continua a succedere.",
    addedToQueue: (fileName: string) => `${fileName} aggiunto alla coda di revisione.`,
    serviceError:
      "Non siamo riusciti a raggiungere il servizio di verifica. Controlla la connessione e riprova.",
    docTitles: {
      governmentId: "Documento d'identità ufficiale",
      selfie: "Selfie con il documento",
      addressProof: "Prova di residenza",
      businessCert: "Registrazione dell'attività",
    },
    docDescriptions: {
      governmentId:
        "Carta d'identità, passaporto o patente di guida — la pagina con il tuo nome completo, la foto e il numero del documento ben visibili.",
      selfie:
        "Un selfie con lo stesso documento in mano. Consente ai revisori di confermare la presenza reale e la titolarità del documento in un solo scatto.",
      addressProof:
        "Bolletta, estratto conto bancario o lettera ufficiale degli ultimi tre mesi che corrisponda all'indirizzo salvato.",
      businessCert:
        "Certificato CAC, registrazione dell'attività o prova operativa equivalente — usato per i percorsi di revisione di venditori e datori di lavoro.",
    },
    submitted: (when: string) => `Inviato ${when}`,
    requiredForReview: "Richiesto per la revisione.",
    optionalReinforcement: "Rinforzo facoltativo.",
    reviewed: (when: string) => `Revisionato ${when}`,
    uploading: "Caricamento senza lasciare la pagina",
    replaceFile: "Sostituisci file",
    uploadFile: "Carica file",
  },
  reviewerNote: {
    label: "Nota del revisore",
  },
};

const ZH: DeepPartial<AccountMiscExtraCopy> = {
  layout: {
    loadingTitle: "正在打开你的账户",
    loadingDescription: "正在确认你的会话并加载导航。",
  },
  search: {
    metadataTitle: "搜索账户",
    metadataDescription: "搜索 HenryCo 账户工作流程和已连接的板块路由。",
    title: "搜索你的 HenryCo 工作流程。",
    description: "直接跳转到精确的账户操作和已连接的板块路由，无需退回到通用仪表板。",
    placeholder: "搜索账户：通知、钱包、发票、支持、职位申请……",
  },
  og: {
    tagline: "跨 Henry & Co. 各板块的单点登录",
    title: "HenryCo 账户",
    description: "一个身份、一个安全会话，所有 HenryCo 服务尽在一处。",
  },
  resetPassword: {
    metadataTitle: "设置新密码 — Henry & Co.",
    heading: "设置新密码",
    subtitle: "为你的账户选择一个新密码",
  },
  downloadButton: {
    defaultLabel: "下载",
    preparing: "正在准备……",
    error: "我们无法准备该文档。请重试。",
  },
  divisionModule: {
    goTo: (label: string) => `前往 ${label}`,
    recentActivity: "近期活动",
    allActivity: "全部活动",
    noActivity: (label: string) => `暂无 ${label} 活动`,
    notifications: "通知",
    all: "全部",
    noNotifications: (label: string) => `没有来自 ${label} 的通知`,
    invoices: (label: string) => `${label} 发票`,
    allInvoices: "全部发票",
    invoiceFallback: (invoiceNo: string) => `发票 ${invoiceNo}`,
    support: (label: string) => `${label} 支持`,
    allSupport: "全部支持",
  },
  welcomeBack: {
    kicker: "为你推荐",
    headingNamed: (firstName: string) => `${firstName}，从上次中断的地方继续吧。`,
    heading: "从上次中断的地方继续吧。",
    subtitle: "已保存的商品、最近的发现，以及一个未完成的购物篮——已在每台设备上为你保留。",
    savedItemsLink: "已保存的商品",
    resumeBasket: "继续购物篮",
    basketWaiting: (division: string, count: number) => `${division} — ${count} 件商品等待中`,
    subtotal: (amount: string) => `小计 ${amount}`,
    continueCheckout: "继续结账 →",
    savedExpiringSoon: "已保存 · 即将到期",
    today: "今天",
    daysShort: (days: number) => `${days} 天`,
    openSavedItems: "打开已保存的商品 →",
    recentlyViewed: "最近查看",
  },
  studioWallet: {
    chargingLabel: "正在从钱包扣款",
    charging: "正在从钱包扣款……",
    payFromWallet: "使用钱包余额支付",
    failed: "钱包结账失败。",
    submitted: "钱包扣款已提交。财务审核正在进行中。",
    failedRetry: "钱包结账失败。请重试。",
  },
  documentSubmissions: {
    queueError: "我们无法将该文件加入审核队列。请稍后重试，如果持续出现，请联系支持。",
    addedToQueue: (fileName: string) => `${fileName} 已加入审核队列。`,
    serviceError: "我们无法连接验证服务。请检查你的网络连接后重试。",
    docTitles: {
      governmentId: "政府签发的身份证件",
      selfie: "手持证件的自拍",
      addressProof: "地址证明",
      businessCert: "企业注册证明",
    },
    docDescriptions: {
      governmentId:
        "身份证、护照或驾照——显示你的全名、照片和证件号码的那一页。",
      selfie:
        "手持同一证件的自拍。让审核人员在一张照片中确认真人在场和证件归属。",
      addressProof:
        "近三个月内的水电费账单、银行对账单或官方信函，需与你保存的地址相符。",
      businessCert:
        "CAC 证书、企业注册或同等经营证明——用于卖家和雇主审核通道。",
    },
    submitted: (when: string) => `已于 ${when} 提交`,
    requiredForReview: "审核必填。",
    optionalReinforcement: "可选补充。",
    reviewed: (when: string) => `已于 ${when} 审核`,
    uploading: "无需离开页面即可上传",
    replaceFile: "替换文件",
    uploadFile: "上传文件",
  },
  reviewerNote: {
    label: "审核人备注",
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<AccountMiscExtraCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
};
// ig, yo, ha, hi are intentionally OMITTED -> fall back to EN (human-translation only).

export function getAccountMiscExtraCopy(locale: AppLocale): AccountMiscExtraCopy {
  const o = LOCALE_MAP[locale];
  if (o) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      o as unknown as Record<string, unknown>,
    ) as unknown as AccountMiscExtraCopy;
  }
  return EN;
}
