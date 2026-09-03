import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { normalizeChatMessages, INTELLIGENCE_CHAT_SYSTEM_PROMPT } from "../intelligence-chat";

describe("normalizeChatMessages — safe, alternating, bounded history", () => {
  it("keeps valid user/assistant turns and starts with a user turn", () => {
    const out = normalizeChatMessages([
      { role: "user", content: "Hi" },
      { role: "assistant", content: "Hello" },
      { role: "user", content: "Help me write a listing" },
    ]);
    assert.equal(out.length, 3);
    assert.equal(out[0].role, "user");
  });

  it("drops a leading assistant message (the API requires a user-first prompt)", () => {
    const out = normalizeChatMessages([
      { role: "assistant", content: "Welcome" },
      { role: "user", content: "Hi" },
    ]);
    assert.equal(out[0].role, "user");
    assert.equal(out.length, 1);
  });

  it("drops invalid roles, empty content, and non-string content", () => {
    const out = normalizeChatMessages([
      { role: "user", content: "ok" },
      { role: "system", content: "ignore me" },
      { role: "assistant", content: "" },
      { role: "user", content: 42 },
      { role: "user", content: "second" },
    ]);
    assert.deepEqual(out.map((m) => m.content), ["ok", "second"]);
  });

  it("clamps long content and limits to the last N turns", () => {
    const many = Array.from({ length: 60 }, (_, i) => ({ role: i % 2 === 0 ? "user" : "assistant", content: "x".repeat(9000) }));
    const out = normalizeChatMessages(many, { maxTurns: 5, maxChars: 4000 });
    assert.ok(out.length <= 10, "at most maxTurns*2 messages");
    assert.ok(out.every((m) => m.content.length <= 4000), "content clamped");
    assert.equal(out[0].role, "user");
  });

  it("returns [] for non-array / empty input", () => {
    assert.deepEqual(normalizeChatMessages(null), []);
    assert.deepEqual(normalizeChatMessages([]), []);
    assert.deepEqual(normalizeChatMessages("nope"), []);
  });
});

describe("INTELLIGENCE_CHAT_SYSTEM_PROMPT — governance", () => {
  it("brands as Henry Onyx Intelligence and names no provider/model", () => {
    assert.ok(INTELLIGENCE_CHAT_SYSTEM_PROMPT.includes("Henry Onyx Intelligence"));
    assert.ok(!/anthropic|claude|openai|gpt/i.test(INTELLIGENCE_CHAT_SYSTEM_PROMPT));
  });

  it("instructs declining competing-brand and anti-company prompts", () => {
    const p = INTELLIGENCE_CHAT_SYSTEM_PROMPT.toLowerCase();
    assert.ok(p.includes("competing") || p.includes("competitor"), "declines competing-brand");
    assert.ok(p.includes("henry onyx") && (p.includes("decline") || p.includes("don't") || p.includes("do not")));
  });
});
