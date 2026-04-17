# HenryCo Locale Persistence Model
## Goals
- durable language preference
- cross-division continuity
- no auth/session breakage
- predictable fallback behavior

## Storage layers
### Layer 1: authenticated profile preference
- source: `customer_profiles.language`
- used as top priority when user context exists
- aligned in account profile bootstrap/update flows

### Layer 2: shared cookie preference
- cookie name: `henryco_locale`
- scope: root path `/`
- max age: 1 year
- same-site: `lax`
- domain: shared parent domain when host supports it

### Layer 3: request hints
- `Accept-Language`
- `x-vercel-ip-country`

### Layer 4: default
- `en`

## Effective order
`profile > cookie > accept-language > country > default`

## Cross-division behavior
Each division resolves locale through shared `resolveLocaleOrder` and renders:
- `lang` attribute on `<html>`
- `dir` attribute based on RTL locale list
- `LocaleProvider` for client/UI usage

## Update flows
1. user updates language in preferences UI
2. app POSTs to locale route to set shared cookie
3. authenticated flows additionally persist profile language
4. subsequent requests across divisions reuse the same language signal

## Failure behavior
- invalid locale input normalizes to default
- missing profile/cookie gracefully falls back to request hints/default
- no silent runtime crashes from invalid date/number formatting inputs
