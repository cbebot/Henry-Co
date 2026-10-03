// V3-MKT-TRUST-01 — the picture fingerprint after adversarial rounds 3 and 4.
//   F9:  side-lit photos of DIFFERENT products matched each other (light fall-off
//        made every backdrop cell "structure"), holding honest sellers.
//   F14: WebP and brightened copies missed their original.
//   F12 (round 4): different products shot in one photo box matched each other —
//        the box's seams and walls passed for structure.
// End-to-end through the real decoder (sharp), plus pure checks on the grid.

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  GRID_HEIGHT,
  GRID_WIDTH,
  fingerprintImageBytes,
  perceptualDistance,
  perceptualHashAvailable,
  perceptualHashOfGrid,
  type PerceptualHash,
} from "../image-fingerprint";

type SharpChain = {
  jpeg(options: { quality: number }): SharpChain;
  webp(): SharpChain;
  resize(width: number, height: number): SharpChain;
  flop(): SharpChain;
  blur(sigma: number): SharpChain;
  modulate(options: { brightness: number }): SharpChain;
  toBuffer(): Promise<Uint8Array>;
};
type Sharp = (input: Uint8Array, options?: { raw: { width: number; height: number; channels: 3 } }) => SharpChain;

async function loadSharp(): Promise<Sharp> {
  const mod = (await import("sharp")) as unknown as { default?: unknown };
  return (mod.default ?? mod) as Sharp;
}

const W = 320;
const H = 240;

function random(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** One product (a shaded box) on a backdrop lit from one side — the round-3 F9 shape. */
function sideLitProduct(seed: number): Uint8Array {
  const r = random(seed);
  const px = new Uint8Array(W * H * 3);
  const backdrop = 175 + r() * 70;
  const falloff = 40 + r() * 100;
  const fromLeft = r() < 0.5;
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const t = fromLeft ? x / W : 1 - x / W;
      const value = backdrop - falloff * t + (r() - 0.5) * 6;
      px.fill(Math.max(0, Math.min(255, Math.round(value))), (y * W + x) * 3, (y * W + x) * 3 + 3);
    }
  }
  const size = (0.1 + r() * 0.4) * W;
  const width = size * (0.5 + r() * 0.5);
  const height = size * (0.8 + r() * 0.8);
  const cx = (0.3 + r() * 0.4) * W;
  const cy = (0.4 + r() * 0.25) * H;
  const colour = [r() * 225 + 10, r() * 225 + 10, r() * 225 + 10];
  for (let y = Math.max(0, Math.floor(cy - height / 2)); y < Math.min(H, cy + height / 2); y += 1) {
    for (let x = Math.max(0, Math.floor(cx - width / 2)); x < Math.min(W, cx + width / 2); x += 1) {
      const shade = 1 - 0.3 * ((x - (cx - width / 2)) / width);
      for (let k = 0; k < 3; k += 1) px[(y * W + x) * 3 + k] = Math.round(colour[k] * shade);
    }
  }
  return px;
}

/** A shelf of differently sized and coloured boxes: a detailed picture whose rows all differ. */
function shelf(seed: number): Uint8Array {
  const r = random(seed);
  const px = new Uint8Array(W * H * 3).fill(236);
  let y = 10;
  while (y < H - 30) {
    const height = 30 + Math.floor(r() * 40);
    let x = 8;
    while (x < W - 30) {
      const width = 18 + Math.floor(r() * 50);
      const colour = [Math.floor(r() * 220), Math.floor(r() * 220), Math.floor(r() * 220)];
      for (let yy = y; yy < Math.min(H, y + height); yy += 1) {
        for (let xx = x; xx < Math.min(W, x + width); xx += 1) {
          for (let k = 0; k < 3; k += 1) px[(yy * W + xx) * 3 + k] = colour[k];
        }
      }
      x += width + 4 + Math.floor(r() * 12);
    }
    y += height + 8 + Math.floor(r() * 10);
  }
  return px;
}

/** Grey levels of a photo box's faces: the side walls run from side0 at the frame to side1 at the back. */
type BoxShade = { side0: number; side1: number; ceiling: number; back: number; floor: number };
const WHITE_BOX: BoxShade = { side0: 200, side1: 236, ceiling: 251, back: 230, floor: 244 };
const DARK_BOX: BoxShade = { side0: 18, side1: 45, ceiling: 30, back: 25, floor: 70 };
const BOX = 400;

/**
 * A product photographed in a photo box — reviewer C's round-4 lightbox: seams from
 * the frame's corners to the back wall, walls lit toward the back, a light strip,
 * one product standing on the floor. `jitter` moves the seams, the product and the
 * exposure per picture; without it every picture shares one box.
 */
function photoBox(
  seed: number,
  options: { shade: BoxShade; jitter: boolean; width: [number, number]; textured: boolean; noise: number },
): Uint8Array {
  const r = random(seed);
  const jitter = (value: number, amount: number) => (options.jitter ? value + (r() * 2 - 1) * amount : value);
  const x0 = jitter(100, 20);
  const y0 = jitter(75, 15);
  const x1 = jitter(300, 20);
  const y1 = jitter(260, 15);
  const { shade } = options;
  const px = new Uint8Array(BOX * BOX * 3);
  for (let y = 0; y < BOX; y += 1) {
    for (let x = 0; x < BOX; x += 1) {
      let value: number;
      if (x >= x0 && x < x1 && y >= y0 && y < y1) value = shade.back;
      else if (x < x0 && y * x0 >= x * y0 && (BOX - y) * x0 >= x * (BOX - y1)) value = shade.side0 + (shade.side1 - shade.side0) * (x / x0);
      else if (x >= x1 && y * (BOX - x1) >= (BOX - x) * y0 && (BOX - y) * (BOX - x1) >= (BOX - x) * (BOX - y1)) {
        value = shade.side0 + (shade.side1 - shade.side0) * ((BOX - x) / (BOX - x1));
      } else value = y < BOX / 2 ? shade.ceiling : shade.floor;
      if (y >= y0 - 7 && y < y0 - 3 && x >= x0 + 10 && x < x1 - 10) value = 255;
      const at = (y * BOX + x) * 3;
      px[at] = px[at + 1] = px[at + 2] = Math.round(value);
    }
  }
  // The product: a two-colour gradient with a soft band, and fine detail when textured.
  const width = Math.round(options.width[0] + r() * (options.width[1] - options.width[0]));
  const height = Math.round(width * (0.9 + r() * 0.4));
  const left = Math.round(BOX / 2 - width / 2 + (r() - 0.5) * 30);
  const top = Math.round(y1 - height * 0.8);
  const from = [r() * 255, r() * 255, r() * 255];
  const to = [r() * 255, r() * 255, r() * 255];
  const band = [r() * 255, r() * 255, r() * 255];
  const angle = r() * 2 * Math.PI;
  const bandAt = 0.2 + r() * 0.6;
  const bandWidth = 0.05 + r() * 0.15;
  const waves = Array.from({ length: 5 }, () => ({ fx: 2 + r() * 14, fy: 2 + r() * 14, phase: r() * 2 * Math.PI, amp: 20 + r() * 40 }));
  for (let y = Math.max(0, top); y < Math.min(BOX, top + height); y += 1) {
    for (let x = Math.max(0, left); x < Math.min(BOX, left + width); x += 1) {
      const u = (x - left) / width;
      const v = (y - top) / height;
      const t = Math.max(0, Math.min(1, 0.5 + (u - 0.5) * Math.cos(angle) + (v - 0.5) * Math.sin(angle)));
      const near = Math.exp(-((((u + 0.3 * v) - bandAt) / bandWidth) ** 2));
      let detail = 0;
      if (options.textured) {
        for (const wave of waves) detail += wave.amp * Math.sin(wave.phase + 2 * Math.PI * (wave.fx * u + wave.fy * v)) * Math.sin(2 * Math.PI * wave.fy * u - wave.phase);
      }
      for (let k = 0; k < 3; k += 1) {
        px[(y * BOX + x) * 3 + k] = Math.max(0, Math.min(255, Math.round((from[k] * (1 - t) + to[k] * t) * (1 - near) + band[k] * near + detail)));
      }
    }
  }
  // Exposure, and sensor grain (the same on all three channels).
  const exposure = options.jitter ? 0.9 + r() * 0.2 : 1;
  for (let at = 0; at < px.length; at += 3) {
    const grain = (r() + r() - 1) * options.noise;
    for (let k = 0; k < 3; k += 1) px[at + k] = Math.max(0, Math.min(255, Math.round(px[at + k] * exposure + grain)));
  }
  return px;
}

/** The perceptual hashes of `count` photo-box pictures (JPEG q85, through the real decoder). */
async function photoBoxHashes(sharp: Sharp, count: number, options: Parameters<typeof photoBox>[1]): Promise<Array<PerceptualHash | null>> {
  const hashes: Array<PerceptualHash | null> = [];
  for (let seed = 0; seed < count; seed += 1) {
    const bytes = await sharp(photoBox(900 + seed, options), { raw: { width: BOX, height: BOX, channels: 3 } }).jpeg({ quality: 85 }).toBuffer();
    hashes.push((await fingerprintImageBytes(bytes))?.phash ?? null);
  }
  return hashes;
}

function assertNoMatches(hashes: Array<PerceptualHash | null>, label: string): void {
  for (let a = 0; a < hashes.length; a += 1) {
    for (let b = a + 1; b < hashes.length; b += 1) {
      const ha = hashes[a];
      const hb = hashes[b];
      if (ha && hb) assert.ok(perceptualDistance(ha, hb) > 4, `${label}: pictures ${a} and ${b} match`);
    }
  }
}

/** A GRID_WIDTH x GRID_HEIGHT greyscale picture from a function of (x, y) in 0..1. */
function picture(fill: (x: number, y: number) => number): Uint8Array {
  const px = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);
  for (let y = 0; y < GRID_HEIGHT; y += 1) {
    for (let x = 0; x < GRID_WIDTH; x += 1) {
      px[y * GRID_WIDTH + x] = Math.max(0, Math.min(255, Math.round(fill(x / (GRID_WIDTH - 1), y / (GRID_HEIGHT - 1)))));
    }
  }
  return px;
}

describe("round 3 — the light is not structure (F9)", () => {
  it("side light alone never makes two different products match", async () => {
    const sharp = await loadSharp();
    assert.equal(await perceptualHashAvailable(), true);
    const hashes: Array<PerceptualHash | null> = [];
    for (let seed = 0; seed < 48; seed += 1) {
      const bytes = await sharp(sideLitProduct(1000 + seed), { raw: { width: W, height: H, channels: 3 } })
        .jpeg({ quality: 85 })
        .toBuffer();
      hashes.push((await fingerprintImageBytes(bytes))?.phash ?? null);
    }
    for (let a = 0; a < hashes.length; a += 1) {
      for (let b = a + 1; b < hashes.length; b += 1) {
        const ha = hashes[a];
        const hb = hashes[b];
        if (ha && hb) assert.ok(perceptualDistance(ha, hb) > 4, `pictures ${a} and ${b} match`);
      }
    }
  });

  it("an empty backdrop under side light, a lamp or vignetting has no perceptual hash", () => {
    assert.equal(perceptualHashOfGrid(picture((x) => 240 - 120 * x)), null, "linear fall-off");
    assert.equal(perceptualHashOfGrid(picture((x) => 60 + 180 * x)), null, "light from the right");
    assert.equal(perceptualHashOfGrid(picture((x) => 245 - 140 * x * x)), null, "curved fall-off");
    assert.equal(perceptualHashOfGrid(picture((x, y) => 250 / (1 + 3 * ((x + 0.3) ** 2 + (y - 0.5) ** 2)))), null, "lamp");
    assert.equal(perceptualHashOfGrid(picture((x, y) => 230 * (1 - 0.5 * ((x - 0.5) ** 2 + (y - 0.5) ** 2)))), null, "vignetting");
  });

  it("a picture whose rows repeat has no perceptual hash: stripes, a plain box", () => {
    assert.equal(perceptualHashOfGrid(picture((x) => 128 + 100 * Math.sin(x * 9 * Math.PI))), null, "vertical stripes");
    assert.equal(
      perceptualHashOfGrid(picture((x, y) => (x > 0.3 && x < 0.62 && y > 0.2 && y < 0.85 ? 60 + 60 * x : 235))),
      null,
      "a plain shaded box on a backdrop",
    );
  });
});

describe("round 3 — copies of a detailed picture still match (F14)", () => {
  it("JPEG q30, WebP, half size, mirror, blur and a brighter or darker copy stay within the match distance", async () => {
    const sharp = await loadSharp();
    for (const seed of [5, 12]) {
      const original = await sharp(shelf(seed), { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 85 }).toBuffer();
      const base = (await fingerprintImageBytes(original))?.phash;
      assert.ok(base, `shelf ${seed} has a perceptual hash`);
      const copies: Array<[string, Promise<Uint8Array>]> = [
        ["jpeg q30", sharp(original).jpeg({ quality: 30 }).toBuffer()],
        ["webp", sharp(original).webp().toBuffer()],
        ["half size", sharp(original).resize(W / 2, H / 2).jpeg({ quality: 85 }).toBuffer()],
        ["mirror", sharp(original).flop().jpeg({ quality: 85 }).toBuffer()],
        ["blur", sharp(original).blur(1).jpeg({ quality: 85 }).toBuffer()],
        ["brighter", sharp(original).modulate({ brightness: 1.2 }).jpeg({ quality: 85 }).toBuffer()],
        ["darker", sharp(original).modulate({ brightness: 0.8 }).jpeg({ quality: 85 }).toBuffer()],
      ];
      for (const [label, pending] of copies) {
        const copy = (await fingerprintImageBytes(await pending))?.phash;
        assert.ok(copy, `shelf ${seed} ${label}: the copy has a perceptual hash`);
        assert.ok(perceptualDistance(base!, copy!) <= 4, `shelf ${seed} ${label}: distance ${perceptualDistance(base!, copy!)}`);
      }
    }
  });

  it("different detailed pictures stay far apart", async () => {
    const sharp = await loadSharp();
    const hashes: PerceptualHash[] = [];
    for (let seed = 1; seed <= 12; seed += 1) {
      const bytes = await sharp(shelf(seed), { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 85 }).toBuffer();
      const hash = (await fingerprintImageBytes(bytes))?.phash;
      if (hash) hashes.push(hash);
    }
    assert.ok(hashes.length >= 10, `${hashes.length} of 12 shelves hashed`);
    for (let a = 0; a < hashes.length; a += 1) {
      for (let b = a + 1; b < hashes.length; b += 1) assert.ok(perceptualDistance(hashes[a], hashes[b]) > 4, `shelves ${a} and ${b} match`);
    }
  });

  it("the same bytes always give the same fingerprint", async () => {
    const sharp = await loadSharp();
    const bytes = await sharp(shelf(5), { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 85 }).toBuffer();
    assert.deepEqual(await fingerprintImageBytes(bytes), await fingerprintImageBytes(bytes));
  });
});

describe("round 4 — a setting is not information (F12)", () => {
  const product: [number, number] = [105, 155];

  it("different products in one photo box never match, whether the box is shared or moved", async () => {
    const sharp = await loadSharp();
    for (const jitter of [false, true]) {
      const hashes = await photoBoxHashes(sharp, 24, { shade: WHITE_BOX, jitter, width: product, textured: false, noise: 1 });
      assertNoMatches(hashes, jitter ? "moved box" : "shared box");
    }
  });

  it("a dark box, or sensor noise in it, does not pass for detail", async () => {
    const sharp = await loadSharp();
    assertNoMatches(await photoBoxHashes(sharp, 24, { shade: DARK_BOX, jitter: false, width: product, textured: true, noise: 1 }), "dark box");
    assertNoMatches(await photoBoxHashes(sharp, 24, { shade: DARK_BOX, jitter: false, width: product, textured: false, noise: 14 }), "noisy dark box");
  });

  it("a detailed product that fills most of the box keeps its hash, and its copies still match", async () => {
    const sharp = await loadSharp();
    const options = { shade: WHITE_BOX, jitter: false, width: [300, 340] as [number, number], textured: true, noise: 1 };
    let hashed = 0;
    for (let seed = 0; seed < 12; seed += 1) {
      const original = await sharp(photoBox(900 + seed, options), { raw: { width: BOX, height: BOX, channels: 3 } }).jpeg({ quality: 85 }).toBuffer();
      const base = (await fingerprintImageBytes(original))?.phash;
      if (!base) continue;
      hashed += 1;
      const copies: Array<[string, Promise<Uint8Array>]> = [
        ["jpeg q60", sharp(original).jpeg({ quality: 60 }).toBuffer()],
        ["webp", sharp(original).webp().toBuffer()],
        ["mirror", sharp(original).flop().jpeg({ quality: 85 }).toBuffer()],
      ];
      for (const [label, pending] of copies) {
        const copy = (await fingerprintImageBytes(await pending))?.phash;
        assert.ok(copy, `product ${seed} ${label}: the copy has a perceptual hash`);
        assert.ok(perceptualDistance(base, copy!) <= 4, `product ${seed} ${label}: distance ${perceptualDistance(base, copy!)}`);
      }
    }
    assert.ok(hashed >= 8, `${hashed} of 12 large detailed products hashed`);
    assertNoMatches(await photoBoxHashes(sharp, 12, options), "large products in one box");
  });
});

describe("the grid input", () => {
  it("a 9x8 grid is read as a picture of 8x8-pixel cells", () => {
    const cells = new Uint8Array(72);
    for (let i = 0; i < 72; i += 1) cells[i] = (i * 37 + ((i * 11) % 7) * 29) % 256;
    const expanded = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);
    for (let y = 0; y < GRID_HEIGHT; y += 1) {
      for (let x = 0; x < GRID_WIDTH; x += 1) expanded[y * GRID_WIDTH + x] = cells[Math.floor(y / 8) * 9 + Math.floor(x / 8)];
    }
    const fromCells = perceptualHashOfGrid(cells);
    assert.ok(fromCells);
    assert.deepEqual(fromCells, perceptualHashOfGrid(expanded));
  });

  it("anything else that is not a full picture has no perceptual hash", () => {
    assert.equal(perceptualHashOfGrid(new Uint8Array(71)), null);
    assert.equal(perceptualHashOfGrid(new Uint8Array(GRID_WIDTH * GRID_HEIGHT - 1)), null);
  });
});
