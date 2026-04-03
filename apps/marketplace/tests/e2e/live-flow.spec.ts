import { expect, test } from "@playwright/test";

test.describe("live marketplace flows", () => {
  test.skip(process.env.MARKETPLACE_DB_READY !== "1", "Requires live marketplace schema and seeded accounts.");

  test("buyer browse to cart to checkout to tracking", async ({ page }) => {
    await page.goto("/search");
    await page.getByRole("link", { name: /View/i }).first().click();
    await page.getByRole("button", { name: /Add to cart/i }).click();
    await page.goto("/cart");
    await expect(page.getByRole("link", { name: /Continue to checkout/i })).toBeVisible();
  });
});
