import { expect, test } from "@playwright/test";

test("public academy loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /learn skills that stick/i })).toBeVisible();
  await page.getByRole("link", { name: /browse courses/i }).first().click();
  await expect(page).toHaveURL(/\/courses/);
  await page.goto("/teach");
  await expect(page.getByRole("heading", { name: /teach on a platform that protects learners/i })).toBeVisible();
});
