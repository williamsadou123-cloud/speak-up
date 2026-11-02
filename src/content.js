const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const isStr = (v) => typeof v === 'string' && v.trim() !== '';

export function validateEntry(entry, kind) {
  const errors = [];
  if (!entry || typeof entry !== 'object') return { ok: false, errors: ['entry'] };
  for (const f of ['id', 'topic', 'en', 'fr', 'definition_fr', 'definition_en']) {
    if (!isStr(entry[f])) errors.push(`missing ${f}`);
  }
  if (!LEVELS.includes(entry.level)) errors.push('invalid level');
  if (!Array.isArray(entry.examples) || entry.examples.length < 2) {
    errors.push('missing examples (at least 2)');
  } else {
    entry.examples.forEach((ex, i) => {
      if (!ex || !isStr(ex.en)) errors.push(`example ${i} missing en`);
      if (!ex || !isStr(ex.fr)) errors.push(`example ${i} missing fr`);
    });
  }
  const c = entry.construction;
  if (!c || !isStr(c.pattern) || !isStr(c.tip_fr)) errors.push('missing construction');
  if (kind === 'expression') {
    for (const f of ['literal_fr', 'usage_fr']) if (!isStr(entry[f])) errors.push(`missing ${f}`);
  }
  if (kind === 'verb') {
    if (!['regular', 'irregular'].includes(entry.type)) errors.push('invalid type');
    for (const f of ['past', 'pastParticiple', 'ing']) {
      if (!isStr(entry[f])) errors.push(`missing ${f}`);
    }
  }
  return { ok: errors.length === 0, errors };
}

const FILES = [
  ['vocab', 'data/vocab.json', 'vocab'],
  ['verbs', 'data/verbs.json', 'verb'],
  ['expressions', 'data/expressions.json', 'expression'],
];

export async function loadContent(fetchFn) {
  const out = {};
  for (const [name, url, kind] of FILES) {
    const list = await (await fetchFn(url)).json();
    out[name] = [];
    for (const e of list) {
      const r = validateEntry(e, kind);
      if (r.ok) out[name].push(e);
      else console.warn(`[content] ${name}: entrée ignorée (${e && e.id}) — ${r.errors.join(', ')}`);
    }
  }
  const grammar = await (await fetchFn('data/grammar.json')).json();
  out.grammar = [];
  for (const g of grammar) {
    const ok = g && isStr(g.id) && isStr(g.title_fr) && Array.isArray(g.rule_fr) && g.rule_fr.length > 0 && Array.isArray(g.formula);
    if (ok) out.grammar.push(g);
    else console.warn(`[content] grammar: leçon ignorée (${g && g.id}) — rule_fr ou formula manquant`);
  }
  return out;
}
