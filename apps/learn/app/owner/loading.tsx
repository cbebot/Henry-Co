import { LearnWorkspaceLoading } from "@/components/learn/loading-state";

/**
 * V3-05 — Learn owner workspace route fallback.
 *
 * LearnWorkspaceLoading now renders content-shaped skeleton blocks
 * with no warmup hero copy. Previous theater props ("Preparing academy
 * operations" + "Loading courses, learners, assignments...") were
 * dropped from source.
 */
export default function OwnerLoading() {
  return <LearnWorkspaceLoading />;
}
