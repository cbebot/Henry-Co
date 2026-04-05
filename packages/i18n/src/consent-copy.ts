import type { AppLocale } from "./locales";
import { deepMergeMessages } from "./merge-messages";

export type EcosystemConsentCopy = {
  banner: {
    eyebrow: string;
    title: string;
    body: string;
    essentialOnly: string;
    customize: string;
    acceptAll: string;
  };
  fab: string;
  panel: {
    eyebrow: string;
    title: string;
    lastUpdated: string;
    lastUpdatedNever: string;
    close: string;
    essential: { title: string; description: string };
    preferences: { title: string; description: string };
    analytics: { title: string; description: string };
    marketing: { title: string; description: string };
    personalized: { title: string; description: string };
    keepEssential: string;
    save: string;
  };
  language: {
    label: string;
    hint: string;
  };
};

const EN: EcosystemConsentCopy = {
  banner: {
    eyebrow: "Experience preferences",
    title: "Choose how Henry & Co. stores settings on this device.",
    body: "Essential storage keeps security, navigation, and core flows reliable. Optional categories help remember language and interface choices, measure quality, and support carefully scoped outreach when programs are enabled.",
    essentialOnly: "Essential only",
    customize: "Customize",
    acceptAll: "Accept all",
  },
  fab: "Privacy",
  panel: {
    eyebrow: "Privacy controls",
    title: "Review privacy and personalization",
    lastUpdated: "Last updated",
    lastUpdatedNever: "Not yet saved",
    close: "Close",
    essential: {
      title: "Essential",
      description: "Required for security, session integrity, checkout flows, and core navigation.",
    },
    preferences: {
      title: "Preferences",
      description: "Remembers language, theme, and layout choices so the experience stays consistent.",
    },
    personalized: {
      title: "Personalized experience",
      description:
        "Allows tailored recommendations and contextual hints based on how you use Henry & Co. properties.",
    },
    analytics: {
      title: "Analytics",
      description: "Helps measure demand, page quality, and friction so teams can improve products responsibly.",
    },
    marketing: {
      title: "Marketing",
      description: "Enables carefully scoped remarketing or outreach when those programs are active.",
    },
    keepEssential: "Keep essential only",
    save: "Save preferences",
  },
  language: {
    label: "Language",
    hint: "Applies across Henry & Co. sites that support your selection.",
  },
};

const FR: Partial<EcosystemConsentCopy> = {
  banner: {
    eyebrow: "Préférences d’expérience",
    title: "Choisissez comment Henry & Co. enregistre les réglages sur cet appareil.",
    body: "L’essentiel assure sécurité, navigation et parcours critiques. Les options facultatives mémorisent la langue et l’interface, mesurent la qualité et soutiennent des relances cadrées lorsque les programmes sont actifs.",
    essentialOnly: "Essentiel uniquement",
    customize: "Personnaliser",
    acceptAll: "Tout accepter",
  },
  fab: "Confidentialité",
  panel: {
    eyebrow: "Contrôles confidentialité",
    title: "Confidentialité et personnalisation",
    lastUpdated: "Dernière mise à jour",
    lastUpdatedNever: "Pas encore enregistré",
    close: "Fermer",
    essential: {
      title: "Essentiel",
      description: "Indispensable pour la sécurité, les sessions, les parcours sensibles et la navigation.",
    },
    preferences: {
      title: "Préférences",
      description: "Mémorise langue, thème et mise en page pour une expérience cohérente.",
    },
    personalized: {
      title: "Expérience personnalisée",
      description:
        "Permet recommandations et repères contextuels selon votre usage des sites Henry & Co.",
    },
    analytics: {
      title: "Analytique",
      description: "Mesure la demande, la qualité des pages et les frictions pour améliorer les produits.",
    },
    marketing: {
      title: "Marketing",
      description: "Active du reciblage ou des relances lorsque les programmes concernés sont en service.",
    },
    keepEssential: "Garder l’essentiel",
    save: "Enregistrer",
  },
  language: {
    label: "Langue",
    hint: "S’applique aux sites Henry & Co. qui prennent en charge votre choix.",
  },
};

const IG: Partial<EcosystemConsentCopy> = {
  banner: {
    eyebrow: "Nhọrọ ahụmịhe",
    title: "Họrọ otu Henry & Co. si echekwa ntọala na ngwaọrụ a.",
    body: "Ihe dị mkpa na-echekwa nchekwa, navigation, na usoro ndị bụ isi. Nhọrọ ndị ọzọ na-enyere aka icheta asụsụ na nhọrọ interface, tụọ àgwà, ma kwado mkpọsa mgbe e mere ya.",
    essentialOnly: "Naanị ihe dị mkpa",
    customize: "Hazie",
    acceptAll: "Nabata niile",
  },
  fab: "Nzuzo",
  panel: {
    eyebrow: "Njikwa nzuzo",
    title: "Nyochaa nzuzo na nhazi",
    lastUpdated: "Emelitere oge ikpeazụ",
    lastUpdatedNever: "Ọ dịbeghị echekwa",
    close: "Mechie",
    essential: { title: "Dị mkpa", description: "Achọrọ maka nchekwa, nnweta, usoro ịkwụ ụgwọ, na navigation." },
    preferences: { title: "Nhọrọ", description: "Na-echeta asụsụ, isiokwu, na nhọrọ nhazi." },
    personalized: { title: "Ahụmịhe ahaziri", description: "Na-enye ohere ndụmọdụ dabara adaba dabere n'otu ị si eji saịtị Henry & Co.." },
    analytics: { title: "Nyocha", description: "Na-enyere aka tụọ àgwà ibe na nsogbu iji mee ka ngwaahịa ka mma." },
    marketing: { title: "Ahịa", description: "Na-enyere aka ịme mkpọsa mgbe mmemme ndị ahụ na-arụ ọrụ." },
    keepEssential: "Jide naanị ihe dị mkpa",
    save: "Chekwaa nhọrọ",
  },
  language: { label: "Asụsụ", hint: "Na-emetụta saịtị Henry & Co. niile nke na-akwado nhọrọ gị." },
};

const AR: Partial<EcosystemConsentCopy> = {
  banner: {
    eyebrow: "تفضيلات التجربة",
    title: "اختر كيف تحفظ Henry & Co. الإعدادات على هذا الجهاز.",
    body: "التخزين الأساسي يحافظ على الأمان والتنقل والعمليات الأساسية. الفئات الاختيارية تساعد في تذكر اللغة وخيارات الواجهة وقياس الجودة ودعم التواصل المحدد عند تفعيل البرامج.",
    essentialOnly: "الأساسي فقط",
    customize: "تخصيص",
    acceptAll: "قبول الكل",
  },
  fab: "الخصوصية",
  panel: {
    eyebrow: "إعدادات الخصوصية",
    title: "مراجعة الخصوصية والتخصيص",
    lastUpdated: "آخر تحديث",
    lastUpdatedNever: "لم يتم الحفظ بعد",
    close: "إغلاق",
    essential: { title: "أساسي", description: "مطلوب للأمان وسلامة الجلسة وعمليات الدفع والتنقل الأساسي." },
    preferences: { title: "التفضيلات", description: "يتذكر اللغة والسمة وخيارات التخطيط للحفاظ على تجربة متسقة." },
    personalized: { title: "تجربة مخصصة", description: "يسمح بتوصيات مخصصة بناءً على استخدامك لمواقع Henry & Co." },
    analytics: { title: "التحليلات", description: "يساعد في قياس جودة الصفحات والاحتكاك لتحسين المنتجات بشكل مسؤول." },
    marketing: { title: "التسويق", description: "يمكّن التسويق المحدد النطاق عند تفعيل تلك البرامج." },
    keepEssential: "الاحتفاظ بالأساسي فقط",
    save: "حفظ التفضيلات",
  },
  language: { label: "اللغة", hint: "ينطبق على مواقع Henry & Co. التي تدعم اختيارك." },
};

const ES: Partial<EcosystemConsentCopy> = {
  banner: {
    eyebrow: "Preferencias de experiencia",
    title: "Elige cómo Henry & Co. guarda configuraciones en este dispositivo.",
    body: "El almacenamiento esencial mantiene la seguridad, navegación y flujos principales. Las categorías opcionales ayudan a recordar idioma y preferencias de interfaz, medir calidad y apoyar comunicaciones cuando los programas están activos.",
    essentialOnly: "Solo esencial",
    customize: "Personalizar",
    acceptAll: "Aceptar todo",
  },
  fab: "Privacidad",
  panel: {
    eyebrow: "Controles de privacidad",
    title: "Revisar privacidad y personalización",
    lastUpdated: "Última actualización",
    lastUpdatedNever: "Aún no guardado",
    close: "Cerrar",
    essential: { title: "Esencial", description: "Necesario para seguridad, sesiones, pagos y navegación principal." },
    preferences: { title: "Preferencias", description: "Recuerda idioma, tema y opciones de diseño para una experiencia consistente." },
    personalized: { title: "Experiencia personalizada", description: "Permite recomendaciones personalizadas según tu uso de los sitios de Henry & Co." },
    analytics: { title: "Analítica", description: "Ayuda a medir calidad de páginas y fricciones para mejorar productos responsablemente." },
    marketing: { title: "Marketing", description: "Habilita remarketing cuidadosamente definido cuando esos programas están activos." },
    keepEssential: "Mantener solo esencial",
    save: "Guardar preferencias",
  },
  language: { label: "Idioma", hint: "Se aplica en los sitios de Henry & Co. que admiten tu selección." },
};

const PT: Partial<EcosystemConsentCopy> = {
  banner: {
    eyebrow: "Preferências de experiência",
    title: "Escolha como a Henry & Co. armazena configurações neste dispositivo.",
    body: "O armazenamento essencial mantém a segurança, navegação e fluxos principais. As categorias opcionais ajudam a lembrar idioma e preferências de interface, medir qualidade e apoiar comunicações quando os programas estão ativos.",
    essentialOnly: "Apenas essencial",
    customize: "Personalizar",
    acceptAll: "Aceitar tudo",
  },
  fab: "Privacidade",
  panel: {
    eyebrow: "Controles de privacidade",
    title: "Revisar privacidade e personalização",
    lastUpdated: "Última atualização",
    lastUpdatedNever: "Ainda não salvo",
    close: "Fechar",
    essential: { title: "Essencial", description: "Necessário para segurança, sessões, pagamentos e navegação principal." },
    preferences: { title: "Preferências", description: "Lembra idioma, tema e opções de layout para uma experiência consistente." },
    personalized: { title: "Experiência personalizada", description: "Permite recomendações personalizadas com base no seu uso dos sites da Henry & Co." },
    analytics: { title: "Análise", description: "Ajuda a medir qualidade de páginas e atritos para melhorar produtos de forma responsável." },
    marketing: { title: "Marketing", description: "Habilita remarketing cuidadosamente definido quando esses programas estão ativos." },
    keepEssential: "Manter apenas essencial",
    save: "Salvar preferências",
  },
  language: { label: "Idioma", hint: "Aplica-se nos sites da Henry & Co. que suportam sua seleção." },
};

const LOCALE_COPY: Partial<Record<AppLocale, Partial<EcosystemConsentCopy>>> = {
  fr: FR,
  ig: IG,
  ar: AR,
  es: ES,
  pt: PT,
};

export function getConsentCopy(locale: AppLocale): EcosystemConsentCopy {
  const overrides = LOCALE_COPY[locale];
  if (overrides) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>
    ) as unknown as EcosystemConsentCopy;
  }
  return EN;
}
