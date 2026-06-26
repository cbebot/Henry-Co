import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

export type StudioProjectCopy = {
  paymentsStack: {
    proofVerifiedTitle: string;
    paymentVerifiedTitle: string;
    proofVerifiedBody: (proofName: string) => string;
    paymentVerifiedBody: string;
    proofOnFileTitle: string;
    proofOnFileBodyNamed: (proofName: string) => string;
    proofOnFileBody: string;
    noProofTitle: string;
    noProofBody: string;
    kickerActionRequired: string;
    kickerPayments: string;
    headingPriority: string;
    headingSummary: string;
    introPriority: string;
    introSummary: string;
    whatHappensNextLabel: string;
    whatHappensNextBodyPrefix: string;
    uploadPaymentProofPhrase: string;
    whatHappensNextBodySuffix: string;
    statTotal: string;
    statPaid: string;
    statProcessing: string;
    statOutstanding: string;
    proposalPricingDetail: string;
    guideTitle: string;
    statusReadyToPay: string;
    duePrefix: string;
    payWhenReady: string;
    proofHint: string;
    reopen: string;
    markPaid: string;
    stepTransferLabel: string;
    stepTransferBody: string;
    stepAttachLabel: string;
    stepAttachBody: string;
    stepFinanceLabel: string;
    stepFinanceBody: string;
    openPaymentStatus: string;
    openSecurePaymentWorkspace: string;
    focusedPageNote: string;
    uploadProofHereInstead: string;
    proofFileTitle: string;
    proofFileDescription: string;
    proofFileFooterHint: string;
    submitProofLabel: string;
    submitProofPending: string;
    needHelpTitle: string;
    needHelpBody: string;
    emailFinance: string;
    whatsappFinance: string;
  };
  timeline: {
    noUpdatesTitle: string;
    noUpdatesBody: string;
  };
  statusRail: {
    progressKicker: string;
    progressIntro: string;
    stepPaymentTitle: string;
    stepPaymentBodyOpen: string;
    stepPaymentBodyNone: string;
    stepVerificationTitle: string;
    stepVerificationBodyActive: string;
    stepVerificationBodyIdle: string;
    stepBuildTitle: string;
    stepBuildBody: string;
    stepLaunchTitle: string;
    stepLaunchBody: string;
  };
  composer: {
    teamOnly: string;
    postUpdateTitle: string;
    postUpdateHint: string;
    updateTitleLabel: string;
    updateTitlePlaceholder: string;
    categoryLabel: string;
    optionStatus: string;
    optionMilestone: string;
    optionNote: string;
    detailsLabel: string;
    detailsPlaceholder: string;
    notifyClient: string;
    submitLabel: string;
    submitPending: string;
  };
  header: {
    clientWorkspace: string;
    tagline: string;
    myAccount: string;
    yourAccountFallback: string;
    menuViewInAccount: string;
    menuStartAnother: string;
    menuStudioHome: string;
    supportPrompt: string;
  };
  hero: {
    clientWorkspaceBadge: string;
    nextPrefix: string;
    teamView: string;
    signedInAs: string;
    projectsLiveInPrefix: string;
    henrycoAccount: string;
    secureLinkAccess: string;
    signIn: string;
    attachSuffix: string;
    cardProjectStatus: string;
    cardBalanceDue: string;
    cardPaidToDate: string;
    milestonesApproved: (approved: number, total: number) => string;
    nextPaymentPrefix: string;
    allPaymentsUpToDate: string;
  };
};

const EN: StudioProjectCopy = {
  paymentsStack: {
    proofVerifiedTitle: "Payment proof verified",
    paymentVerifiedTitle: "Payment verified",
    proofVerifiedBody: (proofName: string) =>
      `Finance verified ${proofName} and recorded this payment against the project.`,
    paymentVerifiedBody: "Finance has confirmed this transfer and recorded it against the project.",
    proofOnFileTitle: "Payment proof on file",
    proofOnFileBodyNamed: (proofName: string) =>
      `${proofName} is attached. Finance is matching it to the transfer and will mark this checkpoint confirmed once it clears.`,
    proofOnFileBody:
      "A proof file is attached. Finance is matching it to the transfer and will mark this checkpoint confirmed once it clears.",
    noProofTitle: "No payment proof uploaded yet",
    noProofBody:
      "Use the secure payment workspace below to transfer, attach your receipt, and move this checkpoint into finance verification.",
    kickerActionRequired: "Action required",
    kickerPayments: "Payments",
    headingPriority: "Complete your payment to begin",
    headingSummary: "Payment overview",
    introPriority:
      "Each milestone begins once the corresponding payment is confirmed. Use the account details below to make your transfer, then upload proof so our team can verify and get started.",
    introSummary:
      "A clear breakdown of your project investment — every payment maps directly to your proposal and milestones.",
    whatHappensNextLabel: "What happens next: ",
    whatHappensNextBodyPrefix: "Transfer using the verified bank details, then use ",
    uploadPaymentProofPhrase: "Upload payment proof",
    whatHappensNextBodySuffix:
      " in this same section. After upload, you will return to your HenryCo account Studio hub while finance confirms privately.",
    statTotal: "Total",
    statPaid: "Paid",
    statProcessing: "Processing",
    statOutstanding: "Outstanding",
    proposalPricingDetail: "Proposal pricing detail",
    guideTitle: "Transfer to HenryCo’s verified company account",
    statusReadyToPay: "Ready to pay",
    duePrefix: "Due ",
    payWhenReady: "Pay when you are ready to secure the next milestone",
    proofHint:
      "After you transfer, upload your receipt or bank confirmation below. Our team will verify the payment privately — nothing is published publicly.",
    reopen: "Re-open",
    markPaid: "Mark paid",
    stepTransferLabel: "Transfer",
    stepTransferBody: "Use the verified bank details.",
    stepAttachLabel: "Attach proof",
    stepAttachBody: "Receipt, alert screenshot, or PDF.",
    stepFinanceLabel: "Finance clears it",
    stepFinanceBody: "Usually within one business day.",
    openPaymentStatus: "Open payment status",
    openSecurePaymentWorkspace: "Open secure payment workspace",
    focusedPageNote:
      "The focused payment page keeps the amount, account details, proof upload, and finance status in one clean view.",
    uploadProofHereInstead: "Upload proof here instead",
    proofFileTitle: "Payment proof file",
    proofFileDescription:
      "Bank receipt, debit alert screenshot, or PDF — must show amount, date, and destination.",
    proofFileFooterHint:
      "After upload, this page will show the proof as received while finance verifies it.",
    submitProofLabel: "Submit payment proof",
    submitProofPending: "Uploading…",
    needHelpTitle: "Need help with your payment?",
    needHelpBody:
      "Our finance team can confirm account details, discuss timing, or walk you through the process.",
    emailFinance: "Email finance",
    whatsappFinance: "WhatsApp finance",
  },
  timeline: {
    noUpdatesTitle: "No updates yet",
    noUpdatesBody:
      "Your project timeline will appear here once work begins. Each update includes a clear headline, timestamp, and context so you always know what moved.",
  },
  statusRail: {
    progressKicker: "Project progress",
    progressIntro:
      "Your project follows a clear sequence: payment, verification, build, and launch. This panel tracks where you are.",
    stepPaymentTitle: "Payment",
    stepPaymentBodyOpen: "Complete your transfer and upload proof to unlock scheduled work.",
    stepPaymentBodyNone: "No outstanding payments at this time.",
    stepVerificationTitle: "Verification",
    stepVerificationBodyActive:
      "Our finance team is reviewing your proof. This page updates automatically once confirmed.",
    stepVerificationBodyIdle:
      "After you upload proof, our team verifies the transfer privately before confirming.",
    stepBuildTitle: "Build & delivery",
    stepBuildBody:
      "Your team works through milestones, sharing updates and files directly in this workspace.",
    stepLaunchTitle: "Launch & handoff",
    stepLaunchBody: "Final review, domain setup, and go-live — handled together, not rushed.",
  },
  composer: {
    teamOnly: "Team only",
    postUpdateTitle: "Post a project update",
    postUpdateHint: "This appears in the client’s project timeline. Keep it clear and concise.",
    updateTitleLabel: "Update title",
    updateTitlePlaceholder: "e.g. Designs ready for your review",
    categoryLabel: "Category",
    optionStatus: "Progress update",
    optionMilestone: "Milestone update",
    optionNote: "Studio note",
    detailsLabel: "Details",
    detailsPlaceholder: "What’s changed, what’s next, or what the client should know.",
    notifyClient: "Notify client by email and WhatsApp when available",
    submitLabel: "Publish to progress log",
    submitPending: "Publishing…",
  },
  header: {
    clientWorkspace: "Client workspace",
    tagline: "Payments, milestones, and deliverables — all in one secure workspace.",
    myAccount: "My account",
    yourAccountFallback: "Your account",
    menuViewInAccount: "View in my account",
    menuStartAnother: "Start another project",
    menuStudioHome: "Studio home",
    supportPrompt: "Questions on payment or scope?",
  },
  hero: {
    clientWorkspaceBadge: "Client workspace",
    nextPrefix: "Next: ",
    teamView: "Team view",
    signedInAs: "Signed in as",
    projectsLiveInPrefix: "Projects also live in your",
    henrycoAccount: "HenryCo account",
    secureLinkAccess: "Secure link access.",
    signIn: "Sign in",
    attachSuffix: "to attach this project to your account.",
    cardProjectStatus: "Project status",
    cardBalanceDue: "Balance due",
    cardPaidToDate: "Paid to date",
    milestonesApproved: (approved: number, total: number) => `${approved} of ${total} milestones approved`,
    nextPaymentPrefix: "Next: ",
    allPaymentsUpToDate: "All payments up to date",
  },
};

const FR: DeepPartial<StudioProjectCopy> = {
  paymentsStack: {
    proofVerifiedTitle: "Justificatif de paiement vérifié",
    paymentVerifiedTitle: "Paiement vérifié",
    proofVerifiedBody: (proofName: string) =>
      `Le service financier a vérifié ${proofName} et a enregistré ce paiement sur le projet.`,
    paymentVerifiedBody: "Le service financier a confirmé ce virement et l’a enregistré sur le projet.",
    proofOnFileTitle: "Justificatif de paiement reçu",
    proofOnFileBodyNamed: (proofName: string) =>
      `${proofName} est joint. Le service financier le rapproche du virement et confirmera cette étape dès qu’il sera validé.`,
    proofOnFileBody:
      "Un fichier justificatif est joint. Le service financier le rapproche du virement et confirmera cette étape dès qu’il sera validé.",
    noProofTitle: "Aucun justificatif de paiement téléversé pour l’instant",
    noProofBody:
      "Utilisez l’espace de paiement sécurisé ci-dessous pour effectuer le virement, joindre votre reçu et faire passer cette étape en vérification financière.",
    kickerActionRequired: "Action requise",
    kickerPayments: "Paiements",
    headingPriority: "Effectuez votre paiement pour commencer",
    headingSummary: "Aperçu des paiements",
    introPriority:
      "Chaque jalon démarre une fois le paiement correspondant confirmé. Utilisez les coordonnées bancaires ci-dessous pour effectuer votre virement, puis téléversez le justificatif afin que notre équipe puisse vérifier et commencer.",
    introSummary:
      "Une ventilation claire de votre investissement projet — chaque paiement correspond directement à votre proposition et à vos jalons.",
    whatHappensNextLabel: "Et ensuite : ",
    whatHappensNextBodyPrefix: "Effectuez le virement avec les coordonnées bancaires vérifiées, puis utilisez ",
    uploadPaymentProofPhrase: "Téléverser le justificatif de paiement",
    whatHappensNextBodySuffix:
      " dans cette même section. Après le téléversement, vous reviendrez sur votre hub Studio du compte HenryCo pendant que le service financier confirme en privé.",
    statTotal: "Total",
    statPaid: "Payé",
    statProcessing: "En traitement",
    statOutstanding: "Restant dû",
    proposalPricingDetail: "Détail tarifaire de la proposition",
    guideTitle: "Virez sur le compte d’entreprise vérifié de HenryCo",
    statusReadyToPay: "Prêt à payer",
    duePrefix: "Échéance ",
    payWhenReady: "Payez quand vous êtes prêt à sécuriser le prochain jalon",
    proofHint:
      "Après votre virement, téléversez votre reçu ou votre confirmation bancaire ci-dessous. Notre équipe vérifiera le paiement en privé — rien n’est publié publiquement.",
    reopen: "Rouvrir",
    markPaid: "Marquer payé",
    stepTransferLabel: "Virement",
    stepTransferBody: "Utilisez les coordonnées bancaires vérifiées.",
    stepAttachLabel: "Joindre le justificatif",
    stepAttachBody: "Reçu, capture d’alerte ou PDF.",
    stepFinanceLabel: "Le service financier valide",
    stepFinanceBody: "Généralement sous un jour ouvré.",
    openPaymentStatus: "Ouvrir le statut du paiement",
    openSecurePaymentWorkspace: "Ouvrir l’espace de paiement sécurisé",
    focusedPageNote:
      "La page de paiement dédiée réunit le montant, les coordonnées du compte, le téléversement du justificatif et le statut financier dans une vue claire.",
    uploadProofHereInstead: "Téléverser le justificatif ici à la place",
    proofFileTitle: "Fichier justificatif de paiement",
    proofFileDescription:
      "Reçu bancaire, capture d’alerte de débit ou PDF — doit indiquer le montant, la date et la destination.",
    proofFileFooterHint:
      "Après le téléversement, cette page affichera le justificatif comme reçu pendant que le service financier le vérifie.",
    submitProofLabel: "Envoyer le justificatif de paiement",
    submitProofPending: "Téléversement…",
    needHelpTitle: "Besoin d’aide pour votre paiement ?",
    needHelpBody:
      "Notre équipe financière peut confirmer les coordonnées du compte, discuter du calendrier ou vous guider tout au long du processus.",
    emailFinance: "Écrire au service financier",
    whatsappFinance: "WhatsApp service financier",
  },
  timeline: {
    noUpdatesTitle: "Aucune mise à jour pour l’instant",
    noUpdatesBody:
      "Le calendrier de votre projet apparaîtra ici dès le début des travaux. Chaque mise à jour comprend un titre clair, un horodatage et un contexte pour que vous sachiez toujours ce qui a avancé.",
  },
  statusRail: {
    progressKicker: "Avancement du projet",
    progressIntro:
      "Votre projet suit une séquence claire : paiement, vérification, réalisation et lancement. Ce panneau indique où vous en êtes.",
    stepPaymentTitle: "Paiement",
    stepPaymentBodyOpen: "Effectuez votre virement et téléversez le justificatif pour débloquer le travail planifié.",
    stepPaymentBodyNone: "Aucun paiement en attente pour le moment.",
    stepVerificationTitle: "Vérification",
    stepVerificationBodyActive:
      "Notre équipe financière examine votre justificatif. Cette page se met à jour automatiquement une fois confirmé.",
    stepVerificationBodyIdle:
      "Après le téléversement du justificatif, notre équipe vérifie le virement en privé avant de confirmer.",
    stepBuildTitle: "Réalisation et livraison",
    stepBuildBody:
      "Votre équipe avance jalon par jalon, en partageant mises à jour et fichiers directement dans cet espace.",
    stepLaunchTitle: "Lancement et passation",
    stepLaunchBody: "Revue finale, configuration du domaine et mise en ligne — gérés ensemble, sans précipitation.",
  },
  composer: {
    teamOnly: "Équipe uniquement",
    postUpdateTitle: "Publier une mise à jour du projet",
    postUpdateHint: "Ceci apparaît dans le calendrier du projet du client. Restez clair et concis.",
    updateTitleLabel: "Titre de la mise à jour",
    updateTitlePlaceholder: "ex. Maquettes prêtes pour votre validation",
    categoryLabel: "Catégorie",
    optionStatus: "Mise à jour d’avancement",
    optionMilestone: "Mise à jour de jalon",
    optionNote: "Note du studio",
    detailsLabel: "Détails",
    detailsPlaceholder: "Ce qui a changé, ce qui suit ou ce que le client doit savoir.",
    notifyClient: "Notifier le client par e-mail et WhatsApp lorsque disponible",
    submitLabel: "Publier au journal d’avancement",
    submitPending: "Publication…",
  },
  header: {
    clientWorkspace: "Espace client",
    tagline: "Paiements, jalons et livrables — le tout dans un espace sécurisé.",
    myAccount: "Mon compte",
    yourAccountFallback: "Votre compte",
    menuViewInAccount: "Voir dans mon compte",
    menuStartAnother: "Démarrer un autre projet",
    menuStudioHome: "Accueil du studio",
    supportPrompt: "Des questions sur le paiement ou le périmètre ?",
  },
  hero: {
    clientWorkspaceBadge: "Espace client",
    nextPrefix: "Suivant : ",
    teamView: "Vue équipe",
    signedInAs: "Connecté en tant que",
    projectsLiveInPrefix: "Vos projets sont aussi dans votre",
    henrycoAccount: "compte HenryCo",
    secureLinkAccess: "Accès par lien sécurisé.",
    signIn: "Se connecter",
    attachSuffix: "pour rattacher ce projet à votre compte.",
    cardProjectStatus: "Statut du projet",
    cardBalanceDue: "Solde dû",
    cardPaidToDate: "Payé à ce jour",
    milestonesApproved: (approved: number, total: number) => `${approved} jalons sur ${total} approuvés`,
    nextPaymentPrefix: "Suivant : ",
    allPaymentsUpToDate: "Tous les paiements sont à jour",
  },
};

const ES: DeepPartial<StudioProjectCopy> = {
  paymentsStack: {
    proofVerifiedTitle: "Comprobante de pago verificado",
    paymentVerifiedTitle: "Pago verificado",
    proofVerifiedBody: (proofName: string) =>
      `Finanzas verificó ${proofName} y registró este pago en el proyecto.`,
    paymentVerifiedBody: "Finanzas confirmó esta transferencia y la registró en el proyecto.",
    proofOnFileTitle: "Comprobante de pago recibido",
    proofOnFileBodyNamed: (proofName: string) =>
      `${proofName} está adjunto. Finanzas lo está cotejando con la transferencia y marcará este punto de control como confirmado en cuanto se acredite.`,
    proofOnFileBody:
      "Hay un archivo de comprobante adjunto. Finanzas lo está cotejando con la transferencia y marcará este punto de control como confirmado en cuanto se acredite.",
    noProofTitle: "Aún no se ha subido ningún comprobante de pago",
    noProofBody:
      "Usa el espacio de pago seguro de abajo para transferir, adjuntar tu recibo y pasar este punto de control a la verificación de finanzas.",
    kickerActionRequired: "Acción requerida",
    kickerPayments: "Pagos",
    headingPriority: "Completa tu pago para empezar",
    headingSummary: "Resumen de pagos",
    introPriority:
      "Cada hito comienza una vez confirmado el pago correspondiente. Usa los datos de la cuenta a continuación para realizar tu transferencia y luego sube el comprobante para que nuestro equipo pueda verificar y comenzar.",
    introSummary:
      "Un desglose claro de la inversión de tu proyecto: cada pago se corresponde directamente con tu propuesta y tus hitos.",
    whatHappensNextLabel: "Qué sigue: ",
    whatHappensNextBodyPrefix: "Transfiere con los datos bancarios verificados y luego usa ",
    uploadPaymentProofPhrase: "Subir comprobante de pago",
    whatHappensNextBodySuffix:
      " en esta misma sección. Tras subirlo, volverás a tu centro de Studio de la cuenta HenryCo mientras finanzas confirma en privado.",
    statTotal: "Total",
    statPaid: "Pagado",
    statProcessing: "En proceso",
    statOutstanding: "Pendiente",
    proposalPricingDetail: "Detalle de precios de la propuesta",
    guideTitle: "Transfiere a la cuenta de empresa verificada de HenryCo",
    statusReadyToPay: "Listo para pagar",
    duePrefix: "Vence ",
    payWhenReady: "Paga cuando estés listo para asegurar el próximo hito",
    proofHint:
      "Después de transferir, sube tu recibo o confirmación bancaria abajo. Nuestro equipo verificará el pago en privado: nada se publica públicamente.",
    reopen: "Reabrir",
    markPaid: "Marcar pagado",
    stepTransferLabel: "Transferir",
    stepTransferBody: "Usa los datos bancarios verificados.",
    stepAttachLabel: "Adjuntar comprobante",
    stepAttachBody: "Recibo, captura de alerta o PDF.",
    stepFinanceLabel: "Finanzas lo confirma",
    stepFinanceBody: "Normalmente en un día hábil.",
    openPaymentStatus: "Abrir estado del pago",
    openSecurePaymentWorkspace: "Abrir espacio de pago seguro",
    focusedPageNote:
      "La página de pago dedicada reúne el importe, los datos de la cuenta, la subida del comprobante y el estado de finanzas en una vista clara.",
    uploadProofHereInstead: "Subir el comprobante aquí en su lugar",
    proofFileTitle: "Archivo de comprobante de pago",
    proofFileDescription:
      "Recibo bancario, captura de alerta de débito o PDF: debe mostrar importe, fecha y destino.",
    proofFileFooterHint:
      "Tras subirlo, esta página mostrará el comprobante como recibido mientras finanzas lo verifica.",
    submitProofLabel: "Enviar comprobante de pago",
    submitProofPending: "Subiendo…",
    needHelpTitle: "¿Necesitas ayuda con tu pago?",
    needHelpBody:
      "Nuestro equipo de finanzas puede confirmar los datos de la cuenta, hablar de los plazos o guiarte por el proceso.",
    emailFinance: "Escribir a finanzas",
    whatsappFinance: "WhatsApp finanzas",
  },
  timeline: {
    noUpdatesTitle: "Aún no hay novedades",
    noUpdatesBody:
      "El cronograma de tu proyecto aparecerá aquí en cuanto comience el trabajo. Cada novedad incluye un titular claro, una marca de tiempo y contexto para que siempre sepas qué avanzó.",
  },
  statusRail: {
    progressKicker: "Progreso del proyecto",
    progressIntro:
      "Tu proyecto sigue una secuencia clara: pago, verificación, desarrollo y lanzamiento. Este panel indica dónde te encuentras.",
    stepPaymentTitle: "Pago",
    stepPaymentBodyOpen: "Completa tu transferencia y sube el comprobante para desbloquear el trabajo programado.",
    stepPaymentBodyNone: "No hay pagos pendientes en este momento.",
    stepVerificationTitle: "Verificación",
    stepVerificationBodyActive:
      "Nuestro equipo de finanzas está revisando tu comprobante. Esta página se actualiza automáticamente una vez confirmado.",
    stepVerificationBodyIdle:
      "Tras subir el comprobante, nuestro equipo verifica la transferencia en privado antes de confirmar.",
    stepBuildTitle: "Desarrollo y entrega",
    stepBuildBody:
      "Tu equipo avanza por los hitos, compartiendo novedades y archivos directamente en este espacio.",
    stepLaunchTitle: "Lanzamiento y entrega final",
    stepLaunchBody: "Revisión final, configuración del dominio y puesta en marcha: gestionado en conjunto, sin prisas.",
  },
  composer: {
    teamOnly: "Solo equipo",
    postUpdateTitle: "Publicar una novedad del proyecto",
    postUpdateHint: "Esto aparece en el cronograma del proyecto del cliente. Sé claro y conciso.",
    updateTitleLabel: "Título de la novedad",
    updateTitlePlaceholder: "p. ej. Diseños listos para tu revisión",
    categoryLabel: "Categoría",
    optionStatus: "Novedad de progreso",
    optionMilestone: "Novedad de hito",
    optionNote: "Nota del estudio",
    detailsLabel: "Detalles",
    detailsPlaceholder: "Qué cambió, qué sigue o qué debe saber el cliente.",
    notifyClient: "Notificar al cliente por correo y WhatsApp cuando esté disponible",
    submitLabel: "Publicar en el registro de progreso",
    submitPending: "Publicando…",
  },
  header: {
    clientWorkspace: "Espacio del cliente",
    tagline: "Pagos, hitos y entregables, todo en un espacio seguro.",
    myAccount: "Mi cuenta",
    yourAccountFallback: "Tu cuenta",
    menuViewInAccount: "Ver en mi cuenta",
    menuStartAnother: "Iniciar otro proyecto",
    menuStudioHome: "Inicio del estudio",
    supportPrompt: "¿Preguntas sobre el pago o el alcance?",
  },
  hero: {
    clientWorkspaceBadge: "Espacio del cliente",
    nextPrefix: "Siguiente: ",
    teamView: "Vista de equipo",
    signedInAs: "Conectado como",
    projectsLiveInPrefix: "Tus proyectos también están en tu",
    henrycoAccount: "cuenta HenryCo",
    secureLinkAccess: "Acceso por enlace seguro.",
    signIn: "Iniciar sesión",
    attachSuffix: "para asociar este proyecto a tu cuenta.",
    cardProjectStatus: "Estado del proyecto",
    cardBalanceDue: "Saldo pendiente",
    cardPaidToDate: "Pagado hasta la fecha",
    milestonesApproved: (approved: number, total: number) => `${approved} de ${total} hitos aprobados`,
    nextPaymentPrefix: "Siguiente: ",
    allPaymentsUpToDate: "Todos los pagos al día",
  },
};

const PT: DeepPartial<StudioProjectCopy> = {
  paymentsStack: {
    proofVerifiedTitle: "Comprovativo de pagamento verificado",
    paymentVerifiedTitle: "Pagamento verificado",
    proofVerifiedBody: (proofName: string) =>
      `O setor financeiro verificou ${proofName} e registou este pagamento no projeto.`,
    paymentVerifiedBody: "O setor financeiro confirmou esta transferência e registou-a no projeto.",
    proofOnFileTitle: "Comprovativo de pagamento recebido",
    proofOnFileBodyNamed: (proofName: string) =>
      `${proofName} está anexado. O setor financeiro está a confrontá-lo com a transferência e marcará este ponto de controlo como confirmado assim que for compensado.`,
    proofOnFileBody:
      "Há um ficheiro de comprovativo anexado. O setor financeiro está a confrontá-lo com a transferência e marcará este ponto de controlo como confirmado assim que for compensado.",
    noProofTitle: "Ainda não foi carregado nenhum comprovativo de pagamento",
    noProofBody:
      "Use o espaço de pagamento seguro abaixo para transferir, anexar o seu recibo e levar este ponto de controlo à verificação financeira.",
    kickerActionRequired: "Ação necessária",
    kickerPayments: "Pagamentos",
    headingPriority: "Conclua o seu pagamento para começar",
    headingSummary: "Resumo de pagamentos",
    introPriority:
      "Cada marco começa assim que o pagamento correspondente é confirmado. Use os dados da conta abaixo para fazer a sua transferência e depois carregue o comprovativo para que a nossa equipa possa verificar e começar.",
    introSummary:
      "Uma discriminação clara do investimento no seu projeto — cada pagamento corresponde diretamente à sua proposta e aos seus marcos.",
    whatHappensNextLabel: "O que acontece a seguir: ",
    whatHappensNextBodyPrefix: "Transfira com os dados bancários verificados e depois use ",
    uploadPaymentProofPhrase: "Carregar comprovativo de pagamento",
    whatHappensNextBodySuffix:
      " nesta mesma secção. Após o carregamento, regressará ao seu hub de Studio da conta HenryCo enquanto o setor financeiro confirma em privado.",
    statTotal: "Total",
    statPaid: "Pago",
    statProcessing: "Em processamento",
    statOutstanding: "Em dívida",
    proposalPricingDetail: "Detalhe de preços da proposta",
    guideTitle: "Transfira para a conta empresarial verificada da HenryCo",
    statusReadyToPay: "Pronto para pagar",
    duePrefix: "Vence ",
    payWhenReady: "Pague quando estiver pronto para garantir o próximo marco",
    proofHint:
      "Depois de transferir, carregue o seu recibo ou confirmação bancária abaixo. A nossa equipa verificará o pagamento em privado — nada é publicado publicamente.",
    reopen: "Reabrir",
    markPaid: "Marcar como pago",
    stepTransferLabel: "Transferir",
    stepTransferBody: "Use os dados bancários verificados.",
    stepAttachLabel: "Anexar comprovativo",
    stepAttachBody: "Recibo, captura de alerta ou PDF.",
    stepFinanceLabel: "O financeiro confirma",
    stepFinanceBody: "Normalmente dentro de um dia útil.",
    openPaymentStatus: "Abrir estado do pagamento",
    openSecurePaymentWorkspace: "Abrir espaço de pagamento seguro",
    focusedPageNote:
      "A página de pagamento dedicada reúne o valor, os dados da conta, o carregamento do comprovativo e o estado financeiro numa vista clara.",
    uploadProofHereInstead: "Carregar o comprovativo aqui em vez disso",
    proofFileTitle: "Ficheiro de comprovativo de pagamento",
    proofFileDescription:
      "Recibo bancário, captura de alerta de débito ou PDF — deve mostrar valor, data e destino.",
    proofFileFooterHint:
      "Após o carregamento, esta página mostrará o comprovativo como recebido enquanto o financeiro o verifica.",
    submitProofLabel: "Enviar comprovativo de pagamento",
    submitProofPending: "A carregar…",
    needHelpTitle: "Precisa de ajuda com o seu pagamento?",
    needHelpBody:
      "A nossa equipa financeira pode confirmar os dados da conta, discutir prazos ou orientá-lo ao longo do processo.",
    emailFinance: "Enviar e-mail ao financeiro",
    whatsappFinance: "WhatsApp financeiro",
  },
  timeline: {
    noUpdatesTitle: "Ainda sem atualizações",
    noUpdatesBody:
      "O cronograma do seu projeto aparecerá aqui assim que o trabalho começar. Cada atualização inclui um título claro, data e hora e contexto para que saiba sempre o que avançou.",
  },
  statusRail: {
    progressKicker: "Progresso do projeto",
    progressIntro:
      "O seu projeto segue uma sequência clara: pagamento, verificação, desenvolvimento e lançamento. Este painel mostra onde se encontra.",
    stepPaymentTitle: "Pagamento",
    stepPaymentBodyOpen: "Conclua a sua transferência e carregue o comprovativo para desbloquear o trabalho agendado.",
    stepPaymentBodyNone: "Não há pagamentos pendentes neste momento.",
    stepVerificationTitle: "Verificação",
    stepVerificationBodyActive:
      "A nossa equipa financeira está a analisar o seu comprovativo. Esta página atualiza-se automaticamente assim que for confirmado.",
    stepVerificationBodyIdle:
      "Depois de carregar o comprovativo, a nossa equipa verifica a transferência em privado antes de confirmar.",
    stepBuildTitle: "Desenvolvimento e entrega",
    stepBuildBody:
      "A sua equipa avança pelos marcos, partilhando atualizações e ficheiros diretamente neste espaço.",
    stepLaunchTitle: "Lançamento e passagem",
    stepLaunchBody: "Revisão final, configuração do domínio e entrada no ar — tratados em conjunto, sem pressas.",
  },
  composer: {
    teamOnly: "Apenas equipa",
    postUpdateTitle: "Publicar uma atualização do projeto",
    postUpdateHint: "Isto aparece no cronograma do projeto do cliente. Mantenha-o claro e conciso.",
    updateTitleLabel: "Título da atualização",
    updateTitlePlaceholder: "ex. Designs prontos para a sua revisão",
    categoryLabel: "Categoria",
    optionStatus: "Atualização de progresso",
    optionMilestone: "Atualização de marco",
    optionNote: "Nota do estúdio",
    detailsLabel: "Detalhes",
    detailsPlaceholder: "O que mudou, o que se segue ou o que o cliente deve saber.",
    notifyClient: "Notificar o cliente por e-mail e WhatsApp quando disponível",
    submitLabel: "Publicar no registo de progresso",
    submitPending: "A publicar…",
  },
  header: {
    clientWorkspace: "Espaço do cliente",
    tagline: "Pagamentos, marcos e entregáveis — tudo num espaço seguro.",
    myAccount: "A minha conta",
    yourAccountFallback: "A sua conta",
    menuViewInAccount: "Ver na minha conta",
    menuStartAnother: "Iniciar outro projeto",
    menuStudioHome: "Início do estúdio",
    supportPrompt: "Dúvidas sobre o pagamento ou o âmbito?",
  },
  hero: {
    clientWorkspaceBadge: "Espaço do cliente",
    nextPrefix: "Seguinte: ",
    teamView: "Vista de equipa",
    signedInAs: "Sessão iniciada como",
    projectsLiveInPrefix: "Os seus projetos também estão na sua",
    henrycoAccount: "conta HenryCo",
    secureLinkAccess: "Acesso por ligação segura.",
    signIn: "Iniciar sessão",
    attachSuffix: "para associar este projeto à sua conta.",
    cardProjectStatus: "Estado do projeto",
    cardBalanceDue: "Saldo em dívida",
    cardPaidToDate: "Pago até à data",
    milestonesApproved: (approved: number, total: number) => `${approved} de ${total} marcos aprovados`,
    nextPaymentPrefix: "Seguinte: ",
    allPaymentsUpToDate: "Todos os pagamentos em dia",
  },
};

const AR: DeepPartial<StudioProjectCopy> = {
  paymentsStack: {
    proofVerifiedTitle: "تم التحقق من إثبات الدفع",
    paymentVerifiedTitle: "تم التحقق من الدفع",
    proofVerifiedBody: (proofName: string) =>
      `تحقق القسم المالي من ${proofName} وسجّل هذا الدفع على المشروع.`,
    paymentVerifiedBody: "أكّد القسم المالي هذا التحويل وسجّله على المشروع.",
    proofOnFileTitle: "تم استلام إثبات الدفع",
    proofOnFileBodyNamed: (proofName: string) =>
      `تم إرفاق ${proofName}. يطابقه القسم المالي مع التحويل وسيؤكّد هذه المرحلة بمجرد تسويتها.`,
    proofOnFileBody:
      "تم إرفاق ملف إثبات. يطابقه القسم المالي مع التحويل وسيؤكّد هذه المرحلة بمجرد تسويتها.",
    noProofTitle: "لم يتم رفع أي إثبات دفع بعد",
    noProofBody:
      "استخدم مساحة الدفع الآمنة أدناه للتحويل وإرفاق إيصالك ونقل هذه المرحلة إلى التحقق المالي.",
    kickerActionRequired: "إجراء مطلوب",
    kickerPayments: "المدفوعات",
    headingPriority: "أكمل دفعتك للبدء",
    headingSummary: "نظرة عامة على المدفوعات",
    introPriority:
      "تبدأ كل مرحلة بمجرد تأكيد الدفعة المقابلة. استخدم تفاصيل الحساب أدناه لإجراء تحويلك، ثم ارفع الإثبات حتى يتمكن فريقنا من التحقق والبدء.",
    introSummary:
      "تفصيل واضح لاستثمار مشروعك — كل دفعة ترتبط مباشرة بعرضك ومراحلك.",
    whatHappensNextLabel: "ما الذي يحدث بعد ذلك: ",
    whatHappensNextBodyPrefix: "حوّل باستخدام التفاصيل المصرفية المُتحقق منها، ثم استخدم ",
    uploadPaymentProofPhrase: "رفع إثبات الدفع",
    whatHappensNextBodySuffix:
      " في هذا القسم نفسه. بعد الرفع، ستعود إلى مركز Studio في حساب HenryCo بينما يؤكّد القسم المالي بشكل خاص.",
    statTotal: "الإجمالي",
    statPaid: "المدفوع",
    statProcessing: "قيد المعالجة",
    statOutstanding: "المستحق",
    proposalPricingDetail: "تفاصيل تسعير العرض",
    guideTitle: "حوّل إلى حساب شركة HenryCo المُتحقق منه",
    statusReadyToPay: "جاهز للدفع",
    duePrefix: "تاريخ الاستحقاق ",
    payWhenReady: "ادفع عندما تكون جاهزًا لتأمين المرحلة التالية",
    proofHint:
      "بعد التحويل، ارفع إيصالك أو تأكيدك المصرفي أدناه. سيتحقق فريقنا من الدفع بشكل خاص — لا يُنشر أي شيء للعامة.",
    reopen: "إعادة فتح",
    markPaid: "وضع علامة مدفوع",
    stepTransferLabel: "التحويل",
    stepTransferBody: "استخدم التفاصيل المصرفية المُتحقق منها.",
    stepAttachLabel: "إرفاق الإثبات",
    stepAttachBody: "إيصال أو لقطة شاشة للتنبيه أو ملف PDF.",
    stepFinanceLabel: "يؤكّده القسم المالي",
    stepFinanceBody: "عادةً خلال يوم عمل واحد.",
    openPaymentStatus: "فتح حالة الدفع",
    openSecurePaymentWorkspace: "فتح مساحة الدفع الآمنة",
    focusedPageNote:
      "تجمع صفحة الدفع المخصّصة المبلغ وتفاصيل الحساب ورفع الإثبات والحالة المالية في عرض واحد واضح.",
    uploadProofHereInstead: "ارفع الإثبات هنا بدلاً من ذلك",
    proofFileTitle: "ملف إثبات الدفع",
    proofFileDescription:
      "إيصال مصرفي أو لقطة شاشة لتنبيه الخصم أو ملف PDF — يجب أن يُظهر المبلغ والتاريخ والوجهة.",
    proofFileFooterHint:
      "بعد الرفع، ستعرض هذه الصفحة الإثبات كمُستلم بينما يتحقق منه القسم المالي.",
    submitProofLabel: "إرسال إثبات الدفع",
    submitProofPending: "جارٍ الرفع…",
    needHelpTitle: "هل تحتاج مساعدة في دفعتك؟",
    needHelpBody:
      "يمكن لفريقنا المالي تأكيد تفاصيل الحساب أو مناقشة التوقيت أو إرشادك خلال العملية.",
    emailFinance: "مراسلة القسم المالي بالبريد",
    whatsappFinance: "واتساب القسم المالي",
  },
  timeline: {
    noUpdatesTitle: "لا توجد تحديثات بعد",
    noUpdatesBody:
      "سيظهر جدول مشروعك الزمني هنا بمجرد بدء العمل. يتضمن كل تحديث عنوانًا واضحًا وطابعًا زمنيًا وسياقًا حتى تعرف دائمًا ما الذي تقدّم.",
  },
  statusRail: {
    progressKicker: "تقدّم المشروع",
    progressIntro:
      "يتبع مشروعك تسلسلاً واضحًا: الدفع والتحقق والتطوير والإطلاق. تتابع هذه اللوحة موضعك.",
    stepPaymentTitle: "الدفع",
    stepPaymentBodyOpen: "أكمل تحويلك وارفع الإثبات لفتح العمل المجدول.",
    stepPaymentBodyNone: "لا توجد مدفوعات مستحقة في الوقت الحالي.",
    stepVerificationTitle: "التحقق",
    stepVerificationBodyActive:
      "يراجع فريقنا المالي إثباتك. تتحدث هذه الصفحة تلقائيًا بمجرد التأكيد.",
    stepVerificationBodyIdle:
      "بعد رفع الإثبات، يتحقق فريقنا من التحويل بشكل خاص قبل التأكيد.",
    stepBuildTitle: "التطوير والتسليم",
    stepBuildBody:
      "يعمل فريقك عبر المراحل، ويشارك التحديثات والملفات مباشرةً في هذه المساحة.",
    stepLaunchTitle: "الإطلاق والتسليم النهائي",
    stepLaunchBody: "مراجعة نهائية وإعداد النطاق والانطلاق — تُدار معًا دون تسرّع.",
  },
  composer: {
    teamOnly: "الفريق فقط",
    postUpdateTitle: "نشر تحديث للمشروع",
    postUpdateHint: "يظهر هذا في الجدول الزمني لمشروع العميل. اجعله واضحًا وموجزًا.",
    updateTitleLabel: "عنوان التحديث",
    updateTitlePlaceholder: "مثال: التصاميم جاهزة للمراجعة",
    categoryLabel: "الفئة",
    optionStatus: "تحديث التقدّم",
    optionMilestone: "تحديث المرحلة",
    optionNote: "ملاحظة الاستوديو",
    detailsLabel: "التفاصيل",
    detailsPlaceholder: "ما الذي تغيّر، وما التالي، أو ما يجب أن يعرفه العميل.",
    notifyClient: "إشعار العميل عبر البريد الإلكتروني وواتساب عند توفّره",
    submitLabel: "النشر في سجل التقدّم",
    submitPending: "جارٍ النشر…",
  },
  header: {
    clientWorkspace: "مساحة العميل",
    tagline: "المدفوعات والمراحل والمخرجات — كلها في مساحة آمنة واحدة.",
    myAccount: "حسابي",
    yourAccountFallback: "حسابك",
    menuViewInAccount: "العرض في حسابي",
    menuStartAnother: "بدء مشروع آخر",
    menuStudioHome: "الصفحة الرئيسية للاستوديو",
    supportPrompt: "أسئلة حول الدفع أو النطاق؟",
  },
  hero: {
    clientWorkspaceBadge: "مساحة العميل",
    nextPrefix: "التالي: ",
    teamView: "عرض الفريق",
    signedInAs: "مسجّل الدخول باسم",
    projectsLiveInPrefix: "مشاريعك موجودة أيضًا في",
    henrycoAccount: "حساب HenryCo",
    secureLinkAccess: "وصول عبر رابط آمن.",
    signIn: "تسجيل الدخول",
    attachSuffix: "لربط هذا المشروع بحسابك.",
    cardProjectStatus: "حالة المشروع",
    cardBalanceDue: "الرصيد المستحق",
    cardPaidToDate: "المدفوع حتى الآن",
    milestonesApproved: (approved: number, total: number) => `تمت الموافقة على ${approved} من ${total} مراحل`,
    nextPaymentPrefix: "التالي: ",
    allPaymentsUpToDate: "جميع المدفوعات محدّثة",
  },
};

const DE: DeepPartial<StudioProjectCopy> = {
  paymentsStack: {
    proofVerifiedTitle: "Zahlungsnachweis verifiziert",
    paymentVerifiedTitle: "Zahlung verifiziert",
    proofVerifiedBody: (proofName: string) =>
      `Die Finanzabteilung hat ${proofName} verifiziert und diese Zahlung dem Projekt zugeordnet.`,
    paymentVerifiedBody: "Die Finanzabteilung hat diese Überweisung bestätigt und dem Projekt zugeordnet.",
    proofOnFileTitle: "Zahlungsnachweis eingegangen",
    proofOnFileBodyNamed: (proofName: string) =>
      `${proofName} ist angehängt. Die Finanzabteilung gleicht ihn mit der Überweisung ab und bestätigt diesen Meilenstein, sobald die Zahlung eingegangen ist.`,
    proofOnFileBody:
      "Eine Nachweisdatei ist angehängt. Die Finanzabteilung gleicht sie mit der Überweisung ab und bestätigt diesen Meilenstein, sobald die Zahlung eingegangen ist.",
    noProofTitle: "Noch kein Zahlungsnachweis hochgeladen",
    noProofBody:
      "Nutzen Sie den sicheren Zahlungsbereich unten, um zu überweisen, Ihren Beleg anzuhängen und diesen Meilenstein in die Finanzprüfung zu bringen.",
    kickerActionRequired: "Aktion erforderlich",
    kickerPayments: "Zahlungen",
    headingPriority: "Schließen Sie Ihre Zahlung ab, um zu beginnen",
    headingSummary: "Zahlungsübersicht",
    introPriority:
      "Jeder Meilenstein beginnt, sobald die zugehörige Zahlung bestätigt ist. Nutzen Sie die Kontodaten unten für Ihre Überweisung und laden Sie dann den Nachweis hoch, damit unser Team prüfen und loslegen kann.",
    introSummary:
      "Eine klare Aufschlüsselung Ihrer Projektinvestition – jede Zahlung ist direkt Ihrem Angebot und Ihren Meilensteinen zugeordnet.",
    whatHappensNextLabel: "Wie es weitergeht: ",
    whatHappensNextBodyPrefix: "Überweisen Sie mit den verifizierten Bankdaten und nutzen Sie dann ",
    uploadPaymentProofPhrase: "Zahlungsnachweis hochladen",
    whatHappensNextBodySuffix:
      " in genau diesem Abschnitt. Nach dem Hochladen kehren Sie zu Ihrem Studio-Hub im HenryCo-Konto zurück, während die Finanzabteilung vertraulich bestätigt.",
    statTotal: "Gesamt",
    statPaid: "Bezahlt",
    statProcessing: "In Bearbeitung",
    statOutstanding: "Offen",
    proposalPricingDetail: "Preisdetails des Angebots",
    guideTitle: "Überweisen Sie an das verifizierte Firmenkonto von HenryCo",
    statusReadyToPay: "Zahlungsbereit",
    duePrefix: "Fällig ",
    payWhenReady: "Zahlen Sie, wenn Sie bereit sind, den nächsten Meilenstein zu sichern",
    proofHint:
      "Laden Sie nach der Überweisung Ihren Beleg oder Ihre Bankbestätigung unten hoch. Unser Team prüft die Zahlung vertraulich – nichts wird öffentlich veröffentlicht.",
    reopen: "Erneut öffnen",
    markPaid: "Als bezahlt markieren",
    stepTransferLabel: "Überweisen",
    stepTransferBody: "Verwenden Sie die verifizierten Bankdaten.",
    stepAttachLabel: "Nachweis anhängen",
    stepAttachBody: "Beleg, Benachrichtigungs-Screenshot oder PDF.",
    stepFinanceLabel: "Finanzabteilung bestätigt",
    stepFinanceBody: "Üblicherweise innerhalb eines Werktags.",
    openPaymentStatus: "Zahlungsstatus öffnen",
    openSecurePaymentWorkspace: "Sicheren Zahlungsbereich öffnen",
    focusedPageNote:
      "Die fokussierte Zahlungsseite vereint Betrag, Kontodaten, Nachweis-Upload und Finanzstatus in einer klaren Ansicht.",
    uploadProofHereInstead: "Nachweis stattdessen hier hochladen",
    proofFileTitle: "Zahlungsnachweis-Datei",
    proofFileDescription:
      "Bankbeleg, Screenshot der Abbuchungsbenachrichtigung oder PDF – muss Betrag, Datum und Empfänger zeigen.",
    proofFileFooterHint:
      "Nach dem Hochladen zeigt diese Seite den Nachweis als eingegangen an, während die Finanzabteilung ihn prüft.",
    submitProofLabel: "Zahlungsnachweis einreichen",
    submitProofPending: "Wird hochgeladen…",
    needHelpTitle: "Brauchen Sie Hilfe bei Ihrer Zahlung?",
    needHelpBody:
      "Unser Finanzteam kann Kontodaten bestätigen, den Zeitplan besprechen oder Sie durch den Prozess führen.",
    emailFinance: "Finanzabteilung per E-Mail",
    whatsappFinance: "WhatsApp Finanzabteilung",
  },
  timeline: {
    noUpdatesTitle: "Noch keine Updates",
    noUpdatesBody:
      "Ihre Projekt-Timeline erscheint hier, sobald die Arbeit beginnt. Jedes Update enthält eine klare Überschrift, einen Zeitstempel und Kontext, damit Sie stets wissen, was sich bewegt hat.",
  },
  statusRail: {
    progressKicker: "Projektfortschritt",
    progressIntro:
      "Ihr Projekt folgt einer klaren Abfolge: Zahlung, Prüfung, Umsetzung und Launch. Dieses Panel zeigt, wo Sie stehen.",
    stepPaymentTitle: "Zahlung",
    stepPaymentBodyOpen: "Schließen Sie Ihre Überweisung ab und laden Sie den Nachweis hoch, um die geplanten Arbeiten freizuschalten.",
    stepPaymentBodyNone: "Derzeit keine offenen Zahlungen.",
    stepVerificationTitle: "Prüfung",
    stepVerificationBodyActive:
      "Unser Finanzteam prüft Ihren Nachweis. Diese Seite aktualisiert sich automatisch, sobald bestätigt.",
    stepVerificationBodyIdle:
      "Nach dem Hochladen des Nachweises prüft unser Team die Überweisung vertraulich, bevor wir bestätigen.",
    stepBuildTitle: "Umsetzung & Lieferung",
    stepBuildBody:
      "Ihr Team arbeitet die Meilensteine ab und teilt Updates und Dateien direkt in diesem Arbeitsbereich.",
    stepLaunchTitle: "Launch & Übergabe",
    stepLaunchBody: "Abschlussprüfung, Domain-Einrichtung und Go-live – gemeinsam erledigt, ohne Hast.",
  },
  composer: {
    teamOnly: "Nur Team",
    postUpdateTitle: "Projekt-Update veröffentlichen",
    postUpdateHint: "Dies erscheint in der Projekt-Timeline des Kunden. Halten Sie es klar und prägnant.",
    updateTitleLabel: "Update-Titel",
    updateTitlePlaceholder: "z. B. Entwürfe bereit zur Durchsicht",
    categoryLabel: "Kategorie",
    optionStatus: "Fortschritts-Update",
    optionMilestone: "Meilenstein-Update",
    optionNote: "Studio-Notiz",
    detailsLabel: "Details",
    detailsPlaceholder: "Was sich geändert hat, was als Nächstes kommt oder was der Kunde wissen sollte.",
    notifyClient: "Kunden per E-Mail und WhatsApp benachrichtigen, sofern verfügbar",
    submitLabel: "Im Fortschrittsprotokoll veröffentlichen",
    submitPending: "Wird veröffentlicht…",
  },
  header: {
    clientWorkspace: "Kunden-Arbeitsbereich",
    tagline: "Zahlungen, Meilensteine und Liefergegenstände – alles in einem sicheren Arbeitsbereich.",
    myAccount: "Mein Konto",
    yourAccountFallback: "Ihr Konto",
    menuViewInAccount: "In meinem Konto ansehen",
    menuStartAnother: "Weiteres Projekt starten",
    menuStudioHome: "Studio-Startseite",
    supportPrompt: "Fragen zu Zahlung oder Umfang?",
  },
  hero: {
    clientWorkspaceBadge: "Kunden-Arbeitsbereich",
    nextPrefix: "Nächster Schritt: ",
    teamView: "Team-Ansicht",
    signedInAs: "Angemeldet als",
    projectsLiveInPrefix: "Ihre Projekte finden Sie auch in Ihrem",
    henrycoAccount: "HenryCo-Konto",
    secureLinkAccess: "Zugang über sicheren Link.",
    signIn: "Anmelden",
    attachSuffix: "um dieses Projekt mit Ihrem Konto zu verknüpfen.",
    cardProjectStatus: "Projektstatus",
    cardBalanceDue: "Offener Betrag",
    cardPaidToDate: "Bisher bezahlt",
    milestonesApproved: (approved: number, total: number) => `${approved} von ${total} Meilensteinen freigegeben`,
    nextPaymentPrefix: "Nächster Schritt: ",
    allPaymentsUpToDate: "Alle Zahlungen auf dem aktuellen Stand",
  },
};

const IT: DeepPartial<StudioProjectCopy> = {
  paymentsStack: {
    proofVerifiedTitle: "Prova di pagamento verificata",
    paymentVerifiedTitle: "Pagamento verificato",
    proofVerifiedBody: (proofName: string) =>
      `L’ufficio finanziario ha verificato ${proofName} e ha registrato questo pagamento sul progetto.`,
    paymentVerifiedBody: "L’ufficio finanziario ha confermato questo bonifico e lo ha registrato sul progetto.",
    proofOnFileTitle: "Prova di pagamento ricevuta",
    proofOnFileBodyNamed: (proofName: string) =>
      `${proofName} è allegato. L’ufficio finanziario lo sta confrontando con il bonifico e confermerà questo checkpoint non appena risulterà accreditato.`,
    proofOnFileBody:
      "È allegato un file di prova. L’ufficio finanziario lo sta confrontando con il bonifico e confermerà questo checkpoint non appena risulterà accreditato.",
    noProofTitle: "Nessuna prova di pagamento ancora caricata",
    noProofBody:
      "Usa lo spazio di pagamento sicuro qui sotto per effettuare il bonifico, allegare la ricevuta e portare questo checkpoint alla verifica finanziaria.",
    kickerActionRequired: "Azione richiesta",
    kickerPayments: "Pagamenti",
    headingPriority: "Completa il pagamento per iniziare",
    headingSummary: "Panoramica dei pagamenti",
    introPriority:
      "Ogni traguardo inizia una volta confermato il pagamento corrispondente. Usa i dati del conto qui sotto per effettuare il bonifico, poi carica la prova così il nostro team può verificare e partire.",
    introSummary:
      "Una ripartizione chiara dell’investimento sul tuo progetto: ogni pagamento corrisponde direttamente alla tua proposta e ai tuoi traguardi.",
    whatHappensNextLabel: "Cosa succede dopo: ",
    whatHappensNextBodyPrefix: "Effettua il bonifico con i dati bancari verificati, poi usa ",
    uploadPaymentProofPhrase: "Carica la prova di pagamento",
    whatHappensNextBodySuffix:
      " in questa stessa sezione. Dopo il caricamento, tornerai al tuo hub Studio dell’account HenryCo mentre l’ufficio finanziario conferma in privato.",
    statTotal: "Totale",
    statPaid: "Pagato",
    statProcessing: "In elaborazione",
    statOutstanding: "Da saldare",
    proposalPricingDetail: "Dettaglio prezzi della proposta",
    guideTitle: "Effettua il bonifico sul conto aziendale verificato di HenryCo",
    statusReadyToPay: "Pronto al pagamento",
    duePrefix: "Scadenza ",
    payWhenReady: "Paga quando sei pronto a garantire il prossimo traguardo",
    proofHint:
      "Dopo il bonifico, carica la tua ricevuta o conferma bancaria qui sotto. Il nostro team verificherà il pagamento in privato — nulla viene pubblicato pubblicamente.",
    reopen: "Riapri",
    markPaid: "Segna come pagato",
    stepTransferLabel: "Bonifico",
    stepTransferBody: "Usa i dati bancari verificati.",
    stepAttachLabel: "Allega la prova",
    stepAttachBody: "Ricevuta, screenshot dell’avviso o PDF.",
    stepFinanceLabel: "L’ufficio finanziario conferma",
    stepFinanceBody: "Di solito entro un giorno lavorativo.",
    openPaymentStatus: "Apri lo stato del pagamento",
    openSecurePaymentWorkspace: "Apri lo spazio di pagamento sicuro",
    focusedPageNote:
      "La pagina di pagamento dedicata riunisce importo, dati del conto, caricamento della prova e stato finanziario in un’unica vista pulita.",
    uploadProofHereInstead: "Carica la prova qui invece",
    proofFileTitle: "File di prova del pagamento",
    proofFileDescription:
      "Ricevuta bancaria, screenshot dell’avviso di addebito o PDF — deve mostrare importo, data e destinazione.",
    proofFileFooterHint:
      "Dopo il caricamento, questa pagina mostrerà la prova come ricevuta mentre l’ufficio finanziario la verifica.",
    submitProofLabel: "Invia la prova di pagamento",
    submitProofPending: "Caricamento…",
    needHelpTitle: "Hai bisogno di aiuto con il pagamento?",
    needHelpBody:
      "Il nostro team finanziario può confermare i dati del conto, discutere le tempistiche o accompagnarti nel processo.",
    emailFinance: "Email all’ufficio finanziario",
    whatsappFinance: "WhatsApp ufficio finanziario",
  },
  timeline: {
    noUpdatesTitle: "Ancora nessun aggiornamento",
    noUpdatesBody:
      "La timeline del tuo progetto comparirà qui non appena inizia il lavoro. Ogni aggiornamento include un titolo chiaro, una data e ora e il contesto, così sai sempre cosa è cambiato.",
  },
  statusRail: {
    progressKicker: "Avanzamento del progetto",
    progressIntro:
      "Il tuo progetto segue una sequenza chiara: pagamento, verifica, sviluppo e lancio. Questo pannello indica a che punto sei.",
    stepPaymentTitle: "Pagamento",
    stepPaymentBodyOpen: "Completa il bonifico e carica la prova per sbloccare il lavoro programmato.",
    stepPaymentBodyNone: "Nessun pagamento in sospeso al momento.",
    stepVerificationTitle: "Verifica",
    stepVerificationBodyActive:
      "Il nostro team finanziario sta esaminando la tua prova. Questa pagina si aggiorna automaticamente una volta confermata.",
    stepVerificationBodyIdle:
      "Dopo aver caricato la prova, il nostro team verifica il bonifico in privato prima di confermare.",
    stepBuildTitle: "Sviluppo e consegna",
    stepBuildBody:
      "Il tuo team avanza attraverso i traguardi, condividendo aggiornamenti e file direttamente in questo spazio.",
    stepLaunchTitle: "Lancio e passaggio di consegne",
    stepLaunchBody: "Revisione finale, configurazione del dominio e messa online — gestiti insieme, senza fretta.",
  },
  composer: {
    teamOnly: "Solo team",
    postUpdateTitle: "Pubblica un aggiornamento del progetto",
    postUpdateHint: "Questo compare nella timeline del progetto del cliente. Mantienilo chiaro e conciso.",
    updateTitleLabel: "Titolo dell’aggiornamento",
    updateTitlePlaceholder: "es. Design pronti per la tua revisione",
    categoryLabel: "Categoria",
    optionStatus: "Aggiornamento di avanzamento",
    optionMilestone: "Aggiornamento del traguardo",
    optionNote: "Nota dello studio",
    detailsLabel: "Dettagli",
    detailsPlaceholder: "Cosa è cambiato, cosa segue o cosa dovrebbe sapere il cliente.",
    notifyClient: "Avvisa il cliente via email e WhatsApp quando disponibile",
    submitLabel: "Pubblica nel registro di avanzamento",
    submitPending: "Pubblicazione…",
  },
  header: {
    clientWorkspace: "Spazio cliente",
    tagline: "Pagamenti, traguardi e consegne — tutto in un unico spazio sicuro.",
    myAccount: "Il mio account",
    yourAccountFallback: "Il tuo account",
    menuViewInAccount: "Vedi nel mio account",
    menuStartAnother: "Avvia un altro progetto",
    menuStudioHome: "Home dello studio",
    supportPrompt: "Domande su pagamento o ambito?",
  },
  hero: {
    clientWorkspaceBadge: "Spazio cliente",
    nextPrefix: "Prossimo: ",
    teamView: "Vista team",
    signedInAs: "Connesso come",
    projectsLiveInPrefix: "I tuoi progetti sono anche nel tuo",
    henrycoAccount: "account HenryCo",
    secureLinkAccess: "Accesso tramite link sicuro.",
    signIn: "Accedi",
    attachSuffix: "per collegare questo progetto al tuo account.",
    cardProjectStatus: "Stato del progetto",
    cardBalanceDue: "Saldo dovuto",
    cardPaidToDate: "Pagato finora",
    milestonesApproved: (approved: number, total: number) => `${approved} di ${total} traguardi approvati`,
    nextPaymentPrefix: "Prossimo: ",
    allPaymentsUpToDate: "Tutti i pagamenti in regola",
  },
};

const ZH: DeepPartial<StudioProjectCopy> = {
  paymentsStack: {
    proofVerifiedTitle: "付款凭证已核验",
    paymentVerifiedTitle: "付款已核验",
    proofVerifiedBody: (proofName: string) => `财务已核验 ${proofName} 并将此付款记入该项目。`,
    paymentVerifiedBody: "财务已确认此笔转账并将其记入该项目。",
    proofOnFileTitle: "已收到付款凭证",
    proofOnFileBodyNamed: (proofName: string) =>
      `${proofName} 已附上。财务正在将其与转账进行核对，款项到账后将把此节点标记为已确认。`,
    proofOnFileBody:
      "已附上一份凭证文件。财务正在将其与转账进行核对，款项到账后将把此节点标记为已确认。",
    noProofTitle: "尚未上传付款凭证",
    noProofBody:
      "请使用下方的安全付款工作区进行转账、附上收据，并将此节点推进至财务核验。",
    kickerActionRequired: "需要处理",
    kickerPayments: "付款",
    headingPriority: "完成付款即可开始",
    headingSummary: "付款概览",
    introPriority:
      "每个里程碑在相应付款确认后开始。请使用下方的账户信息进行转账，然后上传凭证，以便我们的团队核验并启动。",
    introSummary:
      "清晰列明您的项目投入——每一笔付款都直接对应您的方案和里程碑。",
    whatHappensNextLabel: "接下来： ",
    whatHappensNextBodyPrefix: "使用已核验的银行信息转账，然后在此同一板块使用",
    uploadPaymentProofPhrase: "上传付款凭证",
    whatHappensNextBodySuffix:
      "。上传后，您将返回 HenryCo 账户的 Studio 中心，财务会私下进行确认。",
    statTotal: "总额",
    statPaid: "已付",
    statProcessing: "处理中",
    statOutstanding: "未付",
    proposalPricingDetail: "方案定价明细",
    guideTitle: "转账至 HenryCo 已核验的企业账户",
    statusReadyToPay: "可付款",
    duePrefix: "到期 ",
    payWhenReady: "当您准备好确保下一个里程碑时即可付款",
    proofHint:
      "转账后，请在下方上传您的收据或银行确认信息。我们的团队将私下核验付款——不会公开发布任何内容。",
    reopen: "重新开启",
    markPaid: "标记为已付",
    stepTransferLabel: "转账",
    stepTransferBody: "使用已核验的银行信息。",
    stepAttachLabel: "附上凭证",
    stepAttachBody: "收据、提醒截图或 PDF。",
    stepFinanceLabel: "财务确认",
    stepFinanceBody: "通常在一个工作日内。",
    openPaymentStatus: "打开付款状态",
    openSecurePaymentWorkspace: "打开安全付款工作区",
    focusedPageNote:
      "专属付款页面将金额、账户信息、凭证上传和财务状态汇集于一个清晰的视图中。",
    uploadProofHereInstead: "改为在此处上传凭证",
    proofFileTitle: "付款凭证文件",
    proofFileDescription:
      "银行收据、扣款提醒截图或 PDF——须显示金额、日期和收款方。",
    proofFileFooterHint:
      "上传后，此页面将在财务核验期间显示凭证为已收到。",
    submitProofLabel: "提交付款凭证",
    submitProofPending: "上传中…",
    needHelpTitle: "付款方面需要帮助吗？",
    needHelpBody:
      "我们的财务团队可以确认账户信息、商讨时间安排，或引导您完成整个流程。",
    emailFinance: "邮件联系财务",
    whatsappFinance: "WhatsApp 联系财务",
  },
  timeline: {
    noUpdatesTitle: "暂无更新",
    noUpdatesBody:
      "工作开始后，您的项目时间线将显示在此处。每条更新都包含清晰的标题、时间戳和背景说明，让您始终了解进展。",
  },
  statusRail: {
    progressKicker: "项目进度",
    progressIntro:
      "您的项目遵循清晰的流程：付款、核验、开发和上线。此面板会跟踪您所处的阶段。",
    stepPaymentTitle: "付款",
    stepPaymentBodyOpen: "完成转账并上传凭证，以解锁已排期的工作。",
    stepPaymentBodyNone: "目前没有未结付款。",
    stepVerificationTitle: "核验",
    stepVerificationBodyActive:
      "我们的财务团队正在审核您的凭证。确认后此页面会自动更新。",
    stepVerificationBodyIdle:
      "上传凭证后，我们的团队会私下核验转账，然后再确认。",
    stepBuildTitle: "开发与交付",
    stepBuildBody:
      "您的团队将逐个里程碑推进，直接在此工作区分享更新和文件。",
    stepLaunchTitle: "上线与交接",
    stepLaunchBody: "最终审核、域名设置和上线——一同处理，不仓促。",
  },
  composer: {
    teamOnly: "仅限团队",
    postUpdateTitle: "发布项目更新",
    postUpdateHint: "此内容会显示在客户的项目时间线中。请保持清晰简洁。",
    updateTitleLabel: "更新标题",
    updateTitlePlaceholder: "例如：设计稿已就绪，请您审阅",
    categoryLabel: "类别",
    optionStatus: "进度更新",
    optionMilestone: "里程碑更新",
    optionNote: "工作室备注",
    detailsLabel: "详情",
    detailsPlaceholder: "有什么变化、下一步是什么，或客户需要知道的内容。",
    notifyClient: "在可用时通过电子邮件和 WhatsApp 通知客户",
    submitLabel: "发布到进度日志",
    submitPending: "发布中…",
  },
  header: {
    clientWorkspace: "客户工作区",
    tagline: "付款、里程碑和交付物——全部集中在一个安全的工作区。",
    myAccount: "我的账户",
    yourAccountFallback: "您的账户",
    menuViewInAccount: "在我的账户中查看",
    menuStartAnother: "启动另一个项目",
    menuStudioHome: "工作室首页",
    supportPrompt: "关于付款或范围有疑问？",
  },
  hero: {
    clientWorkspaceBadge: "客户工作区",
    nextPrefix: "下一步： ",
    teamView: "团队视图",
    signedInAs: "已登录身份",
    projectsLiveInPrefix: "您的项目也保存在您的",
    henrycoAccount: "HenryCo 账户",
    secureLinkAccess: "安全链接访问。",
    signIn: "登录",
    attachSuffix: "即可将此项目关联到您的账户。",
    cardProjectStatus: "项目状态",
    cardBalanceDue: "应付余额",
    cardPaidToDate: "迄今已付",
    milestonesApproved: (approved: number, total: number) => `已批准 ${total} 个里程碑中的 ${approved} 个`,
    nextPaymentPrefix: "下一步： ",
    allPaymentsUpToDate: "所有付款均已结清",
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<StudioProjectCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
};
// ig, yo, ha, hi are intentionally OMITTED -> fall back to EN (human-translation only).

export function getStudioProjectCopy(locale: AppLocale): StudioProjectCopy {
  const o = LOCALE_MAP[locale];
  if (o) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      o as unknown as Record<string, unknown>,
    ) as unknown as StudioProjectCopy;
  }
  return EN;
}
