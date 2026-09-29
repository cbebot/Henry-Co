import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { countProvisionedOwners, resolveProvisionedStaffRole } from "./roles";

// V3-STAFF-SELFGRANT-FIX-01: the ONE decision for "is this account provisioned staff?".
// Only server-controlled sources count (an explicit owner-issued patch, the admin-API-only
// app_metadata, the existing profiles row). user_metadata is self-writable and is never an
// input; there is NO default — an account without a provisioned staff role gets null.
describe("resolveProvisionedStaffRole", () => {
  it("never defaults: an ordinary customer resolves to null", () => {
    assert.equal(resolveProvisionedStaffRole({}), null);
    assert.equal(resolveProvisionedStaffRole({ profileRole: "customer" }), null);
    assert.equal(
      resolveProvisionedStaffRole({ appMetadataRole: "customer", profileRole: "customer" }),
      null
    );
    assert.equal(resolveProvisionedStaffRole({ profileRole: null, appMetadataRole: undefined }), null);
  });

  it("ignores garbage / non-staff values in every slot", () => {
    assert.equal(resolveProvisionedStaffRole({ patchRole: "superuser" }), null);
    assert.equal(resolveProvisionedStaffRole({ appMetadataRole: 42 }), null);
    assert.equal(resolveProvisionedStaffRole({ profileRole: "admin" }), null);
  });

  it("honours an owner-issued patch first", () => {
    assert.equal(
      resolveProvisionedStaffRole({ patchRole: "manager", appMetadataRole: "rider", profileRole: "staff" }),
      "manager"
    );
  });

  it("then the admin-set app_metadata, then the existing profile row", () => {
    assert.equal(resolveProvisionedStaffRole({ appMetadataRole: "rider", profileRole: "staff" }), "rider");
    assert.equal(resolveProvisionedStaffRole({ profileRole: "support" }), "support");
    assert.equal(resolveProvisionedStaffRole({ appMetadataRole: "customer", profileRole: "owner" }), "owner");
  });

  it("normalises case/whitespace", () => {
    assert.equal(resolveProvisionedStaffRole({ appMetadataRole: "  Staff " }), "staff");
  });

  it("has no user_metadata input at all (type-level contract)", () => {
    // @ts-expect-error — userMetadataRole is deliberately not a parameter.
    assert.equal(resolveProvisionedStaffRole({ userMetadataRole: "owner" }), null);
  });
});

// The last-owner guard counts owners by the same precedence the owner console uses for
// the target (admin-set app_metadata, then the grant-verified profile role), so a second
// owner whose role lives only in profiles still counts. Archived accounts and self-writable
// user_metadata never count.
describe("countProvisionedOwners", () => {
  const verified = (entries: Array<[string, string | null]>) => new Map(entries);

  it("counts an app_metadata owner and a grant-verified profile-only owner", () => {
    const users = [
      { id: "o1", app_metadata: { role: "owner" } },
      { id: "o2", app_metadata: {} },
    ];
    assert.equal(countProvisionedOwners(users, verified([["o2", "owner"]])), 2);
  });

  it("does not count a profile owner without grant evidence", () => {
    const users = [{ id: "o1", app_metadata: { role: "owner" } }, { id: "x", app_metadata: {} }];
    assert.equal(countProvisionedOwners(users, verified([["x", null]])), 1);
  });

  it("never counts user_metadata", () => {
    const users = [{ id: "u", app_metadata: {}, user_metadata: { role: "owner" } }];
    assert.equal(countProvisionedOwners(users, verified([])), 0);
  });

  it("skips archived accounts", () => {
    const users = [
      { id: "o1", app_metadata: { role: "owner", deleted_at: "2026-09-01T00:00:00Z" } },
      { id: "o2", app_metadata: {} },
    ];
    assert.equal(countProvisionedOwners(users, verified([["o2", "owner"]])), 1);
  });

  it("follows the console precedence: an app_metadata staff role wins over a profile owner", () => {
    const users = [{ id: "m", app_metadata: { role: "manager" } }];
    assert.equal(countProvisionedOwners(users, verified([["m", "owner"]])), 0);
  });

  it("counts each account once", () => {
    const users = [
      { id: "o1", app_metadata: { role: "owner" } },
      { id: "o1", app_metadata: { role: "owner" } },
    ];
    assert.equal(countProvisionedOwners(users, verified([])), 1);
  });
});
