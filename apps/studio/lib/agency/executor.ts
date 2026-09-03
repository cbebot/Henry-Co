import "server-only";

/**
 * SA-2 — the host-agnostic executor adapter (ARCHITECTURE §2.2). The
 * orchestrator dispatches through this interface; E1 (GitHub Actions) is the
 * only implementation in SA-2, and E2 (a managed sandbox) is a later adapter
 * swap — the CONTRACT does not change, only the spawn/cancel bodies.
 *
 * The orchestrator holds a fine-grained GitHub token scoped to the DEDICATED
 * executor repo only (`actions:write`), listed in the credentials inventory
 * beside the deploy credential. It is NOT a production credential — it can
 * trigger one workflow in one throwaway repo and nothing else. The runner
 * itself carries ZERO production secrets (SAFETY-MODEL §3): only the
 * build-agent provider key + the HMAC callback secret, both injected as
 * repo/environment secrets in the executor repo, never in the spec.
 */

export type ExecutorDispatchInput = {
  jobId: string;
  attempt: number;
  /** Short-TTL signed URL the runner GETs to pull the frozen spec. */
  specFetchUrl: string;
};

export type ExecutorDispatchResult =
  | { ok: true; runRef?: string }
  | { ok: false; reason: string };

export interface ExecutorAdapter {
  readonly kind: string;
  dispatch(input: ExecutorDispatchInput): Promise<ExecutorDispatchResult>;
  /** Best-effort stall-kill via the run ref captured on the first heartbeat. */
  cancel(runRef: string): Promise<{ ok: boolean }>;
}

/**
 * E1 — GitHub Actions `workflow_dispatch` in a dedicated repo. Configured via:
 *   STUDIO_AGENCY_EXECUTOR_REPO   e.g. "henryonyx/studio-build-agent"
 *   STUDIO_AGENCY_EXECUTOR_WORKFLOW e.g. "build.yml"
 *   STUDIO_AGENCY_EXECUTOR_REF     e.g. "main"
 *   STUDIO_AGENCY_GITHUB_TOKEN     fine-grained PAT, actions:write on that repo ONLY
 *
 * The dispatch passes only {jobId, attempt, specFetchUrl} as inputs; the runner
 * pulls the frozen spec back over the signed URL. The run id is not returned by
 * the dispatch API, so runRef is captured from the first heartbeat.
 */
export class GithubActionsExecutor implements ExecutorAdapter {
  readonly kind = "e1_github_actions";
  constructor(
    private readonly env: {
      repo: string;
      workflow: string;
      ref: string;
      token: string;
    },
  ) {}

  async dispatch(input: ExecutorDispatchInput): Promise<ExecutorDispatchResult> {
    const { repo, workflow, ref, token } = this.env;
    if (!repo || !workflow || !ref || !token) {
      return { ok: false, reason: "executor_not_configured" };
    }
    try {
      const res = await fetch(
        `https://api.github.com/repos/${repo}/actions/workflows/${encodeURIComponent(workflow)}/dispatches`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            accept: "application/vnd.github+json",
            "x-github-api-version": "2022-11-28",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            ref,
            inputs: {
              job_id: input.jobId,
              attempt: String(input.attempt),
              spec_fetch_url: input.specFetchUrl,
            },
          }),
          signal: AbortSignal.timeout(15_000),
        },
      );
      // 204 No Content = dispatch accepted.
      if (res.status === 204) return { ok: true };
      return { ok: false, reason: `github_dispatch_${res.status}` };
    } catch {
      return { ok: false, reason: "github_dispatch_error" };
    }
  }

  async cancel(runRef: string): Promise<{ ok: boolean }> {
    const { repo, token } = this.env;
    if (!repo || !token || !runRef) return { ok: false };
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/actions/runs/${encodeURIComponent(runRef)}/cancel`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          accept: "application/vnd.github+json",
          "x-github-api-version": "2022-11-28",
        },
        signal: AbortSignal.timeout(15_000),
      });
      return { ok: res.status === 202 };
    } catch {
      return { ok: false };
    }
  }
}

/** No-op adapter — the default when the executor is not configured (flag dark). */
export class NullExecutor implements ExecutorAdapter {
  readonly kind = "null";
  async dispatch(): Promise<ExecutorDispatchResult> {
    return { ok: false, reason: "executor_not_configured" };
  }
  async cancel(): Promise<{ ok: boolean }> {
    return { ok: false };
  }
}

/** Resolve the configured adapter from env; NullExecutor when unset (dark). */
export function resolveExecutorAdapter(env: Record<string, string | undefined> = process.env): ExecutorAdapter {
  const repo = String(env.STUDIO_AGENCY_EXECUTOR_REPO ?? "").trim();
  const token = String(env.STUDIO_AGENCY_GITHUB_TOKEN ?? "").trim();
  if (!repo || !token) return new NullExecutor();
  return new GithubActionsExecutor({
    repo,
    workflow: String(env.STUDIO_AGENCY_EXECUTOR_WORKFLOW ?? "build.yml").trim(),
    ref: String(env.STUDIO_AGENCY_EXECUTOR_REF ?? "main").trim(),
    token,
  });
}
