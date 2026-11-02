import { h } from './dom.js';

export function renderLearnHub(root, ctx) {
  const c = ctx.content;
  const rows = [
    ['m-listen', '#/listen', '🎧', 'Écouter', 'Une séance guidée : mot, définitions, exemples, construction'],
    ['m-vocab', '#/vocab', '🗂️', 'Vocabulaire', `${c.vocab.length} mots avec fiche complète`],
    ['m-verbs', '#/verbs', '🏃', 'Verbes', `${c.verbs.length} verbes dont ${c.verbs.filter((v) => v.type === 'irregular').length} irréguliers`],
    ['m-expressions', '#/expressions', '💬', 'Expressions', `${c.expressions.length} idiomes, phrasal verbs, collocations`],
    ['m-grammar', '#/grammar', '📘', 'Grammaire', `${c.grammar.length} leçons courtes avec formules`],
  ];
  root.append(
    h('header', { class: 'topbar' }, h('h1', null, 'Apprendre')),
    h('p', { class: 'muted' }, 'Choisis ce que tu veux découvrir aujourd\'hui.'),
    ...rows.map(([mod, href, ico, title, sub]) =>
      h('a', { class: `hub-row ${mod}`, href },
        h('span', { class: 'ico', 'aria-hidden': 'true' }, ico),
        h('div', null, h('b', null, title), h('span', { class: 'sub' }, sub)),
        h('span', { class: 'chev', 'aria-hidden': 'true' }, '›'))));
}
