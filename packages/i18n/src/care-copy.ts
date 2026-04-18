import type { AppLocale } from "./locales";
import { deepMergeMessages } from "./merge-messages";

export type CareCopy = {
  nav: {
    home: string;
    book: string;
    track: string;
    review: string;
    account: string;
  };
  hero: {
    title: string;
    subtitle: string;
    ctaBook: string;
    ctaTrack: string;
  };
  booking: {
    title: string;
    serviceLabel: string;
    dateLabel: string;
    timeLabel: string;
    nameLabel: string;
    phoneLabel: string;
    emailLabel: string;
    addressLabel: string;
    notesLabel: string;
    submitButton: string;
    confirmationHeading: string;
    confirmationBody: string;
    trackingCodeLabel: string;
  };
  tracking: {
    title: string;
    codeLabel: string;
    phoneLabel: string;
    submitButton: string;
    notFound: string;
    statusLabel: string;
    lastUpdatedLabel: string;
    estimatedLabel: string;
  };
  status: {
    pending: string;
    confirmed: string;
    collected: string;
    inProgress: string;
    readyForDelivery: string;
    outForDelivery: string;
    delivered: string;
    completed: string;
    cancelled: string;
  };
  review: {
    title: string;
    ratingLabel: string;
    textLabel: string;
    photoLabel: string;
    submitButton: string;
    successMessage: string;
    pendingApproval: string;
  };
  serviceTypes: {
    laundry: string;
    drycleaning: string;
    ironing: string;
    alterations: string;
    homeCleaning: string;
    officeCleaning: string;
  };
};

const EN: CareCopy = {
  nav: {
    home: "Home",
    book: "Book",
    track: "Track",
    review: "Leave a review",
    account: "Account",
  },
  hero: {
    title: "Care that shows up, every time.",
    subtitle: "Garment care, home cleaning, and workplace upkeep with clearer booking, steadier tracking, and calmer support.",
    ctaBook: "Book a service",
    ctaTrack: "Track a booking",
  },
  booking: {
    title: "Book a service",
    serviceLabel: "Service type",
    dateLabel: "Preferred date",
    timeLabel: "Preferred time",
    nameLabel: "Full name",
    phoneLabel: "Phone number",
    emailLabel: "Email address",
    addressLabel: "Pickup address",
    notesLabel: "Additional notes",
    submitButton: "Request booking",
    confirmationHeading: "Booking request received",
    confirmationBody: "We will confirm your booking shortly. Keep your tracking code safe.",
    trackingCodeLabel: "Your tracking code",
  },
  tracking: {
    title: "Track your booking",
    codeLabel: "Tracking code",
    phoneLabel: "Phone number",
    submitButton: "Check status",
    notFound: "No booking found for that code and phone number.",
    statusLabel: "Current status",
    lastUpdatedLabel: "Last updated",
    estimatedLabel: "Estimated completion",
  },
  status: {
    pending: "Pending",
    confirmed: "Confirmed",
    collected: "Collected",
    inProgress: "In progress",
    readyForDelivery: "Ready for delivery",
    outForDelivery: "Out for delivery",
    delivered: "Delivered",
    completed: "Completed",
    cancelled: "Cancelled",
  },
  review: {
    title: "Share your experience",
    ratingLabel: "Overall rating",
    textLabel: "Your review",
    photoLabel: "Add a photo (optional)",
    submitButton: "Submit review",
    successMessage: "Thank you. Your review has been submitted and is awaiting approval.",
    pendingApproval: "Awaiting approval",
  },
  serviceTypes: {
    laundry: "Laundry",
    drycleaning: "Dry cleaning",
    ironing: "Ironing",
    alterations: "Alterations",
    homeCleaning: "Home cleaning",
    officeCleaning: "Office cleaning",
  },
};

const FR: Partial<CareCopy> = {
  nav: {
    home: "Accueil",
    book: "Réserver",
    track: "Suivre",
    review: "Laisser un avis",
    account: "Compte",
  },
  hero: {
    title: "Un soin qui arrive toujours.",
    subtitle: "Entretien vêtements, nettoyage à domicile et entretien bureau avec une réservation plus claire, un suivi plus stable et un support plus serein.",
    ctaBook: "Réserver un service",
    ctaTrack: "Suivre une réservation",
  },
  booking: {
    title: "Réserver un service",
    serviceLabel: "Type de service",
    dateLabel: "Date souhaitée",
    timeLabel: "Heure souhaitée",
    nameLabel: "Nom complet",
    phoneLabel: "Numéro de téléphone",
    emailLabel: "Adresse e-mail",
    addressLabel: "Adresse de collecte",
    notesLabel: "Notes supplémentaires",
    submitButton: "Demander une réservation",
    confirmationHeading: "Demande de réservation reçue",
    confirmationBody: "Nous confirmerons votre réservation sous peu. Conservez votre code de suivi.",
    trackingCodeLabel: "Votre code de suivi",
  },
  tracking: {
    title: "Suivre votre réservation",
    codeLabel: "Code de suivi",
    phoneLabel: "Numéro de téléphone",
    submitButton: "Vérifier le statut",
    notFound: "Aucune réservation trouvée pour ce code et numéro de téléphone.",
    statusLabel: "Statut actuel",
    lastUpdatedLabel: "Dernière mise à jour",
    estimatedLabel: "Fin estimée",
  },
  status: {
    pending: "En attente",
    confirmed: "Confirmé",
    collected: "Collecté",
    inProgress: "En cours",
    readyForDelivery: "Prêt pour livraison",
    outForDelivery: "En cours de livraison",
    delivered: "Livré",
    completed: "Terminé",
    cancelled: "Annulé",
  },
  review: {
    title: "Partagez votre expérience",
    ratingLabel: "Note globale",
    textLabel: "Votre avis",
    photoLabel: "Ajouter une photo (optionnel)",
    submitButton: "Soumettre l'avis",
    successMessage: "Merci. Votre avis a été soumis et attend approbation.",
    pendingApproval: "En attente d'approbation",
  },
  serviceTypes: {
    laundry: "Lavage",
    drycleaning: "Nettoyage à sec",
    ironing: "Repassage",
    alterations: "Retouches",
    homeCleaning: "Ménage",
    officeCleaning: "Nettoyage de bureau",
  },
};

const ES: Partial<CareCopy> = {
  nav: {
    home: "Inicio",
    book: "Reservar",
    track: "Seguimiento",
    review: "Dejar una reseña",
    account: "Cuenta",
  },
  hero: {
    title: "El cuidado que llega, siempre.",
    subtitle: "Cuidado de ropa, limpieza del hogar y mantenimiento del lugar de trabajo con reservas más claras, seguimiento más estable y soporte más tranquilo.",
    ctaBook: "Reservar un servicio",
    ctaTrack: "Seguir una reserva",
  },
  booking: {
    title: "Reservar un servicio",
    serviceLabel: "Tipo de servicio",
    dateLabel: "Fecha preferida",
    timeLabel: "Hora preferida",
    nameLabel: "Nombre completo",
    phoneLabel: "Número de teléfono",
    emailLabel: "Correo electrónico",
    addressLabel: "Dirección de recogida",
    notesLabel: "Notas adicionales",
    submitButton: "Solicitar reserva",
    confirmationHeading: "Solicitud de reserva recibida",
    confirmationBody: "Confirmaremos tu reserva en breve. Guarda tu código de seguimiento.",
    trackingCodeLabel: "Tu código de seguimiento",
  },
  tracking: {
    title: "Seguir tu reserva",
    codeLabel: "Código de seguimiento",
    phoneLabel: "Número de teléfono",
    submitButton: "Verificar estado",
    notFound: "No se encontró ninguna reserva para ese código y número de teléfono.",
    statusLabel: "Estado actual",
    lastUpdatedLabel: "Última actualización",
    estimatedLabel: "Finalización estimada",
  },
  status: {
    pending: "Pendiente",
    confirmed: "Confirmado",
    collected: "Recogido",
    inProgress: "En progreso",
    readyForDelivery: "Listo para entrega",
    outForDelivery: "En camino",
    delivered: "Entregado",
    completed: "Completado",
    cancelled: "Cancelado",
  },
  review: {
    title: "Comparte tu experiencia",
    ratingLabel: "Calificación general",
    textLabel: "Tu reseña",
    photoLabel: "Agregar una foto (opcional)",
    submitButton: "Enviar reseña",
    successMessage: "Gracias. Tu reseña ha sido enviada y está esperando aprobación.",
    pendingApproval: "Esperando aprobación",
  },
  serviceTypes: {
    laundry: "Lavandería",
    drycleaning: "Limpieza en seco",
    ironing: "Planchado",
    alterations: "Arreglos",
    homeCleaning: "Limpieza del hogar",
    officeCleaning: "Limpieza de oficina",
  },
};

const PT: Partial<CareCopy> = {
  nav: {
    home: "Início",
    book: "Reservar",
    track: "Rastrear",
    review: "Deixar avaliação",
    account: "Conta",
  },
  hero: {
    title: "O cuidado que aparece, sempre.",
    subtitle: "Cuidado de roupas, limpeza doméstica e manutenção do escritório com reservas mais claras, rastreamento mais estável e suporte mais tranquilo.",
    ctaBook: "Reservar um serviço",
    ctaTrack: "Rastrear uma reserva",
  },
  booking: {
    title: "Reservar um serviço",
    serviceLabel: "Tipo de serviço",
    dateLabel: "Data preferida",
    timeLabel: "Horário preferido",
    nameLabel: "Nome completo",
    phoneLabel: "Número de telefone",
    emailLabel: "Endereço de e-mail",
    addressLabel: "Endereço de coleta",
    notesLabel: "Notas adicionais",
    submitButton: "Solicitar reserva",
    confirmationHeading: "Solicitação de reserva recebida",
    confirmationBody: "Confirmaremos sua reserva em breve. Guarde seu código de rastreamento.",
    trackingCodeLabel: "Seu código de rastreamento",
  },
  tracking: {
    title: "Rastrear sua reserva",
    codeLabel: "Código de rastreamento",
    phoneLabel: "Número de telefone",
    submitButton: "Verificar status",
    notFound: "Nenhuma reserva encontrada para esse código e número de telefone.",
    statusLabel: "Status atual",
    lastUpdatedLabel: "Última atualização",
    estimatedLabel: "Conclusão estimada",
  },
  status: {
    pending: "Pendente",
    confirmed: "Confirmado",
    collected: "Coletado",
    inProgress: "Em andamento",
    readyForDelivery: "Pronto para entrega",
    outForDelivery: "Em rota de entrega",
    delivered: "Entregue",
    completed: "Concluído",
    cancelled: "Cancelado",
  },
  review: {
    title: "Compartilhe sua experiência",
    ratingLabel: "Avaliação geral",
    textLabel: "Sua avaliação",
    photoLabel: "Adicionar uma foto (opcional)",
    submitButton: "Enviar avaliação",
    successMessage: "Obrigado. Sua avaliação foi enviada e está aguardando aprovação.",
    pendingApproval: "Aguardando aprovação",
  },
  serviceTypes: {
    laundry: "Lavanderia",
    drycleaning: "Lavagem a seco",
    ironing: "Passagem a ferro",
    alterations: "Ajustes",
    homeCleaning: "Limpeza residencial",
    officeCleaning: "Limpeza de escritório",
  },
};

const AR: Partial<CareCopy> = {
  nav: {
    home: "الرئيسية",
    book: "احجز",
    track: "تتبع",
    review: "اترك تقييماً",
    account: "الحساب",
  },
  hero: {
    title: "رعاية تصل في كل مرة.",
    subtitle: "رعاية الملابس وتنظيف المنازل وصيانة مكان العمل مع حجز أوضح وتتبع أكثر استقراراً ودعم أكثر هدوءاً.",
    ctaBook: "احجز خدمة",
    ctaTrack: "تتبع حجزاً",
  },
  booking: {
    title: "احجز خدمة",
    serviceLabel: "نوع الخدمة",
    dateLabel: "التاريخ المفضل",
    timeLabel: "الوقت المفضل",
    nameLabel: "الاسم الكامل",
    phoneLabel: "رقم الهاتف",
    emailLabel: "البريد الإلكتروني",
    addressLabel: "عنوان الاستلام",
    notesLabel: "ملاحظات إضافية",
    submitButton: "طلب حجز",
    confirmationHeading: "تم استلام طلب الحجز",
    confirmationBody: "سنؤكد حجزك قريباً. احتفظ برمز التتبع الخاص بك.",
    trackingCodeLabel: "رمز التتبع الخاص بك",
  },
  tracking: {
    title: "تتبع حجزك",
    codeLabel: "رمز التتبع",
    phoneLabel: "رقم الهاتف",
    submitButton: "فحص الحالة",
    notFound: "لم يتم العثور على حجز لهذا الرمز ورقم الهاتف.",
    statusLabel: "الحالة الحالية",
    lastUpdatedLabel: "آخر تحديث",
    estimatedLabel: "الإتمام المتوقع",
  },
  status: {
    pending: "قيد الانتظار",
    confirmed: "مؤكد",
    collected: "تم الاستلام",
    inProgress: "قيد التنفيذ",
    readyForDelivery: "جاهز للتسليم",
    outForDelivery: "في الطريق للتسليم",
    delivered: "تم التوصيل",
    completed: "مكتمل",
    cancelled: "ملغي",
  },
  review: {
    title: "شارك تجربتك",
    ratingLabel: "التقييم العام",
    textLabel: "تقييمك",
    photoLabel: "إضافة صورة (اختياري)",
    submitButton: "إرسال التقييم",
    successMessage: "شكراً. تم إرسال تقييمك وهو في انتظار الموافقة.",
    pendingApproval: "في انتظار الموافقة",
  },
  serviceTypes: {
    laundry: "غسيل الملابس",
    drycleaning: "التنظيف الجاف",
    ironing: "كي الملابس",
    alterations: "تعديلات",
    homeCleaning: "تنظيف المنزل",
    officeCleaning: "تنظيف المكتب",
  },
};

const IG: Partial<CareCopy> = {
  nav: {
    home: "Ụlọ",
    book: "Dee",
    track: "Śle",
    review: "Hapụ nnyocha",
    account: "Akaụntụ",
  },
  hero: {
    title: "Nlekọta na-abịa, n'oge ọ bụla.",
    subtitle: "Nlekọta akwa, ịkọcha ụlọ, na ọrụ ọkwa, nwere ndeede dị mfe, śle nke ọma, na nkwado dị jụụ.",
    ctaBook: "Dee ọrụ",
    ctaTrack: "Śle ndeede",
  },
  booking: {
    title: "Dee ọrụ",
    serviceLabel: "Ụdị ọrụ",
    dateLabel: "Ụbọchị ọ masịrị",
    timeLabel: "Oge ọ masịrị",
    nameLabel: "Aha zuru oke",
    phoneLabel: "Nọmba ekwentị",
    emailLabel: "Adreesị ozi-email",
    addressLabel: "Adreesị iwepu",
    notesLabel: "Ntụaka ndị ọzọ",
    submitButton: "Rịọ ndeede",
    confirmationHeading: "Rịọ ndeede natara",
    confirmationBody: "Anyị ga-ekwe nkwenye ndeede gị n'oge na-adịghị anya. Debe koodu śle gị.",
    trackingCodeLabel: "Koodu śle gị",
  },
  tracking: {
    title: "Śle ndeede gị",
    codeLabel: "Koodu śle",
    phoneLabel: "Nọmba ekwentị",
    submitButton: "Lelee ọnọdụ",
    notFound: "Enweghị ndeede maka koodu na nọmba ekwentị ahụ.",
    statusLabel: "Ọnọdụ ugbu a",
    lastUpdatedLabel: "Emelitere ikpeazụ",
    estimatedLabel: "Mmecha a tọrọ atọ",
  },
  status: {
    pending: "Na-atọ",
    confirmed: "Kwenyere",
    collected: "Achịkọtara",
    inProgress: "Na-aga n'ihu",
    readyForDelivery: "Dị njikere maka nnyefe",
    outForDelivery: "Na-aga n'ụzọ",
    delivered: "Enyela",
    completed: "Emechara",
    cancelled: "Kagbuo",
  },
  review: {
    title: "Kọọ ahụmahụ gị",
    ratingLabel: "Nkwupụta niile",
    textLabel: "Nnyocha gị",
    photoLabel: "Tinye foto (ọ dịghị mkpa)",
    submitButton: "Tinye nnyocha",
    successMessage: "Daalụ. A tinyela nnyocha gị ma ọ na-atọ ugwo.",
    pendingApproval: "Na-atọ ugwo",
  },
  serviceTypes: {
    laundry: "Ịsa akwa",
    drycleaning: "Ịkọcha ọkụ",
    ironing: "Igwu akwa",
    alterations: "Mgbanwe",
    homeCleaning: "Ịkọcha ụlọ",
    officeCleaning: "Ịkọcha ọfịs",
  },
};

const YO: Partial<CareCopy> = {
  nav: {
    home: "Ile",
    book: "Gbe",
    track: "Tẹle",
    review: "Fi ero silẹ",
    account: "Akọọlẹ",
  },
  hero: {
    title: "Abojuto ti o han gbangba, nigbagbogbo.",
    subtitle: "Itọju aṣọ, mimọ ile, ati itọju ibi iṣẹ pẹlu ifiṣura ti o rọrun, itọpa ti o duro, ati atilẹyin ti o dakẹ.",
    ctaBook: "Gbe iṣẹ",
    ctaTrack: "Tẹle ifiṣura",
  },
  booking: {
    title: "Gbe iṣẹ",
    serviceLabel: "Iru iṣẹ",
    dateLabel: "Ọjọ ayanfẹ",
    timeLabel: "Akoko ayanfẹ",
    nameLabel: "Orukọ kíkún",
    phoneLabel: "Nọmba foonu",
    emailLabel: "Adirẹsi imeeli",
    addressLabel: "Adirẹsi gbigba",
    notesLabel: "Awọn akọsilẹ miiran",
    submitButton: "Beere ifiṣura",
    confirmationHeading: "Beere ifiṣura ti gba",
    confirmationBody: "A ó jẹrisi ifiṣura rẹ laipẹ. Pa koodu itọpa rẹ pamọ.",
    trackingCodeLabel: "Koodu itọpa rẹ",
  },
  tracking: {
    title: "Tẹle ifiṣura rẹ",
    codeLabel: "Koodu itọpa",
    phoneLabel: "Nọmba foonu",
    submitButton: "Ṣayẹwo ipo",
    notFound: "Ko si ifiṣura fun koodu ati nọmba foonu yẹn.",
    statusLabel: "Ipo lọwọlọwọ",
    lastUpdatedLabel: "Ìgbẹ̀yìn ìmúdójúìwọ̀n",
    estimatedLabel: "Ipari ti a reti",
  },
  status: {
    pending: "Nduro",
    confirmed: "Ti jẹrisi",
    collected: "Ti gba",
    inProgress: "Ni ilọsiwaju",
    readyForDelivery: "Ṣetan fun ifiṣẹ",
    outForDelivery: "Wa ọna ifiṣẹ",
    delivered: "Ti fi jiṣẹ",
    completed: "Ti pari",
    cancelled: "Ti fagilee",
  },
  review: {
    title: "Pin iriri rẹ",
    ratingLabel: "Idiyele gbogbogbo",
    textLabel: "Atunwo rẹ",
    photoLabel: "Fi fọto kun (aṣayan)",
    submitButton: "Fi atunwo silẹ",
    successMessage: "E dupe. Atunwo rẹ ti fi silẹ ati pe o n duro fun ifọwọsi.",
    pendingApproval: "Nduro fun ifọwọsi",
  },
  serviceTypes: {
    laundry: "Fifọ aṣọ",
    drycleaning: "Mimọ gbigbẹ",
    ironing: "Airin aṣọ",
    alterations: "Atunṣe aṣọ",
    homeCleaning: "Mimọ ile",
    officeCleaning: "Mimọ ọfiisi",
  },
};

const HA: Partial<CareCopy> = {
  nav: {
    home: "Gida",
    book: "Yi Ajiya",
    track: "Bi Didiga",
    review: "Bar ra'ayi",
    account: "Asusun",
  },
  hero: {
    title: "Kula da ke zuwa, koyaushe.",
    subtitle: "Kula da tufafi, tsaftace gida, da kula da wurin aiki tare da ajiya mai sauƙi, bin didiga mai inganci, da taimako mai nutsuwa.",
    ctaBook: "Yi ajiyar sabis",
    ctaTrack: "Bi didiga ajiya",
  },
  booking: {
    title: "Yi ajiyar sabis",
    serviceLabel: "Nau'in sabis",
    dateLabel: "Ranar da ake so",
    timeLabel: "Lokacin da ake so",
    nameLabel: "Cikakken suna",
    phoneLabel: "Lambar wayar salula",
    emailLabel: "Adireshin imel",
    addressLabel: "Adireshin karɓa",
    notesLabel: "Ƙarin bayani",
    submitButton: "Nemi ajiya",
    confirmationHeading: "An karɓi buƙatar ajiya",
    confirmationBody: "Za mu tabbatar da ajiyarka nan ba da jimawa ba. Kiyaye lambar bin-didiga.",
    trackingCodeLabel: "Lambar bin-didiga",
  },
  tracking: {
    title: "Bi didiga ajiyarka",
    codeLabel: "Lambar bin-didiga",
    phoneLabel: "Lambar wayar salula",
    submitButton: "Duba halin",
    notFound: "Ba a sami ajiya ba ga wannan lambar da wayar salula.",
    statusLabel: "Halin yanzu",
    lastUpdatedLabel: "Ƙarshen sabuntawa",
    estimatedLabel: "Ƙarshen da aka kiyasta",
  },
  status: {
    pending: "A tsallake",
    confirmed: "An tabbatar",
    collected: "An tattara",
    inProgress: "Ana ci gaba",
    readyForDelivery: "Shirye don isar da shi",
    outForDelivery: "Yana kan hanya",
    delivered: "An isar da shi",
    completed: "An gama",
    cancelled: "An soke",
  },
  review: {
    title: "Raba kwarewar ka",
    ratingLabel: "Gabaɗaya tantancewa",
    textLabel: "Ra'ayinka",
    photoLabel: "Ƙara hoto (zaɓi)",
    submitButton: "Aika ra'ayi",
    successMessage: "Na gode. An aika ra'ayinka kuma yana jiran amincewar.",
    pendingApproval: "Yana jiran amincewa",
  },
  serviceTypes: {
    laundry: "Wanke tufafi",
    drycleaning: "Tsabtace bushe",
    ironing: "Yin pressing",
    alterations: "Gyaggyarawa",
    homeCleaning: "Tsabtace gida",
    officeCleaning: "Tsabtace ofis",
  },
};

const DE: Partial<CareCopy> = {
  nav: {
    home: "Start",
    book: "Buchen",
    track: "Verfolgen",
    review: "Bewertung abgeben",
    account: "Konto",
  },
  hero: {
    title: "Pflege, die immer da ist.",
    subtitle: "Wäschepflege, Hausreinigung und Büropflege mit klarer Buchung, stabilem Tracking und ruhigem Support.",
    ctaBook: "Dienst buchen",
    ctaTrack: "Buchung verfolgen",
  },
  booking: {
    title: "Dienst buchen",
    serviceLabel: "Dienstart",
    dateLabel: "Bevorzugtes Datum",
    timeLabel: "Bevorzugte Uhrzeit",
    nameLabel: "Vollständiger Name",
    phoneLabel: "Telefonnummer",
    emailLabel: "E-Mail-Adresse",
    addressLabel: "Abholadresse",
    notesLabel: "Zusätzliche Notizen",
    submitButton: "Buchung anfordern",
    confirmationHeading: "Buchungsanfrage erhalten",
    confirmationBody: "Wir bestätigen Ihre Buchung in Kürze. Bewahren Sie Ihren Tracking-Code auf.",
    trackingCodeLabel: "Ihr Tracking-Code",
  },
  tracking: {
    title: "Buchung verfolgen",
    codeLabel: "Tracking-Code",
    phoneLabel: "Telefonnummer",
    submitButton: "Status prüfen",
    notFound: "Keine Buchung für diesen Code und diese Telefonnummer gefunden.",
    statusLabel: "Aktueller Status",
    lastUpdatedLabel: "Zuletzt aktualisiert",
    estimatedLabel: "Voraussichtliche Fertigstellung",
  },
  status: {
    pending: "Ausstehend",
    confirmed: "Bestätigt",
    collected: "Abgeholt",
    inProgress: "In Bearbeitung",
    readyForDelivery: "Versandbereit",
    outForDelivery: "Unterwegs",
    delivered: "Geliefert",
    completed: "Abgeschlossen",
    cancelled: "Storniert",
  },
  review: {
    title: "Teilen Sie Ihre Erfahrung",
    ratingLabel: "Gesamtbewertung",
    textLabel: "Ihre Bewertung",
    photoLabel: "Foto hinzufügen (optional)",
    submitButton: "Bewertung absenden",
    successMessage: "Vielen Dank. Ihre Bewertung wurde eingereicht und wartet auf Genehmigung.",
    pendingApproval: "Ausstehende Genehmigung",
  },
  serviceTypes: {
    laundry: "Wäsche",
    drycleaning: "Chemische Reinigung",
    ironing: "Bügeln",
    alterations: "Änderungen",
    homeCleaning: "Hausreinigung",
    officeCleaning: "Büroreinigung",
  },
};

const ZH: Partial<CareCopy> = {
  nav: {
    home: "首页",
    book: "预订",
    track: "追踪",
    review: "留下评价",
    account: "账户",
  },
  hero: {
    title: "每次都准时到达的护理服务。",
    subtitle: "服装护理、家庭清洁和办公室维护，预订更清晰，追踪更稳定，支持更从容。",
    ctaBook: "预订服务",
    ctaTrack: "追踪预订",
  },
  booking: {
    title: "预订服务",
    serviceLabel: "服务类型",
    dateLabel: "首选日期",
    timeLabel: "首选时间",
    nameLabel: "全名",
    phoneLabel: "电话号码",
    emailLabel: "电子邮件地址",
    addressLabel: "取件地址",
    notesLabel: "附加说明",
    submitButton: "申请预订",
    confirmationHeading: "预订请求已收到",
    confirmationBody: "我们将很快确认您的预订。请妥善保管您的追踪码。",
    trackingCodeLabel: "您的追踪码",
  },
  tracking: {
    title: "追踪您的预订",
    codeLabel: "追踪码",
    phoneLabel: "电话号码",
    submitButton: "查询状态",
    notFound: "未找到该追踪码和电话号码对应的预订。",
    statusLabel: "当前状态",
    lastUpdatedLabel: "最后更新",
    estimatedLabel: "预计完成时间",
  },
  status: {
    pending: "待处理",
    confirmed: "已确认",
    collected: "已取件",
    inProgress: "进行中",
    readyForDelivery: "准备派送",
    outForDelivery: "派送中",
    delivered: "已送达",
    completed: "已完成",
    cancelled: "已取消",
  },
  review: {
    title: "分享您的体验",
    ratingLabel: "总体评分",
    textLabel: "您的评价",
    photoLabel: "添加照片（可选）",
    submitButton: "提交评价",
    successMessage: "感谢您。您的评价已提交，正在等待审核。",
    pendingApproval: "待审核",
  },
  serviceTypes: {
    laundry: "洗衣",
    drycleaning: "干洗",
    ironing: "熨烫",
    alterations: "修改",
    homeCleaning: "家庭清洁",
    officeCleaning: "办公室清洁",
  },
};

const HI: Partial<CareCopy> = {
  nav: {
    home: "होम",
    book: "बुक करें",
    track: "ट्रैक करें",
    review: "समीक्षा दें",
    account: "खाता",
  },
  hero: {
    title: "हर बार देखभाल जो पहुंचती है।",
    subtitle: "कपड़ों की देखभाल, घर की सफाई और कार्यस्थल की देखभाल, स्पष्ट बुकिंग, स्थिर ट्रैकिंग और शांत सहायता के साथ।",
    ctaBook: "सेवा बुक करें",
    ctaTrack: "बुकिंग ट्रैक करें",
  },
  booking: {
    title: "सेवा बुक करें",
    serviceLabel: "सेवा का प्रकार",
    dateLabel: "पसंदीदा तिथि",
    timeLabel: "पसंदीदा समय",
    nameLabel: "पूरा नाम",
    phoneLabel: "फ़ोन नंबर",
    emailLabel: "ईमेल पता",
    addressLabel: "पिकअप पता",
    notesLabel: "अतिरिक्त नोट्स",
    submitButton: "बुकिंग अनुरोध करें",
    confirmationHeading: "बुकिंग अनुरोध प्राप्त हुआ",
    confirmationBody: "हम जल्द ही आपकी बुकिंग की पुष्टि करेंगे। अपना ट्रैकिंग कोड सुरक्षित रखें।",
    trackingCodeLabel: "आपका ट्रैकिंग कोड",
  },
  tracking: {
    title: "अपनी बुकिंग ट्रैक करें",
    codeLabel: "ट्रैकिंग कोड",
    phoneLabel: "फ़ोन नंबर",
    submitButton: "स्थिति जांचें",
    notFound: "उस कोड और फ़ोन नंबर के लिए कोई बुकिंग नहीं मिली।",
    statusLabel: "वर्तमान स्थिति",
    lastUpdatedLabel: "अंतिम अपडेट",
    estimatedLabel: "अनुमानित समापन",
  },
  status: {
    pending: "लंबित",
    confirmed: "पुष्टि की गई",
    collected: "एकत्र किया गया",
    inProgress: "प्रगति में",
    readyForDelivery: "डिलीवरी के लिए तैयार",
    outForDelivery: "डिलीवरी पर",
    delivered: "डिलीवर किया गया",
    completed: "पूर्ण",
    cancelled: "रद्द",
  },
  review: {
    title: "अपना अनुभव साझा करें",
    ratingLabel: "कुल रेटिंग",
    textLabel: "आपकी समीक्षा",
    photoLabel: "फ़ोटो जोड़ें (वैकल्पिक)",
    submitButton: "समीक्षा सबमिट करें",
    successMessage: "धन्यवाद। आपकी समीक्षा सबमिट की गई है और अनुमोदन की प्रतीक्षा में है।",
    pendingApproval: "अनुमोदन की प्रतीक्षा में",
  },
  serviceTypes: {
    laundry: "लॉन्ड्री",
    drycleaning: "ड्राई क्लीनिंग",
    ironing: "इस्त्री",
    alterations: "बदलाव",
    homeCleaning: "घर की सफाई",
    officeCleaning: "कार्यालय सफाई",
  },
};

const IT: Partial<CareCopy> = {
  "nav": {
    "home": "Casa",
    "book": "Prenota",
    "track": "Traccia",
    "review": "Lascia una recensione",
    "account": "Conto"
  },
  "hero": {
    "title": "Cura che si manifesta, ogni volta.",
    "subtitle": "Cura dei capi, pulizia della casa e manutenzione del posto di lavoro con prenotazioni più chiare, monitoraggio più costante e supporto più tranquillo.",
    "ctaBook": "Prenota un servizio",
    "ctaTrack": "Tieni traccia di una prenotazione"
  },
  "booking": {
    "title": "Prenota un servizio",
    "serviceLabel": "Tipo di servizio",
    "dateLabel": "Data preferita",
    "timeLabel": "Orario preferito",
    "nameLabel": "Nome completo",
    "phoneLabel": "Numero di telefono",
    "emailLabel": "Indirizzo e-mail",
    "addressLabel": "Indirizzo di ritiro",
    "notesLabel": "Note aggiuntive",
    "submitButton": "Richiedi la prenotazione",
    "confirmationHeading": "Richiesta di prenotazione ricevuta",
    "confirmationBody": "Confermeremo la tua prenotazione a breve. Mantieni il tuo codice di monitoraggio al sicuro.",
    "trackingCodeLabel": "Il tuo codice di monitoraggio"
  },
  "tracking": {
    "title": "Tieni traccia della tua prenotazione",
    "codeLabel": "Codice di monitoraggio",
    "phoneLabel": "Numero di telefono",
    "submitButton": "Controlla lo stato",
    "notFound": "Nessuna prenotazione trovata per quel codice e numero di telefono.",
    "statusLabel": "Stato attuale",
    "lastUpdatedLabel": "Ultimo aggiornamento",
    "estimatedLabel": "Completamento stimato"
  },
  "status": {
    "pending": "In sospeso",
    "confirmed": "Confermato",
    "collected": "Raccolto",
    "inProgress": "In corso",
    "readyForDelivery": "Pronto per la consegna",
    "outForDelivery": "In consegna",
    "delivered": "Consegnato",
    "completed": "Completato",
    "cancelled": "Annullato"
  },
  "review": {
    "title": "Condividi la tua esperienza",
    "ratingLabel": "Valutazione complessiva",
    "textLabel": "La tua recensione",
    "photoLabel": "Aggiungi una foto (facoltativo)",
    "submitButton": "Invia recensione",
    "successMessage": "Grazie. La tua recensione è stata inviata ed è in attesa di approvazione.",
    "pendingApproval": "In attesa di approvazione"
  },
  "serviceTypes": {
    "laundry": "Lavanderia",
    "drycleaning": "Lavaggio a secco",
    "ironing": "Stiratura",
    "alterations": "Alterazioni",
    "homeCleaning": "Pulizia della casa",
    "officeCleaning": "Pulizia dell'ufficio"
  }
};

const LOCALE_OVERRIDES: Partial<Record<AppLocale, Partial<CareCopy>>> = {
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

export function getCareCopy(locale: AppLocale): CareCopy {
  const overrides = LOCALE_OVERRIDES[locale];
  if (overrides) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as CareCopy;
  }
  return EN;
}
