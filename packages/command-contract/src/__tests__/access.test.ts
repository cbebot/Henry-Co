import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  attentionItemId,
  type AttentionItem,
  type AttentionSurface,
  type Division,
  type StaffDivision,
} from "../types";
import {
  canViewCommandCenter,
  canViewStaffWorkspace,
  visibleItems,
  ownerViewer,
  staffViewer,
  customerViewer,
} from "../access";

function item(
  id: string,
  surface: AttentionSurface,
  staffScope: StaffDivision[],
): AttentionItem {
  return {
    id: attentionItemId(id),
    division: (staffScope[0] ?? "system") as Division,
    type: "support-escalation",
    priority: "medium",
    surface,
    status: "open",
    title: `item ${id}`,
    summary: "x",
    actionLabel: "Act",
    deepLink: `/x/${id}`,
    createdAt: "2026-06-04T10:00:00.000Z",
    staffScope,
  };
}

const FEED: AttentionItem[] = [
  item("owner-only", "owner", []),
  item("mkt-staff", "staff", ["marketplace"]),
  item("mkt-both", "both", ["marketplace"]),
  item("learn-staff", "staff", ["learn"]),
];

describe("command-center access gating", () => {
  it("only an owner-access viewer can view the Command Center", () => {
    assert.equal(canViewCommandCenter(ownerViewer()), true);
    assert.equal(canViewCommandCenter(staffViewer(["marketplace"])), false);
    assert.equal(canViewCommandCenter(customerViewer()), false);
  });

  it("only a staff-access viewer can view the Staff Workspace", () => {
    assert.equal(canViewStaffWorkspace(staffViewer(["marketplace"])), true);
    assert.equal(canViewStaffWorkspace(ownerViewer()), false);
    assert.equal(canViewStaffWorkspace(customerViewer()), false);
  });

  it("the owner sees the full firehose (every item, every surface)", () => {
    assert.equal(visibleItems(ownerViewer(), FEED).length, FEED.length);
  });

  it("a customer sees nothing on either surface", () => {
    assert.deepEqual(visibleItems(customerViewer(), FEED), []);
  });

  it("staff see only staff/both items scoped to their divisions", () => {
    const ids = visibleItems(staffViewer(["marketplace"]), FEED).map((i) => i.id);
    assert.deepEqual([...ids].sort(), ["mkt-both", "mkt-staff"]);
  });

  it("staff never see owner-only items", () => {
    const ids = visibleItems(staffViewer(["marketplace"]), FEED).map((i) => i.id);
    assert.ok(!ids.includes(attentionItemId("owner-only")));
  });

  it("staff scoped to one division do not see another division's items", () => {
    const ids = visibleItems(staffViewer(["learn"]), FEED).map((i) => i.id);
    assert.deepEqual(ids, [attentionItemId("learn-staff")]);
  });

  it("a multi-division staff member sees the union of their divisions", () => {
    const ids = visibleItems(staffViewer(["marketplace", "learn"]), FEED).map((i) => i.id);
    assert.deepEqual([...ids].sort(), ["learn-staff", "mkt-both", "mkt-staff"]);
  });
});
