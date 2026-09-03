"use client";

import { useState, useTransition } from "react";
import { changeRoleAction, removeMemberAction } from "@/app/(account)/business/actions";
import { buttonGhostCls } from "@/components/business/form-bits";

export type MemberActionsCopy = {
  remove: string;
  makeAdmin: string;
  makeMember: string;
  error: string;
};

type MemberActionFn = (fd: FormData) => Promise<{ ok: boolean } | undefined>;
type ExtraFields = Record<string, string>;

/**
 * Owner-only controls on a roster row. Owners cannot be acted on here
 * (ownership transfer is out of scope for V3-57).
 */
export default function MemberActions({
  slug,
  userId,
  role,
  copy,
}: {
  slug: string;
  userId: string;
  role: "admin" | "member";
  copy: MemberActionsCopy;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  function run(fn: MemberActionFn, extra?: ExtraFields) {
    setError(false);
    const fd = new FormData();
    fd.set("slug", slug);
    fd.set("userId", userId);
    for (const [k, v] of Object.entries(extra ?? {})) fd.set(k, v);
    startTransition(async () => {
      const result = await fn(fd);
      if (result && !result.ok) setError(true);
    });
  }

  return (
    <div className="flex items-center gap-2">
      {role === "member" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(changeRoleAction, { role: "admin" })}
          className={buttonGhostCls}
        >
          {copy.makeAdmin}
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(changeRoleAction, { role: "member" })}
          className={buttonGhostCls}
        >
          {copy.makeMember}
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => run(removeMemberAction)}
        className={buttonGhostCls}
      >
        {copy.remove}
      </button>
      {error ? <span className="text-xs text-[color:var(--hc-danger,#b91c1c)]">{copy.error}</span> : null}
    </div>
  );
}
