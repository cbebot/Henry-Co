import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const text = fs
    .readFileSync(path.resolve(__dirname, "..", "..", "..", ".env.local"), "utf8")
    .replace(/^\uFEFF/, "");
  const env = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
  return env;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 72);
}

async function upsertReferenceActivity(supabase, input) {
  const { data: existing } = await supabase
    .from("customer_activity")
    .select("id")
    .eq("division", "jobs")
    .eq("activity_type", input.activityType)
    .eq("reference_id", input.referenceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const payload = {
    user_id: input.userId,
    division: "jobs",
    activity_type: input.activityType,
    title: input.title,
    description: input.description,
    status: input.status,
    reference_type: input.referenceType,
    reference_id: input.referenceId,
    metadata: input.metadata,
  };

  if (existing?.id) {
    await supabase.from("customer_activity").update(payload).eq("id", existing.id);
    return existing.id;
  }

  const { data } = await supabase.from("customer_activity").insert(payload).select("id").maybeSingle();
  return data?.id ?? null;
}

async function upsertMembership(supabase, input) {
  const { data: existing } = await supabase
    .from("customer_activity")
    .select("id")
    .eq("division", "jobs")
    .eq("activity_type", "jobs_employer_membership")
    .eq("user_id", input.userId)
    .eq("reference_id", input.employerSlug)
    .maybeSingle();

  const payload = {
    user_id: input.userId,
    division: "jobs",
    activity_type: "jobs_employer_membership",
    title: `${input.employerName} employer access`,
    description: "Seeded employer console membership.",
    status: "active",
    reference_type: "jobs_employer",
    reference_id: input.employerSlug,
    metadata: {
      employerSlug: input.employerSlug,
      employerName: input.employerName,
      membershipRole: input.membershipRole,
      normalizedEmail: input.normalizedEmail || null,
    },
  };

  if (existing?.id) {
    await supabase.from("customer_activity").update(payload).eq("id", existing.id);
    return;
  }

  await supabase.from("customer_activity").insert(payload);
}

async function upsertCustomerProfile(supabase, input) {
  if (!input?.id) return;

  await supabase.from("customer_profiles").upsert({
    id: input.id,
    email: input.email || null,
    full_name: input.fullName || null,
    phone: input.phone || null,
    language: "en",
    currency: "NGN",
    is_active: true,
    onboarded_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
  });
}

async function main() {
  const env = loadEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const warnings = [];
  const jobsBaseUrl = "https://jobs.henrycogroup.com";

  const [{ data: usersData }, ownerRows, managerRows] = await Promise.all([
    supabase.auth.admin.listUsers({ page: 1, perPage: 200 }),
    supabase.from("owner_profiles").select("*").eq("is_active", true).order("created_at", { ascending: true }),
    supabase.from("profiles").select("*").eq("role", "manager").eq("is_active", true).order("created_at", { ascending: true }),
  ]);

  const users = usersData?.users ?? [];
  const userById = new Map(users.map((user) => [user.id, user]));
  const ownerProfile = ownerRows.data?.[0] ?? null;
  const managerProfile = managerRows.data?.[0] ?? null;

  const ownerUser = ownerProfile?.user_id ? userById.get(ownerProfile.user_id) : null;
  const managerUser = managerProfile?.id ? userById.get(managerProfile.id) : null;
  const candidateUser =
    users.find((user) => user.id !== ownerUser?.id && user.id !== managerUser?.id && user.email) ?? null;

  const actors = {
    owner: ownerUser
      ? {
          id: ownerUser.id,
          email: ownerUser.email?.toLowerCase() || ownerProfile?.email?.toLowerCase() || null,
          fullName:
            ownerProfile?.full_name ||
            ownerUser.user_metadata?.full_name ||
            ownerUser.user_metadata?.name ||
            "HenryCo Owner",
          phone: ownerProfile?.phone || null,
        }
      : null,
    manager: managerUser
      ? {
          id: managerUser.id,
          email: managerUser.email?.toLowerCase() || null,
          fullName:
            managerProfile?.full_name ||
            managerUser.user_metadata?.full_name ||
            managerUser.user_metadata?.name ||
            "HenryCo Recruiter",
          phone: managerProfile?.phone || null,
        }
      : null,
    candidate: candidateUser
      ? {
          id: candidateUser.id,
          email: candidateUser.email?.toLowerCase() || null,
          fullName:
            candidateUser.user_metadata?.full_name ||
            candidateUser.user_metadata?.name ||
            "HenryCo Candidate",
          phone: null,
        }
      : null,
  };

  if (!actors.owner) {
    warnings.push("No active owner user was found; seeded employer memberships may be incomplete.");
  }
  if (!actors.manager) {
    warnings.push("No active manager profile was found; recruiter queue seed coverage is limited.");
  }
  if (!actors.candidate) {
    warnings.push("No candidate-capable existing auth user was found for smoke verification.");
  }

  for (const actor of Object.values(actors)) {
    if (actor) {
      await upsertCustomerProfile(supabase, actor);
    }
  }

  await supabase.from("company_divisions").upsert(
    {
      slug: "jobs",
      name: "HenryCo Jobs",
      tagline: "Hiring, verified talent, and recruitment operations",
      category: "Jobs",
      status: "active",
      subdomain: "jobs",
      domain: "jobs.henrycogroup.com",
      short_description:
        "Premium hiring, verified talent, and recruiter operations in one calm platform.",
      highlights: [
        "Verified talent trust layer",
        "Employer verification and moderation",
        "Internal and external hiring in one system",
      ],
      who_its_for: ["Candidates", "Employers", "Recruiters", "HenryCo hiring teams"],
      how_it_works: [
        "Candidates build profile strength and apply",
        "Employers verify and post roles",
        "Recruiters move structured pipelines",
      ],
      trust: [
        "Employer verification",
        "Candidate readiness scoring",
        "Audit logging",
        "Moderation queues",
      ],
      accent: "#0E7C86",
      sort_order: 4,
      is_published: true,
      is_featured: true,
      description:
        "HenryCo Jobs is the hiring operating system for HenryCo and trusted external employers.",
      primary_url: jobsBaseUrl,
    },
    { onConflict: "slug" }
  );

  const employers = [
    {
      slug: "henryco-group",
      name: "Henry & Co.",
      category: "Internal Hiring",
      href: "https://henrycogroup.com",
      tagline: "Internal hiring for shared HenryCo teams and division leadership.",
      description:
        "Internal roles across the HenryCo ecosystem, from shared operations to executive hiring tracks.",
      employerType: "internal",
      industry: "Internal Hiring",
      locations: ["Lagos", "Remote"],
      headcount: "Group-wide",
      remotePolicy: "Hybrid by team",
      culturePoints: ["Operator-first", "Trust-heavy", "Calm systems"],
      benefitsHeadline:
        "Internal HenryCo roles with real ownership, cleaner operating systems, and accountable execution.",
      verificationNotes: ["HenryCo internal employer", "Verified by platform owner"],
      trustScore: 92,
      responseSlaHours: 12,
    },
    {
      slug: "care",
      name: "Henry & Co Fabric Care",
      category: "Fabric Care",
      href: "https://care.henrycogroup.com",
      tagline: "Premium garment, home, and office care operations.",
      description:
        "HenryCo Fabric Care hires for service operations, support, logistics coordination, and leadership execution.",
      employerType: "external",
      industry: "Fabric Care",
      locations: ["Enugu", "Lagos"],
      headcount: "11-50",
      remotePolicy: "Hybrid for operations leadership",
      culturePoints: ["Operational precision", "Service discipline", "Clear communication"],
      benefitsHeadline:
        "Frontline service excellence with sharper operations tooling and higher standards.",
      verificationNotes: ["HenryCo division", "Operations reviewed"],
      trustScore: 86,
      responseSlaHours: 18,
    },
    {
      slug: "studio",
      name: "HenryCo Studio",
      category: "Product Studio",
      href: "https://studio.henrycogroup.com",
      tagline: "Premium digital product, brand, and software delivery.",
      description:
        "HenryCo Studio hires for product, design, and engineering execution with a high bar for craft and systems thinking.",
      employerType: "external",
      industry: "Software and Product Design",
      locations: ["Remote", "Lagos"],
      headcount: "1-10",
      remotePolicy: "Remote-first",
      culturePoints: ["Design quality", "Product rigor", "Clean shipping habits"],
      benefitsHeadline:
        "Product work with a higher design bar, real shipping pressure, and cleaner systems.",
      verificationNotes: ["HenryCo division", "Profile reviewed"],
      trustScore: 84,
      responseSlaHours: 16,
    },
  ];

  for (const employer of employers) {
    await supabase.from("companies").upsert(
      {
        slug: employer.slug,
        name: employer.name,
        subdomain: slugify(employer.slug),
        href: employer.href || `${jobsBaseUrl}/employers/${employer.slug}`,
        tagline: employer.tagline,
        description: employer.description,
        category: employer.category,
        status: "active",
        accent: "#0E7C86",
      },
      { onConflict: "slug" }
    );

    await upsertReferenceActivity(supabase, {
      userId: actors.owner?.id || actors.manager?.id || actors.candidate?.id,
      activityType: "jobs_employer_profile",
      status: "active",
      title: employer.name,
      description: employer.description,
      referenceType: "jobs_employer",
      referenceId: employer.slug,
      metadata: {
        employerSlug: employer.slug,
        name: employer.name,
        tagline: employer.tagline,
        description: employer.description,
        employerType: employer.employerType,
        internal: employer.employerType === "internal",
        industry: employer.industry,
        website: employer.href || `${jobsBaseUrl}/employers/${employer.slug}`,
        locations: employer.locations,
        headcount: employer.headcount,
        remotePolicy: employer.remotePolicy,
        culturePoints: employer.culturePoints,
        benefitsHeadline: employer.benefitsHeadline,
        verificationNotes: employer.verificationNotes,
        trustScore: employer.trustScore,
        responseSlaHours: employer.responseSlaHours,
        updatedAt: new Date().toISOString(),
      },
    });

    await upsertReferenceActivity(supabase, {
      userId: actors.owner?.id || actors.manager?.id || actors.candidate?.id,
      activityType: "jobs_employer_verification",
      status: "verified",
      title: `${employer.name} verification`,
      description: "Employer verification is active.",
      referenceType: "jobs_employer",
      referenceId: employer.slug,
      metadata: {
        employerSlug: employer.slug,
        employerName: employer.name,
        status: "verified",
        trustScore: employer.trustScore,
        verificationNotes: employer.verificationNotes,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  /*
   * Seeded role catalog — each role carries realistic 2026 Nigerian-market
   * compensation, specific scope, and measurable outcomes. Salary ranges are
   * annual NGN, banded ~35-55% wide so the public Pay surface reads as
   * informative (not noisy) — ranges always honor the no-zero rule in
   * normalizeSalaryAmount(), so a missing min/max becomes "Up to X" or "X+"
   * rather than the credibility-killing "₦0 - ₦0".
   *
   * Compensation philosophy:
   *  - Studio roles (product/eng/design) trend top-of-market for Lagos+remote
   *    talent because they compete with global remote pay.
   *  - Care roles trend service-business mid-market — strong relative to
   *    local peers, calibrated to operational scope.
   *  - Henry & Co. internal leadership roles sit at the top of the local
   *    band; cross-functional impact + verified-employer trust earns it.
   */
  const jobs = [
    {
      slug: "head-of-recruitment-operations",
      title: "Head of Recruitment Operations",
      subtitle: "Build the HenryCo hiring operating system",
      employerSlug: "henryco-group",
      employerName: "Henry & Co.",
      categoryName: "Recruitment",
      categorySlug: "recruitment",
      location: "Remote",
      workMode: "hybrid",
      employmentType: "Full-time",
      seniority: "Leadership",
      team: "People Operations",
      summary:
        "Own the operating cadence for internal and external hiring across HenryCo — pipeline standards, recruiter tooling, and verified-employer policy.",
      description:
        "You inherit a working hiring system and a verified-employer trust layer. Your job is to lift it from working to industry-leading: tighter pipeline-stage hygiene, sharper recruiter tooling, and a moderation policy that protects candidates without slowing employers down. You'll partner with division heads on senior hiring and report into the platform owner.",
      responsibilities: [
        "Set pipeline-stage definitions and time-in-stage SLAs across all open roles",
        "Lead a team of 3 recruiters and 1 talent-ops specialist; run weekly calibration",
        "Own the verified-employer trust layer: policy, audit cadence, escalation",
        "Drive recruiter tooling roadmap with the engineering partner — what to build, what to buy",
        "Run the senior-hiring partnership for division leadership (Studio, Care, future)",
      ],
      requirements: [
        "8+ years in hiring operations, the last 3 leading recruiter teams",
        "Demonstrated ATS/tooling redesign that materially moved time-to-fill",
        "Track record running structured interview design at scale",
        "Comfort with measurable discipline — you instrument before you ship",
      ],
      benefits: [
        "Leadership scope across the entire HenryCo employer ecosystem",
        "Performance bonus tied to time-to-fill + offer-acceptance rate",
        "Remote-first with quarterly Lagos onsite for division-leader sessions",
        "Direct line to the platform owner on policy decisions",
      ],
      skills: [
        "Recruitment Operations",
        "Pipeline Design",
        "Structured Interviewing",
        "ATS Tooling",
        "Team Leadership",
        "Trust & Moderation",
      ],
      salaryMin: 25_000_000,
      salaryMax: 42_000_000,
      featured: true,
      internal: true,
    },
    {
      slug: "senior-fabric-care-operations-manager",
      title: "Senior Fabric Care Operations Manager",
      subtitle: "Frontline execution, dispatch handoffs, and service NPS",
      employerSlug: "care",
      employerName: "Henry & Co Fabric Care",
      categoryName: "Operations",
      categorySlug: "operations",
      location: "Enugu",
      workMode: "onsite",
      employmentType: "Full-time",
      seniority: "Senior",
      team: "Operations",
      summary:
        "Lead the daily fulfillment loop across garment care, home cleaning, and pickup-delivery — 12-20 frontline staff, measurable quality bar, clear handoffs.",
      description:
        "HenryCo Care runs a premium service operation with a real customer expectation behind every booking. You'll own the daily loop end-to-end: morning dispatch, in-shift quality audits, exception management, and the recovery flow when something slips. Direct ownership of NPS and on-time delivery rate.",
      responsibilities: [
        "Run the morning dispatch and end-of-day reconciliation cadence",
        "Lead a frontline team of 12-20 across garment care, home cleaning, and pickup",
        "Audit service quality on a sampled basis — minimum 3 jobs per shift, written notes",
        "Coordinate the dispatch handoff with the logistics rider pool — pickup windows, recovery if missed",
        "Own NPS and on-time-delivery KPIs; review weekly with the Care division lead",
      ],
      requirements: [
        "5+ years operations leadership in a service or hospitality business",
        "Demonstrated improvement of a measurable service KPI (NPS, on-time rate, rework rate)",
        "Comfort running a frontline team in person — coaching, scheduling, performance",
        "Calm under exception — you reroute the dispatch when a rider drops, not panic",
      ],
      benefits: [
        "Performance bonus tied to NPS and on-time delivery",
        "Operational ownership with direct leverage over your tools and process",
        "Growth track to Care Division Operations lead",
        "Health insurance + 18 days paid leave",
      ],
      skills: [
        "Service Operations",
        "Frontline Team Leadership",
        "Quality Audit",
        "Dispatch Coordination",
        "NPS & SLA Management",
      ],
      salaryMin: 8_000_000,
      salaryMax: 14_000_000,
      featured: true,
      internal: false,
    },
    {
      slug: "product-designer-studio-systems",
      title: "Product Designer, Studio Systems",
      subtitle: "Design the workflow surfaces that ship to premium clients",
      employerSlug: "studio",
      employerName: "HenryCo Studio",
      categoryName: "Design",
      categorySlug: "design",
      location: "Remote",
      workMode: "remote",
      employmentType: "Contract",
      seniority: "Mid-level",
      team: "Product Design",
      summary:
        "Design multi-step product workflows across HenryCo Studio's delivery surfaces and premium client systems — partnering directly with engineering on production fidelity.",
      description:
        "This is a senior-leaning mid-level contract role with a full design partnership. You'll work on navigation, workflow UX, and premium interaction patterns that ship to live clients. Tight pairing with engineering — your work hits production, not just Figma archives.",
      responsibilities: [
        "Design complex multi-step workflows (briefing, payments, deliverables) end-to-end",
        "Maintain and extend the Studio design-token system in lockstep with engineering",
        "Pair with engineering on production fidelity — pixel + interaction + accessibility",
        "Run design critique on a weekly cadence; raise the craft bar across the surface",
      ],
      requirements: [
        "4+ years shipping production product UI in a high-bar org",
        "Portfolio with at least two multi-surface SaaS or workflow products",
        "Strong systems thinking — you design tokens before you design screens",
        "Comfort reading the engineering side: TypeScript, React component contracts",
      ],
      benefits: [
        "Top-of-market remote contract rate",
        "Real shipping pressure with calm operating culture",
        "Direct engineering partnership — no design-handoff theatre",
      ],
      skills: [
        "Product Design",
        "Design Systems",
        "Workflow UX",
        "Prototyping",
        "Tailwind / CSS Variables",
        "Accessibility",
      ],
      salaryMin: 15_000_000,
      salaryMax: 26_000_000,
      featured: true,
      internal: false,
    },
    {
      slug: "senior-backend-engineer-studio",
      title: "Senior Backend Engineer",
      subtitle: "Service architecture, data models, and shipping discipline",
      employerSlug: "studio",
      employerName: "HenryCo Studio",
      categoryName: "Engineering",
      categorySlug: "engineering",
      location: "Remote",
      workMode: "remote",
      employmentType: "Full-time",
      seniority: "Senior",
      team: "Engineering",
      summary:
        "Own service architecture, data-model design, and engineering discipline across the Studio platform. Mentor mid-level engineers and drive testing standards.",
      description:
        "You lead the engineering bar from inside the team — not from a director seat. You'll own service architecture decisions across the Studio platform, design durable data models, and set the testing/observability standard. Direct line to product on what we ship next.",
      responsibilities: [
        "Own service architecture and data-model design across Studio platform services",
        "Mentor 2-3 mid-level engineers — code review, design pairing, weekly 1:1s",
        "Set the testing + observability standard the team operates against",
        "Drive incident postmortems with measurable follow-through, not blame",
        "Partner with the product designer on what's feasible and how to phase it",
      ],
      requirements: [
        "6+ years shipping production services in TypeScript/Node, Go, or Elixir",
        "Strong PostgreSQL fluency — schema design, query plans, RLS",
        "Distributed-systems literacy — queues, retries, idempotency, fan-out",
        "API design discipline — versioning, contracts, deprecation",
        "Demonstrated mentorship of mid-level engineers",
      ],
      benefits: [
        "Top-of-market remote pay calibrated against global benchmarks",
        "Clear technical-leadership career path (no forced people-manager pivot)",
        "Async-first culture; meeting hygiene matches the role's seniority",
        "Conference + learning budget",
      ],
      skills: [
        "TypeScript / Node",
        "PostgreSQL",
        "Distributed Systems",
        "API Design",
        "Observability",
        "Mentorship",
      ],
      salaryMin: 18_000_000,
      salaryMax: 35_000_000,
      featured: true,
      internal: false,
    },
    {
      slug: "frontend-engineer-studio",
      title: "Frontend Engineer (Mid-level)",
      subtitle: "Ship product surfaces in Next.js with design-system rigor",
      employerSlug: "studio",
      employerName: "HenryCo Studio",
      categoryName: "Engineering",
      categorySlug: "engineering",
      location: "Remote",
      workMode: "remote",
      employmentType: "Full-time",
      seniority: "Mid-level",
      team: "Engineering",
      summary:
        "Build production frontend across HenryCo Studio's product surfaces. Strong design-system pairing, real performance budgets, and accessibility as a daily habit.",
      description:
        "Build the surfaces customers actually use. You'll work in Next.js (App Router), TypeScript, and Tailwind, with a design-token system instead of hand-rolled colors. Performance budgets are real (LCP, CLS); accessibility is a habit, not a checklist.",
      responsibilities: [
        "Ship product surfaces in Next.js App Router + TypeScript + Tailwind",
        "Pair with the product designer on workflow UX — you'll catch what Figma hides",
        "Maintain accessibility (WCAG 2.2 AA) and performance (LCP < 2.5s) as default",
        "Write integration tests that catch user-visible regressions, not just unit drift",
      ],
      requirements: [
        "3+ years shipping production React (Next.js or similar)",
        "TypeScript fluency — you read complex generic types without flinching",
        "Tailwind / CSS-variable token systems",
        "Accessibility default — keyboard nav, focus management, ARIA where needed",
      ],
      benefits: [
        "Real design partnership — no fight to ship craft",
        "Async-first, predictable shipping cadence",
        "Career growth into senior with a documented competency ladder",
      ],
      skills: [
        "Next.js / React",
        "TypeScript",
        "Tailwind",
        "Accessibility",
        "Design Systems",
        "Performance",
      ],
      salaryMin: 10_000_000,
      salaryMax: 20_000_000,
      featured: false,
      internal: false,
    },
    {
      slug: "customer-support-lead-care",
      title: "Customer Support Lead",
      subtitle: "Thread quality, agent coaching, and SLA discipline",
      employerSlug: "care",
      employerName: "Henry & Co Fabric Care",
      categoryName: "Customer Support",
      categorySlug: "customer-support",
      location: "Lagos",
      workMode: "hybrid",
      employmentType: "Full-time",
      seniority: "Mid-level",
      team: "Customer Experience",
      summary:
        "Own the support-thread quality bar across HenryCo Care customers. Lead 4-6 agents, instrument response-time SLAs, and run a weekly review cadence with operations.",
      description:
        "Care customers reach us through a shared HenryCo support thread. You'll own the quality and tone of every reply, lead a small support team, and partner with operations on the recovery loop when something goes wrong on the service side.",
      responsibilities: [
        "Audit a sample of support threads weekly — written feedback to each agent",
        "Manage a team of 4-6 support agents; coach against the response-time SLA",
        "Run the weekly review with the Operations Manager — what broke, what we changed",
        "Own escalation paths and refund policy execution",
        "Maintain the response-template library; deprecate stale macros",
      ],
      requirements: [
        "4+ years in customer support, last 1+ year leading agents",
        "Demonstrated SLA improvement (median response time, FCR rate)",
        "Calm tone under complaint — recovery is your craft",
        "Comfort instrumenting your own work in a spreadsheet or BI tool",
      ],
      benefits: [
        "Hybrid (3 days Lagos office)",
        "Performance bonus on response-time + CSAT",
        "Health insurance + 18 days paid leave",
      ],
      skills: [
        "Customer Support Leadership",
        "SLA Management",
        "Agent Coaching",
        "Conflict Resolution",
        "Operational Reporting",
      ],
      salaryMin: 5_000_000,
      salaryMax: 10_000_000,
      featured: false,
      internal: false,
    },
    {
      slug: "logistics-dispatch-operations-lead",
      title: "Logistics Dispatch Operations Lead",
      subtitle: "Route discipline, rider performance, and exception recovery",
      employerSlug: "henryco-group",
      employerName: "Henry & Co.",
      categoryName: "Logistics",
      categorySlug: "logistics",
      location: "Lagos",
      workMode: "onsite",
      employmentType: "Full-time",
      seniority: "Senior",
      team: "Logistics Dispatch",
      summary:
        "Run the daily dispatch board across HenryCo Logistics — route assignment, rider performance, exception recovery, and proof-of-delivery hygiene.",
      description:
        "HenryCo Logistics moves shipments for both internal divisions (Care pickups, Studio courier) and external customers. You're the calm in the dispatch room: route assignment, rider coaching, and recovery when something slips. Direct partnership with the dispatch tooling team on what to build next.",
      responsibilities: [
        "Run the morning dispatch board; assign routes against rider performance",
        "Lead a rider pool of 8-15 across same-day, scheduled, and inter-city",
        "Manage exceptions in real time — failed pickup, attempted delivery, address miss",
        "Audit proof-of-delivery hygiene; reject sloppy captures, coach corrections",
        "Partner with engineering on dispatch tooling roadmap (what to build, what to buy)",
      ],
      requirements: [
        "4+ years dispatch or logistics operations leadership",
        "Comfort with rider performance metrics — utilization, on-time rate, exception rate",
        "Demonstrated calm under exception — you reroute, you don't escalate first",
        "Lagos-based; willing to spend mornings in dispatch through the rush window",
      ],
      benefits: [
        "Onsite Lagos with predictable shift discipline",
        "Performance bonus on on-time rate + exception recovery",
        "Career path into Logistics Division Operations lead",
      ],
      skills: [
        "Dispatch Operations",
        "Rider Performance",
        "Exception Management",
        "Route Optimization",
        "Proof-of-Delivery Workflow",
      ],
      salaryMin: 8_000_000,
      salaryMax: 15_000_000,
      featured: false,
      internal: true,
    },
    {
      slug: "talent-acquisition-specialist",
      title: "Talent Acquisition Specialist",
      subtitle: "Own pipelines for 3-5 concurrent roles across HenryCo",
      employerSlug: "henryco-group",
      employerName: "Henry & Co.",
      categoryName: "Recruitment",
      categorySlug: "recruitment",
      location: "Remote",
      workMode: "remote",
      employmentType: "Full-time",
      seniority: "Mid-level",
      team: "People Operations",
      summary:
        "Own end-to-end pipelines for 3-5 concurrent HenryCo roles — calibration, sourcing, structured interviewing, and offer execution.",
      description:
        "You'll work directly under the Head of Recruitment Operations on live pipelines for HenryCo internal and verified external employers. Real role ownership, not a coordinator function — calibration meetings with hiring managers, sourcing strategy, structured interview design, offer negotiation.",
      responsibilities: [
        "Own 3-5 concurrent role pipelines end-to-end",
        "Run calibration meetings with hiring managers; align on must-haves vs. nice-to-haves",
        "Source through targeted channels — referrals, LinkedIn, niche communities",
        "Design and run structured interview loops; instrument for fairness",
        "Drive offer negotiation with realistic, market-anchored expectations",
      ],
      requirements: [
        "3+ years in-house or agency recruiting",
        "Track record on technical or operational role hiring",
        "Strong calibration discipline — you push back on hiring-manager wishlists",
        "Comfort with structured interview design and rubrics",
      ],
      benefits: [
        "Cross-division exposure (Studio, Care, future divisions)",
        "Methodology coaching from the Head of Recruitment Operations",
        "Remote-first with quarterly Lagos onsite",
      ],
      skills: [
        "Full-Cycle Recruiting",
        "Pipeline Management",
        "Structured Interviewing",
        "Offer Negotiation",
        "Sourcing",
      ],
      salaryMin: 6_000_000,
      salaryMax: 12_000_000,
      featured: false,
      internal: true,
    },
    {
      slug: "brand-designer-studio",
      title: "Brand Designer (Contract)",
      subtitle: "Brand systems, identity, and editorial design for premium clients",
      employerSlug: "studio",
      employerName: "HenryCo Studio",
      categoryName: "Design",
      categorySlug: "design",
      location: "Remote",
      workMode: "remote",
      employmentType: "Contract",
      seniority: "Mid-level",
      team: "Brand & Editorial",
      summary:
        "Design brand systems and editorial identity for HenryCo Studio's premium client engagements — multi-surface, system-grade, photography-aware.",
      description:
        "Studio's brand work is editorial-grade: type, color, photography direction, and a brand system that survives a real product roadmap. You'll lead 2-3 concurrent brand engagements with full creative ownership, partnering with the product designer where the brand meets the product surface.",
      responsibilities: [
        "Lead 2-3 concurrent brand engagements end-to-end",
        "Design brand systems with type scale, color tokens, and photography direction",
        "Partner with the product designer where brand meets product surface",
        "Document handoff for client teams — they keep the system after we leave",
      ],
      requirements: [
        "4+ years shipped brand work, portfolio with multiple identities",
        "Editorial sensibility — your work doesn't read as generic 'tech startup'",
        "Comfortable owning photography direction, not just illustration",
        "Documentation discipline — brand systems must survive their designer",
      ],
      benefits: [
        "Top-of-market remote contract rate",
        "Real creative ownership — Studio briefs trust the designer",
        "Cross-pollination with product design on hybrid engagements",
      ],
      skills: [
        "Brand Systems",
        "Editorial Design",
        "Photography Direction",
        "Type Systems",
        "Identity Documentation",
      ],
      salaryMin: 8_000_000,
      salaryMax: 16_000_000,
      featured: false,
      internal: false,
    },
    {
      slug: "finance-operations-analyst",
      title: "Finance Operations Analyst",
      subtitle: "Invoice cadence, account reconciliation, and vendor compliance",
      employerSlug: "henryco-group",
      employerName: "Henry & Co.",
      categoryName: "Finance",
      categorySlug: "finance",
      location: "Remote",
      workMode: "hybrid",
      employmentType: "Full-time",
      seniority: "Mid-level",
      team: "Finance Operations",
      summary:
        "Own the cross-division invoice cadence, account reconciliation, and vendor compliance review for HenryCo's shared finance function.",
      description:
        "HenryCo runs multiple divisions on a shared finance backbone — invoices, payouts, vendor compliance. You'll own the cadence: invoice review, account reconciliation, vendor onboarding, and the monthly close partnership with the platform finance lead.",
      responsibilities: [
        "Run weekly invoice review across all divisions; flag anomalies before they ship",
        "Reconcile cross-division accounts monthly — clean books at month-end",
        "Onboard and review vendors — KYB, compliance attestation, payment terms",
        "Partner with the finance lead on the monthly close",
        "Own the receipt + proof-of-payment audit trail in the shared system",
      ],
      requirements: [
        "3+ years finance ops, accounting, or audit",
        "ICAN/ACCA in progress or completed (preferred, not strictly required)",
        "Comfort with multi-entity reconciliation",
        "Spreadsheet fluency; willingness to learn the BI / SQL side",
      ],
      benefits: [
        "Hybrid (2 days Lagos office)",
        "Health insurance + 18 days paid leave",
        "ICAN/ACCA exam fee reimbursement",
        "Career path into Finance Lead",
      ],
      skills: [
        "Finance Operations",
        "Account Reconciliation",
        "Vendor Compliance",
        "Invoice Review",
        "Multi-Entity Accounting",
      ],
      salaryMin: 7_000_000,
      salaryMax: 14_000_000,
      featured: false,
      internal: true,
    },
  ];

  for (const job of jobs) {
    await upsertReferenceActivity(supabase, {
      userId: actors.owner?.id || actors.manager?.id || actors.candidate?.id,
      activityType: "jobs_post",
      status: "published",
      title: job.title,
      description: job.summary,
      referenceType: "jobs_post",
      referenceId: job.slug,
      metadata: {
        ...job,
        isPublished: true,
        moderationStatus: "approved",
        employerVerification: "verified",
        trustHighlights: ["Verified employer", "Moderated posting", "Structured pipeline"],
        pipelineStages: [
          "applied",
          "reviewing",
          "shortlisted",
          "interview",
          "offer",
          "hired",
          "rejected",
        ],
        salaryMin: job.salaryMin ?? null,
        salaryMax: job.salaryMax ?? null,
        currency: "NGN",
        postedAt: new Date().toISOString(),
        closesAt: null,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  if (actors.owner) {
    for (const employer of employers) {
      await upsertMembership(supabase, {
        userId: actors.owner.id,
        employerSlug: employer.slug,
        employerName: employer.name,
        membershipRole: "owner",
        normalizedEmail: actors.owner.email,
      });
    }
  }

  if (actors.manager) {
    for (const employer of employers) {
      await upsertMembership(supabase, {
        userId: actors.manager.id,
        employerSlug: employer.slug,
        employerName: employer.name,
        membershipRole: employer.slug === "henryco-group" ? "admin" : "recruiter",
        normalizedEmail: actors.manager.email,
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        actors,
        employers: employers.map((item) => item.slug),
        jobs: jobs.map((item) => item.slug),
        warnings,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
