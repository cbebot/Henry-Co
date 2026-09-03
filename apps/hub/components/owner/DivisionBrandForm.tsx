"use client";

import { useActionState } from "react";
import { FormPendingButton } from "@henryco/ui";
import { saveDivisionBrandAction } from "@/lib/owner-actions";
import { initialOwnerFormState } from "@/lib/owner-form-state";
import { OwnerFormFeedback } from "@/components/owner/OwnerFormFeedback";
import type { HubOwnerCopy } from "@henryco/i18n";

type DivisionBrandCopy = HubOwnerCopy["divisionBrandForm"];

function SaveButton({
  label,
  pendingLabel,
  spinnerLabel,
}: {
  label: string;
  pendingLabel: string;
  spinnerLabel: string;
}) {
  return (
    <FormPendingButton
      type="submit"
      className="acct-button-primary lg:col-span-2"
      pendingLabel={pendingLabel}
      spinnerLabel={spinnerLabel}
    >
      {label}
    </FormPendingButton>
  );
}

type DivisionRow = Record<string, unknown>;

export function CreateDivisionBrandForm({ copy }: { copy: DivisionBrandCopy }) {
  const [state, action] = useActionState(saveDivisionBrandAction, initialOwnerFormState);

  return (
    <form action={action} className="mb-5 rounded-[1.5rem] border border-dashed border-[var(--acct-line)] bg-[var(--acct-bg)] p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold text-[var(--acct-ink)]">{copy.createHeading}</p>
        <p className="mt-1 text-xs text-[var(--acct-muted)]">{copy.createBlurb}</p>
      </div>
      <div className="lg:col-span-2">
        <OwnerFormFeedback state={state} />
      </div>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <input name="slug" className="acct-input" placeholder={copy.slugPlaceholder} required />
        <input name="name" className="acct-input" placeholder={copy.namePlaceholder} />
        <select name="status" className="acct-select" defaultValue="pending">
          <option value="pending">{copy.statusPending}</option>
          <option value="active">{copy.statusActive}</option>
          <option value="paused">{copy.statusPaused}</option>
          <option value="archived">{copy.statusArchived}</option>
        </select>
        <input name="subdomain" className="acct-input" placeholder={copy.subdomainPlaceholder} />
        <input name="primary_url" className="acct-input" placeholder={copy.primaryUrlPlaceholder} />
        <input name="domain" className="acct-input" placeholder={copy.domainPlaceholder} />
        <input name="accent" className="acct-input" placeholder={copy.accentPlaceholder} defaultValue="#C9A227" />
        <input name="tagline" className="acct-input" placeholder={copy.taglinePlaceholder} />
        <textarea name="description" className="acct-textarea lg:col-span-2" placeholder={copy.descriptionPlaceholder} />
        <SaveButton
          label={copy.createCtaLabel}
          pendingLabel={copy.pendingLabel}
          spinnerLabel={copy.spinnerLabel}
        />
      </div>
    </form>
  );
}

export function EditDivisionBrandForm({ division, copy }: { division: DivisionRow; copy: DivisionBrandCopy }) {
  const [state, action] = useActionState(saveDivisionBrandAction, initialOwnerFormState);
  const highlights = Array.isArray(division.highlights) ? (division.highlights as string[]).join("\n") : "";
  const who = Array.isArray(division.who_its_for) ? (division.who_its_for as string[]).join("\n") : "";
  const how = Array.isArray(division.how_it_works) ? (division.how_it_works as string[]).join("\n") : "";
  const trust = Array.isArray(division.trust) ? (division.trust as string[]).join("\n") : "";

  return (
    <form action={action} className="rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
      <div className="mb-3">
        <OwnerFormFeedback state={state} />
      </div>
      <input type="hidden" name="id" value={String(division.id || "")} />
      <input type="hidden" name="slug" value={String(division.slug || "")} />
      <div className="grid gap-4 lg:grid-cols-2">
        <input name="name" defaultValue={String(division.name || "")} className="acct-input" placeholder={copy.namePlaceholder} />
        <input name="tagline" defaultValue={String(division.tagline || "")} className="acct-input" placeholder={copy.taglinePlaceholder} />
        <input name="subdomain" defaultValue={String(division.subdomain || "")} className="acct-input" placeholder={copy.subdomainPlaceholder} />
        <input name="primary_url" defaultValue={String(division.primary_url || "")} className="acct-input" placeholder={copy.primaryUrlPlaceholder} />
        <input name="domain" defaultValue={String(division.domain || "")} className="acct-input" placeholder={copy.domainPlaceholder} />
        <select name="status" defaultValue={String(division.status || "active")} className="acct-select">
          <option value="pending">{copy.statusPending}</option>
          <option value="active">{copy.statusActive}</option>
          <option value="paused">{copy.statusPaused}</option>
          <option value="archived">{copy.statusArchived}</option>
        </select>
        <input name="accent" defaultValue={String(division.accent || "")} className="acct-input" placeholder={copy.accentPlaceholder} />
        <input name="logo_url" defaultValue={String(division.logo_url || "")} className="acct-input lg:col-span-2" placeholder={copy.logoUrlPlaceholder} />
        <input name="cover_url" defaultValue={String(division.cover_url || "")} className="acct-input lg:col-span-2" placeholder={copy.coverUrlPlaceholder} />
        <textarea name="description" defaultValue={String(division.description || "")} className="acct-textarea lg:col-span-2" placeholder={copy.descriptionPlaceholder} />
        <textarea name="highlights" defaultValue={highlights} className="acct-textarea" placeholder={copy.highlightsPlaceholder} />
        <textarea name="who_its_for" defaultValue={who} className="acct-textarea" placeholder={copy.whoItsForPlaceholder} />
        <textarea name="how_it_works" defaultValue={how} className="acct-textarea" placeholder={copy.howItWorksPlaceholder} />
        <textarea name="trust" defaultValue={trust} className="acct-textarea" placeholder={copy.trustPlaceholder} />
        <SaveButton
          label={copy.saveCtaLabel}
          pendingLabel={copy.pendingLabel}
          spinnerLabel={copy.spinnerLabel}
        />
      </div>
    </form>
  );
}
