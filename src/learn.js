// Logique d'apprentissage (fonctions pures) : groupes de verbes irréguliers, quiz d'expressions.
const first = (s) => String(s).split('/')[0].trim().toLowerCase();

export function groupIrregular(verb) {
  const base = first(verb.en);
  const past = first(verb.past);
  const pp = first(verb.pastParticiple);
  if (base === past && past === pp) return 'unchanged';
  if (past === pp) return 'same-past';
  if (base.includes('i') && /a/.test(past) && /u/.test(pp)) return 'i-a-u';
  if (base !== 'be' && [base + 'n', base + 'en', past + 'n', past + 'en', base.replace(/e$/, '') + 'en'].includes(pp)) return 'en-ending';
  return 'other';
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildMatchQuiz(expressions, count, rng) {
  const out = [];
  for (const e of shuffle(expressions, rng)) {
    if (out.length >= count) break;
    const wrong = [];
    for (const o of shuffle(expressions, rng)) {
      if (o.id === e.id || o.definition_fr === e.definition_fr || wrong.includes(o.definition_fr)) continue;
      wrong.push(o.definition_fr);
      if (wrong.length === 3) break;
    }
    if (wrong.length < 3) continue;
    out.push({ entryId: e.id, prompt: e.en, answer: e.definition_fr, choices: shuffle([e.definition_fr, ...wrong], rng) });
  }
  return out;
}
