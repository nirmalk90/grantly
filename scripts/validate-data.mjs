import fs from 'node:fs';
const catalog = JSON.parse(fs.readFileSync('public/data/scholarships.json', 'utf8'));
const ids = new Set(), slugs = new Set();
for (const s of catalog.scholarships) {
  if (ids.has(s.id) || slugs.has(s.slug)) throw new Error(`Duplicate identity: ${s.name}`);
  ids.add(s.id); slugs.add(s.slug);
  for (const key of ['applyUrl', 'sourceUrl']) if (new URL(s[key]).protocol !== 'https:') throw new Error(`Unsafe ${key}: ${s.name}`);
  if (!s.sourceUrl || !s.verifiedAt || !s.deadlineNote || s.conditions.length === 0) throw new Error(`Missing provenance: ${s.name}`);
  for (const key of ['deadline', 'opensAt', 'verifiedAt']) if (s[key] !== null && !/^\d{4}-\d{2}-\d{2}$/.test(s[key])) throw new Error(`Invalid date: ${s.name}`);
}
process.stdout.write(`Validated ${ids.size} source-linked records; no generated deadlines.\n`);
