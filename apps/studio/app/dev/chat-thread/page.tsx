import { notFound } from "next/navigation";
import HarnessClient from "./HarnessClient";

export const dynamic = "force-dynamic";

/**
 * Dev-only acceptance rig for @henryco/chat-thread (support variant): a
 * scripted fake backend (echo ack, deterministic first-attempt failure for
 * bodies containing "fail", slow sends for "slow") plus header controls to
 * inject incoming messages, images, bursts, and toggle dark mode. Returns
 * 404 outside `next dev`.
 */
export default function ChatThreadHarnessPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <HarnessClient />;
}
