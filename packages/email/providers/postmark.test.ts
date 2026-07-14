import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import {
  getPostmarkSender,
  getPostmarkServerToken,
  resolvePostmarkStream,
  sendPostmarkEmail,
} from "./postmark";

const ENV_KEYS = [
  "POSTMARK_SERVER_TOKEN",
  "POSTMARK_API_TOKEN",
  "POSTMARK_FROM_EMAIL",
  "POSTMARK_MESSAGE_STREAM",
] as const;

let savedEnv: Record<string, string | undefined>;
const realFetch = globalThis.fetch;

beforeEach(() => {
  savedEnv = {};
  for (const k of ENV_KEYS) {
    savedEnv[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  globalThis.fetch = realFetch;
});

describe("resolvePostmarkStream", () => {
  it("maps division purposes to dedicated reputation streams", () => {
    assert.equal(resolvePostmarkStream({ to: "a@b.co", subject: "x", purpose: "care" }), "fabric-care");
    assert.equal(resolvePostmarkStream({ to: "a@b.co", subject: "x", purpose: "studio" }), "studio-notifications");
    assert.equal(resolvePostmarkStream({ to: "a@b.co", subject: "x", purpose: "property" }), "property-inquiries");
    assert.equal(resolvePostmarkStream({ to: "a@b.co", subject: "x", purpose: "security" }), "software-alerts");
    assert.equal(resolvePostmarkStream({ to: "a@b.co", subject: "x", purpose: "newsletter" }), "marketing-broadcast");
  });

  it("defaults transactional purposes to the built-in outbound stream", () => {
    for (const purpose of ["auth", "support", "generic", "jobs", "learn", "logistics", "marketplace"] as const) {
      assert.equal(resolvePostmarkStream({ to: "a@b.co", subject: "x", purpose }), "outbound");
    }
  });

  it("honors an explicit messageStream override above the purpose map", () => {
    assert.equal(
      resolvePostmarkStream({ to: "a@b.co", subject: "x", purpose: "care", messageStream: "vip-lane" }),
      "vip-lane",
    );
  });

  it("respects POSTMARK_MESSAGE_STREAM as the transactional default", () => {
    process.env.POSTMARK_MESSAGE_STREAM = "transactional";
    assert.equal(resolvePostmarkStream({ to: "a@b.co", subject: "x", purpose: "auth" }), "transactional");
  });
});

describe("getPostmarkServerToken", () => {
  it("reads POSTMARK_SERVER_TOKEN, trims, and accepts the API_TOKEN alias", () => {
    assert.equal(getPostmarkServerToken(), null);
    process.env.POSTMARK_API_TOKEN = "  tok-alias  ";
    assert.equal(getPostmarkServerToken(), "tok-alias");
    process.env.POSTMARK_SERVER_TOKEN = "tok-primary";
    assert.equal(getPostmarkServerToken(), "tok-primary");
  });
});

describe("getPostmarkSender", () => {
  it("prefers an explicit from/fromName over env", () => {
    process.env.POSTMARK_FROM_EMAIL = "Env Name <env@henryonyx.com>";
    const s = getPostmarkSender({ to: "a@b.co", subject: "x", from: "x@henryonyx.com", fromName: "X" });
    assert.deepEqual(s, { email: "x@henryonyx.com", name: "X" });
  });

  it("parses a 'Name <email>' POSTMARK_FROM_EMAIL", () => {
    process.env.POSTMARK_FROM_EMAIL = "Henry Onyx Care <care@henryonyx.com>";
    const s = getPostmarkSender({ to: "a@b.co", subject: "x" });
    assert.equal(s.email, "care@henryonyx.com");
    assert.equal(s.name, "Henry Onyx Care");
  });
});

describe("sendPostmarkEmail", () => {
  it("skips (no throw) when the server token is absent", async () => {
    const r = await sendPostmarkEmail({ to: "a@b.co", subject: "x", text: "y" });
    assert.equal(r.status, "skipped");
    assert.equal(r.provider, "postmark");
  });

  it("returns sent with the Postmark MessageID, correct stream + token header", async () => {
    process.env.POSTMARK_SERVER_TOKEN = "tok";
    let captured: { url: unknown; init: RequestInit } | null = null;
    globalThis.fetch = (async (url: unknown, init: RequestInit) => {
      captured = { url, init };
      return new Response(JSON.stringify({ ErrorCode: 0, MessageID: "mid-123" }), { status: 200 });
    }) as unknown as typeof fetch;

    const r = await sendPostmarkEmail({ to: "a@b.co", subject: "Hi", html: "<p>hi</p>", purpose: "care" });
    assert.equal(r.status, "sent");
    assert.equal(r.messageId, "mid-123");

    const headers = captured!.init.headers as Record<string, string>;
    const body = JSON.parse(captured!.init.body as string);
    assert.equal(body.MessageStream, "fabric-care");
    assert.equal(headers["X-Postmark-Server-Token"], "tok");
    assert.equal(body.TrackOpens, true);
  });

  it("treats a non-zero ErrorCode even on HTTP 200 as an error (no false 'sent')", async () => {
    process.env.POSTMARK_SERVER_TOKEN = "tok";
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ ErrorCode: 406, Message: "Inactive recipient" }), {
        status: 200,
      })) as unknown as typeof fetch;
    const r = await sendPostmarkEmail({ to: "a@b.co", subject: "x", text: "y" });
    assert.equal(r.status, "error");
    assert.match(r.safeError ?? "", /Inactive recipient/);
  });

  it("maps an HTTP 422 validation failure to a safe error", async () => {
    process.env.POSTMARK_SERVER_TOKEN = "tok";
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ ErrorCode: 300, Message: "Invalid 'From' address" }), {
        status: 422,
      })) as unknown as typeof fetch;
    const r = await sendPostmarkEmail({ to: "a@b.co", subject: "x", text: "y" });
    assert.equal(r.status, "error");
  });

  it("disables open/click tracking on auth and security emails", async () => {
    process.env.POSTMARK_SERVER_TOKEN = "tok";
    const bodies: Record<string, unknown>[] = [];
    globalThis.fetch = (async (_u: unknown, init: RequestInit) => {
      bodies.push(JSON.parse(init.body as string));
      return new Response(JSON.stringify({ ErrorCode: 0, MessageID: "m" }), { status: 200 });
    }) as unknown as typeof fetch;
    for (const purpose of ["auth", "security"] as const) {
      await sendPostmarkEmail({ to: "a@b.co", subject: "x", html: "<a href='https://x'>y</a>", purpose });
    }
    for (const b of bodies) {
      assert.equal(b.TrackOpens, false);
      assert.equal(b.TrackLinks, "None");
    }
  });

  it("keeps tracking on for non-sensitive purposes", async () => {
    process.env.POSTMARK_SERVER_TOKEN = "tok";
    let body: Record<string, unknown> = {};
    globalThis.fetch = (async (_u: unknown, init: RequestInit) => {
      body = JSON.parse(init.body as string);
      return new Response(JSON.stringify({ ErrorCode: 0, MessageID: "m" }), { status: 200 });
    }) as unknown as typeof fetch;
    await sendPostmarkEmail({ to: "a@b.co", subject: "x", html: "<p>y</p>", purpose: "marketplace" });
    assert.equal(body.TrackOpens, true);
    assert.equal(body.TrackLinks, "HtmlAndText");
  });

  it("strips CR/LF and control chars from header fields (defense-in-depth)", async () => {
    process.env.POSTMARK_SERVER_TOKEN = "tok";
    let body: Record<string, unknown> = {};
    globalThis.fetch = (async (_u: unknown, init: RequestInit) => {
      body = JSON.parse(init.body as string);
      return new Response(JSON.stringify({ ErrorCode: 0, MessageID: "m" }), { status: 200 });
    }) as unknown as typeof fetch;
    const CR = String.fromCharCode(13);
    const LF = String.fromCharCode(10);
    await sendPostmarkEmail({
      to: `a@b.co${CR}${LF}Bcc: evil@x.com`,
      subject: `Hello${LF}Injected`,
      text: "y",
      purpose: "generic",
    });
    const to = String(body.To);
    const subject = String(body.Subject);
    assert.ok(!to.includes(CR) && !to.includes(LF), "To must not contain CR/LF");
    assert.ok(!subject.includes(LF), "Subject must not contain LF");
    assert.equal(to, "a@b.coBcc: evil@x.com");
  });

  it("returns a safe error (no throw) when fetch rejects", async () => {
    process.env.POSTMARK_SERVER_TOKEN = "tok";
    globalThis.fetch = (async () => {
      throw new Error("boom");
    }) as unknown as typeof fetch;
    const r = await sendPostmarkEmail({ to: "a@b.co", subject: "x", text: "y" });
    assert.equal(r.status, "error");
    assert.equal(r.safeError, "boom");
  });
});
