import { h } from './dom.js';

export function renderLearnHub(root, ctx) {
  const c = ctx.content;
  const rows = [
    ['screen-listen', '#/listen', '🎧', 'Écouter', 'Une séance guidée : mot, définitions, exemples, construction'],
    ['screen-vocab', '#/vocab', '🗂️', 'Vocabulaire', `${c.vocab.length} mots avec fiche complète`],
    ['screen-verbs', '#/verbs', '🏃', 'Verbes', `${c.verbs.length} verbes dont ${c.verbs.filter((v) => v.type === 'irregular').length} irréguliers`],
    ['screen-expressions', '#/expressions', '💬', 'Expressions', `${c.expressions.length} idiomes, phrasal verbs, collocations`],
    ['screen-grammar', '#/grammar', '📘', 'Grammaire', `${c.grammar.length} leçons courtes avec formules`],
  ];
  root.append(
    h('header', { class: 'topbar' }, h('div', null, h('h1', { style: 'margin:0' }, 'Apprendre'), h('div', { class: 'sub' }, 'Choisis ce que tu veux découvrir'))),
    ...rows.map(([mod, href, ico, title, sub]) =>
      h('a', { class: `hub-row ${mod}`, href },
        h('span', { class: 'ico', 'aria-hidden': 'true' }, ico),
        h('div', null, h('b', null, title), h('span', { class: 'sub' }, sub)),
        h('span', { class: 'chev', 'aria-hidden': 'true' }, '›'))));
}
