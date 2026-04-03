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
      name: "HenryCo Group",
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

  const jobs = [
    {
      slug: "head-of-recruitment-operations",
      title: "Head of Recruitment Operations",
      subtitle: "Build the HenryCo hiring operating system",
      employerSlug: "henryco-group",
      employerName: "HenryCo Group",
      categoryName: "Recruitment",
      categorySlug: "recruitment",
      location: "Remote",
      workMode: "hybrid",
      employmentType: "Full-time",
      seniority: "Leadership",
      team: "People Operations",
      summary:
        "Lead recruiter workflow design, trust operations, and scaling of the HenryCo hiring system.",
      description:
        "Own the operating cadence for internal and external hiring, from employer verification through recruiter tooling and pipeline clarity.",
      responsibilities: [
        "Shape pipeline operating standards across roles",
        "Drive candidate trust and moderation policy",
        "Coordinate internal HenryCo hiring execution",
      ],
      requirements: [
        "Strong hiring operations experience",
        "Ability to design process and tooling together",
        "Comfort operating with measurable discipline",
      ],
      benefits: ["Leadership scope", "Cross-division impact", "Remote flexibility"],
      skills: ["Recruitment Operations", "Pipeline Design", "Moderation"],
      featured: true,
      internal: true,
    },
    {
      slug: "senior-fabric-care-operations-manager",
      title: "Senior Fabric Care Operations Manager",
      subtitle: "Service quality, dispatch, and team discipline",
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
        "Own day-to-day execution across garment care, home cleaning, and pickup delivery operations.",
      description:
        "Lead frontline execution, staff coordination, quality checks, and customer confidence across care operations.",
      responsibilities: [
        "Improve booking-to-fulfillment flow",
        "Manage team quality and timing",
        "Coordinate dispatch and service readiness",
      ],
      requirements: [
        "Operations leadership background",
        "High standards for follow-through",
        "Comfort with service metrics",
      ],
      benefits: ["Growth path", "Operational ownership", "Visible business impact"],
      skills: ["Operations", "People Management", "Quality Control"],
      featured: true,
      internal: false,
    },
    {
      slug: "product-designer-studio-systems",
      title: "Product Designer, Studio Systems",
      subtitle: "Design interfaces that feel premium and operationally calm",
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
        "Design high-trust product flows across HenryCo apps and premium client systems.",
      description:
        "Work on navigation, workflow UX, and premium interaction systems across HenryCo Studio delivery surfaces.",
      responsibilities: [
        "Design complex product workflows",
        "Translate systems thinking into crisp interfaces",
        "Work closely with engineering on production detail",
      ],
      requirements: [
        "Strong UI and systems thinking",
        "Portfolio of shipped product work",
        "Comfort with multi-surface SaaS products",
      ],
      benefits: ["Remote-first collaboration", "Product depth", "High design bar"],
      skills: ["Product Design", "UI Systems", "Prototyping"],
      featured: true,
      internal: false,
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
        salaryMin: null,
        salaryMax: null,
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
