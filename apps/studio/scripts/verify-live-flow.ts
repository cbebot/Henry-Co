import fs from "node:fs";
import path from "node:path";

function loadEnvFile(file: string) {
  if (!fs.existsSync(file)) return;

  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value.replace(/\\r\\n/g, "").trim();
  }
}

const appRoot = process.cwd();
const repoRoot = path.resolve(appRoot, "../..");

for (const file of [
  path.join(repoRoot, ".env.production.vercel"),
  path.join(appRoot, ".env.local"),
  path.join(repoRoot, ".vercel", ".env.production.local"),
]) {
  loadEnvFile(file);
}

process.env.OWNER_ALERT_EMAIL = "delivered@resend.dev";

async function main() {
  const { submitStudioBrief, setMilestoneStatus, setPaymentStatus, createProjectUpdate } = await import(
    "../lib/studio/workflows"
  );
  const { getStudioSnapshot } = await import("../lib/studio/store");
  const { createAdminSupabase } = await import("../lib/supabase");
  const verificationEmail = "delivered@resend.dev";
  const admin = createAdminSupabase();

  let verificationUserId: string | null = null;
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;

    const match = (data.users ?? []).find(
      (user) => String(user.email || "").trim().toLowerCase() === verificationEmail
    );
    if (match?.id) {
      verificationUserId = match.id;
      break;
    }

    if ((data.users ?? []).length < 100) break;
  }

  const stamp = new Date().toISOString();
  const summaryLabel = `QA verification run ${stamp}`;

  const result = await submitStudioBrief({
    userId: verificationUserId,
    customerName: "Studio QA Verification",
    companyName: "HenryCo QA",
    email: verificationEmail,
    phone: "",
    serviceKind: "custom_software",
    businessType: "Technology product or venture-backed business",
    budgetBand: "₦10M to ₦25M",
    urgency: "Priority commercial timeline",
    timeline: "2 to 4 months",
    goals:
      "We need a premium client-facing platform and internal admin layer that improves trust, delivery visibility, and operating efficiency.",
    scopeNotes:
      "Build a client portal with account views, milestone updates, approvals, files, and payment checkpoints plus an internal control surface for project managers and finance.",
    packageIntent: "custom",
    packageId: null,
    preferredTeamId: null,
    referenceLinks: ["https://example.com/reference"],
    techPreferences: ["Supabase", "Best-fit stack recommendation"],
    requiredFeatures: [
      "Admin dashboard",
      "Role-based permissions",
      "Payments and invoicing",
      "Client account area",
      "Automation and notifications",
    ],
    projectType: "Client portal or account workspace",
    platformPreference: "Client portal plus internal operations layer",
    designDirection: "Quiet luxury and high-trust",
    pageRequirements: [
      "Homepage and offer pages",
      "Client account or portal views",
      "Admin dashboard or internal control room",
    ],
    addonServices: ["Copywriting and messaging", "Email lifecycle automation"],
    inspirationSummary: summaryLabel,
    depositNow: true,
    files: [],
  });

  const createdProject = result.project;
  const createdPayment = result.payment;

  if (!createdProject || !createdPayment) {
    throw new Error("Expected the live verification brief to create both a project and a payment record.");
  }

  await setPaymentStatus({
    paymentId: createdPayment.id,
    status: "paid",
  });

  let snapshot = await getStudioSnapshot();
  let project = snapshot.projects.find((item) => item.id === createdProject.id) ?? null;
  if (!project) {
    throw new Error("Created project could not be read back from the Studio snapshot.");
  }

  const reviewMilestone = project.milestones.find((item) => item.status === "in_progress");
  if (reviewMilestone) {
    await setMilestoneStatus({
      projectId: project.id,
      milestoneId: reviewMilestone.id,
      status: "ready_for_review",
    });
  }

  const update = await createProjectUpdate({
    projectId: project.id,
    kind: "qa_verification",
    title: "QA verification update",
    summary: summaryLabel,
    notifyClient: true,
  });

  snapshot = await getStudioSnapshot();
  project = snapshot.projects.find((item) => item.id === createdProject.id) ?? null;

  const lead = snapshot.leads.find((item) => item.id === result.lead.id) ?? null;
  const proposal = snapshot.proposals.find((item) => item.id === result.proposal.id) ?? null;
  const customRequest =
    snapshot.customRequests?.find((item) => item.leadId === result.lead.id) ?? null;
  const payment = snapshot.payments.find((item) => item.id === createdPayment.id) ?? null;

  const relevantEntityIds = [
    result.lead.id,
    result.proposal.id,
    createdProject.id,
    createdPayment.id,
    update.id,
  ].filter(Boolean);

  const notifications = snapshot.notifications.filter((item) =>
    relevantEntityIds.includes(item.entityId ?? "")
  );

  const [
    { data: activityRows, error: activityError },
    { data: customerNotificationRows, error: customerNotificationError },
    { data: pendingSyncRows, error: pendingSyncError },
  ] = await Promise.all([
    admin
      .from("customer_activity")
      .select("id,title,division,reference_type,reference_id,created_at")
      .eq("division", "studio")
      .in("reference_id", relevantEntityIds)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("customer_notifications")
      .select("id,title,category,reference_type,reference_id,created_at")
      .eq("category", "studio")
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("care_security_logs")
      .select("id,event_type,route,email,details,created_at")
      .eq("event_type", "studio_shared_sync_pending")
      .eq("route", "/studio/shared-account")
      .eq("email", verificationEmail)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (activityError) throw activityError;
  if (customerNotificationError) throw customerNotificationError;
  if (pendingSyncError) throw pendingSyncError;

  const relevantCustomerNotifications = (customerNotificationRows ?? []).filter((item) =>
    relevantEntityIds.includes(String(item.reference_id ?? ""))
  );
  const relevantPendingSyncRows = (pendingSyncRows ?? []).filter((item) => {
    const details =
      item && typeof item === "object" && "details" in item && item.details && typeof item.details === "object"
        ? (item.details as { payload?: Record<string, unknown> | null; kind?: string | null })
        : null;
    const payload = details?.payload ?? null;
    const referenceId = String(payload?.reference_id ?? "");
    const invoiceNo = String(payload?.invoice_no ?? "");

    return (
      relevantEntityIds.includes(referenceId) ||
      (invoiceNo && invoiceNo === `STUDIO-${createdPayment.id.slice(0, 8).toUpperCase()}`)
    );
  });

  const requiredTemplates = [
    "inquiry_received",
    "proposal_sent",
    "deposit_received",
    "project_started",
    "project_update",
  ];

  const missingTemplates = requiredTemplates.filter(
    (templateKey) => !notifications.some((item) => item.templateKey === templateKey)
  );
  const failedNotifications = notifications.filter(
    (item) => requiredTemplates.includes(item.templateKey) && item.status === "failed"
  );

  const failures: string[] = [];
  if (!lead) failures.push("Lead was not readable from the Studio snapshot.");
  if (!proposal) failures.push("Proposal was not readable from the Studio snapshot.");
  if (!project) failures.push("Project was not readable from the Studio snapshot.");
  if (!payment || payment.status !== "paid") failures.push("Payment was not marked paid.");
  if (!customRequest) failures.push("Custom request payload was not persisted.");
  if (missingTemplates.length > 0) {
    failures.push(`Missing notification templates: ${missingTemplates.join(", ")}`);
  }
  if (failedNotifications.length > 0) {
    failures.push(
      `Some live email notifications failed: ${failedNotifications
        .map((item) => `${item.templateKey}:${item.reason ?? item.status}`)
        .join(", ")}`
    );
  }
  if ((activityRows ?? []).length === 0 && relevantPendingSyncRows.length === 0) {
    failures.push("No shared customer_activity rows or pending shared-sync records were created for the verification flow.");
  }
  if (relevantCustomerNotifications.length === 0 && relevantPendingSyncRows.length === 0) {
    failures.push("No shared customer_notifications rows or pending shared-sync records were created for the verification flow.");
  }

  const output = {
    identityMode: verificationUserId ? "linked_user" : "pending_email_sync",
    leadId: result.lead.id,
    proposalId: result.proposal.id,
    projectId: createdProject.id,
    paymentId: createdPayment.id,
    updateId: update.id,
    notificationTemplates: notifications.map((item) => ({
      templateKey: item.templateKey,
      status: item.status,
      entityId: item.entityId,
    })),
    sharedActivityCount: (activityRows ?? []).length,
    sharedNotificationCount: relevantCustomerNotifications.length,
    pendingSharedSyncCount: relevantPendingSyncRows.length,
  };

  console.log(JSON.stringify(output, null, 2));

  if (failures.length > 0) {
    throw new Error(failures.join("\n"));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
