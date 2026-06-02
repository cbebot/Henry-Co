import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * LearnPathsCopy — i18n surface for the public Learning paths index page
 * (apps/learn/app/(public)/paths/page.tsx).
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each locale is
 * a Partial that deep-merges over EN so missing keys fall through to EN
 * silently. Mirrors the shape of `learn-trust-copy.ts`.
 */
export type LearnPathsCopy = {
  meta: {
    title: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    body: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  aside: {
    pathsLabel: string;
    coursesLabel: string;
    pacingLabel: string;
    pacingValue: string;
  };
  openPaths: {
    eyebrow: string;
  };
};

const LEARN_PATHS_COPY_EN: LearnPathsCopy = {
  meta: {
    title: "Learning paths - Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Learning paths",
    title: "Build a skill across several courses — not one long sprint.",
    body:
      "Each path lists the courses in order. Complete them one at a time; your progress still lives in your HenryCo account so you can pause and return whenever you need.",
    ctaPrimary: "Browse individual courses",
    ctaSecondary: "Certificate programs",
  },
  aside: {
    pathsLabel: "Paths",
    coursesLabel: "Courses linked",
    pacingLabel: "Pacing",
    pacingValue: "Pause and resume from account",
  },
  openPaths: {
    eyebrow: "Open paths",
  },
};

const LEARN_PATHS_COPY_FR: DeepPartial<LearnPathsCopy> = {
  meta: {
    title: "Parcours d’apprentissage — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Parcours d’apprentissage",
    title: "Construisez une compétence à travers plusieurs cours — pas un seul long sprint.",
    body:
      "Chaque parcours énumère les cours dans l’ordre. Suivez-les un à un ; votre progression reste dans votre compte HenryCo, vous pouvez donc mettre en pause et reprendre quand vous le souhaitez.",
    ctaPrimary: "Parcourir les cours individuels",
    ctaSecondary: "Programmes certifiants",
  },
  aside: {
    pathsLabel: "Parcours",
    coursesLabel: "Cours associés",
    pacingLabel: "Rythme",
    pacingValue: "Pause et reprise depuis le compte",
  },
  openPaths: {
    eyebrow: "Parcours ouverts",
  },
};

const LEARN_PATHS_COPY_ES: DeepPartial<LearnPathsCopy> = {
  meta: {
    title: "Itinerarios de aprendizaje — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Itinerarios de aprendizaje",
    title: "Desarrolla una destreza a lo largo de varios cursos, no en una sola maratón.",
    body:
      "Cada itinerario muestra los cursos en orden. Complétalos uno a uno; tu progreso permanece en tu cuenta de HenryCo para que puedas pausar y volver cuando lo necesites.",
    ctaPrimary: "Explorar cursos individuales",
    ctaSecondary: "Programas certificados",
  },
  aside: {
    pathsLabel: "Itinerarios",
    coursesLabel: "Cursos vinculados",
    pacingLabel: "Ritmo",
    pacingValue: "Pausar y retomar desde la cuenta",
  },
  openPaths: {
    eyebrow: "Itinerarios abiertos",
  },
};

const LEARN_PATHS_COPY_PT: DeepPartial<LearnPathsCopy> = {
  meta: {
    title: "Trilhas de aprendizagem — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Trilhas de aprendizagem",
    title: "Construa uma competência ao longo de vários cursos — não num único sprint.",
    body:
      "Cada trilha apresenta os cursos por ordem. Conclua-os um de cada vez; o seu progresso continua na sua conta HenryCo, por isso pode pausar e retomar sempre que precisar.",
    ctaPrimary: "Explorar cursos individuais",
    ctaSecondary: "Programas com certificado",
  },
  aside: {
    pathsLabel: "Trilhas",
    coursesLabel: "Cursos associados",
    pacingLabel: "Ritmo",
    pacingValue: "Pausar e retomar pela conta",
  },
  openPaths: {
    eyebrow: "Trilhas abertas",
  },
};

const LEARN_PATHS_COPY_AR: DeepPartial<LearnPathsCopy> = {
  meta: {
    title: "مسارات التعلُّم — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "مسارات التعلُّم",
    title: "ابنِ مهارةً عبر عدّة دورات — لا في سباق طويل واحد.",
    body:
      "كلّ مسار يعرض الدورات بالترتيب. أكملها واحدةً تلو الأخرى؛ يبقى تقدّمك محفوظًا في حساب HenryCo، فتستطيع التوقّف والعودة متى احتجت.",
    ctaPrimary: "تصفُّح الدورات المنفردة",
    ctaSecondary: "برامج الشهادات",
  },
  aside: {
    pathsLabel: "المسارات",
    coursesLabel: "الدورات المرتبطة",
    pacingLabel: "الإيقاع",
    pacingValue: "التوقّف والاستئناف من الحساب",
  },
  openPaths: {
    eyebrow: "المسارات المتاحة",
  },
};

const LEARN_PATHS_COPY_DE: DeepPartial<LearnPathsCopy> = {
  meta: {
    title: "Lernpfade — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Lernpfade",
    title: "Bauen Sie eine Fähigkeit über mehrere Kurse hinweg auf — nicht in einem langen Sprint.",
    body:
      "Jeder Pfad listet die Kurse in der richtigen Reihenfolge auf. Schließen Sie sie einen nach dem anderen ab; Ihr Fortschritt bleibt in Ihrem HenryCo-Konto erhalten, sodass Sie pausieren und jederzeit wieder einsteigen können.",
    ctaPrimary: "Einzelne Kurse durchsuchen",
    ctaSecondary: "Zertifikatsprogramme",
  },
  aside: {
    pathsLabel: "Pfade",
    coursesLabel: "Verknüpfte Kurse",
    pacingLabel: "Tempo",
    pacingValue: "Pausieren und über das Konto fortsetzen",
  },
  openPaths: {
    eyebrow: "Offene Pfade",
  },
};

const LEARN_PATHS_COPY_IT: DeepPartial<LearnPathsCopy> = {
  meta: {
    title: "Percorsi di apprendimento — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Percorsi di apprendimento",
    title: "Costruisci una competenza attraverso più corsi — non in un’unica lunga corsa.",
    body:
      "Ogni percorso elenca i corsi in ordine. Completali uno alla volta; i tuoi progressi restano nel tuo account HenryCo, così puoi sospendere e riprendere quando vuoi.",
    ctaPrimary: "Esplora i singoli corsi",
    ctaSecondary: "Programmi con certificato",
  },
  aside: {
    pathsLabel: "Percorsi",
    coursesLabel: "Corsi collegati",
    pacingLabel: "Ritmo",
    pacingValue: "Sospensione e ripresa dall’account",
  },
  openPaths: {
    eyebrow: "Percorsi aperti",
  },
};

const LEARN_PATHS_COPY_ZH: DeepPartial<LearnPathsCopy> = {
  meta: {
    title: "学习路径 — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "学习路径",
    title: "通过多门课程逐步构建一项技能 —— 而不是一次性的长程冲刺。",
    body:
      "每条路径都按顺序列出对应的课程。一次完成一门;你的进度始终保存在 HenryCo 账户里,随时都可以暂停或继续。",
    ctaPrimary: "浏览单门课程",
    ctaSecondary: "证书项目",
  },
  aside: {
    pathsLabel: "路径",
    coursesLabel: "关联课程",
    pacingLabel: "节奏",
    pacingValue: "通过账户暂停与续学",
  },
  openPaths: {
    eyebrow: "开放路径",
  },
};

const LEARN_PATHS_COPY_HI: DeepPartial<LearnPathsCopy> = {
  meta: {
    title: "लर्निंग पथ — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "लर्निंग पथ",
    title: "कई कोर्स के ज़रिए एक कौशल विकसित करें — एक लंबे स्प्रिंट में नहीं।",
    body:
      "हर पथ कोर्स को क्रम में दिखाता है। उन्हें एक-एक करके पूरा करें; आपकी प्रगति आपके HenryCo खाते में सुरक्षित रहती है, इसलिए आप जब चाहें रुक सकते हैं और लौट सकते हैं।",
    ctaPrimary: "अलग-अलग कोर्स देखें",
    ctaSecondary: "प्रमाणपत्र कार्यक्रम",
  },
  aside: {
    pathsLabel: "पथ",
    coursesLabel: "जुड़े कोर्स",
    pacingLabel: "गति",
    pacingValue: "खाते से रोकें और फिर शुरू करें",
  },
  openPaths: {
    eyebrow: "खुले पथ",
  },
};

const LEARN_PATHS_COPY_IG: DeepPartial<LearnPathsCopy> = {
  meta: {
    title: "Ụzọ mmụta — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Ụzọ mmụta",
    title: "Wuo nkà site na ọtụtụ nkuzi — ọ bụghị otu ọsọ ogologo.",
    body:
      "Ụzọ ọ bụla na-edepụta nkuzi n’usoro. Mechaa ha otu n’otu; ọganihu gị ka nọ n’akaụntụ HenryCo gị, ya mere ị nwere ike ịkwụsịtụ ma laghachi mgbe ọ bụla ọ dị gị mkpa.",
    ctaPrimary: "Nyochaa nkuzi n’otu n’otu",
    ctaSecondary: "Mmemme akwụkwọ ikike",
  },
  aside: {
    pathsLabel: "Ụzọ",
    coursesLabel: "Nkuzi ejikọrọ",
    pacingLabel: "Ọsọ",
    pacingValue: "Kwụsịtụ ma maliteghachi site n’akaụntụ",
  },
  openPaths: {
    eyebrow: "Ụzọ mepere emepe",
  },
};

const LEARN_PATHS_COPY_YO: DeepPartial<LearnPathsCopy> = {
  meta: {
    title: "Àwọn ọ̀nà ìkẹ́kọ̀ọ́ — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Àwọn ọ̀nà ìkẹ́kọ̀ọ́",
    title: "Kọ́ ọgbọ́n nínú ọ̀pọ̀lọpọ̀ ẹ̀kọ́ — kì í ṣe nínú eré gígùn kan.",
    body:
      "Ọ̀nà kọ̀ọ̀kan ń tò àwọn ẹ̀kọ́ ní àtẹ̀léǹtẹ̀lé. Pari wọn lọ́kọ̀ọ̀kan; ìlọsíwájú rẹ wà nínú àkáùntì HenryCo rẹ, nítorí ó lè dáwọ́dúró kí ó sì padà sí i nígbàkígbà tí ó bá fẹ́.",
    ctaPrimary: "Yẹ ẹ̀kọ́ kọ̀ọ̀kan wò",
    ctaSecondary: "Àwọn ètò ẹ̀rí",
  },
  aside: {
    pathsLabel: "Ọ̀nà",
    coursesLabel: "Ẹ̀kọ́ tí a so",
    pacingLabel: "Ìtẹ̀síwájú",
    pacingValue: "Dáwọ́dúró kí o sì tẹ̀síwájú láti àkáùntì",
  },
  openPaths: {
    eyebrow: "Ọ̀nà tó ṣí sílẹ̀",
  },
};

const LEARN_PATHS_COPY_HA: DeepPartial<LearnPathsCopy> = {
  meta: {
    title: "Hanyoyin koyo — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Hanyoyin koyo",
    title: "Gina ƙwarewa ta hanyar kwasa-kwasai da yawa — ba a cikin dogon gudu ɗaya ba.",
    body:
      "Kowace hanya tana lissafa kwasa-kwasai cikin tsari. Cika su ɗaya bayan ɗaya; ci gabanku yana zaune a asusunku na HenryCo, don haka za ku iya dakatarwa kuma ku dawo a duk lokacin da kuke buƙata.",
    ctaPrimary: "Duba kwasa-kwasai ɗaya ɗaya",
    ctaSecondary: "Shirye-shiryen takaddun shaida",
  },
  aside: {
    pathsLabel: "Hanyoyi",
    coursesLabel: "Kwasa-kwasai da aka haɗa",
    pacingLabel: "Tafiya",
    pacingValue: "Dakatar da kuma ci gaba daga asusu",
  },
  openPaths: {
    eyebrow: "Hanyoyin da suka buɗe",
  },
};

const LEARN_PATHS_LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<LearnPathsCopy>>> = {
  fr: LEARN_PATHS_COPY_FR,
  es: LEARN_PATHS_COPY_ES,
  pt: LEARN_PATHS_COPY_PT,
  ar: LEARN_PATHS_COPY_AR,
  de: LEARN_PATHS_COPY_DE,
  it: LEARN_PATHS_COPY_IT,
  zh: LEARN_PATHS_COPY_ZH,
  hi: LEARN_PATHS_COPY_HI,
  ig: LEARN_PATHS_COPY_IG,
  yo: LEARN_PATHS_COPY_YO,
  ha: LEARN_PATHS_COPY_HA,
};

export function getLearnPathsCopy(locale: AppLocale): LearnPathsCopy {
  const overrides = LEARN_PATHS_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      LEARN_PATHS_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as LearnPathsCopy;
  }
  return LEARN_PATHS_COPY_EN;
}

/** @internal */
export function __dangerouslyGetEnglishLearnPathsCopy(): LearnPathsCopy {
  return LEARN_PATHS_COPY_EN;
}
