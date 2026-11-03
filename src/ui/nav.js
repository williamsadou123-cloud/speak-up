import { h } from './dom.js';
import { icon } from './icons.js';

const TABS = [
  ['home', '#/home', 'home', 'Accueil'],
  ['learn', '#/learn', 'learn', 'Apprendre'],
  ['review', '#/cards', 'repeat', 'Réviser'],
  ['practice', '#/exercises', 'pencil', 'Pratiquer'],
  ['me', '#/me', 'user', 'Moi'],
];

// Route → onglet à mettre en avant.
export const TAB_OF = {
  home: 'home', learn: 'learn', listen: 'learn', vocab: 'learn', verbs: 'learn', expressions: 'learn', grammar: 'learn',
  cards: 'review', exercises: 'practice', me: 'me', progress: 'me', voice: 'me',
};

export function renderNav(current, dueCount = 0) {
  return h('nav', { class: 'tabbar', 'aria-label': 'Navigation principale' },
    h('div', { class: 'tabbar-inner' }, TABS.map(([id, href, ico, label]) =>
      h('a', { class: `tab${id === current ? ' on' : ''}`, href, 'aria-current': id === current ? 'page' : null },
        h('span', { class: 'ico', 'aria-hidden': 'true' }, icon(ico, 24)),
        label,
        id === 'review' && dueCount > 0 ? h('span', { class: 'dot', 'aria-label': `${dueCount} à revoir` }, dueCount > 99 ? '99+' : dueCount) : null))));
}
