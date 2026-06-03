import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * CareServicesCopy — i18n surface for the public Care services page
 * (`apps/care/app/(public)/services/page.tsx`). Covers metadata,
 * editorial hero, three-lane service grid, package collection headings
 * and card labels, three-step service flow, and the closing cross-link
 * band to the pricing page.
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each locale is
 * a DeepPartial that deep-merges over EN so missing keys fall back to EN
 * silently at runtime. Mirrors the shape of `hub-public-copy.ts`.
 */
export type CareServicesCopy = {
  metadata: {
    /** Title template — `{division}` is replaced with the division name. */
    titleTemplate: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    body: string;
  };
  threeLanes: {
    eyebrow: string;
    garmentCare: {
      title: string;
      body: string;
    };
    homeCleaning: {
      title: string;
      body: string;
    };
    officeCleaning: {
      title: string;
      body: string;
    };
  };
  packages: {
    collectionEyebrow: string;
    homeHeading: string;
    officeHeading: string;
    staffUnit: string;
  };
  flow: {
    eyebrow: string;
    stepLabel: string;
    scope: {
      title: string;
      body: string;
    };
    execution: {
      title: string;
      body: string;
    };
    completion: {
      title: string;
      body: string;
    };
  };
  closing: {
    eyebrow: string;
    title: string;
    body: string;
    cta: string;
  };
};

const CARE_SERVICES_COPY_EN: CareServicesCopy = {
  metadata: {
    titleTemplate: "Services | {division}",
    description:
      "Explore garment care, home cleaning, office cleaning, pickup, delivery, and recurring services from Henry Onyx Fabric Care.",
  },
  hero: {
    eyebrow: "Service collection",
    title: "Wardrobes, homes, workplaces — one operating standard.",
    body: "Garment care, home cleaning, and office cleaning held on one standard of timing, communication, and quality.",
  },
  threeLanes: {
    eyebrow: "Three lanes",
    garmentCare: {
      title: "Garment care",
      body: "Dry cleaning, laundry, pressing, stain treatment, delicate handling, urgent turnaround, and return delivery support.",
    },
    homeCleaning: {
      title: "Home cleaning",
      body: "One-time and recurring home cleaning, deep cleaning, move-in or move-out support, and carefully planned visit windows.",
    },
    officeCleaning: {
      title: "Office cleaning",
      body: "Office suite cleaning, common-area care, after-hours execution, and recurring commercial coverage shaped around your site.",
    },
  },
  packages: {
    collectionEyebrow: "Package collection",
    homeHeading: "Home cleaning packages",
    officeHeading: "Office cleaning packages",
    staffUnit: "staff",
  },
  flow: {
    eyebrow: "Service flow",
    stepLabel: "Step",
    scope: {
      title: "Scope confirmation",
      body: "We confirm what is being handled, where the service starts, and what completion looks like.",
    },
    execution: {
      title: "Controlled execution",
      body: "Wardrobe, home, and office lanes follow tailored execution standards instead of one generic checklist.",
    },
    completion: {
      title: "Verified completion",
      body: "Each request ends with a clear completion state, support follow-up path, and a traceable service record.",
    },
  },
  closing: {
    eyebrow: "Next step",
    title: "Choose the right service, then book with confidence.",
    body: "Review the service model here, then use the pricing page for exact rates and fee rules before you submit your booking.",
    cta: "Review pricing",
  },
};

const CARE_SERVICES_COPY_FR: DeepPartial<CareServicesCopy> = {
  metadata: {
    titleTemplate: "Services | {division}",
    description:
      "Découvrez l’entretien textile, le nettoyage à domicile, le nettoyage de bureaux, l’enlèvement, la livraison et les prestations récurrentes de Henry Onyx Fabric Care.",
  },
  hero: {
    eyebrow: "Collection de services",
    title: "Garde-robes, foyers, lieux de travail — un seul standard opérationnel.",
    body: "Entretien textile, nettoyage à domicile et nettoyage de bureaux, tenus au même standard de ponctualité, de communication et de qualité.",
  },
  threeLanes: {
    eyebrow: "Trois lignes",
    garmentCare: {
      title: "Entretien textile",
      body: "Nettoyage à sec, blanchisserie, repassage, traitement des taches, manipulation des pièces délicates, délais urgents et livraison retour.",
    },
    homeCleaning: {
      title: "Nettoyage à domicile",
      body: "Nettoyage ponctuel ou récurrent, nettoyage en profondeur, accompagnement à l’emménagement ou au déménagement, et créneaux planifiés avec soin.",
    },
    officeCleaning: {
      title: "Nettoyage de bureaux",
      body: "Nettoyage des espaces de bureau, entretien des parties communes, intervention en horaires décalés et couverture commerciale récurrente adaptée à votre site.",
    },
  },
  packages: {
    collectionEyebrow: "Sélection d’offres",
    homeHeading: "Offres nettoyage à domicile",
    officeHeading: "Offres nettoyage de bureaux",
    staffUnit: "agents",
  },
  flow: {
    eyebrow: "Déroulé de la prestation",
    stepLabel: "Étape",
    scope: {
      title: "Confirmation du périmètre",
      body: "Nous confirmons ce qui sera traité, où la prestation commence et ce que représente sa finalisation.",
    },
    execution: {
      title: "Exécution maîtrisée",
      body: "Les lignes garde-robe, domicile et bureau suivent des standards d’exécution dédiés, et non une liste générique.",
    },
    completion: {
      title: "Achèvement vérifié",
      body: "Chaque demande se conclut sur un état clair, un canal de suivi support et un dossier de prestation traçable.",
    },
  },
  closing: {
    eyebrow: "Étape suivante",
    title: "Choisissez le bon service, puis réservez en toute confiance.",
    body: "Consultez le modèle de service ici, puis utilisez la page tarification pour les taux exacts et les règles de frais avant de soumettre votre réservation.",
    cta: "Consulter la tarification",
  },
};

const CARE_SERVICES_COPY_ES: DeepPartial<CareServicesCopy> = {
  metadata: {
    titleTemplate: "Servicios | {division}",
    description:
      "Descubra el cuidado de prendas, la limpieza del hogar, la limpieza de oficinas, la recogida, la entrega y los servicios recurrentes de Henry Onyx Fabric Care.",
  },
  hero: {
    eyebrow: "Colección de servicios",
    title: "Armarios, hogares, lugares de trabajo: un único estándar operativo.",
    body: "Cuidado de prendas, limpieza del hogar y limpieza de oficinas, sostenidos por el mismo estándar de puntualidad, comunicación y calidad.",
  },
  threeLanes: {
    eyebrow: "Tres líneas",
    garmentCare: {
      title: "Cuidado de prendas",
      body: "Tintorería, lavandería, planchado, tratamiento de manchas, manipulación delicada, plazos urgentes y entrega de devolución.",
    },
    homeCleaning: {
      title: "Limpieza del hogar",
      body: "Limpieza puntual y recurrente, limpieza a fondo, apoyo en mudanzas de entrada o salida, y franjas de visita planificadas con cuidado.",
    },
    officeCleaning: {
      title: "Limpieza de oficinas",
      body: "Limpieza de despachos, cuidado de zonas comunes, ejecución fuera de horario y cobertura comercial recurrente adaptada a su sede.",
    },
  },
  packages: {
    collectionEyebrow: "Colección de paquetes",
    homeHeading: "Paquetes de limpieza del hogar",
    officeHeading: "Paquetes de limpieza de oficinas",
    staffUnit: "personas",
  },
  flow: {
    eyebrow: "Flujo del servicio",
    stepLabel: "Paso",
    scope: {
      title: "Confirmación del alcance",
      body: "Confirmamos qué se va a atender, dónde comienza el servicio y qué define su finalización.",
    },
    execution: {
      title: "Ejecución controlada",
      body: "Las líneas de armario, hogar y oficina siguen estándares de ejecución específicos, no una lista genérica.",
    },
    completion: {
      title: "Cierre verificado",
      body: "Cada solicitud termina con un estado claro, una vía de seguimiento de soporte y un registro de servicio rastreable.",
    },
  },
  closing: {
    eyebrow: "Siguiente paso",
    title: "Elija el servicio adecuado y luego reserve con confianza.",
    body: "Revise aquí el modelo de servicio y, a continuación, use la página de precios para conocer las tarifas exactas y las reglas de cargos antes de enviar su reserva.",
    cta: "Ver precios",
  },
};

const CARE_SERVICES_COPY_PT: DeepPartial<CareServicesCopy> = {
  metadata: {
    titleTemplate: "Serviços | {division}",
    description:
      "Conheça os cuidados com vestuário, a limpeza residencial, a limpeza de escritórios, a recolha, a entrega e os serviços recorrentes da Henry Onyx Fabric Care.",
  },
  hero: {
    eyebrow: "Coleção de serviços",
    title: "Guarda-roupas, lares, locais de trabalho — um único padrão operacional.",
    body: "Cuidados com vestuário, limpeza residencial e limpeza de escritórios, sustentados pelo mesmo padrão de pontualidade, comunicação e qualidade.",
  },
  threeLanes: {
    eyebrow: "Três frentes",
    garmentCare: {
      title: "Cuidados com vestuário",
      body: "Limpeza a seco, lavandaria, passadoria, tratamento de nódoas, manuseio delicado, prazos urgentes e entrega de devolução.",
    },
    homeCleaning: {
      title: "Limpeza residencial",
      body: "Limpeza pontual e recorrente, limpeza profunda, apoio em mudanças de entrada ou saída, e janelas de visita planeadas com cuidado.",
    },
    officeCleaning: {
      title: "Limpeza de escritórios",
      body: "Limpeza de salas, cuidado de áreas comuns, execução fora do horário e cobertura comercial recorrente moldada ao seu local.",
    },
  },
  packages: {
    collectionEyebrow: "Coleção de pacotes",
    homeHeading: "Pacotes de limpeza residencial",
    officeHeading: "Pacotes de limpeza de escritórios",
    staffUnit: "profissionais",
  },
  flow: {
    eyebrow: "Fluxo do serviço",
    stepLabel: "Etapa",
    scope: {
      title: "Confirmação do âmbito",
      body: "Confirmamos o que será tratado, onde o serviço começa e como se caracteriza a sua conclusão.",
    },
    execution: {
      title: "Execução controlada",
      body: "As frentes de vestuário, residencial e escritório seguem padrões de execução próprios, e não uma lista genérica.",
    },
    completion: {
      title: "Conclusão verificada",
      body: "Cada pedido termina com um estado claro, um canal de acompanhamento do suporte e um registo de serviço rastreável.",
    },
  },
  closing: {
    eyebrow: "Próximo passo",
    title: "Escolha o serviço certo e reserve com confiança.",
    body: "Reveja aqui o modelo de serviço e, em seguida, consulte a página de preços para conhecer os valores exatos e as regras de tarifa antes de submeter a sua reserva.",
    cta: "Ver preços",
  },
};

const CARE_SERVICES_COPY_AR: DeepPartial<CareServicesCopy> = {
  metadata: {
    titleTemplate: "الخدمات | {division}",
    description:
      "اكتشف خدمات العناية بالملابس، وتنظيف المنازل والمكاتب، والاستلام والتوصيل، والخدمات المتكررة من Henry Onyx Fabric Care.",
  },
  hero: {
    eyebrow: "مجموعة الخدمات",
    title: "خزائن الملابس والمنازل وأماكن العمل — معيار تشغيلي واحد.",
    body: "العناية بالملابس وتنظيف المنازل وتنظيف المكاتب، جميعها وفق معيار واحد للالتزام بالمواعيد والتواصل والجودة.",
  },
  threeLanes: {
    eyebrow: "ثلاثة مسارات",
    garmentCare: {
      title: "العناية بالملابس",
      body: "تنظيف جاف، غسيل، كي، معالجة البقع، تعامل دقيق مع القطع الحساسة، تنفيذ عاجل، وخدمة توصيل العودة.",
    },
    homeCleaning: {
      title: "تنظيف المنازل",
      body: "تنظيف لمرة واحدة أو متكرر، تنظيف عميق، دعم الانتقال إلى المنزل أو منه، ومواعيد زيارة مدروسة بعناية.",
    },
    officeCleaning: {
      title: "تنظيف المكاتب",
      body: "تنظيف أجنحة المكاتب، العناية بالمناطق المشتركة، التنفيذ خارج أوقات الدوام، وتغطية تجارية متكررة مصممة لموقعك.",
    },
  },
  packages: {
    collectionEyebrow: "مجموعة الباقات",
    homeHeading: "باقات تنظيف المنازل",
    officeHeading: "باقات تنظيف المكاتب",
    staffUnit: "أفراد",
  },
  flow: {
    eyebrow: "مسار الخدمة",
    stepLabel: "الخطوة",
    scope: {
      title: "تأكيد النطاق",
      body: "نؤكد ما سيتم التعامل معه، ومن أين تبدأ الخدمة، وكيف يبدو إنجازها.",
    },
    execution: {
      title: "تنفيذ مضبوط",
      body: "تتبع مسارات الملابس والمنازل والمكاتب معايير تنفيذ مخصصة، وليست قائمة فحص عامة واحدة.",
    },
    completion: {
      title: "إنجاز موثّق",
      body: "ينتهي كل طلب بحالة إنجاز واضحة، ومسار متابعة للدعم، وسجل خدمة قابل للتتبع.",
    },
  },
  closing: {
    eyebrow: "الخطوة التالية",
    title: "اختر الخدمة المناسبة، ثم احجز بثقة.",
    body: "راجع نموذج الخدمة هنا، ثم استخدم صفحة التسعير لمعرفة الأسعار الدقيقة وقواعد الرسوم قبل إرسال الحجز.",
    cta: "مراجعة الأسعار",
  },
};

const CARE_SERVICES_COPY_DE: DeepPartial<CareServicesCopy> = {
  metadata: {
    titleTemplate: "Leistungen | {division}",
    description:
      "Entdecken Sie Kleiderpflege, Wohnungs- und Büroreinigung, Abholung, Lieferung sowie wiederkehrende Leistungen von Henry Onyx Fabric Care.",
  },
  hero: {
    eyebrow: "Leistungsspektrum",
    title: "Garderoben, Wohnungen, Arbeitsplätze — ein einheitlicher Betriebsstandard.",
    body: "Kleiderpflege, Wohnungs- und Büroreinigung, gehalten auf demselben Standard in Pünktlichkeit, Kommunikation und Qualität.",
  },
  threeLanes: {
    eyebrow: "Drei Linien",
    garmentCare: {
      title: "Kleiderpflege",
      body: "Chemische Reinigung, Wäsche, Bügeln, Fleckenbehandlung, sorgsamer Umgang mit empfindlichen Stücken, Eilbearbeitung und Rücklieferung.",
    },
    homeCleaning: {
      title: "Wohnungsreinigung",
      body: "Einmalige und wiederkehrende Wohnungsreinigung, Grundreinigung, Unterstützung beim Ein- oder Auszug sowie sorgfältig geplante Termine.",
    },
    officeCleaning: {
      title: "Büroreinigung",
      body: "Büroflächenreinigung, Pflege von Gemeinschaftsbereichen, Einsätze außerhalb der Geschäftszeiten und wiederkehrende gewerbliche Betreuung passend zu Ihrem Standort.",
    },
  },
  packages: {
    collectionEyebrow: "Paketauswahl",
    homeHeading: "Pakete Wohnungsreinigung",
    officeHeading: "Pakete Büroreinigung",
    staffUnit: "Mitarbeitende",
  },
  flow: {
    eyebrow: "Ablauf der Leistung",
    stepLabel: "Schritt",
    scope: {
      title: "Umfang bestätigen",
      body: "Wir bestätigen, was bearbeitet wird, wo die Leistung beginnt und woran der Abschluss erkennbar ist.",
    },
    execution: {
      title: "Kontrollierte Ausführung",
      body: "Garderobe, Wohnung und Büro folgen jeweils eigenen Ausführungsstandards anstelle einer allgemeinen Checkliste.",
    },
    completion: {
      title: "Verifizierter Abschluss",
      body: "Jede Anfrage endet mit einem klaren Abschlussstatus, einem Support-Pfad zur Nachverfolgung und einem nachvollziehbaren Leistungsnachweis.",
    },
  },
  closing: {
    eyebrow: "Nächster Schritt",
    title: "Wählen Sie die passende Leistung und buchen Sie mit Vertrauen.",
    body: "Prüfen Sie hier das Leistungsmodell und nutzen Sie anschließend die Preisseite für genaue Sätze und Gebührenregeln, bevor Sie Ihre Buchung absenden.",
    cta: "Preise ansehen",
  },
};

const CARE_SERVICES_COPY_IT: DeepPartial<CareServicesCopy> = {
  metadata: {
    titleTemplate: "Servizi | {division}",
    description:
      "Scopri la cura del guardaroba, la pulizia di case e uffici, il ritiro, la consegna e i servizi ricorrenti di Henry Onyx Fabric Care.",
  },
  hero: {
    eyebrow: "Collezione di servizi",
    title: "Guardaroba, case, ambienti di lavoro — un unico standard operativo.",
    body: "Cura del guardaroba, pulizie domestiche e pulizie per uffici, tenute sullo stesso standard di puntualità, comunicazione e qualità.",
  },
  threeLanes: {
    eyebrow: "Tre linee",
    garmentCare: {
      title: "Cura del guardaroba",
      body: "Lavaggio a secco, lavanderia, stiratura, trattamento delle macchie, capi delicati, urgenze e consegna di ritorno.",
    },
    homeCleaning: {
      title: "Pulizie domestiche",
      body: "Interventi singoli e ricorrenti, pulizie a fondo, supporto per trasloco in entrata o uscita e finestre di intervento pianificate con cura.",
    },
    officeCleaning: {
      title: "Pulizie per uffici",
      body: "Pulizia delle aree ufficio, cura degli spazi comuni, interventi fuori orario e copertura commerciale ricorrente disegnata sulla tua sede.",
    },
  },
  packages: {
    collectionEyebrow: "Collezione di pacchetti",
    homeHeading: "Pacchetti pulizie domestiche",
    officeHeading: "Pacchetti pulizie per uffici",
    staffUnit: "addetti",
  },
  flow: {
    eyebrow: "Flusso del servizio",
    stepLabel: "Fase",
    scope: {
      title: "Conferma del perimetro",
      body: "Confermiamo cosa verrà gestito, dove inizia il servizio e che cosa rappresenta il completamento.",
    },
    execution: {
      title: "Esecuzione controllata",
      body: "Guardaroba, casa e ufficio seguono standard di esecuzione dedicati, non una checklist generica.",
    },
    completion: {
      title: "Completamento verificato",
      body: "Ogni richiesta si chiude con uno stato chiaro, un canale di follow-up del supporto e un registro di servizio tracciabile.",
    },
  },
  closing: {
    eyebrow: "Passo successivo",
    title: "Scegli il servizio giusto, poi prenota con sicurezza.",
    body: "Esamina qui il modello di servizio, quindi consulta la pagina dei prezzi per tariffe precise e regole di addebito prima di inviare la prenotazione.",
    cta: "Vedi i prezzi",
  },
};

const CARE_SERVICES_COPY_ZH: DeepPartial<CareServicesCopy> = {
  metadata: {
    titleTemplate: "服务 | {division}",
    description:
      "了解 Henry Onyx Fabric Care 的衣物护理、家庭保洁、办公室保洁、取送以及周期性服务。",
  },
  hero: {
    eyebrow: "服务体系",
    title: "衣橱、家居、办公空间——同一套运营标准。",
    body: "衣物护理、家庭保洁与办公室保洁,皆以同一套准时、沟通与品质标准支撑。",
  },
  threeLanes: {
    eyebrow: "三条主线",
    garmentCare: {
      title: "衣物护理",
      body: "干洗、水洗、熨烫、去渍、精细衣物处理、加急周转,以及送回上门支持。",
    },
    homeCleaning: {
      title: "家庭保洁",
      body: "单次与周期性家庭保洁、深度清洁、入住或退租支持,以及经过精心规划的上门时段。",
    },
    officeCleaning: {
      title: "办公室保洁",
      body: "办公区域清洁、公共区域维护、非工作时段执行,以及围绕您场地量身定制的周期性商务覆盖。",
    },
  },
  packages: {
    collectionEyebrow: "套餐组合",
    homeHeading: "家庭保洁套餐",
    officeHeading: "办公室保洁套餐",
    staffUnit: "位人员",
  },
  flow: {
    eyebrow: "服务流程",
    stepLabel: "步骤",
    scope: {
      title: "范围确认",
      body: "我们确认需要处理的内容、服务的起点,以及完成所对应的具体形态。",
    },
    execution: {
      title: "受控执行",
      body: "衣物、家庭与办公三条主线遵循各自的执行标准,而非同一份通用清单。",
    },
    completion: {
      title: "确认完成",
      body: "每一次请求都以清晰的完成状态、明确的支持跟进通道,以及可追溯的服务记录收尾。",
    },
  },
  closing: {
    eyebrow: "下一步",
    title: "选定合适的服务,然后从容下单。",
    body: "请在此审视服务模式,再前往价格页面查阅精确费率与费用规则,然后再提交预订。",
    cta: "查看价格",
  },
};

const CARE_SERVICES_COPY_HI: DeepPartial<CareServicesCopy> = {
  metadata: {
    titleTemplate: "सेवाएँ | {division}",
    description:
      "Henry Onyx Fabric Care की वस्त्र देखभाल, घरेलू सफाई, कार्यालय सफाई, पिकअप, डिलीवरी और नियमित सेवाओं को जानिए।",
  },
  hero: {
    eyebrow: "सेवा संग्रह",
    title: "अलमारी, घर और कार्यस्थल — एक ही परिचालन मानक।",
    body: "वस्त्र देखभाल, घरेलू सफाई और कार्यालय सफाई — सभी समयबद्धता, संवाद और गुणवत्ता के समान मानक पर।",
  },
  threeLanes: {
    eyebrow: "तीन धाराएँ",
    garmentCare: {
      title: "वस्त्र देखभाल",
      body: "ड्राई क्लीनिंग, लॉन्ड्री, इस्त्री, दाग़ उपचार, नाज़ुक कपड़ों का संभाला जाना, त्वरित निपटान और वापसी पर डिलीवरी सहायता।",
    },
    homeCleaning: {
      title: "घरेलू सफाई",
      body: "एकल और नियमित घरेलू सफाई, गहन सफाई, गृहप्रवेश या स्थानांतरण सहायता, तथा सोच-समझकर तय किए गए विज़िट समय।",
    },
    officeCleaning: {
      title: "कार्यालय सफाई",
      body: "कार्यालय कक्षों की सफाई, सामान्य क्षेत्रों की देखरेख, कार्यसमय के बाद का निष्पादन, तथा आपके परिसर के अनुसार नियमित व्यावसायिक कवरेज।",
    },
  },
  packages: {
    collectionEyebrow: "पैकेज संग्रह",
    homeHeading: "घरेलू सफाई पैकेज",
    officeHeading: "कार्यालय सफाई पैकेज",
    staffUnit: "कर्मी",
  },
  flow: {
    eyebrow: "सेवा प्रवाह",
    stepLabel: "चरण",
    scope: {
      title: "क्षेत्र की पुष्टि",
      body: "हम पुष्टि करते हैं कि क्या कार्य संभाला जाएगा, सेवा कहाँ से शुरू होगी और उसकी पूर्णता किस रूप में होगी।",
    },
    execution: {
      title: "नियंत्रित निष्पादन",
      body: "अलमारी, घर और कार्यालय की धाराएँ अलग-अलग समर्पित निष्पादन मानकों पर चलती हैं, न कि एक सामान्य चेकलिस्ट पर।",
    },
    completion: {
      title: "सत्यापित पूर्णता",
      body: "हर अनुरोध एक स्पष्ट पूर्णता स्थिति, सहायता के लिए अनुवर्ती मार्ग और एक खोज-योग्य सेवा अभिलेख के साथ समाप्त होता है।",
    },
  },
  closing: {
    eyebrow: "अगला चरण",
    title: "उपयुक्त सेवा चुनिए, फिर आत्मविश्वास के साथ बुकिंग कीजिए।",
    body: "यहाँ सेवा का प्रारूप देखिए, फिर बुकिंग सबमिट करने से पहले मूल्य पृष्ठ पर सटीक दरें और शुल्क नियम देखिए।",
    cta: "मूल्य देखें",
  },
};

const CARE_SERVICES_COPY_IG: DeepPartial<CareServicesCopy> = {
  metadata: {
    titleTemplate: "Ọrụ | {division}",
    description:
      "Mata banyere nlekọta uwe, nhicha ụlọ, nhicha ọfịs, mbu na nbuga, na ọrụ ndị na-aga n’ihu nke Henry Onyx Fabric Care.",
  },
  hero: {
    eyebrow: "Mkpokọta ọrụ",
    title: "Ebe ndokwa uwe, ụlọ obibi na ebe ọrụ — otu ọkwa nlekọta.",
    body: "Nlekọta uwe, nhicha ụlọ na nhicha ọfịs, niile na-arụ ọrụ n’otu ọkwa oge, nkwurịta okwu na ịdị mma.",
  },
  threeLanes: {
    eyebrow: "Okporo ụzọ atọ",
    garmentCare: {
      title: "Nlekọta uwe",
      body: "Nhicha akọrọ, ịsa uwe, ịgbatị uwe, ọgwụgwọ ntụpọ, ijide uwe na-emi emi, ngwa ngwa ngwa ngwa, na nkwado nbuga nlọghachi.",
    },
    homeCleaning: {
      title: "Nhicha ụlọ",
      body: "Nhicha ụlọ nke otu mgbe na nke na-aga n’ihu, nhicha miri emi, nkwado maka mbata na ọpụpụ, na oge nleta a tụlere nke ọma.",
    },
    officeCleaning: {
      title: "Nhicha ọfịs",
      body: "Nhicha ụlọ ọfịs, nlekọta ebe niile na-arụkọ ọrụ, ọrụ a na-arụ mgbe ọrụ kwụsịrị, na mkpuchi azụmaahịa na-aga n’ihu nke a haziri maka ebe gị.",
    },
  },
  packages: {
    collectionEyebrow: "Mkpokọta ngwugwu",
    homeHeading: "Ngwugwu nhicha ụlọ",
    officeHeading: "Ngwugwu nhicha ọfịs",
    staffUnit: "ndị ọrụ",
  },
  flow: {
    eyebrow: "Usoro ọrụ",
    stepLabel: "Nzọụkwụ",
    scope: {
      title: "Nkwenye oke ọrụ",
      body: "Anyị na-akwado ihe a ga-elekọta, ebe ọrụ ahụ ga-amalite, na otú mmechi ya ga-adị.",
    },
    execution: {
      title: "Mmezu nke a na-elekọta anya",
      body: "Okporo ụzọ uwe, ụlọ na ọfịs na-eso ụkpụrụ mmezu pụrụ iche, ọ bụghị otu ndepụta nke ọ bụla.",
    },
    completion: {
      title: "Mmechi a kwadoro",
      body: "Arịrịọ ọ bụla na-akwụsị n’ọkwa mmechi doro anya, ụzọ nsogharị nkwado, na ndekọ ọrụ enwere ike ịchọta.",
    },
  },
  closing: {
    eyebrow: "Nzọụkwụ ọzọ",
    title: "Họrọ ọrụ kwesịrị ekwesị, gaa kwaa ndoko nke ntụkwasị obi.",
    body: "Lelee usoro ọrụ ebe a, mgbe ahụ jiri ibe ọnụ ahịa hụ ọnụego kpọmkwem na iwu ụgwọ tupu ị zipu ndoko gị.",
    cta: "Lelee ọnụ ahịa",
  },
};

const CARE_SERVICES_COPY_YO: DeepPartial<CareServicesCopy> = {
  metadata: {
    titleTemplate: "Iṣẹ́ | {division}",
    description:
      "Wo ìtọ́jú aṣọ, ìmọ́tótó ilé, ìmọ́tótó ọ́fíìsì, gbígbé àti ìjíṣẹ́, àti àwọn iṣẹ́ tí ó máa ń tún padà láti Henry Onyx Fabric Care.",
  },
  hero: {
    eyebrow: "Àkójọ iṣẹ́",
    title: "Ilẹ̀-ìpamọ́-aṣọ, àwọn ilé, ibi-iṣẹ́ — ìwọ̀n iṣẹ́ kan ṣoṣo.",
    body: "Ìtọ́jú aṣọ, ìmọ́tótó ilé, àti ìmọ́tótó ọ́fíìsì — gbogbo wọn ní ìwọ̀n kan náà ti àkókò, ìbáraẹnisọ̀rọ̀ àti àdánidájú.",
  },
  threeLanes: {
    eyebrow: "Ìlà mẹ́ta",
    garmentCare: {
      title: "Ìtọ́jú aṣọ",
      body: "Fífọ̀ gbígbẹ, fífọ̀ pẹ̀lú omi, fífi-ìtẹ́, ìtọ́jú àbàwọ̀n, mímú aṣọ tí ó rọ̀ nínú àbójútó, ìparí kíákíá, àti ìjíṣẹ́ àpadàbọ̀.",
    },
    homeCleaning: {
      title: "Ìmọ́tótó ilé",
      body: "Ìmọ́tótó ilé lẹ́ẹ̀kan tàbí ọ̀pọ̀ ìgbà, ìmọ́tótó tó jinlẹ̀, ìrànlọ́wọ́ nígbà ìbẹ̀rẹ̀ tàbí ìjáde ilé, àti àwọn àkókò ìbẹ̀wò tí a ṣètò pẹ̀lú abojútó.",
    },
    officeCleaning: {
      title: "Ìmọ́tótó ọ́fíìsì",
      body: "Ìmọ́tótó ààyè ọ́fíìsì, ìtọ́jú àgbègbè àpapọ̀, iṣẹ́ lẹ́yìn-àkókò-iṣẹ́, àti ìbojútó-iṣẹ́-òwò tí ó máa ń tún padà, tí a ṣètò gẹ́gẹ́ bí àyè rẹ.",
    },
  },
  packages: {
    collectionEyebrow: "Àkójọ àpapọ̀",
    homeHeading: "Àwọn àpapọ̀ ìmọ́tótó ilé",
    officeHeading: "Àwọn àpapọ̀ ìmọ́tótó ọ́fíìsì",
    staffUnit: "òṣìṣẹ́",
  },
  flow: {
    eyebrow: "Ìṣàn iṣẹ́",
    stepLabel: "Ìgbésẹ̀",
    scope: {
      title: "Ìfìdí ààlà múlẹ̀",
      body: "À ń fìdí ohun tí a ó ṣe múlẹ̀, ibi tí iṣẹ́ yóò ti bẹ̀rẹ̀, àti ohun tí ìparí iṣẹ́ yóò dà.",
    },
    execution: {
      title: "Ṣíṣe tí a ń darí",
      body: "Ìlà aṣọ, ilé àti ọ́fíìsì ń tẹ̀lé ìwọ̀n ṣíṣe-iṣẹ́ tí ó dáké fún wọn, kì í ṣe àkójọ-ìwádìí gbogboogbò.",
    },
    completion: {
      title: "Ìparí tí a fọwọ́sí",
      body: "Ìbéèrè kọ̀ọ̀kan ń parí pẹ̀lú ìpò ìparí tó ṣe kedere, ọ̀nà ìfàsìn fún ìrànlọ́wọ́, àti àkọsílẹ̀ iṣẹ́ tí a lè tẹ̀lé.",
    },
  },
  closing: {
    eyebrow: "Ìgbésẹ̀ tó tẹ̀le",
    title: "Yan iṣẹ́ tó tọ́, kí o sì ṣe ìfìpamọ́ pẹ̀lú ìgbẹ́kẹ̀lé.",
    body: "Yẹ àpẹẹrẹ iṣẹ́ wo níbí, lẹ́yìn náà lo ojú-ìwé owó láti mọ àwọn àdéhùn pípéye àti òfin ọya kí o tó fi ìfìpamọ́ rẹ ránṣẹ́.",
    cta: "Wo àwọn owó",
  },
};

const CARE_SERVICES_COPY_HA: DeepPartial<CareServicesCopy> = {
  metadata: {
    titleTemplate: "Ayyuka | {division}",
    description:
      "Bincika kulawar tufafi, tsaftar gida, tsaftar ofis, ɗauka da kawowa, da ayyuka masu maimaituwa daga Henry Onyx Fabric Care.",
  },
  hero: {
    eyebrow: "Tarin ayyuka",
    title: "Ɗakunan tufafi, gidaje, wuraren aiki — mizanin aiki ɗaya tilo.",
    body: "Kulawar tufafi, tsaftar gida da tsaftar ofis — duka a kan mizani guda ɗaya na lokaci, sadarwa da inganci.",
  },
  threeLanes: {
    eyebrow: "Layuka uku",
    garmentCare: {
      title: "Kulawar tufafi",
      body: "Wanki na busasshe, wanki na ruwa, hauda, magance tabo, ɗaukar nauyin tufafi masu laushi, gaggawar gama aiki, da kawo dawowa.",
    },
    homeCleaning: {
      title: "Tsaftar gida",
      body: "Tsabtace gida sau ɗaya ko kuma akai-akai, tsaftacewa zurfafa, taimako kan ƙaurawa shiga ko fita, da lokutan ziyara da aka tsara da kyau.",
    },
    officeCleaning: {
      title: "Tsaftar ofis",
      body: "Tsaftar ɗakunan ofis, kulawa da wuraren da ake amfani da su tare, aiki bayan lokutan aiki, da rufin kasuwanci akai-akai da aka tsara bisa wurinka.",
    },
  },
  packages: {
    collectionEyebrow: "Tarin kunshe",
    homeHeading: "Kunshen tsaftar gida",
    officeHeading: "Kunshen tsaftar ofis",
    staffUnit: "ma’aikata",
  },
  flow: {
    eyebrow: "Hanyar aiki",
    stepLabel: "Mataki",
    scope: {
      title: "Tabbatar da iyaka",
      body: "Muna tabbatar da abin da za a yi, inda aikin zai fara, da yadda gama aiki zai kasance.",
    },
    execution: {
      title: "Aiwatarwa mai kulawa",
      body: "Layukan tufafi, gida da ofis suna bin mizanai na musamman kan aiwatarwa, ba jerin gama-gari guda ɗaya ba.",
    },
    completion: {
      title: "Gama aikin da aka tabbatar",
      body: "Kowane buƙata yana ƙarewa da bayyananniyar yanayin gama aiki, hanyar bibiya na tallafi, da rikodin aiki da ake iya bibiyarsa.",
    },
  },
  closing: {
    eyebrow: "Mataki na gaba",
    title: "Zaɓi sabis ɗin da ya dace, sannan ka yi ajiyar wuri da kwanciyar hankali.",
    body: "Duba samfurin sabis a nan, sannan yi amfani da shafin farashi don sanin ainihin kuɗaɗe da ƙa’idodin kuɗi kafin ka aika ajiyar wurinka.",
    cta: "Duba farashi",
  },
};

const CARE_SERVICES_LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<CareServicesCopy>>> = {
  fr: CARE_SERVICES_COPY_FR,
  es: CARE_SERVICES_COPY_ES,
  pt: CARE_SERVICES_COPY_PT,
  ar: CARE_SERVICES_COPY_AR,
  de: CARE_SERVICES_COPY_DE,
  it: CARE_SERVICES_COPY_IT,
  zh: CARE_SERVICES_COPY_ZH,
  hi: CARE_SERVICES_COPY_HI,
  ig: CARE_SERVICES_COPY_IG,
  yo: CARE_SERVICES_COPY_YO,
  ha: CARE_SERVICES_COPY_HA,
};

export function getCareServicesCopy(locale: AppLocale): CareServicesCopy {
  const overrides = CARE_SERVICES_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      CARE_SERVICES_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as CareServicesCopy;
  }
  return CARE_SERVICES_COPY_EN;
}

/** @internal */
export function __dangerouslyGetEnglishCareServicesCopy(): CareServicesCopy {
  return CARE_SERVICES_COPY_EN;
}
