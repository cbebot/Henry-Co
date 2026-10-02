import { test } from "node:test";
import assert from "node:assert/strict";
import { detectContactDetails } from "../contact.ts";

const RANK = { low: 0, medium: 1, high: 2 };

function strongest(text, kind) {
  const hits = detectContactDetails(text).hits.filter((hit) => !kind || hit.kind === kind);
  return hits.reduce((best, hit) => (best === null || RANK[hit.confidence] > RANK[best] ? hit.confidence : best), null);
}

// ---- recall: every way a seller writes a phone number to dodge a filter ----

const PHONES_HIGH = [
  ["plain local", "Call 08031234567 for more"],
  ["spaced groups", "0803 123 4567"],
  ["dashes", "0803-123-4567"],
  ["dots", "0803.123.4567"],
  ["country code with plus", "+234 803 123 4567"],
  ["country code without plus", "2348031234567"],
  ["00 prefix", "002348031234567"],
  ["letter o for zero (the classic)", "o8o 3123 4567"],
  ["letter O for zero, uppercase", "O8O31234567"],
  ["letter l for one", "o8o3l234567"],
  ["capital I for one", "08O3 I23 4567"],
  ["one digit per token", "0 8 0 3 1 2 3 4 5 6 7"],
  ["spelled out", "zero eight zero three one two three four five six seven"],
  ["spelled and digits mixed", "zero eight zero 3 one two 3 4567"],
  ["oh for zero", "oh eight oh three one two three four five six seven"],
  ["double / triple", "zero eight zero three double one two three four five six"],
  ["stars between digits", "0*8*0*3*1*2*3*4*5*6*7"],
  ["underscores", "0803_123_4567"],
  ["slashes", "0803/123/4567"],
  ["brackets", "(0803) 123 4567"],
  ["newlines", "0803\n123\n4567"],
  ["full-width digits", "０８０３１２３４５６７"],
  ["keycap emoji", "0️⃣8️⃣0️⃣3️⃣1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣"],
  ["arabic-indic digits", "٠٨٠٣١٢٣٤٥٦٧"],
  ["zero-width joiners inside", "0803​123​4567"],
  ["two numbers with a slash", "08031234567/08021234567"],
  ["plus written as a word", "plus two three four eight zero three one two three four five six seven"],
  ["other mobile prefixes", "0701 234 5678"],
  ["091 prefix", "09123456789"],
  ["foreign number with plus", "+44 7911 123456"],
  ["cued ten-digit without trunk zero", "whatsapp 8031234567"],
  ["cued foreign number", "call 2025550143 anytime"],
  ["disguised non-nigerian number", "2o2 555 o143 99"],
];

for (const [name, text] of PHONES_HIGH) {
  test(`phone, high confidence — ${name}`, () => {
    assert.equal(strongest(text, "phone"), "high", JSON.stringify(detectContactDetails(text)));
  });
}

test("a short cued number is held, not rejected", () => {
  assert.equal(strongest("call 5550101 after six", "phone"), "medium");
});

// ---- precision: ordinary listing numbers are not phone numbers -------------

const NOT_PHONES = [
  ["a price", "Price is 250000 naira"],
  ["a price with commas", "Was 1,500,000 now 1,200,000"],
  ["two prices side by side", "7000 8000 per pair"],
  ["a year range", "2019-2023 model, 2024 facelift"],
  ["storage and ram", "iPhone 13 Pro Max 256GB 6GB RAM"],
  ["a model number", "Samsung SM-A515F/DS"],
  ["dimensions", "120 x 60 x 75 cm"],
  ["an EAN barcode", "EAN 5901234123457"],
  ["a serial", "Serial 1234567890123"],
  ["capacity", "Power bank 20000mAh, 22.5W"],
  ["shoe sizes", "Sizes 40 41 42 43 44 45 46"],
  ["litres", "Kegs: 100l 200l 500l"],
  ["small litres", "20l 15l 10l 5l"],
  ["a date", "Made 12/05/2026, expires 12/05/2028"],
  ["a phone listing with numbers", "Tecno phone 2023 6000 128"],
  ["model number label", "Model number 4567123 with warranty"],
  ["weight and count", "50 pieces, 2.5kg, size 42-46"],
  ["quantity tiers", "1 for 3500, 3 for 9000, 6 for 17000"],
  ["a part number", "Toyota filter 90915-10003"],
  ["counting stock", "one two three pieces left"],
  ["times", "Open 08:00 - 17:00 daily"],
  ["percentages", "100% cotton 60 40 blend 220 gsm"],
];

for (const [name, text] of NOT_PHONES) {
  test(`not a phone — ${name}`, () => {
    const got = strongest(text, "phone");
    assert.ok(got === null || got === "low", `${text} -> ${JSON.stringify(detectContactDetails(text))}`);
  });
}

// ---- email -----------------------------------------------------------------

test("emails, plain and disguised, are high confidence", () => {
  for (const text of [
    "mail me: ada.obi@example.com",
    "ada (at) example (dot) com",
    "ada [at] example.com",
    "ada at example dot com",
    "ada at gmail.com",
    "adaobi at yahoo dot com",
  ]) {
    assert.equal(strongest(text, "email"), "high", text);
  }
});

test("a mailbox provider named with its dot is held", () => {
  assert.equal(strongest("find me, adaobi, gmail dot com", "email"), "medium");
});

test("ordinary sentences with 'at' and a full stop are not emails", () => {
  for (const text of [
    "Available at Yaba. Me and my team deliver",
    "Pick up at Ikeja. Come early",
    "Brand new.Come with charger",
    "Looks great at night. Organic cotton",
    "Synced with iCloud. Me and you can share",
  ]) {
    assert.equal(strongest(text, "email"), null, text);
  }
});

// ---- messaging apps and handles --------------------------------------------

test("steering a buyer to a messaging app is high confidence", () => {
  for (const text of [
    "message me on WhatsApp",
    "Chat us on Telegram",
    "DM me via IG",
    "my WhatsApp number is in the picture",
    "Orders via WhatsApp only",
    "payment on telegram",
    "WhatsApp: 08031234567",
    "IG @adaobi_store",
    "Telegram - @adaobi",
  ]) {
    assert.equal(strongest(text, "messaging_app"), "high", text);
  }
});

test("naming an app as a product feature is not a contact attempt", () => {
  for (const text of [
    "This phone works on WhatsApp, Facebook and Instagram",
    "Ring light for TikTok and Instagram videos",
    "WhatsApp-style stickers pack",
    "Facebook-ready product photos included",
    "Signal booster antenna for 4G",
    "Turn signal light for Toyota Corolla",
  ]) {
    const got = strongest(text, "messaging_app");
    assert.ok(got === null || got === "low", `${text} -> ${got}`);
  }
});

test("an app named next to a number or handle lifts both to high", () => {
  const result = detectContactDetails("telegram 5550101");
  assert.equal(result.highest, "high", JSON.stringify(result));
});

test("handles need a letter and are not prices", () => {
  assert.equal(strongest("follow @adaobi_store", "social_handle"), "medium");
  for (const text of ["2 pieces @5000 each", "@N5000 only", "sold @ 3500"]) {
    assert.equal(strongest(text, "social_handle"), null, text);
  }
});

// ---- links -----------------------------------------------------------------

test("contact links are high, other links are held", () => {
  assert.equal(strongest("wa.me/2348031234567", "link"), "high");
  assert.equal(strongest("join t.me/adaobi", "link"), "high");
  assert.equal(strongest("see https://my-own-shop.example/item", "link"), "medium");
  assert.equal(strongest("visit adaobistore.com.ng today", "link"), "medium");
});

test("a missing space after a full stop is not a domain", () => {
  for (const text of ["Good item.Net weight 5kg", "Brand new.Me and my brother", "In stock now.Shop with us", "Lovely.Co-ord set"]) {
    assert.equal(strongest(text, "link"), null, text);
  }
});

// ---- contract ----------------------------------------------------------------

test("clean text reports nothing", () => {
  const result = detectContactDetails("Stainless steel kettle, 2 litre, one year warranty.");
  assert.deepEqual(result, { detected: false, hits: [], highest: null });
});

test("empty and non-string input is safe", () => {
  assert.equal(detectContactDetails("").detected, false);
  assert.equal(detectContactDetails(undefined).detected, false);
  assert.equal(detectContactDetails(null).detected, false);
});

test("a hit never carries the matched text", () => {
  const result = detectContactDetails("call 08031234567 or mail ada@example.com");
  const serialised = JSON.stringify(result);
  assert.ok(!serialised.includes("0803"), serialised);
  assert.ok(!serialised.includes("example.com"), serialised);
});
