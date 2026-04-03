import Link from "next/link";
import { getStudioCatalog } from "@/lib/studio/catalog";

export default async function ContactPage() {
  const catalog = await getStudioCatalog();
  const supportEmail = catalog.platform.supportEmail || "studio@henrycogroup.com";
  const supportPhone = catalog.platform.supportPhone || "+2349133957084";

  return (
    <main className="mx-auto max-w-[64rem] px-5 py-10 sm:px-8">
      <div className="studio-panel studio-mesh rounded-[2rem] p-6 sm:p-8">
        <div className="studio-kicker">Contact</div>
        <h1 className="studio-heading mt-4">Need a direct conversation before you open the full brief?</h1>
        <p className="mt-4 text-lg leading-8 text-[var(--studio-ink-soft)]">
          Reach the Studio desk for premium web, app, design, branding, and systems delivery, or go
          straight into the structured request builder if you already know what needs to be built.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5">
            <div className="studio-kicker">Email</div>
            <div className="mt-3 text-lg font-semibold text-[var(--studio-ink)]">{supportEmail}</div>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5">
            <div className="studio-kicker">Phone / WhatsApp</div>
            <div className="mt-3 text-lg font-semibold text-[var(--studio-ink)]">{supportPhone}</div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/request" className="studio-button-primary rounded-full px-5 py-3 text-sm font-semibold">
            Start the Studio brief
          </Link>
          <Link href="/pricing" className="studio-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
            Review package lanes
          </Link>
        </div>
      </div>
    </main>
  );
}
