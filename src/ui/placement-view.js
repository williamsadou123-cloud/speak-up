import { h, allEntries, shuffled, LEVELS } from './dom.js';
import { makeExercise } from '../exercises.js';
import { placementLevel } from '../placement.js';

// 2 questions par niveau (10 au total) ; si un niveau manque de contenu, on complète avec les autres.
function buildQuestions(pool) {
  const qs = [];
  for (const level of LEVELS) {
    for (const e of shuffled(pool.filter((p) => p.level === level))) {
      if (qs.filter((q) => q.level === level).length >= 2) break;
      const ex = makeExercise('choice', e, pool, Math.random);
      if (ex) qs.push({ ...ex, level });
    }
  }
  for (const e of shuffled(pool)) {
    if (qs.length >= 10) break;
    if (qs.some((q) => q.entryId === e.id)) continue;
    const ex = makeExercise('choice', e, pool, Math.random);
    if (ex) qs.push({ ...ex, level: e.level });
  }
  return qs.slice(0, 10);
}

export function renderPlacement(root, ctx) {
  const questions = buildQuestions(allEntries(ctx.content));
  let i = 0;
  let correct = 0;
  const body = h('div');
  root.append(
    h('header', { class: 'topbar' }, h('h1', null, 'Quel est ton niveau ?')),
    body);
  intro();

  function setLevel(level) {
    ctx.update((s) => ({ ...s, level }));
    ctx.go('#/home');
  }

  function intro() {
    body.replaceChildren(h('div', { class: 'card stack' },
      h('p', null, 'Réponds à 10 questions rapides pour que je règle la difficulté. Pas de stress : tu pourras changer de niveau à tout moment.'),
      h('button', { class: 'btn block', onclick: question }, 'Commencer'),
      h('button', { class: 'btn ghost block', onclick: () => setLevel(ctx.state.level || 'B1') }, ctx.state.level ? 'Garder mon niveau actuel' : 'Passer (niveau B1)'),
      h('div', null, h('p', { class: 'small muted' }, 'Ou choisis directement :'),
        h('div', { class: 'chips' }, LEVELS.map((l) => h('button', { class: 'chip', onclick: () => setLevel(l) }, l))))));
  }

  function question() {
    if (i >= questions.length) return result();
    const q = questions[i];
    const buttons = q.choices.map((c) => h('button', { class: 'choice', onclick: () => pick(c, buttons) }, c));
    body.replaceChildren(h('div', { class: 'card' },
      h('p', { class: 'muted small' }, `Question ${i + 1} / ${questions.length}`),
      h('h2', null, q.prompt),
      h('div', { class: 'choices' }, buttons)));
    function pick(c, btns) {
      if (c === q.answer) correct++;
      btns.forEach((b) => { b.disabled = true; b.classList.toggle('right', b.textContent === q.answer); });
      if (c !== q.answer) btns.find((b) => b.textContent === c).classList.add('wrong');
      setTimeout(() => { i++; question(); }, 650);
    }
  }

  function result() {
    const level = placementLevel(correct, questions.length);
    body.replaceChildren(h('div', { class: 'card empty stack' },
      h('div', { class: 'emoji', 'aria-hidden': 'true' }, '🎯'),
      h('h2', null, `Ton niveau de départ : ${level}`),
      h('p', { class: 'muted' }, `${correct} bonnes réponses sur ${questions.length}.`),
      h('button', { class: 'btn', onclick: () => setLevel(level) }, 'C\'est parti !')));
  }
}
