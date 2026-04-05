import { expect, test } from "@playwright/test";

test.describe("live marketplace flows", () => {
  test("buyer browse to quick-add to cart to checkout gate", async ({ page }) => {
    await page.goto("/search");
    await page.getByRole("button", { name: /Add .* to cart/i }).first().click();
    await expect(page.getByRole("heading", { name: /item ready|items ready/i })).toBeVisible();
    await page.getByRole("link", { name: /Checkout/i }).click();
    await expect(
      page.getByRole("heading", {
        name: /Sign in with your HenryCo account to protect your order history and payment record\./i,
      }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Sign in to continue/i })).toBeVisible();
  });
});
