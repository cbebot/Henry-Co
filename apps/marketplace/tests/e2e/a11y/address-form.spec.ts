// V2-A11Y-01 — AddressForm error-message linkage contract.
//
// Asserts WCAG 3.3.1: when a field has a validation error, the input is
// marked aria-invalid and aria-describedby points at a live message that
// announces via role="alert".
//
// This spec is intentionally lightweight — it stubs the form rather than
// driving the full Places Autocomplete flow, since the autocomplete depends
// on a Google Places proxy. The form contract (aria-invalid + aria-describedby
// + role="alert") is what WCAG actually requires.

import { expect, test } from "@playwright/test";

const HARNESS_URL = "/account/addresses?test-harness=address-form";

test.describe("AddressForm a11y contract", () => {
  test.skip(
    !process.env.MARKETPLACE_E2E_BASE_URL,
    "needs a running marketplace instance with the test harness mounted",
  );

  test("submitting empty form announces errors via role=alert", async ({
    page,
  }) => {
    await page.goto(HARNESS_URL);

    await page.getByRole("button", { name: /save address/i }).click();

    const alerts = page.getByRole("alert");
    await expect(alerts.first()).toBeVisible();

    const search = page.getByRole("combobox", { name: /search for your address/i });
    await expect(search).toHaveAttribute("aria-invalid", "true");
    const describedBy = await search.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    if (describedBy) {
      const messageEl = page.locator(`#${describedBy.split(" ")[0]}`);
      await expect(messageEl).toBeVisible();
      await expect(messageEl).toHaveAttribute("role", "alert");
    }
  });
});
