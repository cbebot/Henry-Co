import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * LearnCategoriesCopy — i18n surface for the public category detail page on
 * the Learn division (apps/learn/app/(public)/categories/[slug]/page.tsx).
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each locale is a
 * Partial that deep-merges over EN so missing keys fall through to EN
 * silently. Mirrors the shape of `learn-trust-copy.ts`.
 *
 * Templates use `{category}` / `{count}` placeholders that consumers replace
 * via `.replace()` at the call site.
 */
export type LearnCategoriesCopy = {
  meta: {
    /** Template: `{category} courses - Henry Onyx Learn` */
    titleTemplate: string;
    /** Template: `Browse every course in the {category} category.` */
    descriptionTemplate: string;
  };
  breadcrumb: {
    backToCourses: string;
  };
  hero: {
    /** Template: `Category · {category}` */
    eyebrowTemplate: string;
    ctaBrowseAll: string;
    ctaExplorePaths: string;
  };
  stats: {
    activeCoursesLabel: string;
    enrollmentLabel: string;
    enrollmentValue: string;
    recordsLabel: string;
    recordsValue: string;
  };
  grid: {
    /** Template: `Courses in {category}` */
    eyebrowTemplate: string;
    /** Template: `{count} listed` */
    countTemplate: string;
  };
};

const LEARN_CATEGORIES_COPY_EN: LearnCategoriesCopy = {
  meta: {
    titleTemplate: "{category} courses - Henry Onyx Learn",
    descriptionTemplate: "Browse every course in the {category} category.",
  },
  breadcrumb: {
    backToCourses: "All courses",
  },
  hero: {
    eyebrowTemplate: "Category · {category}",
    ctaBrowseAll: "Browse all courses",
    ctaExplorePaths: "Explore learning paths",
  },
  stats: {
    activeCoursesLabel: "Active courses",
    enrollmentLabel: "Enrollment",
    enrollmentValue: "One HenryCo account",
    recordsLabel: "Records",
    recordsValue: "Server-side, verifiable",
  },
  grid: {
    eyebrowTemplate: "Courses in {category}",
    countTemplate: "{count} listed",
  },
};

const LEARN_CATEGORIES_COPY_FR: DeepPartial<LearnCategoriesCopy> = {
  meta: {
    titleTemplate: "Cours {category} — Henry Onyx Learn",
    descriptionTemplate: "Parcourez tous les cours de la catégorie {category}.",
  },
  breadcrumb: {
    backToCourses: "Tous les cours",
  },
  hero: {
    eyebrowTemplate: "Catégorie · {category}",
    ctaBrowseAll: "Parcourir tous les cours",
    ctaExplorePaths: "Explorer les parcours d’apprentissage",
  },
  stats: {
    activeCoursesLabel: "Cours actifs",
    enrollmentLabel: "Inscription",
    enrollmentValue: "Un seul compte HenryCo",
    recordsLabel: "Dossiers",
    recordsValue: "Côté serveur, vérifiables",
  },
  grid: {
    eyebrowTemplate: "Cours dans {category}",
    countTemplate: "{count} référencés",
  },
};

const LEARN_CATEGORIES_COPY_ES: DeepPartial<LearnCategoriesCopy> = {
  meta: {
    titleTemplate: "Cursos de {category} — Henry Onyx Learn",
    descriptionTemplate: "Explora todos los cursos de la categoría {category}.",
  },
  breadcrumb: {
    backToCourses: "Todos los cursos",
  },
  hero: {
    eyebrowTemplate: "Categoría · {category}",
    ctaBrowseAll: "Explorar todos los cursos",
    ctaExplorePaths: "Descubrir las rutas de aprendizaje",
  },
  stats: {
    activeCoursesLabel: "Cursos activos",
    enrollmentLabel: "Inscripción",
    enrollmentValue: "Una sola cuenta HenryCo",
    recordsLabel: "Registros",
    recordsValue: "En el servidor, verificables",
  },
  grid: {
    eyebrowTemplate: "Cursos en {category}",
    countTemplate: "{count} disponibles",
  },
};

const LEARN_CATEGORIES_COPY_PT: DeepPartial<LearnCategoriesCopy> = {
  meta: {
    titleTemplate: "Cursos de {category} — Henry Onyx Learn",
    descriptionTemplate: "Explore todos os cursos da categoria {category}.",
  },
  breadcrumb: {
    backToCourses: "Todos os cursos",
  },
  hero: {
    eyebrowTemplate: "Categoria · {category}",
    ctaBrowseAll: "Explorar todos os cursos",
    ctaExplorePaths: "Conhecer os percursos de aprendizagem",
  },
  stats: {
    activeCoursesLabel: "Cursos ativos",
    enrollmentLabel: "Inscrição",
    enrollmentValue: "Uma única conta HenryCo",
    recordsLabel: "Registos",
    recordsValue: "No servidor, verificáveis",
  },
  grid: {
    eyebrowTemplate: "Cursos em {category}",
    countTemplate: "{count} listados",
  },
};

const LEARN_CATEGORIES_COPY_AR: DeepPartial<LearnCategoriesCopy> = {
  meta: {
    titleTemplate: "دورات {category} — Henry Onyx Learn",
    descriptionTemplate: "تصفّح كل الدورات في فئة {category}.",
  },
  breadcrumb: {
    backToCourses: "كل الدورات",
  },
  hero: {
    eyebrowTemplate: "الفئة · {category}",
    ctaBrowseAll: "تصفّح كل الدورات",
    ctaExplorePaths: "استكشاف مسارات التعلّم",
  },
  stats: {
    activeCoursesLabel: "الدورات النشطة",
    enrollmentLabel: "التسجيل",
    enrollmentValue: "حساب HenryCo واحد",
    recordsLabel: "السجلّات",
    recordsValue: "على الخادم، قابلة للتحقُّق",
  },
  grid: {
    eyebrowTemplate: "دورات في {category}",
    countTemplate: "{count} مُدرَجة",
  },
};

const LEARN_CATEGORIES_COPY_DE: DeepPartial<LearnCategoriesCopy> = {
  meta: {
    titleTemplate: "{category}-Kurse — Henry Onyx Learn",
    descriptionTemplate: "Durchsuchen Sie alle Kurse in der Kategorie {category}.",
  },
  breadcrumb: {
    backToCourses: "Alle Kurse",
  },
  hero: {
    eyebrowTemplate: "Kategorie · {category}",
    ctaBrowseAll: "Alle Kurse durchsuchen",
    ctaExplorePaths: "Lernpfade entdecken",
  },
  stats: {
    activeCoursesLabel: "Aktive Kurse",
    enrollmentLabel: "Anmeldung",
    enrollmentValue: "Ein HenryCo-Konto",
    recordsLabel: "Nachweise",
    recordsValue: "Serverseitig, prüfbar",
  },
  grid: {
    eyebrowTemplate: "Kurse in {category}",
    countTemplate: "{count} gelistet",
  },
};

const LEARN_CATEGORIES_COPY_IT: DeepPartial<LearnCategoriesCopy> = {
  meta: {
    titleTemplate: "Corsi di {category} — Henry Onyx Learn",
    descriptionTemplate: "Esplora tutti i corsi della categoria {category}.",
  },
  breadcrumb: {
    backToCourses: "Tutti i corsi",
  },
  hero: {
    eyebrowTemplate: "Categoria · {category}",
    ctaBrowseAll: "Esplora tutti i corsi",
    ctaExplorePaths: "Scopri i percorsi di apprendimento",
  },
  stats: {
    activeCoursesLabel: "Corsi attivi",
    enrollmentLabel: "Iscrizione",
    enrollmentValue: "Un solo account HenryCo",
    recordsLabel: "Registri",
    recordsValue: "Lato server, verificabili",
  },
  grid: {
    eyebrowTemplate: "Corsi in {category}",
    countTemplate: "{count} elencati",
  },
};

const LEARN_CATEGORIES_COPY_ZH: DeepPartial<LearnCategoriesCopy> = {
  meta: {
    titleTemplate: "{category} 课程 — Henry Onyx Learn",
    descriptionTemplate: "浏览 {category} 分类中的全部课程。",
  },
  breadcrumb: {
    backToCourses: "全部课程",
  },
  hero: {
    eyebrowTemplate: "分类 · {category}",
    ctaBrowseAll: "浏览全部课程",
    ctaExplorePaths: "探索学习路径",
  },
  stats: {
    activeCoursesLabel: "在售课程",
    enrollmentLabel: "报名方式",
    enrollmentValue: "一个 HenryCo 账户",
    recordsLabel: "记录",
    recordsValue: "服务器端,可核验",
  },
  grid: {
    eyebrowTemplate: "{category} 中的课程",
    countTemplate: "已收录 {count} 门",
  },
};

const LEARN_CATEGORIES_COPY_HI: DeepPartial<LearnCategoriesCopy> = {
  meta: {
    titleTemplate: "{category} कोर्स — Henry Onyx Learn",
    descriptionTemplate: "{category} श्रेणी के सभी कोर्स देखें।",
  },
  breadcrumb: {
    backToCourses: "सभी कोर्स",
  },
  hero: {
    eyebrowTemplate: "श्रेणी · {category}",
    ctaBrowseAll: "सभी कोर्स देखें",
    ctaExplorePaths: "लर्निंग पाथ देखें",
  },
  stats: {
    activeCoursesLabel: "सक्रिय कोर्स",
    enrollmentLabel: "नामांकन",
    enrollmentValue: "एक HenryCo खाता",
    recordsLabel: "रिकॉर्ड",
    recordsValue: "सर्वर पर, सत्यापन योग्य",
  },
  grid: {
    eyebrowTemplate: "{category} में कोर्स",
    countTemplate: "{count} सूचीबद्ध",
  },
};

const LEARN_CATEGORIES_COPY_IG: DeepPartial<LearnCategoriesCopy> = {
  meta: {
    titleTemplate: "Nkuzi {category} — Henry Onyx Learn",
    descriptionTemplate: "Nyochaa nkuzi niile dị n’ụdị {category}.",
  },
  breadcrumb: {
    backToCourses: "Nkuzi niile",
  },
  hero: {
    eyebrowTemplate: "Ụdị · {category}",
    ctaBrowseAll: "Nyochaa nkuzi niile",
    ctaExplorePaths: "Chọpụta ụzọ mmụta",
  },
  stats: {
    activeCoursesLabel: "Nkuzi na-arụ ọrụ",
    enrollmentLabel: "Ndebanye aha",
    enrollmentValue: "Otu akaụntụ HenryCo",
    recordsLabel: "Akwụkwọ ndekọ",
    recordsValue: "Na sava, enwere ike inyocha ya",
  },
  grid: {
    eyebrowTemplate: "Nkuzi na {category}",
    countTemplate: "{count} edepụtara",
  },
};

const LEARN_CATEGORIES_COPY_YO: DeepPartial<LearnCategoriesCopy> = {
  meta: {
    titleTemplate: "Àwọn ẹ̀kọ́ {category} — Henry Onyx Learn",
    descriptionTemplate: "Wo gbogbo ẹ̀kọ́ tó wà nínú ìpín {category}.",
  },
  breadcrumb: {
    backToCourses: "Gbogbo àwọn ẹ̀kọ́",
  },
  hero: {
    eyebrowTemplate: "Ìpín · {category}",
    ctaBrowseAll: "Wo gbogbo àwọn ẹ̀kọ́",
    ctaExplorePaths: "Ṣàwárí àwọn ọ̀nà ìkẹ́kọ̀ọ́",
  },
  stats: {
    activeCoursesLabel: "Àwọn ẹ̀kọ́ tó ń lọ lọ́wọ́",
    enrollmentLabel: "Ìforúkọsílẹ̀",
    enrollmentValue: "Àkáǹtì HenryCo kan",
    recordsLabel: "Àkọsílẹ̀",
    recordsValue: "Ní sáfà, ó ṣeé yẹ̀wò",
  },
  grid: {
    eyebrowTemplate: "Àwọn ẹ̀kọ́ nínú {category}",
    countTemplate: "{count} tí a kọ sílẹ̀",
  },
};

const LEARN_CATEGORIES_COPY_HA: DeepPartial<LearnCategoriesCopy> = {
  meta: {
    titleTemplate: "Kwasa-kwasai na {category} — Henry Onyx Learn",
    descriptionTemplate: "Duba dukkan kwasa-kwasai a cikin rukunin {category}.",
  },
  breadcrumb: {
    backToCourses: "Dukkan kwasa-kwasai",
  },
  hero: {
    eyebrowTemplate: "Rukuni · {category}",
    ctaBrowseAll: "Duba dukkan kwasa-kwasai",
    ctaExplorePaths: "Bincika hanyoyin koyo",
  },
  stats: {
    activeCoursesLabel: "Kwasa-kwasai masu aiki",
    enrollmentLabel: "Rajista",
    enrollmentValue: "Asusun HenryCo guda ɗaya",
    recordsLabel: "Bayanai",
    recordsValue: "A kan sabar, za a iya tabbatarwa",
  },
  grid: {
    eyebrowTemplate: "Kwasa-kwasai a cikin {category}",
    countTemplate: "{count} an jera",
  },
};

const LEARN_CATEGORIES_LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<LearnCategoriesCopy>>> = {
  fr: LEARN_CATEGORIES_COPY_FR,
  es: LEARN_CATEGORIES_COPY_ES,
  pt: LEARN_CATEGORIES_COPY_PT,
  ar: LEARN_CATEGORIES_COPY_AR,
  de: LEARN_CATEGORIES_COPY_DE,
  it: LEARN_CATEGORIES_COPY_IT,
  zh: LEARN_CATEGORIES_COPY_ZH,
  hi: LEARN_CATEGORIES_COPY_HI,
  ig: LEARN_CATEGORIES_COPY_IG,
  yo: LEARN_CATEGORIES_COPY_YO,
  ha: LEARN_CATEGORIES_COPY_HA,
};

export function getLearnCategoriesCopy(locale: AppLocale): LearnCategoriesCopy {
  const overrides = LEARN_CATEGORIES_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      LEARN_CATEGORIES_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as LearnCategoriesCopy;
  }
  return LEARN_CATEGORIES_COPY_EN;
}

/** @internal */
export function __dangerouslyGetEnglishLearnCategoriesCopy(): LearnCategoriesCopy {
  return LEARN_CATEGORIES_COPY_EN;
}
