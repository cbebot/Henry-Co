/**
 * REALTIME-01 — auth-state-change token-refresh contract.
 *
 * The dashboard-shell realtime provider must call
 * `supabase.realtime.setAuth(newToken)` whenever the Supabase auth
 * client emits `TOKEN_REFRESHED`. Without this, every long-lived tab
 * eventually loops `connecting / reconnecting` after the first hourly
 * JWT rotation — the bug the owner reported.
 *
 * `handleSupabaseAuthEvent` is the pure helper extracted from that
 * effect (see supabase-realtime-provider.tsx) so the contract is
 * testable in `node:test` without spinning up React.
 *
 * Runtime: node:test via tsx --test.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  handleSupabaseAuthEvent,
  type RealtimeAuthRefreshDeps,
} from "../shell/supabase-realtime-provider";

type EmitCall = Parameters<RealtimeAuthRefreshDeps["emit"]>;
type SetAuthCall = Parameters<NonNullable<RealtimeAuthRefreshDeps["setAuth"]>>;

function makeDeps(overrides: Partial<RealtimeAuthRefreshDeps> = {}) {
  const setAuthCalls: SetAuthCall[] = [];
  const emitCalls: EmitCall[] = [];
  const deps: RealtimeAuthRefreshDeps = {
    setAuth: (token: string | null) => {
      setAuthCalls.push([token]);
    },
    hasStaffAccess: false,
    userId: "user-1",
    emit: ((state, payload) => {
      emitCalls.push([state, payload]);
    }) as RealtimeAuthRefreshDeps["emit"],
    ...overrides,
  };
  return { deps, setAuthCalls, emitCalls };
}

describe("handleSupabaseAuthEvent — TOKEN_REFRESHED", () => {
  it("calls setAuth with the new access_token on a TOKEN_REFRESHED event", () => {
    const { deps, setAuthCalls, emitCalls } = makeDeps();
    handleSupabaseAuthEvent(
      "TOKEN_REFRESHED",
      { access_token: "fresh.jwt.value" },
      deps,
    );
    assert.deepEqual(setAuthCalls, [["fresh.jwt.value"]]);
    // One reconnecting event for the customer channel; staff is gated
    // off in this test (hasStaffAccess = false).
    assert.equal(emitCalls.length, 1);
    assert.equal(emitCalls[0][0], "reconnecting");
    assert.equal(emitCalls[0][1].channel, "customer");
    assert.equal(emitCalls[0][1].reason, "token_refresh");
    assert.equal(emitCalls[0][1].userId, "user-1");
  });

  it("also emits a reconnecting event for the staff channel when hasStaffAccess", () => {
    const { deps, setAuthCalls, emitCalls } = makeDeps({ hasStaffAccess: true });
    handleSupabaseAuthEvent(
      "TOKEN_REFRESHED",
      { access_token: "fresh.jwt.value" },
      deps,
    );
    assert.deepEqual(setAuthCalls, [["fresh.jwt.value"]]);
    assert.equal(emitCalls.length, 2);
    assert.equal(emitCalls[0][1].channel, "customer");
    assert.equal(emitCalls[1][1].channel, "staff");
    assert.equal(emitCalls[1][1].reason, "token_refresh");
  });

  it("passes null to setAuth when the session is missing or has no access_token", () => {
    const { deps, setAuthCalls } = makeDeps();
    handleSupabaseAuthEvent("TOKEN_REFRESHED", null, deps);
    assert.deepEqual(setAuthCalls, [[null]]);

    const second = makeDeps();
    handleSupabaseAuthEvent("TOKEN_REFRESHED", { access_token: null }, second.deps);
    assert.deepEqual(second.setAuthCalls, [[null]]);
  });

  it("emits a failed event with error_class auth when setAuth throws", () => {
    const thrownErr = new Error("simulated rotation failure");
    const { deps, emitCalls } = makeDeps({
      setAuth: () => {
        throw thrownErr;
      },
    });
    handleSupabaseAuthEvent(
      "TOKEN_REFRESHED",
      { access_token: "fresh.jwt.value" },
      deps,
    );
    assert.equal(emitCalls.length, 1);
    assert.equal(emitCalls[0][0], "failed");
    assert.equal(emitCalls[0][1].channel, "customer");
    assert.equal(emitCalls[0][1].error_class, "auth");
    assert.equal(emitCalls[0][1].reason, "simulated rotation failure");
  });

  it("does not crash and does not emit anything when setAuth is undefined", () => {
    const { deps, emitCalls } = makeDeps({ setAuth: undefined });
    handleSupabaseAuthEvent(
      "TOKEN_REFRESHED",
      { access_token: "fresh.jwt.value" },
      deps,
    );
    assert.equal(emitCalls.length, 0);
  });
});

describe("handleSupabaseAuthEvent — non-refresh events", () => {
  const NON_REFRESH_EVENTS = [
    "SIGNED_IN",
    "SIGNED_OUT",
    "USER_UPDATED",
    "PASSWORD_RECOVERY",
    "INITIAL_SESSION",
  ];

  for (const event of NON_REFRESH_EVENTS) {
    it(`is a no-op on ${event}`, () => {
      const { deps, setAuthCalls, emitCalls } = makeDeps();
      handleSupabaseAuthEvent(
        event,
        { access_token: "should.not.matter" },
        deps,
      );
      assert.equal(setAuthCalls.length, 0);
      assert.equal(emitCalls.length, 0);
    });
  }
});
