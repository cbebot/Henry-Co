import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const staffDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const hubPull = join(staffDir, "../hub/.env.pull.hub");
const text = readFileSync(hubPull, "utf8");
const line = text.split("\n").find((l) => l.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY="));
if (!line) {
  console.error("missing ANON_KEY in hub pull");
  process.exit(1);
}
let v = line.slice("NEXT_PUBLIC_SUPABASE_ANON_KEY=".length).trim();
if (
  (v.startsWith('"') && v.endsWith('"')) ||
  (v.startsWith("'") && v.endsWith("'"))
) {
  v = v.slice(1, -1);
}
const r = spawnSync(
  "npx",
  ["vercel@latest", "env", "add", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "production", "--yes", "--force", "--scope", "henry-co"],
  {
    cwd: staffDir,
    input: v,
    encoding: "utf8",
    shell: true,
    stdio: ["pipe", "inherit", "inherit"],
  }
);
if (r.stdout) process.stdout.write(r.stdout);
if (r.stderr) process.stderr.write(r.stderr);
process.exit(r.status === 0 ? 0 : r.status ?? 1);
