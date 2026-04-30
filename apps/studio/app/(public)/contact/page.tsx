import Link from "next/link";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { getStudioCatalog } from "@/lib/studio/catalog";

export default async function ContactPage() {
  const catalog = await getStudioCatalog();
  const supportEmail = catalog.platform.supportEmail || "studio@henrycogroup.com";
  const supportPhone = catalog.platform.supportPhone || "+2349133957084";

  return (
    <main className="mx-auto max-w-[64rem] px-5 py-12 sm:px-8">
      <section>
        <p className="studio-kicker">Contact</p>
        <h1 className="mt-4 max-w-3xl text-balance text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.025em] text-[var(--studio-ink)] sm:text-[2.9rem] md:text-[3.4rem]">
          Talk to Studio.
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--studio-ink-soft)] sm:text-lg">
          Direct line to the Studio desk for premium web, apps, product UX, branding, and custom
          software. Already know what to build? Skip to the structured brief.
        </p>

        <dl className="mt-10 divide-y divide-[var(--studio-line)] border-y border-[var(--studio-line)]">
          <div className="flex items-baseline gap-3 py-4">
            <Mail className="h-3.5 w-3.5 text-[var(--studio-signal)]" />
            <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-ink-soft)]">
              Email
            </dt>
            <dd className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--studio-ink)]">
              {supportEmail}
            </dd>
          </div>
          <div className="flex items-baseline gap-3 py-4">
            <Phone className="h-3.5 w-3.5 text-[var(--studio-signal)]" />
            <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-ink-soft)]">
              Phone / WhatsApp
            </dt>
            <dd className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--studio-ink)]">
              {supportPhone}
            </dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/request"
            className="studio-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
          >
            Start the Studio brief
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/pricing"
            className="studio-button-secondary inline-flex rounded-full px-6 py-3.5 text-sm font-semibold"
          >
            View packages
          </Link>
        </div>
      </section>
    </main>
  );
}
