// Convertit content/*.txt (format compact) en data/*.json.
// Usage : node tools/build-content.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function rows(file) {
  const out = [];
  let topic = 'general';
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    if (line.startsWith('# ')) { topic = line.slice(2).trim(); continue; }
    out.push({ topic, cols: line.split('|').map((c) => c.trim()) });
  }
  return out;
}

function pairs(cols) {
  const ex = [];
  for (let i = 0; i + 1 < cols.length; i += 2) ex.push({ en: cols[i], fr: cols[i + 1] });
  return ex;
}

function build(file, prefix, mapper) {
  const seen = new Set();
  const list = [];
  for (const { topic, cols } of rows(file)) {
    const e = mapper(topic, cols);
    let id = `${prefix}-${slug(e.en)}`;
    if (seen.has(id)) { console.warn(`doublon ignoré : ${id}`); continue; }
    seen.add(id);
    list.push({ id, ...e });
  }
  return list;
}

const vocab = build('content/vocab.txt', 'v', (topic, c) => ({
  level: c[0], topic, en: c[1], fr: c[2], definition_fr: c[3], definition_en: c[4], examples: pairs(c.slice(5)),
}));
const verbs = build('content/verbs.txt', 'vb', (topic, c) => ({
  level: c[0], topic, type: c[1], en: c[2], past: c[3], pastParticiple: c[4], ing: c[5], fr: c[6],
  definition_fr: c[7], definition_en: c[8], examples: pairs(c.slice(9)),
}));
const expressions = build('content/expressions.txt', 'x', (topic, c) => ({
  level: c[0], topic, en: c[1], fr: c[2], definition_fr: c[3], definition_en: c[4], examples: pairs(c.slice(5)),
}));

// --- Fusion des fichiers complémentaires -------------------------------------
const partial = process.argv.includes('--partial'); // construction de contenu par étapes
const problems = [];
const key = (s) => s.trim().toLowerCase();
const index = (list) => new Map(list.map((e) => [key(e.en), e]));
const maps = { vocab: index(vocab), verbs: index(verbs), expressions: index(expressions) };

function extraRows(file) {
  return existsSync(file) ? rows(file) : [];
}

// construction.txt : sections « # vocab|verbs|expressions », lignes en|pattern|tip_fr
for (const { topic, cols } of extraRows('content/construction.txt')) {
  const target = maps[topic] && maps[topic].get(key(cols[0]));
  if (!target) { problems.push(`construction : ligne orpheline « ${cols[0]} » (section ${topic})`); continue; }
  if (!cols[1] || !cols[2]) { problems.push(`construction : ligne incomplète « ${cols[0]} »`); continue; }
  target.construction = { pattern: cols[1], tip_fr: cols[2] };
}
// verbs-extra.txt : en|ex_en|ex_fr (exemple supplémentaire)
for (const { cols } of extraRows('content/verbs-extra.txt')) {
  const target = maps.verbs.get(key(cols[0]));
  if (!target) { problems.push(`verbs-extra : ligne orpheline « ${cols[0]} »`); continue; }
  target.examples.push(...pairs(cols.slice(1)));
}
// expressions-extra.txt : en|literal_fr|usage_fr
for (const { cols } of extraRows('content/expressions-extra.txt')) {
  const target = maps.expressions.get(key(cols[0]));
  if (!target) { problems.push(`expressions-extra : ligne orpheline « ${cols[0]} »`); continue; }
  target.literal_fr = cols[1];
  target.usage_fr = cols[2];
}
// essential.txt : un verbe par ligne
for (const { cols } of extraRows('content/essential.txt')) {
  const target = maps.verbs.get(key(cols[0]));
  if (!target) { problems.push(`essential : verbe inconnu « ${cols[0]} »`); continue; }
  target.essential = true;
}
if (!partial) {
  for (const [name, list] of Object.entries({ vocab, verbs, expressions })) {
    for (const e of list) if (!e.construction) problems.push(`${name} : « ${e.en} » sans construction`);
  }
}
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

writeFileSync('data/vocab.json', JSON.stringify(vocab, null, 1));
writeFileSync('data/verbs.json', JSON.stringify(verbs, null, 1));
writeFileSync('data/expressions.json', JSON.stringify(expressions, null, 1));
console.log(`vocab ${vocab.length}, verbs ${verbs.length}, expressions ${expressions.length}`);
