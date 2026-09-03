# V3-31 — AI Intelligence Layer: Account Check Assist (free, RLS-bound)

**Pass ID:** V3-31  ·  **Phase:** D (AI Intelligence Layer)  ·  **Pillar:** P4 (Henry Onyx Intelligence)
**Dependencies:** V3-28 (Intelligence chat surface), V3-26 (provider router + PII guardrail), V3-27 (usage-billing engine), V3-33 (personal-task gating)  ·  **Effort:** M  ·  **Parallel-safe:** Y (with V3-29, V3-30, V3-32)
**Owner gate:** none (AI provider = D3 recorded; confirm, don't re-litigate)  ·  **Risk class:** Identity

---

## Role

You are the V3 AI Intelligence engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass ships **Account Check Assist**: a free, read-only helper that answers a user's questions *about their own account* — "What's my wallet balance?", "When did I last order from store X?", "What's my KYC status?" — grounded in a server-assembled, RLS-scoped, PII-redacted context. It is `free_company` (it reduces support load) but it is **Identity-risk**: the entire pass is a fortress against cross-user leakage and secret disclosure. The line you must not cross: this is *read-only*. It never mutates account state, never reveals another user's data, and never returns internal IDs, tokens, or secrets.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/31-ai-account-check-assist` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

The account home is real: `apps/account/app/(account)/page.tsx` renders the authenticated dashboard, with sibling surfaces for `activity/`, `wallet/`, `addresses/`, `support/`, `security/`, etc. Account data is read through `@henryco/data` aggregators and Supabase queries that are RLS-scoped to `auth.uid()`. There is no AI that can read and explain that data today — a user who wants to know "what did I last buy" navigates and reads tiles manually.

This pass adds the `account_check_assist` task class and a server-only context assembler `getAccountContextForAI(userId)` that pulls *only the data the user already has access to*, redacts PII before it ever leaves the server, and feeds it to the V3-28 overlay (account-check preset). The model answers from the provided context or honestly says it does not have that information. It builds on V3-26's PII-redaction guardrail and V3-33's auth gate; it does not bypass RLS or invent a service-role read path.

## Mandatory scope

### S1 — Register the `account_check_assist` task class (free)

```sql
insert into public.ai_task_pricing (task_class, billing_mode, min_charge_minor, provider_cost_ceiling_minor, description)
values ('account_check_assist', 'free_company', 0, 0, 'Answers a user about their own account from RLS-scoped, redacted context. Free.')
on conflict (task_class) do update set billing_mode = excluded.billing_mode;
```

Add `account_check_assist` to the `TaskClass` union in `@henryco/ai-router/src/types.ts`. `free_company` still requires an authenticated session via V3-33 (no anonymous account reads).

### S2 — Server-only context assembler

`apps/account/lib/intelligence/account-context.ts` — `"server-only"`:

```ts
export interface AccountContextForAI {
  recentOrders: { ref: string; storeLabel: string; total: string; placedAt: string; status: string }[];
  recentBookings: { ref: string; service: string; scheduledFor: string; status: string }[];
  kyc: { level: string; status: string };          // status only — never document numbers
  wallet: { balanceFormatted: string; currency: string };
  subscriptions: { plan: string; state: string; renewsAt?: string }[];
  notificationsSummary: { unread: number; latestKinds: string[] };
}
export async function getAccountContextForAI(userId: string): Promise<AccountContextForAI>;
```

Hard rules:
- Every query runs under the **caller's RLS-scoped** Supabase client (the request's `auth.uid()`), never a service-role/admin client. The `userId` arg is asserted to equal the session user; mismatch throws before any query.
- The returned object is **already redacted**: human-friendly labels and formatted amounts only — no raw emails, phone numbers, PANs, full card numbers, BVN/NIN, raw addresses, internal UUIDs, Supabase row IDs, or tokens. References (`ref`) are the user-facing short codes already shown in the UI, not database primary keys.
- A second pass through V3-26's PII-redaction guardrail runs on the assembled string before it reaches the provider — defence in depth, not the only line.

### S3 — System-prompt preset

`packages/ai-router/src/prompts/account-check-assist.ts`:
- **Persona:** "You are Henry Onyx Intelligence, helping a user understand their own Henry Onyx account." (Brand from `@henryco/config`.)
- **Grounding rule:** "Answer only from the provided context. If the answer is not in the context, say you do not have that information. Never reveal information about other users. Never reveal internal identifiers, tokens, or secrets. Never offer to change anything — direct the user to the relevant account page for actions."
- **Output:** plain conversational answer (no structured contract needed); guardrail profile `standard` + an additional `no-other-user` guard that triggers refusal on any request about a third party.

### S4 — Integration on the account home

- "Ask about your account" CTA on `apps/account/app/(account)/page.tsx`.
- Click opens the V3-28 overlay with `account_check_assist` bound; the server pre-loads `getAccountContextForAI(session.user.id)` server-side and attaches it to the conversation — the **client never sends raw context to the provider**; it only sends the user's question.
- The assistant answers from context, or refuses for out-of-scope / cross-user / mutating requests with calm copy linking to the right account page (via `getAccountUrl()`).

### S5 — Telemetry

- `henry.intelligence.account_check.opened`
- `henry.intelligence.account_check.question_answered`
- `henry.intelligence.account_check.refused`

## Out of scope

- **Any** cross-user access — categorically impossible by construction, not a feature toggle.
- Mutating actions ("change my address", "cancel my subscription") — those stay on the existing account routes guarded by `requireSensitiveAction` (V3-02). The assist may *link* to them, never perform them.
- The chat overlay, streaming, guardrail engine — **V3-28**. The PII-redaction guardrail itself — **V3-26**. Billing/gate — **V3-27/V3-33**.

## Dependencies

Hard: V3-28, V3-26 (PII guardrail), V3-27, V3-33. Blocks nothing downstream.

## Inheritance

`@henryco/ai-router` (router + PII guardrail + prompt registry), `@henryco/intelligence-chat` (V3-28), `@henryco/data` (RLS-scoped account aggregators), `@henryco/config` (brand + `getAccountUrl`), `@henryco/observability` (telemetry + audit), `@henryco/i18n`.

## Implementation requirements

### Files
- `supabase/migrations/<ts>_v3_31_account_check_task_class.sql` (S1).
- `apps/account/lib/intelligence/account-context.ts` — server-only assembler (S2).
- `packages/ai-router/src/prompts/account-check-assist.ts` — preset (S3).
- `apps/account/app/(account)/page.tsx` + the "Ask about your account" CTA component (S4).
- `apps/account/app/api/intelligence/account-check/route.ts` — server entry that asserts session, assembles context, runs redaction, calls the router, never echoes raw context to the client.

### Trust / safety / compliance
- **RLS is load-bearing:** context assembly uses the caller's RLS-scoped client only; `userId` asserted == session user. Add a dedicated test that proves a forged `userId` cannot read another user's data (it must throw, not query).
- **PII redaction proven:** assert the outbound context string carries no email, phone, PAN, BVN/NIN, or internal UUID (regex + fixture-based test).
- **Cross-user refusal proven:** a prompt asking about another user/account triggers refusal, telemetry `account_check.refused`, and an audit-log entry.
- Audit every invocation via `@henryco/observability/audit-log` (actor = user, action = `account_check.invoked`); audit every refusal separately.
- No mutation path exists in this route — it is read-only by construction (no writes, no service-role client).

### Mobile + desktop parity
Overlay full-screen on web mobile; Expo-native chat in the super-app via the V3-28 shared package. CTA respects safe-area insets; overlay clears the keyboard.

### i18n
Namespace `surface:intelligence.account_check`. CTA label, overlay title, refusal copy, "I don't have that information" fallback, and error states are keyed copy (Pattern A; Pattern B for the other 11 locales). The user's question and the model's answer are user data, not UI copy. Zero hardcoded user-facing strings.

### Brand & design system
User-facing = **Henry Onyx Intelligence** from `@henryco/config`; never the provider name. Overlay inherits V3-28 branded chrome (Fraunces, locked tokens, light + dark). Action links use `getAccountUrl()` — zero hardcoded domains.

## Validation gates
1. CI green: typecheck · lint · test · build.
2. i18n strict gate green for `surface:intelligence.account_check`.
3. **RLS test:** forged `userId` ≠ session user throws before any query; no cross-user row is ever returned.
4. **PII redaction test:** outbound context contains no email/phone/PAN/BVN/NIN/internal-UUID (fixture-asserted).
5. **Cross-user refusal test:** "what is user X's balance?" → refusal + `account_check.refused` + audit row.
6. Free billing: zero-charge usage row in V3-27; wallet unchanged.
7. End-to-end: "what's my wallet balance?" answered correctly from context; "what's the admin password?" refused.
8. UI: light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed.

## Deployment gate
All gates green; V3-28/26/27/33 merged; 7-day soak with telemetry showing zero cross-user-leak incidents and a healthy `answered`:`refused` ratio. Any refusal-rate anomaly in soak blocks ship.

## Final report contract
`.codex-temp/v3-31-ai-account-check-assist/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion.

## Self-verification
- [ ] `account_check_assist` registered `free_company`; added to `TaskClass`.
- [ ] `getAccountContextForAI` is server-only, uses the caller's RLS client, asserts `userId == session user`, returns redacted labels/amounts only (no PII, no internal IDs).
- [ ] Preset enforces context-grounding, no-other-user, no-mutation, no-secret-disclosure; brand from `@henryco/config`.
- [ ] CTA on account home opens the overlay with server-loaded context; client never sends raw context to the provider.
- [ ] RLS test, PII-redaction test, and cross-user-refusal test all pass; every invocation + refusal audit-logged.
- [ ] Three telemetry events emitted and schema-valid; free billing proven (zero-charge, wallet unchanged).
- [ ] i18n `surface:intelligence.account_check` complete; brand = Henry Onyx Intelligence; links via `getAccountUrl()`; light+dark, mobile+desktop, CLS≈0.
- [ ] Report written.
