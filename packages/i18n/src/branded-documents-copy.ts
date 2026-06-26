import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * Copy for the @henryco/branded-documents PDF templates + shared document
 * chrome (footer, signature block). Each top-level key maps to one template
 * file or shared component; nested keys are the individual user-visible
 * strings within it.
 *
 * Pattern A module: author EN + fr/es/pt/ar/de/it/zh only. ig/yo/ha/hi are
 * intentionally omitted and fall back to EN (human-translation only).
 *
 * The brand token "Henry & Co." is kept VERBATIM in every locale.
 */
export type BrandedDocumentsCopy = {
  footer: {
    defaultLegal: string;
  };
  signature: {
    authorisedSignatory: string;
    signedPrefix: string;
  };
  invoice: {
    documentType: string;
    metaIssued: string;
    metaDue: string;
    metaDueOnReceipt: string;
    metaStatus: string;
    divisionGroup: string;
    partyFrom: string;
    partyBillTo: string;
    rcPrefix: string;
    vatPrefix: string;
    columnItem: string;
    columnQty: string;
    columnUnit: string;
    columnAmount: string;
    sectionLineItems: string;
    emptyLineItems: string;
    paymentStatus: string;
    paymentMethod: string;
    paymentReference: string;
    paidAt: string;
    subtotal: string;
    discount: string;
    tax: string;
    total: string;
    legalLine1: string;
    legalLine2: string;
  };
  kyc: {
    documentType: string;
    subject: string;
    metaSubmitted: string;
    metaReviewed: string;
    divisionLabel: string;
    statusPrefix: string;
    columnDocument: string;
    columnStatus: string;
    columnSubmitted: string;
    columnReviewed: string;
    columnReviewerNote: string;
    privacyKicker: string;
    privacyBody: string;
    accountHolder: string;
    rowName: string;
    rowEmail: string;
    rowAccountId: string;
    rowOverallStatus: string;
    sectionSubmissions: string;
    emptySubmissions: string;
    sectionReviewerNote: string;
    legalLine1: string;
    legalLine2: string;
  };
  learn: {
    author: string;
    subject: (courseTitle: string) => string;
    keywords: string;
    learnLabel: string;
    certificateOfCompletion: string;
    preamble: string;
    body: string;
    issuingOfficer: string;
    certificateNumber: string;
    issued: string;
    score: string;
    verifyCredential: string;
    codePrefix: string;
    footerLeft: string;
    footerRight: string;
    defaultIssuerName: string;
    defaultIssuerTitle: string;
    defaultIssuerAccreditation: string;
  };
  logisticsB2b: {
    subject: string;
    documentType: string;
    subtitleShipments: (count: number) => string;
    metaPeriod: string;
    metaStarts: string;
    metaEnds: string;
    divisionLabel: string;
    grossSpend: string;
    columnTracking: string;
    columnRecipient: string;
    columnService: string;
    columnStatus: string;
    columnAmount: string;
    sectionAccount: string;
    rowName: string;
    rowLegalName: string;
    rowBillingTerms: string;
    rowBillingEmail: string;
    sectionPeriodSummary: string;
    rowShipments: string;
    rowDelivered: string;
    rowOnTime: string;
    rowGrossSpend: string;
    sectionItemised: string;
    emptyShipments: string;
    legalLine1: string;
    legalLine2: string;
  };
  logisticsReceipt: {
    subject: string;
    documentType: string;
    metaBooked: string;
    metaScheduled: string;
    metaStatus: string;
    divisionLabel: string;
    amountPaid: string;
    columnLineItem: string;
    columnAmount: string;
    sectionCustomer: string;
    rowName: string;
    rowEmail: string;
    rowPhone: string;
    rowTrackingCode: string;
    sectionPickup: string;
    sectionDropoff: string;
    sectionParcelService: string;
    rowService: string;
    rowUrgency: string;
    rowParcel: string;
    rowDescription: string;
    rowWeight: string;
    weightUnit: (kg: number) => string;
    rowSizeTier: string;
    rowCorridor: string;
    sectionPricing: string;
    emptyPricing: string;
    sectionSettlement: string;
    rowQuoted: string;
    rowPaid: string;
    rowMethod: string;
    rowReference: string;
    rowStatus: string;
    sectionProof: string;
    rowRecipient: string;
    rowDelivered: string;
    rowType: string;
    rowNote: string;
    legalLine1: string;
    legalLine2: string;
  };
  propertyManaged: {
    subject: string;
    documentType: string;
    divisionLabel: string;
    netPayable: string;
    metaPeriod: string;
    metaStarts: string;
    metaEnds: string;
    columnPeriod: string;
    columnWindow: string;
    columnStatus: string;
    columnCollected: string;
    columnAmount: string;
    columnTicket: string;
    columnCategory: string;
    columnSeverity: string;
    columnResolved: string;
    sectionOwner: string;
    rowName: string;
    rowLegalName: string;
    rowEmail: string;
    rowPhone: string;
    sectionListing: string;
    rowTitle: string;
    rowAddress: string;
    rowManagedSince: string;
    sectionPeriodSummary: string;
    rowGrossRent: string;
    rowMaintenanceSpend: string;
    rowManagementFee: string;
    rowNetPayable: string;
    sectionRentLedger: string;
    emptyRent: string;
    sectionMaintenance: string;
    emptyMaintenance: string;
    legalLine1: string;
    legalLine2: string;
  };
  receipt: {
    subject: string;
    documentType: string;
    subtitle: (paidAt: string, method: string) => string;
    metaPaid: string;
    metaMethod: string;
    metaReference: string;
    totalPaid: string;
    columnItem: string;
    columnQty: string;
    columnAmount: string;
    sectionCustomer: string;
    rowName: string;
    rowEmail: string;
    rowDelivery: string;
    sectionWhatPaid: string;
    emptyItems: string;
    sectionSettlement: string;
    rowSubtotal: string;
    rowFees: string;
    rowTax: string;
    rowTotal: string;
    rowStatus: string;
    sectionNotes: string;
    legalLine1: string;
    legalLine2: string;
  };
  studioInvoice: {
    subject: (invoiceNumber: string) => string;
    documentType: string;
    metaIssued: string;
    metaDue: string;
    metaDueOnReceipt: string;
    metaStatus: string;
    divisionLabel: string;
    partyFrom: string;
    partyBillTo: string;
    rcPrefix: string;
    vatPrefix: string;
    sectionProject: string;
    rowProject: string;
    rowPaymentPlan: string;
    rowNextMilestone: string;
    columnDescription: string;
    columnMilestone: string;
    columnAmount: string;
    sectionLineItems: string;
    emptyLineItems: string;
    paymentStatus: string;
    paymentMethod: string;
    paymentReference: string;
    paidAt: string;
    subtotal: string;
    discount: string;
    tax: string;
    total: string;
    settledAs: (amount: string) => string;
    fxAt: (rate: string, paidCurrency: string, invoiceCurrency: string) => string;
    legalLine1: string;
    legalLine2: string;
  };
  studioProposal: {
    documentType: string;
    metaIssued: string;
    metaValidUntil: string;
    metaStatus: string;
    divisionLabel: string;
    partyFrom: string;
    partyPreparedFor: string;
    rcPrefix: string;
    columnMilestone: string;
    columnDue: string;
    columnAmount: string;
    sectionEngagement: string;
    rowService: string;
    rowPackage: string;
    rowTeam: string;
    rowTimeline: string;
    sectionScope: string;
    scopeFallback: string;
    sectionDeliverables: string;
    sectionMilestones: string;
    emptyMilestones: string;
    rowDepositDue: string;
    rowCurrency: string;
    rowValidUntil: string;
    totalInvestment: string;
    totalDeposit: string;
    totalBalance: string;
    signed: string;
    signedAt: string;
    signedBy: string;
    signedEmail: string;
    signedProvider: string;
    signedIp: string;
    signedLocale: string;
    legalLine1: string;
    legalLine2: string;
  };
  vendorPayout: {
    subject: string;
    documentType: string;
    subtitleOrders: (count: number) => string;
    metaPeriod: string;
    metaSettlement: string;
    metaReference: string;
    divisionLabel: string;
    netPayout: string;
    columnOrder: string;
    columnFulfilled: string;
    columnBuyer: string;
    columnStatus: string;
    columnGross: string;
    columnCommission: string;
    columnFee: string;
    columnRefunds: string;
    columnNet: string;
    sectionVendor: string;
    rowStore: string;
    rowSlug: string;
    rowLegalName: string;
    rowTaxId: string;
    rowPayoutMethod: string;
    rowDestination: string;
    rowSettlementCurrency: string;
    onFile: string;
    sectionPeriodSummary: string;
    rowOrdersSettled: string;
    rowGrossRevenue: string;
    rowPlatformCommission: string;
    rowProcessingFees: string;
    rowRefundsChargebacks: string;
    rowNetPayout: string;
    rowScheduledFor: string;
    awaitingCycle: string;
    rowGenerated: string;
    sectionItemised: string;
    emptyOrders: string;
    footerNet: string;
    legalLine1: string;
    legalLine2: string;
    legalLine3: string;
  };
};

const EN: BrandedDocumentsCopy = {
  footer: {
    defaultLegal: "Henry & Co. — every business under one trusted name.",
  },
  signature: {
    authorisedSignatory: "Authorised signatory",
    signedPrefix: "Signed",
  },
  invoice: {
    documentType: "Invoice",
    metaIssued: "Issued",
    metaDue: "Due",
    metaDueOnReceipt: "On receipt",
    metaStatus: "Status",
    divisionGroup: "Group",
    partyFrom: "From",
    partyBillTo: "Bill to",
    rcPrefix: "RC:",
    vatPrefix: "VAT:",
    columnItem: "Item",
    columnQty: "Qty",
    columnUnit: "Unit",
    columnAmount: "Amount",
    sectionLineItems: "Line items",
    emptyLineItems: "No structured line items recorded.",
    paymentStatus: "Payment status",
    paymentMethod: "Payment method",
    paymentReference: "Payment reference",
    paidAt: "Paid at",
    subtotal: "Subtotal",
    discount: "Discount",
    tax: "Tax",
    total: "Total",
    legalLine1:
      "This invoice is issued under HenryCo unified billing. The originating division remains the source of truth for delivery, dispute, and refund terms.",
    legalLine2:
      "Payments are recognised once the originating gateway confirms settlement; the status above reflects the most recent reconciliation snapshot.",
  },
  kyc: {
    documentType: "Identity verification summary",
    subject: "Identity verification summary",
    metaSubmitted: "Submitted",
    metaReviewed: "Reviewed",
    divisionLabel: "Trust & Compliance",
    statusPrefix: "Status",
    columnDocument: "Document",
    columnStatus: "Status",
    columnSubmitted: "Submitted",
    columnReviewed: "Reviewed",
    columnReviewerNote: "Reviewer note",
    privacyKicker: "Privacy posture",
    privacyBody:
      "This summary records what was submitted and how the HenryCo trust team has reviewed it. The underlying ID documents are never embedded in this PDF — only the metadata you see below.",
    accountHolder: "Account holder",
    rowName: "Name",
    rowEmail: "Email",
    rowAccountId: "Account ID",
    rowOverallStatus: "Overall status",
    sectionSubmissions: "Submissions",
    emptySubmissions: "No KYC submissions on file.",
    sectionReviewerNote: "Reviewer note",
    legalLine1:
      "HenryCo retains identity documents only as long as required by Nigerian law and applicable KYC obligations. This summary is your audit-trail copy and does not include the document images themselves.",
    legalLine2:
      "If you need to update an ID, do so from your HenryCo account verification page; the original record will then move to historical state and a new entry will replace it in this view.",
  },
  learn: {
    author: "Henry & Co. — HenryCo Learn",
    subject: (courseTitle: string) => `Certificate of completion for ${courseTitle}`,
    keywords: "certificate, henryco learn",
    learnLabel: "HenryCo Learn",
    certificateOfCompletion: "Certificate of Completion",
    preamble: "This is to certify that",
    body: "has satisfied every learning, assessment, and integrity requirement set for",
    issuingOfficer: "Issuing officer",
    certificateNumber: "Certificate number",
    issued: "Issued",
    score: "Score",
    verifyCredential: "Verify this credential",
    codePrefix: "Code",
    footerLeft: "HENRY & CO. · HenryCo Learn academic certificate",
    footerRight: "Genuine certificates resolve at the URL above",
    defaultIssuerName: "Adaeze Henry-Mbachu",
    defaultIssuerTitle: "Director, HenryCo Learn",
    defaultIssuerAccreditation: "Issued under HenryCo Learn academic standards",
  },
  logisticsB2b: {
    subject: "HenryCo Logistics B2B statement",
    documentType: "B2B statement",
    subtitleShipments: (count: number) => `${count} shipments`,
    metaPeriod: "Period",
    metaStarts: "Starts",
    metaEnds: "Ends",
    divisionLabel: "Logistics · B2B",
    grossSpend: "Gross spend",
    columnTracking: "Tracking",
    columnRecipient: "Recipient",
    columnService: "Service",
    columnStatus: "Status",
    columnAmount: "Amount",
    sectionAccount: "Account",
    rowName: "Name",
    rowLegalName: "Legal name",
    rowBillingTerms: "Billing terms",
    rowBillingEmail: "Billing email",
    sectionPeriodSummary: "Period summary",
    rowShipments: "Shipments",
    rowDelivered: "Delivered",
    rowOnTime: "On-time",
    rowGrossSpend: "Gross spend",
    sectionItemised: "Itemised shipments",
    emptyShipments: "No shipments in this period.",
    legalLine1:
      "This statement summarises shipment activity booked through your HenryCo B2B account during the period above. Amounts are gross of any negotiated rebate, which is settled separately on the agreed cadence.",
    legalLine2:
      "Discrepancies must be raised within the dispute window stated in your service agreement; we cannot re-bill outside that window.",
  },
  logisticsReceipt: {
    subject: "HenryCo Logistics shipment receipt",
    documentType: "Shipment receipt",
    metaBooked: "Booked",
    metaScheduled: "Scheduled",
    metaStatus: "Status",
    divisionLabel: "Logistics",
    amountPaid: "Amount paid",
    columnLineItem: "Line item",
    columnAmount: "Amount",
    sectionCustomer: "Customer",
    rowName: "Name",
    rowEmail: "Email",
    rowPhone: "Phone",
    rowTrackingCode: "Tracking code",
    sectionPickup: "Pickup",
    sectionDropoff: "Drop-off",
    sectionParcelService: "Parcel + service",
    rowService: "Service",
    rowUrgency: "Urgency",
    rowParcel: "Parcel",
    rowDescription: "Description",
    rowWeight: "Weight",
    weightUnit: (kg: number) => `${kg} kg`,
    rowSizeTier: "Size tier",
    rowCorridor: "Corridor",
    sectionPricing: "Pricing breakdown",
    emptyPricing: "No itemised pricing recorded.",
    sectionSettlement: "Settlement",
    rowQuoted: "Quoted",
    rowPaid: "Paid",
    rowMethod: "Method",
    rowReference: "Reference",
    rowStatus: "Status",
    sectionProof: "Proof of delivery",
    rowRecipient: "Recipient",
    rowDelivered: "Delivered",
    rowType: "Type",
    rowNote: "Note",
    legalLine1:
      "HenryCo Logistics is the operator of record for this shipment. Insurance, claim windows, and lost-package liability are governed by the HenryCo Logistics service agreement.",
    legalLine2:
      "If a discrepancy exists between this receipt and the live shipment record, contact logistics support within 7 days for the fastest resolution path.",
  },
  propertyManaged: {
    subject: "HenryCo Property managed statement",
    documentType: "Managed-property statement",
    divisionLabel: "Property · Managed",
    netPayable: "Net payable to owner",
    metaPeriod: "Period",
    metaStarts: "Starts",
    metaEnds: "Ends",
    columnPeriod: "Period",
    columnWindow: "Window",
    columnStatus: "Status",
    columnCollected: "Collected",
    columnAmount: "Amount",
    columnTicket: "Ticket",
    columnCategory: "Category",
    columnSeverity: "Severity",
    columnResolved: "Resolved",
    sectionOwner: "Owner",
    rowName: "Name",
    rowLegalName: "Legal name",
    rowEmail: "Email",
    rowPhone: "Phone",
    sectionListing: "Listing",
    rowTitle: "Title",
    rowAddress: "Address",
    rowManagedSince: "Managed since",
    sectionPeriodSummary: "Period summary",
    rowGrossRent: "Gross rent collected",
    rowMaintenanceSpend: "Maintenance spend",
    rowManagementFee: "Management fee",
    rowNetPayable: "Net payable to owner",
    sectionRentLedger: "Rent ledger",
    emptyRent: "No rent activity in this period.",
    sectionMaintenance: "Maintenance",
    emptyMaintenance: "No maintenance activity in this period.",
    legalLine1:
      "This statement reflects rent collected and operating expenses applied to the managed listing above during the period. Amounts are gross of withholding tax; HenryCo remits the net pass-through on the cadence agreed in your management instrument.",
    legalLine2:
      "Any discrepancy must be raised in writing within the dispute window stated in your management instrument; HenryCo cannot re-bill or re-collect outside that window.",
  },
  receipt: {
    subject: "Payment receipt",
    documentType: "Receipt",
    subtitle: (paidAt: string, method: string) => `Paid ${paidAt} · ${method}`,
    metaPaid: "Paid",
    metaMethod: "Method",
    metaReference: "Reference",
    totalPaid: "Total paid",
    columnItem: "Item",
    columnQty: "Qty",
    columnAmount: "Amount",
    sectionCustomer: "Customer",
    rowName: "Name",
    rowEmail: "Email",
    rowDelivery: "Delivery",
    sectionWhatPaid: "What was paid",
    emptyItems: "No items recorded.",
    sectionSettlement: "Settlement",
    rowSubtotal: "Subtotal",
    rowFees: "Fees",
    rowTax: "Tax",
    rowTotal: "Total",
    rowStatus: "Status",
    sectionNotes: "Notes",
    legalLine1:
      "This receipt evidences payment captured by HenryCo on behalf of the originating division. Tax position reflects the rate in force on the paid date above.",
    legalLine2:
      "If you spot a discrepancy, contact HenryCo support within 7 days for the fastest resolution path.",
  },
  studioInvoice: {
    subject: (invoiceNumber: string) => `Invoice ${invoiceNumber}`,
    documentType: "Invoice",
    metaIssued: "Issued",
    metaDue: "Due",
    metaDueOnReceipt: "On receipt",
    metaStatus: "Status",
    divisionLabel: "Studio",
    partyFrom: "From",
    partyBillTo: "Bill to",
    rcPrefix: "RC:",
    vatPrefix: "VAT:",
    sectionProject: "Project",
    rowProject: "Project",
    rowPaymentPlan: "Payment plan",
    rowNextMilestone: "Next milestone",
    columnDescription: "Description",
    columnMilestone: "Milestone",
    columnAmount: "Amount",
    sectionLineItems: "Line items",
    emptyLineItems: "No structured line items recorded.",
    paymentStatus: "Payment status",
    paymentMethod: "Payment method",
    paymentReference: "Payment reference",
    paidAt: "Paid at",
    subtotal: "Subtotal",
    discount: "Discount",
    tax: "Tax",
    total: "Total",
    settledAs: (amount: string) => `Settled as ${amount}`,
    fxAt: (rate: string, paidCurrency: string, invoiceCurrency: string) =>
      ` at ${rate} ${paidCurrency}/${invoiceCurrency}`,
    legalLine1:
      "Issued under HenryCo Studio billing. Multi-currency settlement is captured at the gateway rate on the day of payment; both invoice currency and settled currency are recorded for audit.",
    legalLine2:
      "Disputes must be raised within seven calendar days of issue. Late payment may attract reminder schedule per the engagement agreement.",
  },
  studioProposal: {
    documentType: "Proposal",
    metaIssued: "Issued",
    metaValidUntil: "Valid until",
    metaStatus: "Status",
    divisionLabel: "Studio",
    partyFrom: "From",
    partyPreparedFor: "Prepared for",
    rcPrefix: "RC:",
    columnMilestone: "Milestone",
    columnDue: "Due",
    columnAmount: "Amount",
    sectionEngagement: "Engagement overview",
    rowService: "Service",
    rowPackage: "Package",
    rowTeam: "Team",
    rowTimeline: "Timeline",
    sectionScope: "Scope",
    scopeFallback: "Scope detailed in companion brief.",
    sectionDeliverables: "Deliverables",
    sectionMilestones: "Milestones",
    emptyMilestones: "No milestones recorded.",
    rowDepositDue: "Deposit due to start",
    rowCurrency: "Currency",
    rowValidUntil: "Valid until",
    totalInvestment: "Investment",
    totalDeposit: "Deposit",
    totalBalance: "Balance",
    signed: "Signed",
    signedAt: "Signed at",
    signedBy: "Signed by",
    signedEmail: "Email",
    signedProvider: "Provider",
    signedIp: "IP address",
    signedLocale: "Locale",
    legalLine1:
      "This proposal is governed by the HenryCo Studio engagement terms. Acceptance is recorded electronically with timestamp, IP address, user agent, and locale captured for audit replay.",
    legalLine2:
      "Investment + deposit figures above are exclusive of statutory tax unless explicitly noted. Currency converts at the gateway rate on the day of settlement.",
  },
  vendorPayout: {
    subject: "HenryCo Marketplace vendor payout statement",
    documentType: "Payout statement",
    subtitleOrders: (count: number) => `${count} order${count === 1 ? "" : "s"}`,
    metaPeriod: "Period",
    metaSettlement: "Settlement",
    metaReference: "Reference",
    divisionLabel: "Marketplace · Vendor payout",
    netPayout: "Net payout",
    columnOrder: "Order",
    columnFulfilled: "Fulfilled",
    columnBuyer: "Buyer",
    columnStatus: "Status",
    columnGross: "Gross",
    columnCommission: "Commission",
    columnFee: "Fee",
    columnRefunds: "Refunds",
    columnNet: "Net",
    sectionVendor: "Vendor",
    rowStore: "Store",
    rowSlug: "Slug",
    rowLegalName: "Legal name",
    rowTaxId: "Tax ID",
    rowPayoutMethod: "Payout method",
    rowDestination: "Destination",
    rowSettlementCurrency: "Settlement currency",
    onFile: "On file",
    sectionPeriodSummary: "Period summary",
    rowOrdersSettled: "Orders settled",
    rowGrossRevenue: "Gross revenue",
    rowPlatformCommission: "Platform commission",
    rowProcessingFees: "Processing fees",
    rowRefundsChargebacks: "Refunds + chargebacks",
    rowNetPayout: "Net payout",
    rowScheduledFor: "Scheduled for",
    awaitingCycle: "Awaiting cycle",
    rowGenerated: "Generated",
    sectionItemised: "Itemised orders",
    emptyOrders: "No orders settled in this period.",
    footerNet: "Net for selected period",
    legalLine1:
      "This statement reflects orders that cleared the auto-release window during the period above. Refunds or disputes opened after the cut-off appear on the next statement.",
    legalLine2:
      "Tax position is the vendor's responsibility; HenryCo withholds only the commission and processing fees disclosed in your vendor agreement.",
    legalLine3:
      "Discrepancies must be raised within 14 days through the vendor workspace dispute channel; we cannot re-issue payouts outside that window.",
  },
};

const FR: DeepPartial<BrandedDocumentsCopy> = {
  footer: {
    defaultLegal: "Henry & Co. — chaque activité sous un seul nom de confiance.",
  },
  signature: {
    authorisedSignatory: "Signataire autorisé",
    signedPrefix: "Signé",
  },
  invoice: {
    documentType: "Facture",
    metaIssued: "Émise",
    metaDue: "Échéance",
    metaDueOnReceipt: "À réception",
    metaStatus: "Statut",
    divisionGroup: "Groupe",
    partyFrom: "De",
    partyBillTo: "Facturer à",
    rcPrefix: "RC :",
    vatPrefix: "TVA :",
    columnItem: "Article",
    columnQty: "Qté",
    columnUnit: "Unité",
    columnAmount: "Montant",
    sectionLineItems: "Lignes de facturation",
    emptyLineItems: "Aucune ligne de facturation structurée enregistrée.",
    paymentStatus: "Statut du paiement",
    paymentMethod: "Mode de paiement",
    paymentReference: "Référence de paiement",
    paidAt: "Payée le",
    subtotal: "Sous-total",
    discount: "Remise",
    tax: "Taxe",
    total: "Total",
    legalLine1:
      "Cette facture est émise dans le cadre de la facturation unifiée HenryCo. La division d'origine demeure la source de référence pour les conditions de livraison, de litige et de remboursement.",
    legalLine2:
      "Les paiements sont reconnus une fois que la passerelle d'origine confirme le règlement ; le statut ci-dessus reflète le dernier instantané de rapprochement.",
  },
  kyc: {
    documentType: "Résumé de vérification d'identité",
    subject: "Résumé de vérification d'identité",
    metaSubmitted: "Soumis",
    metaReviewed: "Examiné",
    divisionLabel: "Confiance et conformité",
    statusPrefix: "Statut",
    columnDocument: "Document",
    columnStatus: "Statut",
    columnSubmitted: "Soumis",
    columnReviewed: "Examiné",
    columnReviewerNote: "Note de l'examinateur",
    privacyKicker: "Posture de confidentialité",
    privacyBody:
      "Ce résumé indique ce qui a été soumis et comment l'équipe de confiance HenryCo l'a examiné. Les documents d'identité sous-jacents ne sont jamais intégrés dans ce PDF — seules les métadonnées ci-dessous le sont.",
    accountHolder: "Titulaire du compte",
    rowName: "Nom",
    rowEmail: "E-mail",
    rowAccountId: "Identifiant du compte",
    rowOverallStatus: "Statut global",
    sectionSubmissions: "Soumissions",
    emptySubmissions: "Aucune soumission KYC au dossier.",
    sectionReviewerNote: "Note de l'examinateur",
    legalLine1:
      "HenryCo ne conserve les documents d'identité que le temps requis par la loi nigériane et les obligations KYC applicables. Ce résumé est votre copie de piste d'audit et n'inclut pas les images des documents elles-mêmes.",
    legalLine2:
      "Si vous devez mettre à jour une pièce d'identité, faites-le depuis votre page de vérification de compte HenryCo ; l'enregistrement initial passera alors à l'état historique et une nouvelle entrée le remplacera dans cette vue.",
  },
  learn: {
    author: "Henry & Co. — HenryCo Learn",
    subject: (courseTitle: string) => `Certificat de réussite pour ${courseTitle}`,
    keywords: "certificat, henryco learn",
    learnLabel: "HenryCo Learn",
    certificateOfCompletion: "Certificat de réussite",
    preamble: "Le présent document certifie que",
    body: "a satisfait à toutes les exigences d'apprentissage, d'évaluation et d'intégrité fixées pour",
    issuingOfficer: "Agent émetteur",
    certificateNumber: "Numéro de certificat",
    issued: "Émis",
    score: "Note",
    verifyCredential: "Vérifier cette accréditation",
    codePrefix: "Code",
    footerLeft: "HENRY & CO. · Certificat académique HenryCo Learn",
    footerRight: "Les certificats authentiques se résolvent à l'URL ci-dessus",
    defaultIssuerName: "Adaeze Henry-Mbachu",
    defaultIssuerTitle: "Directrice, HenryCo Learn",
    defaultIssuerAccreditation: "Émis selon les standards académiques de HenryCo Learn",
  },
  logisticsB2b: {
    subject: "Relevé B2B HenryCo Logistics",
    documentType: "Relevé B2B",
    subtitleShipments: (count: number) => `${count} envois`,
    metaPeriod: "Période",
    metaStarts: "Début",
    metaEnds: "Fin",
    divisionLabel: "Logistics · B2B",
    grossSpend: "Dépenses brutes",
    columnTracking: "Suivi",
    columnRecipient: "Destinataire",
    columnService: "Service",
    columnStatus: "Statut",
    columnAmount: "Montant",
    sectionAccount: "Compte",
    rowName: "Nom",
    rowLegalName: "Raison sociale",
    rowBillingTerms: "Conditions de facturation",
    rowBillingEmail: "E-mail de facturation",
    sectionPeriodSummary: "Résumé de la période",
    rowShipments: "Envois",
    rowDelivered: "Livrés",
    rowOnTime: "À l'heure",
    rowGrossSpend: "Dépenses brutes",
    sectionItemised: "Envois détaillés",
    emptyShipments: "Aucun envoi sur cette période.",
    legalLine1:
      "Ce relevé résume l'activité d'expédition réservée via votre compte B2B HenryCo durant la période ci-dessus. Les montants sont bruts de toute remise négociée, réglée séparément selon la cadence convenue.",
    legalLine2:
      "Les écarts doivent être signalés dans le délai de contestation indiqué dans votre contrat de service ; nous ne pouvons pas refacturer en dehors de ce délai.",
  },
  logisticsReceipt: {
    subject: "Reçu d'expédition HenryCo Logistics",
    documentType: "Reçu d'expédition",
    metaBooked: "Réservé",
    metaScheduled: "Planifié",
    metaStatus: "Statut",
    divisionLabel: "Logistics",
    amountPaid: "Montant payé",
    columnLineItem: "Ligne",
    columnAmount: "Montant",
    sectionCustomer: "Client",
    rowName: "Nom",
    rowEmail: "E-mail",
    rowPhone: "Téléphone",
    rowTrackingCode: "Code de suivi",
    sectionPickup: "Enlèvement",
    sectionDropoff: "Livraison",
    sectionParcelService: "Colis + service",
    rowService: "Service",
    rowUrgency: "Urgence",
    rowParcel: "Colis",
    rowDescription: "Description",
    rowWeight: "Poids",
    weightUnit: (kg: number) => `${kg} kg`,
    rowSizeTier: "Catégorie de taille",
    rowCorridor: "Corridor",
    sectionPricing: "Détail tarifaire",
    emptyPricing: "Aucun détail tarifaire enregistré.",
    sectionSettlement: "Règlement",
    rowQuoted: "Devis",
    rowPaid: "Payé",
    rowMethod: "Mode",
    rowReference: "Référence",
    rowStatus: "Statut",
    sectionProof: "Preuve de livraison",
    rowRecipient: "Destinataire",
    rowDelivered: "Livré",
    rowType: "Type",
    rowNote: "Note",
    legalLine1:
      "HenryCo Logistics est l'opérateur officiel de cet envoi. L'assurance, les délais de réclamation et la responsabilité en cas de colis perdu sont régis par le contrat de service HenryCo Logistics.",
    legalLine2:
      "En cas d'écart entre ce reçu et l'enregistrement d'expédition en direct, contactez le support logistique dans un délai de 7 jours pour la résolution la plus rapide.",
  },
  propertyManaged: {
    subject: "Relevé de gestion immobilière HenryCo Property",
    documentType: "Relevé de bien géré",
    divisionLabel: "Property · Géré",
    netPayable: "Net dû au propriétaire",
    metaPeriod: "Période",
    metaStarts: "Début",
    metaEnds: "Fin",
    columnPeriod: "Période",
    columnWindow: "Fenêtre",
    columnStatus: "Statut",
    columnCollected: "Encaissé",
    columnAmount: "Montant",
    columnTicket: "Ticket",
    columnCategory: "Catégorie",
    columnSeverity: "Gravité",
    columnResolved: "Résolu",
    sectionOwner: "Propriétaire",
    rowName: "Nom",
    rowLegalName: "Raison sociale",
    rowEmail: "E-mail",
    rowPhone: "Téléphone",
    sectionListing: "Annonce",
    rowTitle: "Titre",
    rowAddress: "Adresse",
    rowManagedSince: "Géré depuis",
    sectionPeriodSummary: "Résumé de la période",
    rowGrossRent: "Loyer brut encaissé",
    rowMaintenanceSpend: "Dépenses d'entretien",
    rowManagementFee: "Frais de gestion",
    rowNetPayable: "Net dû au propriétaire",
    sectionRentLedger: "Journal des loyers",
    emptyRent: "Aucune activité de loyer sur cette période.",
    sectionMaintenance: "Entretien",
    emptyMaintenance: "Aucune activité d'entretien sur cette période.",
    legalLine1:
      "Ce relevé reflète les loyers encaissés et les charges d'exploitation appliquées au bien géré ci-dessus durant la période. Les montants sont bruts de retenue à la source ; HenryCo reverse le net selon la cadence convenue dans votre mandat de gestion.",
    legalLine2:
      "Tout écart doit être signalé par écrit dans le délai de contestation indiqué dans votre mandat de gestion ; HenryCo ne peut pas refacturer ou réencaisser en dehors de ce délai.",
  },
  receipt: {
    subject: "Reçu de paiement",
    documentType: "Reçu",
    subtitle: (paidAt: string, method: string) => `Payé le ${paidAt} · ${method}`,
    metaPaid: "Payé",
    metaMethod: "Mode",
    metaReference: "Référence",
    totalPaid: "Total payé",
    columnItem: "Article",
    columnQty: "Qté",
    columnAmount: "Montant",
    sectionCustomer: "Client",
    rowName: "Nom",
    rowEmail: "E-mail",
    rowDelivery: "Livraison",
    sectionWhatPaid: "Détail du paiement",
    emptyItems: "Aucun article enregistré.",
    sectionSettlement: "Règlement",
    rowSubtotal: "Sous-total",
    rowFees: "Frais",
    rowTax: "Taxe",
    rowTotal: "Total",
    rowStatus: "Statut",
    sectionNotes: "Notes",
    legalLine1:
      "Ce reçu atteste d'un paiement encaissé par HenryCo pour le compte de la division d'origine. La position fiscale reflète le taux en vigueur à la date de paiement ci-dessus.",
    legalLine2:
      "Si vous constatez un écart, contactez le support HenryCo dans un délai de 7 jours pour la résolution la plus rapide.",
  },
  studioInvoice: {
    subject: (invoiceNumber: string) => `Facture ${invoiceNumber}`,
    documentType: "Facture",
    metaIssued: "Émise",
    metaDue: "Échéance",
    metaDueOnReceipt: "À réception",
    metaStatus: "Statut",
    divisionLabel: "Studio",
    partyFrom: "De",
    partyBillTo: "Facturer à",
    rcPrefix: "RC :",
    vatPrefix: "TVA :",
    sectionProject: "Projet",
    rowProject: "Projet",
    rowPaymentPlan: "Plan de paiement",
    rowNextMilestone: "Prochain jalon",
    columnDescription: "Description",
    columnMilestone: "Jalon",
    columnAmount: "Montant",
    sectionLineItems: "Lignes de facturation",
    emptyLineItems: "Aucune ligne de facturation structurée enregistrée.",
    paymentStatus: "Statut du paiement",
    paymentMethod: "Mode de paiement",
    paymentReference: "Référence de paiement",
    paidAt: "Payée le",
    subtotal: "Sous-total",
    discount: "Remise",
    tax: "Taxe",
    total: "Total",
    settledAs: (amount: string) => `Réglé en ${amount}`,
    fxAt: (rate: string, paidCurrency: string, invoiceCurrency: string) =>
      ` au taux de ${rate} ${paidCurrency}/${invoiceCurrency}`,
    legalLine1:
      "Émise dans le cadre de la facturation HenryCo Studio. Le règlement multidevise est saisi au taux de la passerelle le jour du paiement ; la devise de facturation et la devise de règlement sont toutes deux enregistrées à des fins d'audit.",
    legalLine2:
      "Les litiges doivent être soulevés dans les sept jours calendaires suivant l'émission. Un paiement tardif peut entraîner un échéancier de relance selon le contrat d'engagement.",
  },
  studioProposal: {
    documentType: "Proposition",
    metaIssued: "Émise",
    metaValidUntil: "Valable jusqu'au",
    metaStatus: "Statut",
    divisionLabel: "Studio",
    partyFrom: "De",
    partyPreparedFor: "Préparée pour",
    rcPrefix: "RC :",
    columnMilestone: "Jalon",
    columnDue: "Échéance",
    columnAmount: "Montant",
    sectionEngagement: "Aperçu de l'engagement",
    rowService: "Service",
    rowPackage: "Forfait",
    rowTeam: "Équipe",
    rowTimeline: "Calendrier",
    sectionScope: "Périmètre",
    scopeFallback: "Périmètre détaillé dans le brief associé.",
    sectionDeliverables: "Livrables",
    sectionMilestones: "Jalons",
    emptyMilestones: "Aucun jalon enregistré.",
    rowDepositDue: "Acompte requis pour démarrer",
    rowCurrency: "Devise",
    rowValidUntil: "Valable jusqu'au",
    totalInvestment: "Investissement",
    totalDeposit: "Acompte",
    totalBalance: "Solde",
    signed: "Signé",
    signedAt: "Signé le",
    signedBy: "Signé par",
    signedEmail: "E-mail",
    signedProvider: "Prestataire",
    signedIp: "Adresse IP",
    signedLocale: "Langue",
    legalLine1:
      "Cette proposition est régie par les conditions d'engagement de HenryCo Studio. L'acceptation est enregistrée électroniquement avec horodatage, adresse IP, agent utilisateur et langue saisis pour la relecture d'audit.",
    legalLine2:
      "Les montants d'investissement et d'acompte ci-dessus sont hors taxe légale sauf indication explicite. La devise est convertie au taux de la passerelle le jour du règlement.",
  },
  vendorPayout: {
    subject: "Relevé de versement vendeur HenryCo Marketplace",
    documentType: "Relevé de versement",
    subtitleOrders: (count: number) => `${count} commande${count === 1 ? "" : "s"}`,
    metaPeriod: "Période",
    metaSettlement: "Règlement",
    metaReference: "Référence",
    divisionLabel: "Marketplace · Versement vendeur",
    netPayout: "Versement net",
    columnOrder: "Commande",
    columnFulfilled: "Honorée",
    columnBuyer: "Acheteur",
    columnStatus: "Statut",
    columnGross: "Brut",
    columnCommission: "Commission",
    columnFee: "Frais",
    columnRefunds: "Remboursements",
    columnNet: "Net",
    sectionVendor: "Vendeur",
    rowStore: "Boutique",
    rowSlug: "Identifiant",
    rowLegalName: "Raison sociale",
    rowTaxId: "Numéro fiscal",
    rowPayoutMethod: "Mode de versement",
    rowDestination: "Destination",
    rowSettlementCurrency: "Devise de règlement",
    onFile: "Au dossier",
    sectionPeriodSummary: "Résumé de la période",
    rowOrdersSettled: "Commandes réglées",
    rowGrossRevenue: "Revenu brut",
    rowPlatformCommission: "Commission de plateforme",
    rowProcessingFees: "Frais de traitement",
    rowRefundsChargebacks: "Remboursements + rétrofacturations",
    rowNetPayout: "Versement net",
    rowScheduledFor: "Programmé pour",
    awaitingCycle: "En attente du cycle",
    rowGenerated: "Généré",
    sectionItemised: "Commandes détaillées",
    emptyOrders: "Aucune commande réglée sur cette période.",
    footerNet: "Net pour la période sélectionnée",
    legalLine1:
      "Ce relevé reflète les commandes ayant franchi la fenêtre de déblocage automatique durant la période ci-dessus. Les remboursements ou litiges ouverts après la clôture figurent sur le relevé suivant.",
    legalLine2:
      "La position fiscale relève de la responsabilité du vendeur ; HenryCo ne retient que la commission et les frais de traitement indiqués dans votre contrat vendeur.",
    legalLine3:
      "Les écarts doivent être signalés dans un délai de 14 jours via le canal de contestation de l'espace vendeur ; nous ne pouvons pas réémettre de versements en dehors de ce délai.",
  },
};

const ES: DeepPartial<BrandedDocumentsCopy> = {
  footer: {
    defaultLegal: "Henry & Co. — cada negocio bajo un único nombre de confianza.",
  },
  signature: {
    authorisedSignatory: "Firmante autorizado",
    signedPrefix: "Firmado",
  },
  invoice: {
    documentType: "Factura",
    metaIssued: "Emitida",
    metaDue: "Vencimiento",
    metaDueOnReceipt: "A la recepción",
    metaStatus: "Estado",
    divisionGroup: "Grupo",
    partyFrom: "De",
    partyBillTo: "Facturar a",
    rcPrefix: "RC:",
    vatPrefix: "IVA:",
    columnItem: "Concepto",
    columnQty: "Cant.",
    columnUnit: "Unidad",
    columnAmount: "Importe",
    sectionLineItems: "Líneas de factura",
    emptyLineItems: "No se registraron líneas de factura estructuradas.",
    paymentStatus: "Estado del pago",
    paymentMethod: "Método de pago",
    paymentReference: "Referencia de pago",
    paidAt: "Pagada el",
    subtotal: "Subtotal",
    discount: "Descuento",
    tax: "Impuesto",
    total: "Total",
    legalLine1:
      "Esta factura se emite bajo la facturación unificada de HenryCo. La división de origen sigue siendo la fuente de referencia para las condiciones de entrega, disputa y reembolso.",
    legalLine2:
      "Los pagos se reconocen una vez que la pasarela de origen confirma la liquidación; el estado anterior refleja la instantánea de conciliación más reciente.",
  },
  kyc: {
    documentType: "Resumen de verificación de identidad",
    subject: "Resumen de verificación de identidad",
    metaSubmitted: "Enviado",
    metaReviewed: "Revisado",
    divisionLabel: "Confianza y cumplimiento",
    statusPrefix: "Estado",
    columnDocument: "Documento",
    columnStatus: "Estado",
    columnSubmitted: "Enviado",
    columnReviewed: "Revisado",
    columnReviewerNote: "Nota del revisor",
    privacyKicker: "Postura de privacidad",
    privacyBody:
      "Este resumen registra lo que se envió y cómo lo ha revisado el equipo de confianza de HenryCo. Los documentos de identidad subyacentes nunca se incrustan en este PDF: solo los metadatos que ve a continuación.",
    accountHolder: "Titular de la cuenta",
    rowName: "Nombre",
    rowEmail: "Correo electrónico",
    rowAccountId: "ID de cuenta",
    rowOverallStatus: "Estado general",
    sectionSubmissions: "Envíos",
    emptySubmissions: "No hay envíos KYC en el archivo.",
    sectionReviewerNote: "Nota del revisor",
    legalLine1:
      "HenryCo conserva los documentos de identidad solo durante el tiempo exigido por la ley nigeriana y las obligaciones KYC aplicables. Este resumen es su copia de pista de auditoría y no incluye las imágenes de los documentos en sí.",
    legalLine2:
      "Si necesita actualizar una identificación, hágalo desde su página de verificación de cuenta de HenryCo; el registro original pasará entonces al estado histórico y una nueva entrada lo reemplazará en esta vista.",
  },
  learn: {
    author: "Henry & Co. — HenryCo Learn",
    subject: (courseTitle: string) => `Certificado de finalización de ${courseTitle}`,
    keywords: "certificado, henryco learn",
    learnLabel: "HenryCo Learn",
    certificateOfCompletion: "Certificado de finalización",
    preamble: "Por el presente se certifica que",
    body: "ha cumplido todos los requisitos de aprendizaje, evaluación e integridad establecidos para",
    issuingOfficer: "Funcionario emisor",
    certificateNumber: "Número de certificado",
    issued: "Emitido",
    score: "Puntuación",
    verifyCredential: "Verificar esta credencial",
    codePrefix: "Código",
    footerLeft: "HENRY & CO. · Certificado académico de HenryCo Learn",
    footerRight: "Los certificados auténticos se resuelven en la URL anterior",
    defaultIssuerName: "Adaeze Henry-Mbachu",
    defaultIssuerTitle: "Directora, HenryCo Learn",
    defaultIssuerAccreditation: "Emitido conforme a los estándares académicos de HenryCo Learn",
  },
  logisticsB2b: {
    subject: "Estado de cuenta B2B de HenryCo Logistics",
    documentType: "Estado de cuenta B2B",
    subtitleShipments: (count: number) => `${count} envíos`,
    metaPeriod: "Período",
    metaStarts: "Inicio",
    metaEnds: "Fin",
    divisionLabel: "Logistics · B2B",
    grossSpend: "Gasto bruto",
    columnTracking: "Seguimiento",
    columnRecipient: "Destinatario",
    columnService: "Servicio",
    columnStatus: "Estado",
    columnAmount: "Importe",
    sectionAccount: "Cuenta",
    rowName: "Nombre",
    rowLegalName: "Razón social",
    rowBillingTerms: "Condiciones de facturación",
    rowBillingEmail: "Correo de facturación",
    sectionPeriodSummary: "Resumen del período",
    rowShipments: "Envíos",
    rowDelivered: "Entregados",
    rowOnTime: "A tiempo",
    rowGrossSpend: "Gasto bruto",
    sectionItemised: "Envíos detallados",
    emptyShipments: "No hay envíos en este período.",
    legalLine1:
      "Este estado de cuenta resume la actividad de envíos reservada a través de su cuenta B2B de HenryCo durante el período anterior. Los importes son brutos de cualquier descuento negociado, que se liquida por separado según la cadencia acordada.",
    legalLine2:
      "Las discrepancias deben plantearse dentro del plazo de disputa indicado en su acuerdo de servicio; no podemos volver a facturar fuera de ese plazo.",
  },
  logisticsReceipt: {
    subject: "Recibo de envío de HenryCo Logistics",
    documentType: "Recibo de envío",
    metaBooked: "Reservado",
    metaScheduled: "Programado",
    metaStatus: "Estado",
    divisionLabel: "Logistics",
    amountPaid: "Importe pagado",
    columnLineItem: "Línea",
    columnAmount: "Importe",
    sectionCustomer: "Cliente",
    rowName: "Nombre",
    rowEmail: "Correo electrónico",
    rowPhone: "Teléfono",
    rowTrackingCode: "Código de seguimiento",
    sectionPickup: "Recogida",
    sectionDropoff: "Entrega",
    sectionParcelService: "Paquete + servicio",
    rowService: "Servicio",
    rowUrgency: "Urgencia",
    rowParcel: "Paquete",
    rowDescription: "Descripción",
    rowWeight: "Peso",
    weightUnit: (kg: number) => `${kg} kg`,
    rowSizeTier: "Nivel de tamaño",
    rowCorridor: "Corredor",
    sectionPricing: "Desglose de precios",
    emptyPricing: "No se registró ningún precio detallado.",
    sectionSettlement: "Liquidación",
    rowQuoted: "Cotizado",
    rowPaid: "Pagado",
    rowMethod: "Método",
    rowReference: "Referencia",
    rowStatus: "Estado",
    sectionProof: "Comprobante de entrega",
    rowRecipient: "Destinatario",
    rowDelivered: "Entregado",
    rowType: "Tipo",
    rowNote: "Nota",
    legalLine1:
      "HenryCo Logistics es el operador responsable de este envío. El seguro, los plazos de reclamación y la responsabilidad por paquetes perdidos se rigen por el acuerdo de servicio de HenryCo Logistics.",
    legalLine2:
      "Si existe una discrepancia entre este recibo y el registro de envío en vivo, comuníquese con el soporte de logística dentro de los 7 días para la vía de resolución más rápida.",
  },
  propertyManaged: {
    subject: "Estado de cuenta de propiedad gestionada de HenryCo Property",
    documentType: "Estado de propiedad gestionada",
    divisionLabel: "Property · Gestionada",
    netPayable: "Neto a pagar al propietario",
    metaPeriod: "Período",
    metaStarts: "Inicio",
    metaEnds: "Fin",
    columnPeriod: "Período",
    columnWindow: "Ventana",
    columnStatus: "Estado",
    columnCollected: "Cobrado",
    columnAmount: "Importe",
    columnTicket: "Ticket",
    columnCategory: "Categoría",
    columnSeverity: "Gravedad",
    columnResolved: "Resuelto",
    sectionOwner: "Propietario",
    rowName: "Nombre",
    rowLegalName: "Razón social",
    rowEmail: "Correo electrónico",
    rowPhone: "Teléfono",
    sectionListing: "Anuncio",
    rowTitle: "Título",
    rowAddress: "Dirección",
    rowManagedSince: "Gestionado desde",
    sectionPeriodSummary: "Resumen del período",
    rowGrossRent: "Alquiler bruto cobrado",
    rowMaintenanceSpend: "Gasto de mantenimiento",
    rowManagementFee: "Comisión de gestión",
    rowNetPayable: "Neto a pagar al propietario",
    sectionRentLedger: "Libro de alquileres",
    emptyRent: "No hay actividad de alquiler en este período.",
    sectionMaintenance: "Mantenimiento",
    emptyMaintenance: "No hay actividad de mantenimiento en este período.",
    legalLine1:
      "Este estado de cuenta refleja los alquileres cobrados y los gastos operativos aplicados al anuncio gestionado anterior durante el período. Los importes son brutos de retención fiscal; HenryCo remite el neto traspasado según la cadencia acordada en su instrumento de gestión.",
    legalLine2:
      "Cualquier discrepancia debe plantearse por escrito dentro del plazo de disputa indicado en su instrumento de gestión; HenryCo no puede volver a facturar ni a cobrar fuera de ese plazo.",
  },
  receipt: {
    subject: "Recibo de pago",
    documentType: "Recibo",
    subtitle: (paidAt: string, method: string) => `Pagado el ${paidAt} · ${method}`,
    metaPaid: "Pagado",
    metaMethod: "Método",
    metaReference: "Referencia",
    totalPaid: "Total pagado",
    columnItem: "Concepto",
    columnQty: "Cant.",
    columnAmount: "Importe",
    sectionCustomer: "Cliente",
    rowName: "Nombre",
    rowEmail: "Correo electrónico",
    rowDelivery: "Entrega",
    sectionWhatPaid: "Detalle del pago",
    emptyItems: "No se registraron artículos.",
    sectionSettlement: "Liquidación",
    rowSubtotal: "Subtotal",
    rowFees: "Comisiones",
    rowTax: "Impuesto",
    rowTotal: "Total",
    rowStatus: "Estado",
    sectionNotes: "Notas",
    legalLine1:
      "Este recibo acredita un pago capturado por HenryCo en nombre de la división de origen. La posición fiscal refleja la tasa vigente en la fecha de pago anterior.",
    legalLine2:
      "Si detecta una discrepancia, comuníquese con el soporte de HenryCo dentro de los 7 días para la vía de resolución más rápida.",
  },
  studioInvoice: {
    subject: (invoiceNumber: string) => `Factura ${invoiceNumber}`,
    documentType: "Factura",
    metaIssued: "Emitida",
    metaDue: "Vencimiento",
    metaDueOnReceipt: "A la recepción",
    metaStatus: "Estado",
    divisionLabel: "Studio",
    partyFrom: "De",
    partyBillTo: "Facturar a",
    rcPrefix: "RC:",
    vatPrefix: "IVA:",
    sectionProject: "Proyecto",
    rowProject: "Proyecto",
    rowPaymentPlan: "Plan de pago",
    rowNextMilestone: "Próximo hito",
    columnDescription: "Descripción",
    columnMilestone: "Hito",
    columnAmount: "Importe",
    sectionLineItems: "Líneas de factura",
    emptyLineItems: "No se registraron líneas de factura estructuradas.",
    paymentStatus: "Estado del pago",
    paymentMethod: "Método de pago",
    paymentReference: "Referencia de pago",
    paidAt: "Pagada el",
    subtotal: "Subtotal",
    discount: "Descuento",
    tax: "Impuesto",
    total: "Total",
    settledAs: (amount: string) => `Liquidado como ${amount}`,
    fxAt: (rate: string, paidCurrency: string, invoiceCurrency: string) =>
      ` a ${rate} ${paidCurrency}/${invoiceCurrency}`,
    legalLine1:
      "Emitida bajo la facturación de HenryCo Studio. La liquidación multidivisa se captura al tipo de la pasarela el día del pago; tanto la divisa de la factura como la divisa liquidada se registran para auditoría.",
    legalLine2:
      "Las disputas deben plantearse dentro de los siete días naturales posteriores a la emisión. El pago tardío puede conllevar un calendario de recordatorios según el acuerdo de contratación.",
  },
  studioProposal: {
    documentType: "Propuesta",
    metaIssued: "Emitida",
    metaValidUntil: "Válida hasta",
    metaStatus: "Estado",
    divisionLabel: "Studio",
    partyFrom: "De",
    partyPreparedFor: "Preparada para",
    rcPrefix: "RC:",
    columnMilestone: "Hito",
    columnDue: "Vencimiento",
    columnAmount: "Importe",
    sectionEngagement: "Resumen del compromiso",
    rowService: "Servicio",
    rowPackage: "Paquete",
    rowTeam: "Equipo",
    rowTimeline: "Cronograma",
    sectionScope: "Alcance",
    scopeFallback: "Alcance detallado en el informe complementario.",
    sectionDeliverables: "Entregables",
    sectionMilestones: "Hitos",
    emptyMilestones: "No se registraron hitos.",
    rowDepositDue: "Depósito requerido para comenzar",
    rowCurrency: "Divisa",
    rowValidUntil: "Válida hasta",
    totalInvestment: "Inversión",
    totalDeposit: "Depósito",
    totalBalance: "Saldo",
    signed: "Firmada",
    signedAt: "Firmada el",
    signedBy: "Firmada por",
    signedEmail: "Correo electrónico",
    signedProvider: "Proveedor",
    signedIp: "Dirección IP",
    signedLocale: "Idioma",
    legalLine1:
      "Esta propuesta se rige por los términos de contratación de HenryCo Studio. La aceptación se registra electrónicamente con marca de tiempo, dirección IP, agente de usuario e idioma capturados para la repetición de auditoría.",
    legalLine2:
      "Las cifras de inversión y depósito anteriores excluyen el impuesto legal salvo que se indique explícitamente. La divisa se convierte al tipo de la pasarela el día de la liquidación.",
  },
  vendorPayout: {
    subject: "Estado de cuenta de pago a vendedor de HenryCo Marketplace",
    documentType: "Estado de pago",
    subtitleOrders: (count: number) => `${count} pedido${count === 1 ? "" : "s"}`,
    metaPeriod: "Período",
    metaSettlement: "Liquidación",
    metaReference: "Referencia",
    divisionLabel: "Marketplace · Pago a vendedor",
    netPayout: "Pago neto",
    columnOrder: "Pedido",
    columnFulfilled: "Cumplido",
    columnBuyer: "Comprador",
    columnStatus: "Estado",
    columnGross: "Bruto",
    columnCommission: "Comisión",
    columnFee: "Tarifa",
    columnRefunds: "Reembolsos",
    columnNet: "Neto",
    sectionVendor: "Vendedor",
    rowStore: "Tienda",
    rowSlug: "Identificador",
    rowLegalName: "Razón social",
    rowTaxId: "Identificación fiscal",
    rowPayoutMethod: "Método de pago",
    rowDestination: "Destino",
    rowSettlementCurrency: "Divisa de liquidación",
    onFile: "En el archivo",
    sectionPeriodSummary: "Resumen del período",
    rowOrdersSettled: "Pedidos liquidados",
    rowGrossRevenue: "Ingresos brutos",
    rowPlatformCommission: "Comisión de la plataforma",
    rowProcessingFees: "Tarifas de procesamiento",
    rowRefundsChargebacks: "Reembolsos + contracargos",
    rowNetPayout: "Pago neto",
    rowScheduledFor: "Programado para",
    awaitingCycle: "A la espera del ciclo",
    rowGenerated: "Generado",
    sectionItemised: "Pedidos detallados",
    emptyOrders: "No se liquidaron pedidos en este período.",
    footerNet: "Neto del período seleccionado",
    legalLine1:
      "Este estado de cuenta refleja los pedidos que superaron la ventana de liberación automática durante el período anterior. Los reembolsos o disputas abiertos después del corte aparecen en el siguiente estado de cuenta.",
    legalLine2:
      "La posición fiscal es responsabilidad del vendedor; HenryCo retiene solo la comisión y las tarifas de procesamiento divulgadas en su acuerdo de vendedor.",
    legalLine3:
      "Las discrepancias deben plantearse dentro de los 14 días a través del canal de disputas del espacio de vendedor; no podemos volver a emitir pagos fuera de ese plazo.",
  },
};

const PT: DeepPartial<BrandedDocumentsCopy> = {
  footer: {
    defaultLegal: "Henry & Co. — cada negócio sob um único nome de confiança.",
  },
  signature: {
    authorisedSignatory: "Signatário autorizado",
    signedPrefix: "Assinado",
  },
  invoice: {
    documentType: "Fatura",
    metaIssued: "Emitida",
    metaDue: "Vencimento",
    metaDueOnReceipt: "No recebimento",
    metaStatus: "Estado",
    divisionGroup: "Grupo",
    partyFrom: "De",
    partyBillTo: "Faturar para",
    rcPrefix: "RC:",
    vatPrefix: "IVA:",
    columnItem: "Item",
    columnQty: "Qtd.",
    columnUnit: "Unidade",
    columnAmount: "Valor",
    sectionLineItems: "Itens da fatura",
    emptyLineItems: "Nenhum item de fatura estruturado registrado.",
    paymentStatus: "Estado do pagamento",
    paymentMethod: "Forma de pagamento",
    paymentReference: "Referência de pagamento",
    paidAt: "Paga em",
    subtotal: "Subtotal",
    discount: "Desconto",
    tax: "Imposto",
    total: "Total",
    legalLine1:
      "Esta fatura é emitida sob o faturamento unificado da HenryCo. A divisão de origem permanece como a fonte de referência para os termos de entrega, disputa e reembolso.",
    legalLine2:
      "Os pagamentos são reconhecidos assim que o gateway de origem confirma a liquidação; o estado acima reflete o instantâneo de reconciliação mais recente.",
  },
  kyc: {
    documentType: "Resumo de verificação de identidade",
    subject: "Resumo de verificação de identidade",
    metaSubmitted: "Enviado",
    metaReviewed: "Revisado",
    divisionLabel: "Confiança e conformidade",
    statusPrefix: "Estado",
    columnDocument: "Documento",
    columnStatus: "Estado",
    columnSubmitted: "Enviado",
    columnReviewed: "Revisado",
    columnReviewerNote: "Nota do revisor",
    privacyKicker: "Postura de privacidade",
    privacyBody:
      "Este resumo registra o que foi enviado e como a equipe de confiança da HenryCo o revisou. Os documentos de identidade subjacentes nunca são incorporados neste PDF — apenas os metadados que você vê abaixo.",
    accountHolder: "Titular da conta",
    rowName: "Nome",
    rowEmail: "E-mail",
    rowAccountId: "ID da conta",
    rowOverallStatus: "Estado geral",
    sectionSubmissions: "Envios",
    emptySubmissions: "Nenhum envio de KYC no arquivo.",
    sectionReviewerNote: "Nota do revisor",
    legalLine1:
      "A HenryCo retém documentos de identidade apenas pelo tempo exigido pela lei nigeriana e pelas obrigações de KYC aplicáveis. Este resumo é a sua cópia de trilha de auditoria e não inclui as imagens dos documentos em si.",
    legalLine2:
      "Se precisar atualizar uma identificação, faça-o na sua página de verificação de conta da HenryCo; o registro original passará então ao estado histórico e uma nova entrada o substituirá nesta exibição.",
  },
  learn: {
    author: "Henry & Co. — HenryCo Learn",
    subject: (courseTitle: string) => `Certificado de conclusão de ${courseTitle}`,
    keywords: "certificado, henryco learn",
    learnLabel: "HenryCo Learn",
    certificateOfCompletion: "Certificado de conclusão",
    preamble: "Certifica-se por meio deste que",
    body: "cumpriu todos os requisitos de aprendizagem, avaliação e integridade estabelecidos para",
    issuingOfficer: "Agente emissor",
    certificateNumber: "Número do certificado",
    issued: "Emitido",
    score: "Pontuação",
    verifyCredential: "Verificar esta credencial",
    codePrefix: "Código",
    footerLeft: "HENRY & CO. · Certificado acadêmico da HenryCo Learn",
    footerRight: "Os certificados autênticos resolvem no URL acima",
    defaultIssuerName: "Adaeze Henry-Mbachu",
    defaultIssuerTitle: "Diretora, HenryCo Learn",
    defaultIssuerAccreditation: "Emitido conforme os padrões acadêmicos da HenryCo Learn",
  },
  logisticsB2b: {
    subject: "Extrato B2B da HenryCo Logistics",
    documentType: "Extrato B2B",
    subtitleShipments: (count: number) => `${count} envios`,
    metaPeriod: "Período",
    metaStarts: "Início",
    metaEnds: "Fim",
    divisionLabel: "Logistics · B2B",
    grossSpend: "Gasto bruto",
    columnTracking: "Rastreamento",
    columnRecipient: "Destinatário",
    columnService: "Serviço",
    columnStatus: "Estado",
    columnAmount: "Valor",
    sectionAccount: "Conta",
    rowName: "Nome",
    rowLegalName: "Razão social",
    rowBillingTerms: "Condições de faturamento",
    rowBillingEmail: "E-mail de faturamento",
    sectionPeriodSummary: "Resumo do período",
    rowShipments: "Envios",
    rowDelivered: "Entregues",
    rowOnTime: "No prazo",
    rowGrossSpend: "Gasto bruto",
    sectionItemised: "Envios detalhados",
    emptyShipments: "Nenhum envio neste período.",
    legalLine1:
      "Este extrato resume a atividade de envios reservada por meio da sua conta B2B da HenryCo durante o período acima. Os valores são brutos de qualquer desconto negociado, que é liquidado separadamente na cadência acordada.",
    legalLine2:
      "As divergências devem ser levantadas dentro do prazo de disputa indicado no seu contrato de serviço; não podemos refaturar fora desse prazo.",
  },
  logisticsReceipt: {
    subject: "Recibo de envio da HenryCo Logistics",
    documentType: "Recibo de envio",
    metaBooked: "Reservado",
    metaScheduled: "Agendado",
    metaStatus: "Estado",
    divisionLabel: "Logistics",
    amountPaid: "Valor pago",
    columnLineItem: "Item",
    columnAmount: "Valor",
    sectionCustomer: "Cliente",
    rowName: "Nome",
    rowEmail: "E-mail",
    rowPhone: "Telefone",
    rowTrackingCode: "Código de rastreamento",
    sectionPickup: "Coleta",
    sectionDropoff: "Entrega",
    sectionParcelService: "Encomenda + serviço",
    rowService: "Serviço",
    rowUrgency: "Urgência",
    rowParcel: "Encomenda",
    rowDescription: "Descrição",
    rowWeight: "Peso",
    weightUnit: (kg: number) => `${kg} kg`,
    rowSizeTier: "Faixa de tamanho",
    rowCorridor: "Corredor",
    sectionPricing: "Detalhamento de preços",
    emptyPricing: "Nenhum preço detalhado registrado.",
    sectionSettlement: "Liquidação",
    rowQuoted: "Cotado",
    rowPaid: "Pago",
    rowMethod: "Método",
    rowReference: "Referência",
    rowStatus: "Estado",
    sectionProof: "Comprovante de entrega",
    rowRecipient: "Destinatário",
    rowDelivered: "Entregue",
    rowType: "Tipo",
    rowNote: "Nota",
    legalLine1:
      "A HenryCo Logistics é a operadora responsável por este envio. Seguro, prazos de reclamação e responsabilidade por encomendas perdidas são regidos pelo contrato de serviço da HenryCo Logistics.",
    legalLine2:
      "Se houver divergência entre este recibo e o registro de envio ativo, entre em contato com o suporte de logística dentro de 7 dias para a via de resolução mais rápida.",
  },
  propertyManaged: {
    subject: "Extrato de imóvel gerido da HenryCo Property",
    documentType: "Extrato de imóvel gerido",
    divisionLabel: "Property · Gerido",
    netPayable: "Líquido a pagar ao proprietário",
    metaPeriod: "Período",
    metaStarts: "Início",
    metaEnds: "Fim",
    columnPeriod: "Período",
    columnWindow: "Janela",
    columnStatus: "Estado",
    columnCollected: "Recebido",
    columnAmount: "Valor",
    columnTicket: "Chamado",
    columnCategory: "Categoria",
    columnSeverity: "Gravidade",
    columnResolved: "Resolvido",
    sectionOwner: "Proprietário",
    rowName: "Nome",
    rowLegalName: "Razão social",
    rowEmail: "E-mail",
    rowPhone: "Telefone",
    sectionListing: "Anúncio",
    rowTitle: "Título",
    rowAddress: "Endereço",
    rowManagedSince: "Gerido desde",
    sectionPeriodSummary: "Resumo do período",
    rowGrossRent: "Aluguel bruto recebido",
    rowMaintenanceSpend: "Gasto com manutenção",
    rowManagementFee: "Taxa de gestão",
    rowNetPayable: "Líquido a pagar ao proprietário",
    sectionRentLedger: "Razão de aluguéis",
    emptyRent: "Nenhuma atividade de aluguel neste período.",
    sectionMaintenance: "Manutenção",
    emptyMaintenance: "Nenhuma atividade de manutenção neste período.",
    legalLine1:
      "Este extrato reflete os aluguéis recebidos e as despesas operacionais aplicadas ao anúncio gerido acima durante o período. Os valores são brutos de imposto retido na fonte; a HenryCo repassa o líquido na cadência acordada no seu instrumento de gestão.",
    legalLine2:
      "Qualquer divergência deve ser levantada por escrito dentro do prazo de disputa indicado no seu instrumento de gestão; a HenryCo não pode refaturar ou recobrar fora desse prazo.",
  },
  receipt: {
    subject: "Recibo de pagamento",
    documentType: "Recibo",
    subtitle: (paidAt: string, method: string) => `Pago em ${paidAt} · ${method}`,
    metaPaid: "Pago",
    metaMethod: "Método",
    metaReference: "Referência",
    totalPaid: "Total pago",
    columnItem: "Item",
    columnQty: "Qtd.",
    columnAmount: "Valor",
    sectionCustomer: "Cliente",
    rowName: "Nome",
    rowEmail: "E-mail",
    rowDelivery: "Entrega",
    sectionWhatPaid: "Detalhe do pagamento",
    emptyItems: "Nenhum item registrado.",
    sectionSettlement: "Liquidação",
    rowSubtotal: "Subtotal",
    rowFees: "Taxas",
    rowTax: "Imposto",
    rowTotal: "Total",
    rowStatus: "Estado",
    sectionNotes: "Notas",
    legalLine1:
      "Este recibo comprova um pagamento capturado pela HenryCo em nome da divisão de origem. A posição fiscal reflete a alíquota em vigor na data de pagamento acima.",
    legalLine2:
      "Se você notar uma divergência, entre em contato com o suporte da HenryCo dentro de 7 dias para a via de resolução mais rápida.",
  },
  studioInvoice: {
    subject: (invoiceNumber: string) => `Fatura ${invoiceNumber}`,
    documentType: "Fatura",
    metaIssued: "Emitida",
    metaDue: "Vencimento",
    metaDueOnReceipt: "No recebimento",
    metaStatus: "Estado",
    divisionLabel: "Studio",
    partyFrom: "De",
    partyBillTo: "Faturar para",
    rcPrefix: "RC:",
    vatPrefix: "IVA:",
    sectionProject: "Projeto",
    rowProject: "Projeto",
    rowPaymentPlan: "Plano de pagamento",
    rowNextMilestone: "Próximo marco",
    columnDescription: "Descrição",
    columnMilestone: "Marco",
    columnAmount: "Valor",
    sectionLineItems: "Itens da fatura",
    emptyLineItems: "Nenhum item de fatura estruturado registrado.",
    paymentStatus: "Estado do pagamento",
    paymentMethod: "Forma de pagamento",
    paymentReference: "Referência de pagamento",
    paidAt: "Paga em",
    subtotal: "Subtotal",
    discount: "Desconto",
    tax: "Imposto",
    total: "Total",
    settledAs: (amount: string) => `Liquidado como ${amount}`,
    fxAt: (rate: string, paidCurrency: string, invoiceCurrency: string) =>
      ` à taxa de ${rate} ${paidCurrency}/${invoiceCurrency}`,
    legalLine1:
      "Emitida sob o faturamento da HenryCo Studio. A liquidação multimoeda é capturada à taxa do gateway no dia do pagamento; tanto a moeda da fatura quanto a moeda liquidada são registradas para auditoria.",
    legalLine2:
      "As disputas devem ser levantadas dentro de sete dias corridos após a emissão. O pagamento em atraso pode acarretar um cronograma de lembretes conforme o contrato de engajamento.",
  },
  studioProposal: {
    documentType: "Proposta",
    metaIssued: "Emitida",
    metaValidUntil: "Válida até",
    metaStatus: "Estado",
    divisionLabel: "Studio",
    partyFrom: "De",
    partyPreparedFor: "Preparada para",
    rcPrefix: "RC:",
    columnMilestone: "Marco",
    columnDue: "Vencimento",
    columnAmount: "Valor",
    sectionEngagement: "Visão geral do engajamento",
    rowService: "Serviço",
    rowPackage: "Pacote",
    rowTeam: "Equipe",
    rowTimeline: "Cronograma",
    sectionScope: "Escopo",
    scopeFallback: "Escopo detalhado no briefing complementar.",
    sectionDeliverables: "Entregáveis",
    sectionMilestones: "Marcos",
    emptyMilestones: "Nenhum marco registrado.",
    rowDepositDue: "Depósito necessário para iniciar",
    rowCurrency: "Moeda",
    rowValidUntil: "Válida até",
    totalInvestment: "Investimento",
    totalDeposit: "Depósito",
    totalBalance: "Saldo",
    signed: "Assinada",
    signedAt: "Assinada em",
    signedBy: "Assinada por",
    signedEmail: "E-mail",
    signedProvider: "Provedor",
    signedIp: "Endereço IP",
    signedLocale: "Idioma",
    legalLine1:
      "Esta proposta é regida pelos termos de engajamento da HenryCo Studio. A aceitação é registrada eletronicamente com carimbo de data/hora, endereço IP, agente do usuário e idioma capturados para repetição de auditoria.",
    legalLine2:
      "Os valores de investimento e depósito acima excluem imposto legal, salvo indicação explícita. A moeda é convertida à taxa do gateway no dia da liquidação.",
  },
  vendorPayout: {
    subject: "Extrato de pagamento a vendedor da HenryCo Marketplace",
    documentType: "Extrato de pagamento",
    subtitleOrders: (count: number) => `${count} pedido${count === 1 ? "" : "s"}`,
    metaPeriod: "Período",
    metaSettlement: "Liquidação",
    metaReference: "Referência",
    divisionLabel: "Marketplace · Pagamento a vendedor",
    netPayout: "Pagamento líquido",
    columnOrder: "Pedido",
    columnFulfilled: "Atendido",
    columnBuyer: "Comprador",
    columnStatus: "Estado",
    columnGross: "Bruto",
    columnCommission: "Comissão",
    columnFee: "Taxa",
    columnRefunds: "Reembolsos",
    columnNet: "Líquido",
    sectionVendor: "Vendedor",
    rowStore: "Loja",
    rowSlug: "Identificador",
    rowLegalName: "Razão social",
    rowTaxId: "Identificação fiscal",
    rowPayoutMethod: "Método de pagamento",
    rowDestination: "Destino",
    rowSettlementCurrency: "Moeda de liquidação",
    onFile: "Em arquivo",
    sectionPeriodSummary: "Resumo do período",
    rowOrdersSettled: "Pedidos liquidados",
    rowGrossRevenue: "Receita bruta",
    rowPlatformCommission: "Comissão da plataforma",
    rowProcessingFees: "Taxas de processamento",
    rowRefundsChargebacks: "Reembolsos + estornos",
    rowNetPayout: "Pagamento líquido",
    rowScheduledFor: "Agendado para",
    awaitingCycle: "Aguardando o ciclo",
    rowGenerated: "Gerado",
    sectionItemised: "Pedidos detalhados",
    emptyOrders: "Nenhum pedido liquidado neste período.",
    footerNet: "Líquido do período selecionado",
    legalLine1:
      "Este extrato reflete os pedidos que passaram pela janela de liberação automática durante o período acima. Reembolsos ou disputas abertos após o corte aparecem no próximo extrato.",
    legalLine2:
      "A posição fiscal é responsabilidade do vendedor; a HenryCo retém apenas a comissão e as taxas de processamento divulgadas no seu contrato de vendedor.",
    legalLine3:
      "As divergências devem ser levantadas dentro de 14 dias por meio do canal de disputa do espaço do vendedor; não podemos reemitir pagamentos fora desse prazo.",
  },
};

const AR: DeepPartial<BrandedDocumentsCopy> = {
  footer: {
    defaultLegal: "Henry & Co. — كل عمل تحت اسم واحد موثوق.",
  },
  signature: {
    authorisedSignatory: "موقّع مفوّض",
    signedPrefix: "وُقّع",
  },
  invoice: {
    documentType: "فاتورة",
    metaIssued: "صدرت",
    metaDue: "تاريخ الاستحقاق",
    metaDueOnReceipt: "عند الاستلام",
    metaStatus: "الحالة",
    divisionGroup: "المجموعة",
    partyFrom: "من",
    partyBillTo: "إرسال الفاتورة إلى",
    rcPrefix: "رقم السجل:",
    vatPrefix: "ضريبة القيمة المضافة:",
    columnItem: "البند",
    columnQty: "الكمية",
    columnUnit: "الوحدة",
    columnAmount: "المبلغ",
    sectionLineItems: "بنود الفاتورة",
    emptyLineItems: "لم تُسجَّل أي بنود فاتورة منظّمة.",
    paymentStatus: "حالة الدفع",
    paymentMethod: "طريقة الدفع",
    paymentReference: "مرجع الدفع",
    paidAt: "دُفعت في",
    subtotal: "المجموع الفرعي",
    discount: "الخصم",
    tax: "الضريبة",
    total: "الإجمالي",
    legalLine1:
      "تصدر هذه الفاتورة بموجب نظام الفوترة الموحّد لدى HenryCo. يظل القسم المنشئ هو المصدر المرجعي لشروط التسليم والنزاع والاسترداد.",
    legalLine2:
      "يُعترف بالمدفوعات بمجرد تأكيد بوابة الدفع المنشئة للتسوية؛ وتعكس الحالة أعلاه أحدث لقطة تسوية.",
  },
  kyc: {
    documentType: "ملخص التحقق من الهوية",
    subject: "ملخص التحقق من الهوية",
    metaSubmitted: "أُرسل",
    metaReviewed: "روجع",
    divisionLabel: "الثقة والامتثال",
    statusPrefix: "الحالة",
    columnDocument: "المستند",
    columnStatus: "الحالة",
    columnSubmitted: "أُرسل",
    columnReviewed: "روجع",
    columnReviewerNote: "ملاحظة المراجع",
    privacyKicker: "وضع الخصوصية",
    privacyBody:
      "يسجّل هذا الملخص ما جرى إرساله وكيف راجعه فريق الثقة لدى HenryCo. لا تُدرج مستندات الهوية الأساسية أبدًا في ملف PDF هذا — بل البيانات الوصفية التي تراها أدناه فقط.",
    accountHolder: "صاحب الحساب",
    rowName: "الاسم",
    rowEmail: "البريد الإلكتروني",
    rowAccountId: "معرّف الحساب",
    rowOverallStatus: "الحالة العامة",
    sectionSubmissions: "عمليات الإرسال",
    emptySubmissions: "لا توجد عمليات إرسال للتحقق من الهوية في الملف.",
    sectionReviewerNote: "ملاحظة المراجع",
    legalLine1:
      "تحتفظ HenryCo بمستندات الهوية فقط للمدة التي يقتضيها القانون النيجيري والتزامات التحقق من الهوية السارية. هذا الملخص هو نسختك من مسار التدقيق ولا يتضمن صور المستندات نفسها.",
    legalLine2:
      "إذا احتجت إلى تحديث هوية، فافعل ذلك من صفحة التحقق من حسابك لدى HenryCo؛ عندئذٍ ينتقل السجل الأصلي إلى الحالة التاريخية ويحل محله إدخال جديد في هذا العرض.",
  },
  learn: {
    author: "Henry & Co. — HenryCo Learn",
    subject: (courseTitle: string) => `شهادة إتمام لـ ${courseTitle}`,
    keywords: "شهادة، henryco learn",
    learnLabel: "HenryCo Learn",
    certificateOfCompletion: "شهادة إتمام",
    preamble: "يُشهد بموجب هذا أن",
    body: "قد استوفى جميع متطلبات التعلّم والتقييم والنزاهة المحددة لـ",
    issuingOfficer: "الموظف المُصدِر",
    certificateNumber: "رقم الشهادة",
    issued: "صدرت",
    score: "الدرجة",
    verifyCredential: "تحقّق من هذه الشهادة",
    codePrefix: "الرمز",
    footerLeft: "HENRY & CO. · شهادة أكاديمية من HenryCo Learn",
    footerRight: "الشهادات الأصلية تُفتح عبر الرابط أعلاه",
    defaultIssuerName: "Adaeze Henry-Mbachu",
    defaultIssuerTitle: "مديرة، HenryCo Learn",
    defaultIssuerAccreditation: "صدرت وفق المعايير الأكاديمية لـ HenryCo Learn",
  },
  logisticsB2b: {
    subject: "كشف B2B من HenryCo Logistics",
    documentType: "كشف B2B",
    subtitleShipments: (count: number) => `${count} شحنة`,
    metaPeriod: "الفترة",
    metaStarts: "تبدأ",
    metaEnds: "تنتهي",
    divisionLabel: "Logistics · B2B",
    grossSpend: "الإنفاق الإجمالي",
    columnTracking: "التتبّع",
    columnRecipient: "المستلم",
    columnService: "الخدمة",
    columnStatus: "الحالة",
    columnAmount: "المبلغ",
    sectionAccount: "الحساب",
    rowName: "الاسم",
    rowLegalName: "الاسم القانوني",
    rowBillingTerms: "شروط الفوترة",
    rowBillingEmail: "بريد الفوترة",
    sectionPeriodSummary: "ملخص الفترة",
    rowShipments: "الشحنات",
    rowDelivered: "المُسلَّمة",
    rowOnTime: "في الوقت المحدد",
    rowGrossSpend: "الإنفاق الإجمالي",
    sectionItemised: "الشحنات المفصّلة",
    emptyShipments: "لا توجد شحنات في هذه الفترة.",
    legalLine1:
      "يلخّص هذا الكشف نشاط الشحن المحجوز عبر حساب B2B الخاص بك لدى HenryCo خلال الفترة أعلاه. المبالغ إجمالية قبل أي خصم متفاوض عليه، يُسوّى بشكل منفصل وفق الوتيرة المتفق عليها.",
    legalLine2:
      "يجب رفع التباينات ضمن نافذة النزاع المنصوص عليها في اتفاقية الخدمة؛ ولا يمكننا إعادة الفوترة خارج تلك النافذة.",
  },
  logisticsReceipt: {
    subject: "إيصال شحنة من HenryCo Logistics",
    documentType: "إيصال شحنة",
    metaBooked: "حُجزت",
    metaScheduled: "مجدولة",
    metaStatus: "الحالة",
    divisionLabel: "Logistics",
    amountPaid: "المبلغ المدفوع",
    columnLineItem: "البند",
    columnAmount: "المبلغ",
    sectionCustomer: "العميل",
    rowName: "الاسم",
    rowEmail: "البريد الإلكتروني",
    rowPhone: "الهاتف",
    rowTrackingCode: "رمز التتبّع",
    sectionPickup: "الاستلام",
    sectionDropoff: "التسليم",
    sectionParcelService: "الطرد + الخدمة",
    rowService: "الخدمة",
    rowUrgency: "الاستعجال",
    rowParcel: "الطرد",
    rowDescription: "الوصف",
    rowWeight: "الوزن",
    weightUnit: (kg: number) => `${kg} كجم`,
    rowSizeTier: "فئة الحجم",
    rowCorridor: "الممر",
    sectionPricing: "تفصيل التسعير",
    emptyPricing: "لم يُسجَّل أي تسعير مفصّل.",
    sectionSettlement: "التسوية",
    rowQuoted: "السعر المعروض",
    rowPaid: "المدفوع",
    rowMethod: "الطريقة",
    rowReference: "المرجع",
    rowStatus: "الحالة",
    sectionProof: "إثبات التسليم",
    rowRecipient: "المستلم",
    rowDelivered: "سُلّمت",
    rowType: "النوع",
    rowNote: "ملاحظة",
    legalLine1:
      "HenryCo Logistics هي المشغّل المسجّل لهذه الشحنة. يخضع التأمين ونوافذ المطالبة والمسؤولية عن الطرود المفقودة لاتفاقية خدمة HenryCo Logistics.",
    legalLine2:
      "إذا كان هناك تباين بين هذا الإيصال وسجل الشحنة المباشر، فاتصل بدعم الخدمات اللوجستية خلال 7 أيام للحصول على أسرع مسار للحل.",
  },
  propertyManaged: {
    subject: "كشف عقار مُدار من HenryCo Property",
    documentType: "كشف عقار مُدار",
    divisionLabel: "Property · مُدار",
    netPayable: "صافي المستحق للمالك",
    metaPeriod: "الفترة",
    metaStarts: "تبدأ",
    metaEnds: "تنتهي",
    columnPeriod: "الفترة",
    columnWindow: "النافذة",
    columnStatus: "الحالة",
    columnCollected: "المُحصَّل",
    columnAmount: "المبلغ",
    columnTicket: "التذكرة",
    columnCategory: "الفئة",
    columnSeverity: "الخطورة",
    columnResolved: "تم الحل",
    sectionOwner: "المالك",
    rowName: "الاسم",
    rowLegalName: "الاسم القانوني",
    rowEmail: "البريد الإلكتروني",
    rowPhone: "الهاتف",
    sectionListing: "الإعلان",
    rowTitle: "العنوان",
    rowAddress: "العنوان",
    rowManagedSince: "مُدار منذ",
    sectionPeriodSummary: "ملخص الفترة",
    rowGrossRent: "الإيجار الإجمالي المُحصَّل",
    rowMaintenanceSpend: "إنفاق الصيانة",
    rowManagementFee: "رسوم الإدارة",
    rowNetPayable: "صافي المستحق للمالك",
    sectionRentLedger: "سجل الإيجارات",
    emptyRent: "لا يوجد نشاط إيجار في هذه الفترة.",
    sectionMaintenance: "الصيانة",
    emptyMaintenance: "لا يوجد نشاط صيانة في هذه الفترة.",
    legalLine1:
      "يعكس هذا الكشف الإيجارات المُحصَّلة والمصروفات التشغيلية المطبَّقة على الإعلان المُدار أعلاه خلال الفترة. المبالغ إجمالية قبل ضريبة الاستقطاع؛ وتحوّل HenryCo الصافي وفق الوتيرة المتفق عليها في صك الإدارة الخاص بك.",
    legalLine2:
      "يجب رفع أي تباين كتابيًا ضمن نافذة النزاع المنصوص عليها في صك الإدارة الخاص بك؛ ولا يمكن لـ HenryCo إعادة الفوترة أو إعادة التحصيل خارج تلك النافذة.",
  },
  receipt: {
    subject: "إيصال دفع",
    documentType: "إيصال",
    subtitle: (paidAt: string, method: string) => `دُفع في ${paidAt} · ${method}`,
    metaPaid: "دُفع",
    metaMethod: "الطريقة",
    metaReference: "المرجع",
    totalPaid: "إجمالي المدفوع",
    columnItem: "البند",
    columnQty: "الكمية",
    columnAmount: "المبلغ",
    sectionCustomer: "العميل",
    rowName: "الاسم",
    rowEmail: "البريد الإلكتروني",
    rowDelivery: "التسليم",
    sectionWhatPaid: "تفاصيل المدفوع",
    emptyItems: "لم تُسجَّل أي بنود.",
    sectionSettlement: "التسوية",
    rowSubtotal: "المجموع الفرعي",
    rowFees: "الرسوم",
    rowTax: "الضريبة",
    rowTotal: "الإجمالي",
    rowStatus: "الحالة",
    sectionNotes: "ملاحظات",
    legalLine1:
      "يثبت هذا الإيصال دفعةً حصّلتها HenryCo نيابةً عن القسم المنشئ. يعكس الوضع الضريبي المعدّل الساري في تاريخ الدفع أعلاه.",
    legalLine2:
      "إذا لاحظت تباينًا، فاتصل بدعم HenryCo خلال 7 أيام للحصول على أسرع مسار للحل.",
  },
  studioInvoice: {
    subject: (invoiceNumber: string) => `فاتورة ${invoiceNumber}`,
    documentType: "فاتورة",
    metaIssued: "صدرت",
    metaDue: "تاريخ الاستحقاق",
    metaDueOnReceipt: "عند الاستلام",
    metaStatus: "الحالة",
    divisionLabel: "Studio",
    partyFrom: "من",
    partyBillTo: "إرسال الفاتورة إلى",
    rcPrefix: "رقم السجل:",
    vatPrefix: "ضريبة القيمة المضافة:",
    sectionProject: "المشروع",
    rowProject: "المشروع",
    rowPaymentPlan: "خطة الدفع",
    rowNextMilestone: "المرحلة التالية",
    columnDescription: "الوصف",
    columnMilestone: "المرحلة",
    columnAmount: "المبلغ",
    sectionLineItems: "بنود الفاتورة",
    emptyLineItems: "لم تُسجَّل أي بنود فاتورة منظّمة.",
    paymentStatus: "حالة الدفع",
    paymentMethod: "طريقة الدفع",
    paymentReference: "مرجع الدفع",
    paidAt: "دُفعت في",
    subtotal: "المجموع الفرعي",
    discount: "الخصم",
    tax: "الضريبة",
    total: "الإجمالي",
    settledAs: (amount: string) => `سُوّيت كـ ${amount}`,
    fxAt: (rate: string, paidCurrency: string, invoiceCurrency: string) =>
      ` بسعر ${rate} ${paidCurrency}/${invoiceCurrency}`,
    legalLine1:
      "تصدر بموجب فوترة HenryCo Studio. تُلتقط التسوية متعددة العملات بسعر البوابة في يوم الدفع؛ وتُسجَّل عملة الفاتورة وعملة التسوية كلتاهما لأغراض التدقيق.",
    legalLine2:
      "يجب رفع النزاعات خلال سبعة أيام تقويمية من الإصدار. قد يؤدي التأخر في الدفع إلى جدول تذكير وفق اتفاقية التعاقد.",
  },
  studioProposal: {
    documentType: "عرض مقترح",
    metaIssued: "صدر",
    metaValidUntil: "صالح حتى",
    metaStatus: "الحالة",
    divisionLabel: "Studio",
    partyFrom: "من",
    partyPreparedFor: "أُعد لـ",
    rcPrefix: "رقم السجل:",
    columnMilestone: "المرحلة",
    columnDue: "تاريخ الاستحقاق",
    columnAmount: "المبلغ",
    sectionEngagement: "نظرة عامة على التعاقد",
    rowService: "الخدمة",
    rowPackage: "الباقة",
    rowTeam: "الفريق",
    rowTimeline: "الجدول الزمني",
    sectionScope: "النطاق",
    scopeFallback: "النطاق مفصّل في الموجز المرافق.",
    sectionDeliverables: "المُخرجات",
    sectionMilestones: "المراحل",
    emptyMilestones: "لم تُسجَّل أي مراحل.",
    rowDepositDue: "العربون المطلوب للبدء",
    rowCurrency: "العملة",
    rowValidUntil: "صالح حتى",
    totalInvestment: "الاستثمار",
    totalDeposit: "العربون",
    totalBalance: "الرصيد",
    signed: "موقّع",
    signedAt: "وُقّع في",
    signedBy: "وقّعه",
    signedEmail: "البريد الإلكتروني",
    signedProvider: "المزوّد",
    signedIp: "عنوان IP",
    signedLocale: "اللغة",
    legalLine1:
      "يخضع هذا العرض لشروط تعاقد HenryCo Studio. يُسجَّل القبول إلكترونيًا مع الطابع الزمني وعنوان IP ووكيل المستخدم واللغة الملتقطة لإعادة تشغيل التدقيق.",
    legalLine2:
      "أرقام الاستثمار والعربون أعلاه لا تشمل الضريبة القانونية ما لم يُذكر خلاف ذلك صراحةً. تُحوَّل العملة بسعر البوابة في يوم التسوية.",
  },
  vendorPayout: {
    subject: "كشف دفعة بائع من HenryCo Marketplace",
    documentType: "كشف دفعة",
    subtitleOrders: (count: number) => `${count} طلب`,
    metaPeriod: "الفترة",
    metaSettlement: "التسوية",
    metaReference: "المرجع",
    divisionLabel: "Marketplace · دفعة البائع",
    netPayout: "صافي الدفعة",
    columnOrder: "الطلب",
    columnFulfilled: "تم التنفيذ",
    columnBuyer: "المشتري",
    columnStatus: "الحالة",
    columnGross: "الإجمالي",
    columnCommission: "العمولة",
    columnFee: "الرسوم",
    columnRefunds: "المبالغ المستردة",
    columnNet: "الصافي",
    sectionVendor: "البائع",
    rowStore: "المتجر",
    rowSlug: "المعرّف",
    rowLegalName: "الاسم القانوني",
    rowTaxId: "الرقم الضريبي",
    rowPayoutMethod: "طريقة الدفع",
    rowDestination: "الوجهة",
    rowSettlementCurrency: "عملة التسوية",
    onFile: "في الملف",
    sectionPeriodSummary: "ملخص الفترة",
    rowOrdersSettled: "الطلبات المُسوّاة",
    rowGrossRevenue: "الإيراد الإجمالي",
    rowPlatformCommission: "عمولة المنصة",
    rowProcessingFees: "رسوم المعالجة",
    rowRefundsChargebacks: "المبالغ المستردة + ردود المبالغ",
    rowNetPayout: "صافي الدفعة",
    rowScheduledFor: "مجدولة لـ",
    awaitingCycle: "بانتظار الدورة",
    rowGenerated: "أُنشئ",
    sectionItemised: "الطلبات المفصّلة",
    emptyOrders: "لم تُسوَّ أي طلبات في هذه الفترة.",
    footerNet: "الصافي للفترة المحددة",
    legalLine1:
      "يعكس هذا الكشف الطلبات التي اجتازت نافذة الإفراج التلقائي خلال الفترة أعلاه. تظهر المبالغ المستردة أو النزاعات المفتوحة بعد الموعد النهائي في الكشف التالي.",
    legalLine2:
      "الوضع الضريبي مسؤولية البائع؛ تحتجز HenryCo فقط العمولة ورسوم المعالجة المفصح عنها في اتفاقية البائع الخاصة بك.",
    legalLine3:
      "يجب رفع التباينات خلال 14 يومًا عبر قناة النزاع في مساحة عمل البائع؛ ولا يمكننا إعادة إصدار الدفعات خارج تلك النافذة.",
  },
};

const DE: DeepPartial<BrandedDocumentsCopy> = {
  footer: {
    defaultLegal: "Henry & Co. — jedes Geschäft unter einem vertrauenswürdigen Namen.",
  },
  signature: {
    authorisedSignatory: "Bevollmächtigter Unterzeichner",
    signedPrefix: "Unterzeichnet",
  },
  invoice: {
    documentType: "Rechnung",
    metaIssued: "Ausgestellt",
    metaDue: "Fällig",
    metaDueOnReceipt: "Bei Erhalt",
    metaStatus: "Status",
    divisionGroup: "Gruppe",
    partyFrom: "Von",
    partyBillTo: "Rechnung an",
    rcPrefix: "HR-Nr.:",
    vatPrefix: "USt-IdNr.:",
    columnItem: "Position",
    columnQty: "Menge",
    columnUnit: "Einzelpreis",
    columnAmount: "Betrag",
    sectionLineItems: "Rechnungsposten",
    emptyLineItems: "Keine strukturierten Rechnungsposten erfasst.",
    paymentStatus: "Zahlungsstatus",
    paymentMethod: "Zahlungsmethode",
    paymentReference: "Zahlungsreferenz",
    paidAt: "Bezahlt am",
    subtotal: "Zwischensumme",
    discount: "Rabatt",
    tax: "Steuer",
    total: "Gesamt",
    legalLine1:
      "Diese Rechnung wird im Rahmen der einheitlichen Abrechnung von HenryCo ausgestellt. Der ursprüngliche Geschäftsbereich bleibt die maßgebliche Quelle für Liefer-, Streit- und Erstattungsbedingungen.",
    legalLine2:
      "Zahlungen werden anerkannt, sobald das ursprüngliche Gateway die Abwicklung bestätigt; der obige Status spiegelt die jüngste Abstimmungsmomentaufnahme wider.",
  },
  kyc: {
    documentType: "Zusammenfassung der Identitätsprüfung",
    subject: "Zusammenfassung der Identitätsprüfung",
    metaSubmitted: "Eingereicht",
    metaReviewed: "Geprüft",
    divisionLabel: "Vertrauen & Compliance",
    statusPrefix: "Status",
    columnDocument: "Dokument",
    columnStatus: "Status",
    columnSubmitted: "Eingereicht",
    columnReviewed: "Geprüft",
    columnReviewerNote: "Prüferhinweis",
    privacyKicker: "Datenschutzhaltung",
    privacyBody:
      "Diese Zusammenfassung erfasst, was eingereicht wurde und wie das Trust-Team von HenryCo es geprüft hat. Die zugrunde liegenden Ausweisdokumente werden niemals in dieses PDF eingebettet — nur die unten sichtbaren Metadaten.",
    accountHolder: "Kontoinhaber",
    rowName: "Name",
    rowEmail: "E-Mail",
    rowAccountId: "Konto-ID",
    rowOverallStatus: "Gesamtstatus",
    sectionSubmissions: "Einreichungen",
    emptySubmissions: "Keine KYC-Einreichungen in der Akte.",
    sectionReviewerNote: "Prüferhinweis",
    legalLine1:
      "HenryCo bewahrt Ausweisdokumente nur so lange auf, wie es das nigerianische Recht und die geltenden KYC-Pflichten erfordern. Diese Zusammenfassung ist Ihre Audit-Trail-Kopie und enthält nicht die Dokumentbilder selbst.",
    legalLine2:
      "Wenn Sie einen Ausweis aktualisieren müssen, tun Sie dies über Ihre HenryCo-Kontoverifizierungsseite; der ursprüngliche Datensatz wechselt dann in den historischen Zustand und ein neuer Eintrag ersetzt ihn in dieser Ansicht.",
  },
  learn: {
    author: "Henry & Co. — HenryCo Learn",
    subject: (courseTitle: string) => `Abschlusszertifikat für ${courseTitle}`,
    keywords: "zertifikat, henryco learn",
    learnLabel: "HenryCo Learn",
    certificateOfCompletion: "Abschlusszertifikat",
    preamble: "Hiermit wird bescheinigt, dass",
    body: "alle für den folgenden Kurs festgelegten Lern-, Bewertungs- und Integritätsanforderungen erfüllt hat:",
    issuingOfficer: "Ausstellender Beauftragter",
    certificateNumber: "Zertifikatsnummer",
    issued: "Ausgestellt",
    score: "Ergebnis",
    verifyCredential: "Diesen Nachweis überprüfen",
    codePrefix: "Code",
    footerLeft: "HENRY & CO. · Akademisches Zertifikat von HenryCo Learn",
    footerRight: "Echte Zertifikate werden über die obige URL aufgelöst",
    defaultIssuerName: "Adaeze Henry-Mbachu",
    defaultIssuerTitle: "Direktorin, HenryCo Learn",
    defaultIssuerAccreditation: "Ausgestellt nach den akademischen Standards von HenryCo Learn",
  },
  logisticsB2b: {
    subject: "HenryCo Logistics B2B-Abrechnung",
    documentType: "B2B-Abrechnung",
    subtitleShipments: (count: number) => `${count} Sendungen`,
    metaPeriod: "Zeitraum",
    metaStarts: "Beginn",
    metaEnds: "Ende",
    divisionLabel: "Logistics · B2B",
    grossSpend: "Bruttoausgaben",
    columnTracking: "Sendungsverfolgung",
    columnRecipient: "Empfänger",
    columnService: "Service",
    columnStatus: "Status",
    columnAmount: "Betrag",
    sectionAccount: "Konto",
    rowName: "Name",
    rowLegalName: "Firmenname",
    rowBillingTerms: "Abrechnungsbedingungen",
    rowBillingEmail: "Rechnungs-E-Mail",
    sectionPeriodSummary: "Zeitraumübersicht",
    rowShipments: "Sendungen",
    rowDelivered: "Zugestellt",
    rowOnTime: "Pünktlich",
    rowGrossSpend: "Bruttoausgaben",
    sectionItemised: "Aufgeschlüsselte Sendungen",
    emptyShipments: "Keine Sendungen in diesem Zeitraum.",
    legalLine1:
      "Diese Abrechnung fasst die über Ihr HenryCo-B2B-Konto im obigen Zeitraum gebuchte Versandaktivität zusammen. Die Beträge verstehen sich brutto vor etwaigen verhandelten Rückvergütungen, die gesondert im vereinbarten Rhythmus abgerechnet werden.",
    legalLine2:
      "Unstimmigkeiten müssen innerhalb des in Ihrer Servicevereinbarung genannten Reklamationsfensters gemeldet werden; außerhalb dieses Fensters können wir nicht erneut abrechnen.",
  },
  logisticsReceipt: {
    subject: "HenryCo Logistics Versandbeleg",
    documentType: "Versandbeleg",
    metaBooked: "Gebucht",
    metaScheduled: "Geplant",
    metaStatus: "Status",
    divisionLabel: "Logistics",
    amountPaid: "Bezahlter Betrag",
    columnLineItem: "Position",
    columnAmount: "Betrag",
    sectionCustomer: "Kunde",
    rowName: "Name",
    rowEmail: "E-Mail",
    rowPhone: "Telefon",
    rowTrackingCode: "Sendungscode",
    sectionPickup: "Abholung",
    sectionDropoff: "Zustellung",
    sectionParcelService: "Paket + Service",
    rowService: "Service",
    rowUrgency: "Dringlichkeit",
    rowParcel: "Paket",
    rowDescription: "Beschreibung",
    rowWeight: "Gewicht",
    weightUnit: (kg: number) => `${kg} kg`,
    rowSizeTier: "Größenstufe",
    rowCorridor: "Korridor",
    sectionPricing: "Preisaufschlüsselung",
    emptyPricing: "Keine aufgeschlüsselten Preise erfasst.",
    sectionSettlement: "Abrechnung",
    rowQuoted: "Angeboten",
    rowPaid: "Bezahlt",
    rowMethod: "Methode",
    rowReference: "Referenz",
    rowStatus: "Status",
    sectionProof: "Zustellnachweis",
    rowRecipient: "Empfänger",
    rowDelivered: "Zugestellt",
    rowType: "Typ",
    rowNote: "Hinweis",
    legalLine1:
      "HenryCo Logistics ist der eingetragene Betreiber dieser Sendung. Versicherung, Reklamationsfristen und Haftung für verlorene Pakete unterliegen der Servicevereinbarung von HenryCo Logistics.",
    legalLine2:
      "Falls eine Abweichung zwischen diesem Beleg und dem aktuellen Sendungsdatensatz besteht, wenden Sie sich innerhalb von 7 Tagen an den Logistik-Support für den schnellsten Lösungsweg.",
  },
  propertyManaged: {
    subject: "HenryCo Property Abrechnung für verwaltete Immobilie",
    documentType: "Abrechnung verwaltete Immobilie",
    divisionLabel: "Property · Verwaltet",
    netPayable: "Netto zahlbar an Eigentümer",
    metaPeriod: "Zeitraum",
    metaStarts: "Beginn",
    metaEnds: "Ende",
    columnPeriod: "Zeitraum",
    columnWindow: "Fenster",
    columnStatus: "Status",
    columnCollected: "Eingezogen",
    columnAmount: "Betrag",
    columnTicket: "Ticket",
    columnCategory: "Kategorie",
    columnSeverity: "Schweregrad",
    columnResolved: "Gelöst",
    sectionOwner: "Eigentümer",
    rowName: "Name",
    rowLegalName: "Firmenname",
    rowEmail: "E-Mail",
    rowPhone: "Telefon",
    sectionListing: "Inserat",
    rowTitle: "Titel",
    rowAddress: "Adresse",
    rowManagedSince: "Verwaltet seit",
    sectionPeriodSummary: "Zeitraumübersicht",
    rowGrossRent: "Eingezogene Bruttomiete",
    rowMaintenanceSpend: "Instandhaltungsaufwand",
    rowManagementFee: "Verwaltungsgebühr",
    rowNetPayable: "Netto zahlbar an Eigentümer",
    sectionRentLedger: "Mietbuch",
    emptyRent: "Keine Mietaktivität in diesem Zeitraum.",
    sectionMaintenance: "Instandhaltung",
    emptyMaintenance: "Keine Instandhaltungsaktivität in diesem Zeitraum.",
    legalLine1:
      "Diese Abrechnung spiegelt die im Zeitraum eingezogenen Mieten und die auf das obige verwaltete Inserat angewandten Betriebskosten wider. Die Beträge verstehen sich brutto vor Quellensteuer; HenryCo überweist den Netto-Durchlauf im in Ihrem Verwaltungsinstrument vereinbarten Rhythmus.",
    legalLine2:
      "Jede Abweichung muss schriftlich innerhalb des in Ihrem Verwaltungsinstrument genannten Reklamationsfensters gemeldet werden; HenryCo kann außerhalb dieses Fensters nicht erneut abrechnen oder einziehen.",
  },
  receipt: {
    subject: "Zahlungsbeleg",
    documentType: "Beleg",
    subtitle: (paidAt: string, method: string) => `Bezahlt am ${paidAt} · ${method}`,
    metaPaid: "Bezahlt",
    metaMethod: "Methode",
    metaReference: "Referenz",
    totalPaid: "Gesamt bezahlt",
    columnItem: "Position",
    columnQty: "Menge",
    columnAmount: "Betrag",
    sectionCustomer: "Kunde",
    rowName: "Name",
    rowEmail: "E-Mail",
    rowDelivery: "Lieferung",
    sectionWhatPaid: "Zahlungsdetails",
    emptyItems: "Keine Positionen erfasst.",
    sectionSettlement: "Abrechnung",
    rowSubtotal: "Zwischensumme",
    rowFees: "Gebühren",
    rowTax: "Steuer",
    rowTotal: "Gesamt",
    rowStatus: "Status",
    sectionNotes: "Hinweise",
    legalLine1:
      "Dieser Beleg bestätigt eine von HenryCo im Namen des ursprünglichen Geschäftsbereichs erfasste Zahlung. Die Steuerposition spiegelt den am obigen Zahlungsdatum geltenden Satz wider.",
    legalLine2:
      "Falls Sie eine Abweichung feststellen, wenden Sie sich innerhalb von 7 Tagen an den HenryCo-Support für den schnellsten Lösungsweg.",
  },
  studioInvoice: {
    subject: (invoiceNumber: string) => `Rechnung ${invoiceNumber}`,
    documentType: "Rechnung",
    metaIssued: "Ausgestellt",
    metaDue: "Fällig",
    metaDueOnReceipt: "Bei Erhalt",
    metaStatus: "Status",
    divisionLabel: "Studio",
    partyFrom: "Von",
    partyBillTo: "Rechnung an",
    rcPrefix: "HR-Nr.:",
    vatPrefix: "USt-IdNr.:",
    sectionProject: "Projekt",
    rowProject: "Projekt",
    rowPaymentPlan: "Zahlungsplan",
    rowNextMilestone: "Nächster Meilenstein",
    columnDescription: "Beschreibung",
    columnMilestone: "Meilenstein",
    columnAmount: "Betrag",
    sectionLineItems: "Rechnungsposten",
    emptyLineItems: "Keine strukturierten Rechnungsposten erfasst.",
    paymentStatus: "Zahlungsstatus",
    paymentMethod: "Zahlungsmethode",
    paymentReference: "Zahlungsreferenz",
    paidAt: "Bezahlt am",
    subtotal: "Zwischensumme",
    discount: "Rabatt",
    tax: "Steuer",
    total: "Gesamt",
    settledAs: (amount: string) => `Beglichen als ${amount}`,
    fxAt: (rate: string, paidCurrency: string, invoiceCurrency: string) =>
      ` zu ${rate} ${paidCurrency}/${invoiceCurrency}`,
    legalLine1:
      "Ausgestellt im Rahmen der Abrechnung von HenryCo Studio. Die Mehrwährungsabwicklung wird zum Gateway-Kurs am Zahlungstag erfasst; sowohl Rechnungswährung als auch abgewickelte Währung werden zu Prüfzwecken festgehalten.",
    legalLine2:
      "Streitigkeiten müssen innerhalb von sieben Kalendertagen nach Ausstellung geltend gemacht werden. Verspätete Zahlung kann gemäß der Auftragsvereinbarung einen Erinnerungsplan auslösen.",
  },
  studioProposal: {
    documentType: "Angebot",
    metaIssued: "Ausgestellt",
    metaValidUntil: "Gültig bis",
    metaStatus: "Status",
    divisionLabel: "Studio",
    partyFrom: "Von",
    partyPreparedFor: "Erstellt für",
    rcPrefix: "HR-Nr.:",
    columnMilestone: "Meilenstein",
    columnDue: "Fällig",
    columnAmount: "Betrag",
    sectionEngagement: "Auftragsübersicht",
    rowService: "Service",
    rowPackage: "Paket",
    rowTeam: "Team",
    rowTimeline: "Zeitplan",
    sectionScope: "Umfang",
    scopeFallback: "Umfang im begleitenden Briefing detailliert.",
    sectionDeliverables: "Leistungen",
    sectionMilestones: "Meilensteine",
    emptyMilestones: "Keine Meilensteine erfasst.",
    rowDepositDue: "Anzahlung zum Start fällig",
    rowCurrency: "Währung",
    rowValidUntil: "Gültig bis",
    totalInvestment: "Investition",
    totalDeposit: "Anzahlung",
    totalBalance: "Restbetrag",
    signed: "Unterzeichnet",
    signedAt: "Unterzeichnet am",
    signedBy: "Unterzeichnet von",
    signedEmail: "E-Mail",
    signedProvider: "Anbieter",
    signedIp: "IP-Adresse",
    signedLocale: "Sprache",
    legalLine1:
      "Dieses Angebot unterliegt den Auftragsbedingungen von HenryCo Studio. Die Annahme wird elektronisch mit Zeitstempel, IP-Adresse, User-Agent und Sprache zur Prüfwiedergabe erfasst.",
    legalLine2:
      "Die obigen Investitions- und Anzahlungsbeträge verstehen sich ohne gesetzliche Steuer, sofern nicht ausdrücklich anders angegeben. Die Währung wird zum Gateway-Kurs am Abwicklungstag umgerechnet.",
  },
  vendorPayout: {
    subject: "HenryCo Marketplace Auszahlungsabrechnung für Verkäufer",
    documentType: "Auszahlungsabrechnung",
    subtitleOrders: (count: number) => `${count} Bestellung${count === 1 ? "" : "en"}`,
    metaPeriod: "Zeitraum",
    metaSettlement: "Abwicklung",
    metaReference: "Referenz",
    divisionLabel: "Marketplace · Verkäuferauszahlung",
    netPayout: "Nettoauszahlung",
    columnOrder: "Bestellung",
    columnFulfilled: "Erfüllt",
    columnBuyer: "Käufer",
    columnStatus: "Status",
    columnGross: "Brutto",
    columnCommission: "Provision",
    columnFee: "Gebühr",
    columnRefunds: "Erstattungen",
    columnNet: "Netto",
    sectionVendor: "Verkäufer",
    rowStore: "Shop",
    rowSlug: "Kennung",
    rowLegalName: "Firmenname",
    rowTaxId: "Steuernummer",
    rowPayoutMethod: "Auszahlungsmethode",
    rowDestination: "Ziel",
    rowSettlementCurrency: "Abwicklungswährung",
    onFile: "Hinterlegt",
    sectionPeriodSummary: "Zeitraumübersicht",
    rowOrdersSettled: "Abgewickelte Bestellungen",
    rowGrossRevenue: "Bruttoumsatz",
    rowPlatformCommission: "Plattformprovision",
    rowProcessingFees: "Bearbeitungsgebühren",
    rowRefundsChargebacks: "Erstattungen + Rückbuchungen",
    rowNetPayout: "Nettoauszahlung",
    rowScheduledFor: "Geplant für",
    awaitingCycle: "Warten auf Zyklus",
    rowGenerated: "Erstellt",
    sectionItemised: "Aufgeschlüsselte Bestellungen",
    emptyOrders: "Keine Bestellungen in diesem Zeitraum abgewickelt.",
    footerNet: "Netto für den gewählten Zeitraum",
    legalLine1:
      "Diese Abrechnung spiegelt Bestellungen wider, die im obigen Zeitraum das Auto-Freigabefenster durchlaufen haben. Nach dem Stichtag eröffnete Erstattungen oder Streitfälle erscheinen auf der nächsten Abrechnung.",
    legalLine2:
      "Die Steuerposition liegt in der Verantwortung des Verkäufers; HenryCo behält nur die in Ihrer Verkäufervereinbarung offengelegte Provision und Bearbeitungsgebühren ein.",
    legalLine3:
      "Unstimmigkeiten müssen innerhalb von 14 Tagen über den Streitkanal des Verkäufer-Workspace gemeldet werden; außerhalb dieses Fensters können wir keine Auszahlungen erneut ausstellen.",
  },
};

const IT: DeepPartial<BrandedDocumentsCopy> = {
  footer: {
    defaultLegal: "Henry & Co. — ogni attività sotto un unico nome di fiducia.",
  },
  signature: {
    authorisedSignatory: "Firmatario autorizzato",
    signedPrefix: "Firmato",
  },
  invoice: {
    documentType: "Fattura",
    metaIssued: "Emessa",
    metaDue: "Scadenza",
    metaDueOnReceipt: "Alla ricezione",
    metaStatus: "Stato",
    divisionGroup: "Gruppo",
    partyFrom: "Da",
    partyBillTo: "Fatturare a",
    rcPrefix: "RC:",
    vatPrefix: "P. IVA:",
    columnItem: "Voce",
    columnQty: "Qtà",
    columnUnit: "Unità",
    columnAmount: "Importo",
    sectionLineItems: "Righe della fattura",
    emptyLineItems: "Nessuna riga di fattura strutturata registrata.",
    paymentStatus: "Stato del pagamento",
    paymentMethod: "Metodo di pagamento",
    paymentReference: "Riferimento di pagamento",
    paidAt: "Pagata il",
    subtotal: "Subtotale",
    discount: "Sconto",
    tax: "Imposta",
    total: "Totale",
    legalLine1:
      "Questa fattura è emessa nell'ambito della fatturazione unificata di HenryCo. La divisione di origine resta la fonte di riferimento per i termini di consegna, contestazione e rimborso.",
    legalLine2:
      "I pagamenti sono riconosciuti una volta che il gateway di origine conferma il regolamento; lo stato sopra riflette l'ultima istantanea di riconciliazione.",
  },
  kyc: {
    documentType: "Riepilogo della verifica dell'identità",
    subject: "Riepilogo della verifica dell'identità",
    metaSubmitted: "Inviato",
    metaReviewed: "Esaminato",
    divisionLabel: "Fiducia e conformità",
    statusPrefix: "Stato",
    columnDocument: "Documento",
    columnStatus: "Stato",
    columnSubmitted: "Inviato",
    columnReviewed: "Esaminato",
    columnReviewerNote: "Nota del revisore",
    privacyKicker: "Posizione sulla privacy",
    privacyBody:
      "Questo riepilogo registra ciò che è stato inviato e come il team fiducia di HenryCo lo ha esaminato. I documenti di identità sottostanti non sono mai incorporati in questo PDF — solo i metadati che vedi di seguito.",
    accountHolder: "Titolare dell'account",
    rowName: "Nome",
    rowEmail: "E-mail",
    rowAccountId: "ID account",
    rowOverallStatus: "Stato complessivo",
    sectionSubmissions: "Invii",
    emptySubmissions: "Nessun invio KYC in archivio.",
    sectionReviewerNote: "Nota del revisore",
    legalLine1:
      "HenryCo conserva i documenti di identità solo per il tempo richiesto dalla legge nigeriana e dagli obblighi KYC applicabili. Questo riepilogo è la tua copia di audit trail e non include le immagini dei documenti stessi.",
    legalLine2:
      "Se devi aggiornare un documento d'identità, fallo dalla tua pagina di verifica dell'account HenryCo; il record originale passerà allo stato storico e una nuova voce lo sostituirà in questa vista.",
  },
  learn: {
    author: "Henry & Co. — HenryCo Learn",
    subject: (courseTitle: string) => `Certificato di completamento per ${courseTitle}`,
    keywords: "certificato, henryco learn",
    learnLabel: "HenryCo Learn",
    certificateOfCompletion: "Certificato di completamento",
    preamble: "Si certifica che",
    body: "ha soddisfatto tutti i requisiti di apprendimento, valutazione e integrità stabiliti per",
    issuingOfficer: "Funzionario emittente",
    certificateNumber: "Numero del certificato",
    issued: "Emesso",
    score: "Punteggio",
    verifyCredential: "Verifica questa credenziale",
    codePrefix: "Codice",
    footerLeft: "HENRY & CO. · Certificato accademico HenryCo Learn",
    footerRight: "I certificati autentici si risolvono all'URL sopra indicato",
    defaultIssuerName: "Adaeze Henry-Mbachu",
    defaultIssuerTitle: "Direttrice, HenryCo Learn",
    defaultIssuerAccreditation: "Emesso secondo gli standard accademici di HenryCo Learn",
  },
  logisticsB2b: {
    subject: "Estratto conto B2B di HenryCo Logistics",
    documentType: "Estratto conto B2B",
    subtitleShipments: (count: number) => `${count} spedizioni`,
    metaPeriod: "Periodo",
    metaStarts: "Inizio",
    metaEnds: "Fine",
    divisionLabel: "Logistics · B2B",
    grossSpend: "Spesa lorda",
    columnTracking: "Tracciamento",
    columnRecipient: "Destinatario",
    columnService: "Servizio",
    columnStatus: "Stato",
    columnAmount: "Importo",
    sectionAccount: "Account",
    rowName: "Nome",
    rowLegalName: "Ragione sociale",
    rowBillingTerms: "Condizioni di fatturazione",
    rowBillingEmail: "E-mail di fatturazione",
    sectionPeriodSummary: "Riepilogo del periodo",
    rowShipments: "Spedizioni",
    rowDelivered: "Consegnate",
    rowOnTime: "Puntuali",
    rowGrossSpend: "Spesa lorda",
    sectionItemised: "Spedizioni dettagliate",
    emptyShipments: "Nessuna spedizione in questo periodo.",
    legalLine1:
      "Questo estratto conto riepiloga l'attività di spedizione prenotata tramite il tuo account B2B HenryCo durante il periodo sopra. Gli importi sono al lordo di eventuali sconti negoziati, regolati separatamente secondo la cadenza concordata.",
    legalLine2:
      "Le discrepanze devono essere sollevate entro la finestra di contestazione indicata nel tuo contratto di servizio; non possiamo rifatturare al di fuori di tale finestra.",
  },
  logisticsReceipt: {
    subject: "Ricevuta di spedizione di HenryCo Logistics",
    documentType: "Ricevuta di spedizione",
    metaBooked: "Prenotata",
    metaScheduled: "Programmata",
    metaStatus: "Stato",
    divisionLabel: "Logistics",
    amountPaid: "Importo pagato",
    columnLineItem: "Voce",
    columnAmount: "Importo",
    sectionCustomer: "Cliente",
    rowName: "Nome",
    rowEmail: "E-mail",
    rowPhone: "Telefono",
    rowTrackingCode: "Codice di tracciamento",
    sectionPickup: "Ritiro",
    sectionDropoff: "Consegna",
    sectionParcelService: "Pacco + servizio",
    rowService: "Servizio",
    rowUrgency: "Urgenza",
    rowParcel: "Pacco",
    rowDescription: "Descrizione",
    rowWeight: "Peso",
    weightUnit: (kg: number) => `${kg} kg`,
    rowSizeTier: "Fascia di dimensione",
    rowCorridor: "Corridoio",
    sectionPricing: "Dettaglio dei prezzi",
    emptyPricing: "Nessun prezzo dettagliato registrato.",
    sectionSettlement: "Regolamento",
    rowQuoted: "Preventivato",
    rowPaid: "Pagato",
    rowMethod: "Metodo",
    rowReference: "Riferimento",
    rowStatus: "Stato",
    sectionProof: "Prova di consegna",
    rowRecipient: "Destinatario",
    rowDelivered: "Consegnato",
    rowType: "Tipo",
    rowNote: "Nota",
    legalLine1:
      "HenryCo Logistics è l'operatore registrato di questa spedizione. Assicurazione, finestre di reclamo e responsabilità per pacchi smarriti sono regolate dal contratto di servizio di HenryCo Logistics.",
    legalLine2:
      "Se esiste una discrepanza tra questa ricevuta e il record di spedizione in tempo reale, contatta il supporto logistico entro 7 giorni per il percorso di risoluzione più rapido.",
  },
  propertyManaged: {
    subject: "Estratto conto immobile gestito di HenryCo Property",
    documentType: "Estratto conto immobile gestito",
    divisionLabel: "Property · Gestito",
    netPayable: "Netto dovuto al proprietario",
    metaPeriod: "Periodo",
    metaStarts: "Inizio",
    metaEnds: "Fine",
    columnPeriod: "Periodo",
    columnWindow: "Finestra",
    columnStatus: "Stato",
    columnCollected: "Incassato",
    columnAmount: "Importo",
    columnTicket: "Ticket",
    columnCategory: "Categoria",
    columnSeverity: "Gravità",
    columnResolved: "Risolto",
    sectionOwner: "Proprietario",
    rowName: "Nome",
    rowLegalName: "Ragione sociale",
    rowEmail: "E-mail",
    rowPhone: "Telefono",
    sectionListing: "Annuncio",
    rowTitle: "Titolo",
    rowAddress: "Indirizzo",
    rowManagedSince: "Gestito dal",
    sectionPeriodSummary: "Riepilogo del periodo",
    rowGrossRent: "Affitto lordo incassato",
    rowMaintenanceSpend: "Spesa di manutenzione",
    rowManagementFee: "Commissione di gestione",
    rowNetPayable: "Netto dovuto al proprietario",
    sectionRentLedger: "Registro affitti",
    emptyRent: "Nessuna attività di affitto in questo periodo.",
    sectionMaintenance: "Manutenzione",
    emptyMaintenance: "Nessuna attività di manutenzione in questo periodo.",
    legalLine1:
      "Questo estratto conto riflette gli affitti incassati e le spese operative applicate all'annuncio gestito sopra durante il periodo. Gli importi sono al lordo della ritenuta d'acconto; HenryCo rimette il netto secondo la cadenza concordata nel tuo strumento di gestione.",
    legalLine2:
      "Qualsiasi discrepanza deve essere sollevata per iscritto entro la finestra di contestazione indicata nel tuo strumento di gestione; HenryCo non può rifatturare o riscuotere al di fuori di tale finestra.",
  },
  receipt: {
    subject: "Ricevuta di pagamento",
    documentType: "Ricevuta",
    subtitle: (paidAt: string, method: string) => `Pagato il ${paidAt} · ${method}`,
    metaPaid: "Pagato",
    metaMethod: "Metodo",
    metaReference: "Riferimento",
    totalPaid: "Totale pagato",
    columnItem: "Voce",
    columnQty: "Qtà",
    columnAmount: "Importo",
    sectionCustomer: "Cliente",
    rowName: "Nome",
    rowEmail: "E-mail",
    rowDelivery: "Consegna",
    sectionWhatPaid: "Dettaglio del pagamento",
    emptyItems: "Nessuna voce registrata.",
    sectionSettlement: "Regolamento",
    rowSubtotal: "Subtotale",
    rowFees: "Commissioni",
    rowTax: "Imposta",
    rowTotal: "Totale",
    rowStatus: "Stato",
    sectionNotes: "Note",
    legalLine1:
      "Questa ricevuta attesta un pagamento acquisito da HenryCo per conto della divisione di origine. La posizione fiscale riflette l'aliquota in vigore alla data di pagamento sopra.",
    legalLine2:
      "Se noti una discrepanza, contatta il supporto HenryCo entro 7 giorni per il percorso di risoluzione più rapido.",
  },
  studioInvoice: {
    subject: (invoiceNumber: string) => `Fattura ${invoiceNumber}`,
    documentType: "Fattura",
    metaIssued: "Emessa",
    metaDue: "Scadenza",
    metaDueOnReceipt: "Alla ricezione",
    metaStatus: "Stato",
    divisionLabel: "Studio",
    partyFrom: "Da",
    partyBillTo: "Fatturare a",
    rcPrefix: "RC:",
    vatPrefix: "P. IVA:",
    sectionProject: "Progetto",
    rowProject: "Progetto",
    rowPaymentPlan: "Piano di pagamento",
    rowNextMilestone: "Prossima tappa",
    columnDescription: "Descrizione",
    columnMilestone: "Tappa",
    columnAmount: "Importo",
    sectionLineItems: "Righe della fattura",
    emptyLineItems: "Nessuna riga di fattura strutturata registrata.",
    paymentStatus: "Stato del pagamento",
    paymentMethod: "Metodo di pagamento",
    paymentReference: "Riferimento di pagamento",
    paidAt: "Pagata il",
    subtotal: "Subtotale",
    discount: "Sconto",
    tax: "Imposta",
    total: "Totale",
    settledAs: (amount: string) => `Regolato come ${amount}`,
    fxAt: (rate: string, paidCurrency: string, invoiceCurrency: string) =>
      ` al tasso di ${rate} ${paidCurrency}/${invoiceCurrency}`,
    legalLine1:
      "Emessa nell'ambito della fatturazione di HenryCo Studio. Il regolamento multivaluta è acquisito al tasso del gateway nel giorno del pagamento; sia la valuta della fattura sia la valuta regolata sono registrate a fini di audit.",
    legalLine2:
      "Le contestazioni devono essere sollevate entro sette giorni di calendario dall'emissione. Il pagamento tardivo può comportare un calendario di solleciti secondo l'accordo di incarico.",
  },
  studioProposal: {
    documentType: "Proposta",
    metaIssued: "Emessa",
    metaValidUntil: "Valida fino al",
    metaStatus: "Stato",
    divisionLabel: "Studio",
    partyFrom: "Da",
    partyPreparedFor: "Preparata per",
    rcPrefix: "RC:",
    columnMilestone: "Tappa",
    columnDue: "Scadenza",
    columnAmount: "Importo",
    sectionEngagement: "Panoramica dell'incarico",
    rowService: "Servizio",
    rowPackage: "Pacchetto",
    rowTeam: "Team",
    rowTimeline: "Tempistica",
    sectionScope: "Ambito",
    scopeFallback: "Ambito dettagliato nel brief di accompagnamento.",
    sectionDeliverables: "Deliverable",
    sectionMilestones: "Tappe",
    emptyMilestones: "Nessuna tappa registrata.",
    rowDepositDue: "Acconto richiesto per iniziare",
    rowCurrency: "Valuta",
    rowValidUntil: "Valida fino al",
    totalInvestment: "Investimento",
    totalDeposit: "Acconto",
    totalBalance: "Saldo",
    signed: "Firmata",
    signedAt: "Firmata il",
    signedBy: "Firmata da",
    signedEmail: "E-mail",
    signedProvider: "Fornitore",
    signedIp: "Indirizzo IP",
    signedLocale: "Lingua",
    legalLine1:
      "Questa proposta è regolata dai termini di incarico di HenryCo Studio. L'accettazione è registrata elettronicamente con marca temporale, indirizzo IP, user agent e lingua acquisiti per la riproduzione di audit.",
    legalLine2:
      "Le cifre di investimento e acconto sopra sono al netto dell'imposta di legge salvo diversa indicazione esplicita. La valuta è convertita al tasso del gateway nel giorno del regolamento.",
  },
  vendorPayout: {
    subject: "Estratto conto pagamento venditore di HenryCo Marketplace",
    documentType: "Estratto conto pagamento",
    subtitleOrders: (count: number) => `${count} ordine${count === 1 ? "" : "i"}`,
    metaPeriod: "Periodo",
    metaSettlement: "Regolamento",
    metaReference: "Riferimento",
    divisionLabel: "Marketplace · Pagamento venditore",
    netPayout: "Pagamento netto",
    columnOrder: "Ordine",
    columnFulfilled: "Evaso",
    columnBuyer: "Acquirente",
    columnStatus: "Stato",
    columnGross: "Lordo",
    columnCommission: "Commissione",
    columnFee: "Tariffa",
    columnRefunds: "Rimborsi",
    columnNet: "Netto",
    sectionVendor: "Venditore",
    rowStore: "Negozio",
    rowSlug: "Identificatore",
    rowLegalName: "Ragione sociale",
    rowTaxId: "Codice fiscale",
    rowPayoutMethod: "Metodo di pagamento",
    rowDestination: "Destinazione",
    rowSettlementCurrency: "Valuta di regolamento",
    onFile: "In archivio",
    sectionPeriodSummary: "Riepilogo del periodo",
    rowOrdersSettled: "Ordini regolati",
    rowGrossRevenue: "Ricavo lordo",
    rowPlatformCommission: "Commissione della piattaforma",
    rowProcessingFees: "Commissioni di elaborazione",
    rowRefundsChargebacks: "Rimborsi + storni",
    rowNetPayout: "Pagamento netto",
    rowScheduledFor: "Programmato per",
    awaitingCycle: "In attesa del ciclo",
    rowGenerated: "Generato",
    sectionItemised: "Ordini dettagliati",
    emptyOrders: "Nessun ordine regolato in questo periodo.",
    footerNet: "Netto per il periodo selezionato",
    legalLine1:
      "Questo estratto conto riflette gli ordini che hanno superato la finestra di rilascio automatico durante il periodo sopra. Rimborsi o contestazioni aperti dopo la scadenza compaiono nell'estratto conto successivo.",
    legalLine2:
      "La posizione fiscale è responsabilità del venditore; HenryCo trattiene solo la commissione e le commissioni di elaborazione indicate nel tuo contratto di venditore.",
    legalLine3:
      "Le discrepanze devono essere sollevate entro 14 giorni tramite il canale di contestazione dello spazio di lavoro del venditore; non possiamo riemettere pagamenti al di fuori di tale finestra.",
  },
};

const ZH: DeepPartial<BrandedDocumentsCopy> = {
  footer: {
    defaultLegal: "Henry & Co. — 每一项业务都汇聚于一个值得信赖的名号之下。",
  },
  signature: {
    authorisedSignatory: "授权签署人",
    signedPrefix: "签署于",
  },
  invoice: {
    documentType: "发票",
    metaIssued: "开具日期",
    metaDue: "到期日",
    metaDueOnReceipt: "收到即付",
    metaStatus: "状态",
    divisionGroup: "集团",
    partyFrom: "开票方",
    partyBillTo: "收票方",
    rcPrefix: "注册号：",
    vatPrefix: "增值税号：",
    columnItem: "项目",
    columnQty: "数量",
    columnUnit: "单价",
    columnAmount: "金额",
    sectionLineItems: "明细项目",
    emptyLineItems: "未记录结构化明细项目。",
    paymentStatus: "付款状态",
    paymentMethod: "付款方式",
    paymentReference: "付款参考号",
    paidAt: "付款时间",
    subtotal: "小计",
    discount: "折扣",
    tax: "税费",
    total: "合计",
    legalLine1:
      "本发票依据 HenryCo 统一结算开具。发起业务部门仍为交付、争议及退款条款的权威依据来源。",
    legalLine2:
      "一旦发起网关确认结算，款项即被确认；上述状态反映最新的对账快照。",
  },
  kyc: {
    documentType: "身份验证摘要",
    subject: "身份验证摘要",
    metaSubmitted: "提交时间",
    metaReviewed: "审核时间",
    divisionLabel: "信任与合规",
    statusPrefix: "状态",
    columnDocument: "文件",
    columnStatus: "状态",
    columnSubmitted: "已提交",
    columnReviewed: "已审核",
    columnReviewerNote: "审核员备注",
    privacyKicker: "隐私态度",
    privacyBody:
      "本摘要记录了所提交的内容以及 HenryCo 信任团队的审核方式。底层身份证件绝不会嵌入此 PDF 中——仅包含下方所示的元数据。",
    accountHolder: "账户持有人",
    rowName: "姓名",
    rowEmail: "电子邮箱",
    rowAccountId: "账户 ID",
    rowOverallStatus: "总体状态",
    sectionSubmissions: "提交记录",
    emptySubmissions: "档案中无 KYC 提交记录。",
    sectionReviewerNote: "审核员备注",
    legalLine1:
      "HenryCo 仅在尼日利亚法律和适用 KYC 义务所要求的期限内保留身份证件。本摘要是您的审计追踪副本，不包含证件图像本身。",
    legalLine2:
      "如需更新身份证件，请在您的 HenryCo 账户验证页面进行操作；原始记录随后将转为历史状态，并由新条目在此视图中替换。",
  },
  learn: {
    author: "Henry & Co. — HenryCo Learn",
    subject: (courseTitle: string) => `${courseTitle} 的结业证书`,
    keywords: "证书，henryco learn",
    learnLabel: "HenryCo Learn",
    certificateOfCompletion: "结业证书",
    preamble: "兹证明",
    body: "已满足为以下课程设定的所有学习、评估与诚信要求：",
    issuingOfficer: "签发人员",
    certificateNumber: "证书编号",
    issued: "签发日期",
    score: "成绩",
    verifyCredential: "验证此证书",
    codePrefix: "代码",
    footerLeft: "HENRY & CO. · HenryCo Learn 学术证书",
    footerRight: "正版证书可在上述网址解析",
    defaultIssuerName: "Adaeze Henry-Mbachu",
    defaultIssuerTitle: "总监，HenryCo Learn",
    defaultIssuerAccreditation: "依据 HenryCo Learn 学术标准签发",
  },
  logisticsB2b: {
    subject: "HenryCo Logistics B2B 对账单",
    documentType: "B2B 对账单",
    subtitleShipments: (count: number) => `${count} 票货件`,
    metaPeriod: "周期",
    metaStarts: "开始",
    metaEnds: "结束",
    divisionLabel: "Logistics · B2B",
    grossSpend: "总支出",
    columnTracking: "追踪",
    columnRecipient: "收件人",
    columnService: "服务",
    columnStatus: "状态",
    columnAmount: "金额",
    sectionAccount: "账户",
    rowName: "名称",
    rowLegalName: "法定名称",
    rowBillingTerms: "结算条款",
    rowBillingEmail: "账单邮箱",
    sectionPeriodSummary: "周期摘要",
    rowShipments: "货件",
    rowDelivered: "已送达",
    rowOnTime: "准时率",
    rowGrossSpend: "总支出",
    sectionItemised: "货件明细",
    emptyShipments: "本周期内无货件。",
    legalLine1:
      "本对账单汇总了上述周期内通过您的 HenryCo B2B 账户预订的货运活动。金额为协商返利前的总额，返利按约定节奏单独结算。",
    legalLine2:
      "差异须在您服务协议规定的争议期内提出；逾期我们将无法重新开账。",
  },
  logisticsReceipt: {
    subject: "HenryCo Logistics 货件收据",
    documentType: "货件收据",
    metaBooked: "预订时间",
    metaScheduled: "计划时间",
    metaStatus: "状态",
    divisionLabel: "Logistics",
    amountPaid: "已付金额",
    columnLineItem: "明细",
    columnAmount: "金额",
    sectionCustomer: "客户",
    rowName: "姓名",
    rowEmail: "电子邮箱",
    rowPhone: "电话",
    rowTrackingCode: "追踪码",
    sectionPickup: "取件",
    sectionDropoff: "送达",
    sectionParcelService: "包裹 + 服务",
    rowService: "服务",
    rowUrgency: "紧急程度",
    rowParcel: "包裹",
    rowDescription: "描述",
    rowWeight: "重量",
    weightUnit: (kg: number) => `${kg} 公斤`,
    rowSizeTier: "尺寸等级",
    rowCorridor: "线路",
    sectionPricing: "价格明细",
    emptyPricing: "未记录明细价格。",
    sectionSettlement: "结算",
    rowQuoted: "报价",
    rowPaid: "已付",
    rowMethod: "方式",
    rowReference: "参考号",
    rowStatus: "状态",
    sectionProof: "送达凭证",
    rowRecipient: "收件人",
    rowDelivered: "已送达",
    rowType: "类型",
    rowNote: "备注",
    legalLine1:
      "HenryCo Logistics 是本货件的登记承运方。保险、索赔期限及丢件责任均受 HenryCo Logistics 服务协议约束。",
    legalLine2:
      "如本收据与实时货件记录存在差异，请在 7 天内联系物流支持以获取最快的解决途径。",
  },
  propertyManaged: {
    subject: "HenryCo Property 托管物业对账单",
    documentType: "托管物业对账单",
    divisionLabel: "Property · 托管",
    netPayable: "应付业主净额",
    metaPeriod: "周期",
    metaStarts: "开始",
    metaEnds: "结束",
    columnPeriod: "周期",
    columnWindow: "时段",
    columnStatus: "状态",
    columnCollected: "已收",
    columnAmount: "金额",
    columnTicket: "工单",
    columnCategory: "类别",
    columnSeverity: "严重程度",
    columnResolved: "已解决",
    sectionOwner: "业主",
    rowName: "姓名",
    rowLegalName: "法定名称",
    rowEmail: "电子邮箱",
    rowPhone: "电话",
    sectionListing: "房源",
    rowTitle: "标题",
    rowAddress: "地址",
    rowManagedSince: "托管起始",
    sectionPeriodSummary: "周期摘要",
    rowGrossRent: "已收租金总额",
    rowMaintenanceSpend: "维护支出",
    rowManagementFee: "管理费",
    rowNetPayable: "应付业主净额",
    sectionRentLedger: "租金台账",
    emptyRent: "本周期内无租金活动。",
    sectionMaintenance: "维护",
    emptyMaintenance: "本周期内无维护活动。",
    legalLine1:
      "本对账单反映了上述周期内向托管房源收取的租金及发生的运营支出。金额为预扣税前的总额；HenryCo 按您管理文书中约定的节奏支付净额转付。",
    legalLine2:
      "任何差异须在您管理文书规定的争议期内以书面形式提出；逾期 HenryCo 将无法重新开账或重新收取。",
  },
  receipt: {
    subject: "付款收据",
    documentType: "收据",
    subtitle: (paidAt: string, method: string) => `付款于 ${paidAt} · ${method}`,
    metaPaid: "付款时间",
    metaMethod: "方式",
    metaReference: "参考号",
    totalPaid: "实付总额",
    columnItem: "项目",
    columnQty: "数量",
    columnAmount: "金额",
    sectionCustomer: "客户",
    rowName: "姓名",
    rowEmail: "电子邮箱",
    rowDelivery: "配送",
    sectionWhatPaid: "付款明细",
    emptyItems: "未记录任何项目。",
    sectionSettlement: "结算",
    rowSubtotal: "小计",
    rowFees: "费用",
    rowTax: "税费",
    rowTotal: "合计",
    rowStatus: "状态",
    sectionNotes: "备注",
    legalLine1:
      "本收据证明 HenryCo 代表发起业务部门所收取的款项。税务处理反映上述付款日期当时生效的税率。",
    legalLine2:
      "如发现差异，请在 7 天内联系 HenryCo 支持以获取最快的解决途径。",
  },
  studioInvoice: {
    subject: (invoiceNumber: string) => `发票 ${invoiceNumber}`,
    documentType: "发票",
    metaIssued: "开具日期",
    metaDue: "到期日",
    metaDueOnReceipt: "收到即付",
    metaStatus: "状态",
    divisionLabel: "Studio",
    partyFrom: "开票方",
    partyBillTo: "收票方",
    rcPrefix: "注册号：",
    vatPrefix: "增值税号：",
    sectionProject: "项目",
    rowProject: "项目",
    rowPaymentPlan: "付款计划",
    rowNextMilestone: "下一里程碑",
    columnDescription: "描述",
    columnMilestone: "里程碑",
    columnAmount: "金额",
    sectionLineItems: "明细项目",
    emptyLineItems: "未记录结构化明细项目。",
    paymentStatus: "付款状态",
    paymentMethod: "付款方式",
    paymentReference: "付款参考号",
    paidAt: "付款时间",
    subtotal: "小计",
    discount: "折扣",
    tax: "税费",
    total: "合计",
    settledAs: (amount: string) => `结算为 ${amount}`,
    fxAt: (rate: string, paidCurrency: string, invoiceCurrency: string) =>
      ` 以 ${rate} ${paidCurrency}/${invoiceCurrency} 的汇率`,
    legalLine1:
      "依据 HenryCo Studio 结算开具。多币种结算按付款当日的网关汇率记录；发票币种与结算币种均予以记录以备审计。",
    legalLine2:
      "争议须在开具后七个日历日内提出。逾期付款可能依据合作协议触发催款计划。",
  },
  studioProposal: {
    documentType: "提案",
    metaIssued: "签发日期",
    metaValidUntil: "有效期至",
    metaStatus: "状态",
    divisionLabel: "Studio",
    partyFrom: "提交方",
    partyPreparedFor: "致",
    rcPrefix: "注册号：",
    columnMilestone: "里程碑",
    columnDue: "到期",
    columnAmount: "金额",
    sectionEngagement: "合作概览",
    rowService: "服务",
    rowPackage: "套餐",
    rowTeam: "团队",
    rowTimeline: "时间表",
    sectionScope: "范围",
    scopeFallback: "范围详见配套简报。",
    sectionDeliverables: "交付物",
    sectionMilestones: "里程碑",
    emptyMilestones: "未记录任何里程碑。",
    rowDepositDue: "启动所需定金",
    rowCurrency: "币种",
    rowValidUntil: "有效期至",
    totalInvestment: "投入",
    totalDeposit: "定金",
    totalBalance: "余额",
    signed: "已签署",
    signedAt: "签署时间",
    signedBy: "签署人",
    signedEmail: "电子邮箱",
    signedProvider: "服务商",
    signedIp: "IP 地址",
    signedLocale: "语言",
    legalLine1:
      "本提案受 HenryCo Studio 合作条款约束。接受将以电子方式记录，并捕获时间戳、IP 地址、用户代理及语言以备审计回放。",
    legalLine2:
      "除非另有明确说明，上述投入与定金金额均不含法定税费。币种按结算当日的网关汇率换算。",
  },
  vendorPayout: {
    subject: "HenryCo Marketplace 卖家结算单",
    documentType: "结算单",
    subtitleOrders: (count: number) => `${count} 笔订单`,
    metaPeriod: "周期",
    metaSettlement: "结算",
    metaReference: "参考号",
    divisionLabel: "Marketplace · 卖家结算",
    netPayout: "净结算额",
    columnOrder: "订单",
    columnFulfilled: "已履约",
    columnBuyer: "买家",
    columnStatus: "状态",
    columnGross: "总额",
    columnCommission: "佣金",
    columnFee: "手续费",
    columnRefunds: "退款",
    columnNet: "净额",
    sectionVendor: "卖家",
    rowStore: "店铺",
    rowSlug: "标识",
    rowLegalName: "法定名称",
    rowTaxId: "税号",
    rowPayoutMethod: "结算方式",
    rowDestination: "目的账户",
    rowSettlementCurrency: "结算币种",
    onFile: "已存档",
    sectionPeriodSummary: "周期摘要",
    rowOrdersSettled: "已结算订单",
    rowGrossRevenue: "总收入",
    rowPlatformCommission: "平台佣金",
    rowProcessingFees: "处理费",
    rowRefundsChargebacks: "退款 + 拒付",
    rowNetPayout: "净结算额",
    rowScheduledFor: "计划于",
    awaitingCycle: "等待周期",
    rowGenerated: "生成时间",
    sectionItemised: "订单明细",
    emptyOrders: "本周期内无已结算订单。",
    footerNet: "所选周期净额",
    legalLine1:
      "本结算单反映了上述周期内通过自动放款窗口的订单。截止后开立的退款或争议将在下一期结算单中体现。",
    legalLine2:
      "税务处理由卖家负责；HenryCo 仅扣除您卖家协议中披露的佣金与处理费。",
    legalLine3:
      "差异须在 14 天内通过卖家工作区争议渠道提出；逾期我们将无法重新发放结算款。",
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<BrandedDocumentsCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
};
// ig, yo, ha, hi are intentionally OMITTED -> fall back to EN (human-translation only).

export function getBrandedDocumentsCopy(locale: AppLocale): BrandedDocumentsCopy {
  const o = LOCALE_MAP[locale];
  if (o)
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      o as unknown as Record<string, unknown>,
    ) as unknown as BrandedDocumentsCopy;
  return EN;
}
