"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Crown,
  Linkedin,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Users2,
  X,
} from "lucide-react";
import type { CompanyPersonRecord } from "../lib/about-people";

type LeadershipTone = "owner" | "manager" | "featured" | "default";

function sortPeople(a: CompanyPersonRecord, b: CompanyPersonRecord) {
  return Number(a.sort_order ?? 100) - Number(b.sort_order ?? 100);
}

function groupPeople(people: CompanyPersonRecord[]) {
  const published = people
    .filter((person) => person.is_published && person.full_name)
    .sort(sortPeople);

  const owners = published.filter((person) => person.is_owner);
  const management = published.filter((person) => person.is_manager && !person.is_owner);
  const featured = published.filter(
    (person) => person.is_featured && !person.is_owner && !person.is_manager
  );
  const others = published.filter(
    (person) => !person.is_owner && !person.is_manager && !person.is_featured
  );

  return {
    owners,
    management,
    featured,
    others,
  };
}

function initialsFromName(name: string) {
  return name
    .split(" ")
    .map((part) => part.trim()[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getTone(person: CompanyPersonRecord): LeadershipTone {
  if (person.is_owner) return "owner";
  if (person.is_manager) return "manager";
  if (person.is_featured) return "featured";
  return "default";
}

function roleFor(person: CompanyPersonRecord) {
  return (
    person.role_title ||
    person.role_label ||
    person.job_title ||
    person.department ||
    "Leadership profile"
  );
}

function toneLabel(tone: LeadershipTone) {
  if (tone === "owner") return "Owner";
  if (tone === "manager") return "Management";
  if (tone === "featured") return "Featured";
  return "Leadership";
}

function toneClasses(tone: LeadershipTone) {
  if (tone === "owner") {
    return {
      shell: "border-[color:var(--accent)]/30 bg-[color:var(--accent)]/10",
      pill: "border-[color:var(--accent)]/30 bg-[color:var(--accent)]/15 text-[color:var(--accent)]",
    };
  }

  if (tone === "manager") {
    return {
      shell: "border-white/14 bg-white/[0.07]",
      pill: "border-white/12 bg-white/[0.08] text-white/78",
    };
  }

  if (tone === "featured") {
    return {
      shell: "border-sky-400/20 bg-sky-400/10",
      pill: "border-sky-400/25 bg-sky-400/10 text-sky-200",
    };
  }

  return {
    shell: "border-white/10 bg-white/[0.06]",
    pill: "border-white/10 bg-white/[0.06] text-white/72",
  };
}

function PersonAvatar({
  person,
  sizeClassName = "h-20 w-20",
}: {
  person: CompanyPersonRecord;
  sizeClassName?: string;
}) {
  const cleanSrc = person.photo_url?.trim() || "";
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  return cleanSrc && failedSrc !== cleanSrc ? (
    <img
      src={cleanSrc}
      alt={person.full_name}
      className={`${sizeClassName} rounded-3xl border border-white/12 object-cover shadow-[0_14px_36px_rgba(0,0,0,0.28)]`}
      loading="lazy"
      decoding="async"
      onLoad={() => setFailedSrc(null)}
      onError={() => setFailedSrc(cleanSrc)}
    />
  ) : (
    <div
      className={`grid ${sizeClassName} place-items-center rounded-3xl border border-white/12 bg-black/25 text-lg font-semibold text-white/88 shadow-[0_14px_36px_rgba(0,0,0,0.28)]`}
    >
      {initialsFromName(person.full_name)}
    </div>
  );
}

function ToneIcon({ tone }: { tone: LeadershipTone }) {
  if (tone === "owner") return <Crown className="h-3.5 w-3.5" />;
  if (tone === "manager") return <ShieldCheck className="h-3.5 w-3.5" />;
  if (tone === "featured") return <Star className="h-3.5 w-3.5" />;
  return <BriefcaseBusiness className="h-3.5 w-3.5" />;
}

function PersonPills({ person, tone }: { person: CompanyPersonRecord; tone: LeadershipTone }) {
  const classes = toneClasses(tone);

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${classes.pill}`}
      >
        <ToneIcon tone={tone} />
        {toneLabel(tone)}
      </span>

      {person.division_slug ? (
        <span className="inline-flex items-center rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-white/56">
          {person.division_slug.replace(/-/g, " ")}
        </span>
      ) : null}
    </div>
  );
}

function PersonCard({
  person,
  onOpen,
}: {
  person: CompanyPersonRecord;
  onOpen: () => void;
}) {
  const tone = getTone(person);
  const classes = toneClasses(tone);
  const bioPreview = person.short_bio || person.long_bio || person.bio;
  const canOpen = Boolean(person.long_bio || person.bio);

  return (
    <article
      className={`group relative overflow-hidden rounded-[30px] border p-6 shadow-[0_20px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_100px_rgba(0,0,0,0.24)] ${classes.shell}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(600px_140px_at_50%_0%,rgba(255,255,255,0.10),transparent_70%)] opacity-70" />

      <div className="relative flex items-start gap-4">
        <PersonAvatar person={person} />

        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold tracking-tight text-white">{person.full_name}</h3>
          <p className="mt-2 text-sm font-medium text-white/78">{roleFor(person)}</p>
          {person.department ? (
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/42">
              {person.department}
            </p>
          ) : null}
          <PersonPills person={person} tone={tone} />
        </div>
      </div>

      {bioPreview ? (
        <p className="relative mt-5 line-clamp-4 text-sm leading-7 text-white/68">
          {bioPreview}
        </p>
      ) : null}

      {(person.email || person.phone || person.linkedin_url || canOpen) ? (
        <div className="relative mt-5 flex flex-wrap gap-2">
          {person.email ? (
            <a
              href={`mailto:${person.email}`}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-3.5 py-2 text-sm text-white/82 transition hover:bg-white/10"
            >
              <Mail className="h-4 w-4" />
              Contact
            </a>
          ) : null}

          {person.phone ? (
            <a
              href={`tel:${person.phone}`}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-3.5 py-2 text-sm text-white/82 transition hover:bg-white/10"
            >
              <Phone className="h-4 w-4" />
              Call
            </a>
          ) : null}

          {person.linkedin_url ? (
            <a
              href={person.linkedin_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-3.5 py-2 text-sm text-white/82 transition hover:bg-white/10"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </a>
          ) : null}

          {canOpen ? (
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-black/25 px-3.5 py-2 text-sm text-white/86 transition hover:bg-white/10"
            >
              <Sparkles className="h-4 w-4 text-[color:var(--accent)]" />
              Full profile
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function LeadershipSection({
  title,
  eyebrow,
  description,
  icon,
  people,
  onOpen,
}: {
  title: string;
  eyebrow: string;
  description: string;
  icon: React.ReactNode;
  people: CompanyPersonRecord[];
  onOpen: (person: CompanyPersonRecord) => void;
}) {
  if (!people.length) return null;

  return (
    <section className="mt-10 first:mt-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/55">
            <span className="text-[color:var(--accent)]">{icon}</span>
            {eyebrow}
          </div>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">{title}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-white/64">{description}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {people.map((person) => (
          <PersonCard key={person.id} person={person} onOpen={() => onOpen(person)} />
        ))}
      </div>
    </section>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/22 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">{label}</div>
      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function ProfileModal({
  person,
  onClose,
}: {
  person: CompanyPersonRecord;
  onClose: () => void;
}) {
  const tone = getTone(person);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 py-8 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-3xl overflow-hidden rounded-[34px] border border-white/10 bg-[#08101f] shadow-[0_42px_140px_rgba(0,0,0,0.48)]">
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(900px_160px_at_18%_0%,rgba(201,162,39,0.22),transparent_60%),radial-gradient(900px_180px_at_82%_0%,rgba(255,255,255,0.08),transparent_58%)]" />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-white/[0.06] p-2 text-white/80 transition hover:bg-white/10"
          aria-label="Close profile"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <PersonAvatar person={person} sizeClassName="h-24 w-24" />

            <div className="min-w-0 flex-1">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--accent)]">
                Leadership profile
              </div>
              <h3 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                {person.full_name}
              </h3>
              <p className="mt-2 text-sm font-medium text-white/78">{roleFor(person)}</p>
              <PersonPills person={person} tone={tone} />
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <p className="text-sm leading-8 text-white/72">
              {person.long_bio ||
                person.bio ||
                person.short_bio ||
                "This profile is part of the Henry & Co. public leadership board."}
            </p>

            {(person.email || person.phone || person.linkedin_url) ? (
              <div className="flex flex-wrap gap-3">
                {person.email ? (
                  <a
                    href={`mailto:${person.email}`}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-white/86 transition hover:bg-white/10"
                  >
                    <Mail className="h-4 w-4" />
                    {person.email}
                  </a>
                ) : null}
                {person.phone ? (
                  <a
                    href={`tel:${person.phone}`}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-white/86 transition hover:bg-white/10"
                  >
                    <Phone className="h-4 w-4" />
                    {person.phone}
                  </a>
                ) : null}
                {person.linkedin_url ? (
                  <a
                    href={person.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-white/86 transition hover:bg-white/10"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AboutLeadershipGrid({
  people,
}: {
  people: CompanyPersonRecord[];
}) {
  const { owners, management, featured, others } = groupPeople(people);
  const [selected, setSelected] = useState<CompanyPersonRecord | null>(null);
  const board = useMemo(() => [...owners, ...management, ...featured, ...others], [
    owners,
    management,
    featured,
    others,
  ]);
  const spotlight = board[0] ?? null;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!people.length) {
    return (
      <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[34px] border border-white/10 bg-white/[0.06] p-8 text-center shadow-[0_24px_100px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-white/12 bg-white/[0.06] text-[color:var(--accent)]">
            <Users2 className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight text-white">
            Leadership information will appear here
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/64">
            Publish leadership profiles from the owner dashboard to present ownership,
            management, and trusted company representatives in a polished public format.
          </p>
        </div>
      </section>
    );
  }

  const sharedSectionDescription =
    "Profiles in this section reinforce the people, stewardship, and operational accountability behind the Henry & Co. group.";

  return (
    <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.06] shadow-[0_24px_100px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div className="relative border-b border-white/10 px-6 py-8 sm:px-8">
          <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(900px_180px_at_12%_0%,rgba(201,162,39,0.18),transparent_60%),radial-gradient(900px_180px_at_88%_0%,rgba(255,255,255,0.10),transparent_55%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/56">
                <Users2 className="h-3.5 w-3.5 text-[color:var(--accent)]" />
                Leadership board
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Leadership and stewardship
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-8 text-white/64">
                Meet the people shaping Henry & Co. across ownership, public leadership,
                operational direction, and long-term accountability.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <MiniMetric label="Profiles" value={String(board.length)} />
              <MiniMetric label="Ownership" value={String(owners.length)} />
              <MiniMetric label="Management" value={String(management.length)} />
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {spotlight ? (
            <div className="mb-10 grid gap-5 rounded-[32px] border border-[color:var(--accent)]/22 bg-[linear-gradient(135deg,rgba(201,162,39,0.16),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.20)] lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[28px] border border-white/10 bg-black/22 p-5">
                <div className="flex items-start gap-4">
                  <PersonAvatar person={spotlight} sizeClassName="h-24 w-24" />

                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--accent)]">
                      Spotlight profile
                    </div>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                      {spotlight.full_name}
                    </h3>
                    <p className="mt-2 text-sm font-medium text-white/78">
                      {roleFor(spotlight)}
                    </p>
                    <PersonPills person={spotlight} tone={getTone(spotlight)} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-5 rounded-[28px] border border-white/10 bg-black/22 p-6">
                <p className="text-sm leading-8 text-white/70">
                  {spotlight.long_bio ||
                    spotlight.short_bio ||
                    spotlight.bio ||
                    "This leadership profile reflects the individuals responsible for direction, governance, and premium execution across the Henry & Co. group."}
                </p>

                <div className="flex flex-wrap gap-3">
                  {spotlight.email ? (
                    <a
                      href={`mailto:${spotlight.email}`}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                    >
                      <Mail className="h-4 w-4" />
                      Contact
                    </a>
                  ) : null}
                  {spotlight.linkedin_url ? (
                    <a
                      href={spotlight.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-white/86 transition hover:bg-white/10"
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </a>
                  ) : null}
                  {(spotlight.long_bio || spotlight.bio) ? (
                    <button
                      onClick={() => setSelected(spotlight)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-sm text-white/86 transition hover:bg-white/10"
                    >
                      <Sparkles className="h-4 w-4 text-[color:var(--accent)]" />
                      Full profile
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          <LeadershipSection
            title="Ownership"
            eyebrow="Company leadership"
            description={sharedSectionDescription}
            icon={<Crown className="h-4 w-4" />}
            people={owners.filter((person) => person.id !== spotlight?.id)}
            onOpen={setSelected}
          />

          <LeadershipSection
            title="Management"
            eyebrow="Operational leadership"
            description={sharedSectionDescription}
            icon={<ShieldCheck className="h-4 w-4" />}
            people={management.filter((person) => person.id !== spotlight?.id)}
            onOpen={setSelected}
          />

          <LeadershipSection
            title="Featured team"
            eyebrow="Key representatives"
            description={sharedSectionDescription}
            icon={<Star className="h-4 w-4" />}
            people={featured.filter((person) => person.id !== spotlight?.id)}
            onOpen={setSelected}
          />

          <LeadershipSection
            title="Additional profiles"
            eyebrow="Company representation"
            description={sharedSectionDescription}
            icon={<BriefcaseBusiness className="h-4 w-4" />}
            people={others.filter((person) => person.id !== spotlight?.id)}
            onOpen={setSelected}
          />
        </div>
      </div>

      {selected ? <ProfileModal person={selected} onClose={() => setSelected(null)} /> : null}
    </section>
  );
}
