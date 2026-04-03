import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { demoPropertySnapshot } from "../lib/property/demo.ts";

const appDir = process.cwd();
const rootDir = path.resolve(appDir, "..", "..");

function loadEnvFile(filepath) {
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
loadEnvFile(path.join(rootDir, ".env.production.vercel"));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.log("[property:seed] Skipping because Supabase admin credentials are not available.");
  process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function ensureBucket(name, options) {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = (buckets || []).some((bucket) => bucket.name === name);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(name, options);
    if (error && !error.message.toLowerCase().includes("already exists")) {
      throw error;
    }
  }
}

async function writeRecord(folder, id, payload) {
  const file = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });

  const { error } = await supabase.storage
    .from("property-runtime")
    .upload(`${folder}/${id}.json`, file, {
      contentType: "application/json",
      upsert: true,
    });

  if (error) throw error;
}

async function run() {
  await ensureBucket("property-runtime", { public: false, fileSizeLimit: "10MB" });
  await ensureBucket("property-media", { public: true, fileSizeLimit: "50MB" });
  await ensureBucket("property-documents", { public: false, fileSizeLimit: "50MB" });

  for (const area of demoPropertySnapshot.areas) {
    await writeRecord("areas", area.id, area);
  }
  for (const agent of demoPropertySnapshot.agents) {
    await writeRecord("agents", agent.id, agent);
  }
  for (const listing of demoPropertySnapshot.listings) {
    await writeRecord("listings", listing.id, listing);
  }
  for (const record of demoPropertySnapshot.managedRecords) {
    await writeRecord("managed-records", record.id, record);
  }
  for (const campaign of demoPropertySnapshot.campaigns) {
    await writeRecord("campaigns", campaign.id, campaign);
  }
  for (const service of demoPropertySnapshot.services) {
    await writeRecord("services", service.id, service);
  }
  for (const faq of demoPropertySnapshot.faqs) {
    await writeRecord("faqs", faq.id, faq);
  }
  for (const differentiator of demoPropertySnapshot.differentiators) {
    await writeRecord("differentiators", differentiator.id, differentiator);
  }

  console.log(
    `[property:seed] Seeded ${demoPropertySnapshot.listings.length} listings, ${demoPropertySnapshot.areas.length} areas, ${demoPropertySnapshot.agents.length} agents, and ${demoPropertySnapshot.managedRecords.length} managed records.`
  );
}

run().catch((error) => {
  console.error("[property:seed] Seed failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
