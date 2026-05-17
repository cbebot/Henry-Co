import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * HubOwnerCopy — i18n surface for the hub owner command-center overview
 * page (`apps/hub/app/owner/(command)/page.tsx`) and its directly-rendered
 * owner components.
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each locale is a
 * DeepPartial that deep-merges over EN so missing keys fall through to EN
 * silently. Mirrors the shape of `hub-public-copy.ts`.
 */
export type HubOwnerCopy = {
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    titleTemplate: string;
    description: string;
    inviteStaff: string;
    updateBrand: string;
  };
  dataHealth: {
    title: string;
  };
  situationRoom: {
    title: string;
    description: string;
    openSupport: string;
    failedDelivery: string;
    whatsappSkipped: string;
    queuedNotifications: string;
    nextStepsEyebrow: string;
  };
  metrics: {
    divisionsLive: string;
    divisionsLiveSubtitle: string;
    recognizedRevenue: string;
    recognizedRevenueSubtitle: string;
    openSupport: string;
    openSupportSubtitle: string;
    activeStaff: string;
    activeStaffSubtitle: string;
    criticalSignals: string;
    criticalSignalsSubtitle: string;
    outboundNotifications: string;
    outboundNotificationsSubtitle: string;
  };
  executiveDigest: {
    title: string;
    description: string;
    reviewAlerts: string;
    financePressure: string;
    manageWorkforce: string;
    helperLayer: string;
    teamChat: string;
    approvalCenter: string;
  };
  urgentSignals: {
    title: string;
    description: string;
    openModule: string;
  };
  divisionsPanel: {
    title: string;
    description: string;
    viewAll: string;
    healthLabelTemplate: string;
    revenueLabel: string;
    staffLabel: string;
    supportLabel: string;
  };
  helperInsights: {
    title: string;
    description: string;
    takeAction: string;
  };
  sensitiveActivity: {
    title: string;
    description: string;
    unknownTime: string;
  };
  brand: {
    overview: {
      metadataTitle: string;
      metadataDescription: string;
      eyebrow: string;
      title: string;
      description: string;
      companySettingsCta: string;
      divisionBrandingCta: string;
      sharedIdentityTitle: string;
      sharedIdentityDescription: string;
      brandTitleLabel: string;
      companyNameLabel: string;
      supportEmailLabel: string;
      baseDomainLabel: string;
      emptyValue: string;
      defaultBrandTitle: string;
      defaultCompanyName: string;
      defaultBaseDomain: string;
      managedSurfacesTitle: string;
      managedSurfacesDescription: string;
      divisionRowsLabel: string;
      companyPagesLabel: string;
      hubSiteSettingsLabel: string;
    };
    pages: {
      metadataTitle: string;
      metadataDescription: string;
      eyebrow: string;
      title: string;
      description: string;
      panelTitle: string;
      panelDescription: string;
      saveLabel: string;
      savingLabel: string;
      saveSpinnerLabel: string;
      titlePlaceholder: string;
      subtitlePlaceholder: string;
      heroBadgePlaceholder: string;
      heroTitlePlaceholder: string;
      heroPrimaryLabelPlaceholder: string;
      heroPrimaryHrefPlaceholder: string;
      heroSecondaryLabelPlaceholder: string;
      heroSecondaryHrefPlaceholder: string;
      heroImageUrlPlaceholder: string;
      introPlaceholder: string;
      heroBodyPlaceholder: string;
      seoTitlePlaceholder: string;
      seoDescriptionPlaceholder: string;
      statsPlaceholder: string;
      sectionsPlaceholder: string;
      bodyPlaceholder: string;
    };
    settings: {
      metadataTitle: string;
      metadataDescription: string;
      eyebrow: string;
      title: string;
      description: string;
      companyPanelTitle: string;
      companyPanelDescription: string;
      hubPanelTitle: string;
      hubPanelDescription: string;
      saveCompanyLabel: string;
      saveHubLabel: string;
      savingLabel: string;
      saveSpinnerLabel: string;
      brandTitlePlaceholder: string;
      companyNamePlaceholder: string;
      legalNamePlaceholder: string;
      brandSubtitlePlaceholder: string;
      supportEmailPlaceholder: string;
      supportPhonePlaceholder: string;
      baseDomainPlaceholder: string;
      brandAccentPlaceholder: string;
      logoUrlPlaceholder: string;
      faviconUrlPlaceholder: string;
      defaultMetaTitlePlaceholder: string;
      brandDescriptionPlaceholder: string;
      footerBlurbPlaceholder: string;
      officeAddressPlaceholder: string;
      instagramPlaceholder: string;
      linkedinPlaceholder: string;
      whatsappPlaceholder: string;
      xPlaceholder: string;
      hubTitlePlaceholder: string;
      hubSubtitlePlaceholder: string;
      legalCompanyNamePlaceholder: string;
      primaryAccentPlaceholder: string;
      secondaryAccentPlaceholder: string;
      lightLogoUrlPlaceholder: string;
      metaDescriptionPlaceholder: string;
      footerNoticePlaceholder: string;
    };
    subdomains: {
      metadataTitle: string;
      metadataDescription: string;
      eyebrow: string;
      title: string;
      description: string;
      panelTitle: string;
      panelDescription: string;
      createHeading: string;
      createBlurb: string;
      createCtaLabel: string;
      saveCtaLabel: string;
      savingLabel: string;
      saveSpinnerLabel: string;
      slugPlaceholder: string;
      namePlaceholder: string;
      subdomainPlaceholder: string;
      primaryUrlPlaceholder: string;
      domainPlaceholder: string;
      accentPlaceholder: string;
      taglinePlaceholder: string;
      logoUrlPlaceholder: string;
      coverUrlPlaceholder: string;
      descriptionPlaceholder: string;
      highlightsPlaceholder: string;
      whoItsForPlaceholder: string;
      howItWorksPlaceholder: string;
      trustPlaceholder: string;
      statusPending: string;
      statusActive: string;
      statusPaused: string;
      statusArchived: string;
    };
  };
};

const HUB_OWNER_COPY_EN: HubOwnerCopy = {
  metadata: {
    title: "Owner command center · Henry & Co.",
    description:
      "Company-wide operations, finance, staffing, brand, delivery health, and owner guidance in one HenryCo HQ surface.",
  },
  hero: {
    eyebrow: "Central Owner Command Center",
    titleTemplate: "{company} company brain",
    description:
      "Company-wide operations, finance, staffing, brand, delivery health, and owner guidance in one HenryCo HQ surface.",
    inviteStaff: "Invite staff",
    updateBrand: "Update brand settings",
  },
  dataHealth: {
    title: "Data freshness",
  },
  situationRoom: {
    title: "Executive situation room",
    description: "Fast owner read for what matters now.",
    openSupport: "Open support",
    failedDelivery: "Failed delivery",
    whatsappSkipped: "WhatsApp skipped",
    queuedNotifications: "Queued notifications",
    nextStepsEyebrow: "Next best owner actions",
  },
  metrics: {
    divisionsLive: "Live divisions",
    divisionsLiveSubtitle: "Tracked by the command center",
    recognizedRevenue: "Recognized revenue",
    recognizedRevenueSubtitle: "Care, marketplace, and paid shared invoices",
    openSupport: "Open support pressure",
    openSupportSubtitle: "Cross-division support threads awaiting movement",
    activeStaff: "Active staff",
    activeStaffSubtitle: "Auth-backed workforce members seen recently",
    criticalSignals: "Critical signals",
    criticalSignalsSubtitle: "Items needing owner attention now",
    outboundNotifications: "Outbound notifications",
    outboundNotificationsSubtitle: "Queued email and WhatsApp delivery",
  },
  executiveDigest: {
    title: "Executive digest",
    description: "What needs attention now.",
    reviewAlerts: "Review operational alerts",
    financePressure: "Check finance pressure",
    manageWorkforce: "Manage workforce",
    helperLayer: "Open helper layer",
    teamChat: "Team internal chat",
    approvalCenter: "Approval center",
  },
  urgentSignals: {
    title: "Urgent signals",
    description: "Evidence-backed risk and anomaly detection from live tables.",
    openModule: "Open module",
  },
  divisionsPanel: {
    title: "Division control center",
    description: "One health map for every live or future HenryCo division.",
    viewAll: "View all divisions",
    healthLabelTemplate: "{label} health · {alerts} alerts · {open} open items",
    revenueLabel: "Revenue",
    staffLabel: "Staff",
    supportLabel: "Support",
  },
  helperInsights: {
    title: "Helper recommendations",
    description: "Only recommendations backed by live signals.",
    takeAction: "Take action",
  },
  sensitiveActivity: {
    title: "Sensitive activity",
    description: "Recent owner-facing audit and staff changes.",
    unknownTime: "Unknown time",
  },
  brand: {
    overview: {
      metadataTitle: "Brand & subdomain control · Henry & Co.",
      metadataDescription:
        "Central source for shared company identity, division branding, page-level content blocks, and subdomain presentation records.",
      eyebrow: "Brand & Subdomain Control",
      title: "Central identity management",
      description:
        "The central owner dashboard is now the source for shared company identity, division branding, page-level content blocks, and subdomain presentation records.",
      companySettingsCta: "Company settings",
      divisionBrandingCta: "Division branding",
      sharedIdentityTitle: "Shared company identity",
      sharedIdentityDescription: "Current top-level brand fields from production.",
      brandTitleLabel: "Brand title",
      companyNameLabel: "Company name",
      supportEmailLabel: "Support email",
      baseDomainLabel: "Base domain",
      emptyValue: "—",
      defaultBrandTitle: "Henry & Co.",
      defaultCompanyName: "Henry & Co.",
      defaultBaseDomain: "henrycogroup.com",
      managedSurfacesTitle: "Managed surfaces",
      managedSurfacesDescription:
        "Shared pages and division rows that now belong to the central owner dashboard.",
      divisionRowsLabel: "Division brand rows",
      companyPagesLabel: "Shared company pages",
      hubSiteSettingsLabel: "Hub site settings rows",
    },
    pages: {
      metadataTitle: "Shared company pages · Henry & Co.",
      metadataDescription:
        "Hero content, meta, CTAs, and structured sections for the public company pages are editable from the central owner dashboard.",
      eyebrow: "Pages & Content",
      title: "Shared company pages",
      description:
        "Hero content, meta, CTAs, and structured sections for the public company pages are now editable from the same central owner dashboard.",
      panelTitle: "Page content rows",
      panelDescription:
        "JSON fields stay explicit so the owner can manage page structure without hidden tooling.",
      saveLabel: "Save page content",
      savingLabel: "Saving...",
      saveSpinnerLabel: "Saving page",
      titlePlaceholder: "Title",
      subtitlePlaceholder: "Subtitle",
      heroBadgePlaceholder: "Hero badge",
      heroTitlePlaceholder: "Hero title",
      heroPrimaryLabelPlaceholder: "Primary CTA label",
      heroPrimaryHrefPlaceholder: "Primary CTA href",
      heroSecondaryLabelPlaceholder: "Secondary CTA label",
      heroSecondaryHrefPlaceholder: "Secondary CTA href",
      heroImageUrlPlaceholder: "Hero image URL",
      introPlaceholder: "Intro",
      heroBodyPlaceholder: "Hero body",
      seoTitlePlaceholder: "SEO title",
      seoDescriptionPlaceholder: "SEO description",
      statsPlaceholder: '[{"label":"...","value":"..."}]',
      sectionsPlaceholder: '[{"title":"...","body":"..."}]',
      bodyPlaceholder: '[{"layout":"default","title":"..."}]',
    },
    settings: {
      metadataTitle: "Company-wide brand settings · Henry & Co.",
      metadataDescription:
        "Identity, contact, SEO, and hub shell controls that write directly into the shared company settings rows.",
      eyebrow: "Brand Settings",
      title: "Company-wide identity controls",
      description:
        "These controls write directly into the shared company settings rows used by the group brand layer.",
      companyPanelTitle: "Company settings",
      companyPanelDescription: "Top-level company identity, contact, and SEO defaults.",
      hubPanelTitle: "Hub site shell",
      hubPanelDescription: "The current live hub shell row for the public group site.",
      saveCompanyLabel: "Save company settings",
      saveHubLabel: "Save hub shell settings",
      savingLabel: "Saving...",
      saveSpinnerLabel: "Saving changes",
      brandTitlePlaceholder: "Brand title",
      companyNamePlaceholder: "Company name",
      legalNamePlaceholder: "Legal name",
      brandSubtitlePlaceholder: "Brand subtitle",
      supportEmailPlaceholder: "Support email",
      supportPhonePlaceholder: "Support phone",
      baseDomainPlaceholder: "Base domain",
      brandAccentPlaceholder: "#C9A227",
      logoUrlPlaceholder: "Logo URL",
      faviconUrlPlaceholder: "Favicon URL",
      defaultMetaTitlePlaceholder: "Default meta title",
      brandDescriptionPlaceholder: "Brand description",
      footerBlurbPlaceholder: "Footer blurb",
      officeAddressPlaceholder: "Office address",
      instagramPlaceholder: "Instagram URL",
      linkedinPlaceholder: "LinkedIn URL",
      whatsappPlaceholder: "WhatsApp number",
      xPlaceholder: "X URL",
      hubTitlePlaceholder: "Hub title",
      hubSubtitlePlaceholder: "Hub subtitle",
      legalCompanyNamePlaceholder: "Legal company name",
      primaryAccentPlaceholder: "Primary accent",
      secondaryAccentPlaceholder: "Secondary accent",
      lightLogoUrlPlaceholder: "Light logo URL",
      metaDescriptionPlaceholder: "Meta description",
      footerNoticePlaceholder: "Footer notice",
    },
    subdomains: {
      metadataTitle: "Division branding · Henry & Co.",
      metadataDescription:
        "Subdomains, logos, and identity rows for every HenryCo division, edited centrally from the owner command center.",
      eyebrow: "Division Branding",
      title: "Subdomains, logos, and identity rows",
      description: "Each division row can now be updated centrally from the owner command center.",
      panelTitle: "Division rows",
      panelDescription:
        "Edit the brand row that represents each division across the shared company registry.",
      createHeading: "Create new division row",
      createBlurb:
        "Add a pending or active division directly in the registry so owner-controlled rows drive the wider company surface.",
      createCtaLabel: "Create division row",
      saveCtaLabel: "Save division row",
      savingLabel: "Saving...",
      saveSpinnerLabel: "Saving division",
      slugPlaceholder: "Slug, e.g. logistics-labs",
      namePlaceholder: "Division name",
      subdomainPlaceholder: "Subdomain",
      primaryUrlPlaceholder: "Primary URL",
      domainPlaceholder: "Domain",
      accentPlaceholder: "#...",
      taglinePlaceholder: "Tagline",
      logoUrlPlaceholder: "Logo URL",
      coverUrlPlaceholder: "Hero media / cover URL",
      descriptionPlaceholder: "Description",
      highlightsPlaceholder: "Highlights, one per line",
      whoItsForPlaceholder: "Audience, one per line",
      howItWorksPlaceholder: "How it works, one per line",
      trustPlaceholder: "Trust items, one per line",
      statusPending: "Pending",
      statusActive: "Active",
      statusPaused: "Paused",
      statusArchived: "Archived",
    },
  },
};

const HUB_OWNER_COPY_FR: DeepPartial<HubOwnerCopy> = {
  metadata: {
    title: "Centre de commande propriétaire · Henry & Co.",
    description:
      "Opérations, finance, ressources humaines, marque, santé de livraison et conseils propriétaire à l’échelle de l’entreprise, réunis dans une seule surface HenryCo HQ.",
  },
  hero: {
    eyebrow: "Centre de commande propriétaire central",
    titleTemplate: "Cerveau d’entreprise de {company}",
    description:
      "Opérations, finance, ressources humaines, marque, santé de livraison et conseils propriétaire à l’échelle de l’entreprise, réunis dans une seule surface HenryCo HQ.",
    inviteStaff: "Inviter du personnel",
    updateBrand: "Mettre à jour la marque",
  },
  dataHealth: { title: "Fraîcheur des données" },
  situationRoom: {
    title: "Salle de situation exécutive",
    description: "Lecture rapide pour le propriétaire sur ce qui compte maintenant.",
    openSupport: "Support ouvert",
    failedDelivery: "Livraisons échouées",
    whatsappSkipped: "WhatsApp ignoré",
    queuedNotifications: "Notifications en attente",
    nextStepsEyebrow: "Meilleures actions à mener",
  },
  metrics: {
    divisionsLive: "Divisions actives",
    divisionsLiveSubtitle: "Suivies par le centre de commande",
    recognizedRevenue: "Revenu reconnu",
    recognizedRevenueSubtitle: "Care, marketplace et factures partagées payées",
    openSupport: "Pression du support ouvert",
    openSupportSubtitle: "Fils de support inter-divisions en attente",
    activeStaff: "Personnel actif",
    activeStaffSubtitle: "Membres authentifiés vus récemment",
    criticalSignals: "Signaux critiques",
    criticalSignalsSubtitle: "Sujets exigeant l’attention immédiate du propriétaire",
    outboundNotifications: "Notifications sortantes",
    outboundNotificationsSubtitle: "Envois e-mail et WhatsApp en file",
  },
  executiveDigest: {
    title: "Synthèse exécutive",
    description: "Ce qui demande de l’attention maintenant.",
    reviewAlerts: "Examiner les alertes opérationnelles",
    financePressure: "Vérifier la pression financière",
    manageWorkforce: "Gérer le personnel",
    helperLayer: "Ouvrir la couche assistante",
    teamChat: "Chat interne de l’équipe",
    approvalCenter: "Centre d’approbations",
  },
  urgentSignals: {
    title: "Signaux urgents",
    description: "Détection de risques et d’anomalies basée sur des données réelles.",
    openModule: "Ouvrir le module",
  },
  divisionsPanel: {
    title: "Centre de contrôle des divisions",
    description: "Une carte de santé pour chaque division HenryCo, actuelle ou future.",
    viewAll: "Voir toutes les divisions",
    healthLabelTemplate: "Santé {label} · {alerts} alertes · {open} dossiers ouverts",
    revenueLabel: "Revenu",
    staffLabel: "Personnel",
    supportLabel: "Support",
  },
  helperInsights: {
    title: "Recommandations de l’assistant",
    description: "Uniquement des recommandations adossées à des signaux réels.",
    takeAction: "Passer à l’action",
  },
  sensitiveActivity: {
    title: "Activité sensible",
    description: "Audit propriétaire et modifications de personnel récents.",
    unknownTime: "Heure inconnue",
  },
  brand: {
    overview: {
      metadataTitle: "Contrôle marque et sous-domaines · Henry & Co.",
      metadataDescription:
        "Source centrale pour l’identité partagée, la marque des divisions, les blocs de contenu de page et les fiches de présentation des sous-domaines.",
      eyebrow: "Marque et sous-domaines",
      title: "Gestion centralisée de l’identité",
      description:
        "Le tableau de bord propriétaire central est désormais la source pour l’identité d’entreprise partagée, la marque des divisions, les blocs de contenu et les fiches de sous-domaines.",
      companySettingsCta: "Paramètres de l’entreprise",
      divisionBrandingCta: "Marque des divisions",
      sharedIdentityTitle: "Identité d’entreprise partagée",
      sharedIdentityDescription: "Champs de marque actuels issus de la production.",
      brandTitleLabel: "Titre de marque",
      companyNameLabel: "Nom de l’entreprise",
      supportEmailLabel: "E-mail du support",
      baseDomainLabel: "Domaine de base",
      emptyValue: "—",
      defaultBrandTitle: "Henry & Co.",
      defaultCompanyName: "Henry & Co.",
      defaultBaseDomain: "henrycogroup.com",
      managedSurfacesTitle: "Surfaces gérées",
      managedSurfacesDescription:
        "Pages partagées et lignes de division qui relèvent désormais du tableau de bord propriétaire central.",
      divisionRowsLabel: "Lignes de marque par division",
      companyPagesLabel: "Pages d’entreprise partagées",
      hubSiteSettingsLabel: "Lignes de paramètres du site hub",
    },
    pages: {
      metadataTitle: "Pages d’entreprise partagées · Henry & Co.",
      metadataDescription:
        "Contenu héros, métadonnées, CTA et sections structurées des pages publiques, modifiables depuis le tableau de bord propriétaire central.",
      eyebrow: "Pages et contenu",
      title: "Pages d’entreprise partagées",
      description:
        "Contenu héros, métadonnées, CTA et sections structurées des pages publiques sont désormais modifiables depuis le même tableau de bord propriétaire central.",
      panelTitle: "Lignes de contenu de page",
      panelDescription:
        "Les champs JSON restent explicites pour gérer la structure des pages sans outils cachés.",
      saveLabel: "Enregistrer le contenu de la page",
      savingLabel: "Enregistrement…",
      saveSpinnerLabel: "Enregistrement de la page",
      titlePlaceholder: "Titre",
      subtitlePlaceholder: "Sous-titre",
      heroBadgePlaceholder: "Badge héros",
      heroTitlePlaceholder: "Titre héros",
      heroPrimaryLabelPlaceholder: "Libellé du CTA principal",
      heroPrimaryHrefPlaceholder: "Lien du CTA principal",
      heroSecondaryLabelPlaceholder: "Libellé du CTA secondaire",
      heroSecondaryHrefPlaceholder: "Lien du CTA secondaire",
      heroImageUrlPlaceholder: "URL de l’image héros",
      introPlaceholder: "Introduction",
      heroBodyPlaceholder: "Corps du héros",
      seoTitlePlaceholder: "Titre SEO",
      seoDescriptionPlaceholder: "Description SEO",
      statsPlaceholder: '[{"label":"...","value":"..."}]',
      sectionsPlaceholder: '[{"title":"...","body":"..."}]',
      bodyPlaceholder: '[{"layout":"default","title":"..."}]',
    },
    settings: {
      metadataTitle: "Paramètres de marque de l’entreprise · Henry & Co.",
      metadataDescription:
        "Contrôles d’identité, de contact, de SEO et de l’interface du hub qui écrivent directement dans les paramètres partagés de l’entreprise.",
      eyebrow: "Paramètres de marque",
      title: "Contrôles d’identité à l’échelle de l’entreprise",
      description:
        "Ces contrôles écrivent directement dans les lignes de paramètres partagées utilisées par la couche de marque du groupe.",
      companyPanelTitle: "Paramètres de l’entreprise",
      companyPanelDescription:
        "Identité, contacts et valeurs SEO par défaut au niveau de l’entreprise.",
      hubPanelTitle: "Coque du site hub",
      hubPanelDescription: "Ligne actuellement en production pour le site public du groupe.",
      saveCompanyLabel: "Enregistrer les paramètres",
      saveHubLabel: "Enregistrer la coque du hub",
      savingLabel: "Enregistrement…",
      saveSpinnerLabel: "Enregistrement des modifications",
      brandTitlePlaceholder: "Titre de marque",
      companyNamePlaceholder: "Nom de l’entreprise",
      legalNamePlaceholder: "Raison sociale",
      brandSubtitlePlaceholder: "Sous-titre de marque",
      supportEmailPlaceholder: "E-mail du support",
      supportPhonePlaceholder: "Téléphone du support",
      baseDomainPlaceholder: "Domaine de base",
      brandAccentPlaceholder: "#C9A227",
      logoUrlPlaceholder: "URL du logo",
      faviconUrlPlaceholder: "URL du favicon",
      defaultMetaTitlePlaceholder: "Titre meta par défaut",
      brandDescriptionPlaceholder: "Description de la marque",
      footerBlurbPlaceholder: "Mention de pied de page",
      officeAddressPlaceholder: "Adresse du bureau",
      instagramPlaceholder: "URL Instagram",
      linkedinPlaceholder: "URL LinkedIn",
      whatsappPlaceholder: "Numéro WhatsApp",
      xPlaceholder: "URL X",
      hubTitlePlaceholder: "Titre du hub",
      hubSubtitlePlaceholder: "Sous-titre du hub",
      legalCompanyNamePlaceholder: "Raison sociale légale",
      primaryAccentPlaceholder: "Accent principal",
      secondaryAccentPlaceholder: "Accent secondaire",
      lightLogoUrlPlaceholder: "URL du logo clair",
      metaDescriptionPlaceholder: "Description meta",
      footerNoticePlaceholder: "Mention de pied de page",
    },
    subdomains: {
      metadataTitle: "Marque des divisions · Henry & Co.",
      metadataDescription:
        "Sous-domaines, logos et fiches d’identité pour chaque division HenryCo, modifiables depuis le centre de commande propriétaire.",
      eyebrow: "Marque des divisions",
      title: "Sous-domaines, logos et fiches d’identité",
      description:
        "Chaque ligne de division peut désormais être mise à jour centralement depuis le centre de commande propriétaire.",
      panelTitle: "Lignes de division",
      panelDescription:
        "Modifiez la ligne de marque représentant chaque division dans le registre partagé.",
      createHeading: "Créer une nouvelle ligne de division",
      createBlurb:
        "Ajoutez une division en attente ou active directement dans le registre afin que les lignes contrôlées par le propriétaire pilotent la surface globale.",
      createCtaLabel: "Créer la ligne de division",
      saveCtaLabel: "Enregistrer la ligne de division",
      savingLabel: "Enregistrement…",
      saveSpinnerLabel: "Enregistrement de la division",
      slugPlaceholder: "Slug, ex. logistics-labs",
      namePlaceholder: "Nom de la division",
      subdomainPlaceholder: "Sous-domaine",
      primaryUrlPlaceholder: "URL principale",
      domainPlaceholder: "Domaine",
      accentPlaceholder: "#…",
      taglinePlaceholder: "Slogan",
      logoUrlPlaceholder: "URL du logo",
      coverUrlPlaceholder: "URL du média héros / de la couverture",
      descriptionPlaceholder: "Description",
      highlightsPlaceholder: "Points forts, un par ligne",
      whoItsForPlaceholder: "Public cible, un par ligne",
      howItWorksPlaceholder: "Fonctionnement, un par ligne",
      trustPlaceholder: "Éléments de confiance, un par ligne",
      statusPending: "En attente",
      statusActive: "Actif",
      statusPaused: "En pause",
      statusArchived: "Archivé",
    },
  },
};

const HUB_OWNER_COPY_ES: DeepPartial<HubOwnerCopy> = {
  metadata: {
    title: "Centro de mando del propietario · Henry & Co.",
    description:
      "Operaciones, finanzas, plantilla, marca, salud de entrega y orientación al propietario en una sola superficie HenryCo HQ.",
  },
  hero: {
    eyebrow: "Centro de mando central del propietario",
    titleTemplate: "Cerebro corporativo de {company}",
    description:
      "Operaciones, finanzas, plantilla, marca, salud de entrega y orientación al propietario en una sola superficie HenryCo HQ.",
    inviteStaff: "Invitar al personal",
    updateBrand: "Actualizar la marca",
  },
  dataHealth: { title: "Frescura de los datos" },
  situationRoom: {
    title: "Sala de situación ejecutiva",
    description: "Lectura rápida del propietario sobre lo importante.",
    openSupport: "Soporte abierto",
    failedDelivery: "Entregas fallidas",
    whatsappSkipped: "WhatsApp omitido",
    queuedNotifications: "Notificaciones en cola",
    nextStepsEyebrow: "Mejores próximas acciones",
  },
  metrics: {
    divisionsLive: "Divisiones activas",
    divisionsLiveSubtitle: "Supervisadas por el centro de mando",
    recognizedRevenue: "Ingresos reconocidos",
    recognizedRevenueSubtitle: "Care, marketplace y facturas compartidas pagadas",
    openSupport: "Presión de soporte abierto",
    openSupportSubtitle: "Hilos de soporte interdivisión pendientes",
    activeStaff: "Personal activo",
    activeStaffSubtitle: "Miembros autenticados vistos recientemente",
    criticalSignals: "Señales críticas",
    criticalSignalsSubtitle: "Asuntos que requieren atención del propietario ahora",
    outboundNotifications: "Notificaciones salientes",
    outboundNotificationsSubtitle: "Envíos de correo y WhatsApp en cola",
  },
  executiveDigest: {
    title: "Resumen ejecutivo",
    description: "Lo que requiere atención ahora.",
    reviewAlerts: "Revisar alertas operativas",
    financePressure: "Comprobar presión financiera",
    manageWorkforce: "Gestionar la plantilla",
    helperLayer: "Abrir capa asistente",
    teamChat: "Chat interno del equipo",
    approvalCenter: "Centro de aprobaciones",
  },
  urgentSignals: {
    title: "Señales urgentes",
    description: "Detección de riesgos y anomalías basada en datos reales.",
    openModule: "Abrir módulo",
  },
  divisionsPanel: {
    title: "Centro de control de divisiones",
    description: "Un mapa de salud para cada división HenryCo, actual o futura.",
    viewAll: "Ver todas las divisiones",
    healthLabelTemplate: "Salud {label} · {alerts} alertas · {open} pendientes",
    revenueLabel: "Ingresos",
    staffLabel: "Personal",
    supportLabel: "Soporte",
  },
  helperInsights: {
    title: "Recomendaciones del asistente",
    description: "Solo recomendaciones respaldadas por señales reales.",
    takeAction: "Actuar",
  },
  sensitiveActivity: {
    title: "Actividad sensible",
    description: "Auditoría reciente del propietario y cambios de personal.",
    unknownTime: "Hora desconocida",
  },
  brand: {
    overview: {
      metadataTitle: "Control de marca y subdominios · Henry & Co.",
      metadataDescription:
        "Fuente central de la identidad corporativa compartida, la marca por división, los bloques de contenido de página y las fichas de subdominios.",
      eyebrow: "Marca y subdominios",
      title: "Gestión de identidad centralizada",
      description:
        "El panel central del propietario es ahora la fuente de la identidad corporativa, la marca por división, los bloques de contenido y las fichas de subdominio.",
      companySettingsCta: "Ajustes de empresa",
      divisionBrandingCta: "Marca por división",
      sharedIdentityTitle: "Identidad corporativa compartida",
      sharedIdentityDescription: "Campos de marca actuales tomados de producción.",
      brandTitleLabel: "Título de marca",
      companyNameLabel: "Nombre de la empresa",
      supportEmailLabel: "Correo de soporte",
      baseDomainLabel: "Dominio base",
      emptyValue: "—",
      defaultBrandTitle: "Henry & Co.",
      defaultCompanyName: "Henry & Co.",
      defaultBaseDomain: "henrycogroup.com",
      managedSurfacesTitle: "Superficies gestionadas",
      managedSurfacesDescription:
        "Páginas compartidas y filas de división ahora bajo el panel central del propietario.",
      divisionRowsLabel: "Filas de marca por división",
      companyPagesLabel: "Páginas corporativas compartidas",
      hubSiteSettingsLabel: "Filas de ajustes del sitio hub",
    },
    pages: {
      metadataTitle: "Páginas corporativas compartidas · Henry & Co.",
      metadataDescription:
        "Contenido hero, metadatos, CTA y secciones estructuradas de las páginas públicas, editables desde el panel central del propietario.",
      eyebrow: "Páginas y contenido",
      title: "Páginas corporativas compartidas",
      description:
        "El contenido hero, los metadatos, las CTA y las secciones estructuradas ahora se editan desde el mismo panel central del propietario.",
      panelTitle: "Filas de contenido de página",
      panelDescription:
        "Los campos JSON se mantienen explícitos para que el propietario gestione la estructura sin herramientas ocultas.",
      saveLabel: "Guardar contenido de la página",
      savingLabel: "Guardando…",
      saveSpinnerLabel: "Guardando página",
      titlePlaceholder: "Título",
      subtitlePlaceholder: "Subtítulo",
      heroBadgePlaceholder: "Insignia del hero",
      heroTitlePlaceholder: "Título del hero",
      heroPrimaryLabelPlaceholder: "Etiqueta del CTA principal",
      heroPrimaryHrefPlaceholder: "Enlace del CTA principal",
      heroSecondaryLabelPlaceholder: "Etiqueta del CTA secundario",
      heroSecondaryHrefPlaceholder: "Enlace del CTA secundario",
      heroImageUrlPlaceholder: "URL de la imagen del hero",
      introPlaceholder: "Introducción",
      heroBodyPlaceholder: "Cuerpo del hero",
      seoTitlePlaceholder: "Título SEO",
      seoDescriptionPlaceholder: "Descripción SEO",
      statsPlaceholder: '[{"label":"...","value":"..."}]',
      sectionsPlaceholder: '[{"title":"...","body":"..."}]',
      bodyPlaceholder: '[{"layout":"default","title":"..."}]',
    },
    settings: {
      metadataTitle: "Ajustes de marca de la empresa · Henry & Co.",
      metadataDescription:
        "Controles de identidad, contacto, SEO y carcasa del hub que escriben directamente en las filas de ajustes compartidas.",
      eyebrow: "Ajustes de marca",
      title: "Controles de identidad para toda la empresa",
      description:
        "Estos controles escriben directamente en las filas de ajustes compartidas que usa la capa de marca del grupo.",
      companyPanelTitle: "Ajustes de la empresa",
      companyPanelDescription: "Identidad, contacto y valores SEO por defecto de la empresa.",
      hubPanelTitle: "Carcasa del sitio hub",
      hubPanelDescription: "La fila actual en producción para el sitio público del grupo.",
      saveCompanyLabel: "Guardar ajustes de empresa",
      saveHubLabel: "Guardar carcasa del hub",
      savingLabel: "Guardando…",
      saveSpinnerLabel: "Guardando cambios",
      brandTitlePlaceholder: "Título de marca",
      companyNamePlaceholder: "Nombre de la empresa",
      legalNamePlaceholder: "Razón social",
      brandSubtitlePlaceholder: "Subtítulo de marca",
      supportEmailPlaceholder: "Correo de soporte",
      supportPhonePlaceholder: "Teléfono de soporte",
      baseDomainPlaceholder: "Dominio base",
      brandAccentPlaceholder: "#C9A227",
      logoUrlPlaceholder: "URL del logo",
      faviconUrlPlaceholder: "URL del favicon",
      defaultMetaTitlePlaceholder: "Título meta por defecto",
      brandDescriptionPlaceholder: "Descripción de la marca",
      footerBlurbPlaceholder: "Texto del pie de página",
      officeAddressPlaceholder: "Dirección de oficina",
      instagramPlaceholder: "URL de Instagram",
      linkedinPlaceholder: "URL de LinkedIn",
      whatsappPlaceholder: "Número de WhatsApp",
      xPlaceholder: "URL de X",
      hubTitlePlaceholder: "Título del hub",
      hubSubtitlePlaceholder: "Subtítulo del hub",
      legalCompanyNamePlaceholder: "Razón social legal",
      primaryAccentPlaceholder: "Acento primario",
      secondaryAccentPlaceholder: "Acento secundario",
      lightLogoUrlPlaceholder: "URL del logo claro",
      metaDescriptionPlaceholder: "Descripción meta",
      footerNoticePlaceholder: "Aviso de pie de página",
    },
    subdomains: {
      metadataTitle: "Marca por división · Henry & Co.",
      metadataDescription:
        "Subdominios, logos y filas de identidad de cada división HenryCo, editables desde el centro de mando del propietario.",
      eyebrow: "Marca por división",
      title: "Subdominios, logos y filas de identidad",
      description:
        "Cada fila de división puede actualizarse de forma centralizada desde el centro de mando del propietario.",
      panelTitle: "Filas de división",
      panelDescription:
        "Edita la fila de marca que representa a cada división en el registro corporativo compartido.",
      createHeading: "Crear nueva fila de división",
      createBlurb:
        "Añade una división pendiente o activa directamente en el registro para que las filas controladas por el propietario impulsen la superficie corporativa.",
      createCtaLabel: "Crear fila de división",
      saveCtaLabel: "Guardar fila de división",
      savingLabel: "Guardando…",
      saveSpinnerLabel: "Guardando división",
      slugPlaceholder: "Slug, p. ej. logistics-labs",
      namePlaceholder: "Nombre de la división",
      subdomainPlaceholder: "Subdominio",
      primaryUrlPlaceholder: "URL principal",
      domainPlaceholder: "Dominio",
      accentPlaceholder: "#…",
      taglinePlaceholder: "Eslogan",
      logoUrlPlaceholder: "URL del logo",
      coverUrlPlaceholder: "URL de medio hero / portada",
      descriptionPlaceholder: "Descripción",
      highlightsPlaceholder: "Aspectos destacados, uno por línea",
      whoItsForPlaceholder: "Para quién es, uno por línea",
      howItWorksPlaceholder: "Cómo funciona, uno por línea",
      trustPlaceholder: "Elementos de confianza, uno por línea",
      statusPending: "Pendiente",
      statusActive: "Activa",
      statusPaused: "Pausada",
      statusArchived: "Archivada",
    },
  },
};

const HUB_OWNER_COPY_PT: DeepPartial<HubOwnerCopy> = {
  metadata: {
    title: "Centro de comando do proprietário · Henry & Co.",
    description:
      "Operações, finanças, equipa, marca, saúde de entrega e orientação do proprietário numa só superfície HenryCo HQ.",
  },
  hero: {
    eyebrow: "Centro de comando central do proprietário",
    titleTemplate: "Cérebro empresarial de {company}",
    description:
      "Operações, finanças, equipa, marca, saúde de entrega e orientação do proprietário numa só superfície HenryCo HQ.",
    inviteStaff: "Convidar pessoal",
    updateBrand: "Actualizar marca",
  },
  dataHealth: { title: "Actualidade dos dados" },
  situationRoom: {
    title: "Sala de situação executiva",
    description: "Leitura rápida do proprietário sobre o que importa agora.",
    openSupport: "Suporte aberto",
    failedDelivery: "Entregas falhadas",
    whatsappSkipped: "WhatsApp ignorado",
    queuedNotifications: "Notificações em fila",
    nextStepsEyebrow: "Melhores próximas acções do proprietário",
  },
  metrics: {
    divisionsLive: "Divisões activas",
    divisionsLiveSubtitle: "Acompanhadas pelo centro de comando",
    recognizedRevenue: "Receita reconhecida",
    recognizedRevenueSubtitle: "Care, marketplace e facturas partilhadas pagas",
    openSupport: "Pressão de suporte aberto",
    openSupportSubtitle: "Tópicos de suporte interdivisões a aguardar",
    activeStaff: "Equipa activa",
    activeStaffSubtitle: "Membros autenticados vistos recentemente",
    criticalSignals: "Sinais críticos",
    criticalSignalsSubtitle: "Itens que exigem atenção do proprietário agora",
    outboundNotifications: "Notificações enviadas",
    outboundNotificationsSubtitle: "Entregas de e-mail e WhatsApp em fila",
  },
  executiveDigest: {
    title: "Resumo executivo",
    description: "O que requer atenção agora.",
    reviewAlerts: "Rever alertas operacionais",
    financePressure: "Verificar pressão financeira",
    manageWorkforce: "Gerir a equipa",
    helperLayer: "Abrir camada de assistente",
    teamChat: "Chat interno da equipa",
    approvalCenter: "Centro de aprovações",
  },
  urgentSignals: {
    title: "Sinais urgentes",
    description: "Detecção de risco e anomalias baseada em dados reais.",
    openModule: "Abrir módulo",
  },
  divisionsPanel: {
    title: "Centro de controlo de divisões",
    description: "Um mapa de saúde para cada divisão HenryCo, actual ou futura.",
    viewAll: "Ver todas as divisões",
    healthLabelTemplate: "Saúde {label} · {alerts} alertas · {open} pendentes",
    revenueLabel: "Receita",
    staffLabel: "Equipa",
    supportLabel: "Suporte",
  },
  helperInsights: {
    title: "Recomendações do assistente",
    description: "Apenas recomendações apoiadas em sinais reais.",
    takeAction: "Agir",
  },
  sensitiveActivity: {
    title: "Actividade sensível",
    description: "Auditoria recente do proprietário e alterações de pessoal.",
    unknownTime: "Hora desconhecida",
  },
  brand: {
    overview: {
      metadataTitle: "Controlo de marca e subdomínios · Henry & Co.",
      metadataDescription:
        "Fonte central da identidade partilhada, marca de divisão, blocos de conteúdo de página e fichas de subdomínio.",
      eyebrow: "Marca e subdomínios",
      title: "Gestão central da identidade",
      description:
        "O painel central do proprietário é agora a fonte da identidade da empresa partilhada, marca de divisão, blocos de conteúdo e fichas de subdomínio.",
      companySettingsCta: "Definições da empresa",
      divisionBrandingCta: "Marca de divisão",
      sharedIdentityTitle: "Identidade da empresa partilhada",
      sharedIdentityDescription: "Campos actuais da marca, vindos de produção.",
      brandTitleLabel: "Título da marca",
      companyNameLabel: "Nome da empresa",
      supportEmailLabel: "E-mail de suporte",
      baseDomainLabel: "Domínio base",
      emptyValue: "—",
      defaultBrandTitle: "Henry & Co.",
      defaultCompanyName: "Henry & Co.",
      defaultBaseDomain: "henrycogroup.com",
      managedSurfacesTitle: "Superfícies geridas",
      managedSurfacesDescription:
        "Páginas partilhadas e linhas de divisão que agora pertencem ao painel central do proprietário.",
      divisionRowsLabel: "Linhas de marca por divisão",
      companyPagesLabel: "Páginas da empresa partilhadas",
      hubSiteSettingsLabel: "Linhas de definições do site hub",
    },
    pages: {
      metadataTitle: "Páginas partilhadas da empresa · Henry & Co.",
      metadataDescription:
        "Conteúdo do herói, meta-dados, CTAs e secções estruturadas das páginas públicas, editáveis no painel central do proprietário.",
      eyebrow: "Páginas e conteúdo",
      title: "Páginas partilhadas da empresa",
      description:
        "Conteúdo do herói, meta-dados, CTAs e secções estruturadas podem agora ser editados no mesmo painel central do proprietário.",
      panelTitle: "Linhas de conteúdo de página",
      panelDescription:
        "Os campos JSON ficam explícitos para que o proprietário possa gerir a estrutura sem ferramentas ocultas.",
      saveLabel: "Guardar conteúdo da página",
      savingLabel: "A guardar…",
      saveSpinnerLabel: "A guardar página",
      titlePlaceholder: "Título",
      subtitlePlaceholder: "Subtítulo",
      heroBadgePlaceholder: "Distintivo do herói",
      heroTitlePlaceholder: "Título do herói",
      heroPrimaryLabelPlaceholder: "Rótulo do CTA principal",
      heroPrimaryHrefPlaceholder: "Ligação do CTA principal",
      heroSecondaryLabelPlaceholder: "Rótulo do CTA secundário",
      heroSecondaryHrefPlaceholder: "Ligação do CTA secundário",
      heroImageUrlPlaceholder: "URL da imagem do herói",
      introPlaceholder: "Introdução",
      heroBodyPlaceholder: "Corpo do herói",
      seoTitlePlaceholder: "Título SEO",
      seoDescriptionPlaceholder: "Descrição SEO",
      statsPlaceholder: '[{"label":"...","value":"..."}]',
      sectionsPlaceholder: '[{"title":"...","body":"..."}]',
      bodyPlaceholder: '[{"layout":"default","title":"..."}]',
    },
    settings: {
      metadataTitle: "Definições de marca da empresa · Henry & Co.",
      metadataDescription:
        "Controlos de identidade, contacto, SEO e shell do hub que escrevem directamente nas linhas partilhadas da empresa.",
      eyebrow: "Definições de marca",
      title: "Controlos de identidade em toda a empresa",
      description:
        "Estes controlos escrevem directamente nas linhas de definições partilhadas usadas pela camada de marca do grupo.",
      companyPanelTitle: "Definições da empresa",
      companyPanelDescription:
        "Identidade da empresa, contactos e valores SEO por defeito.",
      hubPanelTitle: "Shell do site hub",
      hubPanelDescription: "Linha actualmente em produção para o site público do grupo.",
      saveCompanyLabel: "Guardar definições da empresa",
      saveHubLabel: "Guardar shell do hub",
      savingLabel: "A guardar…",
      saveSpinnerLabel: "A guardar alterações",
      brandTitlePlaceholder: "Título da marca",
      companyNamePlaceholder: "Nome da empresa",
      legalNamePlaceholder: "Designação legal",
      brandSubtitlePlaceholder: "Subtítulo da marca",
      supportEmailPlaceholder: "E-mail de suporte",
      supportPhonePlaceholder: "Telefone de suporte",
      baseDomainPlaceholder: "Domínio base",
      brandAccentPlaceholder: "#C9A227",
      logoUrlPlaceholder: "URL do logótipo",
      faviconUrlPlaceholder: "URL do favicon",
      defaultMetaTitlePlaceholder: "Título meta por defeito",
      brandDescriptionPlaceholder: "Descrição da marca",
      footerBlurbPlaceholder: "Texto do rodapé",
      officeAddressPlaceholder: "Endereço do escritório",
      instagramPlaceholder: "URL do Instagram",
      linkedinPlaceholder: "URL do LinkedIn",
      whatsappPlaceholder: "Número de WhatsApp",
      xPlaceholder: "URL do X",
      hubTitlePlaceholder: "Título do hub",
      hubSubtitlePlaceholder: "Subtítulo do hub",
      legalCompanyNamePlaceholder: "Designação legal da empresa",
      primaryAccentPlaceholder: "Acento principal",
      secondaryAccentPlaceholder: "Acento secundário",
      lightLogoUrlPlaceholder: "URL do logótipo claro",
      metaDescriptionPlaceholder: "Descrição meta",
      footerNoticePlaceholder: "Aviso de rodapé",
    },
    subdomains: {
      metadataTitle: "Marca de divisão · Henry & Co.",
      metadataDescription:
        "Subdomínios, logótipos e linhas de identidade de cada divisão HenryCo, editáveis no centro de comando do proprietário.",
      eyebrow: "Marca de divisão",
      title: "Subdomínios, logótipos e linhas de identidade",
      description:
        "Cada linha de divisão pode agora ser actualizada centralmente a partir do centro de comando do proprietário.",
      panelTitle: "Linhas de divisão",
      panelDescription:
        "Edita a linha de marca que representa cada divisão no registo partilhado da empresa.",
      createHeading: "Criar nova linha de divisão",
      createBlurb:
        "Adicione uma divisão pendente ou activa directamente no registo, para que as linhas controladas pelo proprietário comandem a superfície da empresa.",
      createCtaLabel: "Criar linha de divisão",
      saveCtaLabel: "Guardar linha de divisão",
      savingLabel: "A guardar…",
      saveSpinnerLabel: "A guardar divisão",
      slugPlaceholder: "Slug, p. ex. logistics-labs",
      namePlaceholder: "Nome da divisão",
      subdomainPlaceholder: "Subdomínio",
      primaryUrlPlaceholder: "URL principal",
      domainPlaceholder: "Domínio",
      accentPlaceholder: "#…",
      taglinePlaceholder: "Slogan",
      logoUrlPlaceholder: "URL do logótipo",
      coverUrlPlaceholder: "URL da capa / multimédia do herói",
      descriptionPlaceholder: "Descrição",
      highlightsPlaceholder: "Pontos altos, um por linha",
      whoItsForPlaceholder: "Público-alvo, um por linha",
      howItWorksPlaceholder: "Como funciona, um por linha",
      trustPlaceholder: "Itens de confiança, um por linha",
      statusPending: "Pendente",
      statusActive: "Activa",
      statusPaused: "Em pausa",
      statusArchived: "Arquivada",
    },
  },
};

const HUB_OWNER_COPY_AR: DeepPartial<HubOwnerCopy> = {
  metadata: {
    title: "مركز قيادة المالك · Henry & Co.",
    description:
      "العمليات والمالية والموظفون والعلامة وصحة التسليم وإرشاد المالك على نطاق الشركة، كل ذلك في واجهة واحدة من HenryCo HQ.",
  },
  hero: {
    eyebrow: "مركز قيادة المالك المركزي",
    titleTemplate: "العقل المؤسسي لشركة {company}",
    description:
      "العمليات والمالية والموظفون والعلامة وصحة التسليم وإرشاد المالك على نطاق الشركة، كل ذلك في واجهة واحدة من HenryCo HQ.",
    inviteStaff: "دعوة موظفين",
    updateBrand: "تحديث إعدادات العلامة",
  },
  dataHealth: { title: "حداثة البيانات" },
  situationRoom: {
    title: "غرفة الموقف التنفيذية",
    description: "قراءة سريعة للمالك حول ما يهم الآن.",
    openSupport: "الدعم المفتوح",
    failedDelivery: "تسليم فاشل",
    whatsappSkipped: "تم تخطي واتساب",
    queuedNotifications: "إشعارات في الانتظار",
    nextStepsEyebrow: "أفضل الإجراءات التالية للمالك",
  },
  metrics: {
    divisionsLive: "الأقسام النشطة",
    divisionsLiveSubtitle: "مُتابَعة من مركز القيادة",
    recognizedRevenue: "الإيرادات المعترف بها",
    recognizedRevenueSubtitle: "Care والسوق والفواتير المشتركة المدفوعة",
    openSupport: "ضغط الدعم المفتوح",
    openSupportSubtitle: "محادثات دعم متعددة الأقسام تنتظر التحرك",
    activeStaff: "الموظفون النشطون",
    activeStaffSubtitle: "أعضاء فريق العمل المعتمدون والمرئيون مؤخرًا",
    criticalSignals: "إشارات حرجة",
    criticalSignalsSubtitle: "عناصر تتطلب اهتمام المالك الآن",
    outboundNotifications: "الإشعارات الصادرة",
    outboundNotificationsSubtitle: "بريد إلكتروني وواتساب في قائمة الانتظار",
  },
  executiveDigest: {
    title: "الموجز التنفيذي",
    description: "ما يحتاج إلى الاهتمام الآن.",
    reviewAlerts: "مراجعة التنبيهات التشغيلية",
    financePressure: "فحص الضغط المالي",
    manageWorkforce: "إدارة فريق العمل",
    helperLayer: "فتح طبقة المساعد",
    teamChat: "دردشة الفريق الداخلية",
    approvalCenter: "مركز الموافقات",
  },
  urgentSignals: {
    title: "إشارات عاجلة",
    description: "كشف المخاطر والشذوذ مدعوم بالأدلة من الجداول الحية.",
    openModule: "فتح الوحدة",
  },
  divisionsPanel: {
    title: "مركز التحكم بالأقسام",
    description: "خريطة صحية لكل قسم من أقسام HenryCo حاليًا ومستقبلًا.",
    viewAll: "عرض كل الأقسام",
    healthLabelTemplate: "صحة {label} · {alerts} تنبيهات · {open} عناصر مفتوحة",
    revenueLabel: "الإيرادات",
    staffLabel: "الموظفون",
    supportLabel: "الدعم",
  },
  helperInsights: {
    title: "توصيات المساعد",
    description: "توصيات مدعومة فقط بإشارات حية.",
    takeAction: "اتخاذ إجراء",
  },
  sensitiveActivity: {
    title: "نشاط حساس",
    description: "أحدث عمليات تدقيق المالك وتغييرات الموظفين.",
    unknownTime: "وقت غير معروف",
  },
  brand: {
    overview: {
      metadataTitle: "إدارة العلامة والنطاقات الفرعية · Henry & Co.",
      metadataDescription:
        "المصدر المركزي لهوية الشركة المشتركة وعلامات الأقسام وكتل محتوى الصفحات وسجلات عرض النطاقات الفرعية.",
      eyebrow: "العلامة والنطاقات الفرعية",
      title: "إدارة الهوية المركزية",
      description:
        "أصبحت لوحة المالك المركزية المصدر لهوية الشركة المشتركة، وعلامات الأقسام، وكتل محتوى الصفحات، وسجلات عرض النطاقات الفرعية.",
      companySettingsCta: "إعدادات الشركة",
      divisionBrandingCta: "علامة القسم",
      sharedIdentityTitle: "هوية الشركة المشتركة",
      sharedIdentityDescription: "الحقول الحالية للعلامة من بيئة الإنتاج.",
      brandTitleLabel: "عنوان العلامة",
      companyNameLabel: "اسم الشركة",
      supportEmailLabel: "بريد الدعم",
      baseDomainLabel: "النطاق الأساسي",
      emptyValue: "—",
      defaultBrandTitle: "Henry & Co.",
      defaultCompanyName: "Henry & Co.",
      defaultBaseDomain: "henrycogroup.com",
      managedSurfacesTitle: "السطوح المُدارة",
      managedSurfacesDescription:
        "الصفحات المشتركة وصفوف الأقسام التي صارت تحت إدارة لوحة المالك المركزية.",
      divisionRowsLabel: "صفوف علامات الأقسام",
      companyPagesLabel: "صفحات الشركة المشتركة",
      hubSiteSettingsLabel: "صفوف إعدادات موقع الـ Hub",
    },
    pages: {
      metadataTitle: "صفحات الشركة المشتركة · Henry & Co.",
      metadataDescription:
        "محتوى الواجهة الرئيسية، البيانات الوصفية، أزرار الإجراءات، والأقسام المنظمة، قابلة للتحرير من لوحة المالك المركزية.",
      eyebrow: "الصفحات والمحتوى",
      title: "صفحات الشركة المشتركة",
      description:
        "محتوى الواجهة الرئيسية والبيانات الوصفية وأزرار الإجراءات والأقسام المنظمة أصبحت قابلة للتحرير من لوحة المالك المركزية نفسها.",
      panelTitle: "صفوف محتوى الصفحة",
      panelDescription:
        "تبقى حقول JSON صريحة كي يدير المالك بنية الصفحة دون أدوات خفية.",
      saveLabel: "حفظ محتوى الصفحة",
      savingLabel: "جارٍ الحفظ…",
      saveSpinnerLabel: "جارٍ حفظ الصفحة",
      titlePlaceholder: "العنوان",
      subtitlePlaceholder: "العنوان الفرعي",
      heroBadgePlaceholder: "شارة الواجهة",
      heroTitlePlaceholder: "عنوان الواجهة",
      heroPrimaryLabelPlaceholder: "تسمية الإجراء الرئيسي",
      heroPrimaryHrefPlaceholder: "رابط الإجراء الرئيسي",
      heroSecondaryLabelPlaceholder: "تسمية الإجراء الثانوي",
      heroSecondaryHrefPlaceholder: "رابط الإجراء الثانوي",
      heroImageUrlPlaceholder: "رابط صورة الواجهة",
      introPlaceholder: "المقدمة",
      heroBodyPlaceholder: "نص الواجهة",
      seoTitlePlaceholder: "عنوان SEO",
      seoDescriptionPlaceholder: "وصف SEO",
      statsPlaceholder: '[{"label":"...","value":"..."}]',
      sectionsPlaceholder: '[{"title":"...","body":"..."}]',
      bodyPlaceholder: '[{"layout":"default","title":"..."}]',
    },
    settings: {
      metadataTitle: "إعدادات علامة الشركة · Henry & Co.",
      metadataDescription:
        "ضوابط الهوية والاتصال وSEO وقشرة الـ Hub التي تكتب مباشرةً في صفوف إعدادات الشركة المشتركة.",
      eyebrow: "إعدادات العلامة",
      title: "ضوابط هوية على مستوى الشركة",
      description:
        "تكتب هذه الضوابط مباشرة في صفوف الإعدادات المشتركة التي تستخدمها طبقة علامة المجموعة.",
      companyPanelTitle: "إعدادات الشركة",
      companyPanelDescription: "هوية الشركة العليا وبيانات الاتصال وإعدادات SEO الافتراضية.",
      hubPanelTitle: "قشرة موقع الـ Hub",
      hubPanelDescription: "الصف الحالي قيد الإنتاج لموقع المجموعة العام.",
      saveCompanyLabel: "حفظ إعدادات الشركة",
      saveHubLabel: "حفظ قشرة الـ Hub",
      savingLabel: "جارٍ الحفظ…",
      saveSpinnerLabel: "جارٍ حفظ التغييرات",
      brandTitlePlaceholder: "عنوان العلامة",
      companyNamePlaceholder: "اسم الشركة",
      legalNamePlaceholder: "الاسم القانوني",
      brandSubtitlePlaceholder: "العنوان الفرعي للعلامة",
      supportEmailPlaceholder: "بريد الدعم",
      supportPhonePlaceholder: "هاتف الدعم",
      baseDomainPlaceholder: "النطاق الأساسي",
      brandAccentPlaceholder: "#C9A227",
      logoUrlPlaceholder: "رابط الشعار",
      faviconUrlPlaceholder: "رابط الأيقونة المفضلة",
      defaultMetaTitlePlaceholder: "عنوان الميتا الافتراضي",
      brandDescriptionPlaceholder: "وصف العلامة",
      footerBlurbPlaceholder: "نص التذييل",
      officeAddressPlaceholder: "عنوان المكتب",
      instagramPlaceholder: "رابط إنستغرام",
      linkedinPlaceholder: "رابط لينكدإن",
      whatsappPlaceholder: "رقم واتساب",
      xPlaceholder: "رابط X",
      hubTitlePlaceholder: "عنوان الـ Hub",
      hubSubtitlePlaceholder: "العنوان الفرعي للـ Hub",
      legalCompanyNamePlaceholder: "الاسم القانوني للشركة",
      primaryAccentPlaceholder: "اللون المميز الرئيسي",
      secondaryAccentPlaceholder: "اللون المميز الثانوي",
      lightLogoUrlPlaceholder: "رابط الشعار الفاتح",
      metaDescriptionPlaceholder: "وصف الميتا",
      footerNoticePlaceholder: "إشعار التذييل",
    },
    subdomains: {
      metadataTitle: "علامات الأقسام · Henry & Co.",
      metadataDescription:
        "النطاقات الفرعية والشعارات وصفوف الهوية لكل أقسام HenryCo، قابلة للتحرير مركزيًا من مركز قيادة المالك.",
      eyebrow: "علامة القسم",
      title: "النطاقات الفرعية والشعارات وصفوف الهوية",
      description: "يمكن الآن تحديث كل صف قسم مركزيًا من مركز قيادة المالك.",
      panelTitle: "صفوف الأقسام",
      panelDescription:
        "حرّر صف العلامة الذي يمثّل كل قسم ضمن سجل الشركة المشترك.",
      createHeading: "إنشاء صف قسم جديد",
      createBlurb:
        "أضف قسمًا قيد الانتظار أو نشطًا مباشرةً في السجل ليقود المالك سطح الشركة بكامله.",
      createCtaLabel: "إنشاء صف القسم",
      saveCtaLabel: "حفظ صف القسم",
      savingLabel: "جارٍ الحفظ…",
      saveSpinnerLabel: "جارٍ حفظ القسم",
      slugPlaceholder: "المعرف، مثل logistics-labs",
      namePlaceholder: "اسم القسم",
      subdomainPlaceholder: "النطاق الفرعي",
      primaryUrlPlaceholder: "الرابط الأساسي",
      domainPlaceholder: "النطاق",
      accentPlaceholder: "#…",
      taglinePlaceholder: "الشعار",
      logoUrlPlaceholder: "رابط الشعار",
      coverUrlPlaceholder: "رابط الغلاف / وسائط الواجهة",
      descriptionPlaceholder: "الوصف",
      highlightsPlaceholder: "أبرز النقاط، نقطة في كل سطر",
      whoItsForPlaceholder: "الجمهور المستهدف، عنصر في كل سطر",
      howItWorksPlaceholder: "كيف يعمل، خطوة في كل سطر",
      trustPlaceholder: "عناصر الثقة، عنصر في كل سطر",
      statusPending: "قيد الانتظار",
      statusActive: "نشط",
      statusPaused: "متوقّف",
      statusArchived: "مؤرشف",
    },
  },
};

const HUB_OWNER_COPY_DE: DeepPartial<HubOwnerCopy> = {
  metadata: {
    title: "Eigentümer-Kommandozentrale · Henry & Co.",
    description:
      "Unternehmensweite Operationen, Finanzen, Personal, Marke, Liefergesundheit und Eigentümer-Führung auf einer einzigen HenryCo-HQ-Oberfläche.",
  },
  hero: {
    eyebrow: "Zentrale Eigentümer-Kommandozentrale",
    titleTemplate: "Unternehmensgehirn von {company}",
    description:
      "Unternehmensweite Operationen, Finanzen, Personal, Marke, Liefergesundheit und Eigentümer-Führung auf einer einzigen HenryCo-HQ-Oberfläche.",
    inviteStaff: "Mitarbeitende einladen",
    updateBrand: "Markeneinstellungen aktualisieren",
  },
  dataHealth: { title: "Datenaktualität" },
  situationRoom: {
    title: "Executive-Situationsraum",
    description: "Schneller Eigentümer-Blick auf das, was jetzt wichtig ist.",
    openSupport: "Offener Support",
    failedDelivery: "Fehlgeschlagene Zustellung",
    whatsappSkipped: "WhatsApp übersprungen",
    queuedNotifications: "Wartende Benachrichtigungen",
    nextStepsEyebrow: "Beste nächste Eigentümer-Aktionen",
  },
  metrics: {
    divisionsLive: "Aktive Geschäftsbereiche",
    divisionsLiveSubtitle: "Von der Kommandozentrale überwacht",
    recognizedRevenue: "Erfasster Umsatz",
    recognizedRevenueSubtitle: "Care, Marketplace und bezahlte geteilte Rechnungen",
    openSupport: "Offener Support-Druck",
    openSupportSubtitle: "Bereichsübergreifende Support-Threads, die auf Bewegung warten",
    activeStaff: "Aktive Mitarbeitende",
    activeStaffSubtitle: "Authentifizierte Teammitglieder, kürzlich gesehen",
    criticalSignals: "Kritische Signale",
    criticalSignalsSubtitle: "Punkte, die jetzt die Aufmerksamkeit des Eigentümers benötigen",
    outboundNotifications: "Ausgehende Benachrichtigungen",
    outboundNotificationsSubtitle: "E-Mail- und WhatsApp-Versand in der Warteschlange",
  },
  executiveDigest: {
    title: "Executive-Digest",
    description: "Was jetzt Aufmerksamkeit benötigt.",
    reviewAlerts: "Betriebliche Warnungen prüfen",
    financePressure: "Finanzdruck überprüfen",
    manageWorkforce: "Belegschaft verwalten",
    helperLayer: "Assistenten-Ebene öffnen",
    teamChat: "Interner Team-Chat",
    approvalCenter: "Genehmigungszentrum",
  },
  urgentSignals: {
    title: "Dringende Signale",
    description: "Risiken und Anomalien, belegt durch Daten aus Live-Tabellen.",
    openModule: "Modul öffnen",
  },
  divisionsPanel: {
    title: "Geschäftsbereichs-Kontrollzentrum",
    description: "Eine Gesundheitskarte für jeden aktuellen oder künftigen HenryCo-Bereich.",
    viewAll: "Alle Bereiche anzeigen",
    healthLabelTemplate: "{label}-Zustand · {alerts} Warnungen · {open} offene Punkte",
    revenueLabel: "Umsatz",
    staffLabel: "Personal",
    supportLabel: "Support",
  },
  helperInsights: {
    title: "Assistenten-Empfehlungen",
    description: "Nur Empfehlungen, die durch Live-Signale gestützt sind.",
    takeAction: "Aktion ausführen",
  },
  sensitiveActivity: {
    title: "Sensible Aktivität",
    description: "Aktuelle Eigentümer-Audits und Personaländerungen.",
    unknownTime: "Unbekannte Zeit",
  },
  brand: {
    overview: {
      metadataTitle: "Marken- und Subdomain-Steuerung · Henry & Co.",
      metadataDescription:
        "Zentrale Quelle für die geteilte Unternehmensidentität, Bereichsbranding, Seiten-Content-Blöcke und Subdomain-Datensätze.",
      eyebrow: "Marke und Subdomains",
      title: "Zentrale Identitätsverwaltung",
      description:
        "Das zentrale Eigentümer-Dashboard ist nun die Quelle für die geteilte Unternehmensidentität, Bereichsbranding, Seiten-Content-Blöcke und Subdomain-Datensätze.",
      companySettingsCta: "Unternehmenseinstellungen",
      divisionBrandingCta: "Bereichsbranding",
      sharedIdentityTitle: "Geteilte Unternehmensidentität",
      sharedIdentityDescription: "Aktuelle Markenfelder direkt aus der Produktion.",
      brandTitleLabel: "Markentitel",
      companyNameLabel: "Unternehmensname",
      supportEmailLabel: "Support-E-Mail",
      baseDomainLabel: "Basisdomain",
      emptyValue: "—",
      defaultBrandTitle: "Henry & Co.",
      defaultCompanyName: "Henry & Co.",
      defaultBaseDomain: "henrycogroup.com",
      managedSurfacesTitle: "Verwaltete Oberflächen",
      managedSurfacesDescription:
        "Gemeinsame Seiten und Bereichszeilen, die nun zum zentralen Eigentümer-Dashboard gehören.",
      divisionRowsLabel: "Bereichs-Markenzeilen",
      companyPagesLabel: "Geteilte Unternehmensseiten",
      hubSiteSettingsLabel: "Hub-Site-Einstellungszeilen",
    },
    pages: {
      metadataTitle: "Geteilte Unternehmensseiten · Henry & Co.",
      metadataDescription:
        "Hero-Inhalt, Metadaten, CTAs und strukturierte Abschnitte öffentlicher Seiten – editierbar im zentralen Eigentümer-Dashboard.",
      eyebrow: "Seiten und Inhalte",
      title: "Geteilte Unternehmensseiten",
      description:
        "Hero-Inhalt, Metadaten, CTAs und strukturierte Abschnitte öffentlicher Seiten sind jetzt im selben zentralen Eigentümer-Dashboard editierbar.",
      panelTitle: "Seiteninhaltszeilen",
      panelDescription:
        "JSON-Felder bleiben explizit, damit der Eigentümer Seitenstrukturen ohne verstecktes Tooling pflegt.",
      saveLabel: "Seiteninhalt speichern",
      savingLabel: "Speichern …",
      saveSpinnerLabel: "Seite wird gespeichert",
      titlePlaceholder: "Titel",
      subtitlePlaceholder: "Untertitel",
      heroBadgePlaceholder: "Hero-Badge",
      heroTitlePlaceholder: "Hero-Titel",
      heroPrimaryLabelPlaceholder: "Beschriftung des primären CTA",
      heroPrimaryHrefPlaceholder: "Link des primären CTA",
      heroSecondaryLabelPlaceholder: "Beschriftung des sekundären CTA",
      heroSecondaryHrefPlaceholder: "Link des sekundären CTA",
      heroImageUrlPlaceholder: "URL des Hero-Bilds",
      introPlaceholder: "Einleitung",
      heroBodyPlaceholder: "Hero-Body",
      seoTitlePlaceholder: "SEO-Titel",
      seoDescriptionPlaceholder: "SEO-Beschreibung",
      statsPlaceholder: '[{"label":"...","value":"..."}]',
      sectionsPlaceholder: '[{"title":"...","body":"..."}]',
      bodyPlaceholder: '[{"layout":"default","title":"..."}]',
    },
    settings: {
      metadataTitle: "Unternehmensweite Markeneinstellungen · Henry & Co.",
      metadataDescription:
        "Identitäts-, Kontakt-, SEO- und Hub-Shell-Steuerungen, die direkt in die gemeinsamen Unternehmenszeilen schreiben.",
      eyebrow: "Markeneinstellungen",
      title: "Unternehmensweite Identitätskontrollen",
      description:
        "Diese Steuerungen schreiben direkt in die gemeinsamen Einstellungszeilen, die von der Markenebene der Gruppe genutzt werden.",
      companyPanelTitle: "Unternehmenseinstellungen",
      companyPanelDescription:
        "Identität, Kontakt und SEO-Standardwerte auf Unternehmensebene.",
      hubPanelTitle: "Hub-Site-Shell",
      hubPanelDescription:
        "Die aktuell live geschaltete Hub-Shell-Zeile für die öffentliche Gruppenseite.",
      saveCompanyLabel: "Unternehmenseinstellungen speichern",
      saveHubLabel: "Hub-Shell-Einstellungen speichern",
      savingLabel: "Speichern …",
      saveSpinnerLabel: "Änderungen werden gespeichert",
      brandTitlePlaceholder: "Markentitel",
      companyNamePlaceholder: "Unternehmensname",
      legalNamePlaceholder: "Firmierung",
      brandSubtitlePlaceholder: "Markenuntertitel",
      supportEmailPlaceholder: "Support-E-Mail",
      supportPhonePlaceholder: "Support-Telefon",
      baseDomainPlaceholder: "Basisdomain",
      brandAccentPlaceholder: "#C9A227",
      logoUrlPlaceholder: "Logo-URL",
      faviconUrlPlaceholder: "Favicon-URL",
      defaultMetaTitlePlaceholder: "Standard-Meta-Titel",
      brandDescriptionPlaceholder: "Markenbeschreibung",
      footerBlurbPlaceholder: "Footer-Text",
      officeAddressPlaceholder: "Bürodresse",
      instagramPlaceholder: "Instagram-URL",
      linkedinPlaceholder: "LinkedIn-URL",
      whatsappPlaceholder: "WhatsApp-Nummer",
      xPlaceholder: "X-URL",
      hubTitlePlaceholder: "Hub-Titel",
      hubSubtitlePlaceholder: "Hub-Untertitel",
      legalCompanyNamePlaceholder: "Firmierung",
      primaryAccentPlaceholder: "Primärer Akzent",
      secondaryAccentPlaceholder: "Sekundärer Akzent",
      lightLogoUrlPlaceholder: "URL des hellen Logos",
      metaDescriptionPlaceholder: "Meta-Beschreibung",
      footerNoticePlaceholder: "Footer-Hinweis",
    },
    subdomains: {
      metadataTitle: "Bereichsbranding · Henry & Co.",
      metadataDescription:
        "Subdomains, Logos und Identitätszeilen jedes HenryCo-Bereichs, zentral aus dem Eigentümer-Command-Center editierbar.",
      eyebrow: "Bereichsbranding",
      title: "Subdomains, Logos und Identitätszeilen",
      description:
        "Jede Bereichszeile lässt sich nun zentral aus dem Eigentümer-Command-Center aktualisieren.",
      panelTitle: "Bereichszeilen",
      panelDescription:
        "Bearbeite die Markenzeile, die jeden Bereich im gemeinsamen Unternehmensregister repräsentiert.",
      createHeading: "Neue Bereichszeile anlegen",
      createBlurb:
        "Lege eine ausstehende oder aktive Bereichszeile direkt im Register an, damit eigentümergesteuerte Zeilen die gesamte Unternehmensoberfläche steuern.",
      createCtaLabel: "Bereichszeile anlegen",
      saveCtaLabel: "Bereichszeile speichern",
      savingLabel: "Speichern …",
      saveSpinnerLabel: "Bereich wird gespeichert",
      slugPlaceholder: "Slug, z. B. logistics-labs",
      namePlaceholder: "Bereichsname",
      subdomainPlaceholder: "Subdomain",
      primaryUrlPlaceholder: "Primäre URL",
      domainPlaceholder: "Domain",
      accentPlaceholder: "#…",
      taglinePlaceholder: "Slogan",
      logoUrlPlaceholder: "Logo-URL",
      coverUrlPlaceholder: "URL für Hero-Medien / Cover",
      descriptionPlaceholder: "Beschreibung",
      highlightsPlaceholder: "Highlights, eines pro Zeile",
      whoItsForPlaceholder: "Zielgruppe, eine pro Zeile",
      howItWorksPlaceholder: "So funktioniert es, ein Schritt pro Zeile",
      trustPlaceholder: "Vertrauenselemente, eines pro Zeile",
      statusPending: "Ausstehend",
      statusActive: "Aktiv",
      statusPaused: "Pausiert",
      statusArchived: "Archiviert",
    },
  },
};

const HUB_OWNER_COPY_IT: DeepPartial<HubOwnerCopy> = {
  metadata: {
    title: "Centro di comando del proprietario · Henry & Co.",
    description:
      "Operazioni, finanza, personale, brand, salute delle consegne e guida del proprietario a livello aziendale, riuniti in un’unica superficie HenryCo HQ.",
  },
  hero: {
    eyebrow: "Centro di comando centrale del proprietario",
    titleTemplate: "Cervello aziendale di {company}",
    description:
      "Operazioni, finanza, personale, brand, salute delle consegne e guida del proprietario a livello aziendale, riuniti in un’unica superficie HenryCo HQ.",
    inviteStaff: "Invita personale",
    updateBrand: "Aggiorna impostazioni brand",
  },
  dataHealth: { title: "Freschezza dei dati" },
  situationRoom: {
    title: "Sala situazione esecutiva",
    description: "Lettura rapida del proprietario su ciò che conta ora.",
    openSupport: "Supporto aperto",
    failedDelivery: "Consegne fallite",
    whatsappSkipped: "WhatsApp saltati",
    queuedNotifications: "Notifiche in coda",
    nextStepsEyebrow: "Migliori prossime azioni del proprietario",
  },
  metrics: {
    divisionsLive: "Divisioni attive",
    divisionsLiveSubtitle: "Monitorate dal centro di comando",
    recognizedRevenue: "Ricavi riconosciuti",
    recognizedRevenueSubtitle: "Care, marketplace e fatture condivise pagate",
    openSupport: "Pressione del supporto aperto",
    openSupportSubtitle: "Conversazioni di supporto interdivisione in attesa",
    activeStaff: "Personale attivo",
    activeStaffSubtitle: "Membri autenticati visti di recente",
    criticalSignals: "Segnali critici",
    criticalSignalsSubtitle: "Voci che richiedono ora l’attenzione del proprietario",
    outboundNotifications: "Notifiche in uscita",
    outboundNotificationsSubtitle: "Invii e-mail e WhatsApp in coda",
  },
  executiveDigest: {
    title: "Sintesi esecutiva",
    description: "Cosa richiede attenzione adesso.",
    reviewAlerts: "Esamina avvisi operativi",
    financePressure: "Controlla la pressione finanziaria",
    manageWorkforce: "Gestisci il personale",
    helperLayer: "Apri il livello assistente",
    teamChat: "Chat interna del team",
    approvalCenter: "Centro approvazioni",
  },
  urgentSignals: {
    title: "Segnali urgenti",
    description: "Rilevamento di rischi e anomalie supportato da dati reali.",
    openModule: "Apri modulo",
  },
  divisionsPanel: {
    title: "Centro di controllo delle divisioni",
    description: "Una mappa di salute per ogni divisione HenryCo, attuale o futura.",
    viewAll: "Vedi tutte le divisioni",
    healthLabelTemplate: "Salute {label} · {alerts} avvisi · {open} in sospeso",
    revenueLabel: "Ricavi",
    staffLabel: "Personale",
    supportLabel: "Supporto",
  },
  helperInsights: {
    title: "Raccomandazioni dell’assistente",
    description: "Solo raccomandazioni supportate da segnali reali.",
    takeAction: "Agisci",
  },
  sensitiveActivity: {
    title: "Attività sensibili",
    description: "Audit recenti del proprietario e modifiche del personale.",
    unknownTime: "Ora sconosciuta",
  },
  brand: {
    overview: {
      metadataTitle: "Controllo marchio e sottodomini · Henry & Co.",
      metadataDescription:
        "Fonte centrale per identità aziendale condivisa, branding di divisione, blocchi di contenuto di pagina e schede di sottodominio.",
      eyebrow: "Marchio e sottodomini",
      title: "Gestione centralizzata dell’identità",
      description:
        "La dashboard centrale del proprietario è ora la fonte per l’identità aziendale condivisa, il branding di divisione, i blocchi di contenuto di pagina e le schede di sottodominio.",
      companySettingsCta: "Impostazioni azienda",
      divisionBrandingCta: "Branding di divisione",
      sharedIdentityTitle: "Identità aziendale condivisa",
      sharedIdentityDescription: "Campi del marchio attualmente in produzione.",
      brandTitleLabel: "Titolo del marchio",
      companyNameLabel: "Nome dell’azienda",
      supportEmailLabel: "E-mail di supporto",
      baseDomainLabel: "Dominio base",
      emptyValue: "—",
      defaultBrandTitle: "Henry & Co.",
      defaultCompanyName: "Henry & Co.",
      defaultBaseDomain: "henrycogroup.com",
      managedSurfacesTitle: "Superfici gestite",
      managedSurfacesDescription:
        "Pagine condivise e righe di divisione che ora appartengono alla dashboard centrale del proprietario.",
      divisionRowsLabel: "Righe del marchio di divisione",
      companyPagesLabel: "Pagine aziendali condivise",
      hubSiteSettingsLabel: "Righe delle impostazioni del sito hub",
    },
    pages: {
      metadataTitle: "Pagine aziendali condivise · Henry & Co.",
      metadataDescription:
        "Contenuto hero, metadati, CTA e sezioni strutturate delle pagine pubbliche, modificabili dalla dashboard centrale del proprietario.",
      eyebrow: "Pagine e contenuti",
      title: "Pagine aziendali condivise",
      description:
        "Contenuto hero, metadati, CTA e sezioni strutturate sono ora modificabili dalla stessa dashboard centrale del proprietario.",
      panelTitle: "Righe di contenuto di pagina",
      panelDescription:
        "I campi JSON restano espliciti, così il proprietario gestisce la struttura senza strumenti nascosti.",
      saveLabel: "Salva il contenuto della pagina",
      savingLabel: "Salvataggio…",
      saveSpinnerLabel: "Salvataggio della pagina",
      titlePlaceholder: "Titolo",
      subtitlePlaceholder: "Sottotitolo",
      heroBadgePlaceholder: "Etichetta hero",
      heroTitlePlaceholder: "Titolo hero",
      heroPrimaryLabelPlaceholder: "Etichetta CTA principale",
      heroPrimaryHrefPlaceholder: "Link CTA principale",
      heroSecondaryLabelPlaceholder: "Etichetta CTA secondaria",
      heroSecondaryHrefPlaceholder: "Link CTA secondaria",
      heroImageUrlPlaceholder: "URL immagine hero",
      introPlaceholder: "Introduzione",
      heroBodyPlaceholder: "Testo hero",
      seoTitlePlaceholder: "Titolo SEO",
      seoDescriptionPlaceholder: "Descrizione SEO",
      statsPlaceholder: '[{"label":"...","value":"..."}]',
      sectionsPlaceholder: '[{"title":"...","body":"..."}]',
      bodyPlaceholder: '[{"layout":"default","title":"..."}]',
    },
    settings: {
      metadataTitle: "Impostazioni marchio aziendale · Henry & Co.",
      metadataDescription:
        "Controlli di identità, contatto, SEO e shell del hub che scrivono direttamente nelle righe condivise dell’azienda.",
      eyebrow: "Impostazioni marchio",
      title: "Controlli di identità a livello aziendale",
      description:
        "Questi controlli scrivono direttamente nelle righe di impostazioni condivise usate dal livello di marchio del gruppo.",
      companyPanelTitle: "Impostazioni aziendali",
      companyPanelDescription: "Identità aziendale, contatti e valori SEO predefiniti.",
      hubPanelTitle: "Shell del sito hub",
      hubPanelDescription: "Riga attualmente live per il sito pubblico del gruppo.",
      saveCompanyLabel: "Salva impostazioni aziendali",
      saveHubLabel: "Salva shell del hub",
      savingLabel: "Salvataggio…",
      saveSpinnerLabel: "Salvataggio modifiche",
      brandTitlePlaceholder: "Titolo del marchio",
      companyNamePlaceholder: "Nome dell’azienda",
      legalNamePlaceholder: "Ragione sociale",
      brandSubtitlePlaceholder: "Sottotitolo del marchio",
      supportEmailPlaceholder: "E-mail di supporto",
      supportPhonePlaceholder: "Telefono di supporto",
      baseDomainPlaceholder: "Dominio base",
      brandAccentPlaceholder: "#C9A227",
      logoUrlPlaceholder: "URL del logo",
      faviconUrlPlaceholder: "URL della favicon",
      defaultMetaTitlePlaceholder: "Titolo meta predefinito",
      brandDescriptionPlaceholder: "Descrizione del marchio",
      footerBlurbPlaceholder: "Testo del piè di pagina",
      officeAddressPlaceholder: "Indirizzo ufficio",
      instagramPlaceholder: "URL Instagram",
      linkedinPlaceholder: "URL LinkedIn",
      whatsappPlaceholder: "Numero WhatsApp",
      xPlaceholder: "URL X",
      hubTitlePlaceholder: "Titolo hub",
      hubSubtitlePlaceholder: "Sottotitolo hub",
      legalCompanyNamePlaceholder: "Ragione sociale",
      primaryAccentPlaceholder: "Accento primario",
      secondaryAccentPlaceholder: "Accento secondario",
      lightLogoUrlPlaceholder: "URL del logo chiaro",
      metaDescriptionPlaceholder: "Descrizione meta",
      footerNoticePlaceholder: "Avviso del piè di pagina",
    },
    subdomains: {
      metadataTitle: "Branding di divisione · Henry & Co.",
      metadataDescription:
        "Sottodomini, loghi e righe identitarie di ogni divisione HenryCo, modificabili centralmente dal centro di comando del proprietario.",
      eyebrow: "Branding di divisione",
      title: "Sottodomini, loghi e righe identitarie",
      description:
        "Ogni riga di divisione può ora essere aggiornata centralmente dal centro di comando del proprietario.",
      panelTitle: "Righe di divisione",
      panelDescription:
        "Modifica la riga di marchio che rappresenta ogni divisione nel registro aziendale condiviso.",
      createHeading: "Crea nuova riga di divisione",
      createBlurb:
        "Aggiungi una divisione in attesa o attiva direttamente nel registro affinché le righe controllate dal proprietario guidino l’intera superficie aziendale.",
      createCtaLabel: "Crea riga di divisione",
      saveCtaLabel: "Salva riga di divisione",
      savingLabel: "Salvataggio…",
      saveSpinnerLabel: "Salvataggio divisione",
      slugPlaceholder: "Slug, es. logistics-labs",
      namePlaceholder: "Nome della divisione",
      subdomainPlaceholder: "Sottodominio",
      primaryUrlPlaceholder: "URL primario",
      domainPlaceholder: "Dominio",
      accentPlaceholder: "#…",
      taglinePlaceholder: "Slogan",
      logoUrlPlaceholder: "URL del logo",
      coverUrlPlaceholder: "URL media hero / copertina",
      descriptionPlaceholder: "Descrizione",
      highlightsPlaceholder: "Elementi salienti, uno per riga",
      whoItsForPlaceholder: "Pubblico, uno per riga",
      howItWorksPlaceholder: "Come funziona, uno per riga",
      trustPlaceholder: "Elementi di fiducia, uno per riga",
      statusPending: "In attesa",
      statusActive: "Attiva",
      statusPaused: "In pausa",
      statusArchived: "Archiviata",
    },
  },
};

const HUB_OWNER_COPY_ZH: DeepPartial<HubOwnerCopy> = {
  metadata: {
    title: "业主指挥中心 · Henry & Co.",
    description: "在一个 HenryCo HQ 界面中,统一掌握全公司的运营、财务、人员、品牌、交付健康以及业主指引。",
  },
  hero: {
    eyebrow: "中央业主指挥中心",
    titleTemplate: "{company} 公司大脑",
    description: "在一个 HenryCo HQ 界面中,统一掌握全公司的运营、财务、人员、品牌、交付健康以及业主指引。",
    inviteStaff: "邀请员工",
    updateBrand: "更新品牌设置",
  },
  dataHealth: { title: "数据新鲜度" },
  situationRoom: {
    title: "高管态势室",
    description: "业主快速了解当前重要事项。",
    openSupport: "待处理支持",
    failedDelivery: "投递失败",
    whatsappSkipped: "已跳过 WhatsApp",
    queuedNotifications: "排队通知",
    nextStepsEyebrow: "业主下一步最佳动作",
  },
  metrics: {
    divisionsLive: "活跃业务部门",
    divisionsLiveSubtitle: "由指挥中心追踪",
    recognizedRevenue: "已确认收入",
    recognizedRevenueSubtitle: "Care、市场以及已付款的共享发票",
    openSupport: "待处理支持压力",
    openSupportSubtitle: "跨部门待跟进的支持工单",
    activeStaff: "活跃员工",
    activeStaffSubtitle: "近期可见的已认证团队成员",
    criticalSignals: "关键信号",
    criticalSignalsSubtitle: "目前需要业主关注的事项",
    outboundNotifications: "外发通知",
    outboundNotificationsSubtitle: "排队的邮件与 WhatsApp 投递",
  },
  executiveDigest: {
    title: "高管摘要",
    description: "当前需要关注的内容。",
    reviewAlerts: "查看运营告警",
    financePressure: "查看财务压力",
    manageWorkforce: "管理团队",
    helperLayer: "打开助手层",
    teamChat: "团队内部聊天",
    approvalCenter: "审批中心",
  },
  urgentSignals: {
    title: "紧急信号",
    description: "基于实时数据的风险与异常检测。",
    openModule: "打开模块",
  },
  divisionsPanel: {
    title: "业务部门控制中心",
    description: "为每个当前或未来的 HenryCo 业务部门提供一张健康地图。",
    viewAll: "查看所有业务部门",
    healthLabelTemplate: "{label} 健康 · {alerts} 个告警 · {open} 个待处理",
    revenueLabel: "收入",
    staffLabel: "人员",
    supportLabel: "支持",
  },
  helperInsights: {
    title: "助手推荐",
    description: "仅展示由实时信号支持的建议。",
    takeAction: "采取行动",
  },
  sensitiveActivity: {
    title: "敏感活动",
    description: "近期面向业主的审计与员工变更。",
    unknownTime: "时间未知",
  },
  brand: {
    overview: {
      metadataTitle: "品牌与子域控制 · Henry & Co.",
      metadataDescription: "共享公司形象、业务部门品牌、页面内容模块与子域呈现记录的中央来源。",
      eyebrow: "品牌与子域",
      title: "集中式形象管理",
      description: "中央业主仪表盘现在是共享公司形象、业务部门品牌、页面内容模块以及子域呈现记录的来源。",
      companySettingsCta: "公司设置",
      divisionBrandingCta: "业务部门品牌",
      sharedIdentityTitle: "共享公司形象",
      sharedIdentityDescription: "来自生产环境的当前顶层品牌字段。",
      brandTitleLabel: "品牌名称",
      companyNameLabel: "公司名称",
      supportEmailLabel: "支持邮箱",
      baseDomainLabel: "基础域名",
      emptyValue: "—",
      defaultBrandTitle: "Henry & Co.",
      defaultCompanyName: "Henry & Co.",
      defaultBaseDomain: "henrycogroup.com",
      managedSurfacesTitle: "受管理的界面",
      managedSurfacesDescription: "共享页面与业务部门行,现归属于中央业主仪表盘。",
      divisionRowsLabel: "业务部门品牌行",
      companyPagesLabel: "共享公司页面",
      hubSiteSettingsLabel: "Hub 站点设置行",
    },
    pages: {
      metadataTitle: "共享公司页面 · Henry & Co.",
      metadataDescription: "公开页面的 hero 内容、元数据、CTA 与结构化版块,可在中央业主仪表盘中编辑。",
      eyebrow: "页面与内容",
      title: "共享公司页面",
      description: "公开页面的 hero 内容、元数据、CTA 与结构化版块,现可在同一个中央业主仪表盘中编辑。",
      panelTitle: "页面内容行",
      panelDescription: "JSON 字段保持显式,业主可在没有隐藏工具的情况下管理页面结构。",
      saveLabel: "保存页面内容",
      savingLabel: "保存中…",
      saveSpinnerLabel: "正在保存页面",
      titlePlaceholder: "标题",
      subtitlePlaceholder: "副标题",
      heroBadgePlaceholder: "Hero 徽章",
      heroTitlePlaceholder: "Hero 标题",
      heroPrimaryLabelPlaceholder: "主 CTA 标签",
      heroPrimaryHrefPlaceholder: "主 CTA 链接",
      heroSecondaryLabelPlaceholder: "次 CTA 标签",
      heroSecondaryHrefPlaceholder: "次 CTA 链接",
      heroImageUrlPlaceholder: "Hero 图片 URL",
      introPlaceholder: "引言",
      heroBodyPlaceholder: "Hero 正文",
      seoTitlePlaceholder: "SEO 标题",
      seoDescriptionPlaceholder: "SEO 描述",
      statsPlaceholder: '[{"label":"...","value":"..."}]',
      sectionsPlaceholder: '[{"title":"...","body":"..."}]',
      bodyPlaceholder: '[{"layout":"default","title":"..."}]',
    },
    settings: {
      metadataTitle: "公司品牌设置 · Henry & Co.",
      metadataDescription: "识别、联系、SEO 与 Hub 外壳控件,直接写入共享的公司设置行。",
      eyebrow: "品牌设置",
      title: "公司级形象控制",
      description: "这些控件直接写入集团品牌层使用的共享设置行。",
      companyPanelTitle: "公司设置",
      companyPanelDescription: "公司顶层形象、联系方式与默认 SEO 值。",
      hubPanelTitle: "Hub 站点外壳",
      hubPanelDescription: "当前在线的集团公开站点 Hub 外壳行。",
      saveCompanyLabel: "保存公司设置",
      saveHubLabel: "保存 Hub 外壳设置",
      savingLabel: "保存中…",
      saveSpinnerLabel: "正在保存更改",
      brandTitlePlaceholder: "品牌名称",
      companyNamePlaceholder: "公司名称",
      legalNamePlaceholder: "法定名称",
      brandSubtitlePlaceholder: "品牌副标题",
      supportEmailPlaceholder: "支持邮箱",
      supportPhonePlaceholder: "支持电话",
      baseDomainPlaceholder: "基础域名",
      brandAccentPlaceholder: "#C9A227",
      logoUrlPlaceholder: "Logo URL",
      faviconUrlPlaceholder: "Favicon URL",
      defaultMetaTitlePlaceholder: "默认 Meta 标题",
      brandDescriptionPlaceholder: "品牌描述",
      footerBlurbPlaceholder: "页脚说明",
      officeAddressPlaceholder: "办公地址",
      instagramPlaceholder: "Instagram URL",
      linkedinPlaceholder: "LinkedIn URL",
      whatsappPlaceholder: "WhatsApp 号码",
      xPlaceholder: "X URL",
      hubTitlePlaceholder: "Hub 标题",
      hubSubtitlePlaceholder: "Hub 副标题",
      legalCompanyNamePlaceholder: "公司法定名称",
      primaryAccentPlaceholder: "主强调色",
      secondaryAccentPlaceholder: "次强调色",
      lightLogoUrlPlaceholder: "浅色 Logo URL",
      metaDescriptionPlaceholder: "Meta 描述",
      footerNoticePlaceholder: "页脚提示",
    },
    subdomains: {
      metadataTitle: "业务部门品牌 · Henry & Co.",
      metadataDescription: "每个 HenryCo 业务部门的子域、Logo 与身份行,可在业主指挥中心集中编辑。",
      eyebrow: "业务部门品牌",
      title: "子域、Logo 与身份行",
      description: "每条业务部门行现在均可在业主指挥中心集中更新。",
      panelTitle: "业务部门行",
      panelDescription: "编辑代表共享公司注册表中各业务部门的品牌行。",
      createHeading: "创建新的业务部门行",
      createBlurb: "直接在注册表中新增待定或活跃的业务部门,让业主控制的行驱动整个公司界面。",
      createCtaLabel: "创建业务部门行",
      saveCtaLabel: "保存业务部门行",
      savingLabel: "保存中…",
      saveSpinnerLabel: "正在保存业务部门",
      slugPlaceholder: "标识,例如 logistics-labs",
      namePlaceholder: "业务部门名称",
      subdomainPlaceholder: "子域",
      primaryUrlPlaceholder: "主 URL",
      domainPlaceholder: "域名",
      accentPlaceholder: "#…",
      taglinePlaceholder: "标语",
      logoUrlPlaceholder: "Logo URL",
      coverUrlPlaceholder: "Hero 媒体 / 封面 URL",
      descriptionPlaceholder: "描述",
      highlightsPlaceholder: "亮点,每行一条",
      whoItsForPlaceholder: "目标受众,每行一条",
      howItWorksPlaceholder: "运作方式,每行一条",
      trustPlaceholder: "信任要素,每行一条",
      statusPending: "待定",
      statusActive: "活跃",
      statusPaused: "已暂停",
      statusArchived: "已归档",
    },
  },
};

const HUB_OWNER_COPY_HI: DeepPartial<HubOwnerCopy> = {
  metadata: {
    title: "मालिक कमांड सेंटर · Henry & Co.",
    description:
      "कंपनी-व्यापी संचालन, वित्त, स्टाफिंग, ब्रांड, डिलीवरी स्वास्थ्य और मालिक मार्गदर्शन एक ही HenryCo HQ सतह पर।",
  },
  hero: {
    eyebrow: "केंद्रीय मालिक कमांड सेंटर",
    titleTemplate: "{company} कंपनी का दिमाग",
    description:
      "कंपनी-व्यापी संचालन, वित्त, स्टाफिंग, ब्रांड, डिलीवरी स्वास्थ्य और मालिक मार्गदर्शन एक ही HenryCo HQ सतह पर।",
    inviteStaff: "स्टाफ़ आमंत्रित करें",
    updateBrand: "ब्रांड सेटिंग्स अपडेट करें",
  },
  dataHealth: { title: "डेटा ताज़ापन" },
  situationRoom: {
    title: "कार्यकारी स्थिति कक्ष",
    description: "अभी क्या ज़रूरी है, इसकी मालिक के लिए त्वरित जानकारी।",
    openSupport: "खुला सपोर्ट",
    failedDelivery: "विफल डिलीवरी",
    whatsappSkipped: "WhatsApp छोड़ा गया",
    queuedNotifications: "कतार में सूचनाएँ",
    nextStepsEyebrow: "मालिक के लिए अगले सर्वोत्तम कदम",
  },
  metrics: {
    divisionsLive: "सक्रिय डिवीज़न",
    divisionsLiveSubtitle: "कमांड सेंटर द्वारा निगरानी",
    recognizedRevenue: "मान्यता प्राप्त राजस्व",
    recognizedRevenueSubtitle: "Care, मार्केटप्लेस और भुगतान किए गए साझा इनवॉइस",
    openSupport: "खुले सपोर्ट का दबाव",
    openSupportSubtitle: "विभिन्न डिवीज़न में रुके हुए सपोर्ट थ्रेड",
    activeStaff: "सक्रिय स्टाफ़",
    activeStaffSubtitle: "हाल में दिखे प्रामाणित टीम सदस्य",
    criticalSignals: "महत्वपूर्ण संकेत",
    criticalSignalsSubtitle: "जिन्हें अभी मालिक के ध्यान की आवश्यकता है",
    outboundNotifications: "बाहर जाने वाली सूचनाएँ",
    outboundNotificationsSubtitle: "कतार में ईमेल और WhatsApp डिलीवरी",
  },
  executiveDigest: {
    title: "कार्यकारी सारांश",
    description: "अभी किस पर ध्यान चाहिए।",
    reviewAlerts: "ऑपरेशनल अलर्ट्स की समीक्षा",
    financePressure: "वित्तीय दबाव जाँचें",
    manageWorkforce: "स्टाफ़ का प्रबंधन करें",
    helperLayer: "सहायक परत खोलें",
    teamChat: "टीम आंतरिक चैट",
    approvalCenter: "स्वीकृति केंद्र",
  },
  urgentSignals: {
    title: "तत्काल संकेत",
    description: "लाइव टेबल से जोखिम और विसंगति की प्रमाण-आधारित पहचान।",
    openModule: "मॉड्यूल खोलें",
  },
  divisionsPanel: {
    title: "डिवीज़न नियंत्रण केंद्र",
    description: "हर वर्तमान या भविष्य के HenryCo डिवीज़न के लिए एक स्वास्थ्य मानचित्र।",
    viewAll: "सभी डिवीज़न देखें",
    healthLabelTemplate: "{label} स्वास्थ्य · {alerts} अलर्ट · {open} खुले कार्य",
    revenueLabel: "राजस्व",
    staffLabel: "स्टाफ़",
    supportLabel: "सपोर्ट",
  },
  helperInsights: {
    title: "सहायक सिफारिशें",
    description: "केवल लाइव संकेतों से समर्थित सिफारिशें।",
    takeAction: "कार्रवाई करें",
  },
  sensitiveActivity: {
    title: "संवेदनशील गतिविधि",
    description: "हाल के मालिक-स्तरीय ऑडिट और स्टाफ़ परिवर्तन।",
    unknownTime: "समय अज्ञात",
  },
  brand: {
    overview: {
      metadataTitle: "ब्रांड और सबडोमेन नियंत्रण · Henry & Co.",
      metadataDescription:
        "साझा कंपनी पहचान, डिवीज़न ब्रांडिंग, पेज-स्तरीय सामग्री ब्लॉक्स और सबडोमेन प्रस्तुति रिकॉर्ड के लिए केंद्रीय स्रोत।",
      eyebrow: "ब्रांड और सबडोमेन",
      title: "केंद्रीकृत पहचान प्रबंधन",
      description:
        "केंद्रीय मालिक डैशबोर्ड अब साझा कंपनी पहचान, डिवीज़न ब्रांडिंग, पेज सामग्री ब्लॉक्स और सबडोमेन रिकॉर्ड का स्रोत है।",
      companySettingsCta: "कंपनी सेटिंग्स",
      divisionBrandingCta: "डिवीज़न ब्रांडिंग",
      sharedIdentityTitle: "साझा कंपनी पहचान",
      sharedIdentityDescription: "उत्पादन से वर्तमान शीर्ष-स्तर के ब्रांड फ़ील्ड।",
      brandTitleLabel: "ब्रांड शीर्षक",
      companyNameLabel: "कंपनी का नाम",
      supportEmailLabel: "सपोर्ट ईमेल",
      baseDomainLabel: "बेस डोमेन",
      emptyValue: "—",
      defaultBrandTitle: "Henry & Co.",
      defaultCompanyName: "Henry & Co.",
      defaultBaseDomain: "henrycogroup.com",
      managedSurfacesTitle: "प्रबंधित सतहें",
      managedSurfacesDescription:
        "साझा पेज और डिवीज़न पंक्तियाँ जो अब केंद्रीय मालिक डैशबोर्ड के अधीन हैं।",
      divisionRowsLabel: "डिवीज़न ब्रांड पंक्तियाँ",
      companyPagesLabel: "साझा कंपनी पेज",
      hubSiteSettingsLabel: "Hub साइट सेटिंग्स पंक्तियाँ",
    },
    pages: {
      metadataTitle: "साझा कंपनी पेज · Henry & Co.",
      metadataDescription:
        "सार्वजनिक पेजों के हीरो कंटेंट, मेटा, CTAs और संरचित सेक्शन — केंद्रीय मालिक डैशबोर्ड से संपादन योग्य।",
      eyebrow: "पेज और सामग्री",
      title: "साझा कंपनी पेज",
      description:
        "सार्वजनिक पेजों के हीरो कंटेंट, मेटा, CTAs और संरचित सेक्शन अब उसी केंद्रीय मालिक डैशबोर्ड से संपादन योग्य हैं।",
      panelTitle: "पेज सामग्री पंक्तियाँ",
      panelDescription:
        "JSON फ़ील्ड स्पष्ट रहते हैं ताकि मालिक बिना छिपे टूल के पेज संरचना संभाल सके।",
      saveLabel: "पेज सामग्री सहेजें",
      savingLabel: "सहेजा जा रहा है…",
      saveSpinnerLabel: "पेज सहेजा जा रहा है",
      titlePlaceholder: "शीर्षक",
      subtitlePlaceholder: "उपशीर्षक",
      heroBadgePlaceholder: "हीरो बैज",
      heroTitlePlaceholder: "हीरो शीर्षक",
      heroPrimaryLabelPlaceholder: "मुख्य CTA लेबल",
      heroPrimaryHrefPlaceholder: "मुख्य CTA लिंक",
      heroSecondaryLabelPlaceholder: "द्वितीयक CTA लेबल",
      heroSecondaryHrefPlaceholder: "द्वितीयक CTA लिंक",
      heroImageUrlPlaceholder: "हीरो छवि URL",
      introPlaceholder: "परिचय",
      heroBodyPlaceholder: "हीरो मुख्य पाठ",
      seoTitlePlaceholder: "SEO शीर्षक",
      seoDescriptionPlaceholder: "SEO विवरण",
      statsPlaceholder: '[{"label":"...","value":"..."}]',
      sectionsPlaceholder: '[{"title":"...","body":"..."}]',
      bodyPlaceholder: '[{"layout":"default","title":"..."}]',
    },
    settings: {
      metadataTitle: "कंपनी-व्यापी ब्रांड सेटिंग्स · Henry & Co.",
      metadataDescription:
        "पहचान, संपर्क, SEO और Hub शेल नियंत्रण जो साझा कंपनी सेटिंग्स पंक्तियों में सीधे लिखते हैं।",
      eyebrow: "ब्रांड सेटिंग्स",
      title: "कंपनी-व्यापी पहचान नियंत्रण",
      description:
        "ये नियंत्रण समूह ब्रांड परत द्वारा उपयोग की जाने वाली साझा सेटिंग्स पंक्तियों में सीधे लिखते हैं।",
      companyPanelTitle: "कंपनी सेटिंग्स",
      companyPanelDescription:
        "शीर्ष-स्तर की कंपनी पहचान, संपर्क और SEO डिफ़ॉल्ट।",
      hubPanelTitle: "Hub साइट शेल",
      hubPanelDescription: "सार्वजनिक समूह साइट के लिए मौजूदा लाइव Hub शेल पंक्ति।",
      saveCompanyLabel: "कंपनी सेटिंग्स सहेजें",
      saveHubLabel: "Hub शेल सेटिंग्स सहेजें",
      savingLabel: "सहेजा जा रहा है…",
      saveSpinnerLabel: "परिवर्तन सहेजे जा रहे हैं",
      brandTitlePlaceholder: "ब्रांड शीर्षक",
      companyNamePlaceholder: "कंपनी का नाम",
      legalNamePlaceholder: "क़ानूनी नाम",
      brandSubtitlePlaceholder: "ब्रांड उपशीर्षक",
      supportEmailPlaceholder: "सपोर्ट ईमेल",
      supportPhonePlaceholder: "सपोर्ट फ़ोन",
      baseDomainPlaceholder: "बेस डोमेन",
      brandAccentPlaceholder: "#C9A227",
      logoUrlPlaceholder: "लोगो URL",
      faviconUrlPlaceholder: "Favicon URL",
      defaultMetaTitlePlaceholder: "डिफ़ॉल्ट मेटा शीर्षक",
      brandDescriptionPlaceholder: "ब्रांड विवरण",
      footerBlurbPlaceholder: "फ़ुटर टेक्स्ट",
      officeAddressPlaceholder: "कार्यालय पता",
      instagramPlaceholder: "Instagram URL",
      linkedinPlaceholder: "LinkedIn URL",
      whatsappPlaceholder: "WhatsApp नंबर",
      xPlaceholder: "X URL",
      hubTitlePlaceholder: "Hub शीर्षक",
      hubSubtitlePlaceholder: "Hub उपशीर्षक",
      legalCompanyNamePlaceholder: "कंपनी का क़ानूनी नाम",
      primaryAccentPlaceholder: "मुख्य एक्सेंट",
      secondaryAccentPlaceholder: "द्वितीयक एक्सेंट",
      lightLogoUrlPlaceholder: "हल्के लोगो का URL",
      metaDescriptionPlaceholder: "मेटा विवरण",
      footerNoticePlaceholder: "फ़ुटर सूचना",
    },
    subdomains: {
      metadataTitle: "डिवीज़न ब्रांडिंग · Henry & Co.",
      metadataDescription:
        "प्रत्येक HenryCo डिवीज़न के सबडोमेन, लोगो और पहचान पंक्तियाँ — मालिक कमांड सेंटर से केंद्रीय रूप से संपादन योग्य।",
      eyebrow: "डिवीज़न ब्रांडिंग",
      title: "सबडोमेन, लोगो और पहचान पंक्तियाँ",
      description:
        "अब प्रत्येक डिवीज़न पंक्ति को मालिक कमांड सेंटर से केंद्रीय रूप से अपडेट किया जा सकता है।",
      panelTitle: "डिवीज़न पंक्तियाँ",
      panelDescription:
        "साझा कंपनी रजिस्टर में प्रत्येक डिवीज़न का प्रतिनिधित्व करने वाली ब्रांड पंक्ति संपादित करें।",
      createHeading: "नई डिवीज़न पंक्ति बनाएँ",
      createBlurb:
        "रजिस्टर में सीधे एक लंबित या सक्रिय डिवीज़न जोड़ें ताकि मालिक-नियंत्रित पंक्तियाँ व्यापक कंपनी सतह को संचालित करें।",
      createCtaLabel: "डिवीज़न पंक्ति बनाएँ",
      saveCtaLabel: "डिवीज़न पंक्ति सहेजें",
      savingLabel: "सहेजा जा रहा है…",
      saveSpinnerLabel: "डिवीज़न सहेजी जा रही है",
      slugPlaceholder: "स्लग, उदा. logistics-labs",
      namePlaceholder: "डिवीज़न का नाम",
      subdomainPlaceholder: "सबडोमेन",
      primaryUrlPlaceholder: "मुख्य URL",
      domainPlaceholder: "डोमेन",
      accentPlaceholder: "#…",
      taglinePlaceholder: "टैगलाइन",
      logoUrlPlaceholder: "लोगो URL",
      coverUrlPlaceholder: "हीरो मीडिया / कवर URL",
      descriptionPlaceholder: "विवरण",
      highlightsPlaceholder: "मुख्य बिंदु, प्रति पंक्ति एक",
      whoItsForPlaceholder: "किसके लिए, प्रति पंक्ति एक",
      howItWorksPlaceholder: "यह कैसे काम करता है, प्रति पंक्ति एक",
      trustPlaceholder: "विश्वास तत्व, प्रति पंक्ति एक",
      statusPending: "लंबित",
      statusActive: "सक्रिय",
      statusPaused: "रुकी हुई",
      statusArchived: "संग्रहीत",
    },
  },
};

const HUB_OWNER_COPY_IG: DeepPartial<HubOwnerCopy> = {
  metadata: {
    title: "Ebe nchịkwa onye nwe · Henry & Co.",
    description:
      "Ọrụ ụlọ ọrụ niile, ego, ndị ọrụ, akara, ahụike nnyefe, na nduzi onye nwe n'otu elu HenryCo HQ.",
  },
  hero: {
    eyebrow: "Ebe nchịkwa etiti onye nwe",
    titleTemplate: "Ụbụrụ ụlọ ọrụ {company}",
    description:
      "Ọrụ ụlọ ọrụ niile, ego, ndị ọrụ, akara, ahụike nnyefe, na nduzi onye nwe n'otu elu HenryCo HQ.",
    inviteStaff: "Kpọọ ndị ọrụ",
    updateBrand: "Melite ntọala akara",
  },
  dataHealth: { title: "Ọhụrụ nke data" },
  situationRoom: {
    title: "Ụlọ ọnọdụ nke ndị isi",
    description: "Nkọwa ngwa ngwa maka onye nwe gbasara ihe dị mkpa ugbu a.",
    openSupport: "Nkwado emepere emepe",
    failedDelivery: "Nnyefe dara",
    whatsappSkipped: "Agafere WhatsApp",
    queuedNotifications: "Ọkwa nọ n'usoro",
    nextStepsEyebrow: "Omume kachasị mma maka onye nwe",
  },
  metrics: {
    divisionsLive: "Ngalaba na-arụ ọrụ",
    divisionsLiveSubtitle: "Ebe nchịkwa na-eleba anya na ya",
    recognizedRevenue: "Ego anabatara",
    recognizedRevenueSubtitle: "Care, ahịa na ụgwọ kekọrịtara akwụrụ",
    openSupport: "Mpịkọta nkwado emepere",
    openSupportSubtitle: "Eziokwu nkwado n'ọtụtụ ngalaba na-eche ngagharị",
    activeStaff: "Ndị ọrụ na-arụ ọrụ",
    activeStaffSubtitle: "Ndị otu enwetara nakwa hụrụ n'oge na-adịbeghị anya",
    criticalSignals: "Mgbaàmà dị oké mkpa",
    criticalSignalsSubtitle: "Ihe chọrọ nlebara anya onye nwe ugbu a",
    outboundNotifications: "Ọkwa na-apụ apụ",
    outboundNotificationsSubtitle: "Email na WhatsApp na-eche oge nnyefe",
  },
  executiveDigest: {
    title: "Nchịkọta isi",
    description: "Ihe chọrọ nlebara anya ugbu a.",
    reviewAlerts: "Lelee mkpọsa ọrụ",
    financePressure: "Lelee mpịkọta ego",
    manageWorkforce: "Jikwaa ndị ọrụ",
    helperLayer: "Mepee oyi ohere enyemaka",
    teamChat: "Mkparịta ụka ime nke otu",
    approvalCenter: "Ebe nkwado",
  },
  urgentSignals: {
    title: "Mgbaàmà ngwa ngwa",
    description: "Nchọpụta ihe ize ndụ na ihe na-adịghị mma sitere na data ndị dị ndụ.",
    openModule: "Mepee modul",
  },
  divisionsPanel: {
    title: "Ebe nchịkwa ngalaba",
    description: "Otu map ahụike maka ngalaba HenryCo ọ bụla, ugbu a ma ọ bụ n'ọdịnihu.",
    viewAll: "Lelee ngalaba niile",
    healthLabelTemplate: "Ahụike {label} · {alerts} mkpọsa · {open} ihe emeghe",
    revenueLabel: "Ego batara",
    staffLabel: "Ndị ọrụ",
    supportLabel: "Nkwado",
  },
  helperInsights: {
    title: "Ndụmọdụ enyemaka",
    description: "Naanị ndụmọdụ mgbaàmà ndị dị ndụ kwadoro.",
    takeAction: "Mee ihe",
  },
  sensitiveActivity: {
    title: "Ọrụ siri ike",
    description: "Nyocha ọhụrụ maka onye nwe na mgbanwe ndị ọrụ.",
    unknownTime: "Oge a na-amaghị",
  },
  brand: {
    overview: {
      metadataTitle: "Njikwa akara na subdomain · Henry & Co.",
      metadataDescription:
        "Ebe etiti maka njirimara ụlọ ọrụ a na-ekekọrịta, akara ngalaba, ngọngọ ọdịnaya ibe, na ndekọ ngosipụta subdomain.",
      eyebrow: "Akara na subdomain",
      title: "Njikwa njirimara nke etiti",
      description:
        "Dashboard onye nwe etiti ugbu a bụ ebe maka njirimara ụlọ ọrụ a na-ekekọrịta, akara ngalaba, ngọngọ ọdịnaya ibe, na ndekọ ngosipụta subdomain.",
      companySettingsCta: "Ntọala ụlọ ọrụ",
      divisionBrandingCta: "Akara ngalaba",
      sharedIdentityTitle: "Njirimara ụlọ ọrụ a na-ekekọrịta",
      sharedIdentityDescription: "Ubi akara dị ugbu a sitere na mmepụta.",
      brandTitleLabel: "Aha akara",
      companyNameLabel: "Aha ụlọ ọrụ",
      supportEmailLabel: "Email nkwado",
      baseDomainLabel: "Ngalaba ntọala",
      emptyValue: "—",
      defaultBrandTitle: "Henry & Co.",
      defaultCompanyName: "Henry & Co.",
      defaultBaseDomain: "henrycogroup.com",
      managedSurfacesTitle: "Elu a na-ejikwa",
      managedSurfacesDescription:
        "Ibe nkekọrịta na ahịrị ngalaba ndị ugbu a dị n'okpuru dashboard onye nwe etiti.",
      divisionRowsLabel: "Ahịrị akara ngalaba",
      companyPagesLabel: "Ibe ụlọ ọrụ a na-ekekọrịta",
      hubSiteSettingsLabel: "Ahịrị ntọala saịtị Hub",
    },
    pages: {
      metadataTitle: "Ibe ụlọ ọrụ a na-ekekọrịta · Henry & Co.",
      metadataDescription:
        "Ọdịnaya hero, meta, CTA, na nkebi ahaziri ahazi nke ibe ọha — enwere ike idezi na dashboard onye nwe etiti.",
      eyebrow: "Ibe na Ọdịnaya",
      title: "Ibe ụlọ ọrụ a na-ekekọrịta",
      description:
        "Ọdịnaya hero, meta, CTA, na nkebi ahaziri ahazi nke ibe ọha enwere ike idezi ugbu a na otu dashboard onye nwe etiti.",
      panelTitle: "Ahịrị ọdịnaya ibe",
      panelDescription:
        "Ubi JSON na-anọgide na-egosipụta ka onye nwe nwee ike ijikwa nhazi ibe na-enweghị ngwá ọrụ zoro ezo.",
      saveLabel: "Chekwaa ọdịnaya ibe",
      savingLabel: "Na-echekwa…",
      saveSpinnerLabel: "Na-echekwa ibe",
      titlePlaceholder: "Aha",
      subtitlePlaceholder: "Aha nke abụọ",
      heroBadgePlaceholder: "Akara hero",
      heroTitlePlaceholder: "Aha hero",
      heroPrimaryLabelPlaceholder: "Akara CTA isi",
      heroPrimaryHrefPlaceholder: "Njikọ CTA isi",
      heroSecondaryLabelPlaceholder: "Akara CTA nke abụọ",
      heroSecondaryHrefPlaceholder: "Njikọ CTA nke abụọ",
      heroImageUrlPlaceholder: "URL onyonyo hero",
      introPlaceholder: "Mmalite",
      heroBodyPlaceholder: "Ahụ hero",
      seoTitlePlaceholder: "Aha SEO",
      seoDescriptionPlaceholder: "Nkọwa SEO",
      statsPlaceholder: '[{"label":"...","value":"..."}]',
      sectionsPlaceholder: '[{"title":"...","body":"..."}]',
      bodyPlaceholder: '[{"layout":"default","title":"..."}]',
    },
    settings: {
      metadataTitle: "Ntọala akara ụlọ ọrụ niile · Henry & Co.",
      metadataDescription:
        "Njikwa njirimara, kọntakt, SEO, na shell hub na-edebanye ozugbo na ahịrị ntọala ụlọ ọrụ a na-ekekọrịta.",
      eyebrow: "Ntọala akara",
      title: "Njikwa njirimara nke ụlọ ọrụ niile",
      description:
        "Njikwa ndị a na-edebanye ozugbo na ahịrị ntọala a na-ekekọrịta nke ọkwa akara nke otu na-eji.",
      companyPanelTitle: "Ntọala ụlọ ọrụ",
      companyPanelDescription:
        "Njirimara elu, kọntakt, na ụkpụrụ SEO mbụ nke ụlọ ọrụ.",
      hubPanelTitle: "Shell saịtị Hub",
      hubPanelDescription: "Ahịrị shell Hub na-arụ ọrụ ugbu a maka saịtị ọha nke otu.",
      saveCompanyLabel: "Chekwaa ntọala ụlọ ọrụ",
      saveHubLabel: "Chekwaa ntọala shell Hub",
      savingLabel: "Na-echekwa…",
      saveSpinnerLabel: "Na-echekwa mgbanwe",
      brandTitlePlaceholder: "Aha akara",
      companyNamePlaceholder: "Aha ụlọ ọrụ",
      legalNamePlaceholder: "Aha gọọmenti",
      brandSubtitlePlaceholder: "Aha akara nke abụọ",
      supportEmailPlaceholder: "Email nkwado",
      supportPhonePlaceholder: "Ekwentị nkwado",
      baseDomainPlaceholder: "Ngalaba ntọala",
      brandAccentPlaceholder: "#C9A227",
      logoUrlPlaceholder: "URL akara ngosi",
      faviconUrlPlaceholder: "URL Favicon",
      defaultMetaTitlePlaceholder: "Aha meta mbụ",
      brandDescriptionPlaceholder: "Nkọwa akara",
      footerBlurbPlaceholder: "Ihe ndekọ ala ibe",
      officeAddressPlaceholder: "Adres ọfịs",
      instagramPlaceholder: "URL Instagram",
      linkedinPlaceholder: "URL LinkedIn",
      whatsappPlaceholder: "Nọmba WhatsApp",
      xPlaceholder: "URL X",
      hubTitlePlaceholder: "Aha Hub",
      hubSubtitlePlaceholder: "Aha Hub nke abụọ",
      legalCompanyNamePlaceholder: "Aha iwu nke ụlọ ọrụ",
      primaryAccentPlaceholder: "Akara isi",
      secondaryAccentPlaceholder: "Akara nke abụọ",
      lightLogoUrlPlaceholder: "URL akara ngosi dị ọkụ",
      metaDescriptionPlaceholder: "Nkọwa meta",
      footerNoticePlaceholder: "Ọkwa ala ibe",
    },
    subdomains: {
      metadataTitle: "Akara ngalaba · Henry & Co.",
      metadataDescription:
        "Subdomain, akara ngosi, na ahịrị njirimara maka ngalaba HenryCo ọ bụla, enwere ike idezi n'etiti site na ebe nchịkwa onye nwe.",
      eyebrow: "Akara ngalaba",
      title: "Subdomain, akara ngosi, na ahịrị njirimara",
      description:
        "Enwere ike imelite ahịrị ngalaba ọ bụla n'etiti ugbu a site na ebe nchịkwa onye nwe.",
      panelTitle: "Ahịrị ngalaba",
      panelDescription:
        "Dezie ahịrị akara nke na-anọchi anya ngalaba ọ bụla na ndekọ ụlọ ọrụ a na-ekekọrịta.",
      createHeading: "Mepụta ahịrị ngalaba ọhụrụ",
      createBlurb:
        "Tinye ngalaba na-echere ma ọ bụ na-arụ ọrụ ozugbo na ndekọ ka ahịrị nke onye nwe na-achịkwa kpọọ elu ụlọ ọrụ niile.",
      createCtaLabel: "Mepụta ahịrị ngalaba",
      saveCtaLabel: "Chekwaa ahịrị ngalaba",
      savingLabel: "Na-echekwa…",
      saveSpinnerLabel: "Na-echekwa ngalaba",
      slugPlaceholder: "Slug, dịka logistics-labs",
      namePlaceholder: "Aha ngalaba",
      subdomainPlaceholder: "Subdomain",
      primaryUrlPlaceholder: "URL isi",
      domainPlaceholder: "Ngalaba ịntanetị",
      accentPlaceholder: "#…",
      taglinePlaceholder: "Akara okwu",
      logoUrlPlaceholder: "URL akara ngosi",
      coverUrlPlaceholder: "URL mgbidi / mgbasa hero",
      descriptionPlaceholder: "Nkọwa",
      highlightsPlaceholder: "Ihe ndị kacha mma, otu n'ahịrị ọ bụla",
      whoItsForPlaceholder: "Ndị ọ dịịrị, otu n'ahịrị ọ bụla",
      howItWorksPlaceholder: "Ka ọ na-arụ ọrụ, otu n'ahịrị ọ bụla",
      trustPlaceholder: "Ihe ntụkwasị obi, otu n'ahịrị ọ bụla",
      statusPending: "Na-echere",
      statusActive: "Na-arụ ọrụ",
      statusPaused: "Akwụsịrị",
      statusArchived: "Ekpedoro",
    },
  },
};

const HUB_OWNER_COPY_YO: DeepPartial<HubOwnerCopy> = {
  metadata: {
    title: "Ibùdó àṣẹ onílé · Henry & Co.",
    description:
      "Ìṣiṣẹ́ gbogbo ilé-iṣẹ́, ìnáwó, òṣìṣẹ́, àmì-ẹ̀rí, ìlera ìfijíṣẹ́, àti ìtọ́sọ́nà onílé ní orí ojú-òṣẹ́ HenryCo HQ kan ṣoṣo.",
  },
  hero: {
    eyebrow: "Ibùdó àṣẹ àárín onílé",
    titleTemplate: "Ọpọlọ ilé-iṣẹ́ {company}",
    description:
      "Ìṣiṣẹ́ gbogbo ilé-iṣẹ́, ìnáwó, òṣìṣẹ́, àmì-ẹ̀rí, ìlera ìfijíṣẹ́, àti ìtọ́sọ́nà onílé ní orí ojú-òṣẹ́ HenryCo HQ kan ṣoṣo.",
    inviteStaff: "Pe òṣìṣẹ́",
    updateBrand: "Tún ètò àmì-ẹ̀rí ṣe",
  },
  dataHealth: { title: "Ìtuntun dátà" },
  situationRoom: {
    title: "Iyàrá ipò àjùmọ̀ olórí",
    description: "Ìwòyé yára fún onílé lórí ohun tó ṣe pàtàkì báyìí.",
    openSupport: "Ìtìlẹ́yìn tó ṣí sílẹ̀",
    failedDelivery: "Ìfijíṣẹ́ tó kùnà",
    whatsappSkipped: "WhatsApp tí a fò",
    queuedNotifications: "Ìfitónilétí tó ń dúró",
    nextStepsEyebrow: "Ìṣe tó dára jùlọ tókàn fún onílé",
  },
  metrics: {
    divisionsLive: "Ìpín tó ń ṣiṣẹ́",
    divisionsLiveSubtitle: "Ibùdó àṣẹ ń tọpinpin wọn",
    recognizedRevenue: "Owó tó ti gba",
    recognizedRevenueSubtitle: "Care, ọjà àti àwọn ìwé owó pàṣípààrọ̀ tí a sanwó",
    openSupport: "Ìpá ìtìlẹ́yìn tó ṣí sílẹ̀",
    openSupportSubtitle: "Awọn ìjíròrò ìtìlẹ́yìn ọlọ́pọ̀ ìpín tó ń dúró",
    activeStaff: "Òṣìṣẹ́ tó ń ṣiṣẹ́",
    activeStaffSubtitle: "Àwọn ọmọ ẹgbẹ́ tí a fọwọ́sí, tí a rí láìpẹ́",
    criticalSignals: "Àmì pàtàkì",
    criticalSignalsSubtitle: "Ohun tó nílò àfiyèsí onílé báyìí",
    outboundNotifications: "Ìfitónilétí tí a ń rán síta",
    outboundNotificationsSubtitle: "Ìmélì àti WhatsApp tó ń dúró fún ìfijíṣẹ́",
  },
  executiveDigest: {
    title: "Àkójọpọ̀ olórí",
    description: "Ohun tó nílò àfiyèsí báyìí.",
    reviewAlerts: "Yẹ àwọn ìkìlọ̀ iṣẹ́",
    financePressure: "Yẹ ìpá ìnáwó",
    manageWorkforce: "Dari òṣìṣẹ́",
    helperLayer: "Ṣí ìpele olùrànlọ́wọ́",
    teamChat: "Ìfọrọ̀wánilẹ́nuwò inú ẹgbẹ́",
    approvalCenter: "Ibùdó ìfọwọ́sí",
  },
  urgentSignals: {
    title: "Àmì kíákíá",
    description: "Ìdámọ̀ ewu àti àìpé tí a kọ́lé sórí dátà aláàyè.",
    openModule: "Ṣí módúlì",
  },
  divisionsPanel: {
    title: "Ibùdó ìṣàkóso ìpín",
    description: "Aworan ìlera kan fún gbogbo ìpín HenryCo, lọ́wọ́lọ́wọ́ tàbí ọjọ́ ọ̀la.",
    viewAll: "Wo gbogbo ìpín",
    healthLabelTemplate: "Ìlera {label} · {alerts} ìkìlọ̀ · {open} àwọn iṣẹ́ tó ṣí sílẹ̀",
    revenueLabel: "Owó",
    staffLabel: "Òṣìṣẹ́",
    supportLabel: "Ìtìlẹ́yìn",
  },
  helperInsights: {
    title: "Àbá olùrànlọ́wọ́",
    description: "Àwọn àbá tí àmì aláàyè ṣe àtìlẹ́yìn fún nìkan.",
    takeAction: "Ṣe ìṣe",
  },
  sensitiveActivity: {
    title: "Iṣẹ́ tó ní àbọ̀",
    description: "Ìṣàyẹ̀wò onílé àti àyípadà òṣìṣẹ́ láìpẹ́.",
    unknownTime: "Àkókò tí a kò mọ̀",
  },
};

const HUB_OWNER_COPY_HA: DeepPartial<HubOwnerCopy> = {
  metadata: {
    title: "Cibiyar umarni ta mai kamfani · Henry & Co.",
    description:
      "Aiyukan kamfani gabaki ɗaya, kuɗi, ma’aikata, alama, lafiyar bayarwa, da jagorancin mai kamfani a fuska guda na HenryCo HQ.",
  },
  hero: {
    eyebrow: "Cibiyar umarni ta tsakiya ta mai kamfani",
    titleTemplate: "Kwakwalwar kamfanin {company}",
    description:
      "Aiyukan kamfani gabaki ɗaya, kuɗi, ma’aikata, alama, lafiyar bayarwa, da jagorancin mai kamfani a fuska guda na HenryCo HQ.",
    inviteStaff: "Gayyaci ma’aikata",
    updateBrand: "Sabunta saitin alama",
  },
  dataHealth: { title: "Sabuwar bayanai" },
  situationRoom: {
    title: "Dakin yanayin shugabanci",
    description: "Saurin karatu ga mai kamfani game da abin da ke da muhimmanci yanzu.",
    openSupport: "Tallafi a buɗe",
    failedDelivery: "Bayarwa da ta gaza",
    whatsappSkipped: "An tsallake WhatsApp",
    queuedNotifications: "Sanarwa a layi",
    nextStepsEyebrow: "Mafi kyawun ayyuka na gaba ga mai kamfani",
  },
  metrics: {
    divisionsLive: "Sashe masu aiki",
    divisionsLiveSubtitle: "Cibiyar umarni tana lura da su",
    recognizedRevenue: "Kuɗin da aka tabbatar",
    recognizedRevenueSubtitle: "Care, kasuwa, da haɗakar lissafin da aka biya",
    openSupport: "Matsin lamba na tallafin a buɗe",
    openSupportSubtitle: "Tattaunawar tallafi ta sashe-sashe da ke jiran motsi",
    activeStaff: "Ma’aikata masu aiki",
    activeStaffSubtitle: "Mambobin ƙungiyar da aka tabbatar, an gan su kwanan nan",
    criticalSignals: "Alamomi masu mahimmanci",
    criticalSignalsSubtitle: "Abubuwan da ke buƙatar hankalin mai kamfani yanzu",
    outboundNotifications: "Sanarwa masu fita",
    outboundNotificationsSubtitle: "Imel da WhatsApp da ke jira",
  },
  executiveDigest: {
    title: "Taƙaitaccen bayani na shugabanci",
    description: "Abin da ke buƙatar hankali yanzu.",
    reviewAlerts: "Duba faɗakarwar aiki",
    financePressure: "Duba matsin lamba na kuɗi",
    manageWorkforce: "Sarrafa ma’aikata",
    helperLayer: "Buɗe ƙofar mai taimako",
    teamChat: "Tattaunawar cikin ƙungiyar",
    approvalCenter: "Cibiyar amincewa",
  },
  urgentSignals: {
    title: "Alamomi masu gaggawa",
    description: "Gano haɗari da rashin daidaito daga teburin da ke aiki.",
    openModule: "Buɗe na’ura",
  },
  divisionsPanel: {
    title: "Cibiyar sarrafa sashe",
    description: "Taswirar lafiya guda ga kowane sashe na HenryCo, na yanzu ko na gaba.",
    viewAll: "Duba dukkan sashe",
    healthLabelTemplate: "Lafiyar {label} · {alerts} faɗakarwa · {open} buɗaɗɗun abubuwa",
    revenueLabel: "Kuɗi",
    staffLabel: "Ma’aikata",
    supportLabel: "Tallafi",
  },
  helperInsights: {
    title: "Shawarwarin mai taimako",
    description: "Shawarwari ne kawai waɗanda alamomin rayuwa ke goyon bayansu.",
    takeAction: "Ɗauki mataki",
  },
  sensitiveActivity: {
    title: "Aiki mai mahimmanci",
    description: "Sabbin bincike na mai kamfani da canje-canjen ma’aikata.",
    unknownTime: "Lokaci da ba a sani ba",
  },
};

const HUB_OWNER_LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<HubOwnerCopy>>> = {
  fr: HUB_OWNER_COPY_FR,
  es: HUB_OWNER_COPY_ES,
  pt: HUB_OWNER_COPY_PT,
  ar: HUB_OWNER_COPY_AR,
  de: HUB_OWNER_COPY_DE,
  it: HUB_OWNER_COPY_IT,
  zh: HUB_OWNER_COPY_ZH,
  hi: HUB_OWNER_COPY_HI,
  ig: HUB_OWNER_COPY_IG,
  yo: HUB_OWNER_COPY_YO,
  ha: HUB_OWNER_COPY_HA,
};

export function getHubOwnerCopy(locale: AppLocale): HubOwnerCopy {
  const overrides = HUB_OWNER_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      HUB_OWNER_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as HubOwnerCopy;
  }
  return HUB_OWNER_COPY_EN;
}

/** @internal */
export function __dangerouslyGetEnglishHubOwnerCopy(): HubOwnerCopy {
  return HUB_OWNER_COPY_EN;
}
