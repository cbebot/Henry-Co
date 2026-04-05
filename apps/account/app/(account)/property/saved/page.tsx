import Link from "next/link";
import { ChevronRight, ExternalLink, Heart, ShieldCheck } from "lucide-react";
import { getDivisionUrl } from "@henryco/config";
import { requireAccountUser } from "@/lib/auth";
import { getSavedPropertiesForUser } from "@/lib/property-module";
import PageHeader from "@/components/layout/PageHeader";
import SavedPropertiesBoard from "@/components/property/SavedPropertiesBoard";

export const dynamic = "force-dynamic";

export default async function SavedPropertiesPage() {
  const user = await requireAccountUser();
  const propertyOrigin = getDivisionUrl("property");
  const properties = await getSavedPropertiesForUser(user.id);
  const managedCount = properties.filter((property) => property.managedByHenryCo).length;

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title="Saved Properties"
        description="A premium shortlist view powered by HenryCo Property's live saved-listing truth, not a generic activity wrapper."
        icon={Heart}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/property" className="acct-button-secondary rounded-xl">
              Property overview <ChevronRight size={14} />
            </Link>
            <a
              href={propertyOrigin}
              target="_blank"
              rel="noopener noreferrer"
              className="acct-button-primary rounded-xl"
            >
              Explore Property <ExternalLink size={14} />
            </a>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="acct-card p-5">
          <p className="acct-kicker">Saved now</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--acct-ink)]">{properties.length}</p>
          <p className="mt-2 text-sm leading-7 text-[var(--acct-muted)]">
            Properties you've saved to your shortlist.
          </p>
        </div>
        <div className="acct-card p-5">
          <p className="acct-kicker">HenryCo managed</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--acct-ink)]">{managedCount}</p>
          <p className="mt-2 text-sm leading-7 text-[var(--acct-muted)]">
            Listings with clearer operational support and more accountable follow-through.
          </p>
        </div>
        <div className="acct-card p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[var(--acct-green)]" />
            <p className="acct-kicker">Shortlist quality</p>
          </div>
          <p className="mt-3 text-sm leading-7 text-[var(--acct-muted)]">
            Compare up to three listings, open details, contact the Property team, and remove saved items without leaving the account dashboard.
          </p>
        </div>
      </section>

      <SavedPropertiesBoard initialProperties={properties} propertyOrigin={propertyOrigin} />
    </div>
  );
}
