const baseUrl = process.env.JOBS_SMOKE_URL || process.env.VERCEL_URL || "http://localhost:3000";
const targets = ["/", "/jobs", "/careers", "/talent", "/trust"];

async function main() {
  const normalized = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
  const results = [];

  for (const target of targets) {
    const response = await fetch(`${normalized}${target}`);
    results.push({
      path: target,
      status: response.status,
      ok: response.ok,
    });
  }

  console.log(JSON.stringify({ baseUrl: normalized, results }, null, 2));

  if (results.some((result) => !result.ok)) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
