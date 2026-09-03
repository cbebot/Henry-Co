import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * LearnTrustCopy — i18n surface for the public Trust & safety page on the
 * Learn division (apps/learn/app/(public)/trust/page.tsx).
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each locale is
 * a Partial that deep-merges over EN so missing keys fall through to EN
 * silently. Mirrors the shape of `hub-public-copy.ts`.
 */
export type LearnTrustCopy = {
  meta: {
    title: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    body: string;
    ctaPrimary: string;
    ctaSecondary: string;
    asideRecordsLabel: string;
    asideRecordsValue: string;
    asideAccessLabel: string;
    asideAccessValue: string;
    asideCredentialsLabel: string;
    asideCredentialsValue: string;
  };
  pillars: {
    sectionEyebrow: string;
    enrollmentTitle: string;
    enrollmentBody: string;
    internalTitle: string;
    internalBody: string;
    certificatesTitle: string;
    certificatesBody: string;
  };
  footer: {
    eyebrow: string;
    title: string;
    body: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
};

const LEARN_TRUST_COPY_EN: LearnTrustCopy = {
  meta: {
    title: "Trust - Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Trust & safety",
    title: "Learning records you can rely on.",
    body:
      "Enrollments, progress, quizzes, and certificates are recorded and enforced by Henry Onyx — not something a browser can fake. Internal courses stay restricted to the right people; certificates carry a verification code anyone can check.",
    ctaPrimary: "Browse the catalog",
    ctaSecondary: "Verify a certificate",
    asideRecordsLabel: "Records",
    asideRecordsValue: "Authoritative and tamper-resistant",
    asideAccessLabel: "Access control",
    asideAccessValue: "Scoped to who a course is for",
    asideCredentialsLabel: "Credentials",
    asideCredentialsValue: "Downloadable + publicly verifiable",
  },
  pillars: {
    sectionEyebrow: "Three operating standards",
    enrollmentTitle: "Enrollment & access",
    enrollmentBody:
      "Starting a course, paying where required, and unlocking lessons happen through secure workflows, and completion is verified against your actual progress — not self-declared.",
    internalTitle: "Internal & assigned training",
    internalBody:
      "Some programs are visible only to invited staff or partners. Those restrictions are enforced the same way as the rest of the academy, every time access is checked.",
    certificatesTitle: "Certificates & verification",
    certificatesBody:
      "When you earn a credential, we issue a record you can download and a code third parties can check. That’s the difference between decoration and proof.",
  },
  footer: {
    eyebrow: "Where to next",
    title: "Verify a credential, or start a program built to be checkable.",
    body:
      "Anyone can verify a Henry Onyx certificate from its code — no account required. Learners get the same standard of proof whether the program is public, assigned, or partner-only.",
    ctaPrimary: "Verify a certificate",
    ctaSecondary: "Certificate programs",
  },
};

const LEARN_TRUST_COPY_FR: DeepPartial<LearnTrustCopy> = {
  meta: {
    title: "Confiance — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Confiance et sécurité",
    title: "Des dossiers d’apprentissage sur lesquels vous pouvez compter.",
    body:
      "Inscriptions, progression, quiz et certificats sont enregistrés et garantis par Henry Onyx — impossible à falsifier depuis un navigateur. Les cours internes restent réservés aux bonnes personnes ; les certificats portent un code de vérification que chacun peut contrôler.",
    ctaPrimary: "Parcourir le catalogue",
    ctaSecondary: "Vérifier un certificat",
    asideRecordsLabel: "Dossiers",
    asideRecordsValue: "Fiables et infalsifiables",
    asideAccessLabel: "Contrôle d’accès",
    asideAccessValue: "Limité au public visé par chaque cours",
    asideCredentialsLabel: "Justificatifs",
    asideCredentialsValue: "Téléchargeables et vérifiables publiquement",
  },
  pillars: {
    sectionEyebrow: "Trois standards d’exploitation",
    enrollmentTitle: "Inscription et accès",
    enrollmentBody:
      "Commencer un cours, payer lorsque nécessaire et débloquer les leçons s’effectuent via des flux sécurisés, et l’achèvement est vérifié d’après votre progression réelle — jamais sur simple déclaration.",
    internalTitle: "Formations internes et assignées",
    internalBody:
      "Certains programmes ne sont visibles que pour des collaborateurs ou partenaires invités. Ces restrictions sont appliquées de la même manière que le reste de l’académie, à chaque vérification d’accès.",
    certificatesTitle: "Certificats et vérification",
    certificatesBody:
      "Lorsque vous obtenez un titre, nous émettons un dossier téléchargeable et un code que des tiers peuvent vérifier. C’est la différence entre une décoration et une preuve.",
  },
  footer: {
    eyebrow: "Et maintenant",
    title: "Vérifiez un titre, ou démarrez un programme conçu pour être contrôlable.",
    body:
      "Tout le monde peut vérifier un certificat Henry Onyx à partir de son code — sans compte requis. Les apprenants bénéficient du même niveau de preuve, que le programme soit public, assigné ou réservé à un partenaire.",
    ctaPrimary: "Vérifier un certificat",
    ctaSecondary: "Programmes certifiants",
  },
};

const LEARN_TRUST_COPY_ES: DeepPartial<LearnTrustCopy> = {
  meta: {
    title: "Confianza — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Confianza y seguridad",
    title: "Registros de aprendizaje en los que puedes confiar.",
    body:
      "Las inscripciones, el progreso, los cuestionarios y los certificados los registra y garantiza Henry Onyx, no algo que un navegador pueda falsear. Los cursos internos quedan reservados a las personas indicadas; los certificados llevan un código de verificación que cualquiera puede comprobar.",
    ctaPrimary: "Explorar el catálogo",
    ctaSecondary: "Verificar un certificado",
    asideRecordsLabel: "Registros",
    asideRecordsValue: "Fiables y a prueba de manipulaciones",
    asideAccessLabel: "Control de acceso",
    asideAccessValue: "Limitado a quién va dirigido cada curso",
    asideCredentialsLabel: "Credenciales",
    asideCredentialsValue: "Descargables y verificables públicamente",
  },
  pillars: {
    sectionEyebrow: "Tres estándares operativos",
    enrollmentTitle: "Inscripción y acceso",
    enrollmentBody:
      "Iniciar un curso, pagar cuando corresponda y desbloquear lecciones ocurren mediante flujos seguros, y la finalización se verifica según tu progreso real, no por lo que declares.",
    internalTitle: "Formación interna y asignada",
    internalBody:
      "Algunos programas son visibles solo para personal o socios invitados. Esas restricciones se aplican igual que en el resto de la academia, cada vez que se comprueba el acceso.",
    certificatesTitle: "Certificados y verificación",
    certificatesBody:
      "Cuando obtienes una credencial, emitimos un registro descargable y un código que terceros pueden comprobar. Esa es la diferencia entre adorno y prueba.",
  },
  footer: {
    eyebrow: "Próximos pasos",
    title: "Verifica una credencial o comienza un programa pensado para ser comprobable.",
    body:
      "Cualquiera puede verificar un certificado de Henry Onyx a partir de su código, sin necesidad de cuenta. Los alumnos reciben el mismo nivel de prueba, sea el programa público, asignado o exclusivo de un socio.",
    ctaPrimary: "Verificar un certificado",
    ctaSecondary: "Programas certificados",
  },
};

const LEARN_TRUST_COPY_PT: DeepPartial<LearnTrustCopy> = {
  meta: {
    title: "Confiança — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Confiança e segurança",
    title: "Registos de aprendizagem em que pode confiar.",
    body:
      "Inscrições, progresso, questionários e certificados são registados e garantidos pela Henry Onyx — não algo que um navegador possa falsificar. Os cursos internos ficam restritos às pessoas certas; os certificados trazem um código de verificação que qualquer pessoa pode conferir.",
    ctaPrimary: "Explorar o catálogo",
    ctaSecondary: "Verificar um certificado",
    asideRecordsLabel: "Registos",
    asideRecordsValue: "Fiáveis e resistentes a adulteração",
    asideAccessLabel: "Controlo de acesso",
    asideAccessValue: "Limitado a quem se destina cada curso",
    asideCredentialsLabel: "Credenciais",
    asideCredentialsValue: "Descarregáveis e verificáveis publicamente",
  },
  pillars: {
    sectionEyebrow: "Três padrões operacionais",
    enrollmentTitle: "Inscrição e acesso",
    enrollmentBody:
      "Iniciar um curso, pagar quando necessário e desbloquear lições acontece através de fluxos seguros, e a conclusão é verificada com base no seu progresso real — não por autodeclaração.",
    internalTitle: "Formação interna e atribuída",
    internalBody:
      "Alguns programas só são visíveis para colaboradores ou parceiros convidados. Essas restrições são aplicadas tal como no resto da academia, sempre que o acesso é verificado.",
    certificatesTitle: "Certificados e verificação",
    certificatesBody:
      "Quando conquista uma credencial, emitimos um registo descarregável e um código que terceiros podem verificar. É a diferença entre decoração e prova.",
  },
  footer: {
    eyebrow: "Próximos passos",
    title: "Verifique uma credencial ou comece um programa feito para ser comprovado.",
    body:
      "Qualquer pessoa pode verificar um certificado Henry Onyx a partir do seu código — sem precisar de conta. Os alunos recebem o mesmo padrão de prova, seja o programa público, atribuído ou exclusivo de parceiro.",
    ctaPrimary: "Verificar um certificado",
    ctaSecondary: "Programas com certificado",
  },
};

const LEARN_TRUST_COPY_AR: DeepPartial<LearnTrustCopy> = {
  meta: {
    title: "الثقة — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "الثقة والأمان",
    title: "سجلّات تعلُّم يمكنك الاعتماد عليها.",
    body:
      "تُسجَّل التسجيلات والتقدّم والاختبارات والشهادات وتُنفَّذ من قبل Henry Onyx — وليست شيئًا يمكن للمتصفّح تزييفه. تظل الدورات الداخلية مقتصرة على الأشخاص المناسبين، وتحمل الشهادات رمز تحقّق يستطيع أيّ شخص فحصه.",
    ctaPrimary: "تصفُّح الكتالوج",
    ctaSecondary: "التحقُّق من شهادة",
    asideRecordsLabel: "السجلّات",
    asideRecordsValue: "موثوقة وعصيّة على العبث",
    asideAccessLabel: "التحكم بالوصول",
    asideAccessValue: "محصورة بمن تستهدفه الدورة",
    asideCredentialsLabel: "الشهادات",
    asideCredentialsValue: "قابلة للتنزيل والتحقُّق العلني",
  },
  pillars: {
    sectionEyebrow: "ثلاثة معايير تشغيلية",
    enrollmentTitle: "التسجيل والوصول",
    enrollmentBody:
      "يبدأ الالتحاق بالدورة والدفع عند اللزوم وفتح الدروس عبر مسارات آمنة، ويُتحقَّق من الإكمال استنادًا إلى تقدّمك الفعلي — لا بمجرّد الإقرار الذاتي.",
    internalTitle: "التدريب الداخلي والمُكلَّف",
    internalBody:
      "بعض البرامج تظهر فقط للموظفين أو الشركاء المدعوّين. تُطبَّق تلك القيود بنفس طريقة بقية الأكاديمية، في كل مرة يُفحَص فيها الوصول.",
    certificatesTitle: "الشهادات والتحقُّق",
    certificatesBody:
      "عندما تنال شهادة، نُصدر لك سجلًّا قابلاً للتنزيل ورمزًا يستطيع الغير التحقُّق منه. ذلك هو الفرق بين الزينة والدليل.",
  },
  footer: {
    eyebrow: "إلى أين بعد",
    title: "تحقَّق من شهادة، أو ابدأ برنامجًا مصمَّمًا ليكون قابلاً للتحقّق.",
    body:
      "بإمكان أيّ شخص التحقُّق من شهادة Henry Onyx عبر رمزها — دون الحاجة إلى حساب. ينال المتعلّمون المستوى نفسه من البرهان سواء كان البرنامج عامًّا أو مُكلَّفًا أو محصورًا بشركاء.",
    ctaPrimary: "التحقُّق من شهادة",
    ctaSecondary: "برامج الشهادات",
  },
};

const LEARN_TRUST_COPY_DE: DeepPartial<LearnTrustCopy> = {
  meta: {
    title: "Vertrauen — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Vertrauen & Sicherheit",
    title: "Lernnachweise, auf die Sie sich verlassen können.",
    body:
      "Anmeldungen, Fortschritt, Quizze und Zertifikate werden von Henry Onyx erfasst und durchgesetzt — nichts, was ein Browser fälschen kann. Interne Kurse bleiben den richtigen Personen vorbehalten; Zertifikate enthalten einen Verifizierungscode, den jeder prüfen kann.",
    ctaPrimary: "Katalog durchsuchen",
    ctaSecondary: "Zertifikat verifizieren",
    asideRecordsLabel: "Nachweise",
    asideRecordsValue: "Verlässlich und manipulationssicher",
    asideAccessLabel: "Zugriffskontrolle",
    asideAccessValue: "Beschränkt auf die Zielgruppe des Kurses",
    asideCredentialsLabel: "Qualifikationen",
    asideCredentialsValue: "Herunterladbar und öffentlich prüfbar",
  },
  pillars: {
    sectionEyebrow: "Drei operative Standards",
    enrollmentTitle: "Anmeldung & Zugang",
    enrollmentBody:
      "Kursstart, Zahlung dort, wo erforderlich, und das Freischalten von Lektionen erfolgen über sichere Abläufe, und der Abschluss wird anhand Ihres tatsächlichen Fortschritts überprüft — nicht nach eigener Angabe.",
    internalTitle: "Interne und zugewiesene Schulungen",
    internalBody:
      "Manche Programme sind nur für eingeladene Mitarbeitende oder Partner sichtbar. Diese Beschränkungen werden genauso durchgesetzt wie im Rest der Akademie, bei jeder Zugriffsprüfung.",
    certificatesTitle: "Zertifikate & Verifizierung",
    certificatesBody:
      "Sobald Sie einen Nachweis erwerben, stellen wir einen herunterladbaren Datensatz und einen Code aus, den Dritte überprüfen können. Das ist der Unterschied zwischen Dekoration und Beweis.",
  },
  footer: {
    eyebrow: "Wie geht es weiter",
    title: "Verifizieren Sie einen Nachweis oder starten Sie ein Programm, das geprüft werden kann.",
    body:
      "Jede Person kann ein Henry Onyx-Zertifikat über seinen Code verifizieren — ganz ohne Konto. Lernende erhalten denselben Beweisstandard, ob das Programm öffentlich, zugewiesen oder partnerexklusiv ist.",
    ctaPrimary: "Zertifikat verifizieren",
    ctaSecondary: "Zertifikatsprogramme",
  },
};

const LEARN_TRUST_COPY_IT: DeepPartial<LearnTrustCopy> = {
  meta: {
    title: "Affidabilità — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Affidabilità e sicurezza",
    title: "Registri di apprendimento su cui puoi contare.",
    body:
      "Iscrizioni, avanzamento, quiz e certificati vengono registrati e garantiti da Henry Onyx — non qualcosa che un browser possa falsificare. I corsi interni restano riservati alle persone giuste; i certificati portano un codice di verifica che chiunque può controllare.",
    ctaPrimary: "Esplora il catalogo",
    ctaSecondary: "Verifica un certificato",
    asideRecordsLabel: "Registri",
    asideRecordsValue: "Affidabili e a prova di manomissione",
    asideAccessLabel: "Controllo degli accessi",
    asideAccessValue: "Limitato a chi è destinato ogni corso",
    asideCredentialsLabel: "Credenziali",
    asideCredentialsValue: "Scaricabili e verificabili pubblicamente",
  },
  pillars: {
    sectionEyebrow: "Tre standard operativi",
    enrollmentTitle: "Iscrizione e accesso",
    enrollmentBody:
      "Avviare un corso, pagare quando previsto e sbloccare le lezioni avviene tramite flussi sicuri, e il completamento viene verificato in base ai tuoi progressi reali — non su tua dichiarazione.",
    internalTitle: "Formazione interna e assegnata",
    internalBody:
      "Alcuni programmi sono visibili solo a personale o partner invitati. Quelle restrizioni vengono applicate allo stesso modo del resto dell’accademia, a ogni verifica dell’accesso.",
    certificatesTitle: "Certificati e verifica",
    certificatesBody:
      "Quando ottieni una credenziale, emettiamo un registro scaricabile e un codice che terzi possono controllare. È la differenza tra un addobbo e una prova.",
  },
  footer: {
    eyebrow: "Dove andare ora",
    title: "Verifica una credenziale o avvia un programma pensato per essere verificabile.",
    body:
      "Chiunque può verificare un certificato Henry Onyx dal suo codice — senza bisogno di un account. Gli studenti ricevono lo stesso livello di prova, che il programma sia pubblico, assegnato o riservato ai partner.",
    ctaPrimary: "Verifica un certificato",
    ctaSecondary: "Programmi con certificato",
  },
};

const LEARN_TRUST_COPY_ZH: DeepPartial<LearnTrustCopy> = {
  meta: {
    title: "信任 — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "信任与安全",
    title: "可以信赖的学习记录。",
    body:
      "报名、进度、测验与证书均由 Henry Onyx 记录并强制执行，浏览器无法伪造。内部课程仅对应有权限的人员开放；证书自带验证码,任何人都能核查。",
    ctaPrimary: "浏览课程目录",
    ctaSecondary: "验证证书",
    asideRecordsLabel: "记录",
    asideRecordsValue: "可信且防篡改",
    asideAccessLabel: "访问控制",
    asideAccessValue: "限定于课程面向的对象",
    asideCredentialsLabel: "凭证",
    asideCredentialsValue: "可下载且可公开验证",
  },
  pillars: {
    sectionEyebrow: "三项运营标准",
    enrollmentTitle: "报名与访问",
    enrollmentBody:
      "开始课程、按需付费以及解锁课时,都通过安全的流程完成,完成情况会依据你的实际进度核实,而非自行申报。",
    internalTitle: "内部与指派培训",
    internalBody:
      "部分项目仅对受邀员工或合作伙伴可见。这些限制与学院其他课程一样被严格执行,每次访问都会核查。",
    certificatesTitle: "证书与验证",
    certificatesBody:
      "当你获得资质时,我们会签发可下载的记录与一个第三方可以核验的代码。这就是装饰与凭证之间的区别。",
  },
  footer: {
    eyebrow: "接下来",
    title: "验证一项资质,或开启一个生而可被核查的项目。",
    body:
      "任何人都能通过 Henry Onyx 证书的代码进行验证 — 无需注册账号。无论项目是公开、指派还是合作方专属,学习者都享有同等水平的可证明性。",
    ctaPrimary: "验证证书",
    ctaSecondary: "证书项目",
  },
};

const LEARN_TRUST_COPY_HI: DeepPartial<LearnTrustCopy> = {
  meta: {
    title: "विश्वास — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "विश्वास और सुरक्षा",
    title: "ऐसे अध्ययन रिकॉर्ड जिन पर भरोसा किया जा सके।",
    body:
      "नामांकन, प्रगति, क्विज़ और प्रमाणपत्र Henry Onyx द्वारा दर्ज और लागू किए जाते हैं — ऐसा कुछ नहीं जिसे ब्राउज़र नकली बना सके। आंतरिक कोर्स केवल सही लोगों तक सीमित रहते हैं; प्रमाणपत्रों पर सत्यापन कोड होता है जिसे कोई भी जाँच सकता है।",
    ctaPrimary: "कैटलॉग देखें",
    ctaSecondary: "प्रमाणपत्र सत्यापित करें",
    asideRecordsLabel: "रिकॉर्ड",
    asideRecordsValue: "भरोसेमंद और छेड़छाड़-रोधी",
    asideAccessLabel: "एक्सेस नियंत्रण",
    asideAccessValue: "कोर्स जिनके लिए है, उन्हीं तक सीमित",
    asideCredentialsLabel: "क्रेडेंशियल",
    asideCredentialsValue: "डाउनलोड के योग्य व सार्वजनिक रूप से सत्यापन योग्य",
  },
  pillars: {
    sectionEyebrow: "तीन परिचालन मानक",
    enrollmentTitle: "नामांकन और पहुँच",
    enrollmentBody:
      "कोर्स शुरू करना, जहाँ आवश्यक हो वहाँ भुगतान करना और पाठ खोलना — सब सुरक्षित प्रक्रियाओं से होता है, और पूर्णता आपकी वास्तविक प्रगति के आधार पर सत्यापित होती है, न कि स्वयं-घोषित।",
    internalTitle: "आंतरिक और सौंपा गया प्रशिक्षण",
    internalBody:
      "कुछ कार्यक्रम केवल आमंत्रित स्टाफ़ या साझेदारों को दिखते हैं। ये प्रतिबंध वैसे ही लागू होते हैं जैसे बाकी अकादमी में, हर बार जब एक्सेस की जाँच होती है।",
    certificatesTitle: "प्रमाणपत्र और सत्यापन",
    certificatesBody:
      "जब आप कोई क्रेडेंशियल अर्जित करते हैं, हम डाउनलोड योग्य रिकॉर्ड और एक कोड जारी करते हैं जिसे तीसरा पक्ष जाँच सकता है। यही सजावट और प्रमाण के बीच का अंतर है।",
  },
  footer: {
    eyebrow: "आगे क्या",
    title: "एक क्रेडेंशियल सत्यापित करें, या जाँच के लिए बना कार्यक्रम शुरू करें।",
    body:
      "कोई भी Henry Onyx प्रमाणपत्र को उसके कोड से सत्यापित कर सकता है — खाते की ज़रूरत नहीं। शिक्षार्थियों को वही प्रमाण-स्तर मिलता है, चाहे कार्यक्रम सार्वजनिक हो, सौंपा गया हो या केवल साझेदार के लिए हो।",
    ctaPrimary: "प्रमाणपत्र सत्यापित करें",
    ctaSecondary: "प्रमाणपत्र कार्यक्रम",
  },
};

const LEARN_TRUST_COPY_IG: DeepPartial<LearnTrustCopy> = {
  meta: {
    title: "Ntụkwasị obi — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Ntụkwasị obi na nchekwa",
    title: "Akwụkwọ mmụta ị nwere ike ịdabere na ya.",
    body:
      "Enrollments, progress, quizzes, and certificates are recorded and enforced by Henry Onyx — not something a browser can fake. Internal courses stay restricted to the right people; certificates carry a verification code anyone can check.",
    ctaPrimary: "Nyochaa katalọgụ",
    ctaSecondary: "Nyochaa akwụkwọ ikike",
    asideRecordsLabel: "Akwụkwọ ndekọ",
    asideRecordsValue: "Authoritative and tamper-resistant",
    asideAccessLabel: "Njikwa nnweta",
    asideAccessValue: "Scoped to who a course is for",
    asideCredentialsLabel: "Ihe akaebe",
    asideCredentialsValue: "Enwere ike ibudata yana inyochara ya n’ihu ọha",
  },
  pillars: {
    sectionEyebrow: "Ụkpụrụ ọrụ atọ",
    enrollmentTitle: "Ndebanye aha na nnweta",
    enrollmentBody:
      "Starting a course, paying where required, and unlocking lessons happen through secure workflows, and completion is verified against your actual progress — not self-declared.",
    internalTitle: "Ọzụzụ ime ụlọ na nke e kenyere",
    internalBody:
      "Some programs are visible only to invited staff or partners. Those restrictions are enforced the same way as the rest of the academy, every time access is checked.",
    certificatesTitle: "Akwụkwọ ikike na nyocha",
    certificatesBody:
      "Mgbe ị nwetara akwụkwọ ikike, anyị na-enye gị ndekọ ị nwere ike ibudata yana koodu ndị ọzọ nwere ike ileba anya. Nke ahụ bụ ọdịiche dị n’etiti ihe ịchọ mma na ihe akaebe.",
  },
  footer: {
    eyebrow: "Ebe ọzọ",
    title: "Nyochaa ihe akaebe, ma ọ bụ malite mmemme e mere ka enwee ike inyocha ya.",
    body:
      "Onye ọ bụla nwere ike nyochaa akwụkwọ ikike Henry Onyx site na koodu ya — achọghị akaụntụ. Ndị mmụta na-enweta otu ụkpụrụ ihe akaebe ma mmemme ọ bụ ọha, e kenyere ya, ma ọ bụ naanị maka onye mmekọ.",
    ctaPrimary: "Nyochaa akwụkwọ ikike",
    ctaSecondary: "Mmemme akwụkwọ ikike",
  },
};

const LEARN_TRUST_COPY_YO: DeepPartial<LearnTrustCopy> = {
  meta: {
    title: "Ìgbẹ́kẹ̀lé — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Ìgbẹ́kẹ̀lé àti ààbò",
    title: "Àwọn àkọsílẹ̀ ìkẹ́kọ̀ọ́ tó ṣeé gbẹ́kẹ̀lé.",
    body:
      "Enrollments, progress, quizzes, and certificates are recorded and enforced by Henry Onyx — not something a browser can fake. Internal courses stay restricted to the right people; certificates carry a verification code anyone can check.",
    ctaPrimary: "Yẹ àkójọpọ̀ ẹ̀kọ́",
    ctaSecondary: "Ṣàyẹ̀wò ẹ̀rí",
    asideRecordsLabel: "Àkọsílẹ̀",
    asideRecordsValue: "Authoritative and tamper-resistant",
    asideAccessLabel: "Ìkáwọ́ ìwọlé",
    asideAccessValue: "Scoped to who a course is for",
    asideCredentialsLabel: "Àwọn ẹ̀rí ìmọ̀",
    asideCredentialsValue: "Ó ṣeé gba sílẹ̀, ó sì ṣeé yẹ̀wò ní gbangba",
  },
  pillars: {
    sectionEyebrow: "Òfin iṣẹ́ mẹ́ta",
    enrollmentTitle: "Ìforúkọsílẹ̀ àti ìwọlé",
    enrollmentBody:
      "Starting a course, paying where required, and unlocking lessons happen through secure workflows, and completion is verified against your actual progress — not self-declared.",
    internalTitle: "Ìkọ́ni inú ilé àti tí a yàn",
    internalBody:
      "Some programs are visible only to invited staff or partners. Those restrictions are enforced the same way as the rest of the academy, every time access is checked.",
    certificatesTitle: "Ẹ̀rí àti ìmúlò",
    certificatesBody:
      "Nígbà tí o bá gba ẹ̀rí, a fún ọ ní àkọsílẹ̀ tó ṣeé gba sílẹ̀ àti kóòdù tí ẹlòmíràn lè yẹ̀wò. Ìyẹn ni iyàtọ̀ láàrín ọ̀ṣọ́ àti ẹ̀rí gidi.",
  },
  footer: {
    eyebrow: "Ibo lẹhìnnà",
    title: "Yẹ ẹ̀rí kan wò, tàbí bẹ̀rẹ̀ ètò tí a kọ́ kí ó ṣeé yẹ̀wò.",
    body:
      "Ẹnikẹ́ni lè yẹ ẹ̀rí Henry Onyx láti inú kóòdù rẹ̀ — láìjẹ́ pé akáyángá nilò. Àwọn akẹ́kọ̀ọ́ ń gba ìpele ẹ̀rí kan náà, bóyá ètò náà jẹ́ ti gbogbogbò, tí a yàn, tàbí ti alábàákẹ́gbẹ́.",
    ctaPrimary: "Ṣàyẹ̀wò ẹ̀rí",
    ctaSecondary: "Àwọn ètò ẹ̀rí",
  },
};

const LEARN_TRUST_COPY_HA: DeepPartial<LearnTrustCopy> = {
  meta: {
    title: "Aminci — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Aminci da tsaro",
    title: "Bayanan koyo da za ku iya dogara da su.",
    body:
      "Enrollments, progress, quizzes, and certificates are recorded and enforced by Henry Onyx — not something a browser can fake. Internal courses stay restricted to the right people; certificates carry a verification code anyone can check.",
    ctaPrimary: "Duba katalogi",
    ctaSecondary: "Tabbatar da takaddar shaida",
    asideRecordsLabel: "Bayanai",
    asideRecordsValue: "Authoritative and tamper-resistant",
    asideAccessLabel: "Sarrafa shiga",
    asideAccessValue: "Scoped to who a course is for",
    asideCredentialsLabel: "Takaddun ƙwarewa",
    asideCredentialsValue: "Za a iya saukar da su kuma a tabbatar da su a fili",
  },
  pillars: {
    sectionEyebrow: "Ma’auni uku na aiki",
    enrollmentTitle: "Rajista da shiga",
    enrollmentBody:
      "Starting a course, paying where required, and unlocking lessons happen through secure workflows, and completion is verified against your actual progress — not self-declared.",
    internalTitle: "Horarwar cikin gida da ta aiki",
    internalBody:
      "Some programs are visible only to invited staff or partners. Those restrictions are enforced the same way as the rest of the academy, every time access is checked.",
    certificatesTitle: "Takaddun shaida da tabbatarwa",
    certificatesBody:
      "Lokacin da kuka samu takarda, muna ba ku bayanin da za a iya saukewa da lamba wadda waɗanda ba sa cikin tsarin za su iya bincika. Wannan ne bambanci tsakanin ado da hujja.",
  },
  footer: {
    eyebrow: "Inda za a tafi gaba",
    title: "Tabbatar da takarda, ko fara shirin da aka tsara don a iya duba shi.",
    body:
      "Duk wani mutum zai iya tabbatar da takaddar shaida ta Henry Onyx daga lambar ta — ba a buƙatar asusu. Ɗaliban suna samun ma’aunin hujja iri ɗaya, ko shirin jama’a ne, ko aiki ne, ko na abokan haɗin gwiwa ne kawai.",
    ctaPrimary: "Tabbatar da takarda",
    ctaSecondary: "Shirye-shiryen takaddun shaida",
  },
};

const LEARN_TRUST_LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<LearnTrustCopy>>> = {
  fr: LEARN_TRUST_COPY_FR,
  es: LEARN_TRUST_COPY_ES,
  pt: LEARN_TRUST_COPY_PT,
  ar: LEARN_TRUST_COPY_AR,
  de: LEARN_TRUST_COPY_DE,
  it: LEARN_TRUST_COPY_IT,
  zh: LEARN_TRUST_COPY_ZH,
  hi: LEARN_TRUST_COPY_HI,
  ig: LEARN_TRUST_COPY_IG,
  yo: LEARN_TRUST_COPY_YO,
  ha: LEARN_TRUST_COPY_HA,
};

export function getLearnTrustCopy(locale: AppLocale): LearnTrustCopy {
  const overrides = LEARN_TRUST_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      LEARN_TRUST_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as LearnTrustCopy;
  }
  return LEARN_TRUST_COPY_EN;
}

/** @internal */
export function __dangerouslyGetEnglishLearnTrustCopy(): LearnTrustCopy {
  return LEARN_TRUST_COPY_EN;
}
