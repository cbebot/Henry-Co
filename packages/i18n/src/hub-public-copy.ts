import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * HubPublicCopy — i18n surface for the public-facing chrome of the hub
 * site beyond the home page. Covers /about, /contact, /privacy, /terms,
 * and the editorial shell (CompanyPageClient + AboutHonestBlock +
 * AboutLeadershipGrid + ContactHeroLayout + HomepageFaqBlock).
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each locale is
 * a Partial that deep-merges over EN so missing keys fall through to EN
 * silently. Mirrors the shape of `hub-home-copy.ts`.
 */
export type HubPublicCopy = {
  search: {
    title: string;
    description: string;
    placeholder: string;
    signInLabel: string;
  };
  newsletter: {
    eyebrow: string;
    title: string;
    intro: string;
    promiseTitle: string;
    promises: string[];
    form: {
      emailLabel: string;
      emailPlaceholder: string;
      countryLabel: string;
      countryPlaceholder: string;
      topicsTitle: string;
      topicsHint: string;
      consent: string;
      submit: string;
      submitting: string;
      successCreatedTitle: string;
      successUpdatedTitle: string;
      successBody: string;
      managePrefs: string;
      openPreferenceCenter: string;
      errorSuppressed: string;
      errorGeneric: string;
      errorNetwork: string;
    };
  };
  footer: {
    description: string;
    columnCompany: string;
    columnLegal: string;
    home: string;
    about: string;
    contact: string;
    privacyPolicy: string;
    termsConditions: string;
    allRightsReserved: string;
    builtBy: string;
  };
  contactHero: {
    eyebrow: string;
    title: string;
    body: string;
    bulletPartnerships: string;
    bulletPress: string;
    bulletSupplier: string;
    ctaDivisions: string;
    ctaAbout: string;
  };
  companyPage: {
    recentlyUpdated: string;
    metaUpdated: string;
    metaSection: string;
    metaStandard: string;
    metaCorporateGrade: string;
    serverWarning: string;
    pageSectionsAria: string;
    footerEyebrow: string;
    footerTitle: string;
    footerBody: string;
    footerUseCase: string;
    footerUseCaseValue: string;
    footerStandard: string;
    footerStandardValue: string;
  };
  aboutHonest: {
    eyebrow: string;
    title: string;
    body: string;
    figureDivisionsLive: string;
    figureYearEstablished: string;
    figureOperatingCity: string;
    founderEyebrow: string;
    founderPhotoPlaceholder: string;
    founderPlaceholderTitle: string;
    founderPlaceholderBody: string;
    linkReachCompany: string;
    linkBrowseDivisions: string;
  };
  leadership: {
    roleFallback: string;
    toneOwner: string;
    toneManagement: string;
    toneFeatured: string;
    toneLeadership: string;
    actionContact: string;
    actionCall: string;
    actionLinkedin: string;
    actionFullProfile: string;
    modalCloseAria: string;
    modalEyebrow: string;
    modalBioFallback: string;
    emptyTitle: string;
    emptyBody: string;
    sharedSectionDescription: string;
    headerEyebrow: string;
    headerTitle: string;
    headerBody: string;
    metricProfiles: string;
    metricOwnership: string;
    metricManagement: string;
    spotlightEyebrow: string;
    spotlightBioFallback: string;
    sectionOwnershipTitle: string;
    sectionOwnershipEyebrow: string;
    sectionManagementTitle: string;
    sectionManagementEyebrow: string;
    sectionFeaturedTitle: string;
    sectionFeaturedEyebrow: string;
    sectionOthersTitle: string;
    sectionOthersEyebrow: string;
  };
  faqBlock: {
    eyebrow: string;
  };
  publicSiteShell: {
    brandFallback: string;
    colCompany: string;
    linkHome: string;
    linkAbout: string;
    linkContact: string;
    linkSearch: string;
    colHenryCo: string;
    linkHenryCoAccount: string;
    linkLanguagePrefs: string;
    linkEmailPrefs: string;
    colLegal: string;
    linkPrivacy: string;
    linkTerms: string;
    allRightsReserved: string;
    builtBy: string;
    menuDivisionsDirectory: string;
    menuAbout: string;
    menuContact: string;
  };
  newsletterUnsubscribe: {
    metaTitle: string;
    metaDescription: string;
    eyebrow: string;
    missingTitle: string;
    missingBody: string;
    missingCtaContact: string;
    missingCtaBack: string;
    errorTitle: string;
    errorManualNote: string;
    successTitle: string;
    successBody: string;
    changedMind: string;
    ctaSubscribeAgain: string;
    ctaManagePrefs: string;
  };
  /** V3 showcase surfaces (SP2): /v3 story + /v3/how-we-earn Earning Map. */
  v3: {
    story: {
      metaTitle: string;
      metaDescription: string;
      eyebrow: string;
      title: string;
      lede: string;
      primaryCta: string;
      earnLink: string;
      tryLink: string;
      shippedLink: string;
      divisionsTitle: string;
      divisionsLede: string;
      seeLive: string;
      /** One honest line per division, keyed by DivisionKey. */
      divisionBodies: Record<string, string>;
      /** Quiet, honest roadmap line (V3-60 framing — never vaporware). */
      roadmapNote: string;
      spineTitle: string;
      spineLede: string;
      spine: { title: string; body: string }[];
      honestyNote: string;
    };
    earn: {
      metaTitle: string;
      metaDescription: string;
      eyebrow: string;
      title: string;
      lede: string;
      testsTitle: string;
      tests: { title: string; body: string }[];
      rowsTitle: string;
      rowsLede: string;
      liveTag: string;
      earlyTag: string;
      rows: { division: string; mechanism: string; exchange: string; live: boolean }[];
      feeTitle: string;
      feeBody: string;
      closingTitle: string;
      closingBody: string;
    };
    shipped: {
      metaTitle: string;
      metaDescription: string;
      eyebrow: string;
      title: string;
      lede: string;
      seeLive: string;
      /** Per-division capability summary + items, keyed by DivisionKey. */
      divisions: Record<string, { summary: string; items: string[] }>;
      note: string;
    };
    journey: {
      metaTitle: string;
      metaDescription: string;
      eyebrow: string;
      title: string;
      lede: string;
      noAccountNote: string;
      steps: { title: string; body: string; linkLabel: string; division: string }[];
      closing: string;
    };
  };
};

const HUB_PUBLIC_COPY_EN: HubPublicCopy = {
  search: {
    title: "Search Henry Onyx",
    description: "Find divisions, account workflows, and support routes from one place.",
    placeholder: "Search divisions, orders, jobs, tracking…",
    signInLabel: "Sign in to continue",
  },
  newsletter: {
    eyebrow: "Editorial",
    title: "Newsletters, chosen carefully",
    intro:
      "We send less, so it matters. Choose your topics — change or unsubscribe any time.",
    promiseTitle: "What we promise",
    promises: [
      "Only topics you opted into.",
      "We pause sends during active support or billing issues.",
      "No invented stats, testimonials, or urgency.",
      "A working unsubscribe link in every email.",
    ],
    form: {
      emailLabel: "Email address",
      emailPlaceholder: "you@example.com",
      countryLabel: "Country (2-letter, optional)",
      countryPlaceholder: "NG",
      topicsTitle: "Pick what you want to hear about",
      topicsHint: "You can change or remove any of these later.",
      consent:
        "I agree to receive these newsletters from Henry Onyx I can unsubscribe any time, and sends are paused during active support or billing issues.",
      submit: "Subscribe",
      submitting: "Subscribing…",
      successCreatedTitle: "You're subscribed",
      successUpdatedTitle: "Preferences updated",
      successBody: "We'll email {email} about: {topics}.",
      managePrefs: "Manage preferences any time:",
      openPreferenceCenter: "open preference center",
      errorSuppressed: "This address is on our suppression list.",
      errorGeneric: "Something went wrong. Try again.",
      errorNetwork: "Network error.",
    },
  },
  footer: {
    description:
      "A premium multi-division corporate gateway designed to present the Henry Onyx ecosystem with clarity, trust, and long-term brand discipline.",
    columnCompany: "Company",
    columnLegal: "Legal",
    home: "Home",
    about: "About",
    contact: "Contact",
    privacyPolicy: "Privacy policy",
    termsConditions: "Terms & conditions",
    allRightsReserved: "All rights reserved.",
    builtBy: "Designed and built in-house by Henry Onyx Studio for the Henry Onyx ecosystem",
  },
  contactHero: {
    eyebrow: "Contact Henry Onyx",
    title:
      "Group-level conversations — partnerships, media, suppliers, investors, and anything that belongs to the parent company.",
    body:
      "For anything specific to a division, you will get a faster answer on that division's contact page. Use this form for company-level enquiries.",
    bulletPartnerships:
      "Partnerships, joint ventures, distribution introductions.",
    bulletPress: "Press, media, brand, and editorial enquiries.",
    bulletSupplier:
      "Supplier introductions, investor or advisor conversations, and concerns we should hear directly.",
    ctaDivisions: "Explore divisions",
    ctaAbout: "About the company",
  },
  companyPage: {
    recentlyUpdated: "Recently updated",
    metaUpdated: "Updated",
    metaSection: "Section",
    metaStandard: "Standard",
    metaCorporateGrade: "Corporate-grade",
    serverWarning: "Some content may still be refreshing.",
    pageSectionsAria: "Page sections",
    footerEyebrow: "Henry Onyx",
    footerTitle:
      "The same operating standard our customers, partners, and teams trust.",
    footerBody:
      "Every Henry Onyx company surface — about, contact, governance, policy — ships under one editorial standard so what you read in public matches what we hold ourselves to in private.",
    footerUseCase: "Use case",
    footerUseCaseValue: "Customers · Partners · Media",
    footerStandard: "Standard",
    footerStandardValue: "Structured · Verified",
  },
  aboutHonest: {
    eyebrow: "About this company",
    title: "One company, several focused businesses, one operating standard.",
    body:
      "Henry Onyx is a multi-division operating group. Each division runs its own market — Care, Marketplace, Property, Logistics, Studio, Jobs, Learn — on the same standard of presentation, booking, pricing, and follow-through. The hub exists so customers, partners, and stakeholders can see the whole company in one place and reach the right business in one step. We grow by adding divisions inside this framework, not by stretching one brand thin.",
    figureDivisionsLive: "Divisions live",
    figureYearEstablished: "Year established",
    figureOperatingCity: "Operating city",
    founderEyebrow: "Founder note",
    founderPhotoPlaceholder: "Photo",
    founderPlaceholderTitle: "Founder note — content managed via CMS",
    founderPlaceholderBody:
      "A short, signed note from the founder will appear here. The shape is ready — copy, photo, and signature flow in from the company CMS once published.",
    linkReachCompany: "Reach the company",
    linkBrowseDivisions: "Browse divisions",
  },
  leadership: {
    roleFallback: "Leadership profile",
    toneOwner: "Owner",
    toneManagement: "Management",
    toneFeatured: "Featured",
    toneLeadership: "Leadership",
    actionContact: "Contact",
    actionCall: "Call",
    actionLinkedin: "LinkedIn",
    actionFullProfile: "Full profile",
    modalCloseAria: "Close profile",
    modalEyebrow: "Leadership profile",
    modalBioFallback:
      "This profile is part of the Henry Onyx public leadership board.",
    emptyTitle: "Leadership information will appear here",
    emptyBody:
      "Publish leadership profiles from the owner dashboard to present ownership, management, and trusted company representatives in a polished public format.",
    sharedSectionDescription:
      "Profiles in this section reinforce the people, stewardship, and operational accountability behind Henry Onyx",
    headerEyebrow: "Leadership board",
    headerTitle: "Leadership and stewardship",
    headerBody:
      "Meet the people shaping Henry Onyx across ownership, public leadership, operational direction, and long-term accountability.",
    metricProfiles: "Profiles",
    metricOwnership: "Ownership",
    metricManagement: "Management",
    spotlightEyebrow: "Spotlight profile",
    spotlightBioFallback:
      "This leadership profile reflects the individuals responsible for direction, governance, and premium execution across Henry Onyx",
    sectionOwnershipTitle: "Ownership",
    sectionOwnershipEyebrow: "Company leadership",
    sectionManagementTitle: "Management",
    sectionManagementEyebrow: "Operational leadership",
    sectionFeaturedTitle: "Featured team",
    sectionFeaturedEyebrow: "Key representatives",
    sectionOthersTitle: "Additional profiles",
    sectionOthersEyebrow: "Company representation",
  },
  faqBlock: {
    eyebrow: "Frequently asked",
  },
  publicSiteShell: {
    brandFallback: "Henry Onyx",
    colCompany: "Company",
    linkHome: "Home",
    linkAbout: "About",
    linkContact: "Contact",
    linkSearch: "Search",
    colHenryCo: "Henry Onyx",
    linkHenryCoAccount: "Henry Onyx account",
    linkLanguagePrefs: "Language & preferences",
    linkEmailPrefs: "Email preferences",
    colLegal: "Legal",
    linkPrivacy: "Privacy",
    linkTerms: "Terms",
    allRightsReserved: "All rights reserved.",
    builtBy: "Designed and built in-house by Henry Onyx Studio for the Henry Onyx ecosystem",
    menuDivisionsDirectory: "Divisions directory",
    menuAbout: "About",
    menuContact: "Contact",
  },
  newsletterUnsubscribe: {
    metaTitle: "Unsubscribe — Henry Onyx",
    metaDescription: "One-click unsubscribe from Henry Onyx newsletters.",
    eyebrow: "Newsletter",
    missingTitle: "Unsubscribe link missing.",
    missingBody:
      "Open the “Unsubscribe” link from any Henry Onyx email to land here with a valid token. If your link has expired, contact us and we’ll honor it manually.",
    missingCtaContact: "Contact support",
    missingCtaBack: "Back to newsletters",
    errorTitle: "We couldn’t unsubscribe you.",
    errorManualNote:
      "If this keeps happening, reply “unsubscribe” to any Henry Onyx email and our team will honor it manually.",
    successTitle: "You’re unsubscribed.",
    successBody:
      "{{email}} won’t receive Henry Onyx newsletters. Transactional messages (receipts, shipping, verification, security) still send because we have to.",
    changedMind: "Changed your mind?",
    ctaSubscribeAgain: "Subscribe again",
    ctaManagePrefs: "Manage all preferences",
  },
  v3: {
    story: {
      metaTitle: "The ecosystem — {brand}",
      metaDescription:
        "One account, one wallet, one conversation spine — across care, marketplace, jobs, learn, logistics, studio, and property. Every claim on this page opens the live product.",
      eyebrow: "The ecosystem",
      title: "One account. One wallet. Seven live divisions.",
      lede:
        "Henry Onyx is one connected economy: book care, shop verified sellers, get hired, learn a skill, ship a parcel, commission creative work, find a home — on one identity, one wallet, one conversation spine. Nothing on this page is a mockup; every link opens the real thing.",
      primaryCta: "Browse the ecosystem",
      earnLink: "How we earn — in plain language",
      tryLink: "Try the journey",
      shippedLink: "What's live",
      divisionsTitle: "The divisions",
      divisionsLede: "Each one is a full product. Every row opens the live surface — that is the proof.",
      seeLive: "See it live",
      divisionBodies: {
        care: "Home and fabric care, booked with verified providers and honest pricing.",
        marketplace: "Shop verified sellers, with every order tracked to your door.",
        jobs: "Apply, interview, and get hired — with real conversations, not black holes.",
        learn: "Courses with free previews, fair prices, and certificates that mean something.",
        logistics: "Shipments quoted up front and tracked end to end.",
        studio: "Commission creative work with a shared client workspace.",
        property: "Find and inquire about property with verified listings.",
      },
      roadmapNote:
        "Next on the roadmap: the Gaming Arena. It appears here when it's real — not before.",
      spineTitle: "The spine they share",
      spineLede: "The parts you feel everywhere, whichever division you use.",
      spine: [
        {
          title: "One identity",
          body: "One account signs into every division. Your saved items, messages, and history follow you.",
        },
        {
          title: "Honest money",
          body: "A double-entry ledger behind every payment, tax itemized, receipts that name the legal entity. No hidden fees — the fee line is a feature, not a confession.",
        },
        {
          title: "One conversation spine",
          body: "Buyer to seller, candidate to employer, client to team — the same messaging engine with the same safety rules everywhere.",
        },
        {
          title: "Your language",
          body: "Twelve locales, one product. Prices in your currency, not ours.",
        },
      ],
      honestyNote:
        "If something on this page ever doesn't match the product, that's a bug — tell us and we'll fix the page or the product, whichever is wrong.",
    },
    earn: {
      metaTitle: "How we earn — {brand}",
      metaDescription:
        "Every revenue mechanism at Henry Onyx, in plain language: what we charge, what you get in exchange, and the three tests every fee must pass.",
      eyebrow: "The earning map",
      title: "How Henry Onyx earns",
      lede:
        "Most platforms hide this page. We think that's the tell. Here is every way we make money, what you get in exchange, and the tests a fee must pass before it exists.",
      testsTitle: "The three tests",
      tests: [
        {
          title: "You know what you're paying for",
          body: "No hidden fees, no surprise charges. If a fee applies, it's a named line item before you commit.",
        },
        {
          title: "You get more than it costs",
          body: "Every charge maps to something you value — and we can name it in one sentence.",
        },
        {
          title: "We'd publish the rate",
          body: "If we'd be uncomfortable seeing a rate in a screenshot on social media, the rate is wrong.",
        },
      ],
      rowsTitle: "Division by division",
      rowsLede:
        "Mechanisms, not fine print. Where a division is still early, we say so — no fee turns on before its row appears here.",
      liveTag: "Live today",
      earlyTag: "Published before it turns on",
      rows: [
        {
          division: "marketplace",
          mechanism: "A commission on completed orders, and promoted placements always labeled as promoted.",
          exchange: "Verified sellers, payment protection, order tracking, and a real dispute process.",
          live: true,
        },
        {
          division: "care",
          mechanism: "A platform fee on completed bookings, itemized at checkout.",
          exchange: "Vetted providers, honest pricing, rebooking with one tap, and support that answers.",
          live: true,
        },
        {
          division: "learn",
          mechanism: "A revenue share with instructors on paid courses.",
          exchange: "Free previews before you pay, fair prices, and shareable certificates.",
          live: true,
        },
        {
          division: "studio",
          mechanism: "A project fee on commissioned creative work.",
          exchange: "A shared workspace, milestone clarity, and payment held until delivery.",
          live: true,
        },
        {
          division: "jobs",
          mechanism: "Employer-side tools and postings. Candidates never pay to apply.",
          exchange: "Real conversations with employers, application status you can see, interview scheduling.",
          live: true,
        },
        {
          division: "logistics",
          mechanism: "A margin on each shipment, quoted up front — the price you see is the price.",
          exchange: "Up-front quotes, carrier transparency, and end-to-end tracking.",
          live: true,
        },
        {
          division: "property",
          mechanism: "Listing and management tools for owners and managers.",
          exchange: "Verified listings and a documented inquiry trail.",
          live: false,
        },
      ],
      feeTitle: "The platform fee, named",
      feeBody:
        "Where a platform fee applies, it appears as its own line at checkout — never buried in the total. It funds the things that make the ecosystem trustworthy: verification, dispute resolution, and 24/7 support. The same explanation appears in the fee tooltip at every checkout, because you shouldn't need this page to find it.",
      closingTitle: "See something that fails the tests?",
      closingBody:
        "If any fee on Henry Onyx fails any of the three tests, it's misdesigned — tell us and we'll fix it. This page changes before pricing does, not after.",
    },
    shipped: {
      metaTitle: "What's live — {brand}",
      metaDescription:
        "The capability inventory: what each Henry Onyx division does today, with a live link for every claim. No roadmap dressed as product.",
      eyebrow: "The inventory",
      title: "What's live, division by division",
      lede:
        "A tight list of what each division does today. Every block links to the live surface — if it's on this page, you can use it right now. No roadmap dressed as product.",
      seeLive: "See it live",
      divisions: {
        care: {
          summary: "Home and fabric care with verified providers.",
          items: [
            "Browse services and book with verified providers",
            "Honest pricing shown before you commit",
            "Track bookings and rebook in one step",
          ],
        },
        marketplace: {
          summary: "Verified sellers, tracked orders.",
          items: [
            "Shop verified sellers with clear product pages",
            "Cart, checkout, and order tracking to your door",
            "Buyer-seller messaging with safety rules built in",
          ],
        },
        jobs: {
          summary: "Applications that talk back.",
          items: [
            "Browse and apply with a profile on file",
            "Candidate-employer conversations in real time",
            "Application status you can actually see",
          ],
        },
        learn: {
          summary: "Courses with fair prices.",
          items: [
            "Free previews before any payment",
            "Enroll, learn, and track progress",
            "Certificates you can share",
          ],
        },
        logistics: {
          summary: "Quotes up front, tracking throughout.",
          items: [
            "Get a shipment quote before you commit",
            "Book and track deliveries end to end",
          ],
        },
        studio: {
          summary: "Creative work with a shared workspace.",
          items: [
            "Request creative work with a clear brief",
            "A client workspace with milestones and messaging",
            "Card and wallet payment on delivery terms",
          ],
        },
        property: {
          summary: "Verified listings, documented inquiries.",
          items: [
            "Browse property listings",
            "Save listings and send documented inquiries",
          ],
        },
      },
      note:
        "Missing something you expected? Then we haven't shipped it — this page tracks the product, not the ambition. The roadmap lives with us until it's real.",
    },
    journey: {
      metaTitle: "Try the journey — {brand}",
      metaDescription:
        "A five-minute walk through the live Henry Onyx ecosystem — no account required to start, no sandbox, the real product at every step.",
      eyebrow: "Try it",
      title: "Walk the ecosystem in five minutes",
      lede:
        "This is not a demo environment. Every step below opens the live product, in your language, with prices in your currency. Start with nothing — no account, no email.",
      noAccountNote: "No account needed to start. You'll only be asked to identify yourself when you do something that needs identity — that's the rule everywhere on Henry Onyx.",
      steps: [
        {
          title: "Browse without signing in",
          body: "Open Fabric Care and browse verified providers. Everything is readable as a stranger — value before identification.",
          linkLabel: "Open Fabric Care",
          division: "care",
        },
        {
          title: "See a real price",
          body: "Open any service. The price is shown before you commit, in your currency, with any platform fee itemized and named.",
          linkLabel: "Browse services",
          division: "care",
        },
        {
          title: "Cross a division",
          body: "Same account, same wallet, different economy: shop verified sellers on the marketplace.",
          linkLabel: "Open the marketplace",
          division: "marketplace",
        },
        {
          title: "Check the jobs board",
          body: "Browse live roles. When you apply, the conversation with the employer is real and stays visible.",
          linkLabel: "Browse jobs",
          division: "jobs",
        },
        {
          title: "Preview a course free",
          body: "Open a course on Learn. The preview is free — you pay only when you choose to enroll.",
          linkLabel: "Open Learn",
          division: "learn",
        },
        {
          title: "Create your one account",
          body: "When you're ready, one sign-up works everywhere — your saved items, messages, and wallet follow you across every division.",
          linkLabel: "Create your account",
          division: "account",
        },
      ],
      closing:
        "That's the ecosystem. If any step felt slower, less honest, or less finished than this page promised, tell us — the page and the product are supposed to be the same thing.",
    },
  },
};

const HUB_PUBLIC_COPY_FR: DeepPartial<HubPublicCopy> = {
  footer: {
    description:
      "Une passerelle corporate multi-divisions premium, conçue pour présenter l’écosystème Henry Onyx avec clarté, confiance et une discipline de marque de long terme.",
    columnCompany: "Entreprise",
    columnLegal: "Mentions légales",
    home: "Accueil",
    about: "À propos",
    contact: "Contact",
    privacyPolicy: "Politique de confidentialité",
    termsConditions: "Conditions générales",
    allRightsReserved: "Tous droits réservés.",
    builtBy: "Conçu et développé en interne par Henry Onyx Studio pour l’écosystème Henry Onyx",
  },
  contactHero: {
    eyebrow: "Contacter Henry Onyx",
    title:
      "Conversations au niveau du groupe — partenariats, médias, fournisseurs, investisseurs, et tout ce qui relève de la maison mère.",
    body:
      "Pour toute demande spécifique à une division, vous obtiendrez une réponse plus rapide sur la page de contact de cette division. Utilisez ce formulaire pour les sujets corporate.",
    bulletPartnerships:
      "Partenariats, coentreprises, mises en relation pour la distribution.",
    bulletPress: "Presse, médias, marque et demandes éditoriales.",
    bulletSupplier:
      "Introductions de fournisseurs, échanges avec investisseurs ou conseillers, et sujets que nous devrions entendre directement.",
    ctaDivisions: "Explorer les divisions",
    ctaAbout: "À propos de l’entreprise",
  },
  companyPage: {
    recentlyUpdated: "Récemment mis à jour",
    metaUpdated: "Mis à jour",
    metaSection: "Section",
    metaStandard: "Standard",
    metaCorporateGrade: "Niveau corporate",
    serverWarning: "Certains contenus sont peut-être encore en cours d’actualisation.",
    pageSectionsAria: "Sections de la page",
    footerEyebrow: "Henry Onyx",
    footerTitle:
      "Le même standard opérationnel auquel se fient nos clients, partenaires et équipes.",
    footerBody:
      "Chaque surface corporate Henry Onyx — à propos, contact, gouvernance, politique — est publiée selon un seul standard éditorial : ce que vous lisez en public reflète ce que nous tenons en privé.",
    footerUseCase: "Cas d’usage",
    footerUseCaseValue: "Clients · Partenaires · Médias",
    footerStandard: "Standard",
    footerStandardValue: "Structuré · Vérifié",
  },
  aboutHonest: {
    eyebrow: "À propos de cette entreprise",
    title: "Une entreprise, plusieurs activités ciblées, un seul standard opérationnel.",
    body:
      "Henry Onyx est un groupe opérationnel multi-divisions. Chaque division pilote son propre marché — Care, Marketplace, Property, Logistics, Studio, Jobs, Learn — avec le même niveau d’exigence en matière de présentation, de réservation, de tarification et de suivi. Le hub existe pour que clients, partenaires et parties prenantes voient l’entreprise dans son ensemble et rejoignent la bonne activité en une étape. Nous grandissons en ajoutant des divisions dans ce cadre, sans étirer une marque unique.",
    figureDivisionsLive: "Divisions actives",
    figureYearEstablished: "Année de création",
    figureOperatingCity: "Ville d’exploitation",
    founderEyebrow: "Note du fondateur",
    founderPhotoPlaceholder: "Photo",
    founderPlaceholderTitle: "Note du fondateur — contenu géré via le CMS",
    founderPlaceholderBody:
      "Une courte note signée du fondateur apparaîtra ici. La structure est prête — texte, photo et signature s’afficheront automatiquement dès la publication depuis le CMS de l’entreprise.",
    linkReachCompany: "Joindre l’entreprise",
    linkBrowseDivisions: "Parcourir les divisions",
  },
  leadership: {
    roleFallback: "Profil de direction",
    toneOwner: "Propriétaire",
    toneManagement: "Direction",
    toneFeatured: "À la une",
    toneLeadership: "Leadership",
    actionContact: "Contacter",
    actionCall: "Appeler",
    actionLinkedin: "LinkedIn",
    actionFullProfile: "Profil complet",
    modalCloseAria: "Fermer le profil",
    modalEyebrow: "Profil de direction",
    modalBioFallback:
      "Ce profil fait partie du conseil de direction public de Henry Onyx",
    emptyTitle: "Les informations de direction apparaîtront ici",
    emptyBody:
      "Publiez des profils de direction depuis le tableau de bord propriétaire pour présenter l’actionnariat, la direction et les représentants de confiance de l’entreprise dans un format public soigné.",
    sharedSectionDescription:
      "Les profils de cette section incarnent les personnes, la gouvernance et la responsabilité opérationnelle qui portent le groupe Henry Onyx",
    headerEyebrow: "Conseil de direction",
    headerTitle: "Direction et gouvernance",
    headerBody:
      "Découvrez les personnes qui façonnent Henry Onyx — actionnariat, leadership public, direction opérationnelle et responsabilité de long terme.",
    metricProfiles: "Profils",
    metricOwnership: "Actionnariat",
    metricManagement: "Direction",
    spotlightEyebrow: "Profil en lumière",
    spotlightBioFallback:
      "Ce profil de direction représente les personnes responsables de l’orientation, de la gouvernance et de l’exécution premium au sein du groupe Henry Onyx",
    sectionOwnershipTitle: "Actionnariat",
    sectionOwnershipEyebrow: "Direction de l’entreprise",
    sectionManagementTitle: "Direction",
    sectionManagementEyebrow: "Leadership opérationnel",
    sectionFeaturedTitle: "Équipe à la une",
    sectionFeaturedEyebrow: "Représentants clés",
    sectionOthersTitle: "Profils complémentaires",
    sectionOthersEyebrow: "Représentation de l’entreprise",
  },
  faqBlock: {
    eyebrow: "Questions fréquentes",
  },
  publicSiteShell: {
    brandFallback: "Henry Onyx",
    colCompany: "Entreprise",
    linkHome: "Accueil",
    linkAbout: "À propos",
    linkContact: "Contact",
    linkSearch: "Rechercher",
    colHenryCo: "Henry Onyx",
    linkHenryCoAccount: "Compte Henry Onyx",
    linkLanguagePrefs: "Langue et préférences",
    linkEmailPrefs: "Préférences e-mail",
    colLegal: "Mentions légales",
    linkPrivacy: "Confidentialité",
    linkTerms: "Conditions",
    allRightsReserved: "Tous droits réservés.",
    builtBy: "Conçu et développé en interne par Henry Onyx Studio pour l'écosystème Henry Onyx",
    menuDivisionsDirectory: "Annuaire des divisions",
    menuAbout: "À propos",
    menuContact: "Contact",
  },
  newsletterUnsubscribe: {
    metaTitle: "Se désabonner — Henry Onyx",
    metaDescription: "Désabonnement en un clic des newsletters Henry Onyx.",
    eyebrow: "Newsletter",
    missingTitle: "Lien de désabonnement manquant.",
    missingBody:
      "Ouvrez le lien « Se désabonner » d'un e-mail Henry Onyx pour arriver ici avec un jeton valide. Si votre lien a expiré, contactez-nous et nous l'honorerons manuellement.",
    missingCtaContact: "Contacter l'assistance",
    missingCtaBack: "Retour aux newsletters",
    errorTitle: "Nous n'avons pas pu vous désabonner.",
    errorManualNote:
      "Si cela continue, répondez « désabonner » à n'importe quel e-mail Henry Onyx et notre équipe l'honorera manuellement.",
    successTitle: "Vous êtes désabonné(e).",
    successBody:
      "{{email}} ne recevra plus les newsletters Henry Onyx. Les messages transactionnels (reçus, livraison, vérification, sécurité) continuent d'être envoyés car nous y sommes tenus.",
    changedMind: "Vous avez changé d'avis ?",
    ctaSubscribeAgain: "Se réabonner",
    ctaManagePrefs: "Gérer toutes les préférences",
  },
  v3: {
    story: {
      metaTitle: "L'écosystème — {brand}",
      metaDescription:
        "Un compte, un portefeuille, une messagerie unifiée — pour l'entretien, le marché, l'emploi, la formation, la logistique, le studio et l'immobilier. Chaque affirmation de cette page ouvre le produit réel.",
      eyebrow: "L'écosystème",
      title: "Un compte. Un portefeuille. Sept divisions en service.",
      lede:
        "Henry Onyx est une économie connectée : réservez un service, achetez auprès de vendeurs vérifiés, faites-vous recruter, apprenez un métier, expédiez un colis, commandez un travail créatif, trouvez un logement — avec une seule identité, un seul portefeuille, une seule messagerie. Rien ici n'est une maquette ; chaque lien ouvre le vrai produit.",
      primaryCta: "Parcourir l'écosystème",
      earnLink: "Comment nous gagnons de l'argent — en clair",
      tryLink: "Essayer le parcours",
      shippedLink: "Ce qui est en ligne",
      divisionsTitle: "Les divisions",
      divisionsLede: "Chacune est un produit complet. Chaque ligne ouvre la surface réelle — c'est la preuve.",
      seeLive: "Voir en direct",
      divisionBodies: {
        care: "Entretien de la maison et du linge, réservé auprès de prestataires vérifiés, à prix honnête.",
        marketplace: "Achetez auprès de vendeurs vérifiés, chaque commande suivie jusqu'à votre porte.",
        jobs: "Postulez, passez l'entretien, soyez recruté — avec de vraies conversations, pas des silences.",
        learn: "Des cours avec aperçu gratuit, des prix justes et des certificats qui comptent.",
        logistics: "Des expéditions au tarif annoncé d'avance et suivies de bout en bout.",
        studio: "Commandez un travail créatif avec un espace client partagé.",
        property: "Trouvez un bien et renseignez-vous sur des annonces vérifiées.",
      },
      roadmapNote:
        "Prochaine étape : la Gaming Arena. Elle apparaîtra ici quand elle sera réelle — pas avant.",
      spineTitle: "La colonne vertébrale commune",
      spineLede: "Ce que vous retrouvez partout, quelle que soit la division.",
      spine: [
        {
          title: "Une identité",
          body: "Un compte pour toutes les divisions. Vos favoris, messages et historique vous suivent.",
        },
        {
          title: "De l'argent honnête",
          body: "Une comptabilité en partie double derrière chaque paiement, la taxe détaillée, des reçus au nom de l'entité légale. Pas de frais cachés — la ligne de frais est une fierté, pas un aveu.",
        },
        {
          title: "Une messagerie unifiée",
          body: "Acheteur-vendeur, candidat-employeur, client-équipe : le même moteur de messagerie, avec les mêmes règles de sécurité partout.",
        },
        {
          title: "Votre langue",
          body: "Douze langues, un seul produit. Les prix dans votre devise, pas la nôtre.",
        },
      ],
      honestyNote:
        "Si cette page ne correspond pas au produit, c'est un bug — dites-le-nous et nous corrigerons la page ou le produit, selon ce qui est faux.",
    },
    earn: {
      metaTitle: "Comment nous gagnons de l'argent — {brand}",
      metaDescription:
        "Chaque mécanisme de revenu de Henry Onyx, en clair : ce que nous facturons, ce que vous recevez en échange, et les trois tests que chaque frais doit passer.",
      eyebrow: "La carte des revenus",
      title: "Comment Henry Onyx gagne de l'argent",
      lede:
        "La plupart des plateformes cachent cette page. Nous pensons que c'est révélateur. Voici chaque façon dont nous gagnons de l'argent, ce que vous recevez en échange, et les tests qu'un frais doit passer avant d'exister.",
      testsTitle: "Les trois tests",
      tests: [
        {
          title: "Vous savez ce que vous payez",
          body: "Pas de frais cachés, pas de surprise. Tout frais applicable est une ligne nommée avant votre engagement.",
        },
        {
          title: "Vous recevez plus que le prix",
          body: "Chaque montant correspond à une valeur réelle — que nous savons nommer en une phrase.",
        },
        {
          title: "Nous publierions le taux",
          body: "Si un taux nous gênerait en capture d'écran sur les réseaux, c'est que le taux est mauvais.",
        },
      ],
      rowsTitle: "Division par division",
      rowsLede:
        "Des mécanismes, pas des petites lignes. Quand une division est encore jeune, nous le disons — aucun frais ne s'active avant que sa ligne figure ici.",
      liveTag: "Actif aujourd'hui",
      earlyTag: "Publié avant activation",
      rows: [
        {
          division: "marketplace",
          mechanism: "Une commission sur les commandes finalisées, et des mises en avant toujours étiquetées comme telles.",
          exchange: "Vendeurs vérifiés, protection des paiements, suivi des commandes et un vrai processus de litige.",
          live: true,
        },
        {
          division: "care",
          mechanism: "Des frais de plateforme sur les réservations effectuées, détaillés au paiement.",
          exchange: "Prestataires vérifiés, prix honnêtes, re-réservation en un geste, et une assistance qui répond.",
          live: true,
        },
        {
          division: "learn",
          mechanism: "Un partage de revenus avec les formateurs sur les cours payants.",
          exchange: "Aperçus gratuits avant paiement, prix justes, certificats partageables.",
          live: true,
        },
        {
          division: "studio",
          mechanism: "Des frais de projet sur les travaux créatifs commandés.",
          exchange: "Un espace partagé, des jalons clairs, un paiement retenu jusqu'à la livraison.",
          live: true,
        },
        {
          division: "jobs",
          mechanism: "Outils et annonces côté employeur. Les candidats ne paient jamais pour postuler.",
          exchange: "De vraies conversations avec les employeurs, un statut visible, la planification d'entretiens.",
          live: true,
        },
        {
          division: "logistics",
          mechanism: "Une marge sur chaque expédition, annoncée d'avance — le prix affiché est le prix.",
          exchange: "Devis immédiats, transparence des transporteurs, suivi de bout en bout.",
          live: true,
        },
        {
          division: "property",
          mechanism: "Outils d'annonce et de gestion pour propriétaires et gestionnaires.",
          exchange: "Annonces vérifiées et un fil de demandes documenté.",
          live: false,
        },
      ],
      feeTitle: "Les frais de plateforme, nommés",
      feeBody:
        "Quand des frais de plateforme s'appliquent, ils apparaissent comme une ligne distincte au paiement — jamais noyés dans le total. Ils financent ce qui rend l'écosystème digne de confiance : vérification, résolution des litiges et assistance 24h/24. La même explication figure dans l'infobulle des frais à chaque paiement, car vous ne devriez pas avoir besoin de cette page pour la trouver.",
      closingTitle: "Un frais échoue aux tests ?",
      closingBody:
        "Si un frais de Henry Onyx échoue à l'un des trois tests, il est mal conçu — dites-le-nous et nous le corrigerons. Cette page change avant les prix, pas après.",
    },
  },
};
const HUB_PUBLIC_COPY_ES: DeepPartial<HubPublicCopy> = {
  footer: {
    description:
      "Una puerta de entrada corporativa multidivisión premium, concebida para presentar el ecosistema Henry Onyx con claridad, confianza y una disciplina de marca a largo plazo.",
    columnCompany: "Empresa",
    columnLegal: "Aviso legal",
    home: "Inicio",
    about: "Acerca de",
    contact: "Contacto",
    privacyPolicy: "Política de privacidad",
    termsConditions: "Términos y condiciones",
    allRightsReserved: "Todos los derechos reservados.",
    builtBy: "Diseñado y construido internamente por Henry Onyx Studio para el ecosistema Henry Onyx",
  },
  contactHero: {
    eyebrow: "Contactar con Henry Onyx",
    title:
      "Conversaciones a nivel de grupo: alianzas, medios, proveedores, inversores y todo lo que corresponda a la matriz.",
    body:
      "Para cualquier asunto específico de una división obtendrá una respuesta más rápida en la página de contacto de esa división. Use este formulario para consultas a nivel de empresa.",
    bulletPartnerships:
      "Alianzas, joint ventures e introducciones para distribución.",
    bulletPress: "Prensa, medios, marca y consultas editoriales.",
    bulletSupplier:
      "Presentaciones de proveedores, conversaciones con inversores o asesores, y asuntos que deberíamos escuchar directamente.",
    ctaDivisions: "Explorar divisiones",
    ctaAbout: "Sobre la empresa",
  },
  companyPage: {
    recentlyUpdated: "Actualizado recientemente",
    metaUpdated: "Actualizado",
    metaSection: "Sección",
    metaStandard: "Estándar",
    metaCorporateGrade: "Nivel corporativo",
    serverWarning: "Algunos contenidos aún pueden estar actualizándose.",
    pageSectionsAria: "Secciones de la página",
    footerEyebrow: "Henry Onyx",
    footerTitle:
      "El mismo estándar operativo en el que confían nuestros clientes, socios y equipos.",
    footerBody:
      "Cada superficie corporativa de Henry Onyx — acerca de, contacto, gobierno, política — se publica bajo un único estándar editorial, para que lo que se lee en público coincida con lo que mantenemos en privado.",
    footerUseCase: "Caso de uso",
    footerUseCaseValue: "Clientes · Socios · Medios",
    footerStandard: "Estándar",
    footerStandardValue: "Estructurado · Verificado",
  },
  aboutHonest: {
    eyebrow: "Sobre esta empresa",
    title: "Una empresa, varios negocios enfocados, un único estándar operativo.",
    body:
      "Henry Onyx es un grupo operativo multidivisión. Cada división opera su propio mercado — Care, Marketplace, Property, Logistics, Studio, Jobs, Learn — bajo el mismo estándar de presentación, reservas, precios y seguimiento. El hub existe para que clientes, socios y grupos de interés vean la empresa en su conjunto y lleguen al negocio adecuado en un solo paso. Crecemos añadiendo divisiones dentro de este marco, no estirando una sola marca.",
    figureDivisionsLive: "Divisiones activas",
    figureYearEstablished: "Año de fundación",
    figureOperatingCity: "Ciudad de operación",
    founderEyebrow: "Nota del fundador",
    founderPhotoPlaceholder: "Foto",
    founderPlaceholderTitle: "Nota del fundador — contenido gestionado por CMS",
    founderPlaceholderBody:
      "Aquí aparecerá una breve nota firmada por el fundador. La estructura está lista — texto, foto y firma se incorporarán desde el CMS de la empresa una vez publicados.",
    linkReachCompany: "Contactar con la empresa",
    linkBrowseDivisions: "Explorar las divisiones",
  },
  leadership: {
    roleFallback: "Perfil de dirección",
    toneOwner: "Propiedad",
    toneManagement: "Dirección",
    toneFeatured: "Destacado",
    toneLeadership: "Liderazgo",
    actionContact: "Contactar",
    actionCall: "Llamar",
    actionLinkedin: "LinkedIn",
    actionFullProfile: "Perfil completo",
    modalCloseAria: "Cerrar perfil",
    modalEyebrow: "Perfil de dirección",
    modalBioFallback:
      "Este perfil forma parte del consejo público de liderazgo de Henry Onyx",
    emptyTitle: "Aquí aparecerá la información de liderazgo",
    emptyBody:
      "Publique perfiles de liderazgo desde el panel del propietario para presentar la propiedad, la dirección y los representantes de confianza de la empresa en un formato público cuidado.",
    sharedSectionDescription:
      "Los perfiles de esta sección reflejan las personas, la administración y la responsabilidad operativa que sostienen al grupo Henry Onyx",
    headerEyebrow: "Consejo de liderazgo",
    headerTitle: "Liderazgo y gobierno",
    headerBody:
      "Conozca a las personas que dan forma a Henry Onyx en propiedad, liderazgo público, dirección operativa y responsabilidad a largo plazo.",
    metricProfiles: "Perfiles",
    metricOwnership: "Propiedad",
    metricManagement: "Dirección",
    spotlightEyebrow: "Perfil en foco",
    spotlightBioFallback:
      "Este perfil de liderazgo representa a las personas responsables de la dirección, el gobierno y la ejecución premium en el grupo Henry Onyx",
    sectionOwnershipTitle: "Propiedad",
    sectionOwnershipEyebrow: "Liderazgo de la empresa",
    sectionManagementTitle: "Dirección",
    sectionManagementEyebrow: "Liderazgo operativo",
    sectionFeaturedTitle: "Equipo destacado",
    sectionFeaturedEyebrow: "Representantes clave",
    sectionOthersTitle: "Perfiles adicionales",
    sectionOthersEyebrow: "Representación de la empresa",
  },
  faqBlock: {
    eyebrow: "Preguntas frecuentes",
  },
  publicSiteShell: {
    brandFallback: "Henry Onyx",
    colCompany: "Empresa",
    linkHome: "Inicio",
    linkAbout: "Acerca de",
    linkContact: "Contacto",
    linkSearch: "Buscar",
    colHenryCo: "Henry Onyx",
    linkHenryCoAccount: "Cuenta Henry Onyx",
    linkLanguagePrefs: "Idioma y preferencias",
    linkEmailPrefs: "Preferencias de correo",
    colLegal: "Aviso legal",
    linkPrivacy: "Privacidad",
    linkTerms: "Condiciones",
    allRightsReserved: "Todos los derechos reservados.",
    builtBy: "Diseñado y construido internamente por Henry Onyx Studio para el ecosistema Henry Onyx",
    menuDivisionsDirectory: "Directorio de divisiones",
    menuAbout: "Acerca de",
    menuContact: "Contacto",
  },
  newsletterUnsubscribe: {
    metaTitle: "Cancelar suscripción — Henry Onyx",
    metaDescription: "Cancela tu suscripción a los boletines de Henry Onyx con un clic.",
    eyebrow: "Boletín",
    missingTitle: "Enlace de cancelación no encontrado.",
    missingBody:
      "Abre el enlace «Cancelar suscripción» de cualquier correo de Henry Onyx para llegar aquí con un token válido. Si tu enlace ha caducado, contáctanos y lo gestionaremos manualmente.",
    missingCtaContact: "Contactar con soporte",
    missingCtaBack: "Volver a los boletines",
    errorTitle: "No hemos podido cancelar tu suscripción.",
    errorManualNote:
      "Si el problema persiste, responde «cancelar suscripción» a cualquier correo de Henry Onyx y nuestro equipo lo gestionará manualmente.",
    successTitle: "Ya estás dado de baja.",
    successBody:
      "{{email}} no recibirá más boletines de Henry Onyx. Los mensajes transaccionales (recibos, envíos, verificación, seguridad) seguirán enviándose porque estamos obligados a ello.",
    changedMind: "¿Has cambiado de opinión?",
    ctaSubscribeAgain: "Suscribirse de nuevo",
    ctaManagePrefs: "Gestionar todas las preferencias",
  },
  v3: {
    story: {
      metaTitle: "El ecosistema — {brand}",
      metaDescription:
        "Una cuenta, una billetera, una misma columna de conversación — en cuidado del hogar, marketplace, empleo, formación, logística, estudio y propiedades. Cada afirmación de esta página abre el producto real.",
      eyebrow: "El ecosistema",
      title: "Una cuenta. Una billetera. Siete divisiones en funcionamiento.",
      lede:
        "Henry Onyx es una economía conectada: reserva servicios de cuidado, compra a vendedores verificados, consigue empleo, aprende una habilidad, envía un paquete, encarga trabajo creativo, encuentra un hogar — con una sola identidad, una sola billetera y una misma columna de conversación. Nada en esta página es una maqueta; cada enlace abre el producto real.",
      primaryCta: "Explorar el ecosistema",
      earnLink: "Cómo ganamos dinero — explicado con claridad",
      tryLink: "Probar el recorrido",
      shippedLink: "Qué está activo",
      divisionsTitle: "Las divisiones",
      divisionsLede: "Cada una es un producto completo. Cada fila abre la superficie real — esa es la prueba.",
      seeLive: "Verlo en funcionamiento",
      divisionBodies: {
        care: "Cuidado del hogar y de tejidos, con proveedores verificados y precios honestos.",
        marketplace: "Compra a vendedores verificados, con cada pedido rastreado hasta tu puerta.",
        jobs: "Postúlate, entrevístate y consigue el empleo — con conversaciones reales, no silencios.",
        learn: "Cursos con vistas previas gratuitas, precios justos y certificados que valen algo.",
        logistics: "Envíos con precio cotizado por adelantado y rastreo de principio a fin.",
        studio: "Encarga trabajo creativo con un espacio compartido con el cliente.",
        property: "Encuentra propiedades y consulta sobre ellas con anuncios verificados.",
      },
      roadmapNote:
        "Lo próximo en el plan: la Gaming Arena. Aparecerá aquí cuando sea real — no antes.",
      spineTitle: "La columna que comparten",
      spineLede: "Las partes que sientes en todas partes, uses la división que uses.",
      spine: [
        {
          title: "Una sola identidad",
          body: "Una cuenta inicia sesión en todas las divisiones. Tus elementos guardados, mensajes e historial te acompañan.",
        },
        {
          title: "Dinero honesto",
          body: "Un libro contable de partida doble detrás de cada pago, impuestos desglosados y recibos que nombran a la entidad legal. Sin tarifas ocultas — la línea de tarifa es una prestación, no una confesión.",
        },
        {
          title: "Una misma columna de conversación",
          body: "De comprador a vendedor, de candidato a empleador, de cliente a equipo — el mismo motor de mensajería con las mismas reglas de seguridad en todas partes.",
        },
        {
          title: "Tu idioma",
          body: "Doce idiomas, un solo producto. Precios en tu moneda, no en la nuestra.",
        },
      ],
      honestyNote:
        "Si algo en esta página alguna vez no coincide con el producto, es un error — dínoslo y corregiremos la página o el producto, lo que esté mal.",
    },
    earn: {
      metaTitle: "Cómo ganamos dinero — {brand}",
      metaDescription:
        "Cada mecanismo de ingresos de Henry Onyx, explicado con claridad: qué cobramos, qué recibes a cambio y las tres pruebas que toda tarifa debe superar.",
      eyebrow: "El mapa de ingresos",
      title: "Cómo gana dinero Henry Onyx",
      lede:
        "La mayoría de las plataformas ocultan esta página. Creemos que eso lo dice todo. Aquí está cada forma en que ganamos dinero, qué recibes a cambio y las pruebas que una tarifa debe superar antes de existir.",
      testsTitle: "Las tres pruebas",
      tests: [
        {
          title: "Sabes por qué estás pagando",
          body: "Sin tarifas ocultas ni cargos sorpresa. Si se aplica una tarifa, aparece como una línea con nombre antes de que te comprometas.",
        },
        {
          title: "Recibes más de lo que cuesta",
          body: "Cada cargo corresponde a algo que valoras — y podemos nombrarlo en una frase.",
        },
        {
          title: "Publicaríamos la tarifa",
          body: "Si nos incomodara ver una tarifa en una captura de pantalla en redes sociales, la tarifa está mal.",
        },
      ],
      rowsTitle: "División por división",
      rowsLede:
        "Mecanismos, no letra pequeña. Cuando una división aún está en una etapa temprana, lo decimos — ninguna tarifa se activa antes de que su fila aparezca aquí.",
      liveTag: "Activo hoy",
      earlyTag: "Publicado antes de activarse",
      rows: [
        {
          division: "marketplace",
          mechanism: "Una comisión sobre pedidos completados y ubicaciones promocionadas siempre etiquetadas como promocionadas.",
          exchange: "Vendedores verificados, protección de pagos, rastreo de pedidos y un proceso de disputas real.",
          live: true,
        },
        {
          division: "care",
          mechanism: "Una tarifa de plataforma sobre reservas completadas, desglosada al pagar.",
          exchange: "Proveedores evaluados, precios honestos, reservar de nuevo con un toque y un soporte que responde.",
          live: true,
        },
        {
          division: "learn",
          mechanism: "Una participación en los ingresos con los instructores en los cursos de pago.",
          exchange: "Vistas previas gratuitas antes de pagar, precios justos y certificados que puedes compartir.",
          live: true,
        },
        {
          division: "studio",
          mechanism: "Una tarifa de proyecto sobre el trabajo creativo por encargo.",
          exchange: "Un espacio de trabajo compartido, hitos claros y un pago retenido hasta la entrega.",
          live: true,
        },
        {
          division: "jobs",
          mechanism: "Herramientas y publicaciones para empleadores. Los candidatos nunca pagan por postularse.",
          exchange: "Conversaciones reales con empleadores, estado de la postulación siempre visible y programación de entrevistas.",
          live: true,
        },
        {
          division: "logistics",
          mechanism: "Un margen sobre cada envío, cotizado por adelantado — el precio que ves es el precio.",
          exchange: "Cotizaciones por adelantado, transparencia sobre los transportistas y rastreo de principio a fin.",
          live: true,
        },
        {
          division: "property",
          mechanism: "Herramientas de publicación y gestión para propietarios y administradores.",
          exchange: "Anuncios verificados y un historial documentado de consultas.",
          live: false,
        },
      ],
      feeTitle: "La tarifa de plataforma, con nombre",
      feeBody:
        "Cuando se aplica una tarifa de plataforma, aparece como su propia línea al pagar — nunca escondida en el total. Financia lo que hace confiable al ecosistema: verificación, resolución de disputas y soporte las 24 horas. La misma explicación aparece en la ayuda de la tarifa en cada pago, porque no deberías necesitar esta página para encontrarla.",
      closingTitle: "¿Ves algo que no supera las pruebas?",
      closingBody:
        "Si alguna tarifa de Henry Onyx no supera cualquiera de las tres pruebas, está mal diseñada — dínoslo y la corregiremos. Esta página cambia antes que los precios, no después.",
    },
  },
};
const HUB_PUBLIC_COPY_PT: DeepPartial<HubPublicCopy> = {
  footer: {
    description:
      "Um portal corporativo multidivisional premium, concebido para apresentar o ecossistema Henry Onyx com clareza, confiança e disciplina de marca a longo prazo.",
    columnCompany: "Empresa",
    columnLegal: "Jurídico",
    home: "Início",
    about: "Sobre",
    contact: "Contacto",
    privacyPolicy: "Política de privacidade",
    termsConditions: "Termos e condições",
    allRightsReserved: "Todos os direitos reservados.",
    builtBy: "Concebido e desenvolvido internamente pelo Henry Onyx Studio para o ecossistema Henry Onyx",
  },
  contactHero: {
    eyebrow: "Contactar a Henry Onyx",
    title:
      "Conversas a nível de grupo — parcerias, imprensa, fornecedores, investidores e tudo o que pertence à empresa-mãe.",
    body:
      "Para qualquer assunto específico de uma divisão, obterá uma resposta mais rápida na página de contacto dessa divisão. Use este formulário para questões a nível de empresa.",
    bulletPartnerships:
      "Parcerias, joint ventures e apresentações para distribuição.",
    bulletPress: "Imprensa, media, marca e questões editoriais.",
    bulletSupplier:
      "Apresentações de fornecedores, conversas com investidores ou consultores, e assuntos que devemos ouvir directamente.",
    ctaDivisions: "Explorar as divisões",
    ctaAbout: "Sobre a empresa",
  },
  companyPage: {
    recentlyUpdated: "Actualizado recentemente",
    metaUpdated: "Actualizado",
    metaSection: "Secção",
    metaStandard: "Padrão",
    metaCorporateGrade: "Nível corporativo",
    serverWarning: "Alguns conteúdos podem ainda estar a ser actualizados.",
    pageSectionsAria: "Secções da página",
    footerEyebrow: "Henry Onyx",
    footerTitle:
      "O mesmo padrão operacional em que confiam os nossos clientes, parceiros e equipas.",
    footerBody:
      "Cada superfície corporativa da Henry Onyx — sobre, contacto, governança, política — é publicada sob um único padrão editorial, para que o que se lê em público corresponda ao que mantemos em privado.",
    footerUseCase: "Caso de utilização",
    footerUseCaseValue: "Clientes · Parceiros · Media",
    footerStandard: "Padrão",
    footerStandardValue: "Estruturado · Verificado",
  },
  aboutHonest: {
    eyebrow: "Sobre esta empresa",
    title: "Uma empresa, vários negócios focados, um único padrão operacional.",
    body:
      "A Henry Onyx é um grupo operacional multidivisional. Cada divisão dirige o seu próprio mercado — Care, Marketplace, Property, Logistics, Studio, Jobs, Learn — sob o mesmo padrão de apresentação, reservas, preços e acompanhamento. O hub existe para que clientes, parceiros e partes interessadas vejam a empresa no seu conjunto e cheguem ao negócio certo num só passo. Crescemos acrescentando divisões dentro desta estrutura, e não esticando uma única marca.",
    figureDivisionsLive: "Divisões activas",
    figureYearEstablished: "Ano de fundação",
    figureOperatingCity: "Cidade de operação",
    founderEyebrow: "Nota do fundador",
    founderPhotoPlaceholder: "Foto",
    founderPlaceholderTitle: "Nota do fundador — conteúdo gerido por CMS",
    founderPlaceholderBody:
      "Aqui surgirá uma breve nota assinada pelo fundador. A estrutura está pronta — texto, foto e assinatura serão integrados a partir do CMS da empresa assim que publicados.",
    linkReachCompany: "Contactar a empresa",
    linkBrowseDivisions: "Explorar as divisões",
  },
  leadership: {
    roleFallback: "Perfil de liderança",
    toneOwner: "Proprietário",
    toneManagement: "Gestão",
    toneFeatured: "Destaque",
    toneLeadership: "Liderança",
    actionContact: "Contactar",
    actionCall: "Ligar",
    actionLinkedin: "LinkedIn",
    actionFullProfile: "Perfil completo",
    modalCloseAria: "Fechar perfil",
    modalEyebrow: "Perfil de liderança",
    modalBioFallback:
      "Este perfil faz parte do conselho público de liderança da Henry Onyx",
    emptyTitle: "Aqui aparecerão as informações de liderança",
    emptyBody:
      "Publique perfis de liderança a partir do painel do proprietário para apresentar a propriedade, a gestão e os representantes de confiança da empresa num formato público cuidado.",
    sharedSectionDescription:
      "Os perfis desta secção representam as pessoas, a administração e a responsabilidade operacional que sustentam o grupo Henry Onyx",
    headerEyebrow: "Conselho de liderança",
    headerTitle: "Liderança e governança",
    headerBody:
      "Conheça as pessoas que moldam a Henry Onyx — propriedade, liderança pública, direcção operacional e responsabilidade de longo prazo.",
    metricProfiles: "Perfis",
    metricOwnership: "Propriedade",
    metricManagement: "Gestão",
    spotlightEyebrow: "Perfil em destaque",
    spotlightBioFallback:
      "Este perfil de liderança reflecte as pessoas responsáveis pela direcção, governança e execução premium no grupo Henry Onyx",
    sectionOwnershipTitle: "Propriedade",
    sectionOwnershipEyebrow: "Liderança da empresa",
    sectionManagementTitle: "Gestão",
    sectionManagementEyebrow: "Liderança operacional",
    sectionFeaturedTitle: "Equipa em destaque",
    sectionFeaturedEyebrow: "Representantes principais",
    sectionOthersTitle: "Perfis adicionais",
    sectionOthersEyebrow: "Representação da empresa",
  },
  faqBlock: {
    eyebrow: "Perguntas frequentes",
  },
  publicSiteShell: {
    brandFallback: "Henry Onyx",
    colCompany: "Empresa",
    linkHome: "Início",
    linkAbout: "Sobre",
    linkContact: "Contacto",
    linkSearch: "Pesquisar",
    colHenryCo: "Henry Onyx",
    linkHenryCoAccount: "Conta Henry Onyx",
    linkLanguagePrefs: "Idioma e preferências",
    linkEmailPrefs: "Preferências de e-mail",
    colLegal: "Jurídico",
    linkPrivacy: "Privacidade",
    linkTerms: "Termos",
    allRightsReserved: "Todos os direitos reservados.",
    builtBy: "Projetado e desenvolvido internamente pela Henry Onyx Studio para o ecossistema Henry Onyx",
    menuDivisionsDirectory: "Diretório de divisões",
    menuAbout: "Sobre",
    menuContact: "Contacto",
  },
  newsletterUnsubscribe: {
    metaTitle: "Cancelar subscrição — Henry Onyx",
    metaDescription: "Cancelamento de subscrição das newsletters Henry Onyx com um clique.",
    eyebrow: "Newsletter",
    missingTitle: "Ligação de cancelamento em falta.",
    missingBody:
      "Abra a ligação «Cancelar subscrição» de qualquer e-mail Henry Onyx para chegar aqui com um token válido. Se a sua ligação expirou, contacte-nos e iremos processá-lo manualmente.",
    missingCtaContact: "Contactar suporte",
    missingCtaBack: "Voltar às newsletters",
    errorTitle: "Não foi possível cancelar a sua subscrição.",
    errorManualNote:
      "Se isto continuar, responda «cancelar subscrição» a qualquer e-mail Henry Onyx e a nossa equipa irá processá-lo manualmente.",
    successTitle: "Subscrição cancelada.",
    successBody:
      "{{email}} não receberá mais newsletters Henry Onyx. As mensagens transacionais (recibos, envio, verificação, segurança) continuam a ser enviadas porque somos obrigados a isso.",
    changedMind: "Mudou de ideias?",
    ctaSubscribeAgain: "Subscrever novamente",
    ctaManagePrefs: "Gerir todas as preferências",
  },
  v3: {
    story: {
      metaTitle: "O ecossistema — {brand}",
      metaDescription:
        "Uma conta, uma carteira, um mesmo eixo de conversas — em care, marketplace, jobs, learn, logistics, studio e property. Cada afirmação desta página abre o produto ao vivo.",
      eyebrow: "O ecossistema",
      title: "Uma conta. Uma carteira. Sete divisões no ar.",
      lede:
        "A Henry Onyx é uma economia conectada: agende cuidados, compre de vendedores verificados, seja contratado, aprenda uma habilidade, envie uma encomenda, encomende trabalho criativo, encontre um imóvel — com uma identidade, uma carteira e um mesmo eixo de conversas. Nada nesta página é maquete; cada link abre o produto real.",
      primaryCta: "Explorar o ecossistema",
      earnLink: "Como ganhamos — em linguagem simples",
      tryLink: "Experimentar o percurso",
      shippedLink: "O que está no ar",
      divisionsTitle: "As divisões",
      divisionsLede: "Cada uma é um produto completo. Cada linha abre a interface ao vivo — essa é a prova.",
      seeLive: "Ver ao vivo",
      divisionBodies: {
        care: "Cuidados para a casa e para tecidos, agendados com prestadores verificados e preços honestos.",
        marketplace: "Compre de vendedores verificados, com cada pedido rastreado até a sua porta.",
        jobs: "Candidate-se, faça entrevistas e seja contratado — com conversas reais, sem silêncio do outro lado.",
        learn: "Cursos com prévias gratuitas, preços justos e certificados que valem algo.",
        logistics: "Envios com cotação antecipada e rastreamento de ponta a ponta.",
        studio: "Encomende trabalho criativo em um espaço compartilhado com o cliente.",
        property: "Encontre imóveis e faça consultas com anúncios verificados.",
      },
      roadmapNote:
        "Próximo passo do roadmap: a Gaming Arena. Ela aparece aqui quando for real — não antes.",
      spineTitle: "A espinha que elas compartilham",
      spineLede: "As partes que você sente em todo lugar, seja qual for a divisão que usa.",
      spine: [
        {
          title: "Uma identidade",
          body: "Uma conta entra em todas as divisões. Seus itens salvos, mensagens e histórico acompanham você.",
        },
        {
          title: "Dinheiro honesto",
          body: "Um livro-razão de partidas dobradas por trás de cada pagamento, impostos discriminados, recibos que nomeiam a entidade legal. Sem taxas ocultas — a linha da taxa é um recurso, não uma confissão.",
        },
        {
          title: "Um eixo único de conversas",
          body: "Comprador com vendedor, candidato com empregador, cliente com equipe — o mesmo mecanismo de mensagens, com as mesmas regras de segurança em todo lugar.",
        },
        {
          title: "O seu idioma",
          body: "Doze idiomas, um só produto. Preços na sua moeda, não na nossa.",
        },
      ],
      honestyNote:
        "Se algo nesta página um dia não corresponder ao produto, isso é um bug — avise e vamos corrigir a página ou o produto, o que estiver errado.",
    },
    earn: {
      metaTitle: "Como ganhamos — {brand}",
      metaDescription:
        "Todos os mecanismos de receita da Henry Onyx, em linguagem simples: o que cobramos, o que você recebe em troca e os três testes que toda taxa precisa passar.",
      eyebrow: "O mapa da receita",
      title: "Como a Henry Onyx ganha",
      lede:
        "A maioria das plataformas esconde esta página. Achamos que isso já diz muito. Aqui está cada forma pela qual ganhamos dinheiro, o que você recebe em troca e os testes que uma taxa precisa passar antes de existir.",
      testsTitle: "Os três testes",
      tests: [
        {
          title: "Você sabe pelo que está pagando",
          body: "Sem taxas ocultas, sem cobranças surpresa. Se uma taxa se aplica, ela aparece como item nomeado antes de você confirmar.",
        },
        {
          title: "Você recebe mais do que custa",
          body: "Cada cobrança corresponde a algo que você valoriza — e conseguimos nomear isso em uma frase.",
        },
        {
          title: "Publicaríamos a tarifa",
          body: "Se nos incomodaria ver uma tarifa em uma captura de tela nas redes sociais, a tarifa está errada.",
        },
      ],
      rowsTitle: "Divisão por divisão",
      rowsLede:
        "Mecanismos, não letras miúdas. Onde uma divisão ainda está no início, dizemos isso — nenhuma taxa entra em vigor antes de a sua linha aparecer aqui.",
      liveTag: "No ar hoje",
      earlyTag: "Publicada antes de entrar em vigor",
      rows: [
        {
          division: "marketplace",
          mechanism: "Uma comissão sobre pedidos concluídos, e posicionamentos promovidos sempre identificados como promovidos.",
          exchange: "Vendedores verificados, proteção de pagamento, rastreamento de pedidos e um processo real de disputa.",
          live: true,
        },
        {
          division: "care",
          mechanism: "Uma taxa de plataforma sobre agendamentos concluídos, discriminada no checkout.",
          exchange: "Prestadores avaliados, preços honestos, reagendamento em um toque e suporte que responde.",
          live: true,
        },
        {
          division: "learn",
          mechanism: "Uma divisão de receita com instrutores nos cursos pagos.",
          exchange: "Prévias gratuitas antes de pagar, preços justos e certificados compartilháveis.",
          live: true,
        },
        {
          division: "studio",
          mechanism: "Uma taxa de projeto sobre trabalho criativo encomendado.",
          exchange: "Um espaço de trabalho compartilhado, clareza de etapas e pagamento retido até a entrega.",
          live: true,
        },
        {
          division: "jobs",
          mechanism: "Ferramentas e anúncios do lado do empregador. Candidatos nunca pagam para se candidatar.",
          exchange: "Conversas reais com empregadores, status da candidatura visível e agendamento de entrevistas.",
          live: true,
        },
        {
          division: "logistics",
          mechanism: "Uma margem em cada envio, cotada antecipadamente — o preço que você vê é o preço.",
          exchange: "Cotações antecipadas, transparência sobre as transportadoras e rastreamento de ponta a ponta.",
          live: true,
        },
        {
          division: "property",
          mechanism: "Ferramentas de anúncio e gestão para proprietários e administradores.",
          exchange: "Anúncios verificados e um histórico documentado de consultas.",
          live: false,
        },
      ],
      feeTitle: "A taxa de plataforma, nomeada",
      feeBody:
        "Onde uma taxa de plataforma se aplica, ela aparece como uma linha própria no checkout — nunca escondida no total. Ela financia o que torna o ecossistema confiável: verificação, resolução de disputas e suporte 24 horas. A mesma explicação aparece na dica da taxa em todos os checkouts, porque você não deveria precisar desta página para encontrá-la.",
      closingTitle: "Viu algo que não passa nos testes?",
      closingBody:
        "Se qualquer taxa da Henry Onyx falhar em qualquer um dos três testes, ela foi mal desenhada — avise e vamos corrigir. Esta página muda antes dos preços, não depois.",
    },
  },
};
const HUB_PUBLIC_COPY_AR: DeepPartial<HubPublicCopy> = {
  footer: {
    description:
      "بوّابة مؤسسية متعددة الأقسام بمستوى راقٍ، صُمّمت لتقديم منظومة Henry Onyx بوضوح وثقة وانضباط راسخ في هوية العلامة على المدى الطويل.",
    columnCompany: "الشركة",
    columnLegal: "الجوانب القانونية",
    home: "الرئيسية",
    about: "من نحن",
    contact: "اتصل بنا",
    privacyPolicy: "سياسة الخصوصية",
    termsConditions: "الشروط والأحكام",
    allRightsReserved: "جميع الحقوق محفوظة.",
    builtBy: "صُمِّمت وطُوِّرت داخليًا في Henry Onyx Studio لخدمة منظومة Henry Onyx",
  },
  contactHero: {
    eyebrow: "تواصل مع Henry Onyx",
    title:
      "تواصل على مستوى المجموعة — الشراكات، الإعلام، الموردون، المستثمرون، وكل ما يخص الشركة الأم.",
    body:
      "بالنسبة لأي موضوع يخص قسمًا بعينه، ستحصل على إجابة أسرع عبر صفحة التواصل الخاصة بذلك القسم. استخدم هذا النموذج للاستفسارات على مستوى الشركة.",
    bulletPartnerships:
      "الشراكات، المشاريع المشتركة، والتعارف لأغراض التوزيع.",
    bulletPress: "الصحافة والإعلام، وهوية العلامة، والاستفسارات التحريرية.",
    bulletSupplier:
      "التعريف بالموردين، والمحادثات مع المستثمرين أو المستشارين، وأي ملاحظات نحرص على سماعها مباشرة.",
    ctaDivisions: "استكشف الأقسام",
    ctaAbout: "نبذة عن الشركة",
  },
  companyPage: {
    recentlyUpdated: "تم التحديث مؤخرًا",
    metaUpdated: "تم التحديث",
    metaSection: "القسم",
    metaStandard: "المعيار",
    metaCorporateGrade: "بمستوى مؤسسي",
    serverWarning: "قد يكون بعض المحتوى لا يزال قيد التحديث.",
    pageSectionsAria: "أقسام الصفحة",
    footerEyebrow: "Henry Onyx",
    footerTitle:
      "نفس معيار التشغيل الذي يثق به عملاؤنا وشركاؤنا وفِرَقنا.",
    footerBody:
      "كل واجهة مؤسسية لـ Henry Onyx — نبذة، تواصل، حوكمة، سياسات — تُنشر وفق معيار تحريري واحد، فيكون ما تقرأه علنًا مطابقًا لما نلتزم به بيننا.",
    footerUseCase: "حالة الاستخدام",
    footerUseCaseValue: "العملاء · الشركاء · الإعلام",
    footerStandard: "المعيار",
    footerStandardValue: "منظَّم · موثَّق",
  },
  aboutHonest: {
    eyebrow: "نبذة عن هذه الشركة",
    title: "شركة واحدة، عدة أنشطة مركّزة، ومعيار تشغيل موحَّد.",
    body:
      "Henry Onyx مجموعة تشغيلية متعددة الأقسام. كل قسم يدير سوقه الخاص — Care وMarketplace وProperty وLogistics وStudio وJobs وLearn — على المعيار ذاته من حيث العرض والحجز والتسعير والمتابعة. وُجد هذا المركز ليرى العملاء والشركاء وأصحاب المصلحة الشركة كلها في مكان واحد، ويصلوا إلى النشاط المناسب في خطوة واحدة. ننمو بإضافة أقسام جديدة داخل هذا الإطار، لا بمدّ علامة واحدة فوق طاقتها.",
    figureDivisionsLive: "الأقسام النشطة",
    figureYearEstablished: "سنة التأسيس",
    figureOperatingCity: "مدينة التشغيل",
    founderEyebrow: "كلمة المؤسس",
    founderPhotoPlaceholder: "صورة",
    founderPlaceholderTitle: "كلمة المؤسس — المحتوى يُدار عبر نظام إدارة المحتوى",
    founderPlaceholderBody:
      "ستظهر هنا كلمة موجزة موقَّعة من المؤسس. القالب جاهز — يتدفق النص والصورة والتوقيع تلقائيًا من نظام إدارة المحتوى الخاص بالشركة بمجرد النشر.",
    linkReachCompany: "تواصل مع الشركة",
    linkBrowseDivisions: "تصفح الأقسام",
  },
  leadership: {
    roleFallback: "ملف قيادي",
    toneOwner: "ملكية",
    toneManagement: "إدارة",
    toneFeatured: "مميَّز",
    toneLeadership: "قيادة",
    actionContact: "تواصل",
    actionCall: "اتصال",
    actionLinkedin: "LinkedIn",
    actionFullProfile: "الملف الكامل",
    modalCloseAria: "إغلاق الملف",
    modalEyebrow: "ملف قيادي",
    modalBioFallback:
      "هذا الملف جزء من مجلس القيادة العام لـ Henry Onyx",
    emptyTitle: "ستظهر هنا معلومات القيادة",
    emptyBody:
      "انشر ملفات القيادة من لوحة المالك لتقديم الملكية والإدارة وممثلي الشركة الموثوقين في صورة عامة متقَنة.",
    sharedSectionDescription:
      "تُجسّد ملفات هذا القسم الأشخاصَ والمسؤوليةَ التشغيليةَ والإشرافَ القائم خلف مجموعة Henry Onyx",
    headerEyebrow: "مجلس القيادة",
    headerTitle: "القيادة والإشراف",
    headerBody:
      "تعرَّف على من يُشكِّلون Henry Onyx في الملكية والقيادة العامة والتوجيه التشغيلي والمسؤولية على المدى الطويل.",
    metricProfiles: "الملفات",
    metricOwnership: "الملكية",
    metricManagement: "الإدارة",
    spotlightEyebrow: "ملف الضوء",
    spotlightBioFallback:
      "يعكس هذا الملف القيادي الأشخاصَ المسؤولين عن التوجه والحوكمة وجودة التنفيذ في مجموعة Henry Onyx",
    sectionOwnershipTitle: "الملكية",
    sectionOwnershipEyebrow: "قيادة الشركة",
    sectionManagementTitle: "الإدارة",
    sectionManagementEyebrow: "القيادة التشغيلية",
    sectionFeaturedTitle: "الفريق المميَّز",
    sectionFeaturedEyebrow: "ممثلون رئيسيون",
    sectionOthersTitle: "ملفات إضافية",
    sectionOthersEyebrow: "تمثيل الشركة",
  },
  faqBlock: {
    eyebrow: "الأسئلة الشائعة",
  },
  publicSiteShell: {
    brandFallback: "Henry Onyx",
    colCompany: "الشركة",
    linkHome: "الرئيسية",
    linkAbout: "من نحن",
    linkContact: "اتصل بنا",
    linkSearch: "بحث",
    colHenryCo: "هنري كو",
    linkHenryCoAccount: "حساب Henry Onyx",
    linkLanguagePrefs: "اللغة والتفضيلات",
    linkEmailPrefs: "تفضيلات البريد الإلكتروني",
    colLegal: "القانوني",
    linkPrivacy: "الخصوصية",
    linkTerms: "الشروط",
    allRightsReserved: "جميع الحقوق محفوظة.",
    builtBy: "صُمِّم وطُوِّر داخلياً بواسطة Henry Onyx Studio لمنظومة Henry Onyx",
    menuDivisionsDirectory: "دليل الأقسام",
    menuAbout: "من نحن",
    menuContact: "اتصل بنا",
  },
  newsletterUnsubscribe: {
    metaTitle: "إلغاء الاشتراك — Henry Onyx",
    metaDescription: "إلغاء اشتراك بنقرة واحدة من نشرات Henry Onyx الإخبارية.",
    eyebrow: "النشرة البريدية",
    missingTitle: "رابط إلغاء الاشتراك مفقود.",
    missingBody:
      "افتح رابط «إلغاء الاشتراك» من أي بريد إلكتروني من Henry Onyx للوصول هنا برمز تحقق صالح. إذا انتهت صلاحية رابطك، تواصل معنا وسنتعامل مع الطلب يدوياً.",
    missingCtaContact: "التواصل مع الدعم",
    missingCtaBack: "العودة إلى النشرات",
    errorTitle: "لم نتمكن من إلغاء اشتراكك.",
    errorManualNote:
      "إذا استمر هذا، أرسل رداً بكلمة «إلغاء الاشتراك» على أي بريد من Henry Onyx وسيتولى فريقنا الأمر يدوياً.",
    successTitle: "تم إلغاء اشتراكك.",
    successBody:
      "لن يتلقى {{email}} نشرات Henry Onyx الإخبارية. تستمر الرسائل التعاملية (الإيصالات، الشحن، التحقق، الأمان) في الإرسال لأننا ملزمون بذلك.",
    changedMind: "هل غيّرت رأيك؟",
    ctaSubscribeAgain: "الاشتراك مجدداً",
    ctaManagePrefs: "إدارة كل التفضيلات",
  },
  v3: {
    story: {
      metaTitle: "المنظومة — {brand}",
      metaDescription:
        "حساب واحد، ومحفظة واحدة، وعمود محادثات واحد — عبر العناية والسوق والوظائف والتعلّم والخدمات اللوجستية والاستوديو والعقارات. كل ادعاء في هذه الصفحة يفتح المنتج الحي.",
      eyebrow: "المنظومة",
      title: "حساب واحد. محفظة واحدة. سبعة أقسام تعمل فعليًا.",
      lede:
        "Henry Onyx اقتصاد واحد مترابط: احجز خدمات العناية، وتسوّق من بائعين موثّقين، واحصل على وظيفة، وتعلّم مهارة، وأرسل طردًا، وكلّف بعمل إبداعي، واعثر على منزل — بهوية واحدة، ومحفظة واحدة، وعمود محادثات واحد. لا شيء في هذه الصفحة نموذج تجريبي؛ كل رابط يفتح المنتج الحقيقي.",
      primaryCta: "تصفّح المنظومة",
      earnLink: "كيف نكسب — بلغة واضحة",
      tryLink: "جرّب الرحلة",
      shippedLink: "ما هو متاح الآن",
      divisionsTitle: "الأقسام",
      divisionsLede: "كل قسم منتج متكامل. كل صف يفتح الواجهة الحية — وهذا هو الدليل.",
      seeLive: "شاهده مباشرة",
      divisionBodies: {
        care: "عناية بالمنزل والأقمشة، تُحجز مع مزوّدين موثّقين وبأسعار صادقة.",
        marketplace: "تسوّق من بائعين موثّقين، مع تتبّع كل طلب حتى باب منزلك.",
        jobs: "قدّم، وأجرِ المقابلات، واحصل على الوظيفة — بمحادثات حقيقية، لا صمت بلا ردّ.",
        learn: "دورات بمعاينات مجانية، وأسعار عادلة، وشهادات ذات قيمة حقيقية.",
        logistics: "شحنات بأسعار معلنة مسبقًا وتتبّع من البداية إلى النهاية.",
        studio: "كلّف بأعمال إبداعية ضمن مساحة عمل مشتركة مع العميل.",
        property: "اعثر على العقارات واستفسر عنها عبر قوائم موثّقة.",
      },
      roadmapNote:
        "التالي في خارطة الطريق: ساحة الألعاب. ستظهر هنا حين تصبح حقيقية — لا قبل ذلك.",
      spineTitle: "العمود المشترك بينها",
      spineLede: "الأجزاء التي تلمسها في كل مكان، أيًّا كان القسم الذي تستخدمه.",
      spine: [
        {
          title: "هوية واحدة",
          body: "حساب واحد يسجّل الدخول إلى كل الأقسام. عناصرك المحفوظة ورسائلك وسجلّك ترافقك أينما ذهبت.",
        },
        {
          title: "مال صادق",
          body: "دفتر قيد مزدوج خلف كل عملية دفع، وضرائب مفصّلة بندًا بندًا، وإيصالات تذكر اسم الكيان القانوني. لا رسوم خفية — سطر الرسوم ميزة، لا اعتراف.",
        },
        {
          title: "عمود محادثات واحد",
          body: "من المشتري إلى البائع، ومن المرشّح إلى صاحب العمل، ومن العميل إلى الفريق — محرّك المراسلة نفسه بقواعد الأمان نفسها في كل مكان.",
        },
        {
          title: "لغتك أنت",
          body: "اثنتا عشرة لغة، ومنتج واحد. الأسعار بعملتك أنت، لا بعملتنا.",
        },
      ],
      honestyNote:
        "إذا وجدت في هذه الصفحة شيئًا لا يطابق المنتج، فذلك خلل — أخبرنا وسنصلح الصفحة أو المنتج، أيّهما كان على خطأ.",
    },
    earn: {
      metaTitle: "كيف نكسب — {brand}",
      metaDescription:
        "كل آلية إيرادات لدى Henry Onyx، بلغة واضحة: ما الذي نتقاضاه، وما الذي تحصل عليه في المقابل، والاختبارات الثلاثة التي يجب أن يجتازها كل رسم.",
      eyebrow: "خريطة الكسب",
      title: "كيف يكسب Henry Onyx",
      lede:
        "معظم المنصات تخفي هذه الصفحة. ونرى أن ذلك وحده مؤشّر. إليك كل طريقة نكسب بها المال، وما تحصل عليه في المقابل، والاختبارات التي يجب أن يجتازها أي رسم قبل أن يوجد أصلًا.",
      testsTitle: "الاختبارات الثلاثة",
      tests: [
        {
          title: "تعرف ما الذي تدفع مقابله",
          body: "لا رسوم خفية ولا مبالغ مفاجئة. إذا انطبق رسم ما، فهو بند مسمّى بوضوح قبل أن تلتزم.",
        },
        {
          title: "تحصل على أكثر مما تدفع",
          body: "كل مبلغ نتقاضاه يقابل شيئًا له قيمة عندك — ويمكننا تسميته في جملة واحدة.",
        },
        {
          title: "نرضى بنشر السعر",
          body: "إذا كنا سنشعر بالحرج من رؤية سعرٍ ما في لقطة شاشة على وسائل التواصل، فذلك السعر خاطئ.",
        },
      ],
      rowsTitle: "قسمًا بعد قسم",
      rowsLede:
        "آليات، لا بنود بخط صغير. وحيث لا يزال قسم ما في مراحله الأولى، نقول ذلك صراحة — لا يُفعَّل أي رسم قبل أن يظهر صفّه هنا.",
      liveTag: "يعمل اليوم",
      earlyTag: "يُنشر قبل تفعيله",
      rows: [
        {
          division: "marketplace",
          mechanism: "عمولة على الطلبات المكتملة، ومواضع ترويجية تحمل دائمًا وسم الترويج.",
          exchange: "بائعون موثّقون، وحماية للمدفوعات، وتتبّع للطلبات، وعملية نزاعات حقيقية.",
          live: true,
        },
        {
          division: "care",
          mechanism: "رسم منصة على الحجوزات المكتملة، مفصّل عند الدفع.",
          exchange: "مزوّدون خضعوا للتدقيق، وأسعار صادقة، وإعادة حجز بلمسة واحدة، ودعم يجيب فعلًا.",
          live: true,
        },
        {
          division: "learn",
          mechanism: "حصة من الإيرادات مع المدرّبين على الدورات المدفوعة.",
          exchange: "معاينات مجانية قبل أن تدفع، وأسعار عادلة، وشهادات قابلة للمشاركة.",
          live: true,
        },
        {
          division: "studio",
          mechanism: "رسم مشروع على الأعمال الإبداعية المكلَّف بها.",
          exchange: "مساحة عمل مشتركة، ووضوح في مراحل الإنجاز، ودفعة تُحتجز حتى التسليم.",
          live: true,
        },
        {
          division: "jobs",
          mechanism: "أدوات وإعلانات لأصحاب العمل. المرشّحون لا يدفعون أبدًا مقابل التقديم.",
          exchange: "محادثات حقيقية مع أصحاب العمل، وحالة طلب يمكنك متابعتها، وجدولة للمقابلات.",
          live: true,
        },
        {
          division: "logistics",
          mechanism: "هامش على كل شحنة، معلن مسبقًا — السعر الذي تراه هو السعر الذي تدفعه.",
          exchange: "عروض أسعار مسبقة، وشفافية في شركات النقل، وتتبّع من البداية إلى النهاية.",
          live: true,
        },
        {
          division: "property",
          mechanism: "أدوات إدراج وإدارة للمالكين والمديرين.",
          exchange: "قوائم موثّقة وسجل استفسارات موثّق.",
          live: false,
        },
      ],
      feeTitle: "رسم المنصة، بالاسم",
      feeBody:
        "حيث ينطبق رسم المنصة، يظهر بندًا مستقلًا عند الدفع — ولا يُدفن أبدًا في الإجمالي. وهو يموّل ما يجعل المنظومة جديرة بالثقة: التوثيق، وحلّ النزاعات، ودعمًا متاحًا على مدار الساعة طوال الأسبوع. والشرح نفسه يظهر في تلميح الرسوم عند كل عملية دفع، لأنه لا ينبغي أن تحتاج إلى هذه الصفحة لتجده.",
      closingTitle: "هل رأيت ما يخفق في الاختبارات؟",
      closingBody:
        "إذا أخفق أي رسم لدى Henry Onyx في أيّ من الاختبارات الثلاثة، فتصميمه خاطئ — أخبرنا وسنصلحه. هذه الصفحة تتغيّر قبل الأسعار، لا بعدها.",
    },
  },
};
const HUB_PUBLIC_COPY_DE: DeepPartial<HubPublicCopy> = {
  footer: {
    description:
      "Ein hochwertiges Konzern-Portal über mehrere Divisionen hinweg, das das Henry-&-Co.-Ökosystem mit Klarheit, Vertrauen und langfristiger Markendisziplin präsentiert.",
    columnCompany: "Unternehmen",
    columnLegal: "Rechtliches",
    home: "Startseite",
    about: "Über uns",
    contact: "Kontakt",
    privacyPolicy: "Datenschutzerklärung",
    termsConditions: "Allgemeine Geschäftsbedingungen",
    allRightsReserved: "Alle Rechte vorbehalten.",
    builtBy: "Konzipiert und intern entwickelt vom Henry Onyx Studio für das Henry Onyx-Ökosystem",
  },
  contactHero: {
    eyebrow: "Henry Onyx kontaktieren",
    title:
      "Gespräche auf Konzernebene — Partnerschaften, Medien, Lieferanten, Investoren und alles, was zur Muttergesellschaft gehört.",
    body:
      "Für Anliegen, die eine bestimmte Division betreffen, erhalten Sie eine schnellere Antwort über die jeweilige Division. Nutzen Sie dieses Formular für Anfragen auf Unternehmensebene.",
    bulletPartnerships:
      "Partnerschaften, Joint Ventures, Vorstellungen für den Vertrieb.",
    bulletPress: "Presse-, Medien-, Marken- und Redaktionsanfragen.",
    bulletSupplier:
      "Lieferantenkontakte, Gespräche mit Investoren oder Beratern sowie Anliegen, die wir direkt hören sollten.",
    ctaDivisions: "Divisionen entdecken",
    ctaAbout: "Über das Unternehmen",
  },
  companyPage: {
    recentlyUpdated: "Kürzlich aktualisiert",
    metaUpdated: "Aktualisiert",
    metaSection: "Abschnitt",
    metaStandard: "Standard",
    metaCorporateGrade: "Auf Konzernniveau",
    serverWarning: "Einige Inhalte werden möglicherweise noch aktualisiert.",
    pageSectionsAria: "Seitenabschnitte",
    footerEyebrow: "Henry Onyx",
    footerTitle:
      "Derselbe operative Standard, dem unsere Kunden, Partner und Teams vertrauen.",
    footerBody:
      "Jede Konzernfläche von Henry Onyx — Über uns, Kontakt, Governance, Richtlinien — folgt einem einheitlichen redaktionellen Standard, sodass das, was Sie öffentlich lesen, dem entspricht, woran wir uns intern halten.",
    footerUseCase: "Anwendungsfall",
    footerUseCaseValue: "Kunden · Partner · Medien",
    footerStandard: "Standard",
    footerStandardValue: "Strukturiert · Verifiziert",
  },
  aboutHonest: {
    eyebrow: "Über dieses Unternehmen",
    title: "Ein Unternehmen, mehrere fokussierte Geschäftsbereiche, ein einheitlicher operativer Standard.",
    body:
      "Henry Onyx ist eine operative Gruppe mit mehreren Divisionen. Jede Division betreibt ihren eigenen Markt — Care, Marketplace, Property, Logistics, Studio, Jobs, Learn — auf demselben Niveau in Präsentation, Buchung, Preisgestaltung und Nachverfolgung. Das Hub existiert, damit Kunden, Partner und Stakeholder das gesamte Unternehmen an einem Ort sehen und das richtige Geschäft in einem Schritt erreichen. Wir wachsen, indem wir Divisionen innerhalb dieses Rahmens hinzufügen — nicht, indem wir eine einzelne Marke überdehnen.",
    figureDivisionsLive: "Aktive Divisionen",
    figureYearEstablished: "Gründungsjahr",
    figureOperatingCity: "Geschäftssitz",
    founderEyebrow: "Gründernotiz",
    founderPhotoPlaceholder: "Foto",
    founderPlaceholderTitle: "Gründernotiz — Inhalt über CMS verwaltet",
    founderPlaceholderBody:
      "Hier erscheint eine kurze, unterschriebene Notiz des Gründers. Die Struktur ist bereit — Text, Foto und Unterschrift werden nach der Veröffentlichung aus dem CMS des Unternehmens übernommen.",
    linkReachCompany: "Unternehmen kontaktieren",
    linkBrowseDivisions: "Divisionen durchsuchen",
  },
  leadership: {
    roleFallback: "Führungsprofil",
    toneOwner: "Eigentümer",
    toneManagement: "Geschäftsleitung",
    toneFeatured: "Hervorgehoben",
    toneLeadership: "Führung",
    actionContact: "Kontaktieren",
    actionCall: "Anrufen",
    actionLinkedin: "LinkedIn",
    actionFullProfile: "Vollständiges Profil",
    modalCloseAria: "Profil schließen",
    modalEyebrow: "Führungsprofil",
    modalBioFallback:
      "Dieses Profil gehört zum öffentlichen Führungsgremium von Henry Onyx",
    emptyTitle: "Hier erscheinen Informationen zur Führung",
    emptyBody:
      "Veröffentlichen Sie Führungsprofile über das Eigentümer-Dashboard, um Eigentum, Geschäftsleitung und vertrauenswürdige Unternehmensvertreter in einem klaren öffentlichen Format darzustellen.",
    sharedSectionDescription:
      "Die Profile in diesem Bereich verkörpern die Menschen, die Verantwortung und die operative Sorgfalt hinter der Henry-&-Co.-Gruppe.",
    headerEyebrow: "Führungsgremium",
    headerTitle: "Führung und Verantwortung",
    headerBody:
      "Lernen Sie die Menschen kennen, die Henry Onyx prägen — von Eigentum über öffentliche Führung und operative Ausrichtung bis hin zur langfristigen Verantwortung.",
    metricProfiles: "Profile",
    metricOwnership: "Eigentum",
    metricManagement: "Geschäftsleitung",
    spotlightEyebrow: "Profil im Fokus",
    spotlightBioFallback:
      "Dieses Führungsprofil steht für die Personen, die in der Henry-&-Co.-Gruppe für Ausrichtung, Governance und hochwertige Umsetzung verantwortlich sind.",
    sectionOwnershipTitle: "Eigentum",
    sectionOwnershipEyebrow: "Unternehmensführung",
    sectionManagementTitle: "Geschäftsleitung",
    sectionManagementEyebrow: "Operative Führung",
    sectionFeaturedTitle: "Hervorgehobenes Team",
    sectionFeaturedEyebrow: "Wichtige Vertreterinnen und Vertreter",
    sectionOthersTitle: "Weitere Profile",
    sectionOthersEyebrow: "Unternehmensvertretung",
  },
  faqBlock: {
    eyebrow: "Häufig gestellte Fragen",
  },
  publicSiteShell: {
    brandFallback: "Henry Onyx",
    colCompany: "Unternehmen",
    linkHome: "Startseite",
    linkAbout: "Über uns",
    linkContact: "Kontakt",
    linkSearch: "Suche",
    colHenryCo: "Henry Onyx",
    linkHenryCoAccount: "Henry Onyx-Konto",
    linkLanguagePrefs: "Sprache & Einstellungen",
    linkEmailPrefs: "E-Mail-Einstellungen",
    colLegal: "Rechtliches",
    linkPrivacy: "Datenschutz",
    linkTerms: "Nutzungsbedingungen",
    allRightsReserved: "Alle Rechte vorbehalten.",
    builtBy: "Intern entworfen und entwickelt von Henry Onyx Studio für das Henry Onyx-Ökosystem",
    menuDivisionsDirectory: "Abteilungsverzeichnis",
    menuAbout: "Über uns",
    menuContact: "Kontakt",
  },
  newsletterUnsubscribe: {
    metaTitle: "Abmelden — Henry Onyx",
    metaDescription: "Mit einem Klick von Henry Onyx-Newslettern abmelden.",
    eyebrow: "Newsletter",
    missingTitle: "Abmeldelink fehlt.",
    missingBody:
      "Öffnen Sie den Link „Abmelden“ aus einer Henry Onyx-E-Mail, um mit einem gültigen Token hierher zu gelangen. Falls Ihr Link abgelaufen ist, kontaktieren Sie uns und wir bearbeiten die Abmeldung manuell.",
    missingCtaContact: "Support kontaktieren",
    missingCtaBack: "Zurück zu den Newslettern",
    errorTitle: "Wir konnten Sie nicht abmelden.",
    errorManualNote:
      "Wenn das Problem weiterhin besteht, antworten Sie auf eine Henry Onyx-E-Mail mit „abmelden“ und unser Team bearbeitet dies manuell.",
    successTitle: "Sie sind abgemeldet.",
    successBody:
      "{{email}} erhält keine Henry Onyx-Newsletter mehr. Transaktionsnachrichten (Quittungen, Versand, Verifizierung, Sicherheit) werden weiterhin gesendet, weil wir dazu verpflichtet sind.",
    changedMind: "Haben Sie Ihre Meinung geändert?",
    ctaSubscribeAgain: "Erneut abonnieren",
    ctaManagePrefs: "Alle Einstellungen verwalten",
  },
  v3: {
    story: {
      metaTitle: "Das Ökosystem — {brand}",
      metaDescription:
        "Ein Konto, ein Wallet, ein gemeinsamer Gesprächsfaden — über Care, Marketplace, Jobs, Learn, Logistics, Studio und Property hinweg. Jede Aussage auf dieser Seite öffnet das echte Produkt.",
      eyebrow: "Das Ökosystem",
      title: "Ein Konto. Ein Wallet. Sieben Divisionen im Live-Betrieb.",
      lede:
        "Henry Onyx ist eine zusammenhängende Ökonomie: Pflege buchen, bei geprüften Verkäufern einkaufen, eingestellt werden, eine Fähigkeit erlernen, ein Paket versenden, Kreativarbeit beauftragen, ein Zuhause finden — mit einer Identität, einem Wallet, einem gemeinsamen Gesprächsfaden. Nichts auf dieser Seite ist ein Mockup; jeder Link öffnet das echte Produkt.",
      primaryCta: "Das Ökosystem entdecken",
      earnLink: "Wie wir verdienen — in klaren Worten",
      tryLink: "Den Rundgang ausprobieren",
      shippedLink: "Was heute live ist",
      divisionsTitle: "Die Divisionen",
      divisionsLede: "Jede ist ein vollwertiges Produkt. Jede Zeile öffnet die Live-Oberfläche — das ist der Beweis.",
      seeLive: "Live ansehen",
      divisionBodies: {
        care: "Haushalts- und Textilpflege, gebucht bei geprüften Anbietern zu ehrlichen Preisen.",
        marketplace: "Einkaufen bei geprüften Verkäufern — jede Bestellung wird bis zu Ihrer Tür verfolgt.",
        jobs: "Bewerben, Gespräche führen, eingestellt werden — mit echten Antworten statt Funkstille.",
        learn: "Kurse mit kostenlosen Vorschauen, fairen Preisen und Zertifikaten, die etwas bedeuten.",
        logistics: "Sendungen mit Preisangabe im Voraus und lückenloser Verfolgung.",
        studio: "Kreativarbeit beauftragen — mit einem gemeinsamen Arbeitsbereich für Kunden.",
        property: "Immobilien finden und anfragen, mit geprüften Inseraten.",
      },
      roadmapNote:
        "Als Nächstes auf der Roadmap: die Gaming Arena. Sie erscheint hier, sobald sie real ist — nicht vorher.",
      spineTitle: "Das gemeinsame Rückgrat",
      spineLede: "Die Teile, die Sie überall spüren — ganz gleich, welche Division Sie nutzen.",
      spine: [
        {
          title: "Eine Identität",
          body: "Ein Konto meldet Sie in jeder Division an. Ihre gespeicherten Artikel, Nachrichten und Ihr Verlauf begleiten Sie.",
        },
        {
          title: "Ehrliches Geld",
          body: "Hinter jeder Zahlung steht eine doppelte Buchführung, Steuern werden einzeln ausgewiesen, Belege nennen die juristische Person. Keine versteckten Gebühren — die Gebührenzeile ist ein Merkmal, kein Geständnis.",
        },
        {
          title: "Ein gemeinsamer Gesprächsfaden",
          body: "Käufer zu Verkäufer, Bewerber zu Arbeitgeber, Kunde zu Team — überall dieselbe Messaging-Engine mit denselben Schutzregeln.",
        },
        {
          title: "Ihre Sprache",
          body: "Zwölf Sprachversionen, ein Produkt. Preise in Ihrer Währung, nicht in unserer.",
        },
      ],
      honestyNote:
        "Sollte etwas auf dieser Seite jemals nicht mit dem Produkt übereinstimmen, ist das ein Fehler — sagen Sie es uns, und wir korrigieren die Seite oder das Produkt, je nachdem, was falsch ist.",
    },
    earn: {
      metaTitle: "Wie wir verdienen — {brand}",
      metaDescription:
        "Jeder Umsatzmechanismus bei Henry Onyx, in klaren Worten: was wir berechnen, was Sie dafür bekommen und die drei Prüfungen, die jede Gebühr bestehen muss.",
      eyebrow: "Die Verdienstkarte",
      title: "Wie Henry Onyx verdient",
      lede:
        "Die meisten Plattformen verstecken diese Seite. Wir halten genau das für das verräterische Zeichen. Hier steht jede Art, wie wir Geld verdienen, was Sie dafür bekommen und welche Prüfungen eine Gebühr bestehen muss, bevor es sie gibt.",
      testsTitle: "Die drei Prüfungen",
      tests: [
        {
          title: "Sie wissen, wofür Sie zahlen",
          body: "Keine versteckten Gebühren, keine Überraschungen. Wenn eine Gebühr anfällt, steht sie als benannter Posten da, bevor Sie sich festlegen.",
        },
        {
          title: "Sie bekommen mehr, als es kostet",
          body: "Jede Berechnung entspricht etwas, das für Sie von Wert ist — und wir können es in einem Satz benennen.",
        },
        {
          title: "Wir würden den Satz veröffentlichen",
          body: "Wenn uns ein Gebührensatz auf einem Screenshot in den sozialen Medien unangenehm wäre, ist der Satz falsch.",
        },
      ],
      rowsTitle: "Division für Division",
      rowsLede:
        "Mechanismen, kein Kleingedrucktes. Wo eine Division noch am Anfang steht, sagen wir das — keine Gebühr wird aktiv, bevor ihre Zeile hier erscheint.",
      liveTag: "Heute aktiv",
      earlyTag: "Veröffentlicht, bevor sie aktiv wird",
      rows: [
        {
          division: "marketplace",
          mechanism: "Eine Provision auf abgeschlossene Bestellungen sowie beworbene Platzierungen, die stets als Anzeige gekennzeichnet sind.",
          exchange: "Geprüfte Verkäufer, Zahlungsschutz, Sendungsverfolgung und ein echtes Streitbeilegungsverfahren.",
          live: true,
        },
        {
          division: "care",
          mechanism: "Eine Plattformgebühr auf abgeschlossene Buchungen, einzeln ausgewiesen an der Kasse.",
          exchange: "Geprüfte Anbieter, ehrliche Preise, erneutes Buchen mit einem Tippen und ein Support, der antwortet.",
          live: true,
        },
        {
          division: "learn",
          mechanism: "Eine Umsatzbeteiligung mit Kursleitern bei bezahlten Kursen.",
          exchange: "Kostenlose Vorschauen vor dem Kauf, faire Preise und teilbare Zertifikate.",
          live: true,
        },
        {
          division: "studio",
          mechanism: "Eine Projektgebühr auf beauftragte Kreativarbeit.",
          exchange: "Ein gemeinsamer Arbeitsbereich, klare Meilensteine und Zahlung, die bis zur Lieferung verwahrt wird.",
          live: true,
        },
        {
          division: "jobs",
          mechanism: "Werkzeuge und Stellenanzeigen auf Arbeitgeberseite. Bewerber zahlen nie für eine Bewerbung.",
          exchange: "Echte Gespräche mit Arbeitgebern, ein einsehbarer Bewerbungsstatus und Terminplanung für Gespräche.",
          live: true,
        },
        {
          division: "logistics",
          mechanism: "Eine Marge auf jede Sendung, im Voraus angegeben — der Preis, den Sie sehen, ist der Preis.",
          exchange: "Preisangaben im Voraus, Transparenz über den Zusteller und lückenlose Verfolgung.",
          live: true,
        },
        {
          division: "property",
          mechanism: "Inserats- und Verwaltungswerkzeuge für Eigentümer und Verwalter.",
          exchange: "Geprüfte Inserate und ein dokumentierter Anfrageverlauf.",
          live: false,
        },
      ],
      feeTitle: "Die Plattformgebühr, beim Namen genannt",
      feeBody:
        "Wo eine Plattformgebühr anfällt, erscheint sie an der Kasse als eigene Zeile — nie in der Gesamtsumme verborgen. Sie finanziert das, was das Ökosystem vertrauenswürdig macht: Verifizierung, Streitbeilegung und Support rund um die Uhr. Dieselbe Erklärung steht im Gebühren-Tooltip an jeder Kasse, denn Sie sollten diese Seite nicht brauchen, um sie zu finden.",
      closingTitle: "Etwas gesehen, das die Prüfungen nicht besteht?",
      closingBody:
        "Wenn eine Gebühr bei Henry Onyx auch nur eine der drei Prüfungen nicht besteht, ist sie falsch gestaltet — sagen Sie es uns, und wir korrigieren sie. Diese Seite ändert sich, bevor sich Preise ändern, nicht danach.",
    },
  },
};
const HUB_PUBLIC_COPY_IT: DeepPartial<HubPublicCopy> = {
  footer: {
    description:
      "Un portale corporate multi-divisione di livello premium, concepito per presentare l’ecosistema Henry Onyx con chiarezza, fiducia e una disciplina di marca a lungo termine.",
    columnCompany: "Azienda",
    columnLegal: "Note legali",
    home: "Home",
    about: "Chi siamo",
    contact: "Contatti",
    privacyPolicy: "Informativa sulla privacy",
    termsConditions: "Termini e condizioni",
    allRightsReserved: "Tutti i diritti riservati.",
    builtBy: "Progettato e realizzato internamente da Henry Onyx Studio per l’ecosistema Henry Onyx",
  },
  contactHero: {
    eyebrow: "Contattare Henry Onyx",
    title:
      "Conversazioni a livello di gruppo — partnership, media, fornitori, investitori e tutto ciò che riguarda la casa madre.",
    body:
      "Per qualsiasi richiesta specifica di una divisione, riceverai una risposta più rapida dalla pagina contatti di quella divisione. Usa questo modulo per le richieste a livello aziendale.",
    bulletPartnerships:
      "Partnership, joint venture e contatti per la distribuzione.",
    bulletPress: "Stampa, media, marchio e richieste editoriali.",
    bulletSupplier:
      "Presentazioni di fornitori, conversazioni con investitori o advisor e segnalazioni che vogliamo ricevere direttamente.",
    ctaDivisions: "Esplora le divisioni",
    ctaAbout: "Sull’azienda",
  },
  companyPage: {
    recentlyUpdated: "Aggiornato di recente",
    metaUpdated: "Aggiornato",
    metaSection: "Sezione",
    metaStandard: "Standard",
    metaCorporateGrade: "Livello corporate",
    serverWarning: "Alcuni contenuti potrebbero essere ancora in aggiornamento.",
    pageSectionsAria: "Sezioni della pagina",
    footerEyebrow: "Henry Onyx",
    footerTitle:
      "Lo stesso standard operativo a cui si affidano clienti, partner e team.",
    footerBody:
      "Ogni superficie corporate di Henry Onyx — chi siamo, contatti, governance, policy — viene pubblicata seguendo un unico standard editoriale: ciò che si legge in pubblico corrisponde a ciò che teniamo in privato.",
    footerUseCase: "Caso d’uso",
    footerUseCaseValue: "Clienti · Partner · Media",
    footerStandard: "Standard",
    footerStandardValue: "Strutturato · Verificato",
  },
  aboutHonest: {
    eyebrow: "Su questa azienda",
    title: "Un’azienda, più attività focalizzate, un unico standard operativo.",
    body:
      "Henry Onyx è un gruppo operativo multi-divisione. Ogni divisione guida il proprio mercato — Care, Marketplace, Property, Logistics, Studio, Jobs, Learn — con lo stesso standard di presentazione, prenotazione, pricing e follow-up. L’hub esiste affinché clienti, partner e stakeholder possano vedere l’intera azienda in un unico luogo e raggiungere il business giusto in un solo passo. Cresciamo aggiungendo divisioni dentro questo quadro, non estendendo un singolo marchio fino a snaturarlo.",
    figureDivisionsLive: "Divisioni attive",
    figureYearEstablished: "Anno di fondazione",
    figureOperatingCity: "Città operativa",
    founderEyebrow: "Nota del fondatore",
    founderPhotoPlaceholder: "Foto",
    founderPlaceholderTitle: "Nota del fondatore — contenuto gestito tramite CMS",
    founderPlaceholderBody:
      "Qui apparirà una breve nota firmata dal fondatore. La struttura è pronta — testo, foto e firma confluiscono dal CMS aziendale una volta pubblicati.",
    linkReachCompany: "Contatta l’azienda",
    linkBrowseDivisions: "Esplora le divisioni",
  },
  leadership: {
    roleFallback: "Profilo di leadership",
    toneOwner: "Proprietà",
    toneManagement: "Direzione",
    toneFeatured: "In evidenza",
    toneLeadership: "Leadership",
    actionContact: "Contatta",
    actionCall: "Chiama",
    actionLinkedin: "LinkedIn",
    actionFullProfile: "Profilo completo",
    modalCloseAria: "Chiudi profilo",
    modalEyebrow: "Profilo di leadership",
    modalBioFallback:
      "Questo profilo fa parte del consiglio pubblico di leadership di Henry Onyx",
    emptyTitle: "Qui appariranno le informazioni di leadership",
    emptyBody:
      "Pubblica i profili di leadership dal pannello del titolare per presentare proprietà, direzione e rappresentanti aziendali di fiducia in un formato pubblico curato.",
    sharedSectionDescription:
      "I profili di questa sezione rappresentano le persone, la responsabilità e la cura operativa che sostengono il gruppo Henry Onyx",
    headerEyebrow: "Consiglio di leadership",
    headerTitle: "Leadership e responsabilità",
    headerBody:
      "Scopri le persone che danno forma a Henry Onyx tra proprietà, leadership pubblica, direzione operativa e responsabilità di lungo periodo.",
    metricProfiles: "Profili",
    metricOwnership: "Proprietà",
    metricManagement: "Direzione",
    spotlightEyebrow: "Profilo in primo piano",
    spotlightBioFallback:
      "Questo profilo di leadership rappresenta le persone responsabili di indirizzo, governance ed esecuzione premium nel gruppo Henry Onyx",
    sectionOwnershipTitle: "Proprietà",
    sectionOwnershipEyebrow: "Leadership aziendale",
    sectionManagementTitle: "Direzione",
    sectionManagementEyebrow: "Leadership operativa",
    sectionFeaturedTitle: "Team in evidenza",
    sectionFeaturedEyebrow: "Rappresentanti principali",
    sectionOthersTitle: "Profili aggiuntivi",
    sectionOthersEyebrow: "Rappresentanza aziendale",
  },
  faqBlock: {
    eyebrow: "Domande frequenti",
  },
  publicSiteShell: {
    brandFallback: "Henry Onyx",
    colCompany: "Azienda",
    linkHome: "Home",
    linkAbout: "Chi siamo",
    linkContact: "Contatto",
    linkSearch: "Cerca",
    colHenryCo: "Henry Onyx",
    linkHenryCoAccount: "Account Henry Onyx",
    linkLanguagePrefs: "Lingua e preferenze",
    linkEmailPrefs: "Preferenze e-mail",
    colLegal: "Note legali",
    linkPrivacy: "Privacy",
    linkTerms: "Termini",
    allRightsReserved: "Tutti i diritti riservati.",
    builtBy: "Progettato e sviluppato internamente da Henry Onyx Studio per l'ecosistema Henry Onyx",
    menuDivisionsDirectory: "Elenco divisioni",
    menuAbout: "Chi siamo",
    menuContact: "Contatto",
  },
  newsletterUnsubscribe: {
    metaTitle: "Annulla iscrizione — Henry Onyx",
    metaDescription: "Annulla l'iscrizione alle newsletter Henry Onyx con un clic.",
    eyebrow: "Newsletter",
    missingTitle: "Link di annullamento mancante.",
    missingBody:
      "Apri il link «Annulla iscrizione» da qualsiasi e-mail Henry Onyx per arrivare qui con un token valido. Se il tuo link è scaduto, contattaci e lo gestiremo manualmente.",
    missingCtaContact: "Contatta l'assistenza",
    missingCtaBack: "Torna alle newsletter",
    errorTitle: "Non siamo riusciti a disiscriverti.",
    errorManualNote:
      "Se il problema persiste, rispondi «annulla iscrizione» a qualsiasi e-mail Henry Onyx e il nostro team provvederà manualmente.",
    successTitle: "Sei disiscritto.",
    successBody:
      "{{email}} non riceverà più le newsletter Henry Onyx. I messaggi transazionali (ricevute, spedizioni, verifica, sicurezza) continueranno ad essere inviati perché siamo obbligati a farlo.",
    changedMind: "Hai cambiato idea?",
    ctaSubscribeAgain: "Iscriviti di nuovo",
    ctaManagePrefs: "Gestisci tutte le preferenze",
  },
  v3: {
    story: {
      metaTitle: "L'ecosistema — {brand}",
      metaDescription:
        "Un account, un portafoglio, un'unica spina dorsale per le conversazioni — tra care, marketplace, jobs, learn, logistics, studio e property. Ogni affermazione di questa pagina apre il prodotto reale.",
      eyebrow: "L'ecosistema",
      title: "Un account. Un portafoglio. Sette divisioni attive.",
      lede:
        "Henry Onyx è un'unica economia connessa: prenota servizi di cura, acquista da venditori verificati, trova lavoro, impara una competenza, spedisci un pacco, commissiona lavori creativi, trova casa — con una sola identità, un solo portafoglio, un'unica spina dorsale per le conversazioni. Niente in questa pagina è un mockup; ogni link apre il prodotto vero.",
      primaryCta: "Esplora l'ecosistema",
      earnLink: "Come guadagniamo — in parole semplici",
      tryLink: "Prova il percorso",
      shippedLink: "Cosa è attivo",
      divisionsTitle: "Le divisioni",
      divisionsLede: "Ognuna è un prodotto completo. Ogni riga apre la superficie reale — questa è la prova.",
      seeLive: "Vedilo dal vivo",
      divisionBodies: {
        care: "Cura della casa e dei tessuti, prenotata con fornitori verificati e prezzi onesti.",
        marketplace: "Acquista da venditori verificati, con ogni ordine tracciato fino alla tua porta.",
        jobs: "Candidati, sostieni il colloquio e fatti assumere — con conversazioni reali, non silenzi.",
        learn: "Corsi con anteprime gratuite, prezzi equi e certificati che valgono davvero.",
        logistics: "Spedizioni con preventivo anticipato e tracciamento da un capo all'altro.",
        studio: "Commissiona lavori creativi in uno spazio di lavoro condiviso con il cliente.",
        property: "Trova immobili e invia richieste su annunci verificati.",
      },
      roadmapNote:
        "Il prossimo passo della roadmap: la Gaming Arena. Comparirà qui quando sarà reale — non prima.",
      spineTitle: "La spina dorsale che condividono",
      spineLede: "Le parti che senti ovunque, qualunque divisione tu usi.",
      spine: [
        {
          title: "Un'unica identità",
          body: "Un solo account accede a ogni divisione. Gli elementi salvati, i messaggi e la cronologia ti seguono ovunque.",
        },
        {
          title: "Denaro onesto",
          body: "Un registro in partita doppia dietro ogni pagamento, imposte dettagliate, ricevute che indicano l'entità legale. Nessun costo nascosto — la voce della commissione è una caratteristica, non una confessione.",
        },
        {
          title: "Un'unica spina dorsale per le conversazioni",
          body: "Dall'acquirente al venditore, dal candidato al datore di lavoro, dal cliente al team — lo stesso motore di messaggistica con le stesse regole di sicurezza ovunque.",
        },
        {
          title: "La tua lingua",
          body: "Dodici lingue, un solo prodotto. Prezzi nella tua valuta, non nella nostra.",
        },
      ],
      honestyNote:
        "Se qualcosa in questa pagina non corrisponde al prodotto, è un bug — segnalacelo e correggeremo la pagina o il prodotto, a seconda di dove sta l'errore.",
    },
    earn: {
      metaTitle: "Come guadagniamo — {brand}",
      metaDescription:
        "Ogni meccanismo di ricavo di Henry Onyx, in parole semplici: cosa addebitiamo, cosa ricevi in cambio e le tre prove che ogni commissione deve superare.",
      eyebrow: "La mappa dei ricavi",
      title: "Come guadagna Henry Onyx",
      lede:
        "La maggior parte delle piattaforme nasconde questa pagina. Per noi è proprio questo il segnale. Ecco ogni modo in cui guadagniamo, cosa ricevi in cambio e le prove che una commissione deve superare prima di esistere.",
      testsTitle: "Le tre prove",
      tests: [
        {
          title: "Sai per cosa stai pagando",
          body: "Nessun costo nascosto, nessun addebito a sorpresa. Se si applica una commissione, è una voce con un nome, visibile prima della conferma.",
        },
        {
          title: "Ricevi più di quanto costa",
          body: "Ogni addebito corrisponde a qualcosa che ha valore per te — e sappiamo dirlo in una frase.",
        },
        {
          title: "Pubblicheremmo la tariffa",
          body: "Se ci metterebbe a disagio vedere una tariffa in uno screenshot sui social, quella tariffa è sbagliata.",
        },
      ],
      rowsTitle: "Divisione per divisione",
      rowsLede:
        "Meccanismi, non clausole in piccolo. Dove una divisione è ancora agli inizi, lo diciamo — nessuna commissione si attiva prima che la sua riga compaia qui.",
      liveTag: "Attivo oggi",
      earlyTag: "Pubblicato prima dell'attivazione",
      rows: [
        {
          division: "marketplace",
          mechanism: "Una commissione sugli ordini completati, e posizionamenti sponsorizzati sempre etichettati come tali.",
          exchange: "Venditori verificati, protezione dei pagamenti, tracciamento degli ordini e un vero processo di gestione delle controversie.",
          live: true,
        },
        {
          division: "care",
          mechanism: "Una commissione di piattaforma sulle prenotazioni completate, dettagliata al pagamento.",
          exchange: "Fornitori selezionati, prezzi onesti, riprenotazione con un tocco e un'assistenza che risponde.",
          live: true,
        },
        {
          division: "learn",
          mechanism: "Una quota dei ricavi condivisa con i docenti sui corsi a pagamento.",
          exchange: "Anteprime gratuite prima di pagare, prezzi equi e certificati condivisibili.",
          live: true,
        },
        {
          division: "studio",
          mechanism: "Una commissione di progetto sui lavori creativi commissionati.",
          exchange: "Uno spazio di lavoro condiviso, milestone chiare e pagamento trattenuto fino alla consegna.",
          live: true,
        },
        {
          division: "jobs",
          mechanism: "Strumenti e annunci lato datore di lavoro. I candidati non pagano mai per candidarsi.",
          exchange: "Conversazioni reali con i datori di lavoro, stato della candidatura sempre visibile, pianificazione dei colloqui.",
          live: true,
        },
        {
          division: "logistics",
          mechanism: "Un margine su ogni spedizione, con preventivo anticipato — il prezzo che vedi è il prezzo.",
          exchange: "Preventivi anticipati, trasparenza sui corrieri e tracciamento da un capo all'altro.",
          live: true,
        },
        {
          division: "property",
          mechanism: "Strumenti di pubblicazione e gestione per proprietari e amministratori.",
          exchange: "Annunci verificati e una cronologia documentata delle richieste.",
          live: false,
        },
      ],
      feeTitle: "La commissione di piattaforma, per nome",
      feeBody:
        "Dove si applica una commissione di piattaforma, appare come voce separata al pagamento — mai nascosta nel totale. Finanzia ciò che rende l'ecosistema affidabile: verifica, risoluzione delle controversie e assistenza 24 ore su 24, 7 giorni su 7. La stessa spiegazione appare nel tooltip della commissione a ogni pagamento, perché non dovresti aver bisogno di questa pagina per trovarla.",
      closingTitle: "Vedi qualcosa che non supera le prove?",
      closingBody:
        "Se una commissione su Henry Onyx non supera una delle tre prove, è progettata male — segnalacelo e la correggeremo. Questa pagina cambia prima dei prezzi, non dopo.",
    },
  },
};
const HUB_PUBLIC_COPY_ZH: DeepPartial<HubPublicCopy> = {
  footer: {
    description:
      "一座面向多业务板块的高级企业门户,以清晰、可信与长期一致的品牌纪律,呈现 Henry Onyx 的完整生态。",
    columnCompany: "公司",
    columnLegal: "法律",
    home: "首页",
    about: "关于我们",
    contact: "联系我们",
    privacyPolicy: "隐私政策",
    termsConditions: "条款与条件",
    allRightsReserved: "保留所有权利。",
    builtBy: "由 Henry Onyx Studio 内部为 Henry Onyx 生态量身设计与打造",
  },
  contactHero: {
    eyebrow: "联系 Henry Onyx",
    title:
      "集团层面的沟通——合作、媒体、供应商、投资者,以及一切属于母公司的事务。",
    body:
      "若您的事项涉及具体业务板块,前往该板块的联系页面通常能获得更快的响应。本表单用于公司层面的咨询。",
    bulletPartnerships:
      "合作关系、合资项目以及分销渠道引荐。",
    bulletPress: "新闻、媒体、品牌与编辑事务。",
    bulletSupplier:
      "供应商接洽、与投资者或顾问的交流,以及您希望我们直接听到的反馈。",
    ctaDivisions: "了解各业务板块",
    ctaAbout: "了解公司",
  },
  companyPage: {
    recentlyUpdated: "近期更新",
    metaUpdated: "更新于",
    metaSection: "栏目",
    metaStandard: "标准",
    metaCorporateGrade: "企业级",
    serverWarning: "部分内容可能仍在更新中。",
    pageSectionsAria: "页面栏目",
    footerEyebrow: "Henry Onyx",
    footerTitle:
      "与客户、合作伙伴及团队所信赖的运营标准始终一致。",
    footerBody:
      "Henry Onyx 旗下的每一处对外页面——关于、联系、治理、政策——皆遵循同一套编辑标准发布,公开呈现与内部坚持完全一致。",
    footerUseCase: "适用场景",
    footerUseCaseValue: "客户 · 合作伙伴 · 媒体",
    footerStandard: "标准",
    footerStandardValue: "结构化 · 经核验",
  },
  aboutHonest: {
    eyebrow: "关于本公司",
    title: "一家公司,多项专注业务,统一的运营标准。",
    body:
      "Henry Onyx 是一家多业务板块的运营集团。各板块各自经营自有市场——Care、Marketplace、Property、Logistics、Studio、Jobs、Learn——并按同一标准完成呈现、预订、定价与后续跟进。本中心存在的意义,是让客户、合作伙伴与利益相关方在同一入口看见公司全貌,并在一步之内抵达对应业务。我们的成长方式,是在这套框架内增设业务板块,而非将单一品牌过度拉伸。",
    figureDivisionsLive: "在线业务板块",
    figureYearEstablished: "成立年份",
    figureOperatingCity: "运营所在地",
    founderEyebrow: "创始人寄语",
    founderPhotoPlaceholder: "照片",
    founderPlaceholderTitle: "创始人寄语 — 内容由 CMS 管理",
    founderPlaceholderBody:
      "此处将呈现创始人亲笔签署的简短寄语。版式已就绪——文字、照片与署名将在公司 CMS 发布后自动接入。",
    linkReachCompany: "联系公司",
    linkBrowseDivisions: "浏览业务板块",
  },
  leadership: {
    roleFallback: "领导团队介绍",
    toneOwner: "股东",
    toneManagement: "管理层",
    toneFeatured: "精选",
    toneLeadership: "领导团队",
    actionContact: "联系",
    actionCall: "致电",
    actionLinkedin: "LinkedIn",
    actionFullProfile: "完整介绍",
    modalCloseAria: "关闭介绍",
    modalEyebrow: "领导团队介绍",
    modalBioFallback:
      "该介绍属于 Henry Onyx 公开发布的领导团队信息。",
    emptyTitle: "领导团队信息将在此显示",
    emptyBody:
      "请在所有者控制台中发布领导团队介绍,以体面而专业的方式向公众呈现公司的股东、管理层及主要代表。",
    sharedSectionDescription:
      "此部分的介绍体现着 Henry Onyx 集团背后的人、所担负的治理责任与持续的运营守护。",
    headerEyebrow: "领导团队",
    headerTitle: "领导与治理",
    headerBody:
      "认识塑造 Henry Onyx 的人——涵盖股东、对外领导、运营方向与长期责任。",
    metricProfiles: "介绍数量",
    metricOwnership: "股东",
    metricManagement: "管理层",
    spotlightEyebrow: "焦点介绍",
    spotlightBioFallback:
      "该领导团队介绍代表 Henry Onyx 集团在方向、治理与高品质执行方面所依赖的核心成员。",
    sectionOwnershipTitle: "股东",
    sectionOwnershipEyebrow: "公司领导",
    sectionManagementTitle: "管理层",
    sectionManagementEyebrow: "运营领导",
    sectionFeaturedTitle: "精选团队",
    sectionFeaturedEyebrow: "主要代表",
    sectionOthersTitle: "更多介绍",
    sectionOthersEyebrow: "公司代表",
  },
  faqBlock: {
    eyebrow: "常见问题",
  },
  publicSiteShell: {
    brandFallback: "Henry Onyx",
    colCompany: "公司",
    linkHome: "首页",
    linkAbout: "关于我们",
    linkContact: "联系我们",
    linkSearch: "搜索",
    colHenryCo: "Henry Onyx",
    linkHenryCoAccount: "Henry Onyx账户",
    linkLanguagePrefs: "语言与偏好",
    linkEmailPrefs: "邮件偏好",
    colLegal: "法律",
    linkPrivacy: "隐私",
    linkTerms: "条款",
    allRightsReserved: "版权所有。",
    builtBy: "由Henry Onyx Studio为Henry Onyx生态系统内部设计和构建",
    menuDivisionsDirectory: "部门目录",
    menuAbout: "关于我们",
    menuContact: "联系我们",
  },
  newsletterUnsubscribe: {
    metaTitle: "取消订阅 — Henry Onyx",
    metaDescription: "一键取消订阅Henry Onyx新闻通讯。",
    eyebrow: "新闻通讯",
    missingTitle: "取消订阅链接缺失。",
    missingBody:
      "打开任何Henry Onyx邮件中的「取消订阅」链接，携带有效令牌来到此页面。如果您的链接已过期，请联系我们，我们将手动处理。",
    missingCtaContact: "联系支持",
    missingCtaBack: "返回新闻通讯",
    errorTitle: "我们无法为您取消订阅。",
    errorManualNote:
      "如果此情况持续发生，请回复任何Henry Onyx邮件并注明「取消订阅」，我们的团队将手动处理。",
    successTitle: "您已取消订阅。",
    successBody:
      "{{email}} 将不再收到Henry Onyx新闻通讯。交易类消息（收据、配送、验证、安全）仍会发送，因为我们必须这样做。",
    changedMind: "改变主意了？",
    ctaSubscribeAgain: "重新订阅",
    ctaManagePrefs: "管理所有偏好",
  },
  v3: {
    story: {
      metaTitle: "生态全景 — {brand}",
      metaDescription:
        "一个账户、一个钱包、一条对话主线——贯通家护、集市、职聘、学院、物流、创作室与房产。本页的每一项陈述，都可直接打开对应的真实产品。",
      eyebrow: "生态全景",
      title: "一个账户。一个钱包。七个已上线的业务板块。",
      lede:
        "Henry Onyx 是一个互联互通的经济体：预约护理服务、选购认证卖家的商品、求职入职、学习技能、寄送包裹、委托创意项目、寻找住所——共用同一个身份、同一个钱包、同一条对话主线。本页没有任何示意图；每一条链接打开的都是真实产品。",
      primaryCta: "浏览整个生态",
      earnLink: "我们如何盈利——直白说明",
      tryLink: "试走这段旅程",
      shippedLink: "现已上线",
      divisionsTitle: "业务板块",
      divisionsLede: "每一个板块都是完整的产品。每一行都能打开线上的真实页面——这就是证明。",
      seeLive: "查看实况",
      divisionBodies: {
        care: "家居与织物护理，由认证服务者提供，价格坦诚透明。",
        marketplace: "选购认证卖家的商品，每笔订单全程跟踪，直至送达。",
        jobs: "投递、面试、入职——有真实的对话往来，不再石沉大海。",
        learn: "课程提供免费试看，定价公道，证书有分量。",
        logistics: "运费提前报价，运输全程可追踪。",
        studio: "委托创意项目，客户与团队共享同一个工作空间。",
        property: "查找并咨询房源，所有房源均经过核验。",
      },
      roadmapNote:
        "路线图上的下一站：游戏竞技场。等它真正上线，才会出现在这里——绝不提前。",
      spineTitle: "它们共享的主干",
      spineLede: "无论使用哪个板块，你在每一处都能感受到的底层能力。",
      spine: [
        {
          title: "一个身份",
          body: "一个账户，登录所有板块。你的收藏、消息与历史记录随你而行。",
        },
        {
          title: "坦诚的账目",
          body: "每笔付款背后都有复式记账支撑，税费逐项列示，收据注明法律实体全称。没有隐藏费用——费用明细是一项功能，而非一份认罪书。",
        },
        {
          title: "一条对话主线",
          body: "买家与卖家、求职者与雇主、客户与团队——同一套消息引擎，同一套安全规则，处处一致。",
        },
        {
          title: "你的语言",
          body: "十二种语言，同一个产品。价格以你的货币显示，而不是我们的。",
        },
      ],
      honestyNote:
        "如果本页任何内容与产品不符，那就是一个缺陷——告诉我们，我们会修正页面或修正产品，哪个错了改哪个。",
    },
    earn: {
      metaTitle: "我们如何盈利 — {brand}",
      metaDescription:
        "Henry Onyx 的每一项收入机制，直白呈现：我们收取什么，你得到什么，以及每项费用必须通过的三条检验。",
      eyebrow: "盈利地图",
      title: "Henry Onyx 如何盈利",
      lede:
        "多数平台会把这一页藏起来。我们认为这本身就说明了问题。这里列出我们赚钱的每一种方式、你得到的对应价值，以及一项费用在设立之前必须通过的检验。",
      testsTitle: "三条检验",
      tests: [
        {
          title: "你清楚自己在为什么付费",
          body: "没有隐藏费用，没有意外扣款。凡有费用，都会在你确认之前作为具名条目列出。",
        },
        {
          title: "你得到的多于你付出的",
          body: "每一笔收费都对应你在意的价值——而且我们能用一句话说清它是什么。",
        },
        {
          title: "我们敢公开这个费率",
          body: "如果某个费率被截图发到社交媒体会让我们不安，那这个费率本身就是错的。",
        },
      ],
      rowsTitle: "逐个板块说明",
      rowsLede:
        "讲机制，不玩小字条款。板块尚在早期的，我们如实说明——任何费用在此处列出对应条目之前，都不会开始收取。",
      liveTag: "已在收取",
      earlyTag: "先公示，后启用",
      rows: [
        {
          division: "marketplace",
          mechanism: "对已完成订单收取佣金；推广位始终标注为推广。",
          exchange: "认证卖家、付款保障、订单跟踪，以及真正有效的争议处理流程。",
          live: true,
        },
        {
          division: "care",
          mechanism: "对已完成的预约收取平台费，在结算时逐项列示。",
          exchange: "经过审核的服务者、坦诚的定价、一键再次预约，以及有回应的客户支持。",
          live: true,
        },
        {
          division: "learn",
          mechanism: "对付费课程与讲师进行收入分成。",
          exchange: "付费前免费试看、公道的价格，以及可分享的证书。",
          live: true,
        },
        {
          division: "studio",
          mechanism: "对委托的创意项目收取项目费。",
          exchange: "共享工作空间、清晰的里程碑，以及交付前托管的款项。",
          live: true,
        },
        {
          division: "jobs",
          mechanism: "面向雇主的工具与职位发布服务。求职者投递永远免费。",
          exchange: "与雇主的真实对话、可随时查看的申请进度、面试日程安排。",
          live: true,
        },
        {
          division: "logistics",
          mechanism: "每笔运单包含利润空间，提前报价——你看到的价格就是最终价格。",
          exchange: "预先报价、承运信息透明，以及端到端的全程跟踪。",
          live: true,
        },
        {
          division: "property",
          mechanism: "面向业主与管理方的房源发布与管理工具。",
          exchange: "经核验的房源，以及有据可查的咨询记录。",
          live: false,
        },
      ],
      feeTitle: "平台费，明白列出",
      feeBody:
        "凡收取平台费之处，它都会在结算页作为独立一行出现——绝不藏进总价。它用于支撑让这个生态值得信赖的事情：身份核验、争议处理，以及全天候客户支持。每个结算页的费用提示中都有同样的说明，因为你本不该靠这一页才能找到它。",
      closingTitle: "发现有费用通不过检验？",
      closingBody:
        "如果 Henry Onyx 的任何费用未能通过这三条检验中的任何一条，那就是设计出了错——告诉我们，我们会改正。本页的更新永远先于定价变动，而不是之后。",
    },
  },
};
const HUB_PUBLIC_COPY_HI: DeepPartial<HubPublicCopy> = {
  footer: {
    description:
      "Henry Onyx के पूरे तंत्र को स्पष्टता, भरोसे और दीर्घकालिक ब्रांड अनुशासन के साथ प्रस्तुत करने के लिए तैयार किया गया एक प्रीमियम बहु-डिवीज़न कॉर्पोरेट प्रवेशद्वार।",
    columnCompany: "कंपनी",
    columnLegal: "क़ानूनी",
    home: "मुखपृष्ठ",
    about: "हमारे बारे में",
    contact: "संपर्क करें",
    privacyPolicy: "गोपनीयता नीति",
    termsConditions: "नियम एवं शर्तें",
    allRightsReserved: "सर्वाधिकार सुरक्षित।",
    builtBy: "Henry Onyx Studio द्वारा Henry Onyx तंत्र के लिए स्वयं अभिकल्पित एवं निर्मित",
  },
  contactHero: {
    eyebrow: "Henry Onyx से संपर्क करें",
    title:
      "समूह स्तर की बातचीत — साझेदारियाँ, मीडिया, आपूर्तिकर्ता, निवेशक और मूल कंपनी से जुड़ा हर विषय।",
    body:
      "यदि आपका विषय किसी विशेष डिवीज़न से संबंधित है, तो उसी डिवीज़न के संपर्क पृष्ठ से उत्तर अधिक शीघ्र मिलेगा। कंपनी स्तर की पूछताछ के लिए इस फ़ॉर्म का उपयोग करें।",
    bulletPartnerships:
      "साझेदारियाँ, संयुक्त उद्यम और वितरण-संबंधी परिचय।",
    bulletPress: "प्रेस, मीडिया, ब्रांड और संपादकीय अनुरोध।",
    bulletSupplier:
      "आपूर्तिकर्ताओं का परिचय, निवेशकों या सलाहकारों के साथ संवाद, तथा वे बातें जिन्हें हम सीधे सुनना चाहेंगे।",
    ctaDivisions: "डिवीज़न देखें",
    ctaAbout: "कंपनी के बारे में",
  },
  companyPage: {
    recentlyUpdated: "हाल ही में अद्यतन",
    metaUpdated: "अद्यतन",
    metaSection: "खंड",
    metaStandard: "मानक",
    metaCorporateGrade: "कॉर्पोरेट स्तर",
    serverWarning: "कुछ सामग्री अभी भी अद्यतन हो रही हो सकती है।",
    pageSectionsAria: "पृष्ठ के खंड",
    footerEyebrow: "Henry Onyx",
    footerTitle:
      "वही परिचालन मानक जिस पर हमारे ग्राहक, साझेदार और टीमें भरोसा करती हैं।",
    footerBody:
      "Henry Onyx की हर सार्वजनिक सतह — परिचय, संपर्क, अभिशासन, नीति — एक ही संपादकीय मानक के अंतर्गत प्रकाशित होती है, ताकि जो आप सार्वजनिक रूप से पढ़ते हैं वही हम भीतर से भी पालन करते हैं।",
    footerUseCase: "उपयोग",
    footerUseCaseValue: "ग्राहक · साझेदार · मीडिया",
    footerStandard: "मानक",
    footerStandardValue: "सुव्यवस्थित · सत्यापित",
  },
  aboutHonest: {
    eyebrow: "इस कंपनी के बारे में",
    title: "एक कंपनी, कई केंद्रित व्यवसाय, एक ही परिचालन मानक।",
    body:
      "Henry Onyx एक बहु-डिवीज़न परिचालन समूह है। प्रत्येक डिवीज़न — Care, Marketplace, Property, Logistics, Studio, Jobs, Learn — अपने बाज़ार का संचालन उसी प्रस्तुति, बुकिंग, मूल्य-निर्धारण और अनुवर्ती सेवा के मानक पर करता है। यह हब इसलिए है कि ग्राहक, साझेदार और हितधारक पूरी कंपनी को एक ही जगह देख सकें और एक ही क़दम में सही व्यवसाय तक पहुँच सकें। हम इसी ढाँचे के भीतर नए डिवीज़न जोड़कर बढ़ते हैं, किसी एक ब्रांड को अधिक नहीं खींचते।",
    figureDivisionsLive: "सक्रिय डिवीज़न",
    figureYearEstablished: "स्थापना वर्ष",
    figureOperatingCity: "संचालन का शहर",
    founderEyebrow: "संस्थापक की टिप्पणी",
    founderPhotoPlaceholder: "फ़ोटो",
    founderPlaceholderTitle: "संस्थापक की टिप्पणी — सामग्री CMS द्वारा संचालित",
    founderPlaceholderBody:
      "यहाँ संस्थापक द्वारा हस्ताक्षरित एक संक्षिप्त टिप्पणी दिखाई देगी। ढाँचा तैयार है — पाठ, फ़ोटो और हस्ताक्षर प्रकाशन के बाद कंपनी के CMS से स्वतः जुड़ जाएँगे।",
    linkReachCompany: "कंपनी से संपर्क करें",
    linkBrowseDivisions: "डिवीज़न देखें",
  },
  leadership: {
    roleFallback: "नेतृत्व परिचय",
    toneOwner: "स्वामित्व",
    toneManagement: "प्रबंधन",
    toneFeatured: "विशेष",
    toneLeadership: "नेतृत्व",
    actionContact: "संपर्क करें",
    actionCall: "कॉल करें",
    actionLinkedin: "LinkedIn",
    actionFullProfile: "पूरा परिचय",
    modalCloseAria: "परिचय बंद करें",
    modalEyebrow: "नेतृत्व परिचय",
    modalBioFallback:
      "यह परिचय Henry Onyx के सार्वजनिक नेतृत्व मंडल का हिस्सा है।",
    emptyTitle: "नेतृत्व की जानकारी यहाँ प्रकट होगी",
    emptyBody:
      "स्वामी डैशबोर्ड से नेतृत्व परिचय प्रकाशित कीजिए, ताकि कंपनी का स्वामित्व, प्रबंधन और भरोसेमंद प्रतिनिधि एक सुसज्जित सार्वजनिक रूप में दिखाई दें।",
    sharedSectionDescription:
      "इस खंड के परिचय Henry Onyx समूह के पीछे खड़े लोगों, उनकी देखरेख और परिचालन उत्तरदायित्व को दर्शाते हैं।",
    headerEyebrow: "नेतृत्व मंडल",
    headerTitle: "नेतृत्व और देखरेख",
    headerBody:
      "उन लोगों से परिचित हों जो स्वामित्व, सार्वजनिक नेतृत्व, परिचालन दिशा और दीर्घकालिक उत्तरदायित्व के माध्यम से Henry Onyx को आकार देते हैं।",
    metricProfiles: "परिचय",
    metricOwnership: "स्वामित्व",
    metricManagement: "प्रबंधन",
    spotlightEyebrow: "विशेष परिचय",
    spotlightBioFallback:
      "यह नेतृत्व परिचय उन व्यक्तियों का प्रतिनिधित्व करता है जो Henry Onyx समूह की दिशा, अभिशासन और प्रीमियम क्रियान्वयन के लिए उत्तरदायी हैं।",
    sectionOwnershipTitle: "स्वामित्व",
    sectionOwnershipEyebrow: "कंपनी नेतृत्व",
    sectionManagementTitle: "प्रबंधन",
    sectionManagementEyebrow: "परिचालन नेतृत्व",
    sectionFeaturedTitle: "विशेष टीम",
    sectionFeaturedEyebrow: "प्रमुख प्रतिनिधि",
    sectionOthersTitle: "अन्य परिचय",
    sectionOthersEyebrow: "कंपनी का प्रतिनिधित्व",
  },
  faqBlock: {
    eyebrow: "अक्सर पूछे जाने वाले प्रश्न",
  },
  publicSiteShell: {
    brandFallback: "Henry Onyx",
    colCompany: "कंपनी",
    linkHome: "होम",
    linkAbout: "हमारे बारे में",
    linkContact: "संपर्क",
    linkSearch: "खोज",
    colHenryCo: "Henry Onyx",
    linkHenryCoAccount: "Henry Onyx खाता",
    linkLanguagePrefs: "भाषा और प्राथमिकताएं",
    linkEmailPrefs: "ईमेल प्राथमिकताएं",
    colLegal: "कानूनी",
    linkPrivacy: "गोपनीयता",
    linkTerms: "शर्तें",
    allRightsReserved: "सर्वाधिकार सुरक्षित।",
    builtBy: "Henry Onyx Studio द्वारा Henry Onyx पारिस्थितिकी तंत्र के लिए आंतरिक रूप से डिज़ाइन और निर्मित",
    menuDivisionsDirectory: "डिवीजन निर्देशिका",
    menuAbout: "हमारे बारे में",
    menuContact: "संपर्क",
  },
  newsletterUnsubscribe: {
    metaTitle: "सदस्यता रद्द करें — Henry Onyx",
    metaDescription: "Henry Onyx न्यूज़लेटर से एक क्लिक में सदस्यता रद्द करें।",
    eyebrow: "न्यूज़लेटर",
    missingTitle: "सदस्यता रद्द करने का लिंक नहीं मिला।",
    missingBody:
      "किसी भी Henry Onyx ईमेल से «सदस्यता रद्द करें» लिंक खोलें और वैध टोकन के साथ यहां आएं। यदि आपका लिंक समाप्त हो गया है, तो हमसे संपर्क करें और हम इसे मैन्युअली पूरा करेंगे।",
    missingCtaContact: "सहायता से संपर्क करें",
    missingCtaBack: "न्यूज़लेटर पर वापस जाएं",
    errorTitle: "हम आपकी सदस्यता रद्द नहीं कर सके।",
    errorManualNote:
      "यदि यह जारी रहता है, किसी भी Henry Onyx ईमेल का जवाब «सदस्यता रद्द करें» लिखकर दें और हमारी टीम इसे मैन्युअली पूरा करेगी।",
    successTitle: "आपकी सदस्यता रद्द हो गई।",
    successBody:
      "{{email}} को Henry Onyx न्यूज़लेटर नहीं मिलेंगे। लेन-देन संबंधी संदेश (रसीदें, शिपिंग, सत्यापन, सुरक्षा) अभी भी भेजे जाएंगे क्योंकि हमें ऐसा करना आवश्यक है।",
    changedMind: "क्या आपने अपना मन बदल लिया?",
    ctaSubscribeAgain: "फिर से सदस्यता लें",
    ctaManagePrefs: "सभी प्राथमिकताएं प्रबंधित करें",
  },
};
const HUB_PUBLIC_COPY_IG: DeepPartial<HubPublicCopy> = {
  footer: {
    description:
      "Ọnụ ụzọ ụlọọrụ dị elu nke nwere ọtụtụ ngalaba, eji egosi usoro Henry Onyx n’ụzọ doro anya, na-ewete ntụkwasị obi, na-edobekwa ọkwa aha ya ogologo oge.",
    columnCompany: "Ụlọọrụ",
    columnLegal: "Iwu",
    home: "Mbụ",
    about: "Banyere anyị",
    contact: "Kpọtụrụ anyị",
    privacyPolicy: "Iwu nzuzo",
    termsConditions: "Usoro na ọnọdụ",
    allRightsReserved: "Ikike niile e debere.",
    builtBy: "Atụpụtara ma rụpụta n’ime ụlọ site na Henry Onyx Studio maka usoro Henry Onyx",
  },
  contactHero: {
    eyebrow: "Kpọtụrụ Henry Onyx",
    title:
      "Mkparịta ụka n’ọkwa ụlọọrụ-nne — mmekorita, mgbasa ozi, ndị na-eweta ngwa ahịa, ndị mmega ego, na ihe ọ bụla metụtara ụlọọrụ-nne.",
    body:
      "Maka ihe ọ bụla metụtara otu ngalaba, ị ga-enweta nzaghachi ngwa ngwa na ibe nkpọtụrụ nke ngalaba ahụ. Were akwụkwọ a maka ajụjụ metụtara ụlọọrụ niile.",
    bulletPartnerships:
      "Mmekorita, ọrụ ọnụ, na nkwado maka nkesa ngwa ahịa.",
    bulletPress: "Akwụkwọ akụkọ, mgbasa ozi, ọkwa aha, na ajụjụ ndị nchịkọta akụkọ.",
    bulletSupplier:
      "Mmekọrịta na ndị na-eweta ngwa ahịa, mkparịta ụka ya na ndị mmega ego ma ọ bụ ndị ndụmọdụ, na nkwupụta anyị kwesịrị ịnụ ozugbo.",
    ctaDivisions: "Nyochaa ngalaba ndị ahụ",
    ctaAbout: "Banyere ụlọọrụ",
  },
  companyPage: {
    recentlyUpdated: "E mere ọhụrụ na nso nso a",
    metaUpdated: "Emelitere",
    metaSection: "Akụkụ",
    metaStandard: "Ọkwa",
    metaCorporateGrade: "N’ọkwa ụlọọrụ",
    serverWarning: "Ụfọdụ ihe odide nwere ike ka na-emelite.",
    pageSectionsAria: "Akụkụ ibe a",
    footerEyebrow: "Henry Onyx",
    footerTitle:
      "Otu ọkwa ọrụ ahụ ndị ahịa anyị, ndị mmekọ, na ndị otu anyị tụkwasịrị obi na ya.",
    footerBody:
      "Ihu ọ bụla nke ụlọọrụ Henry Onyx — banyere anyị, nkpọtụrụ, ọchịchị, iwu — na-eso otu ọkwa nchịkọta edemede, ka ihe ndị mmadụ na-agụ n’ihu ọha bụrụkwa ihe anyị na-edobe n’ime onwe anyị.",
    footerUseCase: "Ihe e ji ya eme",
    footerUseCaseValue: "Ndị ahịa · Ndị mmekọ · Mgbasa ozi",
    footerStandard: "Ọkwa",
    footerStandardValue: "Nke ahaziri ahazi · Nke a kwadoro",
  },
  aboutHonest: {
    eyebrow: "Banyere ụlọọrụ a",
    title: "Otu ụlọọrụ, ọtụtụ ụzọ azụmahịa lekwasịrị anya, otu ọkwa ọrụ.",
    body:
      "Henry Onyx bụ otu ụlọọrụ-nne nwere ọtụtụ ngalaba. Ngalaba ọ bụla na-ejikwa ahịa nke aka ya — Care, Marketplace, Property, Logistics, Studio, Jobs, na Learn — n’otu ọkwa nke ngosipụta, ndokwa, ọnụ ahịa, na nlekọta. Ebe nzuko a dị ka ndị ahịa, ndị mmekọ, na ndị nwere mmasị wee hụ ụlọọrụ niile n’otu ebe ma rute n’azụmahịa ziri ezi n’otu nzọụkwụ. Anyị na-eto site n’itinye ngalaba ọhụrụ n’ime usoro a, ọ bụghị site n’ikwagharị otu ọkwa aha karịa ike ya.",
    figureDivisionsLive: "Ngalaba na-arụ ọrụ",
    figureYearEstablished: "Afọ a malitere ya",
    figureOperatingCity: "Obodo a na-arụ ọrụ",
    founderEyebrow: "Okwu onye guzobere ya",
    founderPhotoPlaceholder: "Foto",
    founderPlaceholderTitle: "Okwu onye guzobere ya — a na-elekọta site na CMS",
    founderPlaceholderBody:
      "Okwu nkenke nke onye guzobere ụlọọrụ a bịnyere aka ya ga-apụta ebe a. A kwadebere usoro ya — ederede, foto, na mbinye aka ga-abata site na CMS ụlọọrụ ozugbo akwadoro ya.",
    linkReachCompany: "Kpọtụrụ ụlọọrụ",
    linkBrowseDivisions: "Nyochaa ngalaba",
  },
  leadership: {
    roleFallback: "Akụkọ banyere onye nduzi",
    toneOwner: "Onye nwe",
    toneManagement: "Ndị njikwa",
    toneFeatured: "Nke ka mma",
    toneLeadership: "Ndị nduzi",
    actionContact: "Kpọtụrụ",
    actionCall: "Kpọọ",
    actionLinkedin: "LinkedIn",
    actionFullProfile: "Akụkọ zuru ezu",
    modalCloseAria: "Mechie akụkọ",
    modalEyebrow: "Akụkọ banyere onye nduzi",
    modalBioFallback:
      "Akụkọ a so na ndị nduzi Henry Onyx e gosipụtara n’ihu ọha.",
    emptyTitle: "Ozi banyere ndị nduzi ga-apụta ebe a",
    emptyBody:
      "Tinye akụkọ ndị nduzi site n’ụlọ ọchịchị onye nwe iji gosipụta nweta, njikwa, na ndị nnọchi anya ụlọọrụ a tụkwasịrị obi n’ụdị mara mma maka ọha.",
    sharedSectionDescription:
      "Akụkọ dị n’akụkụ a na-egosi mmadụ, nlekọta, na ọrụ nkwado dị n’azụ otu Henry Onyx",
    headerEyebrow: "Ọgbakọ ndị nduzi",
    headerTitle: "Nduzi na nlekọta",
    headerBody:
      "Matakwuo ndị na-akpụzi Henry Onyx — site na nweta, nduzi ọha, ntụzịaka ọrụ, na ọrụ nkwado nke ogologo oge.",
    metricProfiles: "Akụkọ",
    metricOwnership: "Nweta",
    metricManagement: "Njikwa",
    spotlightEyebrow: "Akụkọ pụrụ iche",
    spotlightBioFallback:
      "Akụkọ nduzi a na-egosi ndị na-ahụ maka ntụzịaka, ọchịchị, na ọrụ dị elu n’otu Henry Onyx",
    sectionOwnershipTitle: "Nweta",
    sectionOwnershipEyebrow: "Ndị nduzi ụlọọrụ",
    sectionManagementTitle: "Njikwa",
    sectionManagementEyebrow: "Nduzi ọrụ kwa ụbọchị",
    sectionFeaturedTitle: "Ndị otu pụtara ìhè",
    sectionFeaturedEyebrow: "Ndị nnọchi anya bụ isi",
    sectionOthersTitle: "Akụkọ ndị ọzọ",
    sectionOthersEyebrow: "Nnọchi anya ụlọọrụ",
  },
  faqBlock: {
    eyebrow: "Ajụjụ a na-ajụkarị",
  },
  publicSiteShell: {
    brandFallback: "Henry Onyx",
    colCompany: "Ụlọ ọrụ",
    linkHome: "Ụlọ",
    linkAbout: "Maka anyị",
    linkContact: "Kpọtụrụ anyị",
    linkSearch: "Chọọ",
    colHenryCo: "Henry Onyx",
    linkHenryCoAccount: "Akaụntụ Henry Onyx",
    linkLanguagePrefs: "Asụsụ & mmasị",
    linkEmailPrefs: "Mmasị imeli",
    colLegal: "Iwu",
    linkPrivacy: "Nzuzo",
    linkTerms: "Usoro",
    allRightsReserved: "Ikike nile echekwara.",
    builtBy: "Achepụtara ma wuo n'ime ụlọ site na Henry Onyx Studio maka njikọ Henry Onyx",
    menuDivisionsDirectory: "Ndepụta ngalaba",
    menuAbout: "Maka anyị",
    menuContact: "Kpọtụrụ anyị",
  },
  newsletterUnsubscribe: {
    metaTitle: "Wepụ onwe gị — Henry Onyx",
    metaDescription: "Wepụ onwe gị na mbipụta ozi Henry Onyx n'otu ntụọ.",
    eyebrow: "Mbipụta ozi",
    missingTitle: "Njikọ iwepụ onwe gị adịghị.",
    missingBody:
      "Mepee njikọ «Wepụ onwe gị» n'ozi imeli ọ bụla nke Henry Onyx iji bịa ebe a na token zuru oke. Ọ bụrụ na njikọ gị gasịrị, kpọtụrụ anyị ma anyị ga-eme ya n'aka.",
    missingCtaContact: "Kpọtụrụ nkwado",
    missingCtaBack: "Laghachi na mbipụta ozi",
    errorTitle: "Anyị enweghị ike iwepụ gị.",
    errorManualNote:
      "Ọ bụrụ na nke a na-aga n'ihu, zaa «wepụ onwe gị» na ozi imeli ọ bụla Henry Onyx ma ndị otu anyị ga-eme ya n'aka.",
    successTitle: "Ewepụrụ gị.",
    successBody:
      "{{email}} agaghị enweta mbipụta ozi Henry Onyx. Ozi ahịa (영수증, nziga, nyochaa, nchedo) ka na-eziga n'ihi na anyị ga-eme ya.",
    changedMind: "Ị gbanwere uche gị?",
    ctaSubscribeAgain: "Deere aha ọzọ",
    ctaManagePrefs: "Jikwaa nhọrọ niile",
  },
};
const HUB_PUBLIC_COPY_YO: DeepPartial<HubPublicCopy> = {
  footer: {
    description:
      "Ẹnu-ọnà aláṣẹ-onírúurú-ẹ̀ka tó wúlò gan-an, tí a ṣètò láti fi ètò Henry Onyx hàn pẹ̀lú ìmọ́lẹ̀, ìgbẹ́kẹ̀lé, àti ìdánilójú orúkọ ẹ̀dá-iṣẹ́ tí kò ní pòórá lóòókán.",
    columnCompany: "Iléeṣẹ́",
    columnLegal: "Òfin",
    home: "Ojú-ìwé àkọ́kọ́",
    about: "Nípa wa",
    contact: "Bá wa sọ̀rọ̀",
    privacyPolicy: "Ìlànà Ìpamọ́",
    termsConditions: "Àwọn Ìtọ́ni àti Àdéhùn",
    allRightsReserved: "Gbogbo ẹ̀tọ́ ni a fi pamọ́.",
    builtBy: "A ṣe àpẹẹrẹ rẹ̀ a sì kọ́ ọ ní ilé nípasẹ̀ Henry Onyx Studio fún ètò Henry Onyx",
  },
  contactHero: {
    eyebrow: "Bá Henry Onyx sọ̀rọ̀",
    title:
      "Ìjíròrò ní ìpele iléeṣẹ́ òbí — àjọṣe-òwò, ìròyìn, awọn aṣàwòmí, awọn olówó, àti ohunkóhun tó jẹ́ ti iléeṣẹ́-òbí.",
    body:
      "Bí ọ̀rọ̀ rẹ bá jẹ́ pàtàkì sí ẹ̀ka kan pàtó, ìwọ yóò gba ìdáhùn kíákíá lórí ojú-ìwé olùbáni-sọ̀rọ̀ ẹ̀ka náà. Lo fọ́ọ̀mù yìí fún ìbéèrè tí ó kan iléeṣẹ́ ní gbogbogbòò.",
    bulletPartnerships:
      "Àjọṣe-òwò, iṣẹ́ ìfọwọ́sowọ́pọ̀, àti ìfihàn fún pípín ọjà.",
    bulletPress: "Ìròyìn, ìpolówó, àmì-iléeṣẹ́, àti ìbéèrè fún àtúnṣe àkọsílẹ̀.",
    bulletSupplier:
      "Ìfihàn àwọn aṣàwòmí ọjà, ìjíròrò pẹ̀lú àwọn olówó tàbí amọ̀ràn, àti ohun tí a fẹ́ gbọ́ tààrà.",
    ctaDivisions: "Wo àwọn ẹ̀ka",
    ctaAbout: "Nípa iléeṣẹ́",
  },
  companyPage: {
    recentlyUpdated: "A ṣẹ̀ṣẹ̀ ṣe àtúnṣe",
    metaUpdated: "A tún ṣe",
    metaSection: "Apá",
    metaStandard: "Ìwọ̀n",
    metaCorporateGrade: "Ìpele iléeṣẹ́",
    serverWarning: "Àwọn àkóónú kan lè ṣì wà nínú àtúnṣe.",
    pageSectionsAria: "Àwọn apá ojú-ìwé",
    footerEyebrow: "Henry Onyx",
    footerTitle:
      "Ìwọ̀n iṣẹ́ kan náà tí àwọn oníbàárà wa, àwọn alábàáṣe wa, àti àwọn ẹgbẹ́ wa ní ìgbẹ́kẹ̀lé sí.",
    footerBody:
      "Gbogbo ìhà ojú-ọ̀nà Henry Onyx — nípa wa, olùbáni-sọ̀rọ̀, ìṣàkóso, ìlànà — ni a tẹ̀jáde lábẹ́ ìwọ̀n àtúnṣe kan kan ṣoṣo, kí ohun tí o kà ní gbangba bá ohun tí à ń mú ṣẹ ní ìkọ̀kọ̀ rí.",
    footerUseCase: "Ìlò",
    footerUseCaseValue: "Oníbàárà · Alábàáṣe · Ìròyìn",
    footerStandard: "Ìwọ̀n",
    footerStandardValue: "Tí ó wà létòlétò · Tí a ti fọwọ́sí",
  },
  aboutHonest: {
    eyebrow: "Nípa iléeṣẹ́ yìí",
    title: "Iléeṣẹ́ kan, ọ̀pọ̀lọpọ̀ òwò tó ní àfojúsùn, ìwọ̀n iṣẹ́ kan náà.",
    body:
      "Henry Onyx jẹ́ ẹgbẹ́ iléeṣẹ́ aláṣẹ-onírúurú-ẹ̀ka. Ẹ̀ka kọ̀ọ̀kan ń darí ọjà tirẹ̀ — Care, Marketplace, Property, Logistics, Studio, Jobs, Learn — lórí ìwọ̀n kan náà ti ìfihàn, ìfijíṣẹ́, ìṣètò owó, àti ìtẹ̀síwájú. Hub yìí wà kí àwọn oníbàárà, alábàáṣe, àti àwọn olówó kópa lè rí gbogbo iléeṣẹ́ ní ibìkan, kí wọ́n sì dé ẹ̀ka tó yẹ ní ìgbésẹ̀ kan ṣoṣo. A ń dàgbà nípa fífi àwọn ẹ̀ka tuntun kún inú ètò yìí, kì í ṣe nípa nínà àmì-iléeṣẹ́ kan ju agbára rẹ̀ lọ.",
    figureDivisionsLive: "Ẹ̀ka tó ń ṣiṣẹ́",
    figureYearEstablished: "Ọdún tí a dá iléeṣẹ́ sílẹ̀",
    figureOperatingCity: "Ìlú iṣẹ́",
    founderEyebrow: "Àkíyèsí olùdásílẹ̀",
    founderPhotoPlaceholder: "Fọ́tò",
    founderPlaceholderTitle: "Àkíyèsí olùdásílẹ̀ — àkóónú tí a ń ṣàkóso láti inú CMS",
    founderPlaceholderBody:
      "Àkíyèsí kúkúrú tí olùdásílẹ̀ fi-ọwọ́-sí yóò hàn níbí. A ti pèsè ìlànà rẹ̀ tán — ọ̀rọ̀, fọ́tò, àti ìbáwí-ọwọ́ ní wọn yóò bọ́ sí inú nígbà tí a bá ti tẹ̀ wọ́n jáde láti inú CMS iléeṣẹ́.",
    linkReachCompany: "Bá iléeṣẹ́ sọ̀rọ̀",
    linkBrowseDivisions: "Yẹ àwọn ẹ̀ka wò",
  },
  leadership: {
    roleFallback: "Àpèjúwe olórí",
    toneOwner: "Onílé",
    toneManagement: "Olùdarí",
    toneFeatured: "Àyànfẹ́",
    toneLeadership: "Olórí",
    actionContact: "Bá wa sọ̀rọ̀",
    actionCall: "Pe",
    actionLinkedin: "LinkedIn",
    actionFullProfile: "Àpèjúwe pípé",
    modalCloseAria: "Pa àpèjúwe",
    modalEyebrow: "Àpèjúwe olórí",
    modalBioFallback:
      "Àpèjúwe yìí jẹ́ apá kan ìgbìmọ̀ aṣáájú-ọnà gbangba ti Henry Onyx",
    emptyTitle: "Àlàyé olórí yóò hàn níbí",
    emptyBody:
      "Tẹ àwọn àpèjúwe olórí jáde láti inú pẹpẹ olúwa kí o lè fi ìní, ìṣàkóso, àti àwọn aṣojú igbẹ́kẹ̀lé iléeṣẹ́ hàn ní ọnà àtìnúwà fún gbangba.",
    sharedSectionDescription:
      "Àwọn àpèjúwe nínú apá yìí ń jẹ́rìí àwọn ènìyàn, ìbojútó, àti àyípadà iṣẹ́ tí ó ń gbé ẹgbẹ́ Henry Onyx dúró.",
    headerEyebrow: "Ìgbìmọ̀ olórí",
    headerTitle: "Olórí àti ìbojútó",
    headerBody:
      "Mọ àwọn ènìyàn tí ó ń ṣe ìrísí Henry Onyx — ìní, olórí gbangba, ìtọ́sọ́nà iṣẹ́, àti ojúṣe ìgbà-pípẹ́.",
    metricProfiles: "Àpèjúwe",
    metricOwnership: "Ìní",
    metricManagement: "Ìṣàkóso",
    spotlightEyebrow: "Àpèjúwe pàtàkì",
    spotlightBioFallback:
      "Àpèjúwe olórí yìí dúró fún àwọn ènìyàn tí ó ń ṣiṣẹ́ lórí ìtọ́sọ́nà, ìṣàkóso, àti iṣẹ́ tó dára gan-an ní ẹgbẹ́ Henry Onyx",
    sectionOwnershipTitle: "Ìní",
    sectionOwnershipEyebrow: "Olórí iléeṣẹ́",
    sectionManagementTitle: "Ìṣàkóso",
    sectionManagementEyebrow: "Olórí iṣẹ́ ojoojúmọ́",
    sectionFeaturedTitle: "Ẹgbẹ́ àyànfẹ́",
    sectionFeaturedEyebrow: "Aṣojú pàtàkì",
    sectionOthersTitle: "Àpèjúwe mìíràn",
    sectionOthersEyebrow: "Aṣojú iléeṣẹ́",
  },
  faqBlock: {
    eyebrow: "Àwọn ìbéèrè tí a sábà máa ń béèrè",
  },
  publicSiteShell: {
    brandFallback: "Henry Onyx",
    colCompany: "Ilé-iṣẹ́",
    linkHome: "Ilé",
    linkAbout: "Nípa wa",
    linkContact: "Kàn sí wa",
    linkSearch: "Wá",
    colHenryCo: "Henry Onyx",
    linkHenryCoAccount: "Àkọọ́lẹ̀ Henry Onyx",
    linkLanguagePrefs: "Èdè & àwọn àṣàyàn",
    linkEmailPrefs: "Àwọn àṣàyàn ímeèlì",
    colLegal: "Òfin",
    linkPrivacy: "Ìpamọ́",
    linkTerms: "Àwọn òfin",
    allRightsReserved: "Gbogbo ẹ̀tọ́ ni a tọ́jú.",
    builtBy: "A ṣe àpẹẹrẹ rẹ̀ àti kọ́ rẹ̀ nínú ilé nípa Henry Onyx Studio fún ètò Henry Onyx",
    menuDivisionsDirectory: "Àtọ́kàn àwọn ẹ̀ka",
    menuAbout: "Nípa wa",
    menuContact: "Kàn sí wa",
  },
  newsletterUnsubscribe: {
    metaTitle: "Yọ ìforúkọsílẹ̀ rẹ — Henry Onyx",
    metaDescription: "Yọ ìforúkọsílẹ̀ rẹ nínú àwọn ìròyìn Henry Onyx pẹ̀lú tẹ kan.",
    eyebrow: "Ìròyìn ìdúnnú",
    missingTitle: "Ọ̀nà ìsopọ̀ ìyọ ìforúkọsílẹ̀ kò sí.",
    missingBody:
      "Ṣí ọ̀nà ìsopọ̀ «Yọ ìforúkọsílẹ̀ rẹ» láti èbí ímeèlì Henry Onyx kan láti dé ibí pẹ̀lú àmì tí ó wulo. Tí ọ̀nà ìsopọ̀ rẹ bá ti parí, kàn sí wa àti a ó gba rẹ pẹ̀lú ọwọ́.",
    missingCtaContact: "Kàn sí àtìlẹyìn",
    missingCtaBack: "Padà sí àwọn ìròyìn",
    errorTitle: "A kò ṣe àṣeyọrí nínú ìyọ ìforúkọsílẹ̀ rẹ.",
    errorManualNote:
      "Tí èyí bá ń ṣẹlẹ̀ tún, dahùn pẹ̀lú «yọ ìforúkọsílẹ̀» sí èbí ímeèlì Henry Onyx kan àti ẹgbẹ́ wa ó ò gba rẹ pẹ̀lú ọwọ́.",
    successTitle: "A ti yọ ìforúkọsílẹ̀ rẹ.",
    successBody:
      "{{email}} kò ní gba àwọn ìròyìn Henry Onyx mọ̀. Àwọn ìránṣẹ́ ohun ìdúnàádúrà (àwọn rísítì, gbigbe, ìjẹrìísí, ààbò) ṣì máa ń ránṣẹ́ nítorí pé ó jẹ́ dandan.",
    changedMind: "Ṣé o ti yí ọkàn rẹ padà?",
    ctaSubscribeAgain: "Forúkọ sílẹ̀ lẹ́ẹ̀kan sí",
    ctaManagePrefs: "Ṣàkóso gbogbo àwọn àṣàyàn",
  },
};
const HUB_PUBLIC_COPY_HA: DeepPartial<HubPublicCopy> = {
  footer: {
    description:
      "Ƙofar kamfani mai daraja da ke haɗa rassa daban-daban, an ƙera ta domin gabatar da tsarin Henry Onyx cikin tsabta, amincewa, da kuma horon sunan kamfani na dogon lokaci.",
    columnCompany: "Kamfani",
    columnLegal: "Doka",
    home: "Babbar shafi",
    about: "Game da mu",
    contact: "Tuntube mu",
    privacyPolicy: "Manufar sirri",
    termsConditions: "Sharuɗɗa da yarjejeniyoyi",
    allRightsReserved: "Duk haƙƙoƙin an kiyaye.",
    builtBy: "An tsara shi kuma an gina shi a cikin gida ta hannun Henry Onyx Studio domin tsarin Henry Onyx",
  },
  contactHero: {
    eyebrow: "Tuntubi Henry Onyx",
    title:
      "Tattaunawa a matakin kamfani-iyaye — haɗin gwiwa, kafofin watsa labarai, masu kawo kayayyaki, masu zuba jari, da kowane abu da ya shafi babban kamfani.",
    body:
      "Don kowane lamari mai alaƙa da takamaiman reshe, za ka samu amsa cikin sauri a shafin tuntubar reshen. Yi amfani da wannan fom ɗin don tambayoyin da suka shafi kamfani gaba ɗaya.",
    bulletPartnerships:
      "Haɗin gwiwa, kasuwancin haɗin guiwa, da gabatarwa don rarrabar kayayyaki.",
    bulletPress: "Manema labarai, kafofin watsa labarai, sunan kamfani, da tambayoyin edita.",
    bulletSupplier:
      "Gabatar da masu kawo kayayyaki, tattaunawa da masu zuba jari ko masu ba da shawara, da kuma ra’ayoyin da muke son ji kai tsaye.",
    ctaDivisions: "Bincika rassa",
    ctaAbout: "Game da kamfanin",
  },
  companyPage: {
    recentlyUpdated: "An sabunta kwanan nan",
    metaUpdated: "An sabunta",
    metaSection: "Sashi",
    metaStandard: "Mizani",
    metaCorporateGrade: "Matakin kamfani",
    serverWarning: "Wasu abubuwan ciki na iya kasancewa ana sake sabunta su.",
    pageSectionsAria: "Sassan shafi",
    footerEyebrow: "Henry Onyx",
    footerTitle:
      "Mizanin aiki iri ɗaya da abokan cinikinmu, abokan haɗin gwiwa, da ƙungiyoyinmu suke dogara da shi.",
    footerBody:
      "Kowane fuska ta Henry Onyx — game da mu, tuntuɓa, shugabanci, manufa — ana buga shi a ƙarƙashin mizanin edita ɗaya, don abin da kake karanta a fili ya yi daidai da abin da muke kiyayewa a tsakaninmu.",
    footerUseCase: "Amfani",
    footerUseCaseValue: "Abokan ciniki · Abokan haɗin gwiwa · Kafofin watsa labarai",
    footerStandard: "Mizani",
    footerStandardValue: "An tsara · An tabbatar",
  },
  aboutHonest: {
    eyebrow: "Game da wannan kamfanin",
    title: "Kamfani ɗaya, kasuwanci da yawa masu mai da hankali, mizanin aiki ɗaya.",
    body:
      "Henry Onyx rukuni ne na kamfani mai rassa da yawa. Kowane reshe yana gudanar da kasuwarsa — Care, Marketplace, Property, Logistics, Studio, Jobs, Learn — a kan mizanin gabatarwa, ajiyar wuri, farashi, da bibiyar lamari iri ɗaya. Wannan hub yana wanzuwa ne don abokan ciniki, abokan haɗin gwiwa, da masu ruwa-da-tsaki su iya ganin kamfanin gaba ɗaya a wuri ɗaya, kuma su kai ga kasuwancin da ya dace cikin mataki ɗaya. Muna girma ta hanyar ƙara sabbin rassa a cikin wannan tsarin, ba ta hanyar shimfiɗa suna ɗaya bayan ƙarfinsa ba.",
    figureDivisionsLive: "Rassan da ke aiki",
    figureYearEstablished: "Shekarar kafuwa",
    figureOperatingCity: "Birnin da ake aiki",
    founderEyebrow: "Saƙon wanda ya kafa",
    founderPhotoPlaceholder: "Hoto",
    founderPlaceholderTitle: "Saƙon wanda ya kafa — ana sarrafa abun ciki ta CMS",
    founderPlaceholderBody:
      "Wani gajeren saƙo da wanda ya kafa kamfanin ya sa hannu zai bayyana a nan. An shirya tsarinsa — rubutu, hoto, da sa-hannu za su iso daga CMS ɗin kamfani da zaran an buga su.",
    linkReachCompany: "Tuntubi kamfanin",
    linkBrowseDivisions: "Bincika rassa",
  },
  leadership: {
    roleFallback: "Bayanin shugabanci",
    toneOwner: "Mai kamfani",
    toneManagement: "Gudanarwa",
    toneFeatured: "An zaɓa",
    toneLeadership: "Shugabanci",
    actionContact: "Tuntuɓa",
    actionCall: "Kira",
    actionLinkedin: "LinkedIn",
    actionFullProfile: "Cikakken bayani",
    modalCloseAria: "Rufe bayani",
    modalEyebrow: "Bayanin shugabanci",
    modalBioFallback:
      "Wannan bayanin yana cikin allon shugabancin Henry Onyx da aka bayyana a fili.",
    emptyTitle: "Bayanin shugabanci zai bayyana a nan",
    emptyBody:
      "Buga bayanan shugabanci daga dashbod na mai kamfani don gabatar da mallaka, gudanarwa, da amintattun wakilan kamfani a cikin tsari mai kyau ga jama’a.",
    sharedSectionDescription:
      "Bayanan da ke wannan sashin suna nuna mutanen, kulawa, da nauyin aiki da ke goyon bayan rukunin Henry Onyx",
    headerEyebrow: "Allon shugabanci",
    headerTitle: "Shugabanci da kulawa",
    headerBody:
      "Ka san mutanen da ke siffanta Henry Onyx — mallaka, shugabanci na fili, jagorancin aiki, da alhakin dogon lokaci.",
    metricProfiles: "Bayanai",
    metricOwnership: "Mallaka",
    metricManagement: "Gudanarwa",
    spotlightEyebrow: "Bayani na musamman",
    spotlightBioFallback:
      "Wannan bayanin shugabanci yana wakiltar mutanen da suke da alhakin shiriya, mulki, da aiki mai inganci a rukunin Henry Onyx",
    sectionOwnershipTitle: "Mallaka",
    sectionOwnershipEyebrow: "Shugabancin kamfani",
    sectionManagementTitle: "Gudanarwa",
    sectionManagementEyebrow: "Shugabancin aiki",
    sectionFeaturedTitle: "Ƙungiyar da aka zaɓa",
    sectionFeaturedEyebrow: "Manyan wakilai",
    sectionOthersTitle: "Ƙarin bayanai",
    sectionOthersEyebrow: "Wakilcin kamfani",
  },
  faqBlock: {
    eyebrow: "Tambayoyin da ake yawan yi",
  },
  publicSiteShell: {
    brandFallback: "Henry Onyx",
    colCompany: "Kamfani",
    linkHome: "Gida",
    linkAbout: "Game da mu",
    linkContact: "Tuntuɓi mu",
    linkSearch: "Bincika",
    colHenryCo: "Henry Onyx",
    linkHenryCoAccount: "Asusun Henry Onyx",
    linkLanguagePrefs: "Harshe & zaɓuɓɓuka",
    linkEmailPrefs: "Zaɓuɓɓukan imel",
    colLegal: "Doka",
    linkPrivacy: "Sirri",
    linkTerms: "Sharuɗɗa",
    allRightsReserved: "An kiyaye dukkan haƙƙoƙi.",
    builtBy: "An tsara kuma an gina shi ciki gida ta Henry Onyx Studio don tsarin Henry Onyx",
    menuDivisionsDirectory: "Jerin sassan",
    menuAbout: "Game da mu",
    menuContact: "Tuntuɓi mu",
  },
  newsletterUnsubscribe: {
    metaTitle: "Soke rajista — Henry Onyx",
    metaDescription: "Soke rajista daga sanarwar Henry Onyx da danna ɗaya.",
    eyebrow: "Sanarwa",
    missingTitle: "Hanyar soke rajista ta ɓace.",
    missingBody:
      "Bude hanyar «Soke rajista» daga kowanne imel na Henry Onyx don isa nan da ingantaccen alama. Idan hanyar ka ta ƙare, tuntuɓi mu kuma za mu yarda da ita a hannu.",
    missingCtaContact: "Tuntuɓi tallafi",
    missingCtaBack: "Koma sanarwa",
    errorTitle: "Ba mu iya soke rajistarka ba.",
    errorManualNote:
      "Idan hakan ya ci gaba, amsa «soke rajista» zuwa kowanne imel na Henry Onyx kuma ƙungiyarmu za ta yarda a hannu.",
    successTitle: "An soke rajistarka.",
    successBody:
      "{{email}} ba za ta karɓi sanarwar Henry Onyx ba. Saƙonni na ma'amala (rasa, jigilar kaya, tabbatarwa, tsaro) suna ci gaba da aika saboda dole ne.",
    changedMind: "Ka canza ra'ayinka?",
    ctaSubscribeAgain: "Yi rajista sake",
    ctaManagePrefs: "Sarrafa duk zaɓuɓɓuka",
  },
};

const HUB_PUBLIC_LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<HubPublicCopy>>> = {
  fr: HUB_PUBLIC_COPY_FR,
  es: HUB_PUBLIC_COPY_ES,
  pt: HUB_PUBLIC_COPY_PT,
  ar: HUB_PUBLIC_COPY_AR,
  de: HUB_PUBLIC_COPY_DE,
  it: HUB_PUBLIC_COPY_IT,
  zh: HUB_PUBLIC_COPY_ZH,
  hi: HUB_PUBLIC_COPY_HI,
  ig: HUB_PUBLIC_COPY_IG,
  yo: HUB_PUBLIC_COPY_YO,
  ha: HUB_PUBLIC_COPY_HA,
};

export function getHubPublicCopy(locale: AppLocale): HubPublicCopy {
  const overrides = HUB_PUBLIC_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      HUB_PUBLIC_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as HubPublicCopy;
  }
  return HUB_PUBLIC_COPY_EN;
}

/** @internal */
export function __dangerouslyGetEnglishHubPublicCopy(): HubPublicCopy {
  return HUB_PUBLIC_COPY_EN;
}
