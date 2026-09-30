import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFormFlag } from "./form-flags";

// The owner staff form posts a hidden "false" fallback BEFORE each checkbox, so
// FormData.get() always returned "false". readFormFlag looks at every submitted value.
describe("readFormFlag", () => {
  it("is on when the checkbox is checked, whatever the input order", () => {
    assert.equal(readFormFlag(["false", "true"], true), true);
    assert.equal(readFormFlag(["true", "false"], true), true);
    assert.equal(readFormFlag(["false", "on"], false), true);
  });

  it("is off when only the fallback is posted", () => {
    assert.equal(readFormFlag(["false"], true), false);
    assert.equal(readFormFlag([" FALSE "], true), false);
  });

  it("uses the default when the field is missing or empty", () => {
    assert.equal(readFormFlag([], true), true);
    assert.equal(readFormFlag([], false), false);
    assert.equal(readFormFlag([""], true), true);
  });
});
