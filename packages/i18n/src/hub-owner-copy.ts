import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * HubOwnerCopy — i18n surface for the hub owner command-center overview
 * page (`apps/hub/app/owner/(command)/page.tsx`) and its directly-rendered
 * owner components.
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each locale is a
 * DeepPartial that deep-merges over EN so missing keys fall through to EN
 * silently. Mirrors the shape of `hub-public-copy.ts`.
 */
export type HubOwnerCopy = {
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    titleTemplate: string;
    description: string;
    inviteStaff: string;
    updateBrand: string;
  };
  dataHealth: {
    title: string;
  };
  situationRoom: {
    title: string;
    description: string;
    openSupport: string;
    failedDelivery: string;
    whatsappSkipped: string;
    queuedNotifications: string;
    nextStepsEyebrow: string;
  };
  metrics: {
    divisionsLive: string;
    divisionsLiveSubtitle: string;
    recognizedRevenue: string;
    recognizedRevenueSubtitle: string;
    openSupport: string;
    openSupportSubtitle: string;
    activeStaff: string;
    activeStaffSubtitle: string;
    criticalSignals: string;
    criticalSignalsSubtitle: string;
    outboundNotifications: string;
    outboundNotificationsSubtitle: string;
  };
  executiveDigest: {
    title: string;
    description: string;
    reviewAlerts: string;
    financePressure: string;
    manageWorkforce: string;
    helperLayer: string;
    teamChat: string;
    approvalCenter: string;
  };
  urgentSignals: {
    title: string;
    description: string;
    openModule: string;
  };
  divisionsPanel: {
    title: string;
    description: string;
    viewAll: string;
    healthLabelTemplate: string;
    revenueLabel: string;
    staffLabel: string;
    supportLabel: string;
  };
  helperInsights: {
    title: string;
    description: string;
    takeAction: string;
  };
  sensitiveActivity: {
    title: string;
    description: string;
    unknownTime: string;
  };
};

const HUB_OWNER_COPY_EN: HubOwnerCopy = {
  metadata: {
    title: "Owner command center · Henry & Co.",
    description:
      "Company-wide operations, finance, staffing, brand, delivery health, and owner guidance in one HenryCo HQ surface.",
  },
  hero: {
    eyebrow: "Central Owner Command Center",
    titleTemplate: "{company} company brain",
    description:
      "Company-wide operations, finance, staffing, brand, delivery health, and owner guidance in one HenryCo HQ surface.",
    inviteStaff: "Invite staff",
    updateBrand: "Update brand settings",
  },
  dataHealth: {
    title: "Data freshness",
  },
  situationRoom: {
    title: "Executive situation room",
    description: "Fast owner read for what matters now.",
    openSupport: "Open support",
    failedDelivery: "Failed delivery",
    whatsappSkipped: "WhatsApp skipped",
    queuedNotifications: "Queued notifications",
    nextStepsEyebrow: "Next best owner actions",
  },
  metrics: {
    divisionsLive: "Live divisions",
    divisionsLiveSubtitle: "Tracked by the command center",
    recognizedRevenue: "Recognized revenue",
    recognizedRevenueSubtitle: "Care, marketplace, and paid shared invoices",
    openSupport: "Open support pressure",
    openSupportSubtitle: "Cross-division support threads awaiting movement",
    activeStaff: "Active staff",
    activeStaffSubtitle: "Auth-backed workforce members seen recently",
    criticalSignals: "Critical signals",
    criticalSignalsSubtitle: "Items needing owner attention now",
    outboundNotifications: "Outbound notifications",
    outboundNotificationsSubtitle: "Queued email and WhatsApp delivery",
  },
  executiveDigest: {
    title: "Executive digest",
    description: "What needs attention now.",
    reviewAlerts: "Review operational alerts",
    financePressure: "Check finance pressure",
    manageWorkforce: "Manage workforce",
    helperLayer: "Open helper layer",
    teamChat: "Team internal chat",
    approvalCenter: "Approval center",
  },
  urgentSignals: {
    title: "Urgent signals",
    description: "Evidence-backed risk and anomaly detection from live tables.",
    openModule: "Open module",
  },
  divisionsPanel: {
    title: "Division control center",
    description: "One health map for every live or future HenryCo division.",
    viewAll: "View all divisions",
    healthLabelTemplate: "{label} health · {alerts} alerts · {open} open items",
    revenueLabel: "Revenue",
    staffLabel: "Staff",
    supportLabel: "Support",
  },
  helperInsights: {
    title: "Helper recommendations",
    description: "Only recommendations backed by live signals.",
    takeAction: "Take action",
  },
  sensitiveActivity: {
    title: "Sensitive activity",
    description: "Recent owner-facing audit and staff changes.",
    unknownTime: "Unknown time",
  },
};

const HUB_OWNER_COPY_FR: DeepPartial<HubOwnerCopy> = {
  metadata: {
    title: "Centre de commande propriétaire · Henry & Co.",
    description:
      "Opérations, finance, ressources humaines, marque, santé de livraison et conseils propriétaire à l’échelle de l’entreprise, réunis dans une seule surface HenryCo HQ.",
  },
  hero: {
    eyebrow: "Centre de commande propriétaire central",
    titleTemplate: "Cerveau d’entreprise de {company}",
    description:
      "Opérations, finance, ressources humaines, marque, santé de livraison et conseils propriétaire à l’échelle de l’entreprise, réunis dans une seule surface HenryCo HQ.",
    inviteStaff: "Inviter du personnel",
    updateBrand: "Mettre à jour la marque",
  },
  dataHealth: { title: "Fraîcheur des données" },
  situationRoom: {
    title: "Salle de situation exécutive",
    description: "Lecture rapide pour le propriétaire sur ce qui compte maintenant.",
    openSupport: "Support ouvert",
    failedDelivery: "Livraisons échouées",
    whatsappSkipped: "WhatsApp ignoré",
    queuedNotifications: "Notifications en attente",
    nextStepsEyebrow: "Meilleures actions à mener",
  },
  metrics: {
    divisionsLive: "Divisions actives",
    divisionsLiveSubtitle: "Suivies par le centre de commande",
    recognizedRevenue: "Revenu reconnu",
    recognizedRevenueSubtitle: "Care, marketplace et factures partagées payées",
    openSupport: "Pression du support ouvert",
    openSupportSubtitle: "Fils de support inter-divisions en attente",
    activeStaff: "Personnel actif",
    activeStaffSubtitle: "Membres authentifiés vus récemment",
    criticalSignals: "Signaux critiques",
    criticalSignalsSubtitle: "Sujets exigeant l’attention immédiate du propriétaire",
    outboundNotifications: "Notifications sortantes",
    outboundNotificationsSubtitle: "Envois e-mail et WhatsApp en file",
  },
  executiveDigest: {
    title: "Synthèse exécutive",
    description: "Ce qui demande de l’attention maintenant.",
    reviewAlerts: "Examiner les alertes opérationnelles",
    financePressure: "Vérifier la pression financière",
    manageWorkforce: "Gérer le personnel",
    helperLayer: "Ouvrir la couche assistante",
    teamChat: "Chat interne de l’équipe",
    approvalCenter: "Centre d’approbations",
  },
  urgentSignals: {
    title: "Signaux urgents",
    description: "Détection de risques et d’anomalies basée sur des données réelles.",
    openModule: "Ouvrir le module",
  },
  divisionsPanel: {
    title: "Centre de contrôle des divisions",
    description: "Une carte de santé pour chaque division HenryCo, actuelle ou future.",
    viewAll: "Voir toutes les divisions",
    healthLabelTemplate: "Santé {label} · {alerts} alertes · {open} dossiers ouverts",
    revenueLabel: "Revenu",
    staffLabel: "Personnel",
    supportLabel: "Support",
  },
  helperInsights: {
    title: "Recommandations de l’assistant",
    description: "Uniquement des recommandations adossées à des signaux réels.",
    takeAction: "Passer à l’action",
  },
  sensitiveActivity: {
    title: "Activité sensible",
    description: "Audit propriétaire et modifications de personnel récents.",
    unknownTime: "Heure inconnue",
  },
};

const HUB_OWNER_COPY_ES: DeepPartial<HubOwnerCopy> = {
  metadata: {
    title: "Centro de mando del propietario · Henry & Co.",
    description:
      "Operaciones, finanzas, plantilla, marca, salud de entrega y orientación al propietario en una sola superficie HenryCo HQ.",
  },
  hero: {
    eyebrow: "Centro de mando central del propietario",
    titleTemplate: "Cerebro corporativo de {company}",
    description:
      "Operaciones, finanzas, plantilla, marca, salud de entrega y orientación al propietario en una sola superficie HenryCo HQ.",
    inviteStaff: "Invitar al personal",
    updateBrand: "Actualizar la marca",
  },
  dataHealth: { title: "Frescura de los datos" },
  situationRoom: {
    title: "Sala de situación ejecutiva",
    description: "Lectura rápida del propietario sobre lo importante.",
    openSupport: "Soporte abierto",
    failedDelivery: "Entregas fallidas",
    whatsappSkipped: "WhatsApp omitido",
    queuedNotifications: "Notificaciones en cola",
    nextStepsEyebrow: "Mejores próximas acciones",
  },
  metrics: {
    divisionsLive: "Divisiones activas",
    divisionsLiveSubtitle: "Supervisadas por el centro de mando",
    recognizedRevenue: "Ingresos reconocidos",
    recognizedRevenueSubtitle: "Care, marketplace y facturas compartidas pagadas",
    openSupport: "Presión de soporte abierto",
    openSupportSubtitle: "Hilos de soporte interdivisión pendientes",
    activeStaff: "Personal activo",
    activeStaffSubtitle: "Miembros autenticados vistos recientemente",
    criticalSignals: "Señales críticas",
    criticalSignalsSubtitle: "Asuntos que requieren atención del propietario ahora",
    outboundNotifications: "Notificaciones salientes",
    outboundNotificationsSubtitle: "Envíos de correo y WhatsApp en cola",
  },
  executiveDigest: {
    title: "Resumen ejecutivo",
    description: "Lo que requiere atención ahora.",
    reviewAlerts: "Revisar alertas operativas",
    financePressure: "Comprobar presión financiera",
    manageWorkforce: "Gestionar la plantilla",
    helperLayer: "Abrir capa asistente",
    teamChat: "Chat interno del equipo",
    approvalCenter: "Centro de aprobaciones",
  },
  urgentSignals: {
    title: "Señales urgentes",
    description: "Detección de riesgos y anomalías basada en datos reales.",
    openModule: "Abrir módulo",
  },
  divisionsPanel: {
    title: "Centro de control de divisiones",
    description: "Un mapa de salud para cada división HenryCo, actual o futura.",
    viewAll: "Ver todas las divisiones",
    healthLabelTemplate: "Salud {label} · {alerts} alertas · {open} pendientes",
    revenueLabel: "Ingresos",
    staffLabel: "Personal",
    supportLabel: "Soporte",
  },
  helperInsights: {
    title: "Recomendaciones del asistente",
    description: "Solo recomendaciones respaldadas por señales reales.",
    takeAction: "Actuar",
  },
  sensitiveActivity: {
    title: "Actividad sensible",
    description: "Auditoría reciente del propietario y cambios de personal.",
    unknownTime: "Hora desconocida",
  },
};

const HUB_OWNER_COPY_PT: DeepPartial<HubOwnerCopy> = {
  metadata: {
    title: "Centro de comando do proprietário · Henry & Co.",
    description:
      "Operações, finanças, equipa, marca, saúde de entrega e orientação do proprietário numa só superfície HenryCo HQ.",
  },
  hero: {
    eyebrow: "Centro de comando central do proprietário",
    titleTemplate: "Cérebro empresarial de {company}",
    description:
      "Operações, finanças, equipa, marca, saúde de entrega e orientação do proprietário numa só superfície HenryCo HQ.",
    inviteStaff: "Convidar pessoal",
    updateBrand: "Actualizar marca",
  },
  dataHealth: { title: "Actualidade dos dados" },
  situationRoom: {
    title: "Sala de situação executiva",
    description: "Leitura rápida do proprietário sobre o que importa agora.",
    openSupport: "Suporte aberto",
    failedDelivery: "Entregas falhadas",
    whatsappSkipped: "WhatsApp ignorado",
    queuedNotifications: "Notificações em fila",
    nextStepsEyebrow: "Melhores próximas acções do proprietário",
  },
  metrics: {
    divisionsLive: "Divisões activas",
    divisionsLiveSubtitle: "Acompanhadas pelo centro de comando",
    recognizedRevenue: "Receita reconhecida",
    recognizedRevenueSubtitle: "Care, marketplace e facturas partilhadas pagas",
    openSupport: "Pressão de suporte aberto",
    openSupportSubtitle: "Tópicos de suporte interdivisões a aguardar",
    activeStaff: "Equipa activa",
    activeStaffSubtitle: "Membros autenticados vistos recentemente",
    criticalSignals: "Sinais críticos",
    criticalSignalsSubtitle: "Itens que exigem atenção do proprietário agora",
    outboundNotifications: "Notificações enviadas",
    outboundNotificationsSubtitle: "Entregas de e-mail e WhatsApp em fila",
  },
  executiveDigest: {
    title: "Resumo executivo",
    description: "O que requer atenção agora.",
    reviewAlerts: "Rever alertas operacionais",
    financePressure: "Verificar pressão financeira",
    manageWorkforce: "Gerir a equipa",
    helperLayer: "Abrir camada de assistente",
    teamChat: "Chat interno da equipa",
    approvalCenter: "Centro de aprovações",
  },
  urgentSignals: {
    title: "Sinais urgentes",
    description: "Detecção de risco e anomalias baseada em dados reais.",
    openModule: "Abrir módulo",
  },
  divisionsPanel: {
    title: "Centro de controlo de divisões",
    description: "Um mapa de saúde para cada divisão HenryCo, actual ou futura.",
    viewAll: "Ver todas as divisões",
    healthLabelTemplate: "Saúde {label} · {alerts} alertas · {open} pendentes",
    revenueLabel: "Receita",
    staffLabel: "Equipa",
    supportLabel: "Suporte",
  },
  helperInsights: {
    title: "Recomendações do assistente",
    description: "Apenas recomendações apoiadas em sinais reais.",
    takeAction: "Agir",
  },
  sensitiveActivity: {
    title: "Actividade sensível",
    description: "Auditoria recente do proprietário e alterações de pessoal.",
    unknownTime: "Hora desconhecida",
  },
};

const HUB_OWNER_COPY_AR: DeepPartial<HubOwnerCopy> = {
  metadata: {
    title: "مركز قيادة المالك · Henry & Co.",
    description:
      "العمليات والمالية والموظفون والعلامة وصحة التسليم وإرشاد المالك على نطاق الشركة، كل ذلك في واجهة واحدة من HenryCo HQ.",
  },
  hero: {
    eyebrow: "مركز قيادة المالك المركزي",
    titleTemplate: "العقل المؤسسي لشركة {company}",
    description:
      "العمليات والمالية والموظفون والعلامة وصحة التسليم وإرشاد المالك على نطاق الشركة، كل ذلك في واجهة واحدة من HenryCo HQ.",
    inviteStaff: "دعوة موظفين",
    updateBrand: "تحديث إعدادات العلامة",
  },
  dataHealth: { title: "حداثة البيانات" },
  situationRoom: {
    title: "غرفة الموقف التنفيذية",
    description: "قراءة سريعة للمالك حول ما يهم الآن.",
    openSupport: "الدعم المفتوح",
    failedDelivery: "تسليم فاشل",
    whatsappSkipped: "تم تخطي واتساب",
    queuedNotifications: "إشعارات في الانتظار",
    nextStepsEyebrow: "أفضل الإجراءات التالية للمالك",
  },
  metrics: {
    divisionsLive: "الأقسام النشطة",
    divisionsLiveSubtitle: "مُتابَعة من مركز القيادة",
    recognizedRevenue: "الإيرادات المعترف بها",
    recognizedRevenueSubtitle: "Care والسوق والفواتير المشتركة المدفوعة",
    openSupport: "ضغط الدعم المفتوح",
    openSupportSubtitle: "محادثات دعم متعددة الأقسام تنتظر التحرك",
    activeStaff: "الموظفون النشطون",
    activeStaffSubtitle: "أعضاء فريق العمل المعتمدون والمرئيون مؤخرًا",
    criticalSignals: "إشارات حرجة",
    criticalSignalsSubtitle: "عناصر تتطلب اهتمام المالك الآن",
    outboundNotifications: "الإشعارات الصادرة",
    outboundNotificationsSubtitle: "بريد إلكتروني وواتساب في قائمة الانتظار",
  },
  executiveDigest: {
    title: "الموجز التنفيذي",
    description: "ما يحتاج إلى الاهتمام الآن.",
    reviewAlerts: "مراجعة التنبيهات التشغيلية",
    financePressure: "فحص الضغط المالي",
    manageWorkforce: "إدارة فريق العمل",
    helperLayer: "فتح طبقة المساعد",
    teamChat: "دردشة الفريق الداخلية",
    approvalCenter: "مركز الموافقات",
  },
  urgentSignals: {
    title: "إشارات عاجلة",
    description: "كشف المخاطر والشذوذ مدعوم بالأدلة من الجداول الحية.",
    openModule: "فتح الوحدة",
  },
  divisionsPanel: {
    title: "مركز التحكم بالأقسام",
    description: "خريطة صحية لكل قسم من أقسام HenryCo حاليًا ومستقبلًا.",
    viewAll: "عرض كل الأقسام",
    healthLabelTemplate: "صحة {label} · {alerts} تنبيهات · {open} عناصر مفتوحة",
    revenueLabel: "الإيرادات",
    staffLabel: "الموظفون",
    supportLabel: "الدعم",
  },
  helperInsights: {
    title: "توصيات المساعد",
    description: "توصيات مدعومة فقط بإشارات حية.",
    takeAction: "اتخاذ إجراء",
  },
  sensitiveActivity: {
    title: "نشاط حساس",
    description: "أحدث عمليات تدقيق المالك وتغييرات الموظفين.",
    unknownTime: "وقت غير معروف",
  },
};

const HUB_OWNER_COPY_DE: DeepPartial<HubOwnerCopy> = {
  metadata: {
    title: "Eigentümer-Kommandozentrale · Henry & Co.",
    description:
      "Unternehmensweite Operationen, Finanzen, Personal, Marke, Liefergesundheit und Eigentümer-Führung auf einer einzigen HenryCo-HQ-Oberfläche.",
  },
  hero: {
    eyebrow: "Zentrale Eigentümer-Kommandozentrale",
    titleTemplate: "Unternehmensgehirn von {company}",
    description:
      "Unternehmensweite Operationen, Finanzen, Personal, Marke, Liefergesundheit und Eigentümer-Führung auf einer einzigen HenryCo-HQ-Oberfläche.",
    inviteStaff: "Mitarbeitende einladen",
    updateBrand: "Markeneinstellungen aktualisieren",
  },
  dataHealth: { title: "Datenaktualität" },
  situationRoom: {
    title: "Executive-Situationsraum",
    description: "Schneller Eigentümer-Blick auf das, was jetzt wichtig ist.",
    openSupport: "Offener Support",
    failedDelivery: "Fehlgeschlagene Zustellung",
    whatsappSkipped: "WhatsApp übersprungen",
    queuedNotifications: "Wartende Benachrichtigungen",
    nextStepsEyebrow: "Beste nächste Eigentümer-Aktionen",
  },
  metrics: {
    divisionsLive: "Aktive Geschäftsbereiche",
    divisionsLiveSubtitle: "Von der Kommandozentrale überwacht",
    recognizedRevenue: "Erfasster Umsatz",
    recognizedRevenueSubtitle: "Care, Marketplace und bezahlte geteilte Rechnungen",
    openSupport: "Offener Support-Druck",
    openSupportSubtitle: "Bereichsübergreifende Support-Threads, die auf Bewegung warten",
    activeStaff: "Aktive Mitarbeitende",
    activeStaffSubtitle: "Authentifizierte Teammitglieder, kürzlich gesehen",
    criticalSignals: "Kritische Signale",
    criticalSignalsSubtitle: "Punkte, die jetzt die Aufmerksamkeit des Eigentümers benötigen",
    outboundNotifications: "Ausgehende Benachrichtigungen",
    outboundNotificationsSubtitle: "E-Mail- und WhatsApp-Versand in der Warteschlange",
  },
  executiveDigest: {
    title: "Executive-Digest",
    description: "Was jetzt Aufmerksamkeit benötigt.",
    reviewAlerts: "Betriebliche Warnungen prüfen",
    financePressure: "Finanzdruck überprüfen",
    manageWorkforce: "Belegschaft verwalten",
    helperLayer: "Assistenten-Ebene öffnen",
    teamChat: "Interner Team-Chat",
    approvalCenter: "Genehmigungszentrum",
  },
  urgentSignals: {
    title: "Dringende Signale",
    description: "Risiken und Anomalien, belegt durch Daten aus Live-Tabellen.",
    openModule: "Modul öffnen",
  },
  divisionsPanel: {
    title: "Geschäftsbereichs-Kontrollzentrum",
    description: "Eine Gesundheitskarte für jeden aktuellen oder künftigen HenryCo-Bereich.",
    viewAll: "Alle Bereiche anzeigen",
    healthLabelTemplate: "{label}-Zustand · {alerts} Warnungen · {open} offene Punkte",
    revenueLabel: "Umsatz",
    staffLabel: "Personal",
    supportLabel: "Support",
  },
  helperInsights: {
    title: "Assistenten-Empfehlungen",
    description: "Nur Empfehlungen, die durch Live-Signale gestützt sind.",
    takeAction: "Aktion ausführen",
  },
  sensitiveActivity: {
    title: "Sensible Aktivität",
    description: "Aktuelle Eigentümer-Audits und Personaländerungen.",
    unknownTime: "Unbekannte Zeit",
  },
};

const HUB_OWNER_COPY_IT: DeepPartial<HubOwnerCopy> = {
  metadata: {
    title: "Centro di comando del proprietario · Henry & Co.",
    description:
      "Operazioni, finanza, personale, brand, salute delle consegne e guida del proprietario a livello aziendale, riuniti in un’unica superficie HenryCo HQ.",
  },
  hero: {
    eyebrow: "Centro di comando centrale del proprietario",
    titleTemplate: "Cervello aziendale di {company}",
    description:
      "Operazioni, finanza, personale, brand, salute delle consegne e guida del proprietario a livello aziendale, riuniti in un’unica superficie HenryCo HQ.",
    inviteStaff: "Invita personale",
    updateBrand: "Aggiorna impostazioni brand",
  },
  dataHealth: { title: "Freschezza dei dati" },
  situationRoom: {
    title: "Sala situazione esecutiva",
    description: "Lettura rapida del proprietario su ciò che conta ora.",
    openSupport: "Supporto aperto",
    failedDelivery: "Consegne fallite",
    whatsappSkipped: "WhatsApp saltati",
    queuedNotifications: "Notifiche in coda",
    nextStepsEyebrow: "Migliori prossime azioni del proprietario",
  },
  metrics: {
    divisionsLive: "Divisioni attive",
    divisionsLiveSubtitle: "Monitorate dal centro di comando",
    recognizedRevenue: "Ricavi riconosciuti",
    recognizedRevenueSubtitle: "Care, marketplace e fatture condivise pagate",
    openSupport: "Pressione del supporto aperto",
    openSupportSubtitle: "Conversazioni di supporto interdivisione in attesa",
    activeStaff: "Personale attivo",
    activeStaffSubtitle: "Membri autenticati visti di recente",
    criticalSignals: "Segnali critici",
    criticalSignalsSubtitle: "Voci che richiedono ora l’attenzione del proprietario",
    outboundNotifications: "Notifiche in uscita",
    outboundNotificationsSubtitle: "Invii e-mail e WhatsApp in coda",
  },
  executiveDigest: {
    title: "Sintesi esecutiva",
    description: "Cosa richiede attenzione adesso.",
    reviewAlerts: "Esamina avvisi operativi",
    financePressure: "Controlla la pressione finanziaria",
    manageWorkforce: "Gestisci il personale",
    helperLayer: "Apri il livello assistente",
    teamChat: "Chat interna del team",
    approvalCenter: "Centro approvazioni",
  },
  urgentSignals: {
    title: "Segnali urgenti",
    description: "Rilevamento di rischi e anomalie supportato da dati reali.",
    openModule: "Apri modulo",
  },
  divisionsPanel: {
    title: "Centro di controllo delle divisioni",
    description: "Una mappa di salute per ogni divisione HenryCo, attuale o futura.",
    viewAll: "Vedi tutte le divisioni",
    healthLabelTemplate: "Salute {label} · {alerts} avvisi · {open} in sospeso",
    revenueLabel: "Ricavi",
    staffLabel: "Personale",
    supportLabel: "Supporto",
  },
  helperInsights: {
    title: "Raccomandazioni dell’assistente",
    description: "Solo raccomandazioni supportate da segnali reali.",
    takeAction: "Agisci",
  },
  sensitiveActivity: {
    title: "Attività sensibili",
    description: "Audit recenti del proprietario e modifiche del personale.",
    unknownTime: "Ora sconosciuta",
  },
};

const HUB_OWNER_COPY_ZH: DeepPartial<HubOwnerCopy> = {
  metadata: {
    title: "业主指挥中心 · Henry & Co.",
    description: "在一个 HenryCo HQ 界面中,统一掌握全公司的运营、财务、人员、品牌、交付健康以及业主指引。",
  },
  hero: {
    eyebrow: "中央业主指挥中心",
    titleTemplate: "{company} 公司大脑",
    description: "在一个 HenryCo HQ 界面中,统一掌握全公司的运营、财务、人员、品牌、交付健康以及业主指引。",
    inviteStaff: "邀请员工",
    updateBrand: "更新品牌设置",
  },
  dataHealth: { title: "数据新鲜度" },
  situationRoom: {
    title: "高管态势室",
    description: "业主快速了解当前重要事项。",
    openSupport: "待处理支持",
    failedDelivery: "投递失败",
    whatsappSkipped: "已跳过 WhatsApp",
    queuedNotifications: "排队通知",
    nextStepsEyebrow: "业主下一步最佳动作",
  },
  metrics: {
    divisionsLive: "活跃业务部门",
    divisionsLiveSubtitle: "由指挥中心追踪",
    recognizedRevenue: "已确认收入",
    recognizedRevenueSubtitle: "Care、市场以及已付款的共享发票",
    openSupport: "待处理支持压力",
    openSupportSubtitle: "跨部门待跟进的支持工单",
    activeStaff: "活跃员工",
    activeStaffSubtitle: "近期可见的已认证团队成员",
    criticalSignals: "关键信号",
    criticalSignalsSubtitle: "目前需要业主关注的事项",
    outboundNotifications: "外发通知",
    outboundNotificationsSubtitle: "排队的邮件与 WhatsApp 投递",
  },
  executiveDigest: {
    title: "高管摘要",
    description: "当前需要关注的内容。",
    reviewAlerts: "查看运营告警",
    financePressure: "查看财务压力",
    manageWorkforce: "管理团队",
    helperLayer: "打开助手层",
    teamChat: "团队内部聊天",
    approvalCenter: "审批中心",
  },
  urgentSignals: {
    title: "紧急信号",
    description: "基于实时数据的风险与异常检测。",
    openModule: "打开模块",
  },
  divisionsPanel: {
    title: "业务部门控制中心",
    description: "为每个当前或未来的 HenryCo 业务部门提供一张健康地图。",
    viewAll: "查看所有业务部门",
    healthLabelTemplate: "{label} 健康 · {alerts} 个告警 · {open} 个待处理",
    revenueLabel: "收入",
    staffLabel: "人员",
    supportLabel: "支持",
  },
  helperInsights: {
    title: "助手推荐",
    description: "仅展示由实时信号支持的建议。",
    takeAction: "采取行动",
  },
  sensitiveActivity: {
    title: "敏感活动",
    description: "近期面向业主的审计与员工变更。",
    unknownTime: "时间未知",
  },
};

const HUB_OWNER_COPY_HI: DeepPartial<HubOwnerCopy> = {
  metadata: {
    title: "मालिक कमांड सेंटर · Henry & Co.",
    description:
      "कंपनी-व्यापी संचालन, वित्त, स्टाफिंग, ब्रांड, डिलीवरी स्वास्थ्य और मालिक मार्गदर्शन एक ही HenryCo HQ सतह पर।",
  },
  hero: {
    eyebrow: "केंद्रीय मालिक कमांड सेंटर",
    titleTemplate: "{company} कंपनी का दिमाग",
    description:
      "कंपनी-व्यापी संचालन, वित्त, स्टाफिंग, ब्रांड, डिलीवरी स्वास्थ्य और मालिक मार्गदर्शन एक ही HenryCo HQ सतह पर।",
    inviteStaff: "स्टाफ़ आमंत्रित करें",
    updateBrand: "ब्रांड सेटिंग्स अपडेट करें",
  },
  dataHealth: { title: "डेटा ताज़ापन" },
  situationRoom: {
    title: "कार्यकारी स्थिति कक्ष",
    description: "अभी क्या ज़रूरी है, इसकी मालिक के लिए त्वरित जानकारी।",
    openSupport: "खुला सपोर्ट",
    failedDelivery: "विफल डिलीवरी",
    whatsappSkipped: "WhatsApp छोड़ा गया",
    queuedNotifications: "कतार में सूचनाएँ",
    nextStepsEyebrow: "मालिक के लिए अगले सर्वोत्तम कदम",
  },
  metrics: {
    divisionsLive: "सक्रिय डिवीज़न",
    divisionsLiveSubtitle: "कमांड सेंटर द्वारा निगरानी",
    recognizedRevenue: "मान्यता प्राप्त राजस्व",
    recognizedRevenueSubtitle: "Care, मार्केटप्लेस और भुगतान किए गए साझा इनवॉइस",
    openSupport: "खुले सपोर्ट का दबाव",
    openSupportSubtitle: "विभिन्न डिवीज़न में रुके हुए सपोर्ट थ्रेड",
    activeStaff: "सक्रिय स्टाफ़",
    activeStaffSubtitle: "हाल में दिखे प्रामाणित टीम सदस्य",
    criticalSignals: "महत्वपूर्ण संकेत",
    criticalSignalsSubtitle: "जिन्हें अभी मालिक के ध्यान की आवश्यकता है",
    outboundNotifications: "बाहर जाने वाली सूचनाएँ",
    outboundNotificationsSubtitle: "कतार में ईमेल और WhatsApp डिलीवरी",
  },
  executiveDigest: {
    title: "कार्यकारी सारांश",
    description: "अभी किस पर ध्यान चाहिए।",
    reviewAlerts: "ऑपरेशनल अलर्ट्स की समीक्षा",
    financePressure: "वित्तीय दबाव जाँचें",
    manageWorkforce: "स्टाफ़ का प्रबंधन करें",
    helperLayer: "सहायक परत खोलें",
    teamChat: "टीम आंतरिक चैट",
    approvalCenter: "स्वीकृति केंद्र",
  },
  urgentSignals: {
    title: "तत्काल संकेत",
    description: "लाइव टेबल से जोखिम और विसंगति की प्रमाण-आधारित पहचान।",
    openModule: "मॉड्यूल खोलें",
  },
  divisionsPanel: {
    title: "डिवीज़न नियंत्रण केंद्र",
    description: "हर वर्तमान या भविष्य के HenryCo डिवीज़न के लिए एक स्वास्थ्य मानचित्र।",
    viewAll: "सभी डिवीज़न देखें",
    healthLabelTemplate: "{label} स्वास्थ्य · {alerts} अलर्ट · {open} खुले कार्य",
    revenueLabel: "राजस्व",
    staffLabel: "स्टाफ़",
    supportLabel: "सपोर्ट",
  },
  helperInsights: {
    title: "सहायक सिफारिशें",
    description: "केवल लाइव संकेतों से समर्थित सिफारिशें।",
    takeAction: "कार्रवाई करें",
  },
  sensitiveActivity: {
    title: "संवेदनशील गतिविधि",
    description: "हाल के मालिक-स्तरीय ऑडिट और स्टाफ़ परिवर्तन।",
    unknownTime: "समय अज्ञात",
  },
};

const HUB_OWNER_COPY_IG: DeepPartial<HubOwnerCopy> = {
  metadata: {
    title: "Ebe nchịkwa onye nwe · Henry & Co.",
    description:
      "Ọrụ ụlọ ọrụ niile, ego, ndị ọrụ, akara, ahụike nnyefe, na nduzi onye nwe n'otu elu HenryCo HQ.",
  },
  hero: {
    eyebrow: "Ebe nchịkwa etiti onye nwe",
    titleTemplate: "Ụbụrụ ụlọ ọrụ {company}",
    description:
      "Ọrụ ụlọ ọrụ niile, ego, ndị ọrụ, akara, ahụike nnyefe, na nduzi onye nwe n'otu elu HenryCo HQ.",
    inviteStaff: "Kpọọ ndị ọrụ",
    updateBrand: "Melite ntọala akara",
  },
  dataHealth: { title: "Ọhụrụ nke data" },
  situationRoom: {
    title: "Ụlọ ọnọdụ nke ndị isi",
    description: "Nkọwa ngwa ngwa maka onye nwe gbasara ihe dị mkpa ugbu a.",
    openSupport: "Nkwado emepere emepe",
    failedDelivery: "Nnyefe dara",
    whatsappSkipped: "Agafere WhatsApp",
    queuedNotifications: "Ọkwa nọ n'usoro",
    nextStepsEyebrow: "Omume kachasị mma maka onye nwe",
  },
  metrics: {
    divisionsLive: "Ngalaba na-arụ ọrụ",
    divisionsLiveSubtitle: "Ebe nchịkwa na-eleba anya na ya",
    recognizedRevenue: "Ego anabatara",
    recognizedRevenueSubtitle: "Care, ahịa na ụgwọ kekọrịtara akwụrụ",
    openSupport: "Mpịkọta nkwado emepere",
    openSupportSubtitle: "Eziokwu nkwado n'ọtụtụ ngalaba na-eche ngagharị",
    activeStaff: "Ndị ọrụ na-arụ ọrụ",
    activeStaffSubtitle: "Ndị otu enwetara nakwa hụrụ n'oge na-adịbeghị anya",
    criticalSignals: "Mgbaàmà dị oké mkpa",
    criticalSignalsSubtitle: "Ihe chọrọ nlebara anya onye nwe ugbu a",
    outboundNotifications: "Ọkwa na-apụ apụ",
    outboundNotificationsSubtitle: "Email na WhatsApp na-eche oge nnyefe",
  },
  executiveDigest: {
    title: "Nchịkọta isi",
    description: "Ihe chọrọ nlebara anya ugbu a.",
    reviewAlerts: "Lelee mkpọsa ọrụ",
    financePressure: "Lelee mpịkọta ego",
    manageWorkforce: "Jikwaa ndị ọrụ",
    helperLayer: "Mepee oyi ohere enyemaka",
    teamChat: "Mkparịta ụka ime nke otu",
    approvalCenter: "Ebe nkwado",
  },
  urgentSignals: {
    title: "Mgbaàmà ngwa ngwa",
    description: "Nchọpụta ihe ize ndụ na ihe na-adịghị mma sitere na data ndị dị ndụ.",
    openModule: "Mepee modul",
  },
  divisionsPanel: {
    title: "Ebe nchịkwa ngalaba",
    description: "Otu map ahụike maka ngalaba HenryCo ọ bụla, ugbu a ma ọ bụ n'ọdịnihu.",
    viewAll: "Lelee ngalaba niile",
    healthLabelTemplate: "Ahụike {label} · {alerts} mkpọsa · {open} ihe emeghe",
    revenueLabel: "Ego batara",
    staffLabel: "Ndị ọrụ",
    supportLabel: "Nkwado",
  },
  helperInsights: {
    title: "Ndụmọdụ enyemaka",
    description: "Naanị ndụmọdụ mgbaàmà ndị dị ndụ kwadoro.",
    takeAction: "Mee ihe",
  },
  sensitiveActivity: {
    title: "Ọrụ siri ike",
    description: "Nyocha ọhụrụ maka onye nwe na mgbanwe ndị ọrụ.",
    unknownTime: "Oge a na-amaghị",
  },
};

const HUB_OWNER_COPY_YO: DeepPartial<HubOwnerCopy> = {
  metadata: {
    title: "Ibùdó àṣẹ onílé · Henry & Co.",
    description:
      "Ìṣiṣẹ́ gbogbo ilé-iṣẹ́, ìnáwó, òṣìṣẹ́, àmì-ẹ̀rí, ìlera ìfijíṣẹ́, àti ìtọ́sọ́nà onílé ní orí ojú-òṣẹ́ HenryCo HQ kan ṣoṣo.",
  },
  hero: {
    eyebrow: "Ibùdó àṣẹ àárín onílé",
    titleTemplate: "Ọpọlọ ilé-iṣẹ́ {company}",
    description:
      "Ìṣiṣẹ́ gbogbo ilé-iṣẹ́, ìnáwó, òṣìṣẹ́, àmì-ẹ̀rí, ìlera ìfijíṣẹ́, àti ìtọ́sọ́nà onílé ní orí ojú-òṣẹ́ HenryCo HQ kan ṣoṣo.",
    inviteStaff: "Pe òṣìṣẹ́",
    updateBrand: "Tún ètò àmì-ẹ̀rí ṣe",
  },
  dataHealth: { title: "Ìtuntun dátà" },
  situationRoom: {
    title: "Iyàrá ipò àjùmọ̀ olórí",
    description: "Ìwòyé yára fún onílé lórí ohun tó ṣe pàtàkì báyìí.",
    openSupport: "Ìtìlẹ́yìn tó ṣí sílẹ̀",
    failedDelivery: "Ìfijíṣẹ́ tó kùnà",
    whatsappSkipped: "WhatsApp tí a fò",
    queuedNotifications: "Ìfitónilétí tó ń dúró",
    nextStepsEyebrow: "Ìṣe tó dára jùlọ tókàn fún onílé",
  },
  metrics: {
    divisionsLive: "Ìpín tó ń ṣiṣẹ́",
    divisionsLiveSubtitle: "Ibùdó àṣẹ ń tọpinpin wọn",
    recognizedRevenue: "Owó tó ti gba",
    recognizedRevenueSubtitle: "Care, ọjà àti àwọn ìwé owó pàṣípààrọ̀ tí a sanwó",
    openSupport: "Ìpá ìtìlẹ́yìn tó ṣí sílẹ̀",
    openSupportSubtitle: "Awọn ìjíròrò ìtìlẹ́yìn ọlọ́pọ̀ ìpín tó ń dúró",
    activeStaff: "Òṣìṣẹ́ tó ń ṣiṣẹ́",
    activeStaffSubtitle: "Àwọn ọmọ ẹgbẹ́ tí a fọwọ́sí, tí a rí láìpẹ́",
    criticalSignals: "Àmì pàtàkì",
    criticalSignalsSubtitle: "Ohun tó nílò àfiyèsí onílé báyìí",
    outboundNotifications: "Ìfitónilétí tí a ń rán síta",
    outboundNotificationsSubtitle: "Ìmélì àti WhatsApp tó ń dúró fún ìfijíṣẹ́",
  },
  executiveDigest: {
    title: "Àkójọpọ̀ olórí",
    description: "Ohun tó nílò àfiyèsí báyìí.",
    reviewAlerts: "Yẹ àwọn ìkìlọ̀ iṣẹ́",
    financePressure: "Yẹ ìpá ìnáwó",
    manageWorkforce: "Dari òṣìṣẹ́",
    helperLayer: "Ṣí ìpele olùrànlọ́wọ́",
    teamChat: "Ìfọrọ̀wánilẹ́nuwò inú ẹgbẹ́",
    approvalCenter: "Ibùdó ìfọwọ́sí",
  },
  urgentSignals: {
    title: "Àmì kíákíá",
    description: "Ìdámọ̀ ewu àti àìpé tí a kọ́lé sórí dátà aláàyè.",
    openModule: "Ṣí módúlì",
  },
  divisionsPanel: {
    title: "Ibùdó ìṣàkóso ìpín",
    description: "Aworan ìlera kan fún gbogbo ìpín HenryCo, lọ́wọ́lọ́wọ́ tàbí ọjọ́ ọ̀la.",
    viewAll: "Wo gbogbo ìpín",
    healthLabelTemplate: "Ìlera {label} · {alerts} ìkìlọ̀ · {open} àwọn iṣẹ́ tó ṣí sílẹ̀",
    revenueLabel: "Owó",
    staffLabel: "Òṣìṣẹ́",
    supportLabel: "Ìtìlẹ́yìn",
  },
  helperInsights: {
    title: "Àbá olùrànlọ́wọ́",
    description: "Àwọn àbá tí àmì aláàyè ṣe àtìlẹ́yìn fún nìkan.",
    takeAction: "Ṣe ìṣe",
  },
  sensitiveActivity: {
    title: "Iṣẹ́ tó ní àbọ̀",
    description: "Ìṣàyẹ̀wò onílé àti àyípadà òṣìṣẹ́ láìpẹ́.",
    unknownTime: "Àkókò tí a kò mọ̀",
  },
};

const HUB_OWNER_COPY_HA: DeepPartial<HubOwnerCopy> = {
  metadata: {
    title: "Cibiyar umarni ta mai kamfani · Henry & Co.",
    description:
      "Aiyukan kamfani gabaki ɗaya, kuɗi, ma’aikata, alama, lafiyar bayarwa, da jagorancin mai kamfani a fuska guda na HenryCo HQ.",
  },
  hero: {
    eyebrow: "Cibiyar umarni ta tsakiya ta mai kamfani",
    titleTemplate: "Kwakwalwar kamfanin {company}",
    description:
      "Aiyukan kamfani gabaki ɗaya, kuɗi, ma’aikata, alama, lafiyar bayarwa, da jagorancin mai kamfani a fuska guda na HenryCo HQ.",
    inviteStaff: "Gayyaci ma’aikata",
    updateBrand: "Sabunta saitin alama",
  },
  dataHealth: { title: "Sabuwar bayanai" },
  situationRoom: {
    title: "Dakin yanayin shugabanci",
    description: "Saurin karatu ga mai kamfani game da abin da ke da muhimmanci yanzu.",
    openSupport: "Tallafi a buɗe",
    failedDelivery: "Bayarwa da ta gaza",
    whatsappSkipped: "An tsallake WhatsApp",
    queuedNotifications: "Sanarwa a layi",
    nextStepsEyebrow: "Mafi kyawun ayyuka na gaba ga mai kamfani",
  },
  metrics: {
    divisionsLive: "Sashe masu aiki",
    divisionsLiveSubtitle: "Cibiyar umarni tana lura da su",
    recognizedRevenue: "Kuɗin da aka tabbatar",
    recognizedRevenueSubtitle: "Care, kasuwa, da haɗakar lissafin da aka biya",
    openSupport: "Matsin lamba na tallafin a buɗe",
    openSupportSubtitle: "Tattaunawar tallafi ta sashe-sashe da ke jiran motsi",
    activeStaff: "Ma’aikata masu aiki",
    activeStaffSubtitle: "Mambobin ƙungiyar da aka tabbatar, an gan su kwanan nan",
    criticalSignals: "Alamomi masu mahimmanci",
    criticalSignalsSubtitle: "Abubuwan da ke buƙatar hankalin mai kamfani yanzu",
    outboundNotifications: "Sanarwa masu fita",
    outboundNotificationsSubtitle: "Imel da WhatsApp da ke jira",
  },
  executiveDigest: {
    title: "Taƙaitaccen bayani na shugabanci",
    description: "Abin da ke buƙatar hankali yanzu.",
    reviewAlerts: "Duba faɗakarwar aiki",
    financePressure: "Duba matsin lamba na kuɗi",
    manageWorkforce: "Sarrafa ma’aikata",
    helperLayer: "Buɗe ƙofar mai taimako",
    teamChat: "Tattaunawar cikin ƙungiyar",
    approvalCenter: "Cibiyar amincewa",
  },
  urgentSignals: {
    title: "Alamomi masu gaggawa",
    description: "Gano haɗari da rashin daidaito daga teburin da ke aiki.",
    openModule: "Buɗe na’ura",
  },
  divisionsPanel: {
    title: "Cibiyar sarrafa sashe",
    description: "Taswirar lafiya guda ga kowane sashe na HenryCo, na yanzu ko na gaba.",
    viewAll: "Duba dukkan sashe",
    healthLabelTemplate: "Lafiyar {label} · {alerts} faɗakarwa · {open} buɗaɗɗun abubuwa",
    revenueLabel: "Kuɗi",
    staffLabel: "Ma’aikata",
    supportLabel: "Tallafi",
  },
  helperInsights: {
    title: "Shawarwarin mai taimako",
    description: "Shawarwari ne kawai waɗanda alamomin rayuwa ke goyon bayansu.",
    takeAction: "Ɗauki mataki",
  },
  sensitiveActivity: {
    title: "Aiki mai mahimmanci",
    description: "Sabbin bincike na mai kamfani da canje-canjen ma’aikata.",
    unknownTime: "Lokaci da ba a sani ba",
  },
};

const HUB_OWNER_LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<HubOwnerCopy>>> = {
  fr: HUB_OWNER_COPY_FR,
  es: HUB_OWNER_COPY_ES,
  pt: HUB_OWNER_COPY_PT,
  ar: HUB_OWNER_COPY_AR,
  de: HUB_OWNER_COPY_DE,
  it: HUB_OWNER_COPY_IT,
  zh: HUB_OWNER_COPY_ZH,
  hi: HUB_OWNER_COPY_HI,
  ig: HUB_OWNER_COPY_IG,
  yo: HUB_OWNER_COPY_YO,
  ha: HUB_OWNER_COPY_HA,
};

export function getHubOwnerCopy(locale: AppLocale): HubOwnerCopy {
  const overrides = HUB_OWNER_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      HUB_OWNER_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as HubOwnerCopy;
  }
  return HUB_OWNER_COPY_EN;
}

/** @internal */
export function __dangerouslyGetEnglishHubOwnerCopy(): HubOwnerCopy {
  return HUB_OWNER_COPY_EN;
}
