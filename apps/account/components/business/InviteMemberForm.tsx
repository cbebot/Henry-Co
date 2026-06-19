"use client";

import { useRef, useState, useTransition } from "react";
import { inviteMemberAction } from "@/app/(account)/business/actions";
import { Field, StatusLine, inputCls, buttonCls } from "@/components/business/form-bits";

export type InviteFormCopy = {
  email: string;
  role: string;
  send: string;
  roleAdmin: string;
  roleMember: string;
  hint: string;
};

/** Admins may only invite members; owners may invite admins or members. */
export default function InviteMemberForm({
  slug,
  canInviteAdmin,
  copy,
}: {
  slug: string;
  canInviteAdmin: boolean;
  copy: InviteFormCopy;
}) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ tone: "error" | "success"; message: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(formData: FormData) {
    setStatus(null);
    startTransition(async () => {
      const result = await inviteMemberAction(formData);
      if (!result) return;
      if (result.ok) {
        setStatus({ tone: "success", message: result.message ?? "" });
        formRef.current?.reset();
      } else {
        setStatus({ tone: "error", message: result.error ?? "" });
      }
    });
  }

  return (
    <form ref={formRef} action={onSubmit} className="space-y-4">
      <input type="hidden" name="slug" value={slug} />
      <div className="grid gap-4 sm:grid-cols-[2fr,1fr]">
        <Field label={copy.email} htmlFor="invite-email">
          <input id="invite-email" name="email" type="email" required className={inputCls} />
        </Field>
        <Field label={copy.role} htmlFor="invite-role" hint={copy.hint}>
          <select id="invite-role" name="role" defaultValue="member" className={inputCls}>
            <option value="member">{copy.roleMember}</option>
            {canInviteAdmin ? <option value="admin">{copy.roleAdmin}</option> : null}
          </select>
        </Field>
      </div>
      {status ? <StatusLine tone={status.tone} message={status.message} /> : <div className="min-h-[1rem]" />}
      <button type="submit" disabled={pending} className={buttonCls}>
        {copy.send}
      </button>
    </form>
  );
}
