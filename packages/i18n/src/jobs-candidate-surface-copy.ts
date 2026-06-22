import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * Jobs candidate-surface copy (Pattern A typed copy).
 *
 * Covers hardcoded customer-facing strings that were not previously routed
 * through a copy module across a set of Jobs candidate/public surfaces:
 * the not-found page, route loaders, the auth-callback Suspense fallback,
 * candidate conversations + interviews pages, the candidate files client,
 * the profile-builder placeholders/buttons, and the hiring message composer.
 *
 * The brand token ("HenryCo") is kept verbatim in every locale.
 */
export type JobsCandidateSurfaceCopy = {
  notFound: {
    kicker: string;
    title: string;
    body: string;
    returnHome: string;
    browseJobs: string;
  };
  pageLoading: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  candidateLoading: {
    kicker: string;
    title: string;
    body: string;
  };
  authCallback: {
    title: string;
    body: string;
  };
  conversations: {
    title: string;
    subtitle: string;
    cardTitle: string;
    cardBody: string;
    emptyKicker: string;
    emptyTitle: string;
    emptyBody: string;
    viewApplications: string;
    fallbackSubject: string;
    lastMessage: string;
    noMessages: string;
  };
  interviews: {
    title: string;
    subtitle: string;
    upcomingTitle: string;
    upcomingCountSingular: string;
    upcomingCountPlural: string;
    pastTitle: string;
    pastCountSingular: string;
    pastCountPlural: string;
    emptyUpcoming: string;
    emptyPast: string;
    minutes: string;
    minutesShort: string;
    joinMeeting: string;
    location: string;
    scheduled: string;
  };
  candidateFiles: {
    uploadedNoticeText: string;
    noticeSuccessTitle: string;
    noticeFailTitle: string;
    uploadTitle: string;
    uploadBody: string;
    optionResume: string;
    optionPortfolio: string;
    optionCertification: string;
    fileReady: string;
    uploadButton: string;
    uploadingPendingLabel: string;
    uploadingSpinnerLabel: string;
    uploadingInline: string;
    documentsTitle: string;
    documentsBody: string;
    emptyKicker: string;
    emptyTitle: string;
    emptyBody: string;
    reviewProfile: string;
    addedLabel: string;
    openLabel: string;
    unknownSize: string;
    chooseFileError: string;
    uploadFailedError: string;
    uploadSuccessMessage: string;
  };
  profileBuilder: {
    addButton: string;
    removeButton: string;
    rolePlaceholder: string;
    companyPlaceholder: string;
    descriptionPlaceholder: string;
    skillPlaceholder: string;
  };
  messageComposer: {
    offPlatformWarning: string;
    offPlatformError: string;
    sendFailedError: string;
    sendLabel: string;
    sendingLabel: string;
    attachLabel: string;
    draftSavedLabel: string;
    discardDraftLabel: string;
    expandLabel: string;
    collapseLabel: string;
    fullScreenTitleLabel: string;
    removeAttachmentLabel: string;
    retryUploadLabel: string;
    ariaLabel: string;
    placeholder: string;
    contactTypes: {
      emailAddress: string;
      phoneNumber: string;
      socialHandle: string;
      messagingApp: string;
      socialLink: string;
    };
  };
};

const EN: JobsCandidateSurfaceCopy = {
  notFound: {
    kicker: "Not Found",
    title: "This page could not be found.",
    body: "The role, employer page, or resource you were looking for may have been moved or removed.",
    returnHome: "Return Home",
    browseJobs: "Browse Jobs",
  },
  pageLoading: {
    eyebrow: "HenryCo Jobs",
    title: "Gathering this page for you",
    subtitle:
      "We are loading the latest jobs and updates. You can keep this tab open — nothing is wrong on your side.",
  },
  candidateLoading: {
    kicker: "Candidate workspace",
    title: "Your roles, applications, and profile.",
    body: "Applications, saved roles, alerts, files, and recruiter updates in one view.",
  },
  authCallback: {
    title: "Securing your HenryCo Jobs session",
    body: "We are validating your sign-in and restoring the Jobs module.",
  },
  conversations: {
    title: "Messages",
    subtitle:
      "Your hiring conversations with employers. All messages are kept on-platform for security and auditability.",
    cardTitle: "Conversations",
    cardBody: "Messages from employers about your applications.",
    emptyKicker: "No conversations yet",
    emptyTitle: "Hiring conversations will appear here.",
    emptyBody:
      "When an employer responds to one of your applications, the thread opens here. Every message stays on-platform for audit and security.",
    viewApplications: "View applications",
    fallbackSubject: "Hiring conversation",
    lastMessage: "Last message",
    noMessages: "No messages yet",
  },
  interviews: {
    title: "Interviews",
    subtitle:
      "Your scheduled and completed interviews. Times are shown in your timezone.",
    upcomingTitle: "Upcoming",
    upcomingCountSingular: "{count} interview scheduled.",
    upcomingCountPlural: "{count} interviews scheduled.",
    pastTitle: "Past",
    pastCountSingular: "{count} previous interview.",
    pastCountPlural: "{count} previous interviews.",
    emptyUpcoming:
      "No upcoming interviews. When an employer schedules one, it will appear here.",
    emptyPast: "No past interviews.",
    minutes: "minutes",
    minutesShort: "min",
    joinMeeting: "Join meeting",
    location: "Location",
    scheduled: "Scheduled",
  },
  candidateFiles: {
    uploadedNoticeText:
      "Your file has been uploaded and is now part of your candidate profile.",
    noticeSuccessTitle: "Document uploaded",
    noticeFailTitle: "Upload failed",
    uploadTitle: "Upload a document",
    uploadBody: "Accepted formats include PDF, Word, and image files.",
    optionResume: "Resume",
    optionPortfolio: "Portfolio",
    optionCertification: "Certification",
    fileReady: "{name} ready for upload.",
    uploadButton: "Upload",
    uploadingPendingLabel: "Uploading...",
    uploadingSpinnerLabel: "Uploading candidate document",
    uploadingInline: "Uploading without leaving the page",
    documentsTitle: "Your documents",
    documentsBody: "Files you've uploaded to support your applications.",
    emptyKicker: "Vault is empty",
    emptyTitle: "Add your resume or supporting proof.",
    emptyBody:
      "A resume is the fastest way to strengthen your profile and give employers useful context.",
    reviewProfile: "Review profile",
    addedLabel: "Added",
    openLabel: "Open",
    unknownSize: "Unknown size",
    chooseFileError: "Choose a file before uploading.",
    uploadFailedError: "Document upload failed.",
    uploadSuccessMessage: "Document uploaded successfully.",
  },
  profileBuilder: {
    addButton: "+ Add",
    removeButton: "Remove",
    rolePlaceholder: "Role",
    companyPlaceholder: "Company",
    descriptionPlaceholder: "Describe your contributions",
    skillPlaceholder: "Press Enter to add",
  },
  messageComposer: {
    offPlatformWarning:
      "Detected {items}. To keep the hiring process secure and auditable, please share contact details through the platform once both parties are ready.",
    offPlatformError: "Off-platform contact detected. Adjust and retry.",
    sendFailedError: "Failed to send message.",
    sendLabel: "Send",
    sendingLabel: "Sending…",
    attachLabel: "Attach",
    draftSavedLabel: "Draft saved",
    discardDraftLabel: "Discard",
    expandLabel: "Open full-screen composer",
    collapseLabel: "Collapse composer",
    fullScreenTitleLabel: "New message",
    removeAttachmentLabel: "Remove attachment",
    retryUploadLabel: "Retry upload",
    ariaLabel: "Hiring conversation composer",
    placeholder: "Type your message…",
    contactTypes: {
      emailAddress: "email address",
      phoneNumber: "phone number",
      socialHandle: "social handle",
      messagingApp: "messaging app",
      socialLink: "social link",
    },
  },
};

const FR: DeepPartial<JobsCandidateSurfaceCopy> = {
  notFound: {
    kicker: "Introuvable",
    title: "Cette page est introuvable.",
    body: "Le poste, la page employeur ou la ressource que vous recherchiez a peut-être été déplacé ou supprimé.",
    returnHome: "Retour à l'accueil",
    browseJobs: "Parcourir les offres",
  },
  pageLoading: {
    eyebrow: "HenryCo Jobs",
    title: "Préparation de cette page pour vous",
    subtitle:
      "Nous chargeons les dernières offres et mises à jour. Vous pouvez laisser cet onglet ouvert — tout va bien de votre côté.",
  },
  candidateLoading: {
    kicker: "Espace candidat",
    title: "Vos postes, candidatures et profil.",
    body: "Candidatures, postes enregistrés, alertes, fichiers et mises à jour des recruteurs en une seule vue.",
  },
  authCallback: {
    title: "Sécurisation de votre session HenryCo Jobs",
    body: "Nous validons votre connexion et restaurons le module Jobs.",
  },
  conversations: {
    title: "Messages",
    subtitle:
      "Vos échanges de recrutement avec les employeurs. Tous les messages sont conservés sur la plateforme pour la sécurité et la traçabilité.",
    cardTitle: "Conversations",
    cardBody: "Messages des employeurs concernant vos candidatures.",
    emptyKicker: "Aucune conversation pour l'instant",
    emptyTitle: "Les échanges de recrutement apparaîtront ici.",
    emptyBody:
      "Lorsqu'un employeur répond à l'une de vos candidatures, le fil s'ouvre ici. Chaque message reste sur la plateforme pour l'audit et la sécurité.",
    viewApplications: "Voir les candidatures",
    fallbackSubject: "Échange de recrutement",
    lastMessage: "Dernier message",
    noMessages: "Aucun message pour l'instant",
  },
  interviews: {
    title: "Entretiens",
    subtitle:
      "Vos entretiens programmés et terminés. Les horaires sont affichés dans votre fuseau horaire.",
    upcomingTitle: "À venir",
    upcomingCountSingular: "{count} entretien programmé.",
    upcomingCountPlural: "{count} entretiens programmés.",
    pastTitle: "Passés",
    pastCountSingular: "{count} entretien précédent.",
    pastCountPlural: "{count} entretiens précédents.",
    emptyUpcoming:
      "Aucun entretien à venir. Lorsqu'un employeur en programme un, il apparaîtra ici.",
    emptyPast: "Aucun entretien passé.",
    minutes: "minutes",
    minutesShort: "min",
    joinMeeting: "Rejoindre la réunion",
    location: "Lieu",
    scheduled: "Programmé",
  },
  candidateFiles: {
    uploadedNoticeText:
      "Votre fichier a été téléversé et fait désormais partie de votre profil candidat.",
    noticeSuccessTitle: "Document téléversé",
    noticeFailTitle: "Échec du téléversement",
    uploadTitle: "Téléverser un document",
    uploadBody: "Les formats acceptés incluent PDF, Word et fichiers image.",
    optionResume: "CV",
    optionPortfolio: "Portfolio",
    optionCertification: "Certification",
    fileReady: "{name} prêt à être téléversé.",
    uploadButton: "Téléverser",
    uploadingPendingLabel: "Téléversement...",
    uploadingSpinnerLabel: "Téléversement du document du candidat",
    uploadingInline: "Téléversement sans quitter la page",
    documentsTitle: "Vos documents",
    documentsBody: "Les fichiers que vous avez téléversés pour appuyer vos candidatures.",
    emptyKicker: "Le coffre est vide",
    emptyTitle: "Ajoutez votre CV ou un justificatif.",
    emptyBody:
      "Un CV est le moyen le plus rapide de renforcer votre profil et de donner aux employeurs un contexte utile.",
    reviewProfile: "Consulter le profil",
    addedLabel: "Ajouté",
    openLabel: "Ouvrir",
    unknownSize: "Taille inconnue",
    chooseFileError: "Choisissez un fichier avant de téléverser.",
    uploadFailedError: "Échec du téléversement du document.",
    uploadSuccessMessage: "Document téléversé avec succès.",
  },
  profileBuilder: {
    addButton: "+ Ajouter",
    removeButton: "Supprimer",
    rolePlaceholder: "Poste",
    companyPlaceholder: "Entreprise",
    descriptionPlaceholder: "Décrivez vos contributions",
    skillPlaceholder: "Appuyez sur Entrée pour ajouter",
  },
  messageComposer: {
    offPlatformWarning:
      "Détecté : {items}. Pour que le processus de recrutement reste sécurisé et traçable, veuillez partager vos coordonnées via la plateforme une fois que les deux parties sont prêtes.",
    offPlatformError: "Contact hors plateforme détecté. Modifiez et réessayez.",
    sendFailedError: "Échec de l'envoi du message.",
    sendLabel: "Envoyer",
    sendingLabel: "Envoi…",
    attachLabel: "Joindre",
    draftSavedLabel: "Brouillon enregistré",
    discardDraftLabel: "Supprimer",
    expandLabel: "Ouvrir l'éditeur en plein écran",
    collapseLabel: "Réduire l'éditeur",
    fullScreenTitleLabel: "Nouveau message",
    removeAttachmentLabel: "Supprimer la pièce jointe",
    retryUploadLabel: "Réessayer le téléversement",
    ariaLabel: "Éditeur de conversation de recrutement",
    placeholder: "Saisissez votre message…",
    contactTypes: {
      emailAddress: "adresse e-mail",
      phoneNumber: "numéro de téléphone",
      socialHandle: "identifiant de réseau social",
      messagingApp: "application de messagerie",
      socialLink: "lien de réseau social",
    },
  },
};

const ES: DeepPartial<JobsCandidateSurfaceCopy> = {
  notFound: {
    kicker: "No encontrado",
    title: "No se pudo encontrar esta página.",
    body: "El puesto, la página del empleador o el recurso que buscabas puede haberse movido o eliminado.",
    returnHome: "Volver al inicio",
    browseJobs: "Explorar empleos",
  },
  pageLoading: {
    eyebrow: "HenryCo Jobs",
    title: "Preparando esta página para ti",
    subtitle:
      "Estamos cargando los últimos empleos y novedades. Puedes mantener esta pestaña abierta: no hay ningún problema de tu lado.",
  },
  candidateLoading: {
    kicker: "Espacio del candidato",
    title: "Tus puestos, candidaturas y perfil.",
    body: "Candidaturas, puestos guardados, alertas, archivos y novedades de los reclutadores en una sola vista.",
  },
  authCallback: {
    title: "Protegiendo tu sesión de HenryCo Jobs",
    body: "Estamos validando tu inicio de sesión y restaurando el módulo de Jobs.",
  },
  conversations: {
    title: "Mensajes",
    subtitle:
      "Tus conversaciones de contratación con empleadores. Todos los mensajes se conservan en la plataforma por seguridad y trazabilidad.",
    cardTitle: "Conversaciones",
    cardBody: "Mensajes de empleadores sobre tus candidaturas.",
    emptyKicker: "Aún no hay conversaciones",
    emptyTitle: "Las conversaciones de contratación aparecerán aquí.",
    emptyBody:
      "Cuando un empleador responda a una de tus candidaturas, el hilo se abrirá aquí. Cada mensaje permanece en la plataforma para auditoría y seguridad.",
    viewApplications: "Ver candidaturas",
    fallbackSubject: "Conversación de contratación",
    lastMessage: "Último mensaje",
    noMessages: "Aún no hay mensajes",
  },
  interviews: {
    title: "Entrevistas",
    subtitle:
      "Tus entrevistas programadas y completadas. Los horarios se muestran en tu zona horaria.",
    upcomingTitle: "Próximas",
    upcomingCountSingular: "{count} entrevista programada.",
    upcomingCountPlural: "{count} entrevistas programadas.",
    pastTitle: "Pasadas",
    pastCountSingular: "{count} entrevista anterior.",
    pastCountPlural: "{count} entrevistas anteriores.",
    emptyUpcoming:
      "No hay entrevistas próximas. Cuando un empleador programe una, aparecerá aquí.",
    emptyPast: "No hay entrevistas pasadas.",
    minutes: "minutos",
    minutesShort: "min",
    joinMeeting: "Unirse a la reunión",
    location: "Ubicación",
    scheduled: "Programada",
  },
  candidateFiles: {
    uploadedNoticeText:
      "Tu archivo se ha subido y ahora forma parte de tu perfil de candidato.",
    noticeSuccessTitle: "Documento subido",
    noticeFailTitle: "Error al subir",
    uploadTitle: "Subir un documento",
    uploadBody: "Los formatos aceptados incluyen PDF, Word y archivos de imagen.",
    optionResume: "Currículum",
    optionPortfolio: "Portafolio",
    optionCertification: "Certificación",
    fileReady: "{name} listo para subir.",
    uploadButton: "Subir",
    uploadingPendingLabel: "Subiendo...",
    uploadingSpinnerLabel: "Subiendo documento del candidato",
    uploadingInline: "Subiendo sin salir de la página",
    documentsTitle: "Tus documentos",
    documentsBody: "Archivos que has subido para respaldar tus candidaturas.",
    emptyKicker: "El archivador está vacío",
    emptyTitle: "Añade tu currículum o un documento de respaldo.",
    emptyBody:
      "Un currículum es la forma más rápida de fortalecer tu perfil y dar a los empleadores un contexto útil.",
    reviewProfile: "Revisar perfil",
    addedLabel: "Añadido",
    openLabel: "Abrir",
    unknownSize: "Tamaño desconocido",
    chooseFileError: "Elige un archivo antes de subir.",
    uploadFailedError: "Error al subir el documento.",
    uploadSuccessMessage: "Documento subido correctamente.",
  },
  profileBuilder: {
    addButton: "+ Añadir",
    removeButton: "Eliminar",
    rolePlaceholder: "Puesto",
    companyPlaceholder: "Empresa",
    descriptionPlaceholder: "Describe tus contribuciones",
    skillPlaceholder: "Pulsa Intro para añadir",
  },
  messageComposer: {
    offPlatformWarning:
      "Se detectó: {items}. Para que el proceso de contratación sea seguro y auditable, comparte los datos de contacto a través de la plataforma cuando ambas partes estén listas.",
    offPlatformError: "Se detectó contacto fuera de la plataforma. Ajusta y reinténtalo.",
    sendFailedError: "No se pudo enviar el mensaje.",
    sendLabel: "Enviar",
    sendingLabel: "Enviando…",
    attachLabel: "Adjuntar",
    draftSavedLabel: "Borrador guardado",
    discardDraftLabel: "Descartar",
    expandLabel: "Abrir editor en pantalla completa",
    collapseLabel: "Contraer editor",
    fullScreenTitleLabel: "Nuevo mensaje",
    removeAttachmentLabel: "Quitar adjunto",
    retryUploadLabel: "Reintentar subida",
    ariaLabel: "Editor de conversación de contratación",
    placeholder: "Escribe tu mensaje…",
    contactTypes: {
      emailAddress: "dirección de correo electrónico",
      phoneNumber: "número de teléfono",
      socialHandle: "usuario de red social",
      messagingApp: "aplicación de mensajería",
      socialLink: "enlace de red social",
    },
  },
};

const PT: DeepPartial<JobsCandidateSurfaceCopy> = {
  notFound: {
    kicker: "Não encontrado",
    title: "Esta página não pôde ser encontrada.",
    body: "A vaga, a página do empregador ou o recurso que você procurava pode ter sido movido ou removido.",
    returnHome: "Voltar ao início",
    browseJobs: "Explorar vagas",
  },
  pageLoading: {
    eyebrow: "HenryCo Jobs",
    title: "Preparando esta página para você",
    subtitle:
      "Estamos carregando as vagas e atualizações mais recentes. Você pode manter esta aba aberta — não há nada de errado do seu lado.",
  },
  candidateLoading: {
    kicker: "Espaço do candidato",
    title: "Suas vagas, candidaturas e perfil.",
    body: "Candidaturas, vagas salvas, alertas, arquivos e atualizações de recrutadores em uma única visão.",
  },
  authCallback: {
    title: "Protegendo sua sessão do HenryCo Jobs",
    body: "Estamos validando seu login e restaurando o módulo Jobs.",
  },
  conversations: {
    title: "Mensagens",
    subtitle:
      "Suas conversas de contratação com empregadores. Todas as mensagens ficam na plataforma por segurança e auditabilidade.",
    cardTitle: "Conversas",
    cardBody: "Mensagens de empregadores sobre suas candidaturas.",
    emptyKicker: "Ainda não há conversas",
    emptyTitle: "As conversas de contratação aparecerão aqui.",
    emptyBody:
      "Quando um empregador responder a uma de suas candidaturas, a conversa abrirá aqui. Cada mensagem permanece na plataforma para auditoria e segurança.",
    viewApplications: "Ver candidaturas",
    fallbackSubject: "Conversa de contratação",
    lastMessage: "Última mensagem",
    noMessages: "Ainda não há mensagens",
  },
  interviews: {
    title: "Entrevistas",
    subtitle:
      "Suas entrevistas agendadas e concluídas. Os horários são exibidos no seu fuso horário.",
    upcomingTitle: "Próximas",
    upcomingCountSingular: "{count} entrevista agendada.",
    upcomingCountPlural: "{count} entrevistas agendadas.",
    pastTitle: "Anteriores",
    pastCountSingular: "{count} entrevista anterior.",
    pastCountPlural: "{count} entrevistas anteriores.",
    emptyUpcoming:
      "Não há entrevistas próximas. Quando um empregador agendar uma, ela aparecerá aqui.",
    emptyPast: "Não há entrevistas anteriores.",
    minutes: "minutos",
    minutesShort: "min",
    joinMeeting: "Entrar na reunião",
    location: "Local",
    scheduled: "Agendada",
  },
  candidateFiles: {
    uploadedNoticeText:
      "Seu arquivo foi enviado e agora faz parte do seu perfil de candidato.",
    noticeSuccessTitle: "Documento enviado",
    noticeFailTitle: "Falha no envio",
    uploadTitle: "Enviar um documento",
    uploadBody: "Os formatos aceitos incluem PDF, Word e arquivos de imagem.",
    optionResume: "Currículo",
    optionPortfolio: "Portfólio",
    optionCertification: "Certificação",
    fileReady: "{name} pronto para envio.",
    uploadButton: "Enviar",
    uploadingPendingLabel: "Enviando...",
    uploadingSpinnerLabel: "Enviando documento do candidato",
    uploadingInline: "Enviando sem sair da página",
    documentsTitle: "Seus documentos",
    documentsBody: "Arquivos que você enviou para apoiar suas candidaturas.",
    emptyKicker: "O cofre está vazio",
    emptyTitle: "Adicione seu currículo ou comprovante de apoio.",
    emptyBody:
      "Um currículo é a maneira mais rápida de fortalecer seu perfil e dar aos empregadores um contexto útil.",
    reviewProfile: "Revisar perfil",
    addedLabel: "Adicionado",
    openLabel: "Abrir",
    unknownSize: "Tamanho desconhecido",
    chooseFileError: "Escolha um arquivo antes de enviar.",
    uploadFailedError: "Falha no envio do documento.",
    uploadSuccessMessage: "Documento enviado com sucesso.",
  },
  profileBuilder: {
    addButton: "+ Adicionar",
    removeButton: "Remover",
    rolePlaceholder: "Cargo",
    companyPlaceholder: "Empresa",
    descriptionPlaceholder: "Descreva suas contribuições",
    skillPlaceholder: "Pressione Enter para adicionar",
  },
  messageComposer: {
    offPlatformWarning:
      "Detectado: {items}. Para manter o processo de contratação seguro e auditável, compartilhe os dados de contato pela plataforma quando ambas as partes estiverem prontas.",
    offPlatformError: "Contato fora da plataforma detectado. Ajuste e tente novamente.",
    sendFailedError: "Falha ao enviar a mensagem.",
    sendLabel: "Enviar",
    sendingLabel: "Enviando…",
    attachLabel: "Anexar",
    draftSavedLabel: "Rascunho salvo",
    discardDraftLabel: "Descartar",
    expandLabel: "Abrir editor em tela cheia",
    collapseLabel: "Recolher editor",
    fullScreenTitleLabel: "Nova mensagem",
    removeAttachmentLabel: "Remover anexo",
    retryUploadLabel: "Tentar envio novamente",
    ariaLabel: "Editor de conversa de contratação",
    placeholder: "Digite sua mensagem…",
    contactTypes: {
      emailAddress: "endereço de e-mail",
      phoneNumber: "número de telefone",
      socialHandle: "usuário de rede social",
      messagingApp: "aplicativo de mensagens",
      socialLink: "link de rede social",
    },
  },
};

const AR: DeepPartial<JobsCandidateSurfaceCopy> = {
  notFound: {
    kicker: "غير موجود",
    title: "تعذّر العثور على هذه الصفحة.",
    body: "ربما تم نقل الوظيفة أو صفحة صاحب العمل أو المورد الذي كنت تبحث عنه أو إزالته.",
    returnHome: "العودة إلى الصفحة الرئيسية",
    browseJobs: "تصفّح الوظائف",
  },
  pageLoading: {
    eyebrow: "HenryCo Jobs",
    title: "نجمع هذه الصفحة من أجلك",
    subtitle:
      "نقوم بتحميل أحدث الوظائف والتحديثات. يمكنك إبقاء هذه العلامة مفتوحة — لا يوجد أي خطأ من جانبك.",
  },
  candidateLoading: {
    kicker: "مساحة المرشّح",
    title: "وظائفك وطلباتك وملفك الشخصي.",
    body: "الطلبات والوظائف المحفوظة والتنبيهات والملفات وتحديثات الموظفين في عرض واحد.",
  },
  authCallback: {
    title: "تأمين جلستك في HenryCo Jobs",
    body: "نتحقق من تسجيل دخولك ونستعيد وحدة الوظائف.",
  },
  conversations: {
    title: "الرسائل",
    subtitle:
      "محادثات التوظيف الخاصة بك مع أصحاب العمل. تُحفظ جميع الرسائل داخل المنصّة لأغراض الأمان وقابلية التدقيق.",
    cardTitle: "المحادثات",
    cardBody: "رسائل من أصحاب العمل بشأن طلباتك.",
    emptyKicker: "لا توجد محادثات بعد",
    emptyTitle: "ستظهر محادثات التوظيف هنا.",
    emptyBody:
      "عندما يردّ صاحب عمل على أحد طلباتك، يُفتح الموضوع هنا. تبقى كل رسالة داخل المنصّة لأغراض التدقيق والأمان.",
    viewApplications: "عرض الطلبات",
    fallbackSubject: "محادثة توظيف",
    lastMessage: "آخر رسالة",
    noMessages: "لا توجد رسائل بعد",
  },
  interviews: {
    title: "المقابلات",
    subtitle:
      "مقابلاتك المجدولة والمكتملة. تُعرض الأوقات حسب منطقتك الزمنية.",
    upcomingTitle: "القادمة",
    upcomingCountSingular: "تم جدولة {count} مقابلة.",
    upcomingCountPlural: "تم جدولة {count} مقابلة.",
    pastTitle: "السابقة",
    pastCountSingular: "{count} مقابلة سابقة.",
    pastCountPlural: "{count} مقابلة سابقة.",
    emptyUpcoming:
      "لا توجد مقابلات قادمة. عندما يجدول صاحب عمل مقابلة، ستظهر هنا.",
    emptyPast: "لا توجد مقابلات سابقة.",
    minutes: "دقائق",
    minutesShort: "دقيقة",
    joinMeeting: "الانضمام إلى الاجتماع",
    location: "الموقع",
    scheduled: "مجدولة",
  },
  candidateFiles: {
    uploadedNoticeText:
      "تم رفع ملفك وأصبح الآن جزءًا من ملفك الشخصي كمرشّح.",
    noticeSuccessTitle: "تم رفع المستند",
    noticeFailTitle: "فشل الرفع",
    uploadTitle: "رفع مستند",
    uploadBody: "تشمل الصيغ المقبولة ملفات PDF وWord والصور.",
    optionResume: "السيرة الذاتية",
    optionPortfolio: "ملف الأعمال",
    optionCertification: "شهادة",
    fileReady: "{name} جاهز للرفع.",
    uploadButton: "رفع",
    uploadingPendingLabel: "جارٍ الرفع...",
    uploadingSpinnerLabel: "جارٍ رفع مستند المرشّح",
    uploadingInline: "جارٍ الرفع دون مغادرة الصفحة",
    documentsTitle: "مستنداتك",
    documentsBody: "الملفات التي رفعتها لدعم طلباتك.",
    emptyKicker: "الخزنة فارغة",
    emptyTitle: "أضف سيرتك الذاتية أو مستندًا داعمًا.",
    emptyBody:
      "السيرة الذاتية هي أسرع طريقة لتعزيز ملفك الشخصي ومنح أصحاب العمل سياقًا مفيدًا.",
    reviewProfile: "مراجعة الملف الشخصي",
    addedLabel: "أُضيف",
    openLabel: "فتح",
    unknownSize: "حجم غير معروف",
    chooseFileError: "اختر ملفًا قبل الرفع.",
    uploadFailedError: "فشل رفع المستند.",
    uploadSuccessMessage: "تم رفع المستند بنجاح.",
  },
  profileBuilder: {
    addButton: "+ إضافة",
    removeButton: "إزالة",
    rolePlaceholder: "المنصب",
    companyPlaceholder: "الشركة",
    descriptionPlaceholder: "صف مساهماتك",
    skillPlaceholder: "اضغط Enter للإضافة",
  },
  messageComposer: {
    offPlatformWarning:
      "تم اكتشاف: {items}. للحفاظ على أمان عملية التوظيف وقابليتها للتدقيق، يُرجى مشاركة بيانات التواصل عبر المنصّة عندما يكون الطرفان جاهزين.",
    offPlatformError: "تم اكتشاف تواصل خارج المنصّة. عدّل وأعد المحاولة.",
    sendFailedError: "تعذّر إرسال الرسالة.",
    sendLabel: "إرسال",
    sendingLabel: "جارٍ الإرسال…",
    attachLabel: "إرفاق",
    draftSavedLabel: "تم حفظ المسودة",
    discardDraftLabel: "تجاهل",
    expandLabel: "فتح المحرّر بملء الشاشة",
    collapseLabel: "طي المحرّر",
    fullScreenTitleLabel: "رسالة جديدة",
    removeAttachmentLabel: "إزالة المرفق",
    retryUploadLabel: "إعادة محاولة الرفع",
    ariaLabel: "محرّر محادثة التوظيف",
    placeholder: "اكتب رسالتك…",
    contactTypes: {
      emailAddress: "عنوان بريد إلكتروني",
      phoneNumber: "رقم هاتف",
      socialHandle: "اسم مستخدم على وسائل التواصل",
      messagingApp: "تطبيق مراسلة",
      socialLink: "رابط وسائل تواصل",
    },
  },
};

const DE: DeepPartial<JobsCandidateSurfaceCopy> = {
  notFound: {
    kicker: "Nicht gefunden",
    title: "Diese Seite konnte nicht gefunden werden.",
    body: "Die Stelle, die Arbeitgeberseite oder die Ressource, die Sie gesucht haben, wurde möglicherweise verschoben oder entfernt.",
    returnHome: "Zur Startseite",
    browseJobs: "Stellen durchsuchen",
  },
  pageLoading: {
    eyebrow: "HenryCo Jobs",
    title: "Diese Seite wird für Sie zusammengestellt",
    subtitle:
      "Wir laden die neuesten Stellen und Updates. Sie können diesen Tab geöffnet lassen — auf Ihrer Seite ist alles in Ordnung.",
  },
  candidateLoading: {
    kicker: "Bewerber-Arbeitsbereich",
    title: "Ihre Stellen, Bewerbungen und Ihr Profil.",
    body: "Bewerbungen, gespeicherte Stellen, Benachrichtigungen, Dateien und Recruiter-Updates in einer Ansicht.",
  },
  authCallback: {
    title: "Ihre HenryCo Jobs-Sitzung wird gesichert",
    body: "Wir überprüfen Ihre Anmeldung und stellen das Jobs-Modul wieder her.",
  },
  conversations: {
    title: "Nachrichten",
    subtitle:
      "Ihre Einstellungsgespräche mit Arbeitgebern. Alle Nachrichten werden aus Sicherheits- und Nachvollziehbarkeitsgründen auf der Plattform aufbewahrt.",
    cardTitle: "Konversationen",
    cardBody: "Nachrichten von Arbeitgebern zu Ihren Bewerbungen.",
    emptyKicker: "Noch keine Konversationen",
    emptyTitle: "Einstellungsgespräche werden hier angezeigt.",
    emptyBody:
      "Wenn ein Arbeitgeber auf eine Ihrer Bewerbungen antwortet, öffnet sich der Verlauf hier. Jede Nachricht bleibt aus Audit- und Sicherheitsgründen auf der Plattform.",
    viewApplications: "Bewerbungen ansehen",
    fallbackSubject: "Einstellungsgespräch",
    lastMessage: "Letzte Nachricht",
    noMessages: "Noch keine Nachrichten",
  },
  interviews: {
    title: "Vorstellungsgespräche",
    subtitle:
      "Ihre geplanten und abgeschlossenen Vorstellungsgespräche. Die Zeiten werden in Ihrer Zeitzone angezeigt.",
    upcomingTitle: "Anstehend",
    upcomingCountSingular: "{count} Vorstellungsgespräch geplant.",
    upcomingCountPlural: "{count} Vorstellungsgespräche geplant.",
    pastTitle: "Vergangen",
    pastCountSingular: "{count} früheres Vorstellungsgespräch.",
    pastCountPlural: "{count} frühere Vorstellungsgespräche.",
    emptyUpcoming:
      "Keine anstehenden Vorstellungsgespräche. Wenn ein Arbeitgeber eines plant, erscheint es hier.",
    emptyPast: "Keine vergangenen Vorstellungsgespräche.",
    minutes: "Minuten",
    minutesShort: "Min.",
    joinMeeting: "Meeting beitreten",
    location: "Ort",
    scheduled: "Geplant",
  },
  candidateFiles: {
    uploadedNoticeText:
      "Ihre Datei wurde hochgeladen und ist nun Teil Ihres Bewerberprofils.",
    noticeSuccessTitle: "Dokument hochgeladen",
    noticeFailTitle: "Upload fehlgeschlagen",
    uploadTitle: "Dokument hochladen",
    uploadBody: "Zu den akzeptierten Formaten gehören PDF-, Word- und Bilddateien.",
    optionResume: "Lebenslauf",
    optionPortfolio: "Portfolio",
    optionCertification: "Zertifizierung",
    fileReady: "{name} bereit zum Hochladen.",
    uploadButton: "Hochladen",
    uploadingPendingLabel: "Wird hochgeladen...",
    uploadingSpinnerLabel: "Bewerberdokument wird hochgeladen",
    uploadingInline: "Hochladen, ohne die Seite zu verlassen",
    documentsTitle: "Ihre Dokumente",
    documentsBody: "Dateien, die Sie zur Unterstützung Ihrer Bewerbungen hochgeladen haben.",
    emptyKicker: "Der Tresor ist leer",
    emptyTitle: "Fügen Sie Ihren Lebenslauf oder einen Nachweis hinzu.",
    emptyBody:
      "Ein Lebenslauf ist der schnellste Weg, Ihr Profil zu stärken und Arbeitgebern nützlichen Kontext zu geben.",
    reviewProfile: "Profil prüfen",
    addedLabel: "Hinzugefügt",
    openLabel: "Öffnen",
    unknownSize: "Unbekannte Größe",
    chooseFileError: "Wählen Sie eine Datei aus, bevor Sie hochladen.",
    uploadFailedError: "Dokument-Upload fehlgeschlagen.",
    uploadSuccessMessage: "Dokument erfolgreich hochgeladen.",
  },
  profileBuilder: {
    addButton: "+ Hinzufügen",
    removeButton: "Entfernen",
    rolePlaceholder: "Position",
    companyPlaceholder: "Unternehmen",
    descriptionPlaceholder: "Beschreiben Sie Ihre Beiträge",
    skillPlaceholder: "Zum Hinzufügen Enter drücken",
  },
  messageComposer: {
    offPlatformWarning:
      "Erkannt: {items}. Damit der Einstellungsprozess sicher und nachvollziehbar bleibt, teilen Sie Kontaktdaten bitte über die Plattform, sobald beide Parteien bereit sind.",
    offPlatformError: "Kontakt außerhalb der Plattform erkannt. Anpassen und erneut versuchen.",
    sendFailedError: "Nachricht konnte nicht gesendet werden.",
    sendLabel: "Senden",
    sendingLabel: "Wird gesendet…",
    attachLabel: "Anhängen",
    draftSavedLabel: "Entwurf gespeichert",
    discardDraftLabel: "Verwerfen",
    expandLabel: "Vollbild-Editor öffnen",
    collapseLabel: "Editor einklappen",
    fullScreenTitleLabel: "Neue Nachricht",
    removeAttachmentLabel: "Anhang entfernen",
    retryUploadLabel: "Upload erneut versuchen",
    ariaLabel: "Editor für Einstellungsgespräch",
    placeholder: "Geben Sie Ihre Nachricht ein…",
    contactTypes: {
      emailAddress: "E-Mail-Adresse",
      phoneNumber: "Telefonnummer",
      socialHandle: "Social-Media-Profilname",
      messagingApp: "Messaging-App",
      socialLink: "Social-Media-Link",
    },
  },
};

const IT: DeepPartial<JobsCandidateSurfaceCopy> = {
  notFound: {
    kicker: "Non trovato",
    title: "Impossibile trovare questa pagina.",
    body: "La posizione, la pagina del datore di lavoro o la risorsa che stavi cercando potrebbe essere stata spostata o rimossa.",
    returnHome: "Torna alla home",
    browseJobs: "Sfoglia le offerte",
  },
  pageLoading: {
    eyebrow: "HenryCo Jobs",
    title: "Stiamo preparando questa pagina per te",
    subtitle:
      "Stiamo caricando le ultime offerte e gli aggiornamenti. Puoi tenere aperta questa scheda — non c'è nulla di sbagliato dalla tua parte.",
  },
  candidateLoading: {
    kicker: "Spazio del candidato",
    title: "Le tue posizioni, candidature e il tuo profilo.",
    body: "Candidature, posizioni salvate, avvisi, file e aggiornamenti dei selezionatori in un'unica vista.",
  },
  authCallback: {
    title: "Stiamo proteggendo la tua sessione HenryCo Jobs",
    body: "Stiamo verificando il tuo accesso e ripristinando il modulo Jobs.",
  },
  conversations: {
    title: "Messaggi",
    subtitle:
      "Le tue conversazioni di assunzione con i datori di lavoro. Tutti i messaggi vengono conservati sulla piattaforma per sicurezza e tracciabilità.",
    cardTitle: "Conversazioni",
    cardBody: "Messaggi dei datori di lavoro sulle tue candidature.",
    emptyKicker: "Ancora nessuna conversazione",
    emptyTitle: "Le conversazioni di assunzione appariranno qui.",
    emptyBody:
      "Quando un datore di lavoro risponde a una delle tue candidature, la conversazione si apre qui. Ogni messaggio resta sulla piattaforma per audit e sicurezza.",
    viewApplications: "Vedi candidature",
    fallbackSubject: "Conversazione di assunzione",
    lastMessage: "Ultimo messaggio",
    noMessages: "Ancora nessun messaggio",
  },
  interviews: {
    title: "Colloqui",
    subtitle:
      "I tuoi colloqui programmati e completati. Gli orari sono mostrati nel tuo fuso orario.",
    upcomingTitle: "In programma",
    upcomingCountSingular: "{count} colloquio programmato.",
    upcomingCountPlural: "{count} colloqui programmati.",
    pastTitle: "Passati",
    pastCountSingular: "{count} colloquio precedente.",
    pastCountPlural: "{count} colloqui precedenti.",
    emptyUpcoming:
      "Nessun colloquio in programma. Quando un datore di lavoro ne programma uno, apparirà qui.",
    emptyPast: "Nessun colloquio passato.",
    minutes: "minuti",
    minutesShort: "min",
    joinMeeting: "Partecipa alla riunione",
    location: "Luogo",
    scheduled: "Programmato",
  },
  candidateFiles: {
    uploadedNoticeText:
      "Il tuo file è stato caricato e ora fa parte del tuo profilo candidato.",
    noticeSuccessTitle: "Documento caricato",
    noticeFailTitle: "Caricamento non riuscito",
    uploadTitle: "Carica un documento",
    uploadBody: "I formati accettati includono PDF, Word e file immagine.",
    optionResume: "Curriculum",
    optionPortfolio: "Portfolio",
    optionCertification: "Certificazione",
    fileReady: "{name} pronto per il caricamento.",
    uploadButton: "Carica",
    uploadingPendingLabel: "Caricamento...",
    uploadingSpinnerLabel: "Caricamento del documento del candidato",
    uploadingInline: "Caricamento senza lasciare la pagina",
    documentsTitle: "I tuoi documenti",
    documentsBody: "File che hai caricato per supportare le tue candidature.",
    emptyKicker: "L'archivio è vuoto",
    emptyTitle: "Aggiungi il tuo curriculum o un documento di supporto.",
    emptyBody:
      "Un curriculum è il modo più rapido per rafforzare il tuo profilo e fornire ai datori di lavoro un contesto utile.",
    reviewProfile: "Rivedi profilo",
    addedLabel: "Aggiunto",
    openLabel: "Apri",
    unknownSize: "Dimensione sconosciuta",
    chooseFileError: "Scegli un file prima di caricare.",
    uploadFailedError: "Caricamento del documento non riuscito.",
    uploadSuccessMessage: "Documento caricato con successo.",
  },
  profileBuilder: {
    addButton: "+ Aggiungi",
    removeButton: "Rimuovi",
    rolePlaceholder: "Ruolo",
    companyPlaceholder: "Azienda",
    descriptionPlaceholder: "Descrivi i tuoi contributi",
    skillPlaceholder: "Premi Invio per aggiungere",
  },
  messageComposer: {
    offPlatformWarning:
      "Rilevato: {items}. Per mantenere il processo di assunzione sicuro e verificabile, condividi i recapiti tramite la piattaforma quando entrambe le parti sono pronte.",
    offPlatformError: "Rilevato contatto fuori piattaforma. Modifica e riprova.",
    sendFailedError: "Impossibile inviare il messaggio.",
    sendLabel: "Invia",
    sendingLabel: "Invio in corso…",
    attachLabel: "Allega",
    draftSavedLabel: "Bozza salvata",
    discardDraftLabel: "Scarta",
    expandLabel: "Apri editor a schermo intero",
    collapseLabel: "Comprimi editor",
    fullScreenTitleLabel: "Nuovo messaggio",
    removeAttachmentLabel: "Rimuovi allegato",
    retryUploadLabel: "Riprova caricamento",
    ariaLabel: "Editor della conversazione di assunzione",
    placeholder: "Scrivi il tuo messaggio…",
    contactTypes: {
      emailAddress: "indirizzo e-mail",
      phoneNumber: "numero di telefono",
      socialHandle: "nome utente social",
      messagingApp: "app di messaggistica",
      socialLink: "link a un social",
    },
  },
};

const ZH: DeepPartial<JobsCandidateSurfaceCopy> = {
  notFound: {
    kicker: "未找到",
    title: "找不到此页面。",
    body: "您查找的职位、雇主页面或资源可能已被移动或删除。",
    returnHome: "返回首页",
    browseJobs: "浏览职位",
  },
  pageLoading: {
    eyebrow: "HenryCo Jobs",
    title: "正在为您整理此页面",
    subtitle: "我们正在加载最新的职位和更新。您可以保持此标签页打开——您这边一切正常。",
  },
  candidateLoading: {
    kicker: "求职者工作区",
    title: "您的职位、申请和个人资料。",
    body: "在一个视图中查看申请、已保存的职位、提醒、文件和招聘方的更新。",
  },
  authCallback: {
    title: "正在保护您的 HenryCo Jobs 会话",
    body: "我们正在验证您的登录并恢复 Jobs 模块。",
  },
  conversations: {
    title: "消息",
    subtitle: "您与雇主的招聘对话。出于安全和可审计的考虑，所有消息均保留在平台上。",
    cardTitle: "对话",
    cardBody: "雇主关于您申请的消息。",
    emptyKicker: "暂无对话",
    emptyTitle: "招聘对话将显示在此处。",
    emptyBody:
      "当雇主回复您的某个申请时，会话将在此处打开。出于审计和安全考虑，每条消息都保留在平台上。",
    viewApplications: "查看申请",
    fallbackSubject: "招聘对话",
    lastMessage: "最新消息",
    noMessages: "暂无消息",
  },
  interviews: {
    title: "面试",
    subtitle: "您已安排和已完成的面试。时间按您的时区显示。",
    upcomingTitle: "即将进行",
    upcomingCountSingular: "已安排 {count} 场面试。",
    upcomingCountPlural: "已安排 {count} 场面试。",
    pastTitle: "过往",
    pastCountSingular: "{count} 场以往面试。",
    pastCountPlural: "{count} 场以往面试。",
    emptyUpcoming: "暂无即将进行的面试。当雇主安排面试时，将显示在此处。",
    emptyPast: "暂无过往面试。",
    minutes: "分钟",
    minutesShort: "分钟",
    joinMeeting: "加入会议",
    location: "地点",
    scheduled: "已安排",
  },
  candidateFiles: {
    uploadedNoticeText: "您的文件已上传，现已成为您求职者资料的一部分。",
    noticeSuccessTitle: "文件已上传",
    noticeFailTitle: "上传失败",
    uploadTitle: "上传文件",
    uploadBody: "可接受的格式包括 PDF、Word 和图片文件。",
    optionResume: "简历",
    optionPortfolio: "作品集",
    optionCertification: "证书",
    fileReady: "{name} 已准备好上传。",
    uploadButton: "上传",
    uploadingPendingLabel: "正在上传...",
    uploadingSpinnerLabel: "正在上传求职者文件",
    uploadingInline: "无需离开页面即可上传",
    documentsTitle: "您的文件",
    documentsBody: "您为支持申请而上传的文件。",
    emptyKicker: "保险库为空",
    emptyTitle: "添加您的简历或佐证材料。",
    emptyBody: "简历是强化您的资料并为雇主提供有用背景信息的最快方式。",
    reviewProfile: "查看资料",
    addedLabel: "添加于",
    openLabel: "打开",
    unknownSize: "大小未知",
    chooseFileError: "请先选择文件再上传。",
    uploadFailedError: "文件上传失败。",
    uploadSuccessMessage: "文件上传成功。",
  },
  profileBuilder: {
    addButton: "+ 添加",
    removeButton: "移除",
    rolePlaceholder: "职位",
    companyPlaceholder: "公司",
    descriptionPlaceholder: "描述您的贡献",
    skillPlaceholder: "按 Enter 键添加",
  },
  messageComposer: {
    offPlatformWarning:
      "检测到：{items}。为保持招聘流程的安全性和可审计性，请在双方都准备好后通过平台分享联系方式。",
    offPlatformError: "检测到平台外联系方式。请调整后重试。",
    sendFailedError: "消息发送失败。",
    sendLabel: "发送",
    sendingLabel: "正在发送…",
    attachLabel: "附件",
    draftSavedLabel: "草稿已保存",
    discardDraftLabel: "放弃",
    expandLabel: "打开全屏编辑器",
    collapseLabel: "收起编辑器",
    fullScreenTitleLabel: "新消息",
    removeAttachmentLabel: "移除附件",
    retryUploadLabel: "重试上传",
    ariaLabel: "招聘对话编辑器",
    placeholder: "输入您的消息…",
    contactTypes: {
      emailAddress: "电子邮件地址",
      phoneNumber: "电话号码",
      socialHandle: "社交账号",
      messagingApp: "即时通讯应用",
      socialLink: "社交链接",
    },
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<JobsCandidateSurfaceCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
  // NOTE: ig, yo, ha, hi are intentionally OMITTED -> they fall back to EN.
};

export function getJobsCandidateSurfaceCopy(locale: AppLocale): JobsCandidateSurfaceCopy {
  const overrides = LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as JobsCandidateSurfaceCopy;
  }
  return EN;
}
