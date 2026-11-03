import { icon } from './icons.js';
import { h, speakBtn, topbar, today, progressBar } from './dom.js';
import { addXp, touchStreak } from '../store.js';
import { buildMatchQuiz } from '../learn.js';
import { wordSheet, addToCardsBtn } from './sheet.js';

const NAMES = { idioms: 'Idiomes', 'phrasal verbs': 'Phrasal verbs', collocations: 'Collocations', everyday: 'Au quotidien' };

export function renderExpressions(root, ctx) {
  const list = ctx.content.expressions;
  const topics = [...new Set(list.map((e) => e.topic))];
  let tab = topics[0];
  let openId = null;
  const nav = h('div', { class: 'tabs', role: 'group', 'aria-label': 'Sections' });
  const body = h('div');
  root.append(topbar('Expressions'), h('div', { class: 'm-expressions' }, nav, body));
  show();

  function show() {
    nav.replaceChildren(
      ...topics.map((t) => h('button', { class: `chip${t === tab ? ' on' : ''}`, 'aria-pressed': t === tab, onclick: () => { tab = t; openId = null; show(); } }, NAMES[t] || t)),
      h('button', { class: `chip${tab === 'quiz' ? ' on' : ''}`, 'aria-pressed': tab === 'quiz', onclick: () => { tab = 'quiz'; show(); } }, icon('target', 18), ' Quiz'));
    body.replaceChildren();
    if (tab === 'quiz') quiz();
    else body.append(...list.filter((e) => e.topic === tab).map(item));
  }

  function item(e) {
    const open = openId === e.id;
    return h('div', { class: 'card' },
      h('div', { class: 'row between', style: 'flex-wrap:nowrap' },
        h('h3', { style: 'margin:0' }, e.en, ' ', h('span', { class: 'tag' }, e.level)),
        speakBtn(ctx, `${e.id}:word`, e.en, 'en-US', 'Écouter l\'expression', false)),
      h('p', { style: 'margin:6px 0 0' }, h('b', null, e.fr)),
      h('p', { class: 'muted small', style: 'margin:4px 0 0' }, `Mot à mot : ${e.literal_fr}`),
      h('p', { class: 'small', style: 'margin:4px 0 8px' }, `Quand l'utiliser : ${e.usage_fr}`),
      h('div', { class: 'example' },
        speakBtn(ctx, `${e.id}:ex0`, e.examples[0].en, 'en-US', 'Écouter la phrase', false),
        h('div', null, h('div', { class: 'en' }, e.examples[0].en), h('div', { class: 'fr' }, e.examples[0].fr))),
      h('div', { class: 'row', style: 'margin-top:6px' },
        h('button', { class: 'btn secondary', 'aria-expanded': open, onclick: () => { openId = open ? null : e.id; show(); } }, open ? 'Masquer la fiche' : 'Fiche complète'),
        addToCardsBtn(ctx, e)),
      open ? h('div', { style: 'margin-top:14px' }, wordSheet(ctx, e)) : null);
  }

  function quiz() {
    const questions = buildMatchQuiz(list, 10, Math.random);
    let idx = 0;
    let score = 0;
    const area = h('div');
    body.append(area);
    if (!questions.length) {
      area.append(h('div', { class: 'card empty' }, h('p', null, 'Pas assez d\'expressions pour un quiz.')));
      return;
    }
    ask();

    function ask() {
      if (idx >= questions.length) return summary();
      const q = questions[idx];
      idx++;
      const fb = h('div');
      const btns = q.choices.map((c) => h('button', { class: 'choice', onclick: () => {
        const ok = c === q.answer;
        btns.forEach((b) => { b.disabled = true; b.classList.toggle('right', b.textContent === q.answer); });
        if (!ok) btns.find((b) => b.textContent === c).classList.add('wrong');
        else { score++; ctx.update((s) => touchStreak(addXp(s, 5, today()), today())); }
        fb.replaceChildren(
          h('div', { class: `feedback ${ok ? 'ok' : 'ko'}`, role: 'status' }, ok ? '✓ Correct !' : '✗ Ce n\'est pas tout à fait ça.'),
          h('button', { class: 'btn lg block', onclick: ask }, idx >= questions.length ? 'Voir mon score' : 'Continuer'));
      } }, c));
      area.replaceChildren(
        progressBar(((idx - 1) / questions.length) * 100, 'Quiz'),
        h('div', { class: 'card', style: 'margin-top:14px' },
          h('p', { class: 'muted small' }, `Question ${idx} / ${questions.length} · Que veut dire…`),
          h('div', { class: 'row' }, h('h2', { style: 'margin:0' }, q.prompt), speakBtn(ctx, `${q.entryId}:word`, q.prompt, 'en-US', 'Écouter', false)),
          h('div', { class: 'choices' }, btns), fb));
    }

    function summary() {
      area.replaceChildren(h('div', { class: 'card empty stack' },
        h('div', { class: 'big-ico', 'aria-hidden': 'true' }, icon(score >= 8 ? 'trophy' : 'sparkles', 44)),
        h('h2', null, `${score} / ${questions.length}`),
        h('p', { class: 'muted' }, `+${score * 5} points.`),
        h('button', { class: 'btn', onclick: show }, 'Recommencer')));
    }
  }

  return () => ctx.audio.stop();
}
