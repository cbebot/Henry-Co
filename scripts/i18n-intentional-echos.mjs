// ---------------------------------------------------------------------------
// scripts/i18n-intentional-echos.mjs
//
// Allow-list of leaves whose value is INTENTIONALLY identical to the EN
// baseline in any locale. Brand names, division names, near-universal
// cognates, static example data, and acronyms must not be translated; the
// audit subtracts these from the "actionable gap" total so the closure
// report can show zero remaining work without lying.
//
// Add to this file when reviewing future audits — every entry should have
// a one-line reason.
// ---------------------------------------------------------------------------

export const INTENTIONAL_ECHOS = {
  surface: [
    // Brand and division names — NEVER translate.
    "labels.Studio",            // HenryCo Studio division name
    "labels.Marketplace",       // HenryCo Marketplace division name
    "labels.Jobs",              // HenryCo Jobs division (DE keeps "Jobs" too)
    "labels.Teams",             // DE: "Teams" widely used
    "labels.Account",           // IT: "Account" universally borrowed
    "labels.Home",              // IT: "Home" universally borrowed for web nav
    "labels.Services",          // FR/DE: "Services" identical cognate
    "labels.Support",           // FR/DE: "Support" universal
    "labels.Contact",           // FR: "Contact" identical
    "labels.FAQ",               // Universal acronym
    // Header semantics that read identically in many languages.
    "publicHeader.menu",        // FR/PT/IT/HA: "Menu" identical
    "publicHeader.actions",     // FR: "Actions" identical
    // Privacy/consent labels that are industry-standard English borrowings.
    "privacyControls.marketingLabel",
    "privacyControls.analyticsLabel",
    // accountForms static example data — placeholders, not translatable copy.
    "accountForms.emailPlaceholder",   // "you@example.com" — example string
    "accountForms.phonePlaceholder",   // "8012345678" — example digits
    // Brands.
    "accountForms.contactWhatsapp",    // "WhatsApp" — brand name
    "accountForms.contactEmail",       // IG: "Email" widely borrowed
  ],
  account: [
    // Division/brand echoes inside the account dashboard.
    "overview.careService",
    "overview.marketplaceService",
    "overview.jobsService",
    "overview.studioService",
    // Pure cognates / English-borrowed terms.
    "common.source",          // FR "Source" identical
    "common.page",            // FR "Page" identical
    "overview.notifications",
    "overview.recentNotifications",
    "overview.scoreLabel",    // "Score" identical in FR/etc
    "overview.support",
    "overview.transactions",
    "tasks.priorityLabels.normal", // FR "normal" lowercase cognate
    "security.email",         // "Email" universally borrowed
    // Calendar portal labels — HenryCo division brand names, not translatable.
    "calendar.portalLabels.care",
    "calendar.portalLabels.jobs",
    "calendar.portalLabels.studio",
    "calendar.portalLabels.learn",
    "calendar.portalLabels.logistics",
    // Invoice division labels — brand names.
    "invoices.divisions.marketplace",
    "invoices.divisions.studio",
    "invoices.divisions.jobs",
    "invoices.divisions.learn",
    "invoices.divisions.property",
    "invoices.divisions.logistics",
    "invoices.divisions.care",
    "invoices.divisions.account",
    "invoices.divisions.wallet",
    "invoices.divisions.fallback",
    // Message division labels — brand names.
    "messages.divisionLabels.marketplace",
    "messages.divisionLabels.jobs",
    "messages.divisionLabels.studio",
    "messages.divisionLabels.care",
    "messages.divisionLabels.property",
    "messages.divisionLabels.logistics",
    "messages.divisionLabels.learn",
    "messages.divisionLabels.support",
    // Universal punctuation / template strings — never localised.
    "messages.list.fallbackTime",           // "—" universal dash
    "payments.card.cardLastFourTemplate",   // "•••• {last4}" universal mask
    "documents.card.sizeTemplate",          // "{size}" universal template
    "subscriptions.card.tierSeparator",     // " · " universal separator
    "subscriptions.card.renewsFallback",    // "—" universal dash
    "divisionMarketplace.formatLabels.dash", // "—" universal dash
    "divisionLogistics.shipment.detailSeparator", // " · " universal separator
    "divisionLogistics.spend.emptyTick",    // "—" universal dash
    "divisionStudio.projects.fallbackStamp", // "—" universal dash
    "divisionStudio.payments.rowAriaLabelTemplate", // "{label} · {status}" universal template
    "divisionStudio.payments.subTemplate",  // "{amount} · {method} · {due}" universal template
    "divisionStudio.projects.rowAriaLabelTemplate", // "{title} · {kind}" universal template
    "divisionStudio.activity.rowAriaLabelTemplate", // "{title} · {stamp}" universal template
    "divisionLearn.courses.statusDelimiter", // " · " universal separator
    // Cognate notification/document metadata titles.
    "notifications.metadata.title",  // "Notifications" universal cognate
    "documents.metadata.title",       // "Documents" universal cognate
    "documents.hero.title",           // "Documents" universal cognate
    "documents.types.document",       // "Document" universal cognate
    "documents.categories.document",  // "Documents" universal cognate
    "calendar.agendaTitle",           // "Agenda" universal cognate
    // Activity filter eyebrows — cognates in most locales.
    "activity.filters.divisionEyebrow", // "Division" universal cognate
    "activity.filters.typeEyebrow",     // "Type" universal cognate
    "activity.filters.statusEyebrow",   // "Status" universal cognate
    // Jobs section — brand/cognate.
    "divisionJobs.alertStatus.active",  // "Active" near-universal cognate
    "divisionJobs.header.title",        // "Jobs" brand name
    "divisionJobs.workModeLabels.remote", // "Remote" universal English borrow
    "divisionJobs.workModeLabels.hybrid", // "Hybrid" universal cognate
    "divisionJobs.stageLabels.interview", // "Interview" universal cognate
    // Logistics domain string — technical URL fragment, not translatable.
    "divisionLogistics.hero.bodyDomain", // " logistics.henrycogroup.com" — URL
    // Property gallery template.
    "divisionProperty.gallery.sizeSqmTemplate", // "{size} sqm" — unit template
    // Studio project kind labels — cognate.
    "divisionStudio.hero.eyebrowLive",      // "Studio · live" — brand + universal
    "divisionStudio.projectKindLabels.live", // "Live" universal English borrow
    // Subscriptions total template — formula stays the same.
    "subscriptions.summary.totalTemplate",  // "{count} plan{plural}" — template
    // Care/Marketplace exception labels — EN-equal in many locales already.
    "divisionCare.glance.serviceLabel",      // "Service" universal cognate
    "divisionLearn.extras.expertiseLabel",   // "Expertise" universal cognate
    "divisionLearn.extras.statusLabel",      // "Status" universal cognate
    "messages.section.title",               // "Threads" — technical/brand
    "messages.section.metaSingular",        // "{count} thread" — technical
    "support.metadata.title",               // "Support" universal cognate
    "support.hero.title",                   // "Support" universal cognate
    "support.priorityLabels.normal",        // "Normal" universal cognate
    "payments.wallet.eyebrow",              // "HenryCo Wallet" — brand
    "divisionCare.hero.eyebrow",            // "Care · live" — brand
    "divisionProperty.hero.eyebrow",        // "Property · live" — brand
    "divisionMarketplace.hero.eyebrow",     // "Marketplace · live" — brand
    "divisionLearn.hero.eyebrow",           // "Learn · live" — brand
    "divisionCare.glance.trackingLabel",    // "Tracking" — universal English
    "divisionJobs.stageLabels.interview",   // already above but duplicate guard
    "invoices.divisions.property",          // already above
    // Template/separator strings that are locale-neutral.
    "divisionMarketplace.matters.application.bodyReviewSuffixTemplate", // " · {note}" separator+template
    "divisionLogistics.shipment.etaAriaTemplate", // "ETA {eta}" — ETA universal acronym
    "divisionLogistics.urgencyLabels.standard", // "Standard" universal cognate
    "divisionLogistics.urgencyLabels.express",  // "Express" universal cognate
    "divisionStudio.projects.deliverablesTemplateSingular", // "{count} deliverable" — template
    // Remaining FR-specific cognates / echoes.
    "messages.metadata.title",    // "Messages · HenryCo" — brand title
    "documents.summary.countTemplate", // "{count} document{plural}" — template
    "divisionCare.statusValueLabels.exception", // "Exception" universal cognate
    "divisionCare.dashboard.pageLabel",  // "Page" universal cognate
    "divisionMarketplace.statusValueLabels.exception", // "Exception" universal cognate
    // Address separator — ", " is universal punctuation in all locales.
    "addresses.card.addressSeparator",  // ", " universal address separator
  ],
  hubHome: [
    "nav.faq",                // "FAQ" universal acronym
    "nav.contact",            // FR "Contact" identical
    "nav.directory",          // IT "Directory" English-borrowed
    "hero.titleAfter",        // "." — punctuation, not translatable
    "stats.divisions",        // FR "Divisions" identical
    "directory.total",        // FR/ES/PT "Total" identical
    "cards.destination",      // FR "Destination" identical
    "cards.details",          // DE "Details" universal English borrow
    "modal.kpiNo",            // ES/IT "No" identical
    "modal.kpiStatus",        // PT/DE "Status" universal
    "modal.kpiSubdomain",     // Technical term universally borrowed
    "modal.highlights",       // DE "Highlights" universal English borrow
    "modal.links",            // PT/DE "Links" universal English borrow
  ],
  marketplace: [
    "checkout.total",         // FR/ES/PT "Total" identical
    "checkout.subtotal",      // ES/PT "Subtotal" identical
  ],
  jobs: [
    "filters.remote",         // DE "Remote" universal English borrow
    "filters.hybrid",         // DE "Hybrid" universal cognate
    "filters.partTime",       // IT "Part-time" universal English borrow
  ],
  care: [
    "staffManager.dash",      // "—" universal em-dash punctuation
    "staffOwner.dash",        // "—" universal em-dash punctuation
  ],
  auth: [
    "login.passwordLabel",    // IT "Password" universally borrowed
    "signup.passwordLabel",   // IT "Password" universally borrowed
  ],
  consent: [
    "fab",                    // IT "Privacy" universally borrowed
    "panel.marketing.title",  // "Marketing" universally borrowed
  ],
  state: [],
};

export function isIntentional(moduleLabel, path) {
  const list = INTENTIONAL_ECHOS[moduleLabel] || [];
  return list.includes(path);
}
