import type { AppLocale } from "./locales";
import { deepMergeMessages } from "./merge-messages";

export type CareCopy = {
  nav: {
    home: string;
    book: string;
    track: string;
    review: string;
    account: string;
  };
  hero: {
    title: string;
    subtitle: string;
    ctaBook: string;
    ctaTrack: string;
  };
  booking: {
    title: string;
    serviceLabel: string;
    dateLabel: string;
    timeLabel: string;
    nameLabel: string;
    phoneLabel: string;
    emailLabel: string;
    addressLabel: string;
    notesLabel: string;
    submitButton: string;
    confirmationHeading: string;
    confirmationBody: string;
    trackingCodeLabel: string;
  };
  tracking: {
    title: string;
    codeLabel: string;
    phoneLabel: string;
    submitButton: string;
    notFound: string;
    statusLabel: string;
    lastUpdatedLabel: string;
    estimatedLabel: string;
  };
  status: {
    pending: string;
    confirmed: string;
    collected: string;
    inProgress: string;
    readyForDelivery: string;
    outForDelivery: string;
    delivered: string;
    completed: string;
    cancelled: string;
  };
  review: {
    title: string;
    ratingLabel: string;
    textLabel: string;
    photoLabel: string;
    submitButton: string;
    successMessage: string;
    pendingApproval: string;
  };
  serviceTypes: {
    laundry: string;
    drycleaning: string;
    ironing: string;
    alterations: string;
    homeCleaning: string;
    officeCleaning: string;
  };
};

const EN: CareCopy = {
  nav: {
    home: "Home",
    book: "Book",
    track: "Track",
    review: "Leave a review",
    account: "Account",
  },
  hero: {
    title: "Care that shows up, every time.",
    subtitle: "Garment care, home cleaning, and workplace upkeep with clearer booking, steadier tracking, and calmer support.",
    ctaBook: "Book a service",
    ctaTrack: "Track a booking",
  },
  booking: {
    title: "Book a service",
    serviceLabel: "Service type",
    dateLabel: "Preferred date",
    timeLabel: "Preferred time",
    nameLabel: "Full name",
    phoneLabel: "Phone number",
    emailLabel: "Email address",
    addressLabel: "Pickup address",
    notesLabel: "Additional notes",
    submitButton: "Request booking",
    confirmationHeading: "Booking request received",
    confirmationBody: "We will confirm your booking shortly. Keep your tracking code safe.",
    trackingCodeLabel: "Your tracking code",
  },
  tracking: {
    title: "Track your booking",
    codeLabel: "Tracking code",
    phoneLabel: "Phone number",
    submitButton: "Check status",
    notFound: "No booking found for that code and phone number.",
    statusLabel: "Current status",
    lastUpdatedLabel: "Last updated",
    estimatedLabel: "Estimated completion",
  },
  status: {
    pending: "Pending",
    confirmed: "Confirmed",
    collected: "Collected",
    inProgress: "In progress",
    readyForDelivery: "Ready for delivery",
    outForDelivery: "Out for delivery",
    delivered: "Delivered",
    completed: "Completed",
    cancelled: "Cancelled",
  },
  review: {
    title: "Share your experience",
    ratingLabel: "Overall rating",
    textLabel: "Your review",
    photoLabel: "Add a photo (optional)",
    submitButton: "Submit review",
    successMessage: "Thank you. Your review has been submitted and is awaiting approval.",
    pendingApproval: "Awaiting approval",
  },
  serviceTypes: {
    laundry: "Laundry",
    drycleaning: "Dry cleaning",
    ironing: "Ironing",
    alterations: "Alterations",
    homeCleaning: "Home cleaning",
    officeCleaning: "Office cleaning",
  },
};

const FR: Partial<CareCopy> = {
  nav: {
    home: "Accueil",
    book: "Réserver",
    track: "Suivre",
    review: "Laisser un avis",
    account: "Compte",
  },
  hero: {
    title: "Un soin qui arrive toujours.",
    subtitle: "Entretien vêtements, nettoyage à domicile et entretien bureau avec une réservation plus claire, un suivi plus stable et un support plus serein.",
    ctaBook: "Réserver un service",
    ctaTrack: "Suivre une réservation",
  },
  booking: {
    title: "Réserver un service",
    serviceLabel: "Type de service",
    dateLabel: "Date souhaitée",
    timeLabel: "Heure souhaitée",
    nameLabel: "Nom complet",
    phoneLabel: "Numéro de téléphone",
    emailLabel: "Adresse e-mail",
    addressLabel: "Adresse de collecte",
    notesLabel: "Notes supplémentaires",
    submitButton: "Demander une réservation",
    confirmationHeading: "Demande de réservation reçue",
    confirmationBody: "Nous confirmerons votre réservation sous peu. Conservez votre code de suivi.",
    trackingCodeLabel: "Votre code de suivi",
  },
  tracking: {
    title: "Suivre votre réservation",
    codeLabel: "Code de suivi",
    phoneLabel: "Numéro de téléphone",
    submitButton: "Vérifier le statut",
    notFound: "Aucune réservation trouvée pour ce code et numéro de téléphone.",
    statusLabel: "Statut actuel",
    lastUpdatedLabel: "Dernière mise à jour",
    estimatedLabel: "Fin estimée",
  },
  status: {
    pending: "En attente",
    confirmed: "Confirmé",
    collected: "Collecté",
    inProgress: "En cours",
    readyForDelivery: "Prêt pour livraison",
    outForDelivery: "En cours de livraison",
    delivered: "Livré",
    completed: "Terminé",
    cancelled: "Annulé",
  },
  review: {
    title: "Partagez votre expérience",
    ratingLabel: "Note globale",
    textLabel: "Votre avis",
    photoLabel: "Ajouter une photo (optionnel)",
    submitButton: "Soumettre l'avis",
    successMessage: "Merci. Votre avis a été soumis et attend approbation.",
    pendingApproval: "En attente d'approbation",
  },
  serviceTypes: {
    laundry: "Lavage",
    drycleaning: "Nettoyage à sec",
    ironing: "Repassage",
    alterations: "Retouches",
    homeCleaning: "Ménage",
    officeCleaning: "Nettoyage de bureau",
  },
};

const LOCALE_OVERRIDES: Partial<Record<AppLocale, Partial<CareCopy>>> = {
  fr: FR,
};

export function getCareCopy(locale: AppLocale): CareCopy {
  const overrides = LOCALE_OVERRIDES[locale];
  if (overrides) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as CareCopy;
  }
  return EN;
}
