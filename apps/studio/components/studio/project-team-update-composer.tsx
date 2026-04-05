"use client";

import { ChevronDown } from "lucide-react";
import { StudioSubmitButton } from "@/components/studio/submit-button";
import { createProjectUpdateAction } from "@/lib/studio/actions";

export function ProjectTeamUpdateComposer({
  projectId,
  redirectPath,
}: {
  projectId: string;
  redirectPath: string;
}) {
  return (
    <details className="group mt-8 rounded-[1.5rem] border border-[var(--studio-line)] bg-black/12 open:border-[rgba(151,244,243,0.2)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
            Team only
          </div>
          <div className="mt-1 text-sm font-semibold text-[var(--studio-ink)]">Post a project update</div>
          <p className="mt-1 text-xs leading-5 text-[var(--studio-ink-soft)]">
            This appears in the client's project timeline. Keep it clear and concise.
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
              Update title
            </label>
            <input
              id="team-pu-title"
              name="title"
              required
              placeholder="e.g. Designs ready for your review"
              className="studio-input mt-1.5 w-full rounded-[1.1rem] px-4 py-3"
            />
          </div>
          <div>
            <label htmlFor="team-pu-kind" className="text-xs font-semibold text-[var(--studio-ink)]">
              Category
            </label>
            <select
              id="team-pu-kind"
              name="kind"
              defaultValue="status"
              className="studio-input mt-1.5 w-full rounded-[1.1rem] px-4 py-3"
            >
              <option value="status">Progress update</option>
              <option value="milestone">Milestone update</option>
              <option value="manual_update">Studio note</option>
            </select>
          </div>
          <div>
            <label htmlFor="team-pu-summary" className="text-xs font-semibold text-[var(--studio-ink)]">
              Details
            </label>
            <textarea
              id="team-pu-summary"
              name="summary"
              required
              rows={4}
              className="studio-textarea mt-1.5 min-h-28 w-full rounded-[1.25rem] px-4 py-3"
              placeholder="What's changed, what's next, or what the client should know."
            />
          </div>
          <label className="flex items-center gap-3 text-sm text-[var(--studio-ink-soft)]">
            <input type="checkbox" name="notifyClient" className="rounded border-[var(--studio-line)]" defaultChecked />
            Notify client by email and WhatsApp when available
          </label>
          <StudioSubmitButton label="Publish to progress log" pendingLabel="Publishing…" />
        </form>
      </div>
    </details>
  );
}
