import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseChatEnvelope } from "./brief-chat";

// Guards the contract between the gateway's studio.brief.coach prompt (which instructs a
// {"reply": string, "ready": boolean} JSON envelope) and studio's parser. If the gateway prompt
// ever drifts from this shape, or the parser stops accepting it, this fails.
describe("coach envelope round-trip", () => {
  it("parses the {reply,ready} JSON the gateway coach prompt instructs", () => {
    const out = parseChatEnvelope('{"reply":"Who is it for?","ready":false}');
    assert.deepEqual(out, { reply: "Who is it for?", ready: false });
  });
  it("tolerates a stray code fence and returns ready=true", () => {
    const out = parseChatEnvelope('```json\n{"reply":"Great — I have what I need.","ready":true}\n```');
    assert.deepEqual(out, { reply: "Great — I have what I need.", ready: true });
  });
});
