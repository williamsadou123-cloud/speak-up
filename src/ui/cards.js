import { icon } from './icons.js';
import { h, allEntries, levelBand, shuffled, speakBtn, today, progressBar } from './dom.js';
import { newCard, review, dueCards } from '../srs.js';
import { addXp, touchStreak } from '../store.js';
import { wordSheet } from './sheet.js';

// Trois choix seulement : l'ancien « difficile » reste dans srs.js mais n'est plus proposé.
const GRADES = [['again', 'À revoir'], ['good', 'Bien'], ['easy', 'Facile']];

function label(card, grade, now) {
  const r = review(card, grade, now);
  if (r.interval === 0) return '10 min';
  return r.interval === 1 ? '1 jour' : `${r.interval} jours`;
}

export function renderCards(root, ctx) {
  const now = Date.now();
  const entries = allEntries(ctx.content);
  const byId = new Map(entries.map((e) => [e.id, e]));
  const due = dueCards(Object.values(ctx.state.cards), now).filter((c) => byId.has(c.id)).slice(0, 30);
  const band = levelBand(ctx.state.level);
  const fresh = shuffled(entries.filter((e) => !ctx.state.cards[e.id] && band.includes(e.level))).slice(0, 10);
  const queue = [
    ...due.map((c) => ({ entry: byId.get(c.id), card: c })),
    ...fresh.map((e) => ({ entry: e, card: newCard(e.id, now) })),
  ];
  const total = queue.length;
  let done = 0;

  root.append(h('header', { class: 'topbar' }, h('h1', null, 'Réviser')));
  const body = h('div', { class: 'm-cards' });
  root.append(body);
  next();

  function next() {
    const item = queue[0];
    if (!item) return finished();
    const { entry } = item;
    const front = h('div', { class: 'card flip' },
      h('span', { class: 'tag' }, entry.topic),
      h('div', { class: 'word' }, entry.en),
      speakBtn(ctx, `${entry.id}:word`, entry.en, 'en-US', 'Écouter le mot', false),
      h('p', { class: 'muted small', style: 'margin:0' }, 'Essaie de te rappeler le sens, puis retourne la carte.'));
    front.querySelector('.icon-btn').classList.add('xl');
    body.replaceChildren(
      h('div', { style: 'margin-bottom:14px' }, progressBar((done / total) * 100, 'Révision'), h('p', { class: 'muted small', style: 'margin:6px 0 0' }, `${done} / ${total}`)),
      front,
      h('button', { class: 'btn lg block', onclick: () => reveal(item) }, 'Retourner la carte'));
    ctx.audio.speak(`${entry.id}:word`, entry.en, 'en-US', ctx.rate || 1);
  }

  function reveal({ entry, card }) {
    const t = Date.now();
    body.replaceChildren(
      h('div', { style: 'margin-bottom:14px' }, progressBar((done / total) * 100, 'Révision')),
      h('div', { class: 'card' }, wordSheet(ctx, entry)),
      h('div', { class: 'grade-bar' }, GRADES.map(([g, name]) =>
        h('button', { class: `grade ${g}`, onclick: () => grade(g) }, name, h('small', null, label(card, g, t))))));
    window.scrollTo(0, 0);

    function grade(g) {
      const updated = review(card, g, Date.now());
      ctx.update((s) => {
        let n = { ...s, cards: { ...s.cards, [entry.id]: updated } };
        n = addXp(n, g === 'again' ? 0 : 5, today());
        return touchStreak(n, today());
      });
      queue.shift();
      if (g === 'again') queue.push({ entry, card: updated });
      else done++;
      next();
    }
  }

  function finished() {
    const empty = total === 0;
    body.replaceChildren(h('div', { class: 'card empty stack' },
      h('div', { class: 'big-ico', 'aria-hidden': 'true' }, icon(empty ? 'check' : 'sparkles', 44)),
      h('h2', null, empty ? 'Rien à réviser pour le moment' : 'Révision terminée'),
      h('p', { class: 'muted' }, empty
        ? 'Reviens plus tard, ou découvre de nouveaux mots avec le mode écoute.'
        : `${total} cartes revues. Les prochaines reviendront au bon moment.`),
      h('div', { class: 'row', style: 'justify-content:center' },
        h('a', { class: 'btn m-listen', href: '#/listen' }, 'Écouter du vocabulaire'),
        h('a', { class: 'btn secondary', href: '#/home' }, 'Accueil'))));
  }

  return () => ctx.audio.stop();
}
