import { expect, test } from "@playwright/test";
import { addCustomerSession } from "../../../../tests/e2e/support/supabase-session";

const ACCOUNT_TEST_BASE_URL =
  process.env.ACCOUNT_E2E_BASE_URL || "http://127.0.0.1:3013";

test.describe("authenticated account currency surfaces", () => {
  test.beforeEach(async ({ context }) => {
    await addCustomerSession(context, ACCOUNT_TEST_BASE_URL);
  });

  test("wallet shows settlement truth without promising fake rails", async ({ page }) => {
    await page.goto("/wallet", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /^Wallet$/i })).toBeVisible();
    const bodyText = await page.locator("body").textContent();
    expect(bodyText || "").toMatch(/Display .* Settlement /i);
    expect(bodyText || "").toMatch(
      /Amounts can display in .* settlement currently runs in NGN|Settlement currently runs in NGN\./i
    );
  });

  test("invoices page loads with truthful ledger messaging", async ({ page }) => {
    await page.goto("/invoices", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /Invoices & Receipts/i })).toBeVisible();
    const bodyText = await page.locator("body").textContent();
    expect(bodyText || "").toMatch(
      /Your payment history and downloadable receipts\.|No invoices yet/i
    );
  });

  test("subscriptions page loads with pricing and settlement context", async ({ page }) => {
    await page.goto("/subscriptions", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /^Subscriptions$/i })).toBeVisible();
    const bodyText = await page.locator("body").textContent();
    expect(bodyText || "").toMatch(/Read-only plan summary from divisions|No synced subscriptions yet/i);
  });
});
