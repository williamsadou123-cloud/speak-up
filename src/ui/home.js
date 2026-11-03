import { h, allEntries, today, yesterday } from './dom.js';
import { dueCards } from '../srs.js';

export function renderHome(root, ctx) {
  const s = ctx.state;
  const c = ctx.content;
  const known = new Set(allEntries(c).map((e) => e.id));
  const due = dueCards(Object.values(s.cards), Date.now()).filter((x) => known.has(x.id)).length;
  const todayXp = s.todayDay === today() ? s.todayXp : 0;
  const streakAlive = s.lastDay === today() || s.lastDay === yesterday();

  const pick = due
    ? ['#/cards', `Réviser ${due} carte${due > 1 ? 's' : ''}`, 'Le bon moment pour ne rien oublier', 'Révision du jour']
    : ['#/listen', 'Écoute guidée', 'Mot, sens, exemples, construction. Sans rien toucher.', 'Sélection du jour'];
  const cat = (mod, href, ico, label) =>
    h('a', { class: `cat ${mod}`, href }, h('i', { 'aria-hidden': 'true' }, ico), label);
  const row = (src, ico, title, sub) =>
    h('a', { class: 'pl-row screen-listen', href: `#/listen/${src}`, 'aria-label': `Écouter : ${title}` },
      h('span', { class: 'thumb', 'aria-hidden': 'true' }, ico),
      h('div', null, h('b', null, title), h('span', { class: 'sub' }, sub)),
      h('span', { class: 'go', 'aria-hidden': 'true' }, '▶'));
  const irr = c.verbs.filter((v) => v.type === 'irregular').length;

  root.append(
    h('header', { class: 'topbar' },
      h('div', { style: 'flex:1' }, h('div', { class: 'sub' }, 'Bon retour'), h('h1', { style: 'margin:0' }, 'Prêt à progresser ?')),
      h('a', { class: 'pill', href: '#/me', 'aria-label': `Mon profil, ${s.xp} points` }, `${s.avatar || '🦊'} ${s.xp}`)),
    h('a', { class: 'pick screen-listen', href: pick[0] },
      h('span', { class: 'kicker' }, pick[3]), h('b', null, pick[1]), h('span', { class: 'sub' }, pick[2]),
      h('span', { class: 'play', 'aria-hidden': 'true' }, '▶')),
    h('div', { class: 'stats' },
      h('div', { class: 'stat' }, h('b', null, `🔥 ${streakAlive ? s.streak : 0}`), h('span', null, 'jours d\'affilée')),
      h('div', { class: 'stat' }, h('b', null, `${Math.min(todayXp, s.dailyGoal)}/${s.dailyGoal}`), h('span', null, 'points du jour')),
      h('a', { class: 'stat', href: '#/placement', 'aria-label': 'Changer de niveau' }, h('b', null, s.level), h('span', null, 'mon niveau'))),
    h('div', { class: 'section-title' }, 'Catégories'),
    h('div', { class: 'cats' },
      cat('screen-listen', '#/listen', '🎧', 'Écouter'),
      cat('screen-vocab', '#/vocab', '🗂️', 'Vocabulaire'),
      cat('screen-verbs', '#/verbs', '🏃', 'Verbes'),
      cat('screen-expressions', '#/expressions', '💬', 'Expressions'),
      cat('screen-grammar', '#/grammar', '📘', 'Grammaire'),
      cat('screen-exercises', '#/exercises', '✏️', 'Pratiquer')),
    h('div', { class: 'section-title' }, 'Mode métro 🎧', h('span', { class: 'sub muted small' }, 'lance, verrouille, écoute')),
    row('irregular', '🏃', 'Verbes irréguliers', `${irr} verbes en boucle`),
    row('grammar', '📘', 'Grammaire', `${c.grammar.length} leçons à écouter`),
    row('expressions', '💬', 'Expressions', `${c.expressions.length} expressions`),
    row('mix', '🎲', 'Mélange de tout', 'Mots, verbes, expressions, grammaire'));
}
