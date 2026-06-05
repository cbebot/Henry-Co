import type {
  DispatchDeps,
  DispatchOptions,
  DispatchSummary,
  PushPayload,
  PushProvider,
  SendResult,
} from "./types";

/**
 * Fan a push payload out to every active subscription a user holds, across web
 * and native, logging each attempt to the delivery log and pruning credentials
 * the provider reports permanently dead.
 *
 * Money-grade contract: ONE bad credential (dead, transient failure, or a
 * provider that throws) never blocks delivery to the others — each send is
 * isolated. Returns a summary the caller can fold into observability.
 *
 * Pure over its injected I/O (see DispatchDeps) so the fan-out/prune behaviour
 * is fully unit-tested; `dispatchPush` (index) wires the real Supabase + web-push
 * + Expo providers.
 */
export async function dispatchPushWith(
  deps: DispatchDeps,
  userId: string,
  payload: PushPayload,
  options: DispatchOptions = {},
): Promise<DispatchSummary> {
  const notificationId = options.notificationId ?? null;
  const division = options.division ?? null;
  const subs = await deps.listActiveSubscriptions(userId);
  const summary: DispatchSummary = {
    attempted: subs.length,
    delivered: 0,
    dead: 0,
    failed: 0,
  };

  await Promise.all(
    subs.map(async (sub) => {
      const provider: PushProvider = sub.channel === "expo" ? "expo" : "web-push";

      let result: SendResult;
      try {
        result =
          sub.channel === "expo"
            ? await deps.sendExpo(sub, payload)
            : await deps.sendWeb(sub, payload);
      } catch (error) {
        // A provider that throws is a transient failure, not a dead credential —
        // never let it abort the fan-out to the user's other devices.
        result = {
          ok: false,
          dead: false,
          error: error instanceof Error ? error.message : "push send threw",
        };
      }

      if (result.ok) {
        summary.delivered += 1;
        await deps.logDelivery({
          userId,
          notificationId,
          channel: "push",
          provider,
          status: "delivered",
          division,
          providerMessageId: result.providerMessageId ?? null,
        });
        return;
      }

      if (result.dead) {
        summary.dead += 1;
        await deps.pruneSubscription(sub.id, result.error ?? "dead");
        await deps.logDelivery({
          userId,
          notificationId,
          channel: "push",
          provider,
          status: "dead",
          division,
          errorMessage: result.error ?? null,
        });
        return;
      }

      summary.failed += 1;
      await deps.recordFailure(sub.id);
      await deps.logDelivery({
        userId,
        notificationId,
        channel: "push",
        provider,
        status: "failed",
        division,
        errorMessage: result.error ?? null,
      });
    }),
  );

  return summary;
}
