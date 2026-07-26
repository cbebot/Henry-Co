# Studio Build Agent — Executor (E1) reference implementation

**Pass:** SA-2 · This directory is the **canonical source for the dedicated
executor repo** — it is committed here for review and version control, and
copied into a **separate, private GitHub repository** (never the monorepo) to
run. See [ARCHITECTURE §2.2](../ARCHITECTURE.md#2-the-build-agent-runtime).

## The one invariant

**The runner holds ZERO production credentials.** Its environment carries
exactly three secrets, none of which authenticate to Henry Onyx production:

| Secret | What it is | What it can reach |
|---|---|---|
| `BUILD_AGENT_ANTHROPIC_KEY` | a **dedicated** provider key, independently rate-limited + revocable, separate from the ecosystem key | the model provider only |
| `AGENCY_CALLBACK_SECRET` | the HMAC secret shared with the studio callback | signs heartbeats + the report |
| _(the signed spec-fetch URL)_ | passed as a `workflow_dispatch` input, not a stored secret; short-TTL | reads exactly one job's frozen spec |

There is **no** Supabase key, **no** `PAYMENTS_DATABASE_URL`, **no** Postmark
token, **no** Vercel token, **no** GitHub token in the runner. The agent cannot
reach the product database, the ledger, or any live secret **because it holds
nothing that authenticates to them** — the isolation is structural, not a
policy the agent is trusted to honour.

## Flow

1. The studio orchestrator dispatches `workflow_dispatch` with inputs
   `{ job_id, attempt, spec_fetch_url }` (the fine-grained `actions:write`
   token scoped to THIS repo only lives on the orchestrator, never here).
2. `run.mjs` GETs the frozen `BuildJobSpec` over the signed URL (already
   PII-scrubbed by the orchestrator).
3. The **caps harness** runs the agent, counting provider cost after every
   call and **killing the run** at `maxProviderCostKobo`, `maxWallClockMinutes`,
   or `maxModelCalls` — whichever trips first. Budget enforcement does **not**
   depend on the agent's cooperation.
4. Heartbeats (`stage`, `costSoFarKobo`, monotonic `seq`, first-beat `runRef`)
   POST to the callback, HMAC-signed `${timestamp}.${body}`.
5. The final `BuildJobReport` (outcome + inline Track-1 bundle +
   `contentHash` + usage + redacted log) POSTs to the callback, HMAC-signed.

The orchestrator verifies the HMAC, the monotonic sequence, the timestamp
window, and — for the bundle — that the claimed `contentHash` matches what it
recomputes. Nothing the runner returns is trusted until those checks pass, and
nothing it returns can deploy: the artifact faces QA and two human reviews
before anything goes live.

## Files

- `build.yml` — the `workflow_dispatch` workflow (runs on an ephemeral runner).
- `run.mjs` — the caps harness + agent loop + heartbeat/report signer.
- `package.json` — dependency-light (only `@anthropic-ai/sdk`); no monorepo deps.

## Provider opacity

The agent's output is scanned client-side by the orchestrator's QA gate
(`provider_opacity`), but the runner also renders the bundle with **no provider
or model string** — the bundle schema has no field that can carry one, and the
agent prompt forbids self-identification. Internal logs may name the model;
the **client-visible artifact never does**.
