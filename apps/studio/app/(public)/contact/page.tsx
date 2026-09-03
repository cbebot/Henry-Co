import Link from "next/link";
import { ArrowRight, FolderKanban, Mail, Phone } from "lucide-react";
import { getDivisionConfig, getSupportWhatsAppHref } from "@henryco/config";
import { getStudioCatalog } from "@/lib/studio/catalog";

const studioDivision = getDivisionConfig("studio");

/** Reject support emails that belong to other divisions. The studio page
 * was rendering BRAND_EMAILS.care because the shared settings table
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
          Direct line to the Henry Onyx Studio desk for premium web, apps, product UX,
          branding, and custom software. Already know what to build? Skip to the
          structured brief.
        </p>

        <dl className="mt-10 divide-y divide-[var(--studio-line)] border-y border-[var(--studio-line)]">
          <div className="flex items-baseline gap-3 py-4">
            <Mail className="h-3.5 w-3.5 text-[var(--studio-signal)]" />
            <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-ink-soft)]">
              Email
            </dt>
            <dd className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--studio-ink)]">
              <a
                href={`mailto:${supportEmail}`}
                className="hover:text-[var(--studio-signal)] hover:underline underline-offset-4"
              >
                {supportEmail}
              </a>
            </dd>
          </div>
          {/* NUMBER-PURGE (owner 2026-07-08): no company digits render —
           * WhatsApp deep link only, number confined to the href. */}
          <div className="flex items-baseline gap-3 py-4">
            <Phone className="h-3.5 w-3.5 text-[var(--studio-signal)]" />
            <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-ink-soft)]">
              WhatsApp
            </dt>
            <dd className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--studio-ink)]">
              <a
                href={getSupportWhatsAppHref(String(supportPhone))}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--studio-signal)] hover:underline underline-offset-4"
              >
                WhatsApp
              </a>
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

      <section className="mt-14 rounded-[1.5rem] border border-[var(--studio-line)] bg-[color:var(--home-surface-02)] p-6 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-2xl border border-[var(--studio-line-strong)] bg-[color:var(--home-accent-soft)] text-[var(--studio-signal)]">
              <FolderKanban className="h-4 w-4" />
            </span>
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                Already working with us?
              </div>
              <h2 className="mt-1 text-[16px] font-semibold tracking-[-0.005em] text-[var(--studio-ink)]">
                Open your client workspace
              </h2>
              <p className="mt-1 max-w-xl text-[13px] leading-5 text-[var(--studio-ink-soft)]">
                Track milestones, review deliverables, message the team, and pay
                invoices — everything tied to your engagement, in one place.
              </p>
            </div>
          </div>
          <Link
            href="/client"
            className="studio-button-secondary inline-flex items-center gap-2 self-start rounded-full px-5 py-2.5 text-sm font-semibold sm:self-auto"
          >
            Open workspace
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
