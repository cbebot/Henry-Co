import fs from "node:fs";
import path from "node:path";
import { seedLearnBaseline } from "../lib/learn/seed";

const appDir = process.cwd();
const rootDir = path.resolve(appDir, "..", "..");

function loadEnvFile(filepath: string) {
  if (!fs.existsSync(filepath)) return;
  const content = fs.readFileSync(filepath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    const raw = line.slice(index + 1).trim();
    if (!key || process.env[key]) continue;
    process.env[key] = raw.replace(/^['"]|['"]$/g, "");
  }
}

loadEnvFile(path.join(rootDir, ".env.local"));
loadEnvFile(path.join(rootDir, ".env.production.local"));
loadEnvFile(path.join(rootDir, ".vercel", ".env.production.local"));

async function run() {
  const result = await seedLearnBaseline({ role: "academy_system" });
  console.log(
    `[learn:seed] Seeded ${result.categoryCount} categories, ${result.courseCount} courses, ${result.pathCount} paths, and ${result.assignmentCount} assignments.`
  );
}

run().catch((error) => {
  console.error("[learn:seed] Seed failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
