#!/usr/bin/env node
// SCHEMA-TRUTH-01 — generate docs/v3/fl2-apply-manifest.md from the evidence:
// classification.json (object evidence vs prod) + manual corrections from the
// deep-dive (storage-policy key artifact, multi-column ALTERs, data-only files,
// partial applies) + the per-table code-reader counts.
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const classification = JSON.parse(readFileSync(join(HERE, "classification.json"), "utf8"));

/** file-suffix → { v: verdict override, n: note } from the manual deep-dive. */
const CORRECTIONS = {
  "20260408120000_hq_internal_comms_attachments_visibility_rls.sql": { v: "applied", n: "all objects verified in prod (incl. the 4 storage.objects policies — classifier key artifact)" },
  "20260505090000_marketplace_checkout_payment_completion.sql": { v: "applied", n: "multi-column ALTER; all 8 columns live in prod (out-of-band, no history row)" },
  "20260501130000_notification_realtime_publication.sql": { v: "applied", n: "customer_notifications is published; landed as history row 20260523073251" },
  "20260523190000_realtime_publication_backfill.sql": { v: "partially-applied", n: "customer_notifications third is live (history 20260523073251); the rooms_messages/rooms_participants thirds wait on the rooms family (tables absent)" },
  "20260503120500_studio_client_portal_seed.sql": { v: "applied (data-only)", n: "seed rows verified live (studio_settings keys present)" },
  "20260602120000_v3_division_name_brand_fix.sql": { v: "applied (data-only)", n: "content rebrand executed on prod CMS rows; reads additionally guarded by toBrandName (#192)" },
  "20260529120000_payment_intents.sql": { v: "FL2", n: "money core: intents + attempts + processed_webhooks + guarded RPCs" },
  "20260605123000_payments_private_isolation.sql": { v: "FL2", n: "money writers relocated into non-exposed payments_private" },
  "20260607120000_double_entry_ledger.sql": { v: "FL2", n: "the auditable money spine (V3-17)" },
  "20260607130000_v3_18_payment_documents.sql": { v: "FL2", n: "NARROWED by SCHEMA-TRUTH-01: receipts system only — the minor-shaped customer_invoices collided with the LIVE legacy table" },
  "20260607140000_v3_vat_01_settlement_vat.sql": { v: "FL2", n: "output VAT + fee VAT on the ledger (V3-VAT-01)" },
  "20260611120000_fl2_wallet_rail_completion.sql": { v: "FL2", n: "NEW (SCHEMA-TRUTH-01): wallet-rail dependency closure for the merged Job B surfaces" },
  "20260403183000_account_integration_hardening.sql": { v: "partially-applied", n: "customer_preferences/care_bookings/notification/security columns are live; funding+payout tables extracted VERBATIM to the FL2 completion file; referrals/trust/interview tables remain backlog" },
  "20260406140000_wallet_withdrawals.sql": { v: "partially-applied", n: "withdrawal_pin_hash column is live; the withdrawal-requests table extracted VERBATIM to the FL2 completion file" },
  "20260407190000_account_webhook_receipts.sql": { v: "superseded", n: "not applied; extracted VERBATIM into the FL2 completion file" },
  "20260407193000_idempotency_and_nonce_scope.sql": { v: "partially-superseded", n: "account_idempotency_keys extracted to the FL2 completion file; the hq nonce-index swap (global → per author+thread) is still unapplied — messaging-correctness backlog ticket" },
  "20260402235500_workspace_staff_platform.sql": { v: "not-applied", n: "only the trigger fn exists in prod (out-of-band residue); all 10 workspace_* tables absent — hub internal-comms access + owner DM route read them (live-risk)" },
  "20260405150000_logistics_customer_surface.sql": { v: "partially-applied", n: "11 of 12 tables live; logistics_tracking_points absent (read by apps/logistics/lib/logistics/data.ts)" },
  "20260405120000_super_app_core.sql": { v: "partially-applied", n: "profiles + handle_new_user trigger are live; divisions + contact_submissions absent (read only by the dormant super-app adapter/seed)" },
};

const FAMILY_RULES = [
  [/rooms_/, "rooms (interview/live rooms)"],
  [/care_(garment|user_pref|recurring|claims|pod|booking|realtime)/, "care feature wave (2026-05-15)"],
  [/jobs_(taxonomy|skill|interview_rooms|offer|salary|pipeline|realtime)/, "jobs feature wave (2026-05-15)"],
  [/property_(amenities|floorplans|virtual|neighborhood|saved_searches|inspection|rent|maintenance|viewings|realtime)/, "property feature wave (2026-05-15)"],
  [/logistics_(quotes|shipment_legs|pod|claims|fleet|b2b|realtime)/, "logistics feature wave (2026-05-14)"],
  [/studio_(proposal_signatures|revisions_versioning|milestone_extensions|payment_plans|resource_allocations|asset_packs|realtime)/, "studio feature wave (2026-05-14)"],
  [/learn_v3_pass21/, "learn pass-21 player wave (2026-05-15)"],
  [/workspace_staff_platform/, "workspace staff platform"],
];

const familyOf = (file) => (FAMILY_RULES.find(([re]) => re.test(file)) ?? [null, "other"])[1];

const rows = classification.map((x) => {
  const base = x.file.split("/").pop();
  const corr = CORRECTIONS[base];
  let verdict = corr?.v;
  if (!verdict) {
    verdict = {
      "applied-by-evidence": "applied",
      "applied-history-only": "applied",
      "absent-from-prod": "backlog",
      "NO-EVIDENCE": "backlog",
      PARTIAL: "partially-applied",
    }[x.verdict];
  }
  const evidence = corr?.n ?? (
    x.verdict === "applied-by-evidence" ? `object evidence (+${x.present})${x.history ? "; history " + x.history.split(":")[0] : " — out-of-band, no history row"}`
    : x.verdict === "applied-history-only" ? `history row ${x.history.split(":")[0]} (constraint/policy/index-only file)`
    : x.verdict === "absent-from-prod" ? `none of its ${x.absent} object(s) exist in prod`
    : "publication/realtime file for an absent family"
  );
  return { file: x.file, base, verdict, evidence, family: familyOf(base) };
});

// the new completion file isn't in classification.json — append it
rows.push({
  file: "apps/hub/supabase/migrations/20260611120000_fl2_wallet_rail_completion.sql",
  base: "20260611120000_fl2_wallet_rail_completion.sql",
  verdict: "FL2",
  evidence: CORRECTIONS["20260611120000_fl2_wallet_rail_completion.sql"].n,
  family: "money",
});

const counts = {};
for (const r of rows) counts[r.verdict] = (counts[r.verdict] ?? 0) + 1;

const fl2Order = [
  ["20260529120000_payment_intents.sql", "apps/hub/supabase/tests/payments_grant_invariant.sql"],
  ["20260605123000_payments_private_isolation.sql", null],
  ["20260607120000_double_entry_ledger.sql", "apps/hub/supabase/tests/ledger_invariants.sql + ledger_grant_invariant.sql"],
  ["20260607130000_v3_18_payment_documents.sql", "apps/hub/supabase/tests/payment_documents_invariants.sql"],
  ["20260607140000_v3_vat_01_settlement_vat.sql", "apps/hub/supabase/tests/vat_invariants.sql + vat_grant_invariant.sql"],
  ["20260611120000_fl2_wallet_rail_completion.sql", null],
];

const table = (rs) =>
  ["| migration | status | evidence |", "|---|---|---|",
    ...rs.map((r) => `| \`${r.file.replace("supabase/migrations/", "…/")}\` | ${r.verdict} | ${r.evidence} |`)].join("\n");

const backlog = rows.filter((r) => r.verdict === "backlog");
const families = {};
for (const r of backlog) (families[r.family] ??= []).push(r);

const READER_NOTES = {
  "rooms (interview/live rooms)": "packages/rooms/src/server/actions.ts reads all six rooms_* tables; 2 baseline drift entries (rooms_sessions.kind/.status)",
  "care feature wave (2026-05-15)": "live API readers: /api/care/pod, /api/care/track, /api/care/recurring, /api/care/claims, /api/care/preferences/garments + recurring-auto-book automation",
  "jobs feature wave (2026-05-15)": "live API readers: jobs-alerts cron, /api/jobs/salary, /api/jobs/verifications/skill, interview-room + offer-letter libs",
  "property feature wave (2026-05-15)": "no direct .from() readers found (pages read via views/joins not present) — lowest live-risk of the waves",
  "logistics feature wave (2026-05-14)": "live staff-page readers: dispatcher/manager fleet, manager claims, owner business/calendar + /api/logistics/{quote,book,dispatch,pod,claims}",
  "studio feature wave (2026-05-14)": "live API readers: /api/studio/asset-packs/generate, /api/studio/proposals/sign (+2 baseline drift entries)",
  "learn pass-21 player wave (2026-05-15)": "no direct .from() readers found in the scan",
  "workspace staff platform": "apps/hub internal-comms access + owner DM/members routes read workspace_staff_memberships/workspace_division_memberships TODAY",
  other: "",
};

const md = `# FL2 apply manifest — the authoritative migration ledger

**Produced by:** SCHEMA-TRUTH-01 (2026-06-11) · **Method:** read-only introspection of
production (\`supabase/prod-actual/schema.sql\`, captured by
\`scripts/db/introspect-prod-schema.mjs\` — zero prod DDL) + object-evidence
classification of every committed migration file + a full dress rehearsal on the
prod-actual shadow (\`scripts/db/build-shadow-db.mjs\`).

**Why this document exists:** prod's migration history (75 rows in
\`supabase_migrations.schema_migrations\`) does **not** map 1:1 to the ${rows.length - 1}
committed migration files. Early files were applied under consolidated dashboard
runs with different names/versions; several were applied **out-of-band with no
history row at all**; four were applied **partially**; and a large 2026-05-14/15
feature wave was never applied. Filename ↔ history matching is therefore
unreliable — every verdict below is grounded in **object evidence** (does prod
actually hold the tables/columns/functions/policies the file creates?), checked
against the introspected snapshot.

**Counts:** ${Object.entries(counts).map(([k, v]) => `${k} = ${v}`).join(" · ")} (of ${rows.length} files incl. the new completion file).

---

## 1. THE FL2 APPLY LIST (execute in this exact order)

FL2 applies these six migrations to production, in order, as \`postgres\`
(dashboard SQL editor or \`supabase migration up\`), recording a history row per
file. Each row notes the CI invariant suite that must pass at that position —
**suite position is part of the contract** (the payments grant invariant asserts
on the public RPCs *before* the isolation migration relocates them).

| # | migration | invariant suite at this position |
|---|---|---|
${fl2Order.map(([f, s], i) => `| ${i + 1} | \`apps/hub/supabase/migrations/${f}\` | ${s ? `\`${s}\`` : "—"} |`).join("\n")}

**Rehearsal proof:** the full set applies cleanly on the prod-actual shadow,
**twice** (idempotency, second pass with money fixture data present), with all
six suites green at their CI positions. Re-run anytime:

\`\`\`
node scripts/db/build-shadow-db.mjs all --prod-types <prod types> --prod-columns <csv> --prod-acl <csv>
\`\`\`

**After FL2 lands:** regenerate \`packages/data/src/database.types.ts\` from prod
(\`pnpm dlx supabase gen types typescript --project-id rzkbgwuznmdxnnhmjazy --schema public\`)
— it must byte-match the committed composite (modulo the \`__InternalSupabase\`
header block). A mismatch means prod drifted again.

### Findings folded into the list

- **V3-18 was narrowed** (this pass): prod carries a LIVE legacy
  \`customer_invoices\` (kobo-shaped, rows written daily). The original draft's
  minor-shaped table under the same name silently no-op'd its CREATE and then
  failed its constraint blocks (\`column "source_kind" named in key does not
  exist\` — caught by the shadow rehearsal). The migration now ships the
  **receipts system only**; its invoice writer had zero application callers.
  Ledger-tied invoice issuance returns as its own pass with a legacy-table
  reconciliation design.
- **The wallet-rail completion file is new** (this pass): the merged Job B
  surfaces (/api/wallet/fund, topup/init, funding-proof, withdrawal/request,
  payout-methods, account idempotency + webhook receipts) read five tables that
  the partially-applied April files never landed on prod. Without them FL2
  lights the card rail while its sibling tables are missing. The file is a
  verbatim, idempotent extraction of exactly the missing objects.

---

## 2. Applied on production (${counts["applied"] + counts["applied (data-only)"]} files)

Verified by object evidence against the introspected snapshot (and/or a history
row). These files are **history — never edit, never re-apply**.

${table(rows.filter((r) => r.verdict.startsWith("applied")))}

---

## 3. Partially applied / superseded (${counts["partially-applied"] + (counts["superseded"] ?? 0) + (counts["partially-superseded"] ?? 0)} files)

Prod holds **part** of these files (out-of-band partial applies). They stay in
the tree untouched as historical record. Their missing **money-path** objects
were extracted verbatim into \`20260611120000_fl2_wallet_rail_completion.sql\`
(FL2 #6); their remaining non-money objects are backlog (§4). Do NOT re-apply
these files wholesale — they predate newer prod state (policies, constraint
reconciles) and could regress it.

${table(rows.filter((r) => ["partially-applied", "superseded", "partially-superseded", "not-applied"].includes(r.verdict)))}

---

## 4. Committed-not-applied feature backlog (${counts["backlog"]} files) — NOT part of FL2

The 2026-05-14/15 division feature wave + rooms. None of their objects exist in
prod. **FL2 must not apply these** — each family ships with its own feature
pass, after a prod-shape rehearsal (\`build-shadow-db.mjs\` pattern), or gets
archived by owner decision. Until then, code paths that read these tables fail
at runtime on prod (silently or 500) — the live-risk notes below feed the
drift-triage (PASS-REGISTER tickets).

${Object.entries(families).map(([fam, rs]) => `### ${fam} (${rs.length} file${rs.length > 1 ? "s" : ""})

*Live readers today:* ${READER_NOTES[fam] || "—"}

${rs.map((r) => `- \`${r.file}\``).join("\n")}`).join("\n\n")}

---

## 5. Standing rules this manifest encodes

1. **Object evidence outranks history naming** — prod was modified out-of-band;
   never classify a migration by filename/history alone.
2. **Never edit or re-apply an applied file.** Forward-fix with a new file.
3. **Committed-not-applied files are editable** (they are not history) — that is
   how V3-18 was narrowed safely.
4. **Every future FL-gate apply list must be rehearsed on the prod-actual
   shadow first** (\`scripts/db/introspect-prod-schema.mjs\` to refresh the
   snapshot → \`scripts/db/build-shadow-db.mjs\` to rehearse). The two defects
   this pass caught (live-table name collision; trigger-chain NOT NULL) are
   invisible on a fresh-DB proof.
5. **After any prod apply, regenerate the types and re-baseline the drift
   guard** so the declared schema stays true.
`;

writeFileSync(join(ROOT, "docs", "v3", "fl2-apply-manifest.md"), md, "utf8");
console.log("wrote docs/v3/fl2-apply-manifest.md");
console.log(Object.entries(counts).map(([k, v]) => `${k}=${v}`).join("  "));
