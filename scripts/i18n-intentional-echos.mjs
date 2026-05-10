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
