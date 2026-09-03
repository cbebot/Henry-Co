/**
 * SA-2 — the build-agent envelope contracts. PURE (no server imports) so the
 * spec/report shapes are shared by the studio orchestrator, the executor
 * reference implementation, and the tests without pulling a runtime.
 *
 * These are the frozen, self-contained hand-offs across the trust boundary:
 * the orchestrator renders a `BuildJobSpec` (the agent never reads production
 * data — the spec IS its whole input), and the executor returns a
 * `BuildJobReport` over the HMAC callback. Host-agnostic: E1 (GitHub Actions)
 * and a future E2 (managed sandbox) exchange these exact shapes; only the
 * spawn adapter differs.
 *
 * See docs/v3/studio-agency/ARCHITECTURE.md §2.3 / §2.5.
 */

export const BUILD_TRACKS = ["bundle", "codegen"] as const;
export type BuildTrack = (typeof BUILD_TRACKS)[number];

/**
 * The frozen brief snapshot handed to the sandbox. Contact PII is scrubbed at
 * render time (SAFETY-MODEL §3, the redactChatText idiom) — the agent builds a
 * site, it never needs who to email. Everything here is client business data
 * the client already gave us for exactly this purpose.
 */
export type StudioBriefSnapshot = {
  briefId: string;
  serviceKind: string;
  /** template | agency — the SA-1 discriminator; only `template` is buildable in SA-2. */
  briefClass: "template" | "agency";
  businessType: string;
  goals: string;
  scopeNotes: string;
  requiredFeatures: string[];
  pageRequirements: string[];
  designDirection: string;
  /** Domain WANT only — never a registrar action (that spends money; stays human). */
  domainIntent: { path: "new" | "have" | "later"; desiredLabel: string } | null;
};

export type BuildJobSpec = {
  /** uuid; the correlation key for EVERYTHING — audit, usage, ledger, logs. */
  jobId: string;
  attempt: number;
  briefSnapshot: StudioBriefSnapshot;
  /** §2.6 — SA-2 only ever emits "bundle" (Track 1). "codegen" is SA-2b. */
  track: BuildTrack;
  constraints: {
    budget: {
      maxProviderCostKobo: number;
      maxWallClockMinutes: number;
      maxModelCalls: number;
    };
    /** Allowed stack (codegen) / pinned template version (bundle). */
    tech: string[];
    content: { locale: string; toneRules: string };
  };
  /** studio /api/agency/executor-callback — where heartbeats + the report POST. */
  callbackUrl: string;
  /** HMAC key id (rotation-friendly); the secret rides executor env, never the spec. */
  callbackKeyId: string;
};

export const BUILD_OUTCOMES = [
  "built",
  "failed",
  "killed_budget",
  "killed_timeout",
] as const;
export type BuildOutcome = (typeof BUILD_OUTCOMES)[number];

export type BuildUsage = {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  /** Harness-counted provider cost. The job envelope settles from THIS. */
  providerCostKobo: number;
};

export type QaFindingSeverity = "pass" | "warn" | "fail";
export type QaReport = {
  /** Overall machine verdict — a single hard `fail` gate blocks client review. */
  ok: boolean;
  gates: Array<{
    key: string;
    severity: QaFindingSeverity;
    detail: string;
  }>;
};

export type BuildJobReport = {
  jobId: string;
  attempt: number;
  outcome: BuildOutcome;
  artifact?: {
    kind: "bundle" | "repo";
    /** bundle: content-addressed store ref · repo: branch+commit in the sites org. */
    ref: string;
    /** Track-2 ONLY. Track-1 previews are materialized orchestrator-side after QA. */
    previewUrl?: string;
    /** sha256 of the canonical bundle JSON — the deploy step re-verifies this. */
    contentHash?: string;
    /**
     * Track-1 ONLY: the site bundle itself, inline. Small structured JSON — the
     * credential-less executor cannot write our store, so it returns the bundle
     * in the (HMAC-verified) report and the orchestrator content-addresses it.
     * Validated + QA-scanned before it is ever stored or rendered.
     */
    bundle?: unknown;
  };
  qa: QaReport;
  usage: BuildUsage;
  /** Redacted run-log ref for the review surface (never inline secrets). */
  log: string;
};

/** Heartbeat POSTed by the caps harness every progress step (HMAC-signed). */
export type BuildHeartbeat = {
  jobId: string;
  attempt: number;
  /** Monotonic per (jobId, attempt) — the orchestrator rejects non-increasing. */
  seq: number;
  stage: string;
  costSoFarKobo: number;
  note?: string;
  /** Runner run id, sent on the first heartbeat → stored as executor_run_ref. */
  runRef?: string;
};
