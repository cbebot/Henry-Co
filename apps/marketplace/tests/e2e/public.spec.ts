import { expect, test } from "@playwright/test";

test("homepage, search, product, cart, and help surfaces load", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("HenryCo Marketplace")).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /Shop a calmer marketplace with better structure, better trust, and faster decisions\./i,
    }),
  ).toBeVisible();

  await page.goto("/search");
  await expect(
    page.getByRole("heading", {
      name: /Reactive discovery with premium filters and calmer hierarchy\./i,
    }),
  ).toBeVisible();

  const quickAddButton = page.getByRole("button", { name: /Add .* to cart/i }).first();
  await expect(quickAddButton).toBeVisible();
  await quickAddButton.click();
  await expect(page.getByRole("heading", { name: /item ready|items ready/i })).toBeVisible();

  const firstProductLink = page.getByRole("link", { name: /View/i }).first();
  await expect(firstProductLink).toBeVisible();
  await firstProductLink.click();

  await expect(page.getByRole("button", { name: /Add to cart/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Save|Saved/i }).first()).toBeVisible();

  await page.goto("/cart");
  await expect(
    page.getByRole("heading", { name: /A premium basket with faster edits and cleaner split-order clarity\./i }),
  ).toBeVisible();

  await page.goto("/help");
  await expect(
    page.getByRole("heading", { name: /Support flows designed to resolve edge cases, not create new ones\./i }),
  ).toBeVisible();
});
