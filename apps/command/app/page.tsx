import { henrySubdomain } from "@henryco/config";
import { mockAttentionFeed } from "@henryco/command-contract";
import { CommandConsole } from "./console";

export const dynamic = "force-dynamic";

export default function OwnerCommandPage() {
  const stagingHost = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : henrySubdomain("command");
  const feed = mockAttentionFeed();
  return <CommandConsole initialFeed={feed} stagingHost={stagingHost} />;
}