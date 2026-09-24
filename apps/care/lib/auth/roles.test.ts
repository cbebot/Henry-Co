import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveProvisionedStaffRole } from "./roles";

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
