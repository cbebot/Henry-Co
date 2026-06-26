import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * StudioPortalCopy — i18n surface for the studio client-portal components
 * work-unit ("studio-portal").
 *
 * Covers the attention strip (outstanding invoice / awaiting review / unread
 * message cards), the bank-transfer details card, the deliverable file card
 * (preview / download / approve / lightbox), the milestone progress rail, the
 * payment-proof form (including its server-rejection messages), the
 * "Refine with AI" composer button, the project tab bar, and the toast stack.
 *
 * Pattern A typed-copy module: the EN baseline is exhaustive; each locale is a
 * DeepPartial that deep-merges over EN so any missing key falls through to EN
 * silently. The brand word "HenryCo" stays verbatim in every locale (never
 * translated).
 *
 * Locale policy: EN + fr/es/pt/ar/de/it/zh are authored; ig/yo/ha/hi are
 * intentionally omitted and fall back to EN (human-translation only).
 */
export type StudioPortalCopy = {
  attentionStrip: {
    sectionLabel: string;
    heading: string;
    openSuffix: string;
    invoiceKicker: string;
    dueSuffix: (dueDate: string) => string;
    payNow: string;
    deliverableKicker: string;
    sharedSuffix: (when: string) => string;
    reviewAndApprove: string;
    messageKicker: string;
    reply: string;
  };
  bankDetails: {
    bankRow: string;
    accountNameRow: string;
    accountNumberRow: string;
    heading: (amountLabel: string) => string;
    subtitle: string;
    pendingValue: string;
    copyNumber: string;
    referenceNote: string;
  };
  fileCard: {
    approveError: string;
    versionPrefix: string;
    sharedPrefix: (date: string) => string;
    preview: string;
    download: string;
    approving: string;
    markApproved: string;
    approved: string;
    closePreview: string;
    openInNewTab: string;
    fallbackName: string;
  };
  milestoneProgress: {
    progressLabel: string;
    duePrefix: (date: string) => string;
    stepPrefix: (n: number) => string;
  };
  paymentForm: {
    errors: {
      missingFields: string;
      invalidFileType: string;
      fileTooLarge: string;
      invoiceNotFound: string;
      uploadFailed: string;
      duplicateSubmission: string;
      unauthorised: string;
      serverError: string;
    };
    successHeading: string;
    successBody: (invoiceNumber: string, amountLabel: string, reference: string) => string;
    encryptedBadge: string;
    heading: string;
    subtitle: string;
    referenceLabel: string;
    referencePlaceholder: string;
    referenceHint: string;
    proofLabel: string;
    dropzoneTitle: string;
    dropzoneHint: string;
    unknownType: string;
    removeFile: string;
    notesLabel: string;
    notesOptional: string;
    notesPlaceholder: string;
    confirmation: (amountLabel: string) => string;
    submitting: string;
    submit: string;
  };
  refineButton: {
    ariaLabel: string;
    title: string;
    refining: string;
    refine: string;
    refinedHint: string;
  };
  tabBar: {
    sectionsLabel: string;
  };
  toast: {
    viewAction: string;
    dismiss: string;
  };
};

const EN: StudioPortalCopy = {
  attentionStrip: {
    sectionLabel: "Items needing attention",
    heading: "Needs your attention",
    openSuffix: "open",
    invoiceKicker: "Outstanding invoice",
    dueSuffix: (dueDate: string) => ` · Due ${dueDate}`,
    payNow: "Pay now",
    deliverableKicker: "Awaiting your review",
    sharedSuffix: (when: string) => `shared ${when}`,
    reviewAndApprove: "Review and approve",
    messageKicker: "Unread message",
    reply: "Reply",
  },
  bankDetails: {
    bankRow: "Bank",
    accountNameRow: "Account name",
    accountNumberRow: "Account number",
    heading: (amountLabel: string) => `Pay ${amountLabel} into the verified HenryCo account`,
    subtitle: "Bank transfer is the active method for this invoice. Card payments are coming soon.",
    pendingValue: "Pending — contact support",
    copyNumber: "Copy number",
    referenceNote:
      "Use your invoice number as the transfer reference. After the transfer, attach your proof below — finance verifies within one business day.",
  },
  fileCard: {
    approveError: "We couldn't approve this right now. Try again in a moment.",
    versionPrefix: "v",
    sharedPrefix: (date: string) => `· Shared ${date}`,
    preview: "Preview",
    download: "Download",
    approving: "Approving…",
    markApproved: "Mark approved",
    approved: "Approved",
    closePreview: "Close preview",
    openInNewTab: "Open in new tab",
    fallbackName: "deliverable",
  },
  milestoneProgress: {
    progressLabel: "Project milestone progress",
    duePrefix: (date: string) => `Due ${date}`,
    stepPrefix: (n: number) => `Step ${n}`,
  },
  paymentForm: {
    errors: {
      missingFields: "Please add both a reference number and a proof of payment.",
      invalidFileType: "We accept PNG, JPG, WEBP, and PDF files only.",
      fileTooLarge: "The proof file must be 10 MB or smaller.",
      invoiceNotFound: "We could not find this invoice. Refresh and try again.",
      uploadFailed: "The proof upload failed. Check your connection and try again.",
      duplicateSubmission:
        "We already received a payment with this reference. Use a different reference if this is a new transfer.",
      unauthorised: "This invoice does not belong to your account.",
      serverError: "Something went wrong on our side. Please try again in a moment.",
    },
    successHeading: "Payment proof received",
    successBody: (invoiceNumber: string, amountLabel: string, reference: string) =>
      `Thank you. We are verifying your transfer for invoice ${invoiceNumber} (${amountLabel}). Your reference ${reference} is on file. You will see this invoice flip to verified inside your client portal as soon as finance confirms — usually within one business day.`,
    encryptedBadge: "Encrypted in transit · stored securely",
    heading: "Send payment proof",
    subtitle:
      "After you transfer, attach your bank receipt or alert and the reference number that was generated by your bank. Finance verifies within one business day.",
    referenceLabel: "Bank reference number",
    referencePlaceholder: "e.g. NIB/2026/05/001234",
    referenceHint: "The transfer reference shown on your bank receipt or debit alert.",
    proofLabel: "Proof of payment",
    dropzoneTitle: "Drop your proof here or click to browse",
    dropzoneHint: "PNG, JPG, WEBP, or PDF · max 10 MB",
    unknownType: "Unknown type",
    removeFile: "Remove selected file",
    notesLabel: "Notes",
    notesOptional: "(optional)",
    notesPlaceholder: "Anything finance should know about this transfer.",
    confirmation: (amountLabel: string) =>
      `By submitting, you confirm you have transferred ${amountLabel} to the verified HenryCo account shown on this page.`,
    submitting: "Submitting…",
    submit: "Submit payment proof",
  },
  refineButton: {
    ariaLabel: "Refine draft with AI",
    title: "Polish this draft with AI",
    refining: "Refining",
    refine: "Refine",
    refinedHint: "Refined",
  },
  tabBar: {
    sectionsLabel: "Project sections",
  },
  toast: {
    viewAction: "View",
    dismiss: "Dismiss notification",
  },
};

const FR: DeepPartial<StudioPortalCopy> = {
  attentionStrip: {
    sectionLabel: "Éléments nécessitant votre attention",
    heading: "Nécessite votre attention",
    openSuffix: "en attente",
    invoiceKicker: "Facture impayée",
    dueSuffix: (dueDate: string) => ` · Échéance ${dueDate}`,
    payNow: "Payer maintenant",
    deliverableKicker: "En attente de votre validation",
    sharedSuffix: (when: string) => `partagé ${when}`,
    reviewAndApprove: "Examiner et approuver",
    messageKicker: "Message non lu",
    reply: "Répondre",
  },
  bankDetails: {
    bankRow: "Banque",
    accountNameRow: "Nom du compte",
    accountNumberRow: "Numéro de compte",
    heading: (amountLabel: string) => `Payez ${amountLabel} sur le compte HenryCo vérifié`,
    subtitle:
      "Le virement bancaire est la méthode active pour cette facture. Le paiement par carte arrive bientôt.",
    pendingValue: "En attente — contactez le support",
    copyNumber: "Copier le numéro",
    referenceNote:
      "Utilisez votre numéro de facture comme référence du virement. Après le virement, joignez votre justificatif ci-dessous — le service financier vérifie sous un jour ouvré.",
  },
  fileCard: {
    approveError: "Nous n'avons pas pu approuver cet élément pour le moment. Réessayez dans un instant.",
    versionPrefix: "v",
    sharedPrefix: (date: string) => `· Partagé le ${date}`,
    preview: "Aperçu",
    download: "Télécharger",
    approving: "Approbation…",
    markApproved: "Marquer comme approuvé",
    approved: "Approuvé",
    closePreview: "Fermer l'aperçu",
    openInNewTab: "Ouvrir dans un nouvel onglet",
    fallbackName: "livrable",
  },
  milestoneProgress: {
    progressLabel: "Progression des jalons du projet",
    duePrefix: (date: string) => `Échéance ${date}`,
    stepPrefix: (n: number) => `Étape ${n}`,
  },
  paymentForm: {
    errors: {
      missingFields: "Veuillez ajouter à la fois un numéro de référence et un justificatif de paiement.",
      invalidFileType: "Nous acceptons uniquement les fichiers PNG, JPG, WEBP et PDF.",
      fileTooLarge: "Le fichier justificatif ne doit pas dépasser 10 Mo.",
      invoiceNotFound: "Nous n'avons pas trouvé cette facture. Actualisez et réessayez.",
      uploadFailed: "Le téléversement du justificatif a échoué. Vérifiez votre connexion et réessayez.",
      duplicateSubmission:
        "Nous avons déjà reçu un paiement avec cette référence. Utilisez une autre référence s'il s'agit d'un nouveau virement.",
      unauthorised: "Cette facture n'appartient pas à votre compte.",
      serverError: "Une erreur est survenue de notre côté. Veuillez réessayer dans un instant.",
    },
    successHeading: "Justificatif de paiement reçu",
    successBody: (invoiceNumber: string, amountLabel: string, reference: string) =>
      `Merci. Nous vérifions votre virement pour la facture ${invoiceNumber} (${amountLabel}). Votre référence ${reference} est enregistrée. Cette facture passera au statut vérifié dans votre portail client dès que le service financier confirmera — généralement sous un jour ouvré.`,
    encryptedBadge: "Chiffré en transit · stocké en toute sécurité",
    heading: "Envoyer le justificatif de paiement",
    subtitle:
      "Après votre virement, joignez votre reçu ou alerte bancaire ainsi que le numéro de référence généré par votre banque. Le service financier vérifie sous un jour ouvré.",
    referenceLabel: "Numéro de référence bancaire",
    referencePlaceholder: "ex. NIB/2026/05/001234",
    referenceHint: "La référence du virement indiquée sur votre reçu ou alerte de débit bancaire.",
    proofLabel: "Justificatif de paiement",
    dropzoneTitle: "Déposez votre justificatif ici ou cliquez pour parcourir",
    dropzoneHint: "PNG, JPG, WEBP ou PDF · 10 Mo max",
    unknownType: "Type inconnu",
    removeFile: "Retirer le fichier sélectionné",
    notesLabel: "Notes",
    notesOptional: "(facultatif)",
    notesPlaceholder: "Tout ce que le service financier devrait savoir sur ce virement.",
    confirmation: (amountLabel: string) =>
      `En soumettant, vous confirmez avoir transféré ${amountLabel} vers le compte HenryCo vérifié affiché sur cette page.`,
    submitting: "Envoi…",
    submit: "Envoyer le justificatif de paiement",
  },
  refineButton: {
    ariaLabel: "Affiner le brouillon avec l'IA",
    title: "Peaufiner ce brouillon avec l'IA",
    refining: "Affinage",
    refine: "Affiner",
    refinedHint: "Affiné",
  },
  tabBar: {
    sectionsLabel: "Sections du projet",
  },
  toast: {
    viewAction: "Voir",
    dismiss: "Ignorer la notification",
  },
};

const ES: DeepPartial<StudioPortalCopy> = {
  attentionStrip: {
    sectionLabel: "Elementos que requieren tu atención",
    heading: "Requiere tu atención",
    openSuffix: "pendientes",
    invoiceKicker: "Factura pendiente",
    dueSuffix: (dueDate: string) => ` · Vence ${dueDate}`,
    payNow: "Pagar ahora",
    deliverableKicker: "A la espera de tu revisión",
    sharedSuffix: (when: string) => `compartido ${when}`,
    reviewAndApprove: "Revisar y aprobar",
    messageKicker: "Mensaje sin leer",
    reply: "Responder",
  },
  bankDetails: {
    bankRow: "Banco",
    accountNameRow: "Nombre de la cuenta",
    accountNumberRow: "Número de cuenta",
    heading: (amountLabel: string) => `Paga ${amountLabel} a la cuenta verificada de HenryCo`,
    subtitle:
      "La transferencia bancaria es el método activo para esta factura. El pago con tarjeta llegará pronto.",
    pendingValue: "Pendiente — contacta con soporte",
    copyNumber: "Copiar número",
    referenceNote:
      "Usa tu número de factura como referencia de la transferencia. Tras la transferencia, adjunta tu comprobante abajo — finanzas lo verifica en un día hábil.",
  },
  fileCard: {
    approveError: "No pudimos aprobar esto ahora mismo. Inténtalo de nuevo en un momento.",
    versionPrefix: "v",
    sharedPrefix: (date: string) => `· Compartido el ${date}`,
    preview: "Vista previa",
    download: "Descargar",
    approving: "Aprobando…",
    markApproved: "Marcar como aprobado",
    approved: "Aprobado",
    closePreview: "Cerrar vista previa",
    openInNewTab: "Abrir en una pestaña nueva",
    fallbackName: "entregable",
  },
  milestoneProgress: {
    progressLabel: "Progreso de los hitos del proyecto",
    duePrefix: (date: string) => `Vence ${date}`,
    stepPrefix: (n: number) => `Paso ${n}`,
  },
  paymentForm: {
    errors: {
      missingFields: "Añade tanto un número de referencia como un comprobante de pago.",
      invalidFileType: "Solo aceptamos archivos PNG, JPG, WEBP y PDF.",
      fileTooLarge: "El archivo del comprobante debe pesar 10 MB o menos.",
      invoiceNotFound: "No encontramos esta factura. Actualiza e inténtalo de nuevo.",
      uploadFailed: "La subida del comprobante falló. Comprueba tu conexión e inténtalo de nuevo.",
      duplicateSubmission:
        "Ya recibimos un pago con esta referencia. Usa una referencia distinta si se trata de una nueva transferencia.",
      unauthorised: "Esta factura no pertenece a tu cuenta.",
      serverError: "Algo salió mal por nuestra parte. Inténtalo de nuevo en un momento.",
    },
    successHeading: "Comprobante de pago recibido",
    successBody: (invoiceNumber: string, amountLabel: string, reference: string) =>
      `Gracias. Estamos verificando tu transferencia para la factura ${invoiceNumber} (${amountLabel}). Tu referencia ${reference} está registrada. Verás que esta factura pasa a verificada en tu portal de cliente en cuanto finanzas lo confirme — normalmente en un día hábil.`,
    encryptedBadge: "Cifrado en tránsito · almacenado de forma segura",
    heading: "Enviar comprobante de pago",
    subtitle:
      "Tras la transferencia, adjunta tu recibo o alerta bancaria y el número de referencia que generó tu banco. Finanzas lo verifica en un día hábil.",
    referenceLabel: "Número de referencia bancaria",
    referencePlaceholder: "p. ej. NIB/2026/05/001234",
    referenceHint: "La referencia de la transferencia que aparece en tu recibo o alerta de cargo bancario.",
    proofLabel: "Comprobante de pago",
    dropzoneTitle: "Suelta tu comprobante aquí o haz clic para explorar",
    dropzoneHint: "PNG, JPG, WEBP o PDF · máx. 10 MB",
    unknownType: "Tipo desconocido",
    removeFile: "Quitar el archivo seleccionado",
    notesLabel: "Notas",
    notesOptional: "(opcional)",
    notesPlaceholder: "Cualquier cosa que finanzas deba saber sobre esta transferencia.",
    confirmation: (amountLabel: string) =>
      `Al enviar, confirmas que has transferido ${amountLabel} a la cuenta verificada de HenryCo que se muestra en esta página.`,
    submitting: "Enviando…",
    submit: "Enviar comprobante de pago",
  },
  refineButton: {
    ariaLabel: "Mejorar el borrador con IA",
    title: "Pulir este borrador con IA",
    refining: "Mejorando",
    refine: "Mejorar",
    refinedHint: "Mejorado",
  },
  tabBar: {
    sectionsLabel: "Secciones del proyecto",
  },
  toast: {
    viewAction: "Ver",
    dismiss: "Descartar notificación",
  },
};

const PT: DeepPartial<StudioPortalCopy> = {
  attentionStrip: {
    sectionLabel: "Itens que precisam de atenção",
    heading: "Precisa da sua atenção",
    openSuffix: "em aberto",
    invoiceKicker: "Fatura pendente",
    dueSuffix: (dueDate: string) => ` · Vence ${dueDate}`,
    payNow: "Pagar agora",
    deliverableKicker: "Aguardando a sua análise",
    sharedSuffix: (when: string) => `partilhado ${when}`,
    reviewAndApprove: "Analisar e aprovar",
    messageKicker: "Mensagem não lida",
    reply: "Responder",
  },
  bankDetails: {
    bankRow: "Banco",
    accountNameRow: "Nome da conta",
    accountNumberRow: "Número da conta",
    heading: (amountLabel: string) => `Pague ${amountLabel} para a conta HenryCo verificada`,
    subtitle:
      "A transferência bancária é o método ativo para esta fatura. O pagamento com cartão chega em breve.",
    pendingValue: "Pendente — contacte o suporte",
    copyNumber: "Copiar número",
    referenceNote:
      "Use o número da sua fatura como referência da transferência. Após a transferência, anexe o seu comprovativo abaixo — o financeiro verifica dentro de um dia útil.",
  },
  fileCard: {
    approveError: "Não foi possível aprovar isto agora. Tente novamente daqui a pouco.",
    versionPrefix: "v",
    sharedPrefix: (date: string) => `· Partilhado em ${date}`,
    preview: "Pré-visualizar",
    download: "Transferir",
    approving: "A aprovar…",
    markApproved: "Marcar como aprovado",
    approved: "Aprovado",
    closePreview: "Fechar pré-visualização",
    openInNewTab: "Abrir num novo separador",
    fallbackName: "entregável",
  },
  milestoneProgress: {
    progressLabel: "Progresso dos marcos do projeto",
    duePrefix: (date: string) => `Vence ${date}`,
    stepPrefix: (n: number) => `Etapa ${n}`,
  },
  paymentForm: {
    errors: {
      missingFields: "Adicione um número de referência e um comprovativo de pagamento.",
      invalidFileType: "Aceitamos apenas ficheiros PNG, JPG, WEBP e PDF.",
      fileTooLarge: "O ficheiro do comprovativo deve ter 10 MB ou menos.",
      invoiceNotFound: "Não encontrámos esta fatura. Atualize e tente novamente.",
      uploadFailed: "O carregamento do comprovativo falhou. Verifique a sua ligação e tente novamente.",
      duplicateSubmission:
        "Já recebemos um pagamento com esta referência. Use uma referência diferente se for uma nova transferência.",
      unauthorised: "Esta fatura não pertence à sua conta.",
      serverError: "Algo correu mal do nosso lado. Tente novamente daqui a pouco.",
    },
    successHeading: "Comprovativo de pagamento recebido",
    successBody: (invoiceNumber: string, amountLabel: string, reference: string) =>
      `Obrigado. Estamos a verificar a sua transferência da fatura ${invoiceNumber} (${amountLabel}). A sua referência ${reference} está registada. Verá esta fatura passar a verificada no seu portal de cliente assim que o financeiro confirmar — normalmente dentro de um dia útil.`,
    encryptedBadge: "Cifrado em trânsito · armazenado em segurança",
    heading: "Enviar comprovativo de pagamento",
    subtitle:
      "Após a transferência, anexe o seu recibo ou alerta bancário e o número de referência gerado pelo seu banco. O financeiro verifica dentro de um dia útil.",
    referenceLabel: "Número de referência bancária",
    referencePlaceholder: "ex. NIB/2026/05/001234",
    referenceHint: "A referência da transferência indicada no seu recibo ou alerta de débito bancário.",
    proofLabel: "Comprovativo de pagamento",
    dropzoneTitle: "Largue aqui o seu comprovativo ou clique para procurar",
    dropzoneHint: "PNG, JPG, WEBP ou PDF · máx. 10 MB",
    unknownType: "Tipo desconhecido",
    removeFile: "Remover o ficheiro selecionado",
    notesLabel: "Notas",
    notesOptional: "(opcional)",
    notesPlaceholder: "Qualquer coisa que o financeiro deva saber sobre esta transferência.",
    confirmation: (amountLabel: string) =>
      `Ao enviar, confirma que transferiu ${amountLabel} para a conta HenryCo verificada apresentada nesta página.`,
    submitting: "A enviar…",
    submit: "Enviar comprovativo de pagamento",
  },
  refineButton: {
    ariaLabel: "Refinar o rascunho com IA",
    title: "Aperfeiçoar este rascunho com IA",
    refining: "A refinar",
    refine: "Refinar",
    refinedHint: "Refinado",
  },
  tabBar: {
    sectionsLabel: "Secções do projeto",
  },
  toast: {
    viewAction: "Ver",
    dismiss: "Dispensar notificação",
  },
};

const AR: DeepPartial<StudioPortalCopy> = {
  attentionStrip: {
    sectionLabel: "عناصر تحتاج إلى انتباهك",
    heading: "تحتاج إلى انتباهك",
    openSuffix: "مفتوحة",
    invoiceKicker: "فاتورة مستحقة",
    dueSuffix: (dueDate: string) => ` · تستحق في ${dueDate}`,
    payNow: "ادفع الآن",
    deliverableKicker: "بانتظار مراجعتك",
    sharedSuffix: (when: string) => `تمت المشاركة ${when}`,
    reviewAndApprove: "راجع ووافق",
    messageKicker: "رسالة غير مقروءة",
    reply: "رد",
  },
  bankDetails: {
    bankRow: "البنك",
    accountNameRow: "اسم الحساب",
    accountNumberRow: "رقم الحساب",
    heading: (amountLabel: string) => `ادفع ${amountLabel} إلى حساب HenryCo الموثّق`,
    subtitle: "التحويل المصرفي هو الطريقة المفعّلة لهذه الفاتورة. الدفع بالبطاقة قادم قريبًا.",
    pendingValue: "قيد الانتظار — تواصل مع الدعم",
    copyNumber: "نسخ الرقم",
    referenceNote:
      "استخدم رقم فاتورتك كمرجع للتحويل. بعد التحويل، أرفق إثبات الدفع أدناه — يتحقق القسم المالي خلال يوم عمل واحد.",
  },
  fileCard: {
    approveError: "تعذّر علينا الموافقة على هذا الآن. حاول مجددًا بعد قليل.",
    versionPrefix: "إصدار ",
    sharedPrefix: (date: string) => `· تمت المشاركة في ${date}`,
    preview: "معاينة",
    download: "تنزيل",
    approving: "جارٍ الموافقة…",
    markApproved: "وضع علامة معتمد",
    approved: "تمت الموافقة",
    closePreview: "إغلاق المعاينة",
    openInNewTab: "فتح في علامة تبويب جديدة",
    fallbackName: "تسليم",
  },
  milestoneProgress: {
    progressLabel: "تقدّم مراحل المشروع",
    duePrefix: (date: string) => `تستحق في ${date}`,
    stepPrefix: (n: number) => `الخطوة ${n}`,
  },
  paymentForm: {
    errors: {
      missingFields: "يرجى إضافة رقم مرجعي وإثبات دفع معًا.",
      invalidFileType: "نقبل ملفات PNG وJPG وWEBP وPDF فقط.",
      fileTooLarge: "يجب ألا يتجاوز حجم ملف الإثبات 10 ميغابايت.",
      invoiceNotFound: "لم نتمكن من العثور على هذه الفاتورة. حدّث الصفحة وحاول مجددًا.",
      uploadFailed: "فشل رفع الإثبات. تحقق من اتصالك وحاول مجددًا.",
      duplicateSubmission:
        "لقد استلمنا بالفعل دفعة بهذا المرجع. استخدم مرجعًا مختلفًا إذا كان هذا تحويلًا جديدًا.",
      unauthorised: "هذه الفاتورة لا تخص حسابك.",
      serverError: "حدث خطأ من جانبنا. يرجى المحاولة مجددًا بعد قليل.",
    },
    successHeading: "تم استلام إثبات الدفع",
    successBody: (invoiceNumber: string, amountLabel: string, reference: string) =>
      `شكرًا لك. نحن نتحقق من تحويلك للفاتورة ${invoiceNumber} (${amountLabel}). تم تسجيل مرجعك ${reference}. ستجد هذه الفاتورة تتحوّل إلى موثّقة داخل بوابة العميل بمجرد تأكيد القسم المالي — عادةً خلال يوم عمل واحد.`,
    encryptedBadge: "مشفّر أثناء النقل · مخزّن بأمان",
    heading: "إرسال إثبات الدفع",
    subtitle:
      "بعد التحويل، أرفق إيصال البنك أو التنبيه ورقم المرجع الذي أنشأه بنكك. يتحقق القسم المالي خلال يوم عمل واحد.",
    referenceLabel: "رقم المرجع المصرفي",
    referencePlaceholder: "مثال: NIB/2026/05/001234",
    referenceHint: "مرجع التحويل الظاهر على إيصال البنك أو تنبيه الخصم.",
    proofLabel: "إثبات الدفع",
    dropzoneTitle: "أفلت إثباتك هنا أو انقر للاستعراض",
    dropzoneHint: "PNG أو JPG أو WEBP أو PDF · بحد أقصى 10 ميغابايت",
    unknownType: "نوع غير معروف",
    removeFile: "إزالة الملف المحدد",
    notesLabel: "ملاحظات",
    notesOptional: "(اختياري)",
    notesPlaceholder: "أي شيء ينبغي للقسم المالي معرفته عن هذا التحويل.",
    confirmation: (amountLabel: string) =>
      `بإرسالك، فإنك تؤكد أنك حوّلت ${amountLabel} إلى حساب HenryCo الموثّق المعروض في هذه الصفحة.`,
    submitting: "جارٍ الإرسال…",
    submit: "إرسال إثبات الدفع",
  },
  refineButton: {
    ariaLabel: "تحسين المسودة بالذكاء الاصطناعي",
    title: "صقل هذه المسودة بالذكاء الاصطناعي",
    refining: "جارٍ التحسين",
    refine: "تحسين",
    refinedHint: "تم التحسين",
  },
  tabBar: {
    sectionsLabel: "أقسام المشروع",
  },
  toast: {
    viewAction: "عرض",
    dismiss: "تجاهل الإشعار",
  },
};

const DE: DeepPartial<StudioPortalCopy> = {
  attentionStrip: {
    sectionLabel: "Elemente, die Ihre Aufmerksamkeit erfordern",
    heading: "Erfordert Ihre Aufmerksamkeit",
    openSuffix: "offen",
    invoiceKicker: "Offene Rechnung",
    dueSuffix: (dueDate: string) => ` · Fällig ${dueDate}`,
    payNow: "Jetzt bezahlen",
    deliverableKicker: "Wartet auf Ihre Prüfung",
    sharedSuffix: (when: string) => `geteilt ${when}`,
    reviewAndApprove: "Prüfen und freigeben",
    messageKicker: "Ungelesene Nachricht",
    reply: "Antworten",
  },
  bankDetails: {
    bankRow: "Bank",
    accountNameRow: "Kontoname",
    accountNumberRow: "Kontonummer",
    heading: (amountLabel: string) => `Zahlen Sie ${amountLabel} auf das verifizierte HenryCo-Konto`,
    subtitle:
      "Die Banküberweisung ist die aktive Methode für diese Rechnung. Kartenzahlung folgt in Kürze.",
    pendingValue: "Ausstehend — Support kontaktieren",
    copyNumber: "Nummer kopieren",
    referenceNote:
      "Verwenden Sie Ihre Rechnungsnummer als Überweisungsreferenz. Hängen Sie nach der Überweisung unten Ihren Nachweis an — die Finanzabteilung prüft innerhalb eines Werktags.",
  },
  fileCard: {
    approveError: "Wir konnten dies gerade nicht freigeben. Versuchen Sie es gleich erneut.",
    versionPrefix: "v",
    sharedPrefix: (date: string) => `· Geteilt am ${date}`,
    preview: "Vorschau",
    download: "Herunterladen",
    approving: "Wird freigegeben…",
    markApproved: "Als freigegeben markieren",
    approved: "Freigegeben",
    closePreview: "Vorschau schließen",
    openInNewTab: "In neuem Tab öffnen",
    fallbackName: "Lieferobjekt",
  },
  milestoneProgress: {
    progressLabel: "Fortschritt der Projektmeilensteine",
    duePrefix: (date: string) => `Fällig ${date}`,
    stepPrefix: (n: number) => `Schritt ${n}`,
  },
  paymentForm: {
    errors: {
      missingFields: "Bitte fügen Sie sowohl eine Referenznummer als auch einen Zahlungsnachweis hinzu.",
      invalidFileType: "Wir akzeptieren nur PNG-, JPG-, WEBP- und PDF-Dateien.",
      fileTooLarge: "Die Nachweisdatei darf höchstens 10 MB groß sein.",
      invoiceNotFound: "Wir konnten diese Rechnung nicht finden. Aktualisieren Sie und versuchen Sie es erneut.",
      uploadFailed: "Der Upload des Nachweises ist fehlgeschlagen. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.",
      duplicateSubmission:
        "Wir haben bereits eine Zahlung mit dieser Referenz erhalten. Verwenden Sie eine andere Referenz, wenn dies eine neue Überweisung ist.",
      unauthorised: "Diese Rechnung gehört nicht zu Ihrem Konto.",
      serverError: "Auf unserer Seite ist etwas schiefgelaufen. Bitte versuchen Sie es gleich erneut.",
    },
    successHeading: "Zahlungsnachweis erhalten",
    successBody: (invoiceNumber: string, amountLabel: string, reference: string) =>
      `Vielen Dank. Wir prüfen Ihre Überweisung für die Rechnung ${invoiceNumber} (${amountLabel}). Ihre Referenz ${reference} ist hinterlegt. Sobald die Finanzabteilung bestätigt, wechselt diese Rechnung in Ihrem Kundenportal auf verifiziert — in der Regel innerhalb eines Werktags.`,
    encryptedBadge: "Während der Übertragung verschlüsselt · sicher gespeichert",
    heading: "Zahlungsnachweis senden",
    subtitle:
      "Hängen Sie nach Ihrer Überweisung Ihren Bankbeleg oder Ihre Benachrichtigung sowie die von Ihrer Bank erzeugte Referenznummer an. Die Finanzabteilung prüft innerhalb eines Werktags.",
    referenceLabel: "Bankreferenznummer",
    referencePlaceholder: "z. B. NIB/2026/05/001234",
    referenceHint: "Die Überweisungsreferenz auf Ihrem Bankbeleg oder Ihrer Lastschriftbenachrichtigung.",
    proofLabel: "Zahlungsnachweis",
    dropzoneTitle: "Ziehen Sie Ihren Nachweis hierher oder klicken Sie zum Durchsuchen",
    dropzoneHint: "PNG, JPG, WEBP oder PDF · max. 10 MB",
    unknownType: "Unbekannter Typ",
    removeFile: "Ausgewählte Datei entfernen",
    notesLabel: "Notizen",
    notesOptional: "(optional)",
    notesPlaceholder: "Alles, was die Finanzabteilung über diese Überweisung wissen sollte.",
    confirmation: (amountLabel: string) =>
      `Mit dem Absenden bestätigen Sie, dass Sie ${amountLabel} auf das auf dieser Seite angezeigte verifizierte HenryCo-Konto überwiesen haben.`,
    submitting: "Wird gesendet…",
    submit: "Zahlungsnachweis senden",
  },
  refineButton: {
    ariaLabel: "Entwurf mit KI verfeinern",
    title: "Diesen Entwurf mit KI verfeinern",
    refining: "Wird verfeinert",
    refine: "Verfeinern",
    refinedHint: "Verfeinert",
  },
  tabBar: {
    sectionsLabel: "Projektbereiche",
  },
  toast: {
    viewAction: "Ansehen",
    dismiss: "Benachrichtigung schließen",
  },
};

const IT: DeepPartial<StudioPortalCopy> = {
  attentionStrip: {
    sectionLabel: "Elementi che richiedono la tua attenzione",
    heading: "Richiede la tua attenzione",
    openSuffix: "in sospeso",
    invoiceKicker: "Fattura in sospeso",
    dueSuffix: (dueDate: string) => ` · Scadenza ${dueDate}`,
    payNow: "Paga ora",
    deliverableKicker: "In attesa della tua revisione",
    sharedSuffix: (when: string) => `condiviso ${when}`,
    reviewAndApprove: "Esamina e approva",
    messageKicker: "Messaggio non letto",
    reply: "Rispondi",
  },
  bankDetails: {
    bankRow: "Banca",
    accountNameRow: "Nome del conto",
    accountNumberRow: "Numero di conto",
    heading: (amountLabel: string) => `Paga ${amountLabel} sul conto HenryCo verificato`,
    subtitle:
      "Il bonifico bancario è il metodo attivo per questa fattura. Il pagamento con carta arriverà presto.",
    pendingValue: "In sospeso — contatta l'assistenza",
    copyNumber: "Copia numero",
    referenceNote:
      "Usa il numero della fattura come causale del bonifico. Dopo il bonifico, allega la tua ricevuta qui sotto — l'amministrazione verifica entro un giorno lavorativo.",
  },
  fileCard: {
    approveError: "Non siamo riusciti ad approvarlo in questo momento. Riprova tra poco.",
    versionPrefix: "v",
    sharedPrefix: (date: string) => `· Condiviso il ${date}`,
    preview: "Anteprima",
    download: "Scarica",
    approving: "Approvazione…",
    markApproved: "Segna come approvato",
    approved: "Approvato",
    closePreview: "Chiudi anteprima",
    openInNewTab: "Apri in una nuova scheda",
    fallbackName: "deliverable",
  },
  milestoneProgress: {
    progressLabel: "Avanzamento delle milestone del progetto",
    duePrefix: (date: string) => `Scadenza ${date}`,
    stepPrefix: (n: number) => `Passaggio ${n}`,
  },
  paymentForm: {
    errors: {
      missingFields: "Aggiungi sia un numero di riferimento sia una ricevuta di pagamento.",
      invalidFileType: "Accettiamo solo file PNG, JPG, WEBP e PDF.",
      fileTooLarge: "Il file della ricevuta deve essere di 10 MB o meno.",
      invoiceNotFound: "Non abbiamo trovato questa fattura. Aggiorna e riprova.",
      uploadFailed: "Il caricamento della ricevuta non è riuscito. Controlla la connessione e riprova.",
      duplicateSubmission:
        "Abbiamo già ricevuto un pagamento con questo riferimento. Usa un riferimento diverso se si tratta di un nuovo bonifico.",
      unauthorised: "Questa fattura non appartiene al tuo account.",
      serverError: "Qualcosa è andato storto dalla nostra parte. Riprova tra poco.",
    },
    successHeading: "Ricevuta di pagamento ricevuta",
    successBody: (invoiceNumber: string, amountLabel: string, reference: string) =>
      `Grazie. Stiamo verificando il tuo bonifico per la fattura ${invoiceNumber} (${amountLabel}). Il tuo riferimento ${reference} è registrato. Vedrai questa fattura passare a verificata nel tuo portale cliente non appena l'amministrazione confermerà — di solito entro un giorno lavorativo.`,
    encryptedBadge: "Cifrato in transito · archiviato in sicurezza",
    heading: "Invia ricevuta di pagamento",
    subtitle:
      "Dopo il bonifico, allega la ricevuta o l'avviso bancario e il numero di riferimento generato dalla tua banca. L'amministrazione verifica entro un giorno lavorativo.",
    referenceLabel: "Numero di riferimento bancario",
    referencePlaceholder: "es. NIB/2026/05/001234",
    referenceHint: "Il riferimento del bonifico indicato sulla ricevuta o sull'avviso di addebito bancario.",
    proofLabel: "Ricevuta di pagamento",
    dropzoneTitle: "Trascina qui la tua ricevuta o fai clic per sfogliare",
    dropzoneHint: "PNG, JPG, WEBP o PDF · max 10 MB",
    unknownType: "Tipo sconosciuto",
    removeFile: "Rimuovi il file selezionato",
    notesLabel: "Note",
    notesOptional: "(facoltativo)",
    notesPlaceholder: "Tutto ciò che l'amministrazione dovrebbe sapere su questo bonifico.",
    confirmation: (amountLabel: string) =>
      `Inviando, confermi di aver trasferito ${amountLabel} sul conto HenryCo verificato mostrato in questa pagina.`,
    submitting: "Invio…",
    submit: "Invia ricevuta di pagamento",
  },
  refineButton: {
    ariaLabel: "Perfeziona la bozza con l'IA",
    title: "Rifinisci questa bozza con l'IA",
    refining: "Perfezionamento",
    refine: "Perfeziona",
    refinedHint: "Perfezionato",
  },
  tabBar: {
    sectionsLabel: "Sezioni del progetto",
  },
  toast: {
    viewAction: "Visualizza",
    dismiss: "Ignora notifica",
  },
};

const ZH: DeepPartial<StudioPortalCopy> = {
  attentionStrip: {
    sectionLabel: "需要您关注的事项",
    heading: "需要您关注",
    openSuffix: "项待处理",
    invoiceKicker: "未付发票",
    dueSuffix: (dueDate: string) => ` · 到期 ${dueDate}`,
    payNow: "立即付款",
    deliverableKicker: "等待您审核",
    sharedSuffix: (when: string) => `分享于 ${when}`,
    reviewAndApprove: "审核并批准",
    messageKicker: "未读消息",
    reply: "回复",
  },
  bankDetails: {
    bankRow: "银行",
    accountNameRow: "账户名称",
    accountNumberRow: "账号",
    heading: (amountLabel: string) => `请将 ${amountLabel} 支付至已验证的 HenryCo 账户`,
    subtitle: "银行转账是此发票当前的付款方式。银行卡支付即将推出。",
    pendingValue: "待定 — 请联系客服",
    copyNumber: "复制账号",
    referenceNote:
      "请使用您的发票编号作为转账备注。转账后，请在下方附上付款凭证 — 财务将在一个工作日内核实。",
  },
  fileCard: {
    approveError: "暂时无法批准，请稍后重试。",
    versionPrefix: "v",
    sharedPrefix: (date: string) => `· 分享于 ${date}`,
    preview: "预览",
    download: "下载",
    approving: "正在批准…",
    markApproved: "标记为已批准",
    approved: "已批准",
    closePreview: "关闭预览",
    openInNewTab: "在新标签页中打开",
    fallbackName: "交付物",
  },
  milestoneProgress: {
    progressLabel: "项目里程碑进度",
    duePrefix: (date: string) => `到期 ${date}`,
    stepPrefix: (n: number) => `第 ${n} 步`,
  },
  paymentForm: {
    errors: {
      missingFields: "请同时填写参考编号并上传付款凭证。",
      invalidFileType: "我们仅接受 PNG、JPG、WEBP 和 PDF 文件。",
      fileTooLarge: "凭证文件大小不得超过 10 MB。",
      invoiceNotFound: "未找到此发票。请刷新后重试。",
      uploadFailed: "凭证上传失败。请检查网络连接后重试。",
      duplicateSubmission:
        "我们已收到使用此参考编号的付款。如果这是一笔新转账，请使用不同的参考编号。",
      unauthorised: "此发票不属于您的账户。",
      serverError: "我们这边出现了问题。请稍后重试。",
    },
    successHeading: "已收到付款凭证",
    successBody: (invoiceNumber: string, amountLabel: string, reference: string) =>
      `谢谢。我们正在核实您针对发票 ${invoiceNumber}（${amountLabel}）的转账。您的参考编号 ${reference} 已存档。一旦财务确认，这张发票会在您的客户门户中变为已验证 — 通常在一个工作日内。`,
    encryptedBadge: "传输加密 · 安全存储",
    heading: "提交付款凭证",
    subtitle:
      "转账后，请附上您的银行回单或提醒以及银行生成的参考编号。财务将在一个工作日内核实。",
    referenceLabel: "银行参考编号",
    referencePlaceholder: "例如 NIB/2026/05/001234",
    referenceHint: "显示在您的银行回单或扣款提醒上的转账参考编号。",
    proofLabel: "付款凭证",
    dropzoneTitle: "将凭证拖到此处或点击浏览",
    dropzoneHint: "PNG、JPG、WEBP 或 PDF · 最大 10 MB",
    unknownType: "未知类型",
    removeFile: "移除所选文件",
    notesLabel: "备注",
    notesOptional: "（可选）",
    notesPlaceholder: "关于此次转账，财务需要知道的任何信息。",
    confirmation: (amountLabel: string) =>
      `提交即表示您确认已将 ${amountLabel} 转入本页面显示的已验证 HenryCo 账户。`,
    submitting: "正在提交…",
    submit: "提交付款凭证",
  },
  refineButton: {
    ariaLabel: "使用 AI 润色草稿",
    title: "使用 AI 润色此草稿",
    refining: "正在润色",
    refine: "润色",
    refinedHint: "已润色",
  },
  tabBar: {
    sectionsLabel: "项目板块",
  },
  toast: {
    viewAction: "查看",
    dismiss: "关闭通知",
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<StudioPortalCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
};
// ig, yo, ha, hi are intentionally OMITTED -> fall back to EN (human-translation only).

export function getStudioPortalCopy(locale: AppLocale): StudioPortalCopy {
  const o = LOCALE_MAP[locale];
  if (o)
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      o as unknown as Record<string, unknown>,
    ) as unknown as StudioPortalCopy;
  return EN;
}
