import { h, speakBtn, topbar, today, progressBar } from './dom.js';
import { addXp, touchStreak } from '../store.js';

function formulaView(formula) {
  const rows = new Map();
  for (const f of formula) {
    const r = f.row || 0;
    if (!rows.has(r)) rows.set(r, []);
    rows.get(r).push(f);
  }
  return h('div', { class: 'formula' }, [...rows.keys()].sort((a, b) => a - b).map((r) =>
    h('div', { class: 'frow' }, rows.get(r).flatMap((f, i) => [
      i > 0 ? h('span', { class: 'muted', style: 'align-self:center', 'aria-hidden': 'true' }, '+') : null,
      h('div', { class: `fchip ${f.color}` }, h('small', null, f.label), h('b', null, f.text))]))));
}

export function renderGrammar(root, ctx) {
  const lessons = ctx.content.grammar;
  const body = h('div', { class: 'm-grammar' });
  root.append(topbar('Grammaire'), body);
  list();

  function list() {
    body.replaceChildren(...lessons.map((g) =>
      h('button', { class: 'hub-row', onclick: () => open(g) },
        h('span', { class: 'ico', 'aria-hidden': 'true' }, '📘'),
        h('div', null, h('b', null, g.title_fr), h('span', { class: 'sub' }, `Niveau ${g.level} · ${g.exercises.length} exercices`)),
        h('span', { class: 'chev', 'aria-hidden': 'true' }, '›'))));
  }

  // Une leçon = une suite d'écrans courts : règle, formule, exemples, un exercice par écran, résultat.
  function open(g) {
    window.scrollTo(0, 0);
    ctx.audio.stop();
    const steps = [
      { title: 'La règle', view: () => h('ul', { class: 'bullets' }, g.rule_fr.map((r) => h('li', null, r))) },
      { title: 'La formule', view: () => formulaView(g.formula) },
      { title: 'Des exemples', view: () => h('div', null, g.examples.map((ex, i) => h('div', { class: 'example' },
        speakBtn(ctx, `${g.id}:ex${i}`, ex.en, 'en-US', 'Écouter la phrase', false),
        h('div', null, h('div', { class: 'en' }, ex.en), h('div', { class: 'fr' }, ex.fr))))) },
      ...g.exercises.map((ex, n) => ({ title: `Exercice ${n + 1} / ${g.exercises.length}`, ex })),
    ];
    let k = 0;
    let right = 0;
    show();

    function show() {
      if (k >= steps.length) return result();
      const st = steps[k];
      const bar = progressBar((k / steps.length) * 100, 'Leçon');
      const head = h('div', { class: 'row between', style: 'margin:10px 0' }, h('button', { class: 'btn ghost', onclick: list }, '← Leçons'), h('span', { class: 'muted small' }, `${k + 1} / ${steps.length}`));
      if (!st.ex) {
        body.replaceChildren(head, bar,
          h('div', { class: 'card', style: 'margin-top:14px' }, h('h2', null, k === 0 ? g.title_fr : st.title), k === 0 ? h('p', { class: 'sec-title' }, st.title) : null, st.view()),
          h('button', { class: 'btn lg block', onclick: () => { k++; show(); } }, k === steps.length - 1 ? 'Terminer' : 'Suivant'));
        return;
      }
      const fb = h('div');
      const btns = st.ex.choices.map((c) => h('button', { class: 'choice', onclick: () => {
        btns.forEach((b) => { b.disabled = true; b.classList.toggle('right', b.textContent === st.ex.answer); });
        const ok = c === st.ex.answer;
        if (!ok) btns.find((b) => b.textContent === c).classList.add('wrong');
        else { right++; ctx.update((s) => touchStreak(addXp(s, 10, today()), today())); }
        fb.replaceChildren(
          h('div', { class: `feedback ${ok ? 'ok' : 'ko'}`, role: 'status' }, ok ? '✓ Bravo ! +10 points' : `✗ La bonne réponse : ${st.ex.answer}`),
          h('button', { class: 'btn lg block', onclick: () => { k++; show(); } }, k === steps.length - 1 ? 'Voir mon résultat' : 'Suivant'));
      } }, c));
      body.replaceChildren(head, bar,
        h('div', { class: 'card', style: 'margin-top:14px' }, h('p', { class: 'muted small' }, st.title), h('h2', null, st.ex.prompt), h('div', { class: 'choices' }, btns), fb));
    }

    function result() {
      const total = g.exercises.length;
      body.replaceChildren(h('div', { class: 'card empty stack' },
        h('div', { class: 'emoji', 'aria-hidden': 'true' }, right === total ? '🏆' : '👏'),
        h('h2', null, `${right} / ${total}`),
        h('p', { class: 'muted' }, `+${right * 10} points. ${right === total ? 'Parfait !' : 'Relis la règle et réessaie quand tu veux.'}`),
        h('div', { class: 'row', style: 'justify-content:center' },
          h('button', { class: 'btn', onclick: () => open(g) }, 'Recommencer'),
          h('button', { class: 'btn secondary', onclick: list }, 'Toutes les leçons'))));
    }
  }

  return () => ctx.audio.stop();
}
