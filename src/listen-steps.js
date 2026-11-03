// Étapes de lecture d'une fiche (fonctions pures, sans DOM).
const EN = 'en-US';
const FR = 'fr-FR';

// Rend un texte lisible à voix haute : les symboles deviennent des mots.
export function spokenText(s, lang = 'en') {
  const or = lang === 'fr' ? ' ou ' : ' or ';
  return String(s)
    .replace(/\s*\/\s*/g, or)
    .replace(/\s*\+\s*/g, ' plus ')
    .replace(/\s*=\s*/g, lang === 'fr' ? ' veut dire ' : ' means ')
    .replace(/\s*[→|]\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

const speak = (item, id, label, text, lang, extra = {}) => ({
  id, kind: 'speak', label, key: `${item.id}:${id}`, text: spokenText(text, lang === FR ? 'fr' : 'en'), show: text, lang, ...extra,
});

export function buildSteps(item, mode, options = {}) {
  const { guessMs = 4000, maxExamples = 3 } = options;
  const word = speak(item, 'word', 'Anglais', item.en, EN, { big: true });
  const forms = item.type === 'irregular' || item.type === 'regular'
    ? [speak(item, 'forms', 'Formes', [item.en, item.past, item.pastParticiple].join(', '), EN)]
    : [];
  const fr = speak(item, 'fr', 'Français', item.fr, FR, { big: mode === 'fr-first' });
  const defen = speak(item, 'defen', 'Definition', item.definition_en, EN);
  const def = speak(item, 'def', 'Définition', item.definition_fr, FR);

  const steps = mode === 'fr-first'
    ? [fr, defen, { id: 'guess', kind: 'pause', label: 'À toi de deviner', ms: guessMs }, word, ...forms, def]
    : [word, ...forms, fr, defen, def];

  (item.examples || []).slice(0, maxExamples).forEach((ex, i) => {
    steps.push(speak(item, `ex${i}`, 'Exemple', ex.en, EN));
    steps.push(speak(item, `ex${i}fr`, 'Traduction', ex.fr, FR));
  });

  const c = item.construction;
  if (c && c.pattern) steps.push(speak(item, 'con', 'Comment c\'est construit', c.pattern, EN));
  if (c && c.tip_fr) steps.push(speak(item, 'tip', 'Conseil', c.tip_fr, FR));
  return steps;
}

// Leçon de grammaire : titre, règle (une phrase par étape), puis chaque exemple en anglais et en français.
export function buildGrammarSteps(g, options = {}) {
  const { maxExamples = 3 } = options;
  const steps = [speak(g, 'title', 'Leçon', g.title_fr, FR, { big: true })];
  (g.rule_fr || []).forEach((r, i) => steps.push(speak(g, `r${i}`, 'Règle', r, FR)));
  (g.examples || []).slice(0, maxExamples).forEach((ex, i) => {
    steps.push(speak(g, `ex${i}`, 'Exemple', ex.en, EN));
    steps.push(speak(g, `ex${i}fr`, 'Traduction', ex.fr, FR));
  });
  return steps;
}

export function buildStepsFor(item, mode, options = {}) {
  return item.type === 'grammar' ? buildGrammarSteps(item, options) : buildSteps(item, mode, options);
}
