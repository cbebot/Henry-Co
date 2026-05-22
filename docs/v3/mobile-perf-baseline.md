# Mobile Perf Baseline — V3-09

**Pass:** V3-09 — Foundation: Mobile Consistency (S9)
**Status:** Template only. Measurement deferred to V3-89 (mobile perf
budgets + Lighthouse CI).

## Targets (per V3-09 prompt §S9)

  - **Initial JS bundle** < 200KB gzipped per app.
  - **LCP on mobile** < 2.5s on 3G fast.
  - **CLS** < 0.1.
  - **Images sized** appropriately for mobile viewports (`next/image`
    `sizes` prop set).

## Per-app capture table

Capture these on each Vercel preview using Chrome DevTools "Mobile"
emulation + 3G fast throttle, OR on a physical iPhone 15 + Pixel 8
via remote DevTools. The latter is preferred for the eventual V3-89
budget enforcement — emulation under-reports LCP for image-heavy
surfaces.

| App | Route | JS gzipped | LCP (ms) | CLS | Images sized? | Notes |
|---|---|---|---|---|---|---|
| `account` | `/` | _TBD_ | _TBD_ | _TBD_ | _TBD_ | |
| `account` | `/settings` | _TBD_ | _TBD_ | _TBD_ | _TBD_ | |
| `account` | `/support` | _TBD_ | _TBD_ | _TBD_ | _TBD_ | |
| `hub` | `/` | _TBD_ | _TBD_ | _TBD_ | _TBD_ | |
| `hub` | `/owner` | _TBD_ | _TBD_ | _TBD_ | _TBD_ | |
| `marketplace` | `/` | _TBD_ | _TBD_ | _TBD_ | _TBD_ | |
| `marketplace` | `/product/[slug]` | _TBD_ | _TBD_ | _TBD_ | _TBD_ | |
| `marketplace` | `/checkout` | _TBD_ | _TBD_ | _TBD_ | _TBD_ | |
| `care` | `/` | _TBD_ | _TBD_ | _TBD_ | _TBD_ | |
| `care` | `/book` | _TBD_ | _TBD_ | _TBD_ | _TBD_ | |
| `learn` | `/` | _TBD_ | _TBD_ | _TBD_ | _TBD_ | |
| `learn` | `/courses` | _TBD_ | _TBD_ | _TBD_ | _TBD_ | |
| `logistics` | `/` | _TBD_ | _TBD_ | _TBD_ | _TBD_ | |
| `logistics` | `/quote` | _TBD_ | _TBD_ | _TBD_ | _TBD_ | |
| `property` | `/` | _TBD_ | _TBD_ | _TBD_ | _TBD_ | |
| `property` | `/listings/[id]` | _TBD_ | _TBD_ | _TBD_ | _TBD_ | |
| `jobs` | `/` | _TBD_ | _TBD_ | _TBD_ | _TBD_ | |
| `studio` | `/` | _TBD_ | _TBD_ | _TBD_ | _TBD_ | |
| `staff` | `/` | _TBD_ | _TBD_ | _TBD_ | _TBD_ | |

## Acceptance pattern (V3-89)

A future V3-89 pass will:

  1. Run Lighthouse CI on each preview deploy.
  2. Fail the build on any of:
     - Initial JS bundle > 200KB gzipped.
     - LCP > 2.5s on 3G fast.
     - CLS > 0.1.
  3. Audit `next/image` `sizes` prop usage — flag missing or `100vw`
     placeholders.

V3-09 establishes the schema; V3-89 wires the measurement.

## Out of scope (V3-09)

  - Actual measurement — requires Lighthouse access + per-preview run.
  - Budget enforcement — V3-89.
  - Bundle composition analysis — V3-89.
  - SSR-streaming + selective hydration audit — V3-89.
