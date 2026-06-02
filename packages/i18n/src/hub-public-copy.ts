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
};

const HUB_PUBLIC_COPY_EN: HubPublicCopy = {
  search: {
    title: "Search Henry & Co.",
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
        "I agree to receive these newsletters from Henry & Co. I can unsubscribe any time, and sends are paused during active support or billing issues.",
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
      "A premium multi-division corporate gateway designed to present the Henry & Co. ecosystem with clarity, trust, and long-term brand discipline.",
    columnCompany: "Company",
    columnLegal: "Legal",
    home: "Home",
    about: "About",
    contact: "Contact",
    privacyPolicy: "Privacy policy",
    termsConditions: "Terms & conditions",
    allRightsReserved: "All rights reserved.",
    builtBy: "Designed and built in-house by Henry & Co. Studio for the Henry & Co. ecosystem",
  },
  contactHero: {
    eyebrow: "Contact Henry & Co.",
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
    footerEyebrow: "Henry & Co.",
    footerTitle:
      "The same operating standard our customers, partners, and teams trust.",
    footerBody:
      "Every Henry & Co. company surface — about, contact, governance, policy — ships under one editorial standard so what you read in public matches what we hold ourselves to in private.",
    footerUseCase: "Use case",
    footerUseCaseValue: "Customers · Partners · Media",
    footerStandard: "Standard",
    footerStandardValue: "Structured · Verified",
  },
  aboutHonest: {
    eyebrow: "About this company",
    title: "One company, several focused businesses, one operating standard.",
    body:
      "Henry & Co. is a multi-division operating group. Each division runs its own market — Care, Marketplace, Property, Logistics, Studio, Jobs, Learn — on the same standard of presentation, booking, pricing, and follow-through. The hub exists so customers, partners, and stakeholders can see the whole company in one place and reach the right business in one step. We grow by adding divisions inside this framework, not by stretching one brand thin.",
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
      "This profile is part of the Henry & Co. public leadership board.",
    emptyTitle: "Leadership information will appear here",
    emptyBody:
      "Publish leadership profiles from the owner dashboard to present ownership, management, and trusted company representatives in a polished public format.",
    sharedSectionDescription:
      "Profiles in this section reinforce the people, stewardship, and operational accountability behind Henry & Co.",
    headerEyebrow: "Leadership board",
    headerTitle: "Leadership and stewardship",
    headerBody:
      "Meet the people shaping Henry & Co. across ownership, public leadership, operational direction, and long-term accountability.",
    metricProfiles: "Profiles",
    metricOwnership: "Ownership",
    metricManagement: "Management",
    spotlightEyebrow: "Spotlight profile",
    spotlightBioFallback:
      "This leadership profile reflects the individuals responsible for direction, governance, and premium execution across Henry & Co.",
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
    brandFallback: "Henry & Co.",
    colCompany: "Company",
    linkHome: "Home",
    linkAbout: "About",
    linkContact: "Contact",
    linkSearch: "Search",
    colHenryCo: "Henry & Co.",
    linkHenryCoAccount: "Henry & Co. account",
    linkLanguagePrefs: "Language & preferences",
    linkEmailPrefs: "Email preferences",
    colLegal: "Legal",
    linkPrivacy: "Privacy",
    linkTerms: "Terms",
    allRightsReserved: "All rights reserved.",
    builtBy: "Designed and built in-house by Henry & Co. Studio for the Henry & Co. ecosystem",
    menuDivisionsDirectory: "Divisions directory",
    menuAbout: "About",
    menuContact: "Contact",
  },
  newsletterUnsubscribe: {
    metaTitle: "Unsubscribe — Henry & Co.",
    metaDescription: "One-click unsubscribe from Henry & Co. newsletters.",
    eyebrow: "Newsletter",
    missingTitle: "Unsubscribe link missing.",
    missingBody:
      "Open the “Unsubscribe” link from any Henry & Co. email to land here with a valid token. If your link has expired, contact us and we’ll honor it manually.",
    missingCtaContact: "Contact support",
    missingCtaBack: "Back to newsletters",
    errorTitle: "We couldn’t unsubscribe you.",
    errorManualNote:
      "If this keeps happening, reply “unsubscribe” to any Henry & Co. email and our team will honor it manually.",
    successTitle: "You’re unsubscribed.",
    successBody:
      "{{email}} won’t receive Henry & Co. newsletters. Transactional messages (receipts, shipping, verification, security) still send because we have to.",
    changedMind: "Changed your mind?",
    ctaSubscribeAgain: "Subscribe again",
    ctaManagePrefs: "Manage all preferences",
  },
};

const HUB_PUBLIC_COPY_FR: DeepPartial<HubPublicCopy> = {
  footer: {
    description:
      "Une passerelle corporate multi-divisions premium, conçue pour présenter l’écosystème Henry & Co. avec clarté, confiance et une discipline de marque de long terme.",
    columnCompany: "Entreprise",
    columnLegal: "Mentions légales",
    home: "Accueil",
    about: "À propos",
    contact: "Contact",
    privacyPolicy: "Politique de confidentialité",
    termsConditions: "Conditions générales",
    allRightsReserved: "Tous droits réservés.",
    builtBy: "Conçu et développé en interne par Henry & Co. Studio pour l’écosystème Henry & Co.",
  },
  contactHero: {
    eyebrow: "Contacter Henry & Co.",
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
    footerEyebrow: "Henry & Co.",
    footerTitle:
      "Le même standard opérationnel auquel se fient nos clients, partenaires et équipes.",
    footerBody:
      "Chaque surface corporate Henry & Co. — à propos, contact, gouvernance, politique — est publiée selon un seul standard éditorial : ce que vous lisez en public reflète ce que nous tenons en privé.",
    footerUseCase: "Cas d’usage",
    footerUseCaseValue: "Clients · Partenaires · Médias",
    footerStandard: "Standard",
    footerStandardValue: "Structuré · Vérifié",
  },
  aboutHonest: {
    eyebrow: "À propos de cette entreprise",
    title: "Une entreprise, plusieurs activités ciblées, un seul standard opérationnel.",
    body:
      "Henry & Co. est un groupe opérationnel multi-divisions. Chaque division pilote son propre marché — Care, Marketplace, Property, Logistics, Studio, Jobs, Learn — avec le même niveau d’exigence en matière de présentation, de réservation, de tarification et de suivi. Le hub existe pour que clients, partenaires et parties prenantes voient l’entreprise dans son ensemble et rejoignent la bonne activité en une étape. Nous grandissons en ajoutant des divisions dans ce cadre, sans étirer une marque unique.",
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
      "Ce profil fait partie du conseil de direction public de Henry & Co.",
    emptyTitle: "Les informations de direction apparaîtront ici",
    emptyBody:
      "Publiez des profils de direction depuis le tableau de bord propriétaire pour présenter l’actionnariat, la direction et les représentants de confiance de l’entreprise dans un format public soigné.",
    sharedSectionDescription:
      "Les profils de cette section incarnent les personnes, la gouvernance et la responsabilité opérationnelle qui portent le groupe Henry & Co.",
    headerEyebrow: "Conseil de direction",
    headerTitle: "Direction et gouvernance",
    headerBody:
      "Découvrez les personnes qui façonnent Henry & Co. — actionnariat, leadership public, direction opérationnelle et responsabilité de long terme.",
    metricProfiles: "Profils",
    metricOwnership: "Actionnariat",
    metricManagement: "Direction",
    spotlightEyebrow: "Profil en lumière",
    spotlightBioFallback:
      "Ce profil de direction représente les personnes responsables de l’orientation, de la gouvernance et de l’exécution premium au sein du groupe Henry & Co.",
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
    brandFallback: "Henry & Co.",
    colCompany: "Entreprise",
    linkHome: "Accueil",
    linkAbout: "À propos",
    linkContact: "Contact",
    linkSearch: "Rechercher",
    colHenryCo: "Henry & Co.",
    linkHenryCoAccount: "Compte Henry & Co.",
    linkLanguagePrefs: "Langue et préférences",
    linkEmailPrefs: "Préférences e-mail",
    colLegal: "Mentions légales",
    linkPrivacy: "Confidentialité",
    linkTerms: "Conditions",
    allRightsReserved: "Tous droits réservés.",
    builtBy: "Conçu et développé en interne par Henry & Co. Studio pour l'écosystème Henry & Co.",
    menuDivisionsDirectory: "Annuaire des divisions",
    menuAbout: "À propos",
    menuContact: "Contact",
  },
  newsletterUnsubscribe: {
    metaTitle: "Se désabonner — Henry & Co.",
    metaDescription: "Désabonnement en un clic des newsletters Henry & Co..",
    eyebrow: "Newsletter",
    missingTitle: "Lien de désabonnement manquant.",
    missingBody:
      "Ouvrez le lien « Se désabonner » d'un e-mail Henry & Co. pour arriver ici avec un jeton valide. Si votre lien a expiré, contactez-nous et nous l'honorerons manuellement.",
    missingCtaContact: "Contacter l'assistance",
    missingCtaBack: "Retour aux newsletters",
    errorTitle: "Nous n'avons pas pu vous désabonner.",
    errorManualNote:
      "Si cela continue, répondez « désabonner » à n'importe quel e-mail Henry & Co. et notre équipe l'honorera manuellement.",
    successTitle: "Vous êtes désabonné(e).",
    successBody:
      "{{email}} ne recevra plus les newsletters Henry & Co.. Les messages transactionnels (reçus, livraison, vérification, sécurité) continuent d'être envoyés car nous y sommes tenus.",
    changedMind: "Vous avez changé d'avis ?",
    ctaSubscribeAgain: "Se réabonner",
    ctaManagePrefs: "Gérer toutes les préférences",
  },
};
const HUB_PUBLIC_COPY_ES: DeepPartial<HubPublicCopy> = {
  footer: {
    description:
      "Una puerta de entrada corporativa multidivisión premium, concebida para presentar el ecosistema Henry & Co. con claridad, confianza y una disciplina de marca a largo plazo.",
    columnCompany: "Empresa",
    columnLegal: "Aviso legal",
    home: "Inicio",
    about: "Acerca de",
    contact: "Contacto",
    privacyPolicy: "Política de privacidad",
    termsConditions: "Términos y condiciones",
    allRightsReserved: "Todos los derechos reservados.",
    builtBy: "Diseñado y construido internamente por Henry & Co. Studio para el ecosistema Henry & Co.",
  },
  contactHero: {
    eyebrow: "Contactar con Henry & Co.",
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
    footerEyebrow: "Henry & Co.",
    footerTitle:
      "El mismo estándar operativo en el que confían nuestros clientes, socios y equipos.",
    footerBody:
      "Cada superficie corporativa de Henry & Co. — acerca de, contacto, gobierno, política — se publica bajo un único estándar editorial, para que lo que se lee en público coincida con lo que mantenemos en privado.",
    footerUseCase: "Caso de uso",
    footerUseCaseValue: "Clientes · Socios · Medios",
    footerStandard: "Estándar",
    footerStandardValue: "Estructurado · Verificado",
  },
  aboutHonest: {
    eyebrow: "Sobre esta empresa",
    title: "Una empresa, varios negocios enfocados, un único estándar operativo.",
    body:
      "Henry & Co. es un grupo operativo multidivisión. Cada división opera su propio mercado — Care, Marketplace, Property, Logistics, Studio, Jobs, Learn — bajo el mismo estándar de presentación, reservas, precios y seguimiento. El hub existe para que clientes, socios y grupos de interés vean la empresa en su conjunto y lleguen al negocio adecuado en un solo paso. Crecemos añadiendo divisiones dentro de este marco, no estirando una sola marca.",
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
      "Este perfil forma parte del consejo público de liderazgo de Henry & Co.",
    emptyTitle: "Aquí aparecerá la información de liderazgo",
    emptyBody:
      "Publique perfiles de liderazgo desde el panel del propietario para presentar la propiedad, la dirección y los representantes de confianza de la empresa en un formato público cuidado.",
    sharedSectionDescription:
      "Los perfiles de esta sección reflejan las personas, la administración y la responsabilidad operativa que sostienen al grupo Henry & Co.",
    headerEyebrow: "Consejo de liderazgo",
    headerTitle: "Liderazgo y gobierno",
    headerBody:
      "Conozca a las personas que dan forma a Henry & Co. en propiedad, liderazgo público, dirección operativa y responsabilidad a largo plazo.",
    metricProfiles: "Perfiles",
    metricOwnership: "Propiedad",
    metricManagement: "Dirección",
    spotlightEyebrow: "Perfil en foco",
    spotlightBioFallback:
      "Este perfil de liderazgo representa a las personas responsables de la dirección, el gobierno y la ejecución premium en el grupo Henry & Co.",
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
    brandFallback: "Henry & Co.",
    colCompany: "Empresa",
    linkHome: "Inicio",
    linkAbout: "Acerca de",
    linkContact: "Contacto",
    linkSearch: "Buscar",
    colHenryCo: "Henry & Co.",
    linkHenryCoAccount: "Cuenta Henry & Co.",
    linkLanguagePrefs: "Idioma y preferencias",
    linkEmailPrefs: "Preferencias de correo",
    colLegal: "Aviso legal",
    linkPrivacy: "Privacidad",
    linkTerms: "Condiciones",
    allRightsReserved: "Todos los derechos reservados.",
    builtBy: "Diseñado y construido internamente por Henry & Co. Studio para el ecosistema Henry & Co.",
    menuDivisionsDirectory: "Directorio de divisiones",
    menuAbout: "Acerca de",
    menuContact: "Contacto",
  },
  newsletterUnsubscribe: {
    metaTitle: "Cancelar suscripción — Henry & Co.",
    metaDescription: "Cancela tu suscripción a los boletines de Henry & Co. con un clic.",
    eyebrow: "Boletín",
    missingTitle: "Enlace de cancelación no encontrado.",
    missingBody:
      "Abre el enlace «Cancelar suscripción» de cualquier correo de Henry & Co. para llegar aquí con un token válido. Si tu enlace ha caducado, contáctanos y lo gestionaremos manualmente.",
    missingCtaContact: "Contactar con soporte",
    missingCtaBack: "Volver a los boletines",
    errorTitle: "No hemos podido cancelar tu suscripción.",
    errorManualNote:
      "Si el problema persiste, responde «cancelar suscripción» a cualquier correo de Henry & Co. y nuestro equipo lo gestionará manualmente.",
    successTitle: "Ya estás dado de baja.",
    successBody:
      "{{email}} no recibirá más boletines de Henry & Co.. Los mensajes transaccionales (recibos, envíos, verificación, seguridad) seguirán enviándose porque estamos obligados a ello.",
    changedMind: "¿Has cambiado de opinión?",
    ctaSubscribeAgain: "Suscribirse de nuevo",
    ctaManagePrefs: "Gestionar todas las preferencias",
  },
};
const HUB_PUBLIC_COPY_PT: DeepPartial<HubPublicCopy> = {
  footer: {
    description:
      "Um portal corporativo multidivisional premium, concebido para apresentar o ecossistema Henry & Co. com clareza, confiança e disciplina de marca a longo prazo.",
    columnCompany: "Empresa",
    columnLegal: "Jurídico",
    home: "Início",
    about: "Sobre",
    contact: "Contacto",
    privacyPolicy: "Política de privacidade",
    termsConditions: "Termos e condições",
    allRightsReserved: "Todos os direitos reservados.",
    builtBy: "Concebido e desenvolvido internamente pelo Henry & Co. Studio para o ecossistema Henry & Co.",
  },
  contactHero: {
    eyebrow: "Contactar a Henry & Co.",
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
    footerEyebrow: "Henry & Co.",
    footerTitle:
      "O mesmo padrão operacional em que confiam os nossos clientes, parceiros e equipas.",
    footerBody:
      "Cada superfície corporativa da Henry & Co. — sobre, contacto, governança, política — é publicada sob um único padrão editorial, para que o que se lê em público corresponda ao que mantemos em privado.",
    footerUseCase: "Caso de utilização",
    footerUseCaseValue: "Clientes · Parceiros · Media",
    footerStandard: "Padrão",
    footerStandardValue: "Estruturado · Verificado",
  },
  aboutHonest: {
    eyebrow: "Sobre esta empresa",
    title: "Uma empresa, vários negócios focados, um único padrão operacional.",
    body:
      "A Henry & Co. é um grupo operacional multidivisional. Cada divisão dirige o seu próprio mercado — Care, Marketplace, Property, Logistics, Studio, Jobs, Learn — sob o mesmo padrão de apresentação, reservas, preços e acompanhamento. O hub existe para que clientes, parceiros e partes interessadas vejam a empresa no seu conjunto e cheguem ao negócio certo num só passo. Crescemos acrescentando divisões dentro desta estrutura, e não esticando uma única marca.",
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
      "Este perfil faz parte do conselho público de liderança da Henry & Co.",
    emptyTitle: "Aqui aparecerão as informações de liderança",
    emptyBody:
      "Publique perfis de liderança a partir do painel do proprietário para apresentar a propriedade, a gestão e os representantes de confiança da empresa num formato público cuidado.",
    sharedSectionDescription:
      "Os perfis desta secção representam as pessoas, a administração e a responsabilidade operacional que sustentam o grupo Henry & Co.",
    headerEyebrow: "Conselho de liderança",
    headerTitle: "Liderança e governança",
    headerBody:
      "Conheça as pessoas que moldam a Henry & Co. — propriedade, liderança pública, direcção operacional e responsabilidade de longo prazo.",
    metricProfiles: "Perfis",
    metricOwnership: "Propriedade",
    metricManagement: "Gestão",
    spotlightEyebrow: "Perfil em destaque",
    spotlightBioFallback:
      "Este perfil de liderança reflecte as pessoas responsáveis pela direcção, governança e execução premium no grupo Henry & Co.",
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
    brandFallback: "Henry & Co.",
    colCompany: "Empresa",
    linkHome: "Início",
    linkAbout: "Sobre",
    linkContact: "Contacto",
    linkSearch: "Pesquisar",
    colHenryCo: "Henry & Co.",
    linkHenryCoAccount: "Conta Henry & Co.",
    linkLanguagePrefs: "Idioma e preferências",
    linkEmailPrefs: "Preferências de e-mail",
    colLegal: "Jurídico",
    linkPrivacy: "Privacidade",
    linkTerms: "Termos",
    allRightsReserved: "Todos os direitos reservados.",
    builtBy: "Projetado e desenvolvido internamente pela Henry & Co. Studio para o ecossistema Henry & Co.",
    menuDivisionsDirectory: "Diretório de divisões",
    menuAbout: "Sobre",
    menuContact: "Contacto",
  },
  newsletterUnsubscribe: {
    metaTitle: "Cancelar subscrição — Henry & Co.",
    metaDescription: "Cancelamento de subscrição das newsletters Henry & Co. com um clique.",
    eyebrow: "Newsletter",
    missingTitle: "Ligação de cancelamento em falta.",
    missingBody:
      "Abra a ligação «Cancelar subscrição» de qualquer e-mail Henry & Co. para chegar aqui com um token válido. Se a sua ligação expirou, contacte-nos e iremos processá-lo manualmente.",
    missingCtaContact: "Contactar suporte",
    missingCtaBack: "Voltar às newsletters",
    errorTitle: "Não foi possível cancelar a sua subscrição.",
    errorManualNote:
      "Se isto continuar, responda «cancelar subscrição» a qualquer e-mail Henry & Co. e a nossa equipa irá processá-lo manualmente.",
    successTitle: "Subscrição cancelada.",
    successBody:
      "{{email}} não receberá mais newsletters Henry & Co.. As mensagens transacionais (recibos, envio, verificação, segurança) continuam a ser enviadas porque somos obrigados a isso.",
    changedMind: "Mudou de ideias?",
    ctaSubscribeAgain: "Subscrever novamente",
    ctaManagePrefs: "Gerir todas as preferências",
  },
};
const HUB_PUBLIC_COPY_AR: DeepPartial<HubPublicCopy> = {
  footer: {
    description:
      "بوّابة مؤسسية متعددة الأقسام بمستوى راقٍ، صُمّمت لتقديم منظومة Henry & Co. بوضوح وثقة وانضباط راسخ في هوية العلامة على المدى الطويل.",
    columnCompany: "الشركة",
    columnLegal: "الجوانب القانونية",
    home: "الرئيسية",
    about: "من نحن",
    contact: "اتصل بنا",
    privacyPolicy: "سياسة الخصوصية",
    termsConditions: "الشروط والأحكام",
    allRightsReserved: "جميع الحقوق محفوظة.",
    builtBy: "صُمِّمت وطُوِّرت داخليًا في Henry & Co. Studio لخدمة منظومة Henry & Co.",
  },
  contactHero: {
    eyebrow: "تواصل مع Henry & Co.",
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
    footerEyebrow: "Henry & Co.",
    footerTitle:
      "نفس معيار التشغيل الذي يثق به عملاؤنا وشركاؤنا وفِرَقنا.",
    footerBody:
      "كل واجهة مؤسسية لـ Henry & Co. — نبذة، تواصل، حوكمة، سياسات — تُنشر وفق معيار تحريري واحد، فيكون ما تقرأه علنًا مطابقًا لما نلتزم به بيننا.",
    footerUseCase: "حالة الاستخدام",
    footerUseCaseValue: "العملاء · الشركاء · الإعلام",
    footerStandard: "المعيار",
    footerStandardValue: "منظَّم · موثَّق",
  },
  aboutHonest: {
    eyebrow: "نبذة عن هذه الشركة",
    title: "شركة واحدة، عدة أنشطة مركّزة، ومعيار تشغيل موحَّد.",
    body:
      "Henry & Co. مجموعة تشغيلية متعددة الأقسام. كل قسم يدير سوقه الخاص — Care وMarketplace وProperty وLogistics وStudio وJobs وLearn — على المعيار ذاته من حيث العرض والحجز والتسعير والمتابعة. وُجد هذا المركز ليرى العملاء والشركاء وأصحاب المصلحة الشركة كلها في مكان واحد، ويصلوا إلى النشاط المناسب في خطوة واحدة. ننمو بإضافة أقسام جديدة داخل هذا الإطار، لا بمدّ علامة واحدة فوق طاقتها.",
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
      "هذا الملف جزء من مجلس القيادة العام لـ Henry & Co.",
    emptyTitle: "ستظهر هنا معلومات القيادة",
    emptyBody:
      "انشر ملفات القيادة من لوحة المالك لتقديم الملكية والإدارة وممثلي الشركة الموثوقين في صورة عامة متقَنة.",
    sharedSectionDescription:
      "تُجسّد ملفات هذا القسم الأشخاصَ والمسؤوليةَ التشغيليةَ والإشرافَ القائم خلف مجموعة Henry & Co.",
    headerEyebrow: "مجلس القيادة",
    headerTitle: "القيادة والإشراف",
    headerBody:
      "تعرَّف على من يُشكِّلون Henry & Co. في الملكية والقيادة العامة والتوجيه التشغيلي والمسؤولية على المدى الطويل.",
    metricProfiles: "الملفات",
    metricOwnership: "الملكية",
    metricManagement: "الإدارة",
    spotlightEyebrow: "ملف الضوء",
    spotlightBioFallback:
      "يعكس هذا الملف القيادي الأشخاصَ المسؤولين عن التوجه والحوكمة وجودة التنفيذ في مجموعة Henry & Co.",
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
    brandFallback: "Henry & Co.",
    colCompany: "الشركة",
    linkHome: "الرئيسية",
    linkAbout: "من نحن",
    linkContact: "اتصل بنا",
    linkSearch: "بحث",
    colHenryCo: "هنري كو",
    linkHenryCoAccount: "حساب Henry & Co.",
    linkLanguagePrefs: "اللغة والتفضيلات",
    linkEmailPrefs: "تفضيلات البريد الإلكتروني",
    colLegal: "القانوني",
    linkPrivacy: "الخصوصية",
    linkTerms: "الشروط",
    allRightsReserved: "جميع الحقوق محفوظة.",
    builtBy: "صُمِّم وطُوِّر داخلياً بواسطة Henry & Co. Studio لمنظومة Henry & Co.",
    menuDivisionsDirectory: "دليل الأقسام",
    menuAbout: "من نحن",
    menuContact: "اتصل بنا",
  },
  newsletterUnsubscribe: {
    metaTitle: "إلغاء الاشتراك — Henry & Co.",
    metaDescription: "إلغاء اشتراك بنقرة واحدة من نشرات Henry & Co. الإخبارية.",
    eyebrow: "النشرة البريدية",
    missingTitle: "رابط إلغاء الاشتراك مفقود.",
    missingBody:
      "افتح رابط «إلغاء الاشتراك» من أي بريد إلكتروني من Henry & Co. للوصول هنا برمز تحقق صالح. إذا انتهت صلاحية رابطك، تواصل معنا وسنتعامل مع الطلب يدوياً.",
    missingCtaContact: "التواصل مع الدعم",
    missingCtaBack: "العودة إلى النشرات",
    errorTitle: "لم نتمكن من إلغاء اشتراكك.",
    errorManualNote:
      "إذا استمر هذا، أرسل رداً بكلمة «إلغاء الاشتراك» على أي بريد من Henry & Co. وسيتولى فريقنا الأمر يدوياً.",
    successTitle: "تم إلغاء اشتراكك.",
    successBody:
      "لن يتلقى {{email}} نشرات Henry & Co. الإخبارية. تستمر الرسائل التعاملية (الإيصالات، الشحن، التحقق، الأمان) في الإرسال لأننا ملزمون بذلك.",
    changedMind: "هل غيّرت رأيك؟",
    ctaSubscribeAgain: "الاشتراك مجدداً",
    ctaManagePrefs: "إدارة كل التفضيلات",
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
    builtBy: "Konzipiert und intern entwickelt vom Henry & Co. Studio für das Henry & Co.-Ökosystem",
  },
  contactHero: {
    eyebrow: "Henry & Co. kontaktieren",
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
    footerEyebrow: "Henry & Co.",
    footerTitle:
      "Derselbe operative Standard, dem unsere Kunden, Partner und Teams vertrauen.",
    footerBody:
      "Jede Konzernfläche von Henry & Co. — Über uns, Kontakt, Governance, Richtlinien — folgt einem einheitlichen redaktionellen Standard, sodass das, was Sie öffentlich lesen, dem entspricht, woran wir uns intern halten.",
    footerUseCase: "Anwendungsfall",
    footerUseCaseValue: "Kunden · Partner · Medien",
    footerStandard: "Standard",
    footerStandardValue: "Strukturiert · Verifiziert",
  },
  aboutHonest: {
    eyebrow: "Über dieses Unternehmen",
    title: "Ein Unternehmen, mehrere fokussierte Geschäftsbereiche, ein einheitlicher operativer Standard.",
    body:
      "Henry & Co. ist eine operative Gruppe mit mehreren Divisionen. Jede Division betreibt ihren eigenen Markt — Care, Marketplace, Property, Logistics, Studio, Jobs, Learn — auf demselben Niveau in Präsentation, Buchung, Preisgestaltung und Nachverfolgung. Das Hub existiert, damit Kunden, Partner und Stakeholder das gesamte Unternehmen an einem Ort sehen und das richtige Geschäft in einem Schritt erreichen. Wir wachsen, indem wir Divisionen innerhalb dieses Rahmens hinzufügen — nicht, indem wir eine einzelne Marke überdehnen.",
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
      "Dieses Profil gehört zum öffentlichen Führungsgremium von Henry & Co.",
    emptyTitle: "Hier erscheinen Informationen zur Führung",
    emptyBody:
      "Veröffentlichen Sie Führungsprofile über das Eigentümer-Dashboard, um Eigentum, Geschäftsleitung und vertrauenswürdige Unternehmensvertreter in einem klaren öffentlichen Format darzustellen.",
    sharedSectionDescription:
      "Die Profile in diesem Bereich verkörpern die Menschen, die Verantwortung und die operative Sorgfalt hinter der Henry-&-Co.-Gruppe.",
    headerEyebrow: "Führungsgremium",
    headerTitle: "Führung und Verantwortung",
    headerBody:
      "Lernen Sie die Menschen kennen, die Henry & Co. prägen — von Eigentum über öffentliche Führung und operative Ausrichtung bis hin zur langfristigen Verantwortung.",
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
    brandFallback: "Henry & Co.",
    colCompany: "Unternehmen",
    linkHome: "Startseite",
    linkAbout: "Über uns",
    linkContact: "Kontakt",
    linkSearch: "Suche",
    colHenryCo: "Henry & Co.",
    linkHenryCoAccount: "Henry & Co.-Konto",
    linkLanguagePrefs: "Sprache & Einstellungen",
    linkEmailPrefs: "E-Mail-Einstellungen",
    colLegal: "Rechtliches",
    linkPrivacy: "Datenschutz",
    linkTerms: "Nutzungsbedingungen",
    allRightsReserved: "Alle Rechte vorbehalten.",
    builtBy: "Intern entworfen und entwickelt von Henry & Co. Studio für das Henry & Co.-Ökosystem",
    menuDivisionsDirectory: "Abteilungsverzeichnis",
    menuAbout: "Über uns",
    menuContact: "Kontakt",
  },
  newsletterUnsubscribe: {
    metaTitle: "Abmelden — Henry & Co.",
    metaDescription: "Mit einem Klick von Henry & Co.-Newslettern abmelden.",
    eyebrow: "Newsletter",
    missingTitle: "Abmeldelink fehlt.",
    missingBody:
      "Öffnen Sie den Link „Abmelden“ aus einer Henry & Co.-E-Mail, um mit einem gültigen Token hierher zu gelangen. Falls Ihr Link abgelaufen ist, kontaktieren Sie uns und wir bearbeiten die Abmeldung manuell.",
    missingCtaContact: "Support kontaktieren",
    missingCtaBack: "Zurück zu den Newslettern",
    errorTitle: "Wir konnten Sie nicht abmelden.",
    errorManualNote:
      "Wenn das Problem weiterhin besteht, antworten Sie auf eine Henry & Co.-E-Mail mit „abmelden“ und unser Team bearbeitet dies manuell.",
    successTitle: "Sie sind abgemeldet.",
    successBody:
      "{{email}} erhält keine Henry & Co.-Newsletter mehr. Transaktionsnachrichten (Quittungen, Versand, Verifizierung, Sicherheit) werden weiterhin gesendet, weil wir dazu verpflichtet sind.",
    changedMind: "Haben Sie Ihre Meinung geändert?",
    ctaSubscribeAgain: "Erneut abonnieren",
    ctaManagePrefs: "Alle Einstellungen verwalten",
  },
};
const HUB_PUBLIC_COPY_IT: DeepPartial<HubPublicCopy> = {
  footer: {
    description:
      "Un portale corporate multi-divisione di livello premium, concepito per presentare l’ecosistema Henry & Co. con chiarezza, fiducia e una disciplina di marca a lungo termine.",
    columnCompany: "Azienda",
    columnLegal: "Note legali",
    home: "Home",
    about: "Chi siamo",
    contact: "Contatti",
    privacyPolicy: "Informativa sulla privacy",
    termsConditions: "Termini e condizioni",
    allRightsReserved: "Tutti i diritti riservati.",
    builtBy: "Progettato e realizzato internamente da Henry & Co. Studio per l’ecosistema Henry & Co.",
  },
  contactHero: {
    eyebrow: "Contattare Henry & Co.",
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
    footerEyebrow: "Henry & Co.",
    footerTitle:
      "Lo stesso standard operativo a cui si affidano clienti, partner e team.",
    footerBody:
      "Ogni superficie corporate di Henry & Co. — chi siamo, contatti, governance, policy — viene pubblicata seguendo un unico standard editoriale: ciò che si legge in pubblico corrisponde a ciò che teniamo in privato.",
    footerUseCase: "Caso d’uso",
    footerUseCaseValue: "Clienti · Partner · Media",
    footerStandard: "Standard",
    footerStandardValue: "Strutturato · Verificato",
  },
  aboutHonest: {
    eyebrow: "Su questa azienda",
    title: "Un’azienda, più attività focalizzate, un unico standard operativo.",
    body:
      "Henry & Co. è un gruppo operativo multi-divisione. Ogni divisione guida il proprio mercato — Care, Marketplace, Property, Logistics, Studio, Jobs, Learn — con lo stesso standard di presentazione, prenotazione, pricing e follow-up. L’hub esiste affinché clienti, partner e stakeholder possano vedere l’intera azienda in un unico luogo e raggiungere il business giusto in un solo passo. Cresciamo aggiungendo divisioni dentro questo quadro, non estendendo un singolo marchio fino a snaturarlo.",
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
      "Questo profilo fa parte del consiglio pubblico di leadership di Henry & Co.",
    emptyTitle: "Qui appariranno le informazioni di leadership",
    emptyBody:
      "Pubblica i profili di leadership dal pannello del titolare per presentare proprietà, direzione e rappresentanti aziendali di fiducia in un formato pubblico curato.",
    sharedSectionDescription:
      "I profili di questa sezione rappresentano le persone, la responsabilità e la cura operativa che sostengono il gruppo Henry & Co.",
    headerEyebrow: "Consiglio di leadership",
    headerTitle: "Leadership e responsabilità",
    headerBody:
      "Scopri le persone che danno forma a Henry & Co. tra proprietà, leadership pubblica, direzione operativa e responsabilità di lungo periodo.",
    metricProfiles: "Profili",
    metricOwnership: "Proprietà",
    metricManagement: "Direzione",
    spotlightEyebrow: "Profilo in primo piano",
    spotlightBioFallback:
      "Questo profilo di leadership rappresenta le persone responsabili di indirizzo, governance ed esecuzione premium nel gruppo Henry & Co.",
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
    brandFallback: "Henry & Co.",
    colCompany: "Azienda",
    linkHome: "Home",
    linkAbout: "Chi siamo",
    linkContact: "Contatto",
    linkSearch: "Cerca",
    colHenryCo: "Henry & Co.",
    linkHenryCoAccount: "Account Henry & Co.",
    linkLanguagePrefs: "Lingua e preferenze",
    linkEmailPrefs: "Preferenze e-mail",
    colLegal: "Note legali",
    linkPrivacy: "Privacy",
    linkTerms: "Termini",
    allRightsReserved: "Tutti i diritti riservati.",
    builtBy: "Progettato e sviluppato internamente da Henry & Co. Studio per l'ecosistema Henry & Co.",
    menuDivisionsDirectory: "Elenco divisioni",
    menuAbout: "Chi siamo",
    menuContact: "Contatto",
  },
  newsletterUnsubscribe: {
    metaTitle: "Annulla iscrizione — Henry & Co.",
    metaDescription: "Annulla l'iscrizione alle newsletter Henry & Co. con un clic.",
    eyebrow: "Newsletter",
    missingTitle: "Link di annullamento mancante.",
    missingBody:
      "Apri il link «Annulla iscrizione» da qualsiasi e-mail Henry & Co. per arrivare qui con un token valido. Se il tuo link è scaduto, contattaci e lo gestiremo manualmente.",
    missingCtaContact: "Contatta l'assistenza",
    missingCtaBack: "Torna alle newsletter",
    errorTitle: "Non siamo riusciti a disiscriverti.",
    errorManualNote:
      "Se il problema persiste, rispondi «annulla iscrizione» a qualsiasi e-mail Henry & Co. e il nostro team provvederà manualmente.",
    successTitle: "Sei disiscritto.",
    successBody:
      "{{email}} non riceverà più le newsletter Henry & Co.. I messaggi transazionali (ricevute, spedizioni, verifica, sicurezza) continueranno ad essere inviati perché siamo obbligati a farlo.",
    changedMind: "Hai cambiato idea?",
    ctaSubscribeAgain: "Iscriviti di nuovo",
    ctaManagePrefs: "Gestisci tutte le preferenze",
  },
};
const HUB_PUBLIC_COPY_ZH: DeepPartial<HubPublicCopy> = {
  footer: {
    description:
      "一座面向多业务板块的高级企业门户,以清晰、可信与长期一致的品牌纪律,呈现 Henry & Co. 的完整生态。",
    columnCompany: "公司",
    columnLegal: "法律",
    home: "首页",
    about: "关于我们",
    contact: "联系我们",
    privacyPolicy: "隐私政策",
    termsConditions: "条款与条件",
    allRightsReserved: "保留所有权利。",
    builtBy: "由 Henry & Co. Studio 内部为 Henry & Co. 生态量身设计与打造",
  },
  contactHero: {
    eyebrow: "联系 Henry & Co.",
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
    footerEyebrow: "Henry & Co.",
    footerTitle:
      "与客户、合作伙伴及团队所信赖的运营标准始终一致。",
    footerBody:
      "Henry & Co. 旗下的每一处对外页面——关于、联系、治理、政策——皆遵循同一套编辑标准发布,公开呈现与内部坚持完全一致。",
    footerUseCase: "适用场景",
    footerUseCaseValue: "客户 · 合作伙伴 · 媒体",
    footerStandard: "标准",
    footerStandardValue: "结构化 · 经核验",
  },
  aboutHonest: {
    eyebrow: "关于本公司",
    title: "一家公司,多项专注业务,统一的运营标准。",
    body:
      "Henry & Co. 是一家多业务板块的运营集团。各板块各自经营自有市场——Care、Marketplace、Property、Logistics、Studio、Jobs、Learn——并按同一标准完成呈现、预订、定价与后续跟进。本中心存在的意义,是让客户、合作伙伴与利益相关方在同一入口看见公司全貌,并在一步之内抵达对应业务。我们的成长方式,是在这套框架内增设业务板块,而非将单一品牌过度拉伸。",
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
      "该介绍属于 Henry & Co. 公开发布的领导团队信息。",
    emptyTitle: "领导团队信息将在此显示",
    emptyBody:
      "请在所有者控制台中发布领导团队介绍,以体面而专业的方式向公众呈现公司的股东、管理层及主要代表。",
    sharedSectionDescription:
      "此部分的介绍体现着 Henry & Co. 集团背后的人、所担负的治理责任与持续的运营守护。",
    headerEyebrow: "领导团队",
    headerTitle: "领导与治理",
    headerBody:
      "认识塑造 Henry & Co. 的人——涵盖股东、对外领导、运营方向与长期责任。",
    metricProfiles: "介绍数量",
    metricOwnership: "股东",
    metricManagement: "管理层",
    spotlightEyebrow: "焦点介绍",
    spotlightBioFallback:
      "该领导团队介绍代表 Henry & Co. 集团在方向、治理与高品质执行方面所依赖的核心成员。",
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
    brandFallback: "Henry & Co.",
    colCompany: "公司",
    linkHome: "首页",
    linkAbout: "关于我们",
    linkContact: "联系我们",
    linkSearch: "搜索",
    colHenryCo: "Henry & Co.",
    linkHenryCoAccount: "Henry & Co.账户",
    linkLanguagePrefs: "语言与偏好",
    linkEmailPrefs: "邮件偏好",
    colLegal: "法律",
    linkPrivacy: "隐私",
    linkTerms: "条款",
    allRightsReserved: "版权所有。",
    builtBy: "由Henry & Co. Studio为Henry & Co.生态系统内部设计和构建",
    menuDivisionsDirectory: "部门目录",
    menuAbout: "关于我们",
    menuContact: "联系我们",
  },
  newsletterUnsubscribe: {
    metaTitle: "取消订阅 — Henry & Co.",
    metaDescription: "一键取消订阅Henry & Co.新闻通讯。",
    eyebrow: "新闻通讯",
    missingTitle: "取消订阅链接缺失。",
    missingBody:
      "打开任何Henry & Co.邮件中的「取消订阅」链接，携带有效令牌来到此页面。如果您的链接已过期，请联系我们，我们将手动处理。",
    missingCtaContact: "联系支持",
    missingCtaBack: "返回新闻通讯",
    errorTitle: "我们无法为您取消订阅。",
    errorManualNote:
      "如果此情况持续发生，请回复任何Henry & Co.邮件并注明「取消订阅」，我们的团队将手动处理。",
    successTitle: "您已取消订阅。",
    successBody:
      "{{email}} 将不再收到Henry & Co.新闻通讯。交易类消息（收据、配送、验证、安全）仍会发送，因为我们必须这样做。",
    changedMind: "改变主意了？",
    ctaSubscribeAgain: "重新订阅",
    ctaManagePrefs: "管理所有偏好",
  },
};
const HUB_PUBLIC_COPY_HI: DeepPartial<HubPublicCopy> = {
  footer: {
    description:
      "Henry & Co. के पूरे तंत्र को स्पष्टता, भरोसे और दीर्घकालिक ब्रांड अनुशासन के साथ प्रस्तुत करने के लिए तैयार किया गया एक प्रीमियम बहु-डिवीज़न कॉर्पोरेट प्रवेशद्वार।",
    columnCompany: "कंपनी",
    columnLegal: "क़ानूनी",
    home: "मुखपृष्ठ",
    about: "हमारे बारे में",
    contact: "संपर्क करें",
    privacyPolicy: "गोपनीयता नीति",
    termsConditions: "नियम एवं शर्तें",
    allRightsReserved: "सर्वाधिकार सुरक्षित।",
    builtBy: "Henry & Co. Studio द्वारा Henry & Co. तंत्र के लिए स्वयं अभिकल्पित एवं निर्मित",
  },
  contactHero: {
    eyebrow: "Henry & Co. से संपर्क करें",
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
    footerEyebrow: "Henry & Co.",
    footerTitle:
      "वही परिचालन मानक जिस पर हमारे ग्राहक, साझेदार और टीमें भरोसा करती हैं।",
    footerBody:
      "Henry & Co. की हर सार्वजनिक सतह — परिचय, संपर्क, अभिशासन, नीति — एक ही संपादकीय मानक के अंतर्गत प्रकाशित होती है, ताकि जो आप सार्वजनिक रूप से पढ़ते हैं वही हम भीतर से भी पालन करते हैं।",
    footerUseCase: "उपयोग",
    footerUseCaseValue: "ग्राहक · साझेदार · मीडिया",
    footerStandard: "मानक",
    footerStandardValue: "सुव्यवस्थित · सत्यापित",
  },
  aboutHonest: {
    eyebrow: "इस कंपनी के बारे में",
    title: "एक कंपनी, कई केंद्रित व्यवसाय, एक ही परिचालन मानक।",
    body:
      "Henry & Co. एक बहु-डिवीज़न परिचालन समूह है। प्रत्येक डिवीज़न — Care, Marketplace, Property, Logistics, Studio, Jobs, Learn — अपने बाज़ार का संचालन उसी प्रस्तुति, बुकिंग, मूल्य-निर्धारण और अनुवर्ती सेवा के मानक पर करता है। यह हब इसलिए है कि ग्राहक, साझेदार और हितधारक पूरी कंपनी को एक ही जगह देख सकें और एक ही क़दम में सही व्यवसाय तक पहुँच सकें। हम इसी ढाँचे के भीतर नए डिवीज़न जोड़कर बढ़ते हैं, किसी एक ब्रांड को अधिक नहीं खींचते।",
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
      "यह परिचय Henry & Co. के सार्वजनिक नेतृत्व मंडल का हिस्सा है।",
    emptyTitle: "नेतृत्व की जानकारी यहाँ प्रकट होगी",
    emptyBody:
      "स्वामी डैशबोर्ड से नेतृत्व परिचय प्रकाशित कीजिए, ताकि कंपनी का स्वामित्व, प्रबंधन और भरोसेमंद प्रतिनिधि एक सुसज्जित सार्वजनिक रूप में दिखाई दें।",
    sharedSectionDescription:
      "इस खंड के परिचय Henry & Co. समूह के पीछे खड़े लोगों, उनकी देखरेख और परिचालन उत्तरदायित्व को दर्शाते हैं।",
    headerEyebrow: "नेतृत्व मंडल",
    headerTitle: "नेतृत्व और देखरेख",
    headerBody:
      "उन लोगों से परिचित हों जो स्वामित्व, सार्वजनिक नेतृत्व, परिचालन दिशा और दीर्घकालिक उत्तरदायित्व के माध्यम से Henry & Co. को आकार देते हैं।",
    metricProfiles: "परिचय",
    metricOwnership: "स्वामित्व",
    metricManagement: "प्रबंधन",
    spotlightEyebrow: "विशेष परिचय",
    spotlightBioFallback:
      "यह नेतृत्व परिचय उन व्यक्तियों का प्रतिनिधित्व करता है जो Henry & Co. समूह की दिशा, अभिशासन और प्रीमियम क्रियान्वयन के लिए उत्तरदायी हैं।",
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
    brandFallback: "Henry & Co.",
    colCompany: "कंपनी",
    linkHome: "होम",
    linkAbout: "हमारे बारे में",
    linkContact: "संपर्क",
    linkSearch: "खोज",
    colHenryCo: "Henry & Co.",
    linkHenryCoAccount: "Henry & Co. खाता",
    linkLanguagePrefs: "भाषा और प्राथमिकताएं",
    linkEmailPrefs: "ईमेल प्राथमिकताएं",
    colLegal: "कानूनी",
    linkPrivacy: "गोपनीयता",
    linkTerms: "शर्तें",
    allRightsReserved: "सर्वाधिकार सुरक्षित।",
    builtBy: "Henry & Co. Studio द्वारा Henry & Co. पारिस्थितिकी तंत्र के लिए आंतरिक रूप से डिज़ाइन और निर्मित",
    menuDivisionsDirectory: "डिवीजन निर्देशिका",
    menuAbout: "हमारे बारे में",
    menuContact: "संपर्क",
  },
  newsletterUnsubscribe: {
    metaTitle: "सदस्यता रद्द करें — Henry & Co.",
    metaDescription: "Henry & Co. न्यूज़लेटर से एक क्लिक में सदस्यता रद्द करें।",
    eyebrow: "न्यूज़लेटर",
    missingTitle: "सदस्यता रद्द करने का लिंक नहीं मिला।",
    missingBody:
      "किसी भी Henry & Co. ईमेल से «सदस्यता रद्द करें» लिंक खोलें और वैध टोकन के साथ यहां आएं। यदि आपका लिंक समाप्त हो गया है, तो हमसे संपर्क करें और हम इसे मैन्युअली पूरा करेंगे।",
    missingCtaContact: "सहायता से संपर्क करें",
    missingCtaBack: "न्यूज़लेटर पर वापस जाएं",
    errorTitle: "हम आपकी सदस्यता रद्द नहीं कर सके।",
    errorManualNote:
      "यदि यह जारी रहता है, किसी भी Henry & Co. ईमेल का जवाब «सदस्यता रद्द करें» लिखकर दें और हमारी टीम इसे मैन्युअली पूरा करेगी।",
    successTitle: "आपकी सदस्यता रद्द हो गई।",
    successBody:
      "{{email}} को Henry & Co. न्यूज़लेटर नहीं मिलेंगे। लेन-देन संबंधी संदेश (रसीदें, शिपिंग, सत्यापन, सुरक्षा) अभी भी भेजे जाएंगे क्योंकि हमें ऐसा करना आवश्यक है।",
    changedMind: "क्या आपने अपना मन बदल लिया?",
    ctaSubscribeAgain: "फिर से सदस्यता लें",
    ctaManagePrefs: "सभी प्राथमिकताएं प्रबंधित करें",
  },
};
const HUB_PUBLIC_COPY_IG: DeepPartial<HubPublicCopy> = {
  footer: {
    description:
      "Ọnụ ụzọ ụlọọrụ dị elu nke nwere ọtụtụ ngalaba, eji egosi usoro Henry & Co. n’ụzọ doro anya, na-ewete ntụkwasị obi, na-edobekwa ọkwa aha ya ogologo oge.",
    columnCompany: "Ụlọọrụ",
    columnLegal: "Iwu",
    home: "Mbụ",
    about: "Banyere anyị",
    contact: "Kpọtụrụ anyị",
    privacyPolicy: "Iwu nzuzo",
    termsConditions: "Usoro na ọnọdụ",
    allRightsReserved: "Ikike niile e debere.",
    builtBy: "Atụpụtara ma rụpụta n’ime ụlọ site na Henry & Co. Studio maka usoro Henry & Co.",
  },
  contactHero: {
    eyebrow: "Kpọtụrụ Henry & Co.",
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
    footerEyebrow: "Henry & Co.",
    footerTitle:
      "Otu ọkwa ọrụ ahụ ndị ahịa anyị, ndị mmekọ, na ndị otu anyị tụkwasịrị obi na ya.",
    footerBody:
      "Ihu ọ bụla nke ụlọọrụ Henry & Co. — banyere anyị, nkpọtụrụ, ọchịchị, iwu — na-eso otu ọkwa nchịkọta edemede, ka ihe ndị mmadụ na-agụ n’ihu ọha bụrụkwa ihe anyị na-edobe n’ime onwe anyị.",
    footerUseCase: "Ihe e ji ya eme",
    footerUseCaseValue: "Ndị ahịa · Ndị mmekọ · Mgbasa ozi",
    footerStandard: "Ọkwa",
    footerStandardValue: "Nke ahaziri ahazi · Nke a kwadoro",
  },
  aboutHonest: {
    eyebrow: "Banyere ụlọọrụ a",
    title: "Otu ụlọọrụ, ọtụtụ ụzọ azụmahịa lekwasịrị anya, otu ọkwa ọrụ.",
    body:
      "Henry & Co. bụ otu ụlọọrụ-nne nwere ọtụtụ ngalaba. Ngalaba ọ bụla na-ejikwa ahịa nke aka ya — Care, Marketplace, Property, Logistics, Studio, Jobs, na Learn — n’otu ọkwa nke ngosipụta, ndokwa, ọnụ ahịa, na nlekọta. Ebe nzuko a dị ka ndị ahịa, ndị mmekọ, na ndị nwere mmasị wee hụ ụlọọrụ niile n’otu ebe ma rute n’azụmahịa ziri ezi n’otu nzọụkwụ. Anyị na-eto site n’itinye ngalaba ọhụrụ n’ime usoro a, ọ bụghị site n’ikwagharị otu ọkwa aha karịa ike ya.",
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
      "Akụkọ a so na ndị nduzi Henry & Co. e gosipụtara n’ihu ọha.",
    emptyTitle: "Ozi banyere ndị nduzi ga-apụta ebe a",
    emptyBody:
      "Tinye akụkọ ndị nduzi site n’ụlọ ọchịchị onye nwe iji gosipụta nweta, njikwa, na ndị nnọchi anya ụlọọrụ a tụkwasịrị obi n’ụdị mara mma maka ọha.",
    sharedSectionDescription:
      "Akụkọ dị n’akụkụ a na-egosi mmadụ, nlekọta, na ọrụ nkwado dị n’azụ otu Henry & Co.",
    headerEyebrow: "Ọgbakọ ndị nduzi",
    headerTitle: "Nduzi na nlekọta",
    headerBody:
      "Matakwuo ndị na-akpụzi Henry & Co. — site na nweta, nduzi ọha, ntụzịaka ọrụ, na ọrụ nkwado nke ogologo oge.",
    metricProfiles: "Akụkọ",
    metricOwnership: "Nweta",
    metricManagement: "Njikwa",
    spotlightEyebrow: "Akụkọ pụrụ iche",
    spotlightBioFallback:
      "Akụkọ nduzi a na-egosi ndị na-ahụ maka ntụzịaka, ọchịchị, na ọrụ dị elu n’otu Henry & Co.",
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
    brandFallback: "Henry & Co.",
    colCompany: "Ụlọ ọrụ",
    linkHome: "Ụlọ",
    linkAbout: "Maka anyị",
    linkContact: "Kpọtụrụ anyị",
    linkSearch: "Chọọ",
    colHenryCo: "Henry & Co.",
    linkHenryCoAccount: "Akaụntụ Henry & Co.",
    linkLanguagePrefs: "Asụsụ & mmasị",
    linkEmailPrefs: "Mmasị imeli",
    colLegal: "Iwu",
    linkPrivacy: "Nzuzo",
    linkTerms: "Usoro",
    allRightsReserved: "Ikike nile echekwara.",
    builtBy: "Achepụtara ma wuo n'ime ụlọ site na Henry & Co. Studio maka njikọ Henry & Co.",
    menuDivisionsDirectory: "Ndepụta ngalaba",
    menuAbout: "Maka anyị",
    menuContact: "Kpọtụrụ anyị",
  },
  newsletterUnsubscribe: {
    metaTitle: "Wepụ onwe gị — Henry & Co.",
    metaDescription: "Wepụ onwe gị na mbipụta ozi Henry & Co. n'otu ntụọ.",
    eyebrow: "Mbipụta ozi",
    missingTitle: "Njikọ iwepụ onwe gị adịghị.",
    missingBody:
      "Mepee njikọ «Wepụ onwe gị» n'ozi imeli ọ bụla nke Henry & Co. iji bịa ebe a na token zuru oke. Ọ bụrụ na njikọ gị gasịrị, kpọtụrụ anyị ma anyị ga-eme ya n'aka.",
    missingCtaContact: "Kpọtụrụ nkwado",
    missingCtaBack: "Laghachi na mbipụta ozi",
    errorTitle: "Anyị enweghị ike iwepụ gị.",
    errorManualNote:
      "Ọ bụrụ na nke a na-aga n'ihu, zaa «wepụ onwe gị» na ozi imeli ọ bụla Henry & Co. ma ndị otu anyị ga-eme ya n'aka.",
    successTitle: "Ewepụrụ gị.",
    successBody:
      "{{email}} agaghị enweta mbipụta ozi Henry & Co.. Ozi ahịa (영수증, nziga, nyochaa, nchedo) ka na-eziga n'ihi na anyị ga-eme ya.",
    changedMind: "Ị gbanwere uche gị?",
    ctaSubscribeAgain: "Deere aha ọzọ",
    ctaManagePrefs: "Jikwaa nhọrọ niile",
  },
};
const HUB_PUBLIC_COPY_YO: DeepPartial<HubPublicCopy> = {
  footer: {
    description:
      "Ẹnu-ọnà aláṣẹ-onírúurú-ẹ̀ka tó wúlò gan-an, tí a ṣètò láti fi ètò Henry & Co. hàn pẹ̀lú ìmọ́lẹ̀, ìgbẹ́kẹ̀lé, àti ìdánilójú orúkọ ẹ̀dá-iṣẹ́ tí kò ní pòórá lóòókán.",
    columnCompany: "Iléeṣẹ́",
    columnLegal: "Òfin",
    home: "Ojú-ìwé àkọ́kọ́",
    about: "Nípa wa",
    contact: "Bá wa sọ̀rọ̀",
    privacyPolicy: "Ìlànà Ìpamọ́",
    termsConditions: "Àwọn Ìtọ́ni àti Àdéhùn",
    allRightsReserved: "Gbogbo ẹ̀tọ́ ni a fi pamọ́.",
    builtBy: "A ṣe àpẹẹrẹ rẹ̀ a sì kọ́ ọ ní ilé nípasẹ̀ Henry & Co. Studio fún ètò Henry & Co.",
  },
  contactHero: {
    eyebrow: "Bá Henry & Co. sọ̀rọ̀",
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
    footerEyebrow: "Henry & Co.",
    footerTitle:
      "Ìwọ̀n iṣẹ́ kan náà tí àwọn oníbàárà wa, àwọn alábàáṣe wa, àti àwọn ẹgbẹ́ wa ní ìgbẹ́kẹ̀lé sí.",
    footerBody:
      "Gbogbo ìhà ojú-ọ̀nà Henry & Co. — nípa wa, olùbáni-sọ̀rọ̀, ìṣàkóso, ìlànà — ni a tẹ̀jáde lábẹ́ ìwọ̀n àtúnṣe kan kan ṣoṣo, kí ohun tí o kà ní gbangba bá ohun tí à ń mú ṣẹ ní ìkọ̀kọ̀ rí.",
    footerUseCase: "Ìlò",
    footerUseCaseValue: "Oníbàárà · Alábàáṣe · Ìròyìn",
    footerStandard: "Ìwọ̀n",
    footerStandardValue: "Tí ó wà létòlétò · Tí a ti fọwọ́sí",
  },
  aboutHonest: {
    eyebrow: "Nípa iléeṣẹ́ yìí",
    title: "Iléeṣẹ́ kan, ọ̀pọ̀lọpọ̀ òwò tó ní àfojúsùn, ìwọ̀n iṣẹ́ kan náà.",
    body:
      "Henry & Co. jẹ́ ẹgbẹ́ iléeṣẹ́ aláṣẹ-onírúurú-ẹ̀ka. Ẹ̀ka kọ̀ọ̀kan ń darí ọjà tirẹ̀ — Care, Marketplace, Property, Logistics, Studio, Jobs, Learn — lórí ìwọ̀n kan náà ti ìfihàn, ìfijíṣẹ́, ìṣètò owó, àti ìtẹ̀síwájú. Hub yìí wà kí àwọn oníbàárà, alábàáṣe, àti àwọn olówó kópa lè rí gbogbo iléeṣẹ́ ní ibìkan, kí wọ́n sì dé ẹ̀ka tó yẹ ní ìgbésẹ̀ kan ṣoṣo. A ń dàgbà nípa fífi àwọn ẹ̀ka tuntun kún inú ètò yìí, kì í ṣe nípa nínà àmì-iléeṣẹ́ kan ju agbára rẹ̀ lọ.",
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
      "Àpèjúwe yìí jẹ́ apá kan ìgbìmọ̀ aṣáájú-ọnà gbangba ti Henry & Co.",
    emptyTitle: "Àlàyé olórí yóò hàn níbí",
    emptyBody:
      "Tẹ àwọn àpèjúwe olórí jáde láti inú pẹpẹ olúwa kí o lè fi ìní, ìṣàkóso, àti àwọn aṣojú igbẹ́kẹ̀lé iléeṣẹ́ hàn ní ọnà àtìnúwà fún gbangba.",
    sharedSectionDescription:
      "Àwọn àpèjúwe nínú apá yìí ń jẹ́rìí àwọn ènìyàn, ìbojútó, àti àyípadà iṣẹ́ tí ó ń gbé ẹgbẹ́ Henry & Co. dúró.",
    headerEyebrow: "Ìgbìmọ̀ olórí",
    headerTitle: "Olórí àti ìbojútó",
    headerBody:
      "Mọ àwọn ènìyàn tí ó ń ṣe ìrísí Henry & Co. — ìní, olórí gbangba, ìtọ́sọ́nà iṣẹ́, àti ojúṣe ìgbà-pípẹ́.",
    metricProfiles: "Àpèjúwe",
    metricOwnership: "Ìní",
    metricManagement: "Ìṣàkóso",
    spotlightEyebrow: "Àpèjúwe pàtàkì",
    spotlightBioFallback:
      "Àpèjúwe olórí yìí dúró fún àwọn ènìyàn tí ó ń ṣiṣẹ́ lórí ìtọ́sọ́nà, ìṣàkóso, àti iṣẹ́ tó dára gan-an ní ẹgbẹ́ Henry & Co.",
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
    brandFallback: "Henry & Co.",
    colCompany: "Ilé-iṣẹ́",
    linkHome: "Ilé",
    linkAbout: "Nípa wa",
    linkContact: "Kàn sí wa",
    linkSearch: "Wá",
    colHenryCo: "Henry & Co.",
    linkHenryCoAccount: "Àkọọ́lẹ̀ Henry & Co.",
    linkLanguagePrefs: "Èdè & àwọn àṣàyàn",
    linkEmailPrefs: "Àwọn àṣàyàn ímeèlì",
    colLegal: "Òfin",
    linkPrivacy: "Ìpamọ́",
    linkTerms: "Àwọn òfin",
    allRightsReserved: "Gbogbo ẹ̀tọ́ ni a tọ́jú.",
    builtBy: "A ṣe àpẹẹrẹ rẹ̀ àti kọ́ rẹ̀ nínú ilé nípa Henry & Co. Studio fún ètò Henry & Co.",
    menuDivisionsDirectory: "Àtọ́kàn àwọn ẹ̀ka",
    menuAbout: "Nípa wa",
    menuContact: "Kàn sí wa",
  },
  newsletterUnsubscribe: {
    metaTitle: "Yọ ìforúkọsílẹ̀ rẹ — Henry & Co.",
    metaDescription: "Yọ ìforúkọsílẹ̀ rẹ nínú àwọn ìròyìn Henry & Co. pẹ̀lú tẹ kan.",
    eyebrow: "Ìròyìn ìdúnnú",
    missingTitle: "Ọ̀nà ìsopọ̀ ìyọ ìforúkọsílẹ̀ kò sí.",
    missingBody:
      "Ṣí ọ̀nà ìsopọ̀ «Yọ ìforúkọsílẹ̀ rẹ» láti èbí ímeèlì Henry & Co. kan láti dé ibí pẹ̀lú àmì tí ó wulo. Tí ọ̀nà ìsopọ̀ rẹ bá ti parí, kàn sí wa àti a ó gba rẹ pẹ̀lú ọwọ́.",
    missingCtaContact: "Kàn sí àtìlẹyìn",
    missingCtaBack: "Padà sí àwọn ìròyìn",
    errorTitle: "A kò ṣe àṣeyọrí nínú ìyọ ìforúkọsílẹ̀ rẹ.",
    errorManualNote:
      "Tí èyí bá ń ṣẹlẹ̀ tún, dahùn pẹ̀lú «yọ ìforúkọsílẹ̀» sí èbí ímeèlì Henry & Co. kan àti ẹgbẹ́ wa ó ò gba rẹ pẹ̀lú ọwọ́.",
    successTitle: "A ti yọ ìforúkọsílẹ̀ rẹ.",
    successBody:
      "{{email}} kò ní gba àwọn ìròyìn Henry & Co. mọ̀. Àwọn ìránṣẹ́ ohun ìdúnàádúrà (àwọn rísítì, gbigbe, ìjẹrìísí, ààbò) ṣì máa ń ránṣẹ́ nítorí pé ó jẹ́ dandan.",
    changedMind: "Ṣé o ti yí ọkàn rẹ padà?",
    ctaSubscribeAgain: "Forúkọ sílẹ̀ lẹ́ẹ̀kan sí",
    ctaManagePrefs: "Ṣàkóso gbogbo àwọn àṣàyàn",
  },
};
const HUB_PUBLIC_COPY_HA: DeepPartial<HubPublicCopy> = {
  footer: {
    description:
      "Ƙofar kamfani mai daraja da ke haɗa rassa daban-daban, an ƙera ta domin gabatar da tsarin Henry & Co. cikin tsabta, amincewa, da kuma horon sunan kamfani na dogon lokaci.",
    columnCompany: "Kamfani",
    columnLegal: "Doka",
    home: "Babbar shafi",
    about: "Game da mu",
    contact: "Tuntube mu",
    privacyPolicy: "Manufar sirri",
    termsConditions: "Sharuɗɗa da yarjejeniyoyi",
    allRightsReserved: "Duk haƙƙoƙin an kiyaye.",
    builtBy: "An tsara shi kuma an gina shi a cikin gida ta hannun Henry & Co. Studio domin tsarin Henry & Co.",
  },
  contactHero: {
    eyebrow: "Tuntubi Henry & Co.",
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
    footerEyebrow: "Henry & Co.",
    footerTitle:
      "Mizanin aiki iri ɗaya da abokan cinikinmu, abokan haɗin gwiwa, da ƙungiyoyinmu suke dogara da shi.",
    footerBody:
      "Kowane fuska ta Henry & Co. — game da mu, tuntuɓa, shugabanci, manufa — ana buga shi a ƙarƙashin mizanin edita ɗaya, don abin da kake karanta a fili ya yi daidai da abin da muke kiyayewa a tsakaninmu.",
    footerUseCase: "Amfani",
    footerUseCaseValue: "Abokan ciniki · Abokan haɗin gwiwa · Kafofin watsa labarai",
    footerStandard: "Mizani",
    footerStandardValue: "An tsara · An tabbatar",
  },
  aboutHonest: {
    eyebrow: "Game da wannan kamfanin",
    title: "Kamfani ɗaya, kasuwanci da yawa masu mai da hankali, mizanin aiki ɗaya.",
    body:
      "Henry & Co. rukuni ne na kamfani mai rassa da yawa. Kowane reshe yana gudanar da kasuwarsa — Care, Marketplace, Property, Logistics, Studio, Jobs, Learn — a kan mizanin gabatarwa, ajiyar wuri, farashi, da bibiyar lamari iri ɗaya. Wannan hub yana wanzuwa ne don abokan ciniki, abokan haɗin gwiwa, da masu ruwa-da-tsaki su iya ganin kamfanin gaba ɗaya a wuri ɗaya, kuma su kai ga kasuwancin da ya dace cikin mataki ɗaya. Muna girma ta hanyar ƙara sabbin rassa a cikin wannan tsarin, ba ta hanyar shimfiɗa suna ɗaya bayan ƙarfinsa ba.",
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
      "Wannan bayanin yana cikin allon shugabancin Henry & Co. da aka bayyana a fili.",
    emptyTitle: "Bayanin shugabanci zai bayyana a nan",
    emptyBody:
      "Buga bayanan shugabanci daga dashbod na mai kamfani don gabatar da mallaka, gudanarwa, da amintattun wakilan kamfani a cikin tsari mai kyau ga jama’a.",
    sharedSectionDescription:
      "Bayanan da ke wannan sashin suna nuna mutanen, kulawa, da nauyin aiki da ke goyon bayan rukunin Henry & Co.",
    headerEyebrow: "Allon shugabanci",
    headerTitle: "Shugabanci da kulawa",
    headerBody:
      "Ka san mutanen da ke siffanta Henry & Co. — mallaka, shugabanci na fili, jagorancin aiki, da alhakin dogon lokaci.",
    metricProfiles: "Bayanai",
    metricOwnership: "Mallaka",
    metricManagement: "Gudanarwa",
    spotlightEyebrow: "Bayani na musamman",
    spotlightBioFallback:
      "Wannan bayanin shugabanci yana wakiltar mutanen da suke da alhakin shiriya, mulki, da aiki mai inganci a rukunin Henry & Co.",
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
    brandFallback: "Henry & Co.",
    colCompany: "Kamfani",
    linkHome: "Gida",
    linkAbout: "Game da mu",
    linkContact: "Tuntuɓi mu",
    linkSearch: "Bincika",
    colHenryCo: "Henry & Co.",
    linkHenryCoAccount: "Asusun Henry & Co.",
    linkLanguagePrefs: "Harshe & zaɓuɓɓuka",
    linkEmailPrefs: "Zaɓuɓɓukan imel",
    colLegal: "Doka",
    linkPrivacy: "Sirri",
    linkTerms: "Sharuɗɗa",
    allRightsReserved: "An kiyaye dukkan haƙƙoƙi.",
    builtBy: "An tsara kuma an gina shi ciki gida ta Henry & Co. Studio don tsarin Henry & Co.",
    menuDivisionsDirectory: "Jerin sassan",
    menuAbout: "Game da mu",
    menuContact: "Tuntuɓi mu",
  },
  newsletterUnsubscribe: {
    metaTitle: "Soke rajista — Henry & Co.",
    metaDescription: "Soke rajista daga sanarwar Henry & Co. da danna ɗaya.",
    eyebrow: "Sanarwa",
    missingTitle: "Hanyar soke rajista ta ɓace.",
    missingBody:
      "Bude hanyar «Soke rajista» daga kowanne imel na Henry & Co. don isa nan da ingantaccen alama. Idan hanyar ka ta ƙare, tuntuɓi mu kuma za mu yarda da ita a hannu.",
    missingCtaContact: "Tuntuɓi tallafi",
    missingCtaBack: "Koma sanarwa",
    errorTitle: "Ba mu iya soke rajistarka ba.",
    errorManualNote:
      "Idan hakan ya ci gaba, amsa «soke rajista» zuwa kowanne imel na Henry & Co. kuma ƙungiyarmu za ta yarda a hannu.",
    successTitle: "An soke rajistarka.",
    successBody:
      "{{email}} ba za ta karɓi sanarwar Henry & Co. ba. Saƙonni na ma'amala (rasa, jigilar kaya, tabbatarwa, tsaro) suna ci gaba da aika saboda dole ne.",
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
