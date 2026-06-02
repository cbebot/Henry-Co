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
  standards: {
    eyebrow: string;
    title: string;
    bullets: readonly [string, string, string, string];
  };
  flow: {
    eyebrow: string;
    title: string;
    stepLabel: string;
    steps: readonly [
      { title: string; body: string },
      { title: string; body: string },
      { title: string; body: string },
      { title: string; body: string },
    ];
  };
  reasons: {
    eyebrow: string;
    pickupDelivery: {
      title: string;
      body: string;
    };
    qualityStandards: {
      title: string;
      body: string;
    };
    convenience: {
      title: string;
      body: string;
    };
  };
  closingCta: {
    eyebrow: string;
    title: string;
    body: string;
    bookCta: string;
    exploreCta: string;
  };
};

const CARE_ABOUT_COPY_EN: CareAboutCopy = {
  metadata: {
    title: "About Henry Onyx Care",
    description:
      "Learn how Henry Onyx Care delivers premium garment care, home cleaning, office cleaning, and dependable service follow-through.",
  },
  hero: {
    eyebrow: "About Henry Onyx Care",
    title: "Trust. Timing. Service quality.",
    body: "Henry Onyx Care provides garment care, pickup and delivery, home cleaning, office cleaning, and recurring service plans through one polished customer experience — dependable execution, respectful handling, a finish clients are happy to invite back.",
    bookCta: "Book a service",
    contactCta: "Contact the team",
  },
  heroFacts: {
    serviceHoursLabel: "Service hours",
    careDeskLabel: "Care desk",
    serviceOptionsLabel: "Service options",
    pickupHoursFallback: "Mon - Sat • 8:00 AM to 7:00 PM",
    linesPackagesTemplate: "{lines} lines · {packages} package plans",
  },
  lanes: {
    eyebrow: "Three service lanes",
    garmentCare: {
      title: "Garment care",
      body: "From daily wardrobe essentials to delicate pieces — cleaning, stain treatment, pressing, finishing, and return delivery handled with precision.",
    },
    homeCleaning: {
      title: "Home cleaning",
      body: "Homes are cared for with clear arrival windows, thoughtful service notes, and a finish designed to feel calm, fresh, and genuinely complete.",
    },
    officeCleaning: {
      title: "Office cleaning",
      body: "Workplaces receive reliable cleaning support with professional timing, organised site handling, and continuity businesses can count on.",
    },
  },
  standards: {
    eyebrow: "Why clients trust Henry Onyx Care",
    title: "Reliable service comes from standards clients can actually feel.",
    bullets: [
      "Clear communication before pickup, before arrival, and during every important update.",
      "Professional handling for garments, homes, and workplaces with the right context for each service type.",
      "Recurring service options that make long-term care easier to manage and easier to trust.",
      "One care desk that keeps follow-up documented instead of scattered across channels.",
    ],
  },
  flow: {
    eyebrow: "How the experience works",
    title: "Smooth for the client, disciplined behind the scenes.",
    stepLabel: "Step",
    steps: [
      {
        title: "Book the right service",
        body: "Choose garment care, home cleaning, or office cleaning and share the timing, address, and service notes that matter.",
      },
      {
        title: "Receive clear confirmation",
        body: "You receive confirmation, booking details, payment guidance where relevant, and a tracking code for follow-up.",
      },
      {
        title: "Service is carried out professionally",
        body: "Garments move through pickup and delivery. Homes and offices move through arrival, on-site work, and completion.",
      },
      {
        title: "Stay informed until the end",
        body: "Tracking and email updates keep the next step clear, whether that means return delivery or a completed visit.",
      },
    ],
  },
  reasons: {
    eyebrow: "What you can expect",
    pickupDelivery: {
      title: "Pickup and delivery",
      body: "Garment care includes controlled pickup, treatment, finishing, and return delivery so customers can follow the order from start to finish.",
    },
    qualityStandards: {
      title: "Quality standards",
      body: "Whether the service happens in a wardrobe, a home, or a workplace, the result should feel consistent, careful, and professionally finished.",
    },
    convenience: {
      title: "Convenience without compromise",
      body: "Recurring plans, clear updates, and premium support make it easier to keep garments, homes, and workplaces in excellent condition.",
    },
  },
  closingCta: {
    eyebrow: "Ready to experience Henry Onyx Care?",
    title: "Book a premium care service with timing, clarity, and follow-through built in.",
    body: "From garment pickup and delivery to recurring home and office cleaning, Henry Onyx Care is built to make dependable service feel easy.",
    bookCta: "Book a service",
    exploreCta: "Explore services",
  },
};

const CARE_ABOUT_COPY_FR: DeepPartial<CareAboutCopy> = {
  metadata: {
    title: "À propos de Henry Onyx Care",
    description:
      "Découvrez comment Henry Onyx Care assure l’entretien textile haut de gamme, le nettoyage à domicile, le nettoyage de bureaux et un suivi de service fiable.",
  },
  hero: {
    eyebrow: "À propos de Henry Onyx Care",
    title: "Confiance. Ponctualité. Qualité de service.",
    body: "Henry Onyx Care propose l’entretien textile, l’enlèvement et la livraison, le nettoyage à domicile, le nettoyage de bureaux et des forfaits récurrents au sein d’une seule expérience client soignée — exécution fiable, manipulation respectueuse, un rendu que les clients sont heureux de revoir.",
    bookCta: "Réserver une prestation",
    contactCta: "Contacter l’équipe",
  },
  heroFacts: {
    serviceHoursLabel: "Horaires de service",
    careDeskLabel: "Service client",
    serviceOptionsLabel: "Options de service",
    pickupHoursFallback: "Lun - Sam • 8h00 à 19h00",
    linesPackagesTemplate: "{lines} lignes · {packages} forfaits",
  },
  lanes: {
    eyebrow: "Trois lignes de service",
    garmentCare: {
      title: "Entretien textile",
      body: "Des essentiels du quotidien aux pièces délicates — nettoyage, traitement des taches, repassage, finition et livraison retour réalisés avec précision.",
    },
    homeCleaning: {
      title: "Nettoyage à domicile",
      body: "Les foyers sont pris en charge avec des créneaux d’arrivée clairs, des consignes attentives et une finition apaisante, fraîche et véritablement complète.",
    },
    officeCleaning: {
      title: "Nettoyage de bureaux",
      body: "Les lieux de travail bénéficient d’un appui de nettoyage fiable avec une ponctualité professionnelle, une gestion organisée du site et une continuité sur laquelle les entreprises peuvent compter.",
    },
  },
  standards: {
    eyebrow: "Pourquoi les clients font confiance à Henry Onyx Care",
    title: "Un service fiable naît de standards que les clients ressentent vraiment.",
    bullets: [
      "Communication claire avant l’enlèvement, avant l’arrivée et à chaque mise à jour importante.",
      "Prise en charge professionnelle des vêtements, des foyers et des lieux de travail avec le bon contexte pour chaque type de service.",
      "Des options récurrentes qui rendent l’entretien à long terme plus simple à gérer et plus facile à confier.",
      "Un seul service client qui consigne le suivi au lieu de le disperser sur plusieurs canaux.",
    ],
  },
  flow: {
    eyebrow: "Comment se déroule l’expérience",
    title: "Fluide pour le client, rigoureux en coulisses.",
    stepLabel: "Étape",
    steps: [
      {
        title: "Choisissez la bonne prestation",
        body: "Sélectionnez l’entretien textile, le nettoyage à domicile ou le nettoyage de bureaux et indiquez l’horaire, l’adresse et les consignes utiles.",
      },
      {
        title: "Recevez une confirmation claire",
        body: "Vous recevez la confirmation, les détails de la réservation, les indications de paiement le cas échéant et un code de suivi.",
      },
      {
        title: "La prestation est réalisée professionnellement",
        body: "Les vêtements passent par l’enlèvement et la livraison. Les foyers et les bureaux passent par l’arrivée, le travail sur place puis la finalisation.",
      },
      {
        title: "Restez informé jusqu’au bout",
        body: "Le suivi et les mises à jour par e-mail gardent la prochaine étape limpide, qu’il s’agisse d’une livraison retour ou d’une visite achevée.",
      },
    ],
  },
  reasons: {
    eyebrow: "Ce à quoi vous pouvez vous attendre",
    pickupDelivery: {
      title: "Enlèvement et livraison",
      body: "L’entretien textile comprend un enlèvement maîtrisé, le traitement, la finition et la livraison retour, afin que les clients suivent leur commande du début à la fin.",
    },
    qualityStandards: {
      title: "Standards de qualité",
      body: "Que la prestation se déroule dans une garde-robe, un foyer ou un lieu de travail, le résultat doit être constant, soigné et professionnellement abouti.",
    },
    convenience: {
      title: "Une praticité sans compromis",
      body: "Les forfaits récurrents, les mises à jour claires et un support premium facilitent l’entretien des vêtements, des foyers et des lieux de travail dans un état impeccable.",
    },
  },
  closingCta: {
    eyebrow: "Prêt à découvrir Henry Onyx Care ?",
    title: "Réservez une prestation premium avec ponctualité, clarté et suivi intégrés.",
    body: "De l’enlèvement et de la livraison textile au nettoyage récurrent à domicile et en bureaux, Henry Onyx Care rend le service fiable simple et naturel.",
    bookCta: "Réserver une prestation",
    exploreCta: "Découvrir les services",
  },
};
const CARE_ABOUT_COPY_ES: DeepPartial<CareAboutCopy> = {
  metadata: {
    title: "Acerca de Henry Onyx Care",
    description:
      "Descubra cómo Henry Onyx Care ofrece cuidado de prendas premium, limpieza del hogar, limpieza de oficinas y un seguimiento de servicio fiable.",
  },
  hero: {
    eyebrow: "Acerca de Henry Onyx Care",
    title: "Confianza. Puntualidad. Calidad de servicio.",
    body: "Henry Onyx Care brinda cuidado de prendas, recogida y entrega, limpieza del hogar, limpieza de oficinas y planes de servicio recurrente dentro de una única experiencia de cliente cuidada: ejecución fiable, manipulación respetuosa y un acabado que los clientes están encantados de volver a recibir.",
    bookCta: "Reservar un servicio",
    contactCta: "Contactar al equipo",
  },
  heroFacts: {
    serviceHoursLabel: "Horario de servicio",
    careDeskLabel: "Atención al cliente",
    serviceOptionsLabel: "Opciones de servicio",
    pickupHoursFallback: "Lun - Sáb • 8:00 a 19:00",
    linesPackagesTemplate: "{lines} líneas · {packages} planes",
  },
  lanes: {
    eyebrow: "Tres líneas de servicio",
    garmentCare: {
      title: "Cuidado de prendas",
      body: "Desde lo esencial del día a día hasta piezas delicadas: limpieza, tratamiento de manchas, planchado, acabado y entrega de devolución realizados con precisión.",
    },
    homeCleaning: {
      title: "Limpieza del hogar",
      body: "Los hogares se atienden con franjas de llegada claras, notas de servicio atentas y un acabado pensado para resultar tranquilo, fresco y verdaderamente completo.",
    },
    officeCleaning: {
      title: "Limpieza de oficinas",
      body: "Los lugares de trabajo reciben apoyo de limpieza fiable con puntualidad profesional, gestión organizada del sitio y una continuidad con la que las empresas pueden contar.",
    },
  },
  standards: {
    eyebrow: "Por qué los clientes confían en Henry Onyx Care",
    title: "Un servicio fiable nace de estándares que los clientes pueden sentir de verdad.",
    bullets: [
      "Comunicación clara antes de la recogida, antes de la llegada y en cada actualización importante.",
      "Manipulación profesional de prendas, hogares y lugares de trabajo, con el contexto adecuado para cada tipo de servicio.",
      "Opciones recurrentes que facilitan la gestión del cuidado a largo plazo y que dan tranquilidad.",
      "Una única atención al cliente que documenta el seguimiento en lugar de dispersarlo entre canales.",
    ],
  },
  flow: {
    eyebrow: "Cómo funciona la experiencia",
    title: "Fluido para el cliente, disciplinado en la trastienda.",
    stepLabel: "Paso",
    steps: [
      {
        title: "Reserve el servicio adecuado",
        body: "Elija cuidado de prendas, limpieza del hogar o limpieza de oficinas y comparta el horario, la dirección y las indicaciones que importan.",
      },
      {
        title: "Reciba una confirmación clara",
        body: "Recibe la confirmación, los detalles de la reserva, las orientaciones de pago cuando corresponda y un código de seguimiento.",
      },
      {
        title: "El servicio se ejecuta profesionalmente",
        body: "Las prendas avanzan por recogida y entrega. Los hogares y oficinas avanzan por llegada, trabajo en el sitio y finalización.",
      },
      {
        title: "Manténgase informado hasta el final",
        body: "El seguimiento y las actualizaciones por correo mantienen claro el próximo paso, ya sea la entrega de devolución o una visita finalizada.",
      },
    ],
  },
  reasons: {
    eyebrow: "Qué puede esperar",
    pickupDelivery: {
      title: "Recogida y entrega",
      body: "El cuidado de prendas incluye recogida controlada, tratamiento, acabado y entrega de devolución para que los clientes sigan el pedido de principio a fin.",
    },
    qualityStandards: {
      title: "Estándares de calidad",
      body: "Ya sea en un armario, un hogar o un lugar de trabajo, el resultado debe sentirse consistente, cuidadoso y profesionalmente terminado.",
    },
    convenience: {
      title: "Comodidad sin compromisos",
      body: "Planes recurrentes, actualizaciones claras y soporte premium facilitan mantener prendas, hogares y lugares de trabajo en excelentes condiciones.",
    },
  },
  closingCta: {
    eyebrow: "¿Listo para vivir Henry Onyx Care?",
    title: "Reserve un servicio premium con puntualidad, claridad y seguimiento incorporados.",
    body: "Desde la recogida y entrega de prendas hasta la limpieza recurrente del hogar y de oficinas, Henry Onyx Care está pensado para que el servicio fiable resulte sencillo.",
    bookCta: "Reservar un servicio",
    exploreCta: "Ver servicios",
  },
};
const CARE_ABOUT_COPY_PT: DeepPartial<CareAboutCopy> = {
  metadata: {
    title: "Sobre a Henry Onyx Care",
    description:
      "Conheça como a Henry Onyx Care entrega cuidados premium com vestuário, limpeza residencial, limpeza de escritórios e um acompanhamento de serviço confiável.",
  },
  hero: {
    eyebrow: "Sobre a Henry Onyx Care",
    title: "Confiança. Pontualidade. Qualidade de serviço.",
    body: "A Henry Onyx Care oferece cuidados com vestuário, recolha e entrega, limpeza residencial, limpeza de escritórios e planos de serviço recorrentes numa experiência de cliente cuidada — execução confiável, manuseio respeitoso e um acabamento que os clientes têm prazer em receber novamente.",
    bookCta: "Reservar um serviço",
    contactCta: "Falar com a equipa",
  },
  heroFacts: {
    serviceHoursLabel: "Horário de serviço",
    careDeskLabel: "Atendimento ao cliente",
    serviceOptionsLabel: "Opções de serviço",
    pickupHoursFallback: "Seg - Sáb • 8h00 às 19h00",
    linesPackagesTemplate: "{lines} frentes · {packages} pacotes",
  },
  lanes: {
    eyebrow: "Três frentes de serviço",
    garmentCare: {
      title: "Cuidados com vestuário",
      body: "Do guarda-roupa do dia a dia às peças delicadas — limpeza, tratamento de nódoas, passadoria, acabamento e entrega de devolução conduzidos com precisão.",
    },
    homeCleaning: {
      title: "Limpeza residencial",
      body: "Os lares são atendidos com janelas de chegada claras, notas de serviço atenciosas e um acabamento pensado para parecer sereno, fresco e genuinamente completo.",
    },
    officeCleaning: {
      title: "Limpeza de escritórios",
      body: "Os locais de trabalho contam com apoio de limpeza confiável, pontualidade profissional, gestão organizada do local e uma continuidade com que as empresas podem contar.",
    },
  },
  standards: {
    eyebrow: "Por que os clientes confiam na Henry Onyx Care",
    title: "Um serviço confiável nasce de padrões que os clientes conseguem sentir.",
    bullets: [
      "Comunicação clara antes da recolha, antes da chegada e em cada atualização importante.",
      "Tratamento profissional de vestuário, lares e locais de trabalho, com o contexto certo para cada tipo de serviço.",
      "Opções recorrentes que tornam o cuidado a longo prazo mais fácil de gerir e mais fácil de confiar.",
      "Um único atendimento que documenta o acompanhamento em vez de o dispersar por vários canais.",
    ],
  },
  flow: {
    eyebrow: "Como decorre a experiência",
    title: "Fluido para o cliente, disciplinado nos bastidores.",
    stepLabel: "Passo",
    steps: [
      {
        title: "Reserve o serviço certo",
        body: "Escolha cuidados com vestuário, limpeza residencial ou limpeza de escritórios e indique o horário, a morada e as notas que importam.",
      },
      {
        title: "Receba uma confirmação clara",
        body: "Recebe a confirmação, os detalhes da reserva, indicações de pagamento quando aplicáveis e um código de acompanhamento.",
      },
      {
        title: "O serviço é executado com profissionalismo",
        body: "As peças seguem por recolha e entrega. Lares e escritórios seguem por chegada, trabalho no local e conclusão.",
      },
      {
        title: "Mantenha-se informado até ao fim",
        body: "O acompanhamento e as atualizações por e-mail mantêm o próximo passo claro, seja uma entrega de devolução ou uma visita concluída.",
      },
    ],
  },
  reasons: {
    eyebrow: "O que pode esperar",
    pickupDelivery: {
      title: "Recolha e entrega",
      body: "Os cuidados com vestuário incluem recolha controlada, tratamento, acabamento e entrega de devolução para que os clientes acompanhem o pedido do início ao fim.",
    },
    qualityStandards: {
      title: "Padrões de qualidade",
      body: "Seja num guarda-roupa, num lar ou num local de trabalho, o resultado deve sentir-se consistente, cuidado e profissionalmente concluído.",
    },
    convenience: {
      title: "Conveniência sem compromissos",
      body: "Planos recorrentes, atualizações claras e suporte premium tornam mais fácil manter vestuário, lares e escritórios em excelente estado.",
    },
  },
  closingCta: {
    eyebrow: "Pronto para experimentar a Henry Onyx Care?",
    title: "Reserve um serviço premium com pontualidade, clareza e acompanhamento integrados.",
    body: "Da recolha e entrega de vestuário à limpeza recorrente de lares e escritórios, a Henry Onyx Care foi pensada para tornar o serviço confiável simples.",
    bookCta: "Reservar um serviço",
    exploreCta: "Ver serviços",
  },
};
const CARE_ABOUT_COPY_AR: DeepPartial<CareAboutCopy> = {
  metadata: {
    title: "نبذة عن Henry Onyx Care",
    description:
      "تعرّف على كيف توفّر Henry Onyx Care عناية فاخرة بالملابس، وتنظيف المنازل، وتنظيف المكاتب، ومتابعة خدمة يمكن الاعتماد عليها.",
  },
  hero: {
    eyebrow: "نبذة عن Henry Onyx Care",
    title: "ثقة. التزام بالوقت. جودة خدمة.",
    body: "تقدّم Henry Onyx Care العناية بالملابس، الاستلام والتوصيل، تنظيف المنازل، تنظيف المكاتب، وخططًا متكررة ضمن تجربة عميل واحدة متقنة — تنفيذ موثوق، تعامل محترم، ولمسة نهائية يسعد العملاء بإعادة استدعائها.",
    bookCta: "احجز خدمة",
    contactCta: "تواصل مع الفريق",
  },
  heroFacts: {
    serviceHoursLabel: "ساعات الخدمة",
    careDeskLabel: "مكتب العناية",
    serviceOptionsLabel: "خيارات الخدمة",
    pickupHoursFallback: "الإثنين - السبت • 8:00 صباحًا حتى 7:00 مساءً",
    linesPackagesTemplate: "{lines} مسارات · {packages} باقات",
  },
  lanes: {
    eyebrow: "ثلاثة مسارات للخدمة",
    garmentCare: {
      title: "العناية بالملابس",
      body: "من قطع الخزانة اليومية إلى القطع الحساسة — تنظيف، معالجة بقع، كي، لمسات أخيرة، وتوصيل العودة، كل ذلك يُنفَّذ بدقة.",
    },
    homeCleaning: {
      title: "تنظيف المنازل",
      body: "يُعتنى بالمنازل بنوافذ وصول واضحة، وملاحظات خدمة دقيقة، ولمسة نهائية مصممة لتشعرك بالهدوء والانتعاش والاكتمال الحقيقي.",
    },
    officeCleaning: {
      title: "تنظيف المكاتب",
      body: "تحصل أماكن العمل على دعم تنظيف موثوق بالتزام مهني بالمواعيد، وإدارة منظمة للموقع، واستمرارية يمكن للشركات الاعتماد عليها.",
    },
  },
  standards: {
    eyebrow: "لماذا يثق العملاء بـ Henry Onyx Care",
    title: "الخدمة الموثوقة تنبع من معايير يستطيع العملاء أن يلمسوها بالفعل.",
    bullets: [
      "تواصل واضح قبل الاستلام، وقبل الوصول، وعند كل تحديث مهم.",
      "تعامل احترافي مع الملابس والمنازل وأماكن العمل، مع السياق المناسب لكل نوع من الخدمات.",
      "خيارات متكررة تجعل العناية على المدى الطويل أسهل في الإدارة وأكثر جدارة بالثقة.",
      "مكتب عناية واحد يوثّق المتابعة بدلًا من تشتيتها عبر القنوات.",
    ],
  },
  flow: {
    eyebrow: "كيف تسير التجربة",
    title: "سلِسة بالنسبة للعميل، ومنضبطة خلف الكواليس.",
    stepLabel: "الخطوة",
    steps: [
      {
        title: "احجز الخدمة المناسبة",
        body: "اختر العناية بالملابس، أو تنظيف المنازل، أو تنظيف المكاتب، وشاركنا الوقت والعنوان وملاحظات الخدمة المهمة.",
      },
      {
        title: "استلم تأكيدًا واضحًا",
        body: "تستلم تأكيد الحجز، وتفاصيله، وإرشادات الدفع عند الحاجة، ورمز متابعة للتواصل اللاحق.",
      },
      {
        title: "يُنفَّذ العمل باحترافية",
        body: "تمرّ الملابس بمراحل الاستلام والتوصيل. وتمرّ المنازل والمكاتب بمراحل الوصول، والعمل في الموقع، والإنجاز.",
      },
      {
        title: "ابقَ على اطلاع حتى النهاية",
        body: "تُبقي المتابعة وتحديثات البريد الإلكتروني الخطوة التالية واضحة، سواء كانت توصيل عودة أو زيارة مكتملة.",
      },
    ],
  },
  reasons: {
    eyebrow: "ماذا تتوقّع",
    pickupDelivery: {
      title: "الاستلام والتوصيل",
      body: "تشمل العناية بالملابس استلامًا منضبطًا، ومعالجة، ولمسات أخيرة، وتوصيل عودة، حتى يتابع العملاء طلبهم من البداية إلى النهاية.",
    },
    qualityStandards: {
      title: "معايير الجودة",
      body: "سواء جرت الخدمة في خزانة، أو منزل، أو مكان عمل، يجب أن تكون النتيجة متّسقة ودقيقة ومنجزة باحتراف.",
    },
    convenience: {
      title: "راحة دون تنازلات",
      body: "تجعل الخطط المتكررة، والتحديثات الواضحة، والدعم الفاخر، الحفاظ على الملابس والمنازل وأماكن العمل في حالة ممتازة أمرًا أسهل.",
    },
  },
  closingCta: {
    eyebrow: "هل أنت مستعد لتجربة Henry Onyx Care؟",
    title: "احجز خدمة عناية فاخرة مع التزام بالوقت، ووضوح، ومتابعة مدمجة.",
    body: "من استلام الملابس وتوصيلها إلى تنظيف المنازل والمكاتب المتكرر، صُممت Henry Onyx Care لتجعل الخدمة الموثوقة سهلة وميسّرة.",
    bookCta: "احجز خدمة",
    exploreCta: "استكشاف الخدمات",
  },
};
const CARE_ABOUT_COPY_DE: DeepPartial<CareAboutCopy> = {
  metadata: {
    title: "Über Henry Onyx Care",
    description:
      "Erfahren Sie, wie Henry Onyx Care Premium-Textilpflege, Heimreinigung, Büroreinigung und eine verlässliche Servicenachverfolgung liefert.",
  },
  hero: {
    eyebrow: "Über Henry Onyx Care",
    title: "Vertrauen. Pünktlichkeit. Servicequalität.",
    body: "Henry Onyx Care bietet Textilpflege, Abholung und Lieferung, Heimreinigung, Büroreinigung und wiederkehrende Servicepakete in einem geschliffenen Kundenerlebnis — verlässliche Ausführung, respektvoller Umgang und ein Ergebnis, das Kunden gerne erneut beauftragen.",
    bookCta: "Service buchen",
    contactCta: "Team kontaktieren",
  },
  heroFacts: {
    serviceHoursLabel: "Servicezeiten",
    careDeskLabel: "Care-Desk",
    serviceOptionsLabel: "Serviceoptionen",
    pickupHoursFallback: "Mo - Sa • 8:00 bis 19:00 Uhr",
    linesPackagesTemplate: "{lines} Linien · {packages} Pakete",
  },
  lanes: {
    eyebrow: "Drei Servicelinien",
    garmentCare: {
      title: "Textilpflege",
      body: "Vom Alltagskleiderschrank bis zu empfindlichen Stücken — Reinigung, Fleckenbehandlung, Bügeln, Finish und Rücklieferung mit Präzision ausgeführt.",
    },
    homeCleaning: {
      title: "Heimreinigung",
      body: "Häuser werden mit klaren Ankunftsfenstern, durchdachten Servicenotizen und einem Finish betreut, das ruhig, frisch und wirklich vollständig wirkt.",
    },
    officeCleaning: {
      title: "Büroreinigung",
      body: "Arbeitsplätze erhalten verlässliche Reinigungsunterstützung mit professioneller Pünktlichkeit, organisierter Vor-Ort-Abwicklung und einer Kontinuität, auf die Unternehmen zählen können.",
    },
  },
  standards: {
    eyebrow: "Warum Kunden Henry Onyx Care vertrauen",
    title: "Verlässlicher Service entsteht aus Standards, die Kunden wirklich spüren.",
    bullets: [
      "Klare Kommunikation vor der Abholung, vor der Ankunft und bei jedem wichtigen Update.",
      "Professioneller Umgang mit Kleidung, Häusern und Arbeitsplätzen mit dem passenden Kontext für jeden Servicetyp.",
      "Wiederkehrende Optionen machen langfristige Pflege leichter zu steuern und einfacher zu vertrauen.",
      "Ein Care-Desk, der Folgekommunikation dokumentiert, statt sie über Kanäle zu verteilen.",
    ],
  },
  flow: {
    eyebrow: "So läuft das Erlebnis",
    title: "Reibungslos für den Kunden, diszipliniert hinter den Kulissen.",
    stepLabel: "Schritt",
    steps: [
      {
        title: "Den richtigen Service buchen",
        body: "Wählen Sie Textilpflege, Heimreinigung oder Büroreinigung und teilen Sie Zeit, Adresse und wichtige Servicenotizen mit.",
      },
      {
        title: "Klare Bestätigung erhalten",
        body: "Sie erhalten die Bestätigung, Buchungsdetails, gegebenenfalls Zahlungshinweise und einen Tracking-Code für die Nachverfolgung.",
      },
      {
        title: "Der Service wird professionell ausgeführt",
        body: "Kleidung durchläuft Abholung und Lieferung. Häuser und Büros durchlaufen Ankunft, Vor-Ort-Arbeit und Abschluss.",
      },
      {
        title: "Bis zum Schluss informiert bleiben",
        body: "Tracking und E-Mail-Updates halten den nächsten Schritt klar — egal ob Rücklieferung oder abgeschlossener Termin.",
      },
    ],
  },
  reasons: {
    eyebrow: "Was Sie erwarten dürfen",
    pickupDelivery: {
      title: "Abholung und Lieferung",
      body: "Textilpflege umfasst kontrollierte Abholung, Behandlung, Finish und Rücklieferung, sodass Kunden den Auftrag von Anfang bis Ende verfolgen können.",
    },
    qualityStandards: {
      title: "Qualitätsstandards",
      body: "Ob Garderobe, Zuhause oder Arbeitsplatz — das Ergebnis soll sich konsistent, sorgfältig und professionell abgeschlossen anfühlen.",
    },
    convenience: {
      title: "Komfort ohne Kompromisse",
      body: "Wiederkehrende Pakete, klare Updates und Premium-Support machen es leichter, Kleidung, Häuser und Arbeitsplätze in bestem Zustand zu halten.",
    },
  },
  closingCta: {
    eyebrow: "Bereit, Henry Onyx Care zu erleben?",
    title: "Buchen Sie einen Premium-Service mit eingebauter Pünktlichkeit, Klarheit und Nachverfolgung.",
    body: "Von der Abholung und Lieferung von Kleidung bis hin zu wiederkehrender Heim- und Büroreinigung ist Henry Onyx Care darauf ausgelegt, verlässlichen Service mühelos wirken zu lassen.",
    bookCta: "Service buchen",
    exploreCta: "Services entdecken",
  },
};
const CARE_ABOUT_COPY_IT: DeepPartial<CareAboutCopy> = {
  metadata: {
    title: "Su Henry Onyx Care",
    description:
      "Scopri come Henry Onyx Care offre cura degli abiti premium, pulizia domestica, pulizia di uffici e un follow-up di servizio affidabile.",
  },
  hero: {
    eyebrow: "Su Henry Onyx Care",
    title: "Fiducia. Puntualità. Qualità del servizio.",
    body: "Henry Onyx Care offre cura degli abiti, ritiro e consegna, pulizia domestica, pulizia di uffici e piani ricorrenti in un’unica esperienza cliente curata: esecuzione affidabile, manipolazione rispettosa e un risultato che i clienti sono felici di richiamare.",
    bookCta: "Prenota un servizio",
    contactCta: "Contatta il team",
  },
  heroFacts: {
    serviceHoursLabel: "Orari di servizio",
    careDeskLabel: "Care desk",
    serviceOptionsLabel: "Opzioni di servizio",
    pickupHoursFallback: "Lun - Sab • dalle 8:00 alle 19:00",
    linesPackagesTemplate: "{lines} linee · {packages} pacchetti",
  },
  lanes: {
    eyebrow: "Tre linee di servizio",
    garmentCare: {
      title: "Cura degli abiti",
      body: "Dagli essenziali quotidiani ai capi delicati: pulizia, trattamento delle macchie, stiratura, finitura e consegna di ritorno gestiti con precisione.",
    },
    homeCleaning: {
      title: "Pulizia domestica",
      body: "Le case sono curate con finestre di arrivo chiare, note di servizio attente e una finitura pensata per risultare serena, fresca e davvero completa.",
    },
    officeCleaning: {
      title: "Pulizia di uffici",
      body: "I luoghi di lavoro ricevono un supporto di pulizia affidabile con puntualità professionale, gestione organizzata del sito e una continuità su cui le aziende possono contare.",
    },
  },
  standards: {
    eyebrow: "Perché i clienti scelgono Henry Onyx Care",
    title: "Un servizio affidabile nasce da standard che i clienti percepiscono davvero.",
    bullets: [
      "Comunicazione chiara prima del ritiro, prima dell’arrivo e a ogni aggiornamento importante.",
      "Gestione professionale di abiti, case e luoghi di lavoro con il giusto contesto per ogni tipo di servizio.",
      "Opzioni ricorrenti che rendono la cura nel tempo più semplice da gestire e più facile da affidare.",
      "Un unico care desk che documenta il follow-up invece di disperderlo tra canali.",
    ],
  },
  flow: {
    eyebrow: "Come si svolge l’esperienza",
    title: "Fluida per il cliente, disciplinata dietro le quinte.",
    stepLabel: "Passo",
    steps: [
      {
        title: "Prenota il servizio giusto",
        body: "Scegli cura degli abiti, pulizia domestica o pulizia di uffici e indica orario, indirizzo e note di servizio rilevanti.",
      },
      {
        title: "Ricevi una conferma chiara",
        body: "Ricevi conferma, dettagli della prenotazione, indicazioni di pagamento ove applicabili e un codice di tracciamento.",
      },
      {
        title: "Il servizio viene svolto con professionalità",
        body: "Gli abiti seguono ritiro e consegna. Case e uffici seguono arrivo, lavoro in sede e completamento.",
      },
      {
        title: "Resta informato fino alla fine",
        body: "Tracking e aggiornamenti via email tengono chiaro il passo successivo, sia una consegna di ritorno sia una visita completata.",
      },
    ],
  },
  reasons: {
    eyebrow: "Cosa puoi aspettarti",
    pickupDelivery: {
      title: "Ritiro e consegna",
      body: "La cura degli abiti comprende ritiro controllato, trattamento, finitura e consegna di ritorno, così i clienti seguono l’ordine dall’inizio alla fine.",
    },
    qualityStandards: {
      title: "Standard di qualità",
      body: "Sia in un guardaroba, in una casa o in un luogo di lavoro, il risultato deve essere coerente, attento e professionalmente rifinito.",
    },
    convenience: {
      title: "Comodità senza compromessi",
      body: "Piani ricorrenti, aggiornamenti chiari e un supporto premium rendono più semplice mantenere abiti, case e uffici in condizioni eccellenti.",
    },
  },
  closingCta: {
    eyebrow: "Pronto a provare Henry Onyx Care?",
    title: "Prenota un servizio premium con puntualità, chiarezza e follow-up integrati.",
    body: "Dal ritiro e dalla consegna degli abiti alla pulizia ricorrente di case e uffici, Henry Onyx Care è pensata per rendere il servizio affidabile semplice.",
    bookCta: "Prenota un servizio",
    exploreCta: "Scopri i servizi",
  },
};
const CARE_ABOUT_COPY_ZH: DeepPartial<CareAboutCopy> = {
  metadata: {
    title: "关于 Henry Onyx Care",
    description:
      "了解 Henry Onyx Care 如何提供高端衣物护理、家庭清洁、办公室清洁,以及可靠的服务跟进。",
  },
  hero: {
    eyebrow: "关于 Henry Onyx Care",
    title: "信任。守时。服务品质。",
    body: "Henry Onyx Care 在一套精致的客户体验中提供衣物护理、上门取送、家庭清洁、办公室清洁和长期服务计划——可靠的执行、尊重的处理,以及让客户乐于再次回来的完成度。",
    bookCta: "预约服务",
    contactCta: "联系团队",
  },
  heroFacts: {
    serviceHoursLabel: "服务时间",
    careDeskLabel: "客服中心",
    serviceOptionsLabel: "服务选项",
    pickupHoursFallback: "周一至周六 • 上午 8:00 至 晚上 7:00",
    linesPackagesTemplate: "{lines} 条服务线 · {packages} 个套餐",
  },
  lanes: {
    eyebrow: "三条服务线",
    garmentCare: {
      title: "衣物护理",
      body: "从日常衣橱必需品到精致衣物——清洁、去渍、熨烫、整理与回送,均以精准方式完成。",
    },
    homeCleaning: {
      title: "家庭清洁",
      body: "我们以清晰的到达时段、贴心的服务备注与一个让家居感到平静、清新、真正完成的收尾,来照看每一个家。",
    },
    officeCleaning: {
      title: "办公室清洁",
      body: "工作场所获得可靠的清洁支持,具备专业的守时性、有序的现场处理,以及企业可以依赖的持续性。",
    },
  },
  standards: {
    eyebrow: "客户为何信任 Henry Onyx Care",
    title: "可靠的服务来自客户能真正感受到的标准。",
    bullets: [
      "在取件前、到达前以及每一次重要更新时,均保持清晰沟通。",
      "对衣物、家庭和工作场所给予专业处理,并按每种服务类型采用相应的处理方式。",
      "长期回访计划让长期保养更易管理,也更易托付信任。",
      "由同一个客服中心记录跟进,避免信息分散在多个渠道。",
    ],
  },
  flow: {
    eyebrow: "整个体验如何进行",
    title: "对客户顺畅,在幕后严谨。",
    stepLabel: "步骤",
    steps: [
      {
        title: "预约合适的服务",
        body: "选择衣物护理、家庭清洁或办公室清洁,并告知重要的时间、地址和服务备注。",
      },
      {
        title: "收到清晰的确认",
        body: "您会收到预约确认、详情、必要的付款指引,以及用于后续跟进的查询码。",
      },
      {
        title: "服务以专业方式完成",
        body: "衣物经过取件与送回。家庭和办公室经过到达、现场作业和完成。",
      },
      {
        title: "全程保持知情",
        body: "查询和邮件更新让下一步始终清晰,无论是回送还是已完成的上门服务。",
      },
    ],
  },
  reasons: {
    eyebrow: "您可以期待什么",
    pickupDelivery: {
      title: "取件与送回",
      body: "衣物护理包含可控的取件、处理、整理与回送,让客户从头到尾跟踪订单。",
    },
    qualityStandards: {
      title: "品质标准",
      body: "无论在衣橱、家中还是办公场所,结果都应保持一致、细致,并具有专业的收尾感。",
    },
    convenience: {
      title: "便捷而不妥协",
      body: "定期方案、清晰更新与优质支持,让衣物、家居与办公场所的良好状态更易长期维持。",
    },
  },
  closingCta: {
    eyebrow: "准备好体验 Henry Onyx Care 了吗?",
    title: "预约一项高端护理服务,守时、清晰与跟进皆已内建。",
    body: "从衣物的上门取送,到家庭与办公室的长期清洁,Henry Onyx Care 让可靠的服务变得轻松。",
    bookCta: "预约服务",
    exploreCta: "探索服务",
  },
};
const CARE_ABOUT_COPY_HI: DeepPartial<CareAboutCopy> = {
  metadata: {
    title: "Henry Onyx Care के बारे में",
    description:
      "जानें कि Henry Onyx Care कैसे प्रीमियम वस्त्र देखभाल, घरेलू सफाई, कार्यालय सफाई और भरोसेमंद सर्विस फॉलो-अप उपलब्ध कराता है।",
  },
  hero: {
    eyebrow: "Henry Onyx Care के बारे में",
    title: "भरोसा। समय पर सेवा। सेवा की गुणवत्ता।",
    body: "Henry Onyx Care एक सुगठित ग्राहक अनुभव में वस्त्र देखभाल, पिकअप और डिलीवरी, घरेलू सफाई, कार्यालय सफाई और नियमित सर्विस प्लान उपलब्ध कराता है — भरोसेमंद निष्पादन, सम्मानजनक देखभाल, और एक ऐसा परिणाम जिसे ग्राहक खुशी से दोबारा बुलाते हैं।",
    bookCta: "सर्विस बुक करें",
    contactCta: "टीम से संपर्क करें",
  },
  heroFacts: {
    serviceHoursLabel: "सेवा के समय",
    careDeskLabel: "केयर डेस्क",
    serviceOptionsLabel: "सेवा विकल्प",
    pickupHoursFallback: "सोम - शनि • सुबह 8:00 से शाम 7:00 तक",
    linesPackagesTemplate: "{lines} सेवा लाइनें · {packages} पैकेज",
  },
  lanes: {
    eyebrow: "तीन सेवा लाइनें",
    garmentCare: {
      title: "वस्त्र देखभाल",
      body: "रोज़मर्रा के कपड़ों से लेकर नाज़ुक कपड़ों तक — सफाई, दाग़ हटाना, इस्त्री, फिनिशिंग और वापसी डिलीवरी, सब कुछ सटीकता से।",
    },
    homeCleaning: {
      title: "घरेलू सफाई",
      body: "घरों की देखभाल स्पष्ट आगमन समय, ध्यानपूर्वक सेवा नोट्स, और एक ऐसी फिनिशिंग के साथ की जाती है जो शांत, ताज़ी और सच में पूर्ण लगती है।",
    },
    officeCleaning: {
      title: "कार्यालय सफाई",
      body: "कार्यस्थलों को पेशेवर समयबद्धता, सुव्यवस्थित साइट प्रबंधन और निरंतरता के साथ भरोसेमंद सफाई सहायता मिलती है, जिस पर व्यवसाय भरोसा कर सकें।",
    },
  },
  standards: {
    eyebrow: "ग्राहक Henry Onyx Care पर भरोसा क्यों करते हैं",
    title: "भरोसेमंद सेवा उन मानकों से आती है जिन्हें ग्राहक सचमुच महसूस कर सकें।",
    bullets: [
      "पिकअप से पहले, आगमन से पहले और हर महत्वपूर्ण अपडेट पर स्पष्ट संवाद।",
      "हर सेवा प्रकार के सही संदर्भ के साथ कपड़ों, घरों और कार्यस्थलों की पेशेवर देखभाल।",
      "नियमित विकल्प जो दीर्घकालिक देखभाल को संभालना आसान और भरोसेमंद बनाते हैं।",
      "एक ही केयर डेस्क जो फॉलो-अप को कई चैनलों में बिखेरने के बजाय दर्ज रखता है।",
    ],
  },
  flow: {
    eyebrow: "अनुभव कैसे चलता है",
    title: "ग्राहक के लिए सहज, परदे के पीछे अनुशासित।",
    stepLabel: "चरण",
    steps: [
      {
        title: "सही सर्विस बुक करें",
        body: "वस्त्र देखभाल, घरेलू सफाई या कार्यालय सफाई चुनें और समय, पता और ज़रूरी सेवा नोट साझा करें।",
      },
      {
        title: "स्पष्ट पुष्टि प्राप्त करें",
        body: "आपको पुष्टि, बुकिंग विवरण, ज़रूरत होने पर भुगतान मार्गदर्शन और फॉलो-अप के लिए एक ट्रैकिंग कोड मिलता है।",
      },
      {
        title: "सर्विस पेशेवर ढंग से पूरी होती है",
        body: "कपड़े पिकअप और डिलीवरी से गुज़रते हैं। घर और कार्यालय आगमन, ऑन-साइट काम और पूर्णता से गुज़रते हैं।",
      },
      {
        title: "अंत तक सूचित रहें",
        body: "ट्रैकिंग और ईमेल अपडेट अगले चरण को स्पष्ट रखते हैं — चाहे वह वापसी डिलीवरी हो या पूर्ण विज़िट।",
      },
    ],
  },
  reasons: {
    eyebrow: "आप क्या उम्मीद कर सकते हैं",
    pickupDelivery: {
      title: "पिकअप और डिलीवरी",
      body: "वस्त्र देखभाल में नियंत्रित पिकअप, उपचार, फिनिशिंग और वापसी डिलीवरी शामिल है, ताकि ग्राहक ऑर्डर को शुरू से अंत तक ट्रैक कर सकें।",
    },
    qualityStandards: {
      title: "गुणवत्ता मानक",
      body: "चाहे सेवा अलमारी, घर या कार्यस्थल पर हो, परिणाम सुसंगत, सावधान और पेशेवर रूप से पूरा महसूस होना चाहिए।",
    },
    convenience: {
      title: "बिना समझौते की सहूलियत",
      body: "नियमित प्लान, स्पष्ट अपडेट और प्रीमियम सपोर्ट कपड़ों, घरों और कार्यस्थलों को बेहतरीन स्थिति में रखना आसान बनाते हैं।",
    },
  },
  closingCta: {
    eyebrow: "क्या आप Henry Onyx Care का अनुभव लेने को तैयार हैं?",
    title: "एक प्रीमियम केयर सर्विस बुक करें, जिसमें समयबद्धता, स्पष्टता और फॉलो-थ्रू पहले से ही शामिल हैं।",
    body: "वस्त्र पिकअप और डिलीवरी से लेकर नियमित घरेलू और कार्यालय सफाई तक, Henry Onyx Care भरोसेमंद सेवा को आसान बनाने के लिए तैयार किया गया है।",
    bookCta: "सर्विस बुक करें",
    exploreCta: "सेवाएँ देखें",
  },
};
const CARE_ABOUT_COPY_IG: DeepPartial<CareAboutCopy> = {
  metadata: {
    title: "Maka Henry Onyx Care",
    description:
      "Mụta otú Henry Onyx Care si enye nlekọta uwe dị elu, nhicha ụlọ, nhicha ọfịs, na nsoghachi ọrụ a pụrụ ịdabere na ya.",
  },
  hero: {
    eyebrow: "Maka Henry Onyx Care",
    title: "Ntụkwasị obi. Oge. Ogo ọrụ.",
    body: "Henry Onyx Care na-enye nlekọta uwe, mbufe na nbubata, nhicha ụlọ, nhicha ọfịs, na atụmatụ ọrụ na-emegharị ugboro ugboro n’otu ahụmahụ ndị ahịa zuru oke — mmezu a pụrụ ịdabere na ya, njide nke nwere nkwanye ùgwù, na nkwụsị nke ndị ahịa na-aṅụrị ọṅụ ịkpọghachi ya.",
    bookCta: "Debe ọrụ",
    contactCta: "Kpọtụrụ ndị otu",
  },
  heroFacts: {
    serviceHoursLabel: "Awa ọrụ",
    careDeskLabel: "Tebụl nlekọta",
    serviceOptionsLabel: "Nhọrọ ọrụ",
    pickupHoursFallback: "Mọn - Sat • 8:00 ụtụtụ ruo 7:00 mgbede",
    linesPackagesTemplate: "{lines} usoro ọrụ · {packages} ngwugwu",
  },
  lanes: {
    eyebrow: "Usoro ọrụ atọ",
    garmentCare: {
      title: "Nlekọta uwe",
      body: "Site na uwe ụbọchị niile ruo uwe ndị siri ike — nhicha, nlekọta ntụpọ, ịgha uwe, mmecha, na nbughachi, e ji nlezianya mee.",
    },
    homeCleaning: {
      title: "Nhicha ụlọ",
      body: "A na-elekọta ụlọ ndị mmadụ site na oge mbata doro anya, ndetu ọrụ ndị nwere nlebara anya, na mmecha emeere ka ọ dị jụụ, dị ọhụrụ, na zuru ezu n’ezie.",
    },
    officeCleaning: {
      title: "Nhicha ọfịs",
      body: "Ebe ọrụ na-enweta nkwado nhicha a pụrụ ịdabere na ya na oge dị mma, njikwa saịtị nke a haziri ahazi, na nkwekọrịta nke azụmahịa nwere ike ịtụkwasị obi.",
    },
  },
  standards: {
    eyebrow: "Ihe kpatara ndị ahịa ji tụkwasị Henry Onyx Care obi",
    title: "Ọrụ a pụrụ ịdabere na ya si na ụkpụrụ ndị ahịa nwere ike inwe mmetụta ya n’ezie.",
    bullets: [
      "Mkparịta ụka doro anya tupu mbufe, tupu mbata, na n’oge mmelite ọ bụla dị mkpa.",
      "Njide nke nwere ọkachamara maka uwe, ụlọ, na ebe ọrụ, jiri ọnọdụ kwesịrị ekwesị maka ụdị ọrụ ọ bụla.",
      "Nhọrọ na-emegharị ugboro ugboro nke na-eme ka nlekọta ogologo oge dị mfe ijikwa na dị mfe ịtụkwasị obi.",
      "Otu tebụl nlekọta nke na-edekọ nsoghachi karịa ịgbasa ya n’ọtụtụ ụzọ.",
    ],
  },
  flow: {
    eyebrow: "Otú ahụmahụ si arụ ọrụ",
    title: "Dị nro nye onye ahịa, kpara aka azụ n’azụ.",
    stepLabel: "Nzọụkwụ",
    steps: [
      {
        title: "Debe ọrụ kwesịrị ekwesị",
        body: "Họrọ nlekọta uwe, nhicha ụlọ, ma ọ bụ nhicha ọfịs ma kọwaa oge, adres, na ndetu ọrụ ndị dị mkpa.",
      },
      {
        title: "Nweta nkwenye doro anya",
        body: "Ị ga-enweta nkwenye, nkọwa ndebanye aha, ntụziaka ịkwụ ụgwọ ma ọ dị mkpa, na koodu nsochi maka nsoghachi.",
      },
      {
        title: "A na-arụ ọrụ ahụ n’ụzọ ọkachamara",
        body: "Uwe na-aga site na mbufe na nbubata. Ụlọ na ọfịs na-aga site na mbata, ọrụ ebe ahụ, na mmecha.",
      },
      {
        title: "Nọrọ na-amata ihe ruo ọgwụgwụ",
        body: "Nsochi na mmelite email na-eme ka nzọụkwụ ọzọ doo anya, ma ọ bụ nbughachi ma ọ bụ nleta zuru oke.",
      },
    ],
  },
  reasons: {
    eyebrow: "Ihe ị ga-atụ anya ya",
    pickupDelivery: {
      title: "Mbufe na nbubata",
      body: "Nlekọta uwe na-agụnye mbufe a na-achịkwa, ọgwụgwọ, mmecha, na nbughachi, ka ndị ahịa wee soro iwu ahụ site na mmalite ruo ọgwụgwụ.",
    },
    qualityStandards: {
      title: "Ụkpụrụ ogo",
      body: "Ma ọ bụ na ebe a na-edobe uwe, n’ụlọ, ma ọ bụ n’ebe ọrụ, nsonaazụ ahụ kwesịrị ịdị otu, lezie anya, ma jiri ọkachamara mechaa.",
    },
    convenience: {
      title: "Mfe na-enweghị ịdaba",
      body: "Atụmatụ na-emegharị ugboro ugboro, mmelite doro anya, na nkwado dị elu na-eme ka ọ dị mfe idobe uwe, ụlọ, na ebe ọrụ n’ọnọdụ kachasị mma.",
    },
  },
  closingCta: {
    eyebrow: "Ị dị njikere inweta ahụmahụ Henry Onyx Care?",
    title: "Debe ọrụ nlekọta dị elu nwere oge, nghọta, na nsoghachi etinyere n’ime ya.",
    body: "Site na mbufe na nbubata uwe ruo nhicha ụlọ na nhicha ọfịs na-emegharị, e wuru Henry Onyx Care iji mee ka ọrụ a pụrụ ịdabere na ya dị mfe.",
    bookCta: "Debe ọrụ",
    exploreCta: "Chọpụta ọrụ",
  },
};
const CARE_ABOUT_COPY_YO: DeepPartial<CareAboutCopy> = {
  metadata: {
    title: "Nípa Henry Onyx Care",
    description:
      "Mọ bí Henry Onyx Care ṣe ń pèsè ìtọ́jú aṣọ pípé, ìmọ́tótó ilé, ìmọ́tótó ọ́fíìsì, àti ìtẹ̀lé iṣẹ́ tó gbára lé.",
  },
  hero: {
    eyebrow: "Nípa Henry Onyx Care",
    title: "Ìgbàgbọ́. Àkókò. Ìpele iṣẹ́.",
    body: "Henry Onyx Care ń pèsè ìtọ́jú aṣọ, gbígba àti ìfijíṣẹ́, ìmọ́tótó ilé, ìmọ́tótó ọ́fíìsì, àti àwọn ètò iṣẹ́ alábáwí nínú ìrírí oníbàárà kan tó dán wíwà — ìṣe tó gbára lé, ìbáṣepọ̀ aláàánú, àti ìparí tí àwọn oníbàárà fẹ́ pe padà.",
    bookCta: "Sọ iṣẹ́ kan",
    contactCta: "Kàn sí ẹgbẹ́",
  },
  heroFacts: {
    serviceHoursLabel: "Wákàtí iṣẹ́",
    careDeskLabel: "Tábìlì ìtọ́jú",
    serviceOptionsLabel: "Àwọn àyàn iṣẹ́",
    pickupHoursFallback: "Ọj.Aj - Ọj.Àb • 8:00 òwúrọ̀ sí 7:00 alẹ́",
    linesPackagesTemplate: "{lines} ìlà iṣẹ́ · {packages} ẹ̀rọ",
  },
  lanes: {
    eyebrow: "Ìlà iṣẹ́ mẹ́ta",
    garmentCare: {
      title: "Ìtọ́jú aṣọ",
      body: "Láti aṣọ ojúmọ́ títí dé aṣọ alábọ́ — ìfọ̀, ìtọ́jú àbàwọ́n, ìjì, ìparí, àti ìfijíṣẹ́ padà, tí a fi ìfara balẹ̀ ṣe.",
    },
    homeCleaning: {
      title: "Ìmọ́tótó ilé",
      body: "A ń tọ́jú ilé pẹ̀lú àkókò dídé tó ṣe kedere, àkíyèsí iṣẹ́ aláyà, àti ìparí tí ó dà bí ìfọ̀kànbalẹ̀, ìtuntun, àti pípé tòótọ́.",
    },
    officeCleaning: {
      title: "Ìmọ́tótó ọ́fíìsì",
      body: "Àwọn ibi iṣẹ́ ń rí ìránlọ́wọ́ ìmọ́tótó tó gbára lé pẹ̀lú àkókò tó tọ́, ìṣàkóso ojúlé tó wà ní ètò, àti ìtẹ̀síwájú tí ìsọwọ́pọ̀ lè gbára lé.",
    },
  },
  standards: {
    eyebrow: "Ìdí tí àwọn oníbàárà fi gbé Henry Onyx Care lé",
    title: "Iṣẹ́ tó gbára lé wá láti àwọn àjọwọ́ tí àwọn oníbàárà lè rí lójú gan-an.",
    bullets: [
      "Ìbáraẹnisọ̀rọ̀ tó ṣe kedere ṣáájú gbígba, ṣáájú dídé, àti nígbà gbogbo ìròyìn pàtàkì.",
      "Ìṣàkóso oníṣẹ́pọ̀ fún aṣọ, ilé, àti ibi iṣẹ́ pẹ̀lú àyíká tó yẹ fún ìru iṣẹ́ kọ̀ọ̀kan.",
      "Àwọn àyàn alábáwí tí ó mú kí ìtọ́jú igba pípẹ́ rọrùn láti ṣàkóso, tí ó sì rọrùn láti gbé lé.",
      "Tábìlì ìtọ́jú kan tí ó ń kọ ìtẹ̀lé sílẹ̀ dípò kí ó tàn káàkiri lórí àwọn ọ̀nà.",
    ],
  },
  flow: {
    eyebrow: "Bí ìrírí ṣe ń lọ",
    title: "Ó rọrùn fún oníbàárà, ó sì jẹ́ ìtònà lẹ́yìn aṣọ-ìbòjú.",
    stepLabel: "Ìgbésẹ̀",
    steps: [
      {
        title: "Sọ iṣẹ́ tó tọ́",
        body: "Yan ìtọ́jú aṣọ, ìmọ́tótó ilé, tàbí ìmọ́tótó ọ́fíìsì, kí o sì sọ àkókò, àdírẹ́sì, àti àwọn àkíyèsí iṣẹ́ pàtàkì.",
      },
      {
        title: "Gba ìjẹ́rìí tó ṣe kedere",
        body: "Ìwọ yóò gba ìjẹ́rìí, àwọn àlàyé ìfọ̀rọ̀wérọ̀, ìtọ́sọ́nà ìsanwó nígbà tó bá yẹ, àti koodu ìtọ́ka fún ìtẹ̀lé.",
      },
      {
        title: "A ó ṣe iṣẹ́ náà ní ọ̀nà oníṣẹ́pọ̀",
        body: "Aṣọ ń lọ nínú gbígba àti ìfijíṣẹ́. Ilé àti ọ́fíìsì ń lọ nínú dídé, iṣẹ́ ní ojú ibi, àti ìparí.",
      },
      {
        title: "Wà nínú ìmọ̀ títí dé òpin",
        body: "Ìtọ́ka àti ìròyìn imeeli yóò pa ìgbésẹ̀ tó tẹ̀lé mọ́ kedere, yálà ìfijíṣẹ́ padà tàbí ìbẹ̀wò tí a parí.",
      },
    ],
  },
  reasons: {
    eyebrow: "Ohun tí o lè retí",
    pickupDelivery: {
      title: "Gbígba àti ìfijíṣẹ́",
      body: "Ìtọ́jú aṣọ pẹ̀lú gbígba aṣàkóso, ìtọ́jú, ìparí, àti ìfijíṣẹ́ padà, kí àwọn oníbàárà lè tẹ̀lé àṣẹ wọn láti ìbẹ̀rẹ̀ dé òpin.",
    },
    qualityStandards: {
      title: "Àjọwọ́ ìpele",
      body: "Yálà ní àpótí aṣọ, ní ilé, tàbí ní ibi iṣẹ́, èsì náà gbọ́dọ̀ rí bí ó ti tójọ, aláàánú, àti tí a parí ní ọ̀nà oníṣẹ́pọ̀.",
    },
    convenience: {
      title: "Ìrọ̀rùn láìsí ìfòyà",
      body: "Àwọn ètò alábáwí, ìròyìn tó ṣe kedere, àti àtìlẹ́yìn pípé ń mú kí ó rọrùn láti tọ́jú aṣọ, ilé, àti ibi iṣẹ́ ní ipò tó dára gidi.",
    },
  },
  closingCta: {
    eyebrow: "Ṣé o ti múra láti rí Henry Onyx Care?",
    title: "Sọ iṣẹ́ ìtọ́jú pípé pẹ̀lú àkókò, kíkedere, àti ìtẹ̀lé tí a ti gbé sí inú rẹ̀.",
    body: "Láti gbígba àti ìfijíṣẹ́ aṣọ títí dé ìmọ́tótó ilé àti ọ́fíìsì alábáwí, a ṣe Henry Onyx Care láti mú kí iṣẹ́ tó gbára lé rọrùn.",
    bookCta: "Sọ iṣẹ́ kan",
    exploreCta: "Ṣàwárí iṣẹ́",
  },
};
const CARE_ABOUT_COPY_HA: DeepPartial<CareAboutCopy> = {
  metadata: {
    title: "Game da Henry Onyx Care",
    description:
      "Gano yadda Henry Onyx Care ke ba da kulawar tufafi mai inganci, tsaftar gida, tsaftar ofis, da bibiyar sabis abin dogaro.",
  },
  hero: {
    eyebrow: "Game da Henry Onyx Care",
    title: "Aminci. Lokaci. Ingancin sabis.",
    body: "Henry Onyx Care na ba da kulawar tufafi, ɗauka da kawowa, tsaftar gida, tsaftar ofis, da shirye-shiryen sabis akai-akai cikin abu ɗaya na ƙwarewar abokin ciniki — aiwatarwa abin dogaro, kulawa cikin girmamawa, da gama aiki da abokin ciniki ke jin daɗin sake kira.",
    bookCta: "Yi rajistar sabis",
    contactCta: "Tuntuɓi tawagar",
  },
  heroFacts: {
    serviceHoursLabel: "Lokutan sabis",
    careDeskLabel: "Tebur kulawa",
    serviceOptionsLabel: "Zaɓuɓɓukan sabis",
    pickupHoursFallback: "Lit - Asa • 8:00 na safe zuwa 7:00 na dare",
    linesPackagesTemplate: "{lines} hanyoyin sabis · {packages} fakitin shirye",
  },
  lanes: {
    eyebrow: "Hanyoyin sabis guda uku",
    garmentCare: {
      title: "Kulawar tufafi",
      body: "Daga tufafin kullum zuwa tufafi masu laushi — wanki, magance tabo, hauda, gamawa, da dawowar isarwa, an gudanar da su a hankali.",
    },
    homeCleaning: {
      title: "Tsaftar gida",
      body: "Ana kula da gidaje da bayyananniyar lokutan zuwa, bayanan sabis masu hankali, da gamawar da aka tsara ta zama mai kwanciyar hankali, sabo, kuma cikakke da gaske.",
    },
    officeCleaning: {
      title: "Tsaftar ofis",
      body: "Wuraren aiki suna samun tallafin tsabta abin dogaro tare da daidaita lokaci na ƙwarewa, kulawa da wuri da aka tsara, da ci gaba da kasuwanci za su dogara da shi.",
    },
  },
  standards: {
    eyebrow: "Me ya sa abokan ciniki ke amincewa da Henry Onyx Care",
    title: "Sabis abin dogaro yana fitowa daga mizanai da abokan ciniki za su iya ji da gaske.",
    bullets: [
      "Bayyananniyar sadarwa kafin ɗauka, kafin zuwa, da kowane sabuntawa mai mahimmanci.",
      "Kulawa ƙwararriya ga tufafi, gidaje, da wuraren aiki tare da daidai mahallin kowane irin sabis.",
      "Zaɓuɓɓuka masu maimaitawa waɗanda ke sa kulawa na dogon lokaci ya zama mai sauƙin sarrafawa kuma mai sauƙin dogara.",
      "Tebur kulawa ɗaya wanda ke rubuta bibiya maimakon watsa shi a kan tashoshi.",
    ],
  },
  flow: {
    eyebrow: "Yadda ƙwarewar ke gudana",
    title: "Sannu ga abokin ciniki, mai tsari a bayan fage.",
    stepLabel: "Mataki",
    steps: [
      {
        title: "Yi rajistar sabis ɗin da ya dace",
        body: "Zaɓi kulawar tufafi, tsaftar gida, ko tsaftar ofis sannan ka raba lokaci, adireshi, da bayanan sabis masu mahimmanci.",
      },
      {
        title: "Karɓi bayyananniyar tabbatarwa",
        body: "Za ka samu tabbatarwa, cikakkun bayanan ajiyar wuri, jagorar biyan kuɗi inda ake buƙata, da lambar bibiya.",
      },
      {
        title: "An gudanar da sabis a ƙwarewa",
        body: "Tufafi suna tafiya ta hanyar ɗauka da isarwa. Gidaje da ofisoshi suna tafiya ta hanyar zuwa, aiki a wuri, da gamawa.",
      },
      {
        title: "Ka kasance da bayanai har zuwa ƙarshe",
        body: "Bibiya da sabuntawar imel suna kiyaye mataki na gaba a sarari — ko dawowar isarwa ce ko ziyara da aka kammala.",
      },
    ],
  },
  reasons: {
    eyebrow: "Abin da za ka iya tsammani",
    pickupDelivery: {
      title: "Ɗauka da isarwa",
      body: "Kulawar tufafi ta haɗa da ɗauka mai sarrafawa, magani, gamawa, da dawowar isarwa, don abokan ciniki su bi oda daga farko zuwa ƙarshe.",
    },
    qualityStandards: {
      title: "Ma'aunin inganci",
      body: "Ko sabis ɗin ya faru a cikin akwati, gida, ko wuri aiki, sakamakon ya kamata ya kasance mai daidaituwa, mai kulawa, kuma a kammala shi a ƙwarewa.",
    },
    convenience: {
      title: "Sauƙi ba tare da sasantawa ba",
      body: "Shirye-shirye masu maimaitawa, sabuntawa masu bayyana, da tallafin ƙwararru suna sa ya zama mai sauƙin kiyaye tufafi, gidaje, da wuraren aiki cikin yanayi mafi kyau.",
    },
  },
  closingCta: {
    eyebrow: "Shin kana shirye don ƙwarewar Henry Onyx Care?",
    title: "Yi rajistar sabis na kulawa mai inganci tare da lokaci, bayyanawa, da bibiya da aka gina ciki.",
    body: "Daga ɗaukar tufafi da isarwa zuwa tsaftar gida da ofis akai-akai, an gina Henry Onyx Care don sanya sabis abin dogaro ya zama mai sauƙi.",
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
