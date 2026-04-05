import "server-only";

import type { LogisticsAddress, LogisticsLifecycleStatus, LogisticsTrackingPoint } from "@/lib/logistics/types";

export type MapProviderId = "none" | "osm_embed" | "mapbox" | "google";

export type LogisticsMapViewport = {
  provider: MapProviderId;
  /** When true, the UI should explain that live rider GPS is not available yet. */
  showLiveLocationPlaceholder: boolean;
  /** Pickup coordinate from address capture or geocoding — never invented. */
  pickup: { lat: number; lng: number } | null;
  /** Dropoff coordinate from address capture or geocoding — never invented. */
  dropoff: { lat: number; lng: number } | null;
  /** Latest known rider position from logistics_tracking_points, if any. */
  live: { lat: number; lng: number; recordedAt: string } | null;
  /** Breadcrumb trail for future polyline rendering (newest last). */
  trail: Array<{ lat: number; lng: number }>;
  /**
   * OSM embed URL when bbox can be computed from real coordinates only.
   * @see https://wiki.openstreetmap.org/wiki/Embedding_a_map_in_a_website
   */
  embedUrl: string | null;
};

function coordFromAddress(address: LogisticsAddress | null | undefined) {
  if (!address?.latitude || !address?.longitude) return null;
  return { lat: address.latitude, lng: address.longitude };
}

function bboxFromPoints(points: Array<{ lat: number; lng: number }>) {
  if (points.length === 0) return null;
  let minLat = points[0]!.lat;
  let maxLat = points[0]!.lat;
  let minLng = points[0]!.lng;
  let maxLng = points[0]!.lng;
  for (const p of points) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
  }
  const pad = 0.02;
  return {
    left: minLng - pad,
    bottom: minLat - pad,
    right: maxLng + pad,
    top: maxLat + pad,
  };
}

/**
 * Builds an honest map model: only uses coordinates that exist in data.
 * No synthetic rider positions.
 */
export function buildLogisticsMapViewport(input: {
  lifecycleStatus: LogisticsLifecycleStatus;
  pickupAddress: LogisticsAddress | null | undefined;
  dropoffAddress: LogisticsAddress | null | undefined;
  trackingPoints: LogisticsTrackingPoint[];
}): LogisticsMapViewport {
  const pickup = coordFromAddress(input.pickupAddress);
  const dropoff = coordFromAddress(input.dropoffAddress);
  const trail = input.trackingPoints.map((p) => ({ lat: p.latitude, lng: p.longitude }));
  const live = trail.length > 0 ? trail[trail.length - 1]! : null;
  const liveMeta =
    live && input.trackingPoints.length > 0
      ? {
          lat: live.lat,
          lng: live.lng,
          recordedAt: input.trackingPoints[input.trackingPoints.length - 1]!.recordedAt,
        }
      : null;

  const points = [pickup, dropoff, ...trail].filter(Boolean) as Array<{ lat: number; lng: number }>;
  const bbox = bboxFromPoints(points);
  const embedUrl =
    bbox && points.length > 0
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
          `${bbox.left},${bbox.bottom},${bbox.right},${bbox.top}`
        )}&layer=mapnik`
      : null;

  const mapboxToken = String(process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "").trim();
  const googleKey = String(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "").trim();

  let provider: MapProviderId = "none";
  if (mapboxToken) provider = "mapbox";
  else if (googleKey) provider = "google";
  else if (embedUrl) provider = "osm_embed";

  const activeRiderPhases: LogisticsLifecycleStatus[] = [
    "assigned",
    "pickup_confirmed",
    "in_transit",
    "delayed",
    "attempted_delivery",
  ];

  return {
    provider,
    showLiveLocationPlaceholder: !live && activeRiderPhases.includes(input.lifecycleStatus),
    pickup,
    dropoff,
    live: liveMeta,
    trail,
    embedUrl,
  };
}
