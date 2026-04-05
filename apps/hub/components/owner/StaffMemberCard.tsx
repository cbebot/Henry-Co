"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { WorkforceMember } from "@/lib/owner-workforce-catalog";
import {
  OWNER_DIVISION_SLUGS,
  WORKFORCE_PERMISSION_OPTIONS,
  WORKFORCE_ROLE_OPTIONS,
} from "@/lib/owner-workforce-catalog";
import { saveStaffMemberAction, toggleStaffMemberStatusAction } from "@/lib/owner-actions";
import { initialOwnerFormState } from "@/lib/owner-form-state";
import DivisionBadge from "@/components/owner/DivisionBadge";
import StatusBadge from "@/components/owner/StatusBadge";
import { OwnerFormFeedback } from "@/components/owner/OwnerFormFeedback";
import { timeAgo } from "@/lib/format";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="acct-button-primary">
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

function ToggleButton({ suspended }: { suspended: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="acct-button-ghost">
      {pending ? "Updating…" : suspended ? "Reactivate" : "Suspend"}
    </button>
  );
}

export default function StaffMemberCard({ member }: { member: WorkforceMember }) {
  const [saveState, saveAction] = useActionState(saveStaffMemberAction, initialOwnerFormState);
  const [toggleState, toggleAction] = useActionState(toggleStaffMemberStatusAction, initialOwnerFormState);

  const roleDefault = WORKFORCE_ROLE_OPTIONS.some((r) => r.value === member.role) ? member.role : "staff";

  return (
    <div className="space-y-3 rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
      <form action={saveAction} className="space-y-4">
        <input type="hidden" name="userId" value={member.id} />
        <OwnerFormFeedback state={saveState} />

        <div className="grid gap-4 lg:grid-cols-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--acct-muted)]">Full name</label>
            <input name="fullName" defaultValue={member.fullName} className="acct-input mt-2" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--acct-muted)]">Email</label>
            <input name="email" defaultValue={member.email || ""} className="acct-input mt-2" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--acct-muted)]">Phone</label>
            <input name="phone" defaultValue={member.phone || ""} className="acct-input mt-2" />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--acct-muted)]">Role</label>
            <select name="role" defaultValue={roleDefault} className="acct-select mt-2">
              {WORKFORCE_ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                  {r.scope === "division" ? " (division)" : " (company)"}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-[var(--acct-muted)]">
              {WORKFORCE_ROLE_OPTIONS.find((r) => r.value === roleDefault)?.description}
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--acct-muted)]">Primary division</label>
            <select name="division" defaultValue={member.division || ""} className="acct-select mt-2">
              <option value="">Unassigned</option>
              {OWNER_DIVISION_SLUGS.map((division) => (
                <option key={division} value={division}>
                  {division}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-[var(--acct-muted)]">
              Required for division-scoped roles (e.g. Care manager vs Studio manager).
            </p>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--acct-muted)]">Permissions</label>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {WORKFORCE_PERMISSION_OPTIONS.map((p) => (
              <label
                key={p.key}
                className="flex cursor-pointer items-start gap-2 rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg)] px-3 py-2.5 text-sm leading-snug"
              >
                <input
                  type="checkbox"
                  name="permissions"
                  value={p.key}
                  defaultChecked={member.permissions.includes(p.key)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--owner-accent)]"
                />
                <span>
                  <span className="font-medium text-[var(--acct-ink)]">{p.label}</span>
                  <span className="mt-0.5 block text-[0.7rem] text-[var(--acct-muted)]">{p.description}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-[var(--acct-line)] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {member.division ? <DivisionBadge division={member.division} /> : <span className="acct-chip acct-chip-purple">No division</span>}
            <StatusBadge status={member.status} />
            <span className="text-xs text-[var(--acct-muted)]">
              {member.lastSeen ? `Last seen ${timeAgo(member.lastSeen)}` : "Not active yet"}
            </span>
          </div>
          <SaveButton />
        </div>
      </form>

      <form action={toggleAction} className="flex flex-col items-stretch gap-2 border-t border-[var(--acct-line)] pt-3 sm:flex-row sm:items-center sm:justify-end">
        <input type="hidden" name="userId" value={member.id} />
        <input type="hidden" name="intent" value={member.status === "suspended" ? "reactivate" : "suspend"} />
        <div className="min-w-0 flex-1 sm:mr-auto">
          <OwnerFormFeedback state={toggleState} />
        </div>
        <ToggleButton suspended={member.status === "suspended"} />
      </form>
    </div>
  );
}
