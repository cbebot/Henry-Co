# V3-FIRE-MARKETPLACE — proposed fix migrations (HELD)

These SQL files are **proposed remediations**, deliberately placed **outside**
`apps/marketplace/supabase/migrations/` so they are **not** picked up by any apply
pipeline. They were authored from a **read-only** audit and have **not** been run
against prod (`rzkbgwuznmdxnnhmjazy`).

**Do not apply until the architect re-verifies each finding and the owner approves.**
Apply order is numeric. `07` is flagged **needs-staging-test** (revokes grants — verify
no Data-API writer depends on them first). `09` is **owner-driven data remediation**
(commented out) and `10`/`08` are **optional schema options** whose primary fix is in
app code (see the findings doc).

Several findings are **app-layer only** and have no migration here: F-01 routing/render
(`/track`,`/pay`), F-02 ownership check (`dispute_create`), F-03 `getMarketplaceViewer`
email-binding, F-04 conflict scoping, F-05 cart scoping, F-10 role+amount, F-14
transactional wallet RPC. See `../V3-FIRE-MARKETPLACE-2026-06-26.md`.
