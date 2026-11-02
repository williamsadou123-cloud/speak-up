import { h, allEntries, today, yesterday, LEVELS } from './dom.js';
import { defaultState } from '../store.js';

export function renderMe(root, ctx) {
  const s = ctx.state;
  const byId = new Map(allEntries(ctx.content).map((e) => [e.id, e]));
  const cards = Object.values(s.cards).filter((c) => byId.has(c.id));
  const learned = cards.filter((c) => c.reps >= 3).length;
  const weak = cards.filter((c) => c.ease < 2.3 || (c.reps === 0 && c.due <= Date.now())).sort((a, b) => a.ease - b.ease).slice(0, 8);
  const todayXp = s.todayDay === today() ? s.todayXp : 0;
  const stat = (v, l) => h('div', { class: 'stat' }, h('b', null, v), h('span', null, l));

  root.append(
    h('header', { class: 'topbar' }, h('h1', null, 'Moi')),
    h('div', { class: 'stats' },
      stat(s.lastDay === today() || s.lastDay === yesterday() ? s.streak : 0, 'jours d\'affilée'), stat(s.xp, 'points'), stat(todayXp, 'aujourd\'hui')),
    h('div', { class: 'stats' }, stat(cards.length, 'cartes commencées'), stat(learned, 'mots appris'), stat(s.level, 'niveau')),
    h('a', { class: 'hub-row m-listen', href: '#/voice' },
      h('span', { class: 'ico', 'aria-hidden': 'true' }, '🔊'),
      h('div', null, h('b', null, 'Voix et vitesse'), h('span', { class: 'sub' }, 'Accent, voix, vitesse de lecture')),
      h('span', { class: 'chev', 'aria-hidden': 'true' }, '›')),
    h('div', { class: 'card' },
      h('h3', null, 'Mots à renforcer'),
      weak.length
        ? weak.map((c) => { const e = byId.get(c.id); return h('div', { class: 'list-item' }, h('b', null, e.en), h('span', { class: 'muted' }, ` — ${e.fr}`)); })
        : h('p', { class: 'muted' }, 'Rien à signaler pour l\'instant. Fais quelques révisions pour voir apparaître les mots difficiles.'),
      weak.length ? h('a', { class: 'btn m-cards', href: '#/cards', style: 'margin-top:12px' }, 'Réviser maintenant') : null),
    h('div', { class: 'card stack' },
      h('h3', null, 'Réglages'),
      h('div', null, h('label', { class: 'field', for: 'lvl' }, 'Mon niveau'),
        h('select', { id: 'lvl', onchange: (e) => ctx.update((st) => ({ ...st, level: e.target.value })) },
          LEVELS.map((l) => h('option', { value: l, selected: l === s.level }, l)))),
      h('div', null, h('label', { class: 'field', for: 'goal' }, 'Objectif quotidien'),
        h('select', { id: 'goal', onchange: (e) => ctx.update((st) => ({ ...st, dailyGoal: Number(e.target.value) })) },
          [30, 50, 100, 200].map((g) => h('option', { value: g, selected: g === s.dailyGoal }, `${g} points`)))),
      h('button', { class: 'btn secondary', onclick: () => {
        if (confirm('Effacer toute ta progression ?')) {
          ctx.update(() => defaultState());
          ctx.rate = 1;
          ctx.go('#/placement');
        }
      } }, 'Réinitialiser ma progression')));
}
