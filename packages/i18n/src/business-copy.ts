import type { AppLocale } from "./locales";
import { deepMergeMessages } from "./merge-messages";

/**
 * V3-57 — surface:business copy (Pattern A typed keys).
 *
 * EN is the source of truth and the full typed object; every other locale is a
 * `Partial<BusinessCopy>` merged over EN. Curated overrides are supplied for the
 * DeepL-supported locales we can translate reliably (fr/es/pt/de/it/ar); the
 * remaining locales (zh/hi via runtime DeepL; ig/yo/ha which DeepL does not
 * support) fall back to EN — the established repo pattern (see studio-copy.ts).
 *
 * Templated strings use {placeholder} tokens resolved by formatBusinessTemplate.
 */
export type BusinessCopy = {
  common: {
    business: string;
    personal: string;
    actingAsPersonal: string;
    actingAsBusiness: string; // {name}
    switchToPersonal: string;
    switchToBusiness: string;
    save: string;
    cancel: string;
    loading: string;
    back: string;
  };
  status: {
    pending: string;
    active: string;
    suspended: string;
    closed: string;
  };
  partnerType: {
    marketplace_seller: string;
    service_provider: string;
    employer: string;
    studio_client: string;
    logistics_shipper: string;
  };
  roles: {
    owner: string;
    admin: string;
    member: string;
  };
  profile: {
    title: string;
    editTitle: string;
    legalName: string;
    tradingName: string;
    registration: string;
    country: string;
    partnerType: string;
    status: string;
    verified: string;
    unverified: string;
    verifiedOn: string; // {date}
    publicUrl: string;
    saveChanges: string;
    saved: string;
    listingsHeading: string;
    teamHeading: string;
    emptyListings: string;
    create: {
      title: string;
      subtitle: string;
      slug: string;
      slugHint: string;
      legalName: string;
      tradingName: string;
      country: string;
      partnerType: string;
      submit: string;
    };
  };
  team: {
    title: string;
    subtitle: string;
    membersHeading: string;
    pendingHeading: string;
    you: string;
    invite: {
      cta: string;
      email: string;
      role: string;
      send: string;
      sent: string; // {email}
      hint: string;
      adminHint: string;
    };
    accept: {
      title: string;
      subtitle: string; // {business}
      cta: string;
      accepted: string;
    };
    remove: string;
    removed: string;
    changeRole: string;
    roleChanged: string;
    emptyPending: string;
  };
  insights: {
    title: string;
    subtitle: string;
    tiles: {
      orders: string;
      bookings: string;
      jobPosts: string;
      storefrontViews: string;
    };
    loading: string;
    noDataYet: string;
    noActivity: string;
    rangeAllTime: string;
  };
  invitationEmail: {
    subject: string; // {business}
    heading: string; // {business}
    body: string; // {business} {role}
    cta: string;
    expiry: string; // {date}
    ignore: string;
  };
  errors: {
    notMember: string;
    invalidInvitation: string;
    authRequired: string;
    slugTaken: string;
    invalidCountry: string;
    forbidden: string;
    generic: string;
  };
};

const EN: BusinessCopy = {
  common: {
    business: "Business",
    personal: "Personal",
    actingAsPersonal: "Acting as you",
    actingAsBusiness: "Acting as {name}",
    switchToPersonal: "Switch to personal",
    switchToBusiness: "Switch to business",
    save: "Save",
    cancel: "Cancel",
    loading: "Loading…",
    back: "Back",
  },
  status: {
    pending: "Pending review",
    active: "Active",
    suspended: "Suspended",
    closed: "Closed",
  },
  partnerType: {
    marketplace_seller: "Marketplace seller",
    service_provider: "Service provider",
    employer: "Employer",
    studio_client: "Studio client",
    logistics_shipper: "Logistics shipper",
  },
  roles: {
    owner: "Owner",
    admin: "Admin",
    member: "Member",
  },
  profile: {
    title: "Business profile",
    editTitle: "Edit business profile",
    legalName: "Legal name",
    tradingName: "Trading name",
    registration: "Registration number",
    country: "Country",
    partnerType: "Business type",
    status: "Status",
    verified: "Verified",
    unverified: "Verification pending",
    verifiedOn: "Verified on {date}",
    publicUrl: "Public profile",
    saveChanges: "Save changes",
    saved: "Profile updated",
    listingsHeading: "What this business offers",
    teamHeading: "Team",
    emptyListings: "Nothing published yet.",
    create: {
      title: "Create a business",
      subtitle: "Set up a verified company identity beside your personal account.",
      slug: "Profile address",
      slugHint: "Lowercase letters, numbers and dashes. This becomes your public profile link.",
      legalName: "Registered legal name",
      tradingName: "Trading name (optional)",
      country: "Country of registration",
      partnerType: "Primary business type",
      submit: "Create business",
    },
  },
  team: {
    title: "Team",
    subtitle: "Manage who can act for this business.",
    membersHeading: "Members",
    pendingHeading: "Pending invitations",
    you: "You",
    invite: {
      cta: "Invite a member",
      email: "Email address",
      role: "Role",
      send: "Send invitation",
      sent: "Invitation sent to {email}",
      hint: "Owners can invite admins and members.",
      adminHint: "Admins can invite members only.",
    },
    accept: {
      title: "Join this business",
      subtitle: "You've been invited to join {business}.",
      cta: "Accept invitation",
      accepted: "You've joined the team.",
    },
    remove: "Remove",
    removed: "Member removed",
    changeRole: "Change role",
    roleChanged: "Role updated",
    emptyPending: "No invitations are waiting.",
  },
  insights: {
    title: "Business insights",
    subtitle: "Activity across the divisions this business operates in.",
    tiles: {
      orders: "Orders",
      bookings: "Bookings",
      jobPosts: "Job posts",
      storefrontViews: "Profile views",
    },
    loading: "Loading activity…",
    noDataYet: "No data yet",
    noActivity: "No activity in this period.",
    rangeAllTime: "All time",
  },
  invitationEmail: {
    subject: "You're invited to join {business}",
    heading: "Join {business}",
    body: "You've been invited to join {business} as {role}. Accept the invitation to start acting for the business.",
    cta: "Accept invitation",
    expiry: "This invitation expires on {date}.",
    ignore: "If you weren't expecting this, you can safely ignore this email.",
  },
  errors: {
    notMember: "You're not a member of this business.",
    invalidInvitation: "This invitation is invalid or has expired.",
    authRequired: "Please sign in to continue.",
    slugTaken: "That profile address is already taken.",
    invalidCountry: "Choose a supported country.",
    forbidden: "You don't have permission to do that.",
    generic: "Something went wrong. Please try again.",
  },
};

const FR: Partial<BusinessCopy> = {
  common: {
    business: "Entreprise",
    personal: "Personnel",
    actingAsPersonal: "Vous agissez en votre nom",
    actingAsBusiness: "Vous agissez pour {name}",
    switchToPersonal: "Passer en personnel",
    switchToBusiness: "Passer en entreprise",
    save: "Enregistrer",
    cancel: "Annuler",
    loading: "Chargement…",
    back: "Retour",
  },
  status: { pending: "En attente de validation", active: "Actif", suspended: "Suspendu", closed: "Fermé" },
  roles: { owner: "Propriétaire", admin: "Administrateur", member: "Membre" },
  partnerType: {
    marketplace_seller: "Vendeur du marché",
    service_provider: "Prestataire de services",
    employer: "Employeur",
    studio_client: "Client studio",
    logistics_shipper: "Expéditeur logistique",
  },
};

const ES: Partial<BusinessCopy> = {
  common: {
    business: "Empresa",
    personal: "Personal",
    actingAsPersonal: "Actuando como tú",
    actingAsBusiness: "Actuando como {name}",
    switchToPersonal: "Cambiar a personal",
    switchToBusiness: "Cambiar a empresa",
    save: "Guardar",
    cancel: "Cancelar",
    loading: "Cargando…",
    back: "Atrás",
  },
  status: { pending: "Pendiente de revisión", active: "Activo", suspended: "Suspendido", closed: "Cerrado" },
  roles: { owner: "Propietario", admin: "Administrador", member: "Miembro" },
  partnerType: {
    marketplace_seller: "Vendedor del mercado",
    service_provider: "Proveedor de servicios",
    employer: "Empleador",
    studio_client: "Cliente de estudio",
    logistics_shipper: "Remitente de logística",
  },
};

const PT: Partial<BusinessCopy> = {
  common: {
    business: "Empresa",
    personal: "Pessoal",
    actingAsPersonal: "Agindo como você",
    actingAsBusiness: "Agindo como {name}",
    switchToPersonal: "Mudar para pessoal",
    switchToBusiness: "Mudar para empresa",
    save: "Guardar",
    cancel: "Cancelar",
    loading: "A carregar…",
    back: "Voltar",
  },
  status: { pending: "Aguardando revisão", active: "Ativo", suspended: "Suspenso", closed: "Encerrado" },
  roles: { owner: "Proprietário", admin: "Administrador", member: "Membro" },
  partnerType: {
    marketplace_seller: "Vendedor do mercado",
    service_provider: "Prestador de serviços",
    employer: "Empregador",
    studio_client: "Cliente do estúdio",
    logistics_shipper: "Expedidor de logística",
  },
};

const DE: Partial<BusinessCopy> = {
  common: {
    business: "Unternehmen",
    personal: "Persönlich",
    actingAsPersonal: "Sie handeln als Sie selbst",
    actingAsBusiness: "Sie handeln als {name}",
    switchToPersonal: "Zu persönlich wechseln",
    switchToBusiness: "Zu Unternehmen wechseln",
    save: "Speichern",
    cancel: "Abbrechen",
    loading: "Wird geladen…",
    back: "Zurück",
  },
  status: { pending: "Prüfung ausstehend", active: "Aktiv", suspended: "Gesperrt", closed: "Geschlossen" },
  roles: { owner: "Inhaber", admin: "Administrator", member: "Mitglied" },
  partnerType: {
    marketplace_seller: "Marktplatz-Verkäufer",
    service_provider: "Dienstleister",
    employer: "Arbeitgeber",
    studio_client: "Studio-Kunde",
    logistics_shipper: "Logistik-Versender",
  },
};

const IT: Partial<BusinessCopy> = {
  common: {
    business: "Azienda",
    personal: "Personale",
    actingAsPersonal: "Stai agendo come te stesso",
    actingAsBusiness: "Stai agendo come {name}",
    switchToPersonal: "Passa a personale",
    switchToBusiness: "Passa ad azienda",
    save: "Salva",
    cancel: "Annulla",
    loading: "Caricamento…",
    back: "Indietro",
  },
  status: { pending: "In attesa di revisione", active: "Attivo", suspended: "Sospeso", closed: "Chiuso" },
  roles: { owner: "Titolare", admin: "Amministratore", member: "Membro" },
  partnerType: {
    marketplace_seller: "Venditore del marketplace",
    service_provider: "Fornitore di servizi",
    employer: "Datore di lavoro",
    studio_client: "Cliente studio",
    logistics_shipper: "Spedizioniere logistico",
  },
};

const AR: Partial<BusinessCopy> = {
  common: {
    business: "شركة",
    personal: "شخصي",
    actingAsPersonal: "أنت تتصرف باسمك",
    actingAsBusiness: "أنت تتصرف باسم {name}",
    switchToPersonal: "التبديل إلى شخصي",
    switchToBusiness: "التبديل إلى شركة",
    save: "حفظ",
    cancel: "إلغاء",
    loading: "جارٍ التحميل…",
    back: "رجوع",
  },
  status: { pending: "في انتظار المراجعة", active: "نشط", suspended: "موقوف", closed: "مغلق" },
  roles: { owner: "المالك", admin: "مسؤول", member: "عضو" },
  partnerType: {
    marketplace_seller: "بائع في السوق",
    service_provider: "مزود خدمة",
    employer: "صاحب عمل",
    studio_client: "عميل الاستوديو",
    logistics_shipper: "شاحن لوجستي",
  },
};

const LOCALE_OVERRIDES: Partial<Record<AppLocale, Partial<BusinessCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  de: DE,
  it: IT,
  ar: AR,
};

export function getBusinessCopy(locale: AppLocale): BusinessCopy {
  const overrides = LOCALE_OVERRIDES[locale];
  if (!overrides) return EN;
  return deepMergeMessages(
    EN as unknown as Record<string, unknown>,
    overrides as unknown as Record<string, unknown>,
  ) as unknown as BusinessCopy;
}

/** Resolve {token} placeholders in a BusinessCopy template string. */
export function formatBusinessTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
