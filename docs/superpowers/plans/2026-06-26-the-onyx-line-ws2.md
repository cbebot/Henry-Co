# The Onyx Line — WS-2: Elevated Editorial Surface — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the warm-paper editorial "Messages" surface — a brass composer, an instant contact-safety pre-warning, localized copy, the support deep-link, and a11y registration — on top of the already-editorial inbox/thread and the WS-1 `@henryco/messaging` + `@henryco/contact-safety` foundation.

**Architecture:** The inbox (`HeroCard`+`DivisionLanding`) and the support thread (`@henryco/messaging-thread` `MessageThread` engine + `editorial.css` warm-paper skin + `surfaceTone="warm"`) already exist. WS-2 adds the genuine gaps: (1) a warm-paper composer re-tone via the composer's own `--composer-accent*` CSS vars (the engine renders `ChatComposer` internally; its `editorial.css` composer rules are dormant against the current `henryco-composer-*` DOM); (2) a client `ContactSafetyHint` driven by the verified-client-safe `contactSafety()`, mounted through the engine's existing `composerExtras` render-prop; (3) server-side `contactSafety` defense-in-depth on the canonical `/api/support/reply`; (4) a Pattern-A `messaging-copy` i18n module; (5) the support deep-link + dead-code cleanup + a11y registration.

**Tech Stack:** TypeScript, React 19, `@henryco/messaging-thread` (`MessageThread`, `composerExtras`, `surfaceTone="warm"`), `@henryco/chat-composer`, `@henryco/contact-safety` (`contactSafety` — client-safe), `@henryco/i18n` (Pattern A), `@henryco/data` (`getInboxAggregate`), account warm-paper `--acct-*` / `--hc-*` tokens.

## Global Constraints

(Carried verbatim from WS-1's plan + the spec; every task includes these.)

- **Zero payment-table change.** No money tables touched.
- **AA contrast — never white-on-gold.** Composer/Send and all accent fills use `--hc-text-on-accent` / `--acct-ink` (`#1A1814`) on `--acct-gold` (`#C9A227`) = 8.6:1; gold *as text* uses `--acct-gold-text` (`#8A6F00`, 5:1 on cream) — never raw `--acct-gold` as text on light. Status never color-alone; honor `prefers-reduced-motion` (every keyframe gated); 2px focus-visible ring (`--hc-focus-ring`).
- **ig/yo/ha/hi never machine-translated.** New copy = Pattern A: EN baseline + native `DeepPartial` overrides for fr/es/pt/ar/de/it/zh; **ig/yo/ha/hi OMITTED from `LOCALE_MAP`** → EN fallback by construction (the getter returns `EN` when `overrides` is undefined). Brand names never translated.
- **contact-safety composes `@henryco/trust`.** Import `contactSafety` from `@henryco/contact-safety` (client-verified safe: pure, no `server-only`/`node:`/env/supabase). The server path composes the same; high/critical blocked before persist, medium masked. Reason code only (`contact_blocked`) — the surface owns localized copy.
- **Locale access:** server components use `getAccountAppLocale()` from `@/lib/locale-server` (NOTE: `getAccountPublicLocale` does NOT exist in the account app); client components use `useHenryCoLocale()` from `@henryco/i18n/react`.
- **Windows build:** `pnpm -r --workspace-concurrency=1 ... run build`.
- **Scoped commits:** the branch carries ~750 unrelated working-tree changes — always `git add <explicit paths>`, never `-A`.
- **Money copy:** integer kobo via `@henryco/pricing`; never float / `×100`.

## File structure (WS-2)

```
packages/i18n/src/
  messaging-copy.ts                 // CREATE — Pattern A: contact-safety hint + composer copy
  index.ts                          // MODIFY — export * from "./messaging-copy"
  server.ts                         // MODIFY — re-export getMessagingCopy + type
  __tests__/messaging-copy.test.ts  // CREATE — EN/native/EN-fallback render proof

apps/account/components/messages/
  contact-safety-hint.ts            // CREATE — pure contactSafetyHintState(text, copy)
  ContactSafetyHint.tsx             // CREATE — "use client" presentational hint
  __tests__/contact-safety-hint.test.ts // CREATE — TDD the pure helper

apps/account/components/support/
  SupportThreadRoom.tsx             // MODIFY — pass composerExtras={ContactSafetyHint}
  editorial.css                     // MODIFY — warm-paper composer re-tone (real henryco-composer-* selectors)

apps/account/app/api/support/reply/
  route.ts                          // MODIFY — server-side contactSafety before persist
  screen-reply.ts                   // CREATE — pure screenReplyBody(text) decision (TDD'd)

packages/data/src/
  inbox-aggregate.ts                // MODIFY — support branch href "/support" -> "/support/${id}"

apps/account/components/messages-inbox/
  InboxHero.tsx                     // DELETE — orphaned/dead
  editorial.css                     // MODIFY — remove dead __hero* block

scripts/a11y/
  route-manifest.mjs                // MODIFY — register /messages in the account routes
```

---

### Task 1: `messaging-copy` Pattern-A i18n module

**Files:** Create `packages/i18n/src/messaging-copy.ts`, `packages/i18n/src/__tests__/messaging-copy.test.ts`; Modify `packages/i18n/src/index.ts`, `packages/i18n/src/server.ts`.

**Interfaces:**
- Produces: `export type MessagingCopy = { contactSafety: { blockedTitle, blockedBody, maskedTitle, maskedBody, reassurance, dismiss: string } }`
- Produces: `export function getMessagingCopy(locale: AppLocale): MessagingCopy`

- [ ] **Step 1: Write the failing test** — `packages/i18n/src/__tests__/messaging-copy.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { getMessagingCopy } from "../messaging-copy";

test("EN baseline is present and non-empty", () => {
  const en = getMessagingCopy("en");
  assert.ok(en.contactSafety.reassurance.length > 0);
  assert.ok(en.contactSafety.blockedTitle.length > 0);
});

test("ar resolves native (differs from EN) — RTL native copy present", () => {
  const ar = getMessagingCopy("ar");
  assert.notEqual(ar.contactSafety.reassurance, getMessagingCopy("en").contactSafety.reassurance);
});

test("ig is EN-fallback by omission — byte-identical to EN, never machine-translated", () => {
  assert.deepEqual(getMessagingCopy("ig"), getMessagingCopy("en"));
  assert.deepEqual(getMessagingCopy("yo"), getMessagingCopy("en"));
  assert.deepEqual(getMessagingCopy("ha"), getMessagingCopy("en"));
  assert.deepEqual(getMessagingCopy("hi"), getMessagingCopy("en"));
});
```

Run (red): `pnpm --filter @henryco/i18n exec tsx --test src/__tests__/messaging-copy.test.ts`
Expected: FAIL — `../messaging-copy` not found.

- [ ] **Step 2: Implement** — `packages/i18n/src/messaging-copy.ts` (mirror `care-pricing-copy.ts`; brand "Henry Onyx" verbatim in every locale). EN + native fr/es/pt/ar/de/it/zh; **ig/yo/ha/hi omitted**:

```ts
import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

export type MessagingCopy = {
  contactSafety: {
    blockedTitle: string;
    blockedBody: string;
    maskedTitle: string;
    maskedBody: string;
    reassurance: string;
    dismiss: string;
  };
};

const MESSAGING_COPY_EN: MessagingCopy = {
  contactSafety: {
    blockedTitle: "Let's keep this on Henry Onyx",
    blockedBody: "Phone numbers, emails, and off-platform links can't be sent. Keeping the conversation here is how we protect you from scammers.",
    maskedTitle: "We hid some details",
    maskedBody: "Contact details and outside links are hidden so the conversation stays safe on Henry Onyx.",
    reassurance: "You're protected here.",
    dismiss: "Got it",
  },
};

const MESSAGING_COPY_FR: DeepPartial<MessagingCopy> = {
  contactSafety: {
    blockedTitle: "Restons sur Henry Onyx",
    blockedBody: "Les numéros de téléphone, e-mails et liens externes ne peuvent pas être envoyés. Garder la conversation ici vous protège des arnaqueurs.",
    maskedTitle: "Nous avons masqué certains détails",
    maskedBody: "Les coordonnées et liens externes sont masqués pour que la conversation reste sûre sur Henry Onyx.",
    reassurance: "Vous êtes protégé ici.",
    dismiss: "Compris",
  },
};
const MESSAGING_COPY_ES: DeepPartial<MessagingCopy> = {
  contactSafety: {
    blockedTitle: "Sigamos en Henry Onyx",
    blockedBody: "No se pueden enviar números de teléfono, correos ni enlaces externos. Mantener la conversación aquí te protege de estafadores.",
    maskedTitle: "Ocultamos algunos datos",
    maskedBody: "Los datos de contacto y enlaces externos se ocultan para que la conversación siga siendo segura en Henry Onyx.",
    reassurance: "Aquí estás protegido.",
    dismiss: "Entendido",
  },
};
const MESSAGING_COPY_PT: DeepPartial<MessagingCopy> = {
  contactSafety: {
    blockedTitle: "Vamos manter no Henry Onyx",
    blockedBody: "Números de telefone, e-mails e links externos não podem ser enviados. Manter a conversa aqui protege você de golpistas.",
    maskedTitle: "Ocultamos alguns detalhes",
    maskedBody: "Dados de contato e links externos ficam ocultos para a conversa permanecer segura no Henry Onyx.",
    reassurance: "Você está protegido aqui.",
    dismiss: "Entendi",
  },
};
const MESSAGING_COPY_AR: DeepPartial<MessagingCopy> = {
  contactSafety: {
    blockedTitle: "لنُبقِ المحادثة على Henry Onyx",
    blockedBody: "لا يمكن إرسال أرقام الهواتف أو البريد الإلكتروني أو الروابط الخارجية. إبقاء المحادثة هنا يحميك من المحتالين.",
    maskedTitle: "أخفينا بعض التفاصيل",
    maskedBody: "تُخفى بيانات التواصل والروابط الخارجية لتبقى المحادثة آمنة على Henry Onyx.",
    reassurance: "أنت محميّ هنا.",
    dismiss: "حسنًا",
  },
};
const MESSAGING_COPY_DE: DeepPartial<MessagingCopy> = {
  contactSafety: {
    blockedTitle: "Bleiben wir bei Henry Onyx",
    blockedBody: "Telefonnummern, E-Mails und externe Links können nicht gesendet werden. Das Gespräch hier zu halten schützt Sie vor Betrügern.",
    maskedTitle: "Wir haben einige Angaben ausgeblendet",
    maskedBody: "Kontaktdaten und externe Links werden ausgeblendet, damit das Gespräch auf Henry Onyx sicher bleibt.",
    reassurance: "Hier sind Sie geschützt.",
    dismiss: "Verstanden",
  },
};
const MESSAGING_COPY_IT: DeepPartial<MessagingCopy> = {
  contactSafety: {
    blockedTitle: "Restiamo su Henry Onyx",
    blockedBody: "Numeri di telefono, email e link esterni non possono essere inviati. Mantenere qui la conversazione ti protegge dai truffatori.",
    maskedTitle: "Abbiamo nascosto alcuni dettagli",
    maskedBody: "I recapiti e i link esterni vengono nascosti perché la conversazione resti sicura su Henry Onyx.",
    reassurance: "Qui sei protetto.",
    dismiss: "Ho capito",
  },
};
const MESSAGING_COPY_ZH: DeepPartial<MessagingCopy> = {
  contactSafety: {
    blockedTitle: "请继续在 Henry Onyx 上沟通",
    blockedBody: "电话号码、电子邮件和站外链接无法发送。把对话留在这里能保护你免受诈骗。",
    maskedTitle: "我们隐藏了部分信息",
    maskedBody: "联系方式和外部链接已被隐藏，让对话在 Henry Onyx 上保持安全。",
    reassurance: "你在这里受到保护。",
    dismiss: "知道了",
  },
};

const MESSAGING_LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<MessagingCopy>>> = {
  fr: MESSAGING_COPY_FR,
  es: MESSAGING_COPY_ES,
  pt: MESSAGING_COPY_PT,
  ar: MESSAGING_COPY_AR,
  de: MESSAGING_COPY_DE,
  it: MESSAGING_COPY_IT,
  zh: MESSAGING_COPY_ZH,
  // ig / yo / ha / hi intentionally omitted → EN fallback (never machine-translated)
};

export function getMessagingCopy(locale: AppLocale): MessagingCopy {
  const overrides = MESSAGING_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      MESSAGING_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as MessagingCopy;
  }
  return MESSAGING_COPY_EN;
}
```

Then add `export * from "./messaging-copy";` to `packages/i18n/src/index.ts` and `export { getMessagingCopy, type MessagingCopy } from "./messaging-copy";` to `packages/i18n/src/server.ts`.

- [ ] **Step 3: Run green** — `pnpm --filter @henryco/i18n exec tsx --test src/__tests__/messaging-copy.test.ts` → PASS (EN present, ar native, ig/yo/ha/hi == EN).
- [ ] **Step 4: Commit** — `git add packages/i18n/src/messaging-copy.ts packages/i18n/src/__tests__/messaging-copy.test.ts packages/i18n/src/index.ts packages/i18n/src/server.ts && git commit -m "feat(i18n): messaging-copy Pattern-A module (contact-safety hint; ig/yo/ha/hi EN-fallback)"`

---

### Task 2: `ContactSafetyHint` — pure decision helper (TDD) + client component

**Files:** Create `apps/account/components/messages/contact-safety-hint.ts`, `ContactSafetyHint.tsx`, `__tests__/contact-safety-hint.test.ts`.

**Interfaces:**
- Consumes: `contactSafety` from `@henryco/contact-safety`; `MessagingCopy` from `@henryco/i18n`.
- Produces: `export function contactSafetyHintState(text: string, copy: MessagingCopy["contactSafety"]): { show: boolean; tone: "block" | "mask"; title: string; body: string } | null`

- [ ] **Step 1: Write the failing test** — `apps/account/components/messages/__tests__/contact-safety-hint.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { contactSafetyHintState } from "../contact-safety-hint";
import { getMessagingCopy } from "@henryco/i18n";

const copy = getMessagingCopy("en").contactSafety;

test("clean text shows no hint", () => {
  assert.equal(contactSafetyHintState("is the blue one available?", copy), null);
});
test("a phone number shows the BLOCK hint", () => {
  const s = contactSafetyHintState("call me on 0801 234 5678", copy);
  assert.ok(s);
  assert.equal(s!.tone, "block");
  assert.equal(s!.title, copy.blockedTitle);
});
test("a bare handle shows the MASK hint", () => {
  const s = contactSafetyHintState("follow @jane_doe", copy);
  assert.ok(s);
  assert.equal(s!.tone, "mask");
  assert.equal(s!.title, copy.maskedTitle);
});
```

Run (red): `pnpm --filter @henryco/account exec tsx --test components/messages/__tests__/contact-safety-hint.test.ts`
Expected: FAIL — `../contact-safety-hint` not found.

- [ ] **Step 2: Implement** — `apps/account/components/messages/contact-safety-hint.ts`:

```ts
import { contactSafety } from "@henryco/contact-safety";
import type { MessagingCopy } from "@henryco/i18n";

export function contactSafetyHintState(
  text: string,
  copy: MessagingCopy["contactSafety"],
): { show: boolean; tone: "block" | "mask"; title: string; body: string } | null {
  const verdict = contactSafety(text);
  if (verdict.action === "allow") return null;
  if (verdict.action === "block") {
    return { show: true, tone: "block", title: copy.blockedTitle, body: copy.blockedBody };
  }
  return { show: true, tone: "mask", title: copy.maskedTitle, body: copy.maskedBody };
}
```

- [ ] **Step 3: Run green** → PASS.
- [ ] **Step 4: Create the client component** — `apps/account/components/messages/ContactSafetyHint.tsx`:

```tsx
"use client";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { getMessagingCopy } from "@henryco/i18n";
import { contactSafetyHintState } from "./contact-safety-hint";

export function ContactSafetyHint({ text }: { text: string }) {
  const locale = useHenryCoLocale();
  const copy = getMessagingCopy(locale).contactSafety;
  const state = contactSafetyHintState(text, copy);
  if (!state) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="acct-contact-safety-hint"
      data-tone={state.tone}
    >
      <strong className="acct-contact-safety-hint__title">{state.title}</strong>
      <span className="acct-contact-safety-hint__body">{state.body}</span>
      <span className="acct-contact-safety-hint__reassure">{copy.reassurance}</span>
    </div>
  );
}
```

- [ ] **Step 5: Commit** — `git add apps/account/components/messages/contact-safety-hint.ts apps/account/components/messages/ContactSafetyHint.tsx apps/account/components/messages/__tests__/contact-safety-hint.test.ts && git commit -m "feat(account): ContactSafetyHint — instant client pre-warning (composes contactSafety)"`

---

### Task 3: Mount the hint + warm-paper hint styling into the support thread

**Files:** Modify `apps/account/components/support/SupportThreadRoom.tsx` (pass `composerExtras`), `apps/account/components/support/editorial.css` (style `.acct-contact-safety-hint`, AA-safe).

- [ ] **Step 1:** In `SupportThreadRoom.tsx`, import `ContactSafetyHint` and pass to `<MessageThread … composerExtras={(ctx) => <ContactSafetyHint text={ctx.draft} />} />`. (The engine's `composerExtras` ctx is `{ draft, setDraft }` per `MessageThreadProps`; use `ctx.draft`.)
- [ ] **Step 2:** Add scoped AA-safe styles to `editorial.css` for `.acct-contact-safety-hint` — `background: var(--acct-gold-soft)`; text `color: var(--acct-ink)`; title `color: var(--acct-gold-text)` (5:1, never raw gold); `[data-tone="block"]` a slightly firmer border via `--acct-gold-strong`; rounded `var(--acct-radius-sm)`; transitions gated by `@media (prefers-reduced-motion: reduce)`. NO new tokens.
- [ ] **Step 3:** Manual render confirm (the implementer runs the account dev server or relies on typecheck/lint; full browser is owner-gated). Typecheck + lint the account app for these files.
- [ ] **Step 4: Commit** — scoped to the two files: `git commit -m "feat(account): mount ContactSafetyHint in support thread composer (warm-paper, AA)"`

---

### Task 4: Warm-paper composer re-tone (brass Send)

**Files:** Modify `apps/account/components/support/editorial.css`.

**Context:** The engine renders `ChatComposer` inside `.mt-composer-host`. The composer paints its accent from CSS vars `--composer-accent` / `--composer-accent-deep` (set inline by `toneStyle()` — `account` tone = blue `#1F4ED8`, support thread = `neutral`). The live DOM uses `henryco-composer-shell` / `henryco-composer-input` / `henryco-attach-pill`; the SendButton is `type="button"`. The existing editorial.css composer rules target a STALE `[data-composer-*]` contract and are dormant.

- [ ] **Step 1:** In `editorial.css`, scoped under `.acct-support-room`, override the composer accent vars to brass and ensure dark-ink-on-gold Send (AA):

```css
.acct-support-room .mt-composer-host {
  /* Re-tone the engine-mounted composer to warm-paper brass (overrides toneStyle()'s blue) */
  --composer-accent: var(--acct-gold);
  --composer-accent-deep: var(--acct-gold-strong);
}
/* Send button: dark ink on gold (8.6:1) — NEVER white-on-gold */
.acct-support-room .mt-composer-host [class*="henryco-composer"] button[aria-label],
.acct-support-room .mt-composer-host .henryco-composer-send {
  color: var(--acct-ink);
}
```

(Adjust the exact send-button selector to the real class from `SendButton.tsx` — the implementer confirms it by reading `packages/chat-composer/src/composer/SendButton.tsx` and matching its className; do not invent a selector.)

- [ ] **Step 2:** Confirm the gold/ink pair: `#1A1814` on `#C9A227` = 8.6:1 (AA-LG and AA-normal pass). The focus ring stays `--hc-focus-ring` (gold). Reduced-motion: the composer's send-motion already honors it via chat-composer's `useReducedMotion`; add no unguarded animation.
- [ ] **Step 3:** Typecheck/lint (CSS has no typecheck; lint the file). Verify no `#fff`/`white` introduced on a gold fill (grep the diff).
- [ ] **Step 4: Commit** — `git commit -m "feat(account): warm-paper brass composer re-tone (dark-ink-on-gold Send, AA)"`

---

### Task 5: Server-side contact-safety on the canonical send path

**Files:** Create `apps/account/app/api/support/reply/screen-reply.ts`; Modify `apps/account/app/api/support/reply/route.ts`.

**Context:** Defense-in-depth — the client hint is bypassable, so the server must enforce. The reply route currently persists the body via the support API. Add a contact-safety screen BEFORE persist.

**Interfaces:**
- Produces: `export function screenReplyBody(text: string): { action: "allow" | "mask" | "block"; body: string }` (composes `contactSafety`; for `mask`, returns the masked body; for `block`, the caller rejects with the `contact_blocked` reason).

- [ ] **Step 1: Write the failing test** — `apps/account/app/api/support/reply/__tests__/screen-reply.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { screenReplyBody } from "../screen-reply";

test("clean body passes through unchanged", () => {
  assert.deepEqual(screenReplyBody("is it available?"), { action: "allow", body: "is it available?" });
});
test("a phone number is blocked (never persisted)", () => {
  assert.equal(screenReplyBody("call 0801 234 5678").action, "block");
});
test("a handle is masked in the persisted body", () => {
  const r = screenReplyBody("follow @jane_doe");
  assert.equal(r.action, "mask");
  assert.ok(!r.body.includes("@jane_doe"));
});
```

Run (red): `pnpm --filter @henryco/account exec tsx --test app/api/support/reply/__tests__/screen-reply.test.ts` → FAIL.

- [ ] **Step 2: Implement** — `screen-reply.ts`:

```ts
import { contactSafety } from "@henryco/contact-safety";

export function screenReplyBody(text: string): { action: "allow" | "mask" | "block"; body: string } {
  const verdict = contactSafety(text);
  if (verdict.action === "block") return { action: "block", body: text };
  if (verdict.action === "mask") return { action: "mask", body: verdict.maskedText };
  return { action: "allow", body: text };
}
```

- [ ] **Step 3: Run green** → PASS.
- [ ] **Step 4: Wire into `route.ts`** — after parsing the reply body and BEFORE the DB insert, call `const screened = screenReplyBody(body);` → if `screened.action === "block"` return a 422 JSON `{ ok: false, reason: "contact_blocked" }` (surface localizes); else persist `screened.body`. Do not alter any other behavior (auth, thread ownership, attachments, mark-read). Money-safe (no payment touch).
- [ ] **Step 5: Commit** — scoped to `route.ts` + `screen-reply.ts` + the test: `git commit -m "feat(account): server-side contact-safety on /api/support/reply (block before persist, mask medium)"`

---

### Task 6: Support inbox deep-link

**Files:** Modify `packages/data/src/inbox-aggregate.ts`.

- [ ] **Step 1: Write the failing test** — add to `packages/data/` test suite (or create one) asserting the support branch row `href` is `/support/${id}` not `/support`. (If `@henryco/data` has no test harness, add a focused `tsx --test` over a small pure mapper extracted from the support branch.)
- [ ] **Step 2:** Change the support-branch row builder: `href: "/support"` → `href: \`/support/${row.id}\``. Leave marketplace (`/marketplace`), jobs (`/jobs`), studio (`/studio`) UNCHANGED — their per-thread deep-links land in WS-4/WS-5 (those stores need conversation-id routing first). Keep the customer-scoped + 200-not-500 (empty-on-missing-env) contract intact.
- [ ] **Step 3: Run green** → PASS.
- [ ] **Step 4: Commit** — `git commit -m "feat(data): support inbox rows deep-link to /support/{id} (close the support deep-link gap)"`

---

### Task 7: Remove orphaned inbox dead code

**Files:** Delete `apps/account/components/messages-inbox/InboxHero.tsx`; Modify `apps/account/components/messages-inbox/editorial.css` (remove the dead `__hero*` block).

- [ ] **Step 1:** Grep-confirm `InboxHero` has no live importer (`grep -rn "InboxHero" apps/account` → only the file itself + an unrelated doc-comment). Delete `InboxHero.tsx`.
- [ ] **Step 2:** Remove the `.acct-inbox__hero*` / `__eyebrow*` / `__headline` / `__blurb` / `__hero-tile*` / `__hero-side*` / `__mix-*` rules from `messages-inbox/editorial.css` (the page uses the shared `HeroCard` / `acct-hero__*` from dashboard-shell, not these). Keep `.acct-inbox__chip*`, `.acct-inbox__list`/`__row*`, `.acct-inbox__empty*` (live).
- [ ] **Step 3:** Typecheck + lint + `pnpm --filter @henryco/account build` (or at least typecheck) to confirm nothing references the removed symbol/classes.
- [ ] **Step 4: Commit** — `git commit -m "chore(account): remove orphaned InboxHero + dead __hero* CSS"`

---

### Task 8: Register `/messages` in the a11y audit

**Files:** Modify `scripts/a11y/route-manifest.mjs`.

- [ ] **Step 1:** In the `account` entry's `routes` array, append `{ path: "/messages", name: "messages", auth: true }`.
- [ ] **Step 2:** Run `node scripts/a11y/gate.mjs --dry-run` (the CI gate form) — confirm exit 0 (the dry-run prints the decision; the full audit runs nightly with the recorded auth storageState). Run `pnpm a11y:contrast` to confirm no accent regression.
- [ ] **Step 3: Commit** — `git commit -m "chore(a11y): register account /messages route in the audit manifest"`

---

### Task 9: WS-2 gate

**Files:** none; verification only.

- [ ] **Step 1:** Run the touched-scope suites + typechecks:
```bash
pnpm --filter @henryco/i18n exec tsx --test src/__tests__/messaging-copy.test.ts
pnpm --filter @henryco/account exec tsx --test components/messages/__tests__/contact-safety-hint.test.ts app/api/support/reply/__tests__/screen-reply.test.ts
pnpm --filter @henryco/account typecheck
pnpm --filter @henryco/account lint
node scripts/i18n-check.mjs --strict   # no new hardcoded GAP (the hint copy is routed)
```
- [ ] **Step 2:** AA verification (manual, by token math): hint `--acct-ink` on `--acct-gold-soft` ✓; Send `--acct-ink #1A1814` on `--acct-gold #C9A227` = 8.6:1 ✓; title `--acct-gold-text #8A6F00` on cream = 5:1 ✓. Grep the diff: no `#fff`/`white` on a gold fill.
- [ ] **Step 3:** Money-safety grep over the WS-2 diff (no payment tokens). Confirm the support thread now: (a) renders the brass composer, (b) shows the contact-safety hint on phone/email/handle input, (c) `/api/support/reply` blocks high/critical server-side.
- [ ] **Step 4: Commit** — `git commit --allow-empty -m "chore(ws-2): gate green — editorial composer + contact-safety UX + messaging-copy, AA + money-safe"`

---

## Self-Review (against the spec WS-2 scope)

**Spec coverage:** §4.4 editorial surface (composer re-tone T4 + hint T2/T3; inbox/thread already editorial); §4.3 contact-safety UX (client hint T2/T3 + server enforcement T5); §4.6 cross-locale (messaging-copy T1, ig/yo/ha/hi EN-fallback); §6.5 accessibility (AA tokens throughout, a11y registration T8, reduced-motion); deep-link (T6 support branch). Marketplace/jobs/studio deep-links + unread + their server-side enforcement are explicitly deferred to WS-3/4/5 (noted in T6).

**Placeholder scan:** the trickiest selector (the real Send button class in T4) is explicitly deferred to the implementer reading `SendButton.tsx` rather than an invented selector — flagged, not guessed. All copy + helpers + route logic show full code.

**Type consistency:** `contactSafetyHintState(text, copy)` (T2) consumes `MessagingCopy["contactSafety"]` (T1); `ContactSafetyHint` passes `ctx.draft` (the engine's `composerExtras` ctx field) to it (T3); `screenReplyBody` (T5) returns the same `action` union as `contactSafety`.

## Execution
Subagent-driven (the established WS-1 pattern): fresh implementer + Opus reviewer per task, two-stage review, then a final whole-branch review and the finishing-a-development-branch decision.
