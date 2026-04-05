import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { saveDivisionBrandAction } from "@/lib/owner-actions";
import { getBrandCenterData } from "@/lib/owner-data";

export const dynamic = "force-dynamic";

export default async function BrandSubdomainsPage() {
  const data = await getBrandCenterData();

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Division Branding"
        title="Subdomains, logos, and identity rows"
        description="Each division row can now be updated centrally from the owner command center."
      />

      <OwnerPanel title="Division rows" description="Edit the brand row that represents each division across the shared company registry.">
        <form action={saveDivisionBrandAction} className="mb-5 rounded-[1.5rem] border border-dashed border-[var(--acct-line)] bg-[var(--acct-bg)] p-4">
          <div className="mb-3">
            <p className="text-sm font-semibold text-[var(--acct-ink)]">Create new division row</p>
            <p className="mt-1 text-xs text-[var(--acct-muted)]">
              Add a pending or active division directly in the registry so owner-controlled rows drive the wider company surface.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <input name="slug" className="acct-input" placeholder="Slug, e.g. logistics-labs" />
            <input name="name" className="acct-input" placeholder="Division name" />
            <select name="status" className="acct-select">
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </select>
            <input name="subdomain" className="acct-input" placeholder="Subdomain" />
            <input name="primary_url" className="acct-input" placeholder="Primary URL" />
            <input name="domain" className="acct-input" placeholder="Domain" />
            <input name="accent" className="acct-input" placeholder="#..." defaultValue="#C9A227" />
            <input name="tagline" className="acct-input" placeholder="Tagline" />
            <textarea name="description" className="acct-textarea lg:col-span-2" placeholder="Description" />
            <button type="submit" className="acct-button-primary lg:col-span-2">Create division row</button>
          </div>
        </form>

        <div className="space-y-4">
          {data.divisions.map((division) => (
            <form key={String(division.id)} action={saveDivisionBrandAction} className="rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
              <input type="hidden" name="id" value={String(division.id || "")} />
              <input type="hidden" name="slug" value={String(division.slug || "")} />
              <div className="grid gap-4 lg:grid-cols-2">
                <input name="name" defaultValue={String(division.name || "")} className="acct-input" placeholder="Division name" />
                <input name="tagline" defaultValue={String(division.tagline || "")} className="acct-input" placeholder="Tagline" />
                <input name="subdomain" defaultValue={String(division.subdomain || "")} className="acct-input" placeholder="Subdomain" />
                <input name="primary_url" defaultValue={String(division.primary_url || "")} className="acct-input" placeholder="Primary URL" />
                <input name="domain" defaultValue={String(division.domain || "")} className="acct-input" placeholder="Domain" />
                <select name="status" defaultValue={String(division.status || "active")} className="acct-select">
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="archived">Archived</option>
                </select>
                <input name="accent" defaultValue={String(division.accent || "")} className="acct-input" placeholder="#..." />
                <input name="logo_url" defaultValue={String(division.logo_url || "")} className="acct-input lg:col-span-2" placeholder="Logo URL" />
                <input name="cover_url" defaultValue={String(division.cover_url || "")} className="acct-input lg:col-span-2" placeholder="Hero media / cover URL" />
                <textarea name="description" defaultValue={String(division.description || "")} className="acct-textarea lg:col-span-2" placeholder="Description" />
                <textarea name="highlights" defaultValue={Array.isArray(division.highlights) ? division.highlights.join("\n") : ""} className="acct-textarea" placeholder="Highlights, one per line" />
                <textarea name="who_its_for" defaultValue={Array.isArray(division.who_its_for) ? division.who_its_for.join("\n") : ""} className="acct-textarea" placeholder="Audience, one per line" />
                <textarea name="how_it_works" defaultValue={Array.isArray(division.how_it_works) ? division.how_it_works.join("\n") : ""} className="acct-textarea" placeholder="How it works, one per line" />
                <textarea name="trust" defaultValue={Array.isArray(division.trust) ? division.trust.join("\n") : ""} className="acct-textarea" placeholder="Trust items, one per line" />
                <button type="submit" className="acct-button-primary lg:col-span-2">Save division row</button>
              </div>
            </form>
          ))}
        </div>
      </OwnerPanel>
    </div>
  );
}
