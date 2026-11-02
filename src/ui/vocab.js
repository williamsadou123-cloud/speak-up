import { h, topbar, shuffled } from './dom.js';
import { wordSheet, addToCardsBtn } from './sheet.js';

// Vocabulaire : un thème à la fois, chaque mot s'ouvre en fiche complète.
export function renderVocab(root, ctx) {
  const list = ctx.content.vocab;
  const topics = ['all', ...new Set(list.map((e) => e.topic))];
  let topic = topics[1] || 'all';
  let openId = null;
  const nav = h('div', { class: 'tabs m-vocab', role: 'group', 'aria-label': 'Thèmes' });
  const body = h('div', { class: 'm-vocab' });
  root.append(topbar('Vocabulaire'), nav, body);
  show();

  function show() {
    nav.replaceChildren(...topics.map((t) => h('button', { class: `chip${t === topic ? ' on' : ''}`, 'aria-pressed': t === topic, onclick: () => { topic = t; openId = null; show(); } }, t === 'all' ? 'Tout' : t)));
    const items = list.filter((e) => topic === 'all' || e.topic === topic);
    body.replaceChildren(...items.map((e) => {
      const open = openId === e.id;
      const row = h('button', { class: 'vrow', 'aria-expanded': open, onclick: () => { openId = open ? null : e.id; show(); } },
        h('span', null, h('b', null, e.en), ' ', h('span', { class: 'muted' }, e.fr)),
        h('span', { class: 'tag' }, e.level));
      return h('div', null, row, open ? h('div', { class: 'vpanel' }, wordSheet(ctx, e), h('div', { style: 'margin-top:14px' }, addToCardsBtn(ctx, e))) : null);
    }));
  }
}
