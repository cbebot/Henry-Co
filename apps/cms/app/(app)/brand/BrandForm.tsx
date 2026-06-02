"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import {
  Card,
  EditorHeader,
  Field,
  ImageUpload,
  PrimaryButton,
  SaveBar,
  Spinner,
  StatusPill,
  TextArea,
  TextInput,
  type ToastMessage,
} from "@/components/cms/editor-kit";
import type { CompanySettings, CompanySocials } from "@/lib/cms/settings";
import { saveSettings, type SettingsInput } from "@/lib/cms/settings-actions";

/** Drop the server-managed timestamp; the form only edits writable columns. */
function toInput(s: CompanySettings): SettingsInput {
  return {
    company_name: s.company_name,
    legal_name: s.legal_name,
    brand_title: s.brand_title,
    brand_subtitle: s.brand_subtitle,
    brand_description: s.brand_description,
    footer_blurb: s.footer_blurb,
    copyright_label: s.copyright_label,
    brand_accent: s.brand_accent,
    logo_url: s.logo_url,
    logo_public_id: s.logo_public_id,
    favicon_url: s.favicon_url,
    favicon_public_id: s.favicon_public_id,
    default_meta_title: s.default_meta_title,
    default_meta_description: s.default_meta_description,
    base_domain: s.base_domain,
    cloudinary_folder: s.cloudinary_folder,
    support_email: s.support_email,
    support_phone: s.support_phone,
    address: s.address,
    office_address: s.office_address,
    socials: { ...s.socials },
  };
}

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function BrandForm({ settings }: { settings: CompanySettings }) {
  const router = useRouter();
  const [form, setForm] = useState<SettingsInput>(() => toInput(settings));
  const [savedSnapshot, setSavedSnapshot] = useState<string>(() =>
    JSON.stringify(toInput(settings))
  );
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastMessage>(null);

  const dirty = useMemo(() => JSON.stringify(form) !== savedSnapshot, [form, savedSnapshot]);

  function patch(p: Partial<SettingsInput>) {
    setToast(null);
    setForm((f) => ({ ...f, ...p }));
  }

  function patchSocial(p: Partial<CompanySocials>) {
    setToast(null);
    setForm((f) => ({ ...f, socials: { ...f.socials, ...p } }));
  }

  async function onSave() {
    setSaving(true);
    const res = await saveSettings(form);
    setSaving(false);
    if (res.ok) {
      setSavedSnapshot(JSON.stringify(form));
      setToast({ ok: true, text: "Saved — your brand settings are live." });
      router.refresh();
    } else {
      setToast({ ok: false, text: res.error });
    }
  }

  const accent = form.brand_accent.trim();
  const accentValid = HEX.test(accent);
  const swatchColor = accentValid ? accent : "transparent";

  return (
    <div className="pb-28">
      <EditorHeader
        title="Brand & Settings"
        status={<StatusPill tone="live">Always live</StatusPill>}
        description={
          <>
            Your company identity, logos, SEO defaults, and contact details. There&apos;s no draft
            step here — every change goes live the moment you save.
          </>
        }
      />

      <div className="mt-7 grid gap-5">
        {/* Identity */}
        <Card title="Identity" desc="The names that represent the company across the brand.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company name" hint="Required">
              <TextInput
                value={form.company_name}
                onChange={(e) => patch({ company_name: e.target.value })}
                placeholder="Henry & Co."
              />
            </Field>
            <Field label="Legal name" hint="For contracts &amp; footers">
              <TextInput
                value={form.legal_name}
                onChange={(e) => patch({ legal_name: e.target.value })}
                placeholder="Henry & Co. Limited"
              />
            </Field>
          </div>
          <Field label="Copyright label" hint="Shown in the site footer">
            <TextInput
              value={form.copyright_label}
              onChange={(e) => patch({ copyright_label: e.target.value })}
              placeholder="© Henry & Co. All rights reserved."
            />
          </Field>
          <Field label="Footer blurb" hint="A short line under the footer logo">
            <TextArea
              value={form.footer_blurb}
              onChange={(e) => patch({ footer_blurb: e.target.value })}
              placeholder="A multi-division company building everyday excellence."
            />
          </Field>
        </Card>

        {/* Brand & media */}
        <Card
          title="Brand & media"
          desc="The display headline, accent colour, and brand imagery."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Brand title">
              <TextInput
                value={form.brand_title}
                onChange={(e) => patch({ brand_title: e.target.value })}
                placeholder="Henry & Co."
              />
            </Field>
            <Field label="Brand subtitle">
              <TextInput
                value={form.brand_subtitle}
                onChange={(e) => patch({ brand_subtitle: e.target.value })}
                placeholder="Everyday excellence, delivered."
              />
            </Field>
          </div>
          <Field label="Brand description" hint="A paragraph that sums up the company">
            <TextArea
              value={form.brand_description}
              onChange={(e) => patch({ brand_description: e.target.value })}
              placeholder="What the company is and the promise it makes…"
            />
          </Field>

          <Field
            label="Accent colour"
            hint="Hex value, e.g. #C9A227"
            error={accent && !accentValid ? "Enter a valid hex colour like #C9A227." : undefined}
          >
            <div className="flex items-center gap-3">
              <span
                className="h-10 w-10 shrink-0 rounded-xl border border-[var(--hc-line)] transition-colors"
                style={{ backgroundColor: swatchColor }}
                aria-hidden
              />
              <input
                type="color"
                value={accentValid ? accent : "#C9A227"}
                onChange={(e) => patch({ brand_accent: e.target.value })}
                aria-label="Pick accent colour"
                className="h-10 w-12 shrink-0 cursor-pointer rounded-xl border border-[var(--hc-line)] bg-[var(--hc-surface)] p-1 transition-colors"
              />
              <TextInput
                value={form.brand_accent}
                onChange={(e) => patch({ brand_accent: e.target.value })}
                placeholder="#C9A227"
                className="font-mono"
              />
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <ImageUpload
                label="Logo"
                value={form.logo_url}
                onChange={(url) => patch({ logo_url: url })}
                folder="henryco/brand"
                hint="PNG or SVG"
              />
              <Field label="Logo public ID" hint="Cloudinary reference (optional)">
                <TextInput
                  value={form.logo_public_id}
                  onChange={(e) => patch({ logo_public_id: e.target.value })}
                  placeholder="henryco/brand/logo"
                />
              </Field>
            </div>

            <div className="space-y-3">
              <ImageUpload
                label="Favicon"
                value={form.favicon_url}
                onChange={(url) => patch({ favicon_url: url })}
                folder="henryco/brand"
                hint="Square icon"
              />
              <Field label="Favicon public ID" hint="Cloudinary reference (optional)">
                <TextInput
                  value={form.favicon_public_id}
                  onChange={(e) => patch({ favicon_public_id: e.target.value })}
                  placeholder="henryco/brand/favicon"
                />
              </Field>
            </div>
          </div>

          <Field label="Cloudinary folder" hint="Required — where brand assets are stored">
            <TextInput
              value={form.cloudinary_folder}
              onChange={(e) => patch({ cloudinary_folder: e.target.value })}
              placeholder="henryco"
            />
          </Field>
        </Card>

        {/* SEO defaults */}
        <Card
          title="SEO defaults"
          desc="Used for pages that don't set their own title or description."
        >
          <Field label="Default meta title">
            <TextInput
              value={form.default_meta_title}
              onChange={(e) => patch({ default_meta_title: e.target.value })}
              placeholder="Henry & Co. — Everyday excellence"
            />
          </Field>
          <Field label="Default meta description">
            <TextArea
              value={form.default_meta_description}
              onChange={(e) => patch({ default_meta_description: e.target.value })}
              placeholder="A one- or two-sentence summary for search engines and shared links."
            />
          </Field>
          <Field label="Base domain" hint="No https:// — e.g. henrycogroup.com">
            <TextInput
              value={form.base_domain}
              onChange={(e) => patch({ base_domain: e.target.value })}
              placeholder="henrycogroup.com"
            />
          </Field>
        </Card>

        {/* Contact */}
        <Card title="Contact" desc="How customers and partners reach the company.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Support email">
              <TextInput
                type="email"
                value={form.support_email}
                onChange={(e) => patch({ support_email: e.target.value })}
                placeholder="hello@henrycogroup.com"
              />
            </Field>
            <Field label="Support phone">
              <TextInput
                value={form.support_phone}
                onChange={(e) => patch({ support_phone: e.target.value })}
                placeholder="0802 428 7292"
              />
            </Field>
          </div>
          <Field label="Address" hint="Primary mailing address">
            <TextArea
              value={form.address}
              onChange={(e) => patch({ address: e.target.value })}
              placeholder="Street, city, country"
            />
          </Field>
          <Field label="Office address" hint="Where the team works, if different">
            <TextArea
              value={form.office_address}
              onChange={(e) => patch({ office_address: e.target.value })}
              placeholder="Office street, city, country"
            />
          </Field>
        </Card>

        {/* Social links */}
        <Card title="Social links" desc="Handles or URLs for the company's social presence.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="X (Twitter)">
              <TextInput
                value={form.socials.x}
                onChange={(e) => patchSocial({ x: e.target.value })}
                placeholder="https://x.com/henryco"
              />
            </Field>
            <Field label="LinkedIn">
              <TextInput
                value={form.socials.linkedin}
                onChange={(e) => patchSocial({ linkedin: e.target.value })}
                placeholder="https://linkedin.com/company/henryco"
              />
            </Field>
            <Field label="Instagram">
              <TextInput
                value={form.socials.instagram}
                onChange={(e) => patchSocial({ instagram: e.target.value })}
                placeholder="https://instagram.com/henryco"
              />
            </Field>
            <Field label="WhatsApp">
              <TextInput
                value={form.socials.whatsapp}
                onChange={(e) => patchSocial({ whatsapp: e.target.value })}
                placeholder="0802 428 7292"
              />
            </Field>
          </div>
        </Card>
      </div>

      <SaveBar dirty={dirty} message={toast}>
        <PrimaryButton onClick={onSave} disabled={saving || !dirty}>
          {saving ? <Spinner /> : <Save className="h-4 w-4" aria-hidden />}
          {saving ? "Saving…" : "Save"}
        </PrimaryButton>
      </SaveBar>
    </div>
  );
}
