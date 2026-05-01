# HenryCo brand mark suite

Three React components plus three static SVGs for CDN upload.

## React components — `@henryco/ui/brand`

```tsx
import { HenryCoWordmark, HenryCoMonogram, HenryCoLockup } from "@henryco/ui/brand";

// Heritage form
<HenryCoWordmark height={32} />

// Modern compact form
<HenryCoWordmark variant="compact" height={28} />

// Path-based icon (favicon, app icon)
<HenryCoMonogram size={32} />

// Header lockup (monogram + wordmark)
<HenryCoLockup height={32} sub="Marketplace" />
```

All marks render with `currentColor`, so they inherit text colour from
their wrapper. Pass `accent` to override the rule under the monogram's
`&Co` caption (defaults to `#C9A227`, the HenryCo signature copper).

## Static SVGs

`packages/ui/src/brand/static/` contains:

- `wordmark-full.svg` — heritage "Henry & Co." form
- `wordmark-compact.svg` — modern "HenryCo" form
- `monogram.svg` — path-based "H&Co" lockup with the copper accent rule

## Cloudinary CDN upload

Run `scripts/upload-brand-assets.ts` from the repo root with `CLOUDINARY_API_KEY`,
`CLOUDINARY_API_SECRET`, and `CLOUDINARY_CLOUD_NAME` in the environment.
The script signs the upload through the same `uploadOwnedAsset` path
that the rest of the platform uses, prefixes assets under
`brand/`, and prints the public IDs and `secure_url`s for the three
files.

After upload, paste the URLs into `packages/brand/src/registry.ts`
under a new `marks` constant so apps can reference them by name when a
remote SVG is preferred over the inline component (e.g., open-graph
images, email banners).

## Notes for future iterations

- The wordmark is `<text>` rendered with the loaded division font
  (`Newsreader` by default). The monogram is pure paths so it stays
  crisp at favicon sizes regardless of font availability.
- `font-feature-settings` is set to `kern liga calt` for the wordmark
  and `smcp kern` for the monogram caption. Stylistic alternates can
  be enabled per division by overriding `style.fontFeatureSettings`.
- The bracket serifs on the monogram H are intentionally restrained
  (2-unit tabs) — go subtler on this, never bigger. Premium serif marks
  read confidence through *omission*, not flourish.
- Never use the wordmark below 14px tall — drop to the monogram.
- Never recolour the accent rule away from the brand copper without
  owner sign-off.
