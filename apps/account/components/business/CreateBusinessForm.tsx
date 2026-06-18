"use client";

import { useState, useTransition } from "react";
import { createBusinessAction } from "@/app/(account)/business/actions";
import { Field, StatusLine, inputCls, buttonCls } from "@/components/business/form-bits";

export type CreateBusinessCopy = {
  slug: string;
  slugHint: string;
  legalName: string;
  tradingName: string;
  country: string;
  partnerType: string;
  submit: string;
};

export default function CreateBusinessForm({
  copy,
  countries,
  partnerTypes,
}: {
  copy: CreateBusinessCopy;
  countries: ReadonlyArray<{ code: string; name: string }>;
  partnerTypes: ReadonlyArray<{ value: string; label: string }>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createBusinessAction(formData);
      if (result && !result.ok) setError(result.error ?? null);
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <Field label={copy.legalName} htmlFor="legalName">
        <input id="legalName" name="legalName" required className={inputCls} />
      </Field>
      <Field label={copy.tradingName} htmlFor="tradingName">
        <input id="tradingName" name="tradingName" className={inputCls} />
      </Field>
      <Field label={copy.slug} htmlFor="slug" hint={copy.slugHint}>
        <input id="slug" name="slug" required pattern="[a-z0-9][a-z0-9-]{1,38}[a-z0-9]" className={inputCls} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={copy.country} htmlFor="country">
          <select id="country" name="country" required defaultValue="" className={inputCls}>
            <option value="" disabled />
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={copy.partnerType} htmlFor="partnerType">
          <select id="partnerType" name="partnerType" required defaultValue="" className={inputCls}>
            <option value="" disabled />
            {partnerTypes.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <StatusLine tone="error" message={error ?? ""} />
      <button type="submit" disabled={pending} className={buttonCls}>
        {copy.submit}
      </button>
    </form>
  );
}
