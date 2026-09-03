import { mockAttentionFeed } from "@henryco/command-contract/mock";
import { henrySubdomain } from "@henryco/config";
import { CommandConsole } from "./console";

export const dynamic = "force-dynamic";

export default function CommandPage() {
  const feed = mockAttentionFeed();
  // Domain derived from config — NEVER hardcoded. At live wiring the env
  // NEXT_PUBLIC_BASE_DOMAIN flips this to henryonyx.com with zero code change.
  const stagingHost = henrySubdomain("command");

  return <CommandConsole initialFeed={feed} stagingHost={stagingHost} />;
}
