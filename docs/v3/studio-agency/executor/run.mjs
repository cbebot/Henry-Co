// Studio Build Agent — the caps harness + agent loop + signed callbacks.
// Runs in the DEDICATED executor repo's ephemeral runner. Dependency-light.
//
// The harness enforces the caps OUTSIDE the model: it counts provider cost
// after every call and kills the run at the first breached ceiling. The agent
// cannot spend past its envelope even if it tries.
//
// HMAC scheme is byte-compatible with the studio verifier:
//   signature = hex(HMAC_SHA256(secret, `${timestamp}.${body}`))
//   headers:   x-henry-timestamp, x-henry-signature
// plus a MONOTONIC per-(jobId, attempt) sequence number on every heartbeat.

import crypto from "node:crypto";

const JOB_ID = process.env.JOB_ID;
const ATTEMPT = Number(process.env.ATTEMPT || 0);
const SPEC_FETCH_URL = process.env.SPEC_FETCH_URL;
const CALLBACK_SECRET = process.env.AGENCY_CALLBACK_SECRET;
const RUN_REF = process.env.GITHUB_RUN_ID || "";

function sign(body) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = crypto.createHmac("sha256", CALLBACK_SECRET).update(`${timestamp}.${body}`).digest("hex");
  return { timestamp, signature };
}

async function postCallback(callbackUrl, payload) {
  const body = JSON.stringify(payload);
  const { timestamp, signature } = sign(body);
  return fetch(callbackUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-henry-timestamp": timestamp,
      "x-henry-signature": signature,
    },
    body,
  });
}

let seq = 0;
async function heartbeat(callbackUrl, stage, costSoFarKobo, note) {
  seq += 1;
  await postCallback(callbackUrl, {
    kind: "heartbeat",
    jobId: JOB_ID,
    attempt: ATTEMPT,
    seq,
    stage,
    costSoFarKobo,
    note,
    // The runner run id rides the FIRST heartbeat → stored as executor_run_ref.
    runRef: seq === 1 ? RUN_REF : undefined,
  });
}

/**
 * The caps harness. Runs the (placeholder) agent build loop, counting cost
 * after every step. Kills at the first breached ceiling. In the real runner the
 * agent step calls the provider under BUILD_AGENT_ANTHROPIC_KEY and produces
 * the site bundle; here it is a deterministic stub so the harness + contracts
 * are testable without a provider call.
 */
async function runCappedBuild(spec, callbackUrl) {
  const caps = spec.constraints.budget;
  let costKobo = 0;
  const usage = { calls: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, providerCostKobo: 0 };

  await heartbeat(callbackUrl, "starting", 0, "runner up");

  const steps = ["scaffold", "content", "theme", "assemble"];
  for (const step of steps) {
    // --- provider call would happen here (omitted in the reference stub) ---
    usage.calls += 1;
    usage.inputTokens += 2000;
    usage.outputTokens += 1500;
    const stepCostKobo = 50_000; // stand-in per-step cost
    costKobo += stepCostKobo;
    usage.providerCostKobo = costKobo;

    // CAP ENFORCEMENT — kill before the next call if any ceiling is breached.
    if (costKobo >= caps.maxProviderCostKobo) {
      return { outcome: "killed_budget", usage, bundle: null };
    }
    if (usage.calls >= caps.maxModelCalls) {
      return { outcome: "killed_timeout", usage, bundle: null };
    }
    await heartbeat(callbackUrl, step, costKobo, `completed ${step}`);
  }

  // Assemble the site bundle from the brief snapshot (structured content only —
  // no executable code; the schema has no field that could carry any).
  const b = spec.briefSnapshot;
  const bundle = {
    schemaVersion: 1,
    siteName: b.businessType || "Your business",
    tagline: (b.goals || "").slice(0, 120),
    locale: spec.constraints.content.locale || "en",
    theme: { accent: "#0f766e", surface: "#ffffff", ink: "#0b0f14", fontFamily: "sans" },
    sections: [
      { kind: "hero", heading: b.businessType || "Welcome", body: (b.goals || "").slice(0, 400), items: [] },
      { kind: "services", heading: "What we offer", body: "", items: (b.requiredFeatures || []).slice(0, 8) },
      { kind: "about", heading: "About", body: (b.scopeNotes || "").slice(0, 800), items: [] },
      { kind: "contact", heading: "Get in touch", body: "Reach out to start a conversation.", items: [] },
    ],
    domainLabel: b.domainIntent ? b.domainIntent.desiredLabel || null : null,
  };
  return { outcome: "built", usage, bundle };
}

/** Canonical (stable-key) JSON so the hash matches the orchestrator's. */
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value).sort()) out[k] = canonicalize(value[k]);
    return out;
  }
  return value;
}
function hashBundle(bundle) {
  return crypto.createHash("sha256").update(JSON.stringify(canonicalize(bundle))).digest("hex");
}

async function main() {
  if (!JOB_ID || !SPEC_FETCH_URL || !CALLBACK_SECRET) {
    console.error("missing JOB_ID / SPEC_FETCH_URL / AGENCY_CALLBACK_SECRET");
    process.exit(1);
  }
  // Pull the frozen spec over the signed URL (no other credential needed).
  const specRes = await fetch(SPEC_FETCH_URL);
  if (!specRes.ok) {
    console.error("spec fetch failed:", specRes.status);
    process.exit(1);
  }
  const { spec } = await specRes.json();
  const callbackUrl = spec.callbackUrl;

  const result = await runCappedBuild(spec, callbackUrl);

  const report = {
    jobId: JOB_ID,
    attempt: ATTEMPT,
    outcome: result.outcome,
    usage: result.usage,
    qa: { ok: result.outcome === "built", gates: [] },
    log: `run ${RUN_REF} outcome ${result.outcome}`,
  };
  if (result.outcome === "built" && result.bundle) {
    const contentHash = hashBundle(result.bundle);
    report.artifact = { kind: "bundle", ref: contentHash, contentHash, bundle: result.bundle };
  }

  const res = await postCallback(callbackUrl, { kind: "report", ...report });
  if (!res.ok) {
    console.error("report callback failed:", res.status);
    process.exit(1);
  }
  console.log("reported", result.outcome);
}

main().catch((err) => {
  console.error("runner error:", err?.message || "unknown");
  process.exit(1);
});
