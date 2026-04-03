import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const runtimeBucket = "property-runtime";
const ownerEmail = "introvert7519@gmail.com";
const ownerPhone = "+2349133957084";

function parseEnvFile(filepath) {
  return Object.fromEntries(
    readFileSync(filepath, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .filter((line) => !line.trim().startsWith("#"))
      .map((line) => {
        const separator = line.indexOf("=");
        const key = line.slice(0, separator).trim();
        let value = line.slice(separator + 1).trim();

        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        return [key, value.replace(/\r/g, "")];
      })
  );
}

const env = parseEnvFile(resolve(repoRoot, ".env.local"));
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
const publicAuth = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
const authStorageKey = `sb-${new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0]}-auth-token`;

const sharedState = {};

function formByIntent(page, intent) {
  return page.locator("form").filter({
    has: page.locator(`input[name="intent"][value="${intent}"]`),
  });
}

async function listJsonCollection(folder) {
  const { data: files, error } = await admin.storage.from(runtimeBucket).list(folder, {
    limit: 500,
    sortBy: { column: "name", order: "asc" },
  });

  if (error) {
    throw error;
  }

  const records = await Promise.all(
    (files ?? [])
      .filter((file) => file.name.endsWith(".json"))
      .map(async (file) => {
        const { data, error: downloadError } = await admin
          .storage
          .from(runtimeBucket)
          .download(`${folder}/${file.name}`);

        if (downloadError) {
          throw downloadError;
        }

        return JSON.parse(await data.text());
      })
  );

  return records;
}

async function waitForValue(label, reader, predicate, timeoutMs = 30_000) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const value = await reader();
    if (predicate(value)) return value;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 1_000));
  }

  throw new Error(`Timed out waiting for ${label}.`);
}

async function findInquiryByEmail(email) {
  const inquiries = await listJsonCollection("inquiries");
  return inquiries.find((record) => record.email === email) ?? null;
}

async function findViewingByEmail(email) {
  const viewings = await listJsonCollection("viewings");
  return viewings.find((record) => record.attendeeEmail === email) ?? null;
}

async function findListingByTitle(title) {
  const listings = await listJsonCollection("listings");
  return listings.find((record) => record.title === title) ?? null;
}

async function findNotifications(entityId) {
  const notifications = await listJsonCollection("notifications");
  return notifications.filter((record) => record.entityId === entityId);
}

async function findCustomerActivities(referenceId) {
  const { data, error } = await admin
    .from("customer_activity")
    .select("id, activity_type, reference_type, reference_id")
    .eq("reference_id", referenceId);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function findSupportThreads(referenceId) {
  const { data, error } = await admin
    .from("support_threads")
    .select("id, category, reference_type, reference_id")
    .eq("reference_id", referenceId);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function signInAsOwner(page, nextPath) {
  const baseURL = test.info().project.use.baseURL;
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: ownerEmail,
    options: {
      redirectTo: `${baseURL}/auth/callback?next=${encodeURIComponent(nextPath)}`,
    },
  });

  if (error) {
    throw error;
  }

  const { data: verified, error: verifyError } = await publicAuth.auth.verifyOtp({
    token_hash: data.properties.hashed_token,
    type: data.properties.verification_type || "magiclink",
  });

  if (verifyError || !verified?.session) {
    throw verifyError || new Error("Owner session could not be established.");
  }

  const cookieValue = `base64-${Buffer.from(JSON.stringify(verified.session)).toString("base64url")}`;
  const localhostUrl = baseURL.replace("127.0.0.1", "localhost");

  await page.context().addCookies([
    {
      name: authStorageKey,
      value: cookieValue,
      url: baseURL,
      sameSite: "Lax",
    },
    {
      name: authStorageKey,
      value: cookieValue,
      url: localhostUrl,
      sameSite: "Lax",
    },
  ]);

  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ storageKey, session }) => {
      window.localStorage.setItem(storageKey, JSON.stringify(session));
    },
    {
      storageKey: authStorageKey,
      session: verified.session,
    }
  );

  await page.goto(`${baseURL}${nextPath}`, { waitUntil: "domcontentloaded" });
  await page.waitForURL(`**${nextPath}**`, { timeout: 60_000 });
}

test.describe.configure({ mode: "serial" });

test("public discovery, inquiry, and viewing requests persist to live storage", async ({ page }) => {
  const stamp = Date.now().toString();
  const guestEmail = `codex.property.${stamp}@example.com`;
  const guestName = `Codex Prospect ${stamp}`;
  const viewingName = `Codex Viewer ${stamp}`;
  sharedState.guestEmail = guestEmail;
  sharedState.guestName = guestName;
  sharedState.viewingName = viewingName;

  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Property discovery for people who do not want noise/i,
    })
  ).toBeVisible();

  await page.goto("/search");
  await expect(
    page.getByRole("heading", { name: /Browse listings with less clutter and more conviction/i })
  ).toBeVisible();

  await page.goto("/property/harbour-crest-penthouse-ikoyi");
  await expect(page.getByRole("heading", { name: /Harbour Crest Penthouse/i })).toBeVisible();

  const inquiryForm = formByIntent(page, "inquiry_submit");
  await inquiryForm.getByLabel("Name", { exact: true }).fill(guestName);
  await inquiryForm.getByLabel("Email", { exact: true }).fill(guestEmail);
  await inquiryForm.getByLabel("Phone", { exact: true }).fill(ownerPhone);
  await inquiryForm
    .getByLabel("Message")
    .fill("Please confirm viewing etiquette, service charges, and immediate availability.");
  await inquiryForm.getByRole("button", { name: /Submit inquiry/i }).click();

  await expect(page.getByText(/Inquiry submitted/i)).toBeVisible();

  const inquiry = await waitForValue("property inquiry record", () => findInquiryByEmail(guestEmail), Boolean);
  sharedState.inquiryId = inquiry.id;
  expect(inquiry.status).toBe("new");

  const inquiryNotifications = await waitForValue(
    "inquiry notifications",
    () => findNotifications(inquiry.id),
    (records) => records.length >= 2
  );
  expect(inquiryNotifications.some((record) => record.templateKey === "inquiry_received")).toBeTruthy();

  const viewingForm = formByIntent(page, "viewing_request");
  await viewingForm.getByLabel("Attendee name").fill(viewingName);
  await viewingForm.getByLabel("Email", { exact: true }).fill(guestEmail);
  await viewingForm.getByLabel("Phone", { exact: true }).fill(ownerPhone);
  await viewingForm.getByLabel("Preferred time").fill("2026-04-04T12:00");
  await viewingForm.getByLabel("Backup time").fill("2026-04-04T15:00");
  await viewingForm
    .getByLabel("Notes")
    .fill("Need a guided viewing with managed-property readiness notes.");
  await viewingForm.getByRole("button", { name: /Request viewing/i }).click();

  await expect(page.getByText(/Viewing request submitted/i)).toBeVisible();

  const viewing = await waitForValue("property viewing record", () => findViewingByEmail(guestEmail), Boolean);
  sharedState.viewingId = viewing.id;
  expect(viewing.status).toBe("requested");

  const viewingNotifications = await waitForValue(
    "viewing notifications",
    () => findNotifications(viewing.id),
    (records) => records.some((record) => record.templateKey === "viewing_requested")
  );
  expect(viewingNotifications.some((record) => record.templateKey === "viewing_requested")).toBeTruthy();

});

test("listing submission, owner update, and moderation approval stay connected", async ({ page }) => {
  const stamp = Date.now().toString();
  const listingTitle = `Verification Residence ${stamp}`;
  sharedState.listingTitle = listingTitle;

  await page.goto("/submit");
  await expect(
    page.getByRole("heading", {
      name: /Submit a property for editorial review, trust checks, and premium marketing/i,
    })
  ).toBeVisible();

  await page.getByLabel("Owner or agent name").fill("HenryCo Verification Owner");
  await page.getByLabel("Email").fill(ownerEmail);
  await page.getByLabel("Phone").fill(ownerPhone);
  await page.getByLabel("Listing title").fill(listingTitle);
  await page.getByLabel("Short summary").fill(
    "A verification listing used to confirm the full HenryCo Property owner flow."
  );
  await page
    .getByLabel("Description")
    .fill("This listing exists only to verify owner submission, moderation, and approval workflows.");
  await page.getByLabel("Location label").fill("Ikoyi, Lagos");
  await page.getByLabel("District").fill("Parkview");
  await page.getByLabel("Address line").fill("Parkview Estate");
  await page.getByLabel("Price").fill("28000000");
  await page.getByLabel("Interval").fill("per year");
  await page.getByLabel("Beds").fill("4");
  await page.getByLabel("Baths").fill("5");
  await page
    .getByLabel("Amenities")
    .fill("Generator, concierge desk, managed security, private cinema room");
  await page
    .getByLabel("Existing media URLs")
    .fill(
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80"
    );
  await page.getByLabel("Request HenryCo management").check();
  await page.getByRole("button", { name: /Submit listing/i }).click();

  await expect(page.getByText(/Listing submitted/i)).toBeVisible();

  const listing = await waitForValue("submitted listing record", () => findListingByTitle(listingTitle), Boolean);
  sharedState.listingId = listing.id;
  sharedState.submittedListingSlug = listing.slug;

  expect(listing.status).toBe("submitted");
  expect(listing.visibility).toBe("private");
  expect(listing.normalizedEmail).toBe(ownerEmail);

  const listingNotifications = await waitForValue(
    "listing submission notifications",
    () => findNotifications(listing.id),
    (records) => records.some((record) => record.templateKey === "listing_submitted")
  );
  expect(listingNotifications.some((record) => record.templateKey === "listing_submitted")).toBeTruthy();

  const listingActivities = await waitForValue(
    "listing submission activity",
    () => findCustomerActivities(listing.id),
    (records) =>
      records.some(
        (record) =>
          record.activity_type === "property_listing_submitted" &&
          record.reference_type === "property_listing"
      )
  );
  expect(
    listingActivities.some((record) => record.activity_type === "property_listing_submitted")
  ).toBeTruthy();

  const listingThreads = await waitForValue(
    "listing submission support thread",
    () => findSupportThreads(listing.id),
    (records) =>
      records.some(
        (record) =>
          record.category === "listing_submission" &&
          record.reference_type === "property_listing"
      )
  );
  expect(listingThreads.some((record) => record.category === "listing_submission")).toBeTruthy();

  await signInAsOwner(page, "/account/listings");
  await expect(
    page.getByRole("heading", { name: /Owner and agent listing workspace/i }).first()
  ).toBeVisible();
  await expect(page.getByText(listingTitle)).toBeVisible();

  const listingSection = page.locator("section").filter({ hasText: listingTitle }).first();
  await listingSection
    .getByLabel("Summary")
    .fill("Updated by the verification owner workspace to confirm the resubmission path.");
  await listingSection.getByRole("button", { name: /Save and resubmit/i }).click();

  await expect(page.getByText(/Listing updated and re-queued/i)).toBeVisible();

  const updatedListing = await waitForValue(
    "updated listing record",
    () => findListingByTitle(listingTitle),
    (value) =>
      Boolean(value) &&
      value.summary.includes("Updated by the verification owner workspace")
  );
  expect(updatedListing.status).toBe("submitted");

  await page.goto("/moderation");
  await expect(
    page.getByRole("heading", { name: /Listing moderation and featuring/i }).first()
  ).toBeVisible();

  const moderationSection = page.locator("form").filter({ hasText: listingTitle }).first();
  await moderationSection.getByRole("combobox").first().selectOption("approved");
  await moderationSection
    .getByLabel("Review note for owner or agent")
    .fill("Approved during automated verification.");
  await moderationSection.getByLabel("Featured on editorial surfaces").check();
  await moderationSection.getByLabel("Promoted in search and campaigns").check();
  await moderationSection.getByRole("button", { name: /Apply moderation decision/i }).click();

  await page.waitForURL("**/moderation?decision=approved");

  const approvedListing = await waitForValue(
    "approved listing record",
    () => findListingByTitle(listingTitle),
    (value) => Boolean(value) && value.status === "approved"
  );
  expect(approvedListing.visibility).toBe("public");

  const approvalNotifications = await waitForValue(
    "listing approval notifications",
    () => findNotifications(approvedListing.id),
    (records) => records.some((record) => record.templateKey === "listing_approved")
  );
  expect(approvalNotifications.some((record) => record.templateKey === "listing_approved")).toBeTruthy();
});

test("owner save flow, ops updates, and privileged workspaces render for the mapped owner role", async ({
  page,
}) => {
  test.skip(
    !sharedState.guestEmail ||
      !sharedState.guestName ||
      !sharedState.viewingName ||
      !sharedState.listingTitle ||
      !sharedState.submittedListingSlug
  );

  await signInAsOwner(page, `/property/${sharedState.submittedListingSlug}`);
  await expect(
    page.getByRole("heading", { name: new RegExp(sharedState.listingTitle, "i") })
  ).toBeVisible();

  await page.getByRole("button", { name: /Save property/i }).click();
  await expect(page.getByText(/Property saved to your HenryCo account history/i)).toBeVisible();

  await page.goto("/account/saved");
  await expect(page.getByText(sharedState.listingTitle)).toBeVisible();

  await page.goto("/operations");
  await expect(
    page.getByRole("heading", { name: /Property operations control room/i }).first()
  ).toBeVisible();

  const inquiryForm = page.locator("form").filter({ hasText: sharedState.guestEmail }).first();
  await inquiryForm.getByRole("combobox").first().selectOption("assigned");
  await inquiryForm.getByRole("combobox").nth(1).selectOption({ index: 1 });
  await inquiryForm.getByRole("button", { name: /Update inquiry/i }).click();
  await expect(page.getByText(/Workflow updated successfully/i)).toBeVisible();

  const updatedInquiry = await waitForValue(
    "updated inquiry status",
    () => findInquiryByEmail(sharedState.guestEmail),
    (value) => Boolean(value) && value.status === "assigned"
  );
  expect(updatedInquiry.assignedAgentId).toBeTruthy();

  const viewingForm = page
    .locator("section")
    .filter({ hasText: "Viewing scheduling" })
    .locator("form")
    .filter({ hasText: sharedState.viewingName })
    .first();
  await viewingForm.getByRole("combobox").first().selectOption("scheduled");
  await viewingForm.locator('input[type="datetime-local"]').fill("2026-04-05T14:30");
  await viewingForm.getByRole("combobox").nth(1).selectOption({ index: 1 });
  await viewingForm.getByRole("button", { name: /Update viewing/i }).click();
  await expect(page.getByText(/Workflow updated successfully/i)).toBeVisible();

  const updatedViewing = await waitForValue(
    "updated viewing status",
    () => findViewingByEmail(sharedState.guestEmail),
    (value) => Boolean(value) && value.status === "scheduled" && Boolean(value.scheduledFor)
  );
  expect(updatedViewing.assignedAgentId).toBeTruthy();

  const scheduledNotifications = await waitForValue(
    "viewing scheduled notifications",
    () => findNotifications(updatedViewing.id),
    (records) => records.some((record) => record.templateKey === "viewing_scheduled")
  );
  expect(
    scheduledNotifications.some((record) => record.templateKey === "viewing_scheduled")
  ).toBeTruthy();

  for (const route of ["/owner", "/agent", "/support", "/admin", "/moderation"]) {
    await page.goto(route);
    await expect(page).toHaveURL(new RegExp(`${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
    await expect(page.locator("main")).toBeVisible();
  }
});
