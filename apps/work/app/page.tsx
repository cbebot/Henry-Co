import { henrySubdomain } from "@henryco/config";
import { mockAttentionFeed } from "@henryco/command-contract";
import { WorkConsole } from "./console";

export const dynamic = "force-dynamic";

export default function StaffWorkspacePage() {
  const stagingHost = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : henrySubdomain("work");
  const feed = mockAttentionFeed();
  return <WorkConsole initialFeed={feed} stagingHost={stagingHost} />;
}