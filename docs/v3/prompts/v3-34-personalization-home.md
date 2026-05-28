# V3-34 — Personalization: Per-User Home

**Pass ID:** V3-34
**Phase:** E (PERSONALIZATION & PREDICTIVE)
**Pillar:** P3 (Personalization Engine)
**Dependencies:** V3-12 (Foundation Lock), V3-26 (AI provider router)
**Effort:** L (2–4 weeks)
**Parallel-safe:** NO (foundation for Phase E)
**Owner gate:** None
**Risk class:** None

---

## Role

You are the V3 Personalisation engineer for HenryCo. You execute this one pass, then stop and report.

This pass builds the **personalized home** — the foundation for Phase E. Per-user persistent home layout, module ordering by signal, device-aware (mobile vs desktop), fallback to default when no personalization signal exists.

---

## Project, audit, anti-patterns

(Standard project block — see V3-01 for boilerplate.)

Audit lift from AUDIT-BASELINE.md §2.15 + Vision P3:

> ### Dashboard shell + modules
> - `@henryco/dashboard-shell` — modular dashboard registry, command palette, role gates, register pattern
> - 7 dashboard-modules packages (account, building, hotel, marketplace, owner, staff, wallet)

> ### P3 Vision
> Personalized home per user. Personalized deals. Recommended services, jobs, courses, properties. Abandoned-task recovery. Preferred language / country / currency persistence end-to-end.

---

## Mandatory scope

### S1 — `user_home_layouts` schema

```sql
CREATE TABLE user_home_layouts (
  user_id UUID PRIMARY KEY REFERENCES auth.users,
  desktop_module_order TEXT[] NOT NULL DEFAULT '{}',
  mobile_module_order TEXT[] NOT NULL DEFAULT '{}',
  hidden_modules TEXT[] NOT NULL DEFAULT '{}',
  pinned_modules TEXT[] NOT NULL DEFAULT '{}',
  last_personalized_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  personalization_signal_version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE user_home_layouts ENABLE ROW LEVEL SECURITY;
-- user reads/writes own row only
```

### S2 — Signal-driven default ordering

A new helper `packages/dashboard-shell/src/personalization/compute-layout.ts`:
- Inputs: user context (trust, recent divisions, saved items, recent transactions, kyc state), enabled modules, device (mobile/desktop).
- Outputs: ordered list of module IDs by relevance score.
- Deterministic + explainable (reason codes per module: "you have an unfinished KYC", "you recently used Care", etc.).
- Falls back to default order if no signals exist (new user).

### S3 — User customization UI

`apps/account/app/(account)/customize/page.tsx`:
- Lists every visible module on the user's home.
- Drag-to-reorder.
- Toggle "hide" per module.
- "Pin to top" toggle.
- "Reset to default" button.
- Saves to `user_home_layouts`.

### S4 — Account home re-architecture

`apps/account/app/(account)/page.tsx`:
- Reads `user_home_layouts`.
- Calls compute-layout if `last_personalized_at` is older than 24h.
- Renders modules in order.
- Mobile uses mobile_module_order, desktop uses desktop_module_order.

### S5 — Hub owner workspace + staff dashboards

Apply the same pattern with role-specific module sets (already partially in `@henryco/dashboard-modules-owner` + `staff`). Adds the customize UI for owner + staff.

### S6 — Telemetry

- `henry.personalization.layout.computed`
- `henry.personalization.module.hidden`
- `henry.personalization.module.pinned`
- `henry.personalization.layout.reset`

Owner tile: "Personalization signals" — daily layouts computed, top-pinned modules, top-hidden modules.

---

## Out of scope

- Personalized deals (V3-35).
- Cross-division recommendations (V3-36).
- Abandoned-task recovery (V3-37).

## Dependencies / Inheritance / Trust / Mobile / i18n / Gates / Deployment / Report

(Standard pattern — follow V3-01 conventions.)

Key trust requirement: layout is server-computed; client cannot manipulate the computed score (ANTI-CLONE Principle 1). User can override (hide/pin) but the score itself is opaque.

---

## Self-verification

- [ ] Schema applied with RLS.
- [ ] compute-layout deterministic + tested.
- [ ] Customize UI shipped.
- [ ] Account + owner + staff dashboards consume personalized order.
- [ ] 4 new telemetry events.
- [ ] Report written.
