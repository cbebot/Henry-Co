# HenryCo Future RTL Readiness
## Current truth
- RTL locale list includes Arabic (`ar`).
- Layout direction is already switched via `isRtlLocale(locale)` and `dir` attribute wiring.
- Arabic remains scaffolded, not full production content coverage.

## What is already prepared
- server-side locale resolution can return `ar`
- app root layouts support `dir="rtl"`
- shared locale context can drive component-level direction-aware behavior

## What is still required before claiming full RTL support
1. full reviewed Arabic translations for critical journeys
2. component-level RTL QA across all divisions
3. form, table, chart, and modal RTL placement validation
4. icon/chevron directional audits
5. notification and system-message Arabic copy review
6. support and trust-flow language consistency checks

## Release guardrail
Do not market Arabic as fully supported until translation completeness and UI RTL QA both pass for critical user journeys.
