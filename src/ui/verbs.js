import { h, speakBtn, topbar, shuffled, today, progressBar } from './dom.js';
import { addXp, touchStreak } from '../store.js';
import { groupIrregular } from '../learn.js';
import { spokenText } from '../listen-steps.js';
import { wordSheet, addToCardsBtn } from './sheet.js';

const TABS = [['essential', 'Essentiels'], ['groups', 'Par ressemblance'], ['regular', 'Réguliers'], ['action', 'Verbes d\'action'], ['practice', 'S\'entraîner']];

const GROUPS = [
  ['unchanged', 'Ne changent jamais', 'cut – cut – cut'],
  ['same-past', 'Même forme au prétérit et au participe', 'buy – bought – bought'],
  ['i-a-u', 'i → a → u', 'sing – sang – sung'],
  ['en-ending', 'Participe en -n ou -en', 'break – broke – broken'],
  ['other', 'Les autres, à apprendre un par un', 'go – went – gone'],
];

const RULES = [
  ['Prétérit et participe passé des verbes réguliers', [
    'On ajoute -ed : work → worked, play → played.',
    'Verbe en -e : on ajoute seulement -d : live → lived.',
    'Consonne + y : y devient -ied : study → studied (mais play → played).',
    'Voyelle courte + consonne : on double la consonne : stop → stopped, plan → planned.']],
  ['La forme en -ing', [
    'On ajoute -ing : work → working.',
    'Verbe en -e : on retire le -e : make → making.',
    'Voyelle courte + consonne : on double la consonne : run → running, sit → sitting.',
    'Verbe en -ie : ie devient y : lie → lying.']],
  ['La 3e personne du singulier (présent)', [
    'On ajoute -s : he works.',
    'Après -s, -sh, -ch, -x, -o : on ajoute -es : she watches, he goes.',
    'Consonne + y : y devient -ies : study → studies.']],
  ['Prononciation du -ed', [
    'Après un son /t/ ou /d/ : « id » (wanted, needed).',
    'Après un son sourd (p, k, f, s, sh, ch) : « t » (worked, laughed).',
    'Après les autres sons : « d » (played, lived).']],
];

const formsOf = (v) => spokenText([v.en, v.past, v.pastParticiple].join(', '));

export function renderVerbs(root, ctx) {
  let tab = 'essential';
  let openId = null;
  const verbs = ctx.content.verbs;
  const nav = h('div', { class: 'tabs', role: 'group', 'aria-label': 'Sections' });
  const body = h('div');
  const screen = h('div', { class: 'm-verbs' }, nav, body);
  root.append(topbar('Verbes'), screen);
  show();

  function show() {
    nav.replaceChildren(...TABS.map(([id, name]) =>
      h('button', { class: `chip${tab === id ? ' on' : ''}`, 'aria-pressed': tab === id, onclick: () => { tab = id; openId = null; show(); } }, name)));
    body.replaceChildren();
    ({ essential, groups, regular, action, practice })[tab]();
  }

  function row(v) {
    const open = openId === v.id;
    const forms = v.type === 'irregular' ? `${v.en} · ${v.past} · ${v.pastParticiple}` : `${v.en} · ${v.past} · ${v.ing}`;
    const btn = h('button', { class: 'vrow', 'aria-expanded': open, onclick: () => { openId = open ? null : v.id; show(); } },
      h('span', null, h('b', null, v.en), ' ', h('span', { class: 'muted' }, v.fr), h('div', { class: 'forms' }, forms)),
      h('span', { class: 'tag' }, v.level));
    return h('div', null, btn, open ? h('div', { class: 'vpanel' }, wordSheet(ctx, v), h('div', { style: 'margin-top:14px' }, addToCardsBtn(ctx, v))) : null);
  }

  function essential() {
    const list = verbs.filter((v) => v.essential);
    body.append(h('p', { class: 'muted' }, `Les ${list.length} verbes à connaître en premier. Touche un verbe pour ouvrir sa fiche.`), ...list.map(row));
  }

  function groups() {
    const irregular = verbs.filter((v) => v.type === 'irregular');
    body.append(h('p', { class: 'muted' }, 'Les verbes irréguliers sont plus faciles à retenir par familles.'));
    for (const [id, title, sample] of GROUPS) {
      const list = irregular.filter((v) => groupIrregular(v) === id);
      if (!list.length) continue;
      body.append(h('div', { class: 'group-title' }, `${title} (${list.length})`, h('small', null, `ex. ${sample}`)), ...list.map(row));
    }
  }

  function regular() {
    body.append(
      h('p', { class: 'muted' }, 'Les verbes réguliers suivent toujours les mêmes règles.'),
      ...RULES.map(([t, lines]) => h('div', { class: 'card rule-card' }, h('h3', null, t), h('ul', { class: 'bullets' }, lines.map((l) => h('li', null, l))))),
      h('div', { class: 'group-title' }, 'Quelques verbes réguliers'),
      ...verbs.filter((v) => v.type === 'regular').slice(0, 12).map(row));
  }

  function action() {
    const list = verbs.filter((v) => v.topic === 'action');
    body.append(h('p', { class: 'muted' }, 'Des verbes qui décrivent un mouvement ou une activité.'), ...list.map(row));
  }

  function practice() {
    const fields = [['past', 'le prétérit'], ['pastParticiple', 'le participe passé']];
    const irregular = verbs.filter((v) => v.type === 'irregular');
    const pool = shuffled(irregular).slice(0, 10);
    let idx = 0;
    let score = 0;
    const area = h('div');
    body.append(area);
    ask();

    function ask() {
      if (idx >= pool.length) return summary();
      const v = pool[idx];
      const [field, name] = fields[idx % 2];
      idx++;
      const wrong = [];
      for (const o of shuffled(irregular)) {
        if (o.id !== v.id && o[field] !== v[field] && !wrong.includes(o[field])) wrong.push(o[field]);
        if (wrong.length === 3) break;
      }
      const choices = shuffled([v[field], ...wrong]);
      const fb = h('div');
      const btns = choices.map((c) => h('button', { class: 'choice', onclick: () => {
        const ok = c === v[field];
        btns.forEach((b) => { b.disabled = true; b.classList.toggle('right', b.textContent === v[field]); });
        if (!ok) btns.find((b) => b.textContent === c).classList.add('wrong');
        else { score++; ctx.update((s) => touchStreak(addXp(s, 5, today()), today())); }
        fb.replaceChildren(
          h('div', { class: `feedback ${ok ? 'ok' : 'ko'}`, role: 'status' }, ok ? '✓ Correct !' : `✗ ${v.en} – ${v.past} – ${v.pastParticiple}`),
          h('div', { class: 'row' }, speakBtn(ctx, `${v.id}:forms`, formsOf(v), 'en-US', 'Écouter les trois formes', false),
            h('button', { class: 'btn', onclick: ask }, idx >= pool.length ? 'Voir mon score' : 'Verbe suivant')));
      } }, c));
      area.replaceChildren(
        progressBar(((idx - 1) / pool.length) * 100, 'Entraînement'),
        h('div', { class: 'card', style: 'margin-top:14px' },
          h('p', { class: 'muted small' }, `Question ${idx} / ${pool.length}`),
          h('h2', null, `Donne ${name} de « ${v.en} »`),
          h('p', { class: 'muted' }, v.fr),
          h('div', { class: 'choices' }, btns), fb));
    }

    function summary() {
      area.replaceChildren(h('div', { class: 'card empty stack' },
        h('div', { class: 'emoji', 'aria-hidden': 'true' }, score >= 8 ? '🏆' : '👏'),
        h('h2', null, `${score} / ${pool.length}`),
        h('p', { class: 'muted' }, `+${score * 5} points.`),
        h('div', { class: 'row', style: 'justify-content:center' },
          h('button', { class: 'btn', onclick: () => { show(); } }, 'Recommencer'),
          h('button', { class: 'btn secondary', onclick: () => { tab = 'groups'; show(); } }, 'Revoir les groupes'))));
    }
  }

  return () => ctx.audio.stop();
}
