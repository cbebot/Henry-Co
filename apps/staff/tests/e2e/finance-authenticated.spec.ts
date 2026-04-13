import { expect, test } from "@playwright/test";
import { addStaffFinanceSession } from "../../../../tests/e2e/support/supabase-session";

const STAFF_TEST_BASE_URL =
  process.env.STAFF_E2E_BASE_URL || "http://127.0.0.1:3020";

test("authenticated staff finance workspace renders live settlement controls", async ({
  context,
  page,
}) => {
  await addStaffFinanceSession(context, STAFF_TEST_BASE_URL);

  await page.goto("/finance", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: /^Finance$/i })).toBeVisible();
  const bodyText = await page.locator("body").textContent();
  expect(bodyText || "").toMatch(/NGN settlement live/i);
  await expect(page.getByRole("heading", { name: /Pending Finance Queue/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Ledger Publishing Gaps/i })).toBeVisible();
});
