import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  parseSupportAssistEnvelope,
  resolveSupportAssistActions,
  interpretSupportAssistOutput,
  listSupportAssistDestinations,
  isSupportAssistDestination,
} from "../support-assist";

describe("support-assist envelope — parse", () => {
  it("parses a clean envelope with navigation and handoff", () => {
    const env = parseSupportAssistEnvelope(
      JSON.stringify({
        reply: "Your wallet balance is here.",
        navigate: [{ target: "account.wallet", label: "Open wallet" }],
        handoff: false,
      }),
    );
    assert.ok(env);
    assert.equal(env.reply, "Your wallet balance is here.");
    assert.equal(env.navigate.length, 1);
    assert.equal(env.navigate[0].target, "account.wallet");
    assert.equal(env.handoff, false);
  });

  it("tolerates a code fence and surrounding prose", () => {
    const env = parseSupportAssistEnvelope(
      'Sure!\n```json\n{"reply":"Hi","navigate":[],"handoff":false}\n```\nHope that helps',
    );
    assert.ok(env);
    assert.equal(env.reply, "Hi");
    assert.deepEqual(env.navigate, []);
  });

  it("returns null on an empty reply (triggers the orchestrator retry)", () => {
    assert.equal(parseSupportAssistEnvelope(JSON.stringify({ reply: "", navigate: [], handoff: false })), null);
  });

  it("returns null on non-JSON", () => {
    assert.equal(parseSupportAssistEnvelope("I cannot do that."), null);
    assert.equal(parseSupportAssistEnvelope(""), null);
  });

  it("caps navigation at two buttons and drops malformed rows", () => {
    const env = parseSupportAssistEnvelope(
      JSON.stringify({
        reply: "Options",
        navigate: [
          { target: "account.wallet", label: "Wallet" },
          { target: "account.support", label: "Support" },
          { target: "account.settings", label: "Settings" },
          { target: "", label: "no target" },
          { label: "missing target" },
        ],
        handoff: false,
      }),
    );
    assert.ok(env);
    assert.equal(env.navigate.length, 2, "capped at two");
    assert.equal(env.navigate[0].target, "account.wallet");
    assert.equal(env.navigate[1].target, "account.support");
  });

  it("handoff is strictly boolean-true (never truthy coercion)", () => {
    const yes = parseSupportAssistEnvelope(JSON.stringify({ reply: "r", navigate: [], handoff: true }));
    const no = parseSupportAssistEnvelope(JSON.stringify({ reply: "r", navigate: [], handoff: "yes" }));
    assert.equal(yes?.handoff, true);
    assert.equal(no?.handoff, false);
  });

  it("abuse is strictly boolean-true and defaults false (the abuse guard's misuse flag)", () => {
    assert.equal(parseSupportAssistEnvelope(JSON.stringify({ reply: "r", navigate: [], abuse: true }))?.abuse, true);
    assert.equal(parseSupportAssistEnvelope(JSON.stringify({ reply: "r", navigate: [], abuse: "1" }))?.abuse, false);
    assert.equal(parseSupportAssistEnvelope(JSON.stringify({ reply: "r", navigate: [] }))?.abuse, false, "absent → false");
  });

  it("clamps an over-long label and target", () => {
    const env = parseSupportAssistEnvelope(
      JSON.stringify({
        reply: "r",
        navigate: [{ target: "x".repeat(200), label: "y".repeat(200) }],
        handoff: false,
      }),
    );
    assert.ok(env);
    // The (unknown) over-long target survives parse but is dropped at resolve — see below.
    assert.ok(env.navigate[0].label.length <= 60);
    assert.ok(env.navigate[0].target.length <= 64);
  });
});

describe("support-assist envelope — resolve to real hrefs", () => {
  it("resolves known targets to absolute hrefs and drops unknown/invented ones", () => {
    const resolved = resolveSupportAssistActions([
      { target: "account.wallet", label: "Open wallet" },
      { target: "totally.invented", label: "Phishing" },
      { target: "https://evil.example", label: "Off-platform" },
    ]);
    assert.equal(resolved.length, 1, "only the catalog target survives");
    assert.equal(resolved[0].label, "Open wallet");
    assert.match(resolved[0].href, /^https?:\/\//, "absolute href from config");
  });

  it("does not crash or leak on prototype-chain target names (own-property guard)", () => {
    const resolved = resolveSupportAssistActions([
      { target: "__proto__", label: "x" },
      { target: "constructor", label: "x" },
      { target: "toString", label: "x" },
      { target: "hasOwnProperty", label: "x" },
      { target: "valueOf", label: "x" },
    ]);
    assert.deepEqual(resolved, [], "inherited Object members are never treated as catalog entries");
  });

  it("every advertised destination resolves (catalog integrity)", () => {
    const lines = listSupportAssistDestinations().split("\n");
    assert.ok(lines.length >= 8, "catalog is non-trivial");
    for (const line of lines) {
      const target = line.split(" — ")[0];
      assert.equal(isSupportAssistDestination(target), true, `${target} is a real destination`);
      const [resolved] = resolveSupportAssistActions([{ target, label: "go" }]);
      assert.ok(resolved?.href, `${target} resolves to an href`);
    }
  });
});

describe("support-assist — interpret (the one call an app route makes)", () => {
  it("parses + resolves in one step", () => {
    const turn = interpretSupportAssistOutput(
      JSON.stringify({
        reply: "Here is your wallet.",
        navigate: [
          { target: "account.wallet", label: "Open wallet" },
          { target: "invented.route", label: "drop me" },
        ],
        handoff: false,
      }),
    );
    assert.ok(turn);
    assert.equal(turn.reply, "Here is your wallet.");
    assert.equal(turn.navigate.length, 1, "unknown target dropped");
    assert.match(turn.navigate[0].href, /^https?:\/\//);
    assert.equal(turn.handoff, false);
  });

  it("carries the handoff flag through", () => {
    const turn = interpretSupportAssistOutput(
      JSON.stringify({ reply: "The team will pick this up.", navigate: [], handoff: true }),
    );
    assert.equal(turn?.handoff, true);
    assert.deepEqual(turn?.navigate, []);
  });

  it("returns null on unparseable output (the route's rare hard-failure branch)", () => {
    assert.equal(interpretSupportAssistOutput("not json"), null);
  });
});
