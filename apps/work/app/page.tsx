import { mockAttentionFeed } from "@henryco/command-contract/mock";
import { henrySubdomain } from "@henryco/config";
import { WorkConsole } from "./console";

export const dynamic = "force-dynamic";

export default function WorkPage() {
  const feed = mockAttentionFeed();
  const stagingHost = henrySubdomain("work");

  return <WorkConsole initialFeed={feed} stagingHost={stagingHost} />;
}
