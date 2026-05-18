import fs from "node:fs";
const r = JSON.parse(fs.readFileSync('apps/account/_audit-TEMP.json', 'utf8'));
const grouped = {};
for (const f of r.files) {
  const parts = f.file.replace(/\\/g, '/').split('/');
  const dir = parts.slice(0, 4).join('/');
  if (!grouped[dir]) grouped[dir] = { count: 0, files: 0 };
  grouped[dir].count += f.findings.length;
  grouped[dir].files += 1;
}
const entries = Object.entries(grouped)
  .map(([k, v]) => ({ dir: k, files: v.files, count: v.count }))
  .sort((a,b) => b.count - a.count);
entries.forEach(e => console.log(e.count, 'in', e.files, 'files:', e.dir));
