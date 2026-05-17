import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * LogisticsQuoteCopy — i18n surface for the public Logistics /quote page.
 * Covers page metadata, the "see the price before you book" hero, the
 * "what the quote shows" feature rail, the quote details eyebrow, the
 * post-submit step list, the volume-pricing callout, and the closing
 * conversion CTA section.
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each locale is
 * a Partial that deep-merges over EN so missing keys fall through to EN
 * silently. Mirrors the shape of `logistics-pricing-copy.ts`.
 */
export type LogisticsQuoteCopy = {
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    body: string;
    badge: string;
  };
  whatQuoteShows: {
    eyebrow: string;
    items: {
      laneTier: { title: string; body: string };
      itemised: { title: string; body: string };
      promiseWindow: { title: string; body: string };
    };
  };
  quoteDetails: {
    eyebrow: string;
  };
  afterSubmit: {
    eyebrow: string;
    stepLabel: string;
    items: {
      returned: { title: string; body: string };
      reference: { title: string; body: string };
      pickup: { title: string; body: string };
    };
  };
  volume: {
    eyebrow: string;
    body: string;
    talkLink: string;
    compareLink: string;
  };
  conversion: {
    eyebrow: string;
    title: string;
    body: string;
    bookCta: string;
    trackCta: string;
  };
};

const LOGISTICS_QUOTE_COPY_EN: LogisticsQuoteCopy = {
  metadata: {
    title: "Request a quote | HenryCo Logistics",
    description: "Get an indicative logistics quote before you commit to a booking.",
  },
  hero: {
    eyebrow: "Lane · Service · Profile",
    title: "See the price before you book.",
    body: "Priced from your lane, service type, and parcel profile. Quotes save with a tracking reference so a booking is one click later — no retyping.",
    badge: "Indicative · Convertible to booking · No surprise add-ons",
  },
  whatQuoteShows: {
    eyebrow: "What the quote shows",
    items: {
      laneTier: {
        title: "Lane and service tier",
        body: "Standard, express, or scheduled — priced against the actual zones you’re moving between.",
      },
      itemised: {
        title: "Itemised total",
        body: "Base fare, weight bands, and any handling — visible before commitment, not at the door.",
      },
      promiseWindow: {
        title: "Promise window",
        body: "Honest hour bands with a confidence read, not a single number we can’t hold to.",
      },
    },
  },
  quoteDetails: {
    eyebrow: "Quote details",
  },
  afterSubmit: {
    eyebrow: "What happens after you submit",
    stepLabel: "Step",
    items: {
      returned: {
        title: "Quote returned instantly",
        body: "Indicative total and promise window appear in line — no follow-up email needed to see the price.",
      },
      reference: {
        title: "Reference saved for later",
        body: "Each quote stores with a tracking reference. Convert it to a booking from the same form when you’re ready.",
      },
      pickup: {
        title: "Pickup scheduled cleanly",
        body: "Booking issues a tracking code and dispatch begins routing within current operating hours.",
      },
    },
  },
  volume: {
    eyebrow: "Need volume pricing?",
    body: "Recurring B2B lanes, multi-stop dispatch, and contract pricing run through the business desk — not a quick public quote.",
    talkLink: "Talk to the business desk",
    compareLink: "Compare service tiers",
  },
  conversion: {
    eyebrow: "Ready to ship?",
    title: "Convert the quote — we’ll issue a tracking code straight away.",
    body: "Pricing carries through to the booking with no resets. Milestones write live as pickup and dispatch progress.",
    bookCta: "Book this lane",
    trackCta: "Track an existing shipment",
  },
};

const LOGISTICS_QUOTE_COPY_FR: DeepPartial<LogisticsQuoteCopy> = {
  metadata: {
    title: "Demander un devis | HenryCo Logistics",
    description: "Obtenez un devis logistique indicatif avant de vous engager sur une réservation.",
  },
  hero: {
    eyebrow: "Trajet · Service · Profil",
    title: "Voyez le prix avant de réserver.",
    body: "Tarifé selon votre trajet, votre type de service et le profil du colis. Les devis sont enregistrés avec une référence de suivi : la réservation se fait ensuite en un clic, sans tout retaper.",
    badge: "Indicatif · Convertible en réservation · Pas de frais surprises",
  },
  whatQuoteShows: {
    eyebrow: "Ce que le devis indique",
    items: {
      laneTier: {
        title: "Trajet et niveau de service",
        body: "Standard, express ou planifié — tarifé sur les zones réelles que vous reliez.",
      },
      itemised: {
        title: "Total détaillé",
        body: "Tarif de base, tranches de poids et manutention éventuelle — visibles avant engagement, pas à la porte.",
      },
      promiseWindow: {
        title: "Fenêtre de promesse",
        body: "Des plages horaires honnêtes avec un indice de confiance, pas un chiffre unique intenable.",
      },
    },
  },
  quoteDetails: {
    eyebrow: "Détails du devis",
  },
  afterSubmit: {
    eyebrow: "Ce qui se passe après l’envoi",
    stepLabel: "Étape",
    items: {
      returned: {
        title: "Devis renvoyé instantanément",
        body: "Le total indicatif et la fenêtre de promesse s’affichent en ligne — pas besoin d’un e-mail de suivi pour voir le prix.",
      },
      reference: {
        title: "Référence conservée pour plus tard",
        body: "Chaque devis est stocké avec une référence de suivi. Convertissez-le en réservation depuis le même formulaire quand vous êtes prêt.",
      },
      pickup: {
        title: "Enlèvement planifié proprement",
        body: "La réservation génère un code de suivi et la répartition commence à router dans les horaires d’exploitation en cours.",
      },
    },
  },
  volume: {
    eyebrow: "Besoin de tarifs en volume ?",
    body: "Les trajets B2B récurrents, la répartition multi-arrêts et les tarifs contractuels passent par le bureau des entreprises — pas par un devis public rapide.",
    talkLink: "Parler au bureau des entreprises",
    compareLink: "Comparer les niveaux de service",
  },
  conversion: {
    eyebrow: "Prêt à expédier ?",
    title: "Convertissez le devis — nous émettons un code de suivi immédiatement.",
    body: "La tarification se reporte à la réservation sans réinitialisation. Les jalons s’écrivent en direct au fur et à mesure de l’enlèvement et de la répartition.",
    bookCta: "Réserver ce trajet",
    trackCta: "Suivre une expédition existante",
  },
};

const LOGISTICS_QUOTE_COPY_ES: DeepPartial<LogisticsQuoteCopy> = {
  metadata: {
    title: "Solicitar un presupuesto | HenryCo Logistics",
    description: "Obtén un presupuesto logístico indicativo antes de comprometerte con una reserva.",
  },
  hero: {
    eyebrow: "Trayecto · Servicio · Perfil",
    title: "Mira el precio antes de reservar.",
    body: "Calculado a partir de tu trayecto, tipo de servicio y perfil del paquete. Los presupuestos se guardan con una referencia de seguimiento, así la reserva queda a un clic — sin volver a escribir nada.",
    badge: "Indicativo · Convertible en reserva · Sin extras sorpresa",
  },
  whatQuoteShows: {
    eyebrow: "Lo que muestra el presupuesto",
    items: {
      laneTier: {
        title: "Trayecto y nivel de servicio",
        body: "Estándar, exprés o programado — tarificado contra las zonas reales por las que mueves.",
      },
      itemised: {
        title: "Total desglosado",
        body: "Tarifa base, bandas de peso y cualquier manejo — visibles antes del compromiso, no en la puerta.",
      },
      promiseWindow: {
        title: "Ventana de promesa",
        body: "Bandas horarias honestas con una lectura de confianza, no un único número que no podamos cumplir.",
      },
    },
  },
  quoteDetails: {
    eyebrow: "Detalles del presupuesto",
  },
  afterSubmit: {
    eyebrow: "Qué pasa después de enviar",
    stepLabel: "Paso",
    items: {
      returned: {
        title: "Presupuesto devuelto al instante",
        body: "El total indicativo y la ventana de promesa aparecen en línea — no hace falta un correo de seguimiento para ver el precio.",
      },
      reference: {
        title: "Referencia guardada para más tarde",
        body: "Cada presupuesto se almacena con una referencia de seguimiento. Conviértelo en reserva desde el mismo formulario cuando estés listo.",
      },
      pickup: {
        title: "Recogida programada con limpieza",
        body: "La reserva emite un código de seguimiento y el despacho comienza a enrutar dentro del horario operativo actual.",
      },
    },
  },
  volume: {
    eyebrow: "¿Necesitas precios por volumen?",
    body: "Los trayectos B2B recurrentes, el despacho multi-parada y los precios por contrato pasan por el escritorio empresarial — no por un presupuesto público rápido.",
    talkLink: "Habla con el escritorio empresarial",
    compareLink: "Comparar niveles de servicio",
  },
  conversion: {
    eyebrow: "¿Listo para enviar?",
    title: "Convierte el presupuesto — emitiremos un código de seguimiento de inmediato.",
    body: "El precio se traslada a la reserva sin reinicios. Los hitos se escriben en vivo a medida que avanzan la recogida y el despacho.",
    bookCta: "Reservar este trayecto",
    trackCta: "Rastrear un envío existente",
  },
};

const LOGISTICS_QUOTE_COPY_PT: DeepPartial<LogisticsQuoteCopy> = {
  metadata: {
    title: "Solicitar um orçamento | HenryCo Logistics",
    description: "Obtenha um orçamento logístico indicativo antes de se comprometer com uma reserva.",
  },
  hero: {
    eyebrow: "Trajeto · Serviço · Perfil",
    title: "Veja o preço antes de reservar.",
    body: "Calculado a partir do seu trajeto, tipo de serviço e perfil da encomenda. Os orçamentos são guardados com uma referência de rastreio, por isso a reserva fica a um clique — sem voltar a escrever tudo.",
    badge: "Indicativo · Convertível em reserva · Sem extras-surpresa",
  },
  whatQuoteShows: {
    eyebrow: "O que o orçamento mostra",
    items: {
      laneTier: {
        title: "Trajeto e nível de serviço",
        body: "Padrão, expresso ou agendado — tarifado contra as zonas reais entre as quais se desloca.",
      },
      itemised: {
        title: "Total discriminado",
        body: "Tarifa base, faixas de peso e qualquer manuseio — visíveis antes do compromisso, não à porta.",
      },
      promiseWindow: {
        title: "Janela de promessa",
        body: "Faixas horárias honestas com leitura de confiança, não um único número que não conseguimos cumprir.",
      },
    },
  },
  quoteDetails: {
    eyebrow: "Detalhes do orçamento",
  },
  afterSubmit: {
    eyebrow: "O que acontece depois de submeter",
    stepLabel: "Passo",
    items: {
      returned: {
        title: "Orçamento devolvido instantaneamente",
        body: "Total indicativo e janela de promessa aparecem em linha — não é preciso e-mail de seguimento para ver o preço.",
      },
      reference: {
        title: "Referência guardada para mais tarde",
        body: "Cada orçamento é armazenado com uma referência de rastreio. Converta-o em reserva a partir do mesmo formulário quando estiver pronto.",
      },
      pickup: {
        title: "Recolha agendada de forma limpa",
        body: "A reserva emite um código de rastreio e o despacho começa a encaminhar dentro do horário operacional atual.",
      },
    },
  },
  volume: {
    eyebrow: "Precisa de preços por volume?",
    body: "Trajetos B2B recorrentes, despacho multi-paragem e preços contratuais passam pelo balcão empresarial — não por um orçamento público rápido.",
    talkLink: "Falar com o balcão empresarial",
    compareLink: "Comparar níveis de serviço",
  },
  conversion: {
    eyebrow: "Pronto para enviar?",
    title: "Converta o orçamento — emitiremos um código de rastreio de imediato.",
    body: "O preço transfere-se para a reserva sem reinícios. Os marcos são escritos ao vivo à medida que a recolha e o despacho progridem.",
    bookCta: "Reservar este trajeto",
    trackCta: "Rastrear um envio existente",
  },
};

const LOGISTICS_QUOTE_COPY_AR: DeepPartial<LogisticsQuoteCopy> = {
  metadata: {
    title: "طلب عرض سعر | HenryCo Logistics",
    description: "احصل على عرض سعر لوجستي إرشادي قبل الالتزام بالحجز.",
  },
  hero: {
    eyebrow: "المسار · الخدمة · الملف",
    title: "اطّلع على السعر قبل الحجز.",
    body: "يُحسب وفق مسارك ونوع الخدمة وملف الطرد. تُحفظ العروض بمرجع تتبّع، فيتمّ الحجز لاحقاً بنقرة واحدة — دون إعادة الإدخال.",
    badge: "إرشادي · قابل للتحويل إلى حجز · بلا إضافات مفاجِئة",
  },
  whatQuoteShows: {
    eyebrow: "ما يُظهره العرض",
    items: {
      laneTier: {
        title: "المسار ومستوى الخدمة",
        body: "قياسي أو سريع أو مجدول — مسعّر بحسب المناطق الفعلية التي تنقل بينها.",
      },
      itemised: {
        title: "إجمالي مفصّل",
        body: "الرسوم الأساسية وشرائح الوزن وأي مناولة — مرئية قبل الالتزام، لا عند الباب.",
      },
      promiseWindow: {
        title: "نافذة الوعد",
        body: "نطاقات ساعات صادقة مع قراءة ثقة، لا رقم وحيد لا يمكن الالتزام به.",
      },
    },
  },
  quoteDetails: {
    eyebrow: "تفاصيل العرض",
  },
  afterSubmit: {
    eyebrow: "ما يحدث بعد الإرسال",
    stepLabel: "الخطوة",
    items: {
      returned: {
        title: "إعادة العرض فوراً",
        body: "يظهر الإجمالي الإرشادي ونافذة الوعد في السطر مباشرة — دون الحاجة إلى رسالة متابعة لرؤية السعر.",
      },
      reference: {
        title: "حفظ مرجع للاستخدام لاحقاً",
        body: "يُخزَّن كل عرض بمرجع تتبّع. حوّله إلى حجز من النموذج نفسه حين تكون مستعداً.",
      },
      pickup: {
        title: "جدولة الاستلام بسلاسة",
        body: "يُصدر الحجز رمز تتبّع، ويبدأ قسم الإرسال التوجيه ضمن ساعات التشغيل الحالية.",
      },
    },
  },
  volume: {
    eyebrow: "تحتاج تسعيراً بالحجم؟",
    body: "المسارات المتكرّرة بين الشركات، والإرسال متعدّد المحطات، والتسعير التعاقدي تمرّ عبر مكتب الأعمال — لا عبر عرض عام سريع.",
    talkLink: "تحدّث مع مكتب الأعمال",
    compareLink: "قارن مستويات الخدمة",
  },
  conversion: {
    eyebrow: "جاهز للشحن؟",
    title: "حوّل العرض — سنُصدر رمز تتبّع فوراً.",
    body: "ينتقل التسعير إلى الحجز دون إعادة ضبط. تُكتب المعالم مباشرةً مع تقدّم الاستلام والإرسال.",
    bookCta: "احجز هذا المسار",
    trackCta: "تتبّع شحنة قائمة",
  },
};

const LOGISTICS_QUOTE_COPY_DE: DeepPartial<LogisticsQuoteCopy> = {
  metadata: {
    title: "Angebot anfordern | HenryCo Logistics",
    description: "Holen Sie sich vor der Buchung ein indikatives Logistikangebot.",
  },
  hero: {
    eyebrow: "Strecke · Service · Profil",
    title: "Sehen Sie den Preis, bevor Sie buchen.",
    body: "Berechnet aus Ihrer Strecke, Servicetyp und Paketprofil. Angebote werden mit einer Tracking-Referenz gespeichert, sodass die Buchung später ein Klick ist — ohne erneutes Eintippen.",
    badge: "Indikativ · In Buchung umwandelbar · Keine überraschenden Aufschläge",
  },
  whatQuoteShows: {
    eyebrow: "Was das Angebot zeigt",
    items: {
      laneTier: {
        title: "Strecke und Servicestufe",
        body: "Standard, Express oder geplant — bepreist anhand der tatsächlichen Zonen, zwischen denen Sie versenden.",
      },
      itemised: {
        title: "Aufgeschlüsselter Gesamtbetrag",
        body: "Grundtarif, Gewichtsstufen und etwaige Handhabung — sichtbar vor der Verpflichtung, nicht erst an der Tür.",
      },
      promiseWindow: {
        title: "Versprechensfenster",
        body: "Ehrliche Stundenbänder mit einer Vertrauensangabe, keine einzige Zahl, die wir nicht halten können.",
      },
    },
  },
  quoteDetails: {
    eyebrow: "Angebotsdetails",
  },
  afterSubmit: {
    eyebrow: "Was nach dem Absenden passiert",
    stepLabel: "Schritt",
    items: {
      returned: {
        title: "Angebot sofort zurückgegeben",
        body: "Indikativer Gesamtbetrag und Versprechensfenster erscheinen direkt in der Zeile — keine Folge-E-Mail nötig, um den Preis zu sehen.",
      },
      reference: {
        title: "Referenz für später gespeichert",
        body: "Jedes Angebot wird mit einer Tracking-Referenz gespeichert. Wandeln Sie es im selben Formular in eine Buchung um, wenn Sie bereit sind.",
      },
      pickup: {
        title: "Abholung sauber eingeplant",
        body: "Die Buchung erzeugt einen Tracking-Code, und der Disponent beginnt das Routing innerhalb der aktuellen Betriebszeiten.",
      },
    },
  },
  volume: {
    eyebrow: "Volumenpreise benötigt?",
    body: "Wiederkehrende B2B-Strecken, Multi-Stopp-Dispatch und Vertragspreise laufen über den Business-Desk — nicht über ein schnelles öffentliches Angebot.",
    talkLink: "Mit dem Business-Desk sprechen",
    compareLink: "Servicestufen vergleichen",
  },
  conversion: {
    eyebrow: "Versandbereit?",
    title: "Wandeln Sie das Angebot um — wir stellen sofort einen Tracking-Code aus.",
    body: "Die Preise werden ohne Zurücksetzen in die Buchung übernommen. Meilensteine werden live geschrieben, während Abholung und Versand fortschreiten.",
    bookCta: "Diese Strecke buchen",
    trackCta: "Bestehende Sendung verfolgen",
  },
};

const LOGISTICS_QUOTE_COPY_IT: DeepPartial<LogisticsQuoteCopy> = {
  metadata: {
    title: "Richiedi un preventivo | HenryCo Logistics",
    description: "Ottieni un preventivo logistico indicativo prima di impegnarti in una prenotazione.",
  },
  hero: {
    eyebrow: "Tratta · Servizio · Profilo",
    title: "Vedi il prezzo prima di prenotare.",
    body: "Calcolato dalla tua tratta, dal tipo di servizio e dal profilo del collo. I preventivi vengono salvati con un riferimento di tracciamento, così la prenotazione è a un clic — senza riscrivere nulla.",
    badge: "Indicativo · Convertibile in prenotazione · Niente sorprese",
  },
  whatQuoteShows: {
    eyebrow: "Cosa mostra il preventivo",
    items: {
      laneTier: {
        title: "Tratta e livello di servizio",
        body: "Standard, espresso o programmato — tariffato sulle zone reali tra cui ti sposti.",
      },
      itemised: {
        title: "Totale dettagliato",
        body: "Tariffa base, fasce di peso ed eventuale movimentazione — visibili prima dell’impegno, non alla porta.",
      },
      promiseWindow: {
        title: "Finestra di promessa",
        body: "Fasce orarie oneste con un’indicazione di fiducia, non un numero unico che non possiamo mantenere.",
      },
    },
  },
  quoteDetails: {
    eyebrow: "Dettagli del preventivo",
  },
  afterSubmit: {
    eyebrow: "Cosa succede dopo l’invio",
    stepLabel: "Passo",
    items: {
      returned: {
        title: "Preventivo restituito all’istante",
        body: "Il totale indicativo e la finestra di promessa appaiono in linea — non serve un’e-mail di follow-up per vedere il prezzo.",
      },
      reference: {
        title: "Riferimento salvato per dopo",
        body: "Ogni preventivo si archivia con un riferimento di tracciamento. Convertilo in prenotazione dallo stesso modulo quando sei pronto.",
      },
      pickup: {
        title: "Ritiro pianificato in modo pulito",
        body: "La prenotazione emette un codice di tracciamento e il dispatch inizia l’instradamento entro l’attuale orario operativo.",
      },
    },
  },
  volume: {
    eyebrow: "Servono prezzi a volume?",
    body: "Tratte B2B ricorrenti, dispatch multi-fermata e prezzi a contratto passano per il business desk — non per un preventivo pubblico veloce.",
    talkLink: "Parla con il business desk",
    compareLink: "Confronta i livelli di servizio",
  },
  conversion: {
    eyebrow: "Pronto a spedire?",
    title: "Converti il preventivo — emetteremo subito un codice di tracciamento.",
    body: "Il prezzo si trasferisce alla prenotazione senza azzeramenti. Le tappe si scrivono in tempo reale man mano che il ritiro e il dispatch procedono.",
    bookCta: "Prenota questa tratta",
    trackCta: "Traccia una spedizione esistente",
  },
};

const LOGISTICS_QUOTE_COPY_ZH: DeepPartial<LogisticsQuoteCopy> = {
  metadata: {
    title: "申请报价 | HenryCo Logistics",
    description: "在确认预订之前先获取指示性物流报价。",
  },
  hero: {
    eyebrow: "线路 · 服务 · 包裹",
    title: "预订前先看价格。",
    body: "根据您的线路、服务类型和包裹信息定价。报价会附带追踪编号一同保存,稍后预订只需一键 — 无需重新填写。",
    badge: "指示性 · 可转为预订 · 无意外加价",
  },
  whatQuoteShows: {
    eyebrow: "报价中可见的内容",
    items: {
      laneTier: {
        title: "线路与服务等级",
        body: "标准、加急或预约 — 按您实际跨越的区域计价。",
      },
      itemised: {
        title: "明细总额",
        body: "基础运费、重量段以及任何搬运费 — 在确认前可见,而非在门口才告知。",
      },
      promiseWindow: {
        title: "承诺时间窗口",
        body: "诚实的小时区间附带置信度提示,而非一个无法兑现的单一数字。",
      },
    },
  },
  quoteDetails: {
    eyebrow: "报价详情",
  },
  afterSubmit: {
    eyebrow: "提交后会发生什么",
    stepLabel: "步骤",
    items: {
      returned: {
        title: "即时返回报价",
        body: "指示性总额与承诺时间窗口直接在页面中显示 — 无需后续邮件即可看到价格。",
      },
      reference: {
        title: "保留参考编号以便日后使用",
        body: "每份报价都会附带追踪编号保存。准备好时,可以在同一表单中将其转为预订。",
      },
      pickup: {
        title: "顺畅安排取件",
        body: "预订会生成追踪码,调度将在当前运营时段内开始安排路线。",
      },
    },
  },
  volume: {
    eyebrow: "需要大宗价格?",
    body: "经常性的 B2B 线路、多点派送和合同定价由业务专席处理 — 而非快速公开报价。",
    talkLink: "联系业务专席",
    compareLink: "比较服务等级",
  },
  conversion: {
    eyebrow: "准备发货?",
    title: "转换报价 — 我们将立即签发追踪码。",
    body: "价格无重置直接转入预订。随着取件与派送推进,里程碑会实时写入。",
    bookCta: "预订此线路",
    trackCta: "追踪已有运单",
  },
};

const LOGISTICS_QUOTE_COPY_HI: DeepPartial<LogisticsQuoteCopy> = {
  metadata: {
    title: "कोटेशन का अनुरोध करें | HenryCo Logistics",
    description: "बुकिंग के लिए प्रतिबद्ध होने से पहले एक संकेतात्मक लॉजिस्टिक्स कोटेशन प्राप्त करें।",
  },
  hero: {
    eyebrow: "लेन · सेवा · प्रोफ़ाइल",
    title: "बुक करने से पहले कीमत देखें।",
    body: "आपकी लेन, सेवा प्रकार और पार्सल प्रोफ़ाइल के अनुसार मूल्यांकित। कोटेशन एक ट्रैकिंग संदर्भ के साथ सहेजे जाते हैं ताकि बाद में बुकिंग एक क्लिक की हो — दोबारा टाइप किए बिना।",
    badge: "संकेतात्मक · बुकिंग में परिवर्तनीय · कोई चौंकाने वाला शुल्क नहीं",
  },
  whatQuoteShows: {
    eyebrow: "कोटेशन क्या दिखाता है",
    items: {
      laneTier: {
        title: "लेन और सेवा स्तर",
        body: "मानक, एक्सप्रेस या निर्धारित — आप जिन वास्तविक ज़ोनों के बीच भेज रहे हैं उनके अनुसार मूल्यांकित।",
      },
      itemised: {
        title: "मदवार कुल राशि",
        body: "आधार किराया, वज़न बैंड और कोई भी हैंडलिंग — प्रतिबद्धता से पहले दिखाई देती है, दरवाज़े पर नहीं।",
      },
      promiseWindow: {
        title: "वादा खिड़की",
        body: "ईमानदार घंटे बैंड एक विश्वास संकेत के साथ, ऐसा कोई एक नंबर नहीं जिसे हम निभा न सकें।",
      },
    },
  },
  quoteDetails: {
    eyebrow: "कोटेशन विवरण",
  },
  afterSubmit: {
    eyebrow: "सबमिट करने के बाद क्या होता है",
    stepLabel: "चरण",
    items: {
      returned: {
        title: "तुरंत कोटेशन लौटाया गया",
        body: "संकेतात्मक कुल और वादा खिड़की पंक्ति में ही दिखाई देती है — कीमत देखने के लिए अनुवर्ती ई-मेल की ज़रूरत नहीं।",
      },
      reference: {
        title: "बाद के लिए संदर्भ सहेजा गया",
        body: "हर कोटेशन ट्रैकिंग संदर्भ के साथ संग्रहीत होता है। तैयार होने पर उसी फ़ॉर्म से इसे बुकिंग में बदलें।",
      },
      pickup: {
        title: "पिकअप साफ़-सुथरे ढंग से निर्धारित",
        body: "बुकिंग एक ट्रैकिंग कोड जारी करती है और डिस्पैच मौजूदा परिचालन घंटों के भीतर रूट करना शुरू कर देता है।",
      },
    },
  },
  volume: {
    eyebrow: "वॉल्यूम मूल्य चाहिए?",
    body: "आवर्ती B2B लेन, मल्टी-स्टॉप डिस्पैच और अनुबंध मूल्य व्यवसाय डेस्क से होकर जाते हैं — न कि एक त्वरित सार्वजनिक कोटेशन से।",
    talkLink: "व्यवसाय डेस्क से बात करें",
    compareLink: "सेवा स्तरों की तुलना करें",
  },
  conversion: {
    eyebrow: "भेजने के लिए तैयार?",
    title: "कोटेशन को परिवर्तित करें — हम तुरंत एक ट्रैकिंग कोड जारी करेंगे।",
    body: "मूल्य बिना रीसेट के बुकिंग में चला जाता है। पिकअप और डिस्पैच की प्रगति के साथ मील के पत्थर लाइव लिखे जाते हैं।",
    bookCta: "इस लेन को बुक करें",
    trackCta: "मौजूदा शिपमेंट को ट्रैक करें",
  },
};

const LOGISTICS_QUOTE_COPY_IG: DeepPartial<LogisticsQuoteCopy> = {
  metadata: {
    title: "Rịọ ọnụego | HenryCo Logistics",
    description: "Nweta ọnụego logistics ngosi tupu ị kwado nzọrọ.",
  },
  hero: {
    eyebrow: "Ụzọ · Ọrụ · Profaịlụ",
    title: "Lee ọnụego tupu ị kwado.",
    body: "A na-akwụ ụgwọ ya site n’ụzọ gị, ụdị ọrụ, na profaịlụ ngwugwu gị. A na-edebe ọnụego ndị a na ntụaka nlekota ka nzọrọ wee bụrụ otu ọpịpị mgbe ọ bụla — na-edegharị ihe ọzọ.",
    badge: "Ngosi · Nwere ike ịgbanwe ka ọ bụrụ nzọrọ · Enweghị mgbakwunye na-atụghị anya ya",
  },
  whatQuoteShows: {
    eyebrow: "Ihe ọnụego na-egosi",
    items: {
      laneTier: {
        title: "Ụzọ na ọkwa ọrụ",
        body: "Ọkọlọtọ, mmerughị, ma ọ bụ akara — a kwụrụ ụgwọ megide mpaghara ndị ị na-akwaga n’etiti ha.",
      },
      itemised: {
        title: "Mkpokọta ezi nkọwa",
        body: "Ụgwọ ntọala, ngalaba ịdị arọ, na njikwa ọ bụla — a hụrụ ya tupu mkwado, ọ bụghị n’ọnụ ụzọ.",
      },
      promiseWindow: {
        title: "Windo nkwa",
        body: "Mpaghara awa eziokwu nwere ngosi ntụkwasị obi, ọ bụghị otu ọnụọgụgụ anyị enweghị ike ijide.",
      },
    },
  },
  quoteDetails: {
    eyebrow: "Nkọwa ọnụego",
  },
  afterSubmit: {
    eyebrow: "Ihe na-eme mgbe ị nyefere",
    stepLabel: "Nzọụkwụ",
    items: {
      returned: {
        title: "E nyeghachiri ọnụego ozugbo",
        body: "Mkpokọta ngosi na windo nkwa na-apụta n’ahịrị ozugbo — ọ dịghị mkpa ozi e-mail soro ya iji hụ ọnụego.",
      },
      reference: {
        title: "E debere ntụaka maka emesia",
        body: "A na-edebe ọnụego ọ bụla na ntụaka nlekota. Gbanwee ya ka ọ bụrụ nzọrọ site n’otu fọm ahụ mgbe ị dị njikere.",
      },
      pickup: {
        title: "E hazi mbulata n’ụzọ doro anya",
        body: "Nzọrọ na-ewepụta koodu nlekota, mbufe wee malite ịhazi n’ime oge ọrụ ugbu a.",
      },
    },
  },
  volume: {
    eyebrow: "Ị chọrọ ọnụego olu?",
    body: "Ụzọ B2B na-aga aga, mbufe ọtụtụ nkwụsị, na ọnụego nkwekọrịta na-agafe site na nkuku azụmaahịa — ọ bụghị site na ọnụego ọha ngwa ngwa.",
    talkLink: "Gwa nkuku azụmaahịa okwu",
    compareLink: "Tụlee ọkwa ọrụ",
  },
  conversion: {
    eyebrow: "Ị dị njikere izipu?",
    title: "Gbanwee ọnụego — anyị ga-ewepụta koodu nlekota ozugbo.",
    body: "Ọnụego na-eburu na nzọrọ na-enweghị mmaliteghachi. A na-ede ihe ngosi n’oge mgbe mbulata na mbufe na-aga n’ihu.",
    bookCta: "Debe ụzọ a",
    trackCta: "Soro ihe e bufeworo",
  },
};

const LOGISTICS_QUOTE_COPY_YO: DeepPartial<LogisticsQuoteCopy> = {
  metadata: {
    title: "Béèrè ìpèsè iye | HenryCo Logistics",
    description: "Gba ìpèsè iye logistics tó ń tọ́ka kí o tó ṣe ìfọwọ́sí ìpamọ́.",
  },
  hero: {
    eyebrow: "Ọ̀nà · Iṣẹ́ · Àfihàn",
    title: "Wo iye náà kí o tó ṣe ìpamọ́.",
    body: "A ń ṣe iye láti orí ọ̀nà rẹ, irú iṣẹ́, àti àfihàn àpamọ́wọ́. A máa ń fi ìpèsè iye pa mọ́ pẹ̀lú ìtọ́kasí ìtọ́sí, kí ìpamọ́ tó kàn nìkan jẹ́ ìṣubú kan — láìsí títẹ̀wé lẹ́ẹ̀kan sí i.",
    badge: "Tó ń tọ́ka · Lè yí padà sí ìpamọ́ · Kò sí àfikún tí kò ṣe ìfojúsọ́nà",
  },
  whatQuoteShows: {
    eyebrow: "Ohun tí ìpèsè náà ń fihàn",
    items: {
      laneTier: {
        title: "Ọ̀nà àti ipele iṣẹ́",
        body: "Bíi ti gbogbo ìgbà, kíákíá, tàbí ti àkókò — a tì iye sí lórí àwọn àgbègbè gidi tí o ń kọjá láàrín wọn.",
      },
      itemised: {
        title: "Àpapọ̀ ní kọ̀ọ̀kan",
        body: "Owó orí ìpilẹ̀, àwọn ìpín ìwúwo, àti ìmúdára èyíkéyìí — a lè rí ṣáájú ìfọwọ́sí, kì í ṣe ní ẹnu-ọ̀nà.",
      },
      promiseWindow: {
        title: "Akoko ìlérí",
        body: "Àwọn ààlà wákàtí òtítọ́ pẹ̀lú àfihàn ìgbẹ́kẹ̀lé, kì í ṣe nọ́mbà kan tí a kò lè dúró tì.",
      },
    },
  },
  quoteDetails: {
    eyebrow: "Àlàyé ìpèsè",
  },
  afterSubmit: {
    eyebrow: "Ohun tó máa ṣẹlẹ̀ lẹ́yìn tí o bá fi ránṣẹ́",
    stepLabel: "Ìṣísẹ̀",
    items: {
      returned: {
        title: "A dá ìpèsè padà lẹ́sẹ̀kẹsẹ̀",
        body: "Àpapọ̀ tí ń tọ́ka àti akoko ìlérí yóò hàn lẹ́sẹ̀kẹsẹ̀ — kò sí ìmélì àtẹ̀le tí ń béèrè kí o tó rí iye náà.",
      },
      reference: {
        title: "A fi ìtọ́kasí pamọ́ fún àkókò tó ń bọ̀",
        body: "Ọ̀kọ̀ọ̀kan ìpèsè ni a máa ń kó pẹ̀lú ìtọ́kasí ìtọ́sí. Yí padà sí ìpamọ́ láti orí fọ́ọ̀mù kan náà tí o bá ti ṣetán.",
      },
      pickup: {
        title: "A ṣètò gbígba pẹ̀lú àìní pòòpòò",
        body: "Ìpamọ́ máa ń tu kóòdù ìtọ́sí jáde, àti pé sẹ́ńtà ìpín máa bẹ̀rẹ̀ ọ̀nà láàrín àkókò iṣẹ́ tó wà nísinsin yìí.",
      },
    },
  },
  volume: {
    eyebrow: "Ṣé o nílò iye fún ìṣòfin tó pọ̀?",
    body: "Àwọn ọ̀nà B2B tó ń tẹ̀síwájú, ìpín onírúurú-ìdúró, àti iye àdéhùn ń kọjá láti orí tábìlì iṣẹ́-òwò — kì í ṣe láti orí ìpèsè kíákíá ní gbangba.",
    talkLink: "Bá tábìlì iṣẹ́-òwò sọ̀rọ̀",
    compareLink: "Fi àwọn ipele iṣẹ́ wé ara wọn",
  },
  conversion: {
    eyebrow: "Ṣé o ti ṣetán láti firanṣẹ́?",
    title: "Yí ìpèsè náà padà — a óò tú kóòdù ìtọ́sí jáde lẹ́sẹ̀kẹsẹ̀.",
    body: "Iye náà yóò kọjá sí ìpamọ́ láìsí àtúntò. A máa ń kọ àwọn àmì ìṣẹ̀dáyé lójú-ẹsẹ̀ bí gbígba àti ìpín ti ń tẹ̀síwájú.",
    bookCta: "Ṣe ìpamọ́ ọ̀nà yìí",
    trackCta: "Tọpasẹ̀ ìfiránṣẹ́ tó wà",
  },
};

const LOGISTICS_QUOTE_COPY_HA: DeepPartial<LogisticsQuoteCopy> = {
  metadata: {
    title: "Nemi farashi | HenryCo Logistics",
    description: "Sami farashin logistics na ja-gora kafin ka tabbatar da yin rijista.",
  },
  hero: {
    eyebrow: "Hanya · Sabis · Bayanin kayan",
    title: "Duba farashin kafin ka yi rijista.",
    body: "An tsara farashi daga hanyarka, nau’in sabis, da bayanin fakitinka. Ana ajiye farashi tare da lambar bibiya don haka rijista daga baya ta ƙare cikin danna ɗaya — ba sake rubuta komai ba.",
    badge: "Na ja-gora · Yana iya juyawa zuwa rijista · Babu ƙarin abubuwa na ban mamaki",
  },
  whatQuoteShows: {
    eyebrow: "Abin da farashin ke nunawa",
    items: {
      laneTier: {
        title: "Hanya da matakin sabis",
        body: "Daidaita, gaggawa, ko an tsara shi — an saka farashi a kan ainihin yankunan da kake tafiya tsakaninsu.",
      },
      itemised: {
        title: "Jimillar dalla-dalla",
        body: "Kuɗin tushe, sassan nauyi, da kowane irin kulawa — ana iya gani kafin ƙaddamarwa, ba a ƙofa ba.",
      },
      promiseWindow: {
        title: "Tagar alkawari",
        body: "Sassan awa na gaskiya tare da ƙididdigar amincewa, ba lamba ɗaya da ba za mu iya cikawa ba.",
      },
    },
  },
  quoteDetails: {
    eyebrow: "Bayanan farashi",
  },
  afterSubmit: {
    eyebrow: "Abin da ke faruwa bayan ka ƙaddamar",
    stepLabel: "Mataki",
    items: {
      returned: {
        title: "An mayar da farashi nan da nan",
        body: "Jimilla ta ja-gora da tagar alkawari za su bayyana a layi kai tsaye — babu buƙatar imel ɗin bibiya don ganin farashin.",
      },
      reference: {
        title: "An ajiye lamba don baya",
        body: "Ana ajiye kowane farashi tare da lambar bibiya. Mayar da shi zuwa rijista daga wannan fam ɗin idan ka shirya.",
      },
      pickup: {
        title: "An tsara ɗauka cikin tsabta",
        body: "Rijista ta fitar da lambar bibiya, kuma sashen aikawa zai fara ba da hanya cikin lokutan aiki na yanzu.",
      },
    },
  },
  volume: {
    eyebrow: "Kana buƙatar farashin kaya mai yawa?",
    body: "Hanyoyin B2B masu maimaitawa, aikawa mai tasha-tasha, da farashin yarjejeniya suna ratsa ta tebur ɗin kasuwanci — ba ta wani farashi mai sauri na jama’a ba.",
    talkLink: "Yi magana da tebur ɗin kasuwanci",
    compareLink: "Kwatanta matakan sabis",
  },
  conversion: {
    eyebrow: "Kana shirye ka aika?",
    title: "Juya farashin — za mu fitar da lambar bibiya nan take.",
    body: "Farashin yana ci gaba zuwa rijista ba tare da maimaitawa ba. Manyan abubuwa suna rubutuwa kai tsaye yayin da ɗauka da aikawa ke ci gaba.",
    bookCta: "Yi rijistar wannan hanyar",
    trackCta: "Bi sahun aikawar da ke akwai",
  },
};

const LOGISTICS_QUOTE_LOCALE_MAP: Partial<
  Record<AppLocale, DeepPartial<LogisticsQuoteCopy>>
> = {
  fr: LOGISTICS_QUOTE_COPY_FR,
  es: LOGISTICS_QUOTE_COPY_ES,
  pt: LOGISTICS_QUOTE_COPY_PT,
  ar: LOGISTICS_QUOTE_COPY_AR,
  de: LOGISTICS_QUOTE_COPY_DE,
  it: LOGISTICS_QUOTE_COPY_IT,
  zh: LOGISTICS_QUOTE_COPY_ZH,
  hi: LOGISTICS_QUOTE_COPY_HI,
  ig: LOGISTICS_QUOTE_COPY_IG,
  yo: LOGISTICS_QUOTE_COPY_YO,
  ha: LOGISTICS_QUOTE_COPY_HA,
};

export function getLogisticsQuoteCopy(locale: AppLocale): LogisticsQuoteCopy {
  const overrides = LOGISTICS_QUOTE_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      LOGISTICS_QUOTE_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as LogisticsQuoteCopy;
  }
  return LOGISTICS_QUOTE_COPY_EN;
}

/** @internal */
export function __dangerouslyGetEnglishLogisticsQuoteCopy(): LogisticsQuoteCopy {
  return LOGISTICS_QUOTE_COPY_EN;
}
