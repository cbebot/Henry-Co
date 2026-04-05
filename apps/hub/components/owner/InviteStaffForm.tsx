"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  OWNER_DIVISION_SLUGS,
  WORKFORCE_PERMISSION_OPTIONS,
  WORKFORCE_ROLE_OPTIONS,
} from "@/lib/owner-workforce-catalog";
import { inviteStaffMemberAction } from "@/lib/owner-actions";
import { initialOwnerFormState } from "@/lib/owner-form-state";
import { OwnerFormFeedback } from "@/components/owner/OwnerFormFeedback";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="acct-button-primary">
      {pending ? "Sending…" : "Send invitation"}
    </button>
  );
}

export default function InviteStaffForm() {
  const [state, formAction] = useActionState(inviteStaffMemberAction, initialOwnerFormState);

  return (
    <form action={formAction} className="grid gap-4 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <OwnerFormFeedback state={state} />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--acct-muted)]">Full name</label>
        <input name="fullName" className="acct-input mt-2" placeholder="Operations lead" required />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--acct-muted)]">Email</label>
        <input name="email" type="email" className="acct-input mt-2" placeholder="lead@henrycogroup.com" required />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--acct-muted)]">Phone</label>
        <input name="phone" className="acct-input mt-2" placeholder="+234…" />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--acct-muted)]">Role</label>
        <select name="role" className="acct-select mt-2" defaultValue="staff">
          {WORKFORCE_ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
              {r.scope === "division" ? " (division)" : " (company)"}
            </option>
          ))}
        </select>
      </div>
      <div className="lg:col-span-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--acct-muted)]">Primary division</label>
        <select name="division" className="acct-select mt-2" defaultValue="care">
          <option value="">Unassigned</option>
          {OWNER_DIVISION_SLUGS.map((division) => (
            <option key={division} value={division}>
              {division}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-[var(--acct-muted)]">
          Pick the division this person belongs to for operational roles. Company-wide roles may still leave this blank when appropriate.
        </p>
      </div>
      <div className="lg:col-span-2">
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
                defaultChecked={["operations.manage", "staff.manage"].includes(p.key)}
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
      <div className="lg:col-span-2">
        <SubmitButton />
      </div>
    </form>
  );
}
