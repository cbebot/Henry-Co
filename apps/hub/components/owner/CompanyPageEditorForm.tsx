"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveCompanyPageAction } from "@/lib/owner-actions";
import { initialOwnerFormState } from "@/lib/owner-form-state";
import { OwnerFormFeedback } from "@/components/owner/OwnerFormFeedback";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="acct-button-primary lg:col-span-2">
      {pending ? "Saving…" : "Save page content"}
    </button>
  );
}

type PageRow = Record<string, unknown>;

export default function CompanyPageEditorForm({ page }: { page: PageRow }) {
  const [state, action] = useActionState(saveCompanyPageAction, initialOwnerFormState);

  return (
    <form action={action} className="rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
      <div className="mb-3 lg:col-span-2">
        <OwnerFormFeedback state={state} />
      </div>
      <input type="hidden" name="id" value={String(page.id || "")} />
      <input type="hidden" name="slug" value={String(page.slug || "")} />
      <div className="grid gap-4 lg:grid-cols-2">
        <input name="title" defaultValue={String(page.title || "")} className="acct-input" placeholder="Title" />
        <input name="subtitle" defaultValue={String(page.subtitle || "")} className="acct-input" placeholder="Subtitle" />
        <input name="hero_badge" defaultValue={String(page.hero_badge || "")} className="acct-input" placeholder="Hero badge" />
        <input name="hero_title" defaultValue={String(page.hero_title || page.title || "")} className="acct-input" placeholder="Hero title" />
        <input name="hero_primary_label" defaultValue={String(page.hero_primary_label || "")} className="acct-input" placeholder="Primary CTA label" />
        <input name="hero_primary_href" defaultValue={String(page.hero_primary_href || "")} className="acct-input" placeholder="Primary CTA href" />
        <input name="hero_secondary_label" defaultValue={String(page.hero_secondary_label || "")} className="acct-input" placeholder="Secondary CTA label" />
        <input name="hero_secondary_href" defaultValue={String(page.hero_secondary_href || "")} className="acct-input" placeholder="Secondary CTA href" />
        <input name="hero_image_url" defaultValue={String(page.hero_image_url || "")} className="acct-input lg:col-span-2" placeholder="Hero image URL" />
        <textarea name="intro" defaultValue={String(page.intro || page.hero_body || "")} className="acct-textarea lg:col-span-2" placeholder="Intro" />
        <textarea name="hero_body" defaultValue={String(page.hero_body || "")} className="acct-textarea lg:col-span-2" placeholder="Hero body" />
        <input name="seo_title" defaultValue={String(page.seo_title || "")} className="acct-input lg:col-span-2" placeholder="SEO title" />
        <textarea name="seo_description" defaultValue={String(page.seo_description || "")} className="acct-textarea lg:col-span-2" placeholder="SEO description" />
        <textarea
          name="stats"
          defaultValue={JSON.stringify(page.stats || [], null, 2)}
          className="acct-textarea lg:col-span-2"
          placeholder='[{"label":"...","value":"..."}]'
        />
        <textarea
          name="sections"
          defaultValue={JSON.stringify(page.sections || [], null, 2)}
          className="acct-textarea lg:col-span-2"
          placeholder='[{"title":"...","body":"..."}]'
        />
        <textarea
          name="body"
          defaultValue={JSON.stringify(page.body || [], null, 2)}
          className="acct-textarea lg:col-span-2"
          placeholder='[{"layout":"default","title":"..."}]'
        />
        <SaveButton />
      </div>
    </form>
  );
}
