/**
 * Uploads the three HenryCo brand SVGs to Cloudinary via the same path
 * the rest of the platform uses. Prints the public IDs and secure URLs
 * to stdout — the owner pastes these into packages/brand/src/registry.ts
 * under a `marks` constant.
 *
 * Usage:
 *   CLOUDINARY_CLOUD_NAME=... CLOUDINARY_API_KEY=... CLOUDINARY_API_SECRET=... \
 *   pnpm tsx scripts/upload-brand-assets.ts
 *
 * Idempotent: re-running with the same `public_id` overwrites the
 * existing asset (Cloudinary upload with overwrite=true).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import crypto from "node:crypto";

type Asset = {
  filename: string;
  publicId: string;
};

const ASSETS: Asset[] = [
  { filename: "wordmark-full.svg", publicId: "henryco-wordmark-full" },
  { filename: "wordmark-compact.svg", publicId: "henryco-wordmark-compact" },
  { filename: "monogram.svg", publicId: "henryco-monogram" },
];

function envOrDie(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing env var: ${name}`);
    process.exit(1);
  }
  return v;
}

function signUpload(params: Record<string, string>, secret: string): string {
  const signing = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return crypto
    .createHash("sha1")
    .update(signing + secret)
    .digest("hex");
}

async function uploadOne(asset: Asset) {
  const cloudName = envOrDie("CLOUDINARY_CLOUD_NAME");
  const apiKey = envOrDie("CLOUDINARY_API_KEY");
  const apiSecret = envOrDie("CLOUDINARY_API_SECRET");

  const path = resolve(
    process.cwd(),
    "packages/ui/src/brand/static",
    asset.filename,
  );
  const fileBuffer = readFileSync(path);

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "brand";
  const params = {
    folder,
    overwrite: "true",
    public_id: asset.publicId,
    timestamp,
  };
  const signature = signUpload(params, apiSecret);

  const form = new FormData();
  form.set("file", new Blob([new Uint8Array(fileBuffer)], { type: "image/svg+xml" }), asset.filename);
  form.set("api_key", apiKey);
  form.set("timestamp", timestamp);
  form.set("public_id", asset.publicId);
  form.set("folder", folder);
  form.set("overwrite", "true");
  form.set("signature", signature);

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Upload failed (${res.status}): ${body}`);
  }
  const json = (await res.json()) as { public_id: string; secure_url: string };
  return json;
}

async function main() {
  for (const asset of ASSETS) {
    try {
      const result = await uploadOne(asset);
      console.log(`✓ ${asset.filename}`);
      console.log(`    public_id : ${result.public_id}`);
      console.log(`    secure_url: ${result.secure_url}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`✗ ${asset.filename} — ${message}`);
      process.exitCode = 1;
    }
  }
}

main();
