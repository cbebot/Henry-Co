import { expect, test } from "@playwright/test";
import { addCustomerSession } from "../../../../tests/e2e/support/supabase-session";

const MARKETPLACE_TEST_BASE_URL =
  process.env.MARKETPLACE_E2E_BASE_URL || process.env.PLAYWRIGHT_TEST_BASE_URL || "http://127.0.0.1:3016";

test("signed-in header exposes account menu shortcuts", async ({ context, page }) => {
  await addCustomerSession(context, MARKETPLACE_TEST_BASE_URL);

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator('header[data-marketplace-interactive="true"]')).toBeVisible();

  const accountMenuButton = page.getByRole("button", { name: /account menu for/i });
  await expect(accountMenuButton).toBeVisible({ timeout: 30000 });
  await accountMenuButton.click();

  await expect
    .poll(async () => (await page.locator("body").textContent()) || "", {
      timeout: 10000,
    })
    .toMatch(/Profile & account/i);

  const bodyText = (await page.locator("body").textContent()) || "";
  expect(bodyText).toMatch(/Saved items/i);
  expect(bodyText).toMatch(/Orders/i);
  expect(bodyText).toMatch(/Settings/i);
  expect(bodyText).toMatch(/Sign out/i);
});
