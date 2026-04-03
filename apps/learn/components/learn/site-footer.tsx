import Link from "next/link";
import { getDivisionConfig } from "@henryco/config";

const learn = getDivisionConfig("learn");

export function LearnSiteFooter() {
  return (
    <footer className="border-t border-[var(--learn-line)] bg-black/10">
      <div className="mx-auto grid max-w-[92rem] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.4fr,1fr,1fr] xl:px-10">
        <div>
          <p className="learn-kicker">HenryCo Academy</p>
          <h3 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--learn-ink)]">
            Premium learning for public growth, internal readiness, and verified capability.
          </h3>
          <p className="mt-4 max-w-xl text-sm leading-8 text-[var(--learn-ink-soft)]">
            HenryCo Learn connects courses, internal training, notifications, certificates, and future unified-account history through one calm academy operating surface.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--learn-ink-soft)]">Explore</p>
          <div className="mt-5 space-y-3">
            {[
              ["/courses", "Course catalog"],
              ["/academy", "Academy overview"],
              ["/certifications", "Certifications"],
              ["/trust", "Trust"],
              ["/help", "Help"],
            ].map(([href, label]) => (
              <div key={href}>
                <Link href={href} className="text-sm text-[var(--learn-ink)] transition hover:text-[var(--learn-mint-soft)]">
                  {label}
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--learn-ink-soft)]">Support</p>
          <div className="mt-5 space-y-3 text-sm text-[var(--learn-ink-soft)]">
            <p>{learn.supportEmail}</p>
            <p>{learn.supportPhone}</p>
            <p>Mon-Fri 9:00-18:00 WAT</p>
            <Link href="/learner" className="inline-flex text-[var(--learn-mint-soft)] transition hover:text-white">
              Learner dashboard
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
