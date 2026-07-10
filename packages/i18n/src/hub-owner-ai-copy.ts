import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * HubOwnerAiCopy — i18n surface for the hub owner AI / helper-layer dashboard
 * trio: `apps/hub/app/owner/(command)/ai/page.tsx`, `ai/insights/page.tsx`,
 * and `ai/signals/page.tsx`.
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each locale is a
 * DeepPartial that deep-merges over EN so missing keys fall through to EN
 * silently. Mirrors the shape of `hub-owner-copy.ts`.
 */
export type HubOwnerAiCopy = {
  overview: {
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      eyebrow: string;
      title: string;
      description: string;
      signals: string;
      insights: string;
    };
    briefing: {
      title: string;
      description: string;
      failedDeliveries: string;
      whatsappSkipped: string;
      openSupport: string;
      queuedNotices: string;
    };
    actionQueue: {
      title: string;
      description: string;
      openLink: string;
    };
    divisionPressure: {
      title: string;
      description: string;
      healthTemplate: string;
      divisionDetail: string;
    };
    scorecards: {
      title: string;
      description: string;
      healthScoreTemplate: string;
    };
  };
  insights: {
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      eyebrow: string;
      title: string;
      description: string;
    };
    panel: {
      title: string;
      description: string;
      openActionPath: string;
    };
  };
  signals: {
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      eyebrow: string;
      title: string;
      description: string;
    };
    panel: {
      title: string;
      description: string;
    };
  };
};

const HUB_OWNER_AI_COPY_EN: HubOwnerAiCopy = {
  overview: {
    metadata: {
      title: "Signals & insights · Henry Onyx",
      description:
        "Evidence-based executive briefing for the Henry Onyx owner — briefings, action cards, and division pressure built from live company signals.",
    },
    hero: {
      eyebrow: "Signals & Insights",
      title: "Evidence-based executive briefing",
      description:
        "Briefings and action cards are built only from live company signals — not generic spam. Use team chat to coordinate; use this layer to prioritize.",
      signals: "Signals",
      insights: "Insights",
    },
    briefing: {
      title: "Executive briefing",
      description: "What matters now, what to open next, and where communication pressure is building.",
      failedDeliveries: "Failed deliveries",
      whatsappSkipped: "WA skipped",
      openSupport: "Open support",
      queuedNotices: "Queued notices",
    },
    actionQueue: {
      title: "Action queue",
      description: "Each card links to the exact surface where the evidence lives.",
      openLink: "Open →",
    },
    divisionPressure: {
      title: "Division pressure",
      description: "Divisions with lower health scores or thin telemetry.",
      healthTemplate: "Stability index {score}",
      divisionDetail: "Division detail →",
    },
    scorecards: {
      title: "Current signal cards",
      description: "Cross-division health scoring from the same dataset as briefings.",
      healthScoreTemplate: "Stability index {score}",
    },
  },
  insights: {
    metadata: {
      title: "Helper insights · Henry Onyx",
      description:
        "Recommendations for the Henry Onyx owner constrained to the live evidence already visible in the production system.",
    },
    hero: {
      eyebrow: "Insights",
      title: "What the owner should do next",
      description: "These recommendations are constrained to the live evidence already visible in the system.",
    },
    panel: {
      title: "Recommendations",
      description: "Actions linked to real signals already present in production.",
      openActionPath: "Open action path",
    },
  },
  signals: {
    metadata: {
      title: "Live signals · Henry Onyx",
      description:
        "Live anomaly and pressure signals from real bookings, invoices, support threads, queue rows, and automation runs in the Henry Onyx Supabase project.",
    },
    hero: {
      eyebrow: "Signals",
      title: "Live anomaly and pressure signals",
      description:
        "Every item below is generated from real bookings, invoices, support threads, queue rows, or automation runs already stored in the shared Supabase project.",
    },
    panel: {
      title: "Signals",
      description: "Raw evidence-backed signals powering the helper layer.",
    },
  },
};

const HUB_OWNER_AI_COPY_FR: DeepPartial<HubOwnerAiCopy> = {
  overview: {
    metadata: {
      title: "Signaux et recommandations · Henry Onyx",
      description:
        "Synthèse exécutive fondée sur les preuves pour le propriétaire Henry Onyx — synthèses, fiches d’action et pression par division issues des signaux en direct de l’entreprise.",
    },
    hero: {
      eyebrow: "Signaux et recommandations",
      title: "Synthèse exécutive fondée sur les preuves",
      description:
        "Les synthèses et fiches d’action sont construites uniquement à partir des signaux en direct de l’entreprise — pas de spam générique. Utilisez le chat d’équipe pour coordonner ; utilisez cette couche pour prioriser.",
      signals: "Signaux",
      insights: "Recommandations",
    },
    briefing: {
      title: "Synthèse exécutive",
      description: "Ce qui compte maintenant, ce qu’il faut ouvrir ensuite et où la pression de communication s’accumule.",
      failedDeliveries: "Livraisons échouées",
      whatsappSkipped: "WhatsApp ignoré",
      openSupport: "Support ouvert",
      queuedNotices: "Avis en file",
    },
    actionQueue: {
      title: "File d’actions",
      description: "Chaque fiche renvoie à la surface exacte où se trouvent les preuves.",
      openLink: "Ouvrir →",
    },
    divisionPressure: {
      title: "Pression par division",
      description: "Divisions au score de santé plus faible ou à la télémétrie limitée.",
      healthTemplate: "Indice de stabilité {score}",
      divisionDetail: "Détail de la division →",
    },
    scorecards: {
      title: "Cartes de signaux actuels",
      description: "Notation de santé inter-divisions à partir du même jeu de données que les synthèses.",
      healthScoreTemplate: "Indice de stabilité {score}",
    },
  },
  insights: {
    metadata: {
      title: "Recommandations de l’assistant · Henry Onyx",
      description:
        "Recommandations pour le propriétaire Henry Onyx limitées aux preuves vivantes déjà visibles dans le système de production.",
    },
    hero: {
      eyebrow: "Recommandations",
      title: "Ce que le propriétaire devrait faire ensuite",
      description: "Ces recommandations sont limitées aux preuves vivantes déjà visibles dans le système.",
    },
    panel: {
      title: "Recommandations",
      description: "Actions liées à des signaux réels déjà présents en production.",
      openActionPath: "Ouvrir le parcours d’action",
    },
  },
  signals: {
    metadata: {
      title: "Signaux en direct · Henry Onyx",
      description:
        "Signaux d’anomalie et de pression en direct issus de vraies réservations, factures, fils de support, lignes de file et exécutions d’automatisation du projet Supabase Henry Onyx.",
    },
    hero: {
      eyebrow: "Signaux",
      title: "Signaux d’anomalie et de pression en direct",
      description:
        "Chaque élément ci-dessous est généré à partir de vraies réservations, factures, fils de support, lignes de file ou exécutions d’automatisation déjà stockés dans le projet Supabase partagé.",
    },
    panel: {
      title: "Signaux",
      description: "Signaux bruts adossés à des preuves, qui alimentent la couche assistante.",
    },
  },
};

const HUB_OWNER_AI_COPY_ES: DeepPartial<HubOwnerAiCopy> = {
  overview: {
    metadata: {
      title: "Señales y recomendaciones · Henry Onyx",
      description:
        "Resúmenes ejecutivos basados en evidencia para el propietario de Henry Onyx: resúmenes, tarjetas de acción y presión por división construidas a partir de señales en vivo de la empresa.",
    },
    hero: {
      eyebrow: "Señales y recomendaciones",
      title: "Resúmenes ejecutivos basados en evidencia",
      description:
        "Los resúmenes y tarjetas de acción se construyen únicamente a partir de señales en vivo de la empresa, no de spam genérico. Use el chat de equipo para coordinar; use esta capa para priorizar.",
      signals: "Señales",
      insights: "Recomendaciones",
    },
    briefing: {
      title: "Resumen ejecutivo",
      description: "Lo que importa ahora, qué abrir a continuación y dónde se acumula la presión de comunicación.",
      failedDeliveries: "Entregas fallidas",
      whatsappSkipped: "WhatsApp omitido",
      openSupport: "Soporte abierto",
      queuedNotices: "Avisos en cola",
    },
    actionQueue: {
      title: "Cola de acciones",
      description: "Cada tarjeta enlaza con la superficie exacta donde reside la evidencia.",
      openLink: "Abrir →",
    },
    divisionPressure: {
      title: "Presión por división",
      description: "Divisiones con menor puntuación de salud o telemetría escasa.",
      healthTemplate: "Índice de estabilidad {score}",
      divisionDetail: "Detalle de la división →",
    },
    scorecards: {
      title: "Tarjetas de señales actuales",
      description: "Puntuación de salud interdivisional desde el mismo conjunto de datos que los resúmenes.",
      healthScoreTemplate: "Índice de estabilidad {score}",
    },
  },
  insights: {
    metadata: {
      title: "Recomendaciones del asistente · Henry Onyx",
      description:
        "Recomendaciones para el propietario de Henry Onyx limitadas a la evidencia en vivo ya visible en el sistema de producción.",
    },
    hero: {
      eyebrow: "Recomendaciones",
      title: "Lo siguiente que debería hacer el propietario",
      description: "Estas recomendaciones se limitan a la evidencia en vivo ya visible en el sistema.",
    },
    panel: {
      title: "Recomendaciones",
      description: "Acciones vinculadas a señales reales ya presentes en producción.",
      openActionPath: "Abrir ruta de acción",
    },
  },
  signals: {
    metadata: {
      title: "Señales en vivo · Henry Onyx",
      description:
        "Señales de anomalía y presión en vivo procedentes de reservas, facturas, hilos de soporte, filas de cola y ejecuciones automatizadas reales del proyecto Supabase de Henry Onyx.",
    },
    hero: {
      eyebrow: "Señales",
      title: "Señales en vivo de anomalía y presión",
      description:
        "Cada elemento siguiente se genera a partir de reservas, facturas, hilos de soporte, filas de cola o ejecuciones automatizadas reales ya almacenadas en el proyecto Supabase compartido.",
    },
    panel: {
      title: "Señales",
      description: "Señales brutas respaldadas por evidencia que alimentan la capa asistente.",
    },
  },
};

const HUB_OWNER_AI_COPY_PT: DeepPartial<HubOwnerAiCopy> = {
  overview: {
    metadata: {
      title: "Sinais e recomendações · Henry Onyx",
      description:
        "Resumos executivos baseados em evidências para o proprietário Henry Onyx — resumos, cartões de acção e pressão por divisão construídos a partir de sinais ao vivo da empresa.",
    },
    hero: {
      eyebrow: "Sinais e recomendações",
      title: "Resumos executivos baseados em evidências",
      description:
        "Os resumos e cartões de acção são construídos apenas a partir de sinais ao vivo da empresa — não de spam genérico. Use o chat da equipa para coordenar; use esta camada para priorizar.",
      signals: "Sinais",
      insights: "Recomendações",
    },
    briefing: {
      title: "Resumo executivo",
      description: "O que importa agora, o que abrir a seguir e onde se acumula pressão de comunicação.",
      failedDeliveries: "Entregas falhadas",
      whatsappSkipped: "WhatsApp ignorado",
      openSupport: "Suporte aberto",
      queuedNotices: "Avisos em fila",
    },
    actionQueue: {
      title: "Fila de acções",
      description: "Cada cartão liga à superfície exacta onde reside a evidência.",
      openLink: "Abrir →",
    },
    divisionPressure: {
      title: "Pressão por divisão",
      description: "Divisões com menor pontuação de saúde ou telemetria escassa.",
      healthTemplate: "Índice de estabilidade {score}",
      divisionDetail: "Detalhe da divisão →",
    },
    scorecards: {
      title: "Cartões de sinais actuais",
      description: "Pontuação de saúde interdivisional a partir do mesmo conjunto de dados dos resumos.",
      healthScoreTemplate: "Índice de estabilidade {score}",
    },
  },
  insights: {
    metadata: {
      title: "Recomendações do assistente · Henry Onyx",
      description:
        "Recomendações para o proprietário Henry Onyx limitadas à evidência ao vivo já visível no sistema de produção.",
    },
    hero: {
      eyebrow: "Recomendações",
      title: "O que o proprietário deve fazer a seguir",
      description: "Estas recomendações limitam-se à evidência ao vivo já visível no sistema.",
    },
    panel: {
      title: "Recomendações",
      description: "Acções ligadas a sinais reais já presentes em produção.",
      openActionPath: "Abrir caminho de acção",
    },
  },
  signals: {
    metadata: {
      title: "Sinais ao vivo · Henry Onyx",
      description:
        "Sinais de anomalia e pressão ao vivo a partir de reservas, facturas, tópicos de suporte, linhas de fila e execuções automatizadas reais do projecto Supabase da Henry Onyx.",
    },
    hero: {
      eyebrow: "Sinais",
      title: "Sinais ao vivo de anomalia e pressão",
      description:
        "Cada item abaixo é gerado a partir de reservas, facturas, tópicos de suporte, linhas de fila ou execuções automatizadas reais já guardadas no projecto Supabase partilhado.",
    },
    panel: {
      title: "Sinais",
      description: "Sinais brutos apoiados em evidência que alimentam a camada assistente.",
    },
  },
};

const HUB_OWNER_AI_COPY_AR: DeepPartial<HubOwnerAiCopy> = {
  overview: {
    metadata: {
      title: "الإشارات والتوصيات · Henry Onyx",
      description:
        "موجزات تنفيذية مبنية على الأدلة لمالك Henry Onyx — موجزات وبطاقات إجراء وضغط الأقسام تُبنى من إشارات الشركة الحية.",
    },
    hero: {
      eyebrow: "الإشارات والتوصيات",
      title: "موجزات تنفيذية مبنية على الأدلة",
      description:
        "تُبنى الموجزات وبطاقات الإجراء فقط من إشارات الشركة الحية — وليس من رسائل عامة. استخدم دردشة الفريق للتنسيق، واستخدم هذه الطبقة لتحديد الأولويات.",
      signals: "الإشارات",
      insights: "التوصيات",
    },
    briefing: {
      title: "الموجز التنفيذي",
      description: "ما يهم الآن، وما يجب فتحه لاحقًا، وأين يتراكم ضغط الاتصالات.",
      failedDeliveries: "تسليمات فاشلة",
      whatsappSkipped: "تم تخطي واتساب",
      openSupport: "الدعم المفتوح",
      queuedNotices: "إشعارات في الانتظار",
    },
    actionQueue: {
      title: "قائمة الإجراءات",
      description: "كل بطاقة ترتبط بالواجهة الدقيقة حيث توجد الأدلة.",
      openLink: "فتح ←",
    },
    divisionPressure: {
      title: "ضغط الأقسام",
      description: "الأقسام ذات درجات الصحة الأدنى أو القياس عن بُعد المحدود.",
      healthTemplate: "مؤشر الاستقرار {score}",
      divisionDetail: "تفاصيل القسم ←",
    },
    scorecards: {
      title: "بطاقات الإشارات الحالية",
      description: "تقييم صحي عبر الأقسام من نفس مجموعة البيانات المستخدمة للموجزات.",
      healthScoreTemplate: "مؤشر الاستقرار {score}",
    },
  },
  insights: {
    metadata: {
      title: "توصيات المساعد · Henry Onyx",
      description:
        "توصيات لمالك Henry Onyx مقيدة بالأدلة الحية الظاهرة بالفعل في نظام الإنتاج.",
    },
    hero: {
      eyebrow: "التوصيات",
      title: "ما الذي ينبغي على المالك فعله بعد ذلك",
      description: "هذه التوصيات مقيدة بالأدلة الحية الظاهرة بالفعل في النظام.",
    },
    panel: {
      title: "التوصيات",
      description: "إجراءات مرتبطة بإشارات حقيقية موجودة بالفعل في الإنتاج.",
      openActionPath: "فتح مسار الإجراء",
    },
  },
  signals: {
    metadata: {
      title: "إشارات حية · Henry Onyx",
      description:
        "إشارات شذوذ وضغط حية من الحجوزات والفواتير ومحادثات الدعم وصفوف الطوابير وعمليات الأتمتة الفعلية في مشروع Supabase الخاص بـ Henry Onyx.",
    },
    hero: {
      eyebrow: "الإشارات",
      title: "إشارات شذوذ وضغط حية",
      description:
        "كل عنصر أدناه يُنشأ من حجوزات وفواتير ومحادثات دعم وصفوف طابور أو عمليات أتمتة فعلية مخزّنة بالفعل في مشروع Supabase المشترك.",
    },
    panel: {
      title: "الإشارات",
      description: "إشارات خام مدعومة بالأدلة تشغّل طبقة المساعد.",
    },
  },
};

const HUB_OWNER_AI_COPY_DE: DeepPartial<HubOwnerAiCopy> = {
  overview: {
    metadata: {
      title: "Signale & Empfehlungen · Henry Onyx",
      description:
        "Evidenzbasiertes Executive-Briefing für den Henry Onyx-Eigentümer — Briefings, Aktionskarten und Bereichsdruck, gebaut aus Live-Signalen des Unternehmens.",
    },
    hero: {
      eyebrow: "Signale & Empfehlungen",
      title: "Evidenzbasiertes Executive-Briefing",
      description:
        "Briefings und Aktionskarten entstehen ausschließlich aus Live-Signalen des Unternehmens — kein generischer Spam. Nutzen Sie den Team-Chat zur Abstimmung, diese Ebene zum Priorisieren.",
      signals: "Signale",
      insights: "Empfehlungen",
    },
    briefing: {
      title: "Executive-Briefing",
      description: "Was jetzt zählt, was als Nächstes zu öffnen ist und wo Kommunikationsdruck entsteht.",
      failedDeliveries: "Fehlgeschlagene Zustellungen",
      whatsappSkipped: "WhatsApp übersprungen",
      openSupport: "Offener Support",
      queuedNotices: "Wartende Benachrichtigungen",
    },
    actionQueue: {
      title: "Aktions-Warteschlange",
      description: "Jede Karte verlinkt auf die exakte Oberfläche, auf der die Evidenz liegt.",
      openLink: "Öffnen →",
    },
    divisionPressure: {
      title: "Bereichsdruck",
      description: "Geschäftsbereiche mit niedrigerer Gesundheitsbewertung oder dünner Telemetrie.",
      healthTemplate: "Stabilitätsindex {score}",
      divisionDetail: "Bereichs-Detail →",
    },
    scorecards: {
      title: "Aktuelle Signal-Karten",
      description: "Bereichsübergreifende Gesundheitsbewertung aus demselben Datensatz wie die Briefings.",
      healthScoreTemplate: "Stabilitätsindex {score}",
    },
  },
  insights: {
    metadata: {
      title: "Assistenten-Empfehlungen · Henry Onyx",
      description:
        "Empfehlungen für den Henry Onyx-Eigentümer, beschränkt auf die in der Produktion bereits sichtbare Live-Evidenz.",
    },
    hero: {
      eyebrow: "Empfehlungen",
      title: "Was der Eigentümer als Nächstes tun sollte",
      description: "Diese Empfehlungen sind auf die bereits im System sichtbare Live-Evidenz beschränkt.",
    },
    panel: {
      title: "Empfehlungen",
      description: "Aktionen, die mit echten, in der Produktion vorhandenen Signalen verknüpft sind.",
      openActionPath: "Aktionspfad öffnen",
    },
  },
  signals: {
    metadata: {
      title: "Live-Signale · Henry Onyx",
      description:
        "Live-Anomalie- und Drucksignale aus echten Buchungen, Rechnungen, Support-Threads, Warteschlangen und Automations-Läufen im Henry Onyx-Supabase-Projekt.",
    },
    hero: {
      eyebrow: "Signale",
      title: "Live-Anomalie- und Drucksignale",
      description:
        "Jeder Eintrag unten wird aus echten Buchungen, Rechnungen, Support-Threads, Warteschlangenzeilen oder Automations-Läufen erzeugt, die bereits im gemeinsamen Supabase-Projekt liegen.",
    },
    panel: {
      title: "Signale",
      description: "Rohsignale mit Evidenz-Beleg, die die Assistenten-Ebene antreiben.",
    },
  },
};

const HUB_OWNER_AI_COPY_IT: DeepPartial<HubOwnerAiCopy> = {
  overview: {
    metadata: {
      title: "Segnali e raccomandazioni · Henry Onyx",
      description:
        "Sintesi esecutive basate sulle evidenze per il proprietario Henry Onyx: sintesi, schede d’azione e pressione per divisione costruite da segnali aziendali in tempo reale.",
    },
    hero: {
      eyebrow: "Segnali e raccomandazioni",
      title: "Sintesi esecutive basate sulle evidenze",
      description:
        "Sintesi e schede d’azione sono costruite solo da segnali aziendali in tempo reale — non da spam generico. Usa la chat di team per coordinare; usa questo livello per dare priorità.",
      signals: "Segnali",
      insights: "Raccomandazioni",
    },
    briefing: {
      title: "Sintesi esecutiva",
      description: "Cosa conta ora, cosa aprire dopo e dove si accumula la pressione di comunicazione.",
      failedDeliveries: "Consegne fallite",
      whatsappSkipped: "WhatsApp saltato",
      openSupport: "Supporto aperto",
      queuedNotices: "Avvisi in coda",
    },
    actionQueue: {
      title: "Coda azioni",
      description: "Ogni scheda rimanda alla superficie esatta in cui risiede l’evidenza.",
      openLink: "Apri →",
    },
    divisionPressure: {
      title: "Pressione per divisione",
      description: "Divisioni con punteggi di salute più bassi o telemetria scarsa.",
      healthTemplate: "Indice di stabilità {score}",
      divisionDetail: "Dettaglio divisione →",
    },
    scorecards: {
      title: "Schede di segnale attuali",
      description: "Punteggio di salute interdivisionale dallo stesso dataset delle sintesi.",
      healthScoreTemplate: "Indice di stabilità {score}",
    },
  },
  insights: {
    metadata: {
      title: "Raccomandazioni dell’assistente · Henry Onyx",
      description:
        "Raccomandazioni per il proprietario Henry Onyx limitate all’evidenza viva già visibile nel sistema di produzione.",
    },
    hero: {
      eyebrow: "Raccomandazioni",
      title: "Cosa dovrebbe fare il proprietario adesso",
      description: "Queste raccomandazioni sono limitate all’evidenza viva già visibile nel sistema.",
    },
    panel: {
      title: "Raccomandazioni",
      description: "Azioni collegate a segnali reali già presenti in produzione.",
      openActionPath: "Apri percorso d’azione",
    },
  },
  signals: {
    metadata: {
      title: "Segnali in tempo reale · Henry Onyx",
      description:
        "Segnali di anomalia e pressione in tempo reale da prenotazioni, fatture, thread di supporto, righe di coda ed esecuzioni di automazione reali nel progetto Supabase di Henry Onyx.",
    },
    hero: {
      eyebrow: "Segnali",
      title: "Segnali in tempo reale di anomalia e pressione",
      description:
        "Ogni voce qui sotto è generata da prenotazioni, fatture, thread di supporto, righe di coda o esecuzioni di automazione reali già memorizzate nel progetto Supabase condiviso.",
    },
    panel: {
      title: "Segnali",
      description: "Segnali grezzi supportati da evidenze che alimentano il livello assistente.",
    },
  },
};

const HUB_OWNER_AI_COPY_ZH: DeepPartial<HubOwnerAiCopy> = {
  overview: {
    metadata: {
      title: "信号与洞察 · Henry Onyx",
      description: "面向 Henry Onyx 业主的循证高管简报 — 简报、行动卡和业务部门压力均基于公司实时信号构建。",
    },
    hero: {
      eyebrow: "信号与洞察",
      title: "基于证据的高管简报",
      description: "简报与行动卡仅由公司实时信号构建,而非通用垃圾信息。请使用团队聊天进行协调,使用本层进行优先级排序。",
      signals: "信号",
      insights: "洞察",
    },
    briefing: {
      title: "高管简报",
      description: "当前要务、下一步该打开什么,以及通讯压力在哪里聚集。",
      failedDeliveries: "投递失败",
      whatsappSkipped: "已跳过 WhatsApp",
      openSupport: "待处理支持",
      queuedNotices: "排队通知",
    },
    actionQueue: {
      title: "行动队列",
      description: "每张卡片都链接到证据所在的精确界面。",
      openLink: "打开 →",
    },
    divisionPressure: {
      title: "业务部门压力",
      description: "健康分较低或遥测数据稀疏的业务部门。",
      healthTemplate: "稳定指数 {score}",
      divisionDetail: "业务部门详情 →",
    },
    scorecards: {
      title: "当前信号卡",
      description: "与简报使用同一数据集的跨部门健康评分。",
      healthScoreTemplate: "稳定指数 {score}",
    },
  },
  insights: {
    metadata: {
      title: "助手洞察 · Henry Onyx",
      description: "面向 Henry Onyx 业主的建议,仅限于生产系统中已经可见的实时证据。",
    },
    hero: {
      eyebrow: "洞察",
      title: "业主接下来该做什么",
      description: "这些建议仅限于系统中已经可见的实时证据。",
    },
    panel: {
      title: "建议",
      description: "与生产环境中已存在的真实信号相关联的行动。",
      openActionPath: "打开行动路径",
    },
  },
  signals: {
    metadata: {
      title: "实时信号 · Henry Onyx",
      description: "来自 Henry Onyx Supabase 项目中真实预订、发票、支持工单、队列行和自动化运行的实时异常与压力信号。",
    },
    hero: {
      eyebrow: "信号",
      title: "实时异常与压力信号",
      description: "下列每一项都由共享 Supabase 项目中已存储的真实预订、发票、支持工单、队列行或自动化运行生成。",
    },
    panel: {
      title: "信号",
      description: "支持助手层的原始证据支撑信号。",
    },
  },
};

const HUB_OWNER_AI_COPY_HI: DeepPartial<HubOwnerAiCopy> = {
  overview: {
    // AI-claim strings removed (F1 truth pass) — these keys fall back to the
    // honest EN values; never machine-translate for this locale set.
    hero: {
      signals: "संकेत",
      insights: "सिफ़ारिशें",
    },
    briefing: {
      title: "कार्यकारी ब्रीफिंग",
      description: "अभी क्या ज़रूरी है, आगे क्या खोलें, और संचार दबाव कहाँ बन रहा है।",
      failedDeliveries: "विफल डिलीवरी",
      whatsappSkipped: "WhatsApp छोड़ा गया",
      openSupport: "खुला सपोर्ट",
      queuedNotices: "कतार में सूचनाएँ",
    },
    actionQueue: {
      title: "एक्शन कतार",
      description: "हर कार्ड उस सटीक सतह से जुड़ता है जहाँ साक्ष्य मौजूद है।",
      openLink: "खोलें →",
    },
    divisionPressure: {
      title: "डिवीज़न दबाव",
      description: "कम स्वास्थ्य स्कोर या कम टेलीमेट्री वाले डिवीज़न।",
      divisionDetail: "डिवीज़न विवरण →",
    },
    scorecards: {
      title: "वर्तमान संकेत कार्ड",
      description: "ब्रीफिंग के समान डेटासेट से क्रॉस-डिवीज़न स्वास्थ्य स्कोरिंग।",
    },
  },
  insights: {
    metadata: {
      title: "सहायक सिफ़ारिशें · Henry Onyx",
      description:
        "Henry Onyx मालिक के लिए सिफ़ारिशें जो प्रोडक्शन सिस्टम में पहले से दिखाई दे रहे लाइव साक्ष्य तक सीमित हैं।",
    },
    hero: {
      eyebrow: "सिफ़ारिशें",
      title: "मालिक को आगे क्या करना चाहिए",
      description: "ये सिफ़ारिशें केवल सिस्टम में पहले से दिखाई दे रहे लाइव साक्ष्य तक सीमित हैं।",
    },
    panel: {
      title: "सिफ़ारिशें",
      description: "प्रोडक्शन में पहले से मौजूद वास्तविक संकेतों से जुड़ी कार्रवाइयाँ।",
      openActionPath: "एक्शन पथ खोलें",
    },
  },
  signals: {
    metadata: {
      title: "लाइव संकेत · Henry Onyx",
      description:
        "Henry Onyx Supabase प्रोजेक्ट में मौजूद असली बुकिंग, इनवॉइस, सपोर्ट थ्रेड, क़तार पंक्तियों और ऑटोमेशन रन से उत्पन्न लाइव विसंगति और दबाव संकेत।",
    },
    hero: {
      eyebrow: "संकेत",
      title: "लाइव विसंगति और दबाव संकेत",
      description:
        "नीचे प्रत्येक आइटम साझा Supabase प्रोजेक्ट में पहले से संग्रहीत असली बुकिंग, इनवॉइस, सपोर्ट थ्रेड, क़तार पंक्तियों या ऑटोमेशन रन से उत्पन्न होता है।",
    },
    panel: {
      title: "संकेत",
      description: "साक्ष्य-समर्थित कच्चे संकेत जो सहायक परत को शक्ति देते हैं।",
    },
  },
};

const HUB_OWNER_AI_COPY_IG: DeepPartial<HubOwnerAiCopy> = {
  overview: {
    // AI-claim strings removed (F1 truth pass) — these keys fall back to the
    // honest EN values; never machine-translate for this locale set.
    hero: {
      signals: "Mgbaàmà",
      insights: "Ndụmọdụ",
    },
    briefing: {
      title: "Nchịkọta ndị isi",
      description: "Ihe dị mkpa ugbu a, ihe ga-emepe ọzọ, na ebe mpịkọta nkwukọrịta na-arị.",
      failedDeliveries: "Nnyefe dara",
      whatsappSkipped: "Agafere WhatsApp",
      openSupport: "Nkwado emepere",
      queuedNotices: "Ọkwa nọ n'usoro",
    },
    actionQueue: {
      title: "Usoro omume",
      description: "Kaadị ọ bụla na-ejikọ na nke kpọmkwem ebe ihe àmà dị.",
      openLink: "Mepee →",
    },
    divisionPressure: {
      title: "Mpịkọta ngalaba",
      description: "Ngalaba ndị nwere akara ahụike dị ala ma ọ bụ telemetry na-ekpe ekpe.",
      divisionDetail: "Nkọwa ngalaba →",
    },
    scorecards: {
      title: "Kaadị mgbaàmà ugbu a",
      description: "Akara ahụike n'ofe ngalaba sitere n'otu data ahụ dị ka nchịkọta.",
    },
  },
  insights: {
    metadata: {
      title: "Ndụmọdụ enyemaka · Henry Onyx",
      description:
        "Ndụmọdụ maka onye nwe Henry Onyx nke a kpọchiri n'ihe àmà dị ndụ nke a na-ahụ na sistemụ mmepụta.",
    },
    hero: {
      eyebrow: "Ndụmọdụ",
      title: "Ihe onye nwe kwesịrị ime ọzọ",
      description: "Ndụmọdụ ndị a dị naanị maka ihe àmà dị ndụ a na-ahụ na sistem.",
    },
    panel: {
      title: "Ndụmọdụ",
      description: "Omume jikọtara na mgbaàmà ndị dị adị na mmepụta.",
      openActionPath: "Mepee ụzọ omume",
    },
  },
  signals: {
    metadata: {
      title: "Mgbaàmà dị ndụ · Henry Onyx",
      description:
        "Mgbaàmà rụrụ arụ na mpịkọta dị ndụ sitere na nlekọta, ụgwọ, eziokwu nkwado, ahịrị usoro na mmegharị akpaka dị adị na ọrụ Supabase Henry Onyx.",
    },
    hero: {
      eyebrow: "Mgbaàmà",
      title: "Mgbaàmà rụrụ arụ na mpịkọta dị ndụ",
      description:
        "Ihe niile dị n'okpuru sitere na nlekọta, ụgwọ, eziokwu nkwado, ahịrị usoro ma ọ bụ mmegharị akpaka dị adị nke echekwararị na ọrụ Supabase nkesa.",
    },
    panel: {
      title: "Mgbaàmà",
      description: "Mgbaàmà osisi nke ihe àmà na-akwado, na-eduzi ọkwa enyemaka.",
    },
  },
};

const HUB_OWNER_AI_COPY_YO: DeepPartial<HubOwnerAiCopy> = {
  overview: {
    // AI-claim strings removed (F1 truth pass) — these keys fall back to the
    // honest EN values; never machine-translate for this locale set.
    hero: {
      signals: "Àmì",
      insights: "Àbá",
    },
    briefing: {
      title: "Àkójọpọ̀ olórí",
      description: "Ohun tó ṣe pàtàkì báyìí, ohun tó kàn láti ṣí, àti ibi tí ìpá ìbáraẹnisọ̀rọ̀ ti ń pọ̀.",
      failedDeliveries: "Ìfijíṣẹ́ tó kùnà",
      whatsappSkipped: "Wọ́n fò WhatsApp",
      openSupport: "Ìtìlẹ́yìn tó ṣí sílẹ̀",
      queuedNotices: "Ìfitónilétí tó ń dúró",
    },
    actionQueue: {
      title: "Ìtò ìṣe",
      description: "Káàdì kọ̀ọ̀kan so mọ́ ojú ìpele gangan tí ẹ̀rí wà.",
      openLink: "Ṣí →",
    },
    divisionPressure: {
      title: "Ìpá ìpín",
      description: "Àwọn ìpín tó ní iye ìlera kéréje tàbí telemetri tó kéré.",
      divisionDetail: "Àlàyé ìpín →",
    },
    scorecards: {
      title: "Káàdì àmì lọ́wọ́lọ́wọ́",
      description: "Iye ìlera oríṣiríṣi ìpín láti ara ẹ̀ka dátà kanna gẹ́gẹ́ bí àkójọpọ̀.",
    },
  },
  insights: {
    metadata: {
      title: "Àbá olùrànlọ́wọ́ · Henry Onyx",
      description:
        "Àbá fún onílé Henry Onyx tó dín kù sí ẹ̀rí aláàyè tí ó ti rí nínú ètò ìmújáde.",
    },
    hero: {
      eyebrow: "Àbá",
      title: "Ohun tí onílé yẹ kó ṣe tẹ̀le",
      description: "Àwọn àbá wọnyí ní ààlà sí ẹ̀rí aláàyè tí ó ti rí nínú ètò.",
    },
    panel: {
      title: "Àbá",
      description: "Ìṣe tó so mọ́ àwọn àmì gangan tí ó ti wà nínú ìmújáde.",
      openActionPath: "Ṣí ọ̀nà ìṣe",
    },
  },
  signals: {
    metadata: {
      title: "Àmì aláàyè · Henry Onyx",
      description:
        "Àmì àìpé àti àmì ìpá aláàyè láti ara ìfìbúkù, ìwé owó, ìjíròrò ìtìlẹ́yìn, ìlà ìtò, àti ìṣiṣẹ́ aládàákọ́ tó wà ní ojúlówó nínú iṣẹ́ Supabase Henry Onyx.",
    },
    hero: {
      eyebrow: "Àmì",
      title: "Àmì aláàyè ti àìpé àti ìpá",
      description:
        "Gbogbo ohun tí ó wà nísàlẹ̀ ni a dá láti ara ìfìbúkù, ìwé owó, ìjíròrò ìtìlẹ́yìn, ìlà ìtò, tàbí ìṣiṣẹ́ aládàákọ́ tó ti wà ní àjọpín iṣẹ́ Supabase.",
    },
    panel: {
      title: "Àmì",
      description: "Àwọn àmì àìṣe-méèlì tí ẹ̀rí ń tì lẹ́yìn, tí ó ń mu kọ̀ọ̀rì olùrànlọ́wọ́ ṣiṣẹ́.",
    },
  },
};

const HUB_OWNER_AI_COPY_HA: DeepPartial<HubOwnerAiCopy> = {
  overview: {
    // AI-claim strings removed (F1 truth pass) — these keys fall back to the
    // honest EN values; never machine-translate for this locale set.
    hero: {
      signals: "Alamomi",
      insights: "Shawarwari",
    },
    briefing: {
      title: "Taƙaitawar shugabanci",
      description: "Abin da ke da muhimmanci yanzu, abin da za a buɗe na gaba, da inda matsin sadarwa ke ƙaruwa.",
      failedDeliveries: "Bayarwa da ta gaza",
      whatsappSkipped: "An tsallake WhatsApp",
      openSupport: "Tallafi a buɗe",
      queuedNotices: "Sanarwa a layi",
    },
    actionQueue: {
      title: "Layin aiki",
      description: "Kowane katon yana danganta da daidai inda hujja take.",
      openLink: "Buɗe →",
    },
    divisionPressure: {
      title: "Matsin sashe",
      description: "Sashe da ke da ƙarancin maki na lafiya ko ƙarancin telemetiry.",
      divisionDetail: "Bayanin sashe →",
    },
    scorecards: {
      title: "Katunan alamomi na yanzu",
      description: "Makin lafiya na tsakanin sashe daga teburin bayanan iri ɗaya da taƙaitattu.",
    },
  },
  insights: {
    metadata: {
      title: "Shawarwarin mai taimako · Henry Onyx",
      description:
        "Shawarwari ga mai kamfanin Henry Onyx waɗanda aka iyakance ga hujjar rai da ake gani a tsarin samarwa.",
    },
    hero: {
      eyebrow: "Shawarwari",
      title: "Abin da mai kamfani zai yi na gaba",
      description: "Wadannan shawarwari sun iyakance ga hujjar rai da ake gani a tsarin.",
    },
    panel: {
      title: "Shawarwari",
      description: "Ayyukan da ke da alaƙa da alamomin gaske da ke yanzu a samarwa.",
      openActionPath: "Buɗe hanyar aiki",
    },
  },
  signals: {
    metadata: {
      title: "Alamomi masu rai · Henry Onyx",
      description:
        "Alamomin rashin daidaito da matsi masu rai daga ainihin ajiya, lissafi, tattaunawar tallafi, jerin layi, da gudanar da kai tsaye a aikin Supabase na Henry Onyx.",
    },
    hero: {
      eyebrow: "Alamomi",
      title: "Alamomi masu rai na rashin daidaito da matsi",
      description:
        "Kowane abu a ƙasa ana samar da shi ne daga ainihin ajiya, lissafi, tattaunawar tallafi, jerin layi, ko gudanar da kai tsaye da aka riga aka ajiye a cikin aikin Supabase na haɗin gwiwa.",
    },
    panel: {
      title: "Alamomi",
      description: "Alamomin danye da hujja ke tallafawa waɗanda ke ƙarfafa sashin mai taimako.",
    },
  },
};

const HUB_OWNER_AI_LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<HubOwnerAiCopy>>> = {
  fr: HUB_OWNER_AI_COPY_FR,
  es: HUB_OWNER_AI_COPY_ES,
  pt: HUB_OWNER_AI_COPY_PT,
  ar: HUB_OWNER_AI_COPY_AR,
  de: HUB_OWNER_AI_COPY_DE,
  it: HUB_OWNER_AI_COPY_IT,
  zh: HUB_OWNER_AI_COPY_ZH,
  hi: HUB_OWNER_AI_COPY_HI,
  ig: HUB_OWNER_AI_COPY_IG,
  yo: HUB_OWNER_AI_COPY_YO,
  ha: HUB_OWNER_AI_COPY_HA,
};

export function getHubOwnerAiCopy(locale: AppLocale): HubOwnerAiCopy {
  const overrides = HUB_OWNER_AI_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      HUB_OWNER_AI_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as HubOwnerAiCopy;
  }
  return HUB_OWNER_AI_COPY_EN;
}

/** @internal */
export function __dangerouslyGetEnglishHubOwnerAiCopy(): HubOwnerAiCopy {
  return HUB_OWNER_AI_COPY_EN;
}
