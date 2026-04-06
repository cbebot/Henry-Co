import { expect, test } from "@playwright/test";

test("homepage, search, product, cart, and help surfaces load", async ({ page }) => {
  test.setTimeout(90000);

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("banner").getByRole("link", { name: /HC HenryCo Marketplace/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /Buy from verified stores without the noise, clutter, or trust guesswork\./i,
    }),
  ).toBeVisible();

  await page.goto("/search", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", {
      name: /Reactive discovery with premium filters and calmer hierarchy\./i,
    }),
  ).toBeVisible();

  const quickAddButton = page.getByRole("button", { name: /Add .* to cart/i }).first();
  await expect(quickAddButton).toBeVisible();
  await quickAddButton.click();
  await expect(page.getByRole("heading", { name: /item ready|items ready/i })).toBeVisible();

  const firstProductLink = page.locator('a[href^="/product/"]').first();
  await expect(firstProductLink).toBeVisible();
  await firstProductLink.click();

  await page.waitForURL(/\/product\/.+/);
  await expect(page.getByRole("heading", { name: /Oro Brass Desk Lamp/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Add to cart|Adding/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Save|Saved/i }).first()).toBeVisible();

  await page.goto("/cart", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: /A premium basket with faster edits and cleaner split-order clarity\./i }),
  ).toBeVisible();

  await page.goto("/sell", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", {
      name: /A selective marketplace for sellers who want trust, cleaner operations, and better conversion quality\./i,
    }),
  ).toBeVisible();

  await page.goto("/help", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: /Support flows designed to resolve edge cases, not create new ones\./i }),
  ).toBeVisible();
});
