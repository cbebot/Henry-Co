import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

export type AccountWalletExtraCopy = {
  accountDetails: {
    ariaLabel: string;
    kicker: string;
    title: string;
    bankLabel: string;
    accountNameLabel: string;
    accountNumberLabel: string;
    pending: string;
    copy: string;
    copied: string;
  };
  addMoney: {
    amountKicker: string;
    amountPlaceholder: string;
    pendingLabel: string;
    spinnerLabel: string;
    continueLabel: string;
    helper: string;
    minimumError: string;
    startError: string;
    networkError: string;
  };
  ladder: {
    ariaLabel: string;
    kicker: string;
    transferTitle: string;
    transferDesc: string;
    uploadTitle: string;
    uploadDescDefault: string;
    uploadDescAttached: string;
    uploadedAt: (when: string) => string;
    reviewTitle: string;
    reviewDescConfirmed: string;
    reviewDescPending: string;
  };
};

const EN: AccountWalletExtraCopy = {
  accountDetails: {
    ariaLabel: "HenryCo finance account",
    kicker: "Transfer details",
    title: "HenryCo finance account",
    bankLabel: "Bank",
    accountNameLabel: "Account name",
    accountNumberLabel: "Account number",
    pending: "Pending",
    copy: "Copy",
    copied: "Copied",
  },
  addMoney: {
    amountKicker: "Amount (NGN)",
    amountPlaceholder: "Enter amount",
    pendingLabel: "Creating request...",
    spinnerLabel: "Creating funding request",
    continueLabel: "Continue to bank transfer",
    helper:
      "You’ll confirm bank details and upload proof on the next step—balance updates after verification.",
    minimumError: "Minimum amount is NGN 100.",
    startError: "We couldn't start that funding request. Please try again in a moment.",
    networkError: "We couldn't reach the wallet service. Check your connection and try again.",
  },
  ladder: {
    ariaLabel: "Funding progress",
    kicker: "Funding steps",
    transferTitle: "Transfer funds",
    transferDesc: "Use the account details on this page to send your bank transfer.",
    uploadTitle: "Upload proof",
    uploadDescDefault: "Attach the receipt or PDF confirmation so finance can verify.",
    uploadDescAttached: "Proof file is attached.",
    uploadedAt: (when: string) => `Uploaded ${when}`,
    reviewTitle: "Finance review",
    reviewDescConfirmed: "Confirmed. Balance has moved into your available wallet.",
    reviewDescPending: "Our finance team confirms the bank reference matches.",
  },
};

const FR: DeepPartial<AccountWalletExtraCopy> = {
  accountDetails: {
    ariaLabel: "Compte financier HenryCo",
    kicker: "Coordonnées de virement",
    title: "Compte financier HenryCo",
    bankLabel: "Banque",
    accountNameLabel: "Nom du compte",
    accountNumberLabel: "Numéro de compte",
    pending: "En attente",
    copy: "Copier",
    copied: "Copié",
  },
  addMoney: {
    amountKicker: "Montant (NGN)",
    amountPlaceholder: "Saisir un montant",
    pendingLabel: "Création de la demande…",
    spinnerLabel: "Création de la demande de financement",
    continueLabel: "Continuer vers le virement bancaire",
    helper:
      "Vous confirmerez les coordonnées bancaires et téléverserez un justificatif à l’étape suivante—le solde se met à jour après vérification.",
    minimumError: "Le montant minimum est de 100 NGN.",
    startError:
      "Nous n'avons pas pu démarrer cette demande de financement. Veuillez réessayer dans un instant.",
    networkError:
      "Nous n'avons pas pu joindre le service de portefeuille. Vérifiez votre connexion et réessayez.",
  },
  ladder: {
    ariaLabel: "Progression du financement",
    kicker: "Étapes de financement",
    transferTitle: "Transférer les fonds",
    transferDesc:
      "Utilisez les coordonnées du compte sur cette page pour effectuer votre virement bancaire.",
    uploadTitle: "Téléverser le justificatif",
    uploadDescDefault:
      "Joignez le reçu ou la confirmation PDF afin que le service financier puisse vérifier.",
    uploadDescAttached: "Le fichier justificatif est joint.",
    uploadedAt: (when: string) => `Téléversé ${when}`,
    reviewTitle: "Examen financier",
    reviewDescConfirmed: "Confirmé. Le solde a été transféré vers votre portefeuille disponible.",
    reviewDescPending: "Notre équipe financière confirme que la référence bancaire correspond.",
  },
};

const ES: DeepPartial<AccountWalletExtraCopy> = {
  accountDetails: {
    ariaLabel: "Cuenta financiera de HenryCo",
    kicker: "Datos de la transferencia",
    title: "Cuenta financiera de HenryCo",
    bankLabel: "Banco",
    accountNameLabel: "Nombre de la cuenta",
    accountNumberLabel: "Número de cuenta",
    pending: "Pendiente",
    copy: "Copiar",
    copied: "Copiado",
  },
  addMoney: {
    amountKicker: "Importe (NGN)",
    amountPlaceholder: "Introduce un importe",
    pendingLabel: "Creando la solicitud…",
    spinnerLabel: "Creando la solicitud de financiación",
    continueLabel: "Continuar con la transferencia bancaria",
    helper:
      "Confirmarás los datos bancarios y subirás el comprobante en el siguiente paso—el saldo se actualiza tras la verificación.",
    minimumError: "El importe mínimo es de 100 NGN.",
    startError:
      "No pudimos iniciar esa solicitud de financiación. Vuelve a intentarlo en un momento.",
    networkError:
      "No pudimos conectar con el servicio de monedero. Comprueba tu conexión e inténtalo de nuevo.",
  },
  ladder: {
    ariaLabel: "Progreso de la financiación",
    kicker: "Pasos de financiación",
    transferTitle: "Transferir fondos",
    transferDesc:
      "Usa los datos de la cuenta de esta página para realizar tu transferencia bancaria.",
    uploadTitle: "Subir comprobante",
    uploadDescDefault:
      "Adjunta el recibo o la confirmación en PDF para que el departamento financiero pueda verificarlo.",
    uploadDescAttached: "El archivo del comprobante está adjunto.",
    uploadedAt: (when: string) => `Subido ${when}`,
    reviewTitle: "Revisión financiera",
    reviewDescConfirmed: "Confirmado. El saldo se ha trasladado a tu monedero disponible.",
    reviewDescPending: "Nuestro equipo financiero confirma que la referencia bancaria coincide.",
  },
};

const PT: DeepPartial<AccountWalletExtraCopy> = {
  accountDetails: {
    ariaLabel: "Conta financeira da HenryCo",
    kicker: "Dados da transferência",
    title: "Conta financeira da HenryCo",
    bankLabel: "Banco",
    accountNameLabel: "Nome da conta",
    accountNumberLabel: "Número da conta",
    pending: "Pendente",
    copy: "Copiar",
    copied: "Copiado",
  },
  addMoney: {
    amountKicker: "Valor (NGN)",
    amountPlaceholder: "Insira o valor",
    pendingLabel: "Criando a solicitação…",
    spinnerLabel: "Criando a solicitação de financiamento",
    continueLabel: "Continuar para a transferência bancária",
    helper:
      "Você confirmará os dados bancários e enviará o comprovativo na próxima etapa—o saldo é atualizado após a verificação.",
    minimumError: "O valor mínimo é de 100 NGN.",
    startError:
      "Não conseguimos iniciar essa solicitação de financiamento. Tente novamente em instantes.",
    networkError:
      "Não conseguimos contactar o serviço de carteira. Verifique sua conexão e tente novamente.",
  },
  ladder: {
    ariaLabel: "Progresso do financiamento",
    kicker: "Etapas de financiamento",
    transferTitle: "Transferir fundos",
    transferDesc:
      "Use os dados da conta nesta página para fazer sua transferência bancária.",
    uploadTitle: "Enviar comprovativo",
    uploadDescDefault:
      "Anexe o recibo ou a confirmação em PDF para que o setor financeiro possa verificar.",
    uploadDescAttached: "O arquivo do comprovativo está anexado.",
    uploadedAt: (when: string) => `Enviado ${when}`,
    reviewTitle: "Análise financeira",
    reviewDescConfirmed: "Confirmado. O saldo foi transferido para a sua carteira disponível.",
    reviewDescPending: "Nossa equipe financeira confirma que a referência bancária corresponde.",
  },
};

const AR: DeepPartial<AccountWalletExtraCopy> = {
  accountDetails: {
    ariaLabel: "حساب HenryCo المالي",
    kicker: "تفاصيل التحويل",
    title: "حساب HenryCo المالي",
    bankLabel: "البنك",
    accountNameLabel: "اسم الحساب",
    accountNumberLabel: "رقم الحساب",
    pending: "قيد الانتظار",
    copy: "نسخ",
    copied: "تم النسخ",
  },
  addMoney: {
    amountKicker: "المبلغ (NGN)",
    amountPlaceholder: "أدخل المبلغ",
    pendingLabel: "جارٍ إنشاء الطلب…",
    spinnerLabel: "جارٍ إنشاء طلب التمويل",
    continueLabel: "المتابعة إلى التحويل البنكي",
    helper:
      "ستؤكد التفاصيل البنكية وترفع إثباتًا في الخطوة التالية—يتم تحديث الرصيد بعد التحقق.",
    minimumError: "الحد الأدنى للمبلغ هو 100 نيرا.",
    startError:
      "تعذر علينا بدء طلب التمويل هذا. يرجى المحاولة مجددًا بعد لحظة.",
    networkError:
      "تعذر علينا الوصول إلى خدمة المحفظة. تحقق من اتصالك وحاول مجددًا.",
  },
  ladder: {
    ariaLabel: "تقدّم التمويل",
    kicker: "خطوات التمويل",
    transferTitle: "تحويل الأموال",
    transferDesc:
      "استخدم تفاصيل الحساب في هذه الصفحة لإجراء تحويلك البنكي.",
    uploadTitle: "رفع الإثبات",
    uploadDescDefault:
      "أرفق الإيصال أو تأكيد PDF ليتمكن القسم المالي من التحقق.",
    uploadDescAttached: "تم إرفاق ملف الإثبات.",
    uploadedAt: (when: string) => `تم الرفع ${when}`,
    reviewTitle: "المراجعة المالية",
    reviewDescConfirmed: "تم التأكيد. تم نقل الرصيد إلى محفظتك المتاحة.",
    reviewDescPending: "يؤكد فريقنا المالي أن المرجع البنكي مطابق.",
  },
};

const DE: DeepPartial<AccountWalletExtraCopy> = {
  accountDetails: {
    ariaLabel: "HenryCo-Finanzkonto",
    kicker: "Überweisungsdetails",
    title: "HenryCo-Finanzkonto",
    bankLabel: "Bank",
    accountNameLabel: "Kontoname",
    accountNumberLabel: "Kontonummer",
    pending: "Ausstehend",
    copy: "Kopieren",
    copied: "Kopiert",
  },
  addMoney: {
    amountKicker: "Betrag (NGN)",
    amountPlaceholder: "Betrag eingeben",
    pendingLabel: "Anfrage wird erstellt…",
    spinnerLabel: "Finanzierungsanfrage wird erstellt",
    continueLabel: "Weiter zur Banküberweisung",
    helper:
      "Im nächsten Schritt bestätigst du die Bankdaten und lädst einen Nachweis hoch—das Guthaben wird nach der Prüfung aktualisiert.",
    minimumError: "Der Mindestbetrag beträgt 100 NGN.",
    startError:
      "Wir konnten diese Finanzierungsanfrage nicht starten. Bitte versuche es gleich noch einmal.",
    networkError:
      "Wir konnten den Wallet-Dienst nicht erreichen. Überprüfe deine Verbindung und versuche es erneut.",
  },
  ladder: {
    ariaLabel: "Finanzierungsfortschritt",
    kicker: "Finanzierungsschritte",
    transferTitle: "Geld überweisen",
    transferDesc:
      "Verwende die Kontodaten auf dieser Seite, um deine Banküberweisung zu senden.",
    uploadTitle: "Nachweis hochladen",
    uploadDescDefault:
      "Füge die Quittung oder PDF-Bestätigung bei, damit die Finanzabteilung prüfen kann.",
    uploadDescAttached: "Die Nachweisdatei ist angehängt.",
    uploadedAt: (when: string) => `Hochgeladen ${when}`,
    reviewTitle: "Finanzprüfung",
    reviewDescConfirmed: "Bestätigt. Das Guthaben wurde in dein verfügbares Wallet übertragen.",
    reviewDescPending: "Unser Finanzteam bestätigt, dass die Bankreferenz übereinstimmt.",
  },
};

const IT: DeepPartial<AccountWalletExtraCopy> = {
  accountDetails: {
    ariaLabel: "Conto finanziario HenryCo",
    kicker: "Dettagli del bonifico",
    title: "Conto finanziario HenryCo",
    bankLabel: "Banca",
    accountNameLabel: "Nome del conto",
    accountNumberLabel: "Numero di conto",
    pending: "In sospeso",
    copy: "Copia",
    copied: "Copiato",
  },
  addMoney: {
    amountKicker: "Importo (NGN)",
    amountPlaceholder: "Inserisci l'importo",
    pendingLabel: "Creazione della richiesta…",
    spinnerLabel: "Creazione della richiesta di finanziamento",
    continueLabel: "Continua con il bonifico bancario",
    helper:
      "Nel passaggio successivo confermerai i dati bancari e caricherai una prova—il saldo si aggiorna dopo la verifica.",
    minimumError: "L'importo minimo è di 100 NGN.",
    startError:
      "Non siamo riusciti ad avviare questa richiesta di finanziamento. Riprova tra un momento.",
    networkError:
      "Non siamo riusciti a raggiungere il servizio del portafoglio. Controlla la connessione e riprova.",
  },
  ladder: {
    ariaLabel: "Avanzamento del finanziamento",
    kicker: "Passaggi di finanziamento",
    transferTitle: "Trasferisci i fondi",
    transferDesc:
      "Usa i dati del conto presenti in questa pagina per effettuare il tuo bonifico bancario.",
    uploadTitle: "Carica la prova",
    uploadDescDefault:
      "Allega la ricevuta o la conferma in PDF affinché il reparto finanziario possa verificare.",
    uploadDescAttached: "Il file della prova è allegato.",
    uploadedAt: (when: string) => `Caricato ${when}`,
    reviewTitle: "Revisione finanziaria",
    reviewDescConfirmed: "Confermato. Il saldo è stato spostato nel tuo portafoglio disponibile.",
    reviewDescPending: "Il nostro team finanziario conferma che il riferimento bancario corrisponde.",
  },
};

const ZH: DeepPartial<AccountWalletExtraCopy> = {
  accountDetails: {
    ariaLabel: "HenryCo 财务账户",
    kicker: "转账详情",
    title: "HenryCo 财务账户",
    bankLabel: "银行",
    accountNameLabel: "账户名称",
    accountNumberLabel: "账号",
    pending: "待处理",
    copy: "复制",
    copied: "已复制",
  },
  addMoney: {
    amountKicker: "金额（NGN）",
    amountPlaceholder: "输入金额",
    pendingLabel: "正在创建请求…",
    spinnerLabel: "正在创建充值请求",
    continueLabel: "继续银行转账",
    helper:
      "你将在下一步确认银行信息并上传凭证—余额将在验证后更新。",
    minimumError: "最低金额为 100 NGN。",
    startError: "我们无法发起该充值请求。请稍后重试。",
    networkError: "我们无法连接钱包服务。请检查你的网络连接后重试。",
  },
  ladder: {
    ariaLabel: "充值进度",
    kicker: "充值步骤",
    transferTitle: "转账",
    transferDesc: "使用本页的账户信息进行银行转账。",
    uploadTitle: "上传凭证",
    uploadDescDefault: "请附上收据或 PDF 确认函，以便财务部门核验。",
    uploadDescAttached: "凭证文件已附上。",
    uploadedAt: (when: string) => `已于 ${when} 上传`,
    reviewTitle: "财务审核",
    reviewDescConfirmed: "已确认。余额已转入你的可用钱包。",
    reviewDescPending: "我们的财务团队正在确认银行参考号是否匹配。",
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<AccountWalletExtraCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
};
// ig, yo, ha, hi are intentionally OMITTED -> fall back to EN (human-translation only).

export function getAccountWalletExtraCopy(locale: AppLocale): AccountWalletExtraCopy {
  const o = LOCALE_MAP[locale];
  if (o) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      o as unknown as Record<string, unknown>,
    ) as unknown as AccountWalletExtraCopy;
  }
  return EN;
}
