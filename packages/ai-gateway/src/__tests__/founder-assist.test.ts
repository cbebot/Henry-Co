import test from "node:test";
import assert from "node:assert/strict";

import {
  parseFounderAssistEnvelope,
  salvageFounderAssistEnvelope,
  interpretFounderAssistOutput,
  resolveFounderAssistActions,
  listFounderAssistDestinations,
  isFounderAssistDestination,
} from "../founder-assist";
import { AI_SURFACES } from "../surfaces";

test("parses a clean {reply, navigate} envelope", () => {
  const env = parseFounderAssistEnvelope(
    JSON.stringify({
      reply: "Revenue held steady this week.",
      navigate: [{ target: "owner.finance.revenue", label: "Open revenue" }],
    }),
  );
  assert.ok(env);
  assert.equal(env.reply, "Revenue held steady this week.");
  assert.equal(env.navigate.length, 1);
  assert.equal(env.navigate[0].target, "owner.finance.revenue");
});

test("tolerates a code fence and surrounding prose", () => {
  const env = parseFounderAssistEnvelope(
    'Sure:\n```json\n{"reply": "Here.", "navigate": []}\n```',
  );
  assert.ok(env);
  assert.equal(env.reply, "Here.");
});

test("caps navigation at two buttons (what the launcher renders)", () => {
  const env = parseFounderAssistEnvelope(
    JSON.stringify({
      reply: "Lots to see.",
      navigate: [
        { target: "owner.overview", label: "1" },
        { target: "owner.finance", label: "2" },
        { target: "owner.divisions", label: "3" },
        { target: "owner.inbox", label: "4" },
      ],
    }),
  );
  assert.ok(env);
  assert.equal(env.navigate.length, 2);
});

test("resolver drops unknown and prototype-key targets silently", () => {
  const resolved = resolveFounderAssistActions([
    { target: "owner.finance", label: "Money" },
    { target: "evil.example", label: "Nope" },
    { target: "__proto__", label: "Nope" },
    { target: "constructor", label: "Nope" },
  ]);
  assert.equal(resolved.length, 1);
  assert.equal(resolved[0].href, "/owner/finance");
});

test("every catalog destination resolves to a RELATIVE owner-console route", () => {
  const lines = listFounderAssistDestinations().split("\n");
  assert.ok(lines.length >= 15);
  for (const line of lines) {
    const target = line.split(" — ")[0];
    assert.ok(isFounderAssistDestination(target), `${target} should be a destination`);
    const [resolved] = resolveFounderAssistActions([{ target, label: "x" }]);
    assert.ok(resolved.href.startsWith("/owner"), `${target} must stay inside the owner console`);
  }
});

test("interpret = parse + resolve in one step", () => {
  const turn = interpretFounderAssistOutput(
    JSON.stringify({
      reply: "Support pressure is in care.",
      navigate: [
        { target: "owner.operations.alerts", label: "See alerts" },
        { target: "not.a.route", label: "dropped" },
      ],
    }),
  );
  assert.ok(turn);
  assert.equal(turn.navigate.length, 1);
  assert.equal(turn.navigate[0].href, "/owner/operations/alerts");
});

test("salvage recovers plain prose into a minimal envelope", () => {
  const salvaged = salvageFounderAssistEnvelope("Care bookings look overdue; open the SLA sweep.");
  assert.ok(salvaged);
  const env = parseFounderAssistEnvelope(salvaged);
  assert.ok(env);
  assert.equal(env.navigate.length, 0);
});

test("salvage recovers the reply from a broken envelope with raw newlines", () => {
  const salvaged = salvageFounderAssistEnvelope('{"reply": "Two things stand out", "navigate": [');
  assert.ok(salvaged);
  const env = parseFounderAssistEnvelope(salvaged);
  assert.ok(env);
  assert.equal(env.reply, "Two things stand out");
});

test("salvage fails closed on raw JSON it cannot humanize", () => {
  assert.equal(salvageFounderAssistEnvelope('{"weird": true}'), null);
  assert.equal(salvageFounderAssistEnvelope(""), null);
});

test("the surface policy is FREE, deep tier, and rate-limited", () => {
  const policy = AI_SURFACES["hub.founder.assist"];
  assert.ok(policy);
  assert.equal(policy.billable, false);
  assert.equal(policy.modelTier, "deep");
  assert.ok((policy.freeAllowancePerDay ?? 0) > 0, "a leaked owner session must still hit a daily cap");
});

test("F3: proposeAction parses with flat bounded params; rationale optional", () => {
  const env = parseFounderAssistEnvelope(
    JSON.stringify({
      reply: "Prepared the suspension for your confirmation.",
      navigate: [],
      proposeAction: {
        key: "owner.staff.status.toggle",
        params: { userId: "u-1", intent: "suspend", nested: { drop: true }, arr: [1] },
        rationale: "Repeated failed sign-ins from a new device.",
      },
    }),
  );
  assert.ok(env);
  assert.ok(env.proposeAction);
  assert.equal(env.proposeAction.key, "owner.staff.status.toggle");
  assert.equal(env.proposeAction.params.userId, "u-1");
  assert.equal(env.proposeAction.params.intent, "suspend");
  assert.ok(!("nested" in env.proposeAction.params), "non-primitive params are dropped");
  assert.ok(!("arr" in env.proposeAction.params), "array params are dropped");
  assert.ok(env.proposeAction.rationale?.includes("sign-ins"));
});

test("F3: absent or malformed proposeAction is null (F2 turns unchanged)", () => {
  const plain = parseFounderAssistEnvelope(JSON.stringify({ reply: "Hello.", navigate: [] }));
  assert.ok(plain);
  assert.equal(plain.proposeAction, null);
  const junk = parseFounderAssistEnvelope(
    JSON.stringify({ reply: "Hi.", navigate: [], proposeAction: "run everything" }),
  );
  assert.ok(junk);
  assert.equal(junk.proposeAction, null);
  const noKey = parseFounderAssistEnvelope(
    JSON.stringify({ reply: "Hi.", navigate: [], proposeAction: { params: { a: 1 } } }),
  );
  assert.ok(noKey);
  assert.equal(noKey.proposeAction, null);
});

test("F3: salvage never carries a proposed action", () => {
  const salvaged = salvageFounderAssistEnvelope("Suspend the account now.");
  assert.ok(salvaged);
  const env = parseFounderAssistEnvelope(salvaged);
  assert.ok(env);
  assert.equal(env.proposeAction, null);
});

// ── F4: the lookup request transport ─────────────────────────────────────────

test("F4: parses a lookup request with string params", () => {
  const env = parseFounderAssistEnvelope(
    JSON.stringify({
      reply: "Pulling up the urgent threads now.",
      navigate: [],
      lookup: { key: "support.threads.list", params: { focus: "urgent" } },
    }),
  );
  assert.ok(env);
  assert.ok(env.lookup);
  assert.equal(env.lookup.key, "support.threads.list");
  assert.equal(env.lookup.params.focus, "urgent");
});

test("F4: lookup is null when absent, malformed, or keyless", () => {
  const absent = parseFounderAssistEnvelope(JSON.stringify({ reply: "Hi.", navigate: [] }));
  assert.ok(absent);
  assert.equal(absent.lookup, null);

  const malformed = parseFounderAssistEnvelope(
    JSON.stringify({ reply: "Hi.", navigate: [], lookup: "support.threads.list" }),
  );
  assert.ok(malformed);
  assert.equal(malformed.lookup, null);

  const keyless = parseFounderAssistEnvelope(
    JSON.stringify({ reply: "Hi.", navigate: [], lookup: { params: { focus: "urgent" } } }),
  );
  assert.ok(keyless);
  assert.equal(keyless.lookup, null);
});

test("F4: lookup params drop non-strings and cap size", () => {
  const env = parseFounderAssistEnvelope(
    JSON.stringify({
      reply: "Looking.",
      navigate: [],
      lookup: {
        key: "support.thread.get",
        params: { threadId: "abc", depth: 9, nested: { a: 1 }, long: "x".repeat(500) },
      },
    }),
  );
  assert.ok(env);
  assert.ok(env.lookup);
  assert.equal(env.lookup.params.threadId, "abc");
  assert.equal("depth" in env.lookup.params, false);
  assert.equal("nested" in env.lookup.params, false);
  assert.equal(env.lookup.params.long.length, 200);
});

test("F4: interpret carries the lookup through to the turn", () => {
  const turn = interpretFounderAssistOutput(
    JSON.stringify({
      reply: "One moment.",
      navigate: [],
      lookup: { key: "staff.list", params: {} },
    }),
  );
  assert.ok(turn);
  assert.ok(turn.lookup);
  assert.equal(turn.lookup.key, "staff.list");
});

test("F4: salvage never carries a lookup", () => {
  const salvaged = salvageFounderAssistEnvelope("Just show me the staff.");
  assert.ok(salvaged);
  const env = parseFounderAssistEnvelope(salvaged);
  assert.ok(env);
  assert.equal(env.lookup, null);
});
