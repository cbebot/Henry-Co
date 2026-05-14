const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatStamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "—";
  const d = new Date(ms);
  return `${d.getUTCDate().toString().padStart(2, "0")} ${SHORT_MONTHS[d.getUTCMonth()]}`;
}

/* ---- Project + payment kinds -------------------------------------- */

export type ProjectKind = "live" | "ready_review" | "scheduled" | "delivered" | "issue";

export function projectKind(status: string | null | undefined): ProjectKind {
  const s = String(status || "").toLowerCase();
  if (["delivered", "completed", "closed"].includes(s)) return "delivered";
  if (["cancelled", "blocked", "exception"].includes(s)) return "issue";
  if (["in_review", "ready_for_review", "review_requested"].includes(s)) return "ready_review";
  if (["scheduled", "queued", "draft", "pending_deposit"].includes(s)) return "scheduled";
  return "live";
}

export type PaymentKind = "pending" | "proof" | "approved" | "issue";

export function paymentKind(status: string | null | undefined): PaymentKind {
  const s = String(status || "").toLowerCase();
  if (["paid", "approved", "settled"].includes(s)) return "approved";
  if (["proof_uploaded", "proof_submitted", "in_review"].includes(s)) return "proof";
  if (["rejected", "overdue", "failed"].includes(s)) return "issue";
  return "pending";
}

/* ---- Aggregate stats --------------------------------------------- */

export type StudioMetrics = {
  activeProjects: number;
  pendingPayments: number;
  proofSubmitted: number;
  deliverables: number;
};

export type ProjectRow = {
  id: string;
  title: string;
  status: string;
  nextAction: string;
  milestoneProgress: number;
  approvedMilestones: number;
  totalMilestones: number;
  openPayments: number;
  deliverables: number;
  latestPaymentStatus: string | null;
  latestUpdate: { summary: string; createdAt: string | null } | null;
  updatedAt: string;
};

export type PaymentRow = {
  id: string;
  label: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  dueDate: string | null;
  proofUrl: string | null;
  updatedAt: string;
};

export type ProposalRow = {
  id: string;
  title: string;
  status: string;
  investment: number;
  depositAmount: number;
  currency: string;
  validUntil: string | null;
  projectId: string | null;
};

export type StudioStats = {
  metrics: StudioMetrics;
  totalProjects: number;
  liveProjects: number;
  readyReview: number;
  pendingDeposits: number;
  overduePayments: number;
  proposalCount: number;
  topProject: ProjectRow | null;
  topProjectKind: ProjectKind | null;
};

export function studioStats(args: {
  projects: ReadonlyArray<ProjectRow>;
  payments: ReadonlyArray<PaymentRow>;
  proposals: ReadonlyArray<ProposalRow>;
  metrics: StudioMetrics;
}): StudioStats {
  let liveProjects = 0;
  let readyReview = 0;
  let topProject: ProjectRow | null = null;
  let topProjectKind: ProjectKind | null = null;

  // priority: ready_review > live (with low progress) > live > scheduled > delivered
  for (const p of args.projects) {
    const kind = projectKind(p.status);
    if (kind === "live") liveProjects += 1;
    else if (kind === "ready_review") readyReview += 1;

    if (topProject === null) {
      topProject = p;
      topProjectKind = kind;
    } else {
      const currentRank = rankProject(topProjectKind!, topProject.milestoneProgress);
      const candidateRank = rankProject(kind, p.milestoneProgress);
      if (candidateRank > currentRank) {
        topProject = p;
        topProjectKind = kind;
      }
    }
  }

  let pendingDeposits = 0;
  let overduePayments = 0;
  for (const p of args.payments) {
    const k = paymentKind(p.status);
    if (k === "pending" && String(p.status || "").toLowerCase() === "pending_deposit") pendingDeposits += 1;
    if (k === "issue" && String(p.status || "").toLowerCase() === "overdue") overduePayments += 1;
  }

  return {
    metrics: args.metrics,
    totalProjects: args.projects.length,
    liveProjects,
    readyReview,
    pendingDeposits,
    overduePayments,
    proposalCount: args.proposals.length,
    topProject,
    topProjectKind,
  };
}

function rankProject(kind: ProjectKind, progress: number): number {
  if (kind === "ready_review") return 100;
  if (kind === "issue") return 90;
  if (kind === "live" && progress < 50) return 80;
  if (kind === "live") return 70;
  if (kind === "scheduled") return 50;
  return 10;
}

/* ---- Hero state + copy -------------------------------------------- */

export type HeroState = "empty" | "calm" | "active" | "attention";

export function heroState(stats: StudioStats): HeroState {
  if (stats.totalProjects === 0 && stats.proposalCount === 0) return "empty";
  if (stats.overduePayments > 0) return "attention";
  if (stats.readyReview > 0 || stats.liveProjects > 0 || stats.metrics.proofSubmitted > 0) return "active";
  return "calm";
}

export type HeroCopy = {
  headline: string;
  blurb: string;
  ctaPrimary: { label: string; href: string };
  ctaSecondary: { label: string; href: string };
};

const STUDIO_ORIGIN = "https://studio.henrycogroup.com";

export function buildHeroCopy(state: HeroState, stats: StudioStats): HeroCopy {
  if (state === "empty") {
    return {
      headline: "Start a Studio brief.",
      blurb: "When a proposal or project goes live with your HenryCo identity, the synced Studio room appears here — milestones, payments, deliverables, and the next move all in one place.",
      ctaPrimary: { label: "Start a brief", href: `${STUDIO_ORIGIN}/request` },
      ctaSecondary: { label: "Open Studio", href: STUDIO_ORIGIN },
    };
  }
  if (state === "attention") {
    return {
      headline: `${stats.overduePayments} overdue payment${stats.overduePayments === 1 ? "" : "s"}.`,
      blurb: "A payment checkpoint is past due. Open the workspace to upload proof or contact the Studio team.",
      ctaPrimary: { label: "Open payments", href: "#studio-payments" },
      ctaSecondary: { label: "Open Studio", href: STUDIO_ORIGIN },
    };
  }
  if (state === "active") {
    if (stats.readyReview > 0) {
      return {
        headline: `${stats.readyReview} project${stats.readyReview === 1 ? "" : "s"} ready for review.`,
        blurb: "Deliverables and revisions are queued for your approval. Open the workspace to review and unblock the next milestone.",
        ctaPrimary: { label: "Open projects", href: "#studio-projects" },
        ctaSecondary: { label: "Open Studio", href: STUDIO_ORIGIN },
      };
    }
    return {
      headline: `${stats.metrics.activeProjects} active project${stats.metrics.activeProjects === 1 ? "" : "s"}.`,
      blurb: "Live workspaces with milestone movement, payment checkpoints, and deliverables — all mirrored from HenryCo Studio into this room.",
      ctaPrimary: { label: "Open Studio", href: STUDIO_ORIGIN },
      ctaSecondary: { label: "Start a new brief", href: `${STUDIO_ORIGIN}/request` },
    };
  }
  return {
    headline: `${stats.totalProjects} project room${stats.totalProjects === 1 ? "" : "s"} on record.`,
    blurb: "Every Studio engagement you have ever started — proposals, milestones, payments, deliverables — kept in one room for fast follow-up.",
    ctaPrimary: { label: "Open Studio", href: STUDIO_ORIGIN },
    ctaSecondary: { label: "Start a new brief", href: `${STUDIO_ORIGIN}/request` },
  };
}

/* ---- Activity rows ------------------------------------------------ */

export type StudioActivityRow = {
  id: string;
  activityType: string | null;
  title: string | null;
  description: string | null;
  status: string | null;
  occurredAt: string;
  actionUrl: string | null;
};

export function toStudioActivityRows(
  raw: ReadonlyArray<Record<string, unknown>>,
): StudioActivityRow[] {
  return raw.map((row, idx) => ({
    id: String(row.id || `${row.activity_type || "studio"}-${idx}`),
    activityType: row.activity_type ? String(row.activity_type) : null,
    title: row.title ? String(row.title) : null,
    description: row.description ? String(row.description) : null,
    status: row.status ? String(row.status) : null,
    occurredAt: String(row.created_at || ""),
    actionUrl: row.action_url ? String(row.action_url) : null,
  }));
}
