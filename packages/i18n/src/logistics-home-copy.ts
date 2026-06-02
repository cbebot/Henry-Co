import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * LogisticsHomeCopy — i18n surface for the customer-facing home page on
 * the Logistics division. Covers metadata, the hero (eyebrow, title,
 * blurb, three CTAs), the four capability metrics (with their dynamic
 * trend phrases), the trust/credibility list, the "Why teams switch"
 * section, the operating-lanes section, the four-step flow, the
 * "HenryCo posture" spotlight, the FAQ section, the FAQ entries
 * themselves, and the support callout buttons.
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each locale is
 * a Partial that deep-merges over EN so missing keys fall back silently.
 * Mirrors the shape of `logistics-business-copy.ts`.
 */
export type LogisticsHomeCopy = {
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    blurb: string;
    bookCta: string;
    quoteCta: string;
    trackCta: string;
  };
  coverage: {
    none: string;
    one: string;
    two: string;
    many: string;
    twoJoiner: string;
    manyTail: string;
  };
  metrics: {
    activeLanesLabel: string;
    activeLanesAwaiting: string;
    activeLanesAcrossOne: string;
    activeLanesAcrossMany: string;
    activeLanesNamedToday: string;
    activeLanesZoneSingular: string;
    activeLanesZonePlural: string;
    serviceTiersLabel: string;
    serviceTiersTrend: string;
    fastestWindowLabel: string;
    fastestWindowDash: string;
    fastestWindowTrendGoverned: string;
    fastestWindowTrendAwaiting: string;
    operatingHoursLabel: string;
    operatingHoursDailyFallback: string;
  };
  why: {
    kicker: string;
    title: string;
    body: string;
    audienceTitle: string;
    audienceBody: string;
    trackingTitle: string;
    proofTitle: string;
    proofBody: string;
  };
  lanes: {
    kicker: string;
    title: string;
    metaTiersLabel: string;
  };
  flow: {
    kicker: string;
    title: string;
    stepLabel: string;
    step01Title: string;
    step01Body: string;
    step02Title: string;
    step02Body: string;
    step03Title: string;
    step03Body: string;
    step04Title: string;
    step04Body: string;
  };
  spotlight: {
    eyebrow: string;
    title: string;
    body: string;
    honestEtaTitle: string;
    honestEtaBody: string;
    proofTitle: string;
    proofBody: string;
    accountTitle: string;
    accountBody: string;
  };
  faq: {
    kicker: string;
    title: string;
    metaContactPrefix: string;
    body: string;
    emailPrefix: string;
    accountCta: string;
  };
  faqItems: {
    quoteQ: string;
    quoteA: string;
    trackingQ: string;
    trackingA: string;
    riderIssueQ: string;
    riderIssueA: string;
    repeatRoutesQ: string;
    repeatRoutesA: string;
  };
};

const LOGISTICS_HOME_COPY_EN: LogisticsHomeCopy = {
  metadata: {
    title: "Henry Onyx Logistics — calm last-mile, visible end to end",
    description:
      "Honest ETAs, governed pricing, and proof-of-delivery on every shipment. Book, quote, or track a Henry Onyx Logistics delivery.",
  },
  hero: {
    eyebrow: "Pickup · Dispatch · Proof",
    title: "Calm last-mile, visible end to end.",
    blurb:
      "Built for people and businesses that need honest ETAs, clean handoffs, and a customer experience that stays premium when operations get noisy.",
    bookCta: "Book a delivery",
    quoteCta: "Request a quote",
    trackCta: "Track a shipment",
  },
  coverage: {
    none: "",
    one: "Live in {zone}",
    two: "Live in {first} and {second}",
    many: "Live in {head}, and {tail}",
    twoJoiner: " and ",
    manyTail: ", and ",
  },
  metrics: {
    activeLanesLabel: "Active lanes",
    activeLanesAwaiting: "Awaiting first lane",
    activeLanesAcrossOne: "Across {count} zone",
    activeLanesAcrossMany: "Across {count} zones",
    activeLanesNamedToday: "{count} named today",
    activeLanesZoneSingular: "zone",
    activeLanesZonePlural: "zones",
    serviceTiersLabel: "Service tiers",
    serviceTiersTrend: "Same-day, scheduled, dispatch, inter-city",
    fastestWindowLabel: "Fastest window",
    fastestWindowDash: "—",
    fastestWindowTrendGoverned: "Governed by lane confidence",
    fastestWindowTrendAwaiting: "Awaiting zone activation",
    operatingHoursLabel: "Operating hours",
    operatingHoursDailyFallback: "Daily",
  },
  why: {
    kicker: "Why teams switch",
    title: "One operating model. Honest by design.",
    body:
      "Governed rate cards, immutable milestones, and one shared account remove the operational debt that quietly erodes premium experiences. Same dispatcher logic for same-day, scheduled, dispatch, and inter-city — same calm proof trail.",
    audienceTitle: "Who it is for",
    audienceBody:
      "Retail replenishment, founder-led brands, professional services, and HenryCo divisions that need predictable pickup and delivery at scale.",
    trackingTitle: "How tracking works",
    proofTitle: "Proof and accountability",
    proofBody:
      "Milestones write to an immutable event log. Proof-of-delivery is part of the product, not an afterthought.",
  },
  lanes: {
    kicker: "Operating lanes",
    title: "Four lane shapes. One promise discipline.",
    metaTiersLabel: "{count} tiers · governed pricing",
  },
  flow: {
    kicker: "From request to doorstep",
    title: "Every step is visible, every milestone is timestamped.",
    stepLabel: "Step",
    step01Title: "Submit a quote or booking",
    step01Body:
      "Two addresses, a parcel profile, and a service tier. Governed pricing returns inline before you commit.",
    step02Title: "Dispatch assigns the lane",
    step02Body:
      "Routing assigns within the operating window; pickup milestone writes live to your timeline.",
    step03Title: "Live milestones, both sides",
    step03Body:
      "Sender and recipient see the same events. Updates land via your HenryCo account thread.",
    step04Title: "Proof of delivery, captured",
    step04Body:
      "Recipient name, time, and capture method save to the shipment record — visible on the track page.",
  },
  spotlight: {
    eyebrow: "The HenryCo posture",
    title:
      "Operations stay calm because the platform makes it cheaper to do the right thing.",
    body:
      "Governed rate cards, immutable milestones, and one shared account remove the operational debt that quietly erodes premium experiences.",
    honestEtaTitle: "Honest ETAs",
    honestEtaBody:
      "Promise windows come from real lane data, not optimistic guesses. Slippage gets logged and explained.",
    proofTitle: "Proof, not promises",
    proofBody:
      "Every handoff writes to an immutable event log. Proof-of-delivery is a product feature, not a ticket attachment.",
    accountTitle: "One account, one bill",
    accountBody:
      "Customers reuse the HenryCo account they already trust. Operators reconcile in one place across every division.",
  },
  faq: {
    kicker: "Questions before you book",
    title: "The honest answers, before the order.",
    metaContactPrefix: "Contact {brand}",
    body:
      "If a lane, parcel profile, or contract pricing falls outside the FAQ, the business desk picks it up. Quotes that need a human are not a different product — they live on the same shipment record once they convert.",
    emailPrefix: "Email {brand}",
    accountCta: "Open account hub",
  },
  faqItems: {
    quoteQ: "Can customers request a quote before booking?",
    quoteA:
      "Yes. Quotes and bookings share the same shipment builder. Quote mode saves the shipment intent, calculates pricing, and stops before payment.",
    trackingQ: "How is tracking secured?",
    trackingA:
      "Public tracking uses the tracking code plus the sender or recipient phone number. Signed-in customers also see any shipment linked to their user id or normalized email.",
    riderIssueQ: "What happens when a rider hits an issue?",
    riderIssueA:
      "Riders can raise structured issues directly from their workflow. Dispatch and support receive the escalation, and every resolution step is logged back onto the shipment timeline.",
    repeatRoutesQ: "Does the platform support business repeat routes?",
    repeatRoutesA:
      "Yes. The data model and booking flow are built to support repeat addresses, recurring business routing, and future batch submissions.",
  },
};

const LOGISTICS_HOME_COPY_FR: DeepPartial<LogisticsHomeCopy> = {
  metadata: {
    title: "Henry Onyx Logistics — un dernier kilomètre serein, visible de bout en bout",
    description:
      "Des ETA honnêtes, une tarification encadrée et une preuve de livraison sur chaque envoi. Réservez, demandez un devis ou suivez une livraison Henry Onyx Logistics.",
  },
  hero: {
    eyebrow: "Enlèvement · Distribution · Preuve",
    title: "Un dernier kilomètre serein, visible de bout en bout.",
    blurb:
      "Conçu pour les particuliers et les entreprises qui exigent des ETA honnêtes, des transferts propres et une expérience client premium même quand l’exploitation devient bruyante.",
    bookCta: "Réserver une livraison",
    quoteCta: "Demander un devis",
    trackCta: "Suivre un envoi",
  },
  coverage: {
    one: "En service à {zone}",
    two: "En service à {first} et {second}",
    many: "En service à {head} et {tail}",
    twoJoiner: " et ",
    manyTail: " et ",
  },
  metrics: {
    activeLanesLabel: "Lignes actives",
    activeLanesAwaiting: "En attente de la première ligne",
    activeLanesAcrossOne: "Sur {count} zone",
    activeLanesAcrossMany: "Sur {count} zones",
    activeLanesNamedToday: "{count} nommées aujourd’hui",
    activeLanesZoneSingular: "zone",
    activeLanesZonePlural: "zones",
    serviceTiersLabel: "Niveaux de service",
    serviceTiersTrend: "Le jour même, programmé, dispatch, inter-villes",
    fastestWindowLabel: "Fenêtre la plus rapide",
    fastestWindowDash: "—",
    fastestWindowTrendGoverned: "Gouvernée par la confiance de la ligne",
    fastestWindowTrendAwaiting: "En attente d’activation de zone",
    operatingHoursLabel: "Horaires d’exploitation",
    operatingHoursDailyFallback: "Quotidien",
  },
  why: {
    kicker: "Pourquoi les équipes changent",
    title: "Un seul modèle d’exploitation. Honnête par conception.",
    body:
      "Des grilles tarifaires encadrées, des jalons immuables et un compte partagé suppriment la dette opérationnelle qui érode discrètement les expériences premium. Même logique de dispatch pour le jour même, le programmé, le dispatch et l’inter-villes — la même piste de preuve sereine.",
    audienceTitle: "À qui c’est destiné",
    audienceBody:
      "Réassort en boutique, marques fondées par leurs créateurs, services professionnels et divisions HenryCo qui ont besoin d’enlèvement et de livraison prévisibles à grande échelle.",
    trackingTitle: "Comment fonctionne le suivi",
    proofTitle: "Preuve et responsabilité",
    proofBody:
      "Les jalons s’écrivent dans un journal d’événements immuable. La preuve de livraison fait partie du produit, pas un ajout.",
  },
  lanes: {
    kicker: "Lignes d’exploitation",
    title: "Quatre formes de lignes. Une seule discipline de promesse.",
    metaTiersLabel: "{count} niveaux · tarification encadrée",
  },
  flow: {
    kicker: "De la demande à la porte",
    title: "Chaque étape est visible, chaque jalon est horodaté.",
    stepLabel: "Étape",
    step01Title: "Soumettre un devis ou une réservation",
    step01Body:
      "Deux adresses, un profil colis et un niveau de service. La tarification encadrée s’affiche avant que vous validiez.",
    step02Title: "Le dispatch attribue la ligne",
    step02Body:
      "L’acheminement est attribué dans la fenêtre d’exploitation ; le jalon d’enlèvement s’écrit en direct sur votre fil.",
    step03Title: "Jalons en direct, des deux côtés",
    step03Body:
      "Expéditeur et destinataire voient les mêmes événements. Les mises à jour arrivent via votre fil de compte HenryCo.",
    step04Title: "Preuve de livraison, capturée",
    step04Body:
      "Le nom du destinataire, l’heure et la méthode de capture s’enregistrent dans l’envoi — visibles sur la page de suivi.",
  },
  spotlight: {
    eyebrow: "La posture HenryCo",
    title:
      "L’exploitation reste sereine parce que la plateforme rend moins coûteux de bien faire les choses.",
    body:
      "Des grilles tarifaires encadrées, des jalons immuables et un compte partagé suppriment la dette opérationnelle qui érode discrètement les expériences premium.",
    honestEtaTitle: "ETA honnêtes",
    honestEtaBody:
      "Les fenêtres de promesse proviennent de vraies données de ligne, pas d’estimations optimistes. Les retards sont consignés et expliqués.",
    proofTitle: "Preuves, pas promesses",
    proofBody:
      "Chaque transfert s’écrit dans un journal d’événements immuable. La preuve de livraison est une fonctionnalité produit, pas une pièce jointe à un ticket.",
    accountTitle: "Un seul compte, une seule facture",
    accountBody:
      "Les clients réutilisent le compte HenryCo qu’ils connaissent. Les opérateurs réconcilient à un seul endroit sur l’ensemble des divisions.",
  },
  faq: {
    kicker: "Questions avant de réserver",
    title: "Les réponses honnêtes, avant la commande.",
    metaContactPrefix: "Contacter {brand}",
    body:
      "Si une ligne, un profil colis ou une tarification contractuelle dépasse la FAQ, le bureau pro prend le relais. Les devis qui nécessitent un humain ne sont pas un produit distinct — ils vivent sur le même envoi une fois convertis.",
    emailPrefix: "Écrire à {brand}",
    accountCta: "Ouvrir le hub du compte",
  },
  faqItems: {
    quoteQ: "Les clients peuvent-ils demander un devis avant de réserver ?",
    quoteA:
      "Oui. Devis et réservations partagent le même constructeur d’envoi. Le mode devis enregistre l’intention, calcule le prix et s’arrête avant le paiement.",
    trackingQ: "Comment le suivi est-il sécurisé ?",
    trackingA:
      "Le suivi public utilise le code de suivi plus le numéro de téléphone de l’expéditeur ou du destinataire. Les clients connectés voient aussi tout envoi lié à leur identifiant ou à leur e-mail normalisé.",
    riderIssueQ: "Que se passe-t-il quand un coursier rencontre un problème ?",
    riderIssueA:
      "Les coursiers peuvent signaler des incidents structurés directement depuis leur flux. Le dispatch et le support reçoivent l’escalade et chaque étape de résolution est journalisée sur la chronologie de l’envoi.",
    repeatRoutesQ: "La plateforme prend-elle en charge les routes professionnelles récurrentes ?",
    repeatRoutesA:
      "Oui. Le modèle de données et le flux de réservation sont conçus pour les adresses répétées, l’acheminement récurrent et les soumissions en lot à venir.",
  },
};

const LOGISTICS_HOME_COPY_ES: DeepPartial<LogisticsHomeCopy> = {
  metadata: {
    title: "Henry Onyx Logistics — última milla serena, visible de extremo a extremo",
    description:
      "ETAs honestos, precios gobernados y prueba de entrega en cada envío. Reserva, cotiza o rastrea una entrega de Henry Onyx Logistics.",
  },
  hero: {
    eyebrow: "Recogida · Despacho · Prueba",
    title: "Última milla serena, visible de extremo a extremo.",
    blurb:
      "Construido para personas y empresas que necesitan ETAs honestos, entregas limpias y una experiencia premium incluso cuando la operación se vuelve ruidosa.",
    bookCta: "Reservar una entrega",
    quoteCta: "Solicitar una cotización",
    trackCta: "Rastrear un envío",
  },
  coverage: {
    one: "En servicio en {zone}",
    two: "En servicio en {first} y {second}",
    many: "En servicio en {head} y {tail}",
    twoJoiner: " y ",
    manyTail: " y ",
  },
  metrics: {
    activeLanesLabel: "Rutas activas",
    activeLanesAwaiting: "Esperando la primera ruta",
    activeLanesAcrossOne: "En {count} zona",
    activeLanesAcrossMany: "En {count} zonas",
    activeLanesNamedToday: "{count} nombradas hoy",
    activeLanesZoneSingular: "zona",
    activeLanesZonePlural: "zonas",
    serviceTiersLabel: "Niveles de servicio",
    serviceTiersTrend: "Mismo día, programado, despacho, interurbano",
    fastestWindowLabel: "Ventana más rápida",
    fastestWindowDash: "—",
    fastestWindowTrendGoverned: "Gobernada por la confianza de la ruta",
    fastestWindowTrendAwaiting: "Esperando activación de zona",
    operatingHoursLabel: "Horario de operación",
    operatingHoursDailyFallback: "Diario",
  },
  why: {
    kicker: "Por qué cambian los equipos",
    title: "Un solo modelo operativo. Honesto por diseño.",
    body:
      "Tarifas gobernadas, hitos inmutables y una cuenta compartida eliminan la deuda operativa que erosiona en silencio las experiencias premium. La misma lógica de despacho para mismo día, programado, despacho e interurbano — el mismo rastro tranquilo de pruebas.",
    audienceTitle: "Para quién es",
    audienceBody:
      "Reposición minorista, marcas lideradas por fundadores, servicios profesionales y divisiones HenryCo que necesitan recogida y entrega predecibles a escala.",
    trackingTitle: "Cómo funciona el rastreo",
    proofTitle: "Prueba y responsabilidad",
    proofBody:
      "Los hitos se escriben en un registro inmutable. La prueba de entrega es parte del producto, no algo añadido.",
  },
  lanes: {
    kicker: "Rutas operativas",
    title: "Cuatro formas de ruta. Una sola disciplina de promesa.",
    metaTiersLabel: "{count} niveles · precios gobernados",
  },
  flow: {
    kicker: "De la solicitud a la puerta",
    title: "Cada paso es visible, cada hito tiene marca de tiempo.",
    stepLabel: "Paso",
    step01Title: "Enviar cotización o reserva",
    step01Body:
      "Dos direcciones, un perfil de paquete y un nivel de servicio. El precio gobernado aparece antes de confirmar.",
    step02Title: "Despacho asigna la ruta",
    step02Body:
      "El enrutamiento se asigna dentro de la ventana de operación; el hito de recogida se escribe en vivo en tu línea.",
    step03Title: "Hitos en vivo, ambos lados",
    step03Body:
      "Remitente y destinatario ven los mismos eventos. Las actualizaciones llegan por el hilo de tu cuenta HenryCo.",
    step04Title: "Prueba de entrega, capturada",
    step04Body:
      "El nombre del destinatario, la hora y el método de captura se guardan en el envío — visibles en la página de rastreo.",
  },
  spotlight: {
    eyebrow: "La postura HenryCo",
    title:
      "La operación se mantiene serena porque la plataforma hace más barato hacer lo correcto.",
    body:
      "Tarifas gobernadas, hitos inmutables y una cuenta compartida eliminan la deuda operativa que erosiona en silencio las experiencias premium.",
    honestEtaTitle: "ETAs honestos",
    honestEtaBody:
      "Las ventanas de promesa vienen de datos reales de ruta, no de suposiciones optimistas. Los retrasos se registran y se explican.",
    proofTitle: "Pruebas, no promesas",
    proofBody:
      "Cada entrega se escribe en un registro inmutable. La prueba de entrega es una función del producto, no un adjunto de ticket.",
    accountTitle: "Una cuenta, una factura",
    accountBody:
      "Los clientes reutilizan la cuenta HenryCo que ya conocen. Los operadores concilian en un solo lugar para todas las divisiones.",
  },
  faq: {
    kicker: "Preguntas antes de reservar",
    title: "Las respuestas honestas, antes del pedido.",
    metaContactPrefix: "Contactar {brand}",
    body:
      "Si una ruta, perfil de paquete o precio contractual queda fuera de la FAQ, el equipo de negocios lo atiende. Las cotizaciones que requieren humano no son un producto distinto — viven en el mismo envío una vez convertidas.",
    emailPrefix: "Escribir a {brand}",
    accountCta: "Abrir el panel de cuenta",
  },
  faqItems: {
    quoteQ: "¿Pueden los clientes pedir cotización antes de reservar?",
    quoteA:
      "Sí. Cotizaciones y reservas comparten el mismo constructor. El modo cotización guarda la intención, calcula el precio y se detiene antes del pago.",
    trackingQ: "¿Cómo se asegura el rastreo?",
    trackingA:
      "El rastreo público usa el código más el teléfono del remitente o destinatario. Los clientes con sesión también ven envíos ligados a su id o correo normalizado.",
    riderIssueQ: "¿Qué ocurre cuando un repartidor tiene un problema?",
    riderIssueA:
      "Los repartidores pueden levantar incidencias estructuradas desde su flujo. Despacho y soporte reciben la escalada y cada paso de resolución queda en la línea del envío.",
    repeatRoutesQ: "¿La plataforma soporta rutas de negocio recurrentes?",
    repeatRoutesA:
      "Sí. El modelo de datos y el flujo de reserva están hechos para direcciones repetidas, rutas recurrentes y envíos en lote futuros.",
  },
};

const LOGISTICS_HOME_COPY_PT: DeepPartial<LogisticsHomeCopy> = {
  metadata: {
    title: "Henry Onyx Logistics — última milha serena, visível de ponta a ponta",
    description:
      "ETAs honestos, preços governados e comprovação de entrega em cada envio. Reserve, cote ou rastreie uma entrega Henry Onyx Logistics.",
  },
  hero: {
    eyebrow: "Coleta · Despacho · Prova",
    title: "Última milha serena, visível de ponta a ponta.",
    blurb:
      "Feito para pessoas e empresas que precisam de ETAs honestos, entregas limpas e uma experiência premium mesmo quando a operação fica barulhenta.",
    bookCta: "Reservar uma entrega",
    quoteCta: "Solicitar uma cotação",
    trackCta: "Rastrear um envio",
  },
  coverage: {
    one: "Operando em {zone}",
    two: "Operando em {first} e {second}",
    many: "Operando em {head} e {tail}",
    twoJoiner: " e ",
    manyTail: " e ",
  },
  metrics: {
    activeLanesLabel: "Rotas ativas",
    activeLanesAwaiting: "Aguardando a primeira rota",
    activeLanesAcrossOne: "Em {count} zona",
    activeLanesAcrossMany: "Em {count} zonas",
    activeLanesNamedToday: "{count} nomeadas hoje",
    activeLanesZoneSingular: "zona",
    activeLanesZonePlural: "zonas",
    serviceTiersLabel: "Níveis de serviço",
    serviceTiersTrend: "Mesmo dia, agendado, despacho, intermunicipal",
    fastestWindowLabel: "Janela mais rápida",
    fastestWindowDash: "—",
    fastestWindowTrendGoverned: "Governada pela confiança da rota",
    fastestWindowTrendAwaiting: "Aguardando ativação de zona",
    operatingHoursLabel: "Horário de operação",
    operatingHoursDailyFallback: "Diário",
  },
  why: {
    kicker: "Por que as equipes mudam",
    title: "Um único modelo operacional. Honesto por design.",
    body:
      "Tabelas de preço governadas, marcos imutáveis e uma conta compartilhada removem a dívida operacional que silenciosamente corrói experiências premium. Mesma lógica de despacho para mesmo dia, agendado, despacho e intermunicipal — o mesmo rastro tranquilo de provas.",
    audienceTitle: "Para quem é",
    audienceBody:
      "Reposição de varejo, marcas lideradas pelo fundador, serviços profissionais e divisões HenryCo que precisam de coleta e entrega previsíveis em escala.",
    trackingTitle: "Como funciona o rastreio",
    proofTitle: "Prova e responsabilidade",
    proofBody:
      "Os marcos são gravados em um log imutável. A prova de entrega faz parte do produto, não é um anexo.",
  },
  lanes: {
    kicker: "Rotas operacionais",
    title: "Quatro formatos de rota. Uma só disciplina de promessa.",
    metaTiersLabel: "{count} níveis · preços governados",
  },
  flow: {
    kicker: "Da solicitação à porta",
    title: "Cada passo é visível, cada marco é registrado.",
    stepLabel: "Passo",
    step01Title: "Enviar cotação ou reserva",
    step01Body:
      "Dois endereços, um perfil de pacote e um nível de serviço. O preço governado aparece antes de você confirmar.",
    step02Title: "O despacho atribui a rota",
    step02Body:
      "O roteamento é atribuído dentro da janela de operação; o marco de coleta é gravado ao vivo na sua linha.",
    step03Title: "Marcos ao vivo, dos dois lados",
    step03Body:
      "Remetente e destinatário veem os mesmos eventos. As atualizações chegam pelo seu tópico de conta HenryCo.",
    step04Title: "Prova de entrega, capturada",
    step04Body:
      "Nome do destinatário, hora e método de captura ficam no registro — visíveis na página de rastreio.",
  },
  spotlight: {
    eyebrow: "A postura HenryCo",
    title:
      "A operação permanece calma porque a plataforma torna mais barato fazer o certo.",
    body:
      "Tabelas governadas, marcos imutáveis e uma conta compartilhada removem a dívida operacional que silenciosamente corrói experiências premium.",
    honestEtaTitle: "ETAs honestos",
    honestEtaBody:
      "As janelas de promessa vêm de dados reais de rota, não de palpites otimistas. Atrasos são registrados e explicados.",
    proofTitle: "Provas, não promessas",
    proofBody:
      "Cada handoff é gravado em um log imutável. A prova de entrega é uma funcionalidade do produto, não anexo de chamado.",
    accountTitle: "Uma conta, uma fatura",
    accountBody:
      "Os clientes reusam a conta HenryCo em que já confiam. Operadores conciliam em um lugar só, em todas as divisões.",
  },
  faq: {
    kicker: "Perguntas antes de reservar",
    title: "As respostas honestas, antes do pedido.",
    metaContactPrefix: "Contatar {brand}",
    body:
      "Se uma rota, perfil de pacote ou preço contratual sair da FAQ, o time comercial assume. Cotações que precisam de um humano não são um produto separado — vivem no mesmo envio quando convertem.",
    emailPrefix: "Escrever para {brand}",
    accountCta: "Abrir o hub da conta",
  },
  faqItems: {
    quoteQ: "Os clientes podem solicitar uma cotação antes de reservar?",
    quoteA:
      "Sim. Cotações e reservas compartilham o mesmo construtor. O modo cotação salva a intenção, calcula o preço e para antes do pagamento.",
    trackingQ: "Como o rastreio é protegido?",
    trackingA:
      "O rastreio público usa o código mais o telefone do remetente ou destinatário. Clientes logados também veem envios ligados ao id ou e-mail normalizado.",
    riderIssueQ: "O que acontece quando um entregador encontra um problema?",
    riderIssueA:
      "Os entregadores podem registrar incidentes estruturados direto do fluxo. Despacho e suporte recebem a escalada e cada passo de resolução é logado na linha do envio.",
    repeatRoutesQ: "A plataforma suporta rotas comerciais recorrentes?",
    repeatRoutesA:
      "Sim. O modelo de dados e o fluxo de reserva são feitos para endereços repetidos, roteamento recorrente e envios em lote futuros.",
  },
};

const LOGISTICS_HOME_COPY_AR: DeepPartial<LogisticsHomeCopy> = {
  metadata: {
    title: "Henry Onyx Logistics — ميل أخير هادئ، مرئي من البداية حتى النهاية",
    description:
      "أوقات وصول صادقة، وتسعير محوكَم، وإثبات تسليم لكل شحنة. احجز أو اطلب عرضًا أو تتبّع شحنة Henry Onyx Logistics.",
  },
  hero: {
    eyebrow: "استلام · إرسال · إثبات",
    title: "ميل أخير هادئ، مرئي من البداية حتى النهاية.",
    blurb:
      "مصمَّم للأفراد والشركات الذين يحتاجون أوقات وصول صادقة، وتسليمًا نظيفًا، وتجربة عميل تظل مميّزة حين تصبح العمليات صاخبة.",
    bookCta: "احجز توصيلة",
    quoteCta: "اطلب عرض سعر",
    trackCta: "تتبّع شحنة",
  },
  coverage: {
    one: "نعمل في {zone}",
    two: "نعمل في {first} و{second}",
    many: "نعمل في {head} و{tail}",
    twoJoiner: " و",
    manyTail: " و",
  },
  metrics: {
    activeLanesLabel: "المسارات النشطة",
    activeLanesAwaiting: "في انتظار أول مسار",
    activeLanesAcrossOne: "عبر {count} منطقة",
    activeLanesAcrossMany: "عبر {count} مناطق",
    activeLanesNamedToday: "{count} مسمَّاة اليوم",
    activeLanesZoneSingular: "منطقة",
    activeLanesZonePlural: "مناطق",
    serviceTiersLabel: "مستويات الخدمة",
    serviceTiersTrend: "نفس اليوم، مجدول، إرسال، بين المدن",
    fastestWindowLabel: "أسرع نافذة",
    fastestWindowDash: "—",
    fastestWindowTrendGoverned: "محكومة بثقة المسار",
    fastestWindowTrendAwaiting: "في انتظار تفعيل المنطقة",
    operatingHoursLabel: "ساعات العمل",
    operatingHoursDailyFallback: "يوميًا",
  },
  why: {
    kicker: "لماذا تنتقل الفِرَق",
    title: "نموذج تشغيل واحد. صادق بالتصميم.",
    body:
      "جداول أسعار محوكمة، ومعالم لا تتغير، وحساب واحد مشترك تُزيل الديون التشغيلية التي تُتلف بهدوء التجارب المميّزة. نفس منطق الإرسال لنفس اليوم والمجدول والإرسال وبين المدن — نفس أثر الإثبات الهادئ.",
    audienceTitle: "لمن هو موجَّه",
    audienceBody:
      "تجديد المخزون لتجار التجزئة، والعلامات بقيادة المؤسسين، والخدمات المهنية، وأقسام HenryCo التي تحتاج استلامًا وتسليمًا قابلَين للتنبؤ على نطاق واسع.",
    trackingTitle: "كيف يعمل التتبع",
    proofTitle: "الإثبات والمساءلة",
    proofBody:
      "تُكتب المعالم في سجل أحداث لا يتغيَّر. إثبات التسليم جزء من المنتج، وليس إضافة لاحقة.",
  },
  lanes: {
    kicker: "مسارات التشغيل",
    title: "أربعة أشكال للمسارات. انضباط وعد واحد.",
    metaTiersLabel: "{count} مستويات · تسعير محوكَم",
  },
  flow: {
    kicker: "من الطلب إلى الباب",
    title: "كل خطوة مرئية، وكل معلم موسوم بالوقت.",
    stepLabel: "الخطوة",
    step01Title: "أرسل عرض سعر أو حجزًا",
    step01Body:
      "عنوانان، وملف طرد، ومستوى خدمة. يعود السعر المحوكَم مدمجًا قبل أن تلتزم.",
    step02Title: "يخصص الإرسال المسار",
    step02Body:
      "يُسنَد التوجيه ضمن نافذة العمل؛ يُكتب معلم الاستلام مباشرة في خطك الزمني.",
    step03Title: "معالم حيّة على الجانبين",
    step03Body:
      "يرى المرسل والمستلم نفس الأحداث. تصل التحديثات عبر خيط حسابك في HenryCo.",
    step04Title: "إثبات التسليم، مُسجَّل",
    step04Body:
      "يُحفظ اسم المستلم والوقت وطريقة الالتقاط في سجل الشحنة — ظاهر في صفحة التتبع.",
  },
  spotlight: {
    eyebrow: "موقف HenryCo",
    title:
      "تبقى العمليات هادئة لأن المنصة تجعل فعل الصواب أرخص.",
    body:
      "جداول أسعار محوكمة، ومعالم لا تتغير، وحساب واحد مشترك تُزيل الديون التشغيلية التي تُتلف بهدوء التجارب المميزة.",
    honestEtaTitle: "أوقات وصول صادقة",
    honestEtaBody:
      "نوافذ الوعد تأتي من بيانات مسارات حقيقية، لا من تخمينات متفائلة. الانزلاق يُسجَّل ويُفسَّر.",
    proofTitle: "إثبات لا وعود",
    proofBody:
      "كل تسليم يُكتب في سجل لا يتغير. إثبات التسليم ميزة منتج، لا مرفق تذكرة.",
    accountTitle: "حساب واحد، فاتورة واحدة",
    accountBody:
      "يُعيد العملاء استخدام حساب HenryCo الذي يثقون به. يسوّي المشغّلون في مكان واحد عبر كل الأقسام.",
  },
  faq: {
    kicker: "أسئلة قبل الحجز",
    title: "الإجابات الصادقة، قبل الطلب.",
    metaContactPrefix: "اتصل بـ {brand}",
    body:
      "إن خرج مسار أو ملف طرد أو تسعير تعاقدي عن الأسئلة الشائعة، يلتقطه مكتب الأعمال. عروض الأسعار التي تحتاج إنسانًا ليست منتجًا مختلفًا — تعيش على نفس سجل الشحنة حال التحوّل.",
    emailPrefix: "راسل {brand} عبر البريد",
    accountCta: "افتح مركز الحساب",
  },
  faqItems: {
    quoteQ: "هل يمكن للعملاء طلب عرض سعر قبل الحجز؟",
    quoteA:
      "نعم. تتشارك العروض والحجوزات نفس مُنشئ الشحنة. يحفظ وضع العرض نية الشحنة ويحسب التسعير ويتوقف قبل الدفع.",
    trackingQ: "كيف يُؤمَّن التتبع؟",
    trackingA:
      "يستخدم التتبع العام كود التتبع مع رقم هاتف المرسل أو المستلم. كما يرى العملاء المسجَّلون أي شحنة مرتبطة بمعرّفهم أو بريدهم الموحَّد.",
    riderIssueQ: "ماذا يحدث حين يواجه السائق مشكلة؟",
    riderIssueA:
      "يمكن للسائقين رفع مشكلات مهيكلة من سير عملهم. يتلقى الإرسال والدعم التصعيد، وتُسجَّل كل خطوة حل على الخط الزمني للشحنة.",
    repeatRoutesQ: "هل تدعم المنصة المسارات التجارية المتكررة؟",
    repeatRoutesA:
      "نعم. صُمّم نموذج البيانات وتدفق الحجز لدعم العناوين المتكررة والتوجيه التجاري المتكرر وعمليات الإرسال الدفعي المستقبلية.",
  },
};

const LOGISTICS_HOME_COPY_DE: DeepPartial<LogisticsHomeCopy> = {
  metadata: {
    title: "Henry Onyx Logistics — ruhige letzte Meile, durchgängig sichtbar",
    description:
      "Ehrliche ETAs, geregelte Preise und Zustellnachweis bei jeder Sendung. Buchen, anfragen oder verfolgen Sie eine HenryCo-Logistics-Lieferung.",
  },
  hero: {
    eyebrow: "Abholung · Disposition · Nachweis",
    title: "Ruhige letzte Meile, durchgängig sichtbar.",
    blurb:
      "Für Menschen und Unternehmen, die ehrliche ETAs, saubere Übergaben und ein Premium-Erlebnis brauchen — auch wenn der Betrieb laut wird.",
    bookCta: "Lieferung buchen",
    quoteCta: "Angebot anfordern",
    trackCta: "Sendung verfolgen",
  },
  coverage: {
    one: "Im Einsatz in {zone}",
    two: "Im Einsatz in {first} und {second}",
    many: "Im Einsatz in {head} und {tail}",
    twoJoiner: " und ",
    manyTail: " und ",
  },
  metrics: {
    activeLanesLabel: "Aktive Linien",
    activeLanesAwaiting: "Warten auf erste Linie",
    activeLanesAcrossOne: "Über {count} Zone",
    activeLanesAcrossMany: "Über {count} Zonen",
    activeLanesNamedToday: "{count} heute benannt",
    activeLanesZoneSingular: "Zone",
    activeLanesZonePlural: "Zonen",
    serviceTiersLabel: "Servicestufen",
    serviceTiersTrend: "Selber Tag, geplant, Disposition, Inter-City",
    fastestWindowLabel: "Schnellstes Fenster",
    fastestWindowDash: "—",
    fastestWindowTrendGoverned: "Geregelt durch Linienvertrauen",
    fastestWindowTrendAwaiting: "Warten auf Zonenaktivierung",
    operatingHoursLabel: "Betriebszeiten",
    operatingHoursDailyFallback: "Täglich",
  },
  why: {
    kicker: "Warum Teams wechseln",
    title: "Ein Betriebsmodell. Ehrlich von Anfang an.",
    body:
      "Geregelte Tarife, unveränderliche Meilensteine und ein gemeinsames Konto beseitigen die operative Schuld, die Premium-Erlebnisse leise erodieren lässt. Dieselbe Dispositionslogik für selben Tag, geplant, Disposition und Inter-City — dieselbe ruhige Beweiskette.",
    audienceTitle: "Für wen es ist",
    audienceBody:
      "Einzelhandelsbefüllung, gründergeführte Marken, professionelle Dienstleister und HenryCo-Divisionen, die planbare Abholung und Zustellung im großen Stil brauchen.",
    trackingTitle: "So funktioniert das Tracking",
    proofTitle: "Nachweis und Verantwortung",
    proofBody:
      "Meilensteine werden in ein unveränderliches Ereignisprotokoll geschrieben. Der Zustellnachweis ist Teil des Produkts, kein nachträglicher Zusatz.",
  },
  lanes: {
    kicker: "Betriebsstrecken",
    title: "Vier Streckenformen. Eine Versprechensdisziplin.",
    metaTiersLabel: "{count} Stufen · geregelte Preise",
  },
  flow: {
    kicker: "Vom Antrag zur Tür",
    title: "Jeder Schritt sichtbar, jeder Meilenstein mit Zeitstempel.",
    stepLabel: "Schritt",
    step01Title: "Angebot oder Buchung einreichen",
    step01Body:
      "Zwei Adressen, ein Paketprofil und eine Servicestufe. Der geregelte Preis erscheint, bevor Sie bestätigen.",
    step02Title: "Disposition vergibt die Strecke",
    step02Body:
      "Das Routing wird im Betriebsfenster vergeben; der Abholmeilenstein wird live in Ihren Verlauf geschrieben.",
    step03Title: "Live-Meilensteine, beide Seiten",
    step03Body:
      "Absender und Empfänger sehen dieselben Ereignisse. Updates kommen über Ihren HenryCo-Konto-Thread.",
    step04Title: "Zustellnachweis, erfasst",
    step04Body:
      "Empfängername, Zeit und Erfassungsmethode werden im Sendungssatz gespeichert — sichtbar auf der Tracking-Seite.",
  },
  spotlight: {
    eyebrow: "Die HenryCo-Haltung",
    title:
      "Der Betrieb bleibt ruhig, weil die Plattform es günstiger macht, das Richtige zu tun.",
    body:
      "Geregelte Tarife, unveränderliche Meilensteine und ein gemeinsames Konto beseitigen die operative Schuld, die Premium-Erlebnisse leise erodieren lässt.",
    honestEtaTitle: "Ehrliche ETAs",
    honestEtaBody:
      "Versprechensfenster kommen aus echten Streckendaten, nicht aus optimistischen Schätzungen. Verzögerungen werden protokolliert und erklärt.",
    proofTitle: "Nachweise, keine Versprechen",
    proofBody:
      "Jede Übergabe wird in ein unveränderliches Ereignisprotokoll geschrieben. Zustellnachweis ist eine Produktfunktion, kein Ticket-Anhang.",
    accountTitle: "Ein Konto, eine Rechnung",
    accountBody:
      "Kunden nutzen das HenryCo-Konto, dem sie schon vertrauen. Operatoren rechnen an einem Ort über alle Divisionen ab.",
  },
  faq: {
    kicker: "Fragen vor der Buchung",
    title: "Die ehrlichen Antworten, vor der Bestellung.",
    metaContactPrefix: "{brand} kontaktieren",
    body:
      "Wenn eine Strecke, ein Paketprofil oder Vertragspreis außerhalb der FAQ liegt, übernimmt der Business-Desk. Angebote, die einen Menschen brauchen, sind kein anderes Produkt — sie leben nach der Umwandlung auf demselben Sendungssatz.",
    emailPrefix: "{brand} per E-Mail erreichen",
    accountCta: "Kontocenter öffnen",
  },
  faqItems: {
    quoteQ: "Können Kunden vor der Buchung ein Angebot anfordern?",
    quoteA:
      "Ja. Angebote und Buchungen teilen denselben Sendungs-Builder. Der Angebotsmodus speichert die Absicht, berechnet den Preis und stoppt vor der Zahlung.",
    trackingQ: "Wie wird das Tracking abgesichert?",
    trackingA:
      "Öffentliches Tracking nutzt den Tracking-Code plus die Telefonnummer von Absender oder Empfänger. Angemeldete Kunden sehen außerdem jede Sendung, die mit ihrer User-ID oder normalisierten E-Mail verknüpft ist.",
    riderIssueQ: "Was passiert, wenn ein Fahrer auf ein Problem stößt?",
    riderIssueA:
      "Fahrer können strukturierte Vorfälle direkt aus ihrem Workflow melden. Disposition und Support erhalten die Eskalation, und jeder Lösungsschritt wird am Sendungsverlauf protokolliert.",
    repeatRoutesQ: "Unterstützt die Plattform geschäftliche Wiederholungsstrecken?",
    repeatRoutesA:
      "Ja. Datenmodell und Buchungsfluss sind auf wiederholte Adressen, wiederkehrendes Geschäftsrouting und künftige Batch-Einreichungen ausgelegt.",
  },
};

const LOGISTICS_HOME_COPY_IT: DeepPartial<LogisticsHomeCopy> = {
  metadata: {
    title: "Henry Onyx Logistics — ultimo miglio sereno, visibile da capo a piedi",
    description:
      "ETA onesti, prezzi governati e prova di consegna su ogni spedizione. Prenota, richiedi un preventivo o traccia una consegna Henry Onyx Logistics.",
  },
  hero: {
    eyebrow: "Ritiro · Dispatch · Prova",
    title: "Ultimo miglio sereno, visibile da capo a piedi.",
    blurb:
      "Pensato per persone e aziende che vogliono ETA onesti, passaggi puliti e un’esperienza premium anche quando l’operatività diventa rumorosa.",
    bookCta: "Prenota una consegna",
    quoteCta: "Richiedi un preventivo",
    trackCta: "Traccia una spedizione",
  },
  coverage: {
    one: "Operativi a {zone}",
    two: "Operativi a {first} e {second}",
    many: "Operativi a {head} e {tail}",
    twoJoiner: " e ",
    manyTail: " e ",
  },
  metrics: {
    activeLanesLabel: "Tratte attive",
    activeLanesAwaiting: "In attesa della prima tratta",
    activeLanesAcrossOne: "Su {count} zona",
    activeLanesAcrossMany: "Su {count} zone",
    activeLanesNamedToday: "{count} nominate oggi",
    activeLanesZoneSingular: "zona",
    activeLanesZonePlural: "zone",
    serviceTiersLabel: "Livelli di servizio",
    serviceTiersTrend: "Stesso giorno, programmato, dispatch, intercity",
    fastestWindowLabel: "Finestra più rapida",
    fastestWindowDash: "—",
    fastestWindowTrendGoverned: "Governata dalla confidenza della tratta",
    fastestWindowTrendAwaiting: "In attesa di attivazione zona",
    operatingHoursLabel: "Orari operativi",
    operatingHoursDailyFallback: "Giornaliero",
  },
  why: {
    kicker: "Perché i team passano qui",
    title: "Un solo modello operativo. Onesto per design.",
    body:
      "Tariffari governati, milestone immutabili e un account condiviso eliminano il debito operativo che erode in silenzio le esperienze premium. Stessa logica di dispatch per stesso giorno, programmato, dispatch e intercity — stessa scia tranquilla di prove.",
    audienceTitle: "A chi è destinato",
    audienceBody:
      "Riassortimento retail, brand guidati dai fondatori, servizi professionali e divisioni HenryCo che hanno bisogno di ritiri e consegne prevedibili su larga scala.",
    trackingTitle: "Come funziona il tracking",
    proofTitle: "Prova e responsabilità",
    proofBody:
      "I milestone vengono scritti in un log eventi immutabile. La prova di consegna fa parte del prodotto, non è un’aggiunta.",
  },
  lanes: {
    kicker: "Tratte operative",
    title: "Quattro forme di tratta. Una sola disciplina di promessa.",
    metaTiersLabel: "{count} livelli · prezzi governati",
  },
  flow: {
    kicker: "Dalla richiesta alla porta",
    title: "Ogni passo è visibile, ogni milestone è timbrato.",
    stepLabel: "Passo",
    step01Title: "Invia un preventivo o una prenotazione",
    step01Body:
      "Due indirizzi, un profilo collo e un livello di servizio. Il prezzo governato compare prima di confermare.",
    step02Title: "Il dispatch assegna la tratta",
    step02Body:
      "Il routing assegna nella finestra operativa; il milestone di ritiro viene scritto in diretta nella tua timeline.",
    step03Title: "Milestone in diretta, entrambi i lati",
    step03Body:
      "Mittente e destinatario vedono gli stessi eventi. Gli aggiornamenti arrivano dal thread del tuo account HenryCo.",
    step04Title: "Prova di consegna, catturata",
    step04Body:
      "Nome del destinatario, ora e metodo di acquisizione vengono salvati sulla spedizione — visibili sulla pagina di tracking.",
  },
  spotlight: {
    eyebrow: "La postura HenryCo",
    title:
      "Le operazioni restano calme perché la piattaforma rende meno costoso fare la cosa giusta.",
    body:
      "Tariffari governati, milestone immutabili e un account condiviso eliminano il debito operativo che erode in silenzio le esperienze premium.",
    honestEtaTitle: "ETA onesti",
    honestEtaBody:
      "Le finestre di promessa vengono da dati reali di tratta, non da stime ottimistiche. I ritardi vengono registrati e spiegati.",
    proofTitle: "Prove, non promesse",
    proofBody:
      "Ogni passaggio viene scritto in un log immutabile. La prova di consegna è una funzione di prodotto, non un allegato a un ticket.",
    accountTitle: "Un account, una fattura",
    accountBody:
      "I clienti riusano l’account HenryCo di cui già si fidano. Gli operatori riconciliano in un solo posto su tutte le divisioni.",
  },
  faq: {
    kicker: "Domande prima di prenotare",
    title: "Le risposte oneste, prima dell’ordine.",
    metaContactPrefix: "Contatta {brand}",
    body:
      "Se una tratta, un profilo collo o un prezzo contrattuale escono dalla FAQ, il desk business prende in mano. I preventivi che richiedono un umano non sono un prodotto diverso — vivono sulla stessa spedizione una volta convertiti.",
    emailPrefix: "Scrivi a {brand}",
    accountCta: "Apri l’hub account",
  },
  faqItems: {
    quoteQ: "I clienti possono chiedere un preventivo prima di prenotare?",
    quoteA:
      "Sì. Preventivi e prenotazioni condividono lo stesso costruttore. La modalità preventivo salva l’intento, calcola il prezzo e si ferma prima del pagamento.",
    trackingQ: "Come è protetto il tracking?",
    trackingA:
      "Il tracking pubblico usa il codice più il telefono di mittente o destinatario. I clienti loggati vedono anche ogni spedizione collegata al loro id o email normalizzata.",
    riderIssueQ: "Cosa succede quando un corriere ha un problema?",
    riderIssueA:
      "I corrieri possono aprire incidenti strutturati dal loro flusso. Dispatch e supporto ricevono l’escalation e ogni passo di risoluzione viene loggato sulla timeline della spedizione.",
    repeatRoutesQ: "La piattaforma supporta tratte business ricorrenti?",
    repeatRoutesA:
      "Sì. Il modello dati e il flusso di prenotazione sono pensati per indirizzi ripetuti, routing ricorrente e invii batch futuri.",
  },
};

const LOGISTICS_HOME_COPY_ZH: DeepPartial<LogisticsHomeCopy> = {
  metadata: {
    title: "Henry Onyx Logistics — 平静的最后一公里,全程可见",
    description:
      "诚实的预计送达时间、受治理的定价,以及每一票都有的送达证明。预订、报价或追踪一笔 Henry Onyx Logistics 配送。",
  },
  hero: {
    eyebrow: "取件 · 派送 · 凭证",
    title: "平静的最后一公里,全程可见。",
    blurb:
      "为需要诚实预计送达时间、整洁交接,以及在运营繁忙时仍保持高端体验的个人与企业打造。",
    bookCta: "预订一次配送",
    quoteCta: "申请报价",
    trackCta: "追踪一票货件",
  },
  coverage: {
    one: "已在 {zone} 运营",
    two: "已在 {first} 和 {second} 运营",
    many: "已在 {head} 和 {tail} 运营",
    twoJoiner: "和",
    manyTail: "、",
  },
  metrics: {
    activeLanesLabel: "活跃线路",
    activeLanesAwaiting: "等待首条线路",
    activeLanesAcrossOne: "覆盖 {count} 个区域",
    activeLanesAcrossMany: "覆盖 {count} 个区域",
    activeLanesNamedToday: "今日命名 {count} 条",
    activeLanesZoneSingular: "区域",
    activeLanesZonePlural: "区域",
    serviceTiersLabel: "服务等级",
    serviceTiersTrend: "当日、预约、派送、城际",
    fastestWindowLabel: "最快窗口",
    fastestWindowDash: "—",
    fastestWindowTrendGoverned: "按线路置信度治理",
    fastestWindowTrendAwaiting: "等待区域激活",
    operatingHoursLabel: "运营时间",
    operatingHoursDailyFallback: "每日",
  },
  why: {
    kicker: "为什么团队会切换",
    title: "一套运营模型。从设计起就是诚实的。",
    body:
      "受治理的运价表、不可篡改的里程碑,以及一个共享账户,移除了悄悄侵蚀高端体验的运营债务。同日、预约、派送、城际共用同一调度逻辑——同样平静的凭证链。",
    audienceTitle: "面向谁",
    audienceBody:
      "零售补货、创始人主导的品牌、专业服务,以及需要规模化可预测取派的 HenryCo 各业务部。",
    trackingTitle: "追踪如何运作",
    proofTitle: "凭证与问责",
    proofBody:
      "里程碑写入不可变事件日志。送达凭证是产品的一部分,不是事后补丁。",
  },
  lanes: {
    kicker: "运营线路",
    title: "四种线路形态。一种承诺纪律。",
    metaTiersLabel: "{count} 个等级 · 治理定价",
  },
  flow: {
    kicker: "从请求到门口",
    title: "每一步可见,每个里程碑都有时间戳。",
    stepLabel: "步骤",
    step01Title: "提交报价或预订",
    step01Body:
      "两个地址、一个包裹画像、一个服务等级。受治理的价格在你确认之前内联返回。",
    step02Title: "调度分配线路",
    step02Body:
      "线路在运营窗口内分配;取件里程碑实时写入你的时间轴。",
    step03Title: "实时里程碑,两端同步",
    step03Body:
      "发件人与收件人看到相同事件。更新通过你的 HenryCo 账户线程送达。",
    step04Title: "送达凭证,已采集",
    step04Body:
      "收件人姓名、时间和采集方式保存到货件记录——在追踪页可见。",
  },
  spotlight: {
    eyebrow: "HenryCo 的姿态",
    title: "运营之所以平静,是因为平台让做对的事更便宜。",
    body:
      "受治理的运价表、不可篡改的里程碑,以及一个共享账户,移除了悄悄侵蚀高端体验的运营债务。",
    honestEtaTitle: "诚实的预计送达时间",
    honestEtaBody:
      "承诺窗口来自真实线路数据,而非乐观估计。延迟会被记录并解释。",
    proofTitle: "凭证而非承诺",
    proofBody:
      "每一次交接都写入不可变日志。送达凭证是产品功能,不是工单附件。",
    accountTitle: "一个账户,一张账单",
    accountBody:
      "客户复用已信任的 HenryCo 账户。运营方在所有业务部统一对账。",
  },
  faq: {
    kicker: "预订前的问题",
    title: "下单前的诚实回答。",
    metaContactPrefix: "联系 {brand}",
    body:
      "如果某条线路、包裹画像或合同价格超出 FAQ 范围,业务台会接手。需要人工的报价不是另一个产品——转化之后会落在同一货件记录上。",
    emailPrefix: "邮件联系 {brand}",
    accountCta: "打开账户中心",
  },
  faqItems: {
    quoteQ: "客户可以在预订前申请报价吗?",
    quoteA:
      "可以。报价与预订共用同一货件构造器。报价模式保存意向、计算价格,并在付款前停止。",
    trackingQ: "追踪如何受保护?",
    trackingA:
      "公开追踪使用追踪码加上发件人或收件人电话号码进行安全查询。登录客户还能看到关联到其用户 ID 或归一邮箱的所有货件。",
    riderIssueQ: "骑手遇到问题时会怎样?",
    riderIssueA:
      "骑手可以直接从工作流提交结构化问题。调度与支持收到升级,所有解决步骤都会记回货件时间轴。",
    repeatRoutesQ: "平台是否支持企业重复线路?",
    repeatRoutesA:
      "是的。数据模型与预订流程是为重复地址、商业重复路由以及未来的批量提交而设计的。",
  },
};

const LOGISTICS_HOME_COPY_HI: DeepPartial<LogisticsHomeCopy> = {
  metadata: {
    title: "Henry Onyx Logistics — शांत लास्ट-माइल, शुरू से अंत तक दिखने वाला",
    description:
      "हर शिपमेंट पर ईमानदार ETA, नियंत्रित मूल्य निर्धारण और डिलीवरी का प्रमाण। Henry Onyx Logistics डिलीवरी को बुक करें, कोट करें या ट्रैक करें।",
  },
  hero: {
    eyebrow: "पिकअप · डिस्पैच · प्रमाण",
    title: "शांत लास्ट-माइल, शुरू से अंत तक दिखने वाला।",
    blurb:
      "उन व्यक्तियों और व्यवसायों के लिए बनाया गया जिन्हें ईमानदार ETA, साफ हैंडऑफ और ऑपरेशन शोरगुल बनने पर भी प्रीमियम अनुभव चाहिए।",
    bookCta: "एक डिलीवरी बुक करें",
    quoteCta: "एक कोट मांगें",
    trackCta: "एक शिपमेंट ट्रैक करें",
  },
  coverage: {
    one: "{zone} में चालू",
    two: "{first} और {second} में चालू",
    many: "{head} और {tail} में चालू",
    twoJoiner: " और ",
    manyTail: " और ",
  },
  metrics: {
    activeLanesLabel: "सक्रिय लेन",
    activeLanesAwaiting: "पहली लेन की प्रतीक्षा",
    activeLanesAcrossOne: "{count} ज़ोन में",
    activeLanesAcrossMany: "{count} ज़ोन में",
    activeLanesNamedToday: "आज {count} नामित",
    activeLanesZoneSingular: "ज़ोन",
    activeLanesZonePlural: "ज़ोन",
    serviceTiersLabel: "सेवा स्तर",
    serviceTiersTrend: "उसी दिन, अनुसूचित, डिस्पैच, इंटर-सिटी",
    fastestWindowLabel: "सबसे तेज़ विंडो",
    fastestWindowDash: "—",
    fastestWindowTrendGoverned: "लेन विश्वास से नियंत्रित",
    fastestWindowTrendAwaiting: "ज़ोन सक्रियण की प्रतीक्षा",
    operatingHoursLabel: "ऑपरेटिंग समय",
    operatingHoursDailyFallback: "दैनिक",
  },
  why: {
    kicker: "टीमें क्यों बदलती हैं",
    title: "एक ऑपरेटिंग मॉडल। डिज़ाइन से ईमानदार।",
    body:
      "नियंत्रित दर कार्ड, अपरिवर्तनीय माइलस्टोन और एक साझा खाता उस ऑपरेशनल कर्ज़ को हटाते हैं जो चुपचाप प्रीमियम अनुभव को क्षीण करता है। उसी डिस्पैचर लॉजिक से उसी दिन, अनुसूचित, डिस्पैच और इंटर-सिटी — उसी शांत प्रमाण-पथ पर।",
    audienceTitle: "यह किसके लिए है",
    audienceBody:
      "रिटेल रिप्लेनिशमेंट, संस्थापक-नेतृत्व वाले ब्रांड, प्रोफेशनल सर्विसेज और HenryCo के वे डिवीज़न जिन्हें स्केल पर पूर्वानुमेय पिकअप और डिलीवरी चाहिए।",
    trackingTitle: "ट्रैकिंग कैसे काम करती है",
    proofTitle: "प्रमाण और जवाबदेही",
    proofBody:
      "माइलस्टोन एक अपरिवर्तनीय इवेंट लॉग में लिखे जाते हैं। डिलीवरी का प्रमाण उत्पाद का हिस्सा है, बाद का जोड़ नहीं।",
  },
  lanes: {
    kicker: "ऑपरेटिंग लेन",
    title: "चार लेन आकार। एक ही वादे का अनुशासन।",
    metaTiersLabel: "{count} स्तर · नियंत्रित मूल्य",
  },
  flow: {
    kicker: "अनुरोध से दरवाज़े तक",
    title: "हर कदम दिखाई देता है, हर माइलस्टोन पर समय की मुहर है।",
    stepLabel: "चरण",
    step01Title: "एक कोट या बुकिंग जमा करें",
    step01Body:
      "दो पते, एक पार्सल प्रोफ़ाइल और एक सेवा स्तर। नियंत्रित मूल्य प्रतिबद्धता से पहले इनलाइन लौटता है।",
    step02Title: "डिस्पैच लेन सौंपता है",
    step02Body:
      "रूटिंग ऑपरेटिंग विंडो में सौंपा जाता है; पिकअप माइलस्टोन आपकी टाइमलाइन में लाइव लिखा जाता है।",
    step03Title: "लाइव माइलस्टोन, दोनों तरफ",
    step03Body:
      "प्रेषक और प्राप्तकर्ता को वही घटनाएँ दिखती हैं। अपडेट आपके HenryCo खाते के थ्रेड से आते हैं।",
    step04Title: "डिलीवरी का प्रमाण, कैप्चर किया गया",
    step04Body:
      "प्राप्तकर्ता का नाम, समय और कैप्चर विधि शिपमेंट रिकॉर्ड में सेव होती है — ट्रैक पेज पर दिखाई देती है।",
  },
  spotlight: {
    eyebrow: "HenryCo की मुद्रा",
    title:
      "ऑपरेशन शांत रहते हैं क्योंकि प्लेटफ़ॉर्म सही काम करना सस्ता बना देता है।",
    body:
      "नियंत्रित दर कार्ड, अपरिवर्तनीय माइलस्टोन और एक साझा खाता उस ऑपरेशनल कर्ज़ को हटाते हैं जो चुपचाप प्रीमियम अनुभव को क्षीण करता है।",
    honestEtaTitle: "ईमानदार ETA",
    honestEtaBody:
      "वादा-विंडो वास्तविक लेन डेटा से आती है, आशावादी अनुमान से नहीं। फिसलन लॉग और समझाई जाती है।",
    proofTitle: "प्रमाण, वादे नहीं",
    proofBody:
      "हर हैंडऑफ अपरिवर्तनीय लॉग में लिखा जाता है। डिलीवरी का प्रमाण एक उत्पाद फ़ीचर है, टिकट अटैचमेंट नहीं।",
    accountTitle: "एक खाता, एक बिल",
    accountBody:
      "ग्राहक अपने पहले से भरोसेमंद HenryCo खाते का पुन: उपयोग करते हैं। ऑपरेटर हर डिवीज़न में एक ही जगह मिलान करते हैं।",
  },
  faq: {
    kicker: "बुक करने से पहले के प्रश्न",
    title: "ऑर्डर से पहले, ईमानदार उत्तर।",
    metaContactPrefix: "{brand} से संपर्क",
    body:
      "अगर कोई लेन, पार्सल प्रोफ़ाइल या अनुबंध मूल्य FAQ से बाहर है तो बिज़नेस डेस्क उठा लेता है। जिन कोटों को इंसान चाहिए वे अलग उत्पाद नहीं — कन्वर्ट होते ही वही शिपमेंट रिकॉर्ड पर रहते हैं।",
    emailPrefix: "{brand} को ईमेल करें",
    accountCta: "खाता हब खोलें",
  },
  faqItems: {
    quoteQ: "क्या ग्राहक बुक करने से पहले कोट मांग सकते हैं?",
    quoteA:
      "हाँ। कोट और बुकिंग एक ही शिपमेंट बिल्डर साझा करते हैं। कोट मोड शिपमेंट इरादा सेव करता है, मूल्य गणना करता है और भुगतान से पहले रुक जाता है।",
    trackingQ: "ट्रैकिंग कैसे सुरक्षित होती है?",
    trackingA:
      "पब्लिक ट्रैकिंग ट्रैकिंग कोड के साथ प्रेषक या प्राप्तकर्ता का फ़ोन नंबर इस्तेमाल करती है। साइन-इन ग्राहकों को उनके यूज़र आईडी या नॉर्मलाइज़्ड ईमेल से जुड़ी सभी शिपमेंट भी दिखती हैं।",
    riderIssueQ: "जब राइडर को समस्या आती है तो क्या होता है?",
    riderIssueA:
      "राइडर अपने वर्कफ़्लो से सीधे संरचित समस्या उठा सकते हैं। डिस्पैच और सपोर्ट को एस्केलेशन मिलता है, और हर समाधान चरण शिपमेंट टाइमलाइन पर वापस लॉग होता है।",
    repeatRoutesQ: "क्या प्लेटफ़ॉर्म बिज़नेस के दोहरावदार रूट सपोर्ट करता है?",
    repeatRoutesA:
      "हाँ। डेटा मॉडल और बुकिंग फ्लो दोहराए जाने वाले पते, बिज़नेस के पुनरावर्ती रूटिंग और भविष्य के बैच सबमिशन को समर्थन देने के लिए बने हैं।",
  },
};

const LOGISTICS_HOME_COPY_IG: DeepPartial<LogisticsHomeCopy> = {
  metadata: {
    title: "Henry Onyx Logistics — ọnụụlọ-mma dị jụụ, nke a na-ahụ site na mmalite ruo na njedebe",
    description:
      "Oge nnata ziri ezi, ọnụahịa nke a na-achịkwa, na ihe akaebe nnyefe na nnyefe ọ bụla. Debe, jụọ ọnụahịa, ma ọ bụ soro nnyefe Henry Onyx Logistics.",
  },
  hero: {
    eyebrow: "Nbubata · Mzipu · Ihe Akaebe",
    title: "Ọnụụlọ-mma dị jụụ, nke a na-ahụ site na mmalite ruo na njedebe.",
    blurb:
      "Ewuru ya maka ndị mmadụ na azụmahịa chọrọ oge nnata ziri ezi, nnyefe dị ọcha, na ahụmahụ ndị ahịa nke na-anọgide na-adị elu mgbe ọrụ na-eme mkpọtụ.",
    bookCta: "Debe nnyefe",
    quoteCta: "Rịọ ọnụahịa",
    trackCta: "Soro mbufe",
  },
  coverage: {
    one: "Anyị nọ na {zone}",
    two: "Anyị nọ na {first} na {second}",
    many: "Anyị nọ na {head} na {tail}",
    twoJoiner: " na ",
    manyTail: " na ",
  },
  metrics: {
    activeLanesLabel: "Ụzọ rụrụ ọrụ",
    activeLanesAwaiting: "Na-eche ụzọ mbụ",
    activeLanesAcrossOne: "N’ime mpaghara {count}",
    activeLanesAcrossMany: "N’ime mpaghara {count}",
    activeLanesNamedToday: "{count} akpọrọ aha taa",
    activeLanesZoneSingular: "mpaghara",
    activeLanesZonePlural: "mpaghara",
    serviceTiersLabel: "Ọkwa ọrụ",
    serviceTiersTrend: "Otu ụbọchị, ahaziri, mzipu, mba-na-mba",
    fastestWindowLabel: "Oge kacha ngwa",
    fastestWindowDash: "—",
    fastestWindowTrendGoverned: "A na-achịkwa site na ntụkwasị obi ụzọ",
    fastestWindowTrendAwaiting: "Na-eche mmalite mpaghara",
    operatingHoursLabel: "Oge ọrụ",
    operatingHoursDailyFallback: "Kwa ụbọchị",
  },
  why: {
    kicker: "Ihe mere ndị otu ji agbanwe",
    title: "Otu usoro ọrụ. Ezi okwu site na nhazi.",
    body:
      "Kaadị ọnụahịa achịkwara, ihe ngosi na-adịghị agbanwe agbanwe, na otu akaụntụ ekekọrịtara na-ewepụ ụgwọ ọrụ nke na-emebi ahụmahụ dị elu n’anya. Otu uche mzipu maka otu ụbọchị, ahaziri, mzipu, na mba-na-mba — otu akara ihe akaebe dị jụụ.",
    audienceTitle: "Onye eji ya eme",
    audienceBody:
      "Mweghachi azụmahịa, akara ndị onye guzobere na-edu, ọrụ ndị ọkachamara, na ngalaba HenryCo chọrọ nbubata na nnyefe a ga-akọwa n’ọtụtụ.",
    trackingTitle: "Otú nsochi si arụ ọrụ",
    proofTitle: "Ihe akaebe na ịza ajụjụ",
    proofBody:
      "A na-ede ihe ngosi n’ime ndekọ ihe omume na-adịghị agbanwe. Ihe akaebe nnyefe bụ akụkụ ngwaahịa, ọ bụghị ihe a tinyere mgbe e mechara.",
  },
  lanes: {
    kicker: "Ụzọ ọrụ",
    title: "Ụdị ụzọ anọ. Otu iwu nkwa.",
    metaTiersLabel: "Ọkwa {count} · ọnụahịa achịkwara",
  },
  flow: {
    kicker: "Site na arịrịọ ruo n’ọnụ ụzọ",
    title: "Nzọụkwụ ọ bụla a na-ahụ, ihe ngosi ọ bụla nwere akara oge.",
    stepLabel: "Nzọụkwụ",
    step01Title: "Nyefee ọnụahịa ma ọ bụ ndebanye",
    step01Body:
      "Adreesị abụọ, profaịlụ ngwaahịa, na ọkwa ọrụ. Ọnụahịa achịkwara na-alaghachi tupu ị kwenye.",
    step02Title: "Mzipu na-ekenye ụzọ",
    step02Body:
      "A na-ekenye usoro n’ime oge ọrụ; e dere ihe ngosi nbubata ozugbo na akara oge gị.",
    step03Title: "Ihe ngosi ozugbo, n’akụkụ abụọ",
    step03Body:
      "Onye nzipu na onye nnata na-ahụ otu ihe omume. Mmelite na-eru site na eserese akaụntụ HenryCo gị.",
    step04Title: "Ihe akaebe nnyefe, e gbanyere",
    step04Body:
      "Aha onye nnata, oge, na ụzọ e si gbanye na-echekwa na ndekọ mbufe — a na-ahụ ya na ibe nsochi.",
  },
  spotlight: {
    eyebrow: "Ọnọdụ HenryCo",
    title:
      "Ọrụ na-anọgide na-adị jụụ n’ihi na ikpo okwu na-eme ka ime ihe ziri ezi dị ọnụ ala.",
    body:
      "Kaadị ọnụahịa achịkwara, ihe ngosi na-adịghị agbanwe agbanwe, na otu akaụntụ ekekọrịtara na-ewepụ ụgwọ ọrụ nke na-emebi ahụmahụ dị elu n’anya.",
    honestEtaTitle: "Oge nnata ziri ezi",
    honestEtaBody:
      "Windo nkwa na-esi na ezigbo data ụzọ, ọ bụghị nkọ na-egbukepụ. A na-edekọ na ịkọwa mgbada.",
    proofTitle: "Ihe akaebe, ọ bụghị nkwa",
    proofBody:
      "Nnyefe ọ bụla na-ede n’ime ndekọ na-adịghị agbanwe. Ihe akaebe nnyefe bụ atụmatụ ngwaahịa, ọ bụghị ihe e gbakwunyere na tiketi.",
    accountTitle: "Otu akaụntụ, otu ụgwọ",
    accountBody:
      "Ndị ahịa na-eji akaụntụ HenryCo ha tụkwasịrịla obi. Ndị ọrụ na-akwalite n’otu ebe site n’ngalaba ọ bụla.",
  },
  faq: {
    kicker: "Ajụjụ tupu ndebanye",
    title: "Azịza ziri ezi, tupu iwu.",
    metaContactPrefix: "Kpọtụrụ {brand}",
    body:
      "Ọ bụrụ na ụzọ, profaịlụ ngwaahịa, ma ọ bụ ọnụahịa nkwekọrịta na-apụta n’azịza ajụjụ, tebụl azụmahịa na-ewere ya. Ọnụahịa chọrọ mmadụ abụghị ngwaahịa ọzọ — ha na-ebi na otu ndekọ mbufe mgbe ha tụgharịrị.",
    emailPrefix: "Zipu {brand} email",
    accountCta: "Mepee ebe akaụntụ",
  },
  faqItems: {
    quoteQ: "Ndị ahịa ọ pụrụ ịrịọ ọnụahịa tupu ha edebee?",
    quoteA:
      "Ee. Ọnụahịa na ndebanye na-ekekọ otu ihe nwuli mbufe. Ụdị ọnụahịa na-echekwa ebumnobi mbufe, na-agbakọ ọnụahịa, ma kwụsị tupu ịkwụ ụgwọ.",
    trackingQ: "Olee otú e si echekwa nsochi?",
    trackingA:
      "Nsochi ọha na-eji koodu nsochi yana nọmba ekwentị onye nzipu ma ọ bụ onye nnata. Ndị ahịa banyere kwa na-ahụ mbufe ọ bụla ejikọtara na njirimara ojiji ha ma ọ bụ email achịkwara.",
    riderIssueQ: "Gịnị na-eme mgbe onye na-anya ụgbọ nwere nsogbu?",
    riderIssueA:
      "Ndị na-anya ụgbọ pụrụ iwelite nsogbu ahaziri site n’ọrụ ha. Mzipu na nkwado na-anata ịkwalite ahụ, e dekọkwara nzọụkwụ ngwọta ọ bụla n’ihe oge mbufe.",
    repeatRoutesQ: "Ikpo okwu ọ na-akwado ụzọ azụmahịa ndị a na-emegharị?",
    repeatRoutesA:
      "Ee. E mere usoro data na usoro ndebanye ka ha kwado adreesị emegharịrị, usoro azụmahịa a na-emegharị, na ndebanye dị otu n’ọdịnihu.",
  },
};

const LOGISTICS_HOME_COPY_YO: DeepPartial<LogisticsHomeCopy> = {
  metadata: {
    title: "Henry Onyx Logistics — ìfijiṣẹ́ ìparí tútù, tí ó hàn láti ìbẹ̀rẹ̀ dé òpin",
    description:
      "Àkókò ìdégbé tó dájú, ìnà tí a ń ṣàkóso, àti ẹ̀rí ìfijiṣẹ́ lórí gbogbo gbígbé. Ṣe ìpèsè, béèrè ìdíyelé, tàbí tọpa ìfijiṣẹ́ Henry Onyx Logistics.",
  },
  hero: {
    eyebrow: "Gbígbà · Pípín · Ẹ̀rí",
    title: "Ìfijiṣẹ́ ìparí tútù, tí ó hàn láti ìbẹ̀rẹ̀ dé òpin.",
    blurb:
      "A kọ́ ọ fún àwọn ènìyàn àti àwọn iléeṣẹ́ tí ó nílò àkókò ìdégbé tó dájú, ìfijiṣẹ́ tó mọ́ tónítóní, àti ìrírí oníbàárà alágbára nígbà tí iṣẹ́ bá pariwo.",
    bookCta: "Ṣe ìpèsè ìfijiṣẹ́",
    quoteCta: "Béèrè ìdíyelé",
    trackCta: "Tọpa gbígbé",
  },
  coverage: {
    one: "Ní ṣíṣiṣẹ́ ní {zone}",
    two: "Ní ṣíṣiṣẹ́ ní {first} àti {second}",
    many: "Ní ṣíṣiṣẹ́ ní {head} àti {tail}",
    twoJoiner: " àti ",
    manyTail: " àti ",
  },
  metrics: {
    activeLanesLabel: "Àwọn òpópónà tó ń ṣiṣẹ́",
    activeLanesAwaiting: "Ń dúró de òpópónà àkọ́kọ́",
    activeLanesAcrossOne: "Ní àgbègbè {count}",
    activeLanesAcrossMany: "Ní àwọn àgbègbè {count}",
    activeLanesNamedToday: "{count} tí a dárúkọ lónìí",
    activeLanesZoneSingular: "àgbègbè",
    activeLanesZonePlural: "àwọn àgbègbè",
    serviceTiersLabel: "Àwọn ìpele iṣẹ́",
    serviceTiersTrend: "Ọjọ́ kan náà, ètò, pípín, agbègbè-sí-agbègbè",
    fastestWindowLabel: "Fèrèsé tó yara jùlọ",
    fastestWindowDash: "—",
    fastestWindowTrendGoverned: "A ń ṣàkóso rẹ̀ pẹ̀lú ìgbẹ́kẹ̀lé òpópónà",
    fastestWindowTrendAwaiting: "Ń dúró de ìmúṣiṣẹ́ àgbègbè",
    operatingHoursLabel: "Wákàtí iṣẹ́",
    operatingHoursDailyFallback: "Lójoojúmọ́",
  },
  why: {
    kicker: "Ìdí tí àwọn ẹgbẹ́ fi ń yípadà",
    title: "Àwòṣe iṣẹ́ kan ṣoṣo. Olódodo láti ìpilẹ̀ṣẹ̀.",
    body:
      "Káàdì oye ìnà tí a ń ṣàkóso, àwọn àmì tí kò ṣe é yí padà, àti àkàǹtì kan tí a ń pín ń yọ gbèsè iṣẹ́ tí ó ń ba ìrírí alágbára jẹ́ jẹ́ẹ́jẹ́ẹ́. Ọgbọ́n ìpín kan náà fún ọjọ́ kan, ètò, pípín, àti agbègbè-sí-agbègbè — ẹ̀rí kan náà tí ó tútù.",
    audienceTitle: "Ẹni tí ó wà fún",
    audienceBody:
      "Àtúnkún ọjà, àwọn ààmì onípilẹ̀ṣẹ̀, iṣẹ́ ọmọ-iṣẹ́, àti àwọn ìpín HenryCo tí ó nílò gbígbà àti ìfijiṣẹ́ tí a lè pinnu lórí ìwọ̀nba ńlá.",
    trackingTitle: "Bí ìtọpa ṣe ń ṣiṣẹ́",
    proofTitle: "Ẹ̀rí àti ìṣirò",
    proofBody:
      "A ń kọ àwọn àmì sí ìwé ìṣẹ̀lẹ̀ tí kò ṣe é yí padà. Ẹ̀rí ìfijiṣẹ́ jẹ́ apá kan ti ọjà, kì í ṣe àfikún.",
  },
  lanes: {
    kicker: "Àwọn òpópónà iṣẹ́",
    title: "Apá òpópónà mẹ́rin. Ìlànà ìlérí kan ṣoṣo.",
    metaTiersLabel: "Ìpele {count} · ìnà tí a ń ṣàkóso",
  },
  flow: {
    kicker: "Láti ẹ̀bẹ̀ dé ẹnu ọ̀nà",
    title: "Igbésẹ̀ kọ̀ọ̀kan hàn, àmì kọ̀ọ̀kan ní àkọsílẹ̀ àkókò.",
    stepLabel: "Igbésẹ̀",
    step01Title: "Fi ìdíyelé tàbí ìpèsè ránṣẹ́",
    step01Body:
      "Àdírẹ́sì méjì, àpèjúwe ìdìpọ̀, àti ìpele iṣẹ́. Ìnà tí a ń ṣàkóso fò pa dà ṣáájú kí o tó fọwọ́sí.",
    step02Title: "Pípín fi òpópónà",
    step02Body:
      "A fi ìpolówó láàrín fèrèsé iṣẹ́; àmì gbígbà gba kọ sí àkọsílẹ̀ rẹ ní àkókò gidi.",
    step03Title: "Àmì àkókò gidi, ní ẹ̀gbẹ́ méjèèjì",
    step03Body:
      "Olùráńṣẹ́ àti olùgbà rí ìṣẹ̀lẹ̀ kan náà. Ìfojúsọ́nà dé nípasẹ̀ òwe àkàǹtì HenryCo rẹ.",
    step04Title: "Ẹ̀rí ìfijiṣẹ́, tí a gbà",
    step04Body:
      "Orúkọ olùgbà, àkókò, àti ọ̀nà gbígbà ní fipamọ́ sí àkọsílẹ̀ gbígbé — ó hàn ní ojú-ìwé ìtọpa.",
  },
  spotlight: {
    eyebrow: "Ìduró HenryCo",
    title:
      "Iṣẹ́ máa ń wà ní tútù nítorí pẹpẹ jẹ́ kí ó rọrùn láti ṣe ohun tó tọ́.",
    body:
      "Káàdì oye ìnà tí a ń ṣàkóso, àwọn àmì tí kò ṣe é yí padà, àti àkàǹtì kan tí a ń pín ń yọ gbèsè iṣẹ́ tí ó ń ba ìrírí alágbára jẹ́ jẹ́ẹ́jẹ́ẹ́.",
    honestEtaTitle: "Àkókò ìdégbé tó dájú",
    honestEtaBody:
      "Fèrèsé ìlérí láti inú dátà òpópónà gidi ni, kì í ṣe láti inú ìfojú-sọ́nà. A ń kọ ìfàsẹ́yìn àti ṣàlàyé.",
    proofTitle: "Ẹ̀rí, kì í ṣe ìlérí",
    proofBody:
      "Gbogbo ìfijiṣẹ́ ń kọ sí ìwé ìṣẹ̀lẹ̀ tí kò ṣe é yí padà. Ẹ̀rí ìfijiṣẹ́ jẹ́ ẹ̀yà ọjà, kì í ṣe àfikún tikẹ́ẹ̀tì.",
    accountTitle: "Àkàǹtì kan, owó kan",
    accountBody:
      "Àwọn oníbàárà tún lo àkàǹtì HenryCo tí wọ́n ti ní ìgbẹ́kẹ̀lé. Àwọn olùṣiṣẹ́ ń tún ṣe ní ibìkan lórí gbogbo ìpín.",
  },
  faq: {
    kicker: "Àwọn ìbéèrè ṣáájú ìpèsè",
    title: "Àwọn ìdáhùn olódodo, ṣáájú àṣẹ.",
    metaContactPrefix: "Kàn sí {brand}",
    body:
      "Bí òpópónà, àpèjúwe ìdìpọ̀, tàbí ìnà ìkélé bá jáde nínú àwọn FAQ, tábìlì àwọn iṣẹ́ òwò gbà á. Ìdíyelé tí ó nílò ènìyàn kì í ṣe ọjà tí ó yàtọ̀ — ó ń gbé lórí àkọsílẹ̀ gbígbé kan náà nígbà tí ó bá yípadà.",
    emailPrefix: "Fi imeèlì ránṣẹ́ sí {brand}",
    accountCta: "Ṣí ibùdó àkàǹtì",
  },
  faqItems: {
    quoteQ: "Ṣé àwọn oníbàárà lè béèrè ìdíyelé ṣáájú ìpèsè?",
    quoteA:
      "Bẹ́ẹ̀ ni. Ìdíyelé àti ìpèsè pín ọ̀nà ìkọ́ gbígbé kan náà. Ipò ìdíyelé ń fipamọ́ ìfẹ́, ń ṣírò ìnà, ó sì dúró ṣáájú sísanwó.",
    trackingQ: "Báwo ni a ṣe ń dáàbò bo ìtọpa?",
    trackingA:
      "Ìtọpa ìbúgbáù ń lo koodu ìtọpa pẹ̀lú nọ́mbà fóònù olùráńṣẹ́ tàbí olùgbà. Àwọn oníbàárà tí ó wọlé tún rí gbogbo gbígbé tí ó so mọ́ ID wọn tàbí imeèlì tí a ṣe láàmí.",
    riderIssueQ: "Kí ló ń ṣẹlẹ̀ nígbà tí ọmọkùnrin ìgbéjáde bá ní ìṣòro?",
    riderIssueA:
      "Àwọn ọmọkùnrin ìgbéjáde lè gbé ìṣòro tí a ṣe àgbékalẹ̀ sókè látinú iṣẹ́ wọn. Pípín àti àtìlẹ́yìn gba ìgbéga náà, a sì ń kọ gbogbo igbésẹ̀ ìpinnu padà sí ìtàn gbígbé.",
    repeatRoutesQ: "Ṣé pẹpẹ ń tì àwọn ọ̀nà tí àwọn iléeṣẹ́ máa ń tún lò?",
    repeatRoutesA:
      "Bẹ́ẹ̀ ni. A kọ àwòṣe dátà àti ètò ìpèsè láti tì àwọn àdírẹ́sì tí a tún ń lò, ìpolówó iléeṣẹ́ tí ó tún ń wáyé, àti àwọn ìfilọ́ ní àpapọ̀ ní ọjọ́ iwájú.",
  },
};

const LOGISTICS_HOME_COPY_HA: DeepPartial<LogisticsHomeCopy> = {
  metadata: {
    title: "Henry Onyx Logistics — sashin ƙarshe mai natsuwa, ana ganinsa daga farko zuwa ƙarshe",
    description:
      "Lokutan ETA na gaskiya, farashi mai sarrafawa, da tabbacin isarwa akan kowace jigila. Yi rajista, nemi farashi, ko bibiyi isarwa ta Henry Onyx Logistics.",
  },
  hero: {
    eyebrow: "Ɗauka · Aikawa · Tabbaci",
    title: "Sashin ƙarshe mai natsuwa, ana ganinsa daga farko zuwa ƙarshe.",
    blurb:
      "An gina shi don mutane da kasuwanci waɗanda suke buƙatar ETA na gaskiya, mika-makamai mai tsabta, da kwarewar abokin ciniki da ke kasancewa mai daraja koda kuwa aiki ya yi hayaniya.",
    bookCta: "Yi rajistar isarwa",
    quoteCta: "Nemi farashi",
    trackCta: "Bibiyi jigila",
  },
  coverage: {
    one: "Muna aiki a {zone}",
    two: "Muna aiki a {first} da {second}",
    many: "Muna aiki a {head} da {tail}",
    twoJoiner: " da ",
    manyTail: " da ",
  },
  metrics: {
    activeLanesLabel: "Hanyoyi masu aiki",
    activeLanesAwaiting: "Ana jiran hanya ta farko",
    activeLanesAcrossOne: "A yanki {count}",
    activeLanesAcrossMany: "A yankuna {count}",
    activeLanesNamedToday: "{count} an ambata yau",
    activeLanesZoneSingular: "yanki",
    activeLanesZonePlural: "yankuna",
    serviceTiersLabel: "Matakan sabis",
    serviceTiersTrend: "A rana ɗaya, an tsara, aikawa, tsakanin-birni",
    fastestWindowLabel: "Mafi sauri taga",
    fastestWindowDash: "—",
    fastestWindowTrendGoverned: "Ana sarrafa shi ta amincewar hanya",
    fastestWindowTrendAwaiting: "Ana jiran kunna yanki",
    operatingHoursLabel: "Lokutan aiki",
    operatingHoursDailyFallback: "Kullum",
  },
  why: {
    kicker: "Me ya sa ƙungiyoyi suke canzawa",
    title: "Samfurin aiki ɗaya. Mai gaskiya ta zane.",
    body:
      "Katunan farashi da ake sarrafawa, alamomin da ba sa canzawa, da asusu ɗaya da aka raba suna cire bashin aikin da ke zubar da kwarewa mai daraja a hankali. Tunani ɗaya na aikawa na rana ɗaya, an tsara, aikawa, da tsakanin-birni — alamar tabbatarwa ɗaya mai natsuwa.",
    audienceTitle: "Ga wa ake yi",
    audienceBody:
      "Maido da kayayyaki na ƙananan kasuwanci, alamun da masu kafa suke jagoranta, sabis na ƙwararru, da sashen HenryCo waɗanda ke buƙatar ɗauka da isarwa da ake iya hasashe a ma'auni.",
    trackingTitle: "Yadda bibiya ke aiki",
    proofTitle: "Tabbaci da lissafi",
    proofBody:
      "Alamomin suna rubuta a cikin littafin abubuwan da ba sa canzawa. Tabbacin isarwa wani ɓangare ne na samfurin, ba abin da aka ƙara ba.",
  },
  lanes: {
    kicker: "Hanyoyin aiki",
    title: "Siffofin hanyoyi huɗu. Tsarin alkawari ɗaya.",
    metaTiersLabel: "Matakai {count} · farashi mai sarrafawa",
  },
  flow: {
    kicker: "Daga buƙata zuwa ƙofa",
    title: "Kowane mataki ana ganinsa, kowace alama tana da alamar lokaci.",
    stepLabel: "Mataki",
    step01Title: "Aika farashi ko rajista",
    step01Body:
      "Adireshi biyu, bayanin fakiti, da matakin sabis. Farashin da ake sarrafawa yana komawa kafin ka tabbatar.",
    step02Title: "Aikawa yana sanya hanyar",
    step02Body:
      "Hanyar ana sanya ta cikin tagayar aiki; an rubuta alamar ɗauka kai tsaye akan layin lokacin ka.",
    step03Title: "Alamomi kai tsaye, bangarorin biyu",
    step03Body:
      "Mai aiko da kuma mai karɓa suna ganin abubuwan da suka faru iri ɗaya. Sabuntawa tana zuwa ta hanyar tarukan asusun HenryCo naka.",
    step04Title: "Tabbacin isarwa, an kama",
    step04Body:
      "Sunan mai karɓa, lokaci, da hanyar kamawa ana ajiyewa cikin tarihin jigila — ana iya gani a shafin bibiya.",
  },
  spotlight: {
    eyebrow: "Matsayin HenryCo",
    title:
      "Ayyuka suna kasancewa cikin nutsuwa saboda dandalin yana sa yin abu daidai ya yi arha.",
    body:
      "Katunan farashi da ake sarrafawa, alamomin da ba sa canzawa, da asusu ɗaya da aka raba suna cire bashin aikin da ke zubar da kwarewa mai daraja a hankali.",
    honestEtaTitle: "ETA na gaskiya",
    honestEtaBody:
      "Tagayar alkawari tana zuwa daga ainihin bayanan hanya, ba daga tsammanin kyakkyawan fata ba. Jinkiri ana yi masa rajista da bayani.",
    proofTitle: "Tabbaci, ba alkawura ba",
    proofBody:
      "Kowace mika-makamai ana rubuta ta cikin littafi da ba ya canzawa. Tabbacin isarwa siffa ce ta samfurin, ba haɗe da tikit ba.",
    accountTitle: "Asusu ɗaya, lissafi ɗaya",
    accountBody:
      "Abokan ciniki suna sake amfani da asusun HenryCo da suka riga sun amince da shi. Masu aiki suna daidaita a wuri ɗaya a duk sassan.",
  },
  faq: {
    kicker: "Tambayoyi kafin a yi rajista",
    title: "Amsoshin gaskiya, kafin oda.",
    metaContactPrefix: "Tuntuɓi {brand}",
    body:
      "Idan hanya, bayanin fakiti, ko farashin kwangila ya wuce FAQ, sashin kasuwanci yana ɗauka. Farashin da ke buƙatar mutum ba samfuri ne dabam ba — suna zaune akan tarihin jigila iri ɗaya idan an juya.",
    emailPrefix: "Aika email zuwa {brand}",
    accountCta: "Buɗe cibiyar asusu",
  },
  faqItems: {
    quoteQ: "Abokan ciniki za su iya neman farashi kafin rajista?",
    quoteA:
      "Eh. Farashi da rajista suna raba mai gina jigila iri ɗaya. Yanayin farashi yana adana niyya, yana ƙididdige farashi, sai ya tsaya kafin biya.",
    trackingQ: "Yaya ake kare bibiya?",
    trackingA:
      "Bibiya ta jama'a tana amfani da lambar bibiya tare da lambar wayar mai aikawa ko mai karɓa. Abokan da suka shiga kuma suna ganin kowace jigila da aka haɗa da ID ɗinsu ko email da aka daidaita.",
    riderIssueQ: "Me ke faruwa idan ɗan kasuwa ya ci karo da matsala?",
    riderIssueA:
      "‘Yan kasuwa za su iya ɗaga matsaloli masu tsari kai tsaye daga aikinsu. Aikawa da goyon baya suna karɓar haɓakawa, kuma kowane mataki na warwarewa ana yin rajistarsa a kan layin lokacin jigila.",
    repeatRoutesQ: "Dandalin yana tallafa wa hanyoyin kasuwanci masu maimaitawa?",
    repeatRoutesA:
      "Eh. Samfurin bayanai da kwararar rajista an gina su don tallafa wa adireshi masu maimaitawa, hanyoyin kasuwanci masu maimaituwa, da masu shigarwa a nan gaba.",
  },
};

const LOGISTICS_HOME_LOCALE_MAP: Partial<
  Record<AppLocale, DeepPartial<LogisticsHomeCopy>>
> = {
  fr: LOGISTICS_HOME_COPY_FR,
  es: LOGISTICS_HOME_COPY_ES,
  pt: LOGISTICS_HOME_COPY_PT,
  ar: LOGISTICS_HOME_COPY_AR,
  de: LOGISTICS_HOME_COPY_DE,
  it: LOGISTICS_HOME_COPY_IT,
  zh: LOGISTICS_HOME_COPY_ZH,
  hi: LOGISTICS_HOME_COPY_HI,
  ig: LOGISTICS_HOME_COPY_IG,
  yo: LOGISTICS_HOME_COPY_YO,
  ha: LOGISTICS_HOME_COPY_HA,
};

export function getLogisticsHomeCopy(locale: AppLocale): LogisticsHomeCopy {
  const overrides = LOGISTICS_HOME_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      LOGISTICS_HOME_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as LogisticsHomeCopy;
  }
  return LOGISTICS_HOME_COPY_EN;
}

/** @internal */
export function __dangerouslyGetEnglishLogisticsHomeCopy(): LogisticsHomeCopy {
  return LOGISTICS_HOME_COPY_EN;
}
