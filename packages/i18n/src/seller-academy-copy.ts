import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * SellerAcademyCopy — i18n surface `surface:seller-academy` for V3-58.
 *
 * Covers the Learn Seller Academy track view (apps/learn `/academy/seller`), the
 * Bronze/Silver/Gold tier names + badge tooltips rendered on the business profile
 * and marketplace listings, and the (dormant) platform-fee-benefit copy.
 *
 * Pattern A typed-copy module: the EN baseline is exhaustive; each non-en locale is
 * a DeepPartial that deep-merges over EN, so any missing key falls back to EN
 * silently at runtime. The STORED tier enum stays English (none/bronze/silver/
 * gold) — only the DISPLAY labels here are translated.
 */
export type SellerAcademyCopy = {
  metadata: {
    /** Title template — `{division}` is replaced with the Learn division name. */
    titleTemplate: string;
    description: string;
  };
  track: {
    eyebrow: string;
    title: string;
    body: string;
  };
  steps: {
    eyebrow: string;
    learn: { title: string; body: string };
    sell: { title: string; body: string };
    earn: { title: string; body: string };
  };
  courses: {
    heading: string;
    subheading: string;
    levelLabel: {
      foundational: string;
      intermediate: string;
      advanced: string;
    };
    enrollCta: string;
    viewCta: string;
    completedLabel: string;
    empty: string;
  };
  tierNames: {
    none: string;
    bronze: string;
    silver: string;
    gold: string;
  };
  badge: {
    /** aria/label prefix, e.g. "Seller tier". */
    ariaPrefix: string;
    tooltip: {
      bronze: string;
      silver: string;
      gold: string;
    };
  };
  profile: {
    eyebrow: string;
    noneTitle: string;
    noneBody: string;
  };
  discount: {
    label: string;
    /** Honest note while D9 tier discounts are unratified (0% for every tier). */
    dormantNote: string;
  };
};

const SELLER_ACADEMY_COPY_EN: SellerAcademyCopy = {
  metadata: {
    titleTemplate: "Seller Academy · {division}",
    description:
      "Learn to run a high-trust storefront: verified courses on listing quality, fulfilment, and customer care that unlock Bronze, Silver, and Gold seller tiers.",
  },
  track: {
    eyebrow: "Seller Academy",
    title: "Become the kind of seller buyers trust",
    body: "A focused track for marketplace sellers. Finish verified courses, sell well, and earn a tier that shows on your profile and listings — every tier is derived from real completions and real performance, never self-assigned.",
  },
  steps: {
    eyebrow: "How it works",
    learn: {
      title: "Learn the craft",
      body: "Three verified courses take you from storefront setup to premium operations. Completion is recorded against your enrolment — there is no self-marking.",
    },
    sell: {
      title: "Sell with quality",
      body: "Your delivered orders and customer ratings feed your tier alongside your course progress. Consistency is what moves you up.",
    },
    earn: {
      title: "Earn your tier",
      body: "Bronze, Silver, and Gold appear on your business profile and your listings, signalling trust to buyers at a glance.",
    },
  },
  courses: {
    heading: "The Seller Academy track",
    subheading: "Complete the track in order — each level builds on the one before.",
    levelLabel: {
      foundational: "Foundational",
      intermediate: "Intermediate",
      advanced: "Advanced",
    },
    enrollCta: "Enrol",
    viewCta: "View course",
    completedLabel: "Completed",
    empty: "Seller Academy courses are being prepared. Check back shortly.",
  },
  tierNames: {
    none: "Unranked",
    bronze: "Bronze seller",
    silver: "Silver seller",
    gold: "Gold seller",
  },
  badge: {
    ariaPrefix: "Seller tier",
    tooltip: {
      bronze: "Completed the foundational Seller Academy course.",
      silver: "Completed the foundational and intermediate courses with a strong sales record.",
      gold: "Completed the full Seller Academy with an excellent sales and ratings record.",
    },
  },
  profile: {
    eyebrow: "Seller tier",
    noneTitle: "No seller tier yet",
    noneBody: "Complete the foundational Seller Academy course to earn your first tier.",
  },
  discount: {
    label: "Platform-fee benefit",
    dormantNote:
      "Tier-based fee benefits are not active yet. When enabled, higher tiers will lower your platform fee automatically.",
  },
};

// --- Pattern B: per-locale DeepPartial overrides (deep-merge over EN). ---
// Full parity target: fr, es, pt, ar, de, it, zh, hi, ig, yo, ha.
const SELLER_ACADEMY_COPY_FR: DeepPartial<SellerAcademyCopy> = {
  metadata: {
    titleTemplate: "Académie des vendeurs · {division}",
    description:
      "Apprenez à tenir une boutique de confiance : des cours vérifiés sur la qualité des annonces, la livraison et le service client qui débloquent les niveaux vendeur Bronze, Argent et Or.",
  },
  track: {
    eyebrow: "Académie des vendeurs",
    title: "Devenez le vendeur en qui les acheteurs ont confiance",
    body: "Un parcours ciblé pour les vendeurs de la place de marché. Terminez des cours vérifiés, vendez bien et obtenez un niveau qui s’affiche sur votre profil et vos annonces — chaque niveau découle de réalisations et de performances réelles, jamais d’une auto-attribution.",
  },
  steps: {
    eyebrow: "Comment ça marche",
    learn: {
      title: "Apprenez le métier",
      body: "Trois cours vérifiés vous mènent de la configuration de la boutique aux opérations premium. La réussite est enregistrée par rapport à votre inscription — aucune auto-validation.",
    },
    sell: {
      title: "Vendez avec qualité",
      body: "Vos commandes livrées et les notes de vos clients alimentent votre niveau, en plus de votre progression dans les cours. C’est la régularité qui vous fait progresser.",
    },
    earn: {
      title: "Gagnez votre niveau",
      body: "Bronze, Argent et Or apparaissent sur votre profil professionnel et vos annonces, signalant la confiance aux acheteurs en un coup d’œil.",
    },
  },
  courses: {
    heading: "Le parcours de l’Académie des vendeurs",
    subheading: "Suivez le parcours dans l’ordre — chaque niveau s’appuie sur le précédent.",
    levelLabel: {
      foundational: "Fondamental",
      intermediate: "Intermédiaire",
      advanced: "Avancé",
    },
    enrollCta: "S’inscrire",
    viewCta: "Voir le cours",
    completedLabel: "Terminé",
    empty: "Les cours de l’Académie des vendeurs sont en préparation. Revenez bientôt.",
  },
  tierNames: {
    none: "Non classé",
    bronze: "Vendeur Bronze",
    silver: "Vendeur Argent",
    gold: "Vendeur Or",
  },
  badge: {
    ariaPrefix: "Niveau vendeur",
    tooltip: {
      bronze: "A terminé le cours fondamental de l’Académie des vendeurs.",
      silver: "A terminé les cours fondamental et intermédiaire avec un solide historique de ventes.",
      gold: "A terminé l’intégralité de l’Académie des vendeurs avec un excellent historique de ventes et d’évaluations.",
    },
  },
  profile: {
    eyebrow: "Niveau vendeur",
    noneTitle: "Pas encore de niveau vendeur",
    noneBody: "Terminez le cours fondamental de l’Académie des vendeurs pour obtenir votre premier niveau.",
  },
  discount: {
    label: "Avantage sur les frais de plateforme",
    dormantNote:
      "Les avantages tarifaires selon le niveau ne sont pas encore actifs. Une fois activés, les niveaux supérieurs réduiront automatiquement vos frais de plateforme.",
  },
};
const SELLER_ACADEMY_COPY_ES: DeepPartial<SellerAcademyCopy> = {
  metadata: {
    titleTemplate: "Academia de Vendedores · {division}",
    description:
      "Aprende a gestionar una tienda de alta confianza: cursos verificados sobre la calidad de los anuncios, la entrega y la atención al cliente que desbloquean los niveles de vendedor Bronce, Plata y Oro.",
  },
  track: {
    eyebrow: "Academia de Vendedores",
    title: "Conviértete en el vendedor en quien los compradores confían",
    body: "Un itinerario enfocado para vendedores del mercado. Completa cursos verificados, vende bien y obtén un nivel que se muestra en tu perfil y tus anuncios; cada nivel se deriva de logros y rendimiento reales, nunca se autoasigna.",
  },
  steps: {
    eyebrow: "Cómo funciona",
    learn: {
      title: "Aprende el oficio",
      body: "Tres cursos verificados te llevan desde la configuración de la tienda hasta las operaciones premium. La finalización se registra en tu inscripción; no hay autovalidación.",
    },
    sell: {
      title: "Vende con calidad",
      body: "Tus pedidos entregados y las valoraciones de tus clientes alimentan tu nivel junto con tu progreso en los cursos. La constancia es lo que te hace ascender.",
    },
    earn: {
      title: "Gana tu nivel",
      body: "Bronce, Plata y Oro aparecen en tu perfil de empresa y en tus anuncios, transmitiendo confianza a los compradores de un vistazo.",
    },
  },
  courses: {
    heading: "El itinerario de la Academia de Vendedores",
    subheading: "Completa el itinerario en orden: cada nivel se basa en el anterior.",
    levelLabel: {
      foundational: "Fundamental",
      intermediate: "Intermedio",
      advanced: "Avanzado",
    },
    enrollCta: "Inscribirse",
    viewCta: "Ver curso",
    completedLabel: "Completado",
    empty: "Los cursos de la Academia de Vendedores se están preparando. Vuelve pronto.",
  },
  tierNames: {
    none: "Sin clasificar",
    bronze: "Vendedor Bronce",
    silver: "Vendedor Plata",
    gold: "Vendedor Oro",
  },
  badge: {
    ariaPrefix: "Nivel de vendedor",
    tooltip: {
      bronze: "Completó el curso fundamental de la Academia de Vendedores.",
      silver: "Completó los cursos fundamental e intermedio con un sólido historial de ventas.",
      gold: "Completó la Academia de Vendedores al completo con un excelente historial de ventas y valoraciones.",
    },
  },
  profile: {
    eyebrow: "Nivel de vendedor",
    noneTitle: "Aún sin nivel de vendedor",
    noneBody: "Completa el curso fundamental de la Academia de Vendedores para obtener tu primer nivel.",
  },
  discount: {
    label: "Beneficio en la comisión de la plataforma",
    dormantNote:
      "Los beneficios de comisión según el nivel aún no están activos. Cuando se activen, los niveles superiores reducirán automáticamente tu comisión de plataforma.",
  },
};
const SELLER_ACADEMY_COPY_PT: DeepPartial<SellerAcademyCopy> = {
  metadata: {
    titleTemplate: "Academia de Vendedores · {division}",
    description:
      "Aprenda a administrar uma loja de alta confiança: cursos verificados sobre qualidade de anúncios, entrega e atendimento ao cliente que desbloqueiam os níveis de vendedor Bronze, Prata e Ouro.",
  },
  track: {
    eyebrow: "Academia de Vendedores",
    title: "Torne-se o vendedor em quem os compradores confiam",
    body: "Uma trilha focada para vendedores do marketplace. Conclua cursos verificados, venda bem e conquiste um nível que aparece no seu perfil e nos seus anúncios — cada nível vem de conclusões e desempenho reais, nunca é autoatribuído.",
  },
  steps: {
    eyebrow: "Como funciona",
    learn: {
      title: "Aprenda o ofício",
      body: "Três cursos verificados levam você da configuração da loja às operações premium. A conclusão é registrada na sua matrícula — não há autovalidação.",
    },
    sell: {
      title: "Venda com qualidade",
      body: "Seus pedidos entregues e as avaliações dos clientes alimentam o seu nível, junto com o seu progresso nos cursos. A constância é o que faz você subir.",
    },
    earn: {
      title: "Conquiste o seu nível",
      body: "Bronze, Prata e Ouro aparecem no seu perfil empresarial e nos seus anúncios, transmitindo confiança aos compradores num relance.",
    },
  },
  courses: {
    heading: "A trilha da Academia de Vendedores",
    subheading: "Conclua a trilha em ordem — cada nível se baseia no anterior.",
    levelLabel: {
      foundational: "Fundamental",
      intermediate: "Intermediário",
      advanced: "Avançado",
    },
    enrollCta: "Inscrever-se",
    viewCta: "Ver curso",
    completedLabel: "Concluído",
    empty: "Os cursos da Academia de Vendedores estão sendo preparados. Volte em breve.",
  },
  tierNames: {
    none: "Sem classificação",
    bronze: "Vendedor Bronze",
    silver: "Vendedor Prata",
    gold: "Vendedor Ouro",
  },
  badge: {
    ariaPrefix: "Nível do vendedor",
    tooltip: {
      bronze: "Concluiu o curso fundamental da Academia de Vendedores.",
      silver: "Concluiu os cursos fundamental e intermediário com um sólido histórico de vendas.",
      gold: "Concluiu toda a Academia de Vendedores com um excelente histórico de vendas e avaliações.",
    },
  },
  profile: {
    eyebrow: "Nível do vendedor",
    noneTitle: "Ainda sem nível de vendedor",
    noneBody: "Conclua o curso fundamental da Academia de Vendedores para conquistar o seu primeiro nível.",
  },
  discount: {
    label: "Benefício na taxa da plataforma",
    dormantNote:
      "Os benefícios de taxa por nível ainda não estão ativos. Quando ativados, níveis mais altos reduzirão automaticamente a sua taxa da plataforma.",
  },
};
const SELLER_ACADEMY_COPY_AR: DeepPartial<SellerAcademyCopy> = {
  metadata: {
    titleTemplate: "أكاديمية البائعين · {division}",
    description:
      "تعلّم إدارة متجر يحظى بثقة عالية: دورات موثّقة حول جودة الإعلانات والتسليم وخدمة العملاء تفتح مستويات البائع البرونزي والفضي والذهبي.",
  },
  track: {
    eyebrow: "أكاديمية البائعين",
    title: "كن البائع الذي يثق به المشترون",
    body: "مسار مركّز لبائعي السوق. أكمل الدورات الموثّقة، وبِع بإتقان، واحصل على مستوى يظهر في ملفك الشخصي وإعلاناتك — كل مستوى مستمدّ من إنجازات وأداء حقيقيين، ولا يُمنح ذاتيًا أبدًا.",
  },
  steps: {
    eyebrow: "كيف يعمل",
    learn: {
      title: "تعلّم الحِرفة",
      body: "تأخذك ثلاث دورات موثّقة من إعداد المتجر إلى العمليات المتميّزة. يُسجَّل الإكمال مقابل تسجيلك — لا تأكيد ذاتي.",
    },
    sell: {
      title: "بِع بجودة",
      body: "تُغذّي طلباتك المُسلَّمة وتقييمات عملائك مستواك إلى جانب تقدّمك في الدورات. الاستمرارية هي ما يرفعك.",
    },
    earn: {
      title: "احصل على مستواك",
      body: "تظهر مستويات البرونزي والفضي والذهبي في ملفك التجاري وإعلاناتك، لتدلّ المشترين على الثقة في لمحة.",
    },
  },
  courses: {
    heading: "مسار أكاديمية البائعين",
    subheading: "أكمل المسار بالترتيب — يبني كل مستوى على الذي قبله.",
    levelLabel: {
      foundational: "تأسيسي",
      intermediate: "متوسّط",
      advanced: "متقدّم",
    },
    enrollCta: "سجِّل",
    viewCta: "عرض الدورة",
    completedLabel: "مكتمل",
    empty: "يجري إعداد دورات أكاديمية البائعين. عُد قريبًا.",
  },
  tierNames: {
    none: "غير مصنّف",
    bronze: "بائع برونزي",
    silver: "بائع فضي",
    gold: "بائع ذهبي",
  },
  badge: {
    ariaPrefix: "مستوى البائع",
    tooltip: {
      bronze: "أكمل الدورة التأسيسية في أكاديمية البائعين.",
      silver: "أكمل الدورتين التأسيسية والمتوسّطة بسجل مبيعات قوي.",
      gold: "أكمل أكاديمية البائعين بالكامل بسجل مبيعات وتقييمات ممتاز.",
    },
  },
  profile: {
    eyebrow: "مستوى البائع",
    noneTitle: "لا يوجد مستوى بائع بعد",
    noneBody: "أكمل الدورة التأسيسية في أكاديمية البائعين للحصول على مستواك الأول.",
  },
  discount: {
    label: "ميزة رسوم المنصّة",
    dormantNote:
      "ميزات الرسوم حسب المستوى ليست نشطة بعد. عند تفعيلها، ستخفّض المستويات الأعلى رسوم منصّتك تلقائيًا.",
  },
};
const SELLER_ACADEMY_COPY_DE: DeepPartial<SellerAcademyCopy> = {
  metadata: {
    titleTemplate: "Verkäuferakademie · {division}",
    description:
      "Lernen Sie, einen vertrauenswürdigen Shop zu führen: geprüfte Kurse zu Angebotsqualität, Lieferung und Kundenbetreuung, die die Verkäuferstufen Bronze, Silber und Gold freischalten.",
  },
  track: {
    eyebrow: "Verkäuferakademie",
    title: "Werden Sie der Verkäufer, dem Käufer vertrauen",
    body: "Ein gezielter Lernpfad für Marktplatzverkäufer. Schließen Sie geprüfte Kurse ab, verkaufen Sie gut und verdienen Sie eine Stufe, die auf Ihrem Profil und Ihren Angeboten erscheint — jede Stufe ergibt sich aus echten Abschlüssen und echter Leistung, niemals selbst vergeben.",
  },
  steps: {
    eyebrow: "So funktioniert es",
    learn: {
      title: "Das Handwerk lernen",
      body: "Drei geprüfte Kurse führen Sie von der Shop-Einrichtung bis zum Premium-Betrieb. Der Abschluss wird Ihrer Anmeldung zugeordnet — keine Selbstbestätigung.",
    },
    sell: {
      title: "Mit Qualität verkaufen",
      body: "Ihre ausgelieferten Bestellungen und Kundenbewertungen fließen neben Ihrem Kursfortschritt in Ihre Stufe ein. Beständigkeit bringt Sie nach oben.",
    },
    earn: {
      title: "Ihre Stufe verdienen",
      body: "Bronze, Silber und Gold erscheinen auf Ihrem Unternehmensprofil und Ihren Angeboten und signalisieren Käufern auf einen Blick Vertrauen.",
    },
  },
  courses: {
    heading: "Der Lernpfad der Verkäuferakademie",
    subheading: "Schließen Sie den Pfad der Reihe nach ab — jede Stufe baut auf der vorherigen auf.",
    levelLabel: {
      foundational: "Grundlagen",
      intermediate: "Mittelstufe",
      advanced: "Fortgeschritten",
    },
    enrollCta: "Anmelden",
    viewCta: "Kurs ansehen",
    completedLabel: "Abgeschlossen",
    empty: "Die Kurse der Verkäuferakademie werden vorbereitet. Schauen Sie bald wieder vorbei.",
  },
  tierNames: {
    none: "Ohne Einstufung",
    bronze: "Bronze-Verkäufer",
    silver: "Silber-Verkäufer",
    gold: "Gold-Verkäufer",
  },
  badge: {
    ariaPrefix: "Verkäuferstufe",
    tooltip: {
      bronze: "Hat den Grundlagenkurs der Verkäuferakademie abgeschlossen.",
      silver: "Hat die Grundlagen- und Mittelstufenkurse mit einer starken Verkaufsbilanz abgeschlossen.",
      gold: "Hat die gesamte Verkäuferakademie mit einer hervorragenden Verkaufs- und Bewertungsbilanz abgeschlossen.",
    },
  },
  profile: {
    eyebrow: "Verkäuferstufe",
    noneTitle: "Noch keine Verkäuferstufe",
    noneBody: "Schließen Sie den Grundlagenkurs der Verkäuferakademie ab, um Ihre erste Stufe zu verdienen.",
  },
  discount: {
    label: "Vorteil bei der Plattformgebühr",
    dormantNote:
      "Stufenbasierte Gebührenvorteile sind noch nicht aktiv. Sobald aktiviert, senken höhere Stufen Ihre Plattformgebühr automatisch.",
  },
};
const SELLER_ACADEMY_COPY_IT: DeepPartial<SellerAcademyCopy> = {
  metadata: {
    titleTemplate: "Accademia dei Venditori · {division}",
    description:
      "Impara a gestire una vetrina affidabile: corsi verificati sulla qualità degli annunci, sull’evasione degli ordini e sull’assistenza clienti che sbloccano i livelli venditore Bronzo, Argento e Oro.",
  },
  track: {
    eyebrow: "Accademia dei Venditori",
    title: "Diventa il venditore di cui gli acquirenti si fidano",
    body: "Un percorso mirato per i venditori del marketplace. Completa corsi verificati, vendi bene e ottieni un livello che compare sul tuo profilo e sui tuoi annunci — ogni livello deriva da completamenti e prestazioni reali, mai autoassegnato.",
  },
  steps: {
    eyebrow: "Come funziona",
    learn: {
      title: "Impara il mestiere",
      body: "Tre corsi verificati ti accompagnano dalla configurazione della vetrina alle operazioni premium. Il completamento viene registrato sulla tua iscrizione — nessuna autoconvalida.",
    },
    sell: {
      title: "Vendi con qualità",
      body: "Gli ordini consegnati e le valutazioni dei clienti alimentano il tuo livello insieme ai progressi nei corsi. È la costanza a farti salire.",
    },
    earn: {
      title: "Conquista il tuo livello",
      body: "Bronzo, Argento e Oro compaiono sul tuo profilo aziendale e sui tuoi annunci, comunicando fiducia agli acquirenti a colpo d’occhio.",
    },
  },
  courses: {
    heading: "Il percorso dell’Accademia dei Venditori",
    subheading: "Completa il percorso in ordine — ogni livello si basa sul precedente.",
    levelLabel: {
      foundational: "Base",
      intermediate: "Intermedio",
      advanced: "Avanzato",
    },
    enrollCta: "Iscriviti",
    viewCta: "Vedi corso",
    completedLabel: "Completato",
    empty: "I corsi dell’Accademia dei Venditori sono in preparazione. Torna a trovarci presto.",
  },
  tierNames: {
    none: "Non classificato",
    bronze: "Venditore Bronzo",
    silver: "Venditore Argento",
    gold: "Venditore Oro",
  },
  badge: {
    ariaPrefix: "Livello venditore",
    tooltip: {
      bronze: "Ha completato il corso base dell’Accademia dei Venditori.",
      silver: "Ha completato i corsi base e intermedio con un solido storico di vendite.",
      gold: "Ha completato l’intera Accademia dei Venditori con un eccellente storico di vendite e valutazioni.",
    },
  },
  profile: {
    eyebrow: "Livello venditore",
    noneTitle: "Ancora nessun livello venditore",
    noneBody: "Completa il corso base dell’Accademia dei Venditori per conquistare il tuo primo livello.",
  },
  discount: {
    label: "Vantaggio sulle commissioni della piattaforma",
    dormantNote:
      "I vantaggi sulle commissioni in base al livello non sono ancora attivi. Una volta attivati, i livelli più alti ridurranno automaticamente la tua commissione di piattaforma.",
  },
};
const SELLER_ACADEMY_COPY_ZH: DeepPartial<SellerAcademyCopy> = {
  metadata: {
    titleTemplate: "卖家学院 · {division}",
    description:
      "学习经营一家备受信赖的店铺：关于商品质量、订单履约和客户服务的认证课程，助你解锁铜牌、银牌和金牌卖家等级。",
  },
  track: {
    eyebrow: "卖家学院",
    title: "成为买家信赖的卖家",
    body: "为市场卖家打造的专项学习路径。完成认证课程，用心经营，赢得在你的资料页和商品页上展示的等级——每个等级都源自真实的课程完成情况和真实业绩，绝不自行设定。",
  },
  steps: {
    eyebrow: "运作方式",
    learn: {
      title: "学习经营之道",
      body: "三门认证课程带你从店铺搭建走向高端运营。完成情况会记录在你的报名记录中——不存在自我标记。",
    },
    sell: {
      title: "以质量取胜",
      body: "你的已交付订单和客户评价，与课程进度一同决定你的等级。持续稳定的表现才能让你升级。",
    },
    earn: {
      title: "赢得你的等级",
      body: "铜牌、银牌和金牌会出现在你的企业资料页和商品页上，让买家一眼便能感受到信任。",
    },
  },
  courses: {
    heading: "卖家学院学习路径",
    subheading: "请按顺序完成各级——每一级都以前一级为基础。",
    levelLabel: {
      foundational: "基础",
      intermediate: "进阶",
      advanced: "高级",
    },
    enrollCta: "报名",
    viewCta: "查看课程",
    completedLabel: "已完成",
    empty: "卖家学院课程正在筹备中，请稍后再来查看。",
  },
  tierNames: {
    none: "暂无等级",
    bronze: "铜牌卖家",
    silver: "银牌卖家",
    gold: "金牌卖家",
  },
  badge: {
    ariaPrefix: "卖家等级",
    tooltip: {
      bronze: "已完成卖家学院基础课程。",
      silver: "已完成基础和进阶课程，并拥有良好的销售记录。",
      gold: "已完成全部卖家学院课程，并拥有出色的销售与评价记录。",
    },
  },
  profile: {
    eyebrow: "卖家等级",
    noneTitle: "尚无卖家等级",
    noneBody: "完成卖家学院基础课程，即可赢得你的首个等级。",
  },
  discount: {
    label: "平台费用优惠",
    dormantNote:
      "基于等级的费用优惠尚未启用。启用后，更高的等级将自动降低你的平台费用。",
  },
};
const SELLER_ACADEMY_COPY_HI: DeepPartial<SellerAcademyCopy> = {
  metadata: {
    titleTemplate: "विक्रेता अकादमी · {division}",
    description:
      "एक भरोसेमंद दुकान चलाना सीखें: लिस्टिंग की गुणवत्ता, ऑर्डर पूर्ति और ग्राहक सेवा पर सत्यापित पाठ्यक्रम, जो कांस्य, रजत और स्वर्ण विक्रेता स्तर अनलॉक करते हैं।",
  },
  track: {
    eyebrow: "विक्रेता अकादमी",
    title: "वह विक्रेता बनें जिस पर खरीदार भरोसा करते हैं",
    body: "मार्केटप्लेस विक्रेताओं के लिए एक केंद्रित मार्ग। सत्यापित पाठ्यक्रम पूरे करें, अच्छी तरह बिक्री करें और एक ऐसा स्तर अर्जित करें जो आपकी प्रोफ़ाइल और लिस्टिंग पर दिखे — हर स्तर वास्तविक उपलब्धियों और वास्तविक प्रदर्शन से तय होता है, कभी स्वयं नहीं दिया जाता।",
  },
  steps: {
    eyebrow: "यह कैसे काम करता है",
    learn: {
      title: "हुनर सीखें",
      body: "तीन सत्यापित पाठ्यक्रम आपको दुकान की शुरुआती सेटअप से प्रीमियम संचालन तक ले जाते हैं। पूर्णता आपके नामांकन के विरुद्ध दर्ज होती है — कोई स्व-अंकन नहीं।",
    },
    sell: {
      title: "गुणवत्ता के साथ बेचें",
      body: "आपके वितरित ऑर्डर और ग्राहक रेटिंग, आपकी पाठ्यक्रम प्रगति के साथ मिलकर आपका स्तर तय करते हैं। निरंतरता ही आपको आगे बढ़ाती है।",
    },
    earn: {
      title: "अपना स्तर अर्जित करें",
      body: "कांस्य, रजत और स्वर्ण आपकी व्यवसाय प्रोफ़ाइल और आपकी लिस्टिंग पर दिखते हैं, जो खरीदारों को एक नज़र में भरोसे का संकेत देते हैं।",
    },
  },
  courses: {
    heading: "विक्रेता अकादमी मार्ग",
    subheading: "मार्ग को क्रम से पूरा करें — हर स्तर पिछले स्तर पर आधारित है।",
    levelLabel: {
      foundational: "बुनियादी",
      intermediate: "मध्यवर्ती",
      advanced: "उन्नत",
    },
    enrollCta: "नामांकन करें",
    viewCta: "पाठ्यक्रम देखें",
    completedLabel: "पूर्ण",
    empty: "विक्रेता अकादमी के पाठ्यक्रम तैयार किए जा रहे हैं। जल्द ही फिर देखें।",
  },
  tierNames: {
    none: "अवर्गीकृत",
    bronze: "कांस्य विक्रेता",
    silver: "रजत विक्रेता",
    gold: "स्वर्ण विक्रेता",
  },
  badge: {
    ariaPrefix: "विक्रेता स्तर",
    tooltip: {
      bronze: "विक्रेता अकादमी का बुनियादी पाठ्यक्रम पूरा किया।",
      silver: "मजबूत बिक्री रिकॉर्ड के साथ बुनियादी और मध्यवर्ती पाठ्यक्रम पूरे किए।",
      gold: "उत्कृष्ट बिक्री और रेटिंग रिकॉर्ड के साथ संपूर्ण विक्रेता अकादमी पूरी की।",
    },
  },
  profile: {
    eyebrow: "विक्रेता स्तर",
    noneTitle: "अभी कोई विक्रेता स्तर नहीं",
    noneBody: "अपना पहला स्तर अर्जित करने के लिए विक्रेता अकादमी का बुनियादी पाठ्यक्रम पूरा करें।",
  },
  discount: {
    label: "प्लेटफ़ॉर्म शुल्क लाभ",
    dormantNote:
      "स्तर-आधारित शुल्क लाभ अभी सक्रिय नहीं हैं। सक्षम होने पर, उच्च स्तर स्वतः आपका प्लेटफ़ॉर्म शुल्क कम कर देंगे।",
  },
};
const SELLER_ACADEMY_COPY_IG: DeepPartial<SellerAcademyCopy> = {
  metadata: {
    titleTemplate: "Ụlọ Akwụkwọ Ndị Na-ere Ahịa · {division}",
    description:
      "Mụta ka esi elekọta ụlọ ahịa ndị mmadụ tụkwasịrị obi: usoro ọmụmụ enyochara banyere ịdị mma nke ihe edepụtara, mbupu ngwaahịa, na nlekọta ndị ahịa nke na-emepe ọkwa ndị na-ere ahịa Bronze, Silver, na Gold.",
  },
  track: {
    eyebrow: "Ụlọ Akwụkwọ Ndị Na-ere Ahịa",
    title: "Bụrụ ụdị onye na-ere ahịa ndị na-azụ ahịa tụkwasịrị obi",
    body: "Ụzọ mmụta lekwasịrị anya maka ndị na-ere ahịa n’ahịa. Mechaa usoro ọmụmụ enyochara, resie ahịa nke ọma, ma nweta ọkwa nke na-egosi na profaịlụ gị na ihe ndị i depụtara — a na-enweta ọkwa ọ bụla site na mmecha na arụmọrụ ezi okwu, ọ dịghị mgbe a na-enye onwe gị ya.",
  },
  steps: {
    eyebrow: "Otú o si arụ ọrụ",
    learn: {
      title: "Mụta nkà ahụ",
      body: "Usoro ọmụmụ atọ enyochara na-eduga gị site na nhazi ụlọ ahịa ruo ọrụ dị elu. A na-edekọ mmecha na ndebanye aha gị — enweghị ịkara onwe gị akara.",
    },
    sell: {
      title: "Resie ahịa n’ụzọ dị mma",
      body: "Iwu ndị i bufere na ọkwa ndị ahịa gị nyere na-enye aka kpebie ọkwa gị tinyere ọganihu gị n’usoro ọmụmụ. Ọ bụ ịnọgidesi ike na-eme ka ị rịgoo elu.",
    },
    earn: {
      title: "Nweta ọkwa gị",
      body: "Bronze, Silver, na Gold na-apụta na profaịlụ azụmahịa gị na ihe ndị i depụtara, na-egosi ndị na-azụ ahịa ntụkwasị obi ozugbo.",
    },
  },
  courses: {
    heading: "Ụzọ mmụta nke Ụlọ Akwụkwọ Ndị Na-ere Ahịa",
    subheading: "Mechaa ụzọ ahụ n’usoro — ọkwa ọ bụla na-adabere na nke bu ya ụzọ.",
    levelLabel: {
      foundational: "Ntọala",
      intermediate: "Etiti",
      advanced: "Ọkaibe",
    },
    enrollCta: "Debanye aha",
    viewCta: "Lee usoro ọmụmụ",
    completedLabel: "Emechaala",
    empty: "A na-akwado usoro ọmụmụ Ụlọ Akwụkwọ Ndị Na-ere Ahịa. Bịaghachi n’oge na-adịghị anya.",
  },
  tierNames: {
    none: "Enwebeghị ọkwa",
    bronze: "Onye na-ere ahịa Bronze",
    silver: "Onye na-ere ahịa Silver",
    gold: "Onye na-ere ahịa Gold",
  },
  badge: {
    ariaPrefix: "Ọkwa onye na-ere ahịa",
    tooltip: {
      bronze: "Emechaala usoro ọmụmụ ntọala nke Ụlọ Akwụkwọ Ndị Na-ere Ahịa.",
      silver: "Emechaala usoro ọmụmụ ntọala na nke etiti, jiri ndekọ ire ahịa siri ike.",
      gold: "Emechaala Ụlọ Akwụkwọ Ndị Na-ere Ahịa dum, jiri ndekọ ire ahịa na ọkwa magburu onwe ya.",
    },
  },
  profile: {
    eyebrow: "Ọkwa onye na-ere ahịa",
    noneTitle: "Enwebeghị ọkwa onye na-ere ahịa",
    noneBody: "Mechaa usoro ọmụmụ ntọala nke Ụlọ Akwụkwọ Ndị Na-ere Ahịa iji nweta ọkwa mbụ gị.",
  },
  discount: {
    label: "Uru ụgwọ ọrụ pụlatfọm",
    dormantNote:
      "Uru ụgwọ ọrụ dabere na ọkwa arụbeghị ọrụ. Mgbe a gbanyere ya, ọkwa ndị dị elu ga-ebelata ụgwọ ọrụ pụlatfọm gị na-akpaghị aka.",
  },
};
const SELLER_ACADEMY_COPY_YO: DeepPartial<SellerAcademyCopy> = {
  metadata: {
    titleTemplate: "Ilé Ẹ̀kọ́ Awọn Olùtà · {division}",
    description:
      "Kọ́ bí o ṣe lè ṣàkóso ilé ìtajà tí àwọn ènìyàn gbẹ́kẹ̀lé: àwọn ẹ̀kọ́ tí a ti fọwọ́sí lórí ìdára ohun tí o kéde, ìfijíṣẹ́ ọjà, àti ìtọ́jú oníbàárà tí ó ṣí ipò olùtà Bronze, Silver, àti Gold sílẹ̀.",
  },
  track: {
    eyebrow: "Ilé Ẹ̀kọ́ Awọn Olùtà",
    title: "Di irú olùtà tí àwọn rírà ń gbẹ́kẹ̀lé",
    body: "Ọ̀nà ẹ̀kọ́ tí a darí sí àwọn olùtà ọjà. Parí àwọn ẹ̀kọ́ tí a ti fọwọ́sí, tà dáadáa, kí o sì jèrè ipò tí yóò hàn lórí àkọsílẹ̀ rẹ àti àwọn ohun tí o kéde — gbogbo ipò ni a ń rí láti inú ìparí àti iṣẹ́ gidi, kì í ṣe ti ara ẹni rí.",
  },
  steps: {
    eyebrow: "Bí ó ṣe ń ṣiṣẹ́",
    learn: {
      title: "Kọ́ ọnà-iṣẹ́ náà",
      body: "Àwọn ẹ̀kọ́ mẹ́ta tí a ti fọwọ́sí yóò mú ọ láti ìdásílẹ̀ ilé ìtajà dé iṣẹ́ ìṣàkóso gíga. A ń kọ ìparí sílẹ̀ lórí ìforúkọsílẹ̀ rẹ — kò sí àmì-ara-ẹni.",
    },
    sell: {
      title: "Tà pẹ̀lú ìdára",
      body: "Àwọn ọ̀rọ̀-ìbéèrè tí o ti fijíṣẹ́ àti ìdíwọ̀n àwọn oníbàárà rẹ ń ṣe àfikún sí ipò rẹ pẹ̀lú ìtẹ̀síwájú ẹ̀kọ́ rẹ. Ìdúróṣinṣin ni ó ń gbé ọ ga.",
    },
    earn: {
      title: "Jèrè ipò rẹ",
      body: "Bronze, Silver, àti Gold yóò hàn lórí àkọsílẹ̀ òwò rẹ àti àwọn ohun tí o kéde, tí ń fi ìgbẹ́kẹ̀lé hàn fún àwọn rírà lẹ́sẹ̀kẹsẹ̀.",
    },
  },
  courses: {
    heading: "Ọ̀nà ẹ̀kọ́ Ilé Ẹ̀kọ́ Awọn Olùtà",
    subheading: "Parí ọ̀nà náà ní ọ̀wọ̀ọwọ̀ — ipò kọ̀ọ̀kan ni a kọ́ lórí èyí tí ó ṣáájú rẹ̀.",
    levelLabel: {
      foundational: "Ìpìlẹ̀",
      intermediate: "Àárín",
      advanced: "Gíga",
    },
    enrollCta: "Forúkọsílẹ̀",
    viewCta: "Wo ẹ̀kọ́",
    completedLabel: "Tí a parí",
    empty: "À ń múra àwọn ẹ̀kọ́ Ilé Ẹ̀kọ́ Awọn Olùtà sílẹ̀. Padà wá láìpẹ́.",
  },
  tierNames: {
    none: "Kò sí ipò",
    bronze: "Olùtà Bronze",
    silver: "Olùtà Silver",
    gold: "Olùtà Gold",
  },
  badge: {
    ariaPrefix: "Ipò olùtà",
    tooltip: {
      bronze: "Ó ti parí ẹ̀kọ́ ìpìlẹ̀ ti Ilé Ẹ̀kọ́ Awọn Olùtà.",
      silver: "Ó ti parí ẹ̀kọ́ ìpìlẹ̀ àti ti àárín pẹ̀lú àkọsílẹ̀ títà tí ó lágbára.",
      gold: "Ó ti parí gbogbo Ilé Ẹ̀kọ́ Awọn Olùtà pẹ̀lú àkọsílẹ̀ títà àti ìdíwọ̀n tí ó dára gan-an.",
    },
  },
  profile: {
    eyebrow: "Ipò olùtà",
    noneTitle: "Kò tíì sí ipò olùtà",
    noneBody: "Parí ẹ̀kọ́ ìpìlẹ̀ ti Ilé Ẹ̀kọ́ Awọn Olùtà láti jèrè ipò àkọ́kọ́ rẹ.",
  },
  discount: {
    label: "Àǹfààní owó ìdíyelé pẹpẹ",
    dormantNote:
      "Àwọn àǹfààní owó ìdíyelé tí ó dá lórí ipò kò tíì ṣiṣẹ́. Nígbà tí a bá ṣíṣẹ́ rẹ̀, àwọn ipò gíga yóò dín owó ìdíyelé pẹpẹ rẹ kù láìfọwọ́yí.",
  },
};
const SELLER_ACADEMY_COPY_HA: DeepPartial<SellerAcademyCopy> = {
  metadata: {
    titleTemplate: "Makarantar Masu Sayarwa · {division}",
    description:
      "Koyi yadda ake gudanar da shago mai amana: darussa da aka tabbatar game da ingancin tallace-tallace, isar da kaya, da kula da abokan ciniki waɗanda ke buɗe matakan mai sayarwa na Bronze, Silver, da Gold.",
  },
  track: {
    eyebrow: "Makarantar Masu Sayarwa",
    title: "Zama irin mai sayarwa da masu saye ke amincewa da shi",
    body: "Hanyar koyo da aka mai da hankali a kai don masu sayarwa a kasuwa. Kammala darussa da aka tabbatar, ka yi kyakkyawan sayarwa, ka samu matakin da zai bayyana a bayanin martabarka da tallace-tallacenka — kowane mataki ana samun shi ne daga kammalawa da aikin gaske, ba a taɓa ba kanka shi ba.",
  },
  steps: {
    eyebrow: "Yadda yake aiki",
    learn: {
      title: "Koyi sana’ar",
      body: "Darussa uku da aka tabbatar suna kai ka daga shirya shago zuwa ayyuka na manyan matakai. Ana yin rikodin kammalawa a kan rajistarka — babu yiwa kai alama.",
    },
    sell: {
      title: "Ka sayar da inganci",
      body: "Odar da ka isar da kuma kimar abokan cinikinka suna ƙara matakinka tare da ci gabanka a darussa. Daidaito ne ke ɗaga ka sama.",
    },
    earn: {
      title: "Ka samu matakinka",
      body: "Bronze, Silver, da Gold suna bayyana a bayanin martabar kasuwancinka da tallace-tallacenka, suna nuna wa masu saye amana cikin saurin gani.",
    },
  },
  courses: {
    heading: "Hanyar koyo ta Makarantar Masu Sayarwa",
    subheading: "Kammala hanyar a tsari — kowane mataki yana ginuwa a kan wanda ya gabace shi.",
    levelLabel: {
      foundational: "Na tushe",
      intermediate: "Na tsakiya",
      advanced: "Na gaba",
    },
    enrollCta: "Yi rajista",
    viewCta: "Duba darasi",
    completedLabel: "An kammala",
    empty: "Ana shirya darussan Makarantar Masu Sayarwa. Ka dawo nan ba da daɗewa ba.",
  },
  tierNames: {
    none: "Babu mataki",
    bronze: "Mai sayarwa na Bronze",
    silver: "Mai sayarwa na Silver",
    gold: "Mai sayarwa na Gold",
  },
  badge: {
    ariaPrefix: "Matakin mai sayarwa",
    tooltip: {
      bronze: "Ya kammala darasin tushe na Makarantar Masu Sayarwa.",
      silver: "Ya kammala darussan tushe da na tsakiya tare da kyakkyawan tarihin sayarwa.",
      gold: "Ya kammala dukan Makarantar Masu Sayarwa tare da kyakkyawan tarihin sayarwa da kimantawa.",
    },
  },
  profile: {
    eyebrow: "Matakin mai sayarwa",
    noneTitle: "Babu matakin mai sayarwa tukuna",
    noneBody: "Kammala darasin tushe na Makarantar Masu Sayarwa don samun matakinka na farko.",
  },
  discount: {
    label: "Amfanin kuɗin dandamali",
    dormantNote:
      "Amfanin kuɗin da ya danganci mataki bai fara aiki ba tukuna. Idan an kunna shi, manyan matakai za su rage kuɗin dandamalinka ta atomatik.",
  },
};

const SELLER_ACADEMY_LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<SellerAcademyCopy>>> = {
  fr: SELLER_ACADEMY_COPY_FR,
  es: SELLER_ACADEMY_COPY_ES,
  pt: SELLER_ACADEMY_COPY_PT,
  ar: SELLER_ACADEMY_COPY_AR,
  de: SELLER_ACADEMY_COPY_DE,
  it: SELLER_ACADEMY_COPY_IT,
  zh: SELLER_ACADEMY_COPY_ZH,
  hi: SELLER_ACADEMY_COPY_HI,
  ig: SELLER_ACADEMY_COPY_IG,
  yo: SELLER_ACADEMY_COPY_YO,
  ha: SELLER_ACADEMY_COPY_HA,
};

export function getSellerAcademyCopy(locale: AppLocale): SellerAcademyCopy {
  const overrides = SELLER_ACADEMY_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      SELLER_ACADEMY_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as SellerAcademyCopy;
  }
  return SELLER_ACADEMY_COPY_EN;
}

/** @internal */
export function __dangerouslyGetEnglishSellerAcademyCopy(): SellerAcademyCopy {
  return SELLER_ACADEMY_COPY_EN;
}
