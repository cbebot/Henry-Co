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
      "Enrollments, progress, quizzes, and certificates are handled on the server — not hidden in a browser. Internal courses stay restricted to the right people; certificates carry a verification code anyone can check.",
    ctaPrimary: "Browse the catalog",
    ctaSecondary: "Verify a certificate",
    asideRecordsLabel: "Records",
    asideRecordsValue: "Server-side, not browser-side",
    asideAccessLabel: "Access control",
    asideAccessValue: "Public · staff · partners",
    asideCredentialsLabel: "Credentials",
    asideCredentialsValue: "Downloadable + publicly verifiable",
  },
  pillars: {
    sectionEyebrow: "Three operating standards",
    enrollmentTitle: "Enrollment & access",
    enrollmentBody:
      "Starting a course, paying where required, and unlocking lessons happen through secure workflows. You can’t “fake” completion from the client side.",
    internalTitle: "Internal & assigned training",
    internalBody:
      "Some programs are visible only to invited staff or partners. Those rules are enforced the same way as the rest of the academy — not by hoping people stay on the right URL.",
    certificatesTitle: "Certificates & verification",
    certificatesBody:
      "When you earn a credential, we issue a record you can download and a code third parties can check. That’s the difference between decoration and proof.",
  },
  footer: {
    eyebrow: "Where to next",
    title: "Verify a credential, or start a program built to be checkable.",
    body:
      "Anyone can verify a HenryCo certificate from its code — no account required. Learners get the same standard of proof whether the program is public, assigned, or partner-only.",
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
      "Inscriptions, progression, quiz et certificats sont gérés côté serveur — pas dissimulés dans un navigateur. Les cours internes restent réservés aux bonnes personnes ; les certificats portent un code de vérification que chacun peut contrôler.",
    ctaPrimary: "Parcourir le catalogue",
    ctaSecondary: "Vérifier un certificat",
    asideRecordsLabel: "Dossiers",
    asideRecordsValue: "Côté serveur, jamais côté navigateur",
    asideAccessLabel: "Contrôle d’accès",
    asideAccessValue: "Public · personnel · partenaires",
    asideCredentialsLabel: "Justificatifs",
    asideCredentialsValue: "Téléchargeables et vérifiables publiquement",
  },
  pillars: {
    sectionEyebrow: "Trois standards d’exploitation",
    enrollmentTitle: "Inscription et accès",
    enrollmentBody:
      "Commencer un cours, payer lorsque nécessaire et débloquer les leçons s’effectuent via des flux sécurisés. Impossible de « simuler » une validation côté client.",
    internalTitle: "Formations internes et assignées",
    internalBody:
      "Certains programmes ne sont visibles que pour des collaborateurs ou partenaires invités. Ces règles sont appliquées de la même manière que le reste de l’académie — pas en espérant que chacun reste sur la bonne URL.",
    certificatesTitle: "Certificats et vérification",
    certificatesBody:
      "Lorsque vous obtenez un titre, nous émettons un dossier téléchargeable et un code que des tiers peuvent vérifier. C’est la différence entre une décoration et une preuve.",
  },
  footer: {
    eyebrow: "Et maintenant",
    title: "Vérifiez un titre, ou démarrez un programme conçu pour être contrôlable.",
    body:
      "Tout le monde peut vérifier un certificat HenryCo à partir de son code — sans compte requis. Les apprenants bénéficient du même niveau de preuve, que le programme soit public, assigné ou réservé à un partenaire.",
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
      "Las inscripciones, el progreso, los cuestionarios y los certificados se gestionan en el servidor, no escondidos en un navegador. Los cursos internos quedan reservados a las personas indicadas; los certificados llevan un código de verificación que cualquiera puede comprobar.",
    ctaPrimary: "Explorar el catálogo",
    ctaSecondary: "Verificar un certificado",
    asideRecordsLabel: "Registros",
    asideRecordsValue: "En el servidor, no en el navegador",
    asideAccessLabel: "Control de acceso",
    asideAccessValue: "Público · personal · socios",
    asideCredentialsLabel: "Credenciales",
    asideCredentialsValue: "Descargables y verificables públicamente",
  },
  pillars: {
    sectionEyebrow: "Tres estándares operativos",
    enrollmentTitle: "Inscripción y acceso",
    enrollmentBody:
      "Iniciar un curso, pagar cuando corresponda y desbloquear lecciones ocurren mediante flujos seguros. No se puede «fingir» la finalización desde el cliente.",
    internalTitle: "Formación interna y asignada",
    internalBody:
      "Algunos programas son visibles solo para personal o socios invitados. Esas reglas se aplican igual que en el resto de la academia, no confiando en que cada uno se quede en la URL correcta.",
    certificatesTitle: "Certificados y verificación",
    certificatesBody:
      "Cuando obtienes una credencial, emitimos un registro descargable y un código que terceros pueden comprobar. Esa es la diferencia entre adorno y prueba.",
  },
  footer: {
    eyebrow: "Próximos pasos",
    title: "Verifica una credencial o comienza un programa pensado para ser comprobable.",
    body:
      "Cualquiera puede verificar un certificado de HenryCo a partir de su código, sin necesidad de cuenta. Los alumnos reciben el mismo nivel de prueba, sea el programa público, asignado o exclusivo de un socio.",
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
      "Inscrições, progresso, questionários e certificados são processados no servidor — não escondidos num navegador. Os cursos internos ficam restritos às pessoas certas; os certificados trazem um código de verificação que qualquer pessoa pode conferir.",
    ctaPrimary: "Explorar o catálogo",
    ctaSecondary: "Verificar um certificado",
    asideRecordsLabel: "Registos",
    asideRecordsValue: "No servidor, não no navegador",
    asideAccessLabel: "Controlo de acesso",
    asideAccessValue: "Público · equipa · parceiros",
    asideCredentialsLabel: "Credenciais",
    asideCredentialsValue: "Descarregáveis e verificáveis publicamente",
  },
  pillars: {
    sectionEyebrow: "Três padrões operacionais",
    enrollmentTitle: "Inscrição e acesso",
    enrollmentBody:
      "Iniciar um curso, pagar quando necessário e desbloquear lições acontece através de fluxos seguros. Não dá para «fingir» conclusão a partir do navegador.",
    internalTitle: "Formação interna e atribuída",
    internalBody:
      "Alguns programas só são visíveis para colaboradores ou parceiros convidados. Essas regras são aplicadas tal como no resto da academia — não na esperança de que cada um permaneça no URL correto.",
    certificatesTitle: "Certificados e verificação",
    certificatesBody:
      "Quando conquista uma credencial, emitimos um registo descarregável e um código que terceiros podem verificar. É a diferença entre decoração e prova.",
  },
  footer: {
    eyebrow: "Próximos passos",
    title: "Verifique uma credencial ou comece um programa feito para ser comprovado.",
    body:
      "Qualquer pessoa pode verificar um certificado HenryCo a partir do seu código — sem precisar de conta. Os alunos recebem o mesmo padrão de prova, seja o programa público, atribuído ou exclusivo de parceiro.",
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
      "تُدار التسجيلات والتقدّم والاختبارات والشهادات على الخادم — لا تختبئ داخل المتصفّح. تظل الدورات الداخلية مقتصرة على الأشخاص المناسبين، وتحمل الشهادات رمز تحقّق يستطيع أيّ شخص فحصه.",
    ctaPrimary: "تصفُّح الكتالوج",
    ctaSecondary: "التحقُّق من شهادة",
    asideRecordsLabel: "السجلّات",
    asideRecordsValue: "على الخادم لا في المتصفّح",
    asideAccessLabel: "التحكم بالوصول",
    asideAccessValue: "عامّ · موظفون · شركاء",
    asideCredentialsLabel: "الشهادات",
    asideCredentialsValue: "قابلة للتنزيل والتحقُّق العلني",
  },
  pillars: {
    sectionEyebrow: "ثلاثة معايير تشغيلية",
    enrollmentTitle: "التسجيل والوصول",
    enrollmentBody:
      "يبدأ الالتحاق بالدورة والدفع عند اللزوم وفتح الدروس عبر مسارات آمنة. لا يمكن «ادّعاء» الإكمال من جهة المتصفّح.",
    internalTitle: "التدريب الداخلي والمُكلَّف",
    internalBody:
      "بعض البرامج تظهر فقط للموظفين أو الشركاء المدعوّين. تُطبَّق تلك القواعد بنفس طريقة بقية الأكاديمية — لا بمجرّد توقّع أن يبقى الجميع على الرابط الصحيح.",
    certificatesTitle: "الشهادات والتحقُّق",
    certificatesBody:
      "عندما تنال شهادة، نُصدر لك سجلًّا قابلاً للتنزيل ورمزًا يستطيع الغير التحقُّق منه. ذلك هو الفرق بين الزينة والدليل.",
  },
  footer: {
    eyebrow: "إلى أين بعد",
    title: "تحقَّق من شهادة، أو ابدأ برنامجًا مصمَّمًا ليكون قابلاً للتحقّق.",
    body:
      "بإمكان أيّ شخص التحقُّق من شهادة HenryCo عبر رمزها — دون الحاجة إلى حساب. ينال المتعلّمون المستوى نفسه من البرهان سواء كان البرنامج عامًّا أو مُكلَّفًا أو محصورًا بشركاء.",
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
      "Anmeldungen, Fortschritt, Quizze und Zertifikate werden serverseitig verarbeitet — nicht im Browser versteckt. Interne Kurse bleiben den richtigen Personen vorbehalten; Zertifikate enthalten einen Verifizierungscode, den jeder prüfen kann.",
    ctaPrimary: "Katalog durchsuchen",
    ctaSecondary: "Zertifikat verifizieren",
    asideRecordsLabel: "Nachweise",
    asideRecordsValue: "Serverseitig, nicht browserseitig",
    asideAccessLabel: "Zugriffskontrolle",
    asideAccessValue: "Öffentlich · Mitarbeitende · Partner",
    asideCredentialsLabel: "Qualifikationen",
    asideCredentialsValue: "Herunterladbar und öffentlich prüfbar",
  },
  pillars: {
    sectionEyebrow: "Drei operative Standards",
    enrollmentTitle: "Anmeldung & Zugang",
    enrollmentBody:
      "Kursstart, Zahlung dort, wo erforderlich, und das Freischalten von Lektionen erfolgen über sichere Abläufe. Eine Fertigstellung lässt sich nicht clientseitig „vortäuschen“.",
    internalTitle: "Interne und zugewiesene Schulungen",
    internalBody:
      "Manche Programme sind nur für eingeladene Mitarbeitende oder Partner sichtbar. Diese Regeln werden genauso durchgesetzt wie im Rest der Akademie — nicht in der Hoffnung, dass alle auf der richtigen URL bleiben.",
    certificatesTitle: "Zertifikate & Verifizierung",
    certificatesBody:
      "Sobald Sie einen Nachweis erwerben, stellen wir einen herunterladbaren Datensatz und einen Code aus, den Dritte überprüfen können. Das ist der Unterschied zwischen Dekoration und Beweis.",
  },
  footer: {
    eyebrow: "Wie geht es weiter",
    title: "Verifizieren Sie einen Nachweis oder starten Sie ein Programm, das geprüft werden kann.",
    body:
      "Jede Person kann ein HenryCo-Zertifikat über seinen Code verifizieren — ganz ohne Konto. Lernende erhalten denselben Beweisstandard, ob das Programm öffentlich, zugewiesen oder partnerexklusiv ist.",
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
      "Iscrizioni, avanzamento, quiz e certificati vengono gestiti sul server — non nascosti nel browser. I corsi interni restano riservati alle persone giuste; i certificati portano un codice di verifica che chiunque può controllare.",
    ctaPrimary: "Esplora il catalogo",
    ctaSecondary: "Verifica un certificato",
    asideRecordsLabel: "Registri",
    asideRecordsValue: "Lato server, non lato browser",
    asideAccessLabel: "Controllo degli accessi",
    asideAccessValue: "Pubblico · staff · partner",
    asideCredentialsLabel: "Credenziali",
    asideCredentialsValue: "Scaricabili e verificabili pubblicamente",
  },
  pillars: {
    sectionEyebrow: "Tre standard operativi",
    enrollmentTitle: "Iscrizione e accesso",
    enrollmentBody:
      "Avviare un corso, pagare quando previsto e sbloccare le lezioni avviene tramite flussi sicuri. Non puoi «fingere» il completamento dal lato client.",
    internalTitle: "Formazione interna e assegnata",
    internalBody:
      "Alcuni programmi sono visibili solo a personale o partner invitati. Quelle regole vengono applicate allo stesso modo del resto dell’accademia — non sperando che ognuno resti sull’URL giusto.",
    certificatesTitle: "Certificati e verifica",
    certificatesBody:
      "Quando ottieni una credenziale, emettiamo un registro scaricabile e un codice che terzi possono controllare. È la differenza tra un addobbo e una prova.",
  },
  footer: {
    eyebrow: "Dove andare ora",
    title: "Verifica una credenziale o avvia un programma pensato per essere verificabile.",
    body:
      "Chiunque può verificare un certificato HenryCo dal suo codice — senza bisogno di un account. Gli studenti ricevono lo stesso livello di prova, che il programma sia pubblico, assegnato o riservato ai partner.",
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
      "报名、进度、测验与证书均在服务器端处理，不会藏在浏览器里。内部课程仅对应有权限的人员开放；证书自带验证码,任何人都能核查。",
    ctaPrimary: "浏览课程目录",
    ctaSecondary: "验证证书",
    asideRecordsLabel: "记录",
    asideRecordsValue: "在服务器端，而非浏览器端",
    asideAccessLabel: "访问控制",
    asideAccessValue: "公开 · 员工 · 合作方",
    asideCredentialsLabel: "凭证",
    asideCredentialsValue: "可下载且可公开验证",
  },
  pillars: {
    sectionEyebrow: "三项运营标准",
    enrollmentTitle: "报名与访问",
    enrollmentBody:
      "开始课程、按需付费以及解锁课时,都通过安全的流程完成。无法在客户端「伪造」完成状态。",
    internalTitle: "内部与指派培训",
    internalBody:
      "部分项目仅对受邀员工或合作伙伴可见。这些规则与学院其他课程一样被严格执行,而不是寄望于每个人都停留在正确的网址。",
    certificatesTitle: "证书与验证",
    certificatesBody:
      "当你获得资质时,我们会签发可下载的记录与一个第三方可以核验的代码。这就是装饰与凭证之间的区别。",
  },
  footer: {
    eyebrow: "接下来",
    title: "验证一项资质,或开启一个生而可被核查的项目。",
    body:
      "任何人都能通过 HenryCo 证书的代码进行验证 — 无需注册账号。无论项目是公开、指派还是合作方专属,学习者都享有同等水平的可证明性。",
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
      "नामांकन, प्रगति, क्विज़ और प्रमाणपत्र सर्वर पर संभाले जाते हैं — ब्राउज़र में छिपाए नहीं जाते। आंतरिक कोर्स केवल सही लोगों तक सीमित रहते हैं; प्रमाणपत्रों पर सत्यापन कोड होता है जिसे कोई भी जाँच सकता है।",
    ctaPrimary: "कैटलॉग देखें",
    ctaSecondary: "प्रमाणपत्र सत्यापित करें",
    asideRecordsLabel: "रिकॉर्ड",
    asideRecordsValue: "सर्वर पर, ब्राउज़र पर नहीं",
    asideAccessLabel: "एक्सेस नियंत्रण",
    asideAccessValue: "सार्वजनिक · स्टाफ · साझेदार",
    asideCredentialsLabel: "क्रेडेंशियल",
    asideCredentialsValue: "डाउनलोड के योग्य व सार्वजनिक रूप से सत्यापन योग्य",
  },
  pillars: {
    sectionEyebrow: "तीन परिचालन मानक",
    enrollmentTitle: "नामांकन और पहुँच",
    enrollmentBody:
      "कोर्स शुरू करना, जहाँ आवश्यक हो वहाँ भुगतान करना और पाठ खोलना — सब सुरक्षित प्रक्रियाओं से होता है। क्लाइंट साइड से पूर्णता को «नकली» नहीं बनाया जा सकता।",
    internalTitle: "आंतरिक और सौंपा गया प्रशिक्षण",
    internalBody:
      "कुछ कार्यक्रम केवल आमंत्रित स्टाफ़ या साझेदारों को दिखते हैं। ये नियम वैसे ही लागू होते हैं जैसे बाकी अकादमी में — यह आशा करके नहीं कि लोग सही URL पर बने रहेंगे।",
    certificatesTitle: "प्रमाणपत्र और सत्यापन",
    certificatesBody:
      "जब आप कोई क्रेडेंशियल अर्जित करते हैं, हम डाउनलोड योग्य रिकॉर्ड और एक कोड जारी करते हैं जिसे तीसरा पक्ष जाँच सकता है। यही सजावट और प्रमाण के बीच का अंतर है।",
  },
  footer: {
    eyebrow: "आगे क्या",
    title: "एक क्रेडेंशियल सत्यापित करें, या जाँच के लिए बना कार्यक्रम शुरू करें।",
    body:
      "कोई भी HenryCo प्रमाणपत्र को उसके कोड से सत्यापित कर सकता है — खाते की ज़रूरत नहीं। शिक्षार्थियों को वही प्रमाण-स्तर मिलता है, चाहे कार्यक्रम सार्वजनिक हो, सौंपा गया हो या केवल साझेदार के लिए हो।",
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
      "A na-elekọta ndebanye aha, ọganihu, ule nta, na akwụkwọ ikike na sava — anaghị ezo ya na nchọgharị weebụ. Nkuzi ime ụlọ na-anọgide naanị maka ndị kwesịrị ekwesị; akwụkwọ ikike na-eburu koodu nyocha onye ọ bụla nwere ike ileba anya.",
    ctaPrimary: "Nyochaa katalọgụ",
    ctaSecondary: "Nyochaa akwụkwọ ikike",
    asideRecordsLabel: "Akwụkwọ ndekọ",
    asideRecordsValue: "Na sava, ọ bụghị na nchọgharị weebụ",
    asideAccessLabel: "Njikwa nnweta",
    asideAccessValue: "Ọha · ndị ọrụ · ndị mmekọ",
    asideCredentialsLabel: "Ihe akaebe",
    asideCredentialsValue: "Enwere ike ibudata yana inyochara ya n’ihu ọha",
  },
  pillars: {
    sectionEyebrow: "Ụkpụrụ ọrụ atọ",
    enrollmentTitle: "Ndebanye aha na nnweta",
    enrollmentBody:
      "Ịmalite nkuzi, ịkwụ ụgwọ ebe achọrọ ya, na imeghe ihe ọmụmụ na-eme site na usoro nke nwere nchekwa. Ị nweghị ike ime ka mmecha bụrụ «ụgha» site n’akụkụ onye ahịa.",
    internalTitle: "Ọzụzụ ime ụlọ na nke e kenyere",
    internalBody:
      "Ụfọdụ mmemme na-apụta naanị nye ndị ọrụ ma ọ bụ ndị mmekọ a kpọrọ òkù. A na-eme iwu ndị ahụ otu ụzọ ahụ a si eme ya na akụkụ ndị ọzọ akademii — ọ bụghị site n’olileanya na onye ọ bụla ga-anọgide na URL ziri ezi.",
    certificatesTitle: "Akwụkwọ ikike na nyocha",
    certificatesBody:
      "Mgbe ị nwetara akwụkwọ ikike, anyị na-enye gị ndekọ ị nwere ike ibudata yana koodu ndị ọzọ nwere ike ileba anya. Nke ahụ bụ ọdịiche dị n’etiti ihe ịchọ mma na ihe akaebe.",
  },
  footer: {
    eyebrow: "Ebe ọzọ",
    title: "Nyochaa ihe akaebe, ma ọ bụ malite mmemme e mere ka enwee ike inyocha ya.",
    body:
      "Onye ọ bụla nwere ike nyochaa akwụkwọ ikike HenryCo site na koodu ya — achọghị akaụntụ. Ndị mmụta na-enweta otu ụkpụrụ ihe akaebe ma mmemme ọ bụ ọha, e kenyere ya, ma ọ bụ naanị maka onye mmekọ.",
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
      "A ń tọ́jú ìforúkọsílẹ̀, ìlọsíwájú, ìdánwò ọ̀rọ̀-kúkurú àti ẹ̀rí lori sáfà — kì í ṣe nínú ẹrọ aṣàwákiri. Àwọn ẹ̀kọ́ inú ilé ń wà fún àwọn ènìyàn tó yẹ; ẹ̀rí kọ̀ọ̀kan máa ń mú kóòdù ìmúlò tí ẹnikẹ́ni lè yẹ̀wò.",
    ctaPrimary: "Yẹ àkójọpọ̀ ẹ̀kọ́",
    ctaSecondary: "Ṣàyẹ̀wò ẹ̀rí",
    asideRecordsLabel: "Àkọsílẹ̀",
    asideRecordsValue: "Ní sáfà, kì í ṣe ní ẹrọ aṣàwákiri",
    asideAccessLabel: "Ìkáwọ́ ìwọlé",
    asideAccessValue: "Gbogbogbò · òṣìṣẹ́ · alábàákẹ́gbẹ́",
    asideCredentialsLabel: "Àwọn ẹ̀rí ìmọ̀",
    asideCredentialsValue: "Ó ṣeé gba sílẹ̀, ó sì ṣeé yẹ̀wò ní gbangba",
  },
  pillars: {
    sectionEyebrow: "Òfin iṣẹ́ mẹ́ta",
    enrollmentTitle: "Ìforúkọsílẹ̀ àti ìwọlé",
    enrollmentBody:
      "Bíbẹ̀rẹ̀ ẹ̀kọ́, sísanwó níbi tó bá yẹ àti ṣíṣí àwọn ẹ̀kọ́ ń wáyé nípasẹ̀ àwọn ìṣàn tó ní ààbò. O ò lè «pa irọ́» pípè ẹ̀kọ́ láti orí ẹrọ aṣàwákiri.",
    internalTitle: "Ìkọ́ni inú ilé àti tí a yàn",
    internalBody:
      "Àwọn ètò kan máa ń farahàn fún àwọn òṣìṣẹ́ tàbí alábàákẹ́gbẹ́ tí a pè nìkan. A ń mú àwọn òfin yẹn ṣe gẹ́gẹ́ bí ti àwọn ẹ̀kọ́ ìyókù — kò ṣe nípa rírírò pé gbogbo ènìyàn yóò dúró sí URL tó tọ́.",
    certificatesTitle: "Ẹ̀rí àti ìmúlò",
    certificatesBody:
      "Nígbà tí o bá gba ẹ̀rí, a fún ọ ní àkọsílẹ̀ tó ṣeé gba sílẹ̀ àti kóòdù tí ẹlòmíràn lè yẹ̀wò. Ìyẹn ni iyàtọ̀ láàrín ọ̀ṣọ́ àti ẹ̀rí gidi.",
  },
  footer: {
    eyebrow: "Ibo lẹhìnnà",
    title: "Yẹ ẹ̀rí kan wò, tàbí bẹ̀rẹ̀ ètò tí a kọ́ kí ó ṣeé yẹ̀wò.",
    body:
      "Ẹnikẹ́ni lè yẹ ẹ̀rí HenryCo láti inú kóòdù rẹ̀ — láìjẹ́ pé akáyángá nilò. Àwọn akẹ́kọ̀ọ́ ń gba ìpele ẹ̀rí kan náà, bóyá ètò náà jẹ́ ti gbogbogbò, tí a yàn, tàbí ti alábàákẹ́gbẹ́.",
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
      "Rajista, ci gaba, gwaje-gwajen tambayoyi da takaddun shaida ana sarrafa su a kan sabar — ba a ɓoye su a cikin mai bincike na yanar gizo ba. Kwasa-kwasai na cikin gida sun tsaya ga waɗanda suka cancanta; takaddun shaida suna ɗauke da lambar tabbatarwa wadda kowa zai iya bincika.",
    ctaPrimary: "Duba katalogi",
    ctaSecondary: "Tabbatar da takaddar shaida",
    asideRecordsLabel: "Bayanai",
    asideRecordsValue: "A kan sabar, ba a kan mai bincike ba",
    asideAccessLabel: "Sarrafa shiga",
    asideAccessValue: "Jama’a · ma’aikata · abokan haɗin gwiwa",
    asideCredentialsLabel: "Takaddun ƙwarewa",
    asideCredentialsValue: "Za a iya saukar da su kuma a tabbatar da su a fili",
  },
  pillars: {
    sectionEyebrow: "Ma’auni uku na aiki",
    enrollmentTitle: "Rajista da shiga",
    enrollmentBody:
      "Fara kwas, biya inda ya zama dole, da buɗewar darussa duk suna gudana ta hanyoyi masu tsaro. Ba za ku iya «yin ƙarya» game da gama kwas ɗin daga gefen abokin ciniki ba.",
    internalTitle: "Horarwar cikin gida da ta aiki",
    internalBody:
      "Wasu shirye-shiryen kawai ana iya ganinsu ne ga ma’aikata ko abokan haɗin gwiwa da aka gayyace su. Waɗannan ƙa’idodin ana aiwatar da su kamar yadda ake aiwatar da sauran rukunin kwasa-kwasai — ba ta hanyar fatan kowa zai zauna a kan URL daidai ba.",
    certificatesTitle: "Takaddun shaida da tabbatarwa",
    certificatesBody:
      "Lokacin da kuka samu takarda, muna ba ku bayanin da za a iya saukewa da lamba wadda waɗanda ba sa cikin tsarin za su iya bincika. Wannan ne bambanci tsakanin ado da hujja.",
  },
  footer: {
    eyebrow: "Inda za a tafi gaba",
    title: "Tabbatar da takarda, ko fara shirin da aka tsara don a iya duba shi.",
    body:
      "Duk wani mutum zai iya tabbatar da takaddar shaida ta HenryCo daga lambar ta — ba a buƙatar asusu. Ɗaliban suna samun ma’aunin hujja iri ɗaya, ko shirin jama’a ne, ko aiki ne, ko na abokan haɗin gwiwa ne kawai.",
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
