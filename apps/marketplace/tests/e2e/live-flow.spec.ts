import { expect, test } from "@playwright/test";

test.describe("live marketplace flows", () => {
  test("buyer browse to quick-add to cart to checkout gate to tracking", async ({ page }) => {
    await page.goto("/search");
    await page.getByRole("button", { name: /Add .* to cart/i }).first().click();
    await expect(page.getByRole("heading", { name: /item ready|items ready/i })).toBeVisible();
    await page.getByRole("link", { name: /Checkout/i }).click();
    await expect(page.getByRole("heading", { name: /Sign in to protect the order history/i })).toBeVisible();

    await page.goto("/track/MKT-ORD-240402-001");
    await expect(page.getByText(/payment verified/i)).toBeVisible();
  });
});
