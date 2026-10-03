// V3-49 — surface:services typed copy (static labels for the services catalog
// directory, vertical landings, and service detail surfaces). Dynamic, DB-sourced
// vertical/service names render through resolveLocalizedDynamicField (Pattern B),
// NOT this module. EN is the exhaustive baseline; every other locale is a
// DeepPartial deep-merged onto EN, so a missing key falls back to EN at runtime.

import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

export type ServicesCopy = {
  directory: {
    titleTemplate: string; // "Services — {division}"
    description: string;
    eyebrow: string;
    title: string;
    body: string;
    linesEyebrow: string;
    exploreCta: string;
    serviceCountOne: string; // "1 service"
    serviceCountOther: string; // "{count} services"
    closingTitle: string;
    closingCta: string;
  };
  vertical: {
    titleTemplate: string; // "{vertical} — {division}"
    backToDirectory: string;
    servicesHeading: string;
    emptyTitle: string;
    emptyBody: string;
    viewService: string;
    fromLabel: string;
    onRequestLabel: string;
  };
  service: {
    titleTemplate: string; // "{service} — {division}"
    breadcrumbServices: string;
    backToVertical: string; // "Back to {vertical}"
    aboutHeading: string;
    detailsHeading: string;
    durationLabel: string;
    minutesUnit: string;
    hoursUnit: string;
    priceLabel: string;
    fromLabel: string;
    onRequestLabel: string;
    providersHeading: string;
    providersComingSoon: string;
    providerSuppliedNote: string;
    bookCta: string;
    bookNote: string;
  };
  book: {
    continuingFrom: string;
    continuingService: string; // "You're booking {service}. Choose your options below."
  };
  hubDirectory: {
    metadataTitle: string; // "Services — {brand}"
    metadataDescription: string;
    title: string;
    exploreCta: string;
  };
};

const SERVICES_COPY_EN: ServicesCopy = {
  directory: {
    titleTemplate: "Services — {division}",
    description:
      "Browse every service line — garment care, laundry, home and office cleaning, repairs, errands, moving, and more — and book the one you need.",
    eyebrow: "The services catalogue",
    title: "Every service, in one place.",
    body: "Explore every service line and start a booking.",
    linesEyebrow: "Service lines",
    exploreCta: "Explore",
    serviceCountOne: "1 service",
    serviceCountOther: "{count} services",
    closingTitle: "Book the service you need.",
    closingCta: "Book a service",
  },
  vertical: {
    titleTemplate: "{vertical} — {division}",
    backToDirectory: "All services",
    servicesHeading: "Services in this line",
    emptyTitle: "More services are on the way",
    emptyBody:
      "We're expanding this service line. Check back soon, or explore the other lines in the catalogue.",
    viewService: "View service",
    fromLabel: "Est. from",
    onRequestLabel: "On request",
  },
  service: {
    titleTemplate: "{service} — {division}",
    breadcrumbServices: "Services",
    backToVertical: "Back to {vertical}",
    aboutHeading: "About this service",
    detailsHeading: "Service details",
    durationLabel: "Typical duration",
    minutesUnit: "min",
    hoursUnit: "hr",
    priceLabel: "Estimated price",
    fromLabel: "from",
    onRequestLabel: "Price on request",
    providersHeading: "Providers",
    providersComingSoon: "Providers coming soon",
    providerSuppliedNote: "This service is delivered by a specialist provider.",
    bookCta: "Book this service",
    bookNote: "You'll continue to the booking form to confirm the details.",
  },
  book: {
    continuingFrom: "Continuing from the catalogue",
    continuingService: "You're booking {service}. Choose your options below.",
  },
  hubDirectory: {
    metadataTitle: "Services — {brand}",
    metadataDescription:
      "Explore the services Henry Onyx delivers — garment care, laundry, cleaning, repairs, errands, moving, and more — and start where you need to.",
    title: "Services for home, work, and everything between.",
    exploreCta: "View line",
  },
};

const SERVICES_COPY_FR: DeepPartial<ServicesCopy> = {
  "directory": {
    "titleTemplate": "Services — {division}",
    "description": "Parcourez toutes les lignes de service — entretien du linge, blanchisserie, nettoyage à domicile et au bureau, réparations, courses, déménagement et plus encore — et réservez celle qu'il vous faut.",
    "eyebrow": "Le catalogue des services",
    "title": "Tous les services, en un seul endroit.",
    "linesEyebrow": "Lignes de service",
    "exploreCta": "Explorer",
    "serviceCountOne": "1 service",
    "serviceCountOther": "{count} services",
    "closingCta": "Réserver un service"
  },
  "vertical": {
    "titleTemplate": "{vertical} — {division}",
    "backToDirectory": "Tous les services",
    "servicesHeading": "Services de cette ligne",
    "emptyTitle": "D'autres services arrivent bientôt",
    "emptyBody": "Nous développons cette ligne de service. Revenez bientôt, ou explorez les autres lignes du catalogue.",
    "viewService": "Voir le service",
    "onRequestLabel": "Sur demande"
  },
  "service": {
    "titleTemplate": "{service} — {division}",
    "breadcrumbServices": "Services",
    "backToVertical": "Retour à {vertical}",
    "aboutHeading": "À propos de ce service",
    "detailsHeading": "Détails du service",
    "durationLabel": "Durée habituelle",
    "minutesUnit": "min",
    "hoursUnit": "h",
    "fromLabel": "à partir de",
    "onRequestLabel": "Prix sur demande",
    "providersHeading": "Prestataires",
    "bookCta": "Réserver ce service",
    "bookNote": "Vous serez dirigé vers le formulaire de réservation pour confirmer les détails."
  },
  "book": {
    "continuingFrom": "Suite du catalogue",
    "continuingService": "Vous réservez {service}. Choisissez vos options ci-dessous."
  },
  "hubDirectory": {
    "metadataTitle": "Services — {brand}",
    "metadataDescription": "Découvrez les services proposés par Henry Onyx — entretien du linge, blanchisserie, nettoyage, réparations, courses, déménagement et plus encore — et commencez là où vous en avez besoin.",
    "title": "Des services pour la maison, le travail et tout ce qui se trouve entre les deux.",
    "exploreCta": "Voir la ligne"
  }
};

const SERVICES_COPY_IG: DeepPartial<ServicesCopy> = {
  "directory": {
    "titleTemplate": "Ọrụ — {division}",
    "description": "Chọgharịa ahịrị ọrụ ọ bụla — nlekọta uwe, ịsa ákwà, mmecharị ụlọ na ụlọ ọrụ, nrụzi, ozi, mbufe ngwongwo, na ndị ọzọ — wee debe nke ịchọrọ.",
    "eyebrow": "Katalọgụ ọrụ",
    "title": "Ọrụ ọ bụla, n'otu ebe.",
    "linesEyebrow": "Ahịrị ọrụ",
    "exploreCta": "Chọgharịa",
    "serviceCountOne": "Ọrụ 1",
    "serviceCountOther": "Ọrụ {count}",
    "closingCta": "Debe ọrụ"
  },
  "vertical": {
    "titleTemplate": "{vertical} — {division}",
    "backToDirectory": "Ọrụ niile",
    "servicesHeading": "Ọrụ dị n'ahịrị a",
    "emptyTitle": "Ọrụ ndị ọzọ na-abịa",
    "emptyBody": "Anyị na-agbasa ahịrị ọrụ a. Lọghachi n'oge na-adịghị anya, ma ọ bụ chọgharịa ahịrị ndị ọzọ dị na katalọgụ.",
    "viewService": "Lee ọrụ",
    "onRequestLabel": "Na arịrịọ"
  },
  "service": {
    "titleTemplate": "{service} — {division}",
    "breadcrumbServices": "Ọrụ",
    "backToVertical": "Laghachi na {vertical}",
    "aboutHeading": "Banyere ọrụ a",
    "detailsHeading": "Nkọwa ọrụ",
    "durationLabel": "Ogologo oge a na-ahụkarị",
    "minutesUnit": "nkeji",
    "hoursUnit": "awa",
    "fromLabel": "site na",
    "onRequestLabel": "Ọnụ ahịa na arịrịọ",
    "providersHeading": "Ndị na-enye ọrụ",
    "bookCta": "Debe ọrụ a",
    "bookNote": "Ị ga-aga n'ihu na fọm ndebe oge iji kwado nkọwa ndị ahụ."
  },
  "book": {
    "continuingFrom": "Na-aga n'ihu site na katalọgụ",
    "continuingService": "Ị na-edebe {service}. Họrọ nhọrọ gị n'okpuru."
  },
  "hubDirectory": {
    "metadataTitle": "Ọrụ — {brand}",
    "metadataDescription": "Chọgharịa ọrụ Henry Onyx na-eweta — nlekọta uwe, ịsa ákwà, mmecharị, nrụzi, ozi, mbufe ngwongwo, na ndị ọzọ — wee malite ebe ịchọrọ.",
    "title": "Ọrụ maka ụlọ, ọrụ, na ihe niile dị n'etiti.",
    "exploreCta": "Lee ahịrị"
  }
};

const SERVICES_COPY_YO: DeepPartial<ServicesCopy> = {
  "directory": {
    "titleTemplate": "Àwọn iṣẹ́ — {division}",
    "description": "Ṣàwárí gbogbo ìlà iṣẹ́ — ìtọ́jú aṣọ, ìfọṣọ, ìmọ́tótó ilé àti ọ́fíìsì, àtúnṣe, iṣẹ́ ránṣẹ́, gbígbé ẹrù, àti bẹ́ẹ̀ bẹ́ẹ̀ lọ — kí o sì gba èyí tí o nílò.",
    "eyebrow": "Àkójọ àwọn iṣẹ́",
    "title": "Gbogbo iṣẹ́, ní ibi kan.",
    "linesEyebrow": "Àwọn ìlà iṣẹ́",
    "exploreCta": "Ṣàwárí",
    "serviceCountOne": "iṣẹ́ 1",
    "serviceCountOther": "iṣẹ́ {count}",
    "closingCta": "Ṣe ìfìṣẹ̀dà iṣẹ́"
  },
  "vertical": {
    "titleTemplate": "{vertical} — {division}",
    "backToDirectory": "Gbogbo iṣẹ́",
    "servicesHeading": "Àwọn iṣẹ́ nínú ìlà yìí",
    "emptyTitle": "Àwọn iṣẹ́ mìíràn ń bọ̀",
    "emptyBody": "À ń mú ìlà iṣẹ́ yìí gbòòrò sí i. Pa dà wá láìpẹ́, tàbí ṣàwárí àwọn ìlà mìíràn nínú àkójọ náà.",
    "viewService": "Wo iṣẹ́",
    "onRequestLabel": "Lórí ìbéèrè"
  },
  "service": {
    "titleTemplate": "{service} — {division}",
    "breadcrumbServices": "Àwọn iṣẹ́",
    "backToVertical": "Pa dà sí {vertical}",
    "aboutHeading": "Nípa iṣẹ́ yìí",
    "detailsHeading": "Àwọn àlàyé iṣẹ́",
    "durationLabel": "Àkókò tó wọ́pọ̀",
    "minutesUnit": "ìṣẹ́j",
    "hoursUnit": "wákàtí",
    "fromLabel": "láti",
    "onRequestLabel": "Iye lórí ìbéèrè",
    "providersHeading": "Àwọn olùpèsè",
    "bookCta": "Ṣe ìfìṣẹ̀dà iṣẹ́ yìí",
    "bookNote": "Wàá tẹ̀ síwájú sí fọ́ọ̀mù ìfìṣẹ̀dà láti fìdí àwọn àlàyé múlẹ̀."
  },
  "book": {
    "continuingFrom": "Ń tẹ̀síwájú láti inú àkójọ",
    "continuingService": "O ń ṣe ìfìṣẹ̀dà {service}. Yan àwọn àṣàyàn rẹ nísàlẹ̀."
  },
  "hubDirectory": {
    "metadataTitle": "Àwọn iṣẹ́ — {brand}",
    "metadataDescription": "Ṣàwárí àwọn iṣẹ́ tí Henry Onyx ń ṣe — ìtọ́jú aṣọ, ìfọṣọ, ìmọ́tótó, àtúnṣe, iṣẹ́ ránṣẹ́, gbígbé ẹrù, àti bẹ́ẹ̀ bẹ́ẹ̀ lọ — kí o sì bẹ̀rẹ̀ níbi tí o nílò.",
    "title": "Àwọn iṣẹ́ fún ilé, iṣẹ́, àti ohun gbogbo tí ó wà láàrin.",
    "exploreCta": "Wo ìlà"
  }
};

const SERVICES_COPY_HA: DeepPartial<ServicesCopy> = {
  "directory": {
    "titleTemplate": "Ayyuka — {division}",
    "description": "Bincika kowane layin aiki — kula da tufafi, wanki, tsaftace gida da ofis, gyare-gyare, aikawa, ƙaura, da ƙari — sannan ka yi rijistar wanda kake bukata.",
    "eyebrow": "Jerin ayyuka",
    "title": "Kowane aiki, a wuri ɗaya.",
    "linesEyebrow": "Layukan aiki",
    "exploreCta": "Bincika",
    "serviceCountOne": "Aiki 1",
    "serviceCountOther": "Ayyuka {count}",
    "closingCta": "Yi rijistar aiki"
  },
  "vertical": {
    "titleTemplate": "{vertical} — {division}",
    "backToDirectory": "Dukan ayyuka",
    "servicesHeading": "Ayyuka a wannan layin",
    "emptyTitle": "Ƙarin ayyuka suna zuwa",
    "emptyBody": "Muna faɗaɗa wannan layin aiki. Ka sake dubawa nan ba da daɗewa ba, ko ka bincika sauran layukan a jerin.",
    "viewService": "Duba aiki",
    "onRequestLabel": "Bisa buƙata"
  },
  "service": {
    "titleTemplate": "{service} — {division}",
    "breadcrumbServices": "Ayyuka",
    "backToVertical": "Koma zuwa {vertical}",
    "aboutHeading": "Game da wannan aiki",
    "detailsHeading": "Bayanan aiki",
    "durationLabel": "Tsawon lokaci na yau da kullum",
    "minutesUnit": "min",
    "hoursUnit": "awa",
    "fromLabel": "daga",
    "onRequestLabel": "Farashi bisa buƙata",
    "providersHeading": "Masu bayarwa",
    "bookCta": "Yi rijistar wannan aiki",
    "bookNote": "Za ka ci gaba zuwa fom ɗin rijista don tabbatar da bayanan."
  },
  "book": {
    "continuingFrom": "Ci gaba daga jerin ayyuka",
    "continuingService": "Kana rijistar {service}. Zaɓi zaɓuɓɓukanka a ƙasa."
  },
  "hubDirectory": {
    "metadataTitle": "Ayyuka — {brand}",
    "metadataDescription": "Bincika ayyukan da Henry Onyx ke bayarwa — kula da tufafi, wanki, tsaftacewa, gyare-gyare, aikawa, ƙaura, da ƙari — sannan ka fara inda kake bukata.",
    "title": "Ayyuka don gida, aiki, da duk abin da ke tsakanin.",
    "exploreCta": "Duba layi"
  }
};

const SERVICES_COPY_AR: DeepPartial<ServicesCopy> = {
  "directory": {
    "titleTemplate": "الخدمات — {division}",
    "description": "تصفّح كل خطوط الخدمة — العناية بالملابس، الغسيل، تنظيف المنازل والمكاتب، الإصلاحات، المهام، النقل، والمزيد — واحجز ما تحتاجه.",
    "eyebrow": "كتالوج الخدمات",
    "title": "كل الخدمات في مكان واحد.",
    "linesEyebrow": "خطوط الخدمة",
    "exploreCta": "استكشف",
    "serviceCountOne": "خدمة واحدة",
    "serviceCountOther": "{count} خدمة",
    "closingCta": "احجز خدمة"
  },
  "vertical": {
    "titleTemplate": "{vertical} — {division}",
    "backToDirectory": "كل الخدمات",
    "servicesHeading": "خدمات هذا الخط",
    "emptyTitle": "المزيد من الخدمات في الطريق",
    "emptyBody": "نعمل على توسيع خط الخدمة هذا. عُد قريبًا، أو استكشف الخطوط الأخرى في الكتالوج.",
    "viewService": "عرض الخدمة",
    "onRequestLabel": "عند الطلب"
  },
  "service": {
    "titleTemplate": "{service} — {division}",
    "breadcrumbServices": "الخدمات",
    "backToVertical": "العودة إلى {vertical}",
    "aboutHeading": "عن هذه الخدمة",
    "detailsHeading": "تفاصيل الخدمة",
    "durationLabel": "المدة المعتادة",
    "minutesUnit": "د",
    "hoursUnit": "س",
    "fromLabel": "من",
    "onRequestLabel": "السعر عند الطلب",
    "providersHeading": "المزوّدون",
    "bookCta": "احجز هذه الخدمة",
    "bookNote": "ستتابع إلى نموذج الحجز لتأكيد التفاصيل."
  },
  "book": {
    "continuingFrom": "متابعةً من الكتالوج",
    "continuingService": "أنت تحجز {service}. اختر خياراتك أدناه."
  },
  "hubDirectory": {
    "metadataTitle": "الخدمات — {brand}",
    "metadataDescription": "استكشف الخدمات التي تقدّمها Henry Onyx — العناية بالملابس، الغسيل، التنظيف، الإصلاحات، المهام، النقل، والمزيد — وابدأ من حيث تحتاج.",
    "title": "خدمات للمنزل والعمل وكل ما بينهما.",
    "exploreCta": "عرض الخط"
  }
};

const SERVICES_COPY_ES: DeepPartial<ServicesCopy> = {
  "directory": {
    "titleTemplate": "Servicios — {division}",
    "description": "Explora todas las líneas de servicio — cuidado de prendas, lavandería, limpieza de hogar y oficina, reparaciones, gestiones, mudanzas y más — y reserva la que necesites.",
    "eyebrow": "El catálogo de servicios",
    "title": "Todos los servicios, en un solo lugar.",
    "linesEyebrow": "Líneas de servicio",
    "exploreCta": "Explorar",
    "serviceCountOne": "1 servicio",
    "serviceCountOther": "{count} servicios",
    "closingCta": "Reservar un servicio"
  },
  "vertical": {
    "titleTemplate": "{vertical} — {division}",
    "backToDirectory": "Todos los servicios",
    "servicesHeading": "Servicios de esta línea",
    "emptyTitle": "Pronto habrá más servicios",
    "emptyBody": "Estamos ampliando esta línea de servicio. Vuelve pronto o explora las demás líneas del catálogo.",
    "viewService": "Ver servicio",
    "onRequestLabel": "Bajo solicitud"
  },
  "service": {
    "titleTemplate": "{service} — {division}",
    "breadcrumbServices": "Servicios",
    "backToVertical": "Volver a {vertical}",
    "aboutHeading": "Acerca de este servicio",
    "detailsHeading": "Detalles del servicio",
    "durationLabel": "Duración habitual",
    "minutesUnit": "min",
    "hoursUnit": "h",
    "fromLabel": "desde",
    "onRequestLabel": "Precio bajo solicitud",
    "providersHeading": "Proveedores",
    "bookCta": "Reservar este servicio",
    "bookNote": "Continuarás al formulario de reserva para confirmar los detalles."
  },
  "book": {
    "continuingFrom": "Continuando desde el catálogo",
    "continuingService": "Estás reservando {service}. Elige tus opciones a continuación."
  },
  "hubDirectory": {
    "metadataTitle": "Servicios — {brand}",
    "metadataDescription": "Explora los servicios que ofrece Henry Onyx — cuidado de prendas, lavandería, limpieza, reparaciones, gestiones, mudanzas y más — y empieza por donde lo necesites.",
    "title": "Servicios para el hogar, el trabajo y todo lo demás.",
    "exploreCta": "Ver línea"
  }
};

const SERVICES_COPY_PT: DeepPartial<ServicesCopy> = {
  "directory": {
    "titleTemplate": "Serviços — {division}",
    "description": "Explore todas as linhas de serviço — cuidado de roupas, lavandaria, limpeza de casa e escritório, reparos, recados, mudanças e mais — e agende o que precisa.",
    "eyebrow": "O catálogo de serviços",
    "title": "Todos os serviços, num só lugar.",
    "linesEyebrow": "Linhas de serviço",
    "exploreCta": "Explorar",
    "serviceCountOne": "1 serviço",
    "serviceCountOther": "{count} serviços",
    "closingCta": "Agendar um serviço"
  },
  "vertical": {
    "titleTemplate": "{vertical} — {division}",
    "backToDirectory": "Todos os serviços",
    "servicesHeading": "Serviços nesta linha",
    "emptyTitle": "Mais serviços a caminho",
    "emptyBody": "Estamos a expandir esta linha de serviço. Volte em breve ou explore as outras linhas do catálogo.",
    "viewService": "Ver serviço",
    "onRequestLabel": "Sob consulta"
  },
  "service": {
    "titleTemplate": "{service} — {division}",
    "breadcrumbServices": "Serviços",
    "backToVertical": "Voltar a {vertical}",
    "aboutHeading": "Sobre este serviço",
    "detailsHeading": "Detalhes do serviço",
    "durationLabel": "Duração típica",
    "minutesUnit": "min",
    "hoursUnit": "h",
    "fromLabel": "a partir de",
    "onRequestLabel": "Preço sob consulta",
    "providersHeading": "Prestadores",
    "bookCta": "Agendar este serviço",
    "bookNote": "Você prosseguirá para o formulário de reserva para confirmar os detalhes."
  },
  "book": {
    "continuingFrom": "Continuando a partir do catálogo",
    "continuingService": "Você está a agendar {service}. Escolha as suas opções abaixo."
  },
  "hubDirectory": {
    "metadataTitle": "Serviços — {brand}",
    "metadataDescription": "Explore os serviços que a Henry Onyx oferece — cuidado de roupas, lavandaria, limpeza, reparos, recados, mudanças e mais — e comece por onde precisar.",
    "title": "Serviços para casa, trabalho e tudo o que está no meio.",
    "exploreCta": "Ver linha"
  }
};

const SERVICES_COPY_DE: DeepPartial<ServicesCopy> = {
  "directory": {
    "titleTemplate": "Leistungen — {division}",
    "description": "Durchstöbern Sie alle Leistungsbereiche — Textilpflege, Wäscheservice, Reinigung von Wohnung und Büro, Reparaturen, Besorgungen, Umzüge und mehr — und buchen Sie die passende.",
    "eyebrow": "Der Leistungskatalog",
    "title": "Alle Leistungen an einem Ort.",
    "linesEyebrow": "Leistungsbereiche",
    "exploreCta": "Entdecken",
    "serviceCountOne": "1 Leistung",
    "serviceCountOther": "{count} Leistungen",
    "closingCta": "Leistung buchen"
  },
  "vertical": {
    "titleTemplate": "{vertical} — {division}",
    "backToDirectory": "Alle Leistungen",
    "servicesHeading": "Leistungen in diesem Bereich",
    "emptyTitle": "Weitere Leistungen folgen in Kürze",
    "emptyBody": "Wir bauen diesen Leistungsbereich aus. Schauen Sie bald wieder vorbei oder entdecken Sie die anderen Bereiche im Katalog.",
    "viewService": "Leistung ansehen",
    "onRequestLabel": "Auf Anfrage"
  },
  "service": {
    "titleTemplate": "{service} — {division}",
    "breadcrumbServices": "Leistungen",
    "backToVertical": "Zurück zu {vertical}",
    "aboutHeading": "Über diese Leistung",
    "detailsHeading": "Leistungsdetails",
    "durationLabel": "Übliche Dauer",
    "minutesUnit": "Min.",
    "hoursUnit": "Std.",
    "fromLabel": "ab",
    "onRequestLabel": "Preis auf Anfrage",
    "providersHeading": "Anbieter",
    "bookCta": "Diese Leistung buchen",
    "bookNote": "Sie gelangen zum Buchungsformular, um die Details zu bestätigen."
  },
  "book": {
    "continuingFrom": "Weiter aus dem Katalog",
    "continuingService": "Sie buchen {service}. Wählen Sie unten Ihre Optionen."
  },
  "hubDirectory": {
    "metadataTitle": "Leistungen — {brand}",
    "metadataDescription": "Entdecken Sie die Leistungen von Henry Onyx — Textilpflege, Wäscheservice, Reinigung, Reparaturen, Besorgungen, Umzüge und mehr — und beginnen Sie dort, wo Sie es brauchen.",
    "title": "Leistungen für Zuhause, Büro und alles dazwischen.",
    "exploreCta": "Bereich ansehen"
  }
};

const SERVICES_COPY_IT: DeepPartial<ServicesCopy> = {
  "directory": {
    "titleTemplate": "Servizi — {division}",
    "description": "Esplora ogni linea di servizio — cura dei capi, lavanderia, pulizia di casa e ufficio, riparazioni, commissioni, traslochi e altro — e prenota quello che ti serve.",
    "eyebrow": "Il catalogo dei servizi",
    "title": "Ogni servizio, in un solo posto.",
    "linesEyebrow": "Linee di servizio",
    "exploreCta": "Esplora",
    "serviceCountOne": "1 servizio",
    "serviceCountOther": "{count} servizi",
    "closingCta": "Prenota un servizio"
  },
  "vertical": {
    "titleTemplate": "{vertical} — {division}",
    "backToDirectory": "Tutti i servizi",
    "servicesHeading": "Servizi in questa linea",
    "emptyTitle": "Altri servizi sono in arrivo",
    "emptyBody": "Stiamo ampliando questa linea di servizio. Torna a trovarci presto o esplora le altre linee del catalogo.",
    "viewService": "Vedi servizio",
    "onRequestLabel": "Su richiesta"
  },
  "service": {
    "titleTemplate": "{service} — {division}",
    "breadcrumbServices": "Servizi",
    "backToVertical": "Torna a {vertical}",
    "aboutHeading": "Informazioni sul servizio",
    "detailsHeading": "Dettagli del servizio",
    "durationLabel": "Durata tipica",
    "minutesUnit": "min",
    "hoursUnit": "h",
    "fromLabel": "da",
    "onRequestLabel": "Prezzo su richiesta",
    "providersHeading": "Fornitori",
    "bookCta": "Prenota questo servizio",
    "bookNote": "Proseguirai con il modulo di prenotazione per confermare i dettagli."
  },
  "book": {
    "continuingFrom": "Continui dal catalogo",
    "continuingService": "Stai prenotando {service}. Scegli le tue opzioni qui sotto."
  },
  "hubDirectory": {
    "metadataTitle": "Servizi — {brand}",
    "metadataDescription": "Esplora i servizi che Henry Onyx offre — cura dei capi, lavanderia, pulizia, riparazioni, commissioni, traslochi e altro — e inizia da dove ti serve.",
    "title": "Servizi per la casa, il lavoro e tutto ciò che sta nel mezzo.",
    "exploreCta": "Vedi linea"
  }
};

const SERVICES_COPY_ZH: DeepPartial<ServicesCopy> = {
  "directory": {
    "titleTemplate": "服务 — {division}",
    "description": "浏览全部服务线 — 衣物护理、洗护、家居与办公保洁、维修、跑腿、搬运等等 — 并预约您所需的服务。",
    "eyebrow": "服务目录",
    "title": "所有服务，集于一处。",
    "linesEyebrow": "服务线",
    "exploreCta": "探索",
    "serviceCountOne": "1 项服务",
    "serviceCountOther": "{count} 项服务",
    "closingCta": "预约服务"
  },
  "vertical": {
    "titleTemplate": "{vertical} — {division}",
    "backToDirectory": "全部服务",
    "servicesHeading": "此服务线下的服务",
    "emptyTitle": "更多服务即将上线",
    "emptyBody": "我们正在扩展这条服务线。请稍后再来查看，或浏览目录中的其他服务线。",
    "viewService": "查看服务",
    "onRequestLabel": "按需报价"
  },
  "service": {
    "titleTemplate": "{service} — {division}",
    "breadcrumbServices": "服务",
    "backToVertical": "返回 {vertical}",
    "aboutHeading": "关于此服务",
    "detailsHeading": "服务详情",
    "durationLabel": "通常时长",
    "minutesUnit": "分钟",
    "hoursUnit": "小时",
    "fromLabel": "起",
    "onRequestLabel": "价格按需报价",
    "providersHeading": "服务方",
    "bookCta": "预约此服务",
    "bookNote": "您将继续填写预约表单以确认详情。"
  },
  "book": {
    "continuingFrom": "从目录继续",
    "continuingService": "您正在预约 {service}。请在下方选择您的选项。"
  },
  "hubDirectory": {
    "metadataTitle": "服务 — {brand}",
    "metadataDescription": "探索 Henry Onyx 提供的服务 — 衣物护理、洗护、保洁、维修、跑腿、搬运等等 — 从您需要的地方开始。",
    "title": "服务于家居、办公及两者之间的一切。",
    "exploreCta": "查看服务线"
  }
};

const SERVICES_COPY_HI: DeepPartial<ServicesCopy> = {
  "directory": {
    "titleTemplate": "सेवाएँ — {division}",
    "description": "हर सेवा श्रेणी देखें — वस्त्र देखभाल, धुलाई, घर और कार्यालय की सफाई, मरम्मत, छोटे काम, सामान स्थानांतरण, और बहुत कुछ — और जो आपको चाहिए उसे बुक करें।",
    "eyebrow": "सेवा सूची",
    "title": "हर सेवा, एक ही जगह।",
    "linesEyebrow": "सेवा श्रेणियाँ",
    "exploreCta": "देखें",
    "serviceCountOne": "1 सेवा",
    "serviceCountOther": "{count} सेवाएँ",
    "closingCta": "सेवा बुक करें"
  },
  "vertical": {
    "titleTemplate": "{vertical} — {division}",
    "backToDirectory": "सभी सेवाएँ",
    "servicesHeading": "इस श्रेणी की सेवाएँ",
    "emptyTitle": "और सेवाएँ जल्द आ रही हैं",
    "emptyBody": "हम इस सेवा श्रेणी का विस्तार कर रहे हैं। जल्द फिर देखें, या सूची की दूसरी श्रेणियाँ देखें।",
    "viewService": "सेवा देखें",
    "onRequestLabel": "अनुरोध पर"
  },
  "service": {
    "titleTemplate": "{service} — {division}",
    "breadcrumbServices": "सेवाएँ",
    "backToVertical": "{vertical} पर वापस जाएँ",
    "aboutHeading": "इस सेवा के बारे में",
    "detailsHeading": "सेवा विवरण",
    "durationLabel": "सामान्य अवधि",
    "minutesUnit": "मि",
    "hoursUnit": "घं",
    "fromLabel": "से",
    "onRequestLabel": "मूल्य अनुरोध पर",
    "providersHeading": "प्रदाता",
    "bookCta": "यह सेवा बुक करें",
    "bookNote": "विवरण की पुष्टि के लिए आप बुकिंग फ़ॉर्म पर आगे बढ़ेंगे।"
  },
  "book": {
    "continuingFrom": "सूची से आगे बढ़ रहे हैं",
    "continuingService": "आप {service} बुक कर रहे हैं। नीचे अपने विकल्प चुनें।"
  },
  "hubDirectory": {
    "metadataTitle": "सेवाएँ — {brand}",
    "metadataDescription": "Henry Onyx द्वारा दी जाने वाली सेवाएँ देखें — वस्त्र देखभाल, धुलाई, सफाई, मरम्मत, छोटे काम, सामान स्थानांतरण, और बहुत कुछ — और जहाँ ज़रूरत हो वहाँ से शुरू करें।",
    "title": "घर, काम और उनके बीच की हर ज़रूरत के लिए सेवाएँ।",
    "exploreCta": "श्रेणी देखें"
  }
};

// Non-EN locale overrides (DeepPartial — missing keys fall back to EN).
// V3-49-I18N: hand-translated (Opus, max effort) across the 11 non-EN locales,
// placeholders ({division}/{vertical}/{service}/{count}/{brand}) preserved verbatim.
const SERVICES_COPY_LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<ServicesCopy>>> = {
  fr: SERVICES_COPY_FR,
  ig: SERVICES_COPY_IG,
  yo: SERVICES_COPY_YO,
  ha: SERVICES_COPY_HA,
  ar: SERVICES_COPY_AR,
  es: SERVICES_COPY_ES,
  pt: SERVICES_COPY_PT,
  de: SERVICES_COPY_DE,
  it: SERVICES_COPY_IT,
  zh: SERVICES_COPY_ZH,
  hi: SERVICES_COPY_HI,
};

export function getServicesCopy(locale: AppLocale): ServicesCopy {
  const overrides = SERVICES_COPY_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      SERVICES_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as ServicesCopy;
  }
  return SERVICES_COPY_EN;
}
