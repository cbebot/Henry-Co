// V3-INNER-L-ELEVATE-STUDIO — proof for the studio-home editorial masthead model.
//
// The client dashboard's above-the-fold answer (Q1 "what's happening with my
// commission?" + Q2 "what should I do next?") is derived from pure functions
// so the page body stays a thin compose and the state->copy contract is
// testable. Copy flows through an injected translator (the page passes
// translateSurfaceLabel) so these tests run with an identity translator and
// assert structure, not prose. The module imports ONLY types, so it runs
// under bare `node --test` with no server-only / auth / Supabase.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type {
  ClientDeliverable,
  ClientDeliverableStatus,
  ClientMessage,
  ClientMilestone,
  ClientMilestoneStatus,
  ClientPortalViewer,
  ClientProject,
  ClientProjectStatus,
  StudioInvoice,
  StudioInvoiceStatus,
} from "../../../types/portal";
import {
  studioDashboardStats,
  studioHomeState,
  buildStudioHero,
  buildStudioNextStep,
  type StudioHomeInput,
} from "../studio-home";

const identity = (s: string) => s;
let seq = 0;

const VIEWER: ClientPortalViewer = {
  userId: "user-1",
  email: "ada@example.com",
  fullName: "Ada Obi",
  avatarUrl: null,
  normalizedEmail: "ada@example.com",
};

function project(status: ClientProjectStatus, extra: Partial<ClientProject> = {}): ClientProject {
  return {
    id: extra.id ?? `proj-${status}-${seq++}`,
    title: "Brand system",
    brief: null,
    summary: "",
    nextAction: null,
    type: null,
    status,
    startDate: null,
    estimatedCompletion: null,
    actualCompletion: null,
    clientUserId: VIEWER.userId,
    teamLeadId: null,
    createdAt: "2026-06-20T10:00:00.000Z",
    updatedAt: "2026-06-20T10:00:00.000Z",
    accessKey: null,
    ...extra,
  };
}

function milestone(
  projectId: string,
  status: ClientMilestoneStatus,
  extra: Partial<ClientMilestone> = {},
): ClientMilestone {
  return {
    id: `m-${seq++}`,
    projectId,
    title: "Milestone",
    description: "",
    dueDate: null,
    dueLabel: "",
    amountKobo: 0,
    currency: "NGN",
    status,
    orderIndex: 0,
    ...extra,
  };
}

function invoice(status: StudioInvoiceStatus, extra: Partial<StudioInvoice> = {}): StudioInvoice {
  return {
    id: `inv-${seq++}`,
    projectId: "proj",
    milestoneId: null,
    clientUserId: VIEWER.userId,
    normalizedEmail: null,
    invoiceNumber: "HS-1001",
    amountKobo: 1_950_000,
    currency: "NGN",
    description: "",
    dueDate: null,
    status,
    invoiceToken: null,
    issuedAt: "2026-06-20T10:00:00.000Z",
    paidAt: null,
    createdAt: "2026-06-20T10:00:00.000Z",
    updatedAt: "2026-06-20T10:00:00.000Z",
    ...extra,
  };
}

function deliverable(
  status: ClientDeliverableStatus,
  extra: Partial<ClientDeliverable> = {},
): ClientDeliverable {
  return {
    id: `d-${seq++}`,
    projectId: "proj",
    milestoneId: null,
    title: "Logo pack",
    description: "",
    fileUrl: null,
    filePublicId: null,
    fileType: "other",
    thumbnailUrl: null,
    version: 1,
    status,
    sharedAt: null,
    approvedAt: null,
    approvedBy: null,
    uploadedBy: null,
    createdAt: "2026-06-20T10:00:00.000Z",
    ...extra,
  };
}

function message(extra: Partial<ClientMessage> = {}): ClientMessage {
  return {
    id: `msg-${seq++}`,
    projectId: "proj",
    senderId: "team-1",
    senderName: "Henry Onyx Studio",
    senderRole: "team",
    body: "An update from the team",
    attachments: [],
    readBy: [],
    createdAt: "2026-06-20T10:00:00.000Z",
    editedAt: null,
    isOwnMessage: false,
    ...extra,
  };
}

function input(partial: Partial<StudioHomeInput> = {}): StudioHomeInput {
  return {
    viewer: VIEWER,
    projects: [],
    milestones: [],
    invoices: [],
    deliverables: [],
    messages: [],
    ...partial,
  };
}

describe("studioDashboardStats", () => {
  it("counts active / completed projects, the active project's milestones, deliverables, invoices, and unread messages", () => {
    const active = project("active", { id: "P-active" });
    const stats = studioDashboardStats(
      input({
        projects: [active, project("complete"), project("enquiry")],
        milestones: [
          milestone("P-active", "approved"),
          milestone("P-active", "complete"),
          milestone("P-active", "in_progress"),
          milestone("P-active", "upcoming"),
          // a milestone on ANOTHER project must not be counted into the active progress
          milestone("P-other", "approved"),
        ],
        deliverables: [deliverable("shared"), deliverable("shared"), deliverable("approved")],
        invoices: [
          invoice("sent"),
          invoice("overdue"),
          invoice("pending_verification"),
          invoice("paid"),
        ],
        messages: [
          message(), // team, unread
          message({ isOwnMessage: true, senderRole: "client", senderId: "user-1" }), // own
          message({ readBy: ["user-1"] }), // read by viewer
        ],
      }),
    );

    assert.equal(stats.totalProjects, 3);
    assert.equal(stats.activeProjects, 1);
    assert.equal(stats.completedProjects, 1);
    assert.equal(stats.activeProjectId, "P-active");
    assert.equal(stats.milestonesTotal, 4); // only P-active's four
    assert.equal(stats.milestonesDone, 2); // approved + complete
    assert.equal(stats.deliverablesAwaitingReview, 2);
    assert.equal(stats.outstandingInvoices, 3); // sent + overdue + pending_verification
    assert.equal(stats.overdueInvoices, 1);
    assert.equal(stats.sentInvoices, 1);
    assert.equal(stats.unreadMessages, 1);
    // needsAction mirrors buildAttentionItems: outstanding(3) + awaiting(2) + min(unread,3)=1
    assert.equal(stats.needsAction, 6);
  });

  it("features the first active-status project, falling back to the first project when none is active", () => {
    const fallback = studioDashboardStats(
      input({ projects: [project("complete", { id: "C1", title: "Old site" }), project("paused", { id: "P2" })] }),
    );
    assert.equal(fallback.activeProjects, 0);
    assert.equal(fallback.activeProjectId, "C1");
    assert.equal(fallback.activeProjectTitle, "Old site");
  });
});

describe("studioHomeState", () => {
  it("is empty only when there are no projects", () => {
    assert.equal(studioHomeState(studioDashboardStats(input())), "empty");
  });

  it("is attention when something needs the client (unpaid invoice / shared deliverable / unread message)", () => {
    assert.equal(
      studioHomeState(studioDashboardStats(input({ projects: [project("active")], invoices: [invoice("overdue")] }))),
      "attention",
    );
    assert.equal(
      studioHomeState(
        studioDashboardStats(input({ projects: [project("active")], deliverables: [deliverable("shared")] })),
      ),
      "attention",
    );
  });

  it("is active when a project is in production and nothing needs action", () => {
    assert.equal(studioHomeState(studioDashboardStats(input({ projects: [project("active")] }))), "active");
  });

  it("is calm when projects exist but none in production and nothing pending", () => {
    assert.equal(studioHomeState(studioDashboardStats(input({ projects: [project("complete")] }))), "calm");
  });

  it("attention outranks active when both are present", () => {
    const stats = studioDashboardStats(
      input({ projects: [project("active")], deliverables: [deliverable("shared")] }),
    );
    assert.equal(studioHomeState(stats), "attention");
  });
});

describe("buildStudioHero", () => {
  it("mirrors the page state as the hero tone and renders four real-value tiles with a primary CTA", () => {
    const stats = studioDashboardStats(input({ projects: [project("active", { id: "P1", title: "Mobile app" })] }));
    const hero = buildStudioHero(stats, identity);
    assert.equal(hero.tone, "active");
    assert.equal(hero.tiles.length, 4);
    assert.ok(hero.ctaPrimary && typeof hero.ctaPrimary.href === "string");
    // the active state features the project name as the masthead headline
    assert.match(hero.headline, /Mobile app/);
  });

  it("counts the things-that-need-you into the attention headline", () => {
    const stats = studioDashboardStats(
      input({ projects: [project("active")], invoices: [invoice("overdue"), invoice("sent")] }),
    );
    const hero = buildStudioHero(stats, identity);
    assert.equal(hero.tone, "attention");
    assert.match(hero.headline, /2/);
  });

  it("points the empty-state primary CTA at the brief builder", () => {
    const hero = buildStudioHero(studioDashboardStats(input()), identity);
    assert.equal(hero.tone, "empty");
    assert.ok(hero.ctaPrimary);
    assert.match(hero.ctaPrimary!.href, /request/);
  });

  it("filters zero-count breakdown rows and uses CSS-variable dot colors (never a raw hex)", () => {
    const stats = studioDashboardStats(
      input({
        projects: [project("active"), project("complete")],
        deliverables: [deliverable("shared")],
        invoices: [invoice("overdue")],
      }),
    );
    const hero = buildStudioHero(stats, identity);
    const rows = hero.side.breakdown?.rows ?? [];
    assert.ok(rows.length > 0);
    assert.ok(rows.every((r) => r.count > 0));
    for (const row of rows) assert.match(row.color, /^var\(--/);
  });

  it("exposes a milestone progress strip (0-100) for the active project", () => {
    const stats = studioDashboardStats(
      input({
        projects: [project("active", { id: "P1" })],
        milestones: [
          milestone("P1", "approved"),
          milestone("P1", "complete"),
          milestone("P1", "in_progress"),
          milestone("P1", "upcoming"),
        ],
      }),
    );
    const hero = buildStudioHero(stats, identity);
    assert.ok(hero.progress);
    assert.equal(hero.progress!.percent, 50); // 2 of 4 done
  });

  it("formats the ETA foot through the injected date formatter (no date logic in the model)", () => {
    const stats = studioDashboardStats(
      input({ projects: [project("active", { id: "P1", estimatedCompletion: "2026-08-01T00:00:00.000Z" })] }),
    );
    const hero = buildStudioHero(stats, identity, () => "1 Aug");
    const productionTile = hero.tiles[0];
    assert.match(String(productionTile.foot), /1 Aug/);
  });
});

describe("buildStudioNextStep", () => {
  it("returns null when there is nothing pending (calm/empty carry Q2 via the hero CTA)", () => {
    assert.equal(buildStudioNextStep(input(), studioDashboardStats(input()), identity), null);
    const calm = input({ projects: [project("active")] });
    assert.equal(buildStudioNextStep(calm, studioDashboardStats(calm), identity), null);
  });

  it("asks the client to settle an overdue invoice first, naming the specific invoice", () => {
    const data = input({
      projects: [project("active")],
      invoices: [invoice("overdue", { invoiceNumber: "HS-2048" })],
    });
    const step = buildStudioNextStep(data, studioDashboardStats(data), identity);
    assert.ok(step);
    assert.equal(step!.tone, "attention");
    assert.equal(step!.iconKey, "pay");
    assert.match(step!.title, /HS-2048/);
    assert.match(step!.cta.href, /payments/);
  });

  it("invoice outranks a shared deliverable, which outranks an unread message", () => {
    const all = input({
      projects: [project("active")],
      invoices: [invoice("sent", { invoiceNumber: "HS-9" })],
      deliverables: [deliverable("shared", { title: "Hero comps" })],
      messages: [message()],
    });
    assert.equal(buildStudioNextStep(all, studioDashboardStats(all), identity)!.iconKey, "pay");

    const noInvoice = input({
      projects: [project("active")],
      deliverables: [deliverable("shared", { title: "Hero comps" })],
      messages: [message()],
    });
    const dStep = buildStudioNextStep(noInvoice, studioDashboardStats(noInvoice), identity);
    assert.equal(dStep!.iconKey, "review");
    assert.match(dStep!.title, /Hero comps/);

    const onlyMsg = input({ projects: [project("active")], messages: [message()] });
    const mStep = buildStudioNextStep(onlyMsg, studioDashboardStats(onlyMsg), identity);
    assert.equal(mStep!.iconKey, "message");
    assert.match(mStep!.cta.href, /messages/);
  });
});
