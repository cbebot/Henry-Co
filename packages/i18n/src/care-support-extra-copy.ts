import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

export type CareSupportExtraCopy = {
  recovery: {
    badge: string;
    titleSetup: string;
    titleRecover: string;
    introSetup: string;
    introRecover: string;
    cardSetupTitle: string;
    cardRecoverTitle: string;
    cardSetupText: string;
    cardRecoverText: string;
    securityTitle: string;
    securityText: string;
    backLink: string;
    fallbackAccount: string;
    createPasswordSetup: string;
    createPasswordRecovery: string;
    createPasswordPrefix: string;
    newPasswordLabel: string;
    confirmPasswordLabel: string;
    newPasswordPlaceholder: string;
    confirmPasswordPlaceholder: string;
    saveLabel: string;
    savePendingLabel: string;
    emailBadge: string;
    sendHeading: string;
    sendIntro: string;
    staffEmailLabel: string;
    sendLabel: string;
    sendPendingLabel: string;
  };
  reply: {
    callResultCompleted: string;
    callResultNoAnswer: string;
    callResultVoicemail: string;
    callResultBusy: string;
    callResultWrongNumber: string;
    deliveryReady: string;
    deliverySending: string;
    deliveryQueued: string;
    deliverySent: string;
    deliveryDelivered: string;
    deliveryFailed: string;
    channelLabel: string;
    emailLabel: string;
    whatsappLabel: string;
    callLogLabel: string;
    toggleWhatsappTitle: string;
    whatsappAvailable: string;
    recipientsLabel: string;
    noEmailOnFile: string;
    emailStatusPrefix: string;
    whatsappStatusPrefix: string;
    statusAfterSending: string;
    replyAriaLabel: (name: string) => string;
    replyPlaceholder: (name: string) => string;
    sendReply: string;
    sendingReply: string;
    draftSaved: string;
    discardDraft: string;
    expandReply: string;
    collapseReply: string;
    fullScreenTitle: (name: string) => string;
    hidePreview: string;
    previewMessage: string;
    previewForPrefix: string;
    previewGreeting: (name: string) => string;
    refPrefix: string;
    callOutcomeLabel: string;
    callResultSelectLabel: string;
    callOutcomePlaceholder: string;
    callOutcomeAria: string;
    logCall: string;
    cancel: string;
  };
  controls: {
    composerEyebrow: string;
    composerHeading: string;
    composerIntro: string;
    replyMessageLabel: string;
    replyMessagePlaceholder: string;
    statusAfterSending: string;
    attemptWhatsappTitle: string;
    whatsappConfiguredText: string;
    sendReply: string;
    sendingReply: string;
    assignmentLabel: string;
    unassigned: string;
    updateAssignment: string;
    updatingAssignment: string;
    threadStatusLabel: string;
    statusNotePlaceholder: string;
    updateStatus: string;
    updatingStatus: string;
    internalNoteLabel: string;
    internalNotePlaceholder: string;
    saveInternalNote: string;
    savingNote: string;
  };
  loading: {
    defaultEyebrow: string;
    premiumWorkspace: string;
    finishingHandoff: string;
  };
};

const EN: CareSupportExtraCopy = {
  recovery: {
    badge: "Restricted access recovery",
    titleSetup: "Set a secure workspace password.",
    titleRecover: "Recover staff account access.",
    introSetup:
      "The verification link is active. Set a new password now and the workspace will route you into the correct role dashboard.",
    introRecover:
      "Use your approved staff email to receive a secure recovery link. Owners can also generate setup links directly from staff management.",
    cardSetupTitle: "First-time setup",
    cardRecoverTitle: "Password recovery",
    cardSetupText:
      "New staff accounts are activated through a secure setup link and land inside the correct dashboard after password creation.",
    cardRecoverText:
      "Recovery links re-establish the session first, then allow a direct password update without sending users through the wrong workspace.",
    securityTitle: "Security posture",
    securityText:
      "Access checks remain role-aware and protected by live auth metadata, not by a public route alone.",
    backLink: "Back to staff access",
    fallbackAccount: "Staff account",
    createPasswordSetup: "staff setup",
    createPasswordRecovery: "account recovery",
    createPasswordPrefix: "Create a new password to finish",
    newPasswordLabel: "New password",
    confirmPasswordLabel: "Confirm password",
    newPasswordPlaceholder: "At least 10 characters",
    confirmPasswordPlaceholder: "Repeat the new password",
    saveLabel: "Save password and continue",
    savePendingLabel: "Saving password",
    emailBadge: "Recovery email",
    sendHeading: "Send a secure recovery link",
    sendIntro:
      "If the email belongs to a provisioned staff account, HenryCo Care will prepare a recovery message and queue it for dispatch.",
    staffEmailLabel: "Staff email",
    sendLabel: "Send recovery link",
    sendPendingLabel: "Sending recovery link",
  },
  reply: {
    callResultCompleted: "Completed",
    callResultNoAnswer: "No answer",
    callResultVoicemail: "Voicemail",
    callResultBusy: "Busy",
    callResultWrongNumber: "Wrong number",
    deliveryReady: "Ready",
    deliverySending: "Sending...",
    deliveryQueued: "Queued",
    deliverySent: "Sent to provider",
    deliveryDelivered: "Delivered",
    deliveryFailed: "Failed",
    channelLabel: "Channel",
    emailLabel: "Email",
    whatsappLabel: "WhatsApp",
    callLogLabel: "Call Log",
    toggleWhatsappTitle: "Toggle WhatsApp delivery",
    whatsappAvailable: "Available",
    recipientsLabel: "Recipients",
    noEmailOnFile: "No email on file",
    emailStatusPrefix: "Email:",
    whatsappStatusPrefix: "WhatsApp:",
    statusAfterSending: "Status after sending",
    replyAriaLabel: (name: string) => `Reply to ${name}`,
    replyPlaceholder: (name: string) =>
      `Write your reply to ${name}. Be clear, empathetic, and actionable.`,
    sendReply: "Send reply",
    sendingReply: "Sending reply…",
    draftSaved: "Draft saved",
    discardDraft: "Discard",
    expandReply: "Open full-screen reply",
    collapseReply: "Collapse reply",
    fullScreenTitle: (name: string) => `Reply to ${name}`,
    hidePreview: "Hide preview",
    previewMessage: "Preview message",
    previewForPrefix: "Preview for",
    previewGreeting: (name: string) => `Dear ${name},`,
    refPrefix: "Ref:",
    callOutcomeLabel: "Call outcome",
    callResultSelectLabel: "Call result",
    callOutcomePlaceholder:
      "Summarize the call outcome, key points discussed, and any follow-up actions...",
    callOutcomeAria: "Call outcome",
    logCall: "Log call",
    cancel: "Cancel",
  },
  controls: {
    composerEyebrow: "Reply composer",
    composerHeading: "Send the next step clearly.",
    composerIntro:
      "Replies are delivered by email. WhatsApp can be attempted alongside email when the provider is configured and the thread has a valid customer phone number.",
    replyMessageLabel: "Reply message",
    replyMessagePlaceholder:
      "Explain the next action, timing, confirmation needed from the customer, and anything that should be preserved in the support record.",
    statusAfterSending: "Status after sending",
    attemptWhatsappTitle: "Also attempt WhatsApp delivery",
    whatsappConfiguredText:
      "Provider is configured. Email remains the primary guaranteed route.",
    sendReply: "Send support reply",
    sendingReply: "Sending support reply...",
    assignmentLabel: "Assignment",
    unassigned: "Unassigned",
    updateAssignment: "Update assignment",
    updatingAssignment: "Updating assignment...",
    threadStatusLabel: "Thread status",
    statusNotePlaceholder: "Optional note explaining why the status changed.",
    updateStatus: "Update status",
    updatingStatus: "Updating status...",
    internalNoteLabel: "Internal note",
    internalNotePlaceholder:
      "Capture internal context, risk, service recovery details, or what another teammate needs to know.",
    saveInternalNote: "Save internal note",
    savingNote: "Saving note...",
  },
  loading: {
    defaultEyebrow: "Henry & Co. Care",
    premiumWorkspace: "Premium live workspace",
    finishingHandoff: "Finishing the handoff",
  },
};

const FR: DeepPartial<CareSupportExtraCopy> = {
  recovery: {
    badge: "Récupération d'accès restreint",
    titleSetup: "Définissez un mot de passe sécurisé pour l'espace de travail.",
    titleRecover: "Récupérez l'accès au compte du personnel.",
    introSetup:
      "Le lien de vérification est actif. Définissez un nouveau mot de passe maintenant et l'espace de travail vous dirigera vers le tableau de bord correspondant à votre rôle.",
    introRecover:
      "Utilisez votre e-mail professionnel approuvé pour recevoir un lien de récupération sécurisé. Les propriétaires peuvent aussi générer des liens de configuration directement depuis la gestion du personnel.",
    cardSetupTitle: "Configuration initiale",
    cardRecoverTitle: "Récupération du mot de passe",
    cardSetupText:
      "Les nouveaux comptes du personnel sont activés via un lien de configuration sécurisé et arrivent dans le bon tableau de bord après la création du mot de passe.",
    cardRecoverText:
      "Les liens de récupération rétablissent d'abord la session, puis permettent une mise à jour directe du mot de passe sans diriger les utilisateurs vers le mauvais espace de travail.",
    securityTitle: "Posture de sécurité",
    securityText:
      "Les contrôles d'accès restent sensibles aux rôles et protégés par des métadonnées d'authentification en direct, et non par une simple route publique.",
    backLink: "Retour à l'accès du personnel",
    fallbackAccount: "Compte du personnel",
    createPasswordSetup: "la configuration du personnel",
    createPasswordRecovery: "la récupération du compte",
    createPasswordPrefix: "Créez un nouveau mot de passe pour terminer",
    newPasswordLabel: "Nouveau mot de passe",
    confirmPasswordLabel: "Confirmer le mot de passe",
    newPasswordPlaceholder: "Au moins 10 caractères",
    confirmPasswordPlaceholder: "Répétez le nouveau mot de passe",
    saveLabel: "Enregistrer le mot de passe et continuer",
    savePendingLabel: "Enregistrement du mot de passe",
    emailBadge: "E-mail de récupération",
    sendHeading: "Envoyer un lien de récupération sécurisé",
    sendIntro:
      "Si l'e-mail appartient à un compte du personnel provisionné, HenryCo Care préparera un message de récupération et le mettra en file d'attente pour l'envoi.",
    staffEmailLabel: "E-mail du personnel",
    sendLabel: "Envoyer le lien de récupération",
    sendPendingLabel: "Envoi du lien de récupération",
  },
  reply: {
    callResultCompleted: "Terminé",
    callResultNoAnswer: "Sans réponse",
    callResultVoicemail: "Messagerie vocale",
    callResultBusy: "Occupé",
    callResultWrongNumber: "Mauvais numéro",
    deliveryReady: "Prêt",
    deliverySending: "Envoi en cours...",
    deliveryQueued: "En file d'attente",
    deliverySent: "Envoyé au fournisseur",
    deliveryDelivered: "Distribué",
    deliveryFailed: "Échec",
    channelLabel: "Canal",
    emailLabel: "E-mail",
    whatsappLabel: "WhatsApp",
    callLogLabel: "Journal d'appels",
    toggleWhatsappTitle: "Activer/désactiver l'envoi WhatsApp",
    whatsappAvailable: "Disponible",
    recipientsLabel: "Destinataires",
    noEmailOnFile: "Aucun e-mail enregistré",
    emailStatusPrefix: "E-mail :",
    whatsappStatusPrefix: "WhatsApp :",
    statusAfterSending: "Statut après l'envoi",
    replyAriaLabel: (name: string) => `Répondre à ${name}`,
    replyPlaceholder: (name: string) =>
      `Rédigez votre réponse à ${name}. Soyez clair, empathique et concret.`,
    sendReply: "Envoyer la réponse",
    sendingReply: "Envoi de la réponse…",
    draftSaved: "Brouillon enregistré",
    discardDraft: "Abandonner",
    expandReply: "Ouvrir la réponse en plein écran",
    collapseReply: "Réduire la réponse",
    fullScreenTitle: (name: string) => `Répondre à ${name}`,
    hidePreview: "Masquer l'aperçu",
    previewMessage: "Aperçu du message",
    previewForPrefix: "Aperçu pour",
    previewGreeting: (name: string) => `Bonjour ${name},`,
    refPrefix: "Réf. :",
    callOutcomeLabel: "Résultat de l'appel",
    callResultSelectLabel: "Résultat de l'appel",
    callOutcomePlaceholder:
      "Résumez le résultat de l'appel, les points clés abordés et toute action de suivi...",
    callOutcomeAria: "Résultat de l'appel",
    logCall: "Enregistrer l'appel",
    cancel: "Annuler",
  },
  controls: {
    composerEyebrow: "Éditeur de réponse",
    composerHeading: "Communiquez clairement la prochaine étape.",
    composerIntro:
      "Les réponses sont envoyées par e-mail. WhatsApp peut être tenté en complément de l'e-mail lorsque le fournisseur est configuré et que le fil dispose d'un numéro de téléphone client valide.",
    replyMessageLabel: "Message de réponse",
    replyMessagePlaceholder:
      "Expliquez la prochaine action, le calendrier, la confirmation attendue du client et tout ce qui doit être conservé dans le dossier d'assistance.",
    statusAfterSending: "Statut après l'envoi",
    attemptWhatsappTitle: "Tenter aussi l'envoi WhatsApp",
    whatsappConfiguredText:
      "Le fournisseur est configuré. L'e-mail reste la voie principale garantie.",
    sendReply: "Envoyer la réponse d'assistance",
    sendingReply: "Envoi de la réponse d'assistance...",
    assignmentLabel: "Attribution",
    unassigned: "Non attribué",
    updateAssignment: "Mettre à jour l'attribution",
    updatingAssignment: "Mise à jour de l'attribution...",
    threadStatusLabel: "Statut du fil",
    statusNotePlaceholder: "Note facultative expliquant le changement de statut.",
    updateStatus: "Mettre à jour le statut",
    updatingStatus: "Mise à jour du statut...",
    internalNoteLabel: "Note interne",
    internalNotePlaceholder:
      "Consignez le contexte interne, les risques, les détails de la récupération de service ou ce qu'un collègue doit savoir.",
    saveInternalNote: "Enregistrer la note interne",
    savingNote: "Enregistrement de la note...",
  },
  loading: {
    defaultEyebrow: "Henry & Co. Care",
    premiumWorkspace: "Espace de travail premium en direct",
    finishingHandoff: "Finalisation du transfert",
  },
};

const ES: DeepPartial<CareSupportExtraCopy> = {
  recovery: {
    badge: "Recuperación de acceso restringido",
    titleSetup: "Establece una contraseña segura para el espacio de trabajo.",
    titleRecover: "Recupera el acceso a la cuenta del personal.",
    introSetup:
      "El enlace de verificación está activo. Establece una nueva contraseña ahora y el espacio de trabajo te dirigirá al panel correspondiente a tu rol.",
    introRecover:
      "Usa tu correo de personal aprobado para recibir un enlace de recuperación seguro. Los propietarios también pueden generar enlaces de configuración directamente desde la gestión de personal.",
    cardSetupTitle: "Configuración inicial",
    cardRecoverTitle: "Recuperación de contraseña",
    cardSetupText:
      "Las cuentas nuevas del personal se activan mediante un enlace de configuración seguro y llegan al panel correcto después de crear la contraseña.",
    cardRecoverText:
      "Los enlaces de recuperación restablecen primero la sesión y luego permiten actualizar la contraseña directamente sin enviar a los usuarios al espacio de trabajo equivocado.",
    securityTitle: "Postura de seguridad",
    securityText:
      "Los controles de acceso siguen siendo sensibles al rol y están protegidos por metadatos de autenticación en vivo, no solo por una ruta pública.",
    backLink: "Volver al acceso del personal",
    fallbackAccount: "Cuenta del personal",
    createPasswordSetup: "la configuración del personal",
    createPasswordRecovery: "la recuperación de la cuenta",
    createPasswordPrefix: "Crea una nueva contraseña para finalizar",
    newPasswordLabel: "Nueva contraseña",
    confirmPasswordLabel: "Confirmar contraseña",
    newPasswordPlaceholder: "Al menos 10 caracteres",
    confirmPasswordPlaceholder: "Repite la nueva contraseña",
    saveLabel: "Guardar contraseña y continuar",
    savePendingLabel: "Guardando contraseña",
    emailBadge: "Correo de recuperación",
    sendHeading: "Enviar un enlace de recuperación seguro",
    sendIntro:
      "Si el correo pertenece a una cuenta de personal aprovisionada, HenryCo Care preparará un mensaje de recuperación y lo pondrá en cola para su envío.",
    staffEmailLabel: "Correo del personal",
    sendLabel: "Enviar enlace de recuperación",
    sendPendingLabel: "Enviando enlace de recuperación",
  },
  reply: {
    callResultCompleted: "Completada",
    callResultNoAnswer: "Sin respuesta",
    callResultVoicemail: "Buzón de voz",
    callResultBusy: "Ocupado",
    callResultWrongNumber: "Número equivocado",
    deliveryReady: "Listo",
    deliverySending: "Enviando...",
    deliveryQueued: "En cola",
    deliverySent: "Enviado al proveedor",
    deliveryDelivered: "Entregado",
    deliveryFailed: "Fallido",
    channelLabel: "Canal",
    emailLabel: "Correo",
    whatsappLabel: "WhatsApp",
    callLogLabel: "Registro de llamadas",
    toggleWhatsappTitle: "Activar/desactivar el envío por WhatsApp",
    whatsappAvailable: "Disponible",
    recipientsLabel: "Destinatarios",
    noEmailOnFile: "Sin correo registrado",
    emailStatusPrefix: "Correo:",
    whatsappStatusPrefix: "WhatsApp:",
    statusAfterSending: "Estado después de enviar",
    replyAriaLabel: (name: string) => `Responder a ${name}`,
    replyPlaceholder: (name: string) =>
      `Escribe tu respuesta a ${name}. Sé claro, empático y concreto.`,
    sendReply: "Enviar respuesta",
    sendingReply: "Enviando respuesta…",
    draftSaved: "Borrador guardado",
    discardDraft: "Descartar",
    expandReply: "Abrir respuesta a pantalla completa",
    collapseReply: "Contraer respuesta",
    fullScreenTitle: (name: string) => `Responder a ${name}`,
    hidePreview: "Ocultar vista previa",
    previewMessage: "Vista previa del mensaje",
    previewForPrefix: "Vista previa para",
    previewGreeting: (name: string) => `Estimado/a ${name}:`,
    refPrefix: "Ref.:",
    callOutcomeLabel: "Resultado de la llamada",
    callResultSelectLabel: "Resultado de la llamada",
    callOutcomePlaceholder:
      "Resume el resultado de la llamada, los puntos clave tratados y cualquier acción de seguimiento...",
    callOutcomeAria: "Resultado de la llamada",
    logCall: "Registrar llamada",
    cancel: "Cancelar",
  },
  controls: {
    composerEyebrow: "Editor de respuesta",
    composerHeading: "Comunica el siguiente paso con claridad.",
    composerIntro:
      "Las respuestas se entregan por correo electrónico. Se puede intentar WhatsApp junto con el correo cuando el proveedor está configurado y el hilo tiene un número de teléfono de cliente válido.",
    replyMessageLabel: "Mensaje de respuesta",
    replyMessagePlaceholder:
      "Explica la próxima acción, los plazos, la confirmación necesaria del cliente y todo lo que deba conservarse en el registro de asistencia.",
    statusAfterSending: "Estado después de enviar",
    attemptWhatsappTitle: "Intentar también el envío por WhatsApp",
    whatsappConfiguredText:
      "El proveedor está configurado. El correo sigue siendo la vía principal garantizada.",
    sendReply: "Enviar respuesta de asistencia",
    sendingReply: "Enviando respuesta de asistencia...",
    assignmentLabel: "Asignación",
    unassigned: "Sin asignar",
    updateAssignment: "Actualizar asignación",
    updatingAssignment: "Actualizando asignación...",
    threadStatusLabel: "Estado del hilo",
    statusNotePlaceholder: "Nota opcional que explique por qué cambió el estado.",
    updateStatus: "Actualizar estado",
    updatingStatus: "Actualizando estado...",
    internalNoteLabel: "Nota interna",
    internalNotePlaceholder:
      "Registra el contexto interno, el riesgo, los detalles de recuperación del servicio o lo que otro compañero necesite saber.",
    saveInternalNote: "Guardar nota interna",
    savingNote: "Guardando nota...",
  },
  loading: {
    defaultEyebrow: "Henry & Co. Care",
    premiumWorkspace: "Espacio de trabajo premium en vivo",
    finishingHandoff: "Finalizando la transferencia",
  },
};

const PT: DeepPartial<CareSupportExtraCopy> = {
  recovery: {
    badge: "Recuperação de acesso restrito",
    titleSetup: "Defina uma senha segura para o espaço de trabalho.",
    titleRecover: "Recupere o acesso à conta da equipe.",
    introSetup:
      "O link de verificação está ativo. Defina uma nova senha agora e o espaço de trabalho o encaminhará para o painel correspondente à sua função.",
    introRecover:
      "Use seu e-mail de equipe aprovado para receber um link de recuperação seguro. Os proprietários também podem gerar links de configuração diretamente na gestão de equipe.",
    cardSetupTitle: "Configuração inicial",
    cardRecoverTitle: "Recuperação de senha",
    cardSetupText:
      "As novas contas da equipe são ativadas por um link de configuração seguro e chegam ao painel correto após a criação da senha.",
    cardRecoverText:
      "Os links de recuperação restabelecem primeiro a sessão e depois permitem atualizar a senha diretamente, sem encaminhar os usuários para o espaço de trabalho errado.",
    securityTitle: "Postura de segurança",
    securityText:
      "Os controles de acesso continuam sensíveis à função e protegidos por metadados de autenticação em tempo real, e não apenas por uma rota pública.",
    backLink: "Voltar ao acesso da equipe",
    fallbackAccount: "Conta da equipe",
    createPasswordSetup: "a configuração da equipe",
    createPasswordRecovery: "a recuperação da conta",
    createPasswordPrefix: "Crie uma nova senha para concluir",
    newPasswordLabel: "Nova senha",
    confirmPasswordLabel: "Confirmar senha",
    newPasswordPlaceholder: "Pelo menos 10 caracteres",
    confirmPasswordPlaceholder: "Repita a nova senha",
    saveLabel: "Salvar senha e continuar",
    savePendingLabel: "Salvando senha",
    emailBadge: "E-mail de recuperação",
    sendHeading: "Enviar um link de recuperação seguro",
    sendIntro:
      "Se o e-mail pertencer a uma conta de equipe provisionada, a HenryCo Care preparará uma mensagem de recuperação e a colocará na fila para envio.",
    staffEmailLabel: "E-mail da equipe",
    sendLabel: "Enviar link de recuperação",
    sendPendingLabel: "Enviando link de recuperação",
  },
  reply: {
    callResultCompleted: "Concluída",
    callResultNoAnswer: "Sem resposta",
    callResultVoicemail: "Correio de voz",
    callResultBusy: "Ocupado",
    callResultWrongNumber: "Número errado",
    deliveryReady: "Pronto",
    deliverySending: "Enviando...",
    deliveryQueued: "Na fila",
    deliverySent: "Enviado ao provedor",
    deliveryDelivered: "Entregue",
    deliveryFailed: "Falhou",
    channelLabel: "Canal",
    emailLabel: "E-mail",
    whatsappLabel: "WhatsApp",
    callLogLabel: "Registro de chamadas",
    toggleWhatsappTitle: "Ativar/desativar o envio por WhatsApp",
    whatsappAvailable: "Disponível",
    recipientsLabel: "Destinatários",
    noEmailOnFile: "Nenhum e-mail registrado",
    emailStatusPrefix: "E-mail:",
    whatsappStatusPrefix: "WhatsApp:",
    statusAfterSending: "Status após o envio",
    replyAriaLabel: (name: string) => `Responder a ${name}`,
    replyPlaceholder: (name: string) =>
      `Escreva sua resposta para ${name}. Seja claro, empático e prático.`,
    sendReply: "Enviar resposta",
    sendingReply: "Enviando resposta…",
    draftSaved: "Rascunho salvo",
    discardDraft: "Descartar",
    expandReply: "Abrir resposta em tela cheia",
    collapseReply: "Recolher resposta",
    fullScreenTitle: (name: string) => `Responder a ${name}`,
    hidePreview: "Ocultar prévia",
    previewMessage: "Prévia da mensagem",
    previewForPrefix: "Prévia para",
    previewGreeting: (name: string) => `Prezado(a) ${name},`,
    refPrefix: "Ref.:",
    callOutcomeLabel: "Resultado da chamada",
    callResultSelectLabel: "Resultado da chamada",
    callOutcomePlaceholder:
      "Resuma o resultado da chamada, os pontos principais discutidos e quaisquer ações de acompanhamento...",
    callOutcomeAria: "Resultado da chamada",
    logCall: "Registrar chamada",
    cancel: "Cancelar",
  },
  controls: {
    composerEyebrow: "Editor de resposta",
    composerHeading: "Comunique o próximo passo com clareza.",
    composerIntro:
      "As respostas são entregues por e-mail. O WhatsApp pode ser tentado junto com o e-mail quando o provedor está configurado e o tópico tem um número de telefone de cliente válido.",
    replyMessageLabel: "Mensagem de resposta",
    replyMessagePlaceholder:
      "Explique a próxima ação, os prazos, a confirmação necessária do cliente e tudo o que deve ser preservado no registro de suporte.",
    statusAfterSending: "Status após o envio",
    attemptWhatsappTitle: "Também tentar o envio por WhatsApp",
    whatsappConfiguredText:
      "O provedor está configurado. O e-mail continua sendo a via principal garantida.",
    sendReply: "Enviar resposta de suporte",
    sendingReply: "Enviando resposta de suporte...",
    assignmentLabel: "Atribuição",
    unassigned: "Não atribuído",
    updateAssignment: "Atualizar atribuição",
    updatingAssignment: "Atualizando atribuição...",
    threadStatusLabel: "Status do tópico",
    statusNotePlaceholder: "Nota opcional explicando por que o status mudou.",
    updateStatus: "Atualizar status",
    updatingStatus: "Atualizando status...",
    internalNoteLabel: "Nota interna",
    internalNotePlaceholder:
      "Registre o contexto interno, o risco, os detalhes da recuperação de serviço ou o que outro colega precisa saber.",
    saveInternalNote: "Salvar nota interna",
    savingNote: "Salvando nota...",
  },
  loading: {
    defaultEyebrow: "Henry & Co. Care",
    premiumWorkspace: "Espaço de trabalho premium ao vivo",
    finishingHandoff: "Concluindo a transferência",
  },
};

const AR: DeepPartial<CareSupportExtraCopy> = {
  recovery: {
    badge: "استعادة الوصول المقيد",
    titleSetup: "عيّن كلمة مرور آمنة لمساحة العمل.",
    titleRecover: "استعد الوصول إلى حساب الموظف.",
    introSetup:
      "رابط التحقق نشط. عيّن كلمة مرور جديدة الآن وستوجهك مساحة العمل إلى لوحة التحكم المناسبة لدورك.",
    introRecover:
      "استخدم بريد الموظف المعتمد لتلقي رابط استعادة آمن. يمكن للمالكين أيضًا إنشاء روابط الإعداد مباشرة من إدارة الموظفين.",
    cardSetupTitle: "الإعداد لأول مرة",
    cardRecoverTitle: "استعادة كلمة المرور",
    cardSetupText:
      "يتم تفعيل حسابات الموظفين الجديدة عبر رابط إعداد آمن وتصل إلى لوحة التحكم الصحيحة بعد إنشاء كلمة المرور.",
    cardRecoverText:
      "تعيد روابط الاستعادة إنشاء الجلسة أولاً، ثم تتيح تحديث كلمة المرور مباشرة دون توجيه المستخدمين إلى مساحة العمل الخاطئة.",
    securityTitle: "الوضع الأمني",
    securityText:
      "تظل عمليات التحقق من الوصول مدركة للأدوار ومحمية ببيانات المصادقة المباشرة، وليس بمسار عام فقط.",
    backLink: "العودة إلى وصول الموظفين",
    fallbackAccount: "حساب الموظف",
    createPasswordSetup: "إعداد الموظف",
    createPasswordRecovery: "استعادة الحساب",
    createPasswordPrefix: "أنشئ كلمة مرور جديدة لإكمال",
    newPasswordLabel: "كلمة مرور جديدة",
    confirmPasswordLabel: "تأكيد كلمة المرور",
    newPasswordPlaceholder: "10 أحرف على الأقل",
    confirmPasswordPlaceholder: "كرر كلمة المرور الجديدة",
    saveLabel: "حفظ كلمة المرور والمتابعة",
    savePendingLabel: "جارٍ حفظ كلمة المرور",
    emailBadge: "بريد الاستعادة",
    sendHeading: "إرسال رابط استعادة آمن",
    sendIntro:
      "إذا كان البريد الإلكتروني يخص حساب موظف معتمد، فستقوم HenryCo Care بإعداد رسالة استعادة وإدراجها في قائمة الانتظار للإرسال.",
    staffEmailLabel: "بريد الموظف",
    sendLabel: "إرسال رابط الاستعادة",
    sendPendingLabel: "جارٍ إرسال رابط الاستعادة",
  },
  reply: {
    callResultCompleted: "مكتملة",
    callResultNoAnswer: "لا يوجد رد",
    callResultVoicemail: "البريد الصوتي",
    callResultBusy: "مشغول",
    callResultWrongNumber: "رقم خاطئ",
    deliveryReady: "جاهز",
    deliverySending: "جارٍ الإرسال...",
    deliveryQueued: "في قائمة الانتظار",
    deliverySent: "أُرسل إلى المزود",
    deliveryDelivered: "تم التسليم",
    deliveryFailed: "فشل",
    channelLabel: "القناة",
    emailLabel: "البريد الإلكتروني",
    whatsappLabel: "واتساب",
    callLogLabel: "سجل المكالمات",
    toggleWhatsappTitle: "تبديل تسليم واتساب",
    whatsappAvailable: "متاح",
    recipientsLabel: "المستلمون",
    noEmailOnFile: "لا يوجد بريد إلكتروني مسجل",
    emailStatusPrefix: "البريد الإلكتروني:",
    whatsappStatusPrefix: "واتساب:",
    statusAfterSending: "الحالة بعد الإرسال",
    replyAriaLabel: (name: string) => `الرد على ${name}`,
    replyPlaceholder: (name: string) =>
      `اكتب ردك إلى ${name}. كن واضحًا ومتعاطفًا وقابلاً للتنفيذ.`,
    sendReply: "إرسال الرد",
    sendingReply: "جارٍ إرسال الرد…",
    draftSaved: "تم حفظ المسودة",
    discardDraft: "تجاهل",
    expandReply: "فتح الرد بملء الشاشة",
    collapseReply: "طي الرد",
    fullScreenTitle: (name: string) => `الرد على ${name}`,
    hidePreview: "إخفاء المعاينة",
    previewMessage: "معاينة الرسالة",
    previewForPrefix: "معاينة لـ",
    previewGreeting: (name: string) => `عزيزي ${name},`,
    refPrefix: "المرجع:",
    callOutcomeLabel: "نتيجة المكالمة",
    callResultSelectLabel: "نتيجة المكالمة",
    callOutcomePlaceholder:
      "لخّص نتيجة المكالمة والنقاط الرئيسية التي نوقشت وأي إجراءات متابعة...",
    callOutcomeAria: "نتيجة المكالمة",
    logCall: "تسجيل المكالمة",
    cancel: "إلغاء",
  },
  controls: {
    composerEyebrow: "محرّر الرد",
    composerHeading: "أرسل الخطوة التالية بوضوح.",
    composerIntro:
      "تُسلَّم الردود عبر البريد الإلكتروني. يمكن محاولة واتساب إلى جانب البريد الإلكتروني عند تكوين المزود وتوفر رقم هاتف صالح للعميل في المحادثة.",
    replyMessageLabel: "رسالة الرد",
    replyMessagePlaceholder:
      "اشرح الإجراء التالي والتوقيت والتأكيد المطلوب من العميل وأي شيء يجب حفظه في سجل الدعم.",
    statusAfterSending: "الحالة بعد الإرسال",
    attemptWhatsappTitle: "محاولة التسليم عبر واتساب أيضًا",
    whatsappConfiguredText:
      "تم تكوين المزود. يظل البريد الإلكتروني هو المسار الأساسي المضمون.",
    sendReply: "إرسال رد الدعم",
    sendingReply: "جارٍ إرسال رد الدعم...",
    assignmentLabel: "التعيين",
    unassigned: "غير معيَّن",
    updateAssignment: "تحديث التعيين",
    updatingAssignment: "جارٍ تحديث التعيين...",
    threadStatusLabel: "حالة المحادثة",
    statusNotePlaceholder: "ملاحظة اختيارية تشرح سبب تغيير الحالة.",
    updateStatus: "تحديث الحالة",
    updatingStatus: "جارٍ تحديث الحالة...",
    internalNoteLabel: "ملاحظة داخلية",
    internalNotePlaceholder:
      "سجّل السياق الداخلي والمخاطر وتفاصيل استرداد الخدمة أو ما يحتاج زميل آخر إلى معرفته.",
    saveInternalNote: "حفظ الملاحظة الداخلية",
    savingNote: "جارٍ حفظ الملاحظة...",
  },
  loading: {
    defaultEyebrow: "Henry & Co. Care",
    premiumWorkspace: "مساحة عمل مباشرة مميزة",
    finishingHandoff: "إنهاء عملية التسليم",
  },
};

const DE: DeepPartial<CareSupportExtraCopy> = {
  recovery: {
    badge: "Wiederherstellung des eingeschränkten Zugriffs",
    titleSetup: "Legen Sie ein sicheres Arbeitsbereich-Passwort fest.",
    titleRecover: "Stellen Sie den Zugriff auf das Mitarbeiterkonto wieder her.",
    introSetup:
      "Der Bestätigungslink ist aktiv. Legen Sie jetzt ein neues Passwort fest, und der Arbeitsbereich leitet Sie zum passenden Rollen-Dashboard weiter.",
    introRecover:
      "Verwenden Sie Ihre genehmigte Mitarbeiter-E-Mail, um einen sicheren Wiederherstellungslink zu erhalten. Inhaber können Einrichtungslinks auch direkt in der Mitarbeiterverwaltung erzeugen.",
    cardSetupTitle: "Erstmalige Einrichtung",
    cardRecoverTitle: "Passwort-Wiederherstellung",
    cardSetupText:
      "Neue Mitarbeiterkonten werden über einen sicheren Einrichtungslink aktiviert und gelangen nach der Passworterstellung in das richtige Dashboard.",
    cardRecoverText:
      "Wiederherstellungslinks stellen zuerst die Sitzung wieder her und ermöglichen dann eine direkte Passwortaktualisierung, ohne Benutzer in den falschen Arbeitsbereich zu leiten.",
    securityTitle: "Sicherheitslage",
    securityText:
      "Zugriffsprüfungen bleiben rollenbewusst und durch Live-Authentifizierungs-Metadaten geschützt, nicht allein durch eine öffentliche Route.",
    backLink: "Zurück zum Mitarbeiterzugang",
    fallbackAccount: "Mitarbeiterkonto",
    createPasswordSetup: "die Mitarbeitereinrichtung",
    createPasswordRecovery: "die Kontowiederherstellung",
    createPasswordPrefix: "Erstellen Sie ein neues Passwort, um abzuschließen:",
    newPasswordLabel: "Neues Passwort",
    confirmPasswordLabel: "Passwort bestätigen",
    newPasswordPlaceholder: "Mindestens 10 Zeichen",
    confirmPasswordPlaceholder: "Neues Passwort wiederholen",
    saveLabel: "Passwort speichern und fortfahren",
    savePendingLabel: "Passwort wird gespeichert",
    emailBadge: "Wiederherstellungs-E-Mail",
    sendHeading: "Sicheren Wiederherstellungslink senden",
    sendIntro:
      "Wenn die E-Mail zu einem bereitgestellten Mitarbeiterkonto gehört, bereitet HenryCo Care eine Wiederherstellungsnachricht vor und stellt sie zum Versand in die Warteschlange.",
    staffEmailLabel: "Mitarbeiter-E-Mail",
    sendLabel: "Wiederherstellungslink senden",
    sendPendingLabel: "Wiederherstellungslink wird gesendet",
  },
  reply: {
    callResultCompleted: "Abgeschlossen",
    callResultNoAnswer: "Keine Antwort",
    callResultVoicemail: "Mailbox",
    callResultBusy: "Besetzt",
    callResultWrongNumber: "Falsche Nummer",
    deliveryReady: "Bereit",
    deliverySending: "Wird gesendet...",
    deliveryQueued: "In Warteschlange",
    deliverySent: "An Anbieter gesendet",
    deliveryDelivered: "Zugestellt",
    deliveryFailed: "Fehlgeschlagen",
    channelLabel: "Kanal",
    emailLabel: "E-Mail",
    whatsappLabel: "WhatsApp",
    callLogLabel: "Anrufprotokoll",
    toggleWhatsappTitle: "WhatsApp-Zustellung umschalten",
    whatsappAvailable: "Verfügbar",
    recipientsLabel: "Empfänger",
    noEmailOnFile: "Keine E-Mail hinterlegt",
    emailStatusPrefix: "E-Mail:",
    whatsappStatusPrefix: "WhatsApp:",
    statusAfterSending: "Status nach dem Senden",
    replyAriaLabel: (name: string) => `An ${name} antworten`,
    replyPlaceholder: (name: string) =>
      `Schreiben Sie Ihre Antwort an ${name}. Seien Sie klar, einfühlsam und umsetzbar.`,
    sendReply: "Antwort senden",
    sendingReply: "Antwort wird gesendet…",
    draftSaved: "Entwurf gespeichert",
    discardDraft: "Verwerfen",
    expandReply: "Antwort im Vollbild öffnen",
    collapseReply: "Antwort einklappen",
    fullScreenTitle: (name: string) => `An ${name} antworten`,
    hidePreview: "Vorschau ausblenden",
    previewMessage: "Nachricht in der Vorschau",
    previewForPrefix: "Vorschau für",
    previewGreeting: (name: string) => `Sehr geehrte/r ${name},`,
    refPrefix: "Ref.:",
    callOutcomeLabel: "Anrufergebnis",
    callResultSelectLabel: "Anrufergebnis",
    callOutcomePlaceholder:
      "Fassen Sie das Anrufergebnis, die besprochenen Kernpunkte und etwaige Folgemaßnahmen zusammen...",
    callOutcomeAria: "Anrufergebnis",
    logCall: "Anruf protokollieren",
    cancel: "Abbrechen",
  },
  controls: {
    composerEyebrow: "Antwort-Editor",
    composerHeading: "Kommunizieren Sie den nächsten Schritt klar.",
    composerIntro:
      "Antworten werden per E-Mail zugestellt. WhatsApp kann zusätzlich zur E-Mail versucht werden, wenn der Anbieter konfiguriert ist und der Thread eine gültige Kundentelefonnummer enthält.",
    replyMessageLabel: "Antwortnachricht",
    replyMessagePlaceholder:
      "Erläutern Sie die nächste Aktion, den Zeitplan, die vom Kunden benötigte Bestätigung und alles, was im Support-Datensatz erhalten bleiben sollte.",
    statusAfterSending: "Status nach dem Senden",
    attemptWhatsappTitle: "Auch WhatsApp-Zustellung versuchen",
    whatsappConfiguredText:
      "Der Anbieter ist konfiguriert. Die E-Mail bleibt der primäre garantierte Weg.",
    sendReply: "Support-Antwort senden",
    sendingReply: "Support-Antwort wird gesendet...",
    assignmentLabel: "Zuweisung",
    unassigned: "Nicht zugewiesen",
    updateAssignment: "Zuweisung aktualisieren",
    updatingAssignment: "Zuweisung wird aktualisiert...",
    threadStatusLabel: "Thread-Status",
    statusNotePlaceholder: "Optionale Notiz, die erklärt, warum sich der Status geändert hat.",
    updateStatus: "Status aktualisieren",
    updatingStatus: "Status wird aktualisiert...",
    internalNoteLabel: "Interne Notiz",
    internalNotePlaceholder:
      "Erfassen Sie internen Kontext, Risiken, Details zur Serviceverbesserung oder was ein anderes Teammitglied wissen muss.",
    saveInternalNote: "Interne Notiz speichern",
    savingNote: "Notiz wird gespeichert...",
  },
  loading: {
    defaultEyebrow: "Henry & Co. Care",
    premiumWorkspace: "Premium-Live-Arbeitsbereich",
    finishingHandoff: "Übergabe wird abgeschlossen",
  },
};

const IT: DeepPartial<CareSupportExtraCopy> = {
  recovery: {
    badge: "Ripristino dell'accesso riservato",
    titleSetup: "Imposta una password sicura per l'area di lavoro.",
    titleRecover: "Ripristina l'accesso all'account del personale.",
    introSetup:
      "Il link di verifica è attivo. Imposta ora una nuova password e l'area di lavoro ti indirizzerà alla dashboard corrispondente al tuo ruolo.",
    introRecover:
      "Usa la tua e-mail del personale approvata per ricevere un link di ripristino sicuro. I proprietari possono anche generare link di configurazione direttamente dalla gestione del personale.",
    cardSetupTitle: "Configurazione iniziale",
    cardRecoverTitle: "Ripristino della password",
    cardSetupText:
      "I nuovi account del personale vengono attivati tramite un link di configurazione sicuro e arrivano nella dashboard corretta dopo la creazione della password.",
    cardRecoverText:
      "I link di ripristino ristabiliscono prima la sessione, poi consentono un aggiornamento diretto della password senza indirizzare gli utenti all'area di lavoro sbagliata.",
    securityTitle: "Postura di sicurezza",
    securityText:
      "I controlli di accesso restano sensibili al ruolo e protetti da metadati di autenticazione in tempo reale, non solo da una rotta pubblica.",
    backLink: "Torna all'accesso del personale",
    fallbackAccount: "Account del personale",
    createPasswordSetup: "la configurazione del personale",
    createPasswordRecovery: "il ripristino dell'account",
    createPasswordPrefix: "Crea una nuova password per completare",
    newPasswordLabel: "Nuova password",
    confirmPasswordLabel: "Conferma password",
    newPasswordPlaceholder: "Almeno 10 caratteri",
    confirmPasswordPlaceholder: "Ripeti la nuova password",
    saveLabel: "Salva la password e continua",
    savePendingLabel: "Salvataggio della password",
    emailBadge: "E-mail di ripristino",
    sendHeading: "Invia un link di ripristino sicuro",
    sendIntro:
      "Se l'e-mail appartiene a un account del personale predisposto, HenryCo Care preparerà un messaggio di ripristino e lo metterà in coda per l'invio.",
    staffEmailLabel: "E-mail del personale",
    sendLabel: "Invia link di ripristino",
    sendPendingLabel: "Invio del link di ripristino",
  },
  reply: {
    callResultCompleted: "Completata",
    callResultNoAnswer: "Nessuna risposta",
    callResultVoicemail: "Segreteria",
    callResultBusy: "Occupato",
    callResultWrongNumber: "Numero errato",
    deliveryReady: "Pronto",
    deliverySending: "Invio in corso...",
    deliveryQueued: "In coda",
    deliverySent: "Inviato al provider",
    deliveryDelivered: "Consegnato",
    deliveryFailed: "Non riuscito",
    channelLabel: "Canale",
    emailLabel: "E-mail",
    whatsappLabel: "WhatsApp",
    callLogLabel: "Registro chiamate",
    toggleWhatsappTitle: "Attiva/disattiva la consegna WhatsApp",
    whatsappAvailable: "Disponibile",
    recipientsLabel: "Destinatari",
    noEmailOnFile: "Nessuna e-mail registrata",
    emailStatusPrefix: "E-mail:",
    whatsappStatusPrefix: "WhatsApp:",
    statusAfterSending: "Stato dopo l'invio",
    replyAriaLabel: (name: string) => `Rispondi a ${name}`,
    replyPlaceholder: (name: string) =>
      `Scrivi la tua risposta a ${name}. Sii chiaro, empatico e concreto.`,
    sendReply: "Invia risposta",
    sendingReply: "Invio della risposta…",
    draftSaved: "Bozza salvata",
    discardDraft: "Scarta",
    expandReply: "Apri la risposta a schermo intero",
    collapseReply: "Comprimi la risposta",
    fullScreenTitle: (name: string) => `Rispondi a ${name}`,
    hidePreview: "Nascondi anteprima",
    previewMessage: "Anteprima del messaggio",
    previewForPrefix: "Anteprima per",
    previewGreeting: (name: string) => `Gentile ${name},`,
    refPrefix: "Rif.:",
    callOutcomeLabel: "Esito della chiamata",
    callResultSelectLabel: "Esito della chiamata",
    callOutcomePlaceholder:
      "Riassumi l'esito della chiamata, i punti chiave discussi ed eventuali azioni di follow-up...",
    callOutcomeAria: "Esito della chiamata",
    logCall: "Registra chiamata",
    cancel: "Annulla",
  },
  controls: {
    composerEyebrow: "Editor di risposta",
    composerHeading: "Comunica chiaramente il passo successivo.",
    composerIntro:
      "Le risposte vengono consegnate via e-mail. WhatsApp può essere tentato insieme all'e-mail quando il provider è configurato e la conversazione ha un numero di telefono cliente valido.",
    replyMessageLabel: "Messaggio di risposta",
    replyMessagePlaceholder:
      "Spiega l'azione successiva, le tempistiche, la conferma necessaria dal cliente e tutto ciò che dovrebbe essere conservato nel registro di assistenza.",
    statusAfterSending: "Stato dopo l'invio",
    attemptWhatsappTitle: "Tenta anche la consegna via WhatsApp",
    whatsappConfiguredText:
      "Il provider è configurato. L'e-mail resta la via principale garantita.",
    sendReply: "Invia risposta di assistenza",
    sendingReply: "Invio della risposta di assistenza...",
    assignmentLabel: "Assegnazione",
    unassigned: "Non assegnato",
    updateAssignment: "Aggiorna assegnazione",
    updatingAssignment: "Aggiornamento dell'assegnazione...",
    threadStatusLabel: "Stato della conversazione",
    statusNotePlaceholder: "Nota facoltativa che spiega perché lo stato è cambiato.",
    updateStatus: "Aggiorna stato",
    updatingStatus: "Aggiornamento dello stato...",
    internalNoteLabel: "Nota interna",
    internalNotePlaceholder:
      "Annota il contesto interno, i rischi, i dettagli del recupero del servizio o ciò che un altro collega deve sapere.",
    saveInternalNote: "Salva nota interna",
    savingNote: "Salvataggio della nota...",
  },
  loading: {
    defaultEyebrow: "Henry & Co. Care",
    premiumWorkspace: "Area di lavoro premium in tempo reale",
    finishingHandoff: "Completamento del passaggio di consegne",
  },
};

const ZH: DeepPartial<CareSupportExtraCopy> = {
  recovery: {
    badge: "受限访问恢复",
    titleSetup: "为工作区设置一个安全密码。",
    titleRecover: "恢复员工账户访问权限。",
    introSetup:
      "验证链接已激活。立即设置新密码，工作区将引导您进入对应角色的仪表板。",
    introRecover:
      "使用您已获批准的员工邮箱接收安全恢复链接。所有者也可以直接在员工管理中生成设置链接。",
    cardSetupTitle: "首次设置",
    cardRecoverTitle: "密码恢复",
    cardSetupText:
      "新员工账户通过安全设置链接激活，创建密码后将进入正确的仪表板。",
    cardRecoverText:
      "恢复链接会先重新建立会话，然后允许直接更新密码，而不会将用户引导到错误的工作区。",
    securityTitle: "安全态势",
    securityText:
      "访问检查仍然基于角色，并受实时身份验证元数据保护，而不仅仅依赖公共路由。",
    backLink: "返回员工访问",
    fallbackAccount: "员工账户",
    createPasswordSetup: "员工设置",
    createPasswordRecovery: "账户恢复",
    createPasswordPrefix: "创建新密码以完成",
    newPasswordLabel: "新密码",
    confirmPasswordLabel: "确认密码",
    newPasswordPlaceholder: "至少 10 个字符",
    confirmPasswordPlaceholder: "再次输入新密码",
    saveLabel: "保存密码并继续",
    savePendingLabel: "正在保存密码",
    emailBadge: "恢复邮件",
    sendHeading: "发送安全恢复链接",
    sendIntro:
      "如果该邮箱属于已配置的员工账户，HenryCo Care 将准备一封恢复邮件并加入发送队列。",
    staffEmailLabel: "员工邮箱",
    sendLabel: "发送恢复链接",
    sendPendingLabel: "正在发送恢复链接",
  },
  reply: {
    callResultCompleted: "已完成",
    callResultNoAnswer: "无人接听",
    callResultVoicemail: "语音信箱",
    callResultBusy: "占线",
    callResultWrongNumber: "号码有误",
    deliveryReady: "就绪",
    deliverySending: "发送中...",
    deliveryQueued: "已排队",
    deliverySent: "已发送至服务商",
    deliveryDelivered: "已送达",
    deliveryFailed: "失败",
    channelLabel: "渠道",
    emailLabel: "电子邮件",
    whatsappLabel: "WhatsApp",
    callLogLabel: "通话记录",
    toggleWhatsappTitle: "切换 WhatsApp 投递",
    whatsappAvailable: "可用",
    recipientsLabel: "收件人",
    noEmailOnFile: "没有登记的电子邮件",
    emailStatusPrefix: "电子邮件：",
    whatsappStatusPrefix: "WhatsApp：",
    statusAfterSending: "发送后的状态",
    replyAriaLabel: (name: string) => `回复 ${name}`,
    replyPlaceholder: (name: string) =>
      `撰写您给 ${name} 的回复。请清晰、有同理心且具有可操作性。`,
    sendReply: "发送回复",
    sendingReply: "正在发送回复…",
    draftSaved: "草稿已保存",
    discardDraft: "放弃",
    expandReply: "打开全屏回复",
    collapseReply: "收起回复",
    fullScreenTitle: (name: string) => `回复 ${name}`,
    hidePreview: "隐藏预览",
    previewMessage: "预览消息",
    previewForPrefix: "预览给",
    previewGreeting: (name: string) => `尊敬的 ${name}：`,
    refPrefix: "编号：",
    callOutcomeLabel: "通话结果",
    callResultSelectLabel: "通话结果",
    callOutcomePlaceholder:
      "总结通话结果、讨论的要点以及任何后续行动……",
    callOutcomeAria: "通话结果",
    logCall: "记录通话",
    cancel: "取消",
  },
  controls: {
    composerEyebrow: "回复编辑器",
    composerHeading: "清晰地传达下一步。",
    composerIntro:
      "回复通过电子邮件发送。当服务商已配置且会话有有效的客户电话号码时，可以在发送电子邮件的同时尝试 WhatsApp。",
    replyMessageLabel: "回复消息",
    replyMessagePlaceholder:
      "说明下一步行动、时间安排、需要客户确认的内容，以及任何应保留在支持记录中的信息。",
    statusAfterSending: "发送后的状态",
    attemptWhatsappTitle: "同时尝试 WhatsApp 投递",
    whatsappConfiguredText: "服务商已配置。电子邮件仍是主要的有保障的渠道。",
    sendReply: "发送支持回复",
    sendingReply: "正在发送支持回复...",
    assignmentLabel: "指派",
    unassigned: "未指派",
    updateAssignment: "更新指派",
    updatingAssignment: "正在更新指派...",
    threadStatusLabel: "会话状态",
    statusNotePlaceholder: "可选备注，说明状态变更的原因。",
    updateStatus: "更新状态",
    updatingStatus: "正在更新状态...",
    internalNoteLabel: "内部备注",
    internalNotePlaceholder:
      "记录内部背景、风险、服务补救细节或其他同事需要知道的信息。",
    saveInternalNote: "保存内部备注",
    savingNote: "正在保存备注...",
  },
  loading: {
    defaultEyebrow: "Henry & Co. Care",
    premiumWorkspace: "高端实时工作区",
    finishingHandoff: "正在完成交接",
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<CareSupportExtraCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
};
// ig, yo, ha, hi are intentionally OMITTED -> fall back to EN (human-translation only).

export function getCareSupportExtraCopy(locale: AppLocale): CareSupportExtraCopy {
  const o = LOCALE_MAP[locale];
  if (o)
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      o as unknown as Record<string, unknown>
    ) as unknown as CareSupportExtraCopy;
  return EN;
}
