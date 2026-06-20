import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * LearnToEarnCopy — i18n surface `surface:learn-to-earn` for V3-56.
 *
 * Static UI chrome for the Learn→Jobs bridge: the "Verified by Henry Onyx Learn"
 * badge, employer course-gates + the "take this course to qualify" CTA, the
 * learner opt-in consent toggle, the employer verified-candidate pool, and
 * bulk-invite. Dynamic, DB-sourced names (course/skill titles) render through
 * resolveLocalizedDynamicField (Pattern B), NOT this module.
 *
 * Pattern A typed-copy module: the EN baseline is exhaustive; each non-en locale
 * is a DeepPartial that deep-merges over EN, so any missing key falls back to EN
 * silently at runtime. The STORED enums stay English (source='learn_completion',
 * visibility='employers', required boolean) — only the DISPLAY labels here are
 * translated. `{course}`, `{division}`, `{count}` placeholders are preserved
 * verbatim across all locales.
 */
export type LearnToEarnCopy = {
  badge: {
    /** Label rendered on a Learn-sourced skill verification. */
    label: string;
    /** aria-label prefix for the badge. */
    aria: string;
    /** Link that opens the public certificate verification ledger. */
    verifyCta: string;
  };
  gate: {
    requiredEyebrow: string;
    requiredTitle: string;
    /** `{course}` = course name. */
    requiredBody: string;
    preferredTitle: string;
    /** `{course}` = course name. */
    preferredBody: string;
    /** CTA shown to a candidate who has not completed the gating course. */
    takeCourseCta: string;
    /** Inline notice when a hard gate blocks an application. `{course}` = course name. */
    blockedNotice: string;
    /** Employer-side gate manager. */
    manageEyebrow: string;
    manageTitle: string;
    manageBody: string;
    addCta: string;
    removeCta: string;
    requiredOption: string;
    preferredOption: string;
    empty: string;
  };
  optin: {
    eyebrow: string;
    title: string;
    body: string;
    /** `{course}` = course name. */
    listLabel: string;
    /** `{course}` = course name. */
    unlistLabel: string;
    consentNote: string;
    listedStatus: string;
    notListedStatus: string;
    empty: string;
  };
  pool: {
    eyebrow: string;
    title: string;
    body: string;
    courseFilterLabel: string;
    allCoursesOption: string;
    candidateCountOne: string;
    /** `{count}` = candidate count. */
    candidateCountOther: string;
    emptyTitle: string;
    emptyBody: string;
  };
  invite: {
    bulkCta: string;
    /** `{count}` = number invited. */
    sentNotice: string;
    alreadyInvited: string;
    none: string;
    messageLabel: string;
    messagePlaceholder: string;
    /** Candidate-facing notification. `{job}` = job title. */
    candidateNotifyTitle: string;
    /** Candidate-facing notification body. `{job}` = job title. */
    candidateNotifyBody: string;
  };
};

const LEARN_TO_EARN_COPY_EN: LearnToEarnCopy = {
  badge: {
    label: "Verified by Henry Onyx Learn",
    aria: "Skill verified by Henry Onyx Learn",
    verifyCta: "View certificate",
  },
  gate: {
    requiredEyebrow: "Course required",
    requiredTitle: "This role asks for a verified course",
    requiredBody:
      "Complete {course} on Henry Onyx Learn to apply. Your verified completion is checked automatically.",
    preferredTitle: "A verified course helps here",
    preferredBody:
      "Completing {course} on Henry Onyx Learn marks you as a preferred candidate for this role.",
    takeCourseCta: "Take this course to qualify",
    blockedNotice:
      "This role requires a verified completion of {course}. Complete the course, then apply.",
    manageEyebrow: "Course gate",
    manageTitle: "Require a verified course",
    manageBody:
      "Limit applicants to people who completed a specific Henry Onyx Learn course, or mark it as preferred.",
    addCta: "Add course gate",
    removeCta: "Remove",
    requiredOption: "Required to apply",
    preferredOption: "Preferred",
    empty: "No course gate on this role.",
  },
  optin: {
    eyebrow: "Career visibility",
    title: "Be found by employers",
    body:
      "Choose which completed courses employers can use to find you. You stay private until you opt in, and you can opt out at any time.",
    listLabel: "List me to employers for {course}",
    unlistLabel: "Stop listing me for {course}",
    consentNote:
      "Employers gating or hiring on this course can see your verified completion and profile. Opting out removes you from every employer list immediately.",
    listedStatus: "Listed to employers",
    notListedStatus: "Not listed",
    empty: "Complete a verified course to choose your employer visibility.",
  },
  pool: {
    eyebrow: "Verified completers",
    title: "Candidates verified by Henry Onyx Learn",
    body:
      "People who completed a course you gate or hire on and chose to be listed. Each carries a verified completion.",
    courseFilterLabel: "Course",
    allCoursesOption: "All courses",
    candidateCountOne: "1 candidate",
    candidateCountOther: "{count} candidates",
    emptyTitle: "No listed candidates yet",
    emptyBody:
      "When verified completers opt in for a course you gate or hire on, they appear here.",
  },
  invite: {
    bulkCta: "Invite selected",
    sentNotice: "Invited {count}.",
    alreadyInvited: "Already invited",
    none: "Select candidates to invite.",
    messageLabel: "Message (optional)",
    messagePlaceholder: "Add a short note for the candidates you invite.",
    candidateNotifyTitle: "An employer invited you to apply",
    candidateNotifyBody:
      "An employer invited you to apply for {job}, based on your verified Henry Onyx Learn completion.",
  },
};

// --- Pattern A: per-locale DeepPartial overrides (deep-merge over EN). ---

const LEARN_TO_EARN_COPY_FR: DeepPartial<LearnToEarnCopy> = {
  badge: {
    label: "Vérifié par Henry Onyx Learn",
    aria: "Compétence vérifiée par Henry Onyx Learn",
    verifyCta: "Voir le certificat",
  },
  gate: {
    requiredEyebrow: "Cours requis",
    requiredTitle: "Ce poste demande un cours vérifié",
    requiredBody:
      "Terminez {course} sur Henry Onyx Learn pour postuler. Votre réussite vérifiée est contrôlée automatiquement.",
    preferredTitle: "Un cours vérifié aide ici",
    preferredBody:
      "Terminer {course} sur Henry Onyx Learn vous marque comme candidat préféré pour ce poste.",
    takeCourseCta: "Suivez ce cours pour être éligible",
    blockedNotice:
      "Ce poste exige une réussite vérifiée de {course}. Terminez le cours, puis postulez.",
    manageEyebrow: "Condition de cours",
    manageTitle: "Exiger un cours vérifié",
    manageBody:
      "Limitez les candidatures aux personnes ayant terminé un cours Henry Onyx Learn précis, ou marquez-le comme préféré.",
    addCta: "Ajouter une condition de cours",
    removeCta: "Retirer",
    requiredOption: "Requis pour postuler",
    preferredOption: "Préféré",
    empty: "Aucune condition de cours pour ce poste.",
  },
  optin: {
    eyebrow: "Visibilité professionnelle",
    title: "Soyez trouvé par les employeurs",
    body:
      "Choisissez les cours terminés que les employeurs peuvent utiliser pour vous trouver. Vous restez privé jusqu'à votre accord, et vous pouvez vous retirer à tout moment.",
    listLabel: "Me lister auprès des employeurs pour {course}",
    unlistLabel: "Ne plus me lister pour {course}",
    consentNote:
      "Les employeurs qui filtrent ou recrutent sur ce cours peuvent voir votre réussite vérifiée et votre profil. Vous retirer vous enlève de toutes les listes immédiatement.",
    listedStatus: "Listé auprès des employeurs",
    notListedStatus: "Non listé",
    empty: "Terminez un cours vérifié pour choisir votre visibilité.",
  },
  pool: {
    eyebrow: "Diplômés vérifiés",
    title: "Candidats vérifiés par Henry Onyx Learn",
    body:
      "Les personnes qui ont terminé un cours que vous filtrez ou pour lequel vous recrutez et qui ont choisi d'être listées. Chacune a une réussite vérifiée.",
    courseFilterLabel: "Cours",
    allCoursesOption: "Tous les cours",
    candidateCountOne: "1 candidat",
    candidateCountOther: "{count} candidats",
    emptyTitle: "Aucun candidat listé pour le moment",
    emptyBody:
      "Quand des diplômés vérifiés s'inscrivent pour un cours que vous filtrez ou recrutez, ils apparaissent ici.",
  },
  invite: {
    bulkCta: "Inviter la sélection",
    sentNotice: "{count} invité(s).",
    alreadyInvited: "Déjà invité",
    none: "Sélectionnez des candidats à inviter.",
    messageLabel: "Message (facultatif)",
    messagePlaceholder: "Ajoutez une note courte pour les candidats invités.",
    candidateNotifyTitle: "Un employeur vous a invité à postuler",
    candidateNotifyBody:
      "Un employeur vous a invité à postuler pour {job}, sur la base de votre réussite vérifiée Henry Onyx Learn.",
  },
};

const LEARN_TO_EARN_COPY_ES: DeepPartial<LearnToEarnCopy> = {
  badge: {
    label: "Verificado por Henry Onyx Learn",
    aria: "Competencia verificada por Henry Onyx Learn",
    verifyCta: "Ver certificado",
  },
  gate: {
    requiredEyebrow: "Curso requerido",
    requiredTitle: "Este puesto pide un curso verificado",
    requiredBody:
      "Completa {course} en Henry Onyx Learn para postular. Tu finalización verificada se comprueba automáticamente.",
    preferredTitle: "Un curso verificado ayuda aquí",
    preferredBody:
      "Completar {course} en Henry Onyx Learn te marca como candidato preferido para este puesto.",
    takeCourseCta: "Toma este curso para calificar",
    blockedNotice:
      "Este puesto requiere una finalización verificada de {course}. Completa el curso y luego postula.",
    manageEyebrow: "Requisito de curso",
    manageTitle: "Exigir un curso verificado",
    manageBody:
      "Limita las candidaturas a quienes completaron un curso específico de Henry Onyx Learn, o márcalo como preferido.",
    addCta: "Añadir requisito de curso",
    removeCta: "Quitar",
    requiredOption: "Requerido para postular",
    preferredOption: "Preferido",
    empty: "Sin requisito de curso para este puesto.",
  },
  optin: {
    eyebrow: "Visibilidad profesional",
    title: "Que te encuentren los empleadores",
    body:
      "Elige qué cursos completados pueden usar los empleadores para encontrarte. Permaneces privado hasta que aceptas, y puedes retirarte cuando quieras.",
    listLabel: "Listarme ante empleadores para {course}",
    unlistLabel: "Dejar de listarme para {course}",
    consentNote:
      "Los empleadores que filtran o contratan según este curso pueden ver tu finalización verificada y tu perfil. Retirarte te elimina de todas las listas de inmediato.",
    listedStatus: "Listado ante empleadores",
    notListedStatus: "No listado",
    empty: "Completa un curso verificado para elegir tu visibilidad.",
  },
  pool: {
    eyebrow: "Egresados verificados",
    title: "Candidatos verificados por Henry Onyx Learn",
    body:
      "Personas que completaron un curso que filtras o por el que contratas y eligieron ser listadas. Cada una tiene una finalización verificada.",
    courseFilterLabel: "Curso",
    allCoursesOption: "Todos los cursos",
    candidateCountOne: "1 candidato",
    candidateCountOther: "{count} candidatos",
    emptyTitle: "Aún no hay candidatos listados",
    emptyBody:
      "Cuando los egresados verificados se inscriban para un curso que filtras o contratas, aparecerán aquí.",
  },
  invite: {
    bulkCta: "Invitar a los seleccionados",
    sentNotice: "{count} invitado(s).",
    alreadyInvited: "Ya invitado",
    none: "Selecciona candidatos para invitar.",
    messageLabel: "Mensaje (opcional)",
    messagePlaceholder: "Añade una nota breve para los candidatos que invites.",
    candidateNotifyTitle: "Un empleador te invitó a postular",
    candidateNotifyBody:
      "Un empleador te invitó a postular para {job}, según tu finalización verificada de Henry Onyx Learn.",
  },
};

const LEARN_TO_EARN_COPY_PT: DeepPartial<LearnToEarnCopy> = {
  badge: {
    label: "Verificado pela Henry Onyx Learn",
    aria: "Competência verificada pela Henry Onyx Learn",
    verifyCta: "Ver certificado",
  },
  gate: {
    requiredEyebrow: "Curso obrigatório",
    requiredTitle: "Esta vaga pede um curso verificado",
    requiredBody:
      "Conclua {course} na Henry Onyx Learn para se candidatar. A sua conclusão verificada é checada automaticamente.",
    preferredTitle: "Um curso verificado ajuda aqui",
    preferredBody:
      "Concluir {course} na Henry Onyx Learn marca você como candidato preferido para esta vaga.",
    takeCourseCta: "Faça este curso para se qualificar",
    blockedNotice:
      "Esta vaga exige uma conclusão verificada de {course}. Conclua o curso e depois candidate-se.",
    manageEyebrow: "Requisito de curso",
    manageTitle: "Exigir um curso verificado",
    manageBody:
      "Limite as candidaturas a quem concluiu um curso específico da Henry Onyx Learn, ou marque como preferido.",
    addCta: "Adicionar requisito de curso",
    removeCta: "Remover",
    requiredOption: "Obrigatório para candidatar",
    preferredOption: "Preferido",
    empty: "Sem requisito de curso para esta vaga.",
  },
  optin: {
    eyebrow: "Visibilidade profissional",
    title: "Seja encontrado por empregadores",
    body:
      "Escolha quais cursos concluídos os empregadores podem usar para encontrar você. Você fica privado até concordar e pode sair quando quiser.",
    listLabel: "Listar-me para empregadores em {course}",
    unlistLabel: "Parar de me listar em {course}",
    consentNote:
      "Empregadores que filtram ou contratam por este curso podem ver a sua conclusão verificada e o seu perfil. Sair remove você de todas as listas imediatamente.",
    listedStatus: "Listado para empregadores",
    notListedStatus: "Não listado",
    empty: "Conclua um curso verificado para escolher a sua visibilidade.",
  },
  pool: {
    eyebrow: "Concluintes verificados",
    title: "Candidatos verificados pela Henry Onyx Learn",
    body:
      "Pessoas que concluíram um curso que você filtra ou contrata e optaram por ser listadas. Cada uma tem uma conclusão verificada.",
    courseFilterLabel: "Curso",
    allCoursesOption: "Todos os cursos",
    candidateCountOne: "1 candidato",
    candidateCountOther: "{count} candidatos",
    emptyTitle: "Ainda não há candidatos listados",
    emptyBody:
      "Quando concluintes verificados optarem por um curso que você filtra ou contrata, eles aparecem aqui.",
  },
  invite: {
    bulkCta: "Convidar selecionados",
    sentNotice: "{count} convidado(s).",
    alreadyInvited: "Já convidado",
    none: "Selecione candidatos para convidar.",
    messageLabel: "Mensagem (opcional)",
    messagePlaceholder: "Adicione uma nota curta para os candidatos que convidar.",
    candidateNotifyTitle: "Um empregador convidou você a se candidatar",
    candidateNotifyBody:
      "Um empregador convidou você a se candidatar para {job}, com base na sua conclusão verificada da Henry Onyx Learn.",
  },
};

const LEARN_TO_EARN_COPY_DE: DeepPartial<LearnToEarnCopy> = {
  badge: {
    label: "Verifiziert von Henry Onyx Learn",
    aria: "Kompetenz verifiziert von Henry Onyx Learn",
    verifyCta: "Zertifikat ansehen",
  },
  gate: {
    requiredEyebrow: "Kurs erforderlich",
    requiredTitle: "Diese Stelle verlangt einen verifizierten Kurs",
    requiredBody:
      "Schließen Sie {course} bei Henry Onyx Learn ab, um sich zu bewerben. Ihr verifizierter Abschluss wird automatisch geprüft.",
    preferredTitle: "Ein verifizierter Kurs hilft hier",
    preferredBody:
      "Der Abschluss von {course} bei Henry Onyx Learn markiert Sie als bevorzugten Kandidaten für diese Stelle.",
    takeCourseCta: "Belegen Sie diesen Kurs zur Qualifikation",
    blockedNotice:
      "Diese Stelle erfordert einen verifizierten Abschluss von {course}. Schließen Sie den Kurs ab und bewerben Sie sich dann.",
    manageEyebrow: "Kursvoraussetzung",
    manageTitle: "Einen verifizierten Kurs verlangen",
    manageBody:
      "Begrenzen Sie Bewerbungen auf Personen, die einen bestimmten Henry-Onyx-Learn-Kurs abgeschlossen haben, oder markieren Sie ihn als bevorzugt.",
    addCta: "Kursvoraussetzung hinzufügen",
    removeCta: "Entfernen",
    requiredOption: "Erforderlich für die Bewerbung",
    preferredOption: "Bevorzugt",
    empty: "Keine Kursvoraussetzung für diese Stelle.",
  },
  optin: {
    eyebrow: "Berufliche Sichtbarkeit",
    title: "Von Arbeitgebern gefunden werden",
    body:
      "Wählen Sie, welche abgeschlossenen Kurse Arbeitgeber nutzen dürfen, um Sie zu finden. Sie bleiben privat, bis Sie zustimmen, und können sich jederzeit abmelden.",
    listLabel: "Mich Arbeitgebern für {course} anzeigen",
    unlistLabel: "Anzeige für {course} beenden",
    consentNote:
      "Arbeitgeber, die nach diesem Kurs filtern oder einstellen, sehen Ihren verifizierten Abschluss und Ihr Profil. Die Abmeldung entfernt Sie sofort aus allen Listen.",
    listedStatus: "Für Arbeitgeber gelistet",
    notListedStatus: "Nicht gelistet",
    empty: "Schließen Sie einen verifizierten Kurs ab, um Ihre Sichtbarkeit zu wählen.",
  },
  pool: {
    eyebrow: "Verifizierte Absolventen",
    title: "Von Henry Onyx Learn verifizierte Kandidaten",
    body:
      "Personen, die einen Kurs abgeschlossen haben, nach dem Sie filtern oder einstellen, und sich für die Listung entschieden haben. Jede trägt einen verifizierten Abschluss.",
    courseFilterLabel: "Kurs",
    allCoursesOption: "Alle Kurse",
    candidateCountOne: "1 Kandidat",
    candidateCountOther: "{count} Kandidaten",
    emptyTitle: "Noch keine gelisteten Kandidaten",
    emptyBody:
      "Wenn verifizierte Absolventen sich für einen Kurs anmelden, nach dem Sie filtern oder einstellen, erscheinen sie hier.",
  },
  invite: {
    bulkCta: "Auswahl einladen",
    sentNotice: "{count} eingeladen.",
    alreadyInvited: "Bereits eingeladen",
    none: "Wählen Sie Kandidaten zum Einladen.",
    messageLabel: "Nachricht (optional)",
    messagePlaceholder: "Fügen Sie eine kurze Notiz für die eingeladenen Kandidaten hinzu.",
    candidateNotifyTitle: "Ein Arbeitgeber hat Sie zur Bewerbung eingeladen",
    candidateNotifyBody:
      "Ein Arbeitgeber hat Sie eingeladen, sich für {job} zu bewerben, auf Basis Ihres verifizierten Henry-Onyx-Learn-Abschlusses.",
  },
};

const LEARN_TO_EARN_COPY_IT: DeepPartial<LearnToEarnCopy> = {
  badge: {
    label: "Verificato da Henry Onyx Learn",
    aria: "Competenza verificata da Henry Onyx Learn",
    verifyCta: "Vedi il certificato",
  },
  gate: {
    requiredEyebrow: "Corso richiesto",
    requiredTitle: "Questa posizione richiede un corso verificato",
    requiredBody:
      "Completa {course} su Henry Onyx Learn per candidarti. Il tuo completamento verificato viene controllato automaticamente.",
    preferredTitle: "Un corso verificato aiuta qui",
    preferredBody:
      "Completare {course} su Henry Onyx Learn ti segnala come candidato preferito per questa posizione.",
    takeCourseCta: "Segui questo corso per qualificarti",
    blockedNotice:
      "Questa posizione richiede un completamento verificato di {course}. Completa il corso, poi candidati.",
    manageEyebrow: "Requisito del corso",
    manageTitle: "Richiedere un corso verificato",
    manageBody:
      "Limita le candidature a chi ha completato un corso Henry Onyx Learn specifico, o segnalalo come preferito.",
    addCta: "Aggiungi requisito del corso",
    removeCta: "Rimuovi",
    requiredOption: "Richiesto per candidarsi",
    preferredOption: "Preferito",
    empty: "Nessun requisito del corso per questa posizione.",
  },
  optin: {
    eyebrow: "Visibilità professionale",
    title: "Fatti trovare dai datori di lavoro",
    body:
      "Scegli quali corsi completati i datori di lavoro possono usare per trovarti. Resti privato finché non acconsenti e puoi ritirarti in qualsiasi momento.",
    listLabel: "Elencami ai datori di lavoro per {course}",
    unlistLabel: "Smetti di elencarmi per {course}",
    consentNote:
      "I datori di lavoro che filtrano o assumono su questo corso possono vedere il tuo completamento verificato e il tuo profilo. Ritirarti ti rimuove da ogni elenco immediatamente.",
    listedStatus: "Elencato ai datori di lavoro",
    notListedStatus: "Non elencato",
    empty: "Completa un corso verificato per scegliere la tua visibilità.",
  },
  pool: {
    eyebrow: "Diplomati verificati",
    title: "Candidati verificati da Henry Onyx Learn",
    body:
      "Persone che hanno completato un corso che filtri o per cui assumi e hanno scelto di essere elencate. Ognuna ha un completamento verificato.",
    courseFilterLabel: "Corso",
    allCoursesOption: "Tutti i corsi",
    candidateCountOne: "1 candidato",
    candidateCountOther: "{count} candidati",
    emptyTitle: "Ancora nessun candidato elencato",
    emptyBody:
      "Quando i diplomati verificati aderiscono a un corso che filtri o per cui assumi, compaiono qui.",
  },
  invite: {
    bulkCta: "Invita i selezionati",
    sentNotice: "{count} invitati.",
    alreadyInvited: "Già invitato",
    none: "Seleziona i candidati da invitare.",
    messageLabel: "Messaggio (facoltativo)",
    messagePlaceholder: "Aggiungi una breve nota per i candidati che inviti.",
    candidateNotifyTitle: "Un datore di lavoro ti ha invitato a candidarti",
    candidateNotifyBody:
      "Un datore di lavoro ti ha invitato a candidarti per {job}, in base al tuo completamento verificato Henry Onyx Learn.",
  },
};

const LEARN_TO_EARN_COPY_AR: DeepPartial<LearnToEarnCopy> = {
  badge: {
    label: "موثّق من Henry Onyx Learn",
    aria: "مهارة موثّقة من Henry Onyx Learn",
    verifyCta: "عرض الشهادة",
  },
  gate: {
    requiredEyebrow: "دورة مطلوبة",
    requiredTitle: "تتطلب هذه الوظيفة دورة موثّقة",
    requiredBody:
      "أكمل {course} على Henry Onyx Learn للتقديم. يتم التحقق من إتمامك الموثّق تلقائيًا.",
    preferredTitle: "تساعد الدورة الموثّقة هنا",
    preferredBody:
      "إكمال {course} على Henry Onyx Learn يجعلك مرشحًا مفضّلًا لهذه الوظيفة.",
    takeCourseCta: "خذ هذه الدورة للتأهل",
    blockedNotice:
      "تتطلب هذه الوظيفة إتمامًا موثّقًا لدورة {course}. أكمل الدورة ثم قدّم طلبك.",
    manageEyebrow: "شرط الدورة",
    manageTitle: "اشتراط دورة موثّقة",
    manageBody:
      "اقصر المتقدمين على من أكمل دورة محددة في Henry Onyx Learn، أو ضعها كمفضّلة.",
    addCta: "إضافة شرط دورة",
    removeCta: "إزالة",
    requiredOption: "مطلوب للتقديم",
    preferredOption: "مفضّل",
    empty: "لا يوجد شرط دورة لهذه الوظيفة.",
  },
  optin: {
    eyebrow: "الظهور المهني",
    title: "ليجدك أصحاب العمل",
    body:
      "اختر الدورات المكتملة التي يمكن لأصحاب العمل استخدامها للعثور عليك. تبقى خاصًا حتى توافق، ويمكنك الانسحاب في أي وقت.",
    listLabel: "أدرجني لأصحاب العمل في {course}",
    unlistLabel: "أوقف إدراجي في {course}",
    consentNote:
      "يمكن لأصحاب العمل الذين يصفّون أو يوظّفون بناءً على هذه الدورة رؤية إتمامك الموثّق وملفك. الانسحاب يزيلك من كل القوائم فورًا.",
    listedStatus: "مُدرج لأصحاب العمل",
    notListedStatus: "غير مُدرج",
    empty: "أكمل دورة موثّقة لاختيار ظهورك.",
  },
  pool: {
    eyebrow: "خرّيجون موثّقون",
    title: "مرشحون موثّقون من Henry Onyx Learn",
    body:
      "أشخاص أكملوا دورة تصفّيها أو توظّف بناءً عليها واختاروا الإدراج. لكلٍّ إتمام موثّق.",
    courseFilterLabel: "الدورة",
    allCoursesOption: "كل الدورات",
    candidateCountOne: "مرشح واحد",
    candidateCountOther: "{count} مرشحين",
    emptyTitle: "لا مرشحين مُدرجين بعد",
    emptyBody:
      "عندما ينضم خرّيجون موثّقون لدورة تصفّيها أو توظّف بناءً عليها، يظهرون هنا.",
  },
  invite: {
    bulkCta: "دعوة المحددين",
    sentNotice: "تمت دعوة {count}.",
    alreadyInvited: "تمت دعوته",
    none: "اختر مرشحين للدعوة.",
    messageLabel: "رسالة (اختياري)",
    messagePlaceholder: "أضف ملاحظة قصيرة للمرشحين الذين تدعوهم.",
    candidateNotifyTitle: "دعاك صاحب عمل للتقديم",
    candidateNotifyBody:
      "دعاك صاحب عمل للتقديم على {job}، استنادًا إلى إتمامك الموثّق من Henry Onyx Learn.",
  },
};

const LEARN_TO_EARN_COPY_ZH: DeepPartial<LearnToEarnCopy> = {
  badge: {
    label: "由 Henry Onyx Learn 认证",
    aria: "技能由 Henry Onyx Learn 认证",
    verifyCta: "查看证书",
  },
  gate: {
    requiredEyebrow: "需要课程",
    requiredTitle: "此职位需要一门已认证课程",
    requiredBody:
      "在 Henry Onyx Learn 完成 {course} 后即可申请。系统会自动核验你的认证完成记录。",
    preferredTitle: "已认证课程在此有帮助",
    preferredBody:
      "在 Henry Onyx Learn 完成 {course} 会将你标记为此职位的优先候选人。",
    takeCourseCta: "学习此课程以符合条件",
    blockedNotice:
      "此职位要求 {course} 的认证完成记录。请先完成课程，再行申请。",
    manageEyebrow: "课程门槛",
    manageTitle: "要求一门已认证课程",
    manageBody:
      "将申请人限定为完成某一门 Henry Onyx Learn 课程的人，或将其标记为优先。",
    addCta: "添加课程门槛",
    removeCta: "移除",
    requiredOption: "申请必需",
    preferredOption: "优先",
    empty: "此职位没有课程门槛。",
  },
  optin: {
    eyebrow: "职业可见性",
    title: "让雇主找到你",
    body:
      "选择雇主可用于找到你的已完成课程。在你同意之前你保持私密，并可随时退出。",
    listLabel: "为 {course} 向雇主展示我",
    unlistLabel: "停止为 {course} 展示我",
    consentNote:
      "按此课程筛选或招聘的雇主可以看到你的认证完成记录和资料。退出会立即将你从所有名单中移除。",
    listedStatus: "已向雇主展示",
    notListedStatus: "未展示",
    empty: "完成一门已认证课程以选择你的可见性。",
  },
  pool: {
    eyebrow: "已认证结业者",
    title: "由 Henry Onyx Learn 认证的候选人",
    body:
      "完成了你筛选或招聘的课程并选择被展示的人。每人都持有认证完成记录。",
    courseFilterLabel: "课程",
    allCoursesOption: "所有课程",
    candidateCountOne: "1 名候选人",
    candidateCountOther: "{count} 名候选人",
    emptyTitle: "暂无展示的候选人",
    emptyBody:
      "当已认证结业者为你筛选或招聘的课程选择加入时，他们会出现在此处。",
  },
  invite: {
    bulkCta: "邀请所选",
    sentNotice: "已邀请 {count} 人。",
    alreadyInvited: "已邀请",
    none: "选择要邀请的候选人。",
    messageLabel: "留言（可选）",
    messagePlaceholder: "为你邀请的候选人添加一段简短说明。",
    candidateNotifyTitle: "有雇主邀请你申请",
    candidateNotifyBody:
      "有雇主邀请你申请 {job}，依据是你在 Henry Onyx Learn 的认证完成记录。",
  },
};

const LEARN_TO_EARN_COPY_HI: DeepPartial<LearnToEarnCopy> = {
  badge: {
    label: "Henry Onyx Learn द्वारा सत्यापित",
    aria: "Henry Onyx Learn द्वारा सत्यापित कौशल",
    verifyCta: "प्रमाणपत्र देखें",
  },
  gate: {
    requiredEyebrow: "कोर्स आवश्यक",
    requiredTitle: "इस भूमिका के लिए सत्यापित कोर्स चाहिए",
    requiredBody:
      "आवेदन करने के लिए Henry Onyx Learn पर {course} पूरा करें। आपका सत्यापित पूरा होना स्वतः जाँचा जाता है।",
    preferredTitle: "यहाँ सत्यापित कोर्स मदद करता है",
    preferredBody:
      "Henry Onyx Learn पर {course} पूरा करना आपको इस भूमिका के लिए पसंदीदा उम्मीदवार बनाता है।",
    takeCourseCta: "योग्य बनने के लिए यह कोर्स करें",
    blockedNotice:
      "इस भूमिका के लिए {course} का सत्यापित पूरा होना आवश्यक है। कोर्स पूरा करें, फिर आवेदन करें।",
    manageEyebrow: "कोर्स शर्त",
    manageTitle: "सत्यापित कोर्स आवश्यक करें",
    manageBody:
      "आवेदनों को किसी विशेष Henry Onyx Learn कोर्स पूरा करने वालों तक सीमित करें, या इसे पसंदीदा के रूप में चिह्नित करें।",
    addCta: "कोर्स शर्त जोड़ें",
    removeCta: "हटाएँ",
    requiredOption: "आवेदन के लिए आवश्यक",
    preferredOption: "पसंदीदा",
    empty: "इस भूमिका पर कोई कोर्स शर्त नहीं।",
  },
  optin: {
    eyebrow: "करियर दृश्यता",
    title: "नियोक्ताओं द्वारा खोजे जाएँ",
    body:
      "चुनें कि नियोक्ता आपको खोजने के लिए कौन-से पूरे किए कोर्स इस्तेमाल कर सकते हैं। सहमति देने तक आप निजी रहते हैं, और कभी भी बाहर हो सकते हैं।",
    listLabel: "{course} के लिए मुझे नियोक्ताओं को दिखाएँ",
    unlistLabel: "{course} के लिए मुझे दिखाना बंद करें",
    consentNote:
      "इस कोर्स पर छाँटने या भर्ती करने वाले नियोक्ता आपका सत्यापित पूरा होना और प्रोफ़ाइल देख सकते हैं। बाहर होने पर आप तुरंत हर सूची से हट जाते हैं।",
    listedStatus: "नियोक्ताओं को दिखाया गया",
    notListedStatus: "नहीं दिखाया गया",
    empty: "अपनी दृश्यता चुनने के लिए एक सत्यापित कोर्स पूरा करें।",
  },
  pool: {
    eyebrow: "सत्यापित पूर्ण-कर्ता",
    title: "Henry Onyx Learn द्वारा सत्यापित उम्मीदवार",
    body:
      "वे लोग जिन्होंने आपके द्वारा छाँटे या भर्ती किए जाने वाले कोर्स को पूरा किया और सूचीबद्ध होना चुना। हर एक के पास सत्यापित पूर्णता है।",
    courseFilterLabel: "कोर्स",
    allCoursesOption: "सभी कोर्स",
    candidateCountOne: "1 उम्मीदवार",
    candidateCountOther: "{count} उम्मीदवार",
    emptyTitle: "अभी कोई सूचीबद्ध उम्मीदवार नहीं",
    emptyBody:
      "जब सत्यापित पूर्ण-कर्ता आपके छाँटे या भर्ती किए कोर्स के लिए शामिल होते हैं, वे यहाँ दिखते हैं।",
  },
  invite: {
    bulkCta: "चयनित को आमंत्रित करें",
    sentNotice: "{count} को आमंत्रित किया।",
    alreadyInvited: "पहले से आमंत्रित",
    none: "आमंत्रित करने के लिए उम्मीदवार चुनें।",
    messageLabel: "संदेश (वैकल्पिक)",
    messagePlaceholder: "जिन उम्मीदवारों को आमंत्रित करते हैं उनके लिए एक छोटा नोट जोड़ें।",
    candidateNotifyTitle: "एक नियोक्ता ने आपको आवेदन के लिए आमंत्रित किया",
    candidateNotifyBody:
      "एक नियोक्ता ने आपको {job} के लिए आवेदन हेतु आमंत्रित किया, आपके सत्यापित Henry Onyx Learn पूर्णता के आधार पर।",
  },
};

const LEARN_TO_EARN_COPY_IG: DeepPartial<LearnToEarnCopy> = {
  badge: {
    label: "Henry Onyx Learn kwadoro ya",
    aria: "Nka nke Henry Onyx Learn kwadoro",
    verifyCta: "Lee asambodo",
  },
  gate: {
    requiredEyebrow: "Achọrọ usoro ọmụmụ",
    requiredTitle: "Ọrụ a chọrọ usoro ọmụmụ akwadoro",
    requiredBody:
      "Dechaa {course} na Henry Onyx Learn iji tinye akwụkwọ. A na-elele mmecha gị akwadoro na-akpaghị aka.",
    preferredTitle: "Usoro ọmụmụ akwadoro na-enyere aka ebe a",
    preferredBody:
      "Idechaa {course} na Henry Onyx Learn na-eme gị onye a kachasị mmasị maka ọrụ a.",
    takeCourseCta: "Were usoro ọmụmụ a ka i ruo eru",
    blockedNotice:
      "Ọrụ a chọrọ mmecha akwadoro nke {course}. Dechaa usoro ọmụmụ ahụ, wee tinye akwụkwọ.",
    manageEyebrow: "Ihe usoro ọmụmụ chọrọ",
    manageTitle: "Chọọ usoro ọmụmụ akwadoro",
    manageBody:
      "Belata ndị na-etinye akwụkwọ naanị ndị dechara otu usoro ọmụmụ Henry Onyx Learn, ma ọ bụ kaa ya dị ka nke kachasị mmasị.",
    addCta: "Tinye ihe usoro ọmụmụ chọrọ",
    removeCta: "Wepu",
    requiredOption: "Achọrọ iji tinye akwụkwọ",
    preferredOption: "Nke kachasị mmasị",
    empty: "Enweghị ihe usoro ọmụmụ chọrọ na ọrụ a.",
  },
  optin: {
    eyebrow: "Ngosi ọrụ",
    title: "Ka ndị na-ewe ọrụ chọta gị",
    body:
      "Họrọ usoro ọmụmụ ndị i dechara ndị na-ewe ọrụ nwere ike iji chọta gị. Ị na-anọ na nzuzo ruo mgbe ị kwetara, ị nwekwara ike ịpụ mgbe ọ bụla.",
    listLabel: "Depụta m nye ndị na-ewe ọrụ maka {course}",
    unlistLabel: "Kwụsị idepụta m maka {course}",
    consentNote:
      "Ndị na-ewe ọrụ na-anyado ma ọ bụ na-ewe ọrụ na usoro ọmụmụ a nwere ike ịhụ mmecha gị akwadoro na profaịlụ gị. Ịpụ na-ewepụ gị na ndepụta niile ozugbo.",
    listedStatus: "Edepụtara nye ndị na-ewe ọrụ",
    notListedStatus: "Edepụtaghị",
    empty: "Dechaa usoro ọmụmụ akwadoro iji họrọ ngosi gị.",
  },
  pool: {
    eyebrow: "Ndị dechara akwadoro",
    title: "Ndị Henry Onyx Learn kwadoro",
    body:
      "Ndị dechara usoro ọmụmụ ị na-anyado ma ọ bụ na-ewe ọrụ wee họrọ ka edepụta ha. Onye ọ bụla nwere mmecha akwadoro.",
    courseFilterLabel: "Usoro ọmụmụ",
    allCoursesOption: "Usoro ọmụmụ niile",
    candidateCountOne: "Onye 1",
    candidateCountOther: "Ndị {count}",
    emptyTitle: "Enweghị onye edepụtara ugbu a",
    emptyBody:
      "Mgbe ndị dechara akwadoro sonyere maka usoro ọmụmụ ị na-anyado ma ọ bụ na-ewe ọrụ, ha na-apụta ebe a.",
  },
  invite: {
    bulkCta: "Kpọọ ndị ahọrọ",
    sentNotice: "A kpọrọ {count}.",
    alreadyInvited: "Akpọọlarị",
    none: "Họrọ ndị ị ga-akpọ.",
    messageLabel: "Ozi (nhọrọ)",
    messagePlaceholder: "Tinye obere ozi maka ndị ị na-akpọ.",
    candidateNotifyTitle: "Onye na-ewe ọrụ kpọrọ gị ka i tinye akwụkwọ",
    candidateNotifyBody:
      "Onye na-ewe ọrụ kpọrọ gị ka i tinye akwụkwọ maka {job}, dabere na mmecha gị akwadoro nke Henry Onyx Learn.",
  },
};

const LEARN_TO_EARN_COPY_YO: DeepPartial<LearnToEarnCopy> = {
  badge: {
    label: "Henry Onyx Learn fọwọ́ sí",
    aria: "Ọgbọ́n tí Henry Onyx Learn fọwọ́ sí",
    verifyCta: "Wo ìwé ẹ̀rí",
  },
  gate: {
    requiredEyebrow: "Ẹ̀kọ́ pọn dandan",
    requiredTitle: "Ipò yìí béèrè ẹ̀kọ́ tí a fọwọ́ sí",
    requiredBody:
      "Parí {course} lórí Henry Onyx Learn láti béèrè. A máa ń ṣàyẹ̀wò ìparí rẹ tí a fọwọ́ sí fúnra rẹ̀.",
    preferredTitle: "Ẹ̀kọ́ tí a fọwọ́ sí ṣe ìrànlọ́wọ́ níbí",
    preferredBody:
      "Pípari {course} lórí Henry Onyx Learn fi ọ́ hàn gẹ́gẹ́ bí olùdíje àyànfẹ́ fún ipò yìí.",
    takeCourseCta: "Gba ẹ̀kọ́ yìí láti yẹ",
    blockedNotice:
      "Ipò yìí béèrè ìparí {course} tí a fọwọ́ sí. Parí ẹ̀kọ́ náà, kí o sì béèrè.",
    manageEyebrow: "Ìbéèrè ẹ̀kọ́",
    manageTitle: "Béèrè ẹ̀kọ́ tí a fọwọ́ sí",
    manageBody:
      "Dín àwọn olùbéèrè kù sí àwọn tí ó parí ẹ̀kọ́ Henry Onyx Learn kan pàtó, tàbí samì sí gẹ́gẹ́ bí àyànfẹ́.",
    addCta: "Fi ìbéèrè ẹ̀kọ́ kún",
    removeCta: "Yọ kúrò",
    requiredOption: "Pọn dandan láti béèrè",
    preferredOption: "Àyànfẹ́",
    empty: "Kò sí ìbéèrè ẹ̀kọ́ lórí ipò yìí.",
  },
  optin: {
    eyebrow: "Ìhàn iṣẹ́",
    title: "Jẹ́ kí àwọn agbanisíṣẹ́ rí ọ",
    body:
      "Yan àwọn ẹ̀kọ́ tí o parí tí àwọn agbanisíṣẹ́ lè lò láti rí ọ. O wà ní ìkọ̀kọ̀ títí o fi gbà, o sì lè jáde nígbàkigbà.",
    listLabel: "Tò mí fún àwọn agbanisíṣẹ́ fún {course}",
    unlistLabel: "Dáwọ́ títò mí fún {course}",
    consentNote:
      "Àwọn agbanisíṣẹ́ tí ń ṣàyọ̀nù tàbí ń gbaniṣẹ́ lórí ẹ̀kọ́ yìí lè rí ìparí rẹ tí a fọwọ́ sí àti profáìlì rẹ. Jíjáde yọ ọ́ kúrò nínú gbogbo àtòjọ lẹ́sẹ̀kẹsẹ̀.",
    listedStatus: "A tò fún àwọn agbanisíṣẹ́",
    notListedStatus: "Kò sí nínú àtòjọ",
    empty: "Parí ẹ̀kọ́ tí a fọwọ́ sí láti yan ìhàn rẹ.",
  },
  pool: {
    eyebrow: "Àwọn tí ó parí tí a fọwọ́ sí",
    title: "Àwọn olùdíje tí Henry Onyx Learn fọwọ́ sí",
    body:
      "Àwọn tí ó parí ẹ̀kọ́ tí o ń ṣàyọ̀nù tàbí ń gbaniṣẹ́ lórí tí wọ́n sì yàn láti wà nínú àtòjọ. Olúkúlùkù ní ìparí tí a fọwọ́ sí.",
    courseFilterLabel: "Ẹ̀kọ́",
    allCoursesOption: "Gbogbo ẹ̀kọ́",
    candidateCountOne: "Olùdíje 1",
    candidateCountOther: "Olùdíje {count}",
    emptyTitle: "Kò sí olùdíje nínú àtòjọ síbẹ̀",
    emptyBody:
      "Nígbà tí àwọn tí ó parí tí a fọwọ́ sí bá dara pọ̀ fún ẹ̀kọ́ tí o ń ṣàyọ̀nù tàbí ń gbaniṣẹ́, wọn yóò hàn níbí.",
  },
  invite: {
    bulkCta: "Pe àwọn tí a yàn",
    sentNotice: "A pe {count}.",
    alreadyInvited: "A ti pè",
    none: "Yan àwọn olùdíje láti pè.",
    messageLabel: "Ìfiránṣẹ́ (àṣàyàn)",
    messagePlaceholder: "Fi àkíyèsí kúkúrú kún fún àwọn olùdíje tí o pè.",
    candidateNotifyTitle: "Agbanisíṣẹ́ kan pè ọ́ láti béèrè",
    candidateNotifyBody:
      "Agbanisíṣẹ́ kan pè ọ́ láti béèrè fún {job}, lórí ìparí rẹ tí a fọwọ́ sí ní Henry Onyx Learn.",
  },
};

const LEARN_TO_EARN_COPY_HA: DeepPartial<LearnToEarnCopy> = {
  badge: {
    label: "An tabbatar da Henry Onyx Learn",
    aria: "Ƙwarewar da Henry Onyx Learn ya tabbatar",
    verifyCta: "Duba takardar shaida",
  },
  gate: {
    requiredEyebrow: "Ana buƙatar kwas",
    requiredTitle: "Wannan aikin yana buƙatar kwas da aka tabbatar",
    requiredBody:
      "Kammala {course} a Henry Onyx Learn don nema. Ana duba kammalawarka da aka tabbatar ta atomatik.",
    preferredTitle: "Kwas da aka tabbatar yana taimakawa nan",
    preferredBody:
      "Kammala {course} a Henry Onyx Learn yana sa ka zama ɗan takarar da aka fi so don wannan aikin.",
    takeCourseCta: "Ɗauki wannan kwas don cancanta",
    blockedNotice:
      "Wannan aikin yana buƙatar kammalawar {course} da aka tabbatar. Kammala kwas ɗin, sannan ka nema.",
    manageEyebrow: "Sharaɗin kwas",
    manageTitle: "Buƙatar kwas da aka tabbatar",
    manageBody:
      "Iyakance masu nema ga waɗanda suka kammala wani kwas na Henry Onyx Learn, ko ka sanya shi a matsayin wanda aka fi so.",
    addCta: "Ƙara sharaɗin kwas",
    removeCta: "Cire",
    requiredOption: "Wajibi don nema",
    preferredOption: "Wanda aka fi so",
    empty: "Babu sharaɗin kwas a wannan aikin.",
  },
  optin: {
    eyebrow: "Ganuwar sana'a",
    title: "Bari masu ɗaukar aiki su same ka",
    body:
      "Zaɓi waɗanne kwasoshi da ka kammala masu ɗaukar aiki za su iya amfani da su don samun ka. Kana cikin sirri har sai ka yarda, kuma kana iya fita kowane lokaci.",
    listLabel: "Lissafa ni ga masu ɗaukar aiki don {course}",
    unlistLabel: "Daina lissafa ni don {course}",
    consentNote:
      "Masu ɗaukar aiki da ke tacewa ko ɗaukar aiki bisa wannan kwas suna iya ganin kammalawarka da aka tabbatar da bayananka. Fita yana cire ka daga kowane jeri nan take.",
    listedStatus: "An lissafa ga masu ɗaukar aiki",
    notListedStatus: "Ba a lissafa ba",
    empty: "Kammala kwas da aka tabbatar don zaɓar ganuwarka.",
  },
  pool: {
    eyebrow: "Waɗanda suka kammala da tabbaci",
    title: "Yan takara da Henry Onyx Learn ya tabbatar",
    body:
      "Mutanen da suka kammala kwas da kake tacewa ko ɗaukar aiki a kai kuma suka zaɓi a lissafa su. Kowanne yana da kammalawa da aka tabbatar.",
    courseFilterLabel: "Kwas",
    allCoursesOption: "Dukan kwasoshi",
    candidateCountOne: "Ɗan takara 1",
    candidateCountOther: "Yan takara {count}",
    emptyTitle: "Babu yan takara da aka lissafa tukuna",
    emptyBody:
      "Lokacin da waɗanda suka kammala da tabbaci suka shiga don kwas da kake tacewa ko ɗaukar aiki, suna bayyana nan.",
  },
  invite: {
    bulkCta: "Gayyaci waɗanda aka zaɓa",
    sentNotice: "An gayyaci {count}.",
    alreadyInvited: "An riga an gayyata",
    none: "Zaɓi yan takara don gayyata.",
    messageLabel: "Saƙo (na zaɓi)",
    messagePlaceholder: "Ƙara taƙaitaccen bayani ga yan takarar da kake gayyata.",
    candidateNotifyTitle: "Mai ɗaukar aiki ya gayyace ka ka nema",
    candidateNotifyBody:
      "Mai ɗaukar aiki ya gayyace ka ka nema {job}, bisa kammalawarka da aka tabbatar a Henry Onyx Learn.",
  },
};

const LEARN_TO_EARN_COPY_LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<LearnToEarnCopy>>> = {
  fr: LEARN_TO_EARN_COPY_FR,
  es: LEARN_TO_EARN_COPY_ES,
  pt: LEARN_TO_EARN_COPY_PT,
  de: LEARN_TO_EARN_COPY_DE,
  it: LEARN_TO_EARN_COPY_IT,
  ar: LEARN_TO_EARN_COPY_AR,
  zh: LEARN_TO_EARN_COPY_ZH,
  hi: LEARN_TO_EARN_COPY_HI,
  ig: LEARN_TO_EARN_COPY_IG,
  yo: LEARN_TO_EARN_COPY_YO,
  ha: LEARN_TO_EARN_COPY_HA,
};

/** Resolve `surface:learn-to-earn` copy for a locale (deep-merged over EN). */
export function getLearnToEarnCopy(locale: AppLocale): LearnToEarnCopy {
  const overrides = LEARN_TO_EARN_COPY_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      LEARN_TO_EARN_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as LearnToEarnCopy;
  }
  return LEARN_TO_EARN_COPY_EN;
}
