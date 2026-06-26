import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

export type StudioRequestCopy = {
  copilot: {
    examplePrompts: {
      logisticsLabel: string;
      logisticsBody: string;
      investmentLabel: string;
      investmentBody: string;
      opsLabel: string;
      opsBody: string;
    };
    kicker: string;
    heading: string;
    intro: string;
    describeLabel: string;
    placeholder: string;
    tip: string;
    charactersLeft: (count: number) => string;
    trim: string;
    starterPointsLabel: string;
    exampleBadge: string;
    seededBelow: string;
    footerNote: string;
    tryDifferentParagraph: string;
    draftingBrief: string;
    redraftBrief: string;
    draftMyBrief: string;
    coPilotDraft: string;
    confidence: (pct: number) => string;
    cacheHit: string;
    fieldProjectType: string;
    fieldBudgetBand: string;
    fieldUrgency: string;
    fieldDesignDirection: string;
    fieldPages: string;
    fieldFeatures: string;
    worthClarifying: string;
    seededControl: string;
    reapplyToBrief: string;
    callsRemaining: (count: number, noun: string) => string;
    draftSingular: string;
    draftPlural: string;
    nextSteps: string;
    reviewRefineTitle: string;
    reviewRefineBody: string;
    talkToLeadTitle: string;
    submitLockTitle: string;
    talkToLeadBody: string;
    submitLockBody: string;
    skipTemplateTitle: string;
    payDepositTitle: string;
    skipTemplateBody: string;
    payDepositBody: string;
    emptyDash: string;
  };
  activation: {
    outcomePoint1: string;
    outcomePoint2: string;
    outcomePoint3: string;
    teamRecommendPlaceholder: string;
    reviewSend: string;
    teamFit: string;
    preferredTeam: string;
    matchStrongest: string;
    fullName: string;
    companyOptional: string;
    bestEmail: string;
    whatsappOrPhone: string;
    depositConsent: string;
    whatHappensTitle: string;
    nothingGoesLive: string;
    submitLabel: string;
    submitPendingLabel: string;
  };
  builder: {
    loading: string;
    loadingNextStep: string;
    continueLabel: string;
    back: string;
    projectBrief: string;
    stepProgress: (current: string, total: string) => string;
    percentComplete: (pct: number) => string;
    progressSaved: string;
    teamRecommendationFallback: string;
  };
  landing: {
    copilotKicker: string;
    copilotTitle: string;
    copilotSummary: string;
    copilotHint: string;
    customKicker: string;
    customTitle: string;
    customSummary: string;
    customHint: string;
    draftWithCopilotHeading: string;
    buildOwnBriefHeading: string;
    customIntro: string;
    switchBriefPath: string;
    briefPathFallbackKicker: string;
    briefPathFallbackTitle: string;
    copilotPill: string;
    customPill: string;
    howToStart: string;
    skipBriefKicker: string;
    browseTemplates: (count: number) => string;
    eachTemplateShips: string;
    browseTemplatesLink: string;
  };
  commercial: {
    budgetLabel: string;
    budgetPlaceholder: string;
    budgetHint: string;
    includedLabel: string;
    commercialContext: string;
    intro: string;
    seniorTeamTitle: string;
    seniorTeamBody: string;
    fixedPriceTitle: string;
    fixedPriceBody: string;
    premiumDeliveryTitle: string;
    premiumDeliveryBody: string;
    businessTypeLabel: string;
    businessTypePlaceholder: string;
    urgencyLabel: string;
    urgencyPlaceholder: string;
    timelineLabel: string;
    timelinePlaceholder: string;
    goalsLabel: string;
    goalsPlaceholder: string;
    scopeNotesLabel: string;
    scopeNotesPlaceholder: string;
    inspirationLabel: string;
    inspirationPlaceholder: string;
  };
  path: {
    includedLabel: string;
    buyingLane: string;
    packageTitle: string;
    packageBody: string;
    customTitle: string;
    customBody: string;
    noPackage: string;
    depositSuffix: (pct: number) => string;
    projectTypeTitle: string;
    optionsCount: (count: number) => string;
    projectTypePlaceholder: string;
    deliveryPlatformTitle: string;
    platformPlaceholder: string;
    designDirectionTitle: string;
    designPlaceholder: string;
    contentLanguageTitle: string;
    languagePlaceholder: string;
    languageEnglish: string;
    languageFrench: string;
    languageArabic: string;
    languagePortuguese: string;
  };
  scope: {
    includedLabel: string;
    selectedCount: (selected: number, total: number) => string;
    noneSelected: string;
    moreCount: (count: number) => string;
    packageContext: string;
    packageModeBody: string;
    pagesTitle: string;
    pagesIntro: string;
    pagesKicker: string;
    featuresTitle: string;
    featuresIntro: string;
    featuresKicker: string;
    techStackTitle: string;
    techStackIntro: string;
    programmingLanguageLabel: string;
    chooseLanguage: string;
    frameworkLabel: string;
    chooseFramework: string;
    backendLabel: string;
    chooseBackend: string;
    hostingLabel: string;
    chooseHost: string;
    stackPhilosophyKicker: string;
    stackPhilosophyHint: string;
    addOnsTitle: string;
    addOnsIntro: string;
    addOnsKicker: string;
  };
};

const EN: StudioRequestCopy = {
  copilot: {
    examplePrompts: {
      logisticsLabel: "Logistics SaaS",
      logisticsBody:
        "A logistics SaaS for last-mile delivery in Lagos. Couriers track jobs on a mobile app while dispatchers assign and reroute from a web dashboard. We need a customer-facing order page, courier mobile UX, dispatcher console, payments, and analytics. Launch within ten weeks.",
      investmentLabel: "Members investment platform",
      investmentBody:
        "A members-only investment platform for accredited Nigerian investors. People apply, sign documents, fund their account by bank transfer, and view performance updates monthly. Strong KYC, two-factor auth, and an admin compliance dashboard. We want a clean, restrained, executive feel. Budget around eight to fifteen million naira.",
      opsLabel: "Internal ops tool",
      opsBody:
        "An internal ops tool for our 30-person agency. Project intake, milestone tracking, time logs, invoicing, and a client portal. Has to integrate with our existing accounting package. Should feel calm and not overwhelming. Soft launch in six weeks.",
    },
    kicker: "Brief Co-pilot · Studio Intelligence",
    heading: "Describe what you want in your own words. We’ll structure it.",
    intro:
      "One paragraph is enough — goals, audience, key features, any constraints. The co-pilot drafts the rest of the brief; every field stays editable below before you submit.",
    describeLabel: "Describe your project",
    placeholder:
      "A logistics SaaS for last-mile delivery in Lagos. Couriers track jobs on a mobile app while dispatchers assign and reroute from a web dashboard…",
    tip: "Tip: under 8 sentences works best.",
    charactersLeft: (count: number) => `${count} characters left`,
    trim: "Trim a little",
    starterPointsLabel: "Try one of these starting points",
    exampleBadge: "Example",
    seededBelow: "Brief seeded below — review every field before you submit.",
    footerNote:
      "Free for early users · Powered by HenryCo Studio Intelligence · Your text is never used to train external models.",
    tryDifferentParagraph: "Try a different paragraph",
    draftingBrief: "Drafting your brief…",
    redraftBrief: "Re-draft brief",
    draftMyBrief: "Draft my brief",
    coPilotDraft: "Co-pilot draft",
    confidence: (pct: number) => `Confidence ${pct}%`,
    cacheHit: "Cache hit · faster & cheaper",
    fieldProjectType: "Project type",
    fieldBudgetBand: "Budget band",
    fieldUrgency: "Urgency",
    fieldDesignDirection: "Design direction",
    fieldPages: "Pages / sections",
    fieldFeatures: "Required features",
    worthClarifying: "Worth clarifying as you scroll down",
    seededControl:
      "The brief below is now seeded with these answers. You can edit anything before you submit — you stay in control.",
    reapplyToBrief: "Re-apply to brief below",
    callsRemaining: (count: number, noun: string) => `${count} co-pilot ${noun} left in this window.`,
    draftSingular: "draft",
    draftPlural: "drafts",
    nextSteps: "Next steps",
    reviewRefineTitle: "Review & refine the brief",
    reviewRefineBody: "Every field stays editable below.",
    talkToLeadTitle: "Talk to a Studio lead first",
    submitLockTitle: "Submit & lock the scope",
    talkToLeadBody:
      "A few details still need clarifying — a senior lead can shape the brief with you in 15 minutes.",
    submitLockBody:
      "Submit the brief; we issue a fixed-price proposal and a deposit invoice within a business day.",
    skipTemplateTitle: "Or skip — pay deposit on a template",
    payDepositTitle: "Pay a deposit & start",
    skipTemplateBody:
      "Ready-made templates ship in days. Browse the gallery if you want to skip the brief entirely.",
    payDepositBody:
      "Reserve your slot now — we open the project workspace the moment your deposit clears.",
    emptyDash: "—",
  },
  activation: {
    outcomePoint1:
      "Your domain choices from the last step travel with the brief—we confirm registration and DNS with you before launch.",
    outcomePoint2:
      "You receive a real Studio record: proposal, workspace, and payment checkpoints—not a forgotten form submission.",
    outcomePoint3:
      "Deposits secure your slot; proof upload keeps finance fast; milestones and files stay in one client-grade portal.",
    teamRecommendPlaceholder: "Let HenryCo recommend the best-fit team",
    reviewSend: "Review & send",
    teamFit: "Team fit",
    preferredTeam: "Preferred team",
    matchStrongest:
      "We will match the strongest team to your brief based on scope, urgency, and your industry signals.",
    fullName: "Full name",
    companyOptional: "Company, school, or brand (optional)",
    bestEmail: "Best email for updates",
    whatsappOrPhone: "WhatsApp or phone (helps for quick clarifications)",
    depositConsent:
      "I am ready to secure a deposit-backed lane as soon as HenryCo confirms scope and pricing with me.",
    whatHappensTitle: "What happens after submission",
    nothingGoesLive:
      "Nothing goes live until you approve scope and payment. You can still adjust references or contact details with your lead before the deposit lands—this submission only opens your structured Studio record.",
    submitLabel: "Submit Studio brief",
    submitPendingLabel: "Building your Studio brief...",
  },
  builder: {
    loading: "Loading",
    loadingNextStep: "Loading next step",
    continueLabel: "Continue",
    back: "Back",
    projectBrief: "Project brief",
    stepProgress: (current: string, total: string) => `Step ${current} / ${total}`,
    percentComplete: (pct: number) => `${pct}% complete`,
    progressSaved: "Progress saved — you can leave and return any time while signed in.",
    teamRecommendationFallback: "HenryCo team recommendation",
  },
  landing: {
    copilotKicker: "Quickest start",
    copilotTitle: "Draft with the Co-pilot",
    copilotSummary:
      "Describe what you want in a paragraph. The co-pilot drafts every field of the brief and shows pricing while you review.",
    copilotHint: "About 30 seconds",
    customKicker: "Most control",
    customTitle: "Build your own brief",
    customSummary:
      "Step through the manual builder. Every choice updates pricing live. Best when you already know your stack and scope.",
    customHint: "4 calm steps",
    draftWithCopilotHeading: "Draft with the co-pilot",
    buildOwnBriefHeading: "Build your own brief",
    customIntro:
      "Step through every choice. Pricing updates live in the side panel as you select scope, platform, timeline, and team. You can switch back to the co-pilot at any time without losing your place.",
    switchBriefPath: "Switch brief path",
    briefPathFallbackKicker: "Brief path",
    briefPathFallbackTitle: "Build your brief",
    copilotPill: "Co-pilot",
    customPill: "Custom",
    howToStart: "How would you like to start your brief?",
    skipBriefKicker: "Or skip the brief — pay the deposit and start",
    browseTemplates: (count: number) =>
      `Browse ${count} ready-made templates with real prices, real timelines.`,
    eachTemplateShips:
      "Each template ships in days. Pay the deposit on the template page and we start the moment payment clears.",
    browseTemplatesLink: "Browse templates",
  },
  commercial: {
    budgetLabel: "Project budget · NGN",
    budgetPlaceholder: "₦1,500,000",
    budgetHint: "Fixed price. Locked at proposal acceptance — no surprise overages.",
    includedLabel: "Included",
    commercialContext: "Commercial context",
    intro:
      "Tell us the budget and the outcome. We come back inside one business day with a fixed scope, a fixed delivery window, and a senior lead assigned by name — no junior hand-offs, no scope drift.",
    seniorTeamTitle: "Senior team",
    seniorTeamBody: "strategist, designer, and engineer kick off together; never juniors-only.",
    fixedPriceTitle: "Fixed price",
    fixedPriceBody: "locked at proposal acceptance. Change requests priced before they start.",
    premiumDeliveryTitle: "Premium delivery",
    premiumDeliveryBody: "production-ready code, accessibility-checked, ready to scale on day one.",
    businessTypeLabel: "Business type",
    businessTypePlaceholder: "Select business type",
    urgencyLabel: "Urgency",
    urgencyPlaceholder: "Select urgency",
    timelineLabel: "Timeline expectation",
    timelinePlaceholder: "Select timeline",
    goalsLabel: "What should this achieve?",
    goalsPlaceholder: "e.g. More qualified leads, calmer operations, clearer client onboarding…",
    scopeNotesLabel: "What needs to exist when we are done?",
    scopeNotesPlaceholder:
      "Pages, features, integrations, languages, admin tools—bullet points are fine.",
    inspirationLabel: "Anything else we should study?",
    inspirationPlaceholder:
      "Tone, audience, things to avoid, brand words you love, or “make it feel like X but more premium.”",
  },
  path: {
    includedLabel: "Included",
    buyingLane: "Buying lane",
    packageTitle: "Package",
    packageBody: "Predefined lane",
    customTitle: "Custom",
    customBody: "Tailored scope",
    noPackage:
      "No fixed package is available for this service yet. Switch to the custom project route.",
    depositSuffix: (pct: number) => `${pct}% deposit`,
    projectTypeTitle: "Project type or category",
    optionsCount: (count: number) => `${count} options`,
    projectTypePlaceholder: "Choose project type…",
    deliveryPlatformTitle: "Delivery platform",
    platformPlaceholder: "Choose platform…",
    designDirectionTitle: "Design direction",
    designPlaceholder: "Choose design direction…",
    contentLanguageTitle: "Project/content language",
    languagePlaceholder: "Choose language…",
    languageEnglish: "English",
    languageFrench: "French",
    languageArabic: "Arabic",
    languagePortuguese: "Portuguese",
  },
  scope: {
    includedLabel: "Included",
    selectedCount: (selected: number, total: number) => `${selected}/${total} selected`,
    noneSelected: "None selected yet",
    moreCount: (count: number) => `+${count}`,
    packageContext: "Package context",
    packageModeBody:
      "Package mode keeps the core lane cleaner. Skip the page list — the package already covers it. Tick add-ons or pin a tech stack below if it matters for your team.",
    pagesTitle: "Pages or sections",
    pagesIntro:
      "Tick the pages this site needs at launch. Each page is priced individually so the proposal is line-itemised — nothing hidden.",
    pagesKicker: "Pages",
    featuresTitle: "Required features",
    featuresIntro:
      "What does the product need to do for users on day one? Pick what’s non-negotiable; we’ll suggest sensible additions during proposal review.",
    featuresKicker: "Features",
    techStackTitle: "Tech stack",
    techStackIntro:
      "Tell us your preferences. We’ll honour them where it serves the project, push back honestly where a different choice would serve you better. Cost deltas are shown — most picks are zero-delta.",
    programmingLanguageLabel: "Preferred programming language",
    chooseLanguage: "Choose language…",
    frameworkLabel: "Frontend / app framework",
    chooseFramework: "Choose framework…",
    backendLabel: "Backend / data platform",
    chooseBackend: "Choose backend…",
    hostingLabel: "Hosting / deployment",
    chooseHost: "Choose host…",
    stackPhilosophyKicker: "Stack philosophy",
    stackPhilosophyHint: "Pick zero or many",
    addOnsTitle: "Add-on services",
    addOnsIntro: "Optional supporting work. Skip what’s not needed — pricing recalculates live.",
    addOnsKicker: "Add-ons",
  },
};

const FR: DeepPartial<StudioRequestCopy> = {
  copilot: {
    examplePrompts: {
      logisticsLabel: "SaaS logistique",
      logisticsBody:
        "Un SaaS logistique pour la livraison du dernier kilomètre à Lagos. Les coursiers suivent leurs missions sur une application mobile pendant que les répartiteurs attribuent et réacheminent depuis un tableau de bord web. Nous avons besoin d'une page de commande côté client, d'une UX mobile pour coursiers, d'une console de répartition, de paiements et d'analyses. Lancement sous dix semaines.",
      investmentLabel: "Plateforme d'investissement pour membres",
      investmentBody:
        "Une plateforme d'investissement réservée aux membres, pour des investisseurs nigérians accrédités. Les utilisateurs postulent, signent des documents, alimentent leur compte par virement bancaire et consultent des rapports de performance chaque mois. KYC robuste, authentification à deux facteurs et un tableau de bord de conformité pour l'administration. Nous voulons un rendu épuré, sobre et exécutif. Budget d'environ huit à quinze millions de nairas.",
      opsLabel: "Outil interne d'exploitation",
      opsBody:
        "Un outil interne d'exploitation pour notre agence de 30 personnes. Réception des projets, suivi des jalons, feuilles de temps, facturation et un portail client. Doit s'intégrer à notre logiciel comptable existant. Doit rester apaisant et ne pas submerger. Lancement progressif dans six semaines.",
    },
    kicker: "Co-pilote de brief · Studio Intelligence",
    heading: "Décrivez ce que vous voulez avec vos propres mots. Nous le structurons.",
    intro:
      "Un paragraphe suffit — objectifs, public, fonctionnalités clés, contraintes éventuelles. Le co-pilote rédige le reste du brief ; chaque champ reste modifiable ci-dessous avant l'envoi.",
    describeLabel: "Décrivez votre projet",
    placeholder:
      "Un SaaS logistique pour la livraison du dernier kilomètre à Lagos. Les coursiers suivent leurs missions sur une application mobile pendant que les répartiteurs attribuent et réacheminent depuis un tableau de bord web…",
    tip: "Astuce : moins de 8 phrases fonctionne le mieux.",
    charactersLeft: (count: number) => `${count} caractères restants`,
    trim: "Raccourcissez un peu",
    starterPointsLabel: "Essayez l'un de ces points de départ",
    exampleBadge: "Exemple",
    seededBelow: "Brief pré-rempli ci-dessous — vérifiez chaque champ avant l'envoi.",
    footerNote:
      "Gratuit pour les premiers utilisateurs · Propulsé par HenryCo Studio Intelligence · Votre texte n'est jamais utilisé pour entraîner des modèles externes.",
    tryDifferentParagraph: "Essayer un autre paragraphe",
    draftingBrief: "Rédaction de votre brief…",
    redraftBrief: "Refaire le brief",
    draftMyBrief: "Rédiger mon brief",
    coPilotDraft: "Brouillon du co-pilote",
    confidence: (pct: number) => `Confiance ${pct}%`,
    cacheHit: "Cache utilisé · plus rapide et moins cher",
    fieldProjectType: "Type de projet",
    fieldBudgetBand: "Tranche de budget",
    fieldUrgency: "Urgence",
    fieldDesignDirection: "Direction artistique",
    fieldPages: "Pages / sections",
    fieldFeatures: "Fonctionnalités requises",
    worthClarifying: "À clarifier en faisant défiler vers le bas",
    seededControl:
      "Le brief ci-dessous est désormais pré-rempli avec ces réponses. Vous pouvez tout modifier avant l'envoi — vous gardez le contrôle.",
    reapplyToBrief: "Réappliquer au brief ci-dessous",
    callsRemaining: (count: number, noun: string) => `${count} ${noun} du co-pilote restant(s) sur cette période.`,
    draftSingular: "brouillon",
    draftPlural: "brouillons",
    nextSteps: "Prochaines étapes",
    reviewRefineTitle: "Relire et affiner le brief",
    reviewRefineBody: "Chaque champ reste modifiable ci-dessous.",
    talkToLeadTitle: "Parlez d'abord à un responsable Studio",
    submitLockTitle: "Envoyer et verrouiller le périmètre",
    talkToLeadBody:
      "Quelques détails restent à clarifier — un responsable senior peut façonner le brief avec vous en 15 minutes.",
    submitLockBody:
      "Envoyez le brief ; nous émettons une proposition à prix fixe et une facture d'acompte sous un jour ouvré.",
    skipTemplateTitle: "Ou passez — payez l'acompte sur un modèle",
    payDepositTitle: "Payer un acompte et démarrer",
    skipTemplateBody:
      "Les modèles prêts à l'emploi sont livrés en quelques jours. Parcourez la galerie si vous voulez éviter le brief entièrement.",
    payDepositBody:
      "Réservez votre créneau dès maintenant — nous ouvrons l'espace de projet dès que votre acompte est encaissé.",
    emptyDash: "—",
  },
  activation: {
    outcomePoint1:
      "Vos choix de domaine de l'étape précédente accompagnent le brief — nous confirmons l'enregistrement et le DNS avec vous avant le lancement.",
    outcomePoint2:
      "Vous recevez un véritable dossier Studio : proposition, espace de travail et points de paiement — pas un formulaire oublié.",
    outcomePoint3:
      "Les acomptes sécurisent votre créneau ; le téléversement des justificatifs accélère la finance ; jalons et fichiers restent dans un même portail de qualité client.",
    teamRecommendPlaceholder: "Laisser HenryCo recommander l'équipe la mieux adaptée",
    reviewSend: "Relire et envoyer",
    teamFit: "Adéquation de l'équipe",
    preferredTeam: "Équipe préférée",
    matchStrongest:
      "Nous attribuerons l'équipe la plus solide à votre brief selon le périmètre, l'urgence et les signaux de votre secteur.",
    fullName: "Nom complet",
    companyOptional: "Entreprise, école ou marque (facultatif)",
    bestEmail: "Meilleur e-mail pour les mises à jour",
    whatsappOrPhone: "WhatsApp ou téléphone (utile pour des précisions rapides)",
    depositConsent:
      "Je suis prêt à sécuriser une voie adossée à un acompte dès que HenryCo confirme le périmètre et le tarif avec moi.",
    whatHappensTitle: "Ce qui se passe après l'envoi",
    nothingGoesLive:
      "Rien n'est mis en ligne tant que vous n'avez pas approuvé le périmètre et le paiement. Vous pouvez encore ajuster les références ou vos coordonnées avec votre responsable avant le versement de l'acompte — cet envoi ne fait qu'ouvrir votre dossier Studio structuré.",
    submitLabel: "Envoyer le brief Studio",
    submitPendingLabel: "Construction de votre brief Studio...",
  },
  builder: {
    loading: "Chargement",
    loadingNextStep: "Chargement de l'étape suivante",
    continueLabel: "Continuer",
    back: "Retour",
    projectBrief: "Brief du projet",
    stepProgress: (current: string, total: string) => `Étape ${current} / ${total}`,
    percentComplete: (pct: number) => `${pct}% terminé`,
    progressSaved:
      "Progression enregistrée — vous pouvez partir et revenir à tout moment en restant connecté.",
    teamRecommendationFallback: "Recommandation d'équipe HenryCo",
  },
  commercial: {
    budgetLabel: "Budget du projet · NGN",
    budgetPlaceholder: "₦1,500,000",
    budgetHint:
      "Prix fixe. Verrouillé à l'acceptation de la proposition — aucun dépassement surprise.",
    includedLabel: "Inclus",
    commercialContext: "Contexte commercial",
    intro:
      "Indiquez-nous le budget et le résultat attendu. Nous revenons sous un jour ouvré avec un périmètre fixe, une fenêtre de livraison fixe et un responsable senior assigné nommément — pas de transfert à un junior, pas de dérive de périmètre.",
    seniorTeamTitle: "Équipe senior",
    seniorTeamBody:
      "stratège, designer et ingénieur démarrent ensemble ; jamais uniquement des juniors.",
    fixedPriceTitle: "Prix fixe",
    fixedPriceBody:
      "verrouillé à l'acceptation de la proposition. Les demandes de modification sont chiffrées avant de commencer.",
    premiumDeliveryTitle: "Livraison premium",
    premiumDeliveryBody:
      "code prêt pour la production, accessibilité vérifiée, prêt à passer à l'échelle dès le premier jour.",
    businessTypeLabel: "Type d'activité",
    businessTypePlaceholder: "Sélectionnez le type d'activité",
    urgencyLabel: "Urgence",
    urgencyPlaceholder: "Sélectionnez l'urgence",
    timelineLabel: "Délai souhaité",
    timelinePlaceholder: "Sélectionnez le délai",
    goalsLabel: "Que doit accomplir ce projet ?",
    goalsPlaceholder:
      "ex. Plus de prospects qualifiés, des opérations plus sereines, une intégration client plus claire…",
    scopeNotesLabel: "Que doit-il exister une fois terminé ?",
    scopeNotesPlaceholder:
      "Pages, fonctionnalités, intégrations, langues, outils d'administration — des puces suffisent.",
    inspirationLabel: "Autre chose à étudier ?",
    inspirationPlaceholder:
      "Ton, public, choses à éviter, mots de marque que vous aimez, ou « faites en sorte que ça ressemble à X mais en plus premium ».",
  },
  path: {
    includedLabel: "Inclus",
    buyingLane: "Voie d'achat",
    packageTitle: "Forfait",
    packageBody: "Voie prédéfinie",
    customTitle: "Sur mesure",
    customBody: "Périmètre personnalisé",
    noPackage:
      "Aucun forfait fixe n'est encore disponible pour ce service. Passez à la voie projet sur mesure.",
    depositSuffix: (pct: number) => `${pct}% d'acompte`,
    projectTypeTitle: "Type ou catégorie de projet",
    optionsCount: (count: number) => `${count} options`,
    projectTypePlaceholder: "Choisissez le type de projet…",
    deliveryPlatformTitle: "Plateforme de livraison",
    platformPlaceholder: "Choisissez la plateforme…",
    designDirectionTitle: "Direction artistique",
    designPlaceholder: "Choisissez la direction artistique…",
    contentLanguageTitle: "Langue du projet/contenu",
    languagePlaceholder: "Choisissez la langue…",
    languageEnglish: "Anglais",
    languageFrench: "Français",
    languageArabic: "Arabe",
    languagePortuguese: "Portugais",
  },
  scope: {
    includedLabel: "Inclus",
    selectedCount: (selected: number, total: number) => `${selected}/${total} sélectionné(s)`,
    noneSelected: "Aucun sélectionné pour l'instant",
    moreCount: (count: number) => `+${count}`,
    packageContext: "Contexte du forfait",
    packageModeBody:
      "Le mode forfait garde la voie principale plus épurée. Ignorez la liste des pages — le forfait les couvre déjà. Cochez des options ou épinglez une stack technique ci-dessous si cela compte pour votre équipe.",
    pagesTitle: "Pages ou sections",
    pagesIntro:
      "Cochez les pages dont ce site a besoin au lancement. Chaque page est tarifée individuellement pour que la proposition soit détaillée par ligne — rien de caché.",
    pagesKicker: "Pages",
    featuresTitle: "Fonctionnalités requises",
    featuresIntro:
      "Que doit faire le produit pour les utilisateurs dès le premier jour ? Choisissez ce qui est non négociable ; nous proposerons des ajouts sensés lors de la revue de proposition.",
    featuresKicker: "Fonctionnalités",
    techStackTitle: "Stack technique",
    techStackIntro:
      "Indiquez-nous vos préférences. Nous les respecterons là où cela sert le projet, et nous contesterons honnêtement là où un autre choix vous servirait mieux. Les écarts de coût sont affichés — la plupart des choix sont sans surcoût.",
    programmingLanguageLabel: "Langage de programmation préféré",
    chooseLanguage: "Choisissez le langage…",
    frameworkLabel: "Framework frontend / application",
    chooseFramework: "Choisissez le framework…",
    backendLabel: "Backend / plateforme de données",
    chooseBackend: "Choisissez le backend…",
    hostingLabel: "Hébergement / déploiement",
    chooseHost: "Choisissez l'hébergeur…",
    stackPhilosophyKicker: "Philosophie de la stack",
    stackPhilosophyHint: "Choisissez aucun ou plusieurs",
    addOnsTitle: "Services complémentaires",
    addOnsIntro:
      "Travail de soutien optionnel. Ignorez ce qui n'est pas nécessaire — la tarification se recalcule en direct.",
    addOnsKicker: "Compléments",
  },
};

const ES: DeepPartial<StudioRequestCopy> = {
  copilot: {
    examplePrompts: {
      logisticsLabel: "SaaS de logística",
      logisticsBody:
        "Un SaaS de logística para entregas de última milla en Lagos. Los mensajeros siguen sus trabajos en una app móvil mientras los despachadores asignan y reencaminan desde un panel web. Necesitamos una página de pedidos para clientes, una UX móvil para mensajeros, una consola de despacho, pagos y analíticas. Lanzamiento en diez semanas.",
      investmentLabel: "Plataforma de inversión para miembros",
      investmentBody:
        "Una plataforma de inversión exclusiva para miembros, dirigida a inversores nigerianos acreditados. Las personas se postulan, firman documentos, financian su cuenta por transferencia bancaria y consultan informes de rendimiento cada mes. KYC sólido, autenticación de dos factores y un panel de cumplimiento para administración. Queremos un aspecto limpio, sobrio y ejecutivo. Presupuesto de entre ocho y quince millones de nairas aproximadamente.",
      opsLabel: "Herramienta interna de operaciones",
      opsBody:
        "Una herramienta interna de operaciones para nuestra agencia de 30 personas. Recepción de proyectos, seguimiento de hitos, registros de tiempo, facturación y un portal de clientes. Debe integrarse con nuestro paquete contable actual. Debe sentirse tranquila y no abrumar. Lanzamiento suave en seis semanas.",
    },
    kicker: "Copiloto de brief · Studio Intelligence",
    heading: "Describe lo que quieres con tus propias palabras. Nosotros lo estructuramos.",
    intro:
      "Un párrafo basta — objetivos, público, funciones clave, cualquier restricción. El copiloto redacta el resto del brief; cada campo queda editable abajo antes de enviar.",
    describeLabel: "Describe tu proyecto",
    placeholder:
      "Un SaaS de logística para entregas de última milla en Lagos. Los mensajeros siguen sus trabajos en una app móvil mientras los despachadores asignan y reencaminan desde un panel web…",
    tip: "Consejo: menos de 8 frases funciona mejor.",
    charactersLeft: (count: number) => `${count} caracteres restantes`,
    trim: "Recorta un poco",
    starterPointsLabel: "Prueba uno de estos puntos de partida",
    exampleBadge: "Ejemplo",
    seededBelow: "Brief precargado abajo — revisa cada campo antes de enviar.",
    footerNote:
      "Gratis para usuarios pioneros · Impulsado por HenryCo Studio Intelligence · Tu texto nunca se usa para entrenar modelos externos.",
    tryDifferentParagraph: "Probar otro párrafo",
    draftingBrief: "Redactando tu brief…",
    redraftBrief: "Rehacer el brief",
    draftMyBrief: "Redactar mi brief",
    coPilotDraft: "Borrador del copiloto",
    confidence: (pct: number) => `Confianza ${pct}%`,
    cacheHit: "Caché aprovechada · más rápido y económico",
    fieldProjectType: "Tipo de proyecto",
    fieldBudgetBand: "Rango de presupuesto",
    fieldUrgency: "Urgencia",
    fieldDesignDirection: "Dirección de diseño",
    fieldPages: "Páginas / secciones",
    fieldFeatures: "Funciones requeridas",
    worthClarifying: "Conviene aclarar a medida que bajas",
    seededControl:
      "El brief de abajo ahora está precargado con estas respuestas. Puedes editar cualquier cosa antes de enviar — tú mantienes el control.",
    reapplyToBrief: "Volver a aplicar al brief de abajo",
    callsRemaining: (count: number, noun: string) => `${count} ${noun} del copiloto restante(s) en esta ventana.`,
    draftSingular: "borrador",
    draftPlural: "borradores",
    nextSteps: "Próximos pasos",
    reviewRefineTitle: "Revisar y afinar el brief",
    reviewRefineBody: "Cada campo queda editable abajo.",
    talkToLeadTitle: "Habla primero con un responsable del Studio",
    submitLockTitle: "Enviar y bloquear el alcance",
    talkToLeadBody:
      "Aún quedan algunos detalles por aclarar — un responsable senior puede dar forma al brief contigo en 15 minutos.",
    submitLockBody:
      "Envía el brief; emitimos una propuesta a precio fijo y una factura de depósito en un día hábil.",
    skipTemplateTitle: "O sáltalo — paga el depósito en una plantilla",
    payDepositTitle: "Paga un depósito y empieza",
    skipTemplateBody:
      "Las plantillas listas para usar se entregan en días. Explora la galería si quieres saltarte el brief por completo.",
    payDepositBody:
      "Reserva tu lugar ahora — abrimos el espacio del proyecto en cuanto se confirma tu depósito.",
    emptyDash: "—",
  },
  activation: {
    outcomePoint1:
      "Tus elecciones de dominio del paso anterior viajan con el brief — confirmamos el registro y el DNS contigo antes del lanzamiento.",
    outcomePoint2:
      "Recibes un registro real del Studio: propuesta, espacio de trabajo y puntos de pago — no un formulario olvidado.",
    outcomePoint3:
      "Los depósitos aseguran tu lugar; la carga de comprobantes agiliza las finanzas; los hitos y archivos quedan en un único portal de calidad para clientes.",
    teamRecommendPlaceholder: "Deja que HenryCo recomiende el equipo más adecuado",
    reviewSend: "Revisar y enviar",
    teamFit: "Encaje del equipo",
    preferredTeam: "Equipo preferido",
    matchStrongest:
      "Asignaremos el equipo más sólido a tu brief según el alcance, la urgencia y las señales de tu sector.",
    fullName: "Nombre completo",
    companyOptional: "Empresa, escuela o marca (opcional)",
    bestEmail: "Mejor correo para actualizaciones",
    whatsappOrPhone: "WhatsApp o teléfono (útil para aclaraciones rápidas)",
    depositConsent:
      "Estoy listo para asegurar una vía respaldada por depósito en cuanto HenryCo confirme conmigo el alcance y el precio.",
    whatHappensTitle: "Qué ocurre tras el envío",
    nothingGoesLive:
      "Nada se publica hasta que apruebes el alcance y el pago. Aún puedes ajustar referencias o datos de contacto con tu responsable antes de que llegue el depósito — este envío solo abre tu registro estructurado del Studio.",
    submitLabel: "Enviar brief del Studio",
    submitPendingLabel: "Construyendo tu brief del Studio...",
  },
  builder: {
    loading: "Cargando",
    loadingNextStep: "Cargando el siguiente paso",
    continueLabel: "Continuar",
    back: "Atrás",
    projectBrief: "Brief del proyecto",
    stepProgress: (current: string, total: string) => `Paso ${current} / ${total}`,
    percentComplete: (pct: number) => `${pct}% completado`,
    progressSaved:
      "Progreso guardado — puedes salir y volver en cualquier momento mientras tengas la sesión iniciada.",
    teamRecommendationFallback: "Recomendación de equipo de HenryCo",
  },
  commercial: {
    budgetLabel: "Presupuesto del proyecto · NGN",
    budgetPlaceholder: "₦1,500,000",
    budgetHint:
      "Precio fijo. Bloqueado al aceptar la propuesta — sin sobrecostes inesperados.",
    includedLabel: "Incluido",
    commercialContext: "Contexto comercial",
    intro:
      "Indícanos el presupuesto y el resultado. Volvemos en un día hábil con un alcance fijo, una ventana de entrega fija y un responsable senior asignado por su nombre — sin traspasos a juniors, sin desviaciones de alcance.",
    seniorTeamTitle: "Equipo senior",
    seniorTeamBody:
      "estratega, diseñador e ingeniero arrancan juntos; nunca solo juniors.",
    fixedPriceTitle: "Precio fijo",
    fixedPriceBody:
      "bloqueado al aceptar la propuesta. Las solicitudes de cambio se cotizan antes de empezar.",
    premiumDeliveryTitle: "Entrega premium",
    premiumDeliveryBody:
      "código listo para producción, accesibilidad verificada, listo para escalar desde el primer día.",
    businessTypeLabel: "Tipo de negocio",
    businessTypePlaceholder: "Selecciona el tipo de negocio",
    urgencyLabel: "Urgencia",
    urgencyPlaceholder: "Selecciona la urgencia",
    timelineLabel: "Plazo esperado",
    timelinePlaceholder: "Selecciona el plazo",
    goalsLabel: "¿Qué debe lograr esto?",
    goalsPlaceholder:
      "p. ej. Más clientes potenciales cualificados, operaciones más tranquilas, una incorporación de clientes más clara…",
    scopeNotesLabel: "¿Qué debe existir cuando terminemos?",
    scopeNotesPlaceholder:
      "Páginas, funciones, integraciones, idiomas, herramientas de administración — las viñetas valen.",
    inspirationLabel: "¿Algo más que debamos estudiar?",
    inspirationPlaceholder:
      "Tono, público, cosas a evitar, palabras de marca que te encanten, o «que se sienta como X pero más premium».",
  },
  path: {
    includedLabel: "Incluido",
    buyingLane: "Vía de compra",
    packageTitle: "Paquete",
    packageBody: "Vía predefinida",
    customTitle: "A medida",
    customBody: "Alcance personalizado",
    noPackage:
      "Aún no hay ningún paquete fijo disponible para este servicio. Cambia a la vía de proyecto a medida.",
    depositSuffix: (pct: number) => `${pct}% de depósito`,
    projectTypeTitle: "Tipo o categoría de proyecto",
    optionsCount: (count: number) => `${count} opciones`,
    projectTypePlaceholder: "Elige el tipo de proyecto…",
    deliveryPlatformTitle: "Plataforma de entrega",
    platformPlaceholder: "Elige la plataforma…",
    designDirectionTitle: "Dirección de diseño",
    designPlaceholder: "Elige la dirección de diseño…",
    contentLanguageTitle: "Idioma del proyecto/contenido",
    languagePlaceholder: "Elige el idioma…",
    languageEnglish: "Inglés",
    languageFrench: "Francés",
    languageArabic: "Árabe",
    languagePortuguese: "Portugués",
  },
  scope: {
    includedLabel: "Incluido",
    selectedCount: (selected: number, total: number) => `${selected}/${total} seleccionado(s)`,
    noneSelected: "Ninguno seleccionado todavía",
    moreCount: (count: number) => `+${count}`,
    packageContext: "Contexto del paquete",
    packageModeBody:
      "El modo paquete mantiene la vía principal más limpia. Sáltate la lista de páginas — el paquete ya las cubre. Marca complementos o fija una stack técnica abajo si le importa a tu equipo.",
    pagesTitle: "Páginas o secciones",
    pagesIntro:
      "Marca las páginas que este sitio necesita al lanzar. Cada página se cotiza por separado para que la propuesta esté desglosada por líneas — nada oculto.",
    pagesKicker: "Páginas",
    featuresTitle: "Funciones requeridas",
    featuresIntro:
      "¿Qué necesita hacer el producto para los usuarios el primer día? Elige lo que es innegociable; sugeriremos añadidos sensatos durante la revisión de la propuesta.",
    featuresKicker: "Funciones",
    techStackTitle: "Stack técnica",
    techStackIntro:
      "Indícanos tus preferencias. Las respetaremos donde sirva al proyecto, y discreparemos con honestidad donde otra opción te sirva mejor. Se muestran las diferencias de coste — la mayoría de las opciones son sin coste adicional.",
    programmingLanguageLabel: "Lenguaje de programación preferido",
    chooseLanguage: "Elige el lenguaje…",
    frameworkLabel: "Framework de frontend / app",
    chooseFramework: "Elige el framework…",
    backendLabel: "Backend / plataforma de datos",
    chooseBackend: "Elige el backend…",
    hostingLabel: "Hosting / despliegue",
    chooseHost: "Elige el hosting…",
    stackPhilosophyKicker: "Filosofía de la stack",
    stackPhilosophyHint: "Elige ninguno o varios",
    addOnsTitle: "Servicios complementarios",
    addOnsIntro:
      "Trabajo de apoyo opcional. Sáltate lo que no sea necesario — el precio se recalcula en directo.",
    addOnsKicker: "Complementos",
  },
};

const PT: DeepPartial<StudioRequestCopy> = {
  copilot: {
    examplePrompts: {
      logisticsLabel: "SaaS de logística",
      logisticsBody:
        "Um SaaS de logística para entregas de última milha em Lagos. Os estafetas acompanham as tarefas numa app móvel enquanto os despachantes atribuem e redirecionam a partir de um painel web. Precisamos de uma página de pedidos para clientes, uma UX móvel para estafetas, uma consola de despacho, pagamentos e análises. Lançamento em dez semanas.",
      investmentLabel: "Plataforma de investimento para membros",
      investmentBody:
        "Uma plataforma de investimento exclusiva para membros, para investidores nigerianos credenciados. As pessoas candidatam-se, assinam documentos, financiam a conta por transferência bancária e consultam relatórios de desempenho mensalmente. KYC robusto, autenticação de dois fatores e um painel de conformidade para a administração. Queremos um aspeto limpo, contido e executivo. Orçamento de cerca de oito a quinze milhões de nairas.",
      opsLabel: "Ferramenta interna de operações",
      opsBody:
        "Uma ferramenta interna de operações para a nossa agência de 30 pessoas. Receção de projetos, acompanhamento de marcos, registos de tempo, faturação e um portal de clientes. Tem de integrar com o nosso software de contabilidade atual. Deve transmitir calma e não sobrecarregar. Lançamento suave em seis semanas.",
    },
    kicker: "Copiloto de brief · Studio Intelligence",
    heading: "Descreva o que quer pelas suas próprias palavras. Nós estruturamos.",
    intro:
      "Um parágrafo é suficiente — objetivos, público, funcionalidades-chave, quaisquer restrições. O copiloto redige o resto do brief; cada campo permanece editável abaixo antes de enviar.",
    describeLabel: "Descreva o seu projeto",
    placeholder:
      "Um SaaS de logística para entregas de última milha em Lagos. Os estafetas acompanham as tarefas numa app móvel enquanto os despachantes atribuem e redirecionam a partir de um painel web…",
    tip: "Dica: menos de 8 frases funciona melhor.",
    charactersLeft: (count: number) => `${count} caracteres restantes`,
    trim: "Encurte um pouco",
    starterPointsLabel: "Experimente um destes pontos de partida",
    exampleBadge: "Exemplo",
    seededBelow: "Brief pré-preenchido abaixo — reveja cada campo antes de enviar.",
    footerNote:
      "Gratuito para utilizadores pioneiros · Desenvolvido por HenryCo Studio Intelligence · O seu texto nunca é usado para treinar modelos externos.",
    tryDifferentParagraph: "Experimentar outro parágrafo",
    draftingBrief: "A redigir o seu brief…",
    redraftBrief: "Refazer o brief",
    draftMyBrief: "Redigir o meu brief",
    coPilotDraft: "Rascunho do copiloto",
    confidence: (pct: number) => `Confiança ${pct}%`,
    cacheHit: "Cache aproveitada · mais rápido e mais barato",
    fieldProjectType: "Tipo de projeto",
    fieldBudgetBand: "Faixa de orçamento",
    fieldUrgency: "Urgência",
    fieldDesignDirection: "Direção de design",
    fieldPages: "Páginas / secções",
    fieldFeatures: "Funcionalidades necessárias",
    worthClarifying: "Vale a pena esclarecer à medida que desce",
    seededControl:
      "O brief abaixo está agora pré-preenchido com estas respostas. Pode editar tudo antes de enviar — mantém o controlo.",
    reapplyToBrief: "Reaplicar ao brief abaixo",
    callsRemaining: (count: number, noun: string) => `${count} ${noun} do copiloto restante(s) nesta janela.`,
    draftSingular: "rascunho",
    draftPlural: "rascunhos",
    nextSteps: "Próximos passos",
    reviewRefineTitle: "Rever e afinar o brief",
    reviewRefineBody: "Cada campo permanece editável abaixo.",
    talkToLeadTitle: "Fale primeiro com um responsável do Studio",
    submitLockTitle: "Enviar e bloquear o âmbito",
    talkToLeadBody:
      "Ainda há alguns detalhes a esclarecer — um responsável sénior pode moldar o brief consigo em 15 minutos.",
    submitLockBody:
      "Envie o brief; emitimos uma proposta a preço fixo e uma fatura de depósito dentro de um dia útil.",
    skipTemplateTitle: "Ou avance — pague o depósito num modelo",
    payDepositTitle: "Pague um depósito e comece",
    skipTemplateBody:
      "Os modelos prontos a usar são entregues em dias. Explore a galeria se quiser saltar o brief por completo.",
    payDepositBody:
      "Reserve já a sua vaga — abrimos o espaço do projeto assim que o seu depósito for confirmado.",
    emptyDash: "—",
  },
  activation: {
    outcomePoint1:
      "As suas escolhas de domínio do passo anterior acompanham o brief — confirmamos o registo e o DNS consigo antes do lançamento.",
    outcomePoint2:
      "Recebe um registo real do Studio: proposta, espaço de trabalho e pontos de pagamento — não um formulário esquecido.",
    outcomePoint3:
      "Os depósitos garantem a sua vaga; o carregamento de comprovativos acelera as finanças; marcos e ficheiros ficam num único portal de qualidade para clientes.",
    teamRecommendPlaceholder: "Deixe a HenryCo recomendar a equipa mais adequada",
    reviewSend: "Rever e enviar",
    teamFit: "Adequação da equipa",
    preferredTeam: "Equipa preferida",
    matchStrongest:
      "Atribuiremos a equipa mais forte ao seu brief com base no âmbito, na urgência e nos sinais do seu setor.",
    fullName: "Nome completo",
    companyOptional: "Empresa, escola ou marca (opcional)",
    bestEmail: "Melhor e-mail para atualizações",
    whatsappOrPhone: "WhatsApp ou telefone (útil para esclarecimentos rápidos)",
    depositConsent:
      "Estou pronto para garantir uma via apoiada por depósito assim que a HenryCo confirmar comigo o âmbito e o preço.",
    whatHappensTitle: "O que acontece após o envio",
    nothingGoesLive:
      "Nada fica disponível até aprovar o âmbito e o pagamento. Ainda pode ajustar referências ou dados de contacto com o seu responsável antes de o depósito chegar — este envio apenas abre o seu registo estruturado do Studio.",
    submitLabel: "Enviar brief do Studio",
    submitPendingLabel: "A construir o seu brief do Studio...",
  },
  builder: {
    loading: "A carregar",
    loadingNextStep: "A carregar o passo seguinte",
    continueLabel: "Continuar",
    back: "Voltar",
    projectBrief: "Brief do projeto",
    stepProgress: (current: string, total: string) => `Passo ${current} / ${total}`,
    percentComplete: (pct: number) => `${pct}% concluído`,
    progressSaved:
      "Progresso guardado — pode sair e voltar a qualquer momento enquanto estiver autenticado.",
    teamRecommendationFallback: "Recomendação de equipa HenryCo",
  },
  commercial: {
    budgetLabel: "Orçamento do projeto · NGN",
    budgetPlaceholder: "₦1,500,000",
    budgetHint:
      "Preço fixo. Bloqueado na aceitação da proposta — sem surpresas de custos adicionais.",
    includedLabel: "Incluído",
    commercialContext: "Contexto comercial",
    intro:
      "Diga-nos o orçamento e o resultado. Voltamos dentro de um dia útil com um âmbito fixo, uma janela de entrega fixa e um responsável sénior atribuído pelo nome — sem passagens para juniores, sem desvio de âmbito.",
    seniorTeamTitle: "Equipa sénior",
    seniorTeamBody:
      "estratega, designer e engenheiro arrancam em conjunto; nunca apenas juniores.",
    fixedPriceTitle: "Preço fixo",
    fixedPriceBody:
      "bloqueado na aceitação da proposta. Os pedidos de alteração são orçamentados antes de começarem.",
    premiumDeliveryTitle: "Entrega premium",
    premiumDeliveryBody:
      "código pronto para produção, acessibilidade verificada, pronto a escalar logo no primeiro dia.",
    businessTypeLabel: "Tipo de negócio",
    businessTypePlaceholder: "Selecione o tipo de negócio",
    urgencyLabel: "Urgência",
    urgencyPlaceholder: "Selecione a urgência",
    timelineLabel: "Prazo esperado",
    timelinePlaceholder: "Selecione o prazo",
    goalsLabel: "O que deve isto alcançar?",
    goalsPlaceholder:
      "ex. Mais leads qualificados, operações mais calmas, um onboarding de clientes mais claro…",
    scopeNotesLabel: "O que precisa de existir quando terminarmos?",
    scopeNotesPlaceholder:
      "Páginas, funcionalidades, integrações, idiomas, ferramentas de administração — tópicos servem.",
    inspirationLabel: "Mais alguma coisa que devamos estudar?",
    inspirationPlaceholder:
      "Tom, público, coisas a evitar, palavras de marca que adora, ou «faça com que pareça X mas mais premium».",
  },
  path: {
    includedLabel: "Incluído",
    buyingLane: "Via de compra",
    packageTitle: "Pacote",
    packageBody: "Via predefinida",
    customTitle: "Personalizado",
    customBody: "Âmbito à medida",
    noPackage:
      "Ainda não há nenhum pacote fixo disponível para este serviço. Mude para a via de projeto personalizado.",
    depositSuffix: (pct: number) => `${pct}% de depósito`,
    projectTypeTitle: "Tipo ou categoria de projeto",
    optionsCount: (count: number) => `${count} opções`,
    projectTypePlaceholder: "Escolha o tipo de projeto…",
    deliveryPlatformTitle: "Plataforma de entrega",
    platformPlaceholder: "Escolha a plataforma…",
    designDirectionTitle: "Direção de design",
    designPlaceholder: "Escolha a direção de design…",
    contentLanguageTitle: "Idioma do projeto/conteúdo",
    languagePlaceholder: "Escolha o idioma…",
    languageEnglish: "Inglês",
    languageFrench: "Francês",
    languageArabic: "Árabe",
    languagePortuguese: "Português",
  },
  scope: {
    includedLabel: "Incluído",
    selectedCount: (selected: number, total: number) => `${selected}/${total} selecionado(s)`,
    noneSelected: "Nenhum selecionado ainda",
    moreCount: (count: number) => `+${count}`,
    packageContext: "Contexto do pacote",
    packageModeBody:
      "O modo pacote mantém a via principal mais limpa. Salte a lista de páginas — o pacote já as cobre. Marque extras ou fixe uma stack técnica abaixo se for importante para a sua equipa.",
    pagesTitle: "Páginas ou secções",
    pagesIntro:
      "Marque as páginas de que este site precisa no lançamento. Cada página é orçamentada individualmente para que a proposta seja detalhada por linha — nada escondido.",
    pagesKicker: "Páginas",
    featuresTitle: "Funcionalidades necessárias",
    featuresIntro:
      "O que precisa o produto de fazer para os utilizadores no primeiro dia? Escolha o que é inegociável; sugeriremos adições sensatas durante a revisão da proposta.",
    featuresKicker: "Funcionalidades",
    techStackTitle: "Stack técnica",
    techStackIntro:
      "Diga-nos as suas preferências. Respeitá-las-emos onde servir o projeto, e contestaremos com honestidade onde outra escolha o servir melhor. As diferenças de custo são apresentadas — a maioria das escolhas é sem custo adicional.",
    programmingLanguageLabel: "Linguagem de programação preferida",
    chooseLanguage: "Escolha a linguagem…",
    frameworkLabel: "Framework de frontend / app",
    chooseFramework: "Escolha o framework…",
    backendLabel: "Backend / plataforma de dados",
    chooseBackend: "Escolha o backend…",
    hostingLabel: "Alojamento / implementação",
    chooseHost: "Escolha o alojamento…",
    stackPhilosophyKicker: "Filosofia da stack",
    stackPhilosophyHint: "Escolha nenhum ou vários",
    addOnsTitle: "Serviços complementares",
    addOnsIntro:
      "Trabalho de apoio opcional. Salte o que não for necessário — o preço recalcula em tempo real.",
    addOnsKicker: "Extras",
  },
};

const AR: DeepPartial<StudioRequestCopy> = {
  copilot: {
    examplePrompts: {
      logisticsLabel: "منصة SaaS للوجستيات",
      logisticsBody:
        "منصة SaaS لوجستية للتوصيل في الميل الأخير في لاغوس. يتابع المندوبون المهام عبر تطبيق جوال بينما يقوم المنسّقون بالإسناد وإعادة التوجيه من لوحة تحكم ويب. نحتاج إلى صفحة طلب موجهة للعملاء، وتجربة استخدام للمندوبين على الجوال، ووحدة تحكم للتنسيق، ومدفوعات، وتحليلات. الإطلاق خلال عشرة أسابيع.",
      investmentLabel: "منصة استثمار للأعضاء",
      investmentBody:
        "منصة استثمار حصرية للأعضاء، موجّهة للمستثمرين النيجيريين المعتمدين. يتقدم الأشخاص بالطلب، ويوقّعون المستندات، ويموّلون حساباتهم عبر التحويل المصرفي، ويطّلعون على تحديثات الأداء شهريًا. تحقق هوية قوي (KYC)، ومصادقة ثنائية، ولوحة امتثال للإدارة. نريد طابعًا أنيقًا ومتزنًا وتنفيذيًا. الميزانية نحو ثمانية إلى خمسة عشر مليون نيرة.",
      opsLabel: "أداة تشغيل داخلية",
      opsBody:
        "أداة تشغيل داخلية لوكالتنا المكوّنة من 30 شخصًا. استقبال المشاريع، وتتبّع المعالم، وسجلات الوقت، والفوترة، وبوابة للعملاء. يجب أن تتكامل مع برنامج المحاسبة الحالي لدينا. ينبغي أن تكون هادئة وغير مرهِقة. إطلاق تجريبي خلال ستة أسابيع.",
    },
    kicker: "مساعد الموجز · Studio Intelligence",
    heading: "صِف ما تريده بكلماتك الخاصة، وسنقوم نحن بهيكلته.",
    intro:
      "فقرة واحدة تكفي — الأهداف والجمهور والميزات الرئيسية وأي قيود. يصوغ المساعد بقية الموجز؛ ويبقى كل حقل قابلاً للتعديل أدناه قبل الإرسال.",
    describeLabel: "صِف مشروعك",
    placeholder:
      "منصة SaaS لوجستية للتوصيل في الميل الأخير في لاغوس. يتابع المندوبون المهام عبر تطبيق جوال بينما يقوم المنسّقون بالإسناد وإعادة التوجيه من لوحة تحكم ويب…",
    tip: "نصيحة: أقل من 8 جُمل يعطي أفضل النتائج.",
    charactersLeft: (count: number) => `${count} حرفًا متبقيًا`,
    trim: "اختصر قليلاً",
    starterPointsLabel: "جرّب إحدى نقاط الانطلاق هذه",
    exampleBadge: "مثال",
    seededBelow: "تم تعبئة الموجز أدناه مبدئيًا — راجع كل حقل قبل الإرسال.",
    footerNote:
      "مجاني للمستخدمين الأوائل · مدعوم بـ HenryCo Studio Intelligence · لا يُستخدم نصك أبدًا لتدريب نماذج خارجية.",
    tryDifferentParagraph: "جرّب فقرة مختلفة",
    draftingBrief: "جارٍ صياغة موجزك…",
    redraftBrief: "إعادة صياغة الموجز",
    draftMyBrief: "صياغة موجزي",
    coPilotDraft: "مسودة المساعد",
    confidence: (pct: number) => `الثقة ${pct}%`,
    cacheHit: "استخدام الذاكرة المؤقتة · أسرع وأقل تكلفة",
    fieldProjectType: "نوع المشروع",
    fieldBudgetBand: "شريحة الميزانية",
    fieldUrgency: "درجة الإلحاح",
    fieldDesignDirection: "اتجاه التصميم",
    fieldPages: "الصفحات / الأقسام",
    fieldFeatures: "الميزات المطلوبة",
    worthClarifying: "يستحق التوضيح أثناء التمرير للأسفل",
    seededControl:
      "الموجز أدناه أصبح الآن معبّأً مبدئيًا بهذه الإجابات. يمكنك تعديل أي شيء قبل الإرسال — تبقى أنت المتحكم.",
    reapplyToBrief: "إعادة التطبيق على الموجز أدناه",
    callsRemaining: (count: number, noun: string) => `${count} ${noun} متبقية للمساعد في هذه الفترة.`,
    draftSingular: "مسودة",
    draftPlural: "مسودات",
    nextSteps: "الخطوات التالية",
    reviewRefineTitle: "مراجعة الموجز وصقله",
    reviewRefineBody: "يبقى كل حقل قابلاً للتعديل أدناه.",
    talkToLeadTitle: "تحدّث أولاً مع مسؤول في الاستوديو",
    submitLockTitle: "أرسل واقفل النطاق",
    talkToLeadBody:
      "لا تزال بعض التفاصيل بحاجة إلى توضيح — يمكن لمسؤول أول صياغة الموجز معك خلال 15 دقيقة.",
    submitLockBody:
      "أرسل الموجز؛ نصدر عرضًا بسعر ثابت وفاتورة عربون خلال يوم عمل واحد.",
    skipTemplateTitle: "أو تخطَّ — ادفع العربون على قالب",
    payDepositTitle: "ادفع عربونًا وابدأ",
    skipTemplateBody:
      "القوالب الجاهزة تُسلَّم خلال أيام. تصفّح المعرض إذا أردت تخطّي الموجز بالكامل.",
    payDepositBody:
      "احجز مكانك الآن — نفتح مساحة عمل المشروع لحظة تأكيد عربونك.",
    emptyDash: "—",
  },
  activation: {
    outcomePoint1:
      "تنتقل اختياراتك للنطاق من الخطوة السابقة مع الموجز — نؤكّد التسجيل وإعدادات DNS معك قبل الإطلاق.",
    outcomePoint2:
      "تحصل على سجل استوديو حقيقي: عرض، ومساحة عمل، ونقاط دفع — وليس مجرد نموذج منسي.",
    outcomePoint3:
      "تؤمّن العرابين مكانك؛ ويسرّع رفع الإثباتات الأمور المالية؛ وتبقى المعالم والملفات في بوابة واحدة بمستوى احترافي للعملاء.",
    teamRecommendPlaceholder: "دع HenryCo توصي بالفريق الأنسب",
    reviewSend: "راجِع وأرسِل",
    teamFit: "ملاءمة الفريق",
    preferredTeam: "الفريق المفضّل",
    matchStrongest:
      "سنطابق أقوى فريق مع موجزك بناءً على النطاق ودرجة الإلحاح ومؤشرات قطاعك.",
    fullName: "الاسم الكامل",
    companyOptional: "الشركة أو المدرسة أو العلامة التجارية (اختياري)",
    bestEmail: "أفضل بريد إلكتروني للتحديثات",
    whatsappOrPhone: "واتساب أو الهاتف (يساعد في التوضيحات السريعة)",
    depositConsent:
      "أنا مستعد لتأمين مسار مدعوم بعربون بمجرد أن تؤكّد HenryCo معي النطاق والتسعير.",
    whatHappensTitle: "ما الذي يحدث بعد الإرسال",
    nothingGoesLive:
      "لا شيء يُنشر حتى توافق على النطاق والدفع. لا يزال بإمكانك تعديل المراجع أو بيانات الاتصال مع مسؤولك قبل وصول العربون — هذا الإرسال يفتح فقط سجل الاستوديو المنظّم الخاص بك.",
    submitLabel: "إرسال موجز الاستوديو",
    submitPendingLabel: "جارٍ بناء موجز الاستوديو الخاص بك...",
  },
  builder: {
    loading: "جارٍ التحميل",
    loadingNextStep: "جارٍ تحميل الخطوة التالية",
    continueLabel: "متابعة",
    back: "رجوع",
    projectBrief: "موجز المشروع",
    stepProgress: (current: string, total: string) => `الخطوة ${current} / ${total}`,
    percentComplete: (pct: number) => `${pct}% مكتمل`,
    progressSaved:
      "تم حفظ التقدّم — يمكنك المغادرة والعودة في أي وقت ما دمت مسجّل الدخول.",
    teamRecommendationFallback: "توصية فريق HenryCo",
  },
  commercial: {
    budgetLabel: "ميزانية المشروع · NGN",
    budgetPlaceholder: "₦1,500,000",
    budgetHint: "سعر ثابت. يُقفل عند قبول العرض — لا تجاوزات مفاجئة.",
    includedLabel: "مُضمَّن",
    commercialContext: "السياق التجاري",
    intro:
      "أخبرنا بالميزانية والنتيجة المرجوّة. نعود إليك خلال يوم عمل واحد بنطاق ثابت، ونافذة تسليم ثابتة، ومسؤول أول مُسنَد بالاسم — دون تسليم للمبتدئين ودون انحراف في النطاق.",
    seniorTeamTitle: "فريق أول",
    seniorTeamBody: "يبدأ الاستراتيجي والمصمم والمهندس معًا؛ لا مبتدئين فقط أبدًا.",
    fixedPriceTitle: "سعر ثابت",
    fixedPriceBody: "يُقفل عند قبول العرض. تُسعَّر طلبات التغيير قبل البدء بها.",
    premiumDeliveryTitle: "تسليم متميّز",
    premiumDeliveryBody:
      "كود جاهز للإنتاج، تم التحقق من إمكانية الوصول، وجاهز للتوسّع من اليوم الأول.",
    businessTypeLabel: "نوع النشاط",
    businessTypePlaceholder: "اختر نوع النشاط",
    urgencyLabel: "درجة الإلحاح",
    urgencyPlaceholder: "اختر درجة الإلحاح",
    timelineLabel: "الجدول الزمني المتوقع",
    timelinePlaceholder: "اختر الجدول الزمني",
    goalsLabel: "ما الذي ينبغي أن يحقّقه هذا؟",
    goalsPlaceholder: "مثل: المزيد من العملاء المؤهّلين، عمليات أكثر هدوءًا، استقبال عملاء أوضح…",
    scopeNotesLabel: "ما الذي يجب أن يكون موجودًا عند انتهائنا؟",
    scopeNotesPlaceholder:
      "صفحات، ميزات، تكاملات، لغات، أدوات إدارة — النقاط المختصرة مناسبة.",
    inspirationLabel: "هل هناك شيء آخر ينبغي أن ندرسه؟",
    inspirationPlaceholder:
      "النبرة، الجمهور، أشياء يجب تجنّبها، كلمات للعلامة تحبّها، أو «اجعله يبدو مثل X لكن أكثر تميّزًا».",
  },
  path: {
    includedLabel: "مُضمَّن",
    buyingLane: "مسار الشراء",
    packageTitle: "باقة",
    packageBody: "مسار محدّد مسبقًا",
    customTitle: "مخصّص",
    customBody: "نطاق مفصّل حسب الطلب",
    noPackage:
      "لا تتوفر بعد باقة ثابتة لهذه الخدمة. انتقل إلى مسار المشروع المخصّص.",
    depositSuffix: (pct: number) => `عربون ${pct}%`,
    projectTypeTitle: "نوع المشروع أو فئته",
    optionsCount: (count: number) => `${count} خيارات`,
    projectTypePlaceholder: "اختر نوع المشروع…",
    deliveryPlatformTitle: "منصة التسليم",
    platformPlaceholder: "اختر المنصة…",
    designDirectionTitle: "اتجاه التصميم",
    designPlaceholder: "اختر اتجاه التصميم…",
    contentLanguageTitle: "لغة المشروع/المحتوى",
    languagePlaceholder: "اختر اللغة…",
    languageEnglish: "الإنجليزية",
    languageFrench: "الفرنسية",
    languageArabic: "العربية",
    languagePortuguese: "البرتغالية",
  },
  scope: {
    includedLabel: "مُضمَّن",
    selectedCount: (selected: number, total: number) => `${selected}/${total} محدّد`,
    noneSelected: "لم يُحدَّد أي شيء بعد",
    moreCount: (count: number) => `+${count}`,
    packageContext: "سياق الباقة",
    packageModeBody:
      "يبقي وضع الباقة المسار الأساسي أكثر تنظيمًا. تخطَّ قائمة الصفحات — فالباقة تغطّيها بالفعل. حدّد الإضافات أو ثبّت حزمة تقنية أدناه إن كان ذلك مهمًا لفريقك.",
    pagesTitle: "الصفحات أو الأقسام",
    pagesIntro:
      "حدّد الصفحات التي يحتاجها هذا الموقع عند الإطلاق. تُسعَّر كل صفحة على حدة بحيث يكون العرض مفصّلاً ببنود — لا شيء مخفي.",
    pagesKicker: "الصفحات",
    featuresTitle: "الميزات المطلوبة",
    featuresIntro:
      "ما الذي يحتاج المنتج إلى فعله للمستخدمين في اليوم الأول؟ اختر ما لا يمكن التنازل عنه؛ وسنقترح إضافات معقولة أثناء مراجعة العرض.",
    featuresKicker: "الميزات",
    techStackTitle: "الحزمة التقنية",
    techStackIntro:
      "أخبرنا بتفضيلاتك. سنحترمها حيث يخدم ذلك المشروع، وسنعترض بصدق حيث يخدمك خيار آخر بشكل أفضل. تُعرَض فروق التكلفة — ومعظم الخيارات بلا فرق في التكلفة.",
    programmingLanguageLabel: "لغة البرمجة المفضّلة",
    chooseLanguage: "اختر اللغة…",
    frameworkLabel: "إطار الواجهة الأمامية / التطبيق",
    chooseFramework: "اختر الإطار…",
    backendLabel: "الواجهة الخلفية / منصة البيانات",
    chooseBackend: "اختر الواجهة الخلفية…",
    hostingLabel: "الاستضافة / النشر",
    chooseHost: "اختر المستضيف…",
    stackPhilosophyKicker: "فلسفة الحزمة",
    stackPhilosophyHint: "اختر لا شيء أو عدة خيارات",
    addOnsTitle: "خدمات إضافية",
    addOnsIntro: "عمل داعم اختياري. تخطَّ ما لا تحتاجه — يُعاد حساب السعر مباشرةً.",
    addOnsKicker: "الإضافات",
  },
};

const DE: DeepPartial<StudioRequestCopy> = {
  copilot: {
    examplePrompts: {
      logisticsLabel: "Logistik-SaaS",
      logisticsBody:
        "Ein Logistik-SaaS für die Zustellung auf der letzten Meile in Lagos. Kuriere verfolgen Aufträge in einer mobilen App, während Disponenten über ein Web-Dashboard zuweisen und umleiten. Wir brauchen eine kundenseitige Bestellseite, eine mobile Kurier-UX, eine Disponenten-Konsole, Zahlungen und Analysen. Start innerhalb von zehn Wochen.",
      investmentLabel: "Investmentplattform für Mitglieder",
      investmentBody:
        "Eine Investmentplattform nur für Mitglieder, für akkreditierte nigerianische Anleger. Personen bewerben sich, unterzeichnen Dokumente, finanzieren ihr Konto per Banküberweisung und sehen monatlich Performance-Updates. Starkes KYC, Zwei-Faktor-Authentifizierung und ein Admin-Compliance-Dashboard. Wir wollen eine klare, zurückhaltende, exekutive Anmutung. Budget rund acht bis fünfzehn Millionen Naira.",
      opsLabel: "Internes Betriebstool",
      opsBody:
        "Ein internes Betriebstool für unsere 30-köpfige Agentur. Projektannahme, Meilenstein-Tracking, Zeiterfassung, Rechnungsstellung und ein Kundenportal. Muss sich in unser bestehendes Buchhaltungssystem integrieren. Soll ruhig wirken und nicht überfordern. Soft Launch in sechs Wochen.",
    },
    kicker: "Briefing-Copilot · Studio Intelligence",
    heading: "Beschreiben Sie in eigenen Worten, was Sie möchten. Wir strukturieren es.",
    intro:
      "Ein Absatz genügt — Ziele, Zielgruppe, Kernfunktionen, etwaige Einschränkungen. Der Copilot verfasst den Rest des Briefings; jedes Feld bleibt unten bis zum Absenden bearbeitbar.",
    describeLabel: "Beschreiben Sie Ihr Projekt",
    placeholder:
      "Ein Logistik-SaaS für die Zustellung auf der letzten Meile in Lagos. Kuriere verfolgen Aufträge in einer mobilen App, während Disponenten über ein Web-Dashboard zuweisen und umleiten…",
    tip: "Tipp: Unter 8 Sätzen funktioniert am besten.",
    charactersLeft: (count: number) => `${count} Zeichen übrig`,
    trim: "Etwas kürzen",
    starterPointsLabel: "Probieren Sie einen dieser Startpunkte",
    exampleBadge: "Beispiel",
    seededBelow: "Briefing unten vorausgefüllt — prüfen Sie jedes Feld vor dem Absenden.",
    footerNote:
      "Kostenlos für frühe Nutzer · Unterstützt von HenryCo Studio Intelligence · Ihr Text wird nie zum Training externer Modelle verwendet.",
    tryDifferentParagraph: "Anderen Absatz versuchen",
    draftingBrief: "Ihr Briefing wird erstellt…",
    redraftBrief: "Briefing neu entwerfen",
    draftMyBrief: "Mein Briefing entwerfen",
    coPilotDraft: "Copilot-Entwurf",
    confidence: (pct: number) => `Konfidenz ${pct}%`,
    cacheHit: "Cache-Treffer · schneller & günstiger",
    fieldProjectType: "Projekttyp",
    fieldBudgetBand: "Budgetspanne",
    fieldUrgency: "Dringlichkeit",
    fieldDesignDirection: "Design-Richtung",
    fieldPages: "Seiten / Abschnitte",
    fieldFeatures: "Erforderliche Funktionen",
    worthClarifying: "Beim Herunterscrollen zu klären",
    seededControl:
      "Das Briefing unten ist nun mit diesen Antworten vorausgefüllt. Sie können vor dem Absenden alles bearbeiten — Sie behalten die Kontrolle.",
    reapplyToBrief: "Erneut auf das Briefing unten anwenden",
    callsRemaining: (count: number, noun: string) => `${count} Copilot-${noun} in diesem Zeitraum übrig.`,
    draftSingular: "Entwurf",
    draftPlural: "Entwürfe",
    nextSteps: "Nächste Schritte",
    reviewRefineTitle: "Briefing prüfen & verfeinern",
    reviewRefineBody: "Jedes Feld bleibt unten bearbeitbar.",
    talkToLeadTitle: "Sprechen Sie zuerst mit einem Studio-Lead",
    submitLockTitle: "Absenden & Umfang festlegen",
    talkToLeadBody:
      "Einige Details sind noch zu klären — ein Senior-Lead kann das Briefing in 15 Minuten mit Ihnen ausarbeiten.",
    submitLockBody:
      "Senden Sie das Briefing ab; wir erstellen innerhalb eines Werktags ein Festpreisangebot und eine Anzahlungsrechnung.",
    skipTemplateTitle: "Oder überspringen — Anzahlung auf eine Vorlage leisten",
    payDepositTitle: "Anzahlung leisten & starten",
    skipTemplateBody:
      "Fertige Vorlagen werden in Tagen geliefert. Durchstöbern Sie die Galerie, wenn Sie das Briefing ganz überspringen möchten.",
    payDepositBody:
      "Sichern Sie sich jetzt Ihren Slot — wir öffnen den Projekt-Workspace, sobald Ihre Anzahlung eingeht.",
    emptyDash: "—",
  },
  activation: {
    outcomePoint1:
      "Ihre Domain-Entscheidungen aus dem letzten Schritt reisen mit dem Briefing mit — wir bestätigen Registrierung und DNS vor dem Start mit Ihnen.",
    outcomePoint2:
      "Sie erhalten einen echten Studio-Datensatz: Angebot, Workspace und Zahlungs-Checkpoints — keine vergessene Formulareinreichung.",
    outcomePoint3:
      "Anzahlungen sichern Ihren Slot; das Hochladen von Nachweisen hält die Finanzen schnell; Meilensteine und Dateien bleiben in einem einzigen Kundenportal in Profiqualität.",
    teamRecommendPlaceholder: "HenryCo das am besten passende Team empfehlen lassen",
    reviewSend: "Prüfen & senden",
    teamFit: "Team-Passung",
    preferredTeam: "Bevorzugtes Team",
    matchStrongest:
      "Wir ordnen Ihrem Briefing das stärkste Team zu — basierend auf Umfang, Dringlichkeit und den Signalen Ihrer Branche.",
    fullName: "Vollständiger Name",
    companyOptional: "Unternehmen, Schule oder Marke (optional)",
    bestEmail: "Beste E-Mail für Updates",
    whatsappOrPhone: "WhatsApp oder Telefon (hilft bei schnellen Rückfragen)",
    depositConsent:
      "Ich bin bereit, eine anzahlungsgestützte Lane zu sichern, sobald HenryCo Umfang und Preis mit mir bestätigt.",
    whatHappensTitle: "Was nach dem Absenden passiert",
    nothingGoesLive:
      "Nichts geht live, bevor Sie Umfang und Zahlung freigeben. Sie können Referenzen oder Kontaktdaten mit Ihrem Lead noch anpassen, bevor die Anzahlung eingeht — diese Einreichung öffnet lediglich Ihren strukturierten Studio-Datensatz.",
    submitLabel: "Studio-Briefing absenden",
    submitPendingLabel: "Ihr Studio-Briefing wird erstellt...",
  },
  builder: {
    loading: "Wird geladen",
    loadingNextStep: "Nächster Schritt wird geladen",
    continueLabel: "Weiter",
    back: "Zurück",
    projectBrief: "Projekt-Briefing",
    stepProgress: (current: string, total: string) => `Schritt ${current} / ${total}`,
    percentComplete: (pct: number) => `${pct}% abgeschlossen`,
    progressSaved:
      "Fortschritt gespeichert — Sie können jederzeit gehen und zurückkehren, solange Sie angemeldet sind.",
    teamRecommendationFallback: "HenryCo-Teamempfehlung",
  },
  commercial: {
    budgetLabel: "Projektbudget · NGN",
    budgetPlaceholder: "₦1,500,000",
    budgetHint: "Festpreis. Bei Angebotsannahme fixiert — keine bösen Überraschungen.",
    includedLabel: "Inbegriffen",
    commercialContext: "Kommerzieller Kontext",
    intro:
      "Nennen Sie uns Budget und Ergebnis. Wir melden uns innerhalb eines Werktags mit einem festen Umfang, einem festen Lieferfenster und einem namentlich zugewiesenen Senior-Lead zurück — keine Übergabe an Juniors, kein Scope-Drift.",
    seniorTeamTitle: "Senior-Team",
    seniorTeamBody: "Stratege, Designer und Entwickler starten gemeinsam; nie nur Juniors.",
    fixedPriceTitle: "Festpreis",
    fixedPriceBody:
      "bei Angebotsannahme fixiert. Änderungswünsche werden vor Beginn bepreist.",
    premiumDeliveryTitle: "Premium-Lieferung",
    premiumDeliveryBody:
      "produktionsreifer Code, auf Barrierefreiheit geprüft, ab dem ersten Tag skalierbar.",
    businessTypeLabel: "Geschäftsart",
    businessTypePlaceholder: "Geschäftsart auswählen",
    urgencyLabel: "Dringlichkeit",
    urgencyPlaceholder: "Dringlichkeit auswählen",
    timelineLabel: "Erwarteter Zeitrahmen",
    timelinePlaceholder: "Zeitrahmen auswählen",
    goalsLabel: "Was soll damit erreicht werden?",
    goalsPlaceholder:
      "z. B. Mehr qualifizierte Leads, ruhigerer Betrieb, klareres Kunden-Onboarding…",
    scopeNotesLabel: "Was muss vorhanden sein, wenn wir fertig sind?",
    scopeNotesPlaceholder:
      "Seiten, Funktionen, Integrationen, Sprachen, Admin-Tools — Stichpunkte sind okay.",
    inspirationLabel: "Sonst noch etwas, das wir studieren sollten?",
    inspirationPlaceholder:
      "Tonalität, Zielgruppe, zu Vermeidendes, Markenwörter, die Sie lieben, oder „lass es sich wie X anfühlen, nur hochwertiger“.",
  },
  path: {
    includedLabel: "Inbegriffen",
    buyingLane: "Kauf-Lane",
    packageTitle: "Paket",
    packageBody: "Vordefinierte Lane",
    customTitle: "Individuell",
    customBody: "Maßgeschneiderter Umfang",
    noPackage:
      "Für diesen Service ist noch kein festes Paket verfügbar. Wechseln Sie zur individuellen Projekt-Route.",
    depositSuffix: (pct: number) => `${pct}% Anzahlung`,
    projectTypeTitle: "Projekttyp oder Kategorie",
    optionsCount: (count: number) => `${count} Optionen`,
    projectTypePlaceholder: "Projekttyp wählen…",
    deliveryPlatformTitle: "Liefer-Plattform",
    platformPlaceholder: "Plattform wählen…",
    designDirectionTitle: "Design-Richtung",
    designPlaceholder: "Design-Richtung wählen…",
    contentLanguageTitle: "Projekt-/Inhaltssprache",
    languagePlaceholder: "Sprache wählen…",
    languageEnglish: "Englisch",
    languageFrench: "Französisch",
    languageArabic: "Arabisch",
    languagePortuguese: "Portugiesisch",
  },
  scope: {
    includedLabel: "Inbegriffen",
    selectedCount: (selected: number, total: number) => `${selected}/${total} ausgewählt`,
    noneSelected: "Noch nichts ausgewählt",
    moreCount: (count: number) => `+${count}`,
    packageContext: "Paket-Kontext",
    packageModeBody:
      "Der Paketmodus hält die Kern-Lane übersichtlicher. Überspringen Sie die Seitenliste — das Paket deckt sie bereits ab. Haken Sie Add-ons an oder fixieren Sie unten einen Tech-Stack, wenn es für Ihr Team wichtig ist.",
    pagesTitle: "Seiten oder Abschnitte",
    pagesIntro:
      "Haken Sie die Seiten an, die diese Website zum Start braucht. Jede Seite wird einzeln bepreist, damit das Angebot positioniert ist — nichts versteckt.",
    pagesKicker: "Seiten",
    featuresTitle: "Erforderliche Funktionen",
    featuresIntro:
      "Was muss das Produkt am ersten Tag für die Nutzer leisten? Wählen Sie das Unverzichtbare; wir schlagen bei der Angebotsprüfung sinnvolle Ergänzungen vor.",
    featuresKicker: "Funktionen",
    techStackTitle: "Tech-Stack",
    techStackIntro:
      "Nennen Sie uns Ihre Präferenzen. Wir respektieren sie, wo es dem Projekt dient, und widersprechen ehrlich, wo eine andere Wahl Ihnen besser dient. Kostenunterschiede werden angezeigt — die meisten Optionen sind ohne Aufpreis.",
    programmingLanguageLabel: "Bevorzugte Programmiersprache",
    chooseLanguage: "Sprache wählen…",
    frameworkLabel: "Frontend- / App-Framework",
    chooseFramework: "Framework wählen…",
    backendLabel: "Backend / Datenplattform",
    chooseBackend: "Backend wählen…",
    hostingLabel: "Hosting / Deployment",
    chooseHost: "Host wählen…",
    stackPhilosophyKicker: "Stack-Philosophie",
    stackPhilosophyHint: "Keines oder mehrere wählen",
    addOnsTitle: "Zusatzleistungen",
    addOnsIntro:
      "Optionale unterstützende Arbeit. Überspringen Sie Nicht-Benötigtes — der Preis berechnet sich live neu.",
    addOnsKicker: "Add-ons",
  },
};

const IT: DeepPartial<StudioRequestCopy> = {
  copilot: {
    examplePrompts: {
      logisticsLabel: "SaaS di logistica",
      logisticsBody:
        "Un SaaS di logistica per le consegne dell'ultimo miglio a Lagos. I corrieri seguono le commesse su un'app mobile mentre i dispatcher assegnano e riassegnano da una dashboard web. Servono una pagina d'ordine per i clienti, una UX mobile per i corrieri, una console di smistamento, pagamenti e analisi. Lancio entro dieci settimane.",
      investmentLabel: "Piattaforma di investimento per membri",
      investmentBody:
        "Una piattaforma di investimento riservata ai membri, per investitori nigeriani accreditati. Le persone si candidano, firmano documenti, alimentano il conto tramite bonifico bancario e consultano aggiornamenti mensili sui rendimenti. KYC robusto, autenticazione a due fattori e una dashboard di compliance per l'amministrazione. Vogliamo un'estetica pulita, sobria ed esecutiva. Budget di circa otto-quindici milioni di naira.",
      opsLabel: "Strumento operativo interno",
      opsBody:
        "Uno strumento operativo interno per la nostra agenzia di 30 persone. Acquisizione progetti, tracciamento delle milestone, registri delle ore, fatturazione e un portale clienti. Deve integrarsi con il nostro software di contabilità esistente. Deve risultare calmo e non opprimente. Soft launch in sei settimane.",
    },
    kicker: "Copilota del brief · Studio Intelligence",
    heading: "Descrivi ciò che vuoi con parole tue. Lo strutturiamo noi.",
    intro:
      "Basta un paragrafo — obiettivi, pubblico, funzionalità chiave, eventuali vincoli. Il copilota redige il resto del brief; ogni campo resta modificabile qui sotto prima dell'invio.",
    describeLabel: "Descrivi il tuo progetto",
    placeholder:
      "Un SaaS di logistica per le consegne dell'ultimo miglio a Lagos. I corrieri seguono le commesse su un'app mobile mentre i dispatcher assegnano e riassegnano da una dashboard web…",
    tip: "Suggerimento: meno di 8 frasi funziona meglio.",
    charactersLeft: (count: number) => `${count} caratteri rimanenti`,
    trim: "Accorcia un po'",
    starterPointsLabel: "Prova uno di questi punti di partenza",
    exampleBadge: "Esempio",
    seededBelow: "Brief precompilato qui sotto — controlla ogni campo prima di inviare.",
    footerNote:
      "Gratis per i primi utenti · Realizzato con HenryCo Studio Intelligence · Il tuo testo non viene mai usato per addestrare modelli esterni.",
    tryDifferentParagraph: "Prova un altro paragrafo",
    draftingBrief: "Stiamo redigendo il tuo brief…",
    redraftBrief: "Rifai il brief",
    draftMyBrief: "Redigi il mio brief",
    coPilotDraft: "Bozza del copilota",
    confidence: (pct: number) => `Affidabilità ${pct}%`,
    cacheHit: "Cache usata · più veloce ed economico",
    fieldProjectType: "Tipo di progetto",
    fieldBudgetBand: "Fascia di budget",
    fieldUrgency: "Urgenza",
    fieldDesignDirection: "Direzione di design",
    fieldPages: "Pagine / sezioni",
    fieldFeatures: "Funzionalità richieste",
    worthClarifying: "Da chiarire mentre scorri verso il basso",
    seededControl:
      "Il brief qui sotto è ora precompilato con queste risposte. Puoi modificare qualsiasi cosa prima di inviare — il controllo resta a te.",
    reapplyToBrief: "Riapplica al brief qui sotto",
    callsRemaining: (count: number, noun: string) => `${count} ${noun} del copilota rimanenti in questa finestra.`,
    draftSingular: "bozza",
    draftPlural: "bozze",
    nextSteps: "Prossimi passi",
    reviewRefineTitle: "Rivedi e affina il brief",
    reviewRefineBody: "Ogni campo resta modificabile qui sotto.",
    talkToLeadTitle: "Parla prima con un responsabile dello Studio",
    submitLockTitle: "Invia e blocca l'ambito",
    talkToLeadBody:
      "Alcuni dettagli vanno ancora chiariti — un responsabile senior può definire il brief con te in 15 minuti.",
    submitLockBody:
      "Invia il brief; emettiamo una proposta a prezzo fisso e una fattura di acconto entro un giorno lavorativo.",
    skipTemplateTitle: "Oppure salta — paga l'acconto su un modello",
    payDepositTitle: "Paga un acconto e inizia",
    skipTemplateBody:
      "I modelli pronti vengono consegnati in pochi giorni. Sfoglia la galleria se vuoi saltare del tutto il brief.",
    payDepositBody:
      "Prenota subito il tuo posto — apriamo lo spazio di progetto nel momento in cui l'acconto risulta confermato.",
    emptyDash: "—",
  },
  activation: {
    outcomePoint1:
      "Le tue scelte di dominio del passaggio precedente viaggiano con il brief — confermiamo registrazione e DNS con te prima del lancio.",
    outcomePoint2:
      "Ricevi un vero record Studio: proposta, spazio di lavoro e checkpoint di pagamento — non un modulo dimenticato.",
    outcomePoint3:
      "Gli acconti garantiscono il tuo posto; il caricamento delle prove velocizza l'amministrazione; milestone e file restano in un unico portale di livello professionale per i clienti.",
    teamRecommendPlaceholder: "Lascia che HenryCo consigli il team più adatto",
    reviewSend: "Rivedi e invia",
    teamFit: "Idoneità del team",
    preferredTeam: "Team preferito",
    matchStrongest:
      "Assegneremo il team più solido al tuo brief in base ad ambito, urgenza e ai segnali del tuo settore.",
    fullName: "Nome completo",
    companyOptional: "Azienda, scuola o brand (facoltativo)",
    bestEmail: "Miglior email per gli aggiornamenti",
    whatsappOrPhone: "WhatsApp o telefono (utile per chiarimenti rapidi)",
    depositConsent:
      "Sono pronto a riservare una corsia supportata da acconto non appena HenryCo conferma con me ambito e prezzo.",
    whatHappensTitle: "Cosa succede dopo l'invio",
    nothingGoesLive:
      "Nulla va online finché non approvi ambito e pagamento. Puoi ancora modificare riferimenti o dati di contatto con il tuo responsabile prima che arrivi l'acconto — questo invio apre soltanto il tuo record Studio strutturato.",
    submitLabel: "Invia il brief Studio",
    submitPendingLabel: "Stiamo costruendo il tuo brief Studio...",
  },
  builder: {
    loading: "Caricamento",
    loadingNextStep: "Caricamento del passaggio successivo",
    continueLabel: "Continua",
    back: "Indietro",
    projectBrief: "Brief del progetto",
    stepProgress: (current: string, total: string) => `Passaggio ${current} / ${total}`,
    percentComplete: (pct: number) => `${pct}% completato`,
    progressSaved:
      "Progresso salvato — puoi uscire e tornare in qualsiasi momento mentre sei connesso.",
    teamRecommendationFallback: "Raccomandazione del team HenryCo",
  },
  commercial: {
    budgetLabel: "Budget del progetto · NGN",
    budgetPlaceholder: "₦1,500,000",
    budgetHint:
      "Prezzo fisso. Bloccato all'accettazione della proposta — nessun extra a sorpresa.",
    includedLabel: "Incluso",
    commercialContext: "Contesto commerciale",
    intro:
      "Indicaci budget e risultato atteso. Torniamo entro un giorno lavorativo con un ambito fisso, una finestra di consegna fissa e un responsabile senior assegnato per nome — nessun passaggio ai junior, nessun scope drift.",
    seniorTeamTitle: "Team senior",
    seniorTeamBody:
      "stratega, designer e ingegnere partono insieme; mai solo junior.",
    fixedPriceTitle: "Prezzo fisso",
    fixedPriceBody:
      "bloccato all'accettazione della proposta. Le richieste di modifica vengono quotate prima di iniziare.",
    premiumDeliveryTitle: "Consegna premium",
    premiumDeliveryBody:
      "codice pronto per la produzione, accessibilità verificata, pronto a scalare dal primo giorno.",
    businessTypeLabel: "Tipo di attività",
    businessTypePlaceholder: "Seleziona il tipo di attività",
    urgencyLabel: "Urgenza",
    urgencyPlaceholder: "Seleziona l'urgenza",
    timelineLabel: "Tempistica prevista",
    timelinePlaceholder: "Seleziona la tempistica",
    goalsLabel: "Cosa deve ottenere tutto questo?",
    goalsPlaceholder:
      "es. Più lead qualificati, operazioni più tranquille, un onboarding clienti più chiaro…",
    scopeNotesLabel: "Cosa deve esistere quando avremo finito?",
    scopeNotesPlaceholder:
      "Pagine, funzionalità, integrazioni, lingue, strumenti di amministrazione — gli elenchi puntati vanno bene.",
    inspirationLabel: "Qualcos'altro che dovremmo studiare?",
    inspirationPlaceholder:
      "Tono, pubblico, cose da evitare, parole del brand che ami, oppure «fallo sembrare come X ma più premium».",
  },
  path: {
    includedLabel: "Incluso",
    buyingLane: "Corsia d'acquisto",
    packageTitle: "Pacchetto",
    packageBody: "Corsia predefinita",
    customTitle: "Su misura",
    customBody: "Ambito personalizzato",
    noPackage:
      "Non è ancora disponibile alcun pacchetto fisso per questo servizio. Passa alla corsia del progetto su misura.",
    depositSuffix: (pct: number) => `${pct}% di acconto`,
    projectTypeTitle: "Tipo o categoria di progetto",
    optionsCount: (count: number) => `${count} opzioni`,
    projectTypePlaceholder: "Scegli il tipo di progetto…",
    deliveryPlatformTitle: "Piattaforma di consegna",
    platformPlaceholder: "Scegli la piattaforma…",
    designDirectionTitle: "Direzione di design",
    designPlaceholder: "Scegli la direzione di design…",
    contentLanguageTitle: "Lingua del progetto/contenuto",
    languagePlaceholder: "Scegli la lingua…",
    languageEnglish: "Inglese",
    languageFrench: "Francese",
    languageArabic: "Arabo",
    languagePortuguese: "Portoghese",
  },
  scope: {
    includedLabel: "Incluso",
    selectedCount: (selected: number, total: number) => `${selected}/${total} selezionati`,
    noneSelected: "Nessuno selezionato ancora",
    moreCount: (count: number) => `+${count}`,
    packageContext: "Contesto del pacchetto",
    packageModeBody:
      "La modalità pacchetto mantiene la corsia principale più pulita. Salta l'elenco delle pagine — il pacchetto le copre già. Spunta gli add-on o fissa uno stack tecnico qui sotto se conta per il tuo team.",
    pagesTitle: "Pagine o sezioni",
    pagesIntro:
      "Spunta le pagine di cui questo sito ha bisogno al lancio. Ogni pagina è quotata singolarmente così la proposta è dettagliata per voce — nulla di nascosto.",
    pagesKicker: "Pagine",
    featuresTitle: "Funzionalità richieste",
    featuresIntro:
      "Cosa deve fare il prodotto per gli utenti il primo giorno? Scegli ciò che è imprescindibile; suggeriremo aggiunte sensate durante la revisione della proposta.",
    featuresKicker: "Funzionalità",
    techStackTitle: "Stack tecnico",
    techStackIntro:
      "Indicaci le tue preferenze. Le rispetteremo dove giova al progetto, e obietteremo con onestà dove un'altra scelta ti servirebbe meglio. Le differenze di costo sono mostrate — la maggior parte delle scelte è a costo zero.",
    programmingLanguageLabel: "Linguaggio di programmazione preferito",
    chooseLanguage: "Scegli il linguaggio…",
    frameworkLabel: "Framework frontend / app",
    chooseFramework: "Scegli il framework…",
    backendLabel: "Backend / piattaforma dati",
    chooseBackend: "Scegli il backend…",
    hostingLabel: "Hosting / deployment",
    chooseHost: "Scegli l'host…",
    stackPhilosophyKicker: "Filosofia dello stack",
    stackPhilosophyHint: "Scegli nessuno o molti",
    addOnsTitle: "Servizi aggiuntivi",
    addOnsIntro:
      "Lavoro di supporto facoltativo. Salta ciò che non serve — il prezzo si ricalcola in tempo reale.",
    addOnsKicker: "Add-on",
  },
};

const ZH: DeepPartial<StudioRequestCopy> = {
  copilot: {
    examplePrompts: {
      logisticsLabel: "物流 SaaS",
      logisticsBody:
        "一款面向拉各斯最后一公里配送的物流 SaaS。骑手在手机应用上跟踪任务，调度员在网页仪表盘上分派和改派。我们需要面向客户的下单页面、骑手移动端体验、调度控制台、支付和数据分析。十周内上线。",
      investmentLabel: "会员投资平台",
      investmentBody:
        "一个面向尼日利亚合格投资者的会员制投资平台。用户提交申请、签署文件、通过银行转账充值账户，并每月查看业绩更新。需具备强 KYC、双重身份验证，以及一个管理端合规仪表盘。我们希望呈现简洁、克制、高管气质的风格。预算约为八百万至一千五百万奈拉。",
      opsLabel: "内部运营工具",
      opsBody:
        "一款面向我们 30 人团队的内部运营工具。包含项目受理、里程碑跟踪、工时记录、开票和客户门户。必须与我们现有的会计软件集成。应让人感到从容、不被淹没。六周内进行软启动。",
    },
    kicker: "需求简报副驾 · Studio Intelligence",
    heading: "用你自己的话描述你想要什么，我们来帮你梳理结构。",
    intro:
      "一段话就够了——目标、受众、核心功能和任何限制。副驾会起草简报的其余部分；提交前每个字段都可在下方编辑。",
    describeLabel: "描述你的项目",
    placeholder:
      "一款面向拉各斯最后一公里配送的物流 SaaS。骑手在手机应用上跟踪任务，调度员在网页仪表盘上分派和改派……",
    tip: "提示：少于 8 句效果最佳。",
    charactersLeft: (count: number) => `还可输入 ${count} 个字符`,
    trim: "稍微精简一下",
    starterPointsLabel: "试试以下任一起点",
    exampleBadge: "示例",
    seededBelow: "简报已在下方预填——提交前请检查每个字段。",
    footerNote:
      "早期用户免费 · 由 HenryCo Studio Intelligence 提供支持 · 你的文本绝不会用于训练外部模型。",
    tryDifferentParagraph: "换一段试试",
    draftingBrief: "正在起草你的简报…",
    redraftBrief: "重新起草简报",
    draftMyBrief: "起草我的简报",
    coPilotDraft: "副驾草稿",
    confidence: (pct: number) => `置信度 ${pct}%`,
    cacheHit: "命中缓存 · 更快更省",
    fieldProjectType: "项目类型",
    fieldBudgetBand: "预算区间",
    fieldUrgency: "紧急程度",
    fieldDesignDirection: "设计方向",
    fieldPages: "页面 / 板块",
    fieldFeatures: "所需功能",
    worthClarifying: "向下滚动时值得进一步澄清",
    seededControl:
      "下方的简报现已用这些答案预填。提交前你可以修改任何内容——主动权在你手中。",
    reapplyToBrief: "重新应用到下方简报",
    callsRemaining: (count: number, noun: string) => `本时段还剩 ${count} 次副驾${noun}。`,
    draftSingular: "草稿",
    draftPlural: "草稿",
    nextSteps: "后续步骤",
    reviewRefineTitle: "审阅并完善简报",
    reviewRefineBody: "每个字段都可在下方编辑。",
    talkToLeadTitle: "先与一位 Studio 负责人沟通",
    submitLockTitle: "提交并锁定范围",
    talkToLeadBody:
      "还有一些细节需要澄清——资深负责人可在 15 分钟内与你一起梳理简报。",
    submitLockBody:
      "提交简报；我们将在一个工作日内出具固定价格方案和定金发票。",
    skipTemplateTitle: "或跳过——在模板上支付定金",
    payDepositTitle: "支付定金并开始",
    skipTemplateBody:
      "现成模板数日内即可交付。如果你想完全跳过简报，可浏览模板库。",
    payDepositBody:
      "立即预订名额——你的定金到账后，我们即刻开启项目工作区。",
    emptyDash: "—",
  },
  activation: {
    outcomePoint1:
      "你上一步的域名选择会随简报一同传递——上线前我们会与你确认注册和 DNS。",
    outcomePoint2:
      "你将获得一份真实的 Studio 记录：方案、工作区和付款节点——而不是被遗忘的表单提交。",
    outcomePoint3:
      "定金保住你的名额；上传凭证让财务更高效；里程碑与文件都保留在同一个客户级门户中。",
    teamRecommendPlaceholder: "让 HenryCo 推荐最合适的团队",
    reviewSend: "审阅并发送",
    teamFit: "团队匹配",
    preferredTeam: "首选团队",
    matchStrongest:
      "我们将根据范围、紧急程度和你所在行业的信号，为你的简报匹配最强团队。",
    fullName: "全名",
    companyOptional: "公司、学校或品牌（可选）",
    bestEmail: "接收更新的最佳邮箱",
    whatsappOrPhone: "WhatsApp 或电话（便于快速确认细节）",
    depositConsent:
      "一旦 HenryCo 与我确认范围和价格，我便准备好确保一条以定金为依托的通道。",
    whatHappensTitle: "提交后会发生什么",
    nothingGoesLive:
      "在你批准范围和付款之前，不会有任何内容上线。在定金到账前，你仍可与负责人调整参考资料或联系方式——本次提交只是开启你结构化的 Studio 记录。",
    submitLabel: "提交 Studio 简报",
    submitPendingLabel: "正在生成你的 Studio 简报...",
  },
  builder: {
    loading: "加载中",
    loadingNextStep: "正在加载下一步",
    continueLabel: "继续",
    back: "返回",
    projectBrief: "项目简报",
    stepProgress: (current: string, total: string) => `第 ${current} / ${total} 步`,
    percentComplete: (pct: number) => `已完成 ${pct}%`,
    progressSaved: "进度已保存——只要保持登录，你可以随时离开并返回。",
    teamRecommendationFallback: "HenryCo 团队推荐",
  },
  commercial: {
    budgetLabel: "项目预算 · NGN",
    budgetPlaceholder: "₦1,500,000",
    budgetHint: "固定价格。方案确认时锁定——绝无意外超支。",
    includedLabel: "已包含",
    commercialContext: "商务背景",
    intro:
      "告诉我们预算和期望成果。我们将在一个工作日内带着固定范围、固定交付窗口以及一位具名的资深负责人回复你——不转交初级人员，不发生范围漂移。",
    seniorTeamTitle: "资深团队",
    seniorTeamBody: "策略师、设计师和工程师一同启动；绝不只有初级人员。",
    fixedPriceTitle: "固定价格",
    fixedPriceBody: "方案确认时锁定。变更请求在开始前先行报价。",
    premiumDeliveryTitle: "高端交付",
    premiumDeliveryBody: "生产就绪的代码，已通过无障碍检查，第一天即可扩展。",
    businessTypeLabel: "业务类型",
    businessTypePlaceholder: "选择业务类型",
    urgencyLabel: "紧急程度",
    urgencyPlaceholder: "选择紧急程度",
    timelineLabel: "预期时间表",
    timelinePlaceholder: "选择时间表",
    goalsLabel: "这应当实现什么？",
    goalsPlaceholder: "例如：更多合格线索、更从容的运营、更清晰的客户引导……",
    scopeNotesLabel: "完成时需要存在哪些内容？",
    scopeNotesPlaceholder: "页面、功能、集成、语言、管理工具——用要点列出即可。",
    inspirationLabel: "还有什么我们应当研究的？",
    inspirationPlaceholder:
      "语气、受众、需要避免的事物、你喜欢的品牌词，或者“做得像 X，但更高端”。",
  },
  path: {
    includedLabel: "已包含",
    buyingLane: "购买通道",
    packageTitle: "套餐",
    packageBody: "预设通道",
    customTitle: "定制",
    customBody: "量身定制的范围",
    noPackage: "此服务暂无固定套餐。请切换到定制项目通道。",
    depositSuffix: (pct: number) => `${pct}% 定金`,
    projectTypeTitle: "项目类型或类别",
    optionsCount: (count: number) => `${count} 个选项`,
    projectTypePlaceholder: "选择项目类型…",
    deliveryPlatformTitle: "交付平台",
    platformPlaceholder: "选择平台…",
    designDirectionTitle: "设计方向",
    designPlaceholder: "选择设计方向…",
    contentLanguageTitle: "项目/内容语言",
    languagePlaceholder: "选择语言…",
    languageEnglish: "英语",
    languageFrench: "法语",
    languageArabic: "阿拉伯语",
    languagePortuguese: "葡萄牙语",
  },
  scope: {
    includedLabel: "已包含",
    selectedCount: (selected: number, total: number) => `已选 ${selected}/${total}`,
    noneSelected: "尚未选择",
    moreCount: (count: number) => `+${count}`,
    packageContext: "套餐背景",
    packageModeBody:
      "套餐模式让核心通道更清爽。跳过页面列表——套餐已涵盖。如果对你的团队很重要，可在下方勾选附加项或固定技术栈。",
    pagesTitle: "页面或板块",
    pagesIntro:
      "勾选本站上线时所需的页面。每个页面单独计价，方案因此逐项列明——毫无隐藏。",
    pagesKicker: "页面",
    featuresTitle: "所需功能",
    featuresIntro:
      "产品在第一天需要为用户做什么？挑选不可妥协的部分；我们会在方案评审时提出合理的补充建议。",
    featuresKicker: "功能",
    techStackTitle: "技术栈",
    techStackIntro:
      "告诉我们你的偏好。在有利于项目之处我们会尊重它们，在另一种选择更有利于你之处我们会坦诚提出异议。会显示成本差异——大多数选择都无额外费用。",
    programmingLanguageLabel: "首选编程语言",
    chooseLanguage: "选择语言…",
    frameworkLabel: "前端 / 应用框架",
    chooseFramework: "选择框架…",
    backendLabel: "后端 / 数据平台",
    chooseBackend: "选择后端…",
    hostingLabel: "托管 / 部署",
    chooseHost: "选择主机…",
    stackPhilosophyKicker: "技术栈理念",
    stackPhilosophyHint: "可不选或多选",
    addOnsTitle: "附加服务",
    addOnsIntro: "可选的支持性工作。不需要的可跳过——价格会实时重新计算。",
    addOnsKicker: "附加项",
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<StudioRequestCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
};
// ig, yo, ha, hi are intentionally OMITTED -> fall back to EN (human-translation only).

export function getStudioRequestCopy(locale: AppLocale): StudioRequestCopy {
  const o = LOCALE_MAP[locale];
  if (o)
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      o as unknown as Record<string, unknown>,
    ) as unknown as StudioRequestCopy;
  return EN;
}
