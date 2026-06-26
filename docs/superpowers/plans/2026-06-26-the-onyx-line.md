# The Onyx Line — Unified Ecosystem Messaging — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify every Henry Onyx division's messaging onto one editorial surface and one trust pipeline — money-safe, contact-leak-proof, and resilient on a weak connection — built in six flagged, sequenced workstreams.

**Architecture:** A shared `@henryco/messaging` package owns the canonical conversation/message contract + the send→safety→persist→realtime→notify pipeline + a shared offline-queue resilience primitive; each division implements a thin adapter over its *existing* store; one net-new canonical store is added only for marketplace buyer↔seller. A new `@henryco/contact-safety` package composes the already-shipping `@henryco/trust` detectors (additively extended — zero behavior change to live anti-scam paths). No payment table is ever touched.

**Tech Stack:** TypeScript (raw `.ts` source, `"type":"module"`, exports map → source, no build step), React 19, Supabase (Postgres + RLS + Realtime), `@henryco/trust`, `@henryco/messaging-thread`, `@henryco/chat-composer`, `@henryco/notifications`, `@henryco/i18n`, `@henryco/pricing`. Tests run with `tsx --test` (node test runner) for `.ts` suites, `node --test __tests__/*.test.mjs` for static suites.

## Global Constraints

Every task implicitly includes these. Exact values copied from the spec (`docs/superpowers/specs/2026-06-26-onyx-line-unified-messaging-design.md`):

- **Zero payment-table change.** No write, migration, or schema touch to any `*_payments`, `*_invoices`, ledger, wallet, or settlement table. A diff touching one is an automatic task failure.
- **Notification owner-correctness.** Recipients resolved ONLY by a stable FK (`user_id`/`recipient_user_id`); NEVER by an email/phone string match. All notification creation goes through `publishNotification()` (`@henryco/notifications`), never a hand-rolled INSERT. Preserve the `customer_notifications` UPDATE RLS `WITH CHECK (auth.uid()=user_id)`.
- **Contact-safety composes `@henryco/trust`.** Use `shouldAutoFlag` / `detectOffPlatformContact` / `sanitizeForDisplay` from `@henryco/trust`; never re-implement a local pattern list. High/critical content is blocked server-side BEFORE insert and never persisted; the block holds even if the audit `trust_flags` write fails.
- **ig/yo/ha never machine-translated.** New copy uses Pattern A typed-copy: EN baseline + native `DeepPartial` overrides for fr/es/pt/ar/de/it/zh; ig/yo/ha/hi OMITTED from `LOCALE_MAP` → EN fallback by construction. Brand names (`Henry Onyx`, `HenryCo`) never translated.
- **AA contrast.** Accent fills use `--hc-text-on-accent` (`#1A1814`) on `--hc-accent`; gold-as-text uses `--hc-accent-text` (`#8A6F00` light / `#E5C870` dark); never white-on-gold; never status-by-color-alone; honor `prefers-reduced-motion`; 2px focus-visible ring.
- **Resilience.** The offline send-queue is a shared `@henryco/messaging` primitive (not studio-only); durable localStorage queue + auto-replay on reconnect + backpressure stop on 5xx.
- **Windows build.** `pnpm -r build` thrashes on Windows — always `pnpm -r --workspace-concurrency=1 ... run build`.
- **Package convention.** Internal package imports use NO file extension; `package.json` `exports` map points directly at `.ts`/`.tsx` source; workspace deps are `"workspace:^"`; run `pnpm install` after adding a package or dependency.
- **Money copy.** Any amount uses `@henryco/pricing` integer kobo + ISO-4217 code; never float, never `×100`; non-NGN carries the "Charged in NGN" truth label; `paid`/`refunded` only after ledger/provider confirmation.

---

## Master Roadmap — six workstreams

Each workstream is its own sub-project plan that produces working, testable software on its own and ends gated against the **7-invariant Acceptance Bar** (§7 of the spec). **WS-1 is fully specified below.** WS-2…WS-6 are generated just-in-time once their predecessor's real interfaces exist (so their code stays exact, not speculative); their scope + file map + acceptance gate are fixed here.

| WS | Name | Depends on | Touches | Acceptance gate (beyond the 7 invariants) |
|----|------|-----------|---------|-------------------------------------------|
| **WS-1** | Core + Safety (pure, no UI) | — | `packages/contact-safety` (new), `packages/messaging` (new), `packages/trust` (additive) | contact-safety unit suite green; trust regression suite green; pipeline blocks high/critical pre-persist; offline-queue replays |
| **WS-2** | Elevated surface | WS-1 | `packages/messaging` (UI), `apps/account` messages, `packages/i18n` `messaging-copy` | editorial inbox+thread+composer; a11y route-set passes `a11y:gate`; mountable per-app |
| **WS-3** | Studio safety hardening | WS-1 | `apps/studio` messaging send path | studio send runs contact-safety; HIGH leak closed; display masking wired; no studio data move |
| **WS-4** | Marketplace buyer↔seller (net-new) | WS-1, WS-2 | `apps/marketplace` + new `conversations`/`conversation_messages`/`conversation_participants` migration | net-new store + RLS proofs; on-platform-only participant model; seller never sees buyer contact |
| **WS-5** | Jobs realtime + convergence | WS-1, WS-2 | `apps/jobs`, realtime publication, `inbox-aggregate` | jobs in realtime publication; deep-link + unread convergence |
| **WS-6** | Cross-division polish | WS-1…WS-5 | care/property/learn/logistics, `messaging-copy`, notification audit | all divisions on the surface; stable-FK audit clean; final a11y gate |

---

# WS-1 — Core + Safety (fully specified)

**Outcome:** Two new pure packages — `@henryco/contact-safety` and `@henryco/messaging` — plus purely-additive new exports in `@henryco/trust`. No UI, no DB, no money. Everything is unit-tested and ships dark.

## File structure (WS-1)

```
packages/trust/
  detect.ts                         // MODIFY — add normalizeForDetection, detectExternalLinks, maskContactsForDisplay (additive)
  __tests__/detect-additions.test.mjs   // CREATE — regression + new-export tests (static-import style)
  package.json                      // MODIFY — add "test" script

packages/contact-safety/            // CREATE (new package)
  package.json
  tsconfig.json
  index.ts                          // contactSafety() facade + types
  src/__tests__/contact-safety.test.ts

packages/messaging/                 // CREATE (new package)
  package.json
  tsconfig.json
  index.ts                          // barrel
  src/
    types.ts                        // Conversation, Message, Participant, ContextAnchor, DeliveryState
    anchor.ts                       // normalizeAnchor()
    adapter.ts                      // MessagingAdapter interface
    pipeline.ts                     // sendMessage()
    resilience/offline-queue.ts     // createOfflineQueue()
    __tests__/anchor.test.ts
    __tests__/pipeline.test.ts
    __tests__/offline-queue.test.ts
```

`@henryco/trust` has no tests today, so we add a `node --test` static suite there (mirroring `packages/messaging-thread/__tests__/markdown-safety.test.mjs`) but import real source at runtime via `tsx`-style suites where logic must execute. For trust we will execute the new functions, so its new suite uses `tsx --test`.

---

### Task 1: `@henryco/trust` — `normalizeForDetection` (obfuscation normalizer, additive)

**Files:**
- Modify: `packages/trust/detect.ts` (append new export; do NOT change existing functions)
- Modify: `packages/trust/package.json` (add `test` script + tsx devDep)
- Test: `packages/trust/__tests__/detect-additions.test.mjs`

**Interfaces:**
- Produces: `export function normalizeForDetection(text: string): string` — lowercases, maps number-words→digits, `" at "`→`@`, `" dot "`→`.`, and collapses separators between digits.

- [ ] **Step 1: Write the failing test**

Create `packages/trust/__tests__/detect-additions.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeForDetection } from "../detect.ts";

test("normalizeForDetection collapses spoken/obfuscated contact details", () => {
  assert.equal(normalizeForDetection("call me on zero eight zero one"), "call me on 0801");
  assert.equal(normalizeForDetection("0 8 0 - 1 2 3"), "0801 23".replace(" ", "")); // digits collapse
  assert.equal(normalizeForDetection("name at gmail dot com"), "name@gmail.com");
});
```

- [ ] **Step 2: Run test to verify it fails**

Add the test script first. In `packages/trust/package.json`, add to a `"scripts"` block (the file currently has none):

```json
  "scripts": {
    "test": "tsx --test __tests__/*.test.mjs"
  },
  "devDependencies": {
    "tsx": "^4.0.0"
  }
```

Run: `pnpm --filter @henryco/trust test`
Expected: FAIL — `normalizeForDetection` is not exported.

- [ ] **Step 3: Write minimal implementation**

Append to `packages/trust/detect.ts` (after `calculateTrustScore`, leaving every existing function untouched):

```ts
// ---- Obfuscation normalization (additive; used by contact-safety) --------

const NUMBER_WORDS: Record<string, string> = {
  zero: "0", oh: "0", one: "1", two: "2", three: "3", four: "4",
  five: "5", six: "6", seven: "7", eight: "8", nine: "9",
};

/**
 * Normalizes spoken/obfuscated contact details so the canonical detectors
 * catch evasions like "zero eight zero", "name at gmail dot com", "0 8 0".
 * Additive: existing detectors are unchanged; callers opt in.
 */
export function normalizeForDetection(text: string): string {
  let t = text.toLowerCase();
  t = t.replace(/\b(zero|oh|one|two|three|four|five|six|seven|eight|nine)\b/g, (w) => NUMBER_WORDS[w] ?? w);
  t = t.replace(/\s+at\s+/g, "@").replace(/\s+dot\s+/g, ".");
  t = t.replace(/(?<=\d)[\s.-]+(?=\d)/g, "");
  return t;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @henryco/trust test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/trust/detect.ts packages/trust/package.json packages/trust/__tests__/detect-additions.test.mjs
git commit -m "feat(trust): add normalizeForDetection obfuscation normalizer (additive)"
```

---

### Task 2: `@henryco/trust` — `detectExternalLinks` (URL gap, additive)

**Files:**
- Modify: `packages/trust/detect.ts`
- Test: `packages/trust/__tests__/detect-additions.test.mjs` (extend)

**Interfaces:**
- Consumes: existing `OffPlatformResult`, `Severity` from `detect.ts`.
- Produces: `export function detectExternalLinks(text: string): OffPlatformResult` — matches shortener URLs (`wa.me`, `t.me`, `bit.ly`, `tinyurl.com`, `cutt.ly`, `rebrand.ly`, `linktr.ee`) and any generic `http(s)://` link, severity `medium`.

- [ ] **Step 1: Write the failing test** — append to `detect-additions.test.mjs`:

```js
import { detectExternalLinks } from "../detect.ts";

test("detectExternalLinks catches shortener + generic URLs the base detector misses", () => {
  const a = detectExternalLinks("ping me wa.me/2348012345678");
  assert.equal(a.detected, true);
  assert.equal(a.severity, "medium");
  const b = detectExternalLinks("see https://my-personal-site.example/contact");
  assert.equal(b.detected, true);
  const c = detectExternalLinks("is the blue one available?");
  assert.equal(c.detected, false);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @henryco/trust test`
Expected: FAIL — `detectExternalLinks` not exported.

- [ ] **Step 3: Write minimal implementation** — append to `detect.ts`:

```ts
// ---- External-link detection (additive; messaging contact-safety) --------

const SHORTENER_URL_RE =
  /\b(?:wa\.me|t\.me|bit\.ly|tinyurl\.com|cutt\.ly|rebrand\.ly|linktr\.ee)\/[^\s)]+/gi;

const GENERIC_URL_RE = /\bhttps?:\/\/[^\s)]+/gi;

/**
 * Detects external links (shorteners + any http(s) URL). Kept OUT of the
 * canonical detectOffPlatformContact so existing marketplace/listing callers
 * are unchanged; the messaging contact-safety facade composes this explicitly.
 */
export function detectExternalLinks(text: string): OffPlatformResult {
  const patterns: string[] = [];
  const shorteners = text.match(SHORTENER_URL_RE);
  if (shorteners) patterns.push(...shorteners);
  const generic = text.match(GENERIC_URL_RE);
  if (generic) {
    for (const g of generic) if (!patterns.includes(g)) patterns.push(g);
  }
  return { detected: patterns.length > 0, patterns, severity: patterns.length === 0 ? "low" : "medium" };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @henryco/trust test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/trust/detect.ts packages/trust/__tests__/detect-additions.test.mjs
git commit -m "feat(trust): add detectExternalLinks for shortener/generic URLs (additive)"
```

---

### Task 3: `@henryco/trust` — `maskContactsForDisplay` (wider masking, additive) + regression lock

**Files:**
- Modify: `packages/trust/detect.ts`
- Test: `packages/trust/__tests__/detect-additions.test.mjs` (extend, incl. regression assertions)

**Interfaces:**
- Consumes: existing `sanitizeForDisplay`, the module-level regexes (`SOCIAL_HANDLE_RE`, `MESSAGING_APP_RE`, `SOCIAL_URL_RE`, `EXTERNAL_MEETING_RE`, `SHORTENER_URL_RE`, `GENERIC_URL_RE`).
- Produces: `export function maskContactsForDisplay(text: string): string` — phone+email (via `sanitizeForDisplay`) PLUS handles, messaging-app names, and all link types masked.

- [ ] **Step 1: Write the failing test** — append:

```js
import { maskContactsForDisplay, detectOffPlatformContact, sanitizeForDisplay } from "../detect.ts";

test("maskContactsForDisplay masks handles, app names, and links beyond phone/email", () => {
  const out = maskContactsForDisplay("dm me @jane_doe on whatsapp or bit.ly/x");
  assert.ok(!out.includes("@jane_doe"));
  assert.ok(!/whatsapp/i.test(out));
  assert.ok(!out.includes("bit.ly/x"));
});

test("REGRESSION: existing detectOffPlatformContact + sanitizeForDisplay behavior is unchanged", () => {
  // phone + email still HIGH
  const r = detectOffPlatformContact("call 08012345678 or me@x.com");
  assert.equal(r.severity, "high");
  // base sanitizer still masks phone to last-4 and email to first-2
  const s = sanitizeForDisplay("call 08012345678 or me@x.com");
  assert.ok(s.includes("***-5678"));
  assert.ok(s.includes("me***@x.com"));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @henryco/trust test`
Expected: FAIL — `maskContactsForDisplay` not exported (regression test should already pass).

- [ ] **Step 3: Write minimal implementation** — append:

```ts
/**
 * Stricter display masking for messaging surfaces: extends sanitizeForDisplay
 * (phone+email) to also mask social handles, messaging-app names, and links.
 * Additive — sanitizeForDisplay itself is unchanged.
 */
export function maskContactsForDisplay(text: string): string {
  let result = sanitizeForDisplay(text);
  result = result.replace(SOCIAL_HANDLE_RE, (m) => m.replace(/@[\w]+/, "@***"));
  result = result.replace(MESSAGING_APP_RE, "[removed]");
  result = result
    .replace(SOCIAL_URL_RE, "[link removed]")
    .replace(EXTERNAL_MEETING_RE, "[link removed]")
    .replace(SHORTENER_URL_RE, "[link removed]")
    .replace(GENERIC_URL_RE, "[link removed]");
  return result;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @henryco/trust test`
Expected: PASS (both new and regression tests).

- [ ] **Step 5: Commit**

```bash
git add packages/trust/detect.ts packages/trust/__tests__/detect-additions.test.mjs
git commit -m "feat(trust): add maskContactsForDisplay + lock regression on existing detectors"
```

---

### Task 4: `@henryco/contact-safety` — package scaffold + allow-case facade

**Files:**
- Create: `packages/contact-safety/package.json`
- Create: `packages/contact-safety/tsconfig.json`
- Create: `packages/contact-safety/index.ts`
- Test: `packages/contact-safety/src/__tests__/contact-safety.test.ts`

**Interfaces:**
- Produces: `export type ContactSafetyAction = "allow" | "mask" | "block";`
- Produces: `export interface ContactSafetyResult { action: ContactSafetyAction; maskedText: string; patterns: string[]; severity: "low"|"medium"|"high"|"critical"; }`
- Produces: `export function contactSafety(text: string): ContactSafetyResult`

- [ ] **Step 1: Write the failing test**

Create `packages/contact-safety/src/__tests__/contact-safety.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { contactSafety } from "../../index";

test("a clean message is allowed unchanged", () => {
  const r = contactSafety("Hi, is the blue one still available?");
  assert.equal(r.action, "allow");
  assert.equal(r.maskedText, "Hi, is the blue one still available?");
  assert.equal(r.severity, "low");
});
```

Create `packages/contact-safety/package.json`:

```json
{
  "name": "@henryco/contact-safety",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./index.ts" },
  "scripts": {
    "typecheck": "tsc -p tsconfig.json",
    "test": "tsx --test src/__tests__/contact-safety.test.ts"
  },
  "dependencies": { "@henryco/trust": "workspace:^" },
  "devDependencies": { "@types/node": "^20.0.0", "typescript": "^5.9.3" }
}
```

Then create `packages/contact-safety/tsconfig.json` with the same corrected config shown in Task 6 (barrel `index.ts` at package root → `include: ["index.ts", "src/**/*"]`; `types: ["node"]` for the `.ts` test), and run `pnpm install`.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @henryco/contact-safety test`
Expected: FAIL — `contactSafety` / `../../index` not found.

- [ ] **Step 3: Write minimal implementation**

Create `packages/contact-safety/index.ts`:

```ts
export type ContactSafetyAction = "allow" | "mask" | "block";

export interface ContactSafetyResult {
  action: ContactSafetyAction;
  maskedText: string;
  patterns: string[];
  severity: "low" | "medium" | "high" | "critical";
}

export function contactSafety(text: string): ContactSafetyResult {
  return { action: "allow", maskedText: text, patterns: [], severity: "low" };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @henryco/contact-safety test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/contact-safety pnpm-lock.yaml
git commit -m "feat(contact-safety): scaffold package with allow-case facade"
```

---

### Task 5: `@henryco/contact-safety` — block / mask policy (compose trust)

**Files:**
- Modify: `packages/contact-safety/index.ts`
- Test: `packages/contact-safety/src/__tests__/contact-safety.test.ts` (extend)

**Interfaces:**
- Consumes: `shouldAutoFlag` from `@henryco/trust/moderation`; `detectExternalLinks`, `normalizeForDetection`, `maskContactsForDisplay` from `@henryco/trust/detect`.
- Produces: the full `contactSafety()` behavior — `high`/`critical` → `block`; `medium` → `mask` (masked body); `low` → `allow`.

- [ ] **Step 1: Write the failing test** — append:

```ts
test("a phone number is blocked (high) and never returned as-is", () => {
  const r = contactSafety("call me on 0801 234 5678");
  assert.equal(r.action, "block");
  assert.equal(r.severity, "high");
});

test("an obfuscated phone is still blocked via normalization", () => {
  const r = contactSafety("reach me at zero eight zero one two three four five six seven eight");
  assert.equal(r.action, "block");
});

test("a bare social handle is masked (medium), not blocked", () => {
  const r = contactSafety("follow @jane_doe for more");
  assert.equal(r.action, "mask");
  assert.ok(!r.maskedText.includes("@jane_doe"));
});

test("a shortener link is caught and masked", () => {
  const r = contactSafety("here bit.ly/deal");
  assert.notEqual(r.action, "allow");
  assert.ok(!r.maskedText.includes("bit.ly/deal"));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @henryco/contact-safety test`
Expected: FAIL — current facade always returns `allow`.

- [ ] **Step 3: Write implementation** — replace `index.ts` body below the types:

```ts
import { shouldAutoFlag } from "@henryco/trust/moderation";
import { detectExternalLinks, normalizeForDetection, maskContactsForDisplay } from "@henryco/trust/detect";

const RANK = { low: 0, medium: 1, high: 2, critical: 3 } as const;
type Sev = keyof typeof RANK;

// Contact-leak floor: @henryco/trust ranks a bare social handle as `low`
// (detected + flagged, but low severity). For contact safety a DETECTED
// off-platform contact must never come back as `allow` — escalate any detector
// that fired-but-ranked-low to `medium` (mask). Still composes canonical
// outputs (`flag`/`detected`); NO local pattern list.
function contactFloor(fired: boolean, sev: Sev): Sev {
  return fired && RANK[sev] < RANK.medium ? "medium" : sev;
}

export function contactSafety(text: string): ContactSafetyResult {
  const raw = shouldAutoFlag(text);
  const norm = shouldAutoFlag(normalizeForDetection(text));
  const links = detectExternalLinks(text);

  const candidates: Sev[] = [
    contactFloor(raw.flag, raw.severity as Sev),
    contactFloor(norm.flag, norm.severity as Sev),
    contactFloor(links.detected, links.severity as Sev),
  ];
  const severity = candidates.reduce<Sev>((a, b) => (RANK[b] > RANK[a] ? b : a), "low");

  let action: ContactSafetyAction;
  if (RANK[severity] >= RANK.high) action = "block";
  else if (RANK[severity] === RANK.medium) action = "mask";
  else action = "allow";

  const maskedText = action === "allow" ? text : maskContactsForDisplay(text);
  return { action, maskedText, patterns: links.patterns, severity };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @henryco/contact-safety test`
Expected: PASS (all 5 cases).

- [ ] **Step 5: Commit**

```bash
git add packages/contact-safety/index.ts packages/contact-safety/src/__tests__/contact-safety.test.ts
git commit -m "feat(contact-safety): block high/critical, mask medium (composes @henryco/trust)"
```

---

### Task 6: `@henryco/messaging` — package scaffold + canonical types

**Files:**
- Create: `packages/messaging/package.json`, `packages/messaging/tsconfig.json`, `packages/messaging/index.ts`
- Create: `packages/messaging/src/types.ts`
- Test: `packages/messaging/src/__tests__/anchor.test.ts` (placeholder import compile-check this task; logic in Task 7)

**Interfaces:**
- Produces: `ContextAnchorType`, `ContextAnchor`, `DeliveryState`, `Participant`, `Message`, `Conversation` types.

- [ ] **Step 1: Write the failing test**

Create `packages/messaging/src/__tests__/types.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Conversation, Message, Participant, ContextAnchor, DeliveryState } from "../types";

test("a Conversation value can be constructed with a typed anchor and participants", () => {
  const anchor: ContextAnchor = { type: "order", id: "ord_1", division: "marketplace" };
  const buyer: Participant = { userId: "u_buyer", role: "buyer", lastReadAt: null };
  const state: DeliveryState = "sent";
  const msg: Message = {
    id: "m_1", conversationId: "c_1", senderId: "u_buyer", senderRole: "buyer",
    body: "hello", attachments: [], deliveryState: state, createdAt: "2026-06-26T00:00:00Z",
  };
  const convo: Conversation = {
    id: "c_1", anchor, division: "marketplace", subject: null, status: "open",
    participants: [buyer], createdAt: "2026-06-26T00:00:00Z", updatedAt: "2026-06-26T00:00:00Z",
  };
  assert.equal(convo.anchor.type, "order");
  assert.equal(convo.participants[0].role, "buyer");
  assert.equal(msg.deliveryState, "sent");
});
```

Create `packages/messaging/package.json`:

```json
{
  "name": "@henryco/messaging",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./index.ts",
    "./server": "./src/pipeline.ts"
  },
  "scripts": {
    "typecheck": "tsc -p tsconfig.json",
    "test": "tsx --test src/__tests__/types.test.ts src/__tests__/anchor.test.ts src/__tests__/pipeline.test.ts src/__tests__/offline-queue.test.ts"
  },
  "dependencies": { "@henryco/contact-safety": "workspace:^" },
  "devDependencies": { "@types/node": "^20.0.0", "typescript": "^5.9.3" }
}
```

Then create `packages/messaging/tsconfig.json` with the content below — the barrel `index.ts` lives at the package ROOT (not under `src/`), so `include` MUST list it or the library is never typechecked; `types: ["node"]` lets the `.ts` test suites resolve `node:test`/`node:assert` — and run `pnpm install`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["node"]
  },
  "include": ["index.ts", "src/**/*"],
  "exclude": ["node_modules"]
}
```

(The `test` script lists all four suites up front; suites not yet created are added in their tasks — until then run the single suite with `tsx --test src/__tests__/types.test.ts`.)

- [ ] **Step 2: Run to verify it fails**

Run: `tsx --test packages/messaging/src/__tests__/types.test.ts`
Expected: FAIL — `../types` not found.

- [ ] **Step 3: Write implementation**

Create `packages/messaging/src/types.ts`:

```ts
export type ContextAnchorType =
  | "support" | "order" | "listing" | "booking" | "job"
  | "studio_project" | "property_inquiry" | "learn_cohort" | "direct";

export interface ContextAnchor {
  type: ContextAnchorType;
  id: string | null;          // null for "direct"
  division: string;
}

export type DeliveryState = "queued" | "sent" | "delivered" | "seen" | "failed";

export interface Participant {
  userId: string;             // STABLE FK — the owner-correctness anchor
  role: string;               // buyer | seller | staff | client | system | ...
  lastReadAt: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: string;
  body: string;               // already contact-safety-checked before persist
  attachments: string[];      // media://private/... refs only
  deliveryState: DeliveryState;
  createdAt: string;
}

export interface Conversation {
  id: string;
  anchor: ContextAnchor;
  division: string;
  subject: string | null;
  status: "open" | "closed";
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}
```

Create `packages/messaging/index.ts`:

```ts
export * from "./src/types";
export { normalizeAnchor } from "./src/anchor";
export type { MessagingAdapter } from "./src/adapter";
export { createOfflineQueue } from "./src/resilience/offline-queue";
```

(`index.ts` references `anchor`, `adapter`, `offline-queue` created in later tasks; this task only needs `types` to compile the test — comment out the not-yet-created re-exports until their tasks land, or create the files as empty stubs in their own tasks. For this task, temporarily export only `./src/types`.)

For THIS task, `index.ts` is:

```ts
export * from "./src/types";
```

- [ ] **Step 4: Run to verify it passes**

Run: `tsx --test packages/messaging/src/__tests__/types.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/messaging pnpm-lock.yaml
git commit -m "feat(messaging): scaffold package + canonical Conversation/Message/Participant types"
```

---

### Task 7: `@henryco/messaging` — `normalizeAnchor`

**Files:**
- Create: `packages/messaging/src/anchor.ts`
- Modify: `packages/messaging/index.ts` (add `normalizeAnchor` re-export)
- Test: `packages/messaging/src/__tests__/anchor.test.ts`

**Interfaces:**
- Consumes: `ContextAnchor`, `ContextAnchorType` from `./types`.
- Produces: `export function normalizeAnchor(input: { type?: string; id?: string | null; division: string }): ContextAnchor` — coerces an unknown anchor type to a valid `ContextAnchorType`, defaulting to `"direct"` (with `id: null`).

- [ ] **Step 1: Write the failing test**

Create `packages/messaging/src/__tests__/anchor.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeAnchor } from "../anchor";

test("a known anchor type is preserved", () => {
  const a = normalizeAnchor({ type: "booking", id: "bk_9", division: "care" });
  assert.deepEqual(a, { type: "booking", id: "bk_9", division: "care" });
});

test("an unknown/odd anchor falls back to direct with null id (never crashes)", () => {
  const a = normalizeAnchor({ type: "wat", id: "x", division: "studio" });
  assert.equal(a.type, "direct");
  assert.equal(a.id, null);
  assert.equal(a.division, "studio");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `tsx --test packages/messaging/src/__tests__/anchor.test.ts`
Expected: FAIL — `../anchor` not found.

- [ ] **Step 3: Write implementation**

Create `packages/messaging/src/anchor.ts`:

```ts
import type { ContextAnchor, ContextAnchorType } from "./types";

const VALID: ReadonlySet<ContextAnchorType> = new Set([
  "support", "order", "listing", "booking", "job",
  "studio_project", "property_inquiry", "learn_cohort", "direct",
]);

export function normalizeAnchor(input: { type?: string; id?: string | null; division: string }): ContextAnchor {
  const type = input.type && VALID.has(input.type as ContextAnchorType)
    ? (input.type as ContextAnchorType)
    : "direct";
  const id = type === "direct" ? null : (input.id ?? null);
  return { type, id, division: input.division };
}
```

Update `packages/messaging/index.ts`:

```ts
export * from "./src/types";
export { normalizeAnchor } from "./src/anchor";
```

- [ ] **Step 4: Run to verify it passes**

Run: `tsx --test packages/messaging/src/__tests__/anchor.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/messaging/src/anchor.ts packages/messaging/index.ts packages/messaging/src/__tests__/anchor.test.ts
git commit -m "feat(messaging): add normalizeAnchor with safe direct fallback"
```

---

### Task 8: `@henryco/messaging` — `MessagingAdapter` interface

**Files:**
- Create: `packages/messaging/src/adapter.ts`
- Modify: `packages/messaging/index.ts`
- Test: covered by the pipeline test (Task 9) via an in-memory fake; this task adds the interface + a compile check.

**Interfaces:**
- Consumes: `Message`, `Conversation` from `./types`.
- Produces:
```ts
export interface PersistInput { conversationId: string; senderId: string; senderRole: string; body: string; attachments: string[]; safetySeverity: string; }
export interface MessagingAdapter {
  persistMessage(input: PersistInput): Promise<Message>;
  getParticipants(conversationId: string): Promise<{ userId: string; role: string }[]>;
}
```

- [ ] **Step 1: Write the failing test** — add to a new `packages/messaging/src/__tests__/adapter.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import type { MessagingAdapter, PersistInput } from "../adapter";

test("an adapter implementation satisfies the interface shape", async () => {
  const fake: MessagingAdapter = {
    async persistMessage(i: PersistInput) {
      return {
        id: "m1", conversationId: i.conversationId, senderId: i.senderId, senderRole: i.senderRole,
        body: i.body, attachments: i.attachments, deliveryState: "sent" as const, createdAt: "2026-06-26T00:00:00Z",
      };
    },
    async getParticipants() { return [{ userId: "u_seller", role: "seller" }]; },
  };
  const m = await fake.persistMessage({ conversationId: "c1", senderId: "u", senderRole: "buyer", body: "hi", attachments: [], safetySeverity: "low" });
  assert.equal(m.conversationId, "c1");
});
```

Add `src/__tests__/adapter.test.ts` to the package `test` script list.

- [ ] **Step 2: Run to verify it fails**

Run: `tsx --test packages/messaging/src/__tests__/adapter.test.ts`
Expected: FAIL — `../adapter` not found.

- [ ] **Step 3: Write implementation**

Create `packages/messaging/src/adapter.ts`:

```ts
import type { Message } from "./types";

export interface PersistInput {
  conversationId: string;
  senderId: string;
  senderRole: string;
  body: string;            // post-safety body (masked if medium)
  attachments: string[];
  safetySeverity: string;  // audit: verdict at send time
}

export interface MessagingAdapter {
  persistMessage(input: PersistInput): Promise<Message>;
  getParticipants(conversationId: string): Promise<{ userId: string; role: string }[]>;
}
```

Update `index.ts` to add: `export type { MessagingAdapter, PersistInput } from "./src/adapter";`

- [ ] **Step 4: Run to verify it passes**

Run: `tsx --test packages/messaging/src/__tests__/adapter.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/messaging/src/adapter.ts packages/messaging/index.ts packages/messaging/src/__tests__/adapter.test.ts packages/messaging/package.json
git commit -m "feat(messaging): define MessagingAdapter persistence interface"
```

---

### Task 9: `@henryco/messaging` — `sendMessage` pipeline (the core invariant)

**Files:**
- Create: `packages/messaging/src/pipeline.ts`
- Modify: `packages/messaging/index.ts` (server barrel already maps `./server` → pipeline)
- Test: `packages/messaging/src/__tests__/pipeline.test.ts`

**Interfaces:**
- Consumes: `MessagingAdapter`, `PersistInput`; `contactSafety` from `@henryco/contact-safety`; `Message` type.
- Produces:
```ts
export interface SendDeps { adapter: MessagingAdapter; notify?: (n: { recipientUserId: string; conversationId: string }) => Promise<void>; safety?: (text: string) => { action: "allow"|"mask"|"block"; maskedText: string; severity: string }; }
export type SendResult = { ok: true; message: Message } | { ok: false; reason: "contact_blocked" };
export function sendMessage(input: { conversationId: string; senderId: string; senderRole: string; body: string; attachments?: string[] }, deps: SendDeps): Promise<SendResult>;
```

- [ ] **Step 1: Write the failing test**

Create `packages/messaging/src/__tests__/pipeline.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../pipeline";
import type { MessagingAdapter, PersistInput } from "../adapter";

function makeAdapter() {
  const persisted: PersistInput[] = [];
  const adapter: MessagingAdapter = {
    async persistMessage(i) {
      persisted.push(i);
      return { id: "m1", conversationId: i.conversationId, senderId: i.senderId, senderRole: i.senderRole, body: i.body, attachments: i.attachments, deliveryState: "sent", createdAt: "2026-06-26T00:00:00Z" };
    },
    async getParticipants() { return [{ userId: "u_buyer", role: "buyer" }, { userId: "u_seller", role: "seller" }]; },
  };
  return { adapter, persisted };
}

test("a clean message persists and notifies the OTHER participant by stable userId", async () => {
  const { adapter, persisted } = makeAdapter();
  const notified: string[] = [];
  const r = await sendMessage(
    { conversationId: "c1", senderId: "u_buyer", senderRole: "buyer", body: "is it available?" },
    { adapter, notify: async (n) => { notified.push(n.recipientUserId); } },
  );
  assert.equal(r.ok, true);
  assert.equal(persisted.length, 1);
  assert.deepEqual(notified, ["u_seller"]);   // never the sender; never an email
});

test("a high-severity contact message is BLOCKED and NEVER persisted", async () => {
  const { adapter, persisted } = makeAdapter();
  const r = await sendMessage(
    { conversationId: "c1", senderId: "u_buyer", senderRole: "buyer", body: "call me 0801 234 5678" },
    { adapter },
  );
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, "contact_blocked");
  assert.equal(persisted.length, 0);          // the invariant
});

test("a medium-severity message is persisted MASKED", async () => {
  const { adapter, persisted } = makeAdapter();
  const r = await sendMessage(
    { conversationId: "c1", senderId: "u_buyer", senderRole: "buyer", body: "follow @jane_doe" },
    { adapter },
  );
  assert.equal(r.ok, true);
  assert.ok(!persisted[0].body.includes("@jane_doe"));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `tsx --test packages/messaging/src/__tests__/pipeline.test.ts`
Expected: FAIL — `../pipeline` not found.

- [ ] **Step 3: Write implementation**

Create `packages/messaging/src/pipeline.ts`:

```ts
import type { MessagingAdapter } from "./adapter";
import type { Message } from "./types";
import { contactSafety } from "@henryco/contact-safety";

export interface SendDeps {
  adapter: MessagingAdapter;
  notify?: (n: { recipientUserId: string; conversationId: string }) => Promise<void>;
  safety?: (text: string) => { action: "allow" | "mask" | "block"; maskedText: string; severity: string };
}

export type SendResult =
  | { ok: true; message: Message }
  | { ok: false; reason: "contact_blocked" };

export async function sendMessage(
  input: { conversationId: string; senderId: string; senderRole: string; body: string; attachments?: string[] },
  deps: SendDeps,
): Promise<SendResult> {
  const check = (deps.safety ?? contactSafety)(input.body);

  if (check.action === "block") {
    // Return only the stable reason code; the rendering surface owns the localized
    // copy (Pattern A typed copy) — no user-facing English string in this shared package.
    return { ok: false, reason: "contact_blocked" };
  }

  const body = check.action === "mask" ? check.maskedText : input.body;

  const message = await deps.adapter.persistMessage({
    conversationId: input.conversationId,
    senderId: input.senderId,
    senderRole: input.senderRole,
    body,
    attachments: input.attachments ?? [],
    safetySeverity: check.severity,
  });

  if (deps.notify) {
    const participants = await deps.adapter.getParticipants(input.conversationId);
    const recipients = participants.filter((p) => p.userId !== input.senderId); // stable FK, never sender
    for (const r of recipients) {
      // Best-effort: the message is already persisted (the source of truth). A
      // failing downstream notification (the host `notify` is publishNotification,
      // itself best-effort) must NEVER reject an already-committed send — that would
      // make a caller retry and write a duplicate. Swallow + log per recipient so one
      // bad recipient can't starve the others, and always resolve {ok:true}.
      try {
        await deps.notify({ recipientUserId: r.userId, conversationId: input.conversationId });
      } catch (err) {
        console.warn("sendMessage: notify failed (message already persisted)", {
          recipientUserId: r.userId,
          conversationId: input.conversationId,
          err,
        });
      }
    }
  }

  return { ok: true, message };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `tsx --test packages/messaging/src/__tests__/pipeline.test.ts`
Expected: PASS (all three — note the block-never-persists invariant is now proven).

- [ ] **Step 5: Commit**

```bash
git add packages/messaging/src/pipeline.ts packages/messaging/src/__tests__/pipeline.test.ts
git commit -m "feat(messaging): sendMessage pipeline — block-before-persist, mask medium, notify by stable FK"
```

---

### Task 10: `@henryco/messaging` — shared offline-queue resilience primitive

**Files:**
- Create: `packages/messaging/src/resilience/offline-queue.ts`
- Modify: `packages/messaging/index.ts`
- Test: `packages/messaging/src/__tests__/offline-queue.test.ts`

**Interfaces:**
- Produces:
```ts
export interface QueueStorage { read(): string | null; write(v: string): void; }
export interface QueuedMessage { conversationId: string; body: string; attachments: string[]; }
export interface OfflineQueue {
  enqueue(m: QueuedMessage): void;
  pending(): QueuedMessage[];
  flush(send: (m: QueuedMessage) => Promise<{ ok: boolean; retryable?: boolean }>): Promise<void>;
}
export function createOfflineQueue(storage: QueueStorage, key?: string): OfflineQueue;
```

- [ ] **Step 1: Write the failing test**

Create `packages/messaging/src/__tests__/offline-queue.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { createOfflineQueue } from "../resilience/offline-queue";

function memStorage() {
  let v: string | null = null;
  return { read: () => v, write: (x: string) => { v = x; }, dump: () => v };
}

test("enqueue persists to storage and survives a fresh queue (simulated tab close)", () => {
  const s = memStorage();
  const q1 = createOfflineQueue(s);
  q1.enqueue({ conversationId: "c1", body: "hi", attachments: [] });
  const q2 = createOfflineQueue(s); // new instance reads the same storage
  assert.equal(q2.pending().length, 1);
  assert.equal(q2.pending()[0].body, "hi");
});

test("flush replays queued messages and clears them on success", async () => {
  const s = memStorage();
  const q = createOfflineQueue(s);
  q.enqueue({ conversationId: "c1", body: "a", attachments: [] });
  q.enqueue({ conversationId: "c1", body: "b", attachments: [] });
  const sent: string[] = [];
  await q.flush(async (m) => { sent.push(m.body); return { ok: true }; });
  assert.deepEqual(sent, ["a", "b"]);
  assert.equal(q.pending().length, 0);
});

test("flush STOPS on a retryable server error (backpressure, no retry-storm) and keeps the item", async () => {
  const s = memStorage();
  const q = createOfflineQueue(s);
  q.enqueue({ conversationId: "c1", body: "a", attachments: [] });
  q.enqueue({ conversationId: "c1", body: "b", attachments: [] });
  let calls = 0;
  await q.flush(async () => { calls++; return { ok: false, retryable: true }; });
  assert.equal(calls, 1);              // stopped after the first failure
  assert.equal(q.pending().length, 2); // nothing dropped
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `tsx --test packages/messaging/src/__tests__/offline-queue.test.ts`
Expected: FAIL — `../resilience/offline-queue` not found.

- [ ] **Step 3: Write implementation**

Create `packages/messaging/src/resilience/offline-queue.ts`:

```ts
export interface QueueStorage {
  read(): string | null;
  write(v: string): void;
}

export interface QueuedMessage {
  conversationId: string;
  body: string;
  attachments: string[];
}

export interface OfflineQueue {
  enqueue(m: QueuedMessage): void;
  pending(): QueuedMessage[];
  flush(send: (m: QueuedMessage) => Promise<{ ok: boolean; retryable?: boolean }>): Promise<void>;
}

const DEFAULT_KEY = "henryco.onyx-line.outbox.v1";

export function createOfflineQueue(storage: QueueStorage, key: string = DEFAULT_KEY): OfflineQueue {
  function load(): QueuedMessage[] {
    const raw = storage.read();
    if (!raw) return [];
    try { const v = JSON.parse(raw); return Array.isArray(v) ? (v as QueuedMessage[]) : []; }
    catch { return []; }
  }
  function save(items: QueuedMessage[]): void { storage.write(JSON.stringify(items)); }

  return {
    enqueue(m) { const items = load(); items.push(m); save(items); },
    pending() { return load(); },
    async flush(send) {
      let items = load();
      while (items.length > 0) {
        const next = items[0];
        const res = await send(next);
        if (!res.ok) {
          if (res.retryable === false) {
            // Poison message: a non-retryable failure will never succeed — drop it
            // (log, don't silently lose) and continue so it can't block the outbox head.
            console.warn("offline-queue: dropping non-retryable message", { conversationId: next.conversationId });
            items = items.slice(1);
            save(items);
            continue;
          }
          // Retryable (or unspecified) failure: stop and keep for a later flush (backpressure).
          return;
        }
        items = items.slice(1);
        save(items);
      }
    },
  };
}
```

Update `index.ts` to add: `export { createOfflineQueue } from "./src/resilience/offline-queue";` and `export type { OfflineQueue, QueuedMessage, QueueStorage } from "./src/resilience/offline-queue";`

- [ ] **Step 4: Run to verify it passes**

Run: `tsx --test packages/messaging/src/__tests__/offline-queue.test.ts`
Expected: PASS (persistence, replay, backpressure).

- [ ] **Step 5: Commit**

```bash
git add packages/messaging/src/resilience/offline-queue.ts packages/messaging/index.ts packages/messaging/src/__tests__/offline-queue.test.ts
git commit -m "feat(messaging): shared offline-queue primitive (durable, replay, backpressure)"
```

---

### Task 11: WS-1 gate — full suite + typecheck + money-safety grep

**Files:** none created; verification only.

- [ ] **Step 1: Run every new suite**

Run:
```bash
pnpm --filter @henryco/trust test
pnpm --filter @henryco/contact-safety test
pnpm --filter @henryco/messaging test
```
Expected: all PASS.

- [ ] **Step 2: Typecheck the new packages**

Run:
```bash
pnpm --filter @henryco/contact-safety typecheck
pnpm --filter @henryco/messaging typecheck
```
Expected: 0 errors.

- [ ] **Step 3: Money-safety + owner-correctness grep (must be empty)**

Run (PowerShell-safe; expect NO matches in the new packages):
```bash
git diff --name-only HEAD~10 HEAD -- packages/contact-safety packages/messaging packages/trust | cat
grep -rEn "amount|kobo|_payments|_invoices|ledger|wallet|\\*100|/100|toFixed" packages/messaging packages/contact-safety || echo "CLEAN: no money tokens"
grep -rEn "ilike|email\\s*=|phone\\s*=" packages/messaging || echo "CLEAN: no email/phone recipient match"
```
Expected: "CLEAN" on both money and email/phone — recipients are by `userId` only; no money tokens in the messaging core.

- [ ] **Step 4: Commit the gate note**

```bash
git commit --allow-empty -m "chore(ws-1): gate green — contact-safety + messaging core + trust additive, money-safe"
```

**WS-1 is now a working, testable foundation.** WS-2…WS-6 plans are generated next, each grounded in these real interfaces.

---

# WS-2…WS-6 — scope locked, full plans generated just-in-time

Each is a separate sub-project plan written when its predecessor lands (so code stays exact). Scope + file map + acceptance gate, fixed now:

### WS-2 — Elevated surface
- **Files:** `packages/messaging/src/ui/*` (Inbox, Thread, Composer built on `@henryco/messaging-thread` + `@henryco/chat-composer`, re-toned tokens); `apps/account/app/(account)/messages/*` (mount the aggregate inbox over the elevated `getInboxAggregate`); `packages/i18n/src/messaging-copy.ts` (Pattern A, ig/yo/ha EN-fallback). 
- **Acceptance:** editorial warm-paper Register-L; mountable per-app; client composer calls `contactSafety` for instant pre-warning; routes added to `scripts/a11y/*` set and pass `a11y:contrast`/`a11y:gate`/`a11y:headers`; zero white-on-gold; reduced-motion + focus rings + `aria-live` announcements.

### WS-3 — Studio safety hardening
- **Files:** `apps/studio/components/messaging/*` send path (wire the pipeline's `contactSafety` server-side before insert into `studio_project_messages`); thread row-mapper masks via `maskContactsForDisplay`.
- **Acceptance:** the HIGH leak closed (no raw phone/email/handle/link persists); studio data NOT moved; existing realtime/reactions/receipts unchanged; money-adjacent `studio_invoices`/`studio_payments` untouched.

### WS-4 — Marketplace buyer↔seller (net-new canonical store)
- **Files:** new migration `apps/marketplace/supabase/migrations/<ts>_conversations.sql` (`conversations`, `conversation_messages`, `conversation_participants` per spec §8, default-deny RLS, realtime publication); `apps/marketplace` adapter implementing `MessagingAdapter`; surface mount.
- **Acceptance:** PGlite/throwaway RLS proofs (participant-only read; no client insert; read-state update only for self; realtime respects SELECT RLS); seller never sees buyer contact; seller-accept gate (owner decision D-C); zero payment-table touch.

### WS-5 — Jobs realtime + convergence
- **Files:** migration adding `jobs_conversations`/`jobs_messages` to `supabase_realtime`; `apps/jobs` adapter + subscription; `packages/data/inbox-aggregate.ts` deep-link + unread fixes.
- **Acceptance:** jobs threads deep-link to the specific conversation; per-side unread computed; realtime live; contact-safety on jobs send path.

### WS-6 — Cross-division polish
- **Files:** care/property/learn/logistics adapters + surface mounts; `messaging-copy` consolidation; notification-wiring audit (stable-FK everywhere, all via `publishNotification`).
- **Acceptance:** every division on the surface; stable-FK audit clean (no email/phone recipient match anywhere); final `a11y:gate`; the full 7-invariant Acceptance Bar re-verified end-to-end.

---

## Self-Review (run against the spec)

**1. Spec coverage.** Each spec section maps to a task/workstream: §4.3 contact-safety → Tasks 4–5 (+ trust additions 1–3); §4.2 messaging core → Tasks 6–9; §4.8/§6.6 shared offline-queue → Task 10; §4.5 context-anchoring → Task 7 (`normalizeAnchor`) + WS-2 UI; §4.4 surface → WS-2; §4.7 notifications → Task 9 (stable-FK notify) + WS-6 audit; §8 net-new store → WS-4; §6.1–§6.6 charter requirements → the WS-1 invariants + each WS acceptance gate; §7 Acceptance Bar → Task 11 + every WS gate. No spec section is unmapped.

**2. Placeholder scan.** No "TBD/TODO/handle edge cases" in WS-1 tasks — every code step shows complete code. WS-2…WS-6 are intentionally outline-level (separate JIT plans), not placeholders inside an executable task.

**3. Type consistency.** `ContactSafetyResult.action` (`allow|mask|block`) is consistent across Tasks 4, 5, 9. `MessagingAdapter.persistMessage(PersistInput)` defined in Task 8 is consumed unchanged in Task 9. `DeliveryState` includes `queued` (Task 6) used conceptually by the offline-queue (Task 10). `severity` is `low|medium|high|critical` everywhere the facade returns it (Task 4 type, Task 5 impl, Task 9 `PersistInput.safetySeverity: string`). `normalizeAnchor` (Task 7) signature matches its `index.ts` re-export.

**Fixed inline during review:** `@henryco/messaging` `test` script lists all four suites up front (Task 6) so later tasks only add files, not rewrite the script; `index.ts` re-exports are introduced incrementally per task to keep each task's suite compilable.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-26-the-onyx-line.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
