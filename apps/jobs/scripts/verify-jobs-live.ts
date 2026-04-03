import fs from "fs";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";
import { spawn, spawnSync } from "child_process";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..", "..");

type Actor = {
  userId: string;
  email: string;
  fullName: string;
  role: string | null;
};

type JobsDataModule = {
  getAnalyticsSnapshot: () => Promise<{
    totalJobs: number;
    applications: number;
    [key: string]: unknown;
  }>;
  getApplicationTimeline: (applicationId: string) => Promise<Array<{ action: string }>>;
  getCandidateDashboardData: (userId: string) => Promise<{
    profile: { fullName?: string | null } | null;
    documents: Array<unknown>;
    savedJobs: Array<{ job: { slug: string } }>;
    applications: Array<{ applicationId: string; stage: string }>;
    alerts: Array<{ label: string }>;
  }>;
  getEmployerDashboardData: (userId: string, email?: string | null) => Promise<{
    jobs: Array<{ slug: string }>;
    applications: Array<{ applicationId: string }>;
  }>;
  getJobsHomeData: () => Promise<{
    featuredJobs: Array<unknown>;
    latestJobs: Array<unknown>;
    employers: Array<unknown>;
  }>;
  getModerationQueue: () => Promise<{
    pendingEmployers: Array<{ slug: string }>;
  }>;
  getRecruiterOverviewData: () => Promise<{
    jobs: Array<{ slug: string }>;
    applications: Array<{ applicationId: string }>;
  }>;
};

type JobsWriteModule = {
  addApplicationNote: (input: { actor: Actor; applicationId: string; note: string }) => Promise<void>;
  advanceApplicationStage: (input: {
    actor: Actor;
    applicationId: string;
    stage: string;
    note?: string | null;
  }) => Promise<void>;
  createEmployerProfile: (input: { actor: Actor; formData: FormData }) => Promise<{ employerSlug: string }>;
  createJobPost: (input: { actor: Actor; formData: FormData }) => Promise<{ slug: string }>;
  saveCandidateProfile: (input: {
    actor: Actor;
    email?: string | null;
    fullName?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
    formData: FormData;
  }) => Promise<void>;
  submitApplication: (input: { actor: Actor; formData: FormData }) => Promise<{ applicationId: string }>;
  toggleSavedJob: (input: { actor: Actor; jobSlug: string }) => Promise<{ saved: boolean }>;
  updateEmployerVerification: (input: {
    actor: Actor;
    employerSlug: string;
    status: "pending" | "verified" | "watch" | "rejected";
    reason?: string | null;
  }) => Promise<void>;
  uploadCandidateAsset: (input: { actor: Actor; kind: string; file: File }) => Promise<unknown>;
  upsertJobAlert: (input: {
    actor: Actor;
    label: string;
    criteria: Record<string, unknown>;
  }) => Promise<{ id?: string | null } | null>;
};

type MagicLinkAdminClient = {
  auth: {
    admin: {
      generateLink: (...args: unknown[]) => Promise<unknown>;
    };
  };
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function loadEnv() {
  const text = fs.readFileSync(path.resolve(repoRoot, ".env.local"), "utf8").replace(/^\uFEFF/, "");

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
    process.env[match[1]] = value;
  }
}

function updateCookieJar(jar: Map<string, string>, setCookies: string[]) {

  for (const cookie of setCookies) {
    const match = cookie.match(/^([^=;]+)=([^;]*)/);
    if (!match) continue;
    jar.set(match[1], match[2]);
  }
}

function serializeCookieJar(jar: Map<string, string>) {
  return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

async function getAvailablePort(preferredPort: number) {
  const tryPort = (port: number) =>
    new Promise<number>((resolve, reject) => {
      const server = net.createServer();

      server.unref();
      server.on("error", reject);
      server.listen(port, () => {
        const address = server.address();
        const resolvedPort = typeof address === "object" && address ? address.port : port;
        server.close((closeError) => {
          if (closeError) {
            reject(closeError);
            return;
          }
          resolve(resolvedPort);
        });
      });
    });

  try {
    return await tryPort(preferredPort);
  } catch {
    return tryPort(0);
  }
}

async function startJobsServer(port: number) {
  const child =
    process.platform === "win32"
      ? spawn(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "pnpm --filter @henryco/jobs start"], {
          cwd: repoRoot,
          env: {
            ...process.env,
            PORT: String(port),
          },
          stdio: ["ignore", "pipe", "pipe"],
        })
      : spawn("pnpm", ["--filter", "@henryco/jobs", "start"], {
          cwd: repoRoot,
          env: {
            ...process.env,
            PORT: String(port),
          },
          stdio: ["ignore", "pipe", "pipe"],
        });

  let stdout = "";
  let stderr = "";

  child.stdout.on("data", (chunk) => {
    stdout += String(chunk);
  });

  child.stderr.on("data", (chunk) => {
    stderr += String(chunk);
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timed out waiting for jobs server.\n${stdout}\n${stderr}`));
    }, 30000);

    const onExit = () => {
      clearTimeout(timeout);
      reject(new Error(`Jobs server exited early.\n${stdout}\n${stderr}`));
    };

    child.once("exit", onExit);

    const interval = setInterval(async () => {
      if (stdout.includes("Ready in")) {
        clearTimeout(timeout);
        clearInterval(interval);
        child.off("exit", onExit);
        resolve();
        return;
      }

      try {
        const res = await fetch(`http://127.0.0.1:${port}/`);
        if (res.status < 500) {
          clearTimeout(timeout);
          clearInterval(interval);
          child.off("exit", onExit);
          resolve();
        }
      } catch {
        // keep waiting
      }
    }, 500);
  });

  return {
    child,
    getStdout: () => stdout,
    getStderr: () => stderr,
  };
}

function stopJobsServer(child: ReturnType<typeof spawn>) {
  if (!child.pid) {
    return;
  }

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
    });
    return;
  }

  child.kill("SIGTERM");
}

async function withServer<T>(port: number, task: () => Promise<T>) {
  const server = await startJobsServer(port);

  try {
    return await task();
  } finally {
    stopJobsServer(server.child);
  }
}

async function authenticateViaMagicLink(input: {
  supabase: unknown;
  email: string;
  redirectTo: string;
}) {
  const client = input.supabase as MagicLinkAdminClient;
  const generated = (await client.auth.admin.generateLink({
    type: "magiclink",
    email: input.email,
    options: {
      redirectTo: input.redirectTo,
    },
  })) as {
    data?: { properties?: { action_link?: string | null } | null } | null;
    error?: { message?: string | null } | null;
  };

  assert(
    generated.data?.properties?.action_link,
    generated.error?.message || `Could not generate a magic link for ${input.email}.`
  );

  const jar = new Map<string, string>();
  const verifyResponse = await fetch(generated.data.properties.action_link, {
    redirect: "manual",
  });

  updateCookieJar(jar, verifyResponse.headers.getSetCookie());
  const callbackLocation = verifyResponse.headers.get("location");

  assert(
    callbackLocation && verifyResponse.status >= 300 && verifyResponse.status < 400,
    `Magic-link verification did not redirect for ${input.email}.`
  );

  const callbackUrl = new URL(callbackLocation, generated.data.properties.action_link);
  const hashParams = new URLSearchParams(callbackUrl.hash.replace(/^#/, ""));
  const code = callbackUrl.searchParams.get("code");
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");

  assert(
    code || (accessToken && refreshToken),
    `Magic-link redirect did not include a code or session tokens for ${input.email}.`
  );

  const sessionResponse = await fetch(`${callbackUrl.origin}/auth/session`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/json",
      ...(jar.size > 0 ? { cookie: serializeCookieJar(jar) } : {}),
    },
    body: JSON.stringify({
      code,
      accessToken,
      refreshToken,
    }),
  });

  updateCookieJar(jar, sessionResponse.headers.getSetCookie());
  const sessionText = await sessionResponse.text();

  assert(
    sessionResponse.ok,
    `Could not establish a Jobs session for ${input.email}.\n${sessionText}`
  );

  return {
    status: sessionResponse.status,
    cookieHeader: serializeCookieJar(jar),
    finalUrl: callbackUrl.toString(),
    text: sessionText,
  };
}

async function fetchPage(pathname: string, options?: { port: number; cookieHeader?: string }) {
  const response = await fetch(`http://127.0.0.1:${options?.port ?? 3210}${pathname}`, {
    redirect: "manual",
    headers: options?.cookieHeader ? { cookie: options.cookieHeader } : undefined,
  });
  const text = await response.text();
  return {
    status: response.status,
    location: response.headers.get("location"),
    text,
  };
}

async function main() {
  loadEnv();

  assert(process.env.NEXT_PUBLIC_SUPABASE_URL, "Missing NEXT_PUBLIC_SUPABASE_URL.");
  assert(process.env.SUPABASE_SERVICE_ROLE_KEY, "Missing SUPABASE_SERVICE_ROLE_KEY.");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const dataModule = await import("../lib/jobs/data");
  const writeModule = await import("../lib/jobs/write");
  const cronModule = await import("../app/api/cron/jobs-alerts/route");
  const data = ((dataModule as unknown as { default?: JobsDataModule }).default ??
    (dataModule as unknown as JobsDataModule)) as JobsDataModule;
  const write = ((writeModule as unknown as { default?: JobsWriteModule }).default ??
    (writeModule as unknown as JobsWriteModule)) as JobsWriteModule;

  const [ownerProfileRes, managerProfileRes, authUsersRes] = await Promise.all([
    supabase.from("owner_profiles").select("*").eq("is_active", true).order("created_at", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("profiles").select("*").eq("role", "manager").eq("is_active", true).order("created_at", { ascending: true }).limit(1).maybeSingle(),
    supabase.auth.admin.listUsers({ page: 1, perPage: 200 }),
  ]);

  const users = authUsersRes.data.users ?? [];
  const userById = new Map(users.map((user) => [user.id, user]));
  const ownerUser = ownerProfileRes.data?.user_id ? userById.get(ownerProfileRes.data.user_id) : null;
  const managerUser = managerProfileRes.data?.id ? userById.get(managerProfileRes.data.id) : null;
  const candidateUser =
    users.find((user) => user.email && user.id !== ownerUser?.id && user.id !== managerUser?.id) ?? null;

  assert(ownerUser?.email, "No owner auth user is available for verification.");
  assert(managerUser?.email, "No manager auth user is available for verification.");
  assert(candidateUser?.email, "No candidate-capable auth user is available for verification.");

  const ownerActor: Actor = {
    userId: ownerUser.id,
    email: ownerUser.email.toLowerCase(),
    fullName:
      String(ownerProfileRes.data?.full_name || ownerUser.user_metadata?.full_name || ownerUser.user_metadata?.name || "HenryCo Owner"),
    role: "owner",
  };
  const managerActor: Actor = {
    userId: managerUser.id,
    email: managerUser.email.toLowerCase(),
    fullName:
      String(managerProfileRes.data?.full_name || managerUser.user_metadata?.full_name || managerUser.user_metadata?.name || "HenryCo Recruiter"),
    role: "manager",
  };
  const candidateActor: Actor = {
    userId: candidateUser.id,
    email: candidateUser.email.toLowerCase(),
    fullName: String(candidateUser.user_metadata?.full_name || candidateUser.user_metadata?.name || "HenryCo Candidate"),
    role: null,
  };

  const stamp = Date.now();
  const employerSlug = `ops-systems-lab-${stamp}`;
  const alertLabel = `Remote Ops Alert ${stamp}`;
  const employerName = `Ops Systems Lab ${stamp}`;
  const jobTitle = `Operations Systems Lead ${stamp}`;

  const home = await data.getJobsHomeData();
  assert(home.latestJobs.length >= 3, "Expected seeded public jobs to be available.");
  assert(home.employers.length >= 3, "Expected seeded employer profiles to be available.");

  const profileForm = new FormData();
  profileForm.set("fullName", candidateActor.fullName);
  profileForm.set("phone", "+2349133957084");
  profileForm.set("headline", "Operations systems specialist");
  profileForm.set("summary", "I design clean hiring and operations flows with measurable discipline.");
  profileForm.set("location", "Lagos");
  profileForm.set("timezone", "Africa/Lagos");
  profileForm.set("workModes", "remote, hybrid");
  profileForm.set("roleTypes", "full-time, contract");
  profileForm.set("preferredFunctions", "Operations, Recruitment, Product");
  profileForm.set("skills", "Hiring Ops, Process Design, Candidate Experience, Analytics");
  profileForm.set("portfolioLinks", "https://jobs.henrycogroup.com/talent");
  profileForm.set("salaryExpectation", "₦1,800,000 monthly");
  profileForm.set("availability", "2 weeks");
  profileForm.set(
    "workHistory",
    JSON.stringify([{ company: "HenryCo", title: "Operations Lead", years: "2024-2026" }])
  );
  profileForm.set(
    "education",
    JSON.stringify([{ school: "University of Nigeria", degree: "BSc Business Administration" }])
  );
  profileForm.set(
    "certifications",
    JSON.stringify([{ name: "People Operations and Workforce Planning" }])
  );

  await write.saveCandidateProfile({
    actor: candidateActor,
    email: candidateActor.email,
    fullName: candidateActor.fullName,
    phone: "+2349133957084",
    avatarUrl: null,
    formData: profileForm,
  });

  const resumeFile = new File([`HenryCo Jobs resume ${stamp}`], `henryco-resume-${stamp}.pdf`, {
    type: "application/pdf",
  });
  await write.uploadCandidateAsset({
    actor: candidateActor,
    kind: "resume",
    file: resumeFile,
  });

  const employerForm = new FormData();
  employerForm.set("name", employerName);
  employerForm.set("slug", employerSlug);
  employerForm.set("website", `https://jobs.henrycogroup.com/employers/${employerSlug}`);
  employerForm.set("tagline", "Premium hiring for operations systems talent.");
  employerForm.set(
    "description",
    "A verification sandbox employer used to validate HenryCo Jobs live employer onboarding and trust workflows."
  );
  employerForm.set("industry", "Operations Systems");
  employerForm.set("locations", "Lagos, Remote");
  employerForm.set("headcount", "11-50");
  employerForm.set("remotePolicy", "Hybrid");
  employerForm.set("culturePoints", "High trust, Structured hiring, Calm operations");
  employerForm.set(
    "benefitsHeadline",
    "Serious hiring intent with structured recruiter response and cleaner communication."
  );
  employerForm.set("employerType", "external");

  await write.createEmployerProfile({
    actor: ownerActor,
    formData: employerForm,
  });

  const moderationBefore = await data.getModerationQueue();
  assert(
    moderationBefore.pendingEmployers.some((employer: { slug: string }) => employer.slug === employerSlug),
    "New employer should enter the verification queue before review."
  );

  const jobForm = new FormData();
  jobForm.set("employerSlug", employerSlug);
  jobForm.set("title", jobTitle);
  jobForm.set("subtitle", "Run structured hiring with calmer workflows");
  jobForm.set(
    "summary",
    "Own employer onboarding, candidate pipeline control, and recruiter operating discipline."
  );
  jobForm.set(
    "description",
    "This role validates live job publishing, application intake, stage movement, and candidate dashboards."
  );
  jobForm.set("location", "Remote");
  jobForm.set("category", "Operations");
  jobForm.set("workMode", "remote");
  jobForm.set("employmentType", "Full-time");
  jobForm.set("seniority", "Senior");
  jobForm.set("team", "Hiring Operations");
  jobForm.set("skills", "Operations, Recruiting, Systems");
  jobForm.set("responsibilities", "Design pipeline standards\nOwn review cadence\nImprove recruiter signal");
  jobForm.set("requirements", "5+ years in operations\nStrong hiring systems judgement");
  jobForm.set("benefits", "Remote team\nStructured hiring");
  jobForm.set("salaryMin", "1500000");
  jobForm.set("salaryMax", "2200000");

  const createdJob = await write.createJobPost({
    actor: ownerActor,
    formData: jobForm,
  });

  const savedState = await write.toggleSavedJob({
    actor: candidateActor,
    jobSlug: createdJob.slug,
  });
  assert(savedState.saved === true, "Expected the candidate to save the newly created job.");

  const alertRow = await write.upsertJobAlert({
    actor: candidateActor,
    label: alertLabel,
    criteria: {
      q: "Operations",
      category: "operations",
      mode: "remote",
      internal: "0",
    },
  });

  const applicationForm = new FormData();
  applicationForm.set("jobSlug", createdJob.slug);
  applicationForm.set("coverNote", "I can build calmer recruiting systems with measurable discipline.");
  applicationForm.set("availability", "2 weeks");
  applicationForm.set("salaryExpectation", "₦2,000,000 monthly");

  const applicationResult = await write.submitApplication({
    actor: candidateActor,
    formData: applicationForm,
  });

  await write.addApplicationNote({
    actor: ownerActor,
    applicationId: applicationResult.applicationId,
    note: "Strong application quality and good operational writing.",
  });

  await write.advanceApplicationStage({
    actor: managerActor,
    applicationId: applicationResult.applicationId,
    stage: "shortlisted",
    note: "Moving to shortlist after initial review.",
  });

  await write.updateEmployerVerification({
    actor: managerActor,
    employerSlug,
    status: "verified",
    reason: "Verified after identity and employer intent review.",
  });

  const cronResponse = await cronModule.GET();
  const cronPayload = await cronResponse.json();

  const candidateDashboard = await data.getCandidateDashboardData(candidateActor.userId);
  const employerDashboard = await data.getEmployerDashboardData(ownerActor.userId, ownerActor.email);
  const recruiterOverview = await data.getRecruiterOverviewData();
  const moderationAfter = await data.getModerationQueue();
  const analytics = await data.getAnalyticsSnapshot();
  const applicationTimeline = await data.getApplicationTimeline(applicationResult.applicationId);

  const candidateApplication = candidateDashboard.applications.find(
    (application: { applicationId: string }) => application.applicationId === applicationResult.applicationId
  );

  assert(candidateDashboard.profile?.fullName, "Candidate profile should exist after saving.");
  assert(candidateDashboard.documents.length >= 1, "Candidate documents should include the uploaded resume.");
  assert(
    candidateDashboard.savedJobs.some((item: { job: { slug: string } }) => item.job.slug === createdJob.slug),
    "Candidate saved jobs should include the created role."
  );
  assert(candidateApplication?.stage === "shortlisted", "Candidate application should have moved to shortlisted.");
  assert(candidateDashboard.alerts.some((alert: { label: string }) => alert.label === alertLabel), "Candidate alert should exist.");
  assert(
    employerDashboard.jobs.some((job: { slug: string }) => job.slug === createdJob.slug),
    "Employer dashboard should include the created role."
  );
  assert(
    employerDashboard.applications.some(
      (application: { applicationId: string }) => application.applicationId === applicationResult.applicationId
    ),
    "Employer dashboard should include the submitted candidate application."
  );
  assert(
    recruiterOverview.jobs.some((job: { slug: string }) => job.slug === createdJob.slug),
    "Recruiter overview should include the created role."
  );
  assert(
    recruiterOverview.applications.some(
      (application: { applicationId: string }) => application.applicationId === applicationResult.applicationId
    ),
    "Recruiter overview should include the candidate application."
  );
  assert(
    moderationAfter.pendingEmployers.every((employer: { slug: string }) => employer.slug !== employerSlug),
    "Employer should leave the moderation queue after verification."
  );
  assert(analytics.totalJobs >= 4, "Analytics should count the newly created job.");
  assert(analytics.applications >= 1, "Analytics should count the submitted application.");
  assert(
    applicationTimeline.some((event: { action: string }) => event.action === "jobs_application_stage_changed"),
    "Application timeline should include the shortlist transition."
  );
  assert(cronPayload.ok === true, "Jobs alert cron should run successfully.");

  const { data: dispatchAuditRows } = await supabase
    .from("audit_logs")
    .select("action,reason,entity_id,entity_type,created_at")
    .in("action", [
      "jobs_email_sent",
      "jobs_email_failed",
      "jobs_email_queued",
      "jobs_whatsapp_sent",
      "jobs_whatsapp_failed",
      "jobs_whatsapp_skipped",
    ])
    .order("created_at", { ascending: false })
    .limit(120);

  const relevantEntityIds = new Set([
    applicationResult.applicationId,
    employerSlug,
    String(alertRow?.id || ""),
  ]);

  const relatedDispatches = (dispatchAuditRows ?? []).filter((row) => relevantEntityIds.has(String(row.entity_id)));
  assert(
    relatedDispatches.some((row) => String(row.action).startsWith("jobs_email_")),
    "Expected email dispatch audit rows for the verified workflows."
  );
  assert(
    relatedDispatches.some((row) => String(row.action).startsWith("jobs_whatsapp_")),
    "Expected WhatsApp dispatch audit rows for the verified workflows."
  );

  const port = await getAvailablePort(3210);
  const authenticatedRouteChecks = await withServer(port, async () => {
    const publicRoutes = [
      { path: "/", needle: "Hiring, verified talent" },
      { path: "/jobs", needle: "Search without the clutter tax" },
      { path: `/jobs/${createdJob.slug}`, needle: jobTitle },
      { path: `/employers/${employerSlug}`, needle: employerName },
    ];

    for (const route of publicRoutes) {
      const page = await fetchPage(route.path, { port });
      assert(page.status === 200, `Public route ${route.path} should return 200.`);
      assert(page.text.toLowerCase().includes(route.needle.toLowerCase()), `Public route ${route.path} should render live content.`);
    }

    const candidateSession = await authenticateViaMagicLink({
      supabase,
      email: candidateActor.email,
      redirectTo: `http://127.0.0.1:${port}/auth/callback?next=/candidate`,
    });
    const candidateHub = await fetchPage("/candidate", { port, cookieHeader: candidateSession.cookieHeader });
    const candidateApplicationsPage = await fetchPage("/candidate/applications", {
      port,
      cookieHeader: candidateSession.cookieHeader,
    });
    const candidateFilesPage = await fetchPage("/candidate/files", {
      port,
      cookieHeader: candidateSession.cookieHeader,
    });

    assert(candidateHub.status === 200 && candidateHub.text.includes("Jobs Module"), "Candidate module should render for the signed-in candidate.");
    assert(
      candidateApplicationsPage.status === 200 &&
        candidateApplicationsPage.text.includes("Applications") &&
        candidateApplicationsPage.text.includes("Operations Systems Lead"),
      "Candidate application history should render the submitted role."
    );
    assert(
      candidateFilesPage.status === 200 && candidateFilesPage.text.includes("Document vault"),
      "Candidate files page should render the document vault."
    );

    const ownerSession = await authenticateViaMagicLink({
      supabase,
      email: ownerActor.email,
      redirectTo: `http://127.0.0.1:${port}/auth/callback?next=/employer`,
    });
    const employerWorkspace = await fetchPage("/employer", { port, cookieHeader: ownerSession.cookieHeader });
    const employerJobsPage = await fetchPage("/employer/jobs", { port, cookieHeader: ownerSession.cookieHeader });
    const employerApplicantsPage = await fetchPage("/employer/applicants", {
      port,
      cookieHeader: ownerSession.cookieHeader,
    });

    assert(
      employerWorkspace.status === 200 && employerWorkspace.text.includes("Employer Console"),
      "Employer console should render for the employer owner."
    );
    assert(
      employerJobsPage.status === 200 && employerJobsPage.text.includes("Operations Systems Lead"),
      "Employer jobs page should render the created role."
    );
    assert(
      employerApplicantsPage.status === 200 &&
        employerApplicantsPage.text.includes(candidateActor.fullName.split(" ")[0]),
      "Employer applicants page should render the candidate application."
    );

    const managerSession = await authenticateViaMagicLink({
      supabase,
      email: managerActor.email,
      redirectTo: `http://127.0.0.1:${port}/auth/callback?next=/recruiter`,
    });
    const recruiterPage = await fetchPage("/recruiter", { port, cookieHeader: managerSession.cookieHeader });
    const pipelinePage = await fetchPage("/recruiter/pipeline", {
      port,
      cookieHeader: managerSession.cookieHeader,
    });
    const verificationPage = await fetchPage("/recruiter/verification", {
      port,
      cookieHeader: managerSession.cookieHeader,
    });

    assert(
      recruiterPage.status === 200 && recruiterPage.text.includes("Recruiter Console"),
      "Recruiter console should render for the manager account."
    );
    assert(
      pipelinePage.status === 200 && pipelinePage.text.includes("Operations Systems Lead"),
      "Recruiter pipeline should render the live application."
    );
    assert(
      verificationPage.status === 200 && verificationPage.text.includes("Pending employers"),
      "Recruiter verification page should render."
    );

    return {
      candidatePages: [candidateHub.status, candidateApplicationsPage.status, candidateFilesPage.status],
      employerPages: [employerWorkspace.status, employerJobsPage.status, employerApplicantsPage.status],
      recruiterPages: [recruiterPage.status, pipelinePage.status, verificationPage.status],
    };
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        actors: {
          owner: ownerActor.email,
          manager: managerActor.email,
          candidate: candidateActor.email,
        },
        created: {
          employerSlug,
          jobSlug: createdJob.slug,
          applicationId: applicationResult.applicationId,
          alertId: alertRow?.id ?? null,
        },
        snapshots: {
          home: {
            featuredJobs: home.featuredJobs.length,
            employers: home.employers.length,
          },
          candidate: {
            applications: candidateDashboard.applications.length,
            savedJobs: candidateDashboard.savedJobs.length,
            documents: candidateDashboard.documents.length,
            alerts: candidateDashboard.alerts.length,
            stage: candidateApplication?.stage ?? null,
          },
          employer: {
            jobs: employerDashboard.jobs.length,
            applications: employerDashboard.applications.length,
          },
          recruiter: {
            jobs: recruiterOverview.jobs.length,
            applications: recruiterOverview.applications.length,
            pendingEmployers: moderationAfter.pendingEmployers.length,
          },
          analytics,
          cron: cronPayload,
          dispatchAuditActions: relatedDispatches.map((row) => row.action),
          authenticatedRouteChecks,
        },
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
