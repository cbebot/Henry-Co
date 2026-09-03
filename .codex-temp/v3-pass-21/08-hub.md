# V3 PASS 21 — Hub (Phase 8, FINAL)

Branch: `v3/pass-21/hub` (off `origin/main` at `1931c2d2`).
Commits: 5. Validations: `pnpm -r typecheck`, `pnpm -r lint`, `pnpm -r build` — all green.
Status: **HUB-COMPLETE** (with documented V3-FOLLOWUP for the optional V2-COMPOSER-02 refactor).

## Contract × Status table

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | **H1** — Workspace stub redirect to account.* `?role=staff` | ALREADY-LANDED | `1f5dd5f7` / PR #79 — confirmed by reading `apps/hub/app/workspace/[[...slug]]/page.tsx`. Uses `permanentRedirect()`; `role=staff` enforced via `accountStaffShellUrl()` |
| 2 | **H2** — Notifications-ui mounted on owner workspace shell | NEW | Commit `b7409612`. `OwnerRealtimeBridge` + `OwnerNotificationsLauncher` + `OwnerNotificationsToastViewport` wire the shell `<NotificationsBell>` and toast viewport with staff-audience tokens to the realtime spine |
| 3 | **H3** — Search palette mounted on owner workspace shell | NEW | Commit `b7409612`. `OwnerPaletteHost` + `OwnerPaletteOpenProvider` mount the `DashboardCommandPalette` with userId-scoped recents and Cmd+1..9 module shortcuts derived from `getOwnerRailEntries(viewer)`. `OwnerSearchButton` chips appear in the sidebar (desktop) and the fixed mobile chrome |
| 4 | **H4** — audit_log + structured logger + Sentry on every owner mutation | NEW | Commit `0e5a47a4`. `withOwnerMutationContext()` wraps every state-changing route. `writeOwnerAudit()` writes the domain audit_log row. Wired on settings/divisions/pages/people/upload + internal-comms threads/messages/dm/pin/read/attachments-register |
| 5 | **H5** — Metric trace drawer on `/owner/(command)` overview | NEW | Commit `62aa3d91`. New `/api/owner/reconcile-trace` resolver + `MetricTraceDrawer` client + extended `MetricCard` with `traceId`. All six headline cards on the overview wire to existing trace branches in `lib/owner-reconcile-trace.ts` |
| 6 | **H6** — OwnerReportDocument premium PDF template | NEW | Commit `524fba2d`. New `@henryco/branded-documents/templates/owner-report` template (reconcilable metric cards, signals, money visibility, division pressure, recent movement). Cron uploads the rendered PDF to `owner-reports` Supabase bucket and appends a 7-day signed download URL to the email |
| 7 | **H7** — Search outbox backlog > 100 alert | NEW | Commit `ab3f10d1`. Worker measures pending rows older than 60s after drain. If `> SEARCH_OUTBOX_ALERT_THRESHOLD` (default 100): `search.outbox.backlog.alert` structured log + Sentry warning + `backlog_alert: true` in JSON response |
| 8 | **H8** — `/api/search` 200-empty when Typesense env unset | ALREADY-LANDED | `cfaa073b` / PR #79 — verified in `apps/hub/app/api/search/route.ts` |
| 9 | **H9** — Newsletter subscribe/preferences/unsubscribe via Brevo + signed token | ALREADY-LANDED | Verified by reading `apps/hub/app/api/newsletter/*` — Brevo provider in `packages/email`, signed token in `lib/newsletter`. Functional under V2 newsletter foundation; no fresh fixes needed |
| 10 | **H10** — OneSignalSDKWorker.js decision | COMMIT confirmed | `apps/hub/public/OneSignalSDKWorker.js` is tracked in git (single-line `importScripts(...)`). Push wired |
| 11 | **H11** — V5-3 §12 hub-side fixes | ALREADY-LANDED | None outstanding per current main |
| 12 | **H12** — `@henryco/brand` typecheck unblock | N/A | `packages/brand/package.json` has no typecheck script (intentional — package is a thin SVG registry). Nothing to unblock |
| 13 | **H13** — V2-COMPOSER-02 refactor decision | DEFERRED | Scope-budget per contract: leave `apps/hub/components/owner/InternalTeamCommsClient.tsx` at 1223 lines as-is. Document as V3-FOLLOWUP. Audit_log + structured-log + Sentry already wired across every internal-comms `/api/owner/*` mutation this pass, so the contract's trust gates land regardless of composer shape |
| 14 | Marketing root premium polish | ALREADY-LANDED | `apps/hub/app/(site)/HubHomeClient.tsx` is the V2-HERO-01 baseline + V3 PASS 20 polish. Capability evidence above the fold, "Visit X" CTAs, no giant hero text per `feedback_no_giant_hero_text.md`. No regressions introduced this pass |
| 15 | `/(site)/search` premium polish with division facets | ALREADY-LANDED | `apps/hub/app/(site)/search/page.tsx` mounts `CrossDivisionSearchExperience` (700-line component). Real per-division grouping + division navigator pills + jump-to-anchor already shipped |

## DASH-8 gates relevant to this pass

| Gate | Status |
|---|---|
| G2 Anti-pattern #19 (owner rail from owner registry) | UNCHANGED — `getOwnerRailEntries(viewer)` consumed in layout |
| G5 BulkActionBar | UNCHANGED — pre-existing |
| G6 AdvancedFilterBar | UNCHANGED — pre-existing |
| G7 BulkExportButton (DOCS-01) | UNCHANGED — pre-existing |
| G8 Audit log on every mutation | PASS this pass — H4 |
| G9 Workspace stub 308 to account.* `?role=staff` | PASS — H1 (already-landed) |
| G12 Old workspace stub deletion (30-day rule) | Not in scope — depends on production rollout window |

## V1–V13 + H1–H13 final PASS table

| Gate | Status | Evidence |
|---|---|---|
| V1 token coverage | PASS | All new components consume `@henryco/dashboard-shell/tokens`, `--acct-*`, `--owner-accent` |
| V2 i18n | PASS | Strings on new owner-shell chrome are operator-facing English (DASH-8 §A.4 — operator workspace exempt from full i18n); marketing-root strings untouched |
| V3 typography | PASS | Pass 25 inherited; new PDF template inherits BrandedDocument styles |
| V4 motion | PASS | Reduced-motion respected by inherited NotificationsBell + DashboardCommandPalette |
| V5 a11y | PASS | Trace drawer is focus-trapped + Escape-dismissible + role=dialog; bell is shell-provided |
| V6 dark mode | PASS | New components use `--acct-bg`/`--acct-ink` tokens |
| V7 mobile | PASS | Owner chrome top bar swaps to fixed-position search + bell on `lg:hidden` |
| V8 RLS | PASS | `/api/owner/reconcile-trace` gated by `requireOwner()`; mutations write audit_log via SECURITY DEFINER RPC |
| V9 idempotency | PASS | search worker `purge_completed_search_outbox` unchanged; PDF upload uses `upsert: true` on identical period_key |
| V10 error states | PASS | MetricTraceDrawer surfaces explicit error message; PDF upload degrades silently to HTML-only email |
| V11 routing | PASS | New `/api/owner/reconcile-trace` route registered; module-jump entries land on `/owner/<rail>` |
| V12 SEO | PASS | No public-route changes |
| V13 logging | PASS | New `hub.owner` + `hub.cron.search-index-worker` namespaces; all owner mutations emit duration_ms + outcome |
| H1 workspace stub 308 | PASS | Already-landed (`1f5dd5f7`) |
| H2 notifications-ui | PASS | This pass (`b7409612`) |
| H3 search palette | PASS | This pass (`b7409612`) |
| H4 audit_log + observability | PASS | This pass (`0e5a47a4`) |
| H5 trace drawer | PASS | This pass (`62aa3d91`) |
| H6 OwnerReportDocument | PASS | This pass (`524fba2d`) |
| H7 backlog alert | PASS | This pass (`ab3f10d1`) |
| H8 /api/search 200-empty | PASS | Already-landed (`cfaa073b`) |
| H9 newsletter Brevo + signed token | PASS | Already-landed (V2 newsletter foundation) |
| H10 OneSignalSDKWorker.js | COMMIT | Already-committed under `public/` |
| H11 V5-3 §12 hub-side fixes | N/A | Nothing outstanding |
| H12 @henryco/brand typecheck unblock | N/A | Package has no typecheck script (intentional thin SVG registry) |
| H13 V2-COMPOSER-02 | DEFERRED | Documented as V3-FOLLOWUP; per contract's scope-budget escape clause |

## Files modified or added

```
.codex-temp/v3-pass-21/08-hub.md                                            (this report)

apps/hub/app/owner/(command)/layout.tsx                                     (wire bridge + palette + bells)
apps/hub/app/owner/(command)/page.tsx                                       (traceId on every metric)
apps/hub/app/api/owner/divisions/route.ts                                   (audit + observability)
apps/hub/app/api/owner/internal-comms/attachments/register/route.ts         (audit + observability)
apps/hub/app/api/owner/internal-comms/dm/route.ts                           (audit + observability)
apps/hub/app/api/owner/internal-comms/messages/route.ts                     (audit + observability)
apps/hub/app/api/owner/internal-comms/pin/route.ts                          (audit + observability)
apps/hub/app/api/owner/internal-comms/read/route.ts                         (observability — high-freq, no audit row)
apps/hub/app/api/owner/internal-comms/threads/route.ts                      (audit + observability)
apps/hub/app/api/owner/pages/route.ts                                       (audit + observability)
apps/hub/app/api/owner/people/route.ts                                      (audit + observability)
apps/hub/app/api/owner/settings/route.ts                                    (audit + observability)
apps/hub/app/api/owner/upload/route.ts                                      (audit + observability)
apps/hub/app/api/owner/reconcile-trace/route.ts                             (NEW)
apps/hub/app/api/cron/search-index-worker/route.ts                          (H7 backlog alert)
apps/hub/components/owner/MetricCard.tsx                                    (trace chip)
apps/hub/components/owner/MetricTraceDrawer.tsx                             (NEW)
apps/hub/components/owner/OwnerNotificationsLauncher.tsx                    (NEW)
apps/hub/components/owner/OwnerNotificationsToastViewport.tsx               (NEW)
apps/hub/components/owner/OwnerPaletteHost.tsx                              (NEW)
apps/hub/components/owner/OwnerPaletteOpenProvider.tsx                      (NEW)
apps/hub/components/owner/OwnerRealtimeBridge.tsx                           (NEW)
apps/hub/components/owner/OwnerSearchButton.tsx                             (NEW)
apps/hub/components/owner/OwnerSidebar.tsx                                  (search-button chip)
apps/hub/lib/owner-mutation-context.ts                                      (NEW)
apps/hub/lib/owner-reporting.ts                                             (PDF render + upload)
apps/hub/package.json                                                       (+notifications-ui +branded-documents)

packages/branded-documents/package.json                                     (+owner-report subpath)
packages/branded-documents/src/filename.ts                                  (+OwnerReportWeekly/Monthly)
packages/branded-documents/src/index.ts                                     (re-export OwnerReportDocument)
packages/branded-documents/src/templates/owner-report.tsx                   (NEW — premium PDF template)

pnpm-lock.yaml                                                              (deps update)
```

## Migrations applied this pass

None. The repo's `audit_logs` table is already provisioned (V2-DASH-09 / `20260508120000_is_staff_in_any.sql`); the `add_audit_log_v2()` RPC + columns are present. The owner-reports Supabase storage bucket is operations-side (not migration-side) — it auto-creates on first upload via service-role; if a strict provisioning pass is needed, the bucket can be added via Supabase dashboard or future migration.

## Cross-division integration verification

| Surface | Verified |
|---|---|
| Every division domain reachable from hub directory | ✓ `HubHomeClient` renders the published division grid with status-filtered cards |
| `/api/search` reaches every division | ✓ Typesense outbox + worker cron drains all divisions' indexed entities (H7 backlog now alerted) |
| notifications-ui receives signals from every division | ✓ Owner-shell `<NotificationsBell audience="staff">` consumes the staff signal stream which spans divisions |
| Command palette deep-links to /book, /track, /quote, /search | ✓ Palette's federated-search pulls from `/api/search`; module-jump entries map to the owner rail; per-division surfaces remain reachable via the search results |

## Anti-pattern audit

- Owner workspace DENSITY-FIRST: ✓ New top bar is sub-44px, search-button chip + bell only, no consumer-shell hero
- Audit log on every mutation: ✓ `withOwnerMutationContext()` wraps every state-changing route; read-receipt route gets observability without an audit row by explicit decision
- Reconcilable metrics: ✓ Every metric on the overview surface has a trace
- Marketing root CLARITY-FIRST: ✓ Untouched this pass; V2-HERO-01 baseline holds
- Bare metric (#18): closed for the overview surface — other owner surfaces (finance/operations/etc.) inherit `MetricCard` but those pages still display them via `formatCurrencyAmount` text without the new `traceId` plumbed in. Follow-up tickets if surface owners need the same drawer

## Validations run

```
pnpm install --no-frozen-lockfile  →  green (1 pre-existing peer-dep warning, apps/company-hub)
pnpm -r typecheck                   →  green across all 47 workspace projects
pnpm -r lint                        →  green (2 pre-existing warnings unrelated to this pass)
pnpm -r build                       →  green across all 13 apps
                                       (1 pre-existing branded-documents fonts dynamic-import warning,
                                        non-blocking on Turbopack)
```

## V3-FOLLOWUP

- **V2-COMPOSER-02** — refactor `apps/hub/components/owner/InternalTeamCommsClient.tsx` (1223 lines) to consume `@henryco/chat-composer` + `@henryco/messaging-thread`. Recommended but explicitly deferred this pass per the contract's scope-budget escape clause. No trust-gate dependency — audit/observability already lands on every `/api/owner/internal-comms/*` mutation.
- **MetricCard trace plumbing on owner sub-surfaces** — finance/operations/messaging/staff centers still surface `formatCurrencyAmount` and similar values in panels or definition lists rather than the `<MetricCard>` primitive. The overview is the DASH-8 trust headline; sub-surfaces can be promoted incrementally.
- **owner-reports Supabase bucket migration** — first upload will auto-create the bucket via service-role. A formal migration that pins bucket policies (private, owner-only signed URLs) would tighten the surface; currently bucket auto-config is sufficient.

## Final classification

**HUB-COMPLETE** — Every contract item resolves as ALREADY-LANDED, NEW (shipped this pass), or DEFERRED with explicit V3-FOLLOWUP per the scope-budget clause. All V1–V13 + H1–H13 gates are PASS or N/A. Branch `v3/pass-21/hub` is ready for the conductor to merge.
