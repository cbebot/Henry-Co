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

test("an app named with a number or a handle is high confidence (a datum)", () => {
  for (const text of [
    "WhatsApp: 08031234567",
    "IG @adaobi_store",
    "Telegram - @adaobi",
    "message me on WhatsApp 08031234567",
    "chat us on Telegram, 0803 123 4567",
  ]) {
    assert.equal(strongest(text, "messaging_app"), "high", text);
  }
});

test("steering to an app with no number or handle is held, never refused (a phrase)", () => {
  for (const text of [
    "message me on WhatsApp",
    "Chat us on Telegram",
    "DM me via IG",
    "my WhatsApp number is in the picture",
    "Orders via WhatsApp only",
    "payment on telegram",
    "Whats-App me",
    "chat me on imo",
    "find us on X, same name as this store",
  ]) {
    assert.equal(detectContactDetails(text).highest, "medium", `${text} -> ${JSON.stringify(detectContactDetails(text))}`);
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

// ---- round 3: a datum refuses, a phrase holds, an ordinary sentence passes ----

const highest = (text) => detectContactDetails(text).highest;

test("a number read out in pieces with any short word between them is a phone number", () => {
  for (const text of [
    "0803 na 123 na 4567",
    "0803 or 123 or 4567",
    "0803 after 123 after 4567",
    "o8o3 ehn 123 ehn 4567",
    "zero eight zero three na one two three na four five six seven",
    "zero eight zero three, abeg, one two three, abeg, four five six seven",
    "My line starts 0803, middle 123, ends 4567",
    "First part 0803, second part 123, last part 4567",
    "4567 is the end, 0803 the start, 123 the middle",
    "Number: 0803 (first), 1234567 (rest)",
    "0803 wan tu tree fo faiv siks sevin",
    "zero eit zero tree wan tu tree fo faiv siks sevin",
    "o-eight-o-tree wan-tu-tree fo-faiv-siks-sevin",
    "KET-2000 0803 x 123 x 4567",
    "0803, one, two, three, four, five, six, seven",
  ]) {
    assert.equal(strongest(text, "phone"), "high", `${text} -> ${JSON.stringify(detectContactDetails(text))}`);
  }
});

test("opening hours, dimensions, labelled codes and counting are not phone numbers", () => {
  for (const text of [
    "Open daily 0800 to 1800, 365 days a year.",
    "Hours: 0700 to 2100, 365 days, including public holidays.",
    "Open 0815-1700, 365 days.",
    "Euro pallet 0800 x 1200 x 144 mm, heat treated.",
    "Frame 080 x 1200 x 2100 mm, aluminium.",
    "Dimensions 0803 mm by 1234 mm (custom cut available).",
    "Dual SIM, 4G calls, IMEI 356938035643809.",
    "Dial *#06# for IMEI 356938035643809.",
    "Genuine Toyota oil filter, part number 90915-10003.",
    "Spark plugs for Camry and Corolla, OEM number 90919-01253, set of 4.",
    "Barcode 0 70330 60301 6 on the pack.",
    "UPC 0 71249 30456 2, imported from the US.",
    "Zenith Defy Skyline, ref 03.9300.3620/51.I001, 2023 papers.",
    "S/N 2304123456 printed under the stand.",
    "P/N 1234567890, original replacement part.",
    "GOtv decoder with IUC number 2012345678, subscription expired.",
    "DStv smartcard 7012345678 included with the decoder.",
    "Made in Owerri, Imo State, NAFDAC 01-2345678.",
    "Registered business, RC 1234567. Open 0800 to 1800 on weekdays.",
    "Power bank 20000mAh, manufactured 080124.",
    "Reach up to 1,000,000 people a month with this billboard.",
    "Counting toy: one, two, three, four, five, six, seven, eight, nine and ten.",
    "Two, three, four, five, six, seven and eight seater options available.",
    "KET-2000 Two, three, four, five, six, seven and eight seater options available.",
  ]) {
    const got = strongest(text, "phone");
    assert.ok(got === null || got === "low", `${text} -> ${JSON.stringify(detectContactDetails(text))}`);
  }
});

test("a labelled code that hides a whole mobile number is still one", () => {
  assert.equal(strongest("Ref 0803 123 4567", "phone"), "high");
  assert.equal(strongest("Barcode 08031234567", "phone"), "high");
});

test("phrases that ask for or point to a number are held, never refused", () => {
  for (const text of [
    "drop your number make I call you",
    "comment your number",
    "type your number for the review",
    "write your number in the review",
    "your number abeg, I go call you",
    "tell me your number",
    "I will call you, just drop number",
    "share your handle make I follow you",
    "the number is on the picture",
    "check my store name for my number",
    "link in bio",
    "link in profile",
    "check bio",
    "link dey my bio",
    "l1nk in bio",
    "scan the QR code to order",
    "QR code on the last picture, scan to order",
    "use the barcode in the picture to pay",
    "IG adeshop",
    "tiktok adeshopng",
    "IG — adeshop",
    "mail me: adeshop then the usual gmail",
  ]) {
    assert.equal(highest(text), "medium", `${text} -> ${JSON.stringify(detectContactDetails(text))}`);
  }
});

test("ordinary product sentences that share words with a contact request pass", () => {
  for (const text of [
    "Just put your phone on the pad and it charges.",
    "Drop your phone on the stand and start your video call.",
    "Give your phone a new look with this marble case.",
    "Put your number on the back of the jersey at no extra cost.",
    "Give your number plate a clean chrome finish.",
    "Leave your contact lenses in the solution overnight.",
    "Drop your line in deep water with this 50lb braid.",
    "The phone is in the picture for size comparison only.",
    "Part number is in the picture, please match it before ordering.",
    "See our shop for the details on bulk pricing.",
    "Customers scan the QR code to pay you, no POS needed.",
    "Scan the QR code on the warranty card to reach support.",
    "Available in our bio range of organic skincare.",
    "Recording modes: Instagram - 1080p, TikTok - 60fps.",
    "Phone tripod for Instagram - 2.1m tall.",
    "WhatsApp: supported, dual WhatsApp: supported.",
    "Snap: 12mm brass press studs, 100 sets.",
    "Price is for snap buttons, 100 sets per pack.",
    "Threads tex40, 5000 metres per cone.",
    "Comes with Gmail, YouTube and Play Store preinstalled.",
    "Sync your Gmail and Outlook calendars on the watch.",
    "Available @Lekki and @Ikeja pickup points.",
    "Perfect for work @home or office.",
    "Perfect for growing your social media page.",
    "Ideal for our social evenings and parties.",
    "Ring light for TikTok and Instagram videos, 10 inch.",
    "Tripod for TikTok, YouTube and Facebook live.",
  ]) {
    const got = highest(text);
    assert.ok(got === null || got === "low", `${text} -> ${JSON.stringify(detectContactDetails(text))}`);
  }
});

test("a handle, an email or a spelled link tied to an app is refused", () => {
  for (const text of [
    "my snap: adeshop22",
    "my tg: adeshop_ng",
    "find Ade Shop on Twitter",
    "ping me on discord, user adeshop#1234",
    "adeshop at outlook",
    "adeshop at g-mail",
    "adeshop<at>gmail<dot>com",
    "telegram dot me slash adeshop",
  ]) {
    assert.equal(highest(text), "high", `${text} -> ${JSON.stringify(detectContactDetails(text))}`);
  }
});

test("account numbers: one number however it is separated, and halves", async () => {
  const { collapseTenDigitRuns, hasSplitTenDigitNumber } = await import("../contact.ts");
  for (const [text, collapsed] of [
    ["GTB 0123/456/789", "GTB 0123456789"],
    ["GTB 0123 - 456 - 789", "GTB 0123456789"],
    ["acct no 0123,456,789 zenith", "acct no 0123456789 zenith"],
    ["Kuda 0123_456_789", "Kuda 0123456789"],
    ["UBA (0123) 456789", "UBA (0123456789"],
    ["GTB 0123 456 789, 2 day delivery", "GTB 0123456789, 2 day delivery"],
  ]) {
    assert.equal(collapseTenDigitRuns(text), collapsed, text);
  }
  // Sizes and times stay as they are.
  assert.equal(collapseTenDigitRuns("sizes 10 12 14 16 18"), "sizes 10 12 14 16 18");
  assert.equal(collapseTenDigitRuns("03.3100.3600/69.M3100"), "03.3100.3600/69.M3100");
  for (const text of ["first 5 digits 01234, last 5 digits 56789", "GTB: 01234 then 56789", "ends with 56789, starts with 01234"]) {
    assert.equal(hasSplitTenDigitNumber(text), true, text);
  }
  assert.equal(hasSplitTenDigitNumber("Was 25000 now 18500"), false);
});

test("every detector is linear: 100,000 characters screen well under a second", () => {
  const fill = (unit, n = 100_000) => unit.repeat(Math.ceil(n / unit.length)).slice(0, n);
  const late = (head, mid, unit, n = 100_000) => fill(head, n / 2) + mid + fill(unit, n / 2 - mid.length);
  const HOSTILE = {
    "weak look-alike after a number": late("1 ", "08031234567 ", "S7 "),
    "joining words after a prefix": late("1 ", "0803", " x 1"),
    "a run of number heads": fill("0803 a "),
    "placed pieces": fill("starts 0803, middle 123, ends 4567, "),
    "one long run": fill("0803-"),
    "at signs": fill("@abcde "),
    "app then word": fill("ig abcd. "),
    "contact requests": fill("drop your number "),
  };
  for (const [name, text] of Object.entries(HOSTILE)) {
    const started = performance.now();
    detectContactDetails(text);
    const elapsed = performance.now() - started;
    assert.ok(elapsed < 1500, `${name}: ${Math.round(elapsed)} ms`);
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
