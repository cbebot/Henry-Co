// surface:staff_risk — V3-40 staff risk-review queue (typed Pattern-A operator copy).
//
// Operator surface (Register-D). The queue shows scores/tiers to security staff —
// the one audience that may see them. Doctrine words carry into copy: the system
// only FLAGS; hold/freeze/release are the staff's one-taps and say so plainly.

import type { AppLocale } from "./locales";
import { deepMergeMessages } from "./merge-messages";

export type StaffRiskCopy = {
  module: { title: string; description: string; kicker: string };
  columns: { entity: string; tier: string; score: string; factors: string; enforcement: string; scored: string };
  tiers: { pass: string; monitor: string; review: string; freeze: string };
  enforcement: { none: string; flag: string; hold: string; freeze: string };
  shadowBadge: string;
  actions: {
    applyHold: { label: string; confirm: string };
    applyFreeze: { label: string; confirm: string };
    release: { label: string; confirm: string };
    override: { label: string; confirm: string };
  };
  lifecycle: {
    title: string;
    versionLabel: string;
    statusLabel: string;
    shadowDays: string;
    promote: string;
    rollback: string;
    reasonLabel: string;
    ownerOnly: string;
  };
  factorKinds: { signal: string; threat: string; behavioral: string; advisory: string };
  empty: string;
};

const EN: StaffRiskCopy = {
  module: {
    title: "Risk review",
    description: "Predictive risk queue — versioned scores, human-only enforcement.",
    kicker: "Risk · cross-division",
  },
  columns: {
    entity: "Entity",
    tier: "Tier",
    score: "Score",
    factors: "Top factors",
    enforcement: "Enforcement",
    scored: "Scored",
  },
  tiers: { pass: "Pass", monitor: "Monitor", review: "Review", freeze: "Freeze" },
  enforcement: { none: "None", flag: "Flagged", hold: "On hold", freeze: "Frozen" },
  shadowBadge: "Shadow",
  actions: {
    applyHold: {
      label: "Apply hold",
      confirm: "Place {count} entity(ies) under hold — sensitive actions will wait for staff approval. You are the actor of record.",
    },
    applyFreeze: {
      label: "Apply freeze",
      confirm: "Freeze sensitive actions for {count} entity(ies) pending review. You are the actor of record.",
    },
    release: {
      label: "Release",
      confirm: "Release {count} entity(ies) — enforcement lifts immediately. A reason is recorded.",
    },
    override: {
      label: "Override score",
      confirm: "Record a staff override for {count} entity(ies) — the prediction is marked incorrect. A reason is recorded.",
    },
  },
  lifecycle: {
    title: "Model lifecycle",
    versionLabel: "Version",
    statusLabel: "Status",
    shadowDays: "shadow days recorded",
    promote: "Promote to live",
    rollback: "Roll back",
    reasonLabel: "Reason",
    ownerOnly: "Owner approval required — promotion needs the full shadow window.",
  },
  factorKinds: { signal: "Rule", threat: "Watchtower", behavioral: "Behavior", advisory: "Advisory" },
  empty: "No entities in review — the queue is clear.",
};

const FR: Partial<StaffRiskCopy> = {
  module: { title: "Revue des risques", description: "File de risques prédictifs — scores versionnés, application humaine uniquement.", kicker: "Risque · inter-divisions" },
  columns: { entity: "Entité", tier: "Niveau", score: "Score", factors: "Facteurs clés", enforcement: "Mesure", scored: "Évalué" },
  tiers: { pass: "OK", monitor: "Surveiller", review: "Revue", freeze: "Gel" },
  enforcement: { none: "Aucune", flag: "Signalé", hold: "En attente", freeze: "Gelé" },
  shadowBadge: "Fantôme",
  actions: {
    applyHold: { label: "Mettre en attente", confirm: "Mettre {count} entité(s) en attente — les actions sensibles attendront une approbation. Vous êtes l'acteur enregistré." },
    applyFreeze: { label: "Geler", confirm: "Geler les actions sensibles de {count} entité(s) en attendant la revue. Vous êtes l'acteur enregistré." },
    release: { label: "Libérer", confirm: "Libérer {count} entité(s) — la mesure est levée immédiatement. Un motif est enregistré." },
    override: { label: "Annuler le score", confirm: "Enregistrer une annulation pour {count} entité(s) — la prédiction est marquée incorrecte. Un motif est enregistré." },
  },
  lifecycle: { title: "Cycle de vie du modèle", versionLabel: "Version", statusLabel: "Statut", shadowDays: "jours fantômes enregistrés", promote: "Promouvoir en production", rollback: "Revenir en arrière", reasonLabel: "Motif", ownerOnly: "Approbation du propriétaire requise — la promotion exige la fenêtre fantôme complète." },
  factorKinds: { signal: "Règle", threat: "Vigie", behavioral: "Comportement", advisory: "Consultatif" },
  empty: "Aucune entité en revue — la file est vide.",
};

const ES: Partial<StaffRiskCopy> = {
  module: { title: "Revisión de riesgos", description: "Cola de riesgo predictivo — puntuaciones versionadas, aplicación solo humana.", kicker: "Riesgo · entre divisiones" },
  columns: { entity: "Entidad", tier: "Nivel", score: "Puntuación", factors: "Factores clave", enforcement: "Medida", scored: "Evaluado" },
  tiers: { pass: "OK", monitor: "Vigilar", review: "Revisión", freeze: "Congelar" },
  enforcement: { none: "Ninguna", flag: "Marcado", hold: "Retenido", freeze: "Congelado" },
  shadowBadge: "Sombra",
  actions: {
    applyHold: { label: "Aplicar retención", confirm: "Retener {count} entidad(es) — las acciones sensibles esperarán aprobación. Usted es el actor registrado." },
    applyFreeze: { label: "Aplicar congelación", confirm: "Congelar las acciones sensibles de {count} entidad(es) pendiente de revisión. Usted es el actor registrado." },
    release: { label: "Liberar", confirm: "Liberar {count} entidad(es) — la medida se levanta de inmediato. Se registra un motivo." },
    override: { label: "Anular puntuación", confirm: "Registrar una anulación para {count} entidad(es) — la predicción se marca incorrecta. Se registra un motivo." },
  },
  lifecycle: { title: "Ciclo de vida del modelo", versionLabel: "Versión", statusLabel: "Estado", shadowDays: "días en sombra registrados", promote: "Promover a producción", rollback: "Revertir", reasonLabel: "Motivo", ownerOnly: "Se requiere aprobación del propietario — la promoción necesita la ventana de sombra completa." },
  factorKinds: { signal: "Regla", threat: "Vigilancia", behavioral: "Comportamiento", advisory: "Consultivo" },
  empty: "No hay entidades en revisión — la cola está limpia.",
};

const PT: Partial<StaffRiskCopy> = {
  module: { title: "Revisão de risco", description: "Fila de risco preditivo — pontuações versionadas, aplicação apenas humana.", kicker: "Risco · entre divisões" },
  columns: { entity: "Entidade", tier: "Nível", score: "Pontuação", factors: "Fatores principais", enforcement: "Medida", scored: "Avaliado" },
  tiers: { pass: "OK", monitor: "Monitorizar", review: "Revisão", freeze: "Congelar" },
  enforcement: { none: "Nenhuma", flag: "Sinalizado", hold: "Retido", freeze: "Congelado" },
  shadowBadge: "Sombra",
  actions: {
    applyHold: { label: "Aplicar retenção", confirm: "Reter {count} entidade(s) — ações sensíveis aguardarão aprovação. Você é o ator registado." },
    applyFreeze: { label: "Aplicar congelamento", confirm: "Congelar as ações sensíveis de {count} entidade(s) até à revisão. Você é o ator registado." },
    release: { label: "Libertar", confirm: "Libertar {count} entidade(s) — a medida é levantada de imediato. Um motivo é registado." },
    override: { label: "Anular pontuação", confirm: "Registar uma anulação para {count} entidade(s) — a previsão é marcada como incorreta. Um motivo é registado." },
  },
  lifecycle: { title: "Ciclo de vida do modelo", versionLabel: "Versão", statusLabel: "Estado", shadowDays: "dias em sombra registados", promote: "Promover para produção", rollback: "Reverter", reasonLabel: "Motivo", ownerOnly: "Aprovação do proprietário necessária — a promoção exige a janela de sombra completa." },
  factorKinds: { signal: "Regra", threat: "Vigia", behavioral: "Comportamento", advisory: "Consultivo" },
  empty: "Sem entidades em revisão — a fila está limpa.",
};

const DE: Partial<StaffRiskCopy> = {
  module: { title: "Risikoprüfung", description: "Prädiktive Risiko-Warteschlange — versionierte Scores, Durchsetzung nur durch Menschen.", kicker: "Risiko · bereichsübergreifend" },
  columns: { entity: "Entität", tier: "Stufe", score: "Score", factors: "Top-Faktoren", enforcement: "Maßnahme", scored: "Bewertet" },
  tiers: { pass: "OK", monitor: "Beobachten", review: "Prüfung", freeze: "Einfrieren" },
  enforcement: { none: "Keine", flag: "Markiert", hold: "Zurückgehalten", freeze: "Eingefroren" },
  shadowBadge: "Schatten",
  actions: {
    applyHold: { label: "Zurückhalten", confirm: "{count} Entität(en) zurückhalten — sensible Aktionen warten auf Freigabe. Sie sind die verantwortliche Person." },
    applyFreeze: { label: "Einfrieren", confirm: "Sensible Aktionen für {count} Entität(en) bis zur Prüfung einfrieren. Sie sind die verantwortliche Person." },
    release: { label: "Freigeben", confirm: "{count} Entität(en) freigeben — die Maßnahme wird sofort aufgehoben. Ein Grund wird erfasst." },
    override: { label: "Score aufheben", confirm: "Aufhebung für {count} Entität(en) erfassen — die Vorhersage wird als falsch markiert. Ein Grund wird erfasst." },
  },
  lifecycle: { title: "Modell-Lebenszyklus", versionLabel: "Version", statusLabel: "Status", shadowDays: "Schattentage erfasst", promote: "Live schalten", rollback: "Zurückrollen", reasonLabel: "Grund", ownerOnly: "Inhaberfreigabe erforderlich — die Umstellung braucht das volle Schattenfenster." },
  factorKinds: { signal: "Regel", threat: "Wachturm", behavioral: "Verhalten", advisory: "Beratend" },
  empty: "Keine Entitäten in Prüfung — die Warteschlange ist leer.",
};

const IT: Partial<StaffRiskCopy> = {
  module: { title: "Revisione dei rischi", description: "Coda di rischio predittivo — punteggi versionati, applicazione solo umana.", kicker: "Rischio · tra divisioni" },
  columns: { entity: "Entità", tier: "Livello", score: "Punteggio", factors: "Fattori principali", enforcement: "Misura", scored: "Valutato" },
  tiers: { pass: "OK", monitor: "Monitorare", review: "Revisione", freeze: "Congelare" },
  enforcement: { none: "Nessuna", flag: "Segnalato", hold: "In attesa", freeze: "Congelato" },
  shadowBadge: "Ombra",
  actions: {
    applyHold: { label: "Applica blocco", confirm: "Metti in attesa {count} entità — le azioni sensibili attenderanno approvazione. Sei l'attore registrato." },
    applyFreeze: { label: "Applica congelamento", confirm: "Congela le azioni sensibili di {count} entità in attesa di revisione. Sei l'attore registrato." },
    release: { label: "Rilascia", confirm: "Rilascia {count} entità — la misura viene revocata subito. Viene registrato un motivo." },
    override: { label: "Annulla punteggio", confirm: "Registra un'annullamento per {count} entità — la previsione è segnata come errata. Viene registrato un motivo." },
  },
  lifecycle: { title: "Ciclo di vita del modello", versionLabel: "Versione", statusLabel: "Stato", shadowDays: "giorni in ombra registrati", promote: "Promuovi in produzione", rollback: "Ripristina", reasonLabel: "Motivo", ownerOnly: "Richiesta approvazione del proprietario — la promozione richiede l'intera finestra ombra." },
  factorKinds: { signal: "Regola", threat: "Vedetta", behavioral: "Comportamento", advisory: "Consultivo" },
  empty: "Nessuna entità in revisione — la coda è vuota.",
};

const AR: Partial<StaffRiskCopy> = {
  module: { title: "مراجعة المخاطر", description: "قائمة المخاطر التنبؤية — درجات ذات إصدارات، والتنفيذ بشري فقط.", kicker: "المخاطر · عبر الأقسام" },
  columns: { entity: "الكيان", tier: "المستوى", score: "الدرجة", factors: "أهم العوامل", enforcement: "الإجراء", scored: "تاريخ التقييم" },
  tiers: { pass: "سليم", monitor: "مراقبة", review: "مراجعة", freeze: "تجميد" },
  enforcement: { none: "لا شيء", flag: "مُعلَّم", hold: "قيد الانتظار", freeze: "مجمَّد" },
  shadowBadge: "ظل",
  actions: {
    applyHold: { label: "تطبيق الانتظار", confirm: "وضع {count} كيانًا قيد الانتظار — ستنتظر الإجراءات الحساسة موافقة الموظفين. أنت الفاعل المسجل." },
    applyFreeze: { label: "تطبيق التجميد", confirm: "تجميد الإجراءات الحساسة لـ {count} كيانًا بانتظار المراجعة. أنت الفاعل المسجل." },
    release: { label: "إلغاء الإجراء", confirm: "إلغاء الإجراء عن {count} كيانًا — يُرفع فورًا ويُسجَّل السبب." },
    override: { label: "تجاوز الدرجة", confirm: "تسجيل تجاوز لـ {count} كيانًا — تُعلَّم التنبؤات كغير صحيحة ويُسجَّل السبب." },
  },
  lifecycle: { title: "دورة حياة النموذج", versionLabel: "الإصدار", statusLabel: "الحالة", shadowDays: "أيام الظل المسجلة", promote: "الترقية للإنتاج", rollback: "التراجع", reasonLabel: "السبب", ownerOnly: "موافقة المالك مطلوبة — تحتاج الترقية إلى نافذة الظل الكاملة." },
  factorKinds: { signal: "قاعدة", threat: "برج المراقبة", behavioral: "سلوك", advisory: "استشاري" },
  empty: "لا كيانات قيد المراجعة — القائمة فارغة.",
};

const IG: Partial<StaffRiskCopy> = {
  module: { title: "Nyocha ihe ize ndụ", description: "Kwụ n'ahịrị ihe ize ndụ amụma — akara nwere ụdịdị, naanị mmadụ na-eme mmanye.", kicker: "Ihe ize ndụ · n'ofe ngalaba" },
  columns: { entity: "Ihe", tier: "Ọkwa", score: "Akara", factors: "Isi ihe kpatara", enforcement: "Mmanye", scored: "Etulere" },
  tiers: { pass: "Ọ dị mma", monitor: "Nlekota", review: "Nyocha", freeze: "Kpụchie" },
  enforcement: { none: "Ọ dịghị", flag: "Akara aka", hold: "Ejidere", freeze: "Akpụchiri" },
  shadowBadge: "Onyinyo",
  actions: {
    applyHold: { label: "Jide ya", confirm: "Jide ihe {count} — omume ndị dị nro ga-echere nkwenye. Ị bụ onye omume edekọtara." },
    applyFreeze: { label: "Kpụchie ya", confirm: "Kpụchie omume ndị dị nro nke ihe {count} ruo nyocha. Ị bụ onye omume edekọtara." },
    release: { label: "Hapụ ya", confirm: "Hapụ ihe {count} — mmanye ahụ ga-ebili ozugbo. Edekọtara ihe kpatara ya." },
    override: { label: "Kagbuo akara", confirm: "Dekọọ nkagbu maka ihe {count} — akara amụma ka akara dị ka nke na-ezighi ezi. Edekọtara ihe kpatara ya." },
  },
  lifecycle: { title: "Usoro ndụ nke ụdị", versionLabel: "Ụdịdị", statusLabel: "Ọnọdụ", shadowDays: "ụbọchị onyinyo edekọtara", promote: "Bulie ka ọ dị ndụ", rollback: "Laghachi azụ", reasonLabel: "Ihe kpatara", ownerOnly: "Achọrọ nkwenye onye nwe — nbuli chọrọ oghere onyinyo zuru ezu." },
  factorKinds: { signal: "Iwu", threat: "Ulo nche", behavioral: "Omume", advisory: "Ndụmọdụ" },
  empty: "Ọ dịghị ihe a na-enyocha — ahịrị dị ọcha.",
};

const YO: Partial<StaffRiskCopy> = {
  module: { title: "Àyẹ̀wò ewu", description: "Ìlà ewu àsọtẹ́lẹ̀ — àmì olóríṣiríṣi ẹ̀dà, ènìyàn nìkan ló lè fi ipá múlẹ̀.", kicker: "Ewu · láàrin àwọn ẹ̀ka" },
  columns: { entity: "Nǹkan", tier: "Ipele", score: "Àmì", factors: "Àwọn okùnfà pàtàkì", enforcement: "Ìgbésẹ̀", scored: "Ayẹ̀wò" },
  tiers: { pass: "Dáadáa", monitor: "Ṣọ́", review: "Àyẹ̀wò", freeze: "Dì" },
  enforcement: { none: "Kò sí", flag: "Ti samisi", hold: "Dádúró", freeze: "Ti dì" },
  shadowBadge: "Òjìji",
  actions: {
    applyHold: { label: "Dádúró", confirm: "Dá nǹkan {count} dúró — àwọn ìgbésẹ̀ pàtàkì yóò dúró de ìfọwọ́sí. Ìwọ ni olùgbésẹ̀ tí a kọ sílẹ̀." },
    applyFreeze: { label: "Dì í", confirm: "Dì àwọn ìgbésẹ̀ pàtàkì fún nǹkan {count} títí di àyẹ̀wò. Ìwọ ni olùgbésẹ̀ tí a kọ sílẹ̀." },
    release: { label: "Tú sílẹ̀", confirm: "Tú nǹkan {count} sílẹ̀ — ìgbésẹ̀ náà yóò kúrò lẹ́sẹ̀kẹsẹ̀. A kọ ìdí sílẹ̀." },
    override: { label: "Fagi lé àmì", confirm: "Kọ ìfagilé sílẹ̀ fún nǹkan {count} — a samisi àsọtẹ́lẹ̀ náà gẹ́gẹ́ bí àṣìṣe. A kọ ìdí sílẹ̀." },
  },
  lifecycle: { title: "Ìgbé ayé awoṣe", versionLabel: "Ẹ̀dà", statusLabel: "Ipò", shadowDays: "ọjọ́ òjìji tí a kọ sílẹ̀", promote: "Gbé sí orí ayélujára", rollback: "Padà sẹ́yìn", reasonLabel: "Ìdí", ownerOnly: "Ìfọwọ́sí olówó ni a nílò — ìgbéga nílò gbogbo fèrèsé òjìji." },
  factorKinds: { signal: "Òfin", threat: "Ilé ìṣọ́", behavioral: "Ìwà", advisory: "Ìmọ̀ràn" },
  empty: "Kò sí nǹkan nínú àyẹ̀wò — ìlà ti mọ́.",
};

const HA: Partial<StaffRiskCopy> = {
  module: { title: "Bitar haɗari", description: "Layin haɗari na hasashe — maki masu sigogi, mutane kaɗai ke aiwatarwa.", kicker: "Haɗari · tsakanin sassa" },
  columns: { entity: "Abu", tier: "Mataki", score: "Maki", factors: "Manyan dalilai", enforcement: "Mataki", scored: "An tantance" },
  tiers: { pass: "Lafiya", monitor: "Sa ido", review: "Bita", freeze: "Daskarewa" },
  enforcement: { none: "Babu", flag: "An yiwa alama", hold: "An riƙe", freeze: "An daskarar" },
  shadowBadge: "Inuwa",
  actions: {
    applyHold: { label: "Riƙe", confirm: "Riƙe abu {count} — muhimman ayyuka za su jira amincewa. Kai ne mai aikin da aka rubuta." },
    applyFreeze: { label: "Daskarar", confirm: "Daskarar da muhimman ayyuka na abu {count} har sai an gama bita. Kai ne mai aikin da aka rubuta." },
    release: { label: "Saki", confirm: "Saki abu {count} — za a ɗage matakin nan take. An rubuta dalili." },
    override: { label: "Soke maki", confirm: "Rubuta soke wa abu {count} — an yiwa hasashen alamar kuskure. An rubuta dalili." },
  },
  lifecycle: { title: "Rayuwar samfuri", versionLabel: "Siga", statusLabel: "Matsayi", shadowDays: "kwanakin inuwa da aka rubuta", promote: "Kaddamar zuwa aiki", rollback: "Mayar da baya", reasonLabel: "Dalili", ownerOnly: "Ana buƙatar amincewar mai shi — kaddamarwa na buƙatar cikakken tagar inuwa." },
  factorKinds: { signal: "Doka", threat: "Hasumiyar tsaro", behavioral: "Hali", advisory: "Shawara" },
  empty: "Babu abubuwa a bita — layin ya tsaftace.",
};

const ZH: Partial<StaffRiskCopy> = {
  module: { title: "风险审查", description: "预测性风险队列——版本化评分，仅由人工执行。", kicker: "风险 · 跨部门" },
  columns: { entity: "实体", tier: "等级", score: "评分", factors: "主要因素", enforcement: "处置", scored: "评分时间" },
  tiers: { pass: "通过", monitor: "监控", review: "审查", freeze: "冻结" },
  enforcement: { none: "无", flag: "已标记", hold: "已暂缓", freeze: "已冻结" },
  shadowBadge: "影子",
  actions: {
    applyHold: { label: "施加暂缓", confirm: "对 {count} 个实体施加暂缓——敏感操作将等待人工批准。您是记录在案的执行人。" },
    applyFreeze: { label: "施加冻结", confirm: "冻结 {count} 个实体的敏感操作，等待审查。您是记录在案的执行人。" },
    release: { label: "解除", confirm: "解除 {count} 个实体——处置立即撤销。将记录原因。" },
    override: { label: "推翻评分", confirm: "为 {count} 个实体记录人工推翻——该预测被标记为不正确。将记录原因。" },
  },
  lifecycle: { title: "模型生命周期", versionLabel: "版本", statusLabel: "状态", shadowDays: "已记录的影子天数", promote: "升级上线", rollback: "回滚", reasonLabel: "原因", ownerOnly: "需要所有者批准——升级需要完整的影子窗口。" },
  factorKinds: { signal: "规则", threat: "瞭望塔", behavioral: "行为", advisory: "顾问" },
  empty: "没有待审查的实体——队列已清空。",
};

const HI: Partial<StaffRiskCopy> = {
  module: { title: "जोखिम समीक्षा", description: "पूर्वानुमानित जोखिम कतार — संस्करणित स्कोर, केवल मानव द्वारा प्रवर्तन।", kicker: "जोखिम · सभी प्रभागों में" },
  columns: { entity: "इकाई", tier: "स्तर", score: "स्कोर", factors: "मुख्य कारक", enforcement: "प्रवर्तन", scored: "मूल्यांकित" },
  tiers: { pass: "ठीक", monitor: "निगरानी", review: "समीक्षा", freeze: "फ़्रीज़" },
  enforcement: { none: "कोई नहीं", flag: "चिह्नित", hold: "रोका गया", freeze: "फ़्रीज़ किया गया" },
  shadowBadge: "छाया",
  actions: {
    applyHold: { label: "रोक लगाएँ", confirm: "{count} इकाई(यों) को रोकें — संवेदनशील कार्रवाइयाँ स्टाफ़ अनुमोदन की प्रतीक्षा करेंगी। आप दर्ज कर्ता हैं।" },
    applyFreeze: { label: "फ़्रीज़ करें", confirm: "समीक्षा तक {count} इकाई(यों) की संवेदनशील कार्रवाइयाँ फ़्रीज़ करें। आप दर्ज कर्ता हैं।" },
    release: { label: "मुक्त करें", confirm: "{count} इकाई(यों) को मुक्त करें — प्रवर्तन तुरंत हट जाता है। कारण दर्ज होता है।" },
    override: { label: "स्कोर पलटें", confirm: "{count} इकाई(यों) के लिए स्टाफ़ ओवरराइड दर्ज करें — भविष्यवाणी गलत चिह्नित होती है। कारण दर्ज होता है।" },
  },
  lifecycle: { title: "मॉडल जीवनचक्र", versionLabel: "संस्करण", statusLabel: "स्थिति", shadowDays: "दर्ज छाया दिवस", promote: "लाइव करें", rollback: "वापस लें", reasonLabel: "कारण", ownerOnly: "स्वामी की स्वीकृति आवश्यक — पदोन्नति के लिए पूर्ण छाया अवधि चाहिए।" },
  factorKinds: { signal: "नियम", threat: "निगरानी मीनार", behavioral: "व्यवहार", advisory: "सलाहकार" },
  empty: "समीक्षा में कोई इकाई नहीं — कतार खाली है।",
};

const LOCALE_COPY: Partial<Record<AppLocale, Partial<StaffRiskCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  de: DE,
  it: IT,
  ar: AR,
  ig: IG,
  yo: YO,
  ha: HA,
  zh: ZH,
  hi: HI,
};

export function getStaffRiskCopy(locale: AppLocale): StaffRiskCopy {
  const overrides = LOCALE_COPY[locale];
  if (overrides) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as StaffRiskCopy;
  }
  return EN;
}
