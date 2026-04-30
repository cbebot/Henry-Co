import Link from "next/link";
import { ArrowRight, ArrowUpRight, Compass, Sparkles } from "lucide-react";

const READY_TYPES: {
  slug: string;
  title: string;
  blurb: string;
  audience: string;
  includes: string[];
}[] = [
  {
    slug: "business-website",
    title: "Business or company website",
    blurb:
      "A calm, credible site that explains who you are, what you offer, and how to take the next step.",
    audience: "Owners, firms, and teams who need trust at first glance",
    includes: [
      "Clear story and services",
      "Contact and location paths",
      "Mobile-friendly layout",
      "SEO-ready structure",
    ],
  },
  {
    slug: "ecommerce",
    title: "Online shop",
    blurb:
      "Sell products with cart, checkout, and a tidy way to track orders &mdash; without duct-taping five tools together.",
    audience: "Brands, makers, and sellers ready to grow online",
    includes: [
      "Product catalog",
      "Checkout flow",
      "Order handling basics",
      "Trust and policy pages",
    ],
  },
  {
    slug: "booking",
    title: "Bookings and appointments",
    blurb:
      "Let people choose a time, pay a deposit if you want, and reduce endless &ldquo;what time works?&rdquo; messages.",
    audience: "Clinics, salons, tutors, trades, and consultants",
    includes: [
      "Scheduling experience",
      "Reminder-friendly flows",
      "Staff-friendly calendar logic",
      "Optional payments",
    ],
  },
  {
    slug: "real-estate",
    title: "Property and listings",
    blurb:
      "Show listings, help serious buyers filter, and capture leads that actually convert.",
    audience: "Agents, developers, and property managers",
    includes: [
      "Listing presentation",
      "Search and filters",
      "Lead capture",
      "High-trust visuals",
    ],
  },
  {
    slug: "logistics",
    title: "Operations and logistics",
    blurb:
      "Internal screens your team uses daily &mdash; status, routes, and simple reporting in one disciplined place.",
    audience: "Dispatch, warehouses, and field teams",
    includes: [
      "Role-based views",
      "Operational dashboards",
      "Reporting basics",
      "Scalable architecture mindset",
    ],
  },
  {
    slug: "community",
    title: "Community platform",
    blurb:
      "Members, discussions, and structured access &mdash; built for people first, not only for transactions.",
    audience: "Membership groups, associations, and passionate audiences",
    includes: [
      "Member journeys",
      "Content and access rules",
      "Moderation-friendly patterns",
      "Growth-ready structure",
    ],
  },
  {
    slug: "school-portal",
    title: "School portal",
    blurb:
      "Parents and students find what they need without hunting &mdash; calm layouts that respect busy families.",
    audience: "Schools, academies, and training centres",
    includes: [
      "Information architecture",
      "News and resources",
      "Forms and downloads",
      "Accessible reading experience",
    ],
  },
  {
    slug: "learning",
    title: "Courses and online learning",
    blurb:
      "Lessons, member sign-in, and progress people can follow &mdash; whether you teach skills or certifications.",
    audience: "Teachers, coaches, and course creators",
    includes: [
      "Lesson structure",
      "Member accounts",
      "Progress tracking",
      "Payment-ready paths",
    ],
  },
  {
    slug: "church",
    title: "Church or ministry",
    blurb:
      "Events, giving, and stories that read beautifully on phones and large screens alike.",
    audience: "Congregations and charities",
    includes: [
      "Event rhythm",
      "Giving clarity",
      "Story-driven pages",
      "Volunteer-friendly updates",
    ],
  },
  {
    slug: "agency",
    title: "Agency or studio website",
    blurb:
      "Lead with proof &mdash; case stories, services, and a confident first impression for new clients.",
    audience: "Creative, marketing, and consulting teams",
    includes: [
      "Case-led storytelling",
      "Service clarity",
      "Lead capture",
      "Premium presentation",
    ],
  },
  {
    slug: "marketplace",
    title: "Marketplace or multi-seller",
    blurb:
      "Multiple sellers, listings, and trust signals &mdash; commerce that still feels safe for buyers.",
    audience: "Platforms and communities with shared selling",
    includes: [
      "Seller onboarding patterns",
      "Listings and trust",
      "Payments thinking",
      "Operational moderation hooks",
    ],
  },
  {
    slug: "portfolio",
    title: "Portfolio or personal brand",
    blurb:
      "Quiet confidence &mdash; your best work, your story, and a clear way to hire you or follow you.",
    audience: "Creatives, experts, and public-facing professionals",
    includes: [
      "Curated work presentation",
      "Bio and credibility",
      "Contact and booking hooks",
      "Fast mobile reading",
    ],
  },
  {
    slug: "web-app-starter",
    title: "Custom web app starter",
    blurb:
      "A focused first version of software in the browser &mdash; dashboards, workflows, or internal tools done properly.",
    audience: "Founders and operators with a process to digitize",
    includes: [
      "Discovery-shaped MVP",
      "Auth and roles thinking",
      "Data model sanity",
      "Roadmap beyond day one",
    ],
  },
  {
    slug: "mobile",
    title: "Mobile app (phone)",
    blurb:
      "A real installable app &mdash; planned, built, and released with the same discipline as our web work.",
    audience: "Teams with members, fans, or field staff on phones",
    includes: [
      "Platform guidance",
      "Release planning",
      "Core feature set",
      "Ongoing support",
    ],
  },
];

export default function StudioPickPage() {
  return (
    <main className="mx-auto max-w-[92rem] px-5 pb-24 pt-10 sm:px-8 lg:px-10">
      <section>
        <p className="studio-kicker">Ready-to-start paths</p>
        <h1 className="mt-4 max-w-3xl text-balance text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.025em] text-[var(--studio-ink)] sm:text-[2.9rem] md:text-[3.4rem]">
          Pick the project closest to yours. We tune the brief from there.
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--studio-ink-soft)] sm:text-lg">
          Business sites, commerce, booking, portals, custom software, mobile &mdash; each path
          pre-fills the brief. Every answer stays editable; nothing is final until you confirm
          scope and price.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/request"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--studio-line)] bg-transparent px-5 py-2.5 text-sm font-semibold text-[var(--studio-ink)] transition hover:border-[var(--studio-signal)]/40 hover:bg-[rgba(0,0,0,0.04)]"
          >
            <Compass className="h-3.5 w-3.5" />
            Open a free-form brief instead
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--studio-signal)] underline-offset-4 hover:underline"
          >
            Compare fixed packages
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <section className="mt-16">
        <div className="flex items-end justify-between gap-4 border-b border-[var(--studio-line)] pb-5">
          <div>
            <p className="studio-kicker">Curated project types</p>
            <h2 className="mt-3 text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--studio-ink)] sm:text-[1.85rem]">
              Browse, compare, tap once to start.
            </h2>
          </div>
          <p className="hidden max-w-md text-sm leading-7 text-[var(--studio-ink-soft)] sm:block">
            &ldquo;What&rsquo;s included&rdquo; is a guide &mdash; we tailor scope on every build.
          </p>
        </div>

        <ol className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {READY_TYPES.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/request?preset=${item.slug}`}
                className="group flex h-full flex-col rounded-[1.8rem] border border-[var(--studio-line)] bg-[rgba(0,0,0,0.04)] p-6 transition duration-300 hover:-translate-y-1 hover:border-[var(--studio-signal)]/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[1.15rem] font-semibold leading-snug tracking-tight text-[var(--studio-ink)] sm:text-[1.25rem]">
                    {item.title}
                  </h3>
                  <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-[var(--studio-ink-soft)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--studio-signal)]" />
                </div>
                <p
                  className="mt-3 text-sm leading-relaxed text-[var(--studio-ink-soft)]"
                  dangerouslySetInnerHTML={{ __html: item.blurb }}
                />
                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                  Often for
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--studio-ink-soft)]">
                  {item.audience}
                </p>
                <ul className="mt-auto space-y-1.5 border-t border-[var(--studio-line)] pt-4">
                  {item.includes.map((line) => (
                    <li
                      key={line}
                      className="flex gap-2 text-[12.5px] leading-relaxed text-[var(--studio-ink-soft)]"
                    >
                      <span
                        className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--studio-signal)]"
                        aria-hidden
                      />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16 border-l-2 border-[var(--studio-signal)]/55 pl-5 sm:pl-6">
        <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--studio-signal)]">
          <Sparkles className="h-3.5 w-3.5" />
          Nothing here fits? That&rsquo;s completely fine.
        </p>
        <h2 className="mt-3 max-w-2xl text-balance text-[1.45rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--studio-ink)] sm:text-[1.7rem]">
          Describe it in your own words. We turn the fuzzy version into a scoped plan.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--studio-ink-soft)]">
          Links, sketches, a list of must-haves, or a rough idea. Studio returns indicative cost,
          timeline, how deposit and proof work, and what we need from you next. No pressure to
          commit on day one.
        </p>
        <Link
          href="/request?preset=custom-app"
          className="studio-button-primary mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
        >
          Describe a fully custom build
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}
