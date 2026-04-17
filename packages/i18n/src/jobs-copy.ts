import type { AppLocale } from "./locales";
import { deepMergeMessages } from "./merge-messages";

export type JobsCopy = {
  nav: {
    browse: string;
    post: string;
    applications: string;
    account: string;
  };
  hero: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    ctaBrowse: string;
    ctaHire: string;
  };
  filters: {
    allRoles: string;
    fullTime: string;
    partTime: string;
    contract: string;
    remote: string;
    onsite: string;
    hybrid: string;
    location: string;
    salary: string;
    experience: string;
    clearAll: string;
  };
  listing: {
    applyNow: string;
    saveJob: string;
    shareJob: string;
    postedAgo: string;
    deadline: string;
    salary: string;
    jobType: string;
    location: string;
    experience: string;
    skills: string;
    aboutRole: string;
    aboutCompany: string;
    viewCompany: string;
  };
  application: {
    title: string;
    resume: string;
    coverLetter: string;
    submit: string;
    submitted: string;
    underReview: string;
    shortlisted: string;
    rejected: string;
    offerMade: string;
  };
  hiring: {
    postJob: string;
    managePostings: string;
    reviewApplications: string;
    closePosting: string;
    editPosting: string;
  };
  empty: {
    noJobs: string;
    noApplications: string;
    noPostings: string;
  };
};

const EN: JobsCopy = {
  nav: {
    browse: "Browse jobs",
    post: "Post a job",
    applications: "Applications",
    account: "Account",
  },
  hero: {
    title: "Hiring, verified talent, without the usual noise.",
    subtitle: "Find focused roles from employers who are serious about who they bring in.",
    searchPlaceholder: "Role, skill, or company",
    ctaBrowse: "Browse open jobs",
    ctaHire: "I'm hiring",
  },
  filters: {
    allRoles: "All roles",
    fullTime: "Full-time",
    partTime: "Part-time",
    contract: "Contract",
    remote: "Remote",
    onsite: "On-site",
    hybrid: "Hybrid",
    location: "Location",
    salary: "Salary",
    experience: "Experience",
    clearAll: "Clear all",
  },
  listing: {
    applyNow: "Apply now",
    saveJob: "Save job",
    shareJob: "Share",
    postedAgo: "Posted",
    deadline: "Application deadline",
    salary: "Salary",
    jobType: "Job type",
    location: "Location",
    experience: "Experience required",
    skills: "Skills",
    aboutRole: "About the role",
    aboutCompany: "About the company",
    viewCompany: "View company",
  },
  application: {
    title: "Apply for this role",
    resume: "Resume / CV",
    coverLetter: "Cover letter",
    submit: "Submit application",
    submitted: "Application submitted",
    underReview: "Under review",
    shortlisted: "Shortlisted",
    rejected: "Not progressing",
    offerMade: "Offer made",
  },
  hiring: {
    postJob: "Post a job",
    managePostings: "Manage postings",
    reviewApplications: "Review applications",
    closePosting: "Close posting",
    editPosting: "Edit posting",
  },
  empty: {
    noJobs: "No matching jobs found. Try adjusting your filters.",
    noApplications: "No applications yet.",
    noPostings: "No active job postings.",
  },
};

const FR: Partial<JobsCopy> = {
  nav: {
    browse: "Parcourir les offres",
    post: "Publier une offre",
    applications: "Candidatures",
    account: "Compte",
  },
  hero: {
    title: "Recrutement de talents vérifiés, sans le bruit habituel.",
    subtitle: "Trouvez des postes ciblés auprès d'employeurs sérieux dans leur recrutement.",
    searchPlaceholder: "Poste, compétence ou entreprise",
    ctaBrowse: "Voir les offres",
    ctaHire: "Je recrute",
  },
  filters: {
    allRoles: "Tous les postes",
    fullTime: "Temps plein",
    partTime: "Temps partiel",
    contract: "Contrat",
    remote: "Télétravail",
    onsite: "Sur site",
    hybrid: "Hybride",
    location: "Lieu",
    salary: "Salaire",
    experience: "Expérience",
    clearAll: "Tout effacer",
  },
  listing: {
    applyNow: "Postuler",
    saveJob: "Sauvegarder",
    shareJob: "Partager",
    postedAgo: "Publié",
    deadline: "Date limite de candidature",
    salary: "Salaire",
    jobType: "Type de contrat",
    location: "Lieu",
    experience: "Expérience requise",
    skills: "Compétences",
    aboutRole: "À propos du poste",
    aboutCompany: "À propos de l'entreprise",
    viewCompany: "Voir l'entreprise",
  },
  application: {
    title: "Postuler à ce poste",
    resume: "CV",
    coverLetter: "Lettre de motivation",
    submit: "Envoyer la candidature",
    submitted: "Candidature envoyée",
    underReview: "En cours d'examen",
    shortlisted: "Présélectionné",
    rejected: "Non retenu",
    offerMade: "Offre proposée",
  },
  hiring: {
    postJob: "Publier une offre",
    managePostings: "Gérer les offres",
    reviewApplications: "Examiner les candidatures",
    closePosting: "Clôturer l'offre",
    editPosting: "Modifier l'offre",
  },
  empty: {
    noJobs: "Aucun poste trouvé. Ajustez vos filtres.",
    noApplications: "Pas encore de candidatures.",
    noPostings: "Aucune offre active.",
  },
};

const LOCALE_OVERRIDES: Partial<Record<AppLocale, Partial<JobsCopy>>> = {
  fr: FR,
};

export function getJobsCopy(locale: AppLocale): JobsCopy {
  const overrides = LOCALE_OVERRIDES[locale];
  if (overrides) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as JobsCopy;
  }
  return EN;
}
