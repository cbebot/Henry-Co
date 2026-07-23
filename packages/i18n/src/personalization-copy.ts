import type { AppLocale } from "./locales";
import { deepMergeMessages } from "./merge-messages";

/**
 * surface:personalization — typed copy for the V3-34 personalization-home
 * Customize surface + the account-scoped personalization consent note.
 *
 * Module NAMES are never stored here — they come from the live register via
 * `translateSurfaceLabel`. This module owns only the chrome (actions, states,
 * a11y hints). EN is the base; locales without an override fall back to EN
 * through `deepMergeMessages` (the ecosystem i18n maturity model: en/fr
 * production-ready, others progressively filled).
 */
export type PersonalizationCopy = {
  customize: {
    eyebrow: string;
    title: string;
    description: string;
    desktopTab: string;
    mobileTab: string;
    pin: string;
    unpin: string;
    hide: string;
    show: string;
    pinnedBadge: string;
    hiddenBadge: string;
    blockedReason: string;
    moveUp: string;
    moveDown: string;
    reorderHint: string;
    reset: string;
    resetting: string;
    save: string;
    saving: string;
    saved: string;
    saveError: string;
    emptyState: string;
    listLabel: string;
    consentNote: string;
  };
};

const EN: PersonalizationCopy = {
  customize: {
    eyebrow: "Your home",
    title: "Customize your home",
    description:
      "Pin the areas you use most, hide the ones you don't, and set the order. Your choices are saved to your account and follow you across devices.",
    desktopTab: "Desktop",
    mobileTab: "Mobile",
    pin: "Pin to top",
    unpin: "Unpin",
    hide: "Hide",
    show: "Show",
    pinnedBadge: "Pinned",
    hiddenBadge: "Hidden",
    blockedReason: "Needs your attention — can't be hidden right now.",
    moveUp: "Move up",
    moveDown: "Move down",
    reorderHint:
      "Use the up and down controls, or arrow keys when focused, to reorder.",
    reset: "Reset to default",
    resetting: "Resetting…",
    save: "Save layout",
    saving: "Saving…",
    saved: "Saved",
    saveError: "We couldn't save your layout. Please try again.",
    emptyState: "There are no home areas to customize yet.",
    listLabel: "Home areas — reorder, pin, or hide",
    consentNote:
      "Ordering by your activity respects your personalization choice in privacy settings. Pin, hide, and manual order always apply.",
  },
};

const FR: Partial<PersonalizationCopy> = {
  customize: {
    eyebrow: "Votre accueil",
    title: "Personnalisez votre accueil",
    description:
      "Épinglez les espaces que vous utilisez le plus, masquez ceux que vous n'utilisez pas et définissez l'ordre. Vos choix sont enregistrés dans votre compte et vous suivent sur tous vos appareils.",
    desktopTab: "Ordinateur",
    mobileTab: "Mobile",
    pin: "Épingler en haut",
    unpin: "Détacher",
    hide: "Masquer",
    show: "Afficher",
    pinnedBadge: "Épinglé",
    hiddenBadge: "Masqué",
    blockedReason: "Nécessite votre attention — ne peut pas être masqué.",
    moveUp: "Monter",
    moveDown: "Descendre",
    reorderHint:
      "Utilisez les commandes haut et bas, ou les touches fléchées, pour réordonner.",
    reset: "Réinitialiser",
    resetting: "Réinitialisation…",
    save: "Enregistrer",
    saving: "Enregistrement…",
    saved: "Enregistré",
    saveError: "Impossible d'enregistrer votre disposition. Réessayez.",
    emptyState: "Aucun espace d'accueil à personnaliser pour l'instant.",
    listLabel: "Espaces d'accueil — réordonner, épingler ou masquer",
    consentNote:
      "Le classement selon votre activité respecte votre choix de personnalisation dans les paramètres de confidentialité. L'épinglage, le masquage et l'ordre manuel s'appliquent toujours.",
  },
};

const ES: Partial<PersonalizationCopy> = { customize: { eyebrow: "Tu inicio", title: "Personaliza tu inicio", description: "Fija las áreas que más usas, oculta las que no y establece el orden. Tus elecciones se guardan en tu cuenta y te acompañan en todos tus dispositivos.", desktopTab: "Escritorio", mobileTab: "Móvil", pin: "Fijar arriba", unpin: "Quitar fijado", hide: "Ocultar", show: "Mostrar", pinnedBadge: "Fijada", hiddenBadge: "Oculta", blockedReason: "Necesita tu atención: no se puede ocultar ahora.", moveUp: "Subir", moveDown: "Bajar", reorderHint: "Usa los controles de subir y bajar, o las teclas de flecha al enfocar, para reordenar.", reset: "Restablecer valores predeterminados", resetting: "Restableciendo…", save: "Guardar diseño", saving: "Guardando…", saved: "Guardado", saveError: "No pudimos guardar tu diseño. Inténtalo de nuevo.", emptyState: "Aún no hay áreas de inicio para personalizar.", listLabel: "Áreas de inicio: reordena, fija u oculta", consentNote: "Ordenar por tu actividad respeta tu elección de personalización en la configuración de privacidad. Fijar, ocultar y el orden manual siempre se aplican." } };
const PT: Partial<PersonalizationCopy> = { customize: { eyebrow: "Sua página inicial", title: "Personalize sua página inicial", description: "Fixe as áreas que você mais usa, oculte as que não usa e defina a ordem. Suas escolhas são salvas na sua conta e acompanham você em todos os dispositivos.", desktopTab: "Computador", mobileTab: "Celular", pin: "Fixar no topo", unpin: "Desafixar", hide: "Ocultar", show: "Mostrar", pinnedBadge: "Fixada", hiddenBadge: "Oculta", blockedReason: "Precisa da sua atenção — não pode ser ocultada agora.", moveUp: "Mover para cima", moveDown: "Mover para baixo", reorderHint: "Use os controles para cima e para baixo, ou as teclas de seta quando em foco, para reordenar.", reset: "Restaurar padrão", resetting: "Restaurando…", save: "Salvar layout", saving: "Salvando…", saved: "Salvo", saveError: "Não conseguimos salvar seu layout. Tente novamente.", emptyState: "Ainda não há áreas iniciais para personalizar.", listLabel: "Áreas iniciais — reordene, fixe ou oculte", consentNote: "A ordenação pela sua atividade respeita sua escolha de personalização nas configurações de privacidade. Fixar, ocultar e a ordem manual sempre se aplicam." } };
const DE: Partial<PersonalizationCopy> = { customize: { eyebrow: "Deine Startseite", title: "Startseite anpassen", description: "Hefte die Bereiche an, die du am häufigsten nutzt, blende die anderen aus und lege die Reihenfolge fest. Deine Auswahl wird in deinem Konto gespeichert und begleitet dich auf allen Geräten.", desktopTab: "Desktop", mobileTab: "Mobil", pin: "Oben anheften", unpin: "Lösen", hide: "Ausblenden", show: "Anzeigen", pinnedBadge: "Angeheftet", hiddenBadge: "Ausgeblendet", blockedReason: "Erfordert deine Aufmerksamkeit – kann derzeit nicht ausgeblendet werden.", moveUp: "Nach oben", moveDown: "Nach unten", reorderHint: "Nutze die Auf- und Ab-Steuerelemente oder die Pfeiltasten bei Fokus, um neu zu sortieren.", reset: "Auf Standard zurücksetzen", resetting: "Wird zurückgesetzt…", save: "Layout speichern", saving: "Wird gespeichert…", saved: "Gespeichert", saveError: "Wir konnten dein Layout nicht speichern. Bitte versuche es erneut.", emptyState: "Es gibt noch keine Startbereiche zum Anpassen.", listLabel: "Startbereiche – neu sortieren, anheften oder ausblenden", consentNote: "Die Sortierung nach deiner Aktivität berücksichtigt deine Personalisierungseinstellung in den Datenschutzeinstellungen. Anheften, Ausblenden und die manuelle Reihenfolge gelten immer." } };
const IT: Partial<PersonalizationCopy> = { customize: { eyebrow: "La tua home", title: "Personalizza la tua home", description: "Fissa le aree che usi di più, nascondi quelle che non usi e imposta l'ordine. Le tue scelte vengono salvate nel tuo account e ti seguono su tutti i dispositivi.", desktopTab: "Desktop", mobileTab: "Mobile", pin: "Fissa in alto", unpin: "Rimuovi", hide: "Nascondi", show: "Mostra", pinnedBadge: "Fissata", hiddenBadge: "Nascosta", blockedReason: "Richiede la tua attenzione — non può essere nascosta ora.", moveUp: "Sposta su", moveDown: "Sposta giù", reorderHint: "Usa i controlli su e giù, o i tasti freccia quando è attivo, per riordinare.", reset: "Ripristina predefinite", resetting: "Ripristino…", save: "Salva layout", saving: "Salvataggio…", saved: "Salvato", saveError: "Non siamo riusciti a salvare il tuo layout. Riprova.", emptyState: "Non ci sono ancora aree della home da personalizzare.", listLabel: "Aree della home — riordina, fissa o nascondi", consentNote: "L'ordinamento in base alla tua attività rispetta la tua scelta di personalizzazione nelle impostazioni sulla privacy. Fissaggio, occultamento e ordine manuale si applicano sempre." } };
const AR: Partial<PersonalizationCopy> = { customize: { eyebrow: "صفحتك الرئيسية", title: "خصّص صفحتك الرئيسية", description: "ثبّت المناطق التي تستخدمها أكثر، وأخفِ التي لا تستخدمها، وحدّد الترتيب. تُحفظ اختياراتك في حسابك وتنتقل معك عبر جميع أجهزتك.", desktopTab: "سطح المكتب", mobileTab: "الجوال", pin: "تثبيت في الأعلى", unpin: "إلغاء التثبيت", hide: "إخفاء", show: "إظهار", pinnedBadge: "مثبّتة", hiddenBadge: "مخفية", blockedReason: "تحتاج إلى انتباهك — لا يمكن إخفاؤها الآن.", moveUp: "نقل لأعلى", moveDown: "نقل لأسفل", reorderHint: "استخدم عناصر التحكم للأعلى والأسفل، أو مفاتيح الأسهم عند التركيز، لإعادة الترتيب.", reset: "إعادة التعيين إلى الافتراضي", resetting: "جارٍ إعادة التعيين…", save: "حفظ التخطيط", saving: "جارٍ الحفظ…", saved: "تم الحفظ", saveError: "تعذّر حفظ تخطيطك. يُرجى المحاولة مرة أخرى.", emptyState: "لا توجد بعد مناطق رئيسية لتخصيصها.", listLabel: "المناطق الرئيسية — أعد الترتيب أو ثبّت أو أخفِ", consentNote: "الترتيب حسب نشاطك يحترم اختيارك للتخصيص في إعدادات الخصوصية. يُطبَّق التثبيت والإخفاء والترتيب اليدوي دائمًا." } };
const IG: Partial<PersonalizationCopy> = { customize: { eyebrow: "Ụlọ gị", title: "Hazie ụlọ gị", description: "Kpọgide mpaghara ndị ị na-ejikarị eme ihe, zoo ndị ị na-adịghị eji, ma tọọ usoro ha. A na-echekwa nhọrọ gị n'akaụntụ gị, ọ na-eso gị na ngwaọrụ niile.", desktopTab: "Kọmpụta", mobileTab: "Ekwentị", pin: "Kpọgide n'elu", unpin: "Wepụ nkpọgide", hide: "Zoo", show: "Gosi", pinnedBadge: "Akpọgidere", hiddenBadge: "Ezoro ezo", blockedReason: "Chọrọ nlebara anya gị — enweghị ike izo ya ugbu a.", moveUp: "Bugoo elu", moveDown: "Buda ala", reorderHint: "Jiri ihe njikwa elu na ala, ma ọ bụ igodo àkụ mgbe elekwasịrị anya, iji hazigharịa usoro.", reset: "Tọghachi na ndabara", resetting: "Na-atọghachi…", save: "Chekwaa nhazi", saving: "Na-echekwa…", saved: "Echekwara", saveError: "Anyị enweghị ike ịchekwa nhazi gị. Biko nwaa ọzọ.", emptyState: "Enwebeghị mpaghara ụlọ ị ga-ahazi.", listLabel: "Mpaghara ụlọ — hazigharịa, kpọgide, ma ọ bụ zoo", consentNote: "Ịhazi site na ọrụ gị na-akwanyere nhọrọ nhazi gị ùgwù na ntọala nzuzo. Nkpọgide, izo na usoro aka na-arụ ọrụ mgbe niile." } };
const YO: Partial<PersonalizationCopy> = { customize: { eyebrow: "Ilé rẹ", title: "Ṣàtúnṣe ilé rẹ", description: "Fi àwọn àgbègbè tí o ń lò jùlọ mọ́lẹ̀, fi àwọn tí o kò lò pamọ́, kí o sì ṣètò ìtọ̀nà wọn. A ó fi àwọn àṣàyàn rẹ pamọ́ sí àkàǹtì rẹ, wọ́n á sì máa tẹ̀lé ẹ káàkiri àwọn ẹ̀rọ.", desktopTab: "Kọ̀ǹpútà", mobileTab: "Fóònù", pin: "Fi mọ́ orí", unpin: "Yọ ìfikàn kúrò", hide: "Fi pamọ́", show: "Fihàn", pinnedBadge: "Ó ti dìmọ́", hiddenBadge: "Ó pamọ́", blockedReason: "Ó nílò àfiyèsí rẹ — a kò lè fi pamọ́ nísinsìnyí.", moveUp: "Gbé sókè", moveDown: "Gbé sísàlẹ̀", reorderHint: "Lo àwọn ìdarí sókè àti sísàlẹ̀, tàbí àwọn bọ́tìnì ọfà nígbà tí a bá dojúkọ, láti tún ìtọ̀nà ṣe.", reset: "Tún padà sí àpèjúwe", resetting: "Ń tún padà…", save: "Fi ìtò pamọ́", saving: "Ń fi pamọ́…", saved: "A ti fipamọ́", saveError: "A kò lè fi ìtò rẹ pamọ́. Jọ̀wọ́ gbìyànjú lẹ́ẹ̀kansí.", emptyState: "Kò sí àgbègbè ilé kankan láti ṣàtúnṣe síbẹ̀.", listLabel: "Àwọn àgbègbè ilé — tún ìtọ̀nà ṣe, fi mọ́lẹ̀, tàbí fi pamọ́", consentNote: "Ṣíṣètò nípa ìgbòkègbodò rẹ bọ̀wọ̀ fún àṣàyàn ìdánimọ̀ rẹ nínú ètò àṣírí. Ìfikàn, ìfipamọ́, àti ìtò ọwọ́ máa ń ṣiṣẹ́ nígbà gbogbo." } };
const HA: Partial<PersonalizationCopy> = { customize: { eyebrow: "Gidan ka", title: "Daidaita gidan ka", description: "Manna wuraren da kake amfani da su sosai, ka ɓoye waɗanda ba ka amfani da su, sannan ka saita tsari. Ana ajiye zaɓinka a asusunka kuma yana bin ka a duk na'urori.", desktopTab: "Kwamfuta", mobileTab: "Wayar hannu", pin: "Manna a saman", unpin: "Cire mannawa", hide: "Ɓoye", show: "Nuna", pinnedBadge: "An manna", hiddenBadge: "A ɓoye", blockedReason: "Yana buƙatar hankalinka — ba za a iya ɓoye shi yanzu ba.", moveUp: "Matsar sama", moveDown: "Matsar ƙasa", reorderHint: "Yi amfani da sarrafa sama da ƙasa, ko maɓallan kibiya lokacin da aka mai da hankali, don sake tsarawa.", reset: "Maido zuwa tsoho", resetting: "Ana maidowa…", save: "Ajiye tsari", saving: "Ana ajiyewa…", saved: "An ajiye", saveError: "Ba mu iya ajiye tsarinka ba. Da fatan za a sake gwadawa.", emptyState: "Har yanzu babu wuraren gida da za a daidaita.", listLabel: "Wuraren gida — sake tsarawa, manna, ko ɓoye", consentNote: "Tsara bisa ayyukanka yana girmama zaɓin keɓancewarka a cikin saitunan sirri. Mannawa, ɓoyewa, da tsari na hannu koyaushe suna aiki." } };
const ZH: Partial<PersonalizationCopy> = { customize: { eyebrow: "你的主页", title: "自定义你的主页", description: "置顶你最常用的区域，隐藏不需要的区域，并设置顺序。你的选择将保存到你的账户，并在所有设备上同步。", desktopTab: "桌面端", mobileTab: "移动端", pin: "置顶", unpin: "取消置顶", hide: "隐藏", show: "显示", pinnedBadge: "已置顶", hiddenBadge: "已隐藏", blockedReason: "需要你的关注——目前无法隐藏。", moveUp: "上移", moveDown: "下移", reorderHint: "使用上下控件，或在聚焦时使用方向键来重新排序。", reset: "恢复默认", resetting: "正在恢复…", save: "保存布局", saving: "正在保存…", saved: "已保存", saveError: "我们无法保存你的布局。请重试。", emptyState: "目前还没有可自定义的主页区域。", listLabel: "主页区域——重新排序、置顶或隐藏", consentNote: "按你的活动排序会遵循你在隐私设置中的个性化选择。置顶、隐藏和手动排序始终生效。" } };
const HI: Partial<PersonalizationCopy> = { customize: { eyebrow: "आपका होम", title: "अपना होम कस्टमाइज़ करें", description: "जिन क्षेत्रों का आप सबसे अधिक उपयोग करते हैं उन्हें पिन करें, जिनका नहीं करते उन्हें छिपाएँ, और क्रम सेट करें। आपके चयन आपके खाते में सहेजे जाते हैं और सभी डिवाइस पर आपके साथ रहते हैं।", desktopTab: "डेस्कटॉप", mobileTab: "मोबाइल", pin: "ऊपर पिन करें", unpin: "पिन हटाएँ", hide: "छिपाएँ", show: "दिखाएँ", pinnedBadge: "पिन किया गया", hiddenBadge: "छिपा हुआ", blockedReason: "आपके ध्यान की आवश्यकता है — इसे अभी छिपाया नहीं जा सकता।", moveUp: "ऊपर ले जाएँ", moveDown: "नीचे ले जाएँ", reorderHint: "क्रम बदलने के लिए ऊपर और नीचे के नियंत्रण, या फ़ोकस होने पर तीर कुंजियों का उपयोग करें।", reset: "डिफ़ॉल्ट पर रीसेट करें", resetting: "रीसेट हो रहा है…", save: "लेआउट सहेजें", saving: "सहेजा जा रहा है…", saved: "सहेजा गया", saveError: "हम आपका लेआउट सहेज नहीं सके। कृपया पुनः प्रयास करें।", emptyState: "कस्टमाइज़ करने के लिए अभी कोई होम क्षेत्र नहीं है।", listLabel: "होम क्षेत्र — क्रम बदलें, पिन करें, या छिपाएँ", consentNote: "आपकी गतिविधि के अनुसार क्रम आपकी गोपनीयता सेटिंग्स में आपके वैयक्तिकरण विकल्प का सम्मान करता है। पिन, छिपाना, और मैन्युअल क्रम हमेशा लागू होते हैं।" } };

const LOCALE_COPY: Partial<Record<AppLocale, Partial<PersonalizationCopy>>> = {
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

export function getPersonalizationCopy(locale: AppLocale): PersonalizationCopy {
  const overrides = LOCALE_COPY[locale];
  if (overrides) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as PersonalizationCopy;
  }
  return EN;
}

/** Replace `{key}` tokens in a copy string with values (mirrors the surface pattern). */
export function formatPersonalizationTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match,
  );
}
