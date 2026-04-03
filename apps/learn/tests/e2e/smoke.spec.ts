import { expect, test } from "@playwright/test";

test("public academy loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /one calm academy for learning/i })).toBeVisible();
  await page.getByRole("link", { name: /explore courses/i }).first().click();
  await expect(page).toHaveURL(/\/courses/);
});
