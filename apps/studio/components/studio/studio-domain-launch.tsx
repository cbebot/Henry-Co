"use client";

import { ChevronDown, ChevronUp, Globe, LoaderCircle, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import type { StudioDomainIntent } from "@/lib/studio/types";

type Path = StudioDomainIntent["path"];

function buildIntent(partial: Partial<StudioDomainIntent> & { path: Path }): StudioDomainIntent {
  const intent: StudioDomainIntent = {
    path: partial.path,
    desiredLabel: partial.desiredLabel ?? "",
    checkedFqdn: partial.checkedFqdn ?? null,
    checkStatus: partial.checkStatus ?? "not_answered",
    suggestionsShown: partial.suggestionsShown ?? [],
    lookupMode: partial.lookupMode ?? "off",
    lastMessage: partial.lastMessage ?? null,
  };
  const backup = partial.backupLabel?.trim();
  if (backup) intent.backupLabel = backup;
  return intent;
}

const PATH_COPY: Record<Path, { title: string; hint: string }> = {
  new: {
    title: "I want a new web address (domain)",
    hint: "We can check common cases and suggest clean alternatives. Final purchase is always confirmed with you.",
  },
  have: {
    title: "I already own a domain",
    hint: "Keep using it—we connect it when the site is ready. No need to buy another name unless you want one.",
  },
  later: {
    title: "I’m not ready to decide",
    hint: "Totally fine. HenryCo will help you choose before launch. You can still describe your dream name in the notes.",
  },
};

export function StudioDomainLaunchSection() {
  const [path, setPath] = useState<Path>("new");
  const [desired, setDesired] = useState("");
  const [backupDesired, setBackupDesired] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [lastResult, setLastResult] = useState<{
    status: string;
    message: string;
    fqdn: string | null;
    suggestions: string[];
    mode: string;
  } | null>(null);

  const intentJson = useMemo(() => {
    if (path === "have") {
      return JSON.stringify(
        buildIntent({
          path: "have",
          desiredLabel: desired.trim(),
          backupLabel: backupDesired.trim() || undefined,
          checkedFqdn: null,
          checkStatus: "have_domain",
          suggestionsShown: [],
          lookupMode: "off",
          lastMessage: "Client will connect an existing domain at launch.",
        })
      );
    }
    if (path === "later") {
      return JSON.stringify(
        buildIntent({
          path: "later",
          desiredLabel: desired.trim() || backupDesired.trim(),
          backupLabel: backupDesired.trim() || undefined,
          checkedFqdn: null,
          checkStatus: "decide_later",
          suggestionsShown: [],
          lookupMode: "off",
          lastMessage: "Domain decision deferred with Studio guidance before go-live.",
        })
      );
    }
    const st = lastResult?.status ?? "draft";
    return JSON.stringify(
      buildIntent({
        path: "new",
        desiredLabel: desired.trim(),
        backupLabel: backupDesired.trim() || undefined,
        checkedFqdn: lastResult?.fqdn ?? null,
        checkStatus: st,
        suggestionsShown: lastResult?.suggestions ?? [],
        lookupMode: lastResult?.mode ?? "off",
        lastMessage: lastResult?.message ?? null,
      })
    );
  }, [path, desired, backupDesired, lastResult]);

  async function runCheck() {
    const q = desired.trim();
    if (!q) {
      setLastResult({
        status: "empty",
        message: "Type a name or full domain first—for example “riveroak” or “riveroak.com”.",
        fqdn: null,
        suggestions: [],
        mode: "off",
      });
      return;
    }
    setChecking(true);
    try {
      const res = await fetch("/api/studio/domain-check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = (await res.json()) as {
        status?: string;
        message?: string;
        fqdn?: string | null;
        suggestions?: string[];
        mode?: string;
        error?: string;
      };
      if (!res.ok) {
        setLastResult({
          status: "error",
          message: data.error || "We could not run the check. You can still submit—we will verify with you.",
          fqdn: null,
          suggestions: [],
          mode: "off",
        });
        return;
      }
      setLastResult({
        status: String(data.status || "unknown"),
        message: String(data.message || ""),
        fqdn: data.fqdn ?? null,
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
        mode: String(data.mode || "off"),
      });
    } catch {
      setLastResult({
        status: "error",
        message: "Network issue. Submit anyway—HenryCo will confirm your domain manually.",
        fqdn: null,
        suggestions: [],
        mode: "off",
      });
    } finally {
      setChecking(false);
    }
  }

  const statusChip =
    path !== "new"
      ? null
      : lastResult?.status === "available"
        ? { label: "Looks available*", tone: "ok" as const }
        : lastResult?.status === "unavailable"
          ? { label: "Likely taken", tone: "bad" as const }
          : lastResult?.status === "unconfigured"
            ? { label: "Advisory ideas only", tone: "neutral" as const }
            : lastResult?.status === "blocked"
              ? { label: "Needs a safer name", tone: "bad" as const }
              : lastResult?.status === "unknown" || lastResult?.status === "error"
                ? { label: "Verify with team", tone: "neutral" as const }
                : null;

  return (
    <div className="rounded-[2rem] border border-[var(--studio-line)] bg-[color-mix(in_srgb,var(--studio-surface)_90%,transparent)] p-6 sm:p-8">
      <input type="hidden" name="domainIntentJson" value={intentJson} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl border border-[var(--studio-line)] bg-black/15 p-3 text-[var(--studio-signal)]">
            <Globe className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <div className="studio-kicker">Launch & web address</div>
            <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--studio-ink)]">
              Your domain is the address people type to find you
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--studio-ink-soft)]">
              It is not the same as hosting or email setup—we handle those steps with you. You can bring a name
              you already pay for, or we help you pick and register a strong one before go-live.
            </p>
          </div>
        </div>
        {statusChip ? (
          <span
            className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${
              statusChip.tone === "ok"
                ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-100"
                : statusChip.tone === "bad"
                  ? "border-rose-400/35 bg-rose-400/10 text-rose-100"
                  : "border-[var(--studio-line-strong)] bg-black/15 text-[var(--studio-ink-soft)]"
            }`}
          >
            {statusChip.label}
          </span>
        ) : null}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {(Object.keys(PATH_COPY) as Path[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              setPath(p);
              if (p !== "new") setLastResult(null);
            }}
            className={`rounded-[1.4rem] border px-4 py-4 text-left transition ${
              path === p
                ? "border-[rgba(151,244,243,0.45)] bg-[rgba(151,244,243,0.1)]"
                : "border-[var(--studio-line)] bg-black/10 hover:border-[rgba(151,244,243,0.22)]"
            }`}
          >
            <div className="text-sm font-semibold text-[var(--studio-ink)]">{PATH_COPY[p].title}</div>
            <p className="mt-2 text-xs leading-6 text-[var(--studio-ink-soft)]">{PATH_COPY[p].hint}</p>
          </button>
        ))}
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={() => setHelpOpen((o) => !o)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--studio-signal)]"
        >
          Help me choose a domain
          {helpOpen ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
        </button>
        {helpOpen ? (
          <div className="mt-3 rounded-[1.35rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4 text-sm leading-7 text-[var(--studio-ink-soft)]">
            <ul className="list-disc space-y-2 pl-5">
              <li>Shorter is usually easier to say on the phone and type on a phone screen.</li>
              <li>Avoid hyphens if you can—they are easy to forget when people hear the name aloud.</li>
              <li>
                If you serve one country strongly, your local registrar may offer a trusted country ending—we will
                confirm what fits your brand.
              </li>
              <li>
                When live lookup is on, we check public registry data for many .com names; we never claim legal
                availability until a registrar agrees at purchase time.
              </li>
            </ul>
          </div>
        ) : null}
      </div>

      {path === "new" ? (
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <label htmlFor="studio-domain-input" className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                Preferred name or domain
              </label>
              <input
                id="studio-domain-input"
                type="text"
                value={desired}
                onChange={(e) => setDesired(e.target.value)}
                autoComplete="off"
                placeholder="e.g. riveroak or riveroak.com"
                className="studio-input mt-2 rounded-[1.2rem] px-4 py-3"
              />
              <p className="mt-2 text-xs leading-5 text-[var(--studio-ink-soft)]">
                *Live checks only run when enabled for .com names. Otherwise we show thoughtful ideas—not a
                guarantee until a registrar confirms.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void runCheck()}
              disabled={checking}
              className="studio-button-secondary inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60"
            >
              {checking ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {checking ? "Checking…" : "Check this name"}
            </button>
          </div>

          {lastResult ? (
            <div
              role="status"
              className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/12 px-4 py-3 text-sm leading-7 text-[var(--studio-ink-soft)]"
            >
              {lastResult.message}
            </div>
          ) : null}

          {lastResult && lastResult.suggestions.length > 0 ? (
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                Professional alternatives to try
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {lastResult.suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setDesired(s.replace(/^https?:\/\//i, ""));
                      setLastResult(null);
                    }}
                    className="rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-2 text-xs font-semibold text-[var(--studio-ink)] transition hover:border-[rgba(151,244,243,0.35)]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <label htmlFor="studio-domain-backup" className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--studio-signal)]">
              Backup name (optional)
            </label>
            <input
              id="studio-domain-backup"
              type="text"
              value={backupDesired}
              onChange={(e) => setBackupDesired(e.target.value)}
              autoComplete="off"
              placeholder="e.g. riveroakstudio.com"
              className="studio-input mt-2 rounded-[1.2rem] px-4 py-3"
            />
            <p className="mt-2 text-xs leading-5 text-[var(--studio-ink-soft)]">
              If your first choice is taken, we already know a strong second option—no need to restart the brief.
            </p>
          </div>
        </div>
      ) : null}

      {path === "have" ? (
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="studio-existing-domain" className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--studio-signal)]">
              Primary domain you own
            </label>
            <input
              id="studio-existing-domain"
              type="text"
              value={desired}
              onChange={(e) => setDesired(e.target.value)}
              placeholder="e.g. mycompany.com"
              className="studio-input mt-2 rounded-[1.2rem] px-4 py-3"
            />
          </div>
          <div>
            <label htmlFor="studio-domain-backup-have" className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--studio-signal)]">
              Backup or redirect domain (optional)
            </label>
            <input
              id="studio-domain-backup-have"
              type="text"
              value={backupDesired}
              onChange={(e) => setBackupDesired(e.target.value)}
              placeholder="e.g. oldbrand.com → will redirect"
              className="studio-input mt-2 rounded-[1.2rem] px-4 py-3"
            />
          </div>
        </div>
      ) : null}

      {path === "later" ? (
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="studio-domain-later-a" className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--studio-signal)]">
              Names or keywords you like
            </label>
            <input
              id="studio-domain-later-a"
              type="text"
              value={desired}
              onChange={(e) => setDesired(e.target.value)}
              placeholder="e.g. something with “Atlas” or my city name"
              className="studio-input mt-2 rounded-[1.2rem] px-4 py-3"
            />
          </div>
          <div>
            <label htmlFor="studio-domain-later-b" className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--studio-signal)]">
              Second direction (optional)
            </label>
            <input
              id="studio-domain-later-b"
              type="text"
              value={backupDesired}
              onChange={(e) => setBackupDesired(e.target.value)}
              placeholder="Another style of name you would be happy with"
              className="studio-input mt-2 rounded-[1.2rem] px-4 py-3"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
