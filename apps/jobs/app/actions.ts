"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getJobsActorRole, requireJobsRoles, requireJobsUser } from "@/lib/auth";
import {
  addApplicationNote,
  advanceApplicationStage,
  createEmployerProfile,
  createJobPost,
  markJobsNotificationRead,
  reviewJobPost,
  saveCandidateProfile,
  submitApplication,
  toggleSavedJob,
  updateEmployerVerification,
  uploadCandidateAsset,
  upsertJobAlert,
} from "@/lib/jobs/write";

function getSafeReturnTo(formData: FormData) {
  const value = formData.get("returnTo");
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  return trimmed;
}

export async function saveCandidateProfileAction(formData: FormData) {
  const viewer = await requireJobsUser("/candidate/profile");
  await saveCandidateProfile({
    actor: {
      userId: viewer.user!.id,
      email: viewer.user!.email,
      fullName: viewer.user!.fullName,
      role: getJobsActorRole(viewer),
    },
    email: viewer.user!.email,
    fullName: viewer.user!.fullName,
    phone: viewer.user!.phone,
    avatarUrl: viewer.user!.avatarUrl,
    formData,
  });
  revalidatePath("/candidate");
  revalidatePath("/candidate/profile");
  redirect("/candidate/profile?saved=1");
}

export async function uploadCandidateDocumentAction(formData: FormData) {
  const viewer = await requireJobsUser("/candidate/files");
  const file = formData.get("file");
  const kind = typeof formData.get("kind") === "string" ? String(formData.get("kind")) : "resume";
  if (!(file instanceof File)) {
    throw new Error("A file is required.");
  }

  await uploadCandidateAsset({
    actor: {
      userId: viewer.user!.id,
      email: viewer.user!.email,
      fullName: viewer.user!.fullName,
      role: getJobsActorRole(viewer),
    },
    kind,
    file,
  });
  revalidatePath("/candidate");
  revalidatePath("/candidate/files");
  revalidatePath("/candidate/profile");
  redirect("/candidate/files?uploaded=1");
}

export async function toggleSavedJobAction(formData: FormData) {
  const jobSlug = String(formData.get("jobSlug") || "");
  const explicitReturn = getSafeReturnTo(formData);
  const landing = explicitReturn || (jobSlug ? `/jobs/${jobSlug}` : "/jobs");
  const viewer = await requireJobsUser(landing);
  const result = await toggleSavedJob({
    actor: {
      userId: viewer.user!.id,
      email: viewer.user!.email,
      fullName: viewer.user!.fullName,
      role: getJobsActorRole(viewer),
    },
    jobSlug,
  });
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobSlug}`);
  revalidatePath("/candidate");
  revalidatePath("/candidate/saved-jobs");

  redirect(`${landing}?saved=${result.saved ? "1" : "0"}`);
}

export async function createJobAlertAction(formData: FormData) {
  const viewer = await requireJobsUser("/candidate/alerts");
  await upsertJobAlert({
    actor: {
      userId: viewer.user!.id,
      email: viewer.user!.email,
      fullName: viewer.user!.fullName,
      role: getJobsActorRole(viewer),
    },
    label: String(formData.get("label") || "Jobs alert"),
    criteria: {
      q: String(formData.get("q") || ""),
      category: String(formData.get("category") || ""),
      mode: String(formData.get("mode") || ""),
      internal: String(formData.get("internal") || "0"),
    },
  });
  revalidatePath("/candidate/alerts");
  redirect("/candidate/alerts?saved=1");
}

export async function submitApplicationAction(formData: FormData) {
  const jobSlug = String(formData.get("jobSlug") || "");
  const returnTo = getSafeReturnTo(formData) || (jobSlug ? `/jobs/${jobSlug}` : "/candidate/applications");
  const viewer = await requireJobsUser(returnTo);
  const result = await submitApplication({
    actor: {
      userId: viewer.user!.id,
      email: viewer.user!.email,
      fullName: viewer.user!.fullName,
      role: getJobsActorRole(viewer),
    },
    formData,
  });
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobSlug}`);
  revalidatePath("/candidate");
  revalidatePath("/candidate/applications");
  redirect(`/candidate/applications?submitted=${encodeURIComponent(result.applicationId)}`);
}

export async function createEmployerProfileAction(formData: FormData) {
  const viewer = await requireJobsUser("/employer/company");
  const result = await createEmployerProfile({
    actor: {
      userId: viewer.user!.id,
      email: viewer.user!.email,
      fullName: viewer.user!.fullName,
      role: getJobsActorRole(viewer),
    },
    formData,
  });
  revalidatePath("/employer");
  revalidatePath("/employer/company");
  revalidatePath(`/employers/${result.employerSlug}`);
  redirect(`/employer/company?created=${result.employerSlug}`);
}

export async function createJobPostAction(formData: FormData) {
  const viewer = await requireJobsUser("/employer/jobs/new");
  const result = await createJobPost({
    actor: {
      userId: viewer.user!.id,
      email: viewer.user!.email,
      fullName: viewer.user!.fullName,
      role: getJobsActorRole(viewer),
    },
    formData,
  });
  revalidatePath("/employer");
  revalidatePath("/employer/jobs");
  revalidatePath(`/employer/jobs/${result.slug}`);
  revalidatePath("/jobs");
  redirect(`/employer/jobs/${result.slug}?created=1&mode=${encodeURIComponent(result.moderationStatus)}`);
}

export async function advanceApplicationStageAction(formData: FormData) {
  const viewer = await requireJobsRoles(["recruiter", "admin", "owner", "moderator", "employer"]);
  await advanceApplicationStage({
    actor: {
      userId: viewer.user!.id,
      email: viewer.user!.email,
      fullName: viewer.user!.fullName,
      role: getJobsActorRole(viewer),
    },
    applicationId: String(formData.get("applicationId") || ""),
    stage: String(formData.get("stage") || "reviewing"),
    note: String(formData.get("note") || ""),
  });
  revalidatePath("/employer");
  revalidatePath("/employer/applicants");
  revalidatePath("/recruiter");

  const returnTo = getSafeReturnTo(formData);
  if (returnTo) {
    redirect(`${returnTo}?stageUpdated=1`);
  }
}

export async function addApplicationNoteAction(formData: FormData) {
  const viewer = await requireJobsRoles(["recruiter", "admin", "owner", "moderator", "employer"]);
  await addApplicationNote({
    actor: {
      userId: viewer.user!.id,
      email: viewer.user!.email,
      fullName: viewer.user!.fullName,
      role: getJobsActorRole(viewer),
    },
    applicationId: String(formData.get("applicationId") || ""),
    note: String(formData.get("note") || ""),
  });
  revalidatePath("/employer");
  revalidatePath("/recruiter");

  const returnTo = getSafeReturnTo(formData);
  if (returnTo) {
    redirect(`${returnTo}?noteAdded=1`);
  }
}

export async function updateEmployerVerificationAction(formData: FormData) {
  const viewer = await requireJobsRoles(["recruiter", "admin", "owner", "moderator"]);
  await updateEmployerVerification({
    actor: {
      userId: viewer.user!.id,
      email: viewer.user!.email,
      fullName: viewer.user!.fullName,
      role: getJobsActorRole(viewer),
    },
    employerSlug: String(formData.get("employerSlug") || ""),
    status: String(formData.get("status") || "pending") as "pending" | "verified" | "watch" | "rejected",
    reason: String(formData.get("reason") || ""),
  });
  revalidatePath("/moderation");
  revalidatePath("/recruiter");

  const returnTo = getSafeReturnTo(formData);
  const employerSlug = String(formData.get("employerSlug") || "");
  if (returnTo) {
    redirect(`${returnTo}?updated=${encodeURIComponent(employerSlug)}`);
  }
}

export async function reviewJobPostAction(formData: FormData) {
  const viewer = await requireJobsRoles(["recruiter", "admin", "owner", "moderator"]);

  await reviewJobPost({
    actor: {
      userId: viewer.user!.id,
      email: viewer.user!.email,
      fullName: viewer.user!.fullName,
      role: getJobsActorRole(viewer),
    },
    jobSlug: String(formData.get("jobSlug") || ""),
    moderationStatus: String(formData.get("moderationStatus") || "pending_review") as
      | "approved"
      | "pending_review"
      | "flagged"
      | "draft",
    reason: String(formData.get("reason") || ""),
  });

  const jobSlug = String(formData.get("jobSlug") || "");
  revalidatePath("/recruiter");
  revalidatePath("/recruiter/jobs");
  revalidatePath(`/jobs/${jobSlug}`);

  const returnTo = getSafeReturnTo(formData);
  if (returnTo) {
    redirect(`${returnTo}?moderated=${encodeURIComponent(jobSlug)}`);
  }
}

export async function markNotificationReadAction(formData: FormData) {
  const viewer = await requireJobsUser();
  await markJobsNotificationRead({
    actor: {
      userId: viewer.user!.id,
      email: viewer.user!.email,
      fullName: viewer.user!.fullName,
      role: getJobsActorRole(viewer),
    },
    notificationId: String(formData.get("notificationId") || ""),
  });
  revalidatePath("/candidate");
  revalidatePath("/employer");
}
