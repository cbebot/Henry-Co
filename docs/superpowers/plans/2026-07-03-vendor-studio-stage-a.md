# Vendor Studio Rebuild — Stage A (Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the vendor workspace foundation — grouped translated navigation, the light-theme mobile-drawer fix at its root, the public image-upload pipeline, error boundaries, and the money-format seam.

**Architecture:** All additive. The drawer fix makes the portaled BottomSheet inherit whatever theme scope its trigger sits in (self-healing for every workspace). The media pipeline reuses `@henryco/media` (`media://` refs into existing string url columns — no schema change) with a new PUBLIC bucket mirroring property's proven template. Stages B–D build the pages on this foundation.

**Tech Stack:** Next.js App Router (RSC + client components), `@henryco/media`, `@henryco/i18n` (`translateSurfaceLabel`), Supabase Storage, `tsx --test` for pure tests.

## Global Constraints

- Voice: calm authority — no hype, no exclamation marks (CI: `pnpm tone:check`).
- Every user-facing string through `translateSurfaceLabel` (CI: `pnpm i18n:check:strict`).
- Brand: "Henry Onyx" (never "Henry & Co."); `packages/search-ui` untouched.
- No schema changes; money invariants untouched.
- Verify both themes before claiming done.

---

### Task 1: Grouped, translated vendor navigation

**Files:**
- Modify: `apps/marketplace/lib/marketplace/navigation.ts` (after `vendorNav`, line 114)
- Test: `apps/marketplace/lib/marketplace/navigation.test.ts` (new)
- Modify: every `apps/marketplace/app/vendor/**/page.tsx` that passes `nav={vendorNav(...)}` (13 pages)

**Interfaces:**
- Produces: `vendorWorkspaceNav(active: string, locale: AppLocale): { nav: NavItem[]; navGroups: Array<{label: string; items: NavItem[]}> }`

- [ ] **Step 1: Write the failing test** (`navigation.test.ts`):

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { vendorWorkspaceNav } from "./navigation";

describe("vendorWorkspaceNav — grouped vendor navigation", () => {
  it("returns flat nav AND groups covering the same routes", () => {
    const { nav, navGroups } = vendorWorkspaceNav("/vendor/products", "en");
    const flatHrefs = new Set(nav.map((i) => i.href));
    const groupedHrefs = navGroups.flatMap((g) => g.items.map((i) => i.href));
    assert.equal(groupedHrefs.length, flatHrefs.size, "every route grouped exactly once");
    for (const href of groupedHrefs) assert.ok(flatHrefs.has(href));
    assert.ok(navGroups.length >= 3, "mobile drawer gets real groups");
  });
  it("marks the active route in both shapes", () => {
    const { nav, navGroups } = vendorWorkspaceNav("/vendor/payouts", "en");
    assert.ok(nav.find((i) => i.href === "/vendor/payouts")?.active);
    assert.ok(navGroups.flatMap((g) => g.items).find((i) => i.href === "/vendor/payouts")?.active);
  });
  it("gates intelligence on its flag", () => {
    delete process.env.MARKETPLACE_AI_CHAT;
    delete process.env.NEXT_PUBLIC_HENRY_FLAG_AI_GATEWAY;
    assert.ok(!vendorWorkspaceNav("/vendor", "en").nav.some((i) => i.href === "/vendor/intelligence"));
    process.env.NEXT_PUBLIC_HENRY_FLAG_AI_GATEWAY = "true";
    assert.ok(vendorWorkspaceNav("/vendor", "en").nav.some((i) => i.href === "/vendor/intelligence"));
    delete process.env.NEXT_PUBLIC_HENRY_FLAG_AI_GATEWAY;
  });
});
```

- [ ] **Step 2:** Run `pnpm --filter @henryco/marketplace exec tsx --test lib/marketplace/navigation.test.ts` → FAIL (`vendorWorkspaceNav` not exported).

- [ ] **Step 3: Implement** — in `navigation.ts`, add `isAiSurfaceEnabled` to the imports (`import { isAiSurfaceEnabled } from "@henryco/ai-gateway";`), extend `vendorNav` with the flag-gated intelligence entry (after `analytics`, keeping order):

```ts
    { href: "/vendor/analytics", label: t("Analytics"), active: active === "/vendor/analytics" },
    ...(isAiSurfaceEnabled(process.env.MARKETPLACE_AI_CHAT, process.env)
      ? [{ href: "/vendor/intelligence", label: t("Intelligence"), active: active === "/vendor/intelligence" }]
      : []),
```

then append after `vendorNav`:

```ts
/**
 * One-call helper for every /vendor/* page — flat nav + mobile groups together:
 * `<WorkspaceShell {...vendorWorkspaceNav("/vendor/orders", locale)} />`.
 */
export function vendorWorkspaceNav(active: string, locale: AppLocale) {
  return { nav: vendorNav(active, locale), navGroups: vendorNavGroups(active, locale) };
}

export function vendorNavGroups(active: string, locale: AppLocale) {
  const t = (s: string) => translateSurfaceLabel(locale, s);
  const messagingEnabled = process.env.MARKETPLACE_MESSAGING_ENABLED === "1";
  const intelligenceEnabled = isAiSurfaceEnabled(process.env.MARKETPLACE_AI_CHAT, process.env);
  const flat = vendorNav(active, locale);
  const byHref = (href: string) => flat.find((item) => item.href === href)!;
  return [
    {
      label: t("Storefront"),
      items: [byHref("/vendor"), byHref("/vendor/products"), byHref("/vendor/store")],
    },
    {
      label: t("Sales"),
      items: [
        byHref("/vendor/orders"),
        ...(messagingEnabled ? [byHref("/vendor/messages")] : []),
        byHref("/vendor/disputes"),
      ],
    },
    {
      label: t("Money"),
      items: [byHref("/vendor/payouts"), byHref("/vendor/analytics")],
    },
    {
      label: t("Trust"),
      items: [
        byHref("/vendor/settings"),
        ...(intelligenceEnabled ? [byHref("/vendor/intelligence")] : []),
      ],
    },
  ];
}
```

- [ ] **Step 4:** Re-run the test → PASS.

- [ ] **Step 5: Wire the pages.** In every `apps/marketplace/app/vendor/**/page.tsx`: replace `nav={vendorNav(<path>, locale)}` with `{...vendorWorkspaceNav(<path>, locale)}` and update the import (`vendorNav` → `vendorWorkspaceNav`). Verify with `git grep -n "vendorNav(" apps/marketplace/app` → only `navigation.ts` internal uses remain.

- [ ] **Step 6:** `pnpm --filter @henryco/marketplace run typecheck` → clean. Commit: `feat(marketplace): grouped translated vendor navigation (vendorWorkspaceNav) + intelligence in nav`.

---

### Task 2: Mobile drawer theme fix (scope inheritance) + translated chrome

**Files:**
- Modify: `apps/marketplace/components/marketplace/workspace-mobile-nav.tsx`
- Modify: `apps/marketplace/components/marketplace/shell.tsx:518-530`
- Modify: `apps/marketplace/app/globals.css` (delete the stale lines ~351-353 claiming /vendor is noir)

**Interfaces:**
- Produces: `WorkspaceMobileNav` new optional prop `labels?: { kicker: string; currentSection: string; openMenu: string; menuTitle: string; closeMenu: string; fallbackActive: string }` (EN defaults preserve today's API).

- [ ] **Step 1: Scope inheritance.** In `workspace-mobile-nav.tsx`, add state + detection so the portaled sheet re-establishes the trigger's theme scope (fixes white-on-white in `.market-workspace-light`; no-op in dark workspaces):

```tsx
const [sheetScopeClass, setSheetScopeClass] = useState<string | null>(null);
// inside handleOpen, before setOpen(true):
setSheetScopeClass(triggerRef.current?.closest(".market-workspace-light") ? "market-workspace-light" : null);
```

Wrap ALL BottomSheet children in one div (custom properties inherit through `display: contents`):

```tsx
<BottomSheet ...>
  <div className={cn("contents", sheetScopeClass)}>
    {/* existing <header> + scroll container, unchanged */}
  </div>
</BottomSheet>
```

- [ ] **Step 2: Labels prop.** Add to `Props`: `labels?: { kicker: string; currentSection: string; openMenu: string; menuTitle: string; closeMenu: string; fallbackActive: string }`. Default at the top of the component:

```tsx
const chrome = {
  kicker: "Workspace", currentSection: "Current section", openMenu: "Open workspace menu",
  menuTitle: "Workspace menu", closeMenu: "Close workspace menu", fallbackActive: "Overview",
  ...labels,
};
```

Replace the six hardcoded strings (lines 129, 137, 153, 170, 193, and the `"Overview"` fallback at 78) with `chrome.*`.

- [ ] **Step 3: Trigger pill re-tone.** Replace the inverted pill (line 150 `bg-[var(--market-paper-white)] ... text-[color:var(--market-bg)]`) with surface-consistent tokens:

```tsx
className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--market-line-strong)] bg-[color:var(--market-fill-faint)] px-4 py-2.5 text-[12px] font-semibold text-[var(--market-paper-white)] transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--market-brass)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--market-bg)]"
```

(`--market-paper-white` resolves to dark ink inside the light scope — correct in both themes.)

- [ ] **Step 4: Shell wiring.** In `shell.tsx` (locale already available at line 515): translate the fallback group label and pass drawer labels:

```tsx
const t = (s: string) => translateSurfaceLabel(locale, s);
const groupsForMobile: WorkspaceNavGroup[] =
  navGroups && navGroups.length > 0 ? navGroups : [{ label: t("Workspace"), items: nav }];
...
<WorkspaceMobileNav
  title={title}
  description={description}
  groups={groupsForMobile}
  currentLabel={activeLabel}
  labels={{
    kicker: t("Workspace"), currentSection: t("Current section"),
    openMenu: t("Open workspace menu"), menuTitle: t("Workspace menu"),
    closeMenu: t("Close workspace menu"), fallbackActive: t("Overview"),
  }}
/>
```

(Import `translateSurfaceLabel` from `@henryco/i18n` if not already imported in shell.tsx.)

- [ ] **Step 5:** Delete the stale globals.css comment (~lines 351-353) claiming `/vendor` is still noir.

- [ ] **Step 6:** `typecheck` + `lint` marketplace → clean. Manual proof: Playwright mobile viewport (390×844) on /vendor, open the drawer in LIGHT theme → all text readable; repeat dark. Commit: `fix(marketplace): mobile workspace drawer inherits its theme scope through the portal — light-theme nav readable`.

---

### Task 3: Public image pipeline (lib)

**Files:**
- Modify: `apps/marketplace/lib/marketplace/media.ts`
- Test: `apps/marketplace/lib/marketplace/media-image.test.ts` (new, pure parts only)

**Interfaces:**
- Produces: `MARKETPLACE_IMAGE_BUCKET = "marketplace-images"`, `MARKETPLACE_IMAGE_RULE`, `uploadMarketplaceImage(pathPrefix: string, file: File): Promise<string /* media:// ref */>`, `resolveMarketplaceImageUrl(value: string | null | undefined): string | null` (media:// refs → public URL; legacy absolute http(s) URLs pass through; else null).

- [ ] **Step 1: Failing test** (`media-image.test.ts`) for the pure resolver:

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveMarketplaceImageUrl, MARKETPLACE_IMAGE_RULE } from "./media";

describe("resolveMarketplaceImageUrl", () => {
  it("passes legacy absolute URLs through and rejects junk", () => {
    assert.equal(resolveMarketplaceImageUrl("https://cdn.example.com/x.jpg"), "https://cdn.example.com/x.jpg");
    assert.equal(resolveMarketplaceImageUrl("not-a-url"), null);
    assert.equal(resolveMarketplaceImageUrl(""), null);
    assert.equal(resolveMarketplaceImageUrl(null), null);
  });
  it("image rule allows jpeg/png/webp only", () => {
    assert.ok(MARKETPLACE_IMAGE_RULE.allowedTypes.includes("image/webp"));
    assert.ok(!MARKETPLACE_IMAGE_RULE.allowedTypes.includes("application/pdf"));
  });
});
```

- [ ] **Step 2:** Run → FAIL. **Step 3: Implement** in `media.ts` (mirror property's `lib/property/media.ts` + `store.ts` pattern; reuse the file's existing `getMarketplaceMediaStore()` and bucket-bootstrap helper):

```ts
export const MARKETPLACE_IMAGE_BUCKET = "marketplace-images";

export const MARKETPLACE_IMAGE_RULE = {
  maxBytes: 8 * 1024 * 1024,
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  invalidTypeMessage: "Use a JPG, PNG, or WebP image up to 8MB.",
} as const;

/** Upload a buyer-visible image (product photo, store hero/logo) → media:// ref. */
export async function uploadMarketplaceImage(pathPrefix: string, file: File): Promise<string> {
  await ensureMarketplaceImageBucket();
  const store = getMarketplaceMediaStore();
  return store.upload({
    file,
    visibility: "public",
    bucket: MARKETPLACE_IMAGE_BUCKET,
    pathPrefix,
    rule: MARKETPLACE_IMAGE_RULE,
  });
}

async function ensureMarketplaceImageBucket(): Promise<void> {
  // Same shape as the existing ensureMarketplaceBuckets() (private docs), but public —
  // mirrors property's PROPERTY_MEDIA_BUCKET bootstrap ({ public: true }).
  const admin = createAdminSupabase();
  await admin.storage.createBucket(MARKETPLACE_IMAGE_BUCKET, {
    public: true,
    fileSizeLimit: "8MB",
  }).catch(() => undefined); // already exists — fine
}

/** Read-boundary resolver: media:// → public URL; legacy absolute URLs pass through. */
export function resolveMarketplaceImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (isMediaRef(value)) {
    try {
      return resolveMediaUrl(value);
    } catch {
      return null;
    }
  }
  if (isAbsoluteUrl(value)) return value;
  return null;
}
```

Adjust imports to the file's existing style (`isMediaRef`, `isAbsoluteUrl`, `resolveMediaUrl` from `@henryco/media`; `createAdminSupabase` already imported). Match the exact existing helper names when editing (read the file first).

- [ ] **Step 4:** Test → PASS. **Step 5:** Commit: `feat(marketplace): public image pipeline — marketplace-images bucket, upload + read-boundary resolver`.

---

### Task 4: Vendor image upload route

**Files:**
- Create: `apps/marketplace/app/api/marketplace/images/route.ts`

**Interfaces:**
- Consumes: `uploadMarketplaceImage`, `resolveMarketplaceImageUrl`, `MARKETPLACE_IMAGE_RULE` (Task 3); `getMarketplaceViewer` + `viewerHasRole` (existing auth helpers — copy the usage from `app/api/seller-applications/documents/route.ts`).
- Produces: `POST /api/marketplace/images` multipart `{ image: File, scope: "product" | "store" }` → `{ ok: true, ref: string, url: string }` | `{ ok: false, error: string }` (401 unauthenticated, 403 non-vendor, 400 invalid file).

- [ ] **Step 1: Implement** (mirror `seller-applications/documents/route.ts` — nodejs runtime, auth first, validate, upload):

```ts
import { NextResponse } from "next/server";
import { getMarketplaceViewer, viewerHasRole } from "@/lib/marketplace/auth";
import { MediaValidationError } from "@henryco/media";
import { uploadMarketplaceImage, resolveMarketplaceImageUrl } from "@/lib/marketplace/media";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const viewer = await getMarketplaceViewer();
  if (!viewer.user) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  if (!viewerHasRole(viewer, ["vendor", "marketplace_owner", "marketplace_admin"])) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const form = await request.formData();
  const file = form.get("image");
  const scope = form.get("scope") === "store" ? "store" : "product";
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
  }
  try {
    const ref = await uploadMarketplaceImage(`${scope}/${viewer.user.id}`, file);
    return NextResponse.json({ ok: true, ref, url: resolveMarketplaceImageUrl(ref) });
  } catch (error) {
    if (error instanceof MediaValidationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    console.error("[marketplace][images] upload failed", { name: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json({ ok: false, error: "upload_failed" }, { status: 500 });
  }
}
```

(Adjust `getMarketplaceViewer`/`viewerHasRole` import path + role names to what `seller-applications/documents/route.ts` actually uses — read it first and match.)

- [ ] **Step 2:** `typecheck` clean. Commit: `feat(marketplace): vendor image upload route (authed, validated, public bucket)`.

---

### Task 5: ImageUploadField client component

**Files:**
- Create: `apps/marketplace/components/marketplace/vendor/image-upload-field.tsx`

**Interfaces:**
- Consumes: `POST /api/marketplace/images` (Task 4).
- Produces: `<ImageUploadField name="image_url" scope="product" label={...} hint={...} initialUrl={product.gallery[0]} labels={{...}} />` — uploads on select, previews, and carries the returned `media://` ref in `<input type="hidden" name={name}>` so existing form intents keep working unchanged. Stage B swaps the two `image_url` text inputs for this field.

- [ ] **Step 1: Implement** (dropzone modeled on `apps/care/components/forms/ImageFileField.tsx`; all copy via injected labels so pages translate with their own `t`):

```tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Labels = {
  drop: string;        // "Add a photo"
  replace: string;     // "Replace photo"
  remove: string;      // "Remove photo"
  uploading: string;   // "Uploading…"
  failed: string;      // "That upload didn't go through. Try again."
};

export function ImageUploadField({
  name, scope, label, hint, initialUrl, labels,
}: {
  name: string;
  scope: "product" | "store";
  label: string;
  hint?: string;
  initialUrl?: string | null;
  labels: Labels;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [ref, setRef] = useState<string>("");
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = useCallback(() => inputRef.current?.click(), []);

  const onFile = useCallback(async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    const local = URL.createObjectURL(file);
    setPreview(local);
    try {
      const body = new FormData();
      body.set("image", file);
      body.set("scope", scope);
      const res = await fetch("/api/marketplace/images", { method: "POST", body });
      const json = (await res.json()) as { ok: boolean; ref?: string; url?: string; error?: string };
      if (!json.ok || !json.ref) throw new Error(json.error || "upload_failed");
      setRef(json.ref);
      if (json.url) setPreview(json.url);
    } catch {
      setError(labels.failed);
      setPreview(initialUrl ?? null);
      setRef("");
    } finally {
      URL.revokeObjectURL(local);
      setBusy(false);
    }
  }, [initialUrl, labels.failed, scope]);

  const clear = useCallback(() => {
    setRef("");
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  return (
    <div>
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">{label}</span>
      {/* The value the form posts: the media:// ref (or empty = unchanged/removed). */}
      <input type="hidden" name={name} value={ref} />
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={pick}
          disabled={busy}
          className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[var(--market-line-strong)] bg-[color:var(--market-fill-faint)] text-[var(--market-muted)] transition hover:text-[var(--market-paper-white)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--market-brass)] disabled:opacity-60"
          aria-label={preview ? labels.replace : labels.drop}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- object-URL / storage preview
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-5 w-5" aria-hidden />
          )}
          {busy ? (
            <span className="absolute inset-0 grid place-items-center bg-black/40">
              <LoaderCircle className="h-5 w-5 animate-spin text-white" aria-label={labels.uploading} />
            </span>
          ) : null}
        </button>
        <div className="min-w-0 space-y-1.5">
          {hint ? <p className="text-[12px] leading-5 text-[var(--market-muted)]">{hint}</p> : null}
          <div className="flex gap-2">
            <button type="button" onClick={pick} disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--market-line)] px-3 py-1.5 text-[11.5px] font-semibold text-[var(--market-paper-white)] transition hover:border-[var(--market-line-strong)]">
              <RefreshCw className="h-3 w-3" aria-hidden />
              {preview ? labels.replace : labels.drop}
            </button>
            {preview ? (
              <button type="button" onClick={clear} disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--market-line)] px-3 py-1.5 text-[11.5px] font-semibold text-[var(--market-muted)] transition hover:text-[var(--market-paper-white)]">
                <X className="h-3 w-3" aria-hidden />
                {labels.remove}
              </button>
            ) : null}
          </div>
          {error ? <p className="text-[12px] leading-5 text-[color:var(--market-warn,#b45309)]">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2:** `typecheck` + `lint` clean. Commit: `feat(marketplace): ImageUploadField — direct upload with preview, carries media:// ref into form posts`.

---

### Task 6: Error boundaries + money seam

**Files:**
- Create: `apps/marketplace/app/vendor/error.tsx`, `apps/marketplace/app/vendor/not-found.tsx`
- Create: `apps/marketplace/lib/marketplace/vendor/money.ts` + `money.test.ts`

**Interfaces:**
- Produces: `formatVendorMoney(kobo: number, locale: AppLocale): string` — the ONLY money formatter vendor pages use (the future local-currency seam).

- [ ] **Step 1: money seam test:**

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatVendorMoney } from "./money";

describe("formatVendorMoney — the single vendor money-display seam", () => {
  it("formats kobo as naira with grouping", () => {
    assert.equal(formatVendorMoney(4515000, "en"), "₦45,150.00");
    assert.equal(formatVendorMoney(0, "en"), "₦0.00");
  });
  it("never emits fractional-kobo artifacts", () => {
    assert.equal(formatVendorMoney(2554, "en"), "₦25.54");
  });
});
```

- [ ] **Step 2:** FAIL, then implement:

```ts
import type { AppLocale } from "@henryco/i18n/server";

/**
 * The ONLY money formatter vendor pages use. Settlement is NGN today; when per-user
 * display currency ships, the conversion + symbol decision lands HERE and every
 * vendor surface follows without another rebuild.
 */
export function formatVendorMoney(kobo: number, locale: AppLocale): string {
  const naira = (Number.isFinite(kobo) ? kobo : 0) / 100;
  return new Intl.NumberFormat(locale === "en" ? "en-NG" : locale, {
    style: "currency",
    currency: "NGN",
    currencyDisplay: "narrowSymbol",
  }).format(naira);
}
```

Run → PASS (adjust the expected strings to Node's actual `en-NG` output if the symbol/spacing differs — assert against the real formatter output, never hand-typed guesses).

- [ ] **Step 3: boundaries.** `error.tsx` (client) + `not-found.tsx` (server), calm copy through `translateSurfaceLabel` (client boundary uses `useHenryCoLocale`):

```tsx
// error.tsx
"use client";

import Link from "next/link";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";

export default function VendorError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const locale = useHenryCoLocale();
  const t = (s: string) => translateSurfaceLabel(locale, s);
  return (
    <div className="mx-auto max-w-xl px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold text-[var(--market-paper-white)]">{t("Something went wrong in your workspace")}</h1>
      <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">
        {t("Your data is safe. Try again, or return to the overview while we look into it.")}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" onClick={reset} className="rounded-full border border-[var(--market-line-strong)] px-5 py-2.5 text-sm font-semibold text-[var(--market-paper-white)]">
          {t("Try again")}
        </button>
        <Link href="/vendor" className="rounded-full border border-[var(--market-line)] px-5 py-2.5 text-sm font-semibold text-[var(--market-muted)]">
          {t("Back to overview")}
        </Link>
      </div>
    </div>
  );
}
```

```tsx
// not-found.tsx
import Link from "next/link";
import { translateSurfaceLabel } from "@henryco/i18n";
import { getMarketplacePublicLocale } from "@/lib/marketplace/public-locale";

export default async function VendorNotFound() {
  const locale = await getMarketplacePublicLocale();
  const t = (s: string) => translateSurfaceLabel(locale, s);
  return (
    <div className="mx-auto max-w-xl px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold text-[var(--market-paper-white)]">{t("That page isn't in your workspace")}</h1>
      <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{t("It may have moved. Everything you manage is reachable from the overview.")}</p>
      <Link href="/vendor" className="mt-6 inline-block rounded-full border border-[var(--market-line-strong)] px-5 py-2.5 text-sm font-semibold text-[var(--market-paper-white)]">
        {t("Back to overview")}
      </Link>
    </div>
  );
}
```

(Verify the locale-helper import path by reading how `shell.tsx` imports `getMarketplacePublicLocale`, and match it.)

- [ ] **Step 4:** Commit: `feat(marketplace): vendor error/not-found boundaries + formatVendorMoney seam`.

---

### Task 7: Stage A gate sweep

- [ ] `pnpm --filter @henryco/marketplace run typecheck` && `run lint` → clean
- [ ] `pnpm --filter @henryco/marketplace run build` → exit 0
- [ ] `pnpm tone:check` → clean; `pnpm i18n:check:strict` → clean (refresh the dated baseline in `docs/v3/i18n-gaps/` if line-fingerprints re-keyed)
- [ ] Marketplace unit tests: `pnpm --filter @henryco/marketplace exec tsx --test lib/marketplace/navigation.test.ts lib/marketplace/media-image.test.ts lib/marketplace/vendor/money.test.ts` → all pass
- [ ] Playwright both-themes proof on /vendor (light + dark, 390×844 + desktop): drawer text readable, groups render
- [ ] Push + PR: `feat(marketplace): Vendor Studio Stage A — foundation (nav groups, light-theme drawer fix, image pipeline, boundaries, money seam)`
