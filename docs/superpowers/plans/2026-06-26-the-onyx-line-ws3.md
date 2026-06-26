# The Onyx Line — WS-3: Studio Safety Hardening — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the HIGH contact-leak in studio's project chat by screening BOTH server-side send paths with `@henryco/contact-safety` (block high/critical before persist, mask medium), plus display-masking defense-in-depth on already-stored rows — without moving studio data and without touching the money-adjacent `studio_invoices`/`studio_payments` tables.

**Architecture:** Studio has two inline inserts into `studio_project_messages` (the mature `lib/messaging/mutations.ts` `sendMessage`, and the portal `lib/portal/actions.ts` `sendProjectMessageAction`) and NO shared send module. Mirror WS-2: add one pure, TDD'd `screenMessageBody` helper and call it from BOTH actions between the membership check and the insert. Add `maskContactsForDisplay` in both row→message mappers for defense-in-depth. System messages (`payment_update` etc.) are produced only by a DB trigger that bypasses both user actions, so screening user sends cannot block them.

**Tech Stack:** TypeScript, Next.js server actions, Supabase, `@henryco/contact-safety` (`contactSafety` — client-safe, pure), `@henryco/trust` (`maskContactsForDisplay`), `@henryco/i18n` (`getMessagingCopy` for the localized block reason), `@henryco/messaging-thread` (portal engine).

## Global Constraints

- **No studio data move.** `studio_project_messages` schema/columns unchanged; only the body VALUE written is screened, and the rendered body is masked. No migration.
- **Money tables UNTOUCHED.** Zero reads/writes/migrations to `studio_invoices`, `studio_payments`, `studio_project_updates`, or any payment/ledger table. A diff touching one is an automatic task failure. (Confirmed separate: the two message inserts are `mutations.ts:79` and `portal/actions.ts:284`; money inserts are elsewhere.)
- **System messages must still flow.** Only USER free-text (the two send actions, `message_type: "text"`/`"file"`, `sender_role` client/team) is screened. System types (`payment_update`, `approval_request`, `milestone_update`, `system`) are inserted ONLY by the DB trigger `studio_seed_welcome_message` and never pass through the screened actions — so no special-casing is needed; do not add any.
- **contact-safety composes `@henryco/trust`.** Use `contactSafety` from `@henryco/contact-safety` (block high/critical, mask medium, allow low) and `maskContactsForDisplay` from `@henryco/trust/detect`. Never re-implement a pattern list. High/critical is blocked before the insert and never persisted.
- **No user-facing English in the lib/action.** The block returns a stable reason code `reason: "contact_blocked"` — the surface localizes via `getMessagingCopy(locale).contactSafety` (ig/yo/ha/hi EN-fallback by omission, never machine-translated).
- **Studio test convention.** `apps/studio` has no test runner today; add `"test": "tsx --test ..."` (estate convention; `tsx` is already a studio devDep). Tests use `node:test` + `tsx --test`.
- **Studio must declare the dep.** Add `"@henryco/contact-safety": "workspace:^"` to `apps/studio/package.json` (it isn't there yet), then `pnpm install` (commit package.json + lockfile together).
- **Scoped commits.** The branch carries ~750 unrelated working-tree changes — always `git add <explicit paths>`, never `-A`.
- **Windows build:** `pnpm -r --workspace-concurrency=1 ... run build`.

## File structure (WS-3)

```
apps/studio/lib/messaging/
  screen-message.ts                 // CREATE — pure screenMessageBody(text) (TDD'd; shared by both send paths)
  __tests__/screen-message.test.ts  // CREATE
  mutations.ts                      // MODIFY — screen between validation (L60) and insert (L79); block→reason, mask→masked body
  queries.ts                        // MODIFY — shapeMessage (L327) display-mask the stored body (defense-in-depth)
  types.ts                          // MODIFY — SendMessageResult gains optional `reason?: "contact_blocked"`

apps/studio/lib/portal/
  actions.ts                        // MODIFY — sendProjectMessageAction: screen between ownership (L260) and insert (L284)

apps/studio/components/portal/
  StudioMessageThread.tsx           // MODIFY — rowToMessage (L56) display-mask the stored body (defense-in-depth)

apps/studio/package.json            // MODIFY — add @henryco/contact-safety dep + a `test` script
```

---

### Task 1: Shared `screenMessageBody` helper (pure, TDD) + studio dep + test script

**Files:** Create `apps/studio/lib/messaging/screen-message.ts`, `apps/studio/lib/messaging/__tests__/screen-message.test.ts`; Modify `apps/studio/package.json`.

**Interfaces:**
- Produces: `export function screenMessageBody(text: string): { action: "allow" | "mask" | "block"; body: string }` — block → `{action:"block", body:text}` (caller rejects, body unused); mask → `{action:"mask", body: maskedText}`; allow → `{action:"allow", body:text}`. Composes `contactSafety`.

- [ ] **Step 1: Add the dep + test script to `apps/studio/package.json`**

Add `"@henryco/contact-safety": "workspace:^"` to `dependencies` (alphabetically among the `@henryco/*` deps). Add to `scripts`: `"test": "tsx --test lib/messaging/__tests__/screen-message.test.ts"`. Then run `pnpm install` (updates the lockfile — commit it with this task).

- [ ] **Step 2: Write the failing test** — `apps/studio/lib/messaging/__tests__/screen-message.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { screenMessageBody } from "../screen-message";

test("clean body passes through unchanged", () => {
  assert.deepEqual(screenMessageBody("is the homepage draft ready?"), {
    action: "allow",
    body: "is the homepage draft ready?",
  });
});
test("a phone number is blocked (never persisted)", () => {
  assert.equal(screenMessageBody("call me on 0801 234 5678").action, "block");
});
test("an email is blocked", () => {
  assert.equal(screenMessageBody("reach me at jane.doe@gmail.com").action, "block");
});
test("a bare handle is masked in the persisted body", () => {
  const r = screenMessageBody("follow @jane_doe");
  assert.equal(r.action, "mask");
  assert.ok(!r.body.includes("@jane_doe"));
});
```

Run (red): `pnpm --filter @henryco/studio exec tsx --test lib/messaging/__tests__/screen-message.test.ts`
Expected: FAIL — `../screen-message` not found.

- [ ] **Step 3: Implement** — `apps/studio/lib/messaging/screen-message.ts`:

```ts
import { contactSafety } from "@henryco/contact-safety";

/**
 * Screens a user message body before it is persisted to studio_project_messages.
 * High/critical off-platform contact (phone, email) is blocked; medium (handles,
 * links) is masked; clean text passes through. Shared by both studio send paths
 * (lib/messaging/mutations.ts and lib/portal/actions.ts).
 */
export function screenMessageBody(text: string): { action: "allow" | "mask" | "block"; body: string } {
  const verdict = contactSafety(text);
  if (verdict.action === "block") return { action: "block", body: text };
  if (verdict.action === "mask") return { action: "mask", body: verdict.maskedText };
  return { action: "allow", body: text };
}
```

- [ ] **Step 4: Run green** → 4/4 pass.
- [ ] **Step 5: Commit** — `git add apps/studio/lib/messaging/screen-message.ts apps/studio/lib/messaging/__tests__/screen-message.test.ts apps/studio/package.json pnpm-lock.yaml && git commit -m "feat(studio): screenMessageBody helper + @henryco/contact-safety dep (shared by both send paths)"`

---

### Task 2: Screen the primary send path (`lib/messaging/mutations.ts`)

**Files:** Modify `apps/studio/lib/messaging/mutations.ts`, `apps/studio/lib/messaging/types.ts`.

**Context:** `sendMessage(input)` (mutations.ts:41-127) computes `const body = clipBody(input.body || "")` (L56), validates body-or-attachment (L58-60), derives `messageType` (L62-64), then inserts into `studio_project_messages` (L79-94). The screen goes after L60 and before L79. The block must return BEFORE the insert. This single action is the chokepoint for online + optimistic + offline-queue-retry sends (all funnel through `sendDirect`).

- [ ] **Step 1: Extend the result type** — in `types.ts`, find `SendMessageResult` (~L168-185) and add an optional reason channel to the failure shape: `reason?: "contact_blocked"`. (Read the exact current type and add the field minimally without changing the success shape.)

- [ ] **Step 2: Read mutations.ts:41-94** to confirm the exact `body` variable, the validation return style, and the insert object, then wire the screen.

- [ ] **Step 3: Implement** — import the helper at the top of `mutations.ts`:
```ts
import { screenMessageBody } from "./screen-message";
```
After the body-or-attachment validation (the `if (!body && no attachments) return ...` around L58-60) and before building the insert, add:
```ts
  // Server-side contact-safety (defense-in-depth; the client is bypassable).
  // High/critical off-platform contact is blocked and never persisted; medium is
  // masked. Only screen when there is body text (attachment-only sends pass "").
  const screened = screenMessageBody(body);
  if (screened.action === "block") {
    return { ok: false, reason: "contact_blocked" };
  }
```
Then change the insert so the persisted body is the screened body: in the insert object (L79-94), change `body,` (or `body: body,`) to `body: screened.body,`. Change ONLY the body value — do not touch `project_id`, `sender`, `sender_id`, `sender_role`, `message_type`, `metadata`, `attachments`, `reply_to_id`.

- [ ] **Step 4: Verify** — typecheck must show NO NEW error referencing `mutations.ts`/`screen-message.ts` (the studio app may have pre-existing unrelated typecheck noise — grep the tsc output for these filenames; they must be absent). Lint the two files (exit 0). Confirm the screen returns before the insert (read the final function). Money-safety: confirm the diff touches no `studio_invoices`/`studio_payments`.

- [ ] **Step 5: Commit** — `git add apps/studio/lib/messaging/mutations.ts apps/studio/lib/messaging/types.ts && git commit -m "feat(studio): screen the primary project-message send path (block before persist, mask medium)"`

---

### Task 3: Screen the portal send path (`lib/portal/actions.ts`)

**Files:** Modify `apps/studio/lib/portal/actions.ts`.

**Context:** `sendProjectMessageAction(formData)` (actions.ts:238-304): `const body = clean(formData.get("body"))` (L240), `getClientPortalViewer()` (L245), explicit project ownership check (L249-260), then inserts into `studio_project_messages` (L284-295). The screen goes after the ownership check (L260) and before the insert (L284).

- [ ] **Step 1: Read actions.ts:238-304** to confirm the `body` variable, the `SendMessageResult` return style used here, and the insert object.

- [ ] **Step 2: Implement** — import the helper:
```ts
import { screenMessageBody } from "@/lib/messaging/screen-message";
```
(Use the studio path alias the file already uses for `@/lib/...` imports — confirm by reading the existing imports; if the file uses relative imports, use `../messaging/screen-message`.)
After the ownership check (the `unauthorised` return around L260) and before the insert, add:
```ts
  const screened = screenMessageBody(body);
  if (screened.action === "block") {
    return { ok: false, reason: "contact_blocked" };
  }
```
Then in the insert object (L284-295), change `body,` → `body: screened.body,`. Change ONLY the body value; leave `id`, `project_id`, `sender_id`, `sender`, `sender_role`, `attachments`, `read_by`, `is_internal`, `created_at` untouched.

- [ ] **Step 3: Verify** — typecheck no-new-error on `actions.ts`; lint exit 0; the screen returns before the insert; money-safety (this file ALSO contains a `studio_payments` insert at ~L160 for a DIFFERENT action — confirm your diff does NOT touch it; you are only editing `sendProjectMessageAction`).

- [ ] **Step 4: Commit** — `git add apps/studio/lib/portal/actions.ts && git commit -m "feat(studio): screen the portal project-message send path (block before persist, mask medium)"`

---

### Task 4: Display-masking defense-in-depth (both row→message mappers)

**Files:** Modify `apps/studio/lib/messaging/queries.ts`, `apps/studio/components/portal/StudioMessageThread.tsx`.

**Context:** Already-stored rows (sent before this hardening, or any that slipped through) get masked at render. Primary mapper `shapeMessage` sets `body: raw.body || ""` (queries.ts:327), rendered as PLAIN TEXT in `message-bubble.tsx` (`whitespace-pre-wrap`). Portal mapper `rowToMessage` sets `body: String(row.body || "")` (StudioMessageThread.tsx:56), rendered by the `@henryco/messaging-thread` engine. Mask both with `maskContactsForDisplay`.

- [ ] **Step 1:** In `queries.ts`, import `maskContactsForDisplay`:
```ts
import { maskContactsForDisplay } from "@henryco/trust/detect";
```
(`@henryco/trust` is a transitive dep via `@henryco/contact-safety`; if the studio typecheck can't resolve the direct subpath import, add `"@henryco/trust": "workspace:^"` to studio deps in this task and commit the lockfile — confirm by typechecking.) Change `shapeMessage`'s body line (L327) from `body: raw.body || ""` to `body: maskContactsForDisplay(raw.body || "")`. Do NOT mask system-message rendering paths if they bypass `shapeMessage` — confirm by reading that system types are dispatched away in `message-bubble.tsx`; `shapeMessage` only shapes the stored body, which is safe to mask (system bodies have no user contact text).

- [ ] **Step 2:** In `StudioMessageThread.tsx`, import `maskContactsForDisplay` from `@henryco/trust/detect` and change `rowToMessage`'s body (L56) from `body: String(row.body || "")` to `body: maskContactsForDisplay(String(row.body || ""))`.

- [ ] **Step 3:** Add a focused test proving masking is wired (a pure test over a tiny extracted function, OR — since these are inline one-liners — a `screen-message.test.ts` addition asserting `maskContactsForDisplay` behavior is imported correctly). Simplest: add a test asserting `maskContactsForDisplay("ping me on whatsapp 0801 234 5678")` strips the phone (this proves the display-mask primitive studio now depends on behaves). Co-locate in the studio test file.

- [ ] **Step 4: Verify** — typecheck no-new-error on the two files; lint exit 0; the `@henryco/trust/detect` import resolves. Confirm no money table touched.

- [ ] **Step 5: Commit** — `git add apps/studio/lib/messaging/queries.ts apps/studio/components/portal/StudioMessageThread.tsx apps/studio/lib/messaging/__tests__/screen-message.test.ts [pnpm-lock.yaml apps/studio/package.json if trust dep added] && git commit -m "feat(studio): display-mask stored message bodies in both mappers (defense-in-depth)"`

---

### Task 5: WS-3 gate

**Files:** none; verification only.

- [ ] **Step 1:** Run the studio screen suite: `pnpm --filter @henryco/studio test` → all green (screen-message + display-mask assertions).
- [ ] **Step 2:** Typecheck no-new-error: `pnpm --filter @henryco/studio exec tsc --noEmit 2>&1 | grep -E "screen-message|mutations.ts|portal/actions.ts|queries.ts|StudioMessageThread"` → MUST be empty (studio may have pre-existing unrelated tsc errors; only ours must be absent). Lint the touched files (exit 0).
- [ ] **Step 3:** Money-safety + leak-closure greps over the WS-3 diff (Task 1 base..HEAD):
  - `git diff <base>..HEAD -- 'apps/studio/**' | grep -iE "^\+" | grep -iE "studio_invoices|studio_payments|studio_project_updates"` → MUST be empty (no money-table touch).
  - Confirm BOTH inserts now persist `screened.body`: `grep -n "body: screened.body" apps/studio/lib/messaging/mutations.ts apps/studio/lib/portal/actions.ts` → 2 hits.
  - Confirm BOTH mappers now mask: `grep -n "maskContactsForDisplay" apps/studio/lib/messaging/queries.ts apps/studio/components/portal/StudioMessageThread.tsx` → 2 hits.
- [ ] **Step 4: Commit** — `git commit --allow-empty -m "chore(ws-3): gate green — studio send paths screened (block-before-persist) + display-masked, money untouched"`

---

## Self-Review (against spec WS-3 scope)

**Spec coverage:** "studio send runs contact-safety" → T2 (primary) + T3 (portal); "HIGH leak closed" → both server send paths block high/critical before persist + mask medium; "display masking wired" → T4 both mappers; "no studio data move" → no migration, only body value/render changed; "money untouched" → Global Constraint + T5 grep, the two money inserts are in different statements/files-sections never edited. The two-send-path reality (not in the original one-surface assumption) is handled by a shared helper called from both.

**Placeholder scan:** the exact insert objects + return styles are deferred to the implementer READING the named line ranges (mutations.ts:41-94, actions.ts:238-304, types.ts:168-185) rather than guessed — same justified pattern as WS-2 T4's "read SendButton.tsx for the real selector." The pure helper + tests show full code.

**Type consistency:** `screenMessageBody` returns the same `action` union as `contactSafety`; both call sites use the `{ ok:false, reason:"contact_blocked" }` shape, which T2 adds to `SendMessageResult`. `maskContactsForDisplay` is the existing `@henryco/trust/detect` export from WS-1.

## Execution
Subagent-driven: fresh implementer + Opus reviewer per task, two-stage review, then a final whole-branch review + finishing-a-development-branch.
