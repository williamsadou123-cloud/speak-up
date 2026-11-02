export function normalize(s) {
  return String(s)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[‘’ʼ]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

const stripPunct = (s) => normalize(s).replace(/[.,!?;:]+$/g, '').trim();

export function isCorrect(exercise, given) {
  const g = stripPunct(given);
  return [exercise.answer, ...(exercise.alts || [])].some((a) => stripPunct(a) === g);
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function distractors(entry, pool, field, rng) {
  const answer = entry[field];
  const base = (s) => normalize(s.replace(/\(.*?\)/g, ''));
  const a = base(answer);
  const others = pool.filter((p) => {
    if (p.id === entry.id || p[field] === answer) return false;
    const b = base(p[field]);
    return b !== a && !b.includes(a) && !a.includes(b);
  });
  const same = shuffle(others.filter((p) => p.level === entry.level), rng);
  const rest = shuffle(others.filter((p) => p.level !== entry.level), rng);
  const out = [];
  for (const p of [...same, ...rest]) {
    if (!out.includes(p[field])) out.push(p[field]);
    if (out.length === 3) break;
  }
  return out;
}

function explainText(entry) {
  const tip = entry.construction && entry.construction.tip_fr;
  return `« ${entry.en} » = ${entry.fr}. ${entry.definition_fr}${tip ? ` ${tip}` : ''}`;
}

// Trois autres formes plausibles : d'abord les autres formes du même verbe, puis des mots d'autres entrées.
function clozeChoices(entry, answer, pool, rng) {
  const own = [entry.en, entry.past, entry.pastParticiple, entry.ing].filter(Boolean)
    .flatMap((f) => f.split('/')).filter((f) => normalize(f) !== normalize(answer));
  const out = [];
  for (const f of shuffle([...new Set(own)], rng)) if (out.length < 2) out.push(f);
  const others = shuffle(pool.filter((p) => p.id !== entry.id).map((p) => p.en), rng);
  for (const w of others) {
    if (out.length === 3) break;
    if (normalize(w) !== normalize(answer) && !out.some((o) => normalize(o) === normalize(w))) out.push(w);
  }
  const cap = /^[A-Z]/.test(answer);
  const styled = out.map((w) => (cap ? w.charAt(0).toUpperCase() + w.slice(1) : w));
  return styled.length === 3 ? shuffle([answer, ...styled], rng) : null;
}

export function makeExercise(type, entry, pool, rng, options = {}) {
  const ex = build(type, entry, pool, rng, options);
  return ex ? { ...ex, explain: explainText(entry) } : null;
}

function build(type, entry, pool, rng, { write = false } = {}) {
  const base = { type, entryId: entry.id };
  switch (type) {
    case 'choice': {
      const d = distractors(entry, pool, 'fr', rng);
      if (d.length < 3) return null;
      return { ...base, prompt: `Que signifie « ${entry.en} » ?`, answer: entry.fr,
        choices: shuffle([entry.fr, ...d], rng), audioText: entry.en };
    }
    case 'typing':
      return { ...base, prompt: `Écris en anglais : ${entry.fr}`, answer: entry.en,
        alts: pool.filter((p) => p.fr === entry.fr && p.en !== entry.en).map((p) => p.en) };
    case 'listen': {
      if (write) return { ...base, prompt: 'Écoute, puis écris ce que tu entends.', answer: entry.en, audioText: entry.en };
      const d = distractors(entry, pool, 'en', rng);
      if (d.length < 3) return null;
      return { ...base, prompt: 'Écoute, puis choisis le mot que tu entends.', answer: entry.en, audioText: entry.en, choices: shuffle([entry.en, ...d], rng) };
    }
    case 'cloze': {
      const forms = [entry.en, entry.past, entry.pastParticiple, entry.ing].filter(Boolean);
      for (const ex of entry.examples) {
        for (const f of forms) {
          const re = new RegExp(`\\b${escapeRe(f)}\\b`, 'i');
          const m = ex.en.match(re);
          if (m) {
            const out = { ...base, prompt: ex.en.replace(re, '____'), answer: m[0], hint: ex.fr };
            if (write) return out;
            const choices = clozeChoices(entry, m[0], pool, rng);
            return choices ? { ...out, choices } : null;
          }
        }
      }
      return null;
    }
    case 'order': {
      const ex = entry.examples.find((e) => e.en.trim().split(/\s+/).length >= 3);
      if (!ex) return null;
      const words = ex.en.trim().split(/\s+/);
      return { ...base, prompt: `Remets les mots dans l'ordre : ${ex.fr}`, answer: words.join(' '), words: shuffle(words, rng) };
    }
    default:
      return null;
  }
}

const CHOICE_TYPES = ['choice', 'listen', 'cloze'];
const ALL_TYPES = ['choice', 'listen', 'typing', 'cloze', 'order'];

export function buildSession(pool, count, rng, options = {}) {
  const TYPES = options.write ? ALL_TYPES : CHOICE_TYPES;
  const out = [];
  const entries = shuffle(pool, rng);
  let t = 0;
  for (const entry of entries) {
    if (out.length >= count) break;
    let ex = null;
    for (let k = 0; k < TYPES.length && !ex; k++) {
      ex = makeExercise(TYPES[(t + k) % TYPES.length], entry, pool, rng, options);
    }
    t++;
    if (ex) out.push(ex);
  }
  return out;
}
