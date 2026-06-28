import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * Rooms surface copy (@henryco/rooms).
 *
 * One top-level key per component:
 *   - collabEditor  -> CollabEditorPane
 *   - recordingConsent -> RecordingConsent
 *   - roomChat      -> RoomChat
 *   - roomShell     -> RoomShell (incl. prejoin, error states, controls)
 *   - scorecard     -> ScorecardSidebar
 *
 * English is the exhaustive baseline; fr/es/pt/ar/de/it/zh are authored in
 * full. ig/yo/ha/hi are intentionally omitted and fall back to English
 * (human-translation only).
 *
 * Placeholders such as {language}, {count}, {error}, {seconds}, {version}
 * and {percent} are substituted by the caller and must be preserved verbatim
 * in every locale. "HenryCo" is a brand name and stays verbatim across all
 * locales.
 */
export type RoomsCopy = {
  collabEditor: {
    defaultKicker: string;
    defaultTitle: string;
    languageSelectLabel: string;
    placeholderJs: string;
    placeholderPython: string;
    placeholderPlain: string;
    noSessionHeadline: string;
    noSessionBody: string;
    syncedNote: string;
    localNote: string;
    editorForLanguage: (language: string) => string;
    charCount: (count: string) => string;
    save: string;
    saved: string;
  };
  recordingConsent: {
    title: string;
    kicker: string;
    intro: string;
    bulletWithdraw: string;
    bulletCopyDeletion: string;
    bulletAllConsent: string;
    versionLabel: string;
    saveError: (error: string) => string;
    withdraw: string;
    keepConsent: string;
    consent: string;
    notNow: string;
  };
  roomChat: {
    panelLabel: string;
    messageLabel: string;
    placeholder: string;
    sendLabel: string;
    send: string;
    sending: string;
    emptyKicker: string;
    emptyHeadline: string;
    emptyBody: string;
    sendError: (error: string) => string;
    you: string;
    participantFallback: string;
  };
  roomShell: {
    defaultTitle: string;
    defaultKicker: string;
    recordingBadge: string;
    raiseHand: string;
    mute: string;
    muteLabel: string;
    leave: string;
    startRecording: string;
    stopRecording: string;
    reviewConsentLabel: string;
    provideConsentLabel: string;
    consentGranted: string;
    consentPending: string;
    videoTitle: string;
    endedKicker: string;
    endedHeadline: string;
    endedBody: string;
    prejoinKicker: string;
    prejoinHeadline: string;
    prejoinBody: string;
    joinRoom: string;
    tryAgain: string;
    errorKicker: string;
    error: {
      defaultHeadline: string;
      defaultBody: string;
      unavailableHeadline: string;
      unavailableBody: string;
      offlineHeadline: string;
      offlineBody: string;
      notFoundHeadline: string;
      notFoundBody: string;
      closedHeadline: string;
      closedBody: string;
      unauthorizedHeadline: string;
      unauthorizedBody: string;
      consentHeadline: string;
      consentBody: string;
      rateLimitedHeadline: string;
      rateLimitedBody: (seconds: number) => string;
      validationHeadline: string;
      internalHeadline: string;
      internalBody: string;
    };
  };
  scorecard: {
    defaultKicker: string;
    defaultTitle: string;
    percentComplete: (percent: number) => string;
    noScorecardHeadline: string;
    noScorecardBody: string;
    notesLabel: string;
    notesPlaceholder: string;
    saveError: (error: string) => string;
    submit: string;
    submitted: string;
  };
};

const EN: RoomsCopy = {
  collabEditor: {
    defaultKicker: "Live editor",
    defaultTitle: "Collab editor",
    languageSelectLabel: "Editor language",
    placeholderJs: "// Start typing — your collaborator sees your edits.",
    placeholderPython: "# Start typing — your collaborator sees your edits.",
    placeholderPlain: "Start typing — your collaborator sees your edits.",
    noSessionHeadline: "No session bound",
    noSessionBody: "The collab editor requires a session id to persist edits.",
    syncedNote: "Real-time edits are synced with everyone in the room.",
    localNote: "Edits are local until you save.",
    editorForLanguage: (language: string) => `Editor for ${language}`,
    charCount: (count: string) => `${count} chars`,
    save: "Save",
    saved: "Saved",
  },
  recordingConsent: {
    title: "Recording consent",
    kicker: "Live room",
    intro:
      "This session may be recorded for review. The recording is stored on HenryCo infrastructure and is accessible only to participants and the session owner.",
    bulletWithdraw:
      "You can withdraw consent at any time — recording will stop.",
    bulletCopyDeletion:
      "You can request a copy or deletion of the recording from your account settings.",
    bulletAllConsent:
      "Recording will not start until every participant has consented.",
    versionLabel: "Consent text version:",
    saveError: (error: string) =>
      `We couldn't save your choice (${error}). Try again.`,
    withdraw: "Withdraw consent",
    keepConsent: "Keep consent",
    consent: "I consent to recording",
    notNow: "Not now",
  },
  roomChat: {
    panelLabel: "Room chat",
    messageLabel: "Chat message",
    placeholder: "Type a message — Enter to send.",
    sendLabel: "Send message",
    send: "Send",
    sending: "Sending…",
    emptyKicker: "Room chat",
    emptyHeadline: "No messages yet",
    emptyBody:
      "Send the first message — others in the room will see it instantly.",
    sendError: (error: string) => `Could not send: ${error}`,
    you: "You",
    participantFallback: "Participant",
  },
  roomShell: {
    defaultTitle: "Live room",
    defaultKicker: "Room",
    recordingBadge: "Recording",
    raiseHand: "Raise hand",
    mute: "Mute",
    muteLabel: "Toggle mute (use the iframe controls)",
    leave: "Leave",
    startRecording: "Start recording",
    stopRecording: "Stop recording",
    reviewConsentLabel: "Review recording consent",
    provideConsentLabel: "Provide recording consent",
    consentGranted: "Recording consent: granted",
    consentPending: "Recording consent: pending",
    videoTitle: "Room video",
    endedKicker: "Room",
    endedHeadline: "This room has ended",
    endedBody:
      "Recordings, transcripts, and the scorecard remain available in this page.",
    prejoinKicker: "Live room",
    prejoinHeadline: "Ready when you are",
    prejoinBody:
      "Tap join to connect. Your camera and microphone won't turn on until you confirm in the prejoin step.",
    joinRoom: "Join room",
    tryAgain: "Try again",
    errorKicker: "We hit a snag",
    error: {
      defaultHeadline: "Couldn't join the room",
      defaultBody:
        "Please try again. If this keeps happening, the live host can resend an invite.",
      unavailableHeadline: "Live rooms aren't configured yet",
      unavailableBody:
        "An admin needs to enable the room provider for this environment.",
      offlineHeadline: "The room service is offline",
      offlineBody: "Hold on — we'll retry, or try refreshing in a moment.",
      notFoundHeadline: "Couldn't find this room",
      notFoundBody:
        "It may have been removed by the host. Check your invitation link.",
      closedHeadline: "This room is closed",
      closedBody: "It has already ended or was cancelled by the host.",
      unauthorizedHeadline: "You can't join this room",
      unauthorizedBody:
        "Sign in with the account that received the invitation.",
      consentHeadline: "Recording consent is required",
      consentBody:
        "One or more participants need to consent before recording can start.",
      rateLimitedHeadline: "Too many tries",
      rateLimitedBody: (seconds: number) => `Wait ${seconds}s and try again.`,
      validationHeadline: "Something's off with the request",
      internalHeadline: "We hit a snag",
      internalBody:
        "Please try again. If this keeps happening, refresh the page.",
    },
  },
  scorecard: {
    defaultKicker: "Reviewer",
    defaultTitle: "Scorecard",
    percentComplete: (percent: number) => `${percent}% complete`,
    noScorecardHeadline: "No scorecard configured",
    noScorecardBody:
      "Pass a `dimensions` prop to render a reviewer scorecard for this session.",
    notesLabel: "Notes",
    notesPlaceholder: "Anything the next reviewer should know.",
    saveError: (error: string) =>
      `We couldn't save your scorecard (${error}). Try again.`,
    submit: "Submit scorecard",
    submitted: "Submitted",
  },
};

const FR: DeepPartial<RoomsCopy> = {
  collabEditor: {
    defaultKicker: "Éditeur en direct",
    defaultTitle: "Éditeur collaboratif",
    languageSelectLabel: "Langage de l'éditeur",
    placeholderJs:
      "// Commencez à taper — votre collaborateur voit vos modifications.",
    placeholderPython:
      "# Commencez à taper — votre collaborateur voit vos modifications.",
    placeholderPlain:
      "Commencez à taper — votre collaborateur voit vos modifications.",
    noSessionHeadline: "Aucune session associée",
    noSessionBody:
      "L'éditeur collaboratif nécessite un identifiant de session pour enregistrer les modifications.",
    syncedNote:
      "Les modifications en temps réel sont synchronisées avec tous les participants de la salle.",
    localNote: "Les modifications restent locales jusqu'à l'enregistrement.",
    editorForLanguage: (language: string) => `Éditeur pour ${language}`,
    charCount: (count: string) => `${count} caractères`,
    save: "Enregistrer",
    saved: "Enregistré",
  },
  recordingConsent: {
    title: "Consentement à l'enregistrement",
    kicker: "Salle en direct",
    intro:
      "Cette session peut être enregistrée à des fins de relecture. L'enregistrement est stocké sur l'infrastructure HenryCo et n'est accessible qu'aux participants et au propriétaire de la session.",
    bulletWithdraw:
      "Vous pouvez retirer votre consentement à tout moment — l'enregistrement s'arrêtera.",
    bulletCopyDeletion:
      "Vous pouvez demander une copie ou la suppression de l'enregistrement depuis les paramètres de votre compte.",
    bulletAllConsent:
      "L'enregistrement ne démarrera pas tant que chaque participant n'aura pas donné son consentement.",
    versionLabel: "Version du texte de consentement :",
    saveError: (error: string) =>
      `Nous n'avons pas pu enregistrer votre choix (${error}). Réessayez.`,
    withdraw: "Retirer le consentement",
    keepConsent: "Maintenir le consentement",
    consent: "Je consens à l'enregistrement",
    notNow: "Pas maintenant",
  },
  roomChat: {
    panelLabel: "Discussion de la salle",
    messageLabel: "Message de discussion",
    placeholder: "Tapez un message — Entrée pour envoyer.",
    sendLabel: "Envoyer le message",
    send: "Envoyer",
    sending: "Envoi…",
    emptyKicker: "Discussion de la salle",
    emptyHeadline: "Aucun message pour le moment",
    emptyBody:
      "Envoyez le premier message — les autres participants de la salle le verront instantanément.",
    sendError: (error: string) => `Envoi impossible : ${error}`,
    you: "Vous",
    participantFallback: "Participant",
  },
  roomShell: {
    defaultTitle: "Salle en direct",
    defaultKicker: "Salle",
    recordingBadge: "Enregistrement",
    raiseHand: "Lever la main",
    mute: "Couper le micro",
    muteLabel: "Activer/désactiver le micro (utilisez les commandes de l'iframe)",
    leave: "Quitter",
    startRecording: "Démarrer l'enregistrement",
    stopRecording: "Arrêter l'enregistrement",
    reviewConsentLabel: "Revoir le consentement à l'enregistrement",
    provideConsentLabel: "Donner le consentement à l'enregistrement",
    consentGranted: "Consentement à l'enregistrement : accordé",
    consentPending: "Consentement à l'enregistrement : en attente",
    videoTitle: "Vidéo de la salle",
    endedKicker: "Salle",
    endedHeadline: "Cette salle est terminée",
    endedBody:
      "Les enregistrements, transcriptions et l'évaluation restent disponibles sur cette page.",
    prejoinKicker: "Salle en direct",
    prejoinHeadline: "Prêt quand vous l'êtes",
    prejoinBody:
      "Appuyez sur rejoindre pour vous connecter. Votre caméra et votre micro ne s'activeront pas tant que vous ne l'aurez pas confirmé à l'étape de préconnexion.",
    joinRoom: "Rejoindre la salle",
    tryAgain: "Réessayer",
    errorKicker: "Un problème est survenu",
    error: {
      defaultHeadline: "Impossible de rejoindre la salle",
      defaultBody:
        "Veuillez réessayer. Si le problème persiste, l'hôte en direct peut renvoyer une invitation.",
      unavailableHeadline: "Les salles en direct ne sont pas encore configurées",
      unavailableBody:
        "Un administrateur doit activer le fournisseur de salles pour cet environnement.",
      offlineHeadline: "Le service de salle est hors ligne",
      offlineBody:
        "Patientez — nous allons réessayer, ou actualisez la page dans un instant.",
      notFoundHeadline: "Impossible de trouver cette salle",
      notFoundBody:
        "Elle a peut-être été supprimée par l'hôte. Vérifiez votre lien d'invitation.",
      closedHeadline: "Cette salle est fermée",
      closedBody: "Elle est déjà terminée ou a été annulée par l'hôte.",
      unauthorizedHeadline: "Vous ne pouvez pas rejoindre cette salle",
      unauthorizedBody:
        "Connectez-vous avec le compte qui a reçu l'invitation.",
      consentHeadline: "Le consentement à l'enregistrement est requis",
      consentBody:
        "Un ou plusieurs participants doivent donner leur consentement avant que l'enregistrement puisse commencer.",
      rateLimitedHeadline: "Trop de tentatives",
      rateLimitedBody: (seconds: number) =>
        `Attendez ${seconds} s et réessayez.`,
      validationHeadline: "Un problème est survenu avec la demande",
      internalHeadline: "Un problème est survenu",
      internalBody:
        "Veuillez réessayer. Si le problème persiste, actualisez la page.",
    },
  },
  scorecard: {
    defaultKicker: "Évaluateur",
    defaultTitle: "Évaluation",
    percentComplete: (percent: number) => `${percent} % terminé`,
    noScorecardHeadline: "Aucune évaluation configurée",
    noScorecardBody:
      "Transmettez une propriété `dimensions` pour afficher une évaluation pour cette session.",
    notesLabel: "Notes",
    notesPlaceholder: "Tout ce que le prochain évaluateur devrait savoir.",
    saveError: (error: string) =>
      `Nous n'avons pas pu enregistrer votre évaluation (${error}). Réessayez.`,
    submit: "Soumettre l'évaluation",
    submitted: "Soumis",
  },
};

const ES: DeepPartial<RoomsCopy> = {
  collabEditor: {
    defaultKicker: "Editor en vivo",
    defaultTitle: "Editor colaborativo",
    languageSelectLabel: "Lenguaje del editor",
    placeholderJs:
      "// Empieza a escribir — tu colaborador ve tus cambios.",
    placeholderPython:
      "# Empieza a escribir — tu colaborador ve tus cambios.",
    placeholderPlain: "Empieza a escribir — tu colaborador ve tus cambios.",
    noSessionHeadline: "No hay sesión asociada",
    noSessionBody:
      "El editor colaborativo requiere un identificador de sesión para guardar los cambios.",
    syncedNote:
      "Los cambios en tiempo real se sincronizan con todos los participantes de la sala.",
    localNote: "Los cambios son locales hasta que guardes.",
    editorForLanguage: (language: string) => `Editor para ${language}`,
    charCount: (count: string) => `${count} caracteres`,
    save: "Guardar",
    saved: "Guardado",
  },
  recordingConsent: {
    title: "Consentimiento de grabación",
    kicker: "Sala en vivo",
    intro:
      "Esta sesión puede grabarse para su revisión. La grabación se almacena en la infraestructura de HenryCo y solo es accesible para los participantes y el propietario de la sesión.",
    bulletWithdraw:
      "Puedes retirar tu consentimiento en cualquier momento — la grabación se detendrá.",
    bulletCopyDeletion:
      "Puedes solicitar una copia o la eliminación de la grabación desde la configuración de tu cuenta.",
    bulletAllConsent:
      "La grabación no comenzará hasta que todos los participantes hayan dado su consentimiento.",
    versionLabel: "Versión del texto de consentimiento:",
    saveError: (error: string) =>
      `No pudimos guardar tu elección (${error}). Inténtalo de nuevo.`,
    withdraw: "Retirar consentimiento",
    keepConsent: "Mantener consentimiento",
    consent: "Doy mi consentimiento para la grabación",
    notNow: "Ahora no",
  },
  roomChat: {
    panelLabel: "Chat de la sala",
    messageLabel: "Mensaje de chat",
    placeholder: "Escribe un mensaje — Intro para enviar.",
    sendLabel: "Enviar mensaje",
    send: "Enviar",
    sending: "Enviando…",
    emptyKicker: "Chat de la sala",
    emptyHeadline: "Aún no hay mensajes",
    emptyBody:
      "Envía el primer mensaje — los demás participantes de la sala lo verán al instante.",
    sendError: (error: string) => `No se pudo enviar: ${error}`,
    you: "Tú",
    participantFallback: "Participante",
  },
  roomShell: {
    defaultTitle: "Sala en vivo",
    defaultKicker: "Sala",
    recordingBadge: "Grabando",
    raiseHand: "Levantar la mano",
    mute: "Silenciar",
    muteLabel: "Activar/desactivar silencio (usa los controles del iframe)",
    leave: "Salir",
    startRecording: "Iniciar grabación",
    stopRecording: "Detener grabación",
    reviewConsentLabel: "Revisar el consentimiento de grabación",
    provideConsentLabel: "Dar el consentimiento de grabación",
    consentGranted: "Consentimiento de grabación: concedido",
    consentPending: "Consentimiento de grabación: pendiente",
    videoTitle: "Vídeo de la sala",
    endedKicker: "Sala",
    endedHeadline: "Esta sala ha finalizado",
    endedBody:
      "Las grabaciones, transcripciones y la evaluación siguen disponibles en esta página.",
    prejoinKicker: "Sala en vivo",
    prejoinHeadline: "Listo cuando tú lo estés",
    prejoinBody:
      "Toca unirte para conectarte. Tu cámara y tu micrófono no se activarán hasta que lo confirmes en el paso previo a la conexión.",
    joinRoom: "Unirse a la sala",
    tryAgain: "Intentar de nuevo",
    errorKicker: "Tuvimos un problema",
    error: {
      defaultHeadline: "No se pudo unir a la sala",
      defaultBody:
        "Inténtalo de nuevo. Si esto sigue ocurriendo, el anfitrión en vivo puede reenviar una invitación.",
      unavailableHeadline: "Las salas en vivo aún no están configuradas",
      unavailableBody:
        "Un administrador debe habilitar el proveedor de salas para este entorno.",
      offlineHeadline: "El servicio de salas está fuera de línea",
      offlineBody:
        "Espera — volveremos a intentarlo, o actualiza la página en un momento.",
      notFoundHeadline: "No se pudo encontrar esta sala",
      notFoundBody:
        "Es posible que el anfitrión la haya eliminado. Comprueba tu enlace de invitación.",
      closedHeadline: "Esta sala está cerrada",
      closedBody: "Ya ha finalizado o el anfitrión la ha cancelado.",
      unauthorizedHeadline: "No puedes unirte a esta sala",
      unauthorizedBody:
        "Inicia sesión con la cuenta que recibió la invitación.",
      consentHeadline: "Se requiere consentimiento de grabación",
      consentBody:
        "Uno o más participantes deben dar su consentimiento antes de que pueda comenzar la grabación.",
      rateLimitedHeadline: "Demasiados intentos",
      rateLimitedBody: (seconds: number) =>
        `Espera ${seconds} s e inténtalo de nuevo.`,
      validationHeadline: "Algo no está bien con la solicitud",
      internalHeadline: "Tuvimos un problema",
      internalBody:
        "Inténtalo de nuevo. Si esto sigue ocurriendo, actualiza la página.",
    },
  },
  scorecard: {
    defaultKicker: "Evaluador",
    defaultTitle: "Evaluación",
    percentComplete: (percent: number) => `${percent} % completado`,
    noScorecardHeadline: "No hay evaluación configurada",
    noScorecardBody:
      "Pasa una propiedad `dimensions` para mostrar una evaluación para esta sesión.",
    notesLabel: "Notas",
    notesPlaceholder: "Cualquier cosa que el próximo evaluador deba saber.",
    saveError: (error: string) =>
      `No pudimos guardar tu evaluación (${error}). Inténtalo de nuevo.`,
    submit: "Enviar evaluación",
    submitted: "Enviada",
  },
};

const PT: DeepPartial<RoomsCopy> = {
  collabEditor: {
    defaultKicker: "Editor ao vivo",
    defaultTitle: "Editor colaborativo",
    languageSelectLabel: "Linguagem do editor",
    placeholderJs:
      "// Comece a digitar — seu colaborador vê suas edições.",
    placeholderPython:
      "# Comece a digitar — seu colaborador vê suas edições.",
    placeholderPlain: "Comece a digitar — seu colaborador vê suas edições.",
    noSessionHeadline: "Nenhuma sessão associada",
    noSessionBody:
      "O editor colaborativo requer um identificador de sessão para salvar as edições.",
    syncedNote:
      "As edições em tempo real são sincronizadas com todos os participantes da sala.",
    localNote: "As edições ficam locais até você salvar.",
    editorForLanguage: (language: string) => `Editor para ${language}`,
    charCount: (count: string) => `${count} caracteres`,
    save: "Salvar",
    saved: "Salvo",
  },
  recordingConsent: {
    title: "Consentimento de gravação",
    kicker: "Sala ao vivo",
    intro:
      "Esta sessão pode ser gravada para revisão. A gravação é armazenada na infraestrutura da HenryCo e só é acessível aos participantes e ao proprietário da sessão.",
    bulletWithdraw:
      "Você pode retirar o consentimento a qualquer momento — a gravação será interrompida.",
    bulletCopyDeletion:
      "Você pode solicitar uma cópia ou a exclusão da gravação nas configurações da sua conta.",
    bulletAllConsent:
      "A gravação não começará até que todos os participantes tenham dado seu consentimento.",
    versionLabel: "Versão do texto de consentimento:",
    saveError: (error: string) =>
      `Não foi possível salvar sua escolha (${error}). Tente novamente.`,
    withdraw: "Retirar consentimento",
    keepConsent: "Manter consentimento",
    consent: "Consinto com a gravação",
    notNow: "Agora não",
  },
  roomChat: {
    panelLabel: "Chat da sala",
    messageLabel: "Mensagem do chat",
    placeholder: "Digite uma mensagem — Enter para enviar.",
    sendLabel: "Enviar mensagem",
    send: "Enviar",
    sending: "Enviando…",
    emptyKicker: "Chat da sala",
    emptyHeadline: "Ainda não há mensagens",
    emptyBody:
      "Envie a primeira mensagem — os outros participantes da sala a verão instantaneamente.",
    sendError: (error: string) => `Não foi possível enviar: ${error}`,
    you: "Você",
    participantFallback: "Participante",
  },
  roomShell: {
    defaultTitle: "Sala ao vivo",
    defaultKicker: "Sala",
    recordingBadge: "Gravando",
    raiseHand: "Levantar a mão",
    mute: "Silenciar",
    muteLabel: "Ativar/desativar mudo (use os controles do iframe)",
    leave: "Sair",
    startRecording: "Iniciar gravação",
    stopRecording: "Parar gravação",
    reviewConsentLabel: "Revisar o consentimento de gravação",
    provideConsentLabel: "Fornecer o consentimento de gravação",
    consentGranted: "Consentimento de gravação: concedido",
    consentPending: "Consentimento de gravação: pendente",
    videoTitle: "Vídeo da sala",
    endedKicker: "Sala",
    endedHeadline: "Esta sala foi encerrada",
    endedBody:
      "As gravações, transcrições e a avaliação permanecem disponíveis nesta página.",
    prejoinKicker: "Sala ao vivo",
    prejoinHeadline: "Pronto quando você estiver",
    prejoinBody:
      "Toque em entrar para se conectar. Sua câmera e seu microfone não serão ativados até que você confirme na etapa de pré-entrada.",
    joinRoom: "Entrar na sala",
    tryAgain: "Tentar novamente",
    errorKicker: "Tivemos um problema",
    error: {
      defaultHeadline: "Não foi possível entrar na sala",
      defaultBody:
        "Tente novamente. Se isso continuar acontecendo, o anfitrião ao vivo pode reenviar um convite.",
      unavailableHeadline: "As salas ao vivo ainda não estão configuradas",
      unavailableBody:
        "Um administrador precisa habilitar o provedor de salas para este ambiente.",
      offlineHeadline: "O serviço de salas está offline",
      offlineBody:
        "Aguarde — tentaremos novamente, ou atualize a página em instantes.",
      notFoundHeadline: "Não foi possível encontrar esta sala",
      notFoundBody:
        "Ela pode ter sido removida pelo anfitrião. Verifique seu link de convite.",
      closedHeadline: "Esta sala está fechada",
      closedBody: "Ela já foi encerrada ou cancelada pelo anfitrião.",
      unauthorizedHeadline: "Você não pode entrar nesta sala",
      unauthorizedBody:
        "Entre com a conta que recebeu o convite.",
      consentHeadline: "É necessário o consentimento de gravação",
      consentBody:
        "Um ou mais participantes precisam dar o consentimento antes que a gravação possa começar.",
      rateLimitedHeadline: "Muitas tentativas",
      rateLimitedBody: (seconds: number) =>
        `Aguarde ${seconds} s e tente novamente.`,
      validationHeadline: "Algo está errado com a solicitação",
      internalHeadline: "Tivemos um problema",
      internalBody:
        "Tente novamente. Se isso continuar acontecendo, atualize a página.",
    },
  },
  scorecard: {
    defaultKicker: "Avaliador",
    defaultTitle: "Avaliação",
    percentComplete: (percent: number) => `${percent}% concluído`,
    noScorecardHeadline: "Nenhuma avaliação configurada",
    noScorecardBody:
      "Passe uma propriedade `dimensions` para exibir uma avaliação para esta sessão.",
    notesLabel: "Notas",
    notesPlaceholder: "Qualquer coisa que o próximo avaliador deva saber.",
    saveError: (error: string) =>
      `Não foi possível salvar sua avaliação (${error}). Tente novamente.`,
    submit: "Enviar avaliação",
    submitted: "Enviada",
  },
};

const AR: DeepPartial<RoomsCopy> = {
  collabEditor: {
    defaultKicker: "محرر مباشر",
    defaultTitle: "محرر تعاوني",
    languageSelectLabel: "لغة المحرر",
    placeholderJs: "// ابدأ الكتابة — يرى متعاونك تعديلاتك.",
    placeholderPython: "# ابدأ الكتابة — يرى متعاونك تعديلاتك.",
    placeholderPlain: "ابدأ الكتابة — يرى متعاونك تعديلاتك.",
    noSessionHeadline: "لا توجد جلسة مرتبطة",
    noSessionBody:
      "يتطلب المحرر التعاوني معرّف جلسة لحفظ التعديلات.",
    syncedNote:
      "تتم مزامنة التعديلات الفورية مع جميع المشاركين في الغرفة.",
    localNote: "تبقى التعديلات محلية حتى تقوم بالحفظ.",
    editorForLanguage: (language: string) => `محرر لـ ${language}`,
    charCount: (count: string) => `${count} حرف`,
    save: "حفظ",
    saved: "تم الحفظ",
  },
  recordingConsent: {
    title: "الموافقة على التسجيل",
    kicker: "غرفة مباشرة",
    intro:
      "قد يتم تسجيل هذه الجلسة للمراجعة. يُخزَّن التسجيل على بنية HenryCo التحتية ولا يمكن الوصول إليه إلا للمشاركين ومالك الجلسة.",
    bulletWithdraw:
      "يمكنك سحب موافقتك في أي وقت — وسيتوقف التسجيل.",
    bulletCopyDeletion:
      "يمكنك طلب نسخة من التسجيل أو حذفه من إعدادات حسابك.",
    bulletAllConsent:
      "لن يبدأ التسجيل حتى يوافق جميع المشاركين.",
    versionLabel: "إصدار نص الموافقة:",
    saveError: (error: string) =>
      `تعذّر علينا حفظ اختيارك (${error}). حاول مرة أخرى.`,
    withdraw: "سحب الموافقة",
    keepConsent: "الإبقاء على الموافقة",
    consent: "أوافق على التسجيل",
    notNow: "ليس الآن",
  },
  roomChat: {
    panelLabel: "محادثة الغرفة",
    messageLabel: "رسالة المحادثة",
    placeholder: "اكتب رسالة — اضغط Enter للإرسال.",
    sendLabel: "إرسال الرسالة",
    send: "إرسال",
    sending: "جارٍ الإرسال…",
    emptyKicker: "محادثة الغرفة",
    emptyHeadline: "لا توجد رسائل بعد",
    emptyBody:
      "أرسل الرسالة الأولى — سيراها الآخرون في الغرفة على الفور.",
    sendError: (error: string) => `تعذّر الإرسال: ${error}`,
    you: "أنت",
    participantFallback: "مشارك",
  },
  roomShell: {
    defaultTitle: "غرفة مباشرة",
    defaultKicker: "غرفة",
    recordingBadge: "جارٍ التسجيل",
    raiseHand: "رفع اليد",
    mute: "كتم الصوت",
    muteLabel: "تبديل كتم الصوت (استخدم عناصر تحكم الإطار)",
    leave: "مغادرة",
    startRecording: "بدء التسجيل",
    stopRecording: "إيقاف التسجيل",
    reviewConsentLabel: "مراجعة الموافقة على التسجيل",
    provideConsentLabel: "تقديم الموافقة على التسجيل",
    consentGranted: "الموافقة على التسجيل: ممنوحة",
    consentPending: "الموافقة على التسجيل: قيد الانتظار",
    videoTitle: "فيديو الغرفة",
    endedKicker: "غرفة",
    endedHeadline: "انتهت هذه الغرفة",
    endedBody:
      "تظل التسجيلات والنصوص والتقييم متاحة في هذه الصفحة.",
    prejoinKicker: "غرفة مباشرة",
    prejoinHeadline: "جاهز عندما تكون مستعدًا",
    prejoinBody:
      "اضغط على انضمام للاتصال. لن تعمل الكاميرا والميكروفون حتى تؤكد في خطوة ما قبل الانضمام.",
    joinRoom: "الانضمام إلى الغرفة",
    tryAgain: "حاول مرة أخرى",
    errorKicker: "واجهتنا مشكلة",
    error: {
      defaultHeadline: "تعذّر الانضمام إلى الغرفة",
      defaultBody:
        "يرجى المحاولة مرة أخرى. إذا استمر ذلك، يمكن للمضيف المباشر إعادة إرسال دعوة.",
      unavailableHeadline: "لم يتم إعداد الغرف المباشرة بعد",
      unavailableBody:
        "يجب على المسؤول تفعيل موفر الغرف لهذه البيئة.",
      offlineHeadline: "خدمة الغرف غير متصلة",
      offlineBody:
        "انتظر — سنعيد المحاولة، أو حاول تحديث الصفحة بعد قليل.",
      notFoundHeadline: "تعذّر العثور على هذه الغرفة",
      notFoundBody:
        "ربما أزالها المضيف. تحقق من رابط الدعوة الخاص بك.",
      closedHeadline: "هذه الغرفة مغلقة",
      closedBody: "لقد انتهت بالفعل أو ألغاها المضيف.",
      unauthorizedHeadline: "لا يمكنك الانضمام إلى هذه الغرفة",
      unauthorizedBody:
        "سجّل الدخول بالحساب الذي تلقى الدعوة.",
      consentHeadline: "الموافقة على التسجيل مطلوبة",
      consentBody:
        "يجب أن يوافق مشارك واحد أو أكثر قبل أن يبدأ التسجيل.",
      rateLimitedHeadline: "محاولات كثيرة جدًا",
      rateLimitedBody: (seconds: number) =>
        `انتظر ${seconds} ثانية وحاول مرة أخرى.`,
      validationHeadline: "هناك خطأ ما في الطلب",
      internalHeadline: "واجهتنا مشكلة",
      internalBody:
        "يرجى المحاولة مرة أخرى. إذا استمر ذلك، حدّث الصفحة.",
    },
  },
  scorecard: {
    defaultKicker: "المراجع",
    defaultTitle: "بطاقة التقييم",
    percentComplete: (percent: number) => `${percent}% مكتمل`,
    noScorecardHeadline: "لم يتم إعداد بطاقة تقييم",
    noScorecardBody:
      "مرّر خاصية `dimensions` لعرض بطاقة تقييم للمراجع لهذه الجلسة.",
    notesLabel: "ملاحظات",
    notesPlaceholder: "أي شيء يجب أن يعرفه المراجع التالي.",
    saveError: (error: string) =>
      `تعذّر علينا حفظ بطاقة تقييمك (${error}). حاول مرة أخرى.`,
    submit: "إرسال بطاقة التقييم",
    submitted: "تم الإرسال",
  },
};

const DE: DeepPartial<RoomsCopy> = {
  collabEditor: {
    defaultKicker: "Live-Editor",
    defaultTitle: "Kollaborativer Editor",
    languageSelectLabel: "Editor-Sprache",
    placeholderJs:
      "// Beginnen Sie zu tippen — Ihr Mitwirkender sieht Ihre Änderungen.",
    placeholderPython:
      "# Beginnen Sie zu tippen — Ihr Mitwirkender sieht Ihre Änderungen.",
    placeholderPlain:
      "Beginnen Sie zu tippen — Ihr Mitwirkender sieht Ihre Änderungen.",
    noSessionHeadline: "Keine Sitzung zugeordnet",
    noSessionBody:
      "Der kollaborative Editor benötigt eine Sitzungs-ID, um Änderungen zu speichern.",
    syncedNote:
      "Echtzeit-Änderungen werden mit allen im Raum synchronisiert.",
    localNote: "Änderungen bleiben lokal, bis Sie speichern.",
    editorForLanguage: (language: string) => `Editor für ${language}`,
    charCount: (count: string) => `${count} Zeichen`,
    save: "Speichern",
    saved: "Gespeichert",
  },
  recordingConsent: {
    title: "Aufnahmeeinwilligung",
    kicker: "Live-Raum",
    intro:
      "Diese Sitzung kann zur Überprüfung aufgezeichnet werden. Die Aufnahme wird auf der HenryCo-Infrastruktur gespeichert und ist nur für Teilnehmende und den Sitzungseigentümer zugänglich.",
    bulletWithdraw:
      "Sie können Ihre Einwilligung jederzeit widerrufen — die Aufnahme wird gestoppt.",
    bulletCopyDeletion:
      "Sie können in Ihren Kontoeinstellungen eine Kopie oder die Löschung der Aufnahme anfordern.",
    bulletAllConsent:
      "Die Aufnahme startet erst, wenn alle Teilnehmenden eingewilligt haben.",
    versionLabel: "Version des Einwilligungstextes:",
    saveError: (error: string) =>
      `Wir konnten Ihre Auswahl nicht speichern (${error}). Versuchen Sie es erneut.`,
    withdraw: "Einwilligung widerrufen",
    keepConsent: "Einwilligung beibehalten",
    consent: "Ich willige in die Aufnahme ein",
    notNow: "Jetzt nicht",
  },
  roomChat: {
    panelLabel: "Raum-Chat",
    messageLabel: "Chat-Nachricht",
    placeholder: "Nachricht eingeben — Enter zum Senden.",
    sendLabel: "Nachricht senden",
    send: "Senden",
    sending: "Wird gesendet…",
    emptyKicker: "Raum-Chat",
    emptyHeadline: "Noch keine Nachrichten",
    emptyBody:
      "Senden Sie die erste Nachricht — andere im Raum sehen sie sofort.",
    sendError: (error: string) => `Senden nicht möglich: ${error}`,
    you: "Sie",
    participantFallback: "Teilnehmer",
  },
  roomShell: {
    defaultTitle: "Live-Raum",
    defaultKicker: "Raum",
    recordingBadge: "Aufnahme",
    raiseHand: "Hand heben",
    mute: "Stummschalten",
    muteLabel: "Stummschaltung umschalten (verwenden Sie die iframe-Steuerung)",
    leave: "Verlassen",
    startRecording: "Aufnahme starten",
    stopRecording: "Aufnahme stoppen",
    reviewConsentLabel: "Aufnahmeeinwilligung überprüfen",
    provideConsentLabel: "Aufnahmeeinwilligung erteilen",
    consentGranted: "Aufnahmeeinwilligung: erteilt",
    consentPending: "Aufnahmeeinwilligung: ausstehend",
    videoTitle: "Raum-Video",
    endedKicker: "Raum",
    endedHeadline: "Dieser Raum wurde beendet",
    endedBody:
      "Aufnahmen, Transkripte und die Bewertung bleiben auf dieser Seite verfügbar.",
    prejoinKicker: "Live-Raum",
    prejoinHeadline: "Bereit, wenn Sie es sind",
    prejoinBody:
      "Tippen Sie auf Beitreten, um sich zu verbinden. Ihre Kamera und Ihr Mikrofon werden erst aktiviert, wenn Sie dies im Vorbeitritt-Schritt bestätigen.",
    joinRoom: "Raum beitreten",
    tryAgain: "Erneut versuchen",
    errorKicker: "Etwas ist schiefgelaufen",
    error: {
      defaultHeadline: "Beitritt zum Raum nicht möglich",
      defaultBody:
        "Bitte versuchen Sie es erneut. Wenn das weiterhin passiert, kann der Live-Host eine Einladung erneut senden.",
      unavailableHeadline: "Live-Räume sind noch nicht konfiguriert",
      unavailableBody:
        "Ein Administrator muss den Raumanbieter für diese Umgebung aktivieren.",
      offlineHeadline: "Der Raumdienst ist offline",
      offlineBody:
        "Einen Moment — wir versuchen es erneut, oder aktualisieren Sie die Seite gleich.",
      notFoundHeadline: "Dieser Raum wurde nicht gefunden",
      notFoundBody:
        "Er wurde möglicherweise vom Host entfernt. Überprüfen Sie Ihren Einladungslink.",
      closedHeadline: "Dieser Raum ist geschlossen",
      closedBody: "Er ist bereits beendet oder wurde vom Host abgesagt.",
      unauthorizedHeadline: "Sie können diesem Raum nicht beitreten",
      unauthorizedBody:
        "Melden Sie sich mit dem Konto an, das die Einladung erhalten hat.",
      consentHeadline: "Aufnahmeeinwilligung erforderlich",
      consentBody:
        "Ein oder mehrere Teilnehmende müssen einwilligen, bevor die Aufnahme starten kann.",
      rateLimitedHeadline: "Zu viele Versuche",
      rateLimitedBody: (seconds: number) =>
        `Warten Sie ${seconds} s und versuchen Sie es erneut.`,
      validationHeadline: "Mit der Anfrage stimmt etwas nicht",
      internalHeadline: "Etwas ist schiefgelaufen",
      internalBody:
        "Bitte versuchen Sie es erneut. Wenn das weiterhin passiert, aktualisieren Sie die Seite.",
    },
  },
  scorecard: {
    defaultKicker: "Prüfer",
    defaultTitle: "Bewertung",
    percentComplete: (percent: number) => `${percent} % abgeschlossen`,
    noScorecardHeadline: "Keine Bewertung konfiguriert",
    noScorecardBody:
      "Übergeben Sie eine `dimensions`-Eigenschaft, um eine Prüfer-Bewertung für diese Sitzung anzuzeigen.",
    notesLabel: "Notizen",
    notesPlaceholder: "Alles, was der nächste Prüfer wissen sollte.",
    saveError: (error: string) =>
      `Wir konnten Ihre Bewertung nicht speichern (${error}). Versuchen Sie es erneut.`,
    submit: "Bewertung absenden",
    submitted: "Abgesendet",
  },
};

const IT: DeepPartial<RoomsCopy> = {
  collabEditor: {
    defaultKicker: "Editor in diretta",
    defaultTitle: "Editor collaborativo",
    languageSelectLabel: "Linguaggio dell'editor",
    placeholderJs:
      "// Inizia a digitare — il tuo collaboratore vede le tue modifiche.",
    placeholderPython:
      "# Inizia a digitare — il tuo collaboratore vede le tue modifiche.",
    placeholderPlain:
      "Inizia a digitare — il tuo collaboratore vede le tue modifiche.",
    noSessionHeadline: "Nessuna sessione associata",
    noSessionBody:
      "L'editor collaborativo richiede un identificatore di sessione per salvare le modifiche.",
    syncedNote:
      "Le modifiche in tempo reale sono sincronizzate con tutti i partecipanti della stanza.",
    localNote: "Le modifiche restano locali finché non salvi.",
    editorForLanguage: (language: string) => `Editor per ${language}`,
    charCount: (count: string) => `${count} caratteri`,
    save: "Salva",
    saved: "Salvato",
  },
  recordingConsent: {
    title: "Consenso alla registrazione",
    kicker: "Stanza in diretta",
    intro:
      "Questa sessione potrebbe essere registrata per la revisione. La registrazione è archiviata sull'infrastruttura HenryCo ed è accessibile solo ai partecipanti e al proprietario della sessione.",
    bulletWithdraw:
      "Puoi revocare il consenso in qualsiasi momento — la registrazione si interromperà.",
    bulletCopyDeletion:
      "Puoi richiedere una copia o l'eliminazione della registrazione dalle impostazioni del tuo account.",
    bulletAllConsent:
      "La registrazione non inizierà finché ogni partecipante non avrà dato il consenso.",
    versionLabel: "Versione del testo di consenso:",
    saveError: (error: string) =>
      `Non siamo riusciti a salvare la tua scelta (${error}). Riprova.`,
    withdraw: "Revoca il consenso",
    keepConsent: "Mantieni il consenso",
    consent: "Acconsento alla registrazione",
    notNow: "Non ora",
  },
  roomChat: {
    panelLabel: "Chat della stanza",
    messageLabel: "Messaggio della chat",
    placeholder: "Scrivi un messaggio — Invio per inviare.",
    sendLabel: "Invia messaggio",
    send: "Invia",
    sending: "Invio in corso…",
    emptyKicker: "Chat della stanza",
    emptyHeadline: "Ancora nessun messaggio",
    emptyBody:
      "Invia il primo messaggio — gli altri partecipanti della stanza lo vedranno all'istante.",
    sendError: (error: string) => `Impossibile inviare: ${error}`,
    you: "Tu",
    participantFallback: "Partecipante",
  },
  roomShell: {
    defaultTitle: "Stanza in diretta",
    defaultKicker: "Stanza",
    recordingBadge: "Registrazione",
    raiseHand: "Alza la mano",
    mute: "Disattiva audio",
    muteLabel: "Attiva/disattiva audio (usa i controlli dell'iframe)",
    leave: "Esci",
    startRecording: "Avvia registrazione",
    stopRecording: "Interrompi registrazione",
    reviewConsentLabel: "Rivedi il consenso alla registrazione",
    provideConsentLabel: "Fornisci il consenso alla registrazione",
    consentGranted: "Consenso alla registrazione: concesso",
    consentPending: "Consenso alla registrazione: in attesa",
    videoTitle: "Video della stanza",
    endedKicker: "Stanza",
    endedHeadline: "Questa stanza è terminata",
    endedBody:
      "Le registrazioni, le trascrizioni e la valutazione restano disponibili in questa pagina.",
    prejoinKicker: "Stanza in diretta",
    prejoinHeadline: "Pronti quando vuoi",
    prejoinBody:
      "Tocca partecipa per connetterti. La fotocamera e il microfono non si attiveranno finché non confermi nel passaggio di pre-accesso.",
    joinRoom: "Partecipa alla stanza",
    tryAgain: "Riprova",
    errorKicker: "Si è verificato un problema",
    error: {
      defaultHeadline: "Impossibile partecipare alla stanza",
      defaultBody:
        "Riprova. Se il problema persiste, l'host in diretta può inviare di nuovo un invito.",
      unavailableHeadline: "Le stanze in diretta non sono ancora configurate",
      unavailableBody:
        "Un amministratore deve abilitare il provider di stanze per questo ambiente.",
      offlineHeadline: "Il servizio stanze è offline",
      offlineBody:
        "Attendi — riproveremo, oppure aggiorna la pagina tra un momento.",
      notFoundHeadline: "Impossibile trovare questa stanza",
      notFoundBody:
        "Potrebbe essere stata rimossa dall'host. Controlla il tuo link di invito.",
      closedHeadline: "Questa stanza è chiusa",
      closedBody: "È già terminata o è stata annullata dall'host.",
      unauthorizedHeadline: "Non puoi partecipare a questa stanza",
      unauthorizedBody:
        "Accedi con l'account che ha ricevuto l'invito.",
      consentHeadline: "È richiesto il consenso alla registrazione",
      consentBody:
        "Uno o più partecipanti devono dare il consenso prima che la registrazione possa iniziare.",
      rateLimitedHeadline: "Troppi tentativi",
      rateLimitedBody: (seconds: number) =>
        `Attendi ${seconds} s e riprova.`,
      validationHeadline: "C'è qualcosa che non va nella richiesta",
      internalHeadline: "Si è verificato un problema",
      internalBody:
        "Riprova. Se il problema persiste, aggiorna la pagina.",
    },
  },
  scorecard: {
    defaultKicker: "Revisore",
    defaultTitle: "Valutazione",
    percentComplete: (percent: number) => `${percent}% completato`,
    noScorecardHeadline: "Nessuna valutazione configurata",
    noScorecardBody:
      "Passa una proprietà `dimensions` per visualizzare una valutazione del revisore per questa sessione.",
    notesLabel: "Note",
    notesPlaceholder: "Tutto ciò che il prossimo revisore dovrebbe sapere.",
    saveError: (error: string) =>
      `Non siamo riusciti a salvare la tua valutazione (${error}). Riprova.`,
    submit: "Invia valutazione",
    submitted: "Inviata",
  },
};

const ZH: DeepPartial<RoomsCopy> = {
  collabEditor: {
    defaultKicker: "实时编辑器",
    defaultTitle: "协作编辑器",
    languageSelectLabel: "编辑器语言",
    placeholderJs: "// 开始输入 — 您的协作者会看到您的编辑。",
    placeholderPython: "# 开始输入 — 您的协作者会看到您的编辑。",
    placeholderPlain: "开始输入 — 您的协作者会看到您的编辑。",
    noSessionHeadline: "未绑定会话",
    noSessionBody: "协作编辑器需要会话 ID 才能保存编辑。",
    syncedNote: "实时编辑会与房间中的所有人同步。",
    localNote: "在您保存之前，编辑仅保存在本地。",
    editorForLanguage: (language: string) => `${language} 编辑器`,
    charCount: (count: string) => `${count} 个字符`,
    save: "保存",
    saved: "已保存",
  },
  recordingConsent: {
    title: "录制同意",
    kicker: "实时房间",
    intro:
      "此会话可能会被录制以供回顾。录制内容存储在 HenryCo 基础设施上，仅参与者和会话所有者可以访问。",
    bulletWithdraw: "您可以随时撤回同意 — 录制将停止。",
    bulletCopyDeletion: "您可以在账户设置中请求获取副本或删除录制内容。",
    bulletAllConsent: "在每位参与者都同意之前，录制不会开始。",
    versionLabel: "同意文本版本：",
    saveError: (error: string) => `无法保存您的选择（${error}）。请重试。`,
    withdraw: "撤回同意",
    keepConsent: "保持同意",
    consent: "我同意录制",
    notNow: "暂不",
  },
  roomChat: {
    panelLabel: "房间聊天",
    messageLabel: "聊天消息",
    placeholder: "输入消息 — 按 Enter 发送。",
    sendLabel: "发送消息",
    send: "发送",
    sending: "发送中…",
    emptyKicker: "房间聊天",
    emptyHeadline: "尚无消息",
    emptyBody: "发送第一条消息 — 房间里的其他人会立即看到。",
    sendError: (error: string) => `无法发送：${error}`,
    you: "您",
    participantFallback: "参与者",
  },
  roomShell: {
    defaultTitle: "实时房间",
    defaultKicker: "房间",
    recordingBadge: "录制中",
    raiseHand: "举手",
    mute: "静音",
    muteLabel: "切换静音（使用 iframe 控件）",
    leave: "离开",
    startRecording: "开始录制",
    stopRecording: "停止录制",
    reviewConsentLabel: "查看录制同意",
    provideConsentLabel: "提供录制同意",
    consentGranted: "录制同意：已授予",
    consentPending: "录制同意：待处理",
    videoTitle: "房间视频",
    endedKicker: "房间",
    endedHeadline: "此房间已结束",
    endedBody: "录制内容、转录和评分卡仍可在此页面上查看。",
    prejoinKicker: "实时房间",
    prejoinHeadline: "准备好了就开始",
    prejoinBody:
      "点击加入以连接。在您于预加入步骤确认之前，摄像头和麦克风不会开启。",
    joinRoom: "加入房间",
    tryAgain: "重试",
    errorKicker: "我们遇到了问题",
    error: {
      defaultHeadline: "无法加入房间",
      defaultBody: "请重试。如果问题持续出现，实时主持人可以重新发送邀请。",
      unavailableHeadline: "实时房间尚未配置",
      unavailableBody: "管理员需要为此环境启用房间提供商。",
      offlineHeadline: "房间服务已离线",
      offlineBody: "请稍候 — 我们将重试，或稍后刷新页面。",
      notFoundHeadline: "找不到此房间",
      notFoundBody: "它可能已被主持人删除。请检查您的邀请链接。",
      closedHeadline: "此房间已关闭",
      closedBody: "它已经结束或被主持人取消。",
      unauthorizedHeadline: "您无法加入此房间",
      unauthorizedBody: "请使用收到邀请的账户登录。",
      consentHeadline: "需要录制同意",
      consentBody: "在录制开始之前，需要一位或多位参与者同意。",
      rateLimitedHeadline: "尝试次数过多",
      rateLimitedBody: (seconds: number) => `请等待 ${seconds} 秒后重试。`,
      validationHeadline: "请求有误",
      internalHeadline: "我们遇到了问题",
      internalBody: "请重试。如果问题持续出现，请刷新页面。",
    },
  },
  scorecard: {
    defaultKicker: "评审人",
    defaultTitle: "评分卡",
    percentComplete: (percent: number) => `已完成 ${percent}%`,
    noScorecardHeadline: "未配置评分卡",
    noScorecardBody: "传入 `dimensions` 属性以为此会话呈现评审人评分卡。",
    notesLabel: "备注",
    notesPlaceholder: "下一位评审人应当了解的任何内容。",
    saveError: (error: string) => `无法保存您的评分卡（${error}）。请重试。`,
    submit: "提交评分卡",
    submitted: "已提交",
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<RoomsCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
};
// ig, yo, ha, hi are intentionally OMITTED -> fall back to EN (human-translation only).

export function getRoomsCopy(locale: AppLocale): RoomsCopy {
  const o = LOCALE_MAP[locale];
  if (o)
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      o as unknown as Record<string, unknown>,
    ) as unknown as RoomsCopy;
  return EN;
}
