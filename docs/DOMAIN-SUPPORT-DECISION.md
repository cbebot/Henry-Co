# Domain Lookup and Support Decision

## Decision Date

2026-04-07

## Scope

Care, Studio, Jobs, Logistics, and account-linked request flows touched in the master fix pass.

## Domain Lookup

- Current state: no production-grade in-repo domain lookup provider integration is available for safe live checks in Studio/Care booking pipelines.
- Decision: keep domain checks advisory-only in UI/workflow copy and avoid fake "verified domain" claims.
- Guardrail: keep submission paths operational even when domain intent data is missing or unchecked.
- Follow-up requirement for full live lookup:
  - add server-side provider integration with retries, timeout handling, and explicit error states
  - store lookup status as `advisory`/`available`/`unavailable` with timestamp
  - never block core booking/project creation on provider outage

## Support Widget

- Current state: no approved third-party support widget is configured with privacy, performance, and consent controls across all divisions.
- Decision: do not embed a third-party widget in this pass.
- Operational path: retain native support channels (email/WhatsApp/in-app forms) and improve clarity in page copy/next-step messaging.
- Follow-up requirement for widget rollout:
  - DPIA/privacy review
  - script performance budget and lazy loading
  - per-division opt-in feature flag
  - documented fallback when widget vendor is unavailable

## Why This Is Safer

- avoids introducing unverified external dependencies during reliability fixes
- preserves trustworthy UX by showing real capabilities only
- keeps core service actions (booking, payment proof, tracking) independent from optional tooling
