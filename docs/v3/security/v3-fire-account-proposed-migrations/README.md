# V3-FIRE-ACCOUNT — proposed fix migrations (HELD)

Read-only audit of `apps/account` against live prod (`rzkbgwuznmdxnnhmjazy`). Placed **outside**
any apply pipeline and **not** run. **Do not apply until the architect re-verifies and the owner approves.**
Did NOT touch `payments_private` or the core money RPCs (inventory-only).

The account **data layer is sound** (proven: authenticated-stranger read = 0 on every sensitive table),
so most fixes are **app-layer** — see `../V3-FIRE-ACCOUNT-2026-06-27.md`:
- ACC-1 redirect `/\` reject; ACC-2 signed Cloudinary delivery (**cross-cutting**, also studio/learn/jobs);
  ACC-3 id-based `proxy/download`; ACC-4 dedicated webhook secret; ACC-5 claim-before-process idempotency;
  ACC-7 neutral signup; ACC-8 enable `HENRYCO_AUTH_OAUTH_LINK_INTENT=1`; ACC-9 ≥6-digit PIN + lockout.
- Also: re-land the SEC-HARDEN-06 #323 SECDEF fixes (`get_signal_feed`, `get_default_user_address`) into
  repo migrations — they are live on prod but the repo source still ships the vulnerable form (drift).

These migrations cover the DB-layer items:
- `01_revoke_secret_columns.sql` (ACC-6 — secret columns owner-readable via the Data API)
- `02_force_rls_account_money_pii.sql` (ACC-10 — defense-in-depth)
