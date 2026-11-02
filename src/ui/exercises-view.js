import { h, allEntries, levelBand, speakBtn, today, progressBar } from './dom.js';
import { buildSession, isCorrect } from '../exercises.js';
import { addXp, touchStreak } from '../store.js';

let writeMode = false; // choix mémorisé pendant la visite

export function renderExercises(root, ctx) {
  const all = allEntries(ctx.content);
  const band = levelBand(ctx.state.level);
  const near = all.filter((e) => band.includes(e.level));
  const pool = near.length >= 12 ? near : all;
  let session = [];
  let i = 0;
  let score = 0;

  root.append(h('header', { class: 'topbar' }, h('h1', null, 'Pratiquer')));
  const body = h('div', { class: 'm-practice' });
  root.append(body);
  intro();

  function intro() {
    body.replaceChildren(h('div', { class: 'card stack' },
      h('div', { class: 'emoji', 'aria-hidden': 'true' }, '✏️'),
      h('h2', { style: 'margin:0' }, '10 questions, une à la fois'),
      h('p', { class: 'muted', style: 'margin:0' }, 'Tu choisis la bonne réponse, puis une courte explication t\'aide à retenir.'),
      h('label', { class: 'switch' },
        h('input', { type: 'checkbox', checked: writeMode, onchange: (e) => { writeMode = e.target.checked; } }),
        'Écrire mes réponses (plus difficile)'),
      h('button', { class: 'btn lg block', onclick: begin }, 'Commencer')));
  }

  function begin() {
    session = buildSession(pool, 10, Math.random, { write: writeMode });
    i = 0;
    score = 0;
    if (!session.length) {
      body.replaceChildren(h('div', { class: 'card empty' }, h('div', { class: 'emoji' }, '📭'), h('p', null, 'Pas encore d\'exercices disponibles.')));
      return;
    }
    show();
  }

  function show() {
    if (i >= session.length) return end();
    const ex = session[i];
    const card = h('div', { class: 'card' }, h('h2', null, ex.prompt));
    if (ex.type === 'cloze' && ex.hint) card.append(h('p', { class: 'muted' }, ex.hint));
    if (ex.audioText) {
      const hidden = ex.type === 'listen';
      card.append(h('div', { class: 'row' }, speakBtn(ctx, `${ex.entryId}:word`, ex.audioText, 'en-US', hidden ? 'Réécouter' : 'Écouter', !hidden), hidden ? h('span', { class: 'muted small' }, 'Touche pour réécouter') : null));
      if (hidden) {
        ctx.audio.speak(`${ex.entryId}:word`, ex.audioText, 'en-US', ctx.rate || 1).then((r) => {
          if (r === 'none') card.append(h('p', { class: 'banner' }, `Aucune voix anglaise sur cet appareil. Le mot est : ${ex.audioText}`));
        });
      }
    }
    const fb = h('div');
    const submit = (given) => verify(ex, given, card, fb);

    if (ex.choices) {
      const btns = ex.choices.map((c) => h('button', { class: 'choice', onclick: () => {
        btns.forEach((b) => { b.disabled = true; b.classList.toggle('right', b.textContent === ex.answer); });
        if (c !== ex.answer) btns.find((b) => b.textContent === c).classList.add('wrong');
        submit(c);
      } }, c));
      card.append(h('div', { class: 'choices' }, btns));
    } else if (ex.type === 'order') {
      const placed = [];
      const bank = h('div', { class: 'tiles', 'aria-label': 'Mots disponibles' });
      const line = h('div', { class: 'tiles', 'aria-label': 'Ta phrase' });
      const chips = ex.words.map((w, k) => ({ w, k }));
      const paint = () => {
        bank.replaceChildren(...chips.filter((c) => !placed.includes(c)).map((c) => h('button', { class: 'tilebtn', onclick: () => { placed.push(c); paint(); } }, c.w)));
        line.replaceChildren(...placed.map((c) => h('button', { class: 'tilebtn', onclick: () => { placed.splice(placed.indexOf(c), 1); paint(); } }, c.w)));
      };
      paint();
      card.append(line, bank, h('button', { class: 'btn block', onclick: () => submit(placed.map((c) => c.w).join(' ')) }, 'Vérifier'));
    } else {
      const input = h('input', { type: 'text', autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false', 'aria-label': 'Ta réponse' });
      const go = () => submit(input.value);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      card.append(input, h('div', { style: 'margin-top:12px' }, h('button', { class: 'btn block', onclick: go }, 'Vérifier')));
      setTimeout(() => input.focus(), 0);
    }
    card.append(fb);
    body.replaceChildren(
      h('div', { style: 'margin-bottom:14px' }, progressBar((i / session.length) * 100, 'Séance'), h('p', { class: 'muted small', style: 'margin:6px 0 0' }, `Question ${i + 1} / ${session.length}`)),
      card);
  }

  function verify(ex, given, card, fb) {
    card.querySelectorAll('input,button.btn,button.tilebtn').forEach((el) => { el.disabled = true; });
    const ok = isCorrect(ex, given);
    if (ok) {
      score++;
      ctx.update((s) => touchStreak(addXp(s, 10, today()), today()));
    }
    fb.append(
      h('div', { class: `feedback ${ok ? 'ok' : 'ko'}`, role: 'status' },
        ok ? '✓ Bravo ! +10 points' : `✗ La bonne réponse : ${ex.answer}`,
        h('div', { class: 'explain' }, ex.explain)),
      h('button', { class: 'btn lg block', onclick: () => { i++; show(); } }, i + 1 >= session.length ? 'Voir mon score' : 'Continuer'));
    fb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function end() {
    body.replaceChildren(h('div', { class: 'card empty stack' },
      h('div', { class: 'emoji', 'aria-hidden': 'true' }, score >= 8 ? '🏆' : '👏'),
      h('h2', null, `${score} / ${session.length}`),
      h('p', { class: 'muted' }, `+${score * 10} points. ${score >= 8 ? 'Excellent travail !' : 'Chaque séance te fait progresser.'}`),
      h('div', { class: 'row', style: 'justify-content:center' },
        h('button', { class: 'btn', onclick: () => ctx.go(`#/exercises/${Date.now()}`) }, 'Rejouer'),
        h('a', { class: 'btn secondary', href: '#/home' }, 'Accueil'))));
  }

  return () => ctx.audio.stop();
}
