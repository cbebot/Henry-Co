import "server-only";

import { readPropertyRuntimeSnapshot } from "@/lib/property/store";
import { getPropertyViewer } from "@/lib/property/auth";
import { isPropertyListingReviewQueueStatus } from "@/lib/property/governance";
import { getPropertyListingContactReviewMap } from "@/lib/property/trust";

export async function getPropertySnapshot() {
  return readPropertyRuntimeSnapshot();
}

export async function getPropertyHomeData() {
  const snapshot = await getPropertySnapshot();
  const isLive = (status: string) => status === "published" || status === "approved";
  return {
    ...snapshot,
    featuredListings: snapshot.listings.filter((listing) => isLive(listing.status) && listing.featured),
    promotedListings: snapshot.listings.filter((listing) => isLive(listing.status) && listing.promoted),
  };
}

export async function searchProperties(
  query: URLSearchParams | Record<string, string | string[] | undefined>
) {
  const snapshot = await getPropertySnapshot();
  const getValue = (key: string) =>
    query instanceof URLSearchParams
      ? query.get(key)
      : Array.isArray(query[key])
        ? query[key]?.[0]
        : query[key];

  const search = String(getValue("q") || "").trim().toLowerCase();
  const kind = String(getValue("kind") || "").trim().toLowerCase();
  const area = String(getValue("area") || "").trim().toLowerCase();
  const managedOnly = String(getValue("managed") || "") === "1";
  const furnishedOnly = String(getValue("furnished") || "") === "1";

  return snapshot.listings.filter((listing) => {
    if (!["published", "approved"].includes(listing.status)) return false;
    if (kind && listing.kind !== kind) return false;
    if (area && listing.locationSlug !== area) return false;
    if (managedOnly && !listing.managedByHenryCo) return false;
    if (furnishedOnly && !listing.furnished) return false;

    if (!search) return true;

    return [
      listing.title,
      listing.summary,
      listing.description,
      listing.locationLabel,
      listing.district,
      ...listing.amenities,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search);
  });
}

export async function getPropertyBySlug(slug: string) {
  const snapshot = await getPropertySnapshot();
  const listing = snapshot.listings.find((item) => item.slug === slug) ?? null;
  if (!listing) return null;

  return {
    listing,
    area: snapshot.areas.find((item) => item.slug === listing.locationSlug) ?? null,
    agent: snapshot.agents.find((item) => item.id === listing.agentId) ?? null,
    related: snapshot.listings
      .filter(
        (item) =>
          item.slug !== slug &&
          ["published", "approved"].includes(item.status) &&
          (item.locationSlug === listing.locationSlug || item.kind === listing.kind)
      )
      .sort((a, b) => {
        const score = (x: typeof listing) => {
          let s = 0;
          if (x.locationSlug === listing.locationSlug) s += 4;
          if (x.kind === listing.kind) s += 2;
          if (x.featured) s += 1;
          if (x.promoted) s += 1;
          return s;
        };
        return score(b) - score(a);
      })
      .slice(0, 4),
    inquiries: snapshot.inquiries.filter((item) => item.listingId === listing.id),
    viewings: snapshot.viewingRequests.filter((item) => item.listingId === listing.id),
  };
}

export async function getAreaBySlug(slug: string) {
  const snapshot = await getPropertySnapshot();
  const area = snapshot.areas.find((item) => item.slug === slug) ?? null;
  if (!area) return null;

  return {
    area,
    listings: snapshot.listings.filter(
      (item) => item.locationSlug === slug && ["published", "approved"].includes(item.status)
    ),
  };
}

export async function getPropertyDashboardData() {
  const snapshot = await getPropertySnapshot();
  const viewer = await getPropertyViewer();

  if (!viewer.user) {
    return {
      viewer,
      savedListings: [],
      inquiries: [],
      viewings: [],
      listings: [],
      applications: [],
      notifications: [],
    };
  }

  const savedIds = new Set(
    snapshot.savedListings
      .filter((item) => item.userId === viewer.user?.id)
      .map((item) => item.listingId)
  );

  return {
    viewer,
    savedListings: snapshot.listings.filter((item) => savedIds.has(item.id)),
    inquiries: snapshot.inquiries.filter(
      (item) =>
        item.userId === viewer.user?.id ||
        (viewer.normalizedEmail && item.normalizedEmail === viewer.normalizedEmail)
    ),
    viewings: snapshot.viewingRequests.filter(
      (item) =>
        item.userId === viewer.user?.id ||
        (viewer.normalizedEmail && item.normalizedEmail === viewer.normalizedEmail)
    ),
    listings: snapshot.listings.filter(
      (item) =>
        item.ownerUserId === viewer.user?.id ||
        (viewer.normalizedEmail && item.normalizedEmail === viewer.normalizedEmail)
    ),
    applications: snapshot.applications.filter(
      (item) =>
        item.userId === viewer.user?.id ||
        (viewer.normalizedEmail && item.normalizedEmail === viewer.normalizedEmail)
    ),
    notifications: snapshot.notifications.filter(
      (item) =>
        !viewer.normalizedEmail ||
        item.recipient.toLowerCase().includes(viewer.normalizedEmail)
    ),
  };
}

export async function getOwnerWorkspaceData() {
  const snapshot = await getPropertySnapshot();
  const viewer = await getPropertyViewer();

  return {
    viewer,
    listings: snapshot.listings.filter((item) =>
      viewer.user
        ? item.ownerUserId === viewer.user.id ||
          (viewer.normalizedEmail && item.normalizedEmail === viewer.normalizedEmail)
        : false
    ),
    inquiries: snapshot.inquiries.filter((item) =>
      viewer.user ? item.userId === viewer.user.id : false
    ),
    applications: snapshot.applications.filter((item) =>
      viewer.user
        ? item.userId === viewer.user.id ||
          (viewer.normalizedEmail && item.normalizedEmail === viewer.normalizedEmail)
        : false
    ),
  };
}

export async function getAgentWorkspaceData() {
  const snapshot = await getPropertySnapshot();
  const viewer = await getPropertyViewer();
  const agent = snapshot.agents[0] ?? null;

  return {
    viewer,
    agent,
    listings: snapshot.listings.filter((item) => item.agentId === agent?.id),
    inquiries: snapshot.inquiries.filter((item) => item.assignedAgentId === agent?.id),
    viewings: snapshot.viewingRequests.filter((item) => item.assignedAgentId === agent?.id),
  };
}

export async function getOperationsWorkspaceData() {
  const snapshot = await getPropertySnapshot();
  const pendingListings = snapshot.listings
    .filter((item) => isPropertyListingReviewQueueStatus(item.status))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  return {
    pendingListings,
    pendingInquiries: snapshot.inquiries.filter((item) => item.status !== "closed"),
    pendingViewings: snapshot.viewingRequests.filter((item) =>
      ["requested", "scheduled", "confirmed"].includes(item.status)
    ),
    inspections: snapshot.inspections
      .filter((item) => ["requested", "scheduled"].includes(item.status))
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
    managedRecords: snapshot.managedRecords,
    campaigns: snapshot.campaigns,
  };
}

export async function getPropertyGovernanceWorkspaceData() {
  const snapshot = await getPropertySnapshot();
  const queue = snapshot.listings
    .filter((listing) => isPropertyListingReviewQueueStatus(listing.status))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  return {
    snapshot,
    queue,
    applicationsByListingId: new Map(
      snapshot.applications.map((application) => [application.listingId, application])
    ),
    inspectionsByListingId: new Map(
      snapshot.inspections.map((inspection) => [inspection.listingId, inspection])
    ),
    contactReviewMap: await getPropertyListingContactReviewMap(
      queue.map((listing) => ({
        id: listing.id,
        ownerEmail: listing.ownerEmail,
        ownerPhone: listing.ownerPhone,
      }))
    ),
    policyEventsByListingId: new Map(
      queue.map((listing) => [
        listing.id,
        snapshot.policyEvents
          .filter((event) => event.listingId === listing.id)
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
      ])
    ),
  };
}
