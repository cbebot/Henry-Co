import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * CareContactCopy — i18n surface for the Care division public `/contact`
 * page. Covers page metadata, the contact hero, hours/coverage/follow-up
 * rail, the "send a message" section header, direct-channel labels for
 * phone/email/WhatsApp, the tracking-code aside, and the footer CTA.
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each locale is
 * a Partial that deep-merges over EN so missing keys fall through to EN
 * silently. Mirrors the shape of `care-pricing-copy.ts`.
 *
 * Note: the inline `<ContactForm />` is a client component that owns its
 * own form-field strings; this module only carries the page chrome around
 * the form, not the form itself.
 */
export type CareContactCopy = {
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    body: string;
  };
  rail: {
    serviceHoursLabel: string;
    coverageLabel: string;
    coverageValue: string;
    followUpLabel: string;
    followUpValue: string;
    defaultPickupHours: string;
  };
  sendMessage: {
    eyebrow: string;
  };
  channels: {
    eyebrow: string;
    title: string;
    phoneTitle: string;
    phoneBody: string;
    emailTitle: string;
    emailBody: string;
    whatsappTitle: string;
    whatsappBody: string;
    copyLabel: string;
  };
  tracking: {
    eyebrow: string;
    body: string;
    trackLink: string;
    bookLink: string;
  };
  footer: {
    eyebrow: string;
    title: string;
    body: string;
    bookCta: string;
    compareCta: string;
  };
};

const CARE_CONTACT_COPY_EN: CareContactCopy = {
  metadata: {
    title: "Contact",
    description:
      "Booking guidance, schedule changes, billing clarity, or follow-up on an existing service — handled with one consistent thread from first message to final resolution.",
  },
  hero: {
    eyebrow: "Contact and support",
    title: "One desk. Clear answers.",
    body:
      "Booking guidance, schedule changes, billing clarity, or follow-up on an existing service — handled with one consistent thread from first message to final resolution.",
  },
  rail: {
    serviceHoursLabel: "Service hours",
    coverageLabel: "Coverage",
    coverageValue: "Garment, home, and office requests across covered zones",
    followUpLabel: "Follow-up",
    followUpValue: "Logged under one reference per request",
    defaultPickupHours: "Mon - Sat • 8:00 AM to 7:00 PM",
  },
  sendMessage: {
    eyebrow: "Send a message",
  },
  channels: {
    eyebrow: "Direct channels",
    title: "Choose the route that fits the moment.",
    phoneTitle: "Phone support",
    phoneBody:
      "Best for same-day pickup changes, access instructions, urgent service coordination, and anything timing-sensitive.",
    emailTitle: "Email support",
    emailBody:
      "Best for quotes, billing clarity, recurring-plan questions, and anything that benefits from a written record.",
    whatsappTitle: "WhatsApp contact",
    whatsappBody:
      "Useful when the team only needs a quick confirmation or proof-of-payment attachment after earlier guidance.",
    copyLabel: "Copy",
  },
  tracking: {
    eyebrow: "Already have a tracking code?",
    body:
      "Track the service first. In many cases, the latest movement, arrival stage, or completion update will answer the question immediately.",
    trackLink: "Track a service",
    bookLink: "Start a booking",
  },
  footer: {
    eyebrow: "Built to feel calm under pressure",
    title: "One desk, cleaner follow-up.",
    body:
      "Messages are logged under one clear reference so the team can respond promptly and keep every update in one place.",
    bookCta: "Start a booking",
    compareCta: "Compare services",
  },
};

const CARE_CONTACT_COPY_FR: DeepPartial<CareContactCopy> = {
  metadata: {
    title: "Contact",
    description:
      "Conseils pour la réservation, modifications d’horaires, clarté de facturation ou suivi d’une prestation en cours — pris en charge dans un fil unique, du premier message à la résolution finale.",
  },
  hero: {
    eyebrow: "Contact et assistance",
    title: "Un seul guichet. Des réponses claires.",
    body:
      "Conseils pour la réservation, modifications d’horaires, clarté de facturation ou suivi d’une prestation en cours — pris en charge dans un fil unique, du premier message à la résolution finale.",
  },
  rail: {
    serviceHoursLabel: "Heures de service",
    coverageLabel: "Couverture",
    coverageValue: "Demandes textile, domicile et bureau dans les zones desservies",
    followUpLabel: "Suivi",
    followUpValue: "Consigné sous une seule référence par demande",
    defaultPickupHours: "Lun - Sam • 8h00 à 19h00",
  },
  sendMessage: {
    eyebrow: "Envoyer un message",
  },
  channels: {
    eyebrow: "Canaux directs",
    title: "Choisissez le canal qui correspond au moment.",
    phoneTitle: "Assistance téléphonique",
    phoneBody:
      "Idéal pour modifier un retrait le jour même, transmettre des consignes d’accès, coordonner une intervention urgente ou tout ce qui dépend du temps.",
    emailTitle: "Assistance par e-mail",
    emailBody:
      "Idéal pour les devis, la clarté de facturation, les questions sur les forfaits récurrents et tout ce qui mérite une trace écrite.",
    whatsappTitle: "Contact WhatsApp",
    whatsappBody:
      "Utile lorsque l’équipe a seulement besoin d’une confirmation rapide ou d’un justificatif de paiement après un échange antérieur.",
    copyLabel: "Copier",
  },
  tracking: {
    eyebrow: "Vous avez déjà un code de suivi ?",
    body:
      "Suivez la prestation d’abord. Dans bien des cas, le dernier mouvement, l’étape d’arrivée ou la mise à jour de finalisation répond immédiatement à la question.",
    trackLink: "Suivre une prestation",
    bookLink: "Démarrer une réservation",
  },
  footer: {
    eyebrow: "Pensé pour rester calme sous pression",
    title: "Un seul guichet, un suivi plus net.",
    body:
      "Les messages sont consignés sous une seule référence claire afin que l’équipe puisse répondre rapidement et garder chaque mise à jour au même endroit.",
    bookCta: "Démarrer une réservation",
    compareCta: "Comparer les prestations",
  },
};

const CARE_CONTACT_COPY_ES: DeepPartial<CareContactCopy> = {
  metadata: {
    title: "Contacto",
    description:
      "Orientación para reservar, cambios de horario, claridad en la facturación o seguimiento de un servicio en curso — gestionados en un único hilo, desde el primer mensaje hasta la resolución final.",
  },
  hero: {
    eyebrow: "Contacto y soporte",
    title: "Una sola mesa. Respuestas claras.",
    body:
      "Orientación para reservar, cambios de horario, claridad en la facturación o seguimiento de un servicio en curso — gestionados en un único hilo, desde el primer mensaje hasta la resolución final.",
  },
  rail: {
    serviceHoursLabel: "Horario de servicio",
    coverageLabel: "Cobertura",
    coverageValue: "Solicitudes de prendas, hogar y oficina en las zonas cubiertas",
    followUpLabel: "Seguimiento",
    followUpValue: "Registrado bajo una única referencia por solicitud",
    defaultPickupHours: "Lun - Sáb • 8:00 a 19:00",
  },
  sendMessage: {
    eyebrow: "Enviar un mensaje",
  },
  channels: {
    eyebrow: "Canales directos",
    title: "Elija la vía que mejor se ajuste al momento.",
    phoneTitle: "Soporte telefónico",
    phoneBody:
      "Ideal para cambios de recogida en el mismo día, instrucciones de acceso, coordinación urgente del servicio y todo lo sensible al tiempo.",
    emailTitle: "Soporte por correo",
    emailBody:
      "Ideal para presupuestos, claridad de facturación, consultas sobre planes recurrentes y todo lo que conviene dejar por escrito.",
    whatsappTitle: "Contacto por WhatsApp",
    whatsappBody:
      "Útil cuando el equipo solo necesita una confirmación rápida o un comprobante de pago tras una conversación previa.",
    copyLabel: "Copiar",
  },
  tracking: {
    eyebrow: "¿Ya tiene un código de seguimiento?",
    body:
      "Consulte primero el estado del servicio. En muchos casos, el último movimiento, la fase de llegada o la actualización de finalización resolverán la duda al instante.",
    trackLink: "Seguir un servicio",
    bookLink: "Iniciar una reserva",
  },
  footer: {
    eyebrow: "Pensado para mantener la calma bajo presión",
    title: "Una sola mesa, un seguimiento más claro.",
    body:
      "Los mensajes se registran bajo una única referencia clara para que el equipo pueda responder con rapidez y mantener cada novedad en un mismo lugar.",
    bookCta: "Iniciar una reserva",
    compareCta: "Comparar servicios",
  },
};

const CARE_CONTACT_COPY_PT: DeepPartial<CareContactCopy> = {
  metadata: {
    title: "Contacto",
    description:
      "Orientação para reservas, mudanças de horário, clareza na faturação ou seguimento de um serviço em curso — tratados num único fio, da primeira mensagem até à resolução final.",
  },
  hero: {
    eyebrow: "Contacto e apoio",
    title: "Um só balcão. Respostas claras.",
    body:
      "Orientação para reservas, mudanças de horário, clareza na faturação ou seguimento de um serviço em curso — tratados num único fio, da primeira mensagem até à resolução final.",
  },
  rail: {
    serviceHoursLabel: "Horário de serviço",
    coverageLabel: "Cobertura",
    coverageValue: "Pedidos de vestuário, casa e escritório nas zonas abrangidas",
    followUpLabel: "Seguimento",
    followUpValue: "Registado sob uma única referência por pedido",
    defaultPickupHours: "Seg - Sáb • 8h00 às 19h00",
  },
  sendMessage: {
    eyebrow: "Enviar uma mensagem",
  },
  channels: {
    eyebrow: "Canais diretos",
    title: "Escolha o canal que melhor se ajusta ao momento.",
    phoneTitle: "Apoio por telefone",
    phoneBody:
      "Ideal para alterações de recolha no próprio dia, instruções de acesso, coordenação urgente do serviço e tudo o que é sensível ao tempo.",
    emailTitle: "Apoio por e-mail",
    emailBody:
      "Ideal para orçamentos, clareza na faturação, dúvidas sobre planos recorrentes e tudo o que beneficia de um registo escrito.",
    whatsappTitle: "Contacto por WhatsApp",
    whatsappBody:
      "Útil quando a equipa só precisa de uma confirmação rápida ou de um comprovativo de pagamento após orientação anterior.",
    copyLabel: "Copiar",
  },
  tracking: {
    eyebrow: "Já tem um código de seguimento?",
    body:
      "Acompanhe primeiro o serviço. Em muitos casos, o último movimento, a fase de chegada ou a atualização de conclusão respondem de imediato à dúvida.",
    trackLink: "Acompanhar um serviço",
    bookLink: "Iniciar uma reserva",
  },
  footer: {
    eyebrow: "Pensado para manter a calma sob pressão",
    title: "Um só balcão, um seguimento mais limpo.",
    body:
      "As mensagens são registadas sob uma única referência clara, para que a equipa possa responder prontamente e manter cada atualização no mesmo lugar.",
    bookCta: "Iniciar uma reserva",
    compareCta: "Comparar serviços",
  },
};

const CARE_CONTACT_COPY_AR: DeepPartial<CareContactCopy> = {
  metadata: {
    title: "تواصل معنا",
    description:
      "إرشاد بشأن الحجز، أو تعديل المواعيد، أو وضوح الفوترة، أو متابعة خدمة قائمة — ضمن خيط واحد ومتسق من أول رسالة حتى التسوية النهائية.",
  },
  hero: {
    eyebrow: "التواصل والدعم",
    title: "مكتب واحد. إجابات واضحة.",
    body:
      "إرشاد بشأن الحجز، أو تعديل المواعيد، أو وضوح الفوترة، أو متابعة خدمة قائمة — ضمن خيط واحد ومتسق من أول رسالة حتى التسوية النهائية.",
  },
  rail: {
    serviceHoursLabel: "ساعات الخدمة",
    coverageLabel: "نطاق التغطية",
    coverageValue: "طلبات الملابس والمنازل والمكاتب ضمن المناطق المغطّاة",
    followUpLabel: "المتابعة",
    followUpValue: "تُسجَّل تحت مرجع واحد لكل طلب",
    defaultPickupHours: "الإثنين - السبت • 8:00 صباحًا حتى 7:00 مساءً",
  },
  sendMessage: {
    eyebrow: "إرسال رسالة",
  },
  channels: {
    eyebrow: "قنوات التواصل المباشرة",
    title: "اختر الطريق الأنسب للحظتك.",
    phoneTitle: "الدعم الهاتفي",
    phoneBody:
      "الأنسب لتعديلات الاستلام في اليوم نفسه، وتعليمات الوصول، وتنسيق الخدمة العاجل، وكل ما يكون حسّاسًا للوقت.",
    emailTitle: "الدعم عبر البريد الإلكتروني",
    emailBody:
      "الأنسب لعروض الأسعار، ووضوح الفوترة، والأسئلة المتعلقة بالباقات المتكررة، وكل ما يستفيد من سجلّ مكتوب.",
    whatsappTitle: "التواصل عبر واتساب",
    whatsappBody:
      "مفيد عندما يحتاج الفريق فقط إلى تأكيد سريع أو إرفاق إثبات دفع بعد توجيه سابق.",
    copyLabel: "نسخ",
  },
  tracking: {
    eyebrow: "هل لديك رمز تتبّع بالفعل؟",
    body:
      "تابع الخدمة أولاً. في كثير من الأحيان، تكفي آخر حركة أو مرحلة وصول أو تحديث إنجاز للإجابة عن السؤال فورًا.",
    trackLink: "تتبّع خدمة",
    bookLink: "بدء حجز",
  },
  footer: {
    eyebrow: "مصمَّم ليبقى هادئًا تحت الضغط",
    title: "مكتب واحد، ومتابعة أكثر وضوحًا.",
    body:
      "تُسجَّل الرسائل تحت مرجع واحد واضح، حتى يتمكّن الفريق من الرد بسرعة وإبقاء كل تحديث في مكان واحد.",
    bookCta: "بدء حجز",
    compareCta: "مقارنة الخدمات",
  },
};

const CARE_CONTACT_COPY_DE: DeepPartial<CareContactCopy> = {
  metadata: {
    title: "Kontakt",
    description:
      "Hilfe bei Buchungen, Terminänderungen, Rechnungsklärung oder die Nachverfolgung einer laufenden Leistung — in einem zusammenhängenden Verlauf von der ersten Nachricht bis zur abschließenden Klärung.",
  },
  hero: {
    eyebrow: "Kontakt und Support",
    title: "Eine Anlaufstelle. Klare Antworten.",
    body:
      "Hilfe bei Buchungen, Terminänderungen, Rechnungsklärung oder die Nachverfolgung einer laufenden Leistung — in einem zusammenhängenden Verlauf von der ersten Nachricht bis zur abschließenden Klärung.",
  },
  rail: {
    serviceHoursLabel: "Servicezeiten",
    coverageLabel: "Einzugsgebiet",
    coverageValue: "Anfragen für Textilien, Privathaushalte und Büros in den abgedeckten Zonen",
    followUpLabel: "Nachverfolgung",
    followUpValue: "Pro Anfrage unter einer einheitlichen Referenz erfasst",
    defaultPickupHours: "Mo - Sa • 8:00 bis 19:00 Uhr",
  },
  sendMessage: {
    eyebrow: "Nachricht senden",
  },
  channels: {
    eyebrow: "Direkte Kanäle",
    title: "Wählen Sie den Weg, der zum Moment passt.",
    phoneTitle: "Telefonischer Support",
    phoneBody:
      "Ideal für taggleiche Abholungsänderungen, Zugangsanweisungen, dringende Service-Koordination und alles Zeitkritische.",
    emailTitle: "E-Mail-Support",
    emailBody:
      "Ideal für Angebote, Rechnungsklärung, Fragen zu wiederkehrenden Plänen und alles, was von einer schriftlichen Spur profitiert.",
    whatsappTitle: "Kontakt über WhatsApp",
    whatsappBody:
      "Hilfreich, wenn das Team nur eine kurze Bestätigung oder einen Zahlungsnachweis nach vorheriger Absprache benötigt.",
    copyLabel: "Kopieren",
  },
  tracking: {
    eyebrow: "Haben Sie bereits einen Tracking-Code?",
    body:
      "Verfolgen Sie den Service zuerst. Oft beantwortet bereits die letzte Bewegung, die Ankunftsphase oder die Abschluss-Aktualisierung Ihre Frage.",
    trackLink: "Service verfolgen",
    bookLink: "Buchung starten",
  },
  footer: {
    eyebrow: "Gebaut, um unter Druck ruhig zu bleiben",
    title: "Eine Anlaufstelle, klarere Nachverfolgung.",
    body:
      "Nachrichten werden unter einer eindeutigen Referenz erfasst, damit das Team zügig antworten und jede Aktualisierung an einem Ort halten kann.",
    bookCta: "Buchung starten",
    compareCta: "Leistungen vergleichen",
  },
};

const CARE_CONTACT_COPY_IT: DeepPartial<CareContactCopy> = {
  metadata: {
    title: "Contatti",
    description:
      "Supporto per la prenotazione, modifiche di orario, chiarezza in fattura o follow-up su un servizio in corso — gestiti in un unico filo coerente, dal primo messaggio alla risoluzione finale.",
  },
  hero: {
    eyebrow: "Contatti e assistenza",
    title: "Un solo banco. Risposte chiare.",
    body:
      "Supporto per la prenotazione, modifiche di orario, chiarezza in fattura o follow-up su un servizio in corso — gestiti in un unico filo coerente, dal primo messaggio alla risoluzione finale.",
  },
  rail: {
    serviceHoursLabel: "Orari di servizio",
    coverageLabel: "Copertura",
    coverageValue: "Richieste per capi, casa e ufficio nelle zone coperte",
    followUpLabel: "Follow-up",
    followUpValue: "Registrato sotto un unico riferimento per ogni richiesta",
    defaultPickupHours: "Lun - Sab • 8:00 - 19:00",
  },
  sendMessage: {
    eyebrow: "Invia un messaggio",
  },
  channels: {
    eyebrow: "Canali diretti",
    title: "Scelga il canale più adatto al momento.",
    phoneTitle: "Assistenza telefonica",
    phoneBody:
      "Indicata per modifiche di ritiro in giornata, istruzioni di accesso, coordinamento urgente del servizio e tutto ciò che dipende dal tempo.",
    emailTitle: "Assistenza via e-mail",
    emailBody:
      "Indicata per preventivi, chiarimenti di fatturazione, domande sui piani ricorrenti e tutto ciò che beneficia di una traccia scritta.",
    whatsappTitle: "Contatto via WhatsApp",
    whatsappBody:
      "Utile quando al team serve solo una conferma rapida o un giustificativo di pagamento dopo un’indicazione precedente.",
    copyLabel: "Copia",
  },
  tracking: {
    eyebrow: "Ha già un codice di tracciamento?",
    body:
      "Tracci prima il servizio. In molti casi l’ultimo movimento, la fase di arrivo o l’aggiornamento di completamento risponde subito alla domanda.",
    trackLink: "Traccia un servizio",
    bookLink: "Avvia una prenotazione",
  },
  footer: {
    eyebrow: "Pensato per restare calmo sotto pressione",
    title: "Un solo banco, un follow-up più pulito.",
    body:
      "I messaggi vengono registrati sotto un unico riferimento chiaro, in modo che il team possa rispondere prontamente e tenere ogni aggiornamento nello stesso posto.",
    bookCta: "Avvia una prenotazione",
    compareCta: "Confronta i servizi",
  },
};

const CARE_CONTACT_COPY_ZH: DeepPartial<CareContactCopy> = {
  metadata: {
    title: "联系我们",
    description:
      "预约咨询、改期、账单说明,或对在途服务的跟进——以同一条工单从第一条消息贯通到最终解决。",
  },
  hero: {
    eyebrow: "联系与支持",
    title: "一个窗口,清晰答复。",
    body:
      "预约咨询、改期、账单说明,或对在途服务的跟进——以同一条工单从第一条消息贯通到最终解决。",
  },
  rail: {
    serviceHoursLabel: "服务时间",
    coverageLabel: "覆盖范围",
    coverageValue: "覆盖区内的衣物、家居与办公服务请求",
    followUpLabel: "跟进方式",
    followUpValue: "每个请求归入同一个工单编号",
    defaultPickupHours: "周一至周六 · 上午 8:00 至晚上 7:00",
  },
  sendMessage: {
    eyebrow: "发送消息",
  },
  channels: {
    eyebrow: "直接通道",
    title: "选择当下最合适的方式。",
    phoneTitle: "电话支持",
    phoneBody: "适用于当日取件改约、上门进出指引、紧急服务协调,以及任何对时效敏感的情况。",
    emailTitle: "邮件支持",
    emailBody: "适用于报价、账单说明、长期套餐的相关问题,以及需要书面记录的事项。",
    whatsappTitle: "WhatsApp 联系",
    whatsappBody: "在先前沟通后,仅需一次快速确认或上传付款凭证时,使用最为顺手。",
    copyLabel: "复制",
  },
  tracking: {
    eyebrow: "已经有跟踪编号了吗?",
    body: "先查看服务进度。多数情况下,最新进展、到达节点或完成更新即可直接解答疑问。",
    trackLink: "查询服务进度",
    bookLink: "开始预约",
  },
  footer: {
    eyebrow: "在压力下也保持从容",
    title: "一个窗口,跟进更清爽。",
    body: "消息归入唯一明确的工单编号,团队可以及时回复,并将每条更新汇总在同一处。",
    bookCta: "开始预约",
    compareCta: "比较服务",
  },
};

const CARE_CONTACT_COPY_HI: DeepPartial<CareContactCopy> = {
  metadata: {
    title: "संपर्क",
    description:
      "बुकिंग संबंधी मार्गदर्शन, समय में बदलाव, बिलिंग की स्पष्टता, या किसी मौजूदा सेवा का फ़ॉलो-अप — पहले संदेश से अंतिम समाधान तक एक ही सुसंगत थ्रेड में।",
  },
  hero: {
    eyebrow: "संपर्क और सहायता",
    title: "एक डेस्क। साफ़ जवाब।",
    body:
      "बुकिंग संबंधी मार्गदर्शन, समय में बदलाव, बिलिंग की स्पष्टता, या किसी मौजूदा सेवा का फ़ॉलो-अप — पहले संदेश से अंतिम समाधान तक एक ही सुसंगत थ्रेड में।",
  },
  rail: {
    serviceHoursLabel: "सेवा समय",
    coverageLabel: "कवरेज",
    coverageValue: "कवर किए गए क्षेत्रों में वस्त्र, घर और कार्यालय से जुड़े अनुरोध",
    followUpLabel: "फ़ॉलो-अप",
    followUpValue: "हर अनुरोध एक ही संदर्भ संख्या के अंतर्गत दर्ज",
    defaultPickupHours: "सोम - शनि • सुबह 8:00 से शाम 7:00 तक",
  },
  sendMessage: {
    eyebrow: "संदेश भेजें",
  },
  channels: {
    eyebrow: "सीधे चैनल",
    title: "उस माध्यम को चुनें जो इस पल के लिए सही हो।",
    phoneTitle: "फ़ोन सहायता",
    phoneBody:
      "उसी दिन पिकअप में बदलाव, प्रवेश संबंधी निर्देश, अत्यावश्यक सेवा समन्वय और समय-संवेदनशील किसी भी मामले के लिए सबसे उपयुक्त।",
    emailTitle: "ईमेल सहायता",
    emailBody:
      "कोटेशन, बिलिंग स्पष्टता, आवर्ती योजनाओं से जुड़े सवाल और लिखित अभिलेख वाले हर मामले के लिए सबसे उपयुक्त।",
    whatsappTitle: "व्हाट्सऐप संपर्क",
    whatsappBody:
      "जब पिछली बातचीत के बाद टीम को केवल त्वरित पुष्टि या भुगतान प्रमाण की ज़रूरत हो, तब उपयोगी।",
    copyLabel: "कॉपी करें",
  },
  tracking: {
    eyebrow: "क्या आपके पास पहले से ट्रैकिंग कोड है?",
    body:
      "पहले सेवा की स्थिति देखें। अनेक मामलों में नवीनतम मूवमेंट, आगमन स्तर या पूर्णता अपडेट से ही प्रश्न का उत्तर तुरंत मिल जाता है।",
    trackLink: "सेवा ट्रैक करें",
    bookLink: "बुकिंग शुरू करें",
  },
  footer: {
    eyebrow: "दबाव में भी शांत बने रहने के लिए बनाया गया",
    title: "एक डेस्क, अधिक साफ़ फ़ॉलो-अप।",
    body:
      "संदेश एक स्पष्ट संदर्भ संख्या के अंतर्गत दर्ज होते हैं ताकि टीम तत्परता से उत्तर दे सके और हर अपडेट एक ही जगह बना रहे।",
    bookCta: "बुकिंग शुरू करें",
    compareCta: "सेवाओं की तुलना करें",
  },
};

const CARE_CONTACT_COPY_IG: DeepPartial<CareContactCopy> = {
  metadata: {
    title: "Kpọtụrụ anyị",
    description:
      "Nduzi maka ndokwa, mgbanwe oge, nkọwa ụgwọ, ma ọ bụ nlekota maka ọrụ dị ugbu a — a na-aga n’ime otu eriri kwekọrọ site na mbụ ozi ruo na mmecha.",
  },
  hero: {
    eyebrow: "Kọntaktị na nkwado",
    title: "Otu tebụl. Azịza doro anya.",
    body:
      "Nduzi maka ndokwa, mgbanwe oge, nkọwa ụgwọ, ma ọ bụ nlekota maka ọrụ dị ugbu a — a na-aga n’ime otu eriri kwekọrọ site na mbụ ozi ruo na mmecha.",
  },
  rail: {
    serviceHoursLabel: "Oge ọrụ",
    coverageLabel: "Mpaghara",
    coverageValue: "Arịrịọ uwe, ụlọ na ọfịs n’ime mpaghara ndị e kpuchiri",
    followUpLabel: "Nlekota",
    followUpValue: "E debanyere ya n’otu nrụtụaka kwa arịrịọ",
    defaultPickupHours: "Mọnde - Satọde • 8:00 ụtụtụ ruo 7:00 mgbede",
  },
  sendMessage: {
    eyebrow: "Zipu ozi",
  },
  channels: {
    eyebrow: "Ụzọ nkwukọrịta ozugbo",
    title: "Họrọ ụzọ kacha kwado oge ahụ.",
    phoneTitle: "Nkwado n’ekwentị",
    phoneBody:
      "Kacha mma maka mgbanwe nkpọrọ otu ụbọchị, ntụziaka mbata, nhazi ọrụ ngwa ngwa, na ihe ọ bụla siri ike n’oge.",
    emailTitle: "Nkwado n’ozi-e",
    emailBody:
      "Kacha mma maka ọnụ ahịa, nkọwa ụgwọ, ajụjụ gbasara atụmatụ na-aga n’ihu, na ihe ọ bụla a ga-edebe n’ihe ederede.",
    whatsappTitle: "Kọntaktị WhatsApp",
    whatsappBody:
      "Bara uru mgbe ndị otu chọrọ naanị nkwenye ngwa ngwa ma ọ bụ akwụkwọ ịkwụ ụgwọ ka okwu gara aga gachara.",
    copyLabel: "Detuo",
  },
  tracking: {
    eyebrow: "Ị nweelarị koodu nso nso?",
    body:
      "Soro ọrụ ahụ na mbụ. N’ọtụtụ oge, mmegharị ọhụrụ kacha, ọkwa nrute, ma ọ bụ mmelite mmecha na-aza ajụjụ ngwa ngwa.",
    trackLink: "Soro ọrụ",
    bookLink: "Malite ndokwa",
  },
  footer: {
    eyebrow: "E mere ya ka ọ jụụ n’oge nrụgide",
    title: "Otu tebụl, nlekota dị ọcha.",
    body:
      "A na-edebanye ozi n’okpuru otu nrụtụaka doro anya, ka ndị otu wee zaa ngwa ngwa ma debe mmelite ọ bụla n’otu ebe.",
    bookCta: "Malite ndokwa",
    compareCta: "Tụnyere ọrụ",
  },
};

const CARE_CONTACT_COPY_YO: DeepPartial<CareContactCopy> = {
  metadata: {
    title: "Kàn sí wa",
    description:
      "Ìtọ́sọ́nà lórí ìfọrífín, ìyípadà ní àkókò, ṣíṣe kedere fún àwọn owó, tàbí àtẹ̀lé iṣẹ́ tó ti wà — gbogbo rẹ̀ ní ìjókòó kan, láti ọ̀rọ̀ àkọ́kọ́ títí dé ìparí.",
  },
  hero: {
    eyebrow: "Bíbá wa sọ̀rọ̀ àti àtìlẹ́yìn",
    title: "Tábìlì kan ṣoṣo. Ìdáhùn tó dájú.",
    body:
      "Ìtọ́sọ́nà lórí ìfọrífín, ìyípadà ní àkókò, ṣíṣe kedere fún àwọn owó, tàbí àtẹ̀lé iṣẹ́ tó ti wà — gbogbo rẹ̀ ní ìjókòó kan, láti ọ̀rọ̀ àkọ́kọ́ títí dé ìparí.",
  },
  rail: {
    serviceHoursLabel: "Àwọn wákàtí iṣẹ́",
    coverageLabel: "Ààlà ìṣiṣẹ́",
    coverageValue: "Àbẹ̀wò aṣọ, ilé, àti ọ́físì ní àwọn agbègbè tí a ṣe ìpèsè",
    followUpLabel: "Àtẹ̀lé",
    followUpValue: "A kọ ọ́ sí abẹ́ ìtọ́kasí kan fún ìbéèrè kọ̀ọ̀kan",
    defaultPickupHours: "Mọ́n - Sát • 8:00 a.m. sí 7:00 p.m.",
  },
  sendMessage: {
    eyebrow: "Rán ọ̀rọ̀",
  },
  channels: {
    eyebrow: "Àwọn ọ̀nà tààrà",
    title: "Yan ọ̀nà tó bá àkókò náà mu.",
    phoneTitle: "Àtìlẹ́yìn nípa fóònù",
    phoneBody:
      "Ó dára jùlọ fún ìyípadà àgbàwọlé ọjọ́ kan náà, ìtọ́ni ìwọlé, ìṣàkóso iṣẹ́ kíákíá, àti ohunkóhun tó dá lórí àkókò.",
    emailTitle: "Àtìlẹ́yìn nípa ìméèlì",
    emailBody:
      "Ó dára jùlọ fún ìṣirò owó, ìpèsè kedere lórí owó, ìbéèrè lórí àwọn ètò àtúnṣe, àti ohunkóhun tó nílò àkọsílẹ̀.",
    whatsappTitle: "Bíbá wa sọ̀rọ̀ nípa WhatsApp",
    whatsappBody:
      "Ó wúlò nígbà tí ẹgbẹ́ wa nílò ìjẹ́rìí kíákíá tàbí ẹ̀rí ìsanwó lẹ́yìn ìfọ̀rọ̀wérọ̀ tó ti wà.",
    copyLabel: "Da ẹ̀dà",
  },
  tracking: {
    eyebrow: "Ǹjẹ́ o ti ní koodu ìtọpasẹ̀?",
    body:
      "Tọ́jú iṣẹ́ náà ní àkọ́kọ́. Ní ọ̀pọ̀ ìgbà, ìṣípayá tuntun, ìpele ìdé, tàbí ìmúdójú iwọn ìparí á dáhùn ìbéèrè rẹ lẹ́sẹ̀kẹsẹ̀.",
    trackLink: "Tọpa iṣẹ́",
    bookLink: "Bẹ̀rẹ̀ ìfọrífín",
  },
  footer: {
    eyebrow: "A ṣe é láti dúró ní ìfọ̀kànbalẹ̀ lábẹ́ ìnira",
    title: "Tábìlì kan, àtẹ̀lé tó mọ́.",
    body:
      "A kọ àwọn ọ̀rọ̀ sí abẹ́ ìtọ́kasí kan tó ṣe kedere, kí ẹgbẹ́ wa bá lè dáhùn lójú-ọ̀nà, kí gbogbo ìmúdójú-ìwọn sì wà ní ibìkan.",
    bookCta: "Bẹ̀rẹ̀ ìfọrífín",
    compareCta: "Ṣe ìfiwérà àwọn iṣẹ́",
  },
};

const CARE_CONTACT_COPY_HA: DeepPartial<CareContactCopy> = {
  metadata: {
    title: "Tuntube mu",
    description:
      "Jagora kan rijista, sauya lokaci, fayyace lissafi, ko bibiyar wani aikin da ake gudanarwa — duk a cikin tashi guda, daga saƙo na farko har zuwa ƙarshen warwarewa.",
  },
  hero: {
    eyebrow: "Tuntuɓa da tallafi",
    title: "Tebur ɗaya. Amsa a fili.",
    body:
      "Jagora kan rijista, sauya lokaci, fayyace lissafi, ko bibiyar wani aikin da ake gudanarwa — duk a cikin tashi guda, daga saƙo na farko har zuwa ƙarshen warwarewa.",
  },
  rail: {
    serviceHoursLabel: "Lokacin aiki",
    coverageLabel: "Yankin aiki",
    coverageValue: "Bukatun tufafi, gida, da ofis a yankunan da muka rufe",
    followUpLabel: "Bibiya",
    followUpValue: "An yi rijista a ƙarƙashin lambar tuntuɓa ɗaya ga kowace buƙata",
    defaultPickupHours: "Lit - Asabar • 8:00 na safe zuwa 7:00 na dare",
  },
  sendMessage: {
    eyebrow: "Aika saƙo",
  },
  channels: {
    eyebrow: "Hanyoyin tuntuɓa kai-tsaye",
    title: "Zaɓi hanyar da ta dace da lokacin.",
    phoneTitle: "Tallafi ta waya",
    phoneBody:
      "Mafi dacewa don sauya ɗaukar kaya na rana ɗaya, umarni game da shiga, daidaita aikin gaggawa, da duk wani abu mai damuwa lokaci.",
    emailTitle: "Tallafi ta imel",
    emailBody:
      "Mafi dacewa don ƙididdigar farashi, fayyace lissafi, tambayoyi kan tsare-tsare na maimaitawa, da duk abin da rubutaccen rikodi zai amfana.",
    whatsappTitle: "Tuntuɓa ta WhatsApp",
    whatsappBody:
      "Yana taimakawa idan ƙungiyar tana buƙatar kawai tabbatarwa kai-tsaye ko hujjar biya bayan jagora ta baya.",
    copyLabel: "Kwafa",
  },
  tracking: {
    eyebrow: "Kana da lambar bin diddigi tuni?",
    body:
      "Da farko bibiyi aikin. A yawancin lokuta, sabunta motsi na ƙarshe, matakin isowa, ko sanarwar kammalawa zai amsa tambayar nan take.",
    trackLink: "Bibiyi aiki",
    bookLink: "Fara rijista",
  },
  footer: {
    eyebrow: "An gina shi don ya kasance cikin natsuwa a ƙarƙashin matsi",
    title: "Tebur ɗaya, bibiya mafi tsabta.",
    body:
      "Ana rijistar saƙonni a ƙarƙashin lamba ɗaya bayyananna, don ƙungiyar ta amsa cikin lokaci kuma duk wani sabunti ya kasance a wuri ɗaya.",
    bookCta: "Fara rijista",
    compareCta: "Kwatanta ayyuka",
  },
};

const CARE_CONTACT_LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<CareContactCopy>>> = {
  fr: CARE_CONTACT_COPY_FR,
  es: CARE_CONTACT_COPY_ES,
  pt: CARE_CONTACT_COPY_PT,
  ar: CARE_CONTACT_COPY_AR,
  de: CARE_CONTACT_COPY_DE,
  it: CARE_CONTACT_COPY_IT,
  zh: CARE_CONTACT_COPY_ZH,
  hi: CARE_CONTACT_COPY_HI,
  ig: CARE_CONTACT_COPY_IG,
  yo: CARE_CONTACT_COPY_YO,
  ha: CARE_CONTACT_COPY_HA,
};

export function getCareContactCopy(locale: AppLocale): CareContactCopy {
  const overrides = CARE_CONTACT_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      CARE_CONTACT_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as CareContactCopy;
  }
  return CARE_CONTACT_COPY_EN;
}

/** @internal */
export function __dangerouslyGetEnglishCareContactCopy(): CareContactCopy {
  return CARE_CONTACT_COPY_EN;
}
