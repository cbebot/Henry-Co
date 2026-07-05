import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildStudioBriefStructuredPrompt,
  buildStudioMessageRefinePrompt,
  buildStudioBriefCoachPrompt,
  parseCoachEnvelope,
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
    assert.match(parts.system, /"covered"/);
    assert.equal(parts.messages[0].role, "user"); // leading assistant dropped
    assert.match(parts.messages[0].content, /couriers/);
  });

  it("carries the consultative posture: consult-then-ask, outcome-first, complexity-scaled discovery", () => {
    const parts = buildStudioBriefCoachPrompt(task("studio.brief.coach", { messages: [] }));
    assert.match(parts.system, /Answer before you ask/i);
    assert.match(parts.system, /outcome/i);
    assert.match(parts.system, /SCALE THE DISCOVERY/i);
    assert.match(parts.system, /discovery session/i);
    assert.match(parts.system, /never the same redirect twice/i);
  });
});

describe("parseCoachEnvelope — the coach output contract the orchestrator validates", () => {
  it("parses the strict {reply,ready,progress,covered} envelope", () => {
    assert.deepEqual(parseCoachEnvelope('{"reply":"Who is it for?","ready":false,"progress":35,"covered":["purpose"]}'), {
      reply: "Who is it for?",
      ready: false,
      progress: 35,
      covered: ["purpose"],
    });
  });
  it("tolerates code fences and surrounding prose", () => {
    assert.deepEqual(parseCoachEnvelope('```json\n{"reply":"Done.","ready":true,"progress":100}\n```'), {
      reply: "Done.",
      ready: true,
      progress: 100,
      covered: ["purpose", "audience", "features", "budget", "timeline", "outcome"],
    });
    assert.deepEqual(parseCoachEnvelope('Sure! {"reply":"Noted — and the budget?","ready":false,"progress":60} hope that helps'), {
      reply: "Noted — and the budget?",
      ready: false,
      progress: 60,
      covered: [],
    });
  });
  it("progress is back-compatible: absent → 0, out-of-range clamped, ready implies 100", () => {
    assert.equal(parseCoachEnvelope('{"reply":"Hi","ready":false}')?.progress, 0);
    assert.equal(parseCoachEnvelope('{"reply":"Hi","ready":false,"progress":250}')?.progress, 100);
    assert.equal(parseCoachEnvelope('{"reply":"Hi","ready":false,"progress":-4}')?.progress, 0);
    assert.equal(parseCoachEnvelope('{"reply":"Done","ready":true,"progress":40}')?.progress, 100);
  });
  it("covered keeps only known tokens, dedupes, canonical order; ready implies the full checklist", () => {
    assert.deepEqual(
      parseCoachEnvelope('{"reply":"Hi","ready":false,"covered":["budget","purpose","BUDGET","vibes",42]}')?.covered,
      ["purpose", "budget"],
      "junk + dupes dropped, canonical order restored",
    );
    assert.deepEqual(parseCoachEnvelope('{"reply":"Hi","ready":false}')?.covered, [], "absent → empty (back-compatible)");
    assert.deepEqual(
      parseCoachEnvelope('{"reply":"Done","ready":true,"covered":["purpose"]}')?.covered,
      ["purpose", "audience", "features", "budget", "timeline", "outcome"],
      "the wrap-up never shows a pending area",
    );
  });
  it("returns null for prose without an envelope (so the orchestrator RETRIES instead of falling back)", () => {
    assert.equal(parseCoachEnvelope("What's the main purpose of the site?"), null);
    assert.equal(parseCoachEnvelope('{"ready":true}'), null);
    assert.equal(parseCoachEnvelope(""), null);
  });
});
