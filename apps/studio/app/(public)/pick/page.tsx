import Link from "next/link";
import { ArrowRight, Compass, Sparkles } from "lucide-react";

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
    blurb: "A calm, credible site that explains who you are, what you offer, and how to take the next step.",
    audience: "Owners, firms, and teams who need trust at first glance",
    includes: ["Clear story and services", "Contact and location paths", "Mobile-friendly layout", "SEO-ready structure"],
  },
  {
    slug: "ecommerce",
    title: "Online shop",
    blurb: "Sell products with cart, checkout, and a tidy way to track orders—without duct-taping five tools together.",
    audience: "Brands, makers, and sellers ready to grow online",
    includes: ["Product catalog", "Checkout flow", "Order handling basics", "Trust and policy pages"],
  },
  {
    slug: "booking",
    title: "Bookings and appointments",
    blurb: "Let people choose a time, pay a deposit if you want, and reduce endless “what time works?” messages.",
    audience: "Clinics, salons, tutors, trades, and consultants",
    includes: ["Scheduling experience", "Reminder-friendly flows", "Staff-friendly calendar logic", "Optional payments"],
  },
  {
    slug: "real-estate",
    title: "Property and listings",
    blurb: "Show listings, help serious buyers filter, and capture leads that actually convert.",
    audience: "Agents, developers, and property managers",
    includes: ["Listing presentation", "Search and filters", "Lead capture", "High-trust visuals"],
  },
  {
    slug: "logistics",
    title: "Operations and logistics",
    blurb: "Internal screens your team uses daily—status, routes, and simple reporting in one disciplined place.",
    audience: "Dispatch, warehouses, and field teams",
    includes: ["Role-based views", "Operational dashboards", "Reporting basics", "Scalable architecture mindset"],
  },
  {
    slug: "community",
    title: "Community platform",
    blurb: "Members, discussions, and structured access—built for people first, not only for transactions.",
    audience: "Membership groups, associations, and passionate audiences",
    includes: ["Member journeys", "Content and access rules", "Moderation-friendly patterns", "Growth-ready structure"],
  },
  {
    slug: "school-portal",
    title: "School portal",
    blurb: "Parents and students find what they need without hunting—calm layouts that respect busy families.",
    audience: "Schools, academies, and training centres",
    includes: ["Information architecture", "News and resources", "Forms and downloads", "Accessible reading experience"],
  },
  {
    slug: "learning",
    title: "Courses and online learning",
    blurb: "Lessons, member sign-in, and progress people can follow—whether you teach skills or certifications.",
    audience: "Teachers, coaches, and course creators",
    includes: ["Lesson structure", "Member accounts", "Progress tracking", "Payment-ready paths"],
  },
  {
    slug: "church",
    title: "Church or ministry",
    blurb: "Events, giving, and stories that read beautifully on phones and large screens alike.",
    audience: "Congregations and charities",
    includes: ["Event rhythm", "Giving clarity", "Story-driven pages", "Volunteer-friendly updates"],
  },
  {
    slug: "agency",
    title: "Agency or studio website",
    blurb: "Lead with proof—case stories, services, and a confident first impression for new clients.",
    audience: "Creative, marketing, and consulting teams",
    includes: ["Case-led storytelling", "Service clarity", "Lead capture", "Premium presentation"],
  },
  {
    slug: "marketplace",
    title: "Marketplace or multi-seller",
    blurb: "Multiple sellers, listings, and trust signals—commerce that still feels safe for buyers.",
    audience: "Platforms and communities with shared selling",
    includes: ["Seller onboarding patterns", "Listings and trust", "Payments thinking", "Operational moderation hooks"],
  },
  {
    slug: "portfolio",
    title: "Portfolio or personal brand",
    blurb: "Quiet confidence—your best work, your story, and a clear way to hire you or follow you.",
    audience: "Creatives, experts, and public-facing professionals",
    includes: ["Curated work presentation", "Bio and credibility", "Contact and booking hooks", "Fast mobile reading"],
  },
  {
    slug: "web-app-starter",
    title: "Custom web app starter",
    blurb: "A focused first version of software in the browser—dashboards, workflows, or internal tools done properly.",
    audience: "Founders and operators with a process to digitize",
    includes: ["Discovery-shaped MVP", "Auth and roles thinking", "Data model sanity", "Roadmap beyond day one"],
  },
  {
    slug: "mobile",
    title: "Mobile app (phone)",
    blurb: "A real installable app—planned, built, and released with the same discipline as our web work.",
    audience: "Teams with members, fans, or field staff on phones",
    includes: ["Platform guidance", "Release planning", "Core feature set", "Ongoing support"],
  },
];

export default function StudioPickPage() {
  return (
    <main className="mx-auto max-w-[92rem] px-5 pb-24 pt-8 sm:px-8 lg:px-10">
      <section className="studio-panel studio-hero studio-mesh rounded-[2.8rem] px-7 py-10 sm:px-12 sm:py-12">
        <div className="studio-kicker">Ready-to-start paths</div>
        <h1 className="studio-display mt-5 max-w-3xl text-balance text-[var(--studio-ink)]">
          Pick the project closest to yours. We tune the brief from there.
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-[var(--studio-ink-soft)] sm:text-lg">
          Business sites, commerce, booking, portals, custom software, mobile &mdash; each path pre-fills the brief. Every answer stays editable; nothing is final until you confirm scope and price.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/request"
            className="studio-button-secondary inline-flex items-center gap-2 rounded-full px-6 py-4 text-sm font-semibold"
          >
            <Compass className="h-4 w-4" />
            Open a free-form brief instead
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--studio-line)] px-6 py-4 text-sm font-semibold text-[var(--studio-ink-soft)] transition hover:border-[rgba(151,244,243,0.28)] hover:text-[var(--studio-ink)]"
          >
            Compare fixed packages
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--studio-signal)]">Curated project types</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--studio-ink)] sm:text-3xl">
              Browse, compare, tap once to start
            </h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-[var(--studio-ink-soft)]">
            “What’s included” is a guide—we tailor scope on every build.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {READY_TYPES.map((item) => (
            <Link
              key={item.slug}
              href={`/request?preset=${item.slug}`}
              className="group flex flex-col rounded-[1.8rem] border border-[var(--studio-line)] bg-black/10 p-6 transition hover:border-[rgba(151,244,243,0.32)]"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold leading-snug text-[var(--studio-ink)]">{item.title}</h3>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[var(--studio-signal)] transition group-hover:translate-x-0.5" />
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">{item.blurb}</p>
              <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-[var(--studio-signal)]">
                Often for
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--studio-ink-soft)]">{item.audience}</p>
              <ul className="mt-4 space-y-1.5 border-t border-[var(--studio-line)] pt-4">
                {item.includes.map((line) => (
                  <li key={line} className="flex gap-2 text-xs leading-5 text-[var(--studio-ink-soft)]">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--studio-signal)]" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-14 rounded-[2rem] border border-[var(--studio-line)] bg-black/10 px-6 py-8 sm:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-[var(--studio-line)] bg-black/20 p-3 text-[var(--studio-signal)]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">Nothing here fits? That is completely fine.</h2>
              <p className="mt-2 max-w-xl text-sm leading-7 text-[var(--studio-ink-soft)]">
                Describe it in your own words &mdash; links, sketches, a list of must-haves, or a rough idea. Studio turns the fuzzy version into a scoped plan: indicative cost, timeline, how deposit and proof work, and what we need from you next. No pressure to commit on day one.
              </p>
            </div>
          </div>
          <Link
            href="/request?preset=custom-app"
            className="studio-button-primary inline-flex shrink-0 items-center justify-center rounded-full px-8 py-4 text-sm font-semibold"
          >
            Describe a fully custom build
          </Link>
        </div>
      </section>
    </main>
  );
}
