import type { AppLocale } from "./locales";
import { deepMergeMessages } from "./merge-messages";

export type StateCopy = {
  loading: {
    default: string;
    data: string;
    content: string;
  };
  empty: {
    default: string;
    noResults: string;
    noItems: string;
  };
  error: {
    default: string;
    notFound: string;
    unauthorized: string;
    forbidden: string;
    network: string;
    server: string;
    tryAgain: string;
    contactSupport: string;
  };
  confirm: {
    title: string;
    warning: string;
    cancel: string;
    proceed: string;
  };
};

const EN: StateCopy = {
  loading: {
    default: "Loading…",
    data: "Loading data…",
    content: "Loading content…",
  },
  empty: {
    default: "Nothing here yet.",
    noResults: "No results found.",
    noItems: "No items available.",
  },
  error: {
    default: "Something went wrong.",
    notFound: "The requested page was not found.",
    unauthorized: "You need to sign in to continue.",
    forbidden: "You do not have permission for this action.",
    network: "Network error. Check your connection and try again.",
    server: "Server error. Please try again shortly.",
    tryAgain: "Try again",
    contactSupport: "Contact support",
  },
  confirm: {
    title: "Are you sure?",
    warning: "This action cannot be undone.",
    cancel: "Cancel",
    proceed: "Continue",
  },
};

const FR: Partial<StateCopy> = {
  loading: {
    default: "Chargement…",
    data: "Chargement des données…",
    content: "Chargement du contenu…",
  },
  empty: {
    default: "Rien pour le moment.",
    noResults: "Aucun résultat trouvé.",
    noItems: "Aucun élément disponible.",
  },
  error: {
    default: "Une erreur est survenue.",
    notFound: "La page demandée est introuvable.",
    unauthorized: "Vous devez vous connecter pour continuer.",
    forbidden: "Vous n'avez pas l'autorisation pour cette action.",
    network: "Erreur réseau. Vérifiez votre connexion et réessayez.",
    server: "Erreur serveur. Réessayez dans un instant.",
    tryAgain: "Réessayer",
    contactSupport: "Contacter le support",
  },
  confirm: {
    title: "Êtes-vous sûr ?",
    warning: "Cette action est irréversible.",
    cancel: "Annuler",
    proceed: "Continuer",
  },
};

const ES: Partial<StateCopy> = {
  loading: {
    default: "Cargando…",
    data: "Cargando datos…",
    content: "Cargando contenido…",
  },
  empty: {
    default: "Aún no hay nada aquí.",
    noResults: "No se encontraron resultados.",
    noItems: "No hay elementos disponibles.",
  },
  error: {
    default: "Algo salió mal.",
    notFound: "La página solicitada no fue encontrada.",
    unauthorized: "Necesitas iniciar sesión para continuar.",
    forbidden: "No tienes permiso para realizar esta acción.",
    network: "Error de red. Comprueba tu conexión e inténtalo de nuevo.",
    server: "Error del servidor. Inténtalo de nuevo en breve.",
    tryAgain: "Intentar de nuevo",
    contactSupport: "Contactar soporte",
  },
  confirm: {
    title: "¿Estás seguro?",
    warning: "Esta acción no se puede deshacer.",
    cancel: "Cancelar",
    proceed: "Continuar",
  },
};

const PT: Partial<StateCopy> = {
  loading: {
    default: "Carregando…",
    data: "Carregando dados…",
    content: "Carregando conteúdo…",
  },
  empty: {
    default: "Ainda não há nada aqui.",
    noResults: "Nenhum resultado encontrado.",
    noItems: "Nenhum item disponível.",
  },
  error: {
    default: "Algo deu errado.",
    notFound: "A página solicitada não foi encontrada.",
    unauthorized: "Você precisa fazer login para continuar.",
    forbidden: "Você não tem permissão para esta ação.",
    network: "Erro de rede. Verifique sua conexão e tente novamente.",
    server: "Erro do servidor. Tente novamente em breve.",
    tryAgain: "Tentar novamente",
    contactSupport: "Contatar suporte",
  },
  confirm: {
    title: "Tem certeza?",
    warning: "Esta ação não pode ser desfeita.",
    cancel: "Cancelar",
    proceed: "Continuar",
  },
};

const AR: Partial<StateCopy> = {
  loading: {
    default: "جارٍ التحميل…",
    data: "جارٍ تحميل البيانات…",
    content: "جارٍ تحميل المحتوى…",
  },
  empty: {
    default: "لا يوجد شيء هنا بعد.",
    noResults: "لم يتم العثور على نتائج.",
    noItems: "لا توجد عناصر متاحة.",
  },
  error: {
    default: "حدث خطأ ما.",
    notFound: "الصفحة المطلوبة غير موجودة.",
    unauthorized: "تحتاج إلى تسجيل الدخول للمتابعة.",
    forbidden: "ليس لديك صلاحية للقيام بهذا الإجراء.",
    network: "خطأ في الشبكة. تحقق من اتصالك وحاول مرة أخرى.",
    server: "خطأ في الخادم. يرجى المحاولة مرة أخرى قريباً.",
    tryAgain: "حاول مرة أخرى",
    contactSupport: "تواصل مع الدعم",
  },
  confirm: {
    title: "هل أنت متأكد؟",
    warning: "لا يمكن التراجع عن هذا الإجراء.",
    cancel: "إلغاء",
    proceed: "متابعة",
  },
};

// ─── Tier B: Architecture-ready scaffold ────────────────────────────────────

const DE: Partial<StateCopy> = {
  loading: {
    default: "Wird geladen…",
    data: "Daten werden geladen…",
    content: "Inhalt wird geladen…",
  },
  empty: {
    default: "Noch nichts hier.",
    noResults: "Keine Ergebnisse gefunden.",
    noItems: "Keine Elemente verfügbar.",
  },
  error: {
    default: "Etwas ist schiefgelaufen.",
    notFound: "Die angeforderte Seite wurde nicht gefunden.",
    unauthorized: "Sie müssen sich anmelden, um fortzufahren.",
    forbidden: "Sie haben keine Berechtigung für diese Aktion.",
    network: "Netzwerkfehler. Überprüfen Sie Ihre Verbindung und versuchen Sie es erneut.",
    server: "Serverfehler. Bitte versuchen Sie es in Kürze erneut.",
    tryAgain: "Erneut versuchen",
    contactSupport: "Support kontaktieren",
  },
  confirm: {
    title: "Sind Sie sicher?",
    warning: "Diese Aktion kann nicht rückgängig gemacht werden.",
    cancel: "Abbrechen",
    proceed: "Fortfahren",
  },
};

const ZH: Partial<StateCopy> = {
  loading: {
    default: "加载中…",
    data: "正在加载数据…",
    content: "正在加载内容…",
  },
  empty: {
    default: "暂无内容。",
    noResults: "未找到结果。",
    noItems: "没有可用项目。",
  },
  error: {
    default: "出现了问题。",
    notFound: "找不到请求的页面。",
    unauthorized: "您需要登录才能继续。",
    forbidden: "您没有执行此操作的权限。",
    network: "网络错误。请检查您的连接后重试。",
    server: "服务器错误。请稍后重试。",
    tryAgain: "重试",
    contactSupport: "联系支持",
  },
  confirm: {
    title: "您确定吗？",
    warning: "此操作无法撤销。",
    cancel: "取消",
    proceed: "继续",
  },
};

const HI: Partial<StateCopy> = {
  loading: {
    default: "लोड हो रहा है…",
    data: "डेटा लोड हो रहा है…",
    content: "सामग्री लोड हो रही है…",
  },
  empty: {
    default: "अभी यहाँ कुछ नहीं है।",
    noResults: "कोई परिणाम नहीं मिला।",
    noItems: "कोई आइटम उपलब्ध नहीं है।",
  },
  error: {
    default: "कुछ गलत हो गया।",
    notFound: "अनुरोधित पृष्ठ नहीं मिला।",
    unauthorized: "जारी रखने के लिए आपको साइन इन करना होगा।",
    forbidden: "आपके पास इस कार्य की अनुमति नहीं है।",
    network: "नेटवर्क त्रुटि। अपना कनेक्शन जांचें और पुनः प्रयास करें।",
    server: "सर्वर त्रुटि। कृपया थोड़ी देर बाद पुनः प्रयास करें।",
    tryAgain: "पुनः प्रयास करें",
    contactSupport: "सहायता से संपर्क करें",
  },
  confirm: {
    title: "क्या आप सुनिश्चित हैं?",
    warning: "यह कार्य पूर्ववत नहीं किया जा सकता।",
    cancel: "रद्द करें",
    proceed: "जारी रखें",
  },
};

// ─── Nigerian regional ───────────────────────────────────────────────────────

const IG: Partial<StateCopy> = {
  loading: {
    default: "Na-ebugo…",
    data: "Na-ebu data…",
    content: "Na-ebu ọdịnaya…",
  },
  empty: {
    default: "Enweghị ihe ebe a tukwasị.",
    noResults: "Achọtaghị ihe ọ bụla.",
    noItems: "Enweghị ihe dị.",
  },
  error: {
    default: "Ihe ọjọọ mere.",
    notFound: "Achọtaghị ibe ahụ a chọrọ.",
    unauthorized: "Ịbanye dị mkpa ka ị gaa n'ihu.",
    forbidden: "Enweghị ikike gị maka ihe a.",
    network: "Nsogbu netwọọkụ. Lelee njikọ gị wee nwalee ọzọ.",
    server: "Nsogbu sọọva. Biko nwalee n'oge na-adịghị anya.",
    tryAgain: "Nwalee ọzọ",
    contactSupport: "Kpọtụrụ nkwado",
  },
  confirm: {
    title: "Ị dị n'ọcha?",
    warning: "Enweghị ike ịlọghachi ihe omume a.",
    cancel: "Kagbuo",
    proceed: "Gaa n'ihu",
  },
};

const YO: Partial<StateCopy> = {
  loading: {
    default: "Ń gbé…",
    data: "Ń gbé data…",
    content: "Ń gbé àkóónú…",
  },
  empty: {
    default: "Kò sí ohun tó wà níbí.",
    noResults: "Kò sí àbájáde tó rí.",
    noItems: "Kò sí nǹkan tó wà.",
  },
  error: {
    default: "Nǹkan kan ti ṣẹlẹ̀.",
    notFound: "Ojúewé tí a béèrè fún kò rí.",
    unauthorized: "O nílò láti wọlé láti bá a lọ.",
    forbidden: "O kò ní àṣẹ fún iṣẹ́ yìí.",
    network: "Àṣìṣe nẹ́tíwọ̀ọ̀kì. Ṣàyẹ̀wò ìsopọ̀ rẹ kí o sì gbìyànjú lẹ́ẹ̀kan sí.",
    server: "Àṣìṣe sọ́fítì. Jọwọ gbìyànjú laìpẹ́.",
    tryAgain: "Gbìyànjú lẹ́ẹ̀kan sí",
    contactSupport: "Kan sí àtìlẹ́yìn",
  },
  confirm: {
    title: "Ṣe ó dájú fún ọ?",
    warning: "Kò ṣeéṣe láti yípadà ìgbésẹ̀ yìí.",
    cancel: "Fagilé",
    proceed: "Bá a lọ",
  },
};

const HA: Partial<StateCopy> = {
  loading: {
    default: "Ana lodi…",
    data: "Ana lodi bayanai…",
    content: "Ana lodi abun ciki…",
  },
  empty: {
    default: "Babu kome a nan tukuna.",
    noResults: "Ba a sami sakamako ba.",
    noItems: "Babu abubuwan da ake da su.",
  },
  error: {
    default: "Wani abu ya faru.",
    notFound: "Ba a sami shafin da ake nema ba.",
    unauthorized: "Kuna buƙatar shiga don ci gaba.",
    forbidden: "Ba ku da izini don wannan aikin.",
    network: "Kuskuren hanyar sadarwa. Duba haɗin ku ku sake gwadawa.",
    server: "Kuskuren sabar. Da fatan za ku sake gwadawa nan ba da daɗewa ba.",
    tryAgain: "Sake gwadawa",
    contactSupport: "Tuntuɓi tallafi",
  },
  confirm: {
    title: "Shin kun tabbata?",
    warning: "Ba za a iya canza wannan aiki ba.",
    cancel: "Soke",
    proceed: "Ci gaba",
  },
};

const IT: Partial<StateCopy> = {
  "loading": {
    "default": "Caricamento…",
    "data": "Caricamento dati...",
    "content": "Caricamento contenuto..."
  },
  "empty": {
    "default": "Niente qui ancora.",
    "noResults": "Nessun risultato trovato",
    "noItems": "Nessun articolo disponibile"
  },
  "error": {
    "default": "Qualcosa è andato storto.",
    "notFound": "La pagina richiesta non è stata trovata.",
    "unauthorized": "È necessario effettuare l'accesso per continuare.",
    "forbidden": "Non hai l'autorizzazione per questa azione.",
    "network": "Errore di rete. Controlla la connessione e riprova.",
    "server": "Errore del server. Per favore riprova a breve.",
    "tryAgain": "Riprova",
    "contactSupport": "Contatta l'assistenza"
  },
  "confirm": {
    "title": "Sei sicuro?",
    "warning": "Questa azione non può essere annullata.",
    "cancel": "Annulla",
    "proceed": "Continua"
  }
};

const LOCALE_OVERRIDES: Partial<Record<AppLocale, Partial<StateCopy>>> = {
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

export function getStateCopy(locale: AppLocale): StateCopy {
  const overrides = LOCALE_OVERRIDES[locale];
  if (overrides) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as StateCopy;
  }
  return EN;
}
