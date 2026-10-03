import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * CareAboutCopy — i18n surface for the public Care about page
 * (`apps/care/app/(public)/about/page.tsx`). Covers metadata, editorial hero
 * with CTAs and stat facts, three service lanes, standards bullets,
 * step-by-step flow, expectation reasons, and the closing CTA band.
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each locale is
 * a DeepPartial that deep-merges over EN so missing keys fall back to EN
 * silently at runtime. Mirrors the shape of `care-services-copy.ts`.
 */
export type CareAboutCopy = {
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    body: string;
    bookCta: string;
    contactCta: string;
  };
  heroFacts: {
    serviceHoursLabel: string;
    careDeskLabel: string;
    serviceOptionsLabel: string;
    pickupHoursFallback: string;
    /** Template with `{lines}` and `{packages}` placeholders. */
    linesPackagesTemplate: string;
  };
  lanes: {
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
  closingCta: {
    title: string;
    bookCta: string;
    exploreCta: string;
  };
};

const CARE_ABOUT_COPY_EN: CareAboutCopy = {
  metadata: {
    title: "About Henry Onyx Fabric Care",
    description:
      "Learn how Henry Onyx Fabric Care delivers premium garment care, home cleaning, office cleaning, and dependable service follow-through.",
  },
  hero: {
    eyebrow: "About Henry Onyx Fabric Care",
    title: "Trust. Timing. Service quality.",
    body: "Henry Onyx Fabric Care provides garment care, pickup and delivery, home cleaning, office cleaning, and recurring service plans through one polished customer experience — dependable execution, respectful handling, a finish clients are happy to invite back.",
    bookCta: "Book a service",
    contactCta: "Contact the team",
  },
  heroFacts: {
    serviceHoursLabel: "Service hours",
    careDeskLabel: "Care desk",
    serviceOptionsLabel: "Service options",
    pickupHoursFallback: "8:00 AM – 6:00 PM",
    linesPackagesTemplate: "{lines} lines · {packages} package plans",
  },
  lanes: {
    eyebrow: "Three service lanes",
    garmentCare: {
      title: "Garment care",
      body: "Cleaning, stain treatment, pressing, and return delivery.",
    },
    homeCleaning: {
      title: "Home cleaning",
      body: "One-time and recurring cleaning with clear arrival windows.",
    },
    officeCleaning: {
      title: "Office cleaning",
      body: "Scheduled and after-hours cleaning for workplaces.",
    },
  },
  closingCta: {
    title: "Ready when you are.",
    bookCta: "Book a service",
    exploreCta: "Explore services",
  },
};

const CARE_ABOUT_COPY_FR: DeepPartial<CareAboutCopy> = {
  metadata: {
    title: "À propos de Henry Onyx Fabric Care",
    description:
      "Découvrez comment Henry Onyx Fabric Care assure l’entretien textile haut de gamme, le nettoyage à domicile, le nettoyage de bureaux et un suivi de service fiable.",
  },
  hero: {
    eyebrow: "À propos de Henry Onyx Fabric Care",
    title: "Confiance. Ponctualité. Qualité de service.",
    body: "Henry Onyx Fabric Care propose l’entretien textile, l’enlèvement et la livraison, le nettoyage à domicile, le nettoyage de bureaux et des forfaits récurrents au sein d’une seule expérience client soignée — exécution fiable, manipulation respectueuse, un rendu que les clients sont heureux de revoir.",
    bookCta: "Réserver une prestation",
    contactCta: "Contacter l’équipe",
  },
  heroFacts: {
    serviceHoursLabel: "Horaires de service",
    careDeskLabel: "Service client",
    serviceOptionsLabel: "Options de service",
    linesPackagesTemplate: "{lines} lignes · {packages} forfaits",
  },
  lanes: {
    eyebrow: "Trois lignes de service",
    garmentCare: {
      title: "Entretien textile",
    },
    homeCleaning: {
      title: "Nettoyage à domicile",
    },
    officeCleaning: {
      title: "Nettoyage de bureaux",
    },
  },
  closingCta: {
    bookCta: "Réserver une prestation",
    exploreCta: "Découvrir les services",
  },
};
const CARE_ABOUT_COPY_ES: DeepPartial<CareAboutCopy> = {
  metadata: {
    title: "Acerca de Henry Onyx Fabric Care",
    description:
      "Descubra cómo Henry Onyx Fabric Care ofrece cuidado de prendas premium, limpieza del hogar, limpieza de oficinas y un seguimiento de servicio fiable.",
  },
  hero: {
    eyebrow: "Acerca de Henry Onyx Fabric Care",
    title: "Confianza. Puntualidad. Calidad de servicio.",
    body: "Henry Onyx Fabric Care brinda cuidado de prendas, recogida y entrega, limpieza del hogar, limpieza de oficinas y planes de servicio recurrente dentro de una única experiencia de cliente cuidada: ejecución fiable, manipulación respetuosa y un acabado que los clientes están encantados de volver a recibir.",
    bookCta: "Reservar un servicio",
    contactCta: "Contactar al equipo",
  },
  heroFacts: {
    serviceHoursLabel: "Horario de servicio",
    careDeskLabel: "Atención al cliente",
    serviceOptionsLabel: "Opciones de servicio",
    linesPackagesTemplate: "{lines} líneas · {packages} planes",
  },
  lanes: {
    eyebrow: "Tres líneas de servicio",
    garmentCare: {
      title: "Cuidado de prendas",
    },
    homeCleaning: {
      title: "Limpieza del hogar",
    },
    officeCleaning: {
      title: "Limpieza de oficinas",
    },
  },
  closingCta: {
    bookCta: "Reservar un servicio",
    exploreCta: "Ver servicios",
  },
};
const CARE_ABOUT_COPY_PT: DeepPartial<CareAboutCopy> = {
  metadata: {
    title: "Sobre a Henry Onyx Fabric Care",
    description:
      "Conheça como a Henry Onyx Fabric Care entrega cuidados premium com vestuário, limpeza residencial, limpeza de escritórios e um acompanhamento de serviço confiável.",
  },
  hero: {
    eyebrow: "Sobre a Henry Onyx Fabric Care",
    title: "Confiança. Pontualidade. Qualidade de serviço.",
    body: "A Henry Onyx Fabric Care oferece cuidados com vestuário, recolha e entrega, limpeza residencial, limpeza de escritórios e planos de serviço recorrentes numa experiência de cliente cuidada — execução confiável, manuseio respeitoso e um acabamento que os clientes têm prazer em receber novamente.",
    bookCta: "Reservar um serviço",
    contactCta: "Falar com a equipa",
  },
  heroFacts: {
    serviceHoursLabel: "Horário de serviço",
    careDeskLabel: "Atendimento ao cliente",
    serviceOptionsLabel: "Opções de serviço",
    linesPackagesTemplate: "{lines} frentes · {packages} pacotes",
  },
  lanes: {
    eyebrow: "Três frentes de serviço",
    garmentCare: {
      title: "Cuidados com vestuário",
    },
    homeCleaning: {
      title: "Limpeza residencial",
    },
    officeCleaning: {
      title: "Limpeza de escritórios",
    },
  },
  closingCta: {
    bookCta: "Reservar um serviço",
    exploreCta: "Ver serviços",
  },
};
const CARE_ABOUT_COPY_AR: DeepPartial<CareAboutCopy> = {
  metadata: {
    title: "نبذة عن Henry Onyx Fabric Care",
    description:
      "تعرّف على كيف توفّر Henry Onyx Fabric Care عناية فاخرة بالملابس، وتنظيف المنازل، وتنظيف المكاتب، ومتابعة خدمة يمكن الاعتماد عليها.",
  },
  hero: {
    eyebrow: "نبذة عن Henry Onyx Fabric Care",
    title: "ثقة. التزام بالوقت. جودة خدمة.",
    body: "تقدّم Henry Onyx Fabric Care العناية بالملابس، الاستلام والتوصيل، تنظيف المنازل، تنظيف المكاتب، وخططًا متكررة ضمن تجربة عميل واحدة متقنة — تنفيذ موثوق، تعامل محترم، ولمسة نهائية يسعد العملاء بإعادة استدعائها.",
    bookCta: "احجز خدمة",
    contactCta: "تواصل مع الفريق",
  },
  heroFacts: {
    serviceHoursLabel: "ساعات الخدمة",
    careDeskLabel: "مكتب العناية",
    serviceOptionsLabel: "خيارات الخدمة",
    linesPackagesTemplate: "{lines} مسارات · {packages} باقات",
  },
  lanes: {
    eyebrow: "ثلاثة مسارات للخدمة",
    garmentCare: {
      title: "العناية بالملابس",
    },
    homeCleaning: {
      title: "تنظيف المنازل",
    },
    officeCleaning: {
      title: "تنظيف المكاتب",
    },
  },
  closingCta: {
    bookCta: "احجز خدمة",
    exploreCta: "استكشاف الخدمات",
  },
};
const CARE_ABOUT_COPY_DE: DeepPartial<CareAboutCopy> = {
  metadata: {
    title: "Über Henry Onyx Fabric Care",
    description:
      "Erfahren Sie, wie Henry Onyx Fabric Care Premium-Textilpflege, Heimreinigung, Büroreinigung und eine verlässliche Servicenachverfolgung liefert.",
  },
  hero: {
    eyebrow: "Über Henry Onyx Fabric Care",
    title: "Vertrauen. Pünktlichkeit. Servicequalität.",
    body: "Henry Onyx Fabric Care bietet Textilpflege, Abholung und Lieferung, Heimreinigung, Büroreinigung und wiederkehrende Servicepakete in einem geschliffenen Kundenerlebnis — verlässliche Ausführung, respektvoller Umgang und ein Ergebnis, das Kunden gerne erneut beauftragen.",
    bookCta: "Service buchen",
    contactCta: "Team kontaktieren",
  },
  heroFacts: {
    serviceHoursLabel: "Servicezeiten",
    careDeskLabel: "Care-Desk",
    serviceOptionsLabel: "Serviceoptionen",
    linesPackagesTemplate: "{lines} Linien · {packages} Pakete",
  },
  lanes: {
    eyebrow: "Drei Servicelinien",
    garmentCare: {
      title: "Textilpflege",
    },
    homeCleaning: {
      title: "Heimreinigung",
    },
    officeCleaning: {
      title: "Büroreinigung",
    },
  },
  closingCta: {
    bookCta: "Service buchen",
    exploreCta: "Services entdecken",
  },
};
const CARE_ABOUT_COPY_IT: DeepPartial<CareAboutCopy> = {
  metadata: {
    title: "Su Henry Onyx Fabric Care",
    description:
      "Scopri come Henry Onyx Fabric Care offre cura degli abiti premium, pulizia domestica, pulizia di uffici e un follow-up di servizio affidabile.",
  },
  hero: {
    eyebrow: "Su Henry Onyx Fabric Care",
    title: "Fiducia. Puntualità. Qualità del servizio.",
    body: "Henry Onyx Fabric Care offre cura degli abiti, ritiro e consegna, pulizia domestica, pulizia di uffici e piani ricorrenti in un’unica esperienza cliente curata: esecuzione affidabile, manipolazione rispettosa e un risultato che i clienti sono felici di richiamare.",
    bookCta: "Prenota un servizio",
    contactCta: "Contatta il team",
  },
  heroFacts: {
    serviceHoursLabel: "Orari di servizio",
    careDeskLabel: "Care desk",
    serviceOptionsLabel: "Opzioni di servizio",
    linesPackagesTemplate: "{lines} linee · {packages} pacchetti",
  },
  lanes: {
    eyebrow: "Tre linee di servizio",
    garmentCare: {
      title: "Cura degli abiti",
    },
    homeCleaning: {
      title: "Pulizia domestica",
    },
    officeCleaning: {
      title: "Pulizia di uffici",
    },
  },
  closingCta: {
    bookCta: "Prenota un servizio",
    exploreCta: "Scopri i servizi",
  },
};
const CARE_ABOUT_COPY_ZH: DeepPartial<CareAboutCopy> = {
  metadata: {
    title: "关于 Henry Onyx Fabric Care",
    description:
      "了解 Henry Onyx Fabric Care 如何提供高端衣物护理、家庭清洁、办公室清洁,以及可靠的服务跟进。",
  },
  hero: {
    eyebrow: "关于 Henry Onyx Fabric Care",
    title: "信任。守时。服务品质。",
    body: "Henry Onyx Fabric Care 在一套精致的客户体验中提供衣物护理、上门取送、家庭清洁、办公室清洁和长期服务计划——可靠的执行、尊重的处理,以及让客户乐于再次回来的完成度。",
    bookCta: "预约服务",
    contactCta: "联系团队",
  },
  heroFacts: {
    serviceHoursLabel: "服务时间",
    careDeskLabel: "客服中心",
    serviceOptionsLabel: "服务选项",
    linesPackagesTemplate: "{lines} 条服务线 · {packages} 个套餐",
  },
  lanes: {
    eyebrow: "三条服务线",
    garmentCare: {
      title: "衣物护理",
    },
    homeCleaning: {
      title: "家庭清洁",
    },
    officeCleaning: {
      title: "办公室清洁",
    },
  },
  closingCta: {
    bookCta: "预约服务",
    exploreCta: "探索服务",
  },
};
const CARE_ABOUT_COPY_HI: DeepPartial<CareAboutCopy> = {
  metadata: {
    title: "Henry Onyx Fabric Care के बारे में",
    description:
      "जानें कि Henry Onyx Fabric Care कैसे प्रीमियम वस्त्र देखभाल, घरेलू सफाई, कार्यालय सफाई और भरोसेमंद सर्विस फॉलो-अप उपलब्ध कराता है।",
  },
  hero: {
    eyebrow: "Henry Onyx Fabric Care के बारे में",
    title: "भरोसा। समय पर सेवा। सेवा की गुणवत्ता।",
    body: "Henry Onyx Fabric Care एक सुगठित ग्राहक अनुभव में वस्त्र देखभाल, पिकअप और डिलीवरी, घरेलू सफाई, कार्यालय सफाई और नियमित सर्विस प्लान उपलब्ध कराता है — भरोसेमंद निष्पादन, सम्मानजनक देखभाल, और एक ऐसा परिणाम जिसे ग्राहक खुशी से दोबारा बुलाते हैं।",
    bookCta: "सर्विस बुक करें",
    contactCta: "टीम से संपर्क करें",
  },
  heroFacts: {
    serviceHoursLabel: "सेवा के समय",
    careDeskLabel: "केयर डेस्क",
    serviceOptionsLabel: "सेवा विकल्प",
    linesPackagesTemplate: "{lines} सेवा लाइनें · {packages} पैकेज",
  },
  lanes: {
    eyebrow: "तीन सेवा लाइनें",
    garmentCare: {
      title: "वस्त्र देखभाल",
    },
    homeCleaning: {
      title: "घरेलू सफाई",
    },
    officeCleaning: {
      title: "कार्यालय सफाई",
    },
  },
  closingCta: {
    bookCta: "सर्विस बुक करें",
    exploreCta: "सेवाएँ देखें",
  },
};
const CARE_ABOUT_COPY_IG: DeepPartial<CareAboutCopy> = {
  metadata: {
    title: "Maka Henry Onyx Fabric Care",
    description:
      "Mụta otú Henry Onyx Fabric Care si enye nlekọta uwe dị elu, nhicha ụlọ, nhicha ọfịs, na nsoghachi ọrụ a pụrụ ịdabere na ya.",
  },
  hero: {
    eyebrow: "Maka Henry Onyx Fabric Care",
    title: "Ntụkwasị obi. Oge. Ogo ọrụ.",
    body: "Henry Onyx Fabric Care na-enye nlekọta uwe, mbufe na nbubata, nhicha ụlọ, nhicha ọfịs, na atụmatụ ọrụ na-emegharị ugboro ugboro n’otu ahụmahụ ndị ahịa zuru oke — mmezu a pụrụ ịdabere na ya, njide nke nwere nkwanye ùgwù, na nkwụsị nke ndị ahịa na-aṅụrị ọṅụ ịkpọghachi ya.",
    bookCta: "Debe ọrụ",
    contactCta: "Kpọtụrụ ndị otu",
  },
  heroFacts: {
    serviceHoursLabel: "Awa ọrụ",
    careDeskLabel: "Tebụl nlekọta",
    serviceOptionsLabel: "Nhọrọ ọrụ",
    linesPackagesTemplate: "{lines} usoro ọrụ · {packages} ngwugwu",
  },
  lanes: {
    eyebrow: "Usoro ọrụ atọ",
    garmentCare: {
      title: "Nlekọta uwe",
    },
    homeCleaning: {
      title: "Nhicha ụlọ",
    },
    officeCleaning: {
      title: "Nhicha ọfịs",
    },
  },
  closingCta: {
    bookCta: "Debe ọrụ",
    exploreCta: "Chọpụta ọrụ",
  },
};
const CARE_ABOUT_COPY_YO: DeepPartial<CareAboutCopy> = {
  metadata: {
    title: "Nípa Henry Onyx Fabric Care",
    description:
      "Mọ bí Henry Onyx Fabric Care ṣe ń pèsè ìtọ́jú aṣọ pípé, ìmọ́tótó ilé, ìmọ́tótó ọ́fíìsì, àti ìtẹ̀lé iṣẹ́ tó gbára lé.",
  },
  hero: {
    eyebrow: "Nípa Henry Onyx Fabric Care",
    title: "Ìgbàgbọ́. Àkókò. Ìpele iṣẹ́.",
    body: "Henry Onyx Fabric Care ń pèsè ìtọ́jú aṣọ, gbígba àti ìfijíṣẹ́, ìmọ́tótó ilé, ìmọ́tótó ọ́fíìsì, àti àwọn ètò iṣẹ́ alábáwí nínú ìrírí oníbàárà kan tó dán wíwà — ìṣe tó gbára lé, ìbáṣepọ̀ aláàánú, àti ìparí tí àwọn oníbàárà fẹ́ pe padà.",
    bookCta: "Sọ iṣẹ́ kan",
    contactCta: "Kàn sí ẹgbẹ́",
  },
  heroFacts: {
    serviceHoursLabel: "Wákàtí iṣẹ́",
    careDeskLabel: "Tábìlì ìtọ́jú",
    serviceOptionsLabel: "Àwọn àyàn iṣẹ́",
    linesPackagesTemplate: "{lines} ìlà iṣẹ́ · {packages} ẹ̀rọ",
  },
  lanes: {
    eyebrow: "Ìlà iṣẹ́ mẹ́ta",
    garmentCare: {
      title: "Ìtọ́jú aṣọ",
    },
    homeCleaning: {
      title: "Ìmọ́tótó ilé",
    },
    officeCleaning: {
      title: "Ìmọ́tótó ọ́fíìsì",
    },
  },
  closingCta: {
    bookCta: "Sọ iṣẹ́ kan",
    exploreCta: "Ṣàwárí iṣẹ́",
  },
};
const CARE_ABOUT_COPY_HA: DeepPartial<CareAboutCopy> = {
  metadata: {
    title: "Game da Henry Onyx Fabric Care",
    description:
      "Gano yadda Henry Onyx Fabric Care ke ba da kulawar tufafi mai inganci, tsaftar gida, tsaftar ofis, da bibiyar sabis abin dogaro.",
  },
  hero: {
    eyebrow: "Game da Henry Onyx Fabric Care",
    title: "Aminci. Lokaci. Ingancin sabis.",
    body: "Henry Onyx Fabric Care na ba da kulawar tufafi, ɗauka da kawowa, tsaftar gida, tsaftar ofis, da shirye-shiryen sabis akai-akai cikin abu ɗaya na ƙwarewar abokin ciniki — aiwatarwa abin dogaro, kulawa cikin girmamawa, da gama aiki da abokin ciniki ke jin daɗin sake kira.",
    bookCta: "Yi rajistar sabis",
    contactCta: "Tuntuɓi tawagar",
  },
  heroFacts: {
    serviceHoursLabel: "Lokutan sabis",
    careDeskLabel: "Tebur kulawa",
    serviceOptionsLabel: "Zaɓuɓɓukan sabis",
    linesPackagesTemplate: "{lines} hanyoyin sabis · {packages} fakitin shirye",
  },
  lanes: {
    eyebrow: "Hanyoyin sabis guda uku",
    garmentCare: {
      title: "Kulawar tufafi",
    },
    homeCleaning: {
      title: "Tsaftar gida",
    },
    officeCleaning: {
      title: "Tsaftar ofis",
    },
  },
  closingCta: {
    bookCta: "Yi rajistar sabis",
    exploreCta: "Bincika sabis",
  },
};

const CARE_ABOUT_LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<CareAboutCopy>>> = {
  fr: CARE_ABOUT_COPY_FR,
  es: CARE_ABOUT_COPY_ES,
  pt: CARE_ABOUT_COPY_PT,
  ar: CARE_ABOUT_COPY_AR,
  de: CARE_ABOUT_COPY_DE,
  it: CARE_ABOUT_COPY_IT,
  zh: CARE_ABOUT_COPY_ZH,
  hi: CARE_ABOUT_COPY_HI,
  ig: CARE_ABOUT_COPY_IG,
  yo: CARE_ABOUT_COPY_YO,
  ha: CARE_ABOUT_COPY_HA,
};

export function getCareAboutCopy(locale: AppLocale): CareAboutCopy {
  const overrides = CARE_ABOUT_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      CARE_ABOUT_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as CareAboutCopy;
  }
  return CARE_ABOUT_COPY_EN;
}

/** @internal */
export function __dangerouslyGetEnglishCareAboutCopy(): CareAboutCopy {
  return CARE_ABOUT_COPY_EN;
}
