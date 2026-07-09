import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * LearnCertificationsCopy — i18n surface for the public Certifications page on
 * the Learn division (apps/learn/app/(public)/certifications/page.tsx).
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each locale is a
 * Partial that deep-merges over EN so missing keys fall through to EN silently.
 * Mirrors the shape of `learn-trust-copy.ts`.
 */
export type LearnCertificationsCopy = {
  meta: {
    title: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    body: string;
    asideFormatLabel: string;
    asideFormatValue: string;
    asideVerificationLabel: string;
    asideVerificationValue: string;
    asideStorageLabel: string;
    asideStorageValue: string;
  };
  pillars: {
    sectionEyebrow: string;
    whoTitle: string;
    whoBody: string;
    qualifiedTitle: string;
    qualifiedBody: string;
    afterTitle: string;
    afterBody: string;
  };
  verify: {
    eyebrow: string;
    title: string;
    body: string;
    inputPlaceholder: string;
    submit: string;
  };
  catalog: {
    kicker: string;
    title: string;
    body: string;
    emptyPrefix: string;
    emptyLinkLabel: string;
    emptySuffix: string;
  };
  footer: {
    ctaAccount: string;
    ctaVerification: string;
  };
};

const LEARN_CERTIFICATIONS_COPY_EN: LearnCertificationsCopy = {
  meta: {
    title: "Certificates - Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Verified certificates",
    title: "Credentials you can show. Anyone can verify.",
    body:
      "Certificate-eligible courses carry a badge. Finish the required lessons, pass any assessments, and Henry Onyx Learn records the completion. You get a downloadable PDF plus a public verification code for employers, clients, and partners.",
    asideFormatLabel: "Format",
    asideFormatValue: "Downloadable PDF + public link",
    asideVerificationLabel: "Verification",
    asideVerificationValue: "Code-checkable, no account needed",
    asideStorageLabel: "Storage",
    asideStorageValue: "Saved on your Henry Onyx account",
  },
  pillars: {
    sectionEyebrow: "How a credential works",
    whoTitle: "Who it’s for",
    whoBody:
      "Anyone who completes an eligible program — public learners, assigned staff, or partners — holds the same standard of proof.",
    qualifiedTitle: "What “qualified” means",
    qualifiedBody:
      "Requirements are set per course (lessons + sometimes a passing assessment). Your learning room shows a simple checklist until everything is satisfied.",
    afterTitle: "After you earn it",
    afterBody:
      "Add it to your CV or profile, share the verification link, or keep it in your Henry Onyx account alongside the rest of your learning history.",
  },
  verify: {
    eyebrow: "Verify someone’s certificate",
    title: "Enter the code, see whether the record matches.",
    body:
      "Enter the code printed on their credential. You’ll see whether Henry Onyx Learn has a matching, active record — no account required to check.",
    inputPlaceholder: "Verification code",
    submit: "Verify",
  },
  catalog: {
    kicker: "Certificate programs",
    title: "Courses that currently award a Henry Onyx certificate",
    body: "Open any program for the full syllabus, quiz details, and enrollment options.",
    emptyPrefix:
      "No certificate-track courses are published in the catalog yet. Browse all programs on the ",
    emptyLinkLabel: "course catalog",
    emptySuffix: " — we’ll label new credentials clearly as they go live.",
  },
  footer: {
    ctaAccount: "My certificates in account",
    ctaVerification: "How verification works",
  },
};

const LEARN_CERTIFICATIONS_COPY_FR: DeepPartial<LearnCertificationsCopy> = {
  meta: {
    title: "Certificats — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Certificats vérifiés",
    title: "Des titres que vous pouvez présenter. N’importe qui peut les vérifier.",
    body:
      "Les cours éligibles à un certificat portent un badge. Terminez les leçons requises, réussissez les évaluations éventuelles et Henry Onyx Learn enregistre l’achèvement. Vous recevez un PDF téléchargeable ainsi qu’un code de vérification public pour vos employeurs, clients et partenaires.",
    asideFormatLabel: "Format",
    asideFormatValue: "PDF téléchargeable + lien public",
    asideVerificationLabel: "Vérification",
    asideVerificationValue: "Vérifiable par code, sans compte requis",
    asideStorageLabel: "Conservation",
    asideStorageValue: "Conservé dans votre compte Henry Onyx",
  },
  pillars: {
    sectionEyebrow: "Comment fonctionne un titre",
    whoTitle: "À qui il s’adresse",
    whoBody:
      "Toute personne qui termine un programme éligible — apprenants publics, collaborateurs assignés ou partenaires — obtient le même niveau de preuve.",
    qualifiedTitle: "Ce que signifie « qualifié »",
    qualifiedBody:
      "Les exigences sont définies par cours (leçons + parfois une évaluation à réussir). Votre espace d’apprentissage affiche une liste de contrôle claire tant que tout n’est pas satisfait.",
    afterTitle: "Après l’avoir obtenu",
    afterBody:
      "Ajoutez-le à votre CV ou à votre profil, partagez le lien de vérification ou conservez-le dans votre compte Henry Onyx aux côtés du reste de votre parcours d’apprentissage.",
  },
  verify: {
    eyebrow: "Vérifier le certificat de quelqu’un",
    title: "Saisissez le code et voyez si le dossier correspond.",
    body:
      "Saisissez le code imprimé sur leur titre. Vous verrez si Henry Onyx Learn possède un dossier correspondant et actif — aucun compte n’est requis pour vérifier.",
    inputPlaceholder: "Code de vérification",
    submit: "Vérifier",
  },
  catalog: {
    kicker: "Programmes certifiants",
    title: "Cours délivrant actuellement un certificat Henry Onyx",
    body: "Ouvrez n’importe quel programme pour le programme complet, le détail des quiz et les options d’inscription.",
    emptyPrefix:
      "Aucun cours certifiant n’est encore publié au catalogue. Parcourez tous les programmes via le ",
    emptyLinkLabel: "catalogue des cours",
    emptySuffix: " — nous signalerons clairement les nouveaux titres dès leur mise en ligne.",
  },
  footer: {
    ctaAccount: "Mes certificats dans mon compte",
    ctaVerification: "Comment fonctionne la vérification",
  },
};

const LEARN_CERTIFICATIONS_COPY_ES: DeepPartial<LearnCertificationsCopy> = {
  meta: {
    title: "Certificados — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Certificados verificados",
    title: "Credenciales que puedes mostrar. Cualquiera puede verificarlas.",
    body:
      "Los cursos elegibles para un certificado llevan una insignia. Termina las lecciones requeridas, supera las evaluaciones que correspondan y Henry Onyx Learn registrará la finalización. Recibes un PDF descargable y un código de verificación público para empleadores, clientes y socios.",
    asideFormatLabel: "Formato",
    asideFormatValue: "PDF descargable + enlace público",
    asideVerificationLabel: "Verificación",
    asideVerificationValue: "Comprobable por código, sin necesidad de cuenta",
    asideStorageLabel: "Almacenamiento",
    asideStorageValue: "Guardado en tu cuenta de Henry Onyx",
  },
  pillars: {
    sectionEyebrow: "Cómo funciona una credencial",
    whoTitle: "A quién está dirigido",
    whoBody:
      "Cualquier persona que complete un programa elegible —alumnos públicos, personal asignado o socios— obtiene el mismo nivel de prueba.",
    qualifiedTitle: "Qué significa «cualificado»",
    qualifiedBody:
      "Los requisitos se definen por curso (lecciones + a veces una evaluación que aprobar). Tu sala de aprendizaje muestra una lista de comprobación sencilla hasta que se cumpla todo.",
    afterTitle: "Después de obtenerlo",
    afterBody:
      "Añádelo a tu CV o perfil, comparte el enlace de verificación o consérvalo en tu cuenta de Henry Onyx junto con el resto de tu historial de aprendizaje.",
  },
  verify: {
    eyebrow: "Verificar el certificado de alguien",
    title: "Introduce el código y comprueba si el registro coincide.",
    body:
      "Introduce el código impreso en su credencial. Verás si Henry Onyx Learn cuenta con un registro coincidente y activo, sin necesidad de cuenta para comprobarlo.",
    inputPlaceholder: "Código de verificación",
    submit: "Verificar",
  },
  catalog: {
    kicker: "Programas con certificado",
    title: "Cursos que actualmente otorgan un certificado de Henry Onyx",
    body: "Abre cualquier programa para ver el temario completo, los detalles del cuestionario y las opciones de inscripción.",
    emptyPrefix:
      "Aún no hay cursos con itinerario de certificado publicados en el catálogo. Explora todos los programas en el ",
    emptyLinkLabel: "catálogo de cursos",
    emptySuffix: " — etiquetaremos las nuevas credenciales con claridad en cuanto se publiquen.",
  },
  footer: {
    ctaAccount: "Mis certificados en la cuenta",
    ctaVerification: "Cómo funciona la verificación",
  },
};

const LEARN_CERTIFICATIONS_COPY_PT: DeepPartial<LearnCertificationsCopy> = {
  meta: {
    title: "Certificados — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Certificados verificados",
    title: "Credenciais que pode mostrar. Qualquer pessoa pode verificá-las.",
    body:
      "Os cursos elegíveis para certificado têm um distintivo. Conclua as lições obrigatórias, passe nas avaliações aplicáveis e o Henry Onyx Learn regista a conclusão. Recebe um PDF para descarregar e um código de verificação público para empregadores, clientes e parceiros.",
    asideFormatLabel: "Formato",
    asideFormatValue: "PDF descarregável + ligação pública",
    asideVerificationLabel: "Verificação",
    asideVerificationValue: "Verificável por código, sem precisar de conta",
    asideStorageLabel: "Armazenamento",
    asideStorageValue: "Guardado na sua conta Henry Onyx",
  },
  pillars: {
    sectionEyebrow: "Como funciona uma credencial",
    whoTitle: "A quem se destina",
    whoBody:
      "Qualquer pessoa que conclua um programa elegível — alunos públicos, colaboradores designados ou parceiros — obtém o mesmo padrão de prova.",
    qualifiedTitle: "O que significa «qualificado»",
    qualifiedBody:
      "Os requisitos são definidos por curso (lições + por vezes uma avaliação para passar). A sua sala de aprendizagem apresenta uma lista de verificação simples até tudo estar cumprido.",
    afterTitle: "Depois de o conquistar",
    afterBody:
      "Acrescente-o ao CV ou ao perfil, partilhe a ligação de verificação ou guarde-o na conta Henry Onyx, junto com o restante histórico de aprendizagem.",
  },
  verify: {
    eyebrow: "Verificar o certificado de alguém",
    title: "Introduza o código e veja se o registo corresponde.",
    body:
      "Introduza o código impresso na credencial. Verá se o Henry Onyx Learn tem um registo correspondente e ativo — não é preciso ter conta para verificar.",
    inputPlaceholder: "Código de verificação",
    submit: "Verificar",
  },
  catalog: {
    kicker: "Programas com certificado",
    title: "Cursos que atualmente concedem um certificado Henry Onyx",
    body: "Abra qualquer programa para consultar o programa completo, os detalhes do questionário e as opções de inscrição.",
    emptyPrefix:
      "Ainda não há cursos com certificado publicados no catálogo. Explore todos os programas no ",
    emptyLinkLabel: "catálogo de cursos",
    emptySuffix: " — sinalizaremos claramente as novas credenciais assim que ficarem disponíveis.",
  },
  footer: {
    ctaAccount: "Os meus certificados na conta",
    ctaVerification: "Como funciona a verificação",
  },
};

const LEARN_CERTIFICATIONS_COPY_AR: DeepPartial<LearnCertificationsCopy> = {
  meta: {
    title: "الشهادات — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "شهادات موثَّقة",
    title: "شهادات يمكنك إبرازها، ويستطيع الجميع التحقُّق منها.",
    body:
      "تحمل الدورات المؤهَّلة للشهادة شارةً مميَّزة. أكمِل الدروس المطلوبة، واجتَز التقييمات إن وُجدت، فيسجِّل Henry Onyx Learn إتمامك. ستحصل على ملف PDF قابل للتنزيل ورمز تحقُّق علني يستخدمه أصحاب العمل والعملاء والشركاء.",
    asideFormatLabel: "الصيغة",
    asideFormatValue: "ملف PDF للتنزيل + رابط علني",
    asideVerificationLabel: "التحقُّق",
    asideVerificationValue: "قابل للفحص بالرمز، دون الحاجة إلى حساب",
    asideStorageLabel: "الحفظ",
    asideStorageValue: "محفوظة في حسابك على Henry Onyx",
  },
  pillars: {
    sectionEyebrow: "كيف تعمل الشهادة",
    whoTitle: "لمن هي موجَّهة",
    whoBody:
      "كلُّ من يكمل برنامجًا مؤهَّلًا — متعلّمون من الجمهور أو موظَّفون مُكلَّفون أو شركاء — ينال المستوى نفسه من الإثبات.",
    qualifiedTitle: "ما معنى «مؤهَّل»",
    qualifiedBody:
      "تُحدَّد المتطلَّبات لكلِّ دورة (دروس + أحيانًا تقييم يجب اجتيازه). تعرض غرفة تعلُّمك قائمة تحقُّق مُبسَّطة حتى يكتمل كلُّ شرط.",
    afterTitle: "بعد الحصول عليها",
    afterBody:
      "أضِفها إلى سيرتك الذاتية أو ملفِّك التعريفي، أو شارك رابط التحقُّق، أو احتفِظ بها في حساب Henry Onyx إلى جانب بقيَّة سجلِّ تعلُّمك.",
  },
  verify: {
    eyebrow: "التحقُّق من شهادة شخص آخر",
    title: "أدخِل الرمز ولاحِظ ما إذا كان السجلُّ مطابقًا.",
    body:
      "أدخِل الرمز المطبوع على شهادته. سترى ما إذا كان Henry Onyx Learn يمتلك سجلًّا مطابقًا وفعَّالًا — لا حاجة إلى حساب للتحقُّق.",
    inputPlaceholder: "رمز التحقُّق",
    submit: "تحقَّق",
  },
  catalog: {
    kicker: "برامج الشهادات",
    title: "الدورات التي تمنح حاليًّا شهادة Henry Onyx",
    body: "افتح أيَّ برنامج للاطِّلاع على المنهج الكامل وتفاصيل الاختبارات وخيارات التسجيل.",
    emptyPrefix:
      "لا توجد دورات بمسار شهادة منشورة في الكتالوج بعد. تصفَّح جميع البرامج عبر ",
    emptyLinkLabel: "كتالوج الدورات",
    emptySuffix: " — وسنميِّز الشهادات الجديدة بوضوح فور إطلاقها.",
  },
  footer: {
    ctaAccount: "شهاداتي في الحساب",
    ctaVerification: "كيف يعمل التحقُّق",
  },
};

const LEARN_CERTIFICATIONS_COPY_DE: DeepPartial<LearnCertificationsCopy> = {
  meta: {
    title: "Zertifikate — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Verifizierte Zertifikate",
    title: "Nachweise, die Sie zeigen können. Jeder kann sie verifizieren.",
    body:
      "Zertifikatsfähige Kurse tragen ein Abzeichen. Schließen Sie die geforderten Lektionen ab, bestehen Sie etwaige Prüfungen, und Henry Onyx Learn verzeichnet den Abschluss. Sie erhalten ein herunterladbares PDF sowie einen öffentlichen Verifizierungscode für Arbeitgeber, Kundschaft und Partner.",
    asideFormatLabel: "Format",
    asideFormatValue: "Herunterladbares PDF + öffentlicher Link",
    asideVerificationLabel: "Verifizierung",
    asideVerificationValue: "Per Code prüfbar, ohne Konto",
    asideStorageLabel: "Speicherort",
    asideStorageValue: "In Ihrem Henry Onyx-Konto gespeichert",
  },
  pillars: {
    sectionEyebrow: "So funktioniert ein Nachweis",
    whoTitle: "Für wen er ist",
    whoBody:
      "Wer ein zertifizierbares Programm abschließt — öffentliche Lernende, zugewiesene Mitarbeitende oder Partner — erhält denselben Beweisstandard.",
    qualifiedTitle: "Was „qualifiziert“ bedeutet",
    qualifiedBody:
      "Die Anforderungen werden pro Kurs festgelegt (Lektionen + gegebenenfalls eine zu bestehende Prüfung). Ihr Lernraum zeigt eine schlichte Checkliste, bis alles erfüllt ist.",
    afterTitle: "Nachdem Sie ihn erworben haben",
    afterBody:
      "Fügen Sie ihn Ihrem Lebenslauf oder Profil hinzu, teilen Sie den Verifizierungslink oder bewahren Sie ihn in Ihrem Henry Onyx-Konto neben dem restlichen Lernverlauf auf.",
  },
  verify: {
    eyebrow: "Zertifikat einer Person verifizieren",
    title: "Geben Sie den Code ein und sehen Sie, ob der Datensatz übereinstimmt.",
    body:
      "Geben Sie den auf dem Nachweis abgedruckten Code ein. Sie sehen, ob Henry Onyx Learn einen passenden, aktiven Datensatz führt — ohne Konto.",
    inputPlaceholder: "Verifizierungscode",
    submit: "Verifizieren",
  },
  catalog: {
    kicker: "Zertifikatsprogramme",
    title: "Kurse, die derzeit ein Henry Onyx-Zertifikat vergeben",
    body: "Öffnen Sie ein beliebiges Programm für den vollständigen Lehrplan, Prüfungsdetails und Einschreibeoptionen.",
    emptyPrefix:
      "Noch sind keine zertifikatsfähigen Kurse im Katalog veröffentlicht. Durchstöbern Sie alle Programme im ",
    emptyLinkLabel: "Kurskatalog",
    emptySuffix: " — neue Nachweise kennzeichnen wir klar, sobald sie live gehen.",
  },
  footer: {
    ctaAccount: "Meine Zertifikate im Konto",
    ctaVerification: "So funktioniert die Verifizierung",
  },
};

const LEARN_CERTIFICATIONS_COPY_IT: DeepPartial<LearnCertificationsCopy> = {
  meta: {
    title: "Certificati — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Certificati verificati",
    title: "Credenziali da mostrare. Verificabili da chiunque.",
    body:
      "I corsi idonei al certificato portano un distintivo. Completa le lezioni richieste, supera le eventuali valutazioni e Henry Onyx Learn registra il completamento. Ricevi un PDF scaricabile e un codice di verifica pubblico per datori di lavoro, clienti e partner.",
    asideFormatLabel: "Formato",
    asideFormatValue: "PDF scaricabile + link pubblico",
    asideVerificationLabel: "Verifica",
    asideVerificationValue: "Controllabile tramite codice, senza account",
    asideStorageLabel: "Archiviazione",
    asideStorageValue: "Conservato nel tuo account Henry Onyx",
  },
  pillars: {
    sectionEyebrow: "Come funziona una credenziale",
    whoTitle: "A chi è rivolta",
    whoBody:
      "Chiunque completi un programma idoneo — studenti pubblici, personale assegnato o partner — ottiene lo stesso livello di prova.",
    qualifiedTitle: "Cosa significa «qualificato»",
    qualifiedBody:
      "I requisiti sono fissati per ciascun corso (lezioni + a volte una valutazione da superare). La tua aula mostra una checklist chiara finché tutto non è completato.",
    afterTitle: "Dopo averla ottenuta",
    afterBody:
      "Aggiungila al CV o al profilo, condividi il link di verifica oppure conservala nel tuo account Henry Onyx insieme al resto del percorso formativo.",
  },
  verify: {
    eyebrow: "Verifica il certificato di qualcuno",
    title: "Inserisci il codice e controlla se il record corrisponde.",
    body:
      "Inserisci il codice riportato sulla credenziale. Vedrai se Henry Onyx Learn ha un record corrispondente e attivo — non serve un account per controllare.",
    inputPlaceholder: "Codice di verifica",
    submit: "Verifica",
  },
  catalog: {
    kicker: "Programmi con certificato",
    title: "Corsi che attualmente rilasciano un certificato Henry Onyx",
    body: "Apri qualunque programma per consultare il programma completo, i dettagli dei quiz e le opzioni di iscrizione.",
    emptyPrefix:
      "Nessun corso con percorso a certificato è ancora pubblicato nel catalogo. Esplora tutti i programmi nel ",
    emptyLinkLabel: "catalogo dei corsi",
    emptySuffix: " — segnaleremo chiaramente le nuove credenziali non appena saranno disponibili.",
  },
  footer: {
    ctaAccount: "I miei certificati nell’account",
    ctaVerification: "Come funziona la verifica",
  },
};

const LEARN_CERTIFICATIONS_COPY_ZH: DeepPartial<LearnCertificationsCopy> = {
  meta: {
    title: "证书 — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "经核验的证书",
    title: "可以展示的凭证，人人都能核验。",
    body:
      "可获取证书的课程会带有徽章标识。完成必修课时、通过相应的评估后，Henry Onyx Learn 会记录你的完成情况。你将获得可下载的 PDF，以及面向雇主、客户与合作伙伴的公开核验代码。",
    asideFormatLabel: "形式",
    asideFormatValue: "可下载的 PDF + 公开链接",
    asideVerificationLabel: "核验",
    asideVerificationValue: "凭代码可核验，无需账户",
    asideStorageLabel: "保存方式",
    asideStorageValue: "保存在你的 Henry Onyx 账户中",
  },
  pillars: {
    sectionEyebrow: "凭证如何运作",
    whoTitle: "适合谁",
    whoBody:
      "任何完成合资格项目的人 — 公开学员、指派员工或合作伙伴 — 都拥有同等水准的证明。",
    qualifiedTitle: "「合格」意味着什么",
    qualifiedBody:
      "每门课程都有各自的要求（课时 + 有时还包含须通过的评估）。你的学习空间会以简洁的清单形式呈现，直到全部条件满足。",
    afterTitle: "获得之后",
    afterBody:
      "将它加入你的简历或个人资料，分享核验链接，或与其他学习记录一同保存在 Henry Onyx 账户中。",
  },
  verify: {
    eyebrow: "核验他人的证书",
    title: "输入代码，查看记录是否匹配。",
    body:
      "输入凭证上的代码。你将看到 Henry Onyx Learn 是否拥有对应且有效的记录 — 无需账户即可查询。",
    inputPlaceholder: "核验代码",
    submit: "核验",
  },
  catalog: {
    kicker: "证书项目",
    title: "当前可获得 Henry Onyx 证书的课程",
    body: "打开任何项目，可查看完整大纲、测验细节与报名方式。",
    emptyPrefix:
      "目前还没有证书路径课程上架。可在 ",
    emptyLinkLabel: "课程目录",
    emptySuffix: " 中浏览全部项目 — 新证书上线时我们会明确标注。",
  },
  footer: {
    ctaAccount: "在账户中查看我的证书",
    ctaVerification: "核验机制说明",
  },
};

const LEARN_CERTIFICATIONS_COPY_HI: DeepPartial<LearnCertificationsCopy> = {
  meta: {
    title: "प्रमाणपत्र — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "सत्यापित प्रमाणपत्र",
    title: "ऐसे प्रमाण जिन्हें आप दिखा सकें — और कोई भी जाँच सके।",
    body:
      "प्रमाणपत्र-योग्य कोर्स पर एक बैज होता है। आवश्यक पाठ पूरे करें, जहाँ आवश्यक हो वहाँ मूल्यांकन उत्तीर्ण करें, और Henry Onyx Learn आपकी पूर्णता दर्ज कर लेगा। आपको डाउनलोड करने योग्य PDF और नियोक्ताओं, ग्राहकों व साझेदारों के लिए एक सार्वजनिक सत्यापन कोड मिलेगा।",
    asideFormatLabel: "स्वरूप",
    asideFormatValue: "डाउनलोड योग्य PDF + सार्वजनिक लिंक",
    asideVerificationLabel: "सत्यापन",
    asideVerificationValue: "कोड से जाँच योग्य, खाते की ज़रूरत नहीं",
    asideStorageLabel: "संग्रहण",
    asideStorageValue: "आपके Henry Onyx खाते में संरक्षित",
  },
  pillars: {
    sectionEyebrow: "क्रेडेंशियल कैसे काम करता है",
    whoTitle: "किसके लिए है",
    whoBody:
      "जो भी कोई पात्र कार्यक्रम पूरा करता है — सार्वजनिक शिक्षार्थी, सौंपे गए कर्मचारी या साझेदार — सबको प्रमाण का वही स्तर मिलता है।",
    qualifiedTitle: "«योग्य» का क्या अर्थ है",
    qualifiedBody:
      "आवश्यकताएँ प्रत्येक कोर्स के अनुसार तय होती हैं (पाठ + कभी-कभी उत्तीर्ण करना अनिवार्य मूल्यांकन)। आपका लर्निंग रूम एक सरल चेकलिस्ट दिखाता है जब तक सब कुछ पूरा न हो जाए।",
    afterTitle: "इसे अर्जित करने के बाद",
    afterBody:
      "इसे अपने CV या प्रोफ़ाइल में जोड़ें, सत्यापन लिंक साझा करें, या इसे अपने Henry Onyx खाते में अन्य अध्ययन इतिहास के साथ संभाल कर रखें।",
  },
  verify: {
    eyebrow: "किसी का प्रमाणपत्र सत्यापित करें",
    title: "कोड दर्ज करें और देखें कि रिकॉर्ड मेल खाता है या नहीं।",
    body:
      "उनके क्रेडेंशियल पर मुद्रित कोड दर्ज करें। आप देखेंगे कि Henry Onyx Learn के पास उससे मेल खाता और सक्रिय रिकॉर्ड है या नहीं — जाँचने के लिए खाते की आवश्यकता नहीं।",
    inputPlaceholder: "सत्यापन कोड",
    submit: "सत्यापित करें",
  },
  catalog: {
    kicker: "प्रमाणपत्र कार्यक्रम",
    title: "वे कोर्स जो वर्तमान में Henry Onyx प्रमाणपत्र प्रदान करते हैं",
    body: "पूरा पाठ्यक्रम, क्विज़ का विवरण और नामांकन के विकल्प देखने के लिए कोई भी कार्यक्रम खोलें।",
    emptyPrefix:
      "अभी तक कैटलॉग में कोई प्रमाणपत्र-ट्रैक कोर्स प्रकाशित नहीं है। सभी कार्यक्रम ",
    emptyLinkLabel: "कोर्स कैटलॉग",
    emptySuffix: " में देखें — नए क्रेडेंशियल लाइव होते ही हम उन्हें स्पष्ट रूप से चिह्नित कर देंगे।",
  },
  footer: {
    ctaAccount: "मेरे प्रमाणपत्र खाते में",
    ctaVerification: "सत्यापन कैसे काम करता है",
  },
};

const LEARN_CERTIFICATIONS_COPY_IG: DeepPartial<LearnCertificationsCopy> = {
  meta: {
    title: "Asambodo — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Asambodo a kwadoro",
    title: "Akaebe ị nwere ike igosi. Onye ọ bụla nwere ike nyochaa ya.",
    body:
      "Nkuzi ndị ruru eru maka asambodo na-eburu akara pụrụ iche. Mechaa ihe ọmụmụ achọrọ, gafee ule ọ bụla a chọrọ, Henry Onyx Learn ga-edekọ mmecha gị. Ị ga-enweta PDF enwere ike ibudata yana koodu nyocha ọha maka ndị ọrụ na-enye gị ọrụ, ndị ahịa na ndị mmekọ.",
    asideFormatLabel: "Ụdị",
    asideFormatValue: "PDF enwere ike ibudata + njikọ ọha",
    asideVerificationLabel: "Nyocha",
    asideVerificationValue: "Enwere ike inyocha site na koodu, achọghị akaụntụ",
    asideStorageLabel: "Nchekwa",
    asideStorageValue: "Echekwara n’akaụntụ Henry Onyx gị",
  },
  pillars: {
    sectionEyebrow: "Otu akaebe si arụ ọrụ",
    whoTitle: "Onye ọ bụ maka ya",
    whoBody:
      "Onye ọ bụla mechara mmemme ruru eru — ndị mmụta ọha, ndị ọrụ e kenyere, ma ọ bụ ndị mmekọ — na-enweta otu ụkpụrụ akaebe.",
    qualifiedTitle: "Ihe «iru eru» pụtara",
    qualifiedBody:
      "A na-edobe ihe achọrọ maka nkuzi ọ bụla (ihe ọmụmụ + mgbe ụfọdụ ule e kwesịrị ịgafe). Ụlọ mmụta gị na-egosi listị nyocha dị mfe ruo mgbe ihe niile ezuola.",
    afterTitle: "Mgbe ị nwetara ya",
    afterBody:
      "Tinye ya na CV gị ma ọ bụ profaịlụ gị, kesaa njikọ nyocha ya, ma ọ bụ debe ya n’akaụntụ Henry Onyx gị tinyere akụkọ mmụta ndị ọzọ.",
  },
  verify: {
    eyebrow: "Nyochaa asambodo onye ọzọ",
    title: "Tinye koodu wee hụ ma ndekọ ọ dabara.",
    body:
      "Tinye koodu e bibiri n’akaebe ya. Ị ga-ahụ ma Henry Onyx Learn nwere ndekọ dabara adaba na nke na-arụ ọrụ — ọ dịghị mkpa akaụntụ iji nyochaa.",
    inputPlaceholder: "Koodu nyocha",
    submit: "Nyochaa",
  },
  catalog: {
    kicker: "Mmemme asambodo",
    title: "Nkuzi ndị na-enye asambodo Henry Onyx ugbu a",
    body: "Mepee mmemme ọ bụla maka usoro ihe ọmụmụ zuru ezu, nkọwa ule na nhọrọ ndebanye aha.",
    emptyPrefix:
      "Enwebeghị nkuzi a na-eduga n’asambodo e bipụtaworo na katalọgụ. Nyochaa mmemme niile na ",
    emptyLinkLabel: "katalọgụ nkuzi",
    emptySuffix: " — anyị ga-akọwapụta ihe akaebe ọhụrụ doro anya ozugbo ha bidoro.",
  },
  footer: {
    ctaAccount: "Asambodo m n’akaụntụ",
    ctaVerification: "Otú nyocha si arụ ọrụ",
  },
};

const LEARN_CERTIFICATIONS_COPY_YO: DeepPartial<LearnCertificationsCopy> = {
  meta: {
    title: "Àwọn ẹ̀rí — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Ẹ̀rí tí a ti ṣe àyẹ̀wò",
    title: "Ẹ̀rí tí o lè fihàn. Ẹnikẹ́ni lè ṣàyẹ̀wò rẹ̀.",
    body:
      "Àwọn ẹ̀kọ́ tó yẹ fún ẹ̀rí máa ń mú bàjì pàtàkì. Parí àwọn ẹ̀kọ́ tí a béèrè, gba àwọn ìdánwò níbi tó yẹ, Henry Onyx Learn yóò sì ṣàkọsílẹ̀ pípari rẹ. Ìwọ yóò gba PDF tí o lè gba sílẹ̀ àti kóòdù ìmúlò gbangba fún àwọn agbanisíṣẹ́, oníbàárà, àti alábàákẹ́gbẹ́.",
    asideFormatLabel: "Ìrísí",
    asideFormatValue: "PDF tí a lè gba sílẹ̀ + ìjápọ̀ gbangba",
    asideVerificationLabel: "Ìmúlò",
    asideVerificationValue: "Ó ṣeé yẹ̀wò pẹ̀lú kóòdù, kò sí àkáyángá tí ó pọndandan",
    asideStorageLabel: "Ìfipamọ́",
    asideStorageValue: "Ó ti wà nínú àkáyángá Henry Onyx rẹ",
  },
  pillars: {
    sectionEyebrow: "Bí ẹ̀rí ṣe ń ṣiṣẹ́",
    whoTitle: "Fún ta ni",
    whoBody:
      "Ẹnikẹ́ni tí ó bá parí ètò tó yẹ — akẹ́kọ̀ọ́ ti gbogbogbò, òṣìṣẹ́ tí a yàn, tàbí alábàákẹ́gbẹ́ — ní àpẹẹrẹ ẹ̀rí kan náà.",
    qualifiedTitle: "Kí ni «tó tó» túmọ̀ sí",
    qualifiedBody:
      "A ń ṣètò ohun tí a béèrè ní gbogbo ẹ̀kọ́ kọ̀ọ̀kan (àwọn ẹ̀kọ́ + nígbà mìíràn ìdánwò tí o gbọ́dọ̀ gbà). Yàrá ìkẹ́kọ̀ọ́ rẹ máa fi àkójọ àyẹ̀wò tó rọrùn hàn títí dé pé gbogbo nǹkan ti pé.",
    afterTitle: "Lẹ́yìn tí o bá gbà á",
    afterBody:
      "Fi kún CV tàbí àwòfaramọ̀ rẹ, pín ìjápọ̀ ìmúlò, tàbí tọ́jú rẹ̀ nínú àkáyángá Henry Onyx lẹ́gbẹ̀ẹ́ ìtàn ìkẹ́kọ̀ọ́ ìyókù.",
  },
  verify: {
    eyebrow: "Ṣàyẹ̀wò ẹ̀rí ẹlòmíràn",
    title: "Tẹ kóòdù sí, kí o sì rí bí àkọsílẹ̀ ṣe bá a mu.",
    body:
      "Tẹ kóòdù tí a tẹ̀ sára ẹ̀rí wọn sí. Ìwọ yóò rí bóyá Henry Onyx Learn ní àkọsílẹ̀ tó bá a mu àti tí ń ṣiṣẹ́ — kò sí àkáyángá tó pọndandan kí o tó ṣàyẹ̀wò.",
    inputPlaceholder: "Kóòdù ìmúlò",
    submit: "Ṣàyẹ̀wò",
  },
  catalog: {
    kicker: "Àwọn ètò ẹ̀rí",
    title: "Àwọn ẹ̀kọ́ tí ó ń fún ọ ní ẹ̀rí Henry Onyx lọ́wọ́lọ́wọ́",
    body: "Ṣí ètò kankan láti rí ètò ẹ̀kọ́ ní kíkún, ẹ̀kúnrẹ́rẹ́ àwọn ìdánwò, àti àwọn àyànfẹ́ ìforúkọsílẹ̀.",
    emptyPrefix:
      "Kò sí ẹ̀kọ́ ọ̀nà-ẹ̀rí tí a tì gbé jáde nínú àkójọpọ̀ ẹ̀kọ́ síbẹ̀. Yẹ gbogbo àwọn ètò nínú ",
    emptyLinkLabel: "àkójọpọ̀ ẹ̀kọ́",
    emptySuffix: " — a yóò fàmì sí àwọn ẹ̀rí tuntun ní ṣíṣe kedere bí wọ́n ti ń jáde.",
  },
  footer: {
    ctaAccount: "Ẹ̀rí mi nínú àkáyángá",
    ctaVerification: "Bí ìmúlò ṣe ń ṣiṣẹ́",
  },
};

const LEARN_CERTIFICATIONS_COPY_HA: DeepPartial<LearnCertificationsCopy> = {
  meta: {
    title: "Takaddun shaida — Henry Onyx Learn",
  },
  hero: {
    eyebrow: "Takaddun shaida da aka tabbatar",
    title: "Takaddun da za ku iya nunawa. Kowa zai iya tabbatar da su.",
    body:
      "Kwasa-kwasai da suka cancanci takaddar shaida suna ɗauke da alama ta musamman. Kammala darussan da ake buƙata, ku ci kowane gwajin da ya zama dole, sai Henry Onyx Learn ya rubuta cikar ku. Kuna karɓa PDF mai sauke da kuma lambar tabbatarwa ta jama’a domin masu ɗaukar aiki, abokan ciniki da abokan haɗin gwiwa.",
    asideFormatLabel: "Salo",
    asideFormatValue: "PDF mai sauke + hanyar jama’a",
    asideVerificationLabel: "Tabbatarwa",
    asideVerificationValue: "Ana iya bincika ta lamba, ba a buƙatar asusu",
    asideStorageLabel: "Adanawa",
    asideStorageValue: "An adana ta a cikin asusunku na Henry Onyx",
  },
  pillars: {
    sectionEyebrow: "Yadda takaddar shaida take aiki",
    whoTitle: "Ga wa take",
    whoBody:
      "Duk wanda ya kammala shirin da ya cancanta — ɗaliban jama’a, ma’aikatan da aka ɗora wa aiki, ko abokan haɗin gwiwa — yana samun matakin shaida iri ɗaya.",
    qualifiedTitle: "Mecece «cancanta» take nufi",
    qualifiedBody:
      "Ana saita buƙatu ga kowane kwas (darussa + wani lokaci gwajin da dole ne a ci). Ɗakin koyo naka yana nuna jerin bincike mai sauƙi har sai komai ya cika.",
    afterTitle: "Bayan ka samu ta",
    afterBody:
      "Ƙara ta a kan CV ko bayanin martabar ku, ku raba hanyar tabbatarwa, ko ku ajiye ta a asusun Henry Onyx tare da sauran tarihin koyon ku.",
  },
  verify: {
    eyebrow: "Tabbatar da takarda ta wani",
    title: "Shigar da lamba, ka ga ko rikodin ya yi daidai.",
    body:
      "Shigar da lambar da aka buga a kan takardar shaidarsu. Za ku ga ko Henry Onyx Learn yana da rikodin da ya yi daidai kuma yake aiki — ba a buƙatar asusu domin bincika.",
    inputPlaceholder: "Lambar tabbatarwa",
    submit: "Tabbatar",
  },
  catalog: {
    kicker: "Shirye-shiryen takarda",
    title: "Kwasa-kwasai da suke ba da takaddar shaida ta Henry Onyx a yanzu",
    body: "Buɗe kowane shiri don cikakken jadawalin koyo, bayanan gwaje-gwaje, da zaɓuɓɓukan rajista.",
    emptyPrefix:
      "Ba a buga wani kwas mai hanyar takaddar shaida a cikin katalogi ba tukuna. Bincika dukkan shirye-shirye a cikin ",
    emptyLinkLabel: "katalogin kwasa-kwasai",
    emptySuffix: " — za mu yi wa sabbin takaddun shaida alama a fili da zaran sun fito.",
  },
  footer: {
    ctaAccount: "Takaddun shaida na a asusu",
    ctaVerification: "Yadda tabbatarwa take aiki",
  },
};

const LEARN_CERTIFICATIONS_LOCALE_MAP: Partial<
  Record<AppLocale, DeepPartial<LearnCertificationsCopy>>
> = {
  fr: LEARN_CERTIFICATIONS_COPY_FR,
  es: LEARN_CERTIFICATIONS_COPY_ES,
  pt: LEARN_CERTIFICATIONS_COPY_PT,
  ar: LEARN_CERTIFICATIONS_COPY_AR,
  de: LEARN_CERTIFICATIONS_COPY_DE,
  it: LEARN_CERTIFICATIONS_COPY_IT,
  zh: LEARN_CERTIFICATIONS_COPY_ZH,
  hi: LEARN_CERTIFICATIONS_COPY_HI,
  ig: LEARN_CERTIFICATIONS_COPY_IG,
  yo: LEARN_CERTIFICATIONS_COPY_YO,
  ha: LEARN_CERTIFICATIONS_COPY_HA,
};

export function getLearnCertificationsCopy(locale: AppLocale): LearnCertificationsCopy {
  const overrides = LEARN_CERTIFICATIONS_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      LEARN_CERTIFICATIONS_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as LearnCertificationsCopy;
  }
  return LEARN_CERTIFICATIONS_COPY_EN;
}

/** @internal */
export function __dangerouslyGetEnglishLearnCertificationsCopy(): LearnCertificationsCopy {
  return LEARN_CERTIFICATIONS_COPY_EN;
}
