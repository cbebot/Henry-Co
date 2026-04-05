# Known issues

**Branch:** `release/mvp-stabilization`  
**Process:** Add issues found during route QA, staging hooks, or beta installs. Mark **critical** if it blocks core navigation or data safety.

## Critical

| ID | Area | Symptom | Repro | Status |
| --- | --- | --- | --- | --- |
| KI-C01 | Super App — config | EAS `projectId` in `app.json` is still a placeholder | Open `apps/super-app/app.json` | Open — replace before EAS builds |
| KI-C02 | Payments | Staging `DeferredPaymentsAdapter` does not complete real checkout | Account → enable payments demo + `flags.payments` | By design until PSP adapter exists |

## Non-critical / product

| ID | Area | Symptom | Notes |
| --- | --- | --- | --- |
| KI-N01 | Super App — SSG | `expo export` logs `[henryco] Staging expects EXPO_PUBLIC_SUPABASE_*` when keys absent | Expected when building web without env; set vars or use mocks only |
| KI-N02 | Hub / marketing | Many `@next/next/no-img-element` warnings | Performance/LCP follow-up — not failing lint |
| KI-N03 | Learn | Unused imports on learner course page | Cleanup in Phase 2 |
| KI-N04 | Marketplace | `search-experience` a11y warnings | aria-selected / role pairing |
| KI-N05 | Logistics | `<a>` instead of `<Link>` for forgot-password | Small fix |
| KI-N06 | Property | Next build emits CSS optimization warnings (RSC stream artifacts in generated CSS) | Investigate Tailwind/class usage in property app |

## Route QA — Super App (static export / code review)

| Route | Expected | Checked | Notes |
| --- | --- | --- | --- |
| `/` Hub | Loads tabs | OK | Export size ~34 kB route |
| `/directory` | Lists divisions | OK | Uses adapter + fallback catalog |
| `/services` | Services copy | OK | |
| `/account` | Sign-in / activity | OK | Mock path default local |
| `/module/[slug]` | Module detail | OK | Test slugs: `studio`, `marketplace`, … |
| `/legal/contact` | Form | OK | Mock DB local; Supabase when remote |
| `/legal/*` | Static | OK | Copy is placeholder until legal review |

**Broken flows:** None identified for **local mock mode** in automated export. File a row under Critical if device-only repro appears.

## How to file

Add a row with: short title, app, steps, expected vs actual, screenshot/log line, owner.
