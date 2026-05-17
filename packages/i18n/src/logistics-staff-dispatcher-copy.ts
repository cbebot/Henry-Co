import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * LogisticsStaffDispatcherCopy — i18n surface for the dispatcher staff
 * workspace home (V3 PASS 21). Covers metadata, the hero block, the four
 * KPI metric cards (with their dynamic trend phrases and the shipment
 * count delta), the four dispatch queue group titles + descriptions, the
 * per-row labels (lane fallback, rider-vs-status), and the empty-state
 * displayed when a queue has no rows.
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each locale is
 * a Partial that deep-merges over EN so missing keys fall back silently.
 * Mirrors the shape of `logistics-home-copy.ts`.
 */
export type LogisticsStaffDispatcherCopy = {
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    body: string;
  };
  metrics: {
    activeLabel: string;
    activeTrend: string;
    unassignedLabel: string;
    unassignedTrendNeeds: string;
    unassignedTrendClear: string;
    exceptionsLabel: string;
    exceptionsTrendNeeds: string;
    exceptionsTrendClear: string;
    revenueLabel: string;
    revenueComparisonVs: string;
    revenueDeltaOne: string;
    revenueDeltaMany: string;
  };
  queueGroups: {
    unassignedTitle: string;
    unassignedDescription: string;
    delayedTitle: string;
    delayedDescription: string;
    staleTitle: string;
    staleDescription: string;
    activeTitle: string;
    activeDescription: string;
  };
  row: {
    laneTbd: string;
    riderLabel: string;
    statusLabel: string;
  };
  empty: {
    kicker: string;
    headline: string;
    body: string;
  };
};

const LOGISTICS_STAFF_DISPATCHER_COPY_EN: LogisticsStaffDispatcherCopy = {
  metadata: {
    title: "Dispatch — HenryCo Logistics",
    description:
      "Live ops surface for dispatchers. Unassigned shipments, capacity, exceptions, and fleet utilisation in one view.",
  },
  hero: {
    eyebrow: "Live board",
    title: "Dispatch",
    body: "Live ops surface. Unassigned shipments, capacity, exceptions, and fleet utilisation in one view.",
  },
  metrics: {
    activeLabel: "Active",
    activeTrend: "Total in flight",
    unassignedLabel: "Unassigned",
    unassignedTrendNeeds: "Needs a rider",
    unassignedTrendClear: "All assigned",
    exceptionsLabel: "Exceptions",
    exceptionsTrendNeeds: "Needs attention",
    exceptionsTrendClear: "All clear",
    revenueLabel: "Revenue today",
    revenueComparisonVs: "today's settled total",
    revenueDeltaOne: "{count} shipment",
    revenueDeltaMany: "{count} shipments",
  },
  queueGroups: {
    unassignedTitle: "Unassigned",
    unassignedDescription: "Shipment requests that still need rider ownership.",
    delayedTitle: "Delayed or failed attempts",
    delayedDescription: "Shipments that need immediate operator action.",
    staleTitle: "Stale shipments",
    staleDescription: "Active shipments without recent movement.",
    activeTitle: "In motion",
    activeDescription: "Assigned shipments that are progressing cleanly.",
  },
  row: {
    laneTbd: "Lane TBD",
    riderLabel: "Rider",
    statusLabel: "Status",
  },
  empty: {
    kicker: "No rows",
    headline: "Queue empty",
    body: "Shipments will appear here as soon as they qualify.",
  },
};

const LOGISTICS_STAFF_DISPATCHER_COPY_FR: DeepPartial<LogisticsStaffDispatcherCopy> = {
  metadata: {
    title: "Répartition — HenryCo Logistics",
    description:
      "Surface ops en direct pour les répartiteurs. Expéditions non assignées, capacité, exceptions et utilisation de flotte dans une seule vue.",
  },
  hero: {
    eyebrow: "Tableau en direct",
    title: "Répartition",
    body: "Surface ops en direct. Expéditions non assignées, capacité, exceptions et utilisation de flotte dans une seule vue.",
  },
  metrics: {
    activeLabel: "Actives",
    activeTrend: "Total en circulation",
    unassignedLabel: "Non assignées",
    unassignedTrendNeeds: "Coursier requis",
    unassignedTrendClear: "Toutes assignées",
    exceptionsLabel: "Exceptions",
    exceptionsTrendNeeds: "Attention requise",
    exceptionsTrendClear: "Rien à signaler",
    revenueLabel: "Revenu aujourd’hui",
    revenueComparisonVs: "total réglé aujourd’hui",
    revenueDeltaOne: "{count} expédition",
    revenueDeltaMany: "{count} expéditions",
  },
  queueGroups: {
    unassignedTitle: "Non assignées",
    unassignedDescription: "Demandes d’expédition qui doivent encore être prises par un coursier.",
    delayedTitle: "Retards ou échecs",
    delayedDescription: "Expéditions qui demandent une action opérateur immédiate.",
    staleTitle: "Expéditions inertes",
    staleDescription: "Expéditions actives sans mouvement récent.",
    activeTitle: "En route",
    activeDescription: "Expéditions assignées qui progressent proprement.",
  },
  row: {
    laneTbd: "Tracé à définir",
    riderLabel: "Coursier",
    statusLabel: "Statut",
  },
  empty: {
    kicker: "Aucune ligne",
    headline: "File vide",
    body: "Les expéditions apparaîtront ici dès qu’elles seront éligibles.",
  },
};

const LOGISTICS_STAFF_DISPATCHER_COPY_ES: DeepPartial<LogisticsStaffDispatcherCopy> = {
  metadata: {
    title: "Despacho — HenryCo Logistics",
    description:
      "Superficie ops en vivo para despachadores. Envíos sin asignar, capacidad, excepciones y utilización de flota en una sola vista.",
  },
  hero: {
    eyebrow: "Tablero en vivo",
    title: "Despacho",
    body: "Superficie ops en vivo. Envíos sin asignar, capacidad, excepciones y utilización de flota en una sola vista.",
  },
  metrics: {
    activeLabel: "Activos",
    activeTrend: "Total en circulación",
    unassignedLabel: "Sin asignar",
    unassignedTrendNeeds: "Necesita un mensajero",
    unassignedTrendClear: "Todos asignados",
    exceptionsLabel: "Excepciones",
    exceptionsTrendNeeds: "Requiere atención",
    exceptionsTrendClear: "Todo en orden",
    revenueLabel: "Ingresos hoy",
    revenueComparisonVs: "total liquidado de hoy",
    revenueDeltaOne: "{count} envío",
    revenueDeltaMany: "{count} envíos",
  },
  queueGroups: {
    unassignedTitle: "Sin asignar",
    unassignedDescription: "Solicitudes de envío que aún necesitan un mensajero.",
    delayedTitle: "Retrasados o intentos fallidos",
    delayedDescription: "Envíos que requieren acción inmediata del operador.",
    staleTitle: "Envíos inactivos",
    staleDescription: "Envíos activos sin movimiento reciente.",
    activeTitle: "En movimiento",
    activeDescription: "Envíos asignados que avanzan limpiamente.",
  },
  row: {
    laneTbd: "Trayecto por definir",
    riderLabel: "Mensajero",
    statusLabel: "Estado",
  },
  empty: {
    kicker: "Sin filas",
    headline: "Cola vacía",
    body: "Los envíos aparecerán aquí en cuanto califiquen.",
  },
};

const LOGISTICS_STAFF_DISPATCHER_COPY_PT: DeepPartial<LogisticsStaffDispatcherCopy> = {
  metadata: {
    title: "Despacho — HenryCo Logistics",
    description:
      "Superfície de operações ao vivo para despachantes. Envios sem atribuição, capacidade, exceções e utilização de frota numa vista única.",
  },
  hero: {
    eyebrow: "Painel ao vivo",
    title: "Despacho",
    body: "Superfície de operações ao vivo. Envios sem atribuição, capacidade, exceções e utilização de frota numa vista única.",
  },
  metrics: {
    activeLabel: "Ativos",
    activeTrend: "Total em trânsito",
    unassignedLabel: "Sem atribuição",
    unassignedTrendNeeds: "Precisa de estafeta",
    unassignedTrendClear: "Todos atribuídos",
    exceptionsLabel: "Exceções",
    exceptionsTrendNeeds: "Requer atenção",
    exceptionsTrendClear: "Tudo em ordem",
    revenueLabel: "Receita hoje",
    revenueComparisonVs: "total liquidado de hoje",
    revenueDeltaOne: "{count} envio",
    revenueDeltaMany: "{count} envios",
  },
  queueGroups: {
    unassignedTitle: "Sem atribuição",
    unassignedDescription: "Pedidos de envio que ainda precisam de um estafeta responsável.",
    delayedTitle: "Atrasados ou tentativas falhadas",
    delayedDescription: "Envios que exigem ação imediata do operador.",
    staleTitle: "Envios parados",
    staleDescription: "Envios ativos sem movimento recente.",
    activeTitle: "Em movimento",
    activeDescription: "Envios atribuídos a progredir corretamente.",
  },
  row: {
    laneTbd: "Trajeto por definir",
    riderLabel: "Estafeta",
    statusLabel: "Estado",
  },
  empty: {
    kicker: "Sem linhas",
    headline: "Fila vazia",
    body: "Os envios aparecerão aqui assim que se qualificarem.",
  },
};

const LOGISTICS_STAFF_DISPATCHER_COPY_AR: DeepPartial<LogisticsStaffDispatcherCopy> = {
  metadata: {
    title: "الإرسال — HenryCo Logistics",
    description:
      "واجهة عمليات حية للمرسلين. الشحنات غير المعيَّنة، الطاقة، الاستثناءات، واستخدام الأسطول في عرض واحد.",
  },
  hero: {
    eyebrow: "لوحة حية",
    title: "الإرسال",
    body: "واجهة عمليات حية. الشحنات غير المعيَّنة، الطاقة، الاستثناءات، واستخدام الأسطول في عرض واحد.",
  },
  metrics: {
    activeLabel: "نشطة",
    activeTrend: "إجمالي قيد التنفيذ",
    unassignedLabel: "غير معيَّنة",
    unassignedTrendNeeds: "تحتاج إلى مندوب",
    unassignedTrendClear: "كلها معيَّنة",
    exceptionsLabel: "استثناءات",
    exceptionsTrendNeeds: "تحتاج اهتماماً",
    exceptionsTrendClear: "كل شيء على ما يرام",
    revenueLabel: "إيرادات اليوم",
    revenueComparisonVs: "إجمالي اليوم المسوَّى",
    revenueDeltaOne: "{count} شحنة",
    revenueDeltaMany: "{count} شحنة",
  },
  queueGroups: {
    unassignedTitle: "غير معيَّنة",
    unassignedDescription: "طلبات شحن لا تزال بحاجة إلى تولِّي مندوب.",
    delayedTitle: "متأخرة أو محاولات فاشلة",
    delayedDescription: "شحنات تتطلب إجراء فورياً من المشغّل.",
    staleTitle: "شحنات راكدة",
    staleDescription: "شحنات نشطة بدون حركة أخيرة.",
    activeTitle: "في الحركة",
    activeDescription: "شحنات معيَّنة تتقدم بسلاسة.",
  },
  row: {
    laneTbd: "المسار لاحقاً",
    riderLabel: "المندوب",
    statusLabel: "الحالة",
  },
  empty: {
    kicker: "لا صفوف",
    headline: "الطابور فارغ",
    body: "ستظهر الشحنات هنا فور استيفائها للشروط.",
  },
};

const LOGISTICS_STAFF_DISPATCHER_COPY_DE: DeepPartial<LogisticsStaffDispatcherCopy> = {
  metadata: {
    title: "Disposition — HenryCo Logistics",
    description:
      "Live-Ops-Oberfläche für Disponenten. Nicht zugewiesene Sendungen, Kapazität, Ausnahmen und Flottenauslastung in einer Ansicht.",
  },
  hero: {
    eyebrow: "Live-Board",
    title: "Disposition",
    body: "Live-Ops-Oberfläche. Nicht zugewiesene Sendungen, Kapazität, Ausnahmen und Flottenauslastung in einer Ansicht.",
  },
  metrics: {
    activeLabel: "Aktiv",
    activeTrend: "Gesamt unterwegs",
    unassignedLabel: "Nicht zugewiesen",
    unassignedTrendNeeds: "Braucht einen Fahrer",
    unassignedTrendClear: "Alle zugewiesen",
    exceptionsLabel: "Ausnahmen",
    exceptionsTrendNeeds: "Erfordert Aufmerksamkeit",
    exceptionsTrendClear: "Alles klar",
    revenueLabel: "Umsatz heute",
    revenueComparisonVs: "heute abgerechneter Betrag",
    revenueDeltaOne: "{count} Sendung",
    revenueDeltaMany: "{count} Sendungen",
  },
  queueGroups: {
    unassignedTitle: "Nicht zugewiesen",
    unassignedDescription: "Sendungsanfragen, die noch eine Fahrerzuweisung brauchen.",
    delayedTitle: "Verzögerte oder fehlgeschlagene Versuche",
    delayedDescription: "Sendungen, die sofortiges Eingreifen erfordern.",
    staleTitle: "Stehende Sendungen",
    staleDescription: "Aktive Sendungen ohne aktuelle Bewegung.",
    activeTitle: "In Bewegung",
    activeDescription: "Zugewiesene Sendungen, die sauber voranschreiten.",
  },
  row: {
    laneTbd: "Strecke offen",
    riderLabel: "Fahrer",
    statusLabel: "Status",
  },
  empty: {
    kicker: "Keine Zeilen",
    headline: "Warteschlange leer",
    body: "Sendungen erscheinen hier, sobald sie qualifiziert sind.",
  },
};

const LOGISTICS_STAFF_DISPATCHER_COPY_IT: DeepPartial<LogisticsStaffDispatcherCopy> = {
  metadata: {
    title: "Dispaccio — HenryCo Logistics",
    description:
      "Superficie operativa live per i dispatcher. Spedizioni non assegnate, capacità, eccezioni e utilizzo flotta in un’unica vista.",
  },
  hero: {
    eyebrow: "Board live",
    title: "Dispaccio",
    body: "Superficie operativa live. Spedizioni non assegnate, capacità, eccezioni e utilizzo flotta in un’unica vista.",
  },
  metrics: {
    activeLabel: "Attive",
    activeTrend: "Totale in transito",
    unassignedLabel: "Non assegnate",
    unassignedTrendNeeds: "Serve un corriere",
    unassignedTrendClear: "Tutte assegnate",
    exceptionsLabel: "Eccezioni",
    exceptionsTrendNeeds: "Richiede attenzione",
    exceptionsTrendClear: "Tutto a posto",
    revenueLabel: "Ricavi di oggi",
    revenueComparisonVs: "totale liquidato di oggi",
    revenueDeltaOne: "{count} spedizione",
    revenueDeltaMany: "{count} spedizioni",
  },
  queueGroups: {
    unassignedTitle: "Non assegnate",
    unassignedDescription: "Richieste di spedizione che attendono ancora un corriere responsabile.",
    delayedTitle: "Ritardate o tentativi falliti",
    delayedDescription: "Spedizioni che richiedono azione immediata dell’operatore.",
    staleTitle: "Spedizioni ferme",
    staleDescription: "Spedizioni attive senza movimento recente.",
    activeTitle: "In movimento",
    activeDescription: "Spedizioni assegnate che procedono regolarmente.",
  },
  row: {
    laneTbd: "Tratta da definire",
    riderLabel: "Corriere",
    statusLabel: "Stato",
  },
  empty: {
    kicker: "Nessuna riga",
    headline: "Coda vuota",
    body: "Le spedizioni compariranno qui appena saranno idonee.",
  },
};

const LOGISTICS_STAFF_DISPATCHER_COPY_ZH: DeepPartial<LogisticsStaffDispatcherCopy> = {
  metadata: {
    title: "调度 — HenryCo Logistics",
    description: "面向调度员的实时运营视图。未指派货件、运力、异常和车队利用率,集中于一屏。",
  },
  hero: {
    eyebrow: "实时面板",
    title: "调度",
    body: "实时运营视图。未指派货件、运力、异常和车队利用率,集中于一屏。",
  },
  metrics: {
    activeLabel: "进行中",
    activeTrend: "在途总数",
    unassignedLabel: "未指派",
    unassignedTrendNeeds: "需要骑手",
    unassignedTrendClear: "已全部指派",
    exceptionsLabel: "异常",
    exceptionsTrendNeeds: "需要关注",
    exceptionsTrendClear: "一切正常",
    revenueLabel: "今日收入",
    revenueComparisonVs: "今日已结算总额",
    revenueDeltaOne: "{count} 票货件",
    revenueDeltaMany: "{count} 票货件",
  },
  queueGroups: {
    unassignedTitle: "未指派",
    unassignedDescription: "仍需要骑手认领的货件请求。",
    delayedTitle: "延误或失败的派送",
    delayedDescription: "需要操作员立即处理的货件。",
    staleTitle: "停滞的货件",
    staleDescription: "有进行中但近期无动作的货件。",
    activeTitle: "在途",
    activeDescription: "已指派且推进顺利的货件。",
  },
  row: {
    laneTbd: "线路待定",
    riderLabel: "骑手",
    statusLabel: "状态",
  },
  empty: {
    kicker: "无记录",
    headline: "队列为空",
    body: "一旦有符合条件的货件,会出现在这里。",
  },
};

const LOGISTICS_STAFF_DISPATCHER_COPY_HI: DeepPartial<LogisticsStaffDispatcherCopy> = {
  metadata: {
    title: "डिस्पैच — HenryCo Logistics",
    description:
      "डिस्पैचरों के लिए लाइव ऑप्स सतह। बिना सौंपी गई शिपमेंट, क्षमता, अपवाद, और बेड़े का उपयोग एक ही दृश्य में।",
  },
  hero: {
    eyebrow: "लाइव बोर्ड",
    title: "डिस्पैच",
    body: "लाइव ऑप्स सतह। बिना सौंपी गई शिपमेंट, क्षमता, अपवाद, और बेड़े का उपयोग एक ही दृश्य में।",
  },
  metrics: {
    activeLabel: "सक्रिय",
    activeTrend: "रवाना कुल",
    unassignedLabel: "अनसौंपी",
    unassignedTrendNeeds: "राइडर चाहिए",
    unassignedTrendClear: "सब सौंपी हैं",
    exceptionsLabel: "अपवाद",
    exceptionsTrendNeeds: "ध्यान चाहिए",
    exceptionsTrendClear: "सब ठीक",
    revenueLabel: "आज की आय",
    revenueComparisonVs: "आज का तय कुल",
    revenueDeltaOne: "{count} शिपमेंट",
    revenueDeltaMany: "{count} शिपमेंट",
  },
  queueGroups: {
    unassignedTitle: "अनसौंपी",
    unassignedDescription: "शिपमेंट अनुरोध जिन्हें अब भी किसी राइडर के लेने की ज़रूरत है।",
    delayedTitle: "विलंबित या असफल प्रयास",
    delayedDescription: "शिपमेंट जिनके लिए तत्काल ऑपरेटर कार्रवाई चाहिए।",
    staleTitle: "ठहरी शिपमेंट",
    staleDescription: "सक्रिय शिपमेंट जिनमें हाल में कोई गति नहीं रही।",
    activeTitle: "गति में",
    activeDescription: "सौंपी हुई शिपमेंट जो साफ-सुथरे ढंग से आगे बढ़ रही हैं।",
  },
  row: {
    laneTbd: "लेन तय होगी",
    riderLabel: "राइडर",
    statusLabel: "स्थिति",
  },
  empty: {
    kicker: "कोई पंक्ति नहीं",
    headline: "कतार खाली",
    body: "जैसे ही शिपमेंट योग्य होंगी, वे यहाँ दिखाई देंगी।",
  },
};

const LOGISTICS_STAFF_DISPATCHER_COPY_IG: DeepPartial<LogisticsStaffDispatcherCopy> = {
  metadata: {
    title: "Nzipu — HenryCo Logistics",
    description:
      "Elu ọrụ ndị nzipu na-eme ngwa ngwa. Ngwaahịa enyebeghị, ike, ihe iwughị, na ojiji ụgbọala n’otu ngosipụta.",
  },
  hero: {
    eyebrow: "Bọọdụ ndụ",
    title: "Nzipu",
    body: "Elu ọrụ ndị nzipu na-eme ngwa ngwa. Ngwaahịa enyebeghị, ike, ihe iwughị, na ojiji ụgbọala n’otu ngosipụta.",
  },
  metrics: {
    activeLabel: "Na-arụ",
    activeTrend: "Mkpokọta na njem",
    unassignedLabel: "Enyebeghị",
    unassignedTrendNeeds: "Chọrọ onye nbufe",
    unassignedTrendClear: "Enyere niile",
    exceptionsLabel: "Ihe iwughị",
    exceptionsTrendNeeds: "Chọrọ nlebanya",
    exceptionsTrendClear: "Ihe niile dị mma",
    revenueLabel: "Ego taa",
    revenueComparisonVs: "mkpokọta nke kwụrụ taa",
    revenueDeltaOne: "ngwaahịa {count}",
    revenueDeltaMany: "ngwaahịa {count}",
  },
  queueGroups: {
    unassignedTitle: "Enyebeghị",
    unassignedDescription: "Arịrịọ nzipu ka chọrọ onye nbufe ga-eburu.",
    delayedTitle: "Egbu oge ma ọ bụ mgbalị daara",
    delayedDescription: "Ngwaahịa chọrọ ka onye ọrụ rụọ ozugbo.",
    staleTitle: "Ngwaahịa kwụsịrị",
    staleDescription: "Ngwaahịa na-arụ ma na-enweghị mmegharị ọhụrụ.",
    activeTitle: "Na-aga",
    activeDescription: "Ngwaahịa enyere nke na-aga nke ọma.",
  },
  row: {
    laneTbd: "Ụzọ ka a ga-ekpebi",
    riderLabel: "Onye nbufe",
    statusLabel: "Ọnọdụ",
  },
  empty: {
    kicker: "Enweghị ahịrị",
    headline: "Kwụụ tọgbọrọ chakoo",
    body: "Ngwaahịa ga-apụta ebe a ozugbo ha ruru eru.",
  },
};

const LOGISTICS_STAFF_DISPATCHER_COPY_YO: DeepPartial<LogisticsStaffDispatcherCopy> = {
  metadata: {
    title: "Ifiránṣẹ́ — HenryCo Logistics",
    description:
      "Ojú-iṣẹ́ alààyè fún àwọn olùfiránṣẹ́. Àwọn ẹrù tí a kò tí ì pín, agbára, ìyàtọ̀, àti ìlò àwọn ọkọ̀ nínú ìwò kan.",
  },
  hero: {
    eyebrow: "Páànù alààyè",
    title: "Ifiránṣẹ́",
    body: "Ojú-iṣẹ́ alààyè. Àwọn ẹrù tí a kò tí ì pín, agbára, ìyàtọ̀, àti ìlò àwọn ọkọ̀ nínú ìwò kan.",
  },
  metrics: {
    activeLabel: "Ńṣẹ́",
    activeTrend: "Àpapọ̀ tí ó wà lójú òpópó",
    unassignedLabel: "Kò pín",
    unassignedTrendNeeds: "Nílò agbéjáde",
    unassignedTrendClear: "Gbogbo wọn ti pín",
    exceptionsLabel: "Ìyàtọ̀",
    exceptionsTrendNeeds: "Nílò àfiyèsí",
    exceptionsTrendClear: "Gbogbo rẹ̀ dára",
    revenueLabel: "Owó tí ó wọlé lónìí",
    revenueComparisonVs: "àpapọ̀ tí a yanjú lónìí",
    revenueDeltaOne: "ẹrù {count}",
    revenueDeltaMany: "àwọn ẹrù {count}",
  },
  queueGroups: {
    unassignedTitle: "Kò pín",
    unassignedDescription: "Àwọn ìbéèrè ẹrù tí ó ṣì nílò ẹni tó ń gbé.",
    delayedTitle: "Ìdájẹ́ tàbí ìgbìyànjú tí ó kùnà",
    delayedDescription: "Àwọn ẹrù tí ó nílò ìṣe alábòójútó lójú ẹsẹ̀.",
    staleTitle: "Àwọn ẹrù tí kò ṣíkiri",
    staleDescription: "Ẹrù alààyè tí kò ní ìṣíkiri láìpẹ́.",
    activeTitle: "Lójú òpópó",
    activeDescription: "Àwọn ẹrù tí a ti pín, tí ó ń lọ lọ́nà mímọ́.",
  },
  row: {
    laneTbd: "A ó pinnu ọ̀nà",
    riderLabel: "Agbéjáde",
    statusLabel: "Ipò",
  },
  empty: {
    kicker: "Kò sí ọ̀wọ́",
    headline: "Ìtò ṣófo",
    body: "Àwọn ẹrù yóò farahàn níbí ní kété tí wọ́n bá yẹ.",
  },
};

const LOGISTICS_STAFF_DISPATCHER_COPY_HA: DeepPartial<LogisticsStaffDispatcherCopy> = {
  metadata: {
    title: "Aikawa — HenryCo Logistics",
    description:
      "Faifan ayyukan kai tsaye don masu aikawa. Kayayyaki da ba a ba su ba, ƙarfin aiki, abubuwan keɓance, da amfani da rundunar a wuri ɗaya.",
  },
  hero: {
    eyebrow: "Allon kai tsaye",
    title: "Aikawa",
    body: "Faifan ayyukan kai tsaye. Kayayyaki da ba a ba su ba, ƙarfin aiki, abubuwan keɓance, da amfani da rundunar a wuri ɗaya.",
  },
  metrics: {
    activeLabel: "Masu aiki",
    activeTrend: "Jimillar a tafiya",
    unassignedLabel: "Ba a ba su ba",
    unassignedTrendNeeds: "Yana buƙatar ɗan kasuwa",
    unassignedTrendClear: "An ba duka",
    exceptionsLabel: "Keɓance",
    exceptionsTrendNeeds: "Yana buƙatar kulawa",
    exceptionsTrendClear: "Komai lafiya",
    revenueLabel: "Kuɗin shiga yau",
    revenueComparisonVs: "jimillar da aka warware yau",
    revenueDeltaOne: "jigila {count}",
    revenueDeltaMany: "jigila {count}",
  },
  queueGroups: {
    unassignedTitle: "Ba a ba su ba",
    unassignedDescription: "Buƙatun jigila waɗanda har yanzu suke buƙatar ɗan kasuwa.",
    delayedTitle: "Jinkiri ko ƙoƙarin da ya gaza",
    delayedDescription: "Jigilan da ke buƙatar matakin ma'aikaci nan take.",
    staleTitle: "Jigilan da suka tsaya",
    staleDescription: "Jigilan da ke aiki amma ba su yi motsi a kwanan nan ba.",
    activeTitle: "A kan hanya",
    activeDescription: "Jigilan da aka ba su, suna tafiya yadda ya kamata.",
  },
  row: {
    laneTbd: "Hanya za a tsayar",
    riderLabel: "Ɗan kasuwa",
    statusLabel: "Matsayi",
  },
  empty: {
    kicker: "Babu jeri",
    headline: "Layi babu komai",
    body: "Jigila za su bayyana a nan da zaran sun cancanci.",
  },
};

const LOGISTICS_STAFF_DISPATCHER_LOCALE_MAP: Partial<
  Record<AppLocale, DeepPartial<LogisticsStaffDispatcherCopy>>
> = {
  fr: LOGISTICS_STAFF_DISPATCHER_COPY_FR,
  es: LOGISTICS_STAFF_DISPATCHER_COPY_ES,
  pt: LOGISTICS_STAFF_DISPATCHER_COPY_PT,
  ar: LOGISTICS_STAFF_DISPATCHER_COPY_AR,
  de: LOGISTICS_STAFF_DISPATCHER_COPY_DE,
  it: LOGISTICS_STAFF_DISPATCHER_COPY_IT,
  zh: LOGISTICS_STAFF_DISPATCHER_COPY_ZH,
  hi: LOGISTICS_STAFF_DISPATCHER_COPY_HI,
  ig: LOGISTICS_STAFF_DISPATCHER_COPY_IG,
  yo: LOGISTICS_STAFF_DISPATCHER_COPY_YO,
  ha: LOGISTICS_STAFF_DISPATCHER_COPY_HA,
};

export function getLogisticsStaffDispatcherCopy(
  locale: AppLocale,
): LogisticsStaffDispatcherCopy {
  const overrides = LOGISTICS_STAFF_DISPATCHER_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      LOGISTICS_STAFF_DISPATCHER_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as LogisticsStaffDispatcherCopy;
  }
  return LOGISTICS_STAFF_DISPATCHER_COPY_EN;
}

/** @internal */
export function __dangerouslyGetEnglishLogisticsStaffDispatcherCopy(): LogisticsStaffDispatcherCopy {
  return LOGISTICS_STAFF_DISPATCHER_COPY_EN;
}
