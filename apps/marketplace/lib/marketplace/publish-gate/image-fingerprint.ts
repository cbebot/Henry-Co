// V3-MKT-TRUST-01 — image fingerprints: who had this picture first.
//
// Two fingerprints per first-party image:
//
//   sha256 — of the bytes. Catches a re-upload of the identical file, which the
//            old "same URL" check could not (every upload gets a new object key).
//
//   phash  — a perceptual hash of the decoded picture: the picture is reduced to
//            a 9x8 greyscale grid and each of the 64 neighbouring pairs is
//            classed as brighter-left, brighter-right or FLAT. That gives two
//            64-bit masks. It survives a re-encode, a resize, a recompress and a
//            mirror — the cheap ways to make the same photo a "different file".
//
// TUNED FOR PRECISION. A match holds an honest seller's listing for a person, so
// a false match is the expensive error:
//   * "flat" is a class of its own. A plain two-way hash turns the noise in a
//     white background into random bits, and unrelated catalogue photos then
//     look alike (measured: 6.7% of different-picture pairs within 6 bits).
//   * a picture with fewer than MIN_STRONG_CELLS structured cells gets NO
//     perceptual hash. There is too little in it to tell two pictures apart;
//     only the byte hash is used.
// Measured on 3,540 different-picture pairs (photo-like and object-on-white):
// zero false matches at the distance the database uses.
//
// It does not catch a crop, a rotation, an overlay or a redrawn picture. That is
// a known limit of a deterministic hash, not something this module pretends to
// solve: a duplicate image is one signal, never the only line of defence.
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
/** Grey levels (0-255) two neighbouring cells must differ by to count as structure. */
const FLAT_DELTA = 4;
/** Structured cells (of 64) a picture needs before its perceptual hash is trusted. */
export const MIN_STRONG_CELLS = 20;
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

/** 9x8 greyscale → the two masks. `mirrored` reads the grid right-to-left. */
function gradientMasks(pixels: Uint8Array, mirrored: boolean): Masks {
  let pos = ZERO;
  let neg = ZERO;
  let strong = 0;
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      // In the mirror image, cell `col` is the original pair (8-col, 7-col).
      const left = mirrored ? pixels[row * 9 + (8 - col)] : pixels[row * 9 + col];
      const right = mirrored ? pixels[row * 9 + (7 - col)] : pixels[row * 9 + col + 1];
      const diff = left - right;
      pos <<= ONE;
      neg <<= ONE;
      if (diff >= FLAT_DELTA) {
        pos |= ONE;
        strong += 1;
      } else if (-diff >= FLAT_DELTA) {
        neg |= ONE;
        strong += 1;
      }
    }
  }
  return { pos, neg, strong };
}

/** The masks of a 9x8 greyscale grid, canonical under a horizontal flip; null when too flat. */
export function perceptualHashOfGrid(pixels: Uint8Array): PerceptualHash | null {
  if (pixels.length < 72) return null;
  const plain = gradientMasks(pixels, false);
  if (plain.strong < MIN_STRONG_CELLS) return null;
  const mirror = gradientMasks(pixels, true);
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
    const grid = await sharp(bytes, { failOn: "none", limitInputPixels: 64_000_000 })
      .rotate() // honour the EXIF orientation, so a re-saved phone photo matches
      .flatten({ background: "#ffffff" })
      .greyscale()
      .resize(9, 8, { fit: "fill" })
      .raw()
      .toBuffer();
    return perceptualHashOfGrid(grid);
  } catch {
    return null;
  }
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
