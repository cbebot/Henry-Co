// V3-INNER-L-ELEVATE-STUDIO — the studio-home editorial masthead model.
//
// Pure derivation of the client dashboard's above-the-fold answer:
//   Q1 "what's happening with my commission?" -> the HeroCard tiles + side
//   Q2 "what should I do next?"               -> the hero CTA + one NextStepRow
//
// Keeping this logic out of the page body means the state->copy contract is
// testable (see __tests__/studio-home.test.ts) and the page stays a thin
// compose. All user-visible copy flows through an injected translator `t`
// (the page passes `(s) => translateSurfaceLabel(locale, s)`), so this module
// holds zero JSX and zero hardcoded surface strings of its own — the strict
// i18n gate never sees a literal here. Dates are formatted through an injected
// `formatDate` (the page passes `shortDate`) so the model imports ONLY types
// and stays runnable under bare `node --test` (no server-only / auth / DB).

import type {
  ClientDeliverable,
  ClientMessage,
  ClientMilestone,
  ClientMilestoneStatus,
  ClientPortalViewer,
  ClientProject,
  ClientProjectStatus,
  StudioInvoice,
} from "../../types/portal";

export type StudioHomeInput = {
  viewer: ClientPortalViewer;
  projects: ClientProject[];
  milestones: ClientMilestone[];
  invoices: StudioInvoice[];
  deliverables: ClientDeliverable[];
  messages: ClientMessage[];
};

export type StudioHomeState = "empty" | "calm" | "active" | "attention";

export type Translate = (value: string) => string;
export type FormatDate = (iso: string | null) => string | null;

export type StudioStats = {
  totalProjects: number;
  /** Projects in production (active / review / revision / onboarding). */
  activeProjects: number;
  /** Projects signed off (approved / complete / delivered / archived). */
  completedProjects: number;
  /** The project to feature: first in-production, else the most recent. */
  activeProjectId: string | null;
  activeProjectTitle: string | null;
  activeEta: string | null;
  /** Milestone progress for the FEATURED project only. */
  milestonesTotal: number;
  milestonesDone: number;
  /** Deliverables shared with the client, awaiting their review. */
  deliverablesAwaitingReview: number;
  /** Invoices the client still owes against (sent / overdue / pending verify). */
  outstandingInvoices: number;
  overdueInvoices: number;
  sentInvoices: number;
  pendingVerificationInvoices: number;
  /** Team messages the client hasn't read. */
  unreadMessages: number;
  /** Items needing the client's hand — mirrors buildAttentionItems(). */
  needsAction: number;
};

// ── Status sets (aligned with app/client/page.tsx + the data layer) ─────────
const ACTIVE_STATUSES = new Set<ClientProjectStatus>([
  "active",
  "review",
  "revision",
  "onboarding",
  "in_review",
]);
const COMPLETED_STATUSES = new Set<ClientProjectStatus>([
  "approved",
  "complete",
  "delivered",
  "archived",
]);
const MILESTONE_DONE = new Set<ClientMilestoneStatus>(["approved", "complete"]);

export function studioDashboardStats(input: StudioHomeInput): StudioStats {
  const projects = input.projects ?? [];
  const milestones = input.milestones ?? [];
  const invoices = input.invoices ?? [];
  const deliverables = input.deliverables ?? [];
  const messages = input.messages ?? [];
  const viewerId = input.viewer?.userId ?? "";

  // The featured project mirrors the dashboard's own selection: the first
  // in-production project, else the most recent one on record.
  const featured =
    projects.find((p) => ACTIVE_STATUSES.has(p.status)) ?? projects[0] ?? null;
  const featuredMilestones = featured
    ? milestones.filter((m) => m.projectId === featured.id)
    : [];

  const countInvoices = (statuses: ReadonlyArray<StudioInvoice["status"]>) => {
    const set = new Set(statuses);
    return invoices.reduce((n, i) => (set.has(i.status) ? n + 1 : n), 0);
  };

  const overdueInvoices = countInvoices(["overdue"]);
  const sentInvoices = countInvoices(["sent"]);
  const pendingVerificationInvoices = countInvoices(["pending_verification"]);
  const outstandingInvoices = overdueInvoices + sentInvoices + pendingVerificationInvoices;
  const deliverablesAwaitingReview = deliverables.filter((d) => d.status === "shared").length;
  const unreadMessages = messages.filter(
    (m) => m.senderRole !== "client" && !m.isOwnMessage && !m.readBy.includes(viewerId),
  ).length;

  return {
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => ACTIVE_STATUSES.has(p.status)).length,
    completedProjects: projects.filter((p) => COMPLETED_STATUSES.has(p.status)).length,
    activeProjectId: featured?.id ?? null,
    activeProjectTitle: featured?.title ?? null,
    activeEta: featured?.estimatedCompletion ?? null,
    milestonesTotal: featuredMilestones.length,
    milestonesDone: featuredMilestones.filter((m) => MILESTONE_DONE.has(m.status)).length,
    deliverablesAwaitingReview,
    outstandingInvoices,
    overdueInvoices,
    sentInvoices,
    pendingVerificationInvoices,
    unreadMessages,
    // The attention count mirrors buildAttentionItems(): every outstanding
    // invoice + every shared deliverable + up to three unread messages.
    needsAction: outstandingInvoices + deliverablesAwaitingReview + Math.min(unreadMessages, 3),
  };
}

export function studioHomeState(stats: StudioStats): StudioHomeState {
  if (stats.totalProjects === 0) return "empty";
  if (stats.needsAction > 0) return "attention";
  if (stats.activeProjects > 0) return "active";
  return "calm";
}

// ── Hero model ───────────────────────────────────────────────────────────────
export type StudioHeroTile = {
  label: string;
  value: string | number;
  foot?: string | null;
  tone?: "default" | "accent" | "active" | "warning";
  /** Deep-link to the matching, pre-filtered destination (interactive tile). */
  href?: string;
};

export type StudioHeroBreakdownRow = { label: string; count: number; color: string };

export type StudioHeroModel = {
  tone: StudioHomeState;
  eyebrow: string;
  headline: string;
  blurb: string;
  ariaLabel: string;
  ariaTilesLabel: string;
  ctaPrimary: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
  tiles: StudioHeroTile[];
  progress?: { percent: number; label: string };
  side: {
    kicker: string;
    title: string;
    body: string;
    breakdown?: { label: string; ariaLabel: string; rows: StudioHeroBreakdownRow[] };
  };
};

export function buildStudioHero(
  stats: StudioStats,
  t: Translate,
  formatDate: FormatDate = () => null,
): StudioHeroModel {
  const tone = studioHomeState(stats);
  const projectHref = stats.activeProjectId ? `/client/projects/${stats.activeProjectId}` : "/client";

  let eyebrowState: string;
  let headline: string;
  let blurb: string;
  let ctaPrimary: { label: string; href: string };

  if (tone === "empty") {
    eyebrowState = t("your studio");
    headline = t("Your studio, kept as one commission");
    blurb = t(
      "Briefs, milestones, files, messages, and payments — every signal from your work with Henry Onyx Studio, on one record.",
    );
    ctaPrimary = { label: t("Start a brief"), href: "/request" };
  } else if (tone === "attention") {
    eyebrowState = t("needs you");
    headline = `${stats.needsAction} ${t(stats.needsAction === 1 ? "thing needs you" : "things need you")}`;
    blurb = t("A few things are waiting on you. Clear them and the studio keeps moving.");
    ctaPrimary = { label: t("Open your project"), href: projectHref };
  } else if (tone === "active") {
    eyebrowState = t("in production");
    headline = stats.activeProjectTitle ?? t("Your project is in production");
    blurb = t("Your studio team is building. Follow it from brief to delivery, all in one place.");
    ctaPrimary = { label: t("Open your project"), href: projectHref };
  } else {
    eyebrowState = t("your dossier");
    headline = `${stats.totalProjects} ${t(stats.totalProjects === 1 ? "project on your dossier" : "projects on your dossier")}`;
    blurb = t("Everything you've commissioned, kept on one calm record. Pick up where you left off.");
    ctaPrimary = stats.activeProjectId
      ? { label: t("Open your project"), href: projectHref }
      : { label: t("Start a brief"), href: "/request" };
  }

  const etaLabel =
    stats.activeProjects > 0 && stats.activeEta ? formatDate(stats.activeEta) : null;
  const productionFoot = etaLabel
    ? `${t("Due")} ${etaLabel}`
    : stats.totalProjects === 0
      ? t("Your studio lives here")
      : stats.activeProjects === 0
        ? t("Awaiting kickoff")
        : null;

  // Interactive deep-links: each tile opens its matching, pre-filtered list
  // instead of reading out a silent number.
  const projectDetailHref = stats.activeProjectId
    ? `/client/projects/${stats.activeProjectId}`
    : "/client/projects";

  const tiles: StudioHeroTile[] = [
    {
      label: t("In production"),
      value: stats.activeProjects,
      foot: productionFoot,
      tone: stats.activeProjects > 0 ? "active" : "default",
      href: "/client/projects?filter=active",
    },
    {
      label: t("Milestones"),
      value: stats.milestonesTotal > 0 ? `${stats.milestonesDone}/${stats.milestonesTotal}` : "—",
      foot: stats.milestonesTotal > 0 ? t("approved") : t("Set at kickoff"),
      tone: stats.milestonesDone > 0 ? "accent" : "default",
      href: projectDetailHref,
    },
    {
      label: t("Awaiting your review"),
      value: stats.deliverablesAwaitingReview,
      foot: stats.deliverablesAwaitingReview > 0 ? t("files shared") : null,
      tone: stats.deliverablesAwaitingReview > 0 ? "warning" : "default",
      href: "/client/files?filter=shared",
    },
    {
      label: t("Balance due"),
      value: stats.outstandingInvoices,
      foot: stats.outstandingInvoices > 0 ? t("awaiting payment") : null,
      tone: stats.outstandingInvoices > 0 ? "warning" : "default",
      href: "/client/payments?filter=outstanding",
    },
  ];

  const progressPercent =
    stats.milestonesTotal > 0
      ? Math.round((stats.milestonesDone / stats.milestonesTotal) * 100)
      : null;
  const progress =
    progressPercent !== null
      ? { percent: progressPercent, label: `${t("Milestones")} · ${progressPercent}%` }
      : undefined;

  const breakdownRows: StudioHeroBreakdownRow[] = [
    { label: t("In production"), count: stats.activeProjects, color: "var(--acct-gold)" },
    { label: t("Awaiting review"), count: stats.deliverablesAwaitingReview, color: "var(--acct-gold-strong)" },
    { label: t("Balance due"), count: stats.outstandingInvoices, color: "var(--acct-red)" },
    { label: t("Delivered"), count: stats.completedProjects, color: "var(--acct-green)" },
  ].filter((row) => row.count > 0);

  return {
    tone,
    eyebrow: `${t("Studio")} · ${eyebrowState}`,
    headline,
    blurb,
    ariaLabel: t("Studio workspace overview"),
    ariaTilesLabel: t("Studio snapshot"),
    ctaPrimary,
    ctaSecondary: stats.totalProjects > 0 ? { label: t("Message the team"), href: "/client/messages" } : undefined,
    tiles,
    progress,
    side: {
      kicker: t("Your dossier"),
      title: t("One commission, every signal"),
      body: t(
        "Briefs, milestones, files, messages, and payments — your whole engagement with Henry Onyx Studio, kept on one record.",
      ),
      breakdown:
        breakdownRows.length > 0
          ? { label: t("Right now"), ariaLabel: t("Studio breakdown"), rows: breakdownRows }
          : undefined,
    },
  };
}

// ── Next-step model ───────────────────────────────────────────────────────────
export type StudioNextStepModel = {
  tone: "neutral" | "attention" | "success";
  kicker: string;
  title: string;
  detail?: string;
  cta: { label: string; href: string };
  iconKey: "pay" | "review" | "message";
};

export function buildStudioNextStep(
  input: StudioHomeInput,
  stats: StudioStats,
  t: Translate,
): StudioNextStepModel | null {
  const invoices = input.invoices ?? [];
  const deliverables = input.deliverables ?? [];

  const overdue = invoices.find((i) => i.status === "overdue");
  if (overdue) {
    return {
      tone: "attention",
      kicker: t("Next step · payment"),
      title: `${t("Settle invoice")} ${overdue.invoiceNumber}`.trim(),
      detail: t("This invoice is overdue. Settling it keeps your project moving."),
      cta: { label: t("Settle invoice"), href: "/client/payments" },
      iconKey: "pay",
    };
  }

  const sent = invoices.find((i) => i.status === "sent");
  if (sent) {
    return {
      tone: "attention",
      kicker: t("Next step · payment"),
      title: `${t("Pay invoice")} ${sent.invoiceNumber}`.trim(),
      detail: t("Your studio invoice is ready. Complete payment to move the work forward."),
      cta: { label: t("Pay invoice"), href: "/client/payments" },
      iconKey: "pay",
    };
  }

  const shared = deliverables.find((d) => d.status === "shared");
  if (shared) {
    return {
      tone: "attention",
      kicker: t("Next step · review"),
      title: `${t("Review")} ${shared.title}`.trim(),
      detail: t("New work is ready for your eyes. Review and approve to keep the timeline on track."),
      cta: { label: t("Review files"), href: "/client/files" },
      iconKey: "review",
    };
  }

  if (stats.unreadMessages > 0) {
    return {
      tone: "neutral",
      kicker: t("Next step · messages"),
      title: t("Reply to the studio team"),
      detail: t("Your team is waiting to hear from you."),
      cta: { label: t("Open messages"), href: "/client/messages" },
      iconKey: "message",
    };
  }

  return null;
}
