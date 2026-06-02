import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * LearnInstructorsCopy — i18n surface for the public Instructors index page on
 * the Learn division (apps/learn/app/(public)/instructors/page.tsx).
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each locale is a
 * DeepPartial that deep-merges over EN so missing keys silently fall back.
 * Mirrors `learn-trust-copy.ts`.
 */
export type LearnInstructorsCopy = {
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
    activeLabel: string;
    categoriesLabel: string;
    verificationLabel: string;
    verificationValue: string;
  };
  faculty: {
    sectionEyebrow: string;
    viewInstructor: string;
    empty: string;
  };
};

const LEARN_INSTRUCTORS_COPY_EN: LearnInstructorsCopy = {
  meta: {
    title: "Instructors - Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Instructors",
    title: "Operators teaching what they run.",
    body:
      "Each instructor is a working domain specialist. No filler avatars, no bought bios — just the people behind the trust layer.",
    ctaPrimary: "Apply to teach",
    ctaSecondary: "Browse the catalog",
  },
  aside: {
    activeLabel: "Active instructors",
    categoriesLabel: "Categories represented",
    verificationLabel: "Verification",
    verificationValue: "Manual review, no bought bios",
  },
  faculty: {
    sectionEyebrow: "Faculty",
    viewInstructor: "View instructor",
    empty: "Faculty roster updates as new instructors complete review.",
  },
};

const LEARN_INSTRUCTORS_COPY_FR: DeepPartial<LearnInstructorsCopy> = {
  meta: {
    title: "Formateurs — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Formateurs",
    title: "Des opérateurs qui enseignent ce qu’ils pratiquent.",
    body:
      "Chaque formateur est un spécialiste en activité dans son domaine. Pas d’avatars de remplissage, pas de biographies achetées — seulement les personnes derrière la couche de confiance.",
    ctaPrimary: "Postuler pour enseigner",
    ctaSecondary: "Parcourir le catalogue",
  },
  aside: {
    activeLabel: "Formateurs actifs",
    categoriesLabel: "Catégories représentées",
    verificationLabel: "Vérification",
    verificationValue: "Examen manuel, aucune biographie achetée",
  },
  faculty: {
    sectionEyebrow: "Corps enseignant",
    viewInstructor: "Voir le formateur",
    empty: "Le corps enseignant s’actualise au fil de la validation des nouveaux formateurs.",
  },
};

const LEARN_INSTRUCTORS_COPY_ES: DeepPartial<LearnInstructorsCopy> = {
  meta: {
    title: "Instructores — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Instructores",
    title: "Profesionales que enseñan lo que ejercen.",
    body:
      "Cada instructor es un especialista en activo. Sin avatares de relleno ni biografías compradas: solo las personas que sostienen la capa de confianza.",
    ctaPrimary: "Solicitar enseñar",
    ctaSecondary: "Explorar el catálogo",
  },
  aside: {
    activeLabel: "Instructores activos",
    categoriesLabel: "Categorías representadas",
    verificationLabel: "Verificación",
    verificationValue: "Revisión manual, sin biografías compradas",
  },
  faculty: {
    sectionEyebrow: "Profesorado",
    viewInstructor: "Ver instructor",
    empty: "El profesorado se actualiza a medida que se aprueban nuevos instructores.",
  },
};

const LEARN_INSTRUCTORS_COPY_PT: DeepPartial<LearnInstructorsCopy> = {
  meta: {
    title: "Formadores — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Formadores",
    title: "Operadores que ensinam aquilo que executam.",
    body:
      "Cada formador é um especialista em atividade. Sem avatares de preenchimento, sem biografias compradas — apenas as pessoas por trás da camada de confiança.",
    ctaPrimary: "Candidatar-se a ensinar",
    ctaSecondary: "Explorar o catálogo",
  },
  aside: {
    activeLabel: "Formadores ativos",
    categoriesLabel: "Categorias representadas",
    verificationLabel: "Verificação",
    verificationValue: "Revisão manual, sem biografias compradas",
  },
  faculty: {
    sectionEyebrow: "Corpo docente",
    viewInstructor: "Ver formador",
    empty: "O corpo docente é atualizado à medida que novos formadores concluem a revisão.",
  },
};

const LEARN_INSTRUCTORS_COPY_AR: DeepPartial<LearnInstructorsCopy> = {
  meta: {
    title: "المدرّبون — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "المدرّبون",
    title: "مشغّلون يُعلّمون ما يمارسونه فعلاً.",
    body:
      "كلّ مدرّب اختصاصي يمارس مجاله. لا صور رمزية للحشو، ولا سِير مُشتراة — فقط الأشخاص الذين تستند إليهم طبقة الثقة.",
    ctaPrimary: "تقدّم للتدريس",
    ctaSecondary: "تصفّح الكتالوج",
  },
  aside: {
    activeLabel: "المدرّبون النشطون",
    categoriesLabel: "الفئات الممثَّلة",
    verificationLabel: "التحقّق",
    verificationValue: "مراجعة يدوية، بلا سِير مُشتراة",
  },
  faculty: {
    sectionEyebrow: "هيئة التدريس",
    viewInstructor: "عرض المدرّب",
    empty: "تُحدَّث هيئة التدريس مع اكتمال مراجعة المدرّبين الجدد.",
  },
};

const LEARN_INSTRUCTORS_COPY_DE: DeepPartial<LearnInstructorsCopy> = {
  meta: {
    title: "Dozent:innen — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Dozent:innen",
    title: "Praktiker:innen, die unterrichten, was sie selbst betreiben.",
    body:
      "Jede:r Dozent:in ist ein:e aktive:r Fachspezialist:in. Keine Füll-Avatare, keine gekauften Biografien — nur die Menschen hinter der Vertrauensebene.",
    ctaPrimary: "Als Dozent:in bewerben",
    ctaSecondary: "Katalog durchsuchen",
  },
  aside: {
    activeLabel: "Aktive Dozent:innen",
    categoriesLabel: "Vertretene Kategorien",
    verificationLabel: "Verifizierung",
    verificationValue: "Manuelle Prüfung, keine gekauften Biografien",
  },
  faculty: {
    sectionEyebrow: "Lehrkörper",
    viewInstructor: "Dozent:in ansehen",
    empty: "Der Lehrkörper wird laufend aktualisiert, sobald neue Dozent:innen die Prüfung abschließen.",
  },
};

const LEARN_INSTRUCTORS_COPY_IT: DeepPartial<LearnInstructorsCopy> = {
  meta: {
    title: "Docenti — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Docenti",
    title: "Operatori che insegnano ciò che praticano.",
    body:
      "Ogni docente è uno specialista in attività. Nessun avatar di riempimento, nessuna biografia comprata — solo le persone dietro al livello di fiducia.",
    ctaPrimary: "Candidati come docente",
    ctaSecondary: "Esplora il catalogo",
  },
  aside: {
    activeLabel: "Docenti attivi",
    categoriesLabel: "Categorie rappresentate",
    verificationLabel: "Verifica",
    verificationValue: "Revisione manuale, nessuna biografia comprata",
  },
  faculty: {
    sectionEyebrow: "Corpo docente",
    viewInstructor: "Vedi docente",
    empty: "Il corpo docente si aggiorna man mano che i nuovi docenti completano la revisione.",
  },
};

const LEARN_INSTRUCTORS_COPY_ZH: DeepPartial<LearnInstructorsCopy> = {
  meta: {
    title: "讲师 — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "讲师",
    title: "讲师都是在岗实操者。",
    body:
      "每位讲师都是其领域的在职专家。没有充数头像，也没有花钱买来的简介——只有支撑信任层的真实从业者。",
    ctaPrimary: "申请成为讲师",
    ctaSecondary: "浏览课程目录",
  },
  aside: {
    activeLabel: "在岗讲师",
    categoriesLabel: "涉及类别",
    verificationLabel: "审核方式",
    verificationValue: "人工审核，不接受购买的简介",
  },
  faculty: {
    sectionEyebrow: "师资阵容",
    viewInstructor: "查看讲师",
    empty: "新讲师通过审核后将陆续加入师资阵容。",
  },
};

const LEARN_INSTRUCTORS_COPY_HI: DeepPartial<LearnInstructorsCopy> = {
  meta: {
    title: "प्रशिक्षक — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "प्रशिक्षक",
    title: "वही पढ़ाते हैं जिसे वे खुद चलाते हैं।",
    body:
      "हर प्रशिक्षक अपने क्षेत्र का कार्यरत विशेषज्ञ है। न भरने वाले अवतार, न खरीदी हुई जीवनी — सिर्फ़ वे लोग जो विश्वास की परत के पीछे खड़े हैं।",
    ctaPrimary: "पढ़ाने के लिए आवेदन करें",
    ctaSecondary: "कैटलॉग देखें",
  },
  aside: {
    activeLabel: "सक्रिय प्रशिक्षक",
    categoriesLabel: "प्रस्तुत श्रेणियाँ",
    verificationLabel: "सत्यापन",
    verificationValue: "मैन्युअल समीक्षा, खरीदी हुई जीवनी नहीं",
  },
  faculty: {
    sectionEyebrow: "शिक्षक मंडल",
    viewInstructor: "प्रशिक्षक देखें",
    empty: "जैसे-जैसे नए प्रशिक्षक समीक्षा पूरी करते हैं, शिक्षक मंडल अद्यतन होता रहता है।",
  },
};

const LEARN_INSTRUCTORS_COPY_IG: DeepPartial<LearnInstructorsCopy> = {
  meta: {
    title: "Ndị nkuzi — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Ndị nkuzi",
    title: "Ndị ọrụ na-akụzi ihe ha ji aka ha na-arụ.",
    body:
      "Onye nkuzi ọ bụla bụ ọkachamara na-arụ ọrụ n’ime ngalaba ya. Enweghị onyonyo efu, enweghị akụkọ ndụ azụrụ azụ — naanị ndị nọ n’azụ akwa ntụkwasị obi.",
    ctaPrimary: "Tinye akwụkwọ ịkụzi",
    ctaSecondary: "Nyochaa katalọgụ",
  },
  aside: {
    activeLabel: "Ndị nkuzi na-arụ ọrụ",
    categoriesLabel: "Ngalaba e gosipụtara",
    verificationLabel: "Nyocha",
    verificationValue: "Nyocha aka, ọ dịghị akụkọ ndụ azụrụ azụ",
  },
  faculty: {
    sectionEyebrow: "Otu ndị nkuzi",
    viewInstructor: "Lee onye nkuzi",
    empty: "Otu ndị nkuzi na-emelite ka ndị nkuzi ọhụrụ na-emecha nyocha.",
  },
};

const LEARN_INSTRUCTORS_COPY_YO: DeepPartial<LearnInstructorsCopy> = {
  meta: {
    title: "Àwọn olùkọ́ — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Àwọn olùkọ́",
    title: "Àwọn aṣèṣe tó ń kọ́ni ní ohun tí wọ́n ń ṣe.",
    body:
      "Olùkọ́ kọ̀ọ̀kan ni amọ̀ràn tó ń ṣiṣẹ́ nínú ààyè rẹ̀. Kò sí àwòrán ìfọwọ́sàn àfọwọ́yan, kò sí ìtàn ìgbé-ayé tí a rà — kìkì àwọn ènìyàn tó dúró fún àbẹ̀nà ìgbẹ́kẹ̀lé.",
    ctaPrimary: "Béèrè láti kọ́ni",
    ctaSecondary: "Yẹ àkójọpọ̀ ẹ̀kọ́",
  },
  aside: {
    activeLabel: "Àwọn olùkọ́ tó ń ṣiṣẹ́",
    categoriesLabel: "Àwọn ẹ̀ka tí a fi hàn",
    verificationLabel: "Ìmúdájú",
    verificationValue: "Àyẹ̀wò ọwọ́, kò sí ìtàn ìgbé-ayé tí a rà",
  },
  faculty: {
    sectionEyebrow: "Ẹgbẹ́ olùkọ́",
    viewInstructor: "Wo olùkọ́",
    empty: "Ẹgbẹ́ olùkọ́ ń pọ̀ sí i bí àwọn olùkọ́ tuntun ti ń parí àyẹ̀wò.",
  },
};

const LEARN_INSTRUCTORS_COPY_HA: DeepPartial<LearnInstructorsCopy> = {
  meta: {
    title: "Malamai — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Malamai",
    title: "Masu aiki da ke koyar da abin da suke gudanarwa.",
    body:
      "Kowane malami ƙwararre ne mai aiki a fagensa. Babu surori na cika sarari, babu tarihin rayuwa da aka saya — sai dai mutanen da ke bayan layin amincin.",
    ctaPrimary: "Nemi koyarwa",
    ctaSecondary: "Duba katalogi",
  },
  aside: {
    activeLabel: "Malamai masu aiki",
    categoriesLabel: "Rukunan da aka wakilta",
    verificationLabel: "Tabbatarwa",
    verificationValue: "Bita ta hannu, ba a sayan tarihin rayuwa",
  },
  faculty: {
    sectionEyebrow: "Ƙungiyar malamai",
    viewInstructor: "Duba malami",
    empty: "Ƙungiyar malamai tana sabuntawa yayin da sabbin malamai suka kammala bita.",
  },
};

const LEARN_INSTRUCTORS_LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<LearnInstructorsCopy>>> = {
  fr: LEARN_INSTRUCTORS_COPY_FR,
  es: LEARN_INSTRUCTORS_COPY_ES,
  pt: LEARN_INSTRUCTORS_COPY_PT,
  ar: LEARN_INSTRUCTORS_COPY_AR,
  de: LEARN_INSTRUCTORS_COPY_DE,
  it: LEARN_INSTRUCTORS_COPY_IT,
  zh: LEARN_INSTRUCTORS_COPY_ZH,
  hi: LEARN_INSTRUCTORS_COPY_HI,
  ig: LEARN_INSTRUCTORS_COPY_IG,
  yo: LEARN_INSTRUCTORS_COPY_YO,
  ha: LEARN_INSTRUCTORS_COPY_HA,
};

export function getLearnInstructorsCopy(locale: AppLocale): LearnInstructorsCopy {
  const overrides = LEARN_INSTRUCTORS_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      LEARN_INSTRUCTORS_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as LearnInstructorsCopy;
  }
  return LEARN_INSTRUCTORS_COPY_EN;
}

/** @internal */
export function __dangerouslyGetEnglishLearnInstructorsCopy(): LearnInstructorsCopy {
  return LEARN_INSTRUCTORS_COPY_EN;
}
