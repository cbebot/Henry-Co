"use client";

import { useActionState } from "react";
import { FormPendingButton } from "@henryco/ui";
import { saveCompanySettingsAction, saveCompanySiteSettingsAction } from "@/lib/owner-actions";
import { initialOwnerFormState } from "@/lib/owner-form-state";
import { OwnerFormFeedback } from "@/components/owner/OwnerFormFeedback";

function SaveButton({ label }: { label: string }) {
  return (
    <FormPendingButton
      type="submit"
      className="acct-button-primary lg:col-span-2"
      pendingLabel="Saving..."
      spinnerLabel="Saving changes"
    >
      {label}
    </FormPendingButton>
  );
}

type CompanyRow = Record<string, unknown>;
type SiteRow = Record<string, unknown>;

export function CompanySettingsForm({ company }: { company: CompanyRow }) {
  const socials = (company.socials as Record<string, string> | undefined) || {};
  const [state, action] = useActionState(saveCompanySettingsAction, initialOwnerFormState);

  return (
    <form action={action} className="grid gap-4 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <OwnerFormFeedback state={state} />
      </div>
      <input type="hidden" name="id" value={String(company.id || "primary")} />
      <input name="brand_title" defaultValue={String(company.brand_title || "")} className="acct-input" placeholder="Brand title" />
      <input name="company_name" defaultValue={String(company.company_name || "")} className="acct-input" placeholder="Company name" />
      <input name="legal_name" defaultValue={String(company.legal_name || "")} className="acct-input" placeholder="Legal name" />
      <input name="brand_subtitle" defaultValue={String(company.brand_subtitle || "")} className="acct-input" placeholder="Brand subtitle" />
      <input name="support_email" defaultValue={String(company.support_email || "")} className="acct-input" placeholder="Support email" />
      <input name="support_phone" defaultValue={String(company.support_phone || "")} className="acct-input" placeholder="Support phone" />
      <input name="base_domain" defaultValue={String(company.base_domain || "")} className="acct-input" placeholder="Base domain" />
      <input name="brand_accent" defaultValue={String(company.brand_accent || "")} className="acct-input" placeholder="#C9A227" />
      <input name="logo_url" defaultValue={String(company.logo_url || "")} className="acct-input lg:col-span-2" placeholder="Logo URL" />
      <input name="favicon_url" defaultValue={String(company.favicon_url || "")} className="acct-input lg:col-span-2" placeholder="Favicon URL" />
      <input name="default_meta_title" defaultValue={String(company.default_meta_title || "")} className="acct-input lg:col-span-2" placeholder="Default meta title" />
      <textarea name="brand_description" defaultValue={String(company.brand_description || "")} className="acct-textarea lg:col-span-2" placeholder="Brand description" />
      <textarea name="footer_blurb" defaultValue={String(company.footer_blurb || "")} className="acct-textarea lg:col-span-2" placeholder="Footer blurb" />
      <textarea name="office_address" defaultValue={String(company.office_address || "")} className="acct-textarea lg:col-span-2" placeholder="Office address" />
      <input name="social_instagram" defaultValue={String(socials.instagram || "")} className="acct-input" placeholder="Instagram URL" />
      <input name="social_linkedin" defaultValue={String(socials.linkedin || "")} className="acct-input" placeholder="LinkedIn URL" />
      <input name="social_whatsapp" defaultValue={String(socials.whatsapp || "")} className="acct-input" placeholder="WhatsApp number" />
      <input name="social_x" defaultValue={String(socials.x || "")} className="acct-input" placeholder="X URL" />
      <SaveButton label="Save company settings" />
    </form>
  );
}

export function HubSiteSettingsForm({ site }: { site: SiteRow }) {
  const [state, action] = useActionState(saveCompanySiteSettingsAction, initialOwnerFormState);

  return (
    <form action={action} className="grid gap-4 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <OwnerFormFeedback state={state} />
      </div>
      <input type="hidden" name="id" value={String(site.id || "")} />
      <input type="hidden" name="site_key" value={String(site.site_key || "hub")} />
      <input name="brand_title" defaultValue={String(site.brand_title || "")} className="acct-input" placeholder="Hub title" />
      <input name="brand_subtitle" defaultValue={String(site.brand_subtitle || "")} className="acct-input" placeholder="Hub subtitle" />
      <input name="legal_company_name" defaultValue={String(site.legal_company_name || "")} className="acct-input" placeholder="Legal company name" />
      <input name="support_email" defaultValue={String(site.support_email || "")} className="acct-input" placeholder="Support email" />
      <input name="support_phone" defaultValue={String(site.support_phone || "")} className="acct-input" placeholder="Support phone" />
      <input name="primary_accent" defaultValue={String(site.primary_accent || "")} className="acct-input" placeholder="Primary accent" />
      <input name="secondary_accent" defaultValue={String(site.secondary_accent || "")} className="acct-input" placeholder="Secondary accent" />
      <input name="logo_url" defaultValue={String(site.logo_url || "")} className="acct-input lg:col-span-2" placeholder="Logo URL" />
      <input name="light_logo_url" defaultValue={String(site.light_logo_url || "")} className="acct-input lg:col-span-2" placeholder="Light logo URL" />
      <input name="favicon_url" defaultValue={String(site.favicon_url || "")} className="acct-input lg:col-span-2" placeholder="Favicon URL" />
      <textarea name="meta_description" defaultValue={String(site.meta_description || "")} className="acct-textarea lg:col-span-2" placeholder="Meta description" />
      <textarea name="footer_notice" defaultValue={String(site.footer_notice || "")} className="acct-textarea lg:col-span-2" placeholder="Footer notice" />
      <SaveButton label="Save hub shell settings" />
    </form>
  );
}
