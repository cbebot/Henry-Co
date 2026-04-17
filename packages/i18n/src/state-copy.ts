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

const LOCALE_OVERRIDES: Partial<Record<AppLocale, Partial<StateCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
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
