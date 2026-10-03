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
    title: string;
    bookCta: string;
    compareCta: string;
  };
};

const CARE_CONTACT_COPY_EN: CareContactCopy = {
  metadata: {
    title: "Contact",
    description:
      "Contact Henry Onyx Fabric Care about a booking, a schedule change, billing, or a service in progress.",
  },
  hero: {
    eyebrow: "Contact and support",
    title: "One desk. Clear answers.",
    body: "Bookings, schedule changes, billing, or a service in progress.",
  },
  rail: {
    serviceHoursLabel: "Service hours",
    coverageLabel: "Coverage",
    coverageValue: "Garment, home, and office requests across covered zones",
    followUpLabel: "Follow-up",
    followUpValue: "One reference per request",
    defaultPickupHours: "8:00 AM – 6:00 PM",
  },
  sendMessage: {
    eyebrow: "Send a message",
  },
  channels: {
    eyebrow: "Direct channels",
    title: "Choose the route that fits the moment.",
    phoneTitle: "Phone support",
    phoneBody: "Same-day changes and anything urgent.",
    emailTitle: "Email support",
    emailBody: "Quotes, billing, and anything you want in writing.",
    whatsappTitle: "WhatsApp contact",
    whatsappBody: "Quick confirmations and payment proof.",
    copyLabel: "Copy",
  },
  tracking: {
    eyebrow: "Already have a tracking code?",
    body: "Track the service first — the latest update may answer your question.",
    trackLink: "Track a service",
    bookLink: "Start a booking",
  },
  footer: {
    title: "One desk, cleaner follow-up.",
    bookCta: "Start a booking",
    compareCta: "Compare services",
  },
};

const CARE_CONTACT_COPY_FR: DeepPartial<CareContactCopy> = {
  metadata: {
    title: "Contact",
  },
  hero: {
    eyebrow: "Contact et assistance",
    title: "Un seul guichet. Des réponses claires.",
  },
  rail: {
    serviceHoursLabel: "Heures de service",
    coverageLabel: "Couverture",
    coverageValue: "Demandes textile, domicile et bureau dans les zones desservies",
    followUpLabel: "Suivi",
  },
  sendMessage: {
    eyebrow: "Envoyer un message",
  },
  channels: {
    eyebrow: "Canaux directs",
    title: "Choisissez le canal qui correspond au moment.",
    phoneTitle: "Assistance téléphonique",
    emailTitle: "Assistance par e-mail",
    whatsappTitle: "Contact WhatsApp",
    copyLabel: "Copier",
  },
  tracking: {
    eyebrow: "Vous avez déjà un code de suivi ?",
    trackLink: "Suivre une prestation",
    bookLink: "Démarrer une réservation",
  },
  footer: {
    title: "Un seul guichet, un suivi plus net.",
    bookCta: "Démarrer une réservation",
    compareCta: "Comparer les prestations",
  },
};

const CARE_CONTACT_COPY_ES: DeepPartial<CareContactCopy> = {
  metadata: {
    title: "Contacto",
  },
  hero: {
    eyebrow: "Contacto y soporte",
    title: "Una sola mesa. Respuestas claras.",
  },
  rail: {
    serviceHoursLabel: "Horario de servicio",
    coverageLabel: "Cobertura",
    coverageValue: "Solicitudes de prendas, hogar y oficina en las zonas cubiertas",
    followUpLabel: "Seguimiento",
  },
  sendMessage: {
    eyebrow: "Enviar un mensaje",
  },
  channels: {
    eyebrow: "Canales directos",
    title: "Elija la vía que mejor se ajuste al momento.",
    phoneTitle: "Soporte telefónico",
    emailTitle: "Soporte por correo",
    whatsappTitle: "Contacto por WhatsApp",
    copyLabel: "Copiar",
  },
  tracking: {
    eyebrow: "¿Ya tiene un código de seguimiento?",
    trackLink: "Seguir un servicio",
    bookLink: "Iniciar una reserva",
  },
  footer: {
    title: "Una sola mesa, un seguimiento más claro.",
    bookCta: "Iniciar una reserva",
    compareCta: "Comparar servicios",
  },
};

const CARE_CONTACT_COPY_PT: DeepPartial<CareContactCopy> = {
  metadata: {
    title: "Contacto",
  },
  hero: {
    eyebrow: "Contacto e apoio",
    title: "Um só balcão. Respostas claras.",
  },
  rail: {
    serviceHoursLabel: "Horário de serviço",
    coverageLabel: "Cobertura",
    coverageValue: "Pedidos de vestuário, casa e escritório nas zonas abrangidas",
    followUpLabel: "Seguimento",
  },
  sendMessage: {
    eyebrow: "Enviar uma mensagem",
  },
  channels: {
    eyebrow: "Canais diretos",
    title: "Escolha o canal que melhor se ajusta ao momento.",
    phoneTitle: "Apoio por telefone",
    emailTitle: "Apoio por e-mail",
    whatsappTitle: "Contacto por WhatsApp",
    copyLabel: "Copiar",
  },
  tracking: {
    eyebrow: "Já tem um código de seguimento?",
    trackLink: "Acompanhar um serviço",
    bookLink: "Iniciar uma reserva",
  },
  footer: {
    title: "Um só balcão, um seguimento mais limpo.",
    bookCta: "Iniciar uma reserva",
    compareCta: "Comparar serviços",
  },
};

const CARE_CONTACT_COPY_AR: DeepPartial<CareContactCopy> = {
  metadata: {
    title: "تواصل معنا",
  },
  hero: {
    eyebrow: "التواصل والدعم",
    title: "مكتب واحد. إجابات واضحة.",
  },
  rail: {
    serviceHoursLabel: "ساعات الخدمة",
    coverageLabel: "نطاق التغطية",
    coverageValue: "طلبات الملابس والمنازل والمكاتب ضمن المناطق المغطّاة",
    followUpLabel: "المتابعة",
  },
  sendMessage: {
    eyebrow: "إرسال رسالة",
  },
  channels: {
    eyebrow: "قنوات التواصل المباشرة",
    title: "اختر الطريق الأنسب للحظتك.",
    phoneTitle: "الدعم الهاتفي",
    emailTitle: "الدعم عبر البريد الإلكتروني",
    whatsappTitle: "التواصل عبر واتساب",
    copyLabel: "نسخ",
  },
  tracking: {
    eyebrow: "هل لديك رمز تتبّع بالفعل؟",
    trackLink: "تتبّع خدمة",
    bookLink: "بدء حجز",
  },
  footer: {
    title: "مكتب واحد، ومتابعة أكثر وضوحًا.",
    bookCta: "بدء حجز",
    compareCta: "مقارنة الخدمات",
  },
};

const CARE_CONTACT_COPY_DE: DeepPartial<CareContactCopy> = {
  metadata: {
    title: "Kontakt",
  },
  hero: {
    eyebrow: "Kontakt und Support",
    title: "Eine Anlaufstelle. Klare Antworten.",
  },
  rail: {
    serviceHoursLabel: "Servicezeiten",
    coverageLabel: "Einzugsgebiet",
    coverageValue: "Anfragen für Textilien, Privathaushalte und Büros in den abgedeckten Zonen",
    followUpLabel: "Nachverfolgung",
  },
  sendMessage: {
    eyebrow: "Nachricht senden",
  },
  channels: {
    eyebrow: "Direkte Kanäle",
    title: "Wählen Sie den Weg, der zum Moment passt.",
    phoneTitle: "Telefonischer Support",
    emailTitle: "E-Mail-Support",
    whatsappTitle: "Kontakt über WhatsApp",
    copyLabel: "Kopieren",
  },
  tracking: {
    eyebrow: "Haben Sie bereits einen Tracking-Code?",
    trackLink: "Service verfolgen",
    bookLink: "Buchung starten",
  },
  footer: {
    title: "Eine Anlaufstelle, klarere Nachverfolgung.",
    bookCta: "Buchung starten",
    compareCta: "Leistungen vergleichen",
  },
};

const CARE_CONTACT_COPY_IT: DeepPartial<CareContactCopy> = {
  metadata: {
    title: "Contatti",
  },
  hero: {
    eyebrow: "Contatti e assistenza",
    title: "Un solo banco. Risposte chiare.",
  },
  rail: {
    serviceHoursLabel: "Orari di servizio",
    coverageLabel: "Copertura",
    coverageValue: "Richieste per capi, casa e ufficio nelle zone coperte",
    followUpLabel: "Follow-up",
  },
  sendMessage: {
    eyebrow: "Invia un messaggio",
  },
  channels: {
    eyebrow: "Canali diretti",
    title: "Scelga il canale più adatto al momento.",
    phoneTitle: "Assistenza telefonica",
    emailTitle: "Assistenza via e-mail",
    whatsappTitle: "Contatto via WhatsApp",
    copyLabel: "Copia",
  },
  tracking: {
    eyebrow: "Ha già un codice di tracciamento?",
    trackLink: "Traccia un servizio",
    bookLink: "Avvia una prenotazione",
  },
  footer: {
    title: "Un solo banco, un follow-up più pulito.",
    bookCta: "Avvia una prenotazione",
    compareCta: "Confronta i servizi",
  },
};

const CARE_CONTACT_COPY_ZH: DeepPartial<CareContactCopy> = {
  metadata: {
    title: "联系我们",
  },
  hero: {
    eyebrow: "联系与支持",
    title: "一个窗口,清晰答复。",
  },
  rail: {
    serviceHoursLabel: "服务时间",
    coverageLabel: "覆盖范围",
    coverageValue: "覆盖区内的衣物、家居与办公服务请求",
    followUpLabel: "跟进方式",
  },
  sendMessage: {
    eyebrow: "发送消息",
  },
  channels: {
    eyebrow: "直接通道",
    title: "选择当下最合适的方式。",
    phoneTitle: "电话支持",
    emailTitle: "邮件支持",
    whatsappTitle: "WhatsApp 联系",
    copyLabel: "复制",
  },
  tracking: {
    eyebrow: "已经有跟踪编号了吗?",
    trackLink: "查询服务进度",
    bookLink: "开始预约",
  },
  footer: {
    title: "一个窗口,跟进更清爽。",
    bookCta: "开始预约",
    compareCta: "比较服务",
  },
};

const CARE_CONTACT_COPY_HI: DeepPartial<CareContactCopy> = {
  metadata: {
    title: "संपर्क",
  },
  hero: {
    eyebrow: "संपर्क और सहायता",
    title: "एक डेस्क। साफ़ जवाब।",
  },
  rail: {
    serviceHoursLabel: "सेवा समय",
    coverageLabel: "कवरेज",
    coverageValue: "कवर किए गए क्षेत्रों में वस्त्र, घर और कार्यालय से जुड़े अनुरोध",
    followUpLabel: "फ़ॉलो-अप",
  },
  sendMessage: {
    eyebrow: "संदेश भेजें",
  },
  channels: {
    eyebrow: "सीधे चैनल",
    title: "उस माध्यम को चुनें जो इस पल के लिए सही हो।",
    phoneTitle: "फ़ोन सहायता",
    emailTitle: "ईमेल सहायता",
    whatsappTitle: "व्हाट्सऐप संपर्क",
    copyLabel: "कॉपी करें",
  },
  tracking: {
    eyebrow: "क्या आपके पास पहले से ट्रैकिंग कोड है?",
    trackLink: "सेवा ट्रैक करें",
    bookLink: "बुकिंग शुरू करें",
  },
  footer: {
    title: "एक डेस्क, अधिक साफ़ फ़ॉलो-अप।",
    bookCta: "बुकिंग शुरू करें",
    compareCta: "सेवाओं की तुलना करें",
  },
};

const CARE_CONTACT_COPY_IG: DeepPartial<CareContactCopy> = {
  metadata: {
    title: "Kpọtụrụ anyị",
  },
  hero: {
    eyebrow: "Kọntaktị na nkwado",
    title: "Otu tebụl. Azịza doro anya.",
  },
  rail: {
    serviceHoursLabel: "Oge ọrụ",
    coverageLabel: "Mpaghara",
    coverageValue: "Arịrịọ uwe, ụlọ na ọfịs n’ime mpaghara ndị e kpuchiri",
    followUpLabel: "Nlekota",
  },
  sendMessage: {
    eyebrow: "Zipu ozi",
  },
  channels: {
    eyebrow: "Ụzọ nkwukọrịta ozugbo",
    title: "Họrọ ụzọ kacha kwado oge ahụ.",
    phoneTitle: "Nkwado n’ekwentị",
    emailTitle: "Nkwado n’ozi-e",
    whatsappTitle: "Kọntaktị WhatsApp",
    copyLabel: "Detuo",
  },
  tracking: {
    eyebrow: "Ị nweelarị koodu nso nso?",
    trackLink: "Soro ọrụ",
    bookLink: "Malite ndokwa",
  },
  footer: {
    title: "Otu tebụl, nlekota dị ọcha.",
    bookCta: "Malite ndokwa",
    compareCta: "Tụnyere ọrụ",
  },
};

const CARE_CONTACT_COPY_YO: DeepPartial<CareContactCopy> = {
  metadata: {
    title: "Kàn sí wa",
  },
  hero: {
    eyebrow: "Bíbá wa sọ̀rọ̀ àti àtìlẹ́yìn",
    title: "Tábìlì kan ṣoṣo. Ìdáhùn tó dájú.",
  },
  rail: {
    serviceHoursLabel: "Àwọn wákàtí iṣẹ́",
    coverageLabel: "Ààlà ìṣiṣẹ́",
    coverageValue: "Àbẹ̀wò aṣọ, ilé, àti ọ́físì ní àwọn agbègbè tí a ṣe ìpèsè",
    followUpLabel: "Àtẹ̀lé",
  },
  sendMessage: {
    eyebrow: "Rán ọ̀rọ̀",
  },
  channels: {
    eyebrow: "Àwọn ọ̀nà tààrà",
    title: "Yan ọ̀nà tó bá àkókò náà mu.",
    phoneTitle: "Àtìlẹ́yìn nípa fóònù",
    emailTitle: "Àtìlẹ́yìn nípa ìméèlì",
    whatsappTitle: "Bíbá wa sọ̀rọ̀ nípa WhatsApp",
    copyLabel: "Da ẹ̀dà",
  },
  tracking: {
    eyebrow: "Ǹjẹ́ o ti ní koodu ìtọpasẹ̀?",
    trackLink: "Tọpa iṣẹ́",
    bookLink: "Bẹ̀rẹ̀ ìfọrífín",
  },
  footer: {
    title: "Tábìlì kan, àtẹ̀lé tó mọ́.",
    bookCta: "Bẹ̀rẹ̀ ìfọrífín",
    compareCta: "Ṣe ìfiwérà àwọn iṣẹ́",
  },
};

const CARE_CONTACT_COPY_HA: DeepPartial<CareContactCopy> = {
  metadata: {
    title: "Tuntube mu",
  },
  hero: {
    eyebrow: "Tuntuɓa da tallafi",
    title: "Tebur ɗaya. Amsa a fili.",
  },
  rail: {
    serviceHoursLabel: "Lokacin aiki",
    coverageLabel: "Yankin aiki",
    coverageValue: "Bukatun tufafi, gida, da ofis a yankunan da muka rufe",
    followUpLabel: "Bibiya",
  },
  sendMessage: {
    eyebrow: "Aika saƙo",
  },
  channels: {
    eyebrow: "Hanyoyin tuntuɓa kai-tsaye",
    title: "Zaɓi hanyar da ta dace da lokacin.",
    phoneTitle: "Tallafi ta waya",
    emailTitle: "Tallafi ta imel",
    whatsappTitle: "Tuntuɓa ta WhatsApp",
    copyLabel: "Kwafa",
  },
  tracking: {
    eyebrow: "Kana da lambar bin diddigi tuni?",
    trackLink: "Bibiyi aiki",
    bookLink: "Fara rijista",
  },
  footer: {
    title: "Tebur ɗaya, bibiya mafi tsabta.",
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
