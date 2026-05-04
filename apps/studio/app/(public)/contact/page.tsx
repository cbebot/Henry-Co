import Link from "next/link";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { getDivisionConfig } from "@henryco/config";
import { getStudioCatalog } from "@/lib/studio/catalog";

const studioDivision = getDivisionConfig("studio");

/** Reject support emails that belong to other divisions. The studio page
 * was rendering `care@henrycogroup.com` because the shared settings table
 * is owned by Care and was leaking into Studio's fallback chain. */
function resolveStudioContactEmail(value: string | null) {
  const trimmed = String(value || "").trim().toLowerCase();
  if (!trimmed) return studioDivision.supportEmail;
  if (trimmed.startsWith("studio@")) return value!;
  if (/^(care|building|hotel|marketplace|property|logistics|jobs|learn)@/.test(trimmed)) {
    return studioDivision.supportEmail;
  }
  return value!;
}

export default async function ContactPage() {
  const catalog = await getStudioCatalog();
  const supportEmail = resolveStudioContactEmail(catalog.platform.supportEmail);
  const supportPhone = catalog.platform.supportPhone || studioDivision.supportPhone;

  return (
    <main id="henryco-main" tabIndex={-1} className="mx-auto max-w-[64rem] px-5 py-12 sm:px-8">
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
