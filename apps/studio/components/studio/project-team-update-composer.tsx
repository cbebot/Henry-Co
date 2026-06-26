"use client";

import { ChevronDown } from "lucide-react";
import { StudioSubmitButton } from "@/components/studio/submit-button";
import { createProjectUpdateAction } from "@/lib/studio/actions";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { getStudioProjectCopy } from "@henryco/i18n";

export function ProjectTeamUpdateComposer({
  projectId,
  redirectPath,
}: {
  projectId: string;
  redirectPath: string;
}) {
  const locale = useHenryCoLocale();
  const copy = getStudioProjectCopy(locale).composer;
  return (
    <details className="group mt-8 rounded-[1.5rem] border border-[var(--studio-line)] bg-black/12 open:border-[rgba(151,244,243,0.2)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
            {copy.teamOnly}
          </div>
          <div className="mt-1 text-sm font-semibold text-[var(--studio-ink)]">{copy.postUpdateTitle}</div>
          <p className="mt-1 text-xs leading-5 text-[var(--studio-ink-soft)]">
            {copy.postUpdateHint}
          </p>
        </div>
        <ChevronDown
          className="h-5 w-5 shrink-0 text-[var(--studio-signal)] transition duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="border-t border-[var(--studio-line)] p-5">
        <form action={createProjectUpdateAction} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="redirectPath" value={redirectPath} />
          <div>
            <label htmlFor="team-pu-title" className="text-xs font-semibold text-[var(--studio-ink)]">
              {copy.updateTitleLabel}
            </label>
            <input
              id="team-pu-title"
              name="title"
              required
              placeholder={copy.updateTitlePlaceholder}
              className="studio-input mt-1.5 w-full rounded-[1.1rem] px-4 py-3"
            />
          </div>
          <div>
            <label htmlFor="team-pu-kind" className="text-xs font-semibold text-[var(--studio-ink)]">
              {copy.categoryLabel}
            </label>
            <select
              id="team-pu-kind"
              name="kind"
              defaultValue="status"
              className="studio-input mt-1.5 w-full rounded-[1.1rem] px-4 py-3"
            >
              <option value="status">{copy.optionStatus}</option>
              <option value="milestone">{copy.optionMilestone}</option>
              <option value="manual_update">{copy.optionNote}</option>
            </select>
          </div>
          <div>
            <label htmlFor="team-pu-summary" className="text-xs font-semibold text-[var(--studio-ink)]">
              {copy.detailsLabel}
            </label>
            <textarea
              id="team-pu-summary"
              name="summary"
              required
              rows={4}
              className="studio-textarea mt-1.5 min-h-28 w-full rounded-[1.25rem] px-4 py-3"
              placeholder={copy.detailsPlaceholder}
            />
          </div>
          <label className="flex items-center gap-3 text-sm text-[var(--studio-ink-soft)]">
            <input type="checkbox" name="notifyClient" className="rounded border-[var(--studio-line)]" defaultChecked />
            {copy.notifyClient}
          </label>
          <StudioSubmitButton label={copy.submitLabel} pendingLabel={copy.submitPending} />
        </form>
      </div>
    </details>
  );
}
