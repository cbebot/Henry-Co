import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  assessFreeMessage,
  evaluateFreeAccess,
  shouldRestrict,
  ANON_FREE_TURNS_BEFORE_SIGN_IN,
  FREE_ABUSE_REFUSAL_THRESHOLD,
  FREE_MESSAGE_MAX_CHARS,
} from "../abuse-guard";

describe("assessFreeMessage — the cheap pre-model junk filter", () => {
  it("passes a real question (so it reaches the model)", () => {
    assert.equal(assessFreeMessage({ text: "How do I track my order?" }).ok, true);
  });

  it("passes a non-Latin question (language mirroring is never punished)", () => {
    assert.equal(assessFreeMessage({ text: "¿Cómo rastreo mi pedido?" }).ok, true);
    assert.equal(assessFreeMessage({ text: "我的订单在哪里？" }).ok, true);
    assert.equal(assessFreeMessage({ text: "أين طلبي؟" }).ok, true);
  });

  it("rejects empty / whitespace", () => {
    assert.equal(assessFreeMessage({ text: "" }).verdict, "empty");
    assert.equal(assessFreeMessage({ text: "   \n  " }).verdict, "empty");
  });

  it("rejects a paste-bomb", () => {
    assert.equal(assessFreeMessage({ text: "x".repeat(FREE_MESSAGE_MAX_CHARS + 1) }).verdict, "too_long");
  });

  it("rejects an exact repeat of a recent turn", () => {
    const r = assessFreeMessage({ text: "same thing again", recentUserTexts: ["Same Thing Again", "other"] });
    assert.equal(r.ok, false);
    assert.equal(r.verdict, "repeat");
  });

  it("rejects a single character mashed, but not a short real word", () => {
    assert.equal(assessFreeMessage({ text: "aaaaaaaaaaaa" }).verdict, "char_mash");
    assert.equal(assessFreeMessage({ text: "........." }).verdict, "char_mash");
    assert.equal(assessFreeMessage({ text: "ok" }).ok, true, "a short real word is fine");
    assert.equal(assessFreeMessage({ text: "hello hello" }).ok, true, "repeated WORDS are not a char-mash");
  });
});

describe("evaluateFreeAccess — the access policy", () => {
  const now = 1_000_000;

  it("allows a signed-in person with a clean record", () => {
    assert.equal(evaluateFreeAccess({ isAnonymous: false, turnsInWindow: 50, refusedInWindow: 0 }, now).decision, "allow");
  });

  it("lets an anonymous visitor taste, then requires sign-in to continue", () => {
    assert.equal(evaluateFreeAccess({ isAnonymous: true, turnsInWindow: 2, refusedInWindow: 0 }, now).decision, "allow");
    const over = evaluateFreeAccess(
      { isAnonymous: true, turnsInWindow: ANON_FREE_TURNS_BEFORE_SIGN_IN, refusedInWindow: 0 },
      now,
    );
    assert.equal(over.decision, "require_sign_in");
    assert.equal(over.reason, "anon_limit");
  });

  it("does not gate a SIGNED-IN person on the anon taste limit", () => {
    assert.equal(
      evaluateFreeAccess({ isAnonymous: false, turnsInWindow: 999, refusedInWindow: 0 }, now).decision,
      "allow",
    );
  });

  it("restriction wins over everything while it is live", () => {
    const r = evaluateFreeAccess(
      { isAnonymous: false, turnsInWindow: 1, refusedInWindow: 0, restrictedUntilMs: now + 1000 },
      now,
    );
    assert.equal(r.decision, "restricted");
  });

  it("an expired restriction no longer blocks", () => {
    assert.equal(
      evaluateFreeAccess({ isAnonymous: false, turnsInWindow: 1, refusedInWindow: 0, restrictedUntilMs: now - 1 }, now)
        .decision,
      "allow",
    );
  });
});

describe("shouldRestrict — graduated escalation, never an instant ban", () => {
  const now = 5_000_000;
  it("does not restrict below the threshold", () => {
    assert.equal(shouldRestrict(FREE_ABUSE_REFUSAL_THRESHOLD - 1, now).restrict, false);
  });
  it("restricts for a forward window at/over the threshold", () => {
    const r = shouldRestrict(FREE_ABUSE_REFUSAL_THRESHOLD, now);
    assert.equal(r.restrict, true);
    assert.ok((r.untilMs ?? 0) > now, "the hold is in the future");
  });
});
