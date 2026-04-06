import { expect, test } from "@playwright/test";

test.describe("Property public auth gates", () => {
  test("submit page shows account gate and hides listing form when logged out", async ({ page }) => {
    await page.goto("/submit");
    await expect(page.locator('[data-property-auth-gate="required"]')).toBeVisible();
    await expect(
      page.locator("#submission form input[name=\"intent\"][value=\"listing_submit\"]")
    ).toHaveCount(0);
  });
});
