import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

export type StudioMiscCopy = {
  paymentGuide: {
    amountDueLabel: string;
    dueLabel: string;
    footerReference: string;
    copyAmount: string;
    verifiedPayee: string;
    transferIntro: string;
    bankLabel: string;
    copyBank: string;
    accountNameLabel: string;
    copyName: string;
    accountNumberLabel: string;
    copyNumber: string;
    awaitingFinance: string;
    stepsHeading: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    needHelpHeading: string;
    emailTag: string;
    whatsappTag: string;
  };
  fileField: {
    addFile: string;
    tapToAddFiles: string;
    dragMultiple: string;
    dragSingle: string;
    filesReadyAriaLabel: string;
    removeAriaLabel: (fileName: string) => string;
    noFileSelected: string;
  };
  referenceAttachments: {
    inspirationLinksTitle: string;
    inspirationLinksDescription: string;
    referencePlaceholder1: string;
    referencePlaceholder2: string;
    referencePlaceholder3: string;
    moodboardsTitle: string;
    moodboardsDescription: string;
    moodboardsFooterHint: string;
  };
  themeToggle: {
    toggleTheme: string;
  };
};

const EN: StudioMiscCopy = {
  paymentGuide: {
    amountDueLabel: "Amount due",
    dueLabel: "Due",
    footerReference: "Reference this exact amount and your project name when you send proof of payment.",
    copyAmount: "Copy amount",
    verifiedPayee: "Verified company payee",
    transferIntro:
      "Transfer only to the HenryCo company account shown below. Each detail has a copy button so nothing has to be retyped.",
    bankLabel: "Bank",
    copyBank: "Copy bank",
    accountNameLabel: "Account name",
    copyName: "Copy name",
    accountNumberLabel: "Account number",
    copyNumber: "Copy number",
    awaitingFinance: "Awaiting finance configuration",
    stepsHeading: "What happens, step by step",
    step1: "Copy the amount and account details from the section above.",
    step2: "Transfer from your bank or company account using your project name as reference.",
    step3: "Upload your receipt or proof below — finance reviews and confirms within one business day.",
    step4: "Once confirmed, your project moves forward and you receive an update by email.",
    needHelpHeading: "Need help before or after payment",
    emailTag: "Email",
    whatsappTag: "WhatsApp",
  },
  fileField: {
    addFile: "Add file",
    tapToAddFiles: "Tap to add files",
    dragMultiple: "Drag and drop here if your browser supports it—multiple files allowed.",
    dragSingle: "Drag and drop one file here, or tap to choose from your device.",
    filesReadyAriaLabel: "Files ready to upload",
    removeAriaLabel: (fileName: string) => `Remove ${fileName}`,
    noFileSelected: "No file selected yet.",
  },
  referenceAttachments: {
    inspirationLinksTitle: "Inspiration links (optional)",
    inspirationLinksDescription:
      "Paste sites you admire, competitors to surpass, or internal PDFs that show tone. Rough links are fine—we care more about direction than perfection.",
    referencePlaceholder1: "https://a-site-whose-pace-you-like.com",
    referencePlaceholder2: "Another reference (optional)",
    referencePlaceholder3: "Third link (optional)",
    moodboardsTitle: "Moodboards, notes, or exports",
    moodboardsDescription:
      "Screenshots, short PDFs, or a messy deck—upload what you have. We only use this to understand you.",
    moodboardsFooterHint:
      "Files stay inside your Studio brief and project record; they are never published to the web.",
  },
  themeToggle: {
    toggleTheme: "Toggle theme",
  },
};

const FR: DeepPartial<StudioMiscCopy> = {
  paymentGuide: {
    amountDueLabel: "Montant dû",
    dueLabel: "Échéance",
    footerReference:
      "Indiquez ce montant exact et le nom de votre projet lorsque vous envoyez la preuve de paiement.",
    copyAmount: "Copier le montant",
    verifiedPayee: "Bénéficiaire d'entreprise vérifié",
    transferIntro:
      "Effectuez le virement uniquement vers le compte d'entreprise HenryCo indiqué ci-dessous. Chaque information dispose d'un bouton de copie afin de ne rien avoir à ressaisir.",
    bankLabel: "Banque",
    copyBank: "Copier la banque",
    accountNameLabel: "Nom du compte",
    copyName: "Copier le nom",
    accountNumberLabel: "Numéro de compte",
    copyNumber: "Copier le numéro",
    awaitingFinance: "En attente de la configuration financière",
    stepsHeading: "Ce qui se passe, étape par étape",
    step1: "Copiez le montant et les coordonnées du compte depuis la section ci-dessus.",
    step2:
      "Effectuez le virement depuis votre compte bancaire ou d'entreprise en utilisant le nom de votre projet comme référence.",
    step3:
      "Téléversez votre reçu ou votre preuve ci-dessous — le service financier vérifie et confirme sous un jour ouvré.",
    step4: "Une fois confirmé, votre projet avance et vous recevez une mise à jour par e-mail.",
    needHelpHeading: "Besoin d'aide avant ou après le paiement",
    emailTag: "E-mail",
    whatsappTag: "WhatsApp",
  },
  fileField: {
    addFile: "Ajouter un fichier",
    tapToAddFiles: "Touchez pour ajouter des fichiers",
    dragMultiple: "Glissez-déposez ici si votre navigateur le permet — plusieurs fichiers autorisés.",
    dragSingle: "Glissez-déposez un fichier ici, ou touchez pour le choisir depuis votre appareil.",
    filesReadyAriaLabel: "Fichiers prêts à téléverser",
    removeAriaLabel: (fileName: string) => `Supprimer ${fileName}`,
    noFileSelected: "Aucun fichier sélectionné pour l'instant.",
  },
  referenceAttachments: {
    inspirationLinksTitle: "Liens d'inspiration (facultatif)",
    inspirationLinksDescription:
      "Collez les sites que vous admirez, les concurrents à dépasser ou les PDF internes qui montrent le ton. Des liens approximatifs conviennent — nous nous soucions plus de la direction que de la perfection.",
    referencePlaceholder1: "https://un-site-dont-vous-aimez-le-rythme.com",
    referencePlaceholder2: "Autre référence (facultatif)",
    referencePlaceholder3: "Troisième lien (facultatif)",
    moodboardsTitle: "Planches d'ambiance, notes ou exports",
    moodboardsDescription:
      "Captures d'écran, courts PDF ou un dossier en vrac — téléversez ce que vous avez. Nous l'utilisons uniquement pour mieux vous comprendre.",
    moodboardsFooterHint:
      "Les fichiers restent dans votre brief Studio et le dossier de votre projet ; ils ne sont jamais publiés sur le web.",
  },
  themeToggle: {
    toggleTheme: "Changer de thème",
  },
};

const ES: DeepPartial<StudioMiscCopy> = {
  paymentGuide: {
    amountDueLabel: "Importe a pagar",
    dueLabel: "Vencimiento",
    footerReference:
      "Indica este importe exacto y el nombre de tu proyecto cuando envíes el comprobante de pago.",
    copyAmount: "Copiar importe",
    verifiedPayee: "Beneficiario de empresa verificado",
    transferIntro:
      "Transfiere solo a la cuenta de empresa de HenryCo que se muestra a continuación. Cada dato tiene un botón de copia para que no tengas que volver a escribir nada.",
    bankLabel: "Banco",
    copyBank: "Copiar banco",
    accountNameLabel: "Nombre de la cuenta",
    copyName: "Copiar nombre",
    accountNumberLabel: "Número de cuenta",
    copyNumber: "Copiar número",
    awaitingFinance: "Esperando la configuración financiera",
    stepsHeading: "Qué ocurre, paso a paso",
    step1: "Copia el importe y los datos de la cuenta de la sección anterior.",
    step2:
      "Transfiere desde tu cuenta bancaria o de empresa usando el nombre de tu proyecto como referencia.",
    step3:
      "Sube tu recibo o comprobante a continuación: finanzas lo revisa y confirma en un día hábil.",
    step4: "Una vez confirmado, tu proyecto avanza y recibes una actualización por correo electrónico.",
    needHelpHeading: "¿Necesitas ayuda antes o después del pago?",
    emailTag: "Correo electrónico",
    whatsappTag: "WhatsApp",
  },
  fileField: {
    addFile: "Añadir archivo",
    tapToAddFiles: "Toca para añadir archivos",
    dragMultiple: "Arrastra y suelta aquí si tu navegador lo admite: se permiten varios archivos.",
    dragSingle: "Arrastra y suelta un archivo aquí, o toca para elegir desde tu dispositivo.",
    filesReadyAriaLabel: "Archivos listos para subir",
    removeAriaLabel: (fileName: string) => `Eliminar ${fileName}`,
    noFileSelected: "Aún no se ha seleccionado ningún archivo.",
  },
  referenceAttachments: {
    inspirationLinksTitle: "Enlaces de inspiración (opcional)",
    inspirationLinksDescription:
      "Pega sitios que admires, competidores a superar o PDF internos que muestren el tono. Los enlaces aproximados están bien: nos importa más la dirección que la perfección.",
    referencePlaceholder1: "https://un-sitio-cuyo-ritmo-te-gusta.com",
    referencePlaceholder2: "Otra referencia (opcional)",
    referencePlaceholder3: "Tercer enlace (opcional)",
    moodboardsTitle: "Moodboards, notas o exportaciones",
    moodboardsDescription:
      "Capturas de pantalla, PDF breves o una presentación desordenada: sube lo que tengas. Solo lo usamos para entenderte.",
    moodboardsFooterHint:
      "Los archivos permanecen dentro de tu brief de Studio y el registro de tu proyecto; nunca se publican en la web.",
  },
  themeToggle: {
    toggleTheme: "Cambiar tema",
  },
};

const PT: DeepPartial<StudioMiscCopy> = {
  paymentGuide: {
    amountDueLabel: "Valor a pagar",
    dueLabel: "Vencimento",
    footerReference:
      "Informe este valor exato e o nome do seu projeto ao enviar o comprovante de pagamento.",
    copyAmount: "Copiar valor",
    verifiedPayee: "Beneficiário empresarial verificado",
    transferIntro:
      "Transfira apenas para a conta empresarial da HenryCo mostrada abaixo. Cada dado tem um botão de cópia para que nada precise ser digitado novamente.",
    bankLabel: "Banco",
    copyBank: "Copiar banco",
    accountNameLabel: "Nome da conta",
    copyName: "Copiar nome",
    accountNumberLabel: "Número da conta",
    copyNumber: "Copiar número",
    awaitingFinance: "Aguardando configuração financeira",
    stepsHeading: "O que acontece, passo a passo",
    step1: "Copie o valor e os dados da conta da seção acima.",
    step2:
      "Transfira da sua conta bancária ou empresarial usando o nome do seu projeto como referência.",
    step3:
      "Envie seu recibo ou comprovante abaixo — o financeiro analisa e confirma em até um dia útil.",
    step4: "Após a confirmação, seu projeto avança e você recebe uma atualização por e-mail.",
    needHelpHeading: "Precisa de ajuda antes ou depois do pagamento",
    emailTag: "E-mail",
    whatsappTag: "WhatsApp",
  },
  fileField: {
    addFile: "Adicionar arquivo",
    tapToAddFiles: "Toque para adicionar arquivos",
    dragMultiple: "Arraste e solte aqui se o seu navegador permitir — vários arquivos são aceitos.",
    dragSingle: "Arraste e solte um arquivo aqui, ou toque para escolher no seu dispositivo.",
    filesReadyAriaLabel: "Arquivos prontos para envio",
    removeAriaLabel: (fileName: string) => `Remover ${fileName}`,
    noFileSelected: "Nenhum arquivo selecionado ainda.",
  },
  referenceAttachments: {
    inspirationLinksTitle: "Links de inspiração (opcional)",
    inspirationLinksDescription:
      "Cole sites que você admira, concorrentes a superar ou PDFs internos que mostrem o tom. Links aproximados são suficientes — importamo-nos mais com a direção do que com a perfeição.",
    referencePlaceholder1: "https://um-site-cujo-ritmo-voce-gosta.com",
    referencePlaceholder2: "Outra referência (opcional)",
    referencePlaceholder3: "Terceiro link (opcional)",
    moodboardsTitle: "Moodboards, notas ou exportações",
    moodboardsDescription:
      "Capturas de tela, PDFs curtos ou uma apresentação bagunçada — envie o que você tiver. Usamos isso apenas para entender você.",
    moodboardsFooterHint:
      "Os arquivos permanecem no seu brief do Studio e no registro do projeto; nunca são publicados na web.",
  },
  themeToggle: {
    toggleTheme: "Alternar tema",
  },
};

const AR: DeepPartial<StudioMiscCopy> = {
  paymentGuide: {
    amountDueLabel: "المبلغ المستحق",
    dueLabel: "تاريخ الاستحقاق",
    footerReference: "أشِر إلى هذا المبلغ بالضبط واسم مشروعك عند إرسال إثبات الدفع.",
    copyAmount: "نسخ المبلغ",
    verifiedPayee: "مستفيد شركة موثّق",
    transferIntro:
      "حوِّل فقط إلى حساب شركة HenryCo الموضّح أدناه. لكل تفصيل زر نسخ حتى لا تضطر إلى إعادة كتابة أي شيء.",
    bankLabel: "البنك",
    copyBank: "نسخ البنك",
    accountNameLabel: "اسم الحساب",
    copyName: "نسخ الاسم",
    accountNumberLabel: "رقم الحساب",
    copyNumber: "نسخ الرقم",
    awaitingFinance: "في انتظار إعداد المالية",
    stepsHeading: "ما الذي يحدث، خطوة بخطوة",
    step1: "انسخ المبلغ وتفاصيل الحساب من القسم أعلاه.",
    step2: "حوِّل من حسابك البنكي أو حساب شركتك مستخدمًا اسم مشروعك كمرجع.",
    step3: "ارفع إيصالك أو إثباتك أدناه — يراجعه قسم المالية ويؤكده خلال يوم عمل واحد.",
    step4: "بمجرد التأكيد، يتقدم مشروعك وتتلقى تحديثًا عبر البريد الإلكتروني.",
    needHelpHeading: "هل تحتاج مساعدة قبل الدفع أو بعده",
    emailTag: "البريد الإلكتروني",
    whatsappTag: "واتساب",
  },
  fileField: {
    addFile: "إضافة ملف",
    tapToAddFiles: "اضغط لإضافة ملفات",
    dragMultiple: "اسحب وأفلت هنا إذا كان متصفحك يدعم ذلك — يُسمح بعدة ملفات.",
    dragSingle: "اسحب وأفلت ملفًا واحدًا هنا، أو اضغط لاختياره من جهازك.",
    filesReadyAriaLabel: "ملفات جاهزة للرفع",
    removeAriaLabel: (fileName: string) => `إزالة ${fileName}`,
    noFileSelected: "لم يتم اختيار أي ملف بعد.",
  },
  referenceAttachments: {
    inspirationLinksTitle: "روابط إلهام (اختياري)",
    inspirationLinksDescription:
      "الصق المواقع التي تُعجبك، أو المنافسين الذين تريد التفوق عليهم، أو ملفات PDF داخلية تُظهر النبرة. الروابط التقريبية مقبولة — يهمنا الاتجاه أكثر من الكمال.",
    referencePlaceholder1: "https://موقع-يعجبك-إيقاعه.com",
    referencePlaceholder2: "مرجع آخر (اختياري)",
    referencePlaceholder3: "رابط ثالث (اختياري)",
    moodboardsTitle: "لوحات إلهام أو ملاحظات أو ملفات مُصدَّرة",
    moodboardsDescription:
      "لقطات شاشة، أو ملفات PDF قصيرة، أو عرض غير مرتب — ارفع ما لديك. نستخدم هذا فقط لفهمك.",
    moodboardsFooterHint:
      "تبقى الملفات داخل موجز Studio وسجل مشروعك؛ ولا يتم نشرها على الويب أبدًا.",
  },
  themeToggle: {
    toggleTheme: "تبديل السمة",
  },
};

const DE: DeepPartial<StudioMiscCopy> = {
  paymentGuide: {
    amountDueLabel: "Fälliger Betrag",
    dueLabel: "Fällig",
    footerReference:
      "Geben Sie genau diesen Betrag und den Namen Ihres Projekts an, wenn Sie den Zahlungsnachweis senden.",
    copyAmount: "Betrag kopieren",
    verifiedPayee: "Verifizierter Firmenzahlungsempfänger",
    transferIntro:
      "Überweisen Sie nur auf das unten angezeigte HenryCo-Firmenkonto. Jede Angabe hat eine Kopierschaltfläche, damit nichts neu eingegeben werden muss.",
    bankLabel: "Bank",
    copyBank: "Bank kopieren",
    accountNameLabel: "Kontoname",
    copyName: "Name kopieren",
    accountNumberLabel: "Kontonummer",
    copyNumber: "Nummer kopieren",
    awaitingFinance: "Warten auf die Finanzkonfiguration",
    stepsHeading: "Was passiert, Schritt für Schritt",
    step1: "Kopieren Sie den Betrag und die Kontodaten aus dem Abschnitt oben.",
    step2:
      "Überweisen Sie von Ihrem Bank- oder Firmenkonto und verwenden Sie Ihren Projektnamen als Verwendungszweck.",
    step3:
      "Laden Sie unten Ihre Quittung oder Ihren Nachweis hoch — die Finanzabteilung prüft und bestätigt innerhalb eines Werktags.",
    step4: "Nach der Bestätigung geht Ihr Projekt weiter und Sie erhalten eine Aktualisierung per E-Mail.",
    needHelpHeading: "Brauchen Sie Hilfe vor oder nach der Zahlung",
    emailTag: "E-Mail",
    whatsappTag: "WhatsApp",
  },
  fileField: {
    addFile: "Datei hinzufügen",
    tapToAddFiles: "Tippen, um Dateien hinzuzufügen",
    dragMultiple: "Ziehen und ablegen, wenn Ihr Browser das unterstützt — mehrere Dateien erlaubt.",
    dragSingle: "Ziehen Sie eine Datei hierher oder tippen Sie, um sie von Ihrem Gerät auszuwählen.",
    filesReadyAriaLabel: "Dateien bereit zum Hochladen",
    removeAriaLabel: (fileName: string) => `${fileName} entfernen`,
    noFileSelected: "Noch keine Datei ausgewählt.",
  },
  referenceAttachments: {
    inspirationLinksTitle: "Inspirationslinks (optional)",
    inspirationLinksDescription:
      "Fügen Sie Websites ein, die Sie bewundern, Mitbewerber, die Sie übertreffen wollen, oder interne PDFs, die den Ton zeigen. Grobe Links sind in Ordnung — uns ist die Richtung wichtiger als Perfektion.",
    referencePlaceholder1: "https://eine-seite-deren-tempo-ihnen-gefaellt.com",
    referencePlaceholder2: "Weitere Referenz (optional)",
    referencePlaceholder3: "Dritter Link (optional)",
    moodboardsTitle: "Moodboards, Notizen oder Exporte",
    moodboardsDescription:
      "Screenshots, kurze PDFs oder ein unordentliches Deck — laden Sie hoch, was Sie haben. Wir verwenden dies nur, um Sie zu verstehen.",
    moodboardsFooterHint:
      "Dateien bleiben in Ihrem Studio-Briefing und im Projektdatensatz; sie werden niemals im Web veröffentlicht.",
  },
  themeToggle: {
    toggleTheme: "Design wechseln",
  },
};

const IT: DeepPartial<StudioMiscCopy> = {
  paymentGuide: {
    amountDueLabel: "Importo dovuto",
    dueLabel: "Scadenza",
    footerReference:
      "Indica questo importo esatto e il nome del tuo progetto quando invii la prova di pagamento.",
    copyAmount: "Copia importo",
    verifiedPayee: "Beneficiario aziendale verificato",
    transferIntro:
      "Effettua il bonifico solo sul conto aziendale HenryCo mostrato di seguito. Ogni dato ha un pulsante di copia, così non devi riscrivere nulla.",
    bankLabel: "Banca",
    copyBank: "Copia banca",
    accountNameLabel: "Nome del conto",
    copyName: "Copia nome",
    accountNumberLabel: "Numero di conto",
    copyNumber: "Copia numero",
    awaitingFinance: "In attesa della configurazione finanziaria",
    stepsHeading: "Cosa succede, passo dopo passo",
    step1: "Copia l'importo e i dati del conto dalla sezione qui sopra.",
    step2:
      "Effettua il bonifico dal tuo conto bancario o aziendale usando il nome del tuo progetto come causale.",
    step3:
      "Carica la ricevuta o la prova qui sotto — l'ufficio finanziario verifica e conferma entro un giorno lavorativo.",
    step4: "Una volta confermato, il tuo progetto procede e ricevi un aggiornamento via e-mail.",
    needHelpHeading: "Hai bisogno di aiuto prima o dopo il pagamento",
    emailTag: "E-mail",
    whatsappTag: "WhatsApp",
  },
  fileField: {
    addFile: "Aggiungi file",
    tapToAddFiles: "Tocca per aggiungere file",
    dragMultiple: "Trascina e rilascia qui se il tuo browser lo supporta — sono consentiti più file.",
    dragSingle: "Trascina e rilascia un file qui, oppure tocca per sceglierlo dal tuo dispositivo.",
    filesReadyAriaLabel: "File pronti per il caricamento",
    removeAriaLabel: (fileName: string) => `Rimuovi ${fileName}`,
    noFileSelected: "Nessun file ancora selezionato.",
  },
  referenceAttachments: {
    inspirationLinksTitle: "Link di ispirazione (facoltativo)",
    inspirationLinksDescription:
      "Incolla i siti che ammiri, i concorrenti da superare o i PDF interni che mostrano il tono. Vanno bene anche link approssimativi — ci interessa più la direzione che la perfezione.",
    referencePlaceholder1: "https://un-sito-il-cui-ritmo-ti-piace.com",
    referencePlaceholder2: "Altro riferimento (facoltativo)",
    referencePlaceholder3: "Terzo link (facoltativo)",
    moodboardsTitle: "Moodboard, note o esportazioni",
    moodboardsDescription:
      "Screenshot, brevi PDF o una presentazione disordinata — carica ciò che hai. Lo usiamo solo per capirti.",
    moodboardsFooterHint:
      "I file restano nel tuo brief di Studio e nel registro del progetto; non vengono mai pubblicati sul web.",
  },
  themeToggle: {
    toggleTheme: "Cambia tema",
  },
};

const ZH: DeepPartial<StudioMiscCopy> = {
  paymentGuide: {
    amountDueLabel: "应付金额",
    dueLabel: "到期",
    footerReference: "发送付款凭证时，请注明这个确切金额和您的项目名称。",
    copyAmount: "复制金额",
    verifiedPayee: "已验证的企业收款方",
    transferIntro:
      "请仅转账至下方显示的 HenryCo 企业账户。每项信息都有复制按钮，无需重新输入。",
    bankLabel: "银行",
    copyBank: "复制银行",
    accountNameLabel: "账户名称",
    copyName: "复制名称",
    accountNumberLabel: "账号",
    copyNumber: "复制账号",
    awaitingFinance: "等待财务配置",
    stepsHeading: "流程逐步说明",
    step1: "从上方部分复制金额和账户信息。",
    step2: "从您的银行账户或企业账户转账，并以您的项目名称作为附言。",
    step3: "在下方上传您的收据或凭证 — 财务部门将在一个工作日内审核并确认。",
    step4: "确认后，您的项目将继续推进，您会通过电子邮件收到更新。",
    needHelpHeading: "付款前后需要帮助",
    emailTag: "电子邮件",
    whatsappTag: "WhatsApp",
  },
  fileField: {
    addFile: "添加文件",
    tapToAddFiles: "点按以添加文件",
    dragMultiple: "如果您的浏览器支持，可将文件拖放到此处 — 允许多个文件。",
    dragSingle: "将一个文件拖放到此处，或点按从您的设备中选择。",
    filesReadyAriaLabel: "待上传的文件",
    removeAriaLabel: (fileName: string) => `移除 ${fileName}`,
    noFileSelected: "尚未选择任何文件。",
  },
  referenceAttachments: {
    inspirationLinksTitle: "灵感链接（可选）",
    inspirationLinksDescription:
      "粘贴您欣赏的网站、想要超越的竞争对手，或体现风格的内部 PDF。大致的链接即可 — 我们更看重方向而非完美。",
    referencePlaceholder1: "https://一个您喜欢其节奏的网站.com",
    referencePlaceholder2: "另一个参考（可选）",
    referencePlaceholder3: "第三个链接（可选）",
    moodboardsTitle: "情绪板、笔记或导出文件",
    moodboardsDescription:
      "截图、简短的 PDF，或一份杂乱的方案 — 上传您拥有的内容。我们仅用它来了解您。",
    moodboardsFooterHint:
      "文件保留在您的 Studio 简报和项目记录中；绝不会发布到网络上。",
  },
  themeToggle: {
    toggleTheme: "切换主题",
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<StudioMiscCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
};
// ig, yo, ha, hi are intentionally OMITTED -> fall back to EN (human-translation only).

export function getStudioMiscCopy(locale: AppLocale): StudioMiscCopy {
  const o = LOCALE_MAP[locale];
  if (o)
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      o as unknown as Record<string, unknown>
    ) as unknown as StudioMiscCopy;
  return EN;
}
