# MVP scope lock

**Goal:** Ship a **navigable Super App beta** that showcases divisions and deep-links, with **safe defaults** (no surprise live billing).

## Keep in MVP (Super App)

- Hub, Directory, Services, Account (auth + activity pattern), Module detail, Legal screens.
- Platform adapter architecture + local mocks + staging toggles.
- Cloudinary **read** URLs for marketing imagery.
- Optional Supabase for divisions + contact (staging).

## Move to Phase 2

- Real payment capture (Stripe/Paystack) + server confirmation.
- Signed media upload pipeline.
- Unified cross-app activity feed backed by API.
- In-app admin / RBAC.
- Full removal of lint warnings across all Next apps.
- Deep integration (SSO) between Super App and each Next vertical.

## Disable / hide before public beta

- Account **runtime diagnostics** strip — already **off** by default in staging (`EXPO_PUBLIC_FEATURE_RUNTIME_DIAGNOSTICS` defaults false).
- Account **payment demo** button — **off** by default in staging (`EXPO_PUBLIC_FEATURE_PAYMENTS_DEMO` defaults false).
- **Production live gate** — keep `EXPO_PUBLIC_LIVE_SERVICES_APPROVED` unset/false until executive approval.

## Feature flags reference

See `apps/super-app/src/platform/featureFlags.ts` and [env-vars.md](./env-vars.md).

## UI hiding strategy

- Prefer **flags** over deleting code during stabilization.
- Staging internal QA can re-enable demos via EAS env without code changes.
