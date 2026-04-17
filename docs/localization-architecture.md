# HenryCo Localization Architecture
## Scope
This document defines the production localization foundation for HenryCo divisions:
- hub
- account
- marketplace
- property
- care
- jobs
- learn
- logistics
- studio

## Core design
Localization is centralized in `packages/i18n` and consumed by each app layout.
The shared package owns:
- locale definitions and validation (`src/locales.ts`)
- locale resolution order (`src/resolve-locale.ts`)
- shared locale cookie utilities (`src/cookie.ts`)
- locale API POST handler (`src/locale-route.ts`)
- shared copy modules (`src/hub-home-copy.ts`, `src/consent-copy.ts`, `src/auth-copy.ts`, `src/state-copy.ts`)
- formatting helpers (`src/format-date.ts`, `src/format-number.ts`, `currency.ts`)
- React locale context (`src/react.tsx`)

## Resolution order
Locale resolves in this order:
1. authenticated profile language (when available)
2. shared locale cookie `henryco_locale`
3. `Accept-Language` header
4. country hint (`x-vercel-ip-country`)
5. default locale (`en`)

This order is implemented by `resolveLocaleOrder` and reused across divisions.

## Division integration
Each division resolves locale server-side and applies:
- `<html lang={locale} dir={rtlOrLtr}>`
- `<LocaleProvider locale={locale}>`

Current resolver files:
- `apps/hub/lib/locale-server.ts`
- `apps/account/lib/locale-server.ts`
- `apps/care/lib/locale-server.ts`
- `apps/marketplace/lib/locale-server.ts`
- `apps/property/lib/locale-server.ts`
- `apps/jobs/lib/locale-server.ts`
- `apps/learn/lib/locale-server.ts`
- `apps/logistics/lib/locale-server.ts`
- `apps/studio/lib/locale-server.ts`

## Locale API routes
All divisions expose `POST /api/locale` for client-side language switching:
- `apps/hub/app/api/locale/route.ts`
- `apps/account/app/api/locale/route.ts`
- `apps/care/app/api/locale/route.ts`
- `apps/marketplace/app/api/locale/route.ts`
- `apps/property/app/api/locale/route.ts`
- `apps/jobs/app/api/locale/route.ts`
- `apps/learn/app/api/locale/route.ts`
- `apps/logistics/app/api/locale/route.ts`
- `apps/studio/app/api/locale/route.ts`

Each route delegates to `handleLocalePost` from `@henryco/i18n/locale-route` which:
- Validates and normalizes the locale
- Sets the `henryco_locale` cookie with cross-subdomain domain support
- Returns the persisted locale

## Persistence model
- Guest preference persists in shared cookie with parent-domain support when host allows.
- Authenticated preference persists in `customer_profiles.language`.
- Account profile bootstrap keeps language aligned to metadata/country/defaults.
- Locale cookie remains useful for fast cross-division continuity even for signed-in users.

## Formatting model
Use shared helpers instead of ad hoc `Intl` calls:
- `formatDate`, `formatDateLong`, `formatTime`, `formatDateTime`, `formatRelativeTime`
- `formatNumber`, `formatPercent`, `formatCompact`
- `formatMoney` and currency truth context helpers

## Language switcher UI
Language selection is available in multiple surfaces:
- **EcosystemPreferences** (`packages/ui/src/public/ecosystem-preferences.tsx`) — consent banner and privacy panel with language dropdown
- **PreferencesClient** (`apps/hub/app/(site)/preferences/PreferencesClient.tsx`) — dedicated preferences page with full language grid
- **LocaleProvider** (`packages/i18n/src/react.tsx`) — React context for client-side locale access via `useHenryCoLocale`

## Translation honesty
- English is source language.
- French is the primary translated language.
- Other configured locales are scaffolded; untranslated surfaces intentionally fall back to English.
- Do not claim full localization where copy coverage is partial.

## Reserved backend boundaries
This pass does not rewrite support backend lifecycle or reserved support verification lane work.
Any localization dependency on that lane should be isolated and explicitly documented before changes.
