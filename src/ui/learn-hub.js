import { h } from './dom.js';
import { icon } from './icons.js';

export function renderLearnHub(root, ctx) {
  const c = ctx.content;
  const rows = [
    ['screen-listen', '#/listen', 'headphones', 'Écouter', 'Une séance guidée : mot, définitions, exemples, construction'],
    ['screen-vocab', '#/vocab', 'layers', 'Vocabulaire', `${c.vocab.length} mots avec fiche complète`],
    ['screen-verbs', '#/verbs', 'zap', 'Verbes', `${c.verbs.length} verbes dont ${c.verbs.filter((v) => v.type === 'irregular').length} irréguliers`],
    ['screen-expressions', '#/expressions', 'message', 'Expressions', `${c.expressions.length} idiomes, phrasal verbs, collocations`],
    ['screen-grammar', '#/grammar', 'file', 'Grammaire', `${c.grammar.length} leçons courtes avec formules`],
  ];
  root.append(
    h('header', { class: 'topbar' }, h('div', null, h('h1', { style: 'margin:0' }, 'Apprendre'), h('div', { class: 'sub' }, 'Choisis ce que tu veux découvrir'))),
    ...rows.map(([mod, href, ico, title, sub]) =>
      h('a', { class: `hub-row ${mod}`, href },
        h('span', { class: 'ico', 'aria-hidden': 'true' }, icon(ico, 28)),
        h('div', null, h('b', null, title), h('span', { class: 'sub' }, sub)),
        h('span', { class: 'chev', 'aria-hidden': 'true' }, '›'))));
}
