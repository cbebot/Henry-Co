import fs from "node:fs";
const r = JSON.parse(fs.readFileSync('apps/account/_audit-TEMP.json', 'utf8'));

const SKIP_DIRS = [
  'lib/notification-localization.ts',
  'app/api/',
  'app/manifest.ts',
  'app/opengraph-image.tsx',
  '_audit',
];

const SKIP_TEXT_PATTERNS = [
  /^["']\w+["']\s*[:,]/, // not real string
  /^[\s.,:%+\-]+$/,
  /className/i,
  /var\(--/,
];

// Filter findings to truly actionable ones
const truly = [];
for (const f of r.files) {
  const fname = f.file.replace(/\\/g, '/');
  if (SKIP_DIRS.some(d => fname.includes(d))) continue;
  for (const found of f.findings) {
    let text = found.text;
    // Skip if text contains backticks, template fragments
    if (text.includes('`') && text.length > 80) continue;
    if (text.includes('${')) continue;
    // Skip pure code snippets
    if (text.includes('console.') || text.includes('throw ')) continue;
    if (SKIP_TEXT_PATTERNS.some(p => p.test(text))) continue;
    // Skip if it looks like punctuation/syntax
    if (!/[A-Z]/i.test(text)) continue;
    truly.push({ file: fname, line: found.line, text });
  }
}

console.log('Total actionable:', truly.length);
// Group by file
const grouped = {};
for (const f of truly) {
  if (!grouped[f.file]) grouped[f.file] = [];
  grouped[f.file].push(f);
}
const groupedEntries = Object.entries(grouped).sort((a,b) => b[1].length - a[1].length);
console.log('Files:', groupedEntries.length);

const out = groupedEntries.map(([file, items]) => ({ file, items }));
fs.writeFileSync('apps/account/_audit-actionable.json', JSON.stringify(out, null, 2));
console.log('Wrote apps/account/_audit-actionable.json');
