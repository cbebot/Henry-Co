import { expect, test } from "@playwright/test";

test("homepage, search, product, cart, and help surfaces load", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("HenryCo Marketplace")).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /A marketplace built to feel calmer, sharper, and more trustworthy than the norm\./i,
    }),
  ).toBeVisible();

  await page.goto("/search");
  await expect(
    page.getByRole("heading", {
      name: /World-class filtering without world-class clutter\./i,
    }),
  ).toBeVisible();

  const firstProductLink = page.getByRole("link", { name: /View/i }).first();
  await expect(firstProductLink).toBeVisible();
  await firstProductLink.click();

  await expect(page.getByRole("button", { name: /Add to cart/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Save to wishlist|Sign in to save/i })).toBeVisible();

  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: /Cart clarity/i })).toBeVisible();

  await page.goto("/help");
  await expect(page.getByRole("button", { name: /Open support thread/i })).toBeVisible();
});
