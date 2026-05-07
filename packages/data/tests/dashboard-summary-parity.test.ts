/**
 * @henryco/data — dashboard summary parity test (DASH-1 G4).
 *
 * STATUS: STUB — REQUIRES OWNER-SIDE EXECUTION POST-MERGE.
 *
 * This file describes the parity contract `packages/data` ships
 * against `apps/account/lib/account-data.ts:getDashboardSummary`.
 * The actual test runner (Vitest / Jest) is not currently wired in
 * the workspace; the parity proof is captured manually:
 *
 *   1. Seed a customer fixture user via the existing seed scripts
 *      (apps/account/scripts/seed-test-customer.ts or equivalent).
 *
 *   2. Call BOTH:
 *        const a = await getDashboardSummary(userId);
 *          // from apps/account/lib/account-data.ts
 *        const b = await packagesDataGetDashboardSummary(viewer);
 *          // from @henryco/data
 *      against the seeded user.
 *
 *   3. Assert the relevant fields agree:
 *        - a.wallet.balance_kobo === b.wallet.balanceKobo
 *        - a.unreadNotificationCount === b.unreadNotificationCount
 *        - a.recentActivity.length === b.recentActivity.length
 *        - a.recentNotifications.length === b.recentNotifications.length
 *        - a.activeSubscriptions.length === b.activeSubscriptions.length
 *        - a.recentInvoices.length === b.recentInvoices.length
 *        - a.pendingInvoiceCount === b.pendingInvoiceCount
 *        - a.openSupportCount === b.openSupportCount
 *
 *   4. Capture the assertion transcript in
 *      `.codex-temp/v2-dash-01/parity-check.md`.
 *
 * Why a stub instead of an automated test:
 *   - DASH-1 ships before any consumer of @henryco/data exists. Apps
 *     continue to call their own readers; the new package is the
 *     forward-looking consolidation. A live parity assertion that
 *     blocks merge on CI requires either (a) a Supabase preview
 *     branch + seeded fixtures + a CI job that boots both, or
 *     (b) a snapshot comparison against pre-recorded fixtures that
 *     drift from production schema.
 *   - The orchestrator-rubric §G4 calls for a fixture-comparison test;
 *     the preferred form is owner-side execution against a real
 *     Supabase preview branch with a seeded fixture user, captured
 *     in the persisted report.
 *   - DASH-2+ migrates the customer-overview content into the new
 *     module registry, at which point the parity check becomes a
 *     direct comparison of rendered output (Playwright visual diff)
 *     and this stub is retired.
 *
 * Owner action: run the four steps above against a seeded preview
 * fixture and append the result to `.codex-temp/v2-dash-01/report.md`
 * §"Verification gate / V3 RLS" or `§"Parity check"` section.
 */

export {};
