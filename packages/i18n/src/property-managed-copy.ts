import type { AppLocale } from "./locales";
import { deepMergeMessages } from "./merge-messages";

export type PropertyManagedCopy = {
  meta: {
    title: string;
    description: string;
  };
  page: {
    kicker: string;
    title: string;
    description: string;
    submitCta: string;
  };
  serviceLines: {
    sectionKicker: string;
    sectionTitle: string;
  };
  recentRecords: {
    sectionKicker: string;
  };
  managedListings: {
    kicker: string;
    title: string;
    description: string;
  };
  cta: {
    kicker: string;
    title: string;
    description: string;
    submitCta: string;
    trustCta: string;
  };
};

const EN: PropertyManagedCopy = {
  meta: {
    title: "Managed property | HenryCo Property",
    description:
      "Operations-grade property management: tenant communication, inspections, reporting, maintenance coordination, and owner trust workflows — held on one operating rail.",
  },
  page: {
    kicker: "Managed property",
    title: "Operations-grade management after the listing goes live.",
    description:
      "Tenant communication, inspections, reporting, maintenance coordination, short-let operations, and owner trust workflows — held on one operating rail rather than scattered across apps and chat threads.",
    submitCta: "Submit a managed property",
  },
  serviceLines: {
    sectionKicker: "Service lines",
    sectionTitle: "What HenryCo handles after acceptance.",
  },
  recentRecords: {
    sectionKicker: "Recent managed records",
  },
  managedListings: {
    kicker: "Managed listings",
    title: "Homes and stays already on managed rails.",
    description:
      "Stronger readiness, reporting, and coordination than passive pass-through inventory.",
  },
  cta: {
    kicker: "Move forward",
    title: "Submit your property — we'll review the operating fit, not just the badge.",
    description:
      "Managed acceptance implies HenryCo operational involvement. Non-managed listings can still publish, but the owner remains responsible for day-to-day reality.",
    submitCta: "Submit a property",
    trustCta: "How HenryCo governs listings",
  },
};

const FR: Partial<PropertyManagedCopy> = {
  meta: {
    title: "Gestion immobilière | HenryCo Property",
    description:
      "Gestion immobilière de niveau opérationnel : communication avec les locataires, inspections, reporting, coordination de la maintenance et workflows de confiance pour les propriétaires — sur un seul rail opérationnel.",
  },
  page: {
    kicker: "Gestion immobilière",
    title: "Gestion de niveau opérationnel après la mise en ligne de l'annonce.",
    description:
      "Communication avec les locataires, inspections, reporting, coordination de la maintenance, opérations de location courte durée et workflows de confiance — maintenus sur un seul rail opérationnel plutôt que dispersés entre applications et fils de discussion.",
    submitCta: "Soumettre un bien géré",
  },
  serviceLines: {
    sectionKicker: "Lignes de service",
    sectionTitle: "Ce que HenryCo gère après l'acceptation.",
  },
  recentRecords: {
    sectionKicker: "Dossiers gérés récents",
  },
  managedListings: {
    kicker: "Annonces gérées",
    title: "Logements et séjours déjà sur les rails de gestion.",
    description:
      "Une préparation, un reporting et une coordination plus solides qu'un inventaire passif en transit.",
  },
  cta: {
    kicker: "Avancer",
    title: "Soumettez votre bien — nous évaluerons l'adéquation opérationnelle, pas seulement le badge.",
    description:
      "L'acceptation en gestion implique l'implication opérationnelle de HenryCo. Les annonces non gérées peuvent toujours être publiées, mais le propriétaire reste responsable de la réalité quotidienne.",
    submitCta: "Soumettre un bien",
    trustCta: "Comment HenryCo gère les annonces",
  },
};

const ES: Partial<PropertyManagedCopy> = {
  meta: {
    title: "Propiedad gestionada | HenryCo Property",
    description:
      "Gestión inmobiliaria de nivel operativo: comunicación con inquilinos, inspecciones, informes, coordinación de mantenimiento y flujos de trabajo de confianza del propietario — en un único riel operativo.",
  },
  page: {
    kicker: "Propiedad gestionada",
    title: "Gestión de nivel operativo después de que el listado esté activo.",
    description:
      "Comunicación con inquilinos, inspecciones, informes, coordinación de mantenimiento, operaciones de alquiler corto y flujos de trabajo de confianza del propietario — en un único riel operativo en lugar de dispersos entre aplicaciones y hilos de chat.",
    submitCta: "Enviar una propiedad gestionada",
  },
  serviceLines: {
    sectionKicker: "Líneas de servicio",
    sectionTitle: "Lo que HenryCo maneja después de la aceptación.",
  },
  recentRecords: {
    sectionKicker: "Registros gestionados recientes",
  },
  managedListings: {
    kicker: "Listados gestionados",
    title: "Hogares y alojamientos ya en rieles de gestión.",
    description:
      "Mayor preparación, informes y coordinación que el inventario pasivo de paso.",
  },
  cta: {
    kicker: "Avanzar",
    title: "Envíe su propiedad — revisaremos el ajuste operativo, no solo la insignia.",
    description:
      "La aceptación gestionada implica la participación operativa de HenryCo. Los listados no gestionados aún pueden publicarse, pero el propietario sigue siendo responsable de la realidad diaria.",
    submitCta: "Enviar una propiedad",
    trustCta: "Cómo HenryCo gobierna los listados",
  },
};

const PT: Partial<PropertyManagedCopy> = {
  meta: {
    title: "Propriedade gerenciada | HenryCo Property",
    description:
      "Gestão imobiliária de nível operacional: comunicação com inquilinos, inspeções, relatórios, coordenação de manutenção e fluxos de trabalho de confiança do proprietário — em um único trilho operacional.",
  },
  page: {
    kicker: "Propriedade gerenciada",
    title: "Gestão de nível operacional após a listagem entrar no ar.",
    description:
      "Comunicação com inquilinos, inspeções, relatórios, coordenação de manutenção, operações de aluguel por curto prazo e fluxos de trabalho de confiança do proprietário — mantidos em um único trilho operacional em vez de espalhados por aplicativos e threads de chat.",
    submitCta: "Enviar uma propriedade gerenciada",
  },
  serviceLines: {
    sectionKicker: "Linhas de serviço",
    sectionTitle: "O que a HenryCo gerencia após a aceitação.",
  },
  recentRecords: {
    sectionKicker: "Registros gerenciados recentes",
  },
  managedListings: {
    kicker: "Listagens gerenciadas",
    title: "Casas e estadias já em trilhos gerenciados.",
    description:
      "Preparação, relatórios e coordenação mais fortes do que o inventário passivo de passagem.",
  },
  cta: {
    kicker: "Avançar",
    title: "Envie sua propriedade — revisaremos o ajuste operacional, não apenas o distintivo.",
    description:
      "A aceitação gerenciada implica envolvimento operacional da HenryCo. Listagens não gerenciadas ainda podem ser publicadas, mas o proprietário permanece responsável pela realidade do dia a dia.",
    submitCta: "Enviar uma propriedade",
    trustCta: "Como a HenryCo governa as listagens",
  },
};

const AR: Partial<PropertyManagedCopy> = {
  meta: {
    title: "العقارات المُدارة | HenryCo Property",
    description:
      "إدارة عقارية على مستوى التشغيل: التواصل مع المستأجرين، والتفتيش، والتقارير، وتنسيق الصيانة، وسير عمل ثقة الملاك — على ريل تشغيلي واحد.",
  },
  page: {
    kicker: "العقارات المُدارة",
    title: "إدارة على مستوى التشغيل بعد نشر الإعلان.",
    description:
      "التواصل مع المستأجرين، والتفتيش، والتقارير، وتنسيق الصيانة، وعمليات الإيجار القصير، وسير عمل ثقة الملاك — محتفظ بها على ريل تشغيلي واحد بدلًا من تشتيتها عبر التطبيقات وخيوط الدردشة.",
    submitCta: "تقديم عقار مُدار",
  },
  serviceLines: {
    sectionKicker: "خطوط الخدمة",
    sectionTitle: "ما تتولاه HenryCo بعد القبول.",
  },
  recentRecords: {
    sectionKicker: "السجلات المُدارة الأخيرة",
  },
  managedListings: {
    kicker: "الإعلانات المُدارة",
    title: "منازل وإقامات موجودة بالفعل على ريل الإدارة.",
    description:
      "جاهزية وتقارير وتنسيق أقوى من المخزون السلبي.",
  },
  cta: {
    kicker: "المضي قدمًا",
    title: "قدِّم عقارك — سنراجع الملاءمة التشغيلية، وليس الشارة فقط.",
    description:
      "القبول المُدار يعني المشاركة التشغيلية لـ HenryCo. يمكن للإعلانات غير المُدارة أن تُنشر أيضًا، لكن المالك يظل مسؤولًا عن الواقع اليومي.",
    submitCta: "تقديم عقار",
    trustCta: "كيف تحكم HenryCo الإعلانات",
  },
};

const DE: Partial<PropertyManagedCopy> = {
  meta: {
    title: "Verwaltete Immobilien | HenryCo Property",
    description:
      "Betriebswirtschaftliches Immobilienmanagement: Mieterkommun­ikation, Inspektionen, Reporting, Wartungskoordination und Vertrauens-Workflows für Eigentümer — auf einer einzigen Betriebsschiene.",
  },
  page: {
    kicker: "Verwaltete Immobilien",
    title: "Operatives Management nach der Veröffentlichung des Inserats.",
    description:
      "Mieterkommunikation, Inspektionen, Reporting, Wartungskoordination, Kurzzeitvermietung und Eigentümer-Vertrauens-Workflows — auf einer einzigen Betriebsschiene statt verteilt über Apps und Chat-Threads.",
    submitCta: "Verwaltete Immobilie einreichen",
  },
  serviceLines: {
    sectionKicker: "Servicelinien",
    sectionTitle: "Was HenryCo nach der Annahme übernimmt.",
  },
  recentRecords: {
    sectionKicker: "Aktuelle verwaltete Datensätze",
  },
  managedListings: {
    kicker: "Verwaltete Inserate",
    title: "Häuser und Unterkünfte bereits auf verwalteten Schienen.",
    description:
      "Stärkere Bereitschaft, Reporting und Koordination als passiver Durchgangsbestand.",
  },
  cta: {
    kicker: "Vorwärts bewegen",
    title: "Reichen Sie Ihre Immobilie ein — wir prüfen die operative Eignung, nicht nur das Abzeichen.",
    description:
      "Verwaltete Annahme bedeutet operative HenryCo-Beteiligung. Nicht verwaltete Inserate können weiterhin veröffentlicht werden, aber der Eigentümer bleibt für die tägliche Realität verantwortlich.",
    submitCta: "Immobilie einreichen",
    trustCta: "Wie HenryCo Inserate regelt",
  },
};

const IT: Partial<PropertyManagedCopy> = {
  meta: {
    title: "Proprietà gestita | HenryCo Property",
    description:
      "Gestione immobiliare di livello operativo: comunicazione con gli inquilini, ispezioni, reportistica, coordinamento della manutenzione e workflow di fiducia dei proprietari — su un unico binario operativo.",
  },
  page: {
    kicker: "Proprietà gestita",
    title: "Gestione di livello operativo dopo che l'annuncio va online.",
    description:
      "Comunicazione con gli inquilini, ispezioni, reportistica, coordinamento della manutenzione, operazioni di locazione breve e workflow di fiducia dei proprietari — mantenuti su un unico binario operativo anziché sparsi tra app e thread di chat.",
    submitCta: "Invia una proprietà gestita",
  },
  serviceLines: {
    sectionKicker: "Linee di servizio",
    sectionTitle: "Cosa gestisce HenryCo dopo l'accettazione.",
  },
  recentRecords: {
    sectionKicker: "Record gestiti recenti",
  },
  managedListings: {
    kicker: "Annunci gestiti",
    title: "Case e soggiorni già su binari gestiti.",
    description:
      "Preparazione, reportistica e coordinamento più forti rispetto all'inventario passivo di transito.",
  },
  cta: {
    kicker: "Procedere",
    title: "Invia la tua proprietà — esamineremo l'idoneità operativa, non solo il badge.",
    description:
      "L'accettazione gestita implica il coinvolgimento operativo di HenryCo. Gli annunci non gestiti possono comunque essere pubblicati, ma il proprietario rimane responsabile della realtà quotidiana.",
    submitCta: "Invia una proprietà",
    trustCta: "Come HenryCo governa gli annunci",
  },
};

const ZH: Partial<PropertyManagedCopy> = {
  meta: {
    title: "受管理物业 | HenryCo Property",
    description:
      "运营级物业管理：租户沟通、检查、报告、维护协调和业主信任工作流程 — 在单一运营轨道上。",
  },
  page: {
    kicker: "受管理物业",
    title: "挂牌上线后的运营级管理。",
    description:
      "租户沟通、检查、报告、维护协调、短租运营和业主信任工作流程 — 保持在单一运营轨道上，而不是分散在应用程序和聊天线程中。",
    submitCta: "提交受管理物业",
  },
  serviceLines: {
    sectionKicker: "服务线",
    sectionTitle: "HenryCo在接受后处理的内容。",
  },
  recentRecords: {
    sectionKicker: "最近的受管理记录",
  },
  managedListings: {
    kicker: "受管理挂牌",
    title: "已经在受管理轨道上的房屋和住宿。",
    description: "比被动转手库存更强的准备度、报告和协调。",
  },
  cta: {
    kicker: "向前推进",
    title: "提交您的物业 — 我们将审查运营适合度，而不仅仅是徽章。",
    description:
      "受管理接受意味着HenryCo的运营参与。非受管理挂牌仍然可以发布，但业主仍然负责日常现实。",
    submitCta: "提交物业",
    trustCta: "HenryCo如何管理挂牌",
  },
};

const HI: Partial<PropertyManagedCopy> = {
  meta: {
    title: "प्रबंधित संपत्ति | HenryCo Property",
    description:
      "परिचालन स्तर की संपत्ति प्रबंधन: किरायेदार संचार, निरीक्षण, रिपोर्टिंग, रखरखाव समन्वय और मालिक विश्वास वर्कफ़्लो — एक परिचालन रेल पर।",
  },
  page: {
    kicker: "प्रबंधित संपत्ति",
    title: "लिस्टिंग लाइव होने के बाद परिचालन-स्तर का प्रबंधन।",
    description:
      "किरायेदार संचार, निरीक्षण, रिपोर्टिंग, रखरखाव समन्वय, शॉर्ट-लेट ऑपरेशन और मालिक विश्वास वर्कफ़्लो — एकल परिचालन रेल पर रखे जाते हैं न कि ऐप्स और चैट थ्रेड में बिखरे।",
    submitCta: "प्रबंधित संपत्ति सबमिट करें",
  },
  serviceLines: {
    sectionKicker: "सेवा लाइनें",
    sectionTitle: "HenryCo स्वीकृति के बाद क्या संभालती है।",
  },
  recentRecords: {
    sectionKicker: "हालिया प्रबंधित रिकॉर्ड",
  },
  managedListings: {
    kicker: "प्रबंधित लिस्टिंग",
    title: "घर और ठहरने के स्थान जो पहले से प्रबंधित रेल पर हैं।",
    description: "निष्क्रिय पास-थ्रू इन्वेंटरी की तुलना में मजबूत तत्परता, रिपोर्टिंग और समन्वय।",
  },
  cta: {
    kicker: "आगे बढ़ें",
    title: "अपनी संपत्ति सबमिट करें — हम परिचालन उपयुक्तता की समीक्षा करेंगे, न केवल बैज।",
    description:
      "प्रबंधित स्वीकृति HenryCo परिचालन भागीदारी का संकेत देती है। गैर-प्रबंधित लिस्टिंग अभी भी प्रकाशित हो सकती है, लेकिन मालिक दैनिक वास्तविकता के लिए जिम्मेदार रहता है।",
    submitCta: "संपत्ति सबमिट करें",
    trustCta: "HenryCo लिस्टिंग को कैसे नियंत्रित करती है",
  },
};

const IG: Partial<PropertyManagedCopy> = {
  meta: {
    title: "Ihe onwunwe a na-alekọta | HenryCo Property",
    description:
      "Njikwa ihe onwunwe n'ọkwa ọrụ: ikwu okwu na ndị na-atọrọ ụlọ, nyocha, ọkọlọtọ, nhazi nlekọta, na ọrụ ntụkwasị obi ndi nwe — na otu ọkọlọtọ ọrụ.",
  },
  page: {
    kicker: "Ihe onwunwe a na-alekọta",
    title: "Njikwa n'ọkwa ọrụ mgbe ngosi abara n'ụlọ.",
    description:
      "Ikwu okwu na ndị na-atọrọ ụlọ, nyocha, ọkọlọtọ, nhazi nlekọta, ọrụ atọ n'oge mkpumkpu, na ọrụ ntụkwasị obi ndi nwe — echekwara na otu ọkọlọtọ ọrụ kama ọ bụ ebukwa n'ime ngwa na ụlọ ọkụ.",
    submitCta: "Bufee ihe onwunwe a na-alekọta",
  },
  serviceLines: {
    sectionKicker: "Ahịrị ọrụ",
    sectionTitle: "Ihe HenryCo na-achịkwa mgbe nkwado gasịrị.",
  },
  recentRecords: {
    sectionKicker: "Ndekọ ndị a na-alekọta oge a",
  },
  managedListings: {
    kicker: "Ngosi ndị a na-alekọta",
    title: "Ụlọ na ebe nọọrọ ọkụ ndị dị na ọkọlọtọ nlekọta.",
    description: "Ọdịnaya njikere, ọkọlọtọ, na nhazi siri ike karịa ihe ndekọ anaghị arụ ọrụ.",
  },
  cta: {
    kicker: "Gawa n'ihu",
    title: "Bufee ihe onwunwe gị — anyị ga-enyocha ihe a dabara maka ọrụ, ọbụghị naanị akara.",
    description:
      "Nkwado nlekọta na-egosi ntinye ọrụ HenryCo. Ngosi ndị a na-alekọtaghị nwere ike ibipụta, ma onye nwe nọgidere n'isi maka eziokwu ụbọchị ka ụbọchị.",
    submitCta: "Bufee ihe onwunwe",
    trustCta: "Otu HenryCo si achịkwa ngosi",
  },
};

const YO: Partial<PropertyManagedCopy> = {
  meta: {
    title: "Ohun-ini ti a ṣakoso | HenryCo Property",
    description:
      "Iṣakoso ohun-ini ni ipele iṣẹ: ibaraẹnisọrọ pẹlu awọn agbatẹru, awọn ayẹwo, ìjábọ, isọdọkan itọju, ati awọn iṣẹ igbẹkẹle onile — lori ọna iṣẹ kan.",
  },
  page: {
    kicker: "Ohun-ini ti a ṣakoso",
    title: "Iṣakoso ipele iṣẹ lẹhin ti atẹjade ba lọ laaye.",
    description:
      "Ibaraẹnisọrọ pẹlu awọn agbatẹru, awọn ayẹwo, ìjábọ, isọdọkan itọju, awọn iṣẹ iyalo kukuru, ati awọn ṣiṣe igbẹkẹle onile — ti o wa lori ọna iṣẹ kan dipo ki o tan kaakiri awọn ohun elo ati awọn ẹrọ ibaraẹnisọrọ.",
    submitCta: "Fi ohun-ini ti a ṣakoso silẹ",
  },
  serviceLines: {
    sectionKicker: "Awọn laini iṣẹ",
    sectionTitle: "Ohun ti HenryCo n ṣakoso lẹhin gbigba.",
  },
  recentRecords: {
    sectionKicker: "Awọn igbasilẹ ti a ṣakoso laipẹ",
  },
  managedListings: {
    kicker: "Awọn atẹjade ti a ṣakoso",
    title: "Awọn ile ati ibugbe ti o wa tẹlẹ lori awọn ọna ti a ṣakoso.",
    description: "Igbaradi to lagbara, ìjábọ, ati isọdọkan ju ohun-ini ti o kọja lọ lainidii.",
  },
  cta: {
    kicker: "Lọ siwaju",
    title: "Fi ohun-ini rẹ silẹ — a o ṣayẹwo ibamu iṣẹ, kii ṣe aami nikan.",
    description:
      "Gbigba ti a ṣakoso tumọ si ikopa iṣẹ HenryCo. Awọn atẹjade ti ko ṣakoso tun le tẹjade, ṣugbọn onile jẹ ki o jẹ ẹni iduro fun otitọ ojoojumọ.",
    submitCta: "Fi ohun-ini silẹ",
    trustCta: "Bii HenryCo ṣe n ṣakoso awọn atẹjade",
  },
};

const HA: Partial<PropertyManagedCopy> = {
  meta: {
    title: "Kadarori da ake sarrafa | HenryCo Property",
    description:
      "Sarrafa kadarori a matakin aiki: sadarwar mă hăwan gida, duba-duba, rahoto, daidaita kula da gidan, da ayyukan amana na masu mallakin gida — a kan dogo guda na ayyuka.",
  },
  page: {
    kicker: "Kadarori da ake sarrafa",
    title: "Sarrafa matakin aiki bayan jera kadarori ta fita.",
    description:
      "Sadarwar mă hăwan gida, duba-duba, rahoto, daidaita kula da gidan, ayyukan haya na ɗan gajeren lokaci, da ayyukan amana na masu mallakin gida — ana riƙe su a kan dogo guda na ayyuka maimakon warwatse a cikin manhajoji da zaren hira.",
    submitCta: "Gabatar da kadarori da ake sarrafa",
  },
  serviceLines: {
    sectionKicker: "Layin sabis",
    sectionTitle: "Abin da HenryCo ke sarrafa bayan karɓa.",
  },
  recentRecords: {
    sectionKicker: "Rikodin sarrafawa na kwanan nan",
  },
  managedListings: {
    kicker: "Jera kadarori da ake sarrafa",
    title: "Gidaje da wuraren zama da suke kan dogon sarrafawa.",
    description: "Shirye-shirye mafi ƙarfi, rahoto, da daidaitawa fiye da kaya na mai wucewa cikin nutsuwa.",
  },
  cta: {
    kicker: "Ci gaba",
    title: "Gabatar da kadarori — za mu duba dacewa na aiki, ba alamar kawai ba.",
    description:
      "Karɓar sarrafawa na nuna shiga ayyukan HenryCo. Jera kadarori marasa sarrafawa na iya buga rubutu, amma mai mallakin gida ya kasance mai alhakin gaskiyar yau da kullum.",
    submitCta: "Gabatar da kadarori",
    trustCta: "Yadda HenryCo ke sarrafa jera kadarori",
  },
};

const LOCALE_OVERRIDES: Partial<Record<AppLocale, Partial<PropertyManagedCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
  hi: HI,
  ig: IG,
  yo: YO,
  ha: HA,
};

export function getPropertyManagedCopy(locale: AppLocale): PropertyManagedCopy {
  const overrides = LOCALE_OVERRIDES[locale];
  if (overrides) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as PropertyManagedCopy;
  }
  return EN;
}
