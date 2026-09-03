import { redirect } from "next/navigation";

// Phase 0 entry: everything lives behind the owner gate. The root simply routes
// into the authenticated dashboard, which redirects unauthenticated requests to
// /login at the server level (added next in Phase 0).
export default function Home() {
  redirect("/dashboard");
}
