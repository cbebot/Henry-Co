import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * LogisticsBookCopy — i18n surface for the /book page on the Logistics
 * division. Covers the hero, the "what we'll need from you" requirements,
 * the booking details heading, the "after you submit" step list, the
 * recipient-privacy callout, the "already have a tracking code?" section,
 * route metadata, and a single saved-address fallback label.
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each locale is
 * a Partial that deep-merges over EN so missing keys fall through to EN
 * silently. Mirrors the shape of `hub-public-copy.ts`.
 */
export type LogisticsBookCopy = {
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    meta: string;
  };
  requirements: {
    eyebrow: string;
    pickupDropoffTitle: string;
    pickupDropoffBody: string;
    parcelProfileTitle: string;
    parcelProfileBody: string;
    serviceTierTitle: string;
    serviceTierBody: string;
  };
  form: {
    heading: string;
  };
  afterSubmit: {
    eyebrow: string;
    stepLabel: string;
    step1Title: string;
    step1Body: string;
    step2Title: string;
    step2Body: string;
    step3Title: string;
    step3Body: string;
    step4Title: string;
    step4Body: string;
  };
  privacy: {
    eyebrow: string;
    body: string;
  };
  trackCta: {
    eyebrow: string;
    title: string;
    body: string;
    trackButton: string;
    quoteButton: string;
  };
  savedAddress: {
    fallbackLabel: string;
  };
};

const LOGISTICS_BOOK_COPY_EN: LogisticsBookCopy = {
  metadata: {
    title: "Book a delivery | Henry Onyx Logistics",
    description:
      "Submit a pickup and delivery request with governed pricing and live tracking.",
  },
  hero: {
    eyebrow: "Pickup · Dispatch · Proof",
    title: "Book a delivery.",
    subtitle:
      "Sender, recipient, and where to meet both sides. Tracking code is issued immediately; milestones update as dispatch progresses.",
    meta: "Governed pricing · Live milestones · Proof at delivery",
  },
  requirements: {
    eyebrow: "What we’ll need from you",
    pickupDropoffTitle: "Pickup and dropoff",
    pickupDropoffBody:
      "Two clean addresses with the right contact name and phone for each end.",
    parcelProfileTitle: "Parcel profile",
    parcelProfileBody:
      "Weight band, dimensions if oversized, and any handling notes (fragile, cold, document).",
    serviceTierTitle: "Service tier",
    serviceTierBody:
      "Standard, express, or scheduled — pick the timing both sides can hold to.",
  },
  form: {
    heading: "Booking details",
  },
  afterSubmit: {
    eyebrow: "After you submit",
    stepLabel: "Step",
    step1Title: "Tracking code on screen",
    step1Body:
      "You see it the moment the booking is recorded — no email wait. Save it or share with the recipient.",
    step2Title: "Dispatch picks it up",
    step2Body:
      "Routing assigns within the operating window; pickup milestone writes live to the timeline.",
    step3Title: "Both sides stay informed",
    step3Body:
      "Sender and recipient see the same milestones. Updates land via SMS or in your HenryCo account thread.",
    step4Title: "Proof of delivery on arrival",
    step4Body:
      "Recipient name, time, and capture method save to the shipment record — visible immediately on the track page.",
  },
  privacy: {
    eyebrow: "Recipient privacy",
    body: "Phone numbers are used to authorise tracking lookups and surface milestones — not shared with third parties. Both sides can revoke updates from their thread.",
  },
  trackCta: {
    eyebrow: "Already have a tracking code?",
    title: "Pick up where the last shipment left off.",
    body: "Status, proof of delivery, and any active exception live on the track page. Account holders also see logistics activity inside their HenryCo support thread.",
    trackButton: "Track a shipment",
    quoteButton: "Get a quote first",
  },
  savedAddress: {
    fallbackLabel: "Saved address",
  },
};

const LOGISTICS_BOOK_COPY_FR: DeepPartial<LogisticsBookCopy> = {
  metadata: {
    title: "Réserver une livraison | Henry Onyx Logistics",
    description:
      "Soumettez une demande d’enlèvement et de livraison avec une tarification encadrée et un suivi en direct.",
  },
  hero: {
    eyebrow: "Enlèvement · Expédition · Preuve",
    title: "Réservez une livraison.",
    subtitle:
      "Expéditeur, destinataire et points de rencontre des deux côtés. Le code de suivi est émis immédiatement ; les jalons se mettent à jour au fil de l’expédition.",
    meta: "Tarification encadrée · Jalons en direct · Preuve à la livraison",
  },
  requirements: {
    eyebrow: "Ce dont nous avons besoin",
    pickupDropoffTitle: "Enlèvement et dépôt",
    pickupDropoffBody:
      "Deux adresses claires avec le bon nom de contact et le bon téléphone pour chaque extrémité.",
    parcelProfileTitle: "Profil du colis",
    parcelProfileBody:
      "Tranche de poids, dimensions si hors gabarit, et toute consigne de manutention (fragile, froid, document).",
    serviceTierTitle: "Niveau de service",
    serviceTierBody:
      "Standard, express ou programmé — choisissez le créneau que les deux parties peuvent tenir.",
  },
  form: {
    heading: "Détails de la réservation",
  },
  afterSubmit: {
    eyebrow: "Après l’envoi",
    stepLabel: "Étape",
    step1Title: "Code de suivi à l’écran",
    step1Body:
      "Vous le voyez dès que la réservation est enregistrée — pas d’attente d’e-mail. Sauvegardez-le ou partagez-le avec le destinataire.",
    step2Title: "L’expédition prend le relais",
    step2Body:
      "L’acheminement est affecté dans la fenêtre opérationnelle ; le jalon d’enlèvement s’écrit en direct sur la chronologie.",
    step3Title: "Les deux parties restent informées",
    step3Body:
      "Expéditeur et destinataire voient les mêmes jalons. Les mises à jour arrivent par SMS ou dans votre fil d’assistance HenryCo.",
    step4Title: "Preuve de livraison à l’arrivée",
    step4Body:
      "Nom du destinataire, heure et mode de capture sont enregistrés dans le dossier d’expédition — visibles immédiatement sur la page de suivi.",
  },
  privacy: {
    eyebrow: "Confidentialité du destinataire",
    body: "Les numéros de téléphone servent à autoriser les recherches de suivi et à afficher les jalons — ils ne sont pas partagés avec des tiers. Chaque partie peut révoquer les mises à jour depuis son fil.",
  },
  trackCta: {
    eyebrow: "Vous avez déjà un code de suivi ?",
    title: "Reprenez là où la dernière expédition s’est arrêtée.",
    body: "Statut, preuve de livraison et toute exception active vivent sur la page de suivi. Les titulaires de compte voient aussi l’activité logistique dans leur fil d’assistance HenryCo.",
    trackButton: "Suivre une expédition",
    quoteButton: "Obtenir d’abord un devis",
  },
  savedAddress: {
    fallbackLabel: "Adresse enregistrée",
  },
};

const LOGISTICS_BOOK_COPY_ES: DeepPartial<LogisticsBookCopy> = {
  metadata: {
    title: "Reservar una entrega | Henry Onyx Logistics",
    description:
      "Envíe una solicitud de recogida y entrega con precios regulados y seguimiento en directo.",
  },
  hero: {
    eyebrow: "Recogida · Despacho · Prueba",
    title: "Reserve una entrega.",
    subtitle:
      "Remitente, destinatario y dónde encontrarse en cada extremo. El código de seguimiento se emite de inmediato; los hitos se actualizan a medida que avanza el despacho.",
    meta: "Precios regulados · Hitos en directo · Prueba en la entrega",
  },
  requirements: {
    eyebrow: "Lo que necesitamos de usted",
    pickupDropoffTitle: "Recogida y entrega",
    pickupDropoffBody:
      "Dos direcciones claras con el nombre de contacto y el teléfono correctos para cada extremo.",
    parcelProfileTitle: "Perfil del paquete",
    parcelProfileBody:
      "Rango de peso, dimensiones si es sobredimensionado y cualquier nota de manejo (frágil, frío, documento).",
    serviceTierTitle: "Nivel de servicio",
    serviceTierBody:
      "Estándar, exprés o programado — elija el plazo que ambas partes puedan respetar.",
  },
  form: {
    heading: "Detalles de la reserva",
  },
  afterSubmit: {
    eyebrow: "Después de enviar",
    stepLabel: "Paso",
    step1Title: "Código de seguimiento en pantalla",
    step1Body:
      "Lo verá en el momento en que se registre la reserva — sin esperar un correo. Guárdelo o compártalo con el destinatario.",
    step2Title: "El despacho lo recoge",
    step2Body:
      "El enrutamiento se asigna dentro de la franja operativa; el hito de recogida se escribe en directo en la línea de tiempo.",
    step3Title: "Ambas partes se mantienen informadas",
    step3Body:
      "Remitente y destinatario ven los mismos hitos. Las actualizaciones llegan por SMS o en su hilo de cuenta HenryCo.",
    step4Title: "Prueba de entrega al llegar",
    step4Body:
      "El nombre del destinatario, la hora y el método de captura se guardan en el registro del envío — visibles de inmediato en la página de seguimiento.",
  },
  privacy: {
    eyebrow: "Privacidad del destinatario",
    body: "Los números de teléfono se usan para autorizar consultas de seguimiento y mostrar hitos — no se comparten con terceros. Ambas partes pueden revocar las actualizaciones desde su hilo.",
  },
  trackCta: {
    eyebrow: "¿Ya tiene un código de seguimiento?",
    title: "Continúe donde se quedó el último envío.",
    body: "Estado, prueba de entrega y cualquier excepción activa están en la página de seguimiento. Los titulares de cuenta también ven la actividad logística en su hilo de soporte HenryCo.",
    trackButton: "Seguir un envío",
    quoteButton: "Obtener primero un presupuesto",
  },
  savedAddress: {
    fallbackLabel: "Dirección guardada",
  },
};

const LOGISTICS_BOOK_COPY_PT: DeepPartial<LogisticsBookCopy> = {
  metadata: {
    title: "Reservar uma entrega | Henry Onyx Logistics",
    description:
      "Envie um pedido de recolha e entrega com preços regulamentados e rastreamento em tempo real.",
  },
  hero: {
    eyebrow: "Recolha · Despacho · Comprovativo",
    title: "Reserve uma entrega.",
    subtitle:
      "Remetente, destinatário e onde encontrar cada lado. O código de rastreamento é emitido de imediato; os marcos atualizam à medida que o despacho avança.",
    meta: "Preços regulamentados · Marcos em tempo real · Comprovativo na entrega",
  },
  requirements: {
    eyebrow: "O que precisamos de si",
    pickupDropoffTitle: "Recolha e entrega",
    pickupDropoffBody:
      "Duas moradas claras com o nome de contacto e telefone certos para cada ponta.",
    parcelProfileTitle: "Perfil da encomenda",
    parcelProfileBody:
      "Faixa de peso, dimensões se for sobredimensionado e quaisquer notas de manuseio (frágil, frio, documento).",
    serviceTierTitle: "Nível de serviço",
    serviceTierBody:
      "Standard, expresso ou agendado — escolha o horário que ambos os lados conseguem cumprir.",
  },
  form: {
    heading: "Detalhes da reserva",
  },
  afterSubmit: {
    eyebrow: "Depois de enviar",
    stepLabel: "Passo",
    step1Title: "Código de rastreamento no ecrã",
    step1Body:
      "Vê-o assim que a reserva é registada — sem esperar por e-mail. Guarde-o ou partilhe com o destinatário.",
    step2Title: "O despacho recolhe",
    step2Body:
      "O encaminhamento é atribuído dentro da janela operacional; o marco de recolha é escrito ao vivo na cronologia.",
    step3Title: "Ambos os lados ficam informados",
    step3Body:
      "Remetente e destinatário veem os mesmos marcos. As atualizações chegam por SMS ou no seu tópico de conta HenryCo.",
    step4Title: "Comprovativo de entrega à chegada",
    step4Body:
      "Nome do destinatário, hora e método de captura ficam guardados no registo do envio — visíveis de imediato na página de rastreamento.",
  },
  privacy: {
    eyebrow: "Privacidade do destinatário",
    body: "Os números de telefone são usados para autorizar consultas de rastreamento e mostrar marcos — não são partilhados com terceiros. Ambos os lados podem revogar atualizações no seu tópico.",
  },
  trackCta: {
    eyebrow: "Já tem um código de rastreamento?",
    title: "Continue de onde o último envio parou.",
    body: "Estado, comprovativo de entrega e qualquer exceção ativa vivem na página de rastreamento. Os titulares de conta também veem a atividade logística no seu tópico de apoio HenryCo.",
    trackButton: "Rastrear um envio",
    quoteButton: "Obter primeiro um orçamento",
  },
  savedAddress: {
    fallbackLabel: "Morada guardada",
  },
};

const LOGISTICS_BOOK_COPY_AR: DeepPartial<LogisticsBookCopy> = {
  metadata: {
    title: "حجز عملية توصيل | Henry Onyx Logistics",
    description:
      "أرسل طلب استلام وتوصيل بتسعير منضبط ومتابعة لحظية.",
  },
  hero: {
    eyebrow: "استلام · إرسال · إثبات",
    title: "احجز عملية توصيل.",
    subtitle:
      "المُرسِل والمستلِم ونقطتا اللقاء على الطرفين. يصدر رمز التتبع على الفور، وتُحدَّث المراحل مع تقدّم الإرسال.",
    meta: "تسعير منضبط · مراحل لحظية · إثبات عند التسليم",
  },
  requirements: {
    eyebrow: "ما نحتاجه منك",
    pickupDropoffTitle: "الاستلام والتسليم",
    pickupDropoffBody:
      "عنوانان واضحان مع اسم جهة الاتصال والهاتف الصحيحين لكل طرف.",
    parcelProfileTitle: "بيانات الطرد",
    parcelProfileBody:
      "نطاق الوزن، والأبعاد إن كان كبير الحجم، وأي ملاحظات للمناولة (هشّ، مبرّد، وثيقة).",
    serviceTierTitle: "مستوى الخدمة",
    serviceTierBody:
      "قياسي أو سريع أو مجدول — اختر التوقيت الذي يستطيع الطرفان الالتزام به.",
  },
  form: {
    heading: "تفاصيل الحجز",
  },
  afterSubmit: {
    eyebrow: "بعد الإرسال",
    stepLabel: "الخطوة",
    step1Title: "رمز التتبع على الشاشة",
    step1Body:
      "تراه في اللحظة التي يُسجَّل فيها الحجز — دون انتظار بريد إلكتروني. احفظه أو شاركه مع المستلِم.",
    step2Title: "الإرسال يستلم الطرد",
    step2Body:
      "يُسنَد التوجيه ضمن نافذة التشغيل، وتُدوَّن مرحلة الاستلام لحظيًا في الجدول الزمني.",
    step3Title: "الطرفان على اطلاع دائم",
    step3Body:
      "يرى المُرسِل والمستلِم المراحل نفسها. تصل التحديثات عبر الرسائل النصية أو في مسار حسابك على HenryCo.",
    step4Title: "إثبات التسليم عند الوصول",
    step4Body:
      "اسم المستلِم والوقت وطريقة الإثبات تُحفَظ في سجل الشحنة — وتظهر فورًا في صفحة التتبع.",
  },
  privacy: {
    eyebrow: "خصوصية المستلِم",
    body: "تُستخدم أرقام الهاتف لاعتماد عمليات البحث في التتبع وإظهار المراحل — ولا تُشارَك مع أطراف ثالثة. يمكن لكل طرف إلغاء التحديثات من مساره.",
  },
  trackCta: {
    eyebrow: "لديك رمز تتبع بالفعل؟",
    title: "تابع من حيث توقفت آخر شحنة.",
    body: "الحالة وإثبات التسليم وأي استثناء قائم متاحة في صفحة التتبع. كما يرى أصحاب الحسابات نشاط الخدمات اللوجستية ضمن مسار الدعم على HenryCo.",
    trackButton: "تتبع شحنة",
    quoteButton: "اطلب عرض سعر أولاً",
  },
  savedAddress: {
    fallbackLabel: "عنوان محفوظ",
  },
};

const LOGISTICS_BOOK_COPY_DE: DeepPartial<LogisticsBookCopy> = {
  metadata: {
    title: "Lieferung buchen | Henry Onyx Logistics",
    description:
      "Senden Sie eine Abhol- und Lieferanfrage mit kontrollierten Preisen und Live-Tracking.",
  },
  hero: {
    eyebrow: "Abholung · Versand · Nachweis",
    title: "Buchen Sie eine Lieferung.",
    subtitle:
      "Absender, Empfänger und der Treffpunkt auf beiden Seiten. Der Tracking-Code wird sofort vergeben; die Meilensteine aktualisieren sich, während der Versand läuft.",
    meta: "Geregelte Preise · Live-Meilensteine · Nachweis bei Lieferung",
  },
  requirements: {
    eyebrow: "Was wir von Ihnen brauchen",
    pickupDropoffTitle: "Abholung und Zustellung",
    pickupDropoffBody:
      "Zwei saubere Adressen mit dem richtigen Kontaktnamen und Telefon für jedes Ende.",
    parcelProfileTitle: "Sendungsprofil",
    parcelProfileBody:
      "Gewichtsklasse, Maße bei Übergröße sowie Hinweise zum Handling (zerbrechlich, gekühlt, Dokument).",
    serviceTierTitle: "Service-Stufe",
    serviceTierBody:
      "Standard, Express oder geplant — wählen Sie das Zeitfenster, das beide Seiten halten können.",
  },
  form: {
    heading: "Buchungsdetails",
  },
  afterSubmit: {
    eyebrow: "Nach dem Absenden",
    stepLabel: "Schritt",
    step1Title: "Tracking-Code auf dem Bildschirm",
    step1Body:
      "Sie sehen ihn in dem Moment, in dem die Buchung erfasst wird — ohne auf eine E-Mail zu warten. Speichern Sie ihn oder teilen Sie ihn mit dem Empfänger.",
    step2Title: "Der Versand übernimmt",
    step2Body:
      "Die Disposition erfolgt innerhalb des Betriebsfensters; der Abholmeilenstein wird live in den Zeitstrahl geschrieben.",
    step3Title: "Beide Seiten bleiben informiert",
    step3Body:
      "Absender und Empfänger sehen dieselben Meilensteine. Updates kommen per SMS oder in Ihrem HenryCo-Kontofaden an.",
    step4Title: "Zustellnachweis bei Ankunft",
    step4Body:
      "Empfängername, Uhrzeit und Erfassungsmethode werden im Sendungsdatensatz gespeichert — sofort sichtbar auf der Tracking-Seite.",
  },
  privacy: {
    eyebrow: "Privatsphäre des Empfängers",
    body: "Telefonnummern dienen dazu, Tracking-Abfragen zu autorisieren und Meilensteine anzuzeigen — sie werden nicht an Dritte weitergegeben. Beide Seiten können Updates aus ihrem Faden widerrufen.",
  },
  trackCta: {
    eyebrow: "Sie haben bereits einen Tracking-Code?",
    title: "Setzen Sie dort an, wo die letzte Sendung aufgehört hat.",
    body: "Status, Zustellnachweis und alle aktiven Ausnahmen liegen auf der Tracking-Seite. Kontoinhaber sehen die Logistikaktivität zudem in ihrem HenryCo-Support-Faden.",
    trackButton: "Sendung verfolgen",
    quoteButton: "Erst ein Angebot einholen",
  },
  savedAddress: {
    fallbackLabel: "Gespeicherte Adresse",
  },
};

const LOGISTICS_BOOK_COPY_IT: DeepPartial<LogisticsBookCopy> = {
  metadata: {
    title: "Prenota una consegna | Henry Onyx Logistics",
    description:
      "Invia una richiesta di ritiro e consegna con tariffe regolate e tracciamento in tempo reale.",
  },
  hero: {
    eyebrow: "Ritiro · Spedizione · Prova",
    title: "Prenota una consegna.",
    subtitle:
      "Mittente, destinatario e dove incontrarsi su entrambi i lati. Il codice di tracciamento viene emesso subito; le tappe si aggiornano man mano che la spedizione procede.",
    meta: "Tariffe regolate · Tappe in tempo reale · Prova alla consegna",
  },
  requirements: {
    eyebrow: "Cosa ci serve da te",
    pickupDropoffTitle: "Ritiro e consegna",
    pickupDropoffBody:
      "Due indirizzi chiari con il nome di contatto e il telefono corretti per ciascuna estremità.",
    parcelProfileTitle: "Profilo del collo",
    parcelProfileBody:
      "Fascia di peso, dimensioni se fuori misura e note di gestione (fragile, refrigerato, documento).",
    serviceTierTitle: "Livello di servizio",
    serviceTierBody:
      "Standard, espresso o programmato — scegli la tempistica che entrambe le parti possono rispettare.",
  },
  form: {
    heading: "Dettagli della prenotazione",
  },
  afterSubmit: {
    eyebrow: "Dopo l’invio",
    stepLabel: "Passo",
    step1Title: "Codice di tracciamento a schermo",
    step1Body:
      "Lo vedi nel momento in cui la prenotazione viene registrata — niente attese di e-mail. Salvalo o condividilo con il destinatario.",
    step2Title: "La spedizione lo prende in carico",
    step2Body:
      "L’instradamento è assegnato nella finestra operativa; la tappa di ritiro viene scritta in tempo reale nella cronologia.",
    step3Title: "Entrambe le parti restano informate",
    step3Body:
      "Mittente e destinatario vedono le stesse tappe. Gli aggiornamenti arrivano via SMS o nel thread del tuo account HenryCo.",
    step4Title: "Prova di consegna all’arrivo",
    step4Body:
      "Nome del destinatario, orario e metodo di acquisizione sono salvati nel record della spedizione — visibili subito nella pagina di tracciamento.",
  },
  privacy: {
    eyebrow: "Privacy del destinatario",
    body: "I numeri di telefono servono ad autorizzare le ricerche di tracciamento e a mostrare le tappe — non sono condivisi con terzi. Entrambe le parti possono revocare gli aggiornamenti dal proprio thread.",
  },
  trackCta: {
    eyebrow: "Hai già un codice di tracciamento?",
    title: "Riprendi da dove si è fermata l’ultima spedizione.",
    body: "Stato, prova di consegna ed eventuali eccezioni attive vivono nella pagina di tracciamento. I titolari di account vedono anche l’attività logistica nel thread di assistenza HenryCo.",
    trackButton: "Traccia una spedizione",
    quoteButton: "Prima ottieni un preventivo",
  },
  savedAddress: {
    fallbackLabel: "Indirizzo salvato",
  },
};

const LOGISTICS_BOOK_COPY_ZH: DeepPartial<LogisticsBookCopy> = {
  metadata: {
    title: "预约配送 | Henry Onyx Logistics",
    description: "提交取件与配送请求,享受规范定价与实时追踪。",
  },
  hero: {
    eyebrow: "取件 · 派送 · 凭证",
    title: "预约一次配送。",
    subtitle:
      "寄件人、收件人,以及两端的交接地点。下单即刻生成追踪码,派送推进时同步更新各项里程碑。",
    meta: "规范定价 · 实时里程碑 · 送达凭证",
  },
  requirements: {
    eyebrow: "我们需要你提供",
    pickupDropoffTitle: "取件与派送地址",
    pickupDropoffBody:
      "两个清晰的地址,并配上每一端正确的联系人姓名和电话。",
    parcelProfileTitle: "包裹信息",
    parcelProfileBody:
      "重量区间,如有超规请注明尺寸,以及任何搬运备注(易碎、冷链、文件)。",
    serviceTierTitle: "服务等级",
    serviceTierBody: "标准、加急或预约——选择双方都能配合的时间。",
  },
  form: {
    heading: "预约详情",
  },
  afterSubmit: {
    eyebrow: "提交之后",
    stepLabel: "步骤",
    step1Title: "追踪码即刻显示",
    step1Body:
      "预约一经记录便立刻可见,无需等待邮件。请保存或转发给收件人。",
    step2Title: "派送方接单",
    step2Body: "在运营时段内完成调度;取件里程碑实时写入时间线。",
    step3Title: "双方同步知情",
    step3Body:
      "寄件人和收件人看到完全一致的里程碑。更新通过短信或你的 HenryCo 账户线程送达。",
    step4Title: "到达时留存送达凭证",
    step4Body:
      "收件人姓名、时间与确认方式存入运单记录,在追踪页立即可见。",
  },
  privacy: {
    eyebrow: "收件人隐私",
    body: "电话号码仅用于授权追踪查询和展示里程碑——不会与第三方共享。任何一方都可以在自己的线程中撤回更新。",
  },
  trackCta: {
    eyebrow: "已经有追踪码?",
    title: "从上一次配送停下的地方继续。",
    body: "状态、送达凭证以及任何待处理的异常都在追踪页中。账户用户还可以在自己的 HenryCo 支持线程中查看物流记录。",
    trackButton: "追踪一单",
    quoteButton: "先获取报价",
  },
  savedAddress: {
    fallbackLabel: "已保存地址",
  },
};

const LOGISTICS_BOOK_COPY_HI: DeepPartial<LogisticsBookCopy> = {
  metadata: {
    title: "डिलीवरी बुक करें | Henry Onyx Logistics",
    description:
      "नियंत्रित मूल्य निर्धारण और लाइव ट्रैकिंग के साथ पिकअप और डिलीवरी का अनुरोध भेजें।",
  },
  hero: {
    eyebrow: "पिकअप · डिस्पैच · प्रमाण",
    title: "एक डिलीवरी बुक करें।",
    subtitle:
      "भेजने वाला, पाने वाला, और दोनों छोरों पर मिलने की जगह। ट्रैकिंग कोड तुरंत जारी होता है; डिस्पैच आगे बढ़ने पर माइलस्टोन अपडेट होते रहते हैं।",
    meta: "नियंत्रित मूल्य · लाइव माइलस्टोन · डिलीवरी पर प्रमाण",
  },
  requirements: {
    eyebrow: "हमें आपसे क्या चाहिए",
    pickupDropoffTitle: "पिकअप और ड्रॉपऑफ",
    pickupDropoffBody:
      "दो साफ़ पते, हर छोर के लिए सही संपर्क नाम और फ़ोन के साथ।",
    parcelProfileTitle: "पार्सल का विवरण",
    parcelProfileBody:
      "वज़न का दायरा, बड़े आकार पर माप, और कोई हैंडलिंग नोट (नाज़ुक, ठंडा, दस्तावेज़)।",
    serviceTierTitle: "सेवा स्तर",
    serviceTierBody:
      "स्टैंडर्ड, एक्सप्रेस या निर्धारित — वही समय चुनें जिसे दोनों पक्ष निभा सकें।",
  },
  form: {
    heading: "बुकिंग का विवरण",
  },
  afterSubmit: {
    eyebrow: "भेजने के बाद",
    stepLabel: "चरण",
    step1Title: "स्क्रीन पर ट्रैकिंग कोड",
    step1Body:
      "बुकिंग दर्ज होते ही आप उसे देख लेते हैं — ईमेल का इंतज़ार नहीं। उसे सेव करें या पाने वाले से साझा करें।",
    step2Title: "डिस्पैच काम संभालता है",
    step2Body:
      "रूटिंग ऑपरेटिंग विंडो के भीतर तय होती है; पिकअप माइलस्टोन टाइमलाइन पर लाइव दर्ज होता है।",
    step3Title: "दोनों पक्ष जानकारी में रहते हैं",
    step3Body:
      "भेजने और पाने वाले को एक जैसे माइलस्टोन दिखते हैं। अपडेट SMS पर या आपके HenryCo अकाउंट थ्रेड में आते हैं।",
    step4Title: "पहुँचने पर डिलीवरी का प्रमाण",
    step4Body:
      "पाने वाले का नाम, समय और कैप्चर का तरीका शिपमेंट रिकॉर्ड में सेव होते हैं — ट्रैक पेज पर तुरंत दिखते हैं।",
  },
  privacy: {
    eyebrow: "पाने वाले की निजता",
    body: "फ़ोन नंबर का इस्तेमाल ट्रैकिंग लुकअप अधिकृत करने और माइलस्टोन दिखाने के लिए होता है — इन्हें तीसरे पक्ष से साझा नहीं किया जाता। दोनों पक्ष अपने थ्रेड से अपडेट रद्द कर सकते हैं।",
  },
  trackCta: {
    eyebrow: "पहले से ट्रैकिंग कोड है?",
    title: "जहाँ पिछली शिपमेंट छूटी थी, वहाँ से आगे बढ़ें।",
    body: "स्थिति, डिलीवरी का प्रमाण और कोई भी सक्रिय अपवाद ट्रैक पेज पर रहते हैं। अकाउंट धारक अपनी HenryCo सपोर्ट थ्रेड में भी लॉजिस्टिक्स गतिविधि देखते हैं।",
    trackButton: "एक शिपमेंट ट्रैक करें",
    quoteButton: "पहले कोटेशन लें",
  },
  savedAddress: {
    fallbackLabel: "सहेजा गया पता",
  },
};

const LOGISTICS_BOOK_COPY_IG: DeepPartial<LogisticsBookCopy> = {
  metadata: {
    title: "Debe nnyefe | Henry Onyx Logistics",
    description:
      "Zipu arịrịọ nnyefe na nbufe site n’ọnụahịa a chịkwara na nyocha ndụ.",
  },
  hero: {
    eyebrow: "Mbutere · Nzipu · Ihe àmà",
    title: "Debe nnyefe.",
    subtitle:
      "Onye na-ezipu, onye na-anata, na ebe a ga-ezukọ n’akụkụ abụọ. A na-enye koodu nyocha ozugbo; nzọụkwụ ndị ahụ na-emelite ka nzipu na-aga n’ihu.",
    meta: "Ọnụahịa a chịkwara · Nzọụkwụ ndụ · Ihe àmà mgbe e nyefere",
  },
  requirements: {
    eyebrow: "Ihe anyị chọrọ n’aka gị",
    pickupDropoffTitle: "Mbutere na nbufe",
    pickupDropoffBody:
      "Adreesị abụọ doro anya, ya na aha onye ọrụ na ekwentị ziri ezi maka akụkụ ọ bụla.",
    parcelProfileTitle: "Nkọwa ngwugwu",
    parcelProfileBody:
      "Ọtụtụ ịdị arọ, atụaatụ ma ọ buru oké ibu, na ihe ọ bụla a ga-erite aka na ya (na-emebi emebi, oyi, akwụkwọ).",
    serviceTierTitle: "Ọkwa ọrụ",
    serviceTierBody:
      "Nke nkịtị, nke ngwa ngwa, ma ọ bụ nke a haziri ahazi — họrọ oge nke akụkụ abụọ ga-anaghachi.",
  },
  form: {
    heading: "Nkọwa ndebe",
  },
  afterSubmit: {
    eyebrow: "Mgbe i zipusiri",
    stepLabel: "Nzọụkwụ",
    step1Title: "Koodu nyocha n’elu ihuenyo",
    step1Body:
      "Ị na-ahụ ya ozugbo e dekọrọ ndebe ahụ — enweghị nchere email. Chekwaa ya ma ọ bụ kesaa ya onye na-anata.",
    step2Title: "Nzipu ewerewe ya",
    step2Body:
      "A na-eke ụzọ n’ime oge ọrụ; nzọụkwụ mbutere na-edebanye onwe ya ozugbo n’oge eserese.",
    step3Title: "Akụkụ abụọ na-aghọta ọnọdụ",
    step3Body:
      "Onye na-ezipu na onye na-anata na-ahụ otu nzọụkwụ ndị ahụ. Mmelite na-eru site na SMS ma ọ bụ n’ime eriri akaụntụ HenryCo gị.",
    step4Title: "Ihe àmà nnyefe mgbe e rutere",
    step4Body:
      "Aha onye na-anata, oge, na ụzọ e ji wee dekọọ ya, a na-echekwa ha n’ime ndekọ mbufe ahụ — a na-ahụ ha ozugbo na peeji nyocha.",
  },
  privacy: {
    eyebrow: "Nzuzo onye na-anata",
    body: "A na-eji nọmba ekwentị ikwado nyocha na igosi nzọụkwụ — anaghị ekekọrịta ya na ndị ọzọ. Akụkụ abụọ nwere ike ịkagbu mmelite n’eriri ha.",
  },
  trackCta: {
    eyebrow: "Ị nweelarị koodu nyocha?",
    title: "Bido n’ebe mbufe gara aga kwụsịrị.",
    body: "Ọnọdụ, ihe àmà nnyefe, na mfe ọ bụla na-arụ ọrụ na-anọ na peeji nyocha. Ndị nwere akaụntụ na-ahụkwa ọrụ logistics n’ime eriri nkwado HenryCo ha.",
    trackButton: "Soro mbufe",
    quoteButton: "Buru ụzọ nweta ọnụ ahịa",
  },
  savedAddress: {
    fallbackLabel: "Adreesị echekwara",
  },
};

const LOGISTICS_BOOK_COPY_YO: DeepPartial<LogisticsBookCopy> = {
  metadata: {
    title: "Ṣe ìfìránṣẹ́ | Henry Onyx Logistics",
    description:
      "Fi ìbéèrè fún ìgbé àti ìfijiṣẹ́ ránṣẹ́ pẹ̀lú ìṣètò owó tó tọ́ àti tóìṣe-pẹ̀lú-àkókò.",
  },
  hero: {
    eyebrow: "Ìgbé · Ìṣíkiri · Ẹ̀rí",
    title: "Ṣe ìfìránṣẹ́.",
    subtitle:
      "Olùránṣẹ́, olùgbà, àti ibi tí ẹ̀gbẹ́ méjèèjì máa pàdé. A máa ń tu kóòdù àtẹ̀lé jáde lójú ẹsẹ̀; àwọn ìpele máa ń yí padà bí ìṣíkiri ṣe ń lọ síwájú.",
    meta: "Ìṣètò owó tó tọ́ · Àwọn ìpele tó tóìṣe-pẹ̀lú-àkókò · Ẹ̀rí nígbà ìfijiṣẹ́",
  },
  requirements: {
    eyebrow: "Ohun tí a nílò lọ́dọ̀ rẹ",
    pickupDropoffTitle: "Ìgbé àti Ìjùsílẹ̀",
    pickupDropoffBody:
      "Àdírẹ́sì méjì tó pé, pẹ̀lú orúkọ ẹni-tó-jẹ́-ìbáṣepọ̀ àti nọ́mbà tó tọ́ fún ọ̀kọ̀ọ̀kan.",
    parcelProfileTitle: "Àpèjúwe ohun tí à ń rán",
    parcelProfileBody:
      "Ìwọ̀n, ìwọ̀n títẹ́jú bí ó bá tóbi jù, àti àkíyèsí ìmúrasílẹ̀ kankan (ṣe-ifàrabalẹ̀, tútù, ìwé).",
    serviceTierTitle: "Ìpele iṣẹ́",
    serviceTierBody:
      "Aládàáṣe, kíákíá, tàbí àkànṣe — yan àkókò tí ẹ̀gbẹ́ méjèèjì lè dúró tì.",
  },
  form: {
    heading: "Àwọn ẹ̀kúnrẹ́rẹ́ ìfọwọ́sí",
  },
  afterSubmit: {
    eyebrow: "Lẹ́yìn tí o bá fi ránṣẹ́",
    stepLabel: "Ìgbésẹ̀",
    step1Title: "Kóòdù àtẹ̀lé lójú ìfìhàn",
    step1Body:
      "Ìwọ máa rí i ní àsìkò tí a bá ti gba ìfọwọ́sí — kò sí ìdúró fún ímeèlì. Tọ́jú rẹ̀ tàbí pín pẹ̀lú olùgbà.",
    step2Title: "Ìṣíkiri gba á",
    step2Body:
      "A máa ń pín ipa-ọ̀nà nínú àkókò iṣẹ́; ìpele ìgbé máa ń kọ ara rẹ̀ sí àkójọpọ̀ àkókò lójú ẹsẹ̀.",
    step3Title: "Ẹ̀gbẹ́ méjèèjì máa wà nínú ìmọ̀",
    step3Body:
      "Olùránṣẹ́ àti olùgbà máa rí àwọn ìpele kan náà. Ìmúdájú máa ń dé nípasẹ̀ SMS tàbí nínú òdiẹ̀ akáǹtì HenryCo rẹ.",
    step4Title: "Ẹ̀rí ìfijiṣẹ́ nígbà tó bá dé",
    step4Body:
      "Orúkọ olùgbà, àkókò, àti ọ̀nà gbígbà gbogbo máa ń wọ inú àkọsílẹ̀ ìránṣẹ́ — yóò hàn lójú ẹsẹ̀ ní ojú-ìwé àtẹ̀lé.",
  },
  privacy: {
    eyebrow: "Àṣírí olùgbà",
    body: "Nọ́mbà fóònù la ń lò láti gba àwọn ìwádìí àtẹ̀lé àti láti fi àwọn ìpele hàn — a kì í pín wọn pẹ̀lú àwọn ẹlòmíì. Ẹ̀gbẹ́ méjèèjì lè fagilé ìmúdájú láti inú òdiẹ̀ wọn.",
  },
  trackCta: {
    eyebrow: "O ti ní kóòdù àtẹ̀lé tẹ́lẹ̀?",
    title: "Bẹ̀rẹ̀ láti ibi tí ìránṣẹ́ ìkẹyìn ti dúró sí.",
    body: "Ipò, ẹ̀rí ìfijiṣẹ́, àti ìpèníjà tó wà ní iṣẹ́ kankan máa ń wà ní ojú-ìwé àtẹ̀lé. Àwọn tí wọ́n ní akáǹtì máa rí iṣẹ́ logistics pẹ̀lú nínú òdiẹ̀ àtìlẹ́yìn HenryCo wọn.",
    trackButton: "Tẹ̀lé ìránṣẹ́",
    quoteButton: "Kọ́kọ́ gba ìdíyelé",
  },
  savedAddress: {
    fallbackLabel: "Àdírẹ́sì tó tọ́jú",
  },
};

const LOGISTICS_BOOK_COPY_HA: DeepPartial<LogisticsBookCopy> = {
  metadata: {
    title: "Yi rijistar isar da kaya | Henry Onyx Logistics",
    description:
      "Aika buƙatar ɗauka da isar da kaya tare da farashi mai tsari da bibiyar lokaci-lokaci.",
  },
  hero: {
    eyebrow: "Ɗauka · Aikawa · Tabbaci",
    title: "Yi rijistar isar da kaya.",
    subtitle:
      "Mai aikawa, mai karɓa, da inda za ku haɗu a kowane gefe. Ana fitar da lambar bibiya nan take; matakai suna sabuntawa yayin da aiki ke ci gaba.",
    meta: "Farashi mai tsari · Matakai lokaci-lokaci · Tabbaci a lokacin isar",
  },
  requirements: {
    eyebrow: "Abin da muke buƙata daga gare ka",
    pickupDropoffTitle: "Wurin ɗauka da na sauke",
    pickupDropoffBody:
      "Adireshi guda biyu masu tsabta, tare da sunan mai tuntuɓa da lambar waya da suka dace ga kowane gefe.",
    parcelProfileTitle: "Bayanin fakitin",
    parcelProfileBody:
      "Adadin nauyi, girma idan fakitin ya wuce ƙa’ida, da kowane bayanin riƙewa (mai sauƙin karyewa, na sanyi, takarda).",
    serviceTierTitle: "Matakin sabis",
    serviceTierBody:
      "Talakawa, gaggawa, ko an tsara — zaɓi lokacin da gefe biyu suka iya cikawa.",
  },
  form: {
    heading: "Cikakkun bayanan rijista",
  },
  afterSubmit: {
    eyebrow: "Bayan ka aika",
    stepLabel: "Mataki",
    step1Title: "Lambar bibiya a allon",
    step1Body:
      "Za ka gan ta a lokacin da aka rubuta rijistar — ba sai ka jira imel ba. Ajiye ko raba ta da mai karɓa.",
    step2Title: "Sashen aikawa ya karɓa",
    step2Body:
      "Ana ba da hanya cikin lokacin aiki; matakin ɗauka yana rubuta kansa nan take a kan layin lokaci.",
    step3Title: "Gefe biyu suna a kan haka",
    step3Body:
      "Mai aikawa da mai karɓa suna ganin matakai iri ɗaya. Sabuntawa suna zuwa ta SMS ko cikin zaren akwatin HenryCo naka.",
    step4Title: "Tabbacin isar da kaya a isowarsa",
    step4Body:
      "Sunan mai karɓa, lokaci, da hanyar tabbatarwa suna ajiye a cikin rikodin jigilar — suna bayyana nan take a shafin bibiya.",
  },
  privacy: {
    eyebrow: "Sirrin mai karɓa",
    body: "Ana amfani da lambobin waya don bayar da izinin neman bibiya da nuna matakai — ba a raba su da kowa ba. Gefe biyu na iya soke sabuntawa daga zarensu.",
  },
  trackCta: {
    eyebrow: "Ka riga ka sami lambar bibiya?",
    title: "Ci gaba daga inda jigilar da ta gabata ta tsaya.",
    body: "Hali, tabbacin isar da kaya, da kowace matsala mai aiki suna kan shafin bibiya. Masu akwatin kuma suna ganin ayyukan logistics a cikin zaren tallafin HenryCo nasu.",
    trackButton: "Bi jigila",
    quoteButton: "Da farko ka samu farashi",
  },
  savedAddress: {
    fallbackLabel: "Adireshin da aka ajiye",
  },
};

const LOGISTICS_BOOK_LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<LogisticsBookCopy>>> = {
  fr: LOGISTICS_BOOK_COPY_FR,
  es: LOGISTICS_BOOK_COPY_ES,
  pt: LOGISTICS_BOOK_COPY_PT,
  ar: LOGISTICS_BOOK_COPY_AR,
  de: LOGISTICS_BOOK_COPY_DE,
  it: LOGISTICS_BOOK_COPY_IT,
  zh: LOGISTICS_BOOK_COPY_ZH,
  hi: LOGISTICS_BOOK_COPY_HI,
  ig: LOGISTICS_BOOK_COPY_IG,
  yo: LOGISTICS_BOOK_COPY_YO,
  ha: LOGISTICS_BOOK_COPY_HA,
};

export function getLogisticsBookCopy(locale: AppLocale): LogisticsBookCopy {
  const overrides = LOGISTICS_BOOK_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      LOGISTICS_BOOK_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as LogisticsBookCopy;
  }
  return LOGISTICS_BOOK_COPY_EN;
}

/** @internal */
export function __dangerouslyGetEnglishLogisticsBookCopy(): LogisticsBookCopy {
  return LOGISTICS_BOOK_COPY_EN;
}
