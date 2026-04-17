import type { AppLocale } from "./locales";
import { deepMergeMessages } from "./merge-messages";

export type StateCopy = {
  loading: {
    default: string;
    data: string;
    content: string;
  };
  empty: {
    default: string;
    noResults: string;
    noItems: string;
  };
  error: {
    default: string;
    notFound: string;
    unauthorized: string;
    forbidden: string;
    network: string;
    server: string;
    tryAgain: string;
    contactSupport: string;
  };
  confirm: {
    title: string;
    warning: string;
    cancel: string;
    proceed: string;
  };
};

const EN: StateCopy = {
  loading: {
    default: "Loading…",
    data: "Loading data…",
    content: "Loading content…",
  },
  empty: {
    default: "Nothing here yet.",
    noResults: "No results found.",
    noItems: "No items available.",
  },
  error: {
    default: "Something went wrong.",
    notFound: "The requested page was not found.",
    unauthorized: "You need to sign in to continue.",
    forbidden: "You do not have permission for this action.",
    network: "Network error. Check your connection and try again.",
    server: "Server error. Please try again shortly.",
    tryAgain: "Try again",
    contactSupport: "Contact support",
  },
  confirm: {
    title: "Are you sure?",
    warning: "This action cannot be undone.",
    cancel: "Cancel",
    proceed: "Continue",
  },
};

const FR: Partial<StateCopy> = {
  loading: {
    default: "Chargement…",
    data: "Chargement des données…",
    content: "Chargement du contenu…",
  },
  empty: {
    default: "Rien pour le moment.",
    noResults: "Aucun résultat trouvé.",
    noItems: "Aucun élément disponible.",
  },
  error: {
    default: "Une erreur est survenue.",
    notFound: "La page demandée est introuvable.",
    unauthorized: "Vous devez vous connecter pour continuer.",
    forbidden: "Vous n'avez pas l'autorisation pour cette action.",
    network: "Erreur réseau. Vérifiez votre connexion et réessayez.",
    server: "Erreur serveur. Réessayez dans un instant.",
    tryAgain: "Réessayer",
    contactSupport: "Contacter le support",
  },
  confirm: {
    title: "Êtes-vous sûr ?",
    warning: "Cette action est irréversible.",
    cancel: "Annuler",
    proceed: "Continuer",
  },
};

export function getStateCopy(locale: AppLocale): StateCopy {
  if (locale === "fr") {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      FR as unknown as Record<string, unknown>,
    ) as unknown as StateCopy;
  }
  return EN;
}
