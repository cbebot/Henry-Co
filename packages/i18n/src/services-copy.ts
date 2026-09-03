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
    closingEyebrow: string;
    closingTitle: string;
    closingBody: string;
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
    eyebrow: string;
    title: string;
    body: string;
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
    body: "Henry Onyx Fabric Care has grown beyond cleaning. Explore the full set of service lines, see what each one covers, and start a booking when you're ready.",
    linesEyebrow: "Service lines",
    exploreCta: "Explore",
    serviceCountOne: "1 service",
    serviceCountOther: "{count} services",
    closingEyebrow: "Ready when you are",
    closingTitle: "Find the service you need and book it in one calm form.",
    closingBody:
      "Choose a service line, review what's included, and continue to a single booking form with clear estimates and dependable timing.",
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
    fromLabel: "from",
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
    priceLabel: "Price",
    fromLabel: "from",
    onRequestLabel: "Price on request",
    providersHeading: "Providers",
    providersComingSoon: "Verified providers coming soon",
    providerSuppliedNote: "This service is delivered by a verified provider.",
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
    eyebrow: "Across Henry Onyx",
    title: "Services for home, work, and everything between.",
    body: "One catalogue of dependable services, delivered with clear booking and polished follow-through. Choose a line to see what it covers.",
    exploreCta: "View line",
  },
};

const SERVICES_COPY_FR: DeepPartial<ServicesCopy> = {
  "directory": {
    "titleTemplate": "Services — {division}",
    "description": "Parcourez toutes les lignes de service — entretien du linge, blanchisserie, nettoyage à domicile et au bureau, réparations, courses, déménagement et plus encore — et réservez celle qu'il vous faut.",
    "eyebrow": "Le catalogue des services",
    "title": "Tous les services, en un seul endroit.",
    "body": "Henry Onyx Fabric Care ne se limite plus au nettoyage. Explorez l'ensemble des lignes de service, découvrez ce que chacune couvre et lancez une réservation dès que vous êtes prêt.",
    "linesEyebrow": "Lignes de service",
    "exploreCta": "Explorer",
    "serviceCountOne": "1 service",
    "serviceCountOther": "{count} services",
    "closingEyebrow": "Prêt quand vous l'êtes",
    "closingTitle": "Trouvez le service qu'il vous faut et réservez-le en un seul formulaire serein.",
    "closingBody": "Choisissez une ligne de service, vérifiez ce qui est inclus, puis poursuivez vers un formulaire de réservation unique, avec des estimations claires et des délais fiables.",
    "closingCta": "Réserver un service"
  },
  "vertical": {
    "titleTemplate": "{vertical} — {division}",
    "backToDirectory": "Tous les services",
    "servicesHeading": "Services de cette ligne",
    "emptyTitle": "D'autres services arrivent bientôt",
    "emptyBody": "Nous développons cette ligne de service. Revenez bientôt, ou explorez les autres lignes du catalogue.",
    "viewService": "Voir le service",
    "fromLabel": "à partir de",
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
    "priceLabel": "Prix",
    "fromLabel": "à partir de",
    "onRequestLabel": "Prix sur demande",
    "providersHeading": "Prestataires",
    "providersComingSoon": "Prestataires vérifiés bientôt disponibles",
    "providerSuppliedNote": "Ce service est assuré par un prestataire vérifié.",
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
    "eyebrow": "Dans tout l'univers Henry Onyx",
    "title": "Des services pour la maison, le travail et tout ce qui se trouve entre les deux.",
    "body": "Un seul catalogue de services fiables, assurés avec une réservation claire et un suivi soigné. Choisissez une ligne pour voir ce qu'elle couvre.",
    "exploreCta": "Voir la ligne"
  }
};

const SERVICES_COPY_IG: DeepPartial<ServicesCopy> = {
  "directory": {
    "titleTemplate": "Ọrụ — {division}",
    "description": "Chọgharịa ahịrị ọrụ ọ bụla — nlekọta uwe, ịsa ákwà, mmecharị ụlọ na ụlọ ọrụ, nrụzi, ozi, mbufe ngwongwo, na ndị ọzọ — wee debe nke ịchọrọ.",
    "eyebrow": "Katalọgụ ọrụ",
    "title": "Ọrụ ọ bụla, n'otu ebe.",
    "body": "Henry Onyx Fabric Care etoola karịa mmecharị. Chọgharịa ahịrị ọrụ niile, hụ ihe nke ọ bụla na-ekpuchi, wee malite ndebe oge mgbe ị dị njikere.",
    "linesEyebrow": "Ahịrị ọrụ",
    "exploreCta": "Chọgharịa",
    "serviceCountOne": "Ọrụ 1",
    "serviceCountOther": "Ọrụ {count}",
    "closingEyebrow": "Njikere mgbe ọ bụla ị dị njikere",
    "closingTitle": "Chọta ọrụ ịchọrọ wee debe ya n'otu fọm dị jụụ.",
    "closingBody": "Họrọ ahịrị ọrụ, lelee ihe so na ya, wee gaa n'ihu na otu fọm ndebe oge nwere atụmatụ doro anya na oge a pụrụ ịtụkwasị obi.",
    "closingCta": "Debe ọrụ"
  },
  "vertical": {
    "titleTemplate": "{vertical} — {division}",
    "backToDirectory": "Ọrụ niile",
    "servicesHeading": "Ọrụ dị n'ahịrị a",
    "emptyTitle": "Ọrụ ndị ọzọ na-abịa",
    "emptyBody": "Anyị na-agbasa ahịrị ọrụ a. Lọghachi n'oge na-adịghị anya, ma ọ bụ chọgharịa ahịrị ndị ọzọ dị na katalọgụ.",
    "viewService": "Lee ọrụ",
    "fromLabel": "site na",
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
    "priceLabel": "Ọnụ ahịa",
    "fromLabel": "site na",
    "onRequestLabel": "Ọnụ ahịa na arịrịọ",
    "providersHeading": "Ndị na-enye ọrụ",
    "providersComingSoon": "Ndị na-enye ọrụ nyochara na-abịa n'oge na-adịghị anya",
    "providerSuppliedNote": "Onye na-enye ọrụ a nyochara na-eweta ọrụ a.",
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
    "eyebrow": "Gafee Henry Onyx",
    "title": "Ọrụ maka ụlọ, ọrụ, na ihe niile dị n'etiti.",
    "body": "Otu katalọgụ ọrụ a pụrụ ịtụkwasị obi, nke a na-eweta site na ndebe oge doro anya na nsoso a kpụzigara nke ọma. Họrọ ahịrị ka ị hụ ihe ọ na-ekpuchi.",
    "exploreCta": "Lee ahịrị"
  }
};

const SERVICES_COPY_YO: DeepPartial<ServicesCopy> = {
  "directory": {
    "titleTemplate": "Àwọn iṣẹ́ — {division}",
    "description": "Ṣàwárí gbogbo ìlà iṣẹ́ — ìtọ́jú aṣọ, ìfọṣọ, ìmọ́tótó ilé àti ọ́fíìsì, àtúnṣe, iṣẹ́ ránṣẹ́, gbígbé ẹrù, àti bẹ́ẹ̀ bẹ́ẹ̀ lọ — kí o sì gba èyí tí o nílò.",
    "eyebrow": "Àkójọ àwọn iṣẹ́",
    "title": "Gbogbo iṣẹ́, ní ibi kan.",
    "body": "Henry Onyx Fabric Care ti dàgbà ré kọjá ìmọ́tótó. Ṣàwárí gbogbo ìlà iṣẹ́ náà, wo ohun tí ọ̀kọ̀ọ̀kan ń bò, kí o sì bẹ̀rẹ̀ ìfìṣẹ̀dà nígbà tí o bá ti múra tán.",
    "linesEyebrow": "Àwọn ìlà iṣẹ́",
    "exploreCta": "Ṣàwárí",
    "serviceCountOne": "iṣẹ́ 1",
    "serviceCountOther": "iṣẹ́ {count}",
    "closingEyebrow": "À ti múra sílẹ̀ nígbà tí o bá ṣetán",
    "closingTitle": "Wá iṣẹ́ tí o nílò kí o sì ṣe ìfìṣẹ̀dà rẹ̀ nínú fọ́ọ̀mù tútù kan.",
    "closingBody": "Yan ìlà iṣẹ́ kan, ṣàyẹ̀wò ohun tí ó wà nínú rẹ̀, kí o sì tẹ̀ síwájú sí fọ́ọ̀mù ìfìṣẹ̀dà kan ṣoṣo pẹ̀lú ìṣirò tó ṣe kedere àti àkókò tí a lè gbáralé.",
    "closingCta": "Ṣe ìfìṣẹ̀dà iṣẹ́"
  },
  "vertical": {
    "titleTemplate": "{vertical} — {division}",
    "backToDirectory": "Gbogbo iṣẹ́",
    "servicesHeading": "Àwọn iṣẹ́ nínú ìlà yìí",
    "emptyTitle": "Àwọn iṣẹ́ mìíràn ń bọ̀",
    "emptyBody": "À ń mú ìlà iṣẹ́ yìí gbòòrò sí i. Pa dà wá láìpẹ́, tàbí ṣàwárí àwọn ìlà mìíràn nínú àkójọ náà.",
    "viewService": "Wo iṣẹ́",
    "fromLabel": "láti",
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
    "priceLabel": "Iye",
    "fromLabel": "láti",
    "onRequestLabel": "Iye lórí ìbéèrè",
    "providersHeading": "Àwọn olùpèsè",
    "providersComingSoon": "Àwọn olùpèsè tí a ti fọwọ́ sí ń bọ̀ láìpẹ́",
    "providerSuppliedNote": "Olùpèsè tí a ti fọwọ́ sí ni ó ń ṣe iṣẹ́ yìí.",
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
    "eyebrow": "Káàkiri Henry Onyx",
    "title": "Àwọn iṣẹ́ fún ilé, iṣẹ́, àti ohun gbogbo tí ó wà láàrin.",
    "body": "Àkójọ kan ṣoṣo ti àwọn iṣẹ́ tí a lè gbáralé, tí a ń ṣe pẹ̀lú ìfìṣẹ̀dà tó ṣe kedere àti àbójútó dáradára. Yan ìlà kan láti wo ohun tí ó ń bò.",
    "exploreCta": "Wo ìlà"
  }
};

const SERVICES_COPY_HA: DeepPartial<ServicesCopy> = {
  "directory": {
    "titleTemplate": "Ayyuka — {division}",
    "description": "Bincika kowane layin aiki — kula da tufafi, wanki, tsaftace gida da ofis, gyare-gyare, aikawa, ƙaura, da ƙari — sannan ka yi rijistar wanda kake bukata.",
    "eyebrow": "Jerin ayyuka",
    "title": "Kowane aiki, a wuri ɗaya.",
    "body": "Henry Onyx Fabric Care ya zarce tsaftacewa kawai. Bincika cikakken jerin layukan aiki, ka ga abin da kowanne ya ƙunsa, sannan ka fara rijista lokacin da ka shirya.",
    "linesEyebrow": "Layukan aiki",
    "exploreCta": "Bincika",
    "serviceCountOne": "Aiki 1",
    "serviceCountOther": "Ayyuka {count}",
    "closingEyebrow": "A shirye sa'ad da kake shirye",
    "closingTitle": "Nemo aikin da kake bukata ka yi rijista a fom ɗaya mai sauƙi.",
    "closingBody": "Zaɓi layin aiki, duba abin da ke ciki, sannan ka ci gaba zuwa fom ɗaya na rijista mai bayyananniyar ƙiyasi da lokaci abin dogaro.",
    "closingCta": "Yi rijistar aiki"
  },
  "vertical": {
    "titleTemplate": "{vertical} — {division}",
    "backToDirectory": "Dukan ayyuka",
    "servicesHeading": "Ayyuka a wannan layin",
    "emptyTitle": "Ƙarin ayyuka suna zuwa",
    "emptyBody": "Muna faɗaɗa wannan layin aiki. Ka sake dubawa nan ba da daɗewa ba, ko ka bincika sauran layukan a jerin.",
    "viewService": "Duba aiki",
    "fromLabel": "daga",
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
    "priceLabel": "Farashi",
    "fromLabel": "daga",
    "onRequestLabel": "Farashi bisa buƙata",
    "providersHeading": "Masu bayarwa",
    "providersComingSoon": "Tabbatattun masu bayarwa suna zuwa nan ba da daɗewa ba",
    "providerSuppliedNote": "Tabbataccen mai bayarwa ne ke gudanar da wannan aiki.",
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
    "eyebrow": "Ko'ina cikin Henry Onyx",
    "title": "Ayyuka don gida, aiki, da duk abin da ke tsakanin.",
    "body": "Jeri ɗaya na ayyuka abin dogaro, da ake bayarwa tare da bayyananniyar rijista da kyakkyawan biyan baya. Zaɓi layi don ka ga abin da ya ƙunsa.",
    "exploreCta": "Duba layi"
  }
};

const SERVICES_COPY_AR: DeepPartial<ServicesCopy> = {
  "directory": {
    "titleTemplate": "الخدمات — {division}",
    "description": "تصفّح كل خطوط الخدمة — العناية بالملابس، الغسيل، تنظيف المنازل والمكاتب، الإصلاحات، المهام، النقل، والمزيد — واحجز ما تحتاجه.",
    "eyebrow": "كتالوج الخدمات",
    "title": "كل الخدمات في مكان واحد.",
    "body": "تطوّرت Henry Onyx Fabric Care لتتجاوز التنظيف. استكشف مجموعة خطوط الخدمة كاملةً، واطّلع على ما يشمله كل منها، وابدأ الحجز عندما تكون جاهزًا.",
    "linesEyebrow": "خطوط الخدمة",
    "exploreCta": "استكشف",
    "serviceCountOne": "خدمة واحدة",
    "serviceCountOther": "{count} خدمة",
    "closingEyebrow": "جاهزون متى شئت",
    "closingTitle": "اعثر على الخدمة التي تحتاجها واحجزها عبر نموذج واحد بسيط.",
    "closingBody": "اختر خط خدمة، وراجع ما يتضمنه، وتابع إلى نموذج حجز واحد بتقديرات واضحة ومواعيد موثوقة.",
    "closingCta": "احجز خدمة"
  },
  "vertical": {
    "titleTemplate": "{vertical} — {division}",
    "backToDirectory": "كل الخدمات",
    "servicesHeading": "خدمات هذا الخط",
    "emptyTitle": "المزيد من الخدمات في الطريق",
    "emptyBody": "نعمل على توسيع خط الخدمة هذا. عُد قريبًا، أو استكشف الخطوط الأخرى في الكتالوج.",
    "viewService": "عرض الخدمة",
    "fromLabel": "من",
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
    "priceLabel": "السعر",
    "fromLabel": "من",
    "onRequestLabel": "السعر عند الطلب",
    "providersHeading": "المزوّدون",
    "providersComingSoon": "مزوّدون موثّقون قريبًا",
    "providerSuppliedNote": "تُقدَّم هذه الخدمة عبر مزوّد موثّق.",
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
    "eyebrow": "عبر Henry Onyx",
    "title": "خدمات للمنزل والعمل وكل ما بينهما.",
    "body": "كتالوج واحد من الخدمات الموثوقة، يُقدَّم بحجز واضح ومتابعة متقنة. اختر خطًا لترى ما يشمله.",
    "exploreCta": "عرض الخط"
  }
};

const SERVICES_COPY_ES: DeepPartial<ServicesCopy> = {
  "directory": {
    "titleTemplate": "Servicios — {division}",
    "description": "Explora todas las líneas de servicio — cuidado de prendas, lavandería, limpieza de hogar y oficina, reparaciones, gestiones, mudanzas y más — y reserva la que necesites.",
    "eyebrow": "El catálogo de servicios",
    "title": "Todos los servicios, en un solo lugar.",
    "body": "Henry Onyx Fabric Care ha crecido más allá de la limpieza. Explora el conjunto completo de líneas de servicio, descubre qué cubre cada una y empieza una reserva cuando estés listo.",
    "linesEyebrow": "Líneas de servicio",
    "exploreCta": "Explorar",
    "serviceCountOne": "1 servicio",
    "serviceCountOther": "{count} servicios",
    "closingEyebrow": "Listos cuando tú lo estés",
    "closingTitle": "Encuentra el servicio que necesitas y resérvalo en un solo formulario, con calma.",
    "closingBody": "Elige una línea de servicio, revisa qué incluye y continúa a un único formulario de reserva con estimaciones claras y tiempos fiables.",
    "closingCta": "Reservar un servicio"
  },
  "vertical": {
    "titleTemplate": "{vertical} — {division}",
    "backToDirectory": "Todos los servicios",
    "servicesHeading": "Servicios de esta línea",
    "emptyTitle": "Pronto habrá más servicios",
    "emptyBody": "Estamos ampliando esta línea de servicio. Vuelve pronto o explora las demás líneas del catálogo.",
    "viewService": "Ver servicio",
    "fromLabel": "desde",
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
    "priceLabel": "Precio",
    "fromLabel": "desde",
    "onRequestLabel": "Precio bajo solicitud",
    "providersHeading": "Proveedores",
    "providersComingSoon": "Proveedores verificados muy pronto",
    "providerSuppliedNote": "Este servicio lo presta un proveedor verificado.",
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
    "eyebrow": "En todo Henry Onyx",
    "title": "Servicios para el hogar, el trabajo y todo lo demás.",
    "body": "Un solo catálogo de servicios fiables, con reservas claras y un seguimiento impecable. Elige una línea para ver qué cubre.",
    "exploreCta": "Ver línea"
  }
};

const SERVICES_COPY_PT: DeepPartial<ServicesCopy> = {
  "directory": {
    "titleTemplate": "Serviços — {division}",
    "description": "Explore todas as linhas de serviço — cuidado de roupas, lavandaria, limpeza de casa e escritório, reparos, recados, mudanças e mais — e agende o que precisa.",
    "eyebrow": "O catálogo de serviços",
    "title": "Todos os serviços, num só lugar.",
    "body": "A Henry Onyx Fabric Care cresceu para além da limpeza. Explore o conjunto completo de linhas de serviço, veja o que cada uma cobre e inicie uma reserva quando estiver pronto.",
    "linesEyebrow": "Linhas de serviço",
    "exploreCta": "Explorar",
    "serviceCountOne": "1 serviço",
    "serviceCountOther": "{count} serviços",
    "closingEyebrow": "Prontos quando você estiver",
    "closingTitle": "Encontre o serviço de que precisa e agende-o num único formulário tranquilo.",
    "closingBody": "Escolha uma linha de serviço, reveja o que está incluído e prossiga para um único formulário de reserva com estimativas claras e prazos confiáveis.",
    "closingCta": "Agendar um serviço"
  },
  "vertical": {
    "titleTemplate": "{vertical} — {division}",
    "backToDirectory": "Todos os serviços",
    "servicesHeading": "Serviços nesta linha",
    "emptyTitle": "Mais serviços a caminho",
    "emptyBody": "Estamos a expandir esta linha de serviço. Volte em breve ou explore as outras linhas do catálogo.",
    "viewService": "Ver serviço",
    "fromLabel": "a partir de",
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
    "priceLabel": "Preço",
    "fromLabel": "a partir de",
    "onRequestLabel": "Preço sob consulta",
    "providersHeading": "Prestadores",
    "providersComingSoon": "Prestadores verificados em breve",
    "providerSuppliedNote": "Este serviço é prestado por um prestador verificado.",
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
    "eyebrow": "Em toda a Henry Onyx",
    "title": "Serviços para casa, trabalho e tudo o que está no meio.",
    "body": "Um único catálogo de serviços confiáveis, entregues com reservas claras e um acompanhamento impecável. Escolha uma linha para ver o que ela cobre.",
    "exploreCta": "Ver linha"
  }
};

const SERVICES_COPY_DE: DeepPartial<ServicesCopy> = {
  "directory": {
    "titleTemplate": "Leistungen — {division}",
    "description": "Durchstöbern Sie alle Leistungsbereiche — Textilpflege, Wäscheservice, Reinigung von Wohnung und Büro, Reparaturen, Besorgungen, Umzüge und mehr — und buchen Sie die passende.",
    "eyebrow": "Der Leistungskatalog",
    "title": "Alle Leistungen an einem Ort.",
    "body": "Henry Onyx Fabric Care ist über die Reinigung hinausgewachsen. Entdecken Sie alle Leistungsbereiche, sehen Sie, was jeder umfasst, und starten Sie eine Buchung, sobald Sie bereit sind.",
    "linesEyebrow": "Leistungsbereiche",
    "exploreCta": "Entdecken",
    "serviceCountOne": "1 Leistung",
    "serviceCountOther": "{count} Leistungen",
    "closingEyebrow": "Bereit, wann Sie es sind",
    "closingTitle": "Finden Sie die passende Leistung und buchen Sie sie in einem ruhigen Formular.",
    "closingBody": "Wählen Sie einen Leistungsbereich, prüfen Sie, was enthalten ist, und gelangen Sie zu einem einzigen Buchungsformular mit klaren Schätzungen und verlässlicher Terminierung.",
    "closingCta": "Leistung buchen"
  },
  "vertical": {
    "titleTemplate": "{vertical} — {division}",
    "backToDirectory": "Alle Leistungen",
    "servicesHeading": "Leistungen in diesem Bereich",
    "emptyTitle": "Weitere Leistungen folgen in Kürze",
    "emptyBody": "Wir bauen diesen Leistungsbereich aus. Schauen Sie bald wieder vorbei oder entdecken Sie die anderen Bereiche im Katalog.",
    "viewService": "Leistung ansehen",
    "fromLabel": "ab",
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
    "priceLabel": "Preis",
    "fromLabel": "ab",
    "onRequestLabel": "Preis auf Anfrage",
    "providersHeading": "Anbieter",
    "providersComingSoon": "Verifizierte Anbieter folgen in Kürze",
    "providerSuppliedNote": "Diese Leistung wird von einem verifizierten Anbieter erbracht.",
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
    "eyebrow": "Bei Henry Onyx",
    "title": "Leistungen für Zuhause, Büro und alles dazwischen.",
    "body": "Ein Katalog verlässlicher Leistungen, erbracht mit klarer Buchung und sorgfältiger Begleitung. Wählen Sie einen Bereich, um zu sehen, was er umfasst.",
    "exploreCta": "Bereich ansehen"
  }
};

const SERVICES_COPY_IT: DeepPartial<ServicesCopy> = {
  "directory": {
    "titleTemplate": "Servizi — {division}",
    "description": "Esplora ogni linea di servizio — cura dei capi, lavanderia, pulizia di casa e ufficio, riparazioni, commissioni, traslochi e altro — e prenota quello che ti serve.",
    "eyebrow": "Il catalogo dei servizi",
    "title": "Ogni servizio, in un solo posto.",
    "body": "Henry Onyx Fabric Care è cresciuta oltre la pulizia. Esplora tutte le linee di servizio, scopri cosa copre ciascuna e avvia una prenotazione quando vuoi.",
    "linesEyebrow": "Linee di servizio",
    "exploreCta": "Esplora",
    "serviceCountOne": "1 servizio",
    "serviceCountOther": "{count} servizi",
    "closingEyebrow": "Pronti quando lo sei tu",
    "closingTitle": "Trova il servizio che ti serve e prenotalo con un unico modulo, senza stress.",
    "closingBody": "Scegli una linea di servizio, controlla cosa è incluso e prosegui con un unico modulo di prenotazione, con stime chiare e tempi affidabili.",
    "closingCta": "Prenota un servizio"
  },
  "vertical": {
    "titleTemplate": "{vertical} — {division}",
    "backToDirectory": "Tutti i servizi",
    "servicesHeading": "Servizi in questa linea",
    "emptyTitle": "Altri servizi sono in arrivo",
    "emptyBody": "Stiamo ampliando questa linea di servizio. Torna a trovarci presto o esplora le altre linee del catalogo.",
    "viewService": "Vedi servizio",
    "fromLabel": "da",
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
    "priceLabel": "Prezzo",
    "fromLabel": "da",
    "onRequestLabel": "Prezzo su richiesta",
    "providersHeading": "Fornitori",
    "providersComingSoon": "Fornitori verificati in arrivo",
    "providerSuppliedNote": "Questo servizio è erogato da un fornitore verificato.",
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
    "eyebrow": "In tutta Henry Onyx",
    "title": "Servizi per la casa, il lavoro e tutto ciò che sta nel mezzo.",
    "body": "Un unico catalogo di servizi affidabili, con prenotazione chiara e una gestione curata fino in fondo. Scegli una linea per scoprire cosa copre.",
    "exploreCta": "Vedi linea"
  }
};

const SERVICES_COPY_ZH: DeepPartial<ServicesCopy> = {
  "directory": {
    "titleTemplate": "服务 — {division}",
    "description": "浏览全部服务线 — 衣物护理、洗护、家居与办公保洁、维修、跑腿、搬运等等 — 并预约您所需的服务。",
    "eyebrow": "服务目录",
    "title": "所有服务，集于一处。",
    "body": "Henry Onyx Fabric Care 已不止于保洁。探索完整的服务线，了解每一项涵盖的内容，准备好后即可开始预约。",
    "linesEyebrow": "服务线",
    "exploreCta": "探索",
    "serviceCountOne": "1 项服务",
    "serviceCountOther": "{count} 项服务",
    "closingEyebrow": "随时为您准备就绪",
    "closingTitle": "找到所需的服务，用一份从容的表单完成预约。",
    "closingBody": "选择一条服务线，查看包含的内容，继续填写单一预约表单，获得清晰的估价与可靠的时间安排。",
    "closingCta": "预约服务"
  },
  "vertical": {
    "titleTemplate": "{vertical} — {division}",
    "backToDirectory": "全部服务",
    "servicesHeading": "此服务线下的服务",
    "emptyTitle": "更多服务即将上线",
    "emptyBody": "我们正在扩展这条服务线。请稍后再来查看，或浏览目录中的其他服务线。",
    "viewService": "查看服务",
    "fromLabel": "起",
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
    "priceLabel": "价格",
    "fromLabel": "起",
    "onRequestLabel": "价格按需报价",
    "providersHeading": "服务方",
    "providersComingSoon": "认证服务方即将上线",
    "providerSuppliedNote": "此服务由认证服务方提供。",
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
    "eyebrow": "纵览 Henry Onyx",
    "title": "服务于家居、办公及两者之间的一切。",
    "body": "一份可靠服务的目录，配以清晰的预约与细致的跟进。选择一条服务线，了解它涵盖的内容。",
    "exploreCta": "查看服务线"
  }
};

const SERVICES_COPY_HI: DeepPartial<ServicesCopy> = {
  "directory": {
    "titleTemplate": "सेवाएँ — {division}",
    "description": "हर सेवा श्रेणी देखें — वस्त्र देखभाल, धुलाई, घर और कार्यालय की सफाई, मरम्मत, छोटे काम, सामान स्थानांतरण, और बहुत कुछ — और जो आपको चाहिए उसे बुक करें।",
    "eyebrow": "सेवा सूची",
    "title": "हर सेवा, एक ही जगह।",
    "body": "Henry Onyx Fabric Care अब सफाई से कहीं आगे बढ़ चुका है। सेवाओं की पूरी श्रेणी देखें, जानें कि हर एक में क्या शामिल है, और तैयार होने पर बुकिंग शुरू करें।",
    "linesEyebrow": "सेवा श्रेणियाँ",
    "exploreCta": "देखें",
    "serviceCountOne": "1 सेवा",
    "serviceCountOther": "{count} सेवाएँ",
    "closingEyebrow": "जब आप तैयार हों",
    "closingTitle": "जो सेवा आपको चाहिए उसे ढूँढें और एक सरल फ़ॉर्म से बुक करें।",
    "closingBody": "एक सेवा श्रेणी चुनें, देखें कि उसमें क्या शामिल है, और स्पष्ट अनुमान तथा भरोसेमंद समय के साथ एक ही बुकिंग फ़ॉर्म पर आगे बढ़ें।",
    "closingCta": "सेवा बुक करें"
  },
  "vertical": {
    "titleTemplate": "{vertical} — {division}",
    "backToDirectory": "सभी सेवाएँ",
    "servicesHeading": "इस श्रेणी की सेवाएँ",
    "emptyTitle": "और सेवाएँ जल्द आ रही हैं",
    "emptyBody": "हम इस सेवा श्रेणी का विस्तार कर रहे हैं। जल्द फिर देखें, या सूची की दूसरी श्रेणियाँ देखें।",
    "viewService": "सेवा देखें",
    "fromLabel": "से",
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
    "priceLabel": "मूल्य",
    "fromLabel": "से",
    "onRequestLabel": "मूल्य अनुरोध पर",
    "providersHeading": "प्रदाता",
    "providersComingSoon": "सत्यापित प्रदाता जल्द आ रहे हैं",
    "providerSuppliedNote": "यह सेवा एक सत्यापित प्रदाता द्वारा दी जाती है।",
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
    "eyebrow": "Henry Onyx में हर जगह",
    "title": "घर, काम और उनके बीच की हर ज़रूरत के लिए सेवाएँ।",
    "body": "भरोसेमंद सेवाओं की एक ही सूची, स्पष्ट बुकिंग और बेहतरीन फ़ॉलो-थ्रू के साथ। यह जानने के लिए कि किसमें क्या शामिल है, एक श्रेणी चुनें।",
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
