import { expect, test } from "@playwright/test";

/**
 * Regression: /api/marketplace form handlers must redirect with 303 See Other
 * (POST-Redirect-GET), NOT the NextResponse.redirect() default of 307
 * (method-PRESERVING). A 307 made the browser RE-POST to the destination page,
 * and a POST to a GET-only RSC page (e.g. the post-checkout /track/[orderNo])
 * threw "Failed to find Server Action" → a live 500 right after payment.
 *
 * `cart_add` with no product is the simplest handler that hits redirectTo()
 * (-> /cart?error=missing-product), so it pins the status without auth or cart
 * state. This test FAILS on the old 307 default and passes on 303.
 */
test("marketplace form handlers redirect with 303, not 307", async ({ request }) => {
  const res = await request.post("/api/marketplace", {
    form: { intent: "cart_add" },
    maxRedirects: 0,
  });
  expect(res.status()).toBe(303);
  expect(res.headers()["location"]).toBeTruthy();
});

/**
 * An unknown / mistyped order reference must land on the graceful, track-scoped
 * recovery (correct 404 status, but a calm "we couldn't find that order" page
 * with the lookup form to retry) — NOT the generic full-page "That page isn't
 * here" 404.
 */
test("unknown track code renders the graceful recovery, not the generic 404", async ({ page }) => {
  // Note: a force-dynamic route streams its response, so notFound() can't change
  // the already-sent 200 — the meaningful signal is the rendered UI, not status.
  await page.goto("/track/MKT-ORD-DOES-NOT-EXIST-000000", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: /could.?n.?t find that order/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /try again/i })).toBeVisible();
  // The generic full-page 404 must NOT be what the visitor sees.
  await expect(page.getByText(/That page isn.?t here/i)).toHaveCount(0);
});
