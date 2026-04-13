import { expect, test } from "@playwright/test";
import { addCustomerSession } from "../../../../tests/e2e/support/supabase-session";

const MARKETPLACE_TEST_BASE_URL =
  process.env.MARKETPLACE_E2E_BASE_URL ||
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
  "http://127.0.0.1:3016";

test("signed-in checkout keeps settlement truth visible", async ({ context, page }) => {
  await addCustomerSession(context, MARKETPLACE_TEST_BASE_URL);

  await page.goto("/search", { waitUntil: "domcontentloaded" });
  const addToCart = page.getByRole("button", { name: /Add .* to cart/i }).first();
  await expect(addToCart).toBeVisible();
  await addToCart.click();

  await page.goto("/checkout", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("heading", { name: /A clearer path from basket to confirmed order\./i })
  ).toBeVisible();
  await expect(page.getByText(/^Bank transfer$/)).toBeVisible();
  await expect(
    page.getByText(/localized display does not change settlement|settles natively in NGN/i)
  ).toBeVisible();
});
