import test from "node:test";
import assert from "node:assert/strict";

import {
  getOwnerControlAction,
  listOwnerControlQueueBindings,
  type OwnerControlActionKey,
} from "../registry";

/**
 * V3-OWNER-CONTROL-01 — the action registry's governing invariants.
 *
 * The pass exists because the owner had a console that could only WATCH: two
 * marketplace sellers registered, no approve control existed anywhere, and the
 * verdict had to be typed into the Supabase SQL editor by hand. Everything here
 * defends against shipping that same experience in a new shape — a row with no
 * button, a button the server refuses, or a consequential verdict that a
 * borrowed session can fire without proving who it belongs to.
 */

const BINDINGS = listOwnerControlQueueBindings();

/** Resolve through the public accessor, which is also the route's only door. */
function action(key: OwnerControlActionKey) {
  const resolved = getOwnerControlAction(key);
  assert.ok(resolved, `registry has no action "${key}" — a queue offers a verdict that cannot run.`);
  return resolved;
}

test("V3-OWNER-CONTROL-01: queue/action registry", async (t) => {
  await t.test("CONTAINMENT — every listed status is actionable", () => {
    // The invariant `registry.ts` names in its own docstring. A queue that lists
    // a status none of its actions accept renders a row the owner can see and
    // cannot act on. That is the pre-pass experience reproduced inside the fix.
    for (const binding of BINDINGS) {
      const accepted = new Set(binding.actions.flatMap((key) => action(key).fromStates));
      for (const status of binding.listStates) {
        assert.ok(
          accepted.has(status),
          `queue "${binding.id}" lists status "${status}" but none of its actions ` +
            `[${binding.actions.join(", ")}] accept it. The owner would see that row ` +
            `with no usable button.`,
        );
      }
    }
  });

  await t.test("NO PHANTOM BUTTONS — accepted statuses are listed, or documented", () => {
    // The reverse of containment, and it does NOT hold universally — one action
    // deliberately reaches beyond its queue. Encoding the exception is the point:
    // an undocumented widening means the console offers a verdict on a row it
    // never shows, which is a transition nobody has reviewed.
    const DOCUMENTED_BEYOND_QUEUE: Record<string, readonly string[]> = {
      // Taking down a listing that is already live and approved. The queue is a
      // review backlog and correctly does not list approved products; the power
      // to withdraw one after the fact is reached from the listing itself.
      "marketplace.product.reject": ["approved"],
    };
    for (const binding of BINDINGS) {
      const listed = new Set(binding.listStates);
      for (const key of binding.actions) {
        const allowed = new Set(DOCUMENTED_BEYOND_QUEUE[key] ?? []);
        for (const from of action(key).fromStates) {
          assert.ok(
            listed.has(from) || allowed.has(from),
            `action "${key}" accepts status "${from}", which queue "${binding.id}" ` +
              `never lists and which is not in DOCUMENTED_BEYOND_QUEUE. Either list it ` +
              `or document why the action reaches past its queue.`,
          );
        }
      }
    }
  });

  await t.test("no action is a no-op", () => {
    // An action whose target state is also a legal source state can be fired
    // against a row already in that state. The write cores compare-and-set, so
    // it would settle as `no_op` — a ledger row, an audit entry and a spent
    // reauth for a verdict that changed nothing.
    for (const binding of BINDINGS) {
      for (const key of binding.actions) {
        const a = action(key);
        assert.ok(
          !a.fromStates.includes(a.toState),
          `action "${key}" allows ${a.toState} -> ${a.toState}.`,
        );
      }
    }
  });

  await t.test("REAUTH — every consequential verdict demands a fresh step-up", () => {
    // The brief names the consequential class: money, suspension, deletion.
    // No money action exists on this rail at all (asserted below), so the class
    // reduces to taking a livelihood away or destroying content. Each is listed
    // by key rather than derived, so ADDING a destructive action forces the
    // author to come here and state the intent.
    const MUST_REAUTH: readonly OwnerControlActionKey[] = [
      "marketplace.vendor.suspend", // closes a live store
      "marketplace.vendor.reinstate", // re-opens one; equally worth proving identity for
      "marketplace.product.reject", // withdraws a listing, possibly one already live
      "moderation.item.remove", // destroys reported content
    ];
    for (const key of MUST_REAUTH) {
      assert.equal(
        action(key).requiresReauth,
        true,
        `"${key}" is consequential and must require reauth. Without it, a borrowed ` +
          `session fires this verdict with one tap.`,
      );
    }
  });

  await t.test("every negative verdict demands a written reason", () => {
    // A refusal with no reason is unappealable: the person it lands on is told
    // no and cannot be told why, and the audit row records a decision without
    // its basis.
    const NEGATIVE = new Set(["rejected", "changes_requested", "suspended", "actioned", "dismissed"]);
    for (const binding of BINDINGS) {
      for (const key of binding.actions) {
        const a = action(key);
        if (!NEGATIVE.has(a.toState)) continue;
        assert.equal(
          a.requiresNote,
          true,
          `"${key}" moves a record to "${a.toState}" without requiring a reason.`,
        );
      }
    }
  });

  await t.test("MONEY — the rail carries no money action", () => {
    // The brief is absolute: money moves only through the existing guarded RPCs,
    // and this pass writes no new money path. Dispute resolution is the live
    // temptation — every branch of it drives the payout state machine — so it is
    // absent from the registry rather than partially reimplemented.
    const MONEY = ["refund", "payout", "wallet", "payment", "charge", "settle", "dispute", "money"];
    for (const binding of BINDINGS) {
      for (const key of binding.actions) {
        const a = action(key);
        const surface = `${a.key} ${a.entityType} ${a.toState}`.toLowerCase();
        for (const word of MONEY) {
          assert.ok(
            !surface.includes(word),
            `action "${a.key}" looks like a money path ("${word}"). Money belongs to ` +
              `the guarded RPCs, never to this rail.`,
          );
        }
      }
    }
  });

  await t.test("unknown and malformed keys are refused, never defaulted", () => {
    // The route resolves the caller's `actionKey` through this function alone.
    // Anything that returns a truthy object for an unrecognised input hands the
    // caller an action whose gates are `undefined` — i.e. every gate off.
    for (const bad of [
      "",
      "   ",
      "marketplace.seller.APPROVE",
      "marketplace.seller.approve ",
      "__proto__",
      "constructor",
      "toString",
      "marketplace.seller.approve; drop table",
      null,
      undefined,
      42,
      {},
      [],
      { key: "marketplace.seller.approve" },
    ]) {
      assert.equal(
        getOwnerControlAction(bad as unknown),
        null,
        `getOwnerControlAction(${JSON.stringify(bad) ?? String(bad)}) must be null.`,
      );
    }
  });

  await t.test("a known key still resolves", () => {
    // Guards the test above from passing because resolution is broken outright.
    const a = getOwnerControlAction("marketplace.seller.approve");
    assert.ok(a);
    assert.equal(a.toState, "approved");
    assert.equal(a.entityType, "marketplace_vendor_application");
  });

  await t.test("queue ids and action keys are unique", () => {
    const ids = BINDINGS.map((b) => b.id);
    assert.equal(new Set(ids).size, ids.length, "duplicate queue id");
    for (const binding of BINDINGS) {
      assert.equal(
        new Set(binding.actions).size,
        binding.actions.length,
        `queue "${binding.id}" offers the same action twice`,
      );
    }
  });

  await t.test("every action's division matches the queue that offers it", () => {
    // The division travels onto the audit row and the emitted event. A mismatch
    // files the owner's verdict under the wrong division, which is where anyone
    // reconstructing an incident would fail to find it.
    for (const binding of BINDINGS) {
      for (const key of binding.actions) {
        assert.equal(
          action(key).division,
          binding.division,
          `action "${key}" is division "${action(key).division}" but queue ` +
            `"${binding.id}" is "${binding.division}".`,
        );
      }
    }
  });
});
