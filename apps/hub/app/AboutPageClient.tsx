"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { getCompany } from "@henryco/brand";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Globe2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";

type AboutItem = {
  label?: string | null;
  value?: string | null;
  title?: string | null;
  body?: string | null;
  text?: string | null;
  image_url?: string | null;
  items?: string[] | null;
};

type AboutSection = {
  id?: string | null;
  eyebrow?: string | null;
  title?: string | null;
  body?: string | null;
  layout?: string | null;
  items?: AboutItem[] | null;
};

export type AboutPageRecord = {
  id?: string | null;
  slug?: string | null;
  title?: string | null;
  subtitle?: string | null;
  sections?: AboutSection[] | null;
  hero_image_url?: string | null;
  updated_at?: string | null;
};

function getRealtimeClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) return null;
  return createClient(url, anon);
}

function toSections(value: unknown): AboutSection[] {
  return Array.isArray(value) ? (value as AboutSection[]) : [];
}

function toItems(value: unknown): AboutItem[] {
  return Array.isArray(value) ? (value as AboutItem[]) : [];
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

function formatUpdatedAt(value?: string | null) {
  if (!value) return "Recently updated";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently updated";

  return `Updated ${date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })}`;
}

export default function AboutPageClient({
  initialData,
}: {
  initialData: AboutPageRecord;
}) {
  const company = getCompany("hub");
  const [page, setPage] = useState<AboutPageRecord>(initialData);

  useEffect(() => {
    setPage(initialData);
  }, [initialData]);

  useEffect(() => {
    const supabase = getRealtimeClient();
    if (!supabase) return;

    const refresh = async () => {
      const { data } = await supabase
        .from("company_pages")
        .select("id, slug, title, subtitle, sections, hero_image_url, updated_at")
        .eq("slug", "about")
        .single();

      if (data) {
        setPage(data as AboutPageRecord);
      }
    };

    const channel = supabase
      .channel("company-pages-about")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "company_pages" },
        (payload) => {
          const slug =
            typeof payload.new === "object" && payload.new && "slug" in payload.new
              ? String(payload.new.slug ?? "")
              : "";

          if (slug === "about") {
            void refresh();
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const accent = company.accent ?? "#C9A227";
  const brand = company.parentBrand ?? "Henry & Co.";
  const title = page.title ?? `${brand} — About`;
  const subtitle =
    page.subtitle ??
    "A premium multi-division company built to scale with clarity, trust, and long-term operating discipline.";

  const sections = useMemo(() => toSections(page.sections), [page.sections]);

  return (
    <div
      className="min-h-screen bg-[#050816] text-white"
      style={{ "--accent": accent } as CSSProperties}
    >
      <Navigation />

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_18%_8%,rgba(201,162,39,0.20),transparent_55%),radial-gradient(1000px_620px_at_82%_18%,rgba(59,130,246,0.14),transparent_58%),radial-gradient(900px_520px_at_50%_100%,rgba(168,85,247,0.12),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.065)_1px,transparent_0)] [background-size:26px_26px] opacity-30" />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pt-20">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-xs font-medium text-white/82 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                <Sparkles className="h-4 w-4 text-[color:var(--accent)]" />
                About the company
              </div>

              <h1 className="mt-6 max-w-5xl text-4xl font-semibold leading-[0.98] tracking-tight text-white sm:text-6xl xl:text-7xl">
                {title}
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-8 text-white/68 sm:text-lg">
                {subtitle}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  Contact company
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-5 py-3 text-sm text-white/88 transition hover:bg-white/10"
                >
                  Back to hub
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <InfoCard
                  icon={<Building2 className="h-5 w-5" />}
                  label="Company brand"
                  value={brand}
                />
                <InfoCard
                  icon={<ShieldCheck className="h-5 w-5" />}
                  label="Positioning"
                  value="Premium"
                />
                <InfoCard
                  icon={<Globe2 className="h-5 w-5" />}
                  label="Page status"
                  value={formatUpdatedAt(page.updated_at)}
                />
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[34px] border border-white/12 bg-white/6 p-4 shadow-[0_30px_120px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.14),transparent_35%),radial-gradient(circle_at_85%_18%,rgba(255,255,255,0.08),transparent_28%)]" />

              <div className="relative">
                {page.hero_image_url ? (
                  <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black/20">
                    <img
                      src={page.hero_image_url}
                      alt={title}
                      className="h-[320px] w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="grid min-h-[320px] place-items-center rounded-[28px] border border-white/10 bg-black/20 p-8 text-center">
                    <div>
                      <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-[color:var(--accent)] text-black">
                        <Building2 className="h-8 w-8" />
                      </div>
                      <h2 className="mt-5 text-2xl font-semibold">Premium company presentation</h2>
                      <p className="mt-3 max-w-md text-sm leading-7 text-white/64">
                        Upload leadership images, company visuals, office photos, and branded assets
                        from admin and this page will present them cleanly here.
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-5 grid gap-3">
                  {[
                    "Dynamic content can be managed from the admin data layer.",
                    "Leadership, mission, story, values, and media blocks can update without redesign.",
                    "The page is ready for long-term corporate presentation and trust-building.",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/72"
                    >
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--accent)]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {sections.length ? (
          <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
            <div className="grid gap-6">
              {sections.map((section, index) => (
                <AboutSectionBlock
                  key={section.id ?? `${section.title ?? "section"}-${index}`}
                  section={section}
                />
              ))}
            </div>
          </section>
        ) : (
          <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
            <div className="rounded-[34px] border border-white/10 bg-white/6 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/58">
                <Sparkles className="h-3.5 w-3.5 text-[color:var(--accent)]" />
                Ready for content
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                This page is connected and ready for live admin content
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/64">
                Add sections like mission, founder story, leadership, history, vision, company
                standards, awards, office locations, and media highlights from the admin dashboard.
                They can render here dynamically.
              </p>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

function AboutSectionBlock({ section }: { section: AboutSection }) {
  const items = toItems(section.items);
  const layout = String(section.layout || "default").toLowerCase();

  return (
    <section className="rounded-[34px] border border-white/10 bg-white/6 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-8">
      {section.eyebrow ? (
        <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/58">
          <Sparkles className="h-3.5 w-3.5 text-[color:var(--accent)]" />
          {section.eyebrow}
        </div>
      ) : null}

      {section.title ? (
        <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
          {section.title}
        </h2>
      ) : null}

      {section.body ? (
        <p className="mt-3 max-w-4xl text-sm leading-7 text-white/64">{section.body}</p>
      ) : null}

      {layout === "stats" ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item, index) => (
            <div
              key={`${item.label ?? item.title ?? "stat"}-${index}`}
              className="rounded-2xl border border-white/10 bg-black/20 p-5"
            >
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                {item.label ?? item.title ?? "Metric"}
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {item.value ?? item.body ?? item.text ?? "—"}
              </div>
            </div>
          ))}
        </div>
      ) : layout === "split" ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {items.map((item, index) => (
            <div
              key={`${item.title ?? item.label ?? "split"}-${index}`}
              className="overflow-hidden rounded-[28px] border border-white/10 bg-black/20"
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.title ?? item.label ?? "Section image"}
                  className="h-56 w-full object-cover"
                />
              ) : null}
              <div className="p-5">
                {(item.title ?? item.label) ? (
                  <h3 className="text-lg font-semibold text-white">
                    {item.title ?? item.label}
                  </h3>
                ) : null}
                {(item.body ?? item.text ?? item.value) ? (
                  <p className="mt-2 text-sm leading-7 text-white/64">
                    {item.body ?? item.text ?? item.value}
                  </p>
                ) : null}
                {toStringArray(item.items).length ? (
                  <ul className="mt-4 space-y-2">
                    {toStringArray(item.items).map((point) => (
                      <li key={point} className="flex gap-2 text-sm text-white/72">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--accent)]" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {items.map((item, index) => (
            <div
              key={`${item.title ?? item.label ?? "item"}-${index}`}
              className="rounded-[28px] border border-white/10 bg-black/20 p-5"
            >
              {(item.title ?? item.label) ? (
                <h3 className="text-lg font-semibold text-white">
                  {item.title ?? item.label}
                </h3>
              ) : null}

              {(item.body ?? item.text ?? item.value) ? (
                <p className="mt-2 text-sm leading-7 text-white/64">
                  {item.body ?? item.text ?? item.value}
                </p>
              ) : null}

              {toStringArray(item.items).length ? (
                <ul className="mt-4 space-y-2">
                  {toStringArray(item.items).map((point) => (
                    <li key={point} className="flex gap-2 text-sm text-white/72">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--accent)]" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-white/52">
        <span className="text-[color:var(--accent)]">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="mt-2 text-lg font-semibold tracking-tight text-white">{value}</div>
    </div>
  );
}
