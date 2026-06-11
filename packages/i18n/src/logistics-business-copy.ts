import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * LogisticsBusinessCopy — i18n surface for the /business page on the
 * Logistics division. Covers metadata, the operator hero (eyebrow,
 * title, body, three CTAs), the credibility rail (Pricing / Visibility /
 * Continuity), the three operating standards, the four-step path,
 * the best-for / not-a-fit-yet split, and the closing volume callout.
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each locale is
 * a Partial that deep-merges over EN so missing keys fall through to EN
 * silently. Mirrors the shape of `logistics-book-copy.ts`.
 */
export type LogisticsBusinessCopy = {
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    body: string;
    quoteCta: string;
    accountCta: string;
    compareCta: string;
  };
  credibility: {
    pricingLabel: string;
    pricingValue: string;
    visibilityLabel: string;
    visibilityValue: string;
    continuityLabel: string;
    continuityValue: string;
  };
  standards: {
    eyebrow: string;
    repeatLanesTitle: string;
    repeatLanesBody: string;
    escalationsTitle: string;
    escalationsBody: string;
    premiumTitle: string;
    premiumBody: string;
  };
  path: {
    eyebrow: string;
    stepLabel: string;
    step01Title: string;
    step01Body: string;
    step02Title: string;
    step02Body: string;
    step03Title: string;
    step03Body: string;
    step04Title: string;
    step04Body: string;
  };
  fit: {
    bestForEyebrow: string;
    bestForRetail: string;
    bestForServices: string;
    bestForDivisions: string;
    notYetEyebrow: string;
    notYetColdChain: string;
    notYetCrossBorder: string;
    notYetHazmat: string;
  };
  closing: {
    eyebrow: string;
    title: string;
    body: string;
    quoteCta: string;
    dispatchCta: string;
  };
};

const LOGISTICS_BUSINESS_COPY_EN: LogisticsBusinessCopy = {
  metadata: {
    title: "Business logistics | Henry Onyx Logistics",
    description:
      "Repeat routes, governed pricing, and account-level visibility for business shippers.",
  },
  hero: {
    eyebrow: "For operators",
    title: "Built for operators.",
    body: "Public booking and tracking run on the same shipment model used internally. Business shippers get predictable pricing, milestone visibility, proof-of-delivery discipline, and the shared HenryCo account for receipts, notifications, and support history.",
    quoteCta: "Quote a real lane",
    accountCta: "Open logistics in account",
    compareCta: "Compare service tiers",
  },
  credibility: {
    pricingLabel: "Pricing",
    pricingValue: "Governed, traceable per lane",
    visibilityLabel: "Visibility",
    visibilityValue: "Milestones + POD per shipment",
    continuityLabel: "Continuity",
    continuityValue: "Saved lanes, contacts, profiles",
  },
  standards: {
    eyebrow: "Three operating standards",
    repeatLanesTitle: "Repeat lanes without rebuilding paperwork",
    repeatLanesBody:
      "Saved pickup and delivery pairs, common contacts, and parcel profiles carry forward — drivers see the same instructions across every booking.",
    escalationsTitle: "Escalations with audit-friendly history",
    escalationsBody:
      "Issues become structured records: who reported, what changed, when dispatch acted. Finance and operations read from the same trail.",
    premiumTitle: "Quality that holds under operational stress",
    premiumBody:
      "Difficult lanes, partial deliveries, and rerouting still surface clean milestones to the recipient — quality holds even when routing gets noisy.",
  },
  path: {
    eyebrow: "How it scales after the first lane",
    stepLabel: "Step",
    step01Title: "Quote a representative lane",
    step01Body:
      "Use the public quote to get a real number for your most common origin–destination pair, then we calibrate from there.",
    step02Title: "Open the account hub",
    step02Body:
      "Inside your HenryCo account, the logistics workspace stores receipts, milestone history, and notification routing for finance/ops.",
    step03Title: "Run the volume",
    step03Body:
      "Repeat bookings reuse saved profiles. Tracking codes are issued on booking; proof-of-delivery records attach to the right invoice.",
    step04Title: "Reconcile cleanly",
    step04Body:
      "Each shipment carries to one statement with the lane, service tier, and any handling line items — no “misc” surprises.",
  },
  fit: {
    bestForEyebrow: "Best for",
    bestForRetail:
      "Retail and DTC brands replenishing stock or fulfilling repeat orders across the same metro lanes.",
    bestForServices:
      "Professional services moving documents, samples, or kit on a predictable rhythm.",
    bestForDivisions:
      "HenryCo divisions and partners coordinating internal handoffs without ad-hoc paperwork.",
    notYetEyebrow: "Not a fit yet",
    notYetColdChain:
      "Cold-chain or temperature-controlled freight requiring specialised containers — let us know in advance and we’ll route accordingly.",
    notYetCrossBorder:
      "International cross-border movements — domestic lanes are the published service surface today.",
    notYetHazmat:
      "Hazardous-materials shipments — handled separately under direct ops contact, not via public booking.",
  },
  closing: {
    eyebrow: "Ready to talk volume?",
    title:
      "Send a representative quote — we’ll respond with a realistic operating picture.",
    body: "Quote → confirm the lanes → open the account hub. No sales theatre, no paperwork wall.",
    quoteCta: "Quote a lane",
    dispatchCta: "Talk to dispatch",
  },
};

const LOGISTICS_BUSINESS_COPY_FR: DeepPartial<LogisticsBusinessCopy> = {
  metadata: {
    title: "Logistique pour entreprises | Henry Onyx Logistics",
    description:
      "Itinéraires récurrents, tarification encadrée et visibilité à l’échelle du compte pour les expéditeurs professionnels.",
  },
  hero: {
    eyebrow: "Pour les opérateurs",
    title: "Conçu pour les opérateurs.",
    body: "La réservation et le suivi publics tournent sur le même modèle d’expédition utilisé en interne. Les expéditeurs professionnels bénéficient d’une tarification prévisible, d’une visibilité sur les jalons, d’une rigueur sur la preuve de livraison et du compte HenryCo partagé pour les reçus, les notifications et l’historique d’assistance.",
    quoteCta: "Obtenir un devis pour une vraie ligne",
    accountCta: "Ouvrir la logistique dans le compte",
    compareCta: "Comparer les niveaux de service",
  },
  credibility: {
    pricingLabel: "Tarification",
    pricingValue: "Encadrée et traçable par ligne",
    visibilityLabel: "Visibilité",
    visibilityValue: "Jalons et POD par envoi",
    continuityLabel: "Continuité",
    continuityValue: "Lignes, contacts et profils enregistrés",
  },
  standards: {
    eyebrow: "Trois standards d’exploitation",
    repeatLanesTitle: "Lignes récurrentes sans refaire la paperasse",
    repeatLanesBody:
      "Les paires enlèvement-livraison enregistrées, les contacts habituels et les profils de colis se reportent — les chauffeurs voient les mêmes instructions à chaque réservation.",
    escalationsTitle: "Escalades avec un historique exploitable",
    escalationsBody:
      "Les incidents deviennent des dossiers structurés : qui a signalé, ce qui a changé, quand l’expédition a agi. Finance et exploitation lisent la même piste.",
    premiumTitle: "Une qualité qui tient sous la tension opérationnelle",
    premiumBody:
      "Lignes difficiles, livraisons partielles, réacheminements — le destinataire voit toujours des jalons clairs. La qualité tient même quand le routage devient bruyant.",
  },
  path: {
    eyebrow: "Comment cela monte en charge après la première ligne",
    stepLabel: "Étape",
    step01Title: "Demandez un devis pour une ligne représentative",
    step01Body:
      "Utilisez le devis public pour obtenir un vrai chiffre sur votre paire origine-destination la plus fréquente, puis nous calibrons à partir de là.",
    step02Title: "Ouvrez le hub du compte",
    step02Body:
      "Dans votre compte HenryCo, l’espace logistique conserve reçus, historique des jalons et acheminement des notifications pour la finance et l’exploitation.",
    step03Title: "Faites tourner le volume",
    step03Body:
      "Les réservations récurrentes réutilisent les profils enregistrés. Les codes de suivi sont émis dès la réservation ; la preuve de livraison s’attache à la bonne facture.",
    step04Title: "Réconciliez proprement",
    step04Body:
      "Chaque expédition se reporte sur un seul relevé avec la ligne, le niveau de service et les éventuelles lignes de manutention — pas de surprises « divers ».",
  },
  fit: {
    bestForEyebrow: "Idéal pour",
    bestForRetail:
      "Les marques de retail et de DTC qui réapprovisionnent les stocks ou exécutent des commandes récurrentes sur les mêmes lignes urbaines.",
    bestForServices:
      "Les services professionnels qui déplacent documents, échantillons ou équipements selon un rythme prévisible.",
    bestForDivisions:
      "Les divisions HenryCo et leurs partenaires qui coordonnent des transferts internes sans paperasse ad hoc.",
    notYetEyebrow: "Pas encore adapté",
    notYetColdChain:
      "Chaîne du froid ou fret à température contrôlée nécessitant des conteneurs spécifiques — prévenez-nous à l’avance et nous adapterons l’acheminement.",
    notYetCrossBorder:
      "Mouvements internationaux transfrontaliers — les lignes domestiques sont aujourd’hui la surface de service publiée.",
    notYetHazmat:
      "Expéditions de matières dangereuses — traitées séparément en contact direct avec l’exploitation, pas via la réservation publique.",
  },
  closing: {
    eyebrow: "Prêt à parler volume ?",
    title:
      "Envoyez un devis représentatif — nous répondrons avec une image opérationnelle réaliste.",
    body: "Devis → confirmation des lignes → ouverture du hub de compte. Pas de théâtre commercial, pas de mur de paperasse.",
    quoteCta: "Demander un devis",
    dispatchCta: "Parler à l’exploitation",
  },
};

const LOGISTICS_BUSINESS_COPY_ES: DeepPartial<LogisticsBusinessCopy> = {
  metadata: {
    title: "Logística para empresas | Henry Onyx Logistics",
    description:
      "Rutas recurrentes, precios regulados y visibilidad a nivel de cuenta para empresas remitentes.",
  },
  hero: {
    eyebrow: "Para operadores",
    title: "Diseñado para operadores.",
    body: "La reserva y el seguimiento públicos funcionan sobre el mismo modelo de envío que se usa internamente. Las empresas remitentes obtienen precios predecibles, visibilidad de hitos, disciplina en la prueba de entrega y la cuenta HenryCo compartida para recibos, notificaciones e historial de soporte.",
    quoteCta: "Cotizar una ruta real",
    accountCta: "Abrir logística en la cuenta",
    compareCta: "Comparar niveles de servicio",
  },
  credibility: {
    pricingLabel: "Precio",
    pricingValue: "Regulado y trazable por ruta",
    visibilityLabel: "Visibilidad",
    visibilityValue: "Hitos y POD por envío",
    continuityLabel: "Continuidad",
    continuityValue: "Rutas, contactos y perfiles guardados",
  },
  standards: {
    eyebrow: "Tres estándares operativos",
    repeatLanesTitle: "Rutas recurrentes sin rehacer el papeleo",
    repeatLanesBody:
      "Las parejas de recogida y entrega guardadas, los contactos habituales y los perfiles de paquete se mantienen — los conductores ven las mismas instrucciones en cada reserva.",
    escalationsTitle: "Escalaciones con historial auditable",
    escalationsBody:
      "Las incidencias se vuelven registros estructurados: quién avisó, qué cambió, cuándo actuó el despacho. Finanzas y operaciones leen el mismo rastro.",
    premiumTitle: "Calidad que se mantiene bajo presión operativa",
    premiumBody:
      "Rutas difíciles, entregas parciales y reencaminamientos siguen mostrando hitos claros al destinatario — la calidad se mantiene aunque el routing se complique.",
  },
  path: {
    eyebrow: "Cómo escala tras la primera ruta",
    stepLabel: "Paso",
    step01Title: "Cotice una ruta representativa",
    step01Body:
      "Use la cotización pública para obtener un número real sobre su par origen-destino más habitual; a partir de ahí calibramos.",
    step02Title: "Abra el hub de la cuenta",
    step02Body:
      "Dentro de su cuenta HenryCo, el espacio de logística guarda recibos, historial de hitos y enrutamiento de notificaciones para finanzas y operaciones.",
    step03Title: "Ponga en marcha el volumen",
    step03Body:
      "Las reservas recurrentes reutilizan los perfiles guardados. Los códigos de seguimiento se emiten al reservar; la prueba de entrega se adjunta a la factura correcta.",
    step04Title: "Reconcilie con limpieza",
    step04Body:
      "Cada envío se vuelca en un único extracto con la ruta, el nivel de servicio y las partidas de manejo — sin sorpresas «varios».",
  },
  fit: {
    bestForEyebrow: "Ideal para",
    bestForRetail:
      "Marcas de retail y DTC que reponen stock o cumplen pedidos recurrentes en las mismas rutas urbanas.",
    bestForServices:
      "Servicios profesionales que mueven documentos, muestras o material a un ritmo predecible.",
    bestForDivisions:
      "Divisiones de HenryCo y socios que coordinan traspasos internos sin papeleo improvisado.",
    notYetEyebrow: "Aún no es buen encaje",
    notYetColdChain:
      "Cadena de frío o carga con temperatura controlada que requiere contenedores específicos — avísenos con antelación y enrutaremos en consecuencia.",
    notYetCrossBorder:
      "Movimientos internacionales transfronterizos — hoy las rutas domésticas son la superficie de servicio publicada.",
    notYetHazmat:
      "Envíos de mercancías peligrosas — se gestionan por separado mediante contacto directo con operaciones, no por reserva pública.",
  },
  closing: {
    eyebrow: "¿Listo para hablar de volumen?",
    title:
      "Envíe una cotización representativa — responderemos con una imagen operativa realista.",
    body: "Cotización → confirmar las rutas → abrir el hub de la cuenta. Sin teatro comercial, sin muro de papeleo.",
    quoteCta: "Cotizar una ruta",
    dispatchCta: "Hablar con despacho",
  },
};

const LOGISTICS_BUSINESS_COPY_PT: DeepPartial<LogisticsBusinessCopy> = {
  metadata: {
    title: "Logística empresarial | Henry Onyx Logistics",
    description:
      "Rotas recorrentes, preços regulamentados e visibilidade ao nível da conta para expedidores empresariais.",
  },
  hero: {
    eyebrow: "Para operadores",
    title: "Pensado para operadores.",
    body: "A reserva e o rastreamento públicos correm no mesmo modelo de envio usado internamente. Os expedidores empresariais ganham preços previsíveis, visibilidade de marcos, disciplina no comprovativo de entrega e a conta HenryCo partilhada para recibos, notificações e histórico de apoio.",
    quoteCta: "Pedir orçamento para uma rota real",
    accountCta: "Abrir logística na conta",
    compareCta: "Comparar níveis de serviço",
  },
  credibility: {
    pricingLabel: "Preço",
    pricingValue: "Regulamentado e rastreável por rota",
    visibilityLabel: "Visibilidade",
    visibilityValue: "Marcos e POD por envio",
    continuityLabel: "Continuidade",
    continuityValue: "Rotas, contactos e perfis guardados",
  },
  standards: {
    eyebrow: "Três padrões operacionais",
    repeatLanesTitle: "Rotas recorrentes sem refazer a burocracia",
    repeatLanesBody:
      "Pares de recolha e entrega guardados, contactos habituais e perfis de encomenda transitam — os motoristas veem as mesmas instruções em cada reserva.",
    escalationsTitle: "Escalonamentos com histórico auditável",
    escalationsBody:
      "Os incidentes tornam-se registos estruturados: quem reportou, o que mudou, quando o despacho agiu. Finanças e operações leem o mesmo rasto.",
    premiumTitle: "Qualidade que se mantém sob pressão operacional",
    premiumBody:
      "Rotas difíceis, entregas parciais e reencaminhamento continuam a apresentar marcos limpos ao destinatário — a qualidade aguenta mesmo quando o roteamento fica ruidoso.",
  },
  path: {
    eyebrow: "Como escala depois da primeira rota",
    stepLabel: "Passo",
    step01Title: "Peça orçamento para uma rota representativa",
    step01Body:
      "Use o orçamento público para obter um número real para o seu par origem-destino mais comum; a partir daí calibramos.",
    step02Title: "Abra o hub da conta",
    step02Body:
      "Dentro da sua conta HenryCo, o espaço de logística guarda recibos, histórico de marcos e encaminhamento de notificações para finanças e operações.",
    step03Title: "Faça correr o volume",
    step03Body:
      "As reservas recorrentes reutilizam perfis guardados. Os códigos de rastreamento são emitidos na reserva; o comprovativo de entrega anexa-se à fatura certa.",
    step04Title: "Concilie de forma limpa",
    step04Body:
      "Cada envio cai num único extrato com a rota, o nível de serviço e quaisquer linhas de manuseio — sem surpresas «diversos».",
  },
  fit: {
    bestForEyebrow: "Ideal para",
    bestForRetail:
      "Marcas de retalho e DTC que repõem stock ou cumprem encomendas recorrentes nas mesmas rotas urbanas.",
    bestForServices:
      "Serviços profissionais que movimentam documentos, amostras ou material com um ritmo previsível.",
    bestForDivisions:
      "Divisões da HenryCo e parceiros que coordenam transferências internas sem burocracia improvisada.",
    notYetEyebrow: "Ainda não encaixa",
    notYetColdChain:
      "Cadeia de frio ou carga com temperatura controlada que exige contentores específicos — avise-nos com antecedência e encaminharemos em conformidade.",
    notYetCrossBorder:
      "Movimentos internacionais transfronteiriços — hoje as rotas domésticas são a superfície de serviço publicada.",
    notYetHazmat:
      "Envios de matérias perigosas — tratados em separado por contacto direto com operações, não pela reserva pública.",
  },
  closing: {
    eyebrow: "Pronto para falar de volume?",
    title:
      "Envie um orçamento representativo — responderemos com uma imagem operacional realista.",
    body: "Orçamento → confirmar as rotas → abrir o hub da conta. Sem teatro comercial, sem muro de burocracia.",
    quoteCta: "Pedir orçamento",
    dispatchCta: "Falar com o despacho",
  },
};

const LOGISTICS_BUSINESS_COPY_AR: DeepPartial<LogisticsBusinessCopy> = {
  metadata: {
    title: "الخدمات اللوجستية للأعمال | Henry Onyx Logistics",
    description:
      "خطوط متكررة وتسعير منضبط ورؤية على مستوى الحساب لمُرسلي الأعمال.",
  },
  hero: {
    eyebrow: "للمشغّلين",
    title: "مصمَّم للمشغّلين.",
    body: "يعمل الحجز والتتبع العامّان على نموذج الشحن نفسه المستخدم داخليًا. يحصل مُرسِلو الأعمال على تسعير يمكن توقعه، ورؤية للمراحل، وانضباط في إثبات التسليم، وحساب HenryCo المشترك للفواتير والإشعارات وسجل الدعم.",
    quoteCta: "اطلب عرضًا لخط حقيقي",
    accountCta: "افتح الخدمات اللوجستية في الحساب",
    compareCta: "قارن مستويات الخدمة",
  },
  credibility: {
    pricingLabel: "التسعير",
    pricingValue: "منضبط ويمكن تتبعه لكل خط",
    visibilityLabel: "الرؤية",
    visibilityValue: "مراحل وإثبات تسليم لكل شحنة",
    continuityLabel: "الاستمرارية",
    continuityValue: "خطوط وجهات اتصال وملفات محفوظة",
  },
  standards: {
    eyebrow: "ثلاثة معايير تشغيلية",
    repeatLanesTitle: "خطوط متكررة دون إعادة بناء الأوراق",
    repeatLanesBody:
      "أزواج الاستلام والتسليم المحفوظة وجهات الاتصال المعتادة وملفات الطرود تنتقل معك — يرى السائقون التعليمات نفسها في كل حجز.",
    escalationsTitle: "تصعيدات بسجل قابل للتدقيق",
    escalationsBody:
      "تتحول المشكلات إلى سجلات منظمة: مَن أبلغ، وما الذي تغيّر، ومتى تحرّك الإرسال. تقرأ المالية والعمليات المسار نفسه.",
    premiumTitle: "جودة تصمد تحت ضغط التشغيل",
    premiumBody:
      "الخطوط الصعبة والتسليمات الجزئية وإعادة التوجيه تبقى تُظهر للمستلِم مراحل واضحة — الجودة تصمد حتى عندما يصبح التوجيه مزعجًا.",
  },
  path: {
    eyebrow: "كيف يتسع الأمر بعد الخط الأول",
    stepLabel: "خطوة",
    step01Title: "احصل على عرض لخط تمثيلي",
    step01Body:
      "استخدم العرض العام للحصول على رقم حقيقي لأكثر زوج منشأ-وجهة لديك تكرارًا، ثم نعاير من هناك.",
    step02Title: "افتح مركز الحساب",
    step02Body:
      "داخل حسابك في HenryCo، تحفظ مساحة الخدمات اللوجستية الفواتير وسجل المراحل وتوجيه الإشعارات للمالية والعمليات.",
    step03Title: "شغّل الحجم",
    step03Body:
      "تعيد الحجوزات المتكررة استخدام الملفات المحفوظة. تُصدَر رموز التتبع عند الحجز، ويُرفَق إثبات التسليم بالفاتورة الصحيحة.",
    step04Title: "نظّم الحسابات بنظافة",
    step04Body:
      "تنتقل كل شحنة إلى كشف واحد مع الخط ومستوى الخدمة وأي بنود مناولة — دون مفاجآت «متفرقات».",
  },
  fit: {
    bestForEyebrow: "الأنسب لـ",
    bestForRetail:
      "علامات التجزئة والبيع المباشر التي تعيد تعبئة المخزون أو تنفذ طلبات متكررة على الخطوط الحضرية نفسها.",
    bestForServices:
      "الخدمات المهنية التي تنقل الوثائق أو العينات أو المعدات بإيقاع يمكن توقعه.",
    bestForDivisions:
      "أقسام HenryCo والشركاء الذين ينسقون عمليات التسليم الداخلية دون أوراق عشوائية.",
    notYetEyebrow: "ليس مناسبًا بعد",
    notYetColdChain:
      "سلسلة التبريد أو الشحن بدرجة حرارة منضبطة الذي يحتاج حاويات متخصصة — أبلغنا مسبقًا وسنوجّه وفقًا لذلك.",
    notYetCrossBorder:
      "النقل الدولي عبر الحدود — اليوم الخطوط المحلية هي سطح الخدمة المعلن.",
    notYetHazmat:
      "شحنات المواد الخطرة — تُعالَج بشكل منفصل عبر اتصال مباشر بالعمليات، لا عبر الحجز العام.",
  },
  closing: {
    eyebrow: "جاهز للحديث عن الحجم؟",
    title: "أرسل عرض سعر تمثيلي — وسنردّ بصورة تشغيلية واقعية.",
    body: "عرض السعر → تأكيد الخطوط → فتح مركز الحساب. لا استعراض مبيعات ولا جدار من الأوراق.",
    quoteCta: "اطلب عرض سعر",
    dispatchCta: "تحدّث إلى الإرسال",
  },
};

const LOGISTICS_BUSINESS_COPY_DE: DeepPartial<LogisticsBusinessCopy> = {
  metadata: {
    title: "Geschäftslogistik | Henry Onyx Logistics",
    description:
      "Wiederkehrende Routen, geregelte Preise und Sichtbarkeit auf Kontoebene für Geschäftsversender.",
  },
  hero: {
    eyebrow: "Für Operator",
    title: "Für Operator gebaut.",
    body: "Öffentliche Buchung und Tracking laufen auf demselben Sendungsmodell, das auch intern verwendet wird. Geschäftsversender bekommen kalkulierbare Preise, Meilensteintransparenz, Disziplin beim Zustellnachweis und das gemeinsame HenryCo-Konto für Belege, Benachrichtigungen und Support-Historie.",
    quoteCta: "Angebot für eine reale Route",
    accountCta: "Logistik im Konto öffnen",
    compareCta: "Service-Stufen vergleichen",
  },
  credibility: {
    pricingLabel: "Preis",
    pricingValue: "Geregelt und je Route nachvollziehbar",
    visibilityLabel: "Sichtbarkeit",
    visibilityValue: "Meilensteine und POD pro Sendung",
    continuityLabel: "Kontinuität",
    continuityValue: "Gespeicherte Routen, Kontakte, Profile",
  },
  standards: {
    eyebrow: "Drei Betriebsstandards",
    repeatLanesTitle: "Wiederkehrende Routen ohne neue Papierarbeit",
    repeatLanesBody:
      "Gespeicherte Abhol- und Zustellpaare, übliche Kontakte und Sendungsprofile übertragen sich — Fahrer sehen bei jeder Buchung dieselben Anweisungen.",
    escalationsTitle: "Eskalationen mit prüfbarer Historie",
    escalationsBody:
      "Vorfälle werden zu strukturierten Datensätzen: wer gemeldet hat, was sich geändert hat, wann die Disposition reagiert hat. Finanzen und Betrieb lesen aus derselben Spur.",
    premiumTitle: "Qualität, die unter operativem Druck standhält",
    premiumBody:
      "Schwierige Routen, Teil-Zustellungen und Umroutungen zeigen dem Empfänger weiterhin saubere Meilensteine — Qualität hält, selbst wenn das Routing unruhig wird.",
  },
  path: {
    eyebrow: "Wie es nach der ersten Route skaliert",
    stepLabel: "Schritt",
    step01Title: "Holen Sie ein Angebot für eine repräsentative Route ein",
    step01Body:
      "Nutzen Sie das öffentliche Angebot, um eine echte Zahl für Ihr häufigstes Start-Ziel-Paar zu erhalten — von dort aus kalibrieren wir.",
    step02Title: "Öffnen Sie das Konto-Hub",
    step02Body:
      "In Ihrem HenryCo-Konto speichert der Logistik-Arbeitsbereich Belege, Meilensteinhistorie und Benachrichtigungsrouting für Finanzen und Betrieb.",
    step03Title: "Lassen Sie das Volumen laufen",
    step03Body:
      "Wiederkehrende Buchungen nutzen gespeicherte Profile erneut. Tracking-Codes werden bei der Buchung vergeben; Zustellnachweise hängen sich an die richtige Rechnung.",
    step04Title: "Sauber abrechnen",
    step04Body:
      "Jede Sendung läuft in eine einzige Abrechnung mit Route, Service-Stufe und etwaigen Handling-Posten — keine «Sonstiges»-Überraschungen.",
  },
  fit: {
    bestForEyebrow: "Am besten geeignet für",
    bestForRetail:
      "Retail- und DTC-Marken, die Bestände nachfüllen oder wiederkehrende Bestellungen über dieselben Stadtstrecken erfüllen.",
    bestForServices:
      "Professionelle Dienstleistungen, die Dokumente, Muster oder Equipment in vorhersehbarer Frequenz bewegen.",
    bestForDivisions:
      "HenryCo-Divisionen und Partner, die interne Übergaben ohne improvisierte Papierarbeit koordinieren.",
    notYetEyebrow: "Noch nicht passend",
    notYetColdChain:
      "Kühlkette oder temperaturgeführte Fracht, die Spezialcontainer erfordert — sagen Sie uns früh Bescheid, dann routen wir entsprechend.",
    notYetCrossBorder:
      "Internationale grenzüberschreitende Transporte — heute sind nationale Strecken die veröffentlichte Servicefläche.",
    notYetHazmat:
      "Gefahrgut-Sendungen — werden separat über direkten Betriebs-Kontakt abgewickelt, nicht über die öffentliche Buchung.",
  },
  closing: {
    eyebrow: "Bereit, über Volumen zu sprechen?",
    title:
      "Senden Sie ein repräsentatives Angebot — wir antworten mit einem realistischen Betriebsbild.",
    body: "Angebot → Routen bestätigen → Konto-Hub öffnen. Kein Vertriebstheater, keine Papierwand.",
    quoteCta: "Angebot anfordern",
    dispatchCta: "Mit der Disposition sprechen",
  },
};

const LOGISTICS_BUSINESS_COPY_IT: DeepPartial<LogisticsBusinessCopy> = {
  metadata: {
    title: "Logistica per le imprese | Henry Onyx Logistics",
    description:
      "Tratte ricorrenti, tariffe regolate e visibilità a livello di account per gli spedizionieri aziendali.",
  },
  hero: {
    eyebrow: "Per gli operatori",
    title: "Costruita per gli operatori.",
    body: "Prenotazione e tracciamento pubblici girano sullo stesso modello di spedizione usato internamente. Gli spedizionieri aziendali ottengono tariffe prevedibili, visibilità sulle tappe, disciplina sulla prova di consegna e l’account HenryCo condiviso per ricevute, notifiche e storico assistenza.",
    quoteCta: "Richiedi un preventivo per una tratta reale",
    accountCta: "Apri la logistica nell’account",
    compareCta: "Confronta i livelli di servizio",
  },
  credibility: {
    pricingLabel: "Tariffa",
    pricingValue: "Regolata e tracciabile per tratta",
    visibilityLabel: "Visibilità",
    visibilityValue: "Tappe e POD per spedizione",
    continuityLabel: "Continuità",
    continuityValue: "Tratte, contatti e profili salvati",
  },
  standards: {
    eyebrow: "Tre standard operativi",
    repeatLanesTitle: "Tratte ricorrenti senza rifare la modulistica",
    repeatLanesBody:
      "Le coppie di ritiro e consegna salvate, i contatti abituali e i profili dei colli si portano avanti — i corrieri vedono le stesse istruzioni a ogni prenotazione.",
    escalationsTitle: "Escalation con uno storico verificabile",
    escalationsBody:
      "Gli incidenti diventano record strutturati: chi ha segnalato, cosa è cambiato, quando il dispatch è intervenuto. Finanza e operations leggono dallo stesso percorso.",
    premiumTitle: "Qualità che regge sotto stress operativo",
    premiumBody:
      "Tratte difficili, consegne parziali e ricalcolo del routing continuano a mostrare al destinatario tappe pulite — la qualità tiene anche quando il routing si fa rumoroso.",
  },
  path: {
    eyebrow: "Come scala dopo la prima tratta",
    stepLabel: "Passo",
    step01Title: "Richiedi un preventivo per una tratta rappresentativa",
    step01Body:
      "Usa il preventivo pubblico per ottenere un numero reale sulla tua coppia origine-destinazione più frequente, poi calibriamo da lì.",
    step02Title: "Apri l’hub dell’account",
    step02Body:
      "Dentro il tuo account HenryCo, lo spazio logistica conserva ricevute, storico delle tappe e instradamento delle notifiche per finanza e operations.",
    step03Title: "Fai girare il volume",
    step03Body:
      "Le prenotazioni ricorrenti riutilizzano i profili salvati. I codici di tracciamento vengono emessi alla prenotazione; la prova di consegna si aggancia alla fattura giusta.",
    step04Title: "Riconcilia in modo pulito",
    step04Body:
      "Ogni spedizione confluisce in un solo estratto conto con tratta, livello di servizio ed eventuali voci di manipolazione — niente sorprese «varie».",
  },
  fit: {
    bestForEyebrow: "Indicato per",
    bestForRetail:
      "Marchi retail e DTC che riforniscono lo stock o evadono ordini ricorrenti sulle stesse tratte urbane.",
    bestForServices:
      "Servizi professionali che muovono documenti, campioni o attrezzature con cadenza prevedibile.",
    bestForDivisions:
      "Divisioni HenryCo e partner che coordinano passaggi interni senza modulistica improvvisata.",
    notYetEyebrow: "Non ancora adatto",
    notYetColdChain:
      "Catena del freddo o trasporto a temperatura controllata che richiede container dedicati — segnalalo in anticipo e instraderemo di conseguenza.",
    notYetCrossBorder:
      "Movimenti internazionali transfrontalieri — oggi le tratte nazionali sono la superficie di servizio pubblicata.",
    notYetHazmat:
      "Spedizioni di materiali pericolosi — gestite a parte tramite contatto diretto con le operations, non dalla prenotazione pubblica.",
  },
  closing: {
    eyebrow: "Pronto a parlare di volumi?",
    title:
      "Invia un preventivo rappresentativo — risponderemo con una fotografia operativa realistica.",
    body: "Preventivo → conferma delle tratte → apertura dell’hub account. Niente teatro commerciale, niente muro di carta.",
    quoteCta: "Richiedi un preventivo",
    dispatchCta: "Parla con il dispatch",
  },
};

const LOGISTICS_BUSINESS_COPY_ZH: DeepPartial<LogisticsBusinessCopy> = {
  metadata: {
    title: "企业物流 | Henry Onyx Logistics",
    description: "为企业寄件方提供常态线路、规范定价与账户级可见度。",
  },
  hero: {
    eyebrow: "面向运营者",
    title: "为运营者而生。",
    body: "公开下单与追踪运行在与内部相同的运单模型之上。企业寄件方可获得可预期的定价、里程碑可见度、严谨的送达凭证,以及共享的 HenryCo 账户来管理凭证、通知与支持记录。",
    quoteCta: "对一条真实线路报价",
    accountCta: "在账户中打开物流",
    compareCta: "对比服务等级",
  },
  credibility: {
    pricingLabel: "定价",
    pricingValue: "按线路规范且可追溯",
    visibilityLabel: "可见度",
    visibilityValue: "每单的里程碑与送达凭证",
    continuityLabel: "连续性",
    continuityValue: "已保存的线路、联系人与档案",
  },
  standards: {
    eyebrow: "三项运营标准",
    repeatLanesTitle: "常态线路无需重做文书",
    repeatLanesBody:
      "已保存的取派配对、常用联系人与包裹档案会延续下去——司机在每一次下单中看到相同的指令。",
    escalationsTitle: "可审计的升级处理记录",
    escalationsBody:
      "问题转化为结构化记录:谁上报、变更了什么、调度何时介入。财务与运营读到同一条线索。",
    premiumTitle: "高压运行下质量依然稳定",
    premiumBody:
      "难送线路、部分送达与改线仍然向收件方呈现清晰的里程碑——即便路径变得嘈杂,质量也撑得住。",
  },
  path: {
    eyebrow: "第一条线路之后如何扩展",
    stepLabel: "步骤",
    step01Title: "为一条代表性线路报价",
    step01Body:
      "用公开报价拿到你最常见的起讫点对的真实数字,我们再据此校准。",
    step02Title: "打开账户中心",
    step02Body:
      "在你的 HenryCo 账户里,物流工作区保存凭证、里程碑历史以及面向财务与运营的通知路由。",
    step03Title: "把量跑起来",
    step03Body:
      "重复下单会复用已保存的档案。追踪码在下单时发放;送达凭证挂到正确的发票上。",
    step04Title: "对账清爽",
    step04Body:
      "每一票都汇入同一份对账单,包含线路、服务等级与任何处理明细——没有“杂项”惊喜。",
  },
  fit: {
    bestForEyebrow: "适合",
    bestForRetail: "在相同城市线路上补货或履行常态订单的零售与 DTC 品牌。",
    bestForServices: "在可预测节奏中递送文件、样品或物料的专业服务团队。",
    bestForDivisions: "在内部交接中无需临时文书的 HenryCo 各事业部与合作伙伴。",
    notYetEyebrow: "目前还不适合",
    notYetColdChain:
      "需要专用容器的冷链或控温运输——请提前告知,我们会做相应安排。",
    notYetCrossBorder: "国际跨境运输——目前公开的服务面是国内线路。",
    notYetHazmat: "危险品运输——通过运营直连单独处理,不走公开下单。",
  },
  closing: {
    eyebrow: "准备好谈量了吗?",
    title: "发来一份代表性的报价请求——我们会回以真实的运营画面。",
    body: "报价 → 确认线路 → 打开账户中心。没有销售表演,没有文书围墙。",
    quoteCta: "对一条线路报价",
    dispatchCta: "与调度对话",
  },
};

const LOGISTICS_BUSINESS_COPY_HI: DeepPartial<LogisticsBusinessCopy> = {
  metadata: {
    title: "व्यवसायिक लॉजिस्टिक्स | Henry Onyx Logistics",
    description:
      "व्यवसायिक प्रेषकों के लिए दोहराई जाने वाली रूट, नियंत्रित मूल्य निर्धारण और खाता-स्तरीय दृश्यता।",
  },
  hero: {
    eyebrow: "ऑपरेटरों के लिए",
    title: "ऑपरेटरों के लिए बनाया गया।",
    body: "सार्वजनिक बुकिंग और ट्रैकिंग उसी शिपमेंट मॉडल पर चलती है जिसे अंदर इस्तेमाल होता है। व्यवसायिक प्रेषकों को पूर्वानुमेय मूल्य, माइलस्टोन की दृश्यता, डिलीवरी प्रमाण का अनुशासन और रसीद, सूचना तथा सहायता इतिहास के लिए साझा HenryCo खाता मिलता है।",
    quoteCta: "एक असली रूट पर कोटेशन लें",
    accountCta: "खाते में लॉजिस्टिक्स खोलें",
    compareCta: "सेवा स्तर तुलना करें",
  },
  credibility: {
    pricingLabel: "मूल्य",
    pricingValue: "हर रूट पर नियंत्रित और ट्रैस करने योग्य",
    visibilityLabel: "दृश्यता",
    visibilityValue: "हर शिपमेंट पर माइलस्टोन और POD",
    continuityLabel: "निरंतरता",
    continuityValue: "सहेजी हुई रूट, संपर्क और प्रोफ़ाइलें",
  },
  standards: {
    eyebrow: "तीन परिचालन मानक",
    repeatLanesTitle: "बिना दस्तावेज़ी दोहराव के दोहराई जाने वाली रूट",
    repeatLanesBody:
      "सहेजे गए पिकअप-डिलीवरी जोड़े, सामान्य संपर्क और पार्सल प्रोफ़ाइलें आगे बढ़ती हैं — हर बुकिंग में चालकों को वही निर्देश दिखते हैं।",
    escalationsTitle: "ऑडिट-अनुकूल इतिहास के साथ एस्केलेशन",
    escalationsBody:
      "मुद्दे संरचित रिकॉर्ड बनते हैं: किसने रिपोर्ट किया, क्या बदला, डिस्पैच ने कब कार्रवाई की। वित्त और संचालन एक ही पथ से पढ़ते हैं।",
    premiumTitle: "परिचालन दबाव में भी बरकरार गुणवत्ता",
    premiumBody:
      "कठिन रूट, आंशिक डिलीवरी और पुनर्मार्गण के बावजूद पाने वाले को स्पष्ट माइलस्टोन दिखते हैं — रूटिंग में शोर हो तो भी गुणवत्ता टिकती है।",
  },
  path: {
    eyebrow: "पहली रूट के बाद यह कैसे फैलती है",
    stepLabel: "चरण",
    step01Title: "एक प्रतिनिधि रूट पर कोटेशन लें",
    step01Body:
      "अपनी सबसे आम मूल–गंतव्य जोड़ी पर असली आंकड़ा पाने के लिए सार्वजनिक कोटेशन का उपयोग करें, फिर हम वहाँ से अंशांकन करते हैं।",
    step02Title: "खाते का हब खोलें",
    step02Body:
      "आपके HenryCo खाते में, लॉजिस्टिक्स वर्कस्पेस वित्त/संचालन के लिए रसीदें, माइलस्टोन इतिहास और सूचना रूटिंग रखता है।",
    step03Title: "वॉल्यूम चलाएँ",
    step03Body:
      "दोहराई जाने वाली बुकिंग सहेजी गई प्रोफ़ाइलों का पुनः उपयोग करती हैं। ट्रैकिंग कोड बुकिंग पर जारी होते हैं; डिलीवरी प्रमाण सही इनवॉइस से जुड़ता है।",
    step04Title: "साफ-सुथरा मिलान करें",
    step04Body:
      "हर शिपमेंट एक ही स्टेटमेंट में जाती है — रूट, सेवा स्तर और कोई हैंडलिंग लाइन — कोई «विविध» का चौंकाने वाला आइटम नहीं।",
  },
  fit: {
    bestForEyebrow: "इनके लिए सबसे उपयुक्त",
    bestForRetail:
      "उन्हीं शहर रूटों पर स्टॉक पुनः भरने या दोहराए जाने वाले ऑर्डर पूरा करने वाले रिटेल और DTC ब्रांड।",
    bestForServices:
      "पूर्वानुमेय लय में दस्तावेज़, नमूने या उपकरण ले जाने वाली पेशेवर सेवाएँ।",
    bestForDivisions:
      "विशेष कागज़ी कार्रवाई के बिना आंतरिक हस्तांतरण समन्वयित करने वाले HenryCo डिवीज़न और साझेदार।",
    notYetEyebrow: "अभी उपयुक्त नहीं",
    notYetColdChain:
      "विशेष कंटेनरों की ज़रूरत वाली कोल्ड-चेन या तापमान-नियंत्रित माल — पहले से बताएँ, हम उसी अनुसार रूट करेंगे।",
    notYetCrossBorder:
      "अंतर्राष्ट्रीय सीमा-पार मूवमेंट — आज प्रकाशित सेवा घरेलू रूटों पर केंद्रित है।",
    notYetHazmat:
      "खतरनाक सामग्री की शिपमेंट — सार्वजनिक बुकिंग नहीं, सीधे संचालन संपर्क के तहत अलग से संभाली जाती है।",
  },
  closing: {
    eyebrow: "वॉल्यूम पर बात करने के लिए तैयार?",
    title:
      "एक प्रतिनिधि कोटेशन भेजें — हम यथार्थवादी परिचालन तस्वीर के साथ जवाब देंगे।",
    body: "कोटेशन → रूट की पुष्टि → खाता हब खोलें। कोई बिक्री-नाटक नहीं, कोई कागज़ी दीवार नहीं।",
    quoteCta: "एक रूट पर कोटेशन लें",
    dispatchCta: "डिस्पैच से बात करें",
  },
};

const LOGISTICS_BUSINESS_COPY_IG: DeepPartial<LogisticsBusinessCopy> = {
  metadata: {
    title: "Logistics maka azụmaahịa | Henry Onyx Logistics",
    description:
      "Ụzọ ndị na-emegharị, ọnụahịa a chịkwara, na anya na ọkwa akaụntụ maka ndị na-eziga maka azụmaahịa.",
  },
  hero: {
    eyebrow: "Maka ndị na-arụ ọrụ",
    title: "E wuru maka ndị na-arụ ọrụ.",
    body: "Ndebanye aha na nyocha ọha na-agba ọsọ n’otu ụdị mbufe a na-eji n’ime ụlọ. Ndị na-eziga maka azụmaahịa na-enweta ọnụahịa enwere ike ịkọwa, anya na nzọụkwụ, ọzụzụ n’ihe àmà nnyefe, na akaụntụ HenryCo a na-eke maka akwụkwọ ego, ọkwa na akụkọ ihe ọmụma nkwado.",
    quoteCta: "Nweta ọnụ ahịa maka ezigbo ụzọ",
    accountCta: "Mepee logistics n’akaụntụ",
    compareCta: "Tụlee ọkwa ọrụ",
  },
  credibility: {
    pricingLabel: "Ọnụ ahịa",
    pricingValue: "A chịkwara ya, enwere ike ịchọta maka ụzọ ọ bụla",
    visibilityLabel: "Anya",
    visibilityValue: "Nzọụkwụ na POD maka mbufe ọ bụla",
    continuityLabel: "Ịdị n’ihu",
    continuityValue: "Ụzọ, ndị mmadụ na profaịlụ echekwara",
  },
  standards: {
    eyebrow: "Ụkpụrụ ọrụ atọ",
    repeatLanesTitle: "Ụzọ ndị na-emegharị n’ewughachi akwụkwọ",
    repeatLanesBody:
      "Ụzọ mbutere na nbufe echekwara, ndị mmadụ a na-akpọkarị, na profaịlụ ngwugwu na-aga n’ihu — ndị ọkwọ ụgbọ ala na-ahụ otu nkuzi n’ime ndebe ọ bụla.",
    escalationsTitle: "Mmaja nwere akụkọ ezi nyocha",
    escalationsBody:
      "Nsogbu na-aghọ ihe ndekọ ahaziri ahazi: onye kọrọ, ihe gbanwere, mgbe nzipu rụrụ ọrụ. Akụnụba na ọrụ na-agụ otu okporo ụzọ.",
    premiumTitle: "Ogo na-eguzosi ike n’okpuru nrụgide ọrụ",
    premiumBody:
      "Ụzọ siri ike, nbufe akụkụ, na ngbanwe ụzọ ka na-egosipụta nzọụkwụ doro anya nye onye na-anata — àgwà na-akwụsi ike ọbụlagodi mgbe ụzọ ahụ na-eme mkpọtụ.",
  },
  path: {
    eyebrow: "Otu o si esiwanye mgbe ụzọ mbụ gachara",
    stepLabel: "Nzọụkwụ",
    step01Title: "Nweta ọnụ ahịa maka ụzọ na-anọchi anya gị",
    step01Body:
      "Jiri ọnụ ahịa ọha nweta ezigbo nọmba maka ụzọ ebe-mmalite/ebe-njedebe gị na-emegharị, anyị ga-emezigharị site n’ebe ahụ.",
    step02Title: "Mepee mkpụrụ akaụntụ",
    step02Body:
      "N’ime akaụntụ HenryCo gị, oghere logistics na-echekwa akwụkwọ ego, akụkọ nzọụkwụ na nzipu ọkwa maka akụnụba/ọrụ.",
    step03Title: "Mee ka mpịakọta ahụ rụọ ọrụ",
    step03Body:
      "Ndebe ndị na-emegharị na-ejigharị profaịlụ echekwara. A na-enye koodu nyocha n’oge ndebe; ihe àmà nnyefe na-ejikọta na akwụkwọ ego ziri ezi.",
    step04Title: "Mezuo akụnụba gị nke ọma",
    step04Body:
      "Mbufe ọ bụla na-aba n’otu nkọwa nke nwere ụzọ, ọkwa ọrụ, na ahịrị nkwado ọ bụla — enweghị mberede «dị iche iche».",
  },
  fit: {
    bestForEyebrow: "Kacha mma maka",
    bestForRetail:
      "Ndị ahịa retail na DTC na-ewughachi ngwa ahịa ma ọ bụ na-arụzu iwu ndị na-emegharị n’otu ụzọ obodo.",
    bestForServices:
      "Ọrụ ọkachamara na-ebufe akwụkwọ, ihe nlele, ma ọ bụ ngwa ọrụ n’ụkpụrụ enwere ike ịkọwa.",
    bestForDivisions:
      "Ngalaba HenryCo na ndị mmekọ na-ahazi mgbanwe ime ụlọ na-enweghị akwụkwọ mberede.",
    notYetEyebrow: "Adabaghị ugbu a",
    notYetColdChain:
      "Cold-chain ma ọ bụ ibu a chịkwara okpomọkụ ya, chọrọ akpa pụrụ iche — kọwaa anyị tupu oge erue, anyị ga-eduzi nke ọma.",
    notYetCrossBorder:
      "Mbufe mba ụwa nke gafere ókè — ụzọ ime obodo bụ elu ọrụ a kwupụtara taa.",
    notYetHazmat:
      "Mbufe ihe ize ndụ — a na-elekọta ya iche site na kpọtụrụ ọrụ kpọmkwem, ọ bụghị site na ndebe ọha.",
  },
  closing: {
    eyebrow: "Ị dị njikere ikwu maka mpịakọta?",
    title:
      "Zipu ọnụ ahịa na-anọchi anya — anyị ga-azaghachi na onyonyo ọrụ ezi.",
    body: "Ọnụ ahịa → kwado ụzọ → mepee mkpụrụ akaụntụ. Enweghị ihe ngosi ahịa, enweghị mgbidi akwụkwọ.",
    quoteCta: "Nweta ọnụ ahịa",
    dispatchCta: "Kwurịta okwu na nzipu",
  },
};

const LOGISTICS_BUSINESS_COPY_YO: DeepPartial<LogisticsBusinessCopy> = {
  metadata: {
    title: "Iṣẹ́ Logistics fún Iṣòwò | Henry Onyx Logistics",
    description:
      "Ọ̀nà àtúnṣe, ìṣètò owó tó tọ́, àti ìríran ipele-akáǹtì fún àwọn olùrànṣẹ́ iṣòwò.",
  },
  hero: {
    eyebrow: "Fún àwọn olùṣe iṣẹ́",
    title: "A kọ́ ọ́ fún àwọn olùṣe iṣẹ́.",
    body: "Ìfọwọ́sí àti àtẹ̀lé ní gbangba ń ṣiṣẹ́ lórí ìṣètò ìránṣẹ́ kan náà tí a fi ṣiṣẹ́ nínú. Àwọn olùrànṣẹ́ iṣòwò ní ìṣètò owó tó ṣe é fojú-sọ́nà, ìríran lórí ìpele, ìbáwí lórí ẹ̀rí ìfijiṣẹ́, àti akáǹtì HenryCo tí a pín fún àwọn ìwé-ẹ̀rí, ìfìránṣẹ́ àti ìtàn ìtìlẹ́yìn.",
    quoteCta: "Béèrè ìdíyelé lórí ọ̀nà gidi",
    accountCta: "Ṣí Logistics nínú akáǹtì",
    compareCta: "Fi àwọn ìpele iṣẹ́ wéra",
  },
  credibility: {
    pricingLabel: "Ìdíyelé",
    pricingValue: "Tó tọ́, tó lè tẹ̀lé fún ọ̀nà kọ̀ọ̀kan",
    visibilityLabel: "Ìríran",
    visibilityValue: "Ìpele àti POD fún ìránṣẹ́ kọ̀ọ̀kan",
    continuityLabel: "Ìtẹ̀síwájú",
    continuityValue: "Ọ̀nà, ẹni-ìbáṣepọ̀, profaílì tó tọ́jú",
  },
  standards: {
    eyebrow: "Àwọn ìlànà iṣẹ́ mẹ́ta",
    repeatLanesTitle: "Ọ̀nà àtúnṣe láìṣe ìwé-iṣẹ́ tuntun",
    repeatLanesBody:
      "Àwọn ìpín ìgbé-ìjùsílẹ̀ tó tọ́jú, àwọn ẹni-ìbáṣepọ̀ àkànṣe, àti profaílì ohun tí à ń rán ń tẹ̀síwájú — àwọn awakọ̀ máa rí ìtọ́ni kan náà lórí ìfọwọ́sí kọ̀ọ̀kan.",
    escalationsTitle: "Ìgbéga ọ̀rọ̀ pẹ̀lú ìtàn tó lè ṣe àyẹ̀wò",
    escalationsBody:
      "Ìṣòro di àkọsílẹ̀ tó dára: ta ló ròyìn, kí ló yí padà, ìgbà tí dìsípátì ṣe iṣẹ́. Ìnáwó àti iṣẹ́ ka láti inú ọ̀nà kan náà.",
    premiumTitle: "Dídára tí ó dúró ṣinṣin lábẹ́ ìṣe iṣẹ́",
    premiumBody:
      "Àwọn ọ̀nà líle, ìfijiṣẹ́ apá kan, àti ìpadàdé tún máa fi àwọn ìpele tó kọ́ hàn fún olùgbà — ìpele iṣẹ́ ṣì wà nínú tẹ̀ tó tilẹ̀ jẹ́ pé ọ̀nà ti ń lọ́pọ̀ọ̀rọ̀.",
  },
  path: {
    eyebrow: "Bí ó ṣe ń gbòòrò lẹ́yìn ọ̀nà àkọ́kọ́",
    stepLabel: "Ìgbésẹ̀",
    step01Title: "Gba ìdíyelé fún ọ̀nà tó ń ṣojú",
    step01Body:
      "Lo ìdíyelé ní gbangba láti rí nọ́mbà gidi fún ìpín orisun-ìbi-ipinnu tí o sábà máa lo, lẹ́yìn náà a máa tó.",
    step02Title: "Ṣí ibùdó akáǹtì",
    step02Body:
      "Nínú akáǹtì HenryCo rẹ, àyè logistics máa tọ́jú àwọn ìwé-ẹ̀rí, ìtàn ìpele àti ìpín ìfìránṣẹ́ fún ìnáwó àti iṣẹ́.",
    step03Title: "Mú àpapọ̀ ṣiṣẹ́",
    step03Body:
      "Àwọn ìfọwọ́sí àtúnṣe máa lo profaílì tó tọ́jú. A máa tu kóòdù àtẹ̀lé jáde nígbà ìfọwọ́sí; ẹ̀rí ìfijiṣẹ́ máa fẹsùn mọ́ ìwé-ìṣèlú yẹ̀.",
    step04Title: "Mú ìbámu wá ní mímọ́",
    step04Body:
      "Ìránṣẹ́ kọ̀ọ̀kan máa lọ sí ìpèpé kan ṣoṣo pẹ̀lú ọ̀nà, ìpele iṣẹ́ àti gbogbo ìlà ìṣàkóso — kò sí ìyàlẹ́nu «mìíràn».",
  },
  fit: {
    bestForEyebrow: "Bá àwọn wọ̀nyí mu",
    bestForRetail:
      "Àwọn àmì retail àti DTC tó ń tún ìjọ-èèyàn ṣe tàbí tí ó ń mú àwọn àbúpàdé ṣẹ lórí àwọn ọ̀nà ìlú kan náà.",
    bestForServices:
      "Àwọn iṣẹ́ ọjọ́gbọ́n tó ń gbé ìwé, àpẹẹrẹ tàbí ẹ̀rọ pẹ̀lú ìlú-pẹ̀lú-àkókò.",
    bestForDivisions:
      "Àwọn ẹ̀ka HenryCo àti àjọṣe tó ń ṣètò ìfijiṣẹ́ inú láìní ìwé alábàákù.",
    notYetEyebrow: "Kò tíì rọ́rùn fún ẹ",
    notYetColdChain:
      "Cold-chain tàbí ìránṣẹ́ tí òtútù ń ṣàkóso, tí ó nílò àpótí pàtàkì — sọ fún wa nínú àkókò, a máa tọ́nà.",
    notYetCrossBorder:
      "Ìránṣẹ́ orílẹ̀-èdè aládúgbò — lónìí àwọn ọ̀nà inú orílẹ̀ ni iṣẹ́ tí a ti tẹ̀.",
    notYetHazmat:
      "Ìránṣẹ́ ohun apànìyàn — a ń ṣe é lọ́tọ̀ọ̀tọ̀ pẹ̀lú olùṣe iṣẹ́ tààrà, kì í ṣe nípasẹ̀ ìfọwọ́sí gbangba.",
  },
  closing: {
    eyebrow: "Ṣe o ti ṣetán láti sọ̀rọ̀ àpapọ̀?",
    title:
      "Fi ìdíyelé tó ń ṣojú ránṣẹ́ — a máa fèsì pẹ̀lú àwòrán iṣẹ́ tó tọ̀nà.",
    body: "Ìdíyelé → ìfọwọ́sí àwọn ọ̀nà → ṣí ibùdó akáǹtì. Kò sí àfihàn ìtà, kò sí ògiri ìwé.",
    quoteCta: "Béèrè ìdíyelé",
    dispatchCta: "Bá dìsípátì sọ̀rọ̀",
  },
};

const LOGISTICS_BUSINESS_COPY_HA: DeepPartial<LogisticsBusinessCopy> = {
  metadata: {
    title: "Logistics na kasuwanci | Henry Onyx Logistics",
    description:
      "Hanyoyi maimaitaccen, farashi mai tsari, da gani matakin akwati ga ’yan kasuwa masu aikawa.",
  },
  hero: {
    eyebrow: "Ga masu aiki",
    title: "An gina shi don masu aiki.",
    body: "Yin rijista da bibiya na jama’a suna gudana akan irin samfurin jigilar kayan da ake amfani da shi a ciki. Masu aikawa na kasuwanci suna samun farashi mai yiwuwa hango, gani na matakai, kulawa kan tabbacin isar da kaya, da akwatin HenryCo da aka raba don rasit, sanarwa da tarihin tallafi.",
    quoteCta: "Nemo farashi don hanya ta gaske",
    accountCta: "Bude logistics a cikin akwati",
    compareCta: "Kwatanta matakan sabis",
  },
  credibility: {
    pricingLabel: "Farashi",
    pricingValue: "Mai tsari kuma mai bibiya kowace hanya",
    visibilityLabel: "Gani",
    visibilityValue: "Matakai da POD a kowace jigila",
    continuityLabel: "Ci gaba",
    continuityValue: "Hanyoyi, masu tuntuɓa da fayil ɗin da aka ajiye",
  },
  standards: {
    eyebrow: "Matakai uku na aiki",
    repeatLanesTitle: "Hanyoyi maimaitaccen ba tare da sake aikin takarda ba",
    repeatLanesBody:
      "Ma’aurata na ɗauka da sauke da aka ajiye, masu tuntuɓa na kullum, da bayanan fakitin suna ci gaba — direbobi suna ganin umarni iri ɗaya a kowace rijista.",
    escalationsTitle: "Ƙarawa tare da tarihi mai sauƙin nazari",
    escalationsBody:
      "Matsalolin sun zama bayanai masu tsari: wanda ya bayar da rahoto, abin da ya canza, lokacin da sashen aikawa ya yi aiki. Kuɗi da ayyuka suna karantawa daga hanya ɗaya.",
    premiumTitle: "Inganci da ke tsayawa a ƙarƙashin matsi na aiki",
    premiumBody:
      "Hanyoyi masu wuya, isar da kaya na sashe, da sake jagoranci har yanzu suna nuna wa mai karɓa matakai masu tsabta — ingantaccen sabis yana riƙe ko da yake hanyoyin sun yi hayaniya.",
  },
  path: {
    eyebrow: "Yadda yake girma bayan hanyar farko",
    stepLabel: "Mataki",
    step01Title: "Nemo farashi don hanya wakili",
    step01Body:
      "Yi amfani da farashin jama’a don samun lambar gaske ga ma’aurata na asali-zuwa-makoma da kake amfani da su sosai, sannan mu daidaita daga can.",
    step02Title: "Bude cibiyar akwati",
    step02Body:
      "Cikin akwatin HenryCo naka, sararin logistics yana ajiye rasit, tarihin matakai da jagorancin sanarwa ga kuɗi/ayyuka.",
    step03Title: "Tafiyar da yawan",
    step03Body:
      "Rijistar maimaitaccen tana sake amfani da fayilolin da aka ajiye. Ana ba da lambar bibiya a lokacin rijista; tabbacin isar da kaya yana ɗauke da takardar kuɗi mai kyau.",
    step04Title: "Sasanta a tsabta",
    step04Body:
      "Kowace jigila tana shiga cikin sanarwa ɗaya tare da hanya, matakin sabis, da kowane layukan kulawa — ba a sami abubuwan mamaki «daban-daban» ba.",
  },
  fit: {
    bestForEyebrow: "Ya fi dacewa da",
    bestForRetail:
      "Alamomin ’yan kasuwa da DTC waɗanda ke sake cika kayayyaki ko kuma cika oda na maimaitawa akan hanyoyin gari iri ɗaya.",
    bestForServices:
      "Sabis na ƙwararru waɗanda ke ɗaukar takardu, samfuri ko kayan aiki a kan tsayayyen rhythm.",
    bestForDivisions:
      "Sashen HenryCo da abokan haɗin gwiwa waɗanda ke daidaita musayar cikin gida ba tare da takarda mai sauri ba.",
    notYetEyebrow: "Ba a dace ba tukuna",
    notYetColdChain:
      "Cold-chain ko jigilar kaya da ake sarrafa zafin jiki da ke buƙatar akwati na musamman — sanar mana a gaba kuma za mu daidaita.",
    notYetCrossBorder:
      "Motsi na ƙasa-ƙasa — yau hanyoyin cikin gida sune sabis ɗin da aka buga.",
    notYetHazmat:
      "Jigilar kayan masu haɗari — ana sarrafa su a daban ta hanyar tuntuɓar ayyuka kai tsaye, ba ta hanyar rijista ta jama’a ba.",
  },
  closing: {
    eyebrow: "A shirye don magana kan yawan?",
    title:
      "Aika farashi wakili — za mu amsa da hoton aiki na gaske.",
    body: "Farashi → tabbatar da hanyoyi → bude cibiyar akwati. Babu wasan kwaikwayo na sayarwa, babu bangon takarda.",
    quoteCta: "Nemo farashi",
    dispatchCta: "Yi magana da sashen aikawa",
  },
};

const LOGISTICS_BUSINESS_LOCALE_MAP: Partial<
  Record<AppLocale, DeepPartial<LogisticsBusinessCopy>>
> = {
  fr: LOGISTICS_BUSINESS_COPY_FR,
  es: LOGISTICS_BUSINESS_COPY_ES,
  pt: LOGISTICS_BUSINESS_COPY_PT,
  ar: LOGISTICS_BUSINESS_COPY_AR,
  de: LOGISTICS_BUSINESS_COPY_DE,
  it: LOGISTICS_BUSINESS_COPY_IT,
  zh: LOGISTICS_BUSINESS_COPY_ZH,
  hi: LOGISTICS_BUSINESS_COPY_HI,
  ig: LOGISTICS_BUSINESS_COPY_IG,
  yo: LOGISTICS_BUSINESS_COPY_YO,
  ha: LOGISTICS_BUSINESS_COPY_HA,
};

export function getLogisticsBusinessCopy(locale: AppLocale): LogisticsBusinessCopy {
  const overrides = LOGISTICS_BUSINESS_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      LOGISTICS_BUSINESS_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as LogisticsBusinessCopy;
  }
  return LOGISTICS_BUSINESS_COPY_EN;
}

/** @internal */
export function __dangerouslyGetEnglishLogisticsBusinessCopy(): LogisticsBusinessCopy {
  return LOGISTICS_BUSINESS_COPY_EN;
}
