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
    /** Label for the theme section heading in the preferences page. */
    theme: string;
    /** Confirmation label shown briefly after saving preferences. */
    savedConfirmation: string;
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
    theme: "Theme",
    savedConfirmation: "Saved",
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
    theme: "Thème",
    savedConfirmation: "Enregistré",
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
    theme: "Isiokwu",
    savedConfirmation: "Echekwara",
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
    theme: "المظهر",
    savedConfirmation: "تم الحفظ",
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
    theme: "Tema",
    savedConfirmation: "Guardado",
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
    theme: "Tema",
    savedConfirmation: "Salvo",
  },
  language: { label: "Idioma", hint: "Aplica-se nos sites da Henry & Co. que suportam sua seleção." },
};

const YO: Partial<EcosystemConsentCopy> = {
  banner: {
    eyebrow: "Àwọn àṣàyàn ìrírí",
    title: "Yan bí Henry & Co. ṣe tọ́jú àwọn ètò lórí ẹ̀rọ yìí.",
    body: "Ìpamọ́ pàtàkì ń pa ààbò, ìtọ́nisọ́nà, àti àwọn ìlànà pàtàkì mọ́. Àwọn ẹ̀ka àṣàyàn ń ràn lọ́wọ́ láti rántí ède àti àwọn àṣàyàn atọkùn.",
    essentialOnly: "Pàtàkì nìkan",
    customize: "Ṣàgbékalẹ̀",
    acceptAll: "Gba gbogbo rẹ̀",
  },
  fab: "Ìkọ̀kọ̀",
  panel: {
    eyebrow: "Ìṣàkóso ìkọ̀kọ̀",
    title: "Ṣàyẹ̀wò ìkọ̀kọ̀ àti ìmójútó àdáni",
    lastUpdated: "Ìgbà tó kẹ́yìn tí a ṣe àtúnṣe",
    lastUpdatedNever: "Kò tíì tọ́jú rí",
    close: "Padé",
    essential: { title: "Pàtàkì", description: "Pàtàkì fún ààbò, àkókò ìwọlé, àwọn ìlànà iṣòwò, àti ìtọ́nisọ́nà." },
    preferences: { title: "Àwọn àṣàyàn", description: "Ń rántí ède, àwọ̀ àti àwọn àṣàyàn ètò fún ìrírí tó ní ìbámu." },
    personalized: { title: "Ìrírí àdáni", description: "Fún àwọn ìmọ̀ràn tó bá irú bí o ṣe ń lo àwọn ojú-òpó Henry & Co. mu." },
    analytics: { title: "Ìtúpalẹ̀", description: "Ń ṣe ìwọ̀n àwọn àbájáde ìdáwèwọ̀le àti ìṣòro láti mú àwọn ọjà dára sí i." },
    marketing: { title: "Títajà", description: "Ń ṣiṣẹ́ títajà ní àkókò tí àwọn ètò wọ̀nyí bá ń ṣiṣẹ́." },
    keepEssential: "Pa pàtàkì nìkan mọ́",
    save: "Tọ́jú àwọn àṣàyàn",
    theme: "Àwọ̀",
    savedConfirmation: "Tọ́jú",
  },
  language: { label: "Èdè", hint: "Ń ṣiṣẹ́ lórí àwọn ojú-òpó Henry & Co. tó ń gbà àṣàyàn rẹ." },
};

const HA: Partial<EcosystemConsentCopy> = {
  banner: {
    eyebrow: "Zaɓuɓɓukan ƙwarewa",
    title: "Zaɓi yadda Henry & Co. ke ajiye saiti a wannan na'ura.",
    body: "Ajiyar muhimmanci yana kiyaye tsaro, kewayawa, da hanyoyin aiki. Rukunonin zaɓi na taimakawa wajen tuna yare da zaɓuɓɓukan mu'amala.",
    essentialOnly: "Muhimmanci kawai",
    customize: "Daidaita",
    acceptAll: "Karɓi duka",
  },
  fab: "Sirri",
  panel: {
    eyebrow: "Sarrafa sirri",
    title: "Bincika sirri da keɓaɓɓen saiti",
    lastUpdated: "An sabunta ƙarshe",
    lastUpdatedNever: "Ba a ajiye tukuna",
    close: "Rufe",
    essential: { title: "Muhimmanci", description: "Ana buƙata don tsaro, zaman aiki, biyan kuɗi, da kewayawa." },
    preferences: { title: "Zaɓuɓɓuka", description: "Yana tuna yare, jigo, da zaɓuɓɓukan tsari don ƙwarewa mai daidaituwa." },
    personalized: { title: "Ƙwarewa ta musamman", description: "Yana ba da damar shawarwarin da suka dace bisa yadda kake amfani da shafukan Henry & Co.." },
    analytics: { title: "Bincike", description: "Yana auna ingancin shafi da matsaloli don inganta kayayyaki." },
    marketing: { title: "Talla", description: "Yana ba da damar sake yin talla idan waɗannan shirye-shiryen suna aiki." },
    keepEssential: "Kiyaye muhimmanci kawai",
    save: "Ajiye zaɓuɓɓuka",
    theme: "Jigo",
    savedConfirmation: "An ajiye",
  },
  language: { label: "Yare", hint: "Ana amfani da shi a shafukan Henry & Co. waɗanda ke goyan bayan zaɓinka." },
};

// Tier B — architecture-ready scaffold; UI copy falls back to EN for untranslated strings
const DE: Partial<EcosystemConsentCopy> = {
  banner: {
    eyebrow: "Erfahrungseinstellungen",
    title: "Wählen Sie, wie Henry & Co. Einstellungen auf diesem Gerät speichert.",
    body: "Wesentlicher Speicher sichert Sicherheit, Navigation und Kernprozesse. Optionale Kategorien helfen, Sprach- und Interface-Einstellungen zu speichern und Qualität zu messen.",
    essentialOnly: "Nur Wesentliches",
    customize: "Anpassen",
    acceptAll: "Alle akzeptieren",
  },
  fab: "Datenschutz",
  panel: {
    eyebrow: "Datenschutzeinstellungen",
    title: "Datenschutz und Personalisierung",
    lastUpdated: "Zuletzt aktualisiert",
    lastUpdatedNever: "Noch nicht gespeichert",
    close: "Schließen",
    essential: { title: "Wesentlich", description: "Erforderlich für Sicherheit, Sitzungsintegrität, Zahlungsprozesse und Navigation." },
    preferences: { title: "Einstellungen", description: "Speichert Sprache, Design und Layout für ein konsistentes Erlebnis." },
    personalized: { title: "Personalisiertes Erlebnis", description: "Ermöglicht maßgeschneiderte Empfehlungen basierend auf Ihrer Nutzung der Henry & Co. Seiten." },
    analytics: { title: "Analysen", description: "Hilft bei der Messung von Seitenqualität und Problemen zur verantwortungsvollen Produktverbesserung." },
    marketing: { title: "Marketing", description: "Ermöglicht gezieltes Remarketing, wenn diese Programme aktiv sind." },
    keepEssential: "Nur Wesentliches behalten",
    save: "Einstellungen speichern",
    theme: "Design",
    savedConfirmation: "Gespeichert",
  },
  language: { label: "Sprache", hint: "Gilt für Henry & Co. Seiten, die Ihre Auswahl unterstützen." },
};

const ZH: Partial<EcosystemConsentCopy> = {
  banner: {
    eyebrow: "体验偏好",
    title: "选择 Henry & Co. 如何在此设备上存储设置。",
    body: "基本存储确保安全性、导航和核心流程的可靠运行。可选类别有助于记住语言和界面选择、衡量质量并在项目启用时支持精准推广。",
    essentialOnly: "仅基本",
    customize: "自定义",
    acceptAll: "全部接受",
  },
  fab: "隐私",
  panel: {
    eyebrow: "隐私设置",
    title: "查看隐私和个性化",
    lastUpdated: "最后更新",
    lastUpdatedNever: "尚未保存",
    close: "关闭",
    essential: { title: "基本", description: "安全性、会话完整性、结账流程和核心导航所必需。" },
    preferences: { title: "偏好", description: "记住语言、主题和布局选择，保持一致的体验。" },
    personalized: { title: "个性化体验", description: "根据您使用 Henry & Co. 网站的方式提供量身定制的推荐。" },
    analytics: { title: "分析", description: "帮助衡量页面质量和摩擦，以负责任的方式改进产品。" },
    marketing: { title: "营销", description: "在相关项目激活时启用精准再营销。" },
    keepEssential: "仅保留基本",
    save: "保存偏好",
    theme: "主题",
    savedConfirmation: "已保存",
  },
  language: { label: "语言", hint: "适用于支持您所选语言的 Henry & Co. 网站。" },
};

const HI: Partial<EcosystemConsentCopy> = {
  banner: {
    eyebrow: "अनुभव प्राथमिकताएं",
    title: "चुनें कि Henry & Co. इस डिवाइस पर सेटिंग्स कैसे संग्रहीत करे।",
    body: "आवश्यक संग्रहण सुरक्षा, नेविगेशन और मुख्य प्रवाह को विश्वसनीय रखता है। वैकल्पिक श्रेणियां भाषा और इंटरफेस विकल्पों को याद रखने में मदद करती हैं।",
    essentialOnly: "केवल आवश्यक",
    customize: "अनुकूलित करें",
    acceptAll: "सभी स्वीकार करें",
  },
  fab: "गोपनीयता",
  panel: {
    eyebrow: "गोपनीयता नियंत्रण",
    title: "गोपनीयता और वैयक्तिकरण की समीक्षा करें",
    lastUpdated: "अंतिम अपडेट",
    lastUpdatedNever: "अभी तक सहेजा नहीं गया",
    close: "बंद करें",
    essential: { title: "आवश्यक", description: "सुरक्षा, सत्र अखंडता, चेकआउट प्रवाह और मुख्य नेविगेशन के लिए आवश्यक।" },
    preferences: { title: "प्राथमिकताएं", description: "एक सुसंगत अनुभव के लिए भाषा, थीम और लेआउट विकल्प याद रखता है।" },
    personalized: { title: "वैयक्तिकृत अनुभव", description: "Henry & Co. साइटों के उपयोग के आधार पर अनुकूलित सिफारिशों की अनुमति देता है।" },
    analytics: { title: "विश्लेषण", description: "उत्पादों को जिम्मेदारी से बेहतर बनाने के लिए पृष्ठ गुणवत्ता मापने में मदद करता है।" },
    marketing: { title: "मार्केटिंग", description: "उन कार्यक्रमों के सक्रिय होने पर सावधानीपूर्वक रीमार्केटिंग सक्षम करता है।" },
    keepEssential: "केवल आवश्यक रखें",
    save: "प्राथमिकताएं सहेजें",
    theme: "थीम",
    savedConfirmation: "सहेजा गया",
  },
  language: { label: "भाषा", hint: "Henry & Co. साइटों पर लागू होता है जो आपके चयन का समर्थन करती हैं।" },
};

const LOCALE_COPY: Partial<Record<AppLocale, Partial<EcosystemConsentCopy>>> = {
  fr: FR,
  ig: IG,
  yo: YO,
  ha: HA,
  ar: AR,
  es: ES,
  pt: PT,
  de: DE,
  zh: ZH,
  hi: HI,
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
