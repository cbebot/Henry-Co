"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Download, Loader2, Package } from "lucide-react";

import { getStudioCopy } from "@henryco/i18n";
import type { AppLocale } from "@henryco/i18n";

export type AssetPackFileOption = {
  id: string;
  label: string;
  publicId: string | null;
};

type BuilderState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string }
  | { kind: "success"; packId: string; archiveUrl: string | null; expiresAt: string };

export type AssetPackBuilderProps = {
  projectId: string;
  fileOptions: AssetPackFileOption[];
  locale?: AppLocale;
  brandGuidelinesAvailable?: boolean;
  onSuccess?: (input: { packId: string; archiveUrl: string | null }) => void;
};

/**
 * V3 PASS 21 — <AssetPackBuilder>.
 *
 * Selects files for a branded asset pack and POSTs to
 * /api/studio/asset-packs/generate. Renders the resulting archive URL +
 * 7-day expiry. Brand-guidelines toggle drives the inclusion of a
 * StudioBrandGuidelinesDocument PDF alongside the zip (server side).
 */
export function AssetPackBuilder({
  projectId,
  fileOptions,
  locale = "en",
  brandGuidelinesAvailable = false,
  onSuccess,
}: AssetPackBuilderProps) {
  const copy = getStudioCopy(locale);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [includeBrandGuidelines, setIncludeBrandGuidelines] = useState(false);
  const [state, setState] = useState<BuilderState>({ kind: "idle" });
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    if (selected.size === 0) {
      setState({ kind: "error", message: copy.assetPacks.emptyTitle });
      return;
    }
    setState({ kind: "submitting" });
    startTransition(async () => {
      try {
        const response = await fetch("/api/studio/asset-packs/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            project_id: projectId,
            file_ids: Array.from(selected),
            include_brand_guidelines: includeBrandGuidelines && brandGuidelinesAvailable,
          }),
        });
        const payload = (await response.json().catch(() => null)) as
          | {
              ok: boolean;
              pack_id?: string;
              archive_url?: string | null;
              expires_at?: string;
              error?: string;
            }
          | null;
        if (!response.ok || !payload?.ok) {
          setState({
            kind: "error",
            message:
              payload?.error === "forbidden"
                ? copy.errors.assetPackInvalidProject
                : copy.errors.assetPackGenerationFailed,
          });
          return;
        }
        setState({
          kind: "success",
          packId: payload.pack_id || "",
          archiveUrl: payload.archive_url ?? null,
          expiresAt: payload.expires_at || "",
        });
        onSuccess?.({
          packId: payload.pack_id || "",
          archiveUrl: payload.archive_url ?? null,
        });
      } catch {
        setState({ kind: "error", message: copy.errors.assetPackGenerationFailed });
      }
    });
  }

  const disabled = pending || state.kind === "submitting";

  return (
    <section
      className="rounded-2xl border border-[color:var(--hc-line)] bg-[color:var(--hc-paper-elev)] p-6"
      data-testid="asset-pack-builder"
    >
      <header className="mb-4 flex items-start gap-3">
        <span className="rounded-full bg-[color:var(--hc-accent-soft)] p-2 text-[color:var(--hc-accent-text)]">
          <Package aria-hidden className="h-5 w-5" />
        </span>
        <div>
          <h3 className="hc-heading-3">{copy.assetPacks.title}</h3>
          <p className="hc-body-muted mt-1 text-sm">
            {fileOptions.length} {copy.assetPacks.fileCount}
          </p>
        </div>
      </header>

      {fileOptions.length === 0 ? (
        <p className="hc-body-muted text-sm">{copy.assetPacks.emptyBody}</p>
      ) : (
        <ul className="mb-4 space-y-1 max-h-64 overflow-auto" role="list">
          {fileOptions.map((file) => {
            const isOn = selected.has(file.id);
            return (
              <li key={file.id}>
                <label
                  className="flex items-start gap-2 rounded-lg border border-transparent px-2 py-1 hover:border-[color:var(--hc-line)]"
                  data-active={isOn}
                >
                  <input
                    type="checkbox"
                    checked={isOn}
                    onChange={() => toggle(file.id)}
                    disabled={disabled || !file.publicId}
                    className="mt-1 h-4 w-4"
                  />
                  <span className="flex-1 text-sm text-[color:var(--hc-ink)]">{file.label}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {brandGuidelinesAvailable ? (
        <label className="mb-4 flex items-start gap-2 text-sm text-[color:var(--hc-ink)]">
          <input
            type="checkbox"
            checked={includeBrandGuidelines}
            onChange={(e) => setIncludeBrandGuidelines(e.target.checked)}
            disabled={disabled}
            className="mt-0.5 h-4 w-4"
          />
          <span>{copy.assetPacks.includeBrandGuidelines}</span>
        </label>
      ) : null}

      {state.kind === "error" ? (
        <p className="mb-3 inline-flex items-center gap-2 text-sm text-[color:var(--hc-danger)]">
          <AlertCircle aria-hidden className="h-4 w-4" />
          <span>{state.message}</span>
        </p>
      ) : null}

      {state.kind === "success" ? (
        <div className="mb-3 rounded-lg border border-[color:var(--hc-line)] bg-[color:var(--hc-paper)] p-3">
          <p className="hc-body inline-flex items-center gap-2 text-sm text-[color:var(--hc-success)]">
            <CheckCircle2 aria-hidden className="h-4 w-4" />
            <span>{copy.assetPacks.statusReady}</span>
          </p>
          {state.archiveUrl ? (
            <a
              href={state.archiveUrl}
              target="_blank"
              rel="noreferrer"
              className="hc-link mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--hc-accent-text)]"
            >
              <Download aria-hidden className="h-4 w-4" />
              <span>{copy.assetPacks.downloadCta}</span>
            </a>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={submit}
        disabled={disabled || selected.size === 0}
        className="hc-button-primary inline-flex items-center gap-2 rounded-full bg-[color:var(--hc-accent)] px-5 py-2 text-sm font-semibold text-[color:var(--hc-accent-text)] disabled:opacity-60"
      >
        {state.kind === "submitting" ? (
          <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
        ) : (
          <Package aria-hidden className="h-4 w-4" />
        )}
        <span>{copy.assetPacks.generateCta}</span>
      </button>
    </section>
  );
}
