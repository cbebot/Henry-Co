"use client";

import { useActionState } from "react";
import { FormPendingButton } from "@henryco/ui";
import { saveCompanySettingsAction, saveCompanySiteSettingsAction } from "@/lib/owner-actions";
import { initialOwnerFormState } from "@/lib/owner-form-state";
import { OwnerFormFeedback } from "@/components/owner/OwnerFormFeedback";
import type { HubOwnerCopy } from "@henryco/i18n";

type BrandSettingsCopy = HubOwnerCopy["brandSettingsForms"];

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

type CompanyRow = Record<string, unknown>;
type SiteRow = Record<string, unknown>;

export function CompanySettingsForm({
  company,
  copy,
}: {
  company: CompanyRow;
  copy: BrandSettingsCopy;
}) {
  const socials = (company.socials as Record<string, string> | undefined) || {};
  const [state, action] = useActionState(saveCompanySettingsAction, initialOwnerFormState);

  return (
    <form action={action} className="grid gap-4 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <OwnerFormFeedback state={state} />
      </div>
      <input type="hidden" name="id" value={String(company.id || "primary")} />
      <input name="brand_title" defaultValue={String(company.brand_title || "")} className="acct-input" placeholder={copy.companyBrandTitlePlaceholder} />
      <input name="company_name" defaultValue={String(company.company_name || "")} className="acct-input" placeholder={copy.companyCompanyNamePlaceholder} />
      <input name="legal_name" defaultValue={String(company.legal_name || "")} className="acct-input" placeholder={copy.companyLegalNamePlaceholder} />
      <input name="brand_subtitle" defaultValue={String(company.brand_subtitle || "")} className="acct-input" placeholder={copy.companyBrandSubtitlePlaceholder} />
      <input name="support_email" defaultValue={String(company.support_email || "")} className="acct-input" placeholder={copy.companySupportEmailPlaceholder} />
      <input name="support_phone" defaultValue={String(company.support_phone || "")} className="acct-input" placeholder={copy.companySupportPhonePlaceholder} />
      <input name="base_domain" defaultValue={String(company.base_domain || "")} className="acct-input" placeholder={copy.companyBaseDomainPlaceholder} />
      <input name="brand_accent" defaultValue={String(company.brand_accent || "")} className="acct-input" placeholder={copy.companyBrandAccentPlaceholder} />
      <input name="logo_url" defaultValue={String(company.logo_url || "")} className="acct-input lg:col-span-2" placeholder={copy.companyLogoUrlPlaceholder} />
      <input name="favicon_url" defaultValue={String(company.favicon_url || "")} className="acct-input lg:col-span-2" placeholder={copy.companyFaviconUrlPlaceholder} />
      <input name="default_meta_title" defaultValue={String(company.default_meta_title || "")} className="acct-input lg:col-span-2" placeholder={copy.companyDefaultMetaTitlePlaceholder} />
      <textarea name="brand_description" defaultValue={String(company.brand_description || "")} className="acct-textarea lg:col-span-2" placeholder={copy.companyBrandDescriptionPlaceholder} />
      <textarea name="footer_blurb" defaultValue={String(company.footer_blurb || "")} className="acct-textarea lg:col-span-2" placeholder={copy.companyFooterBlurbPlaceholder} />
      <textarea name="office_address" defaultValue={String(company.office_address || "")} className="acct-textarea lg:col-span-2" placeholder={copy.companyOfficeAddressPlaceholder} />
      <input name="social_instagram" defaultValue={String(socials.instagram || "")} className="acct-input" placeholder={copy.companyInstagramPlaceholder} />
      <input name="social_linkedin" defaultValue={String(socials.linkedin || "")} className="acct-input" placeholder={copy.companyLinkedinPlaceholder} />
      <input name="social_whatsapp" defaultValue={String(socials.whatsapp || "")} className="acct-input" placeholder={copy.companyWhatsappPlaceholder} />
      <input name="social_x" defaultValue={String(socials.x || "")} className="acct-input" placeholder={copy.companyXPlaceholder} />
      <SaveButton
        label={copy.companySaveLabel}
        pendingLabel={copy.pendingLabel}
        spinnerLabel={copy.spinnerLabel}
      />
    </form>
  );
}

export function HubSiteSettingsForm({
  site,
  copy,
}: {
  site: SiteRow;
  copy: BrandSettingsCopy;
}) {
  const [state, action] = useActionState(saveCompanySiteSettingsAction, initialOwnerFormState);

  return (
    <form action={action} className="grid gap-4 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <OwnerFormFeedback state={state} />
      </div>
      <input type="hidden" name="id" value={String(site.id || "")} />
      <input type="hidden" name="site_key" value={String(site.site_key || "hub")} />
      <input name="brand_title" defaultValue={String(site.brand_title || "")} className="acct-input" placeholder={copy.hubTitlePlaceholder} />
      <input name="brand_subtitle" defaultValue={String(site.brand_subtitle || "")} className="acct-input" placeholder={copy.hubSubtitlePlaceholder} />
      <input name="legal_company_name" defaultValue={String(site.legal_company_name || "")} className="acct-input" placeholder={copy.hubLegalCompanyNamePlaceholder} />
      <input name="support_email" defaultValue={String(site.support_email || "")} className="acct-input" placeholder={copy.hubSupportEmailPlaceholder} />
      <input name="support_phone" defaultValue={String(site.support_phone || "")} className="acct-input" placeholder={copy.hubSupportPhonePlaceholder} />
      <input name="primary_accent" defaultValue={String(site.primary_accent || "")} className="acct-input" placeholder={copy.hubPrimaryAccentPlaceholder} />
      <input name="secondary_accent" defaultValue={String(site.secondary_accent || "")} className="acct-input" placeholder={copy.hubSecondaryAccentPlaceholder} />
      <input name="logo_url" defaultValue={String(site.logo_url || "")} className="acct-input lg:col-span-2" placeholder={copy.hubLogoUrlPlaceholder} />
      <input name="light_logo_url" defaultValue={String(site.light_logo_url || "")} className="acct-input lg:col-span-2" placeholder={copy.hubLightLogoUrlPlaceholder} />
      <input name="favicon_url" defaultValue={String(site.favicon_url || "")} className="acct-input lg:col-span-2" placeholder={copy.hubFaviconUrlPlaceholder} />
      <textarea name="meta_description" defaultValue={String(site.meta_description || "")} className="acct-textarea lg:col-span-2" placeholder={copy.hubMetaDescriptionPlaceholder} />
      <textarea name="footer_notice" defaultValue={String(site.footer_notice || "")} className="acct-textarea lg:col-span-2" placeholder={copy.hubFooterNoticePlaceholder} />
      <SaveButton
        label={copy.hubSaveLabel}
        pendingLabel={copy.pendingLabel}
        spinnerLabel={copy.spinnerLabel}
      />
    </form>
  );
}
