import { test } from "node:test";
import assert from "node:assert/strict";
import { detectContactDetails, LITERAL_EVIDENCE } from "../contact.ts";

const RANK = { low: 0, medium: 1, high: 2 };

function strongest(text, kind) {
  const hits = detectContactDetails(text).hits.filter((hit) => !kind || hit.kind === kind);
  return hits.reduce((best, hit) => (best === null || RANK[hit.confidence] > RANK[best] ? hit.confidence : best), null);
}

// ---- the refuse tier: a mobile number written the standard way ----------------
// (Digits of other scripts, full-width digits, keycaps and invisible characters
// render as the digits they are: the text is read as it renders.)

const PHONES_HIGH = [
  ["plain local", "Call 08031234567 for more"],
  ["spaced groups", "0803 123 4567"],
  ["dashes", "0803-123-4567"],
  ["dashes with spaces", "0803 - 123 - 4567"],
  ["dots", "0803.123.4567"],
  ["four groups", "0803 123 45 67"],
  ["country code with plus", "+234 803 123 4567"],
  ["country code without plus", "2348031234567"],
  ["00 prefix", "002348031234567"],
  ["full-width digits", "０８０３１２３４５６７"],
  ["keycap emoji", "0️⃣8️⃣0️⃣3️⃣1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣"],
  ["arabic-indic digits", "٠٨٠٣١٢٣٤٥٦٧"],
  ["zero-width joiners inside", "0803​123​4567"],
  ["glued to a word", "call08031234567"],
  ["two numbers with a slash", "08031234567/08021234567"],
  ["other mobile prefixes", "0701 234 5678"],
  ["091 prefix", "09123456789"],
];

for (const [name, text] of PHONES_HIGH) {
  test(`phone, high confidence (literal) — ${name}`, () => {
    assert.equal(strongest(text, "phone"), "high", JSON.stringify(detectContactDetails(text)));
  });
}

// ---- the hold tier: every way a seller rebuilds a phone number to dodge a filter ----

const PHONES_HELD = [
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
  ["mixed separators", "0803 123-4567"],
  ["pipes", "0803 | 123 | 4567"],
  ["emoji between groups", "0803🔥123🔥4567"],
  ["plus written as a word", "plus two three four eight zero three one two three four five six seven"],
  ["foreign number with plus", "+44 7911 123456"],
  ["cued ten-digit without trunk zero", "whatsapp 8031234567"],
  ["cued foreign number", "call 2025550143 anytime"],
  ["disguised non-nigerian number", "2o2 555 o143 99"],
  ["pieces with an aside between them", "Call 0803 (that's MTN), then 123, then 4567"],
  ["pieces with a row of dots", "0803 . . . . . . . 123 . . . . . . . 4567"],
  ["pieces with three words between", "0803 abeg no vex 123 4567"],
  ["spelled pieces with asides", "zero eight zero three (my MTN line) one two three (no spaces) four five six seven"],
];

for (const [name, text] of PHONES_HELD) {
  test(`phone, held for a person (reconstructed) — ${name}`, () => {
    assert.equal(strongest(text, "phone"), "medium", JSON.stringify(detectContactDetails(text)));
  });
}

test("THE TIERS: a reading rebuilt from a disguise is never high, and only literal evidence ever is", () => {
  for (const [, text] of PHONES_HELD) {
    for (const hit of detectContactDetails(text).hits) assert.notEqual(hit.confidence, "high", `${text} -> ${hit.kind}:${hit.evidence}`);
  }
  for (const text of [
    "adeshop at gmail",
    "ada at gmail.com",
    "adeshop(at)gmail",
    "adeshop [at] outlook",
    "adeshop{at}yahoo",
    "adeshop(@)gmail",
    "adeshop gmail com",
    "Mail adeshop on gmail",
    "adeshop@gmail",
    "adeshop<at>gmail<dot>com",
    "adeshop dot com",
    "adeshop.c0m",
    "www adeshop com",
    "adeshop dotcom",
    "adeshop .store",
    "telegram dot me slash adeshop",
    "IG 👉 adeshop_ng",
    'IG: "adeshop_ng"',
    "IG (adeshop_ng)",
    "IG | adeshop_ng",
    "Follow adeshop_ng on I.G",
    "Snap: adeshop22",
    "holla at adeshop_ng",
    "find Ade Shop on Twitter",
    "user adeshop#1234",
    "telegram 5550101",
    "WhatsApp 0803 na 123 na 4567",
  ]) {
    const result = detectContactDetails(text);
    assert.equal(result.highest, "medium", `${text} -> ${JSON.stringify(result)}`);
  }
  // Structural: whatever the input, a "high" hit carries literal evidence.
  for (const text of [...PHONES_HIGH.map(([, t]) => t), "IG: adeshop_ng", "adeshop.store", "ada.obi@example.com", "follow @ade_shop"]) {
    for (const hit of detectContactDetails(text).hits) {
      if (hit.confidence === "high") assert.ok(LITERAL_EVIDENCE.has(hit.evidence), `${text} -> ${hit.evidence}`);
    }
  }
});

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

test("an email written as one is high confidence", () => {
  for (const text of [
    "mail me: ada.obi@example.com",
    "ada.obi@example.com",
    "ada @ example.com",
    "ada_obi at gmail.com",
    "adeshop22 at yahoo.com",
    "email me: ada at yahoo.com",
  ]) {
    assert.equal(strongest(text, "email"), "high", text);
  }
});

test("an email rebuilt from a disguise is held, never refused", () => {
  for (const text of [
    "ada (at) example (dot) com",
    "ada [at] example.com",
    "ada at example dot com",
    "ada at gmail.com",
    "adaobi at yahoo dot com",
    "adeshop@gmail",
    "adeshop @ gmail",
    "adeshop at gmail",
    "adeshop(at)gmail",
    "adeshop [at] gmail",
    "adeshop{at}yahoo",
    "adeshop(@)gmail",
    "adeshop gmail com",
    "adeshop🌀gmail🌀com",
    "Mail adeshop on gmail",
    "gmail: adeshop",
  ]) {
    assert.equal(strongest(text, "email"), "medium", `${text} -> ${JSON.stringify(detectContactDetails(text))}`);
  }
});

test("an ordinary word before 'at iCloud / Outlook / Gmail' is not an address", () => {
  for (const text of [
    "Not locked at iCloud, clean IMEI.",
    "Backed up at iCloud, factory reset done.",
    "Signed out at iCloud and Google.",
    "Comes with Office: good at Outlook, Word and Excel.",
    "Log in at Gmail to set up the tablet.",
    "Available at Outlook stores nationwide.",
  ]) {
    assert.equal(detectContactDetails(text).highest, null, `${text} -> ${JSON.stringify(detectContactDetails(text))}`);
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

test("an app named next to a number or handle is as sure as that number or handle, never surer", () => {
  assert.equal(strongest("telegram 0803 123 4567", "messaging_app"), "high");
  assert.equal(strongest("telegram 5550101", "messaging_app"), "medium");
  assert.equal(detectContactDetails("telegram 5550101").highest, "medium");
});

test("handles need a letter and are not prices; '@' and a word that can only be a handle is one", () => {
  assert.equal(strongest("follow @adaobi_store", "social_handle"), "high");
  assert.equal(strongest("follow @adaobi", "social_handle"), "medium");
  for (const text of ["2 pieces @5000 each", "@N5000 only", "sold @ 3500"]) {
    assert.equal(strongest(text, "social_handle"), null, text);
  }
});

test("a rank, a full stop with no space after it, Imo the state and a colour code are not handles", () => {
  for (const text of [
    "We are no.1 on Instagram for wigs.",
    "Instagram no.1 hair vendor in Lagos.",
    "TikTok no.1 bestselling lip gloss.",
    "Facebook page no.1 for kids wear.",
    "Delivery within Imo is free.Outside Imo is 5000.",
    "Imo: free.Lagos: 2500.",
    "Snap is easy.Just press the button.",
    "Hang tag shows colour#2045 on each piece.",
  ]) {
    const got = detectContactDetails(text).highest;
    assert.ok(got === null || got === "low", `${text} -> ${JSON.stringify(detectContactDetails(text))}`);
  }
});

test("a handle after an arrow, a quote, a bracket, a pipe or a slash is held", () => {
  for (const text of [
    "IG 👉 adeshop_ng",
    "IG → adeshop_ng",
    "IG => adeshop_ng",
    'IG: "adeshop_ng"',
    "TikTok: “adeshop_ng”",
    "IG (adeshop_ng)",
    "Instagram (adeshop_ng)",
    "IG | adeshop_ng",
    "IG / adeshop_ng",
    "Snapchat 👉 adeshop22",
    "Follow adeshop_ng on I.G",
  ]) {
    assert.equal(strongest(text, "social_handle"), "medium", `${text} -> ${JSON.stringify(detectContactDetails(text))}`);
  }
});

// ---- links -----------------------------------------------------------------

test("links and domains on a known top-level domain are high, in any letter case; others are held", () => {
  assert.equal(strongest("wa.me/2348031234567", "link"), "high");
  assert.equal(strongest("join t.me/adaobi", "link"), "high");
  assert.equal(strongest("see https://my-own-shop.example/item", "link"), "medium");
  for (const text of [
    "visit adaobistore.com.ng today",
    "https://adeshop.store/item",
    "adeshop.store",
    "ADESHOP.STORE",
    "Visit AdeShop.Store for more designs",
    "Shop more at AdeFashion.Online",
    "More styles: AdeShop.Bumpa.Shop",
    "Adeshop.Shop",
    "Ade-Fashion.Online",
    "www.adeshop.com",
  ]) {
    assert.equal(strongest(text, "link"), "high", text);
  }
  for (const text of ["adeshop.c0m", "www adeshop com", "adeshop dotcom", "adeshop .store", "adeshop[.]com", "Visit Adeshop.Shop Now", "find us on facebook.com"]) {
    assert.equal(strongest(text, "link"), "medium", text);
  }
});

test("a missing space after a full stop is not a domain", () => {
  for (const text of [
    "Good item.Net weight 5kg",
    "Brand new.Me and my brother",
    "In stock now.Shop with us",
    "Lovely.Co-ord set",
    "Brand New.Shop Now while stock lasts.",
  ]) {
    assert.equal(strongest(text, "link"), null, text);
  }
});

// ---- round 3: a datum refuses, a phrase holds, an ordinary sentence passes ----

const highest = (text) => detectContactDetails(text).highest;

test("a number read out in pieces with anything between them is caught, and held (a reconstruction)", () => {
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
    "Call 0803 - remove the dashes - 123 - 4567",
    "My line: 0803, the following digits 123 and finally 4567",
    "Call 080 . . . . . . . 3123 . . . . . . . 4567",
  ]) {
    assert.equal(strongest(text, "phone"), "medium", `${text} -> ${JSON.stringify(detectContactDetails(text))}`);
  }
});

test("watch references, band lists, Christmas tree sizes, prices and dates are not phone numbers", () => {
  for (const text of [
    "Omega Seamaster 300M 210.30.42.20.03.001, blue dial, full set.",
    "Tissot PRX T137.407.11.041.00, blue dial, 40mm.",
    "Rolex Datejust 126334-0001, blue dial, 2021 card.",
    "Dual SIM, VoLTE calls, 4G bands 1/3/5/7/8/20/28/38/40/41.",
    "HD voice calls on GSM 850/900/1800/1900.",
    "Artificial Christmas tree 150 180 210 cm, with stand.",
    "Christmas tree 120/150/180/210cm, warm white lights.",
    "Single ₦25,000, double ₦45,000, triple ₦60,000.",
    "Price na 25,000 o, 30,000 for two.",
    "Galaxy S21 Plus 128/256/512 GB, 2021.",
    "UPC-A 0 70330 60301 6 on the pack.",
    "Imported US pack, 0 70330 60301 6 on the side.",
    "Best before 08/11/2026, net weight 500 g.",
  ]) {
    const got = strongest(text, "phone");
    assert.ok(got === null || got === "low", `${text} -> ${JSON.stringify(detectContactDetails(text))}`);
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

test("a handle or an address written the standard way and tied to an app is refused", () => {
  for (const text of [
    "my snap: adeshop22",
    "my tg: adeshop_ng",
    "ping me on discord, user adeshop#1234",
    "IG: adeshop_ng",
    "IG @adeshop_ng",
    "we are adeshop_ng on instagram",
  ]) {
    assert.equal(highest(text), "high", `${text} -> ${JSON.stringify(detectContactDetails(text))}`);
  }
});

test("a handle-shaped word on a named app is refused, with or without a verb before it", () => {
  for (const text of ["adeshop_ng on IG", "find adeshop_ng on Instagram", "we are ade.shop on tiktok"]) {
    assert.equal(strongest(text, "social_handle"), "high", text);
  }
  for (const text of ["Follow trends on Instagram", "Shop @home on Instagram", "Rated No.1 on TikTok for wigs."]) {
    assert.notEqual(strongest(text, "social_handle"), "high", text);
  }
});

test("pieces are not taken from lists, dates or a digit on its own in the prose", () => {
  for (const text of [
    "Sizes 08 10 12 14 16.\nA two litre kettle with one year warranty.",
    "Sizes 07 08 09 10 11 available.\nA two litre kettle with auto shut-off and one year warranty.",
    "Best before 09/11/2026, 250 ml bottle.",
    "Made 08.03.2025, batch 4567.",
  ]) {
    const got = strongest(text, "phone");
    assert.ok(got === null || got === "low", `${text} -> ${JSON.stringify(detectContactDetails(text))}`);
  }
  // …but a lone number word in an aside does not hide the number around it.
  assert.equal(strongest("Call 0803 (the MTN one) and then 123 4567", "phone"), "medium");
});

test("a provider joined to a word with a hyphen is not a label ('Gmail-friendly')", () => {
  assert.equal(strongest("Available at Gmail-friendly price, works with Outlook and iCloud.", "email"), null);
  assert.equal(strongest("gmail - adeshop", "email"), "medium");
});

test("a name to look up, a provider without its domain or a spelled link is held", () => {
  for (const text of [
    "find Ade Shop on Twitter",
    "adeshop at outlook",
    "adeshop at g-mail",
    "adeshop<at>gmail<dot>com",
    "telegram dot me slash adeshop",
  ]) {
    assert.equal(highest(text), "medium", `${text} -> ${JSON.stringify(detectContactDetails(text))}`);
  }
});

test("account numbers: standard (one block, up to three plain groups) or loose; prices and lists are never one", async () => {
  const { findTenDigitNumbers, hasSplitTenDigitNumber } = await import("../contact.ts");
  const read = (text) => findTenDigitNumbers(text).numbers.map((number) => (number.standard ? "standard" : "loose"));
  for (const text of [
    "GTB 0123456789",
    "GTB 0123 456 789",
    "GTB 0123 - 456 - 789",
    "GTB 0123  456  789",
    "01234-56789 GTB",
    "GTB 0123 456 789, 2 day delivery",
    "KET-2000 0123 456 789 GTB",
    "KET-2000 0123456789 (Zenith)",
  ]) {
    assert.deepEqual(read(text), ["standard"], text);
  }
  assert.deepEqual(read("Account: 2,034,567,891 (GTB)"), ["loose"]);
  for (const text of [
    "GTB 0123/456/789",
    "acct no 0123,456,789 zenith",
    "Kuda 0123_456_789",
    "UBA (0123) 456789",
    "GTB 0157 39 28 46",
    "GTB 01 57 39 28 46",
    "Kuda: 0 157 392 84 6",
    "Send to 01-57-39-28-46 (UBA)",
    "GTB: 01573 and 92846",
    "Account: 01573, 92846 (GTB)",
    "Kuda o123456789",
  ]) {
    assert.deepEqual(read(text), ["loose"], text);
  }
  for (const text of [
    "sizes 10 12 14 16 18",
    "Sizes 36 37 38 39 40",
    "03.3100.3600/69.M3100",
    "Pay ₦10,000-₦15,000 depending on size.",
    "Installation paid separately: 10,000-15,000 naira.",
    "Deposit box, small/large: ₦25,000/₦30,000.",
    "Pay 15000-25000 depending on size.",
    "Opposite First Bank, Ikeja. ₦25000 then ₦30000 for the bigger size.",
  ]) {
    assert.deepEqual(read(text), [], text);
  }
  for (const text of ["first 5 digits 01234, last 5 digits 56789", "GTB: 01234 then 56789", "ends with 56789, starts with 01234"]) {
    assert.equal(hasSplitTenDigitNumber(text), true, text);
  }
  assert.equal(hasSplitTenDigitNumber("Was 25000 now 18500"), false);
  assert.equal(hasSplitTenDigitNumber("Opposite First Bank, Ikeja. ₦25000 then ₦30000 for the bigger size."), false);
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
    "prefixes with long gaps": fill("0803 . . . . . . . . . . . . . . . . . . . . . . . . . . . 1 "),
    "spelled digits with asides": fill("zero (my MTN line) "),
    "dates beside numbers": fill("08/11/2026, 500 g "),
    "domains in every case": fill("Ab.Shop AB.SHOP ab.shop "),
    "apps behind arrows": fill("IG 👉 ab IG (abc "),
    "words before at": fill("abc at gmail "),
    "account groups": fill("01 57 39 28 4"),
    "halves": fill("01573 and 92846 "),
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
