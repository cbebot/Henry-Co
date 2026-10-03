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
      primaryCta: string;
      earnLink: string;
      tryLink: string;
      shippedLink: string;
      divisionsTitle: string;
      seeLive: string;
      /** One honest line per division, keyed by DivisionKey. */
      divisionBodies: Record<string, string>;
    };
    earn: {
      metaTitle: string;
      metaDescription: string;
      eyebrow: string;
      title: string;
      lede: string;
      rowsTitle: string;
      liveTag: string;
      earlyTag: string;
      rows: { division: string; mechanism: string; exchange: string; live: boolean }[];
    };
    shipped: {
      metaTitle: string;
      metaDescription: string;
      eyebrow: string;
      title: string;
      seeLive: string;
      /** Per-division capability items, keyed by DivisionKey. */
      divisions: Record<string, { items: string[] }>;
    };
    journey: {
      metaTitle: string;
      metaDescription: string;
      eyebrow: string;
      title: string;
      lede: string;
      steps: { title: string; body: string; linkLabel: string; division: string }[];
    };
    press: {
      metaTitle: string;
      metaDescription: string;
      eyebrow: string;
      title: string;
      boilerplateTitle: string;
      boilerplate: string;
      factsTitle: string;
      factLabels: { legalName: string; rc: string; founded: string; hq: string; founder: string; contact: string };
      marksTitle: string;
      marksLede: string;
      download: string;
      markLabels: { monogram: string; wordmarkFull: string; wordmarkCompact: string };
      usageTitle: string;
      usageRules: string[];
      contactTitle: string;
      contactBody: string;
    };
    announcement: {
      metaTitle: string;
      metaDescription: string;
      eyebrow: string;
      title: string;
      lede: string;
      paragraphs: string[];
      ctaStory: string;
      ctaTry: string;
      signoffRole: string;
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
    title: "Newsletters, chosen carefully",
    intro: "Choose your topics — change or unsubscribe any time.",
    promiseTitle: "What we promise",
    promises: [
      "Only topics you opted into.",
      "A working unsubscribe link in every email.",
    ],
    form: {
      emailLabel: "Email address",
      emailPlaceholder: "you@example.com",
      countryLabel: "Country (2-letter, optional)",
      countryPlaceholder: "NG",
      topicsTitle: "Topics",
      consent:
        "I agree to receive these newsletters from Henry Onyx. I can unsubscribe any time, and sends are paused during active support or billing issues.",
      submit: "Subscribe",
      submitting: "Subscribing…",
      successCreatedTitle: "You're subscribed",
      successUpdatedTitle: "Preferences updated",
      successBody: "We'll email {email} about: {topics}.",
      managePrefs: "Manage preferences any time:",
      openPreferenceCenter: "open preference center",
      errorSuppressed: "We couldn't complete your subscription for this address. If this looks wrong, contact support.",
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
    title: "Group-level conversations",
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
    title: "One company, several focused businesses.",
    body: "Each division — Logistics, Fabric Care, Property, Marketplace, Studio, Jobs, and Learn — runs an independent market.",
    figureDivisionsLive: "Divisions live",
    figureYearEstablished: "Year established",
    figureOperatingCity: "Operating city",
    founderEyebrow: "Founder note",
    founderPhotoPlaceholder: "Photo",
    founderPlaceholderTitle: "A note from the founder",
    founderPlaceholderBody: "Coming soon.",
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
      "Leadership profiles for Henry Onyx will appear here.",
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
      "Open the “Unsubscribe” link from any Henry Onyx email. If your link has expired, contact us and we’ll honor it manually.",
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
        "One account and one wallet across seven Henry Onyx divisions: fabric care, marketplace, jobs, learn, logistics, studio and property.",
      eyebrow: "The ecosystem",
      title: "One account. One wallet. Seven live divisions.",
      primaryCta: "Browse the ecosystem",
      earnLink: "How we earn — in plain language",
      tryLink: "Try the journey",
      shippedLink: "What's live",
      divisionsTitle: "The divisions",
      seeLive: "See it live",
      divisionBodies: {
        care: "Home and fabric care.",
        marketplace: "Shop approved sellers, with every order tracked.",
        jobs: "Apply, interview, and get hired.",
        learn: "Courses with free previews and certificates.",
        logistics: "Shipments quoted up front and tracked end to end.",
        studio: "Commission creative work with a shared client workspace.",
        property: "Find and inquire about reviewed property listings.",
      },
    },
    earn: {
      metaTitle: "How we earn — {brand}",
      metaDescription:
        "How Henry Onyx makes money, division by division, and what you get in exchange.",
      eyebrow: "The earning map",
      title: "How Henry Onyx earns",
      lede: "For buyers, delivery and any fee appear as named lines before you pay.",
      rowsTitle: "Division by division",
      liveTag: "Live today",
      earlyTag: "Not charged yet",
      rows: [
        {
          division: "marketplace",
          mechanism: "A commission on completed orders.",
          exchange: "Approved sellers, protection on card and wallet payments, order tracking, and a dispute process.",
          live: true,
        },
        {
          division: "care",
          mechanism: "Package and service pricing; no separate platform fee today.",
          exchange: "Every charge is shown before you submit a booking; garment totals are confirmed at intake.",
          live: true,
        },
        {
          division: "learn",
          mechanism: "Instructor terms are agreed case by case after approval.",
          exchange: "Free previews before you pay, and shareable certificates.",
          live: true,
        },
        {
          division: "studio",
          mechanism: "A project fee on commissioned creative work.",
          exchange: "A shared workspace. A deposit to start, then milestone payments as work is delivered.",
          live: true,
        },
        {
          division: "jobs",
          mechanism: "Candidates never pay to apply. Employer plans are not charged yet.",
          exchange: "Real conversations with employers, application status you can see, interview scheduling.",
          live: false,
        },
        {
          division: "logistics",
          mechanism: "A margin on each shipment.",
          exchange: "Up-front quotes and end-to-end tracking.",
          live: true,
        },
        {
          division: "property",
          mechanism: "Listing and management tools for owners and managers.",
          exchange: "Reviewed property listings.",
          live: false,
        },
      ],
    },
    shipped: {
      metaTitle: "What's live — {brand}",
      metaDescription: "What each Henry Onyx division does today, with a link to each one.",
      eyebrow: "The inventory",
      title: "What's live, division by division",
      seeLive: "See it live",
      divisions: {
        care: {
          items: [
            "Browse services and book online",
            "See your estimate before you book",
            "Track your booking",
          ],
        },
        marketplace: {
          items: [
            "Shop approved sellers with clear product pages",
            "Cart, checkout, and order tracking",
            "Buyer-seller messaging",
          ],
        },
        jobs: {
          items: [
            "Browse and apply with a profile on file",
            "Candidate-employer conversations",
            "Application status you can see",
          ],
        },
        learn: {
          items: [
            "Free previews before any payment",
            "Enroll, learn, and track progress",
            "Certificates you can share",
          ],
        },
        logistics: {
          items: [
            "Get a shipment quote before you commit",
            "Book and track deliveries end to end",
          ],
        },
        studio: {
          items: [
            "Request creative work with a clear brief",
            "A client workspace with milestones and messaging",
            "Bank transfer or card, milestone by milestone",
          ],
        },
        property: {
          items: [
            "Browse property listings",
            "Save listings and send inquiries",
          ],
        },
      },
    },
    journey: {
      metaTitle: "Try the journey — {brand}",
      metaDescription:
        "A five-minute walk through the live Henry Onyx ecosystem. No account needed to start.",
      eyebrow: "Try it",
      title: "Walk the ecosystem in five minutes",
      lede: "Every step below opens the live product. Start with nothing — no account, no email.",
      steps: [
        {
          title: "Browse without signing in",
          body: "Open Fabric Care and browse its services.",
          linkLabel: "Open Fabric Care",
          division: "care",
        },
        {
          title: "See a real price",
          body: "The booking form shows your estimate before you submit.",
          linkLabel: "Browse services",
          division: "care",
        },
        {
          title: "Cross a division",
          body: "Same account, same wallet: shop approved sellers on the marketplace.",
          linkLabel: "Open the marketplace",
          division: "marketplace",
        },
        {
          title: "Check the jobs board",
          body: "Browse live roles and apply.",
          linkLabel: "Browse jobs",
          division: "jobs",
        },
        {
          title: "Preview a course free",
          body: "The preview is free — you pay only when you choose to enroll.",
          linkLabel: "Open Learn",
          division: "learn",
        },
        {
          title: "Create your one account",
          body: "One sign-up works across every division.",
          linkLabel: "Create your account",
          division: "account",
        },
      ],
    },
    press: {
      metaTitle: "Press kit — {brand}",
      metaDescription:
        "Brand marks, company facts, and boilerplate for writing about Henry Onyx. Registered facts only — sourced from the company record.",
      eyebrow: "Press",
      title: "Writing about Henry Onyx",
      boilerplateTitle: "Boilerplate",
      boilerplate:
        "Henry Onyx is one connected economy: fabric care, marketplace, jobs, learning, logistics, creative studio, and property on a single account and wallet. It is operated by Henry Onyx Limited, a private company registered in Nigeria.",
      factsTitle: "Company facts",
      factLabels: {
        legalName: "Legal entity",
        rc: "RC number",
        founded: "Founded",
        hq: "Headquarters",
        founder: "Founder",
        contact: "Press contact",
      },
      marksTitle: "Brand marks",
      marksLede: "The monogram and wordmarks below are the only approved marks.",
      download: "Download SVG",
      markLabels: {
        monogram: "Monogram",
        wordmarkFull: "Wordmark",
        wordmarkCompact: "Compact wordmark",
      },
      usageTitle: "Usage",
      usageRules: [
        "Don't recolor, stretch, outline, or add effects to the marks.",
        "Write the brand as Henry Onyx; the legal entity is Henry Onyx Limited.",
        "Screenshots of the live product may be used with attribution.",
        "Don't imply endorsement or partnership without a written agreement.",
      ],
      contactTitle: "Talk to us",
      contactBody: "For interviews, fact-checking, or assets not on this page, write to us.",
    },
    announcement: {
      metaTitle: "Announcing V3 — {brand}",
      metaDescription: "Henry Onyx V3: one account and one wallet across seven live divisions.",
      eyebrow: "From the founder",
      title: "V3 is live",
      lede:
        "The version of Henry Onyx we set out to build: one connected economy you can walk through in five minutes.",
      paragraphs: [
        "V3 is not a redesign. It is the point where the divisions stop being separate products and start being one economy — one identity that signs in everywhere, and one wallet.",
        "We published what's live, how we earn, and a journey you can take without an account.",
      ],
      ctaStory: "Read the V3 story",
      ctaTry: "Walk the journey",
      signoffRole: "Founder, Henry Onyx",
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
    figureDivisionsLive: "Divisions actives",
    figureYearEstablished: "Année de création",
    figureOperatingCity: "Ville d’exploitation",
    founderEyebrow: "Note du fondateur",
    founderPhotoPlaceholder: "Photo",
    founderPlaceholderTitle: "Une note du fondateur",
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
      "Les profils de direction de Henry Onyx apparaîtront ici.",
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
      eyebrow: "L'écosystème",
      title: "Un compte. Un portefeuille. Sept divisions en service.",
      primaryCta: "Parcourir l'écosystème",
      earnLink: "Comment nous gagnons de l'argent — en clair",
      tryLink: "Essayer le parcours",
      shippedLink: "Ce qui est en ligne",
      divisionsTitle: "Les divisions",
      seeLive: "Voir en direct",
      divisionBodies: {
        logistics: "Des expéditions au tarif annoncé d'avance et suivies de bout en bout.",
        studio: "Commandez un travail créatif avec un espace client partagé.",
      },
    },
    earn: {
      metaTitle: "Comment nous gagnons de l'argent — {brand}",
      eyebrow: "La carte des revenus",
      title: "Comment Henry Onyx gagne de l'argent",
      rowsTitle: "Division par division",
      liveTag: "Actif aujourd'hui",
    },
    shipped: {
      metaTitle: "Ce qui est en ligne — {brand}",
      eyebrow: "L'inventaire",
      title: "Ce qui est en ligne, division par division",
      seeLive: "Voir en ligne",
      divisions: {
        learn: {
          items: [
            "Aperçus gratuits avant tout paiement",
            "Inscrivez-vous, apprenez et suivez votre progression",
            "Des certificats que vous pouvez partager",
          ],
        },
        logistics: {
          items: [
            "Obtenez un devis d'expédition avant de vous engager",
            "Réservez et suivez vos livraisons de bout en bout",
          ],
        },
      },
    },
    journey: {
      metaTitle: "Essayez le parcours — {brand}",
      eyebrow: "Essayez",
      title: "Traversez l'écosystème en cinq minutes",
    },
    press: {
      metaTitle: "Kit presse — {brand}",
      metaDescription:
        "Marques graphiques, faits sur l'entreprise et texte de référence pour écrire sur Henry Onyx. Uniquement des faits enregistrés — issus du registre officiel de l'entreprise.",
      eyebrow: "Presse",
      title: "Écrire sur Henry Onyx",
      boilerplateTitle: "Texte de référence",
      factsTitle: "Faits sur l'entreprise",
      factLabels: {
        legalName: "Entité juridique",
        rc: "Numéro RC",
        founded: "Fondation",
        hq: "Siège social",
        founder: "Fondateur",
        contact: "Contact presse",
      },
      marksTitle: "Marques graphiques",
      download: "Télécharger le SVG",
      markLabels: {
        monogram: "Monogramme",
        wordmarkFull: "Logotype",
        wordmarkCompact: "Logotype compact",
      },
      usageTitle: "Utilisation",
      usageRules: [
        "Ne recolorez pas, n'étirez pas, ne détourez pas les marques et n'y ajoutez aucun effet.",
        "Écrivez la marque Henry Onyx ; l'entité juridique est Henry Onyx Limited.",
        "Les captures d'écran du produit en ligne peuvent être utilisées avec attribution.",
        "Ne suggérez aucun soutien ni partenariat sans accord écrit.",
      ],
      contactTitle: "Parlez-nous",
    },
    announcement: {
      metaTitle: "Annonce de la V3 — {brand}",
      eyebrow: "Un mot du fondateur",
      title: "La V3 est en ligne",
      ctaStory: "Lire l'histoire de la V3",
      ctaTry: "Suivre le parcours",
      signoffRole: "Fondateur, Henry Onyx",
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
    figureDivisionsLive: "Divisiones activas",
    figureYearEstablished: "Año de fundación",
    figureOperatingCity: "Ciudad de operación",
    founderEyebrow: "Nota del fundador",
    founderPhotoPlaceholder: "Foto",
    founderPlaceholderTitle: "Una nota del fundador",
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
      "Aquí aparecerán los perfiles de liderazgo de Henry Onyx.",
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
      eyebrow: "El ecosistema",
      title: "Una cuenta. Una billetera. Siete divisiones en funcionamiento.",
      primaryCta: "Explorar el ecosistema",
      earnLink: "Cómo ganamos dinero — explicado con claridad",
      tryLink: "Probar el recorrido",
      shippedLink: "Qué está activo",
      divisionsTitle: "Las divisiones",
      seeLive: "Verlo en funcionamiento",
      divisionBodies: {
        logistics: "Envíos con precio cotizado por adelantado y rastreo de principio a fin.",
        studio: "Encarga trabajo creativo con un espacio compartido con el cliente.",
      },
    },
    earn: {
      metaTitle: "Cómo ganamos dinero — {brand}",
      eyebrow: "El mapa de ingresos",
      title: "Cómo gana dinero Henry Onyx",
      rowsTitle: "División por división",
      liveTag: "Activo hoy",
    },
    shipped: {
      metaTitle: "Qué está en producción — {brand}",
      eyebrow: "El inventario",
      title: "Qué está en producción, división por división",
      seeLive: "Verlo en vivo",
      divisions: {
        learn: {
          items: [
            "Vistas previas gratuitas antes de cualquier pago",
            "Inscríbete, aprende y sigue tu progreso",
            "Certificados que puedes compartir",
          ],
        },
        logistics: {
          items: [
            "Obtén una cotización de envío antes de comprometerte",
            "Reserva y sigue tus entregas de principio a fin",
          ],
        },
      },
    },
    journey: {
      metaTitle: "Prueba el recorrido — {brand}",
      eyebrow: "Pruébalo",
      title: "Recorre el ecosistema en cinco minutos",
    },
    press: {
      metaTitle: "Kit de prensa — {brand}",
      metaDescription:
        "Marcas gráficas, datos de la empresa y texto estándar para escribir sobre Henry Onyx. Solo hechos registrados — tomados del registro de la empresa.",
      eyebrow: "Prensa",
      title: "Escribir sobre Henry Onyx",
      boilerplateTitle: "Texto estándar",
      factsTitle: "Datos de la empresa",
      factLabels: {
        legalName: "Entidad legal",
        rc: "Número RC",
        founded: "Fundación",
        hq: "Sede",
        founder: "Fundador",
        contact: "Contacto de prensa",
      },
      marksTitle: "Marcas gráficas",
      download: "Descargar SVG",
      markLabels: {
        monogram: "Monograma",
        wordmarkFull: "Logotipo",
        wordmarkCompact: "Logotipo compacto",
      },
      usageTitle: "Uso",
      usageRules: [
        "No recoloree, estire, contornee ni añada efectos a las marcas.",
        "Escriba la marca como Henry Onyx; la entidad legal es Henry Onyx Limited.",
        "Las capturas de pantalla del producto en vivo pueden usarse con atribución.",
        "No sugiera respaldo ni asociación sin un acuerdo por escrito.",
      ],
      contactTitle: "Hable con nosotros",
    },
    announcement: {
      metaTitle: "Presentamos V3 — {brand}",
      eyebrow: "Del fundador",
      title: "V3 está en vivo",
      ctaStory: "Leer la historia de V3",
      ctaTry: "Recorrer el trayecto",
      signoffRole: "Fundador, Henry Onyx",
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
    figureDivisionsLive: "Divisões activas",
    figureYearEstablished: "Ano de fundação",
    figureOperatingCity: "Cidade de operação",
    founderEyebrow: "Nota do fundador",
    founderPhotoPlaceholder: "Foto",
    founderPlaceholderTitle: "Uma nota do fundador",
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
      "Os perfis de liderança da Henry Onyx aparecerão aqui.",
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
      eyebrow: "O ecossistema",
      title: "Uma conta. Uma carteira. Sete divisões no ar.",
      primaryCta: "Explorar o ecossistema",
      earnLink: "Como ganhamos — em linguagem simples",
      tryLink: "Experimentar o percurso",
      shippedLink: "O que está no ar",
      divisionsTitle: "As divisões",
      seeLive: "Ver ao vivo",
      divisionBodies: {
        logistics: "Envios com cotação antecipada e rastreamento de ponta a ponta.",
        studio: "Encomende trabalho criativo em um espaço compartilhado com o cliente.",
      },
    },
    earn: {
      metaTitle: "Como ganhamos — {brand}",
      eyebrow: "O mapa da receita",
      title: "Como a Henry Onyx ganha",
      rowsTitle: "Divisão por divisão",
      liveTag: "No ar hoje",
    },
    shipped: {
      metaTitle: "O que está no ar — {brand}",
      eyebrow: "O inventário",
      title: "O que está no ar, divisão a divisão",
      seeLive: "Ver ao vivo",
      divisions: {
        learn: {
          items: [
            "Pré-visualizações gratuitas antes de qualquer pagamento",
            "Inscreva-se, aprenda e acompanhe o progresso",
            "Certificados que pode partilhar",
          ],
        },
        logistics: {
          items: [
            "Obtenha uma cotação de envio antes de se comprometer",
            "Reserve e acompanhe entregas de ponta a ponta",
          ],
        },
      },
    },
    journey: {
      metaTitle: "Experimente o percurso — {brand}",
      eyebrow: "Experimente",
      title: "Percorra o ecossistema em cinco minutos",
    },
    press: {
      metaTitle: "Kit de imprensa — {brand}",
      metaDescription:
        "Marcas gráficas, factos da empresa e texto institucional para escrever sobre a Henry Onyx. Apenas factos registados — extraídos do registo da empresa.",
      eyebrow: "Imprensa",
      title: "Escrever sobre a Henry Onyx",
      boilerplateTitle: "Texto institucional",
      factsTitle: "Factos da empresa",
      factLabels: {
        legalName: "Entidade legal",
        rc: "Número RC",
        founded: "Fundação",
        hq: "Sede",
        founder: "Fundador",
        contact: "Contacto de imprensa",
      },
      marksTitle: "Marcas gráficas",
      download: "Descarregar SVG",
      markLabels: {
        monogram: "Monograma",
        wordmarkFull: "Logótipo",
        wordmarkCompact: "Logótipo compacto",
      },
      usageTitle: "Utilização",
      usageRules: [
        "Não recolorir, esticar, contornar nem aplicar efeitos às marcas.",
        "Escreva a marca como Henry Onyx; a entidade legal é Henry Onyx Limited.",
        "Capturas de ecrã do produto em produção podem ser usadas com atribuição.",
        "Não sugira aval ou parceria sem um acordo escrito.",
      ],
      contactTitle: "Fale connosco",
    },
    announcement: {
      metaTitle: "Anúncio da V3 — {brand}",
      eyebrow: "Do fundador",
      title: "A V3 está no ar",
      ctaStory: "Ler a história da V3",
      ctaTry: "Percorrer o trajeto",
      signoffRole: "Fundador, Henry Onyx",
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
    figureDivisionsLive: "الأقسام النشطة",
    figureYearEstablished: "سنة التأسيس",
    figureOperatingCity: "مدينة التشغيل",
    founderEyebrow: "كلمة المؤسس",
    founderPhotoPlaceholder: "صورة",
    founderPlaceholderTitle: "كلمة من المؤسس",
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
      "ستظهر هنا ملفات قيادة Henry Onyx.",
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
      eyebrow: "المنظومة",
      title: "حساب واحد. محفظة واحدة. سبعة أقسام تعمل فعليًا.",
      primaryCta: "تصفّح المنظومة",
      earnLink: "كيف نكسب — بلغة واضحة",
      tryLink: "جرّب الرحلة",
      shippedLink: "ما هو متاح الآن",
      divisionsTitle: "الأقسام",
      seeLive: "شاهده مباشرة",
      divisionBodies: {
        logistics: "شحنات بأسعار معلنة مسبقًا وتتبّع من البداية إلى النهاية.",
        studio: "كلّف بأعمال إبداعية ضمن مساحة عمل مشتركة مع العميل.",
      },
    },
    earn: {
      metaTitle: "كيف نكسب — {brand}",
      eyebrow: "خريطة الكسب",
      title: "كيف يكسب Henry Onyx",
      rowsTitle: "قسمًا بعد قسم",
      liveTag: "يعمل اليوم",
    },
    shipped: {
      metaTitle: "ما هو متاح الآن — {brand}",
      eyebrow: "الجرد",
      title: "ما هو متاح الآن، شعبة بشعبة",
      seeLive: "شاهده مباشرة",
      divisions: {
        learn: {
          items: [
            "معاينات مجانية قبل أي دفع",
            "سجل وتعلم وتابع تقدمك",
            "شهادات يمكنك مشاركتها",
          ],
        },
        logistics: {
          items: [
            "احصل على عرض سعر للشحنة قبل أن تلتزم",
            "احجز وتتبع التوصيل من البداية إلى النهاية",
          ],
        },
      },
    },
    journey: {
      metaTitle: "جرب الرحلة — {brand}",
      eyebrow: "جربها",
      title: "اقطع المنظومة في خمس دقائق",
    },
    press: {
      metaTitle: "الملف الصحفي — {brand}",
      metaDescription:
        "علامات الهوية البصرية، وحقائق الشركة، والنبذة التعريفية للكتابة عن Henry Onyx. حقائق مسجَّلة فقط — مأخوذة من السجل الرسمي للشركة.",
      eyebrow: "الصحافة",
      title: "الكتابة عن Henry Onyx",
      boilerplateTitle: "النبذة التعريفية",
      factsTitle: "حقائق الشركة",
      factLabels: {
        legalName: "الكيان القانوني",
        rc: "رقم التسجيل RC",
        founded: "سنة التأسيس",
        hq: "المقر الرئيسي",
        founder: "المؤسس",
        contact: "جهة التواصل الصحفي",
      },
      marksTitle: "علامات الهوية البصرية",
      download: "تنزيل SVG",
      markLabels: {
        monogram: "الشعار الأحادي",
        wordmarkFull: "علامة الاسم",
        wordmarkCompact: "علامة الاسم المدمجة",
      },
      usageTitle: "قواعد الاستخدام",
      usageRules: [
        "لا تُعِد تلوين العلامات أو تمددها أو تحدد إطارها أو تضيف إليها مؤثرات.",
        "اكتب اسم العلامة Henry Onyx؛ أما الكيان القانوني فهو Henry Onyx Limited.",
        "يجوز استخدام لقطات شاشة من المنتج المباشر مع ذكر المصدر.",
        "لا تُوحِ بوجود تأييد أو شراكة دون اتفاق مكتوب.",
      ],
      contactTitle: "تحدث إلينا",
    },
    announcement: {
      metaTitle: "الإعلان عن الإصدار الثالث V3 — {brand}",
      eyebrow: "من المؤسس",
      title: "الإصدار الثالث متاح الآن",
      ctaStory: "اقرأ قصة الإصدار الثالث",
      ctaTry: "خض الرحلة",
      signoffRole: "المؤسس، Henry Onyx",
    },
  },
};
const HUB_PUBLIC_COPY_DE: DeepPartial<HubPublicCopy> = {
  footer: {
    description:
      "Ein hochwertiges Konzern-Portal über mehrere Divisionen hinweg, das das Henry-Onyx-Ökosystem mit Klarheit, Vertrauen und langfristiger Markendisziplin präsentiert.",
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
    figureDivisionsLive: "Aktive Divisionen",
    figureYearEstablished: "Gründungsjahr",
    figureOperatingCity: "Geschäftssitz",
    founderEyebrow: "Gründernotiz",
    founderPhotoPlaceholder: "Foto",
    founderPlaceholderTitle: "Eine Notiz des Gründers",
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
      "Führungsprofile für Henry Onyx erscheinen hier.",
    sharedSectionDescription:
      "Die Profile in diesem Bereich verkörpern die Menschen, die Verantwortung und die operative Sorgfalt hinter der Henry-Onyx-Gruppe.",
    headerEyebrow: "Führungsgremium",
    headerTitle: "Führung und Verantwortung",
    headerBody:
      "Lernen Sie die Menschen kennen, die Henry Onyx prägen — von Eigentum über öffentliche Führung und operative Ausrichtung bis hin zur langfristigen Verantwortung.",
    metricProfiles: "Profile",
    metricOwnership: "Eigentum",
    metricManagement: "Geschäftsleitung",
    spotlightEyebrow: "Profil im Fokus",
    spotlightBioFallback:
      "Dieses Führungsprofil steht für die Personen, die in der Henry-Onyx-Gruppe für Ausrichtung, Governance und hochwertige Umsetzung verantwortlich sind.",
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
      eyebrow: "Das Ökosystem",
      title: "Ein Konto. Ein Wallet. Sieben Divisionen im Live-Betrieb.",
      primaryCta: "Das Ökosystem entdecken",
      earnLink: "Wie wir verdienen — in klaren Worten",
      tryLink: "Den Rundgang ausprobieren",
      shippedLink: "Was heute live ist",
      divisionsTitle: "Die Divisionen",
      seeLive: "Live ansehen",
      divisionBodies: {
        logistics: "Sendungen mit Preisangabe im Voraus und lückenloser Verfolgung.",
        studio: "Kreativarbeit beauftragen — mit einem gemeinsamen Arbeitsbereich für Kunden.",
      },
    },
    earn: {
      metaTitle: "Wie wir verdienen — {brand}",
      eyebrow: "Die Verdienstkarte",
      title: "Wie Henry Onyx verdient",
      rowsTitle: "Division für Division",
      liveTag: "Heute aktiv",
    },
    shipped: {
      metaTitle: "Was live ist — {brand}",
      eyebrow: "Das Inventar",
      title: "Was live ist, Division für Division",
      seeLive: "Live ansehen",
      divisions: {
        learn: {
          items: [
            "Kostenlose Vorschauen vor jeder Zahlung",
            "Einschreiben, lernen und Fortschritt verfolgen",
            "Zertifikate, die Sie teilen können",
          ],
        },
        logistics: {
          items: [
            "Ein Versandangebot erhalten, bevor Sie sich festlegen",
            "Lieferungen buchen und lückenlos verfolgen",
          ],
        },
      },
    },
    journey: {
      metaTitle: "Den Weg ausprobieren — {brand}",
      eyebrow: "Ausprobieren",
      title: "Das Ökosystem in fünf Minuten durchlaufen",
    },
    press: {
      metaTitle: "Pressematerial — {brand}",
      metaDescription:
        "Markenzeichen, Unternehmensdaten und Boilerplate für Berichte über Henry Onyx. Ausschließlich eingetragene Fakten — direkt aus dem Unternehmensregister.",
      eyebrow: "Presse",
      title: "Über Henry Onyx schreiben",
      boilerplateTitle: "Boilerplate",
      factsTitle: "Unternehmensdaten",
      factLabels: {
        legalName: "Juristische Person",
        rc: "RC-Nummer",
        founded: "Gegründet",
        hq: "Hauptsitz",
        founder: "Gründer",
        contact: "Pressekontakt",
      },
      marksTitle: "Markenzeichen",
      download: "SVG herunterladen",
      markLabels: {
        monogram: "Monogramm",
        wordmarkFull: "Wortmarke",
        wordmarkCompact: "Kompakte Wortmarke",
      },
      usageTitle: "Verwendung",
      usageRules: [
        "Die Zeichen nicht umfärben, verzerren, konturieren oder mit Effekten versehen.",
        "Die Marke heißt Henry Onyx; die juristische Person ist Henry Onyx Limited.",
        "Screenshots des Live-Produkts dürfen mit Quellenangabe verwendet werden.",
        "Ohne schriftliche Vereinbarung keine Empfehlung oder Partnerschaft andeuten.",
      ],
      contactTitle: "Sprechen Sie mit uns",
    },
    announcement: {
      metaTitle: "V3 ist da — {brand}",
      eyebrow: "Vom Gründer",
      title: "V3 ist live",
      ctaStory: "Die V3-Geschichte lesen",
      ctaTry: "Den Rundgang machen",
      signoffRole: "Gründer, Henry Onyx",
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
    figureDivisionsLive: "Divisioni attive",
    figureYearEstablished: "Anno di fondazione",
    figureOperatingCity: "Città operativa",
    founderEyebrow: "Nota del fondatore",
    founderPhotoPlaceholder: "Foto",
    founderPlaceholderTitle: "Una nota del fondatore",
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
      "I profili di leadership di Henry Onyx appariranno qui.",
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
      eyebrow: "L'ecosistema",
      title: "Un account. Un portafoglio. Sette divisioni attive.",
      primaryCta: "Esplora l'ecosistema",
      earnLink: "Come guadagniamo — in parole semplici",
      tryLink: "Prova il percorso",
      shippedLink: "Cosa è attivo",
      divisionsTitle: "Le divisioni",
      seeLive: "Vedilo dal vivo",
      divisionBodies: {
        logistics: "Spedizioni con preventivo anticipato e tracciamento da un capo all'altro.",
        studio: "Commissiona lavori creativi in uno spazio di lavoro condiviso con il cliente.",
      },
    },
    earn: {
      metaTitle: "Come guadagniamo — {brand}",
      eyebrow: "La mappa dei ricavi",
      title: "Come guadagna Henry Onyx",
      rowsTitle: "Divisione per divisione",
      liveTag: "Attivo oggi",
    },
    shipped: {
      metaTitle: "Cosa è attivo — {brand}",
      eyebrow: "L'inventario",
      title: "Cosa è attivo, divisione per divisione",
      seeLive: "Vedilo dal vivo",
      divisions: {
        learn: {
          items: [
            "Anteprime gratuite prima di qualsiasi pagamento",
            "Iscriviti, impara e segui i tuoi progressi",
            "Certificati che puoi condividere",
          ],
        },
        logistics: {
          items: [
            "Ottieni un preventivo di spedizione prima dell'impegno",
            "Prenota e traccia le consegne dall'inizio alla fine",
          ],
        },
      },
    },
    journey: {
      metaTitle: "Prova il percorso — {brand}",
      eyebrow: "Provalo",
      title: "Percorri l'ecosistema in cinque minuti",
    },
    press: {
      metaTitle: "Kit stampa — {brand}",
      metaDescription:
        "Marchi, dati aziendali e testo standard per scrivere di Henry Onyx. Solo fatti registrati — tratti dal registro della società.",
      eyebrow: "Stampa",
      title: "Scrivere di Henry Onyx",
      boilerplateTitle: "Testo standard",
      factsTitle: "Dati aziendali",
      factLabels: {
        legalName: "Ragione sociale",
        rc: "Numero RC",
        founded: "Fondazione",
        hq: "Sede centrale",
        founder: "Fondatore",
        contact: "Contatto stampa",
      },
      marksTitle: "Marchi",
      download: "Scarica SVG",
      markLabels: {
        monogram: "Monogramma",
        wordmarkFull: "Logotipo",
        wordmarkCompact: "Logotipo compatto",
      },
      usageTitle: "Utilizzo",
      usageRules: [
        "Non ricolorare, deformare, contornare o aggiungere effetti ai marchi.",
        "Scrivi il brand come Henry Onyx; la ragione sociale è Henry Onyx Limited.",
        "Le schermate del prodotto live possono essere usate con attribuzione.",
        "Non suggerire endorsement o partnership senza un accordo scritto.",
      ],
      contactTitle: "Parla con noi",
    },
    announcement: {
      metaTitle: "Presentiamo V3 — {brand}",
      eyebrow: "Dal fondatore",
      title: "V3 è online",
      ctaStory: "Leggi la storia di V3",
      ctaTry: "Percorri il viaggio",
      signoffRole: "Fondatore, Henry Onyx",
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
    figureDivisionsLive: "在线业务板块",
    figureYearEstablished: "成立年份",
    figureOperatingCity: "运营所在地",
    founderEyebrow: "创始人寄语",
    founderPhotoPlaceholder: "照片",
    founderPlaceholderTitle: "创始人寄语",
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
      "Henry Onyx 的领导团队介绍将在此显示。",
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
      eyebrow: "生态全景",
      title: "一个账户。一个钱包。七个已上线的业务板块。",
      primaryCta: "浏览整个生态",
      earnLink: "我们如何盈利——直白说明",
      tryLink: "试走这段旅程",
      shippedLink: "现已上线",
      divisionsTitle: "业务板块",
      seeLive: "查看实况",
      divisionBodies: {
        logistics: "运费提前报价，运输全程可追踪。",
        studio: "委托创意项目，客户与团队共享同一个工作空间。",
      },
    },
    earn: {
      metaTitle: "我们如何盈利 — {brand}",
      eyebrow: "盈利地图",
      title: "Henry Onyx 如何盈利",
      rowsTitle: "逐个板块说明",
      liveTag: "已在收取",
    },
    shipped: {
      metaTitle: "当前已上线 — {brand}",
      eyebrow: "能力清单",
      title: "各事业部当前已上线的能力",
      seeLive: "查看真实页面",
      divisions: {
        learn: {
          items: [
            "付费前可免费试看",
            "报名、学习并跟踪进度",
            "可对外分享的证书",
          ],
        },
        logistics: {
          items: [
            "下单前先获取运费报价",
            "预约配送并全程跟踪",
          ],
        },
      },
    },
    journey: {
      metaTitle: "亲自走一遍 — {brand}",
      eyebrow: "亲自体验",
      title: "五分钟走遍整个生态",
    },
    press: {
      metaTitle: "媒体资料 — {brand}",
      metaDescription:
        "关于报道 Henry Onyx 的品牌标识、公司信息与标准介绍文。仅含注册在案的事实——均来自公司登记记录。",
      eyebrow: "媒体",
      title: "报道 Henry Onyx",
      boilerplateTitle: "标准介绍文",
      factsTitle: "公司信息",
      factLabels: {
        legalName: "法定实体",
        rc: "RC 注册号",
        founded: "成立时间",
        hq: "总部",
        founder: "创始人",
        contact: "媒体联系",
      },
      marksTitle: "品牌标识",
      download: "下载 SVG",
      markLabels: {
        monogram: "字母标",
        wordmarkFull: "文字标",
        wordmarkCompact: "紧凑文字标",
      },
      usageTitle: "使用规范",
      usageRules: [
        "不得为标识改色、拉伸、描边或添加效果。",
        "品牌名写作 Henry Onyx；法定实体为 Henry Onyx Limited。",
        "线上产品的截图可在注明来源后使用。",
        "未经书面协议，不得暗示背书或合作关系。",
      ],
      contactTitle: "联系我们",
    },
    announcement: {
      metaTitle: "V3 发布 — {brand}",
      eyebrow: "创始人来信",
      title: "V3 已上线",
      ctaStory: "阅读 V3 的故事",
      ctaTry: "亲自走一遍",
      signoffRole: "创始人，Henry Onyx",
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
    figureDivisionsLive: "सक्रिय डिवीज़न",
    figureYearEstablished: "स्थापना वर्ष",
    figureOperatingCity: "संचालन का शहर",
    founderEyebrow: "संस्थापक की टिप्पणी",
    founderPhotoPlaceholder: "फ़ोटो",
    founderPlaceholderTitle: "संस्थापक की ओर से एक टिप्पणी",
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
      "Henry Onyx के नेतृत्व परिचय यहाँ दिखाई देंगे।",
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
    figureDivisionsLive: "Ngalaba na-arụ ọrụ",
    figureYearEstablished: "Afọ a malitere ya",
    figureOperatingCity: "Obodo a na-arụ ọrụ",
    founderEyebrow: "Okwu onye guzobere ya",
    founderPhotoPlaceholder: "Foto",
    founderPlaceholderTitle: "A note from the founder",
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
      "Leadership profiles for Henry Onyx will appear here.",
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
    figureDivisionsLive: "Ẹ̀ka tó ń ṣiṣẹ́",
    figureYearEstablished: "Ọdún tí a dá iléeṣẹ́ sílẹ̀",
    figureOperatingCity: "Ìlú iṣẹ́",
    founderEyebrow: "Àkíyèsí olùdásílẹ̀",
    founderPhotoPlaceholder: "Fọ́tò",
    founderPlaceholderTitle: "A note from the founder",
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
      "Leadership profiles for Henry Onyx will appear here.",
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
    figureDivisionsLive: "Rassan da ke aiki",
    figureYearEstablished: "Shekarar kafuwa",
    figureOperatingCity: "Birnin da ake aiki",
    founderEyebrow: "Saƙon wanda ya kafa",
    founderPhotoPlaceholder: "Hoto",
    founderPlaceholderTitle: "A note from the founder",
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
      "Leadership profiles for Henry Onyx will appear here.",
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
