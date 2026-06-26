import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * Copy for the @henryco/payment-surface shared components (the /pay route
 * composition reused across every division). Each top-level key maps to one
 * source file/component; nested keys are the individual user-visible strings.
 *
 * Pattern A module: author EN + fr/es/pt/ar/de/it/zh only. ig/yo/ha/hi are
 * intentionally omitted and fall back to EN (human-translation only).
 *
 * The brand token "HenryCo" is kept VERBATIM in every locale.
 */
export type PaymentSurfaceUiCopy = {
  fileField: {
    addFile: string;
    tapToAddFiles: string;
    dropMultiple: string;
    dropSingle: string;
    filesReadyLabel: string;
    removeFile: (fileName: string) => string;
    noFileSelected: string;
  };
  guide: {
    amountDue: string;
    due: string;
    footerReference: string;
    copyAmount: string;
    verifiedPayee: string;
    transferOnly: string;
    bankLabel: string;
    copyBank: string;
    accountNameLabel: string;
    copyName: string;
    accountNumberLabel: string;
    copyNumber: string;
    awaitingConfiguration: string;
    stepsHeading: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    supportHeading: string;
    emailLabel: string;
    whatsappLabel: string;
  };
  proofUpload: {
    eyebrowProcessing: string;
    eyebrowSend: string;
    intro: string;
    fieldTitle: string;
    fieldDescription: string;
    fieldFooterHint: string;
    submitLabel: string;
    pendingLabel: string;
    successLabel: string;
  };
  surface: {
    bodyPending: string;
    bodyProcessing: string;
    bodyPaid: string;
    bodyFailed: string;
    bodyRefunded: string;
    bodyCancelled: string;
    defaultInstructions: string;
    defaultProofHint: string;
    workspaceHeading: (label: string, recordTitle: string) => string;
    paymentFallback: string;
    rankEyebrow: (index: number, total: number) => string;
    amountDue: string;
    status: string;
    due: string;
    context: string;
    footerReference: string;
    guideDefaultTitle: string;
    duePrefix: (dueLabel: string) => string;
  };
};

const EN: PaymentSurfaceUiCopy = {
  fileField: {
    addFile: "Add file",
    tapToAddFiles: "Tap to add files",
    dropMultiple: "Drag and drop here if your browser supports it — multiple files allowed.",
    dropSingle: "Drag and drop one file here, or tap to choose from your device.",
    filesReadyLabel: "Files ready to upload",
    removeFile: (fileName: string) => `Remove ${fileName}`,
    noFileSelected: "No file selected yet.",
  },
  guide: {
    amountDue: "Amount due",
    due: "Due",
    footerReference: "Reference this exact amount and your record name when you send proof of payment.",
    copyAmount: "Copy amount",
    verifiedPayee: "Verified company payee",
    transferOnly:
      "Transfer only to the HenryCo company account shown below. Each detail has a copy button so nothing has to be retyped.",
    bankLabel: "Bank",
    copyBank: "Copy bank",
    accountNameLabel: "Account name",
    copyName: "Copy name",
    accountNumberLabel: "Account number",
    copyNumber: "Copy number",
    awaitingConfiguration: "Awaiting finance configuration",
    stepsHeading: "What happens, step by step",
    step1: "Copy the amount and account details from the section above.",
    step2: "Transfer from your bank or company account using your record name as reference.",
    step3: "Upload your receipt or proof below — finance reviews and confirms within one business day.",
    step4: "Once confirmed, your record advances and you receive an update by email.",
    supportHeading: "Need help before or after payment",
    emailLabel: "Email",
    whatsappLabel: "WhatsApp",
  },
  proofUpload: {
    eyebrowProcessing: "Attach the missing proof",
    eyebrowSend: "Send your proof",
    intro:
      "Upload your receipt or alert. Finance reviews and confirms within one business day — this page will update automatically.",
    fieldTitle: "Payment proof file",
    fieldDescription: "Bank receipt, debit alert screenshot, or PDF — must show amount, date, and destination.",
    fieldFooterHint: "We trim the file name to a clean label finance can scan quickly.",
    submitLabel: "Submit payment proof",
    pendingLabel: "Uploading…",
    successLabel: "Proof received",
  },
  surface: {
    bodyPending:
      "Send your payment using the verified company details below, then attach your proof so finance can confirm and unlock the next step.",
    bodyProcessing: "Payment proof received. Finance is verifying — you can track confirmation here.",
    bodyPaid: "Payment confirmed. Thank you — your record stays moving.",
    bodyFailed:
      "We could not match this transfer. Please re-upload your proof or contact finance support below.",
    bodyRefunded: "Refund issued. The transfer was returned to the source account.",
    bodyCancelled: "This payment was cancelled. No further action is needed.",
    defaultInstructions:
      "Bank transfer is the active payment method. Proof can be a debit alert screenshot, bank receipt, or PDF — anything showing amount, date, and destination.",
    defaultProofHint:
      "After sending, attach the proof below — finance reviews within one business day. You'll see the status flip to processing here as soon as the upload lands.",
    workspaceHeading: (label: string, recordTitle: string) => `Payment workspace · ${label} · ${recordTitle}`,
    paymentFallback: "Payment",
    rankEyebrow: (index: number, total: number) => `Payment · ${index} of ${total}`,
    amountDue: "Amount due",
    status: "Status",
    due: "Due",
    context: "Context",
    footerReference: "Reference your record name on the transfer.",
    guideDefaultTitle: "Send the payment using the verified company account",
    duePrefix: (dueLabel: string) => `Due ${dueLabel}`,
  },
};

const FR: DeepPartial<PaymentSurfaceUiCopy> = {
  fileField: {
    addFile: "Ajouter un fichier",
    tapToAddFiles: "Appuyez pour ajouter des fichiers",
    dropMultiple:
      "Glissez-déposez ici si votre navigateur le permet — plusieurs fichiers autorisés.",
    dropSingle:
      "Glissez-déposez un fichier ici, ou appuyez pour le choisir sur votre appareil.",
    filesReadyLabel: "Fichiers prêts à être envoyés",
    removeFile: (fileName: string) => `Supprimer ${fileName}`,
    noFileSelected: "Aucun fichier sélectionné pour le moment.",
  },
  guide: {
    amountDue: "Montant dû",
    due: "Échéance",
    footerReference:
      "Indiquez ce montant exact et le nom de votre dossier lorsque vous envoyez la preuve de paiement.",
    copyAmount: "Copier le montant",
    verifiedPayee: "Bénéficiaire vérifié de l'entreprise",
    transferOnly:
      "Effectuez le virement uniquement vers le compte de l'entreprise HenryCo indiqué ci-dessous. Chaque détail dispose d'un bouton de copie, rien n'a besoin d'être ressaisi.",
    bankLabel: "Banque",
    copyBank: "Copier la banque",
    accountNameLabel: "Nom du compte",
    copyName: "Copier le nom",
    accountNumberLabel: "Numéro de compte",
    copyNumber: "Copier le numéro",
    awaitingConfiguration: "En attente de la configuration financière",
    stepsHeading: "Ce qui se passe, étape par étape",
    step1: "Copiez le montant et les coordonnées du compte de la section ci-dessus.",
    step2:
      "Effectuez le virement depuis votre compte bancaire ou professionnel en utilisant le nom de votre dossier comme référence.",
    step3:
      "Téléversez votre reçu ou votre preuve ci-dessous — le service financier examine et confirme sous un jour ouvré.",
    step4:
      "Une fois confirmé, votre dossier avance et vous recevez une mise à jour par e-mail.",
    supportHeading: "Besoin d'aide avant ou après le paiement",
    emailLabel: "E-mail",
    whatsappLabel: "WhatsApp",
  },
  proofUpload: {
    eyebrowProcessing: "Joindre la preuve manquante",
    eyebrowSend: "Envoyez votre preuve",
    intro:
      "Téléversez votre reçu ou votre alerte. Le service financier examine et confirme sous un jour ouvré — cette page se mettra à jour automatiquement.",
    fieldTitle: "Fichier de preuve de paiement",
    fieldDescription:
      "Reçu bancaire, capture d'écran d'alerte de débit ou PDF — doit indiquer le montant, la date et le destinataire.",
    fieldFooterHint:
      "Nous raccourcissons le nom du fichier en une étiquette claire que le service financier peut parcourir rapidement.",
    submitLabel: "Soumettre la preuve de paiement",
    pendingLabel: "Téléversement…",
    successLabel: "Preuve reçue",
  },
  surface: {
    bodyPending:
      "Envoyez votre paiement en utilisant les coordonnées vérifiées de l'entreprise ci-dessous, puis joignez votre preuve afin que le service financier puisse confirmer et débloquer l'étape suivante.",
    bodyProcessing:
      "Preuve de paiement reçue. Le service financier procède à la vérification — vous pouvez suivre la confirmation ici.",
    bodyPaid: "Paiement confirmé. Merci — votre dossier continue d'avancer.",
    bodyFailed:
      "Nous n'avons pas pu rapprocher ce virement. Veuillez téléverser à nouveau votre preuve ou contacter le support financier ci-dessous.",
    bodyRefunded: "Remboursement émis. Le virement a été renvoyé sur le compte d'origine.",
    bodyCancelled: "Ce paiement a été annulé. Aucune autre action n'est requise.",
    defaultInstructions:
      "Le virement bancaire est le mode de paiement actif. La preuve peut être une capture d'écran d'alerte de débit, un reçu bancaire ou un PDF — tout document indiquant le montant, la date et le destinataire.",
    defaultProofHint:
      "Après l'envoi, joignez la preuve ci-dessous — le service financier examine sous un jour ouvré. Le statut passera à « en traitement » ici dès que le téléversement sera reçu.",
    workspaceHeading: (label: string, recordTitle: string) =>
      `Espace de paiement · ${label} · ${recordTitle}`,
    paymentFallback: "Paiement",
    rankEyebrow: (index: number, total: number) => `Paiement · ${index} sur ${total}`,
    amountDue: "Montant dû",
    status: "Statut",
    due: "Échéance",
    context: "Contexte",
    footerReference: "Indiquez le nom de votre dossier lors du virement.",
    guideDefaultTitle: "Effectuez le paiement en utilisant le compte vérifié de l'entreprise",
    duePrefix: (dueLabel: string) => `Échéance ${dueLabel}`,
  },
};

const ES: DeepPartial<PaymentSurfaceUiCopy> = {
  fileField: {
    addFile: "Añadir archivo",
    tapToAddFiles: "Toca para añadir archivos",
    dropMultiple:
      "Arrastra y suelta aquí si tu navegador lo permite — se admiten varios archivos.",
    dropSingle:
      "Arrastra y suelta un archivo aquí, o toca para elegir desde tu dispositivo.",
    filesReadyLabel: "Archivos listos para subir",
    removeFile: (fileName: string) => `Quitar ${fileName}`,
    noFileSelected: "Aún no se ha seleccionado ningún archivo.",
  },
  guide: {
    amountDue: "Importe a pagar",
    due: "Vencimiento",
    footerReference:
      "Indica este importe exacto y el nombre de tu registro al enviar el comprobante de pago.",
    copyAmount: "Copiar importe",
    verifiedPayee: "Beneficiario verificado de la empresa",
    transferOnly:
      "Transfiere únicamente a la cuenta de la empresa HenryCo que se muestra a continuación. Cada dato tiene un botón de copiar, así no hay que volver a escribir nada.",
    bankLabel: "Banco",
    copyBank: "Copiar banco",
    accountNameLabel: "Nombre de la cuenta",
    copyName: "Copiar nombre",
    accountNumberLabel: "Número de cuenta",
    copyNumber: "Copiar número",
    awaitingConfiguration: "A la espera de la configuración financiera",
    stepsHeading: "Qué ocurre, paso a paso",
    step1: "Copia el importe y los datos de la cuenta de la sección anterior.",
    step2:
      "Transfiere desde tu cuenta bancaria o de empresa usando el nombre de tu registro como referencia.",
    step3:
      "Sube tu recibo o comprobante abajo — el área financiera revisa y confirma en un día hábil.",
    step4:
      "Una vez confirmado, tu registro avanza y recibes una actualización por correo electrónico.",
    supportHeading: "¿Necesitas ayuda antes o después del pago?",
    emailLabel: "Correo electrónico",
    whatsappLabel: "WhatsApp",
  },
  proofUpload: {
    eyebrowProcessing: "Adjunta el comprobante que falta",
    eyebrowSend: "Envía tu comprobante",
    intro:
      "Sube tu recibo o alerta. El área financiera revisa y confirma en un día hábil — esta página se actualizará automáticamente.",
    fieldTitle: "Archivo de comprobante de pago",
    fieldDescription:
      "Recibo bancario, captura de la alerta de débito o PDF — debe mostrar importe, fecha y destino.",
    fieldFooterHint:
      "Recortamos el nombre del archivo a una etiqueta clara que el área financiera puede revisar rápidamente.",
    submitLabel: "Enviar comprobante de pago",
    pendingLabel: "Subiendo…",
    successLabel: "Comprobante recibido",
  },
  surface: {
    bodyPending:
      "Realiza tu pago usando los datos verificados de la empresa que aparecen abajo y luego adjunta tu comprobante para que el área financiera pueda confirmar y desbloquear el siguiente paso.",
    bodyProcessing:
      "Comprobante de pago recibido. El área financiera está verificando — puedes seguir la confirmación aquí.",
    bodyPaid: "Pago confirmado. Gracias — tu registro sigue avanzando.",
    bodyFailed:
      "No pudimos relacionar esta transferencia. Vuelve a subir tu comprobante o contacta con el soporte financiero abajo.",
    bodyRefunded: "Reembolso emitido. La transferencia se devolvió a la cuenta de origen.",
    bodyCancelled: "Este pago fue cancelado. No se necesita ninguna otra acción.",
    defaultInstructions:
      "La transferencia bancaria es el método de pago activo. El comprobante puede ser una captura de la alerta de débito, un recibo bancario o un PDF — cualquier documento que muestre importe, fecha y destino.",
    defaultProofHint:
      "Después de enviar, adjunta el comprobante abajo — el área financiera revisa en un día hábil. Verás cambiar el estado a «en proceso» aquí en cuanto se reciba la subida.",
    workspaceHeading: (label: string, recordTitle: string) =>
      `Espacio de pago · ${label} · ${recordTitle}`,
    paymentFallback: "Pago",
    rankEyebrow: (index: number, total: number) => `Pago · ${index} de ${total}`,
    amountDue: "Importe a pagar",
    status: "Estado",
    due: "Vencimiento",
    context: "Contexto",
    footerReference: "Indica el nombre de tu registro en la transferencia.",
    guideDefaultTitle: "Realiza el pago usando la cuenta verificada de la empresa",
    duePrefix: (dueLabel: string) => `Vencimiento ${dueLabel}`,
  },
};

const PT: DeepPartial<PaymentSurfaceUiCopy> = {
  fileField: {
    addFile: "Adicionar arquivo",
    tapToAddFiles: "Toque para adicionar arquivos",
    dropMultiple:
      "Arraste e solte aqui se o seu navegador permitir — vários arquivos são aceitos.",
    dropSingle:
      "Arraste e solte um arquivo aqui, ou toque para escolher no seu dispositivo.",
    filesReadyLabel: "Arquivos prontos para envio",
    removeFile: (fileName: string) => `Remover ${fileName}`,
    noFileSelected: "Nenhum arquivo selecionado ainda.",
  },
  guide: {
    amountDue: "Valor a pagar",
    due: "Vencimento",
    footerReference:
      "Informe este valor exato e o nome do seu registro ao enviar o comprovante de pagamento.",
    copyAmount: "Copiar valor",
    verifiedPayee: "Beneficiário verificado da empresa",
    transferOnly:
      "Transfira apenas para a conta da empresa HenryCo mostrada abaixo. Cada detalhe tem um botão de copiar, então nada precisa ser digitado novamente.",
    bankLabel: "Banco",
    copyBank: "Copiar banco",
    accountNameLabel: "Nome da conta",
    copyName: "Copiar nome",
    accountNumberLabel: "Número da conta",
    copyNumber: "Copiar número",
    awaitingConfiguration: "Aguardando a configuração financeira",
    stepsHeading: "O que acontece, passo a passo",
    step1: "Copie o valor e os dados da conta da seção acima.",
    step2:
      "Transfira da sua conta bancária ou empresarial usando o nome do seu registro como referência.",
    step3:
      "Envie seu recibo ou comprovante abaixo — o financeiro analisa e confirma em um dia útil.",
    step4:
      "Após a confirmação, seu registro avança e você recebe uma atualização por e-mail.",
    supportHeading: "Precisa de ajuda antes ou depois do pagamento",
    emailLabel: "E-mail",
    whatsappLabel: "WhatsApp",
  },
  proofUpload: {
    eyebrowProcessing: "Anexe o comprovante que falta",
    eyebrowSend: "Envie seu comprovante",
    intro:
      "Envie seu recibo ou alerta. O financeiro analisa e confirma em um dia útil — esta página será atualizada automaticamente.",
    fieldTitle: "Arquivo de comprovante de pagamento",
    fieldDescription:
      "Recibo bancário, captura do alerta de débito ou PDF — deve mostrar valor, data e destino.",
    fieldFooterHint:
      "Encurtamos o nome do arquivo para um rótulo limpo que o financeiro pode revisar rapidamente.",
    submitLabel: "Enviar comprovante de pagamento",
    pendingLabel: "Enviando…",
    successLabel: "Comprovante recebido",
  },
  surface: {
    bodyPending:
      "Faça seu pagamento usando os dados verificados da empresa abaixo e depois anexe seu comprovante para que o financeiro possa confirmar e liberar a próxima etapa.",
    bodyProcessing:
      "Comprovante de pagamento recebido. O financeiro está verificando — você pode acompanhar a confirmação aqui.",
    bodyPaid: "Pagamento confirmado. Obrigado — seu registro continua avançando.",
    bodyFailed:
      "Não conseguimos identificar esta transferência. Envie novamente seu comprovante ou entre em contato com o suporte financeiro abaixo.",
    bodyRefunded: "Reembolso emitido. A transferência foi devolvida à conta de origem.",
    bodyCancelled: "Este pagamento foi cancelado. Nenhuma outra ação é necessária.",
    defaultInstructions:
      "A transferência bancária é o método de pagamento ativo. O comprovante pode ser uma captura do alerta de débito, um recibo bancário ou um PDF — qualquer documento que mostre valor, data e destino.",
    defaultProofHint:
      "Após o envio, anexe o comprovante abaixo — o financeiro analisa em um dia útil. Você verá o status mudar para «em processamento» aqui assim que o envio for recebido.",
    workspaceHeading: (label: string, recordTitle: string) =>
      `Espaço de pagamento · ${label} · ${recordTitle}`,
    paymentFallback: "Pagamento",
    rankEyebrow: (index: number, total: number) => `Pagamento · ${index} de ${total}`,
    amountDue: "Valor a pagar",
    status: "Status",
    due: "Vencimento",
    context: "Contexto",
    footerReference: "Informe o nome do seu registro na transferência.",
    guideDefaultTitle: "Faça o pagamento usando a conta verificada da empresa",
    duePrefix: (dueLabel: string) => `Vencimento ${dueLabel}`,
  },
};

const AR: DeepPartial<PaymentSurfaceUiCopy> = {
  fileField: {
    addFile: "إضافة ملف",
    tapToAddFiles: "اضغط لإضافة ملفات",
    dropMultiple: "اسحب وأفلت هنا إذا كان متصفحك يدعم ذلك — يُسمح بملفات متعددة.",
    dropSingle: "اسحب وأفلت ملفًا واحدًا هنا، أو اضغط للاختيار من جهازك.",
    filesReadyLabel: "ملفات جاهزة للرفع",
    removeFile: (fileName: string) => `إزالة ${fileName}`,
    noFileSelected: "لم يتم اختيار أي ملف بعد.",
  },
  guide: {
    amountDue: "المبلغ المستحق",
    due: "تاريخ الاستحقاق",
    footerReference: "اذكر هذا المبلغ بالضبط واسم سجلك عند إرسال إثبات الدفع.",
    copyAmount: "نسخ المبلغ",
    verifiedPayee: "مستفيد الشركة المُوثَّق",
    transferOnly:
      "حوّل فقط إلى حساب شركة HenryCo الموضح أدناه. لكل تفصيل زر نسخ حتى لا تضطر إلى إعادة كتابة أي شيء.",
    bankLabel: "البنك",
    copyBank: "نسخ البنك",
    accountNameLabel: "اسم الحساب",
    copyName: "نسخ الاسم",
    accountNumberLabel: "رقم الحساب",
    copyNumber: "نسخ الرقم",
    awaitingConfiguration: "في انتظار إعداد القسم المالي",
    stepsHeading: "ما الذي يحدث، خطوة بخطوة",
    step1: "انسخ المبلغ وتفاصيل الحساب من القسم أعلاه.",
    step2: "حوّل من حسابك البنكي أو حساب شركتك مستخدمًا اسم سجلك كمرجع.",
    step3: "ارفع إيصالك أو إثباتك أدناه — يراجع القسم المالي ويؤكد خلال يوم عمل واحد.",
    step4: "بمجرد التأكيد، يتقدم سجلك وتتلقى تحديثًا عبر البريد الإلكتروني.",
    supportHeading: "هل تحتاج إلى مساعدة قبل الدفع أو بعده",
    emailLabel: "البريد الإلكتروني",
    whatsappLabel: "واتساب",
  },
  proofUpload: {
    eyebrowProcessing: "أرفق الإثبات الناقص",
    eyebrowSend: "أرسل إثباتك",
    intro:
      "ارفع إيصالك أو تنبيهك. يراجع القسم المالي ويؤكد خلال يوم عمل واحد — ستُحدَّث هذه الصفحة تلقائيًا.",
    fieldTitle: "ملف إثبات الدفع",
    fieldDescription:
      "إيصال بنكي، لقطة شاشة لتنبيه الخصم، أو ملف PDF — يجب أن يُظهر المبلغ والتاريخ والوجهة.",
    fieldFooterHint:
      "نختصر اسم الملف إلى تسمية واضحة يمكن للقسم المالي تصفحها بسرعة.",
    submitLabel: "إرسال إثبات الدفع",
    pendingLabel: "جارٍ الرفع…",
    successLabel: "تم استلام الإثبات",
  },
  surface: {
    bodyPending:
      "أرسل دفعتك باستخدام تفاصيل الشركة المُوثَّقة أدناه، ثم أرفق إثباتك حتى يتمكن القسم المالي من التأكيد وفتح الخطوة التالية.",
    bodyProcessing: "تم استلام إثبات الدفع. القسم المالي يتحقق — يمكنك متابعة التأكيد هنا.",
    bodyPaid: "تم تأكيد الدفع. شكرًا لك — سجلك مستمر في التقدم.",
    bodyFailed:
      "لم نتمكن من مطابقة هذا التحويل. يُرجى إعادة رفع إثباتك أو الاتصال بدعم القسم المالي أدناه.",
    bodyRefunded: "تم إصدار استرداد. أُعيد التحويل إلى الحساب المصدر.",
    bodyCancelled: "تم إلغاء هذه الدفعة. لا حاجة لأي إجراء آخر.",
    defaultInstructions:
      "التحويل البنكي هو طريقة الدفع النشطة. يمكن أن يكون الإثبات لقطة شاشة لتنبيه خصم، أو إيصالًا بنكيًا، أو ملف PDF — أي مستند يُظهر المبلغ والتاريخ والوجهة.",
    defaultProofHint:
      "بعد الإرسال، أرفق الإثبات أدناه — يراجع القسم المالي خلال يوم عمل واحد. سترى الحالة تتحول إلى «قيد المعالجة» هنا بمجرد وصول الرفع.",
    workspaceHeading: (label: string, recordTitle: string) =>
      `مساحة الدفع · ${label} · ${recordTitle}`,
    paymentFallback: "الدفع",
    rankEyebrow: (index: number, total: number) => `الدفعة · ${index} من ${total}`,
    amountDue: "المبلغ المستحق",
    status: "الحالة",
    due: "تاريخ الاستحقاق",
    context: "السياق",
    footerReference: "اذكر اسم سجلك في التحويل.",
    guideDefaultTitle: "أرسل الدفعة باستخدام حساب الشركة المُوثَّق",
    duePrefix: (dueLabel: string) => `الاستحقاق ${dueLabel}`,
  },
};

const DE: DeepPartial<PaymentSurfaceUiCopy> = {
  fileField: {
    addFile: "Datei hinzufügen",
    tapToAddFiles: "Tippen, um Dateien hinzuzufügen",
    dropMultiple:
      "Ziehen Sie Dateien hierher, falls Ihr Browser dies unterstützt — mehrere Dateien erlaubt.",
    dropSingle:
      "Ziehen Sie eine Datei hierher oder tippen Sie, um sie von Ihrem Gerät auszuwählen.",
    filesReadyLabel: "Dateien bereit zum Hochladen",
    removeFile: (fileName: string) => `${fileName} entfernen`,
    noFileSelected: "Noch keine Datei ausgewählt.",
  },
  guide: {
    amountDue: "Fälliger Betrag",
    due: "Fällig",
    footerReference:
      "Geben Sie diesen exakten Betrag und Ihren Vorgangsnamen an, wenn Sie den Zahlungsnachweis senden.",
    copyAmount: "Betrag kopieren",
    verifiedPayee: "Verifizierter Firmenzahlungsempfänger",
    transferOnly:
      "Überweisen Sie ausschließlich auf das unten angezeigte HenryCo-Firmenkonto. Jede Angabe hat eine Kopierschaltfläche, sodass nichts erneut eingegeben werden muss.",
    bankLabel: "Bank",
    copyBank: "Bank kopieren",
    accountNameLabel: "Kontoname",
    copyName: "Namen kopieren",
    accountNumberLabel: "Kontonummer",
    copyNumber: "Nummer kopieren",
    awaitingConfiguration: "Warten auf die Finanzkonfiguration",
    stepsHeading: "Was passiert, Schritt für Schritt",
    step1: "Kopieren Sie den Betrag und die Kontodaten aus dem Abschnitt oben.",
    step2:
      "Überweisen Sie von Ihrem Bank- oder Firmenkonto und verwenden Sie Ihren Vorgangsnamen als Verwendungszweck.",
    step3:
      "Laden Sie unten Ihren Beleg oder Nachweis hoch — die Finanzabteilung prüft und bestätigt innerhalb eines Werktags.",
    step4:
      "Nach der Bestätigung schreitet Ihr Vorgang voran und Sie erhalten eine Aktualisierung per E-Mail.",
    supportHeading: "Hilfe vor oder nach der Zahlung benötigt",
    emailLabel: "E-Mail",
    whatsappLabel: "WhatsApp",
  },
  proofUpload: {
    eyebrowProcessing: "Fehlenden Nachweis anhängen",
    eyebrowSend: "Senden Sie Ihren Nachweis",
    intro:
      "Laden Sie Ihren Beleg oder Ihre Benachrichtigung hoch. Die Finanzabteilung prüft und bestätigt innerhalb eines Werktags — diese Seite wird automatisch aktualisiert.",
    fieldTitle: "Datei mit Zahlungsnachweis",
    fieldDescription:
      "Bankbeleg, Screenshot der Abbuchungsbenachrichtigung oder PDF — muss Betrag, Datum und Ziel zeigen.",
    fieldFooterHint:
      "Wir kürzen den Dateinamen auf eine klare Bezeichnung, die die Finanzabteilung schnell überblicken kann.",
    submitLabel: "Zahlungsnachweis einreichen",
    pendingLabel: "Wird hochgeladen…",
    successLabel: "Nachweis erhalten",
  },
  surface: {
    bodyPending:
      "Senden Sie Ihre Zahlung mit den unten stehenden verifizierten Firmendaten und hängen Sie dann Ihren Nachweis an, damit die Finanzabteilung bestätigen und den nächsten Schritt freischalten kann.",
    bodyProcessing:
      "Zahlungsnachweis erhalten. Die Finanzabteilung prüft — Sie können die Bestätigung hier verfolgen.",
    bodyPaid: "Zahlung bestätigt. Vielen Dank — Ihr Vorgang läuft weiter.",
    bodyFailed:
      "Wir konnten diese Überweisung nicht zuordnen. Bitte laden Sie Ihren Nachweis erneut hoch oder kontaktieren Sie unten den Finanzsupport.",
    bodyRefunded: "Rückerstattung veranlasst. Die Überweisung wurde auf das Ursprungskonto zurückgesendet.",
    bodyCancelled: "Diese Zahlung wurde storniert. Es ist keine weitere Aktion erforderlich.",
    defaultInstructions:
      "Die Banküberweisung ist die aktive Zahlungsmethode. Der Nachweis kann ein Screenshot einer Abbuchungsbenachrichtigung, ein Bankbeleg oder ein PDF sein — alles, was Betrag, Datum und Ziel zeigt.",
    defaultProofHint:
      "Hängen Sie nach dem Senden den Nachweis unten an — die Finanzabteilung prüft innerhalb eines Werktags. Sobald der Upload eingegangen ist, wechselt der Status hier zu „in Bearbeitung“.",
    workspaceHeading: (label: string, recordTitle: string) =>
      `Zahlungsbereich · ${label} · ${recordTitle}`,
    paymentFallback: "Zahlung",
    rankEyebrow: (index: number, total: number) => `Zahlung · ${index} von ${total}`,
    amountDue: "Fälliger Betrag",
    status: "Status",
    due: "Fällig",
    context: "Kontext",
    footerReference: "Geben Sie Ihren Vorgangsnamen bei der Überweisung an.",
    guideDefaultTitle: "Leisten Sie die Zahlung über das verifizierte Firmenkonto",
    duePrefix: (dueLabel: string) => `Fällig ${dueLabel}`,
  },
};

const IT: DeepPartial<PaymentSurfaceUiCopy> = {
  fileField: {
    addFile: "Aggiungi file",
    tapToAddFiles: "Tocca per aggiungere file",
    dropMultiple:
      "Trascina e rilascia qui se il tuo browser lo supporta — sono consentiti più file.",
    dropSingle:
      "Trascina e rilascia un file qui, oppure tocca per sceglierlo dal tuo dispositivo.",
    filesReadyLabel: "File pronti per il caricamento",
    removeFile: (fileName: string) => `Rimuovi ${fileName}`,
    noFileSelected: "Nessun file selezionato per ora.",
  },
  guide: {
    amountDue: "Importo dovuto",
    due: "Scadenza",
    footerReference:
      "Indica questo importo esatto e il nome del tuo record quando invii la prova di pagamento.",
    copyAmount: "Copia importo",
    verifiedPayee: "Beneficiario aziendale verificato",
    transferOnly:
      "Effettua il bonifico solo verso il conto aziendale HenryCo indicato di seguito. Ogni dettaglio ha un pulsante di copia, così non serve riscrivere nulla.",
    bankLabel: "Banca",
    copyBank: "Copia banca",
    accountNameLabel: "Nome del conto",
    copyName: "Copia nome",
    accountNumberLabel: "Numero di conto",
    copyNumber: "Copia numero",
    awaitingConfiguration: "In attesa della configurazione finanziaria",
    stepsHeading: "Cosa succede, passo dopo passo",
    step1: "Copia l'importo e i dati del conto dalla sezione sopra.",
    step2:
      "Effettua il bonifico dal tuo conto bancario o aziendale usando il nome del tuo record come riferimento.",
    step3:
      "Carica la ricevuta o la prova qui sotto — l'amministrazione esamina e conferma entro un giorno lavorativo.",
    step4:
      "Una volta confermato, il tuo record avanza e ricevi un aggiornamento via e-mail.",
    supportHeading: "Hai bisogno di aiuto prima o dopo il pagamento",
    emailLabel: "E-mail",
    whatsappLabel: "WhatsApp",
  },
  proofUpload: {
    eyebrowProcessing: "Allega la prova mancante",
    eyebrowSend: "Invia la tua prova",
    intro:
      "Carica la ricevuta o l'avviso. L'amministrazione esamina e conferma entro un giorno lavorativo — questa pagina si aggiornerà automaticamente.",
    fieldTitle: "File della prova di pagamento",
    fieldDescription:
      "Ricevuta bancaria, screenshot dell'avviso di addebito o PDF — deve mostrare importo, data e destinazione.",
    fieldFooterHint:
      "Accorciamo il nome del file in un'etichetta chiara che l'amministrazione può scorrere rapidamente.",
    submitLabel: "Invia la prova di pagamento",
    pendingLabel: "Caricamento…",
    successLabel: "Prova ricevuta",
  },
  surface: {
    bodyPending:
      "Invia il pagamento usando i dati aziendali verificati qui sotto, poi allega la tua prova così l'amministrazione può confermare e sbloccare il passaggio successivo.",
    bodyProcessing:
      "Prova di pagamento ricevuta. L'amministrazione sta verificando — puoi seguire la conferma qui.",
    bodyPaid: "Pagamento confermato. Grazie — il tuo record continua a procedere.",
    bodyFailed:
      "Non siamo riusciti ad abbinare questo bonifico. Carica di nuovo la tua prova o contatta il supporto amministrativo qui sotto.",
    bodyRefunded: "Rimborso emesso. Il bonifico è stato restituito al conto di origine.",
    bodyCancelled: "Questo pagamento è stato annullato. Non è necessaria alcuna altra azione.",
    defaultInstructions:
      "Il bonifico bancario è il metodo di pagamento attivo. La prova può essere uno screenshot dell'avviso di addebito, una ricevuta bancaria o un PDF — qualsiasi documento che mostri importo, data e destinazione.",
    defaultProofHint:
      "Dopo l'invio, allega la prova qui sotto — l'amministrazione esamina entro un giorno lavorativo. Vedrai lo stato passare a «in elaborazione» qui non appena il caricamento sarà ricevuto.",
    workspaceHeading: (label: string, recordTitle: string) =>
      `Area di pagamento · ${label} · ${recordTitle}`,
    paymentFallback: "Pagamento",
    rankEyebrow: (index: number, total: number) => `Pagamento · ${index} di ${total}`,
    amountDue: "Importo dovuto",
    status: "Stato",
    due: "Scadenza",
    context: "Contesto",
    footerReference: "Indica il nome del tuo record nel bonifico.",
    guideDefaultTitle: "Effettua il pagamento usando il conto aziendale verificato",
    duePrefix: (dueLabel: string) => `Scadenza ${dueLabel}`,
  },
};

const ZH: DeepPartial<PaymentSurfaceUiCopy> = {
  fileField: {
    addFile: "添加文件",
    tapToAddFiles: "点按以添加文件",
    dropMultiple: "如果您的浏览器支持，可将文件拖放到此处——允许多个文件。",
    dropSingle: "将一个文件拖放到此处，或点按从您的设备中选择。",
    filesReadyLabel: "待上传的文件",
    removeFile: (fileName: string) => `移除 ${fileName}`,
    noFileSelected: "尚未选择文件。",
  },
  guide: {
    amountDue: "应付金额",
    due: "到期",
    footerReference: "发送付款凭证时，请注明此确切金额和您的记录名称。",
    copyAmount: "复制金额",
    verifiedPayee: "已验证的公司收款方",
    transferOnly:
      "请仅转账至下方所示的 HenryCo 公司账户。每项信息都配有复制按钮，因此无需重新输入。",
    bankLabel: "银行",
    copyBank: "复制银行",
    accountNameLabel: "账户名称",
    copyName: "复制名称",
    accountNumberLabel: "账号",
    copyNumber: "复制账号",
    awaitingConfiguration: "等待财务配置中",
    stepsHeading: "流程，逐步说明",
    step1: "从上方部分复制金额和账户信息。",
    step2: "使用您的记录名称作为参考，从您的银行或公司账户转账。",
    step3: "在下方上传您的收据或凭证——财务部门将在一个工作日内审核并确认。",
    step4: "确认后，您的记录将推进，并通过电子邮件收到更新。",
    supportHeading: "付款前后需要帮助",
    emailLabel: "电子邮件",
    whatsappLabel: "WhatsApp",
  },
  proofUpload: {
    eyebrowProcessing: "附上缺失的凭证",
    eyebrowSend: "发送您的凭证",
    intro:
      "上传您的收据或提醒。财务部门将在一个工作日内审核并确认——此页面将自动更新。",
    fieldTitle: "付款凭证文件",
    fieldDescription: "银行收据、扣款提醒截图或 PDF——必须显示金额、日期和收款方。",
    fieldFooterHint: "我们会将文件名精简为清晰的标签，便于财务部门快速浏览。",
    submitLabel: "提交付款凭证",
    pendingLabel: "上传中…",
    successLabel: "已收到凭证",
  },
  surface: {
    bodyPending:
      "使用下方已验证的公司信息进行付款，然后附上您的凭证，以便财务部门确认并解锁下一步。",
    bodyProcessing: "已收到付款凭证。财务部门正在核实——您可以在此跟踪确认进度。",
    bodyPaid: "付款已确认。谢谢——您的记录继续推进。",
    bodyFailed: "我们无法匹配此笔转账。请重新上传您的凭证，或在下方联系财务支持。",
    bodyRefunded: "已发起退款。转账已退回至来源账户。",
    bodyCancelled: "此笔付款已取消。无需进一步操作。",
    defaultInstructions:
      "银行转账是当前启用的付款方式。凭证可以是扣款提醒截图、银行收据或 PDF——任何显示金额、日期和收款方的文件。",
    defaultProofHint:
      "发送后，在下方附上凭证——财务部门将在一个工作日内审核。上传到达后，您将在此看到状态变为“处理中”。",
    workspaceHeading: (label: string, recordTitle: string) =>
      `付款工作区 · ${label} · ${recordTitle}`,
    paymentFallback: "付款",
    rankEyebrow: (index: number, total: number) => `付款 · 第 ${index} 项，共 ${total} 项`,
    amountDue: "应付金额",
    status: "状态",
    due: "到期",
    context: "背景",
    footerReference: "在转账时注明您的记录名称。",
    guideDefaultTitle: "使用已验证的公司账户进行付款",
    duePrefix: (dueLabel: string) => `到期 ${dueLabel}`,
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<PaymentSurfaceUiCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
};
// ig, yo, ha, hi are intentionally OMITTED -> fall back to EN (human-translation only).

export function getPaymentSurfaceCopy(locale: AppLocale): PaymentSurfaceUiCopy {
  const o = LOCALE_MAP[locale];
  if (o)
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      o as unknown as Record<string, unknown>,
    ) as unknown as PaymentSurfaceUiCopy;
  return EN;
}
