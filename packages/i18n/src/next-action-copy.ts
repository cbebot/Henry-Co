import type { AppLocale } from "./locales";
import { deepMergeMessages } from "./merge-messages";

/**
 * surface:next_action — typed copy for the V3-39 per-page "do this next"
 * resolver: the seed catalog action copy, the floating-chip chrome, and the
 * settings control.
 *
 * The `actions` sub-object structurally satisfies `NextActionCatalogCopy` in
 * `@henryco/intelligence` — the host app (which depends on both packages)
 * passes it into `resolveNextAction`, and TypeScript enforces the shapes agree
 * there. The engine carries NO user-facing literal; this module is the single
 * copy source. EN is the base; locales without an override fall back to EN
 * through `deepMergeMessages` (the ecosystem i18n maturity model).
 */
export type NextActionEntryCopy = {
  title: string;
  description: string;
  ctaLabel: string;
};

export type NextActionCopy = {
  chip: {
    /** The chip prefix ("Continue"). */
    prefix: string;
    /** Accessible label for the dismiss control. */
    dismiss: string;
    /** Accessible label for the chip region. */
    region: string;
  };
  settings: {
    toggleLabel: string;
    toggleDescription: string;
  };
  actions: {
    accountTrust: NextActionEntryCopy;
    accountProfile: NextActionEntryCopy;
    accountSavedJobs: NextActionEntryCopy;
    marketplaceSave: NextActionEntryCopy;
    marketplaceCompare: NextActionEntryCopy;
    careBook: NextActionEntryCopy;
    jobsApply: NextActionEntryCopy;
    jobsSave: NextActionEntryCopy;
    studioQuote: NextActionEntryCopy;
    learnContinue: NextActionEntryCopy;
    propertyInspection: NextActionEntryCopy;
    propertySave: NextActionEntryCopy;
    logisticsTrack: NextActionEntryCopy;
    logisticsReturn: NextActionEntryCopy;
    stitchCareToJobs: NextActionEntryCopy;
    stitchLearnToJobs: NextActionEntryCopy;
    stitchMarketplaceToLogistics: NextActionEntryCopy;
  };
};

const EN: NextActionCopy = {
  chip: {
    prefix: "Continue",
    dismiss: "Dismiss suggestion",
    region: "Suggested next step",
  },
  settings: {
    toggleLabel: "Next-step suggestions",
    toggleDescription:
      "Show a small “do this next” suggestion on relevant pages. Turning this off hides all suggestions.",
  },
  actions: {
    accountTrust: {
      title: "Complete your trust verification",
      description: "A verified account can use more services across your account.",
      ctaLabel: "Review trust status",
    },
    accountProfile: {
      title: "Finish your profile",
      description: "A complete profile improves support and service continuity.",
      ctaLabel: "Complete profile",
    },
    accountSavedJobs: {
      title: "Follow up on saved roles",
      description: "Review the roles you saved and apply when you are ready.",
      ctaLabel: "Open jobs",
    },
    marketplaceSave: {
      title: "Save this for later",
      description: "Keep this item in your saved list to compare or buy when you're ready.",
      ctaLabel: "Save item",
    },
    marketplaceCompare: {
      title: "Compare with similar items",
      description: "See similar listings side by side before you decide.",
      ctaLabel: "Compare",
    },
    careBook: {
      title: "Book a Care provider",
      description: "Choose a service and confirm your booking in a few steps.",
      ctaLabel: "Start booking",
    },
    jobsApply: {
      title: "Apply for this role",
      description: "Your profile is ready — submit your application from here.",
      ctaLabel: "Apply",
    },
    jobsSave: {
      title: "Save this role",
      description: "Keep it in your saved roles and apply when your profile is ready.",
      ctaLabel: "Save role",
    },
    studioQuote: {
      title: "Get a quote within 24 hours",
      description: "Submit a short brief and receive a considered quote.",
      ctaLabel: "Submit a brief",
    },
    learnContinue: {
      title: "Continue your course",
      description: "Pick up your lessons where you left off.",
      ctaLabel: "Resume course",
    },
    propertyInspection: {
      title: "Request an inspection",
      description: "Arrange a viewing of this property with the listing agent.",
      ctaLabel: "Request viewing",
    },
    propertySave: {
      title: "Save this property",
      description: "Keep it in your saved list and compare at your own pace.",
      ctaLabel: "Save property",
    },
    logisticsTrack: {
      title: "Track your shipment",
      description: "See the current status and route of your delivery.",
      ctaLabel: "Track shipment",
    },
    logisticsReturn: {
      title: "Book a return",
      description: "Arrange a return pickup in a few steps.",
      ctaLabel: "Book return",
    },
    stitchCareToJobs: {
      title: "Hiring help? See caregiver roles",
      description: "Your Care booking is complete. Jobs lists caregiver roles if you need ongoing help.",
      ctaLabel: "See caregiver roles",
    },
    stitchLearnToJobs: {
      title: "See roles that value this course",
      description: "Your course is complete. Employers on Jobs list roles that match these skills.",
      ctaLabel: "Explore roles",
    },
    stitchMarketplaceToLogistics: {
      title: "Need it delivered?",
      description: "Your order is complete. Book a delivery with Logistics in a few steps.",
      ctaLabel: "Book delivery",
    },
  },
};

const FR: Partial<NextActionCopy> = {
  chip: { prefix: "Continuer", dismiss: "Ignorer la suggestion", region: "Prochaine étape suggérée" },
  settings: {
    toggleLabel: "Suggestions d'étape suivante",
    toggleDescription:
      "Affiche une petite suggestion « à faire ensuite » sur les pages pertinentes. Désactiver masque toutes les suggestions.",
  },
  actions: {
    accountTrust: { title: "Terminez votre vérification de confiance", description: "Un compte vérifié peut utiliser davantage de services.", ctaLabel: "Voir le statut de confiance" },
    accountProfile: { title: "Complétez votre profil", description: "Un profil complet améliore l'assistance et la continuité du service.", ctaLabel: "Compléter le profil" },
    accountSavedJobs: { title: "Reprenez vos postes enregistrés", description: "Consultez les postes enregistrés et postulez quand vous êtes prêt.", ctaLabel: "Ouvrir les offres" },
    marketplaceSave: { title: "Enregistrer pour plus tard", description: "Gardez cet article dans votre liste pour comparer ou acheter quand vous serez prêt.", ctaLabel: "Enregistrer l'article" },
    marketplaceCompare: { title: "Comparer avec des articles similaires", description: "Consultez des annonces similaires côte à côte avant de décider.", ctaLabel: "Comparer" },
    careBook: { title: "Réserver un prestataire Care", description: "Choisissez un service et confirmez votre réservation en quelques étapes.", ctaLabel: "Commencer la réservation" },
    jobsApply: { title: "Postuler à ce poste", description: "Votre profil est prêt — envoyez votre candidature d'ici.", ctaLabel: "Postuler" },
    jobsSave: { title: "Enregistrer ce poste", description: "Gardez-le dans vos postes enregistrés et postulez quand votre profil sera prêt.", ctaLabel: "Enregistrer le poste" },
    studioQuote: { title: "Recevez un devis sous 24 heures", description: "Soumettez un brief court et recevez un devis réfléchi.", ctaLabel: "Soumettre un brief" },
    learnContinue: { title: "Continuer votre cours", description: "Reprenez vos leçons là où vous vous êtes arrêté.", ctaLabel: "Reprendre le cours" },
    propertyInspection: { title: "Demander une visite", description: "Organisez une visite de ce bien avec l'agent de l'annonce.", ctaLabel: "Demander une visite" },
    propertySave: { title: "Enregistrer ce bien", description: "Gardez-le dans votre liste et comparez à votre rythme.", ctaLabel: "Enregistrer le bien" },
    logisticsTrack: { title: "Suivre votre envoi", description: "Consultez le statut actuel et l'itinéraire de votre livraison.", ctaLabel: "Suivre l'envoi" },
    logisticsReturn: { title: "Réserver un retour", description: "Organisez un enlèvement de retour en quelques étapes.", ctaLabel: "Réserver un retour" },
    stitchCareToJobs: { title: "Besoin d'aide durable ? Voir les postes d'aide à domicile", description: "Votre réservation Care est terminée. Jobs répertorie des postes d'aide à domicile si vous avez besoin d'un soutien continu.", ctaLabel: "Voir les postes" },
    stitchLearnToJobs: { title: "Voir les postes qui valorisent ce cours", description: "Votre cours est terminé. Les employeurs sur Jobs publient des postes correspondant à ces compétences.", ctaLabel: "Explorer les postes" },
    stitchMarketplaceToLogistics: { title: "Besoin d'une livraison ?", description: "Votre commande est terminée. Réservez une livraison avec Logistics en quelques étapes.", ctaLabel: "Réserver une livraison" },
  },
};

const ES: Partial<NextActionCopy> = {
  chip: { prefix: "Continuar", dismiss: "Descartar sugerencia", region: "Siguiente paso sugerido" },
  settings: { toggleLabel: "Sugerencias de siguiente paso", toggleDescription: "Muestra una pequeña sugerencia de “haz esto ahora” en las páginas relevantes. Al desactivarla se ocultan todas las sugerencias." },
  actions: {
    accountTrust: { title: "Completa tu verificación de confianza", description: "Una cuenta verificada puede usar más servicios.", ctaLabel: "Ver estado de confianza" },
    accountProfile: { title: "Termina tu perfil", description: "Un perfil completo mejora el soporte y la continuidad del servicio.", ctaLabel: "Completar perfil" },
    accountSavedJobs: { title: "Retoma tus puestos guardados", description: "Revisa los puestos guardados y postúlate cuando estés listo.", ctaLabel: "Abrir empleos" },
    marketplaceSave: { title: "Guardar para más tarde", description: "Mantén este artículo en tu lista para comparar o comprar cuando estés listo.", ctaLabel: "Guardar artículo" },
    marketplaceCompare: { title: "Comparar con artículos similares", description: "Mira anuncios similares lado a lado antes de decidir.", ctaLabel: "Comparar" },
    careBook: { title: "Reservar un proveedor de Care", description: "Elige un servicio y confirma tu reserva en pocos pasos.", ctaLabel: "Iniciar reserva" },
    jobsApply: { title: "Postularte a este puesto", description: "Tu perfil está listo: envía tu solicitud desde aquí.", ctaLabel: "Postular" },
    jobsSave: { title: "Guardar este puesto", description: "Mantenlo en tus puestos guardados y postúlate cuando tu perfil esté listo.", ctaLabel: "Guardar puesto" },
    studioQuote: { title: "Recibe una cotización en 24 horas", description: "Envía un brief corto y recibe una cotización considerada.", ctaLabel: "Enviar un brief" },
    learnContinue: { title: "Continuar tu curso", description: "Retoma tus lecciones donde las dejaste.", ctaLabel: "Reanudar curso" },
    propertyInspection: { title: "Solicitar una inspección", description: "Coordina una visita a esta propiedad con el agente del anuncio.", ctaLabel: "Solicitar visita" },
    propertySave: { title: "Guardar esta propiedad", description: "Mantenla en tu lista y compara a tu ritmo.", ctaLabel: "Guardar propiedad" },
    logisticsTrack: { title: "Rastrear tu envío", description: "Consulta el estado actual y la ruta de tu entrega.", ctaLabel: "Rastrear envío" },
    logisticsReturn: { title: "Reservar una devolución", description: "Coordina una recogida de devolución en pocos pasos.", ctaLabel: "Reservar devolución" },
    stitchCareToJobs: { title: "¿Necesitas ayuda continua? Mira roles de cuidado", description: "Tu reserva de Care está completa. Jobs lista roles de cuidado si necesitas apoyo continuo.", ctaLabel: "Ver roles de cuidado" },
    stitchLearnToJobs: { title: "Mira roles que valoran este curso", description: "Tu curso está completo. Los empleadores en Jobs publican roles que coinciden con estas habilidades.", ctaLabel: "Explorar roles" },
    stitchMarketplaceToLogistics: { title: "¿Lo necesitas a domicilio?", description: "Tu pedido está completo. Reserva una entrega con Logistics en pocos pasos.", ctaLabel: "Reservar entrega" },
  },
};

const PT: Partial<NextActionCopy> = {
  chip: { prefix: "Continuar", dismiss: "Dispensar sugestão", region: "Próximo passo sugerido" },
  settings: { toggleLabel: "Sugestões de próximo passo", toggleDescription: "Mostra uma pequena sugestão de “faça isto a seguir” nas páginas relevantes. Desativar oculta todas as sugestões." },
  actions: {
    accountTrust: { title: "Conclua sua verificação de confiança", description: "Uma conta verificada pode usar mais serviços.", ctaLabel: "Ver status de confiança" },
    accountProfile: { title: "Finalize seu perfil", description: "Um perfil completo melhora o suporte e a continuidade do serviço.", ctaLabel: "Completar perfil" },
    accountSavedJobs: { title: "Retome suas vagas salvas", description: "Revise as vagas salvas e candidate-se quando estiver pronto.", ctaLabel: "Abrir vagas" },
    marketplaceSave: { title: "Salvar para depois", description: "Mantenha este item na sua lista para comparar ou comprar quando estiver pronto.", ctaLabel: "Salvar item" },
    marketplaceCompare: { title: "Comparar com itens semelhantes", description: "Veja anúncios semelhantes lado a lado antes de decidir.", ctaLabel: "Comparar" },
    careBook: { title: "Reservar um profissional Care", description: "Escolha um serviço e confirme sua reserva em poucos passos.", ctaLabel: "Iniciar reserva" },
    jobsApply: { title: "Candidatar-se a esta vaga", description: "Seu perfil está pronto — envie sua candidatura daqui.", ctaLabel: "Candidatar-se" },
    jobsSave: { title: "Salvar esta vaga", description: "Mantenha-a nas suas vagas salvas e candidate-se quando seu perfil estiver pronto.", ctaLabel: "Salvar vaga" },
    studioQuote: { title: "Receba um orçamento em 24 horas", description: "Envie um briefing curto e receba um orçamento cuidadoso.", ctaLabel: "Enviar briefing" },
    learnContinue: { title: "Continuar seu curso", description: "Retome suas lições de onde parou.", ctaLabel: "Retomar curso" },
    propertyInspection: { title: "Solicitar uma inspeção", description: "Combine uma visita a este imóvel com o agente do anúncio.", ctaLabel: "Solicitar visita" },
    propertySave: { title: "Salvar este imóvel", description: "Mantenha-o na sua lista e compare no seu ritmo.", ctaLabel: "Salvar imóvel" },
    logisticsTrack: { title: "Rastrear sua remessa", description: "Veja o status atual e a rota da sua entrega.", ctaLabel: "Rastrear remessa" },
    logisticsReturn: { title: "Agendar uma devolução", description: "Combine uma coleta de devolução em poucos passos.", ctaLabel: "Agendar devolução" },
    stitchCareToJobs: { title: "Precisa de ajuda contínua? Veja vagas de cuidadores", description: "Sua reserva Care foi concluída. O Jobs lista vagas de cuidadores se você precisar de apoio contínuo.", ctaLabel: "Ver vagas de cuidadores" },
    stitchLearnToJobs: { title: "Veja vagas que valorizam este curso", description: "Seu curso foi concluído. Empregadores no Jobs publicam vagas que combinam com essas habilidades.", ctaLabel: "Explorar vagas" },
    stitchMarketplaceToLogistics: { title: "Precisa de entrega?", description: "Seu pedido foi concluído. Agende uma entrega com a Logistics em poucos passos.", ctaLabel: "Agendar entrega" },
  },
};

const DE: Partial<NextActionCopy> = {
  chip: { prefix: "Weiter", dismiss: "Vorschlag ausblenden", region: "Vorgeschlagener nächster Schritt" },
  settings: { toggleLabel: "Nächste-Schritte-Vorschläge", toggleDescription: "Zeigt auf relevanten Seiten einen kleinen „als Nächstes“-Vorschlag. Beim Deaktivieren werden alle Vorschläge ausgeblendet." },
  actions: {
    accountTrust: { title: "Schließe deine Vertrauensprüfung ab", description: "Ein verifiziertes Konto kann mehr Dienste nutzen.", ctaLabel: "Vertrauensstatus ansehen" },
    accountProfile: { title: "Vervollständige dein Profil", description: "Ein vollständiges Profil verbessert Support und Servicekontinuität.", ctaLabel: "Profil vervollständigen" },
    accountSavedJobs: { title: "Gespeicherte Stellen weiterverfolgen", description: "Sieh dir deine gespeicherten Stellen an und bewirb dich, wenn du bereit bist.", ctaLabel: "Stellen öffnen" },
    marketplaceSave: { title: "Für später speichern", description: "Behalte diesen Artikel in deiner Liste, um zu vergleichen oder später zu kaufen.", ctaLabel: "Artikel speichern" },
    marketplaceCompare: { title: "Mit ähnlichen Artikeln vergleichen", description: "Sieh dir ähnliche Angebote nebeneinander an, bevor du entscheidest.", ctaLabel: "Vergleichen" },
    careBook: { title: "Care-Anbieter buchen", description: "Wähle einen Service und bestätige deine Buchung in wenigen Schritten.", ctaLabel: "Buchung starten" },
    jobsApply: { title: "Auf diese Stelle bewerben", description: "Dein Profil ist bereit — reiche deine Bewerbung von hier aus ein.", ctaLabel: "Bewerben" },
    jobsSave: { title: "Diese Stelle speichern", description: "Behalte sie in deinen gespeicherten Stellen und bewirb dich, wenn dein Profil bereit ist.", ctaLabel: "Stelle speichern" },
    studioQuote: { title: "Angebot innerhalb von 24 Stunden", description: "Reiche ein kurzes Briefing ein und erhalte ein durchdachtes Angebot.", ctaLabel: "Briefing einreichen" },
    learnContinue: { title: "Kurs fortsetzen", description: "Setze deine Lektionen dort fort, wo du aufgehört hast.", ctaLabel: "Kurs fortsetzen" },
    propertyInspection: { title: "Besichtigung anfragen", description: "Vereinbare eine Besichtigung dieser Immobilie mit dem Makler.", ctaLabel: "Besichtigung anfragen" },
    propertySave: { title: "Diese Immobilie speichern", description: "Behalte sie in deiner Liste und vergleiche in deinem Tempo.", ctaLabel: "Immobilie speichern" },
    logisticsTrack: { title: "Sendung verfolgen", description: "Sieh den aktuellen Status und die Route deiner Lieferung.", ctaLabel: "Sendung verfolgen" },
    logisticsReturn: { title: "Rücksendung buchen", description: "Vereinbare eine Rückholung in wenigen Schritten.", ctaLabel: "Rücksendung buchen" },
    stitchCareToJobs: { title: "Laufende Hilfe nötig? Betreuungsstellen ansehen", description: "Deine Care-Buchung ist abgeschlossen. Jobs listet Betreuungsstellen, wenn du dauerhafte Unterstützung brauchst.", ctaLabel: "Stellen ansehen" },
    stitchLearnToJobs: { title: "Stellen ansehen, die diesen Kurs schätzen", description: "Dein Kurs ist abgeschlossen. Arbeitgeber auf Jobs listen Stellen, die zu diesen Fähigkeiten passen.", ctaLabel: "Stellen erkunden" },
    stitchMarketplaceToLogistics: { title: "Lieferung gewünscht?", description: "Deine Bestellung ist abgeschlossen. Buche eine Lieferung mit Logistics in wenigen Schritten.", ctaLabel: "Lieferung buchen" },
  },
};

const IT: Partial<NextActionCopy> = {
  chip: { prefix: "Continua", dismiss: "Ignora suggerimento", region: "Prossimo passo suggerito" },
  settings: { toggleLabel: "Suggerimenti sul prossimo passo", toggleDescription: "Mostra un piccolo suggerimento “fai questo ora” sulle pagine pertinenti. Disattivando si nascondono tutti i suggerimenti." },
  actions: {
    accountTrust: { title: "Completa la verifica di fiducia", description: "Un account verificato può usare più servizi.", ctaLabel: "Vedi stato di fiducia" },
    accountProfile: { title: "Completa il tuo profilo", description: "Un profilo completo migliora l'assistenza e la continuità del servizio.", ctaLabel: "Completa profilo" },
    accountSavedJobs: { title: "Riprendi i ruoli salvati", description: "Rivedi i ruoli salvati e candidati quando sei pronto.", ctaLabel: "Apri i ruoli" },
    marketplaceSave: { title: "Salva per dopo", description: "Tieni questo articolo nella tua lista per confrontare o acquistare quando sei pronto.", ctaLabel: "Salva articolo" },
    marketplaceCompare: { title: "Confronta con articoli simili", description: "Guarda annunci simili fianco a fianco prima di decidere.", ctaLabel: "Confronta" },
    careBook: { title: "Prenota un professionista Care", description: "Scegli un servizio e conferma la prenotazione in pochi passi.", ctaLabel: "Inizia la prenotazione" },
    jobsApply: { title: "Candidati per questo ruolo", description: "Il tuo profilo è pronto — invia la candidatura da qui.", ctaLabel: "Candidati" },
    jobsSave: { title: "Salva questo ruolo", description: "Tienilo nei ruoli salvati e candidati quando il tuo profilo sarà pronto.", ctaLabel: "Salva ruolo" },
    studioQuote: { title: "Ricevi un preventivo entro 24 ore", description: "Invia un breve brief e ricevi un preventivo ponderato.", ctaLabel: "Invia un brief" },
    learnContinue: { title: "Continua il tuo corso", description: "Riprendi le lezioni da dove le avevi lasciate.", ctaLabel: "Riprendi corso" },
    propertyInspection: { title: "Richiedi un sopralluogo", description: "Organizza una visita a questo immobile con l'agente dell'annuncio.", ctaLabel: "Richiedi visita" },
    propertySave: { title: "Salva questo immobile", description: "Tienilo nella tua lista e confronta con calma.", ctaLabel: "Salva immobile" },
    logisticsTrack: { title: "Traccia la tua spedizione", description: "Vedi lo stato attuale e il percorso della tua consegna.", ctaLabel: "Traccia spedizione" },
    logisticsReturn: { title: "Prenota un reso", description: "Organizza un ritiro per il reso in pochi passi.", ctaLabel: "Prenota reso" },
    stitchCareToJobs: { title: "Serve aiuto continuativo? Vedi i ruoli di assistenza", description: "La tua prenotazione Care è completa. Jobs elenca ruoli di assistenza se ti serve un supporto continuativo.", ctaLabel: "Vedi ruoli di assistenza" },
    stitchLearnToJobs: { title: "Vedi i ruoli che valorizzano questo corso", description: "Il tuo corso è completo. I datori di lavoro su Jobs pubblicano ruoli che corrispondono a queste competenze.", ctaLabel: "Esplora ruoli" },
    stitchMarketplaceToLogistics: { title: "Ti serve la consegna?", description: "Il tuo ordine è completo. Prenota una consegna con Logistics in pochi passi.", ctaLabel: "Prenota consegna" },
  },
};

const AR: Partial<NextActionCopy> = {
  chip: { prefix: "متابعة", dismiss: "تجاهل الاقتراح", region: "الخطوة التالية المقترحة" },
  settings: { toggleLabel: "اقتراحات الخطوة التالية", toggleDescription: "يعرض اقتراحًا صغيرًا “افعل هذا تاليًا” على الصفحات ذات الصلة. إيقافه يخفي جميع الاقتراحات." },
  actions: {
    accountTrust: { title: "أكمل التحقق من الثقة", description: "الحساب الموثّق يمكنه استخدام مزيد من الخدمات.", ctaLabel: "عرض حالة الثقة" },
    accountProfile: { title: "أكمل ملفك الشخصي", description: "الملف المكتمل يحسّن الدعم واستمرارية الخدمة.", ctaLabel: "إكمال الملف" },
    accountSavedJobs: { title: "تابع الوظائف المحفوظة", description: "راجع الوظائف التي حفظتها وقدّم عندما تكون مستعدًا.", ctaLabel: "فتح الوظائف" },
    marketplaceSave: { title: "احفظه لوقت لاحق", description: "أبقِ هذا المنتج في قائمتك المحفوظة للمقارنة أو الشراء عندما تكون مستعدًا.", ctaLabel: "حفظ المنتج" },
    marketplaceCompare: { title: "قارن مع منتجات مشابهة", description: "اطّلع على عروض مشابهة جنبًا إلى جنب قبل أن تقرر.", ctaLabel: "قارن" },
    careBook: { title: "احجز مقدم رعاية", description: "اختر خدمة وأكّد حجزك في خطوات قليلة.", ctaLabel: "ابدأ الحجز" },
    jobsApply: { title: "قدّم على هذه الوظيفة", description: "ملفك جاهز — أرسل طلبك من هنا.", ctaLabel: "قدّم" },
    jobsSave: { title: "احفظ هذه الوظيفة", description: "أبقها في وظائفك المحفوظة وقدّم عندما يكون ملفك جاهزًا.", ctaLabel: "حفظ الوظيفة" },
    studioQuote: { title: "احصل على عرض سعر خلال 24 ساعة", description: "أرسل موجزًا قصيرًا وستتلقى عرض سعر مدروسًا.", ctaLabel: "أرسل موجزًا" },
    learnContinue: { title: "تابع دورتك", description: "استأنف دروسك من حيث توقفت.", ctaLabel: "استئناف الدورة" },
    propertyInspection: { title: "اطلب معاينة", description: "رتّب زيارة لهذا العقار مع وكيل الإعلان.", ctaLabel: "طلب معاينة" },
    propertySave: { title: "احفظ هذا العقار", description: "أبقه في قائمتك وقارن على مهلك.", ctaLabel: "حفظ العقار" },
    logisticsTrack: { title: "تتبّع شحنتك", description: "اطّلع على الحالة الحالية ومسار التوصيل.", ctaLabel: "تتبّع الشحنة" },
    logisticsReturn: { title: "احجز إرجاعًا", description: "رتّب استلام الإرجاع في خطوات قليلة.", ctaLabel: "حجز إرجاع" },
    stitchCareToJobs: { title: "تحتاج مساعدة مستمرة؟ اطّلع على وظائف الرعاية", description: "اكتمل حجز الرعاية الخاص بك. تعرض Jobs وظائف رعاية إذا كنت بحاجة إلى دعم مستمر.", ctaLabel: "عرض وظائف الرعاية" },
    stitchLearnToJobs: { title: "اطّلع على وظائف تقدّر هذه الدورة", description: "اكتملت دورتك. يعرض أصحاب العمل على Jobs وظائف تطابق هذه المهارات.", ctaLabel: "استكشاف الوظائف" },
    stitchMarketplaceToLogistics: { title: "تحتاج توصيلًا؟", description: "اكتمل طلبك. احجز توصيلًا مع Logistics في خطوات قليلة.", ctaLabel: "حجز توصيل" },
  },
};

const IG: Partial<NextActionCopy> = {
  chip: { prefix: "Gaa n'ihu", dismiss: "Wepụ aro a", region: "Nzọụkwụ ọzọ a tụrụ aro" },
  settings: { toggleLabel: "Aro nzọụkwụ ọzọ", toggleDescription: "Na-egosi obere aro “mee nke a ọzọ” na ibe ndị dabara. Ịgbanyụ ya na-ezochi aro niile." },
  actions: {
    accountTrust: { title: "Mechaa nkwenye ntụkwasị obi gị", description: "Akaụntụ e kwadoro nwere ike iji ọtụtụ ọrụ.", ctaLabel: "Lee ọnọdụ ntụkwasị obi" },
    accountProfile: { title: "Mechaa profaịlụ gị", description: "Profaịlụ zuru ezu na-eme ka nkwado na ịga n'ihu nke ọrụ ka mma.", ctaLabel: "Mezue profaịlụ" },
    accountSavedJobs: { title: "Gaa n'ihu na ọrụ ndị i chekwara", description: "Lee ọrụ ndị i chekwara ma tinye akwụkwọ mgbe ị dị njikere.", ctaLabel: "Mepee ọrụ" },
    marketplaceSave: { title: "Chekwaa maka oge ọzọ", description: "Debe ihe a na ndepụta gị ka i jiri tulee ma ọ bụ zụta mgbe ị dị njikere.", ctaLabel: "Chekwaa ihe" },
    marketplaceCompare: { title: "Jiri ya tulee ihe ndị yiri ya", description: "Lee ihe ndị yiri ya n'akụkụ ibe ha tupu i kpebie.", ctaLabel: "Tulee" },
    careBook: { title: "Debe onye ọrụ Care", description: "Họrọ ọrụ ma kwado ndebe gị na nzọụkwụ ole na ole.", ctaLabel: "Malite ndebe" },
    jobsApply: { title: "Tinye akwụkwọ maka ọrụ a", description: "Profaịlụ gị dị njikere — zipu ntinye gị site ebe a.", ctaLabel: "Tinye akwụkwọ" },
    jobsSave: { title: "Chekwaa ọrụ a", description: "Debe ya na ọrụ ndị i chekwara ma tinye mgbe profaịlụ gị dị njikere.", ctaLabel: "Chekwaa ọrụ" },
    studioQuote: { title: "Nweta ọnụahịa n'ime awa 24", description: "Zipu nkọwa dị mkpirikpi ma nweta ọnụahịa e chere nke ọma.", ctaLabel: "Zipu nkọwa" },
    learnContinue: { title: "Gaa n'ihu na kọsị gị", description: "Malitegharịa ihe ọmụmụ gị ebe ị kwụsịrị.", ctaLabel: "Maliteghachi kọsị" },
    propertyInspection: { title: "Rịọ nyocha ụlọ", description: "Hazie nleta ụlọ a na onye ọrụ mgbasa ozi ahụ.", ctaLabel: "Rịọ nleta" },
    propertySave: { title: "Chekwaa ụlọ a", description: "Debe ya na ndepụta gị ma tulee n'ọsọ nke gị.", ctaLabel: "Chekwaa ụlọ" },
    logisticsTrack: { title: "Soro ngwongwo gị", description: "Lee ọnọdụ ugbu a na ụzọ nnyefe gị.", ctaLabel: "Soro ngwongwo" },
    logisticsReturn: { title: "Debe nloghachi", description: "Hazie mbupu nloghachi na nzọụkwụ ole na ole.", ctaLabel: "Debe nloghachi" },
    stitchCareToJobs: { title: "Ịchọrọ enyemaka na-aga n'ihu? Lee ọrụ nlekọta", description: "Ndebe Care gị ezuola. Jobs na-edepụta ọrụ nlekọta ma ọ bụrụ na ịchọrọ nkwado na-aga n'ihu.", ctaLabel: "Lee ọrụ nlekọta" },
    stitchLearnToJobs: { title: "Lee ọrụ ndị na-akwanyere kọsị a ùgwù", description: "Kọsị gị ezuola. Ndị were ọrụ na Jobs na-edepụta ọrụ dabara na nkà ndị a.", ctaLabel: "Chọgharịa ọrụ" },
    stitchMarketplaceToLogistics: { title: "Ịchọrọ nnyefe?", description: "Iwu gị ezuola. Debe nnyefe na Logistics na nzọụkwụ ole na ole.", ctaLabel: "Debe nnyefe" },
  },
};

const YO: Partial<NextActionCopy> = {
  chip: { prefix: "Tẹ̀síwájú", dismiss: "Fori àbá yìí kọjá", region: "Ìgbésẹ̀ tó kàn tí a dábàá" },
  settings: { toggleLabel: "Àwọn àbá ìgbésẹ̀ tó kàn", toggleDescription: "Ó máa ń fi àbá kékeré “ṣe èyí lẹ́yìn náà” hàn lórí àwọn ojú-ìwé tó bá mu. Pípa rẹ̀ yóò fi gbogbo àbá pamọ́." },
  actions: {
    accountTrust: { title: "Parí ìmúdájú ìgbẹ́kẹ̀lé rẹ", description: "Àkántì tí a ti múdájú lè lo àwọn iṣẹ́ púpọ̀ síi.", ctaLabel: "Wo ipò ìgbẹ́kẹ̀lé" },
    accountProfile: { title: "Parí profaili rẹ", description: "Profaili pípé máa ń mú ìtìlẹ́yìn àti ìtẹ̀síwájú iṣẹ́ dára síi.", ctaLabel: "Parí profaili" },
    accountSavedJobs: { title: "Tẹ̀lé àwọn iṣẹ́ tí o fi pamọ́", description: "Ṣàyẹ̀wò àwọn iṣẹ́ tí o fi pamọ́ kí o sì bèèrè nígbà tí o bá ṣetán.", ctaLabel: "Ṣí àwọn iṣẹ́" },
    marketplaceSave: { title: "Fi pamọ́ fún ìgbà míì", description: "Pa ohun èlò yìí mọ́ sínú àkójọ rẹ láti fiwéra tàbí rà nígbà tí o bá ṣetán.", ctaLabel: "Fi ohun èlò pamọ́" },
    marketplaceCompare: { title: "Fiwéra pẹ̀lú àwọn ohun tó jọ ọ́", description: "Wo àwọn ìpolówó tó jọra lẹ́gbẹ̀ẹ́ ara kí o tó pinnu.", ctaLabel: "Fiwéra" },
    careBook: { title: "Ṣe ìforúkọ olùtọ́jú Care", description: "Yan iṣẹ́ kan kí o sì jẹ́rìí sí ìforúkọ rẹ ní àwọn ìgbésẹ̀ díẹ̀.", ctaLabel: "Bẹ̀rẹ̀ ìforúkọ" },
    jobsApply: { title: "Bèèrè fún ipò iṣẹ́ yìí", description: "Profaili rẹ ti ṣetán — fi ìbéèrè rẹ ránṣẹ́ láti ibí.", ctaLabel: "Bèèrè" },
    jobsSave: { title: "Fi ipò iṣẹ́ yìí pamọ́", description: "Pa á mọ́ sínú àwọn iṣẹ́ tí o fi pamọ́ kí o sì bèèrè nígbà tí profaili rẹ bá ṣetán.", ctaLabel: "Fi iṣẹ́ pamọ́" },
    studioQuote: { title: "Gba iye owó láàrin wákàtí 24", description: "Fi àlàyé kúkúrú ránṣẹ́ kí o sì gba iye owó tí a gbé yẹ̀wò dáadáa.", ctaLabel: "Fi àlàyé ránṣẹ́" },
    learnContinue: { title: "Tẹ̀síwájú nínú ẹ̀kọ́ rẹ", description: "Bẹ̀rẹ̀ àwọn ẹ̀kọ́ rẹ láti ibi tí o ti dúró.", ctaLabel: "Tún ẹ̀kọ́ bẹ̀rẹ̀" },
    propertyInspection: { title: "Bèèrè fún àyẹ̀wò ilé", description: "Ṣètò ìbẹ̀wò sí ohun-ìní yìí pẹ̀lú aṣojú ìpolówó náà.", ctaLabel: "Bèèrè ìbẹ̀wò" },
    propertySave: { title: "Fi ohun-ìní yìí pamọ́", description: "Pa á mọ́ sínú àkójọ rẹ kí o sì fiwéra ní ìwọ̀n ara rẹ.", ctaLabel: "Fi ohun-ìní pamọ́" },
    logisticsTrack: { title: "Tọpa ẹrù rẹ", description: "Wo ipò lọ́wọ́lọ́wọ́ àti ipa-ọ̀nà ìfijíṣẹ́ rẹ.", ctaLabel: "Tọpa ẹrù" },
    logisticsReturn: { title: "Ṣètò ìdápadà", description: "Ṣètò gbígbé ìdápadà ní àwọn ìgbésẹ̀ díẹ̀.", ctaLabel: "Ṣètò ìdápadà" },
    stitchCareToJobs: { title: "O nílò ìrànlọ́wọ́ tó tẹ̀síwájú? Wo àwọn iṣẹ́ olùtọ́jú", description: "Ìforúkọ Care rẹ ti parí. Jobs ń ṣe àkójọ àwọn iṣẹ́ olùtọ́jú bí o bá nílò àtìlẹ́yìn tó tẹ̀síwájú.", ctaLabel: "Wo àwọn iṣẹ́ olùtọ́jú" },
    stitchLearnToJobs: { title: "Wo àwọn iṣẹ́ tí wọ́n mọyì ẹ̀kọ́ yìí", description: "Ẹ̀kọ́ rẹ ti parí. Àwọn agbanisíṣẹ́ lórí Jobs ń ṣe àkójọ àwọn iṣẹ́ tó bá àwọn ọgbọ́n wọ̀nyí mu.", ctaLabel: "Ṣàwárí àwọn iṣẹ́" },
    stitchMarketplaceToLogistics: { title: "Ṣé o fẹ́ kí wọ́n fi jíṣẹ́?", description: "Ìbéèrè rẹ ti parí. Ṣètò ìfijíṣẹ́ pẹ̀lú Logistics ní àwọn ìgbésẹ̀ díẹ̀.", ctaLabel: "Ṣètò ìfijíṣẹ́" },
  },
};

const HA: Partial<NextActionCopy> = {
  chip: { prefix: "Ci gaba", dismiss: "Watsar da shawara", region: "Mataki na gaba da aka ba da shawara" },
  settings: { toggleLabel: "Shawarwarin mataki na gaba", toggleDescription: "Yana nuna ƙaramar shawara ta “yi wannan a gaba” a shafukan da suka dace. Kashe shi yana ɓoye duk shawarwari." },
  actions: {
    accountTrust: { title: "Kammala tabbatar da amincin ka", description: "Asusun da aka tabbatar zai iya amfani da ƙarin ayyuka.", ctaLabel: "Duba matsayin aminci" },
    accountProfile: { title: "Kammala bayananka", description: "Cikakken bayani yana inganta tallafi da ci gaban sabis.", ctaLabel: "Kammala bayani" },
    accountSavedJobs: { title: "Bibiyi ayyukan da ka ajiye", description: "Duba ayyukan da ka ajiye ka nema idan ka shirya.", ctaLabel: "Buɗe ayyuka" },
    marketplaceSave: { title: "Ajiye don gaba", description: "Riƙe wannan kaya a jerin ajiyarka don kwatantawa ko siya idan ka shirya.", ctaLabel: "Ajiye kaya" },
    marketplaceCompare: { title: "Kwatanta da kayayyaki masu kama", description: "Duba tallace-tallace masu kama gefe da gefe kafin ka yanke shawara.", ctaLabel: "Kwatanta" },
    careBook: { title: "Yi ajiyar mai ba da kulawa na Care", description: "Zaɓi sabis ka tabbatar da ajiyarka a matakai kaɗan.", ctaLabel: "Fara ajiya" },
    jobsApply: { title: "Nemi wannan aikin", description: "Bayananka a shirye suke — aika buƙatarka daga nan.", ctaLabel: "Nema" },
    jobsSave: { title: "Ajiye wannan aikin", description: "Riƙe shi a ayyukan da ka ajiye ka nema idan bayananka sun shirya.", ctaLabel: "Ajiye aiki" },
    studioQuote: { title: "Samu farashi cikin awa 24", description: "Aika taƙaitaccen bayani ka karɓi farashi da aka yi la'akari da shi.", ctaLabel: "Aika bayani" },
    learnContinue: { title: "Ci gaba da kwas ɗinka", description: "Ci gaba da darussanka daga inda ka tsaya.", ctaLabel: "Ci gaba da kwas" },
    propertyInspection: { title: "Nemi duba gida", description: "Shirya ziyarar wannan gidan tare da wakilin tallan.", ctaLabel: "Nemi ziyara" },
    propertySave: { title: "Ajiye wannan gidan", description: "Riƙe shi a jerinka ka kwatanta a hankalinka.", ctaLabel: "Ajiye gida" },
    logisticsTrack: { title: "Bibiyi kayanka", description: "Duba matsayin yanzu da hanyar isar da kayanka.", ctaLabel: "Bibiyi kaya" },
    logisticsReturn: { title: "Shirya mayarwa", description: "Shirya ɗaukar mayarwa a matakai kaɗan.", ctaLabel: "Shirya mayarwa" },
    stitchCareToJobs: { title: "Kana buƙatar taimako mai dorewa? Duba ayyukan kulawa", description: "Ajiyar Care ɗinka ta kammala. Jobs yana lissafa ayyukan kulawa idan kana buƙatar tallafi mai dorewa.", ctaLabel: "Duba ayyukan kulawa" },
    stitchLearnToJobs: { title: "Duba ayyukan da suke daraja wannan kwas", description: "Kwas ɗinka ya kammala. Masu ɗaukar ma'aikata a Jobs suna lissafa ayyukan da suka dace da waɗannan ƙwarewa.", ctaLabel: "Bincika ayyuka" },
    stitchMarketplaceToLogistics: { title: "Kana buƙatar isar da shi?", description: "Odarka ta kammala. Shirya isar da kaya tare da Logistics a matakai kaɗan.", ctaLabel: "Shirya isarwa" },
  },
};

const ZH: Partial<NextActionCopy> = {
  chip: { prefix: "继续", dismiss: "忽略建议", region: "建议的下一步" },
  settings: { toggleLabel: "下一步建议", toggleDescription: "在相关页面上显示一条小的“接下来做这个”建议。关闭后将隐藏所有建议。" },
  actions: {
    accountTrust: { title: "完成信任验证", description: "通过验证的账户可以使用更多服务。", ctaLabel: "查看信任状态" },
    accountProfile: { title: "完善你的资料", description: "完整的资料有助于获得更好的支持和服务连续性。", ctaLabel: "完善资料" },
    accountSavedJobs: { title: "跟进已保存的职位", description: "查看你保存的职位，准备好后再申请。", ctaLabel: "打开职位" },
    marketplaceSave: { title: "先保存起来", description: "把这件商品放进你的收藏，方便比较或在准备好时购买。", ctaLabel: "保存商品" },
    marketplaceCompare: { title: "与相似商品比较", description: "在决定之前，并排查看相似的商品。", ctaLabel: "比较" },
    careBook: { title: "预约 Care 服务人员", description: "选择服务，几步内确认你的预约。", ctaLabel: "开始预约" },
    jobsApply: { title: "申请这个职位", description: "你的资料已就绪——从这里提交申请。", ctaLabel: "申请" },
    jobsSave: { title: "保存这个职位", description: "把它放进已保存职位，等资料就绪后再申请。", ctaLabel: "保存职位" },
    studioQuote: { title: "24 小时内获取报价", description: "提交一份简短的需求说明，获得经过斟酌的报价。", ctaLabel: "提交需求" },
    learnContinue: { title: "继续你的课程", description: "从上次停下的地方继续学习。", ctaLabel: "继续课程" },
    propertyInspection: { title: "预约看房", description: "与挂牌经纪人安排一次看房。", ctaLabel: "预约看房" },
    propertySave: { title: "保存这套房源", description: "把它放进你的收藏，按自己的节奏比较。", ctaLabel: "保存房源" },
    logisticsTrack: { title: "跟踪你的包裹", description: "查看配送的当前状态和路线。", ctaLabel: "跟踪包裹" },
    logisticsReturn: { title: "预约退货", description: "几步内安排退货取件。", ctaLabel: "预约退货" },
    stitchCareToJobs: { title: "需要长期帮助？看看护理职位", description: "你的 Care 预约已完成。如需持续支持，Jobs 上有护理类职位。", ctaLabel: "查看护理职位" },
    stitchLearnToJobs: { title: "看看认可这门课程的职位", description: "你的课程已完成。Jobs 上的雇主发布了与这些技能匹配的职位。", ctaLabel: "探索职位" },
    stitchMarketplaceToLogistics: { title: "需要配送吗？", description: "你的订单已完成。几步内通过 Logistics 预约配送。", ctaLabel: "预约配送" },
  },
};

const HI: Partial<NextActionCopy> = {
  chip: { prefix: "जारी रखें", dismiss: "सुझाव हटाएँ", region: "सुझाया गया अगला कदम" },
  settings: { toggleLabel: "अगले कदम के सुझाव", toggleDescription: "प्रासंगिक पृष्ठों पर एक छोटा “अब यह करें” सुझाव दिखाता है। बंद करने पर सभी सुझाव छिप जाते हैं।" },
  actions: {
    accountTrust: { title: "अपना विश्वास सत्यापन पूरा करें", description: "सत्यापित खाता अधिक सेवाओं का उपयोग कर सकता है।", ctaLabel: "विश्वास स्थिति देखें" },
    accountProfile: { title: "अपनी प्रोफ़ाइल पूरी करें", description: "पूरी प्रोफ़ाइल सहायता और सेवा की निरंतरता बेहतर बनाती है।", ctaLabel: "प्रोफ़ाइल पूरी करें" },
    accountSavedJobs: { title: "सहेजी गई भूमिकाओं पर आगे बढ़ें", description: "सहेजी गई भूमिकाएँ देखें और तैयार होने पर आवेदन करें।", ctaLabel: "भूमिकाएँ खोलें" },
    marketplaceSave: { title: "बाद के लिए सहेजें", description: "इस वस्तु को अपनी सूची में रखें ताकि तुलना कर सकें या तैयार होने पर खरीद सकें।", ctaLabel: "वस्तु सहेजें" },
    marketplaceCompare: { title: "समान वस्तुओं से तुलना करें", description: "निर्णय लेने से पहले समान लिस्टिंग साथ-साथ देखें।", ctaLabel: "तुलना करें" },
    careBook: { title: "Care सेवा प्रदाता बुक करें", description: "सेवा चुनें और कुछ चरणों में अपनी बुकिंग की पुष्टि करें।", ctaLabel: "बुकिंग शुरू करें" },
    jobsApply: { title: "इस भूमिका के लिए आवेदन करें", description: "आपकी प्रोफ़ाइल तैयार है — यहीं से आवेदन भेजें।", ctaLabel: "आवेदन करें" },
    jobsSave: { title: "यह भूमिका सहेजें", description: "इसे सहेजी गई भूमिकाओं में रखें और प्रोफ़ाइल तैयार होने पर आवेदन करें।", ctaLabel: "भूमिका सहेजें" },
    studioQuote: { title: "24 घंटे के भीतर कोटेशन पाएँ", description: "एक छोटा ब्रीफ़ भेजें और सोच-समझकर बनाया गया कोटेशन पाएँ।", ctaLabel: "ब्रीफ़ भेजें" },
    learnContinue: { title: "अपना कोर्स जारी रखें", description: "जहाँ छोड़ा था वहीं से पाठ फिर शुरू करें।", ctaLabel: "कोर्स फिर शुरू करें" },
    propertyInspection: { title: "निरीक्षण का अनुरोध करें", description: "लिस्टिंग एजेंट के साथ इस संपत्ति को देखने की व्यवस्था करें।", ctaLabel: "विज़िट का अनुरोध करें" },
    propertySave: { title: "यह संपत्ति सहेजें", description: "इसे अपनी सूची में रखें और अपनी गति से तुलना करें।", ctaLabel: "संपत्ति सहेजें" },
    logisticsTrack: { title: "अपनी खेप ट्रैक करें", description: "अपनी डिलीवरी की वर्तमान स्थिति और मार्ग देखें।", ctaLabel: "खेप ट्रैक करें" },
    logisticsReturn: { title: "वापसी बुक करें", description: "कुछ चरणों में वापसी पिकअप की व्यवस्था करें।", ctaLabel: "वापसी बुक करें" },
    stitchCareToJobs: { title: "निरंतर मदद चाहिए? देखभाल की भूमिकाएँ देखें", description: "आपकी Care बुकिंग पूरी हो गई है। निरंतर सहयोग चाहिए तो Jobs पर देखभाल की भूमिकाएँ सूचीबद्ध हैं।", ctaLabel: "देखभाल की भूमिकाएँ देखें" },
    stitchLearnToJobs: { title: "इस कोर्स को महत्व देने वाली भूमिकाएँ देखें", description: "आपका कोर्स पूरा हो गया है। Jobs पर नियोक्ता इन कौशलों से मेल खाती भूमिकाएँ सूचीबद्ध करते हैं।", ctaLabel: "भूमिकाएँ देखें" },
    stitchMarketplaceToLogistics: { title: "डिलीवरी चाहिए?", description: "आपका ऑर्डर पूरा हो गया है। कुछ चरणों में Logistics के साथ डिलीवरी बुक करें।", ctaLabel: "डिलीवरी बुक करें" },
  },
};

const LOCALE_COPY: Partial<Record<AppLocale, Partial<NextActionCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  de: DE,
  it: IT,
  ar: AR,
  ig: IG,
  yo: YO,
  ha: HA,
  zh: ZH,
  hi: HI,
};

export function getNextActionCopy(locale: AppLocale): NextActionCopy {
  const overrides = LOCALE_COPY[locale];
  if (overrides) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as NextActionCopy;
  }
  return EN;
}
