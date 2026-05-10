# I18N Pass 18B — Runtime auto-translation layer

Date: 2026-05-09
Branch: `feat/dash-08-owner-track-b` (separate isolated commit on top of Pass 18 closure `fadeb43`)

## What this adds

A Postgres-backed runtime translation cache + DeepL fallback so any English string in a server component can be wrapped in `await autoTranslate(text, locale)` and rendered in the user's language without first being extracted into a copy module.

This complements the Pass 18 static closure (which made every existing copy-module key 100% localised). It is the answer to "what about the ~8,000 hardcoded strings still in component code?"

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Server Component / Route Handler (any app)                     │
│                                                                 │
│    const text = await autoTranslate("Welcome back", locale);   │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  apps/<app>/lib/i18n/auto-translate.ts                          │
│    - thin adapter using createAdminSupabase() (service-role)    │
│    - lazily wraps it as a TranslationCacheClient                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  packages/i18n translateText(text, locale, { cache })           │
│    1. Identity passthrough if locale === source                 │
│    2. cache.get(text, sourceLocale, targetLocale)               │
│       └── Postgres SELECT on i18n_translation_cache             │
│           HIT → return cached translated_text                   │
│    3. DeepL API call (skipped for ig/yo/ha/hi — unsupported)    │
│    4. cache.put(...) writes the result                          │
│    5. Returns source text on any failure (graceful)             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Postgres: public.i18n_translation_cache                        │
│    PRIMARY KEY (source_text, source_locale, target_locale)      │
│    RLS: enabled + forced + service_role only                    │
│    Indexes: target_locale, updated_at desc                      │
└─────────────────────────────────────────────────────────────────┘
```

## What you pay for translation

- **Cache hit**: one Postgres `SELECT` (sub-millisecond at scale).
- **Cache miss**: one DeepL API call + one Postgres `UPSERT`. DeepL Free is 500k characters/month (≈1M EN chars after dedupe). Pro is metered.
- **Subsequent renders of the same string**: cache hit, no DeepL.
- **Locales unsupported by DeepL** (`ig`, `yo`, `ha`, `hi`): immediate passthrough to source text — never calls DeepL. These remain on the linguist-review path.

## Files added

| Path | Purpose |
|---|---|
| `packages/i18n/src/translate-runtime.ts` | `translateText`, `translateTextMany`, `TranslationCacheClient` interface, `createSupabaseTranslationCache` adapter (duck-typed; no @supabase/supabase-js dep) |
| `packages/i18n/src/server.ts` | Re-exports the new helpers from `@henryco/i18n/server` |
| `apps/{account,care,jobs,hub,marketplace,studio,learn,property,logistics}/lib/i18n/auto-translate.ts` | Per-app `autoTranslate` / `autoTranslateMany` thin adapters |
| `apps/hub/supabase/migrations/20260510010000_i18n_translation_cache.sql` | The cache table, indexes, trigger, RLS lockdown (idempotent) |
| `scripts/i18n-prewarm-cache.mjs` | Walks every leaf in EN baseline and bulk-translates into cache via DeepL. `--dry-run` reports without writing. |

## Production state

The migration was applied to project `rzkbgwuznmdxnnhmjazy` (HENRY & CO. FABRIC CARE) via Supabase MCP `apply_migration name=i18n_translation_cache` on 2026-05-09. Verified:

```sql
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'i18n_translation_cache' AND relnamespace = 'public'::regnamespace;
-- relrowsecurity=true, relforcerowsecurity=true
```

## How a server component uses it

```ts
// In a server component (no "use client")
import { autoTranslate, autoTranslateMany } from "@/lib/i18n/auto-translate";
import { resolveLocaleOrder } from "@henryco/i18n/server";

export default async function MyPage() {
  const locale = (await resolveLocaleOrder()).at(0) ?? "en";

  // single string
  const heading = await autoTranslate(
    "Welcome to the marketplace",
    locale,
  );

  // batched (one DeepL request, even cheaper)
  const [a, b, c] = await autoTranslateMany(
    ["Browse premium boutiques", "Verified sellers", "Track your orders"],
    locale,
  );

  return <h1>{heading}</h1>;
}
```

## Operational steps remaining for the owner

1. **Set `DEEPL_API_KEY`** in Vercel (and locally for dev) — Free tier is fine to start.
2. **Run prewarm** to fill the cache with every static string from the i18n modules so the first user paint is instant for every locale:

   ```bash
   pnpm exec tsx scripts/i18n-prewarm-cache.mjs            # all DeepL locales
   pnpm exec tsx scripts/i18n-prewarm-cache.mjs fr de      # specific locales
   pnpm exec tsx scripts/i18n-prewarm-cache.mjs --dry-run  # report only
   ```
   The script is idempotent — re-running only fills new misses.

3. **Optional cron** — schedule `i18n-prewarm-cache.mjs --dry-run` weekly to flag any cache drift if copy modules change.

4. **Use the helper** in new server components from now on for any user-visible English string. For client components, resolve in the parent server component and pass via props.

## What is NOT auto-translated by this layer

- Hardcoded strings in **client components** (`"use client"`). Those need to be either (a) lifted to a parent server component which does the auto-translate, or (b) extracted into a copy module the normal way. There is no safe way to call DeepL or read service-role Supabase from a client bundle — that's an architectural boundary, not a Pass-18B limitation.
- Hardcoded strings in **plain `.tsx` JSX** that are never wrapped by `autoTranslate`. The helper does NOT walk the rendered DOM — it's an opt-in API per call site. Pass 19's hardcoded-string extraction work is still the path for those strings, with the difference that now you can choose between two routes:
  - extract into the copy module (best for repeat-use copy)
  - wrap in `autoTranslate` (best for one-off / dynamic / per-customer text)

## Validation

- Typecheck: PASS for `@henryco/i18n`, `account`, `marketplace`, `care`, `jobs`, `hub`. Studio's typecheck has pre-existing failures (missing `@henryco/workspace-shell`, `@henryco/dashboard-shell`, `@henryco/auth`, `@henryco/messaging-thread` declarations + implicit-any warnings in StudioMessageThread.tsx) — confirmed unrelated to Pass 18B by stashing the new file and re-running, errors persist identically. Those are studio-app pre-existing issues belonging to Track-C work.
- Migration: applied to prod, RLS verified.
- Live runtime demo: NOT executed in this session. Sandbox correctly denied a write to the prod cache table without explicit owner authorization, even in --dry-run mode. The owner can validate end-to-end on their environment after setting `DEEPL_API_KEY`.
