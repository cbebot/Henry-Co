"use client";

import { useState, useTransition } from "react";
import { updateBusinessAction } from "@/app/(account)/business/actions";
import { Field, StatusLine, inputCls, buttonCls } from "@/components/business/form-bits";

export type ProfileFormCopy = {
  tradingName: string;
  registration: string;
  country: string;
  save: string;
};

export default function BusinessProfileForm({
  slug,
  copy,
  countries,
  initial,
}: {
  slug: string;
  copy: ProfileFormCopy;
  countries: ReadonlyArray<{ code: string; name: string }>;
  initial: { tradingName: string; registration: string; country: string };
}) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ tone: "error" | "success"; message: string } | null>(null);

  function onSubmit(formData: FormData) {
    setStatus(null);
    startTransition(async () => {
      const result = await updateBusinessAction(formData);
      if (!result) return;
      setStatus(
        result.ok
          ? { tone: "success", message: result.message ?? "" }
          : { tone: "error", message: result.error ?? "" },
      );
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <input type="hidden" name="slug" value={slug} />
      <Field label={copy.tradingName} htmlFor="tradingName">
        <input id="tradingName" name="tradingName" defaultValue={initial.tradingName} className={inputCls} />
      </Field>
      <Field label={copy.registration} htmlFor="registration">
        <input id="registration" name="registration" defaultValue={initial.registration} className={inputCls} />
      </Field>
      <Field label={copy.country} htmlFor="country">
        <select id="country" name="country" defaultValue={initial.country} className={inputCls}>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      {status ? <StatusLine tone={status.tone} message={status.message} /> : <div className="min-h-[1rem]" />}
      <button type="submit" disabled={pending} className={buttonCls}>
        {copy.save}
      </button>
    </form>
  );
}
