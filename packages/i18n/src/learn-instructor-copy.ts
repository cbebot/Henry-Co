import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * LearnInstructorCopy — i18n surface for the Learn instructor dashboard
 * (apps/learn/app/instructor/page.tsx). Mirrors the shape used by
 * `learn-trust-copy.ts`: EN baseline is exhaustive; each locale is a
 * DeepPartial that deep-merges over EN so missing keys fall through.
 */
export type LearnInstructorCopy = {
  meta: {
    title: string;
  };
  hero: {
    kicker: string;
    title: string;
    description: string;
  };
  stats: {
    activeEnrollments: string;
    completed: string;
    certificatesIssued: string;
    coursesAuthored: string;
  };
  courses: {
    sectionKicker: string;
    sectionTitle: string;
    sectionBody: string;
    emptyState: string;
    enrolledLabel: string;
    completedLabel: string;
    certificatesLabel: string;
    ratingLabel: string;
  };
};

const LEARN_INSTRUCTOR_COPY_EN: LearnInstructorCopy = {
  meta: {
    title: "Instructor - Henry Onyx Learn",
  },
  hero: {
    kicker: "Instructor",
    title: "Author courses, grade work, and watch your learners progress.",
    description:
      "Build the syllabus, attach lessons + quizzes, review submissions, and track payouts. This is your full workspace as an authorised Henry Onyx Learn instructor.",
  },
  stats: {
    activeEnrollments: "Active enrollments",
    completed: "Completed",
    certificatesIssued: "Certificates issued",
    coursesAuthored: "Courses authored",
  },
  courses: {
    sectionKicker: "My courses",
    sectionTitle: "Course performance at a glance",
    sectionBody:
      "Each row shows live enrollment, completion, and learner sentiment. Click through to edit the syllabus or open the lesson builder.",
    emptyState: "No courses authored yet — start one from Courses.",
    enrolledLabel: "Enrolled",
    completedLabel: "Completed",
    certificatesLabel: "Certificates",
    ratingLabel: "Rating",
  },
};

const LEARN_INSTRUCTOR_COPY_FR: DeepPartial<LearnInstructorCopy> = {
  meta: {
    title: "Formateur — Henry Onyx Learn",
  },
  hero: {
    kicker: "Formateur",
    title: "Concevez des cours, corrigez les travaux et suivez la progression de vos apprenants.",
    description:
      "Construisez le programme, ajoutez leçons et quiz, examinez les rendus et suivez les versements. C’est votre espace de travail complet en tant que formateur Henry Onyx Learn autorisé.",
  },
  stats: {
    activeEnrollments: "Inscriptions actives",
    completed: "Terminés",
    certificatesIssued: "Certificats délivrés",
    coursesAuthored: "Cours créés",
  },
  courses: {
    sectionKicker: "Mes cours",
    sectionTitle: "Performance des cours en un coup d’œil",
    sectionBody:
      "Chaque ligne affiche les inscriptions en cours, la complétion et l’opinion des apprenants. Cliquez pour modifier le programme ou ouvrir l’éditeur de leçons.",
    emptyState: "Aucun cours créé pour l’instant — démarrez-en un depuis Cours.",
    enrolledLabel: "Inscrits",
    completedLabel: "Terminés",
    certificatesLabel: "Certificats",
    ratingLabel: "Note",
  },
};

const LEARN_INSTRUCTOR_COPY_ES: DeepPartial<LearnInstructorCopy> = {
  meta: {
    title: "Instructor — Henry Onyx Learn",
  },
  hero: {
    kicker: "Instructor",
    title: "Crea cursos, califica trabajos y sigue el progreso de tus alumnos.",
    description:
      "Construye el temario, añade lecciones y cuestionarios, revisa entregas y controla los pagos. Este es tu espacio de trabajo completo como instructor autorizado de Henry Onyx Learn.",
  },
  stats: {
    activeEnrollments: "Inscripciones activas",
    completed: "Completados",
    certificatesIssued: "Certificados emitidos",
    coursesAuthored: "Cursos creados",
  },
  courses: {
    sectionKicker: "Mis cursos",
    sectionTitle: "Rendimiento de los cursos de un vistazo",
    sectionBody:
      "Cada fila muestra inscripciones activas, finalización y la opinión del alumnado. Pulsa para editar el temario o abrir el creador de lecciones.",
    emptyState: "Aún no hay cursos creados: empieza uno desde Cursos.",
    enrolledLabel: "Inscritos",
    completedLabel: "Completados",
    certificatesLabel: "Certificados",
    ratingLabel: "Valoración",
  },
};

const LEARN_INSTRUCTOR_COPY_PT: DeepPartial<LearnInstructorCopy> = {
  meta: {
    title: "Formador — Henry Onyx Learn",
  },
  hero: {
    kicker: "Formador",
    title: "Crie cursos, avalie trabalhos e acompanhe a progressão dos seus alunos.",
    description:
      "Monte o programa, adicione lições e questionários, reveja entregas e acompanhe pagamentos. Este é o seu espaço de trabalho completo como formador autorizado da Henry Onyx Learn.",
  },
  stats: {
    activeEnrollments: "Inscrições ativas",
    completed: "Concluídos",
    certificatesIssued: "Certificados emitidos",
    coursesAuthored: "Cursos criados",
  },
  courses: {
    sectionKicker: "Os meus cursos",
    sectionTitle: "Desempenho dos cursos num relance",
    sectionBody:
      "Cada linha mostra inscrições ativas, conclusão e a opinião dos alunos. Toque para editar o programa ou abrir o construtor de lições.",
    emptyState: "Ainda não há cursos criados — comece um a partir de Cursos.",
    enrolledLabel: "Inscritos",
    completedLabel: "Concluídos",
    certificatesLabel: "Certificados",
    ratingLabel: "Classificação",
  },
};

const LEARN_INSTRUCTOR_COPY_AR: DeepPartial<LearnInstructorCopy> = {
  meta: {
    title: "المُدرِّس — Henry Onyx Learn",
  },
  hero: {
    kicker: "المُدرِّس",
    title: "أنشئ الدورات، صحِّح الأعمال، وتابع تقدُّم متعلِّميك.",
    description:
      "ابنِ المنهج، أضف الدروس والاختبارات، راجع التسليمات، وتابع المدفوعات. هذه هي مساحة العمل الكاملة لك كمُدرِّس معتمد في Henry Onyx Learn.",
  },
  stats: {
    activeEnrollments: "التسجيلات النشِطة",
    completed: "المكتمل",
    certificatesIssued: "الشهادات الصادرة",
    coursesAuthored: "الدورات المُؤَلَّفة",
  },
  courses: {
    sectionKicker: "دوراتي",
    sectionTitle: "أداء الدورات في لمحة",
    sectionBody:
      "يعرض كل صف التسجيلات الجارية، نسبة الإكمال، وانطباع المتعلِّمين. انقر للتعديل على المنهج أو فتح أداة بناء الدروس.",
    emptyState: "لم يتم إنشاء دورات بعد — ابدأ واحدة من «الدورات».",
    enrolledLabel: "المسجَّلون",
    completedLabel: "المكتمل",
    certificatesLabel: "الشهادات",
    ratingLabel: "التقييم",
  },
};

const LEARN_INSTRUCTOR_COPY_DE: DeepPartial<LearnInstructorCopy> = {
  meta: {
    title: "Lehrkraft — Henry Onyx Learn",
  },
  hero: {
    kicker: "Lehrkraft",
    title: "Kurse erstellen, Arbeiten bewerten und den Fortschritt Ihrer Lernenden begleiten.",
    description:
      "Erstellen Sie den Lehrplan, fügen Sie Lektionen und Quizze hinzu, prüfen Sie Abgaben und behalten Sie Auszahlungen im Blick. Das ist Ihr vollständiger Arbeitsbereich als autorisierte Henry Onyx-Learn-Lehrkraft.",
  },
  stats: {
    activeEnrollments: "Aktive Anmeldungen",
    completed: "Abgeschlossen",
    certificatesIssued: "Ausgestellte Zertifikate",
    coursesAuthored: "Erstellte Kurse",
  },
  courses: {
    sectionKicker: "Meine Kurse",
    sectionTitle: "Kursleistung auf einen Blick",
    sectionBody:
      "Jede Zeile zeigt aktuelle Anmeldungen, Abschlussquote und Lernenden-Stimmung. Klicken Sie, um den Lehrplan zu bearbeiten oder den Lektionsbaukasten zu öffnen.",
    emptyState: "Noch keine Kurse erstellt — starten Sie einen unter „Kurse“.",
    enrolledLabel: "Angemeldet",
    completedLabel: "Abgeschlossen",
    certificatesLabel: "Zertifikate",
    ratingLabel: "Bewertung",
  },
};

const LEARN_INSTRUCTOR_COPY_IT: DeepPartial<LearnInstructorCopy> = {
  meta: {
    title: "Docente — Henry Onyx Learn",
  },
  hero: {
    kicker: "Docente",
    title: "Crea corsi, valuta i lavori e segui i progressi dei tuoi allievi.",
    description:
      "Costruisci il programma, aggiungi lezioni e quiz, esamina le consegne e tieni traccia dei pagamenti. Questo è il tuo spazio di lavoro completo come docente autorizzato Henry Onyx Learn.",
  },
  stats: {
    activeEnrollments: "Iscrizioni attive",
    completed: "Completati",
    certificatesIssued: "Certificati emessi",
    coursesAuthored: "Corsi creati",
  },
  courses: {
    sectionKicker: "I miei corsi",
    sectionTitle: "Performance dei corsi in sintesi",
    sectionBody:
      "Ogni riga mostra iscrizioni attive, completamento e opinione degli allievi. Tocca per modificare il programma o aprire il generatore di lezioni.",
    emptyState: "Nessun corso creato ancora — avviane uno da Corsi.",
    enrolledLabel: "Iscritti",
    completedLabel: "Completati",
    certificatesLabel: "Certificati",
    ratingLabel: "Valutazione",
  },
};

const LEARN_INSTRUCTOR_COPY_ZH: DeepPartial<LearnInstructorCopy> = {
  meta: {
    title: "讲师 — Henry Onyx Learn",
  },
  hero: {
    kicker: "讲师",
    title: "创建课程、评阅作业并关注学员的进度。",
    description:
      "搭建大纲、添加课时与测验、审阅提交并跟踪结算。这里是您作为获授权 Henry Onyx Learn 讲师的完整工作空间。",
  },
  stats: {
    activeEnrollments: "在读报名",
    completed: "已完成",
    certificatesIssued: "已颁发证书",
    coursesAuthored: "已创建课程",
  },
  courses: {
    sectionKicker: "我的课程",
    sectionTitle: "课程表现一览",
    sectionBody:
      "每一行展示实时报名、完成率与学员评价。点击进入即可编辑大纲或打开课时编辑器。",
    emptyState: "尚未创建课程 — 请从「课程」开始。",
    enrolledLabel: "已报名",
    completedLabel: "已完成",
    certificatesLabel: "证书",
    ratingLabel: "评分",
  },
};

const LEARN_INSTRUCTOR_COPY_HI: DeepPartial<LearnInstructorCopy> = {
  meta: {
    title: "प्रशिक्षक — Henry Onyx Learn",
  },
  hero: {
    kicker: "प्रशिक्षक",
    title: "कोर्स बनाएं, कार्य का मूल्यांकन करें और अपने शिक्षार्थियों की प्रगति देखें।",
    description:
      "पाठ्यक्रम तैयार करें, पाठ व क्विज़ जोड़ें, सबमिशन की समीक्षा करें और भुगतान ट्रैक करें। यह Henry Onyx Learn के अधिकृत प्रशिक्षक के रूप में आपका पूरा कार्यक्षेत्र है।",
  },
  stats: {
    activeEnrollments: "सक्रिय नामांकन",
    completed: "पूर्ण",
    certificatesIssued: "जारी किए गए प्रमाणपत्र",
    coursesAuthored: "बनाए गए कोर्स",
  },
  courses: {
    sectionKicker: "मेरे कोर्स",
    sectionTitle: "एक नज़र में कोर्स का प्रदर्शन",
    sectionBody:
      "प्रत्येक पंक्ति में चालू नामांकन, पूर्णता और शिक्षार्थी की राय दिखती है। पाठ्यक्रम संपादित करने या पाठ बिल्डर खोलने के लिए क्लिक करें।",
    emptyState: "अभी तक कोई कोर्स नहीं बनाया गया — कोर्स से शुरू करें।",
    enrolledLabel: "नामांकित",
    completedLabel: "पूर्ण",
    certificatesLabel: "प्रमाणपत्र",
    ratingLabel: "रेटिंग",
  },
};

const LEARN_INSTRUCTOR_COPY_IG: DeepPartial<LearnInstructorCopy> = {
  meta: {
    title: "Onye nkuzi — Henry Onyx Learn",
  },
  hero: {
    kicker: "Onye nkuzi",
    title: "Dee nkuzi, kwue ọrụ, ma na-elebara anya ọganihu ndị mmụta gị.",
    description:
      "Wuo usoro mmụta, tinye ihe ọmụmụ na ule nta, lebara nyefe anya, ma soro ụgwọ ndị a kwụrụ. Nke a bụ ebe ọrụ gị zuru oke dị ka onye nkuzi enyere ikike na Henry Onyx Learn.",
  },
  stats: {
    activeEnrollments: "Ndebanye aha na-arụ ọrụ",
    completed: "Emechara",
    certificatesIssued: "Akwụkwọ ikike e nyere",
    coursesAuthored: "Nkuzi e dere",
  },
  courses: {
    sectionKicker: "Nkuzi m",
    sectionTitle: "Arụmọrụ nkuzi n’otu ntule",
    sectionBody:
      "Ahịrị ọ bụla na-egosi ndebanye aha ndị dị ndụ, mmecha, na echiche ndị mmụta. Pịa iji dezie usoro mmụta ma ọ bụ mepee ngwa nrụpụta ihe ọmụmụ.",
    emptyState: "E debughị nkuzi ọ bụla — malite nke mbụ site na Nkuzi.",
    enrolledLabel: "Ndị debanyere",
    completedLabel: "Emechara",
    certificatesLabel: "Akwụkwọ ikike",
    ratingLabel: "Ọkwa",
  },
};

const LEARN_INSTRUCTOR_COPY_YO: DeepPartial<LearnInstructorCopy> = {
  meta: {
    title: "Olùkọ́ — Henry Onyx Learn",
  },
  hero: {
    kicker: "Olùkọ́",
    title: "Ṣe àwọn ẹ̀kọ́, tọ́ ìṣẹ́ wò, kí o sì máa tẹ̀lé ìlọsíwájú àwọn akẹ́kọ̀ọ́ rẹ.",
    description:
      "Ṣe ètò ẹ̀kọ́, fi àwọn ẹ̀kọ́ àti ìdánwò ọ̀rọ̀-kúkurú kún un, ṣàyẹ̀wò ohun tí wọ́n fi sílẹ̀, kí o sì tẹ̀lé àwọn ìsanwó. Èyí ni àyè iṣẹ́ rẹ kíkún gẹ́gẹ́ bí olùkọ́ tó ní ìfọwọ́sí ní Henry Onyx Learn.",
  },
  stats: {
    activeEnrollments: "Àwọn ìforúkọsílẹ̀ tó ń ṣiṣẹ́",
    completed: "Tó ti parí",
    certificatesIssued: "Àwọn ẹ̀rí tí a tu jáde",
    coursesAuthored: "Àwọn ẹ̀kọ́ tí a ṣe",
  },
  courses: {
    sectionKicker: "Àwọn ẹ̀kọ́ mi",
    sectionTitle: "Iṣẹ́ àwọn ẹ̀kọ́ ní àkokò kúkurú",
    sectionBody:
      "Ìlà kọ̀ọ̀kan máa ń fi ìforúkọsílẹ̀ tó wà, ìpari àti ìmọ̀lára àwọn akẹ́kọ̀ọ́ hàn. Tẹ̀ láti ṣàtúnṣe ètò ẹ̀kọ́ tàbí ṣí ẹ̀rọ ìkọ́ ẹ̀kọ́.",
    emptyState: "Kò sí ẹ̀kọ́ tí a ṣe síbẹ̀ — bẹ̀rẹ̀ ọkan láti Ẹ̀kọ́.",
    enrolledLabel: "Àwọn tí a forúkọ sílẹ̀",
    completedLabel: "Tó ti parí",
    certificatesLabel: "Àwọn ẹ̀rí",
    ratingLabel: "Ìdíwọ̀n",
  },
};

const LEARN_INSTRUCTOR_COPY_HA: DeepPartial<LearnInstructorCopy> = {
  meta: {
    title: "Malami — Henry Onyx Learn",
  },
  hero: {
    kicker: "Malami",
    title: "Rubuta kwasa-kwasai, lissafa aikin, kuma ku kalli ci gaban ɗalibanku.",
    description:
      "Gina tsarin koyarwa, ƙara darussa da gwajen tambayoyi, dubi abubuwan da aka shigar, kuma bibiyi biyan kuɗi. Wannan ne cikakken wurin aikinku a matsayinku na malamin Henry Onyx Learn da aka ba wa izini.",
  },
  stats: {
    activeEnrollments: "Rajistar masu aiki",
    completed: "An gama",
    certificatesIssued: "Takaddun shaida da aka bayar",
    coursesAuthored: "Kwasa-kwasai da aka rubuta",
  },
  courses: {
    sectionKicker: "Kwasa-kwasai na",
    sectionTitle: "Aikin kwasa-kwasai a kallo guda",
    sectionBody:
      "Kowane layi yana nuna rajista mai aiki, kammalawa, da ra’ayin ɗalibai. Latsa don gyara tsarin koyarwa ko buɗe na’urar ƙirƙirar darussa.",
    emptyState: "Babu wani kwas da aka rubuta tukuna — fara ɗaya daga Kwasa-kwasai.",
    enrolledLabel: "Masu rajista",
    completedLabel: "An gama",
    certificatesLabel: "Takaddun shaida",
    ratingLabel: "Kima",
  },
};

const LEARN_INSTRUCTOR_LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<LearnInstructorCopy>>> = {
  fr: LEARN_INSTRUCTOR_COPY_FR,
  es: LEARN_INSTRUCTOR_COPY_ES,
  pt: LEARN_INSTRUCTOR_COPY_PT,
  ar: LEARN_INSTRUCTOR_COPY_AR,
  de: LEARN_INSTRUCTOR_COPY_DE,
  it: LEARN_INSTRUCTOR_COPY_IT,
  zh: LEARN_INSTRUCTOR_COPY_ZH,
  hi: LEARN_INSTRUCTOR_COPY_HI,
  ig: LEARN_INSTRUCTOR_COPY_IG,
  yo: LEARN_INSTRUCTOR_COPY_YO,
  ha: LEARN_INSTRUCTOR_COPY_HA,
};

export function getLearnInstructorCopy(locale: AppLocale): LearnInstructorCopy {
  const overrides = LEARN_INSTRUCTOR_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      LEARN_INSTRUCTOR_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as LearnInstructorCopy;
  }
  return LEARN_INSTRUCTOR_COPY_EN;
}

/** @internal */
export function __dangerouslyGetEnglishLearnInstructorCopy(): LearnInstructorCopy {
  return LEARN_INSTRUCTOR_COPY_EN;
}
