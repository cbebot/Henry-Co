// V3-MKT-TRUST-01 — the picture fingerprint after adversarial round 3.
//   F9:  side-lit photos of DIFFERENT products matched each other (light fall-off
//        made every backdrop cell "structure"), holding honest sellers.
//   F14: WebP and brightened copies missed their original.
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
