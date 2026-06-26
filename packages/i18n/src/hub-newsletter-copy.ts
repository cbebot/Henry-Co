import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

export type HubNewsletterCopy = {
  divisions: {
    hub: string;
    account: string;
    care: string;
    jobs: string;
    learn: string;
    logistics: string;
    marketplace: string;
    property: string;
    studio: string;
  };
  signup: {
    successSubscribedTitle: string;
    successUpdatedTitle: string;
    successBody: (email: string, topics: string) => string;
    managePrefsPrefix: string;
    openPreferenceCenter: string;
    emailLabel: string;
    emailPlaceholder: string;
    countryLabel: string;
    countryPlaceholder: string;
    pickHeading: string;
    pickHint: string;
    consent: string;
    submittingLabel: string;
    subscribeLabel: string;
    errorSuppressed: string;
    errorGeneric: string;
    errorNetwork: string;
  };
  page: {
    metaTitle: string;
    metaDescription: string;
    kicker: string;
    title: string;
    intro: string;
    promiseHeading: string;
    promiseOptIn: string;
    promiseSuppress: string;
    promiseNoInvent: string;
    promiseUnsubscribe: string;
  };
  preferences: {
    pauseTitle: string;
    pauseHint: string;
    savingLabel: string;
    saveLabel: string;
    unsubscribeAllLabel: string;
    savedTitle: string;
    unsubscribedBody: string;
    subscribedBody: (topics: string) => string;
    subscribedNone: string;
    errorSave: string;
    errorNetwork: string;
  };
  prefPage: {
    metaTitle: string;
    metaDescription: string;
    missingTitle: string;
    missingBody: string;
    expiredTitle: string;
    notValidTitle: string;
    kicker: string;
    title: string;
    signedInPrefix: string;
    signedInSuffix: string;
  };
  search: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    description: string;
    placeholder: string;
    signInLabel: string;
  };
};

const EN: HubNewsletterCopy = {
  divisions: {
    hub: "HenryCo Group",
    account: "Account",
    care: "Care",
    jobs: "Jobs",
    learn: "Learn",
    logistics: "Logistics",
    marketplace: "Marketplace",
    property: "Property",
    studio: "Studio",
  },
  signup: {
    successSubscribedTitle: "You’re subscribed",
    successUpdatedTitle: "Preferences updated",
    successBody: (email: string, topics: string) => `We’ll email ${email} about: ${topics}.`,
    managePrefsPrefix: "Manage preferences any time:",
    openPreferenceCenter: "open preference center",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    countryLabel: "Country (2 letter, optional)",
    countryPlaceholder: "NG",
    pickHeading: "Pick what you want to hear about",
    pickHint: "You can change or remove any of these later.",
    consent:
      "I agree to receive these newsletters from HenryCo. I understand I can unsubscribe any time, and that HenryCo will suppress sends during active support or billing issues.",
    submittingLabel: "Subscribing…",
    subscribeLabel: "Subscribe",
    errorSuppressed: "This address is on our suppression list.",
    errorGeneric: "Something went wrong. Try again.",
    errorNetwork: "Network error",
  },
  page: {
    metaTitle: "Newsletters — Henry & Co.",
    metaDescription:
      "Subscribe to HenryCo newsletters. Pick what's useful, skip what isn't. Unsubscribe any time.",
    kicker: "Editorial",
    title: "Newsletters, chosen carefully",
    intro:
      "We’d rather send less and have it matter. Pick one or more topics below. You can manage preferences or unsubscribe from every email we send.",
    promiseHeading: "What we promise",
    promiseOptIn: "We only email you topics you explicitly opted into.",
    promiseSuppress: "We suppress sends when we see active support, trust, or billing issues.",
    promiseNoInvent: "We don’t invent stats, testimonials, or urgency.",
    promiseUnsubscribe: "Every email carries a working unsubscribe link.",
  },
  preferences: {
    pauseTitle: "Pause all promotional sends",
    pauseHint:
      "You’ll still get transactional emails (receipts, verification, shipping), just not newsletters.",
    savingLabel: "Saving…",
    saveLabel: "Save preferences",
    unsubscribeAllLabel: "Unsubscribe from all",
    savedTitle: "Preferences saved.",
    unsubscribedBody: "You’ve been unsubscribed. We’re sorry to see you go.",
    subscribedBody: (topics: string) => `Subscribed to: ${topics}.`,
    subscribedNone: "nothing",
    errorSave: "Unable to save preferences.",
    errorNetwork: "Network error",
  },
  prefPage: {
    metaTitle: "Manage newsletter preferences — Henry & Co.",
    metaDescription:
      "Update which HenryCo newsletters you receive, pause promotional sends, or unsubscribe entirely.",
    missingTitle: "Preference link missing",
    missingBody:
      "Open the “Manage preferences” link from any HenryCo email to land here with a valid token. If your link has expired, subscribe again and we’ll issue a new one.",
    expiredTitle: "Link expired",
    notValidTitle: "Link not valid",
    kicker: "Preference center",
    title: "Your newsletter preferences",
    signedInPrefix: "Signed in as",
    signedInSuffix: "Changes apply to all HenryCo divisions.",
  },
  search: {
    metaTitle: "Search HenryCo",
    metaDescription: "Search HenryCo divisions, workflows, and support routes from one hub.",
    title: "Search HenryCo across divisions, workflows, and help routes.",
    description: "Find divisions, account workflows, and support routes from one calm entry point.",
    placeholder:
      "Search HenryCo: notifications, wallet, marketplace orders, jobs help, logistics tracking...",
    signInLabel: "Sign in and continue search",
  },
};

const FR: DeepPartial<HubNewsletterCopy> = {
  divisions: {
    hub: "HenryCo Group",
    account: "Compte",
    care: "Care",
    jobs: "Jobs",
    learn: "Learn",
    logistics: "Logistics",
    marketplace: "Marketplace",
    property: "Property",
    studio: "Studio",
  },
  signup: {
    successSubscribedTitle: "Vous êtes inscrit",
    successUpdatedTitle: "Préférences mises à jour",
    successBody: (email: string, topics: string) =>
      `Nous écrirons à ${email} au sujet de : ${topics}.`,
    managePrefsPrefix: "Gérez vos préférences à tout moment :",
    openPreferenceCenter: "ouvrir le centre de préférences",
    emailLabel: "Adresse e-mail",
    emailPlaceholder: "vous@exemple.com",
    countryLabel: "Pays (2 lettres, facultatif)",
    countryPlaceholder: "NG",
    pickHeading: "Choisissez ce qui vous intéresse",
    pickHint: "Vous pourrez modifier ou supprimer ces choix plus tard.",
    consent:
      "J’accepte de recevoir ces newsletters de HenryCo. Je comprends que je peux me désabonner à tout moment et que HenryCo suspendra les envois en cas de problème actif de support ou de facturation.",
    submittingLabel: "Inscription…",
    subscribeLabel: "S’inscrire",
    errorSuppressed: "Cette adresse figure sur notre liste de suppression.",
    errorGeneric: "Une erreur est survenue. Réessayez.",
    errorNetwork: "Erreur réseau",
  },
  page: {
    metaTitle: "Newsletters — Henry & Co.",
    metaDescription:
      "Abonnez-vous aux newsletters HenryCo. Choisissez ce qui est utile, ignorez le reste. Désabonnez-vous à tout moment.",
    kicker: "Éditorial",
    title: "Des newsletters, choisies avec soin",
    intro:
      "Nous préférons en envoyer moins, mais que cela compte. Choisissez un ou plusieurs sujets ci-dessous. Vous pouvez gérer vos préférences ou vous désabonner de chaque e-mail que nous envoyons.",
    promiseHeading: "Nos engagements",
    promiseOptIn: "Nous ne vous écrivons que sur les sujets auxquels vous avez explicitement adhéré.",
    promiseSuppress:
      "Nous suspendons les envois lorsque nous constatons un problème actif de support, de confiance ou de facturation.",
    promiseNoInvent: "Nous n’inventons ni statistiques, ni témoignages, ni urgence.",
    promiseUnsubscribe: "Chaque e-mail comporte un lien de désabonnement fonctionnel.",
  },
  preferences: {
    pauseTitle: "Suspendre tous les envois promotionnels",
    pauseHint:
      "Vous continuerez à recevoir les e-mails transactionnels (reçus, vérification, expédition), mais pas les newsletters.",
    savingLabel: "Enregistrement…",
    saveLabel: "Enregistrer les préférences",
    unsubscribeAllLabel: "Tout résilier",
    savedTitle: "Préférences enregistrées.",
    unsubscribedBody: "Vous avez été désabonné. Nous sommes désolés de vous voir partir.",
    subscribedBody: (topics: string) => `Abonné à : ${topics}.`,
    subscribedNone: "rien",
    errorSave: "Impossible d’enregistrer les préférences.",
    errorNetwork: "Erreur réseau",
  },
  prefPage: {
    metaTitle: "Gérer les préférences de newsletter — Henry & Co.",
    metaDescription:
      "Mettez à jour les newsletters HenryCo que vous recevez, suspendez les envois promotionnels ou désabonnez-vous entièrement.",
    missingTitle: "Lien de préférences manquant",
    missingBody:
      "Ouvrez le lien « Gérer les préférences » depuis n’importe quel e-mail HenryCo pour arriver ici avec un jeton valide. Si votre lien a expiré, réabonnez-vous et nous en émettrons un nouveau.",
    expiredTitle: "Lien expiré",
    notValidTitle: "Lien non valide",
    kicker: "Centre de préférences",
    title: "Vos préférences de newsletter",
    signedInPrefix: "Connecté en tant que",
    signedInSuffix: "Les modifications s’appliquent à toutes les divisions HenryCo.",
  },
  search: {
    metaTitle: "Rechercher HenryCo",
    metaDescription:
      "Recherchez les divisions, workflows et canaux d’assistance HenryCo depuis un seul hub.",
    title: "Recherchez dans HenryCo : divisions, workflows et canaux d’aide.",
    description:
      "Trouvez les divisions, les workflows de compte et les canaux d’assistance depuis un point d’entrée serein.",
    placeholder:
      "Rechercher dans HenryCo : notifications, portefeuille, commandes marketplace, aide jobs, suivi logistique...",
    signInLabel: "Se connecter et poursuivre la recherche",
  },
};

const ES: DeepPartial<HubNewsletterCopy> = {
  divisions: {
    hub: "HenryCo Group",
    account: "Cuenta",
    care: "Care",
    jobs: "Jobs",
    learn: "Learn",
    logistics: "Logistics",
    marketplace: "Marketplace",
    property: "Property",
    studio: "Studio",
  },
  signup: {
    successSubscribedTitle: "Te has suscrito",
    successUpdatedTitle: "Preferencias actualizadas",
    successBody: (email: string, topics: string) =>
      `Te escribiremos a ${email} sobre: ${topics}.`,
    managePrefsPrefix: "Gestiona tus preferencias en cualquier momento:",
    openPreferenceCenter: "abrir el centro de preferencias",
    emailLabel: "Dirección de correo electrónico",
    emailPlaceholder: "tu@ejemplo.com",
    countryLabel: "País (2 letras, opcional)",
    countryPlaceholder: "NG",
    pickHeading: "Elige sobre qué quieres recibir información",
    pickHint: "Podrás cambiar o quitar cualquiera de estas opciones más tarde.",
    consent:
      "Acepto recibir estos boletines de HenryCo. Entiendo que puedo darme de baja en cualquier momento y que HenryCo suspenderá los envíos durante problemas activos de soporte o facturación.",
    submittingLabel: "Suscribiendo…",
    subscribeLabel: "Suscribirse",
    errorSuppressed: "Esta dirección está en nuestra lista de supresión.",
    errorGeneric: "Algo salió mal. Inténtalo de nuevo.",
    errorNetwork: "Error de red",
  },
  page: {
    metaTitle: "Boletines — Henry & Co.",
    metaDescription:
      "Suscríbete a los boletines de HenryCo. Elige lo que te sirve y omite lo que no. Date de baja en cualquier momento.",
    kicker: "Editorial",
    title: "Boletines, elegidos con cuidado",
    intro:
      "Preferimos enviar menos y que importe. Elige uno o más temas a continuación. Puedes gestionar tus preferencias o darte de baja de todos los correos que enviamos.",
    promiseHeading: "Lo que prometemos",
    promiseOptIn: "Solo te escribimos sobre temas a los que te has suscrito explícitamente.",
    promiseSuppress:
      "Suspendemos los envíos cuando detectamos problemas activos de soporte, confianza o facturación.",
    promiseNoInvent: "No inventamos estadísticas, testimonios ni urgencia.",
    promiseUnsubscribe: "Cada correo incluye un enlace de baja que funciona.",
  },
  preferences: {
    pauseTitle: "Pausar todos los envíos promocionales",
    pauseHint:
      "Seguirás recibiendo correos transaccionales (recibos, verificación, envíos), pero no boletines.",
    savingLabel: "Guardando…",
    saveLabel: "Guardar preferencias",
    unsubscribeAllLabel: "Darse de baja de todo",
    savedTitle: "Preferencias guardadas.",
    unsubscribedBody: "Te has dado de baja. Lamentamos verte partir.",
    subscribedBody: (topics: string) => `Suscrito a: ${topics}.`,
    subscribedNone: "nada",
    errorSave: "No se pudieron guardar las preferencias.",
    errorNetwork: "Error de red",
  },
  prefPage: {
    metaTitle: "Gestionar preferencias de boletines — Henry & Co.",
    metaDescription:
      "Actualiza qué boletines de HenryCo recibes, pausa los envíos promocionales o date de baja por completo.",
    missingTitle: "Falta el enlace de preferencias",
    missingBody:
      "Abre el enlace «Gestionar preferencias» desde cualquier correo de HenryCo para llegar aquí con un token válido. Si tu enlace ha caducado, vuelve a suscribirte y emitiremos uno nuevo.",
    expiredTitle: "Enlace caducado",
    notValidTitle: "Enlace no válido",
    kicker: "Centro de preferencias",
    title: "Tus preferencias de boletines",
    signedInPrefix: "Sesión iniciada como",
    signedInSuffix: "Los cambios se aplican a todas las divisiones de HenryCo.",
  },
  search: {
    metaTitle: "Buscar en HenryCo",
    metaDescription:
      "Busca divisiones, flujos de trabajo y rutas de soporte de HenryCo desde un solo hub.",
    title: "Busca en HenryCo entre divisiones, flujos de trabajo y rutas de ayuda.",
    description:
      "Encuentra divisiones, flujos de trabajo de cuenta y rutas de soporte desde un único punto de entrada tranquilo.",
    placeholder:
      "Buscar en HenryCo: notificaciones, monedero, pedidos de marketplace, ayuda de jobs, seguimiento logístico...",
    signInLabel: "Inicia sesión y continúa la búsqueda",
  },
};

const PT: DeepPartial<HubNewsletterCopy> = {
  divisions: {
    hub: "HenryCo Group",
    account: "Conta",
    care: "Care",
    jobs: "Jobs",
    learn: "Learn",
    logistics: "Logistics",
    marketplace: "Marketplace",
    property: "Property",
    studio: "Studio",
  },
  signup: {
    successSubscribedTitle: "Você está inscrito",
    successUpdatedTitle: "Preferências atualizadas",
    successBody: (email: string, topics: string) =>
      `Vamos escrever para ${email} sobre: ${topics}.`,
    managePrefsPrefix: "Gerencie suas preferências a qualquer momento:",
    openPreferenceCenter: "abrir o centro de preferências",
    emailLabel: "Endereço de e-mail",
    emailPlaceholder: "voce@exemplo.com",
    countryLabel: "País (2 letras, opcional)",
    countryPlaceholder: "NG",
    pickHeading: "Escolha sobre o que você quer saber",
    pickHint: "Você pode alterar ou remover qualquer uma dessas opções depois.",
    consent:
      "Concordo em receber estas newsletters da HenryCo. Entendo que posso cancelar a inscrição a qualquer momento e que a HenryCo suspenderá os envios durante problemas ativos de suporte ou cobrança.",
    submittingLabel: "Inscrevendo…",
    subscribeLabel: "Inscrever-se",
    errorSuppressed: "Este endereço está na nossa lista de supressão.",
    errorGeneric: "Algo deu errado. Tente novamente.",
    errorNetwork: "Erro de rede",
  },
  page: {
    metaTitle: "Newsletters — Henry & Co.",
    metaDescription:
      "Inscreva-se nas newsletters da HenryCo. Escolha o que é útil, ignore o que não é. Cancele a inscrição a qualquer momento.",
    kicker: "Editorial",
    title: "Newsletters, escolhidas com cuidado",
    intro:
      "Preferimos enviar menos e que isso importe. Escolha um ou mais tópicos abaixo. Você pode gerenciar suas preferências ou cancelar a inscrição de todos os e-mails que enviamos.",
    promiseHeading: "O que prometemos",
    promiseOptIn: "Só escrevemos sobre os tópicos aos quais você optou explicitamente.",
    promiseSuppress:
      "Suspendemos os envios quando detectamos problemas ativos de suporte, confiança ou cobrança.",
    promiseNoInvent: "Não inventamos estatísticas, depoimentos ou urgência.",
    promiseUnsubscribe: "Todo e-mail traz um link de cancelamento que funciona.",
  },
  preferences: {
    pauseTitle: "Pausar todos os envios promocionais",
    pauseHint:
      "Você continuará recebendo e-mails transacionais (recibos, verificação, envio), apenas não as newsletters.",
    savingLabel: "Salvando…",
    saveLabel: "Salvar preferências",
    unsubscribeAllLabel: "Cancelar inscrição de tudo",
    savedTitle: "Preferências salvas.",
    unsubscribedBody: "Sua inscrição foi cancelada. Lamentamos vê-lo partir.",
    subscribedBody: (topics: string) => `Inscrito em: ${topics}.`,
    subscribedNone: "nada",
    errorSave: "Não foi possível salvar as preferências.",
    errorNetwork: "Erro de rede",
  },
  prefPage: {
    metaTitle: "Gerenciar preferências de newsletter — Henry & Co.",
    metaDescription:
      "Atualize quais newsletters da HenryCo você recebe, pause os envios promocionais ou cancele a inscrição por completo.",
    missingTitle: "Link de preferências ausente",
    missingBody:
      "Abra o link “Gerenciar preferências” de qualquer e-mail da HenryCo para chegar aqui com um token válido. Se o seu link expirou, inscreva-se novamente e emitiremos um novo.",
    expiredTitle: "Link expirado",
    notValidTitle: "Link inválido",
    kicker: "Centro de preferências",
    title: "Suas preferências de newsletter",
    signedInPrefix: "Conectado como",
    signedInSuffix: "As alterações se aplicam a todas as divisões da HenryCo.",
  },
  search: {
    metaTitle: "Pesquisar HenryCo",
    metaDescription:
      "Pesquise divisões, fluxos de trabalho e rotas de suporte da HenryCo a partir de um único hub.",
    title: "Pesquise na HenryCo entre divisões, fluxos de trabalho e rotas de ajuda.",
    description:
      "Encontre divisões, fluxos de trabalho de conta e rotas de suporte a partir de um único ponto de entrada tranquilo.",
    placeholder:
      "Pesquisar na HenryCo: notificações, carteira, pedidos do marketplace, ajuda de jobs, rastreamento logístico...",
    signInLabel: "Entre e continue a pesquisa",
  },
};

const AR: DeepPartial<HubNewsletterCopy> = {
  divisions: {
    hub: "HenryCo Group",
    account: "الحساب",
    care: "Care",
    jobs: "Jobs",
    learn: "Learn",
    logistics: "Logistics",
    marketplace: "Marketplace",
    property: "Property",
    studio: "Studio",
  },
  signup: {
    successSubscribedTitle: "تم اشتراكك",
    successUpdatedTitle: "تم تحديث التفضيلات",
    successBody: (email: string, topics: string) =>
      `سنراسلك على ${email} بخصوص: ${topics}.`,
    managePrefsPrefix: "أدِر تفضيلاتك في أي وقت:",
    openPreferenceCenter: "فتح مركز التفضيلات",
    emailLabel: "عنوان البريد الإلكتروني",
    emailPlaceholder: "you@example.com",
    countryLabel: "الدولة (حرفان، اختياري)",
    countryPlaceholder: "NG",
    pickHeading: "اختر ما تريد أن تسمع عنه",
    pickHint: "يمكنك تغيير أيٍّ من هذه الخيارات أو إزالتها لاحقًا.",
    consent:
      "أوافق على تلقي هذه النشرات الإخبارية من HenryCo. أدرك أنه يمكنني إلغاء الاشتراك في أي وقت، وأن HenryCo ستوقف الإرسال أثناء وجود مشكلات نشطة في الدعم أو الفوترة.",
    submittingLabel: "جارٍ الاشتراك…",
    subscribeLabel: "اشترك",
    errorSuppressed: "هذا العنوان موجود على قائمة الحظر لدينا.",
    errorGeneric: "حدث خطأ ما. حاول مرة أخرى.",
    errorNetwork: "خطأ في الشبكة",
  },
  page: {
    metaTitle: "النشرات الإخبارية — Henry & Co.",
    metaDescription:
      "اشترك في نشرات HenryCo الإخبارية. اختر ما هو مفيد وتجاوز ما ليس كذلك. ألغِ الاشتراك في أي وقت.",
    kicker: "افتتاحية",
    title: "نشرات إخبارية مختارة بعناية",
    intro:
      "نفضّل أن نرسل أقل وأن يكون لذلك قيمة. اختر موضوعًا أو أكثر أدناه. يمكنك إدارة التفضيلات أو إلغاء الاشتراك من كل بريد إلكتروني نرسله.",
    promiseHeading: "ما نتعهد به",
    promiseOptIn: "نراسلك فقط في المواضيع التي اشتركت فيها صراحةً.",
    promiseSuppress: "نوقف الإرسال عندما نلاحظ مشكلات نشطة في الدعم أو الثقة أو الفوترة.",
    promiseNoInvent: "لا نختلق إحصاءات أو شهادات أو إلحاحًا.",
    promiseUnsubscribe: "يحمل كل بريد إلكتروني رابط إلغاء اشتراك فعّالًا.",
  },
  preferences: {
    pauseTitle: "إيقاف جميع الرسائل الترويجية مؤقتًا",
    pauseHint:
      "ستظل تتلقى رسائل المعاملات (الإيصالات والتحقق والشحن)، لكن دون النشرات الإخبارية.",
    savingLabel: "جارٍ الحفظ…",
    saveLabel: "حفظ التفضيلات",
    unsubscribeAllLabel: "إلغاء الاشتراك من الكل",
    savedTitle: "تم حفظ التفضيلات.",
    unsubscribedBody: "تم إلغاء اشتراكك. يؤسفنا رحيلك.",
    subscribedBody: (topics: string) => `مشترك في: ${topics}.`,
    subscribedNone: "لا شيء",
    errorSave: "تعذّر حفظ التفضيلات.",
    errorNetwork: "خطأ في الشبكة",
  },
  prefPage: {
    metaTitle: "إدارة تفضيلات النشرة الإخبارية — Henry & Co.",
    metaDescription:
      "حدّث أيّ نشرات HenryCo الإخبارية تتلقاها، أوقف الرسائل الترويجية مؤقتًا، أو ألغِ الاشتراك بالكامل.",
    missingTitle: "رابط التفضيلات مفقود",
    missingBody:
      "افتح رابط «إدارة التفضيلات» من أي بريد إلكتروني من HenryCo للوصول إلى هنا برمز صالح. إذا انتهت صلاحية رابطك، فاشترك مرة أخرى وسنُصدر رابطًا جديدًا.",
    expiredTitle: "انتهت صلاحية الرابط",
    notValidTitle: "الرابط غير صالح",
    kicker: "مركز التفضيلات",
    title: "تفضيلات نشرتك الإخبارية",
    signedInPrefix: "مسجّل الدخول باسم",
    signedInSuffix: "تنطبق التغييرات على جميع أقسام HenryCo.",
  },
  search: {
    metaTitle: "البحث في HenryCo",
    metaDescription: "ابحث في أقسام HenryCo وسير العمل ومسارات الدعم من مركز واحد.",
    title: "ابحث في HenryCo عبر الأقسام وسير العمل ومسارات المساعدة.",
    description: "اعثر على الأقسام وسير عمل الحساب ومسارات الدعم من نقطة دخول هادئة واحدة.",
    placeholder:
      "ابحث في HenryCo: الإشعارات، المحفظة، طلبات السوق، مساعدة الوظائف، تتبّع الشحن...",
    signInLabel: "سجّل الدخول وتابع البحث",
  },
};

const DE: DeepPartial<HubNewsletterCopy> = {
  divisions: {
    hub: "HenryCo Group",
    account: "Konto",
    care: "Care",
    jobs: "Jobs",
    learn: "Learn",
    logistics: "Logistics",
    marketplace: "Marketplace",
    property: "Property",
    studio: "Studio",
  },
  signup: {
    successSubscribedTitle: "Sie sind angemeldet",
    successUpdatedTitle: "Einstellungen aktualisiert",
    successBody: (email: string, topics: string) =>
      `Wir schreiben an ${email} zu: ${topics}.`,
    managePrefsPrefix: "Verwalten Sie Ihre Einstellungen jederzeit:",
    openPreferenceCenter: "Präferenzcenter öffnen",
    emailLabel: "E-Mail-Adresse",
    emailPlaceholder: "sie@beispiel.com",
    countryLabel: "Land (2 Buchstaben, optional)",
    countryPlaceholder: "NG",
    pickHeading: "Wählen Sie, worüber Sie informiert werden möchten",
    pickHint: "Sie können jede dieser Optionen später ändern oder entfernen.",
    consent:
      "Ich willige ein, diese Newsletter von HenryCo zu erhalten. Mir ist bewusst, dass ich mich jederzeit abmelden kann und dass HenryCo den Versand bei aktiven Support- oder Abrechnungsproblemen aussetzt.",
    submittingLabel: "Anmeldung…",
    subscribeLabel: "Abonnieren",
    errorSuppressed: "Diese Adresse steht auf unserer Sperrliste.",
    errorGeneric: "Etwas ist schiefgelaufen. Bitte erneut versuchen.",
    errorNetwork: "Netzwerkfehler",
  },
  page: {
    metaTitle: "Newsletter — Henry & Co.",
    metaDescription:
      "Abonnieren Sie die HenryCo-Newsletter. Wählen Sie, was nützlich ist, überspringen Sie den Rest. Jederzeit abbestellbar.",
    kicker: "Editorial",
    title: "Newsletter, sorgfältig ausgewählt",
    intro:
      "Wir senden lieber weniger, dafür mit Bedeutung. Wählen Sie unten ein oder mehrere Themen. Sie können Ihre Einstellungen verwalten oder sich von jeder E-Mail abmelden, die wir senden.",
    promiseHeading: "Was wir versprechen",
    promiseOptIn: "Wir schreiben Ihnen nur zu Themen, denen Sie ausdrücklich zugestimmt haben.",
    promiseSuppress:
      "Wir setzen den Versand aus, wenn wir aktive Support-, Vertrauens- oder Abrechnungsprobleme feststellen.",
    promiseNoInvent: "Wir erfinden keine Statistiken, Erfahrungsberichte oder Dringlichkeit.",
    promiseUnsubscribe: "Jede E-Mail enthält einen funktionierenden Abmeldelink.",
  },
  preferences: {
    pauseTitle: "Alle Werbesendungen pausieren",
    pauseHint:
      "Sie erhalten weiterhin transaktionale E-Mails (Belege, Verifizierung, Versand), nur keine Newsletter.",
    savingLabel: "Wird gespeichert…",
    saveLabel: "Einstellungen speichern",
    unsubscribeAllLabel: "Alles abbestellen",
    savedTitle: "Einstellungen gespeichert.",
    unsubscribedBody: "Sie wurden abgemeldet. Schade, dass Sie gehen.",
    subscribedBody: (topics: string) => `Abonniert: ${topics}.`,
    subscribedNone: "nichts",
    errorSave: "Einstellungen konnten nicht gespeichert werden.",
    errorNetwork: "Netzwerkfehler",
  },
  prefPage: {
    metaTitle: "Newsletter-Einstellungen verwalten — Henry & Co.",
    metaDescription:
      "Aktualisieren Sie, welche HenryCo-Newsletter Sie erhalten, pausieren Sie Werbesendungen oder melden Sie sich vollständig ab.",
    missingTitle: "Einstellungslink fehlt",
    missingBody:
      "Öffnen Sie den Link „Einstellungen verwalten“ aus einer beliebigen HenryCo-E-Mail, um mit einem gültigen Token hierher zu gelangen. Falls Ihr Link abgelaufen ist, abonnieren Sie erneut und wir stellen einen neuen aus.",
    expiredTitle: "Link abgelaufen",
    notValidTitle: "Link ungültig",
    kicker: "Präferenzcenter",
    title: "Ihre Newsletter-Einstellungen",
    signedInPrefix: "Angemeldet als",
    signedInSuffix: "Änderungen gelten für alle HenryCo-Bereiche.",
  },
  search: {
    metaTitle: "HenryCo durchsuchen",
    metaDescription:
      "Durchsuchen Sie HenryCo-Bereiche, Workflows und Support-Wege von einem Hub aus.",
    title: "Durchsuchen Sie HenryCo nach Bereichen, Workflows und Hilfewegen.",
    description:
      "Finden Sie Bereiche, Konto-Workflows und Support-Wege von einem ruhigen Einstiegspunkt aus.",
    placeholder:
      "HenryCo durchsuchen: Benachrichtigungen, Wallet, Marketplace-Bestellungen, Jobs-Hilfe, Logistik-Tracking...",
    signInLabel: "Anmelden und Suche fortsetzen",
  },
};

const IT: DeepPartial<HubNewsletterCopy> = {
  divisions: {
    hub: "HenryCo Group",
    account: "Account",
    care: "Care",
    jobs: "Jobs",
    learn: "Learn",
    logistics: "Logistics",
    marketplace: "Marketplace",
    property: "Property",
    studio: "Studio",
  },
  signup: {
    successSubscribedTitle: "Iscrizione completata",
    successUpdatedTitle: "Preferenze aggiornate",
    successBody: (email: string, topics: string) =>
      `Ti scriveremo all'indirizzo ${email} riguardo a: ${topics}.`,
    managePrefsPrefix: "Gestisci le tue preferenze in qualsiasi momento:",
    openPreferenceCenter: "apri il centro preferenze",
    emailLabel: "Indirizzo email",
    emailPlaceholder: "tu@esempio.com",
    countryLabel: "Paese (2 lettere, facoltativo)",
    countryPlaceholder: "NG",
    pickHeading: "Scegli di cosa vuoi ricevere notizie",
    pickHint: "Potrai modificare o rimuovere queste opzioni in seguito.",
    consent:
      "Accetto di ricevere queste newsletter da HenryCo. Comprendo di poter annullare l'iscrizione in qualsiasi momento e che HenryCo sospenderà gli invii in caso di problemi attivi di assistenza o fatturazione.",
    submittingLabel: "Iscrizione in corso…",
    subscribeLabel: "Iscriviti",
    errorSuppressed: "Questo indirizzo è nella nostra lista di soppressione.",
    errorGeneric: "Qualcosa è andato storto. Riprova.",
    errorNetwork: "Errore di rete",
  },
  page: {
    metaTitle: "Newsletter — Henry & Co.",
    metaDescription:
      "Iscriviti alle newsletter di HenryCo. Scegli ciò che è utile, salta il resto. Annulla l'iscrizione in qualsiasi momento.",
    kicker: "Editoriale",
    title: "Newsletter, scelte con cura",
    intro:
      "Preferiamo inviarne meno e che contino. Scegli uno o più argomenti qui sotto. Puoi gestire le preferenze o annullare l'iscrizione a ogni email che inviamo.",
    promiseHeading: "Cosa promettiamo",
    promiseOptIn: "Ti scriviamo solo sugli argomenti a cui hai esplicitamente aderito.",
    promiseSuppress:
      "Sospendiamo gli invii quando rileviamo problemi attivi di assistenza, fiducia o fatturazione.",
    promiseNoInvent: "Non inventiamo statistiche, testimonianze o urgenza.",
    promiseUnsubscribe: "Ogni email contiene un link di annullamento funzionante.",
  },
  preferences: {
    pauseTitle: "Sospendi tutti gli invii promozionali",
    pauseHint:
      "Continuerai a ricevere le email transazionali (ricevute, verifica, spedizione), ma non le newsletter.",
    savingLabel: "Salvataggio…",
    saveLabel: "Salva preferenze",
    unsubscribeAllLabel: "Annulla l'iscrizione a tutto",
    savedTitle: "Preferenze salvate.",
    unsubscribedBody: "Sei stato disiscritto. Ci dispiace vederti andare via.",
    subscribedBody: (topics: string) => `Iscritto a: ${topics}.`,
    subscribedNone: "nulla",
    errorSave: "Impossibile salvare le preferenze.",
    errorNetwork: "Errore di rete",
  },
  prefPage: {
    metaTitle: "Gestisci le preferenze della newsletter — Henry & Co.",
    metaDescription:
      "Aggiorna quali newsletter di HenryCo ricevi, sospendi gli invii promozionali o annulla del tutto l'iscrizione.",
    missingTitle: "Link delle preferenze mancante",
    missingBody:
      "Apri il link «Gestisci preferenze» da qualsiasi email di HenryCo per arrivare qui con un token valido. Se il tuo link è scaduto, iscriviti di nuovo e ne emetteremo uno nuovo.",
    expiredTitle: "Link scaduto",
    notValidTitle: "Link non valido",
    kicker: "Centro preferenze",
    title: "Le tue preferenze della newsletter",
    signedInPrefix: "Accesso effettuato come",
    signedInSuffix: "Le modifiche si applicano a tutte le divisioni HenryCo.",
  },
  search: {
    metaTitle: "Cerca in HenryCo",
    metaDescription:
      "Cerca divisioni, flussi di lavoro e percorsi di assistenza di HenryCo da un unico hub.",
    title: "Cerca in HenryCo tra divisioni, flussi di lavoro e percorsi di aiuto.",
    description:
      "Trova divisioni, flussi di lavoro dell'account e percorsi di assistenza da un unico punto di accesso sereno.",
    placeholder:
      "Cerca in HenryCo: notifiche, wallet, ordini del marketplace, aiuto jobs, tracciamento logistico...",
    signInLabel: "Accedi e continua la ricerca",
  },
};

const ZH: DeepPartial<HubNewsletterCopy> = {
  divisions: {
    hub: "HenryCo Group",
    account: "账户",
    care: "Care",
    jobs: "Jobs",
    learn: "Learn",
    logistics: "Logistics",
    marketplace: "Marketplace",
    property: "Property",
    studio: "Studio",
  },
  signup: {
    successSubscribedTitle: "您已订阅",
    successUpdatedTitle: "偏好设置已更新",
    successBody: (email: string, topics: string) =>
      `我们将就以下内容向 ${email} 发送邮件：${topics}。`,
    managePrefsPrefix: "随时管理您的偏好设置：",
    openPreferenceCenter: "打开偏好中心",
    emailLabel: "电子邮件地址",
    emailPlaceholder: "you@example.com",
    countryLabel: "国家/地区（2 个字母，可选）",
    countryPlaceholder: "NG",
    pickHeading: "选择您希望了解的内容",
    pickHint: "您可以稍后更改或删除其中任何一项。",
    consent:
      "我同意接收来自 HenryCo 的这些新闻通讯。我了解可以随时取消订阅，并且 HenryCo 在出现活跃的支持或账单问题期间将暂停发送。",
    submittingLabel: "正在订阅…",
    subscribeLabel: "订阅",
    errorSuppressed: "该地址在我们的禁发列表中。",
    errorGeneric: "出了点问题。请重试。",
    errorNetwork: "网络错误",
  },
  page: {
    metaTitle: "新闻通讯 — Henry & Co.",
    metaDescription:
      "订阅 HenryCo 新闻通讯。选择有用的内容，跳过不需要的内容。随时可取消订阅。",
    kicker: "编辑精选",
    title: "精心挑选的新闻通讯",
    intro:
      "我们宁愿少发，但要有价值。请在下方选择一个或多个主题。您可以管理偏好设置，或取消订阅我们发送的每一封邮件。",
    promiseHeading: "我们的承诺",
    promiseOptIn: "我们只会就您明确选择订阅的主题向您发送邮件。",
    promiseSuppress: "当我们发现活跃的支持、信任或账单问题时，会暂停发送。",
    promiseNoInvent: "我们不会编造数据、推荐语或紧迫感。",
    promiseUnsubscribe: "每封邮件都附有可用的取消订阅链接。",
  },
  preferences: {
    pauseTitle: "暂停所有推广邮件",
    pauseHint: "您仍会收到事务性邮件（收据、验证、发货），只是不会收到新闻通讯。",
    savingLabel: "正在保存…",
    saveLabel: "保存偏好设置",
    unsubscribeAllLabel: "取消订阅全部",
    savedTitle: "偏好设置已保存。",
    unsubscribedBody: "您已取消订阅。很遗憾看到您离开。",
    subscribedBody: (topics: string) => `已订阅：${topics}。`,
    subscribedNone: "无",
    errorSave: "无法保存偏好设置。",
    errorNetwork: "网络错误",
  },
  prefPage: {
    metaTitle: "管理新闻通讯偏好 — Henry & Co.",
    metaDescription:
      "更新您接收的 HenryCo 新闻通讯，暂停推广邮件，或完全取消订阅。",
    missingTitle: "缺少偏好设置链接",
    missingBody:
      "请从任意一封 HenryCo 邮件中打开“管理偏好”链接，以便携带有效令牌进入此页面。如果您的链接已过期，请重新订阅，我们将签发新的链接。",
    expiredTitle: "链接已过期",
    notValidTitle: "链接无效",
    kicker: "偏好中心",
    title: "您的新闻通讯偏好",
    signedInPrefix: "登录身份：",
    signedInSuffix: "更改将应用于所有 HenryCo 部门。",
  },
  search: {
    metaTitle: "搜索 HenryCo",
    metaDescription: "在一个中心内搜索 HenryCo 的各个部门、工作流程和支持渠道。",
    title: "在 HenryCo 中跨部门、工作流程和帮助渠道进行搜索。",
    description: "从一个宁静的入口找到各个部门、账户工作流程和支持渠道。",
    placeholder: "搜索 HenryCo：通知、钱包、商城订单、招聘帮助、物流跟踪……",
    signInLabel: "登录并继续搜索",
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<HubNewsletterCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
};
// ig, yo, ha, hi are intentionally OMITTED -> fall back to EN (human-translation only).

export function getHubNewsletterCopy(locale: AppLocale): HubNewsletterCopy {
  const o = LOCALE_MAP[locale];
  if (o)
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      o as unknown as Record<string, unknown>,
    ) as unknown as HubNewsletterCopy;
  return EN;
}
