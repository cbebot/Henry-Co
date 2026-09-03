import type { AppLocale } from "./locales";
import { deepMergeMessages } from "./merge-messages";

/**
 * V3 PASS 21 — Studio division copy.
 *
 * Studio-specific surface strings. Foundation locale is English; non-English
 * locales fall through to English at the static layer and PASS 18B runtime
 * auto-translation picks up the dynamic translations (cached against the
 * i18n_translation_cache table). FR + ES + AR are seeded statically because
 * they cover the bulk of operator + client traffic; remaining locales
 * inherit from English (and runtime translation will fill them).
 */

export type StudioCopy = {
  nav: {
    home: string;
    services: string;
    work: string;
    pick: string;
    request: string;
    contact: string;
    client: string;
  };
  hero: {
    title: string;
    subtitle: string;
    ctaPick: string;
    ctaBrief: string;
  };
  brief: {
    title: string;
    autosaveActive: string;
    autosaveSaved: string;
    autosaveError: string;
    autosaveResume: string;
    continue: string;
    submit: string;
    confirmationHeading: string;
    confirmationBody: string;
  };
  proposal: {
    documentTitle: string;
    statusDraft: string;
    statusSent: string;
    statusAccepted: string;
    statusDeclined: string;
    statusExpired: string;
    acceptHeading: string;
    acceptBody: string;
    acceptCta: string;
    declineCta: string;
    signedLabel: string;
    signedByLabel: string;
    signatureProviderLabel: string;
    signatureProviderSignWell: string;
    signatureProviderTypedName: string;
    typedNameLabel: string;
    typedNameHelp: string;
    typedNamePlaceholder: string;
    acknowledgementLabel: string;
    downloadSigned: string;
    expiryReminderSent: string;
  };
  revisions: {
    title: string;
    requestHeading: string;
    requestBody: string;
    versionLabel: string;
    statusOpen: string;
    statusReview: string;
    statusApproved: string;
    statusRejected: string;
    summaryLabel: string;
    summaryPlaceholder: string;
    attachLabel: string;
    submitCta: string;
    approveCta: string;
    rejectCta: string;
    reviewerNotesLabel: string;
    versionCompareTitle: string;
    versionCompareBefore: string;
    versionCompareAfter: string;
    emptyTitle: string;
    emptyBody: string;
  };
  milestones: {
    title: string;
    addCta: string;
    nameLabel: string;
    dueLabel: string;
    amountLabel: string;
    ownerLabel: string;
    statusPlanned: string;
    statusActive: string;
    statusReview: string;
    statusCompleted: string;
    markCompleted: string;
    reminderDue: string;
    reminderCount: string;
  };
  paymentPlans: {
    title: string;
    activatedAt: string;
    totalLabel: string;
    nextReleaseLabel: string;
    statusDraft: string;
    statusActive: string;
    statusCompleted: string;
    statusCancelled: string;
    releaseLabel: string;
    releaseAmount: string;
    releaseMilestone: string;
    releaseFired: string;
    releasePending: string;
  };
  assetPacks: {
    title: string;
    generateCta: string;
    statusPending: string;
    statusGenerating: string;
    statusReady: string;
    statusFailed: string;
    statusExpired: string;
    downloadCta: string;
    expiresIn: string;
    expiredOn: string;
    includeBrandGuidelines: string;
    fileCount: string;
    emptyTitle: string;
    emptyBody: string;
  };
  pm: {
    overviewTitle: string;
    onTimeLabel: string;
    blockersLabel: string;
    deliverablesLabel: string;
    ganttTitle: string;
    ganttTabletNote: string;
    resourceAllocationTitle: string;
    resourceWeekColumn: string;
    resourceMemberColumn: string;
    resourceTotalRow: string;
    revisionQueueTitle: string;
  };
  sales: {
    kanbanTitle: string;
    stageLead: string;
    stageQualified: string;
    stageProposal: string;
    stageNegotiation: string;
    stageWon: string;
    stageLost: string;
    pipelineValueLabel: string;
    conversionLabel: string;
    activeProposalsLabel: string;
    hotLeadsLabel: string;
  };
  notifications: {
    proposalSignedTitle: string;
    proposalSignedBody: string;
    revisionRequestedTitle: string;
    revisionRequestedBody: string;
    revisionApprovedTitle: string;
    revisionApprovedBody: string;
    milestoneDueTitle: string;
    milestoneDueBody: string;
    invoiceReminder3Title: string;
    invoiceReminder7Title: string;
    invoiceReminder14Title: string;
    proposalExpiryTitle: string;
    weeklyDigestTitle: string;
  };
  errors: {
    proposalExpired: string;
    proposalAlreadySigned: string;
    proposalSignFailed: string;
    revisionInvalidProject: string;
    revisionSubmitFailed: string;
    milestoneInvalidProject: string;
    milestoneSubmitFailed: string;
    assetPackInvalidProject: string;
    assetPackGenerationFailed: string;
    unauthorized: string;
  };
};

const EN: StudioCopy = {
  nav: {
    home: "Home",
    services: "Services",
    work: "Work",
    pick: "Pick a template",
    request: "Tell us about your project",
    contact: "Contact",
    client: "Client portal",
  },
  hero: {
    title: "Studio work, delivered with calm certainty.",
    subtitle: "Branding, identity, digital, and editorial — shaped by a senior team, billed with transparency, and tracked in one place.",
    ctaPick: "Pick a template",
    ctaBrief: "Tell us about your project",
  },
  brief: {
    title: "Tell us about your project",
    autosaveActive: "Auto-saving",
    autosaveSaved: "Draft saved",
    autosaveError: "Could not save draft. Your work is still in this browser.",
    autosaveResume: "Resuming your saved draft.",
    continue: "Continue",
    submit: "Send brief",
    confirmationHeading: "Brief received",
    confirmationBody: "A proposal lead will reach you within one business day. Track progress in your client portal.",
  },
  proposal: {
    documentTitle: "Proposal",
    statusDraft: "Draft",
    statusSent: "Sent",
    statusAccepted: "Accepted",
    statusDeclined: "Declined",
    statusExpired: "Expired",
    acceptHeading: "Accept this proposal",
    acceptBody: "When you accept, we record your acceptance as a binding electronic signature, along with the time and basic session details, so both sides have a clear, verifiable record of the agreement.",
    acceptCta: "Accept and sign",
    declineCta: "Decline",
    signedLabel: "Signed",
    signedByLabel: "Signed by",
    signatureProviderLabel: "Provider",
    signatureProviderSignWell: "Secure e-signature",
    signatureProviderTypedName: "Typed name",
    typedNameLabel: "Type your full name to sign",
    typedNameHelp: "Used as your electronic signature on the engagement record.",
    typedNamePlaceholder: "Full legal name",
    acknowledgementLabel: "I have read and agree to the proposal scope, investment, deposit, and timeline.",
    downloadSigned: "Download signed PDF",
    expiryReminderSent: "Expiry reminder sent.",
  },
  revisions: {
    title: "Revisions",
    requestHeading: "Request a revision",
    requestBody: "Tell us what to change. Attach any files you want us to reference.",
    versionLabel: "Version",
    statusOpen: "Open",
    statusReview: "In review",
    statusApproved: "Approved",
    statusRejected: "Rejected",
    summaryLabel: "What should change?",
    summaryPlaceholder: "Slide 3 bullet two needs a softer tone.",
    attachLabel: "Attach files",
    submitCta: "Send revision request",
    approveCta: "Approve",
    rejectCta: "Reject with notes",
    reviewerNotesLabel: "PM notes",
    versionCompareTitle: "Compare versions",
    versionCompareBefore: "Before",
    versionCompareAfter: "After",
    emptyTitle: "No revisions yet",
    emptyBody: "Once a deliverable is shared you can request changes here.",
  },
  milestones: {
    title: "Milestones",
    addCta: "Add milestone",
    nameLabel: "Name",
    dueLabel: "Due",
    amountLabel: "Amount",
    ownerLabel: "Owner",
    statusPlanned: "Planned",
    statusActive: "Active",
    statusReview: "Review",
    statusCompleted: "Completed",
    markCompleted: "Mark completed",
    reminderDue: "Reminder due",
    reminderCount: "Reminders sent",
  },
  paymentPlans: {
    title: "Payment plan",
    activatedAt: "Activated",
    totalLabel: "Plan total",
    nextReleaseLabel: "Next release",
    statusDraft: "Draft",
    statusActive: "Active",
    statusCompleted: "Completed",
    statusCancelled: "Cancelled",
    releaseLabel: "Release",
    releaseAmount: "Amount",
    releaseMilestone: "Tied milestone",
    releaseFired: "Released",
    releasePending: "Pending",
  },
  assetPacks: {
    title: "Asset pack",
    generateCta: "Generate asset pack",
    statusPending: "Queued",
    statusGenerating: "Generating",
    statusReady: "Ready",
    statusFailed: "Failed",
    statusExpired: "Expired",
    downloadCta: "Download zip",
    expiresIn: "Expires in",
    expiredOn: "Expired on",
    includeBrandGuidelines: "Include brand guidelines",
    fileCount: "files",
    emptyTitle: "No asset pack yet",
    emptyBody: "Generate a branded zip once the project's deliverables are signed off.",
  },
  pm: {
    overviewTitle: "Project management",
    onTimeLabel: "On-time",
    blockersLabel: "Blockers",
    deliverablesLabel: "This week",
    ganttTitle: "Timeline",
    ganttTabletNote: "Open on tablet or desktop for the full Gantt view.",
    resourceAllocationTitle: "Resource allocation",
    resourceWeekColumn: "Week",
    resourceMemberColumn: "Team member",
    resourceTotalRow: "Total",
    revisionQueueTitle: "Revision queue",
  },
  sales: {
    kanbanTitle: "Pipeline",
    stageLead: "Lead",
    stageQualified: "Qualified",
    stageProposal: "Proposal",
    stageNegotiation: "Negotiation",
    stageWon: "Closed-won",
    stageLost: "Closed-lost",
    pipelineValueLabel: "Pipeline value",
    conversionLabel: "Conversion",
    activeProposalsLabel: "Active proposals",
    hotLeadsLabel: "Hot leads",
  },
  notifications: {
    proposalSignedTitle: "Proposal signed",
    proposalSignedBody: "Your client signed the proposal. The project is ready to kick off.",
    revisionRequestedTitle: "Revision requested",
    revisionRequestedBody: "Your revision request has been logged and is now being reviewed by the team.",
    revisionApprovedTitle: "Revision approved",
    revisionApprovedBody: "Your revision request has been approved.",
    milestoneDueTitle: "Milestone due",
    milestoneDueBody: "A milestone is due in the next 48 hours.",
    invoiceReminder3Title: "Invoice reminder (3 days)",
    invoiceReminder7Title: "Invoice reminder (7 days)",
    invoiceReminder14Title: "Invoice reminder (14 days)",
    proposalExpiryTitle: "Proposal expires soon",
    weeklyDigestTitle: "Studio weekly digest",
  },
  errors: {
    proposalExpired: "This proposal has expired. Ask your studio contact for an updated version.",
    proposalAlreadySigned: "This proposal has already been signed.",
    proposalSignFailed: "We could not record your signature. Please try again.",
    revisionInvalidProject: "Project not found or you do not have access.",
    revisionSubmitFailed: "We could not submit your revision. Please try again.",
    milestoneInvalidProject: "Project not found or you do not have access.",
    milestoneSubmitFailed: "We could not update the milestone. Please try again.",
    assetPackInvalidProject: "Project not found or you do not have access.",
    assetPackGenerationFailed: "Asset pack generation failed. Studio support has been notified.",
    unauthorized: "Sign in to continue.",
  },
};

const FR: Partial<StudioCopy> = {
  nav: {
    home: "Accueil",
    services: "Services",
    work: "Travaux",
    pick: "Choisir un modèle",
    request: "Parlez-nous de votre projet",
    contact: "Contact",
    client: "Portail client",
  },
  hero: {
    title: "Le travail de studio, livré avec une sérénité maîtrisée.",
    subtitle: "Identité, marque, digital et éditorial — façonnés par une équipe senior, facturés en transparence et suivis au même endroit.",
    ctaPick: "Choisir un modèle",
    ctaBrief: "Parlez-nous de votre projet",
  },
  proposal: {
    documentTitle: "Proposition",
    statusDraft: "Brouillon",
    statusSent: "Envoyée",
    statusAccepted: "Acceptée",
    statusDeclined: "Refusée",
    statusExpired: "Expirée",
    acceptHeading: "Accepter cette proposition",
    acceptBody: "En acceptant, nous enregistrons votre acceptation comme une signature électronique contraignante, avec l'heure et quelques détails de session, afin que les deux parties disposent d'un enregistrement clair et vérifiable de l'accord.",
    acceptCta: "Accepter et signer",
    declineCta: "Refuser",
    signedLabel: "Signée",
    signedByLabel: "Signée par",
    signatureProviderLabel: "Prestataire",
    signatureProviderSignWell: "Signature électronique sécurisée",
    signatureProviderTypedName: "Nom saisi",
    typedNameLabel: "Saisissez votre nom complet pour signer",
    typedNameHelp: "Utilisé comme signature électronique sur le dossier d'engagement.",
    typedNamePlaceholder: "Nom légal complet",
    acknowledgementLabel: "J'ai lu et j'accepte la portée, l'investissement, l'acompte et le calendrier de la proposition.",
    downloadSigned: "Télécharger le PDF signé",
    expiryReminderSent: "Rappel d'expiration envoyé.",
  },
};

const ES: Partial<StudioCopy> = {
  nav: {
    home: "Inicio",
    services: "Servicios",
    work: "Trabajos",
    pick: "Elegir una plantilla",
    request: "Cuéntanos tu proyecto",
    contact: "Contacto",
    client: "Portal del cliente",
  },
  hero: {
    title: "Trabajo de estudio, entregado con calma.",
    subtitle: "Identidad, marca, digital y editorial — moldeados por un equipo senior, facturados con transparencia y rastreados en un solo lugar.",
    ctaPick: "Elegir una plantilla",
    ctaBrief: "Cuéntanos tu proyecto",
  },
};

const AR: Partial<StudioCopy> = {
  nav: {
    home: "الرئيسية",
    services: "الخدمات",
    work: "الأعمال",
    pick: "اختر نموذجاً",
    request: "أخبرنا عن مشروعك",
    contact: "تواصل",
    client: "بوابة العملاء",
  },
  hero: {
    title: "عمل الاستوديو، يُسلَّم بثقة هادئة.",
    subtitle: "هوية وعلامة تجارية وعمل رقمي وتحريري — يصوغها فريق متمرس، وتُفوتر بشفافية، وتُتابع في مكان واحد.",
    ctaPick: "اختر نموذجاً",
    ctaBrief: "أخبرنا عن مشروعك",
  },
};

const LOCALE_OVERRIDES: Partial<Record<AppLocale, Partial<StudioCopy>>> = {
  fr: FR,
  es: ES,
  ar: AR,
};

export function getStudioCopy(locale: AppLocale): StudioCopy {
  const overrides = LOCALE_OVERRIDES[locale];
  if (overrides) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as StudioCopy;
  }
  return EN;
}
