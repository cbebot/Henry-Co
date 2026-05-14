export type LearnLocale = "en" | "fr";

const SHORT_MONTHS_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const SHORT_MONTHS_FR = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

export function formatStamp(iso: string | null | undefined, locale: LearnLocale = "en"): string {
  if (!iso) return "—";
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "—";
  const d = new Date(ms);
  const months = locale === "fr" ? SHORT_MONTHS_FR : SHORT_MONTHS_EN;
  return `${d.getUTCDate().toString().padStart(2, "0")} ${months[d.getUTCMonth()]}`;
}

/* ---- Token translation -------------------------------------------- */

export function translateLearnToken(locale: LearnLocale, value: string): string {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  const dict = locale === "fr" ? FR_TOKENS : EN_TOKENS;
  return dict[normalized] ||
    normalized.replace(/[_-]+/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

const EN_TOKENS: Record<string, string> = {
  active: "Active",
  assigned: "Assigned",
  completed: "Completed",
  enrolled: "Enrolled",
  pending: "Pending",
  paid: "Paid",
  unpaid: "Unpaid",
  passed: "Passed",
  failed: "Failed",
  issued: "Issued",
  available: "Available",
  submitted: "Submitted",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  in_progress: "In progress",
  not_started: "Not started",
};

const FR_TOKENS: Record<string, string> = {
  active: "Actif",
  assigned: "Assigné",
  completed: "Terminé",
  enrolled: "Inscrit",
  pending: "En attente",
  paid: "Payé",
  unpaid: "Impayé",
  passed: "Réussi",
  failed: "Échoué",
  issued: "Émis",
  available: "Disponible",
  submitted: "Soumis",
  under_review: "En revue",
  approved: "Approuvé",
  rejected: "Rejeté",
  in_progress: "En cours",
  not_started: "Pas commencé",
};

/* ---- Row shapes --------------------------------------------------- */

export type CourseRow = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  percentComplete: number;
  status: string;
  paymentStatus: string;
  quizState: string;
  certificateState: string;
  completedAt: string | null;
  kind: "active" | "completed";
};

export type CertificateRow = {
  id: string;
  courseTitle: string;
  certificateNo: string;
  href: string;
};

export type AssignmentRow = {
  id: string;
  courseTitle: string;
  note: string;
  href: string;
};

export type SavedCourseRow = {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
};

export type TeacherApplication = {
  status: string;
  expertiseArea: string;
  teachingTopics: string[];
  reviewNotes: string | null;
} | null;

export type LearnMetrics = {
  activeCourses: number;
  completedCourses: number;
  certificates: number;
  assignedLearning: number;
  savedCourses: number;
};

/* ---- Stats + hero state ------------------------------------------ */

export type LearnStats = {
  metrics: LearnMetrics;
  hasAnyEnrollment: boolean;
  hasAnyAssignment: boolean;
  hasTeacherApplication: boolean;
};

export function learnStats(args: {
  metrics: LearnMetrics;
  active: ReadonlyArray<CourseRow>;
  assignments: ReadonlyArray<AssignmentRow>;
  teacherApplication: TeacherApplication;
}): LearnStats {
  return {
    metrics: args.metrics,
    hasAnyEnrollment: args.metrics.activeCourses + args.metrics.completedCourses > 0,
    hasAnyAssignment: args.assignments.length > 0,
    hasTeacherApplication: Boolean(args.teacherApplication),
  };
}

export type HeroState = "empty" | "calm" | "active";

export function heroState(stats: LearnStats): HeroState {
  if (
    !stats.hasAnyEnrollment &&
    !stats.hasAnyAssignment &&
    !stats.hasTeacherApplication &&
    stats.metrics.savedCourses === 0
  ) {
    return "empty";
  }
  if (stats.metrics.activeCourses > 0 || stats.hasAnyAssignment) return "active";
  return "calm";
}

export type HeroCopy = {
  headline: string;
  blurb: string;
  ctaPrimary: { label: string; href: string };
  ctaSecondary: { label: string; href: string };
};

export function buildHeroCopy(
  state: HeroState,
  stats: LearnStats,
  learnOrigin: string,
  locale: LearnLocale,
): HeroCopy {
  const teachHref = `${learnOrigin}/teach`;

  if (locale === "fr") {
    if (state === "empty") {
      return {
        headline: "Commencez votre parcours HenryCo Learn.",
        blurb: "Parcourez le catalogue, inscrivez-vous à un cours, et chaque module, quiz et certificat se synchronisera ici automatiquement.",
        ctaPrimary: { label: "Ouvrir HenryCo Learn", href: learnOrigin },
        ctaSecondary: { label: "Postuler pour enseigner", href: teachHref },
      };
    }
    if (state === "active") {
      const n = stats.metrics.activeCourses;
      return {
        headline: `${n} cours en cours.`,
        blurb: "Reprenez là où vous vous êtes arrêté — leçons, quiz, certificats et formations assignées sont synchronisés depuis HenryCo Learn.",
        ctaPrimary: { label: "Ouvrir HenryCo Learn", href: learnOrigin },
        ctaSecondary: { label: "Postuler pour enseigner", href: teachHref },
      };
    }
    return {
      headline: `${stats.metrics.completedCourses} cours terminé${stats.metrics.completedCourses === 1 ? "" : "s"}.`,
      blurb: "Vos certifications et historique d’apprentissage restent ici, prêts pour le CV, les rapports internes, ou simplement vos archives.",
      ctaPrimary: { label: "Ouvrir HenryCo Learn", href: learnOrigin },
      ctaSecondary: { label: "Postuler pour enseigner", href: teachHref },
    };
  }

  if (state === "empty") {
    return {
      headline: "Start your HenryCo Learn journey.",
      blurb: "Browse the catalog, enroll in a course, and every lesson, quiz, and certificate will sync into this room automatically.",
      ctaPrimary: { label: "Open HenryCo Learn", href: learnOrigin },
      ctaSecondary: { label: "Apply to teach", href: teachHref },
    };
  }
  if (state === "active") {
    const n = stats.metrics.activeCourses;
    return {
      headline: `${n} course${n === 1 ? "" : "s"} in progress.`,
      blurb: "Pick up where you left off — lessons, quizzes, certificates, and assigned training all sync from HenryCo Learn into this room.",
      ctaPrimary: { label: "Open HenryCo Learn", href: learnOrigin },
      ctaSecondary: { label: "Apply to teach", href: teachHref },
    };
  }
  return {
    headline: `${stats.metrics.completedCourses} course${stats.metrics.completedCourses === 1 ? "" : "s"} completed.`,
    blurb: "Your credentials and learning history stay here, handy for CVs, internal reporting, or your own records.",
    ctaPrimary: { label: "Open HenryCo Learn", href: learnOrigin },
    ctaSecondary: { label: "Apply to teach", href: teachHref },
  };
}

/* ---- Activity rows ------------------------------------------------ */

export type LearnActivityRow = {
  id: string;
  activityType: string | null;
  title: string | null;
  description: string | null;
  status: string | null;
  occurredAt: string;
  actionUrl: string | null;
};

export function toLearnActivityRows(
  raw: ReadonlyArray<Record<string, unknown>>,
): LearnActivityRow[] {
  return raw.map((row, idx) => ({
    id: String(row.id || `${row.activity_type || "learn"}-${idx}`),
    activityType: row.activity_type ? String(row.activity_type) : null,
    title: row.title ? String(row.title) : null,
    description: row.description ? String(row.description) : null,
    status: row.status ? String(row.status) : null,
    occurredAt: String(row.created_at || ""),
    actionUrl: row.action_url ? String(row.action_url) : null,
  }));
}
