/**
 * surface:payments — static labels rendered into branded money documents (receipt
 * + invoice PDFs). V3-18.
 *
 * Money figures themselves are NEVER translated (a naira amount is locale-invariant
 * and is formatted by `@henryco/branded-documents/format`); only the surrounding
 * static labels are localized here. The shape mirrors `PaymentDocumentLabels` in
 * `@henryco/branded-documents` (the rendering package stays i18n-agnostic — the app
 * resolves a locale's copy and passes it in; TypeScript checks structural
 * compatibility at the call site).
 *
 * Legal-footer lines carry `{issuer}` / `{email}` placeholders that the template
 * interpolates from `@henryco/config` so the legal entity + billing inbox are never
 * hardcoded into a translation string.
 *
 * Coverage follows the repo's locale tiers (see locales.ts): en/fr/es/pt/de/it/ar
 * carry full native copy; ig/yo/ha/zh/hi carry full native copy for these standard
 * financial terms too. `deepMergeMessages` falls back to EN for any unset key.
 */

import type { AppLocale } from "./locales";
import { deepMergeMessages } from "./merge-messages";

export type PaymentDocumentCopy = {
  // Document-type kickers
  receiptType: string;
  invoiceType: string;

  // Party section headers
  issuedBy: string; // receipt issuer header
  from: string; // invoice issuer header
  billedTo: string; // receipt customer header
  billTo: string; // invoice customer header

  // Issuer detail labels
  rc: string; // CAC RC number label
  vatId: string; // issuer VAT/TIN label

  // Customer rows
  customerName: string;
  customerEmail: string;
  delivery: string;

  // Header meta labels
  metaPaid: string;
  metaIssued: string;
  metaDue: string;
  metaOnReceipt: string;
  metaMethod: string;
  metaReference: string;
  metaStatus: string;

  // Banner
  totalPaid: string;

  // Items tables
  receiptItemsSection: string;
  invoiceItemsSection: string;
  colItem: string;
  colQty: string;
  colUnit: string;
  colAmount: string;
  receiptItemsEmpty: string;
  invoiceItemsEmpty: string;

  // Settlement / totals
  settlement: string;
  subtotal: string;
  discount: string;
  fees: string;
  vat: string; // the VAT line label
  vatRated: string; // NRS rated-VAT label template, "{rate}" → "7.5%" → "VAT (7.5%)"
  vatExempt: string; // NRS classification note (non-standard supply, no amount)
  vatZeroRated: string;
  vatOutOfScope: string;
  vatTreatment: string; // heading for the classification-note row
  total: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentReference: string;
  paidAt: string;

  notes: string;
  auditReference: string;

  // Status values
  statusPaid: string;
  statusIssued: string;
  statusVoid: string;
  statusPending: string;
  statusRefunded: string;

  // Payment-method values
  methodCard: string;
  methodBank: string;
  methodTransfer: string;
  methodWallet: string;
  methodUssd: string;

  // Legal-footer lines ({issuer}/{email} interpolated from config)
  receiptLegal1: string;
  receiptLegal2: string;
  invoiceLegal1: string;
  invoiceLegal2: string;

  // Default invoice subtitle when none is provided
  defaultInvoiceDescription: string;

  // Credit note (V3-19) — the legal face of a confirmed refund. Money figures
  // stay raw; the {issuer}/{email} placeholders interpolate from config.
  creditNoteType: string;
  totalCredited: string;
  metaRefunded: string;
  refundOf: string; // label preceding the original receipt number
  creditNoteItemsSection: string;
  creditNoteItemsEmpty: string;
  creditNoteLegal1: string;
  creditNoteLegal2: string;
};

const EN: PaymentDocumentCopy = {
  receiptType: "Receipt",
  invoiceType: "Invoice",

  issuedBy: "Issued by",
  from: "From",
  billedTo: "Billed to",
  billTo: "Bill to",

  rc: "RC",
  vatId: "VAT No. (TIN)",

  customerName: "Name",
  customerEmail: "Email",
  delivery: "Delivery",

  metaPaid: "Paid",
  metaIssued: "Issued",
  metaDue: "Due",
  metaOnReceipt: "On receipt",
  metaMethod: "Method",
  metaReference: "Reference",
  metaStatus: "Status",

  totalPaid: "Total paid",

  receiptItemsSection: "What was paid",
  invoiceItemsSection: "Line items",
  colItem: "Item",
  colQty: "Qty",
  colUnit: "Unit",
  colAmount: "Amount",
  receiptItemsEmpty: "No items recorded.",
  invoiceItemsEmpty: "No structured line items recorded.",

  settlement: "Settlement",
  subtotal: "Subtotal",
  discount: "Discount",
  fees: "Fees",
  vat: "VAT",
  vatRated: "VAT ({rate})",
  vatExempt: "VAT exempt",
  vatZeroRated: "Zero-rated (0%)",
  vatOutOfScope: "Outside the scope of VAT",
  vatTreatment: "VAT treatment",
  total: "Total",
  paymentStatus: "Payment status",
  paymentMethod: "Payment method",
  paymentReference: "Payment reference",
  paidAt: "Paid at",

  notes: "Notes",
  auditReference: "Audit reference",

  statusPaid: "Paid",
  statusIssued: "Issued",
  statusVoid: "Void",
  statusPending: "Pending",
  statusRefunded: "Refunded",

  methodCard: "Card",
  methodBank: "Bank transfer",
  methodTransfer: "Transfer",
  methodWallet: "Wallet",
  methodUssd: "USSD",

  receiptLegal1:
    "This receipt evidences a payment received by {issuer}. Any tax shown reflects the rate in force on the payment date above.",
  receiptLegal2:
    "Questions about this receipt? Contact {email} within 7 days for the quickest resolution.",
  invoiceLegal1:
    "This invoice is issued by {issuer} under unified billing. The originating division remains the source of truth for delivery, dispute, and refund terms.",
  invoiceLegal2:
    "Payment is marked confirmed once we have verified it. The status shown reflects the most recent update.",

  defaultInvoiceDescription: "Payment summary",

  creditNoteType: "Credit note",
  totalCredited: "Amount credited",
  metaRefunded: "Refunded",
  refundOf: "Refund of receipt",
  creditNoteItemsSection: "What was refunded",
  creditNoteItemsEmpty: "No items recorded.",
  creditNoteLegal1:
    "This credit note evidences a refund issued by {issuer} against the receipt referenced above. Any tax shown reverses the tax on the refunded portion.",
  creditNoteLegal2:
    "Questions about this credit note? Contact {email} within 7 days for the quickest resolution.",
};

const FR: Partial<PaymentDocumentCopy> = {
  receiptType: "Reçu",
  invoiceType: "Facture",
  issuedBy: "Émis par",
  from: "De",
  billedTo: "Facturé à",
  billTo: "Facturer à",
  rc: "RC",
  vatId: "N° TVA (TIN)",
  customerName: "Nom",
  customerEmail: "E-mail",
  delivery: "Livraison",
  metaPaid: "Payé",
  metaIssued: "Émis",
  metaDue: "Échéance",
  metaOnReceipt: "À réception",
  metaMethod: "Mode",
  metaReference: "Référence",
  metaStatus: "Statut",
  totalPaid: "Total payé",
  receiptItemsSection: "Ce qui a été payé",
  invoiceItemsSection: "Lignes",
  colItem: "Article",
  colQty: "Qté",
  colUnit: "Unitaire",
  colAmount: "Montant",
  receiptItemsEmpty: "Aucun article enregistré.",
  invoiceItemsEmpty: "Aucune ligne structurée enregistrée.",
  settlement: "Règlement",
  subtotal: "Sous-total",
  discount: "Remise",
  fees: "Frais",
  vat: "TVA",
  vatRated: "TVA ({rate})",
  vatExempt: "Exonéré de TVA",
  vatZeroRated: "Taux zéro (0 %)",
  vatOutOfScope: "Hors du champ de la TVA",
  vatTreatment: "Régime de TVA",
  total: "Total",
  paymentStatus: "Statut du paiement",
  paymentMethod: "Mode de paiement",
  paymentReference: "Référence du paiement",
  paidAt: "Payé le",
  notes: "Notes",
  auditReference: "Référence d'audit",
  statusPaid: "Payé",
  statusIssued: "Émis",
  statusVoid: "Annulé",
  statusPending: "En attente",
  statusRefunded: "Remboursé",
  methodCard: "Carte",
  methodBank: "Virement bancaire",
  methodTransfer: "Virement",
  methodWallet: "Portefeuille",
  methodUssd: "USSD",
  receiptLegal1:
    "Ce reçu atteste d'un paiement reçu par {issuer}. Toute taxe indiquée reflète le taux en vigueur à la date de paiement ci-dessus.",
  receiptLegal2:
    "Une question sur ce reçu ? Contactez {email} sous 7 jours pour une résolution rapide.",
  invoiceLegal1:
    "Cette facture est émise par {issuer} dans le cadre d'une facturation unifiée. La division d'origine reste la source de référence pour les conditions de livraison, de litige et de remboursement.",
  invoiceLegal2:
    "Le paiement est marqué comme confirmé une fois que nous l'avons vérifié. Le statut indiqué reflète la mise à jour la plus récente.",
  defaultInvoiceDescription: "Récapitulatif de paiement",

  creditNoteType: "Avoir",
  totalCredited: "Montant crédité",
  metaRefunded: "Remboursé le",
  refundOf: "Remboursement du reçu",
  creditNoteItemsSection: "Ce qui a été remboursé",
  creditNoteItemsEmpty: "Aucun article enregistré.",
  creditNoteLegal1:
    "Cet avoir atteste d'un remboursement émis par {issuer} au titre du reçu référencé ci-dessus. Toute taxe indiquée annule la taxe sur la part remboursée.",
  creditNoteLegal2:
    "Une question sur cet avoir ? Contactez {email} sous 7 jours pour une résolution rapide.",
};

const ES: Partial<PaymentDocumentCopy> = {
  receiptType: "Recibo",
  invoiceType: "Factura",
  issuedBy: "Emitido por",
  from: "De",
  billedTo: "Facturado a",
  billTo: "Facturar a",
  rc: "RC",
  vatId: "N.º de IVA (TIN)",
  customerName: "Nombre",
  customerEmail: "Correo electrónico",
  delivery: "Entrega",
  metaPaid: "Pagado",
  metaIssued: "Emitido",
  metaDue: "Vencimiento",
  metaOnReceipt: "Al recibir",
  metaMethod: "Método",
  metaReference: "Referencia",
  metaStatus: "Estado",
  totalPaid: "Total pagado",
  receiptItemsSection: "Lo que se pagó",
  invoiceItemsSection: "Conceptos",
  colItem: "Concepto",
  colQty: "Cant.",
  colUnit: "Unitario",
  colAmount: "Importe",
  receiptItemsEmpty: "No se registraron conceptos.",
  invoiceItemsEmpty: "No se registraron conceptos estructurados.",
  settlement: "Liquidación",
  subtotal: "Subtotal",
  discount: "Descuento",
  fees: "Comisiones",
  vat: "IVA",
  vatRated: "IVA ({rate})",
  vatExempt: "Exento de IVA",
  vatZeroRated: "Tipo cero (0 %)",
  vatOutOfScope: "Fuera del ámbito del IVA",
  vatTreatment: "Régimen de IVA",
  total: "Total",
  paymentStatus: "Estado del pago",
  paymentMethod: "Método de pago",
  paymentReference: "Referencia del pago",
  paidAt: "Pagado el",
  notes: "Notas",
  auditReference: "Referencia de auditoría",
  statusPaid: "Pagado",
  statusIssued: "Emitido",
  statusVoid: "Anulado",
  statusPending: "Pendiente",
  statusRefunded: "Reembolsado",
  methodCard: "Tarjeta",
  methodBank: "Transferencia bancaria",
  methodTransfer: "Transferencia",
  methodWallet: "Monedero",
  methodUssd: "USSD",
  receiptLegal1:
    "Este recibo acredita un pago recibido por {issuer}. Cualquier impuesto mostrado refleja la tasa vigente en la fecha de pago anterior.",
  receiptLegal2:
    "¿Dudas sobre este recibo? Escribe a {email} en un plazo de 7 días para una resolución más rápida.",
  invoiceLegal1:
    "Esta factura es emitida por {issuer} bajo facturación unificada. La división de origen sigue siendo la fuente de referencia para las condiciones de entrega, disputa y reembolso.",
  invoiceLegal2:
    "El pago se marca como confirmado una vez que lo hemos verificado. El estado mostrado refleja la actualización más reciente.",
  defaultInvoiceDescription: "Resumen de pago",

  creditNoteType: "Nota de crédito",
  totalCredited: "Importe abonado",
  metaRefunded: "Reembolsado",
  refundOf: "Reembolso del recibo",
  creditNoteItemsSection: "Lo reembolsado",
  creditNoteItemsEmpty: "No hay artículos registrados.",
  creditNoteLegal1:
    "Esta nota de crédito acredita un reembolso emitido por {issuer} sobre el recibo arriba referenciado. Cualquier impuesto mostrado revierte el impuesto de la parte reembolsada.",
  creditNoteLegal2:
    "¿Preguntas sobre esta nota de crédito? Escriba a {email} en un plazo de 7 días para una resolución rápida.",
};

const PT: Partial<PaymentDocumentCopy> = {
  receiptType: "Recibo",
  invoiceType: "Fatura",
  issuedBy: "Emitido por",
  from: "De",
  billedTo: "Faturado a",
  billTo: "Faturar para",
  rc: "RC",
  vatId: "N.º de IVA (TIN)",
  customerName: "Nome",
  customerEmail: "E-mail",
  delivery: "Entrega",
  metaPaid: "Pago",
  metaIssued: "Emitido",
  metaDue: "Vencimento",
  metaOnReceipt: "No recebimento",
  metaMethod: "Método",
  metaReference: "Referência",
  metaStatus: "Estado",
  totalPaid: "Total pago",
  receiptItemsSection: "O que foi pago",
  invoiceItemsSection: "Itens",
  colItem: "Item",
  colQty: "Qtd.",
  colUnit: "Unitário",
  colAmount: "Valor",
  receiptItemsEmpty: "Nenhum item registrado.",
  invoiceItemsEmpty: "Nenhum item estruturado registrado.",
  settlement: "Liquidação",
  subtotal: "Subtotal",
  discount: "Desconto",
  fees: "Taxas",
  vat: "IVA",
  vatRated: "IVA ({rate})",
  vatExempt: "Isento de IVA",
  vatZeroRated: "Taxa zero (0 %)",
  vatOutOfScope: "Fora do âmbito do IVA",
  vatTreatment: "Regime de IVA",
  total: "Total",
  paymentStatus: "Estado do pagamento",
  paymentMethod: "Método de pagamento",
  paymentReference: "Referência do pagamento",
  paidAt: "Pago em",
  notes: "Notas",
  auditReference: "Referência de auditoria",
  statusPaid: "Pago",
  statusIssued: "Emitido",
  statusVoid: "Anulado",
  statusPending: "Pendente",
  statusRefunded: "Reembolsado",
  methodCard: "Cartão",
  methodBank: "Transferência bancária",
  methodTransfer: "Transferência",
  methodWallet: "Carteira",
  methodUssd: "USSD",
  receiptLegal1:
    "Este recibo comprova um pagamento recebido por {issuer}. Qualquer imposto exibido reflete a taxa em vigor na data de pagamento acima.",
  receiptLegal2:
    "Dúvidas sobre este recibo? Contacte {email} em até 7 dias para a resolução mais rápida.",
  invoiceLegal1:
    "Esta fatura é emitida por {issuer} sob faturação unificada. A divisão de origem permanece a fonte de referência para as condições de entrega, disputa e reembolso.",
  invoiceLegal2:
    "O pagamento é marcado como confirmado assim que o verificamos. O estado apresentado reflete a atualização mais recente.",
  defaultInvoiceDescription: "Resumo de pagamento",

  creditNoteType: "Nota de crédito",
  totalCredited: "Valor creditado",
  metaRefunded: "Reembolsado",
  refundOf: "Reembolso do recibo",
  creditNoteItemsSection: "O que foi reembolsado",
  creditNoteItemsEmpty: "Nenhum item registado.",
  creditNoteLegal1:
    "Esta nota de crédito comprova um reembolso emitido por {issuer} relativo ao recibo acima referenciado. Qualquer imposto apresentado reverte o imposto da parte reembolsada.",
  creditNoteLegal2:
    "Dúvidas sobre esta nota de crédito? Contacte {email} no prazo de 7 dias para uma resolução rápida.",
};

const DE: Partial<PaymentDocumentCopy> = {
  receiptType: "Beleg",
  invoiceType: "Rechnung",
  issuedBy: "Ausgestellt von",
  from: "Von",
  billedTo: "Rechnung an",
  billTo: "Rechnung an",
  rc: "RC",
  vatId: "USt-IdNr. (TIN)",
  customerName: "Name",
  customerEmail: "E-Mail",
  delivery: "Lieferung",
  metaPaid: "Bezahlt",
  metaIssued: "Ausgestellt",
  metaDue: "Fällig",
  metaOnReceipt: "Bei Erhalt",
  metaMethod: "Methode",
  metaReference: "Referenz",
  metaStatus: "Status",
  totalPaid: "Gesamt bezahlt",
  receiptItemsSection: "Was bezahlt wurde",
  invoiceItemsSection: "Positionen",
  colItem: "Position",
  colQty: "Menge",
  colUnit: "Einzel",
  colAmount: "Betrag",
  receiptItemsEmpty: "Keine Positionen erfasst.",
  invoiceItemsEmpty: "Keine strukturierten Positionen erfasst.",
  settlement: "Abrechnung",
  subtotal: "Zwischensumme",
  discount: "Rabatt",
  fees: "Gebühren",
  vat: "USt",
  vatRated: "USt ({rate})",
  vatExempt: "USt-befreit",
  vatZeroRated: "Nullsatz (0 %)",
  vatOutOfScope: "Nicht im Anwendungsbereich der USt",
  vatTreatment: "USt-Behandlung",
  total: "Gesamt",
  paymentStatus: "Zahlungsstatus",
  paymentMethod: "Zahlungsmethode",
  paymentReference: "Zahlungsreferenz",
  paidAt: "Bezahlt am",
  notes: "Hinweise",
  auditReference: "Prüfreferenz",
  statusPaid: "Bezahlt",
  statusIssued: "Ausgestellt",
  statusVoid: "Storniert",
  statusPending: "Ausstehend",
  statusRefunded: "Erstattet",
  methodCard: "Karte",
  methodBank: "Banküberweisung",
  methodTransfer: "Überweisung",
  methodWallet: "Wallet",
  methodUssd: "USSD",
  receiptLegal1:
    "Dieser Beleg bestätigt eine von {issuer} erhaltene Zahlung. Eine etwaige ausgewiesene Steuer entspricht dem am obigen Zahlungsdatum geltenden Satz.",
  receiptLegal2:
    "Fragen zu diesem Beleg? Kontaktieren Sie {email} innerhalb von 7 Tagen für die schnellste Klärung.",
  invoiceLegal1:
    "Diese Rechnung wird von {issuer} im Rahmen der einheitlichen Abrechnung ausgestellt. Der ursprüngliche Geschäftsbereich bleibt maßgeblich für Liefer-, Streit- und Erstattungsbedingungen.",
  invoiceLegal2:
    "Die Zahlung gilt als bestätigt, sobald wir sie geprüft haben. Der angezeigte Status spiegelt die aktuellste Aktualisierung wider.",
  defaultInvoiceDescription: "Zahlungsübersicht",

  creditNoteType: "Gutschrift",
  totalCredited: "Gutgeschriebener Betrag",
  metaRefunded: "Erstattet",
  refundOf: "Erstattung zur Quittung",
  creditNoteItemsSection: "Was erstattet wurde",
  creditNoteItemsEmpty: "Keine Positionen erfasst.",
  creditNoteLegal1:
    "Diese Gutschrift belegt eine von {issuer} ausgestellte Erstattung zur oben genannten Quittung. Ausgewiesene Steuern kehren die Steuer auf den erstatteten Anteil um.",
  creditNoteLegal2:
    "Fragen zu dieser Gutschrift? Kontaktieren Sie {email} innerhalb von 7 Tagen für eine schnelle Klärung.",
};

const IT: Partial<PaymentDocumentCopy> = {
  receiptType: "Ricevuta",
  invoiceType: "Fattura",
  issuedBy: "Emesso da",
  from: "Da",
  billedTo: "Fatturato a",
  billTo: "Fatturare a",
  rc: "RC",
  vatId: "P. IVA (TIN)",
  customerName: "Nome",
  customerEmail: "E-mail",
  delivery: "Consegna",
  metaPaid: "Pagato",
  metaIssued: "Emesso",
  metaDue: "Scadenza",
  metaOnReceipt: "Alla ricezione",
  metaMethod: "Metodo",
  metaReference: "Riferimento",
  metaStatus: "Stato",
  totalPaid: "Totale pagato",
  receiptItemsSection: "Cosa è stato pagato",
  invoiceItemsSection: "Voci",
  colItem: "Voce",
  colQty: "Qtà",
  colUnit: "Unitario",
  colAmount: "Importo",
  receiptItemsEmpty: "Nessuna voce registrata.",
  invoiceItemsEmpty: "Nessuna voce strutturata registrata.",
  settlement: "Liquidazione",
  subtotal: "Subtotale",
  discount: "Sconto",
  fees: "Commissioni",
  vat: "IVA",
  vatRated: "IVA ({rate})",
  vatExempt: "Esente IVA",
  vatZeroRated: "Aliquota zero (0%)",
  vatOutOfScope: "Fuori campo IVA",
  vatTreatment: "Regime IVA",
  total: "Totale",
  paymentStatus: "Stato del pagamento",
  paymentMethod: "Metodo di pagamento",
  paymentReference: "Riferimento del pagamento",
  paidAt: "Pagato il",
  notes: "Note",
  auditReference: "Riferimento di audit",
  statusPaid: "Pagato",
  statusIssued: "Emesso",
  statusVoid: "Annullato",
  statusPending: "In attesa",
  statusRefunded: "Rimborsato",
  methodCard: "Carta",
  methodBank: "Bonifico bancario",
  methodTransfer: "Bonifico",
  methodWallet: "Portafoglio",
  methodUssd: "USSD",
  receiptLegal1:
    "Questa ricevuta attesta un pagamento ricevuto da {issuer}. Eventuali imposte indicate riflettono l'aliquota in vigore alla data di pagamento sopra indicata.",
  receiptLegal2:
    "Domande su questa ricevuta? Contatta {email} entro 7 giorni per la risoluzione più rapida.",
  invoiceLegal1:
    "Questa fattura è emessa da {issuer} nell'ambito della fatturazione unificata. La divisione di origine resta la fonte di riferimento per le condizioni di consegna, contestazione e rimborso.",
  invoiceLegal2:
    "Il pagamento è contrassegnato come confermato una volta che lo abbiamo verificato. Lo stato mostrato riflette l'aggiornamento più recente.",
  defaultInvoiceDescription: "Riepilogo del pagamento",

  creditNoteType: "Nota di credito",
  totalCredited: "Importo accreditato",
  metaRefunded: "Rimborsato",
  refundOf: "Rimborso della ricevuta",
  creditNoteItemsSection: "Cosa è stato rimborsato",
  creditNoteItemsEmpty: "Nessuna voce registrata.",
  creditNoteLegal1:
    "Questa nota di credito attesta un rimborso emesso da {issuer} a fronte della ricevuta sopra indicata. Le imposte indicate stornano l'imposta sulla parte rimborsata.",
  creditNoteLegal2:
    "Domande su questa nota di credito? Contatta {email} entro 7 giorni per una rapida risoluzione.",
};

const AR: Partial<PaymentDocumentCopy> = {
  receiptType: "إيصال",
  invoiceType: "فاتورة",
  issuedBy: "صادر عن",
  from: "من",
  billedTo: "مفوتر إلى",
  billTo: "الفاتورة إلى",
  rc: "رقم السجل",
  vatId: "رقم ضريبة القيمة المضافة (TIN)",
  customerName: "الاسم",
  customerEmail: "البريد الإلكتروني",
  delivery: "التسليم",
  metaPaid: "مدفوع",
  metaIssued: "صدر",
  metaDue: "الاستحقاق",
  metaOnReceipt: "عند الاستلام",
  metaMethod: "الطريقة",
  metaReference: "المرجع",
  metaStatus: "الحالة",
  totalPaid: "إجمالي المدفوع",
  receiptItemsSection: "ما تم دفعه",
  invoiceItemsSection: "البنود",
  colItem: "البند",
  colQty: "الكمية",
  colUnit: "سعر الوحدة",
  colAmount: "المبلغ",
  receiptItemsEmpty: "لا توجد بنود مسجلة.",
  invoiceItemsEmpty: "لا توجد بنود منظمة مسجلة.",
  settlement: "التسوية",
  subtotal: "المجموع الفرعي",
  discount: "الخصم",
  fees: "الرسوم",
  vat: "ضريبة القيمة المضافة",
  vatRated: "ضريبة القيمة المضافة ({rate})",
  vatExempt: "معفى من ضريبة القيمة المضافة",
  vatZeroRated: "معدل صفري (0%)",
  vatOutOfScope: "خارج نطاق ضريبة القيمة المضافة",
  vatTreatment: "معاملة ضريبة القيمة المضافة",
  total: "الإجمالي",
  paymentStatus: "حالة الدفع",
  paymentMethod: "طريقة الدفع",
  paymentReference: "مرجع الدفع",
  paidAt: "تاريخ الدفع",
  notes: "ملاحظات",
  auditReference: "مرجع التدقيق",
  statusPaid: "مدفوع",
  statusIssued: "صادر",
  statusVoid: "ملغى",
  statusPending: "قيد الانتظار",
  statusRefunded: "مُسترد",
  methodCard: "بطاقة",
  methodBank: "تحويل بنكي",
  methodTransfer: "تحويل",
  methodWallet: "محفظة",
  methodUssd: "USSD",
  receiptLegal1:
    "يثبت هذا الإيصال استلام دفعة من قبل {issuer}. تعكس أي ضريبة معروضة المعدل المعمول به في تاريخ الدفع أعلاه.",
  receiptLegal2:
    "أسئلة حول هذا الإيصال؟ تواصل مع {email} خلال 7 أيام للحصول على أسرع حل.",
  invoiceLegal1:
    "صدرت هذه الفاتورة عن {issuer} ضمن الفوترة الموحدة. يظل القسم المصدر هو المرجع لشروط التسليم والنزاع والاسترداد.",
  invoiceLegal2:
    "يُوضع الدفع كمؤكَّد بمجرد أن نتحقق منه. تعكس الحالة المعروضة أحدث تحديث.",
  defaultInvoiceDescription: "ملخص الدفع",

  creditNoteType: "إشعار دائن",
  totalCredited: "المبلغ المعاد",
  metaRefunded: "تم الاسترداد",
  refundOf: "استرداد للإيصال",
  creditNoteItemsSection: "ما تم استرداده",
  creditNoteItemsEmpty: "لا توجد عناصر مسجلة.",
  creditNoteLegal1:
    "يثبت إشعار الدائن هذا استردادًا صادرًا عن {issuer} مقابل الإيصال المشار إليه أعلاه. وأي ضريبة مبيّنة تعكس الضريبة على الجزء المستردّ.",
  creditNoteLegal2:
    "لديك سؤال حول إشعار الدائن هذا؟ تواصل مع {email} خلال 7 أيام لحل أسرع.",
};

const ZH: Partial<PaymentDocumentCopy> = {
  receiptType: "收据",
  invoiceType: "发票",
  issuedBy: "开具方",
  from: "开具方",
  billedTo: "付款方",
  billTo: "付款方",
  rc: "注册号",
  vatId: "增值税号 (TIN)",
  customerName: "姓名",
  customerEmail: "电子邮箱",
  delivery: "配送",
  metaPaid: "已付",
  metaIssued: "开具日期",
  metaDue: "到期",
  metaOnReceipt: "收到时",
  metaMethod: "方式",
  metaReference: "参考号",
  metaStatus: "状态",
  totalPaid: "已付总额",
  receiptItemsSection: "付款明细",
  invoiceItemsSection: "项目",
  colItem: "项目",
  colQty: "数量",
  colUnit: "单价",
  colAmount: "金额",
  receiptItemsEmpty: "未记录任何项目。",
  invoiceItemsEmpty: "未记录结构化项目。",
  settlement: "结算",
  subtotal: "小计",
  discount: "折扣",
  fees: "费用",
  vat: "增值税",
  vatRated: "增值税 ({rate})",
  vatExempt: "增值税免税",
  vatZeroRated: "零税率 (0%)",
  vatOutOfScope: "不属于增值税范围",
  vatTreatment: "增值税处理",
  total: "合计",
  paymentStatus: "付款状态",
  paymentMethod: "付款方式",
  paymentReference: "付款参考号",
  paidAt: "付款时间",
  notes: "备注",
  auditReference: "审计参考",
  statusPaid: "已付",
  statusIssued: "已开具",
  statusVoid: "已作废",
  statusPending: "待处理",
  statusRefunded: "已退款",
  methodCard: "银行卡",
  methodBank: "银行转账",
  methodTransfer: "转账",
  methodWallet: "钱包",
  methodUssd: "USSD",
  receiptLegal1:
    "本收据证明 {issuer} 已收到一笔付款。所示任何税费均按上述付款日期适用的税率计算。",
  receiptLegal2: "对本收据有疑问？请在 7 天内联系 {email} 以获得最快的处理。",
  invoiceLegal1:
    "本发票由 {issuer} 在统一开票下开具。原始业务部门仍是交付、争议和退款条款的依据。",
  invoiceLegal2: "付款经我们核实后即标记为已确认；所示状态反映最新更新。",
  defaultInvoiceDescription: "付款摘要",

  creditNoteType: "贷记单",
  totalCredited: "退款金额",
  metaRefunded: "已退款",
  refundOf: "对应收据的退款",
  creditNoteItemsSection: "退款明细",
  creditNoteItemsEmpty: "暂无记录项目。",
  creditNoteLegal1:
    "本贷记单证明 {issuer} 已就上述收据签发退款。所示税额为退款部分相应税额的冲销。",
  creditNoteLegal2:
    "对本贷记单有疑问？请在 7 天内联系 {email} 以便尽快处理。",
};

const HI: Partial<PaymentDocumentCopy> = {
  receiptType: "रसीद",
  invoiceType: "चालान",
  issuedBy: "जारीकर्ता",
  from: "की ओर से",
  billedTo: "बिल प्राप्तकर्ता",
  billTo: "बिल प्राप्तकर्ता",
  rc: "RC",
  vatId: "वैट सं. (TIN)",
  customerName: "नाम",
  customerEmail: "ईमेल",
  delivery: "डिलीवरी",
  metaPaid: "भुगतान किया",
  metaIssued: "जारी",
  metaDue: "देय",
  metaOnReceipt: "प्राप्ति पर",
  metaMethod: "तरीका",
  metaReference: "संदर्भ",
  metaStatus: "स्थिति",
  totalPaid: "कुल भुगतान",
  receiptItemsSection: "क्या भुगतान किया गया",
  invoiceItemsSection: "मदें",
  colItem: "मद",
  colQty: "मात्रा",
  colUnit: "इकाई",
  colAmount: "राशि",
  receiptItemsEmpty: "कोई मद दर्ज नहीं।",
  invoiceItemsEmpty: "कोई संरचित मद दर्ज नहीं।",
  settlement: "निपटान",
  subtotal: "उप-योग",
  discount: "छूट",
  fees: "शुल्क",
  vat: "वैट",
  vatRated: "वैट ({rate})",
  vatExempt: "वैट मुक्त",
  vatZeroRated: "शून्य दर (0%)",
  vatOutOfScope: "वैट के दायरे से बाहर",
  vatTreatment: "वैट व्यवहार",
  total: "कुल",
  paymentStatus: "भुगतान स्थिति",
  paymentMethod: "भुगतान तरीका",
  paymentReference: "भुगतान संदर्भ",
  paidAt: "भुगतान तिथि",
  notes: "टिप्पणियाँ",
  auditReference: "ऑडिट संदर्भ",
  statusPaid: "भुगतान किया",
  statusIssued: "जारी",
  statusVoid: "रद्द",
  statusPending: "लंबित",
  statusRefunded: "वापस किया",
  methodCard: "कार्ड",
  methodBank: "बैंक ट्रांसफर",
  methodTransfer: "ट्रांसफर",
  methodWallet: "वॉलेट",
  methodUssd: "USSD",
  receiptLegal1:
    "यह रसीद {issuer} द्वारा प्राप्त भुगतान का प्रमाण है। दर्शाया गया कोई भी कर ऊपर दी गई भुगतान तिथि पर लागू दर को दर्शाता है।",
  receiptLegal2:
    "इस रसीद के बारे में प्रश्न? सबसे तेज़ समाधान के लिए 7 दिनों के भीतर {email} से संपर्क करें।",
  invoiceLegal1:
    "यह चालान {issuer} द्वारा एकीकृत बिलिंग के अंतर्गत जारी किया गया है। मूल प्रभाग डिलीवरी, विवाद और वापसी शर्तों का आधार बना रहता है।",
  invoiceLegal2:
    "सत्यापन के बाद भुगतान को पुष्ट के रूप में चिह्नित किया जाता है। दिखाई गई स्थिति नवीनतम अपडेट दर्शाती है।",
  defaultInvoiceDescription: "भुगतान सारांश",

  creditNoteType: "क्रेडिट नोट",
  totalCredited: "वापस की गई राशि",
  metaRefunded: "धनवापसी की गई",
  refundOf: "रसीद की धनवापसी",
  creditNoteItemsSection: "क्या वापस किया गया",
  creditNoteItemsEmpty: "कोई आइटम दर्ज नहीं।",
  creditNoteLegal1:
    "यह क्रेडिट नोट {issuer} द्वारा ऊपर संदर्भित रसीद के विरुद्ध जारी धनवापसी का प्रमाण है। दर्शाया गया कोई भी कर वापस किए गए हिस्से के कर का प्रतिवर्तन है।",
  creditNoteLegal2:
    "इस क्रेडिट नोट के बारे में प्रश्न? शीघ्र समाधान के लिए 7 दिनों के भीतर {email} से संपर्क करें।",
};

const IG: Partial<PaymentDocumentCopy> = {
  receiptType: "Akwụkwọ nnata ego",
  invoiceType: "Akwụkwọ ụgwọ",
  issuedBy: "Onye nyere ya",
  from: "Site na",
  billedTo: "E mere ụgwọ nye",
  billTo: "Ụgwọ nye",
  rc: "RC",
  vatId: "Nọmba VAT (TIN)",
  customerName: "Aha",
  customerEmail: "Email",
  delivery: "Nnyefe",
  metaPaid: "Akwụ ụgwọ",
  metaIssued: "Enyere",
  metaDue: "Ụbọchị ịkwụ",
  metaOnReceipt: "Mgbe e natara",
  metaMethod: "Ụzọ",
  metaReference: "Ntụaka",
  metaStatus: "Ọnọdụ",
  totalPaid: "Mkpụkọ akwụ",
  receiptItemsSection: "Ihe a kwụrụ ụgwọ ya",
  invoiceItemsSection: "Ihe ndị edepụtara",
  colItem: "Ihe",
  colQty: "Ọnụ",
  colUnit: "Otu",
  colAmount: "Ego",
  receiptItemsEmpty: "Edeghị ihe ọ bụla.",
  invoiceItemsEmpty: "Edeghị ihe ahaziri ahazi.",
  settlement: "Nkwụ ụgwọ",
  subtotal: "Mkpụkọ nta",
  discount: "Mbelata",
  fees: "Ụgwọ ọrụ",
  vat: "VAT",
  vatRated: "VAT ({rate})",
  vatExempt: "Ahapụrụ na VAT",
  vatZeroRated: "Ọnụego efu (0%)",
  vatOutOfScope: "Nọ na mpụga VAT",
  vatTreatment: "Usoro VAT",
  total: "Mkpụkọ",
  paymentStatus: "Ọnọdụ ịkwụ ụgwọ",
  paymentMethod: "Ụzọ ịkwụ ụgwọ",
  paymentReference: "Ntụaka ịkwụ ụgwọ",
  paidAt: "Akwụ na",
  notes: "Ndetu",
  auditReference: "Ntụaka nyocha",
  statusPaid: "Akwụ ụgwọ",
  statusIssued: "Enyere",
  statusVoid: "Akagburu",
  statusPending: "Na-eche",
  statusRefunded: "Akwụghachiri",
  methodCard: "Kaadị",
  methodBank: "Mbufe ego ụlọ akụ",
  methodTransfer: "Mbufe",
  methodWallet: "Obere akpa ego",
  methodUssd: "USSD",
  receiptLegal1:
    "Akwụkwọ nnata ego a na-egosi ego {issuer} natara. Ụtụ ọ bụla egosiri na-egosi ọnụego dị ire n'ụbọchị ịkwụ ụgwọ dị n'elu.",
  receiptLegal2:
    "Ajụjụ gbasara akwụkwọ a? Kpọtụrụ {email} n'ime ụbọchị 7 maka ngwa ngwa edozi.",
  invoiceLegal1:
    "Akwụkwọ ụgwọ a sitere n'aka {issuer} n'okpuru ịgba ụgwọ jikọrọ ọnụ. Ngalaba mmalite ka bụ isi iyi maka usoro nnyefe, esemokwu, na nkwụghachi.",
  invoiceLegal2:
    "A na-akara ịkwụ ụgwọ dị ka nke akwadoro ozugbo anyị nyochachara ya. Ọnọdụ egosiri na-egosi mmelite kachasị ọhụrụ.",
  defaultInvoiceDescription: "Nchịkọta ịkwụ ụgwọ",

  creditNoteType: "Akwụkwọ nkwụghachi ego",
  totalCredited: "Ego enyeghachiri",
  metaRefunded: "Enyeghachiri",
  refundOf: "Nkwụghachi nke akwụkwọ nnata",
  creditNoteItemsSection: "Ihe enyeghachiri",
  creditNoteItemsEmpty: "Ọ dịghị ihe edekọrọ.",
  creditNoteLegal1:
    "Akwụkwọ a na-egosi nkwụghachi ego {issuer} nyere maka akwụkwọ nnata e depụtara n'elu. Ụtụ ọ bụla e gosiri na-eweghachi ụtụ nke akụkụ enyeghachiri.",
  creditNoteLegal2:
    "Ị nwere ajụjụ gbasara akwụkwọ a? Kpọtụrụ {email} n'ime ụbọchị 7 maka ngwọta ọsọ ọsọ.",
};

const YO: Partial<PaymentDocumentCopy> = {
  receiptType: "Risíìtì",
  invoiceType: "Ìwé owó",
  issuedBy: "Ó ti ọwọ́",
  from: "Láti ọwọ́",
  billedTo: "A fi owó ránṣẹ́ sí",
  billTo: "Owó fún",
  rc: "RC",
  vatId: "Nọ́mbà VAT (TIN)",
  customerName: "Orúkọ",
  customerEmail: "Ímeèlì",
  delivery: "Ìfijíṣẹ́",
  metaPaid: "Sanwó",
  metaIssued: "Tújáde",
  metaDue: "Ọjọ́ ìsanwó",
  metaOnReceipt: "Nígbà gbígbà",
  metaMethod: "Ọ̀nà",
  metaReference: "Ìtọ́kasí",
  metaStatus: "Ipò",
  totalPaid: "Àpapọ̀ tí a san",
  receiptItemsSection: "Ohun tí a sanwó fún",
  invoiceItemsSection: "Àwọn ohun kọ̀ọ̀kan",
  colItem: "Ohun",
  colQty: "Iye",
  colUnit: "Ọ̀kọ̀ọ̀kan",
  colAmount: "Iye owó",
  receiptItemsEmpty: "Kò sí ohun tí a kọ sílẹ̀.",
  invoiceItemsEmpty: "Kò sí ohun tí a ṣètò tí a kọ sílẹ̀.",
  settlement: "Ìsanwó",
  subtotal: "Àpapọ̀ kékeré",
  discount: "Ẹ̀dínwó",
  fees: "Owó iṣẹ́",
  vat: "VAT",
  vatRated: "VAT ({rate})",
  vatExempt: "Láìsí VAT",
  vatZeroRated: "Òṣùwọ̀n òdo (0%)",
  vatOutOfScope: "Lóde àgbègbè VAT",
  vatTreatment: "Ìtọ́jú VAT",
  total: "Àpapọ̀",
  paymentStatus: "Ipò ìsanwó",
  paymentMethod: "Ọ̀nà ìsanwó",
  paymentReference: "Ìtọ́kasí ìsanwó",
  paidAt: "A san ní",
  notes: "Àkíyèsí",
  auditReference: "Ìtọ́kasí àyẹ̀wò",
  statusPaid: "Sanwó",
  statusIssued: "Tújáde",
  statusVoid: "Fagilé",
  statusPending: "Ńdúró",
  statusRefunded: "Dá owó padà",
  methodCard: "Káàdì",
  methodBank: "Ìfowópamọ́ báńkì",
  methodTransfer: "Ìfowópamọ́",
  methodWallet: "Àpamọ́wọ́",
  methodUssd: "USSD",
  receiptLegal1:
    "Risíìtì yìí jẹ́ ẹ̀rí ìsanwó tí {issuer} gbà. Owó orí èyíkéyìí tí a fihàn ń ṣàfihàn òṣùwọ̀n tó wà ní agbára ní ọjọ́ ìsanwó lókè.",
  receiptLegal2:
    "Ìbéèrè nípa risíìtì yìí? Kàn sí {email} láàrin ọjọ́ 7 fún ìpinnu kíákíá.",
  invoiceLegal1:
    "{issuer} ni ó tú ìwé owó yìí jáde lábẹ́ ìsanwó ìṣọ̀kan. Ẹ̀ka tó pilẹ̀ ṣì jẹ́ orísun òtítọ́ fún àwọn òfin ìfijíṣẹ́, àríyànjiyàn, àti ìdá-owó-padà.",
  invoiceLegal2:
    "A máa fi àmì ìsanwó sí i pé a ti jẹ́rìí i lẹ́yìn tí a bá ti ṣàyẹ̀wò rẹ̀. Ipò tí a fihàn ń ṣàfihàn ìmúdójúìwọ̀n tuntun.",
  defaultInvoiceDescription: "Àkótán ìsanwó",

  creditNoteType: "Ìwé krẹ́dítì",
  totalCredited: "Owó tí a dá padà",
  metaRefunded: "A dá padà",
  refundOf: "Ìdápadà fún ìwé ẹ̀rí",
  creditNoteItemsSection: "Ohun tí a dá padà",
  creditNoteItemsEmpty: "Kò sí ohun tí a kọ sílẹ̀.",
  creditNoteLegal1:
    "Ìwé krẹ́dítì yìí jẹ́ ẹ̀rí ìdápadà owó tí {issuer} ṣe fún ìwé ẹ̀rí tí a tọ́ka sí lókè. Owó orí èyíkéyìí tí ó hàn yí owó orí apá tí a dá padà padà.",
  creditNoteLegal2:
    "Ìbéèrè nípa ìwé krẹ́dítì yìí? Kàn sí {email} láàrin ọjọ́ 7 fún ìdáhùn kíákíá.",
};

const HA: Partial<PaymentDocumentCopy> = {
  receiptType: "Rasit",
  invoiceType: "Takardar biya",
  issuedBy: "An bayar da shi ta",
  from: "Daga",
  billedTo: "An tura kuɗi ga",
  billTo: "Kuɗi ga",
  rc: "RC",
  vatId: "Lambar VAT (TIN)",
  customerName: "Suna",
  customerEmail: "Imel",
  delivery: "Isar da kaya",
  metaPaid: "An biya",
  metaIssued: "An bayar",
  metaDue: "Ranar biya",
  metaOnReceipt: "Lokacin karɓa",
  metaMethod: "Hanya",
  metaReference: "Ƙira",
  metaStatus: "Matsayi",
  totalPaid: "Jimillar da aka biya",
  receiptItemsSection: "Abin da aka biya",
  invoiceItemsSection: "Abubuwa",
  colItem: "Abu",
  colQty: "Adadi",
  colUnit: "Kashi",
  colAmount: "Kuɗi",
  receiptItemsEmpty: "Babu abin da aka rubuta.",
  invoiceItemsEmpty: "Babu tsararrun abubuwan da aka rubuta.",
  settlement: "Sasantawa",
  subtotal: "Ƙananan jimilla",
  discount: "Rangwame",
  fees: "Kuɗaɗen aiki",
  vat: "VAT",
  vatRated: "VAT ({rate})",
  vatExempt: "An kebe daga VAT",
  vatZeroRated: "Kaso sifili (0%)",
  vatOutOfScope: "Bayan iyakar VAT",
  vatTreatment: "Yadda ake bi da VAT",
  total: "Jimilla",
  paymentStatus: "Matsayin biya",
  paymentMethod: "Hanyar biya",
  paymentReference: "Ƙirar biya",
  paidAt: "An biya a",
  notes: "Bayanai",
  auditReference: "Ƙirar bincike",
  statusPaid: "An biya",
  statusIssued: "An bayar",
  statusVoid: "An soke",
  statusPending: "Ana jira",
  statusRefunded: "An mayar da kuɗi",
  methodCard: "Kati",
  methodBank: "Canja wurin banki",
  methodTransfer: "Canja wuri",
  methodWallet: "Walat",
  methodUssd: "USSD",
  receiptLegal1:
    "Wannan rasit shaida ce ta biyan da {issuer} ya karɓa. Duk wani harajin da aka nuna yana nuna ƙimar da ke aiki a ranar biya da ke sama.",
  receiptLegal2:
    "Tambayoyi game da wannan rasit? Tuntuɓi {email} cikin kwana 7 don warware matsala da sauri.",
  invoiceLegal1:
    "{issuer} ne ya bayar da wannan takardar biya ƙarƙashin haɗaɗɗiyar lissafi. Sashen asali ya kasance tushen gaskiya don sharuɗɗan isarwa, takaddama, da mayar da kuɗi.",
  invoiceLegal2:
    "Ana yiwa biya alama a matsayin an tabbatar da shi da zarar mun tantance shi. Matsayin da aka nuna yana nuna sabuntawa mafi kwanciya.",
  defaultInvoiceDescription: "Taƙaitaccen biya",

  creditNoteType: "Takardar maido da kuɗi",
  totalCredited: "Kuɗin da aka maido",
  metaRefunded: "An maido",
  refundOf: "Maido kan rasit",
  creditNoteItemsSection: "Abin da aka maido",
  creditNoteItemsEmpty: "Babu abin da aka rubuta.",
  creditNoteLegal1:
    "Wannan takarda tana tabbatar da maido da kuɗi da {issuer} ya bayar kan rasit ɗin da ke sama. Duk harajin da aka nuna yana juya harajin ɓangaren da aka maido.",
  creditNoteLegal2:
    "Tambaya game da wannan takarda? Tuntuɓi {email} cikin kwanaki 7 don warware ta da sauri.",
};

const LOCALE_OVERRIDES: Partial<Record<AppLocale, Partial<PaymentDocumentCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  de: DE,
  it: IT,
  ar: AR,
  zh: ZH,
  hi: HI,
  ig: IG,
  yo: YO,
  ha: HA,
};

/**
 * Resolve the payment-document copy for a locale. Falls back to English for any
 * key not present in the locale override (deepMergeMessages), so a partial
 * override is always safe.
 */
export function getPaymentDocumentCopy(locale: AppLocale): PaymentDocumentCopy {
  const overrides = LOCALE_OVERRIDES[locale];
  if (overrides) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as PaymentDocumentCopy;
  }
  return EN;
}
