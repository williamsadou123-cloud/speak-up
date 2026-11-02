import { h, allEntries, today, yesterday, progressBar } from './dom.js';
import { dueCards } from '../srs.js';

export function renderHome(root, ctx) {
  const s = ctx.state;
  const known = new Set(allEntries(ctx.content).map((e) => e.id));
  const due = dueCards(Object.values(s.cards), Date.now()).filter((c) => known.has(c.id)).length;
  const todayXp = s.todayDay === today() ? s.todayXp : 0;
  const pct = Math.min(100, Math.round((todayXp / s.dailyGoal) * 100));
  const streakAlive = s.lastDay === today() || s.lastDay === yesterday();

  const resume = due
    ? ['m-cards', '#/cards', '🔁', `Réviser ${due} carte${due > 1 ? 's' : ''}`, 'Le bon moment pour ne rien oublier']
    : ['m-listen', '#/listen', '🎧', 'Écouter 20 mots', 'Une séance guidée, sans rien toucher'];
  const tile = (mod, href, ico, title, sub) =>
    h('a', { class: `tile ${mod}`, href }, h('span', { class: 'ico', 'aria-hidden': 'true' }, ico), h('b', null, title), h('span', { class: 'sub' }, sub));

  root.append(
    h('section', { class: 'hero' }, h('h1', null, 'Speak Up'), h('p', null, 'Écoute, lis, répète : une fiche complète pour chaque mot.')),
    h('a', { class: `card resume ${resume[0]}`, href: resume[1] },
      h('span', { class: 'bubble', 'aria-hidden': 'true' }, resume[2]),
      h('div', null, h('b', null, resume[3]), h('div', { class: 'muted small' }, resume[4]))),
    h('div', { class: 'stats' },
      h('div', { class: 'stat' }, h('b', null, `🔥 ${streakAlive ? s.streak : 0}`), h('span', null, 'jours d\'affilée')),
      h('div', { class: 'stat' }, h('b', null, `⭐ ${s.xp}`), h('span', null, 'points')),
      h('a', { class: 'stat', href: '#/placement', 'aria-label': 'Changer de niveau' }, h('b', null, s.level), h('span', null, 'mon niveau'))),
    h('div', { class: 'card' },
      h('div', { class: 'row between' }, h('b', null, 'Objectif du jour'), h('span', { class: 'muted small' }, `${Math.min(todayXp, s.dailyGoal)} / ${s.dailyGoal} points`)),
      h('div', { style: 'margin-top:10px' }, progressBar(pct, 'Objectif du jour')),
      pct >= 100 ? h('p', { class: 'small', style: 'margin:10px 0 0' }, 'Objectif atteint, bravo ! 🎉') : null),
    h('div', { class: 'grid' },
      tile('m-listen', '#/listen', '🎧', 'Écouter', 'Anglais ou français d\'abord'),
      tile('m-vocab', '#/vocab', '🗂️', 'Vocabulaire', 'Fiches de mots'),
      tile('m-verbs', '#/verbs', '🏃', 'Verbes', 'Irréguliers, essentiels'),
      tile('m-grammar', '#/grammar', '📘', 'Grammaire', 'Règles et formules')));
}
