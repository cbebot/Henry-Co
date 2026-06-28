import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * StudioPublicExtraCopy — i18n surface for the hardcoded customer-facing
 * strings across the public Studio marketing pages:
 *   - about/page.tsx        (about)
 *   - pick/page.tsx         (pick)
 *   - pick/[slug]/page.tsx  (pickDetail)
 *   - policies/[slug]/page.tsx (policyDetail)
 *   - pricing/page.tsx      (pricing)
 *   - process/page.tsx      (process)
 *   - teams/page.tsx        (teams)
 *   - trust/page.tsx        (trust)
 *   - work/page.tsx         (work)
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each locale is a
 * DeepPartial that deep-merges over EN so any missing key falls back to EN
 * silently at runtime. ig/yo/ha/hi are intentionally omitted -> fall back to
 * EN (human-translation only).
 *
 * The brand name "HenryCo" is kept verbatim in every locale and never
 * translated. Dynamic catalog/Supabase-row text (package names, summaries,
 * template fields, case-study fields, process steps, trust signals, etc.) is
 * NOT routed here — those flow through the existing cached translation
 * pipeline as noted in the page-level TODO comments.
 */
export type StudioPublicExtraCopy = {
  about: {
    kicker: string;
    title: string;
    intro: string;
    startBriefCta: string;
    viewWorkCta: string;
    proofServicesLabel: string;
    proofPackagesLabel: string;
    proofTeamsLabel: string;
    proofCaseStudiesLabel: string;
    operateKicker: string;
    principleStructuredTitle: string;
    principleStructuredBody: string;
    principlePremiumTitle: string;
    principlePremiumBody: string;
    principleConfidenceTitle: string;
    principleConfidenceBody: string;
    deliveryKicker: string;
    deliveryTitle: string;
    deliveryBody: string;
  };
  pick: {
    kicker: string;
    title: string;
    intro: string;
    customBriefCta: string;
    compareBandsCta: string;
    templatesLabel: string;
    startsFromLabel: string;
    fastestLaunchLabel: string;
    categoriesLabel: string;
    /** Template with `{days}` placeholder. */
    daysValue: string;
    /** Template with `{count}` placeholder. */
    templateCountOne: string;
    /** Template with `{count}` placeholder. */
    templateCountMany: string;
    cardPriceLabel: string;
    cardReadyInLabel: string;
    cardOftenForLabel: string;
    /** Template with `{count}` placeholder. */
    cardMorePages: string;
    cardViewTemplate: string;
    /** Template with `{weeks}` placeholder. */
    cardWeekLaunch: string;
    ctaKicker: string;
    ctaTitle: string;
    ctaBody: string;
    ctaButton: string;
  };
  pickDetail: {
    backToTemplates: string;
    fallbackCategory: string;
    /** Template with `{percent}` placeholder. */
    payDepositStart: string;
    viewLiveDemo: string;
    customiseBriefFirst: string;
    priceLabel: string;
    readyInLabel: string;
    buildWindowLabel: string;
    depositLabel: string;
    /** Template with `{days}` placeholder. */
    readyInDays: string;
    /** Template with `{weeks}` placeholder. */
    buildWindowWeeks: string;
    oftenForLabel: string;
    /** Template with `{days}` placeholder. */
    badgeReadyInDays: string;
    paymentPlanLabel: string;
    depositOnAccept: string;
    balanceAtLaunch: string;
    totalLabel: string;
    paymentNote: string;
    pagesIncludedLabel: string;
    featuresBuiltInLabel: string;
    outcomesLabel: string;
    techStackLabel: string;
    stackNote: string;
    moveForwardKicker: string;
    /** Template with `{days}` placeholder. */
    moveForwardTitle: string;
    moveForwardBody: string;
    payDepositStartShort: string;
    talkToLead: string;
    /** Template with `{category}` placeholder. */
    relatedKicker: string;
    relatedTitle: string;
  };
  policyDetail: {
    backToPolicies: string;
    effectiveFromLabel: string;
    lastReviewedLabel: string;
    governingLawLabel: string;
    continueReadingKicker: string;
    continueReadingTitle: string;
  };
  pricing: {
    kicker: string;
    title: string;
    intro: string;
    availablePackagesLabel: string;
    serviceAreasLabel: string;
    packagesKicker: string;
    fallbackPackageLabel: string;
    /** Template with `{weeks}` placeholder. */
    weeksValue: string;
    depositLabel: string;
    bestForLabel: string;
    startWithPackage: string;
    chooseCustomKicker: string;
    chooseCustomTitle: string;
    customReason1: string;
    customReason2: string;
    customReason3: string;
    customReason4: string;
    moveForwardKicker: string;
    moveForwardTitle: string;
    openBriefBuilder: string;
    viewAllServices: string;
    enterpriseKicker: string;
    enterpriseTitle: string;
    enterpriseBody: string;
    startCustomProject: string;
  };
  process: {
    fallbackPrimaryCta: string;
    kicker: string;
    title: string;
    intro: string;
    processKicker: string;
    /** Template with `{number}` placeholder. */
    stepLabel: string;
  };
  teams: {
    kicker: string;
    title: string;
    intro: string;
    leadershipKicker: string;
    leadershipBody: string;
    podsKicker: string;
    podsBody: string;
    selectTeam: string;
    teamDetail: string;
  };
  trust: {
    highlightControlsTitle: string;
    highlightControlsBody: string;
    highlightVisibilityTitle: string;
    highlightVisibilityBody: string;
    highlightProposalsTitle: string;
    highlightProposalsBody: string;
    highlightQualityTitle: string;
    highlightQualityBody: string;
    kicker: string;
    title: string;
    intro: string;
    principlesKicker: string;
    signalsKicker: string;
    signalsTitle: string;
    confidenceKicker: string;
    confidenceTitle: string;
    whyKicker: string;
  };
  work: {
    kicker: string;
    title: string;
    intro: string;
    caseStudiesLabel: string;
    teamsLabel: string;
    servicesLabel: string;
    viewCaseStudy: string;
  };
};

const EN: StudioPublicExtraCopy = {
  about: {
    kicker: "About HenryCo Studio",
    title: "A software studio built around clarity, delivery, and trust.",
    intro:
      "HenryCo Studio designs and builds websites, commerce experiences, internal tools, and custom platforms for teams that need serious execution without a chaotic build process.",
    startBriefCta: "Start a brief",
    viewWorkCta: "View work",
    proofServicesLabel: "Services",
    proofPackagesLabel: "Packages",
    proofTeamsLabel: "Teams",
    proofCaseStudiesLabel: "Case studies",
    operateKicker: "How we operate",
    principleStructuredTitle: "Structured before creative",
    principleStructuredBody:
      "Every project starts with the brief, success criteria, constraints, and delivery path made visible.",
    principlePremiumTitle: "Premium execution",
    principlePremiumBody:
      "Design, engineering, copy, and launch support move together instead of being treated as separate handoffs.",
    principleConfidenceTitle: "Client-side confidence",
    principleConfidenceBody:
      "Milestones, files, invoices, proof uploads, and project messages stay accountable in the Studio workspace.",
    deliveryKicker: "Delivery record",
    deliveryTitle: "The studio workspace is part of the service, not an afterthought.",
    deliveryBody:
      "Clients can follow project status, exchange messages, review files, and pay invoices from one controlled workspace.",
  },
  pick: {
    kicker: "Ready-made by HenryCo Studio",
    title: "Pick a site. We launch a customised version in days.",
    intro:
      "Every template is a real, production-ready HenryCo Studio site. Real prices. Real timelines. Real scope. We tailor it to your brand and content, then ship.",
    customBriefCta: "Need something custom? Open a free-form brief",
    compareBandsCta: "Compare package bands",
    templatesLabel: "Templates",
    startsFromLabel: "Starts from",
    fastestLaunchLabel: "Fastest launch",
    categoriesLabel: "Categories",
    daysValue: "{days} days",
    templateCountOne: "{count} template",
    templateCountMany: "{count} templates",
    cardPriceLabel: "Price",
    cardReadyInLabel: "Ready in",
    cardOftenForLabel: "Often for",
    cardMorePages: "+ {count} more",
    cardViewTemplate: "View template",
    cardWeekLaunch: "{weeks} wk launch",
    ctaKicker: "None of these fit? Describe what you actually need.",
    ctaTitle:
      "Custom builds use the same milestone discipline — and skip the template entirely.",
    ctaBody:
      "Multi-role portals, bespoke software, deep integrations: we scope against your requirements, not a template you have to fit into. Brief takes about eight minutes and returns indicative pricing.",
    ctaButton: "Describe a fully custom build",
  },
  pickDetail: {
    backToTemplates: "All templates",
    fallbackCategory: "Studio template",
    payDepositStart: "Pay {percent}% deposit & start",
    viewLiveDemo: "View live demo",
    customiseBriefFirst: "Customise the brief first",
    priceLabel: "Price",
    readyInLabel: "Ready in",
    buildWindowLabel: "Build window",
    depositLabel: "Deposit",
    readyInDays: "{days} days",
    buildWindowWeeks: "{weeks} wks",
    oftenForLabel: "Often for:",
    badgeReadyInDays: "{days} days",
    paymentPlanLabel: "Payment plan",
    depositOnAccept: "Deposit on accept",
    balanceAtLaunch: "Balance at launch",
    totalLabel: "Total",
    paymentNote:
      "Bank transfer or card via Paystack / Flutterwave. Branded receipt issued the moment finance confirms.",
    pagesIncludedLabel: "Pages included",
    featuresBuiltInLabel: "Features built in",
    outcomesLabel: "Outcomes you can expect",
    techStackLabel: "Tech stack",
    stackNote:
      "You can pin a different stack on the brief — HenryCo will quote the delta if it changes the build effort, or honour your choice at no cost when it doesn’t.",
    moveForwardKicker: "Move forward",
    moveForwardTitle: "Customise this template and launch in {days} days.",
    moveForwardBody:
      "The brief takes about eight minutes. We confirm scope, send a milestone-priced proposal, and start work the moment your deposit clears.",
    payDepositStartShort: "Pay deposit & start",
    talkToLead: "Talk to a Studio lead",
    relatedKicker: "Other {category} templates",
    relatedTitle: "Compare nearby ready-made paths.",
  },
  policyDetail: {
    backToPolicies: "All policies",
    effectiveFromLabel: "Effective from",
    lastReviewedLabel: "Last reviewed",
    governingLawLabel: "Governing law",
    continueReadingKicker: "Continue reading",
    continueReadingTitle:
      "The other agreements that govern HenryCo Studio engagements.",
  },
  pricing: {
    kicker: "Packages and pricing",
    title: "Clear packages for common projects. Custom scoping for everything else.",
    intro:
      "Transparent bands when the scope is repeatable, a milestone-priced brief when it isn’t. You see the number before the first conversation.",
    availablePackagesLabel: "Available packages",
    serviceAreasLabel: "Service areas",
    packagesKicker: "Packages",
    fallbackPackageLabel: "Studio package",
    weeksValue: "{weeks} weeks",
    depositLabel: "Deposit",
    bestForLabel: "Best for",
    startWithPackage: "Start with this package",
    chooseCustomKicker: "Choose custom instead when",
    chooseCustomTitle:
      "Larger or deeper builds skip the package and go straight to the brief.",
    customReason1:
      "You need a multi-role portal, client workspace, dashboard, or workflow-specific software system.",
    customReason2:
      "The project combines web, admin, payments, operations, and automation into one platform.",
    customReason3:
      "The product needs mobile, integrations, or a more deliberate architecture path than a package allows.",
    customReason4:
      "You want HenryCo to scope the exact experience rather than retrofit your needs into a predefined template.",
    moveForwardKicker: "Move forward",
    moveForwardTitle: "Pick a package that fits, or send us the exact brief.",
    openBriefBuilder: "Open the brief builder",
    viewAllServices: "View all services",
    enterpriseKicker: "Enterprise or non-standard scope",
    enterpriseTitle:
      "Larger, more sensitive, or deeply integrated builds are scoped as a custom program.",
    enterpriseBody:
      "Enterprise platforms, large rebuilds, and complex integrations are priced and scoped against the exact requirements — not a template.",
    startCustomProject: "Start a custom project",
  },
  process: {
    fallbackPrimaryCta: "Start a Studio project",
    kicker: "Process",
    title: "From brief to launch, nothing stays hidden.",
    intro:
      "Scope, pricing, milestones, payments, and delivery progress stay visible in one structured record from the first brief to final handoff.",
    processKicker: "Studio process",
    stepLabel: "Step {number}",
  },
  teams: {
    kicker: "Teams",
    title: "The people accountable for your build.",
    intro:
      "HenryCo Studio runs four delivery pods — each tuned to a kind of work — backed by a named leadership group that owns scope, quality, and the launch date.",
    leadershipKicker: "Studio leadership",
    leadershipBody:
      "Every project has a named lead from this group. You’ll know who signs off on scope, who answers when something slips, and who is on the hook for launch.",
    podsKicker: "Delivery pods",
    podsBody:
      "Pick the pod that fits your project, or send the brief and let Studio route you to the right match.",
    selectTeam: "Select this team",
    teamDetail: "Team detail",
  },
  trust: {
    highlightControlsTitle: "Protected controls",
    highlightControlsBody:
      "Sensitive actions stay behind secure access controls.",
    highlightVisibilityTitle: "Milestone visibility",
    highlightVisibilityBody:
      "Payments and delivery checkpoints stay visible to the client.",
    highlightProposalsTitle: "Structured proposals",
    highlightProposalsBody:
      "Every enquiry becomes a formal proposal with clear scope, pricing, and timelines.",
    highlightQualityTitle: "Premium quality",
    highlightQualityBody:
      "Every surface is designed to feel considered, modern, and worthy of your investment.",
    kicker: "Trust & transparency",
    title: "Confidence at every stage. In writing, in the workspace, in the bank.",
    intro:
      "Scope clarity, milestone visibility, secure file handling, payment checkpoints, and accountable communication — structured so you always know what is happening and what comes next.",
    principlesKicker: "Four operating principles",
    signalsKicker: "Trust signals",
    signalsTitle: "What stays visible from brief to bank.",
    confidenceKicker: "Client confidence",
    confidenceTitle: "What clients actually say.",
    whyKicker: "Why clients choose HenryCo",
  },
  work: {
    kicker: "Selected work",
    title: "The work before the conversation.",
    intro:
      "Each case study covers the business challenge, the approach, and the measurable impact. No vague summaries — proof you can verify before you commit.",
    caseStudiesLabel: "Case studies",
    teamsLabel: "Teams",
    servicesLabel: "Services",
    viewCaseStudy: "View case study",
  },
};

const FR: DeepPartial<StudioPublicExtraCopy> = {
  about: {
    kicker: "À propos de HenryCo Studio",
    title: "Un studio logiciel bâti sur la clarté, la livraison et la confiance.",
    intro:
      "HenryCo Studio conçoit et développe des sites web, des expériences de commerce, des outils internes et des plateformes sur mesure pour les équipes qui exigent une exécution sérieuse, sans processus de production chaotique.",
    startBriefCta: "Démarrer un brief",
    viewWorkCta: "Voir nos réalisations",
    proofServicesLabel: "Services",
    proofPackagesLabel: "Forfaits",
    proofTeamsLabel: "Équipes",
    proofCaseStudiesLabel: "Études de cas",
    operateKicker: "Notre façon de travailler",
    principleStructuredTitle: "Structuré avant d’être créatif",
    principleStructuredBody:
      "Chaque projet commence par un brief, des critères de réussite, des contraintes et un parcours de livraison rendus visibles.",
    principlePremiumTitle: "Exécution haut de gamme",
    principlePremiumBody:
      "Design, ingénierie, rédaction et accompagnement au lancement avancent ensemble plutôt que d’être traités comme des transferts distincts.",
    principleConfidenceTitle: "Confiance côté client",
    principleConfidenceBody:
      "Les jalons, les fichiers, les factures, les justificatifs et les messages de projet restent traçables dans l’espace de travail Studio.",
    deliveryKicker: "Bilan de livraison",
    deliveryTitle: "L’espace de travail du studio fait partie du service, pas un détail.",
    deliveryBody:
      "Les clients peuvent suivre l’avancement du projet, échanger des messages, examiner les fichiers et régler les factures depuis un seul espace de travail contrôlé.",
  },
  pick: {
    kicker: "Prêt à l’emploi par HenryCo Studio",
    title: "Choisissez un site. Nous lançons une version personnalisée en quelques jours.",
    intro:
      "Chaque modèle est un véritable site HenryCo Studio prêt pour la production. Vrais prix. Vrais délais. Vraie portée. Nous l’adaptons à votre marque et à votre contenu, puis nous le mettons en ligne.",
    customBriefCta: "Besoin de sur-mesure ? Ouvrez un brief libre",
    compareBandsCta: "Comparer les gammes de forfaits",
    templatesLabel: "Modèles",
    startsFromLabel: "À partir de",
    fastestLaunchLabel: "Lancement le plus rapide",
    categoriesLabel: "Catégories",
    daysValue: "{days} jours",
    templateCountOne: "{count} modèle",
    templateCountMany: "{count} modèles",
    cardPriceLabel: "Prix",
    cardReadyInLabel: "Prêt en",
    cardOftenForLabel: "Souvent pour",
    cardMorePages: "+ {count} de plus",
    cardViewTemplate: "Voir le modèle",
    cardWeekLaunch: "Lancement en {weeks} sem.",
    ctaKicker: "Aucun ne convient ? Décrivez ce dont vous avez réellement besoin.",
    ctaTitle:
      "Les projets sur mesure appliquent la même discipline de jalons — et se passent entièrement du modèle.",
    ctaBody:
      "Portails multi-rôles, logiciels sur mesure, intégrations poussées : nous cadrons selon vos besoins, pas un modèle dans lequel vous devez vous insérer. Le brief prend environ huit minutes et renvoie une estimation de prix.",
    ctaButton: "Décrire un projet entièrement sur mesure",
  },
  pickDetail: {
    backToTemplates: "Tous les modèles",
    fallbackCategory: "Modèle Studio",
    payDepositStart: "Payer {percent}% d’acompte et démarrer",
    viewLiveDemo: "Voir la démo en ligne",
    customiseBriefFirst: "Personnaliser le brief d’abord",
    priceLabel: "Prix",
    readyInLabel: "Prêt en",
    buildWindowLabel: "Fenêtre de réalisation",
    depositLabel: "Acompte",
    readyInDays: "{days} jours",
    buildWindowWeeks: "{weeks} sem.",
    oftenForLabel: "Souvent pour :",
    badgeReadyInDays: "{days} jours",
    paymentPlanLabel: "Plan de paiement",
    depositOnAccept: "Acompte à l’acceptation",
    balanceAtLaunch: "Solde au lancement",
    totalLabel: "Total",
    paymentNote:
      "Virement bancaire ou carte via Paystack / Flutterwave. Reçu personnalisé émis dès que la finance confirme.",
    pagesIncludedLabel: "Pages incluses",
    featuresBuiltInLabel: "Fonctionnalités intégrées",
    outcomesLabel: "Résultats attendus",
    techStackLabel: "Stack technique",
    stackNote:
      "Vous pouvez fixer une autre stack dans le brief — HenryCo chiffrera l’écart s’il modifie l’effort de réalisation, ou respectera votre choix sans frais s’il ne le modifie pas.",
    moveForwardKicker: "Avancer",
    moveForwardTitle: "Personnalisez ce modèle et lancez en {days} jours.",
    moveForwardBody:
      "Le brief prend environ huit minutes. Nous confirmons la portée, envoyons une proposition avec jalons chiffrés et commençons le travail dès que votre acompte est encaissé.",
    payDepositStartShort: "Payer l’acompte et démarrer",
    talkToLead: "Parler à un responsable Studio",
    relatedKicker: "Autres modèles {category}",
    relatedTitle: "Comparez les parcours prêts à l’emploi proches.",
  },
  policyDetail: {
    backToPolicies: "Toutes les politiques",
    effectiveFromLabel: "En vigueur depuis",
    lastReviewedLabel: "Dernière révision",
    governingLawLabel: "Droit applicable",
    continueReadingKicker: "Poursuivre la lecture",
    continueReadingTitle:
      "Les autres accords qui régissent les engagements de HenryCo Studio.",
  },
  pricing: {
    kicker: "Forfaits et tarifs",
    title: "Des forfaits clairs pour les projets courants. Un cadrage sur mesure pour tout le reste.",
    intro:
      "Des gammes transparentes quand la portée est reproductible, un brief chiffré par jalons quand elle ne l’est pas. Vous voyez le montant avant la première conversation.",
    availablePackagesLabel: "Forfaits disponibles",
    serviceAreasLabel: "Domaines de service",
    packagesKicker: "Forfaits",
    fallbackPackageLabel: "Forfait Studio",
    weeksValue: "{weeks} semaines",
    depositLabel: "Acompte",
    bestForLabel: "Idéal pour",
    startWithPackage: "Commencer avec ce forfait",
    chooseCustomKicker: "Choisissez le sur-mesure plutôt quand",
    chooseCustomTitle:
      "Les projets plus vastes ou plus profonds sautent le forfait et passent directement au brief.",
    customReason1:
      "Vous avez besoin d’un portail multi-rôles, d’un espace client, d’un tableau de bord ou d’un système logiciel propre à un flux de travail.",
    customReason2:
      "Le projet combine web, administration, paiements, opérations et automatisation en une seule plateforme.",
    customReason3:
      "Le produit nécessite du mobile, des intégrations ou un parcours d’architecture plus réfléchi qu’un forfait ne le permet.",
    customReason4:
      "Vous voulez que HenryCo cadre l’expérience exacte plutôt que d’adapter vos besoins à un modèle prédéfini.",
    moveForwardKicker: "Avancer",
    moveForwardTitle: "Choisissez un forfait adapté, ou envoyez-nous le brief précis.",
    openBriefBuilder: "Ouvrir le générateur de brief",
    viewAllServices: "Voir tous les services",
    enterpriseKicker: "Portée entreprise ou non standard",
    enterpriseTitle:
      "Les projets plus grands, plus sensibles ou profondément intégrés sont cadrés comme un programme sur mesure.",
    enterpriseBody:
      "Les plateformes d’entreprise, les grandes refontes et les intégrations complexes sont tarifées et cadrées selon les exigences exactes — pas un modèle.",
    startCustomProject: "Démarrer un projet sur mesure",
  },
  process: {
    fallbackPrimaryCta: "Démarrer un projet Studio",
    kicker: "Processus",
    title: "Du brief au lancement, rien ne reste caché.",
    intro:
      "La portée, les tarifs, les jalons, les paiements et l’avancement de la livraison restent visibles dans un seul dossier structuré, du premier brief à la remise finale.",
    processKicker: "Processus Studio",
    stepLabel: "Étape {number}",
  },
  teams: {
    kicker: "Équipes",
    title: "Les personnes responsables de votre projet.",
    intro:
      "HenryCo Studio compte quatre pods de livraison — chacun ajusté à un type de travail — appuyés par un groupe de direction nommé qui assume la portée, la qualité et la date de lancement.",
    leadershipKicker: "Direction du Studio",
    leadershipBody:
      "Chaque projet a un responsable nommé issu de ce groupe. Vous saurez qui valide la portée, qui répond quand quelque chose dérape et qui est responsable du lancement.",
    podsKicker: "Pods de livraison",
    podsBody:
      "Choisissez le pod adapté à votre projet, ou envoyez le brief et laissez le Studio vous orienter vers le bon interlocuteur.",
    selectTeam: "Choisir cette équipe",
    teamDetail: "Détail de l’équipe",
  },
  trust: {
    highlightControlsTitle: "Contrôles protégés",
    highlightControlsBody:
      "Les actions sensibles restent protégées par des contrôles d’accès sécurisés.",
    highlightVisibilityTitle: "Visibilité des jalons",
    highlightVisibilityBody:
      "Les paiements et les points de contrôle de livraison restent visibles pour le client.",
    highlightProposalsTitle: "Propositions structurées",
    highlightProposalsBody:
      "Chaque demande devient une proposition formelle avec une portée, des tarifs et des délais clairs.",
    highlightQualityTitle: "Qualité haut de gamme",
    highlightQualityBody:
      "Chaque surface est conçue pour paraître réfléchie, moderne et digne de votre investissement.",
    kicker: "Confiance et transparence",
    title: "De la confiance à chaque étape. Par écrit, dans l’espace de travail, à la banque.",
    intro:
      "Clarté de la portée, visibilité des jalons, gestion sécurisée des fichiers, points de contrôle de paiement et communication responsable — structurés pour que vous sachiez toujours ce qui se passe et ce qui vient ensuite.",
    principlesKicker: "Quatre principes d’exploitation",
    signalsKicker: "Signaux de confiance",
    signalsTitle: "Ce qui reste visible, du brief à la banque.",
    confidenceKicker: "Confiance du client",
    confidenceTitle: "Ce que les clients disent vraiment.",
    whyKicker: "Pourquoi les clients choisissent HenryCo",
  },
  work: {
    kicker: "Travaux sélectionnés",
    title: "Le travail avant la conversation.",
    intro:
      "Chaque étude de cas couvre l’enjeu commercial, l’approche et l’impact mesurable. Pas de résumés vagues — des preuves que vous pouvez vérifier avant de vous engager.",
    caseStudiesLabel: "Études de cas",
    teamsLabel: "Équipes",
    servicesLabel: "Services",
    viewCaseStudy: "Voir l’étude de cas",
  },
};

const ES: DeepPartial<StudioPublicExtraCopy> = {
  about: {
    kicker: "Acerca de HenryCo Studio",
    title: "Un estudio de software construido en torno a la claridad, la entrega y la confianza.",
    intro:
      "HenryCo Studio diseña y desarrolla sitios web, experiencias de comercio, herramientas internas y plataformas a medida para equipos que necesitan una ejecución seria sin un proceso de desarrollo caótico.",
    startBriefCta: "Iniciar un brief",
    viewWorkCta: "Ver trabajos",
    proofServicesLabel: "Servicios",
    proofPackagesLabel: "Paquetes",
    proofTeamsLabel: "Equipos",
    proofCaseStudiesLabel: "Casos de estudio",
    operateKicker: "Cómo trabajamos",
    principleStructuredTitle: "Estructurado antes que creativo",
    principleStructuredBody:
      "Cada proyecto empieza con el brief, los criterios de éxito, las restricciones y la ruta de entrega hechos visibles.",
    principlePremiumTitle: "Ejecución premium",
    principlePremiumBody:
      "Diseño, ingeniería, redacción y soporte de lanzamiento avanzan juntos en lugar de tratarse como entregas separadas.",
    principleConfidenceTitle: "Confianza del lado del cliente",
    principleConfidenceBody:
      "Los hitos, archivos, facturas, comprobantes y mensajes del proyecto permanecen trazables en el espacio de trabajo del Studio.",
    deliveryKicker: "Historial de entrega",
    deliveryTitle: "El espacio de trabajo del estudio es parte del servicio, no un añadido.",
    deliveryBody:
      "Los clientes pueden seguir el estado del proyecto, intercambiar mensajes, revisar archivos y pagar facturas desde un único espacio de trabajo controlado.",
  },
  pick: {
    kicker: "Listo para usar por HenryCo Studio",
    title: "Elige un sitio. Lanzamos una versión personalizada en días.",
    intro:
      "Cada plantilla es un sitio real de HenryCo Studio listo para producción. Precios reales. Plazos reales. Alcance real. Lo adaptamos a tu marca y contenido, y lo publicamos.",
    customBriefCta: "¿Necesitas algo a medida? Abre un brief libre",
    compareBandsCta: "Comparar gamas de paquetes",
    templatesLabel: "Plantillas",
    startsFromLabel: "Desde",
    fastestLaunchLabel: "Lanzamiento más rápido",
    categoriesLabel: "Categorías",
    daysValue: "{days} días",
    templateCountOne: "{count} plantilla",
    templateCountMany: "{count} plantillas",
    cardPriceLabel: "Precio",
    cardReadyInLabel: "Listo en",
    cardOftenForLabel: "A menudo para",
    cardMorePages: "+ {count} más",
    cardViewTemplate: "Ver plantilla",
    cardWeekLaunch: "Lanzamiento en {weeks} sem.",
    ctaKicker: "¿Ninguna encaja? Describe lo que realmente necesitas.",
    ctaTitle:
      "Los desarrollos a medida usan la misma disciplina de hitos — y prescinden por completo de la plantilla.",
    ctaBody:
      "Portales multirrol, software a medida, integraciones profundas: definimos el alcance según tus requisitos, no según una plantilla a la que debas adaptarte. El brief lleva unos ocho minutos y devuelve un precio orientativo.",
    ctaButton: "Describir un desarrollo totalmente a medida",
  },
  pickDetail: {
    backToTemplates: "Todas las plantillas",
    fallbackCategory: "Plantilla Studio",
    payDepositStart: "Pagar {percent}% de depósito y empezar",
    viewLiveDemo: "Ver demo en vivo",
    customiseBriefFirst: "Personalizar el brief primero",
    priceLabel: "Precio",
    readyInLabel: "Listo en",
    buildWindowLabel: "Ventana de desarrollo",
    depositLabel: "Depósito",
    readyInDays: "{days} días",
    buildWindowWeeks: "{weeks} sem.",
    oftenForLabel: "A menudo para:",
    badgeReadyInDays: "{days} días",
    paymentPlanLabel: "Plan de pago",
    depositOnAccept: "Depósito al aceptar",
    balanceAtLaunch: "Saldo al lanzamiento",
    totalLabel: "Total",
    paymentNote:
      "Transferencia bancaria o tarjeta vía Paystack / Flutterwave. Recibo con marca emitido en cuanto finanzas confirma.",
    pagesIncludedLabel: "Páginas incluidas",
    featuresBuiltInLabel: "Funciones integradas",
    outcomesLabel: "Resultados que puedes esperar",
    techStackLabel: "Stack tecnológico",
    stackNote:
      "Puedes fijar un stack distinto en el brief — HenryCo cotizará la diferencia si cambia el esfuerzo de desarrollo, o respetará tu elección sin coste cuando no lo cambie.",
    moveForwardKicker: "Avanzar",
    moveForwardTitle: "Personaliza esta plantilla y lánzala en {days} días.",
    moveForwardBody:
      "El brief lleva unos ocho minutos. Confirmamos el alcance, enviamos una propuesta con precios por hitos y empezamos a trabajar en cuanto se confirma tu depósito.",
    payDepositStartShort: "Pagar depósito y empezar",
    talkToLead: "Hablar con un responsable de Studio",
    relatedKicker: "Otras plantillas de {category}",
    relatedTitle: "Compara rutas listas para usar cercanas.",
  },
  policyDetail: {
    backToPolicies: "Todas las políticas",
    effectiveFromLabel: "Vigente desde",
    lastReviewedLabel: "Última revisión",
    governingLawLabel: "Ley aplicable",
    continueReadingKicker: "Continuar leyendo",
    continueReadingTitle:
      "Los demás acuerdos que rigen los compromisos de HenryCo Studio.",
  },
  pricing: {
    kicker: "Paquetes y precios",
    title: "Paquetes claros para proyectos comunes. Alcance a medida para todo lo demás.",
    intro:
      "Gamas transparentes cuando el alcance es repetible, un brief con precios por hitos cuando no lo es. Ves la cifra antes de la primera conversación.",
    availablePackagesLabel: "Paquetes disponibles",
    serviceAreasLabel: "Áreas de servicio",
    packagesKicker: "Paquetes",
    fallbackPackageLabel: "Paquete Studio",
    weeksValue: "{weeks} semanas",
    depositLabel: "Depósito",
    bestForLabel: "Ideal para",
    startWithPackage: "Empezar con este paquete",
    chooseCustomKicker: "Elige a medida en su lugar cuando",
    chooseCustomTitle:
      "Los desarrollos más grandes o profundos se saltan el paquete y van directos al brief.",
    customReason1:
      "Necesitas un portal multirrol, un espacio de cliente, un panel de control o un sistema de software específico para un flujo de trabajo.",
    customReason2:
      "El proyecto combina web, administración, pagos, operaciones y automatización en una sola plataforma.",
    customReason3:
      "El producto necesita móvil, integraciones o una ruta de arquitectura más deliberada de la que permite un paquete.",
    customReason4:
      "Quieres que HenryCo defina la experiencia exacta en lugar de encajar tus necesidades en una plantilla predefinida.",
    moveForwardKicker: "Avanzar",
    moveForwardTitle: "Elige un paquete que encaje, o envíanos el brief exacto.",
    openBriefBuilder: "Abrir el generador de briefs",
    viewAllServices: "Ver todos los servicios",
    enterpriseKicker: "Alcance empresarial o no estándar",
    enterpriseTitle:
      "Los desarrollos más grandes, más sensibles o profundamente integrados se definen como un programa a medida.",
    enterpriseBody:
      "Las plataformas empresariales, las grandes reconstrucciones y las integraciones complejas se cotizan y definen según los requisitos exactos, no según una plantilla.",
    startCustomProject: "Iniciar un proyecto a medida",
  },
  process: {
    fallbackPrimaryCta: "Iniciar un proyecto Studio",
    kicker: "Proceso",
    title: "Del brief al lanzamiento, nada queda oculto.",
    intro:
      "El alcance, los precios, los hitos, los pagos y el avance de la entrega permanecen visibles en un único registro estructurado, desde el primer brief hasta la entrega final.",
    processKicker: "Proceso Studio",
    stepLabel: "Paso {number}",
  },
  teams: {
    kicker: "Equipos",
    title: "Las personas responsables de tu proyecto.",
    intro:
      "HenryCo Studio gestiona cuatro pods de entrega — cada uno ajustado a un tipo de trabajo — respaldados por un grupo de liderazgo con nombre que asume el alcance, la calidad y la fecha de lanzamiento.",
    leadershipKicker: "Liderazgo del Studio",
    leadershipBody:
      "Cada proyecto tiene un líder con nombre de este grupo. Sabrás quién aprueba el alcance, quién responde cuando algo se retrasa y quién es responsable del lanzamiento.",
    podsKicker: "Pods de entrega",
    podsBody:
      "Elige el pod que encaje con tu proyecto, o envía el brief y deja que el Studio te dirija al equipo adecuado.",
    selectTeam: "Seleccionar este equipo",
    teamDetail: "Detalle del equipo",
  },
  trust: {
    highlightControlsTitle: "Controles protegidos",
    highlightControlsBody:
      "Las acciones sensibles permanecen tras controles de acceso seguros.",
    highlightVisibilityTitle: "Visibilidad de hitos",
    highlightVisibilityBody:
      "Los pagos y los puntos de control de entrega permanecen visibles para el cliente.",
    highlightProposalsTitle: "Propuestas estructuradas",
    highlightProposalsBody:
      "Cada consulta se convierte en una propuesta formal con alcance, precios y plazos claros.",
    highlightQualityTitle: "Calidad premium",
    highlightQualityBody:
      "Cada superficie está diseñada para sentirse cuidada, moderna y digna de tu inversión.",
    kicker: "Confianza y transparencia",
    title: "Confianza en cada etapa. Por escrito, en el espacio de trabajo, en el banco.",
    intro:
      "Claridad de alcance, visibilidad de hitos, manejo seguro de archivos, puntos de control de pago y comunicación responsable — estructurados para que siempre sepas qué está pasando y qué viene después.",
    principlesKicker: "Cuatro principios operativos",
    signalsKicker: "Señales de confianza",
    signalsTitle: "Lo que permanece visible, del brief al banco.",
    confidenceKicker: "Confianza del cliente",
    confidenceTitle: "Lo que los clientes realmente dicen.",
    whyKicker: "Por qué los clientes eligen HenryCo",
  },
  work: {
    kicker: "Trabajos seleccionados",
    title: "El trabajo antes de la conversación.",
    intro:
      "Cada caso de estudio cubre el reto de negocio, el enfoque y el impacto medible. Sin resúmenes vagos — pruebas que puedes verificar antes de comprometerte.",
    caseStudiesLabel: "Casos de estudio",
    teamsLabel: "Equipos",
    servicesLabel: "Servicios",
    viewCaseStudy: "Ver caso de estudio",
  },
};

const PT: DeepPartial<StudioPublicExtraCopy> = {
  about: {
    kicker: "Sobre o HenryCo Studio",
    title: "Um estúdio de software construído em torno da clareza, da entrega e da confiança.",
    intro:
      "O HenryCo Studio projeta e desenvolve sites, experiências de comércio, ferramentas internas e plataformas sob medida para equipas que precisam de uma execução séria, sem um processo de desenvolvimento caótico.",
    startBriefCta: "Iniciar um brief",
    viewWorkCta: "Ver trabalhos",
    proofServicesLabel: "Serviços",
    proofPackagesLabel: "Pacotes",
    proofTeamsLabel: "Equipas",
    proofCaseStudiesLabel: "Estudos de caso",
    operateKicker: "Como trabalhamos",
    principleStructuredTitle: "Estruturado antes de criativo",
    principleStructuredBody:
      "Cada projeto começa com o brief, os critérios de sucesso, as restrições e o caminho de entrega tornados visíveis.",
    principlePremiumTitle: "Execução premium",
    principlePremiumBody:
      "Design, engenharia, redação e apoio ao lançamento avançam em conjunto, em vez de serem tratados como entregas separadas.",
    principleConfidenceTitle: "Confiança do lado do cliente",
    principleConfidenceBody:
      "Marcos, ficheiros, faturas, comprovativos e mensagens do projeto permanecem rastreáveis no espaço de trabalho do Studio.",
    deliveryKicker: "Histórico de entrega",
    deliveryTitle: "O espaço de trabalho do estúdio faz parte do serviço, não um acessório.",
    deliveryBody:
      "Os clientes podem acompanhar o estado do projeto, trocar mensagens, rever ficheiros e pagar faturas a partir de um único espaço de trabalho controlado.",
  },
  pick: {
    kicker: "Pronto a usar pelo HenryCo Studio",
    title: "Escolha um site. Lançamos uma versão personalizada em dias.",
    intro:
      "Cada modelo é um site real do HenryCo Studio pronto para produção. Preços reais. Prazos reais. Âmbito real. Adaptamo-lo à sua marca e ao seu conteúdo e publicamos.",
    customBriefCta: "Precisa de algo à medida? Abra um brief livre",
    compareBandsCta: "Comparar gamas de pacotes",
    templatesLabel: "Modelos",
    startsFromLabel: "A partir de",
    fastestLaunchLabel: "Lançamento mais rápido",
    categoriesLabel: "Categorias",
    daysValue: "{days} dias",
    templateCountOne: "{count} modelo",
    templateCountMany: "{count} modelos",
    cardPriceLabel: "Preço",
    cardReadyInLabel: "Pronto em",
    cardOftenForLabel: "Frequentemente para",
    cardMorePages: "+ {count} mais",
    cardViewTemplate: "Ver modelo",
    cardWeekLaunch: "Lançamento em {weeks} sem.",
    ctaKicker: "Nenhum serve? Descreva aquilo de que realmente precisa.",
    ctaTitle:
      "Os projetos à medida usam a mesma disciplina de marcos — e dispensam totalmente o modelo.",
    ctaBody:
      "Portais multifunção, software à medida, integrações profundas: definimos o âmbito segundo os seus requisitos, não um modelo no qual tenha de se encaixar. O brief leva cerca de oito minutos e devolve uma estimativa de preço.",
    ctaButton: "Descrever um projeto totalmente à medida",
  },
  pickDetail: {
    backToTemplates: "Todos os modelos",
    fallbackCategory: "Modelo Studio",
    payDepositStart: "Pagar {percent}% de sinal e começar",
    viewLiveDemo: "Ver demonstração ao vivo",
    customiseBriefFirst: "Personalizar o brief primeiro",
    priceLabel: "Preço",
    readyInLabel: "Pronto em",
    buildWindowLabel: "Janela de desenvolvimento",
    depositLabel: "Sinal",
    readyInDays: "{days} dias",
    buildWindowWeeks: "{weeks} sem.",
    oftenForLabel: "Frequentemente para:",
    badgeReadyInDays: "{days} dias",
    paymentPlanLabel: "Plano de pagamento",
    depositOnAccept: "Sinal na aceitação",
    balanceAtLaunch: "Saldo no lançamento",
    totalLabel: "Total",
    paymentNote:
      "Transferência bancária ou cartão via Paystack / Flutterwave. Recibo com marca emitido assim que a área financeira confirma.",
    pagesIncludedLabel: "Páginas incluídas",
    featuresBuiltInLabel: "Funcionalidades integradas",
    outcomesLabel: "Resultados que pode esperar",
    techStackLabel: "Stack tecnológica",
    stackNote:
      "Pode fixar uma stack diferente no brief — a HenryCo orçamenta a diferença se alterar o esforço de desenvolvimento, ou respeita a sua escolha sem custo quando não o altera.",
    moveForwardKicker: "Avançar",
    moveForwardTitle: "Personalize este modelo e lance em {days} dias.",
    moveForwardBody:
      "O brief leva cerca de oito minutos. Confirmamos o âmbito, enviamos uma proposta com preços por marcos e começamos o trabalho assim que o seu sinal é confirmado.",
    payDepositStartShort: "Pagar sinal e começar",
    talkToLead: "Falar com um responsável do Studio",
    relatedKicker: "Outros modelos de {category}",
    relatedTitle: "Compare caminhos prontos a usar próximos.",
  },
  policyDetail: {
    backToPolicies: "Todas as políticas",
    effectiveFromLabel: "Em vigor desde",
    lastReviewedLabel: "Última revisão",
    governingLawLabel: "Lei aplicável",
    continueReadingKicker: "Continuar a ler",
    continueReadingTitle:
      "Os outros acordos que regem os compromissos do HenryCo Studio.",
  },
  pricing: {
    kicker: "Pacotes e preços",
    title: "Pacotes claros para projetos comuns. Âmbito à medida para tudo o resto.",
    intro:
      "Gamas transparentes quando o âmbito é repetível, um brief com preços por marcos quando não é. Vê o valor antes da primeira conversa.",
    availablePackagesLabel: "Pacotes disponíveis",
    serviceAreasLabel: "Áreas de serviço",
    packagesKicker: "Pacotes",
    fallbackPackageLabel: "Pacote Studio",
    weeksValue: "{weeks} semanas",
    depositLabel: "Sinal",
    bestForLabel: "Ideal para",
    startWithPackage: "Começar com este pacote",
    chooseCustomKicker: "Escolha à medida em vez disso quando",
    chooseCustomTitle:
      "Os projetos maiores ou mais profundos saltam o pacote e vão diretos ao brief.",
    customReason1:
      "Precisa de um portal multifunção, espaço de cliente, painel de controlo ou sistema de software específico para um fluxo de trabalho.",
    customReason2:
      "O projeto combina web, administração, pagamentos, operações e automação numa única plataforma.",
    customReason3:
      "O produto precisa de mobile, integrações ou um caminho de arquitetura mais ponderado do que um pacote permite.",
    customReason4:
      "Quer que a HenryCo defina a experiência exata em vez de adaptar as suas necessidades a um modelo predefinido.",
    moveForwardKicker: "Avançar",
    moveForwardTitle: "Escolha um pacote que sirva, ou envie-nos o brief exato.",
    openBriefBuilder: "Abrir o gerador de briefs",
    viewAllServices: "Ver todos os serviços",
    enterpriseKicker: "Âmbito empresarial ou não padrão",
    enterpriseTitle:
      "Os projetos maiores, mais sensíveis ou profundamente integrados são definidos como um programa à medida.",
    enterpriseBody:
      "As plataformas empresariais, as grandes reconstruções e as integrações complexas são orçamentadas e definidas segundo os requisitos exatos — não um modelo.",
    startCustomProject: "Iniciar um projeto à medida",
  },
  process: {
    fallbackPrimaryCta: "Iniciar um projeto Studio",
    kicker: "Processo",
    title: "Do brief ao lançamento, nada fica escondido.",
    intro:
      "Âmbito, preços, marcos, pagamentos e progresso da entrega permanecem visíveis num único registo estruturado, do primeiro brief à entrega final.",
    processKicker: "Processo Studio",
    stepLabel: "Passo {number}",
  },
  teams: {
    kicker: "Equipas",
    title: "As pessoas responsáveis pelo seu projeto.",
    intro:
      "O HenryCo Studio opera quatro pods de entrega — cada um ajustado a um tipo de trabalho — apoiados por um grupo de liderança nomeado que assume o âmbito, a qualidade e a data de lançamento.",
    leadershipKicker: "Liderança do Studio",
    leadershipBody:
      "Cada projeto tem um responsável nomeado deste grupo. Vai saber quem aprova o âmbito, quem responde quando algo atrasa e quem é responsável pelo lançamento.",
    podsKicker: "Pods de entrega",
    podsBody:
      "Escolha o pod que serve o seu projeto, ou envie o brief e deixe o Studio encaminhá-lo para a equipa certa.",
    selectTeam: "Selecionar esta equipa",
    teamDetail: "Detalhe da equipa",
  },
  trust: {
    highlightControlsTitle: "Controlos protegidos",
    highlightControlsBody:
      "As ações sensíveis permanecem protegidas por controlos de acesso seguros.",
    highlightVisibilityTitle: "Visibilidade dos marcos",
    highlightVisibilityBody:
      "Os pagamentos e os pontos de controlo de entrega permanecem visíveis para o cliente.",
    highlightProposalsTitle: "Propostas estruturadas",
    highlightProposalsBody:
      "Cada pedido torna-se uma proposta formal com âmbito, preços e prazos claros.",
    highlightQualityTitle: "Qualidade premium",
    highlightQualityBody:
      "Cada superfície é concebida para parecer ponderada, moderna e à altura do seu investimento.",
    kicker: "Confiança e transparência",
    title: "Confiança em cada etapa. Por escrito, no espaço de trabalho, no banco.",
    intro:
      "Clareza de âmbito, visibilidade dos marcos, gestão segura de ficheiros, pontos de controlo de pagamento e comunicação responsável — estruturados para que saiba sempre o que está a acontecer e o que vem a seguir.",
    principlesKicker: "Quatro princípios de operação",
    signalsKicker: "Sinais de confiança",
    signalsTitle: "O que permanece visível, do brief ao banco.",
    confidenceKicker: "Confiança do cliente",
    confidenceTitle: "O que os clientes realmente dizem.",
    whyKicker: "Por que os clientes escolhem a HenryCo",
  },
  work: {
    kicker: "Trabalhos selecionados",
    title: "O trabalho antes da conversa.",
    intro:
      "Cada estudo de caso cobre o desafio de negócio, a abordagem e o impacto mensurável. Sem resumos vagos — provas que pode verificar antes de se comprometer.",
    caseStudiesLabel: "Estudos de caso",
    teamsLabel: "Equipas",
    servicesLabel: "Serviços",
    viewCaseStudy: "Ver estudo de caso",
  },
};

const AR: DeepPartial<StudioPublicExtraCopy> = {
  about: {
    kicker: "عن HenryCo Studio",
    title: "استوديو برمجيات مبني على الوضوح والتسليم والثقة.",
    intro:
      "يصمم HenryCo Studio ويبني المواقع الإلكترونية وتجارب التجارة والأدوات الداخلية والمنصات المخصصة للفِرق التي تحتاج إلى تنفيذ جاد دون عملية بناء فوضوية.",
    startBriefCta: "ابدأ موجزًا",
    viewWorkCta: "عرض الأعمال",
    proofServicesLabel: "الخدمات",
    proofPackagesLabel: "الباقات",
    proofTeamsLabel: "الفِرق",
    proofCaseStudiesLabel: "دراسات الحالة",
    operateKicker: "كيف نعمل",
    principleStructuredTitle: "التنظيم قبل الإبداع",
    principleStructuredBody:
      "يبدأ كل مشروع بالموجز ومعايير النجاح والقيود ومسار التسليم مع جعلها مرئية بوضوح.",
    principlePremiumTitle: "تنفيذ متميز",
    principlePremiumBody:
      "يتقدم التصميم والهندسة وكتابة المحتوى ودعم الإطلاق معًا بدلًا من معاملتها كعمليات تسليم منفصلة.",
    principleConfidenceTitle: "ثقة من جانب العميل",
    principleConfidenceBody:
      "تظل المراحل والملفات والفواتير وإثباتات الرفع ورسائل المشروع قابلة للمساءلة داخل مساحة عمل الاستوديو.",
    deliveryKicker: "سجل التسليم",
    deliveryTitle: "مساحة عمل الاستوديو جزء من الخدمة، وليست أمرًا ثانويًا.",
    deliveryBody:
      "يمكن للعملاء متابعة حالة المشروع وتبادل الرسائل ومراجعة الملفات ودفع الفواتير من مساحة عمل واحدة محكومة.",
  },
  pick: {
    kicker: "جاهز للاستخدام من HenryCo Studio",
    title: "اختر موقعًا. ونطلق نسخة مخصصة في غضون أيام.",
    intro:
      "كل قالب هو موقع HenryCo Studio حقيقي جاهز للإنتاج. أسعار حقيقية. جداول زمنية حقيقية. نطاق حقيقي. نخصصه لعلامتك التجارية ومحتواك ثم نطلقه.",
    customBriefCta: "تحتاج إلى شيء مخصص؟ افتح موجزًا حرًا",
    compareBandsCta: "قارن فئات الباقات",
    templatesLabel: "القوالب",
    startsFromLabel: "يبدأ من",
    fastestLaunchLabel: "أسرع إطلاق",
    categoriesLabel: "الفئات",
    daysValue: "{days} أيام",
    templateCountOne: "{count} قالب",
    templateCountMany: "{count} قالب",
    cardPriceLabel: "السعر",
    cardReadyInLabel: "جاهز خلال",
    cardOftenForLabel: "غالبًا لـ",
    cardMorePages: "+ {count} المزيد",
    cardViewTemplate: "عرض القالب",
    cardWeekLaunch: "إطلاق خلال {weeks} أسبوع",
    ctaKicker: "لا شيء يناسبك؟ صف ما تحتاجه فعلًا.",
    ctaTitle:
      "تتبع المشاريع المخصصة الانضباط نفسه في المراحل — وتتجاوز القالب تمامًا.",
    ctaBody:
      "بوابات متعددة الأدوار وبرمجيات مخصصة وتكاملات عميقة: نحدد النطاق وفق متطلباتك، لا وفق قالب يجب أن تتكيف معه. يستغرق الموجز نحو ثماني دقائق ويعيد تسعيرًا استرشاديًا.",
    ctaButton: "صف مشروعًا مخصصًا بالكامل",
  },
  pickDetail: {
    backToTemplates: "كل القوالب",
    fallbackCategory: "قالب الاستوديو",
    payDepositStart: "ادفع عربون {percent}% وابدأ",
    viewLiveDemo: "عرض النسخة التجريبية المباشرة",
    customiseBriefFirst: "خصص الموجز أولًا",
    priceLabel: "السعر",
    readyInLabel: "جاهز خلال",
    buildWindowLabel: "نافذة البناء",
    depositLabel: "العربون",
    readyInDays: "{days} أيام",
    buildWindowWeeks: "{weeks} أسابيع",
    oftenForLabel: "غالبًا لـ:",
    badgeReadyInDays: "{days} أيام",
    paymentPlanLabel: "خطة الدفع",
    depositOnAccept: "العربون عند القبول",
    balanceAtLaunch: "الرصيد عند الإطلاق",
    totalLabel: "الإجمالي",
    paymentNote:
      "تحويل بنكي أو بطاقة عبر Paystack / Flutterwave. يُصدر إيصال يحمل العلامة التجارية فور تأكيد القسم المالي.",
    pagesIncludedLabel: "الصفحات المضمّنة",
    featuresBuiltInLabel: "ميزات مدمجة",
    outcomesLabel: "النتائج التي يمكنك توقعها",
    techStackLabel: "الحزمة التقنية",
    stackNote:
      "يمكنك تثبيت حزمة تقنية مختلفة في الموجز — وستحدد HenryCo سعر الفارق إذا غيّر جهد البناء، أو تحترم اختيارك دون تكلفة عندما لا يغيّره.",
    moveForwardKicker: "المضي قدمًا",
    moveForwardTitle: "خصص هذا القالب وأطلقه خلال {days} أيام.",
    moveForwardBody:
      "يستغرق الموجز نحو ثماني دقائق. نؤكد النطاق ونرسل عرضًا مُسعّرًا بالمراحل ونبدأ العمل فور تأكيد عربونك.",
    payDepositStartShort: "ادفع العربون وابدأ",
    talkToLead: "تحدث إلى مسؤول الاستوديو",
    relatedKicker: "قوالب {category} أخرى",
    relatedTitle: "قارن المسارات الجاهزة القريبة.",
  },
  policyDetail: {
    backToPolicies: "كل السياسات",
    effectiveFromLabel: "سارية اعتبارًا من",
    lastReviewedLabel: "آخر مراجعة",
    governingLawLabel: "القانون الحاكم",
    continueReadingKicker: "تابع القراءة",
    continueReadingTitle:
      "الاتفاقيات الأخرى التي تحكم ارتباطات HenryCo Studio.",
  },
  pricing: {
    kicker: "الباقات والأسعار",
    title: "باقات واضحة للمشاريع الشائعة. تحديد نطاق مخصص لكل ما عداها.",
    intro:
      "فئات شفافة عندما يكون النطاق قابلًا للتكرار، وموجز مُسعّر بالمراحل عندما لا يكون كذلك. ترى الرقم قبل المحادثة الأولى.",
    availablePackagesLabel: "الباقات المتاحة",
    serviceAreasLabel: "مجالات الخدمة",
    packagesKicker: "الباقات",
    fallbackPackageLabel: "باقة الاستوديو",
    weeksValue: "{weeks} أسابيع",
    depositLabel: "العربون",
    bestForLabel: "الأنسب لـ",
    startWithPackage: "ابدأ بهذه الباقة",
    chooseCustomKicker: "اختر المخصص بدلًا منها عندما",
    chooseCustomTitle:
      "المشاريع الأكبر أو الأعمق تتجاوز الباقة وتنتقل مباشرة إلى الموجز.",
    customReason1:
      "تحتاج إلى بوابة متعددة الأدوار أو مساحة عمل للعميل أو لوحة تحكم أو نظام برمجي خاص بسير عمل محدد.",
    customReason2:
      "يجمع المشروع بين الويب والإدارة والمدفوعات والعمليات والأتمتة في منصة واحدة.",
    customReason3:
      "يحتاج المنتج إلى تطبيق جوال أو تكاملات أو مسار معماري أكثر تأنّيًا مما تسمح به الباقة.",
    customReason4:
      "تريد أن تحدد HenryCo التجربة بدقة بدلًا من تكييف احتياجاتك مع قالب معدّ مسبقًا.",
    moveForwardKicker: "المضي قدمًا",
    moveForwardTitle: "اختر باقة تناسبك، أو أرسل لنا الموجز الدقيق.",
    openBriefBuilder: "افتح أداة إنشاء الموجز",
    viewAllServices: "عرض كل الخدمات",
    enterpriseKicker: "نطاق المؤسسات أو غير القياسي",
    enterpriseTitle:
      "المشاريع الأكبر أو الأكثر حساسية أو العميقة التكامل تُحدد نطاقها كبرنامج مخصص.",
    enterpriseBody:
      "منصات المؤسسات وعمليات إعادة البناء الكبيرة والتكاملات المعقدة تُسعّر ويُحدد نطاقها وفق المتطلبات الدقيقة — لا وفق قالب.",
    startCustomProject: "ابدأ مشروعًا مخصصًا",
  },
  process: {
    fallbackPrimaryCta: "ابدأ مشروع استوديو",
    kicker: "العملية",
    title: "من الموجز إلى الإطلاق، لا شيء يبقى خفيًا.",
    intro:
      "يبقى النطاق والتسعير والمراحل والمدفوعات وتقدم التسليم مرئيًا في سجل واحد منظم، من أول موجز إلى التسليم النهائي.",
    processKicker: "عملية الاستوديو",
    stepLabel: "الخطوة {number}",
  },
  teams: {
    kicker: "الفِرق",
    title: "الأشخاص المسؤولون عن مشروعك.",
    intro:
      "يدير HenryCo Studio أربعة فِرق تسليم — كل منها مُهيّأ لنوع من العمل — مدعومةً بمجموعة قيادة معروفة بالاسم تتولى النطاق والجودة وتاريخ الإطلاق.",
    leadershipKicker: "قيادة الاستوديو",
    leadershipBody:
      "لكل مشروع قائد معروف بالاسم من هذه المجموعة. ستعرف من يعتمد النطاق، ومن يجيب عندما يتأخر شيء، ومن يتحمل مسؤولية الإطلاق.",
    podsKicker: "فِرق التسليم",
    podsBody:
      "اختر الفريق الذي يناسب مشروعك، أو أرسل الموجز ودَع الاستوديو يوجّهك إلى الفريق المناسب.",
    selectTeam: "اختر هذا الفريق",
    teamDetail: "تفاصيل الفريق",
  },
  trust: {
    highlightControlsTitle: "ضوابط محمية",
    highlightControlsBody:
      "تبقى الإجراءات الحساسة خلف ضوابط وصول آمنة.",
    highlightVisibilityTitle: "وضوح المراحل",
    highlightVisibilityBody:
      "تبقى المدفوعات ونقاط تحقق التسليم مرئية للعميل.",
    highlightProposalsTitle: "عروض منظمة",
    highlightProposalsBody:
      "يتحول كل استفسار إلى عرض رسمي بنطاق وتسعير وجداول زمنية واضحة.",
    highlightQualityTitle: "جودة متميزة",
    highlightQualityBody:
      "صُممت كل واجهة لتبدو مدروسة وحديثة وجديرة باستثمارك.",
    kicker: "الثقة والشفافية",
    title: "ثقة في كل مرحلة. كتابةً، وفي مساحة العمل، وفي البنك.",
    intro:
      "وضوح النطاق، ووضوح المراحل، والتعامل الآمن مع الملفات، ونقاط تحقق الدفع، والتواصل المسؤول — منظمة بحيث تعرف دائمًا ما يجري وما يأتي بعد ذلك.",
    principlesKicker: "أربعة مبادئ تشغيلية",
    signalsKicker: "إشارات الثقة",
    signalsTitle: "ما يبقى مرئيًا، من الموجز إلى البنك.",
    confidenceKicker: "ثقة العميل",
    confidenceTitle: "ما يقوله العملاء فعلًا.",
    whyKicker: "لماذا يختار العملاء HenryCo",
  },
  work: {
    kicker: "أعمال مختارة",
    title: "العمل قبل المحادثة.",
    intro:
      "تغطي كل دراسة حالة التحدي التجاري والمنهج والأثر القابل للقياس. لا ملخصات غامضة — أدلة يمكنك التحقق منها قبل أن تلتزم.",
    caseStudiesLabel: "دراسات الحالة",
    teamsLabel: "الفِرق",
    servicesLabel: "الخدمات",
    viewCaseStudy: "عرض دراسة الحالة",
  },
};

const DE: DeepPartial<StudioPublicExtraCopy> = {
  about: {
    kicker: "Über HenryCo Studio",
    title: "Ein Software-Studio, das auf Klarheit, Lieferung und Vertrauen aufgebaut ist.",
    intro:
      "HenryCo Studio gestaltet und entwickelt Websites, Commerce-Erlebnisse, interne Tools und maßgeschneiderte Plattformen für Teams, die eine ernsthafte Umsetzung ohne chaotischen Entwicklungsprozess brauchen.",
    startBriefCta: "Brief starten",
    viewWorkCta: "Arbeiten ansehen",
    proofServicesLabel: "Leistungen",
    proofPackagesLabel: "Pakete",
    proofTeamsLabel: "Teams",
    proofCaseStudiesLabel: "Fallstudien",
    operateKicker: "Wie wir arbeiten",
    principleStructuredTitle: "Struktur vor Kreativität",
    principleStructuredBody:
      "Jedes Projekt beginnt damit, dass Brief, Erfolgskriterien, Rahmenbedingungen und Lieferweg sichtbar gemacht werden.",
    principlePremiumTitle: "Premium-Umsetzung",
    principlePremiumBody:
      "Design, Entwicklung, Text und Launch-Unterstützung bewegen sich gemeinsam, statt als getrennte Übergaben behandelt zu werden.",
    principleConfidenceTitle: "Sicherheit auf Kundenseite",
    principleConfidenceBody:
      "Meilensteine, Dateien, Rechnungen, Nachweis-Uploads und Projektnachrichten bleiben im Studio-Arbeitsbereich nachvollziehbar.",
    deliveryKicker: "Lieferbilanz",
    deliveryTitle: "Der Studio-Arbeitsbereich ist Teil der Leistung, kein nachträglicher Zusatz.",
    deliveryBody:
      "Kunden können den Projektstatus verfolgen, Nachrichten austauschen, Dateien prüfen und Rechnungen aus einem einzigen kontrollierten Arbeitsbereich bezahlen.",
  },
  pick: {
    kicker: "Sofort einsatzbereit von HenryCo Studio",
    title: "Wählen Sie eine Website. Wir launchen in wenigen Tagen eine angepasste Version.",
    intro:
      "Jede Vorlage ist eine echte, produktionsreife HenryCo-Studio-Website. Echte Preise. Echte Zeitpläne. Echter Umfang. Wir passen sie an Ihre Marke und Inhalte an und gehen dann live.",
    customBriefCta: "Etwas Maßgeschneidertes nötig? Öffnen Sie ein freies Brief",
    compareBandsCta: "Paketstufen vergleichen",
    templatesLabel: "Vorlagen",
    startsFromLabel: "Ab",
    fastestLaunchLabel: "Schnellster Launch",
    categoriesLabel: "Kategorien",
    daysValue: "{days} Tage",
    templateCountOne: "{count} Vorlage",
    templateCountMany: "{count} Vorlagen",
    cardPriceLabel: "Preis",
    cardReadyInLabel: "Fertig in",
    cardOftenForLabel: "Oft für",
    cardMorePages: "+ {count} weitere",
    cardViewTemplate: "Vorlage ansehen",
    cardWeekLaunch: "Launch in {weeks} Wo.",
    ctaKicker: "Nichts passt? Beschreiben Sie, was Sie wirklich brauchen.",
    ctaTitle:
      "Maßgeschneiderte Projekte folgen derselben Meilenstein-Disziplin — und verzichten ganz auf die Vorlage.",
    ctaBody:
      "Portale mit mehreren Rollen, individuelle Software, tiefe Integrationen: Wir definieren den Umfang nach Ihren Anforderungen, nicht nach einer Vorlage, in die Sie passen müssen. Das Brief dauert etwa acht Minuten und liefert eine Richtpreis-Angabe.",
    ctaButton: "Ein vollständig maßgeschneidertes Projekt beschreiben",
  },
  pickDetail: {
    backToTemplates: "Alle Vorlagen",
    fallbackCategory: "Studio-Vorlage",
    payDepositStart: "{percent}% Anzahlung zahlen & starten",
    viewLiveDemo: "Live-Demo ansehen",
    customiseBriefFirst: "Zuerst das Brief anpassen",
    priceLabel: "Preis",
    readyInLabel: "Fertig in",
    buildWindowLabel: "Entwicklungsfenster",
    depositLabel: "Anzahlung",
    readyInDays: "{days} Tage",
    buildWindowWeeks: "{weeks} Wo.",
    oftenForLabel: "Oft für:",
    badgeReadyInDays: "{days} Tage",
    paymentPlanLabel: "Zahlungsplan",
    depositOnAccept: "Anzahlung bei Annahme",
    balanceAtLaunch: "Restbetrag beim Launch",
    totalLabel: "Gesamt",
    paymentNote:
      "Banküberweisung oder Karte über Paystack / Flutterwave. Markenbeleg wird ausgestellt, sobald die Finanzabteilung bestätigt.",
    pagesIncludedLabel: "Enthaltene Seiten",
    featuresBuiltInLabel: "Integrierte Funktionen",
    outcomesLabel: "Ergebnisse, die Sie erwarten können",
    techStackLabel: "Tech-Stack",
    stackNote:
      "Sie können im Brief einen anderen Stack festlegen — HenryCo beziffert die Differenz, wenn sich der Entwicklungsaufwand ändert, oder respektiert Ihre Wahl kostenlos, wenn er sich nicht ändert.",
    moveForwardKicker: "Weitergehen",
    moveForwardTitle: "Passen Sie diese Vorlage an und launchen Sie in {days} Tagen.",
    moveForwardBody:
      "Das Brief dauert etwa acht Minuten. Wir bestätigen den Umfang, senden ein nach Meilensteinen kalkuliertes Angebot und beginnen die Arbeit, sobald Ihre Anzahlung eingegangen ist.",
    payDepositStartShort: "Anzahlung zahlen & starten",
    talkToLead: "Mit einer Studio-Leitung sprechen",
    relatedKicker: "Weitere {category}-Vorlagen",
    relatedTitle: "Vergleichen Sie naheliegende einsatzbereite Wege.",
  },
  policyDetail: {
    backToPolicies: "Alle Richtlinien",
    effectiveFromLabel: "Gültig ab",
    lastReviewedLabel: "Zuletzt geprüft",
    governingLawLabel: "Anwendbares Recht",
    continueReadingKicker: "Weiterlesen",
    continueReadingTitle:
      "Die weiteren Vereinbarungen, die HenryCo-Studio-Aufträge regeln.",
  },
  pricing: {
    kicker: "Pakete und Preise",
    title: "Klare Pakete für gängige Projekte. Maßgeschneidertes Scoping für alles andere.",
    intro:
      "Transparente Stufen, wenn der Umfang wiederholbar ist, ein nach Meilensteinen kalkuliertes Brief, wenn nicht. Sie sehen die Zahl vor dem ersten Gespräch.",
    availablePackagesLabel: "Verfügbare Pakete",
    serviceAreasLabel: "Leistungsbereiche",
    packagesKicker: "Pakete",
    fallbackPackageLabel: "Studio-Paket",
    weeksValue: "{weeks} Wochen",
    depositLabel: "Anzahlung",
    bestForLabel: "Ideal für",
    startWithPackage: "Mit diesem Paket starten",
    chooseCustomKicker: "Wählen Sie stattdessen maßgeschneidert, wenn",
    chooseCustomTitle:
      "Größere oder tiefere Projekte überspringen das Paket und gehen direkt zum Brief.",
    customReason1:
      "Sie brauchen ein Portal mit mehreren Rollen, einen Kunden-Arbeitsbereich, ein Dashboard oder ein workflow-spezifisches Softwaresystem.",
    customReason2:
      "Das Projekt vereint Web, Administration, Zahlungen, Betrieb und Automatisierung in einer Plattform.",
    customReason3:
      "Das Produkt benötigt Mobile, Integrationen oder einen bewussteren Architekturweg, als ein Paket erlaubt.",
    customReason4:
      "Sie möchten, dass HenryCo das genaue Erlebnis definiert, statt Ihre Anforderungen in eine vordefinierte Vorlage zu pressen.",
    moveForwardKicker: "Weitergehen",
    moveForwardTitle: "Wählen Sie ein passendes Paket, oder senden Sie uns das genaue Brief.",
    openBriefBuilder: "Brief-Builder öffnen",
    viewAllServices: "Alle Leistungen ansehen",
    enterpriseKicker: "Enterprise- oder Sonderumfang",
    enterpriseTitle:
      "Größere, sensiblere oder tief integrierte Projekte werden als maßgeschneidertes Programm definiert.",
    enterpriseBody:
      "Enterprise-Plattformen, große Neuaufbauten und komplexe Integrationen werden anhand der genauen Anforderungen kalkuliert und definiert — nicht anhand einer Vorlage.",
    startCustomProject: "Ein maßgeschneidertes Projekt starten",
  },
  process: {
    fallbackPrimaryCta: "Ein Studio-Projekt starten",
    kicker: "Prozess",
    title: "Vom Brief bis zum Launch bleibt nichts verborgen.",
    intro:
      "Umfang, Preise, Meilensteine, Zahlungen und Lieferfortschritt bleiben in einem strukturierten Datensatz sichtbar — vom ersten Brief bis zur finalen Übergabe.",
    processKicker: "Studio-Prozess",
    stepLabel: "Schritt {number}",
  },
  teams: {
    kicker: "Teams",
    title: "Die Menschen, die für Ihr Projekt verantwortlich sind.",
    intro:
      "HenryCo Studio betreibt vier Liefer-Pods — jeder auf eine Art von Arbeit abgestimmt — gestützt von einer namentlich benannten Führungsgruppe, die Umfang, Qualität und Launch-Termin verantwortet.",
    leadershipKicker: "Studio-Leitung",
    leadershipBody:
      "Jedes Projekt hat eine namentlich benannte Leitung aus dieser Gruppe. Sie wissen, wer den Umfang freigibt, wer antwortet, wenn etwas ins Rutschen gerät, und wer für den Launch geradesteht.",
    podsKicker: "Liefer-Pods",
    podsBody:
      "Wählen Sie den Pod, der zu Ihrem Projekt passt, oder senden Sie das Brief und lassen Sie das Studio Sie zur richtigen Stelle leiten.",
    selectTeam: "Dieses Team auswählen",
    teamDetail: "Team-Details",
  },
  trust: {
    highlightControlsTitle: "Geschützte Steuerung",
    highlightControlsBody:
      "Sensible Aktionen bleiben hinter sicheren Zugriffskontrollen.",
    highlightVisibilityTitle: "Meilenstein-Transparenz",
    highlightVisibilityBody:
      "Zahlungen und Liefer-Checkpoints bleiben für den Kunden sichtbar.",
    highlightProposalsTitle: "Strukturierte Angebote",
    highlightProposalsBody:
      "Jede Anfrage wird zu einem formellen Angebot mit klarem Umfang, Preisen und Zeitplänen.",
    highlightQualityTitle: "Premium-Qualität",
    highlightQualityBody:
      "Jede Oberfläche ist so gestaltet, dass sie durchdacht, modern und Ihrer Investition würdig wirkt.",
    kicker: "Vertrauen & Transparenz",
    title: "Sicherheit in jeder Phase. Schriftlich, im Arbeitsbereich, auf dem Konto.",
    intro:
      "Umfangsklarheit, Meilenstein-Transparenz, sichere Dateiverwaltung, Zahlungs-Checkpoints und verantwortliche Kommunikation — so strukturiert, dass Sie stets wissen, was geschieht und was als Nächstes kommt.",
    principlesKicker: "Vier Arbeitsprinzipien",
    signalsKicker: "Vertrauenssignale",
    signalsTitle: "Was vom Brief bis zur Bank sichtbar bleibt.",
    confidenceKicker: "Kundenvertrauen",
    confidenceTitle: "Was Kunden tatsächlich sagen.",
    whyKicker: "Warum Kunden sich für HenryCo entscheiden",
  },
  work: {
    kicker: "Ausgewählte Arbeiten",
    title: "Die Arbeit vor dem Gespräch.",
    intro:
      "Jede Fallstudie behandelt die geschäftliche Herausforderung, den Ansatz und die messbare Wirkung. Keine vagen Zusammenfassungen — Belege, die Sie vor einer Zusage prüfen können.",
    caseStudiesLabel: "Fallstudien",
    teamsLabel: "Teams",
    servicesLabel: "Leistungen",
    viewCaseStudy: "Fallstudie ansehen",
  },
};

const IT: DeepPartial<StudioPublicExtraCopy> = {
  about: {
    kicker: "Informazioni su HenryCo Studio",
    title: "Uno studio software costruito attorno a chiarezza, consegna e fiducia.",
    intro:
      "HenryCo Studio progetta e sviluppa siti web, esperienze di commercio, strumenti interni e piattaforme su misura per team che hanno bisogno di un’esecuzione seria senza un processo di sviluppo caotico.",
    startBriefCta: "Avvia un brief",
    viewWorkCta: "Vedi i lavori",
    proofServicesLabel: "Servizi",
    proofPackagesLabel: "Pacchetti",
    proofTeamsLabel: "Team",
    proofCaseStudiesLabel: "Casi studio",
    operateKicker: "Come lavoriamo",
    principleStructuredTitle: "Strutturato prima che creativo",
    principleStructuredBody:
      "Ogni progetto inizia rendendo visibili il brief, i criteri di successo, i vincoli e il percorso di consegna.",
    principlePremiumTitle: "Esecuzione premium",
    principlePremiumBody:
      "Design, ingegneria, copy e supporto al lancio procedono insieme invece di essere trattati come passaggi separati.",
    principleConfidenceTitle: "Fiducia lato cliente",
    principleConfidenceBody:
      "Milestone, file, fatture, caricamenti di prova e messaggi di progetto restano tracciabili nello spazio di lavoro dello Studio.",
    deliveryKicker: "Storico delle consegne",
    deliveryTitle: "Lo spazio di lavoro dello studio è parte del servizio, non un ripensamento.",
    deliveryBody:
      "I clienti possono seguire lo stato del progetto, scambiare messaggi, rivedere i file e pagare le fatture da un unico spazio di lavoro controllato.",
  },
  pick: {
    kicker: "Pronto all’uso da HenryCo Studio",
    title: "Scegli un sito. Lanciamo una versione personalizzata in pochi giorni.",
    intro:
      "Ogni template è un vero sito HenryCo Studio pronto per la produzione. Prezzi reali. Tempi reali. Ambito reale. Lo adattiamo al tuo brand e ai tuoi contenuti, poi lo pubblichiamo.",
    customBriefCta: "Ti serve qualcosa su misura? Apri un brief libero",
    compareBandsCta: "Confronta le fasce di pacchetto",
    templatesLabel: "Template",
    startsFromLabel: "A partire da",
    fastestLaunchLabel: "Lancio più rapido",
    categoriesLabel: "Categorie",
    daysValue: "{days} giorni",
    templateCountOne: "{count} template",
    templateCountMany: "{count} template",
    cardPriceLabel: "Prezzo",
    cardReadyInLabel: "Pronto in",
    cardOftenForLabel: "Spesso per",
    cardMorePages: "+ {count} altri",
    cardViewTemplate: "Vedi il template",
    cardWeekLaunch: "Lancio in {weeks} sett.",
    ctaKicker: "Nessuno è adatto? Descrivi ciò di cui hai davvero bisogno.",
    ctaTitle:
      "I progetti su misura usano la stessa disciplina di milestone — e saltano del tutto il template.",
    ctaBody:
      "Portali multi-ruolo, software su misura, integrazioni profonde: definiamo l’ambito in base ai tuoi requisiti, non a un template in cui devi rientrare. Il brief richiede circa otto minuti e restituisce un prezzo indicativo.",
    ctaButton: "Descrivi un progetto completamente su misura",
  },
  pickDetail: {
    backToTemplates: "Tutti i template",
    fallbackCategory: "Template Studio",
    payDepositStart: "Paga il {percent}% di acconto e inizia",
    viewLiveDemo: "Vedi la demo live",
    customiseBriefFirst: "Personalizza prima il brief",
    priceLabel: "Prezzo",
    readyInLabel: "Pronto in",
    buildWindowLabel: "Finestra di sviluppo",
    depositLabel: "Acconto",
    readyInDays: "{days} giorni",
    buildWindowWeeks: "{weeks} sett.",
    oftenForLabel: "Spesso per:",
    badgeReadyInDays: "{days} giorni",
    paymentPlanLabel: "Piano di pagamento",
    depositOnAccept: "Acconto all’accettazione",
    balanceAtLaunch: "Saldo al lancio",
    totalLabel: "Totale",
    paymentNote:
      "Bonifico bancario o carta tramite Paystack / Flutterwave. Ricevuta con marchio emessa nel momento in cui la finanza conferma.",
    pagesIncludedLabel: "Pagine incluse",
    featuresBuiltInLabel: "Funzionalità integrate",
    outcomesLabel: "Risultati che puoi aspettarti",
    techStackLabel: "Stack tecnologico",
    stackNote:
      "Puoi fissare uno stack diverso nel brief — HenryCo quoterà la differenza se cambia l’impegno di sviluppo, oppure rispetterà la tua scelta senza costi quando non lo cambia.",
    moveForwardKicker: "Andare avanti",
    moveForwardTitle: "Personalizza questo template e lancialo in {days} giorni.",
    moveForwardBody:
      "Il brief richiede circa otto minuti. Confermiamo l’ambito, inviamo una proposta con prezzi per milestone e iniziamo il lavoro non appena il tuo acconto viene confermato.",
    payDepositStartShort: "Paga l’acconto e inizia",
    talkToLead: "Parla con un responsabile dello Studio",
    relatedKicker: "Altri template {category}",
    relatedTitle: "Confronta percorsi pronti all’uso vicini.",
  },
  policyDetail: {
    backToPolicies: "Tutte le policy",
    effectiveFromLabel: "In vigore dal",
    lastReviewedLabel: "Ultima revisione",
    governingLawLabel: "Legge applicabile",
    continueReadingKicker: "Continua a leggere",
    continueReadingTitle:
      "Gli altri accordi che regolano gli incarichi di HenryCo Studio.",
  },
  pricing: {
    kicker: "Pacchetti e prezzi",
    title: "Pacchetti chiari per i progetti comuni. Scoping su misura per tutto il resto.",
    intro:
      "Fasce trasparenti quando l’ambito è ripetibile, un brief con prezzi per milestone quando non lo è. Vedi la cifra prima della prima conversazione.",
    availablePackagesLabel: "Pacchetti disponibili",
    serviceAreasLabel: "Aree di servizio",
    packagesKicker: "Pacchetti",
    fallbackPackageLabel: "Pacchetto Studio",
    weeksValue: "{weeks} settimane",
    depositLabel: "Acconto",
    bestForLabel: "Ideale per",
    startWithPackage: "Inizia con questo pacchetto",
    chooseCustomKicker: "Scegli invece il su misura quando",
    chooseCustomTitle:
      "I progetti più grandi o più profondi saltano il pacchetto e vanno dritti al brief.",
    customReason1:
      "Hai bisogno di un portale multi-ruolo, di uno spazio cliente, di una dashboard o di un sistema software specifico per un flusso di lavoro.",
    customReason2:
      "Il progetto combina web, amministrazione, pagamenti, operazioni e automazione in un’unica piattaforma.",
    customReason3:
      "Il prodotto richiede mobile, integrazioni o un percorso architetturale più ponderato di quanto un pacchetto consenta.",
    customReason4:
      "Vuoi che HenryCo definisca l’esperienza esatta invece di adattare le tue esigenze a un template predefinito.",
    moveForwardKicker: "Andare avanti",
    moveForwardTitle: "Scegli un pacchetto adatto, oppure inviaci il brief esatto.",
    openBriefBuilder: "Apri il generatore di brief",
    viewAllServices: "Vedi tutti i servizi",
    enterpriseKicker: "Ambito enterprise o non standard",
    enterpriseTitle:
      "I progetti più grandi, più sensibili o profondamente integrati vengono definiti come un programma su misura.",
    enterpriseBody:
      "Le piattaforme enterprise, le grandi ricostruzioni e le integrazioni complesse vengono quotate e definite in base ai requisiti esatti — non a un template.",
    startCustomProject: "Avvia un progetto su misura",
  },
  process: {
    fallbackPrimaryCta: "Avvia un progetto Studio",
    kicker: "Processo",
    title: "Dal brief al lancio, nulla resta nascosto.",
    intro:
      "Ambito, prezzi, milestone, pagamenti e avanzamento della consegna restano visibili in un unico registro strutturato, dal primo brief alla consegna finale.",
    processKicker: "Processo Studio",
    stepLabel: "Fase {number}",
  },
  teams: {
    kicker: "Team",
    title: "Le persone responsabili del tuo progetto.",
    intro:
      "HenryCo Studio gestisce quattro pod di consegna — ciascuno calibrato su un tipo di lavoro — supportati da un gruppo di leadership con nome che si fa carico di ambito, qualità e data di lancio.",
    leadershipKicker: "Leadership dello Studio",
    leadershipBody:
      "Ogni progetto ha un responsabile con nome di questo gruppo. Saprai chi approva l’ambito, chi risponde quando qualcosa slitta e chi è responsabile del lancio.",
    podsKicker: "Pod di consegna",
    podsBody:
      "Scegli il pod adatto al tuo progetto, oppure invia il brief e lascia che lo Studio ti indirizzi al team giusto.",
    selectTeam: "Seleziona questo team",
    teamDetail: "Dettaglio del team",
  },
  trust: {
    highlightControlsTitle: "Controlli protetti",
    highlightControlsBody:
      "Le azioni sensibili restano dietro controlli di accesso sicuri.",
    highlightVisibilityTitle: "Visibilità delle milestone",
    highlightVisibilityBody:
      "I pagamenti e i checkpoint di consegna restano visibili al cliente.",
    highlightProposalsTitle: "Proposte strutturate",
    highlightProposalsBody:
      "Ogni richiesta diventa una proposta formale con ambito, prezzi e tempistiche chiari.",
    highlightQualityTitle: "Qualità premium",
    highlightQualityBody:
      "Ogni superficie è progettata per risultare ponderata, moderna e all’altezza del tuo investimento.",
    kicker: "Fiducia e trasparenza",
    title: "Fiducia in ogni fase. Per iscritto, nello spazio di lavoro, in banca.",
    intro:
      "Chiarezza dell’ambito, visibilità delle milestone, gestione sicura dei file, checkpoint di pagamento e comunicazione responsabile — strutturati così che tu sappia sempre cosa sta accadendo e cosa viene dopo.",
    principlesKicker: "Quattro principi operativi",
    signalsKicker: "Segnali di fiducia",
    signalsTitle: "Ciò che resta visibile, dal brief alla banca.",
    confidenceKicker: "Fiducia del cliente",
    confidenceTitle: "Ciò che i clienti dicono davvero.",
    whyKicker: "Perché i clienti scelgono HenryCo",
  },
  work: {
    kicker: "Lavori selezionati",
    title: "Il lavoro prima della conversazione.",
    intro:
      "Ogni caso studio copre la sfida di business, l’approccio e l’impatto misurabile. Niente riassunti vaghi — prove che puoi verificare prima di impegnarti.",
    caseStudiesLabel: "Casi studio",
    teamsLabel: "Team",
    servicesLabel: "Servizi",
    viewCaseStudy: "Vedi il caso studio",
  },
};

const ZH: DeepPartial<StudioPublicExtraCopy> = {
  about: {
    kicker: "关于 HenryCo Studio",
    title: "一家以清晰、交付与信任为核心打造的软件工作室。",
    intro:
      "HenryCo Studio 为需要扎实执行、又不想经历混乱开发流程的团队，设计并构建网站、商务体验、内部工具和定制平台。",
    startBriefCta: "开始一份简报",
    viewWorkCta: "查看作品",
    proofServicesLabel: "服务",
    proofPackagesLabel: "套餐",
    proofTeamsLabel: "团队",
    proofCaseStudiesLabel: "案例研究",
    operateKicker: "我们的工作方式",
    principleStructuredTitle: "先结构，后创意",
    principleStructuredBody:
      "每个项目都以让简报、成功标准、约束条件和交付路径清晰可见为起点。",
    principlePremiumTitle: "高端执行",
    principlePremiumBody:
      "设计、工程、文案和上线支持协同推进，而非被当作各自独立的交接环节。",
    principleConfidenceTitle: "客户端的信心",
    principleConfidenceBody:
      "里程碑、文件、发票、凭证上传和项目消息均在 Studio 工作区中可追溯、可问责。",
    deliveryKicker: "交付记录",
    deliveryTitle: "工作室的工作区是服务的一部分，而非附加项。",
    deliveryBody:
      "客户可以在一个受控的工作区中跟踪项目状态、交换消息、查看文件并支付发票。",
  },
  pick: {
    kicker: "由 HenryCo Studio 提供的现成方案",
    title: "选择一个网站。我们在数天内上线定制版本。",
    intro:
      "每个模板都是真实、可投入生产的 HenryCo Studio 网站。真实价格。真实周期。真实范围。我们将其贴合你的品牌与内容，然后上线。",
    customBriefCta: "需要定制？打开自由简报",
    compareBandsCta: "比较套餐档位",
    templatesLabel: "模板",
    startsFromLabel: "起价",
    fastestLaunchLabel: "最快上线",
    categoriesLabel: "分类",
    daysValue: "{days} 天",
    templateCountOne: "{count} 个模板",
    templateCountMany: "{count} 个模板",
    cardPriceLabel: "价格",
    cardReadyInLabel: "就绪时间",
    cardOftenForLabel: "常用于",
    cardMorePages: "+ 另外 {count} 个",
    cardViewTemplate: "查看模板",
    cardWeekLaunch: "{weeks} 周上线",
    ctaKicker: "没有合适的？描述你真正需要的。",
    ctaTitle:
      "定制开发采用同样的里程碑纪律——并完全跳过模板。",
    ctaBody:
      "多角色门户、定制软件、深度集成：我们依据你的需求确定范围，而不是让你去迁就某个模板。简报大约需要八分钟，并返回参考报价。",
    ctaButton: "描述一个完全定制的开发",
  },
  pickDetail: {
    backToTemplates: "全部模板",
    fallbackCategory: "Studio 模板",
    payDepositStart: "支付 {percent}% 定金并开始",
    viewLiveDemo: "查看在线演示",
    customiseBriefFirst: "先定制简报",
    priceLabel: "价格",
    readyInLabel: "就绪时间",
    buildWindowLabel: "开发周期",
    depositLabel: "定金",
    readyInDays: "{days} 天",
    buildWindowWeeks: "{weeks} 周",
    oftenForLabel: "常用于：",
    badgeReadyInDays: "{days} 天",
    paymentPlanLabel: "付款计划",
    depositOnAccept: "接受时支付定金",
    balanceAtLaunch: "上线时支付尾款",
    totalLabel: "总计",
    paymentNote:
      "通过 Paystack / Flutterwave 进行银行转账或刷卡。财务确认后即刻开具品牌收据。",
    pagesIncludedLabel: "包含的页面",
    featuresBuiltInLabel: "内置功能",
    outcomesLabel: "你可以期待的成果",
    techStackLabel: "技术栈",
    stackNote:
      "你可以在简报中指定不同的技术栈——如果它改变了开发工作量，HenryCo 会就差额报价；如果没有改变，则免费尊重你的选择。",
    moveForwardKicker: "继续推进",
    moveForwardTitle: "定制此模板，并在 {days} 天内上线。",
    moveForwardBody:
      "简报大约需要八分钟。我们确认范围，发送按里程碑定价的方案，并在你的定金到账后立即开始工作。",
    payDepositStartShort: "支付定金并开始",
    talkToLead: "与 Studio 负责人交流",
    relatedKicker: "其他 {category} 模板",
    relatedTitle: "比较相近的现成路径。",
  },
  policyDetail: {
    backToPolicies: "全部政策",
    effectiveFromLabel: "生效日期",
    lastReviewedLabel: "最近审阅",
    governingLawLabel: "适用法律",
    continueReadingKicker: "继续阅读",
    continueReadingTitle:
      "管辖 HenryCo Studio 合作的其他协议。",
  },
  pricing: {
    kicker: "套餐与定价",
    title: "为常见项目提供清晰套餐。其余一切均按定制范围报价。",
    intro:
      "范围可复用时采用透明档位，范围不可复用时则用按里程碑定价的简报。你在第一次沟通前就能看到数字。",
    availablePackagesLabel: "可选套餐",
    serviceAreasLabel: "服务领域",
    packagesKicker: "套餐",
    fallbackPackageLabel: "Studio 套餐",
    weeksValue: "{weeks} 周",
    depositLabel: "定金",
    bestForLabel: "最适合",
    startWithPackage: "从此套餐开始",
    chooseCustomKicker: "在以下情况改选定制",
    chooseCustomTitle:
      "规模更大或更深入的开发会跳过套餐，直接进入简报。",
    customReason1:
      "你需要多角色门户、客户工作区、仪表板或特定工作流的软件系统。",
    customReason2:
      "项目将网站、后台管理、支付、运营和自动化整合到一个平台中。",
    customReason3:
      "产品需要移动端、集成，或比套餐所能容纳的更审慎的架构路径。",
    customReason4:
      "你希望 HenryCo 界定确切的体验，而不是把你的需求硬塞进预设模板。",
    moveForwardKicker: "继续推进",
    moveForwardTitle: "选择一个合适的套餐，或把确切的简报发给我们。",
    openBriefBuilder: "打开简报生成器",
    viewAllServices: "查看全部服务",
    enterpriseKicker: "企业级或非标准范围",
    enterpriseTitle:
      "规模更大、更敏感或深度集成的开发，将作为定制项目来界定范围。",
    enterpriseBody:
      "企业级平台、大型重建和复杂集成均按确切需求定价并界定范围——而非套用模板。",
    startCustomProject: "启动定制项目",
  },
  process: {
    fallbackPrimaryCta: "启动一个 Studio 项目",
    kicker: "流程",
    title: "从简报到上线，一切都不隐藏。",
    intro:
      "范围、定价、里程碑、付款和交付进度，从第一份简报到最终交接，都在一份结构化的记录中保持可见。",
    processKicker: "Studio 流程",
    stepLabel: "第 {number} 步",
  },
  teams: {
    kicker: "团队",
    title: "对你的项目负责的人。",
    intro:
      "HenryCo Studio 运营四个交付小组——每个都针对一类工作进行调校——并由一支具名领导团队支撑，负责范围、质量和上线日期。",
    leadershipKicker: "Studio 领导团队",
    leadershipBody:
      "每个项目都有来自该团队的具名负责人。你会知道谁审批范围、谁在出现延误时回应，以及谁为上线负责。",
    podsKicker: "交付小组",
    podsBody:
      "选择适合你项目的小组，或提交简报，让 Studio 为你匹配合适的团队。",
    selectTeam: "选择此团队",
    teamDetail: "团队详情",
  },
  trust: {
    highlightControlsTitle: "受保护的控制",
    highlightControlsBody:
      "敏感操作始终置于安全的访问控制之后。",
    highlightVisibilityTitle: "里程碑可见性",
    highlightVisibilityBody:
      "付款和交付检查点对客户始终可见。",
    highlightProposalsTitle: "结构化方案",
    highlightProposalsBody:
      "每一次咨询都会变成一份正式方案，范围、定价和时间表都清晰明确。",
    highlightQualityTitle: "高端品质",
    highlightQualityBody:
      "每个界面都经过设计，力求显得考究、现代，并配得上你的投入。",
    kicker: "信任与透明",
    title: "每个阶段都让你安心。落在文字里、工作区里、账户里。",
    intro:
      "范围清晰、里程碑可见、文件安全处理、付款检查点以及负责任的沟通——经过结构化设计，让你始终知道正在发生什么以及接下来会怎样。",
    principlesKicker: "四项运营原则",
    signalsKicker: "信任信号",
    signalsTitle: "从简报到账户始终可见的内容。",
    confidenceKicker: "客户信心",
    confidenceTitle: "客户真实的评价。",
    whyKicker: "客户为何选择 HenryCo",
  },
  work: {
    kicker: "精选作品",
    title: "对话之前，先看作品。",
    intro:
      "每个案例研究都涵盖业务挑战、方法和可衡量的影响。没有含糊的概述——是你在投入前可以核实的证据。",
    caseStudiesLabel: "案例研究",
    teamsLabel: "团队",
    servicesLabel: "服务",
    viewCaseStudy: "查看案例研究",
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<StudioPublicExtraCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
};
// ig, yo, ha, hi are intentionally OMITTED -> fall back to EN (human-translation only).

export function getStudioPublicExtraCopy(locale: AppLocale): StudioPublicExtraCopy {
  const o = LOCALE_MAP[locale];
  if (o)
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      o as unknown as Record<string, unknown>,
    ) as unknown as StudioPublicExtraCopy;
  return EN;
}
