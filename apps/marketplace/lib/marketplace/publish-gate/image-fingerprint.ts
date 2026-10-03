// V3-MKT-TRUST-01 — image fingerprints: who had this picture first.
//
// Two fingerprints per first-party image:
//
//   sha256 — of the bytes. Catches a re-upload of the identical file, which the
//            old "same URL" check could not (every upload gets a new object key).
//
//   phash  — a perceptual hash of the decoded picture, stored as two 64-bit
//            masks: each of the 64 left-right neighbouring pairs of a 9x8 grid is
//            brighter-left, brighter-right or FLAT. It survives re-encodes (JPEG,
//            WebP), resizes, stretches, mirror images, blur and moderate
//            brightness or contrast changes — the cheap ways to make the same
//            photo a "different file". The stored format and the database's
//            comparison (at most 4 differing mask bits, both pictures with at
//            least 16 non-flat cells) are unchanged since round 2.
//
// How the 9x8 grid is computed:
//   1. Decode (EXIF orientation honoured, transparency flattened on white),
//      greyscale, resize to GRID_WIDTH x GRID_HEIGHT. Each grid cell is the exact
//      mean of an 8x8 block. Resizing straight to 9x8 let each format's decoder
//      shortcuts move the cells: a WebP copy missed its original most of the time.
//   2. Log tone. Light multiplies brightness; in log tone a brighter, darker or
//      unevenly lit copy differs from the original by an added term.
//   3. Light removal. A smooth cubic surface is fitted, robustly, to the outer
//      ring of the frame — the backdrop of a product photo — and subtracted from
//      the whole picture. Window light from one side, a lamp, a studio spot or
//      lens vignetting no longer turns every backdrop cell into "structure"
//      (adversarial round 3: side-lit photos of DIFFERENT products matched).
//      When the ring is not a smooth backdrop — a full-frame photo, a designed
//      graphic — the correction fades out, so the fit never invents a slope.
//
// TUNED FOR PRECISION. A match holds an honest seller's listing for a person, so
// a false match is the expensive error. A picture gets NO perceptual hash — only
// the byte hash, which still catches an identical re-upload — unless it carries
// enough information to be told apart from other pictures:
//   * at least MIN_STRONG_CELLS of its 64 cells are structure (not flat); and
//   * at least MIN_NEW_CELLS structured cells are NEW — their class differs from
//     the cell directly above — at least MIN_NEW_CELLS_BELOW_TOP of them below
//     the top row. Rows that repeat carry little: stripes, a smooth gradient, or
//     a plain box, bottle or shoe against a backdrop, whose rows are the same
//     outline row after row. Two different products with the same outline give
//     the same rows, so such pictures are not hashed at this resolution.
// Measured on about 6,000 different pictures in three independently drawn sets
// (adversarial reviewer C's side-lit and other families, the round-2 scenes,
// harder lighting, crops of real photographs, check patterns, flyers): no false
// matches apart from same-template flyers (below), and no two different hashed
// pictures closer than 8 differing cells.
//
// Known limits, stated plainly:
//   * most single-product photos on a plain or lit backdrop, stripes, gradients,
//     near-flat, low-contrast and dark-on-black pictures get no perceptual hash;
//   * pictures made from one template (a flyer layout with different text) can
//     match each other — the text is finer than the grid;
//   * a crop, a rotation, an added border or frame, an upside-down copy, an
//     overlay, a redrawn picture, or a brightness or contrast change that clips
//     large areas to white or black, is not caught reliably.
// A duplicate image is one signal, never the only line of defence.
//
// The decoder (`sharp`) is loaded lazily. If it cannot be loaded the byte hash
// still works and `phash` is null — detection degrades, the gate does not fail.

import { createHash } from "node:crypto";

export interface PerceptualHash {
  /** Brighter-left mask, as a signed 64-bit decimal string (Postgres bigint). */
  pos: string;
  /** Brighter-right mask, same encoding. */
  neg: string;
}

export interface ImageFingerprint {
  sha256: string;
  /** Null when the picture could not be decoded or has too little structure to compare. */
  phash: PerceptualHash | null;
  bytes: number;
}

const MAX_BYTES = 12 * 1024 * 1024;

/** The picture is decoded to this greyscale size; each of the 9x8 grid cells is an 8x8 block of it. */
export const GRID_WIDTH = 72;
export const GRID_HEIGHT = 64;
const CELL = 8;
const COLS = GRID_WIDTH / CELL; // 9
const ROWS = GRID_HEIGHT / CELL; // 8
/** The light is fitted on 4x4-pixel blocks, over the outer RING blocks of the frame. */
const BLOCK = 4;
const BLOCK_COLS = GRID_WIDTH / BLOCK; // 18
const BLOCK_ROWS = GRID_HEIGHT / BLOCK; // 16
const RING = 2;

/** Grey levels (at mid-grey) two neighbouring cells must differ by, at least, to count as structure. */
const FLAT_DELTA = 4;
/** ...or this share of the corrected picture's own contrast range, whichever is larger. */
const FLAT_SHARE = 0.03;
/** Structured cells (of 64) a picture needs before its perceptual hash is trusted. */
export const MIN_STRONG_CELLS = 20;
/** Structured cells whose class differs from the cell directly above (the top row is compared with a flat row). */
export const MIN_NEW_CELLS = 10;
/** ...of which at least this many below the top row. */
export const MIN_NEW_CELLS_BELOW_TOP = 8;

/** Log tone, scaled so one unit is about one grey level at mid-grey. */
const TONE_OFFSET = 16;
const TONE = new Float64Array(256);
for (let value = 0; value < 256; value += 1) TONE[value] = (128 + TONE_OFFSET) * Math.log(value + TONE_OFFSET);

/** Robust fit of the light: Tukey weights, this many rounds. */
const TUKEY = 4.685;
const FIT_ROUNDS = 10;
/**
 * Spread of the ring around the fitted light (tone units, robust). At or below
 * LIGHT_FULL the ring is a smooth backdrop and the light is removed in full; at or
 * above LIGHT_NONE it is content, and the picture is left as it is.
 */
const LIGHT_FULL = 3;
const LIGHT_NONE = 10;

// The app targets below ES2020, where bigint literals are not available.
const ZERO = BigInt(0);
const ONE = BigInt(1);

type SharpInstance = {
  rotate(): SharpInstance;
  flatten(options: { background: string }): SharpInstance;
  greyscale(): SharpInstance;
  resize(width: number, height: number, options: { fit: "fill" }): SharpInstance;
  raw(): SharpInstance;
  toBuffer(): Promise<Uint8Array>;
};
type SharpFactory = (input: Uint8Array, options?: { failOn?: string; limitInputPixels?: number }) => SharpInstance;

let sharpPromise: Promise<SharpFactory | null> | null = null;

function loadSharp(): Promise<SharpFactory | null> {
  if (!sharpPromise) {
    // `sharp` is a workspace-root dependency and one of Next's default server
    // externals, so this import is traced into the function bundle. It stays a
    // dynamic import so a runtime without the native binary degrades instead of
    // failing the request.
    sharpPromise = import("sharp")
      .then((mod: unknown) => {
        const candidate = (mod as { default?: unknown }).default ?? mod;
        return typeof candidate === "function" ? (candidate as SharpFactory) : null;
      })
      .catch(() => null);
  }
  return sharpPromise;
}

interface Masks {
  pos: bigint;
  neg: bigint;
  strong: number;
}

// The light model: a cubic surface over the frame, in coordinates -1..1.
const LIGHT_TERMS = 10;
function lightTerms(x: number, y: number): number[] {
  return [1, x, y, x * x, x * y, y * y, x * x * x, x * x * y, x * y * y, y * y * y];
}
/** Each block's terms on the light surface, and the ring blocks the light is fitted on. */
const BLOCK_TERMS: number[][] = [];
const RING_BLOCKS: number[] = [];
for (let by = 0; by < BLOCK_ROWS; by += 1) {
  for (let bx = 0; bx < BLOCK_COLS; bx += 1) {
    const x = (bx - (BLOCK_COLS - 1) / 2) / ((BLOCK_COLS - 1) / 2);
    const y = (by - (BLOCK_ROWS - 1) / 2) / ((BLOCK_ROWS - 1) / 2);
    BLOCK_TERMS.push(lightTerms(x, y));
    if (bx < RING || bx >= BLOCK_COLS - RING || by < RING || by >= BLOCK_ROWS - RING) {
      RING_BLOCKS.push(by * BLOCK_COLS + bx);
    }
  }
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = sorted.length >> 1;
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** Solves matrix · x = rhs (Gauss-Jordan with partial pivoting); null when singular. */
function solve(matrix: number[][], rhs: number[]): number[] | null {
  const size = rhs.length;
  const work = matrix.map((row, index) => [...row, rhs[index]]);
  for (let col = 0; col < size; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < size; row += 1) {
      if (Math.abs(work[row][col]) > Math.abs(work[pivot][col])) pivot = row;
    }
    if (Math.abs(work[pivot][col]) < 1e-12) return null;
    [work[col], work[pivot]] = [work[pivot], work[col]];
    for (let row = 0; row < size; row += 1) {
      if (row === col) continue;
      const factor = work[row][col] / work[col][col];
      for (let k = col; k <= size; k += 1) work[row][k] -= factor * work[col][k];
    }
  }
  return work.map((row, index) => row[size] / row[index]);
}

/** Least squares with Tukey weights, so a product reaching into the ring does not bend the fit. */
function robustFit(rows: number[][], values: number[]): { beta: number[]; residuals: number[] } {
  const terms = rows[0].length;
  const weights = values.map(() => 1);
  let beta: number[] = new Array<number>(terms).fill(0);
  const residualsOf = () =>
    values.map((value, index) => {
      let fitted = 0;
      for (let term = 0; term < terms; term += 1) fitted += rows[index][term] * beta[term];
      return value - fitted;
    });
  for (let round = 0; round < FIT_ROUNDS; round += 1) {
    const matrix = Array.from({ length: terms }, () => new Array<number>(terms).fill(0));
    const rhs = new Array<number>(terms).fill(0);
    for (let index = 0; index < values.length; index += 1) {
      const weight = weights[index];
      if (weight === 0) continue;
      for (let a = 0; a < terms; a += 1) {
        rhs[a] += weight * rows[index][a] * values[index];
        for (let b = 0; b < terms; b += 1) matrix[a][b] += weight * rows[index][a] * rows[index][b];
      }
    }
    const solution = solve(matrix, rhs);
    if (!solution) break;
    beta = solution;
    const residuals = residualsOf();
    const scale = Math.max(median(residuals.map(Math.abs)) * 1.4826, 0.5);
    for (let index = 0; index < values.length; index += 1) {
      const u = residuals[index] / (TUKEY * scale);
      weights[index] = Math.abs(u) < 1 ? (1 - u * u) ** 2 : 0;
    }
  }
  return { beta, residuals: residualsOf() };
}

/** Mean log tone of each 4x4 block, with the frame's smooth light removed when the ring is a backdrop. */
function lightCorrectedBlocks(picture: Uint8Array): Float64Array {
  const blocks = new Float64Array(BLOCK_COLS * BLOCK_ROWS);
  for (let by = 0; by < BLOCK_ROWS; by += 1) {
    for (let bx = 0; bx < BLOCK_COLS; bx += 1) {
      let sum = 0;
      for (let y = by * BLOCK; y < by * BLOCK + BLOCK; y += 1) {
        for (let x = bx * BLOCK; x < bx * BLOCK + BLOCK; x += 1) sum += TONE[picture[y * GRID_WIDTH + x]];
      }
      blocks[by * BLOCK_COLS + bx] = sum / (BLOCK * BLOCK);
    }
  }
  const { beta, residuals } = robustFit(
    RING_BLOCKS.map((block) => BLOCK_TERMS[block]),
    RING_BLOCKS.map((block) => blocks[block]),
  );
  const spread = median(residuals.map(Math.abs)) * 1.4826;
  const share = Math.max(0, Math.min(1, (LIGHT_NONE - spread) / (LIGHT_NONE - LIGHT_FULL)));
  if (share > 0) {
    for (let block = 0; block < blocks.length; block += 1) {
      // The constant term is left out: it never changes a difference.
      let light = 0;
      for (let term = 1; term < LIGHT_TERMS; term += 1) light += beta[term] * BLOCK_TERMS[block][term];
      blocks[block] -= share * light;
    }
  }
  return blocks;
}

/** Left-minus-right differences of the 9x8 grid (each cell the mean of 2x2 blocks), and the flat threshold. */
function pairDifferences(blocks: Float64Array): { diff: Float64Array; flat: number } {
  const cells = new Float64Array(COLS * ROWS);
  let low = Infinity;
  let high = -Infinity;
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const top = 2 * row * BLOCK_COLS + 2 * col;
      const bottom = top + BLOCK_COLS;
      const value = (blocks[top] + blocks[top + 1] + blocks[bottom] + blocks[bottom + 1]) / 4;
      cells[row * COLS + col] = value;
      if (value < low) low = value;
      if (value > high) high = value;
    }
  }
  const diff = new Float64Array(ROWS * (COLS - 1));
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS - 1; col += 1) diff[row * 8 + col] = cells[row * COLS + col] - cells[row * COLS + col + 1];
  }
  // "Flat" also scales with the picture's own contrast, so a punchier copy classes like the original.
  return { diff, flat: Math.max(FLAT_DELTA, (high - low) * FLAT_SHARE) };
}

/** The two masks. `mirrored` reads the grid right-to-left, as the mirror image of the picture would. */
function masksOf(diff: Float64Array, flat: number, mirrored: boolean): Masks {
  let pos = ZERO;
  let neg = ZERO;
  let strong = 0;
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      // In the mirror image, pair `col` is the original pair 7-col, read the other way round.
      const d = mirrored ? -diff[row * 8 + (7 - col)] : diff[row * 8 + col];
      pos <<= ONE;
      neg <<= ONE;
      if (d >= flat) {
        pos |= ONE;
        strong += 1;
      } else if (-d >= flat) {
        neg |= ONE;
        strong += 1;
      }
    }
  }
  return { pos, neg, strong };
}

/** Structured cells whose class differs from the cell directly above (above the top row: flat). */
function newCells(diff: Float64Array, flat: number): { all: number; belowTop: number } {
  const classOf = (index: number) => (diff[index] >= flat ? 1 : diff[index] <= -flat ? -1 : 0);
  let all = 0;
  let belowTop = 0;
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const current = classOf(row * 8 + col);
      if (current === 0 || current === (row > 0 ? classOf((row - 1) * 8 + col) : 0)) continue;
      all += 1;
      if (row > 0) belowTop += 1;
    }
  }
  return { all, belowTop };
}

/** A 9x8 grid read as a GRID_WIDTH x GRID_HEIGHT picture of 8x8-pixel cells. */
function cellPicture(grid: Uint8Array): Uint8Array {
  const picture = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);
  for (let y = 0; y < GRID_HEIGHT; y += 1) {
    for (let x = 0; x < GRID_WIDTH; x += 1) picture[y * GRID_WIDTH + x] = grid[Math.floor(y / CELL) * COLS + Math.floor(x / CELL)];
  }
  return picture;
}

/**
 * The perceptual hash of a greyscale picture already reduced to GRID_WIDTH x
 * GRID_HEIGHT (row-major, one byte per pixel), canonical under a horizontal flip.
 * A 9x8 grid (72 values) is accepted too, read as a picture of 8x8-pixel cells.
 * Null when the picture carries too little information to be told apart.
 */
export function perceptualHashOfGrid(pixels: Uint8Array): PerceptualHash | null {
  const picture = pixels.length === COLS * ROWS ? cellPicture(pixels) : pixels;
  if (picture.length < GRID_WIDTH * GRID_HEIGHT) return null;
  const { diff, flat } = pairDifferences(lightCorrectedBlocks(picture));
  const plain = masksOf(diff, flat, false);
  if (plain.strong < MIN_STRONG_CELLS) return null;
  const fresh = newCells(diff, flat);
  if (fresh.all < MIN_NEW_CELLS || fresh.belowTop < MIN_NEW_CELLS_BELOW_TOP) return null;
  const mirror = masksOf(diff, flat, true);
  // The smaller pair is the same for a picture and its mirror image.
  const pick = plain.pos < mirror.pos || (plain.pos === mirror.pos && plain.neg <= mirror.neg) ? plain : mirror;
  return { pos: BigInt.asIntN(64, pick.pos).toString(), neg: BigInt.asIntN(64, pick.neg).toString() };
}

function popcount(value: bigint): number {
  let rest = BigInt.asUintN(64, value);
  let count = 0;
  while (rest > ZERO) {
    count += Number(rest & ONE);
    rest >>= ONE;
  }
  return count;
}

/** Cells that differ between two perceptual hashes (0-128). Mirrors the SQL distance. */
export function perceptualDistance(a: PerceptualHash, b: PerceptualHash): number {
  return popcount(BigInt(a.pos) ^ BigInt(b.pos)) + popcount(BigInt(a.neg) ^ BigInt(b.neg));
}

async function perceptualHash(bytes: Uint8Array): Promise<PerceptualHash | null> {
  const sharp = await loadSharp();
  if (!sharp) return null;
  try {
    const raw = await sharp(bytes, { failOn: "none", limitInputPixels: 64_000_000 })
      .rotate() // honour the EXIF orientation, so a re-saved phone photo matches
      .flatten({ background: "#ffffff" })
      .greyscale()
      .resize(GRID_WIDTH, GRID_HEIGHT, { fit: "fill" })
      .raw()
      .toBuffer();
    return perceptualHashOfGrid(onePerPixel(raw));
  } catch {
    return null;
  }
}

/** One grey byte per pixel, should the decoder keep more than one channel. */
function onePerPixel(raw: Uint8Array): Uint8Array {
  const pixels = GRID_WIDTH * GRID_HEIGHT;
  const channels = Math.floor(raw.length / pixels);
  if (channels <= 1) return raw;
  const grey = new Uint8Array(pixels);
  for (let index = 0; index < pixels; index += 1) grey[index] = raw[index * channels];
  return grey;
}

/** Fingerprint image bytes. Never throws; an oversized or empty input returns null. */
export async function fingerprintImageBytes(bytes: Uint8Array): Promise<ImageFingerprint | null> {
  if (!bytes || bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) return null;
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const phash = await perceptualHash(bytes);
  return { sha256, phash, bytes: bytes.byteLength };
}

/** True when the perceptual decoder is available in this runtime (for the readiness check). */
export async function perceptualHashAvailable(): Promise<boolean> {
  return (await loadSharp()) !== null;
}
