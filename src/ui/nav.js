import { h } from './dom.js';

const TABS = [
  ['home', '#/home', '🏠', 'Accueil'],
  ['learn', '#/learn', '📚', 'Apprendre'],
  ['review', '#/cards', '🔁', 'Réviser'],
  ['practice', '#/exercises', '✏️', 'Pratiquer'],
  ['me', '#/me', '👤', 'Moi'],
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
        h('span', { class: 'ico', 'aria-hidden': 'true' }, ico),
        label,
        id === 'review' && dueCount > 0 ? h('span', { class: 'dot', 'aria-label': `${dueCount} à revoir` }, dueCount > 99 ? '99+' : dueCount) : null))));
}
