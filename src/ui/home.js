import { h, allEntries, today, yesterday } from './dom.js';
import { dueCards } from '../srs.js';

export function renderHome(root, ctx) {
  const s = ctx.state;
  const known = new Set(allEntries(ctx.content).map((e) => e.id));
  const due = dueCards(Object.values(s.cards), Date.now()).filter((c) => known.has(c.id)).length;
  const todayXp = s.todayDay === today() ? s.todayXp : 0;
  const pct = Math.min(100, Math.round((todayXp / s.dailyGoal) * 100));
  const streakAlive = s.lastDay === today() || s.lastDay === yesterday();

  const resume = due
    ? ['#/cards', `Réviser ${due} carte${due > 1 ? 's' : ''}`, 'Le bon moment pour ne rien oublier', 'Réviser']
    : ['#/listen', 'Écouter 20 mots', 'Une séance guidée, sans rien toucher', 'Lancer'];
  const tile = (mod, href, ico, title, sub) =>
    h('a', { class: `tile ${mod}`, href }, h('span', { class: 'ico', 'aria-hidden': 'true' }, ico), h('b', null, title), h('span', { class: 'sub' }, sub));

  root.append(
    h('header', { class: 'topbar' },
      h('div', { style: 'flex:1' }, h('div', { class: 'sub' }, 'Bon retour'), h('h1', { style: 'margin:0' }, `${s.avatar || '🦊'} Prêt à progresser ?`)),
      h('span', { class: 'pill', 'aria-label': `${s.xp} points` }, `⭐ ${s.xp}`)),
    h('a', { class: 'resume-card', href: resume[0] },
      h('div', null, h('span', { class: 'kicker' }, 'Reprends là où tu en étais'), h('b', null, resume[1]), h('span', { class: 'go' }, `${resume[3]} →`)),
      h('div', { class: 'ring', style: `--p:${pct}`, role: 'img', 'aria-label': `Objectif du jour : ${pct} %` }, h('span', null, `${pct}%`))),
    h('div', { class: 'stats' },
      h('div', { class: 'stat' }, h('b', null, `🔥 ${streakAlive ? s.streak : 0}`), h('span', null, 'jours d\'affilée')),
      h('div', { class: 'stat' }, h('b', null, `${Math.min(todayXp, s.dailyGoal)}/${s.dailyGoal}`), h('span', null, 'points du jour')),
      h('a', { class: 'stat', href: '#/placement', 'aria-label': 'Changer de niveau' }, h('b', null, s.level), h('span', null, 'mon niveau'))),
    h('div', { class: 'section-title' }, 'Que veux-tu faire ?'),
    h('div', { class: 'grid' },
      tile('screen-listen', '#/listen', '🎧', 'Écouter', 'Anglais ou français d\'abord'),
      tile('screen-vocab', '#/vocab', '🗂️', 'Vocabulaire', 'Fiches de mots'),
      tile('screen-verbs', '#/verbs', '🏃', 'Verbes', 'Irréguliers, essentiels'),
      tile('screen-expressions', '#/expressions', '💬', 'Expressions', 'Idiomes et quiz'),
      tile('screen-grammar', '#/grammar', '📘', 'Grammaire', 'Règles et formules'),
      tile('screen-exercises', '#/exercises', '✏️', 'Pratiquer', '10 questions')));
}
