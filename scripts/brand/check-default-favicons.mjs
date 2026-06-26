// OG-SOCIAL-METADATA — guard: no app may ship the create-next-app default
// favicon (the Next.js / Vercel logo). Two apps (care, hub) had shipped it
// unchanged, so Google search results and link previews rendered the Vercel
// logo instead of the Henry Onyx mark. This check fails CI if any app
// reintroduces that default favicon — so a future `create-next-app`-scaffolded
// app can never quietly bring "the Vercel image" back.
//
// The Henry Onyx favicon is the adaptive `app/icon.svg` monogram (served as an
// SVG favicon, which Google and modern browsers honour). Apps should NOT ship a
// `favicon.ico` at all unless it is an intentional, brand-rendered icon — and
// it must never be the create-next-app default.
//
// Run: node scripts/brand/check-default-favicons.mjs   (wired into ci:validate)

import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const appsDir = path.join(repoRoot, "apps");

// md5 of the unmodified create-next-app `app/favicon.ico` (the Next.js/Vercel
// logo, 25931 bytes). If a favicon ever hashes to this, it is the default.
const DEFAULT_NEXT_FAVICON_MD5 = "c30c7d42707a47a3f4591831641e50dc";

async function findFavicons(dir) {
  const out = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await findFavicons(full)));
    } else if (entry.name.toLowerCase() === "favicon.ico") {
      out.push(full);
    }
  }
  return out;
}

async function main() {
  const favicons = await findFavicons(appsDir);
  const offenders = [];
  for (const file of favicons) {
    const buf = await fs.readFile(file);
    const md5 = createHash("md5").update(buf).digest("hex");
    if (md5 === DEFAULT_NEXT_FAVICON_MD5) {
      offenders.push(path.relative(repoRoot, file).replace(/\\/g, "/"));
    }
  }

  if (offenders.length > 0) {
    console.error(
      "✖ Default create-next-app (Vercel/Next) favicon.ico detected — this renders the Vercel logo in Google search + link previews:",
    );
    for (const f of offenders) console.error(`   - ${f}`);
    console.error(
      "\nDelete it (apps fall back to the Henry Onyx app/icon.svg) or replace it with a brand-rendered favicon.",
    );
    process.exit(1);
  }

  console.log(
    `✓ No default Vercel/Next favicon.ico in ${favicons.length === 0 ? "any app" : `${favicons.length} favicon file(s)`}.`,
  );
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
