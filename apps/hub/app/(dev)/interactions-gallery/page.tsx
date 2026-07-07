import { notFound } from "next/navigation";
import { GalleryClient } from "./gallery-client";

/**
 * Dev-only gallery for @henryco/interactions engines (SP1 Tranche 1).
 * Never ships: hard 404 outside development.
 */
export const dynamic = "force-dynamic";

export default function InteractionsGalleryPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <GalleryClient />;
}
