import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildStudioBriefStructuredPrompt,
  buildStudioMessageRefinePrompt,
  buildStudioBriefCoachPrompt,
} from "../studio-prompts";
import type { AiTask } from "../contracts";

const task = (surface: AiTask["surface"], input: Record<string, unknown>): AiTask => ({
  surface,
  actorId: "actor-1",
  input,
  idempotencyKey: "k1",
});

describe("studio.brief.staff — structured brief builder", () => {
  it("reads input.description and instructs the exact 20-field JSON schema + refusal stub", () => {
    const parts = buildStudioBriefStructuredPrompt(
      task("studio.brief.staff", { description: "I want a storefront for my bakery" }),
    );
    assert.match(parts.system, /"projectType"/);
    assert.match(parts.system, /"uncertainties"/);
    assert.match(parts.system, /OUT-OF-SCOPE/i); // the refusal contract is preserved
    assert.match(parts.system, /JSON object only|ONLY a JSON object/i);
    assert.equal(parts.messages.length, 1);
    assert.match(parts.messages[0].content, /bakery/);
    // opacity: the doctrine forbids naming the model — assert no model id leaks into the prompt
    assert.doesNotMatch(parts.system, /claude-/);
  });
});

describe("studio.brief.client — message polish builder", () => {
  it("reads input.draft and instructs a POLISH (not a brief), preserving intent/voice", () => {
    const parts = buildStudioMessageRefinePrompt(
      task("studio.brief.client", { draft: "hey just wanted to say the thing is basically done" }),
    );
    assert.match(parts.system, /polish|refine/i);
    assert.match(parts.system, /Preserve intent/i);
    assert.doesNotMatch(parts.system, /"projectType"/); // it is NOT the brief schema
    assert.equal(parts.messages.length, 1);
    assert.match(parts.messages[0].content, /basically done/);
  });
});

describe("studio.brief.coach — multi-turn coach builder", () => {
  it("normalises input.messages into a user-first sequence and instructs the {reply,ready} envelope", () => {
    const parts = buildStudioBriefCoachPrompt(
      task("studio.brief.coach", {
        messages: [
          { role: "assistant", content: "opener (should be dropped — leading assistant)" },
          { role: "user", content: "I need an app for couriers" },
        ],
      }),
    );
    assert.match(parts.system, /"reply"/);
    assert.match(parts.system, /"ready"/);
    assert.equal(parts.messages[0].role, "user"); // leading assistant dropped
    assert.match(parts.messages[0].content, /couriers/);
  });
});
