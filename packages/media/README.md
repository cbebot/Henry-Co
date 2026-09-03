# @henryco/media

A thin, vendor-swappable media layer over object storage. Backed by **Supabase
Storage** today; a Cloudinary (or any) backend can slot in behind the same
`MediaStore` contract by config — the same seam pattern as the payment router.

## Why references, not URLs

Media is persisted as a backend-neutral **reference**, never a raw storage URL:

```
media://<visibility>/<bucket>/<key>
  e.g. media://public/property-media/listings/ikoyi-penthouse/9f3b-hero.jpg
       media://private/property-documents/listing-12/ownership-proof.pdf
```

Because the persisted value is abstract, swapping the storage vendor is a
**resolver change, not a data migration**, and JSX never embeds a raw storage URL.

## Public vs private

- **public** — listing photos and other inherently-public assets. Resolve to a
  stable, deterministic delivery URL with `resolveMediaUrl()` (no network call,
  cacheable). The public base can be CDN-fronted (e.g. Cloudflare) via
  `MEDIA_PUBLIC_BASE_URL` without changing any reference.
- **private** — sensitive media (ownership documents, IDs). Lives in an
  RLS-private bucket and is **never** publicly fetchable. Read it only through
  `MediaStore.signedUrl()` (short-lived, server-only). `resolveMediaUrl()` throws
  on a private ref by design.

## Entry points

- `@henryco/media` — client-safe: `resolveMediaUrl`, `buildMediaRef`,
  `parseMediaRef`, `isMediaRef`, `isAbsoluteUrl`, `validateUpload`,
  `getPublicMediaBaseUrl`, key helpers. No secrets, no `server-only` deps.
- `@henryco/media/server` — `createSupabaseMediaStore({ client })` for
  upload / signedUrl / remove. The caller **injects its own privileged
  (service-role) Supabase client**, so the package never reads credentials and
  always rides the app's factory path.

## Usage

```ts
// server action / route handler
import { createSupabaseMediaStore } from "@henryco/media/server";
import { createAdminSupabase } from "@/lib/supabase";

const store = createSupabaseMediaStore({ client: createAdminSupabase() });
const ref = await store.upload({
  file,
  visibility: "public",
  bucket: "property-media",
  pathPrefix: `listings/${listingId}`,
  rule: { maxBytes: 15 * 1024 * 1024, allowedTypes: ["image/jpeg", "image/png", "image/webp"] },
});
// persist `ref` (a string) into your existing gallery[] field

// render (server component / data layer)
import { resolveMediaUrl } from "@henryco/media";
const src = resolveMediaUrl(ref); // -> public delivery URL; absolute URLs pass through
```

Resolution is **isomorphic** for public/absolute media (pure string transform),
so it runs cheaply at the data layer and the result is handed to `next/image`.

## Env

- `NEXT_PUBLIC_SUPABASE_URL` — default public delivery base.
- `MEDIA_PUBLIC_BASE_URL` — optional override to front public objects behind a CDN.
- `SUPABASE_SERVICE_ROLE_KEY` — used only by the caller's injected client.

## Test

```
pnpm --filter @henryco/media test       # node:test, pure logic
pnpm --filter @henryco/media typecheck
```
